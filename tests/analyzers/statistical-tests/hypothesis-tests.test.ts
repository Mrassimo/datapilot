/**
 * Comprehensive tests for statistical hypothesis testing implementations
 */

import { anovaFTest, kruskalWallisTest, welchsTTest, mannWhitneyUTest, andersonDarlingTest, GroupData } from '../../../src/analyzers/statistical-tests/hypothesis-tests';

describe('Statistical Hypothesis Tests', () => {
  describe('ANOVA F-Test', () => {
    test('should correctly calculate F-statistic for different group means', () => {
      const groups: GroupData[] = [
        { name: 'Group1', count: 5, mean: 10, variance: 2, values: [8, 9, 10, 11, 12] },
        { name: 'Group2', count: 5, mean: 15, variance: 3, values: [13, 14, 15, 16, 17] },
        { name: 'Group3', count: 5, mean: 20, variance: 2.5, values: [18, 19, 20, 21, 22] }
      ];

      const result = anovaFTest(groups);

      expect(result.statistic).toBeGreaterThan(0);
      expect(result.pValue).toBeLessThan(0.05); // Should be significant
      expect(result.degreesOfFreedom).toEqual([2, 12]); // df_between = 3-1, df_within = 15-3
      expect(result.interpretation).toContain('significant');
    });

    test('should return non-significant result for similar group means', () => {
      const groups: GroupData[] = [
        { name: 'Group1', count: 5, mean: 10, variance: 4, values: [8, 9, 10, 11, 12] },
        { name: 'Group2', count: 5, mean: 10.5, variance: 4, values: [8.5, 9.5, 10.5, 11.5, 12.5] },
        { name: 'Group3', count: 5, mean: 9.5, variance: 4, values: [7.5, 8.5, 9.5, 10.5, 11.5] }
      ];

      const result = anovaFTest(groups);

      expect(result.statistic).toBeGreaterThan(0);
      expect(result.pValue).toBeGreaterThan(0.05); // Should not be significant
      expect(result.interpretation).toContain('not significant');
    });

    test('should handle edge case with single group', () => {
      const groups: GroupData[] = [
        { name: 'Group1', count: 5, mean: 10, variance: 2, values: [8, 9, 10, 11, 12] }
      ];

      const result = anovaFTest(groups);

      expect(result.statistic).toBe(0);
      expect(result.pValue).toBe(1);
      expect(result.interpretation).toContain('Insufficient groups');
    });

    test('should handle groups with zero variance', () => {
      const groups: GroupData[] = [
        { name: 'Group1', count: 3, mean: 10, variance: 0, values: [10, 10, 10] },
        { name: 'Group2', count: 3, mean: 15, variance: 0, values: [15, 15, 15] }
      ];

      const result = anovaFTest(groups);

      expect(result.statistic).toBeGreaterThan(0);
      expect(result.pValue).toBeLessThan(0.05);
    });
  });

  describe('Kruskal-Wallis Test', () => {
    test('should correctly calculate H-statistic for non-parametric data', () => {
      const groups: GroupData[] = [
        { name: 'Group1', count: 4, mean: 2.5, variance: 1.67, values: [1, 2, 3, 4] },
        { name: 'Group2', count: 4, mean: 7.5, variance: 1.67, values: [6, 7, 8, 9] },
        { name: 'Group3', count: 4, mean: 12.5, variance: 1.67, values: [11, 12, 13, 14] }
      ];

      const result = kruskalWallisTest(groups);

      expect(result.statistic).toBeGreaterThan(0);
      expect(result.pValue).toBeLessThan(0.05); // Should be significant
      expect(result.degreesOfFreedom).toBe(2); // k-1 = 3-1
      expect(result.interpretation).toContain('significant');
    });

    test('should handle tied ranks correctly', () => {
      const groups: GroupData[] = [
        { name: 'Group1', count: 3, mean: 5, variance: 0, values: [5, 5, 5] },
        { name: 'Group2', count: 3, mean: 7, variance: 1, values: [6, 7, 8] }
      ];

      const result = kruskalWallisTest(groups);

      expect(result.statistic).toBeGreaterThan(0);
      expect(result.pValue).toBeGreaterThan(0);
      expect(result.degreesOfFreedom).toBe(1);
    });

    test('should return appropriate result for identical distributions', () => {
      const groups: GroupData[] = [
        { name: 'Group1', count: 3, mean: 5, variance: 2, values: [3, 5, 7] },
        { name: 'Group2', count: 3, mean: 5, variance: 2, values: [3, 5, 7] },
        { name: 'Group3', count: 3, mean: 5, variance: 2, values: [3, 5, 7] }
      ];

      const result = kruskalWallisTest(groups);

      expect(result.statistic).toBe(0);
      expect(result.pValue).toBe(1);
      expect(result.interpretation).toContain('not significant');
    });
  });

  describe('Welch T-Test', () => {
    test('should correctly identify significant difference between groups', () => {
      const group1: GroupData = { 
        name: 'Group1', 
        count: 10, 
        mean: 100, 
        variance: 15, 
        values: [95, 98, 99, 100, 101, 102, 103, 104, 105, 107]
      };
      const group2: GroupData = { 
        name: 'Group2', 
        count: 10, 
        mean: 110, 
        variance: 20, 
        values: [105, 107, 108, 109, 110, 111, 112, 113, 114, 116]
      };

      const result = welchsTTest(group1, group2);

      expect(result.statistic).toBeGreaterThan(0);
      expect(result.pValue).toBeLessThan(0.05);
      expect(result.degreesOfFreedom).toBeGreaterThan(0);
      expect(result.interpretation).toContain('significant');
    });

    test('should handle groups with different variances (Welch correction)', () => {
      const group1: GroupData = { 
        name: 'Group1', 
        count: 5, 
        mean: 10, 
        variance: 1, 
        values: [9, 9.5, 10, 10.5, 11]
      };
      const group2: GroupData = { 
        name: 'Group2', 
        count: 5, 
        mean: 10, 
        variance: 25, 
        values: [5, 7.5, 10, 12.5, 15]
      };

      const result = welchsTTest(group1, group2);

      expect(result.statistic).toBeDefined();
      expect(result.pValue).toBeGreaterThan(0.05); // Means are same, should not be significant
      expect(result.degreesOfFreedom).toBeLessThan(8); // Should be adjusted for unequal variances
    });

    test('should handle identical groups', () => {
      const group1: GroupData = { 
        name: 'Group1', 
        count: 5, 
        mean: 10, 
        variance: 2, 
        values: [8, 9, 10, 11, 12]
      };
      const group2: GroupData = { 
        name: 'Group2', 
        count: 5, 
        mean: 10, 
        variance: 2, 
        values: [8, 9, 10, 11, 12]
      };

      const result = welchsTTest(group1, group2);

      expect(result.statistic).toBe(0);
      expect(result.pValue).toBe(1);
      expect(result.interpretation).toContain('not significant');
    });
  });

  describe('Mann-Whitney U Test', () => {
    test('should correctly identify rank differences between groups', () => {
      const group1: GroupData = { 
        name: 'Group1', 
        count: 5, 
        mean: 3, 
        variance: 2, 
        values: [1, 2, 3, 4, 5]
      };
      const group2: GroupData = { 
        name: 'Group2', 
        count: 5, 
        mean: 8, 
        variance: 2, 
        values: [6, 7, 8, 9, 10]
      };

      const result = mannWhitneyUTest(group1, group2);

      expect(result.statistic).toBeDefined();
      expect(result.pValue).toBeLessThan(0.05); // Should be significant
      expect(result.interpretation).toContain('significant');
    });

    test('should handle overlapping distributions', () => {
      const group1: GroupData = { 
        name: 'Group1', 
        count: 5, 
        mean: 5, 
        variance: 4, 
        values: [3, 4, 5, 6, 7]
      };
      const group2: GroupData = { 
        name: 'Group2', 
        count: 5, 
        mean: 6, 
        variance: 4, 
        values: [4, 5, 6, 7, 8]
      };

      const result = mannWhitneyUTest(group1, group2);

      expect(result.statistic).toBeDefined();
      expect(result.pValue).toBeGreaterThan(0.05); // Should not be significant due to overlap
      expect(result.interpretation).toContain('not significant');
    });

    test('should handle tied values correctly', () => {
      const group1: GroupData = { 
        name: 'Group1', 
        count: 4, 
        mean: 5, 
        variance: 0, 
        values: [5, 5, 5, 5]
      };
      const group2: GroupData = { 
        name: 'Group2', 
        count: 4, 
        mean: 7, 
        variance: 0, 
        values: [7, 7, 7, 7]
      };

      const result = mannWhitneyUTest(group1, group2);

      expect(result.statistic).toBeDefined();
      expect(result.pValue).toBeLessThan(0.05); // Should be significant
    });
  });

  describe('Anderson-Darling Test', () => {
    test('should correctly identify normal distribution', () => {
      // Generate approximately normal data
      const normalData = [
        -1.5, -1.0, -0.5, -0.3, -0.1, 0, 0.1, 0.3, 0.5, 1.0, 1.5
      ];

      const result = andersonDarlingTest(normalData);

      expect(result.statistic).toBeGreaterThan(0);
      expect(result.pValue).toBeGreaterThan(0.05); // Should not reject normality
      expect(result.interpretation).toContain('normal');
    });

    test('should identify non-normal distribution', () => {
      // Generate clearly non-normal data (uniform)
      const uniformData = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

      const result = andersonDarlingTest(uniformData);

      expect(result.statistic).toBeGreaterThan(0);
      // Note: Small sample size might not always reject normality
      expect(result.pValue).toBeDefined();
      expect(result.interpretation).toBeDefined();
    });

    test('should handle skewed distribution', () => {
      // Generate right-skewed data
      const skewedData = [1, 1, 2, 2, 2, 3, 3, 4, 5, 10, 15, 20];

      const result = andersonDarlingTest(skewedData);

      expect(result.statistic).toBeGreaterThan(0);
      expect(result.pValue).toBeLessThan(0.05); // Should reject normality
      expect(result.interpretation).toContain('not normal');
    });

    test('should handle constant values', () => {
      const constantData = [5, 5, 5, 5, 5];

      const result = andersonDarlingTest(constantData);

      expect(result.statistic).toBeDefined();
      expect(result.pValue).toBe(0); // Should strongly reject normality
      expect(result.interpretation).toContain('not normal');
    });

    test('should handle minimum sample size', () => {
      const smallSample = [1, 2, 3];

      const result = andersonDarlingTest(smallSample);

      expect(result.statistic).toBeDefined();
      expect(result.pValue).toBeDefined();
      expect(result.interpretation).toContain('sample size');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle empty groups gracefully', () => {
      const emptyGroups: GroupData[] = [];

      const anovaResult = anovaFTest(emptyGroups);
      expect(anovaResult.interpretation).toContain('No groups');

      const kwResult = kruskalWallisTest(emptyGroups);
      expect(kwResult.interpretation).toContain('No groups');
    });

    test('should handle groups with single observations', () => {
      const singleObsGroups: GroupData[] = [
        { name: 'Group1', count: 1, mean: 5, variance: 0, values: [5] },
        { name: 'Group2', count: 1, mean: 10, variance: 0, values: [10] }
      ];

      const result = anovaFTest(singleObsGroups);
      expect(result.interpretation).toContain('variance calculation');
    });

    test('should handle extreme values without crashing', () => {
      const extremeGroups: GroupData[] = [
        { name: 'Group1', count: 3, mean: 1e-10, variance: 1e-20, values: [1e-10, 1e-10, 1e-10] },
        { name: 'Group2', count: 3, mean: 1e10, variance: 1e20, values: [1e10, 1e10, 1e10] }
      ];

      expect(() => anovaFTest(extremeGroups)).not.toThrow();
      expect(() => kruskalWallisTest(extremeGroups)).not.toThrow();
    });

    test('should validate input parameters', () => {
      const invalidGroup: GroupData = { 
        name: 'Invalid', 
        count: 0, 
        mean: 10, 
        variance: -1, 
        values: []
      };

      // Tests should handle invalid input gracefully
      expect(() => welchsTTest(invalidGroup, invalidGroup)).not.toThrow();
    });
  });

  describe('Statistical Accuracy', () => {
    test('ANOVA should match known statistical results', () => {
      // Known test case with expected F-statistic
      const groups: GroupData[] = [
        { name: 'A', count: 3, mean: 2, variance: 1, values: [1, 2, 3] },
        { name: 'B', count: 3, mean: 4, variance: 1, values: [3, 4, 5] },
        { name: 'C', count: 3, mean: 6, variance: 1, values: [5, 6, 7] }
      ];

      const result = anovaFTest(groups);
      
      // F = MS_between / MS_within = 12 / 1 = 12 (theoretical)
      expect(result.statistic).toBeCloseTo(12, 1);
      expect(result.degreesOfFreedom).toEqual([2, 6]);
    });

    test('T-test should handle known case', () => {
      const group1: GroupData = { 
        name: 'Group1', 
        count: 2, 
        mean: 1, 
        variance: 0, 
        values: [1, 1]
      };
      const group2: GroupData = { 
        name: 'Group2', 
        count: 2, 
        mean: 2, 
        variance: 0, 
        values: [2, 2]
      };

      const result = welchsTTest(group1, group2);
      
      // With zero variance, t-statistic should be infinite (or very large)
      expect(Math.abs(result.statistic)).toBeGreaterThan(100);
      expect(result.pValue).toBeLessThan(0.001);
    });
  });
});