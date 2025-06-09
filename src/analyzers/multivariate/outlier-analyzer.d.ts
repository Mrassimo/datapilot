/**
 * Multivariate Outlier Detection Implementation
 *
 * Features:
 * - Mahalanobis distance-based outlier detection
 * - Chi-squared distribution for threshold determination
 * - Robust covariance estimation options
 * - Detailed outlier profiling and interpretation
 * - Variable contribution analysis for outlier understanding
 */
import type { MultivariateOutlierAnalysis } from '../eda/types';
/**
 * Main multivariate outlier analyzer
 */
export declare class MultivariateOutlierAnalyzer {
    private static readonly MIN_VARIABLES;
    private static readonly MIN_OBSERVATIONS;
    private static readonly MAX_VARIABLES;
    private static readonly OUTLIER_THRESHOLD;
    /**
     * Perform complete multivariate outlier analysis
     */
    static analyze(data: (string | number | null | undefined)[][], headers: string[], numericalColumnIndices: number[], sampleSize: number): MultivariateOutlierAnalysis;
    /**
     * Check if outlier detection is applicable
     */
    private static checkApplicability;
    /**
     * Extract numerical data and handle missing values
     */
    private static extractNumericData;
    /**
     * Detect outliers using Mahalanobis distance
     */
    private static detectOutliers;
    /**
     * Calculate critical value for chi-squared distribution
     */
    private static calculateCriticalValue;
    /**
     * Determine outlier severity based on p-value
     */
    private static determineSeverity;
    /**
     * Calculate variable contributions to outlier score
     */
    private static calculateVariableContributions;
    /**
     * Interpret outlier characteristics
     */
    private static interpretOutlier;
    /**
     * Analyze severity distribution of outliers
     */
    private static analyzeSeverityDistribution;
    /**
     * Analyze which variables are most affected by outliers
     */
    private static analyzeAffectedVariables;
    /**
     * Generate recommendations based on outlier analysis
     */
    private static generateRecommendations;
    /**
     * Create non-applicable outlier result
     */
    private static createNonApplicableResult;
}
//# sourceMappingURL=outlier-analyzer.d.ts.map