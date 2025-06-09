/**
 * Performance-Optimized Visualization Pipeline
 *
 * Advanced engine that optimizes visualization performance based on:
 * - Data size and complexity analysis
 * - Memory usage estimation and optimization
 * - Adaptive sampling and aggregation strategies
 * - Rendering performance optimization
 * - Progressive loading and streaming techniques
 */
export interface PerformanceProfile {
    dataSize: DataSizeCategory;
    complexity: ComplexityLevel;
    memoryEstimate: MemoryEstimate;
    renderingStrategy: RenderingStrategy;
    optimizationRecommendations: OptimizationRecommendation[];
    adaptiveStrategies: AdaptiveStrategy[];
    performanceMetrics: PerformanceMetrics;
}
export interface DataSizeCategory {
    category: 'tiny' | 'small' | 'medium' | 'large' | 'huge' | 'massive';
    rowCount: number;
    columnCount: number;
    totalDataPoints: number;
    characterization: string;
    scalingChallenges: string[];
}
export interface ComplexityLevel {
    level: 'simple' | 'moderate' | 'complex' | 'extreme';
    factors: ComplexityFactor[];
    computationalLoad: number;
    renderingLoad: number;
    interactionComplexity: number;
}
export interface ComplexityFactor {
    factor: string;
    impact: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    mitigation: string;
}
export interface MemoryEstimate {
    baseDataMemory: number;
    renderingMemory: number;
    interactionMemory: number;
    totalEstimate: number;
    memoryProfile: MemoryBreakdown;
    optimizationPotential: number;
}
export interface MemoryBreakdown {
    domElements: number;
    canvasMemory: number;
    dataStructures: number;
    caching: number;
    buffers: number;
}
export interface RenderingStrategy {
    technique: 'svg' | 'canvas' | 'webgl' | 'hybrid';
    reasoning: string;
    expectedPerformance: string;
    limitations: string[];
    optimizations: RenderingOptimization[];
}
export interface RenderingOptimization {
    technique: string;
    description: string;
    impact: 'low' | 'medium' | 'high';
    implementation: string;
    tradeoffs: string[];
}
export interface OptimizationRecommendation {
    category: 'data' | 'rendering' | 'interaction' | 'memory' | 'network';
    priority: 'critical' | 'high' | 'medium' | 'low';
    technique: string;
    description: string;
    expectedImprovement: string;
    implementationComplexity: 'trivial' | 'simple' | 'moderate' | 'complex';
    codeExample?: string;
}
export interface AdaptiveStrategy {
    strategy: string;
    trigger: string;
    implementation: string;
    fallbackOptions: string[];
    performanceGain: number;
}
export interface PerformanceMetrics {
    estimatedRenderTime: number;
    estimatedMemoryPeak: number;
    userInteractionLatency: number;
    timeToFirstPaint: number;
    frameRate: number;
    scalabilityScore: number;
}
export interface SamplingConfiguration {
    technique: 'random' | 'stratified' | 'systematic' | 'reservoir' | 'adaptive';
    sampleSize: number;
    preserveOutliers: boolean;
    maintainDistribution: boolean;
    reasoning: string;
    quality: 'high' | 'medium' | 'low';
}
export interface AggregationStrategy {
    method: 'binning' | 'clustering' | 'downsampling' | 'summarization';
    parameters: Record<string, any>;
    dataReduction: number;
    informationRetention: number;
    visualFidelity: number;
}
export interface ProgressiveLoadingPlan {
    stages: LoadingStage[];
    initialDisplay: string;
    progressIndicators: string[];
    userExperience: string;
}
export interface LoadingStage {
    stage: number;
    description: string;
    dataVolume: number;
    estimatedTime: number;
    visualElements: string[];
    fallbackOptions: string[];
}
/**
 * Performance Optimization Engine
 */
export declare class PerformanceOptimizer {
    /**
     * Analyze data characteristics and generate performance profile
     */
    static analyzePerformance(rowCount: number, columnCount: number, chartType: string, interactionComplexity?: number): PerformanceProfile;
    /**
     * Generate intelligent sampling configuration for large datasets
     */
    static generateSamplingStrategy(rowCount: number, columnCount: number, chartType: string, preserveStatistics?: boolean): SamplingConfiguration;
    /**
     * Design aggregation strategy for performance optimization
     */
    static designAggregationStrategy(dataSize: DataSizeCategory, chartType: string, targetPoints?: number): AggregationStrategy;
    /**
     * Create progressive loading plan for complex visualizations
     */
    static createProgressiveLoadingPlan(dataSize: DataSizeCategory, complexity: ComplexityLevel, chartType: string): ProgressiveLoadingPlan;
    private static categorizeDataSize;
    private static assessComplexity;
    private static estimateMemoryUsage;
    private static selectRenderingStrategy;
    private static generateRenderingOptimizations;
    private static generateOptimizationRecommendations;
    private static designAdaptiveStrategies;
    private static calculatePerformanceMetrics;
    private static generateAggregationParameters;
    private static describeUserExperience;
}
//# sourceMappingURL=performance-optimizer.d.ts.map