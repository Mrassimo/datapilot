import { parse } from 'csv-parse';
import { createReadStream, statSync } from 'fs';
import { pipeline } from 'stream/promises';
import * as chardet from 'chardet';
import chalk from 'chalk';
import ora from 'ora';
import { readFileSync } from 'fs';

// Constants
const SAMPLE_THRESHOLD = 50 * 1024 * 1024; // 50MB
const MAX_MEMORY_ROWS = 100000; // Maximum rows to keep in memory

// Detect file encoding
export function detectEncoding(filePath) {
  try {
    const encoding = chardet.detectFileSync(filePath, { sampleSize: 32768 });
    if (encoding && encoding !== 'UTF-8' && encoding !== 'ascii') {
      console.log(chalk.yellow(`Detected ${encoding} encoding (will handle automatically)`));
    }
    
    // Map common encodings to Node.js supported encodings
    const encodingMap = {
      'UTF-8': 'utf8',
      'ascii': 'ascii',
      'windows-1252': 'latin1',
      'ISO-8859-1': 'latin1',
      'UTF-16LE': 'utf16le',
      'UTF-16BE': 'utf16be'
    };
    
    return encodingMap[encoding] || 'utf8';
  } catch (error) {
    console.log(chalk.yellow('Could not detect encoding, assuming UTF-8'));
    return 'utf8';
  }
}

// Detect CSV delimiter
export function detectDelimiter(filePath, encoding = 'utf8') {
  try {
    const sample = readFileSync(filePath, { encoding, end: 4096 }).toString();
    const lines = sample.split(/\r?\n/).filter(l => l.trim());
    
    if (lines.length < 2) return ',';
    
    const delimiters = [',', ';', '\t', '|'];
    const counts = {};
    
    for (const delimiter of delimiters) {
      counts[delimiter] = lines.slice(0, 5).map(line => 
        line.split(delimiter).length
      );
    }
    
    // Find delimiter with most consistent count across lines
    let bestDelimiter = ',';
    let bestScore = 0;
    
    for (const [delimiter, lineCounts] of Object.entries(counts)) {
      const avg = lineCounts.reduce((a, b) => a + b, 0) / lineCounts.length;
      if (avg > 1) {
        const variance = lineCounts.reduce((sum, count) => 
          sum + Math.pow(count - avg, 2), 0) / lineCounts.length;
        const score = avg / (variance + 1);
        
        if (score > bestScore) {
          bestScore = score;
          bestDelimiter = delimiter;
        }
      }
    }
    
    if (bestDelimiter !== ',') {
      console.log(chalk.yellow(`Detected delimiter: ${bestDelimiter === '\t' ? '\\t' : bestDelimiter}`));
    }
    
    return bestDelimiter;
  } catch (error) {
    return ',';
  }
}

