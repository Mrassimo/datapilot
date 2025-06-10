/**
 * JSON Parser Implementation
 * Supports JSON arrays, objects, and JSONL (JSON Lines) format
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import type {
  ParsedRow,
  ParseOptions,
  FormatDetectionResult,
  FormatDetector,
} from './base/data-parser';
import { BaseParser } from './base/data-parser';
import { DataPilotError, ErrorSeverity, ErrorCategory } from '../core/types';
import { logger } from '../utils/logger';

interface JSONMetadata {
  type: 'array' | 'object' | 'jsonl';
  keys?: string[];
  estimatedRecords?: number;
  nestedLevels?: number;
  arrayElementTypes?: string[];
}

/**
 * JSON Format Detector
 */
export class JSONDetector implements FormatDetector {
  getSupportedExtensions(): string[] {
    return ['.json', '.jsonl', '.ndjson'];
  }

  getFormatName(): string {
    return 'json';
  }

  async detect(filePath: string): Promise<FormatDetectionResult> {
    try {
      // Check extension first
      const ext = path.extname(filePath).toLowerCase();
      const extensionScore = this.getSupportedExtensions().includes(ext) ? 0.3 : 0;

      // Read sample of file
      const sample = await this.readSample(filePath, 2048);

      // Try parsing as JSON
      const jsonResult = await this.tryParseJSON(sample);
      if (jsonResult.success) {
        return {
          format: 'json',
          confidence: Math.min(0.95, extensionScore + 0.7),
          metadata: jsonResult.metadata,
          estimatedRows: jsonResult.metadata.estimatedRecords,
          suggestedOptions: {
            arrayMode: jsonResult.metadata.type === 'array' ? 'records' : 'values',
            flattenObjects: jsonResult.metadata.nestedLevels > 1,
          },
        };
      }

      // Try parsing as JSONL
      const jsonlResult = await this.tryParseJSONL(sample);
      if (jsonlResult.success) {
        return {
          format: 'json',
          confidence: Math.min(0.9, extensionScore + 0.6),
          metadata: jsonlResult.metadata,
          estimatedRows: jsonlResult.metadata.estimatedRecords,
          suggestedOptions: {
            arrayMode: 'records',
            flattenObjects: true,
          },
        };
      }

      return {
        format: 'json',
        confidence: extensionScore,
        metadata: {},
      };
    } catch (error) {
      return {
        format: 'json',
        confidence: 0,
        metadata: { error: error.message },
      };
    }
  }

  private async readSample(filePath: string, maxBytes: number): Promise<string> {
    const buffer = Buffer.alloc(maxBytes);
    const file = await fs.open(filePath, 'r');

    try {
      const { bytesRead } = await file.read(buffer, 0, maxBytes, 0);
      return buffer.slice(0, bytesRead).toString('utf8');
    } finally {
      await file.close();
    }
  }

  private async tryParseJSON(sample: string): Promise<{
    success: boolean;
    metadata: JSONMetadata;
  }> {
    try {
      const parsed = JSON.parse(sample);

      if (Array.isArray(parsed)) {
        const elementTypes = parsed.slice(0, 10).map((item) => typeof item);
        return {
          success: true,
          metadata: {
            type: 'array',
            estimatedRecords: parsed.length,
            arrayElementTypes: [...new Set(elementTypes)],
            nestedLevels: this.calculateNestingLevel(parsed[0] || {}),
          },
        };
      } else if (typeof parsed === 'object' && parsed !== null) {
        return {
          success: true,
          metadata: {
            type: 'object',
            keys: Object.keys(parsed),
            estimatedRecords: 1,
            nestedLevels: this.calculateNestingLevel(parsed),
          },
        };
      }

      return { success: false, metadata: { type: 'object' } };
    } catch (error) {
      return { success: false, metadata: { type: 'object' } };
    }
  }

