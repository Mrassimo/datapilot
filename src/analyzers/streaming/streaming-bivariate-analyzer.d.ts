/**
 * Streaming Bivariate Analysis Engine
 * Processes pair relationships incrementally using online algorithms
 */
import type { BivariateAnalysis, Section3Warning } from '../eda/types';
import { EdaDataType } from '../eda/types';
export interface ColumnPair {
    col1Index: number;
    col1Name: string;
    col1Type: EdaDataType;
    col2Index: number;
    col2Name: string;
    col2Type: EdaDataType;
}
/**
 * Streaming Bivariate Analyzer
 * Processes column pairs incrementally without storing all data
 */
export declare class StreamingBivariateAnalyzer {
    private numericalPairs;
    private categoricalPairs;
    private numericalCategoricalPairs;
    private numericalCategoricalSamples;
    private scatterSamples;
    private warnings;
    private maxPairs;
    private columnNameToIndex;
    constructor(maxPairs?: number);
    /**
     * Initialize tracking for column pairs
     */
    initializePairs(pairs: ColumnPair[]): void;
    /**
     * Process a row of data for all initialized pairs
     */
    processRow(row: (string | number | null | undefined)[], columnTypes: EdaDataType[]): void;
    /**
     * Finalize analysis and return results
     */
    finalize(headers: string[]): BivariateAnalysis;
    private finalizeNumericalAnalysis;
    private finalizeNumericalCategoricalAnalysis;
    private finalizeCategoricalAnalysis;
    private generateScatterPlotInsights;
    private buildContingencyTable;
    /**
     * Generate real statistical tests using proper ANOVA F-test and Kruskal-Wallis test
     */
    private generateRealStatisticalTests;
    /**
     * Extract raw values for a specific group if available from reservoir samples
     */
    private extractGroupValues;
    /**
     * Format ANOVA result interpretation for compact display
     */
    private formatAnovaInterpretation;
    /**
     * Format Kruskal-Wallis result interpretation for compact display
     */
    private formatKruskalWallisInterpretation;
    private generateAssociationTests;
    private generateGroupSummary;
    private generateCategoricalInsights;
    private interpretCorrelationStrength;
    private isNumericalType;
    private isCategoricalType;
    private findColumnIndex;
    private extractNumericValue;
    private extractStringValue;
    getWarnings(): Section3Warning[];
}
//# sourceMappingURL=streaming-bivariate-analyzer.d.ts.map