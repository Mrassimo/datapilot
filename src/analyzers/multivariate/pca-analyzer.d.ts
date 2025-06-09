/**
 * Principal Component Analysis (PCA) Implementation
 *
 * Features:
 * - Numerically stable eigenvalue decomposition using QR algorithm
 * - Automatic data standardization and centering
 * - Comprehensive variance explained analysis
 * - Component interpretation and loading analysis
 * - Dimensionality reduction recommendations
 * - Scree plot data generation
 */
import type { PCAAnalysis } from '../eda/types';
/**
 * Main PCA Analyzer class
 */
export declare class PCAAnalyzer {
    private static readonly MIN_VARIABLES;
    private static readonly MIN_OBSERVATIONS;
    private static readonly MAX_VARIABLES;
    /**
     * Perform complete PCA analysis
     */
    static analyze(data: (string | number | null | undefined)[][], headers: string[], numericalColumnIndices: number[], sampleSize: number): PCAAnalysis;
    /**
     * Check if PCA is applicable to the dataset
     */
    private static checkApplicability;
    /**
     * Extract numerical data and handle missing values
     * Converts string numbers to actual numbers and uses listwise deletion
     */
    private static extractNumericData;
    /**
     * Standardize data (center and scale)
     */
    private static standardizeData;
    /**
     * Compute correlation matrix from raw data
     */
    private static computeCorrelationMatrix;
    /**
     * Create principal component objects with interpretations
     */
    private static createPrincipalComponents;
    /**
     * Interpret a principal component based on loadings
     */
    private static interpretComponent;
    /**
     * Calculate variance explained thresholds
     */
    private static calculateVarianceThresholds;
    /**
     * Analyze dominant variables and their component associations
     */
    private static analyzeDominantVariables;
    /**
     * Generate dimensionality reduction recommendations
     */
    private static generateDimensionalityRecommendations;
    /**
     * Find elbow in scree plot using second derivative
     */
    private static findScreeElbow;
    /**
     * Create non-applicable PCA result
     */
    private static createNonApplicableResult;
}
//# sourceMappingURL=pca-analyzer.d.ts.map