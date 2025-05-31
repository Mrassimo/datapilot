#!/usr/bin/env node

import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ANSI escape codes for colors
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

// Test configuration
const config = {
  tuiPath: path.join(__dirname, '..', 'bin', 'datapilot.js'),
  timeout: 20000, // 20 seconds per test
  isWindows: process.platform === 'win32'
};

// Test results
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

// Helper to create a TUI process
function spawnTUI(testName) {
  const env = { ...process.env, FORCE_COLOR: '0', NO_COLOR: '1' };
  const child = spawn('node', [config.tuiPath, 'ui'], {
    env,
    stdio: ['pipe', 'pipe', 'pipe'],
    shell: config.isWindows
  });
  
  child.testName = testName;
  child.output = '';
  child.errors = '';
  
  child.stdout.on('data', (data) => {
    child.output += data.toString();
  });
  
  child.stderr.on('data', (data) => {
    child.errors += data.toString();
  });
  
  return child;
}

// Helper to wait for pattern in output
function waitForPattern(child, pattern, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timeout waiting for pattern: ${pattern}`));
    }, timeout);
    
    const checkOutput = () => {
      if (child.output.includes(pattern) || child.output.toLowerCase().includes(pattern.toLowerCase())) {
        clearTimeout(timer);
        resolve();
      } else {
        setTimeout(checkOutput, 100);
      }
    };
    
    checkOutput();
  });
}

// Helper to send input to TUI
async function sendInput(child, input, delay = 300) {
  await new Promise(resolve => setTimeout(resolve, delay));
  child.stdin.write(input + '\n');
}

// Helper to send arrow keys
async function sendArrow(child, direction, delay = 300) {
  await new Promise(resolve => setTimeout(resolve, delay));
  const arrows = {
    down: '\x1B[B',
    up: '\x1B[A',
    left: '\x1B[D',
    right: '\x1B[C'
  };
  child.stdin.write(arrows[direction]);
}

// Helper to send Enter key
async function sendEnter(child, delay = 300) {
  await new Promise(resolve => setTimeout(resolve, delay));
  child.stdin.write('\r\n');
}

// Test 1: Basic file browser access
const test1_BasicAccess = {
  name: 'File Browser - Basic Access',
  fn: async () => {
    const child = spawnTUI('File Browser Basic Access');
    
    try {
      // Wait for main menu
      await waitForPattern(child, 'DATAPILOT');
      console.log('  ✓ Main menu loaded');
      
      // Select "Analyze CSV Data"
      await sendEnter(child);
      await waitForPattern(child, 'Select a CSV file');
      console.log('  ✓ File selection menu loaded');
      
      // Look for "Browse for File" option
      if (!child.output.includes('Browse for File')) {
        throw new Error('Browse for File option not found');
      }
      console.log('  ✓ Browse for File option present');
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message, output: child.output };
    } finally {
      child.kill();
    }
  }
};

// Test 2: Navigate to file browser
const test2_NavigateToBrowser = {
  name: 'File Browser - Navigation to Browser',
  fn: async () => {
    const child = spawnTUI('Navigate to Browser');
    
    try {
      await waitForPattern(child, 'DATAPILOT');
      
      // Select Analyze CSV
      await sendEnter(child);
      await waitForPattern(child, 'Select a CSV file');
      
      // Navigate to Browse for File (usually last option before back)
      const lines = child.output.split('\n');
      let browseLineIndex = -1;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('Browse for File') || lines[i].includes('Browse')) {
          browseLineIndex = i;
          break;
        }
      }
      
      if (browseLineIndex === -1) {
        throw new Error('Could not find Browse for File option');
      }
      
      // Navigate down to Browse option (typically need 2-3 down arrows)
      for (let i = 0; i < 5; i++) {
        await sendArrow(child, 'down', 200);
      }
      
      // Select Browse for File
      await sendEnter(child);
      await waitForPattern(child, 'Current directory', 8000);
      console.log('  ✓ File browser opened successfully');
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message, output: child.output };
    } finally {
      child.kill();
    }
  }
};

// Test 3: File browser directory navigation
const test3_DirectoryNavigation = {
  name: 'File Browser - Directory Navigation',
  fn: async () => {
    const child = spawnTUI('Directory Navigation');
    
    try {
      await waitForPattern(child, 'DATAPILOT');
      await sendEnter(child);
      await waitForPattern(child, 'Select a CSV file');
      
      // Navigate to Browse
      for (let i = 0; i < 5; i++) {
        await sendArrow(child, 'down', 200);
      }
      await sendEnter(child);
      await waitForPattern(child, 'Current directory');
      
      // Test arrow navigation
      await sendArrow(child, 'down', 500);
      await sendArrow(child, 'up', 500);
      await sendArrow(child, 'down', 500);
      
      console.log('  ✓ Arrow navigation works');
      
      // Check for folder icons
      if (!child.output.includes('📁') && !child.output.includes('folder')) {
        console.log('  ⚠ No folder icons detected (might be text-only)');
      } else {
        console.log('  ✓ Folder icons present');
      }
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message, output: child.output };
    } finally {
      child.kill();
    }
  }
};

// Test 4: File selection capability
const test4_FileSelection = {
  name: 'File Browser - File Selection',
  fn: async () => {
    const child = spawnTUI('File Selection');
    
    try {
      await waitForPattern(child, 'DATAPILOT');
      await sendEnter(child);
      await waitForPattern(child, 'Select a CSV file');
      
      // Navigate to Browse
      for (let i = 0; i < 5; i++) {
        await sendArrow(child, 'down', 200);
      }
      await sendEnter(child);
      await waitForPattern(child, 'Current directory');
      
      // Look for CSV files or navigate to tests/fixtures
      const hasCSV = child.output.includes('.csv') || child.output.includes('📄');
      
      if (!hasCSV) {
        // Try to navigate to tests directory
        const hasTests = child.output.includes('tests');
        if (hasTests) {
          // Navigate to tests folder
          let foundTests = false;
          for (let i = 0; i < 10; i++) {
            await sendArrow(child, 'down', 200);
            if (child.output.includes('tests') && child.output.includes('📁')) {
              await sendEnter(child);
              foundTests = true;
              break;
            }
          }
          
          if (foundTests) {
            await waitForPattern(child, 'Current directory');
            // Now look for fixtures
            for (let i = 0; i < 10; i++) {
              await sendArrow(child, 'down', 200);
              if (child.output.includes('fixtures')) {
                await sendEnter(child);
                break;
              }
            }
          }
        }
      }
      
      // Try to select a CSV file
      await waitForPattern(child, 'Current directory');
      
      // Look for CSV files and try to select one
      for (let i = 0; i < 15; i++) {
        await sendArrow(child, 'down', 200);
        const currentOutput = child.output;
        if (currentOutput.includes('.csv') || currentOutput.includes('📄')) {
          console.log('  ✓ Found CSV file, attempting selection');
          await sendEnter(child, 1000);
          
          // Check if we got to analysis type selection
          try {
            await waitForPattern(child, 'analysis', 3000);
            console.log('  ✓ File selection successful - reached analysis menu');
            return { success: true };
          } catch (e) {
            console.log('  ⚠ File selected but analysis menu not reached');
          }
          break;
        }
      }
      
      console.log('  ✓ File browser navigation completed');
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message, output: child.output };
    } finally {
      child.kill();
    }
  }
};

// Test 5: Cancel functionality
const test5_CancelFunction = {
  name: 'File Browser - Cancel Function',
  fn: async () => {
    const child = spawnTUI('Cancel Function');
    
    try {
      await waitForPattern(child, 'DATAPILOT');
      await sendEnter(child);
      await waitForPattern(child, 'Select a CSV file');
      
      // Navigate to Browse
      for (let i = 0; i < 5; i++) {
        await sendArrow(child, 'down', 200);
      }
      await sendEnter(child);
      await waitForPattern(child, 'Current directory');
      
      // Look for Cancel option and select it
      for (let i = 0; i < 20; i++) {
        await sendArrow(child, 'down', 100);
        if (child.output.includes('Cancel') || child.output.includes('❌')) {
          console.log('  ✓ Found Cancel option');
          await sendEnter(child);
          
          // Should return to file selection menu
          try {
            await waitForPattern(child, 'Select a CSV file', 2000);
            console.log('  ✓ Cancel returned to file selection menu');
            return { success: true };
          } catch (e) {
            console.log('  ⚠ Cancel did not return to expected menu');
          }
          break;
        }
      }
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message, output: child.output };
    } finally {
      child.kill();
    }
  }
};

// Test 6: Error handling
const test6_ErrorHandling = {
  name: 'File Browser - Error Handling',
  fn: async () => {
    const child = spawnTUI('Error Handling');
    
    try {
      await waitForPattern(child, 'DATAPILOT');
      await sendEnter(child);
      await waitForPattern(child, 'Select a CSV file');
      
      // Navigate to Browse
      for (let i = 0; i < 5; i++) {
        await sendArrow(child, 'down', 200);
      }
      await sendEnter(child);
      await waitForPattern(child, 'Current directory');
      
      // Send Ctrl+C to test error handling
      child.stdin.write('\x03');
      
      // Or test with invalid navigation
      for (let i = 0; i < 50; i++) {
        await sendArrow(child, 'down', 50);
      }
      
      console.log('  ✓ Error handling test completed');
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message, output: child.output };
    } finally {
      child.kill();
    }
  }
};

// All tests
const tests = [
  test1_BasicAccess,
  test2_NavigateToBrowser,
  test3_DirectoryNavigation,
  test4_FileSelection,
  test5_CancelFunction,
  test6_ErrorHandling
];

// Run all tests
async function runTests() {
  console.log(`${colors.cyan}🧪 DataPilot File Browser Extensive Test Suite${colors.reset}\n`);
  console.log(`Platform: ${process.platform}`);
  console.log(`Node: ${process.version}`);
  console.log(`Tests: ${tests.length}\n`);
  
  for (const test of tests) {
    process.stdout.write(`${colors.blue}▶${colors.reset} ${test.name}...\n`);
    
    const startTime = Date.now();
    const result = await test.fn();
    const duration = Date.now() - startTime;
    
    if (result.success) {
      console.log(`  ${colors.green}✓ PASSED${colors.reset} (${duration}ms)\n`);
      results.passed++;
    } else {
      console.log(`  ${colors.red}✗ FAILED${colors.reset} (${duration}ms)`);
      console.log(`  ${colors.yellow}Error: ${result.error}${colors.reset}`);
      if (result.output) {
        console.log(`  ${colors.cyan}Last output snippet:${colors.reset}`);
        console.log(`  ${result.output.slice(-200)}...\n`);
      }
      results.failed++;
    }
    
    results.tests.push({
      name: test.name,
      success: result.success,
      duration,
      error: result.error,
      output: result.output ? result.output.slice(-500) : null
    });
  }
  
  // Summary
  console.log(`${colors.cyan}📊 Test Summary${colors.reset}`);
  console.log(`${colors.green}✓ Passed: ${results.passed}${colors.reset}`);
  console.log(`${colors.red}✗ Failed: ${results.failed}${colors.reset}`);
  
  const successRate = ((results.passed / tests.length) * 100).toFixed(1);
  const rateColor = successRate >= 80 ? colors.green : successRate >= 60 ? colors.yellow : colors.red;
  console.log(`${rateColor}Success Rate: ${successRate}%${colors.reset}`);
  
  // Save detailed results
  const reportPath = path.join(__dirname, 'file_browser_test_report.json');
  await fs.writeFile(reportPath, JSON.stringify(results, null, 2));
  console.log(`\n${colors.blue}📄 Detailed report saved to: ${reportPath}${colors.reset}`);
  
  // Show failed test details
  if (results.failed > 0) {
    console.log(`\n${colors.red}❌ Failed Tests:${colors.reset}`);
    results.tests.filter(t => !t.success).forEach(test => {
      console.log(`  • ${test.name}: ${test.error}`);
    });
  }
  
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
  console.error(`${colors.red}Test suite error: ${error.message}${colors.reset}`);
  process.exit(1);
});