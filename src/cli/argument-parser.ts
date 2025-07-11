/**
 * CLI Argument Parser and Validator
 */

import { Command } from 'commander';
import { existsSync, statSync } from 'fs';
import { resolve } from 'path';
import type { CLIOptions, CLIContext } from './types';
import { ValidationError, FileError } from './types';
import * as packageJson from '../../package.json';

export class ArgumentParser {
  private program: Command;

  constructor() {
    this.program = new Command();
    this.setupCommands();
  }

  /**
   * Parse command line arguments
   */
  public parse(argv: string[]): CLIContext {
    try {
      this.program.parse(argv);

      // Get the parsed command and options
      const lastContext = (this.program as any)._lastContext;
      if (lastContext) {
        // Merge global options with command-specific options and validate them
        const globalOptions = this.program.opts();
        const mergedOptions = { ...globalOptions, ...lastContext.options };
        
        return {
          ...lastContext,
          options: this.validateOptions(mergedOptions),
          startTime: Date.now(),
          workingDirectory: process.cwd(),
        };
      }

      // Fallback for basic parsing (e.g., no command specified, just global options)
      const remainingArgs = this.program.args;
      const globalOptions = this.program.opts();
      const command = remainingArgs.length > 0 ? remainingArgs[0] : 'help';

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
      .version(packageJson.version)
      .addHelpText(
        'after',
        `

Confidence Metrics Guide:
DataPilot reports confidence scores throughout the analysis. These indicate the reliability of automated decisions:

• Parsing Confidence (Section 1): 95% = High certainty in CSV parameter detection
• Type Detection Confidence (Section 3): 85%+ = Strong evidence for data type classification  
• Visualization Confidence (Section 4): 90%+ = Chart type strongly recommended
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
      .option('--help-windows', 'Show Windows-specific installation and PATH setup guide')
      // Performance and auto-configuration options
      .option('--auto-config', 'Enable smart auto-configuration based on system resources')
      .option('--preset <name>', 'Use performance preset (ultra-large-files, large-files, balanced, speed-optimized, memory-constrained)')
      .option('--threads <number>', 'Number of worker threads (auto-detected if not specified)', this.parseInteger)
      .option('--cache', 'Enable section result caching for performance')
      .option('--cache-size <mb>', 'Cache size limit in MB', this.parseInteger)
      .option('--no-cache', 'Disable all caching')
      .option('--streaming', 'Force streaming optimizations for large files')
      .option('--progressive', 'Enable progressive analysis reporting')
      // Execution mode options for backward compatibility
      .option('--force-sequential', 'Force sequential execution with dependency resolution')
      .option('--force-individual', 'Force individual section execution (legacy mode)')
      .option('--no-fallback', 'Disable fallback to individual execution on sequential failure')
      .option('--continue-on-error', 'Continue execution even if sections fail');

    // Main command: analyze all sections
    this.program
      .command('all')
      .argument('<file>', 'CSV file to analyze')
      .description('Run complete analysis on a CSV file (all sections)')
      .option('-f, --format <format>', 'Output format (txt, markdown, json, yaml)', 'json')
      .option('-o, --output <file>', 'Write output to file instead of stdout')
      .option('--delimiter <char>', 'Specify delimiter character (e.g., ";" for semicolon)')
      .option('--max-rows <number>', 'Maximum rows to process', this.parseInteger)
      .option('--no-hashing', 'Disable file hashing for faster processing')
      .option('--no-environment', 'Exclude host environment details from report')
      .option('--privacy <mode>', 'Privacy mode (full, redacted, minimal)', 'redacted')
      .option('--max-memory <mb>', 'Maximum memory usage in MB', this.parseInteger)
      .option('--force', 'Ignore warnings and force processing')
      .option('--preview-rows <number>', 'Number of rows to show in data preview (default: 5)', this.parseInteger)
      .option('--no-compression-analysis', 'Disable compression analysis')
      .option('--no-health-checks', 'Disable file health checks')
      .option('--no-quick-stats', 'Disable quick column statistics')
      .option('--no-data-preview', 'Disable data preview generation')
      // Section selection options
      .option('--sections <sections>', 'Comma-separated list of sections to run (1,2,3,4,5,6)', this.parseSections)
      // Smart sampling options
      .option('--auto-sample', 'Enable automatic sampling for large files (>1GB)')
      .option('--sample <percentage>', 'Sample percentage (e.g., "10%" or "0.1")')
      .option('--sample-rows <number>', 'Sample specific number of rows', this.parseInteger)
      .option('--sample-size <size>', 'Sample by file size (e.g., "100MB")')
      .option('--sample-method <method>', 'Sampling method (random, stratified, systematic, head)', 'random')
      .option('--stratify-by <column>', 'Column name for stratified sampling')
      .option('--seed <number>', 'Random seed for reproducible sampling', this.parseInteger)
      .action(this.createCommandHandler('all'));

    // Section-specific commands
    this.program
      .command('overview')
      .alias('ove')
      .argument('<file>', 'CSV file to analyze')
      .description('Generate dataset overview (Section 1 only)')
      .option('-f, --format <format>', 'Output format (txt, markdown, json, yaml)', 'json')
      .option('-o, --output <file>', 'Write output to file instead of stdout')
      .option('--delimiter <char>', 'Specify delimiter character (e.g., ";" for semicolon)')
      .option('--no-hashing', 'Disable file hashing for faster processing')
      .option('--privacy <mode>', 'Privacy mode (full, redacted, minimal)', 'redacted')
      .option('--preview-rows <number>', 'Number of rows to show in data preview (default: 5)', this.parseInteger)
      .option('--no-compression-analysis', 'Disable compression analysis')
      .option('--no-health-checks', 'Disable file health checks')
      .option('--no-quick-stats', 'Disable quick column statistics')
      .option('--no-data-preview', 'Disable data preview generation')
      .action(this.createCommandHandler('overview'));

    // Section 2: Quality analysis
    this.program
      .command('quality')
      .alias('qua')
      .argument('<file>', 'CSV file to analyze')
      .description('Run data quality audit (Section 2)')
      .option('-f, --format <format>', 'Output format (txt, markdown, json, yaml)', 'json')
      .option('-o, --output <file>', 'Write output to file instead of stdout')
      .option('--delimiter <char>', 'Specify delimiter character (e.g., ";" for semicolon)')
      .option('--max-rows <number>', 'Maximum rows to process', this.parseInteger)
      .option('--strict', 'Enable strict quality checking mode')
      .action(this.createCommandHandler('quality'));

    this.program
      .command('eda')
      .argument('<file>', 'CSV file to analyze')
      .description('Perform exploratory data analysis (Section 3)')
      .option('-f, --format <format>', 'Output format (txt, markdown, json, yaml)', 'json')
      .option('-o, --output <file>', 'Write output to file instead of stdout')
      .option('--delimiter <char>', 'Specify delimiter character (e.g., ";" for semicolon)')
      .option('--max-rows <number>', 'Maximum rows to analyze', this.parseInteger)
      .option('--chunk-size <number>', 'Chunk size for streaming processing', this.parseInteger)
      .option('--memory-limit <mb>', 'Memory limit in MB', this.parseInteger)
      // Smart sampling options
      .option('--auto-sample', 'Enable automatic sampling for large files (>1GB)')
      .option('--sample <percentage>', 'Sample percentage (e.g., "10%" or "0.1")')
      .option('--sample-rows <number>', 'Sample specific number of rows', this.parseInteger)
      .option('--sample-size <size>', 'Sample by file size (e.g., "100MB")')
      .option('--sample-method <method>', 'Sampling method (random, stratified, systematic, head)', 'random')
      .option('--stratify-by <column>', 'Column name for stratified sampling')
      .option('--seed <number>', 'Random seed for reproducible sampling', this.parseInteger)
      .action(this.createCommandHandler('eda'));

    this.program
      .command('visualization')
      .alias('vis')
      .argument('<file>', 'CSV file to analyze')
      .description('Generate visualization recommendations (Section 4)')
      .option('-f, --format <format>', 'Output format (txt, markdown, json, yaml)', 'json')
      .option('-o, --output <file>', 'Write output to file instead of stdout')
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
      .argument('<files...>', 'CSV file(s) to analyze - single file for schema analysis, multiple files for join analysis')
      .description('Provide data engineering insights (Section 5) - supports multi-file join analysis')
      .option('-f, --format <format>', 'Output format (txt, markdown, json, yaml)', 'json')
      .option('-o, --output <file>', 'Write output to file instead of stdout')
      .option('--confidence <threshold>', 'Join confidence threshold (0-1)', this.parseFloat, 0.7)
      .action(this.createJoinCommandHandler('engineering'));

    this.program
      .command('modeling')
      .alias('mod')
      .argument('<file>', 'CSV file to analyze')
      .description('Generate predictive modeling guidance (Section 6)')
      .option('-f, --format <format>', 'Output format (txt, markdown, json, yaml)', 'json')
      .option('-o, --output <file>', 'Write output to file instead of stdout')
      .action(this.createCommandHandler('modeling'));

    // Join Analysis Commands
    this.program
      .command('join')
      .argument('<files...>', 'CSV files to analyze for join relationships')
      .description('Analyze join relationships between multiple CSV files')
      .option('-f, --format <format>', 'Output format (txt, markdown, json, yaml)', 'json')
      .option('-o, --output <file>', 'Write output to file instead of stdout')
      .option('--confidence <threshold>', 'Minimum confidence threshold (0-1)', this.parseFloat, 0.7)
      .option('--max-tables <number>', 'Maximum number of tables to analyze', this.parseInteger, 10)
      .option('--enable-fuzzy', 'Enable fuzzy matching for column names')
      .option('--enable-semantic', 'Enable semantic analysis for relationships')
      .option('--enable-temporal', 'Enable temporal join detection')
      .option('--performance-mode <mode>', 'Analysis mode (fast, balanced, thorough)', 'balanced')
      .action(this.createJoinCommandHandler('join'));

    this.program
      .command('discover')
      .argument('<directory>', 'Directory containing CSV files to discover relationships')
      .description('Auto-discover join relationships in a directory of CSV files')
      .option('-f, --format <format>', 'Output format (txt, markdown, json, yaml)', 'json')
      .option('-o, --output <file>', 'Write output to file instead of stdout')
      .option('--pattern <glob>', 'File pattern to match (e.g., "*.csv")', '*.csv')
      .option('--confidence <threshold>', 'Minimum confidence threshold (0-1)', this.parseFloat, 0.7)
      .option('--recursive', 'Search subdirectories recursively')
      .action(this.createJoinCommandHandler('discover'));

    this.program
      .command('join-wizard')
      .argument('<file1>', 'First CSV file')
      .argument('<file2>', 'Second CSV file')
      .description('Interactive join wizard for two CSV files')
      .option('--on <columns>', 'Specific columns to join on (comma-separated)')
      .option('--preview-rows <number>', 'Number of rows to preview', this.parseInteger, 5)
      .action(this.createJoinCommandHandler('join-wizard'));

    this.program
      .command('optimize-joins')
      .argument('<files...>', 'CSV files to optimize for joining')
      .description('Analyze and recommend join optimizations')
      .option('-f, --format <format>', 'Output format (txt, markdown, json, yaml)', 'json')
      .option('-o, --output <file>', 'Write output to file instead of stdout')
      .option('--include-sql', 'Generate SQL optimization suggestions')
      .option('--include-indexing', 'Include indexing recommendations')
      .action(this.createJoinCommandHandler('optimize-joins'));

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

    // Performance and diagnostics commands
    this.program
      .command('perf')
      .description('Show performance dashboard and system information')
      .option('--cache-stats', 'Show detailed cache statistics')
      .action(this.createNoFileCommandHandler('perf'));

    this.program
      .command('clear-cache')
      .description('Clear all cached analysis results')
      .action(this.createNoFileCommandHandler('clear-cache'));
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
   * Create join command handler for multi-file operations
   */
  private createJoinCommandHandler(commandName: string) {
    return (filesOrDirectory: string | string[], options: Record<string, unknown>) => {
      // Store the context for the main CLI to pick up
      (this.program as any)._lastContext = {
        command: commandName,
        file: Array.isArray(filesOrDirectory) ? filesOrDirectory[0] : filesOrDirectory,
        options,
        args: Array.isArray(filesOrDirectory) ? filesOrDirectory : [filesOrDirectory],
      };
    };
  }

  /**
   * Create command handler for commands that don't require a file argument
   */
  private createNoFileCommandHandler(commandName: string) {
    return (options: Record<string, unknown>) => {
      // Store the context for the main CLI to pick up
      (this.program as any)._lastContext = {
        command: commandName,
        file: '', // No file required
        options,
        args: [],
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
    if (rawOptions.format) {
      if (!['txt', 'markdown', 'json', 'yaml'].includes(rawOptions.format as string)) {
        throw new ValidationError('Output format must be one of: txt, markdown, json, yaml');
      }
      options.output = rawOptions.format as 'txt' | 'markdown' | 'json' | 'yaml';
    }

    if (rawOptions.output) {
      options.outputFile = resolve(rawOptions.output as string);
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

    // Delimiter validation
    if (rawOptions.delimiter !== undefined) {
      const delimiter = rawOptions.delimiter as string;
      if (delimiter.length !== 1) {
        throw new ValidationError('Delimiter must be a single character');
      }
      options.delimiter = delimiter;
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

    // Auto-configuration options
    options.autoConfig = Boolean(rawOptions.autoConfig);
    
    if (rawOptions.preset) {
      const validPresets = ['ultra-large-files', 'large-files', 'balanced', 'speed-optimized', 'memory-constrained'];
      if (!validPresets.includes(rawOptions.preset as string)) {
        throw new ValidationError(`Performance preset must be one of: ${validPresets.join(', ')}`);
      }
      options.preset = rawOptions.preset as string;
    }

    if (rawOptions.threads !== undefined) {
      const threads = Number(rawOptions.threads);
      if (threads <= 0) {
        throw new ValidationError('Thread count must be a positive number');
      }
      options.threads = threads;
    }

    // Caching options
    options.enableCaching = rawOptions.cache ? true : rawOptions.noCache ? false : undefined;
    
    if (rawOptions.cacheSize !== undefined) {
      const cacheSize = Number(rawOptions.cacheSize);
      if (cacheSize <= 0) {
        throw new ValidationError('Cache size must be a positive number');
      }
      options.cacheSize = cacheSize;
    }

    // Performance optimization options
    options.streamingOptimizations = Boolean(rawOptions.streaming);
    options.progressiveReporting = Boolean(rawOptions.progressive);

    // Sampling options
    options.autoSample = Boolean(rawOptions.autoSample);
    
    if (rawOptions.sample !== undefined) {
      const sampleStr = rawOptions.sample as string;
      if (sampleStr.endsWith('%')) {
        const percentage = parseFloat(sampleStr.slice(0, -1));
        if (percentage <= 0 || percentage > 100) {
          throw new ValidationError('Sample percentage must be between 0 and 100');
        }
        options.samplePercentage = percentage / 100;
      } else {
        const ratio = parseFloat(sampleStr);
        if (ratio <= 0 || ratio > 1) {
          throw new ValidationError('Sample ratio must be between 0 and 1');
        }
        options.samplePercentage = ratio;
      }
    }

    if (rawOptions.sampleRows !== undefined) {
      const sampleRows = Number(rawOptions.sampleRows);
      if (sampleRows <= 0) {
        throw new ValidationError('Sample rows must be a positive number');
      }
      options.sampleRows = sampleRows;
    }

    if (rawOptions.sampleSize !== undefined) {
      const sampleSize = rawOptions.sampleSize as string;
      const sizeBytes = this.parseSizeToBytes(sampleSize);
      if (sizeBytes <= 0) {
        throw new ValidationError('Sample size must be a positive value (e.g., "100MB", "1GB")');
      }
      options.sampleSizeBytes = sizeBytes;
    }

    if (rawOptions.sampleMethod !== undefined) {
      const validMethods = ['random', 'stratified', 'systematic', 'head'];
      if (!validMethods.includes(rawOptions.sampleMethod as string)) {
        throw new ValidationError(`Sample method must be one of: ${validMethods.join(', ')}`);
      }
      options.sampleMethod = rawOptions.sampleMethod as 'random' | 'stratified' | 'systematic' | 'head';
    }

    if (rawOptions.stratifyBy !== undefined) {
      options.stratifyBy = rawOptions.stratifyBy as string;
    }

    if (rawOptions.seed !== undefined) {
      const seed = Number(rawOptions.seed);
      if (!Number.isInteger(seed) || seed < 0) {
        throw new ValidationError('Seed must be a non-negative integer');
      }
      options.seed = seed;
    }

    // Section selection options
    if (rawOptions.sections) {
      options.sections = rawOptions.sections as string[];
    }

    // Behaviour options
    options.force = Boolean(rawOptions.force);
    options.dryRun = Boolean(rawOptions.dryRun);
    options.showProgress = !rawOptions.noProgress && !options.quiet;

    // Execution mode options (for backward compatibility)
    options.forceSequential = Boolean(rawOptions.forceSequential);
    options.forceIndividual = Boolean(rawOptions.forceIndividual);
    options.fallbackOnError = rawOptions.noFallback ? false : true;  // Default true unless --no-fallback
    options.continueOnError = Boolean(rawOptions.continueOnError);

    // Validate execution mode conflicts
    if (options.forceSequential && options.forceIndividual) {
      throw new ValidationError('Cannot use both --force-sequential and --force-individual');
    }

    return options;
  }

  /**
   * Validate file path and accessibility
   */
  public validateFile(filePath: string): string {
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

  private parseFloat(value: string): number {
    const parsed = parseFloat(value);
    if (isNaN(parsed)) {
      throw new ValidationError(`Invalid number: ${value}`);
    }
    return parsed;
  }

  /**
   * Parse sections parameter (comma-separated list)
   */
  private parseSections(value: string): string[] {
    const sections = value.split(',').map(s => s.trim());
    const validSections = ['1', '2', '3', '4', '5', '6'];
    
    for (const section of sections) {
      if (!validSections.includes(section)) {
        throw new ValidationError(`Invalid section: ${section}. Valid sections are: ${validSections.join(', ')}`);
      }
    }
    
    return sections;
  }

  /**
   * Parse file size string to bytes (e.g., "100MB" -> 104857600)
   */
  private parseSizeToBytes(sizeStr: string): number {
    const units: Record<string, number> = {
      'B': 1,
      'KB': 1024,
      'MB': 1024 * 1024,
      'GB': 1024 * 1024 * 1024,
      'TB': 1024 * 1024 * 1024 * 1024,
    };

    const match = sizeStr.match(/^(\d+(?:\.\d+)?)\s*(B|KB|MB|GB|TB)$/i);
    if (!match) {
      throw new ValidationError(`Invalid size format: ${sizeStr}. Use format like "100MB", "1.5GB"`);
    }

    const value = parseFloat(match[1]);
    const unit = match[2].toUpperCase();
    
    return Math.floor(value * units[unit]);
  }

  /**
   * Get the stored command context (used by main CLI)
   */
  public getLastContext(): CLIContext | null {
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
  public showHelp(command?: string): void {
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

  public getVersion(): string {
    return packageJson.version;
  }
}
