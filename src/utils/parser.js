import { parse } from 'csv-parse';
import { createReadStream, statSync, openSync, readSync, closeSync, existsSync } from 'fs';
import { pipeline } from 'stream/promises';
// import * as chardet from 'chardet'; // Removed - not used, fast detection is preferred
import chalk from 'chalk';
import ora from 'ora';
import { readFileSync } from 'fs';
import crypto from 'crypto';
import path from 'path';
import os from 'os';

// Constants
const SAMPLE_THRESHOLD = 2 * 1024 * 1024; // 2MB - lowered for better performance
const MAX_MEMORY_ROWS = 50000; // Maximum rows to keep in memory - reduced
const SAMPLE_RATE = 0.01; // 1% sampling for files > 1M rows
const MAX_ROWS_FOR_FULL_ANALYSIS = 20000; // Reduced for faster processing
const CHUNK_SIZE = 10000; // Process 10k rows at a time for CPU-intensive operations

// Enhanced path normalization for Windows
export function normalizePath(filePath) {
  // Handle Windows paths with spaces and special characters
  let normalized = filePath;
  
  // Remove quotes if present
  normalized = normalized.replace(/^["']|["']$/g, '');
  
  // Convert forward slashes to backslashes on Windows
  if (os.platform() === 'win32') {
    normalized = normalized.replace(/\//g, '\\');
  }
  
  // Resolve to absolute path
  normalized = path.resolve(normalized);
  
  // On Windows, ensure proper drive letter format
  if (os.platform() === 'win32' && normalized.match(/^[a-z]:/i)) {
    normalized = normalized.charAt(0).toUpperCase() + normalized.slice(1);
  }
  
  return normalized;
}

// Enhanced encoding detection with better fallback
// Fast encoding detection - optimized for performance
export function detectEncodingFast(filePath) {
  try {
    const normalizedPath = normalizePath(filePath);
    
    // For CSV files, 99% are UTF-8. Skip expensive detection for speed.
    // Only do minimal BOM check which is very fast
    const fd = openSync(normalizedPath, 'r');
    const buffer = Buffer.alloc(3); // Check UTF-8 BOM only
    readSync(fd, buffer, 0, 3, 0);
    closeSync(fd);
    
    // Check for UTF-8 BOM (most common)
    if (buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
      return 'utf8';
    }
    
    // Default to UTF-8 for speed - let CSV parser handle encoding errors
    return 'utf8';
  } catch (error) {
    return 'utf8';
  }
}

// Legacy function kept for compatibility but optimized
export function detectEncoding(filePath) {
  // Use fast detection by default
  return detectEncodingFast(filePath);
}

// Fast delimiter detection - optimized for performance  
export function detectDelimiterFast(filePath, encoding = 'utf8') {
  try {
    const normalizedPath = normalizePath(filePath);
    // Read much smaller sample for speed - 2KB is usually enough
    const sample = readFileSync(normalizedPath, { encoding, end: 2048 }).toString();
    const lines = sample.split(/\r?\n/).filter(l => l.trim()).slice(0, 5); // Only check first 5 lines
    
    if (lines.length < 2) return ',';
    
    // Fast check - just count delimiters in first few lines
    const delimiters = [',', ';', '\t', '|'];
    const counts = {};
    
    for (const delimiter of delimiters) {
      counts[delimiter] = 0;
      for (const line of lines) {
        counts[delimiter] += (line.match(new RegExp(`\\${delimiter}`, 'g')) || []).length;
      }
    }
    
    // Return the delimiter with highest count
    return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b) || ',';
  } catch (error) {
    return ','; // Default to comma
  }
}

// Legacy function - now optimized
export function detectDelimiter(filePath, encoding = 'utf8') {
  return detectDelimiterFast(filePath, encoding);
}

// Combined fast detection - single file read for both encoding and delimiter
export function detectBothFast(filePath) {
  try {
    const normalizedPath = normalizePath(filePath);
    
    // Single file read - just 2KB for maximum speed
    const fd = openSync(normalizedPath, 'r');
    const buffer = Buffer.alloc(2048);
    const bytesRead = readSync(fd, buffer, 0, 2048, 0);
    closeSync(fd);
    
    // Check UTF-8 BOM
    let encoding = 'utf8';
    let startIndex = 0;
    if (bytesRead >= 3 && buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
      startIndex = 3; // Skip BOM
    }
    
    // Convert to string for delimiter detection
    const sample = buffer.slice(startIndex, bytesRead).toString(encoding);
    const lines = sample.split(/\r?\n/).filter(l => l.trim()).slice(0, 3); // Only first 3 lines
    
    if (lines.length < 2) {
      return { encoding, delimiter: ',' };
    }
    
    // Fast delimiter detection
    const delimiters = [',', ';', '\t', '|'];
    const counts = {};
    
    for (const delimiter of delimiters) {
      counts[delimiter] = 0;
      for (const line of lines) {
        counts[delimiter] += (line.match(new RegExp(`\\${delimiter}`, 'g')) || []).length;
      }
    }
    
    const delimiter = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b) || ',';
    
    return { encoding, delimiter };
  } catch (error) {
    return { encoding: 'utf8', delimiter: ',' };
  }
}

// Enhanced number parsing
function parseNumber(value) {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') return null;
  
  const trimmed = value.trim();
  
  // Reject date-like patterns before attempting number parsing
  if (/\d{4}-\d{2}-\d{2}/.test(trimmed) || 
      /\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}/.test(trimmed)) {
    return null;
  }
  
  // Remove currency symbols and spaces
  let cleaned = trimmed.replace(/[$€£¥₹\s]/g, '');
  
  // Handle different decimal separators
  if (cleaned.includes(',') && cleaned.includes('.')) {
    // Determine which is decimal separator
    const lastComma = cleaned.lastIndexOf(',');
    const lastDot = cleaned.lastIndexOf('.');
    
    if (lastComma > lastDot) {
      // Comma is decimal separator (European format)
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else {
      // Dot is decimal separator (US format)
      cleaned = cleaned.replace(/,/g, '');
    }
  } else if (cleaned.includes(',') && !cleaned.includes('.')) {
    // Check if comma is thousands separator or decimal
    const parts = cleaned.split(',');
    if (parts.length === 2 && parts[1].length <= 2) {
      // Likely decimal separator
      cleaned = cleaned.replace(',', '.');
    } else {
      // Likely thousands separator
      cleaned = cleaned.replace(/,/g, '');
    }
  }
  
  // Check for percentage
  if (cleaned.endsWith('%')) {
    const num = parseFloat(cleaned.slice(0, -1));
    return isNaN(num) ? null : num / 100;
  }
  
  // Try parsing
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

// Enhanced date parsing with Australian format priority
function parseDate(value, dateFormats = null) {
  if (value instanceof Date) return value;
  if (typeof value !== 'string') return null;
  
  const trimmed = value.trim();
  
  // Common date patterns with Australian priority
  const patterns = dateFormats || [
    // ISO formats
    /^\d{4}-\d{2}-\d{2}$/,
    /^\d{4}-\d{2}-\d{2}T/,
    /^\d{4}\/\d{2}\/\d{2}$/,
    // Australian format DD/MM/YYYY (prioritized)
    /^\d{1,2}\/\d{1,2}\/\d{4}$/,
    /^\d{1,2}-\d{1,2}-\d{4}$/,
    /^\d{1,2}\.\d{1,2}\.\d{4}$/,
    // Other formats
    /^\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i,
    /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2}/i
  ];
  
  // Check if it matches date patterns
  const hasDatePattern = patterns.some(pattern => 
    pattern.test ? pattern.test(trimmed) : trimmed.match(pattern)
  );
  
  if (!hasDatePattern) return null;
  
  // For DD/MM/YYYY format (Australian), parse explicitly
  if (trimmed.match(/^\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4}$/)) {
    const separator = trimmed.includes('/') ? '/' : trimmed.includes('-') ? '-' : '.';
    const parts = trimmed.split(separator);
    const day = parseInt(parts[0]);
    const month = parseInt(parts[1]);
    const year = parseInt(parts[2]);
    
    // Validate day and month
    if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
      // Use Australian format (DD/MM/YYYY)
      const date = new Date(year, month - 1, day);
      
      // Verify the date is valid
      if (date.getDate() === day && date.getMonth() === month - 1 && date.getFullYear() === year) {
        return date;
      }
    }
  }
  
  // Try standard Date parsing for other formats
  const date = new Date(trimmed);
  return isNaN(date.getTime()) ? null : date;
}

