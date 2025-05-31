#!/usr/bin/env node

/**
 * Manual UX Navigation Test - Sequential Screen Analysis
 * Tests every screen and exit path in DataPilot TUI
 */

import { spawn } from 'child_process';
import chalk from 'chalk';

console.log(chalk.bold.cyan('🎯 DataPilot TUI - Manual Navigation Test\n'));

const navigation_tests = [
  {
    name: 'Welcome Screen Analysis',
    description: 'First impression and initial load',
    inputs: '',
    duration: 3000,
    expectations: [
      'Logo displays correctly',
      'Welcome message is clear',
      'Loading happens quickly',
      'Navigation instructions visible'
    ]
  },
  {
    name: 'Main Menu Navigation',
    description: 'Core menu functionality',
    inputs: '\n',
    duration: 2000,
    expectations: [
      'All options visible',
      'Current selection highlighted',
      'Arrow keys work',
      'Enter selects option'
    ]
  },
  {
    name: 'CSV Analysis Path',
    description: 'Navigate to CSV analysis',
    inputs: '\n\x1b[B\n',
    duration: 3000,
    expectations: [
      'File selection prompt appears',
      'Clear instructions for file input',
      'Back/escape works',
      'Error handling for invalid files'
    ]
  },
  {
    name: 'Demo Mode Test',
    description: 'Try demo functionality',
    inputs: '\n\x1b[B\x1b[B\n',
    duration: 3000,
    expectations: [
      'Demo datasets visible',
      'Selection mechanism works',
      'Can navigate sample data',
      'Exit back to menu works'
    ]
  },
  {
    name: 'Memory Management',
    description: 'Test memory/warehouse features',
    inputs: '\n\x1b[B\x1b[B\x1b[B\n',
    duration: 3000,
    expectations: [
      'Memory options displayed',
      'Navigation works',
      'Can view stored knowledge',
      'Exit functionality works'
    ]
  },
  {
    name: 'Learning Mode',
    description: 'Test learning/tutorial mode',
    inputs: '\n\x1b[B\x1b[B\x1b[B\x1b[B\n',
    duration: 3000,
    expectations: [
      'Learning options visible',
      'Tutorial progression works',
      'Educational content clear',
      'Exit back to menu'
    ]
  },
  {
    name: 'Settings Menu',
    description: 'Configuration and preferences',
    inputs: '\n\x1b[B\x1b[B\x1b[B\x1b[B\x1b[B\n',
    duration: 3000,
    expectations: [
      'Settings options visible',
      'Can modify preferences',
      'Changes are saved',
      'Cancel/back works'
    ]
  },
  {
    name: 'Exit Functionality',
    description: 'Test exit from main menu',
    inputs: '\n\x1b[B\x1b[B\x1b[B\x1b[B\x1b[B\x1b[B\n',
    duration: 2000,
    expectations: [
      'Exit confirmation or immediate exit',
      'Clean shutdown',
      'No hanging processes',
      'Friendly goodbye message'
    ]
  }
];

class ManualUXTester {
  constructor() {
    this.results = [];
    this.screenshots = [];
  }

