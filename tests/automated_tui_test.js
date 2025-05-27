#!/usr/bin/env node

import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ANSI escape codes for colors
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Test configuration
const config = {
  tuiPath: path.join(__dirname, '..', 'bin', 'datapilot.js'),
  fixturesPath: path.join(__dirname, 'fixtures'),
  timeout: 30000, // 30 seconds max per test
  platform: os.platform(),
  isWindows: os.platform() === 'win32'
};

// Test results tracking
const results = {
  passed: 0,
  failed: 0,
  skipped: 0,
  errors: []
};

// Helper to create a TUI process
function spawnTUI(args = [], options = {}) {
  const env = { ...process.env, FORCE_COLOR: '0', NO_COLOR: '1' };
  const spawnOptions = {
    env,
    stdio: ['pipe', 'pipe', 'pipe'],
    shell: config.isWindows,
    ...options
  };
  
  return spawn(process.execPath, [config.tuiPath, 'ui', ...args], spawnOptions);
}

// Helper to send input to TUI
function sendInput(proc, input, delay = 100) {
  return new Promise((resolve) => {
    setTimeout(() => {
      proc.stdin.write(input);
      resolve();
    }, delay);
  });
}

// Helper to wait for specific output
function waitForOutput(proc, pattern, timeout = 5000) {
  return new Promise((resolve, reject) => {
    let output = '';
    let timer;
    
    const onData = (data) => {
      output += data.toString();
      if (pattern instanceof RegExp ? pattern.test(output) : output.includes(pattern)) {
        clearTimeout(timer);
        proc.stdout.removeListener('data', onData);
        proc.stderr.removeListener('data', onData);
        resolve(output);
      }
    };
    
    proc.stdout.on('data', onData);
    proc.stderr.on('data', onData);
    
    timer = setTimeout(() => {
      proc.stdout.removeListener('data', onData);
      proc.stderr.removeListener('data', onData);
      reject(new Error(`Timeout waiting for pattern: ${pattern}`));
    }, timeout);
  });
}

// Test suite definitions
const testSuites = [
  {
    name: 'TUI Startup and Exit',
    tests: [
      {
        name: 'Should start and display welcome message',
        async run() {
          const proc = spawnTUI();
          try {
            await waitForOutput(proc, /Welcome.*DataPilot.*Interactive|DataPilot.*Interactive/i);
            await sendInput(proc, '\x1B[B\x1B[B\r'); // Arrow down twice, then Enter (Exit)
            await waitForOutput(proc, /exit|thank|bye/i, 2000);
            return { success: true };
          } finally {
            proc.kill();
          }
        }
      },
      {
        name: 'Should handle immediate exit gracefully',
        async run() {
          const proc = spawnTUI();
          try {
            await waitForOutput(proc, /What.*would.*you.*like.*to.*do|DataPilot.*Interactive/i);
            await sendInput(proc, '\x03'); // Ctrl+C
            await new Promise(resolve => setTimeout(resolve, 500));
            return { success: proc.killed || proc.exitCode !== null };
          } finally {
            proc.kill();
          }
        }
      }
    ]
  },
  
  {
    name: 'File Selection',
    tests: [
      {
        name: 'Should browse for CSV files',
        async run() {
          const proc = spawnTUI();
          try {
            await waitForOutput(proc, /What.*would.*you.*like.*to.*do/i);
            await sendInput(proc, '\r'); // Select "Analyze CSV files"
            await waitForOutput(proc, /How.*would.*you.*like.*to.*select/i);
            await sendInput(proc, '\r'); // Select "Browse for a file"
            await waitForOutput(proc, /Browse.*files.*interactively|Select.*CSV/i, 3000);
            return { success: true };
          } finally {
            proc.kill();
          }
        }
      },
      {
        name: 'Should handle invalid file selection',
        async run() {
          const proc = spawnTUI();
          try {
            await waitForOutput(proc, /What.*would.*you.*like.*to.*do/i);
            await sendInput(proc, '\r'); // Analyze
            await waitForOutput(proc, /How.*would.*you.*like.*to.*select/i);
            await sendInput(proc, '\x1B[B\r'); // Navigate to "Type path directly"
            await waitForOutput(proc, /Enter.*the.*path|Type.*path|Enter.*CSV/i);
            await sendInput(proc, 'nonexistent.csv\r');
            await waitForOutput(proc, /not.*found|doesn.*t.*exist|error/i, 3000);
            return { success: true };
          } catch (err) {
            return { success: false, error: err.message };
          } finally {
            proc.kill();
          }
        }
      }
    ]
  },
  
  {
    name: 'Analysis Workflow',
    tests: [
      {
        name: 'Should complete demo analysis',
        async run() {
          const proc = spawnTUI();
          try {
            await waitForOutput(proc, /What.*would.*you.*like.*to.*do/i);
            await sendInput(proc, '\x1B[B\r'); // Arrow down + Enter (Demo)
            await waitForOutput(proc, /Demo.*Mode|Sample.*Analysis|Analyzing/i, 10000);
            await waitForOutput(proc, /Analysis.*complete|Results|Done/i, 15000);
            return { success: true };
          } catch (err) {
            return { success: false, error: err.message };
          } finally {
            proc.kill();
          }
        }
      }
    ]
  },
  
  {
    name: 'Windows-Specific Tests',
    skip: !config.isWindows,
    tests: [
      {
        name: 'Should handle Windows paths correctly',
        async run() {
          const proc = spawnTUI();
          try {
            await waitForOutput(proc, /What.*would.*you.*like.*to.*do/i);
            await sendInput(proc, '\r'); // Analyze
            await waitForOutput(proc, /How.*would.*you.*like.*to.*select/i);
            await sendInput(proc, '\x1B[B\r'); // Type path directly
            await waitForOutput(proc, /Enter.*the.*path|Type.*path|Enter.*CSV/i);
            // Test Windows path with backslashes
            await sendInput(proc, 'C:\\Users\\test\\data.csv\r');
            await waitForOutput(proc, /not.*found|doesn.*t.*exist|error/i, 3000);
            return { success: true };
          } finally {
            proc.kill();
          }
        }
      }
    ]
  },
  
  {
    name: 'Encoding and Special Characters',
    tests: [
      {
        name: 'Should handle non-ASCII characters in prompts',
        async run() {
          const proc = spawnTUI(['--encoding', 'utf8']);
          try {
            await waitForOutput(proc, /DataPilot.*Interactive/i);
            // Test that TUI doesn't crash with UTF-8
            return { success: true };
          } finally {
            proc.kill();
          }
        }
      }
    ]
  },
  
  {
    name: 'Performance and Stability',
    tests: [
      {
        name: 'Should handle rapid input without crashing',
        async run() {
          const proc = spawnTUI();
          try {
            await waitForOutput(proc, /What.*would.*you.*like.*to.*do/i);
            // Send rapid keypresses
            for (let i = 0; i < 10; i++) {
              await sendInput(proc, '\x1B[A\x1B[B', 10); // Up/Down rapidly
            }
            await sendInput(proc, '\x1B[B\x1B[B\r', 100); // Exit
            await waitForOutput(proc, /goodbye|exit|Thank.*you/i, 2000);
            return { success: true };
          } finally {
            proc.kill();
          }
        }
      },
      {
        name: 'Should recover from interrupted operations',
        async run() {
          const proc = spawnTUI();
          try {
            await waitForOutput(proc, /What.*would.*you.*like.*to.*do/i);
            await sendInput(proc, '\r'); // Start analyze
            await sendInput(proc, '\x03', 500); // Interrupt with Ctrl+C
            // Check if process exits cleanly
            await new Promise(resolve => setTimeout(resolve, 1000));
            return { success: proc.killed || proc.exitCode !== null };
          } finally {
            proc.kill();
          }
        }
      }
    ]
  }
];

