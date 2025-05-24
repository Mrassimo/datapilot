import { calculateStats, calculateCorrelation, analyzeDistribution, findPatterns } from '../../src/utils/stats.js';

// Test calculateStats function
function testCalculateStats() {
  console.log('\n=== Testing calculateStats ===');
  
  // Test with normal data
  const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const stats = calculateStats(values);
  
  console.assert(stats.count === 10, 'Should count values correctly');
  console.assert(stats.mean === 5.5, 'Should calculate mean correctly');
  console.assert(stats.median === 5.5, 'Should calculate median correctly');
  console.assert(stats.min === 1, 'Should find minimum');
  console.assert(stats.max === 10, 'Should find maximum');
  console.assert(Math.abs(stats.standardDeviation - 2.87) < 0.1, 'Should calculate std dev');
  
  console.log('✓ Basic statistics work');
  
  // Test with nulls
  const withNulls = [1, 2, null, 4, undefined, 6];
  const nullStats = calculateStats(withNulls);
  
  console.assert(nullStats.count === 4, 'Should exclude nulls from count');
  console.assert(nullStats.nullCount === 2, 'Should count nulls');
  console.assert(nullStats.mean === 3.25, 'Should calculate mean excluding nulls');
  
  console.log('✓ Null handling works');
  
  // Test outlier detection
  const withOutliers = [1, 2, 3, 4, 5, 100];
  const outlierStats = calculateStats(withOutliers);
  
  console.assert(outlierStats.outliers.length > 0, 'Should detect outliers');
  console.assert(outlierStats.outliers.includes(100), 'Should identify 100 as outlier');
  
  console.log('✓ Outlier detection works');
}

// Test calculateCorrelation function
function testCalculateCorrelation() {
  console.log('\n=== Testing calculateCorrelation ===');
  
  // Perfect positive correlation
  const x1 = [1, 2, 3, 4, 5];
  const y1 = [2, 4, 6, 8, 10];
  const corr1 = calculateCorrelation(x1, y1);
  
  console.assert(Math.abs(corr1 - 1) < 0.01, 'Should detect perfect positive correlation');
  
  // Perfect negative correlation
  const y2 = [10, 8, 6, 4, 2];
  const corr2 = calculateCorrelation(x1, y2);
  
  console.assert(Math.abs(corr2 - (-1)) < 0.01, 'Should detect perfect negative correlation');
  
  // No correlation
  const y3 = [3, 1, 4, 1, 5];
  const corr3 = calculateCorrelation(x1, y3);
  
  console.assert(Math.abs(corr3) < 0.5, 'Should detect weak correlation');
  
  console.log('✓ Correlation calculation works');
}

// Test analyzeDistribution function
function testAnalyzeDistribution() {
  console.log('\n=== Testing analyzeDistribution ===');
  
  // Normal distribution
  const normal = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  const normalDist = analyzeDistribution(normal);
  
  console.assert(normalDist.type === 'normal' || normalDist.type === 'moderately-skewed', 
    'Should identify approximately normal distribution');
  
  // Right-skewed distribution
  const rightSkewed = [1, 1, 1, 2, 2, 3, 4, 5, 10, 20, 50];
  const rightDist = analyzeDistribution(rightSkewed);
  
  console.assert(rightDist.skewness > 1, 'Should calculate positive skewness');
  console.assert(rightDist.description.includes('skewed'), 'Should identify skewed distribution');
  
  console.log('✓ Distribution analysis works');
}

// Test findPatterns function
function testFindPatterns() {
  console.log('\n=== Testing findPatterns ===');
  
  const records = [
    { id: 1, value: 10 },
    { id: 2, value: null },
    { id: 3, value: 10 },
    { id: 4, value: 20 },
    { id: 5, value: null },
    { id: 6, value: 10 }
  ];
  
  const patterns = findPatterns(records, 'value');
  
  console.assert(patterns.missing.length === 2, 'Should find missing values');
  console.assert(patterns.duplicates['10'].length === 3, 'Should find duplicates');
  
  console.log('✓ Pattern detection works');
}

// Run all tests
function runTests() {
  console.log('Running statistics unit tests...');
  
  testCalculateStats();
  testCalculateCorrelation();
  testAnalyzeDistribution();
  testFindPatterns();
  
  console.log('\nStatistics tests completed');
}

runTests();