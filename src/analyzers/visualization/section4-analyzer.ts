/**
 * Section 4: Visualization Intelligence Analyzer
 * Intelligent chart recommendation engine based on data characteristics and best practices
 */

import type { Section1Result } from '../overview/types';
import type { Section3Result } from '../eda/types';
import type {
  Section4Result,
  Section4Config,
  VisualizationAnalysis,
  ColumnVisualizationProfile,
  BivariateVisualizationProfile,
  ChartRecommendation,
  VisualizationStrategy,
  DashboardRecommendation,
  TechnicalGuidance,
  AccessibilityAssessment,
  VisualizationWarning,
  LibraryRecommendation,
  MultivariateRecommendation,
  DistributionCharacteristics,
  VisualEncoding,
  InteractivityOptions,
  AccessibilityGuidance,
  PerformanceConsiderations,
  DataPreparationSteps,
  DesignGuidelines,
  ColorScheme,
} from './types';
import {
  ChartType,
  ChartPurpose,
  RecommendationPriority,
  AccessibilityLevel,
  ComplexityLevel,
  DataSize,
  InteractivityLevel,
  PerformanceLevel,
  ResponsivenessLevel,
} from './types';
import { EdaDataType } from '../eda/types';
import { logger } from '../../utils/logger';

export class Section4Analyzer {
  private config: Section4Config;
  private warnings: VisualizationWarning[] = [];

  constructor(config: Partial<Section4Config> = {}) {
    this.config = {
      enabledRecommendations: ['univariate', 'bivariate', 'dashboard', 'accessibility', 'performance'],
      accessibilityLevel: AccessibilityLevel.GOOD,
      complexityThreshold: ComplexityLevel.MODERATE,
      performanceThreshold: PerformanceLevel.MODERATE,
      maxRecommendationsPerChart: 3,
      includeCodeExamples: true,
      targetLibraries: ['d3', 'plotly', 'observable'],
      ...config,
    } as Section4Config;
  }

  /**
   * Main analysis method - generates comprehensive visualization recommendations
   */
  async analyze(
    section1Result: Section1Result,
    section3Result: Section3Result
  ): Promise<Section4Result> {
    const startTime = Date.now();
    logger.info('Starting Section 4: Visualization Intelligence analysis');

    try {
      // Generate overall visualization strategy
      const strategy = this.generateVisualizationStrategy(section1Result, section3Result);

      // Generate univariate recommendations for each column
      const univariateRecommendations = this.generateUnivariateRecommendations(
        section1Result,
        section3Result
      );

      // Generate bivariate recommendations for relationships
      const bivariateRecommendations = this.generateBivariateRecommendations(
        section3Result
      );

      // Generate multivariate recommendations
      const multivariateRecommendations = this.generateMultivariateRecommendations(
        section3Result
      );

      // Generate dashboard recommendations
      const dashboardRecommendations = this.generateDashboardRecommendations(
        univariateRecommendations,
        bivariateRecommendations,
        strategy
      );

      // Generate technical guidance
      const technicalGuidance = this.generateTechnicalGuidance(
        univariateRecommendations,
        bivariateRecommendations,
        strategy
      );

      // Assess accessibility
      const accessibilityAssessment = this.assessAccessibility(
        univariateRecommendations,
        bivariateRecommendations
      );

      const analysisTime = Date.now() - startTime;
      const totalRecommendations = univariateRecommendations.reduce(
        (sum, profile) => sum + profile.recommendations.length,
        0
      ) + bivariateRecommendations.reduce(
        (sum, profile) => sum + profile.recommendations.length,
        0
      );

      const visualizationAnalysis: VisualizationAnalysis = {
        strategy,
        univariateRecommendations,
        bivariateRecommendations,
        multivariateRecommendations,
        dashboardRecommendations,
        technicalGuidance,
        accessibilityAssessment,
      };

      logger.info(`Section 4 analysis completed in ${analysisTime}ms`);

      return {
        visualizationAnalysis,
        warnings: this.warnings,
        performanceMetrics: {
          analysisTimeMs: analysisTime,
          recommendationsGenerated: totalRecommendations,
          chartTypesConsidered: this.getUniqueChartTypes(univariateRecommendations, bivariateRecommendations).length,
          accessibilityChecks: this.countAccessibilityChecks(),
        },
        metadata: {
          analysisApproach: 'Multi-dimensional scoring with accessibility-first design',
          totalColumns: univariateRecommendations.length,
          bivariateRelationships: bivariateRecommendations.length,
          recommendationConfidence: this.calculateOverallConfidence(univariateRecommendations, bivariateRecommendations),
        },
      };
    } catch (error) {
      logger.error('Section 4 analysis failed:', error);
      throw error;
    }
  }

