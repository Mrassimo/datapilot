/**
 * Unit tests for consolidated column detector
 */

import { 
  detectColumnTypes,
  analyzeColumnValues,
  parseNumber,
  parseDate,
  getNumericColumns,
  getCategoricalColumns,
  getDateColumns,
  getGeographicColumns,
  isGeographicColumn,
  detectColumnContext,
  PATTERNS,
  GEOGRAPHIC_KEYWORDS,
  BUSINESS_KEYWORDS
} from '../../src/utils/columnDetector.js';

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

function assertEqual(actual, expected, message) {
  assert(actual === expected, `${message} (expected: ${expected}, got: ${actual})`);
}

function assertArrayEqual(actual, expected, message) {
  const equal = actual.length === expected.length && 
                 actual.every((val, idx) => val === expected[idx]);
  assert(equal, `${message} (expected: [${expected}], got: [${actual}])`);
}

function assertIncludes(array, value, message) {
  assert(array.includes(value), `${message} (${value} not in [${array}])`);
}

// Test suites
async function testPatterns() {
  console.log(chalk.blue('\n=== Testing Regex Patterns ==='));
  
  // Australian patterns
  assert(PATTERNS.australian.postcode.test('2000'), 'Australian postcode pattern matches 2000');
  assert(PATTERNS.australian.postcode.test('3141'), 'Australian postcode pattern matches 3141');
  assert(!PATTERNS.australian.postcode.test('20000'), 'Australian postcode pattern rejects 5 digits');
  assert(!PATTERNS.australian.postcode.test('200'), 'Australian postcode pattern rejects 3 digits');
  
  assert(PATTERNS.australian.phone.test('0412345678'), 'Australian mobile pattern matches');
  assert(PATTERNS.australian.phone.test('04 1234 5678'), 'Australian mobile with spaces matches');
  assert(PATTERNS.australian.phone.test('+61412345678'), 'Australian mobile with country code matches');
  assert(PATTERNS.australian.phone.test('02 9876 5432'), 'Australian landline matches');
  
  assert(PATTERNS.australian.states.test('NSW'), 'Australian state code NSW matches');
  assert(PATTERNS.australian.states.test('vic'), 'Australian state code VIC (lowercase) matches');
  assert(PATTERNS.australian.stateNames.test('New South Wales'), 'Australian state name matches');
  
  // Email patterns
  assert(PATTERNS.email.test('test@example.com'), 'Email pattern matches standard email');
  assert(PATTERNS.email.test('user.name+tag@company.co.uk'), 'Email pattern matches complex email');
  assert(!PATTERNS.email.test('not.an.email'), 'Email pattern rejects invalid email');
  
  // Date patterns
  assert(PATTERNS.date.iso.test('2024-03-15'), 'ISO date pattern matches');
  assert(PATTERNS.date.australian.test('15/03/2024'), 'Australian date pattern matches DD/MM/YYYY');
  assert(PATTERNS.date.australian.test('1/3/2024'), 'Australian date pattern matches D/M/YYYY');
  
  // Currency patterns
  assert(PATTERNS.currency.test('$100.50'), 'Currency pattern matches USD');
  assert(PATTERNS.currency.test('€1,234.56'), 'Currency pattern matches EUR');
  assert(PATTERNS.currency.test('£999'), 'Currency pattern matches GBP');
  assert(PATTERNS.currency.test('100.50 $'), 'Currency pattern matches trailing symbol');
  
  // Percentage pattern
  assert(PATTERNS.percentage.test('50%'), 'Percentage pattern matches');
  assert(PATTERNS.percentage.test('99.9%'), 'Percentage pattern matches decimal');
  assert(!PATTERNS.percentage.test('50'), 'Percentage pattern requires % symbol');
  
  // UUID pattern
  assert(PATTERNS.uuid.test('550e8400-e29b-41d4-a716-446655440000'), 'UUID pattern matches valid v4');
  assert(!PATTERNS.uuid.test('not-a-uuid'), 'UUID pattern rejects invalid format');
  
  // IP pattern
  assert(PATTERNS.ip.test('192.168.1.1'), 'IP pattern matches valid IPv4');
  assert(PATTERNS.ip.test('10.0.0.1'), 'IP pattern matches private IP');
  assert(!PATTERNS.ip.test('256.256.256.256'), 'IP pattern accepts invalid range (needs improvement)');
}

