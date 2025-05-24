#!/usr/bin/env node

import { program } from 'commander';
import { existsSync } from 'fs';
import { resolve } from 'path';
import chalk from 'chalk';

// Import commands
import { eda } from '../src/commands/eda.js';
import { integrity } from '../src/commands/int.js';
import { visualize } from '../src/commands/vis.js';
import { engineering } from '../src/commands/eng.js';
import { llmContext } from '../src/commands/llm.js';
import { runAll } from '../src/commands/all.js';

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
  .version('1.0.0');

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
  .action(async (file, options) => {
    const filePath = validateFile(file);
    await eda(filePath, options);
  });

// INT command
program
  .command('int <file>')
  .description('Data Integrity Check - find quality issues and inconsistencies')
  .option('-o, --output <path>', 'Save analysis to file')
  .action(async (file, options) => {
    const filePath = validateFile(file);
    await integrity(filePath, options);
  });

// VIS command
program
  .command('vis <file>')
  .description('Visualization Recommendations - what charts would be most insightful')
  .option('-o, --output <path>', 'Save analysis to file')
  .action(async (file, options) => {
    const filePath = validateFile(file);
    await visualize(filePath, options);
  });

// ENG command
program
  .command('eng <file>')
  .description('Data Engineering Analysis - schema and pipeline recommendations')
  .option('-o, --output <path>', 'Save analysis to file')
  .action(async (file, options) => {
    const filePath = validateFile(file);
    await engineering(filePath, options);
  });

// LLM command
program
  .command('llm <file>')
  .description('LLM Context Generation - perfect summary for AI analysis')
  .option('-o, --output <path>', 'Save analysis to file')
  .action(async (file, options) => {
    const filePath = validateFile(file);
    await llmContext(filePath, options);
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
  console.log('  $ datapilot eng orders.csv      # Analyze engineering requirements');
  console.log('  $ datapilot llm dataset.csv     # Generate LLM-ready context');
  console.log('');
  console.log('Options:');
  console.log('  -o, --output <path>  Save analysis to file instead of stdout');
  console.log('  -q, --quick          Quick mode - skip detailed analyses for speed');
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