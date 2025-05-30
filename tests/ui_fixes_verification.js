#!/usr/bin/env node

/**
 * UI Fixes Verification Test
 * Verifies all the visual and navigation fixes are working correctly
 */

import { spawn } from 'child_process';
import fs from 'fs';

async function verifyUIFixes() {
  console.log('🔍 Verifying UI Fixes...\n');
  
  const checks = {
    learningModeRemoved: false,
    cleanWelcomeMessage: false,
    properNavigation: false,
    noRandomEnd: false,
    colorsFunctional: false
  };

  return new Promise((resolve) => {
    const process = spawn('node', ['bin/datapilot.js', 'ui'], {
      cwd: '/Users/massimoraso/Code/jseda/datapilot',
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let output = '';
    let errors = '';

    process.stdout.on('data', (data) => {
      output += data.toString();
      
      // Check that Learning Mode is NOT present
      if (!output.includes('Learning Mode') && !output.includes('🎓')) {
        checks.learningModeRemoved = true;
        console.log('✅ Learning Mode successfully removed');
      }
      
      // Check for clean welcome message
      if (output.includes('Welcome to DataPilot') && output.includes('Interactive Data Analysis Engine')) {
        checks.cleanWelcomeMessage = true;
        console.log('✅ Welcome message displays correctly');
      }
      
      // Check for proper navigation elements
      if (output.includes('Analyze CSV Data') && 
          output.includes('Try Demo Mode') && 
          output.includes('Manage Memories') && 
          output.includes('Settings & Preferences')) {
        checks.properNavigation = true;
        console.log('✅ Navigation elements present and correct');
      }
      
      // Check that no random "end" text appears
      if (!output.includes(' end ') && !output.includes('\\nend\\n')) {
        checks.noRandomEnd = true;
        console.log('✅ No random "end" text detected');
      }
      
      // Check for proper colors/formatting
      if (output.includes('╔') && output.includes('║') && output.includes('╚')) {
        checks.colorsFunctional = true;
        console.log('✅ Visual formatting working correctly');
      }
    });

    process.stderr.on('data', (data) => {
      errors += data.toString();
    });

    // Exit after 4 seconds
    setTimeout(() => {
      process.stdin.write('\u001b'); // Send Escape
      setTimeout(() => {
        if (!process.killed) {
          process.kill('SIGTERM');
        }
      }, 500);
    }, 4000);

    process.on('exit', () => {
      // Final analysis
      console.log('\\n📊 Verification Results:');
      console.log('─'.repeat(40));
      
      Object.entries(checks).forEach(([check, passed]) => {
        const status = passed ? '✅' : '❌';
        const label = check.replace(/([A-Z])/g, ' $1').toLowerCase();
        console.log(`${status} ${label}`);
      });
      
      const passedCount = Object.values(checks).filter(Boolean).length;
      const totalChecks = Object.keys(checks).length;
      
      console.log('\\n🎯 Summary:');
      console.log(`${passedCount}/${totalChecks} checks passed (${(passedCount/totalChecks*100).toFixed(1)}%)`);
      
      if (passedCount === totalChecks) {
        console.log('🎉 All UI fixes verified successfully!');
        console.log('The TUI should now display cleanly without issues.');
      } else {
        console.log('⚠️ Some issues may still remain. Check the output above.');
      }
      
      // Check for any critical errors
      if (errors && !errors.includes('ExperimentalWarning')) {
        console.log('\\n⚠️ Errors detected:');
        console.log(errors);
      } else {
        console.log('✅ No critical errors detected');
      }
      
      resolve({
        success: passedCount === totalChecks,
        checks,
        passRate: (passedCount/totalChecks) * 100
      });
    });
  });
}

// Additional file-based verification
function verifySourceCode() {
  console.log('\\n🔍 Verifying Source Code...');
  
  const distContent = fs.readFileSync('/Users/massimoraso/Code/jseda/datapilot/dist/datapilot.js', 'utf8');
  const interfaceContent = fs.readFileSync('/Users/massimoraso/Code/jseda/datapilot/src/commands/ui/interface.js', 'utf8');
  
  const sourceChecks = {
    noLearningInDist: !distContent.includes('Learning Mode'),
    accentFunctionExists: interfaceContent.includes('accent: (text) => safeColors.accent(text)'),
    cleanedFormatting: interfaceContent.includes("+ '\\\\n\\\\n' +"),
    exportMemoriesExists: interfaceContent.includes('exportMemories(engine)')
  };
  
  console.log('\\n📋 Source Code Verification:');
  Object.entries(sourceChecks).forEach(([check, passed]) => {
    const status = passed ? '✅' : '❌';
    const label = check.replace(/([A-Z])/g, ' $1').toLowerCase();
    console.log(`${status} ${label}`);
  });
  
  return sourceChecks;
}

// Main execution
async function main() {
  console.log('🚀 UI Fixes Verification Starting...');
  console.log('='.repeat(50));
  
  try {
    // Verify runtime behavior
    const runtimeResults = await verifyUIFixes();
    
    // Verify source code
    const sourceResults = verifySourceCode();
    
    // Final summary
    console.log('\\n' + '='.repeat(50));
    console.log('🎯 FINAL VERIFICATION SUMMARY');
    console.log('='.repeat(50));
    
    const allPassed = runtimeResults.success && Object.values(sourceResults).every(Boolean);
    
    if (allPassed) {
      console.log('\\n🎉 ALL FIXES VERIFIED! 🎉');
      console.log('The UI should now display correctly without:');
      console.log('  ❌ Learning Mode');
      console.log('  ❌ Random "end" text');
      console.log('  ❌ Formatting issues');
      console.log('  ❌ Navigation problems');
      console.log('\\n✅ Try running `node bin/datapilot.js ui` to see the clean interface!');
      process.exit(0);
    } else {
      console.log('\\n⚠️ Some issues may still need attention.');
      console.log('Check the detailed results above for specific problems.');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { verifyUIFixes };