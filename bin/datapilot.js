#!/usr/bin/env node

import { program } from 'commander';
import { existsSync, accessSync, constants as fsConstants } from 'fs';
import { resolve, basename } from 'path';
import path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import os from 'os';

// Import commands
import { run } from '../src/commands/run.js';
import { eda } from '../src/commands/eda.js';
import { integrity } from '../src/commands/int.js';
import { visualize } from '../src/commands/vis.js';
import { engineering } from '../src/commands/eng.js';
import { llmContext } from '../src/commands/llm.js';
import { runAll } from '../src/commands/all.js';

// Import enhanced parser utilities
import { normalizePath, loadConfig } from '../src/utils/parser.js';

// Import format utilities
import { createError } from '../src/utils/format.js';

// ASCII art banner with version
const VERSION = '1.2.0-cli-only';
const banner = `
╔═══════════════════════════════════════╗
║          ${chalk.cyan('DataPilot CLI')}              ║
║    ${chalk.gray('Simple & LLM-Ready Analysis')}      ║
║         ${chalk.yellow(`Version ${VERSION}`)}             ║
╚═══════════════════════════════════════╝
`;

console.log(banner);

// Load configuration early
const globalConfig = loadConfig();

// Configure program
program
  .name('datapilot')
  .description('CSV analysis tool optimized for LLM consumption')
  .version(VERSION);

// Enhanced file validation with better error messages
async function validateFile(filePath) {
  try {
    // Import enhanced error handling
    const { DataPilotError } = await import('../src/utils/errorHandler.js');
    
    // Use enhanced path normalization
    const resolvedPath = normalizePath(filePath);
    
    if (!existsSync(resolvedPath)) {
      const error = new DataPilotError(
        `File not found: ${filePath}`,
        'FILE_NOT_FOUND',
        { filePath, resolvedPath }
      );
      console.error(error.getFormattedMessage());
      process.exit(1);
    }
    
    if (!filePath.toLowerCase().endsWith('.csv')) {
      const error = new DataPilotError(
        `File must be a CSV file: ${filePath}`,
        'INVALID_CSV_FORMAT',
        { filePath, extension: path.extname(filePath) }
      );
      console.error(error.getFormattedMessage());
      process.exit(1);
    }
    
    // Check file permissions
    try {
      accessSync(resolvedPath, fsConstants.R_OK);
    } catch (permError) {
      const error = new DataPilotError(
        `Permission denied accessing file: ${filePath}`,
        'PERMISSION_DENIED',
        { filePath, resolvedPath }
      );
      console.error(error.getFormattedMessage());
      process.exit(1);
    }
    
    return resolvedPath;
  } catch (error) {
    console.error(chalk.red(`❌ Error validating file: ${error.message}`));
    process.exit(1);
  }
}

