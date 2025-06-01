#!/usr/bin/env node

/**
 * Comprehensive Parser Bug Detection Test
 * This test should have caught the issues we just found
 */

import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { readdirSync } from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function runParserTests() {
  console.log('🧪 Comprehensive Parser Bug Detection Tests\n');
  
  const datapilot = path.join(__dirname, '..', 'dist', 'datapilot.js');
  const fixturesDir = path.join(__dirname, 'fixtures');
  
  // Get all CSV files in fixtures
  const csvFiles = readdirSync(fixturesDir)
    .filter(file => file.endsWith('.csv'))
    .slice(0, 5); // Test first 5 files
  
  console.log(`Found ${csvFiles.length} CSV files to test:\n`);
  csvFiles.forEach((file, i) => console.log(`${i+1}. ${file}`));
  
  let testCount = 0;
  let passCount = 0;
  let failCount = 0;
  const errors = [];

  function testFile(fileName) {
    return new Promise((resolve) => {
      testCount++;
      const filePath = path.join(fixturesDir, fileName);
      const command = `node "${datapilot}" eda "${filePath}"`;
      
      console.log(`\n📋 Testing: ${fileName}`);
      
      exec(command, { timeout: 15000 }, (error, stdout, stderr) => {
        const hasSpinnerError = stdout.includes('spinner.error is not a function') || 
                               stderr.includes('spinner.error is not a function');
        const hasParserError = stdout.includes('Invalid column definition') ||
                              stderr.includes('Invalid column definition');
        const hasNoDataError = stdout.includes('No data found in CSV file');
        const hasSuccess = stdout.includes('✔ Comprehensive EDA analysis complete!') || 
                          stdout.includes('Processed') || 
                          stdout.includes('Successfully parsed');
        
        if (hasSpinnerError) {
          console.log('   ❌ SPINNER BUG: spinner.error is not a function');
          errors.push(`${fileName}: spinner.error bug`);
          failCount++;
        } else if (hasParserError) {
          console.log('   ❌ PARSER BUG: Invalid column definition');
          errors.push(`${fileName}: parser configuration bug`);
          failCount++;
        } else if (hasNoDataError) {
          console.log('   ⚠️  NO DATA: File parsing failed completely');
          errors.push(`${fileName}: no data parsed`);
          failCount++;
        } else if (hasSuccess) {
          console.log('   ✅ PASSED: Analysis completed successfully');
          passCount++;
        } else if (error) {
          console.log(`   ❌ ERROR: ${error.message.split('\\n')[0]}`);
          errors.push(`${fileName}: ${error.message.split('\\n')[0]}`);
          failCount++;
        } else {
          console.log('   ⚠️  UNKNOWN: Unexpected output pattern');
          failCount++;
        }
        
        resolve();
      });
    });
  }

  // Test all files sequentially
  return csvFiles.reduce((promise, fileName) => {
    return promise.then(() => testFile(fileName));
  }, Promise.resolve()).then(() => {
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 PARSER BUG DETECTION SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total files tested: ${testCount}`);
    console.log(`✅ Passed: ${passCount}`);
    console.log(`❌ Failed: ${failCount}`);
    
    if (errors.length > 0) {
      console.log('\\n🐛 Issues Found:');
      errors.forEach((error, i) => {
        console.log(`${i+1}. ${error}`);
      });
      
      console.log('\\n💡 These issues should be fixed and this test should pass!');
    } else {
      console.log('\\n🎉 No parser bugs detected! All files processed successfully.');
    }
    
    // Analysis of test quality
    const bugDetectionRate = (failCount / testCount) * 100;
    console.log(`\\n📈 Test Quality Assessment:`);
    console.log(`- Bug detection rate: ${bugDetectionRate.toFixed(1)}%`);
    if (bugDetectionRate > 50) {
      console.log('- ⚠️  HIGH: Many issues found - parser needs attention');
    } else if (bugDetectionRate > 20) {
      console.log('- ⚠️  MEDIUM: Some issues found - consider improvements');
    } else {
      console.log('- ✅ LOW: Parser appears robust');
    }
  });
}

runParserTests().catch(console.error);