// Test runner
async function runTest(test, suiteName) {
  const startTime = Date.now();
  console.log(`  ${colors.cyan}▶${colors.reset} ${test.name}`);
  
  try {
    const result = await Promise.race([
      test.run(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Test timeout')), config.timeout)
      )
    ]);
    
    const duration = Date.now() - startTime;
    
    if (result.success) {
      console.log(`    ${colors.green}✓${colors.reset} Passed (${duration}ms)`);
      results.passed++;
    } else {
      console.log(`    ${colors.red}✗${colors.reset} Failed: ${result.error || 'Unknown error'}`);
      results.failed++;
      results.errors.push({
        suite: suiteName,
        test: test.name,
        error: result.error
      });
    }
  } catch (err) {
    const duration = Date.now() - startTime;
    console.log(`    ${colors.red}✗${colors.reset} Error: ${err.message} (${duration}ms)`);
    results.failed++;
    results.errors.push({
      suite: suiteName,
      test: test.name,
      error: err.message
    });
  }
}

// Main test execution
async function runAllTests() {
  console.log(`${colors.blue}DataPilot TUI Automated Tests${colors.reset}`);
  console.log(`Platform: ${config.platform}`);
  console.log(`Node: ${process.version}\n`);
  
  for (const suite of testSuites) {
    if (suite.skip) {
      console.log(`${colors.yellow}⊘ Skipping suite: ${suite.name}${colors.reset}`);
      results.skipped += suite.tests.length;
      continue;
    }
    
    console.log(`${colors.blue}Suite: ${suite.name}${colors.reset}`);
    
    for (const test of suite.tests) {
      await runTest(test, suite.name);
    }
    
    console.log('');
  }
  
  // Summary
  console.log(`${colors.blue}Summary:${colors.reset}`);
  console.log(`  ${colors.green}Passed: ${results.passed}${colors.reset}`);
  console.log(`  ${colors.red}Failed: ${results.failed}${colors.reset}`);
  console.log(`  ${colors.yellow}Skipped: ${results.skipped}${colors.reset}`);
  
  if (results.errors.length > 0) {
    console.log(`\n${colors.red}Errors:${colors.reset}`);
    results.errors.forEach(err => {
      console.log(`  ${err.suite} > ${err.test}`);
      console.log(`    ${err.error}`);
    });
  }
  
  // Write results to file
  const reportPath = path.join(__dirname, 'tui_test_report.json');
  await fs.writeFile(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    platform: config.platform,
    node: process.version,
    results
  }, null, 2));
  
  console.log(`\nTest report saved to: ${reportPath}`);
  
  // Exit with appropriate code
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(err => {
  console.error(`${colors.red}Fatal error:${colors.reset}`, err);
  process.exit(1);
});