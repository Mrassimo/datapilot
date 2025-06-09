/**
 * High-performance CSV format detection
 */
import type { DetectedCSVFormat } from './types';
export interface DelimiterAnalysis {
    delimiter: string;
    confidence: number;
    fieldCount: number;
    variance: number;
}
export declare class CSVDetector {
    /**
     * Detect CSV format from a buffer sample using statistical analysis
     */
    static detect(buffer: Buffer): DetectedCSVFormat;
    private static detectLineEnding;
    private static detectDelimiter;
    private static analyzeDelimiter;
    private static countFields;
    private static detectQuoteCharacter;
    private static analyzeQuoteCharacter;
    private static detectHeader;
    private static cleanField;
    private static looksLikeHeader;
    private static looksLikeName;
    private static isNumeric;
}
//# sourceMappingURL=csv-detector.d.ts.map