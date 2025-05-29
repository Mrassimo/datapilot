import { calculateStats, calculateCorrelation, analyzeDistribution, findPatterns } from '../../src/utils/stats.js';

// Test calculateStats function
async function testCalculateStats() {
  console.log('\n=== Testing calculateStats ===');
  
  // Test with normal data
  const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const stats = await calculateStats(values);
  
  console.assert(stats.count === 10, 'Should count values correctly');
  console.assert(stats.mean === 5.5, 'Should calculate mean correctly');
  console.assert(stats.median === 5.5, 'Should calculate median correctly');
  console.assert(stats.min === 1, 'Should find minimum');
  console.assert(stats.max === 10, 'Should find maximum');
  console.assert(Math.abs(stats.std - 2.87) < 0.1, 'Should calculate std dev');
  
  console.log('✓ Basic statistics work');
  
  // Test with nulls
  const withNulls = [1, 2, null, 4, undefined, 6];
  const nullStats = await calculateStats(withNulls);
  
  console.assert(nullStats.count === 4, 'Should exclude nulls from count');
  console.assert(nullStats.mean === 3.25, 'Should calculate mean excluding nulls');
  
  console.log('✓ Null handling works');
  
  // Skip outlier detection test as it's not part of calculateStats anymore
  console.log('✓ Outlier detection moved to separate function');
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
async function testAnalyzeDistribution() {
  console.log('\n=== Testing analyzeDistribution ===');
  
  // Test with a larger dataset for better distribution detection
  const normal = Array.from({length: 50}, (_, i) => 25 + (Math.random() - 0.5) * 10);
  const normalDist = await analyzeDistribution(normal);
  
  console.assert(normalDist.type !== undefined, 'Should identify distribution type');
  console.assert(normalDist.description !== undefined, 'Should provide description');
  
  // Test discrete distribution
  const discrete = [1, 1, 1, 2, 2, 3, 4, 5, 5, 5];
  const discreteDist = await analyzeDistribution(discrete);
  
  console.assert(discreteDist.type === 'discrete', 'Should identify discrete distribution');
  console.assert(discreteDist.description.includes('Discrete'), 'Should describe as discrete');
  
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
async function runTests() {
  console.log('Running statistics unit tests...');
  
  await testCalculateStats();
  testCalculateCorrelation();
  await testAnalyzeDistribution();
  testFindPatterns();
  
  console.log('\nStatistics tests completed');
}

runTests().catch(console.error);