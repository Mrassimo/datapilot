/**
 * Streaming Data Analysis Engine
 * Memory-efficient analysis using online algorithms and chunk processing
 */

import { createReadStream } from 'fs';
import { promises as fs } from 'fs';
import { Transform } from 'stream';
import { pipeline } from 'stream/promises';
import type { LogContext } from '../../utils/logger';
import { logger } from '../../utils/logger';
import { CSVParser } from '../../parsers/csv-parser';
import type { ParsedRow } from '../../parsers/types';
import { getConfig } from '../../core/config';
import { DataPilotError, ErrorSeverity } from '../../core/types';
import {
  getGlobalMemoryOptimizer,
  withMemoryOptimization,
} from '../../performance/memory-optimizer';
import { getGlobalAdaptiveStreamer } from '../../performance/adaptive-streamer';
import {
  StreamingNumericalAnalyzer,
  StreamingCategoricalAnalyzer,
  StreamingDateTimeAnalyzer,
  StreamingBooleanAnalyzer,
  StreamingTextAnalyzer,
  type StreamingColumnAnalyzer,
} from './streaming-univariate-analyzer';
import { StreamingBivariateAnalyzer, type ColumnPair } from './streaming-bivariate-analyzer';
import { MultivariateOrchestrator } from '../multivariate/multivariate-orchestrator';
import { EnhancedTypeDetector, type TypeDetectionResult } from './enhanced-type-detector';
import { SmartSampler, type SamplingResult, type SamplingStrategy } from './smart-sampler';
import type { CLIOptions } from '../../cli/types';
import type {
  Section3Result,
  Section3EdaAnalysis,
  Section3Config,
  Section3Progress,
  Section3Warning,
  EdaInsights,
  ColumnAnalysis,
  MultivariateAnalysis,
} from '../eda/types';
import { EdaDataType, SemanticType } from '../eda/types';

interface StreamingAnalyzerConfig extends Section3Config {
  chunkSize: number;
  memoryThresholdMB: number;
  maxRowsAnalyzed: number;
  adaptiveChunkSizing: boolean;
  enableMemoryOptimization: boolean;
  enableAdaptiveStreaming: boolean;
  enableParallelProcessing: boolean;
  // Smart sampling options (optional - injected from CLI)
  samplingOptions?: Pick<CLIOptions, 'autoSample' | 'samplePercentage' | 'sampleRows' | 'sampleSizeBytes' | 'sampleMethod' | 'stratifyBy' | 'seed'>;
}

interface StreamingState {
  rowsProcessed: number;
  chunksProcessed: number;
  currentMemoryMB: number;
  peakMemoryMB: number;
  startTime: number;
  currentChunkSize: number;
  hasSkippedHeader: boolean;
  // Smart sampling state
  samplingEnabled: boolean;
  samplingResult?: SamplingResult;
}

/**
 * Main Streaming Analysis Engine
 * Processes any size dataset with constant memory usage
 */
export class StreamingAnalyzer {
  private config: StreamingAnalyzerConfig;
  private state: StreamingState;
  private progressCallback?: (progress: Section3Progress) => void;

  // Analyzers
  private columnAnalyzers = new Map<string, StreamingColumnAnalyzer>();
  private bivariateAnalyzer: StreamingBivariateAnalyzer;

  // Smart sampling
  private smartSampler?: SmartSampler;

  // Metadata
  private headers: string[] = [];
  private detectedTypes: EdaDataType[] = [];
  private semanticTypes: SemanticType[] = [];
  private warnings: Section3Warning[] = [];
  private typeDetectionResults: TypeDetectionResult[] = []; // Store enhanced detection results (limited)
  private hasHeaders: boolean = false; // Track if CSV has headers

  // Data collection for multivariate analysis (when enabled)
  private collectedData: (string | number | null | undefined)[][] = [];
  private maxCollectedRows: number;

  /**
   * Create a StreamingAnalyzer with smart sampling options from CLI
   */
  static withSamplingOptions(
    config: Partial<StreamingAnalyzerConfig> = {},
    samplingOptions?: Pick<CLIOptions, 'autoSample' | 'samplePercentage' | 'sampleRows' | 'sampleSizeBytes' | 'sampleMethod' | 'stratifyBy' | 'seed'>,
  ): StreamingAnalyzer {
    return new StreamingAnalyzer({
      ...config,
      samplingOptions,
    });
  }

