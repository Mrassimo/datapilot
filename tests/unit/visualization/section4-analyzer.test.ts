/**
 * Section 4 Visualization Analyzer Tests
 * 
 * Tests the comprehensive visualization intelligence orchestrator that provides
 * statistical-driven chart recommendations, aesthetic optimization, accessibility
 * compliance, and performance-optimized visualization strategies.
 */

import { Section4Analyzer } from '../../../src/analyzers/visualization/section4-analyzer';
import type { Section4Config } from '../../../src/analyzers/visualization/types';
import type { Section1Result } from '../../../src/analyzers/overview/types';
import type { Section3Result } from '../../../src/analyzers/eda/types';
import { DataType } from '../../../src/core/types';
import { EdaDataType } from '../../../src/analyzers/eda/types';
import {
  ChartType,
  ChartPurpose,
  RecommendationPriority,
  AccessibilityLevel,
  ComplexityLevel,
  PerformanceLevel,
} from '../../../src/analyzers/visualization/types';

describe('Section4Analyzer', () => {
  describe('Comprehensive Visualization Intelligence', () => {
    it('should provide complete visualization analysis with all recommendations', async () => {
      const section1Result = createMockSection1Result();
      const section3Result = createMockSection3Result();

      const config: Section4Config = {
        enabledRecommendations: [
          'univariate', 'bivariate', 'multivariate', 'dashboard',
          'accessibility', 'performance', 'aesthetic'
        ],
        accessibilityLevel: AccessibilityLevel.EXCELLENT,
        complexityThreshold: ComplexityLevel.MODERATE,
        performanceThreshold: PerformanceLevel.MODERATE,
        maxRecommendationsPerChart: 5,
        includeCodeExamples: true,
        targetLibraries: ['d3', 'plotly', 'observable'],
      };

      const analyzer = new Section4Analyzer(config);
      const result = await analyzer.analyze(section1Result, section3Result);

      // Should include all major visualization categories
      expect(result.visualizationAnalysis.univariateRecommendations).toBeDefined();
      expect(result.visualizationAnalysis.bivariateRecommendations).toBeDefined();
      expect(result.visualizationAnalysis.multivariateRecommendations).toBeDefined();
      expect(result.visualizationAnalysis.dashboardRecommendations).toBeDefined();

      // Should have accessibility and performance guidance
      expect(result.technicalGuidance.accessibilityAssessment).toBeDefined();
      expect(result.technicalGuidance.performanceOptimization).toBeDefined();

      // Should include library recommendations
      expect(result.implementationGuidance.libraryRecommendations.length).toBeGreaterThan(0);
      expect(result.implementationGuidance.codeExamples.length).toBeGreaterThan(0);
    });

    it('should adapt recommendations based on data characteristics', async () => {
      // Large dataset scenario
      const largeDataSection1 = createMockSection1Result({
        totalRows: 1000000,
        totalColumns: 20,
      });

      const largeDataSection3 = createMockSection3Result({
        numericalColumns: 15,
        categoricalColumns: 5,
      });

      const analyzer = new Section4Analyzer();
      const result = await analyzer.analyze(largeDataSection1, largeDataSection3);

      // Should recommend performance-optimized visualizations for large datasets
      const performanceRecommendations = result.technicalGuidance.performanceOptimization;
      expect(performanceRecommendations.dataSize).toBe('large');
      expect(performanceRecommendations.recommendedTechniques).toContain('data_sampling');
      expect(performanceRecommendations.memoryConsiderations.estimatedMemoryUsage).toBeDefined();
    });

    it('should provide domain-aware visualization intelligence', async () => {
      const section1Result = createMockSection1Result({
        filename: 'financial-data.csv',
      });

      const section3Result = createMockSection3Result({
        columnNames: ['date', 'stock_price', 'volume', 'sector'],
      });

      const config: Section4Config = {
        enabledRecommendations: ['univariate', 'bivariate', 'dashboard'],
        domainContext: 'financial',
        industryStandards: true,
      };

      const analyzer = new Section4Analyzer(config);
      const result = await analyzer.analyze(section1Result, section3Result);

      // Should recognize financial domain and suggest appropriate charts
      const timeSeriesRecommendations = result.visualizationAnalysis.bivariateRecommendations
        .filter(rec => rec.chartType === ChartType.TIME_SERIES_LINE);
      expect(timeSeriesRecommendations.length).toBeGreaterThan(0);

      // Should include financial-specific guidelines
      expect(result.domainIntelligence?.industryContext).toBe('financial');
      expect(result.domainIntelligence?.complianceConsiderations).toBeDefined();
    });
  });

  describe('Univariate Visualization Recommendations', () => {
    it('should recommend appropriate charts for numerical distributions', async () => {
      const section3Result = createMockSection3Result({
        numericalColumns: ['age', 'salary', 'score'],
        numericalDistributions: {
          age: { skewness: 0.2, kurtosis: -0.5, normalityTest: 'normal' },
          salary: { skewness: 1.8, kurtosis: 3.2, normalityTest: 'skewed' },
          score: { skewness: -0.1, kurtosis: -1.2, normalityTest: 'uniform' },
        },
      });

      const analyzer = new Section4Analyzer();
      const result = await analyzer.analyze(createMockSection1Result(), section3Result);

      const numericalRecs = result.visualizationAnalysis.univariateRecommendations
        .filter(rec => rec.dataType === EdaDataType.NUMERICAL);

      expect(numericalRecs.length).toBeGreaterThan(0);

      // Should recommend histograms for distribution analysis
      const histogramRec = numericalRecs.find(rec => 
        rec.recommendations.some(r => r.chartType === ChartType.HISTOGRAM)
      );
      expect(histogramRec).toBeDefined();

      // Should recommend violin plots for skewed data
      const violinRec = numericalRecs.find(rec => 
        rec.recommendations.some(r => r.chartType === ChartType.VIOLIN_PLOT)
      );
      expect(violinRec).toBeDefined();

      // Should include distribution characteristics
      numericalRecs.forEach(rec => {
        expect(rec.distributionCharacteristics).toBeDefined();
        expect(rec.distributionCharacteristics.skewness).toBeDefined();
        expect(rec.distributionCharacteristics.outlierProportion).toBeDefined();
      });
    });

    it('should recommend appropriate charts for categorical data', async () => {
      const section3Result = createMockSection3Result({
        categoricalColumns: ['category', 'priority', 'status'],
        categoricalDistributions: {
          category: { uniqueValues: 5, entropy: 2.1, uniformity: 0.8 },
          priority: { uniqueValues: 3, entropy: 1.5, uniformity: 0.6 },
          status: { uniqueValues: 10, entropy: 3.2, uniformity: 0.3 },
        },
      });

      const analyzer = new Section4Analyzer();
      const result = await analyzer.analyze(createMockSection1Result(), section3Result);

      const categoricalRecs = result.visualizationAnalysis.univariateRecommendations
        .filter(rec => rec.dataType === EdaDataType.CATEGORICAL);

      expect(categoricalRecs.length).toBeGreaterThan(0);

      // Should recommend bar charts for most categorical data
      const barChartRec = categoricalRecs.find(rec => 
        rec.recommendations.some(r => r.chartType === ChartType.BAR_CHART)
      );
      expect(barChartRec).toBeDefined();

      // Should avoid pie charts for high-cardinality data
      const highCardinalityRec = categoricalRecs.find(rec => rec.columnName === 'status');
      if (highCardinalityRec) {
        const pieChartRec = highCardinalityRec.recommendations.find(r => 
          r.chartType === ChartType.PIE_CHART
        );
        expect(pieChartRec?.priority).toBe(RecommendationPriority.NOT_RECOMMENDED);
      }
    });

    it('should handle temporal data with specialized recommendations', async () => {
      const section3Result = createMockSection3Result({
        temporalColumns: ['timestamp', 'date_created', 'last_updated'],
        temporalPatterns: {
          timestamp: { frequency: 'daily', seasonality: true, trend: 'increasing' },
          date_created: { frequency: 'monthly', seasonality: false, trend: 'stable' },
        },
      });

      const analyzer = new Section4Analyzer();
      const result = await analyzer.analyze(createMockSection1Result(), section3Result);

      const temporalRecs = result.visualizationAnalysis.univariateRecommendations
        .filter(rec => rec.dataType === EdaDataType.DATETIME);

      expect(temporalRecs.length).toBeGreaterThan(0);

      // Should recommend calendar heatmaps for temporal patterns
      const calendarRec = temporalRecs.find(rec => 
        rec.recommendations.some(r => r.chartType === ChartType.CALENDAR_HEATMAP)
      );
      expect(calendarRec).toBeDefined();

      // Should include temporal characteristics
      temporalRecs.forEach(rec => {
        expect(rec.temporalCharacteristics).toBeDefined();
        expect(rec.temporalCharacteristics?.frequency).toBeDefined();
        expect(rec.temporalCharacteristics?.seasonality).toBeDefined();
      });
    });
  });

  describe('Bivariate Visualization Recommendations', () => {
    it('should recommend scatter plots for numerical-numerical relationships', async () => {
      const section3Result = createMockSection3Result({
        bivariateRelationships: [
          {
            column1: 'height',
            column2: 'weight',
            relationshipType: 'numerical-numerical',
            correlation: 0.85,
            pValue: 0.001,
            significance: 'significant',
          },
          {
            column1: 'age',
            column2: 'income',
            relationshipType: 'numerical-numerical',
            correlation: 0.45,
            pValue: 0.02,
            significance: 'significant',
          }
        ],
      });

      const analyzer = new Section4Analyzer();
      const result = await analyzer.analyze(createMockSection1Result(), section3Result);

      const bivariateRecs = result.visualizationAnalysis.bivariateRecommendations;
      expect(bivariateRecs.length).toBeGreaterThan(0);

      // Should recommend scatter plots for strong correlations
      const strongCorrelationRec = bivariateRecs.find(rec => 
        rec.xColumn === 'height' && rec.yColumn === 'weight'
      );
      expect(strongCorrelationRec).toBeDefined();
      
      const scatterPlotRec = strongCorrelationRec?.recommendations.find(r => 
        r.chartType === ChartType.SCATTER_PLOT
      );
      expect(scatterPlotRec).toBeDefined();
      expect(scatterPlotRec?.priority).toBe(RecommendationPriority.PRIMARY);

      // Should include regression line for strong correlations
      expect(scatterPlotRec?.encoding.additionalLayers).toContain('regression_line');
    });

    it('should recommend group comparisons for numerical-categorical relationships', async () => {
      const section3Result = createMockSection3Result({
        bivariateRelationships: [
          {
            column1: 'salary',
            column2: 'department',
            relationshipType: 'numerical-categorical',
            anovaFStatistic: 15.6,
            anovaPValue: 0.001,
            significance: 'significant',
          }
        ],
      });

      const analyzer = new Section4Analyzer();
      const result = await analyzer.analyze(createMockSection1Result(), section3Result);

      const groupComparisonRec = result.visualizationAnalysis.bivariateRecommendations.find(rec => 
        rec.xColumn === 'department' && rec.yColumn === 'salary'
      );

      expect(groupComparisonRec).toBeDefined();

      // Should recommend box plots for group comparisons
      const boxPlotRec = groupComparisonRec?.recommendations.find(r => 
        r.chartType === ChartType.BOX_PLOT_BY_GROUP
      );
      expect(boxPlotRec).toBeDefined();

      // Should recommend violin plots as alternative
      const violinRec = groupComparisonRec?.recommendations.find(r => 
        r.chartType === ChartType.VIOLIN_BY_GROUP
      );
      expect(violinRec).toBeDefined();
      expect(violinRec?.priority).toBe(RecommendationPriority.SECONDARY);
    });

    it('should recommend heatmaps for categorical-categorical relationships', async () => {
      const section3Result = createMockSection3Result({
        bivariateRelationships: [
          {
            column1: 'product_category',
            column2: 'customer_segment',
            relationshipType: 'categorical-categorical',
            chiSquaredStatistic: 25.4,
            chiSquaredPValue: 0.001,
            cramersV: 0.72,
            significance: 'significant',
          }
        ],
      });

      const analyzer = new Section4Analyzer();
      const result = await analyzer.analyze(createMockSection1Result(), section3Result);

      const categoricalRec = result.visualizationAnalysis.bivariateRecommendations.find(rec => 
        rec.xColumn === 'product_category' && rec.yColumn === 'customer_segment'
      );

      expect(categoricalRec).toBeDefined();

      // Should recommend heatmap for strong associations
      const heatmapRec = categoricalRec?.recommendations.find(r => 
        r.chartType === ChartType.HEATMAP
      );
      expect(heatmapRec).toBeDefined();
      expect(heatmapRec?.priority).toBe(RecommendationPriority.PRIMARY);

      // Should include contingency table representation
      expect(heatmapRec?.dataPreparation.steps).toContain('create_contingency_table');
    });
  });

  describe('Dashboard and Layout Recommendations', () => {
    it('should provide comprehensive dashboard layout recommendations', async () => {
      const section3Result = createMockSection3Result({
        numericalColumns: ['sales', 'profit', 'quantity'],
        categoricalColumns: ['region', 'category', 'segment'],
        temporalColumns: ['order_date'],
      });

      const config: Section4Config = {
        enabledRecommendations: ['dashboard'],
        dashboardComplexity: ComplexityLevel.MODERATE,
        responsiveDesign: true,
      };

      const analyzer = new Section4Analyzer(config);
      const result = await analyzer.analyze(createMockSection1Result(), section3Result);

      const dashboardRecs = result.visualizationAnalysis.dashboardRecommendations;
      expect(dashboardRecs.length).toBeGreaterThan(0);

      // Should recommend executive summary dashboard
      const summaryDashboard = dashboardRecs.find(rec => 
        rec.dashboardType === 'executive_summary'
      );
      expect(summaryDashboard).toBeDefined();

      // Should include layout specifications
      expect(summaryDashboard?.layout.gridSystem).toBeDefined();
      expect(summaryDashboard?.layout.responsiveBreakpoints).toBeDefined();
      expect(summaryDashboard?.layout.chartHierarchy.length).toBeGreaterThan(0);

      // Should provide interaction patterns
      expect(summaryDashboard?.interactionPatterns.filterTypes).toBeDefined();
      expect(summaryDashboard?.interactionPatterns.drillDownCapabilities).toBeDefined();
    });

    it('should optimize dashboard for different screen sizes', async () => {
      const config: Section4Config = {
        enabledRecommendations: ['dashboard'],
        targetDevices: ['desktop', 'tablet', 'mobile'],
        responsiveDesign: true,
      };

      const analyzer = new Section4Analyzer(config);
      const result = await analyzer.analyze(createMockSection1Result(), createMockSection3Result());

      const dashboardRecs = result.visualizationAnalysis.dashboardRecommendations;

      dashboardRecs.forEach(rec => {
        expect(rec.layout.responsiveBreakpoints).toBeDefined();
        expect(rec.layout.responsiveBreakpoints.desktop).toBeDefined();
        expect(rec.layout.responsiveBreakpoints.tablet).toBeDefined();
        expect(rec.layout.responsiveBreakpoints.mobile).toBeDefined();

        // Should adapt chart types for mobile
        expect(rec.layout.responsiveBreakpoints.mobile.chartAdaptations).toBeDefined();
      });
    });

    it('should recommend narrative flow for analytical dashboards', async () => {
      const section3Result = createMockSection3Result({
        analyticalContext: 'exploratory_data_analysis',
        complexityLevel: ComplexityLevel.COMPLEX,
      });

      const config: Section4Config = {
        enabledRecommendations: ['dashboard'],
        narrativeFlow: true,
        analyticalProgression: true,
      };

      const analyzer = new Section4Analyzer(config);
      const result = await analyzer.analyze(createMockSection1Result(), section3Result);

      const analyticalDashboard = result.visualizationAnalysis.dashboardRecommendations.find(rec => 
        rec.dashboardType === 'analytical_exploration'
      );

      expect(analyticalDashboard).toBeDefined();
      expect(analyticalDashboard?.narrativeFlow).toBeDefined();
      expect(analyticalDashboard?.narrativeFlow.storyProgression.length).toBeGreaterThan(1);
      expect(analyticalDashboard?.narrativeFlow.logicalFlow).toBeDefined();
    });
  });

  describe('Accessibility and Compliance', () => {
    it('should provide comprehensive accessibility assessment', async () => {
      const config: Section4Config = {
        enabledRecommendations: ['accessibility'],
        accessibilityLevel: AccessibilityLevel.EXCELLENT,
        wcagCompliance: 'AA',
      };

      const analyzer = new Section4Analyzer(config);
      const result = await analyzer.analyze(createMockSection1Result(), createMockSection3Result());

      const accessibility = result.technicalGuidance.accessibilityAssessment;
      expect(accessibility).toBeDefined();

      // Should include WCAG compliance guidelines
      expect(accessibility.wcagCompliance.level).toBe('AA');
      expect(accessibility.wcagCompliance.guidelines.length).toBeGreaterThan(0);

      // Should provide color accessibility guidance
      expect(accessibility.colorAccessibility.contrastRatios).toBeDefined();
      expect(accessibility.colorAccessibility.colorBlindFriendly).toBe(true);
      expect(accessibility.colorAccessibility.recommendedPalettes.length).toBeGreaterThan(0);

      // Should include keyboard navigation
      expect(accessibility.keyboardNavigation.supported).toBe(true);
      expect(accessibility.keyboardNavigation.keyboardShortcuts).toBeDefined();

      // Should provide screen reader support
      expect(accessibility.screenReaderSupport.ariaLabels).toBeDefined();
      expect(accessibility.screenReaderSupport.altTextGeneration).toBeDefined();
    });

    it('should detect and warn about accessibility anti-patterns', async () => {
      const section3Result = createMockSection3Result({
        colorOnlyEncoding: true,
        lowContrastIssues: true,
        inaccessibleChartTypes: ['PIE_CHART'],
      });

      const config: Section4Config = {
        enabledRecommendations: ['accessibility'],
        accessibilityLevel: AccessibilityLevel.EXCELLENT,
        strictAccessibility: true,
      };

      const analyzer = new Section4Analyzer(config);
      const result = await analyzer.analyze(createMockSection1Result(), section3Result);

      // Should detect accessibility issues
      expect(result.warnings.length).toBeGreaterThan(0);

      const accessibilityWarnings = result.warnings.filter(w => w.category === 'accessibility');
      expect(accessibilityWarnings.length).toBeGreaterThan(0);

      // Should provide remediation suggestions
      const colorWarning = accessibilityWarnings.find(w => 
        w.message.includes('color') || w.message.includes('contrast')
      );
      expect(colorWarning).toBeDefined();
      expect(colorWarning?.suggestions.length).toBeGreaterThan(0);
    });

    it('should provide alternative text generation for charts', async () => {
      const config: Section4Config = {
        enabledRecommendations: ['accessibility'],
        generateAltText: true,
        includeDataSummaries: true,
      };

      const analyzer = new Section4Analyzer(config);
      const result = await analyzer.analyze(createMockSection1Result(), createMockSection3Result());

      const univariateRecs = result.visualizationAnalysis.univariateRecommendations;
      
      univariateRecs.forEach(rec => {
        rec.recommendations.forEach(chartRec => {
          expect(chartRec.accessibility.altText).toBeDefined();
          expect(chartRec.accessibility.description).toBeDefined();
          expect(chartRec.accessibility.dataSummary).toBeDefined();
        });
      });
    });
  });

  describe('Performance Optimization', () => {
    it('should provide performance optimization for large datasets', async () => {
      const largeDataSection1 = createMockSection1Result({
        totalRows: 5000000,
        totalColumns: 50,
      });

      const config: Section4Config = {
        enabledRecommendations: ['performance'],
        performanceThreshold: PerformanceLevel.HIGH,
        optimizeForSpeed: true,
      };

      const analyzer = new Section4Analyzer(config);
      const result = await analyzer.analyze(largeDataSection1, createMockSection3Result());

      const performance = result.technicalGuidance.performanceOptimization;
      expect(performance).toBeDefined();

      // Should recommend data reduction techniques
      expect(performance.dataReduction.recommendedTechniques).toContain('sampling');
      expect(performance.dataReduction.recommendedTechniques).toContain('aggregation');

      // Should provide rendering optimization
      expect(performance.renderingOptimization.useWebGL).toBe(true);
      expect(performance.renderingOptimization.virtualScrolling).toBe(true);
      expect(performance.renderingOptimization.lazyLoading).toBe(true);

      // Should estimate performance metrics
      expect(performance.estimatedPerformance.renderTime).toBeDefined();
      expect(performance.estimatedPerformance.memoryUsage).toBeDefined();
      expect(performance.estimatedPerformance.interactionLatency).toBeDefined();
    });

    it('should adapt chart recommendations based on performance constraints', async () => {
      const config: Section4Config = {
        enabledRecommendations: ['univariate', 'performance'],
        performanceThreshold: PerformanceLevel.HIGH,
        maxDataPoints: 10000,
      };

      const analyzer = new Section4Analyzer(config);
      const result = await analyzer.analyze(
        createMockSection1Result({ totalRows: 1000000 }),
        createMockSection3Result()
      );

      // Should prefer simpler, faster chart types for large data
      const univariateRecs = result.visualizationAnalysis.univariateRecommendations;
      
      univariateRecs.forEach(rec => {
        const primaryRec = rec.recommendations.find(r => 
          r.priority === RecommendationPriority.PRIMARY
        );
        
        if (primaryRec) {
          // Should avoid computationally expensive charts
          expect([
            ChartType.VIOLIN_PLOT,
            ChartType.DENSITY_PLOT,
            ChartType.HEX_BIN
          ]).not.toContain(primaryRec.chartType);
        }
      });
    });

    it('should provide memory usage estimates', async () => {
      const analyzer = new Section4Analyzer();
      const result = await analyzer.analyze(
        createMockSection1Result({ totalRows: 100000 }),
        createMockSection3Result()
      );

      const performance = result.technicalGuidance.performanceOptimization;
      expect(performance.memoryConsiderations).toBeDefined();
      expect(performance.memoryConsiderations.estimatedMemoryUsage).toBeGreaterThan(0);
      expect(performance.memoryConsiderations.recommendedOptimizations.length).toBeGreaterThan(0);
    });
  });

  describe('Library-Specific Implementation Guidance', () => {
    it('should provide D3.js implementation examples', async () => {
      const config: Section4Config = {
        enabledRecommendations: ['univariate'],
        targetLibraries: ['d3'],
        includeCodeExamples: true,
        codeComplexity: ComplexityLevel.MODERATE,
      };

      const analyzer = new Section4Analyzer(config);
      const result = await analyzer.analyze(createMockSection1Result(), createMockSection3Result());

      const d3Examples = result.implementationGuidance.codeExamples.filter(ex => 
        ex.library === 'd3'
      );
      expect(d3Examples.length).toBeGreaterThan(0);

      // Should include proper D3 code structure
      d3Examples.forEach(example => {
        expect(example.code).toContain('d3.');
        expect(example.code).toContain('svg');
        expect(example.dependencies.length).toBeGreaterThan(0);
        expect(example.documentation).toBeDefined();
      });
    });

    it('should provide Plotly implementation examples', async () => {
      const config: Section4Config = {
        enabledRecommendations: ['bivariate'],
        targetLibraries: ['plotly'],
        includeCodeExamples: true,
      };

      const analyzer = new Section4Analyzer(config);
      const result = await analyzer.analyze(createMockSection1Result(), createMockSection3Result());

      const plotlyExamples = result.implementationGuidance.codeExamples.filter(ex => 
        ex.library === 'plotly'
      );
      expect(plotlyExamples.length).toBeGreaterThan(0);

      // Should include Plotly-specific configuration
      plotlyExamples.forEach(example => {
        expect(example.code).toContain('Plotly.');
        expect(example.configuration).toBeDefined();
        expect(example.configuration.responsive).toBeDefined();
      });
    });

    it('should compare library capabilities for complex visualizations', async () => {
      const config: Section4Config = {
        enabledRecommendations: ['multivariate'],
        targetLibraries: ['d3', 'plotly', 'observable'],
        includeLibraryComparison: true,
      };

      const analyzer = new Section4Analyzer(config);
      const result = await analyzer.analyze(createMockSection1Result(), createMockSection3Result());

      const libraryRecs = result.implementationGuidance.libraryRecommendations;
      expect(libraryRecs.length).toBeGreaterThan(0);

      // Should compare libraries for specific chart types
      const multivariateLibrary = libraryRecs.find(lib => 
        lib.strengths.includes('multivariate') || lib.strengths.includes('complex')
      );
      expect(multivariateLibrary).toBeDefined();
      expect(multivariateLibrary?.comparison).toBeDefined();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle empty datasets gracefully', async () => {
      const emptySection1 = createMockSection1Result({ totalRows: 0 });
      const emptySection3 = createMockSection3Result({ numericalColumns: [], categoricalColumns: [] });

      const analyzer = new Section4Analyzer();
      const result = await analyzer.analyze(emptySection1, emptySection3);

      expect(result.visualizationAnalysis.univariateRecommendations).toHaveLength(0);
      expect(result.visualizationAnalysis.bivariateRecommendations).toHaveLength(0);
      expect(result.warnings.length).toBeGreaterThan(0);

      const emptyDataWarning = result.warnings.find(w => w.category === 'data');
      expect(emptyDataWarning).toBeDefined();
    });

    it('should handle single column datasets', async () => {
      const singleColumnSection1 = createMockSection1Result({ totalColumns: 1 });
      const singleColumnSection3 = createMockSection3Result({ 
        numericalColumns: ['single_value'],
        categoricalColumns: []
      });

      const analyzer = new Section4Analyzer();
      const result = await analyzer.analyze(singleColumnSection1, singleColumnSection3);

      expect(result.visualizationAnalysis.univariateRecommendations).toHaveLength(1);
      expect(result.visualizationAnalysis.bivariateRecommendations).toHaveLength(0);
      expect(result.visualizationAnalysis.multivariateRecommendations).toHaveLength(0);

      const limitationWarning = result.warnings.find(w => 
        w.message.includes('single column') || w.message.includes('limited')
      );
      expect(limitationWarning).toBeDefined();
    });

    it('should handle datasets with extreme cardinality', async () => {
      const highCardinalitySection3 = createMockSection3Result({
        categoricalColumns: ['unique_id', 'transaction_id'],
        categoricalDistributions: {
          unique_id: { uniqueValues: 10000, entropy: 15.3, uniformity: 1.0 },
          transaction_id: { uniqueValues: 50000, entropy: 17.6, uniformity: 1.0 },
        },
      });

      const analyzer = new Section4Analyzer();
      const result = await analyzer.analyze(createMockSection1Result(), highCardinalitySection3);

      // Should warn about high cardinality
      const cardinalityWarnings = result.warnings.filter(w => 
        w.message.includes('cardinality') || w.message.includes('unique')
      );
      expect(cardinalityWarnings.length).toBeGreaterThan(0);

      // Should avoid categorical visualizations for high cardinality columns
      const categoricalRecs = result.visualizationAnalysis.univariateRecommendations
        .filter(rec => rec.dataType === EdaDataType.CATEGORICAL);
      
      categoricalRecs.forEach(rec => {
        if (rec.columnName === 'unique_id' || rec.columnName === 'transaction_id') {
          const recommendedCharts = rec.recommendations.filter(r => 
            r.priority === RecommendationPriority.PRIMARY
          );
          expect(recommendedCharts.length).toBe(0);
        }
      });
    });

    it('should validate configuration parameters', async () => {
      const invalidConfig: Section4Config = {
        enabledRecommendations: [],
        accessibilityLevel: 'invalid' as any,
        maxRecommendationsPerChart: -1,
        performanceThreshold: 'extreme' as any,
      };

      const analyzer = new Section4Analyzer(invalidConfig);
      const result = await analyzer.analyze(createMockSection1Result(), createMockSection3Result());

      // Should handle invalid config gracefully with warnings
      expect(result.warnings.length).toBeGreaterThan(0);
      
      const configWarning = result.warnings.find(w => w.category === 'configuration');
      expect(configWarning).toBeDefined();
    });
  });

  describe('Integration and Performance Metrics', () => {
    it('should track analysis performance metrics', async () => {
      const analyzer = new Section4Analyzer();
      const start = Date.now();
      
      const result = await analyzer.analyze(createMockSection1Result(), createMockSection3Result());
      
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds

      expect(result.performanceMetrics.totalAnalysisTime).toBeGreaterThan(0);
      expect(result.performanceMetrics.phases).toBeDefined();
      
      if (result.performanceMetrics.phases) {
        expect(Object.keys(result.performanceMetrics.phases).length).toBeGreaterThan(0);
      }
    });

    it('should provide visualization insights and anti-pattern detection', async () => {
      const problematicSection3 = createMockSection3Result({
        antiPatterns: ['color_only_encoding', 'too_many_categories', 'low_contrast'],
      });

      const analyzer = new Section4Analyzer();
      const result = await analyzer.analyze(createMockSection1Result(), problematicSection3);

      expect(result.insights.antiPatternDetection.length).toBeGreaterThan(0);
      
      // Should detect specific anti-patterns
      const colorOnlyPattern = result.insights.antiPatternDetection.find(ap => 
        ap.pattern === 'color_only_encoding'
      );
      expect(colorOnlyPattern).toBeDefined();
      expect(colorOnlyPattern?.severity).toBeDefined();
      expect(colorOnlyPattern?.remediation.length).toBeGreaterThan(0);
    });
  });
});

