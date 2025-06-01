#!/usr/bin/env node

import { promises as fs } from 'fs';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function createTestFile() {
  console.log('Creating 3MB test file...');
  const headers = 'id,name,age,salary,department,hire_date,performance_score\n';
  const row = (i) => `${i},Employee${i},${25 + (i % 40)},${50000 + (i * 100)},Dept${i % 5},2020-01-${(i % 28) + 1},${(Math.random() * 5).toFixed(2)}\n`;
  
  let content = headers;
  for (let i = 1; i <= 50000; i++) {
    content += row(i);
  }
  
  const testFile = path.join(__dirname, 'test_3mb.csv');
  await fs.writeFile(testFile, content);
  const stats = await fs.stat(testFile);
  console.log(`Created ${testFile} (${(stats.size / 1024 / 1024).toFixed(2)}MB)`);
  return testFile;
}

async function runTest(testFile) {
  console.log('\nRunning DataPilot EDA on large file...');
  const datapilot = path.join(__dirname, '..', 'dist', 'datapilot.js');
  
  const child = spawn('node', [datapilot, 'eda', testFile], {
    stdio: ['ignore', 'pipe', 'pipe']
  });
  
  let output = '';
  let errorOutput = '';
  const startTime = Date.now();
  
  child.stdout.on('data', (data) => {
    const text = data.toString();
    output += text;
    process.stdout.write(text);
  });
  
  child.stderr.on('data', (data) => {
    errorOutput += data.toString();
  });
  
  // Set a timeout
  const timeout = setTimeout(() => {
    console.log('\n⏱️ Killing process after 20 seconds...');
    child.kill();
  }, 20000);
  
  child.on('close', (code) => {
    clearTimeout(timeout);
    const duration = Date.now() - startTime;
    console.log(`\nProcess finished with code ${code} in ${duration}ms`);
    
    if (errorOutput) {
      console.log('Errors:', errorOutput);
    }
    
    // Check if sampling was used
    if (output.includes('Using') && output.includes('sampling')) {
      console.log('✅ Sampling was correctly triggered');
    } else {
      console.log('❌ Sampling was NOT triggered');
    }
    
    // Clean up
    fs.unlink(testFile).catch(() => {});
  });
}

async function main() {
  const testFile = await createTestFile();
  await runTest(testFile);
}

main().catch(console.error);