/**
 * High-performance streaming CSV parser
 * Optimized for large files with minimal memory usage
 */
import { Transform } from 'stream';
import type { CSVParserOptions, ParsedRow, ParserStats } from './types';
export declare class CSVParser {
    private options;
    private stats;
    private aborted;
    constructor(options?: Partial<CSVParserOptions>);
    /**
     * Parse CSV file with automatic format detection
     */
    parseFile(filePath: string): Promise<ParsedRow[]>;
    /**
     * Parse large CSV files using streaming with memory-efficient batching
     */
    private parseFileStreaming;
    /**
     * Create a streaming parser that can process large files
     */
    createStream(): Transform;
    /**
     * Parse CSV from string data
     */
    parseString(data: string): ParsedRow[];
    /**
     * Auto-detect CSV format from file sample with error handling
     */
    private detectFormat;
    /**
     * Create the main parsing transform stream
     */
    private createParseTransform;
    /**
     * Process buffer and extract complete rows
     */
    private processBuffer;
    /**
     * Process raw string arrays into ParsedRow objects with error handling
     */
    private processRawRows;
    /**
     * Check if a row is empty with error handling
     */
    private isEmptyRow;
    /**
     * Get current parsing statistics
     */
    getStats(): ParserStats;
    /**
     * Abort parsing operation
     */
    abort(): void;
    /**
     * Get detected/configured options
     */
    getOptions(): CSVParserOptions;
}
//# sourceMappingURL=csv-parser.d.ts.map