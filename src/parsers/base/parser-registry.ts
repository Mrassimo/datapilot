/**
 * Parser Registry - Universal format detection and parser management
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import type {
  DataParser,
  FormatDetector,
  FormatDetectionResult,
  ParseOptions,
} from './data-parser';
import { DataPilotError, ErrorSeverity, ErrorCategory } from '../../core/types';
import { logger } from '../../utils/logger';

export interface ParserRegistration {
  format: string;
  parserFactory: (options?: ParseOptions) => DataParser;
  detector: FormatDetector;
  priority: number; // Higher priority = checked first
  extensions: string[];
}

export interface DetectionResult {
  parser: DataParser;
  format: string;
  detection: FormatDetectionResult;
  registration: ParserRegistration;
}

/**
 * Central registry for all data parsers
 * Handles format detection and parser instantiation
 */
export class ParserRegistry {
  private registrations = new Map<string, ParserRegistration>();
  private extensionMap = new Map<string, string[]>(); // extension -> format[]

  /**
   * Register a parser for a specific format
   */
  register(registration: ParserRegistration): void {
    const { format, extensions } = registration;

    // Register the parser
    this.registrations.set(format, registration);

    // Map extensions to format
    for (const ext of extensions) {
      const normalized = ext.toLowerCase().startsWith('.')
        ? ext.toLowerCase()
        : `.${ext.toLowerCase()}`;
      if (!this.extensionMap.has(normalized)) {
        this.extensionMap.set(normalized, []);
      }
      this.extensionMap.get(normalized).push(format);
    }

    logger.info(`Registered parser for format: ${format} (extensions: ${extensions.join(', ')})`);
  }

  /**
   * Auto-detect format and return appropriate parser
   */
  async getParser(filePath: string, options: ParseOptions = {}): Promise<DetectionResult> {
    // 1. Force format if specified
    if (options.format) {
      return await this.getParserByFormat(filePath, options.format, options);
    }

    // 2. Try extension-based detection first (fast)
    const extensionCandidates = await this.getCandidatesByExtension(filePath);

    // 3. Run content detection on candidates
    const detectionResults = await this.runContentDetection(filePath, extensionCandidates);

    // 4. Sort by confidence and priority
    detectionResults.sort((a, b) => {
      // Primary: confidence
      if (Math.abs(a.detection.confidence - b.detection.confidence) > 0.1) {
        return b.detection.confidence - a.detection.confidence;
      }
      // Secondary: priority
      return b.registration.priority - a.registration.priority;
    });

    // 5. Return best match or throw error
    const best = detectionResults[0];
    if (!best || best.detection.confidence < 0.5) {
      throw new DataPilotError(
        this.buildUnsupportedFormatError(filePath, detectionResults),
        'UNSUPPORTED_FORMAT',
        ErrorSeverity.HIGH,
        ErrorCategory.VALIDATION,
      );
    }

    logger.info(
      `Selected parser: ${best.format} (confidence: ${best.detection.confidence.toFixed(2)})`,
    );

    return best;
  }

  /**
   * Get parser by specific format
   */
  async getParserByFormat(
    filePath: string,
    format: string,
    options: ParseOptions = {},
  ): Promise<DetectionResult> {
    const registration = this.registrations.get(format);
    if (!registration) {
      throw new DataPilotError(
        `Unsupported format: ${format}. Available formats: ${this.getSupportedFormats().join(', ')}`,
        'UNSUPPORTED_FORMAT',
        ErrorSeverity.HIGH,
        ErrorCategory.VALIDATION,
      );
    }

    const parser = registration.parserFactory(options);
    const detection = await registration.detector.detect(filePath);

    return {
      parser,
      format,
      detection,
      registration,
    };
  }

  /**
   * Get candidate formats based on file extension
   */
  private async getCandidatesByExtension(filePath: string): Promise<ParserRegistration[]> {
    const extension = path.extname(filePath).toLowerCase();
    const formatNames = this.extensionMap.get(extension) || [];

    const candidates = formatNames
      .map((format) => this.registrations.get(format))
      .filter((reg): reg is ParserRegistration => reg !== undefined)
      .sort((a, b) => b.priority - a.priority);

    // If no extension matches, try all parsers (lower priority)
    if (candidates.length === 0) {
      const allRegistrations = Array.from(this.registrations.values()).sort(
        (a, b) => b.priority - a.priority,
      );

      logger.warn(`No parser found for extension ${extension}, trying all parsers`);
      return allRegistrations;
    }

    return candidates;
  }