// Progress callback wrapper for better UI feedback
function createProgressCallback(spinner, totalSize) {
  let lastUpdate = Date.now();
  const updateInterval = 250; // Update every 250ms
  
  return (progress, rowCount) => {
    const now = Date.now();
    if (now - lastUpdate >= updateInterval) {
      const percentage = Math.round(progress);
      const sizeProcessed = (totalSize * progress / 100 / 1024 / 1024).toFixed(1);
      const totalSizeMB = (totalSize / 1024 / 1024).toFixed(1);
      
      spinner.text = `Processing: ${percentage}% (${sizeProcessed}MB / ${totalSizeMB}MB) - ${rowCount.toLocaleString()} rows processed`;
      lastUpdate = now;
    }
  };
}

// Helper function to attempt parsing with a specific encoding
async function attemptParse(filePath, encoding, options = {}) {
  const normalizedPath = normalizePath(filePath);
  const delimiter = options.delimiter || detectDelimiter(normalizedPath, encoding);
  const fileSize = statSync(normalizedPath).size;
  
  // Progressive sampling logic
  let useSampling = false;
  let sampleRate = 1.0;
  
  if (fileSize > SAMPLE_THRESHOLD && !options.noSampling) { // Use defined threshold
    const averageBytesPerRow = 80;
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
    useSampling = true;
    sampleRate = 1.0;
  }
  
  return await parseCSVWithEncoding(normalizedPath, encoding, delimiter, useSampling, sampleRate, options);
}

