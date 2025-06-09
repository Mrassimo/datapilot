"use strict";
/**
 * File Metadata Collector - Advanced file system analysis
 * Handles file stats, hashing, MIME detection with privacy controls
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileMetadataCollector = void 0;
const crypto_1 = require("crypto");
const fs_1 = require("fs");
const path_1 = require("path");
class FileMetadataCollector {
    config;
    warnings = [];
    constructor(config) {
        this.config = config;
    }
    /**
     * Collect comprehensive file metadata with optional hashing
     */
    async collectMetadata(filePath) {
        try {
            // Resolve absolute path
            const fullPath = (0, path_1.resolve)(filePath);
            const filename = (0, path_1.basename)(fullPath);
            // Get file statistics
            const stats = (0, fs_1.statSync)(fullPath);
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
            const metadata = {
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
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`Failed to collect file metadata: ${message}`);
        }
    }
    /**
     * Detect MIME type with fallback strategies
     */
    detectMimeType(filePath) {
        const ext = (0, path_1.extname)(filePath).toLowerCase();
        // Common MIME types for data files
        const mimeTypes = {
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
    async calculateFileHash(filePath) {
        return new Promise((resolve, reject) => {
            const hash = (0, crypto_1.createHash)('sha256');
            const stream = (0, fs_1.createReadStream)(filePath, { highWaterMark: 64 * 1024 });
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
    sanitizePath(fullPath) {
        switch (this.config.privacyMode) {
            case 'minimal':
                return (0, path_1.basename)(fullPath);
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
    getWarnings() {
        return [...this.warnings];
    }
    /**
     * Clear warnings
     */
    clearWarnings() {
        this.warnings = [];
    }
    /**
     * Validate file accessibility and basic requirements
     */
    validateFile(filePath) {
        const errors = [];
        try {
            const stats = (0, fs_1.statSync)(filePath);
            if (!stats.isFile()) {
                errors.push('Path does not point to a regular file');
            }
            if (stats.size === 0) {
                errors.push('File is empty');
            }
            if (stats.size > 10 * 1024 * 1024 * 1024) {
                // 10GB
                errors.push('File exceeds maximum size limit (10GB)');
            }
        }
        catch (error) {
            errors.push(`File access error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        return {
            valid: errors.length === 0,
            errors,
        };
    }
}
exports.FileMetadataCollector = FileMetadataCollector;
//# sourceMappingURL=file-metadata-collector.js.map