/**
 * Efficient encoding detection for CSV files
 */

import { ENCODING_PATTERNS } from './types';

export interface EncodingDetectionResult {
  encoding: BufferEncoding;
  confidence: number;
  hasBOM: boolean;
  bomLength: number;
}

export class EncodingDetector {
  /**
   * Detect encoding from a buffer sample
   * Uses multiple strategies for maximum accuracy
   */
  static detect(buffer: Buffer): EncodingDetectionResult {
    // Check for BOM first
    const bomResult = this.detectBOM(buffer);
    if (bomResult.confidence === 1.0) {
      return bomResult;
    }

    // Statistical analysis for encoding detection
    const stats = this.analyzeBuffer(buffer);

    // UTF-8 detection
    if (this.isValidUTF8(buffer)) {
      const utf8Confidence = this.calculateUTF8Confidence(stats);
      if (utf8Confidence > 0.8) {
        return {
          encoding: 'utf8',
          confidence: utf8Confidence,
          hasBOM: false,
          bomLength: 0,
        };
      }
    }

    // Check for UTF-16
    const utf16Result = this.detectUTF16(buffer, stats);
    if (utf16Result.confidence > 0.7) {
      return utf16Result;
    }

    // Fallback to UTF-8 with lower confidence
    return {
      encoding: 'utf8',
      confidence: 0.5,
      hasBOM: false,
      bomLength: 0,
    };
  }

  private static detectBOM(buffer: Buffer): EncodingDetectionResult {
    for (const pattern of ENCODING_PATTERNS) {
      if (pattern.bom && buffer.length >= pattern.bom.length) {
        if (buffer.slice(0, pattern.bom.length).equals(pattern.bom)) {
          return {
            encoding: pattern.encoding === 'utf16be' ? 'utf16le' : pattern.encoding,
            confidence: 1.0,
            hasBOM: true,
            bomLength: pattern.bom.length,
          };
        }
      }
    }

    return {
      encoding: 'utf8',
      confidence: 0,
      hasBOM: false,
      bomLength: 0,
    };
  }

  private static analyzeBuffer(buffer: Buffer): BufferStats {
    const stats: BufferStats = {
      nullBytes: 0,
      asciiChars: 0,
      nonAsciiChars: 0,
      controlChars: 0,
      highBytes: 0,
      evenNulls: 0,
      oddNulls: 0,
      total: buffer.length,
    };

    for (let i = 0; i < buffer.length; i++) {
      const byte = buffer[i];

      if (byte === 0) {
        stats.nullBytes++;
        if (i % 2 === 0) stats.evenNulls++;
        else stats.oddNulls++;
      } else if (byte < 0x20 && byte !== 0x09 && byte !== 0x0a && byte !== 0x0d) {
        stats.controlChars++;
      } else if (byte >= 0x20 && byte <= 0x7e) {
        stats.asciiChars++;
      } else if (byte >= 0x80) {
        stats.nonAsciiChars++;
        if (byte >= 0xf0) stats.highBytes++;
      }
    }

    return stats;
  }

  private static isValidUTF8(buffer: Buffer): boolean {
    let i = 0;
    while (i < buffer.length) {
      const byte = buffer[i];

      if (byte <= 0x7f) {
        // Single byte character
        i++;
      } else if ((byte & 0xe0) === 0xc0) {
        // Two byte character
        if (i + 1 >= buffer.length || (buffer[i + 1] & 0xc0) !== 0x80) {
          return false;
        }
        i += 2;
      } else if ((byte & 0xf0) === 0xe0) {
        // Three byte character
        if (
          i + 2 >= buffer.length ||
          (buffer[i + 1] & 0xc0) !== 0x80 ||
          (buffer[i + 2] & 0xc0) !== 0x80
        ) {
          return false;
        }
        i += 3;
      } else if ((byte & 0xf8) === 0xf0) {
        // Four byte character
        if (
          i + 3 >= buffer.length ||
          (buffer[i + 1] & 0xc0) !== 0x80 ||
          (buffer[i + 2] & 0xc0) !== 0x80 ||
          (buffer[i + 3] & 0xc0) !== 0x80
        ) {
          return false;
        }
        i += 4;
      } else {
        return false;
      }
    }
    return true;
  }

  private static calculateUTF8Confidence(stats: BufferStats): number {
    if (stats.nullBytes > 0) return 0;
    if (stats.controlChars > stats.total * 0.1) return 0.3;

    const asciiRatio = stats.asciiChars / stats.total;
    const nonAsciiRatio = stats.nonAsciiChars / stats.total;

    if (asciiRatio > 0.95) return 0.95;
    if (asciiRatio > 0.8 && nonAsciiRatio < 0.2) return 0.9;
    if (stats.highBytes === 0 && nonAsciiRatio < 0.3) return 0.85;

    return 0.7;
  }

  private static detectUTF16(_buffer: Buffer, stats: BufferStats): EncodingDetectionResult {
    // UTF-16 typically has many null bytes
    const nullRatio = stats.nullBytes / stats.total;

    if (nullRatio < 0.2) {
      return { encoding: 'utf8', confidence: 0, hasBOM: false, bomLength: 0 };
    }

    // Check for alternating nulls (UTF-16 pattern)
    const evenNullRatio = stats.evenNulls / stats.nullBytes;
    const oddNullRatio = stats.oddNulls / stats.nullBytes;

    if (evenNullRatio > 0.8) {
      return {
        encoding: 'utf16le',
        confidence: Math.min(0.9, nullRatio * 2),
        hasBOM: false,
        bomLength: 0,
      };
    } else if (oddNullRatio > 0.8) {
      // Map utf16be to utf16le for Node.js compatibility
      return {
        encoding: 'utf16le',
        confidence: Math.min(0.9, nullRatio * 2),
        hasBOM: false,
        bomLength: 0,
      };
    }

    return { encoding: 'utf8', confidence: 0, hasBOM: false, bomLength: 0 };
  }
}

interface BufferStats {
  nullBytes: number;
  asciiChars: number;
  nonAsciiChars: number;
  controlChars: number;
  highBytes: number;
  evenNulls: number;
  oddNulls: number;
  total: number;
}
