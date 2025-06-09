/**
 * Section 2: Data Quality & Integrity Audit - Main Analyzer
 * Orchestrates all quality dimensions and generates comprehensive report
 */
import type { Section2Config, Section2Progress, Section2Result } from './types';
import type { DataType } from '../../core/types';
import type { Section3Result } from '../eda/types';
export interface Section2AnalyzerInput {
    data: (string | null | undefined)[][];
    headers: string[];
    columnTypes: DataType[];
    rowCount: number;
    columnCount: number;
    config?: Section2Config;
    onProgress?: (progress: Section2Progress) => void;
    section3Result?: Section3Result;
}
export declare class Section2Analyzer {
    private data;
    private headers;
    private columnTypes;
    private rowCount;
    private columnCount;
    private config;
    private onProgress?;
    private warnings;
    private startTime;
    private section3Result?;
    private columnIndexMap;
    private entityColumnCache;
    private dateColumnCache;
    private numericColumnCache;
    constructor(input: Section2AnalyzerInput);
    /**
     * Pre-build column index maps for performance optimization
     */
    private buildColumnIndexMaps;
    private isEntityIdentifierColumn;
    private isDateColumn;
    private isNumericColumn;
    analyze(): Promise<Section2Result>;
    private analyzeCompleteness;
    private analyzeUniqueness;
    private analyzeValidity;
    /**
     * Enhanced business rule and pattern validation analysis
     */
    private analyzeBusinessRulesAndPatterns;
    private calculateAccuracyScore;
    private calculateConsistencyScore;
    /**
     * Enhanced consistency scoring with statistical insights
     */
    private calculateEnhancedConsistencyScore;
    private createPlaceholderTimeliness;
    /**
     * Enhanced integrity analysis with statistical test insights
     */
    private createEnhancedIntegrity;
    /**
     * Extract statistical insights from Section 3 results for quality scoring
     */
    private extractStatisticalInsights;
    private createPlaceholderReasonableness;
    private createPlaceholderPrecision;
    private createPlaceholderRepresentational;
    private generateProfilingInsights;
    private createDataQualityCockpit;
    private interpretScore;
    private identifyStrengths;
    private identifyWeaknesses;
    private estimateEffortForDimension;
    private estimateTechnicalDebt;
    private parseEffortHours;
    private countAutomatedFixableIssues;
    private reportProgress;
    private mergeConfig;
    /**
     * External Reference Validation (TODO item 1)
     * Validates data against external reference lists and standards
     */
    private performExternalReferenceValidation;
    /**
     * Validates column values against a reference list (Optimized O(n))
     */
    private validateAgainstReferenceList;
    /**
     * Outlier Impact Analysis (TODO item 2)
     * Links with Section 3 outlier analysis results to assess impact on accuracy
     */
    private analyzeOutlierImpact;
    /**
     * Entity Resolution (Optimized O(n*m) where m is avg entities per type)
     * Identifies and resolves duplicate entities across records
     */
    private performEntityResolution;
    /**
     * Get entity columns from pre-computed cache (O(1))
     */
    private getEntityColumnsFromCache;
    /**
     * Identifies columns that likely represent entity identifiers (Legacy method for compatibility)
     */
    private identifyEntityColumns;
    /**
     * Performs entity resolution for a specific column (Optimized O(n))
     */
    private resolveEntitiesForColumnOptimized;
    /**
     * Legacy method for compatibility (redirects to optimized version)
     */
    private resolveEntitiesForColumn;
    /**
     * Detects conflicts in entity data across multiple records
     */
    private detectEntityConflicts;
    /**
     * Normalizes values for entity comparison
     */
    private normalizeValueForComparison;
    /**
     * Helper methods for enhanced quality dimensions (Optimized with cache)
     */
    private findDateColumns;
    private analyzeDataFreshness;
    private analyzeUpdateFrequency;
    private parseDate;
    private analyzeNumericPrecision;
    private analyzeTemporalGranularity;
    private analyzeCategoricalSpecificity;
}
//# sourceMappingURL=section2-analyzer.d.ts.map