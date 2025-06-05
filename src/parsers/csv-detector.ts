/**
 * High-performance CSV format detection
 */

import { COMMON_DELIMITERS, COMMON_QUOTES, DetectedCSVFormat } from './types';
import { EncodingDetector } from './encoding-detector';

export interface DelimiterAnalysis {
  delimiter: string;
  confidence: number;
  fieldCount: number;
  variance: number;
}

export class CSVDetector {
  /**
   * Detect CSV format from a buffer sample using statistical analysis
   */
  static detect(buffer: Buffer): DetectedCSVFormat {
    // First detect encoding
    const encodingResult = EncodingDetector.detect(buffer);
    
    // Skip BOM if present
    const dataBuffer = encodingResult.hasBOM
      ? buffer.slice(encodingResult.bomLength)
      : buffer;

    // Convert to string using detected encoding
    const sample = dataBuffer.toString(encodingResult.encoding);
    
    // Detect line endings
    const lineEnding = this.detectLineEnding(sample);
    
    // Split into lines for analysis
    const lines = sample.split(lineEnding).slice(0, 100); // Analyze up to 100 lines
    
    // Detect delimiter
    const delimiterResult = this.detectDelimiter(lines);
    
    // Detect quote character
    const quoteResult = this.detectQuoteCharacter(lines, delimiterResult.delimiter);
    
    // Detect if first row is header
    const headerResult = this.detectHeader(lines, delimiterResult.delimiter, quoteResult.quote);

    return {
      encoding: encodingResult.encoding,
      encodingConfidence: encodingResult.confidence,
      delimiter: delimiterResult.delimiter,
      delimiterConfidence: delimiterResult.confidence,
      quote: quoteResult.quote,
      quoteConfidence: quoteResult.confidence,
      lineEnding,
      hasHeader: headerResult.hasHeader,
      headerConfidence: headerResult.confidence,
    };
  }

  private static detectLineEnding(sample: string): '\n' | '\r\n' {
    const crlfCount = (sample.match(/\r\n/g) || []).length;
    const lfCount = (sample.match(/(?<!\r)\n/g) || []).length;
    
    return crlfCount > lfCount ? '\r\n' : '\n';
  }

  private static detectDelimiter(lines: string[]): { delimiter: string; confidence: number } {
    if (lines.length < 2) {
      return { delimiter: ',', confidence: 0.5 };
    }

    const analyses: DelimiterAnalysis[] = [];

    for (const delimiter of COMMON_DELIMITERS) {
      const analysis = this.analyzeDelimiter(lines, delimiter);
      analyses.push(analysis);
    }

    // Sort by confidence (considering both consistency and field count)
    analyses.sort((a, b) => {
      const scoreA = a.confidence * Math.log(a.fieldCount + 1);
      const scoreB = b.confidence * Math.log(b.fieldCount + 1);
      return scoreB - scoreA;
    });

    const best = analyses[0];
    return {
      delimiter: best.delimiter,
      confidence: best.confidence,
    };
  }

  private static analyzeDelimiter(lines: string[], delimiter: string): DelimiterAnalysis {
    if (lines.length < 2) {
      return { delimiter, confidence: 0, fieldCount: 0, variance: 0 };
    }

    const fieldCounts: number[] = [];
    
    for (const line of lines.slice(0, 20)) { // Analyze first 20 lines
      if (line.trim().length === 0) continue;
      
      const fieldCount = this.countFields(line, delimiter);
      fieldCounts.push(fieldCount);
    }

    if (fieldCounts.length === 0) {
      return { delimiter, confidence: 0, fieldCount: 0, variance: 0 };
    }

    const meanFields = fieldCounts.reduce((sum, count) => sum + count, 0) / fieldCounts.length;
    const variance = fieldCounts.reduce((sum, count) => sum + Math.pow(count - meanFields, 2), 0) / fieldCounts.length;
    
    // Calculate confidence based on consistency
    let confidence = 0;
    if (variance === 0 && meanFields > 1) {
      confidence = 1.0; // Perfect consistency
    } else if (variance < 0.25 && meanFields > 1) {
      confidence = 0.9; // Very consistent
    } else if (variance < 1 && meanFields > 1) {
      confidence = 0.7; // Fairly consistent
    } else if (meanFields > 1) {
      confidence = 0.3; // Some structure detected
    }

    // Penalty for very low field counts
    if (meanFields < 2) {
      confidence *= 0.5;
    }

    return {
      delimiter,
      confidence,
      fieldCount: meanFields,
      variance,
    };
  }

