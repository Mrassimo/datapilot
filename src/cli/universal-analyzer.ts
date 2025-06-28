/**
 * Universal Analyzer - Multi-format data analysis orchestrator
 * Integrates with the existing 6-section analysis pipeline
 */

import type { CLIOptions, CLIResult } from './types';
import type { DataParser, ParsedRow } from '../parsers/base/data-parser';
import type { ParserRegistry } from '../parsers/base/parser-registry';
import { globalParserRegistry } from '../parsers/base/parser-registry';
import { createJSONParser, JSONDetector } from '../parsers/json-parser';
import { createCSVParserAdapter } from '../parsers/adapters/csv-parser-adapter';
import { createExcelParser, ExcelDetector } from '../parsers/excel-parser';
import { createTSVParser, TSVDetector } from '../parsers/tsv-parser';
import { createParquetParser, ParquetDetector } from '../parsers/parquet-parser';
import { DataPilotError, ErrorSeverity, ErrorCategory } from '../core/types';
import { logger } from '../utils/logger';

// Import existing analyzers (these remain unchanged)
import { Section1Analyzer } from '../analyzers/overview';
import { Section2Analyzer } from '../analyzers/quality';
import { StreamingAnalyzer } from '../analyzers/streaming/streaming-analyzer';
import { Section4Analyzer } from '../analyzers/visualization';
import { Section5Analyzer } from '../analyzers/engineering';
import { Section6Analyzer } from '../analyzers/modeling';

interface AnalysisDataset {
  headers: string[];
  rows: string[][];
  metadata: {
    format: string;
    filePath: string;
    totalRows: number;
    parserStats: any;
    detection: any;
  };
}

/**
 * Universal analyzer that works with any supported data format
 */
export class UniversalAnalyzer {
  private registry: ParserRegistry;
  private initialized = false;

  constructor() {
    this.registry = globalParserRegistry;
  }

  /**
   * Initialize the analyzer with all available parsers
   */
  private initializeParsers(): void {
    if (this.initialized) return;

    // Register CSV parser (highest priority for backwards compatibility)
    this.registry.register({
      format: 'csv',
      parserFactory: (options) => createCSVParserAdapter(options),
      detector: {
        detect: async (filePath) => {
          const adapter = createCSVParserAdapter();
          return adapter.detect(filePath);
        },
        getSupportedExtensions: () => ['.csv'],
        getFormatName: () => 'csv',
      },
      priority: 100,
      extensions: ['.csv'],
    });

    // Register TSV parser
    this.registry.register({
      format: 'tsv',
      parserFactory: (options) => createTSVParser(options),
      detector: new TSVDetector(),
      priority: 90,
      extensions: ['.tsv', '.tab'],
    });

    // Register JSON parser
    this.registry.register({
      format: 'json',
      parserFactory: (options) => createJSONParser(options),
      detector: new JSONDetector(),
      priority: 80,
      extensions: ['.json', '.jsonl', '.ndjson'],
    });

    // Register Excel parser
    this.registry.register({
      format: 'excel',
      parserFactory: (options) => createExcelParser(options),
      detector: new ExcelDetector(),
      priority: 70,
      extensions: ['.xlsx', '.xls', '.xlsm'],
    });

    // Register Parquet parser
    this.registry.register({
      format: 'parquet',
      parserFactory: (options) => createParquetParser(options),
      detector: new ParquetDetector(),
      priority: 60,
      extensions: ['.parquet'],
    });

    this.initialized = true;
    logger.info(
      `Initialized universal analyzer with ${this.registry.getSupportedFormats().length} formats`,
    );
  }