// Progress tracking wrapper for commands
async function runWithProgress(command, filePath, options) {
  const showProgress = globalConfig.ui.showProgress && !options.quiet;
  const timeout = options.timeout || 60000; // Default 60 seconds
  
  const spinner = showProgress ? ora({
    text: 'Initializing analysis...',
    color: 'cyan'
  }).start() : null;
  
  try {
    // Add progress callback and config to options
    const enhancedOptions = {
      ...options,
      config: globalConfig, // Pass config to commands
      onProgress: (progress, details) => {
        if (spinner && progress < 100) {
          spinner.text = `Processing: ${Math.round(progress)}%${details ? ` - ${details}` : ''}`;
        } else if (spinner) {
          spinner.text = 'Finalizing analysis...';
        }
      }
    };
    
    if (spinner) spinner.stop();
    
    // Add timeout wrapper
    const analysisPromise = command(filePath, enhancedOptions);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error(`Analysis timed out after ${timeout/1000} seconds. Try using a smaller dataset or increase timeout with --timeout.`)), timeout)
    );
    
    const result = await Promise.race([analysisPromise, timeoutPromise]);
    
    // Ensure process exits cleanly after successful completion
    process.exit(0);
    return result;
  } catch (error) {
    if (spinner) spinner.fail(`Analysis failed: ${error.message}`);
    console.error(chalk.red('Analysis failed'));
    if (error.stack && (globalConfig.ui.verboseErrors || options.verbose)) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// RUN command - comprehensive data analysis (EDA + INT + LLM)
program
  .command('run <file>')
  .description('Run comprehensive analysis - combines statistical analysis and quality checks')
  .option('-o, --output <path>', 'Save analysis to file')
  .option('-c, --compact', 'Compact output mode for terminal viewing')
  .option('--no-header', 'CSV file has no header row')
  .option('--encoding <encoding>', 'Force specific encoding (utf8, latin1, etc.)')
  .option('--delimiter <delimiter>', 'Force specific delimiter (comma, semicolon, tab, pipe)')
  .option('--timeout <ms>', 'Set timeout in milliseconds (default: 60000)', '60000')
  .option('--force', 'Continue analysis despite data quality warnings')
  .action(async (file, options) => {
    const filePath = await validateFile(file);
    // Convert timeout to number
    if (options.timeout) options.timeout = parseInt(options.timeout);
    await runWithProgress(run, filePath, options);
  });

// ALL command - run complete analysis suite
program
  .command('all <file>')
  .description('Run complete analysis suite - all commands in one go')
  .option('-o, --output <path>', 'Save analysis to file')
  .option('-c, --compact', 'Compact output mode for terminal viewing')
  .option('--no-header', 'CSV file has no header row')
  .option('--encoding <encoding>', 'Force specific encoding (utf8, latin1, etc.)')
  .option('--delimiter <delimiter>', 'Force specific delimiter (comma, semicolon, tab, pipe)')
  .option('--timeout <ms>', 'Set timeout in milliseconds (default: 60000)', '60000')
  .option('--force', 'Continue analysis despite data quality warnings')
  .action(async (file, options) => {
    const filePath = await validateFile(file);
    // Convert timeout to number
    if (options.timeout) options.timeout = parseInt(options.timeout);
    await runWithProgress(runAll, filePath, options);
  });

// VIS command - Business Intelligence Suite
program
  .command('vis <file>')
  .description('Business Intelligence Suite - visualization insights and data archaeology')
  .option('-o, --output <path>', 'Save analysis to file')
  .option('--no-header', 'CSV file has no header row')
  .option('--encoding <encoding>', 'Force specific encoding (utf8, latin1, etc.)')
  .option('--delimiter <delimiter>', 'Force specific delimiter (comma, semicolon, tab, pipe)')
  .option('--timeout <ms>', 'Set timeout in milliseconds (default: 60000)', '60000')
  .option('--force', 'Continue analysis despite data quality warnings')
  .action(async (file, options) => {
    const filePath = await validateFile(file);
    // Convert timeout to number
    if (options.timeout) options.timeout = parseInt(options.timeout);
    await runWithProgress(visualize, filePath, options);
  });

// Legacy Commands (Hidden)
// These individual components are now integrated into the main 3-command structure:
// - EDA (Exploratory Data Analysis) → integrated into 'run'
// - INT (Data Integrity Check) → integrated into 'run'  
// - Original VIS → integrated into new 'vis'
// - ENG (Data Engineering) → integrated into new 'vis'
// - LLM formatting → integrated into 'run'
//
// Legacy commands are preserved for backward compatibility and power users
// but are hidden from main help to avoid confusion with the new streamlined interface

// ENG command - Advanced data archaeology (hidden, use 'vis' for most users)
const eng = program.command('eng', { hidden: true });
eng.description('Data Engineering Archaeology - builds collective intelligence about your warehouse');

// Default action for single file (backward compatible)
eng
  .argument('[file]', 'CSV file to analyze')
  .option('-o, --output <path>', 'Save analysis to file')
  .option('--no-header', 'CSV file has no header row')
  .option('--encoding <encoding>', 'Force specific encoding (utf8, latin1, etc.)')
  .option('--delimiter <delimiter>', 'Force specific delimiter (comma, semicolon, tab, pipe)')
  .option('--force', 'Continue analysis despite data quality warnings')
  .action(async (file, options) => {
    if (file) {
      const filePath = await validateFile(file);
      await runWithProgress(engineering, filePath, options);
    } else {
      // Show help if no file provided
      eng.help();
    }
  });

// Subcommand: analyze multiple files
eng
  .command('analyze <files...>')
  .description('Analyze multiple CSV files and detect relationships')
  .option('--no-header', 'CSV files have no header row')
  .option('--encoding <encoding>', 'Force specific encoding for all files')
  .option('--delimiter <delimiter>', 'Force specific delimiter for all files')
  .option('--force', 'Continue analysis despite data quality warnings')
  .action(async (files, options) => {
    const { glob } = await import('glob');
    console.log(chalk.blue('🏛️  Starting multi-file warehouse analysis...\n'));
    
    // Process all files (including glob patterns)
    const allFiles = [];
    for (const pattern of files) {
      if (pattern.includes('*')) {
        try {
          // Handle Windows paths in glob patterns
          const normalizedPattern = os.platform() === 'win32' 
            ? pattern.replace(/\\/g, '/')
            : pattern;
          const matches = await glob(normalizedPattern, { nodir: true });
          allFiles.push(...matches.filter(f => f.endsWith('.csv')));
        } catch (error) {
          console.error(chalk.red(`Error with pattern ${pattern}: ${error.message}`));
        }
      } else {
        allFiles.push(pattern);
      }
    }
    
    // Validate all files
    const filePaths = [];
    for (const file of allFiles) {
      try {
        const validated = validateFile(file);
        filePaths.push(validated);
      } catch (error) {
        console.error(chalk.red(`Skipping invalid file: ${file}`));
      }
    }
    
    if (filePaths.length === 0) {
      console.error(chalk.red('❌ No valid CSV files found'));
      process.exit(1);
    }
    
    console.log(chalk.green(`✓ Found ${filePaths.length} CSV files to analyze\n`));
    
    // Analyze each file with progress
    for (const filePath of filePaths) {
      console.log(chalk.cyan(`\nAnalyzing ${basename(filePath)}...`));
      
      const spinner = ora({
        text: 'Processing...',
        color: 'cyan'
      }).start();
      
      try {
        await engineering(filePath, { 
          ...options, 
          quiet: true, 
          autoSave: true,
          onProgress: (progress) => {
            spinner.text = `Processing: ${Math.round(progress)}%`;
          }
        });
        spinner.succeed(`Completed ${basename(filePath)}`);
      } catch (error) {
        spinner.fail(`Failed: ${error.message}`);
        console.error(chalk.red('Analysis failed'));
        if (error.stack) {
          console.error(error.stack);
        }
        process.exit(1);
      }
    }
    
    // Show relationships and generate report
    console.log(chalk.green('\n✅ All files analyzed!'));
    console.log(chalk.blue('\nGenerating warehouse map and relationships...\n'));
    await engineering(null, { showMap: true });
  });

// Subcommand: save insights
eng
  .command('save <table> [insights]')
  .description('Save LLM insights for a table (can pipe from stdin)')
  .action(async (table, insights) => {
    let finalInsights = insights;
    
    // If no insights provided, try to read from stdin
    if (!insights && !process.stdin.isTTY) {
      const chunks = [];
      for await (const chunk of process.stdin) {
        chunks.push(chunk);
      }
      finalInsights = Buffer.concat(chunks).toString().trim();
    }
    
    if (!finalInsights) {
      console.error(chalk.red('❌ Error: Please provide insights either as argument or via stdin'));
      console.log('\nExamples:');
      console.log('  datapilot eng save orders "PURPOSE: Transaction fact table..."');
      console.log('  echo "PURPOSE: Transaction fact table..." | datapilot eng save orders');
      process.exit(1);
    }
    
    await engineering(null, { saveInsights: [table, finalInsights] });
  });

// Subcommand: generate report
eng
  .command('report')
  .description('Generate comprehensive warehouse report from all analyses')
  .option('-o, --output <path>', 'Save report to file')
  .action(async (options) => {
    await engineering(null, { compileKnowledge: true, ...options });
  });

// Subcommand: show map
eng
  .command('map')
  .description('Display warehouse domain map')
  .action(async () => {
    await engineering(null, { showMap: true });
  });

// CONFIG command - manage configuration settings
program
  .command('config')
  .description('Manage DataPilot configuration settings')
  .option('--show', 'Show current configuration')
  .option('--reset', 'Reset to default configuration')
  .option('--path', 'Show configuration file paths')
  .action((options) => {
    if (options.show) {
      console.log(chalk.cyan('📄 Current DataPilot Configuration:'));
      console.log(chalk.cyan('═'.repeat(40)));
      
      const config = loadConfig();
      const configDisplay = JSON.stringify(config, null, 2)
        .replace(/"([^"]+)":/g, chalk.yellow('"$1"') + ':')
        .replace(/: "([^"]*)"([,\n])/g, ': ' + chalk.green('"$1"') + '$2')
        .replace(/: (\d+)([,\n])/g, ': ' + chalk.blue('$1') + '$2')
        .replace(/: (true|false)([,\n])/g, ': ' + chalk.magenta('$1') + '$2');
      
      console.log(configDisplay);
      
      if (config._meta) {
        console.log(chalk.gray('\nConfiguration loaded from: ' + config._meta.source));
        console.log(chalk.gray('Loaded at: ' + config._meta.loadedAt));
      }
    } else if (options.path) {
      console.log(chalk.cyan('📁 Configuration file locations (in order of priority):'));
      console.log(chalk.cyan('═'.repeat(50)));
      console.log('1. ' + chalk.yellow('./datapilot.config.json') + chalk.gray(' (project-specific)'));
      console.log('2. ' + chalk.yellow(path.join(process.cwd(), 'datapilot.config.json')) + chalk.gray(' (current directory)'));
      console.log('3. ' + chalk.yellow(path.join(os.homedir(), '.datapilot', 'config.json')) + chalk.gray(' (user home)'));
      console.log('4. ' + chalk.yellow(path.join(process.env.APPDATA || os.homedir(), 'datapilot', 'config.json')) + chalk.gray(' (system)'));
      
      console.log(chalk.cyan('\n📋 Example configuration file:'));
      const exampleConfig = {
        performance: {
          maxMemoryRows: 50000,
          progressUpdateInterval: 1000
        },
        parsing: {
          encoding: "auto",
          dateFormats: ["DD/MM/YYYY", "YYYY-MM-DD"]
        },
        ui: {
          showProgress: true,
          compactOutput: false
        },
        analysis: {
          enableFuzzyDuplicates: true,
          australianDataDetection: true
        }
      };
      console.log(JSON.stringify(exampleConfig, null, 2));
    } else if (options.reset) {
      console.log(chalk.yellow('⚠️  Configuration reset would require removing user config files manually.'));
      console.log(chalk.yellow('    Run with --path to see configuration file locations.'));
    } else {
      console.log(chalk.cyan('🔧 DataPilot Configuration Management'));
      console.log(chalk.cyan('═'.repeat(35)));
      console.log('Usage:');
      console.log('  datapilot config --show     Show current configuration');
      console.log('  datapilot config --path     Show config file locations and example');
      console.log('  datapilot config --reset    Instructions to reset configuration');
      console.log('');
      console.log(chalk.gray('Configuration affects performance, parsing behavior, and UI preferences.'));
      console.log(chalk.gray('Higher priority configs override lower priority ones.'));
    }
  });