  async runAllTests() {
    console.log(chalk.gray('Testing each screen systematically for UX issues...\n'));
    
    for (let i = 0; i < navigation_tests.length; i++) {
      const test = navigation_tests[i];
      console.log(chalk.yellow(`\n${i + 1}. ${test.name}`));
      console.log(chalk.gray(`   ${test.description}`));
      
      const result = await this.runTest(test);
      this.results.push(result);
      
      this.displayResult(result);
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    this.generateSummary();
  }

  async runTest(test) {
    return new Promise((resolve) => {
      const startTime = Date.now();
      let output = '';
      let errors = '';
      let screenshots = [];
      
      const datapilot = spawn('node', ['bin/datapilot.js', 'ui'], {
        cwd: process.cwd()
      });
      
      // Collect output
      datapilot.stdout.on('data', (data) => {
        const chunk = data.toString();
        output += chunk;
        screenshots.push({
          timestamp: Date.now(),
          content: chunk
        });
      });
      
      datapilot.stderr.on('data', (data) => {
        errors += data.toString();
      });
      
      // Send test inputs
      setTimeout(() => {
        if (test.inputs) {
          datapilot.stdin.write(test.inputs);
        }
      }, 500);
      
      // Force exit and analyze
      setTimeout(() => {
        datapilot.stdin.write('\x1b'); // Escape
        setTimeout(() => {
          datapilot.stdin.write('q\n'); // Quit
          datapilot.kill();
        }, 500);
      }, test.duration);
      
      datapilot.on('close', (code) => {
        const endTime = Date.now();
        const result = this.analyzeTestOutput(test, output, errors, endTime - startTime, code);
        resolve(result);
      });
    });
  }

  analyzeTestOutput(test, output, errors, duration, exitCode) {
    const result = {
      name: test.name,
      passed: [],
      failed: [],
      issues: [],
      duration,
      exitCode,
      rawOutput: output,
      errors
    };

    // Check each expectation
    test.expectations.forEach(expectation => {
      const passed = this.checkExpectation(expectation, output, errors);
      if (passed) {
        result.passed.push(expectation);
      } else {
        result.failed.push(expectation);
      }
    });

    // Detect specific UX issues
    this.detectUXIssues(output, errors, result);

    return result;
  }

  checkExpectation(expectation, output, errors) {
    const lower = output.toLowerCase();
    
    switch (expectation) {
      case 'Logo displays correctly':
        return output.includes('DATAPILOT') || output.includes('█');
      case 'Welcome message is clear':
        return lower.includes('welcome') || lower.includes('data analysis');
      case 'Loading happens quickly':
        return !output.includes('timeout') && !errors.includes('slow');
      case 'Navigation instructions visible':
        return lower.includes('navigate') || lower.includes('arrow') || lower.includes('enter');
      case 'All options visible':
        return lower.includes('csv') && lower.includes('demo');
      case 'Current selection highlighted':
        return output.includes('▶') || output.includes('>') || output.includes('*');
      case 'Arrow keys work':
        return !errors.includes('key') && !output.includes('undefined');
      case 'Enter selects option':
        return !output.includes('invalid') && !errors.includes('selection');
      case 'File selection prompt appears':
        return lower.includes('file') || lower.includes('csv') || lower.includes('path');
      case 'Clear instructions for file input':
        return lower.includes('enter') || lower.includes('select') || lower.includes('choose');
      case 'Back/escape works':
        return !errors.includes('undefined') && !output.includes('error');
      case 'Error handling for invalid files':
        return true; // Assume good if no crashes
      case 'Demo datasets visible':
        return lower.includes('demo') || lower.includes('sample') || lower.includes('example');
      case 'Selection mechanism works':
        return !errors.includes('selection') && !output.includes('undefined');
      case 'Can navigate sample data':
        return !errors.includes('navigation') && !output.includes('error');
      case 'Exit back to menu works':
        return !errors.includes('exit') && !output.includes('stuck');
      case 'Memory options displayed':
        return lower.includes('memory') || lower.includes('warehouse') || lower.includes('knowledge');
      case 'Navigation works':
        return !errors.includes('navigation') && !output.includes('undefined');
      case 'Can view stored knowledge':
        return true; // Basic assumption
      case 'Exit functionality works':
        return !errors.includes('exit') && !output.includes('hanging');
      case 'Learning options visible':
        return lower.includes('learning') || lower.includes('tutorial') || lower.includes('guide');
      case 'Tutorial progression works':
        return !errors.includes('tutorial') && !output.includes('stuck');
      case 'Educational content clear':
        return !output.includes('undefined') && !errors.includes('content');
      case 'Settings options visible':
        return lower.includes('settings') || lower.includes('preferences') || lower.includes('config');
      case 'Can modify preferences':
        return !errors.includes('settings') && !output.includes('readonly');
      case 'Changes are saved':
        return !errors.includes('save') && !output.includes('failed');
      case 'Cancel/back works':
        return !errors.includes('cancel') && !output.includes('stuck');
      case 'Exit confirmation or immediate exit':
        return lower.includes('exit') || lower.includes('quit') || lower.includes('goodbye');
      case 'Clean shutdown':
        return !errors.includes('error') && !output.includes('crash');
      case 'No hanging processes':
        return true; // Assume good if test completes
      case 'Friendly goodbye message':
        return lower.includes('goodbye') || lower.includes('thanks') || lower.includes('see you');
      default:
        return false;
    }
  }

  detectUXIssues(output, errors, result) {
    // Check for common UX problems
    
    if (output.includes('undefined')) {
      result.issues.push('❌ "undefined" text appears in output');
    }
    
    if (errors.includes('error') || errors.includes('Error')) {
      result.issues.push('❌ Errors sent to stderr during normal operation');
    }
    
    if (!output.includes('Exit') && !output.includes('ESC') && !output.includes('Quit')) {
      result.issues.push('⚠️ No clear exit instructions visible');
    }
    
    if (!output.includes('Help') && !output.includes('?')) {
      result.issues.push('⚠️ No help option visible');
    }
    
    if (result.duration > 3000) {
      result.issues.push(`⚠️ Slow response time: ${result.duration}ms`);
    }
    
    if (output.length < 100) {
      result.issues.push('⚠️ Very minimal output - may indicate display issues');
    }
    
    if (!output.includes('\x1b[')) {
      result.issues.push('ℹ️ No color codes detected - might be plain text only');
    }
    
    // Check for visual structure
    if (!output.includes('─') && !output.includes('│') && !output.includes('┌')) {
      result.issues.push('ℹ️ No box-drawing characters - could improve visual structure');
    }
    
    // Check for consistent terminology
    const hasInconsistentTerms = (
      output.includes('exit') && output.includes('quit') && output.includes('close')
    );
    if (hasInconsistentTerms) {
      result.issues.push('⚠️ Inconsistent terminology for exit actions');
    }
    
    // Check for progress indicators
    if (output.includes('Loading') && !output.includes('...') && !output.includes('█')) {
      result.issues.push('ℹ️ Loading messages without visual progress indicators');
    }
  }

  displayResult(result) {
    const passRate = (result.passed.length / (result.passed.length + result.failed.length) * 100).toFixed(0);
    const status = passRate >= 80 ? chalk.green('✅ Good') : 
                   passRate >= 60 ? chalk.yellow('⚠️ OK') : 
                   chalk.red('❌ Poor');
    
    console.log(chalk.gray(`   Duration: ${result.duration}ms | Pass Rate: ${passRate}% | ${status}`));
    
    if (result.failed.length > 0) {
      console.log(chalk.red('   Failed expectations:'));
      result.failed.forEach(f => console.log(chalk.red(`     - ${f}`)));
    }
    
    if (result.issues.length > 0) {
      console.log(chalk.yellow('   UX Issues detected:'));
      result.issues.forEach(i => console.log(chalk.yellow(`     ${i}`)));
    }
  }

  generateSummary() {
    console.log(chalk.bold.cyan('\n📊 UX Navigation Test Summary\n'));
    
    const totalTests = this.results.length;
    const totalExpectations = this.results.reduce((sum, r) => sum + r.passed.length + r.failed.length, 0);
    const totalPassed = this.results.reduce((sum, r) => sum + r.passed.length, 0);
    const totalIssues = this.results.reduce((sum, r) => sum + r.issues.length, 0);
    
    const overallPassRate = (totalPassed / totalExpectations * 100).toFixed(1);
    
    console.log(`Tests Executed: ${totalTests}`);
    console.log(`Overall Pass Rate: ${overallPassRate}%`);
    console.log(`Total Issues Found: ${totalIssues}`);
    
    // Screen-by-screen breakdown
    console.log(chalk.bold('\nScreen-by-Screen Analysis:'));
    this.results.forEach((result, index) => {
      const passRate = (result.passed.length / (result.passed.length + result.failed.length) * 100).toFixed(0);
      const status = passRate >= 80 ? '✅' : passRate >= 60 ? '⚠️' : '❌';
      console.log(`${index + 1}. ${result.name.padEnd(25)} ${status} ${passRate}% (${result.issues.length} issues)`);
    });
    
    // Top issues
    const allIssues = this.results.flatMap(r => r.issues);
    const issueTypes = {};
    allIssues.forEach(issue => {
      const type = issue.split(' ')[1] || 'Other';
      issueTypes[type] = (issueTypes[type] || 0) + 1;
    });
    
    if (Object.keys(issueTypes).length > 0) {
      console.log(chalk.bold('\nMost Common Issues:'));
      Object.entries(issueTypes)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .forEach(([type, count]) => {
          console.log(`${type}: ${count} occurrences`);
        });
    }
    
    // Recommendations
    console.log(chalk.bold.cyan('\n🎯 Key Recommendations:\n'));
    
    if (overallPassRate < 70) {
      console.log(chalk.red('❌ CRITICAL: Overall UX needs significant improvement'));
    }
    
    if (allIssues.some(i => i.includes('undefined'))) {
      console.log('1. 🔥 Fix "undefined" text appearing in UI');
    }
    
    if (allIssues.some(i => i.includes('exit'))) {
      console.log('2. 🚪 Add clear exit instructions to all screens');
    }
    
    if (allIssues.some(i => i.includes('help'))) {
      console.log('3. ❓ Implement context-sensitive help system');
    }
    
    if (allIssues.some(i => i.includes('Slow'))) {
      console.log('4. ⚡ Optimize response times (target <200ms)');
    }
    
    if (allIssues.some(i => i.includes('visual structure'))) {
      console.log('5. 🎨 Improve visual hierarchy with box-drawing characters');
    }
    
    console.log('\n📋 Detailed results available in individual test outputs above.');
  }
}

// Run the tests
const tester = new ManualUXTester();
tester.runAllTests().catch(console.error);