#!/usr/bin/env node

/**
 * DataPilot CLI - Main entry point
 * A lightweight CLI statistical computation engine for comprehensive CSV data analysis
 */

import { ArgumentParser } from './argument-parser';
import { ProgressReporter } from './progress-reporter';
import { OutputManager } from './output-manager';
import { Section1Analyzer } from '../analyzers/overview';
import { CSVParser } from '../parsers/csv-parser';
import { logger, LogLevel } from '../utils/logger';
import type { CLIResult } from './types';
import { ValidationError, FileError } from './types';

export class DataPilotCLI {
  private argumentParser: ArgumentParser;
  private progressReporter: ProgressReporter;
  private outputManager?: OutputManager;

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
        commandContext.options.verbose || false
      );
      
      this.outputManager = new OutputManager(commandContext.options);

      // Validate the input file
      const validatedFilePath = this.argumentParser.validateFile(commandContext.file);

      // Execute the appropriate command
      const result = await this.executeCommand(
        commandContext.command,
        validatedFilePath,
        commandContext.options,
        context.startTime
      );

      return result;

    } catch (error) {
      return this.handleError(error);
    } finally {
      this.progressReporter.cleanup();
    }
  }

  /**
   * Execute specific CLI command
   */
  private async executeCommand(
    command: string,
    filePath: string,
    options: any,
    startTime: number
  ): Promise<CLIResult> {
    
    switch (command) {
      case 'all':
      case 'overview':
        return await this.executeSection1Analysis(filePath, options, startTime);
        
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
    startTime: number
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
        ['overview']
      );

      const processingTime = Date.now() - startTime;
      this.progressReporter.completePhase('Analysis completed', processingTime);

      // Generate output
      const outputFiles = this.outputManager.outputSection1(
        result,
        filePath.split('/').pop()
      );

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
      
      this.outputManager!.outputValidation(filePath, false, [errorMessage]);
      
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
      const { FileMetadataCollector } = await import('../analyzers/overview/file-metadata-collector');
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
