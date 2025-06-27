/**
 * Section 4 Analyzer Tests
 * 
 * Comprehensive tests for the main visualization analysis engine that orchestrates
 * chart selection, accessibility assessment, and aesthetic optimization.
 */

/// <reference path="../../../jest-custom-matchers.d.ts" />

import { Section4Analyzer } from '../../../../src/analyzers/visualization/section4-analyzer';
import type { Section1Results, Section2Results, Section3Results } from '../../../../src/core/types';
import type { ColumnAnalysis, BivariateAnalysis } from '../../../../src/analyzers/eda/types';
import { EdaDataType } from '../../../../src/analyzers/eda/types';

describe('Section4Analyzer', () => {
  let analyzer: Section4Analyzer;

  beforeEach(() => {
    analyzer = new Section4Analyzer();
  });

  // Test data fixtures
  const mockSection1Results: Section1Results = {
    metadata: {
      fileName: 'test.csv',
      fileSize: 1024,
      totalRows: 100,
      totalColumns: 5,
      encoding: 'utf-8'
    },
    structure: {
      headers: ['id', 'name', 'sales', 'category', 'date'],
      columnTypes: {
        'id': 'numeric',
        'name': 'text',
        'sales': 'numeric', 
        'category': 'text',
        'date': 'date'
      },
      sampleRows: []
    }
  } as Section1Results;

  const mockSection2Results: Section2Results = {
    dataQuality: {
      overallScore: 85,
      completeness: 0.95,
      validity: 0.90,
      consistency: 0.85,
      uniqueness: 0.80
    },
    qualityIssues: [],
    recommendations: []
  } as Section2Results;

  const mockSection3Results: Section3Results = {
    univariateAnalysis: {
      sales: {
        dataType: EdaDataType.CONTINUOUS,
        basicStats: {
          count: 100,
          mean: 1000,
          std: 200,
          min: 500,
          max: 2000
        },
        distribution: {
          skewness: 0.1,
          kurtosis: -0.5,
          normality: 0.85
        }
      } as ColumnAnalysis,
      category: {
        dataType: EdaDataType.CATEGORICAL,
        basicStats: {
          count: 100,
          uniqueCount: 5
        }
      } as ColumnAnalysis
    },
    bivariateAnalysis: [
      {
        variable1: 'sales',
        variable2: 'category',
        analysisType: 'categorical_continuous',
        correlation: 0.3,
        pValue: 0.05,
        effectSize: 0.2,
        strength: 'moderate'
      } as BivariateAnalysis
    ],
    insights: []
  } as Section3Results;

  describe('analyze', () => {
    it('should generate comprehensive visualization analysis', async () => {
      const results = await analyzer.analyze(
        mockSection1Results,
        mockSection2Results, 
        mockSection3Results
      );

      expect(results.visualizationAnalysis).toBeDefined();
      expect(results.visualizationAnalysis.univariateRecommendations).toBeInstanceOf(Array);
      expect(results.visualizationAnalysis.bivariateRecommendations).toBeInstanceOf(Array);
      expect(results.visualizationAnalysis.dashboardRecommendations).toBeDefined();
      expect(results.visualizationAnalysis.accessibilityAssessment).toBeDefined();
      expect(results.visualizationAnalysis.aestheticProfile).toBeDefined();
      expect(results.performanceMetrics).toBeDefined();
    });

    it('should handle small datasets appropriately', async () => {
      const smallSection1 = {
        ...mockSection1Results,
        metadata: { ...mockSection1Results.metadata, totalRows: 10 }
      };

      const results = await analyzer.analyze(
        smallSection1,
        mockSection2Results,
        mockSection3Results
      );

      expect(results.visualizationAnalysis.strategy).toBeDefined();
      expect(results.warnings).toBeInstanceOf(Array);
    });

    it('should handle large datasets with performance considerations', async () => {
      const largeSection1 = {
        ...mockSection1Results,
        metadata: { ...mockSection1Results.metadata, totalRows: 100000 }
      };

      const results = await analyzer.analyze(
        largeSection1,
        mockSection2Results,
        mockSection3Results
      );

      expect(results.visualizationAnalysis.strategy).toBeDefined();
      expect(results.performanceMetrics.analysisTimeMs).toBeGreaterThan(0);
    });

    it('should provide accessibility compliance assessment', async () => {
      const results = await analyzer.analyze(
        mockSection1Results,
        mockSection2Results,
        mockSection3Results
      );

      const accessibility = results.visualizationAnalysis.accessibilityAssessment;
      expect(accessibility.compliance).toBeDefined();
      expect(accessibility.compliance.level).toMatch(/^(A|AA|AAA)$/);
      expect(accessibility.recommendations).toBeInstanceOf(Array);
    });

    it('should generate appropriate chart recommendations for univariate data', async () => {
      const results = await analyzer.analyze(
        mockSection1Results,
        mockSection2Results,
        mockSection3Results
      );

      const univariate = results.visualizationAnalysis.univariateRecommendations;
      expect(univariate.length).toBeGreaterThan(0);
      
      const salesRec = univariate.find(r => r.variable === 'sales');
      expect(salesRec).toBeDefined();
      expect(salesRec?.chartType).toBeDefined();
      expect(salesRec?.confidence).toBeGreaterThan(0);
    });

    it('should generate appropriate chart recommendations for bivariate data', async () => {
      const results = await analyzer.analyze(
        mockSection1Results,
        mockSection2Results,
        mockSection3Results
      );

      const bivariate = results.visualizationAnalysis.bivariateRecommendations;
      expect(bivariate.length).toBeGreaterThan(0);
      
      const rec = bivariate[0];
      expect(rec.variables).toHaveLength(2);
      expect(rec.chartType).toBeDefined();
      expect(rec.confidence).toBeGreaterThan(0);
    });

    it('should provide technical guidance for implementation', async () => {
      const results = await analyzer.analyze(
        mockSection1Results,
        mockSection2Results,
        mockSection3Results
      );

      const guidance = results.visualizationAnalysis.technicalGuidance;
      expect(guidance.libraries).toBeInstanceOf(Array);
      expect(guidance.codeExamples).toBeInstanceOf(Array);
      expect(guidance.bestPractices).toBeInstanceOf(Array);
    });

    it('should handle missing or incomplete data gracefully', async () => {
      const incompleteSection3 = {
        ...mockSection3Results,
        univariateAnalysis: {},
        bivariateAnalysis: []
      };

      const results = await analyzer.analyze(
        mockSection1Results,
        mockSection2Results,
        incompleteSection3
      );

      expect(results.visualizationAnalysis).toBeDefined();
      expect(results.warnings.length).toBeGreaterThan(0);
    });

    it('should measure and report performance metrics', async () => {
      const start = Date.now();
      
      const results = await analyzer.analyze(
        mockSection1Results,
        mockSection2Results,
        mockSection3Results
      );

      const end = Date.now();
      const actualTime = end - start;

      expect(results.performanceMetrics.analysisTimeMs).toBeGreaterThan(0);
      expect(results.performanceMetrics.analysisTimeMs).toBeLessThanOrEqual(actualTime + 100);
      expect(results.performanceMetrics.recommendationsGenerated).toBeGreaterThan(0);
      expect(results.performanceMetrics.chartTypesConsidered).toBeGreaterThan(0);
    });
  });

  describe('error handling', () => {
    it('should handle null inputs gracefully', async () => {
      await expect(
        analyzer.analyze(null as any, mockSection2Results, mockSection3Results)
      ).rejects.toThrow();
    });

    it('should handle invalid data structures', async () => {
      const invalidSection1 = { ...mockSection1Results, metadata: null };
      
      await expect(
        analyzer.analyze(invalidSection1 as any, mockSection2Results, mockSection3Results)
      ).rejects.toThrow();
    });
  });

  describe('configuration and customization', () => {
    it('should support custom analysis configuration', async () => {
      const customConfig = { maxRecommendations: 5, includeMultivariate: false };
      
      const results = await analyzer.analyze(
        mockSection1Results,
        mockSection2Results,
        mockSection3Results,
        customConfig
      );

      expect(results.visualizationAnalysis).toBeDefined();
    });
  });
});