  private static countFields(line: string, delimiter: string): number {
    // Simple field counting - doesn't handle quotes yet
    return line.split(delimiter).length;
  }

  private static detectQuoteCharacter(lines: string[], delimiter: string): { quote: string; confidence: number } {
    let bestQuote = '"';
    let bestConfidence = 0;

    for (const quote of COMMON_QUOTES) {
      const confidence = this.analyzeQuoteCharacter(lines, delimiter, quote);
      if (confidence > bestConfidence) {
        bestConfidence = confidence;
        bestQuote = quote;
      }
    }

    return {
      quote: bestQuote,
      confidence: bestConfidence,
    };
  }

  private static analyzeQuoteCharacter(lines: string[], delimiter: string, quote: string): number {
    let quotedFields = 0;
    let totalFields = 0;
    let properlyQuoted = 0;

    for (const line of lines.slice(0, 10)) {
      if (line.trim().length === 0) continue;

      const fields = line.split(delimiter);
      totalFields += fields.length;

      for (const field of fields) {
        const trimmed = field.trim();
        if (trimmed.startsWith(quote) && trimmed.endsWith(quote)) {
          quotedFields++;
          if (trimmed.length >= 2) {
            properlyQuoted++;
          }
        }
      }
    }

    if (totalFields === 0) return 0;

    const quotedRatio = quotedFields / totalFields;
    const properQuoteRatio = properlyQuoted / Math.max(quotedFields, 1);

    // Confidence based on proper usage of quotes
    if (quotedRatio > 0.3 && properQuoteRatio > 0.8) {
      return 0.9;
    } else if (quotedRatio > 0.1 && properQuoteRatio > 0.7) {
      return 0.7;
    } else if (quotedFields > 0) {
      return 0.5;
    }

    return 0.1; // Default low confidence for no quotes
  }

  private static detectHeader(
    lines: string[],
    delimiter: string,
    quote: string,
  ): { hasHeader: boolean; confidence: number } {
    if (lines.length < 2) {
      return { hasHeader: false, confidence: 0.5 };
    }

    const firstRow = lines[0].split(delimiter);
    const secondRow = lines[1].split(delimiter);

    if (firstRow.length !== secondRow.length) {
      return { hasHeader: false, confidence: 0.8 };
    }

    let headerIndicators = 0;
    let totalFields = firstRow.length;

    for (let i = 0; i < firstRow.length; i++) {
      const firstField = this.cleanField(firstRow[i], quote);
      const secondField = this.cleanField(secondRow[i], quote);

      // Check if first row field looks like a header
      if (this.looksLikeHeader(firstField, secondField)) {
        headerIndicators++;
      }
    }

    const headerRatio = headerIndicators / totalFields;

    if (headerRatio > 0.7) {
      return { hasHeader: true, confidence: 0.9 };
    } else if (headerRatio > 0.5) {
      return { hasHeader: true, confidence: 0.7 };
    } else if (headerRatio > 0.3) {
      return { hasHeader: true, confidence: 0.5 };
    }

    return { hasHeader: false, confidence: 0.7 };
  }

  private static cleanField(field: string, quote: string): string {
    const trimmed = field.trim();
    if (trimmed.startsWith(quote) && trimmed.endsWith(quote) && trimmed.length >= 2) {
      return trimmed.slice(1, -1);
    }
    return trimmed;
  }

  private static looksLikeHeader(headerField: string, dataField: string): boolean {
    // Empty fields are not good headers
    if (headerField.trim().length === 0) return false;

    // Headers shouldn't be pure numbers
    if (this.isNumeric(headerField) && this.isNumeric(dataField)) {
      return false;
    }

    // Headers often contain letters
    if (!/[a-zA-Z]/.test(headerField)) return false;

    // Headers are usually shorter and more descriptive
    if (headerField.length > 50) return false;

    // Check for common header patterns
    const commonHeaderPatterns = [
      /^[a-zA-Z_][a-zA-Z0-9_\s]*$/,  // identifier-like
      /^[A-Z][a-z\s]*$/,             // title case
      /^[a-z_]+$/,                   // snake_case
      /^[a-zA-Z]+[A-Z][a-zA-Z]*$/,   // camelCase
    ];

    return commonHeaderPatterns.some(pattern => pattern.test(headerField));
  }

  private static isNumeric(value: string): boolean {
    return /^-?\d*\.?\d+([eE][+-]?\d+)?$/.test(value.trim());
  }
}