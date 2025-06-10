#!/usr/bin/env node
/**
 * NPM Package Validation Script
 * Validates package structure, metadata, and functionality before publishing
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function validatePackageJson() {
  console.log('📦 Validating package.json...');
  
  const packagePath = path.resolve('./package.json');
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  const requiredFields = ['name', 'version', 'description', 'main', 'bin', 'keywords', 'author', 'license'];
  const missingFields = requiredFields.filter(field => !packageJson[field]);
  
  if (missingFields.length > 0) {
    console.error(`❌ Missing required fields: ${missingFields.join(', ')}`);
    return false;
  }
  
  // Check version format
  const versionRegex = /^\d+\.\d+\.\d+(-\w+(\.\d+)?)?$/;
  if (!versionRegex.test(packageJson.version)) {
    console.error(`❌ Invalid version format: ${packageJson.version}`);
    return false;
  }
  
  // Check required files
  const requiredFiles = ['README.md', 'LICENSE', 'CHANGELOG.md'];
  const missingFiles = requiredFiles.filter(file => !fs.existsSync(path.resolve(file)));
  
  if (missingFiles.length > 0) {
    console.error(`❌ Missing required files: ${missingFiles.join(', ')}`);
    return false;
  }
  
  console.log('✅ package.json validation passed');
  return true;
}

function validateDistDirectory() {
  console.log('📁 Validating dist directory...');
  
  const distPath = path.resolve('./dist');
  if (!fs.existsSync(distPath)) {
    console.error('❌ dist directory not found. Run "npm run build" first.');
    return false;
  }
  
  const requiredFiles = [
    'index.js',
    'index.d.ts',
    'cli/index.js'
  ];
  
  const missingFiles = requiredFiles.filter(file => 
    !fs.existsSync(path.join(distPath, file))
  );
  
  if (missingFiles.length > 0) {
    console.error(`❌ Missing dist files: ${missingFiles.join(', ')}`);
    return false;
  }
  
  console.log('✅ dist directory validation passed');
  return true;
}

function validateCLI() {
  console.log('🔨 Validating CLI functionality...');
  
  const cliPath = path.resolve('./dist/cli/index.js');
  
  try {
    // Test version command
    const version = execSync(`node "${cliPath}" --version`, { encoding: 'utf8' }).trim();
    if (!version.match(/^\d+\.\d+\.\d+/)) {
      console.error(`❌ Invalid version output: ${version}`);
      return false;
    }
    
    // Test help command
    const help = execSync(`node "${cliPath}" --help`, { encoding: 'utf8' });
    if (!help.includes('Usage:') || !help.includes('datapilot')) {
      console.error('❌ Help output missing required content');
      return false;
    }
    
    console.log('✅ CLI validation passed');
    return true;
  } catch (error) {
    console.error(`❌ CLI validation failed: ${error.message}`);
    return false;
  }
}

function validateDependencies() {
  console.log('🔗 Validating dependencies...');
  
  try {
    // Check for security vulnerabilities
    execSync('npm audit --audit-level moderate', { stdio: 'inherit' });
    
    // Check for outdated dependencies
    const outdated = execSync('npm outdated --json', { encoding: 'utf8' });
    const outdatedPackages = JSON.parse(outdated || '{}');
    
    if (Object.keys(outdatedPackages).length > 0) {
      console.log('⚠️  Outdated dependencies found:');
      console.log(JSON.stringify(outdatedPackages, null, 2));
    }
    
    console.log('✅ Dependencies validation passed');
    return true;
  } catch (error) {
    console.error(`❌ Dependencies validation failed: ${error.message}`);
    return false;
  }
}

function validateLicense() {
  console.log('📄 Validating license...');
  
  const licensePath = path.resolve('./LICENSE');
  if (!fs.existsSync(licensePath)) {
    console.error('❌ LICENSE file not found');
    return false;
  }
  
  const license = fs.readFileSync(licensePath, 'utf8');
  if (license.length < 100) {
    console.error('❌ LICENSE file appears to be incomplete');
    return false;
  }
  
  console.log('✅ License validation passed');
  return true;
}

function validateReadme() {
  console.log('📝 Validating README...');
  
  const readmePath = path.resolve('./README.md');
  if (!fs.existsSync(readmePath)) {
    console.error('❌ README.md not found');
    return false;
  }
  
  const readme = fs.readFileSync(readmePath, 'utf8');
  
  const requiredSections = [
    '# DataPilot',
    '## Installation',
    '## Usage',
    '## Features'
  ];
  
  const missingSections = requiredSections.filter(section => 
    !readme.includes(section)
  );
  
  if (missingSections.length > 0) {
    console.error(`❌ README missing sections: ${missingSections.join(', ')}`);
    return false;
  }
  
  if (readme.length < 1000) {
    console.error('❌ README appears to be too short');
    return false;
  }
  
  console.log('✅ README validation passed');
  return true;
}

function validateChangelog() {
  console.log('📅 Validating CHANGELOG...');
  
  const changelogPath = path.resolve('./CHANGELOG.md');
  if (!fs.existsSync(changelogPath)) {
    console.error('❌ CHANGELOG.md not found');
    return false;
  }
  
  const changelog = fs.readFileSync(changelogPath, 'utf8');
  
  if (!changelog.includes('# Changelog')) {
    console.error('❌ CHANGELOG missing main heading');
    return false;
  }
  
  // Check for version entries
  const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
  const currentVersion = packageJson.version;
  
  if (!changelog.includes(`[${currentVersion}]`)) {
    console.log(`⚠️  Current version ${currentVersion} not found in CHANGELOG`);
  }
  
  console.log('✅ CHANGELOG validation passed');
  return true;
}

function validateFileSize() {
  console.log('📊 Validating package size...');
  
  try {
    // Create a test pack
    const packResult = execSync('npm pack --dry-run --json', { encoding: 'utf8' });
    const packData = JSON.parse(packResult);
    
    const packageSize = packData[0].size;
    const maxSize = 50 * 1024 * 1024; // 50MB limit
    
    if (packageSize > maxSize) {
      console.error(`❌ Package too large: ${(packageSize / 1024 / 1024).toFixed(2)}MB > 50MB`);
      return false;
    }
    
    console.log(`✅ Package size OK: ${(packageSize / 1024 / 1024).toFixed(2)}MB`);
    return true;
  } catch (error) {
    console.error(`❌ Package size validation failed: ${error.message}`);
    return false;
  }
}

function main() {
  console.log('🔍 DataPilot Package Validation\n');
  
  const validations = [
    validatePackageJson,
    validateDistDirectory,
    validateCLI,
    validateDependencies,
    validateLicense,
    validateReadme,
    validateChangelog,
    validateFileSize
  ];
  
  const results = validations.map(validation => {
    try {
      return validation();
    } catch (error) {
      console.error(`❌ Validation error: ${error.message}`);
      return false;
    }
  });
  
  const passed = results.filter(Boolean).length;
  const total = results.length;
  
  console.log(`\n📈 Validation Results: ${passed}/${total} passed`);
  
  if (passed === total) {
    console.log('✅ Package validation successful! Ready for publishing.');
    process.exit(0);
  } else {
    console.log('❌ Package validation failed. Please fix the issues above.');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  validatePackageJson,
  validateDistDirectory,
  validateCLI,
  validateDependencies,
  validateLicense,
  validateReadme,
  validateChangelog,
  validateFileSize
};