  private async tryParseJSONL(sample: string): Promise<{
    success: boolean;
    metadata: JSONMetadata;
  }> {
    const lines = sample.split('\n').filter((line) => line.trim());
    if (lines.length === 0) {
      return { success: false, metadata: { type: 'jsonl' } };
    }

    let validLines = 0;
    let sampleKeys: string[] = [];

    for (const line of lines.slice(0, 10)) {
      try {
        const parsed = JSON.parse(line.trim());
        if (typeof parsed === 'object' && parsed !== null) {
          validLines++;
          if (sampleKeys.length === 0) {
            sampleKeys = Object.keys(parsed);
          }
        }
      } catch {
        // Invalid JSON line
      }
    }

    const confidence = validLines / Math.min(lines.length, 10);

    if (confidence > 0.7) {
      return {
        success: true,
        metadata: {
          type: 'jsonl',
          keys: sampleKeys,
          estimatedRecords: lines.length,
          nestedLevels: 1,
        },
      };
    }

    return { success: false, metadata: { type: 'jsonl' } };
  }

  private calculateNestingLevel(obj: any, level = 0): number {
    if (typeof obj !== 'object' || obj === null) {
      return level;
    }

    let maxLevel = level;
    for (const value of Object.values(obj)) {
      if (typeof value === 'object' && value !== null) {
        maxLevel = Math.max(maxLevel, this.calculateNestingLevel(value, level + 1));
      }
    }

    return maxLevel;
  }
}

/**
 * JSON Parser Implementation
 */
export class JSONParser extends BaseParser {
  private headers: string[] = [];

  getSupportedExtensions(): string[] {
    return ['.json', '.jsonl', '.ndjson'];
  }

  getFormatName(): string {
    return 'json';
  }

  async detect(filePath: string): Promise<FormatDetectionResult> {
    const detector = new JSONDetector();
    return detector.detect(filePath);
  }

  async *parse(filePath: string, options?: ParseOptions): AsyncIterableIterator<ParsedRow> {
    const mergedOptions = { ...this.options, ...options };

    try {
      const content = await fs.readFile(filePath, 'utf8');
      this.updateStats(Buffer.byteLength(content, 'utf8'), 0);

      // Determine JSON type
      const isJSONL = await this.isJSONLFormat(content);

      if (isJSONL) {
        yield* this.parseJSONL(content, mergedOptions);
      } else {
        yield* this.parseJSON(content, mergedOptions);
      }
    } catch (error) {
      throw new DataPilotError(
        `JSON parsing failed: ${error.message}`,
        'JSON_PARSING_ERROR',
        ErrorSeverity.HIGH,
        ErrorCategory.PARSING,
      );
    }
  }

  private async isJSONLFormat(content: string): Promise<boolean> {
    const lines = content.split('\n').slice(0, 5);
    let validJSONLines = 0;

    for (const line of lines) {
      if (line.trim()) {
        try {
          JSON.parse(line.trim());
          validJSONLines++;
        } catch {
          // Not valid JSON line
        }
      }
    }

    return validJSONLines > 0 && validJSONLines === lines.filter((l) => l.trim()).length;
  }

  private async *parseJSON(
    content: string,
    options: ParseOptions,
  ): AsyncIterableIterator<ParsedRow> {
    try {
      const parsed = JSON.parse(content);

      if (Array.isArray(parsed)) {
        yield* this.parseJSONArray(parsed, options);
      } else if (typeof parsed === 'object' && parsed !== null) {
        yield* this.parseJSONObject(parsed, options);
      } else {
        throw new Error('JSON must be an object or array');
      }
    } catch (error) {
      this.addError(0, `Invalid JSON: ${error.message}`, 'INVALID_JSON');
      throw error;
    }
  }

