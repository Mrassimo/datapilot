/**
 * K-Means Clustering Analysis Implementation
 *
 * Features:
 * - K-means clustering with multiple initialization strategies
 * - Optimal K selection using elbow method and silhouette analysis
 * - Comprehensive cluster validation metrics
 * - Detailed cluster profiling and interpretation
 * - Robust handling of edge cases and convergence issues
 */
import type { KMeansAnalysis } from '../eda/types';
/**
 * Main K-means clustering analyzer
 */
export declare class ClusteringAnalyzer {
    private static readonly MIN_VARIABLES;
    private static readonly MIN_OBSERVATIONS;
    private static readonly MAX_VARIABLES;
    private static readonly MAX_K;
    private static readonly MAX_ITERATIONS;
    private static readonly CONVERGENCE_TOLERANCE;
    /**
     * Perform complete K-means clustering analysis
     */
    static analyze(data: (string | number | null | undefined)[][], headers: string[], numericalColumnIndices: number[], sampleSize: number, randomSeed?: number): KMeansAnalysis;
    /**
     * Check if clustering is applicable to the dataset
     */
    private static checkApplicability;
    /**
     * Extract numerical data and handle missing values
     */
    private static extractNumericData;
    /**
     * Standardize data (center and scale)
     */
    private static standardizeData;
    /**
     * Perform elbow analysis to determine optimal K
     */
    private static performElbowAnalysis;
    /**
     * Determine optimal K from elbow analysis
     */
    private static determineOptimalK;
    /**
     * Perform K-means clustering with Lloyd's algorithm
     */
    private static performKMeansClustering;
    /**
     * Initialize centroids using k-means++ algorithm
     */
    private static initializeCentroidsKMeansPlusPlus;
    /**
     * Calculate Within-Cluster Sum of Squares (WCSS)
     */
    private static calculateWCSS;
    /**
     * Create detailed cluster profiles
     */
    private static createClusterProfiles;
    /**
     * Calculate global means for all variables
     */
    private static calculateGlobalMeans;
    /**
     * Compare cluster mean to global mean
     */
    private static compareToGlobal;
    /**
     * Interpret characteristic relative to global
     */
    private static interpretCharacteristic;
    /**
     * Generate cluster description
     */
    private static generateClusterDescription;
    /**
     * Calculate comprehensive validation metrics
     */
    private static calculateValidationMetrics;
    /**
     * Calculate global centroid
     */
    private static calculateGlobalCentroid;
    /**
     * Calculate cluster centroid
     */
    private static calculateClusterCentroid;
    /**
     * Interpret cluster quality based on multiple metrics
     */
    private static interpretClusterQuality;
    /**
     * Generate insights from clustering results
     */
    private static generateInsights;
    /**
     * Generate recommendations based on clustering results
     */
    private static generateRecommendations;
    /**
     * Calculate coefficient of variation
     */
    private static calculateCoefficientOfVariation;
    /**
     * Create seeded random number generator
     */
    private static createSeededRandom;
    /**
     * Create non-applicable clustering result
     */
    private static createNonApplicableResult;
}
//# sourceMappingURL=clustering-analyzer.d.ts.map