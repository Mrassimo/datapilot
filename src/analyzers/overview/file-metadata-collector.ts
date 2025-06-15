/**
 * File Metadata Collector - Advanced file system analysis
 * Handles file stats, hashing, MIME detection with privacy controls
 */

import { createHash } from 'crypto';
import { createReadStream, statSync, existsSync, accessSync, constants } from 'fs';
import { resolve, basename, extname } from 'path';
import { gzipSync } from 'zlib';
import type { FileMetadata, Section1Config, Section1Warning, CompressionAnalysis, FileHealthCheck } from './types';

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

      // Add compression analysis if enabled
      if (this.config.enableCompressionAnalysis) {
        try {
          metadata.compressionAnalysis = await this.analyzeCompression(fullPath, fileSizeBytes);
        } catch (error) {
          // Fall back to basic compression info if analysis fails
          metadata.compressionAnalysis = {
            originalSizeBytes: fileSizeBytes,
            estimatedGzipSizeBytes: Math.round(fileSizeBytes * 0.7),
            estimatedGzipReduction: 30,
            estimatedParquetSizeBytes: Math.round(fileSizeBytes * 0.5),
            estimatedParquetReduction: 50,
            columnEntropy: [],
            recommendedFormat: 'gzip',
            analysisMethod: 'Fallback estimation (analysis failed)',
          };
        }
      }

      // Add health check if enabled
      if (this.config.enableHealthChecks) {
        try {
          metadata.healthCheck = await this.performHealthCheck(fullPath);
        } catch (error) {
          // Fall back to basic health info if check fails
          metadata.healthCheck = {
            bomDetected: false,
            lineEndingConsistency: 'unknown',
            nullBytesDetected: false,
            validEncodingThroughout: true,
            largeFileWarning: fileSizeMB > 100,
            recommendations: ['Health check failed - using fallback assessment'],
            healthScore: 75,
          };
        }
      }

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
          .replace(/\/home\/[^\/]+/, '/home/[user]')
          .replace(/C:\\Users\\[^\\]+/, 'C:\\Users\\[user]')
          // GitHub Actions Windows CI path: C:\a\repo\repo\...
          .replace(/C:\\a\\[^\\]+\\[^\\]+/, 'C:\\a\\[project]\\[project]')
          // Azure DevOps Windows CI paths
          .replace(/C:\\Agent\\_work\\[^\\]+/, 'C:\\Agent\\_work\\[build]')
          .replace(/D:\\a\\[^\\]+/, 'D:\\a\\[build]');

      case 'full':
      default:
        return fullPath;
    }
  }

  /**
   * Analyze compression potential and estimate savings
   */
  private async analyzeCompression(filePath: string, originalSize: number): Promise<CompressionAnalysis> {
    try {
      // Sample the file for compression analysis (first 1MB or full file if smaller)
      const sampleSize = Math.min(originalSize, 1024 * 1024);
      const sampleData = await this.readFileSample(filePath, sampleSize);
      
      // Calculate gzip compression
      const gzippedSample = gzipSync(sampleData);
      const sampleCompressionRatio = gzippedSample.length / sampleData.length;
      const estimatedGzipSize = Math.round(originalSize * sampleCompressionRatio);
      const gzipReduction = Math.round((1 - sampleCompressionRatio) * 100);

      // Estimate Parquet compression (roughly 40-60% of original for text data)
      const estimatedParquetRatio = 0.5; // Conservative estimate for CSV->Parquet
      const estimatedParquetSize = Math.round(originalSize * estimatedParquetRatio);
      const parquetReduction = Math.round((1 - estimatedParquetRatio) * 100);

      // Calculate Shannon entropy for sample columns (simplified)
      const columnEntropy = this.calculateColumnEntropy(sampleData.toString('utf8'));

      // Determine recommendation
      let recommendedFormat: 'gzip' | 'parquet' | 'none' = 'none';
      if (gzipReduction > 30) {
        recommendedFormat = gzipReduction > parquetReduction ? 'gzip' : 'parquet';
      }

      return {
        originalSizeBytes: originalSize,
        estimatedGzipSizeBytes: estimatedGzipSize,
        estimatedGzipReduction: gzipReduction,
        estimatedParquetSizeBytes: estimatedParquetSize,
        estimatedParquetReduction: parquetReduction,
        columnEntropy,
        recommendedFormat,
        analysisMethod: `Sample-based analysis (${(sampleSize / 1024).toFixed(0)}KB sample)`,
      };
    } catch (error) {
      // Fallback analysis if compression fails
      return {
        originalSizeBytes: originalSize,
        estimatedGzipSizeBytes: Math.round(originalSize * 0.7),
        estimatedGzipReduction: 30,
        estimatedParquetSizeBytes: Math.round(originalSize * 0.5),
        estimatedParquetReduction: 50,
        columnEntropy: [],
        recommendedFormat: 'gzip',
        analysisMethod: 'Fallback estimation (compression test failed)',
      };
    }
  }

  /**
   * Perform file health checks
   */
  private async performHealthCheck(filePath: string): Promise<FileHealthCheck> {
    try {
      // Read first part of file for analysis
      const sampleSize = Math.min(64 * 1024, statSync(filePath).size); // 64KB sample
      const sampleData = await this.readFileSample(filePath, sampleSize);
      const sampleText = sampleData.toString('utf8');

      // Check for BOM
      const bomDetected = sampleData.length >= 3 && 
        sampleData[0] === 0xEF && 
        sampleData[1] === 0xBB && 
        sampleData[2] === 0xBF;

      // Check line ending consistency
      const crlfCount = (sampleText.match(/\r\n/g) || []).length;
      const lfCount = (sampleText.match(/(?<!\r)\n/g) || []).length;
      const crCount = (sampleText.match(/\r(?!\n)/g) || []).length;
      
      let lineEndingConsistency: 'consistent' | 'mixed' | 'unknown' = 'unknown';
      const totalLineEndings = crlfCount + lfCount + crCount;
      if (totalLineEndings > 0) {
        const dominant = Math.max(crlfCount, lfCount, crCount);
        lineEndingConsistency = (dominant / totalLineEndings) > 0.9 ? 'consistent' : 'mixed';
      }

      // Check for null bytes
      const nullBytesDetected = sampleData.includes(0);

      // Check encoding validity
      let validEncodingThroughout = true;
      try {
        sampleData.toString('utf8');
      } catch {
        validEncodingThroughout = false;
      }

      // Large file warning
      const fileSizeMB = statSync(filePath).size / (1024 * 1024);
      const largeFileWarning = fileSizeMB > 100; // 100MB threshold

      // Generate recommendations
      const recommendations: string[] = [];
      if (bomDetected) {
        recommendations.push('Consider removing BOM for better compatibility');
      }
      if (lineEndingConsistency === 'mixed') {
        recommendations.push('Standardise line endings for consistent processing');
      }
      if (nullBytesDetected) {
        recommendations.push('File contains null bytes - verify data integrity');
      }
      if (!validEncodingThroughout) {
        recommendations.push('File contains invalid UTF-8 sequences');
      }
      if (largeFileWarning) {
        recommendations.push('Large file detected - consider chunked processing');
      }

      // Calculate health score
      let healthScore = 100;
      if (bomDetected) healthScore -= 5;
      if (lineEndingConsistency === 'mixed') healthScore -= 10;
      if (nullBytesDetected) healthScore -= 20;
      if (!validEncodingThroughout) healthScore -= 30;
      if (largeFileWarning) healthScore -= 5;

      return {
        bomDetected,
        bomType: bomDetected ? 'UTF-8' : undefined,
        lineEndingConsistency,
        nullBytesDetected,
        validEncodingThroughout,
        largeFileWarning,
        recommendations,
        healthScore: Math.max(0, healthScore),
      };
    } catch (error) {
      return {
        bomDetected: false,
        lineEndingConsistency: 'unknown',
        nullBytesDetected: false,
        validEncodingThroughout: true,
        largeFileWarning: false,
        recommendations: ['Health check failed - file may be inaccessible'],
        healthScore: 50,
      };
    }
  }

  /**
   * Calculate column entropy for compression analysis
   */
  private calculateColumnEntropy(sampleText: string): Array<{
    columnName: string;
    entropy: number;
    compressionPotential: 'high' | 'medium' | 'low';
  }> {
    try {
      const lines = sampleText.split('\n').slice(0, 100); // First 100 lines
      if (lines.length < 2) return [];

      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const columnEntropy: Array<{
        columnName: string;
        entropy: number;
        compressionPotential: 'high' | 'medium' | 'low';
      }> = [];

      // Analyse first few columns (limit to 10 for performance)
      const maxColumns = Math.min(headers.length, 10);
      
      for (let i = 0; i < maxColumns; i++) {
        const values: string[] = [];
        for (let j = 1; j < lines.length && j < 50; j++) { // Sample 50 rows
          const columns = lines[j].split(',');
          if (columns[i]) {
            values.push(columns[i].trim().replace(/"/g, ''));
          }
        }

        if (values.length > 0) {
          const entropy = this.calculateShannonEntropy(values);
          let compressionPotential: 'high' | 'medium' | 'low' = 'medium';
          
          if (entropy < 2) compressionPotential = 'high';
          else if (entropy > 4) compressionPotential = 'low';

          columnEntropy.push({
            columnName: headers[i] || `Column_${i + 1}`,
            entropy: Math.round(entropy * 100) / 100,
            compressionPotential,
          });
        }
      }

      return columnEntropy;
    } catch {
      return [];
    }
  }

  /**
   * Calculate Shannon entropy for a set of values
   */
  private calculateShannonEntropy(values: string[]): number {
    const frequency = new Map<string, number>();
    for (const value of values) {
      frequency.set(value, (frequency.get(value) || 0) + 1);
    }

    const total = values.length;
    let entropy = 0;

    for (const count of frequency.values()) {
      const probability = count / total;
      entropy -= probability * Math.log2(probability);
    }

    return entropy;
  }

  /**
   * Read a sample of the file
   */
  private async readFileSample(filePath: string, sampleSize: number): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      let totalRead = 0;
      let resolved = false;
      
      const stream = createReadStream(filePath, { start: 0, end: sampleSize - 1 });
      
      const resolveOnce = (result: Buffer) => {
        if (!resolved) {
          resolved = true;
          resolve(result);
        }
      };
      
      const rejectOnce = (error: Error) => {
        if (!resolved) {
          resolved = true;
          reject(error);
        }
      };
      
      stream.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
        totalRead += chunk.length;
        if (totalRead >= sampleSize) {
          stream.destroy();
          resolveOnce(Buffer.concat(chunks));
        }
      });

      stream.on('end', () => {
        resolveOnce(Buffer.concat(chunks));
      });

      stream.on('error', (error) => {
        rejectOnce(error);
      });

      stream.on('close', () => {
        // Ensure we resolve even if end event doesn't fire after destroy
        resolveOnce(Buffer.concat(chunks));
      });
    });
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
      } else {
        // Only check file-specific properties if it's actually a file
        if (stats.size === 0) {
          errors.push(`File is empty: ${filePath}`);
        }

        if (stats.size > 10 * 1024 * 1024 * 1024) {
          // 10GB
          errors.push(`File exceeds maximum size limit (10GB): ${filePath}`);
        }
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
