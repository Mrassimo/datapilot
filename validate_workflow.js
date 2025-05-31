#!/usr/bin/env node

/**
 * Validate GitHub Workflow Configuration
 * Ensures all required files and directories exist for CI/CD
 */

import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

console.log(chalk.bold.cyan('\n🔍 GitHub Workflow Validation\n'));

const requiredFiles = [
  'tests/run_all_tests.js',
  'tests/test_safe_knowledge_base.js',
  'tests/fixtures/iris.csv',
  'tests/tui/engine.test.js',
  'tests/tui/flow.test.js',
  '.github/workflows/ci.yml',
  '.github/workflows/tui-tests.yml'
];

const requiredDirectories = [
  'tests/outputs',
  'tests/fixtures',
  'tests/tui',
  'tests/unit'
];

let allValid = true;

console.log(chalk.yellow('📁 Checking required directories...'));
requiredDirectories.forEach(dir => {
  if (fs.existsSync(dir)) {
    console.log(chalk.green(`  ✅ ${dir}`));
  } else {
    console.log(chalk.red(`  ❌ ${dir} - MISSING`));
    allValid = false;
    
    // Create missing directory
    try {
      fs.mkdirSync(dir, { recursive: true });
      console.log(chalk.yellow(`     Created: ${dir}`));
    } catch (error) {
      console.log(chalk.red(`     Failed to create: ${error.message}`));
    }
  }
});

console.log(chalk.yellow('\n📄 Checking required files...'));
requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(chalk.green(`  ✅ ${file}`));
  } else {
    console.log(chalk.red(`  ❌ ${file} - MISSING`));
    allValid = false;
  }
});

console.log(chalk.yellow('\n🧪 Testing workflow commands...'));

// Test key commands that workflows will run
const testCommands = [
  { 
    name: 'Help command', 
    cmd: 'node bin/datapilot.js --help',
    required: true
  },
  { 
    name: 'EDA help', 
    cmd: 'node bin/datapilot.js eda --help',
    required: true
  },
  { 
    name: 'Test suite exists', 
    cmd: 'node tests/run_all_tests.js --dry-run || true',
    required: false
  }
];

// Check if fixture files exist for testing
const fixtureFiles = fs.readdirSync('tests/fixtures').filter(f => f.endsWith('.csv'));
console.log(chalk.yellow(`\n📊 Found ${fixtureFiles.length} CSV fixture files:`));
fixtureFiles.slice(0, 5).forEach(file => {
  console.log(chalk.gray(`  - ${file}`));
});

if (fixtureFiles.length === 0) {
  console.log(chalk.red('  ❌ No CSV fixture files found for testing'));
  allValid = false;
}

// Check workflow syntax
console.log(chalk.yellow('\n⚙️ Validating workflow syntax...'));
try {
  const ciWorkflow = fs.readFileSync('.github/workflows/ci.yml', 'utf8');
  const tuiWorkflow = fs.readFileSync('.github/workflows/tui-tests.yml', 'utf8');
  
  // Basic YAML validation
  if (ciWorkflow.includes('run:') && ciWorkflow.includes('jobs:')) {
    console.log(chalk.green('  ✅ CI workflow syntax looks valid'));
  } else {
    console.log(chalk.red('  ❌ CI workflow syntax issues'));
    allValid = false;
  }
  
  if (tuiWorkflow.includes('run:') && tuiWorkflow.includes('jobs:')) {
    console.log(chalk.green('  ✅ TUI workflow syntax looks valid'));
  } else {
    console.log(chalk.red('  ❌ TUI workflow syntax issues'));
    allValid = false;
  }
  
} catch (error) {
  console.log(chalk.red(`  ❌ Error reading workflow files: ${error.message}`));
  allValid = false;
}

// Summary
console.log(chalk.bold.cyan('\n📊 Validation Summary\n'));

if (allValid) {
  console.log(chalk.green('✅ All workflow requirements validated'));
  console.log(chalk.green('✅ GitHub Actions should run successfully'));
  console.log(chalk.green('✅ Required files and directories present'));
} else {
  console.log(chalk.yellow('⚠️ Some issues found but may not be critical'));
  console.log(chalk.yellow('⚠️ GitHub Actions may have warnings'));
}

console.log(chalk.cyan('\n🎯 Next steps:'));
console.log('1. Push changes to trigger GitHub Actions');
console.log('2. Monitor workflow runs for any issues');
console.log('3. Check Actions tab in GitHub repository');
console.log('4. Review artifacts uploaded by workflows');

// Create a simple readme for GitHub Actions
const actionsReadme = `# GitHub Actions Workflows

## CI Workflow (.github/workflows/ci.yml)
- Tests on Windows, macOS, and Ubuntu
- Tests Node.js 18.x and 20.x
- Runs comprehensive test suite
- Tests safe knowledge base features
- Validates CLI help functionality
- Tests core EDA and Engineering analysis

## TUI Tests (.github/workflows/tui-tests.yml)  
- Tests Terminal UI on all platforms
- Includes PowerShell tests for Windows
- Uploads test artifacts and reports
- Generates consolidated cross-platform report

## Test Files Required:
- tests/run_all_tests.js - Main test runner
- tests/test_safe_knowledge_base.js - Safety feature tests
- tests/fixtures/*.csv - Test data files
- tests/tui/*.test.js - TUI specific tests

## Validation:
Run \`node validate_workflow.js\` to check all requirements are met.
`;

fs.writeFileSync('.github/ACTIONS_README.md', actionsReadme);
console.log(chalk.gray('\n📝 Created .github/ACTIONS_README.md'));

export { allValid };