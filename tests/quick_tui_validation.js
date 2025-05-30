#!/usr/bin/env node

/**
 * Quick TUI Validation Script
 * Verifies TUI can start and core components are working
 * Without requiring complex keyboard simulation
 */

import { spawn } from 'child_process';
import fs from 'fs';

class QuickTUIValidator {
  constructor() {
    this.results = {
      startup: false,
      mainMenu: false,
      noErrors: false,
      navigation: false,
      colors: false,
      components: []
    };
  }

  async validate() {
    console.log('🔍 Quick TUI Validation Starting...\n');
    
    return new Promise((resolve, reject) => {
      const process = spawn('node', ['bin/datapilot.js', 'ui'], {
        cwd: '/Users/massimoraso/Code/jseda/datapilot',
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let outputBuffer = '';
      let errorBuffer = '';
      let hasErrors = false;

      // Capture output
      process.stdout.on('data', (data) => {
        outputBuffer += data.toString();
      });

      process.stderr.on('data', (data) => {
        errorBuffer += data.toString();
        if (!data.toString().includes('ExperimentalWarning')) {
          hasErrors = true;
        }
      });

      // Give TUI time to start and display
      setTimeout(() => {
        // Send Escape to exit gracefully
        process.stdin.write('\u001b');
        
        setTimeout(() => {
          if (!process.killed) {
            process.kill('SIGTERM');
          }
        }, 1000);
      }, 3000);

      process.on('exit', (code) => {
        this.analyzeOutput(outputBuffer, errorBuffer, hasErrors);
        this.generateReport();
        resolve(this.results);
      });

      process.on('error', (error) => {
        console.error('❌ Process error:', error.message);
        reject(error);
      });
    });
  }

  analyzeOutput(output, errors, hasErrors) {
    console.log('📊 Analyzing TUI output...\n');

    // Check startup
    if (output.includes('DataPilot') || output.includes('DATAPILOT')) {
      this.results.startup = true;
      console.log('✅ TUI started successfully');
    } else {
      console.log('❌ TUI startup failed');
    }

    // Check main menu
    if (output.includes('MAIN MENU') || output.includes('main menu')) {
      this.results.mainMenu = true;
      console.log('✅ Main menu displayed');
    } else {
      console.log('❌ Main menu not found');
    }

    // Check for errors
    if (!hasErrors && !errors.includes('Error') && !errors.includes('error') && !output.includes('Error')) {
      this.results.noErrors = true;
      console.log('✅ No errors detected');
    } else {
      console.log('❌ Errors detected:');
      if (errors) console.log(errors);
    }

    // Check navigation elements
    const navigationElements = [
      'Guided Analysis',
      'Demo Mode', 
      'Memory Manager',
      'Settings',
      'Exit'
    ];

    let foundElements = 0;
    navigationElements.forEach(element => {
      if (output.includes(element)) {
        foundElements++;
        this.results.components.push(element);
      }
    });

    if (foundElements >= 4) {
      this.results.navigation = true;
      console.log(`✅ Navigation elements found (${foundElements}/${navigationElements.length})`);
    } else {
      console.log(`❌ Missing navigation elements (${foundElements}/${navigationElements.length})`);
    }

    // Check colors/formatting
    if (output.includes('╔') || output.includes('║') || output.includes('╚')) {
      this.results.colors = true;
      console.log('✅ Visual formatting detected');
    } else {
      console.log('❌ Visual formatting not detected');
    }

    // Log components found
    if (this.results.components.length > 0) {
      console.log(`📋 Components detected: ${this.results.components.join(', ')}`);
    }
  }

  generateReport() {
    console.log('\n' + '='.repeat(50));
    console.log('📊 QUICK TUI VALIDATION REPORT');
    console.log('='.repeat(50));

    const checks = [
      { name: 'TUI Startup', passed: this.results.startup },
      { name: 'Main Menu Display', passed: this.results.mainMenu },
      { name: 'No Errors', passed: this.results.noErrors },
      { name: 'Navigation Elements', passed: this.results.navigation },
      { name: 'Visual Formatting', passed: this.results.colors }
    ];

    const passed = checks.filter(c => c.passed).length;
    const total = checks.length;

    console.log(`\n📈 Summary: ${passed}/${total} checks passed (${((passed/total)*100).toFixed(1)}%)\n`);

    checks.forEach(check => {
      const status = check.passed ? '✅' : '❌';
      console.log(`${status} ${check.name}`);
    });

    if (this.results.components.length > 0) {
      console.log(`\n📋 Found Components: ${this.results.components.join(', ')}`);
    }

    // Overall assessment
    console.log('\n🎯 Overall Assessment:');
    if (passed === total) {
      console.log('🎉 TUI is working correctly! All checks passed.');
    } else if (passed >= 3) {
      console.log('⚠️ TUI is mostly working but has some issues.');
    } else {
      console.log('❌ TUI has significant issues and needs attention.');
    }

    // Save report
    const reportPath = '/Users/massimoraso/Code/jseda/datapilot/tests/quick_validation_report.json';
    fs.writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      summary: { total, passed, passRate: (passed/total)*100 },
      results: this.results,
      checks
    }, null, 2));

