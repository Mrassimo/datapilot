/**
 * Statistical Chart Selector Tests
 * 
 * Comprehensive tests for the statistical-driven chart selection engine that analyzes
 * data characteristics to make intelligent visualization recommendations.
 */

/// <reference path="../../jest-custom-matchers.d.ts" />

import { StatisticalChartSelector } from '../../../src/analyzers/visualization/engines/statistical-chart-selector';
import type { ColumnAnalysis, BivariateAnalysis } from '../../../src/analyzers/eda/types';
import { EdaDataType } from '../../../src/analyzers/eda/types';
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
    dataType: EdaDataType.CONTINUOUS,
    basicStats: {
      count: 1000,
      mean: 50.5,
      std: 15.2,
      min: 10,
      max: 100,
      median: 52,
      q1: 40,
      q3: 65
    },
    distribution: {
      skewness: 0.2,
      kurtosis: -0.5,
      normality: 0.85,
      outliers: [5, 95, 98]
    },
    quality: {
      completeness: 0.98,
      uniqueness: 0.95
    }
  } as ColumnAnalysis;

  const mockCategoricalColumn: ColumnAnalysis = {
    dataType: EdaDataType.CATEGORICAL,
    basicStats: {
      count: 1000,
      uniqueCount: 5,
      mode: 'Category A',
      modeFrequency: 300
    },
    distribution: {
      frequencies: {
        'Category A': 300,
        'Category B': 250,
        'Category C': 200,
        'Category D': 150,
        'Category E': 100
      }
    },
    quality: {
      completeness: 1.0,
      uniqueness: 0.5
    }
  } as ColumnAnalysis;

  const mockTemporalColumn: ColumnAnalysis = {
    dataType: EdaDataType.TEMPORAL,
    basicStats: {
      count: 365,
      min: '2023-01-01',
      max: '2023-12-31'
    },
    distribution: {
      timeGranularity: 'daily',
      seasonality: true,
      trend: 'increasing'
    },
    quality: {
      completeness: 0.99
    }
  } as ColumnAnalysis;

  const mockBivariateAnalysis: BivariateAnalysis = {
    variable1: 'sales',
    variable2: 'category',
    analysisType: 'categorical_continuous',
    correlation: 0.65,
    pValue: 0.001,
    effectSize: 0.4,
    strength: 'strong',
    confidence: 0.95
  };

  describe('selectUnivariateChart', () => {
    it('should recommend histogram for normal continuous data', () => {
      const recommendation = StatisticalChartSelector.selectUnivariateChart(
        'sales',
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
        distribution: {
          ...mockContinuousColumn.distribution!,
          skewness: 2.5,
          normality: 0.3
        }
      };

      const recommendation = StatisticalChartSelector.selectUnivariateChart(
        'skewed_sales',
        skewedColumn
      );

      expect(recommendation.chartType).toBe('box_plot');
      expect(recommendation.statisticalJustification).toContain('skewed');
    });

    it('should recommend bar chart for categorical data', () => {
      const recommendation = StatisticalChartSelector.selectUnivariateChart(
        'category',
        mockCategoricalColumn
      );

      expect(recommendation.chartType).toBe('bar_chart');
      expect(recommendation.confidence).toBeGreaterThan(0.8);
      expect(recommendation.dataCharacteristics).toContain('categorical');
    });

    it('should recommend line chart for temporal data', () => {
      const recommendation = StatisticalChartSelector.selectUnivariateChart(
        'date',
        mockTemporalColumn
      );

      expect(recommendation.chartType).toBe('line_chart');
      expect(recommendation.statisticalJustification).toContain('temporal');
      expect(recommendation.visualEncodingStrategy.primaryEncoding.channel).toBe('x');
    });

    it('should provide alternative chart options', () => {
      const recommendation = StatisticalChartSelector.selectUnivariateChart(
        'sales',
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
        basicStats: {
          ...mockContinuousColumn.basicStats,
          count: 100000
        }
      };

      const recommendation = StatisticalChartSelector.selectUnivariateChart(
        'large_dataset',
        largeDataColumn
      );

      expect(recommendation.performanceConsiderations).toBeDefined();
      expect(recommendation.performanceConsiderations.dataPointThreshold).toBeDefined();
    });
  });

  describe('selectBivariateChart', () => {
    it('should recommend scatter plot for continuous-continuous relationships', () => {
      const continuousBivariate: BivariateAnalysis = {
        variable1: 'sales',
        variable2: 'profit',
        analysisType: 'continuous_continuous',
        correlation: 0.8,
        pValue: 0.001,
        effectSize: 0.6,
        strength: 'strong'
      };

      const recommendation = StatisticalChartSelector.selectBivariateChart(
        continuousBivariate,
        mockContinuousColumn,
        mockContinuousColumn
      );

      expect(recommendation.chartType).toBe('scatter_plot');
      expect(recommendation.confidence).toBeGreaterThan(0.7);
      expect(recommendation.statisticalJustification).toContain('correlation');
    });

    it('should recommend grouped bar chart for categorical-continuous relationships', () => {
      const recommendation = StatisticalChartSelector.selectBivariateChart(
        mockBivariateAnalysis,
        mockCategoricalColumn,
        mockContinuousColumn
      );

      expect(recommendation.chartType).toBe('grouped_bar_chart');
      expect(recommendation.statisticalJustification).toContain('categorical');
    });

    it('should recommend heatmap for categorical-categorical relationships', () => {
      const categoricalBivariate: BivariateAnalysis = {
        variable1: 'category1',
        variable2: 'category2',
        analysisType: 'categorical_categorical',
        correlation: 0.4,
        pValue: 0.05,
        effectSize: 0.3,
        strength: 'moderate'
      };

      const recommendation = StatisticalChartSelector.selectBivariateChart(
        categoricalBivariate,
        mockCategoricalColumn,
        mockCategoricalColumn
      );

      expect(recommendation.chartType).toBe('heatmap');
      expect(recommendation.visualEncodingStrategy.colorStrategy.scheme).toBe('sequential');
    });

    it('should handle weak relationships appropriately', () => {
      const weakBivariate: BivariateAnalysis = {
        ...mockBivariateAnalysis,
        correlation: 0.1,
        strength: 'weak'
      };

      const recommendation = StatisticalChartSelector.selectBivariateChart(
        weakBivariate,
        mockCategoricalColumn,
        mockContinuousColumn
      );

      expect(recommendation.confidence).toBeLessThan(0.6);
      expect(recommendation.alternativeOptions.length).toBeGreaterThan(0);
    });
  });

  describe('optimizeForDataSize', () => {
    it('should suggest sampling for large datasets', () => {
      const largeDataRecommendation: StatisticalChartRecommendation = {
        chartType: 'scatter_plot',
        confidence: 0.8,
        statisticalJustification: 'Strong correlation',
        dataCharacteristics: ['large_dataset'],
        visualEncodingStrategy: {} as VisualEncodingStrategy,
        interactionRecommendations: [],
        alternativeOptions: [],
        performanceConsiderations: {} as PerformanceGuidance
      };

      const optimized = StatisticalChartSelector.optimizeForDataSize(
        largeDataRecommendation,
        100000
      );

      expect(optimized.performanceConsiderations.samplingStrategy).toBeDefined();
      expect(optimized.performanceConsiderations.dataPointThreshold).toBeLessThan(100000);
    });

    it('should not suggest sampling for small datasets', () => {
      const smallDataRecommendation: StatisticalChartRecommendation = {
        chartType: 'bar_chart',
        confidence: 0.9,
        statisticalJustification: 'Categorical data',
        dataCharacteristics: ['small_dataset'],
        visualEncodingStrategy: {} as VisualEncodingStrategy,
        interactionRecommendations: [],
        alternativeOptions: [],
        performanceConsiderations: {} as PerformanceGuidance
      };

      const optimized = StatisticalChartSelector.optimizeForDataSize(
        smallDataRecommendation,
        100
      );

      expect(optimized.performanceConsiderations.samplingStrategy).toBeUndefined();
    });
  });

  describe('generateInteractionRecommendations', () => {
    it('should recommend appropriate interactions for scatter plots', () => {
      const interactions = StatisticalChartSelector.generateInteractionRecommendations(
        'scatter_plot',
        mockBivariateAnalysis
      );

      expect(interactions).toBeInstanceOf(Array);
      expect(interactions.length).toBeGreaterThan(0);
      
      const hasTooltip = interactions.some(i => i.interactionType === 'hover');
      const hasZoom = interactions.some(i => i.interactionType === 'zoom');
      
      expect(hasTooltip).toBe(true);
      expect(hasZoom).toBe(true);
    });

    it('should recommend filtering for categorical data', () => {
      const interactions = StatisticalChartSelector.generateInteractionRecommendations(
        'bar_chart',
        mockBivariateAnalysis
      );

      const hasFilter = interactions.some(i => i.interactionType === 'filter');
      expect(hasFilter).toBe(true);
    });

    it('should prioritize essential interactions', () => {
      const interactions = StatisticalChartSelector.generateInteractionRecommendations(
        'line_chart',
        mockBivariateAnalysis
      );

      const essentialInteractions = interactions.filter(i => i.priority === 'essential');
      expect(essentialInteractions.length).toBeGreaterThan(0);
    });
  });

  describe('error handling and edge cases', () => {
    it('should handle missing statistical data gracefully', () => {
      const incompleteColumn = {
        ...mockContinuousColumn,
        distribution: undefined
      } as ColumnAnalysis;

      const recommendation = StatisticalChartSelector.selectUnivariateChart(
        'incomplete_data',
        incompleteColumn
      );

      expect(recommendation.chartType).toBeDefined();
      expect(recommendation.confidence).toBeLessThan(0.5);
    });

    it('should handle extreme outliers', () => {
      const outlierColumn = {
        ...mockContinuousColumn,
        distribution: {
          ...mockContinuousColumn.distribution!,
          outliers: Array.from({ length: 100 }, (_, i) => i * 1000)
        }
      };

      const recommendation = StatisticalChartSelector.selectUnivariateChart(
        'outlier_data',
        outlierColumn
      );

      expect(recommendation.chartType).toBeDefined();
      expect(recommendation.dataCharacteristics).toContain('outliers');
    });

    it('should handle very small datasets', () => {
      const smallColumn = {
        ...mockContinuousColumn,
        basicStats: {
          ...mockContinuousColumn.basicStats,
          count: 5
        }
      };

      const recommendation = StatisticalChartSelector.selectUnivariateChart(
        'small_data',
        smallColumn
      );

      expect(recommendation.performanceConsiderations.dataPointThreshold).toBeLessThan(10);
    });
  });

  describe('visual encoding strategies', () => {
    it('should provide appropriate color strategies for categorical data', () => {
      const recommendation = StatisticalChartSelector.selectUnivariateChart(
        'category',
        mockCategoricalColumn
      );

      expect(recommendation.visualEncodingStrategy.colorStrategy.scheme).toBe('categorical');
      expect(recommendation.visualEncodingStrategy.colorStrategy.accessibility).toBeDefined();
    });

    it('should provide appropriate size encodings for continuous data', () => {
      const recommendation = StatisticalChartSelector.selectBivariateChart(
        mockBivariateAnalysis,
        mockCategoricalColumn,
        mockContinuousColumn
      );

      if (recommendation.visualEncodingStrategy.sizeStrategy) {
        expect(recommendation.visualEncodingStrategy.sizeStrategy.scaling).toBeDefined();
        expect(recommendation.visualEncodingStrategy.sizeStrategy.minSize).toBeGreaterThan(0);
      }
    });

    it('should include aesthetic optimizations', () => {
      const recommendation = StatisticalChartSelector.selectUnivariateChart(
        'sales',
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