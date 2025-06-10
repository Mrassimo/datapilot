/**
 * End-to-End Integration Test for Phase 3 Modules
 * Tests the integration between Module 1 (Advanced Dataset Characterization) 
 * and Module 2 (Intelligent Algorithm Selection)
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import { DatasetCharacterizationAnalyzer } from '../../src/analyzers/modeling/advanced-characterization/dataset-characterization-analyzer';
import { IntelligentAlgorithmSelectionAnalyzer } from '../../src/analyzers/modeling/intelligent-algorithm-selection/intelligent-algorithm-selection-analyzer';
import type { Section1Result } from '../../src/analyzers/overview/types';
import type { Section2Result } from '../../src/analyzers/quality/types';
import type { Section3Result } from '../../src/analyzers/eda/types';
import type { DatasetComplexityProfile } from '../../src/analyzers/modeling/advanced-characterization/types';
import type { AlgorithmSelectionProfile } from '../../src/analyzers/modeling/intelligent-algorithm-selection/types';

describe('Phase 3 Module Integration: Dataset Characterization + Algorithm Selection', () => {
  let characterizationAnalyzer: DatasetCharacterizationAnalyzer;
  let algorithmSelectionAnalyzer: IntelligentAlgorithmSelectionAnalyzer;
  let mockSection1Result: Section1Result;
  let mockSection2Result: Section2Result;
  let mockSection3Result: Section3Result;

  beforeEach(() => {
    characterizationAnalyzer = new DatasetCharacterizationAnalyzer();
    algorithmSelectionAnalyzer = new IntelligentAlgorithmSelectionAnalyzer();
    
    mockSection1Result = createMockSection1Result();
    mockSection2Result = createMockSection2Result();
    mockSection3Result = createMockSection3Result();
  });

  describe('Full Integration Pipeline', () => {
    test('should successfully run complete Module 1 → Module 2 pipeline', async () => {
      // Step 1: Run Dataset Characterization (Module 1)
      const complexityProfile: DatasetComplexityProfile = await characterizationAnalyzer.analyze(
        mockSection1Result,
        mockSection2Result,
        mockSection3Result
      );

      // Verify Module 1 output
      expect(complexityProfile).toBeDefined();
      expect(complexityProfile.overallComplexityScore).toBeGreaterThanOrEqual(0);
      expect(complexityProfile.overallComplexityScore).toBeLessThanOrEqual(100);
      expect(complexityProfile.confidenceLevel).toBeDefined();
      expect(complexityProfile.analysisMetadata).toBeDefined();
      expect(complexityProfile.intrinsicDimensionality).toBeDefined();
      expect(complexityProfile.noiseLevel).toBeDefined();
      expect(complexityProfile.sparsityCharacteristics).toBeDefined();

      // Step 2: Run Algorithm Selection using Module 1 output (Module 2)
      const algorithmProfile: AlgorithmSelectionProfile = await algorithmSelectionAnalyzer.analyze(
        mockSection1Result,
        mockSection2Result,
        mockSection3Result,
        complexityProfile
      );

      // Verify Module 2 output
      expect(algorithmProfile).toBeDefined();
      expect(algorithmProfile.selectedAlgorithms).toBeDefined();
      expect(algorithmProfile.selectedAlgorithms.length).toBeGreaterThan(0);
      expect(algorithmProfile.selectionReasoning).toBeDefined();
      expect(algorithmProfile.performancePredictions).toBeDefined();
      expect(algorithmProfile.riskAssessment).toBeDefined();
      expect(algorithmProfile.hyperparameterGuidance).toBeDefined();
      expect(algorithmProfile.implementationStrategy).toBeDefined();
      expect(algorithmProfile.selectionMetadata).toBeDefined();

      // Verify integration coherence
      expect(algorithmProfile.selectionMetadata.dataCharacteristics.complexity)
        .toBe(complexityProfile.overallComplexityScore);
    }, 30000); // Allow 30 seconds for full pipeline

    test('should handle simple dataset scenario correctly', async () => {
      // Create a simple dataset scenario
      const simpleSection1 = {
        ...mockSection1Result,
        overview: {
          ...mockSection1Result.overview,
          structuralDimensions: {
            ...mockSection1Result.overview.structuralDimensions,
            totalDataRows: 1000,
            totalColumns: 5
          }
        }
      };

      // Step 1: Characterize simple dataset
      const complexityProfile = await characterizationAnalyzer.analyze(
        simpleSection1,
        mockSection2Result,
        mockSection3Result
      );

      // Expect lower complexity for simple dataset
      expect(complexityProfile.overallComplexityScore).toBeLessThan(60);
      expect(complexityProfile.intrinsicDimensionality.estimatedDimension).toBeLessThanOrEqual(5);

      // Step 2: Select algorithms for simple dataset
      const algorithmProfile = await algorithmSelectionAnalyzer.analyze(
        simpleSection1,
        mockSection2Result,
        mockSection3Result,
        complexityProfile
      );

      // Should recommend simpler, more interpretable algorithms
      const recommendedAlgorithms = algorithmProfile.selectedAlgorithms;
      expect(recommendedAlgorithms.length).toBeGreaterThan(0);
      
      // At least one algorithm should be moderately interpretable
      const interpretableAlgorithms = recommendedAlgorithms.filter(
        alg => ['very_high', 'high', 'medium'].includes(alg.interpretability)
      );
      expect(interpretableAlgorithms.length).toBeGreaterThan(0);
    });

    test('should handle complex dataset scenario correctly', async () => {
      // Create a complex dataset scenario
      const complexSection1 = {
        ...mockSection1Result,
        overview: {
          ...mockSection1Result.overview,
          structuralDimensions: {
            ...mockSection1Result.overview.structuralDimensions,
            totalDataRows: 100000,
            totalColumns: 50
          }
        }
      };

      // Step 1: Characterize complex dataset
      const complexityProfile = await characterizationAnalyzer.analyze(
        complexSection1,
        mockSection2Result,
        mockSection3Result
      );

      // Expect higher complexity for large dataset
      expect(complexityProfile.overallComplexityScore).toBeGreaterThan(40);
      expect(complexityProfile.intrinsicDimensionality.actualFeatureCount).toBe(50);

      // Step 2: Select algorithms for complex dataset
      const algorithmProfile = await algorithmSelectionAnalyzer.analyze(
        complexSection1,
        mockSection2Result,
        mockSection3Result,
        complexityProfile
      );

      // Should consider scalability and handle complexity
      const recommendedAlgorithms = algorithmProfile.selectedAlgorithms;
      expect(recommendedAlgorithms.length).toBeGreaterThan(0);
      
      // Should provide robust implementation strategy for complex scenario
      expect(algorithmProfile.implementationStrategy.timeline.totalDuration).toBeGreaterThan(0);
      expect(algorithmProfile.riskAssessment.overallRiskLevel).toBeDefined();
    });

    test('should maintain consistency across multiple runs', async () => {
      // Run the pipeline multiple times with same inputs
      const results: AlgorithmSelectionProfile[] = [];
      
      for (let i = 0; i < 3; i++) {
        const complexityProfile = await characterizationAnalyzer.analyze(
          mockSection1Result,
          mockSection2Result,
          mockSection3Result
        );
        
        const algorithmProfile = await algorithmSelectionAnalyzer.analyze(
          mockSection1Result,
          mockSection2Result,
          mockSection3Result,
          complexityProfile
        );
        
        results.push(algorithmProfile);
      }

      // Verify consistency
      expect(results.length).toBe(3);
      
      // All runs should produce same algorithm recommendations
      const firstRunAlgorithms = results[0].selectedAlgorithms.map(a => a.algorithmName).sort();
      
      for (let i = 1; i < results.length; i++) {
        const currentRunAlgorithms = results[i].selectedAlgorithms.map(a => a.algorithmName).sort();
        expect(currentRunAlgorithms).toEqual(firstRunAlgorithms);
      }
    });

    test('should handle progress tracking across both modules', async () => {
      const progressUpdates: string[] = [];
      
      // Track progress for Module 1
      const characterizationProgress = (progress: any) => {
        progressUpdates.push(`Module1: ${progress.phase} - ${progress.progress}%`);
      };
      
      const complexityProfile = await characterizationAnalyzer.analyze(
        mockSection1Result,
        mockSection2Result,
        mockSection3Result,
        characterizationProgress
      );
      
      // Track progress for Module 2
      const selectionProgress = (progress: any) => {
        progressUpdates.push(`Module2: ${progress.phase} - ${progress.progress}%`);
      };
      
      const algorithmProfile = await algorithmSelectionAnalyzer.analyze(
        mockSection1Result,
        mockSection2Result,
        mockSection3Result,
        complexityProfile,
        selectionProgress
      );
      
      // Verify progress tracking worked
      expect(progressUpdates.length).toBeGreaterThan(0);
      
      // Should have progress from both modules
      const module1Updates = progressUpdates.filter(update => update.startsWith('Module1:'));
      const module2Updates = progressUpdates.filter(update => update.startsWith('Module2:'));
      
      expect(module1Updates.length).toBeGreaterThan(0);
      expect(module2Updates.length).toBeGreaterThan(0);
      
      // Verify final results
      expect(complexityProfile).toBeDefined();
      expect(algorithmProfile).toBeDefined();
    });

    test('should provide comprehensive analysis metadata', async () => {
      const startTime = Date.now();
      
      const complexityProfile = await characterizationAnalyzer.analyze(
        mockSection1Result,
        mockSection2Result,
        mockSection3Result
      );
      
      const algorithmProfile = await algorithmSelectionAnalyzer.analyze(
        mockSection1Result,
        mockSection2Result,
        mockSection3Result,
        complexityProfile
      );
      
      const endTime = Date.now();
      
      // Verify Module 1 metadata
      expect(complexityProfile.analysisMetadata.analysisTimestamp).toBeInstanceOf(Date);
      expect(complexityProfile.analysisMetadata.analysisVersion).toBeDefined();
      expect(complexityProfile.analysisMetadata.computationTime).toBeGreaterThan(0);
      expect(complexityProfile.analysisMetadata.sampleSize).toBeGreaterThan(0);
      
      // Verify Module 2 metadata
      expect(algorithmProfile.selectionMetadata.selectionTimestamp).toBeInstanceOf(Date);
      expect(algorithmProfile.selectionMetadata.selectionVersion).toBeDefined();
      expect(algorithmProfile.selectionMetadata.computationTime).toBeGreaterThan(0);
      expect(algorithmProfile.selectionMetadata.selectionConfidence).toBeGreaterThanOrEqual(0);
      expect(algorithmProfile.selectionMetadata.selectionConfidence).toBeLessThanOrEqual(1);
      
      // Verify timestamps are reasonable
      const characterizationTime = complexityProfile.analysisMetadata.analysisTimestamp.getTime();
      const selectionTime = algorithmProfile.selectionMetadata.selectionTimestamp.getTime();
      
      expect(characterizationTime).toBeGreaterThanOrEqual(startTime);
      expect(characterizationTime).toBeLessThanOrEqual(endTime);
      expect(selectionTime).toBeGreaterThanOrEqual(characterizationTime);
      expect(selectionTime).toBeLessThanOrEqual(endTime);
    });
  });

  describe('Error Handling and Resilience', () => {
    test('should handle Module 1 errors gracefully', async () => {
      const problematicSection1 = {
        ...mockSection1Result,
        overview: {
          ...mockSection1Result.overview,
          structuralDimensions: {
            ...mockSection1Result.overview.structuralDimensions,
            totalDataRows: 0,
            totalColumns: 0
          }
        }
      };

      // Module 1 should handle edge case gracefully
      const complexityProfile = await characterizationAnalyzer.analyze(
        problematicSection1,
        mockSection2Result,
        mockSection3Result
      );

      expect(complexityProfile).toBeDefined();
      expect(complexityProfile.overallComplexityScore).toBeGreaterThanOrEqual(0);
      
      // Module 2 should work with Module 1's graceful handling
      const algorithmProfile = await algorithmSelectionAnalyzer.analyze(
        problematicSection1,
        mockSection2Result,
        mockSection3Result,
        complexityProfile
      );

      expect(algorithmProfile).toBeDefined();
      expect(algorithmProfile.selectedAlgorithms).toBeDefined();
    });

    test('should maintain quality with invalid inputs', async () => {
      const invalidSection2 = {} as Section2Result;
      const invalidSection3 = {} as Section3Result;

      // Should still produce reasonable results with missing data
      const complexityProfile = await characterizationAnalyzer.analyze(
        mockSection1Result,
        invalidSection2,
        invalidSection3
      );

      expect(complexityProfile).toBeDefined();
      expect(complexityProfile.confidenceLevel).toBeDefined();
      
      const algorithmProfile = await algorithmSelectionAnalyzer.analyze(
        mockSection1Result,
        invalidSection2,
        invalidSection3,
        complexityProfile
      );

      expect(algorithmProfile).toBeDefined();
      expect(algorithmProfile.selectedAlgorithms.length).toBeGreaterThan(0);
    });
  });
});

// Mock data creation helpers
function createMockSection1Result(): Section1Result {
  return {
    overview: {
      fileDetails: {
        originalFilename: 'integration-test.csv',
        fullResolvedPath: '/path/to/integration-test.csv',
        fileSizeBytes: 10240,
        fileSizeMB: 0.01,
        mimeType: 'text/csv',
        lastModified: new Date(),
        sha256Hash: 'integration123'
      },
      parsingMetadata: {
        dataSourceType: 'Local File System',
        parsingEngine: 'integration-test-engine',
        parsingTimeSeconds: 0.5,
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
          linesScanned: 500,
          bytesScanned: 10240
        }
      },
      structuralDimensions: {
        totalRowsRead: 500,
        totalDataRows: 500,
        totalColumns: 15,
        totalDataCells: 7500,
        columnInventory: Array.from({ length: 15 }, (_, i) => ({
          index: i,
          name: `feature_${i}`,
          originalIndex: i
        })),
        estimatedInMemorySizeMB: 0.5,
        averageRowLengthBytes: 75,
        sparsityAnalysis: {
          sparsityPercentage: 10,
          method: 'missing_value_analysis',
          sampleSize: 500,
          description: 'Moderate sparsity detected'
        }
      },
      executionContext: {
        fullCommandExecuted: 'datapilot integration-test.csv',
        analysisMode: 'comprehensive',
        analysisStartTimestamp: new Date(),
        globalSamplingStrategy: 'full',
        activatedModules: ['section1', 'section2', 'section3'],
        processingTimeSeconds: 2.5
      },
      generatedAt: new Date(),
      version: '1.0.0'
    },
    warnings: [],
    performanceMetrics: {
      totalAnalysisTime: 2500,
      phases: { 
        section1: 1000,
        section2: 800,
        section3: 700
      }
    }
  };
}

function createMockSection2Result(): Section2Result {
  return {} as Section2Result;
}

function createMockSection3Result(): Section3Result {
  return {} as Section3Result;
}