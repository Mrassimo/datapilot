#!/usr/bin/env node

import { program } from 'commander';
import { existsSync } from 'fs';
import { resolve, basename } from 'path';
import path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import os from 'os';

// Import commands
import { eda } from '../src/commands/eda.js';
import { integrity } from '../src/commands/int.js';
import { visualize } from '../src/commands/vis.js';
import { engineering } from '../src/commands/eng.js';
import { llmContext } from '../src/commands/llm.js';
import { runAll } from '../src/commands/all.js';
import { interactiveUI } from '../src/commands/ui.js';

// Import enhanced parser utilities
import { normalizePath } from '../src/utils/parser.js';

// Import format utilities
import { createError } from '../src/utils/format.js';

// ASCII art banner with version
const VERSION = '1.1.1';
const banner = `
╔═══════════════════════════════════════╗
║          ${chalk.cyan('DataPilot CLI')}              ║
║    ${chalk.gray('Simple & LLM-Ready Analysis')}      ║
║         ${chalk.yellow(`Version ${VERSION}`)}             ║
╚═══════════════════════════════════════╝
`;

console.log(banner);

// Configure program
program
  .name('datapilot')
  .description('CSV analysis tool optimized for LLM consumption')
  .version(VERSION);

// Enhanced file validation with better error messages
function validateFile(filePath) {
  try {
    // Use enhanced path normalization
    const resolvedPath = normalizePath(filePath);
    
    if (!existsSync(resolvedPath)) {
      // Provide helpful error message for common issues
      console.error(chalk.red(`❌ Error: File not found: ${filePath}`));
      
      // Check if it's a path with spaces issue
      if (filePath.includes(' ') && !filePath.startsWith('"')) {
        console.error(chalk.yellow(`💡 Tip: For paths with spaces, use quotes: "${filePath}"`));
      }
      
      // Check if it's a relative path issue
      if (!path.isAbsolute(filePath)) {
        const suggestedPath = path.resolve(filePath);
        console.error(chalk.yellow(`💡 Tip: Try using the full path: ${suggestedPath}`));
      }
      
      process.exit(1);
    }
    
    if (!filePath.toLowerCase().endsWith('.csv')) {
      console.error(chalk.red(`❌ Error: File must be a CSV file: ${filePath}`));
      console.error(chalk.yellow(`💡 Tip: DataPilot works with CSV files only`));
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
  const spinner = ora({
    text: 'Initializing analysis...',
    color: 'cyan'
  }).start();
  
  try {
    // Add progress callback to options
    const enhancedOptions = {
      ...options,
      onProgress: (progress, details) => {
        if (progress < 100) {
          spinner.text = `Processing: ${Math.round(progress)}%${details ? ` - ${details}` : ''}`;
        } else {
          spinner.text = 'Finalizing analysis...';
        }
      }
    };
    
    spinner.stop();
    const result = await command(filePath, enhancedOptions);
    return result;
  } catch (error) {
    spinner.fail(`Analysis failed: ${error.message}`);
    console.error(chalk.red('Analysis failed'));
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// ALL command - run complete analysis suite
program
  .command('all <file>')
  .description('Run complete analysis suite - all commands in one go')
  .option('-o, --output <path>', 'Save analysis to file')
  .option('-q, --quick', 'Quick mode - skip detailed analyses for speed')
  .option('--no-header', 'CSV file has no header row')
  .option('--encoding <encoding>', 'Force specific encoding (utf8, latin1, etc.)')
  .option('--delimiter <delimiter>', 'Force specific delimiter (comma, semicolon, tab, pipe)')
  .option('--timeout <ms>', 'Set timeout in milliseconds (default: 60000)', '60000')
  .option('--force', 'Continue analysis despite data quality warnings')
  .action(async (file, options) => {
    const filePath = validateFile(file);
    // Convert timeout to number
    if (options.timeout) options.timeout = parseInt(options.timeout);
    await runWithProgress(runAll, filePath, options);
  });

// EDA command
program
  .command('eda <file>')
  .description('Exploratory Data Analysis - comprehensive statistical analysis')
  .option('-o, --output <path>', 'Save analysis to file')
  .option('-q, --quick', 'Quick mode - basic statistics only')
  .option('--no-header', 'CSV file has no header row')
  .option('--encoding <encoding>', 'Force specific encoding (utf8, latin1, etc.)')
  .option('--delimiter <delimiter>', 'Force specific delimiter (comma, semicolon, tab, pipe)')
  .option('--timeout <ms>', 'Set timeout in milliseconds (default: 30000)', '30000')
  .option('--force', 'Continue analysis despite data quality warnings')
  .action(async (file, options) => {
    const filePath = validateFile(file);
    // Convert timeout to number
    if (options.timeout) options.timeout = parseInt(options.timeout);
    await runWithProgress(eda, filePath, options);
  });

// INT command
program
  .command('int <file>')
  .description('Data Integrity Check - find quality issues and inconsistencies')
  .option('-o, --output <path>', 'Save analysis to file')
  .option('--no-header', 'CSV file has no header row')
  .option('--encoding <encoding>', 'Force specific encoding (utf8, latin1, etc.)')
  .option('--delimiter <delimiter>', 'Force specific delimiter (comma, semicolon, tab, pipe)')
  .option('--force', 'Continue analysis despite data quality warnings')
  .action(async (file, options) => {
    const filePath = validateFile(file);
    await runWithProgress(integrity, filePath, options);
  });

// VIS command
program
  .command('vis <file>')
  .description('Visualization Recommendations - what charts would be most insightful')
  .option('-o, --output <path>', 'Save analysis to file')
  .option('--no-header', 'CSV file has no header row')
  .option('--encoding <encoding>', 'Force specific encoding (utf8, latin1, etc.)')
  .option('--delimiter <delimiter>', 'Force specific delimiter (comma, semicolon, tab, pipe)')
  .option('--force', 'Continue analysis despite data quality warnings')
  .action(async (file, options) => {
    const filePath = validateFile(file);
    await runWithProgress(visualize, filePath, options);
  });

// ENG command - Data Archaeology System with subcommands
const eng = program.command('eng');
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
      const filePath = validateFile(file);
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

// LLM command
program
  .command('llm <file>')
  .description('LLM Context Generation - perfect summary for AI analysis')
  .option('-o, --output <path>', 'Save analysis to file')
  .option('--no-header', 'CSV file has no header row')
  .option('--encoding <encoding>', 'Force specific encoding (utf8, latin1, etc.)')
  .option('--delimiter <delimiter>', 'Force specific delimiter (comma, semicolon, tab, pipe)')
  .option('--timeout <ms>', 'Set timeout in milliseconds (default: 60000)', '60000')
  .option('--force', 'Continue analysis despite data quality warnings')
  .option('--comprehensive', 'Use comprehensive analysis (default: true)', true)
  .action(async (file, options) => {
    const filePath = validateFile(file);
    // Convert timeout to number
    if (options.timeout) options.timeout = parseInt(options.timeout);
    await runWithProgress(llmContext, filePath, options);
  });

// UI command - Interactive Terminal Interface
program
  .command('ui')
  .description('🎨 Interactive UI - Fun, colorful, beginner-friendly interface')
  .action(async () => {
    // Check terminal capabilities
    if (process.platform === 'win32' && !process.env.WT_SESSION) {
      console.log(chalk.yellow('⚠️  Note: For best experience on Windows, use Windows Terminal'));
    }
    await interactiveUI();
  });

// Help text with enhanced examples
program.on('--help', () => {
  console.log('');
  console.log(chalk.cyan('Examples:'));
  console.log('  $ datapilot all data.csv                    # Run complete analysis');
  console.log('  $ datapilot all "C:\\My Data\\sales.csv"      # Path with spaces (use quotes)');
  console.log('  $ datapilot all data.csv -o analysis.txt    # Save to file');
  console.log('  $ datapilot all data.csv --quick            # Quick mode');
  console.log('  $ datapilot eda sales.csv --encoding latin1 # Force encoding');
  console.log('  $ datapilot int data.csv --delimiter ";"    # Force delimiter');
  console.log('');
  console.log(chalk.cyan('Data Archaeology Workflow:'));
  console.log('  1. Analyze all tables: datapilot eng analyze *.csv');
  console.log('  2. Copy LLM prompts and get insights from your AI');
  console.log('  3. Save insights: datapilot eng save <table> "<insights>"');
  console.log('  4. Generate report: datapilot eng report');
  console.log('');
  console.log(chalk.cyan('Common Options:'));
  console.log('  -o, --output <path>      Save analysis to file');
  console.log('  -q, --quick              Quick mode - skip detailed analyses');
  console.log('  --no-header              CSV has no header row');
  console.log('  --encoding <type>        Force encoding (utf8, latin1, utf16le)');
  console.log('  --delimiter <char>       Force delimiter (comma, semicolon, tab, pipe)');
  console.log('  --timeout <ms>           Set timeout in milliseconds (default: 30s for EDA, 60s for LLM)');
  console.log('  --force                  Continue analysis despite data quality warnings');
  console.log('  --comprehensive          Use comprehensive analysis for LLM mode (default: true)');
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
