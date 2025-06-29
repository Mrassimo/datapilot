/**
 * Parsing Metadata Tracker - Enhanced CSV parsing with detailed analytics
 * Wraps our CSV parser with confidence scoring and method documentation
 */

import type { ParsedRow } from '../../parsers/types';
import { CSVParser } from '../../parsers/csv-parser';
import { CSVDetector } from '../../parsers/csv-detector';
import { EncodingDetector } from '../../parsers/encoding-detector';
import { readFileSync } from 'fs';
import type {
  ParsingMetadata,
  EncodingDetection,
  DelimiterDetection,
  Section1Config,
  Section1Warning,
} from './types';
import { getDataPilotVersion } from '../../utils/version';

export class ParsingMetadataTracker {
  private warnings: Section1Warning[] = [];
  private parser: CSVParser;

  constructor(_config: Section1Config) {
    this.parser = new CSVParser({ autoDetect: true });
  }

  /**
   * Perform enhanced CSV parsing with detailed metadata collection
   */
  async parseWithMetadata(filePath: string): Promise<{
    rows: ParsedRow[];
    metadata: ParsingMetadata;
  }> {
    const startTime = Date.now();

    try {
      // Sample file for detection analysis
      const { sample, sampleStats } = await this.createFileSample(filePath);

      // Enhanced detection with confidence scoring
      const encodingDetection = this.analyzeEncoding(sample);
      const delimiterDetection = this.analyzeDelimiter(sample);

      // Parse the file
      const rows = await this.parser.parseFile(filePath);
      const parseEndTime = Date.now();

      // Get parser options
      const parserOptions = this.parser.getOptions();

      // Analyze header detection
      const headerAnalysis = this.analyzeHeaderDetection(rows);

      // Count empty lines
      const emptyLinesCount = this.countEmptyLines(sample);

      const metadata: ParsingMetadata = {
        dataSourceType: 'Local File System',
        parsingEngine: `DataPilot Advanced CSV Parser v${this.getParserVersion()}`,
        parsingTimeSeconds: Number(((parseEndTime - startTime) / 1000).toFixed(3)),
        encoding: encodingDetection,
        delimiter: delimiterDetection,
        lineEnding: this.detectLineEndings(sample),
        quotingCharacter: parserOptions.quote || 'None Detected',
        emptyLinesEncountered: emptyLinesCount,
        headerProcessing: headerAnalysis,
        initialScanLimit: sampleStats,
      };

      // Add performance warnings
      this.addPerformanceWarnings(parseEndTime - startTime, rows.length);

      return { rows, metadata };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown parsing error';
      throw new Error(`Enhanced parsing failed: ${message}`);
    }
  }

