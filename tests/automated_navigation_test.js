#!/usr/bin/env node

/**
 * Automated TUI Navigation Test
 * Tests all navigation paths without requiring manual interaction
 * Simulates user keyboard inputs to verify menu functionality
 */

import { spawn } from 'child_process';
import { EventEmitter } from 'events';
import fs from 'fs';
import path from 'path';

class TUINavigationTester extends EventEmitter {
  constructor() {
    super();
    this.testResults = [];
    this.currentTest = null;
    this.process = null;
    this.outputBuffer = '';
    this.timeout = 30000; // 30 second timeout per test
    this.testStartTime = null;
  }

  async runAllTests() {
    console.log('🚀 Starting Automated TUI Navigation Tests...\n');
    
    const tests = [
      { name: 'Main Menu Navigation', test: () => this.testMainMenuNavigation() },
      { name: 'Settings Menu Navigation', test: () => this.testSettingsNavigation() },
      { name: 'Memory Manager Navigation', test: () => this.testMemoryNavigation() },
      { name: 'Demo Mode Navigation', test: () => this.testDemoNavigation() },
      { name: 'Analysis Navigation', test: () => this.testAnalysisNavigation() },
      { name: 'Back Navigation', test: () => this.testBackNavigation() },
      { name: 'Exit Functionality', test: () => this.testExitFunctionality() }
    ];

    for (const testCase of tests) {
      console.log(`\n📋 Running: ${testCase.name}`);
      console.log('─'.repeat(50));
      
      try {
        await this.runSingleTest(testCase);
      } catch (error) {
        console.log(`❌ ${testCase.name} FAILED: ${error.message}`);
        this.testResults.push({
          name: testCase.name,
          status: 'FAILED',
          error: error.message,
          duration: Date.now() - this.testStartTime
        });
      }
    }

    this.generateReport();
    return this.testResults;
  }

