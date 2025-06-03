/**
 * Unit tests for error handling and recovery mechanisms
 */

import { EDAEngine } from '../../src/analysis/edaEngine.js';
import { QualityEngine } from '../../src/analysis/qualityEngine.js';
import chalk from 'chalk';

// Test helpers
let testsPassed = 0;
let testsFailed = 0;
const errors = [];

function assert(condition, message) {
  if (condition) {
    testsPassed++;
    console.log(chalk.green(`  ✓ ${message}`));
  } else {
    testsFailed++;
    errors.push(message);
    console.log(chalk.red(`  ✗ ${message}`));
  }
}

function assertExists(value, message) {
  assert(value !== undefined && value !== null, message);
}

function assertIncludes(array, value, message) {
  assert(Array.isArray(array) && array.includes(value), message);
}

// Mock data for testing
const mockValidData = [
  { id: 1, value: 100, category: 'A' },
  { id: 2, value: 200, category: 'B' },
  { id: 3, value: 300, category: 'A' }
];

const mockColumnTypes = {
  id: { type: 'integer' },
  value: { type: 'float' },
  category: { type: 'categorical' }
};

const mockProblematicData = [
  { col1: undefined, col2: null },
  { col1: 'invalid', col2: {} }
];

// Test EDA Engine error handling
async function testEDAEngineErrorHandling() {
  console.log(chalk.blue('\n=== Testing EDA Engine Error Handling ==='));
  
  const edaEngine = new EDAEngine({ verbose: false });
  
  // Test 1: Handling null/undefined data
  console.log('  Testing null data handling...');
  try {
    const result = await edaEngine.performComprehensiveAnalysis(null, {}, 'test.csv');
    assert(result.error, 'Error object exists in result');
    assert(result.error.engineName === 'EDA Engine', 'Engine name in error');
    assert(result.recoveryRecommendations.length > 0, 'Recovery recommendations provided');
  } catch (error) {
    assert(false, 'Should handle null data gracefully, not throw');
  }
  
  // Test 2: Handling corrupted column types
  console.log('  Testing corrupted column types...');
  try {
    const result = await edaEngine.performComprehensiveAnalysis(mockValidData, null, 'test.csv');
    assert(result.error, 'Error object exists for corrupted types');
    assertExists(result.summary, 'Summary exists even with error');
  } catch (error) {
    assert(false, 'Should handle corrupted types gracefully');
  }
  
  // Test 3: Partial results recovery
  console.log('  Testing partial results recovery...');
  const partialResults = {
    basicStats: { someData: true },
    distributions: {},
    correlations: null
  };
  
  const salvaged = edaEngine.salvageResults(partialResults);
  assert(salvaged.basicStats.someData === true, 'Preserves existing valid data');
  assert(salvaged.distributions.incomplete === true, 'Marks empty sections as incomplete');
  assert(salvaged.correlations.incomplete === true, 'Marks null sections as incomplete');
  assertExists(salvaged.summary, 'Adds missing sections with defaults');
  
  // Test 4: Recovery recommendations for different error types
  console.log('  Testing recovery recommendations...');
  
  // Memory error
  const memError = new Error('JavaScript heap out of memory');
  const memRecs = edaEngine.generateRecoveryRecommendations(memError, {});
  assertIncludes(memRecs, 'Try using a smaller dataset or enable aggressive sampling', 'Memory error recommendations');
  
  // Column type error
  const typeError = new Error('Cannot read property type of undefined');
  const typeRecs = edaEngine.generateRecoveryRecommendations(typeError, {});
  assertIncludes(typeRecs, 'Check data consistency - some columns may have mixed types', 'Type error recommendations');
  
  // Generic error with partial results
  const genericError = new Error('Unknown analysis error');
  const partialData = { basicStats: { data: true }, correlations: { data: true } };
  const genericRecs = edaEngine.generateRecoveryRecommendations(genericError, partialData);
  assertIncludes(genericRecs, 'Partial results available - check which analysis sections completed', 'Partial results recommendations');
}

