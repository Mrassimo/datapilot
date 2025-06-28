#!/usr/bin/env node

const { execSync } = require('child_process');

console.log('🚀 Creating offline-installable package...');

try {
  execSync('npm pack', { stdio: 'inherit' });
  console.log('\n🎉 Offline package creation complete!');
} catch (error) {
  console.error('❌ Error creating offline package:', error.message);
  process.exit(1);
}
