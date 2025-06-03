/**
 * ALL COMMAND - Complete Analysis Suite
 * Runs both consolidated commands: run (comprehensive analysis) + vis (business intelligence)
 */

import chalk from 'chalk';
import ora from 'ora';
import { parseCSV, detectColumnTypes } from '../utils/parser.js';
import { createSection, createSubSection, formatTimestamp } from '../utils/format.js';
import { writeFileSync } from 'fs';
import { basename } from 'path';

// Import consolidated command functions
import { run } from './run.js';
import { visualize } from './vis.js';

export async function runAll(filePath, options = {}) {
  console.log(chalk.cyan('╔═══════════════════════════════════════╗'));
  console.log(chalk.cyan('║     DATAPILOT COMPLETE ANALYSIS       ║'));
  console.log(chalk.cyan('╚═══════════════════════════════════════╝'));
  console.log(`${chalk.gray('File:')} ${basename(filePath)}`);
  console.log(`${chalk.gray('Started:')} ${formatTimestamp()}\n`);
  
  const spinner = ora('Running complete analysis suite...').start();
  
  let output = '';
  const captureOutput = (text) => {
    output += text + '\n';
  };
  
  // Temporarily override console.log to capture output
  const originalLog = console.log;
  if (options.output) {
    console.log = captureOutput;
  }
  
  try {
    // Parse the CSV once for efficiency
    spinner.text = 'Parsing CSV file...';
    const records = await parseCSV(filePath, { 
      quiet: true,
      noSampling: true,
      header: options.header 
    });
    
    const columnTypes = detectColumnTypes(records);
    
    // Prepare enhanced options with preloaded data
    const enhancedOptions = {
      ...options,
      quiet: true,
      preloadedData: { records, columnTypes }
    };
    
    // Section divider
    const sectionDivider = '\n' + chalk.gray('═'.repeat(80)) + '\n';
    
    // Run comprehensive analysis (EDA + INT + LLM formatting)
    spinner.text = 'Running comprehensive data analysis...';
    console.log(sectionDivider);
    console.log(chalk.yellow('PART 1: COMPREHENSIVE DATA ANALYSIS'));
    console.log(chalk.gray('Statistical analysis, quality assessment, and pattern discovery'));
    console.log(sectionDivider);
    
    try {
      await run(filePath, enhancedOptions);
    } catch (error) {
      console.log(chalk.red(`⚠️  Error in comprehensive analysis: ${error.message}`));
    }
    
    // Run business intelligence analysis (VIS + ENG)
    spinner.text = 'Running business intelligence analysis...';
    console.log(sectionDivider);
    console.log(chalk.yellow('PART 2: BUSINESS INTELLIGENCE SUITE'));
    console.log(chalk.gray('Visualization recommendations and data engineering insights'));
    console.log(sectionDivider);
    
    try {
      await visualize(filePath, enhancedOptions);
    } catch (error) {
      console.log(chalk.red(`⚠️  Error in business intelligence: ${error.message}`));
    }
    
    // Summary section
    console.log(sectionDivider);
    console.log(chalk.green('✅ ANALYSIS COMPLETE'));
    console.log(sectionDivider);
    console.log(chalk.cyan('📊 Dataset Summary:'));
    console.log(`   • Records analyzed: ${records.length.toLocaleString()}`);
    console.log(`   • Total columns: ${Object.keys(columnTypes).length}`);
    console.log(`   • Completed at: ${formatTimestamp()}`);
    
    if (options.quick) {
      console.log(chalk.yellow('\n⚡ Quick mode: Some detailed analyses were skipped for speed'));
    }
    
    // Key takeaways
    console.log(chalk.cyan('\n🎯 Key Takeaways:'));
    console.log('   • Use the comprehensive analysis (Part 1) for data quality and statistics');
    console.log('   • Use the business intelligence (Part 2) for visualization planning');
    console.log('   • Copy any section to your AI assistant for deeper insights');
    
    // Restore console.log
    console.log = originalLog;
    
    spinner.succeed('Complete analysis finished');
    
    // Write to file if output option is specified
    if (options.output) {
      // Add a header to the output
      const fullOutput = `DATAPILOT COMPLETE ANALYSIS REPORT
Generated: ${formatTimestamp()}
File: ${filePath}
================================================================================

${output}`;
      
      writeFileSync(options.output, fullOutput);
      console.log(chalk.green(`\n✓ Analysis saved to: ${options.output}`));
      
      // Show file size
      const fileSizeKB = (Buffer.byteLength(fullOutput, 'utf8') / 1024).toFixed(1);
      console.log(chalk.gray(`   File size: ${fileSizeKB} KB`));
      
      // Also show a preview
      console.log(chalk.gray('\nPreview of saved analysis:'));
      const lines = fullOutput.split('\n').slice(0, 10);
      lines.forEach(line => console.log(chalk.gray(line)));
      if (fullOutput.split('\n').length > 10) {
        console.log(chalk.gray('... (see full report in saved file)'));
      }
    }
    
  } catch (error) {
    // Restore console.log in case of error
    console.log = originalLog;
    spinner.fail('Analysis failed');
    console.error(chalk.red('Error during analysis:'), error.message);
    if (!options.quiet) process.exit(1);
    throw error;
  }
}

// Export for use in CLI
export default async function(filePath, options = {}) {
  await runAll(filePath, options);
}