// Test Quality Engine error handling
async function testQualityEngineErrorHandling() {
  console.log(chalk.blue('\n=== Testing Quality Engine Error Handling ==='));
  
  const qualityEngine = new QualityEngine({ verbose: false });
  
  // Test 1: Handling analysis failure
  console.log('  Testing quality analysis failure handling...');
  try {
    const result = await qualityEngine.performQualityAnalysis(null, {}, 'test.csv');
    assert(result.error, 'Error object exists in quality result');
    assert(result.error.engineName === 'Quality Engine', 'Quality engine name in error');
    assertExists(result.dimensions, 'Dimensions structure exists even with error');
  } catch (error) {
    assert(false, 'Quality engine should handle errors gracefully');
  }
  
  // Test 2: Salvaging quality results
  console.log('  Testing quality results salvaging...');
  const partialQuality = {
    dimensions: {
      completeness: { score: 0.8 },
      validity: null,
      accuracy: undefined
    },
    businessRules: 'invalid',
    anomalies: [{ type: 'outlier' }]
  };
  
  const salvagedQuality = qualityEngine.salvageQualityResults(partialQuality);
  assert(salvagedQuality.dimensions.completeness.score === 0.8, 'Preserves valid dimension data');
  assert(salvagedQuality.dimensions.validity.incomplete === true, 'Marks null dimensions as incomplete');
  assert(salvagedQuality.dimensions.accuracy.incomplete === true, 'Marks undefined dimensions as incomplete');
  assert(Array.isArray(salvagedQuality.businessRules), 'Fixes invalid businessRules to array');
  assert(salvagedQuality.anomalies.length === 1, 'Preserves valid anomalies array');
  
  // Test 3: Quality-specific recovery recommendations
  console.log('  Testing quality-specific recommendations...');
  
  // Validation error
  const validationError = new Error('Data validation failed: schema mismatch');
  const validationRecs = qualityEngine.generateQualityRecoveryRecommendations(validationError, {});
  assertIncludes(validationRecs, 'Check for corrupt or malformed data in the CSV file', 'Validation error recommendations');
  
  // Fuzzy duplicate error
  const fuzzyError = new Error('fuzzy duplicate analysis out of memory');
  const fuzzyRecs = qualityEngine.generateQualityRecoveryRecommendations(fuzzyError, {});
  assertIncludes(fuzzyRecs, 'Disable fuzzy duplicate analysis for large datasets', 'Fuzzy analysis recommendations');
  
  // Memory error
  const memoryError = new Error('heap allocation failed');
  const memoryRecs = qualityEngine.generateQualityRecoveryRecommendations(memoryError, {});
  assertIncludes(memoryRecs, 'Try using a smaller dataset or enable aggressive sampling', 'Memory error recommendations');
}

// Test error boundaries integration
async function testErrorBoundariesIntegration() {
  console.log(chalk.blue('\n=== Testing Error Boundaries Integration ==='));
  
  // Test that both engines return consistent error structures
  const edaEngine = new EDAEngine();
  const qualityEngine = new QualityEngine();
  
  // Simulate the same error in both engines
  const testError = new Error('Test error for consistency');
  const testPartialResults = { someData: true };
  
  const edaError = edaEngine.handleEngineError(testError, testPartialResults, 'EDA Engine');
  const qualityError = qualityEngine.handleEngineError(testError, testPartialResults, 'Quality Engine');
  
  // Check consistency
  assertExists(edaError.error, 'EDA error has error property');
  assertExists(qualityError.error, 'Quality error has error property');
  
  assert(edaError.error.message === testError.message, 'EDA preserves error message');
  assert(qualityError.error.message === testError.message, 'Quality preserves error message');
  
  assertExists(edaError.error.timestamp, 'EDA error has timestamp');
  assertExists(qualityError.error.timestamp, 'Quality error has timestamp');
  
  assert(edaError.error.partialDataAvailable === true, 'EDA tracks partial data availability');
  assert(qualityError.error.partialDataAvailable === true, 'Quality tracks partial data availability');
  
  assertExists(edaError.recoveryRecommendations, 'EDA provides recovery recommendations');
  assertExists(qualityError.recoveryRecommendations, 'Quality provides recovery recommendations');
}

