/**
 * Section 2: Completeness Dimension Analyzer
 * Analyzes missing data patterns, suggests imputation strategies
 */
import type { CompletenessAnalysis } from './types';
import { DataType } from '../../core/types';
export interface CompletenessAnalyzerInput {
    data: (string | null | undefined)[][];
    headers: string[];
    columnTypes: DataType[];
    rowCount: number;
    columnCount: number;
}
export declare class CompletenessAnalyzer {
    private data;
    private headers;
    private columnTypes;
    private rowCount;
    private columnCount;
    constructor(input: CompletenessAnalyzerInput);
    analyze(): CompletenessAnalysis;
    private analyzeDatasetLevel;
    private analyzeColumnLevel;
    private analyzeMissingDataMatrix;
    private calculateMissingCorrelations;
    private calculateMissingCorrelation;
    private describeMissingCorrelation;
    private detectBlockPatterns;
    private analyzePositionalPatterns;
    private countMissingInColumn;
    private detectMissingnessPattern;
    private calculateRandomnessScore;
    private findCorrelatedMissingColumns;
    private suggestImputationStrategy;
    private generateSparkline;
    private calculateCompletenessScore;
    private calculateVariance;
    private isMissing;
}
//# sourceMappingURL=completeness-analyzer.d.ts.map