#!/usr/bin/env node

/**
 * DataPilot CLI - Main entry point
 * A lightweight CLI statistical computation engine for comprehensive CSV data analysis
 */

import { dirname } from 'path';
import { mkdirSync, writeFileSync } from 'fs';
import { ArgumentParser } from './argument-parser';
import { ProgressReporter } from './progress-reporter';
import { OutputManager } from './output-manager';
import { AnalyzerDependencyResolver } from './dependency-resolver';
import { Section1Analyzer } from '../analyzers/overview';
import { Section2Analyzer } from '../analyzers/quality';
import { Section2Formatter } from '../analyzers/quality/section2-formatter';
import { StreamingAnalyzer } from '../analyzers/streaming/streaming-analyzer';
import { Section3Formatter } from '../analyzers/eda/section3-formatter';
import { Section4Analyzer, Section4Formatter } from '../analyzers/visualization';
import {
  RecommendationType,
  AccessibilityLevel,
  ComplexityLevel,
} from '../analyzers/visualization/types';
import { Section5Analyzer, Section5Formatter } from '../analyzers/engineering';
import { Section6Analyzer, Section6Formatter } from '../analyzers/modeling';
import type { ModelingTaskType } from '../analyzers/modeling/types';
import { CSVParser } from '../parsers/csv-parser';
import { UniversalAnalyzer } from './universal-analyzer';
import type { LogContext } from '../utils/logger';
import { logger, LogLevel, LogUtils } from '../utils/logger';
import { DataPilotError, ErrorSeverity, ErrorCategory } from '../core/types';
import { globalErrorHandler, ErrorUtils } from '../utils/error-handler';
import { Validator } from '../utils/validation';
import {
  globalMemoryManager,
  globalResourceManager,
  globalCleanupHandler,
} from '../utils/memory-manager';
import { RetryManager, RetryUtils } from '../utils/retry';
import type { CLIResult, CLIOptions } from './types';
import { ValidationError, FileError } from './types';
import { DataType } from '../core/types';
import type { Section1Result } from '../analyzers/overview/types';
import type { Section2Result } from '../analyzers/quality/types';
import type { Section3Result } from '../analyzers/eda/types';
import type { Section4Result } from '../analyzers/visualization/types';
import type { Section5Result } from '../analyzers/engineering/types';
import type { Section6Result } from '../analyzers/modeling/types';

// Union type for all section results
type SectionResult =
  | Section1Result
  | Section2Result
  | Section3Result
  | Section4Result
  | Section5Result
  | Section6Result;

// Generic analysis configuration with proper typing
interface AnalysisConfig<T extends SectionResult = SectionResult> {
  sectionName: string;
  phase: string;
  message: string;
  dependencies?: string[];
  analyzerFactory: (
    filePath: string,
    options: CLIOptions,
    dependencies?: SectionResult[],
  ) => Promise<T>;
  formatterMethod?: (result: T) => string;
  outputMethod: (
    outputManager: OutputManager,
    report: string | null,
    result: T,
    fileName?: string,
  ) => string[];
}

export class DataPilotCLI {
  private argumentParser: ArgumentParser;
  private progressReporter: ProgressReporter;
  private outputManager?: OutputManager;
  private dependencyResolver?: AnalyzerDependencyResolver;
  private dependencyCache = new Map<string, SectionResult>();
  private errorContext: LogContext = {};
  private sectionErrors = new Map<string, DataPilotError[]>();
  private isInitialized = false;

  constructor() {
    this.argumentParser = new ArgumentParser();
    this.progressReporter = new ProgressReporter();

    // Initialize error handling and memory management
    this.initializeErrorHandling();
  }

  /**
   * Register section resolvers for dependency injection
   */
  private registerSectionResolvers(filePath: string, options: CLIOptions): void {
    if (!this.dependencyResolver) {
      this.dependencyResolver = new AnalyzerDependencyResolver(this.errorContext);
    }
    // Section resolvers will be registered as needed by individual analysis methods
  }

  /**
   * Comprehensive input validation with actionable feedback
   */
  private async validateInputs(filePath: string, options: CLIOptions): Promise<string> {
    this.errorContext = {
      operation: 'validation',
      filePath,
    };

    // Use basic file validation first
    const basicValidation = this.argumentParser.validateFile(filePath);

    // Enhanced validation using new validation system
    const enhancedValidation = Validator.validateAll(basicValidation, options);

    // Report warnings
    if (enhancedValidation.warnings.length > 0) {
      logger.warn(
        `Found ${enhancedValidation.warnings.length} validation warnings:`,
        this.errorContext,
      );
      enhancedValidation.warnings.forEach((warning) => {
        console.warn(`⚠️  ${warning.getFormattedMessage()}`);
        const suggestions = warning.getSuggestions();
        if (suggestions.length > 0) {
          console.warn('   Suggestions:');
          suggestions.forEach((suggestion) => console.warn(`     ${suggestion}`));
        }
      });
    }

    // Handle errors
    if (enhancedValidation.errors.length > 0) {
      const firstError = enhancedValidation.errors[0];

      // Show all errors in verbose mode
      if (options.verbose && enhancedValidation.errors.length > 1) {
        console.error(`\n❌ Found ${enhancedValidation.errors.length} validation errors:`);
        enhancedValidation.errors.forEach((error, index) => {
          console.error(`   ${index + 1}. ${error.getFormattedMessage()}`);
        });
        console.error('\nAddressing the first error:');
      }

      throw firstError;
    }

    return basicValidation;
  }

  /**
   * Initialize comprehensive error handling systems
   */
  private initializeErrorHandling(): void {
    // Start memory monitoring
    globalMemoryManager.startMonitoring({ analyzer: 'CLI', operation: 'initialization' });

    // Register cleanup callbacks
    globalMemoryManager.registerCleanupCallback(() => {
      logger.debug('Memory cleanup: clearing dependency cache');
      this.dependencyCache.clear();
    });

    globalResourceManager.register(
      'cli-progress',
      () => {
        this.progressReporter.cleanup();
      },
      'ui',
    );

    globalResourceManager.register(
      'cli-output',
      () => {
        if (this.outputManager) {
          // Cleanup any open file handles in output manager
          logger.debug('Cleaning up output manager resources');
        }
      },
      'io',
    );

    // Register global cleanup handler
    globalCleanupHandler.register(async () => {
      logger.debug('CLI cleanup: stopping memory monitoring');
      globalMemoryManager.stopMonitoring();
      this.dependencyCache.clear();
    });
  }

  /**
   * Main CLI execution entry point
   */
  async run(argv: string[] = process.argv): Promise<CLIResult> {
    try {
      // Parse command line arguments
      const context = this.argumentParser.parse(argv);

      // Handle help and version commands
      if (context.command === 'help' || context.args.length === 0) {
        this.argumentParser.showHelp();
        return { success: true, exitCode: 0 };
      }

      // Get the actual command context from the parser
      const commandContext = this.argumentParser.getLastContext();
      if (!commandContext) {
        throw new ValidationError('No command specified');
      }

      // Configure logger based on CLI options
      if (commandContext.options.quiet) {
        logger.setLevel(LogLevel.ERROR);
      } else if (commandContext.options.verbose) {
        logger.setLevel(LogLevel.DEBUG);
      } else {
        logger.setLevel(LogLevel.INFO);
      }

      // Set up progress reporting and output management with merged options
      this.progressReporter = new ProgressReporter(
        commandContext.options.quiet || false,
        commandContext.options.verbose || false,
      );

      this.outputManager = new OutputManager(commandContext.options);

      // Comprehensive input validation
      const validatedFilePath = await this.validateInputs(
        commandContext.file,
        commandContext.options,
      );

      // Execute the appropriate command
      const result = await this.executeCommand(
        commandContext.command,
        validatedFilePath,
        commandContext.options,
        context.startTime,
      );

      return result;
    } catch (error) {
      return this.handleError(error);
    } finally {
      this.progressReporter.cleanup();
    }
  }

