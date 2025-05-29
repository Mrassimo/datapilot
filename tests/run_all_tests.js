#!/usr/bin/env node

/**
 * Comprehensive test runner for DataPilot
 * Runs all unit tests, integration tests, and command tests
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

async function runCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      ...options
    });

    child.on('close', (code) => {
      resolve(code);
    });

    child.on('error', (err) => {
      reject(err);
    });
  });
}

async function runTest(name, command, args = []) {
  log(`\n=== Running ${name} ===`, 'blue');
  const startTime = Date.now();
  
  try {
    const exitCode = await runCommand(command, args);
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    if (exitCode === 0) {
      log(`✓ ${name} passed (${duration}s)`, 'green');
      return { name, passed: true, duration };
    } else {
      log(`✗ ${name} failed with exit code ${exitCode} (${duration}s)`, 'red');
      return { name, passed: false, exitCode, duration };
    }
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    log(`✗ ${name} errored: ${error.message} (${duration}s)`, 'red');
    return { name, passed: false, error: error.message, duration };
  }
}

async function main() {
  log('\n🧪 DataPilot Comprehensive Test Suite', 'blue');
  log('=====================================\n', 'blue');

  const results = [];
  const startTime = Date.now();

  // Run unit tests
  log('📦 Unit Tests', 'yellow');
  results.push(await runTest('Parser Tests', 'node', ['tests/unit/test_parser.js']));
  results.push(await runTest('Format Tests', 'node', ['tests/unit/test_format.js']));
  results.push(await runTest('Stats Tests', 'node', ['tests/unit/test_stats.js']));

  // Run TUI tests
  log('\n🖥️  TUI Tests', 'yellow');
  results.push(await runTest('TUI Engine Tests', 'node', ['tests/tui/engine.test.js']));
  results.push(await runTest('TUI Flow Tests', 'node', ['tests/tui/flow.test.js']));

  // Run command tests with small fixture
  log('\n🔧 Command Tests', 'yellow');
  const testFile = path.join(__dirname, 'fixtures/test_sales.csv');
  const outputDir = process.platform === 'win32' ? process.env.TEMP : '/tmp';
  
  results.push(await runTest('EDA Command', 'node', [
    'bin/datapilot.js', 'eda', testFile, 
    '--output', path.join(outputDir, 'eda_test.txt'),
    '--timeout', '30000'
  ]));
  
  results.push(await runTest('INT Command', 'node', [
    'bin/datapilot.js', 'int', testFile,
    '--output', path.join(outputDir, 'int_test.txt')
  ]));
  
  results.push(await runTest('VIS Command', 'node', [
    'bin/datapilot.js', 'vis', testFile,
    '--output', path.join(outputDir, 'vis_test.txt')
  ]));

  // Run help commands
  log('\n📚 Help Commands', 'yellow');
  results.push(await runTest('Main Help', 'node', ['bin/datapilot.js', '--help']));
  results.push(await runTest('EDA Help', 'node', ['bin/datapilot.js', 'eda', '--help']));

  // Generate summary
  const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2);
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  log('\n📊 Test Summary', 'blue');
  log('================', 'blue');
  log(`Total Tests: ${results.length}`, 'blue');
  log(`Passed: ${passed}`, 'green');
  log(`Failed: ${failed}`, failed > 0 ? 'red' : 'green');
  log(`Duration: ${totalDuration}s`, 'blue');

  if (failed > 0) {
    log('\n❌ Failed Tests:', 'red');
    results.filter(r => !r.passed).forEach(r => {
      log(`  - ${r.name}${r.exitCode ? ` (exit code: ${r.exitCode})` : ''}`, 'red');
      if (r.error) log(`    Error: ${r.error}`, 'red');
    });
  }

  // Exit with appropriate code
  process.exit(failed > 0 ? 1 : 0);
}

// Run the test suite
main().catch(error => {
  log(`\n❌ Test suite error: ${error.message}`, 'red');
  process.exit(1);
});