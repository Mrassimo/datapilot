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
import { DataPilotError, ErrorSeverity, ErrorCategory } from '../core/types';
import { getConfig } from '../core/config';
import { logger } from '../utils/logger';
import { ErrorUtils } from '../utils/error-handler';

export class CSVParser {
  private options: Required<CSVParserOptions>;
  private stats: ParserStats;
  private aborted = false;

  constructor(options: Partial<CSVParserOptions> = {}) {
    const configManager = getConfig();
    const perfConfig = configManager.getPerformanceConfig();

    this.options = {
      delimiter: ',',
      quote: '"',
      escape: '"',
      encoding: 'utf8',
      hasHeader: true,
      lineEnding: '\n',
      skipEmptyLines: true,
      maxRows: options.maxRows ?? perfConfig.maxRows,
      chunkSize: options.chunkSize ?? perfConfig.chunkSize,
      detectTypes: true,
      trimFields: true,
      maxFieldSize: options.maxFieldSize ?? perfConfig.maxFieldSize,
      autoDetect: true,
      sampleSize: options.sampleSize ?? perfConfig.sampleSize,
      ...options,
    } as Required<CSVParserOptions>;

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
      const configManager = getConfig();
      const streamingConfig = configManager.getStreamingConfig();
      const isLargeFile = fileSizeMB > streamingConfig.memoryThresholdMB;

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

          const configManager = getConfig();
          const perfConfig = configManager.getPerformanceConfig();

          if (memUsage.heapUsed > perfConfig.memoryThresholdBytes) {
            throw new DataPilotError(
              'Memory limit reached, file too large for in-memory parsing',
              'MEMORY_LIMIT',
            );
          }
        }
      });

      // Process file with error handling
      try {
        await pipeline(readStream, parseTransform);
      } catch (pipelineError) {
        if (pipelineError instanceof DataPilotError) {
          throw pipelineError;
        }

        throw DataPilotError.parsing(
          `Pipeline processing failed: ${pipelineError instanceof Error ? pipelineError.message : 'Unknown error'}`,
          'PIPELINE_ERROR',
          { filePath, rowIndex: rows.length },
          [
            {
              action: 'Check file format',
              description: 'Verify the CSV format is valid',
              severity: ErrorSeverity.HIGH,
            },
            {
              action: 'Try different options',
              description: 'Experiment with different delimiter or quote settings',
              severity: ErrorSeverity.MEDIUM,
              command: '--delimiter ";" --quote "\""',
            },
          ],
        );
      }

      this.stats.endTime = Date.now();

      // Validate results
      if (rows.length === 0) {
        throw ErrorUtils.handleInsufficientData(
          0,
          1,
          { filePath, operationName: 'parseFile' },
          [], // Empty array as fallback
        );
      }

      return rows;
    } catch (error) {
      if (error instanceof DataPilotError && error.code === 'MEMORY_LIMIT') {
        // Fallback to streaming for large datasets
        return this.parseFileStreaming(filePath);
      }

      throw new DataPilotError(
        `Failed to parse CSV file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'PARSE_FAILED',
        ErrorSeverity.HIGH,
        ErrorCategory.PARSING,
        { filePath },
      );
    }
  }

  /**
   * Parse large CSV files using streaming with memory-efficient batching
   */
  private async parseFileStreaming(filePath: string): Promise<ParsedRow[]> {
    const rows: ParsedRow[] = [];
    const configManager = getConfig();
    const perfConfig = configManager.getPerformanceConfig();
    const batchSize = perfConfig.batchSize;
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

    try {
      await pipeline(readStream, parseTransform);
    } catch (error) {
      if (error instanceof DataPilotError) {
        throw error;
      }

      throw DataPilotError.parsing(
        `Streaming pipeline failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'STREAMING_PIPELINE_ERROR',
        { filePath, rowIndex: rows.length },
        [
          {
            action: 'Reduce batch size',
            description: 'Try processing with smaller chunks',
            severity: ErrorSeverity.MEDIUM,
            command: '--chunkSize 1000',
          },
          {
            action: 'Check system resources',
            description: 'Ensure sufficient memory and disk space',
            severity: ErrorSeverity.HIGH,
          },
        ],
      );
    }

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
    // Strip BOM if present
    let cleanData = data;
    if (data.charCodeAt(0) === 0xfeff) {
      cleanData = data.slice(1);
      logger.debug('Stripped UTF-8 BOM from string data');
    }

    const stateMachine = new CSVStateMachine({
      delimiter: this.options.delimiter,
      quote: this.options.quote,
      escape: this.options.escape,
      trimFields: this.options.trimFields,
      maxFieldSize: this.options.maxFieldSize,
    });

    const rawRows = stateMachine.processChunk(cleanData);
    const finalRow = stateMachine.finalize();

    if (finalRow) {
      rawRows.push(finalRow);
    }

    const stats = stateMachine.getStats();
    this.stats.errors.push(...stats.errors);
    this.stats.bytesProcessed = cleanData.length;

    // Apply maxRows limit
    const limitedRawRows = rawRows.slice(0, this.options.maxRows);
    const processedRows = this.processRawRows(limitedRawRows);

    this.stats.rowsProcessed = processedRows.length;
    this.stats.endTime = Date.now();

    return processedRows;
  }

  /**
   * Auto-detect CSV format from file sample with error handling
   */
  private async detectFormat(filePath: string): Promise<void> {
    try {
      const fileStats = statSync(filePath);
      const sampleSize = Math.min(this.options.sampleSize, fileStats.size);

      if (sampleSize === 0) {
        logger.warn('Cannot detect format from empty file, using defaults');
        return;
      }

      // Sample from beginning of file
      const stream = createReadStream(filePath, { start: 0, end: sampleSize - 1 });
      const chunks: Buffer[] = [];

      try {
        for await (const chunk of stream) {
          chunks.push(chunk as Buffer);
        }
      } catch (streamError) {
        throw DataPilotError.parsing(
          `Failed to read sample for format detection: ${streamError instanceof Error ? streamError.message : 'Unknown error'}`,
          'SAMPLE_READ_ERROR',
          { filePath },
          [
            {
              action: 'Check file permissions',
              description: 'Ensure the file is readable',
              severity: ErrorSeverity.HIGH,
            },
            {
              action: 'Specify format manually',
              description: 'Skip auto-detection and specify format options',
              severity: ErrorSeverity.MEDIUM,
              command: '--delimiter "," --encoding utf8 --no-auto-detect',
            },
          ],
        );
      }

      if (chunks.length === 0) {
        logger.warn('No data read for format detection, using defaults');
        return;
      }

      const sampleBuffer = Buffer.concat(chunks);

      try {
        const detected = CSVDetector.detect(sampleBuffer);

        // Update options with detected values
        this.options = {
          ...this.options,
          encoding: detected.encoding,
          delimiter: detected.delimiter,
          quote: detected.quote,
          lineEnding: detected.lineEnding,
          hasHeader: detected.hasHeader,
        };

        logger.debug(
          `Auto-detected format: delimiter='${detected.delimiter}', encoding='${detected.encoding}', quote='${detected.quote}'`,
        );
      } catch (detectionError) {
        throw DataPilotError.parsing(
          `Format detection failed: ${detectionError instanceof Error ? detectionError.message : 'Unknown error'}`,
          'FORMAT_DETECTION_FAILED',
          { filePath },
          [
            {
              action: 'Use manual settings',
              description: 'Specify delimiter, encoding, and quote characters manually',
              severity: ErrorSeverity.MEDIUM,
              command: '--delimiter "," --encoding utf8 --quote "\\""',
            },
            {
              action: 'Check file format',
              description: 'Verify the file is a valid CSV with consistent formatting',
              severity: ErrorSeverity.HIGH,
            },
          ],
        );
      }
    } catch (error) {
      if (error instanceof DataPilotError) {
        throw error;
      }

      throw DataPilotError.parsing(
        `Detection process failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'DETECTION_PROCESS_ERROR',
        { filePath },
      );
    }
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
    let isFirstChunk = true;
    const parserInstance = this; // Capture reference for use in transform functions

    return new Transform({
      objectMode: true,

      transform(chunk: Buffer | string, _encoding, callback): void {
        if (parserInstance.aborted) {
          callback();
          return;
        }

        try {
          // Convert chunk to string
          let chunkStr =
            chunk instanceof Buffer ? chunk.toString(parserInstance.options.encoding) : chunk;

          // Strip BOM from first chunk
          if (isFirstChunk) {
            isFirstChunk = false;
            // Check for UTF-8 BOM (EF BB BF)
            if (typeof chunkStr === 'string' && chunkStr.length > 0 && chunkStr.charCodeAt(0) === 0xfeff) {
              chunkStr = chunkStr.slice(1);
              logger.debug('Stripped UTF-8 BOM from first chunk');
            }
          }

          buffer += chunkStr;
          parserInstance.stats.bytesProcessed +=
            chunk instanceof Buffer ? chunk.length : chunk.length;

          // Process complete lines from buffer
          const { processedBuffer, rows } = parserInstance.processBuffer(buffer, stateMachine);
          buffer = processedBuffer;

          // Handle processed rows
          for (const rawRow of rows) {
            if (processedRows >= parserInstance.options.maxRows) {
              parserInstance.aborted = true;
              break;
            }

            const processedRowData = parserInstance.processRawRows([rawRow]);
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

      flush(callback): void {
        try {
          // Process any remaining data in buffer
          if (buffer.length > 0) {
            const rows = stateMachine.processChunk(buffer);
            const finalRow = stateMachine.finalize();

            if (finalRow) {
              rows.push(finalRow);
            }

            for (const rawRow of rows) {
              if (processedRows >= parserInstance.options.maxRows) break;

              const processedRowData = parserInstance.processRawRows([rawRow]);
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
          parserInstance.stats.errors.push(...machineStats.errors);
          parserInstance.stats.rowsProcessed = processedRows;
          parserInstance.stats.endTime = Date.now();

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
   * Process raw string arrays into ParsedRow objects with error handling
   */
  private processRawRows(rawRows: string[][]): ParsedRow[] {
    const processedRows: ParsedRow[] = [];
    let skippedRows = 0;
    let errorRows = 0;

    for (let i = 0; i < rawRows.length; i++) {
      try {
        const rawRow = rawRows[i];

        // Validate row data
        if (!Array.isArray(rawRow)) {
          errorRows++;
          logger.debug(`Invalid row data at index ${i}: expected array, got ${typeof rawRow}`);
          continue;
        }

        // Skip empty rows if configured
        if (this.options.skipEmptyLines && this.isEmptyRow(rawRow)) {
          skippedRows++;
          continue;
        }

        // Check for excessively long fields
        const hasOversizedField = rawRow.some(
          (field) => typeof field === 'string' && field.length > this.options.maxFieldSize,
        );

        if (hasOversizedField) {
          logger.warn(`Row ${i} contains oversized field(s), truncating`);
          // Truncate oversized fields
          const truncatedRow = rawRow.map((field) =>
            typeof field === 'string' && field.length > this.options.maxFieldSize
              ? field.substring(0, this.options.maxFieldSize) + '...'
              : field,
          );

          const row: ParsedRow = {
            index: this.stats.rowsProcessed + processedRows.length,
            data: truncatedRow,
          };
          processedRows.push(row);
        } else {
          const row: ParsedRow = {
            index: this.stats.rowsProcessed + processedRows.length,
            data: rawRow,
          };
          processedRows.push(row);
        }
      } catch (error) {
        errorRows++;
        logger.debug(
          `Error processing row ${i}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );

        // If too many errors, warn the user
        if (errorRows > 10 && errorRows / (i + 1) > 0.1) {
          logger.warn(`High error rate in row processing: ${errorRows} errors in ${i + 1} rows`);
        }
      }
    }

    if (skippedRows > 0) {
      logger.debug(`Skipped ${skippedRows} empty rows`);
    }

    if (errorRows > 0) {
      logger.warn(`Encountered ${errorRows} invalid rows during processing`);
    }

    return processedRows;
  }

  /**
   * Check if a row is empty with error handling
   */
  private isEmptyRow(row: string[]): boolean {
    try {
      if (!Array.isArray(row)) {
        return true; // Treat invalid data as empty
      }

      return row.every((field) => {
        if (typeof field !== 'string') {
          return false; // Non-string fields are considered non-empty
        }
        return field.trim().length === 0;
      });
    } catch (error) {
      logger.debug(
        `Error checking if row is empty: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return true; // Treat errors as empty to skip problematic rows
    }
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