// Test error logging behavior
async function testErrorLoggingBehavior() {
  console.log(chalk.blue('\n=== Testing Error Logging Behavior ==='));
  
  // Capture console output
  const originalConsoleError = console.error;
  const capturedLogs = [];
  console.error = (...args) => capturedLogs.push(args.join(' '));
  
  try {
    // Test verbose mode
    const verboseEngine = new EDAEngine({ verbose: true });
    const error = new Error('Test error with stack');
    error.stack = 'Error: Test error\n  at testFunction\n  at main';
    
    verboseEngine.handleEngineError(error, {}, 'Test Engine');
    
    assert(capturedLogs.some(log => log.includes('Test Engine error')), 'Logs engine error');
    assert(capturedLogs.some(log => log.includes('Stack trace:')), 'Logs stack trace in verbose mode');
    
    // Test non-verbose mode
    capturedLogs.length = 0;
    const quietEngine = new EDAEngine({ verbose: false });
    quietEngine.handleEngineError(error, {}, 'Test Engine');
    
    assert(capturedLogs.some(log => log.includes('Test Engine error')), 'Still logs basic error');
    assert(!capturedLogs.some(log => log.includes('Stack trace:')), 'No stack trace in non-verbose mode');
    
  } finally {
    console.error = originalConsoleError;
  }
}

// Test real-world error scenarios
async function testRealWorldScenarios() {
  console.log(chalk.blue('\n=== Testing Real-World Error Scenarios ==='));
  
  const edaEngine = new EDAEngine();
  
  // Scenario 1: Completely empty dataset
  console.log('  Testing empty dataset scenario...');
  const emptyResult = await edaEngine.performComprehensiveAnalysis([], {}, 'empty.csv');
  assertExists(emptyResult.error, 'Handles empty dataset');
  assert(emptyResult.summary.error === true, 'Summary indicates error state');
  
  // Scenario 2: Mismatched data and column types
  console.log('  Testing mismatched data scenario...');
  const mismatchedTypes = {
    value: { type: 'date' }, // Wrong type
    missing: { type: 'integer' } // Column doesn't exist
  };
  const mismatchResult = await edaEngine.performComprehensiveAnalysis(mockValidData, mismatchedTypes, 'test.csv');
  assertExists(mismatchResult.error || mismatchResult.basicStats, 'Handles mismatched types');
  
  // Scenario 3: Circular reference in data (can cause JSON issues)
  console.log('  Testing circular reference scenario...');
  const circularData = [{ id: 1 }];
  circularData[0].self = circularData[0]; // Create circular reference
  
  try {
    const circularResult = await edaEngine.performComprehensiveAnalysis(circularData, { id: { type: 'integer' } }, 'test.csv');
    assert(true, 'Handles circular references without crashing');
  } catch (error) {
    assert(false, 'Should handle circular references gracefully');
  }
}

// Main test runner
async function runAllTests() {
  console.log(chalk.magenta('='.repeat(60)));
  console.log(chalk.magenta('ERROR HANDLING UNIT TESTS'));
  console.log(chalk.magenta('='.repeat(60)));
  
  try {
    await testEDAEngineErrorHandling();
    await testQualityEngineErrorHandling();
    await testErrorBoundariesIntegration();
    await testErrorLoggingBehavior();
    await testRealWorldScenarios();
    
    console.log(chalk.blue('\n=== Test Summary ==='));
    console.log(chalk.green(`Passed: ${testsPassed}`));
    console.log(testsFailed > 0 ? chalk.red(`Failed: ${testsFailed}`) : chalk.green(`Failed: ${testsFailed}`));
    
    if (errors.length > 0) {
      console.log(chalk.red('\nFailures:'));
      errors.forEach(error => console.log(chalk.red(`  - ${error}`)));
    }
    
    process.exit(testsFailed > 0 ? 1 : 0);
  } catch (error) {
    console.error(chalk.red(`\nFatal error: ${error.message}`));
    console.error(error.stack);
    process.exit(1);
  }
}

// Run tests
runAllTests();