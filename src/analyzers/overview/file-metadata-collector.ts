/**
 * File Metadata Collector - Advanced file system analysis
 * Handles file stats, hashing, MIME detection with privacy controls
 */

import { createHash } from 'crypto';
import { createReadStream, statSync, existsSync, accessSync, constants } from 'fs';
import { resolve, basename, extname } from 'path';
import type { FileMetadata, Section1Config, Section1Warning } from './types';

export class FileMetadataCollector {
  private config: Section1Config;
  private warnings: Section1Warning[] = [];

  constructor(config: Section1Config) {
    this.config = config;
  }

  /**
   * Collect comprehensive file metadata with optional hashing
   */
  async collectMetadata(filePath: string): Promise<FileMetadata> {
    try {
      // Resolve absolute path
      const fullPath = resolve(filePath);
      const filename = basename(fullPath);

      // Get file statistics
      const stats = statSync(fullPath);

      // Calculate file size
      const fileSizeBytes = stats.size;
      const fileSizeMB = fileSizeBytes / (1024 * 1024);

      // Detect MIME type
      const mimeType = this.detectMimeType(fullPath);

      // Calculate hash if enabled
      const sha256Hash = this.config.enableFileHashing
        ? await this.calculateFileHash(fullPath)
        : 'disabled';

      // Apply privacy controls to path
      const sanitizedPath = this.sanitizePath(fullPath);

      const metadata: FileMetadata = {
        originalFilename: filename,
        fullResolvedPath: sanitizedPath,
        fileSizeBytes,
        fileSizeMB: Number(fileSizeMB.toFixed(6)),
        mimeType,
        lastModified: stats.mtime,
        sha256Hash,
      };

      // Performance info for very large files
      if (fileSizeMB > 1000) {
        // Only warn for files > 1GB
        this.warnings.push({
          category: 'file',
          severity: 'low',
          message: `Very large file detected (${fileSizeMB.toFixed(1)}MB)`,
          impact: 'Analysis will use streaming algorithms to manage memory efficiently',
          suggestion: 'Processing may take longer but memory usage will remain bounded',
        });
      }

      return metadata;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to collect file metadata: ${message}`);
    }
  }

  /**
   * Detect MIME type with fallback strategies
   */
  private detectMimeType(filePath: string): string {
    const ext = extname(filePath).toLowerCase();

    // Common MIME types for data files
    const mimeTypes: Record<string, string> = {
      '.csv': 'text/csv',
      '.tsv': 'text/tab-separated-values',
      '.txt': 'text/plain',
      '.json': 'application/json',
      '.xml': 'application/xml',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.xls': 'application/vnd.ms-excel',
    };

    return mimeTypes[ext] || 'application/octet-stream';
  }

  /**
   * Calculate SHA256 hash efficiently for large files
   */
  private async calculateFileHash(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = createHash('sha256');
      const stream = createReadStream(filePath, { highWaterMark: 64 * 1024 });

      stream.on('data', (chunk) => {
        hash.update(chunk);
      });

      stream.on('end', () => {
        resolve(hash.digest('hex'));
      });

      stream.on('error', (error) => {
        reject(new Error(`Hash calculation failed: ${error.message}`));
      });
    });
  }

  /**
   * Apply privacy controls to file paths
   */
  private sanitizePath(fullPath: string): string {
    switch (this.config.privacyMode) {
      case 'minimal':
        return basename(fullPath);

      case 'redacted':
        // Replace user directory with placeholder
        return fullPath
          .replace(/\/Users\/[^\/]+/, '/Users/[user]')
          .replace(/C:\\Users\\[^\\]+/, 'C:\\Users\\[user]');

      case 'full':
      default:
        return fullPath;
    }
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

  /**
   * Validate file accessibility and basic requirements
   */
  validateFile(filePath: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check if file exists first
    if (!existsSync(filePath)) {
      errors.push(`File does not exist: ${filePath}`);
      return { valid: false, errors };
    }

    try {
      // Check file accessibility
      accessSync(filePath, constants.R_OK);
    } catch (error) {
      if (error instanceof Error) {
        const nodeError = error as NodeJS.ErrnoException;
        if (nodeError.code === 'EACCES') {
          errors.push(`File is not readable - check permissions: ${filePath}`);
        } else {
          errors.push(`File access error: ${nodeError.message}`);
        }
      } else {
        errors.push('File access error: Unknown error');
      }
      return { valid: false, errors };
    }

    try {
      const stats = statSync(filePath);

      if (!stats.isFile()) {
        errors.push(`Path does not point to a regular file: ${filePath}`);
      }

      if (stats.size === 0) {
        errors.push(`File is empty: ${filePath}`);
      }

      if (stats.size > 10 * 1024 * 1024 * 1024) {
        // 10GB
        errors.push(`File exceeds maximum size limit (10GB): ${filePath}`);
      }
    } catch (error) {
      // Handle stat errors
      if (error instanceof Error) {
        const nodeError = error as NodeJS.ErrnoException;
        if (nodeError.code === 'EISDIR') {
          errors.push(`Path points to a directory, not a file: ${filePath}`);
        } else {
          errors.push(`File stat error: ${nodeError.message}`);
        }
      } else {
        errors.push('File stat error: Unknown error');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
