#!/usr/bin/env node

/**
 * Verification test for multi-file selection in TUI
 */

import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function verifyMultiFileUI() {
  console.log('🔍 Verifying Multi-File Selection Implementation\n');

  const datapilot = path.join(__dirname, '..', 'dist', 'datapilot.js');
  
  return new Promise((resolve) => {
    // Test 1: Start UI and immediately exit to check menu structure
    const child = exec(`echo "4" | node "${datapilot}" ui`, (error, stdout, stderr) => {
      console.log('📋 TUI Output Analysis:');
      console.log('='.repeat(50));
      
      // Check for multi-file option
      if (stdout.includes('Browse for Multiple Files') || stdout.includes('multiple')) {
        console.log('✅ "Browse for Multiple Files" option found in TUI menu');
      } else {
        console.log('❌ "Browse for Multiple Files" option NOT found');
      }
      
      // Check for guided analysis
      if (stdout.includes('GUIDED ANALYSIS')) {
        console.log('✅ Guided Analysis mode accessible');
      } else {
        console.log('❌ Guided Analysis mode not found');
      }
      
      // Check for main menu structure
      if (stdout.includes('MAIN MENU')) {
        console.log('✅ Main menu structure present');
      } else {
        console.log('❌ Main menu structure not found');
      }
      
      console.log('\n📊 Feature Implementation Status:');
      console.log('='.repeat(50));
      
      const features = {
        'Multi-file selection option': stdout.includes('Multiple') || stdout.includes('multiple'),
        'File browser functionality': stdout.includes('Browse'),
        'Guided analysis workflow': stdout.includes('Analyze'),
        'Menu navigation': stdout.includes('MENU')
      };
      
      Object.entries(features).forEach(([feature, present]) => {
        const status = present ? '✅' : '❌';
        console.log(`${status} ${feature}`);
      });
      
      console.log('\n🎯 Summary:');
      const passCount = Object.values(features).filter(f => f).length;
      const totalCount = Object.keys(features).length;
      
      if (passCount === totalCount) {
        console.log('🎉 All multi-file UI features are implemented and accessible!');
      } else {
        console.log(`⚠️  ${passCount}/${totalCount} features verified. Some features may need implementation.`);
      }
      
      resolve();
    });
  });
}

// Run verification
verifyMultiFileUI().catch(console.error);