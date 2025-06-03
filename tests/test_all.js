#!/usr/bin/env node

/**
 * Comprehensive Test Runner for DataPilot
 * Runs all test suites including unit tests, integration tests, and modern CLI tests
 */

import { spawn } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Test suites to run
const TEST_SUITES = [
  {
    name: 'Unit Tests - Column Detector',
    script: 'unit/test_columnDetector.js',
    description: 'Tests consolidated column detection logic'
  },
  {
    name: 'Unit Tests - Error Handling',
    script: 'unit/test_errorHandling.js',
    description: 'Tests error boundaries and recovery'
  },
  {
    name: 'Unit Tests - Parser',
    script: 'unit/test_parser.js',
    description: 'Tests CSV parsing functionality'
  },
  {
    name: 'Unit Tests - Statistics',
    script: 'unit/test_stats.js',
    description: 'Tests statistical calculations'
  },
  {
    name: 'Unit Tests - Formatting',
    script: 'unit/test_format.js',
    description: 'Tests output formatting'
  },
  {
    name: 'Integration Tests - Modern CLI',
    script: 'run_modern_tests.js',
    description: 'Tests new 3-command structure and features'
  },
  {
    name: 'Integration Tests - Legacy Commands',
    script: 'run_tests.js',
    description: 'Tests backward compatibility',
    optional: true
  }
];

// Test results
const results = {
  passed: 0,
  failed: 0,
  skipped: 0,
  suites: {}
};

// Run a single test suite
function runTestSuite(suite) {
  return new Promise((resolve) => {
    console.log(chalk.blue('\n' + '='.repeat(60)));
    console.log(chalk.blue(`Running: ${suite.name}`));
    console.log(chalk.gray(suite.description));
    console.log(chalk.blue('='.repeat(60)));

    const testPath = join(__dirname, suite.script);
    const startTime = Date.now();
    
    const child = spawn('node', [testPath], {
      stdio: 'inherit',
      env: { ...process.env, FORCE_COLOR: '1' }
    });

    child.on('close', (code) => {
      const duration = Date.now() - startTime;
      const status = code === 0 ? 'passed' : 'failed';
      
      results.suites[suite.name] = {
        status,
        duration,
        exitCode: code
      };

      if (code === 0) {
        results.passed++;
        console.log(chalk.green(`\n✓ ${suite.name} completed successfully (${duration}ms)`));
      } else if (suite.optional) {
        results.skipped++;
        console.log(chalk.yellow(`\n⚠ ${suite.name} failed (optional test, ${duration}ms)`));
      } else {
        results.failed++;
        console.log(chalk.red(`\n✗ ${suite.name} failed with exit code ${code} (${duration}ms)`));
      }

      resolve();
    });

    child.on('error', (error) => {
      console.error(chalk.red(`\nError running ${suite.name}: ${error.message}`));
      results.failed++;
      results.suites[suite.name] = {
        status: 'error',
        error: error.message
      };
      resolve();
    });
  });
}

// Generate final report
function generateFinalReport() {
  const totalDuration = Object.values(results.suites)
    .reduce((sum, suite) => sum + (suite.duration || 0), 0);

  console.log(chalk.blue('\n' + '='.repeat(60)));
  console.log(chalk.blue('FINAL TEST REPORT'));
  console.log(chalk.blue('='.repeat(60)));

  console.log(chalk.white('\nTest Suite Results:'));
  for (const [name, result] of Object.entries(results.suites)) {
    const icon = result.status === 'passed' ? '✓' : 
                 result.status === 'failed' ? '✗' : '⚠';
    const color = result.status === 'passed' ? chalk.green :
                  result.status === 'failed' ? chalk.red : chalk.yellow;
    
    console.log(color(`  ${icon} ${name}`));
    if (result.duration) {
      console.log(chalk.gray(`     Duration: ${result.duration}ms`));
    }
    if (result.error) {
      console.log(chalk.gray(`     Error: ${result.error}`));
    }
  }

  console.log(chalk.white('\nSummary:'));
  console.log(chalk.green(`  Passed: ${results.passed}`));
  console.log(results.failed > 0 ? chalk.red(`  Failed: ${results.failed}`) : chalk.green(`  Failed: ${results.failed}`));
  console.log(results.skipped > 0 ? chalk.yellow(`  Skipped: ${results.skipped}`) : chalk.green(`  Skipped: ${results.skipped}`));
  console.log(chalk.white(`  Total Duration: ${(totalDuration / 1000).toFixed(1)}s`));

  const successRate = ((results.passed / (results.passed + results.failed)) * 100).toFixed(1);
  console.log(chalk.white(`  Success Rate: ${successRate}%`));

  if (results.failed === 0) {
    console.log(chalk.green('\n🎉 All tests passed!'));
  } else {
    console.log(chalk.red('\n❌ Some tests failed. Check the output above for details.'));
  }
}

// Main test runner
async function main() {
  console.log(chalk.magenta('='.repeat(60)));
  console.log(chalk.magenta('DATAPILOT COMPREHENSIVE TEST SUITE'));
  console.log(chalk.magenta(`Running ${TEST_SUITES.length} test suites`));
  console.log(chalk.magenta('='.repeat(60)));

  const startTime = Date.now();

  // Run all test suites sequentially
  for (const suite of TEST_SUITES) {
    await runTestSuite(suite);
  }

  // Generate final report
  generateFinalReport();

  const totalDuration = Date.now() - startTime;
  console.log(chalk.gray(`\nTotal test execution time: ${(totalDuration / 1000).toFixed(1)}s`));

  // Exit with appropriate code
  process.exit(results.failed > 0 ? 1 : 0);
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error(chalk.red('\nUncaught Exception:'));
  console.error(error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(chalk.red('\nUnhandled Rejection:'));
  console.error(reason);
  process.exit(1);
});

// Run tests
main().catch(error => {
  console.error(chalk.red(`\nFatal error: ${error.message}`));
  console.error(error.stack);
  process.exit(1);
});