  /**
   * Generic analysis execution method with comprehensive error handling
   */
  private async executeGenericAnalysis(
    config: AnalysisConfig,
    filePath: string,
    options: CLIOptions,
    startTime: number,
  ): Promise<CLIResult> {
    if (!this.outputManager) {
      throw new Error('Output manager not initialised');
    }

    const analysisContext: LogContext = {
      section: config.sectionName,
      analyzer: config.sectionName,
      filePath,
      operation: 'genericAnalysis',
    };

    return await this.executeWithErrorPropagation(
      async () => {
        this.progressReporter.startPhase(config.phase, config.message);

        // Handle dependencies with error propagation
        const dependencies: SectionResult[] = [];
        if (config.dependencies) {
          for (let i = 0; i < config.dependencies.length; i++) {
            const depName = config.dependencies[i];
            const progressPercent = ((i + 1) / (config.dependencies.length + 2)) * 100;

            this.progressReporter.updateProgress({
              phase: 'prerequisites',
              progress: progressPercent,
              message: `Running prerequisite ${depName} analysis...`,
              timeElapsed: Date.now() - startTime,
            });

            let depResult = this.dependencyCache.get(depName);
            if (!depResult) {
              // Execute dependency with retry logic for transient failures
              depResult = await RetryUtils.retryAnalysis(
                () => this.executeDependency(depName, filePath, options),
                { ...analysisContext, operation: `dependency_${depName}` },
              );
              this.dependencyCache.set(depName, depResult);
            }
            dependencies.push(depResult);
          }
        }

        // Check memory before main analysis
        globalMemoryManager.checkMemoryUsage(analysisContext);

        // Run the main analysis with memory monitoring
        const finalProgressPercent = config.dependencies ? 80 : 50;
        this.progressReporter.updateProgress({
          phase: config.sectionName,
          progress: finalProgressPercent,
          message: `Running ${config.sectionName} analysis...`,
          timeElapsed: Date.now() - startTime,
        });

        // Execute main analysis with retry logic
        const result = await RetryUtils.retryAnalysis(
          () => config.analyzerFactory(filePath, options, dependencies),
          analysisContext,
        );

        const processingTime = Date.now() - startTime;
        this.progressReporter.completePhase(
          `${config.sectionName} analysis completed`,
          processingTime,
        );

        // Generate report if formatter is provided
        let report: string | null = null;
        if (config.formatterMethod) {
          try {
            report = config.formatterMethod(result);
          } catch (formatError) {
            logger.warn(
              `Failed to format ${config.sectionName} report, using raw data`,
              analysisContext,
              formatError,
            );
            report = JSON.stringify(result, null, 2); // Fallback to JSON
          }
        }

        // Generate output files with error handling
        let outputFiles: string[] = [];
        try {
          outputFiles = config.outputMethod(
            this.outputManager,
            report,
            result,
            filePath.split('/').pop(),
          );
        } catch (outputError) {
          logger.warn(
            `Failed to generate ${config.sectionName} output files`,
            analysisContext,
            outputError,
          );
          // Continue without output files in case of output errors
        }

        // Calculate stats with safe property access
        const rowsProcessed = Number(
          ErrorUtils.safeGet(result, 'overview.structuralDimensions.totalDataRows') ||
            ErrorUtils.safeGet(result, 'performanceMetrics.rowsAnalyzed') ||
            ErrorUtils.safeGet(result, 'stats.rowsProcessed') ||
            0,
        );

        const warnings = Array.isArray(result.warnings) ? result.warnings.length : 0;
        const errors = this.sectionErrors.get(config.sectionName)?.length || 0;

        // Log memory usage after analysis
        logger.memory(analysisContext);

        // Show summary
        this.progressReporter.showSummary({
          processingTime,
          rowsProcessed,
          warnings,
          errors,
        });

        return {
          success: true,
          exitCode: 0,
          outputFiles,
          stats: {
            processingTime,
            rowsProcessed,
            warnings,
            errors,
          },
        };
      },
      config.sectionName,
      undefined, // dependencies are handled internally
      analysisContext,
    ).catch((error) => {
      this.progressReporter.errorPhase(`${config.sectionName} analysis failed`);

      // Record section-specific errors
      const sectionErrors = this.sectionErrors.get(config.sectionName) || [];
      if (error instanceof DataPilotError) {
        sectionErrors.push(error);
      }
      this.sectionErrors.set(config.sectionName, sectionErrors);

      throw error;
    });
  }

  /**
   * Determine if universal analyzer should be used based on file extension
   */
  private shouldUseUniversalAnalyzer(filePath: string): boolean {
    const extension = filePath.toLowerCase().split('.').pop();
    // Use universal analyzer for non-CSV formats
    return ['json', 'jsonl', 'ndjson', 'xlsx', 'xls', 'xlsm', 'tsv', 'tab'].includes(
      extension || '',
    );
  }

  /**
   * Execute command using universal analyzer for multi-format support
   */
  private async executeUniversalCommand(
    command: string,
    filePath: string,
    options: CLIOptions,
    startTime: number,
  ): Promise<CLIResult> {
    try {
      const analyzer = new UniversalAnalyzer();

      this.progressReporter.startPhase(
        'universal-analysis',
        `Starting ${command} analysis with multi-format support...`,
      );

      // Run universal analysis
      const result = await analyzer.analyzeFile(filePath, { ...options, command });

      const processingTime = Date.now() - startTime;
      this.progressReporter.completePhase('Universal analysis completed', processingTime);

      // Convert universal result to CLI format
      if (result.success) {
        // Generate appropriate output files based on command
        const outputFiles = this.generateUniversalOutput(result, command, filePath, options);

        this.progressReporter.showSummary({
          processingTime,
          rowsProcessed: result.metadata?.parserStats?.rowsProcessed || 0,
          warnings: 0, // Universal analyzer handles warnings internally
          errors: 0,
        });

        return {
          success: true,
          exitCode: 0,
          outputFiles,
          stats: {
            processingTime,
            rowsProcessed: result.metadata?.parserStats?.rowsProcessed || 0,
            warnings: 0,
            errors: 0,
          },
        };
      } else {
        throw new Error(result.error || 'Universal analysis failed');
      }
    } catch (error) {
      this.progressReporter.errorPhase('Universal analysis failed');
      throw error;
    }
  }

  /**
   * Generate output files for universal analysis results
   */
  private generateUniversalOutput(
    result: any,
    command: string,
    filePath: string,
    options: CLIOptions,
  ): string[] {
    if (!this.outputManager) {
      return [];
    }

    const fileName =
      filePath
        .split('/')
        .pop()
        ?.replace(/\.[^/.]+$/, '') || 'analysis';
    const outputFiles: string[] = [];

    try {
      // Generate format-agnostic output
      const format = result.metadata?.originalFormat || 'unknown';
      const analysisData = result.data;

      // Create markdown report
      const report = this.formatUniversalReport(analysisData, command, format, fileName);
      const reportFile = `${fileName}_${command}_${format}_analysis.md`;
      this.writeToFile(reportFile, report);
      outputFiles.push(reportFile);

      // Generate JSON output if requested
      if (options.output === 'json') {
        const jsonFile = `${fileName}_${command}_${format}_analysis.json`;
        this.writeToFile(jsonFile, JSON.stringify(result, null, 2));
        outputFiles.push(jsonFile);
      }

      return outputFiles;
    } catch (error) {
      logger.warn('Failed to generate universal output files', { error: error.message });
      return [];
    }
  }

  /**
   * Format universal analysis report
   */
  private formatUniversalReport(
    analysisData: any,
    command: string,
    format: string,
    fileName: string,
  ): string {
    const timestamp = new Date().toISOString();

    let report = `# 🤖 DataPilot Multi-Format Analysis Report\n\n`;
    report += `**File**: ${fileName}\n`;
    report += `**Format**: ${format.toUpperCase()}\n`;
    report += `**Analysis Type**: ${command}\n`;
    report += `**Generated**: ${timestamp}\n`;
    report += `**DataPilot Version**: 1.2.1 (Multi-Format Edition)\n\n`;

    report += `---\n\n`;

    // Add format-specific information
    report += `## 📊 Format Analysis\n\n`;
    report += `DataPilot successfully detected and processed your **${format.toUpperCase()}** file using the universal parser system. `;
    report += `The analysis pipeline was automatically adapted to handle the specific characteristics of this format.\n\n`;

    // Add analysis results based on command
    if (analysisData) {
      report += `## 📈 Analysis Results\n\n`;

      // Format the results based on available sections
      Object.keys(analysisData).forEach((sectionKey) => {
        const sectionData = analysisData[sectionKey];
        if (sectionData && typeof sectionData === 'object') {
          report += `### ${sectionKey.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}\n\n`;

          // Basic formatting of section data
          if (sectionData.summary) {
            report += `${sectionData.summary}\n\n`;
          } else {
            report += `Analysis completed successfully. Detailed results available in JSON format.\n\n`;
          }
        }
      });
    }

    report += `---\n\n`;
    report += `## 🎯 Multi-Format Support\n\n`;
    report += `This analysis was performed using DataPilot's universal parser system, which supports:\n`;
    report += `- **CSV**: Comma-separated values with auto-detection\n`;
    report += `- **TSV**: Tab-separated values\n`;
    report += `- **JSON**: Single objects, arrays, and JSON Lines (JSONL)\n`;
    report += `- **Excel**: .xlsx, .xls, and .xlsm formats\n\n`;

    report += `The same comprehensive statistical analysis is available regardless of your data format.\n\n`;
    report += `**Generated by DataPilot v1.2.1** - Universal Data Analysis Engine\n`;

    return report;
  }

  /**
   * Execute dependency analysis and cache results
   */
  private async executeDependency(
    depName: string,
    filePath: string,
    options: CLIOptions,
  ): Promise<SectionResult> {
    switch (depName) {
      case 'section1':
        const section1Analyzer = new Section1Analyzer({
          enableFileHashing: options.enableHashing !== false,
          includeHostEnvironment: options.includeEnvironment !== false,
          privacyMode: options.privacyMode || 'redacted',
          detailedProfiling: options.verbose || false,
          maxSampleSizeForSparsity: 10000,
        });
        return await section1Analyzer.analyze(
          filePath,
          `datapilot ${options.command || 'analysis'} ${filePath}`,
          [],
        );

      case 'section2':
        // Parse CSV for Section 2
        const parser = new CSVParser({
          autoDetect: true,
          maxRows: options.maxRows || 100000,
          trimFields: true,
        });
        const rows = await parser.parseFile(filePath);
        if (rows.length === 0) {
          throw new ValidationError('No data found in file');
        }
        const hasHeader = parser.getOptions().hasHeader !== false;
        const dataStartIndex = hasHeader ? 1 : 0;
        const headers =
          hasHeader && rows.length > 0
            ? rows[0].data
            : rows[0].data.map((_, i) => `Column_${i + 1}`);
        const data = rows.slice(dataStartIndex).map((row) => row.data);
        const columnTypes = headers.map(() => DataType.STRING);

        const section2Analyzer = new Section2Analyzer({
          data,
          headers,
          columnTypes,
          rowCount: data.length,
          columnCount: headers.length,
          config: {
            enabledDimensions: ['completeness', 'uniqueness', 'validity'],
            strictMode: false,
            maxOutlierDetection: 100,
            semanticDuplicateThreshold: 0.85,
          },
        });
        return await section2Analyzer.analyze();

      case 'section3':
        const section3Analyzer = new StreamingAnalyzer({
          chunkSize: options.chunkSize || 500,
          memoryThresholdMB: options.memoryLimit || 100,
          maxRowsAnalyzed: options.maxRows || 500000,
          enabledAnalyses: ['univariate', 'bivariate', 'correlations'],
          significanceLevel: 0.05,
          maxCorrelationPairs: 50,
          enableMultivariate: true,
        });
        return await section3Analyzer.analyzeFile(filePath);

      default:
        throw new Error(`Unknown dependency: ${depName}`);
    }
  }

