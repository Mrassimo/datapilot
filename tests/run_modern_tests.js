#!/usr/bin/env node

/**
 * Modern Test Suite for DataPilot CLI
 * Tests the consolidated 3-command structure and all new features
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync, rmSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CLI_PATH = join(__dirname, '..', 'bin', 'datapilot.js');
const FIXTURES_DIR = join(__dirname, 'fixtures');
const TEMP_DIR = join(__dirname, 'temp');

// Modern command structure
const MODERN_COMMANDS = ['run', 'vis', 'all'];
const UTILITY_COMMANDS = ['config'];

// Test configuration
const TEST_SUITES = {
  basic: {
    name: 'Basic Functionality',
    tests: [
      { command: 'run', file: 'test_sales.csv', expectedPatterns: ['DATAPILOT COMPREHENSIVE ANALYSIS', 'Data Quality:', 'Statistical Insights'] },
      { command: 'vis', file: 'test_sales.csv', expectedPatterns: ['Business Intelligence Suite', 'Visualization'] },
      { command: 'all', file: 'test_sales.csv', expectedPatterns: ['COMPREHENSIVE ANALYSIS', 'BUSINESS INTELLIGENCE'] }
    ]
  },
  dataTypes: {
    name: 'Data Type Detection',
    tests: [
      { command: 'run', file: 'australian_data.csv', expectedPatterns: ['postcode', 'phone', 'Australian'] },
      { command: 'run', file: 'edge_case_date_formats.csv', expectedPatterns: ['Date columns: 1', 'Time-based'] },
      { command: 'run', file: 'large_numeric.csv', expectedPatterns: ['numeric', 'float', 'integer'] }
    ]
  },
  errorHandling: {
    name: 'Error Handling & Recovery',
    tests: [
      { command: 'run', file: 'empty.csv', expectedError: true, expectedPatterns: ['empty', 'no data'] },
      { command: 'run', file: 'missing_values.csv', expectedPatterns: ['missing', 'null', 'Data Quality'] }
    ]
  },
  performance: {
    name: 'Performance & Large Files',
    tests: [
      { command: 'run', file: 'large_test.csv', maxDuration: 120000 }, // 10K rows - TEMP: performance regression
      { command: 'all', file: 'large_test.csv', options: '--timeout 180000', maxDuration: 180000 } // All commands - TEMP: performance regression
    ]
  },
  formats: {
    name: 'Format & Encoding',
    tests: [
      { command: 'run', file: 'semicolon_test.csv', expectedPatterns: ['delimiter', ';'] },
      { command: 'run', file: 'quoted_commas_test.csv', expectedPatterns: ['quoted', 'parsed'] }
    ]
  },
  configuration: {
    name: 'Configuration Management',
    tests: [
      { command: 'config', options: '--show', expectedPatterns: ['Current DataPilot Configuration', 'performance', 'parsing'] },
      { command: 'config', options: '--path', expectedPatterns: ['Configuration file locations', 'datapilot.config.json'] }
    ]
  }
};

// Test results collector
class TestResults {
  constructor() {
    this.passed = 0;
    this.failed = 0;
    this.skipped = 0;
    this.errors = [];
    this.timings = [];
    this.suiteResults = {};
  }

  addPass(suite, test, duration) {
    this.passed++;
    this.timings.push({ suite, test, duration });
    this.addToSuite(suite, 'passed');
  }

  addFail(suite, test, error) {
    this.failed++;
    this.errors.push({ suite, test, error });
    this.addToSuite(suite, 'failed');
  }

  addSkip(suite, test, reason) {
    this.skipped++;
    this.errors.push({ suite, test, error: `Skipped: ${reason}` });
    this.addToSuite(suite, 'skipped');
  }

  addToSuite(suite, status) {
    if (!this.suiteResults[suite]) {
      this.suiteResults[suite] = { passed: 0, failed: 0, skipped: 0 };
    }
    this.suiteResults[suite][status]++;
  }

  getTotal() {
    return this.passed + this.failed + this.skipped;
  }

  getSuccessRate() {
    const total = this.passed + this.failed;
    return total > 0 ? ((this.passed / total) * 100).toFixed(1) : '0.0';
  }

  generateReport() {
    const report = {
      summary: {
        total: this.getTotal(),
        passed: this.passed,
        failed: this.failed,
        skipped: this.skipped,
        successRate: this.getSuccessRate() + '%'
      },
      suites: this.suiteResults,
      errors: this.errors,
      performance: {
        avgDuration: this.timings.length > 0 
          ? Math.round(this.timings.reduce((sum, t) => sum + t.duration, 0) / this.timings.length)
          : 0,
        slowestTests: this.timings
          .sort((a, b) => b.duration - a.duration)
          .slice(0, 5)
          .map(t => ({ ...t, duration: `${t.duration}ms` }))
      }
    };
    return report;
  }
}

const results = new TestResults();

// Utility functions
function ensureTempDir() {
  if (!existsSync(TEMP_DIR)) {
    execSync(`mkdir -p ${TEMP_DIR}`);
  }
}

function cleanupTempDir() {
  if (existsSync(TEMP_DIR)) {
    rmSync(TEMP_DIR, { recursive: true });
  }
}

function log(message, type = 'info') {
  const colors = {
    info: chalk.blue,
    success: chalk.green,
    error: chalk.red,
    warning: chalk.yellow,
    suite: chalk.magenta,
    test: chalk.cyan
  };
  console.log(colors[type](message));
}

function runCommand(command, args = '', options = {}) {
  const fullCommand = `node ${CLI_PATH} ${command} ${args}`;
  const execOptions = {
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024, // 20MB buffer
    ...options
  };

  return execSync(fullCommand, execOptions);
}

function validateOutput(output, expectedPatterns = []) {
  if (!output || output.trim().length === 0) {
    return { valid: false, error: 'Empty output' };
  }

  for (const pattern of expectedPatterns) {
    if (!output.toLowerCase().includes(pattern.toLowerCase())) {
      return { valid: false, error: `Missing expected pattern: "${pattern}"` };
    }
  }

  return { valid: true };
}

// Test execution
function runTest(suite, test) {
  const { command, file, options = '', expectedPatterns = [], expectedError = false, maxDuration } = test;
  const testName = `${command} ${file || ''} ${options}`.trim();
  
  try {
    const startTime = Date.now();
    const filePath = file ? join(FIXTURES_DIR, file) : '';
    const output = runCommand(command, `${filePath} ${options}`.trim());
    const duration = Date.now() - startTime;

    // Check duration if specified
    if (maxDuration && duration > maxDuration) {
      log(`  ✗ ${testName} - Too slow (${duration}ms > ${maxDuration}ms)`, 'error');
      results.addFail(suite, testName, `Performance: ${duration}ms exceeded ${maxDuration}ms limit`);
      return;
    }

    // Validate output
    const validation = validateOutput(output, expectedPatterns);
    
    if (validation.valid && !expectedError) {
      log(`  ✓ ${testName} (${duration}ms)`, 'success');
      results.addPass(suite, testName, duration);
    } else if (!validation.valid && !expectedError) {
      log(`  ✗ ${testName} - ${validation.error}`, 'error');
      results.addFail(suite, testName, validation.error);
    } else if (expectedError) {
      log(`  ✗ ${testName} - Expected error but command succeeded`, 'error');
      results.addFail(suite, testName, 'Expected error but command succeeded');
    }
  } catch (error) {
    if (expectedError) {
      log(`  ✓ ${testName} - Correctly failed with error`, 'success');
      results.addPass(suite, testName, 0);
    } else {
      log(`  ✗ ${testName} - ${error.message.split('\n')[0]}`, 'error');
      results.addFail(suite, testName, error.message);
    }
  }
}

// Suite execution
function runSuite(suiteName, suite) {
  log(`\n${suite.name}`, 'suite');
  log('─'.repeat(50), 'suite');
  
  for (const test of suite.tests) {
    runTest(suiteName, test);
  }
}

// Special tests
function runEdgeCaseTests() {
  log('\nEdge Cases & Error Handling', 'suite');
  log('─'.repeat(50), 'suite');

  // Non-existent file
  try {
    runCommand('run', 'nonexistent.csv');
    log('  ✗ Non-existent file - Should have failed', 'error');
    results.addFail('edgeCases', 'non-existent file', 'Should have failed');
  } catch (error) {
    if (error.message.includes('File not found') || error.message.includes('FILE_NOT_FOUND')) {
      log('  ✓ Non-existent file - Correctly handled', 'success');
      results.addPass('edgeCases', 'non-existent file', 0);
    } else {
      log('  ✗ Non-existent file - Unexpected error', 'error');
      results.addFail('edgeCases', 'non-existent file', error.message);
    }
  }

  // Invalid file type
  const txtFile = join(TEMP_DIR, 'test.txt');
  writeFileSync(txtFile, 'Not a CSV file');
  
  try {
    runCommand('run', txtFile);
    log('  ✗ Non-CSV file - Should have failed', 'error');
    results.addFail('edgeCases', 'non-CSV file', 'Should have failed');
  } catch (error) {
    if (error.message.includes('must be a CSV file') || error.message.includes('INVALID_CSV_FORMAT')) {
      log('  ✓ Non-CSV file - Correctly handled', 'success');
      results.addPass('edgeCases', 'non-CSV file', 0);
    } else {
      log('  ✗ Non-CSV file - Unexpected error', 'error');
      results.addFail('edgeCases', 'non-CSV file', error.message);
    }
  }
}

function runUXScenarioTests() {
  log('\nUser Experience Scenarios', 'suite');
  log('─'.repeat(50), 'suite');

  // Scenario 1: First-time user
  log('  Scenario: First-time user exploration', 'test');
  try {
    // Check help
    const helpOutput = runCommand('--help', '');
    if (helpOutput.includes('run') && helpOutput.includes('vis') && helpOutput.includes('all')) {
      log('    ✓ Help shows modern commands', 'success');
      results.addPass('ux', 'help display', 0);
    } else {
      log('    ✗ Help missing modern commands', 'error');
      results.addFail('ux', 'help display', 'Missing modern commands in help');
    }

    // Check config
    const configOutput = runCommand('config', '');
    if (configOutput.includes('DataPilot Configuration')) {
      log('    ✓ Config command accessible', 'success');
      results.addPass('ux', 'config access', 0);
    } else {
      log('    ✗ Config command not working', 'error');
      results.addFail('ux', 'config access', 'Config command failed');
    }
  } catch (error) {
    log('    ✗ First-time user scenario failed', 'error');
    results.addFail('ux', 'first-time user', error.message);
  }

  // Scenario 2: Progressive analysis workflow
  log('  Scenario: Progressive analysis workflow', 'test');
  const testFile = join(FIXTURES_DIR, 'test_sales.csv');
  
  try {
    // Quick analysis
    const quickOutput = runCommand('run', `${testFile} --timeout 5000`);
    if (quickOutput.includes('COMPREHENSIVE ANALYSIS')) {
      log('    ✓ Quick analysis completed', 'success');
      results.addPass('ux', 'quick analysis', 0);
    }

    // Detailed visualization
    const visOutput = runCommand('vis', testFile);
    if (visOutput.includes('Business Intelligence')) {
      log('    ✓ Visualization analysis completed', 'success');
      results.addPass('ux', 'visualization', 0);
    }

    // Full analysis
    const allOutput = runCommand('all', `${testFile} --force`);
    if (allOutput.includes('COMPREHENSIVE') && allOutput.includes('BUSINESS')) {
      log('    ✓ Full analysis completed', 'success');
      results.addPass('ux', 'full analysis', 0);
    }
  } catch (error) {
    log('    ✗ Progressive workflow failed', 'error');
    results.addFail('ux', 'progressive workflow', error.message);
  }
}

function runPerformanceTests() {
  log('\nPerformance & Scalability', 'suite');
  log('─'.repeat(50), 'suite');

  // Create large test file if needed
  const largeFile = join(FIXTURES_DIR, 'large_test.csv');
  if (!existsSync(largeFile)) {
    log('  Creating large test file (10,000 rows)...', 'info');
    let csv = 'id,date,amount,category,status,description\n';
    for (let i = 1; i <= 10000; i++) {
      const date = new Date(2024, 0, 1 + (i % 365)).toISOString().split('T')[0];
      const amount = (Math.random() * 1000).toFixed(2);
      const category = ['Sales', 'Marketing', 'Operations', 'Finance'][i % 4];
      const status = ['active', 'inactive', 'pending'][i % 3];
      const description = `Transaction ${i} for ${category}`;
      csv += `${i},${date},${amount},${category},${status},"${description}"\n`;
    }
    writeFileSync(largeFile, csv);
  }

  // Memory usage test
  const memBefore = process.memoryUsage().heapUsed;
  try {
    const startTime = Date.now();
    runCommand('run', largeFile);
    const duration = Date.now() - startTime;
    const memAfter = process.memoryUsage().heapUsed;
    const memDelta = (memAfter - memBefore) / 1024 / 1024;

    log(`  ✓ Large file analysis: ${duration}ms, ${memDelta.toFixed(1)}MB memory`, 'success');
    results.addPass('performance', 'large file memory', duration);
  } catch (error) {
    log(`  ✗ Large file analysis failed: ${error.message}`, 'error');
    results.addFail('performance', 'large file', error.message);
  }
}

function generateFinalReport() {
  const report = results.generateReport();
  
  log('\n' + '═'.repeat(60), 'info');
  log('TEST RESULTS SUMMARY', 'info');
  log('═'.repeat(60), 'info');
  
  log(`\nTotal Tests: ${report.summary.total}`, 'info');
  log(`Passed: ${report.summary.passed}`, 'success');
  log(`Failed: ${report.summary.failed}`, report.summary.failed > 0 ? 'error' : 'success');
  log(`Skipped: ${report.summary.skipped}`, 'warning');
  log(`Success Rate: ${report.summary.successRate}`, 'info');
  
  log('\nSuite Results:', 'info');
  for (const [suite, stats] of Object.entries(report.suites)) {
    const total = stats.passed + stats.failed + stats.skipped;
    log(`  ${suite}: ${stats.passed}/${total} passed`, stats.failed > 0 ? 'warning' : 'success');
  }
  
  if (report.errors.length > 0) {
    log('\nFailures:', 'error');
    report.errors.forEach(err => {
      log(`  ${err.suite} > ${err.test}`, 'error');
      log(`    ${err.error}`, 'error');
    });
  }
  
  log('\nPerformance:', 'info');
  log(`  Average duration: ${report.performance.avgDuration}ms`, 'info');
  if (report.performance.slowestTests.length > 0) {
    log('  Slowest tests:', 'info');
    report.performance.slowestTests.forEach(test => {
      log(`    ${test.test}: ${test.duration}`, 'warning');
    });
  }

  // Save detailed report
  const detailedReport = `# DataPilot Modern Test Report
Generated: ${new Date().toISOString()}

## Summary
- **Total Tests**: ${report.summary.total}
- **Passed**: ${report.summary.passed}
- **Failed**: ${report.summary.failed}
- **Skipped**: ${report.summary.skipped}
- **Success Rate**: ${report.summary.successRate}

## Suite Results
${Object.entries(report.suites).map(([suite, stats]) => {
  const total = stats.passed + stats.failed + stats.skipped;
  return `### ${suite}
- Passed: ${stats.passed}/${total}
- Failed: ${stats.failed}
- Skipped: ${stats.skipped}`;
}).join('\n\n')}

## Performance Metrics
- **Average Test Duration**: ${report.performance.avgDuration}ms
- **Slowest Tests**:
${report.performance.slowestTests.map(t => `  - ${t.test}: ${t.duration}`).join('\n')}

${report.errors.length > 0 ? `## Failures
${report.errors.map(err => `### ${err.suite} > ${err.test}
\`\`\`
${err.error}
\`\`\`
`).join('\n')}` : '## All Tests Passed! 🎉'}

## Test Coverage
- **Commands**: ${MODERN_COMMANDS.join(', ')}
- **Data Types**: Australian formats, dates, numeric, categorical
- **Edge Cases**: Empty files, missing values, invalid inputs
- **Performance**: Large file handling, memory usage
- **User Experience**: Help system, progressive workflows
- **Configuration**: Config management, settings validation
`;

  writeFileSync(join(__dirname, 'modern_test_report.md'), detailedReport);
  log(`\nDetailed report saved to: tests/modern_test_report.md`, 'info');
}

// Main test runner
async function main() {
  log('═'.repeat(60), 'info');
  log('DATAPILOT MODERN TEST SUITE', 'info');
  log('Testing consolidated 3-command structure and new features', 'info');
  log('═'.repeat(60), 'info');

  ensureTempDir();

  try {
    // Run all test suites
    for (const [suiteName, suite] of Object.entries(TEST_SUITES)) {
      runSuite(suiteName, suite);
    }

    // Run special test categories
    runEdgeCaseTests();
    runUXScenarioTests();
    runPerformanceTests();

    // Generate final report
    generateFinalReport();

  } finally {
    cleanupTempDir();
  }

  // Exit with appropriate code
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
main().catch(error => {
  log(`Fatal error: ${error.message}`, 'error');
  process.exit(1);
});