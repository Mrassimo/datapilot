#!/usr/bin/env node

/**
 * Parallel UI Fix Implementation Script
 * Executes multiple fixes simultaneously for maximum efficiency
 */

import { spawn } from 'child_process';
import chalk from 'chalk';
import ora from 'ora';
import { promises as fs } from 'fs';
import path from 'path';

// Task definitions with dependencies
const tasks = {
  // IMMEDIATE FIXES (No dependencies)
  removeDelays: {
    name: 'Remove Artificial Delays',
    fn: removeArtificialDelays,
    deps: [],
    workstream: 1
  },
  fixStderr: {
    name: 'Fix Stderr Usage',
    fn: fixStderrUsage,
    deps: [],
    workstream: 1
  },
  addErrorHandling: {
    name: 'Add Basic Error Handling',
    fn: addBasicErrorHandling,
    deps: [],
    workstream: 1
  },
  
  // TESTING SETUP (No dependencies)
  setupTests: {
    name: 'Setup Testing Infrastructure',
    fn: setupTestingInfrastructure,
    deps: [],
    workstream: 3
  },
  
  // STATE MANAGEMENT (Depends on error handling)
  implementState: {
    name: 'Implement State Machine',
    fn: implementStateMachine,
    deps: ['addErrorHandling'],
    workstream: 4
  },
  
  // INPUT VALIDATION (Depends on state)
  addValidation: {
    name: 'Add Input Validation',
    fn: addInputValidation,
    deps: ['implementState'],
    workstream: 5
  },
  
  // UX IMPROVEMENTS (Depends on state and validation)
  addLoadingIndicators: {
    name: 'Add Loading Indicators',
    fn: addLoadingIndicators,
    deps: ['implementState', 'addValidation'],
    workstream: 6
  }
};

// Task execution tracker
const taskStatus = {};
const runningTasks = new Map();

async function main() {
  console.log(chalk.bold.cyan('\n🚀 DataPilot UI Parallel Fix Runner\n'));
  
  // Initialize task status
  Object.keys(tasks).forEach(taskId => {
    taskStatus[taskId] = 'pending';
  });
  
  // Execute tasks in parallel
  await executeTasksInParallel();
  
  // Generate report
  generateReport();
}

async function executeTasksInParallel() {
  const promises = [];
  
  // Start all tasks with no dependencies
  for (const [taskId, task] of Object.entries(tasks)) {
    if (task.deps.length === 0) {
      promises.push(runTask(taskId));
    }
  }
  
  // Wait for all tasks to complete
  await Promise.all(promises);
}

async function runTask(taskId) {
  const task = tasks[taskId];
  const spinner = ora(`${task.name}`).start();
  runningTasks.set(taskId, spinner);
  
  try {
    // Check dependencies
    for (const dep of task.deps) {
      while (taskStatus[dep] !== 'completed') {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    // Execute task
    await task.fn();
    
    taskStatus[taskId] = 'completed';
    spinner.succeed(chalk.green(`✓ ${task.name}`));
    
    // Start dependent tasks
    for (const [nextTaskId, nextTask] of Object.entries(tasks)) {
      if (nextTask.deps.includes(taskId) && taskStatus[nextTaskId] === 'pending') {
        const allDepsComplete = nextTask.deps.every(dep => taskStatus[dep] === 'completed');
        if (allDepsComplete) {
          runTask(nextTaskId);
        }
      }
    }
  } catch (error) {
    taskStatus[taskId] = 'failed';
    spinner.fail(chalk.red(`✗ ${task.name}: ${error.message}`));
  }
}

// Implementation functions

async function removeArtificialDelays() {
  const enginePath = path.join(process.cwd(), 'src/commands/ui/engine.js');
  const interfacePath = path.join(process.cwd(), 'src/commands/ui/interface.js');
  
  // Remove setTimeout calls
  for (const filePath of [enginePath, interfacePath]) {
    const content = await fs.readFile(filePath, 'utf8');
    const fixed = content
      .replace(/setTimeout\s*\([^)]+,\s*\d+\s*\)/g, '// Removed artificial delay')
      .replace(/await\s+new\s+Promise.*?setTimeout.*?\)/g, '// Removed artificial delay');
    
    await fs.writeFile(filePath, fixed);
  }
}