  /**
   * Execute specific CLI command
   */
  private async executeCommand(
    command: string,
    filePath: string,
    options: CLIOptions,
    startTime: number,
  ): Promise<CLIResult> {
    // Check if universal analyzer should be used (for multi-format support)
    const shouldUseUniversal = options.format || this.shouldUseUniversalAnalyzer(filePath);

    if (shouldUseUniversal) {
      return await this.executeUniversalCommand(command, filePath, options, startTime);
    }

    // Clear dependency resolver for each command
    if (this.dependencyResolver) {
      this.dependencyResolver.clear();
    }

    // Register resolvers for the sections we'll need
    this.registerSectionResolvers(filePath, options);

    switch (command) {
      case 'all':
        return await this.executeFullAnalysis(filePath, options, startTime);

      case 'overview':
        return await this.executeGenericAnalysis(
          {
            sectionName: 'Section 1',
            phase: 'analysis',
            message: 'Starting dataset analysis...',
            analyzerFactory: async (filePath, options) => {
              const analyzer = new Section1Analyzer({
                enableFileHashing: options.enableHashing !== false,
                includeHostEnvironment: options.includeEnvironment !== false,
                privacyMode: options.privacyMode || 'redacted',
                detailedProfiling: options.verbose || false,
                maxSampleSizeForSparsity: 10000,
              });
              return await analyzer.analyze(
                filePath,
                `datapilot ${options.command || 'overview'} ${filePath}`,
                ['overview'],
              );
            },
            outputMethod: (outputManager, report, result, fileName) =>
              outputManager.outputSection1(result as Section1Result, fileName),
          },
          filePath,
          options,
          startTime,
        );

      case 'quality':
        return await this.executeGenericAnalysis(
          {
            sectionName: 'Section 2',
            phase: 'quality',
            message: 'Starting data quality analysis...',
            analyzerFactory: async (filePath, options) => {
              // Parse CSV to get data for Section 2
              const parser = new CSVParser({
                autoDetect: true,
                maxRows: options.maxRows || 100000,
                trimFields: true,
              });
              const rows = await parser.parseFile(filePath);
              if (rows.length === 0) {
                throw new ValidationError('No data found in file');
              }
              const hasHeader = parser.getOptions().hasHeader !== false;
              const dataStartIndex = hasHeader ? 1 : 0;
              const headers =
                hasHeader && rows.length > 0
                  ? rows[0].data
                  : rows[0].data.map((_, i) => `Column_${i + 1}`);
              const data = rows.slice(dataStartIndex).map((row) => row.data);
              const columnTypes = headers.map(() => DataType.STRING);

              const analyzer = new Section2Analyzer({
                data,
                headers,
                columnTypes,
                rowCount: data.length,
                columnCount: headers.length,
                config: {
                  enabledDimensions: ['completeness', 'uniqueness', 'validity'],
                  strictMode: false,
                  maxOutlierDetection: 100,
                  semanticDuplicateThreshold: 0.85,
                },
              });
              return await analyzer.analyze();
            },
            formatterMethod: (result) =>
              Section2Formatter.formatReport((result as Section2Result).qualityAudit),
            outputMethod: (outputManager, report, result, fileName) =>
              outputManager.outputSection2(result as Section2Result),
          },
          filePath,
          options,
          startTime,
        );

      case 'eda':
        return await this.executeGenericAnalysis(
          {
            sectionName: 'Section 3',
            phase: 'eda',
            message: 'Starting exploratory data analysis...',
            analyzerFactory: async (filePath, options) => {
              const analyzer = new StreamingAnalyzer({
                chunkSize: options.chunkSize || 500,
                memoryThresholdMB: options.memoryLimit || 100,
                maxRowsAnalyzed: options.maxRows || 500000,
                enabledAnalyses: ['univariate', 'bivariate', 'correlations'],
                significanceLevel: 0.05,
                maxCorrelationPairs: 50,
                enableMultivariate: true,
              });
              return await analyzer.analyzeFile(filePath);
            },
            formatterMethod: (result) => Section3Formatter.formatSection3(result as Section3Result),
            outputMethod: (outputManager, report, result, fileName) =>
              outputManager.outputSection3(report, result as Section3Result, fileName),
          },
          filePath,
          options,
          startTime,
        );

      case 'viz':
        return await this.executeGenericAnalysis(
          {
            sectionName: 'Section 4',
            phase: 'section4',
            message: 'Starting visualization intelligence analysis...',
            dependencies: ['section1', 'section3'],
            analyzerFactory: async (filePath, options, dependencies) => {
              const [section1Data, section3Data] = dependencies;
              const analyzer = new Section4Analyzer({
                accessibilityLevel:
                  (options.accessibility as AccessibilityLevel) || AccessibilityLevel.GOOD,
                complexityThreshold:
                  (options.complexity as ComplexityLevel) || ComplexityLevel.MODERATE,
                maxRecommendationsPerChart: options.maxRecommendations || 3,
                includeCodeExamples: options.includeCode || false,
                enabledRecommendations: [
                  RecommendationType.UNIVARIATE,
                  RecommendationType.BIVARIATE,
                  RecommendationType.DASHBOARD,
                  RecommendationType.ACCESSIBILITY,
                  RecommendationType.PERFORMANCE,
                ],
                targetLibraries: ['d3', 'plotly', 'observable'],
              });
              return await analyzer.analyze(
                section1Data as Section1Result,
                section3Data as Section3Result,
              );
            },
            formatterMethod: (result) => Section4Formatter.formatSection4(result as Section4Result),
            outputMethod: (outputManager, report, result, fileName) =>
              outputManager.outputSection4(report, result as Section4Result, fileName),
          },
          filePath,
          options,
          startTime,
        );

      case 'engineering':
        return await this.executeGenericAnalysis(
          {
            sectionName: 'Section 5',
            phase: 'engineering',
            message: 'Starting data engineering analysis...',
            dependencies: ['section1', 'section2', 'section3'],
            analyzerFactory: async (filePath, options, dependencies) => {
              const [section1Data, section2Data, section3Data] = dependencies;
              const analyzer = new Section5Analyzer({
                targetDatabaseSystem:
                  (options.database as 'postgresql' | 'mysql' | 'sqlite' | 'generic_sql') ||
                  'postgresql',
                mlFrameworkTarget:
                  (options.framework as 'scikit_learn' | 'pytorch' | 'tensorflow' | 'generic') ||
                  'scikit_learn',
              });
              return await analyzer.analyze(
                section1Data as Section1Result,
                section2Data as Section2Result,
                section3Data as Section3Result,
              );
            },
            formatterMethod: (result) => Section5Formatter.formatMarkdown(result as Section5Result),
            outputMethod: (outputManager, report, result, fileName) =>
              outputManager.outputSection5(report, result as Section5Result, fileName),
          },
          filePath,
          options,
          startTime,
        );

      case 'modeling':
        return await this.executeGenericAnalysis(
          {
            sectionName: 'Section 6',
            phase: 'modeling',
            message: 'Starting predictive modeling analysis...',
            dependencies: ['section1', 'section2', 'section3'],
            analyzerFactory: async (filePath, options, dependencies) => {
              const [section1Data, section2Data, section3Data] = dependencies;

              // Need Section 5 result as well
              const section5Analyzer = new Section5Analyzer({
                targetDatabaseSystem:
                  (options.database as 'postgresql' | 'mysql' | 'sqlite' | 'generic_sql') ||
                  'postgresql',
                mlFrameworkTarget:
                  (options.framework as 'scikit_learn' | 'pytorch' | 'tensorflow' | 'generic') ||
                  'scikit_learn',
              });
              const section5Result = await section5Analyzer.analyze(
                section1Data as Section1Result,
                section2Data as Section2Result,
                section3Data as Section3Result,
              );

              const analyzer = new Section6Analyzer({
                focusAreas: (options.focus as ModelingTaskType[]) || [
                  'regression',
                  'binary_classification',
                  'clustering',
                ],
                complexityPreference: options.complexity || 'moderate',
                interpretabilityRequirement: options.interpretability || 'medium',
              });
              return await analyzer.analyze(
                section1Data as Section1Result,
                section2Data as Section2Result,
                section3Data as Section3Result,
                section5Result,
              );
            },
            formatterMethod: (result) => Section6Formatter.formatMarkdown(result as Section6Result),
            outputMethod: (outputManager, report, result, fileName) =>
              outputManager.outputSection6(report, result as Section6Result, fileName),
          },
          filePath,
          options,
          startTime,
        );

      case 'validate':
        return await this.executeValidation(filePath, options);

      case 'info':
        return await this.executeInfo(filePath);

      default:
        throw new ValidationError(`Unknown command: ${command}`);
    }
  }

