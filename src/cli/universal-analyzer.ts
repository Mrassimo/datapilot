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
import { globalErrorHandler, ErrorUtils } from '../utils/error-handler';

// Import existing analyzers (these remain unchanged)
import { Section1Analyzer } from '../analyzers/overview';
import { Section2Analyzer } from '../analyzers/quality';
import { StreamingAnalyzer } from '../analyzers/streaming/streaming-analyzer';
import { Section4Analyzer } from '../analyzers/visualization';
import { Section5Analyzer } from '../analyzers/engineering';
import { Section6Analyzer } from '../analyzers/modeling';

export interface AnalysisDataset {
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
   * Analyze multiple files for join analysis (engineering command with multiple files)
   */
  async analyzeMultipleFiles(filePaths: string[], options: CLIOptions): Promise<CLIResult> {
    this.initializeParsers();

    try {
      logger.info(`Starting multi-file join analysis for: ${filePaths.join(', ')}`);

      // Validate all files exist and are supported
      for (const filePath of filePaths) {
        const validation = await this.validateFile(filePath);
        if (!validation.supported) {
          throw new DataPilotError(
            `File ${filePath} is not supported: ${validation.suggestions.join(', ')}`,
            'MULTI_FILE_VALIDATION_ERROR',
            ErrorSeverity.HIGH,
            ErrorCategory.VALIDATION,
          );
        }
      }

      // Import and run join analysis
      const { JoinAnalyzer } = await import('../analyzers/joins');
      const joinAnalyzer = new JoinAnalyzer({
        maxTables: Math.max(10, filePaths.length),
        confidenceThreshold: options.confidence || 0.7,
        enableFuzzyMatching: true,
        enableSemanticAnalysis: true,
        enableTemporalJoins: false,
        performanceMode: 'BALANCED',
        outputFormats: [{ type: 'MARKDOWN' }]
      });

      const joinResult = await joinAnalyzer.analyzeJoins(filePaths);

      return {
        success: true,
        exitCode: 0,
        data: {
          joinAnalysis: joinResult
        },
        format: options.format || 'markdown',
        metadata: {
          command: 'engineering',
          filePaths,
          analysisType: 'multi-file-join',
          filesAnalyzed: filePaths.length,
          timestamp: new Date().toISOString(),
          version: '1.2.1',
        },
      };
    } catch (error) {
      return this.handleAnalysisError(error, filePaths.join(', '));
    }
  }

