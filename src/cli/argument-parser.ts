/**
 * CLI Argument Parser and Validator
 */

import { Command } from 'commander';
import { existsSync, statSync } from 'fs';
import { resolve } from 'path';
import type { CLIOptions, CLIContext } from './types';
import { ValidationError, FileError } from './types';

export class ArgumentParser {
  private program: Command;

  constructor() {
    this.program = new Command();
    this.setupCommands();
  }

  /**
   * Parse command line arguments
   */
  parse(argv: string[]): CLIContext {
    try {
      this.program.parse(argv);
      
      // Get the parsed command and options
      const command = this.program.args[0] || 'help';
      const globalOptions = this.program.opts();
      
      return {
        command,
        args: this.program.args,
        options: this.validateOptions(globalOptions),
        startTime: Date.now(),
        workingDirectory: process.cwd(),
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new ValidationError(error.message);
      }
      throw new ValidationError('Failed to parse command line arguments');
    }
  }

  /**
   * Set up all CLI commands and options
   */
  private setupCommands(): void {
    this.program
      .name('datapilot')
      .description('A lightweight CLI statistical computation engine for comprehensive CSV data analysis')
      .version('1.0.0')
      .helpOption('-h, --help', 'Display help information');

    // Global options
    this.program
      .option('-v, --verbose', 'Enable verbose output with detailed progress')
      .option('-q, --quiet', 'Suppress all output except errors')
      .option('--no-progress', 'Disable progress indicators')
      .option('--dry-run', 'Validate inputs without performing analysis');

    // Main command: analyze all sections
    this.program
      .command('all')
      .argument('<file>', 'CSV file to analyze')
      .description('Run complete analysis on a CSV file (all sections)')
      .option('-o, --output <format>', 'Output format (markdown, json, yaml)', 'markdown')
      .option('--output-file <file>', 'Write output to file instead of stdout')
      .option('--max-rows <number>', 'Maximum rows to process', this.parseInteger)
      .option('--no-hashing', 'Disable file hashing for faster processing')
      .option('--no-environment', 'Exclude host environment details from report')
      .option('--privacy <mode>', 'Privacy mode (full, redacted, minimal)', 'redacted')
      .option('--max-memory <mb>', 'Maximum memory usage in MB', this.parseInteger)
      .option('--force', 'Ignore warnings and force processing')
      .action(this.createCommandHandler('all'));

    // Section-specific commands
    this.program
      .command('overview')
      .argument('<file>', 'CSV file to analyze')
      .description('Generate dataset overview (Section 1 only)')
      .option('-o, --output <format>', 'Output format (markdown, json, yaml)', 'markdown')
      .option('--output-file <file>', 'Write output to file instead of stdout')
      .option('--no-hashing', 'Disable file hashing for faster processing')
      .option('--privacy <mode>', 'Privacy mode (full, redacted, minimal)', 'redacted')
      .action(this.createCommandHandler('overview'));

    // Future section commands (stubs for now)
    this.program
      .command('quality')
      .argument('<file>', 'CSV file to analyze')
      .description('Run data quality audit (Section 2)')
      .option('-o, --output <format>', 'Output format', 'markdown')
      .action(this.createStubHandler('quality', 'Data Quality Audit'));

    this.program
      .command('eda')
      .argument('<file>', 'CSV file to analyze')
      .description('Perform exploratory data analysis (Section 3)')
      .option('-o, --output <format>', 'Output format', 'markdown')
      .action(this.createStubHandler('eda', 'Exploratory Data Analysis'));

    this.program
      .command('viz')
      .argument('<file>', 'CSV file to analyze')
      .description('Generate visualization recommendations (Section 4)')
      .option('-o, --output <format>', 'Output format', 'markdown')
      .action(this.createStubHandler('viz', 'Visualization Intelligence'));

    this.program
      .command('engineering')
      .argument('<file>', 'CSV file to analyze')
      .description('Provide data engineering insights (Section 5)')
      .option('-o, --output <format>', 'Output format', 'markdown')
      .action(this.createStubHandler('engineering', 'Data Engineering Insights'));

    this.program
      .command('modeling')
      .argument('<file>', 'CSV file to analyze')
      .description('Generate predictive modeling guidance (Section 6)')
      .option('-o, --output <format>', 'Output format', 'markdown')
      .action(this.createStubHandler('modeling', 'Predictive Modeling Guidance'));

    // Utility commands
    this.program
      .command('validate')
      .argument('<file>', 'CSV file to validate')
      .description('Validate CSV file format without full analysis')
      .option('--encoding <encoding>', 'Expected encoding (utf8, utf16le, etc.)')
      .option('--delimiter <char>', 'Expected delimiter character')
      .action(this.createCommandHandler('validate'));

    this.program
      .command('info')
      .argument('<file>', 'CSV file to inspect')
      .description('Show quick file information and format detection')
      .action(this.createCommandHandler('info'));
  }