  /**
   * Execute Section 1 (Overview) analysis
   */
  private async executeSection1Analysis(
    filePath: string,
    options: any,
    startTime: number,
  ): Promise<CLIResult> {
    if (!this.outputManager) {
      throw new Error('Output manager not initialised');
    }

    // Set up progress callback
    const progressCallback = (phase: string, progress: number, message: string) => {
      this.progressReporter.updateProgress({
        phase,
        progress,
        message,
        timeElapsed: Date.now() - startTime,
      });
    };

    try {
      // Create analyzer with progress reporting
      const analyzer = new Section1Analyzer({
        enableFileHashing: options.enableHashing !== false,
        includeHostEnvironment: options.includeEnvironment !== false,
        privacyMode: options.privacyMode || 'redacted',
        detailedProfiling: options.verbose || false,
        maxSampleSizeForSparsity: 10000,
      });

      // Set up progress callback if analyzer supports it
      if ('setProgressCallback' in analyzer) {
        (analyzer as any).setProgressCallback(progressCallback);
      }

      this.progressReporter.startPhase('analysis', 'Starting dataset analysis...');

      // Perform the analysis
      const result = await analyzer.analyze(
        filePath,
        `datapilot ${options.command || 'overview'} ${filePath}`,
        ['overview'],
      );

      const processingTime = Date.now() - startTime;
      this.progressReporter.completePhase('Analysis completed', processingTime);

      // Generate output
      const outputFiles = this.outputManager.outputSection1(result, filePath.split('/').pop());

      // Show summary
      this.progressReporter.showSummary({
        processingTime,
        rowsProcessed: result.overview.structuralDimensions.totalDataRows || 0,
        warnings: result.warnings.length,
        errors: 0,
      });

      return {
        success: true,
        exitCode: 0,
        outputFiles,
        stats: {
          processingTime,
          rowsProcessed: result.overview.structuralDimensions.totalDataRows || 0,
          warnings: result.warnings.length,
          errors: 0,
        },
      };
    } catch (error) {
      this.progressReporter.errorPhase('Analysis failed');
      throw error;
    }
  }

  /**
   * Execute Section 2 (Data Quality) analysis
   */
  private async executeSection2Analysis(
    filePath: string,
    options: any,
    startTime: number,
  ): Promise<CLIResult> {
    if (!this.outputManager) {
      throw new Error('Output manager not initialised');
    }

    try {
      this.progressReporter.startPhase('quality', 'Starting data quality analysis...');

      // Parse CSV to get data for Section 2
      this.progressReporter.updateProgress({
        phase: 'parsing',
        progress: 25,
        message: 'Loading and parsing CSV data...',
        timeElapsed: Date.now() - startTime,
      });

      const parser = new CSVParser({
        autoDetect: true,
        maxRows: options.maxRows || 100000, // Limit for memory-based Section 2
        trimFields: true,
      });

      const rows = await parser.parseFile(filePath);

      if (rows.length === 0) {
        throw new ValidationError('No data found in file');
      }

      // Prepare data for Section 2
      const hasHeader = parser.getOptions().hasHeader !== false;
      const dataStartIndex = hasHeader ? 1 : 0;
      const headers =
        hasHeader && rows.length > 0 ? rows[0].data : rows[0].data.map((_, i) => `Column_${i + 1}`);

      const data = rows.slice(dataStartIndex).map((row) => row.data);

      // Simple type detection for Section 2
      const columnTypes = headers.map(() => DataType.STRING);

      // Set up progress callback
      const progressCallback = (progress: any) => {
        this.progressReporter.updateProgress({
          phase: progress.stage,
          progress: 50 + progress.percentage * 0.4, // Scale to 50-90%
          message: progress.message,
          timeElapsed: Date.now() - startTime,
        });
      };

      // Create and run Section 2 analyzer
      const analyzer = new Section2Analyzer({
        data,
        headers,
        columnTypes,
        rowCount: data.length,
        columnCount: headers.length,
        config: {
          enabledDimensions: ['completeness', 'uniqueness', 'validity'],
          strictMode: false,
          maxOutlierDetection: 100,
          semanticDuplicateThreshold: 0.85,
        },
        onProgress: progressCallback,
      });

      const result = await analyzer.analyze();

      const processingTime = Date.now() - startTime;
      this.progressReporter.completePhase('Data quality analysis completed', processingTime);

      // Generate output
      const outputFiles = this.outputManager.outputSection2(result, filePath.split('/').pop());

      // Show summary
      this.progressReporter.showSummary({
        processingTime,
        rowsProcessed: data.length,
        warnings: result.warnings.length,
        errors: 0,
      });

      return {
        success: true,
        exitCode: 0,
        outputFiles,
        stats: {
          processingTime,
          rowsProcessed: data.length,
          warnings: result.warnings.length,
          errors: 0,
        },
      };
    } catch (error) {
      this.progressReporter.errorPhase('Data quality analysis failed');
      throw error;
    }
  }

  /**
   * Execute Section 3 (EDA) analysis
   */
  private async executeSection3Analysis(
    filePath: string,
    options: any,
    startTime: number,
  ): Promise<CLIResult> {
    if (!this.outputManager) {
      throw new Error('Output manager not initialised');
    }

    // Set up progress callback
    const progressCallback = (progress: any) => {
      this.progressReporter.updateProgress({
        phase: progress.stage,
        progress: progress.percentage,
        message: progress.message,
        timeElapsed: Date.now() - startTime,
      });
    };

    try {
      // Create streaming analyzer with progress reporting
      const analyzer = new StreamingAnalyzer({
        chunkSize: options.chunkSize || 500,
        memoryThresholdMB: options.memoryLimit || 100,
        maxRowsAnalyzed: options.maxRows || 500000,
        enabledAnalyses: ['univariate', 'bivariate', 'correlations'],
        significanceLevel: 0.05,
        maxCorrelationPairs: 50,
        enableMultivariate: true,
      });

      // Set up progress callback
      analyzer.setProgressCallback(progressCallback);

      this.progressReporter.startPhase('eda', 'Starting exploratory data analysis...');

      // Perform the EDA analysis
      const result = await analyzer.analyzeFile(filePath);

      const processingTime = Date.now() - startTime;
      this.progressReporter.completePhase('EDA analysis completed', processingTime);

      // Generate Section 3 markdown report
      const section3Report = Section3Formatter.formatSection3(result);

      // Generate output files
      const outputFiles = this.outputManager.outputSection3(
        section3Report,
        result,
        filePath.split('/').pop(),
      );

      // Show summary
      this.progressReporter.showSummary({
        processingTime,
        rowsProcessed: result.performanceMetrics?.rowsAnalyzed || 0,
        warnings: result.warnings.length,
        errors: 0,
      });

      return {
        success: true,
        exitCode: 0,
        outputFiles,
        stats: {
          processingTime,
          rowsProcessed: result.performanceMetrics?.rowsAnalyzed || 0,
          warnings: result.warnings.length,
          errors: 0,
        },
      };
    } catch (error) {
      this.progressReporter.errorPhase('EDA analysis failed');
      throw error;
    }
  }

  /**
   * Execute Section 4 (Visualization Intelligence) analysis
   */
  private async executeSection4Analysis(
    filePath: string,
    options: any,
    startTime: number,
  ): Promise<CLIResult> {
    if (!this.outputManager) {
      throw new Error('Output manager not initialised');
    }

    try {
      this.progressReporter.startPhase(
        'section4',
        'Starting visualization intelligence analysis...',
      );

      // Section 4 requires both Section 1 and Section 3 data
      // First run Section 1 analysis
      this.progressReporter.updateProgress({
        phase: 'prerequisites',
        progress: 25,
        message: 'Running prerequisite Section 1 analysis...',
        timeElapsed: Date.now() - startTime,
      });

      const section1Result = await this.executeSection1Analysis(filePath, options, startTime);
      if (!section1Result.success) {
        return section1Result;
      }

      // Then run Section 3 analysis
      this.progressReporter.updateProgress({
        phase: 'prerequisites',
        progress: 50,
        message: 'Running prerequisite Section 3 analysis...',
        timeElapsed: Date.now() - startTime,
      });

      const section3Result = await this.executeSection3Analysis(filePath, options, Date.now());
      if (!section3Result.success) {
        return section3Result;
      }

      // Extract the analysis results from the output files
      this.progressReporter.updateProgress({
        phase: 'visualization',
        progress: 75,
        message: 'Generating visualization recommendations...',
        timeElapsed: Date.now() - startTime,
      });

      // Create Section4Analyzer with user options
      const section4Analyzer = new Section4Analyzer({
        accessibilityLevel: options.accessibility || 'good',
        complexityThreshold: options.complexity || 'moderate',
        maxRecommendationsPerChart: options.maxRecommendations || 3,
        includeCodeExamples: options.includeCode || false,
        enabledRecommendations: [
          RecommendationType.UNIVARIATE,
          RecommendationType.BIVARIATE,
          RecommendationType.DASHBOARD,
          RecommendationType.ACCESSIBILITY,
          RecommendationType.PERFORMANCE,
        ],
        targetLibraries: ['d3', 'plotly', 'observable'],
      });

      // We need to get the actual analysis results, not just CLI results
      // For now, we'll need to re-run the analyses to get the data structures
      // This is not ideal but necessary until we refactor to return analysis results

      // Re-run Section 1 to get actual result data
      const section1Analyzer = new Section1Analyzer({
        enableFileHashing: options.enableHashing !== false,
        includeHostEnvironment: options.includeEnvironment !== false,
        privacyMode: options.privacyMode || 'redacted',
        detailedProfiling: options.verbose || false,
        maxSampleSizeForSparsity: 10000,
      });

      const section1Data = await section1Analyzer.analyze(
        filePath,
        `datapilot ${options.command || 'viz'} ${filePath}`,
        ['overview'],
      );

      // Re-run Section 3 to get actual result data
      const section3Analyzer = new StreamingAnalyzer({
        chunkSize: options.chunkSize || 500,
        memoryThresholdMB: options.memoryLimit || 100,
        maxRowsAnalyzed: options.maxRows || 500000,
        enabledAnalyses: ['univariate', 'bivariate', 'correlations'],
        significanceLevel: 0.05,
        maxCorrelationPairs: 50,
        enableMultivariate: true,
      });

      const section3Data = await section3Analyzer.analyzeFile(filePath);

      // Perform Section 4 analysis
      const section4Result = await section4Analyzer.analyze(section1Data, section3Data);

      const processingTime = Date.now() - startTime;
      this.progressReporter.completePhase('Visualization analysis completed', processingTime);

      // Generate Section 4 markdown report
      const section4Report = Section4Formatter.formatSection4(section4Result);

      // Generate output files
      const outputFiles = this.outputManager.outputSection4(
        section4Report,
        section4Result,
        filePath.split('/').pop(),
      );

      // Show summary
      this.progressReporter.showSummary({
        processingTime,
        rowsProcessed: section1Data.overview.structuralDimensions.totalDataRows || 0,
        warnings: section4Result.warnings.length,
        errors: 0,
      });

      return {
        success: true,
        exitCode: 0,
        outputFiles,
        stats: {
          processingTime,
          rowsProcessed: section1Data.overview.structuralDimensions.totalDataRows || 0,
          warnings: section4Result.warnings.length,
          errors: 0,
        },
      };
    } catch (error) {
      this.progressReporter.errorPhase('Visualization analysis failed');
      throw error;
    }
  }

