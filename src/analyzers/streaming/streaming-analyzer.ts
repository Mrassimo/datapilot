/**
 * Streaming Data Analysis Engine
 * Memory-efficient analysis using online algorithms and chunk processing
 */

import { createReadStream } from 'fs';
import { Transform } from 'stream';
import { pipeline } from 'stream/promises';
import { logger } from '../../utils/logger';
import { CSVParser } from '../../parsers/csv-parser';
import type { ParsedRow } from '../../parsers/types';
import {
  StreamingNumericalAnalyzer,
  StreamingCategoricalAnalyzer,
  StreamingDateTimeAnalyzer,
  StreamingBooleanAnalyzer,
  StreamingTextAnalyzer,
  type StreamingColumnAnalyzer
} from './streaming-univariate-analyzer';
import { StreamingBivariateAnalyzer, type ColumnPair } from './streaming-bivariate-analyzer';
import { EnhancedTypeDetector } from './enhanced-type-detector';
import type {
  Section3Result,
  Section3EdaAnalysis,
  Section3Config,
  Section3Progress,
  Section3Warning,
  EdaInsights,
  ColumnAnalysis,
} from '../eda/types';
import { EdaDataType, SemanticType } from '../eda/types';

interface StreamingConfig extends Section3Config {
  chunkSize: number;
  memoryThresholdMB: number;
  maxRowsAnalyzed: number;
  adaptiveChunkSizing: boolean;
}

interface StreamingState {
  rowsProcessed: number;
  chunksProcessed: number;
  currentMemoryMB: number;
  peakMemoryMB: number;
  startTime: number;
  currentChunkSize: number;
  hasSkippedHeader: boolean;
}

/**
 * Main Streaming Analysis Engine
 * Processes any size dataset with constant memory usage
 */
export class StreamingAnalyzer {
  private config: StreamingConfig;
  private state: StreamingState;
  private progressCallback?: (progress: Section3Progress) => void;
  
  // Analyzers
  private columnAnalyzers = new Map<string, StreamingColumnAnalyzer>();
  private bivariateAnalyzer: StreamingBivariateAnalyzer;
  
  // Metadata
  private headers: string[] = [];
  private detectedTypes: EdaDataType[] = [];
  private semanticTypes: SemanticType[] = [];
  private warnings: Section3Warning[] = [];
  private typeDetectionResults: any[] = []; // Store enhanced detection results (limited)
  private hasHeaders: boolean = false; // Track if CSV has headers

  constructor(config: Partial<StreamingConfig> = {}) {
    this.config = {
      // Default streaming config
      chunkSize: 500, // Reduced from 1000
      memoryThresholdMB: 100, // Reduced from 200
      maxRowsAnalyzed: 500000, // Reduced from 1000000
      adaptiveChunkSizing: true,
      
      // Default Section3Config
      enabledAnalyses: ['univariate', 'bivariate', 'correlations'],
      significanceLevel: 0.05,
      maxCorrelationPairs: 50,
      outlierMethods: ['iqr', 'zscore', 'modified_zscore'],
      normalityTests: ['shapiro', 'jarque_bera', 'ks_test'],
      maxCategoricalLevels: 50,
      enableMultivariate: false,
      samplingThreshold: 10000,
      
      ...config,
    };

    this.state = {
      rowsProcessed: 0,
      chunksProcessed: 0,
      currentMemoryMB: 0,
      peakMemoryMB: 0,
      startTime: 0,
      currentChunkSize: this.config.chunkSize,
      hasSkippedHeader: false,
    };

    this.bivariateAnalyzer = new StreamingBivariateAnalyzer(this.config.maxCorrelationPairs);
  }

  setProgressCallback(callback: (progress: Section3Progress) => void): void {
    this.progressCallback = callback;
  }

  /**
   * Analyze a CSV file using streaming processing
   */
  async analyzeFile(filePath: string): Promise<Section3Result> {
    logger.info('Starting streaming analysis of file:', filePath);
    this.state.startTime = Date.now();

    try {
      // Phase 1: Initialize parsers and detect format
      this.reportProgress('initialization', 0, 'Initializing streaming analysis...');
      
      const parser = new CSVParser({
        maxRows: this.config.maxRowsAnalyzed,
        autoDetect: true,
      });

      // Phase 2: First pass - data type detection and initialization
      await this.firstPass(parser, filePath);
      
      // Phase 3: Main streaming analysis
      await this.streamingPass(parser, filePath);
      
      // Phase 4: Finalize results
      return this.finalizeResults();
      
    } catch (error) {
      logger.error('Streaming analysis failed:', error);
      throw error;
    }
  }

