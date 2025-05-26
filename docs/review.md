DataPilot Issue Report & Recommendations
1. CSV Parsing Issue: Quoted Values with Commas
Problem: CSV files with quoted values containing commas (e.g., "$2,500.75") are failing to parse correctly.
Root Cause: The csv-parse library is configured with relax_quotes: true but needs additional configuration for proper RFC 4180 compliance.
Fix:
javascript// In parser.js, update parserOptions:
const parserOptions = {
  columns: hasHeader ? true : false,
  skip_empty_lines: true,
  trim: true,
  delimiter,
  encoding,
  relax_quotes: true,
  relax_column_count: true,  // Add this
  quote: '"',                // Explicitly set quote character
  escape: '"',               // Set escape character (for quotes inside quotes)
  skip_records_with_error: true,
  // ... rest of options
};
Additional Recommendation: Consider switching to papaparse which handles edge cases better:
javascriptimport Papa from 'papaparse';

// Replace csv-parse with:
Papa.parse(fileStream, {
  delimiter: delimiter,
  header: hasHeader,
  dynamicTyping: true,
  skipEmptyLines: true,
  fastMode: false,  // Ensures proper quote handling
  // ... other options
});
2. Performance Issue: Large Dataset Handling
Problem: 16,000 rows taking 30+ seconds to process. Need to handle 1M+ rows.
Current State: Code has sampling (MAX_MEMORY_ROWS = 100,000) but still slow.
Fixes:

Implement Progressive Sampling:

javascript// Current: Loads 100k rows then samples
// Better: Sample while streaming
const SAMPLE_RATE = 0.01; // 1% sampling for files > 1M rows
const MAX_ROWS_FOR_FULL_ANALYSIS = 50000;

// In parseCSV function:
if (fileSize > 100 * 1024 * 1024) { // 100MB
  const estimatedRows = fileSize / averageBytesPerRow;
  if (estimatedRows > MAX_ROWS_FOR_FULL_ANALYSIS) {
    useSampling = true;
    sampleRate = Math.min(MAX_ROWS_FOR_FULL_ANALYSIS / estimatedRows, 1);
  }
}

Add Worker Threads for CPU-intensive Operations:

javascript// Create worker-pool.js
const { Worker } = require('worker_threads');
const os = require('os');

class WorkerPool {
  constructor(workerScript, poolSize = os.cpus().length) {
    this.workers = [];
    this.freeWorkers = [];
    
    for (let i = 0; i < poolSize; i++) {
      const worker = new Worker(workerScript);
      this.workers.push(worker);
      this.freeWorkers.push(worker);
    }
  }
  
  async process(data) {
    const worker = this.freeWorkers.pop();
    if (!worker) {
      // Queue the work
      return new Promise((resolve) => {
        this.queue.push({ data, resolve });
      });
    }
    
    return new Promise((resolve) => {
      worker.postMessage(data);
      worker.once('message', (result) => {
        this.freeWorkers.push(worker);
        resolve(result);
      });
    });
  }
}

Implement Chunked Processing:

javascriptconst CHUNK_SIZE = 10000; // Process 10k rows at a time

async function processInChunks(records, processor) {
  const results = [];
  
  for (let i = 0; i < records.length; i += CHUNK_SIZE) {
    const chunk = records.slice(i, i + CHUNK_SIZE);
    const chunkResults = await processor(chunk);
    results.push(...chunkResults);
    
    // Allow event loop to breathe
    await new Promise(resolve => setImmediate(resolve));
  }
  
  return results;
}

Add Progress Reporting:

javascript// Add progress callback option
export async function parseCSV(filePath, options = {}) {
  const { onProgress } = options;
  let processedBytes = 0;
  
  // In the streaming pipeline:
  .on('data', (chunk) => {
    processedBytes += chunk.length;
    if (onProgress) {
      const progress = (processedBytes / fileSize) * 100;
      onProgress(progress, rowCount);
    }
  })
}
3. Encoding Detection Issues
Problem: Incorrect encoding mapping causing data to be misread.
Fixes:

Update Encoding Map:

javascriptconst encodingMap = {
  'UTF-8': 'utf8',
  'ascii': 'ascii',
  'windows-1250': 'latin1',  // Was missing
  'windows-1252': 'latin1',
  'ISO-8859-1': 'latin1',
  'UTF-16LE': 'utf16le',
  'UTF-16BE': 'utf16be',
  'UTF-32LE': 'utf32le',     // Add more encodings
  'UTF-32BE': 'utf32be',
  'Big5': 'big5',
  'Shift_JIS': 'shiftjis'
};

Add Encoding Validation:

javascriptexport function detectEncoding(filePath) {
  try {
    const encoding = chardet.detectFileSync(filePath, { sampleSize: 65536 });
    
    // Validate detected encoding
    if (!encoding) {
      console.log(chalk.yellow('Could not detect encoding, trying UTF-8 with BOM detection'));
      
      // Check for BOM
      const fd = fs.openSync(filePath, 'r');
      const buffer = Buffer.alloc(3);
      fs.readSync(fd, buffer, 0, 3, 0);
      fs.closeSync(fd);
      
      if (buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
        return 'utf8-bom';
      }
    }
    
    // ... rest of function
  } catch (error) {
    console.log(chalk.yellow('Encoding detection failed, defaulting to UTF-8'));
    return 'utf8';
  }
}

Add Fallback Mechanism:

javascript// If parsing fails with detected encoding, retry with different encodings
const fallbackEncodings = ['utf8', 'latin1', 'utf16le'];

for (const encoding of [detectedEncoding, ...fallbackEncodings]) {
  try {
    const result = await attemptParse(filePath, encoding);
    if (result.success) return result.data;
  } catch (e) {
    continue;
  }
}
4. Performance Benchmarks & Targets
Current Performance: ~500 rows/second (16k rows in ~30s)
Target Performance: 50,000+ rows/second
To achieve this:

Use streaming throughout (never load full file into memory)
Process in parallel where possible (column analysis)
Use native C++ addons for heavy computation (consider using node-gyp)
Implement intelligent sampling for files > 100k rows
Cache analysis results for repeated files (using file hash)

5. Additional Recommendations

Add Configuration File:

javascript// datapilot.config.json
{
  "performance": {
    "maxMemoryRows": 100000,
    "chunkSize": 10000,
    "sampleRate": 0.01,
    "workerThreads": "auto"
  },
  "parsing": {
    "encoding": "auto",
    "delimiter": "auto",
    "quoteChar": "\"",
    "escapeChar": "\""
  }
}

Add Memory Usage Monitoring:

javascriptconst used = process.memoryUsage();
if (used.heapUsed > 1024 * 1024 * 1024) { // 1GB
  console.warn('High memory usage detected, enabling aggressive sampling');
  options.aggressiveSampling = true;
}

Implement Caching for Repeated Analyses:

javascriptconst crypto = require('crypto');

function getFileHash(filePath) {
  const hash = crypto.createHash('md5');
  const stream = fs.createReadStream(filePath);
  return new Promise((resolve, reject) => {
    stream.on('data', data => hash.update(data));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}
Summary
The main issues are:

CSV Parsing: Need better quote handling configuration
Performance: Need streaming + workers + sampling for large files
Encoding: Need better encoding detection and fallbacks

The fixes above should allow DataPilot to handle 1M+ row files efficiently while maintaining accuracy for smaller datasets.