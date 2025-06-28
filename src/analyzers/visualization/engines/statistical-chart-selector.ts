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

import type { ColumnAnalysis, BivariateAnalysis } from '../../eda/types';
import { EdaDataType } from '../../eda/types';

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
export class StatisticalChartSelector {
  /**
   * Generate statistically-informed chart recommendations for univariate data
   */
  static recommendUnivariateChart(columnAnalysis: ColumnAnalysis): StatisticalChartRecommendation {
    const dataType = columnAnalysis.detectedDataType;
    const distribution = this.analyzeDistribution(columnAnalysis);

    switch (dataType) {
      case EdaDataType.NUMERICAL_FLOAT:
      case EdaDataType.NUMERICAL_INTEGER:
        return this.recommendNumericalUnivariate(columnAnalysis, distribution);

      case EdaDataType.CATEGORICAL:
        return this.recommendCategoricalUnivariate(columnAnalysis);

      case EdaDataType.DATE_TIME:
        return this.recommendTemporalUnivariate(columnAnalysis);

      case EdaDataType.BOOLEAN:
        return this.recommendBooleanUnivariate(columnAnalysis);

      default:
        return this.createFallbackRecommendation(columnAnalysis);
    }
  }

  /**
   * Generate statistically-informed chart recommendations for bivariate relationships
   */
  static recommendBivariateChart(
    xColumn: ColumnAnalysis,
    yColumn: ColumnAnalysis,
    correlation?: CorrelationInsight,
  ): StatisticalChartRecommendation {
    const xType = xColumn.detectedDataType;
    const yType = yColumn.detectedDataType;

    // Numerical vs Numerical
    if (this.isNumerical(xType) && this.isNumerical(yType)) {
      return this.recommendNumericalBivariate(xColumn, yColumn, correlation);
    }

    // Categorical vs Numerical
    if (this.isCategorical(xType) && this.isNumerical(yType)) {
      return this.recommendCategoricalNumerical(xColumn, yColumn);
    }

    // Numerical vs Categorical (swap for consistency)
    if (this.isNumerical(xType) && this.isCategorical(yType)) {
      return this.recommendCategoricalNumerical(yColumn, xColumn);
    }

    // Categorical vs Categorical
    if (this.isCategorical(xType) && this.isCategorical(yType)) {
      return this.recommendCategoricalBivariate(xColumn, yColumn);
    }

    // Temporal relationships
    if (this.isTemporal(xType) || this.isTemporal(yType)) {
      return this.recommendTemporalBivariate(xColumn, yColumn);
    }

    return this.createFallbackBivariateRecommendation(xColumn, yColumn);
  }

  /**
   * Analyze distribution characteristics for statistical insights
   */
  private static analyzeDistribution(columnAnalysis: ColumnAnalysis): DistributionAnalysis {
    const stats = (columnAnalysis as any).descriptiveStats;

    if (!stats) {
      return {
        isNormal: false,
        skewness: 0,
        kurtosis: 0,
        modality: 'unimodal',
        outlierSeverity: 'none',
        tailBehavior: 'normal',
      };
    }

    // Determine normality based on skewness and kurtosis
    const skewness = (columnAnalysis as any).distributionAnalysis?.skewness || 0;
    const kurtosis = (columnAnalysis as any).distributionAnalysis?.kurtosis || 0;
    const isNormal = Math.abs(skewness) < 0.5 && Math.abs(kurtosis) < 1.0;

    // Analyze outlier severity
    const outlierCount = (columnAnalysis as any).outlierAnalysis?.summary?.totalOutliers || 0;
    const totalCount = columnAnalysis.totalValues || 1;
    const outlierRate = outlierCount / totalCount;

    let outlierSeverity: 'none' | 'mild' | 'moderate' | 'severe' = 'none';
    if (outlierRate > 0.1) outlierSeverity = 'severe';
    else if (outlierRate > 0.05) outlierSeverity = 'moderate';
    else if (outlierRate > 0.01) outlierSeverity = 'mild';

    // Determine tail behavior
    let tailBehavior: 'light' | 'normal' | 'heavy' = 'normal';
    if (Math.abs(kurtosis) > 2) tailBehavior = 'heavy';
    else if (Math.abs(kurtosis) < -1) tailBehavior = 'light';

    // Suggest transformation if needed
    let recommendedTransformation: string | undefined;
    if (skewness > 1) recommendedTransformation = 'log';
    else if (skewness < -1) recommendedTransformation = 'square';
    else if (Math.abs(kurtosis) > 3) recommendedTransformation = 'box-cox';

    return {
      isNormal,
      skewness,
      kurtosis,
      modality: 'unimodal', // Would need more sophisticated analysis for multimodality
      outlierSeverity,
      tailBehavior,
      recommendedTransformation,
    };
  }

