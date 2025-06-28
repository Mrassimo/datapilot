
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