  /**
   * Execute full analysis (ALL 6 sections: Section 1 + 2 + 3 + 4 + 5 + 6)
   */
  private async executeFullAnalysis(
    filePath: string,
    options: any,
    startTime: number,
  ): Promise<CLIResult> {
    if (!this.outputManager) {
      throw new Error('Output manager not initialised');
    }

    try {
      // Start combined output mode for txt and markdown formats
      if (options.output === 'txt' || options.output === 'markdown') {
        this.outputManager.startCombinedOutput();
      }

      const results: Array<{ section: number; data: CLIResult }> = [];
      const outputFiles: string[] = [];
      let totalRowsProcessed = 0;
      let totalWarnings = 0;

      // Section 1: Overview
      this.progressReporter.updateProgress({
        phase: 'comprehensive-analysis',
        progress: 10,
        message: 'Running Section 1: Dataset Overview...',
        timeElapsed: Date.now() - startTime,
      });

      const section1Config = {
        sectionName: 'Section 1',
        phase: 'overview',
        message: 'Starting dataset overview analysis...',
        analyzerFactory: async (filePath: string, options: any) => {
          const analyzer = new Section1Analyzer({
            enableFileHashing: options.enableHashing !== false,
            includeHostEnvironment: options.includeEnvironment !== false,
            privacyMode: options.privacyMode || 'redacted',
            detailedProfiling: options.verbose || false,
            maxSampleSizeForSparsity: 10000,
          });
          return await analyzer.analyze(filePath, `datapilot all ${filePath}`, ['overview']);
        },
        outputMethod: (
          outputManager: OutputManager,
          report: string | null,
          result: any,
          fileName?: string,
        ) => outputManager.outputSection1(result, fileName),
      };

      const section1Result = await this.executeGenericAnalysis(
        section1Config,
        filePath,
        options,
        startTime,
      );
      if (!section1Result.success) return section1Result;
      results.push({ section: 1, data: section1Result });
      outputFiles.push(...(section1Result.outputFiles || []));
      totalRowsProcessed = section1Result.stats?.rowsProcessed || 0;
      totalWarnings += section1Result.stats?.warnings || 0;

      // Section 2: Quality
      this.progressReporter.updateProgress({
        phase: 'comprehensive-analysis',
        progress: 25,
        message: 'Running Section 2: Data Quality Assessment...',
        timeElapsed: Date.now() - startTime,
      });

      const section2Config = {
        sectionName: 'Section 2',
        phase: 'quality',
        message: 'Starting data quality analysis...',
        analyzerFactory: async (filePath: string, options: any) => {
          const parser = new CSVParser({
            autoDetect: true,
            maxRows: options.maxRows || 100000,
            trimFields: true,
          });
          const rows = await parser.parseFile(filePath);
          if (rows.length === 0) {
            throw new ValidationError('No data found in file');
          }
          const hasHeader = parser.getOptions().hasHeader !== false;
          const dataStartIndex = hasHeader ? 1 : 0;
          const headers =
            hasHeader && rows.length > 0
              ? rows[0].data
              : rows[0].data.map((_, i) => `Column_${i + 1}`);
          const data = rows.slice(dataStartIndex).map((row) => row.data);
          const columnTypes = headers.map(() => DataType.STRING);

          const analyzer = new Section2Analyzer({
            data,
            headers,
            columnTypes,
            rowCount: data.length,
            columnCount: headers.length,
            config: {
              enabledDimensions: ['completeness', 'uniqueness', 'validity'],
              strictMode: false,
              maxOutlierDetection: 100,
              semanticDuplicateThreshold: 0.85,
            },
          });
          return await analyzer.analyze();
        },
        formatterMethod: (result) => Section2Formatter.formatReport(result.qualityAudit),
        outputMethod: (
          outputManager: OutputManager,
          report: string | null,
          result: any,
          fileName?: string,
        ) => outputManager.outputSection2(result, fileName),
      };

      const section2Result = await this.executeGenericAnalysis(
        section2Config,
        filePath,
        options,
        startTime,
      );
      if (!section2Result.success) return section2Result;
      results.push({ section: 2, data: section2Result });
      outputFiles.push(...(section2Result.outputFiles || []));
      totalWarnings += section2Result.stats?.warnings || 0;

      // Section 3: EDA
      this.progressReporter.updateProgress({
        phase: 'comprehensive-analysis',
        progress: 40,
        message: 'Running Section 3: Exploratory Data Analysis...',
        timeElapsed: Date.now() - startTime,
      });

      const section3Config = {
        sectionName: 'Section 3',
        phase: 'eda',
        message: 'Starting exploratory data analysis...',
        analyzerFactory: async (filePath: string, options: any) => {
          const analyzer = new StreamingAnalyzer({
            chunkSize: options.chunkSize || 500,
            memoryThresholdMB: options.memoryLimit || 100,
            maxRowsAnalyzed: options.maxRows || 500000,
            enabledAnalyses: ['univariate', 'bivariate', 'correlations'],
            significanceLevel: 0.05,
            maxCorrelationPairs: 50,
            enableMultivariate: true,
          });
          return await analyzer.analyzeFile(filePath);
        },
        formatterMethod: (result) => Section3Formatter.formatSection3(result),
        outputMethod: (
          outputManager: OutputManager,
          report: string | null,
          result: any,
          fileName?: string,
        ) => outputManager.outputSection3(report, result, fileName),
      };

      const section3Result = await this.executeGenericAnalysis(
        section3Config,
        filePath,
        options,
        startTime,
      );
      if (!section3Result.success) return section3Result;
      results.push({ section: 3, data: section3Result });
      outputFiles.push(...(section3Result.outputFiles || []));
      totalWarnings += section3Result.stats?.warnings || 0;

      // Section 4: Visualization
      this.progressReporter.updateProgress({
        phase: 'comprehensive-analysis',
        progress: 55,
        message: 'Running Section 4: Visualization Intelligence...',
        timeElapsed: Date.now() - startTime,
      });

      const section4Config = {
        sectionName: 'Section 4',
        phase: 'visualization',
        message: 'Starting visualization intelligence analysis...',
        dependencies: ['section1', 'section3'],
        analyzerFactory: async (filePath: string, options: any, dependencies: any[]) => {
          const [section1Data, section3Data] = dependencies;
          const analyzer = new Section4Analyzer({
            accessibilityLevel: options.accessibility || 'good',
            complexityThreshold: options.complexity || 'moderate',
            maxRecommendationsPerChart: options.maxRecommendations || 3,
            includeCodeExamples: options.includeCode || false,
            enabledRecommendations: [
              RecommendationType.UNIVARIATE,
              RecommendationType.BIVARIATE,
              RecommendationType.DASHBOARD,
              RecommendationType.ACCESSIBILITY,
              RecommendationType.PERFORMANCE,
            ],
            targetLibraries: ['d3', 'plotly', 'observable'],
          });
          return await analyzer.analyze(section1Data, section3Data);
        },
        formatterMethod: (result) => Section4Formatter.formatSection4(result),
        outputMethod: (
          outputManager: OutputManager,
          report: string | null,
          result: any,
          fileName?: string,
        ) => outputManager.outputSection4(report, result, fileName),
      };

      const section4Result = await this.executeGenericAnalysis(
        section4Config,
        filePath,
        options,
        startTime,
      );
      if (!section4Result.success) return section4Result;
      results.push({ section: 4, data: section4Result });
      outputFiles.push(...(section4Result.outputFiles || []));
      totalWarnings += section4Result.stats?.warnings || 0;

      // Section 5: Engineering
      this.progressReporter.updateProgress({
        phase: 'comprehensive-analysis',
        progress: 70,
        message: 'Running Section 5: Data Engineering...',
        timeElapsed: Date.now() - startTime,
      });

      const section5Config = {
        sectionName: 'Section 5',
        phase: 'engineering',
        message: 'Starting data engineering analysis...',
        dependencies: ['section1', 'section2', 'section3'],
        analyzerFactory: async (filePath: string, options: any, dependencies: any[]) => {
          const [section1Data, section2Data, section3Data] = dependencies;
          const analyzer = new Section5Analyzer({
            targetDatabaseSystem: options.database || 'postgresql',
            mlFrameworkTarget: options.framework || 'scikit_learn',
          });
          return await analyzer.analyze(section1Data, section2Data, section3Data);
        },
        formatterMethod: (result) => Section5Formatter.formatMarkdown(result),
        outputMethod: (
          outputManager: OutputManager,
          report: string | null,
          result: any,
          fileName?: string,
        ) => outputManager.outputSection5(report, result, fileName),
      };

      const section5Result = await this.executeGenericAnalysis(
        section5Config,
        filePath,
        options,
        startTime,
      );
      if (!section5Result.success) return section5Result;
      results.push({ section: 5, data: section5Result });
      outputFiles.push(...(section5Result.outputFiles || []));
      totalWarnings += section5Result.stats?.warnings || 0;

      // Section 6: Modeling
      this.progressReporter.updateProgress({
        phase: 'comprehensive-analysis',
        progress: 85,
        message: 'Running Section 6: Predictive Modeling...',
        timeElapsed: Date.now() - startTime,
      });

      const section6Config = {
        sectionName: 'Section 6',
        phase: 'modeling',
        message: 'Starting predictive modeling analysis...',
        dependencies: ['section1', 'section2', 'section3'],
        analyzerFactory: async (filePath: string, options: any, dependencies: any[]) => {
          const [section1Data, section2Data, section3Data] = dependencies;

          // Need Section 5 result as well
          const section5Analyzer = new Section5Analyzer({
            targetDatabaseSystem: options.database || 'postgresql',
            mlFrameworkTarget: options.framework || 'scikit_learn',
          });
          const section5Result = await section5Analyzer.analyze(
            section1Data,
            section2Data,
            section3Data,
          );

          const analyzer = new Section6Analyzer({
            focusAreas: options.focus || ['regression', 'binary_classification', 'clustering'],
            complexityPreference: options.complexity || 'moderate',
            interpretabilityRequirement: options.interpretability || 'medium',
          });
          return await analyzer.analyze(section1Data, section2Data, section3Data, section5Result);
        },
        formatterMethod: (result) => Section6Formatter.formatMarkdown(result),
        outputMethod: (
          outputManager: OutputManager,
          report: string | null,
          result: any,
          fileName?: string,
        ) => outputManager.outputSection6(report, result, fileName),
      };

      const section6Result = await this.executeGenericAnalysis(
        section6Config,
        filePath,
        options,
        startTime,
      );
      if (!section6Result.success) return section6Result;
      results.push({ section: 6, data: section6Result });
      outputFiles.push(...(section6Result.outputFiles || []));
      totalWarnings += section6Result.stats?.warnings || 0;

      const totalProcessingTime = Date.now() - startTime;

      // Generate comprehensive report
      this.progressReporter.updateProgress({
        phase: 'comprehensive-analysis',
        progress: 95,
        message: 'Generating comprehensive report...',
        timeElapsed: totalProcessingTime,
      });

      // Create comprehensive output if not in combine mode
      if (!(options.output === 'txt' || options.output === 'markdown')) {
        const comprehensiveReport = this.generateComprehensiveReport(
          results,
          filePath,
          totalProcessingTime,
        );
        const comprehensiveFileName = `${filePath
          .split('/')
          .pop()
          ?.replace(/\.[^/.]+$/, '')}_datapilot_comprehensive.md`;
        this.writeToFile(comprehensiveFileName, comprehensiveReport);
        outputFiles.push(comprehensiveFileName);
      }

      this.progressReporter.completePhase('Full analysis completed', totalProcessingTime);

      // Handle combined output if in combine mode
      if (options.output === 'txt' || options.output === 'markdown') {
        const combinedFiles = this.outputManager.outputCombined(filePath.split('/').pop());
        outputFiles.push(...combinedFiles);
      }

      // Show combined summary
      this.progressReporter.showSummary({
        processingTime: totalProcessingTime,
        rowsProcessed: totalRowsProcessed,
        warnings: totalWarnings,
        errors: 0,
      });

      return {
        success: true,
        exitCode: 0,
        outputFiles,
        stats: {
          processingTime: totalProcessingTime,
          rowsProcessed: totalRowsProcessed,
          warnings: totalWarnings,
          errors: 0,
        },
      };
    } catch (error) {
      this.progressReporter.errorPhase('Full analysis failed');
      throw error;
    }
  }