  /**
   * Create command handler that stores context for later execution
   */
  private createCommandHandler(commandName: string) {
    return (file: string, options: any) => {
      
      // Store the context for the main CLI to pick up
      (this.program as any)._lastContext = {
        command: commandName,
        file,
        options,
      };
    };
  }

  /**
   * Create stub handler for unimplemented sections
   */
  private createStubHandler(section: string, sectionName: string) {
    return (file: string) => {
      console.log(`\n🚧 ${sectionName} (Section ${this.getSectionNumber(section)}) - Coming Soon!`);
      console.log(`The ${section} command will be available in a future release.`);
      console.log(`\nFor now, use 'datapilot overview ${file}' to analyze your dataset.`);
      process.exit(0);
    };
  }

  /**
   * Get section number for display
   */
  private getSectionNumber(section: string): string {
    const numbers: Record<string, string> = {
      'overview': '1',
      'quality': '2', 
      'eda': '3',
      'viz': '4',
      'engineering': '5',
      'modeling': '6',
    };
    return numbers[section] || '?';
  }

  /**
   * Validate and normalize CLI options
   */
  private validateOptions(rawOptions: any): CLIOptions {
    const options: CLIOptions = {};

    // Output options
    if (rawOptions.output) {
      if (!['markdown', 'json', 'yaml'].includes(rawOptions.output)) {
        throw new ValidationError('Output format must be one of: markdown, json, yaml');
      }
      options.output = rawOptions.output;
    }

    if (rawOptions.outputFile) {
      options.outputFile = resolve(rawOptions.outputFile);
    }

    // Verbosity options
    options.verbose = Boolean(rawOptions.verbose);
    options.quiet = Boolean(rawOptions.quiet);
    
    if (options.verbose && options.quiet) {
      throw new ValidationError('Cannot use both --verbose and --quiet options');
    }

    // Analysis options
    if (rawOptions.maxRows !== undefined) {
      if (rawOptions.maxRows <= 0) {
        throw new ValidationError('Max rows must be a positive number');
      }
      options.maxRows = rawOptions.maxRows;
    }

    options.enableHashing = !rawOptions.noHashing;
    options.includeEnvironment = !rawOptions.noEnvironment;

    if (rawOptions.privacy) {
      if (!['full', 'redacted', 'minimal'].includes(rawOptions.privacy)) {
        throw new ValidationError('Privacy mode must be one of: full, redacted, minimal');
      }
      options.privacyMode = rawOptions.privacy;
    }

    // Performance options
    if (rawOptions.maxMemory !== undefined) {
      if (rawOptions.maxMemory <= 0) {
        throw new ValidationError('Max memory must be a positive number');
      }
      options.maxMemory = rawOptions.maxMemory;
    }

    // Behaviour options
    options.force = Boolean(rawOptions.force);
    options.dryRun = Boolean(rawOptions.dryRun);
    options.showProgress = !rawOptions.noProgress && !options.quiet;

    return options;
  }

  /**
   * Validate file path and accessibility
   */
  validateFile(filePath: string): string {
    const resolvedPath = resolve(filePath);
    
    if (!existsSync(resolvedPath)) {
      throw new FileError(`File not found: ${filePath}`, resolvedPath);
    }

    try {
      const stats = statSync(resolvedPath);
      
      if (!stats.isFile()) {
        throw new FileError(`Path is not a file: ${filePath}`, resolvedPath);
      }

      if (stats.size === 0) {
        throw new FileError(`File is empty: ${filePath}`, resolvedPath);
      }

      if (stats.size > 10 * 1024 * 1024 * 1024) { // 10GB
        throw new FileError(`File is too large (>10GB): ${filePath}`, resolvedPath);
      }

    } catch (error) {
      if (error instanceof FileError) {
        throw error;
      }
      throw new FileError(`Cannot access file: ${filePath}`, resolvedPath);
    }

    return resolvedPath;
  }

  /**
   * Parse integer with validation
   */
  private parseInteger(value: string): number {
    const parsed = parseInt(value, 10);
    if (isNaN(parsed)) {
      throw new ValidationError(`Invalid number: ${value}`);
    }
    return parsed;
  }

  /**
   * Get the stored command context (used by main CLI)
   */
  getLastContext(): any {
    const context = (this.program as any)._lastContext;
    if (context) {
      // Merge global options with command-specific options
      const globalOptions = this.program.opts();
      const mergedOptions = { ...globalOptions, ...context.options };
      
      
      return {
        ...context,
        options: this.validateOptions(mergedOptions),
      };
    }
    return context;
  }

  /**
   * Show help for specific command or general help
   */
  showHelp(command?: string): void {
    if (command) {
      const cmd = this.program.commands.find(c => c.name() === command);
      if (cmd) {
        cmd.help();
      } else {
        console.error(`Unknown command: ${command}`);
        this.program.help();
      }
    } else {
      this.program.help();
    }
  }
}