  constructor(config: Partial<StreamingAnalyzerConfig> = {}) {
    const configManager = getConfig();
    const streamingConfig = configManager.getStreamingConfig();
    const analysisConfig = configManager.getAnalysisConfig();
    const statisticalConfig = configManager.getStatisticalConfig();

    this.config = {
      // Default streaming config from configuration manager
      chunkSize: streamingConfig.adaptiveChunkSizing.minChunkSize,
      memoryThresholdMB: streamingConfig.memoryThresholdMB,
      maxRowsAnalyzed: streamingConfig.maxRowsAnalyzed,
      adaptiveChunkSizing: streamingConfig.adaptiveChunkSizing.enabled,
      enableMemoryOptimization: true,
      enableAdaptiveStreaming: true,
      enableParallelProcessing: false, // Keep sequential for base analyzer

      // Default Section3Config from configuration manager
      enabledAnalyses: analysisConfig.enabledAnalyses,
      significanceLevel: statisticalConfig.significanceLevel,
      maxCorrelationPairs: analysisConfig.maxCorrelationPairs,
      outlierMethods: analysisConfig.outlierMethods as ('iqr' | 'zscore' | 'modified_zscore')[],
      normalityTests: analysisConfig.normalityTests as ('shapiro' | 'jarque_bera' | 'ks_test')[],
      maxCategoricalLevels: analysisConfig.maxCategoricalLevels,
      enableMultivariate: analysisConfig.enableMultivariate,
      samplingThreshold: analysisConfig.samplingThreshold,

      ...config,
    };

    // Set maxCollectedRows from configuration
    const perfConfig = configManager.getPerformanceConfig();
    this.maxCollectedRows = perfConfig.maxCollectedRowsMultivariate;

    this.state = {
      rowsProcessed: 0,
      chunksProcessed: 0,
      currentMemoryMB: 0,
      peakMemoryMB: 0,
      startTime: 0,
      currentChunkSize: this.config.chunkSize,
      hasSkippedHeader: false,
      samplingEnabled: false,
    };

    this.bivariateAnalyzer = new StreamingBivariateAnalyzer(this.config.maxCorrelationPairs);

    // Initialize memory optimization if enabled
    if (this.config.enableMemoryOptimization) {
      this.initializeMemoryOptimization();
    }
  }

  setProgressCallback(callback: (progress: Section3Progress) => void): void {
    this.progressCallback = callback;
  }

  /**
   * Initialize smart sampling if conditions are met
   */
  private initializeSmartSampling(filePath: string, fileSize: number): void {
    const samplingOptions = this.config.samplingOptions;
    if (!samplingOptions) return;

    const shouldSample = SmartSampler.shouldEnableSampling(fileSize, samplingOptions);
    if (shouldSample) {
      this.state.samplingEnabled = true;
      
      // Create default options for any missing required fields
      const defaultSamplingOptions = {
        autoSample: false,
        samplePercentage: undefined,
        sampleRows: undefined,
        sampleSizeBytes: undefined,
        sampleMethod: 'random' as const,
        stratifyBy: undefined,
        seed: undefined,
        ...samplingOptions,
      };

      this.smartSampler = new SmartSampler(
        defaultSamplingOptions as Required<typeof defaultSamplingOptions>,
        fileSize,
        {
          section: 'eda',
          analyzer: 'StreamingAnalyzer',
          operation: 'smart-sampling',
          filePath,
        },
      );

      logger.info(
        `Smart sampling enabled for ${this.formatBytes(fileSize)} file`,
        {
          section: 'eda',
          analyzer: 'StreamingAnalyzer',
          operation: 'initializeSmartSampling',
          filePath,
        },
      );
    }
  }

  /**
   * Analyze a CSV file using streaming processing
   */
  async analyzeFile(filePath: string): Promise<Section3Result> {
    // Wrap with memory optimization if enabled
    if (this.config.enableMemoryOptimization) {
      return this.analyzeFileWithMemoryOptimization(filePath);
    }

    return this.analyzeFileInternal(filePath);
  }

  /**
   * Internal file analysis with memory optimization wrapper
   */
  private analyzeFileWithMemoryOptimization: (filePath: string) => Promise<Section3Result>;