  /**
   * Generate comprehensive report combining all sections
   */
  private generateComprehensiveReport(
    results: Array<{ section: number; data: CLIResult }>,
    filePath: string,
    processingTime: number,
  ): string {
    const fileName =
      filePath
        .split('/')
        .pop()
        ?.replace(/\.[^/.]+$/, '') || 'dataset';
    const timestamp = new Date().toISOString();

    let report = `# 🤖 DATAPILOT COMPREHENSIVE ANALYSIS REPORT\n`;
    report += `# ${fileName.charAt(0).toUpperCase() + fileName.slice(1)} Dataset\n\n`;
    report += `**Analysis Target**: \`${filePath.split('/').pop()}\`\n`;
    report += `**Report Generated**: ${timestamp}\n`;
    report += `**DataPilot Version**: v1.2.1 (TypeScript Edition)\n`;
    report += `**Analysis Mode**: Complete 6-Section Pipeline\n`;
    report += `**Total Processing Time**: ${this.formatTime(processingTime)}\n\n`;

    report += `---\n\n`;
    report += `## 📊 Executive Summary\n\n`;
    report += `This comprehensive report provides a complete analysis through DataPilot's 6-section analytical pipeline. `;
    report += `All sections completed successfully, providing insights from dataset structure through predictive modeling guidance.\n\n`;

    const totalSections = results.length;
    const totalWarnings = results.reduce((sum, r) => sum + (r.data.stats?.warnings || 0), 0);
    const totalRows = results.find((r) => r.section === 1)?.data.stats?.rowsProcessed || 0;

    report += `### Key Metrics\n`;
    report += `- **Sections Completed**: ${totalSections}/6\n`;
    report += `- **Total Rows Processed**: ${totalRows.toLocaleString()}\n`;
    report += `- **Total Warnings**: ${totalWarnings}\n`;
    report += `- **Processing Throughput**: ${totalRows > 0 ? Math.round(totalRows / (processingTime / 1000)).toLocaleString() : 0} rows/second\n\n`;

    report += `---\n\n`;
    report += `## 📋 Section Status Summary\n\n`;

    const sectionNames = [
      'Dataset Overview & Structure',
      'Data Quality Assessment',
      'Exploratory Data Analysis',
      'Visualization Intelligence',
      'Data Engineering & Schema',
      'Predictive Modeling Guidance',
    ];

    results.forEach((result, index) => {
      const sectionNum = result.section;
      const sectionName = sectionNames[sectionNum - 1] || `Section ${sectionNum}`;
      const status = result.data.success ? '✅' : '❌';
      const time = this.formatTime(result.data.stats?.processingTime || 0);
      const warnings = result.data.stats?.warnings || 0;

      report += `### ${status} Section ${sectionNum}: ${sectionName}\n`;
      report += `- **Status**: ${result.data.success ? 'Completed Successfully' : 'Failed'}\n`;
      report += `- **Processing Time**: ${time}\n`;
      report += `- **Warnings**: ${warnings}\n`;
      if (result.data.outputFiles?.length) {
        report += `- **Output Files**: ${result.data.outputFiles.length} generated\n`;
      }
      report += `\n`;
    });

    report += `---\n\n`;
    report += `## 🎯 Next Steps\n\n`;
    report += `1. **Review Individual Reports**: Each section has generated detailed analysis reports\n`;
    report += `2. **Address Data Quality Issues**: Check Section 2 for recommended improvements\n`;
    report += `3. **Implement Visualizations**: Use Section 4 recommendations for chart creation\n`;
    report += `4. **Optimize Data Engineering**: Apply Section 5 schema and pipeline suggestions\n`;
    report += `5. **Begin Modeling**: Follow Section 6 ML guidance for predictive analytics\n\n`;

    report += `---\n\n`;
    report += `**Generated by DataPilot v1.2.1**\n`;
    report += `*Making data analysis accessible, comprehensive, and actionable*\n\n`;
    report += `> 📋 **Note**: This is a summary report. Detailed findings and recommendations `;
    report += `can be found in the individual section reports listed above.`;

    return report;
  }

