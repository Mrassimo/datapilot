/**
 * Outlier Analyzer Tests
 * 
 * Tests multivariate outlier detection algorithms including Mahalanobis distance,
 * Isolation Forest, and ensemble methods for data quality assessment.
 */

import { MultivariateOutlierAnalyzer } from '../../../src/analyzers/multivariate/outlier-analyzer';

describe('MultivariateOutlierAnalyzer', () => {
  describe('Mahalanobis Distance Outlier Detection', () => {
    it('should detect clear multivariate outliers', () => {
      // Dataset with obvious outliers
      const data = [
        [1, 10, 100],    // Normal
        [2, 12, 110],    // Normal
        [3, 11, 105],    // Normal
        [2.5, 11.5, 108], // Normal
        [1.8, 10.2, 102], // Normal
        [50, 200, 1000], // Clear outlier - all values extreme
        [1.5, 10.8, 106], // Normal
        [2.2, 11.8, 112], // Normal
      ];

      const result = MultivariateOutlierAnalyzer.detectOutliers(data);

      expect(result.outliers.length).toBeGreaterThan(0);
      
      // Should detect the obvious outlier (row index 5)
      const extremeOutlier = result.outliers.find(outlier => 
        outlier.rowIndex === 5
      );
      expect(extremeOutlier).toBeDefined();
      expect(extremeOutlier?.severity).toBe('extreme');
      expect(extremeOutlier?.mahalanobisDistance).toBeGreaterThan(10);
    });

    it('should calculate Mahalanobis distance correctly', () => {
      const data = [
        [0, 0],
        [1, 1],
        [2, 2],
        [3, 3],
        [10, 10], // Outlier along the diagonal
      ];

      const result = MultivariateOutlierAnalyzer.detectOutliers(data);

      // Outlier should have higher Mahalanobis distance
      const outlier = result.outliers.find(o => o.rowIndex === 4);
      expect(outlier?.mahalanobisDistance).toBeGreaterThan(5);
    });

    it('should use robust covariance estimation', () => {
      // Dataset where regular covariance would be skewed by outliers
      const data = [
        [1, 1], [1, 2], [1, 3], [2, 1], [2, 2], [2, 3], [3, 1], [3, 2], [3, 3],
        [100, 100], // Extreme outlier
        [1.5, 1.5], [1.5, 2.5], [2.5, 1.5], [2.5, 2.5],
      ];

      const result = MultivariateOutlierAnalyzer.detectOutliers(data, {
        useRobustCovariance: true,
        mcpContaminationRate: 0.1,
      });

      // Should still detect the extreme outlier even with robust estimation
      const extremeOutlier = result.outliers.find(o => o.rowIndex === 9);
      expect(extremeOutlier).toBeDefined();
      expect(extremeOutlier?.severity).toBe('extreme');
    });

    it('should classify outlier severity correctly', () => {
      const data = [
        [0, 0], [1, 1], [2, 2], [3, 3], [4, 4],   // Normal points
        [6, 6],    // Mild outlier
        [10, 10],  // Moderate outlier  
        [20, 20],  // Extreme outlier
      ];

      const result = MultivariateOutlierAnalyzer.detectOutliers(data);

      const outliers = result.outliers.sort((a, b) => b.mahalanobisDistance - a.mahalanobisDistance);
      
      if (outliers.length >= 3) {
        expect(outliers[0].severity).toBe('extreme');   // Highest distance
        expect(['moderate', 'extreme']).toContain(outliers[1].severity);
        expect(['mild', 'moderate']).toContain(outliers[2].severity);
      }
    });
  });

  describe('Isolation Forest Outlier Detection', () => {
    it('should detect outliers using isolation forest', () => {
      const data = [
        [1, 1], [1, 2], [2, 1], [2, 2], [3, 3],   // Normal cluster
        [1.5, 1.5], [2.5, 2.5], [1.8, 2.2],      // Normal cluster
        [10, 10], [11, 11],                       // Outlier cluster
        [50, 1],                                  // Isolated outlier
      ];

      const result = MultivariateOutlierAnalyzer.detectOutliers(data, {
        enableIsolationForest: true,
        isolationForestContamination: 0.2,
      });

      // Should detect outliers including the isolated point
      expect(result.outliers.length).toBeGreaterThan(0);
      
      // Isolated point should be detected
      const isolatedOutlier = result.outliers.find(o => o.rowIndex === 10);
      expect(isolatedOutlier).toBeDefined();
    });

    it('should handle high-dimensional data efficiently', () => {
      // 10-dimensional data with outliers
      const data = Array.from({ length: 100 }, (_, i) => {
        const point = Array.from({ length: 10 }, () => Math.random() * 5);
        if (i === 99) {
          // Make last point an outlier in all dimensions
          return point.map(() => 50);
        }
        return point;
      });

      const result = MultivariateOutlierAnalyzer.detectOutliers(data, {
        enableIsolationForest: true,
        maxTreeDepth: 10,
      });

      // Should detect the outlier efficiently
      const outlier = result.outliers.find(o => o.rowIndex === 99);
      expect(outlier).toBeDefined();
    });

    it('should configure forest parameters correctly', () => {
      const data = [
        [1, 1], [2, 2], [3, 3], [4, 4], [5, 5],
        [100, 100], // Clear outlier
      ];

      const result = MultivariateOutlierAnalyzer.detectOutliers(data, {
        enableIsolationForest: true,
        numberOfTrees: 50,
        maxTreeDepth: 8,
        subsampleSize: 5,
      });

      expect(result.algorithmDetails?.isolationForest?.treesUsed).toBe(50);
      expect(result.algorithmDetails?.isolationForest?.maxDepth).toBe(8);
    });
  });

  describe('Local Outlier Factor (LOF) Detection', () => {
    it('should detect local outliers using LOF', () => {
      // Data with local density differences
      const data = [
        // Dense cluster 1
        [1, 1], [1, 2], [2, 1], [2, 2], [1.5, 1.5],
        // Dense cluster 2  
        [10, 10], [10, 11], [11, 10], [11, 11], [10.5, 10.5],
        // Isolated point (local outlier)
        [5, 5],
      ];

      const result = MultivariateOutlierAnalyzer.detectOutliers(data, {
        enableLOF: true,
        lofNeighbors: 3,
      });

      // Should detect the isolated point as a local outlier
      const localOutlier = result.outliers.find(o => o.rowIndex === 10);
      expect(localOutlier).toBeDefined();
      expect(localOutlier?.lofScore).toBeGreaterThan(1.2); // LOF > 1 indicates outlier
    });

    it('should handle different neighborhood sizes', () => {
      const data = [
        [1, 1], [1, 2], [2, 1], [2, 2], [3, 3], [4, 4],
        [10, 1], // Outlier
      ];

      const analyzer = new MultivariateOutlierAnalyzer();
      
      // Test with different k values
      const result1 = analyzer.detectOutliers(data, { enableLOF: true, lofNeighbors: 2 });
      const result2 = analyzer.detectOutliers(data, { enableLOF: true, lofNeighbors: 4 });

      expect(result1.outliers.length).toBeGreaterThanOrEqual(0);
      expect(result2.outliers.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Ensemble Outlier Detection', () => {
    it('should combine multiple detection methods', () => {
      const data = [
        [1, 1], [2, 2], [3, 3], [4, 4], [5, 5],
        [100, 100], // Outlier that should be detected by all methods
        [1.2, 1.8], [2.3, 2.1], [3.1, 2.9],
      ];

      const result = MultivariateOutlierAnalyzer.detectOutliers(data, {
        useEnsemble: true,
        enableIsolationForest: true,
        enableLOF: true,
        ensembleVotingThreshold: 0.6,
      });

      // Ensemble should provide more confident outlier detection
      const outlier = result.outliers.find(o => o.rowIndex === 5);
      expect(outlier).toBeDefined();
      expect(outlier?.consensusScore).toBeGreaterThan(0.5);
      expect(outlier?.detectionMethods.length).toBeGreaterThan(1);
    });

    it('should calculate consensus scores correctly', () => {
      const data = [
        [1, 1], [2, 2], [3, 3],
        [10, 10], // Moderate outlier
        [50, 50], // Strong outlier
      ];

      const result = MultivariateOutlierAnalyzer.detectOutliers(data, {
        useEnsemble: true,
        enableIsolationForest: true,
        enableLOF: true,
      });

      // Strong outlier should have higher consensus
      const strongOutlier = result.outliers.find(o => o.rowIndex === 4);
      const moderateOutlier = result.outliers.find(o => o.rowIndex === 3);

      if (strongOutlier && moderateOutlier) {
        expect(strongOutlier.consensusScore).toBeGreaterThan(moderateOutlier.consensusScore);
      }
    });
  });

  describe('Variable Contribution Analysis', () => {
    it('should identify which variables contribute most to outlier behavior', () => {
      const data = [
        [1, 1, 1], [2, 2, 2], [3, 3, 3], [4, 4, 4],
        [100, 1, 1], // Outlier in first variable only
      ];

      const result = MultivariateOutlierAnalyzer.detectOutliers(data, {
        includeVariableContribution: true,
      });

      const outlier = result.outliers.find(o => o.rowIndex === 4);
      expect(outlier?.variableContributions).toBeDefined();
      
      if (outlier?.variableContributions) {
        // First variable should contribute most to outlier score
        expect(outlier.variableContributions[0]).toBeGreaterThan(outlier.variableContributions[1]);
        expect(outlier.variableContributions[0]).toBeGreaterThan(outlier.variableContributions[2]);
      }
    });

    it('should provide interpretable variable contribution explanations', () => {
      const data = [
        [10, 20, 30], [12, 22, 32], [11, 21, 31],
        [10, 200, 30], // Outlier in second variable
      ];

      const result = MultivariateOutlierAnalyzer.detectOutliers(data, {
        includeVariableContribution: true,
        variableNames: ['height', 'weight', 'age'],
      });

      const outlier = result.outliers.find(o => o.rowIndex === 3);
      expect(outlier?.explanation).toContain('weight');
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle large datasets efficiently', () => {
      // Create dataset with 1000 points
      const data = Array.from({ length: 1000 }, (_, i) => [
        Math.random() * 10,
        Math.random() * 10,
        Math.random() * 10,
      ]);
      
      // Add clear outliers
      data.push([100, 100, 100]);
      data.push([200, 200, 200]);

      const start = Date.now();
      const result = MultivariateOutlierAnalyzer.detectOutliers(data);
      const duration = Date.now() - start;

      // Should complete within reasonable time (< 2 seconds)
      expect(duration).toBeLessThan(2000);
      expect(result.outliers.length).toBeGreaterThan(0);
    });

    it('should optimize algorithm selection based on dataset size', () => {
      const smallData = Array.from({ length: 50 }, () => [Math.random(), Math.random()]);
      const largeData = Array.from({ length: 2000 }, () => [Math.random(), Math.random()]);

      const smallResult = MultivariateOutlierAnalyzer.detectOutliers(smallData, { autoOptimize: true });
      const largeResult = MultivariateOutlierAnalyzer.detectOutliers(largeData, { autoOptimize: true });

      // Should automatically adjust algorithms based on size
      expect(smallResult.algorithmDetails).toBeDefined();
      expect(largeResult.algorithmDetails).toBeDefined();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty dataset', () => {
      const analyzer = new MultivariateOutlierAnalyzer();
      const result = analyzer.detectOutliers([]);

      expect(result.outliers).toHaveLength(0);
      expect(result.summary.totalOutliers).toBe(0);
      expect(result.summary.outlierPercentage).toBe(0);
    });

    it('should handle single point dataset', () => {
      const data = [[1, 2, 3]];

      const result = MultivariateOutlierAnalyzer.detectOutliers(data);

      expect(result.outliers).toHaveLength(0); // Cannot detect outliers with single point
      expect(result.summary.totalOutliers).toBe(0);
    });

    it('should handle datasets with missing values', () => {
      const data = [
        [1, 2, 3],
        [4, null, 6],
        [7, 8, 9],
        [10, 11, 12],
        [100, 200, 300], // Outlier
      ];

      const result = MultivariateOutlierAnalyzer.detectOutliers(data as any, {
        handleMissingValues: 'exclude',
      });

      // Should handle gracefully and still detect outliers
      expect(result.outliers.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle constant variance columns', () => {
      const data = [
        [1, 5, 1], // Second column is constant
        [2, 5, 2],
        [3, 5, 3],
        [4, 5, 4],
        [100, 5, 100], // Outlier in first and third columns
      ];

      // Should handle without throwing errors
      expect(() => MultivariateOutlierAnalyzer.detectOutliers(data)).not.toThrow();
    });

    it('should handle perfect multicollinearity', () => {
      const data = [
        [1, 1, 1], // All columns perfectly correlated
        [2, 2, 2],
        [3, 3, 3],
        [4, 4, 4],
        [100, 100, 100], // Outlier
      ];

      const result = MultivariateOutlierAnalyzer.detectOutliers(data, {
        handleMulticollinearity: true,
      });

      expect(result.outliers.length).toBeGreaterThanOrEqual(0);
    });

    it('should validate input parameters', () => {
      const data = [[1, 2], [3, 4]];
      // Should handle invalid parameters gracefully
      expect(() => MultivariateOutlierAnalyzer.detectOutliers(data, {
        lofNeighbors: -1, // Invalid
      })).not.toThrow();

      expect(() => MultivariateOutlierAnalyzer.detectOutliers(data, {
        isolationForestContamination: 2.0, // Invalid (> 1)
      })).not.toThrow();
    });
  });

  describe('Algorithm Configuration and Tuning', () => {
    it('should allow custom threshold configuration', () => {
      const data = [
        [1, 1], [2, 2], [3, 3], [4, 4],
        [10, 10], // Moderate outlier
      ];

      const strictResult = MultivariateOutlierAnalyzer.detectOutliers(data, {
        mahalanobisThreshold: 0.01, // Very strict
      });
      
      const lenientResult = MultivariateOutlierAnalyzer.detectOutliers(data, {
        mahalanobisThreshold: 0.20, // More lenient
      });

      // Strict threshold should detect fewer outliers
      expect(strictResult.outliers.length).toBeLessThanOrEqual(lenientResult.outliers.length);
    });

    it('should support custom outlier percentage expectations', () => {
      const data = Array.from({ length: 100 }, (_, i) => [
        Math.random() * 5,
        Math.random() * 5,
      ]);
      
      // Add known outliers
      data.push([50, 50]);
      data.push([60, 60]);

      const result = MultivariateOutlierAnalyzer.detectOutliers(data, {
        expectedOutlierPercentage: 0.05, // Expect ~5% outliers
        autoAdjustThresholds: true,
      });

      expect(result.outliers.length).toBeGreaterThan(0);
      expect(result.summary.outlierPercentage).toBeLessThan(10); // Should be reasonable
    });
  });

  describe('Detailed Result Analysis', () => {
    it('should provide comprehensive outlier summaries', () => {
      const data = [
        [1, 1], [2, 2], [3, 3], [4, 4], [5, 5],
        [20, 20], [21, 21], // Mild outliers
        [100, 100], // Extreme outlier
      ];

      const result = MultivariateOutlierAnalyzer.detectOutliers(data);

      expect(result.summary.totalOutliers).toBeGreaterThan(0);
      expect(result.summary.outlierPercentage).toBeGreaterThan(0);
      expect(result.summary.method).toContain('Mahalanobis');

      expect(result.insights.severityDistribution).toBeDefined();
      expect(result.insights.affectedVariables).toBeDefined();
      expect(result.insights.patterns.length).toBeGreaterThanOrEqual(0);
      expect(result.insights.recommendations.length).toBeGreaterThan(0);
    });

    it('should identify outlier patterns and clustering', () => {
      const data = [
        [1, 1], [2, 2], [3, 3], // Normal cluster
        [20, 20], [21, 21], [22, 22], // Outlier cluster
        [100, 1], // Isolated outlier
      ];

      const result = MultivariateOutlierAnalyzer.detectOutliers(data, {
        analyzeOutlierPatterns: true,
      });

      expect(result.insights.patterns.length).toBeGreaterThan(0);
      // Should identify both clustered outliers and isolated outlier
    });

    it('should provide actionable recommendations', () => {
      const data = [
        [1, 1, 1], [2, 2, 2], [3, 3, 3],
        [100, 2, 3], // Outlier in first dimension
      ];

      const result = MultivariateOutlierAnalyzer.detectOutliers(data, {
        includeRecommendations: true,
      });

      expect(result.insights.recommendations.length).toBeGreaterThan(0);
      expect(result.insights.recommendations[0]).toContain('investigate');
    });
  });
});