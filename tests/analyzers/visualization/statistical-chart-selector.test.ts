/**
 * Comprehensive tests for Statistical Chart Selector Engine
 */

import { StatisticalChartSelector } from '../../../src/analyzers/visualization/engines/statistical-chart-selector';
import { EdaDataType } from '../../../src/analyzers/eda/types';

describe('Statistical Chart Selector Engine', () => {
  // Mock column analysis data
  const createMockColumnAnalysis = (overrides: any = {}) => ({
    columnName: 'test_column',
    detectedDataType: EdaDataType.NUMERICAL_FLOAT,
    totalValues: 1000,
    uniqueValues: 800,
    missingValues: 50,
    descriptiveStats: {
      minimum: 0,
      maximum: 100,
      mean: 50,
      median: 48,
      standardDeviation: 15
    },
    distributionAnalysis: {
      skewness: 0.2,
      kurtosis: 0.1
    },
    outlierAnalysis: {
      totalOutliers: 25
    },
    frequencyDistribution: {
      'A': 100,
      'B': 200,
      'C': 150,
      'D': 300,
      'E': 250
    },
    ...overrides
  });

  describe('Univariate Chart Recommendations', () => {
    test('should recommend histogram for high-cardinality numerical data', () => {
      const columnAnalysis = createMockColumnAnalysis({
        detectedDataType: EdaDataType.NUMERICAL_FLOAT,
        uniqueValues: 900,
        totalValues: 1000
      });

      const result = StatisticalChartSelector.recommendUnivariateChart(columnAnalysis);

      expect(result.chartType).toBe('histogram');
      expect(result.confidence).toBeGreaterThan(0.7);
      expect(result.statisticalJustification).toContain('cardinality');
    });

    test('should recommend density plot for normal distribution with high cardinality', () => {
      const columnAnalysis = createMockColumnAnalysis({
        detectedDataType: EdaDataType.NUMERICAL_FLOAT,
        uniqueValues: 950,
        totalValues: 1000,
        distributionAnalysis: {
          skewness: 0.1,
          kurtosis: 0.05
        },
        outlierAnalysis: {
          totalOutliers: 5
        }
      });

      const result = StatisticalChartSelector.recommendUnivariateChart(columnAnalysis);

      expect(['density_plot', 'histogram']).toContain(result.chartType);
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    test('should recommend violin plot for data with severe outliers', () => {
      const columnAnalysis = createMockColumnAnalysis({
        detectedDataType: EdaDataType.NUMERICAL_FLOAT,
        uniqueValues: 800,
        totalValues: 1000,
        outlierAnalysis: {
          totalOutliers: 150 // 15% outliers = severe
        }
      });

      const result = StatisticalChartSelector.recommendUnivariateChart(columnAnalysis);

      expect(result.chartType).toBe('violin_plot');
      expect(result.statisticalJustification).toContain('outlier');
    });

    test('should recommend bar chart for low-cardinality numerical data', () => {
      const columnAnalysis = createMockColumnAnalysis({
        detectedDataType: EdaDataType.NUMERICAL_INTEGER,
        uniqueValues: 5,
        totalValues: 1000
      });

      const result = StatisticalChartSelector.recommendUnivariateChart(columnAnalysis);

      expect(result.chartType).toBe('bar_chart');
      expect(result.statisticalJustification).toContain('discrete');
    });

    test('should recommend pie chart for low-cardinality categorical data with high entropy', () => {
      const columnAnalysis = createMockColumnAnalysis({
        detectedDataType: EdaDataType.CATEGORICAL,
        uniqueValues: 4,
        totalValues: 1000,
        frequencyDistribution: {
          'A': 250,
          'B': 250, 
          'C': 250,
          'D': 250
        }
      });

      const result = StatisticalChartSelector.recommendUnivariateChart(columnAnalysis);

      expect(result.chartType).toBe('pie_chart');
      expect(result.statisticalJustification).toContain('proportional');
    });

    test('should recommend horizontal bar chart for high-cardinality categories', () => {
      const columnAnalysis = createMockColumnAnalysis({
        detectedDataType: EdaDataType.CATEGORICAL,
        uniqueValues: 15,
        totalValues: 1000
      });

      const result = StatisticalChartSelector.recommendUnivariateChart(columnAnalysis);

      expect(result.chartType).toBe('horizontal_bar_chart');
      expect(result.statisticalJustification).toContain('readability');
    });

    test('should recommend treemap for very high-cardinality categorical data', () => {
      const columnAnalysis = createMockColumnAnalysis({
        detectedDataType: EdaDataType.CATEGORICAL,
        uniqueValues: 25,
        totalValues: 1000
      });

      const result = StatisticalChartSelector.recommendUnivariateChart(columnAnalysis);

      expect(result.chartType).toBe('treemap');
      expect(result.statisticalJustification).toContain('hierarchical');
    });

    test('should detect ordered categories correctly', () => {
      const columnAnalysis = createMockColumnAnalysis({
        columnName: 'satisfaction_rating',
        detectedDataType: EdaDataType.CATEGORICAL,
        uniqueValues: 5,
        frequencyDistribution: {
          '1': 50,
          '2': 100,
          '3': 200,
          '4': 300,
          '5': 350
        }
      });

      const result = StatisticalChartSelector.recommendUnivariateChart(columnAnalysis);

      expect(result.chartType).toBe('ordered_bar_chart');
      expect(result.statisticalJustification).toContain('ordering');
    });
  });

  describe('Bivariate Chart Recommendations', () => {
    test('should recommend scatter plot for numerical vs numerical relationships', () => {
      const xColumn = createMockColumnAnalysis({
        columnName: 'x_variable',
        detectedDataType: EdaDataType.NUMERICAL_FLOAT,
        totalValues: 1000
      });
      const yColumn = createMockColumnAnalysis({
        columnName: 'y_variable', 
        detectedDataType: EdaDataType.NUMERICAL_FLOAT,
        totalValues: 1000
      });

      const correlation = {
        strength: 'moderate',
        direction: 'positive',
        significance: 0.01,
        effectSize: 0.5,
        relationship: 'linear'
      };

      const result = StatisticalChartSelector.recommendBivariateChart(xColumn, yColumn, correlation);

      expect(result.chartType).toBe('scatter_plot');
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    test('should recommend hexbin plot for large datasets with strong correlation', () => {
      const xColumn = createMockColumnAnalysis({
        detectedDataType: EdaDataType.NUMERICAL_FLOAT,
        totalValues: 50000
      });
      const yColumn = createMockColumnAnalysis({
        detectedDataType: EdaDataType.NUMERICAL_FLOAT,
        totalValues: 50000
      });

      const correlation = {
        strength: 'very_strong',
        direction: 'positive',
        relationship: 'linear'
      };

      const result = StatisticalChartSelector.recommendBivariateChart(xColumn, yColumn, correlation);

      expect(result.chartType).toBe('hexbin_plot');
      expect(result.statisticalJustification).toContain('density');
    });

    test('should recommend density scatter for large datasets without strong correlation', () => {
      const xColumn = createMockColumnAnalysis({
        detectedDataType: EdaDataType.NUMERICAL_FLOAT,
        totalValues: 25000
      });
      const yColumn = createMockColumnAnalysis({
        detectedDataType: EdaDataType.NUMERICAL_FLOAT,
        totalValues: 25000
      });

      const correlation = {
        strength: 'weak',
        relationship: 'linear'
      };

      const result = StatisticalChartSelector.recommendBivariateChart(xColumn, yColumn, correlation);

      expect(result.chartType).toBe('density_scatter');
      expect(result.statisticalJustification).toContain('overplotting');
    });

    test('should recommend smooth scatter for non-linear relationships', () => {
      const xColumn = createMockColumnAnalysis({
        detectedDataType: EdaDataType.NUMERICAL_FLOAT,
        totalValues: 5000
      });
      const yColumn = createMockColumnAnalysis({
        detectedDataType: EdaDataType.NUMERICAL_FLOAT,
        totalValues: 5000
      });

      const correlation = {
        strength: 'strong',
        relationship: 'non_linear'
      };

      const result = StatisticalChartSelector.recommendBivariateChart(xColumn, yColumn, correlation);

      expect(result.chartType).toBe('smooth_scatter');
      expect(result.statisticalJustification).toContain('trend');
    });

    test('should handle categorical vs numerical relationships', () => {
      const catColumn = createMockColumnAnalysis({
        detectedDataType: EdaDataType.CATEGORICAL,
        uniqueValues: 5
      });
      const numColumn = createMockColumnAnalysis({
        detectedDataType: EdaDataType.NUMERICAL_FLOAT
      });

      const result = StatisticalChartSelector.recommendBivariateChart(catColumn, numColumn);

      expect(['box_plot', 'violin_plot']).toContain(result.chartType);
    });

    test('should handle categorical vs categorical relationships', () => {
      const catColumn1 = createMockColumnAnalysis({
        detectedDataType: EdaDataType.CATEGORICAL,
        uniqueValues: 4
      });
      const catColumn2 = createMockColumnAnalysis({
        detectedDataType: EdaDataType.CATEGORICAL,
        uniqueValues: 6
      });

      const result = StatisticalChartSelector.recommendBivariateChart(catColumn1, catColumn2);

      expect(['heatmap', 'stacked_bar', 'grouped_bar']).toContain(result.chartType);
    });
  });

  describe('Visual Encoding Strategies', () => {
    test('should create appropriate encoding for univariate numerical data', () => {
      const columnAnalysis = createMockColumnAnalysis({
        detectedDataType: EdaDataType.NUMERICAL_FLOAT,
        descriptiveStats: {
          minimum: 0,
          maximum: 100,
          mean: 50,
          standardDeviation: 15
        }
      });

      const result = StatisticalChartSelector.recommendUnivariateChart(columnAnalysis);

      expect(result.visualEncodingStrategy.primaryEncoding.dataType).toBe('quantitative');
      expect(result.visualEncodingStrategy.primaryEncoding.scale.type).toBe('linear');
      expect(result.visualEncodingStrategy.colorStrategy.scheme).toBe('sequential');
    });

    test('should recommend log scale for wide-range data', () => {
      const columnAnalysis = createMockColumnAnalysis({
        detectedDataType: EdaDataType.NUMERICAL_FLOAT,
        descriptiveStats: {
          minimum: 1,
          maximum: 100000,
          mean: 5000
        },
        distributionAnalysis: {
          skewness: 2.5 // High positive skew
        }
      });

      const result = StatisticalChartSelector.recommendUnivariateChart(columnAnalysis);

      expect(result.visualEncodingStrategy.primaryEncoding.scale.type).toBe('log');
      expect(result.visualEncodingStrategy.primaryEncoding.scale.reasoning).toContain('skew');
    });

    test('should create categorical encoding for categorical data', () => {
      const columnAnalysis = createMockColumnAnalysis({
        detectedDataType: EdaDataType.CATEGORICAL,
        uniqueValues: 5
      });

      const result = StatisticalChartSelector.recommendUnivariateChart(columnAnalysis);

      expect(result.visualEncodingStrategy.primaryEncoding.dataType).toBe('nominal');
      expect(result.visualEncodingStrategy.primaryEncoding.scale.type).toBe('ordinal');
      expect(result.visualEncodingStrategy.colorStrategy.scheme).toBe('categorical');
    });

    test('should recommend diverging colors for strong correlations', () => {
      const xColumn = createMockColumnAnalysis({
        detectedDataType: EdaDataType.NUMERICAL_FLOAT
      });
      const yColumn = createMockColumnAnalysis({
        detectedDataType: EdaDataType.NUMERICAL_FLOAT
      });

      const strongCorrelation = {
        strength: 'very_strong',
        direction: 'negative'
      };

      const result = StatisticalChartSelector.recommendBivariateChart(xColumn, yColumn, strongCorrelation);

      expect(result.visualEncodingStrategy.colorStrategy.scheme).toBe('diverging');
      expect(result.visualEncodingStrategy.colorStrategy.palette).toBe('rdbu');
    });
  });

  describe('Interaction Recommendations', () => {
    test('should recommend essential interactions for all charts', () => {
      const columnAnalysis = createMockColumnAnalysis();
      const result = StatisticalChartSelector.recommendUnivariateChart(columnAnalysis);

      const hoverInteraction = result.interactionRecommendations.find(
        i => i.interactionType === 'hover'
      );
      expect(hoverInteraction).toBeDefined();
      expect(hoverInteraction?.priority).toBe('essential');
    });

    test('should recommend outlier-specific interactions for data with outliers', () => {
      const columnAnalysis = createMockColumnAnalysis({
        outlierAnalysis: {
          totalOutliers: 50
        }
      });

      const result = StatisticalChartSelector.recommendUnivariateChart(columnAnalysis);

      const outlierInteraction = result.interactionRecommendations.find(
        i => i.purpose.includes('outlier')
      );
      expect(outlierInteraction).toBeDefined();
    });

    test('should recommend advanced interactions for bivariate charts', () => {
      const xColumn = createMockColumnAnalysis();
      const yColumn = createMockColumnAnalysis();

      const result = StatisticalChartSelector.recommendBivariateChart(xColumn, yColumn);

      const brushInteraction = result.interactionRecommendations.find(
        i => i.interactionType === 'brush'
      );
      expect(brushInteraction).toBeDefined();
      expect(brushInteraction?.statisticalBenefit).toContain('subset');
    });

    test('should recommend regression line toggle for strong correlations', () => {
      const xColumn = createMockColumnAnalysis();
      const yColumn = createMockColumnAnalysis();
      const strongCorr = { strength: 'very_strong' };

      const result = StatisticalChartSelector.recommendBivariateChart(xColumn, yColumn, strongCorr);

      const regressionInteraction = result.interactionRecommendations.find(
        i => i.implementation.includes('regression')
      );
      expect(regressionInteraction).toBeDefined();
    });
  });

  describe('Alternative Chart Options', () => {
    test('should provide box plot alternative for outlier-heavy data', () => {
      const columnAnalysis = createMockColumnAnalysis({
        outlierAnalysis: {
          totalOutliers: 100
        }
      });

      const result = StatisticalChartSelector.recommendUnivariateChart(columnAnalysis);

      const boxPlotAlternative = result.alternativeOptions.find(
        alt => alt.chartType === 'box_plot'
      );
      expect(boxPlotAlternative).toBeDefined();
      expect(boxPlotAlternative?.whenToUse).toContain('outlier');
    });

    test('should provide violin plot alternative for non-normal distributions', () => {
      const columnAnalysis = createMockColumnAnalysis({
        distributionAnalysis: {
          skewness: 2.0,
          kurtosis: 5.0
        }
      });

      const result = StatisticalChartSelector.recommendUnivariateChart(columnAnalysis);

      const violinAlternative = result.alternativeOptions.find(
        alt => alt.chartType === 'violin_plot'
      );
      expect(violinAlternative).toBeDefined();
    });

    test('should provide multiple alternatives for bivariate relationships', () => {
      const xColumn = createMockColumnAnalysis({ totalValues: 10000 });
      const yColumn = createMockColumnAnalysis({ totalValues: 10000 });

      const result = StatisticalChartSelector.recommendBivariateChart(xColumn, yColumn);

      expect(result.alternativeOptions.length).toBeGreaterThan(1);
      
      const hexbinAlt = result.alternativeOptions.find(alt => alt.chartType === 'hexbin_plot');
      const densityAlt = result.alternativeOptions.find(alt => alt.chartType === 'density_scatter');
      
      expect(hexbinAlt || densityAlt).toBeDefined();
    });

    test('should rank alternatives by statistical suitability', () => {
      const columnAnalysis = createMockColumnAnalysis();
      const result = StatisticalChartSelector.recommendUnivariateChart(columnAnalysis);

      if (result.alternativeOptions.length > 1) {
        const suitabilities = result.alternativeOptions.map(alt => alt.statisticalSuitability);
        const sortedSuitabilities = [...suitabilities].sort((a, b) => b - a);
        expect(suitabilities).toEqual(sortedSuitabilities);
      }
    });
  });

  describe('Performance Considerations', () => {
    test('should recommend sampling for very large datasets', () => {
      const columnAnalysis = createMockColumnAnalysis({
        totalValues: 100000
      });

      const result = StatisticalChartSelector.recommendUnivariateChart(columnAnalysis);

      expect(result.performanceConsiderations.samplingStrategy).toBeDefined();
      expect(result.performanceConsiderations.aggregationSuggestions.length).toBeGreaterThan(0);
    });

    test('should suggest canvas rendering for large datasets', () => {
      const columnAnalysis = createMockColumnAnalysis({
        totalValues: 75000
      });

      const result = StatisticalChartSelector.recommendUnivariateChart(columnAnalysis);

      expect(result.performanceConsiderations.renderingOptimizations).toContain('canvas');
    });

    test('should recommend memory optimizations for large datasets', () => {
      const columnAnalysis = createMockColumnAnalysis({
        totalValues: 250000
      });

      const result = StatisticalChartSelector.recommendUnivariateChart(columnAnalysis);

      expect(result.performanceConsiderations.memoryConsiderations.length).toBeGreaterThan(0);
      expect(result.performanceConsiderations.dataPointThreshold).toBeLessThan(10000);
    });
  });

  describe('Accessibility Features', () => {
    test('should ensure color-blind safe recommendations', () => {
      const columnAnalysis = createMockColumnAnalysis();
      const result = StatisticalChartSelector.recommendUnivariateChart(columnAnalysis);

      expect(result.visualEncodingStrategy.colorStrategy.accessibility.colorBlindnessSafe).toBe(true);
      expect(result.visualEncodingStrategy.colorStrategy.accessibility.contrastRatio).toBeGreaterThanOrEqual(4.5);
    });

    test('should provide screen reader guidance', () => {
      const columnAnalysis = createMockColumnAnalysis();
      const result = StatisticalChartSelector.recommendUnivariateChart(columnAnalysis);

      expect(result.visualEncodingStrategy.colorStrategy.accessibility.screenReaderGuidance).toBeDefined();
      expect(result.visualEncodingStrategy.colorStrategy.accessibility.alternativeEncodings.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle missing statistical data gracefully', () => {
      const incompleteAnalysis = {
        columnName: 'incomplete',
        detectedDataType: EdaDataType.NUMERICAL_FLOAT,
        totalValues: 100,
        uniqueValues: 80
        // Missing descriptiveStats, distributionAnalysis, etc.
      };

      expect(() => StatisticalChartSelector.recommendUnivariateChart(incompleteAnalysis)).not.toThrow();
      const result = StatisticalChartSelector.recommendUnivariateChart(incompleteAnalysis);
      expect(result.chartType).toBeDefined();
    });

    test('should handle zero variance data', () => {
      const constantData = createMockColumnAnalysis({
        descriptiveStats: {
          minimum: 5,
          maximum: 5,
          mean: 5,
          standardDeviation: 0
        },
        uniqueValues: 1
      });

      const result = StatisticalChartSelector.recommendUnivariateChart(constantData);
      expect(result.chartType).toBe('bar_chart');
    });

    test('should handle extreme outlier scenarios', () => {
      const extremeOutliers = createMockColumnAnalysis({
        totalValues: 100,
        outlierAnalysis: {
          totalOutliers: 95 // 95% outliers
        }
      });

      const result = StatisticalChartSelector.recommendUnivariateChart(extremeOutliers);
      expect(result.alternativeOptions.length).toBeGreaterThan(0);
    });

    test('should provide fallback recommendations for unknown data types', () => {
      const unknownTypeAnalysis = createMockColumnAnalysis({
        detectedDataType: 'unknown' as any
      });

      const result = StatisticalChartSelector.recommendUnivariateChart(unknownTypeAnalysis);
      expect(result.chartType).toBeDefined();
      expect(result.confidence).toBeLessThan(0.7); // Lower confidence for fallback
    });
  });

  describe('Entropy Calculations', () => {
    test('should calculate entropy correctly from frequency data', () => {
      const columnAnalysis = createMockColumnAnalysis({
        detectedDataType: EdaDataType.CATEGORICAL,
        totalValues: 1000,
        frequencyDistribution: {
          'A': 250,  // p=0.25, -log2(0.25) = 2
          'B': 250,  // p=0.25, -log2(0.25) = 2  
          'C': 250,  // p=0.25, -log2(0.25) = 2
          'D': 250   // p=0.25, -log2(0.25) = 2
        }
        // Expected entropy = 4 * 0.25 * 2 = 2.0 (maximum entropy for 4 categories)
      });

      const result = StatisticalChartSelector.recommendUnivariateChart(columnAnalysis);
      
      // For perfectly balanced categories with high entropy, should recommend pie chart
      expect(result.chartType).toBe('pie_chart');
    });

    test('should handle low entropy distributions', () => {
      const columnAnalysis = createMockColumnAnalysis({
        detectedDataType: EdaDataType.CATEGORICAL,
        totalValues: 1000,
        frequencyDistribution: {
          'A': 950,  // Dominant category
          'B': 25,
          'C': 25
        }
      });

      const result = StatisticalChartSelector.recommendUnivariateChart(columnAnalysis);
      
      // Low entropy should not recommend pie chart
      expect(result.chartType).not.toBe('pie_chart');
    });
  });
});