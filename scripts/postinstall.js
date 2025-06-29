#!/usr/bin/env node
/**
 * Post-install script
 * Shows helpful information after installation
 */

const os = require('os');
const path = require('path');
const fs = require('fs');

// Set executable permissions on the CLI binary
try {
  const binPath = path.join(__dirname, '..', 'dist', 'cli', 'index.js');
  if (fs.existsSync(binPath)) {
    fs.chmodSync(binPath, 0o755);
  }
} catch (error) {
  // Ignore permission errors - some systems might not allow this
}

console.log('\n🎉 DataPilot installed successfully!\n');

// Platform-specific instructions
const platform = os.platform();
const isWindows = platform === 'win32';

// Windows-specific setup assistance
if (isWindows) {
  // Run the comprehensive Windows installation helper
  try {
    const windowsSetupScript = path.join(__dirname, 'post-install-windows.js');
    if (fs.existsSync(windowsSetupScript)) {
      // Import and run the Windows helper (it has its own main function)
      const windowsHelper = require(windowsSetupScript);
      // The Windows script runs automatically on import, no need to call anything
    } else {
      // Fallback to basic instructions if helper script is not available
      console.log('🚨 WINDOWS USERS - IMPORTANT SETUP REQUIRED:');
      console.log('═══════════════════════════════════════════════════════════');
      console.log('⚠️  The "datapilot" command may not work immediately on Windows');
      console.log('⚠️  due to PATH configuration issues. Here are your options:\n');
      
      console.log('🟢 OPTION 1 - Use npx (Recommended, no setup needed):');
      console.log('   npx datapilot-cli --version');
      console.log('   npx datapilot-cli all data.csv\n');
      
      console.log('🟡 OPTION 2 - Add to PATH (One-time setup):');
      try {
        const { execSync } = require('child_process');
        const npmPrefix = execSync('npm config get prefix', { encoding: 'utf8' }).trim();
        console.log(`   1. Add this to your PATH: ${npmPrefix}`);
        console.log('   2. Restart PowerShell/Command Prompt');
        console.log('   3. Then run: datapilot --version\n');
      } catch (error) {
        console.log('   1. Run: npm config get prefix');
        console.log('   2. Add the returned path to your PATH environment variable');
        console.log('   3. Restart PowerShell/Command Prompt\n');
      }
      
      console.log('═══════════════════════════════════════════════════════════\n');
    }
  } catch (error) {
    // If there's any error with the Windows helper, continue with basic setup
    console.log('🚨 WINDOWS USERS - BASIC SETUP INFORMATION:');
    console.log('Please refer to the documentation for PATH configuration help.');
    console.log('For detailed setup assistance, run: datapilot --help-windows\n');
  }
}

console.log('📚 Quick Start:');
if (isWindows) {
  console.log('  npx datapilot-cli --version       # Check version (recommended for Windows)');
  console.log('  npx datapilot-cli --help          # Show all commands');
  console.log('  npx datapilot-cli overview data.csv # Quick file overview');
  console.log('  npx datapilot-cli all data.csv    # Complete analysis (all 6 sections)\n');
} else {
  console.log('  datapilot --version              # Check version');
  console.log('  datapilot --help                 # Show all commands');
  console.log('  datapilot overview data.csv      # Quick file overview');
  console.log('  datapilot all data.csv           # Complete analysis (all 6 sections)\n');
}

// PATH troubleshooting for non-Windows platforms
if (!isWindows) {
  console.log('🔧 If "datapilot: command not found":');
  console.log('  - Use npx instead: npx datapilot-cli --version');
  console.log('  - Or check PATH: npm config get prefix');
  console.log('  - Add npm global bin to your PATH environment variable\n');
}

// Proxy configuration help
if (process.env.HTTP_PROXY || process.env.HTTPS_PROXY) {
  console.log('🔒 Proxy Configuration Detected');
  console.log('  DataPilot will respect your proxy settings automatically.\n');
}

// Large file note
console.log('💾 Working with Large Files:');
console.log('  DataPilot uses streaming to handle files of any size efficiently.');
console.log('  For files over 1GB, memory will be managed automatically.\n');

// Configuration note
console.log('⚙️  Configuration:');
console.log('  Create a .datapilotrc file for custom settings.');
console.log('  See: https://github.com/Mrassimo/datapilot#configuration\n');

console.log('📖 Full documentation: https://github.com/Mrassimo/datapilot');
console.log('🐛 Report issues: https://github.com/Mrassimo/datapilot/issues\n');