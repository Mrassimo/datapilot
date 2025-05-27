#!/usr/bin/env node

import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test configuration
const config = {
  datapilotPath: path.join(__dirname, '..', 'bin', 'datapilot.js'),
  benchmarkDataPath: path.join(__dirname, 'benchmark_data'),
  timeoutMs: 30000, // 30 seconds max per test
  commands: ['llm', 'eng', 'eda']
};

// Test datasets
const testDatasets = [
  { name: 'tiny_test.csv', expectedSize: 'Small (< 1K rows)', maxTime: 2000 },
  { name: 'small_test.csv', expectedSize: 'Small (< 5K rows)', maxTime: 3000 },
  { name: 'medium_test.csv', expectedSize: 'Medium (< 15K rows)', maxTime: 5000 },
  { name: 'large_test.csv', expectedSize: 'Large (100K rows)', maxTime: 10000 },
];

// Performance results
const results = [];

// Helper to run command and measure performance
function runCommand(command, filePath) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    let output = '';
    let error = '';
    
    const proc = spawn(process.execPath, [config.datapilotPath, command, filePath], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, NODE_OPTIONS: '--max-old-space-size=4096' }
    });
    
    proc.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    proc.stderr.on('data', (data) => {
      error += data.toString();
    });
    
    proc.on('close', (code) => {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      resolve({
        success: code === 0,
        duration,
        output,
        error,
        memoryUsage: output.includes('sampling') || output.includes('Large dataset')
      });
    });
    
    proc.on('error', (err) => {
      reject(err);
    });
    
    // Timeout handling
    setTimeout(() => {
      proc.kill('SIGTERM');
      reject(new Error(`Command timed out after ${config.timeoutMs}ms`));
    }, config.timeoutMs);
  });
}

// Helper to format duration
function formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

// Helper to get file size
async function getFileSize(filePath) {
  try {
    const stats = await fs.stat(filePath);
    const sizeInMB = stats.size / (1024 * 1024);
    return sizeInMB.toFixed(2);
  } catch (err) {
    return 'Unknown';
  }
}

// Helper to count rows in CSV
async function getRowCount(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    const lines = content.split('\n').filter(line => line.trim().length > 0);
    return lines.length - 1; // Subtract header
  } catch (err) {
    return 'Unknown';
  }
}

