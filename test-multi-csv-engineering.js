#!/usr/bin/env node

/**
 * Test script for DataPilot engineering command with multiple CSV files
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Test datasets to analyze
const testDatasets = [
  'student_habits_performance.csv',
  'taco_sales_(2024-2025).csv', 
  'Medicaldataset.csv',
  'London_Air_Quality.csv'
];

const datasetPath = path.join(__dirname, 'test-datasets', 'kaggle');
const outputDir = path.join(__dirname, 'multi-csv-engineering-results');

// Create output directory
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

console.log('🔧 DataPilot Multi-CSV Engineering Analysis Test');
console.log('=' .repeat(60));

async function runEngineeringAnalysis() {
  const results = [];
  
  for (const dataset of testDatasets) {
    const filePath = path.join(datasetPath, dataset);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.log(`❌ File not found: ${dataset}`);
      continue;
    }
    
    console.log(`\n📊 Analyzing: ${dataset}`);
    console.log('-'.repeat(40));
    
    const startTime = Date.now();
    
    try {
      // Run DataPilot engineering command
      const command = `node dist/index.js engineering "${filePath}" --output json --output-dir "${outputDir}"`;
      
      console.log(`🚀 Running: ${command}`);
      
      const output = execSync(command, {
        cwd: __dirname,
        encoding: 'utf8',
        timeout: 120000, // 2 minute timeout
        stdio: 'pipe'
      });
      
      const duration = Date.now() - startTime;
      
      console.log(`✅ Completed in ${duration}ms`);
      console.log(`📄 Output preview:`);
      
      // Show first few lines of output
      const lines = output.split('\n').slice(0, 10);
      lines.forEach(line => {
        if (line.trim()) {
          console.log(`   ${line}`);
        }
      });
      
      if (output.split('\n').length > 10) {
        console.log(`   ... (${output.split('\n').length - 10} more lines)`);
      }
      
      results.push({
        dataset,
        success: true,
        duration,
        outputLength: output.length
      });
      
    } catch (error) {
      const duration = Date.now() - startTime;
      console.log(`❌ Failed in ${duration}ms`);
      console.log(`Error: ${error.message}`);
      
      results.push({
        dataset,
        success: false,
        duration,
        error: error.message
      });
    }
  }
  
  // Summary report
  console.log('\n📈 SUMMARY REPORT');
  console.log('=' .repeat(60));
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`Total datasets: ${results.length}`);
  console.log(`Successful: ${successful.length}`);
  console.log(`Failed: ${failed.length}`);
  
  if (successful.length > 0) {
    const avgDuration = successful.reduce((sum, r) => sum + r.duration, 0) / successful.length;
    console.log(`Average processing time: ${Math.round(avgDuration)}ms`);
    
    console.log('\n✅ Successful analyses:');
    successful.forEach(result => {
      console.log(`  - ${result.dataset}: ${result.duration}ms (${result.outputLength} chars)`);
    });
  }
  
  if (failed.length > 0) {
    console.log('\n❌ Failed analyses:');
    failed.forEach(result => {
      console.log(`  - ${result.dataset}: ${result.error}`);
    });
  }
  
  // Check output files
  console.log(`\n📁 Output files created in: ${outputDir}`);
  const outputFiles = fs.readdirSync(outputDir);
  outputFiles.forEach(file => {
    const stat = fs.statSync(path.join(outputDir, file));
    console.log(`  - ${file} (${stat.size} bytes)`);
  });
  
  console.log('\n🎯 Test completed!');
  
  return results;
}

// Main execution
async function main() {
  try {
    // First, build the project
    console.log('🔨 Building DataPilot...');
    execSync('npm run build', { cwd: __dirname, stdio: 'inherit' });
    console.log('✅ Build completed\n');
    
    // Run the engineering analysis tests
    await runEngineeringAnalysis();
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { runEngineeringAnalysis };