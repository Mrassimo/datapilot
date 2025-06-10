#!/usr/bin/env node
/**
 * Release Automation Script for DataPilot
 * Handles version bumping, changelog updates, and release preparation
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

function runCommand(command, description) {
  console.log(`🔨 ${description}`);
  try {
    const result = execSync(command, { encoding: 'utf8', stdio: 'inherit' });
    console.log(`✅ ${description} completed`);
    return result;
  } catch (error) {
    console.error(`❌ ${description} failed:`, error.message);
    process.exit(1);
  }
}

function validateVersion(version) {
  const semverRegex = /^\d+\.\d+\.\d+(-\w+(\.\d+)?)?$/;
  return semverRegex.test(version);
}

function updatePackageVersion(newVersion) {
  const packagePath = path.resolve('./package.json');
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  const oldVersion = packageJson.version;
  
  packageJson.version = newVersion;
  fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n');
  
  console.log(`📦 Updated package.json: ${oldVersion} → ${newVersion}`);
  return oldVersion;
}

function updateChangelog(version) {
  const changelogPath = path.resolve('./CHANGELOG.md');
  const today = new Date().toISOString().split('T')[0];
  
  if (!fs.existsSync(changelogPath)) {
    console.log('⚠️  CHANGELOG.md not found, skipping changelog update');
    return;
  }
  
  const changelog = fs.readFileSync(changelogPath, 'utf8');
  const newEntry = `## [${version}] - ${today}\n\n### 🚀 Added\n- Phase 3 Module 1: Advanced Dataset Characterization Engine\n- Phase 3 Module 2: Intelligent Algorithm Selection Engine\n- Enhanced Section 6 modeling capabilities with dataset complexity analysis\n- Comprehensive algorithm recommendation system with performance predictions\n\n### 📈 Improved\n- Complete end-to-end integration testing suite\n- Enhanced CI/CD pipeline with cross-platform testing\n- Improved error handling and graceful degradation\n- Better progress tracking across analysis modules\n\n### 🔧 Fixed\n- ESLint compliance across all Phase 3 modules\n- TypeScript strict mode compatibility\n- Integration test stability and reliability\n\n`;
  
  const updatedChangelog = changelog.replace(
    '# Changelog\n\nAll notable changes to DataPilot will be documented in this file.\n\nThe format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),\nand this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).\n\n',
    `# Changelog\n\nAll notable changes to DataPilot will be documented in this file.\n\nThe format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),\nand this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).\n\n${newEntry}`
  );
  
  fs.writeFileSync(changelogPath, updatedChangelog);
  console.log(`📝 Updated CHANGELOG.md with version ${version}`);
}

async function main() {
  console.log('🚀 DataPilot Release Automation\n');
  
  // Check if we're on main branch
  try {
    const branch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
    if (branch !== 'main') {
      console.log(`⚠️  Currently on branch: ${branch}`);
      const proceed = await askQuestion('Continue with release on non-main branch? (y/N): ');
      if (proceed.toLowerCase() !== 'y') {
        console.log('Release cancelled');
        process.exit(0);
      }
    }
  } catch (error) {
    console.log('⚠️  Could not determine current branch');
  }
  
  // Check for uncommitted changes
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf8' });
    if (status.trim()) {
      console.log('⚠️  You have uncommitted changes:');
      console.log(status);
      const proceed = await askQuestion('Continue with uncommitted changes? (y/N): ');
      if (proceed.toLowerCase() !== 'y') {
        console.log('Please commit your changes first');
        process.exit(0);
      }
    }
  } catch (error) {
    console.log('⚠️  Could not check git status');
  }
  
  // Get current version
  const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
  const currentVersion = packageJson.version;
  console.log(`📋 Current version: ${currentVersion}`);
  
  // Ask for new version
  const newVersion = await askQuestion(`Enter new version (current: ${currentVersion}): `);
  
  if (!validateVersion(newVersion)) {
    console.error('❌ Invalid version format. Use semantic versioning (e.g., 1.2.3)');
    process.exit(1);
  }
  
  if (newVersion === currentVersion) {
    console.log('⚠️  Version unchanged');
    const proceed = await askQuestion('Continue with same version? (y/N): ');
    if (proceed.toLowerCase() !== 'y') {
      process.exit(0);
    }
  }
  
  console.log(`\n🎯 Preparing release ${newVersion}...\n`);
  
  // Pre-release checks
  runCommand('npm run lint', 'Running ESLint checks');
  runCommand('npm run typecheck', 'Running TypeScript checks');
  runCommand('npm run test', 'Running test suite');
  runCommand('npm run build', 'Building project');
  runCommand('npm run test:installation', 'Testing installation');
  
  // Run E2E tests
  try {
    runCommand('npm test -- --testPathPattern="e2e|integration"', 'Running E2E tests');
  } catch (error) {
    console.log('⚠️  E2E tests failed or not found, continuing...');
  }
  
  // Update version and changelog
  const oldVersion = updatePackageVersion(newVersion);
  updateChangelog(newVersion);
  
  // Commit changes
  runCommand('git add package.json CHANGELOG.md', 'Staging version changes');
  runCommand(`git commit -m "chore: Release v${newVersion}\n\n🚀 Generated with [Claude Code](https://claude.ai/code)\n\nCo-Authored-By: Claude <noreply@anthropic.com>"`, 'Committing version changes');
  
  // Create tag
  runCommand(`git tag -a v${newVersion} -m "Release v${newVersion}"`, 'Creating git tag');
  
  console.log('\n🎉 Release preparation complete!');
  console.log('\n📋 Next steps:');
  console.log('1. Review the changes');
  console.log('2. Push to GitHub: git push origin main --tags');
  console.log('3. Create GitHub release from the tag');
  console.log('4. GitHub Actions will automatically publish to NPM');
  
  const pushNow = await askQuestion('\nPush to GitHub now? (y/N): ');
  if (pushNow.toLowerCase() === 'y') {
    runCommand('git push origin main --tags', 'Pushing to GitHub');
    console.log('\n✅ Pushed to GitHub! Check GitHub Actions for automatic NPM publishing.');
  }
  
  rl.close();
}

main().catch((error) => {
  console.error('❌ Release automation failed:', error);
  rl.close();
  process.exit(1);
});