// Helper functions to create mock data
function createMockSection1Result(overrides: any = {}): Section1Result {
  return {
    overview: {
      version: '1.3.1',
      generatedAt: new Date(),
      fileDetails: {
        originalFilename: overrides.filename || 'test-data.csv',
        fullResolvedPath: '/path/to/test-data.csv',
        fileSizeBytes: 10000,
        fileSizeMB: 0.01,
        lastModified: new Date(),
        encoding: 'utf-8',
        dataSourceType: 'Local File System',
      },
      initialScanLimit: {
        linesScanned: 100,
        bytesScanned: 10000,
        estimatedTotalLines: 100,
      },
      structuralDimensions: {
        totalRows: overrides.totalRows || 100,
        totalColumns: overrides.totalColumns || 5,
        estimatedDataCells: (overrides.totalRows || 100) * (overrides.totalColumns || 5),
      },
      executionContext: {
        hostname: 'test-host',
        platform: 'test',
        nodeVersion: 'v18.0.0',
        availableMemory: '8GB',
        cpuArchitecture: 'x64',
      },
    },
    parsing: {
      csvStructure: {
        delimiter: ',',
        quoteChar: '"',
        escapeChar: '\\',
        hasHeader: true,
        lineEndings: 'CRLF',
      },
      columnSchema: [
        { index: 0, inferredName: 'id', originalHeader: 'id', dataType: DataType.INTEGER },
        { index: 1, inferredName: 'name', originalHeader: 'name', dataType: DataType.STRING },
        { index: 2, inferredName: 'value', originalHeader: 'value', dataType: DataType.FLOAT },
        { index: 3, inferredName: 'category', originalHeader: 'category', dataType: DataType.STRING },
        { index: 4, inferredName: 'date', originalHeader: 'date', dataType: DataType.DATE },
      ],
      dataIntegrityChecks: {
        rowsWithInconsistentColumns: 0,
        emptyRowsDetected: 0,
        suspiciousPatterns: [],
        validationResults: {
          structuralConsistency: true,
          encodingConsistency: true,
          formatConsistency: true,
        },
      },
    },
    warnings: [],
    performanceMetrics: {
      totalAnalysisTime: 100,
      memoryUsage: 50,
      gcEvents: 1,
    },
  };
}

