/**
 * Streaming Univariate Analysis Engine
 * Processes data incrementally using online algorithms
 */
import type { NumericalColumnAnalysis, CategoricalColumnAnalysis, DateTimeAnalysis, BooleanAnalysis, TextColumnAnalysis, ColumnAnalysis, Section3Warning, EdaDataType } from '../eda/types';
import { SemanticType } from '../eda/types';
export interface StreamingColumnAnalyzer {
    processValue(value: string | number | null | undefined): void;
    finalize(): ColumnAnalysis;
    getWarnings(): Section3Warning[];
    clearMemory?(): void;
}
/**
 * Streaming Numerical Column Analyzer
 */
export declare class StreamingNumericalAnalyzer implements StreamingColumnAnalyzer {
    private columnName;
    private detectedType;
    private semanticType;
    private stats;
    private quantiles;
    private reservoir;
    private frequencies;
    private warnings;
    private totalValues;
    private validValues;
    private nullValues;
    constructor(columnName: string, detectedType: EdaDataType, semanticType?: SemanticType);
    processValue(value: string | number | null | undefined): void;
    finalize(): NumericalColumnAnalysis;
    private createBaseProfile;
    private getDescriptiveStatistics;
    private getQuantileStatistics;
    private getDistributionAnalysis;
    private getNormalityTests;
    private getOutlierAnalysis;
    private getNumericalPatterns;
    getWarnings(): Section3Warning[];
    clearMemory(): void;
}
/**
 * Streaming Categorical Column Analyzer
 */
export declare class StreamingCategoricalAnalyzer implements StreamingColumnAnalyzer {
    private columnName;
    private detectedType;
    private semanticType;
    private frequencies;
    private warnings;
    private totalValues;
    private validValues;
    private nullValues;
    private lengthStats;
    constructor(columnName: string, detectedType: EdaDataType, semanticType?: SemanticType);
    processValue(value: string | number | null | undefined): void;
    finalize(): CategoricalColumnAnalysis;
    private createBaseProfile;
    private getFrequencyDistribution;
    private getDiversityMetrics;
    private getLabelAnalysis;
    private getRecommendations;
    getWarnings(): Section3Warning[];
}
/**
 * Streaming DateTime Column Analyzer
 */
export declare class StreamingDateTimeAnalyzer implements StreamingColumnAnalyzer {
    private columnName;
    private detectedType;
    private semanticType;
    private warnings;
    private totalValues;
    private validValues;
    private nullValues;
    private dateValues;
    private maxDateSamples;
    private yearCounts;
    private monthCounts;
    private dayOfWeekCounts;
    private hourCounts;
    constructor(columnName: string, detectedType: EdaDataType, semanticType?: SemanticType);
    processValue(value: string | number | null | undefined): void;
    finalize(): DateTimeAnalysis;
    private createBaseProfile;
    private calculateTimeSpan;
    private detectGranularity;
    private detectPrecision;
    private getMostCommonComponents;
    private analyzeTemporalPatterns;
    private analyzeGaps;
    private generateValidityNotes;
    getWarnings(): Section3Warning[];
}
/**
 * Streaming Boolean Column Analyzer
 */
export declare class StreamingBooleanAnalyzer implements StreamingColumnAnalyzer {
    private columnName;
    private detectedType;
    private semanticType;
    private warnings;
    private totalValues;
    private trueCount;
    private falseCount;
    private nullValues;
    constructor(columnName: string, detectedType: EdaDataType, semanticType?: SemanticType);
    processValue(value: string | number | null | undefined): void;
    finalize(): BooleanAnalysis;
    getWarnings(): Section3Warning[];
}
/**
 * Streaming Text Column Analyzer
 */
export declare class StreamingTextAnalyzer implements StreamingColumnAnalyzer {
    private columnName;
    private detectedType;
    private semanticType;
    private warnings;
    private totalValues;
    private validValues;
    private nullValues;
    private charLengths;
    private wordCounts;
    private maxTextSamples;
    private emptyStrings;
    private numericTexts;
    private urlCount;
    private emailCount;
    private wordFrequencies;
    constructor(columnName: string, detectedType: EdaDataType, semanticType?: SemanticType);
    processValue(value: string | number | null | undefined): void;
    finalize(): TextColumnAnalysis;
    private createBaseProfile;
    private getTextStatistics;
    private getTextPatterns;
    private getTopFrequentWords;
    getWarnings(): Section3Warning[];
}
//# sourceMappingURL=streaming-univariate-analyzer.d.ts.map