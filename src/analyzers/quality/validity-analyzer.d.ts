/**
 * Section 2: Validity Dimension Analyzer
 * Validates data types, ranges, patterns, and business rules
 */
import type { ValidityAnalysis, BusinessRule } from './types';
import { DataType } from '../../core/types';
export interface ValidityAnalyzerInput {
    data: (string | null | undefined)[][];
    headers: string[];
    columnTypes: DataType[];
    rowCount: number;
    columnCount: number;
    businessRules?: BusinessRule[];
    customPatterns?: Record<string, string>;
    customRanges?: Record<string, {
        min?: number;
        max?: number;
    }>;
}
export declare class ValidityAnalyzer {
    private data;
    private headers;
    private columnTypes;
    private rowCount;
    private columnCount;
    private businessRules;
    private customPatterns;
    private customRanges;
    private static readonly EMAIL_PATTERN;
    private static readonly PHONE_PATTERN;
    private static readonly URL_PATTERN;
    private static readonly DATE_PATTERNS;
    constructor(input: ValidityAnalyzerInput);
    analyze(): ValidityAnalysis;
    private analyzeTypeConformance;
    private analyzeRangeConformance;
    private analyzePatternConformance;
    private validateBusinessRules;
    private analyzeFileStructure;
    private inferActualType;
    private checkTypeConformance;
    private inferValueType;
    private looksLikeDate;
    private looksLikeDateTime;
    private isCompatibleType;
    private suggestConversionStrategy;
    private inferReasonableRange;
    private findRangeViolations;
    private inferPattern;
    private getSampleValues;
    private detectCommonPatterns;
    private findPatternViolations;
    private evaluateBusinessRule;
    private calculateValidityScore;
    private formatDataType;
    private formatRange;
    private isValidValue;
    private getMostFrequent;
}
//# sourceMappingURL=validity-analyzer.d.ts.map