  /**
   * Analyze any supported file format
   */
  async analyzeFile(filePath: string, options: CLIOptions): Promise<CLIResult> {
    this.initializeParsers();

    try {
      // 1. Auto-detect format and get parser
      logger.info(`Starting universal analysis for: ${filePath}`);
      // Convert CLIOptions to ParseOptions
      const parseOptions: any = {
        maxRows: options.maxRows,
        encoding: options.encoding as BufferEncoding,
        format: options.format,
        delimiter: options.delimiter,
        quote: options.quote,
        hasHeader: options.hasHeader,
        jsonPath: options.jsonPath,
        arrayMode: options.arrayMode,
        flattenObjects: options.flattenObjects,
        sheetName: options.sheetName,
        sheetIndex: options.sheetIndex,
        columns: options.columns,
        rowStart: options.rowStart,
        rowEnd: options.rowEnd,
      };

      const { parser, format, detection } = await this.registry.getParser(filePath, parseOptions);

      logger.info(
        `Detected format: ${format} (confidence: ${(detection.confidence * 100).toFixed(1)}%)`,
      );

      // 2. Validate file can be parsed
      const validation = await parser.validate(filePath);
      if (!validation.canProceed) {
        throw new DataPilotError(
          `Cannot parse file: ${validation.errors.join(', ')}`,
          'UNIVERSAL_PARSE_ERROR',
          ErrorSeverity.HIGH,
          ErrorCategory.VALIDATION,
        );
      }

      if (validation.warnings.length > 0) {
        logger.warn(`Parsing warnings: ${validation.warnings.join(', ')}`);
      }

      // 3. Convert to common dataset format
      const dataset = await this.parseToDataset(parser, filePath, parseOptions, format, detection);

      // 4. Run the same 6-section analysis pipeline
      const analysisResult = await this.runAnalysisPipeline(dataset, options);

      return {
        success: true,
        exitCode: 0,
        data: analysisResult,
        format: options.format || 'markdown',
        metadata: {
          command: options.command || 'all',
          filePath,
          originalFormat: format,
          detection: {
            format,
            confidence: detection.confidence,
            metadata: detection.metadata,
          },
          parserStats: parser.getStats(),
          timestamp: new Date().toISOString(),
          version: '1.2.1', // Multi-format support version
        },
      };
    } catch (error) {
      return this.handleAnalysisError(error, filePath);
    }
  }

  /**
   * Parse file using detected parser and convert to universal dataset format
   */
  private async parseToDataset(
    parser: DataParser,
    filePath: string,
    options: any,
    format: string,
    detection: any,
  ): Promise<AnalysisDataset> {
    const rows: string[][] = [];
    let headers: string[] = [];
    let hasHeader = false;

    logger.info('Parsing file to dataset format...');

    // Parse file and collect rows
    for await (const row of parser.parse(filePath, {
      maxRows: options.maxRows,
      hasHeader: options.hasHeader,
      encoding: options.encoding as BufferEncoding,
      delimiter: options.delimiter,
      quote: options.quote,
      jsonPath: options.jsonPath,
      arrayMode: options.arrayMode,
      flattenObjects: options.flattenObjects,
      sheetName: options.sheetName,
      sheetIndex: options.sheetIndex,
      columns: options.columns,
      rowStart: options.rowStart,
      rowEnd: options.rowEnd,
    })) {
      if (row.index === 0 && !hasHeader) {
        // First row - determine if it's headers or data
        const isHeaderRow = this.detectHeaderRow(row.data, format);

        if (isHeaderRow) {
          headers = row.data;
          hasHeader = true;
          continue;
        } else {
          // Generate column names
          headers = row.data.map((_, i) => `column_${i + 1}`);
        }
      }

      rows.push(row.data);
    }

    const stats = parser.getStats();

    logger.info(`Parsed ${rows.length} rows with ${headers.length} columns`);

    return {
      headers,
      rows,
      metadata: {
        format,
        filePath,
        totalRows: rows.length,
        parserStats: stats,
        detection,
      },
    };
  }

  /**
   * Detect if first row contains headers
   */
  private detectHeaderRow(row: string[], format: string): boolean {
    // Format-specific header detection logic
    switch (format) {
      case 'json':
        // JSON usually has meaningful keys as headers
        return true;

      case 'parquet':
        // Parquet always has schema-defined column names
        return true;

      case 'csv':
        // CSV header detection (existing logic)
        return this.detectCSVHeaders(row);

      default:
        // Default: assume first row is header if it contains non-numeric values
        return row.some((cell) => isNaN(Number(cell)) && cell.trim() !== '');
    }
  }

