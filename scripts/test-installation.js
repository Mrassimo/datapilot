#!/usr/bin/env node
/**
 * Test installation script
 * Helps users verify DataPilot is installed correctly
 */

const { execSync } = require('child_process');
const os = require('os');
const fs = require('fs');
const path = require('path');

console.log('🧪 Testing DataPilot Installation...\n');

// System info
console.log('📋 System Information:');
console.log(`- Platform: ${os.platform()}`);
console.log(`- Node.js: ${process.version}`);
console.log(`- npm: ${execSync('npm --version').toString().trim()}`);
console.log(`- Current directory: ${process.cwd()}\n`);

// Check CLI availability - prioritize direct execution in CI environments
console.log('🔍 Checking DataPilot CLI availability...');

let cliAvailable = false;
let cliMethod = '';
let cliVersion = '';

// Method 1: Direct execution (works in all environments)
const cliPath = path.resolve('./dist/cli/index.js');
if (fs.existsSync(cliPath)) {
  try {
    cliVersion = execSync(`node "${cliPath}" --version`, { encoding: 'utf8' }).trim();
    cliAvailable = true;
    cliMethod = 'direct';
    console.log(`✅ DataPilot CLI found (direct): ${cliVersion}`);
  } catch (error) {
    console.log('❌ Direct execution failed');
  }
}

// Method 2: Global command (if available and direct method failed)
if (!cliAvailable) {
  try {
    cliVersion = execSync('datapilot --version', { encoding: 'utf8' }).trim();
    cliAvailable = true;
    cliMethod = 'global';
    console.log(`✅ DataPilot found (global): ${cliVersion}`);
  } catch (error) {
    console.log('❌ Global datapilot command not found');
  }
}

// Method 3: npx (if other methods failed)
if (!cliAvailable) {
  try {
    cliVersion = execSync('npx datapilot-cli --version', { encoding: 'utf8' }).trim();
    cliAvailable = true;
    cliMethod = 'npx';
    console.log(`✅ DataPilot found (npx): ${cliVersion}`);
  } catch (error) {
    console.log('❌ npx execution failed');
  }
}

// If CLI not available by any method, provide guidance
if (!cliAvailable) {
  console.log('\n❌ DataPilot CLI not accessible by any method');
  console.log('\n🔧 Installation Options:');
  console.log('1. Global: npm install -g datapilot-cli');
  console.log('2. Local build: npm run build && node dist/cli/index.js');
  console.log('3. npx: npx datapilot-cli --version');
  
  // Check npm global configuration (using modern npm commands)
  try {
    const npmPrefix = execSync('npm config get prefix', { encoding: 'utf8' }).trim();
    const npmBin = path.join(npmPrefix, process.platform === 'win32' ? '' : 'bin');
    console.log(`\n📁 npm global bin: ${npmBin}`);
    console.log('💡 Add this to your PATH environment variable');
    
    if (process.platform === 'win32') {
      console.log('\nWindows PATH setup:');
      console.log('1. Open System Properties → Advanced → Environment Variables');
      console.log('2. Edit PATH variable');
      console.log(`3. Add: ${npmBin}`);
      console.log('4. Restart your terminal');
    }
  } catch (e) {
    console.log('\n❌ Could not determine npm configuration');
  }
  
  // Don't exit - continue with tests using available method
  console.log('\n⚠️  Continuing with available CLI method...');
}

// Create test CSV
console.log('\n📝 Creating test CSV file...');
const testCsv = `Name,Age,Score
Alice,25,95
Bob,30,87
Charlie,35,92
David,28,88
Eve,32,91`;

const testFile = path.join(process.cwd(), 'datapilot-test.csv');
fs.writeFileSync(testFile, testCsv);
console.log(`✅ Created: ${testFile}`);

// Test analysis using detected CLI method
if (cliAvailable) {
  console.log(`\n🔬 Running test analysis (using ${cliMethod} method)...`);
  
  let analysisCommand = '';
  switch (cliMethod) {
    case 'direct':
      analysisCommand = `node "${cliPath}" overview "${testFile}" --output json`;
      break;
    case 'global':
      analysisCommand = `datapilot overview "${testFile}" --output json`;
      break;
    case 'npx':
      analysisCommand = `npx datapilot-cli overview "${testFile}" --output json`;
      break;
  }
  
  try {
    execSync(analysisCommand, { stdio: 'inherit' });
    
    // Verify output file exists (default naming pattern)
    const outputFile = path.join(process.cwd(), 'datapilot-test_datapilot_report.json');
    if (fs.existsSync(outputFile)) {
      const output = JSON.parse(fs.readFileSync(outputFile, 'utf8'));
      if (output.metadata || output.overview) {
        console.log('✅ Analysis completed successfully!');
        console.log(`✅ Generated analysis report using ${cliMethod} method`);
        fs.unlinkSync(outputFile); // Cleanup output
      } else {
        console.log('❌ Analysis output incomplete');
      }
    } else {
      console.log('❌ No output file generated');
    }
  } catch (error) {
    console.log(`❌ Analysis failed using ${cliMethod} method`);
    console.log('Error:', error.message);
    
    // Try fallback to direct execution if not already using it
    if (cliMethod !== 'direct' && fs.existsSync(cliPath)) {
      console.log('\n🔄 Trying direct execution fallback...');
      try {
        execSync(`node "${cliPath}" overview "${testFile}" --output json`, { stdio: 'inherit' });
        console.log('✅ Direct execution fallback successful!');
      } catch (directError) {
        console.log('❌ Direct execution fallback also failed');
        console.log('Error:', directError.message);
      }
    }
  }
} else {
  console.log('\n⚠️  Skipping analysis test - no CLI method available');
  console.log('💡 Ensure DataPilot is built with: npm run build');
}

// Cleanup
fs.unlinkSync(testFile);
console.log('\n🧹 Cleaned up test file');

// Proxy check
if (process.env.HTTP_PROXY || process.env.HTTPS_PROXY) {
  console.log('\n🔒 Proxy Configuration:');
  if (process.env.HTTP_PROXY) console.log(`- HTTP_PROXY: ${process.env.HTTP_PROXY}`);
  if (process.env.HTTPS_PROXY) console.log(`- HTTPS_PROXY: ${process.env.HTTPS_PROXY}`);
  console.log('✅ DataPilot will use these proxy settings');
}

console.log('\n✨ Installation test complete!');
console.log('📖 Run "datapilot --help" for usage information');