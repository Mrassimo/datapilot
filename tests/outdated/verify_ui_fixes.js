#!/usr/bin/env node

/**
 * Quick verification script for critical UI fixes
 */

import { spawn } from 'child_process';
import chalk from 'chalk';

console.log(chalk.bold.cyan('\n🔍 DataPilot UI Fix Verification\n'));

const tests = [
  {
    name: 'Escape Key Handling',
    description: 'Press ESC multiple times - should not crash',
    input: '\x1b\x1b\x1b\x1bq\n',
    expectedNotToContain: ['undefined', 'Fatal error', 'TypeError']
  },
  {
    name: 'No Artificial Delays',
    description: 'UI should start immediately',
    input: 'q\n',
    maxDuration: 1000 // Should complete in under 1 second
  },
  {
    name: 'Stderr Usage Fixed',
    description: 'Status messages should go to stdout',
    input: 'q\n',
    checkStderr: true
  }
];

async function runTest(test) {
  console.log(chalk.yellow(`\n📋 Test: ${test.name}`));
  console.log(chalk.gray(`   ${test.description}`));
  
  return new Promise((resolve) => {
    const startTime = Date.now();
    const datapilot = spawn('node', ['bin/datapilot.js', 'ui'], {
      cwd: process.cwd()
    });
    
    let stdout = '';
    let stderr = '';
    let timedOut = false;
    
    datapilot.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    datapilot.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    // Send test input
    setTimeout(() => {
      datapilot.stdin.write(test.input);
    }, 100);
    
    // Timeout handler
    const timeout = setTimeout(() => {
      timedOut = true;
      datapilot.kill();
    }, test.maxDuration || 5000);
    
    datapilot.on('close', (code) => {
      clearTimeout(timeout);
      const duration = Date.now() - startTime;
      
      let passed = true;
      const issues = [];
      
      // Check for unexpected content
      if (test.expectedNotToContain) {
        for (const pattern of test.expectedNotToContain) {
          if (stdout.includes(pattern) || stderr.includes(pattern)) {
            passed = false;
            issues.push(`Found "${pattern}" in output`);
          }
        }
      }
      
      // Check duration
      if (test.maxDuration && duration > test.maxDuration) {
        passed = false;
        issues.push(`Took ${duration}ms (max: ${test.maxDuration}ms)`);
      }
      
      // Check stderr
      if (test.checkStderr && stderr.includes('Initializing') || stderr.includes('Ready')) {
        passed = false;
        issues.push('Status messages still going to stderr');
      }
      
      // Check for crashes
      if (code !== 0 && !timedOut) {
        passed = false;
        issues.push(`Exit code: ${code}`);
      }
      
      // Report results
      if (passed) {
        console.log(chalk.green(`   ✅ PASSED (${duration}ms)`));
      } else {
        console.log(chalk.red(`   ❌ FAILED`));
        issues.forEach(issue => console.log(chalk.red(`      - ${issue}`)));
      }
      
      resolve({ test: test.name, passed, issues });
    });
  });
}

async function main() {
  const results = [];
  
  for (const test of tests) {
    const result = await runTest(test);
    results.push(result);
  }
  
  // Summary
  console.log(chalk.bold.cyan('\n📊 Summary\n'));
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  
  console.log(chalk.green(`✅ Passed: ${passed}/${tests.length}`));
  if (failed > 0) {
    console.log(chalk.red(`❌ Failed: ${failed}/${tests.length}`));
  }
  
  // Next steps
  console.log(chalk.cyan('\n🎯 Next Steps:\n'));
  if (failed === 0) {
    console.log('1. ✅ Critical fixes verified!');
    console.log('2. Run full test suite: npm run test:ui');
    console.log('3. Continue with remaining fixes from the plan');
  } else {
    console.log('1. ❌ Some fixes need more work');
    console.log('2. Check the failed tests above');
    console.log('3. Review the implementation');
  }
}

main().catch(console.error);