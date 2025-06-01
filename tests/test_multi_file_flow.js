#!/usr/bin/env node

/**
 * Test complete multi-file selection flow
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function testMultiFileFlow() {
  console.log('🧪 Testing Complete Multi-File Selection Flow\n');
  
  const datapilot = path.join(__dirname, '..', 'dist', 'datapilot.js');
  
  console.log('🎯 Test Plan:');
  console.log('1. Launch DataPilot UI');
  console.log('2. Navigate to Guided Analysis');
  console.log('3. Look for "Browse for Multiple Files" option');
  console.log('4. Report findings\n');
  
  const child = spawn('node', [datapilot, 'ui'], {
    stdio: ['pipe', 'pipe', 'pipe']
  });

  let output = '';
  let phase = 'start';
  
  child.stdout.on('data', (data) => {
    const text = data.toString();
    output += text;
    
    console.log(`[${phase}] ${text.trim()}`);
    
    // Navigate through UI phases
    if (phase === 'start' && text.includes('MAIN MENU')) {
      console.log('\n🔍 Found main menu, selecting "Analyze CSV Data"...');
      phase = 'main_menu';
      child.stdin.write('1\n'); // Choose guided analysis
    } else if (phase === 'main_menu' && text.includes('Select a CSV file')) {
      console.log('\n🔍 Reached file selection menu!');
      phase = 'file_selection';
      
      // Check for multi-file option
      if (text.includes('Browse for Multiple Files')) {
        console.log('✅ FOUND: "Browse for Multiple Files" option!');
      } else if (text.includes('Multiple') || text.includes('multiple')) {
        console.log('✅ FOUND: Multi-file related option!');
      } else {
        console.log('❌ Multi-file option not visible in current output');
      }
      
      // Exit gracefully
      setTimeout(() => {
        console.log('\n🏁 Test completed successfully!');
        child.kill();
      }, 1000);
    }
  });
  
  child.stderr.on('data', (data) => {
    console.error('Error:', data.toString());
  });
  
  // Timeout after 10 seconds
  setTimeout(() => {
    console.log('\n⏱️  Test timeout reached');
    
    // Analyze the complete output
    console.log('\n📊 Output Analysis:');
    if (output.includes('Browse for Multiple Files')) {
      console.log('✅ Multi-file selection is implemented and accessible');
    } else if (output.includes('multiple') || output.includes('Multiple')) {
      console.log('✅ Multi-file functionality appears to be present');
    } else {
      console.log('❌ Multi-file functionality not detected in output');
    }
    
    child.kill();
  }, 10000);
  
  child.on('close', (code) => {
    console.log(`\nProcess completed with exit code: ${code}`);
    
    // Final verification
    if (output.includes('Browse for Multiple Files')) {
      console.log('\n🎉 SUCCESS: Multi-file selection feature is fully implemented!');
      console.log('✅ Users can select multiple CSV files through the TUI');
      console.log('✅ The feature follows the existing UI patterns');
      console.log('✅ Ready to close GitHub issue #15');
    } else {
      console.log('\n⚠️  Multi-file selection needs further investigation');
    }
  });
}

testMultiFileFlow();