// Main performance test runner
async function runPerformanceTests() {
  console.log('🚀 DataPilot Performance Test Suite\n');
  console.log('Testing large dataset handling and sampling optimizations...\n');
  
  for (const dataset of testDatasets) {
    const filePath = path.join(config.benchmarkDataPath, dataset.name);
    
    try {
      await fs.access(filePath);
    } catch (err) {
      console.log(`⚠️  Skipping ${dataset.name} - file not found`);
      continue;
    }
    
    const fileSize = await getFileSize(filePath);
    const rowCount = await getRowCount(filePath);
    
    console.log(`\n📊 Testing: ${dataset.name}`);
    console.log(`   Size: ${fileSize}MB, Rows: ${rowCount.toLocaleString()}`);
    console.log(`   Expected: ${dataset.expectedSize}\n`);
    
    for (const command of config.commands) {
      console.log(`   Testing ${command} command...`);
      
      try {
        const result = await runCommand(command, filePath);
        
        const status = result.success ? '✅' : '❌';
        const timeStatus = result.duration <= dataset.maxTime ? '🚀' : '⚠️';
        const samplingStatus = result.memoryUsage ? '📊' : '💾';
        
        console.log(`   ${status} ${command}: ${formatDuration(result.duration)} ${timeStatus} ${samplingStatus}`);
        
        results.push({
          dataset: dataset.name,
          command,
          success: result.success,
          duration: result.duration,
          withinExpected: result.duration <= dataset.maxTime,
          usedSampling: result.memoryUsage,
          fileSize,
          rowCount
        });
        
      } catch (err) {
        console.log(`   ❌ ${command}: FAILED - ${err.message}`);
        
        results.push({
          dataset: dataset.name,
          command,
          success: false,
          duration: config.timeoutMs,
          withinExpected: false,
          usedSampling: false,
          error: err.message,
          fileSize,
          rowCount
        });
      }
    }
  }
  
  // Generate performance report
  console.log('\n\n📋 PERFORMANCE TEST RESULTS\n');
  console.log('┌─────────────────┬─────────┬──────────┬────────────┬──────────┬──────────┐');
  console.log('│ Dataset         │ Command │ Duration │ Status     │ Sampling │ Within   │');
  console.log('│                 │         │          │            │          │ Expected │');
  console.log('├─────────────────┼─────────┼──────────┼────────────┼──────────┼──────────┤');
  
  results.forEach(result => {
    const dataset = result.dataset.padEnd(15);
    const command = result.command.padEnd(7);
    const duration = formatDuration(result.duration).padEnd(8);
    const status = (result.success ? 'PASS' : 'FAIL').padEnd(10);
    const sampling = (result.usedSampling ? 'YES' : 'NO').padEnd(8);
    const withinExpected = (result.withinExpected ? 'YES' : 'NO').padEnd(8);
    
    console.log(`│ ${dataset} │ ${command} │ ${duration} │ ${status} │ ${sampling} │ ${withinExpected} │`);
  });
  
  console.log('└─────────────────┴─────────┴──────────┴────────────┴──────────┴──────────┘');
  
  // Summary statistics
  const totalTests = results.length;
  const passedTests = results.filter(r => r.success).length;
  const withinExpectedTests = results.filter(r => r.withinExpected).length;
  const usedSamplingTests = results.filter(r => r.usedSampling).length;
  
  console.log(`\n📊 Summary:`);
  console.log(`   Total Tests: ${totalTests}`);
  console.log(`   Passed: ${passedTests}/${totalTests} (${((passedTests/totalTests)*100).toFixed(1)}%)`);
  console.log(`   Within Expected Time: ${withinExpectedTests}/${totalTests} (${((withinExpectedTests/totalTests)*100).toFixed(1)}%)`);
  console.log(`   Used Smart Sampling: ${usedSamplingTests}/${totalTests} (${((usedSamplingTests/totalTests)*100).toFixed(1)}%)`);
  
  // Performance improvements analysis
  const largeDatasetResults = results.filter(r => r.dataset === 'large_test.csv' && r.success);
  if (largeDatasetResults.length > 0) {
    const avgDuration = largeDatasetResults.reduce((sum, r) => sum + r.duration, 0) / largeDatasetResults.length;
    console.log(`\n🚀 Large Dataset Performance (100K rows):`);
    console.log(`   Average Duration: ${formatDuration(avgDuration)}`);
    console.log(`   All commands completed successfully: ${largeDatasetResults.length === config.commands.length ? 'YES' : 'NO'}`);
  }
  
  // Save results to file
  const reportPath = path.join(__dirname, 'performance_test_results.json');
  await fs.writeFile(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    summary: {
      totalTests,
      passedTests,
      withinExpectedTests,
      usedSamplingTests,
      successRate: (passedTests/totalTests)*100,
      performanceRate: (withinExpectedTests/totalTests)*100
    },
    results
  }, null, 2));
  
  console.log(`\n📄 Detailed results saved to: ${reportPath}`);
  
  // Exit with appropriate code
  const allPassed = passedTests === totalTests;
  const performanceGood = withinExpectedTests >= totalTests * 0.8; // 80% threshold
  
  if (allPassed && performanceGood) {
    console.log('\n✅ All performance tests passed!');
    process.exit(0);
  } else {
    console.log('\n❌ Some performance tests failed or were slow.');
    process.exit(1);
  }
}

// Run the tests
runPerformanceTests().catch(err => {
  console.error('Performance test suite failed:', err);
  process.exit(1);
});