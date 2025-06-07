#!/usr/bin/env node

/**
 * DataPilot CLI - Main entry point
 * A lightweight CLI statistical computation engine for comprehensive CSV data analysis
 */

import { ArgumentParser } from './argument-parser';
import { ProgressReporter } from './progress-reporter';
import { OutputManager } from './output-manager';
import { Section1Analyzer } from '../analyzers/overview';
import { Section2Analyzer } from '../analyzers/quality';
import { Section2Formatter } from '../analyzers/quality/section2-formatter';
import { StreamingAnalyzer } from '../analyzers/streaming/streaming-analyzer';
import { Section3Formatter } from '../analyzers/eda/section3-formatter';
import { Section4Analyzer, Section4Formatter } from '../analyzers/visualization';
import { RecommendationType } from '../analyzers/visualization/types';
import { Section5Analyzer, Section5Formatter } from '../analyzers/engineering';
import { Section6Analyzer, Section6Formatter } from '../analyzers/modeling';
import { CSVParser } from '../parsers/csv-parser';
import { logger, LogLevel } from '../utils/logger';
import type { CLIResult } from './types';
import { ValidationError, FileError } from './types';
import { DataType } from '../core/types';

// Add types for generic analysis configuration
interface AnalysisConfig {
  sectionName: string;
  phase: string;
  message: string;
  dependencies?: string[];
  analyzerFactory: (filePath: string, options: any, dependencies?: any[]) => Promise<any>;
  formatterMethod?: (result: any) => string;
  outputMethod: (outputManager: OutputManager, report: string | null, result: any, fileName?: string) => string[];
}

export class DataPilotCLI {
  private argumentParser: ArgumentParser;
  private progressReporter: ProgressReporter;
  private outputManager?: OutputManager;
  private dependencyCache = new Map<string, any>();

  constructor() {
    this.argumentParser = new ArgumentParser();
    this.progressReporter = new ProgressReporter();
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

      // Validate the input file
      const validatedFilePath = this.argumentParser.validateFile(commandContext.file);

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
   * Generic analysis execution method to reduce code duplication
   */
  private async executeGenericAnalysis(
    config: AnalysisConfig,
    filePath: string,
    options: any,
    startTime: number,
  ): Promise<CLIResult> {
    if (!this.outputManager) {
      throw new Error('Output manager not initialised');
    }

    try {
      this.progressReporter.startPhase(config.phase, config.message);

      // Handle dependencies
      const dependencies: any[] = [];
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
            depResult = await this.executeDependency(depName, filePath, options);
            this.dependencyCache.set(depName, depResult);
          }
          dependencies.push(depResult);
        }
      }

      // Run the main analysis
      const finalProgressPercent = config.dependencies ? 80 : 50;
      this.progressReporter.updateProgress({
        phase: config.sectionName,
        progress: finalProgressPercent,
        message: `Running ${config.sectionName} analysis...`,
        timeElapsed: Date.now() - startTime,
      });

      const result = await config.analyzerFactory(filePath, options, dependencies);

      const processingTime = Date.now() - startTime;
      this.progressReporter.completePhase(`${config.sectionName} analysis completed`, processingTime);

      // Generate report if formatter is provided
      const report = config.formatterMethod ? config.formatterMethod(result) : null;

      // Generate output files
      const outputFiles = config.outputMethod(this.outputManager, report, result, filePath.split('/').pop());

      // Calculate stats
      const rowsProcessed = result.overview?.structuralDimensions?.totalDataRows || 
                            result.performanceMetrics?.rowsAnalyzed || 
                            result.stats?.rowsProcessed || 0;
      const warnings = result.warnings?.length || 0;

      // Show summary
      this.progressReporter.showSummary({
        processingTime,
        rowsProcessed,
        warnings,
        errors: 0,
      });