function createMockSection3Result(overrides: any = {}): Section3Result {
  return {
    edaAnalysis: {
      univariateAnalysis: {
        columnAnalyses: [
          {
            columnName: 'id',
            type: EdaDataType.NUMERICAL,
            descriptiveStats: {
              count: 100,
              mean: 50.5,
              standardDeviation: 28.9,
              min: 1,
              max: 100,
              quantiles: { q25: 25.75, median: 50.5, q75: 75.25 },
            },
          },
          {
            columnName: 'category',
            type: EdaDataType.CATEGORICAL,
            frequencyAnalysis: {
              uniqueValues: 5,
              totalValues: 100,
              topCategories: [
                { value: 'A', frequency: 25, percentage: 25 },
                { value: 'B', frequency: 20, percentage: 20 },
              ],
            },
          },
        ],
        summary: {
          totalColumns: overrides.totalColumns || 5,
          numericalColumns: overrides.numericalColumns?.length || 3,
          categoricalColumns: overrides.categoricalColumns?.length || 2,
          dataQualityScore: 85,
        },
      },
      bivariateAnalysis: {
        numericalRelationships: overrides.bivariateRelationships || [],
        categoricalNumericalRelationships: [],
        categoricalRelationships: [],
        summary: {
          totalRelationshipsAnalyzed: 10,
          significantRelationships: 3,
          comparisonsPerformed: {
            numericalNumerical: 6,
            numericalCategorical: 3,
            categoricalCategorical: 1,
          },
        },
      },
      multivariateAnalysis: {
        pcaAnalysis: {
          eigenValues: [2.5, 1.8, 1.2],
          explainedVarianceRatio: [0.5, 0.36, 0.24],
          cumulativeVarianceExplained: [0.5, 0.86, 1.0],
          loadingsMatrix: [[0.8, 0.6], [0.6, -0.8]],
        },
      },
    },
    performanceMetrics: {
      totalAnalysisTime: 500,
      phases: {
        univariate: 200,
        bivariate: 200,
        multivariate: 100,
      },
    },
    warnings: [],
  };
}