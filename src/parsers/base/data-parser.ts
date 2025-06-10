/**
 * Universal Data Parser Interface
 * Enables multi-format support while maintaining streaming capability
 */

export interface ParsedRow {
  index: number;
  data: string[];
  raw?: string;
  metadata?: Record<string, any>;
}

export interface ParseOptions {
  // Universal options
  maxRows?: number;
  encoding?: BufferEncoding;
  chunkSize?: number;
  format?: string; // Force specific format

  // CSV-specific
  delimiter?: string;
  quote?: string;
  hasHeader?: boolean;

  // JSON-specific
  jsonPath?: string;
  arrayMode?: 'records' | 'values';
  flattenObjects?: boolean;

  // Excel-specific
  sheetName?: string;
  sheetIndex?: number;

  // Parquet-specific
  columns?: string[]; // Select specific columns
  rowStart?: number; // Start row for pagination
  rowEnd?: number; // End row for pagination

  // Performance options
  streaming?: boolean;
  memoryLimit?: string;
}

export interface FormatDetectionResult {
  format: string;
  confidence: number; // 0-1
  metadata: Record<string, any>;
  encoding?: BufferEncoding;
  estimatedRows?: number;
  estimatedColumns?: number;
  suggestedOptions?: ParseOptions;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  canProceed: boolean;
  suggestedFixes?: string[];
}

export interface ParserStats {
  bytesProcessed: number;
  rowsProcessed: number;
  errors: { row: number; column?: number; message: string; code: string }[];
  startTime: number;
  endTime?: number;
  peakMemoryUsage?: number;
  format?: string;
}

/**
 * Universal data parser interface
 * All format-specific parsers must implement this interface
 */
export interface DataParser {
  /**
   * Parse file and return async iterator of rows
   * Maintains streaming capability for large files
   */
  parse(filePath: string, options?: ParseOptions): AsyncIterableIterator<ParsedRow>;

  /**
   * Detect if this parser can handle the file format
   */
  detect(filePath: string): Promise<FormatDetectionResult>;

  /**
   * Get parsing statistics
   */
  getStats(): ParserStats;

  /**
   * Abort parsing operation
   */
  abort(): void;

  /**
   * Validate file can be parsed
   */
  validate(filePath: string): Promise<ValidationResult>;

  /**
   * Get supported file extensions
   */
  getSupportedExtensions(): string[];

  /**
   * Get format name
   */
  getFormatName(): string;
}

/**
 * Format detector interface
 */
export interface FormatDetector {
  detect(filePath: string): Promise<FormatDetectionResult>;
  getSupportedExtensions(): string[];
  getFormatName(): string;
}

/**
 * Base parser class with common functionality
 */
export abstract class BaseParser implements DataParser {
  protected stats: ParserStats;
  protected aborted = false;
  protected options: ParseOptions;

  constructor(options: ParseOptions = {}) {
    this.options = options;
    this.stats = {
      bytesProcessed: 0,
      rowsProcessed: 0,
      errors: [],
      startTime: Date.now(),
      format: this.getFormatName(),
    };
  }

  abstract parse(filePath: string, options?: ParseOptions): AsyncIterableIterator<ParsedRow>;
  abstract detect(filePath: string): Promise<FormatDetectionResult>;
  abstract getSupportedExtensions(): string[];
  abstract getFormatName(): string;

  getStats(): ParserStats {
    return { ...this.stats, endTime: Date.now() };
  }

  abort(): void {
    this.aborted = true;
  }

  async validate(filePath: string): Promise<ValidationResult> {
    try {
      const detection = await this.detect(filePath);
      return {
        valid: detection.confidence > 0.8,
        errors: detection.confidence > 0.8 ? [] : [`Not a valid ${this.getFormatName()} file`],
        warnings:
          detection.confidence < 0.9 && detection.confidence > 0.8
            ? [`Low confidence detection for ${this.getFormatName()}`]
            : [],
        canProceed: detection.confidence > 0.5,
        suggestedFixes:
          detection.confidence < 0.8
            ? [`Try specifying format explicitly: --format ${this.getFormatName()}`]
            : [],
      };
    } catch (error) {
      return {
        valid: false,
        errors: [error.message],
        warnings: [],
        canProceed: false,
        suggestedFixes: ['Check file format and try again'],
      };
    }
  }

  protected addError(row: number, message: string, code: string, column?: number): void {
    this.stats.errors.push({ row, column, message, code });
  }

  protected updateStats(bytesProcessed: number, rowsProcessed: number): void {
    this.stats.bytesProcessed += bytesProcessed;
    this.stats.rowsProcessed += rowsProcessed;
  }
}