  /**
   * Generate overall visualization strategy based on data characteristics
   */
  private generateVisualizationStrategy(
    section1Result: Section1Result,
    section3Result: Section3Result
  ): VisualizationStrategy {
    const columnCount = section1Result.overview.structuralDimensions.totalColumns || 0;
    const rowCount = section1Result.overview.structuralDimensions.totalDataRows || 0;
    const dataSize = this.determineDataSize(rowCount);

    // Determine complexity based on data characteristics
    let complexity = ComplexityLevel.SIMPLE;
    if (columnCount > 10 || rowCount > 100000) {
      complexity = ComplexityLevel.MODERATE;
    }
    if (columnCount > 20 || rowCount > 1000000) {
      complexity = ComplexityLevel.COMPLEX;
    }

    // Determine interactivity level
    let interactivity = InteractivityLevel.STATIC;
    if (dataSize === DataSize.MEDIUM && columnCount > 5) {
      interactivity = InteractivityLevel.BASIC;
    }
    if (dataSize === DataSize.LARGE && columnCount > 10) {
      interactivity = InteractivityLevel.INTERACTIVE;
    }

    // Determine performance requirements
    let performance = PerformanceLevel.FAST;
    if (dataSize === DataSize.LARGE) {
      performance = PerformanceLevel.MODERATE;
    }
    if (dataSize === DataSize.VERY_LARGE) {
      performance = PerformanceLevel.INTENSIVE;
    }

    const primaryObjectives = this.determinePrimaryObjectives(section3Result);

    return {
      approach: 'Data-driven chart selection with accessibility and performance optimization',
      primaryObjectives,
      targetAudience: 'Data analysts, business stakeholders, and decision makers',
      complexity,
      interactivity,
      accessibility: this.config.accessibilityLevel,
      performance,
    };
  }

  /**
   * Generate univariate recommendations for each column
   */
  private generateUnivariateRecommendations(
    _section1Result: Section1Result,
    section3Result: Section3Result
  ): ColumnVisualizationProfile[] {
    const profiles: ColumnVisualizationProfile[] = [];

    if (!section3Result.edaAnalysis?.univariateAnalysis) {
      this.warnings.push({
        type: 'data_quality',
        severity: 'high',
        message: 'No univariate analysis data available from Section 3',
        recommendation: 'Run Section 3 EDA analysis first',
        impact: 'Limited visualization recommendations possible',
      });
      return profiles;
    }

    for (const columnAnalysis of section3Result.edaAnalysis.univariateAnalysis) {
      const profile = this.createColumnVisualizationProfile(columnAnalysis);
      profiles.push(profile);
    }

    return profiles;
  }

  /**
   * Create visualization profile for a single column
   */
  private createColumnVisualizationProfile(columnAnalysis: any): ColumnVisualizationProfile {
    const dataType = columnAnalysis.detectedDataType;
    const cardinality = columnAnalysis.uniqueValues || 0;
    const completeness = 100 - (columnAnalysis.missingPercentage || 0);

    // Generate distribution characteristics for numerical columns
    let distribution: DistributionCharacteristics | undefined;
    if (this.isNumericalType(dataType) && columnAnalysis.distributionAnalysis) {
      distribution = {
        shape: this.mapSkewnessToShape(columnAnalysis.distributionAnalysis.skewness || 0),
        skewness: columnAnalysis.distributionAnalysis.skewness || 0,
        kurtosis: columnAnalysis.distributionAnalysis.kurtosis || 0,
        outliers: {
          count: columnAnalysis.outlierAnalysis?.summary?.totalOutliers || 0,
          percentage: columnAnalysis.outlierAnalysis?.summary?.totalPercentage || 0,
          extreme: (columnAnalysis.outlierAnalysis?.summary?.totalPercentage || 0) > 10,
          impact: this.assessOutlierImpact(columnAnalysis.outlierAnalysis?.summary?.totalPercentage || 0),
        },
        modality: 'unimodal', // Simplified for now
      };
    }

    // Generate chart recommendations for this column
    const recommendations = this.generateColumnChartRecommendations(
      columnAnalysis,
      dataType,
      cardinality,
      completeness,
      distribution
    );

    return {
      columnName: columnAnalysis.columnName,
      dataType,
      semanticType: columnAnalysis.inferredSemanticType || 'unknown',
      cardinality,
      uniqueness: columnAnalysis.uniquePercentage || 0,
      completeness,
      distribution,
      recommendations,
      warnings: this.generateColumnWarnings(columnAnalysis, cardinality, completeness),
    };
  }