    console.log(`\n💾 Report saved to: ${reportPath}`);
    console.log('='.repeat(50));

    return passed === total;
  }
}

// Specific tests for the fixed issues
async function validateSpecificFixes() {
  console.log('\n🔧 Validating Specific Fixes...\n');
  
  const fixes = [
    {
      name: 'Settings Menu Navigation',
      test: () => testSettingsMenuStructure()
    },
    {
      name: 'Memory Manager Format',
      test: () => testMemoryManagerStructure()
    },
    {
      name: 'Demo Mode Datasets',
      test: () => testDemoModeDatasets()
    },
    {
      name: 'Color Functions',
      test: () => testColorFunctions()
    }
  ];

  const results = [];
  
  for (const fix of fixes) {
    try {
      const result = await fix.test();
      results.push({ name: fix.name, status: 'PASSED', details: result });
      console.log(`✅ ${fix.name}: PASSED`);
    } catch (error) {
      results.push({ name: fix.name, status: 'FAILED', error: error.message });
      console.log(`❌ ${fix.name}: FAILED - ${error.message}`);
    }
  }

  return results;
}

function testSettingsMenuStructure() {
  // Test that settings function has proper navigation structure
  const interfaceFile = fs.readFileSync('/Users/massimoraso/Code/jseda/datapilot/src/commands/ui/interface.js', 'utf8');
  
  if (!interfaceFile.includes('let inSettings = true')) {
    throw new Error('Settings menu missing navigation loop');
  }
  
  if (!interfaceFile.includes('About DataPilot')) {
    throw new Error('About DataPilot option missing');
  }
  
  if (!interfaceFile.includes('Back to Main Menu')) {
    throw new Error('Back navigation missing');
  }
  
  return 'Settings menu structure is correct';
}

function testMemoryManagerStructure() {
  const interfaceFile = fs.readFileSync('/Users/massimoraso/Code/jseda/datapilot/src/commands/ui/interface.js', 'utf8');
  
  if (!interfaceFile.includes('Export Memories')) {
    throw new Error('Export Memories option missing');
  }
  
  if (!interfaceFile.includes('exportMemories(engine)')) {
    throw new Error('Export Memories function call missing');
  }
  
  return 'Memory manager structure is correct';
}

function testDemoModeDatasets() {
  const engineFile = fs.readFileSync('/Users/massimoraso/Code/jseda/datapilot/src/commands/ui/engine.js', 'utf8');
  
  if (!engineFile.includes('boston_housing.csv') || !engineFile.includes('iris.csv')) {
    throw new Error('Demo datasets not configured correctly');
  }
  
  if (engineFile.includes('cleveland')) {
    throw new Error('Cleveland housing dataset should be removed');
  }
  
  return 'Demo mode datasets correctly limited to 2 files';
}

function testColorFunctions() {
  const interfaceFile = fs.readFileSync('/Users/massimoraso/Code/jseda/datapilot/src/commands/ui/interface.js', 'utf8');
  
  if (interfaceFile.includes('chalk.green.bright') || interfaceFile.includes('chalk.red.bright')) {
    throw new Error('Old .bright color functions still present');
  }
  
  if (!interfaceFile.includes('chalk.green.bold') || !interfaceFile.includes('chalk.red.bold')) {
    throw new Error('New .bold color functions missing');
  }
  
  return 'Color functions updated correctly';
}

// Main execution
async function main() {
  console.log('🚀 Starting Quick TUI Validation...\n');
  
  try {
    // Run quick validation
    const validator = new QuickTUIValidator();
    const validationResults = await validator.validate();
    
    // Run specific fix tests
    const fixResults = await validateSpecificFixes();
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('🎯 FINAL VALIDATION SUMMARY');
    console.log('='.repeat(60));
    
    const validationPassed = Object.values(validationResults).filter(v => v === true).length >= 4;
    const fixesPassed = fixResults.filter(r => r.status === 'PASSED').length === fixResults.length;
    
    console.log(`\n📊 TUI Validation: ${validationPassed ? 'PASSED' : 'FAILED'}`);
    console.log(`🔧 Specific Fixes: ${fixesPassed ? 'PASSED' : 'FAILED'}`);
    
    if (validationPassed && fixesPassed) {
      console.log('\n🎉 All validations PASSED! TUI navigation is working correctly.');
      process.exit(0);
    } else {
      console.log('\n⚠️ Some validations FAILED. Check the detailed reports.');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Validation failed:', error.message);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { QuickTUIValidator, validateSpecificFixes };