  /**
   * Recommend charts for numerical univariate data based on distribution
   */
  private static recommendNumericalUnivariate(
    columnAnalysis: ColumnAnalysis,
    distribution: DistributionAnalysis,
  ): StatisticalChartRecommendation {
    // Check for missing statistical data
    const hasDistributionData = (columnAnalysis as any).distributionAnalysis !== undefined;
    if (!hasDistributionData) {
      return this.createFallbackRecommendation(columnAnalysis, 'histogram');
    }

    const uniqueValues = columnAnalysis.uniqueValues || 0;
    const totalValues = columnAnalysis.totalValues || 1;
    const cardinality = uniqueValues / totalValues;

    let chartType: string;
    let confidence: number;
    let justification: string;
    let encodingStrategy: VisualEncodingStrategy;

    // High cardinality numerical data
    if (cardinality > 0.8 || uniqueValues > 50) {
      if (distribution.isNormal && distribution.outlierSeverity === 'none') {
        chartType = 'histogram';
        confidence = 0.9;
        justification =
          'normal distribution with high cardinality best shown with histogram';
      } else if (distribution.outlierSeverity === 'severe') {
        chartType = 'violin_plot';
        confidence = 0.85;
        justification =
          'Severe outliers require violin plot to show both distribution and outlier patterns';
      } else {
        chartType = 'histogram';
        confidence = 0.8;
        justification =
          'High cardinality numerical data shows distribution patterns best with histogram';
      }
    }
    // Moderate cardinality
    else if (cardinality > 0.3) {
      chartType = 'histogram';
      confidence = 0.85;
      justification = 'Moderate cardinality allows for meaningful bin-based distribution analysis';
    }
    // Low cardinality (discrete-like)
    else {
      chartType = 'bar_chart';
      confidence = 0.9;
      justification = 'Low cardinality numerical data treated as discrete categories for clarity';
    }

    // Generate encoding strategy
    encodingStrategy = this.createUnivariateEncodingStrategy(
      columnAnalysis,
      chartType,
      distribution,
    );

    const interactions = this.generateUnivariateInteractions(chartType, distribution);
    const alternatives = this.generateUnivariateAlternatives(chartType, distribution, cardinality);
    const performance = this.generatePerformanceGuidance(totalValues, chartType);

    return {
      chartType,
      confidence,
      statisticalJustification: justification,
      dataCharacteristics: this.extractDataCharacteristics(distribution, cardinality),
      visualEncodingStrategy: encodingStrategy,
      interactionRecommendations: interactions,
      alternativeOptions: alternatives,
      performanceConsiderations: performance,
    };
  }

  /**
   * Recommend charts for categorical univariate data
   */
  private static recommendCategoricalUnivariate(
    columnAnalysis: ColumnAnalysis,
  ): StatisticalChartRecommendation {
    const uniqueValues = columnAnalysis.uniqueValues || 0;
    const entropy = this.calculateEntropy(columnAnalysis);
    const isOrderedCategories = this.detectOrderedCategories(columnAnalysis);

    let chartType: string;
    let confidence: number;
    let justification: string;

    if (uniqueValues <= 5 && entropy > 1.5) {
      chartType = 'pie_chart';
      confidence = 0.85;
      justification = 'Low cardinality with high entropy suitable for proportional comparison';
    } else if (uniqueValues <= 10) {
      chartType = isOrderedCategories ? 'ordered_bar_chart' : 'bar_chart';
      confidence = 0.9;
      justification = isOrderedCategories
        ? 'Ordinal categories maintain natural ordering in bar chart'
        : 'Moderate cardinality categorical data ideal for bar chart comparison';
    } else if (uniqueValues <= 20) {
      chartType = 'horizontal_bar_chart';
      confidence = 0.8;
      justification = 'High cardinality requires horizontal orientation for label readability';
    } else {
      chartType = 'treemap';
      confidence = 0.75;
      justification =
        'Very high cardinality categorical data benefits from hierarchical treemap display';
    }

    const encodingStrategy = this.createCategoricalEncodingStrategy(columnAnalysis, chartType);
    const interactions = this.generateCategoricalInteractions(chartType, uniqueValues);
    const alternatives = this.generateCategoricalAlternatives(chartType, uniqueValues, entropy);
    const performance = this.generatePerformanceGuidance(
      columnAnalysis.totalValues || 0,
      chartType,
    );

    return {
      chartType,
      confidence,
      statisticalJustification: justification,
      dataCharacteristics: [`Cardinality: ${uniqueValues}`, `Entropy: ${entropy.toFixed(2)}`],
      visualEncodingStrategy: encodingStrategy,
      interactionRecommendations: interactions,
      alternativeOptions: alternatives,
      performanceConsiderations: performance,
    };
  }