  /**
   * Analyze any supported file format
   */
  async analyzeFile(filePath: string, options: CLIOptions): Promise<CLIResult> {
    this.initializeParsers();
    
    // Enable verbose mode in error handler if verbose CLI option is set
    globalErrorHandler.setVerboseMode(options.verbose || false);

    return await ErrorUtils.withEnhancedContext(
      async () => {
        // 1. Auto-detect format and get parser
        logger.info(`Starting universal analysis for: ${filePath}`);
        // Convert CLIOptions to ParseOptions
        const parseOptions: any = {
          maxRows: options.maxRows,
          encoding: options.encoding as BufferEncoding,
          // NOTE: Do NOT pass options.format here - that's for OUTPUT format, not input file format
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

        const { parser, format, detection } = await ErrorUtils.withEnhancedContext(
          () => this.registry.getParser(filePath, parseOptions),
          {
            operationName: 'format_detection',
            filePath,
            additionalContext: { parseOptions }
          }
        );

        logger.info(
          `Detected format: ${format} (confidence: ${(detection.confidence * 100).toFixed(1)}%)`,
        );

        // 2. Validate file can be parsed
        const validation = await ErrorUtils.withEnhancedContext(
          () => parser.validate(filePath),
          {
            operationName: 'parser_validation',
            filePath,
            additionalContext: { format, confidence: detection.confidence }
          }
        );
        
        if (!validation.canProceed) {
          throw ErrorUtils.createContextualError(
            `Cannot parse file: ${validation.errors.join(', ')}`,
            'UNIVERSAL_PARSE_ERROR',
            ErrorCategory.VALIDATION,
            ErrorSeverity.HIGH,
            {
              operationName: 'parser_validation',
              filePath,
              additionalContext: {
                format,
                parserErrors: validation.errors,
                parserWarnings: validation.warnings
              }
            }
          );
        }

        if (validation.warnings.length > 0) {
          logger.warn(`Parsing warnings: ${validation.warnings.join(', ')}`);
        }

        // 3. Convert to common dataset format
        const dataset = await ErrorUtils.withEnhancedContext(
          () => this.parseToDataset(parser, filePath, parseOptions, format, detection),
          {
            operationName: 'dataset_conversion',
            filePath,
            additionalContext: { format, parseOptions }
          }
        );

        // 4. Run the same 6-section analysis pipeline
        const analysisResult = await ErrorUtils.withEnhancedContext(
          () => this.runAnalysisPipeline(dataset, options),
          {
            operationName: 'analysis_pipeline',
            filePath,
            additionalContext: { 
              format, 
              datasetSize: dataset.rows.length,
              columns: dataset.headers.length
            }
          }
        );

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
      },
      {
        operationName: 'universal_file_analysis',
        filePath,
        additionalContext: { 
          command: options.command,
          verboseMode: options.verbose 
        }
      }
    ).catch((error) => {
      return this.handleAnalysisError(error, filePath, options);
    });
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
   * Intelligently uses SequentialExecutor or individual execution based on context
   */
  private async runAnalysisPipeline(dataset: AnalysisDataset, options: CLIOptions): Promise<any> {
    // Determine which sections to run based on options
    const requestedSections = this.getRequestedSections(options);
    
    if (requestedSections.length === 0) {
      logger.warn('No sections requested for analysis');
      return {};
    }

    // Intelligent execution mode detection for backward compatibility
    const shouldUseSequentialExecution = this.shouldUseSequentialExecution(requestedSections, options);

    if (shouldUseSequentialExecution) {
      // Use new sequential execution for complex dependencies
      return this.runSequentialExecution(dataset, options, requestedSections);
    } else {
      // Use traditional individual execution for single sections without dependencies
      return this.runIndividualExecution(dataset, options, requestedSections);
    }
  }

  /**
   * Determine whether to use sequential execution or individual execution
   * This maintains backward compatibility while enabling advanced features
   */
  private shouldUseSequentialExecution(requestedSections: string[], options: CLIOptions): boolean {
    // Force sequential execution if explicitly requested
    if (options.forceSequential) {
      logger.info('Sequential execution forced by --force-sequential flag');
      return true;
    }

    // Force individual execution if explicitly requested (for testing/debugging)
    if (options.forceIndividual) {
      logger.info('Individual execution forced by --force-individual flag');
      return false;
    }

    // Check if any section with dependencies is requested
    const sectionsWithDependencies = ['section4', 'section5', 'section6'];
    const hasDependentSection = requestedSections.some(section => 
      sectionsWithDependencies.includes(section)
    );

    // Use sequential execution if:
    // 1. Multiple sections are requested (better memory management)
    // 2. Any section with dependencies is requested
    // 3. Command is 'all' or 'analysis' (full pipeline)
    if (requestedSections.length > 1 || hasDependentSection || 
        ['all', 'analysis', 'modeling'].includes(options.command || '')) {
      logger.info(
        'Using sequential execution for optimal dependency resolution',
        { 
          sections: requestedSections, 
          reason: hasDependentSection ? 'dependencies' : 'multiple sections',
          command: options.command 
        }
      );
      return true;
    }

    // Use individual execution for single sections without dependencies
    logger.info(
      'Using individual execution for single section',
      { section: requestedSections[0], command: options.command }
    );
    return false;
  }

  /**
   * Run sequential execution with full dependency resolution
   */
  private async runSequentialExecution(
    dataset: AnalysisDataset, 
    options: CLIOptions, 
    requestedSections: string[]
  ): Promise<any> {
    logger.info(
      `Starting analysis pipeline with SequentialExecutor for sections: ${requestedSections.join(', ')}`,
      { sections: requestedSections, executor: 'SequentialExecutor' }
    );

    try {
      // Import SequentialExecutor (dynamic import to avoid circular dependencies)
      const { createSequentialExecutor } = await import('./sequential-executor');

      // Create progress callbacks for CLI feedback
      const progressCallbacks = {
        onPhaseStart: (phase: string, message: string) => {
          if (options.verbose) {
            logger.info(`Phase started: ${phase} - ${message}`);
          }
        },
        onProgress: (state: any) => {
          if (options.verbose) {
            logger.debug(`Progress: ${state.progress}% - ${state.message}`);
          }
        },
        onPhaseComplete: (message: string, timeElapsed: number) => {
          if (options.verbose) {
            logger.info(`Phase completed: ${message} (${timeElapsed}ms)`);
          }
        },
        onError: (message: string) => {
          logger.error(`Execution error: ${message}`);
        },
        onWarning: (message: string) => {
          logger.warn(`Execution warning: ${message}`);
        },
      };

      // Create and configure sequential executor
      const executor = createSequentialExecutor(
        dataset,
        options,
        progressCallbacks,
        {
          operation: 'pipeline_execution',
          filePath: dataset.metadata.filePath,
          format: dataset.metadata.format,
        }
      );

      // Execute with sophisticated dependency resolution and memory management
      const result = await executor.execute(requestedSections);
      
      if (!result.success) {
        throw new DataPilotError(
          `Sequential execution failed: ${result.error}`,
          'SEQUENTIAL_EXECUTION_FAILED',
          ErrorSeverity.HIGH,
          ErrorCategory.ANALYSIS,
          {},
          result.suggestions?.map(suggestion => ({
            action: 'Follow suggestion',
            description: suggestion,
            severity: ErrorSeverity.MEDIUM,
          }))
        );
      }

      logger.info(
        'Sequential execution completed successfully',
        {
          sectionsCompleted: result.metadata?.sectionsExecuted?.length || 0,
          executionTime: result.metadata?.executionTime || 0,
          memoryPeak: result.metadata?.memoryPeakUsage || 0,
        }
      );

      return result.data;
    } catch (error) {
      // If sequential execution fails, fall back to individual execution
      if (options.fallbackOnError !== false) {
        logger.warn(
          'Sequential execution failed, falling back to individual execution',
          { error: error.message }
        );
        return this.runIndividualExecution(dataset, options, requestedSections);
      }
      throw error;
    }
  }

  /**
   * Run individual section execution (legacy mode for backward compatibility)
   * This is used for single sections without dependencies to maintain performance
   */
  private async runIndividualExecution(
    dataset: AnalysisDataset,
    options: CLIOptions,
    requestedSections: string[]
  ): Promise<any> {
    logger.info(
      `Running individual section execution for: ${requestedSections.join(', ')}`,
      { sections: requestedSections, executor: 'Individual' }
    );

    const results: any = {};
    const sectionStartTime = Date.now();

    // Execute each section individually (original behavior)
    for (const section of requestedSections) {
      try {
        switch (section) {
          case 'section1':
            if (this.shouldRunSection(1, options)) {
              results.section1 = await this.runSection1Analysis(dataset, options);
            }
            break;
          case 'section2':
            if (this.shouldRunSection(2, options)) {
              results.section2 = await this.runSection2Analysis(dataset, options);
            }
            break;
          case 'section3':
            if (this.shouldRunSection(3, options)) {
              results.section3 = await this.runSection3Analysis(dataset, options);
            }
            break;
          case 'section4':
            if (this.shouldRunSection(4, options)) {
              // Section 4 needs dependencies - create mocks for individual execution
              const mockSection1 = results.section1 || await this.runSection1Analysis(dataset, options);
              const mockSection3 = results.section3 || await this.runSection3Analysis(dataset, options);
              results.section4 = await this.runSection4Analysis(dataset, options);
            }
            break;
          case 'section5':
            if (this.shouldRunSection(5, options)) {
              // Section 5 needs dependencies - create mocks for individual execution
              const mockSection1 = results.section1 || await this.runSection1Analysis(dataset, options);
              const mockSection2 = results.section2 || await this.runSection2Analysis(dataset, options);
              const mockSection3 = results.section3 || await this.runSection3Analysis(dataset, options);
              results.section5 = await this.runSection5Analysis(dataset, options);
            }
            break;
          case 'section6':
            if (this.shouldRunSection(6, options)) {
              // Section 6 needs multiple dependencies - warn about using sequential execution
              logger.warn(
                'Section 6 has complex dependencies. Consider using sequential execution for better results.',
                { hint: 'Sequential execution would provide real dependency data instead of mocks' }
              );
              results.section6 = await this.runSection6Analysis(dataset, options);
            }
            break;
        }
      } catch (error) {
        logger.error(`Section ${section} failed in individual execution`, error);
        if (options.continueOnError) {
          continue;
        }
        throw error;
      }
    }

    const totalTime = Date.now() - sectionStartTime;
    logger.info(
      'Individual execution completed',
      { 
        sectionsCompleted: Object.keys(results).length,
        totalTime,
        mode: 'legacy'
      }
    );

    return results;
  }

  /**
   * Determine which sections to run based on CLI options
   */
  private getRequestedSections(options: CLIOptions): string[] {
    if (options.sections && options.sections.length > 0) {
      // Convert numbered sections to section names
      return options.sections.map(section => {
        if (section.startsWith('section')) {
          return section;
        }
        return `section${section}`;
      }).filter(section => {
        // Validate section exists
        const validSections = ['section1', 'section2', 'section3', 'section4', 'section5', 'section6'];
        return validSections.includes(section);
      });
    }

    // Default sections based on command
    switch (options.command) {
      case 'overview':
        return ['section1'];
      case 'quality':
        return ['section2'];
      case 'eda':
        return ['section3'];
      case 'visualization':
        return ['section4'];
      case 'engineering':
        return ['section5'];
      case 'modeling':
        return ['section6'];
      case 'all':
        return ['section1', 'section2', 'section3', 'section4', 'section5', 'section6'];
      default:
        return ['section1', 'section2', 'section3', 'section4', 'section5', 'section6'];
    }
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
          totalColumns: dataset.headers.length,
          columnInventory: dataset.headers.map((header, index) => ({
            name: header,
            index: index,
            originalIndex: index,
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
      },
    };
    const mockSection2 = { qualityAudit: { overallScore: 85 } };
    const mockSection3 = { 
      performanceMetrics: { rowsAnalyzed: dataset.rows.length },
      edaAnalysis: {
        univariateAnalysis: [], // Empty array for safe iteration
        bivariateAnalysis: {
          numericalVsNumerical: {
            correlationPairs: [] // Empty array for safe iteration
          }
        },
        multivariateAnalysis: {
          principalComponentAnalysis: null,
          clusteringAnalysis: null,
          outlierAnalysis: {
            multivariateOutliers: [],
            outlierSummary: {
              totalOutliers: 0,
              outlierPercentage: 0,
              method: 'IQR',
              detectionThreshold: 1.5,
            }
          },
          normalityTests: {
            overallNormality: {
              isNormal: true,
              confidence: 0.95,
              testMethod: 'Shapiro-Wilk',
            }
          }
        }
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
   * Handle analysis errors with enhanced debugging information
   */
  private handleAnalysisError(error: any, filePath: string, options?: CLIOptions): CLIResult {
    const supportedFormats = this.registry.getSupportedFormats();
    const supportedExtensions = this.registry.getSupportedExtensions();
    
    let errorMessage = 'Analysis failed';
    let enhancedSuggestions: string[] = [];
    let errorDetails: any = {};

    if (error instanceof DataPilotError) {
      // Enhanced error handling for DataPilotError
      errorMessage = error.getFormattedMessage(options?.verbose || false);
      enhancedSuggestions = error.getEnhancedSuggestions(options?.verbose || false);
      
      if (options?.verbose && error.verboseInfo) {
        errorDetails = {
          fullContext: error.verboseInfo.fullContext,
          performanceMetrics: error.verboseInfo.performanceMetrics,
          memorySnapshot: error.verboseInfo.memorySnapshot,
        };
      }
    } else {
      // Convert generic error to enhanced format
      errorMessage = error instanceof Error ? error.message : 'Unknown analysis error';
      
      if (options?.verbose) {
        errorMessage += `\n   Stack: ${error instanceof Error ? error.stack?.split('\n').slice(0, 3).join('\n          ') : 'No stack available'}`;
      }
    }

    // Default suggestions enhanced with debugging context
    const defaultSuggestions = [
      `Check if file format is supported: ${supportedFormats.join(', ')}`,
      `Supported extensions: ${supportedExtensions.join(', ')}`,
      'Try specifying format explicitly: --format json',
      'Verify file is not corrupted',
      'Check file permissions',
    ];
    
    if (options?.verbose) {
      defaultSuggestions.push(
        'Run with --verbose for more detailed error information',
        'Check memory usage with system monitor during analysis',
        'Use --maxRows to limit data size for testing'
      );
    } else {
      defaultSuggestions.push('Use --verbose for detailed debugging information');
    }
    
    defaultSuggestions.push('Use --help for more information');

    // Combine enhanced suggestions with defaults
    const allSuggestions = enhancedSuggestions.length > 0 ? 
      [...enhancedSuggestions, '---', ...defaultSuggestions] :
      defaultSuggestions;

    return {
      success: false,
      exitCode: 1,
      error: errorMessage,
      suggestions: allSuggestions,
      metadata: {
        filePath,
        supportedFormats,
        supportedExtensions,
        timestamp: new Date().toISOString(),
        errorCategory: error instanceof DataPilotError ? error.category : 'unknown',
        errorSeverity: error instanceof DataPilotError ? error.severity : 'medium',
        verboseMode: options?.verbose || false,
        ...(options?.verbose && errorDetails ? { errorDetails } : {}),
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
   * Validate CSV file format without full analysis (validate command)
   */
  async validateCSVFile(filePath: string, options: CLIOptions): Promise<CLIResult> {
    this.initializeParsers();

    try {
      // Enable verbose mode in error handler if verbose CLI option is set
      globalErrorHandler.setVerboseMode(options.verbose || false);

      logger.info(`Starting CSV validation for: ${filePath}`);

      // 1. Basic file existence and accessibility check
      const fs = await import('fs');
      const path = await import('path');
      
      if (!fs.existsSync(filePath)) {
        return {
          success: false,
          exitCode: 1,
          error: `File not found: ${filePath}`,
          suggestions: [
            'Check the file path is correct',
            'Ensure the file exists and is accessible'
          ]
        };
      }

      const stats = fs.statSync(filePath);
      if (!stats.isFile()) {
        return {
          success: false,
          exitCode: 1,
          error: `Path is not a file: ${filePath}`,
          suggestions: ['Provide a path to a file, not a directory']
        };
      }

      if (stats.size === 0) {
        return {
          success: false,
          exitCode: 1,
          error: `File is empty: ${filePath}`,
          suggestions: ['Provide a non-empty CSV file']
        };
      }

      // 2. Format detection and parser validation
      const parseOptions: any = {
        encoding: options.encoding as BufferEncoding || 'utf8',
        delimiter: options.delimiter,
        maxRows: 100, // Only validate structure, don't process full file
      };

      const { parser, format, detection } = await this.registry.getParser(filePath, parseOptions);

      if (detection.confidence < 0.7) {
        return {
          success: false,
          exitCode: 1,
          error: `Low confidence in file format detection (${(detection.confidence * 100).toFixed(1)}%)`,
          suggestions: [
            `Detected format: ${format}`,
            'Try specifying format options manually',
            '--delimiter "," --encoding utf8',
            'Ensure file has proper CSV structure'
          ]
        };
      }

      // 3. Parser validation
      const validation = await parser.validate(filePath);
      
      if (!validation.canProceed) {
        return {
          success: false,
          exitCode: 1,
          error: `CSV format validation failed: ${validation.errors.join(', ')}`,
          suggestions: [
            'Check CSV formatting and structure',
            'Ensure proper delimiter usage',
            'Verify quote character consistency',
            ...validation.warnings.map(w => `Warning: ${w}`)
          ]
        };
      }

      // 4. Quick structure check - parse first few rows to validate CSV structure
      let rowCount = 0;
      let columnCount = 0;
      let hasHeader = false;
      const detectedDelimiter = detection.metadata?.delimiter || ',';
      const detectedEncoding = detection.metadata?.encoding || 'utf8';

      try {
        let firstRowProcessed = false;
        for await (const row of parser.parse(filePath, { 
          maxRows: 10, 
          hasHeader: true,
          encoding: parseOptions.encoding,
          delimiter: parseOptions.delimiter
        })) {
          if (!firstRowProcessed) {
            columnCount = row.data.length;
            hasHeader = this.detectHeaderRow(row.data, format);
            firstRowProcessed = true;
          }
          rowCount++;
          if (rowCount >= 10) break; // Limit validation to first 10 rows
        }
      } catch (parseError) {
        return {
          success: false,
          exitCode: 1,
          error: `CSV parsing validation failed: ${parseError.message}`,
          suggestions: [
            'Check CSV syntax and formatting',
            'Ensure consistent delimiter usage',
            'Verify file encoding is correct'
          ]
        };
      }

      // Estimate total rows (rough calculation)
      const estimatedRows = Math.floor(stats.size / (columnCount * 10)); // Rough estimate

      const result = {
        success: true,
        exitCode: 0,
        data: {
          validation: {
            isValid: true,
            format,
            confidence: detection.confidence,
            fileSize: stats.size,
            fileSizeMB: Math.round(stats.size / 1024 / 1024 * 100) / 100,
            estimatedRows: Math.max(rowCount, estimatedRows),
            columns: columnCount,
            hasHeader,
            detectedDelimiter,
            detectedEncoding,
            warnings: validation.warnings
          }
        },
        metadata: {
          command: 'validate',
          filePath,
          timestamp: new Date().toISOString(),
          validationTime: Date.now()
        }
      };

      // Output validation results if not quiet
      if (!options.quiet) {
        console.log(`\n✅ CSV Validation Results for: ${path.basename(filePath)}`);
        console.log(`📊 File Status: VALID`);
        console.log(`📁 File Size: ${result.data.validation.fileSizeMB} MB`);
        console.log(`🔍 Format Confidence: ${(detection.confidence * 100).toFixed(1)}%`);
        console.log(`📋 Estimated Rows: ${result.data.validation.estimatedRows.toLocaleString()}`);
        console.log(`📊 Columns: ${columnCount}`);
        console.log(`🏷️  Has Header: ${hasHeader ? 'Yes' : 'No'}`);
        console.log(`🔹 Delimiter: "${detectedDelimiter}"`);
        console.log(`📝 Encoding: ${detectedEncoding}`);
        
        if (validation.warnings.length > 0) {
          console.log(`\n⚠️  Warnings:`);
          validation.warnings.forEach(warning => console.log(`   • ${warning}`));
        }
      }

      return result;

    } catch (error) {
      return this.handleAnalysisError(error, filePath, options);
    }
  }

  /**
   * Show quick file information and format detection (info command)
   */
  async getFileInfo(filePath: string, options: CLIOptions): Promise<CLIResult> {
    this.initializeParsers();

    try {
      logger.info(`Getting file info for: ${filePath}`);

      // 1. Basic file information
      const fs = await import('fs');
      const path = await import('path');
      
      if (!fs.existsSync(filePath)) {
        return {
          success: false,
          exitCode: 1,
          error: `File not found: ${filePath}`,
          suggestions: ['Check the file path is correct']
        };
      }

      const stats = fs.statSync(filePath);
      if (!stats.isFile()) {
        return {
          success: false,
          exitCode: 1,
          error: `Path is not a file: ${filePath}`,
          suggestions: ['Provide a path to a file, not a directory']
        };
      }

      // 2. Format detection
      const parseOptions: any = {
        encoding: options.encoding as BufferEncoding || 'utf8',
        delimiter: options.delimiter,
        maxRows: 50, // Get preview rows
      };

      let detectionResult;
      let formatInfo = {
        format: 'unknown',
        confidence: 0,
        delimiter: ',',
        encoding: 'utf8',
        hasHeader: false
      };

      try {
        detectionResult = await this.registry.getParser(filePath, parseOptions);
        formatInfo = {
          format: detectionResult.format,
          confidence: detectionResult.detection.confidence,
          delimiter: detectionResult.detection.metadata?.delimiter || ',',
          encoding: detectionResult.detection.metadata?.encoding || 'utf8',
          hasHeader: false
        };
      } catch (detectionError) {
        logger.warn(`Format detection failed: ${detectionError.message}`);
      }

      // 3. Get preview data
      let previewRows: string[][] = [];
      let estimatedTotalRows = 0;
      let columnCount = 0;

      if (detectionResult) {
        try {
          let rowCount = 0;
          for await (const row of detectionResult.parser.parse(filePath, { 
            maxRows: 5, 
            hasHeader: false,
            encoding: parseOptions.encoding,
            delimiter: parseOptions.delimiter
          })) {
            if (rowCount === 0) {
              columnCount = row.data.length;
              formatInfo.hasHeader = this.detectHeaderRow(row.data, formatInfo.format);
            }
            previewRows.push(row.data);
            rowCount++;
          }

          // Rough estimate of total rows
          if (columnCount > 0) {
            estimatedTotalRows = Math.floor(stats.size / (columnCount * 15)); // Very rough estimate
          }
        } catch (parseError) {
          logger.warn(`Preview parsing failed: ${parseError.message}`);
        }
      }

      const result = {
        success: true,
        exitCode: 0,
        data: {
          fileInfo: {
            filePath: path.resolve(filePath),
            fileName: path.basename(filePath),
            fileSize: stats.size,
            fileSizeMB: Math.round(stats.size / 1024 / 1024 * 100) / 100,
            lastModified: stats.mtime,
            format: formatInfo.format,
            formatConfidence: formatInfo.confidence,
            estimatedRows: estimatedTotalRows,
            columns: columnCount,
            hasHeader: formatInfo.hasHeader,
            delimiter: formatInfo.delimiter,
            encoding: formatInfo.encoding,
            preview: previewRows.slice(0, 3) // Show first 3 rows
          }
        },
        metadata: {
          command: 'info',
          filePath,
          timestamp: new Date().toISOString()
        }
      };

      // Output file info if not quiet
      if (!options.quiet) {
        console.log(`\n📄 File Information: ${path.basename(filePath)}`);
        console.log(`📍 Path: ${result.data.fileInfo.filePath}`);
        console.log(`📁 Size: ${result.data.fileInfo.fileSizeMB} MB (${result.data.fileInfo.fileSize.toLocaleString()} bytes)`);
        console.log(`📅 Modified: ${result.data.fileInfo.lastModified.toLocaleString()}`);
        console.log(`\n🔍 Format Detection:`);
        console.log(`   Format: ${result.data.fileInfo.format}`);
        console.log(`   Confidence: ${(formatInfo.confidence * 100).toFixed(1)}%`);
        console.log(`   Delimiter: "${result.data.fileInfo.delimiter}"`);
        console.log(`   Encoding: ${result.data.fileInfo.encoding}`);
        console.log(`\n📊 Structure:`);
        console.log(`   Estimated Rows: ${result.data.fileInfo.estimatedRows.toLocaleString()}`);
        console.log(`   Columns: ${result.data.fileInfo.columns}`);
        console.log(`   Has Header: ${result.data.fileInfo.hasHeader ? 'Yes' : 'No'}`);
        
        if (previewRows.length > 0) {
          console.log(`\n👀 Preview (first 3 rows):`);
          previewRows.slice(0, 3).forEach((row, index) => {
            const truncatedRow = row.map(cell => 
              cell.length > 30 ? cell.substring(0, 30) + '...' : cell
            );
            console.log(`   ${index + 1}: [${truncatedRow.join(', ')}]`);
          });
        }
      }

      return result;

    } catch (error) {
      return this.handleAnalysisError(error, filePath, options);
    }
  }

  /**
   * Validate inputs and preview analysis plan without executing (dry-run mode)
   */
  async validateAndPreview(filePaths: string[], options: CLIOptions): Promise<CLIResult> {
    this.initializeParsers();

    try {
      logger.info(`Starting dry-run validation for: ${filePaths.join(', ')}`);

      const validationResults: any[] = [];
      let totalEstimatedTime = 0;
      let totalEstimatedMemory = 0;
      let allValid = true;

      // Validate each file
      for (const filePath of filePaths) {
        const fileValidation = await this.validateFileForDryRun(filePath, options);
        validationResults.push(fileValidation);
        
        if (!fileValidation.valid) {
          allValid = false;
        } else {
          totalEstimatedTime += fileValidation.estimatedProcessingTime;
          totalEstimatedMemory = Math.max(totalEstimatedMemory, fileValidation.estimatedMemoryUsage);
        }
      }

      // Determine analysis plan
      const analysisPlan = this.generateAnalysisPlan(options, filePaths.length > 1);
      
      // Display dry-run results
      if (!options.quiet) {
        this.displayDryRunResults(validationResults, analysisPlan, totalEstimatedTime, totalEstimatedMemory, options);
      }

      const result = {
        success: allValid,
        exitCode: allValid ? 0 : 1,
        data: {
          dryRun: true,
          validationResults,
          analysisPlan,
          resourceEstimates: {
            estimatedProcessingTimeMs: totalEstimatedTime,
            estimatedMemoryUsageMB: totalEstimatedMemory,
            numberOfFiles: filePaths.length,
          },
          wouldExecute: allValid,
        },
        metadata: {
          command: 'dry-run',
          filePaths,
          timestamp: new Date().toISOString(),
          options: {
            command: options.command,
            sections: analysisPlan.sections,
            multiFile: filePaths.length > 1,
          },
        },
      };

      if (!allValid) {
        return {
          ...result,
          error: 'Validation failed for one or more input files',
          suggestions: [
            'Fix file validation issues shown above',
            'Check file paths and permissions',
            'Ensure files are in supported formats',
          ],
        };
      }

      return result;
    } catch (error) {
      return this.handleAnalysisError(error, filePaths.join(', '), options);
    }
  }

  /**
   * Validate individual file for dry-run mode
   */
  private async validateFileForDryRun(filePath: string, options: CLIOptions): Promise<{
    filePath: string;
    valid: boolean;
    format?: string;
    confidence?: number;
    fileSize: number;
    fileSizeMB: number;
    estimatedRows?: number;
    columns?: number;
    hasHeader?: boolean;
    estimatedProcessingTime: number;
    estimatedMemoryUsage: number;
    errors: string[];
    warnings: string[];
  }> {
    try {
      // Basic file existence and accessibility check
      const fs = await import('fs');
      
      if (!fs.existsSync(filePath)) {
        return {
          filePath,
          valid: false,
          fileSize: 0,
          fileSizeMB: 0,
          estimatedProcessingTime: 0,
          estimatedMemoryUsage: 0,
          errors: [`File not found: ${filePath}`],
          warnings: [],
        };
      }

      const stats = fs.statSync(filePath);
      if (!stats.isFile()) {
        return {
          filePath,
          valid: false,
          fileSize: stats.size,
          fileSizeMB: stats.size / 1024 / 1024,
          estimatedProcessingTime: 0,
          estimatedMemoryUsage: 0,
          errors: [`Path is not a file: ${filePath}`],
          warnings: [],
        };
      }

      if (stats.size === 0) {
        return {
          filePath,
          valid: false,
          fileSize: 0,
          fileSizeMB: 0,
          estimatedProcessingTime: 0,
          estimatedMemoryUsage: 0,
          errors: [`File is empty: ${filePath}`],
          warnings: [],
        };
      }

      // Format detection
      const parseOptions: any = {
        encoding: options.encoding as BufferEncoding || 'utf8',
        delimiter: options.delimiter,
        maxRows: 100, // Only validate structure
      };

      let format: string;
      let confidence: number;
      let estimatedRows = 0;
      let columns = 0;
      let hasHeader = false;
      const errors: string[] = [];
      const warnings: string[] = [];

      try {
        const { parser, format: detectedFormat, detection } = await this.registry.getParser(filePath, parseOptions);
        format = detectedFormat;
        confidence = detection.confidence;

        if (confidence < 0.7) {
          warnings.push(`Low confidence in format detection (${(confidence * 100).toFixed(1)}%)`);
        }

        // Parser validation
        const validation = await parser.validate(filePath);
        if (!validation.canProceed) {
          errors.push(...validation.errors);
        }
        warnings.push(...validation.warnings);

        // Quick structure analysis
        let rowCount = 0;
        try {
          for await (const row of parser.parse(filePath, { 
            maxRows: 10, 
            hasHeader: true,
            encoding: parseOptions.encoding,
            delimiter: parseOptions.delimiter
          })) {
            if (rowCount === 0) {
              columns = row.data.length;
              hasHeader = this.detectHeaderRow(row.data, format);
            }
            rowCount++;
            if (rowCount >= 10) break;
          }

          // Estimate total rows
          estimatedRows = Math.floor(stats.size / (columns * 15)); // Rough estimate
        } catch (parseError) {
          errors.push(`Structure validation failed: ${parseError.message}`);
        }
      } catch (detectionError) {
        errors.push(`Format detection failed: ${detectionError.message}`);
        format = 'unknown';
        confidence = 0;
      }

      // Resource estimation
      const fileSizeMB = stats.size / 1024 / 1024;
      const estimatedProcessingTime = this.estimateProcessingTime(fileSizeMB, estimatedRows, options);
      const estimatedMemoryUsage = this.estimateMemoryUsage(fileSizeMB, columns, options);

      // Large file warnings
      if (fileSizeMB > 500) {
        warnings.push(`Large file detected (${fileSizeMB.toFixed(1)}MB) - consider using sampling options`);
      }
      if (estimatedRows > 1000000) {
        warnings.push(`High row count estimated (${estimatedRows.toLocaleString()}) - processing may be slow`);
      }

      return {
        filePath,
        valid: errors.length === 0,
        format,
        confidence,
        fileSize: stats.size,
        fileSizeMB,
        estimatedRows,
        columns,
        hasHeader,
        estimatedProcessingTime,
        estimatedMemoryUsage,
        errors,
        warnings,
      };
    } catch (error) {
      return {
        filePath,
        valid: false,
        fileSize: 0,
        fileSizeMB: 0,
        estimatedProcessingTime: 0,
        estimatedMemoryUsage: 0,
        errors: [`Validation error: ${error.message || error}`],
        warnings: [],
      };
    }
  }

  /**
   * Generate analysis plan based on command and options
   */
  private generateAnalysisPlan(options: CLIOptions, isMultiFile: boolean): {
    command: string;
    sections: string[];
    analysisType: string;
    executionMode: string;
    description: string;
    estimatedSteps: number;
  } {
    const requestedSections = this.getRequestedSections(options);
    const shouldUseSequential = this.shouldUseSequentialExecution(requestedSections, options);
    
    let analysisType = 'single-file';
    let description = 'Standard single-file analysis';
    
    if (isMultiFile) {
      analysisType = 'multi-file-join';
      description = 'Multi-file join relationship analysis';
    }

    const executionMode = shouldUseSequential ? 'sequential-dependency-resolved' : 'individual-sections';
    const estimatedSteps = requestedSections.length + (isMultiFile ? 2 : 1); // +1 for parsing, +1 for join analysis

    return {
      command: options.command || 'all',
      sections: requestedSections,
      analysisType,
      executionMode,
      description,
      estimatedSteps,
    };
  }

  /**
   * Display comprehensive dry-run results
   */
  private displayDryRunResults(
    validationResults: any[],
    analysisPlan: any,
    totalEstimatedTime: number,
    totalEstimatedMemory: number,
    options: CLIOptions
  ): void {
    const path = require('path');

    // File validation results
    console.log('\n📁 FILE VALIDATION RESULTS:');
    validationResults.forEach((result, index) => {
      const fileName = path.basename(result.filePath);
      const status = result.valid ? '✅ VALID' : '❌ INVALID';
      
      console.log(`\n   ${index + 1}. ${fileName} - ${status}`);
      console.log(`      Path: ${result.filePath}`);
      console.log(`      Size: ${result.fileSizeMB.toFixed(1)} MB (${result.fileSize.toLocaleString()} bytes)`);
      
      if (result.format) {
        console.log(`      Format: ${result.format} (${(result.confidence * 100).toFixed(1)}% confidence)`);
      }
      
      if (result.estimatedRows) {
        console.log(`      Estimated Rows: ${result.estimatedRows.toLocaleString()}`);
        console.log(`      Columns: ${result.columns}`);
        console.log(`      Has Header: ${result.hasHeader ? 'Yes' : 'No'}`);
      }

      if (result.errors.length > 0) {
        console.log(`      ❌ Errors:`);
        result.errors.forEach(error => console.log(`         • ${error}`));
      }

      if (result.warnings.length > 0) {
        console.log(`      ⚠️  Warnings:`);
        result.warnings.forEach(warning => console.log(`         • ${warning}`));
      }
    });

    // Analysis plan
    console.log('\n📋 ANALYSIS PLAN:');
    console.log(`   Command: ${analysisPlan.command}`);
    console.log(`   Description: ${analysisPlan.description}`);
    console.log(`   Analysis Type: ${analysisPlan.analysisType}`);
    console.log(`   Execution Mode: ${analysisPlan.executionMode}`);
    console.log(`   Sections to Execute: ${analysisPlan.sections.join(', ')}`);
    console.log(`   Estimated Steps: ${analysisPlan.estimatedSteps}`);

    // Section descriptions
    console.log('\n🔍 SECTIONS THAT WOULD BE EXECUTED:');
    const sectionDescriptions = {
      section1: 'Overview - File metadata, structure analysis, data profiling',
      section2: 'Quality - Data quality audit, missing values, outliers, duplicates',
      section3: 'EDA - Exploratory data analysis, statistical distributions, correlations',
      section4: 'Visualization - Chart recommendations, accessibility optimization',
      section5: 'Engineering - Schema optimization, ML readiness, feature engineering',
      section6: 'Modeling - Algorithm selection, model validation strategies',
    };

    analysisPlan.sections.forEach((section: string, index: number) => {
      const description = sectionDescriptions[section] || 'Unknown section';
      console.log(`   ${index + 1}. ${section.toUpperCase()}: ${description}`);
    });

    // Resource estimates
    console.log('\n⚡ RESOURCE ESTIMATES:');
    console.log(`   Estimated Processing Time: ${this.formatTime(totalEstimatedTime)}`);
    console.log(`   Estimated Memory Usage: ${totalEstimatedMemory.toFixed(1)} MB`);
    console.log(`   Files to Process: ${validationResults.length}`);

    // Configuration summary
    console.log('\n⚙️  CONFIGURATION SUMMARY:');
    if (options.maxRows) {
      console.log(`   Max Rows: ${options.maxRows.toLocaleString()}`);
    }
    if (options.delimiter) {
      console.log(`   Delimiter: "${options.delimiter}"`);
    }
    if (options.encoding) {
      console.log(`   Encoding: ${options.encoding}`);
    }
    if (options.samplePercentage) {
      console.log(`   Sampling: ${(options.samplePercentage * 100).toFixed(1)}%`);
    }
    if (options.preset) {
      console.log(`   Performance Preset: ${options.preset}`);
    }
    
    console.log(`   Output Format: ${options.format || 'json'}`);
    console.log(`   Verbose Mode: ${options.verbose ? 'Enabled' : 'Disabled'}`);

    console.log('\n✨ This is a dry run - no analysis was performed.');
    console.log('   Remove --dry-run flag to execute the analysis.');
  }

  /**
   * Estimate processing time based on file characteristics
   */
  private estimateProcessingTime(fileSizeMB: number, estimatedRows: number, options: CLIOptions): number {
    const baseTimePerMB = 2000; // 2 seconds per MB baseline
    const sectionsCount = this.getRequestedSections(options).length;
    
    let multiplier = sectionsCount * 0.2; // Each section adds time
    
    // Adjust for specific operations
    if (options.enableHashing !== false) multiplier += 0.1;
    if (options.maxRows && options.maxRows < estimatedRows) {
      multiplier *= (options.maxRows / estimatedRows); // Sampling reduces time
    }
    
    return Math.ceil(fileSizeMB * baseTimePerMB * multiplier);
  }

  /**
   * Estimate memory usage based on file characteristics
   */
  private estimateMemoryUsage(fileSizeMB: number, columns: number, options: CLIOptions): number {
    const baseMemoryRatio = 2.5; // 2.5x file size as baseline
    let memoryUsage = fileSizeMB * baseMemoryRatio;
    
    // Adjust for operations
    if (columns > 50) memoryUsage *= 1.2; // More columns need more memory
    if (options.enableCaching) memoryUsage *= 1.3; // Caching uses more memory
    if (options.chunkSize && options.chunkSize < 1000) memoryUsage *= 0.8; // Smaller chunks use less memory
    
    return Math.min(memoryUsage, options.maxMemory || 1000); // Cap at max memory setting
  }

  /**
   * Format time duration for display
   */
  private formatTime(milliseconds: number): string {
    if (milliseconds < 1000) {
      return `${milliseconds}ms`;
    } else if (milliseconds < 60000) {
      return `${(milliseconds / 1000).toFixed(1)}s`;
    } else {
      const minutes = Math.floor(milliseconds / 60000);
      const seconds = Math.floor((milliseconds % 60000) / 1000);
      return `${minutes}m ${seconds}s`;
    }
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
