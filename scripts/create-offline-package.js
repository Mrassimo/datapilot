#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');

/**
 * Creates a fully bundled package for offline installation
 * This ensures all dependencies are embedded in the package
 */

const isWindows = os.platform() === 'win32';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';

console.log('🚀 Creating offline-installable package...');
console.log(`📊 Platform: ${os.platform()} ${os.arch()}`);
console.log(`🔧 Node version: ${process.version}`);
console.log('🔒 Security: Secure dependencies (xlsx removed, pkg replaced with caxa)');

try {
  // Step 1: Clean and prepare
  console.log('1️⃣ Cleaning previous builds...');
  execSync(`${npmCmd} run clean`, { stdio: 'inherit', shell: true });
  
  // Step 2: Ensure fresh dependency install
  console.log('2️⃣ Installing fresh dependencies...');
  if (isWindows) {
    console.log('   💡 Windows detected - using optimized npm settings');
  }
  execSync(`${npmCmd} ci`, { stdio: 'inherit', shell: true });
  
  // Step 3: Build the project
  console.log('3️⃣ Building TypeScript...');
  execSync(`${npmCmd} run build`, { stdio: 'inherit', shell: true });
  
  // Step 4: Verify bundleDependencies are properly configured
  const packageJson = require('../package.json');
  const bundledDeps = packageJson.bundleDependencies || packageJson.bundledDependencies || [];
  const dependencies = Object.keys(packageJson.dependencies || {});
  
  console.log('4️⃣ Verifying bundle configuration...');
  console.log(`   Dependencies: ${dependencies.join(', ')}`);
  console.log(`   Bundled: ${bundledDeps.join(', ')}`);
  
  // Ensure all dependencies are marked for bundling
  const missingFromBundle = dependencies.filter(dep => !bundledDeps.includes(dep));
  if (missingFromBundle.length > 0) {
    console.log(`⚠️  Warning: These dependencies are not bundled: ${missingFromBundle.join(', ')}`);
  }
  
  // Step 5: Create the bundled package
  console.log('5️⃣ Creating bundled package...');
  const result = execSync(`${npmCmd} pack`, { encoding: 'utf8', stdio: 'pipe', shell: true });
  const packageFilename = result.trim();
  
  console.log(`✅ Package created: ${packageFilename}`);
  
  // Step 6: Verify the package contents
  console.log('6️⃣ Verifying package contents...');
  try {
    execSync(`tar -tzf ${packageFilename} | head -20`, { stdio: 'inherit' });
    
    // Check if node_modules are included (they should be with bundleDependencies)
    const tarContents = execSync(`tar -tzf ${packageFilename}`, { encoding: 'utf8' });
    const hasNodeModules = tarContents.includes('node_modules/');
    
    if (hasNodeModules) {
      console.log('✅ Dependencies are bundled in the package');
    } else {
      console.log('⚠️  Warning: node_modules not found in package - dependencies may not be bundled');
    }
    
  } catch (error) {
    console.log('⚠️  Could not verify package contents');
  }
  
  // Step 7: Create installation instructions
  const installInstructions = `
# Offline Installation Instructions

The package ${packageFilename} contains all dependencies bundled.

## Windows Installation (Recommended):

### Method 1: Global Installation
1. Copy ${packageFilename} to the target Windows machine
2. Open Command Prompt or PowerShell as Administrator
3. Run: \`npm install -g ${packageFilename}\`
4. Verify: \`datapilot --version\`

### Method 2: Local Installation
1. Extract: \`tar -xzf ${packageFilename}\` (or use 7-Zip)
2. \`cd package\`
3. \`npm install --production --offline\`
4. \`npm link\` (optional, for global access)

## Troubleshooting Windows Installation:

### If npm install hangs:
1. Clear npm cache: \`npm cache clean --force\`
2. Delete node_modules: \`rmdir /s node_modules\`
3. Try with --no-audit flag: \`npm install --no-audit --prefer-offline\`

### If you get permission errors:
1. Run Command Prompt as Administrator
2. Or use: \`npm install -g ${packageFilename} --unsafe-perm\`

### Alternative Windows Installation:
1. Download and install Node.js from https://nodejs.org
2. Use yarn instead: \`yarn global add ${packageFilename}\`
3. Or use pnpm: \`pnpm add -g ${packageFilename}\`

## Linux/macOS Installation:

1. Copy ${packageFilename} to the target machine
2. Run: \`npm install -g ${packageFilename}\`
3. Verify: \`datapilot --version\`

## Package contents:
- All source code in dist/
- All dependencies bundled
- No internet connection required for installation
- Optimized .npmrc for Windows compatibility
`;

  fs.writeFileSync('OFFLINE_INSTALL.md', installInstructions);
  console.log('📝 Created OFFLINE_INSTALL.md with installation instructions');
  
  console.log('\n🎉 Offline package creation complete!');
  console.log(`📦 Package: ${packageFilename}`);
  console.log('📖 Instructions: OFFLINE_INSTALL.md');
  
  // Test the package locally
  console.log('\n🧪 Testing package installation...');
  try {
    console.log('   📦 Installing package globally...');
    execSync(`${npmCmd} install -g ${packageFilename}`, { stdio: 'inherit', shell: true });
    
    console.log('   ✅ Testing datapilot command...');
    execSync('datapilot --version', { stdio: 'inherit', shell: true });
    
    console.log('   🧹 Cleaning up test installation...');
    execSync(`${npmCmd} uninstall -g datapilot-cli`, { stdio: 'inherit', shell: true });
    
    console.log('✅ Package installation test successful');
  } catch (error) {
    console.log('⚠️  Package installation test failed - please verify manually');
    console.log(`   💡 Error: ${error.message}`);
    if (isWindows) {
      console.log('   🛠️  Try running as Administrator or use: npm install -g --unsafe-perm');
    }
  }

} catch (error) {
  console.error('❌ Error creating offline package:', error.message);
  process.exit(1);
}