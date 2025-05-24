import { parse } from 'csv-parse';
import { createReadStream } from 'fs';
import { pipeline } from 'stream/promises';

export async function parseCSV(filePath, options = {}) {
  const records = [];
  const parser = parse({
    columns: true,
    skip_empty_lines: true,
    trim: true,
    cast: (value) => {
      if (value === '' || value === null) return null;
      
      // Try to parse as number
      if (!isNaN(value) && !isNaN(parseFloat(value))) {
        return parseFloat(value);
      }
      
      // Try to parse as date
      const dateValue = new Date(value);
      if (!isNaN(dateValue.getTime()) && value.includes('-') || value.includes('/')) {
        return dateValue;
      }
      
      return value;
    },
    ...options
  });

  await pipeline(
    createReadStream(filePath),
    parser,
    async function* (source) {
      for await (const record of source) {
        records.push(record);
        yield;
      }
    }
  );

  return records;
}

export function detectColumnTypes(records) {
  if (records.length === 0) return {};
  
  const columns = Object.keys(records[0]);
  const columnTypes = {};
  
  for (const column of columns) {
    const values = records.map(r => r[column]).filter(v => v !== null);
    
    if (values.length === 0) {
      columnTypes[column] = { type: 'empty', nullable: true };
      continue;
    }
    
    // Check if all values are numbers
    const numbers = values.filter(v => typeof v === 'number');
    if (numbers.length === values.length) {
      const isInteger = numbers.every(n => Number.isInteger(n));
      columnTypes[column] = {
        type: isInteger ? 'integer' : 'float',
        nullable: records.some(r => r[column] === null)
      };
      continue;
    }
    
    // Check if all values are dates
    const dates = values.filter(v => v instanceof Date);
    if (dates.length === values.length) {
      columnTypes[column] = {
        type: 'date',
        nullable: records.some(r => r[column] === null)
      };
      continue;
    }
    
    // Check for specific string patterns
    const stringValues = values.filter(v => typeof v === 'string');
    
    // Email pattern
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (stringValues.every(v => emailPattern.test(v))) {
      columnTypes[column] = {
        type: 'email',
        nullable: records.some(r => r[column] === null)
      };
      continue;
    }
    
    // Phone pattern (including Australian formats)
    const phonePattern = /^[\d\s\-\+\(\)]+$/;
    if (stringValues.every(v => phonePattern.test(v) && v.replace(/\D/g, '').length >= 8)) {
      columnTypes[column] = {
        type: 'phone',
        nullable: records.some(r => r[column] === null)
      };
      continue;
    }
    
    // Australian postcode
    const postcodePattern = /^[0-9]{4}$/;
    if (stringValues.every(v => postcodePattern.test(v))) {
      columnTypes[column] = {
        type: 'postcode',
        nullable: records.some(r => r[column] === null)
      };
      continue;
    }
    
    // Check if categorical (limited unique values)
    const uniqueValues = [...new Set(stringValues)];
    if (uniqueValues.length < Math.min(20, records.length * 0.1)) {
      columnTypes[column] = {
        type: 'categorical',
        categories: uniqueValues,
        nullable: records.some(r => r[column] === null)
      };
      continue;
    }
    
    // Check if ID/identifier (high uniqueness)
    if (uniqueValues.length > records.length * 0.95) {
      columnTypes[column] = {
        type: 'identifier',
        nullable: records.some(r => r[column] === null)
      };
      continue;
    }
    
    // Default to string
    columnTypes[column] = {
      type: 'string',
      nullable: records.some(r => r[column] === null)
    };
  }
  
  return columnTypes;
}