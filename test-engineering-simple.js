#!/usr/bin/env node

/**
 * Simple test for DataPilot engineering command
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const testFile = path.join(__dirname, 'test-datasets', 'kaggle', 'student_habits_performance.csv');

console.log('🔧 Testing DataPilot Engineering Command');
console.log('=========================================');
console.log(`Test file: ${testFile}`);

// Check if test file exists
if (!fs.existsSync(testFile)) {
  console.error('❌ Test file not found:', testFile);
  process.exit(1);
}

console.log('\n🚀 Running engineering command...');

const child = spawn('node', ['dist/cli/index.js', 'engineering', testFile, '--verbose', '--output', 'json'], {
  cwd: __dirname,
  stdio: 'pipe'
});

let stdout = '';
let stderr = '';

child.stdout.on('data', (data) => {
  stdout += data.toString();
  process.stdout.write(data); // Show output in real time
});

child.stderr.on('data', (data) => {
  stderr += data.toString();
  process.stderr.write(data); // Show errors in real time
});

child.on('close', (code) => {
  console.log(`\n\n📊 Process completed with exit code: ${code}`);
  
  if (code === 0) {
    console.log('✅ Engineering command succeeded!');
    
    if (stdout.length > 0) {
      console.log(`\n📄 Output length: ${stdout.length} characters`);
      
      // Try to parse as JSON if it looks like JSON
      if (stdout.trim().startsWith('{') || stdout.trim().startsWith('[')) {
        try {
          const parsed = JSON.parse(stdout);
          console.log('✅ Output is valid JSON');
          
          // Show summary of JSON structure
          if (typeof parsed === 'object') {
            console.log('📋 JSON structure keys:', Object.keys(parsed));
          }
        } catch (e) {
          console.log('⚠️ Output looks like JSON but failed to parse:', e.message);
        }
      }
      
      // Show first few lines
      const lines = stdout.split('\n').slice(0, 5);
      console.log('\n📝 First few lines of output:');
      lines.forEach((line, i) => {
        if (line.trim()) {
          console.log(`  ${i + 1}: ${line.substring(0, 100)}${line.length > 100 ? '...' : ''}`);
        }
      });
    }
    
  } else {
    console.log('❌ Engineering command failed!');
    
    if (stderr.length > 0) {
      console.log('\n🚨 Error output:');
      console.log(stderr);
    }
    
    if (stdout.length > 0) {
      console.log('\n📄 Standard output:');
      console.log(stdout);
    }
  }
  
  console.log('\n🏁 Test completed');
  process.exit(code);
});

// Handle timeout
setTimeout(() => {
  console.log('\n⏰ Test timed out after 60 seconds');
  child.kill('SIGTERM');
  process.exit(1);
}, 60000);

console.log('⏳ Waiting for command to complete (timeout: 60s)...');