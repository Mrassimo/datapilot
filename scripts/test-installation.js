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

// Check if datapilot command exists
console.log('🔍 Checking DataPilot command...');
try {
  const version = execSync('datapilot --version', { encoding: 'utf8' }).trim();
  console.log(`✅ DataPilot found: ${version}`);
} catch (error) {
  console.log('❌ DataPilot command not found');
  console.log('💡 Try using: npx @datapilot/cli --version');
  
  // Check npm global bin
  try {
    const npmBin = execSync('npm bin -g', { encoding: 'utf8' }).trim();
    console.log(`\n📁 npm global bin: ${npmBin}`);
    console.log('💡 Add this to your PATH environment variable');
    
    // Windows-specific PATH instructions
    if (os.platform() === 'win32') {
      console.log('\nWindows PATH setup:');
      console.log('1. Open System Properties → Advanced → Environment Variables');
      console.log('2. Edit PATH variable');
      console.log(`3. Add: ${npmBin}`);
      console.log('4. Restart your terminal');
    }
  } catch (e) {
    console.log('Could not determine npm bin location');
  }
  
  process.exit(1);
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

// Test analysis
console.log('\n🔬 Running test analysis...');
try {
  // Test basic functionality
  execSync(`datapilot "${testFile}" --format json --sections 1,2 --output test-output.json`, { stdio: 'inherit' });
  
  // Verify output file exists
  const outputFile = path.join(process.cwd(), 'test-output.json');
  if (fs.existsSync(outputFile)) {
    const output = JSON.parse(fs.readFileSync(outputFile, 'utf8'));
    if (output.section1 && output.section2) {
      console.log('✅ Analysis completed successfully!');
      console.log(`✅ Generated ${Object.keys(output).length} analysis sections`);
      fs.unlinkSync(outputFile); // Cleanup output
    } else {
      console.log('❌ Analysis output incomplete');
    }
  } else {
    console.log('❌ No output file generated');
  }
} catch (error) {
  console.log('❌ Analysis failed');
  console.log('Error:', error.message);
  
  // Try alternative method (direct node execution)
  console.log('\n🔄 Trying direct execution...');
  try {
    const cliPath = path.resolve('./dist/cli/index.js');
    if (fs.existsSync(cliPath)) {
      execSync(`node "${cliPath}" "${testFile}" --format json --sections 1,2`, { stdio: 'inherit' });
      console.log('✅ Direct execution successful!');
    } else {
      console.log('❌ CLI not built. Run "npm run build" first.');
    }
  } catch (directError) {
    console.log('❌ Direct execution also failed');
    console.log('Error:', directError.message);
  }
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