  /**
   * Recommend charts for numerical vs numerical relationships
   */
  private static recommendNumericalBivariate(
    xColumn: ColumnAnalysis,
    yColumn: ColumnAnalysis,
    correlation?: CorrelationInsight,
  ): StatisticalChartRecommendation {
    const totalPoints = Math.min(xColumn.totalValues || 0, yColumn.totalValues || 0);
    const correlationStrength = correlation?.strength || 'weak';
    const relationshipType = correlation?.relationship || 'linear';

    let chartType: string;
    let confidence: number;
    let justification: string;

    // Large datasets require different approaches
    if (totalPoints > 10000) {
      if (correlationStrength === 'very_strong' || correlationStrength === 'strong') {
        chartType = 'hexbin_plot';
        confidence = 0.9;
        justification =
          'Strong correlation in large dataset best shown with hexagonal binning to reveal density patterns';
      } else {
        chartType = 'density_scatter';
        confidence = 0.85;
        justification = 'Large dataset requires density-based scatter plot to prevent overplotting';
      }
    }
    // Medium datasets
    else if (totalPoints > 1000) {
      if (relationshipType === 'non_linear') {
        chartType = 'smooth_scatter';
        confidence = 0.8;
        justification = 'Non-linear relationship benefits from smoothed trend line visualization';
      } else {
        chartType = 'scatter_plot';
        confidence = 0.9;
        justification =
          'Medium-sized dataset ideal for traditional scatter plot with trend analysis';
      }
    }
    // Small datasets
    else {
      chartType = 'scatter_plot';
      confidence = 0.95;
      justification =
        'Small dataset allows for detailed scatter plot analysis with individual point inspection';
    }

    const encodingStrategy = this.createBivariateEncodingStrategy(
      xColumn,
      yColumn,
      chartType,
      correlation,
    );
    const interactions = this.generateBivariateInteractions(chartType, correlationStrength);
    const alternatives = this.generateBivariateAlternatives(
      chartType,
      totalPoints,
      relationshipType,
    );
    const performance = this.generatePerformanceGuidance(totalPoints, chartType);

    return {
      chartType,
      confidence,
      statisticalJustification: justification,
      dataCharacteristics: [
        `Correlation: ${correlationStrength}`,
        `Relationship: ${relationshipType}`,
        `Sample size: ${totalPoints}`,
      ],
      visualEncodingStrategy: encodingStrategy,
      interactionRecommendations: interactions,
      alternativeOptions: alternatives,
      performanceConsiderations: performance,
    };
  }

  // Helper methods for creating encoding strategies
  private static createUnivariateEncodingStrategy(
    columnAnalysis: ColumnAnalysis,
    chartType: string,
    distribution: DistributionAnalysis,
  ): VisualEncodingStrategy {
    const primaryEncoding: EncodingChannel = {
      channel: chartType.includes('bar') ? 'y' : 'x',
      dataField: columnAnalysis.columnName,
      dataType: 'quantitative',
      scale: this.recommendScale(columnAnalysis, distribution),
      justification: `Primary ${chartType.includes('bar') ? 'vertical' : 'horizontal'} encoding for ${columnAnalysis.columnName}`,
    };

    const colorStrategy: ColorEncodingStrategy = {
      scheme: 'sequential',
      palette: distribution.outlierSeverity === 'severe' ? 'viridis' : 'blues',
      accessibility: {
        colorBlindnessSafe: true,
        contrastRatio: 4.5,
        alternativeEncodings: ['pattern', 'texture'],
        screenReaderGuidance: `Distribution of ${columnAnalysis.columnName}`,
      },
      reasoning: 'Sequential color scheme appropriate for continuous numerical data',
    };

    return {
      primaryEncoding,
      secondaryEncodings: [],
      colorStrategy,
      aestheticOptimizations: this.generateAestheticOptimizations(distribution),
    };
  }

