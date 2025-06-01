#!/usr/bin/env node

/**
 * Test script to verify multi-file selection functionality
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function testMultiFileSelection() {
  console.log('🧪 Testing Multi-File Selection in TUI\n');

  const datapilot = path.join(__dirname, '..', 'dist', 'datapilot.js');
  
  console.log('Starting DataPilot UI to test multi-file selection...');
  console.log('Expected flow:');
  console.log('1. Choose "Analyze CSV Data"');
  console.log('2. Look for "Browse for Multiple Files" option');
  console.log('3. Test checkbox-style file selection');
  console.log('4. Verify batch analysis functionality\n');

  const child = spawn('node', [datapilot, 'ui'], {
    stdio: ['pipe', 'pipe', 'pipe']
  });

  let output = '';
  
  child.stdout.on('data', (data) => {
    const text = data.toString();
    output += text;
    
    // Check for multi-file selection option
    if (text.includes('Browse for Multiple Files') || text.includes('multiple')) {
      console.log('✅ Multi-file selection option found in UI!');
    }
    
    // Print actual output for manual verification
    process.stdout.write(text);
  });

  child.stderr.on('data', (data) => {
    console.error('Error:', data.toString());
  });

  // Auto-exit after 5 seconds for testing
  setTimeout(() => {
    console.log('\n\n📋 Test completed. Manual verification required.');
    console.log('Multi-file selection should be available in the TUI menu.');
    child.kill();
  }, 5000);

  child.on('close', (code) => {
    console.log(`\nProcess exited with code: ${code}`);
    
    // Check if multi-file functionality was detected
    if (output.includes('multiple') || output.includes('Multiple')) {
      console.log('✅ Multi-file functionality appears to be implemented');
    } else {
      console.log('⚠️  Multi-file functionality may need verification');
    }
  });
}

testMultiFileSelection().catch(console.error);