      return {
        success: true,
        exitCode: 0,
        outputFiles,
        stats: {
          processingTime,
          rowsProcessed,
          warnings,
          errors: 0,
        },
      };
    } catch (error) {
      this.progressReporter.errorPhase(`${config.sectionName} analysis failed`);
      throw error;
    }
  }

  /**
   * Execute dependency analysis and cache results
   */
  private async executeDependency(depName: string, filePath: string, options: any): Promise<any> {
    switch (depName) {
      case 'section1':
        const section1Analyzer = new Section1Analyzer({
          enableFileHashing: options.enableHashing !== false,
          includeHostEnvironment: options.includeEnvironment !== false,
          privacyMode: options.privacyMode || 'redacted',
          detailedProfiling: options.verbose || false,
          maxSampleSizeForSparsity: 10000,
        });
        return await section1Analyzer.analyze(filePath, `datapilot ${options.command || 'analysis'} ${filePath}`, []);

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
        const headers = hasHeader && rows.length > 0 ? rows[0].data : rows[0].data.map((_, i) => `Column_${i + 1}`);
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
    options: any,
    startTime: number,
  ): Promise<CLIResult> {
    // Clear dependency cache for each command
    this.dependencyCache.clear();

    switch (command) {
      case 'all':
        return await this.executeFullAnalysis(filePath, options, startTime);

      case 'overview':
        return await this.executeGenericAnalysis({
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
            return await analyzer.analyze(filePath, `datapilot ${options.command || 'overview'} ${filePath}`, ['overview']);
          },
          outputMethod: (outputManager, report, result, fileName) => outputManager.outputSection1(result, fileName),
        }, filePath, options, startTime);

      case 'quality':
        return await this.executeGenericAnalysis({
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
            const headers = hasHeader && rows.length > 0 ? rows[0].data : rows[0].data.map((_, i) => `Column_${i + 1}`);
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
          formatterMethod: (result) => Section2Formatter.formatReport(result),
          outputMethod: (outputManager, report, result, fileName) => outputManager.outputSection2(result),
        }, filePath, options, startTime);

      case 'eda':
        return await this.executeGenericAnalysis({
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
          formatterMethod: (result) => Section3Formatter.formatSection3(result),
          outputMethod: (outputManager, report, result, fileName) => outputManager.outputSection3(report!, result, fileName),
        }, filePath, options, startTime);

      case 'viz':
        return await this.executeGenericAnalysis({
          sectionName: 'Section 4',
          phase: 'section4',
          message: 'Starting visualization intelligence analysis...',
          dependencies: ['section1', 'section3'],
          analyzerFactory: async (filePath, options, dependencies) => {
            const [section1Data, section3Data] = dependencies!;
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
          outputMethod: (outputManager, report, result, fileName) => outputManager.outputSection4(report!, result, fileName),
        }, filePath, options, startTime);

      case 'engineering':
        return await this.executeGenericAnalysis({
          sectionName: 'Section 5',
          phase: 'engineering',
          message: 'Starting data engineering analysis...',
          dependencies: ['section1', 'section2', 'section3'],
          analyzerFactory: async (filePath, options, dependencies) => {
            const [section1Data, section2Data, section3Data] = dependencies!;
            const analyzer = new Section5Analyzer({
              targetDatabaseSystem: options.database || 'postgresql',
              mlFrameworkTarget: options.framework || 'scikit_learn',
            });
            return await analyzer.analyze(section1Data, section2Data, section3Data);
          },
          formatterMethod: (result) => Section5Formatter.formatMarkdown(result),
          outputMethod: (outputManager, report, result, fileName) => outputManager.outputSection5(report!, result, fileName),
        }, filePath, options, startTime);

      case 'modeling':
        return await this.executeGenericAnalysis({
          sectionName: 'Section 6',
          phase: 'modeling',
          message: 'Starting predictive modeling analysis...',
          dependencies: ['section1', 'section2', 'section3'],
          analyzerFactory: async (filePath, options, dependencies) => {
            const [section1Data, section2Data, section3Data] = dependencies!;
            
            // Need Section 5 result as well
            const section5Analyzer = new Section5Analyzer({
              targetDatabaseSystem: options.database || 'postgresql',
              mlFrameworkTarget: options.framework || 'scikit_learn',
            });
            const section5Result = await section5Analyzer.analyze(section1Data, section2Data, section3Data);
            
            const analyzer = new Section6Analyzer({
              focusAreas: options.focus || ['regression', 'binary_classification', 'clustering'],
              complexityPreference: options.complexity || 'moderate',
              interpretabilityRequirement: options.interpretability || 'medium',
            });
            return await analyzer.analyze(section1Data, section2Data, section3Data, section5Result);
          },
          formatterMethod: (result) => Section6Formatter.formatMarkdown(result),
          outputMethod: (outputManager, report, result, fileName) => outputManager.outputSection6(report!, result, fileName),
        }, filePath, options, startTime);

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

      // First execute Section 1 analysis
      this.progressReporter.startPhase('overview', 'Starting overview analysis...');
      const section1Result = await this.executeSection1Analysis(filePath, options, startTime);

      if (!section1Result.success) {
        return section1Result;
      }

      // Then execute Section 2 analysis
      this.progressReporter.startPhase('quality', 'Starting data quality analysis...');
      const section2Result = await this.executeSection2Analysis(filePath, options, Date.now());

      if (!section2Result.success) {
        return section2Result;
      }

      // Then execute Section 3 analysis
      this.progressReporter.startPhase('eda', 'Starting EDA analysis...');
      const section3Result = await this.executeSection3Analysis(filePath, options, Date.now());

      if (!section3Result.success) {
        return section3Result;
      }

      // Then execute Section 4 analysis
      this.progressReporter.startPhase('viz', 'Starting visualization analysis...');
      const section4Result = await this.executeSection4Analysis(filePath, options, Date.now());

      if (!section4Result.success) {
        return section4Result;
      }

      // Then execute Section 5 analysis
      this.progressReporter.startPhase('engineering', 'Starting data engineering analysis...');
      const section5Result = await this.executeSection5Analysis(filePath, options, Date.now());

      if (!section5Result.success) {
        return section5Result;
      }

      // Finally execute Section 6 analysis
      this.progressReporter.startPhase('modeling', 'Starting predictive modeling analysis...');
      const section6Result = await this.executeSection6Analysis(filePath, options, Date.now());

      const totalProcessingTime = Date.now() - startTime;
      this.progressReporter.completePhase('Full analysis completed', totalProcessingTime);

      // Handle combined output if in combine mode
      let outputFiles: string[] = [];
      if (options.output === 'txt' || options.output === 'markdown') {
        outputFiles = this.outputManager.outputCombined(filePath.split('/').pop());
      } else {
        // Combine individual output files
        outputFiles = [
          ...(section1Result.outputFiles || []),
          ...(section2Result.outputFiles || []),
          ...(section3Result.outputFiles || []),
          ...(section4Result.outputFiles || []),
          ...(section5Result.outputFiles || []),
          ...(section6Result.outputFiles || []),
        ];
      }

      // Show combined summary
      this.progressReporter.showSummary({
        processingTime: totalProcessingTime,
        rowsProcessed: section1Result.stats?.rowsProcessed || 0,
        warnings:
          (section1Result.stats?.warnings || 0) +
          (section2Result.stats?.warnings || 0) +
          (section3Result.stats?.warnings || 0) +
          (section4Result.stats?.warnings || 0) +
          (section5Result.stats?.warnings || 0) +
          (section6Result.stats?.warnings || 0),
        errors: 0,
      });

      return {
        success: true,
        exitCode: 0,
        outputFiles,
        stats: {
          processingTime: totalProcessingTime,
          rowsProcessed: section1Result.stats?.rowsProcessed || 0,
          warnings:
            (section1Result.stats?.warnings || 0) +
            (section2Result.stats?.warnings || 0) +
            (section3Result.stats?.warnings || 0) +
            (section4Result.stats?.warnings || 0) +
            (section5Result.stats?.warnings || 0) +
            (section6Result.stats?.warnings || 0),
          errors: 0,
        },
      };
    } catch (error) {
      this.progressReporter.errorPhase('Full analysis failed');
      throw error;
    }
  }

  /**
   * Execute CSV validation
   */
  private async executeValidation(filePath: string, options: any): Promise<CLIResult> {
    if (!this.outputManager) {
      throw new Error('Output manager not initialised');
    }

    try {
      this.progressReporter.startPhase('validation', 'Validating CSV format...');

      const parser = new CSVParser({
        autoDetect: true,
        encoding: options.encoding || 'utf8',
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
   * Handle errors and convert to CLI result
   */
  private handleError(error: unknown): CLIResult {
    if (error instanceof ValidationError) {
      console.error(`❌ Validation Error: ${error.message}`);
      if (error.showHelp) {
        console.error('\nUse --help for usage information.');
      }
      return { success: false, exitCode: 1, message: error.message };
    }

    if (error instanceof FileError) {
      console.error(`❌ File Error: ${error.message}`);
      return { success: false, exitCode: 1, message: error.message };
    }

    if (error instanceof Error && error.name === 'CLIError') {
      console.error(`❌ ${error.message}`);
      return { success: false, exitCode: (error as any).exitCode || 1, message: error.message };
    }

    // Generic error handling
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error(`❌ Unexpected Error: ${message}`);

    if (process.env.NODE_ENV === 'development') {
      console.error(error);
    }

    return { success: false, exitCode: 1, message };
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