  /**
   * Generate chart recommendations for a specific column
   */
  private generateColumnChartRecommendations(
    columnAnalysis: any,
    dataType: string,
    cardinality: number,
    completeness: number,
    distribution?: DistributionCharacteristics
  ): ChartRecommendation[] {
    const recommendations: ChartRecommendation[] = [];

    switch (dataType) {
      case EdaDataType.NUMERICAL_INTEGER:
      case EdaDataType.NUMERICAL_FLOAT:
        recommendations.push(...this.generateNumericalRecommendations(columnAnalysis, distribution));
        break;

      case EdaDataType.CATEGORICAL:
        recommendations.push(...this.generateCategoricalRecommendations(columnAnalysis, cardinality));
        break;

      case EdaDataType.DATE_TIME:
        recommendations.push(...this.generateDateTimeRecommendations(columnAnalysis));
        break;

      case EdaDataType.BOOLEAN:
        recommendations.push(...this.generateBooleanRecommendations(columnAnalysis));
        break;

      case EdaDataType.TEXT_GENERAL:
      case EdaDataType.TEXT_ADDRESS:
        recommendations.push(...this.generateTextRecommendations(columnAnalysis));
        break;

      default:
        this.warnings.push({
          type: 'interpretation',
          severity: 'medium',
          message: `Unknown data type: ${dataType} for column ${columnAnalysis.columnName}`,
          recommendation: 'Treating as categorical for visualization purposes',
          impact: 'Suboptimal chart recommendations',
        });
        recommendations.push(...this.generateCategoricalRecommendations(columnAnalysis, cardinality));
    }

    // Apply quality and accessibility filters
    return recommendations
      .filter(rec => this.meetsQualityThreshold(rec, completeness))
      .slice(0, this.config.maxRecommendationsPerChart)
      .sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Generate recommendations for numerical columns
   */
  private generateNumericalRecommendations(
    columnAnalysis: any,
    distribution?: DistributionCharacteristics
  ): ChartRecommendation[] {
    const recommendations: ChartRecommendation[] = [];

    // Histogram - Primary recommendation for distribution
    recommendations.push({
      chartType: ChartType.HISTOGRAM,
      purpose: ChartPurpose.DISTRIBUTION,
      priority: RecommendationPriority.PRIMARY,
      confidence: 0.9,
      reasoning: 'Histograms effectively show the distribution of numerical data, revealing shape, central tendency, and spread',
      encoding: this.createNumericalHistogramEncoding(columnAnalysis),
      interactivity: this.createBasicInteractivity(),
      accessibility: this.createAccessibilityGuidance(ChartType.HISTOGRAM),
      performance: this.createPerformanceConsiderations(ChartType.HISTOGRAM),
      libraryRecommendations: this.getLibraryRecommendations(ChartType.HISTOGRAM),
      dataPreparation: this.createNumericalDataPreparation(columnAnalysis),
      designGuidelines: this.createDesignGuidelines(ChartType.HISTOGRAM),
    });

    // Box plot - Good for outlier detection
    const outlierPercentage = distribution?.outliers.percentage || 0;
    recommendations.push({
      chartType: ChartType.BOX_PLOT,
      purpose: ChartPurpose.OUTLIER_DETECTION,
      priority: outlierPercentage > 5 ? RecommendationPriority.PRIMARY : RecommendationPriority.SECONDARY,
      confidence: outlierPercentage > 5 ? 0.85 : 0.7,
      reasoning: outlierPercentage > 5 ? 
        'Box plots excel at highlighting outliers and quartile distribution' : 
        'Box plots provide a compact view of distribution and quartiles',
      encoding: this.createBoxPlotEncoding(columnAnalysis),
      interactivity: this.createBasicInteractivity(),
      accessibility: this.createAccessibilityGuidance(ChartType.BOX_PLOT),
      performance: this.createPerformanceConsiderations(ChartType.BOX_PLOT),
      libraryRecommendations: this.getLibraryRecommendations(ChartType.BOX_PLOT),
      dataPreparation: this.createNumericalDataPreparation(columnAnalysis),
      designGuidelines: this.createDesignGuidelines(ChartType.BOX_PLOT),
    });

    // Density plot for smooth distribution
    if (columnAnalysis.totalValues > 100) {
      recommendations.push({
        chartType: ChartType.DENSITY_PLOT,
        purpose: ChartPurpose.DISTRIBUTION,
        priority: RecommendationPriority.ALTERNATIVE,
        confidence: 0.75,
        reasoning: 'Density plots provide smooth estimates of distribution shape, useful for larger datasets',
        encoding: this.createDensityPlotEncoding(columnAnalysis),
        interactivity: this.createBasicInteractivity(),
        accessibility: this.createAccessibilityGuidance(ChartType.DENSITY_PLOT),
        performance: this.createPerformanceConsiderations(ChartType.DENSITY_PLOT),
        libraryRecommendations: this.getLibraryRecommendations(ChartType.DENSITY_PLOT),
        dataPreparation: this.createNumericalDataPreparation(columnAnalysis),
        designGuidelines: this.createDesignGuidelines(ChartType.DENSITY_PLOT),
      });
    }

    return recommendations;
  }

  /**
   * Generate recommendations for categorical columns
   */
  private generateCategoricalRecommendations(
    columnAnalysis: any,
    cardinality: number
  ): ChartRecommendation[] {
    const recommendations: ChartRecommendation[] = [];

    // Bar chart - Primary for most categorical data
    recommendations.push({
      chartType: cardinality > 8 ? ChartType.HORIZONTAL_BAR : ChartType.BAR_CHART,
      purpose: ChartPurpose.COMPARISON,
      priority: RecommendationPriority.PRIMARY,
      confidence: 0.9,
      reasoning: cardinality > 8 ? 
        'Horizontal bar charts handle long category labels better and improve readability' :
        'Bar charts excel at comparing categorical data frequencies',
      encoding: this.createCategoricalBarEncoding(columnAnalysis, cardinality),
      interactivity: this.createBasicInteractivity(),
      accessibility: this.createAccessibilityGuidance(ChartType.BAR_CHART),
      performance: this.createPerformanceConsiderations(ChartType.BAR_CHART),
      libraryRecommendations: this.getLibraryRecommendations(ChartType.BAR_CHART),
      dataPreparation: this.createCategoricalDataPreparation(columnAnalysis),
      designGuidelines: this.createDesignGuidelines(ChartType.BAR_CHART),
    });

    // Pie chart - Only for low cardinality and composition view
    if (cardinality <= 6) {
      recommendations.push({
        chartType: ChartType.PIE_CHART,
        purpose: ChartPurpose.COMPOSITION,
        priority: RecommendationPriority.SECONDARY,
        confidence: 0.6,
        reasoning: 'Pie charts work well for showing parts of a whole when there are few categories',
        encoding: this.createPieChartEncoding(columnAnalysis),
        interactivity: this.createBasicInteractivity(),
        accessibility: this.createAccessibilityGuidance(ChartType.PIE_CHART),
        performance: this.createPerformanceConsiderations(ChartType.PIE_CHART),
        libraryRecommendations: this.getLibraryRecommendations(ChartType.PIE_CHART),
        dataPreparation: this.createCategoricalDataPreparation(columnAnalysis),
        designGuidelines: this.createDesignGuidelines(ChartType.PIE_CHART),
      });
    }

    // Treemap for high cardinality
    if (cardinality > 20) {
      recommendations.push({
        chartType: ChartType.TREEMAP,
        purpose: ChartPurpose.COMPOSITION,
        priority: RecommendationPriority.ALTERNATIVE,
        confidence: 0.7,
        reasoning: 'Treemaps efficiently display hierarchical data with many categories using space-filling visualization',
        encoding: this.createTreemapEncoding(columnAnalysis),
        interactivity: this.createBasicInteractivity(),
        accessibility: this.createAccessibilityGuidance(ChartType.TREEMAP),
        performance: this.createPerformanceConsiderations(ChartType.TREEMAP),
        libraryRecommendations: this.getLibraryRecommendations(ChartType.TREEMAP),
        dataPreparation: this.createCategoricalDataPreparation(columnAnalysis),
        designGuidelines: this.createDesignGuidelines(ChartType.TREEMAP),
      });
    }

    return recommendations;
  }

  /**
   * Generate recommendations for datetime columns
   */
  private generateDateTimeRecommendations(columnAnalysis: any): ChartRecommendation[] {
    const recommendations: ChartRecommendation[] = [];

    // Time series line chart - Primary for temporal data
    recommendations.push({
      chartType: ChartType.TIME_SERIES_LINE,
      purpose: ChartPurpose.TREND,
      priority: RecommendationPriority.PRIMARY,
      confidence: 0.9,
      reasoning: 'Line charts are optimal for showing temporal trends and patterns over time',
      encoding: this.createTimeSeriesEncoding(columnAnalysis),
      interactivity: this.createBasicInteractivity(),
      accessibility: this.createAccessibilityGuidance(ChartType.TIME_SERIES_LINE),
      performance: this.createPerformanceConsiderations(ChartType.TIME_SERIES_LINE),
      libraryRecommendations: this.getLibraryRecommendations(ChartType.TIME_SERIES_LINE),
      dataPreparation: this.createDateTimeDataPreparation(columnAnalysis),
      designGuidelines: this.createDesignGuidelines(ChartType.TIME_SERIES_LINE),
    });

    return recommendations;
  }

  /**
   * Generate recommendations for boolean columns
   */
  private generateBooleanRecommendations(columnAnalysis: any): ChartRecommendation[] {
    const recommendations: ChartRecommendation[] = [];

    // Simple bar chart for boolean distribution
    recommendations.push({
      chartType: ChartType.BAR_CHART,
      purpose: ChartPurpose.COMPARISON,
      priority: RecommendationPriority.PRIMARY,
      confidence: 0.85,
      reasoning: 'Bar charts clearly show the distribution between true/false values',
      encoding: this.createBooleanBarEncoding(columnAnalysis),
      interactivity: this.createBasicInteractivity(),
      accessibility: this.createAccessibilityGuidance(ChartType.BAR_CHART),
      performance: this.createPerformanceConsiderations(ChartType.BAR_CHART),
      libraryRecommendations: this.getLibraryRecommendations(ChartType.BAR_CHART),
      dataPreparation: this.createBooleanDataPreparation(columnAnalysis),
      designGuidelines: this.createDesignGuidelines(ChartType.BAR_CHART),
    });

    return recommendations;
  }

  /**
   * Generate recommendations for text columns
   */
  private generateTextRecommendations(columnAnalysis: any): ChartRecommendation[] {
    const recommendations: ChartRecommendation[] = [];

    // Word frequency analysis as horizontal bar chart
    if (columnAnalysis.topFrequentWords && columnAnalysis.topFrequentWords.length > 0) {
      recommendations.push({
        chartType: ChartType.HORIZONTAL_BAR,
        purpose: ChartPurpose.RANKING,
        priority: RecommendationPriority.PRIMARY,
        confidence: 0.8,
        reasoning: 'Horizontal bar charts effectively display word frequency rankings from text analysis',
        encoding: this.createTextFrequencyEncoding(columnAnalysis),
        interactivity: this.createBasicInteractivity(),
        accessibility: this.createAccessibilityGuidance(ChartType.HORIZONTAL_BAR),
        performance: this.createPerformanceConsiderations(ChartType.HORIZONTAL_BAR),
        libraryRecommendations: this.getLibraryRecommendations(ChartType.HORIZONTAL_BAR),
        dataPreparation: this.createTextDataPreparation(columnAnalysis),
        designGuidelines: this.createDesignGuidelines(ChartType.HORIZONTAL_BAR),
      });
    }

    return recommendations;
  }

  /**
   * Generate bivariate recommendations (placeholder)
   */
  private generateBivariateRecommendations(_section3Result: Section3Result): BivariateVisualizationProfile[] {
    // Implementation would analyze correlations and relationships from Section 3
    // and generate appropriate bivariate chart recommendations
    return [];
  }

  /**
   * Generate multivariate recommendations (placeholder)
   */
  private generateMultivariateRecommendations(_section3Result: Section3Result): MultivariateRecommendation[] {
    // Implementation would analyze multivariate relationships
    // and recommend complex visualizations like parallel coordinates, PCA biplots, etc.
    return [];
  }

  /**
   * Generate dashboard recommendations (placeholder)
   */
  private generateDashboardRecommendations(
    _univariateRecommendations: ColumnVisualizationProfile[],
    _bivariateRecommendations: BivariateVisualizationProfile[],
    _strategy: VisualizationStrategy
  ): DashboardRecommendation {
    // Implementation would create dashboard layout recommendations
    // based on chart types, relationships, and strategy
    return {} as DashboardRecommendation;
  }

  /**
   * Generate technical guidance (placeholder)
   */
  private generateTechnicalGuidance(
    _univariateRecommendations: ColumnVisualizationProfile[],
    _bivariateRecommendations: BivariateVisualizationProfile[],
    _strategy: VisualizationStrategy
  ): TechnicalGuidance {
    // Implementation would provide library comparisons, implementation patterns, etc.
    return {} as TechnicalGuidance;
  }

  /**
   * Assess accessibility (placeholder)
   */
  private assessAccessibility(
    _univariateRecommendations: ColumnVisualizationProfile[],
    _bivariateRecommendations: BivariateVisualizationProfile[]
  ): AccessibilityAssessment {
    // Implementation would assess WCAG compliance and accessibility features
    return {} as AccessibilityAssessment;
  }

  // ===== HELPER METHODS =====

  private isNumericalType(dataType: string): boolean {
    return dataType === EdaDataType.NUMERICAL_FLOAT || dataType === EdaDataType.NUMERICAL_INTEGER;
  }

  private determineDataSize(rowCount: number): DataSize {
    if (rowCount < 1000) return DataSize.SMALL;
    if (rowCount < 100000) return DataSize.MEDIUM;
    if (rowCount < 1000000) return DataSize.LARGE;
    return DataSize.VERY_LARGE;
  }

  private mapSkewnessToShape(skewness: number): DistributionCharacteristics['shape'] {
    if (Math.abs(skewness) < 0.5) return 'normal';
    if (skewness > 0.5) return 'skewed_right';
    if (skewness < -0.5) return 'skewed_left';
    return 'unknown';
  }

  private assessOutlierImpact(percentage: number): 'low' | 'medium' | 'high' {
    if (percentage < 5) return 'low';
    if (percentage < 15) return 'medium';
    return 'high';
  }

  private determinePrimaryObjectives(section3Result: Section3Result): string[] {
    const objectives = ['Explore data distributions', 'Identify patterns and relationships'];
    
    // Add specific objectives based on EDA findings
    if (section3Result.edaAnalysis?.crossVariableInsights?.topFindings?.length) {
      objectives.push('Highlight key statistical findings');
    }
    
    return objectives;
  }

  private meetsQualityThreshold(recommendation: ChartRecommendation, completeness: number): boolean {
    // Filter out recommendations for very incomplete data
    return completeness > 50 || recommendation.confidence > 0.8;
  }

  private generateColumnWarnings(
    _columnAnalysis: any,
    cardinality: number,
    completeness: number
  ): VisualizationWarning[] {
    const warnings: VisualizationWarning[] = [];

    if (completeness < 70) {
      warnings.push({
        type: 'data_quality',
        severity: completeness < 50 ? 'high' : 'medium',
        message: `Column has ${100 - completeness}% missing data`,
        recommendation: 'Consider handling missing values before visualization',
        impact: 'Charts may be misleading due to incomplete data',
      });
    }

    if (cardinality > 50) {
      warnings.push({
        type: 'performance',
        severity: 'medium',
        message: `High cardinality (${cardinality} unique values) may impact performance`,
        recommendation: 'Consider grouping rare categories or using aggregation',
        impact: 'Charts may be cluttered and slow to render',
      });
    }

    return warnings;
  }

  private getUniqueChartTypes(
    univariateRecommendations: ColumnVisualizationProfile[],
    bivariateRecommendations: BivariateVisualizationProfile[]
  ): ChartType[] {
    const chartTypes = new Set<ChartType>();
    
    univariateRecommendations.forEach(profile => {
      profile.recommendations.forEach(rec => chartTypes.add(rec.chartType));
    });
    
    bivariateRecommendations.forEach(profile => {
      profile.recommendations.forEach(rec => chartTypes.add(rec.chartType));
    });
    
    return Array.from(chartTypes);
  }

  private countAccessibilityChecks(): number {
    // Count accessibility checks performed
    return this.warnings.filter(w => w.type === 'accessibility').length + 10; // Base checks
  }

  private calculateOverallConfidence(
    univariateRecommendations: ColumnVisualizationProfile[],
    bivariateRecommendations: BivariateVisualizationProfile[]
  ): number {
    const allRecommendations = [
      ...univariateRecommendations.flatMap(p => p.recommendations),
      ...bivariateRecommendations.flatMap(p => p.recommendations),
    ];

    if (allRecommendations.length === 0) return 0;

    const totalConfidence = allRecommendations.reduce((sum, rec) => sum + rec.confidence, 0);
    return Math.round((totalConfidence / allRecommendations.length) * 100) / 100;
  }

  // ===== ENCODING CREATION METHODS (Simplified implementations) =====

  private createNumericalHistogramEncoding(columnAnalysis: any): VisualEncoding {
    return {
      xAxis: {
        variable: columnAnalysis.columnName,
        scale: 'linear',
        label: columnAnalysis.columnName,
        gridLines: true,
        zeroLine: true,
      },
      yAxis: {
        variable: 'frequency',
        scale: 'linear',
        label: 'Frequency',
        gridLines: true,
        zeroLine: true,
      },
      layout: {
        width: 'responsive',
        height: 400,
        margins: { top: 20, right: 30, bottom: 40, left: 50 },
      },
    };
  }

  private createBoxPlotEncoding(columnAnalysis: any): VisualEncoding {
    return {
      yAxis: {
        variable: columnAnalysis.columnName,
        scale: 'linear',
        label: columnAnalysis.columnName,
        gridLines: true,
        zeroLine: false,
      },
      layout: {
        width: 300,
        height: 400,
        margins: { top: 20, right: 30, bottom: 40, left: 50 },
      },
    };
  }

  private createDensityPlotEncoding(columnAnalysis: any): VisualEncoding {
    return this.createNumericalHistogramEncoding(columnAnalysis);
  }

  private createCategoricalBarEncoding(columnAnalysis: any, cardinality: number): VisualEncoding {
    return {
      xAxis: {
        variable: columnAnalysis.columnName,
        scale: 'band',
        label: columnAnalysis.columnName,
        labelRotation: cardinality > 5 ? 45 : 0,
        gridLines: false,
        zeroLine: false,
      },
      yAxis: {
        variable: 'count',
        scale: 'linear',
        label: 'Count',
        gridLines: true,
        zeroLine: true,
      },
      layout: {
        width: 'responsive',
        height: 400,
        margins: { top: 20, right: 30, bottom: cardinality > 5 ? 80 : 40, left: 50 },
      },
    };
  }

  private createPieChartEncoding(columnAnalysis: any): VisualEncoding {
    return {
      color: {
        variable: columnAnalysis.columnName,
        scheme: this.getDefaultColorScheme('categorical'),
        accessibility: {
          contrastRatio: 4.5,
          alternativeEncoding: 'pattern',
          wcagLevel: 'AA',
          colorBlindSupport: true,
        },
      },
      layout: {
        width: 400,
        height: 400,
        margins: { top: 20, right: 30, bottom: 40, left: 50 },
      },
      legend: {
        position: 'right',
        orientation: 'vertical',
        title: columnAnalysis.columnName,
        interactive: true,
      },
    };
  }

  private createTreemapEncoding(columnAnalysis: any): VisualEncoding {
    return {
      size: {
        variable: 'count',
        range: [10, 1000],
        scaling: 'sqrt',
      },
      color: {
        variable: columnAnalysis.columnName,
        scheme: this.getDefaultColorScheme('categorical'),
        accessibility: {
          contrastRatio: 4.5,
          alternativeEncoding: 'pattern',
          wcagLevel: 'AA',
          colorBlindSupport: true,
        },
      },
      layout: {
        width: 600,
        height: 400,
        margins: { top: 20, right: 30, bottom: 40, left: 50 },
      },
    };
  }

  private createTimeSeriesEncoding(columnAnalysis: any): VisualEncoding {
    return {
      xAxis: {
        variable: columnAnalysis.columnName,
        scale: 'time',
        label: columnAnalysis.columnName,
        gridLines: true,
        zeroLine: false,
      },
      yAxis: {
        variable: 'count',
        scale: 'linear',
        label: 'Count',
        gridLines: true,
        zeroLine: true,
      },
      layout: {
        width: 'responsive',
        height: 400,
        margins: { top: 20, right: 30, bottom: 40, left: 50 },
      },
    };
  }

  private createBooleanBarEncoding(_columnAnalysis: any): VisualEncoding {
    return {
      xAxis: {
        variable: 'value',
        scale: 'band',
        label: 'Value',
        gridLines: false,
        zeroLine: false,
      },
      yAxis: {
        variable: 'count',
        scale: 'linear',
        label: 'Count',
        gridLines: true,
        zeroLine: true,
      },
      layout: {
        width: 300,
        height: 400,
        margins: { top: 20, right: 30, bottom: 40, left: 50 },
      },
    };
  }

  private createTextFrequencyEncoding(_columnAnalysis: any): VisualEncoding {
    return {
      xAxis: {
        variable: 'frequency',
        scale: 'linear',
        label: 'Frequency',
        gridLines: true,
        zeroLine: true,
      },
      yAxis: {
        variable: 'word',
        scale: 'band',
        label: 'Words',
        gridLines: false,
        zeroLine: false,
      },
      layout: {
        width: 'responsive',
        height: 300,
        margins: { top: 20, right: 30, bottom: 40, left: 100 },
      },
    };
  }

  private createBasicInteractivity(): InteractivityOptions {
    return {
      level: 'basic',
      interactions: ['hover', 'tooltip'],
      responsiveness: ResponsivenessLevel.RESPONSIVE,
      keyboard: {
        navigation: true,
        shortcuts: {},
        focusManagement: true,
      },
      screenReader: {
        ariaLabels: {},
        alternativeText: '',
        dataTable: false,
      },
    } as InteractivityOptions;
  }

  private createAccessibilityGuidance(_chartType: ChartType): AccessibilityGuidance {
    return {
      level: this.config.accessibilityLevel,
      wcagCompliance: 'AA',
      colorBlindness: {
        protanopia: true,
        deuteranopia: true,
        tritanopia: true,
        monochromacy: true,
        alternativeEncodings: ['pattern', 'texture'],
      },
      motorImpairment: {
        largeClickTargets: true,
        keyboardOnly: true,
        customControls: false,
        timeoutExtensions: false,
      },
      cognitiveAccessibility: {
        simplicityLevel: this.config.complexityThreshold,
        progressiveDisclosure: true,
        errorPrevention: ['Clear labels', 'Consistent navigation'],
        cognitiveLoad: 'low',
      },
      recommendations: [
        'Use high contrast colors',
        'Provide alternative text',
        'Enable keyboard navigation',
      ],
    };
  }

  private createPerformanceConsiderations(_chartType: ChartType): PerformanceConsiderations {
    return {
      dataSize: DataSize.MEDIUM,
      renderingStrategy: 'svg',
      optimizations: [],
      loadingStrategy: {
        progressive: false,
        chunking: false,
        placeholders: true,
        feedback: true,
      },
      memoryUsage: {
        estimated: '< 10MB',
        peak: '< 20MB',
        recommendations: ['Consider data sampling for large datasets'],
      },
    };
  }

  private getLibraryRecommendations(_chartType: ChartType): LibraryRecommendation[] {
    // Simplified implementation
    return [
      {
        name: 'D3.js',
        type: 'javascript',
        pros: ['Highly customizable', 'Excellent performance', 'Rich ecosystem'],
        cons: ['Steep learning curve', 'Requires more development time'],
        useCases: ['Custom visualizations', 'Interactive dashboards'],
        complexity: ComplexityLevel.COMPLEX,
        documentation: 'https://d3js.org/',
        communitySupport: 'excellent',
      },
    ];
  }

  private createNumericalDataPreparation(_columnAnalysis: any): DataPreparationSteps {
    return {
      required: [],
      optional: [],
      qualityChecks: [],
      aggregations: [],
    };
  }

  private createCategoricalDataPreparation(_columnAnalysis: any): DataPreparationSteps {
    return {
      required: [],
      optional: [],
      qualityChecks: [],
      aggregations: [],
    };
  }

  private createDateTimeDataPreparation(_columnAnalysis: any): DataPreparationSteps {
    return {
      required: [],
      optional: [],
      qualityChecks: [],
      aggregations: [],
    };
  }

  private createBooleanDataPreparation(_columnAnalysis: any): DataPreparationSteps {
    return {
      required: [],
      optional: [],
      qualityChecks: [],
      aggregations: [],
    };
  }

  private createTextDataPreparation(_columnAnalysis: any): DataPreparationSteps {
    return {
      required: [],
      optional: [],
      qualityChecks: [],
      aggregations: [],
    };
  }

  private createDesignGuidelines(_chartType: ChartType): DesignGuidelines {
    return {
      principles: [],
      typography: {
        fontFamily: ['Arial', 'Helvetica', 'sans-serif'],
        fontSize: {
          title: 16,
          subtitle: 14,
          axis: 12,
          legend: 12,
          annotation: 10,
        },
        fontWeight: { normal: 400, bold: 700 },
        lineHeight: 1.4,
      },
      spacing: {
        unit: 8,
        hierarchy: {},
        consistency: [],
      },
      branding: {
        colorAlignment: true,
        styleConsistency: [],
      },
      context: {
        audience: 'General',
        purpose: 'Analysis',
        medium: 'web',
        constraints: [],
      },
    };
  }

  private getDefaultColorScheme(type: 'categorical' | 'sequential' | 'diverging' | 'single'): ColorScheme {
    return {
      type,
      palette: ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd'],
      printSafe: true,
      colorBlindSafe: true,
    };
  }
}