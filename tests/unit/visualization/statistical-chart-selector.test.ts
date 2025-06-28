/**
 * Statistical Chart Selector Tests
 * 
 * Comprehensive tests for the statistical-driven chart selection engine that analyzes
 * data characteristics to make intelligent visualization recommendations.
 */

/// <reference path="../../jest-custom-matchers.d.ts" />

import { StatisticalChartSelector } from '../../../src/analyzers/visualization/engines/statistical-chart-selector';
import type { ColumnAnalysis, BivariateAnalysis, NumericalColumnAnalysis, CategoricalColumnAnalysis, DateTimeAnalysis } from '../../../src/analyzers/eda/types';
import { EdaDataType, SemanticType } from '../../../src/analyzers/eda/types';
import type {
  StatisticalChartRecommendation,
  VisualEncodingStrategy,
  InteractionRecommendation,
  AlternativeChartOption,
  PerformanceGuidance
} from '../../../src/analyzers/visualization/engines/statistical-chart-selector';

describe('StatisticalChartSelector', () => {
  // Test data fixtures
  const mockContinuousColumn: ColumnAnalysis = {
    columnName: 'test_continuous',
    detectedDataType: EdaDataType.NUMERICAL_FLOAT,
    inferredSemanticType: SemanticType.UNKNOWN,
    dataQualityFlag: 'good',
    totalValues: 1000,
    missingValues: 20,
    missingPercentage: 2,
    uniqueValues: 950,
    uniquePercentage: 95,
    descriptiveStats: {
      minimum: 10,
      maximum: 100,
      range: 90,
      sum: 50500,
      mean: 50.5,
      median: 52,
      modes: [{ value: 50, frequency: 10, percentage: 1 }],
      standardDeviation: 15.2,
      variance: 231.04,
      coefficientOfVariation: 0.301
    },
    quantileStats: {
      percentile1st: 15,
      percentile5th: 20,
      percentile10th: 25,
      quartile1st: 40,
      quartile3rd: 65,
      percentile90th: 85,
      percentile95th: 90,
      percentile99th: 95,
      interquartileRange: 25,
      medianAbsoluteDeviation: 12.5
    },
    distributionAnalysis: {
      skewness: 0.2,
      skewnessInterpretation: 'nearly symmetric',
      kurtosis: -0.5,
      kurtosisInterpretation: 'platykurtic',
      histogramSummary: 'normal distribution'
    },
    normalityTests: {
      shapiroWilk: { statistic: 0.98, pValue: 0.15, interpretation: 'normal' },
      jarqueBera: { statistic: 2.1, pValue: 0.35, interpretation: 'normal' },
      kolmogorovSmirnov: { statistic: 0.03, pValue: 0.8, interpretation: 'normal' }
    },
    outlierAnalysis: {
      iqrMethod: {
        lowerFence: 2.5,
        upperFence: 102.5,
        lowerOutliers: 1,
        upperOutliers: 2,
        lowerPercentage: 0.1,
        upperPercentage: 0.2,
        extremeOutliers: 0,
        extremePercentage: 0
      },
      zScoreMethod: { threshold: 3, lowerOutliers: 1, upperOutliers: 2 },
      modifiedZScoreMethod: { threshold: 3.5, outliers: 3 },
      summary: {
        totalOutliers: 3,
        totalPercentage: 0.3,
        minOutlierValue: 5,
        maxOutlierValue: 98,
        potentialImpact: 'minimal'
      }
    },
    numericalPatterns: {
      zeroValuePercentage: 0,
      negativeValuePercentage: 0,
      roundNumbersNote: 'few round numbers',
      logTransformationPotential: 'not needed'
    }
  } as NumericalColumnAnalysis;

  const mockCategoricalColumn: ColumnAnalysis = {
    columnName: 'test_categorical',
    detectedDataType: EdaDataType.CATEGORICAL,
    inferredSemanticType: SemanticType.CATEGORY,
    dataQualityFlag: 'excellent',
    totalValues: 1000,
    missingValues: 0,
    missingPercentage: 0,
    uniqueValues: 5,
    uniquePercentage: 0.5,
    uniqueCategories: 5,
    mostFrequentCategory: { label: 'Category A', count: 300, percentage: 30, cumulativePercentage: 30 },
    secondMostFrequentCategory: { label: 'Category B', count: 250, percentage: 25, cumulativePercentage: 55 },
    leastFrequentCategory: { label: 'Category E', count: 100, percentage: 10, cumulativePercentage: 100 },
    frequencyDistribution: [
      { label: 'Category A', count: 300, percentage: 30, cumulativePercentage: 30 },
      { label: 'Category B', count: 250, percentage: 25, cumulativePercentage: 55 },
      { label: 'Category C', count: 200, percentage: 20, cumulativePercentage: 75 },
      { label: 'Category D', count: 150, percentage: 15, cumulativePercentage: 90 },
      { label: 'Category E', count: 100, percentage: 10, cumulativePercentage: 100 }
    ],
    diversityMetrics: {
      shannonEntropy: 2.2,
      maxEntropy: 2.32,
      giniImpurity: 0.72,
      balanceInterpretation: 'well balanced',
      majorCategoryDominance: 'moderate'
    },
    labelAnalysis: {
      minLabelLength: 10,
      maxLabelLength: 10,
      avgLabelLength: 10,
      emptyLabelsCount: 0
    },
    recommendations: {}
  } as CategoricalColumnAnalysis;

  const mockTemporalColumn: ColumnAnalysis = {
    columnName: 'test_datetime',
    detectedDataType: EdaDataType.DATE_TIME,
    inferredSemanticType: SemanticType.DATE_TRANSACTION,
    dataQualityFlag: 'good',
    totalValues: 365,
    missingValues: 4,
    missingPercentage: 1.1,
    uniqueValues: 361,
    uniquePercentage: 98.9,
    minDateTime: new Date('2023-01-01'),
    maxDateTime: new Date('2023-12-31'),
    timeSpan: '365 days',
    detectedGranularity: 'daily',
    implicitPrecision: 'day',
    mostCommonYears: ['2023'],
    mostCommonMonths: ['January', 'February', 'March'],
    mostCommonDaysOfWeek: ['Monday', 'Tuesday', 'Wednesday'],
    mostCommonHours: [],
    temporalPatterns: 'regular daily pattern',
    gapAnalysis: 'few missing dates',
    validityNotes: 'all dates valid'
  } as ColumnAnalysis;

  const mockBivariateAnalysis: BivariateAnalysis = {
    numericalVsNumerical: {
      totalPairsAnalyzed: 1,
      correlationPairs: [{
        variable1: 'sales',
        variable2: 'profit',
        correlation: 0.65,
        pearsonCorrelation: 0.65,
        spearmanCorrelation: 0.62,
        pValue: 0.001,
        strength: 'strong',
        direction: 'positive',
        significance: 'significant',
        sampleSize: 1000,
        interpretation: 'strong positive correlation'
      }],
      strongestPositiveCorrelation: {
        variable1: 'sales',
        variable2: 'profit',
        correlation: 0.65,
        pearsonCorrelation: 0.65,
        spearmanCorrelation: 0.62,
        pValue: 0.001,
        strength: 'strong',
        direction: 'positive',
        significance: 'significant',
        sampleSize: 1000,
        interpretation: 'strong positive correlation'
      },
      strongestNegativeCorrelation: null,
      strongCorrelations: [],
      scatterPlotInsights: [{
        variable1: 'sales',
        variable2: 'profit',
        pattern: 'linear',
        outlierCount: 5,
        recommendedVisualization: 'scatter_plot',
        insights: 'strong linear relationship'
      }],
      regressionInsights: [{
        dependent: 'profit',
        independent: 'sales',
        rSquared: 0.42,
        slope: 0.8,
        intercept: 100
      }]
    },
    numericalVsCategorical: [],
    categoricalVsCategorical: []
  };

  describe('selectUnivariateChart', () => {
    it('should recommend histogram for normal continuous data', () => {
      const recommendation = StatisticalChartSelector.recommendUnivariateChart(
        mockContinuousColumn
      );

      expect(recommendation.chartType).toBe('histogram');
      expect(recommendation.confidence).toBeGreaterThan(0.7);
      expect(recommendation.statisticalJustification).toContain('normal');
      expect(recommendation.visualEncodingStrategy).toBeDefined();
    });

    it('should recommend box plot for skewed continuous data', () => {
      const skewedColumn = {
        ...mockContinuousColumn,
        distributionAnalysis: {
          ...mockContinuousColumn.distributionAnalysis!,
          skewness: 2.5,
          skewnessInterpretation: 'highly skewed',
          kurtosis: 1.2,
          kurtosisInterpretation: 'leptokurtic',
          histogramSummary: 'right skewed distribution'
        }
      };

      const recommendation = StatisticalChartSelector.recommendUnivariateChart(
        skewedColumn
      );

      expect(recommendation.chartType).toBe('box_plot');
      expect(recommendation.statisticalJustification).toContain('skewed');
    });

    it('should recommend bar chart for categorical data', () => {
      const recommendation = StatisticalChartSelector.recommendUnivariateChart(
        mockCategoricalColumn
      );

      expect(recommendation.chartType).toBe('bar_chart');
      expect(recommendation.confidence).toBeGreaterThan(0.8);
      expect(recommendation.dataCharacteristics).toContain('categorical');
    });

    it('should recommend line chart for temporal data', () => {
      const recommendation = StatisticalChartSelector.recommendUnivariateChart(
        mockTemporalColumn
      );

      expect(recommendation.chartType).toBe('line_chart');
      expect(recommendation.statisticalJustification).toContain('temporal');
      expect(recommendation.visualEncodingStrategy.primaryEncoding.channel).toBe('x');
    });

    it('should provide alternative chart options', () => {
      const recommendation = StatisticalChartSelector.recommendUnivariateChart(
        mockContinuousColumn
      );

      expect(recommendation.alternativeOptions).toBeInstanceOf(Array);
      expect(recommendation.alternativeOptions.length).toBeGreaterThan(0);
      
      const alternative = recommendation.alternativeOptions[0];
      expect(alternative.chartType).toBeDefined();
      expect(alternative.confidence).toBeDefined();
      expect(alternative.tradeoffs).toBeDefined();
    });

    it('should include performance considerations', () => {
      const largeDataColumn = {
        ...mockContinuousColumn,
        descriptiveStats: {
          ...mockContinuousColumn.descriptiveStats,
          sum: 5050000
        },
        totalValues: 100000
      };

      const recommendation = StatisticalChartSelector.recommendUnivariateChart(
        largeDataColumn
      );

      expect(recommendation.performanceConsiderations).toBeDefined();
      expect(recommendation.performanceConsiderations.dataPointThreshold).toBeDefined();
    });
  });

  describe('selectBivariateChart', () => {
    it('should recommend scatter plot for continuous-continuous relationships', () => {
      // Use the existing mock bivariate analysis

      const recommendation = StatisticalChartSelector.recommendBivariateChart(
        mockContinuousColumn,
        mockContinuousColumn
      );

      expect(recommendation.chartType).toBe('scatter_plot');
      expect(recommendation.confidence).toBeGreaterThan(0.7);
      expect(recommendation.statisticalJustification).toContain('correlation');
    });

    it('should recommend grouped bar chart for categorical-continuous relationships', () => {
      const recommendation = StatisticalChartSelector.recommendBivariateChart(
        mockCategoricalColumn,
        mockContinuousColumn
      );

      expect(recommendation.chartType).toBe('grouped_bar_chart');
      expect(recommendation.statisticalJustification).toContain('categorical');
    });

    it('should recommend heatmap for categorical-categorical relationships', () => {
      // Use categorical-categorical bivariate analysis

      const recommendation = StatisticalChartSelector.recommendBivariateChart(
        mockCategoricalColumn,
        mockCategoricalColumn
      );

      expect(recommendation.chartType).toBe('heatmap');
      expect(recommendation.visualEncodingStrategy.colorStrategy.scheme).toBe('sequential');
    });

    it('should handle weak relationships appropriately', () => {
      // Use mock bivariate analysis with weak correlation
      const weakBivariate = {
        ...mockBivariateAnalysis,
        numericalVsNumerical: {
          ...mockBivariateAnalysis.numericalVsNumerical,
          correlationPairs: [{
            ...mockBivariateAnalysis.numericalVsNumerical.correlationPairs[0],
            correlation: 0.1,
            strength: 'weak'
          }]
        }
      };

      const recommendation = StatisticalChartSelector.recommendBivariateChart(
        mockCategoricalColumn,
        mockContinuousColumn
      );

      expect(recommendation.confidence).toBeLessThan(0.6);
      expect(recommendation.alternativeOptions.length).toBeGreaterThan(0);
    });
  });



  describe('error handling and edge cases', () => {
    it('should handle missing statistical data gracefully', () => {
      const incompleteColumn = {
        ...mockContinuousColumn,
        distributionAnalysis: undefined
      } as ColumnAnalysis;

      const recommendation = StatisticalChartSelector.recommendUnivariateChart(
        incompleteColumn
      );

      expect(recommendation.chartType).toBeDefined();
      expect(recommendation.confidence).toBeLessThan(0.5);
    });

    it('should handle extreme outliers', () => {
      const outlierColumn = {
        ...mockContinuousColumn,
        outlierAnalysis: {
          ...mockContinuousColumn.outlierAnalysis!,
          summary: {
            ...mockContinuousColumn.outlierAnalysis!.summary,
            totalOutliers: 100,
            totalPercentage: 10
          }
        }
      };

      const recommendation = StatisticalChartSelector.recommendUnivariateChart(
        outlierColumn
      );

      expect(recommendation.chartType).toBeDefined();
      expect(recommendation.dataCharacteristics).toContain('outliers');
    });

    it('should handle very small datasets', () => {
      const smallColumn = {
        ...mockContinuousColumn,
        descriptiveStats: {
          ...mockContinuousColumn.descriptiveStats,
          sum: 25
        },
        totalValues: 5
      };

      const recommendation = StatisticalChartSelector.recommendUnivariateChart(
        smallColumn
      );

      expect(recommendation.performanceConsiderations.dataPointThreshold).toBeLessThan(10);
    });
  });

  describe('visual encoding strategies', () => {
    it('should provide appropriate color strategies for categorical data', () => {
      const recommendation = StatisticalChartSelector.recommendUnivariateChart(
        mockCategoricalColumn
      );

      expect(recommendation.visualEncodingStrategy.colorStrategy.scheme).toBe('categorical');
      expect(recommendation.visualEncodingStrategy.colorStrategy.accessibility).toBeDefined();
    });

    it('should provide appropriate size encodings for continuous data', () => {
      const recommendation = StatisticalChartSelector.recommendBivariateChart(
        mockCategoricalColumn,
        mockContinuousColumn
      );

      if (recommendation.visualEncodingStrategy.sizeStrategy) {
        expect(recommendation.visualEncodingStrategy.sizeStrategy.scaling).toBeDefined();
        expect(recommendation.visualEncodingStrategy.sizeStrategy.minSize).toBeGreaterThan(0);
      }
    });

    it('should include aesthetic optimizations', () => {
      const recommendation = StatisticalChartSelector.recommendUnivariateChart(
        mockContinuousColumn
      );

      expect(recommendation.visualEncodingStrategy.aestheticOptimizations).toBeInstanceOf(Array);
      
      if (recommendation.visualEncodingStrategy.aestheticOptimizations.length > 0) {
        const optimization = recommendation.visualEncodingStrategy.aestheticOptimizations[0];
        expect(optimization.property).toBeDefined();
        expect(optimization.reasoning).toBeDefined();
        expect(optimization.impact).toMatch(/^(high|medium|low)$/);
      }
    });
  });
});