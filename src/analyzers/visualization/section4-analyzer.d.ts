/**
 * Section 4: Advanced Visualization Intelligence Analyzer
 *
 * Ultra-sophisticated visualization recommendation engine featuring:
 * - Statistical-driven chart selection with data distribution analysis
 * - Performance-optimized visualization pipeline with adaptive algorithms
 * - Advanced chart composition with multi-dimensional encoding
 * - Sophisticated dashboard layout using perceptual principles
 * - Domain-aware visualization intelligence with context detection
 * - Aesthetic optimization engine for data-driven design decisions
 *
 * This represents the "calculator on steroids" approach to visualization intelligence,
 * combining statistical rigor with sophisticated design principles.
 */
import type { Section1Result } from '../overview/types';
import type { Section3Result } from '../eda/types';
import type { Section4Result, Section4Config } from './types';
export declare class Section4Analyzer {
    private config;
    private warnings;
    private antiPatterns;
    constructor(config?: Partial<Section4Config>);
    /**
     * Main analysis method - uses sophisticated visualization intelligence engines
     */
    analyze(section1Result: Section1Result, section3Result: Section3Result): Promise<Section4Result>;
    /**
     * Get domain-specific audience from domain context
     */
    private getDomainAudience;
    /**
     * Determine complexity level from domain context
     */
    private determineComplexityFromDomain;
    /**
     * Determine interactivity level from domain context
     */
    private determineInteractivityFromDomain;
    /**
     * Determine performance level from data size
     */
    private determinePerformanceFromData;
    /**
     * Extract data characteristics for sophisticated engine processing
     */
    private extractDataCharacteristics;
    /**
     * Generate domain-aware visualization strategy using sophisticated analysis
     */
    private generateDomainAwareStrategy;
    /**
     * Generate sophisticated univariate recommendations using all engines
     */
    private generateSophisticatedUnivariateRecommendations;
    /**
     * Generate sophisticated bivariate recommendations
     */
    private generateSophisticatedBivariateRecommendations;
    /**
     * Generate sophisticated multivariate recommendations
     */
    private generateSophisticatedMultivariateRecommendations;
    /**
     * Extract clustering insights from Section 3 multivariate analysis
     */
    private extractClusteringInsights;
    /**
     * Generate overall visualization strategy based on data characteristics
     */
    private generateVisualizationStrategy;
    /**
     * Generate univariate recommendations for each column
     */
    private generateUnivariateRecommendations;
    /**
     * Create visualization profile for a single column
     */
    private createColumnVisualizationProfile;
    /**
     * Generate chart recommendations for a specific column
     */
    private generateColumnChartRecommendations;
    /**
     * Generate recommendations for numerical columns
     */
    private generateNumericalRecommendations;
    /**
     * Generate recommendations for categorical columns
     */
    private generateCategoricalRecommendations;
    /**
     * Generate recommendations for datetime columns
     */
    private generateDateTimeRecommendations;
    /**
     * Generate recommendations for boolean columns
     */
    private generateBooleanRecommendations;
    /**
     * Generate recommendations for text columns
     */
    private generateTextRecommendations;
    /**
     * Generate bivariate recommendations with correlation analysis
     */
    private generateBivariateRecommendations;
    /**
     * Extract correlation data from Section 3 results
     */
    private extractCorrelations;
    /**
     * Create bivariate visualization profile for a correlation
     */
    private createBivariateProfile;
    /**
     * Generate chart recommendations for bivariate relationships
     */
    private generateBivariateChartRecommendations;
    /**
     * Generate multivariate recommendations with advanced chart types
     */
    private generateMultivariateRecommendations;
    /**
     * Generate sophisticated dashboard recommendations using perceptual principles
     */
    private generateSophisticatedDashboardRecommendations;
    /**
     * Original simple dashboard recommendations method (fallback)
     */
    private generateDashboardRecommendations;
    /**
     * Generate enhanced technical guidance using performance optimization and domain expertise
     */
    private generateEnhancedTechnicalGuidance;
    /**
     * Simple technical guidance (fallback)
     */
    private generateTechnicalGuidance;
    /**
     * Enhanced accessibility assessment using aesthetic optimization engine
     */
    private assessEnhancedAccessibility;
    /**
     * Convert numeric accessibility score to AccessibilityLevel enum
     */
    private scoreToAccessibilityLevel;
    /**
     * Simple accessibility assessment (fallback)
     */
    private assessAccessibility;
    private isNumericalType;
    private determineDataSize;
    private mapSkewnessToShape;
    private assessOutlierImpact;
    private determinePrimaryObjectives;
    private meetsQualityThreshold;
    private generateColumnWarnings;
    private getUniqueChartTypes;
    private countAccessibilityChecks;
    private calculateOverallConfidence;
    private createNumericalHistogramEncoding;
    private createBoxPlotEncoding;
    private createDensityPlotEncoding;
    private createCategoricalBarEncoding;
    private createPieChartEncoding;
    private createTreemapEncoding;
    private createTimeSeriesEncoding;
    private createBooleanBarEncoding;
    private createTextFrequencyEncoding;
    private createBasicInteractivity;
    private createAccessibilityGuidance;
    private createPerformanceConsiderations;
    private getLibraryRecommendations;
    private createNumericalDataPreparation;
    private createCategoricalDataPreparation;
    private createDateTimeDataPreparation;
    private createBooleanDataPreparation;
    private createTextDataPreparation;
    private createDesignGuidelines;
    private getDefaultColorScheme;
    private determineRelationshipType;
    private calculateVisualizationSuitability;
    private mapRelationshipType;
    private getVariableData;
    private createAdvancedInteractivity;
    private createBivariateDataPreparation;
    private createScatterPlotEncoding;
    private createRegressionPlotEncoding;
    private createGroupedBoxPlotEncoding;
    private createGroupedViolinEncoding;
    private createCategoricalHeatmapEncoding;
    private createMosaicPlotEncoding;
    private createViolinWithBoxEncoding;
    private detectAntiPatterns;
    private applyAntiPatternDetection;
    /**
     * Extract data characteristics for engine processing
     */
    static extractDataCharacteristics(section1Result: any, section3Result: any): any;
    /**
     * Generate sophisticated univariate recommendations
     */
    static generateSophisticatedUnivariateRecommendations(columnAnalysis: any, domainContext: any): any[];
    /**
     * Generate sophisticated bivariate recommendations
     */
    static generateSophisticatedBivariateRecommendations(correlation: any, domainContext: any): any[];
    /**
     * Generate sophisticated multivariate recommendations
     */
    static generateSophisticatedMultivariateRecommendations(dataCharacteristics: any, domainContext: any): any[];
    /**
     * Generate sophisticated dashboard recommendations
     */
    static generateSophisticatedDashboardRecommendations(domainContext: any): any[];
    /**
     * Generate enhanced technical guidance
     */
    static generateEnhancedTechnicalGuidance(dataCharacteristics: any): any;
    /**
     * Assess enhanced accessibility
     */
    static assessEnhancedAccessibility(aestheticProfile: any): any;
    /**
     * Generate domain aware strategy
     */
    static generateDomainAwareStrategy(domainContext: any): any;
    /**
     * Get unique chart types
     */
    static getUniqueChartTypes(recommendations: any[]): string[];
    /**
     * Count accessibility checks
     */
    static countAccessibilityChecks(aestheticProfile: any): number;
    /**
     * Calculate overall confidence
     */
    static calculateOverallConfidence(recommendations: any[]): number;
    /**
     * Determine interactivity from domain
     */
    static determineInteractivityFromDomain(domainContext: any): any;
    /**
     * Determine performance from data
     */
    static determinePerformanceFromData(dataCharacteristics: any): any;
    /**
     * Check if correlation is relevant for the detected domain
     */
    private static isDomainRelevantCorrelation;
    /**
     * Enhance correlation with domain-specific knowledge
     */
    private static enhanceCorrelationWithDomainKnowledge;
    /**
     * Generate correlation key for domain mapping
     */
    private static generateCorrelationKey;
    /**
     * Get educational implications for correlation
     */
    private static getEducationalImplications;
    /**
     * Get intervention opportunities for correlation
     */
    private static getInterventionOpportunities;
    /**
     * Create sophisticated bivariate profile using all engines
     */
    private static createSophisticatedBivariateProfile;
    /**
     * Generate sophisticated bivariate chart recommendations using domain context
     */
    private static generateSophisticatedBivariateChartRecommendations;
    /**
     * Create sophisticated column profile using all engines
     */
    private static createSophisticatedColumnProfile;
    /**
     * Generate sophisticated column chart recommendations
     */
    private static generateSophisticatedColumnChartRecommendations;
    private static optimizeChartRecommendationsForPerformance;
    private static createEnhancedScatterPlotEncoding;
    private static createEnhancedDistributionCharacteristics;
    private static enhanceEncodingWithAesthetics;
    private static createEnhancedDesignGuidelines;
    private static generateDomainSpecificGuidance;
    private static generateSophisticatedColumnWarnings;
    private static generateColumnDomainContext;
    private static inferColumnSemanticMeaning;
    private static getDomainSpecificConsiderations;
    private static createSophisticatedBivariateDataPreparation;
    private static createVisualizationSpecs;
    private static extractKeyMetricsFromDomain;
    private static generateDomainAlerts;
    private static generatePerformanceStrategy;
    private static generateAestheticImplementationGuidance;
    private static getSophisticatedImplementationPatterns;
    private static generateSophisticatedCodeExamples;
    private static generateAdvancedBestPractices;
    private static getAdvancedCommonPitfalls;
    private static calculateAssistiveTechnologyScore;
    private static getVariableData;
    private static mapRelationshipType;
    private static isNumericalType;
    private static createAdvancedInteractivity;
    private static createAccessibilityGuidance;
    private static createPerformanceConsiderations;
    private static generateSimpleColumnChartRecommendations;
    private static createBivariateDataPreparation;
    /**
     * Get optimal chart type based on data type and characteristics
     */
    private static getOptimalChartForDataType;
    private static createBasicScatterPlotEncoding;
    private static mapSkewnessToShape;
    private static assessOutlierImpact;
    private static createDesignGuidelines;
    private static generateColumnWarnings;
}
//# sourceMappingURL=section4-analyzer.d.ts.map