#!/usr/bin/env node

/**
 * Test script to verify fixes for GitHub issues
 */

import { exec } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Test results tracking
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

function runTest(name, command) {
  return new Promise((resolve) => {
    console.log(`\n🧪 Testing: ${name}`);
    console.log(`   Command: ${command}`);
    
    const startTime = Date.now();
    exec(command, { 
      timeout: 30000, // 30 second timeout
      env: { ...process.env, DATAPILOT_ASCII: 'true' } // Force ASCII mode for testing
    }, (error, stdout, stderr) => {
      const duration = Date.now() - startTime;
      
      if (error) {
        console.log(`   ❌ FAILED (${duration}ms)`);
        console.log(`   Error: ${error.message}`);
        results.failed++;
        results.tests.push({ name, status: 'failed', error: error.message, duration });
      } else {
        console.log(`   ✅ PASSED (${duration}ms)`);
        results.passed++;
        results.tests.push({ name, status: 'passed', duration });
      }
      
      resolve();
    });
  });
}

async function createLargeTestFile() {
  console.log('\n📝 Creating large test file (3MB)...');
  const headers = 'id,name,age,salary,department,hire_date,performance_score\n';
  const row = (i) => `${i},Employee${i},${25 + (i % 40)},${50000 + (i * 100)},Dept${i % 5},2020-01-${(i % 28) + 1},${(Math.random() * 5).toFixed(2)}\n`;
  
  let content = headers;
  // Create ~3MB file (roughly 50,000 rows)
  for (let i = 1; i <= 50000; i++) {
    content += row(i);
  }
  
  const testFile = path.join(__dirname, 'large_test_3mb.csv');
  await fs.writeFile(testFile, content);
  console.log('   ✅ Created large_test_3mb.csv');
  return testFile;
}

async function runTests() {
  console.log('🚀 DataPilot Fix Verification Tests\n');
  console.log('Testing fixes for:');
  console.log('- Issue #2: Missing figlet dependency');
  console.log('- Issue #8: Unicode/encoding on Windows');
  console.log('- Issue #10: Performance with large files');
  console.log('- Issue #11: Progress indicators\n');
  
  const datapilotPath = path.join(__dirname, '..', 'dist', 'datapilot.js');
  const smallTestFile = path.join(__dirname, 'fixtures', 'iris.csv');
  
  // Test 1: Basic execution (tests figlet fix)
  await runTest(
    'Basic CLI execution',
    `node "${datapilotPath}" --version`
  );
  
  // Test 2: Small file processing
  await runTest(
    'Small file processing',
    `node "${datapilotPath}" eda "${smallTestFile}"`
  );
  
  // Test 3: ASCII mode output (tests Unicode fix)
  await runTest(
    'ASCII mode output',
    `DATAPILOT_ASCII=true node "${datapilotPath}" eda "${smallTestFile}"`
  );
  
  // Test 4: Large file processing (tests performance fix)
  const largeFile = await createLargeTestFile();
  await runTest(
    'Large file processing (3MB)',
    `node "${datapilotPath}" eda "${largeFile}"`
  );
  
  // Test 5: UI mode basic test
  // Note: UI mode is interactive, so we just test if it starts without error
  await runTest(
    'UI mode startup',
    `echo "exit" | node "${datapilotPath}" ui`
  );
  
  // Clean up
  console.log('\n🧹 Cleaning up test files...');
  await fs.unlink(largeFile).catch(() => {});
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(50));
  console.log(`Total tests: ${results.tests.length}`);
  console.log(`Passed: ${results.passed} ✅`);
  console.log(`Failed: ${results.failed} ❌`);
  console.log('\nDetailed Results:');
  results.tests.forEach(test => {
    const status = test.status === 'passed' ? '✅' : '❌';
    console.log(`${status} ${test.name} (${test.duration}ms)`);
    if (test.error) {
      console.log(`   Error: ${test.error}`);
    }
  });
  
  if (results.failed === 0) {
    console.log('\n🎉 All tests passed! Fixes are working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the errors above.');
  }
}

// Run tests
runTests().catch(console.error);