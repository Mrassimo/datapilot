#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Creates a fully bundled package for offline installation
 * This ensures all dependencies are embedded in the package
 */

console.log('🚀 Creating offline-installable package...');

try {
  // Step 1: Clean and prepare
  console.log('1️⃣ Cleaning previous builds...');
  execSync('npm run clean', { stdio: 'inherit' });
  
  // Step 2: Ensure fresh dependency install
  console.log('2️⃣ Installing fresh dependencies...');
  execSync('npm ci', { stdio: 'inherit' });
  
  // Step 3: Build the project
  console.log('3️⃣ Building TypeScript...');
  execSync('npm run build', { stdio: 'inherit' });
  
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
  const result = execSync('npm pack', { encoding: 'utf8', stdio: 'pipe' });
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

## To install on an offline machine:

1. Copy ${packageFilename} to the target machine
2. Run: npm install -g ${packageFilename}
3. Verify: datapilot --version

## Alternative local installation:
1. Extract: tar -xzf ${packageFilename}
2. cd package/  
3. npm install --production --offline
4. npm link (optional, for global access)

## Package contents:
- All source code in dist/
- All dependencies bundled
- No internet connection required for installation
`;

  fs.writeFileSync('OFFLINE_INSTALL.md', installInstructions);
  console.log('📝 Created OFFLINE_INSTALL.md with installation instructions');
  
  console.log('\n🎉 Offline package creation complete!');
  console.log(`📦 Package: ${packageFilename}`);
  console.log('📖 Instructions: OFFLINE_INSTALL.md');
  
  // Test the package locally
  console.log('\n🧪 Testing package installation...');
  try {
    execSync(`npm install -g ${packageFilename}`, { stdio: 'inherit' });
    execSync('datapilot --version', { stdio: 'inherit' });
    execSync('npm uninstall -g datapilot-cli', { stdio: 'inherit' });
    console.log('✅ Package installation test successful');
  } catch (error) {
    console.log('⚠️  Package installation test failed - please verify manually');
  }

} catch (error) {
  console.error('❌ Error creating offline package:', error.message);
  process.exit(1);
}