// Core parsing function with better error handling
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
  const spinner = options.quiet ? null : ora({
    text: 'Reading CSV file...',
    spinner: 'dots',
    color: 'cyan'
  }).start();
  
  // Show file size info immediately
  if (spinner && fileSize > 1024 * 1024) {
    const fileSizeMB = (fileSize / 1024 / 1024).toFixed(1);
    spinner.text = `Reading CSV file (${fileSizeMB}MB)...`;
  }
  
  // Create progress callback if spinner exists
  const progressCallback = spinner && fileSize > 1024 * 1024 ? 
    createProgressCallback(spinner, fileSize) : null;
  
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
    relax_column_count: true,
    quote: '"',
    escape: '"',
    skip_records_with_error: true,
    bom: true, // Handle BOM automatically
    max_record_size: 1048576, // 1MB max record size
    on_record: (record, { lines }) => {
      // Update progress via spinner
      if (spinner && lines % 1000 === 0) {
        const progress = (processedBytes / fileSize) * 100;
        if (progressCallback) {
          progressCallback(progress, lines);
        } else {
          spinner.text = `Processing row ${lines.toLocaleString()}...`;
        }
      }
      return record;
    },
    cast: (value) => {
      // Enhanced type casting with better error handling and debugging
      if (value === '' || value === null || value === undefined) return null;
      
      // Enhanced type casting
      if (typeof value === 'string') {
        const trimmed = value.trim();
        
        // Handle empty strings after trimming
        if (trimmed === '') return null;
        
        // Handle common null/undefined string representations
        if (['null', 'undefined', 'na', 'n/a', '#n/a', '#null!', 'nil', 'none'].includes(trimmed.toLowerCase())) {
          return null;
        }
        
        // Boolean values
        const lowerCase = trimmed.toLowerCase();
        if (['true', 'false', 'yes', 'no', '1', '0', 'y', 'n'].includes(lowerCase)) {
          return lowerCase === 'true' || lowerCase === 'yes' || lowerCase === '1' || lowerCase === 'y';
        }
        
        // Try number parsing (but be more conservative)
        if (/^[\d\s,.$€£¥₹%-]+$/.test(trimmed) && !/[a-zA-Z]/.test(trimmed)) {
          const num = parseNumber(trimmed);
          if (num !== null && !isNaN(num) && isFinite(num)) {
            return num;
          }
        }
        
        // Try date parsing (more conservative approach)
        if (trimmed.length >= 4 && /\d/.test(trimmed)) {
          const date = parseDate(trimmed);
          if (date !== null && date instanceof Date && !isNaN(date.getTime())) {
            return date;
          }
        }
        
        // Return the trimmed string if no conversion worked
        return trimmed;
      }
      
      // For non-string values, validate they're not problematic
      if (typeof value === 'number') {
        if (isNaN(value) || !isFinite(value)) {
          return null; // Convert problematic numbers to null
        }
        return value;
      }
      
      // Return the value as-is if it's already a proper type
      return value;
    }
  };

  const parser = parse({ ...parserOptions, ...options });

  parser.on('skip', (err) => {
    errorCount++;
    if (errorCount <= 5 && !options.quiet) {
      console.log(chalk.red(`\nSkipped row ${err.lines}: ${err.message}`));
    }
  });

  parser.on('error', (err) => {
    if (!options.quiet) {
      console.error(chalk.red(`\nParser error: ${err.message}`));
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
          
          // Memory management - check less frequently to avoid spam
          let aggressiveSampling = false;
          if (rowCount % 50000 === 0) {  // Check every 50k rows instead of 5k
            const memoryStatus = checkMemoryUsage();
            if (memoryStatus.shouldUseAggressiveSampling && !aggressiveSampling) {
              if (!options.quiet && !records._memoryWarningShown) {
                console.warn(chalk.red(`\nHigh memory usage detected (${memoryStatus.heapUsedGB.toFixed(1)}GB), enabling aggressive sampling`));
                records._memoryWarningShown = true;  // Flag to avoid repeating message
              }
              aggressiveSampling = true;
            }
          }
          
          // Apply sampling
          if (useSampling || aggressiveSampling) {
            if (sampleRate < 1.0 || aggressiveSampling) {
              const effectiveRate = aggressiveSampling ? Math.min(sampleRate * 0.1, 0.01) : sampleRate;
              if (Math.random() < effectiveRate) {
                records.push(processedRecord);
              } else {
                skipCount++;
              }
            } else if (records.length >= MAX_MEMORY_ROWS) {
              // Reservoir sampling
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
    
    if (spinner) {
      spinner.succeed(`Processed ${rowCount.toLocaleString()} rows`);
    }
    
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
    if (spinner) spinner.error({ text: 'Failed to parse CSV' });
    return { success: false, error };
  }
}

// Main parseCSV function with enhanced fallback mechanism
export async function parseCSV(filePath, options = {}) {
  // Normalize the file path first
  const normalizedPath = normalizePath(filePath);
  
  // Check if file exists
  if (!existsSync(normalizedPath)) {
    throw new Error(`File not found: ${normalizedPath}`);
  }
  
  // Fast combined detection - single file read instead of two separate reads
  const detected = detectBothFast(normalizedPath);
  const detectedEncoding = options.encoding || detected.encoding;
  const detectedDelimiter = options.delimiter || detected.delimiter;
  
  // Enhanced fallback encoding list - only include Node.js supported encodings
  // Note: UTF-32BE, ISO-8859-1, windows-1252 are not natively supported by Node.js
  // and can cause "Cannot read properties of undefined" errors
  const fallbackEncodings = ['utf8', 'latin1', 'utf16le', 'ascii'];
  const encodingsToTry = [detectedEncoding, ...fallbackEncodings.filter(e => e !== detectedEncoding)];
  
  let lastError = null;
  let attempts = [];
  let bestResult = null;
  let debugInfo = {
    fileSize: statSync(normalizedPath).size,
    detectedEncoding,
    detectedDelimiter,
    attempts: []
  };
  
  if (!options.quiet) {
    console.log(chalk.blue(`📊 Parsing CSV: ${normalizedPath}`));
    console.log(chalk.blue(`📏 File size: ${(debugInfo.fileSize / 1024 / 1024).toFixed(2)}MB`));
    console.log(chalk.blue(`🔤 Detected encoding: ${detectedEncoding}`));
    console.log(chalk.blue(`📋 Detected delimiter: ${detectedDelimiter === '\t' ? '\\t (tab)' : detectedDelimiter}`));
  }
  
  for (const encoding of encodingsToTry) {
    try {
      const result = await attemptParse(normalizedPath, encoding, { 
        ...options, 
        delimiter: detectedDelimiter,
        debugMode: true 
      });
      
      const attemptInfo = {
        encoding,
        success: result.success,
        recordCount: result.success ? result.data.length : 0,
        error: result.error?.message || null
      };
      
      debugInfo.attempts.push(attemptInfo);
      
      if (result.success) {
        // Validate the parsed data quality
        const dataQuality = validateParsedData(result.data, normalizedPath);
        attemptInfo.dataQuality = dataQuality;
        
        if (dataQuality.isAcceptable) {
          if (!options.quiet) {
            console.log(chalk.green(`✅ Successfully parsed with ${encoding} encoding`));
            console.log(chalk.green(`📊 Records: ${result.data.length.toLocaleString()}`));
            console.log(chalk.green(`📋 Columns: ${Object.keys(result.data[0] || {}).length}`));
            
            if (dataQuality.warnings.length > 0) {
              console.log(chalk.yellow('⚠️  Data quality warnings:'));
              dataQuality.warnings.forEach(warning => 
                console.log(chalk.yellow(`   • ${warning}`))
              );
            }
          }
          return result.data;
        } else {
          // Data quality is poor, try next encoding
          if (!options.quiet) {
            console.log(chalk.yellow(`⚠️  ${encoding} parsing succeeded but data quality is poor:`));
            dataQuality.issues.forEach(issue => 
              console.log(chalk.yellow(`   • ${issue}`))
            );
          }
          bestResult = bestResult || { result, encoding, dataQuality };
        }
      }
      
      lastError = result.error;
      attempts.push({ encoding, error: result.error?.message || 'Unknown error' });
      if (!options.quiet && encodingsToTry.indexOf(encoding) < encodingsToTry.length - 1) {
        console.log(chalk.yellow(`❌ Failed with ${encoding} encoding, trying next...`));
      }
      continue;
    } catch (e) {
      lastError = e;
      const attemptInfo = {
        encoding,
        success: false,
        recordCount: 0,
        error: e.message
      };
      debugInfo.attempts.push(attemptInfo);
      attempts.push({ encoding, error: e.message });
      if (!options.quiet && encodingsToTry.indexOf(encoding) < encodingsToTry.length - 1) {
        console.log(chalk.yellow(`❌ Failed with ${encoding} encoding: ${e.message}`));
      }
      continue;
    }
  }
  
  // If we have a result with poor quality, use it as fallback
  if (bestResult) {
    if (!options.quiet) {
      console.log(chalk.yellow('📊 Using best available result despite quality issues'));
    }
    return bestResult.result.data;
  }
  
  // Enhanced error message with debugging information
  const attemptDetails = attempts.map(a => `  • ${a.encoding}: ${a.error}`).join('\n');
  
  // Check for specific problematic encoding mentions
  const hasProblematicEncodings = attemptDetails.includes('UTF-32BE') || 
                                  attemptDetails.includes('ISO-8859-1') || 
                                  attemptDetails.includes('windows-1252');
  
  let errorMessage = `
🚨 CSV PARSING FAILED

📁 File: ${normalizedPath}
📏 Size: ${(debugInfo.fileSize / 1024 / 1024).toFixed(2)}MB
🔤 Detected encoding: ${detectedEncoding}
📋 Detected delimiter: ${detectedDelimiter === '\t' ? 'TAB' : detectedDelimiter}

❌ All encoding attempts failed:
${attemptDetails}`;

  if (hasProblematicEncodings) {
    errorMessage += `

⚠️ **ENCODING DETECTION ISSUE DETECTED**:
The system attempted to use UTF-32BE, ISO-8859-1, or windows-1252 encodings,
which are not directly supported by Node.js and can cause undefined property errors.

🔧 **SPECIFIC FIXES FOR ENCODING ISSUES**:
1. 📄 **Save file as UTF-8**: Open the file in a text editor and save as UTF-8
2. 🔄 **Convert encoding**: Use tools like iconv to convert to UTF-8:
   \`iconv -f ISO-8859-1 -t UTF-8 input.csv > output.csv\`
3. 📝 **Check file source**: Ensure the file wasn't exported with unusual encoding
`;
  }

  errorMessage += `

🔧 TROUBLESHOOTING SUGGESTIONS:

1. 📝 **Check file format**:
   • Ensure the file is actually a CSV (not Excel, XML, etc.)
   • Verify the file isn't corrupted or partially downloaded

2. 🔤 **Try manual encoding**:
   • Convert file to UTF-8 using a text editor
   • Check for non-standard characters in column headers

3. 📋 **Check delimiter**:
   • File might use semicolon (;) or tab (\\t) instead of comma
   • Special characters in data might be interfering

4. 🛠️ **Manual fixes**:
   • Remove or escape special characters from column names
   • Check for embedded newlines in data fields
   • Ensure all rows have the same number of columns

5. 🔍 **Debug mode**:
   • Run with --verbose flag for more detailed error information
   • Check the first few lines of the file manually

📞 If issues persist, please report this with a sample of your data structure.
`;
  
  throw new Error(errorMessage);
}

// Add data validation function
function validateParsedData(records, filePath) {
  const validation = {
    isAcceptable: true,
    warnings: [],
    issues: [],
    metrics: {}
  };
  
  // Check if we have any data
  if (!records || records.length === 0) {
    validation.isAcceptable = false;
    validation.issues.push('No records parsed from file');
    return validation;
  }
  
  // Check for columns
  const firstRecord = records[0];
  const columnCount = Object.keys(firstRecord || {}).length;
  validation.metrics.columnCount = columnCount;
  
  if (columnCount === 0) {
    validation.isAcceptable = false;
    validation.issues.push('No columns detected in parsed data');
    return validation;
  }
  
  // Check for undefined/null dominance
  let totalCells = 0;
  let undefinedCells = 0;
  let nullCells = 0;
  let emptyCells = 0;
  
  records.slice(0, Math.min(100, records.length)).forEach(record => {
    Object.values(record).forEach(value => {
      totalCells++;
      if (value === undefined) undefinedCells++;
      else if (value === null) nullCells++;
      else if (value === '') emptyCells++;
    });
  });
  
  const undefinedPercentage = (undefinedCells / totalCells) * 100;
  const nullPercentage = (nullCells / totalCells) * 100;
  const emptyPercentage = (emptyCells / totalCells) * 100;
  
  validation.metrics.undefinedPercentage = undefinedPercentage;
  validation.metrics.nullPercentage = nullPercentage;
  validation.metrics.emptyPercentage = emptyPercentage;
  
  // Flag as unacceptable if too many undefined values
  if (undefinedPercentage > 80) {
    validation.isAcceptable = false;
    validation.issues.push(`${undefinedPercentage.toFixed(1)}% of values are undefined - parsing likely failed`);
  } else if (undefinedPercentage > 50) {
    validation.warnings.push(`${undefinedPercentage.toFixed(1)}% of values are undefined`);
  }
  
  // Check for suspicious column names
  const columns = Object.keys(firstRecord);
  const suspiciousColumns = columns.filter(col => 
    col.includes('undefined') || 
    col.match(/^column\d+$/i) || 
    col.trim() === '' ||
    col.includes('\n') ||
    col.includes('\r')
  );
  
  if (suspiciousColumns.length > 0) {
    validation.warnings.push(`Suspicious column names detected: ${suspiciousColumns.join(', ')}`);
  }
  
  // Check data consistency across rows
  const columnCounts = records.slice(0, 10).map(record => Object.keys(record).length);
  const inconsistentColumns = new Set(columnCounts).size > 1;
  
  if (inconsistentColumns) {
    validation.warnings.push('Inconsistent column counts across rows - may indicate parsing issues');
  }
  
  // Reasonable record count check
  if (records.length < 2) {
    validation.warnings.push('Very few records parsed - file might be mostly headers or empty');
  }
  
  return validation;
}

// Enhanced column type detection
export function detectColumnTypes(records) {
  // Safety checks for undefined or invalid input
  if (!records || !Array.isArray(records) || records.length === 0) {
    return {};
  }
  
  // Safety check for first record
  if (!records[0] || typeof records[0] !== 'object') {
    return {};
  }
  
  const columns = Object.keys(records[0]);
  const columnTypes = {};
  const spinner = null; // Disable spinner in detectColumnTypes to avoid conflicts
  
  // Sample records for type detection on large datasets
  const sampleSize = Math.min(1000, records.length);
  const sampledRecords = records.length > 1000 
    ? records.slice(0, sampleSize) 
    : records;
  
  for (const [index, column] of columns.entries()) {
    if (spinner) spinner.text = `Analyzing column types... (${index + 1}/${columns.length})`;
    
    const values = sampledRecords.map(r => r[column]).filter(v => v !== null);
    
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
      nullCount: records.filter(r => r[column] === null).length,
      nullPercentage: (records.filter(r => r[column] === null).length / records.length * 100).toFixed(1)
    };
  }
  
  if (spinner) spinner.succeed('Column analysis complete');
  return columnTypes;
}

// Enhanced column value analysis
function analyzeColumnValues(values, totalRecords) {
  const typeVotes = {
    integer: 0,
    float: 0,
    date: 0,
    email: 0,
    phone: 0,
    postcode: 0,
    boolean: 0,
    url: 0,
    currency: 0
  };
  
  const dateFormats = new Set();
  const sampleValues = [];
  
  for (const value of values) {
    // Keep sample values
    if (sampleValues.length < 5 && typeof value === 'string') {
      sampleValues.push(value);
    }
    
    // Check for boolean first
    if (typeof value === 'boolean') {
      typeVotes.boolean++;
      continue;
    }
    
    // Check for Date objects (created during CSV parsing)
    if (value instanceof Date) {
      typeVotes.date++;
      if (sampleValues.length < 5) {
        sampleValues.push(value.toISOString().split('T')[0]); // Add as YYYY-MM-DD string
      }
      continue;
    }
    
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
      
      // Currency check
      if (/^[$€£¥₹][\d,]+\.?\d*$/.test(trimmed) || /^[\d,]+\.?\d*\s*[$€£¥₹]$/.test(trimmed)) {
        typeVotes.currency++;
        typeVotes.float++; // Also count as float
      }
      
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
      
      // Phone check (enhanced for international formats)
      // But exclude date-like patterns first
      if (!/\d{4}-\d{2}-\d{2}/.test(trimmed) && 
          !/\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}/.test(trimmed)) {
        const phoneDigits = trimmed.replace(/[^\d]/g, '');
        if (phoneDigits.length >= 8 && phoneDigits.length <= 15 && 
            /^[\d\s\-\+\(\)\.ext]+$/i.test(trimmed)) {
          typeVotes.phone++;
        }
      }
      
      // Australian postcode
      if (/^[0-9]{4}$/.test(trimmed)) {
        typeVotes.postcode++;
      }
      
      // Date detection
      if (value instanceof Date || 
          /\d{4}-\d{2}-\d{2}/.test(trimmed) ||
          /\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}/.test(trimmed)) {
        typeVotes.date++;
        
        // Track date format
        if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
          dateFormats.add('YYYY-MM-DD');
        } else if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)) {
          dateFormats.add('DD/MM/YYYY');
        } else if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(trimmed)) {
          dateFormats.add('DD-MM-YYYY');
        }
      }
      
      // Number check
      const num = parseNumber(trimmed);
      if (num !== null) {
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
  
  // Create prioritised list to handle ties (dates should win over numbers)
  const typePriority = ['date', 'email', 'url', 'phone', 'postcode', 'boolean', 'currency', 'float', 'integer'];
  
  for (const type of typePriority) {
    if (typeVotes[type] > 0) {
      const score = typeVotes[type] / totalVotes;
      if (score > bestScore || (score === bestScore && score > 0)) {
        bestScore = score;
        bestType = type;
        confidence = score;
      }
    }
  }
  
  // Special handling for numeric types
  if (bestType === 'integer' || bestType === 'float' || bestType === 'currency') {
    const numericVotes = typeVotes.integer + typeVotes.float + typeVotes.currency;
    if (numericVotes / totalVotes > 0.9) {
      bestType = typeVotes.float > 0 || typeVotes.currency > 0 ? 'float' : 'integer';
      confidence = numericVotes / totalVotes;
    }
  }
  
  // Check for categorical
  const uniqueValues = [...new Set(values.filter(v => typeof v === 'string'))];
  if (bestType === 'string' && uniqueValues.length < Math.min(20, totalRecords * 0.1)) {
    return {
      type: 'categorical',
      categories: uniqueValues.sort(),
      confidence: 1.0,
      uniqueCount: uniqueValues.length,
      sampleValues: sampleValues.slice(0, 3)
    };
  }
  
  // Check for identifier
  const allUniqueValues = [...new Set(values)];
  if (bestType === 'string' && allUniqueValues.length > totalRecords * 0.95) {
    return {
      type: 'identifier',
      confidence: allUniqueValues.length / totalRecords,
      uniqueCount: allUniqueValues.length,
      sampleValues: sampleValues.slice(0, 3)
    };
  }
  
  // Prepare result
  const result = {
    type: bestType,
    confidence: confidence,
    sampleValues: sampleValues.slice(0, 3)
  };
  
  // Add type-specific metadata
  if (bestType === 'date' && dateFormats.size > 0) {
    result.formats = Array.from(dateFormats);
  }
  
  if (bestType === 'integer' || bestType === 'float' || bestType === 'currency') {
    const numbers = values.map(v => parseNumber(v)).filter(n => n !== null);
    if (numbers.length > 0) {
      result.min = Math.min(...numbers);
      result.max = Math.max(...numbers);
      result.mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
      result.uniqueCount = [...new Set(numbers)].length;
    }
  }
  
  return result;
}