  private static createBivariateEncodingStrategy(
    xColumn: ColumnAnalysis,
    yColumn: ColumnAnalysis,
    chartType: string,
    correlation?: CorrelationInsight,
  ): VisualEncodingStrategy {
    const xEncoding: EncodingChannel = {
      channel: 'x',
      dataField: xColumn.columnName,
      dataType: 'quantitative',
      scale: this.recommendScale(xColumn),
      justification: `Horizontal axis encoding for ${xColumn.columnName}`,
    };

    const yEncoding: EncodingChannel = {
      channel: 'y',
      dataField: yColumn.columnName,
      dataType: 'quantitative',
      scale: this.recommendScale(yColumn),
      justification: `Vertical axis encoding for ${yColumn.columnName}`,
    };

    const colorStrategy: ColorEncodingStrategy = {
      scheme: correlation?.strength === 'very_strong' ? 'diverging' : 'categorical',
      palette: correlation?.direction === 'negative' ? 'rdbu' : 'plasma',
      accessibility: {
        colorBlindnessSafe: true,
        contrastRatio: 4.5,
        alternativeEncodings: ['size', 'shape'],
        screenReaderGuidance: `Relationship between ${xColumn.columnName} and ${yColumn.columnName}`,
      },
      reasoning: `${correlation?.strength || 'Unknown'} correlation benefits from ${correlation?.strength === 'very_strong' ? 'diverging' : 'categorical'} color scheme`,
    };

    return {
      primaryEncoding: xEncoding,
      secondaryEncodings: [yEncoding],
      colorStrategy,
      aestheticOptimizations: [],
    };
  }

  // Helper methods for scale recommendations
  private static recommendScale(
    columnAnalysis: ColumnAnalysis,
    distribution?: DistributionAnalysis,
  ): ScaleRecommendation {
    const stats = (columnAnalysis as any).descriptiveStats;
    const min = stats?.minimum || 0;
    const max = stats?.maximum || 100;

    // Detect if log scale would be beneficial
    if (distribution?.recommendedTransformation === 'log' || (max / min > 1000 && min > 0)) {
      return {
        type: 'log',
        domain: [min, max],
        nice: true,
        reasoning: 'Log scale recommended due to wide range or right-skewed distribution',
      };
    }

    // Standard linear scale
    return {
      type: 'linear',
      domain: [min, max],
      nice: true,
      zero: min >= 0, // Include zero if all values are positive
      reasoning: 'Linear scale appropriate for normal distribution with reasonable range',
    };
  }

  // Utility methods
  private static isNumerical(dataType: EdaDataType): boolean {
    return dataType === EdaDataType.NUMERICAL_FLOAT || dataType === EdaDataType.NUMERICAL_INTEGER;
  }

  private static isCategorical(dataType: EdaDataType): boolean {
    return dataType === EdaDataType.CATEGORICAL;
  }

  private static isTemporal(dataType: EdaDataType): boolean {
    return dataType === EdaDataType.DATE_TIME;
  }

  private static calculateEntropy(columnAnalysis: ColumnAnalysis): number {
    // Enhanced entropy calculation using actual frequency data if available
    const frequencyData = (columnAnalysis as any).frequencyDistribution;
    const totalValues = columnAnalysis.totalValues || 1;

    if (!frequencyData) {
      // Fallback to simplified calculation
      const uniqueValues = columnAnalysis.uniqueValues || 1;
      if (uniqueValues === 1) return 0;
      const probability = 1 / uniqueValues;
      return -uniqueValues * probability * Math.log2(probability);
    }

    // Calculate entropy using actual frequencies
    let entropy = 0;
    for (const freq of Object.values(frequencyData)) {
      const probability = (freq as number) / totalValues;
      if (probability > 0) {
        entropy -= probability * Math.log2(probability);
      }
    }

    return entropy;
  }

