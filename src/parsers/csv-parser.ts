/**
 * High-performance streaming CSV parser
 * Optimized for large files with minimal memory usage
 */

import { createReadStream, statSync } from 'fs';
import { Transform } from 'stream';
import { pipeline } from 'stream/promises';
import type { CSVParserOptions, ParsedRow, ParserStats } from './types';
import { OPTIMAL_CHUNK_SIZE, MAX_SAMPLE_SIZE } from './types';
import { CSVDetector } from './csv-detector';
import { CSVStateMachine } from './csv-state-machine';
import { DataPilotError } from '../core/types';

export class CSVParser {
  private options: Required<CSVParserOptions>;
  private stats: ParserStats;
  private aborted = false;

  constructor(options: Partial<CSVParserOptions> = {}) {
    this.options = {
      delimiter: ',',
      quote: '"',
      escape: '"',
      encoding: 'utf8',
      hasHeader: true,
      lineEnding: '\n',
      skipEmptyLines: true,
      maxRows: options.maxRows ?? 1000000, // Default 1M rows to prevent memory issues
      chunkSize: OPTIMAL_CHUNK_SIZE,
      detectTypes: true,
      trimFields: true,
      maxFieldSize: 1024 * 1024, // 1MB per field
      autoDetect: true,
      sampleSize: MAX_SAMPLE_SIZE,
      ...options,
    };

    this.stats = {
      bytesProcessed: 0,
      rowsProcessed: 0,
      errors: [],
      startTime: Date.now(),
    };
  }