  /**
   * Write content to file with directory creation
   */
  private writeToFile(filePath: string, content: string): void {
    try {
      // Ensure directory exists
      const dir = dirname(filePath);
      mkdirSync(dir, { recursive: true });

      // Write file
      writeFileSync(filePath, content, 'utf8');
    } catch (error) {
      throw new Error(
        `Failed to write file ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Format time duration helper
   */
  private formatTime(milliseconds: number): string {
    if (milliseconds < 1000) {
      return `${Math.round(milliseconds)}ms`;
    } else if (milliseconds < 60000) {
      return `${(milliseconds / 1000).toFixed(1)}s`;
    } else {
      const minutes = Math.floor(milliseconds / 60000);
      const seconds = Math.round((milliseconds % 60000) / 1000);
      return `${minutes}m ${seconds}s`;
    }
  }

  /**
   * Execute CSV validation
   */
  private async executeValidation(filePath: string, options: CLIOptions): Promise<CLIResult> {
    if (!this.outputManager) {
      throw new Error('Output manager not initialised');
    }

    try {
      this.progressReporter.startPhase('validation', 'Validating CSV format...');

      const parser = new CSVParser({
        autoDetect: true,
        encoding: (options.encoding as BufferEncoding) || 'utf8',
        delimiter: options.delimiter,
        maxRows: 100, // Just validate format, don't load everything
      });

      // Try to parse first few rows
      const rows = await parser.parseFile(filePath);
      const isValid = rows.length > 0;
      const errors: string[] = [];

      if (!isValid) {
        errors.push('Could not parse any valid rows');
      }

      this.progressReporter.completePhase('Validation completed', 1000);
      this.outputManager.outputValidation(filePath, isValid, errors);

      return {
        success: isValid,
        exitCode: isValid ? 0 : 1,
      };
    } catch (error) {
      this.progressReporter.errorPhase('Validation failed');
      const errorMessage = error instanceof Error ? error.message : 'Unknown validation error';

      this.outputManager.outputValidation(filePath, false, [errorMessage]);

      return {
        success: false,
        exitCode: 1,
        message: errorMessage,
      };
    }
  }

  /**
   * Execute file info display
   */
  private async executeInfo(filePath: string): Promise<CLIResult> {
    if (!this.outputManager) {
      throw new Error('Output manager not initialised');
    }

    try {
      this.progressReporter.startPhase('info', 'Collecting file information...');

      // Use the file metadata collector from Section 1
      const { FileMetadataCollector } = await import(
        '../analyzers/overview/file-metadata-collector'
      );
      const collector = new FileMetadataCollector({
        enableFileHashing: false,
        includeHostEnvironment: false,
        privacyMode: 'minimal',
        detailedProfiling: false,
        maxSampleSizeForSparsity: 1000,
      });

      const metadata = await collector.collectMetadata(filePath);

      this.progressReporter.completePhase('Information collected', 500);
      this.outputManager.outputFileInfo(metadata);

      return {
        success: true,
        exitCode: 0,
      };
    } catch (error) {
      this.progressReporter.errorPhase('Failed to collect file information');
      throw error;
    }
  }

  /**
   * Execute Section 5 (Engineering) analysis
   */
  private async executeSection5Analysis(
    filePath: string,
    options: any,
    startTime: number,
  ): Promise<CLIResult> {
    if (!this.outputManager) {
      throw new Error('Output manager not initialised');
    }

    try {
      this.progressReporter.startPhase('engineering', 'Starting data engineering analysis...');

      // Section 5 requires Section 1, 2, and 3 data
      // First run Section 1 analysis
      this.progressReporter.updateProgress({
        phase: 'prerequisites',
        progress: 20,
        message: 'Running prerequisite Section 1 analysis...',
        timeElapsed: Date.now() - startTime,
      });

      const section1Analyzer = new Section1Analyzer({
        enableFileHashing: options.enableHashing !== false,
        includeHostEnvironment: options.includeEnvironment !== false,
        privacyMode: options.privacyMode || 'redacted',
        detailedProfiling: options.verbose || false,
        maxSampleSizeForSparsity: 10000,
      });

      const section1Data = await section1Analyzer.analyze(
        filePath,
        `datapilot ${options.command || 'engineering'} ${filePath}`,
        ['engineering'],
      );

      // Run Section 2 analysis
      this.progressReporter.updateProgress({
        phase: 'prerequisites',
        progress: 40,
        message: 'Running prerequisite Section 2 analysis...',
        timeElapsed: Date.now() - startTime,
      });

      const section2CLIResult = await this.executeSection2Analysis(filePath, options, Date.now());
      if (!section2CLIResult.success) {
        throw new Error('Section 2 analysis failed');
      }

      // Run Section 3 analysis
      this.progressReporter.updateProgress({
        phase: 'prerequisites',
        progress: 60,
        message: 'Running prerequisite Section 3 analysis...',
        timeElapsed: Date.now() - startTime,
      });

      const section3CLIResult = await this.executeSection3Analysis(filePath, options, Date.now());
      if (!section3CLIResult.success) {
        throw new Error('Section 3 analysis failed');
      }

      // Re-run Section 3 to get actual result data (not CLI results)
      const section3Analyzer = new StreamingAnalyzer({
        chunkSize: options.chunkSize || 500,
        memoryThresholdMB: options.memoryLimit || 100,
        maxRowsAnalyzed: options.maxRows || 500000,
        enabledAnalyses: ['univariate', 'bivariate', 'correlations'],
        significanceLevel: 0.05,
        maxCorrelationPairs: 50,
        enableMultivariate: true,
      });

      const section3Data = await section3Analyzer.analyzeFile(filePath);

      // Re-run Section 2 to get actual result data (not CLI results)
      // Parse CSV to get data for Section 2
      const parser = new CSVParser({
        autoDetect: true,
        maxRows: options.maxRows || 100000,
        trimFields: true,
      });

      const rows = await parser.parseFile(filePath);
      if (rows.length === 0) {
        throw new ValidationError('No data found in file');
      }

      const hasHeader = parser.getOptions().hasHeader !== false;
      const dataStartIndex = hasHeader ? 1 : 0;
      const headers =
        hasHeader && rows.length > 0 ? rows[0].data : rows[0].data.map((_, i) => `Column_${i + 1}`);
      const data = rows.slice(dataStartIndex).map((row) => row.data);
      const columnTypes = headers.map(() => DataType.STRING);

      const section2Analyzer = new Section2Analyzer({
        data,
        headers,
        columnTypes,
        rowCount: data.length,
        columnCount: headers.length,
        config: {
          enabledDimensions: ['completeness', 'uniqueness', 'validity'],
          strictMode: false,
          maxOutlierDetection: 100,
          semanticDuplicateThreshold: 0.85,
        },
      });

      const section2Data = await section2Analyzer.analyze();

      // Now run Section 5 analysis
      this.progressReporter.updateProgress({
        phase: 'engineering',
        progress: 80,
        message: 'Running engineering analysis...',
        timeElapsed: Date.now() - startTime,
      });

      const section5Analyzer = new Section5Analyzer({
        targetDatabaseSystem: options.database || 'postgresql',
        mlFrameworkTarget: options.framework || 'scikit_learn',
      });

      const section5Result = await section5Analyzer.analyze(
        section1Data,
        section2Data,
        section3Data,
      );

      const processingTime = Date.now() - startTime;
      this.progressReporter.completePhase('Engineering analysis completed', processingTime);

      // Generate Section 5 markdown report
      const section5Report = Section5Formatter.formatMarkdown(section5Result);

      // Generate output files
      const outputFiles = this.outputManager.outputSection5(
        section5Report,
        section5Result,
        filePath.split('/').pop(),
      );

      // Show summary
      this.progressReporter.showSummary({
        processingTime,
        rowsProcessed: section1Data.overview.structuralDimensions.totalDataRows || 0,
        warnings: section5Result.warnings.length,
        errors: 0,
      });

      return {
        success: true,
        exitCode: 0,
        outputFiles,
        stats: {
          processingTime,
          rowsProcessed: section1Data.overview.structuralDimensions.totalDataRows || 0,
          warnings: section5Result.warnings.length,
          errors: 0,
        },
      };
    } catch (error) {
      this.progressReporter.errorPhase('Engineering analysis failed');
      throw error;
    }
  }

  /**
   * Execute Section 6 (Modeling) analysis
   */
  private async executeSection6Analysis(
    filePath: string,
    options: any,
    startTime: number,
  ): Promise<CLIResult> {
    if (!this.outputManager) {
      throw new Error('Output manager not initialised');
    }

    try {
      this.progressReporter.startPhase('modeling', 'Starting predictive modeling analysis...');

      // Section 6 requires Section 1, 2, 3, and 5 data
      // First run Section 1 analysis
      this.progressReporter.updateProgress({
        phase: 'prerequisites',
        progress: 15,
        message: 'Running prerequisite Section 1 analysis...',
        timeElapsed: Date.now() - startTime,
      });

      const section1Analyzer = new Section1Analyzer({
        enableFileHashing: options.enableHashing !== false,
        includeHostEnvironment: options.includeEnvironment !== false,
        privacyMode: options.privacyMode || 'redacted',
        detailedProfiling: options.verbose || false,
        maxSampleSizeForSparsity: 10000,
      });

      const section1Data = await section1Analyzer.analyze(
        filePath,
        `datapilot ${options.command || 'modeling'} ${filePath}`,
        ['modeling'],
      );

      // Run Section 2 analysis
      this.progressReporter.updateProgress({
        phase: 'prerequisites',
        progress: 30,
        message: 'Running prerequisite Section 2 analysis...',
        timeElapsed: Date.now() - startTime,
      });

      const section2CLIResult = await this.executeSection2Analysis(filePath, options, Date.now());
      if (!section2CLIResult.success) {
        throw new Error('Section 2 analysis failed');
      }

      // Run Section 3 analysis
      this.progressReporter.updateProgress({
        phase: 'prerequisites',
        progress: 45,
        message: 'Running prerequisite Section 3 analysis...',
        timeElapsed: Date.now() - startTime,
      });

      const section3CLIResult = await this.executeSection3Analysis(filePath, options, Date.now());
      if (!section3CLIResult.success) {
        throw new Error('Section 3 analysis failed');
      }

      // Re-run Section 3 to get actual result data
      const section3Analyzer = new StreamingAnalyzer({
        chunkSize: options.chunkSize || 500,
        memoryThresholdMB: options.memoryLimit || 100,
        maxRowsAnalyzed: options.maxRows || 500000,
        enabledAnalyses: ['univariate', 'bivariate', 'correlations'],
        significanceLevel: 0.05,
        maxCorrelationPairs: 50,
        enableMultivariate: true,
      });

      const section3Data = await section3Analyzer.analyzeFile(filePath);

      // Re-run Section 2 to get actual result data (not CLI results)
      // Parse CSV to get data for Section 2
      const parser = new CSVParser({
        autoDetect: true,
        maxRows: options.maxRows || 100000,
        trimFields: true,
      });

      const rows = await parser.parseFile(filePath);
      if (rows.length === 0) {
        throw new ValidationError('No data found in file');
      }

      const hasHeader = parser.getOptions().hasHeader !== false;
      const dataStartIndex = hasHeader ? 1 : 0;
      const headers =
        hasHeader && rows.length > 0 ? rows[0].data : rows[0].data.map((_, i) => `Column_${i + 1}`);
      const data = rows.slice(dataStartIndex).map((row) => row.data);
      const columnTypes = headers.map(() => DataType.STRING);

      const section2Analyzer = new Section2Analyzer({
        data,
        headers,
        columnTypes,
        rowCount: data.length,
        columnCount: headers.length,
        config: {
          enabledDimensions: ['completeness', 'uniqueness', 'validity'],
          strictMode: false,
          maxOutlierDetection: 100,
          semanticDuplicateThreshold: 0.85,
        },
      });

      const section2Data = await section2Analyzer.analyze();

      // Run Section 5 analysis
      this.progressReporter.updateProgress({
        phase: 'prerequisites',
        progress: 60,
        message: 'Running prerequisite Section 5 analysis...',
        timeElapsed: Date.now() - startTime,
      });

      const section5Analyzer = new Section5Analyzer({
        targetDatabaseSystem: options.database || 'postgresql',
        mlFrameworkTarget: options.framework || 'scikit_learn',
      });

      const section5Result = await section5Analyzer.analyze(
        section1Data,
        section2Data,
        section3Data,
      );

      // Now run Section 6 analysis
      this.progressReporter.updateProgress({
        phase: 'modeling',
        progress: 80,
        message: 'Running modeling analysis...',
        timeElapsed: Date.now() - startTime,
      });

      const section6Analyzer = new Section6Analyzer({
        focusAreas: options.focus || ['regression', 'binary_classification', 'clustering'],
        complexityPreference: options.complexity || 'moderate',
        interpretabilityRequirement: options.interpretability || 'medium',
      });

      const section6Result = await section6Analyzer.analyze(
        section1Data,
        section2Data,
        section3Data,
        section5Result,
      );

      const processingTime = Date.now() - startTime;
      this.progressReporter.completePhase('Modeling analysis completed', processingTime);

      // Generate Section 6 markdown report
      const section6Report = Section6Formatter.formatMarkdown(section6Result);

      // Generate output files
      const outputFiles = this.outputManager.outputSection6(
        section6Report,
        section6Result,
        filePath.split('/').pop(),
      );

      // Show summary
      this.progressReporter.showSummary({
        processingTime,
        rowsProcessed: section1Data.overview.structuralDimensions.totalDataRows || 0,
        warnings: section6Result.warnings.length,
        errors: 0,
      });

      return {
        success: true,
        exitCode: 0,
        outputFiles,
        stats: {
          processingTime,
          rowsProcessed: section1Data.overview.structuralDimensions.totalDataRows || 0,
          warnings: section6Result.warnings.length,
          errors: 0,
        },
      };
    } catch (error) {
      this.progressReporter.errorPhase('Modeling analysis failed');
      throw error;
    }
  }

  /**
   * Handle errors with comprehensive reporting and recovery suggestions
   */
  private handleError(error: unknown): CLIResult {
    const errorStats = globalErrorHandler.getStats();
    const recentErrors = globalErrorHandler.getRecentErrors(5);

    // DataPilot-specific error handling
    if (error instanceof DataPilotError) {
      console.error(`\n❌ ${error.severity.toUpperCase()} ERROR: ${error.getFormattedMessage()}`);

      // Show suggestions if available
      const suggestions = error.getSuggestions();
      if (suggestions.length > 0) {
        console.error('\n💡 Suggestions:');
        suggestions.forEach((suggestion) => {
          console.error(`   ${suggestion}`);
        });
      }

      // Show error context if available
      if (error.context) {
        const contextParts = [];
        if (error.context.filePath) contextParts.push(`File: ${error.context.filePath}`);
        if (error.context.section) contextParts.push(`Section: ${error.context.section}`);
        if (error.context.rowIndex !== undefined)
          contextParts.push(`Row: ${error.context.rowIndex}`);

        if (contextParts.length > 0) {
          console.error(`\n📍 Context: ${contextParts.join(', ')}`);
        }
      }

      return {
        success: false,
        exitCode: error.severity === ErrorSeverity.CRITICAL ? 2 : 1,
        message: error.message,
      };
    }

    // Legacy error types
    if (error instanceof ValidationError) {
      console.error(`\n❌ Validation Error: ${error.message}`);
      if (error.showHelp) {
        console.error('\n💡 Use --help for usage information.');
      }
      return { success: false, exitCode: 1, message: error.message };
    }

    if (error instanceof FileError) {
      console.error(`\n❌ File Error: ${error.message}`);
      console.error('\n💡 Suggestions:');
      console.error('   • Check that the file path is correct');
      console.error('   • Ensure you have read permissions for the file');
      console.error('   • Verify the file is not locked by another process');
      return { success: false, exitCode: 1, message: error.message };
    }

    if (error instanceof Error && error.name === 'CLIError') {
      console.error(`\n❌ ${error.message}`);
      return { success: false, exitCode: (error as any).exitCode || 1, message: error.message };
    }

    // Generic error handling with enhanced reporting
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error(`\n❌ Unexpected Error: ${message}`);

    // Show error statistics if there were multiple errors
    if (errorStats.totalErrors > 1) {
      console.error(
        `\n📊 Error Summary: ${errorStats.totalErrors} total errors, ${errorStats.criticalErrors} critical`,
      );
    }

    // Show recent errors in development mode
    if (process.env.NODE_ENV === 'development') {
      console.error('\n🔍 Full Error Details:');
      console.error(error);

      if (recentErrors.length > 1) {
        console.error('\n📋 Recent Errors:');
        recentErrors.slice(0, 3).forEach((err, i) => {
          console.error(`   ${i + 1}. [${err.code}] ${err.message}`);
        });
      }
    } else {
      console.error('\n💡 General Suggestions:');
      console.error('   • Check your input file format and data quality');
      console.error('   • Try with --verbose flag for more detailed output');
      console.error('   • Use validate command to diagnose file issues: datapilot validate <file>');
      console.error('   • Report persistent issues at: https://github.com/your-repo/issues');
    }

    return { success: false, exitCode: 1, message };
  }

  /**
   * Enhanced error propagation between analysis sections
   */
  private async executeWithErrorPropagation<T>(
    operation: () => Promise<T>,
    sectionName: string,
    dependencies?: SectionResult[],
    context?: LogContext,
  ): Promise<T> {
    try {
      // Check for dependency errors
      if (dependencies) {
        const dependencyErrors = this.checkDependencyErrors(dependencies);
        if (dependencyErrors.length > 0) {
          throw DataPilotError.analysis(
            `Cannot execute ${sectionName} due to dependency errors: ${dependencyErrors.join(', ')}`,
            'DEPENDENCY_ERROR',
            { ...context, section: sectionName },
            [
              {
                action: 'Fix dependency issues',
                description: 'Resolve errors in prerequisite sections',
                severity: ErrorSeverity.HIGH,
              },
              {
                action: 'Run sections individually',
                description: 'Try running each section separately to isolate issues',
                severity: ErrorSeverity.MEDIUM,
                command: `datapilot ${sectionName.toLowerCase()} <file>`,
              },
            ],
          );
        }
      }

      // Execute operation with memory monitoring
      globalErrorHandler.checkMemoryUsage(context);
      const result = await operation();

      // Validate result
      if (!result || (typeof result === 'object' && Object.keys(result).length === 0)) {
        logger.warn(`${sectionName} returned empty result`, context);
      }

      return result;
    } catch (error) {
      // Enhanced error context for section failures
      if (error instanceof DataPilotError) {
        // Add section context if not already present
        if (!error.context?.section) {
          error.context = { ...error.context, section: sectionName };
        }
        throw error;
      }

      // Convert generic errors to DataPilot errors with section context
      throw DataPilotError.analysis(
        `${sectionName} analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'SECTION_ANALYSIS_ERROR',
        { ...context, section: sectionName },
        [
          {
            action: 'Check input data',
            description: 'Verify the input file is valid and properly formatted',
            severity: ErrorSeverity.HIGH,
          },
          {
            action: 'Try with reduced scope',
            description: 'Use --maxRows to limit processing scope',
            severity: ErrorSeverity.MEDIUM,
            command: '--maxRows 10000',
          },
          {
            action: 'Enable verbose logging',
            description: 'Use --verbose flag for detailed error information',
            severity: ErrorSeverity.LOW,
            command: '--verbose',
          },
        ],
      );
    }
  }

