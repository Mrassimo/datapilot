#!/usr/bin/env node
/**
 * Prepare script for npm
 * Handles proxy configurations and build setup
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('📦 Preparing DataPilot for installation...');

// Check if we're in a CI environment or npm install
const isCI = process.env.CI || process.env.CONTINUOUS_INTEGRATION;
const isNpmInstall = process.env.npm_lifecycle_event === 'prepare' && !fs.existsSync(path.join(__dirname, '..', 'src'));

if (isNpmInstall) {
  console.log('✓ Installing from npm, skipping build');
  process.exit(0);
}

// Detect proxy settings
const httpProxy = process.env.HTTP_PROXY || process.env.http_proxy;
const httpsProxy = process.env.HTTPS_PROXY || process.env.https_proxy;

if (httpProxy || httpsProxy) {
  console.log('🔒 Proxy detected:');
  if (httpProxy) console.log(`  HTTP_PROXY: ${httpProxy}`);
  if (httpsProxy) console.log(`  HTTPS_PROXY: ${httpsProxy}`);
}

// Build the project
try {
  console.log('🔨 Building DataPilot...');
  execSync('npm run build', { 
    stdio: 'inherit',
    env: { ...process.env }
  });
  console.log('✅ Build complete!');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  // Don't fail the install if build fails
  if (isNpmInstall) {
    console.log('⚠️  Build failed during install, but continuing...');
    process.exit(0);
  } else {
    process.exit(1);
  }
}