async function testParseNumber() {
  console.log(chalk.blue('\n=== Testing parseNumber Function ==='));
  
  // Basic numbers
  assertEqual(parseNumber('123'), 123, 'Parse integer');
  assertEqual(parseNumber('123.45'), 123.45, 'Parse float');
  assertEqual(parseNumber('-123.45'), -123.45, 'Parse negative');
  
  // Currency
  assertEqual(parseNumber('$100.50'), 100.50, 'Parse USD currency');
  assertEqual(parseNumber('€1,234.56'), 1234.56, 'Parse EUR with thousands');
  assertEqual(parseNumber('100.50 $'), 100.50, 'Parse trailing currency');
  
  // Percentage
  assertEqual(parseNumber('50%'), 0.5, 'Parse percentage to decimal');
  assertEqual(parseNumber('99.9%'), 0.999, 'Parse decimal percentage');
  
  // European format
  assertEqual(parseNumber('1.234,56'), 1234.56, 'Parse European format');
  assertEqual(parseNumber('1 234,56'), 1234.56, 'Parse with space separator');
  
  // Edge cases
  assertEqual(parseNumber('  123  '), 123, 'Parse with whitespace');
  assertEqual(parseNumber(''), null, 'Empty string returns null');
  assertEqual(parseNumber('abc'), null, 'Non-numeric returns null');
  assertEqual(parseNumber('2024-03-15'), null, 'Date string returns null');
}

async function testParseDate() {
  console.log(chalk.blue('\n=== Testing parseDate Function ==='));
  
  // Australian format (prioritized)
  const ausDate = parseDate('15/03/2024', true);
  assert(ausDate instanceof Date, 'Parse Australian date returns Date object');
  assertEqual(ausDate.getDate(), 15, 'Australian date day correct');
  assertEqual(ausDate.getMonth(), 2, 'Australian date month correct (0-based)');
  assertEqual(ausDate.getFullYear(), 2024, 'Australian date year correct');
  
  // ISO format
  const isoDate = parseDate('2024-03-15');
  assert(isoDate instanceof Date, 'Parse ISO date returns Date object');
  assertEqual(isoDate.getDate(), 15, 'ISO date day correct');
  
  // Edge cases
  assertEqual(parseDate('not a date'), null, 'Invalid date returns null');
  assertEqual(parseDate(''), null, 'Empty string returns null');
  assertEqual(parseDate(null), null, 'Null returns null');
  
  // Ambiguous dates with Australian priority
  const ambiguous = parseDate('01/02/2024', true);
  assertEqual(ambiguous.getDate(), 1, 'Ambiguous date uses DD/MM with Australian priority');
  assertEqual(ambiguous.getMonth(), 1, 'Ambiguous date month is February (0-based)');
}