  /**
   * Check for errors in dependency results
   */
  private checkDependencyErrors(dependencies: SectionResult[]): string[] {
    const errors: string[] = [];

    dependencies.forEach((dep, index) => {
      if (!dep) {
        errors.push(`Dependency ${index + 1} is null or undefined`);
        return;
      }

      // Check for warnings that might indicate problems
      if (dep.warnings && Array.isArray(dep.warnings)) {
        const criticalWarnings = dep.warnings.filter(
          (w: any) => w.severity === 'critical' || w.severity === 'high',
        );

        if (criticalWarnings.length > 0) {
          errors.push(
            `Dependency ${index + 1} has critical warnings: ${criticalWarnings.map((w: any) => w.message).join(', ')}`,
          );
        }
      }

      // Check for empty or insufficient data
      if ('datasetCharacteristics' in dep && dep.datasetCharacteristics) {
        const totalRows = (dep.datasetCharacteristics as any)?.totalRows || 0;
        if (totalRows === 0) {
          errors.push(`Dependency ${index + 1} contains no data`);
        } else if (totalRows < 10) {
          errors.push(`Dependency ${index + 1} has insufficient data (${totalRows} rows)`);
        }
      }
    });

    return errors;
  }

  /**
   * Create a safe execution wrapper for analysis operations
   */
  private async safeExecuteAnalysis<T>(
    analysisFunction: () => Promise<T>,
    sectionName: string,
    filePath: string,
    options: CLIOptions,
  ): Promise<T | null> {
    const context: LogContext = {
      section: sectionName,
      filePath,
      operation: 'analysis',
    };

    return await globalErrorHandler.wrapOperation(
      analysisFunction,
      `${sectionName}_analysis`,
      context,
      {
        strategy: 'continue', // Continue with degraded functionality
        fallbackValue: null,
      },
    );
  }
}

/**
 * CLI entry point when run directly
 */
async function main() {
  const cli = new DataPilotCLI();
  const result = await cli.run();
  process.exit(result.exitCode);
}

// Only run main if this file is executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { ArgumentParser, ProgressReporter, OutputManager };
