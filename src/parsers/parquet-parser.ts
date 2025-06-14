/**
 * Parquet Parser Implementation
 * Supports .parquet files using hyparquet library
 */

import { promises as fs } from 'fs';
import * as path from 'path';
// Note: Using dynamic imports due to TypeScript/ESM compatibility issues
// import {
//   asyncBufferFromFile,
//   parquetReadObjects,
//   parquetMetadataAsync,
//   parquetSchema
// } from 'hyparquet';
import type {
  ParsedRow,
  ParseOptions,
  FormatDetectionResult,
  FormatDetector,
} from './base/data-parser';
import { BaseParser } from './base/data-parser';
import { DataPilotError, ErrorSeverity, ErrorCategory } from '../core/types';
import { logger } from '../utils/logger';

interface ParquetMetadata {
  numRows: number;
  schema: any;
  columnNames: string[];
  fileSize: number;
  compressionType?: string;
  rowGroups: number;
}

/**
 * Parquet Format Detector
 */
export class ParquetDetector implements FormatDetector {
  getSupportedExtensions(): string[] {
    return ['.parquet'];
  }

  getFormatName(): string {
    return 'parquet';
  }

  async detect(filePath: string): Promise<FormatDetectionResult> {
    try {
      // Check extension first
      const ext = path.extname(filePath).toLowerCase();
      const extensionScore = this.getSupportedExtensions().includes(ext) ? 0.4 : 0;

      if (extensionScore === 0) {
        return {
          format: 'parquet',
          confidence: 0,
          metadata: { reason: 'Unsupported extension' },
        };
      }

      // Try to read Parquet metadata without parsing full file
      const metadata = await this.readParquetMetadata(filePath);

      if (metadata.numRows >= 0) {
        const confidence = Math.min(0.98, extensionScore + 0.58); // High confidence for valid Parquet files

        return {
          format: 'parquet',
          confidence,
          metadata,
          estimatedRows: metadata.numRows,
          estimatedColumns: metadata.columnNames.length,
          encoding: 'utf8' as BufferEncoding,
          suggestedOptions: {
            hasHeader: true, // Parquet always has schema-defined column names
          },
        };
      }

      return {
        format: 'parquet',
        confidence: extensionScore,
        metadata: { reason: 'No valid Parquet data found' },
      };
    } catch (error) {
      logger.warn(`Parquet detection failed: ${error.message}`);
      return {
        format: 'parquet',
        confidence: 0,
        metadata: { error: error.message },
      };
    }
  }

  private async readParquetMetadata(filePath: string): Promise<ParquetMetadata> {
    try {
      // Check if file exists and get size
      const fileStats = await fs.stat(filePath);

      // Dynamic import hyparquet (with type assertion due to incomplete type definitions)
      const hyparquet = (await import('hyparquet')) as any;
      const { asyncBufferFromFile, parquetMetadataAsync, parquetSchema } = hyparquet;

      // Create async buffer for hyparquet
      const file = await asyncBufferFromFile(filePath);

      // Read metadata using hyparquet
      const metadata = await parquetMetadataAsync(file);
      const schema = parquetSchema(metadata);

      return {
        numRows: Number(metadata.num_rows),
        schema,
        columnNames: schema.children.map((child: any) => child.element.name),
        fileSize: fileStats.size,
        rowGroups: metadata.row_groups.length,
        compressionType: metadata.row_groups[0]?.columns[0]?.meta_data?.codec,
      };
    } catch (error) {
      throw new DataPilotError(
        `Failed to read Parquet metadata: ${error.message}`,
        'PARQUET_METADATA_ERROR',
        ErrorSeverity.MEDIUM,
        ErrorCategory.PARSING,
      );
    }
  }
}

/**
 * Parquet Parser Implementation
 */
export class ParquetParser extends BaseParser {
  private headers: string[] = [];
  private metadata: ParquetMetadata | null = null;

  getSupportedExtensions(): string[] {
    return ['.parquet'];
  }

  getFormatName(): string {
    return 'parquet';
  }

  async detect(filePath: string): Promise<FormatDetectionResult> {
    const detector = new ParquetDetector();
    return detector.detect(filePath);
  }

  async *parse(filePath: string, options?: ParseOptions): AsyncIterableIterator<ParsedRow> {
    const mergedOptions = { ...this.options, ...options };

    try {
      // Get file size for stats
      const fileStats = await fs.stat(filePath);
      this.updateStats(fileStats.size, 0);

      // Dynamic import hyparquet (with type assertion due to incomplete type definitions)
      const hyparquet = (await import('hyparquet')) as any;
      const { asyncBufferFromFile, parquetMetadataAsync, parquetSchema, parquetReadObjects } =
        hyparquet;

      // Create async buffer for hyparquet
      const file = await asyncBufferFromFile(filePath);

      // Read metadata first
      this.metadata = await this.readFileMetadata(file);
      this.headers = this.metadata.columnNames;

      logger.info(
        `Parsing Parquet file: ${this.metadata.numRows} rows, ${this.headers.length} columns`,
      );

      // Apply row limit if specified
      const maxRows = mergedOptions.maxRows || this.metadata.numRows;
      const rowLimit = Math.min(maxRows, this.metadata.numRows);

      // Read data using hyparquet with row filtering
      const parquetOptions: any = {};
      if (rowLimit < this.metadata.numRows) {
        parquetOptions.rowStart = 0;
        parquetOptions.rowEnd = rowLimit;
      }

      // Add column filtering if specified (not implemented in current options but could be added)
      const data = await parquetReadObjects({
        file,
        ...parquetOptions,
      });

      // Convert to ParsedRow format
      let rowIndex = 0;
      for (const row of data) {
        if (this.aborted || rowIndex >= rowLimit) break;

        // Convert object to array matching headers order
        const rowData = this.headers.map((header) => {
          const value = row[header];
          return this.formatValue(value);
        });

        yield {
          index: rowIndex++,
          data: rowData,
          raw: JSON.stringify(row, (key, value) => 
            typeof value === 'bigint' ? value.toString() : value
          ),
          metadata: {
            originalType: 'parquet',
            rowGroups: this.metadata?.rowGroups,
            compressionType: this.metadata?.compressionType,
            columnCount: rowData.length,
          },
        };

        this.updateStats(0, 1);
      }
    } catch (error) {
      throw new DataPilotError(
        `Parquet parsing failed: ${error.message}`,
        'PARQUET_PARSING_ERROR',
        ErrorSeverity.HIGH,
        ErrorCategory.PARSING,
      );
    }
  }

