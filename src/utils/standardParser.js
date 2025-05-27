/**
 * Unified CSV Parser for DataPilot
 * Provides consistent parsing across all commands with smart sampling
 */

import { parse } from 'csv-parse';
import { promises as fs } from 'fs';
import { createReadStream } from 'fs';
import { Writable } from 'stream';
import chardet from 'chardet';
import iconv from 'iconv-lite';
import { createSamplingStrategy, performSampling } from '../commands/eda/utils/sampling.js';

export class StandardCSVParser {
  constructor(options = {}) {
    this.options = {
      // Default parsing configuration
      columns: true,              // Always return objects
      skip_empty_lines: true,
      trim: true,
      delimiter: ',',
      quote: '"',
      escape: '"',
      auto_parse: false,          // Keep as strings for type detection
      cast: false,
      relax_column_count: true,   // Handle irregular rows
      relax_quotes: true,
      on_record: this.validateRecord.bind(this),
      ...options
    };
    
    this.stats = {
      totalRows: 0,
      skippedRows: 0,
      errors: [],
      encoding: null,
      delimiter: ',',
      samplingApplied: false,
      originalSize: 0,
      processedSize: 0
    };
  }
  
  /**
   * Auto-detect file encoding
   */
  async detectEncoding(filePath) {
    try {
      const buffer = await fs.readFile(filePath);
      const detected = chardet.detect(buffer);
      
      // Common encoding mappings
      const encodingMap = {
        'UTF-8': 'utf8',
        'ISO-8859-1': 'latin1',
        'windows-1252': 'latin1',
        'windows-1250': 'latin1'
      };
      
      this.stats.encoding = detected || 'utf8';
      return encodingMap[this.stats.encoding] || 'utf8';
    } catch (error) {
      console.warn('Encoding detection failed, using UTF-8:', error.message);
      this.stats.encoding = 'utf8';
      return 'utf8';
    }
  }
  
  /**
   * Auto-detect CSV delimiter
   */
  async detectDelimiter(filePath, encoding) {
    try {
      const sample = await this.readSample(filePath, encoding, 1000);
      
      const delimiters = [',', ';', '\t', '|'];
      let bestDelimiter = ',';
      let maxColumns = 0;
      
      for (const delimiter of delimiters) {
        const lines = sample.split('\n').slice(0, 5);
        let avgColumns = 0;
        
        for (const line of lines) {
          if (line.trim()) {
            const columns = line.split(delimiter).length;
            avgColumns += columns;
          }
        }
        
        avgColumns = avgColumns / lines.length;
        
        if (avgColumns > maxColumns && avgColumns > 1) {
          maxColumns = avgColumns;
          bestDelimiter = delimiter;
        }
      }
      
      this.stats.delimiter = bestDelimiter;
      return bestDelimiter;
    } catch (error) {
      console.warn('Delimiter detection failed, using comma:', error.message);
      this.stats.delimiter = ',';
      return ',';
    }
  }
  
  /**
   * Read file sample for analysis
   */
  async readSample(filePath, encoding, bytes = 8192) {
    const stream = createReadStream(filePath, { 
      encoding: encoding,
      start: 0,
      end: bytes 
    });
    
    let content = '';
    for await (const chunk of stream) {
      content += chunk;
    }
    
    return content;
  }
  
  /**
   * Validate and clean record
   */
  validateRecord(record, context) {
    try {
      // Skip empty records
      if (!record || Object.keys(record).length === 0) {
        this.stats.skippedRows++;
        return null;
      }
      
      // Clean null/undefined values
      const cleaned = {};
      for (const [key, value] of Object.entries(record)) {
        if (key && key.trim()) {
          cleaned[key.trim()] = value === null || value === undefined ? null : String(value).trim();
        }
      }
      
      this.stats.totalRows++;
      return cleaned;
    } catch (error) {
      this.stats.errors.push({
        row: context.lines,
        error: error.message,
        record
      });
      this.stats.skippedRows++;
      return null;
    }
  }
  
  /**
   * Parse CSV file with automatic configuration detection
   */
  async parseFile(filePath, options = {}) {
    const startTime = Date.now();
    
    try {
      // Reset stats
      this.stats = {
        totalRows: 0,
        skippedRows: 0,
        errors: [],
        encoding: null,
        delimiter: ',',
        samplingApplied: false,
        originalSize: 0,
        processedSize: 0
      };
      
      // Auto-detect encoding and delimiter
      const encoding = await this.detectEncoding(filePath);
      const delimiter = await this.detectDelimiter(filePath, encoding);
      
      if (!options.quiet) {
        console.log(`Detected ${this.stats.encoding} encoding (will handle automatically)`);
      }
      
      // Update parser configuration
      const parserOptions = {
        ...this.options,
        delimiter,
        ...options
      };
      
      // Parse file
      const records = await this.streamParse(filePath, encoding, parserOptions, options);
      
      // Apply smart sampling if needed
      const samplingStrategy = createSamplingStrategy(records, options.analysisType || 'basic');
      this.stats.originalSize = records.length;
      
      let finalRecords = records;
      if (samplingStrategy.method !== 'none') {
        finalRecords = performSampling(records, samplingStrategy);
        this.stats.samplingApplied = true;
        this.stats.processedSize = finalRecords.length;
        
        if (!options.quiet) {
          console.log(`⚠️  Large dataset sampled: ${finalRecords.length.toLocaleString()} of ${records.length.toLocaleString()} rows (${samplingStrategy.method} sampling)`);
        }
      } else {
        this.stats.processedSize = records.length;
      }
      
      const duration = Date.now() - startTime;
      
      if (!options.quiet) {
        console.log(`✔ Processed ${finalRecords.length.toLocaleString()} rows in ${duration}ms`);
      }
      
      return {
        records: finalRecords,
        headers: finalRecords.length > 0 ? Object.keys(finalRecords[0]) : [],
        stats: this.stats,
        originalRecords: records // Keep reference for full analysis if needed
      };
      
    } catch (error) {
      throw new Error(`CSV parsing failed: ${error.message}`);
    }
  }
  
  /**
   * Stream-based CSV parsing
   */
  async streamParse(filePath, encoding, parserOptions, options) {
    return new Promise((resolve, reject) => {
      const records = [];
      const errors = [];
      
      // Create read stream with encoding
      const readStream = createReadStream(filePath);
      const encodingStream = iconv.decodeStream(encoding);
      
      // Create CSV parser
      const parser = parse(parserOptions);
      
      // Create collection stream
      const collector = new Writable({
        objectMode: true,
        write(record, encoding, callback) {
          if (record) {
            records.push(record);
          }
          callback();
        }
      });
      
      // Error handling
      const handleError = (error) => {
        errors.push(error);
        if (!options.tolerateErrors) {
          reject(error);
        }
      };
      
      readStream.on('error', handleError);
      encodingStream.on('error', handleError);
      parser.on('error', handleError);
      collector.on('error', handleError);
      
      // Success handling
      collector.on('finish', () => {
        this.stats.errors = errors;
        resolve(records);
      });
      
      // Pipeline
      readStream
        .pipe(encodingStream)
        .pipe(parser)
        .pipe(collector);
    });
  }
  
  /**
   * Get parsing statistics
   */
  getStats() {
    return {
      ...this.stats,
      errorRate: this.stats.errors.length / (this.stats.totalRows + this.stats.skippedRows),
      skipRate: this.stats.skippedRows / (this.stats.totalRows + this.stats.skippedRows),
      samplingRate: this.stats.samplingApplied ? this.stats.processedSize / this.stats.originalSize : 1.0
    };
  }
}