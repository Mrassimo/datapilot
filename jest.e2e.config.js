/** @type {import('jest').Config} */
const baseConfig = require('./jest.config.js');

module.exports = {
  ...baseConfig,
  testMatch: ['**/tests/e2e/**/*.test.ts'],
  displayName: 'E2E Tests',
  coverageDirectory: 'coverage/e2e',
  // E2E tests need even more time and must run sequentially
  testTimeout: 120000,
  maxWorkers: 1,
  // Don't collect coverage for e2e tests
  collectCoverage: false,
  // E2E tests may have complex cleanup scenarios
  detectOpenHandles: false,
  forceExit: true,
};