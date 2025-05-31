#!/usr/bin/env node

/**
 * Quick UX Assessment - Fast evaluation of DataPilot TUI
 */

import { spawn } from 'child_process';
import chalk from 'chalk';

console.log(chalk.bold.cyan('⚡ DataPilot TUI - Quick UX Assessment\n'));

async function quickTest(testName, inputs, timeout = 5000) {
  console.log(chalk.yellow(`Testing: ${testName}`));
  
  return new Promise((resolve) => {
    const startTime = Date.now();
    let output = '';
    let errors = '';
    
    const datapilot = spawn('node', ['bin/datapilot.js', 'ui'], {
      cwd: process.cwd(),
      timeout: timeout
    });
    
    datapilot.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    datapilot.stderr.on('data', (data) => {
      errors += data.toString();
    });
    
    // Send inputs after a short delay
    setTimeout(() => {
      if (inputs) {
        datapilot.stdin.write(inputs);
      }
      // Force quit after processing
      setTimeout(() => {
        datapilot.stdin.write('\x03'); // Ctrl+C
        datapilot.kill('SIGTERM');
      }, 2000);
    }, 1000);
    
    datapilot.on('close', (code) => {
      const duration = Date.now() - startTime;
      resolve({ testName, output, errors, duration, exitCode: code });
    });
    
    // Timeout handler
    setTimeout(() => {
      datapilot.kill('SIGKILL');
      resolve({ 
        testName, 
        output: output || 'NO OUTPUT', 
        errors: errors || 'TIMEOUT', 
        duration: timeout, 
        exitCode: -1 
      });
    }, timeout);
  });
}

async function analyzeResults() {
  const tests = [
    { name: 'Initial Load', inputs: '', timeout: 3000 },
    { name: 'Main Menu', inputs: '\n', timeout: 3000 },
    { name: 'Escape Handling', inputs: '\n\x1b\x1b\x1b', timeout: 3000 },
  ];
  
  const results = [];
  
  for (const test of tests) {
    const result = await quickTest(test.name, test.inputs, test.timeout);
    results.push(result);
    
    // Quick analysis
    const issues = [];
    const positives = [];
    
    if (result.output.includes('undefined')) issues.push('❌ "undefined" in output');
    if (result.errors.includes('error')) issues.push('❌ Errors to stderr');
    if (result.duration >= test.timeout) issues.push('❌ Timeout/hanging');
    if (result.exitCode !== 0 && result.exitCode !== -1) issues.push('❌ Non-zero exit');
    
    if (result.output.includes('DATAPILOT')) positives.push('✅ Logo displays');
    if (result.output.includes('\x1b[')) positives.push('✅ Color support');
    if (result.output.includes('Welcome')) positives.push('✅ Welcome message');
    if (result.output.includes('Navigate')) positives.push('✅ Instructions');
    
    const status = issues.length === 0 ? chalk.green('✅ GOOD') : 
                   issues.length <= 2 ? chalk.yellow('⚠️ OK') : 
                   chalk.red('❌ POOR');
    
    console.log(`  ${status} (${result.duration}ms) - ${positives.length} positives, ${issues.length} issues`);
    
    if (issues.length > 0) {
      issues.forEach(issue => console.log(`    ${issue}`));
    }
  }
  
  // Generate quick assessment
  console.log(chalk.bold.cyan('\n📊 Quick UX Assessment Results\n'));
  
  const totalIssues = results.reduce((sum, r) => {
    const issues = [];
    if (r.output.includes('undefined')) issues.push('undefined');
    if (r.errors.includes('error')) issues.push('stderr');
    if (r.duration >= 3000) issues.push('timeout');
    return sum + issues.length;
  }, 0);
  
  const hasLogo = results.some(r => r.output.includes('DATAPILOT'));
  const hasColors = results.some(r => r.output.includes('\x1b['));
  const hasInstructions = results.some(r => r.output.includes('Navigate') || r.output.includes('arrow'));
  
  console.log(`Overall Issues: ${totalIssues}`);
  console.log(`Logo Display: ${hasLogo ? '✅' : '❌'}`);
  console.log(`Color Support: ${hasColors ? '✅' : '❌'}`);
  console.log(`Navigation Instructions: ${hasInstructions ? '✅' : '❌'}`);
  
  // Sample output for analysis
  console.log(chalk.bold('\n📝 Sample Output Analysis:'));
  const sampleOutput = results[0]?.output || 'No output captured';
  console.log(chalk.gray('First 500 characters of output:'));
  console.log(chalk.gray(sampleOutput.substring(0, 500).replace(/\x1b\[[0-9;]*m/g, '[COLOR]')));
  
  // Critical issues summary
  console.log(chalk.bold.red('\n🚨 Critical Issues Detected:'));
  
  const criticalIssues = [];
  if (results.some(r => r.output.includes('undefined'))) {
    criticalIssues.push('1. "undefined" text appears in UI - indicates JavaScript errors');
  }
  if (results.some(r => r.duration >= 3000)) {
    criticalIssues.push('2. UI hangs or extremely slow response times');
  }
  if (results.some(r => r.errors.includes('Error'))) {
    criticalIssues.push('3. JavaScript errors sent to stderr during normal operation');
  }
  if (!hasInstructions) {
    criticalIssues.push('4. No clear navigation instructions visible to users');
  }
  
  if (criticalIssues.length === 0) {
    console.log(chalk.green('✅ No critical issues detected in quick test'));
  } else {
    criticalIssues.forEach(issue => console.log(chalk.red(issue)));
  }
  
  console.log(chalk.bold.cyan('\n🎯 Immediate Actions Needed:\n'));
  console.log('1. Fix any "undefined" text in the interface');
  console.log('2. Ensure responsive UI (< 200ms for all actions)');  
  console.log('3. Add clear exit/help instructions on every screen');
  console.log('4. Test escape key handling thoroughly');
  console.log('5. Implement proper error boundaries');
  
  return results;
}

analyzeResults().catch(console.error);