  /**
   * First pass: Quick scan for headers, types, and basic metadata
   */
  private async firstPass(parser: CSVParser, filePath: string): Promise<void> {
    this.reportProgress('initialization', 25, 'Detecting data types...');
    
    let sampleRowCount = 0;
    const maxSampleRows = 1000;
    const sampleData: ParsedRow[] = [];

    const sampleStream = new Transform({
      objectMode: true,
      transform(chunk: ParsedRow, _encoding, callback) {
        if (sampleRowCount < maxSampleRows) {
          sampleData.push(chunk);
          sampleRowCount++;
        }
        callback();
      }
    });

    const readStream = createReadStream(filePath);
    const parseStream = parser.createStream();

    await pipeline(readStream, parseStream, sampleStream);

    if (sampleData.length === 0) {
      throw new Error('No data found in file');
    }

    // Extract headers from parser config and sample data
    this.headers = this.extractHeaders(sampleData, parser);
    
    // Store whether CSV has headers for later use in data processing
    const parserOptions = parser.getOptions();
    this.hasHeaders = parserOptions.hasHeader ?? true;
    
    // Detect column types from sample
    this.detectedTypes = this.detectColumnTypes(sampleData);
    
    // Infer semantic types
    this.semanticTypes = this.inferSemanticTypes();
    
    // Initialize column analyzers
    this.initializeColumnAnalyzers();
    
    // Initialize bivariate analysis
    this.initializeBivariateAnalysis();
    
    this.reportProgress('initialization', 100, 'Initialization complete');
  }

  /**
   * Main streaming pass: Process data in chunks
   */
  private async streamingPass(parser: CSVParser, filePath: string): Promise<void> {
    this.reportProgress('univariate', 0, 'Starting streaming analysis...');
    
    let currentChunk: ParsedRow[] = [];
    
    const chunkProcessor = new Transform({
      objectMode: true,
      transform: (row: ParsedRow, _encoding, callback) => {
        try {
          currentChunk.push(row);
          
          // Process chunk when it reaches target size
          if (currentChunk.length >= this.state.currentChunkSize) {
            this.processChunk(currentChunk);
            currentChunk = [];
            
            // Adaptive memory management
            this.manageMemory();
            
            // Check if we've hit row limit
            if (this.state.rowsProcessed >= this.config.maxRowsAnalyzed) {
              this.warnings.push({
                category: 'performance',
                severity: 'medium',
                message: `Analysis stopped at ${this.config.maxRowsAnalyzed} rows to prevent memory issues`,
                impact: 'Results based on subset of data',
                suggestion: 'Increase maxRowsAnalyzed if more memory is available',
              });
              return callback();
            }
          }
          
          callback();
        } catch (error) {
          callback(error instanceof Error ? error : new Error(String(error)));
        }
      },
      
      flush: (callback) => {
        // Process final partial chunk
        if (currentChunk.length > 0) {
          this.processChunk(currentChunk);
        }
        callback();
      }
    });

    const readStream = createReadStream(filePath);
    const parseStream = parser.createStream();

    await pipeline(readStream, parseStream, chunkProcessor);
    
    this.reportProgress('univariate', 100, 'Streaming analysis complete');
  }

