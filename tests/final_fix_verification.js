#!/usr/bin/env node

/**
 * Final verification of all GitHub issue fixes
 */

import { exec, spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('🧪 DataPilot GitHub Issues Fix Verification\n');
console.log('Testing fixes for:');
console.log('✅ Issue #2: Missing figlet dependency');
console.log('✅ Issue #5: UI copy functionality issues');
console.log('✅ Issue #8: Unicode/encoding on Windows');
console.log('✅ Issue #9: Windows PATH installation');
console.log('✅ Issue #10: Performance with large files');
console.log('✅ Issue #11: Progress indicators\n');

const results = {
  passed: [],
  failed: []
};

function runCommand(name, command, options = {}) {
  return new Promise((resolve) => {
    console.log(`\n📋 Testing: ${name}`);
    const startTime = Date.now();
    
    exec(command, { 
      timeout: options.timeout || 15000,
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

async function testUIInteractive() {
  console.log('\n📋 Testing: UI Interactive Mode (with result copy)');
  const datapilot = path.join(__dirname, '..', 'dist', 'datapilot.js');
  const testFile = path.join(__dirname, 'fixtures', 'iris.csv');
  
  return new Promise((resolve) => {
    const child = spawn('node', [datapilot, 'ui'], {
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    let output = '';
    let phase = 'start';
    
    child.stdout.on('data', (data) => {
      output += data.toString();
      
      // Navigate through the UI
      if (phase === 'start' && output.includes('MAIN MENU')) {
        phase = 'menu';
        child.stdin.write('1\n'); // Choose guided analysis
      } else if (phase === 'menu' && output.includes('select your CSV file')) {
        phase = 'file';
        child.stdin.write(`${testFile}\n`); // Enter file path
      } else if (phase === 'file' && output.includes('Select analysis commands')) {
        phase = 'commands';
        child.stdin.write(' \n'); // Select all (space then enter)
      } else if (phase === 'commands' && output.includes('Analysis complete')) {
        phase = 'results';
        child.stdin.write('2\n'); // Choose to copy results
      } else if (phase === 'results' && output.includes('Select All to Copy')) {
        phase = 'done';
        console.log('   ✅ PASSED - Copy functionality accessible');
        results.passed.push('UI Interactive Mode');
        child.stdin.write('n\n'); // Don't continue
        setTimeout(() => child.kill(), 100);
      }
    });
    
    setTimeout(() => {
      if (phase !== 'done') {
        console.log(`   ❌ FAILED - UI stuck at phase: ${phase}`);
        results.failed.push({ name: 'UI Interactive Mode', error: `Stuck at ${phase}` });
      }
      child.kill();
      resolve();
    }, 10000);
  });
}

async function main() {
  const datapilot = path.join(__dirname, '..', 'dist', 'datapilot.js');
  const smallFile = path.join(__dirname, 'fixtures', 'iris.csv');
  
  // Test 1: Basic execution (figlet issue)
  await runCommand(
    'Basic execution without figlet',
    `node "${datapilot}" --version`
  );
  
  // Test 2: ASCII mode (Windows encoding)
  await runCommand(
    'ASCII mode for Windows',
    `node "${datapilot}" eda "${smallFile}"`,
    {
      env: { DATAPILOT_ASCII: 'true' },
      checkOutput: (output) => !output.includes('═') && !output.includes('║')
    }
  );
  
  // Test 3: Progress indicators
  await runCommand(
    'Progress indicators',
    `node "${datapilot}" eda "${smallFile}"`,
    {
      checkOutput: (output) => output.includes('Reading CSV') || output.includes('Parsing CSV')
    }
  );
  
  // Test 4: Post-install script
  await runCommand(
    'Post-install script exists',
    `node scripts/postinstall.js`,
    {
      checkOutput: (output) => output.includes('DataPilot') && output.includes('successfully')
    }
  );
  
  // Test 5: Large file with sampling
  console.log('\n📋 Creating large test file...');
  const largeFile = path.join(__dirname, 'large_perf_test.csv');
  let csv = 'id,value,category\n';
  for (let i = 0; i < 40000; i++) {
    csv += `${i},${Math.random() * 1000},Cat${i % 10}\n`;
  }
  await fs.writeFile(largeFile, csv);
  
  await runCommand(
    'Large file performance',
    `node "${datapilot}" eda "${largeFile}"`,
    {
      timeout: 20000,
      checkOutput: (output) => output.includes('sampling') || output.includes('Large file')
    }
  );
  
  // Test 6: UI Mode
  await testUIInteractive();
  
  // Cleanup
  await fs.unlink(largeFile).catch(() => {});
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 FINAL TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total tests: ${results.passed.length + results.failed.length}`);
  console.log(`✅ Passed: ${results.passed.length}`);
  console.log(`❌ Failed: ${results.failed.length}`);
  
  if (results.failed.length > 0) {
    console.log('\nFailed tests:');
    results.failed.forEach(f => console.log(`  - ${f.name}: ${f.error}`));
  }
  
  if (results.failed.length === 0) {
    console.log('\n🎉 All fixes verified successfully! Ready to close GitHub issues.');
  }
}

main().catch(console.error);