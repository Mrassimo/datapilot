/**
 * Enhanced Column Type Detection System
 * Sophisticated type inference for EDA analysis
 */
import { EdaDataType, SemanticType } from '../eda/types';
export interface TypeDetectionResult {
    dataType: EdaDataType;
    semanticType: SemanticType;
    confidence: number;
    reasons: string[];
}
interface ColumnSample {
    values: (string | number | null | undefined)[];
    columnName: string;
    columnIndex: number;
}
/**
 * Enhanced Type Detector for sophisticated column type inference
 */
export declare class EnhancedTypeDetector {
    private static readonly EMAIL_PATTERN;
    private static readonly URL_PATTERN;
    private static readonly DATE_PATTERNS;
    private static readonly BOOLEAN_PATTERNS;
    private static readonly CURRENCY_PATTERNS;
    private static readonly PERCENTAGE_PATTERN;
    /**
     * Detect column types from sample data
     */
    static detectColumnTypes(samples: ColumnSample[]): TypeDetectionResult[];
    /**
     * Detect type for a single column
     */
    private static detectSingleColumnType;
    /**
     * Test for DateTime columns
     */
    private static testDateTime;
    /**
     * Test for Boolean columns
     */
    private static testBoolean;
    /**
     * Test for Currency columns
     */
    private static testCurrency;
    /**
     * Test for Percentage columns
     */
    private static testPercentage;
    /**
     * Test for Email columns
     */
    private static testEmail;
    /**
     * Test for URL columns
     */
    private static testURL;
    /**
     * Test for Numerical columns
     */
    private static testNumerical;
    /**
     * Test for Categorical columns
     */
    private static testCategorical;
    /**
     * Test for Text columns (fallback)
     */
    private static testText;
    private static isDateLike;
    private static isBooleanLike;
    private static isCurrencyLike;
    private static inferDateSemanticType;
    private static inferNumericalSemanticType;
    private static inferCategoricalSemanticType;
}
export {};
//# sourceMappingURL=enhanced-type-detector.d.ts.map