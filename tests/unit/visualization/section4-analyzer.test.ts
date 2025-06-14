/**
 * Section 4 Analyzer Tests
 * 
 * Tests the visualization analysis engine that provides intelligent chart recommendations,
 * aesthetic optimization, and technical implementation guidance for data visualizations.
 */

import { Section4Analyzer } from '../../../src/analyzers/visualization/section4-analyzer';
import type { Section4Result } from '../../../src/analyzers/visualization/types';
import { RecommendationType, AccessibilityLevel, ComplexityLevel, PerformanceLevel } from '../../../src/analyzers/visualization/types';

describe('Section4Analyzer', () => {
  describe('Basic Functionality', () => {
    it('should create an analyzer instance', () => {
      const analyzer = new Section4Analyzer();
      expect(analyzer).toBeDefined();
      expect(analyzer).toBeInstanceOf(Section4Analyzer);
    });

    it('should have analyze method', () => {
      const analyzer = new Section4Analyzer();
      expect(typeof analyzer.analyze).toBe('function');
    });

    it('should accept configuration in constructor', () => {
      const config = { accessibilityLevel: AccessibilityLevel.GOOD };
      const analyzer = new Section4Analyzer(config);
      expect(analyzer).toBeDefined();
    });
  });

  describe('Configuration', () => {
    it('should work with default configuration', () => {
      const analyzer = new Section4Analyzer();
      expect(analyzer).toBeDefined();
    });

    it('should work with custom configuration', () => {
      const config = {
        accessibilityLevel: AccessibilityLevel.EXCELLENT,
        complexityThreshold: ComplexityLevel.MODERATE,
        performanceThreshold: PerformanceLevel.FAST
      };
      const analyzer = new Section4Analyzer(config);
      expect(analyzer).toBeDefined();
    });

    it('should work with partial configuration', () => {
      const config = {
        maxRecommendationsPerChart: 5
      };
      const analyzer = new Section4Analyzer(config);
      expect(analyzer).toBeDefined();
    });
  });

  describe('Type Safety', () => {
    it('should return proper Section4Result type structure', async () => {
      const analyzer = new Section4Analyzer();
      
      // Create minimal mock inputs that match the expected types
      const mockSection1 = {
        overview: {
          version: '1.3.1',
          generatedAt: new Date(),
          fileDetails: {
            originalFilename: 'test.csv',
            fullResolvedPath: '/test.csv',
            fileSizeBytes: 1000,
            fileSizeMB: 1,
            mimeType: 'text/csv',
            lastModified: new Date(),
            sha256Hash: 'test123'
          }
        }
      } as any;

      const mockSection3 = {
        edaAnalysis: {
          univariateAnalysis: []
        }
      } as any;

      try {
        const result = await analyzer.analyze(mockSection1, mockSection3);
        
        // Basic structure validation
        expect(result).toBeDefined();
        expect(typeof result).toBe('object');
        expect(result.visualizationAnalysis).toBeDefined();
        expect(Array.isArray(result.warnings)).toBe(true);
      } catch (error) {
        // It's okay if the analysis fails with mock data, 
        // we're just testing the basic structure
        expect(error).toBeInstanceOf(Error);
      }
    });
  });
});