// Legacy individual commands (hidden for backward compatibility)
// Note: These are preserved for existing scripts/workflows but hidden from main help
// New users should use the consolidated commands: run, vis, all

// EDA command - Legacy (use 'run' command instead)
program
  .command('eda <file>', { hidden: true })
  .description('[LEGACY] Exploratory Data Analysis - use "run" command instead')
  .option('-o, --output <path>', 'Save analysis to file')
  .option('-q, --quick', 'Quick mode - basic statistics only')
  .option('--no-header', 'CSV file has no header row')
  .option('--encoding <encoding>', 'Force specific encoding (utf8, latin1, etc.)')
  .option('--delimiter <delimiter>', 'Force specific delimiter (comma, semicolon, tab, pipe)')
  .option('--timeout <ms>', 'Set timeout in milliseconds (default: 30000)', '30000')
  .option('--force', 'Continue analysis despite data quality warnings')
  .action(async (file, options) => {
    console.log(chalk.yellow('ℹ️  Note: "eda" command is legacy. Use "datapilot run" for comprehensive analysis.'));
    const filePath = await validateFile(file);
    if (options.timeout) options.timeout = parseInt(options.timeout);
    await runWithProgress(eda, filePath, options);
  });

// INT command - Legacy (use 'run' command instead)
program
  .command('int <file>', { hidden: true })
  .description('[LEGACY] Data Integrity Check - use "run" command instead')
  .option('-o, --output <path>', 'Save analysis to file')
  .option('--no-header', 'CSV file has no header row')
  .option('--encoding <encoding>', 'Force specific encoding (utf8, latin1, etc.)')
  .option('--delimiter <delimiter>', 'Force specific delimiter (comma, semicolon, tab, pipe)')
  .option('--force', 'Continue analysis despite data quality warnings')
  .action(async (file, options) => {
    console.log(chalk.yellow('ℹ️  Note: "int" command is legacy. Use "datapilot run" for comprehensive analysis.'));
    const filePath = await validateFile(file);
    await runWithProgress(integrity, filePath, options);
  });

