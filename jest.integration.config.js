/** @type {import('jest').Config} */
const baseConfig = require('./jest.config.js');

module.exports = {
  ...baseConfig,
  testMatch: ['**/tests/integration/**/*.test.ts'],
  displayName: 'Integration Tests',
  coverageDirectory: 'coverage/integration',
  // Integration tests need more time and should run sequentially
  testTimeout: 60000,
  maxWorkers: 1,
  // Don't collect coverage for integration tests by default
  collectCoverage: false,
  // Allow longer hanging operations in integration tests
  detectOpenHandles: false,
  forceExit: true,
};