  private initializeMemoryOptimization(): void {
    this.analyzeFileWithMemoryOptimization = withMemoryOptimization(
      async (filePath: string): Promise<Section3Result> => {
        return this.analyzeFileInternal(filePath);
      },
      {
        enableGc: true,
        bufferPooling: true,
        memoryThreshold: this.config.memoryThresholdMB / 512, // Convert MB to ratio
      },
    );
  }

  /**
   * Core file analysis implementation
   */
  private async analyzeFileInternal(filePath: string): Promise<Section3Result> {
    const context: LogContext = {
      section: 'eda',
      analyzer: 'StreamingAnalyzer',
      filePath,
      operation: 'analyzeFile',
    };

    logger.info('Starting streaming analysis of file', context);
    this.state.startTime = Date.now();

    // Initialize smart sampling if configured
    try {
      const fileStats = await fs.stat(filePath);
      this.initializeSmartSampling(filePath, fileStats.size);
    } catch (error) {
      logger.warn('Could not determine file size for sampling decisions', context, error);
    }

    // Initialize memory optimizer if enabled
    if (this.config.enableMemoryOptimization) {
      this.initializeMemoryOptimization();

      const memoryOptimizer = getGlobalMemoryOptimizer({
        maxMemoryMB: this.config.memoryThresholdMB,
        enableMemoryPooling: true,
        adaptiveChunkSizing: this.config.adaptiveChunkSizing,
      });

      // Listen for memory pressure events
      memoryOptimizer.on('memory-pressure', (data) => {
        this.handleMemoryPressure(data.pressure);
      });
    }

    try {
      // Enhanced streaming with adaptive processing
      if (this.config.enableAdaptiveStreaming) {
        return await this.analyzeFileWithAdaptiveStreaming(filePath);
      }

      // Traditional streaming analysis
      return await this.analyzeFileTraditional(filePath);
    } catch (error) {
      logger.errorWithStack(error instanceof Error ? error : new Error(String(error)), context);
      throw error;
    }
  }

  /**
   * Traditional streaming analysis (backward compatibility)
   */
  private async analyzeFileTraditional(filePath: string): Promise<Section3Result> {
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
    return await this.finalizeResults();
  }

  /**
   * Enhanced streaming analysis with adaptive chunk sizing
   */
  private async analyzeFileWithAdaptiveStreaming(filePath: string): Promise<Section3Result> {
    const adaptiveStreamer = getGlobalAdaptiveStreamer({
      initialChunkSize: this.config.chunkSize,
      memoryPressureThreshold: this.config.memoryThresholdMB / 512,
    });

    // Phase 1: Initialize
    this.reportProgress('initialization', 0, 'Initializing adaptive streaming analysis...');

    const parser = new CSVParser({
      maxRows: this.config.maxRowsAnalyzed,
      autoDetect: true,
    });

    // Create streaming session
    const sessionId = await adaptiveStreamer.createSession(filePath);

    try {
      // Phase 2: Quick sample for type detection
      await this.firstPass(parser, filePath);

      // Phase 3: Adaptive streaming analysis
      this.reportProgress('univariate', 0, 'Starting adaptive streaming analysis...');

      let processedChunks = 0;
      for await (const result of adaptiveStreamer.streamFile(
        sessionId,
        async (chunk: Buffer, metadata: any) => {
          // Convert buffer to string and parse
          const chunkText = chunk.toString('utf8');
          const rows = await this.parseChunkText(chunkText, parser, metadata.chunkIndex > 0);

          // Process the chunk
          if (rows.length > 0) {
            this.processChunk(rows);
            processedChunks++;

            // Update progress
            const progress = Math.min(95, (metadata.filePosition / metadata.fileSize) * 100);
            this.reportProgress(
              'univariate',
              progress,
              `Processed ${processedChunks} chunks (${this.formatBytes(metadata.filePosition)}/${this.formatBytes(metadata.fileSize)})`,
            );
          }

          return { processed: rows.length, bytes: chunk.length };
        },
      )) {
        // Optional: collect streaming results
      }

      // Phase 4: Finalize
      this.reportProgress('finalization', 95, 'Finalizing analysis...');
      return await this.finalizeResults();
    } finally {
      // Cleanup streaming session
      const sessionStats = adaptiveStreamer.getSessionStats(sessionId);
      if (sessionStats) {
        logger.info(
          `Adaptive streaming completed: ${sessionStats.metrics.processingRate.toFixed(2)} MB/s, ${sessionStats.metrics.adaptationCount} adaptations`,
        );
      }
    }
  }

