// Simple test of CSV parser with BOM file
const { CSVParser } = require('./dist/parsers/csv-parser');

async function testBOMParsing() {
  try {
    const parser = new CSVParser({
      autoDetect: true,
      maxRows: 5, // Only parse first 5 rows for testing
      hasHeader: true
    });

    console.log('Testing BOM handling with taco sales CSV...');
    
    const rows = await parser.parseFile('test-datasets/kaggle/taco_sales_(2024-2025).csv');
    
    console.log(`\nParsed ${rows.length} rows`);
    
    if (rows.length > 0) {
      console.log('\nFirst row data:');
      console.log('- Index:', rows[0].index);
      console.log('- Data length:', rows[0].data.length);
      console.log('- First 5 fields:', rows[0].data.slice(0, 5));
    }
    
    if (rows.length > 1) {
      console.log('\nSecond row data:');
      console.log('- Index:', rows[1].index);
      console.log('- Data length:', rows[1].data.length);
      console.log('- First 5 fields:', rows[1].data.slice(0, 5));
    }
    
    const stats = parser.getStats();
    console.log('\nParser stats:');
    console.log('- Bytes processed:', stats.bytesProcessed);
    console.log('- Rows processed:', stats.rowsProcessed);
    console.log('- Errors:', stats.errors.length);
    
    const options = parser.getOptions();
    console.log('\nDetected options:');
    console.log('- Delimiter:', JSON.stringify(options.delimiter));
    console.log('- Encoding:', options.encoding);
    console.log('- Has header:', options.hasHeader);
    
  } catch (error) {
    console.error('Error:', error.message);
    if (error.context) {
      console.error('Context:', error.context);
    }
  }
}

testBOMParsing();