  /**
   * Parse CSV file with automatic format detection
   */
  async parseFile(filePath: string): Promise<ParsedRow[]> {
    try {
      // Get file stats
      const fileStats = statSync(filePath);

      if (fileStats.size === 0) {
        throw new DataPilotError('File is empty', 'EMPTY_FILE');
      }

      // Auto-detect format if enabled
      if (this.options.autoDetect) {
        await this.detectFormat(filePath);
      }

      // For large files, use streaming with batching to prevent memory overflow
      const fileSizeMB = fileStats.size / (1024 * 1024);
      const isLargeFile = fileSizeMB > 100; // Files over 100MB

      if (isLargeFile) {
        return this.parseFileStreaming(filePath);
      }

      // Create parsing pipeline for smaller files
      const rows: ParsedRow[] = [];
      const readStream = createReadStream(filePath, {
        encoding: this.options.encoding,
        highWaterMark: this.options.chunkSize,
      });

      const parseTransform = this.createParseTransform((row) => {
        rows.push(row);

        // Check for memory pressure and switch to streaming if needed
        if (rows.length % 10000 === 0) {
          const memUsage = process.memoryUsage();
          this.stats.peakMemoryUsage = Math.max(this.stats.peakMemoryUsage || 0, memUsage.heapUsed);

          if (memUsage.heapUsed > 1024 * 1024 * 1024) {
            // 1GB threshold
            throw new DataPilotError(
              'Memory limit reached, file too large for in-memory parsing',
              'MEMORY_LIMIT',
            );
          }
        }
      });

      // Process file
      await pipeline(readStream, parseTransform);

      this.stats.endTime = Date.now();
      return rows;
    } catch (error) {
      if (error instanceof DataPilotError && error.code === 'MEMORY_LIMIT') {
        // Fallback to streaming for large datasets
        return this.parseFileStreaming(filePath);
      }

      throw new DataPilotError(
        `Failed to parse CSV file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'PARSE_FAILED',
        { filePath, stats: this.stats },
      );
    }
  }

  /**
   * Parse large CSV files using streaming with memory-efficient batching
   */
  private async parseFileStreaming(filePath: string): Promise<ParsedRow[]> {
    const rows: ParsedRow[] = [];
    const batchSize = 1000; // Process in batches
    let currentBatch: ParsedRow[] = [];

    const readStream = createReadStream(filePath, {
      encoding: this.options.encoding,
      highWaterMark: this.options.chunkSize,
    });

    const parseTransform = this.createParseTransform((row) => {
      currentBatch.push(row);

      // Process batch and clear memory periodically
      if (currentBatch.length >= batchSize) {
        rows.push(...currentBatch);
        currentBatch = []; // Clear batch to free memory

        // Track memory usage
        const memUsage = process.memoryUsage();
        this.stats.peakMemoryUsage = Math.max(this.stats.peakMemoryUsage || 0, memUsage.heapUsed);

        // Respect maxRows limit to prevent unbounded growth
        if (rows.length >= this.options.maxRows) {
          this.abort();
        }
      }
    });

    await pipeline(readStream, parseTransform);

    // Add any remaining rows in the final batch
    if (currentBatch.length > 0) {
      rows.push(...currentBatch);
    }

    this.stats.endTime = Date.now();
    return rows;
  }

  /**
   * Create a streaming parser that can process large files
   */
  createStream(): Transform {
    return this.createParseTransform();
  }

  /**
   * Parse CSV from string data
   */
  parseString(data: string): ParsedRow[] {
    const stateMachine = new CSVStateMachine({
      delimiter: this.options.delimiter,
      quote: this.options.quote,
      escape: this.options.escape,
      trimFields: this.options.trimFields,
      maxFieldSize: this.options.maxFieldSize,
    });

    const rawRows = stateMachine.processChunk(data);
    const finalRow = stateMachine.finalize();

    if (finalRow) {
      rawRows.push(finalRow);
    }

    const stats = stateMachine.getStats();
    this.stats.errors.push(...stats.errors);
    this.stats.bytesProcessed = data.length;

    // Apply maxRows limit
    const limitedRawRows = rawRows.slice(0, this.options.maxRows);
    const processedRows = this.processRawRows(limitedRawRows);

    this.stats.rowsProcessed = processedRows.length;
    this.stats.endTime = Date.now();

    return processedRows;
  }

  /**
   * Auto-detect CSV format from file sample
   */
  private async detectFormat(filePath: string): Promise<void> {
    const sampleSize = Math.min(this.options.sampleSize, statSync(filePath).size);
    // Sample from beginning of file

    const stream = createReadStream(filePath, { start: 0, end: sampleSize - 1 });
    const chunks: Buffer[] = [];

    for await (const chunk of stream) {
      chunks.push(chunk as Buffer);
    }

    const sampleBuffer = Buffer.concat(chunks);
    const detected = CSVDetector.detect(sampleBuffer);

    // Update options with detected values
    this.options.encoding = detected.encoding;
    this.options.delimiter = detected.delimiter;
    this.options.quote = detected.quote;
    this.options.lineEnding = detected.lineEnding;
    this.options.hasHeader = detected.hasHeader;
  }

  /**
   * Create the main parsing transform stream
   */
  private createParseTransform(onRow?: (row: ParsedRow) => void): Transform {
    const stateMachine = new CSVStateMachine({
      delimiter: this.options.delimiter,
      quote: this.options.quote,
      escape: this.options.escape,
      trimFields: this.options.trimFields,
      maxFieldSize: this.options.maxFieldSize,
    });

    let buffer = '';
    let processedRows = 0;
    const parser = this; // Capture reference for use in transform functions

    return new Transform({
      objectMode: true,

      transform(chunk: Buffer | string, _encoding, callback) {
        if (parser.aborted) {
          callback();
          return;
        }

        try {
          // Convert chunk to string and add to buffer
          const chunkStr =
            chunk instanceof Buffer ? chunk.toString(parser.options.encoding) : chunk;
          buffer += chunkStr;
          parser.stats.bytesProcessed += chunk.length;

          // Process complete lines from buffer
          const { processedBuffer, rows } = parser.processBuffer(buffer, stateMachine);
          buffer = processedBuffer;

          // Handle processed rows
          for (const rawRow of rows) {
            if (processedRows >= parser.options.maxRows) {
              parser.aborted = true;
              break;
            }

            const processedRowData = parser.processRawRows([rawRow]);
            if (processedRowData.length > 0) {
              const row = processedRowData[0];
              processedRows++;

              if (onRow) {
                onRow(row);
              } else {
                this.push(row);
              }
            }
          }

          callback();
        } catch (error) {
          callback(error instanceof Error ? error : new Error('Unknown error'));
        }
      },

      flush(callback) {
        try {
          // Process any remaining data in buffer
          if (buffer.length > 0) {
            const rows = stateMachine.processChunk(buffer);
            const finalRow = stateMachine.finalize();

            if (finalRow) {
              rows.push(finalRow);
            }

            for (const rawRow of rows) {
              if (processedRows >= parser.options.maxRows) break;

              const processedRowData = parser.processRawRows([rawRow]);
              if (processedRowData.length > 0) {
                const row = processedRowData[0];
                processedRows++;

                if (onRow) {
                  onRow(row);
                } else {
                  this.push(row);
                }
              }
            }
          }

          // Update final stats
          const machineStats = stateMachine.getStats();
          parser.stats.errors.push(...machineStats.errors);
          parser.stats.rowsProcessed = processedRows;
          parser.stats.endTime = Date.now();

          callback();
        } catch (error) {
          callback(error instanceof Error ? error : new Error('Unknown error'));
        }
      },
    });
  }

  /**
   * Process buffer and extract complete rows
   */
  private processBuffer(
    buffer: string,
    stateMachine: CSVStateMachine,
  ): { processedBuffer: string; rows: string[][] } {
    // Find last complete line
    const lineEndingLength = this.options.lineEnding.length;
    const lastLineEndingIndex = buffer.lastIndexOf(this.options.lineEnding);

    if (lastLineEndingIndex === -1) {
      // No complete lines yet
      return { processedBuffer: buffer, rows: [] };
    }

    // Process complete lines
    const completeData = buffer.substring(0, lastLineEndingIndex + lineEndingLength);
    const remainingBuffer = buffer.substring(lastLineEndingIndex + lineEndingLength);

    const rows = stateMachine.processChunk(completeData);

    return { processedBuffer: remainingBuffer, rows };
  }

  /**
   * Process raw string arrays into ParsedRow objects
   */
  private processRawRows(rawRows: string[][]): ParsedRow[] {
    const processedRows: ParsedRow[] = [];

    for (let i = 0; i < rawRows.length; i++) {
      const rawRow = rawRows[i];

      // Skip empty rows if configured
      if (this.options.skipEmptyLines && this.isEmptyRow(rawRow)) {
        continue;
      }

      const row: ParsedRow = {
        index: this.stats.rowsProcessed + processedRows.length,
        data: rawRow,
      };

      processedRows.push(row);
    }

    return processedRows;
  }

  /**
   * Check if a row is empty
   */
  private isEmptyRow(row: string[]): boolean {
    return row.every((field) => field.trim().length === 0);
  }

  /**
   * Get current parsing statistics
   */
  getStats(): ParserStats {
    return { ...this.stats };
  }

  /**
   * Abort parsing operation
   */
  abort(): void {
    this.aborted = true;
  }

  /**
   * Get detected/configured options
   */
  getOptions(): CSVParserOptions {
    return { ...this.options };
  }
}
