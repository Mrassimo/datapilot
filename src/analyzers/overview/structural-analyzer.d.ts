/**
 * Structural Analyzer - Dataset dimensions and memory analysis
 * Handles memory estimation, sparsity analysis, and column profiling
 */
import type { ParsedRow } from '../../parsers/types';
import type { StructuralDimensions, Section1Config, Section1Warning } from './types';
export declare class StructuralAnalyzer {
    private config;
    private warnings;
    constructor(config: Section1Config);
    /**
     * Analyze dataset structural dimensions and memory characteristics
     */
    analyzeStructure(rows: ParsedRow[], hasHeader: boolean): StructuralDimensions;
    /**
     * Create column inventory with names and indices
     */
    private createColumnInventory;
    /**
     * Estimate memory usage of the dataset
     */
    private estimateMemoryUsage;
    /**
     * Calculate average row length in bytes
     */
    private calculateAverageRowLength;
    /**
     * Estimate UTF-8 byte count for a string
     */
    private estimateUtf8Bytes;
    /**
     * Analyze dataset sparsity (empty/null values)
     */
    private analyzeSparsity;
    /**
     * Check if a cell is considered empty
     */
    private isEmptyCell;
    /**
     * Add warnings for structural characteristics
     */
    private addStructuralWarnings;
    /**
     * Create empty structure for edge cases
     */
    private createEmptyStructure;
    /**
     * Get collected warnings
     */
    getWarnings(): Section1Warning[];
    /**
     * Clear warnings
     */
    clearWarnings(): void;
}
//# sourceMappingURL=structural-analyzer.d.ts.map