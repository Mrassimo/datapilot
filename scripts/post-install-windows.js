#!/usr/bin/env node
/**
 * Post-install script for Windows to help users configure PATH
 * This script provides automated PATH detection and configuration guidance
 */

const os = require('os');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

// Only run on Windows
if (process.platform !== 'win32') {
  process.exit(0);
}

// ANSI color codes for better visibility
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  red: '\x1b[31m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function detectNpmGlobalPath() {
  try {
    const npmPrefix = execSync('npm config get prefix', { encoding: 'utf8' }).trim();
    return npmPrefix;
  } catch (error) {
    return null;
  }
}

function detectYarnGlobalPath() {
  try {
    const yarnGlobalPath = execSync('yarn global bin', { encoding: 'utf8' }).trim();
    return path.dirname(yarnGlobalPath);
  } catch (error) {
    return null;
  }
}

function checkDataPilotInPath() {
  try {
    execSync('where datapilot', { encoding: 'utf8' });
    return true;
  } catch (error) {
    return false;
  }
}

function getPathVariable() {
  try {
    // Try to get user PATH first
    const userPath = execSync('echo %PATH%', { encoding: 'utf8', shell: 'cmd.exe' }).trim();
    return userPath;
  } catch (error) {
    return process.env.PATH || '';
  }
}

function generatePathInstructions(globalPath) {
  const npmBinPath = path.join(globalPath, process.platform === 'win32' ? '' : 'bin');
  
  return {
    powershell: {
      check: `$env:Path -split ';' | Select-String "${npmBinPath}"`,
      addUser: `[Environment]::SetEnvironmentVariable("Path", $env:Path + ";${npmBinPath}", [EnvironmentVariableTarget]::User)`,
      addSession: `$env:Path += ";${npmBinPath}"`
    },
    cmd: {
      check: `echo %PATH% | find /i "${npmBinPath}"`,
      addUser: `setx PATH "%PATH%;${npmBinPath}"`,
      addSession: `set PATH=%PATH%;${npmBinPath}`
    },
    manual: {
      steps: [
        '1. Right-click "This PC" or "My Computer" and select "Properties"',
        '2. Click "Advanced system settings"',
        '3. Click "Environment Variables"',
        '4. Under "User variables", select "Path" and click "Edit"',
        '5. Click "New" and add: ' + npmBinPath,
        '6. Click "OK" on all dialogs',
        '7. Restart your terminal'
      ]
    }
  };
}

function checkWindowsVersion() {
  const release = os.release();
  const version = parseInt(release.split('.')[0]);
  
  if (version >= 10) {
    return { version: 'Windows 10/11', modern: true };
  } else if (version >= 6) {
    return { version: 'Windows 7/8', modern: false };
  } else {
    return { version: 'Windows Vista or older', modern: false };
  }
}

function detectPackageManager() {
  // Check if installed via npm or yarn based on parent process or lock files
  const cwd = process.cwd();
  
  if (fs.existsSync(path.join(cwd, 'yarn.lock'))) {
    return 'yarn';
  }
  
  if (process.env.npm_execpath && process.env.npm_execpath.includes('yarn')) {
    return 'yarn';
  }
  
  return 'npm';
}

async function main() {
  log('\n🚀 DataPilot CLI - Windows Installation Helper\n', 'bright');
  
  // Add delay to ensure the script doesn't run too fast during installation
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Detect Windows version
  const windowsInfo = checkWindowsVersion();
  log(`Detected: ${windowsInfo.version}`, 'blue');
  
  // Detect package manager
  const packageManager = detectPackageManager();
  log(`Package Manager: ${packageManager}`, 'blue');
  
  // Check if DataPilot is already in PATH
  if (checkDataPilotInPath()) {
    log('\n✅ Great! DataPilot is already in your PATH.', 'green');
    log('You can run "datapilot --help" from any terminal.\n', 'green');
    return;
  }
  
  log('\n⚠️  DataPilot is not in your PATH yet.', 'yellow');
  log('This means you won\'t be able to run "datapilot" from anywhere.\n', 'yellow');
  
  // Detect global installation path
  const globalPath = packageManager === 'yarn' ? detectYarnGlobalPath() : detectNpmGlobalPath();
  
  if (!globalPath) {
    log('❌ Could not detect global installation path.', 'red');
    log('Please ensure npm or yarn is properly installed.\n', 'red');
    return;
  }
  
  log(`📁 Global installation path: ${globalPath}`, 'blue');
  
  // Generate instructions
  const instructions = generatePathInstructions(globalPath);
  
  log('\n📋 PATH Configuration Instructions:\n', 'bright');
  
  // PowerShell instructions
  log('Option 1: Using PowerShell (Recommended for Windows 10/11):', 'yellow');
  log('─────────────────────────────────────────────────────────', 'blue');
  log('1. Open PowerShell as Administrator');
  log('2. Check if PATH contains npm directory:');
  log(`   ${instructions.powershell.check}`, 'blue');
  log('3. Add to PATH permanently (user level):');
  log(`   ${instructions.powershell.addUser}`, 'green');
  log('4. Or add to current session only:');
  log(`   ${instructions.powershell.addSession}`, 'green');
  
  // Command Prompt instructions
  log('\nOption 2: Using Command Prompt:', 'yellow');
  log('────────────────────────────────', 'blue');
  log('1. Open Command Prompt as Administrator');
  log('2. Add to PATH permanently:');
  log(`   ${instructions.cmd.addUser}`, 'green');
  log('   Note: This will truncate PATH if it\'s too long (>1024 chars)');
  
  // Manual instructions
  log('\nOption 3: Manual Configuration (Safest):', 'yellow');
  log('─────────────────────────────────────────', 'blue');
  instructions.manual.steps.forEach(step => log(step));
  
  // Additional tips
  log('\n💡 Tips:', 'bright');
  log('• After updating PATH, restart your terminal', 'blue');
  log('• For corporate environments, you may need IT assistance', 'blue');
  log('• If PATH is too long, consider removing unused entries', 'blue');
  
  // Verification
  log('\n🔍 To verify installation after PATH update:', 'bright');
  log('1. Open a new terminal window');
  log('2. Run: datapilot --version');
  log('3. If it works, you\'re all set!\n');
  
  // Alternative: Direct execution
  log('📌 Alternative - Run without PATH configuration:', 'yellow');
  log(`   ${path.join(globalPath, 'datapilot')} --help\n`);
  
  // npm scripts alternative
  if (packageManager === 'npm') {
    log('📦 Or add to package.json scripts:', 'yellow');
    log('   "scripts": {');
    log('     "datapilot": "datapilot"');
    log('   }');
    log('   Then run: npm run datapilot -- --help\n');
  }
}

// Run the main function
main().catch(error => {
  log(`\n❌ Error: ${error.message}`, 'red');
  process.exit(1);
});