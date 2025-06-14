/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: [
    '**/tests/unit/**/*.test.ts',
    '**/tests/integration/**/*.test.ts', 
    '**/tests/e2e/**/*.test.ts'
  ],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts',
    // Only exclude truly unimplemented or infrastructure files
    '!src/cli/index.ts', // Entry point
    '!src/index.ts', // Library entry point
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 85,
      lines: 85,
      statements: 85,
    },
  },
  // Fast test execution
  testTimeout: 5000,
  maxWorkers: '50%',
  
  // Clean test environment
  clearMocks: true,
  restoreMocks: true,
  resetMocks: true,
  
  // No hanging tests allowed
  forceExit: false,
  detectOpenHandles: false,
  
  // Coverage reporting
  coverageDirectory: 'coverage',
  coverageReporters: ['text-summary', 'lcov', 'html'],
  collectCoverage: false, // Only collect when explicitly requested
  
  // Performance optimization
  cache: true,
  cacheDirectory: '<rootDir>/.jest-cache',
  
  // Error handling
  bail: 1, // Stop on first test failure for faster feedback
  
  // Custom matchers and setup
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  
  // Verbose output for debugging (can be disabled in CI)
  verbose: false,
  silent: true, // No console.log spam
};