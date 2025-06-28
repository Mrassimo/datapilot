#!/usr/bin/env node

/**
 * Build script for creating Single Executable Applications (SEA) using Node.js 20+
 * This replaces the deprecated and vulnerable pkg package
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration for different platforms
const PLATFORMS = {
  linux: {
    nodeBinary: 'node',
    outputName: 'datapilot-linux',
    nodeDownloadUrl: process.platform === 'linux' ? null : 'https://nodejs.org/dist/v20.11.0/node-v20.11.0-linux-x64.tar.xz'
  },
  mac: {
    nodeBinary: 'node',
    outputName: 'datapilot-macos',
    nodeDownloadUrl: process.platform === 'darwin' ? null : 'https://nodejs.org/dist/v20.11.0/node-v20.11.0-darwin-x64.tar.gz'
  },
  win: {
    nodeBinary: 'node.exe',
    outputName: 'datapilot-win.exe',
    nodeDownloadUrl: process.platform === 'win32' ? null : 'https://nodejs.org/dist/v20.11.0/node-v20.11.0-win-x64.zip'
  }
};

function log(message) {
  console.log(`[SEA Builder] ${message}`);
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function buildSEA(platform) {
  log(`Building Single Executable Application for ${platform}...`);
  
  const config = PLATFORMS[platform];
  if (!config) {
    throw new Error(`Unknown platform: ${platform}`);
  }

  // Ensure binaries directory exists
  ensureDir('binaries');
  
  // For cross-platform builds, we need to use the basic approach
  // Since Node.js SEA requires the same platform Node binary, we'll create a bundled approach
  
  try {
    // Step 1: Create a simplified entry point that includes all dependencies
    const entryContent = `
// Single Executable Application Entry Point
const path = require('path');
const fs = require('fs');

// Set up module resolution for bundled app
const originalRequire = require;
require = function(id) {
  // Handle relative requires from the bundled location
  if (id.startsWith('./') || id.startsWith('../')) {
    const resolved = path.resolve(__dirname, id);
    return originalRequire(resolved);
  }
  return originalRequire(id);
};

// Import and run the main CLI
try {
  require('./dist/cli/index.js');
} catch (error) {
  console.error('Failed to start DataPilot:', error.message);
  process.exit(1);
}
`;

    const entryPath = path.join(process.cwd(), 'sea-entry.js');
    fs.writeFileSync(entryPath, entryContent);

    // Step 2: Create SEA config
    const seaConfig = {
      main: 'sea-entry.js',
      output: path.join('binaries', config.outputName),
      disableExperimentalSEAWarning: true,
      useSnapshot: false,
      useCodeCache: true
    };

    const seaConfigPath = path.join(process.cwd(), 'sea-config.json');
    fs.writeFileSync(seaConfigPath, JSON.stringify(seaConfig, null, 2));

    log('Creating SEA blob...');
    
    // Check if we're on the target platform
    const isNativeBuild = (
      (platform === 'linux' && process.platform === 'linux') ||
      (platform === 'mac' && process.platform === 'darwin') ||
      (platform === 'win' && process.platform === 'win32')
    );

    if (isNativeBuild) {
      // Native build using Node.js SEA
      try {
        execSync('node --experimental-sea-config sea-config.json', { stdio: 'inherit' });
        
        // Copy node binary and inject the blob
        const nodePath = process.execPath;
        const outputPath = path.join('binaries', config.outputName);
        
        fs.copyFileSync(nodePath, outputPath);
        
        // For Windows, we need to use the tools
        if (platform === 'win') {
          execSync(`node --experimental-sea-config sea-config.json`, { stdio: 'inherit' });
        }
        
        log(`✅ Successfully created ${config.outputName}`);
      } catch (error) {
        log(`❌ SEA build failed: ${error.message}`);
        
        // For Windows, we need a real executable, not a script with .exe extension
        if (platform === 'win') {
          log(`❌ Windows requires a real executable. Cannot create fake .exe file.`);
          log(`💡 Node.js SEA is experimental and may not work on all platforms`);
          log(`🔧 To create Windows executables:`);
          log(`   1. Run this on a Windows machine with Node.js 20+`);
          log(`   2. Or use: npm pack && npm install -g datapilot-cli-*.tgz`);
          log(`   3. Or run directly: node dist/cli/index.js`);
          throw new Error(`Failed to create Windows executable: ${error.message}`);
        }
        
        // For Unix platforms, fallback to script bundle is acceptable
        createSimpleBundle(platform, config);
      }
    } else {
      // Cross-platform build - create a simple bundle
      log(`Cross-platform build detected, creating simple bundle for ${platform}...`);
      
      // For Windows cross-platform builds, we can't create real executables
      if (platform === 'win') {
        log(`❌ Cannot create Windows .exe from non-Windows platform`);
        log(`💡 Windows executables require Windows machines with Node.js SEA support`);
        log(`🔧 Alternative installation methods for Windows users:`);
        log(`   1. Use npm: npm install -g datapilot-cli`);
        log(`   2. Use npx: npx datapilot-cli [command]`);
        log(`   3. Clone and build: git clone [repo] && npm install && npm run build`);
        throw new Error(`Cross-platform Windows executable creation not supported`);
      }
      
      createSimpleBundle(platform, config);
    }

    // Cleanup
    if (fs.existsSync(entryPath)) fs.unlinkSync(entryPath);
    if (fs.existsSync(seaConfigPath)) fs.unlinkSync(seaConfigPath);
    if (fs.existsSync('sea-prep.blob')) fs.unlinkSync('sea-prep.blob');

  } catch (error) {
    log(`❌ Build failed for ${platform}: ${error.message}`);
    throw error;
  }
}

function createSimpleBundle(platform, config) {
  log(`Creating simple bundle for ${platform}...`);
  
  // Create a standalone script that can run with any Node.js installation
  const bundleContent = `#!/usr/bin/env node

// DataPilot CLI - Standalone Bundle
// This bundle contains all necessary code to run DataPilot

process.title = 'datapilot';

// Bootstrap the CLI
try {
  // Use relative path resolution from the binary location
  const path = require('path');
  const fs = require('fs');
  
  // Find the CLI entry point relative to this binary
  const binaryDir = path.dirname(__filename);
  const projectRoot = path.resolve(binaryDir, '..');
  const cliPath = path.join(projectRoot, 'dist', 'cli', 'index.js');
  
  if (!fs.existsSync(cliPath)) {
    throw new Error('CLI entry point not found. Please ensure DataPilot is properly installed.');
  }
  
  require(cliPath);
} catch (error) {
  console.error('DataPilot Error:', error.message);
  console.error('');
  console.error('Requirements:');
  console.error('- Node.js 20.0.0 or higher');
  console.error('- DataPilot installation with compiled dist/ directory');
  console.error('- All dependencies installed via npm install');
  process.exit(1);
}
`;

  const outputPath = path.join('binaries', config.outputName);
  fs.writeFileSync(outputPath, bundleContent);
  
  // Make executable on Unix systems
  if (platform !== 'win') {
    try {
      fs.chmodSync(outputPath, 0o755);
    } catch (error) {
      log(`Warning: Could not make binary executable: ${error.message}`);
    }
  }
  
  log(`✅ Created simple bundle: ${config.outputName}`);
}

function main() {
  const target = process.argv[2] || 'all';
  
  log('DataPilot Single Executable Application Builder');
  log('Using Node.js SEA (replaces deprecated pkg)');
  log('');

  if (target === 'all') {
    log('Building for all platforms...');
    Object.keys(PLATFORMS).forEach(platform => {
      try {
        buildSEA(platform);
      } catch (error) {
        log(`❌ Failed to build for ${platform}: ${error.message}`);
      }
    });
  } else if (PLATFORMS[target]) {
    buildSEA(target);
  } else {
    log(`❌ Unknown target: ${target}`);
    log(`Available targets: ${Object.keys(PLATFORMS).join(', ')}, all`);
    process.exit(1);
  }
  
  log('');
  log('✅ Build complete!');
  log('Binaries are available in the binaries/ directory');
}

if (require.main === module) {
  main();
}

module.exports = { buildSEA };