async function testAnalyzeColumnValues() {
  console.log(chalk.blue('\n=== Testing analyzeColumnValues Function ==='));
  
  // Integer detection
  const intResult = analyzeColumnValues([1, 2, 3, 4, 5], 5);
  assertEqual(intResult.type, 'integer', 'Detect integer type');
  assertEqual(intResult.confidence, 1, 'Integer confidence 100%');
  assertEqual(intResult.min, 1, 'Integer min correct');
  assertEqual(intResult.max, 5, 'Integer max correct');
  assertEqual(intResult.mean, 3, 'Integer mean correct');
  
  // Float detection
  const floatResult = analyzeColumnValues([1.1, 2.2, 3.3], 3);
  assertEqual(floatResult.type, 'float', 'Detect float type');
  
  // Currency detection
  const currencyResult = analyzeColumnValues(['$100', '$200.50', '$300'], 3);
  assertEqual(currencyResult.type, 'currency', 'Detect currency type');
  assertIncludes(currencyResult.businessContext, 'quantitative', 'Currency has quantitative context');
  
  // Email detection
  const emailResult = analyzeColumnValues(['test@example.com', 'user@domain.org'], 2);
  assertEqual(emailResult.type, 'email', 'Detect email type');
  assertIncludes(emailResult.businessContext, 'communication', 'Email has communication context');
  
  // Categorical detection
  const catResult = analyzeColumnValues(['A', 'B', 'A', 'C', 'B', 'A'], 6);
  assertEqual(catResult.type, 'categorical', 'Detect categorical type');
  assertEqual(catResult.categories.length, 3, 'Categorical has 3 unique values');
  assertArrayEqual(catResult.categories, ['A', 'B', 'C'], 'Categories sorted correctly');
  
  // Australian postcode
  const postcodeResult = analyzeColumnValues(['2000', '3000', '4000'], 3);
  assertEqual(postcodeResult.type, 'postcode', 'Detect Australian postcode');
  assertIncludes(postcodeResult.businessContext, 'geographic', 'Postcode has geographic context');
  
  // Mixed types (should pick most prevalent)
  const mixedResult = analyzeColumnValues(['100', '200', 'not a number'], 3);
  assertEqual(mixedResult.confidence < 1, true, 'Mixed types have lower confidence');
}

async function testDetectColumnTypes() {
  console.log(chalk.blue('\n=== Testing detectColumnTypes Function ==='));
  
  const testData = [
    { 
      name: 'John', 
      age: 25, 
      email: 'john@test.com', 
      postcode: '2000',
      salary: '$50,000',
      joined: '2024-01-15',
      active: true
    },
    { 
      name: 'Jane', 
      age: 30, 
      email: 'jane@test.com', 
      postcode: '3000',
      salary: '$60,000',
      joined: '2024-02-20',
      active: false
    }
  ];
  
  const columnTypes = detectColumnTypes(testData);
  
  assertEqual(Object.keys(columnTypes).length, 7, 'Detected all 7 columns');
  assertEqual(columnTypes.name.type, 'categorical', 'Name detected as categorical');
  assertEqual(columnTypes.age.type, 'integer', 'Age detected as integer');
  assertEqual(columnTypes.email.type, 'email', 'Email detected correctly');
  assertEqual(columnTypes.postcode.type, 'postcode', 'Postcode detected correctly');
  assertEqual(columnTypes.salary.type, 'currency', 'Salary detected as currency');
  assertEqual(columnTypes.joined.type, 'date', 'Date detected correctly');
  assertEqual(columnTypes.active.type, 'boolean', 'Boolean detected correctly');
  
  // Check business contexts
  assert(columnTypes.email.businessContext.includes('communication'), 'Email has communication context');
  assert(columnTypes.postcode.isGeographic, 'Postcode marked as geographic');
  assert(columnTypes.salary.businessContext.includes('quantitative'), 'Salary has quantitative context');
}

async function testColumnUtilities() {
  console.log(chalk.blue('\n=== Testing Column Utility Functions ==='));
  
  const columnTypes = {
    id: { type: 'identifier' },
    name: { type: 'categorical' },
    age: { type: 'integer' },
    salary: { type: 'currency' },
    email: { type: 'email' },
    date: { type: 'date' },
    postcode: { type: 'postcode', isGeographic: true },
    city: { type: 'categorical', businessContext: ['geographic'], isGeographic: true }
  };
  
  // Test getNumericColumns
  const numericCols = getNumericColumns(columnTypes);
  assert(numericCols.includes('age'), 'Numeric columns include age');
  assert(numericCols.includes('salary'), 'Numeric columns include salary');
  assertEqual(numericCols.length, 2, 'Found 2 numeric columns');
  
  // Test getCategoricalColumns
  const categoricalCols = getCategoricalColumns(columnTypes);
  assert(categoricalCols.includes('name'), 'Categorical columns include name');
  assertEqual(categoricalCols.length, 1, 'Found 1 categorical column');
  
  // Test getDateColumns
  const dateCols = getDateColumns(columnTypes);
  assert(dateCols.includes('date'), 'Date columns include date');
  assertEqual(dateCols.length, 1, 'Found 1 date column');
  
  // Test getGeographicColumns
  const geoCols = getGeographicColumns(columnTypes);
  assert(geoCols.includes('postcode'), 'Geographic columns include postcode');
  assert(geoCols.includes('city'), 'Geographic columns include city');
  assertEqual(geoCols.length, 2, 'Found 2 geographic columns');
}

