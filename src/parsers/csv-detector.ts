/**
 * High-performance CSV format detection
 */

import type { DetectedCSVFormat } from './types';
import { COMMON_DELIMITERS, COMMON_QUOTES } from './types';
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
    const dataBuffer = encodingResult.hasBOM ? buffer.slice(encodingResult.bomLength) : buffer;

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

    // Enhanced scoring: prioritise consistency over field count for better semicolon detection
    analyses.sort((a, b) => {
      // Primary score: confidence (consistency) with field count bonus
      const consistencyScoreA = a.confidence;
      const consistencyScoreB = b.confidence;
      
      // Field count bonus (reduced impact to prevent bias against semicolons)
      const fieldCountBonusA = Math.min(Math.log(a.fieldCount + 1) * 0.1, 0.3);
      const fieldCountBonusB = Math.min(Math.log(b.fieldCount + 1) * 0.1, 0.3);
      
      const scoreA = consistencyScoreA + fieldCountBonusA;
      const scoreB = consistencyScoreB + fieldCountBonusB;
      
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

    for (const line of lines.slice(0, 20)) {
      // Analyze first 20 lines
      if (line.trim().length === 0) continue;

      const fieldCount = this.countFields(line, delimiter);
      fieldCounts.push(fieldCount);
    }

    if (fieldCounts.length === 0) {
      return { delimiter, confidence: 0, fieldCount: 0, variance: 0 };
    }

    const meanFields = fieldCounts.reduce((sum, count) => sum + count, 0) / fieldCounts.length;
    const variance =
      fieldCounts.reduce((sum, count) => sum + Math.pow(count - meanFields, 2), 0) /
      fieldCounts.length;

    // Calculate confidence based on consistency
    let confidence = 0;
    if (variance === 0 && meanFields > 1) {
      confidence = 0.95; // Perfect consistency - slightly lower than 1.0 for safety
    } else if (variance < 0.25 && meanFields > 1) {
      confidence = 0.85; // Very consistent
    } else if (variance < 1 && meanFields > 1) {
      confidence = 0.7; // Fairly consistent
    } else if (meanFields > 1) {
      confidence = 0.6; // Some structure detected - increased from 0.3
    }

    // Bonus for good field count (CSV files typically have 2+ fields)
    if (meanFields >= 3) {
      confidence = Math.min(confidence + 0.1, 0.98); // Boost for multi-field files
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

  private static detectQuoteCharacter(
    lines: string[],
    delimiter: string,
  ): { quote: string; confidence: number } {
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
    const totalFields = firstRow.length;

    for (let i = 0; i < firstRow.length; i++) {
      const firstField = this.cleanField(firstRow[i], quote);
      const secondField = this.cleanField(secondRow[i], quote);

      // Check if first row field looks like a header
      if (this.looksLikeHeader(firstField, secondField)) {
        headerIndicators++;
      }
    }

    const headerRatio = headerIndicators / totalFields;

    // Adaptive thresholds based on field count to handle high-column datasets
    let confidenceThreshold = 0.7;
    let moderateThreshold = 0.5;
    let lowThreshold = 0.3;

    // For datasets with many columns (>10), lower the thresholds
    // as it's harder to get all columns to look like headers
    if (totalFields > 10) {
      confidenceThreshold = Math.max(0.4, 0.7 - (totalFields - 10) * 0.02);
      moderateThreshold = Math.max(0.25, 0.5 - (totalFields - 10) * 0.015);
      lowThreshold = Math.max(0.15, 0.3 - (totalFields - 10) * 0.01);
    }

    if (headerRatio > confidenceThreshold) {
      return { hasHeader: true, confidence: 0.9 };
    } else if (headerRatio > moderateThreshold) {
      return { hasHeader: true, confidence: 0.7 };
    } else if (headerRatio > lowThreshold) {
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

    // If both fields are text and similar, likely not header-data relationship
    if (!this.isNumeric(headerField) && !this.isNumeric(dataField)) {
      // Exception: if header field is a common header word, allow it even if data looks similar
      const commonHeaderWords = [
        'name',
        'description',
        'value',
        'id',
        'type',
        'status',
        'date',
        'time',
        'count',
        'amount',
        'price',
        'total',
      ];
      const lowerHeaderField = headerField.toLowerCase();

      if (!commonHeaderWords.includes(lowerHeaderField)) {
        // Check if they look like similar types of data (e.g., both names)
        const bothLookLikeName = this.looksLikeName(headerField) && this.looksLikeName(dataField);
        if (bothLookLikeName) return false;
      }
    }

    // Headers often contain letters
    if (!/[a-zA-Z]/.test(headerField)) return false;

    // Headers are usually shorter and more descriptive
    if (headerField.length > 50) return false;

    // Check for common header words and patterns
    const commonHeaderWords = [
      'name',
      'description',
      'value',
      'id',
      'type',
      'status',
      'date',
      'time',
      'count',
      'amount',
      'price',
      'total',
    ];
    const lowerHeaderField = headerField.toLowerCase();

    // Check if it's a common header word
    if (commonHeaderWords.includes(lowerHeaderField)) {
      return true;
    }

    // Check for common header patterns
    const commonHeaderPatterns = [
      /^[a-z_]+$/, // snake_case like user_id, first_name
      /^[a-zA-Z]+[A-Z][a-zA-Z]*$/, // camelCase like firstName, userId
      /^[A-Z][A-Z_]*$/, // UPPER_CASE like USER_ID
      /^[a-zA-Z]+$/, // simple words like name, value
    ];

    return commonHeaderPatterns.some((pattern) => pattern.test(headerField));
  }

  private static looksLikeName(value: string): boolean {
    // Check if value looks like a person's name (starts with capital, contains only letters and spaces)
    return /^[A-Z][a-z]+(\s[A-Z][a-z]+)*$/.test(value.trim());
  }

  private static isNumeric(value: string): boolean {
    return /^-?\d*\.?\d+([eE][+-]?\d+)?$/.test(value.trim());
  }
}