  /**
   * Create optimized file sample for analysis
   */
  private async createFileSample(filePath: string): Promise<{
    sample: Buffer;
    sampleStats: {
      method: string;
      linesScanned: number;
      bytesScanned: number;
    };
  }> {
    const maxSampleSize = 1024 * 1024; // 1MB
    const maxLines = 1000;

    try {
      // Read sample from beginning of file
      const buffer = readFileSync(filePath);
      const sampleSize = Math.min(buffer.length, maxSampleSize);
      const sample = buffer.slice(0, sampleSize);

      // Count lines in sample
      const lineCount = (sample.toString('utf8').match(/\n/g) || []).length;
      const actualLines = Math.min(lineCount, maxLines);

      return {
        sample,
        sampleStats: {
          method: `First ${sampleSize} bytes or ${maxLines} lines`,
          linesScanned: actualLines,
          bytesScanned: sampleSize,
        },
      };
    } catch (error) {
      throw new Error(
        `Failed to create file sample: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Enhanced encoding detection with confidence analysis
   */
  private analyzeEncoding(sample: Buffer): EncodingDetection {
    const result = EncodingDetector.detect(sample);

    return {
      encoding: result.encoding,
      detectionMethod: result.hasBOM
        ? 'Byte Order Mark (BOM) Detection'
        : 'Statistical Character Pattern Analysis',
      confidence: Math.round(result.confidence * 100),
      bomDetected: result.hasBOM,
      bomType: result.hasBOM ? this.identifyBomType(sample) : undefined,
    };
  }

  /**
   * Enhanced delimiter detection with alternatives
   */
  private analyzeDelimiter(sample: Buffer): DelimiterDetection {
    const detected = CSVDetector.detect(sample);
    const alternatives = this.getDelimiterAlternatives(sample.toString('utf8'));

    return {
      delimiter: detected.delimiter,
      detectionMethod: 'Character Frequency Analysis with Field Consistency Scoring',
      confidence: Math.round(detected.delimiterConfidence * 100),
      alternativesConsidered: alternatives,
    };
  }

  /**
   * Analyze delimiter alternatives with scoring
   */
  private getDelimiterAlternatives(text: string): Array<{ delimiter: string; score: number }> {
    const delimiters = [',', '\t', ';', '|', ':'];
    const lines = text.split('\n').slice(0, 20);

    return delimiters
      .map((delimiter) => {
        const fieldCounts = lines.map((line) => line.split(delimiter).length);
        const consistency = this.calculateConsistencyScore(fieldCounts);
        const frequency = (
          text.match(new RegExp(delimiter.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []
        ).length;

        return {
          delimiter: delimiter === '\t' ? 'TAB' : delimiter,
          score: Math.round((consistency * 0.7 + Math.min(frequency / 100, 1) * 0.3) * 100),
        };
      })
      .sort((a, b) => b.score - a.score);
  }

  /**
   * Calculate consistency score for field counts
   */
  private calculateConsistencyScore(counts: number[]): number {
    if (counts.length === 0) return 0;

    const mean = counts.reduce((sum, c) => sum + c, 0) / counts.length;
    const variance = counts.reduce((sum, c) => sum + Math.pow(c - mean, 2), 0) / counts.length;

    // Lower variance = higher consistency
    return Math.max(0, 1 - variance / mean);
  }

  /**
   * Detect line ending format
   */
  private detectLineEndings(sample: Buffer): 'LF' | 'CRLF' {
    const text = sample.toString('utf8', 0, Math.min(sample.length, 10000));
    const crlfCount = (text.match(/\r\n/g) || []).length;
    const lfCount = (text.match(/(?<!\r)\n/g) || []).length;

    return crlfCount > lfCount ? 'CRLF' : 'LF';
  }

  /**
   * Analyze header detection with confidence
   */
  private analyzeHeaderDetection(rows: ParsedRow[]): {
    headerPresence: 'Detected' | 'Not Detected' | 'Uncertain';
    headerRowNumbers: number[];
    columnNamesSource: string;
  } {
    if (rows.length === 0) {
      return {
        headerPresence: 'Not Detected',
        headerRowNumbers: [],
        columnNamesSource: 'None - empty dataset',
      };
    }

    const parserOptions = this.parser.getOptions();

    if (parserOptions.hasHeader) {
      return {
        headerPresence: 'Detected',
        headerRowNumbers: [1],
        columnNamesSource: 'First row interpreted as column headers',
      };
    } else {
      return {
        headerPresence: 'Not Detected',
        headerRowNumbers: [],
        columnNamesSource: 'Generated column indices (Col_0, Col_1, etc.)',
      };
    }
  }

  /**
   * Count empty lines in sample
   */
  private countEmptyLines(sample: Buffer): number {
    const text = sample.toString('utf8');
    const lines = text.split(/\r?\n/);
    return lines.filter((line) => line.trim().length === 0).length;
  }

  /**
   * Identify BOM type
   */
  private identifyBomType(sample: Buffer): string {
    if (sample.length >= 3 && sample[0] === 0xef && sample[1] === 0xbb && sample[2] === 0xbf) {
      return 'UTF-8 BOM';
    }
    if (sample.length >= 2 && sample[0] === 0xff && sample[1] === 0xfe) {
      return 'UTF-16LE BOM';
    }
    if (sample.length >= 2 && sample[0] === 0xfe && sample[1] === 0xff) {
      return 'UTF-16BE BOM';
    }
    return 'Unknown BOM';
  }

  /**
   * Add performance-related warnings
   */
  private addPerformanceWarnings(parseTimeMs: number, rowCount: number): void {
    const parseTimeSeconds = parseTimeMs / 1000;
    const rowsPerSecond = rowCount / parseTimeSeconds;

    if (parseTimeSeconds > 30) {
      this.warnings.push({
        category: 'parsing',
        severity: 'medium',
        message: `Parsing took ${parseTimeSeconds.toFixed(1)} seconds`,
        impact: 'Longer analysis time',
        suggestion: 'Consider using sampling for very large datasets',
      });
    }

    if (rowsPerSecond < 1000) {
      this.warnings.push({
        category: 'parsing',
        severity: 'low',
        message: `Processing rate: ${Math.round(rowsPerSecond)} rows/second`,
        impact: 'Slower than optimal performance',
      });
    }
  }

  /**
   * Get parser version
   */
  private getParserVersion(): string {
    return getDataPilotVersion();
  }

  /**
   * Get collected warnings
   */
  getWarnings(): Section1Warning[] {
    return [...this.warnings];
  }

  /**
   * Clear warnings
   */
  clearWarnings(): void {
    this.warnings = [];
  }
}
