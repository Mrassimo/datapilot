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
  CorrelationAnalysis,
  AntiPatternDetection,
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
  AntiPatternType,
  AntiPatternSeverity,
  RelationshipType,
} from './types';
import { EdaDataType } from '../eda/types';
import { logger } from '../../utils/logger';

export class Section4Analyzer {
  private config: Section4Config;
  private warnings: VisualizationWarning[] = [];
  private antiPatterns: AntiPatternDetection[] = [];

  constructor(config: Partial<Section4Config> = {}) {
    this.config = {
      enabledRecommendations: [
        'univariate',
        'bivariate',
        'dashboard',
        'accessibility',
        'performance',
      ],
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
    section3Result: Section3Result,
  ): Promise<Section4Result> {
    const startTime = Date.now();
    logger.info('Starting Section 4: Visualization Intelligence analysis');

    try {
      // Generate overall visualization strategy
      const strategy = this.generateVisualizationStrategy(section1Result, section3Result);

      // Generate univariate recommendations for each column
      const univariateRecommendations = this.generateUnivariateRecommendations(
        section1Result,
        section3Result,
      );

      // Generate bivariate recommendations for relationships
      const bivariateRecommendations = this.generateBivariateRecommendations(section3Result);

      // Generate multivariate recommendations
      const multivariateRecommendations = this.generateMultivariateRecommendations(section3Result);

      // Generate dashboard recommendations
      const dashboardRecommendations = this.generateDashboardRecommendations(
        univariateRecommendations,
        bivariateRecommendations,
        strategy,
      );

      // Generate technical guidance
      const technicalGuidance = this.generateTechnicalGuidance(
        univariateRecommendations,
        bivariateRecommendations,
        strategy,
      );

      // Assess accessibility
      const accessibilityAssessment = this.assessAccessibility(
        univariateRecommendations,
        bivariateRecommendations,
      );

      const analysisTime = Date.now() - startTime;
      const totalRecommendations =
        univariateRecommendations.reduce(
          (sum, profile) => sum + profile.recommendations.length,
          0,
        ) +
        bivariateRecommendations.reduce((sum, profile) => sum + profile.recommendations.length, 0);

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
          chartTypesConsidered: this.getUniqueChartTypes(
            univariateRecommendations,
            bivariateRecommendations,
          ).length,
          accessibilityChecks: this.countAccessibilityChecks(),
        },
        metadata: {
          analysisApproach: 'Multi-dimensional scoring with accessibility-first design',
          totalColumns: univariateRecommendations.length,
          bivariateRelationships: bivariateRecommendations.length,
          recommendationConfidence: this.calculateOverallConfidence(
            univariateRecommendations,
            bivariateRecommendations,
          ),
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
    section3Result: Section3Result,
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
    section3Result: Section3Result,
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
          impact: this.assessOutlierImpact(
            columnAnalysis.outlierAnalysis?.summary?.totalPercentage || 0,
          ),
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
      distribution,
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
    distribution?: DistributionCharacteristics,
  ): ChartRecommendation[] {
    const recommendations: ChartRecommendation[] = [];

    switch (dataType) {
      case EdaDataType.NUMERICAL_INTEGER:
      case EdaDataType.NUMERICAL_FLOAT:
        recommendations.push(
          ...this.generateNumericalRecommendations(columnAnalysis, distribution),
        );
        break;

      case EdaDataType.CATEGORICAL:
        recommendations.push(
          ...this.generateCategoricalRecommendations(columnAnalysis, cardinality),
        );
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
        recommendations.push(
          ...this.generateCategoricalRecommendations(columnAnalysis, cardinality),
        );
    }

    // Apply quality, accessibility filters, and anti-pattern detection
    const filteredRecommendations = recommendations.filter((rec) =>
      this.meetsQualityThreshold(rec, completeness),
    );

    const enhancedRecommendations = this.applyAntiPatternDetection(filteredRecommendations, {
      cardinality,
      completeness,
      dataType,
    });

    return enhancedRecommendations
      .slice(0, this.config.maxRecommendationsPerChart)
      .sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Generate recommendations for numerical columns
   */
  private generateNumericalRecommendations(
    columnAnalysis: any,
    distribution?: DistributionCharacteristics,
  ): ChartRecommendation[] {
    const recommendations: ChartRecommendation[] = [];

    // Histogram - Primary recommendation for distribution
    recommendations.push({
      chartType: ChartType.HISTOGRAM,
      purpose: ChartPurpose.DISTRIBUTION,
      priority: RecommendationPriority.PRIMARY,
      confidence: 0.9,
      reasoning:
        'Histograms effectively show the distribution of numerical data, revealing shape, central tendency, and spread',
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
      priority:
        outlierPercentage > 5 ? RecommendationPriority.PRIMARY : RecommendationPriority.SECONDARY,
      confidence: outlierPercentage > 5 ? 0.85 : 0.7,
      reasoning:
        outlierPercentage > 5
          ? 'Box plots excel at highlighting outliers and quartile distribution'
          : 'Box plots provide a compact view of distribution and quartiles',
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
        reasoning:
          'Density plots provide smooth estimates of distribution shape, useful for larger datasets',
        encoding: this.createDensityPlotEncoding(columnAnalysis),
        interactivity: this.createBasicInteractivity(),
        accessibility: this.createAccessibilityGuidance(ChartType.DENSITY_PLOT),
        performance: this.createPerformanceConsiderations(ChartType.DENSITY_PLOT),
        libraryRecommendations: this.getLibraryRecommendations(ChartType.DENSITY_PLOT),
        dataPreparation: this.createNumericalDataPreparation(columnAnalysis),
        designGuidelines: this.createDesignGuidelines(ChartType.DENSITY_PLOT),
      });
    }

    // Enhanced Violin Plot with Embedded Box Plot (per specification)
    if (columnAnalysis.totalValues > 200) {
      const priority =
        distribution && distribution.outliers.impact === 'high'
          ? RecommendationPriority.PRIMARY
          : RecommendationPriority.SECONDARY;

      recommendations.push({
        chartType: ChartType.VIOLIN_WITH_BOX,
        purpose: ChartPurpose.DISTRIBUTION,
        priority,
        confidence: 0.88,
        reasoning:
          'Violin plot with embedded box plot provides rich distributional comparison showing probability density, median, quartiles, and outliers simultaneously',
        encoding: this.createViolinWithBoxEncoding(columnAnalysis),
        interactivity: this.createAdvancedInteractivity(),
        accessibility: this.createAccessibilityGuidance(ChartType.VIOLIN_WITH_BOX),
        performance: this.createPerformanceConsiderations(ChartType.VIOLIN_WITH_BOX),
        libraryRecommendations: this.getLibraryRecommendations(ChartType.VIOLIN_WITH_BOX),
        dataPreparation: this.createNumericalDataPreparation(columnAnalysis),
        designGuidelines: this.createDesignGuidelines(ChartType.VIOLIN_WITH_BOX),
      });
    }

    return recommendations;
  }

  /**
   * Generate recommendations for categorical columns
   */
  private generateCategoricalRecommendations(
    columnAnalysis: any,
    cardinality: number,
  ): ChartRecommendation[] {
    const recommendations: ChartRecommendation[] = [];

    // Bar chart - Primary for most categorical data
    recommendations.push({
      chartType: cardinality > 8 ? ChartType.HORIZONTAL_BAR : ChartType.BAR_CHART,
      purpose: ChartPurpose.COMPARISON,
      priority: RecommendationPriority.PRIMARY,
      confidence: 0.9,
      reasoning:
        cardinality > 8
          ? 'Horizontal bar charts handle long category labels better and improve readability'
          : 'Bar charts excel at comparing categorical data frequencies',
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
        reasoning:
          'Pie charts work well for showing parts of a whole when there are few categories',
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
        reasoning:
          'Treemaps efficiently display hierarchical data with many categories using space-filling visualization',
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
        reasoning:
          'Horizontal bar charts effectively display word frequency rankings from text analysis',
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
   * Generate bivariate recommendations with correlation analysis
   */
  private generateBivariateRecommendations(
    section3Result: Section3Result,
  ): BivariateVisualizationProfile[] {
    const profiles: BivariateVisualizationProfile[] = [];

    if (!section3Result.edaAnalysis?.bivariateAnalysis?.numericalVsNumerical?.correlationPairs) {
      logger.info('No correlation data available for bivariate analysis');
      return profiles;
    }

    // Extract correlation data from Section 3 results
    const correlations = this.extractCorrelations(section3Result);

    // Filter for significant correlations (|r| > 0.3 and p < 0.05)
    const significantCorrelations = correlations.filter(
      (corr) => Math.abs(corr.strength) > 0.3 && corr.significance < 0.05,
    );

    // Generate recommendations for each significant correlation
    for (const correlation of significantCorrelations) {
      const profile = this.createBivariateProfile(correlation, section3Result);
      if (profile) {
        profiles.push(profile);
      }
    }

    // Sort by correlation strength (descending)
    profiles.sort((a, b) => Math.abs(b.strength) - Math.abs(a.strength));

    return profiles.slice(0, 10); // Limit to top 10 relationships
  }

  /**
   * Extract correlation data from Section 3 results
   */
  private extractCorrelations(section3Result: Section3Result): CorrelationAnalysis[] {
    const correlations: CorrelationAnalysis[] = [];
    const correlationPairs =
      section3Result.edaAnalysis?.bivariateAnalysis?.numericalVsNumerical?.correlationPairs;

    if (!correlationPairs) {
      return correlations;
    }

    // Parse correlation pairs to extract pairwise correlations
    for (const correlation of correlationPairs) {
      const analysis: CorrelationAnalysis = {
        variable1: correlation.variable1,
        variable2: correlation.variable2,
        correlationType: 'pearson', // Default from Section 3
        strength: correlation.correlation,
        significance: correlation.pValue || 0.05,
        confidenceInterval: [correlation.correlation - 0.1, correlation.correlation + 0.1],
        relationshipType: this.determineRelationshipType(correlation.correlation),
        visualizationSuitability: this.calculateVisualizationSuitability(correlation),
      };

      correlations.push(analysis);
    }

    return correlations;
  }

  /**
   * Create bivariate visualization profile for a correlation
   */
  private createBivariateProfile(
    correlation: CorrelationAnalysis,
    section3Result: Section3Result,
  ): BivariateVisualizationProfile | null {
    // Get data types for both variables
    const var1Data = this.getVariableData(correlation.variable1, section3Result);
    const var2Data = this.getVariableData(correlation.variable2, section3Result);

    if (!var1Data || !var2Data) {
      return null;
    }

    // Generate chart recommendations based on data types and correlation
    const recommendations = this.generateBivariateChartRecommendations(
      correlation,
      var1Data,
      var2Data,
    );

    return {
      variable1: correlation.variable1,
      variable2: correlation.variable2,
      relationshipType: this.mapRelationshipType(
        var1Data.dataType,
        var2Data.dataType,
        correlation.relationshipType,
      ),
      strength: correlation.strength,
      significance: correlation.significance,
      recommendations,
      dataPreparation: this.createBivariateDataPreparation(),
    };
  }

  /**
   * Generate chart recommendations for bivariate relationships
   */
  private generateBivariateChartRecommendations(
    correlation: CorrelationAnalysis,
    var1Data: any,
    var2Data: any,
  ): ChartRecommendation[] {
    const recommendations: ChartRecommendation[] = [];

    const isVar1Numerical = this.isNumericalType(var1Data.dataType);
    const isVar2Numerical = this.isNumericalType(var2Data.dataType);
    const isVar1Categorical = var1Data.dataType === EdaDataType.CATEGORICAL;
    const isVar2Categorical = var2Data.dataType === EdaDataType.CATEGORICAL;

    // Numerical vs Numerical - Scatter plot with correlation
    if (isVar1Numerical && isVar2Numerical) {
      recommendations.push({
        chartType: ChartType.SCATTER_PLOT,
        purpose: ChartPurpose.RELATIONSHIP,
        priority: RecommendationPriority.PRIMARY,
        confidence: 0.9,
        reasoning: `Scatter plot ideal for showing ${correlation.relationshipType.replace('_', ' ')} relationship (r=${correlation.strength.toFixed(3)})`,
        encoding: this.createScatterPlotEncoding(correlation.variable1, correlation.variable2),
        interactivity: this.createAdvancedInteractivity(),
        accessibility: this.createAccessibilityGuidance(ChartType.SCATTER_PLOT),
        performance: this.createPerformanceConsiderations(ChartType.SCATTER_PLOT),
        libraryRecommendations: this.getLibraryRecommendations(ChartType.SCATTER_PLOT),
        dataPreparation: this.createBivariateDataPreparation(),
        designGuidelines: this.createDesignGuidelines(ChartType.SCATTER_PLOT),
      });

      // Add regression line if strong linear relationship
      if (
        Math.abs(correlation.strength) > 0.7 &&
        (correlation.relationshipType === RelationshipType.LINEAR_POSITIVE ||
          correlation.relationshipType === RelationshipType.LINEAR_NEGATIVE)
      ) {
        recommendations.push({
          chartType: ChartType.REGRESSION_PLOT,
          purpose: ChartPurpose.RELATIONSHIP,
          priority: RecommendationPriority.SECONDARY,
          confidence: 0.85,
          reasoning:
            'Regression plot with confidence intervals shows linear trend and prediction uncertainty',
          encoding: this.createRegressionPlotEncoding(correlation.variable1, correlation.variable2),
          interactivity: this.createAdvancedInteractivity(),
          accessibility: this.createAccessibilityGuidance(ChartType.REGRESSION_PLOT),
          performance: this.createPerformanceConsiderations(ChartType.REGRESSION_PLOT),
          libraryRecommendations: this.getLibraryRecommendations(ChartType.REGRESSION_PLOT),
          dataPreparation: this.createBivariateDataPreparation(),
          designGuidelines: this.createDesignGuidelines(ChartType.REGRESSION_PLOT),
        });
      }
    }

    // Categorical vs Numerical - Grouped visualizations
    if ((isVar1Categorical && isVar2Numerical) || (isVar1Numerical && isVar2Categorical)) {
      const categoricalVar = isVar1Categorical ? correlation.variable1 : correlation.variable2;
      const numericalVar = isVar1Numerical ? correlation.variable1 : correlation.variable2;
      const cardinality = isVar1Categorical ? var1Data.cardinality : var2Data.cardinality;

      // Box plot by group - excellent for comparing distributions
      recommendations.push({
        chartType: ChartType.BOX_PLOT_BY_GROUP,
        purpose: ChartPurpose.COMPARISON,
        priority: RecommendationPriority.PRIMARY,
        confidence: 0.88,
        reasoning: `Box plots by ${categoricalVar} effectively compare ${numericalVar} distributions across groups`,
        encoding: this.createGroupedBoxPlotEncoding(categoricalVar, numericalVar),
        interactivity: this.createAdvancedInteractivity(),
        accessibility: this.createAccessibilityGuidance(ChartType.BOX_PLOT_BY_GROUP),
        performance: this.createPerformanceConsiderations(ChartType.BOX_PLOT_BY_GROUP),
        libraryRecommendations: this.getLibraryRecommendations(ChartType.BOX_PLOT_BY_GROUP),
        dataPreparation: this.createBivariateDataPreparation(),
        designGuidelines: this.createDesignGuidelines(ChartType.BOX_PLOT_BY_GROUP),
      });

      // Violin plot for detailed distribution comparison
      if (cardinality <= 8) {
        recommendations.push({
          chartType: ChartType.VIOLIN_BY_GROUP,
          purpose: ChartPurpose.COMPARISON,
          priority: RecommendationPriority.SECONDARY,
          confidence: 0.82,
          reasoning: `Violin plots show detailed distribution shapes for ${numericalVar} across ${categoricalVar} groups`,
          encoding: this.createGroupedViolinEncoding(categoricalVar, numericalVar),
          interactivity: this.createAdvancedInteractivity(),
          accessibility: this.createAccessibilityGuidance(ChartType.VIOLIN_BY_GROUP),
          performance: this.createPerformanceConsiderations(ChartType.VIOLIN_BY_GROUP),
          libraryRecommendations: this.getLibraryRecommendations(ChartType.VIOLIN_BY_GROUP),
          dataPreparation: this.createBivariateDataPreparation(),
          designGuidelines: this.createDesignGuidelines(ChartType.VIOLIN_BY_GROUP),
        });
      }
    }

    // Categorical vs Categorical - Association visualizations
    if (isVar1Categorical && isVar2Categorical) {
      recommendations.push({
        chartType: ChartType.HEATMAP,
        purpose: ChartPurpose.RELATIONSHIP,
        priority: RecommendationPriority.PRIMARY,
        confidence: 0.85,
        reasoning: `Heatmap effectively shows association patterns between ${correlation.variable1} and ${correlation.variable2}`,
        encoding: this.createCategoricalHeatmapEncoding(
          correlation.variable1,
          correlation.variable2,
        ),
        interactivity: this.createAdvancedInteractivity(),
        accessibility: this.createAccessibilityGuidance(ChartType.HEATMAP),
        performance: this.createPerformanceConsiderations(ChartType.HEATMAP),
        libraryRecommendations: this.getLibraryRecommendations(ChartType.HEATMAP),
        dataPreparation: this.createBivariateDataPreparation(),
        designGuidelines: this.createDesignGuidelines(ChartType.HEATMAP),
      });

      // Mosaic plot for proportional relationships
      if (var1Data.cardinality <= 6 && var2Data.cardinality <= 6) {
        recommendations.push({
          chartType: ChartType.MOSAIC_PLOT,
          purpose: ChartPurpose.COMPOSITION,
          priority: RecommendationPriority.ALTERNATIVE,
          confidence: 0.75,
          reasoning:
            'Mosaic plot shows proportional relationships and cell contributions to overall association',
          encoding: this.createMosaicPlotEncoding(correlation.variable1, correlation.variable2),
          interactivity: this.createAdvancedInteractivity(),
          accessibility: this.createAccessibilityGuidance(ChartType.MOSAIC_PLOT),
          performance: this.createPerformanceConsiderations(ChartType.MOSAIC_PLOT),
          libraryRecommendations: this.getLibraryRecommendations(ChartType.MOSAIC_PLOT),
          dataPreparation: this.createBivariateDataPreparation(),
          designGuidelines: this.createDesignGuidelines(ChartType.MOSAIC_PLOT),
        });
      }
    }

    return recommendations;
  }

  /**
   * Generate multivariate recommendations with advanced chart types
   */
  private generateMultivariateRecommendations(
    section3Result: Section3Result,
  ): MultivariateRecommendation[] {
    const recommendations: MultivariateRecommendation[] = [];

    if (!section3Result.edaAnalysis?.univariateAnalysis) {
      return recommendations;
    }

    const numericalColumns = section3Result.edaAnalysis.univariateAnalysis.filter((col) =>
      this.isNumericalType(col.detectedDataType),
    );

    const categoricalColumns = section3Result.edaAnalysis.univariateAnalysis.filter(
      (col) => col.detectedDataType === EdaDataType.CATEGORICAL,
    );

    // Parallel coordinates for multiple numerical variables
    if (numericalColumns.length >= 3) {
      recommendations.push({
        variables: numericalColumns.slice(0, 6).map((col) => col.columnName),
        purpose:
          'Compare multiple numerical variables simultaneously and identify multivariate patterns',
        chartType: ChartType.PARALLEL_COORDINATES,
        complexity: ComplexityLevel.MODERATE,
        prerequisites: ['Data normalization', 'Handle missing values'],
        implementation:
          'Use D3.js or Observable Plot for interactive parallel coordinates with brushing',
        alternatives: [ChartType.RADAR_CHART, ChartType.SCATTERPLOT_MATRIX],
      });
    }

    // Correlation matrix for numerical variables
    if (numericalColumns.length >= 4) {
      recommendations.push({
        variables: numericalColumns.map((col) => col.columnName),
        purpose: 'Visualize pairwise correlations across all numerical variables',
        chartType: ChartType.CORRELATION_MATRIX,
        complexity: ComplexityLevel.SIMPLE,
        prerequisites: ['Compute correlation coefficients', 'Handle missing data'],
        implementation: 'Create heatmap with correlation values and significance indicators',
        alternatives: [ChartType.SCATTERPLOT_MATRIX],
      });
    }

    // Scatterplot matrix (SPLOM) for detailed pairwise relationships
    if (numericalColumns.length >= 3 && numericalColumns.length <= 8) {
      recommendations.push({
        variables: numericalColumns.map((col) => col.columnName),
        purpose: 'Show detailed pairwise relationships and distributions in matrix layout',
        chartType: ChartType.SCATTERPLOT_MATRIX,
        complexity: ComplexityLevel.COMPLEX,
        prerequisites: ['Manageable number of variables (≤8)', 'Sufficient data points'],
        implementation: 'Interactive matrix with brushing and linking across panels',
        alternatives: [ChartType.PARALLEL_COORDINATES, ChartType.CORRELATION_MATRIX],
      });
    }

    // Radar chart for categorical comparisons across multiple metrics
    if (numericalColumns.length >= 3 && categoricalColumns.length >= 1) {
      const categoryCol = categoricalColumns[0];
      if (categoryCol.uniqueValues <= 6) {
        recommendations.push({
          variables: [
            categoryCol.columnName,
            ...numericalColumns.slice(0, 6).map((col) => col.columnName),
          ],
          purpose: `Compare ${categoryCol.columnName} categories across multiple numerical dimensions`,
          chartType: ChartType.RADAR_CHART,
          complexity: ComplexityLevel.MODERATE,
          prerequisites: [
            'Normalize numerical variables to similar scales',
            'Limited categories (≤6)',
          ],
          implementation: 'Multi-series radar chart with clear category distinction',
          alternatives: [ChartType.PARALLEL_COORDINATES, ChartType.GROUPED_BAR],
        });
      }
    }

    return recommendations;
  }

  /**
   * Generate dashboard recommendations (placeholder)
   */
  private generateDashboardRecommendations(
    _univariateRecommendations: ColumnVisualizationProfile[],
    _bivariateRecommendations: BivariateVisualizationProfile[],
    _strategy: VisualizationStrategy,
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
    _strategy: VisualizationStrategy,
  ): TechnicalGuidance {
    // Implementation would provide library comparisons, implementation patterns, etc.
    return {} as TechnicalGuidance;
  }

  /**
   * Assess accessibility (placeholder)
   */
  private assessAccessibility(
    _univariateRecommendations: ColumnVisualizationProfile[],
    _bivariateRecommendations: BivariateVisualizationProfile[],
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

  private meetsQualityThreshold(
    recommendation: ChartRecommendation,
    completeness: number,
  ): boolean {
    // Filter out recommendations for very incomplete data
    return completeness > 50 || recommendation.confidence > 0.8;
  }

  private generateColumnWarnings(
    _columnAnalysis: any,
    cardinality: number,
    completeness: number,
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
    bivariateRecommendations: BivariateVisualizationProfile[],
  ): ChartType[] {
    const chartTypes = new Set<ChartType>();

    univariateRecommendations.forEach((profile) => {
      profile.recommendations.forEach((rec) => chartTypes.add(rec.chartType));
    });

    bivariateRecommendations.forEach((profile) => {
      profile.recommendations.forEach((rec) => chartTypes.add(rec.chartType));
    });

    return Array.from(chartTypes);
  }

  private countAccessibilityChecks(): number {
    // Count accessibility checks performed
    return this.warnings.filter((w) => w.type === 'accessibility').length + 10; // Base checks
  }

  private calculateOverallConfidence(
    univariateRecommendations: ColumnVisualizationProfile[],
    bivariateRecommendations: BivariateVisualizationProfile[],
  ): number {
    const allRecommendations = [
      ...univariateRecommendations.flatMap((p) => p.recommendations),
      ...bivariateRecommendations.flatMap((p) => p.recommendations),
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

  private getDefaultColorScheme(
    type: 'categorical' | 'sequential' | 'diverging' | 'single',
  ): ColorScheme {
    return {
      type,
      palette: ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd'],
      printSafe: true,
      colorBlindSafe: true,
    };
  }

  // ===== ADVANCED ANALYSIS HELPER METHODS =====

  private determineRelationshipType(coefficient: number): RelationshipType {
    if (Math.abs(coefficient) < 0.1) return RelationshipType.NO_RELATIONSHIP;
    if (coefficient > 0.1) return RelationshipType.LINEAR_POSITIVE;
    if (coefficient < -0.1) return RelationshipType.LINEAR_NEGATIVE;
    return RelationshipType.NON_LINEAR;
  }

  private calculateVisualizationSuitability(correlation: any): number {
    // Higher suitability for stronger correlations and lower p-values
    const strengthScore = Math.abs(correlation.correlation || correlation.coefficient || 0);
    const significanceScore = Math.max(0, 1 - (correlation.pValue || 0.05));
    return strengthScore * 0.7 + significanceScore * 0.3;
  }

  private mapRelationshipType(
    dataType1: string,
    dataType2: string,
    _originalType: string,
  ):
    | 'numerical_numerical'
    | 'numerical_categorical'
    | 'categorical_categorical'
    | 'temporal_numerical'
    | 'temporal_categorical' {
    const isNumerical1 = this.isNumericalType(dataType1);
    const isNumerical2 = this.isNumericalType(dataType2);
    const isCategorical1 = dataType1 === EdaDataType.CATEGORICAL;
    const isCategorical2 = dataType2 === EdaDataType.CATEGORICAL;
    const isTemporal1 = dataType1 === EdaDataType.DATE_TIME;
    const isTemporal2 = dataType2 === EdaDataType.DATE_TIME;

    if (isNumerical1 && isNumerical2) return 'numerical_numerical';
    if (isCategorical1 && isCategorical2) return 'categorical_categorical';
    if ((isNumerical1 && isCategorical2) || (isCategorical1 && isNumerical2))
      return 'numerical_categorical';
    if ((isTemporal1 && isNumerical2) || (isNumerical1 && isTemporal2)) return 'temporal_numerical';
    if ((isTemporal1 && isCategorical2) || (isCategorical1 && isTemporal2))
      return 'temporal_categorical';

    // Default fallback
    return 'numerical_numerical';
  }

  private getVariableData(variableName: string, section3Result: Section3Result): any {
    const univariateAnalysis = section3Result.edaAnalysis?.univariateAnalysis;
    if (!univariateAnalysis) return null;

    return univariateAnalysis.find((col) => col.columnName === variableName);
  }

  private createAdvancedInteractivity(): InteractivityOptions {
    return {
      level: 'advanced',
      interactions: ['hover', 'tooltip', 'zoom', 'brush', 'click'],
      responsiveness: ResponsivenessLevel.RESPONSIVE,
      keyboard: {
        navigation: true,
        shortcuts: {
          space: 'Toggle selection',
          r: 'Reset zoom',
          h: 'Toggle help',
        },
        focusManagement: true,
      },
      screenReader: {
        ariaLabels: {
          main: 'Interactive chart showing relationship between variables',
          tooltip: 'Data point details',
        },
        alternativeText: 'Detailed data table available below chart',
        dataTable: true,
      },
    } as InteractivityOptions;
  }

  private createBivariateDataPreparation(): DataPreparationSteps {
    return {
      required: [
        {
          step: 'Handle missing values',
          description: 'Remove or impute missing data points that would break relationships',
          importance: 'critical',
        },
        {
          step: 'Check data distribution',
          description: 'Verify both variables have reasonable distributions for visualization',
          importance: 'recommended',
        },
      ],
      optional: [
        {
          step: 'Scale normalization',
          description: 'Normalize scales if variables have very different ranges',
          importance: 'optional',
        },
      ],
      qualityChecks: [
        {
          check: 'Sufficient data points',
          description: 'Ensure adequate sample size for meaningful relationships',
          remediation: 'Collect more data or use caution in interpretation',
        },
      ],
      aggregations: [],
    };
  }

  // ===== ADVANCED ENCODING METHODS =====

  private createScatterPlotEncoding(var1: string, var2: string): VisualEncoding {
    return {
      xAxis: {
        variable: var1,
        scale: 'linear',
        label: var1,
        gridLines: true,
        zeroLine: false,
      },
      yAxis: {
        variable: var2,
        scale: 'linear',
        label: var2,
        gridLines: true,
        zeroLine: false,
      },
      color: {
        variable: 'density',
        scheme: this.getDefaultColorScheme('sequential'),
        accessibility: {
          contrastRatio: 4.5,
          alternativeEncoding: 'size',
          wcagLevel: 'AA',
          colorBlindSupport: true,
        },
      },
      layout: {
        width: 'responsive',
        height: 400,
        margins: { top: 20, right: 30, bottom: 50, left: 60 },
      },
    };
  }

  private createRegressionPlotEncoding(var1: string, var2: string): VisualEncoding {
    return {
      xAxis: {
        variable: var1,
        scale: 'linear',
        label: var1,
        gridLines: true,
        zeroLine: false,
      },
      yAxis: {
        variable: var2,
        scale: 'linear',
        label: var2,
        gridLines: true,
        zeroLine: false,
      },
      color: {
        variable: 'confidence',
        scheme: this.getDefaultColorScheme('sequential'),
        accessibility: {
          contrastRatio: 4.5,
          alternativeEncoding: 'size',
          wcagLevel: 'AA',
          colorBlindSupport: true,
        },
      },
      layout: {
        width: 'responsive',
        height: 400,
        margins: { top: 20, right: 30, bottom: 50, left: 60 },
      },
      annotations: [
        {
          type: 'line',
          content: 'regression line',
          position: { x: 0, y: 0 },
          styling: { stroke: '#333', strokeWidth: 2 },
          purpose: 'show trend',
        },
        {
          type: 'text',
          content: 'confidence interval',
          position: { x: 0, y: 0 },
          styling: { fill: '#666', fontSize: 12 },
          purpose: 'show uncertainty',
        },
        {
          type: 'text',
          content: 'R² value',
          position: { x: 0, y: 0 },
          styling: { fill: '#333', fontSize: 14 },
          purpose: 'show fit quality',
        },
      ],
    };
  }

  private createGroupedBoxPlotEncoding(
    categoricalVar: string,
    numericalVar: string,
  ): VisualEncoding {
    return {
      xAxis: {
        variable: categoricalVar,
        scale: 'band',
        label: categoricalVar,
        gridLines: false,
        zeroLine: false,
      },
      yAxis: {
        variable: numericalVar,
        scale: 'linear',
        label: numericalVar,
        gridLines: true,
        zeroLine: false,
      },
      color: {
        variable: categoricalVar,
        scheme: this.getDefaultColorScheme('categorical'),
        accessibility: {
          contrastRatio: 4.5,
          alternativeEncoding: 'pattern',
          wcagLevel: 'AA',
          colorBlindSupport: true,
        },
      },
      layout: {
        width: 'responsive',
        height: 400,
        margins: { top: 20, right: 30, bottom: 60, left: 60 },
      },
    };
  }

  private createGroupedViolinEncoding(
    categoricalVar: string,
    numericalVar: string,
  ): VisualEncoding {
    return {
      xAxis: {
        variable: categoricalVar,
        scale: 'band',
        label: categoricalVar,
        gridLines: false,
        zeroLine: false,
      },
      yAxis: {
        variable: numericalVar,
        scale: 'linear',
        label: numericalVar,
        gridLines: true,
        zeroLine: false,
      },
      color: {
        variable: categoricalVar,
        scheme: this.getDefaultColorScheme('categorical'),
        accessibility: {
          contrastRatio: 4.5,
          alternativeEncoding: 'pattern',
          wcagLevel: 'AA',
          colorBlindSupport: true,
        },
      },
      layout: {
        width: 'responsive',
        height: 400,
        margins: { top: 20, right: 30, bottom: 60, left: 60 },
      },
    };
  }

  private createCategoricalHeatmapEncoding(var1: string, var2: string): VisualEncoding {
    return {
      xAxis: {
        variable: var1,
        scale: 'band',
        label: var1,
        gridLines: false,
        zeroLine: false,
      },
      yAxis: {
        variable: var2,
        scale: 'band',
        label: var2,
        gridLines: false,
        zeroLine: false,
      },
      color: {
        variable: 'frequency',
        scheme: this.getDefaultColorScheme('sequential'),
        accessibility: {
          contrastRatio: 4.5,
          alternativeEncoding: 'size',
          wcagLevel: 'AA',
          colorBlindSupport: true,
        },
      },
      layout: {
        width: 'responsive',
        height: 400,
        margins: { top: 20, right: 80, bottom: 60, left: 80 },
      },
      legend: {
        position: 'right',
        orientation: 'vertical',
        title: 'Frequency',
        interactive: true,
      },
    };
  }

  private createMosaicPlotEncoding(var1: string, var2: string): VisualEncoding {
    return {
      layout: {
        width: 'responsive',
        height: 400,
        margins: { top: 20, right: 30, bottom: 60, left: 60 },
      },
      color: {
        variable: 'residual',
        scheme: this.getDefaultColorScheme('diverging'),
        accessibility: {
          contrastRatio: 4.5,
          alternativeEncoding: 'pattern',
          wcagLevel: 'AA',
          colorBlindSupport: true,
        },
      },
      annotations: [
        {
          type: 'text',
          content: `${var1} categories`,
          position: { x: 0, y: 0 },
          styling: { fill: '#333', fontSize: 12 },
          purpose: 'label axis',
        },
        {
          type: 'text',
          content: `${var2} categories`,
          position: { x: 0, y: 0 },
          styling: { fill: '#333', fontSize: 12 },
          purpose: 'label axis',
        },
        {
          type: 'text',
          content: 'cell proportions',
          position: { x: 0, y: 0 },
          styling: { fill: '#666', fontSize: 10 },
          purpose: 'explain encoding',
        },
      ],
    };
  }

  private createViolinWithBoxEncoding(columnAnalysis: any): VisualEncoding {
    return {
      yAxis: {
        variable: columnAnalysis.columnName,
        scale: 'linear',
        label: columnAnalysis.columnName,
        gridLines: true,
        zeroLine: false,
      },
      color: {
        variable: 'density',
        scheme: this.getDefaultColorScheme('sequential'),
        accessibility: {
          contrastRatio: 4.5,
          alternativeEncoding: 'size',
          wcagLevel: 'AA',
          colorBlindSupport: true,
        },
      },
      layout: {
        width: 350,
        height: 450,
        margins: { top: 20, right: 30, bottom: 40, left: 60 },
      },
    };
  }

  // ===== ANTI-PATTERN DETECTION =====

  private detectAntiPatterns(
    recommendation: ChartRecommendation,
    columnData: any,
  ): AntiPatternDetection[] {
    const antiPatterns: AntiPatternDetection[] = [];

    // Pie chart with too many categories
    if (recommendation.chartType === ChartType.PIE_CHART && columnData.cardinality > 7) {
      antiPatterns.push({
        type: AntiPatternType.PIE_CHART_TOO_MANY_CATEGORIES,
        severity: AntiPatternSeverity.HIGH,
        description: `Pie chart with ${columnData.cardinality} categories exceeds optimal limit of 5-7 categories`,
        recommendation: 'Use horizontal bar chart instead for better comparability',
        affectedChart: ChartType.PIE_CHART,
        evidence: [
          `${columnData.cardinality} unique categories detected`,
          'Pie charts become difficult to read with >7 slices',
        ],
        remediation: [
          {
            action: 'Replace with horizontal bar chart',
            description: 'Bar charts allow easier comparison of categorical data',
            priority: 'immediate',
          },
          {
            action: 'Group smaller categories into "Other"',
            description: 'Reduce category count to ≤6 meaningful groups',
            priority: 'soon',
          },
        ],
      });
    }

    // Y-axis not starting at zero for magnitude comparisons
    if (
      (recommendation.chartType === ChartType.BAR_CHART ||
        recommendation.chartType === ChartType.HORIZONTAL_BAR) &&
      recommendation.purpose === ChartPurpose.COMPARISON
    ) {
      antiPatterns.push({
        type: AntiPatternType.Y_AXIS_NOT_ZERO,
        severity: AntiPatternSeverity.MEDIUM,
        description:
          'Bar charts for magnitude comparison should start Y-axis at zero to avoid misleading proportions',
        recommendation: 'Ensure Y-axis baseline starts at zero for accurate visual comparison',
        affectedChart: recommendation.chartType,
        evidence: [
          'Bar chart used for magnitude comparison',
          'Cleveland & McGill: position on common scale principle',
        ],
        remediation: [
          {
            action: 'Set Y-axis minimum to zero',
            description: 'Prevents visual distortion of proportional relationships',
            priority: 'immediate',
          },
        ],
      });
    }

    // High cardinality causing performance and readability issues
    if (columnData.cardinality > 50) {
      const severity =
        columnData.cardinality > 200 ? AntiPatternSeverity.HIGH : AntiPatternSeverity.MEDIUM;

      antiPatterns.push({
        type: AntiPatternType.OVERCOMPLICATED_VISUALIZATION,
        severity,
        description: `High cardinality (${columnData.cardinality} categories) may cause performance issues and reduced readability`,
        recommendation: 'Consider aggregation, filtering, or alternative visualization approaches',
        affectedChart: recommendation.chartType,
        evidence: [
          `${columnData.cardinality} unique values detected`,
          'Performance degradation likely',
        ],
        remediation: [
          {
            action: 'Implement data aggregation',
            description: 'Group rare categories or apply top-N filtering',
            priority: 'soon',
          },
          {
            action: 'Consider alternative chart types',
            description: 'Use treemap, word cloud, or hierarchical visualizations',
            priority: 'eventually',
          },
        ],
      });
    }

    // Missing context for standalone charts
    if (!recommendation.encoding.layout || !recommendation.encoding.layout.margins) {
      antiPatterns.push({
        type: AntiPatternType.MISSING_CONTEXT,
        severity: AntiPatternSeverity.LOW,
        description: 'Chart lacks sufficient contextual information (title, axes labels, legends)',
        recommendation: 'Add comprehensive labeling and contextual information',
        affectedChart: recommendation.chartType,
        evidence: ['Missing layout specifications', 'Insufficient labeling detected'],
        remediation: [
          {
            action: 'Add descriptive title and axis labels',
            description: 'Provide clear context for data interpretation',
            priority: 'soon',
          },
          {
            action: 'Include data source and methodology',
            description: 'Enable reproducibility and trust',
            priority: 'eventually',
          },
        ],
      });
    }

    return antiPatterns;
  }

  private applyAntiPatternDetection(
    recommendations: ChartRecommendation[],
    columnData: any,
  ): ChartRecommendation[] {
    const enhancedRecommendations: ChartRecommendation[] = [];

    for (const recommendation of recommendations) {
      const antiPatterns = this.detectAntiPatterns(recommendation, columnData);

      // Demote recommendations with critical anti-patterns
      const criticalAntiPatterns = antiPatterns.filter(
        (ap) =>
          ap.severity === AntiPatternSeverity.CRITICAL || ap.severity === AntiPatternSeverity.HIGH,
      );

      if (criticalAntiPatterns.length > 0) {
        // Lower confidence and priority for problematic recommendations
        recommendation.confidence = Math.max(0.3, recommendation.confidence - 0.3);
        if (recommendation.priority === RecommendationPriority.PRIMARY) {
          recommendation.priority = RecommendationPriority.SECONDARY;
        } else if (recommendation.priority === RecommendationPriority.SECONDARY) {
          recommendation.priority = RecommendationPriority.ALTERNATIVE;
        }

        // Add warning to reasoning
        recommendation.reasoning += ` ⚠️ Note: ${criticalAntiPatterns.length} design concern(s) detected.`;
      }

      // Store anti-patterns for reporting
      this.antiPatterns.push(...antiPatterns);

      enhancedRecommendations.push(recommendation);
    }

    return enhancedRecommendations;
  }
}
