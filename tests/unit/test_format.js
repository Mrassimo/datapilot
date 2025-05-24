import { 
  formatNumber, 
  formatCurrency, 
  formatPercentage, 
  formatDate,
  formatFileSize,
  createSection,
  createSubSection,
  bulletList,
  numberedList
} from '../../src/utils/format.js';

// Test number formatting
function testFormatNumber() {
  console.log('\n=== Testing formatNumber ===');
  
  console.assert(formatNumber(1234.567) === '1.23K', 'Should format thousands');
  console.assert(formatNumber(1234567) === '1.23M', 'Should format millions');
  console.assert(formatNumber(123.45) === '123.45', 'Should format small numbers');
  console.assert(formatNumber(NaN) === 'N/A', 'Should handle NaN');
  
  console.log('✓ Number formatting works');
}

// Test currency formatting
function testFormatCurrency() {
  console.log('\n=== Testing formatCurrency ===');
  
  console.assert(formatCurrency(1234.56) === '$1,234.56', 'Should format currency with commas');
  console.assert(formatCurrency(0.99) === '$0.99', 'Should format small amounts');
  console.assert(formatCurrency(-100) === '$-100.00', 'Should handle negative amounts');
  console.assert(formatCurrency(NaN) === 'N/A', 'Should handle NaN');
  
  console.log('✓ Currency formatting works');
}

// Test percentage formatting
function testFormatPercentage() {
  console.log('\n=== Testing formatPercentage ===');
  
  console.assert(formatPercentage(0.5) === '50.0%', 'Should format 50%');
  console.assert(formatPercentage(0.123) === '12.3%', 'Should format with 1 decimal');
  console.assert(formatPercentage(1) === '100.0%', 'Should format 100%');
  console.assert(formatPercentage(NaN) === 'N/A', 'Should handle NaN');
  
  console.log('✓ Percentage formatting works');
}

// Test date formatting
function testFormatDate() {
  console.log('\n=== Testing formatDate ===');
  
  const date = new Date('2024-05-24');
  console.assert(formatDate(date) === '2024-05-24', 'Should format date as ISO');
  console.assert(formatDate('not a date') === 'N/A', 'Should handle invalid dates');
  
  console.log('✓ Date formatting works');
}

// Test file size formatting
function testFormatFileSize() {
  console.log('\n=== Testing formatFileSize ===');
  
  console.assert(formatFileSize(1024) === '1.00 KB', 'Should format KB');
  console.assert(formatFileSize(1048576) === '1.00 MB', 'Should format MB');
  console.assert(formatFileSize(500) === '500.00 B', 'Should format bytes');
  
  console.log('✓ File size formatting works');
}

// Test section creation
function testSectionCreation() {
  console.log('\n=== Testing section creation ===');
  
  const section = createSection('TEST SECTION', 'Test content');
  console.assert(section.includes('=== TEST SECTION ==='), 'Should create section header');
  console.assert(section.includes('Test content'), 'Should include content');
  
  const subSection = createSubSection('Sub Test', 'Sub content');
  console.assert(subSection.includes('Sub Test:'), 'Should create subsection');
  
  console.log('✓ Section creation works');
}

// Test list formatting
function testListFormatting() {
  console.log('\n=== Testing list formatting ===');
  
  const bullet = bulletList(['Item 1', 'Item 2', 'Item 3']);
  console.assert(bullet.includes('- Item 1'), 'Should create bullet list');
  
  const numbered = numberedList(['First', 'Second', 'Third']);
  console.assert(numbered.includes('1. First'), 'Should create numbered list');
  console.assert(numbered.includes('3. Third'), 'Should number correctly');
  
  console.log('✓ List formatting works');
}

// Run all tests
function runTests() {
  console.log('Running format unit tests...');
  
  testFormatNumber();
  testFormatCurrency();
  testFormatPercentage();
  testFormatDate();
  testFormatFileSize();
  testSectionCreation();
  testListFormatting();
  
  console.log('\nFormat tests completed');
}

runTests();