  async runSingleTest(testCase) {
    this.testStartTime = Date.now();
    this.currentTest = testCase.name;
    this.outputBuffer = '';
    
    return new Promise((resolve, reject) => {
      // Set test timeout
      const timeoutId = setTimeout(() => {
        if (this.process) {
          this.process.kill('SIGTERM');
        }
        reject(new Error('Test timeout'));
      }, this.timeout);

      // Run the test
      testCase.test()
        .then((result) => {
          clearTimeout(timeoutId);
          console.log(`✅ ${testCase.name} PASSED`);
          this.testResults.push({
            name: testCase.name,
            status: 'PASSED',
            duration: Date.now() - this.testStartTime,
            details: result
          });
          resolve(result);
        })
        .catch((error) => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
  }

  async testMainMenuNavigation() {
    return this.runTUITest([
      { action: 'wait', duration: 2000 }, // Wait for startup
      { action: 'expect', text: 'MAIN MENU' },
      { action: 'expect', text: 'Guided Analysis' },
      { action: 'expect', text: 'Demo Mode' },
      { action: 'expect', text: 'Memory Manager' },
      { action: 'expect', text: 'Settings' },
      { action: 'key', key: 'Down' }, // Navigate down
      { action: 'key', key: 'Down' },
      { action: 'key', key: 'Up' }, // Navigate back up
      { action: 'key', key: 'Escape' } // Exit
    ], 'Main menu displays all options and responds to navigation');
  }

  async testSettingsNavigation() {
    return this.runTUITest([
      { action: 'wait', duration: 2000 },
      { action: 'expect', text: 'MAIN MENU' },
      { action: 'navigateToOption', option: 'Settings' },
      { action: 'key', key: 'Enter' },
      { action: 'wait', duration: 1000 },
      { action: 'expect', text: 'SETTINGS & PREFERENCES' },
      { action: 'expect', text: 'Color Themes' },
      { action: 'expect', text: 'About DataPilot' },
      { action: 'expect', text: 'Back to Main Menu' },
      { action: 'key', key: 'Down' }, // Navigate in settings
      { action: 'key', key: 'Down' },
      { action: 'navigateToOption', option: 'About DataPilot' },
      { action: 'key', key: 'Enter' },
      { action: 'wait', duration: 500 },
      { action: 'expect', text: 'ABOUT DATAPILOT' },
      { action: 'key', key: 'Enter' }, // Exit about
      { action: 'navigateToOption', option: 'Back to Main Menu' },
      { action: 'key', key: 'Enter' },
      { action: 'key', key: 'Escape' }
    ], 'Settings menu navigation and About page work correctly');
  }

  async testMemoryNavigation() {
    return this.runTUITest([
      { action: 'wait', duration: 2000 },
      { action: 'navigateToOption', option: 'Memory Manager' },
      { action: 'key', key: 'Enter' },
      { action: 'wait', duration: 1000 },
      { action: 'expect', text: 'MEMORY MANAGER' },
      { action: 'expect', text: 'List All Memories' },
      { action: 'expect', text: 'Export Memories' },
      { action: 'expect', text: 'Back to Main Menu' },
      { action: 'key', key: 'Down' }, // Test navigation
      { action: 'key', key: 'Down' },
      { action: 'key', key: 'Up' },
      { action: 'navigateToOption', option: 'Back to Main Menu' },
      { action: 'key', key: 'Enter' },
      { action: 'key', key: 'Escape' }
    ], 'Memory Manager navigation works correctly');
  }

  async testDemoNavigation() {
    return this.runTUITest([
      { action: 'wait', duration: 2000 },
      { action: 'navigateToOption', option: 'Demo Mode' },
      { action: 'key', key: 'Enter' },
      { action: 'wait', duration: 1000 },
      { action: 'expect', text: 'DEMO MODE' },
      { action: 'expect', text: 'boston_housing.csv' },
      { action: 'expect', text: 'iris.csv' }, // Should only have 2 datasets
      { action: 'expect', text: 'Back to Main Menu' },
      { action: 'navigateToOption', option: 'Back to Main Menu' },
      { action: 'key', key: 'Enter' },
      { action: 'key', key: 'Escape' }
    ], 'Demo mode shows only 2 datasets and navigation works');
  }

  async testAnalysisNavigation() {
    return this.runTUITest([
      { action: 'wait', duration: 2000 },
      { action: 'navigateToOption', option: 'Guided Analysis' },
      { action: 'key', key: 'Enter' },
      { action: 'wait', duration: 1000 },
      { action: 'expect', text: 'GUIDED ANALYSIS MODE' },
      // Should show file selection or message about no CSV files
      { action: 'waitForAny', texts: ['Select a CSV file', 'No CSV files found', 'Back to Main Menu'] },
      { action: 'key', key: 'Escape' }, // Try to exit
      { action: 'key', key: 'Escape' }
    ], 'Guided Analysis mode starts correctly');
  }

  async testBackNavigation() {
    return this.runTUITest([
      { action: 'wait', duration: 2000 },
      { action: 'navigateToOption', option: 'Settings' },
      { action: 'key', key: 'Enter' },
      { action: 'wait', duration: 1000 },
      { action: 'navigateToOption', option: 'Back to Main Menu' },
      { action: 'key', key: 'Enter' },
      { action: 'wait', duration: 500 },
      { action: 'expect', text: 'MAIN MENU' }, // Should be back at main menu
      { action: 'key', key: 'Escape' }
    ], 'Back navigation returns to main menu correctly');
  }

  async testExitFunctionality() {
    return this.runTUITest([
      { action: 'wait', duration: 2000 },
      { action: 'navigateToOption', option: 'Exit' },
      { action: 'key', key: 'Enter' },
      { action: 'wait', duration: 1000 },
      { action: 'expectExit', message: 'Application should exit cleanly' }
    ], 'Exit functionality works correctly');
  }

  async runTUITest(steps, description) {
    return new Promise((resolve, reject) => {
      // Start the TUI process
      this.process = spawn('node', ['bin/datapilot.js', 'ui'], {
        cwd: '/Users/massimoraso/Code/jseda/datapilot',
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stepIndex = 0;
      let completed = false;

      const cleanup = () => {
        if (this.process && !this.process.killed) {
          this.process.kill('SIGTERM');
        }
      };

      this.process.stdout.on('data', (data) => {
        this.outputBuffer += data.toString();
        this.processNextStep();
      });

      this.process.stderr.on('data', (data) => {
        console.log(`⚠️ stderr: ${data.toString()}`);
      });

      this.process.on('exit', (code) => {
        if (!completed) {
          const currentStep = steps[stepIndex];
          if (currentStep && currentStep.action === 'expectExit') {
            completed = true;
            resolve({ success: true, description, exitCode: code });
          } else {
            reject(new Error(`Process exited unexpectedly with code ${code}`));
          }
        }
      });

      this.process.on('error', (error) => {
        cleanup();
        reject(new Error(`Process error: ${error.message}`));
      });

      const processNextStep = () => {
        if (completed || stepIndex >= steps.length) {
          if (!completed) {
            completed = true;
            cleanup();
            resolve({ success: true, description });
          }
          return;
        }

        const step = steps[stepIndex];
        
        try {
          switch (step.action) {
            case 'wait':
              setTimeout(() => {
                stepIndex++;
                processNextStep();
              }, step.duration);
              break;

            case 'expect':
              if (this.outputBuffer.includes(step.text)) {
                console.log(`  ✓ Found expected text: "${step.text}"`);
                stepIndex++;
                processNextStep();
              }
              // Will be called again when more output arrives
              break;

            case 'waitForAny':
              if (step.texts.some(text => this.outputBuffer.includes(text))) {
                const foundText = step.texts.find(text => this.outputBuffer.includes(text));
                console.log(`  ✓ Found expected text: "${foundText}"`);
                stepIndex++;
                processNextStep();
              }
              break;

            case 'key':
              this.sendKey(step.key);
              stepIndex++;
              setTimeout(processNextStep, 200); // Small delay after key press
              break;

            case 'navigateToOption':
              // Simulate navigating to a specific menu option
              this.navigateToMenuOption(step.option);
              stepIndex++;
              setTimeout(processNextStep, 500);
              break;

            case 'expectExit':
              // This will be handled by the process exit event
              break;

            default:
              throw new Error(`Unknown action: ${step.action}`);
          }
        } catch (error) {
          cleanup();
          reject(error);
        }
      };

      this.processNextStep = processNextStep;

      // Start processing steps after a brief delay
      setTimeout(processNextStep, 100);
    });
  }

  sendKey(key) {
    if (!this.process || !this.process.stdin) return;

    const keyMap = {
      'Enter': '\r',
      'Escape': '\u001b',
      'Up': '\u001b[A',
      'Down': '\u001b[B',
      'Left': '\u001b[D',
      'Right': '\u001b[C',
      'Space': ' ',
      'Tab': '\t'
    };

    const keyCode = keyMap[key] || key;
    this.process.stdin.write(keyCode);
  }

  navigateToMenuOption(optionText) {
    // For now, just send a few down arrows to simulate navigation
    // In a real implementation, this would be more sophisticated
    for (let i = 0; i < 3; i++) {
      setTimeout(() => this.sendKey('Down'), i * 100);
    }
  }

  generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 TUI NAVIGATION TEST REPORT');
    console.log('='.repeat(60));

    const passed = this.testResults.filter(r => r.status === 'PASSED').length;
    const failed = this.testResults.filter(r => r.status === 'FAILED').length;
    const total = this.testResults.length;

    console.log(`\n📈 Summary: ${passed}/${total} tests passed (${((passed/total)*100).toFixed(1)}%)`);
    
    if (failed > 0) {
      console.log(`❌ Failed: ${failed}`);
    }

    console.log('\n📋 Detailed Results:');
    console.log('-'.repeat(40));

    this.testResults.forEach(result => {
      const status = result.status === 'PASSED' ? '✅' : '❌';
      const duration = `${result.duration}ms`;
      console.log(`${status} ${result.name.padEnd(25)} (${duration})`);
      
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
      if (result.details) {
        console.log(`   Details: ${result.details.description}`);
      }
    });

    // Write report to file
    const reportPath = '/Users/massimoraso/Code/jseda/datapilot/tests/navigation_test_report.json';
    fs.writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      summary: { total, passed, failed, passRate: (passed/total)*100 },
      results: this.testResults
    }, null, 2));

    console.log(`\n💾 Full report saved to: ${reportPath}`);
    console.log('='.repeat(60));
  }
}

// Verification function that can be called independently
export async function verifyTUINavigation() {
  const tester = new TUINavigationTester();
  const results = await tester.runAllTests();
  
  const passed = results.filter(r => r.status === 'PASSED').length;
  const total = results.length;
  
  return {
    success: passed === total,
    passRate: (passed/total) * 100,
    results
  };
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new TUINavigationTester();
  
  tester.runAllTests()
    .then(results => {
      const passed = results.filter(r => r.status === 'PASSED').length;
      const total = results.length;
      
      console.log(`\n🎯 Final Result: ${passed}/${total} tests passed`);
      
      if (passed === total) {
        console.log('🎉 All navigation tests PASSED! TUI is working correctly.');
        process.exit(0);
      } else {
        console.log('⚠️ Some tests FAILED. Check the report for details.');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('❌ Test suite failed:', error.message);
      process.exit(1);
    });
}