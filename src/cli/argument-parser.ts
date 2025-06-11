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
      // Handle empty arguments case
      if (argv.length <= 2) {
        return {
          command: 'help',
          args: [],
          options: {},
          startTime: Date.now(),
          workingDirectory: process.cwd(),
        };
      }

      // Check for help flag to avoid process.exit
      if (argv.includes('--help') || argv.includes('-h')) {
        return {
          command: 'help',
          args: [],
          options: {},
          startTime: Date.now(),
          workingDirectory: process.cwd(),
        };
      }

      this.program.parse(argv);

      // Get the parsed command and options
      const lastContext = this.getLastContext();
      if (lastContext) {
        return {
          ...lastContext,
          startTime: Date.now(),
          workingDirectory: process.cwd(),
        };
      }

      // Fallback for basic parsing
      // Check if we have any remaining args after parsing
      const remainingArgs = this.program.args;
      const command = remainingArgs.length > 0 ? remainingArgs[0] : 'help';
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
      .description(
        'A lightweight CLI statistical computation engine for comprehensive CSV data analysis',
      )
      .version('1.2.0')
      .helpOption(false) // Disable automatic help to handle it manually
      .addHelpText(
        'after',
        `

Confidence Metrics Guide:
DataPilot reports confidence scores throughout the analysis. These indicate the reliability of automated decisions:

• Parsing Confidence (Section 1): 95% = High certainty in CSV parameter detection
• Type Detection Confidence (Section 3): 0.85+ = Strong evidence for data type classification  
• Visualization Confidence (Section 4): 0.9+ = Chart type strongly recommended
• Quality Scores (Section 2): Based on completeness of quality dimension analysis
• ML Readiness (Section 5): Reflects assessment completeness and data suitability
• Modeling Confidence (Section 6): Categorical levels based on task clarity and algorithm fit

Use --verbose for detailed confidence explanations in reports.`,
      );

    // Global options
    this.program
      .option('-v, --verbose', 'Enable verbose output with detailed progress')
      .option('-q, --quiet', 'Suppress all output except errors')
      .option('--no-progress', 'Disable progress indicators')
      .option('--dry-run', 'Validate inputs without performing analysis')
      .option('-h, --help', 'Display help information');

    // Main command: analyze all sections
    this.program
      .command('all')
      .argument('<file>', 'CSV file to analyze')
      .description('Run complete analysis on a CSV file (all sections)')
      .option('-o, --output <format>', 'Output format (txt, markdown, json, yaml)', 'txt')
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
      .alias('ove')
      .argument('<file>', 'CSV file to analyze')
      .description('Generate dataset overview (Section 1 only)')
      .option('-o, --output <format>', 'Output format (txt, markdown, json, yaml)', 'txt')
      .option('--output-file <file>', 'Write output to file instead of stdout')
      .option('--no-hashing', 'Disable file hashing for faster processing')
      .option('--privacy <mode>', 'Privacy mode (full, redacted, minimal)', 'redacted')
      .action(this.createCommandHandler('overview'));

    // Section 2: Quality analysis
    this.program
      .command('quality')
      .alias('qua')
      .argument('<file>', 'CSV file to analyze')
      .description('Run data quality audit (Section 2)')
      .option('-o, --output <format>', 'Output format (txt, markdown, json, yaml)', 'txt')
      .option('--output-file <file>', 'Write output to file instead of stdout')
      .option('--max-rows <number>', 'Maximum rows to process', this.parseInteger)
      .option('--strict', 'Enable strict quality checking mode')
      .action(this.createCommandHandler('quality'));

    this.program
      .command('eda')
      .argument('<file>', 'CSV file to analyze')
      .description('Perform exploratory data analysis (Section 3)')
      .option('-o, --output <format>', 'Output format (txt, markdown, json, yaml)', 'txt')
      .option('--output-file <file>', 'Write output to file instead of stdout')
      .option('--max-rows <number>', 'Maximum rows to analyze', this.parseInteger)
      .option('--chunk-size <number>', 'Chunk size for streaming processing', this.parseInteger)
      .option('--memory-limit <mb>', 'Memory limit in MB', this.parseInteger)
      .action(this.createCommandHandler('eda'));

    this.program
      .command('visualization')
      .alias('vis')
      .argument('<file>', 'CSV file to analyze')
      .description('Generate visualization recommendations (Section 4)')
      .option('-o, --output <format>', 'Output format (txt, markdown, json, yaml)', 'txt')
      .option('--output-file <file>', 'Write output to file instead of stdout')
      .option('--accessibility <level>', 'Accessibility level (excellent, good, adequate)', 'good')
      .option(
        '--complexity <level>',
        'Complexity threshold (simple, moderate, complex)',
        'moderate',
      )
      .option(
        '--max-recommendations <number>',
        'Maximum recommendations per chart',
        this.parseInteger,
      )
      .option('--include-code', 'Include implementation code examples')
      .action(this.createCommandHandler('viz'));

    this.program
      .command('engineering')
      .alias('eng')
      .argument('<file>', 'CSV file to analyze')
      .description('Provide data engineering insights (Section 5)')
      .option('-o, --output <format>', 'Output format', 'markdown')
      .action(this.createCommandHandler('engineering'));

    this.program
      .command('modeling')
      .alias('mod')
      .argument('<file>', 'CSV file to analyze')
      .description('Generate predictive modeling guidance (Section 6)')
      .option('-o, --output <format>', 'Output format', 'markdown')
      .action(this.createCommandHandler('modeling'));

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
    return (file: string, options: Record<string, unknown>) => {
      // Store the context for the main CLI to pick up
      (this.program as any)._lastContext = {
        command: commandName,
        file,
        options,
        args: [file], // Include the file in args for compatibility
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
      overview: '1',
      quality: '2',
      eda: '3',
      viz: '4',
      engineering: '5',
      modeling: '6',
    };
    return numbers[section] || '?';
  }

  /**
   * Validate and normalize CLI options
   */
  private validateOptions(rawOptions: Record<string, unknown>): CLIOptions {
    const options: CLIOptions = {};

    // Output options
    if (rawOptions.output) {
      if (!['txt', 'markdown', 'json', 'yaml'].includes(rawOptions.output as string)) {
        throw new ValidationError('Output format must be one of: txt, markdown, json, yaml');
      }
      options.output = rawOptions.output as 'txt' | 'markdown' | 'json' | 'yaml';
    }

    if (rawOptions.outputFile) {
      options.outputFile = resolve(rawOptions.outputFile as string);
    }

    // Verbosity options
    options.verbose = Boolean(rawOptions.verbose);
    options.quiet = Boolean(rawOptions.quiet);

    if (options.verbose && options.quiet) {
      throw new ValidationError('Cannot use both --verbose and --quiet options');
    }

    // Analysis options
    if (rawOptions.maxRows !== undefined) {
      const maxRows = Number(rawOptions.maxRows);
      if (maxRows <= 0) {
        throw new ValidationError('Max rows must be a positive number');
      }
      options.maxRows = maxRows;
    }

    options.enableHashing = !rawOptions.noHashing;
    options.includeEnvironment = !rawOptions.noEnvironment;

    if (rawOptions.privacy) {
      if (!['full', 'redacted', 'minimal'].includes(rawOptions.privacy as string)) {
        throw new ValidationError('Privacy mode must be one of: full, redacted, minimal');
      }
      options.privacyMode = rawOptions.privacy as 'full' | 'redacted' | 'minimal';
    }

    // Performance options
    if (rawOptions.maxMemory !== undefined) {
      const maxMemory = Number(rawOptions.maxMemory);
      if (maxMemory <= 0) {
        throw new ValidationError('Max memory must be a positive number');
      }
      options.maxMemory = maxMemory;
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

      if (stats.size > 10 * 1024 * 1024 * 1024) {
        // 10GB
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
  getLastContext(): CLIContext | null {
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
      const cmd = this.program.commands.find((c) => c.name() === command);
      if (cmd) {
        // Use outputHelp instead of help to avoid process.exit
        process.stdout.write(cmd.helpInformation());
      } else {
        console.error(`Unknown command: ${command}`);
        process.stdout.write(this.program.helpInformation());
      }
    } else {
      process.stdout.write(this.program.helpInformation());
    }
  }
}