  private detectCSVHeaders(row: string[]): boolean {
    // Simple heuristic: if more than half the cells are non-numeric, likely headers
    const nonNumeric = row.filter((cell) => {
      const trimmed = cell.trim();
      return trimmed !== '' && isNaN(Number(trimmed));
    });

    return nonNumeric.length > row.length / 2;
  }

  /**
   * Run the existing 6-section analysis pipeline on the universal dataset
   */
  private async runAnalysisPipeline(dataset: AnalysisDataset, options: CLIOptions): Promise<any> {
    const results: any = {};

    // Section 1: Overview Analysis (adapted for universal format)
    if (this.shouldRunSection(1, options)) {
      logger.info('Running Section 1: Overview Analysis');
      results.section1 = await this.runSection1Analysis(dataset, options);
    }

    // Section 2: Data Quality Analysis
    if (this.shouldRunSection(2, options)) {
      logger.info('Running Section 2: Data Quality Analysis');
      results.section2 = await this.runSection2Analysis(dataset, options);
    }

    // Section 3: Exploratory Data Analysis
    if (this.shouldRunSection(3, options)) {
      logger.info('Running Section 3: EDA');
      results.section3 = await this.runSection3Analysis(dataset, options);
    }

    // Section 4: Visualization Intelligence
    if (this.shouldRunSection(4, options)) {
      logger.info('Running Section 4: Visualization Intelligence');
      results.section4 = await this.runSection4Analysis(dataset, options);
    }

    // Section 5: Data Engineering
    if (this.shouldRunSection(5, options)) {
      logger.info('Running Section 5: Data Engineering');
      results.section5 = await this.runSection5Analysis(dataset, options);
    }

    // Section 6: Modeling Strategy
    if (this.shouldRunSection(6, options)) {
      logger.info('Running Section 6: Modeling Strategy');
      results.section6 = await this.runSection6Analysis(dataset, options);
    }

    return results;
  }

  private shouldRunSection(sectionNumber: number, options: CLIOptions): boolean {
    if (options.sections && options.sections.length > 0) {
      const shouldRun = options.sections.includes(sectionNumber.toString());
      if (options.verbose) {
        logger.info(`Section ${sectionNumber} ${shouldRun ? 'ENABLED' : 'SKIPPED'} by --sections parameter`);
      }
      return shouldRun;
    }

    // Default sections based on command
    switch (options.command) {
      case 'overview':
        return sectionNumber === 1;
      case 'quality':
        return sectionNumber === 2;
      case 'eda':
        return sectionNumber === 3;
      case 'visualization':
        return sectionNumber === 4;
      case 'engineering':
        return sectionNumber === 5;
      case 'modeling':
        return sectionNumber === 6;
      case 'all':
        return true;
      default:
        return true;
    }
  }

  // Section analysis methods (these adapt existing analyzers to work with universal dataset)

  private async runSection1Analysis(dataset: AnalysisDataset, options: CLIOptions): Promise<any> {
    const analyzer = new Section1Analyzer({
      enableFileHashing: options.enableHashing !== false,
      includeHostEnvironment: options.includeEnvironment !== false,
      privacyMode: options.privacyMode || 'redacted',
      detailedProfiling: options.verbose || false,
      maxSampleSizeForSparsity: 10000,
      enableCompressionAnalysis: options.enableCompressionAnalysis !== false,
      enableDataPreview: options.enableDataPreview !== false,
      previewRows: (options.previewRows as number) || 5,
      enableHealthChecks: options.enableHealthChecks !== false,
      enableQuickStatistics: options.enableQuickStats !== false,
    });

    // Section1 expects filePath, command, and analysis sections
    return analyzer.analyze(
      dataset.metadata.filePath,
      `datapilot ${options.command || 'analysis'} ${dataset.metadata.filePath}`,
      [],
    );
  }

  private async runSection2Analysis(dataset: AnalysisDataset, options: CLIOptions): Promise<any> {
    const analyzer = new Section2Analyzer({
      data: dataset.rows,
      headers: dataset.headers,
      columnTypes: dataset.headers.map(() => 'string' as any),
      rowCount: dataset.rows.length,
      columnCount: dataset.headers.length,
      config: {
        enabledDimensions: ['completeness', 'uniqueness', 'validity'],
        strictMode: false,
        maxOutlierDetection: 100,
        semanticDuplicateThreshold: 0.85,
      },
    });

    return analyzer.analyze();
  }