  /**
   * Process a single chunk of data
   */
  private processChunk(chunk: ParsedRow[]): void {
    this.state.chunksProcessed++;
    
    for (const row of chunk) {
      // Skip header row if this is the first row and CSV has headers
      if (this.hasHeaders && !this.state.hasSkippedHeader && row.index === 0) {
        this.state.hasSkippedHeader = true;
        continue; // Skip processing the header row as data
      }
      
      this.state.rowsProcessed++;
      
      // Process each column for univariate analysis
      for (let colIndex = 0; colIndex < this.headers.length; colIndex++) {
        const columnName = this.headers[colIndex];
        const analyzer = this.columnAnalyzers.get(columnName);
        
        if (analyzer && row.data[colIndex] !== undefined) {
          analyzer.processValue(row.data[colIndex]);
        }
      }
      
      // Process for bivariate analysis
      this.bivariateAnalyzer.processRow(row.data, this.detectedTypes);
    }
    
    // Clear chunk from memory immediately
    chunk.length = 0;
    
    // Update progress periodically
    if (this.state.chunksProcessed % 10 === 0) {
      const progress = Math.min(90, (this.state.rowsProcessed / this.config.maxRowsAnalyzed) * 90);
      this.reportProgress('univariate', progress, 
        `Processed ${this.state.rowsProcessed.toLocaleString()} rows in ${this.state.chunksProcessed} chunks`);
    }
    
    // Aggressive memory cleanup every 20 chunks
    if (this.state.chunksProcessed % 20 === 0) {
      this.performMemoryCleanup();
    }
  }

  /**
   * Perform aggressive memory cleanup
   */
  private performMemoryCleanup(): void {
    // Clear type detection results after initial setup
    if (this.state.chunksProcessed > 10) {
      this.typeDetectionResults = [];
    }
    
    // Clear memory from all column analyzers
    for (const analyzer of this.columnAnalyzers.values()) {
      if (analyzer.clearMemory) {
        analyzer.clearMemory();
      }
    }
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
  }

  /**
   * Adaptive memory management with aggressive cleanup
   */
  private manageMemory(): void {
    const memUsage = process.memoryUsage();
    this.state.currentMemoryMB = Math.round(memUsage.heapUsed / (1024 * 1024));
    this.state.peakMemoryMB = Math.max(this.state.peakMemoryMB, this.state.currentMemoryMB);
    
    if (this.config.adaptiveChunkSizing) {
      if (this.state.currentMemoryMB > this.config.memoryThresholdMB) {
        // Reduce chunk size to use less memory
        this.state.currentChunkSize = Math.max(50, Math.floor(this.state.currentChunkSize * 0.6)); // More aggressive reduction
        
        // Clear type detection results to free memory
        this.typeDetectionResults = [];
        
        // Force garbage collection if available
        if (global.gc) {
          global.gc();
        }
        
      } else if (this.state.currentMemoryMB < this.config.memoryThresholdMB * 0.3) {
        // Increase chunk size for better performance (less aggressive)
        this.state.currentChunkSize = Math.min(2000, Math.floor(this.state.currentChunkSize * 1.1)); // Reduced max
      }
    }

    // Emergency brake if memory gets too high
    if (this.state.currentMemoryMB > this.config.memoryThresholdMB * 1.5) { // Lower threshold
      this.warnings.push({
        category: 'performance',
        severity: 'high',
        message: `High memory usage detected (${this.state.currentMemoryMB}MB). Consider reducing maxRowsAnalyzed.`,
        impact: 'Analysis may slow down or fail',
        suggestion: 'Reduce dataset size or increase available memory',
      });
      
      // Aggressive memory cleanup
      this.typeDetectionResults = [];
      if (global.gc) {
        global.gc();
      }
    }
  }

