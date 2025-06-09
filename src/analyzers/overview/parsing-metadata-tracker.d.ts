/**
 * Parsing Metadata Tracker - Enhanced CSV parsing with detailed analytics
 * Wraps our CSV parser with confidence scoring and method documentation
 */
import type { ParsedRow } from '../../parsers/types';
import type { ParsingMetadata, Section1Config, Section1Warning } from './types';
export declare class ParsingMetadataTracker {
    private warnings;
    private parser;
    constructor(_config: Section1Config);
    /**
     * Perform enhanced CSV parsing with detailed metadata collection
     */
    parseWithMetadata(filePath: string): Promise<{
        rows: ParsedRow[];
        metadata: ParsingMetadata;
    }>;
    /**
     * Create optimized file sample for analysis
     */
    private createFileSample;
    /**
     * Enhanced encoding detection with confidence analysis
     */
    private analyzeEncoding;
    /**
     * Enhanced delimiter detection with alternatives
     */
    private analyzeDelimiter;
    /**
     * Analyze delimiter alternatives with scoring
     */
    private getDelimiterAlternatives;
    /**
     * Calculate consistency score for field counts
     */
    private calculateConsistencyScore;
    /**
     * Detect line ending format
     */
    private detectLineEndings;
    /**
     * Analyze header detection with confidence
     */
    private analyzeHeaderDetection;
    /**
     * Count empty lines in sample
     */
    private countEmptyLines;
    /**
     * Identify BOM type
     */
    private identifyBomType;
    /**
     * Add performance-related warnings
     */
    private addPerformanceWarnings;
    /**
     * Get parser version
     */
    private getParserVersion;
    /**
     * Get collected warnings
     */
    getWarnings(): Section1Warning[];
    /**
     * Clear warnings
     */
    clearWarnings(): void;
}
//# sourceMappingURL=parsing-metadata-tracker.d.ts.map