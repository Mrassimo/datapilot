/**
 * TSV Parser Implementation
 * Tab-separated values parser built on CSV parser foundation
 */

import type {
  ParsedRow,
  ParseOptions,
  FormatDetectionResult,
  FormatDetector,
} from './base/data-parser';
import { CSVParserAdapter } from './adapters/csv-parser-adapter';
import { DataPilotError, ErrorSeverity, ErrorCategory } from '../core/types';
import { logger } from '../utils/logger';
import { promises as fs } from 'fs';
import * as path from 'path';

/**
 * TSV Format Detector
 */
export class TSVDetector implements FormatDetector {
  getSupportedExtensions(): string[] {
    return ['.tsv', '.tab'];
  }

  getFormatName(): string {
    return 'tsv';
  }

  async detect(filePath: string): Promise<FormatDetectionResult> {
    try {
      // Check extension first
      const ext = path.extname(filePath).toLowerCase();
      const extensionScore = this.getSupportedExtensions().includes(ext) ? 0.4 : 0;

      // Read sample of file to detect tab-separated structure
      const sample = await this.readSample(filePath, 2048);
      const analysis = await this.analyzeTSVStructure(sample);

      if (analysis.isTabSeparated) {
        const confidence = Math.min(0.95, extensionScore + analysis.confidence);

        return {
          format: 'tsv',
          confidence,
          metadata: {
            delimiter: '\t',
            quote: analysis.quote,
            hasHeader: analysis.hasHeader,
            tabCount: analysis.avgTabsPerLine,
            lineCount: analysis.lineCount,
            columnCount: analysis.estimatedColumns,
            estimatedColumns: analysis.estimatedColumns,
          },
          encoding: 'utf8' as BufferEncoding,
          estimatedRows: analysis.lineCount,
          estimatedColumns: analysis.estimatedColumns,
          suggestedOptions: {
            delimiter: '\t',
            quote: analysis.quote,
            hasHeader: analysis.hasHeader,
            encoding: 'utf8' as BufferEncoding,
          },
        };
      }

      return {
        format: 'tsv',
        confidence: extensionScore,
        metadata: { reason: 'No consistent tab separation detected' },
      };
    } catch (error) {
      logger.warn(`TSV detection failed: ${error.message}`);
      return {
        format: 'tsv',
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

  private async analyzeTSVStructure(sample: string): Promise<{
    isTabSeparated: boolean;
    confidence: number;
    quote: string;
    hasHeader: boolean;
    avgTabsPerLine: number;
    lineCount: number;
    estimatedColumns: number;
  }> {
    const lines = sample.split('\n').filter((line) => line.trim().length > 0);

    if (lines.length === 0) {
      return {
        isTabSeparated: false,
        confidence: 0,
        quote: '"',
        hasHeader: false,
        avgTabsPerLine: 0,
        lineCount: 0,
        estimatedColumns: 0,
      };
    }

    // Count tabs per line
    const tabCounts = lines.slice(0, 10).map((line) => (line.match(/\t/g) || []).length);
    const avgTabs = tabCounts.reduce((sum, count) => sum + count, 0) / tabCounts.length;
    const tabVariance =
      tabCounts.reduce((sum, count) => sum + Math.pow(count - avgTabs, 2), 0) / tabCounts.length;

    // Check for consistent tab usage - stricter threshold for consistency
    const isConsistent = tabVariance < 0.5; // Stricter variance threshold
    const hasEnoughTabs = avgTabs >= 1; // At least one tab per line on average

    // Detect quote character (less common in TSV but possible)
    const quote = this.detectQuoteCharacter(lines);

    // Detect header row
    const hasHeader = this.detectHeaderRow(lines);

    // Calculate confidence
    let confidence = 0.3; // Base confidence for TSV detection

    if (isConsistent) confidence += 0.3;
    if (hasEnoughTabs) confidence += 0.2;
    if (avgTabs >= 2) confidence += 0.1; // Multiple columns
    if (tabVariance === 0) confidence += 0.1; // Perfect consistency
    
    // More aggressive penalties for inconsistency
    if (tabVariance > 0.5) confidence -= 0.3; // Penalty for moderate inconsistency
    if (tabVariance > 1) confidence -= 0.4; // Higher penalty for high inconsistency

    return {
      isTabSeparated: isConsistent && hasEnoughTabs,
      confidence,
      quote,
      hasHeader,
      avgTabsPerLine: avgTabs,
      lineCount: lines.length,
      estimatedColumns: Math.round(avgTabs) + 1, // Columns = tabs + 1
    };
  }

  private detectQuoteCharacter(lines: string[]): string {
    const sampleLines = lines.slice(0, 5);

    // Count occurrences of different quote characters
    const doubleQuoteCount = sampleLines.join('').split('"').length - 1;
    const singleQuoteCount = sampleLines.join('').split("'").length - 1;

    // Return most common quote character (default to double quote)
    return doubleQuoteCount >= singleQuoteCount ? '"' : "'";
  }

  private detectHeaderRow(lines: string[]): boolean {
    if (lines.length === 0) return false;

    const firstLine = lines[0];
    const firstLineCells = firstLine.split('\t');

    // Heuristic: if first line has mostly non-numeric values, it's likely a header
    const nonNumericCells = firstLineCells.filter((cell) => {
      const trimmed = cell.trim().replace(/['"]/g, ''); // Remove quotes
      return trimmed !== '' && isNaN(Number(trimmed));
    });

    return nonNumericCells.length > firstLineCells.length / 2;
  }
}

/**
 * TSV Parser Implementation
 * Extends CSV parser with tab-specific defaults
 */
export class TSVParser extends CSVParserAdapter {
  constructor(options: ParseOptions = {}) {
    // Force tab delimiter and set TSV-specific defaults
    const tsvOptions: ParseOptions = {
      ...options,
      delimiter: '\t', // Always use tab for TSV
      quote: options.quote || '"',
      hasHeader: options.hasHeader ?? true,
      encoding: options.encoding || 'utf8',
    };

    super(tsvOptions);
  }

  /**
   * Override format detection to use TSV detector
   */
  async detect(filePath: string): Promise<FormatDetectionResult> {
    const detector = new TSVDetector();
    return detector.detect(filePath);
  }

  /**
   * Get supported file extensions
   */
  getSupportedExtensions(): string[] {
    return ['.tsv', '.tab'];
  }

  /**
   * Get format name
   */
  getFormatName(): string {
    return 'tsv';
  }
}

/**
 * Factory function to create TSV parser
 */
export function createTSVParser(options?: ParseOptions): TSVParser {
  return new TSVParser(options);
}