  private async runSection3Analysis(dataset: AnalysisDataset, options: CLIOptions): Promise<any> {
    const analyzer = new StreamingAnalyzer({
      chunkSize: options.chunkSize || 500,
      memoryThresholdMB: options.memoryLimit || 100,
      maxRowsAnalyzed: options.maxRows || 500000,
      enabledAnalyses: ['univariate', 'bivariate', 'correlations'],
      significanceLevel: 0.05,
      maxCorrelationPairs: 50,
      enableMultivariate: true,
    });

    // Section3 expects a file path, not data stream
    return analyzer.analyzeFile(dataset.metadata.filePath);
  }

  private async runSection4Analysis(dataset: AnalysisDataset, options: CLIOptions): Promise<any> {
    const analyzer = new Section4Analyzer({
      accessibilityLevel: (options.accessibility as any) || 'good',
      complexityThreshold: (options.complexity as any) || 'moderate',
      maxRecommendationsPerChart: options.maxRecommendations || 3,
      includeCodeExamples: options.includeCode || false,
      enabledRecommendations: [
        'UNIVARIATE' as any,
        'BIVARIATE' as any,
        'DASHBOARD' as any,
        'ACCESSIBILITY' as any,
        'PERFORMANCE' as any,
      ],
      targetLibraries: ['d3', 'plotly', 'observable'],
    });

    // Section4 needs dependencies from previous sections
    // For now, we'll need to create mock dependencies
    // This will be replaced with actual dependency resolution
    const mockSection1 = {
      overview: { structuralDimensions: { totalDataRows: dataset.rows.length } },
    };
    const mockSection3 = { performanceMetrics: { rowsAnalyzed: dataset.rows.length } };

    return analyzer.analyze(mockSection1 as any, mockSection3 as any);
  }

  private async runSection5Analysis(dataset: AnalysisDataset, options: CLIOptions): Promise<any> {
    const analyzer = new Section5Analyzer({
      targetDatabaseSystem: (options.database as any) || 'postgresql',
      mlFrameworkTarget: (options.framework as any) || 'scikit_learn',
    });

    // Section5 needs dependencies from previous sections
    // Create more complete mock data that matches expected structure
    const mockSection1 = {
      overview: { 
        structuralDimensions: { 
          totalDataRows: dataset.rows.length,
          totalColumns: dataset.headers.length,
          columnInventory: dataset.headers.map((header, index) => ({
            name: header,
            index: index,
            dataType: 'string',
            sampleValues: dataset.rows.slice(0, 3).map(row => row[index] || '').filter(v => v)
          })),
          estimatedInMemorySizeMB: Math.ceil(dataset.rows.length * dataset.headers.length * 50 / 1024 / 1024)
        },
        fileDetails: {
          originalFilename: dataset.metadata.filePath.split('/').pop() || 'unknown.csv',
          fileSizeBytes: dataset.metadata.parserStats?.totalBytesRead || dataset.rows.length * dataset.headers.length * 10,
          fileSizeMB: (dataset.metadata.parserStats?.totalBytesRead || dataset.rows.length * dataset.headers.length * 10) / 1024 / 1024,
          lastModified: new Date()
        },
        parsingMetadata: {
          encoding: { encoding: 'utf-8' }
        }
      }
    };
    
    const mockSection2 = { 
      qualityAudit: { 
        cockpit: {
          compositeScore: { score: 85 }
        }
      } 
    };
    
    const mockSection3 = { 
      performanceMetrics: { rowsAnalyzed: dataset.rows.length },
      edaAnalysis: {
        // Safe structure that won't cause crashes in PCA extraction
        multivariateAnalysis: null
      }
    };

    return analyzer.analyze(mockSection1 as any, mockSection2 as any, mockSection3 as any);
  }