  private static detectOrderedCategories(columnAnalysis: ColumnAnalysis): boolean {
    const columnName = columnAnalysis.columnName.toLowerCase();

    // Common ordinal indicators in column names
    const ordinalKeywords = [
      'rating',
      'level',
      'grade',
      'score',
      'rank',
      'priority',
      'stage',
      'class',
      'tier',
      'scale',
      'order',
      'sequence',
      'step',
      'phase',
      'generation',
      'version',
      'size',
      'magnitude',
      'intensity',
      'severity',
    ];

    // Check for ordinal keywords
    if (ordinalKeywords.some((keyword) => columnName.includes(keyword))) {
      return true;
    }

    // Check for sequential patterns in actual values if available
    const frequencyData = (columnAnalysis as any).frequencyDistribution;
    if (frequencyData) {
      const categories = Object.keys(frequencyData);

      // Check for numerical sequences (1,2,3 or A,B,C)
      const isNumericSequence = categories.every((cat) => !isNaN(Number(cat)));
      if (isNumericSequence && categories.length > 1) {
        const numbers = categories.map(Number).sort((a, b) => a - b);
        const isConsecutive = numbers.every((num, i) => i === 0 || num === numbers[i - 1] + 1);
        return isConsecutive;
      }

      // Check for alphabetical sequences
      if (categories.length <= 10 && categories.every((cat) => cat.length === 1)) {
        const sortedCats = [...categories].sort();
        return sortedCats.join('') === categories.sort().join('');
      }
    }

    return false;
  }

  private static extractDataCharacteristics(
    distribution: DistributionAnalysis,
    cardinality: number,
  ): string[] {
    const characteristics = [];

    characteristics.push(`Distribution: ${distribution.isNormal ? 'Normal' : 'Non-normal'}`);
    characteristics.push(
      `Skewness: ${Math.abs(distribution.skewness) < 0.5 ? 'Symmetric' : distribution.skewness > 0 ? 'Right-skewed' : 'Left-skewed'}`,
    );
    characteristics.push(`Outliers: ${distribution.outlierSeverity}`);
    if (distribution.outlierSeverity !== 'none') {
      characteristics.push('outliers');
    }
    characteristics.push(
      `Cardinality: ${cardinality > 0.8 ? 'High' : cardinality > 0.3 ? 'Moderate' : 'Low'}`,
    );

    if (distribution.recommendedTransformation) {
      characteristics.push(`Suggested transformation: ${distribution.recommendedTransformation}`);
    }

    return characteristics;
  }

  // Placeholder methods for generating interactions, alternatives, and performance guidance
  private static generateUnivariateInteractions(
    chartType: string,
    distribution: DistributionAnalysis,
  ): InteractionRecommendation[] {
    const interactions: InteractionRecommendation[] = [];

    interactions.push({
      interactionType: 'hover',
      purpose: 'Show exact values and statistics',
      implementation: 'Tooltip with value, percentile, and z-score',
      priority: 'essential',
      statisticalBenefit: 'Allows precise value inspection and statistical context',
    });

    if (distribution.outlierSeverity !== 'none') {
      interactions.push({
        interactionType: 'click',
        purpose: 'Highlight outliers',
        implementation: 'Click to highlight outlier points and show outlier analysis',
        priority: 'recommended',
        statisticalBenefit: 'Facilitates outlier investigation and data quality assessment',
      });
    }

    return interactions;
  }

  private static generateUnivariateAlternatives(
    chartType: string,
    distribution: DistributionAnalysis,
    cardinality: number,
  ): AlternativeChartOption[] {
    const alternatives: AlternativeChartOption[] = [];

    if (chartType !== 'box_plot' && distribution.outlierSeverity !== 'none') {
      alternatives.push({
        chartType: 'box_plot',
        confidence: 0.8,
        tradeoffs: 'Less detailed distribution but better outlier visibility',
        whenToUse: 'When outlier analysis is primary concern',
        statisticalSuitability: 0.85,
      });
    }

    if (chartType !== 'violin_plot' && !distribution.isNormal) {
      alternatives.push({
        chartType: 'violin_plot',
        confidence: 0.75,
        tradeoffs: 'More complex but shows full distribution shape',
        whenToUse: 'When distribution shape analysis is important',
        statisticalSuitability: 0.8,
      });
    }

    return alternatives;
  }

