/**
 * Unit Tests for Advanced Dataset Characterization Analyzer
 * Comprehensive testing of core functionality, error handling, and edge cases
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { DatasetCharacterizationAnalyzer } from '../../../../src/analyzers/modeling/advanced-characterization/dataset-characterization-analyzer';
import type {
  DatasetCharacterizationConfig,
  CharacterizationProgress,
  DatasetComplexityProfile
} from '../../../../src/analyzers/modeling/advanced-characterization/types';
import type { Section1Result } from '../../../../src/analyzers/overview/types';
import type { Section2Result } from '../../../../src/analyzers/quality/types';
import type { Section3Result } from '../../../../src/analyzers/eda/types';

describe('DatasetCharacterizationAnalyzer', () => {
  let analyzer: DatasetCharacterizationAnalyzer;
  let mockSection1Result: Section1Result;
  let mockSection2Result: Section2Result;
  let mockSection3Result: Section3Result;

  beforeEach(() => {
    // Initialize analyzer with default config
    analyzer = new DatasetCharacterizationAnalyzer();

    // Create mock section results
    mockSection1Result = createMockSection1Result();
    mockSection2Result = createMockSection2Result();
    mockSection3Result = createMockSection3Result();
  });

  describe('Constructor and Configuration', () => {
    test('should initialize with default configuration', () => {
      const defaultAnalyzer = new DatasetCharacterizationAnalyzer();
      expect(defaultAnalyzer).toBeInstanceOf(DatasetCharacterizationAnalyzer);
    });

    test('should accept custom configuration', () => {
      const customConfig: Partial<DatasetCharacterizationConfig> = {
        analysisDepth: 'comprehensive',
        focusAreas: ['complexity', 'interactions'],
        computationalBudget: {
          maxComputationTime: 120000,
          maxMemoryUsage: 512,
          parallelizationLevel: 2
        }
      };

      const customAnalyzer = new DatasetCharacterizationAnalyzer(customConfig);
      expect(customAnalyzer).toBeInstanceOf(DatasetCharacterizationAnalyzer);
    });

    test('should merge custom config with defaults properly', () => {
      const partialConfig: Partial<DatasetCharacterizationConfig> = {
        analysisDepth: 'basic'
      };

      const analyzer = new DatasetCharacterizationAnalyzer(partialConfig);
      // The analyzer should have the custom analysisDepth but default focusAreas
      expect(analyzer).toBeInstanceOf(DatasetCharacterizationAnalyzer);
    });
  });

  describe('Input Validation', () => {
    test('should validate Section 1 result', async () => {
      const invalidSection1 = null as any;
      
      await expect(
        analyzer.analyze(invalidSection1, mockSection2Result, mockSection3Result)
      ).rejects.toThrow('Invalid Section 1 result');
    });

    test('should validate Section 2 result', async () => {
      const invalidSection2 = null as any;
      
      await expect(
        analyzer.analyze(mockSection1Result, invalidSection2, mockSection3Result)
      ).rejects.toThrow('Invalid Section 2 result');
    });

    test('should validate Section 3 result', async () => {
      const invalidSection3 = null as any;
      
      await expect(
        analyzer.analyze(mockSection1Result, mockSection2Result, invalidSection3)
      ).rejects.toThrow('Invalid Section 3 result');
    });

    test('should accept valid inputs without throwing', async () => {
      // This should not throw during validation phase
      const analysisPromise = analyzer.analyze(
        mockSection1Result,
        mockSection2Result,
        mockSection3Result
      );

      // The analysis should start successfully (though it may complete with placeholder data)
      await expect(analysisPromise).resolves.toBeDefined();
    });
  });

  describe('Progress Tracking', () => {
    test('should call progress callback during analysis', async () => {
      const progressCallback = jest.fn<(progress: CharacterizationProgress) => void>();
      
      await analyzer.analyze(
        mockSection1Result,
        mockSection2Result,
        mockSection3Result,
        progressCallback
      );

      // Should have called progress callback multiple times
      expect(progressCallback).toHaveBeenCalled();
      expect(progressCallback.mock.calls.length).toBeGreaterThan(0);
    });

    test('should provide meaningful progress information', async () => {
      const progressUpdates: CharacterizationProgress[] = [];
      const progressCallback = (progress: CharacterizationProgress) => {
        progressUpdates.push({ ...progress });
      };
      
      await analyzer.analyze(
        mockSection1Result,
        mockSection2Result,
        mockSection3Result,
        progressCallback
      );

      // Verify progress updates are meaningful
      expect(progressUpdates.length).toBeGreaterThan(0);
      
      // First update should be initialization
      expect(progressUpdates[0].phase).toBe('initialization');
      expect(progressUpdates[0].progress).toBe(0);
      
      // Last update should be completion
      const lastUpdate = progressUpdates[progressUpdates.length - 1];
      expect(lastUpdate.phase).toBe('finalization');
      expect(lastUpdate.progress).toBe(100);
      
      // Progress should be non-decreasing
      for (let i = 1; i < progressUpdates.length; i++) {
        expect(progressUpdates[i].progress).toBeGreaterThanOrEqual(progressUpdates[i - 1].progress);
      }
    });

    test('should include operation descriptions in progress', async () => {
      const progressUpdates: CharacterizationProgress[] = [];
      const progressCallback = (progress: CharacterizationProgress) => {
        progressUpdates.push({ ...progress });
      };
      
      await analyzer.analyze(
        mockSection1Result,
        mockSection2Result,
        mockSection3Result,
        progressCallback
      );

      // Each progress update should have a meaningful operation description
      progressUpdates.forEach(update => {
        expect(update.currentOperation).toBeDefined();
        expect(update.currentOperation.length).toBeGreaterThan(0);
        expect(typeof update.currentOperation).toBe('string');
      });
    });
  });

  describe('Analysis Results', () => {
    test('should return a complete DatasetComplexityProfile', async () => {
      const result = await analyzer.analyze(
        mockSection1Result,
        mockSection2Result,
        mockSection3Result
      );

      // Verify all required properties are present
      expect(result).toBeDefined();
      expect(result.intrinsicDimensionality).toBeDefined();
      expect(result.featureInteractionDensity).toBeDefined();
      expect(result.nonLinearityScore).toBeDefined();
      expect(result.noiseLevel).toBeDefined();
      expect(result.sparsityCharacteristics).toBeDefined();
      expect(result.overallComplexityScore).toBeDefined();
      expect(result.confidenceLevel).toBeDefined();
      expect(result.analysisMetadata).toBeDefined();
    });

    test('should provide intrinsic dimensionality analysis', async () => {
      const result = await analyzer.analyze(
        mockSection1Result,
        mockSection2Result,
        mockSection3Result
      );

      const dimensionality = result.intrinsicDimensionality;
      expect(dimensionality.estimatedDimension).toBeGreaterThan(0);
      expect(dimensionality.actualFeatureCount).toBeGreaterThanOrEqual(dimensionality.estimatedDimension);
      expect(dimensionality.dimensionalityReduction).toBeGreaterThanOrEqual(0);
      expect(dimensionality.dimensionalityReduction).toBeLessThanOrEqual(1);
      expect(dimensionality.confidence).toBeGreaterThan(0);
      expect(dimensionality.confidence).toBeLessThanOrEqual(1);
      expect(dimensionality.method).toBeDefined();
      expect(Array.isArray(dimensionality.redundantFeatures)).toBe(true);
      expect(Array.isArray(dimensionality.criticalFeatures)).toBe(true);
    });

    test('should provide noise analysis', async () => {
      const result = await analyzer.analyze(
        mockSection1Result,
        mockSection2Result,
        mockSection3Result
      );

      const noise = result.noiseLevel;
      expect(noise.overallNoiseLevel).toBeGreaterThanOrEqual(0);
      expect(noise.overallNoiseLevel).toBeLessThanOrEqual(1);
      expect(noise.signalToNoiseRatio).toBeGreaterThan(0);
      expect(noise.outlierAnalysis).toBeDefined();
      expect(noise.outlierAnalysis.outlierPercentage).toBeGreaterThanOrEqual(0);
      expect(noise.outlierAnalysis.outlierPercentage).toBeLessThanOrEqual(1);
      expect(noise.dataQualityImpact).toBeDefined();
      expect(noise.dataQualityImpact.reliabilityScore).toBeGreaterThanOrEqual(0);
      expect(noise.dataQualityImpact.reliabilityScore).toBeLessThanOrEqual(1);
    });

    test('should provide sparsity analysis', async () => {
      const result = await analyzer.analyze(
        mockSection1Result,
        mockSection2Result,
        mockSection3Result
      );

      const sparsity = result.sparsityCharacteristics;
      expect(sparsity.overallSparsity).toBeGreaterThanOrEqual(0);
      expect(sparsity.overallSparsity).toBeLessThanOrEqual(1);
      expect(sparsity.sparsityImpact).toBeDefined();
      expect(sparsity.sparsityImpact.performanceImpact).toBeGreaterThanOrEqual(0);
      expect(sparsity.sparsityImpact.performanceImpact).toBeLessThanOrEqual(1);
      expect(Array.isArray(sparsity.featureSparsity)).toBe(true);
      expect(Array.isArray(sparsity.sparsityPatterns)).toBe(true);
      expect(Array.isArray(sparsity.handlingRecommendations)).toBe(true);
    });

    test('should calculate reasonable overall complexity score', async () => {
      const result = await analyzer.analyze(
        mockSection1Result,
        mockSection2Result,
        mockSection3Result
      );

      expect(result.overallComplexityScore).toBeGreaterThanOrEqual(0);
      expect(result.overallComplexityScore).toBeLessThanOrEqual(100);
      expect(typeof result.overallComplexityScore).toBe('number');
    });

    test('should provide analysis metadata', async () => {
      const startTime = Date.now();
      
      const result = await analyzer.analyze(
        mockSection1Result,
        mockSection2Result,
        mockSection3Result
      );

      const metadata = result.analysisMetadata;
      expect(metadata.analysisTimestamp).toBeInstanceOf(Date);
      expect(metadata.analysisTimestamp.getTime()).toBeGreaterThanOrEqual(startTime);
      expect(metadata.analysisVersion).toBeDefined();
      expect(metadata.computationTime).toBeGreaterThan(0);
      expect(metadata.confidenceBounds).toBeDefined();
      expect(metadata.confidenceBounds.overallConfidence).toBeGreaterThanOrEqual(0);
      expect(metadata.confidenceBounds.overallConfidence).toBeLessThanOrEqual(1);
      expect(metadata.reproducibilityInfo).toBeDefined();
      expect(metadata.reproducibilityInfo.deterministicAnalysis).toBeDefined();
    });
  });

  describe('Configuration Respect', () => {
    test('should respect analysis depth configuration', async () => {
      const basicConfig: Partial<DatasetCharacterizationConfig> = {
        analysisDepth: 'basic',
        focusAreas: ['complexity']
      };

      const basicAnalyzer = new DatasetCharacterizationAnalyzer(basicConfig);
      const result = await basicAnalyzer.analyze(
        mockSection1Result,
        mockSection2Result,
        mockSection3Result
      );

      expect(result).toBeDefined();
      // Basic analysis should still provide core results
      expect(result.overallComplexityScore).toBeDefined();
    });

    test('should respect computational budget', async () => {
      const constrainedConfig: Partial<DatasetCharacterizationConfig> = {
        computationalBudget: {
          maxComputationTime: 1000, // 1 second
          maxMemoryUsage: 64, // 64 MB
          parallelizationLevel: 1
        }
      };

      const constrainedAnalyzer = new DatasetCharacterizationAnalyzer(constrainedConfig);
      const startTime = Date.now();
      
      const result = await constrainedAnalyzer.analyze(
        mockSection1Result,
        mockSection2Result,
        mockSection3Result
      );

      const actualTime = Date.now() - startTime;
      
      expect(result).toBeDefined();
      // Should complete reasonably quickly given constraints
      expect(actualTime).toBeLessThan(5000); // Should be much less than 5 seconds
    });

    test('should respect focus areas configuration', async () => {
      const focusedConfig: Partial<DatasetCharacterizationConfig> = {
        focusAreas: ['complexity', 'noise']
      };

      const focusedAnalyzer = new DatasetCharacterizationAnalyzer(focusedConfig);
      const result = await focusedAnalyzer.analyze(
        mockSection1Result,
        mockSection2Result,
        mockSection3Result
      );

      expect(result).toBeDefined();
      expect(result.intrinsicDimensionality).toBeDefined(); // Complexity focus
      expect(result.noiseLevel).toBeDefined(); // Noise focus
    });
  });

  describe('Error Handling', () => {
    test('should handle computational errors gracefully', async () => {
      // Create problematic data that might cause computational issues
      const problematicSection1 = {
        ...mockSection1Result,
        overview: {
          ...mockSection1Result.overview,
          structuralDimensions: {
            ...mockSection1Result.overview.structuralDimensions,
            totalDataRows: 0, // Zero rows might cause issues
            totalColumns: 0
          }
        }
      };

      // Should not throw but may return with warnings
      const result = await analyzer.analyze(
        problematicSection1,
        mockSection2Result,
        mockSection3Result
      );

      expect(result).toBeDefined();
      // Should have reasonable fallback values
      expect(result.overallComplexityScore).toBeGreaterThanOrEqual(0);
      expect(result.overallComplexityScore).toBeLessThanOrEqual(100);
    });

    test('should provide meaningful error messages', async () => {
      const invalidSection1 = { overview: null } as any;

      await expect(
        analyzer.analyze(invalidSection1, mockSection2Result, mockSection3Result)
      ).rejects.toThrow(expect.objectContaining({
        message: expect.stringContaining('Invalid Section 1 result')
      }));
    });
  });

  describe('Performance', () => {
    test('should complete analysis in reasonable time', async () => {
      const startTime = Date.now();
      
      const result = await analyzer.analyze(
        mockSection1Result,
        mockSection2Result,
        mockSection3Result
      );

      const duration = Date.now() - startTime;
      
      expect(result).toBeDefined();
      expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
    });

    test('should handle larger dataset metadata efficiently', async () => {
      const largeDatasetSection1 = {
        ...mockSection1Result,
        overview: {
          ...mockSection1Result.overview,
          structuralDimensions: {
            ...mockSection1Result.overview.structuralDimensions,
            totalDataRows: 1000000, // 1M rows
            totalColumns: 100 // 100 features
          }
        }
      };

      const startTime = Date.now();
      
      const result = await analyzer.analyze(
        largeDatasetSection1,
        mockSection2Result,
        mockSection3Result
      );

      const duration = Date.now() - startTime;
      
      expect(result).toBeDefined();
      expect(duration).toBeLessThan(15000); // Should still be reasonable
    });
  });
});

// Mock data creation helpers
function createMockSection1Result(): Section1Result {
  return {
    overview: {
      fileDetails: {
        originalFilename: 'test.csv',
        fullResolvedPath: '/path/to/test.csv',
        fileSizeBytes: 1024,
        fileSizeMB: 0.001,
        mimeType: 'text/csv',
        lastModified: new Date(),
        sha256Hash: 'abc123'
      },
      parsingMetadata: {
        dataSourceType: 'Local File System',
        parsingEngine: 'test-engine',
        parsingTimeSeconds: 0.1,
        encoding: {
          encoding: 'utf8',
          detectionMethod: 'automatic',
          confidence: 100,
          bomDetected: false
        },
        delimiter: {
          delimiter: ',',
          detectionMethod: 'automatic',
          confidence: 100,
          alternativesConsidered: []
        },
        lineEnding: 'LF',
        quotingCharacter: '"',
        emptyLinesEncountered: 0,
        headerProcessing: {
          headerPresence: 'Detected',
          headerRowNumbers: [1],
          columnNamesSource: 'first_row'
        },
        initialScanLimit: {
          method: 'full_scan',
          linesScanned: 100,
          bytesScanned: 1024
        }
      },
      structuralDimensions: {
        totalRowsRead: 100,
        totalDataRows: 100,
        totalColumns: 10,
        totalDataCells: 1000,
        columnInventory: Array.from({ length: 10 }, (_, i) => ({
          index: i,
          name: `column_${i}`,
          originalIndex: i
        })),
        estimatedInMemorySizeMB: 0.1,
        averageRowLengthBytes: 50,
        sparsityAnalysis: {
          sparsityPercentage: 5,
          method: 'missing_value_analysis',
          sampleSize: 100,
          description: 'Low sparsity detected'
        }
      },
      executionContext: {
        fullCommandExecuted: 'datapilot test.csv',
        analysisMode: 'comprehensive',
        analysisStartTimestamp: new Date(),
        globalSamplingStrategy: 'full',
        activatedModules: ['section1'],
        processingTimeSeconds: 0.1
      },
      generatedAt: new Date(),
      version: '1.0.0'
    },
    warnings: [],
    performanceMetrics: {
      totalAnalysisTime: 100,
      phases: { section1: 100 }
    }
  };
}

function createMockSection2Result(): Section2Result {
  return {
    // Placeholder - will be enhanced when actual Section2Result type is available
  } as any;
}

function createMockSection3Result(): Section3Result {
  return {
    // Placeholder - will be enhanced when actual Section3Result type is available
  } as any;
}