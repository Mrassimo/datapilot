/**
 * CSV Parser type definitions
 */

export interface CSVParserOptions {
  delimiter?: string;
  quote?: string;
  escape?: string;
  encoding?: BufferEncoding;
  hasHeader?: boolean;
  lineEnding?: '\n' | '\r\n';
  skipEmptyLines?: boolean;
  maxRows?: number;
  chunkSize?: number; // Size of chunks to process at once
  detectTypes?: boolean;
  trimFields?: boolean;
  maxFieldSize?: number;
  autoDetect?: boolean; // Enable auto-detection of settings
  sampleSize?: number; // Number of bytes to sample for auto-detection
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