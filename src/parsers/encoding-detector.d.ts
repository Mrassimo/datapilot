/**
 * Efficient encoding detection for CSV files
 */
export interface EncodingDetectionResult {
    encoding: BufferEncoding;
    confidence: number;
    hasBOM: boolean;
    bomLength: number;
}
export declare class EncodingDetector {
    /**
     * Detect encoding from a buffer sample
     * Uses multiple strategies for maximum accuracy
     */
    static detect(buffer: Buffer): EncodingDetectionResult;
    private static detectBOM;
    private static analyzeBuffer;
    private static isValidUTF8;
    private static calculateUTF8Confidence;
    private static detectUTF16;
}
//# sourceMappingURL=encoding-detector.d.ts.map