// Parse numbers with various formats
function parseNumber(value) {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') return null;
  
  // Remove commas and spaces
  const cleaned = value.replace(/[,\s]/g, '');
  
  // Check for percentage
  if (cleaned.endsWith('%')) {
    const num = parseFloat(cleaned.slice(0, -1));
    return isNaN(num) ? null : num / 100;
  }
  
  // Try parsing
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

// Enhanced date parsing with format detection
function parseDate(value, dateFormats = null) {
  if (value instanceof Date) return value;
  if (typeof value !== 'string') return null;
  
  // Common date patterns
  const patterns = dateFormats || [
    // ISO formats
    /^\d{4}-\d{2}-\d{2}$/,
    /^\d{4}-\d{2}-\d{2}T/,
    // Australian format DD/MM/YYYY
    /^\d{1,2}\/\d{1,2}\/\d{4}$/,
    // US format MM/DD/YYYY
    /^\d{1,2}-\d{1,2}-\d{4}$/,
    // Other formats
    /^\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i
  ];
  
  // Check if it matches date patterns
  const hasDatePattern = patterns.some(pattern => 
    pattern.test ? pattern.test(value) : value.match(pattern)
  );
  
  if (!hasDatePattern) return null;
  
  const date = new Date(value);
  
  // For ambiguous dates like 01/02/2023, try to detect format
  if (value.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
    const parts = value.split('/');
    const d1 = parseInt(parts[0]);
    const d2 = parseInt(parts[1]);
    const year = parseInt(parts[2]);
    
    // If one is clearly a month (>12), we can determine format
    if (d1 > 12 && d2 <= 12) {
      // DD/MM/YYYY format
      return new Date(year, d2 - 1, d1);
    } else if (d2 > 12 && d1 <= 12) {
      // MM/DD/YYYY format
      return new Date(year, d1 - 1, d2);
    }
    // Otherwise, assume DD/MM/YYYY (Australian default)
    return new Date(year, d2 - 1, d1);
  }
  
  return isNaN(date.getTime()) ? null : date;
}

export async function parseCSV(filePath, options = {}) {
  const fileSize = statSync(filePath).size;
  const encoding = options.encoding || detectEncoding(filePath);
  const delimiter = options.delimiter || detectDelimiter(filePath, encoding);
  const useSampling = fileSize > SAMPLE_THRESHOLD && !options.noSampling;
  
  if (useSampling && !options.quiet) {
    console.log(chalk.yellow(
      `Large file detected (${(fileSize / 1024 / 1024).toFixed(1)}MB). ` +
      `Sampling first ${MAX_MEMORY_ROWS.toLocaleString()} rows for analysis...`
    ));
  }
  
  const records = [];
  const spinner = options.quiet ? null : ora('Reading CSV file...').start();
  let rowCount = 0;
  let errorCount = 0;
  let skipCount = 0;
  
  const parser = parse({
    columns: true,
    skip_empty_lines: true,
    trim: true,
    delimiter,
    encoding,
    relax_quotes: true,
    skip_records_with_error: true,
    on_record: (record, { lines }) => {
      // Update progress
      if (spinner && lines % 10000 === 0) {
        spinner.text = `Processing row ${lines.toLocaleString()}...`;
      }
      return record;
    },
    cast: (value) => {
      if (value === '' || value === null || value === undefined) return null;
      
      // Try to parse as number first
      const num = parseNumber(value);
      if (num !== null) return num;
      
      // Try to parse as date
      const date = parseDate(value);
      if (date !== null) return date;
      
      // Return as string
      return value;
    },
    ...options
  });

  parser.on('skip', (err) => {
    errorCount++;
    if (errorCount <= 5 && !options.quiet) {
      console.log(chalk.red(`\nSkipped row ${err.lines}: ${err.message}`));
    }
  });

  try {
    await pipeline(
      createReadStream(filePath, { encoding }),
      parser,
      async function* (source) {
        for await (const record of source) {
          rowCount++;
          
          // Apply sampling if needed
          if (useSampling && records.length >= MAX_MEMORY_ROWS) {
            skipCount++;
            // Use reservoir sampling for statistical validity
            const j = Math.floor(Math.random() * rowCount);
            if (j < MAX_MEMORY_ROWS) {
              records[j] = record;
            }
          } else {
            records.push(record);
          }
          yield;
        }
      }
    );
    
    if (spinner) spinner.succeed(`Processed ${rowCount.toLocaleString()} rows`);
    
    if (errorCount > 0 && !options.quiet) {
      console.log(chalk.yellow(
        `⚠️  Encountered ${errorCount} problematic rows (skipped)`
      ));
    }
    
    if (skipCount > 0 && !options.quiet) {
      console.log(chalk.blue(
        `ℹ️  Sampled ${records.length.toLocaleString()} rows from ${rowCount.toLocaleString()} total rows`
      ));
    }
    
  } catch (error) {
    if (spinner) spinner.fail('Failed to parse CSV');
    
    // Enhanced error messages
    if (error.message.includes('Invalid Opening Quote')) {
      throw new Error(
        'CSV parsing failed: Invalid quote character detected. ' +
        'This often happens with Excel exports. Try opening in Excel and re-saving as CSV.'
      );
    } else if (error.message.includes('Invalid Record Length')) {
      throw new Error(
        'CSV parsing failed: Inconsistent number of columns. ' +
        'Check for rows with extra/missing delimiters.'
      );
    } else {
      throw error;
    }
  }

  // Handle empty file
  if (records.length === 0) {
    throw new Error('No data found in CSV file. The file may be empty or have no valid rows.');
  }

  return records;
}

// Enhanced column type detection with confidence scores
export function detectColumnTypes(records) {
  if (records.length === 0) return {};
  
  const columns = Object.keys(records[0]);
  const columnTypes = {};
  const spinner = ora('Analyzing column types...').start();
  
  for (const [index, column] of columns.entries()) {
    spinner.text = `Analyzing column types... (${index + 1}/${columns.length})`;
    
    const values = records.map(r => r[column]).filter(v => v !== null);
    
    if (values.length === 0) {
      columnTypes[column] = { 
        type: 'empty', 
        nullable: true,
        confidence: 1.0 
      };
      continue;
    }
    
    const analysis = analyzeColumnValues(values, records.length);
    columnTypes[column] = {
      ...analysis,
      nullable: records.some(r => r[column] === null),
      nullCount: records.filter(r => r[column] === null).length
    };
  }
  
  spinner.succeed('Column analysis complete');
  return columnTypes;
}

function analyzeColumnValues(values, totalRecords) {
  const typeVotes = {
    integer: 0,
    float: 0,
    date: 0,
    email: 0,
    phone: 0,
    postcode: 0,
    boolean: 0,
    url: 0
  };
  
  const dateFormats = new Set();
  const ambiguousDates = [];
  
  for (const value of values) {
    // Check numbers
    if (typeof value === 'number') {
      if (Number.isInteger(value)) {
        typeVotes.integer++;
      } else {
        typeVotes.float++;
      }
      continue;
    }
    
    if (typeof value === 'string') {
      const trimmed = value.trim();
      
      // Boolean check
      if (['true', 'false', 'yes', 'no', '1', '0', 'y', 'n'].includes(trimmed.toLowerCase())) {
        typeVotes.boolean++;
      }
      
      // Email check
      if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
        typeVotes.email++;
      }
      
      // URL check
      if (/^https?:\/\//.test(trimmed) || /^www\./.test(trimmed)) {
        typeVotes.url++;
      }
      
      // Phone check (enhanced)
      const phoneDigits = trimmed.replace(/[^\d]/g, '');
      if (phoneDigits.length >= 8 && phoneDigits.length <= 15 && 
          /^[\d\s\-\+\(\)\.]+$/.test(trimmed)) {
        typeVotes.phone++;
      }
      
      // Australian postcode
      if (/^[0-9]{4}$/.test(trimmed)) {
        typeVotes.postcode++;
      }
      
      // Date detection with format tracking
      if (value instanceof Date || 
          /\d{4}-\d{2}-\d{2}/.test(trimmed) ||
          /\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}/.test(trimmed)) {
        typeVotes.date++;
        
        // Track date format
        if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
          dateFormats.add('YYYY-MM-DD');
        } else if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)) {
          dateFormats.add('D/M/YYYY or M/D/YYYY');
          // Check for ambiguous dates
          const parts = trimmed.split('/');
          if (parseInt(parts[0]) <= 12 && parseInt(parts[1]) <= 12) {
            ambiguousDates.push(trimmed);
          }
        }
      }
      
      // Number with commas check
      const cleanedForNumber = trimmed.replace(/[,\s]/g, '');
      if (!isNaN(cleanedForNumber) && cleanedForNumber !== '') {
        const num = parseFloat(cleanedForNumber);
        if (Number.isInteger(num)) {
          typeVotes.integer++;
        } else {
          typeVotes.float++;
        }
      }
    }
  }
  
  // Determine type with confidence
  const totalVotes = values.length;
  let bestType = 'string';
  let bestScore = 0;
  let confidence = 0;
  
  for (const [type, votes] of Object.entries(typeVotes)) {
    const score = votes / totalVotes;
    if (score > bestScore) {
      bestScore = score;
      bestType = type;
      confidence = score;
    }
  }
  
  // Special handling for mixed numeric types
  if (bestType === 'integer' || bestType === 'float') {
    const numericVotes = typeVotes.integer + typeVotes.float;
    if (numericVotes / totalVotes > 0.9) {
      bestType = typeVotes.float > 0 ? 'float' : 'integer';
      confidence = numericVotes / totalVotes;
    }
  }
  
  // Check for categorical
  const uniqueValues = [...new Set(values.filter(v => typeof v === 'string'))];
  if (uniqueValues.length < Math.min(20, totalRecords * 0.1)) {
    return {
      type: 'categorical',
      categories: uniqueValues.sort(),
      confidence: 1.0,
      uniqueCount: uniqueValues.length
    };
  }
  
  // Check for identifier
  if (uniqueValues.length > totalRecords * 0.95) {
    return {
      type: 'identifier',
      confidence: uniqueValues.length / totalRecords,
      uniqueCount: uniqueValues.length
    };
  }
  
  // Prepare result
  const result = {
    type: bestType,
    confidence: confidence
  };
  
  // Add type-specific metadata
  if (bestType === 'date' && dateFormats.size > 0) {
    result.formats = Array.from(dateFormats);
    if (ambiguousDates.length > 0) {
      result.ambiguousCount = ambiguousDates.length;
      result.ambiguousExamples = ambiguousDates.slice(0, 3);
    }
  }
  
  if (bestType === 'integer' || bestType === 'float') {
    const numbers = values.map(v => parseNumber(v)).filter(n => n !== null);
    if (numbers.length > 0) {
      result.min = Math.min(...numbers);
      result.max = Math.max(...numbers);
    }
  }
  
  return result;
}