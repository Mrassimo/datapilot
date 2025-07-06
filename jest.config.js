/** @type {import('jest').Config} */

// Enhanced CI detection for various environments
function isCI() {
  return !!(
    process.env.CI ||                    // Standard CI environment variable
    process.env.GITHUB_ACTIONS ||       // GitHub Actions
    process.env.GITLAB_CI ||            // GitLab CI
    process.env.CIRCLECI ||             // CircleCI
    process.env.TRAVIS ||               // Travis CI
    process.env.BUILDKITE ||            // Buildkite
    process.env.JENKINS_URL ||          // Jenkins
    process.env.TEAMCITY_VERSION ||     // TeamCity
    process.env.TF_BUILD ||             // Azure DevOps
    process.env.CODEBUILD_BUILD_ID ||   // AWS CodeBuild
    process.env.BUILD_ID ||             // Generic build ID
    process.env.NODE_ENV === 'test'     // Test environment
  );
}

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
      branches: 55,
      functions: 65,
      lines: 65,
      statements: 65,
    },
  },
  // CI-friendly test execution - detect various CI environments
  testTimeout: isCI() ? 30000 : 10000, // Longer timeout for CI environments
  maxWorkers: isCI() ? 1 : '50%', // Single worker in CI to avoid resource conflicts
  
  // Clean test environment
  clearMocks: true,
  restoreMocks: true,
  resetMocks: true,
  
  // Better error detection and handling
  forceExit: isCI() ? true : false, // Force exit in CI to prevent hanging
  detectOpenHandles: true, // Enable to detect process leaks
  
  // Coverage reporting
  coverageDirectory: 'coverage',
  coverageReporters: ['text-summary', 'lcov', 'html'],
  collectCoverage: false, // Only collect when explicitly requested
  
  // Performance optimization
  cache: true,
  cacheDirectory: '<rootDir>/.jest-cache',
  
  // Error handling - show all failures in CI, bail locally for speed
  bail: isCI() ? false : 1,
  
  // Custom matchers and setup
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  
  // Verbose output for debugging (can be disabled in CI)
  verbose: false,
  silent: true, // No console.log spam
};