  /**
   * Finalize analysis and generate results
   */
  private finalizeResults(): Section3Result {
    this.reportProgress('finalization', 0, 'Finalizing results...');
    
    // Collect univariate results
    const univariateAnalysis: ColumnAnalysis[] = [];
    for (const [columnName, analyzer] of this.columnAnalyzers) {
      try {
        const result = analyzer.finalize();
        univariateAnalysis.push(result);
        this.warnings.push(...analyzer.getWarnings());
      } catch (error) {
        logger.error(`Error finalizing analysis for column ${columnName}:`, error);
        this.warnings.push({
          category: 'error',
          severity: 'high',
          message: `Failed to complete analysis for column ${columnName}`,
          impact: 'Column excluded from results',
          suggestion: 'Check data quality or column type detection',
        });
      }
    }

    // Collect bivariate results
    const bivariateAnalysis = this.bivariateAnalyzer.finalize(this.headers);
    this.warnings.push(...this.bivariateAnalyzer.getWarnings());

    // Generate insights
    const insights = this.generateStreamingInsights(univariateAnalysis);

    const endTime = Date.now();
    const analysisTime = endTime - this.state.startTime;

    const edaAnalysis: Section3EdaAnalysis = {
      univariateAnalysis,
      bivariateAnalysis,
      multivariateAnalysis: {
        principalComponents: [],
        clusteringInsights: [],
        dimensionalityRecommendations: '',
        featureImportanceHints: [],
      },
      crossVariableInsights: insights,
    };

    this.reportProgress('finalization', 100, 'Analysis complete');

    return {
      edaAnalysis,
      warnings: this.warnings,
      performanceMetrics: {
        analysisTimeMs: analysisTime,
        rowsAnalyzed: this.state.rowsProcessed,
        chunksProcessed: this.state.chunksProcessed,
        peakMemoryMB: this.state.peakMemoryMB,
        avgChunkSize: Math.round(this.state.rowsProcessed / this.state.chunksProcessed),
        memoryEfficiency: `Constant ~${this.state.peakMemoryMB}MB usage`,
      },
      metadata: {
        analysisApproach: 'Streaming with online algorithms',
        datasetSize: this.state.rowsProcessed,
        columnsAnalyzed: this.headers.length,
        samplingApplied: this.state.rowsProcessed >= this.config.maxRowsAnalyzed,
      },
    };
  }

  private extractHeaders(sampleData: ParsedRow[], parser: CSVParser): string[] {
    if (sampleData.length === 0) return [];
    
    const firstRow = sampleData[0];
    
    // Get header setting from parser options
    const parserOptions = parser.getOptions();
    const hasHeader = parserOptions.hasHeader ?? true; // Default to true for CSV files
    
    if (hasHeader) {
      // Use actual column names from header row
      return firstRow.data.map((headerValue, index) => 
        headerValue && headerValue.trim() ? headerValue.trim() : `Column_${index + 1}`
      );
    } else {
      // Generate generic column names only if no headers
      return firstRow.data.map((_, index) => `Column_${index + 1}`);
    }
  }

  private detectColumnTypes(sampleData: ParsedRow[]): EdaDataType[] {
    if (sampleData.length === 0) return [];
    
    const columnCount = sampleData[0].data.length;
    
    // Skip header row if present when sampling for type detection
    const dataStartIndex = this.hasHeaders ? 1 : 0;
    const effectiveSampleData = sampleData.slice(dataStartIndex);
    
    // Prepare column samples for enhanced detection
    const columnSamples = [];
    for (let colIndex = 0; colIndex < columnCount; colIndex++) {
      const values = effectiveSampleData.slice(0, 500).map(row => row.data[colIndex]); // Use more samples, excluding header
      const columnName = this.headers[colIndex] || `Column_${colIndex + 1}`;
      
      columnSamples.push({
        values,
        columnName,
        columnIndex: colIndex,
      });
    }
    
    // Use enhanced type detection
    const detectionResults = EnhancedTypeDetector.detectColumnTypes(columnSamples);
    
    // Store detection results for semantic type inference (clear after use to save memory)
    this.typeDetectionResults = detectionResults;
    
    // Log detection results for debugging
    for (let i = 0; i < detectionResults.length; i++) {
      const result = detectionResults[i];
      if (result.confidence > 0.7) {
        logger.info(`Column ${this.headers[i]}: ${result.dataType} (${result.semanticType}) - Confidence: ${result.confidence.toFixed(2)}`);
      }
    }
    
    return detectionResults.map(result => result.dataType);
  }

  private inferSemanticTypes(): SemanticType[] {
    // Use enhanced detection results if available
    if (this.typeDetectionResults && this.typeDetectionResults.length > 0) {
      return this.typeDetectionResults.map(result => result.semanticType);
    }
    
    // Fallback to simple inference
    return this.headers.map((header, index) => {
      const headerLower = header.toLowerCase();
      const type = this.detectedTypes[index];
      
      // Simple semantic type inference
      if (headerLower.includes('price') || headerLower.includes('cost') || headerLower.includes('amount')) {
        return SemanticType.CURRENCY;
      } else if (headerLower.includes('age')) {
        return SemanticType.AGE;
      } else if (headerLower.includes('id') || headerLower.includes('identifier')) {
        return SemanticType.IDENTIFIER;
      } else if (type === EdaDataType.CATEGORICAL) {
        return SemanticType.CATEGORY;
      }
      
      return SemanticType.UNKNOWN;
    });
  }

