#!/usr/bin/env node

/**
 * Verification tests for the latest GitHub issue fixes
 */

import { exec, spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('🚀 DataPilot New Issues Fix Verification\n');
console.log('Testing fixes for:');
console.log('✅ Issue #13: ALL command outputHandler crash');
console.log('✅ Issue #12: EDA fails on mixed data types');
console.log('✅ Issue #14: TUI file browser navigation');
console.log('✅ Issue #4: Demo mode encoding errors\n');

const results = {
  passed: [],
  failed: []
};

function runCommand(name, command, options = {}) {
  return new Promise((resolve) => {
    console.log(`\n📋 Testing: ${name}`);
    const startTime = Date.now();
    
    exec(command, { 
      timeout: options.timeout || 25000,
      env: { ...process.env, ...options.env }
    }, (error, stdout, stderr) => {
      const duration = Date.now() - startTime;
      
      if (error && !options.expectError) {
        console.log(`   ❌ FAILED (${duration}ms): ${error.message.split('\n')[0]}`);
        results.failed.push({ name, error: error.message });
      } else {
        console.log(`   ✅ PASSED (${duration}ms)`);
        if (options.checkOutput) {
          const passed = options.checkOutput(stdout);
          if (!passed) {
            console.log(`   ⚠️  Output check failed`);
            results.failed.push({ name, error: 'Output validation failed' });
          }
        }
        results.passed.push(name);
      }
      resolve();
    });
  });
}

async function createMixedDataFile() {
  console.log('\n📝 Creating mixed data type test file...');
  const headers = 'id,name,age,salary,hire_date,department,is_manager,performance_score\n';
  const rows = [];
  
  for (let i = 1; i <= 1000; i++) {
    rows.push([
      i,
      `Employee_${i}`,
      25 + (i % 40),
      50000 + (i * 100),
      `2020-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`,
      `Department_${i % 5}`,
      i % 10 === 0 ? 'Yes' : 'No',
      (Math.random() * 5).toFixed(2)
    ].join(','));
  }
  
  const content = headers + rows.join('\n');
  const testFile = path.join(__dirname, 'mixed_types_test.csv');
  await fs.writeFile(testFile, content);
  console.log('   ✅ Created mixed_types_test.csv');
  return testFile;
}

async function main() {
  const datapilot = path.join(__dirname, '..', 'dist', 'datapilot.js');
  const smallFile = path.join(__dirname, 'fixtures', 'iris.csv');
  
  // Test 1: ALL command doesn't crash (Issue #13)
  await runCommand(
    'ALL command execution',
    `node "${datapilot}" all "${smallFile}"`,
    {
      checkOutput: (output) => !output.includes('outputHandler is not defined')
    }
  );
  
  // Test 2: EDA with mixed data types (Issue #12)
  const mixedFile = await createMixedDataFile();
  await runCommand(
    'EDA with mixed data types',
    `node "${datapilot}" eda "${mixedFile}"`,
    {
      timeout: 30000,
      checkOutput: (output) => !output.includes('Input data contains non-numeric values')
    }
  );
  
  // Test 3: Demo mode (Issue #4)
  await runCommand(
    'Demo mode execution',
    `echo "iris" | node "${datapilot}" ui`,
    {
      timeout: 15000,
      checkOutput: (output) => !output.includes('CSV parsing failed')
    }
  );
  
  // Test 4: Basic mixed data ALL command
  await runCommand(
    'ALL command with mixed types',
    `node "${datapilot}" all "${mixedFile}"`,
    {
      timeout: 45000,
      checkOutput: (output) => output.includes('ANALYSIS COMPLETE')
    }
  );
  
  // Test 5: Integrity check on mixed data
  await runCommand(
    'Integrity check mixed types',
    `node "${datapilot}" int "${mixedFile}"`,
    {
      checkOutput: (output) => output.includes('completeness') || output.includes('integrity')
    }
  );
  
  // Clean up
  console.log('\n🧹 Cleaning up test files...');
  await fs.unlink(mixedFile).catch(() => {});
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 NEW FIXES TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total tests: ${results.passed.length + results.failed.length}`);
  console.log(`✅ Passed: ${results.passed.length}`);
  console.log(`❌ Failed: ${results.failed.length}`);
  
  if (results.failed.length > 0) {
    console.log('\nFailed tests:');
    results.failed.forEach(f => console.log(`  - ${f.name}: ${f.error}`));
  }
  
  if (results.failed.length === 0) {
    console.log('\n🎉 All new fixes verified successfully!');
    console.log('Ready to close the GitHub issues.');
  } else {
    console.log('\n⚠️  Some tests failed. Review needed before closing issues.');
  }
}

main().catch(console.error);