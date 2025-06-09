/**
 * File Metadata Collector - Advanced file system analysis
 * Handles file stats, hashing, MIME detection with privacy controls
 */
import type { FileMetadata, Section1Config, Section1Warning } from './types';
export declare class FileMetadataCollector {
    private config;
    private warnings;
    constructor(config: Section1Config);
    /**
     * Collect comprehensive file metadata with optional hashing
     */
    collectMetadata(filePath: string): Promise<FileMetadata>;
    /**
     * Detect MIME type with fallback strategies
     */
    private detectMimeType;
    /**
     * Calculate SHA256 hash efficiently for large files
     */
    private calculateFileHash;
    /**
     * Apply privacy controls to file paths
     */
    private sanitizePath;
    /**
     * Get collected warnings
     */
    getWarnings(): Section1Warning[];
    /**
     * Clear warnings
     */
    clearWarnings(): void;
    /**
     * Validate file accessibility and basic requirements
     */
    validateFile(filePath: string): {
        valid: boolean;
        errors: string[];
    };
}
//# sourceMappingURL=file-metadata-collector.d.ts.map