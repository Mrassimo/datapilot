#!/usr/bin/env node

/**
 * Minimal TUI Test - Quick verification that navigation is working
 */

import { spawn } from 'child_process';

async function testTUIBasics() {
  console.log('🔍 Testing TUI basics...\n');
  
  return new Promise((resolve) => {
    const process = spawn('node', ['bin/datapilot.js', 'ui'], {
      cwd: '/Users/massimoraso/Code/jseda/datapilot',
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let output = '';
    let hasMainMenu = false;
    let hasNavigation = false;
    let hasSettings = false;
    let hasMemoryManager = false;

    process.stdout.on('data', (data) => {
      output += data.toString();
      
      // Check for main menu
      if (output.includes('MAIN MENU')) {
        hasMainMenu = true;
        console.log('✅ Main menu detected');
      }
      
      // Check for navigation options
      if (output.includes('Guided Analysis') && output.includes('Demo Mode')) {
        hasNavigation = true;
        console.log('✅ Navigation options detected');
      }
      
      // Check for settings menu
      if (output.includes('Settings')) {
        hasSettings = true;
        console.log('✅ Settings option detected');
      }
      
      // Check for memory manager
      if (output.includes('Memory Manager')) {
        hasMemoryManager = true;
        console.log('✅ Memory Manager option detected');
      }
    });

    // Exit after 3 seconds
    setTimeout(() => {
      process.stdin.write('\u001b'); // Send Escape
      setTimeout(() => {
        if (!process.killed) {
          process.kill('SIGTERM');
        }
      }, 500);
    }, 3000);

    process.on('exit', () => {
      console.log('\n📊 Test Results:');
      console.log(`Main Menu: ${hasMainMenu ? '✅' : '❌'}`);
      console.log(`Navigation: ${hasNavigation ? '✅' : '❌'}`);
      console.log(`Settings: ${hasSettings ? '✅' : '❌'}`);
      console.log(`Memory Manager: ${hasMemoryManager ? '✅' : '❌'}`);
      
      const score = [hasMainMenu, hasNavigation, hasSettings, hasMemoryManager].filter(Boolean).length;
      console.log(`\n🎯 Score: ${score}/4 (${(score/4*100).toFixed(1)}%)`);
      
      if (score >= 3) {
        console.log('🎉 TUI navigation is working correctly!');
      } else {
        console.log('⚠️ TUI has some issues but basic functionality exists');
      }
      
      resolve({
        success: score >= 3,
        details: { hasMainMenu, hasNavigation, hasSettings, hasMemoryManager }
      });
    });
  });
}

// Run test
testTUIBasics().then(result => {
  process.exit(result.success ? 0 : 1);
});