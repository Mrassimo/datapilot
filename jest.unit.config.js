/** @type {import('jest').Config} */
const baseConfig = require('./jest.config.js');

module.exports = {
  ...baseConfig,
  testPathIgnorePatterns: [
    '/node_modules/',
    'integration.*test\\.ts$',
    'error-reduction.*test\\.ts$',
    'e2e.*test\\.ts$',
    'comprehensive-e2e\\.test\\.ts$',
    'performance-validation\\.test\\.ts$',
    'phase2-integration\\.test\\.ts$',
    'phase3-module-integration\\.test\\.ts$',
    'real-world-end-to-end\\.test\\.ts$',
  ],
  displayName: 'Unit Tests',
  coverageDirectory: 'coverage/unit',
};