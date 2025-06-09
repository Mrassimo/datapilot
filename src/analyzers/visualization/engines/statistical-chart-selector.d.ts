/**
 * Statistical-Driven Chart Selection Engine
 *
 * Advanced engine that analyzes statistical properties of data to make
 * intelligent chart recommendations based on:
 * - Distribution characteristics (normality, skewness, kurtosis)
 * - Statistical significance of relationships
 * - Data quality metrics and outlier patterns
 * - Correlation structures and effect sizes
 * - Variance explained and dimensionality
 */
import type { ColumnAnalysis } from '../../eda/types';
export interface StatisticalChartRecommendation {
    chartType: string;
    confidence: number;
    statisticalJustification: string;
    dataCharacteristics: string[];
    visualEncodingStrategy: VisualEncodingStrategy;
    interactionRecommendations: InteractionRecommendation[];
    alternativeOptions: AlternativeChartOption[];
    performanceConsiderations: PerformanceGuidance;
}
export interface VisualEncodingStrategy {
    primaryEncoding: EncodingChannel;
    secondaryEncodings: EncodingChannel[];
    colorStrategy: ColorEncodingStrategy;
    sizeStrategy?: SizeEncodingStrategy;
    shapeStrategy?: ShapeEncodingStrategy;
    aestheticOptimizations: AestheticOptimization[];
}
export interface EncodingChannel {
    channel: 'x' | 'y' | 'color' | 'size' | 'shape' | 'opacity' | 'angle';
    dataField: string;
    dataType: 'quantitative' | 'ordinal' | 'nominal' | 'temporal';
    scale: ScaleRecommendation;
    justification: string;
}
export interface ScaleRecommendation {
    type: 'linear' | 'log' | 'sqrt' | 'ordinal' | 'time' | 'threshold' | 'quantile';
    domain: [number, number] | string[];
    range?: [number, number] | string[];
    nice?: boolean;
    zero?: boolean;
    clamp?: boolean;
    reasoning: string;
}
export interface ColorEncodingStrategy {
    scheme: 'categorical' | 'sequential' | 'diverging' | 'cyclical';
    palette: string;
    accessibility: AccessibilityGuidance;
    reasoning: string;
}
export interface SizeEncodingStrategy {
    minSize: number;
    maxSize: number;
    scaling: 'linear' | 'sqrt' | 'area';
    reasoning: string;
}
export interface ShapeEncodingStrategy {
    shapes: string[];
    maxCategories: number;
    fallbackStrategy: string;
    reasoning: string;
}
export interface AestheticOptimization {
    property: string;
    value: any;
    reasoning: string;
    impact: 'high' | 'medium' | 'low';
}
export interface InteractionRecommendation {
    interactionType: 'hover' | 'click' | 'brush' | 'zoom' | 'pan' | 'filter' | 'sort';
    purpose: string;
    implementation: string;
    priority: 'essential' | 'recommended' | 'optional';
    statisticalBenefit: string;
}
export interface AlternativeChartOption {
    chartType: string;
    confidence: number;
    tradeoffs: string;
    whenToUse: string;
    statisticalSuitability: number;
}
export interface PerformanceGuidance {
    dataPointThreshold: number;
    samplingStrategy?: string;
    aggregationSuggestions: string[];
    renderingOptimizations: string[];
    memoryConsiderations: string[];
}
export interface AccessibilityGuidance {
    colorBlindnessSafe: boolean;
    contrastRatio: number;
    alternativeEncodings: string[];
    screenReaderGuidance: string;
}
export interface DistributionAnalysis {
    isNormal: boolean;
    skewness: number;
    kurtosis: number;
    modality: 'unimodal' | 'bimodal' | 'multimodal';
    outlierSeverity: 'none' | 'mild' | 'moderate' | 'severe';
    tailBehavior: 'light' | 'normal' | 'heavy';
    recommendedTransformation?: string;
}
export interface CorrelationInsight {
    strength: 'very_weak' | 'weak' | 'moderate' | 'strong' | 'very_strong';
    direction: 'positive' | 'negative';
    significance: number;
    effectSize: number;
    relationship: 'linear' | 'monotonic' | 'non_linear' | 'threshold' | 'cyclical';
    confoundingFactors: string[];
}
/**
 * Advanced Statistical Chart Selection Engine
 */
export declare class StatisticalChartSelector {
    /**
     * Generate statistically-informed chart recommendations for univariate data
     */
    static recommendUnivariateChart(columnAnalysis: ColumnAnalysis): StatisticalChartRecommendation;
    /**
     * Generate statistically-informed chart recommendations for bivariate relationships
     */
    static recommendBivariateChart(xColumn: ColumnAnalysis, yColumn: ColumnAnalysis, correlation?: CorrelationInsight): StatisticalChartRecommendation;
    /**
     * Analyze distribution characteristics for statistical insights
     */
    private static analyzeDistribution;
    /**
     * Recommend charts for numerical univariate data based on distribution
     */
    private static recommendNumericalUnivariate;
    /**
     * Recommend charts for categorical univariate data
     */
    private static recommendCategoricalUnivariate;
    /**
     * Recommend charts for numerical vs numerical relationships
     */
    private static recommendNumericalBivariate;
    private static createUnivariateEncodingStrategy;
    private static createBivariateEncodingStrategy;
    private static recommendScale;
    private static isNumerical;
    private static isCategorical;
    private static isTemporal;
    private static calculateEntropy;
    private static detectOrderedCategories;
    private static extractDataCharacteristics;
    private static generateUnivariateInteractions;
    private static generateUnivariateAlternatives;
    private static generatePerformanceGuidance;
    private static generateAestheticOptimizations;
    private static recommendTemporalUnivariate;
    private static recommendBooleanUnivariate;
    private static recommendCategoricalNumerical;
    private static recommendCategoricalBivariate;
    private static recommendTemporalBivariate;
    private static createCategoricalEncodingStrategy;
    private static generateCategoricalInteractions;
    private static generateCategoricalAlternatives;
    private static generateBivariateInteractions;
    private static generateBivariateAlternatives;
    private static createFallbackRecommendation;
    private static createFallbackBivariateRecommendation;
}
//# sourceMappingURL=statistical-chart-selector.d.ts.map