// LLM command - Legacy (integrated into 'run' command)
program
  .command('llm <file>', { hidden: true })
  .description('[LEGACY] LLM Context Generation - now integrated into "run" command')
  .option('-o, --output <path>', 'Save analysis to file')
  .option('--no-header', 'CSV file has no header row')
  .option('--encoding <encoding>', 'Force specific encoding (utf8, latin1, etc.)')
  .option('--delimiter <delimiter>', 'Force specific delimiter (comma, semicolon, tab, pipe)')
  .option('--timeout <ms>', 'Set timeout in milliseconds (default: 60000)', '60000')
  .option('--force', 'Continue analysis despite data quality warnings')
  .option('--comprehensive <bool>', 'Use comprehensive analysis (default: true)', 'true')
  .action(async (file, options) => {
    console.log(chalk.yellow('ℹ️  Note: "llm" command is legacy. Use "datapilot run" for LLM-optimized output.'));
    const filePath = await validateFile(file);
    if (options.timeout) options.timeout = parseInt(options.timeout);
    if (options.comprehensive) options.comprehensive = options.comprehensive === 'true';
    await runWithProgress(llmContext, filePath, options);
  });

// UI command - Interactive Terminal Interface

// Help text with enhanced examples
program.on('--help', () => {
  console.log('');
  console.log(chalk.cyan('Examples:'));
  console.log('  $ datapilot run data.csv                    # Comprehensive analysis (stats + quality)');
  console.log('  $ datapilot vis data.csv                    # Business intelligence (charts + engineering)');
  console.log('  $ datapilot all data.csv                    # Complete suite (everything)');
  console.log('  $ datapilot all "C:\\My Data\\sales.csv"      # Path with spaces (use quotes)');
  console.log('  $ datapilot run data.csv -o report.txt      # Save to file');
  console.log('  $ datapilot vis sales.csv --encoding latin1 # Force encoding');
  console.log('  $ datapilot all data.csv --delimiter ";"    # Force delimiter');
  console.log('  $ datapilot config --show                   # View current configuration');
  console.log('');
  console.log(chalk.gray('What\'s included in each command:'));
  console.log(chalk.gray('  • run: Statistical analysis (EDA) + Quality checks (INT) + AI-ready output'));
  console.log(chalk.gray('  • vis: Chart recommendations + Data engineering insights'));
  console.log(chalk.gray('  • all: Everything above in one comprehensive report'));
  console.log('');
  console.log(chalk.gray('Note: Legacy commands (eda, int, llm) are available but hidden.'));
  console.log(chalk.gray('Use the new consolidated commands above for the best experience.'));
  console.log(chalk.cyan('Common Options:'));
  console.log('  -o, --output <path>      Save analysis to file');
  console.log('  -q, --quick              Quick mode - skip detailed analyses');
  console.log('  --no-header              CSV has no header row');
  console.log('  --encoding <type>        Force encoding (utf8, latin1, utf16le)');
  console.log('  --delimiter <char>       Force delimiter (comma, semicolon, tab, pipe)');
  console.log('  --timeout <ms>           Set timeout in milliseconds (default: 60s)');
  console.log('  --force                  Continue analysis despite data quality warnings');
  console.log('  --comprehensive          Use comprehensive analysis (default: true)');
  console.log('');
  console.log(chalk.cyan('Troubleshooting:'));
  console.log('  • For paths with spaces, use quotes: "C:\\My Folder\\data.csv"');
  console.log('  • For encoding issues, try: --encoding latin1');
  console.log('  • For delimiter issues, try: --delimiter ";"');
  console.log('  • For large files, quick mode is recommended: --quick');
  console.log('  • If analysis hangs, try: --timeout 120000 (2 minutes)');
  console.log('  • For data quality issues, try: --force');
  console.log('');
  console.log(chalk.gray('Output:'));
  console.log(chalk.gray('  All commands produce verbose text output optimized for'));
  console.log(chalk.gray('  copying into ChatGPT, Claude, or any other LLM.'));
});

// Enhanced error handling
process.on('uncaughtException', (error) => {
  console.error(chalk.red('\n❌ Unexpected error:'), error.message);
  
  // Provide helpful suggestions based on error type
  if (error.message.includes('ENOENT')) {
    console.error(chalk.yellow('💡 File not found. Check the file path and try again.'));
  } else if (error.message.includes('EACCES')) {
    console.error(chalk.yellow('💡 Permission denied. Check file permissions.'));
  } else if (error.message.includes('encoding')) {
    console.error(chalk.yellow('💡 Try specifying encoding: --encoding latin1'));
  } else if (error.message.includes('memory')) {
    console.error(chalk.yellow('💡 Out of memory. Try --quick mode or process smaller files.'));
  }
  
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(chalk.red('\n❌ Unhandled promise rejection:'), reason);
  process.exit(1);
});

// Parse arguments
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
