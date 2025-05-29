import { parseCSV, detectColumnTypes } from '../../src/utils/parser.js';
import { writeFileSync, unlinkSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const tempFile = join(__dirname, 'temp_test.csv');

// Test parseCSV function
async function testParseCSV() {
  console.log('\n=== Testing parseCSV ===');
  
  // Test basic CSV parsing
  const csvContent = `id,name,age,salary
1,John,30,50000
2,Jane,25,60000
3,Bob,,70000`;
  
  writeFileSync(tempFile, csvContent);
  
  try {
    const records = await parseCSV(tempFile);
    
    console.assert(records.length === 3, 'Should parse 3 records');
    console.assert(records[0].id === '1', 'Should parse as strings');
    console.assert(records[0].name === 'John', 'Should parse strings');
    console.assert(records[2].age === '', 'Should handle empty values as empty strings');
    
    console.log('✓ Basic CSV parsing works');
  } catch (error) {
    console.error('✗ Basic CSV parsing failed:', error.message);
  }
  
  // Test date parsing
  const dateCSV = `date,value
2024-01-15,100
2024-02-20,200
invalid-date,300`;
  
  writeFileSync(tempFile, dateCSV);
  
  try {
    const records = await parseCSV(tempFile);
    
    console.assert(typeof records[0].date === 'string', 'Should keep dates as strings');
    console.assert(records[0].date === '2024-01-15', 'Should preserve date format');
    console.assert(records[2].date === 'invalid-date', 'Should keep invalid dates as strings');
    
    console.log('✓ Date parsing works');
  } catch (error) {
    console.error('✗ Date parsing failed:', error.message);
  }
  
  unlinkSync(tempFile);
}

// Test detectColumnTypes function
function testDetectColumnTypes() {
  console.log('\n=== Testing detectColumnTypes ===');
  
  const records = [
    { id: 1, email: 'test@example.com', age: 30, status: 'active', amount: 100.50 },
    { id: 2, email: 'user@test.com', age: 25, status: 'inactive', amount: 200.75 },
    { id: 3, email: 'admin@site.com', age: 35, status: 'active', amount: 150.00 }
  ];
  
  const types = detectColumnTypes(records);
  
  console.assert(types.id.type === 'integer', 'Should detect integer ID');
  console.assert(types.email.type === 'email', 'Should detect email');
  console.assert(types.age.type === 'integer', 'Should detect integer');
  console.assert(types.status.type === 'categorical' || types.status.type === 'string', 'Should detect categorical or string');
  console.assert(types.amount.type === 'float', 'Should detect float');
  
  console.log('✓ Column type detection works');
  
  // Test Australian-specific patterns
  const ausRecords = [
    { phone: '0412345678', postcode: '2000' },
    { phone: '0298765432', postcode: '3000' },
    { phone: '(02) 9123 4567', postcode: '4000' }
  ];
  
  const ausTypes = detectColumnTypes(ausRecords);
  
  console.assert(ausTypes.phone.type === 'phone', 'Should detect phone numbers');
  console.assert(ausTypes.postcode.type === 'postcode', 'Should detect postcodes');
  
  console.log('✓ Australian pattern detection works');
}

// Run all tests
async function runTests() {
  console.log('Running parser unit tests...');
  
  await testParseCSV();
  testDetectColumnTypes();
  
  console.log('\nParser tests completed');
}

runTests().catch(console.error);