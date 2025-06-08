const fs = require('fs');
const path = require('path');

// Read the file
const filePath = 'test-datasets/kaggle/taco_sales_(2024-2025).csv';
const fileContent = fs.readFileSync(filePath, 'utf8');

// Check for BOM
console.log('First char code:', fileContent.charCodeAt(0));
console.log('Has BOM:', fileContent.charCodeAt(0) === 0xFEFF);

// Strip BOM if present
let cleanContent = fileContent;
if (fileContent.charCodeAt(0) === 0xFEFF) {
  cleanContent = fileContent.slice(1);
  console.log('Stripped BOM');
}

// Get first line (header)
const firstLine = cleanContent.split('\n')[0];
console.log('First line:', firstLine);

// Parse header
const headers = firstLine.split(',');
console.log('Number of columns:', headers.length);
console.log('Column names:', headers.slice(0, 5)); // Show first 5

// Check if we can parse data rows
const lines = cleanContent.split('\n').filter(line => line.trim());
console.log('Total lines (including header):', lines.length);

// Parse a data row
if (lines.length > 1) {
  const dataRow = lines[1].split(',');
  console.log('\nFirst data row (first 5 fields):');
  for (let i = 0; i < 5 && i < dataRow.length; i++) {
    console.log(`  ${headers[i]}: ${dataRow[i]}`);
  }
}