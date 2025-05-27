#!/usr/bin/env node

import { program } from 'commander';
import { existsSync } from 'fs';
import { resolve, basename } from 'path';
import chalk from 'chalk';

// Import commands
import { eda } from '../src/commands/eda.js';
import { integrity } from '../src/commands/int.js';
import { visualize } from '../src/commands/vis.js';
import { engineering } from '../src/commands/eng.js';
import { llmContext } from '../src/commands/llm.js';
import { runAll } from '../src/commands/all.js';
import { interactiveUI } from '../src/commands/ui.js';

// ASCII art banner
const banner = `
╔═══════════════════════════════════════╗
║          ${chalk.cyan('DataPilot CLI')}              ║
║    ${chalk.gray('Simple & LLM-Ready Analysis')}      ║
╚═══════════════════════════════════════╝
`;

console.log(banner);

// Configure program
program
  .name('datapilot')
  .description('CSV analysis tool optimized for LLM consumption')
  .version('1.1.0');

// Helper to validate file exists
function validateFile(filePath) {
  const resolvedPath = resolve(filePath);
  if (!existsSync(resolvedPath)) {
    console.error(chalk.red(`Error: File not found: ${filePath}`));
    process.exit(1);
  }
  if (!filePath.toLowerCase().endsWith('.csv')) {
    console.error(chalk.red(`Error: File must be a CSV file: ${filePath}`));
    process.exit(1);
  }
  return resolvedPath;
}

// ALL command - run complete analysis suite
program
  .command('all <file>')
  .description('Run complete analysis suite - all commands in one go')
  .option('-o, --output <path>', 'Save analysis to file')
  .option('-q, --quick', 'Quick mode - skip detailed analyses for speed')
  .option('--no-header', 'CSV file has no header row')
  .action(async (file, options) => {
    const filePath = validateFile(file);
    await runAll(filePath, options);
  });

// EDA command
program
  .command('eda <file>')
  .description('Exploratory Data Analysis - comprehensive statistical analysis')
  .option('-o, --output <path>', 'Save analysis to file')
  .option('-q, --quick', 'Quick mode - basic statistics only')
  .option('--no-header', 'CSV file has no header row')
  .action(async (file, options) => {
    const filePath = validateFile(file);
    await eda(filePath, options);
  });

// INT command
program
  .command('int <file>')
  .description('Data Integrity Check - find quality issues and inconsistencies')
  .option('-o, --output <path>', 'Save analysis to file')
  .option('--no-header', 'CSV file has no header row')
  .action(async (file, options) => {
    const filePath = validateFile(file);
    await integrity(filePath, options);
  });

// VIS command
program
  .command('vis <file>')
  .description('Visualization Recommendations - what charts would be most insightful')
  .option('-o, --output <path>', 'Save analysis to file')
  .option('--no-header', 'CSV file has no header row')
  .action(async (file, options) => {
    const filePath = validateFile(file);
    await visualize(filePath, options);
  });

// ENG command - Data Archaeology System with subcommands
const eng = program.command('eng');
eng.description('Data Engineering Archaeology - builds collective intelligence about your warehouse');

// Default action for single file (backward compatible)
eng
  .argument('[file]', 'CSV file to analyze')
  .option('-o, --output <path>', 'Save analysis to file')
  .option('--no-header', 'CSV file has no header row')
  .action(async (file, options) => {
    if (file) {
      const filePath = validateFile(file);
      await engineering(filePath, options);
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
  .action(async (files, options) => {
    const { glob } = await import('glob');
    console.log(chalk.blue('🏛️  Starting multi-file warehouse analysis...\n'));
    
    // Process all files (including glob patterns)
    const allFiles = [];
    for (const pattern of files) {
      if (pattern.includes('*')) {
        const matches = await glob(pattern, { nodir: true });
        allFiles.push(...matches.filter(f => f.endsWith('.csv')));
      } else {
        allFiles.push(pattern);
      }
    }
    
    // Validate all files
    const filePaths = allFiles.map(f => validateFile(f));
    
    if (filePaths.length === 0) {
      console.error('No CSV files found');
      process.exit(1);
    }
    
    console.log(`Found ${filePaths.length} CSV files to analyze\n`);
    
    // Analyze each file with auto-save
    for (const filePath of filePaths) {
      console.log(chalk.cyan(`\nAnalyzing ${basename(filePath)}...`));
      await engineering(filePath, { ...options, quiet: true, autoSave: true });
    }
    
    // Show relationships and generate report
    console.log(chalk.green('\n✓ All files analyzed!'));
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
      console.error('Error: Please provide insights either as argument or via stdin');
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
  .action(async (file, options) => {
    const filePath = validateFile(file);
    await llmContext(filePath, options);
  });

// UI command - Interactive Terminal Interface
program
  .command('ui')
  .description('🎨 Interactive UI - Fun, colorful, beginner-friendly interface')
  .action(async () => {
    await interactiveUI();
  });

// Help text
program.on('--help', () => {
  console.log('');
  console.log('Examples:');
  console.log('  $ datapilot all data.csv        # Run complete analysis suite');
  console.log('  $ datapilot all data.csv -o analysis.txt   # Save to file');
  console.log('  $ datapilot all data.csv --quick           # Quick mode');
  console.log('  $ datapilot eda sales.csv       # Run exploratory data analysis');
  console.log('  $ datapilot int customers.csv   # Check data integrity');
  console.log('  $ datapilot vis metrics.csv     # Get visualization recommendations');
  console.log('  $ datapilot eng orders.csv                   # Analyze single file');
  console.log('  $ datapilot eng analyze *.csv                # Analyze all CSV files');
  console.log('  $ datapilot eng save orders "PURPOSE: ..."   # Save LLM insights');
  console.log('  $ echo "PURPOSE: ..." | datapilot eng save orders  # Pipe from LLM');
  console.log('  $ datapilot eng report                       # Generate full report');
  console.log('  $ datapilot eng map                          # View warehouse map');
  console.log('  $ datapilot llm dataset.csv                  # Generate LLM-ready context');
  console.log('  $ datapilot ui                               # Interactive UI mode');
  console.log('');
  console.log('Data Archaeology Workflow:');
  console.log('  1. Analyze all tables: datapilot eng analyze *.csv');
  console.log('  2. Copy LLM prompts and get insights from your AI');
  console.log('  3. Save insights: datapilot eng save <table> "<insights>"');
  console.log('  4. Generate report: datapilot eng report');
  console.log('');
  console.log('Options:');
  console.log('  -o, --output <path>  Save analysis to file instead of stdout');
  console.log('  -q, --quick          Quick mode - skip detailed analyses for speed');
  console.log('  --no-header          CSV file has no header row (uses column1, column2, etc.)');
  console.log('');
  console.log('Output:');
  console.log('  All commands produce verbose text output optimized for copying');
  console.log('  into ChatGPT, Claude, or any other LLM for further analysis.');
});

// Parse arguments
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}