  private initializeColumnAnalyzers(): void {
    for (let i = 0; i < this.headers.length; i++) {
      const columnName = this.headers[i];
      const columnType = this.detectedTypes[i];
      const semanticType = this.semanticTypes[i];
      
      let analyzer: StreamingColumnAnalyzer;
      
      // Select appropriate analyzer based on detected column type
      switch (columnType) {
        case EdaDataType.NUMERICAL_FLOAT:
        case EdaDataType.NUMERICAL_INTEGER:
          analyzer = new StreamingNumericalAnalyzer(columnName, columnType, semanticType);
          break;
          
        case EdaDataType.DATE_TIME:
          analyzer = new StreamingDateTimeAnalyzer(columnName, columnType, semanticType);
          break;
          
        case EdaDataType.BOOLEAN:
          analyzer = new StreamingBooleanAnalyzer(columnName, columnType, semanticType);
          break;
          
        case EdaDataType.TEXT_GENERAL:
        case EdaDataType.TEXT_ADDRESS:
          analyzer = new StreamingTextAnalyzer(columnName, columnType, semanticType);
          break;
          
        case EdaDataType.CATEGORICAL:
        default:
          analyzer = new StreamingCategoricalAnalyzer(columnName, columnType, semanticType);
          break;
      }
      
      this.columnAnalyzers.set(columnName, analyzer);
    }
  }

  private initializeBivariateAnalysis(): void {
    const pairs: ColumnPair[] = [];
    
    for (let i = 0; i < this.headers.length; i++) {
      for (let j = i + 1; j < this.headers.length; j++) {
        pairs.push({
          col1Index: i,
          col1Name: this.headers[i],
          col1Type: this.detectedTypes[i],
          col2Index: j,
          col2Name: this.headers[j],
          col2Type: this.detectedTypes[j],
        });
      }
    }
    
    this.bivariateAnalyzer.initializePairs(pairs);
  }

  private generateStreamingInsights(
    univariateAnalysis: ColumnAnalysis[]
  ): EdaInsights {
    const topFindings: string[] = [];
    const dataQualityIssues: string[] = [];
    const hypothesesGenerated: string[] = [];
    const preprocessingRecommendations: string[] = [];

    // Analyze data quality
    const poorQualityColumns = univariateAnalysis.filter(col => 
      col.missingPercentage > 20
    );
    
    if (poorQualityColumns.length > 0) {
      dataQualityIssues.push(
        `${poorQualityColumns.length} columns have >20% missing values: ${poorQualityColumns.map(c => c.columnName).join(', ')}`
      );
    }

    // High cardinality detection
    const highCardinalityColumns = univariateAnalysis.filter(col => 
      col.uniquePercentage > 80 && col.totalValues > 100
    );
    
    if (highCardinalityColumns.length > 0) {
      preprocessingRecommendations.push(
        `Consider encoding or grouping high-cardinality columns: ${highCardinalityColumns.map(c => c.columnName).join(', ')}`
      );
    }

    // Memory efficiency insight
    topFindings.push(
      `Streaming analysis processed ${this.state.rowsProcessed.toLocaleString()} rows using only ${this.state.peakMemoryMB}MB peak memory`
    );

    return {
      topFindings,
      dataQualityIssues,
      hypothesesGenerated,
      preprocessingRecommendations,
    };
  }

  private reportProgress(stage: string, percentage: number, message: string): void {
    if (this.progressCallback) {
      this.progressCallback({
        stage: stage as any,
        percentage,
        message,
        currentStep: this.state.chunksProcessed,
        totalSteps: Math.ceil(this.config.maxRowsAnalyzed / this.state.currentChunkSize),
      });
    }
  }
}

/**
 * Convenience function to analyze a file using streaming approach
 */
export async function analyzeFileStreaming(
  filePath: string,
  config: Partial<StreamingConfig> = {}
): Promise<Section3Result> {
  const analyzer = new StreamingAnalyzer(config);
  return analyzer.analyzeFile(filePath);
}