import chalk from 'chalk';
import ora from 'ora';
import { parseCSV, detectColumnTypes } from '../utils/parser.js';
import { createSection, createSubSection } from '../utils/format.js';
import { writeFileSync } from 'fs';

// Import all command functions
import { eda } from './eda.js';
import { integrity } from './int.js';
import { visualize } from './vis.js';
import { engineering } from './eng.js';
import { llmContext } from './llm.js';

export async function runAll(filePath, options = {}) {
  console.log(createSection('COMPLETE DATAPILOT ANALYSIS', 
    `File: ${filePath}\nTimestamp: ${new Date().toISOString()}`));
  console.log('');
  
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
    // Parse the CSV once with options
    spinner.text = 'Parsing CSV file...';
    const records = await parseCSV(filePath, { 
      quiet: true,
      noSampling: !options.quick,
      header: options.header 
    });
    
    const columnTypes = detectColumnTypes(records);
    
    // Section divider
    const sectionDivider = '\n' + '='.repeat(80) + '\n';
    
    // Run each analysis in sequence
    spinner.text = 'Running exploratory data analysis...';
    console.log(sectionDivider);
    console.log('1. EXPLORATORY DATA ANALYSIS (EDA)');
    console.log(sectionDivider);
    await eda(filePath, { quiet: true, preloadedData: { records, columnTypes } });
    
    spinner.text = 'Running data integrity check...';
    console.log(sectionDivider);
    console.log('2. DATA INTEGRITY CHECK');
    console.log(sectionDivider);
    await integrity(filePath, { quiet: true, preloadedData: { records, columnTypes } });
    
    spinner.text = 'Generating visualization recommendations...';
    console.log(sectionDivider);
    console.log('3. VISUALIZATION RECOMMENDATIONS');
    console.log(sectionDivider);
    await visualize(filePath, { quiet: true, preloadedData: { records, columnTypes } });
    
    spinner.text = 'Running engineering analysis...';
    console.log(sectionDivider);
    console.log('4. DATA ENGINEERING ANALYSIS');
    console.log(sectionDivider);
    await engineering(filePath, { quiet: true, preloadedData: { records, columnTypes } });
    
    spinner.text = 'Generating LLM context...';
    console.log(sectionDivider);
    console.log('5. LLM CONTEXT GENERATION');
    console.log(sectionDivider);
    await llmContext(filePath, { quiet: true, preloadedData: { records, columnTypes } });
    
    // Summary section
    console.log(sectionDivider);
    console.log('ANALYSIS COMPLETE');
    console.log(sectionDivider);
    console.log(createSubSection('Summary', ''));
    console.log(`- Total rows analyzed: ${records.length.toLocaleString()}`);
    console.log(`- Total columns: ${Object.keys(columnTypes).length}`);
    console.log(`- Analysis timestamp: ${new Date().toISOString()}`);
    
    if (options.quick) {
      console.log(chalk.yellow('\n⚡ Quick mode: Some detailed analyses were skipped for speed'));
    }
    
    // Restore console.log
    console.log = originalLog;
    
    spinner.succeed('Complete analysis finished');
    
    // Write to file if output option is specified
    if (options.output) {
      writeFileSync(options.output, output);
      console.log(chalk.green(`\n✓ Analysis saved to: ${options.output}`));
      
      // Also show a preview
      console.log(chalk.gray('\nPreview of saved analysis:'));
      const lines = output.split('\n').slice(0, 10);
      lines.forEach(line => console.log(chalk.gray(line)));
      if (output.split('\n').length > 10) {
        console.log(chalk.gray('... (truncated)'));
      }
    }
    
  } catch (error) {
    // Restore console.log on error
    console.log = originalLog;
    spinner.fail('Analysis failed');
    console.error(chalk.red('Error during analysis:'), error.message);
    process.exit(1);
  }
}

// Export for use in CLI
export default async function(filePath, options = {}) {
  await runAll(filePath, options);
}