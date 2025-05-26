#!/usr/bin/env node

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CLI_PATH = join(__dirname, '..', 'bin', 'datapilot.js');
const FIXTURES_DIR = join(__dirname, 'fixtures');
const OUTPUTS_DIR = join(__dirname, 'outputs');

// Test configuration
const COMMANDS = ['eda', 'int', 'vis', 'eng', 'llm'];
const TEST_FILES = [
  'test_sales.csv',
  'insurance.csv',
  'analytical_data_australia_final.csv.csv',
  'australian_data.csv',
  'missing_values.csv',
  'large_numeric.csv',
  'empty.csv'
];

// Test results
const results = {
  passed: 0,
  failed: 0,
  errors: []
};

// Colors for output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function runTest(command, file) {
  const testName = `${command} - ${file}`;
  const outputFile = join(OUTPUTS_DIR, `${command}_${file.replace('.csv', '')}_output.txt`);
  
  try {
    // Run the command
    const startTime = Date.now();
    const output = execSync(`node ${CLI_PATH} ${command} ${join(FIXTURES_DIR, file)}`, {
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024 // 10MB buffer
    });
    const duration = Date.now() - startTime;
    
    // Save output
    writeFileSync(outputFile, output);
    
    // Validate output
    const validation = validateOutput(command, file, output);
    
    if (validation.valid) {
      log(`✓ ${testName} (${duration}ms)`, 'green');
      results.passed++;
    } else {
      log(`✗ ${testName}: ${validation.error}`, 'red');
      results.failed++;
      results.errors.push({ test: testName, error: validation.error });
    }
    
    return { success: true, duration, output: output.length };
    
  } catch (error) {
    log(`✗ ${testName}: ${error.message}`, 'red');
    results.failed++;
    results.errors.push({ test: testName, error: error.message });
    
    // Save error output
    writeFileSync(outputFile, `ERROR: ${error.message}\n\n${error.stderr || ''}`);
    
    return { success: false, error: error.message };
  }
}

function validateOutput(command, file, output) {
  // Basic validations
  if (!output || output.length === 0) {
    return { valid: false, error: 'Empty output' };
  }
  
  // Check for expected sections based on command
  const expectedSections = {
    eda: ['EXPLORATORY DATA ANALYSIS REPORT', 'DATASET OVERVIEW', 'COLUMN ANALYSIS'],
    int: ['DATA INTEGRITY REPORT', 'DATA QUALITY METRICS'],
    vis: ['VISUALISATION ANALYSIS', 'RECOMMENDED VISUALISATIONS'],
    eng: ['DATA ENGINEERING ARCHAEOLOGY REPORT', 'SCHEMA RECOMMENDATIONS'],
    llm: ['LLM-READY CONTEXT', 'DATASET SUMMARY FOR AI ANALYSIS']
  };
  
  const required = expectedSections[command];
  for (const section of required) {
    if (!output.includes(section)) {
      return { valid: false, error: `Missing section: ${section}` };
    }
  }
  
  // Check for proper formatting
  if (!output.includes('===')) {
    return { valid: false, error: 'Missing section separators' };
  }
  
  // Command-specific validations
  if (command === 'eda' && file !== 'empty.csv') {
    if (!output.includes('CENTRAL TENDENCY:') && !output.includes('Type:') && !output.includes('SPREAD:')) {
      return { valid: false, error: 'Missing statistical analysis' };
    }
  }
  
  if (command === 'int' && file === 'australian_data.csv') {
    if (!output.includes('postcode') && !output.includes('email')) {
      return { valid: false, error: 'Missing Australian-specific validations' };
    }
  }
  
  return { valid: true };
}

function runPerformanceTest() {
  log('\n=== Performance Tests ===', 'blue');
  
  // Create a larger test file
  const largeFile = join(FIXTURES_DIR, 'large_test.csv');
  if (!existsSync(largeFile)) {
    log('Creating large test file (10,000 rows)...', 'yellow');
    
    let csv = 'id,date,amount,category,status\n';
    for (let i = 1; i <= 10000; i++) {
      const date = new Date(2024, 0, 1 + (i % 365));
      const amount = (Math.random() * 1000).toFixed(2);
      const category = ['A', 'B', 'C', 'D'][i % 4];
      const status = ['active', 'inactive', 'pending'][i % 3];
      csv += `${i},${date.toISOString().split('T')[0]},${amount},${category},${status}\n`;
    }
    writeFileSync(largeFile, csv);
  }
  
  // Run performance test
  const result = runTest('eda', 'large_test.csv');
  if (result.success) {
    log(`Large file processed in ${result.duration}ms (${result.output} bytes output)`, 'green');
  }
}

