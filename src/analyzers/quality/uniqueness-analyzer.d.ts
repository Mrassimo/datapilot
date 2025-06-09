/**
 * Section 2: Uniqueness Dimension Analyzer
 * Detects exact and semantic duplicates, analyzes cardinality
 */
import type { UniquenessAnalysis } from './types';
import { DataType } from '../../core/types';
export interface UniquenessAnalyzerInput {
    data: (string | null | undefined)[][];
    headers: string[];
    columnTypes: DataType[];
    rowCount: number;
    columnCount: number;
    potentialKeys?: string[];
}
export declare class UniquenessAnalyzer {
    private data;
    private headers;
    private columnTypes;
    private rowCount;
    private potentialKeys;
    constructor(input: UniquenessAnalyzerInput);
    analyze(): UniquenessAnalysis;
    private detectExactDuplicates;
    private analyzeKeyUniqueness;
    private analyzeColumnUniqueness;
    private detectSemanticDuplicates;
    private calculateRowSimilarity;
    private calculateLevenshteinSimilarity;
    private levenshteinDistance;
    private calculateSoundexSimilarity;
    private soundex;
    private getSampleIndices;
    private calculateUniquenessScore;
    private createRowHash;
    private normalizeValue;
    private inferPotentialKeys;
    private isPotentialPrimaryKey;
}
//# sourceMappingURL=uniqueness-analyzer.d.ts.map