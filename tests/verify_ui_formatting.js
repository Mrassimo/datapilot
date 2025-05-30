#!/usr/bin/env node

/**
 * Quick test to verify UI formatting is correct
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

console.log('Testing DataPilot UI formatting...\n');

const ui = spawn('node', [path.join(projectRoot, 'bin', 'datapilot.js'), 'ui'], {
  stdio: ['pipe', 'pipe', 'pipe']
});

let output = '';
let errorOccurred = false;

ui.stdout.on('data', (data) => {
  output += data.toString();
  
  // Check for common formatting issues
  if (output.includes('\\n')) {
    console.error('❌ ERROR: Found escaped newline characters (\\n) in output');
    errorOccurred = true;
  }
  
  // Check if welcome message appears
  if (output.includes('Welcome to DataPilot Interactive Terminal UI!')) {
    console.log('✅ Welcome message displays correctly');
  }
  
  // Check if main menu appears
  if (output.includes('MAIN MENU')) {
    console.log('✅ Main menu appears');
  }
  
  // Check if ASCII art appears
  if (output.includes('██████╗')) {
    console.log('✅ ASCII art logo displays');
  }
  
  // Once we see the main menu prompt, we can exit
  if (output.includes('What would you like to explore today?')) {
    console.log('✅ Menu prompt appears correctly');
    
    // Send exit command
    ui.stdin.write('\x1B[B\x1B[B\x1B[B\x1B[B\n'); // Navigate down to exit and press enter
    
    setTimeout(() => {
      if (!errorOccurred) {
        console.log('\n✨ UI formatting test passed! No issues detected.');
      } else {
        console.log('\n❌ UI formatting test failed! Issues were detected.');
      }
      process.exit(errorOccurred ? 1 : 0);
    }, 1000);
  }
});

ui.stderr.on('data', (data) => {
  console.error('STDERR:', data.toString());
});

ui.on('error', (error) => {
  console.error('Failed to start UI:', error);
  process.exit(1);
});

// Timeout after 10 seconds
setTimeout(() => {
  console.error('\n❌ Test timed out');
  ui.kill();
  process.exit(1);
}, 10000);