  private static generatePerformanceGuidance(
    dataSize: number,
    chartType: string,
  ): PerformanceGuidance {
    let threshold = 10000;
    let samplingStrategy: string | undefined;
    const aggregationSuggestions: string[] = [];
    const renderingOptimizations: string[] = [];
    const memoryConsiderations: string[] = [];

    // Handle very small datasets
    if (dataSize < 10) {
      threshold = Math.max(dataSize, 5);
      aggregationSuggestions.push('Small dataset allows for detailed analysis');
      renderingOptimizations.push('No optimization needed for small dataset');
    } else if (dataSize > 100000) {
      threshold = 5000;
      samplingStrategy = 'Stratified random sampling maintaining distribution characteristics';
      aggregationSuggestions.push('Bin data for histogram display');
      renderingOptimizations.push('Use canvas rendering instead of SVG');
      memoryConsiderations.push('Stream data processing to avoid loading full dataset');
    } else if (dataSize > 10000) {
      aggregationSuggestions.push('Consider binning for performance');
      renderingOptimizations.push('Optimize for moderate data size');
    }

    return {
      dataPointThreshold: threshold,
      samplingStrategy,
      aggregationSuggestions,
      renderingOptimizations,
      memoryConsiderations,
    };
  }

  private static generateAestheticOptimizations(
    distribution: DistributionAnalysis,
  ): AestheticOptimization[] {
    const optimizations: AestheticOptimization[] = [];

    if (distribution.outlierSeverity === 'severe') {
      optimizations.push({
        property: 'opacity',
        value: 0.7,
        reasoning: 'Reduced opacity helps manage visual impact of severe outliers',
        impact: 'medium',
      });
    }

    if (!distribution.isNormal) {
      optimizations.push({
        property: 'binning',
        value: 'adaptive',
        reasoning: 'Adaptive binning better represents non-normal distributions',
        impact: 'high',
      });
    }

    return optimizations;
  }

  // Additional placeholder methods
  private static recommendTemporalUnivariate(
    columnAnalysis: ColumnAnalysis,
  ): StatisticalChartRecommendation {
    return this.createFallbackRecommendation(columnAnalysis, 'line_chart');
  }

  private static recommendBooleanUnivariate(
    columnAnalysis: ColumnAnalysis,
  ): StatisticalChartRecommendation {
    return this.createFallbackRecommendation(columnAnalysis, 'pie_chart');
  }

  private static recommendCategoricalNumerical(
    catColumn: ColumnAnalysis,
    numColumn: ColumnAnalysis,
  ): StatisticalChartRecommendation {
    return this.createFallbackRecommendation(catColumn, 'box_plot');
  }

  private static recommendCategoricalBivariate(
    xColumn: ColumnAnalysis,
    yColumn: ColumnAnalysis,
  ): StatisticalChartRecommendation {
    return this.createFallbackBivariateRecommendation(xColumn, yColumn, 'heatmap');
  }

  private static recommendTemporalBivariate(
    xColumn: ColumnAnalysis,
    yColumn: ColumnAnalysis,
  ): StatisticalChartRecommendation {
    return this.createFallbackBivariateRecommendation(xColumn, yColumn, 'line_chart');
  }

  private static createCategoricalEncodingStrategy(
    columnAnalysis: ColumnAnalysis,
    chartType: string,
  ): VisualEncodingStrategy {
    return {
      primaryEncoding: {
        channel: 'x',
        dataField: columnAnalysis.columnName,
        dataType: 'nominal',
        scale: {
          type: 'ordinal',
          domain: [],
          reasoning: 'Categorical data requires ordinal scale',
        },
        justification: 'Primary categorical encoding',
      },
      secondaryEncodings: [],
      colorStrategy: {
        scheme: 'categorical',
        palette: 'category10',
        accessibility: {
          colorBlindnessSafe: true,
          contrastRatio: 4.5,
          alternativeEncodings: ['pattern'],
          screenReaderGuidance: `Categories of ${columnAnalysis.columnName}`,
        },
        reasoning: 'Categorical color scheme for distinct categories',
      },
      aestheticOptimizations: [],
    };
  }

  private static generateCategoricalInteractions(
    chartType: string,
    uniqueValues: number,
  ): InteractionRecommendation[] {
    return [
      {
        interactionType: 'hover',
        purpose: 'Show category details',
        implementation: 'Tooltip with frequency and percentage',
        priority: 'essential',
        statisticalBenefit: 'Provides exact frequency information',
      },
    ];
  }

