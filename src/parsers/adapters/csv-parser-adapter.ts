/**
 * CSV Parser Adapter - Backwards compatibility wrapper
 * Wraps existing CSV parser to implement universal DataParser interface
 */

import type {
  DataParser,
  ParsedRow,
  ParseOptions,
  FormatDetectionResult,
  ValidationResult,
  ParserStats,
} from '../base/data-parser';
import { CSVParser } from '../csv-parser';
import { CSVDetector } from '../csv-detector';
import type { CSVParserOptions } from '../types';
import { DataPilotError, ErrorSeverity, ErrorCategory } from '../../core/types';
import { logger } from '../../utils/logger';

/**
 * Adapter to make existing CSV parser compatible with universal DataParser interface
 */
export class CSVParserAdapter implements DataParser {
  private csvParser: CSVParser;
  private csvDetector: CSVDetector;
  private startTime: number;

  constructor(options: ParseOptions = {}) {
    this.startTime = Date.now();

    // Convert universal options to CSV-specific options
    const csvOptions: Partial<CSVParserOptions> = {
      delimiter: options.delimiter || ',',
      quote: options.quote || '"',
      hasHeader: options.hasHeader ?? true,
      maxRows: options.maxRows,
      encoding: (options.encoding as BufferEncoding) || 'utf8',
      chunkSize: options.chunkSize || 8192,
    };

    this.csvParser = new CSVParser(csvOptions);
    this.csvDetector = new CSVDetector();
  }

  /**
   * Parse CSV file using existing parser
   */
  async *parse(filePath: string, options?: ParseOptions): AsyncIterableIterator<ParsedRow> {
    try {
      // Merge options if provided
      if (options) {
        const mergedOptions: Partial<CSVParserOptions> = {
          delimiter: options.delimiter || ',',
          quote: options.quote || '"',
          hasHeader: options.hasHeader ?? true,
          maxRows: options.maxRows,
          encoding: (options.encoding as BufferEncoding) || 'utf8',
          chunkSize: options.chunkSize || 8192,
        };

        // Create new parser with merged options
        const parser = new CSVParser(mergedOptions);
        const rows = await parser.parseFile(filePath);
        yield* this.adaptRowsToIterator(rows);
      } else {
        // Use existing parser
        const rows = await this.csvParser.parseFile(filePath);
        yield* this.adaptRowsToIterator(rows);
      }
    } catch (error) {
      throw new DataPilotError(
        `CSV parsing failed: ${error.message}`,
        'CSV_PARSING_ERROR',
        ErrorSeverity.HIGH,
        ErrorCategory.PARSING,
      );
    }
  }

  /**
   * Adapt CSV parser rows to universal format iterator
   */
  private async *adaptRowsToIterator(rows: any[]): AsyncIterableIterator<ParsedRow> {
    for (let index = 0; index < rows.length; index++) {
      const csvRow = rows[index];
      yield {
        index,
        data: Array.isArray(csvRow.data) ? csvRow.data : csvRow,
        raw: Array.isArray(csvRow.data) ? csvRow.data.join(',') : csvRow.join(','),
        metadata: {
          originalType: 'csv',
          ...csvRow.metadata,
        },
      };
    }
  }

  /**
   * Detect CSV format using existing detector
   */
  async detect(filePath: string): Promise<FormatDetectionResult> {
    try {
      // Read file sample for detection
      const fs = await import('fs');
      const fileBuffer = await fs.promises.readFile(filePath);
      const sampleBuffer = fileBuffer.slice(0, 8192); // 8KB sample
      const csvDetection = CSVDetector.detect(sampleBuffer);

      return {
        format: 'csv',
        confidence: csvDetection.delimiterConfidence || 0.9,
        metadata: {
          delimiter: csvDetection.delimiter,
          quote: csvDetection.quote,
          hasHeader: csvDetection.hasHeader,
          encoding: csvDetection.encoding,
          headerConfidence: csvDetection.headerConfidence,
        },
        encoding: csvDetection.encoding as BufferEncoding,
        estimatedRows: 0, // CSV detector doesn't provide row count from sample
        estimatedColumns: 0, // CSV detector doesn't provide column count from sample
        suggestedOptions: {
          delimiter: csvDetection.delimiter,
          quote: csvDetection.quote,
          hasHeader: csvDetection.hasHeader,
          encoding: csvDetection.encoding as BufferEncoding,
        },
      };
    } catch (error) {
      logger.warn(`CSV detection failed: ${error.message}`);
      return {
        format: 'csv',
        confidence: 0,
        metadata: { error: error.message },
      };
    }
  }

  /**
   * Get parsing statistics
   */
  getStats(): ParserStats {
    const csvStats = this.csvParser.getStats();

    return {
      bytesProcessed: csvStats.bytesProcessed || 0,
      rowsProcessed: csvStats.rowsProcessed || 0,
      errors:
        csvStats.errors?.map((err) => ({
          row: err.row || 0,
          column: err.column,
          message: err.message || '',
          code: err.code || 'CSV_ERROR',
        })) || [],
      startTime: this.startTime,
      endTime: Date.now(),
      peakMemoryUsage: csvStats.peakMemoryUsage,
      format: 'csv',
    };
  }

  /**
   * Abort parsing operation
   */
  abort(): void {
    if (this.csvParser && typeof this.csvParser.abort === 'function') {
      this.csvParser.abort();
    }
  }

  /**
   * Validate CSV file can be parsed
   */
  async validate(filePath: string): Promise<ValidationResult> {
    try {
      const detection = await this.detect(filePath);

      const confidence = detection.confidence;
      const isValid = confidence > 0.7;   // Reasonable threshold for valid files
      const canProceed = confidence > 0.5; // Standard threshold for processing

      const errors: string[] = [];
      const warnings: string[] = [];
      const suggestedFixes: string[] = [];

      if (!isValid) {
        errors.push('Not a valid CSV file or low confidence detection');
      }

      if (confidence < 0.9 && confidence > 0.8) {
        warnings.push('Low confidence CSV detection - file may have parsing issues');
      }

      if (confidence < 0.8) {
        suggestedFixes.push('Try specifying delimiter explicitly: --delimiter ","');
        suggestedFixes.push('Check if file uses different quote character: --quote "\'"');
        suggestedFixes.push('Verify file encoding is correct');
      }

      // Check for specific CSV issues
      if (detection.metadata.delimiter === 'unknown') {
        warnings.push('Could not reliably detect delimiter');
        suggestedFixes.push('Specify delimiter manually: --delimiter ";"');
      }

      return {
        valid: isValid,
        errors,
        warnings,
        canProceed,
        suggestedFixes,
      };
    } catch (error) {
      return {
        valid: false,
        errors: [error.message],
        warnings: [],
        canProceed: false,
        suggestedFixes: ['Check file exists and is readable', 'Verify file format is CSV'],
      };
    }
  }

  /**
   * Get supported file extensions
   */
  getSupportedExtensions(): string[] {
    return ['.csv'];
  }

  /**
   * Get format name
   */
  getFormatName(): string {
    return 'csv';
  }
}

/**
 * Factory function to create CSV parser adapter
 */
export function createCSVParserAdapter(options?: ParseOptions): CSVParserAdapter {
  return new CSVParserAdapter(options);
}
