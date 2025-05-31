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
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

// Test configuration
const config = {
  tuiPath: path.join(__dirname, '..', 'bin', 'datapilot.js'),
  fixturesPath: path.join(__dirname, 'fixtures'),
  timeout: 30000, // 30 seconds per test
  platform: os.platform(),
  isWindows: os.platform() === 'win32'
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
      if (child.output.includes(pattern)) {
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
async function sendInput(child, input, delay = 500) {
  await new Promise(resolve => setTimeout(resolve, delay));
  child.stdin.write(input + '\n');
}

// Test functions for each TUI option
const tests = [
  {
    name: 'Main Menu Navigation',
    fn: async () => {
      const child = spawnTUI('Main Menu Navigation');
      
      try {
        await waitForPattern(child, 'DATAPILOT');
        await waitForPattern(child, 'Analyze CSV');
        
        // Navigate through main menu options
        await sendInput(child, '\x1B[B'); // Down arrow
        await sendInput(child, '\x1B[B'); // Down arrow
        await sendInput(child, '\x1B[A'); // Up arrow
        
        // Exit
        await sendInput(child, '\x1B[B\x1B[B\x1B[B\x1B[B\x1B[B\x1B[B'); // Navigate to Exit
        await sendInput(child, '');
        
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      } finally {
        child.kill();
      }
    }
  },
  
  {
    name: 'File Browser Navigation',
    fn: async () => {
      const child = spawnTUI('File Browser');
      
      try {
        await waitForPattern(child, 'DATAPILOT');
        
        // Select Analyze CSV
        await sendInput(child, '');
        await waitForPattern(child, 'Select a CSV file');
        
        // Navigate to Browse for File
        const output = child.output;
        const browseIndex = output.split('\n').findIndex(line => line.includes('Browse for File'));
        for (let i = 0; i < browseIndex; i++) {
          await sendInput(child, '\x1B[B', 100);
        }
        
        // Select Browse
        await sendInput(child, '');
        await waitForPattern(child, 'Current directory');
        
        // Test navigation
        await sendInput(child, '\x1B[B'); // Down
        await sendInput(child, '\x1B[A'); // Up
        
        // Cancel
        const cancelIndex = child.output.split('\n').findIndex(line => line.includes('Cancel'));
        for (let i = 0; i < cancelIndex; i++) {
          await sendInput(child, '\x1B[B', 100);
        }
        await sendInput(child, '');
        
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      } finally {
        child.kill();
      }
    }
  },
  
  {
    name: 'Demo Mode - All Categories',
    fn: async () => {
      const child = spawnTUI('Demo Mode');
      
      try {
        await waitForPattern(child, 'DATAPILOT');
        
        // Navigate to Demo Mode
        await sendInput(child, '\x1B[B'); // Down to Demo Mode
        await sendInput(child, '');
        
        await waitForPattern(child, 'Choose a demo dataset');
        
        // Check for categories
        const categories = [
          'Healthcare & Medical',
          'E-commerce & Business',
          'Real Estate',
          'Finance & Economics',
          'Classic ML Datasets'
        ];
        
        for (const category of categories) {
          if (!child.output.includes(category)) {
            throw new Error(`Missing category: ${category}`);
          }
        }
        
        // Select a dataset
        await sendInput(child, '\x1B[B\x1B[B'); // Navigate to first dataset
        await sendInput(child, '');
        
        await waitForPattern(child, 'What type of analysis');
        
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      } finally {
        child.kill();
      }
    }
  },
  
  {
    name: 'Analysis Types - All Options',
    fn: async () => {
      const child = spawnTUI('Analysis Types');
      
      try {
        await waitForPattern(child, 'DATAPILOT');
        
        // Go to Demo Mode
        await sendInput(child, '\x1B[B');
        await sendInput(child, '');
        await waitForPattern(child, 'Choose a demo dataset');
        
        // Select first dataset
        await sendInput(child, '\x1B[B\x1B[B');
        await sendInput(child, '');
        
        await waitForPattern(child, 'What type of analysis');
        
        // Check all analysis types are present
        const analysisTypes = [
          'Complete Analysis Suite',
          'Exploratory Data Analysis',
          'Data Integrity Check',
          'Visualization Recommendations',
          'Data Engineering Archaeology',
          'LLM Context Generation'
        ];
        
        for (const type of analysisTypes) {
          if (!child.output.includes(type)) {
            throw new Error(`Missing analysis type: ${type}`);
          }
        }
        
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      } finally {
        child.kill();
      }
    }
  },
  
  {
    name: 'Memory Manager Access',
    fn: async () => {
      const child = spawnTUI('Memory Manager');
      
      try {
        await waitForPattern(child, 'DATAPILOT');
        
        // Navigate to Memory Manager
        await sendInput(child, '\x1B[B\x1B[B'); // Down to Memory Manager
        await sendInput(child, '');
        
        await waitForPattern(child, 'MEMORY MANAGER');
        await waitForPattern(child, 'Knowledge Base Summary');
        
        // Check options
        const options = [
          'List All Memories',
          'View Memory Details',
          'Delete Memory',
          'Clear All Memories',
          'Export Memories',
          'Session Memories'
        ];
        
        for (const option of options) {
          if (!child.output.includes(option)) {
            throw new Error(`Missing memory option: ${option}`);
          }
        }
        
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      } finally {
        child.kill();
      }
    }
  },
  
  {
    name: 'Settings Menu',
    fn: async () => {
      const child = spawnTUI('Settings');
      
      try {
        await waitForPattern(child, 'DATAPILOT');
        
        // Navigate to Settings
        await sendInput(child, '\x1B[B\x1B[B\x1B[B'); // Down to Settings
        await sendInput(child, '');
        
        await waitForPattern(child, 'SETTINGS');
        
        // Check settings options
        const settings = [
          'Output Format',
          'Analysis Depth',
          'Sampling Size',
          'Auto-save Results',
          'Color Theme'
        ];
        
        for (const setting of settings) {
          if (!child.output.includes(setting)) {
            throw new Error(`Missing setting: ${setting}`);
          }
        }
        
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      } finally {
        child.kill();
      }
    }
  },
  
  {
    name: 'Help System',
    fn: async () => {
      const child = spawnTUI('Help');
      
      try {
        await waitForPattern(child, 'DATAPILOT');
        
        // Navigate to Help
        await sendInput(child, '\x1B[B\x1B[B\x1B[B\x1B[B'); // Down to Help
        await sendInput(child, '');
        
        await waitForPattern(child, 'HELP');
        
        // Check help sections
        const helpSections = [
          'Getting Started',
          'Analysis Types',
          'Keyboard Shortcuts',
          'Memory System'
        ];
        
        for (const section of helpSections) {
          if (!child.output.includes(section)) {
            throw new Error(`Missing help section: ${section}`);
          }
        }
        
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      } finally {
        child.kill();
      }
    }
  },
  
  {
    name: 'Error Handling - Invalid File',
    fn: async () => {
      const child = spawnTUI('Error Handling');
      
      try {
        await waitForPattern(child, 'DATAPILOT');
        
        // Try to analyze CSV
        await sendInput(child, '');
        await waitForPattern(child, 'Select a CSV file');
        
        // If no files found, should show appropriate message
        if (child.output.includes('No CSV files found')) {
          return { success: true };
        }
        
        // Otherwise navigate to manual entry and test invalid input
        const manualIndex = child.output.split('\n').findIndex(line => line.includes('Browse for File'));
        for (let i = 0; i < manualIndex; i++) {
          await sendInput(child, '\x1B[B', 100);
        }
        
        await sendInput(child, '');
        await waitForPattern(child, 'Current directory');
        
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      } finally {
        child.kill();
      }
    }
  }
];

// Run all tests
async function runTests() {
  console.log(`${colors.cyan}🧪 DataPilot Comprehensive TUI Test Suite${colors.reset}\n`);
  console.log(`Platform: ${config.platform}`);
  console.log(`Node: ${process.version}`);
  console.log(`Tests: ${tests.length}\n`);
  
  for (const test of tests) {
    process.stdout.write(`${colors.blue}▶${colors.reset} ${test.name}... `);
    
    const startTime = Date.now();
    const result = await test.fn();
    const duration = Date.now() - startTime;
    
    if (result.success) {
      console.log(`${colors.green}✓${colors.reset} (${duration}ms)`);
      results.passed++;
    } else {
      console.log(`${colors.red}✗${colors.reset} (${duration}ms)`);
      console.log(`  ${colors.yellow}Error: ${result.error}${colors.reset}`);
      results.failed++;
    }
    
    results.tests.push({
      name: test.name,
      success: result.success,
      duration,
      error: result.error
    });
  }
  
  // Summary
  console.log(`\n${colors.cyan}📊 Test Summary${colors.reset}`);
  console.log(`${colors.green}✓ Passed: ${results.passed}${colors.reset}`);
  console.log(`${colors.red}✗ Failed: ${results.failed}${colors.reset}`);
  
  const successRate = ((results.passed / tests.length) * 100).toFixed(1);
  const rateColor = successRate >= 80 ? colors.green : successRate >= 60 ? colors.yellow : colors.red;
  console.log(`${rateColor}Success Rate: ${successRate}%${colors.reset}`);
  
  // Save results
  const reportPath = path.join(__dirname, 'comprehensive_tui_test_report.json');
  await fs.writeFile(reportPath, JSON.stringify(results, null, 2));
  console.log(`\n${colors.blue}📄 Report saved to: ${reportPath}${colors.reset}`);
  
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
  console.error(`${colors.red}Test suite error: ${error.message}${colors.reset}`);
  process.exit(1);
});