async function testBusinessContext() {
  console.log(chalk.blue('\n=== Testing Business Context Detection ==='));
  
  // Test detectColumnContext
  const financialContext = detectColumnContext('total_amount', { type: 'currency' });
  assert(financialContext.includes('financial'), 'Detects financial context from name');
  assert(financialContext.includes('quantitative'), 'Detects quantitative context from type');
  
  const temporalContext = detectColumnContext('created_date', { type: 'date' });
  assert(temporalContext.includes('temporal'), 'Detects temporal context');
  
  const geoContext = detectColumnContext('customer_postcode', { type: 'postcode' });
  assert(geoContext.includes('geographic'), 'Detects geographic context');
  
  // Test isGeographicColumn
  assert(isGeographicColumn('postcode', { type: 'postcode' }), 'Postcode is geographic');
  assert(isGeographicColumn('latitude', { type: 'float' }), 'Latitude is geographic');
  assert(!isGeographicColumn('age', { type: 'integer' }), 'Age is not geographic');
  
  // Test with values
  const stateValues = ['NSW', 'VIC', 'QLD', 'NSW', 'VIC'];
  assert(isGeographicColumn('state', { type: 'categorical' }, stateValues), 'State values are geographic');
}

async function testEdgeCases() {
  console.log(chalk.blue('\n=== Testing Edge Cases ==='));
  
  // Empty data
  const emptyResult = detectColumnTypes([]);
  assertEqual(Object.keys(emptyResult).length, 0, 'Empty data returns empty object');
  
  // Single row
  const singleRow = detectColumnTypes([{ a: 1, b: 'test' }]);
  assertEqual(Object.keys(singleRow).length, 2, 'Single row processed correctly');
  
  // Null values
  const nullData = [
    { col1: null, col2: 'value' },
    { col1: null, col2: null }
  ];
  const nullResult = detectColumnTypes(nullData);
  assertEqual(nullResult.col1.type, 'empty', 'All-null column detected as empty');
  assert(nullResult.col1.nullable, 'Null column marked as nullable');
  
  // Mixed types with nulls
  const mixedWithNulls = analyzeColumnValues([1, 2, null, 3, null], 5);
  assertEqual(mixedWithNulls.type, 'integer', 'Handles nulls in numeric data');
  
  // Very long strings
  const longString = 'x'.repeat(1000);
  const longResult = analyzeColumnValues([longString], 1);
  assertEqual(longResult.type, 'string', 'Handles very long strings');
  
  // Special characters
  const specialResult = analyzeColumnValues(['test@#$%', 'value&*()', '<<<>>>'], 3);
  assertEqual(specialResult.type, 'string', 'Handles special characters');
}

// Main test runner
async function runAllTests() {
  console.log(chalk.magenta('='.repeat(60)));
  console.log(chalk.magenta('COLUMN DETECTOR UNIT TESTS'));
  console.log(chalk.magenta('='.repeat(60)));
  
  try {
    await testPatterns();
    await testParseNumber();
    await testParseDate();
    await testAnalyzeColumnValues();
    await testDetectColumnTypes();
    await testColumnUtilities();
    await testBusinessContext();
    await testEdgeCases();
    
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