  private static generateCategoricalAlternatives(
    chartType: string,
    uniqueValues: number,
    entropy: number,
  ): AlternativeChartOption[] {
    const alternatives: AlternativeChartOption[] = [];

    // For bar charts, suggest alternatives based on cardinality and entropy
    if (chartType === 'bar_chart' || chartType === 'horizontal_bar_chart') {
      if (uniqueValues <= 5 && entropy > 1.0) {
        alternatives.push({
          chartType: 'pie_chart',
          confidence: 0.8,
          tradeoffs: 'Shows proportions clearly but harder to compare exact values',
          whenToUse: 'When emphasizing part-to-whole relationships',
          statisticalSuitability: 0.85,
        });

        alternatives.push({
          chartType: 'donut_chart',
          confidence: 0.75,
          tradeoffs: 'Better space utilization but harder to compare small segments',
          whenToUse: 'When space is limited and proportions are important',
          statisticalSuitability: 0.75,
        });
      }

      if (uniqueValues > 10) {
        alternatives.push({
          chartType: 'treemap',
          confidence: 0.7,
          tradeoffs: 'Handles many categories well but less precise value comparison',
          whenToUse: 'When dealing with high cardinality categorical data',
          statisticalSuitability: 0.8,
        });
      }
    }

    // For pie charts, suggest bar chart alternative
    if (chartType === 'pie_chart') {
      alternatives.push({
        chartType: 'bar_chart',
        confidence: 0.85,
        tradeoffs: 'Better for precise value comparison but loses part-to-whole context',
        whenToUse: 'When exact value comparison is more important than proportions',
        statisticalSuitability: 0.9,
      });
    }

    // For high cardinality, suggest packed bubble chart
    if (uniqueValues > 20) {
      alternatives.push({
        chartType: 'packed_bubble',
        confidence: 0.65,
        tradeoffs: 'Visually appealing for many categories but imprecise value reading',
        whenToUse: 'When visual impact is important and precise values are secondary',
        statisticalSuitability: 0.6,
      });
    }

    return alternatives;
  }

  private static generateBivariateInteractions(
    chartType: string,
    correlationStrength: string,
  ): InteractionRecommendation[] {
    const interactions: InteractionRecommendation[] = [];

    // Essential hover interaction for all bivariate charts
    interactions.push({
      interactionType: 'hover',
      purpose: 'Show point details and statistical context',
      implementation: 'Tooltip with coordinates, residuals, and leverage values',
      priority: 'essential',
      statisticalBenefit: 'Provides immediate access to point-level statistics',
    });

    // Brush selection for subset analysis
    interactions.push({
      interactionType: 'brush',
      purpose: 'Select data subset for analysis',
      implementation: 'Brush selection with linked summary statistics and correlation update',
      priority: 'recommended',
      statisticalBenefit: 'Enables subset analysis and outlier investigation',
    });

    // Zoom for detailed examination
    if (chartType.includes('scatter') || chartType.includes('hexbin')) {
      interactions.push({
        interactionType: 'zoom',
        purpose: 'Examine dense regions in detail',
        implementation: 'Semantic zoom maintaining statistical context',
        priority: 'recommended',
        statisticalBenefit: 'Allows detailed examination of high-density regions',
      });
    }

    // Filter for outlier management
    interactions.push({
      interactionType: 'filter',
      purpose: 'Remove outliers or focus on data ranges',
      implementation: 'Interactive filtering with real-time correlation updates',
      priority: 'optional',
      statisticalBenefit: 'Enables robust analysis by handling outliers systematically',
    });

    // For strong correlations, add trend line interaction
    if (correlationStrength === 'strong' || correlationStrength === 'very_strong') {
      interactions.push({
        interactionType: 'click',
        purpose: 'Toggle regression line and confidence intervals',
        implementation: 'Click to show/hide trend analysis with R² and confidence bands',
        priority: 'recommended',
        statisticalBenefit: 'Provides immediate access to regression analysis',
      });
    }

    return interactions;
  }