  private async runSection6Analysis(dataset: AnalysisDataset, options: CLIOptions): Promise<any> {
    const analyzer = new Section6Analyzer({
      focusAreas: (options.focus as any) || ['regression', 'binary_classification', 'clustering'],
      complexityPreference: options.complexity || 'moderate',
      interpretabilityRequirement: options.interpretability || 'medium',
    });

    // Section6 needs dependencies from previous sections
    const mockSection1 = {
      overview: { 
        structuralDimensions: { 
          totalDataRows: dataset.rows.length,
          columnInventory: dataset.headers.map((header, index) => ({
            name: header,
            index: index,
            dataType: 'string',
            sampleValues: dataset.rows.slice(0, 3).map(row => row[index] || '').filter(v => v)
          }))
        } 
      },
    };
    const mockSection2 = { qualityAudit: { overallScore: 85 } };
    const mockSection3 = { 
      performanceMetrics: { rowsAnalyzed: dataset.rows.length },
      edaAnalysis: {
        multivariateAnalysis: null
      }
    };
    const mockSection5 = { 
      engineeringAnalysis: {
        mlReadiness: {
          overallScore: 85,
          enhancingFactors: [
            {
              factor: "Clean Data Structure",
              impact: "high" as const,
              description: "Well-structured data with consistent formatting"
            }
          ],
          remainingChallenges: [
            {
              challenge: "Type Detection",
              severity: "medium" as const,
              impact: "May require manual type specification",
              mitigationStrategy: "Implement enhanced type detection",
              estimatedEffort: "2-4 hours"
            }
          ],
          featurePreparationMatrix: dataset.headers.map(header => ({
            featureName: `ml_${header}`,
            originalColumn: header,
            finalDataType: "String",
            keyIssues: ["Type detection needed"],
            engineeringSteps: ["Type inference", "Encoding if categorical"],
            finalMLFeatureType: "Categorical",
            modelingNotes: []
          })),
          modelingConsiderations: []
        }
      }
    };

    return analyzer.analyze(
      mockSection1 as any,
      mockSection2 as any,
      mockSection3 as any,
      mockSection5 as any,
    );
  }

  /**
   * Create async iterable data stream from dataset
   */
  private async *createDataStream(dataset: AnalysisDataset): AsyncIterableIterator<string[]> {
    for (const row of dataset.rows) {
      yield row;
    }
  }

  /**
   * Handle analysis errors with helpful suggestions
   */
  private handleAnalysisError(error: any, filePath: string): CLIResult {
    const supportedFormats = this.registry.getSupportedFormats();
    const supportedExtensions = this.registry.getSupportedExtensions();

    return {
      success: false,
      exitCode: 1,
      error: error.message,
      suggestions: [
        `Check if file format is supported: ${supportedFormats.join(', ')}`,
        `Supported extensions: ${supportedExtensions.join(', ')}`,
        'Try specifying format explicitly: --format json',
        'Verify file is not corrupted',
        'Check file permissions',
        'Use --help for more information',
      ],
      metadata: {
        filePath,
        supportedFormats,
        supportedExtensions,
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Get supported formats for help/error messages
   */
  getSupportedFormats(): string[] {
    this.initializeParsers();
    return this.registry.getSupportedFormats();
  }

  /**
   * Validate file format is supported
   */
  async validateFile(filePath: string): Promise<{
    supported: boolean;
    format?: string;
    confidence?: number;
    suggestions: string[];
  }> {
    this.initializeParsers();

    try {
      const validation = await this.registry.validateFile(filePath);

      if (validation.supported && validation.bestMatch) {
        return {
          supported: true,
          format: validation.bestMatch.format,
          confidence: validation.bestMatch.detection.confidence,
          suggestions: [],
        };
      } else {
        return {
          supported: false,
          suggestions: [
            `File format not supported or confidence too low`,
            `Supported formats: ${this.getSupportedFormats().join(', ')}`,
            'Try converting to a supported format',
            'Check if file is corrupted',
          ],
        };
      }
    } catch (error) {
      return {
        supported: false,
        suggestions: [
          `Error validating file: ${error.message}`,
          'Check file exists and is readable',
          'Verify file format is supported',
        ],
      };
    }
  }
}