  private async readFileMetadata(file: any): Promise<ParquetMetadata> {
    try {
      const hyparquet = (await import('hyparquet')) as any;
      const { parquetMetadataAsync, parquetSchema } = hyparquet;
      const metadata = await parquetMetadataAsync(file);
      const schema = parquetSchema(metadata);

      return {
        numRows: Number(metadata.num_rows),
        schema,
        columnNames: schema.children.map((child: any) => child.element.name),
        fileSize: 0, // Will be set by calling code
        rowGroups: metadata.row_groups.length,
        compressionType: metadata.row_groups[0]?.columns[0]?.meta_data?.codec,
      };
    } catch (error) {
      throw new DataPilotError(
        `Failed to read Parquet file metadata: ${error.message}`,
        'PARQUET_FILE_METADATA_ERROR',
        ErrorSeverity.HIGH,
        ErrorCategory.PARSING,
      );
    }
  }

  private formatValue(value: any): string {
    if (value === null || value === undefined) {
      return '';
    }

    // Handle different data types from Parquet
    if (typeof value === 'object') {
      // Handle dates
      if (value instanceof Date) {
        return value.toISOString().split('T')[0]; // Return date as YYYY-MM-DD
      }

      // Handle complex objects (arrays, nested objects)
      if (Array.isArray(value)) {
        return value.map((item) => this.formatValue(item)).join(';');
      }

      // Handle nested objects
      return JSON.stringify(value);
    }

    // Handle BigInt values (common in Parquet)
    if (typeof value === 'bigint') {
      return value.toString();
    }

    // Handle boolean values
    if (typeof value === 'boolean') {
      return value.toString();
    }

    // Handle numbers with proper precision
    if (typeof value === 'number') {
      // Preserve precision for decimals, avoid scientific notation for large integers
      return Number.isInteger(value)
        ? value.toString()
        : value.toPrecision(10).replace(/\.?0+$/, '');
    }

    // Handle string values
    return String(value);
  }

  /**
   * Get detected headers for column mapping
   */
  getHeaders(): string[] {
    return [...this.headers];
  }

  /**
   * Get Parquet file metadata
   */
  getMetadata(): ParquetMetadata | null {
    return this.metadata;
  }

  /**
   * Get schema information from Parquet file
   */
  async getSchema(filePath: string): Promise<any> {
    try {
      const hyparquet = (await import('hyparquet')) as any;
      const { asyncBufferFromFile, parquetMetadataAsync, parquetSchema } = hyparquet;
      const file = await asyncBufferFromFile(filePath);
      const metadata = await parquetMetadataAsync(file);
      return parquetSchema(metadata);
    } catch (error) {
      throw new DataPilotError(
        `Failed to read Parquet schema: ${error.message}`,
        'PARQUET_SCHEMA_ERROR',
        ErrorSeverity.HIGH,
        ErrorCategory.PARSING,
      );
    }
  }

  /**
   * Get row group information for optimization
   */
  async getRowGroups(filePath: string): Promise<
    Array<{
      index: number;
      numRows: number;
      totalByteSize: number;
      columns: Array<{
        name: string;
        type: string;
        compression: string;
      }>;
    }>
  > {
    try {
      const hyparquet = (await import('hyparquet')) as any;
      const { asyncBufferFromFile, parquetMetadataAsync } = hyparquet;
      const file = await asyncBufferFromFile(filePath);
      const metadata = await parquetMetadataAsync(file);

      return metadata.row_groups.map((rg: any, index: number) => ({
        index,
        numRows: Number(rg.num_rows),
        totalByteSize: Number(rg.total_byte_size),
        columns: rg.columns.map((col: any) => ({
          name: col.meta_data.path_in_schema,
          type: col.meta_data.type,
          compression: col.meta_data.codec,
        })),
      }));
    } catch (error) {
      throw new DataPilotError(
        `Failed to read Parquet row groups: ${error.message}`,
        'PARQUET_ROW_GROUPS_ERROR',
        ErrorSeverity.HIGH,
        ErrorCategory.PARSING,
      );
    }
  }
}

/**
 * Factory function to create Parquet parser
 */
export function createParquetParser(options?: ParseOptions): ParquetParser {
  return new ParquetParser(options);
}
