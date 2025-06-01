#!/usr/bin/env node

/**
 * Post-install script to help Windows users set up PATH
 */

import { platform } from 'os';
import chalk from 'chalk';
import { execSync } from 'child_process';
import path from 'path';

const isWindows = platform() === 'win32';

function getWindowsNpmPath() {
  try {
    // Get npm global prefix
    const npmPrefix = execSync('npm config get prefix', { encoding: 'utf8' }).trim();
    return npmPrefix;
  } catch (error) {
    return null;
  }
}

function checkIfInPath() {
  try {
    execSync('where datapilot', { encoding: 'utf8', stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

function displayWindowsInstructions() {
  const npmPath = getWindowsNpmPath();
  const inPath = checkIfInPath();
  
  if (inPath) {
    console.log(chalk.green('\n✅ DataPilot is already in your PATH!'));
    console.log(chalk.green('You can run it from any terminal with: datapilot\n'));
    return;
  }
  
  console.log(chalk.yellow('\n⚠️  Windows PATH Configuration Required'));
  console.log(chalk.yellow('=====================================\n'));
  
  console.log(chalk.white('DataPilot has been installed, but you need to add it to your PATH.\n'));
  
  if (npmPath) {
    console.log(chalk.cyan('Option 1: Add to PATH for current session:'));
    console.log(chalk.white(`  PowerShell: $env:PATH += ";${npmPath}"`));
    console.log(chalk.white(`  CMD:        set PATH=%PATH%;${npmPath}\n`));
    
    console.log(chalk.cyan('Option 2: Add to PATH permanently:'));
    console.log(chalk.white('  1. Open System Properties → Environment Variables'));
    console.log(chalk.white('  2. Edit the "Path" variable'));
    console.log(chalk.white(`  3. Add: ${npmPath}`));
    console.log(chalk.white('  4. Restart your terminal\n'));
  }
  
  console.log(chalk.cyan('Option 3: Run DataPilot directly:'));
  console.log(chalk.white(`  npx datapilot <command> <file.csv>\n`));
  
  console.log(chalk.gray('For more help, see: https://github.com/Mrassimo/datapilot#installation'));
}

function displaySuccessMessage() {
  console.log(chalk.green('\n🎉 DataPilot installed successfully!\n'));
  
  if (!isWindows) {
    console.log(chalk.white('Run DataPilot with:'));
    console.log(chalk.cyan('  datapilot <command> <file.csv>\n'));
    console.log(chalk.white('Try the interactive UI:'));
    console.log(chalk.cyan('  datapilot ui\n'));
  }
}

// Main execution
console.log(chalk.blue('\n🛩️  DataPilot Post-Install Setup'));
console.log(chalk.blue('================================'));

displaySuccessMessage();

if (isWindows) {
  displayWindowsInstructions();
}

console.log(chalk.gray('\nFor documentation and examples, visit:'));
console.log(chalk.blue('https://github.com/Mrassimo/datapilot\n'));