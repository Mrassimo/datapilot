/**
 * Enhanced CSV Parser type definitions with modern TypeScript patterns
 */

// Enhanced CSV Parser Options with Discriminated Unions
export type CSVParserMode = 'strict' | 'lenient' | 'recovery';

export interface BaseCSVParserOptions {
  readonly delimiter?: string;
  readonly quote?: string;
  readonly escape?: string;
  readonly encoding?: BufferEncoding;
  readonly hasHeader?: boolean;
  readonly lineEnding?: '\n' | '\r\n';
  readonly skipEmptyLines?: boolean;
  readonly maxRows?: number;
  readonly chunkSize?: number;
  readonly detectTypes?: boolean;
  readonly trimFields?: boolean;
  readonly maxFieldSize?: number;
  readonly autoDetect?: boolean;
  readonly sampleSize?: number;
}

export type CSVParserOptions = BaseCSVParserOptions & (
  | { mode: 'strict'; strictValidation: true; abortOnError: true }
  | { mode: 'lenient'; strictValidation?: false; continueOnError?: true; maxErrors?: number }
  | { mode: 'recovery'; strictValidation: false; attemptRecovery: true; recoveryStrategies: readonly RecoveryStrategy[] }
);

export interface RecoveryStrategy {
  readonly type: 'skip-row' | 'substitute-value' | 'truncate-field' | 'interpolate';
  readonly condition: (error: ParseError) => boolean;
  readonly action: (row: string[], error: ParseError) => string[];
}

export interface DetectedCSVFormat {
  encoding: BufferEncoding;
  encodingConfidence: number;
  delimiter: string;
  delimiterConfidence: number;
  quote: string;
  quoteConfidence: number;
  lineEnding: '\n' | '\r\n';
  hasHeader: boolean;
  headerConfidence: number;
}

export interface ParsedRow {
  index: number;
  data: string[];
  raw?: string;
}

export interface ParseError {
  row: number;
  column?: number;
  message: string;
  code: string;
}

export interface ParserStats {
  bytesProcessed: number;
  rowsProcessed: number;
  errors: ParseError[];
  startTime: number;
  endTime?: number;
  peakMemoryUsage?: number;
}

// Parser states for state machine
export enum ParserState {
  FIELD_START = 'FIELD_START',
  IN_FIELD = 'IN_FIELD',
  IN_QUOTED_FIELD = 'IN_QUOTED_FIELD',
  QUOTE_IN_QUOTED_FIELD = 'QUOTE_IN_QUOTED_FIELD',
  FIELD_END = 'FIELD_END',
  ROW_END = 'ROW_END',
}

// Optimized buffer sizes based on research
export const OPTIMAL_CHUNK_SIZE = 64 * 1024; // 64KB chunks
export const MAX_SAMPLE_SIZE = 1024 * 1024; // 1MB for auto-detection
export const MIN_SAMPLE_SIZE = 8 * 1024; // 8KB minimum sample

// Common delimiters to detect
export const COMMON_DELIMITERS = [',', '\t', ';', '|', ':'];

// Common quote characters
export const COMMON_QUOTES = ['"', "'", '`'];

// Encoding detection patterns
export interface EncodingPattern {
  encoding: BufferEncoding | 'utf16be';
  bom?: Buffer;
  pattern?: RegExp;
}

export const ENCODING_PATTERNS: EncodingPattern[] = [
  { encoding: 'utf8', bom: Buffer.from([0xef, 0xbb, 0xbf]) },
  { encoding: 'utf16le', bom: Buffer.from([0xff, 0xfe]) },
  { encoding: 'utf16be', bom: Buffer.from([0xfe, 0xff]) },
];