  private static generateBivariateAlternatives(
    chartType: string,
    totalPoints: number,
    relationshipType: string,
  ): AlternativeChartOption[] {
    const alternatives: AlternativeChartOption[] = [];

    // For scatter plots
    if (chartType === 'scatter_plot') {
      if (totalPoints > 5000) {
        alternatives.push({
          chartType: 'hexbin_plot',
          confidence: 0.85,
          tradeoffs: 'Better for large datasets but loses individual point detail',
          whenToUse: 'When data density patterns are more important than individual points',
          statisticalSuitability: 0.9,
        });

        alternatives.push({
          chartType: 'density_scatter',
          confidence: 0.8,
          tradeoffs: 'Reveals density patterns but may obscure outliers',
          whenToUse: 'For very large datasets where overplotting is a concern',
          statisticalSuitability: 0.85,
        });
      }

      if (relationshipType === 'non_linear') {
        alternatives.push({
          chartType: 'smooth_scatter',
          confidence: 0.8,
          tradeoffs: 'Shows trend clearly but may oversimplify complex relationships',
          whenToUse: 'When trend visualization is more important than individual points',
          statisticalSuitability: 0.85,
        });
      }

      alternatives.push({
        chartType: 'contour_plot',
        confidence: 0.7,
        tradeoffs: 'Shows density patterns but loses individual point detail',
        whenToUse: 'For large datasets where point density is important',
        statisticalSuitability: 0.8,
      });
    }

    // For hexbin plots
    if (chartType === 'hexbin_plot') {
      alternatives.push({
        chartType: 'scatter_plot',
        confidence: 0.6,
        tradeoffs: 'Shows individual points but may have overplotting issues',
        whenToUse: 'When individual point analysis is needed despite large dataset',
        statisticalSuitability: 0.7,
      });

      alternatives.push({
        chartType: 'heatmap_2d',
        confidence: 0.75,
        tradeoffs: 'Regular grid may not align well with data distribution',
        whenToUse: 'When rectangular binning is preferred over hexagonal',
        statisticalSuitability: 0.8,
      });
    }

    // For large datasets, always suggest sampling approach
    if (totalPoints > 50000) {
      alternatives.push({
        chartType: 'sampled_scatter',
        confidence: 0.7,
        tradeoffs: 'Faster rendering but may miss important data patterns',
        whenToUse: 'When performance is critical and patterns are robust to sampling',
        statisticalSuitability: 0.75,
      });
    }

    return alternatives;
  }

  private static createFallbackRecommendation(
    columnAnalysis: ColumnAnalysis,
    defaultChart: string = 'bar_chart',
  ): StatisticalChartRecommendation {
    return {
      chartType: defaultChart,
      confidence: 0.3,
      statisticalJustification: 'Default recommendation - statistical analysis incomplete',
      dataCharacteristics: ['Insufficient statistical analysis'],
      visualEncodingStrategy: {
        primaryEncoding: {
          channel: 'x',
          dataField: columnAnalysis.columnName,
          dataType: 'nominal',
          scale: { type: 'ordinal', domain: [], reasoning: 'Default scale' },
          justification: 'Default encoding',
        },
        secondaryEncodings: [],
        colorStrategy: {
          scheme: 'categorical',
          palette: 'category10',
          accessibility: {
            colorBlindnessSafe: true,
            contrastRatio: 4.5,
            alternativeEncodings: [],
            screenReaderGuidance: 'Default chart',
          },
          reasoning: 'Default color strategy',
        },
        aestheticOptimizations: [],
      },
      interactionRecommendations: [],
      alternativeOptions: [],
      performanceConsiderations: {
        dataPointThreshold: 10000,
        aggregationSuggestions: [],
        renderingOptimizations: [],
        memoryConsiderations: [],
      },
    };
  }

  private static createFallbackBivariateRecommendation(
    xColumn: ColumnAnalysis,
    yColumn: ColumnAnalysis,
    defaultChart: string = 'scatter_plot',
  ): StatisticalChartRecommendation {
    return {
      chartType: defaultChart,
      confidence: 0.5,
      statisticalJustification: 'Default bivariate recommendation',
      dataCharacteristics: ['Bivariate relationship analysis incomplete'],
      visualEncodingStrategy: {
        primaryEncoding: {
          channel: 'x',
          dataField: xColumn.columnName,
          dataType: 'quantitative',
          scale: { type: 'linear', domain: [0, 100], reasoning: 'Default linear scale' },
          justification: 'Default x-axis encoding',
        },
        secondaryEncodings: [
          {
            channel: 'y',
            dataField: yColumn.columnName,
            dataType: 'quantitative',
            scale: { type: 'linear', domain: [0, 100], reasoning: 'Default linear scale' },
            justification: 'Default y-axis encoding',
          },
        ],
        colorStrategy: {
          scheme: 'categorical',
          palette: 'category10',
          accessibility: {
            colorBlindnessSafe: true,
            contrastRatio: 4.5,
            alternativeEncodings: [],
            screenReaderGuidance: 'Default bivariate chart',
          },
          reasoning: 'Default color strategy',
        },
        aestheticOptimizations: [],
      },
      interactionRecommendations: [],
      alternativeOptions: [],
      performanceConsiderations: {
        dataPointThreshold: 10000,
        aggregationSuggestions: [],
        renderingOptimizations: [],
        memoryConsiderations: [],
      },
    };
  }
}
