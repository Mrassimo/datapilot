#!/usr/bin/env node
/**
 * Post-install script
 * Shows helpful information after installation
 */

const os = require('os');
const path = require('path');

console.log('\n🎉 DataPilot installed successfully!\n');

// Platform-specific instructions
const platform = os.platform();
const isWindows = platform === 'win32';

console.log('📚 Quick Start:');
console.log('  datapilot --help                 # Show help');
console.log('  datapilot analyze data.csv       # Analyze a CSV file');
console.log('  datapilot analyze data.csv --sections 1,2,3  # Run specific sections\n');

// Windows-specific notes
if (isWindows) {
  console.log('💡 Windows Users:');
  console.log('  - If "datapilot" command is not found, try:');
  console.log('    npx datapilot analyze data.csv');
  console.log('  - Or add npm global bin to PATH:');
  console.log(`    ${process.env.APPDATA}\\npm\n`);
}

// Proxy configuration help
if (process.env.HTTP_PROXY || process.env.HTTPS_PROXY) {
  console.log('🔒 Proxy Configuration Detected');
  console.log('  DataPilot will respect your proxy settings automatically.\n');
}

// Large file note
console.log('💾 Working with Large Files:');
console.log('  DataPilot uses streaming to handle files of any size efficiently.');
console.log('  For files over 1GB, use: datapilot analyze large.csv --preset low-memory\n');

// Configuration note
console.log('⚙️  Configuration:');
console.log('  Create a .datapilotrc file for custom settings.');
console.log('  See: https://github.com/Mrassimo/datapilot#configuration\n');

console.log('📖 Full documentation: https://github.com/Mrassimo/datapilot');
console.log('🐛 Report issues: https://github.com/Mrassimo/datapilot/issues\n');