function runEdgeCaseTests() {
  log('\n=== Edge Case Tests ===', 'blue');
  
  // Test with non-existent file
  try {
    execSync(`node ${CLI_PATH} eda nonexistent.csv`, { encoding: 'utf8' });
    log('✗ Should have failed with non-existent file', 'red');
    results.failed++;
  } catch (error) {
    if (error.message.includes('File not found')) {
      log('✓ Correctly handled non-existent file', 'green');
      results.passed++;
    } else {
      log('✗ Unexpected error for non-existent file', 'red');
      results.failed++;
    }
  }
  
  // Test with non-CSV file
  const txtFile = join(FIXTURES_DIR, 'test.txt');
  writeFileSync(txtFile, 'This is not a CSV file');
  
  try {
    execSync(`node ${CLI_PATH} eda ${txtFile}`, { encoding: 'utf8' });
    log('✗ Should have failed with non-CSV file', 'red');
    results.failed++;
  } catch (error) {
    if (error.message.includes('must be a CSV file')) {
      log('✓ Correctly handled non-CSV file', 'green');
      results.passed++;
    } else {
      log('✗ Unexpected error for non-CSV file', 'red');
      results.failed++;
    }
  }
}

function generateReport() {
  const report = `
# DataPilot Test Report
Generated: ${new Date().toISOString()}

## Summary
- Total Tests: ${results.passed + results.failed}
- Passed: ${results.passed}
- Failed: ${results.failed}
- Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%

## Test Matrix
${generateTestMatrix()}

## Errors
${results.errors.length > 0 ? results.errors.map(e => `- ${e.test}: ${e.error}`).join('\n') : 'No errors'}

## Coverage
- Commands tested: ${COMMANDS.join(', ')}
- Files tested: ${TEST_FILES.join(', ')}
- Edge cases: Tested
- Performance: Tested with 10,000 row file
`;

  writeFileSync(join(__dirname, 'test_report.md'), report);
  log('\nTest report saved to tests/test_report.md', 'blue');
}

function generateTestMatrix() {
  let matrix = '| File | ' + COMMANDS.join(' | ') + ' |\n';
  matrix += '|------|' + COMMANDS.map(() => '-----').join('|') + '|\n';
  
  for (const file of TEST_FILES) {
    matrix += `| ${file} |`;
    for (const command of COMMANDS) {
      const outputFile = join(OUTPUTS_DIR, `${command}_${file.replace('.csv', '')}_output.txt`);
      const exists = existsSync(outputFile);
      matrix += exists ? ' ✓ |' : ' ✗ |';
    }
    matrix += '\n';
  }
  
  return matrix;
}

// Main test execution
async function main() {
  log('=== DataPilot Test Suite ===', 'blue');
  log(`Testing CLI at: ${CLI_PATH}\n`, 'yellow');
  
  // Run all command/file combinations
  for (const command of COMMANDS) {
    log(`\nTesting ${command} command:`, 'blue');
    
    for (const file of TEST_FILES) {
      runTest(command, file);
    }
  }
  
  // Run edge case tests
  runEdgeCaseTests();
  
  // Run performance test
  runPerformanceTest();
  
  // Generate report
  log('\n=== Test Results ===', 'blue');
  log(`Passed: ${results.passed}`, 'green');
  log(`Failed: ${results.failed}`, results.failed > 0 ? 'red' : 'green');
  
  if (results.errors.length > 0) {
    log('\nErrors:', 'red');
    results.errors.forEach(e => log(`  - ${e.test}: ${e.error}`, 'red'));
  }
  
  generateReport();
  
  // Exit with appropriate code
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
main().catch(error => {
  log(`Fatal error: ${error.message}`, 'red');
  process.exit(1);
});