// Chunked processing utility
export async function processInChunks(records, processor, chunkSize = CHUNK_SIZE) {
  const results = [];
  const totalChunks = Math.ceil(records.length / chunkSize);
  
  for (let i = 0; i < records.length; i += chunkSize) {
    const chunkIndex = Math.floor(i / chunkSize) + 1;
    const chunk = records.slice(i, i + chunkSize);
    
    if (totalChunks > 1) {
      console.log(chalk.blue(`Processing chunk ${chunkIndex}/${totalChunks}...`));
    }
    
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
  const totalMemoryGB = os.totalmem() / (1024 * 1024 * 1024);
  const freeMemoryGB = os.freemem() / (1024 * 1024 * 1024);
  
  return {
    heapUsed: used.heapUsed,
    heapUsedGB: memoryUsageGB,
    totalMemoryGB,
    freeMemoryGB,
    memoryPercentage: (memoryUsageGB / totalMemoryGB) * 100,
    isHighMemory: memoryUsageGB > 1, // 1GB threshold
    shouldUseAggressiveSampling: memoryUsageGB > 1.5 // Don't use freeMemoryGB as it might be unreliable
  };
}

// File hash utility for caching
export function getFileHash(filePath) {
  const normalizedPath = normalizePath(filePath);
  const hash = crypto.createHash('md5');
  const stream = createReadStream(normalizedPath);
  
  return new Promise((resolve, reject) => {
    stream.on('data', data => hash.update(data));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

// Configuration loader with Windows path support
export function loadConfig() {
  const defaultConfig = {
    performance: {
      maxMemoryRows: 100000,
      chunkSize: 10000,
      sampleRate: 0.01,
      workerThreads: "auto",
      progressUpdateInterval: 250
    },
    parsing: {
      encoding: "auto",
      delimiter: "auto",
      quoteChar: '"',
      escapeChar: '"',
      maxRecordSize: 1048576,
      dateFormats: ["DD/MM/YYYY", "YYYY-MM-DD", "DD-MM-YYYY"]
    },
    ui: {
      showProgress: true,
      colorOutput: true,
      verboseErrors: false
    }
  };

  // Look for config file in multiple locations
  const configPaths = [
    './datapilot.config.json',
    path.join(process.cwd(), 'datapilot.config.json'),
    path.join(os.homedir(), '.datapilot', 'config.json'),
    path.join(process.env.APPDATA || '', 'datapilot', 'config.json')
  ].filter(p => p);

  for (const configPath of configPaths) {
    try {
      const normalizedConfigPath = normalizePath(configPath);
      if (existsSync(normalizedConfigPath)) {
        const userConfig = JSON.parse(readFileSync(normalizedConfigPath, 'utf8'));
        return { ...defaultConfig, ...userConfig };
      }
    } catch (error) {
      console.warn(chalk.yellow(`Warning: Invalid config file at ${configPath}, using defaults`));
    }
  }

  return defaultConfig;
}

// Export additional utilities
export default {
  parseCSV,
  detectColumnTypes,
  detectEncoding,
  detectDelimiter,
  detectBothFast,
  processInChunks,
  checkMemoryUsage,
  getFileHash,
  loadConfig,
  normalizePath
};