  /**
   * First pass: Quick scan for headers, types, and basic metadata
   */
  private async firstPass(parser: CSVParser, filePath: string): Promise<void> {
    this.reportProgress('initialization', 25, 'Detecting data types...');

    let sampleData: ParsedRow[];

    if (this.state.samplingEnabled && this.smartSampler) {
      // Use smart sampling for data collection
      sampleData = await this.collectSmartSample(parser, filePath);
    } else {
      // Use traditional fixed sampling
      sampleData = await this.collectFixedSample(parser, filePath);
    }

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
   * Collect sample data using smart sampling
   */
  private async collectSmartSample(parser: CSVParser, filePath: string): Promise<ParsedRow[]> {
    if (!this.smartSampler) {
      throw new Error('Smart sampler not initialized');
    }

    // First, collect all data (or a reasonable subset for very large files)
    const allData: ParsedRow[] = [];
    let rowCount = 0;
    const maxInitialSample = 100000; // Limit initial collection to prevent memory issues

    const dataStream = new Transform({
      objectMode: true,
      transform(chunk: ParsedRow, _encoding, callback) {
        if (rowCount < maxInitialSample) {
          allData.push(chunk);
          rowCount++;
        }
        callback();
      },
    });

    const readStream = createReadStream(filePath);
    const parseStream = parser.createStream();

    await pipeline(readStream, parseStream, dataStream);

    // Get preliminary headers for sampling strategy calculation
    const preliminaryHeaders = this.extractHeaders(allData.slice(0, 10), parser);
    const estimatedRowCount = Math.max(allData.length, rowCount);

    // Calculate sampling strategy
    const strategy = this.smartSampler.calculateSamplingStrategy(estimatedRowCount, preliminaryHeaders);

    // Perform sampling
    const samplingResult = await this.smartSampler.performSampling(allData, strategy, preliminaryHeaders);
    
    // Store sampling result for reporting
    this.state.samplingResult = samplingResult;

    // Add sampling notice to warnings
    this.warnings.push({
      category: 'data',
      severity: 'medium',
      message: 'Smart sampling was applied to this dataset for efficient processing',
      suggestion: samplingResult.warnings.join('; ') || 'Use --seed option for reproducible sampling',
    });

    logger.info(
      `Smart sampling completed: ${samplingResult.sampledRowCount} samples from ${samplingResult.originalRowCount} rows using ${samplingResult.strategy.name} method`,
      {
        section: 'eda',
        analyzer: 'StreamingAnalyzer',
        operation: 'collectSmartSample',
        filePath,
      },
    );

    return samplingResult.samples;
  }

  /**
   * Collect sample data using traditional fixed sampling
   */
  private async collectFixedSample(parser: CSVParser, filePath: string): Promise<ParsedRow[]> {
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
      },
    });

    const readStream = createReadStream(filePath);
    const parseStream = parser.createStream();

    await pipeline(readStream, parseStream, sampleStream);

    return sampleData;
  }

  /**
   * Parse chunk text into rows
   */
  private async parseChunkText(
    chunkText: string,
    parser: CSVParser,
    skipHeader: boolean = false,
  ): Promise<ParsedRow[]> {
    const lines = chunkText.split('\n').filter((line) => line.trim());
    const rows: ParsedRow[] = [];

    const startIndex = skipHeader ? 1 : 0;
    for (let i = startIndex; i < lines.length; i++) {
      try {
        // Simple CSV line parsing - this would need proper implementation
        const fields = lines[i].split(',').map((field) => field.trim());
        const parsedRow: ParsedRow = {
          index: i,
          data: fields,
          raw: lines[i],
        };
        if (parsedRow && parsedRow.data) {
          rows.push(parsedRow);
        }
      } catch (error) {
        // Skip invalid rows
        logger.warn(`Skipped invalid row at line ${i}: ${error.message}`);
      }
    }

    return rows;
  }

  /**
   * Handle memory pressure by adapting chunk size
   */
  private handleMemoryPressure(pressure: number): void {
    if (pressure > 0.8) {
      // Reduce chunk size under memory pressure
      const reductionFactor = Math.max(0.3, 1 - pressure);
      this.state.currentChunkSize = Math.max(
        100, // Minimum chunk size
        Math.floor(this.state.currentChunkSize * reductionFactor),
      );

      logger.warn(
        `Memory pressure detected (${(pressure * 100).toFixed(1)}%), reduced chunk size to ${this.state.currentChunkSize}`,
      );

      this.warnings.push({
        category: 'performance',
        severity: 'medium',
        message: `Reduced chunk size due to memory pressure (${(pressure * 100).toFixed(1)}%)`,
        suggestion: 'Consider reducing maxRowsAnalyzed or increasing available memory',
      });
    }
  }

  /**
   * Format bytes for human readable display
   */
  private formatBytes(bytes: number | undefined): string {
    if (bytes === undefined || bytes === null || isNaN(bytes)) {
      return '0B';
    }
    
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(unitIndex > 0 ? 1 : 0)}${units[unitIndex]}`;
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
                suggestion: 'Increase maxRowsAnalyzed in configuration if more memory is available',
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
      },
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

      // Collect data for multivariate analysis (if enabled and within limit)
      if (this.config.enableMultivariate && this.collectedData.length < this.maxCollectedRows) {
        this.collectedData.push([...row.data]); // Store a copy of the row data
      }
    }

    // Clear chunk from memory immediately
    chunk.length = 0;

    // Update progress periodically based on configuration
    const configManager = getConfig();
    const perfConfig = configManager.getPerformanceConfig();

    if (this.state.chunksProcessed % perfConfig.performanceMonitoringInterval === 0) {
      const progress = Math.min(90, (this.state.rowsProcessed / this.config.maxRowsAnalyzed) * 90);
      this.reportProgress(
        'univariate',
        progress,
        `Processed ${this.state.rowsProcessed.toLocaleString()} rows in ${this.state.chunksProcessed} chunks`,
      );
    }

    // Memory cleanup based on configuration interval
    if (this.state.chunksProcessed % perfConfig.memoryCleanupInterval === 0) {
      this.performMemoryCleanup();
    }
  }

  /**
   * Perform aggressive memory cleanup
   */
  private performMemoryCleanup(): void {
    const configManager = getConfig();
    const perfConfig = configManager.getPerformanceConfig();
    const streamingConfig = configManager.getStreamingConfig();

    // Clear type detection results after initial setup
    if (this.state.chunksProcessed > perfConfig.performanceMonitoringInterval) {
      this.typeDetectionResults = [];
    }

    // Clear memory from all column analyzers
    for (const analyzer of this.columnAnalyzers.values()) {
      if (analyzer.clearMemory) {
        analyzer.clearMemory();
      }
    }

    // If under extreme memory pressure and we have sufficient data for multivariate analysis,
    // limit the collected data to prevent memory issues
    const emergencyThreshold =
      this.config.memoryThresholdMB * streamingConfig.memoryManagement.emergencyThresholdMultiplier;
    const minMultivariateRows = Math.min(1000, perfConfig.maxCollectedRowsMultivariate / 2);

    if (
      this.state.currentMemoryMB > emergencyThreshold &&
      this.collectedData.length > minMultivariateRows
    ) {
      // Keep only the minimum required rows for multivariate analysis
      this.collectedData = this.collectedData.slice(0, minMultivariateRows);
    }

    // Force garbage collection if available and enabled
    if (streamingConfig.memoryManagement.forceGarbageCollection && global.gc) {
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

    const configManager = getConfig();
    const streamingConfig = configManager.getStreamingConfig();

    if (this.config.adaptiveChunkSizing) {
      if (this.state.currentMemoryMB > this.config.memoryThresholdMB) {
        // Reduce chunk size to use less memory based on configuration
        this.state.currentChunkSize = Math.max(
          streamingConfig.adaptiveChunkSizing.minChunkSize,
          Math.floor(
            this.state.currentChunkSize * streamingConfig.adaptiveChunkSizing.reductionFactor,
          ),
        );

        // Clear type detection results to free memory
        this.typeDetectionResults = [];

        // Force garbage collection if available and enabled
        if (streamingConfig.memoryManagement.forceGarbageCollection && global.gc) {
          global.gc();
        }
      } else if (this.state.currentMemoryMB < this.config.memoryThresholdMB * 0.3) {
        // Increase chunk size for better performance
        this.state.currentChunkSize = Math.min(
          streamingConfig.adaptiveChunkSizing.maxChunkSize,
          Math.floor(
            this.state.currentChunkSize * streamingConfig.adaptiveChunkSizing.expansionFactor,
          ),
        );
      }
    }

    // Emergency brake if memory gets too high
    const emergencyThreshold =
      this.config.memoryThresholdMB * streamingConfig.memoryManagement.emergencyThresholdMultiplier;
    if (this.state.currentMemoryMB > emergencyThreshold) {
      this.warnings.push({
        category: 'performance',
        severity: 'high',
        message: `High memory usage detected (${this.state.currentMemoryMB}MB). Consider reducing maxRowsAnalyzed in configuration.`,
        impact: 'Analysis may slow down or fail',
        suggestion:
          'Reduce dataset size, increase available memory, or adjust memory thresholds in configuration',
      });

      // Aggressive memory cleanup
      this.typeDetectionResults = [];
      if (streamingConfig.memoryManagement.forceGarbageCollection && global.gc) {
        global.gc();
      }
    }
  }

  /**
   * Finalize analysis and generate results
   */
  private async finalizeResults(): Promise<Section3Result> {
    this.reportProgress('finalization', 0, 'Finalizing results...');

    // Collect univariate results
    const univariateAnalysis: ColumnAnalysis[] = [];
    for (const [columnName, analyzer] of this.columnAnalyzers) {
      try {
        const result = analyzer.finalize();
        univariateAnalysis.push(result);
        this.warnings.push(...analyzer.getWarnings());
      } catch (error) {
        logger.error(
          `Error finalizing analysis for column ${columnName}:`,
          {
            section: 'eda',
            analyzer: 'StreamingAnalyzer',
            operation: 'finalizeColumnAnalysis',
          },
          error,
        );
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

    // Perform multivariate analysis if enabled and applicable
    let multivariateAnalysis;
    if (this.config.enableMultivariate && this.state.rowsProcessed > 50) {
      this.reportProgress('multivariate', 90, 'Performing multivariate analysis...');
      try {
        multivariateAnalysis = await MultivariateOrchestrator.analyze(
          this.collectedData || [],
          this.headers,
          this.detectedTypes,
          this.state.rowsProcessed,
        );
        logger.info('Multivariate analysis completed successfully');
      } catch (error) {
        logger.warn(
          'Multivariate analysis failed:',
          {
            section: 'eda',
            analyzer: 'StreamingAnalyzer',
            operation: 'multivariateAnalysis',
          },
          error,
        );
        // Fallback to minimal analysis
        multivariateAnalysis = await MultivariateOrchestrator.analyze([], [], [], 0);
      }
    } else {
      // Create minimal multivariate analysis when disabled or insufficient data
      multivariateAnalysis = await MultivariateOrchestrator.analyze([], [], [], 0);
    }

    const edaAnalysis: Section3EdaAnalysis = {
      univariateAnalysis,
      bivariateAnalysis,
      multivariateAnalysis,
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
        analysisApproach: this.state.samplingEnabled 
          ? 'Streaming with smart sampling and online algorithms' 
          : 'Streaming with online algorithms',
        datasetSize: this.state.rowsProcessed,
        columnsAnalyzed: this.headers.length,
        samplingApplied: this.state.samplingEnabled || this.state.rowsProcessed >= this.config.maxRowsAnalyzed,
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
        headerValue && headerValue.trim() ? headerValue.trim() : `Column_${index + 1}`,
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
      const values = effectiveSampleData.slice(0, 500).map((row) => row.data[colIndex]); // Use more samples, excluding header
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
        logger.info(
          `Column ${this.headers[i]}: ${result.dataType} (${result.semanticType}) - Confidence: ${result.confidence.toFixed(2)}`,
        );
      }
    }

    return detectionResults.map((result) => result.dataType);
  }

  private inferSemanticTypes(): SemanticType[] {
    // Use enhanced detection results if available
    if (this.typeDetectionResults && this.typeDetectionResults.length > 0) {
      return this.typeDetectionResults.map((result) => result.semanticType);
    }

    // Fallback to simple inference
    return this.headers.map((header, index) => {
      const headerLower = header.toLowerCase();
      const type = this.detectedTypes[index];

      // Simple semantic type inference
      if (
        headerLower.includes('price') ||
        headerLower.includes('cost') ||
        headerLower.includes('amount')
      ) {
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

  private generateStreamingInsights(univariateAnalysis: ColumnAnalysis[]): EdaInsights {
    const topFindings: string[] = [];
    const dataQualityIssues: string[] = [];
    const hypothesesGenerated: string[] = [];
    const preprocessingRecommendations: string[] = [];

    // Analyze data quality
    const poorQualityColumns = univariateAnalysis.filter((col) => col.missingPercentage > 20);

    if (poorQualityColumns.length > 0) {
      dataQualityIssues.push(
        `${poorQualityColumns.length} columns have >20% missing values: ${poorQualityColumns.map((c) => c.columnName).join(', ')}`,
      );
    }

    // High cardinality detection
    const highCardinalityColumns = univariateAnalysis.filter(
      (col) => col.uniquePercentage > 80 && col.totalValues > 100,
    );

    if (highCardinalityColumns.length > 0) {
      preprocessingRecommendations.push(
        `Consider encoding or grouping high-cardinality columns: ${highCardinalityColumns.map((c) => c.columnName).join(', ')}`,
      );
    }

    // Memory efficiency insight
    topFindings.push(
      `Streaming analysis processed ${this.state.rowsProcessed.toLocaleString()} rows using only ${this.state.peakMemoryMB}MB peak memory`,
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

  /**
   * Handle analysis errors with graceful degradation
   */
  private async handleAnalysisError(
    error: unknown,
    logContext: LogContext,
  ): Promise<Section3Result> {
    logger.errorWithStack(error instanceof Error ? error : new Error(String(error)), logContext);

    if (error instanceof DataPilotError) {
      // Check if we can provide a degraded result
      if (error.recoverable && this.state.rowsProcessed > 0) {
        this.warnings.push({
          category: 'error',
          message: `Analysis completed with errors: ${error.message}`,
          severity: 'high',
          impact: 'Partial results available',
          suggestion: 'Check data quality or review error logs',
        });

        logger.warn('Returning partial results due to recoverable error', logContext);
        return await this.createDegradedResult(error);
      }
    }

    // Re-throw non-recoverable errors
    throw error;
  }

  /**
   * Create a degraded result when full analysis fails
   */
  private async createDegradedResult(error: DataPilotError): Promise<Section3Result> {
    // Use the existing MultivariateOrchestrator to create an empty analysis
    const emptyMultivariateAnalysis = await MultivariateOrchestrator.analyze([], [], [], 0);

    return {
      edaAnalysis: {
        univariateAnalysis: [],
        bivariateAnalysis: {
          numericalVsNumerical: {
            totalPairsAnalyzed: 0,
            correlationPairs: [],
            strongestPositiveCorrelation: null,
            strongestNegativeCorrelation: null,
            strongCorrelations: [],
            scatterPlotInsights: [],
            regressionInsights: [],
          },
          numericalVsCategorical: [],
          categoricalVsCategorical: [],
        },
        multivariateAnalysis: emptyMultivariateAnalysis,
        crossVariableInsights: {
          topFindings: [`Analysis interrupted: ${error.message}`],
          dataQualityIssues: ['Incomplete analysis due to processing error'],
          hypothesesGenerated: [],
          preprocessingRecommendations: [],
        },
      },
      warnings: [
        ...this.warnings,
        {
          category: 'error',
          message: 'Analysis completed with reduced functionality due to errors',
          severity: 'high',
          impact: 'No analysis results available',
          suggestion: 'Check error logs and retry with different configuration',
        },
      ],
      performanceMetrics: {
        analysisTimeMs: Date.now() - this.state.startTime,
        peakMemoryMB: this.state.peakMemoryMB,
        rowsAnalyzed: this.state.rowsProcessed,
        chunksProcessed: this.state.chunksProcessed,
      },
      metadata: {
        analysisApproach: 'StreamingAnalyzer (degraded)',
        datasetSize: this.state.rowsProcessed,
        columnsAnalyzed: this.headers.length,
        samplingApplied: false,
      },
    };
  }

  /**
   * Check if multivariate data should be collected
   */
  private shouldCollectMultivariateData(): boolean {
    return (
      this.collectedData.length < this.maxCollectedRows &&
      this.state.currentMemoryMB < this.config.memoryThresholdMB * 0.8
    );
  }

  /**
   * Collect data for multivariate analysis with memory-efficient approach
   */
  private collectMultivariateData(rowData: readonly (string | number | null | undefined)[]): void {
    // Use a more memory-efficient approach by sampling if needed
    const shouldSample = this.collectedData.length > this.maxCollectedRows * 0.8;
    if (!shouldSample || Math.random() < 0.1) {
      (this.collectedData as any).push(Object.freeze([...rowData]));
    }
  }

  /**
   * Handle memory pressure for multivariate data collection
   */
  private handleMultivariateMemoryPressure(streamingConfig: any, perfConfig: any): void {
    const emergencyThreshold =
      this.config.memoryThresholdMB * streamingConfig.memoryManagement.emergencyThresholdMultiplier;
    const minMultivariateRows = Math.min(1000, perfConfig.maxCollectedRowsMultivariate / 2);

    if (
      this.state.currentMemoryMB > emergencyThreshold &&
      this.collectedData.length > minMultivariateRows
    ) {
      // Keep only the minimum required rows for multivariate analysis
      (this.collectedData as any) = this.collectedData.slice(0, minMultivariateRows);
    }
  }

  /**
   * Perform multivariate analysis with enhanced type safety
   */
  private async performMultivariateAnalysis(): Promise<MultivariateAnalysis> {
    const dataArray = this.collectedData.map((row) => [...row]);
    return await MultivariateOrchestrator.analyze(
      dataArray,
      this.headers,
      this.detectedTypes,
      this.state.rowsProcessed,
    );
  }

  /**
   * Create minimal multivariate analysis when disabled or insufficient data
   */
  private async createMinimalMultivariateAnalysis(): Promise<MultivariateAnalysis> {
    return await MultivariateOrchestrator.analyze([], [], [], 0);
  }

  /**
   * Validate analyzer state before operations
   */
  private validateAnalyzerState(operation: string): void {
    if (this.headers.length === 0) {
      throw DataPilotError.analysis(
        `Cannot perform ${operation}: no headers detected`,
        'NO_HEADERS_DETECTED',
        { analyzer: 'StreamingAnalyzer', operationName: operation },
        [
          {
            action: 'Check data format',
            description: 'Ensure the CSV file has proper column headers',
            severity: ErrorSeverity.HIGH,
          },
        ],
      );
    }

    if (this.detectedTypes.length !== this.headers.length) {
      throw DataPilotError.analysis(
        `Type detection mismatch: ${this.headers.length} headers, ${this.detectedTypes.length} types`,
        'TYPE_HEADER_MISMATCH',
        { analyzer: 'StreamingAnalyzer', operationName: operation },
        [
          {
            action: 'Re-run type detection',
            description: 'Retry the analysis to fix type detection',
            severity: ErrorSeverity.MEDIUM,
          },
        ],
      );
    }
  }
}

/**
 * Convenience function to analyze a file using streaming approach
 */
export async function analyzeFileStreaming(
  filePath: string,
  config: Partial<StreamingAnalyzerConfig> = {},
): Promise<Section3Result> {
  const analyzer = new StreamingAnalyzer(config);
  return analyzer.analyzeFile(filePath);
}

/**
 * Convenience function to analyze a file using streaming approach with smart sampling
 */
export async function analyzeFileStreamingWithSampling(
  filePath: string,
  samplingOptions: Pick<CLIOptions, 'autoSample' | 'samplePercentage' | 'sampleRows' | 'sampleSizeBytes' | 'sampleMethod' | 'stratifyBy' | 'seed'>,
  config: Partial<StreamingAnalyzerConfig> = {},
): Promise<Section3Result> {
  const analyzer = StreamingAnalyzer.withSamplingOptions(config, samplingOptions);
  return analyzer.analyzeFile(filePath);
}
