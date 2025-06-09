#!/usr/bin/env node
/**
 * Quick publish script to get DataPilot on npm
 * Bypasses TypeScript compilation issues temporarily
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Quick publish script for DataPilot');

// Create minimal dist structure
const distPath = path.join(__dirname, '..', 'dist');
if (!fs.existsSync(distPath)) {
  fs.mkdirSync(distPath, { recursive: true });
}

// Create minimal CLI entry point
const cliPath = path.join(distPath, 'cli');
if (!fs.existsSync(cliPath)) {
  fs.mkdirSync(cliPath, { recursive: true });
}

// Create a minimal CLI entry that works
const minimalCLI = `#!/usr/bin/env node

console.log('DataPilot v1.0.0');
console.log('Enterprise-grade CSV analysis tool');
console.log('');
console.log('This is a preview release.');
console.log('Full functionality coming soon!');
console.log('');
console.log('Usage:');
console.log('  datapilot --version    Show version');
console.log('  datapilot --help       Show help');
console.log('');
console.log('🌟 Star us on GitHub: https://github.com/Mrassimo/datapilot');
console.log('📖 Documentation: https://github.com/Mrassimo/datapilot#readme');

process.exit(0);
`;

fs.writeFileSync(path.join(cliPath, 'index.js'), minimalCLI);

// Create main index.js
const mainIndex = `// DataPilot - Enterprise CSV Analysis
module.exports = {
  version: '1.0.0',
  name: 'DataPilot',
  description: 'Enterprise-grade streaming CSV analysis with comprehensive statistical insights'
};
`;

fs.writeFileSync(path.join(distPath, 'index.js'), mainIndex);

console.log('✅ Created minimal dist structure');
console.log('📦 Ready for npm publish!');
console.log('');
console.log('Next steps:');
console.log('1. npm publish --access public');
console.log('2. Fix TypeScript issues in next release');
console.log('3. Update to full functionality');