  private async *parseJSONArray(
    array: any[],
    options: ParseOptions,
  ): AsyncIterableIterator<ParsedRow> {
    const maxRows = options.maxRows || array.length;
    const flattenObjects = options.flattenObjects ?? true;

    // Extract headers from first element
    if (array.length > 0) {
      const firstItem = array[0];
      if (typeof firstItem === 'object' && firstItem !== null) {
        this.headers = this.extractHeaders(firstItem, flattenObjects);
      }
    }

    for (let i = 0; i < Math.min(array.length, maxRows); i++) {
      if (this.aborted) break;

      const item = array[i];
      const rowData = this.convertToRowData(item, flattenObjects);

      yield {
        index: i,
        data: rowData,
        raw: JSON.stringify(item),
        metadata: { originalType: typeof item },
      };

      this.updateStats(0, 1);
    }
  }

  private async *parseJSONL(
    content: string,
    options: ParseOptions,
  ): AsyncIterableIterator<ParsedRow> {
    const lines = content.split('\n').filter((line) => line.trim());
    const maxRows = options.maxRows || lines.length;
    const flattenObjects = options.flattenObjects ?? true;

    // Extract headers from first line
    if (lines.length > 0) {
      try {
        const firstItem = JSON.parse(lines[0]);
        if (typeof firstItem === 'object' && firstItem !== null) {
          this.headers = this.extractHeaders(firstItem, flattenObjects);
        }
      } catch (error) {
        this.addError(0, `Invalid JSON in first line: ${error.message}`, 'INVALID_JSONL');
      }
    }

    for (let i = 0; i < Math.min(lines.length, maxRows); i++) {
      if (this.aborted) break;

      const line = lines[i].trim();
      if (!line) continue;

      try {
        const item = JSON.parse(line);
        const rowData = this.convertToRowData(item, flattenObjects);

        yield {
          index: i,
          data: rowData,
          raw: line,
          metadata: { originalType: typeof item },
        };

        this.updateStats(0, 1);
      } catch (error) {
        this.addError(i, `Invalid JSON line: ${error.message}`, 'INVALID_JSONL');
        // Continue with next line
      }
    }
  }

  private async *parseJSONObject(
    obj: any,
    options: ParseOptions,
  ): AsyncIterableIterator<ParsedRow> {
    const flattenObjects = options.flattenObjects ?? true;

    this.headers = this.extractHeaders(obj, flattenObjects);
    const rowData = this.convertToRowData(obj, flattenObjects);

    yield {
      index: 0,
      data: rowData,
      raw: JSON.stringify(obj),
      metadata: { originalType: 'object' },
    };

    this.updateStats(0, 1);
  }

  private extractHeaders(obj: any, flatten: boolean): string[] {
    if (!flatten || typeof obj !== 'object' || obj === null) {
      return Object.keys(obj || {});
    }

    const flattened = this.flattenObject(obj);
    return Object.keys(flattened);
  }

  private convertToRowData(item: any, flatten: boolean): string[] {
    if (typeof item !== 'object' || item === null) {
      return [String(item)];
    }

    const data = flatten ? this.flattenObject(item) : item;

    // Ensure consistent column order using headers
    if (this.headers.length > 0) {
      return this.headers.map((header) => {
        const value = data[header];
        return value !== undefined ? String(value) : '';
      });
    }

    return Object.values(data).map((v) => String(v));
  }

  private flattenObject(obj: any, prefix = '', separator = '.'): Record<string, any> {
    const flattened: Record<string, any> = {};

    for (const [key, value] of Object.entries(obj)) {
      const newKey = prefix ? `${prefix}${separator}${key}` : key;

      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        // Recursively flatten nested objects
        Object.assign(flattened, this.flattenObject(value, newKey, separator));
      } else if (Array.isArray(value)) {
        // Convert arrays to string representation
        flattened[newKey] = JSON.stringify(value);
      } else {
        flattened[newKey] = value;
      }
    }

    return flattened;
  }

  /**
   * Get detected headers for column mapping
   */
  getHeaders(): string[] {
    return [...this.headers];
  }
}

/**
 * Factory function to create JSON parser
 */
export function createJSONParser(options?: ParseOptions): JSONParser {
  return new JSONParser(options);
}
