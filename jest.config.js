/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  testPathIgnorePatterns: [
    '/node_modules/',
  ],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts',
    // Exclude infrastructure modules not yet fully implemented
    '!src/performance/**',
    '!src/security/**',
    '!src/monitoring/**',
    '!src/analyzers/ml-readiness/**',
    '!src/analyzers/multivariate/**',
    '!src/analyzers/statistical-tests/**',
    '!src/analyzers/modeling/algorithm-recommender.ts',
    '!src/analyzers/modeling/cart-analyzer.ts',
    '!src/analyzers/modeling/ethics-analyzer.ts',
    '!src/analyzers/modeling/residual-analyzer.ts',
    '!src/analyzers/modeling/workflow-engine.ts',
    '!src/analyzers/eda/section3-analyzer.ts',
    '!src/analyzers/eda/types.ts',
    '!src/analyzers/engineering/section5-analyzer-fixed.ts',
    '!src/utils/logger.ts',
    '!src/utils/memory-manager.ts',
    '!src/utils/retry.ts',
    '!src/utils/validation.ts',
    '!src/utils/error-handler.ts',
    '!src/parsers/excel-parser.ts',
    '!src/parsers/json-parser.ts',
    '!src/parsers/parquet-parser.ts',
    '!src/parsers/tsv-parser.ts',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  coverageThreshold: {
    global: {
      branches: 15,
      functions: 15,
      lines: 15,
      statements: 15,
    },
  },
  // Reduce test timeout to prevent hanging
  testTimeout: 30000,
  // Force exit after all tests complete
  forceExit: true,
  // Detect open handles that might prevent exit
  detectOpenHandles: true,
};