  /**
   * Run content detection on candidate parsers
   */
  private async runContentDetection(
    filePath: string,
    candidates: ParserRegistration[],
  ): Promise<DetectionResult[]> {
    const results: DetectionResult[] = [];

    for (const registration of candidates) {
      try {
        const detection = await registration.detector.detect(filePath);

        if (detection.confidence > 0) {
          const parser = registration.parserFactory();
          results.push({
            parser,
            format: registration.format,
            detection,
            registration,
          });
        }
      } catch (error) {
        logger.warn(`Detection failed for ${registration.format}: ${error.message}`);
      }
    }

    return results;
  }

  /**
   * Build comprehensive error message for unsupported formats
   */
  private buildUnsupportedFormatError(
    filePath: string,
    detectionResults: DetectionResult[],
  ): string {
    const extension = path.extname(filePath);
    const supportedFormats = this.getSupportedFormats();
    const supportedExtensions = this.getSupportedExtensions();

    let message = `Unsupported file format: ${extension}\n\n`;

    message += `Supported formats: ${supportedFormats.join(', ')}\n`;
    message += `Supported extensions: ${supportedExtensions.join(', ')}\n\n`;

    if (detectionResults.length > 0) {
      message += 'Detection results:\n';
      for (const result of detectionResults.slice(0, 3)) {
        message += `  - ${result.format}: ${(result.detection.confidence * 100).toFixed(1)}% confidence\n`;
      }
      message += '\n';
    }

    message += 'Suggestions:\n';
    message += `  - Check if the file is corrupted\n`;
    message += `  - Try specifying format explicitly: --format csv\n`;
    message += `  - Convert to a supported format first\n`;

    return message;
  }

  /**
   * Get all supported format names
   */
  getSupportedFormats(): string[] {
    return Array.from(this.registrations.keys()).sort();
  }

  /**
   * Get all supported file extensions
   */
  getSupportedExtensions(): string[] {
    return Array.from(this.extensionMap.keys()).sort();
  }

  /**
   * Get format information
   */
  getFormatInfo(format: string): ParserRegistration | undefined {
    return this.registrations.get(format);
  }

  /**
   * Check if format is supported
   */
  isFormatSupported(format: string): boolean {
    return this.registrations.has(format);
  }

  /**
   * Get statistics about registered parsers
   */
  getRegistryStats(): {
    formatCount: number;
    extensionCount: number;
    formats: Array<{
      name: string;
      extensions: string[];
      priority: number;
    }>;
  } {
    const formats = Array.from(this.registrations.values()).map((reg) => ({
      name: reg.format,
      extensions: reg.extensions,
      priority: reg.priority,
    }));

    return {
      formatCount: this.registrations.size,
      extensionCount: this.extensionMap.size,
      formats,
    };
  }

  /**
   * Validate file can be parsed by any registered parser
   */
  async validateFile(filePath: string): Promise<{
    supported: boolean;
    bestMatch?: DetectionResult;
    allResults: DetectionResult[];
  }> {
    try {
      // Check if file exists
      await fs.access(filePath);

      // Get all detection results
      const candidates = await this.getCandidatesByExtension(filePath);
      const allResults = await this.runContentDetection(filePath, candidates);

      // Find best match
      const sorted = allResults.sort((a, b) => b.detection.confidence - a.detection.confidence);
      const bestMatch = sorted[0];

      return {
        supported: bestMatch?.detection.confidence > 0.5,
        bestMatch: bestMatch?.detection.confidence > 0.5 ? bestMatch : undefined,
        allResults,
      };
    } catch (error) {
      return {
        supported: false,
        allResults: [],
      };
    }
  }
}

/**
 * Global parser registry instance
 */
export const globalParserRegistry = new ParserRegistry();