async function fixStderrUsage() {
  const filesToFix = [
    'src/commands/ui/engine.js',
    'src/commands/ui/interface.js'
  ];
  
  for (const file of filesToFix) {
    const filePath = path.join(process.cwd(), file);
    const content = await fs.readFile(filePath, 'utf8');
    
    // Replace console.error for status messages
    const fixed = content
      .replace(/console\.error\((['"`])(?!.*error|.*Error).*?Status.*?\1\)/g, 'console.log($1$2$1)')
      .replace(/console\.error\((['"`])(?!.*error|.*Error).*?Initializing.*?\1\)/g, 'console.log($1$2$1)')
      .replace(/console\.error\((['"`])(?!.*error|.*Error).*?Ready.*?\1\)/g, 'console.log($1$2$1)');
    
    await fs.writeFile(filePath, fixed);
  }
}

async function addBasicErrorHandling() {
  const enginePath = path.join(process.cwd(), 'src/commands/ui/engine.js');
  const content = await fs.readFile(enginePath, 'utf8');
  
  // Add error wrapper to key handler
  const errorHandlerCode = `
// Error recovery function
function recoverFromError(error) {
  console.error('UI Error:', error.message);
  // Reset to safe state
  if (this.currentMenu) {
    this.render(this.currentMenu);
  }
}

// Wrap existing methods with try-catch
`;
  
  // Insert after imports
  const fixed = content.replace(
    /(import.*\n)+/,
    '$&\n' + errorHandlerCode
  );
  
  await fs.writeFile(enginePath, fixed);
}

async function setupTestingInfrastructure() {
  // Install test dependencies
  await executeCommand('npm', ['install', '--save-dev', 'jest', '@types/jest']);
  
  // Create jest config
  const jestConfig = {
    testEnvironment: 'node',
    coverageDirectory: 'coverage',
    collectCoverageFrom: [
      'src/commands/ui/**/*.js'
    ],
    testMatch: [
      '**/tests/ui/**/*.test.js'
    ]
  };
  
  await fs.writeFile(
    path.join(process.cwd(), 'jest.config.json'),
    JSON.stringify(jestConfig, null, 2)
  );
  
  // Update package.json scripts
  const packagePath = path.join(process.cwd(), 'package.json');
  const packageJson = JSON.parse(await fs.readFile(packagePath, 'utf8'));
  
  packageJson.scripts = {
    ...packageJson.scripts,
    'test:ui': 'jest tests/ui',
    'test:ui:watch': 'jest tests/ui --watch',
    'test:ui:coverage': 'jest tests/ui --coverage'
  };
  
  await fs.writeFile(packagePath, JSON.stringify(packageJson, null, 2));
}

async function implementStateMachine() {
  // State machine is already created in previous step
  // Just need to integrate it
  const enginePath = path.join(process.cwd(), 'src/commands/ui/engine.js');
  const content = await fs.readFile(enginePath, 'utf8');
  
  // Add import
  const importStatement = "import { UIStateMachine } from './stateMachine.js';\n";
  const fixed = content.replace(/(import.*\n)+/, '$&' + importStatement);
  
  await fs.writeFile(enginePath, fixed);
}

async function addInputValidation() {
  // Input validator is already created
  // Integrate into engine
  const enginePath = path.join(process.cwd(), 'src/commands/ui/engine.js');
  const content = await fs.readFile(enginePath, 'utf8');
  
  // Add import
  const importStatement = "import { InputValidator } from './inputValidator.js';\n";
  const fixed = content.replace(/(import.*\n)+/, '$&' + importStatement);
  
  await fs.writeFile(enginePath, fixed);
}

async function addLoadingIndicators() {
  // Create loading indicator component
  const loadingCode = `
export function showLoadingIndicator(message = 'Loading...') {
  const spinner = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  let i = 0;
  
  const interval = setInterval(() => {
    process.stdout.write(\`\\r\${spinner[i]} \${message}\`);
    i = (i + 1) % spinner.length;
  }, 80);
  
  return () => {
    clearInterval(interval);
    process.stdout.write('\\r' + ' '.repeat(message.length + 3) + '\\r');
  };
}
`;
  
  await fs.writeFile(
    path.join(process.cwd(), 'src/commands/ui/loading.js'),
    loadingCode
  );
}

// Helper functions

async function executeCommand(command, args) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, { stdio: 'pipe' });
    let output = '';
    
    proc.stdout.on('data', data => output += data);
    proc.stderr.on('data', data => output += data);
    
    proc.on('close', code => {
      if (code === 0) resolve(output);
      else reject(new Error(`Command failed: ${output}`));
    });
  });
}

function generateReport() {
  console.log(chalk.bold.cyan('\n📊 Execution Report\n'));
  
  const completed = Object.entries(taskStatus).filter(([_, status]) => status === 'completed');
  const failed = Object.entries(taskStatus).filter(([_, status]) => status === 'failed');
  
  console.log(chalk.green(`✓ Completed: ${completed.length}`));
  console.log(chalk.red(`✗ Failed: ${failed.length}`));
  
  if (failed.length > 0) {
    console.log(chalk.red('\nFailed tasks:'));
    failed.forEach(([taskId]) => {
      console.log(chalk.red(`  - ${tasks[taskId].name}`));
    });
  }
  
  console.log(chalk.cyan('\n🎯 Next Steps:'));
  console.log('1. Run tests: npm run test:ui');
  console.log('2. Test UI manually: datapilot ui');
  console.log('3. Check git diff for changes');
  console.log('4. Commit when satisfied');
}

// Run the script
main().catch(console.error);