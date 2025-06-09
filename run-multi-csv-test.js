#!/usr/bin/env node

/**
 * Run engineering command on multiple CSV files and collect results
 */

const { execSync, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Test datasets
const datasets = [
  'student_habits_performance.csv',
  'taco_sales_(2024-2025).csv',
  'Medicaldataset.csv'
];

const resultsDir = path.join(__dirname, 'engineering-test-results');

// Create results directory
if (!fs.existsSync(resultsDir)) {
  fs.mkdirSync(resultsDir, { recursive: true });
}

console.log('🔧 Multi-CSV Engineering Analysis Test');
console.log('======================================');
console.log(`Results will be saved to: ${resultsDir}`);

async function runEngineeringTest() {
  const results = [];
  
  for (const dataset of datasets) {
    const filePath = path.join(__dirname, 'test-datasets', 'kaggle', dataset);
    
    if (!fs.existsSync(filePath)) {
      console.log(`❌ File not found: ${dataset}`);
      continue;
    }
    
    console.log(`\n📊 Testing: ${dataset}`);
    console.log('-'.repeat(50));
    
    const startTime = Date.now();
    const outputFile = path.join(resultsDir, `${dataset.replace('.csv', '_engineering.json')}`);
    
    try {
      // Run engineering command (output goes to stdout by default)
      const command = [
        'node', 'dist/cli/index.js', 'engineering', 
        filePath,
        '--output', 'json',
        '--verbose'
      ];
      
      console.log(`🚀 Command: ${command.join(' ')}`);
      
      // Use spawn instead of execSync for better argument handling
      const result = await new Promise((resolve, reject) => {
        const child = spawn('node', [
          'dist/cli/index.js', 'engineering',
          filePath,  // Don't quote when using spawn array
          '--output', 'json',
          '--verbose'
        ], {
          cwd: __dirname,
          stdio: 'pipe'
        });
        
        let stdout = '';
        let stderr = '';
        
        child.stdout.on('data', (data) => {
          stdout += data.toString();
        });
        
        child.stderr.on('data', (data) => {
          stderr += data.toString();
        });
        
        child.on('close', (code) => {
          if (code === 0) {
            resolve(stdout);
          } else {
            const error = new Error(`Process exited with code ${code}`);
            error.stderr = stderr;
            error.stdout = stdout;
            reject(error);
          }
        });
        
        child.on('error', (error) => {
          reject(error);
        });
      });
      
      const duration = Date.now() - startTime;
      
      console.log(`✅ Completed in ${duration}ms`);
      
      // Save output to file if we got any
      let outputFile = '';
      if (result && result.trim()) {
        outputFile = path.join(resultsDir, `${dataset.replace('.csv', '_engineering.json')}`);
        fs.writeFileSync(outputFile, result);
        console.log(`📁 Output saved to: ${path.basename(outputFile)}`);
        
        // Show console output preview
        console.log(`📄 Console output preview:`);
        const lines = result.split('\n').slice(0, 3);
        lines.forEach(line => {
          if (line.trim()) {
            console.log(`   ${line.substring(0, 80)}${line.length > 80 ? '...' : ''}`);
          }
        });
      } else {
        console.log(`⚠️ No output received from command`);
      }
      
      results.push({
        dataset,
        success: true,
        duration,
        outputFile: outputFile ? path.basename(outputFile) : '',
        hasConsoleOutput: !!(result && result.trim()),
        outputSize: result ? result.length : 0
      });
      
    } catch (error) {
      const duration = Date.now() - startTime;
      console.log(`❌ Failed in ${duration}ms`);
      console.log(`Error: ${error.message}`);
      
      // Show stderr if available
      if (error.stderr) {
        console.log(`Stderr: ${error.stderr.substring(0, 200)}`);
      }
      
      // Show stdout if available
      if (error.stdout) {
        console.log(`Stdout: ${error.stdout.substring(0, 200)}`);
      }
      
      results.push({
        dataset,
        success: false,
        duration,
        error: error.message,
        outputFile: '',
        outputSize: 0
      });
    }
  }
  
  // Summary
  console.log('\n📈 SUMMARY REPORT');
  console.log('==================');
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`Total files tested: ${results.length}`);
  console.log(`Successful: ${successful.length}`);
  console.log(`Failed: ${failed.length}`);
  
  if (successful.length > 0) {
    const avgTime = successful.reduce((sum, r) => sum + r.duration, 0) / successful.length;
    console.log(`Average processing time: ${Math.round(avgTime)}ms`);
    
    console.log('\n✅ Successful analyses:');
    successful.forEach(r => {
      console.log(`  - ${r.dataset}: ${r.duration}ms, ${r.outputSize} chars, ${r.outputFile || 'no file saved'}`);
    });
  }
  
  if (failed.length > 0) {
    console.log('\n❌ Failed analyses:');
    failed.forEach(r => {
      console.log(`  - ${r.dataset}: ${r.error}`);
    });
  }
  
  // Check all output files
  console.log('\n📁 All output files in results directory:');
  const allFiles = fs.readdirSync(resultsDir);
  if (allFiles.length > 0) {
    allFiles.forEach(file => {
      const stats = fs.statSync(path.join(resultsDir, file));
      console.log(`  - ${file} (${stats.size} bytes, ${stats.mtime.toLocaleString()})`);
    });
  } else {
    console.log('  (No files found)');
  }
  
  return results;
}

// Main execution
runEngineeringTest()
  .then(() => {
    console.log('\n🎯 Multi-CSV engineering test completed!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  });