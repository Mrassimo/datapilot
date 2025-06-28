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
