/**
 * Multivariate Analysis Orchestrator
 *
 * Coordinates and integrates all multivariate analyses:
 * - Principal Component Analysis (PCA)
 * - K-means Clustering
 * - Multivariate Outlier Detection
 * - Multivariate Normality Testing
 * - Relationship Analysis
 *
 * Provides comprehensive insights and recommendations
 * based on the combined results of all analyses.
 */
import type { MultivariateAnalysis } from '../eda/types';
/**
 * Main multivariate analysis orchestrator
 */
export declare class MultivariateOrchestrator {
    private static readonly MIN_VARIABLES;
    private static readonly MIN_OBSERVATIONS;
    /**
     * Perform comprehensive multivariate analysis
     */
    static analyze(data: (string | number | null | undefined)[][], headers: string[], columnTypes: string[], sampleSize: number): Promise<MultivariateAnalysis>;
    /**
     * Identify numerical columns from column types
     */
    private static identifyNumericalColumns;
    /**
     * Assess overall applicability for multivariate analysis
     */
    private static assessApplicability;
    /**
     * Extract numerical data for correlation analysis
     * Uses listwise deletion - only includes rows where ALL numerical columns have valid values
     * This ensures consistent matrix dimensions for correlation analysis
     */
    private static extractNumericData;
    /**
     * Calculate correlation matrix
     */
    private static calculateCorrelationMatrix;
    /**
     * Generate comprehensive insights from all analyses
     */
    private static generateComprehensiveInsights;
    /**
     * Identify analysis limitations
     */
    private static identifyLimitations;
    /**
     * Estimate memory usage
     */
    private static estimateMemoryUsage;
    /**
     * Assess computational complexity
     */
    private static assessComputationalComplexity;
    /**
     * Create non-applicable result
     */
    private static createNonApplicableResult;
}
//# sourceMappingURL=multivariate-orchestrator.d.ts.map