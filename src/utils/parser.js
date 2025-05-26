import { parse } from 'csv-parse';
import { createReadStream, statSync, openSync, readSync, closeSync, existsSync } from 'fs';
import { pipeline } from 'stream/promises';
import * as chardet from 'chardet';
import chalk from 'chalk';
import ora from 'ora';
import { readFileSync } from 'fs';
import crypto from 'crypto';
import path from 'path';

// Constants
const SAMPLE_THRESHOLD = 50 * 1024 * 1024; // 50MB
const MAX_MEMORY_ROWS = 100000; // Maximum rows to keep in memory
const SAMPLE_RATE = 0.01; // 1% sampling for files > 1M rows
const MAX_ROWS_FOR_FULL_ANALYSIS = 50000;
const CHUNK_SIZE = 10000; // Process 10k rows at a time for CPU-intensive operations

// Detect file encoding with validation and fallback
export function detectEncoding(filePath) {
  try {
    const encoding = chardet.detectFileSync(filePath, { sampleSize: 65536 });
    
    // Validate detected encoding
    if (!encoding) {
      console.log(chalk.yellow('Could not detect encoding, trying UTF-8 with BOM detection'));
      
      // Check for BOM
      const fd = openSync(filePath, 'r');
      const buffer = Buffer.alloc(3);
      readSync(fd, buffer, 0, 3, 0);
      closeSync(fd);
      
      if (buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
        return 'utf8';  // UTF-8 with BOM
      }
      return 'utf8';
    }
    
    if (encoding && encoding !== 'UTF-8' && encoding !== 'ascii') {
      console.log(chalk.yellow(`Detected ${encoding} encoding (will handle automatically)`));
    }
    
    // Map common encodings to Node.js supported encodings
    const encodingMap = {
      'UTF-8': 'utf8',
      'ascii': 'ascii',
      'windows-1250': 'latin1',  // Added missing encoding
      'windows-1252': 'latin1',
      'ISO-8859-1': 'latin1',
      'UTF-16LE': 'utf16le',
      'UTF-16BE': 'utf16be',
      'UTF-32LE': 'utf32le',     // Add more encodings
      'UTF-32BE': 'utf32be',
      'Big5': 'big5',
      'Shift_JIS': 'shiftjis'
    };
    
    return encodingMap[encoding] || 'utf8';
  } catch (error) {
    console.log(chalk.yellow('Encoding detection failed, defaulting to UTF-8'));
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

// Helper function to attempt parsing with a specific encoding
async function attemptParse(filePath, encoding, options = {}) {
  const delimiter = options.delimiter || detectDelimiter(filePath, encoding);
  const fileSize = statSync(filePath).size;
  
  // Progressive sampling logic - estimate file size and determine sampling strategy
  let useSampling = false;
  let sampleRate = 1.0;
  
  if (fileSize > 100 * 1024 * 1024 && !options.noSampling) { // 100MB threshold
    // Estimate average bytes per row (rough approximation)
    const averageBytesPerRow = 80; // Conservative estimate
    const estimatedRows = fileSize / averageBytesPerRow;
    
    if (estimatedRows > MAX_ROWS_FOR_FULL_ANALYSIS) {
      useSampling = true;
      sampleRate = Math.min(MAX_ROWS_FOR_FULL_ANALYSIS / estimatedRows, 1);
      
      if (!options.quiet) {
        console.log(chalk.yellow(
          `Large file detected (~${Math.round(estimatedRows).toLocaleString()} estimated rows). ` +
          `Using ${(sampleRate * 100).toFixed(1)}% sampling for performance.`
        ));
      }
    }
  } else if (fileSize > SAMPLE_THRESHOLD && !options.noSampling) {
    // Use the older sampling method for smaller large files
    useSampling = true;
    sampleRate = 1.0; // Will use reservoir sampling
  }
  
  return await parseCSVWithEncoding(filePath, encoding, delimiter, useSampling, sampleRate, options);
}

// Core parsing function separated for fallback mechanism
async function parseCSVWithEncoding(filePath, encoding, delimiter, useSampling, sampleRate, options = {}) {
  const fileSize = statSync(filePath).size;
  const { onProgress } = options;
  
  if (useSampling && sampleRate === 1.0 && !options.quiet) {
    console.log(chalk.yellow(
      `Large file detected (${(fileSize / 1024 / 1024).toFixed(1)}MB). ` +
      `Using reservoir sampling for analysis...`
    ));
  }
  
  const records = [];
  const spinner = options.quiet ? null : ora('Reading CSV file...').start();
  let rowCount = 0;
  let errorCount = 0;
  let skipCount = 0;
  let processedBytes = 0;
  
  // Handle headerless CSV files
  const hasHeader = options.header !== false;
  const parserOptions = {
    columns: hasHeader ? true : false,
    skip_empty_lines: true,
    trim: true,
    delimiter,
    encoding,
    relax_quotes: true,
    relax_column_count: true,  // Add this for better quote handling
    quote: '"',                // Explicitly set quote character
    escape: '"',               // Set escape character (for quotes inside quotes)
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
      
      // If value is purely numeric (no spaces, letters, special chars except . and -), try parsing as number
      if (typeof value === 'string') {
        const trimmed = value.trim();
        
        // Only try to parse as number if it looks purely numeric
        if (/^[\d\s,.-]+$/.test(trimmed) && !/[a-zA-Z]/.test(trimmed)) {
          const num = parseNumber(value);
          if (num !== null) return num;
        }
        
        // Try to parse as date
        const date = parseDate(value);
        if (date !== null) return date;
      }
      
      // Return as string
      return value;
    }
  };

  // Don't override columns option if explicitly set in options
  const parser = parse({ ...parserOptions, ...options });

  parser.on('skip', (err) => {
    errorCount++;
    if (errorCount <= 5 && !options.quiet) {
      console.log(chalk.red(`\nSkipped row ${err.lines}: ${err.message}`));
    }
  });

  try {
    await pipeline(
      createReadStream(filePath, { encoding })
        .on('data', (chunk) => {
          processedBytes += chunk.length;
          if (onProgress) {
            const progress = (processedBytes / fileSize) * 100;
            onProgress(progress, rowCount);
          }
        }),
      parser,
      async function* (source) {
        for await (const record of source) {
          rowCount++;
          
          // Convert array to object if headerless
          let processedRecord = record;
          if (!hasHeader && Array.isArray(record)) {
            processedRecord = {};
            record.forEach((value, index) => {
              processedRecord[`column${index + 1}`] = value;
            });
          }
          
          // Check memory usage periodically and adjust sampling if needed
          let aggressiveSampling = false;
          if (rowCount % 5000 === 0) {
            const memoryStatus = checkMemoryUsage();
            if (memoryStatus.shouldUseAggressiveSampling && !options.quiet) {
              console.warn(chalk.red(`High memory usage detected (${memoryStatus.heapUsedGB.toFixed(1)}GB), enabling aggressive sampling`));
              aggressiveSampling = true;
            }
          }
          
          // Apply progressive or reservoir sampling
          if (useSampling || aggressiveSampling) {
            if (sampleRate < 1.0 || aggressiveSampling) {
              // Progressive sampling: sample while streaming based on calculated rate
              const effectiveRate = aggressiveSampling ? Math.min(sampleRate * 0.1, 0.01) : sampleRate;
              if (Math.random() < effectiveRate) {
                records.push(processedRecord);
              } else {
                skipCount++;
              }
            } else if (records.length >= MAX_MEMORY_ROWS) {
              // Reservoir sampling for very large files
              skipCount++;
              const j = Math.floor(Math.random() * rowCount);
              if (j < MAX_MEMORY_ROWS) {
                records[j] = processedRecord;
              }
            } else {
              records.push(processedRecord);
            }
          } else {
            records.push(processedRecord);
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
    
    return { success: true, data: records };
    
  } catch (error) {
    if (spinner) spinner.fail('Failed to parse CSV');
    return { success: false, error };
  }
}

// Main parseCSV function with fallback mechanism
export async function parseCSV(filePath, options = {}) {
  const detectedEncoding = options.encoding || detectEncoding(filePath);
  
  // If parsing fails with detected encoding, retry with different encodings
  const fallbackEncodings = ['utf8', 'latin1', 'utf16le'];
  
  for (const encoding of [detectedEncoding, ...fallbackEncodings]) {
    if (encoding === detectedEncoding || !fallbackEncodings.includes(encoding)) {
      try {
        const result = await attemptParse(filePath, encoding, options);
        if (result.success) {
          // Handle empty file - return empty array instead of throwing
          if (result.data.length === 0) {
            if (!options.quiet) {
              console.log(chalk.yellow('⚠️  Warning: No data found in CSV file. The file may be empty or have no valid rows.'));
            }
          }
          return result.data;
        }
      } catch (e) {
        continue;
      }
    }
  }
  
  // If all encodings fail, throw the original error with enhanced message
  throw new Error(
    'CSV parsing failed with all attempted encodings. ' +
    'The file may be corrupted or in an unsupported format.'
  );
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
  
  // If we have a strong numeric type detection, stick with it
  if ((bestType === 'integer' || bestType === 'float') && confidence > 0.8) {
    // This is definitely a numeric column, don't check for categorical/identifier
    const result = {
      type: bestType,
      confidence: confidence
    };
    
    // Add numeric statistics
    const numbers = values.map(v => parseNumber(v)).filter(n => n !== null);
    if (numbers.length > 0) {
      result.min = Math.min(...numbers);
      result.max = Math.max(...numbers);
      result.uniqueCount = [...new Set(numbers)].length;
    }
    
    return result;
  }
  
  // Check for categorical - but only for non-numeric types
  if (bestType !== 'integer' && bestType !== 'float') {
    const uniqueValues = [...new Set(values.filter(v => typeof v === 'string'))];
    if (uniqueValues.length < Math.min(20, totalRecords * 0.1)) {
      return {
        type: 'categorical',
        categories: uniqueValues.sort(),
        confidence: 1.0,
        uniqueCount: uniqueValues.length
      };
    }
  }
  
  // Check for identifier - but not for numeric types
  if (bestType !== 'integer' && bestType !== 'float') {
    const allUniqueValues = [...new Set(values)];
    if (allUniqueValues.length > totalRecords * 0.95) {
      return {
        type: 'identifier',
        confidence: allUniqueValues.length / totalRecords,
        uniqueCount: allUniqueValues.length
      };
    }
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

// Chunked processing utility for CPU-intensive operations
export async function processInChunks(records, processor, chunkSize = CHUNK_SIZE) {
  const results = [];
  
  for (let i = 0; i < records.length; i += chunkSize) {
    const chunk = records.slice(i, i + chunkSize);
    const chunkResults = await processor(chunk);
    results.push(...chunkResults);
    
    // Allow event loop to breathe
    await new Promise(resolve => setImmediate(resolve));
  }
  
  return results;
}

// Memory monitoring utility
export function checkMemoryUsage() {
  const used = process.memoryUsage();
  const memoryUsageGB = used.heapUsed / (1024 * 1024 * 1024);
  
  return {
    heapUsed: used.heapUsed,
    heapUsedGB: memoryUsageGB,
    isHighMemory: used.heapUsed > 1024 * 1024 * 1024, // 1GB threshold
    shouldUseAggressiveSampling: used.heapUsed > 1024 * 1024 * 1024
  };
}

// File hash utility for caching
export function getFileHash(filePath) {
  const hash = crypto.createHash('md5');
  const stream = createReadStream(filePath);
  return new Promise((resolve, reject) => {
    stream.on('data', data => hash.update(data));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

// Configuration loader
export function loadConfig() {
  const defaultConfig = {
    performance: {
      maxMemoryRows: 100000,
      chunkSize: 10000,
      sampleRate: 0.01,
      workerThreads: "auto"
    },
    parsing: {
      encoding: "auto",
      delimiter: "auto",
      quoteChar: '"',
      escapeChar: '"'
    }
  };

  // Look for config file in current directory, then in home directory
  const configPaths = [
    './datapilot.config.json',
    path.join(process.cwd(), 'datapilot.config.json'),
    path.join(process.env.HOME || process.env.USERPROFILE || '', '.datapilot', 'config.json')
  ];

  for (const configPath of configPaths) {
    if (existsSync(configPath)) {
      try {
        const userConfig = JSON.parse(readFileSync(configPath, 'utf8'));
        return { ...defaultConfig, ...userConfig };
      } catch (error) {
        console.warn(chalk.yellow(`Warning: Invalid config file at ${configPath}, using defaults`));
      }
    }
  }

  return defaultConfig;
}