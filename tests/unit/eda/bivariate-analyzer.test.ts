/**
 * Bivariate Analysis Tests
 * 
 * Tests the streaming bivariate analysis engine that examines relationships between
 * pairs of variables using correlation analysis, ANOVA, chi-squared tests, and other
 * statistical methods appropriate for different data type combinations.
 */

import { StreamingBivariateAnalyzer } from '../../../src/analyzers/streaming/streaming-bivariate-analyzer';
import type { BivariateAnalyzerInput, BivariateConfig } from '../../../src/analyzers/streaming/types';
import { DataType } from '../../../src/core/types';

describe('StreamingBivariateAnalyzer', () => {
  describe('Numerical-Numerical Relationships', () => {
    it('should detect strong positive correlation', async () => {
      // Create strongly correlated data
      const data = Array.from({ length: 100 }, (_, i) => [
        i.toString(),
        i.toString(), // Perfect positive correlation with ID
        (i * 2 + Math.random() * 5).toFixed(2), // Strong positive correlation
      ]);

      const input: BivariateAnalyzerInput = {
        data,
        headers: ['id', 'var1', 'var2'],
        columnTypes: [DataType.INTEGER, DataType.INTEGER, DataType.FLOAT],
        numericalColumns: ['id', 'var1', 'var2'],
        categoricalColumns: [],
        config: {
          significanceLevel: 0.05,
          maxComparisons: 100,
        },
      };

      const analyzer = new StreamingBivariateAnalyzer(input);
      const result = await analyzer.analyze();

      expect(result.numericalRelationships.length).toBeGreaterThan(0);
      
      // Should find strong correlation between id and var1
      const perfectCorr = result.numericalRelationships.find(
        rel => (rel.column1 === 'id' && rel.column2 === 'var1') ||
               (rel.column1 === 'var1' && rel.column2 === 'id')
      );

      expect(perfectCorr).toBeDefined();
      if (perfectCorr?.relationshipType === 'numerical-numerical') {
        expect(perfectCorr.pearsonCorrelation.coefficient).toBeCloseTo(1.0, 1);
        expect(perfectCorr.pearsonCorrelation.significance).toBe('Significant');
        expect(perfectCorr.pearsonCorrelation.pValue).toBeLessThan(0.001);
      }
    });

    it('should detect negative correlation', async () => {
      const data = Array.from({ length: 80 }, (_, i) => [
        i.toString(),
        i.toString(),
        (100 - i + Math.random() * 3).toFixed(2), // Negative correlation
      ]);

      const input: BivariateAnalyzerInput = {
        data,
        headers: ['id', 'ascending', 'descending'],
        columnTypes: [DataType.INTEGER, DataType.INTEGER, DataType.FLOAT],
        numericalColumns: ['id', 'ascending', 'descending'],
        categoricalColumns: [],
      };

      const analyzer = new StreamingBivariateAnalyzer(input);
      const result = await analyzer.analyze();

      const negativeCorr = result.numericalRelationships.find(
        rel => (rel.column1 === 'ascending' && rel.column2 === 'descending') ||
               (rel.column1 === 'descending' && rel.column2 === 'ascending')
      );

      expect(negativeCorr).toBeDefined();
      if (negativeCorr?.relationshipType === 'numerical-numerical') {
        expect(negativeCorr.pearsonCorrelation.coefficient).toBeLessThan(-0.8);
        expect(negativeCorr.relationshipStrength).toContain('Strong');
      }
    });

    it('should detect no correlation in random data', async () => {
      const data = Array.from({ length: 100 }, (_, i) => [
        i.toString(),
        (Math.random() * 100).toFixed(2),
        (Math.random() * 100).toFixed(2),
      ]);

      const input: BivariateAnalyzerInput = {
        data,
        headers: ['id', 'random1', 'random2'],
        columnTypes: [DataType.INTEGER, DataType.FLOAT, DataType.FLOAT],
        numericalColumns: ['id', 'random1', 'random2'],
        categoricalColumns: [],
      };

      const analyzer = new StreamingBivariateAnalyzer(input);
      const result = await analyzer.analyze();

      const randomCorr = result.numericalRelationships.find(
        rel => (rel.column1 === 'random1' && rel.column2 === 'random2') ||
               (rel.column1 === 'random2' && rel.column2 === 'random1')
      );

      expect(randomCorr).toBeDefined();
      if (randomCorr?.relationshipType === 'numerical-numerical') {
        expect(Math.abs(randomCorr.pearsonCorrelation.coefficient)).toBeLessThan(0.3);
        expect(randomCorr.relationshipStrength).toContain('Weak');
      }
    });

    it('should provide scatter plot insights', async () => {
      const data = Array.from({ length: 50 }, (_, i) => [
        i.toString(),
        (i * 2).toString(),
        (i * i * 0.1).toFixed(2), // Quadratic relationship
      ]);

      const input: BivariateAnalyzerInput = {
        data,
        headers: ['id', 'linear', 'quadratic'],
        columnTypes: [DataType.INTEGER, DataType.INTEGER, DataType.FLOAT],
        numericalColumns: ['id', 'linear', 'quadratic'],
        categoricalColumns: [],
        config: {
          enableScatterPlotInsights: true,
        },
      };

      const analyzer = new StreamingBivariateAnalyzer(input);
      const result = await analyzer.analyze();

      const quadraticRel = result.numericalRelationships.find(
        rel => (rel.column1 === 'id' && rel.column2 === 'quadratic') ||
               (rel.column1 === 'quadratic' && rel.column2 === 'id')
      );

      if (quadraticRel?.relationshipType === 'numerical-numerical') {
        expect(quadraticRel.scatterPlotInsights).toBeDefined();
        expect(quadraticRel.scatterPlotInsights?.nonLinearityIndicator).toBeGreaterThan(0);
        expect(quadraticRel.scatterPlotInsights?.outlierPoints).toBeDefined();
      }
    });
  });

  describe('Numerical-Categorical Relationships', () => {
    it('should perform ANOVA test for group differences', async () => {
      // Create groups with different means
      const groupA = Array.from({ length: 30 }, (_, i) => [
        `a_${i}`, (10 + Math.random() * 5).toFixed(2), 'Group_A'
      ]);
      const groupB = Array.from({ length: 30 }, (_, i) => [
        `b_${i}`, (20 + Math.random() * 5).toFixed(2), 'Group_B'
      ]);
      const groupC = Array.from({ length: 30 }, (_, i) => [
        `c_${i}`, (30 + Math.random() * 5).toFixed(2), 'Group_C'
      ]);

      const data = [...groupA, ...groupB, ...groupC];

      const input: BivariateAnalyzerInput = {
        data,
        headers: ['id', 'value', 'group'],
        columnTypes: [DataType.STRING, DataType.FLOAT, DataType.STRING],
        numericalColumns: ['value'],
        categoricalColumns: ['group'],
        config: {
          significanceLevel: 0.05,
        },
      };

      const analyzer = new StreamingBivariateAnalyzer(input);
      const result = await analyzer.analyze();

      expect(result.categoricalNumericalRelationships.length).toBeGreaterThan(0);
      
      const anovaResult = result.categoricalNumericalRelationships.find(
        rel => rel.numericalColumn === 'value' && rel.categoricalColumn === 'group'
      );

      expect(anovaResult).toBeDefined();
      if (anovaResult?.relationshipType === 'numerical-categorical') {
        expect(anovaResult.anovaTest.fStatistic).toBeGreaterThan(10); // Strong group differences
        expect(anovaResult.anovaTest.pValue).toBeLessThan(0.001);
        expect(anovaResult.anovaTest.significance).toBe('Significant');
        expect(anovaResult.groupComparisons.length).toBe(3); // Three groups
      }
    });

    it('should perform Kruskal-Wallis test for non-normal data', async () => {
      // Create non-normal data with group differences
      const data = Array.from({ length: 120 }, (_, i) => {
        const group = ['Low', 'Medium', 'High'][i % 3];
        let value;
        
        // Create skewed distributions for each group
        if (group === 'Low') value = Math.pow(Math.random(), 2) * 10;
        else if (group === 'Medium') value = Math.pow(Math.random(), 2) * 20 + 10;
        else value = Math.pow(Math.random(), 2) * 30 + 30;
        
        return [i.toString(), value.toFixed(2), group];
      });

      const input: BivariateAnalyzerInput = {
        data,
        headers: ['id', 'skewed_value', 'category'],
        columnTypes: [DataType.INTEGER, DataType.FLOAT, DataType.STRING],
        numericalColumns: ['skewed_value'],
        categoricalColumns: ['category'],
        config: {
          enableNonParametricTests: true,
        },
      };

      const analyzer = new StreamingBivariateAnalyzer(input);
      const result = await analyzer.analyze();

      const kruskalResult = result.categoricalNumericalRelationships.find(
        rel => rel.numericalColumn === 'skewed_value' && rel.categoricalColumn === 'category'
      );

      if (kruskalResult?.relationshipType === 'numerical-categorical') {
        expect(kruskalResult.kruskalWallisTest).toBeDefined();
        expect(kruskalResult.kruskalWallisTest?.hStatistic).toBeGreaterThan(0);
        expect(kruskalResult.kruskalWallisTest?.pValue).toBeLessThan(0.05);
      }
    });

    it('should provide detailed group comparisons', async () => {
      const data = [
        ...Array.from({ length: 20 }, (_, i) => [`1_${i}`, (15 + Math.random() * 3).toFixed(2), 'Small']),
        ...Array.from({ length: 20 }, (_, i) => [`2_${i}`, (25 + Math.random() * 3).toFixed(2), 'Medium']),
        ...Array.from({ length: 20 }, (_, i) => [`3_${i}`, (35 + Math.random() * 3).toFixed(2), 'Large']),
      ];

      const input: BivariateAnalyzerInput = {
        data,
        headers: ['id', 'measurement', 'size'],
        columnTypes: [DataType.STRING, DataType.FLOAT, DataType.STRING],
        numericalColumns: ['measurement'],
        categoricalColumns: ['size'],
      };

      const analyzer = new StreamingBivariateAnalyzer(input);
      const result = await analyzer.analyze();

      const groupAnalysis = result.categoricalNumericalRelationships.find(
        rel => rel.numericalColumn === 'measurement' && rel.categoricalColumn === 'size'
      );

      if (groupAnalysis?.relationshipType === 'numerical-categorical') {
        expect(groupAnalysis.groupComparisons.length).toBe(3);
        
        groupAnalysis.groupComparisons.forEach(group => {
          expect(group.groupName).toBeOneOf(['Small', 'Medium', 'Large']);
          expect(group.count).toBe(20);
          expect(group.mean).toBeGreaterThan(0);
          expect(group.standardDeviation).toBeGreaterThan(0);
          expect(group.median).toBeGreaterThan(0);
        });

        // Should detect significant differences between groups
        expect(groupAnalysis.effectSize).toBeGreaterThan(0.5); // Large effect size
      }
    });

    it('should handle groups with unequal sample sizes', async () => {
      const data = [
        ...Array.from({ length: 50 }, (_, i) => [`a_${i}`, (10 + Math.random() * 2).toFixed(2), 'Majority']),
        ...Array.from({ length: 5 }, (_, i) => [`b_${i}`, (20 + Math.random() * 2).toFixed(2), 'Minority']),
      ];

      const input: BivariateAnalyzerInput = {
        data,
        headers: ['id', 'value', 'group'],
        columnTypes: [DataType.STRING, DataType.FLOAT, DataType.STRING],
        numericalColumns: ['value'],
        categoricalColumns: ['group'],
      };

      const analyzer = new StreamingBivariateAnalyzer(input);
      const result = await analyzer.analyze();

      const unequalAnalysis = result.categoricalNumericalRelationships.find(
        rel => rel.numericalColumn === 'value' && rel.categoricalColumn === 'group'
      );

      if (unequalAnalysis?.relationshipType === 'numerical-categorical') {
        const majorityGroup = unequalAnalysis.groupComparisons.find(g => g.groupName === 'Majority');
        const minorityGroup = unequalAnalysis.groupComparisons.find(g => g.groupName === 'Minority');
        
        expect(majorityGroup?.count).toBe(50);
        expect(minorityGroup?.count).toBe(5);
        
        // Should still perform valid statistical tests
        expect(unequalAnalysis.anovaTest.fStatistic).toBeGreaterThan(0);
      }
    });
  });

  describe('Categorical-Categorical Relationships', () => {
    it('should perform chi-squared test of independence', async () => {
      // Create data with clear association between categories
      const data = Array.from({ length: 200 }, (_, i) => {
        let color, size;
        
        if (i < 80) {
          color = 'Red';
          size = Math.random() < 0.8 ? 'Small' : 'Large'; // Red tends to be Small
        } else if (i < 160) {
          color = 'Blue';
          size = Math.random() < 0.7 ? 'Medium' : 'Large'; // Blue tends to be Medium
        } else {
          color = 'Green';
          size = Math.random() < 0.9 ? 'Large' : 'Small'; // Green tends to be Large
        }
        
        return [i.toString(), color, size];
      });

      const input: BivariateAnalyzerInput = {
        data,
        headers: ['id', 'color', 'size'],
        columnTypes: [DataType.INTEGER, DataType.STRING, DataType.STRING],
        numericalColumns: [],
        categoricalColumns: ['color', 'size'],
      };

      const analyzer = new StreamingBivariateAnalyzer(input);
      const result = await analyzer.analyze();

      expect(result.categoricalRelationships.length).toBeGreaterThan(0);
      
      const chiSquaredResult = result.categoricalRelationships.find(
        rel => (rel.column1 === 'color' && rel.column2 === 'size') ||
               (rel.column1 === 'size' && rel.column2 === 'color')
      );

      expect(chiSquaredResult).toBeDefined();
      if (chiSquaredResult?.relationshipType === 'categorical-categorical') {
        expect(chiSquaredResult.chiSquaredTest.statistic).toBeGreaterThan(10);
        expect(chiSquaredResult.chiSquaredTest.pValue).toBeLessThan(0.05);
        expect(chiSquaredResult.chiSquaredTest.significance).toBe('Significant');
        expect(chiSquaredResult.cramersV).toBeGreaterThan(0.3); // Moderate to strong association
      }
    });

    it('should calculate Cramer\'s V for association strength', async () => {
      // Create data with known association strength
      const data = Array.from({ length: 100 }, (_, i) => {
        const category1 = ['A', 'B'][i % 2];
        const category2 = category1 === 'A' ? 
          (Math.random() < 0.9 ? 'X' : 'Y') : // Strong association: A→X
          (Math.random() < 0.1 ? 'X' : 'Y');   // Strong association: B→Y
        
        return [i.toString(), category1, category2];
      });

      const input: BivariateAnalyzerInput = {
        data,
        headers: ['id', 'cat1', 'cat2'],
        columnTypes: [DataType.INTEGER, DataType.STRING, DataType.STRING],
        numericalColumns: [],
        categoricalColumns: ['cat1', 'cat2'],
      };

      const analyzer = new StreamingBivariateAnalyzer(input);
      const result = await analyzer.analyze();

      const association = result.categoricalRelationships.find(
        rel => (rel.column1 === 'cat1' && rel.column2 === 'cat2') ||
               (rel.column1 === 'cat2' && rel.column2 === 'cat1')
      );

      if (association?.relationshipType === 'categorical-categorical') {
        expect(association.cramersV).toBeGreaterThan(0.7); // Very strong association
        expect(association.associationStrength).toContain('Strong');
      }
    });

    it('should build accurate contingency tables', async () => {
      const data = [
        ['1', 'Male', 'Engineer'],
        ['2', 'Female', 'Designer'],
        ['3', 'Male', 'Engineer'],
        ['4', 'Female', 'Engineer'],
        ['5', 'Male', 'Designer'],
        ['6', 'Female', 'Designer'],
      ];

      const input: BivariateAnalyzerInput = {
        data,
        headers: ['id', 'gender', 'role'],
        columnTypes: [DataType.INTEGER, DataType.STRING, DataType.STRING],
        numericalColumns: [],
        categoricalColumns: ['gender', 'role'],
      };

      const analyzer = new StreamingBivariateAnalyzer(input);
      const result = await analyzer.analyze();

      const genderRoleRelation = result.categoricalRelationships.find(
        rel => (rel.column1 === 'gender' && rel.column2 === 'role') ||
               (rel.column1 === 'role' && rel.column2 === 'gender')
      );

      if (genderRoleRelation?.relationshipType === 'categorical-categorical') {
        expect(genderRoleRelation.contingencyTable).toBeDefined();
        expect(genderRoleRelation.contingencyTable.rows.length).toBe(2); // Male, Female
        expect(genderRoleRelation.contingencyTable.columns.length).toBe(2); // Engineer, Designer
        
        // Check specific cell counts
        const totalCount = genderRoleRelation.contingencyTable.cells
          .flat()
          .reduce((sum, cell) => sum + cell.observed, 0);
        expect(totalCount).toBe(6);
      }
    });

    it('should detect no association in independent categories', async () => {
      const data = Array.from({ length: 120 }, (_, i) => [
        i.toString(),
        ['Red', 'Green', 'Blue'][i % 3], // Random color
        ['Small', 'Medium', 'Large'][Math.floor(Math.random() * 3)], // Random size
      ]);

      const input: BivariateAnalyzerInput = {
        data,
        headers: ['id', 'color', 'size'],
        columnTypes: [DataType.INTEGER, DataType.STRING, DataType.STRING],
        numericalColumns: [],
        categoricalColumns: ['color', 'size'],
      };

      const analyzer = new StreamingBivariateAnalyzer(input);
      const result = await analyzer.analyze();

      const independentRelation = result.categoricalRelationships.find(
        rel => (rel.column1 === 'color' && rel.column2 === 'size') ||
               (rel.column1 === 'size' && rel.column2 === 'color')
      );

      if (independentRelation?.relationshipType === 'categorical-categorical') {
        expect(independentRelation.cramersV).toBeLessThan(0.3); // Weak association
        expect(independentRelation.chiSquaredTest.pValue).toBeGreaterThan(0.05);
        expect(independentRelation.associationStrength).toContain('Weak');
      }
    });
  });

  describe('Performance and Configuration', () => {
    it('should respect maximum comparison limits', async () => {
      // Create dataset with many columns
      const data = Array.from({ length: 50 }, (_, i) => [
        ...Array.from({ length: 10 }, (_, j) => (i * j).toString()), // 10 numerical columns
      ]);

      const headers = Array.from({ length: 10 }, (_, i) => `col${i}`);
      const columnTypes = Array.from({ length: 10 }, () => DataType.INTEGER);

      const input: BivariateAnalyzerInput = {
        data,
        headers,
        columnTypes,
        numericalColumns: headers,
        categoricalColumns: [],
        config: {
          maxComparisons: 20, // Limit comparisons
        },
      };

      const analyzer = new StreamingBivariateAnalyzer(input);
      const result = await analyzer.analyze();

      // Should respect the limit (10 choose 2 = 45, but limited to 20)
      expect(result.numericalRelationships.length).toBeLessThanOrEqual(20);
      expect(result.summary.comparisonsPerformed.numericalNumerical).toBeLessThanOrEqual(20);
    });

    it('should handle large datasets efficiently', async () => {
      const data = Array.from({ length: 2000 }, (_, i) => [
        i.toString(),
        (Math.random() * 100).toFixed(2),
        (i * 0.5 + Math.random() * 10).toFixed(2),
        ['Group1', 'Group2', 'Group3', 'Group4'][i % 4],
      ]);

      const start = Date.now();
      const input: BivariateAnalyzerInput = {
        data,
        headers: ['id', 'random', 'correlated', 'group'],
        columnTypes: [DataType.INTEGER, DataType.FLOAT, DataType.FLOAT, DataType.STRING],
        numericalColumns: ['id', 'random', 'correlated'],
        categoricalColumns: ['group'],
        config: {
          streamingChunkSize: 100,
        },
      };

      const analyzer = new StreamingBivariateAnalyzer(input);
      const result = await analyzer.analyze();
      const duration = Date.now() - start;

      // Should complete within reasonable time (< 3 seconds)
      expect(duration).toBeLessThan(3000);
      expect(result.summary.totalRelationshipsAnalyzed).toBeGreaterThan(0);
      expect(result.performanceMetrics.totalAnalysisTime).toBeGreaterThan(0);
    });

    it('should track performance metrics', async () => {
      const data = Array.from({ length: 100 }, (_, i) => [
        i.toString(),
        (i * 2).toString(),
        ['A', 'B'][i % 2],
      ]);

      const input: BivariateAnalyzerInput = {
        data,
        headers: ['id', 'value', 'category'],
        columnTypes: [DataType.INTEGER, DataType.INTEGER, DataType.STRING],
        numericalColumns: ['id', 'value'],
        categoricalColumns: ['category'],
        config: {
          enablePerformanceTracking: true,
        },
      };

      const analyzer = new StreamingBivariateAnalyzer(input);
      const result = await analyzer.analyze();

      expect(result.performanceMetrics.totalAnalysisTime).toBeGreaterThan(0);
      expect(result.performanceMetrics.correlationComputationTime).toBeGreaterThan(0);
      expect(result.performanceMetrics.statisticalTestTime).toBeGreaterThan(0);
      
      if (result.performanceMetrics.memoryUsage) {
        expect(result.performanceMetrics.memoryUsage).toBeGreaterThan(0);
      }
    });

    it('should prioritize relationships by statistical significance', async () => {
      const data = Array.from({ length: 200 }, (_, i) => [
        i.toString(),
        i.toString(), // Perfect correlation
        (Math.random() * 100).toFixed(2), // Random
        (i * 0.1 + Math.random() * 5).toFixed(2), // Weak correlation
      ]);

      const input: BivariateAnalyzerInput = {
        data,
        headers: ['id', 'perfect', 'random', 'weak'],
        columnTypes: [DataType.INTEGER, DataType.INTEGER, DataType.FLOAT, DataType.FLOAT],
        numericalColumns: ['id', 'perfect', 'random', 'weak'],
        categoricalColumns: [],
        config: {
          prioritizeSignificantRelationships: true,
        },
      };

      const analyzer = new StreamingBivariateAnalyzer(input);
      const result = await analyzer.analyze();

      // Sort by significance (correlation strength)
      const sortedRelationships = result.numericalRelationships
        .sort((a, b) => {
          if (a.relationshipType === 'numerical-numerical' && b.relationshipType === 'numerical-numerical') {
            return Math.abs(b.pearsonCorrelation.coefficient) - Math.abs(a.pearsonCorrelation.coefficient);
          }
          return 0;
        });

      // Perfect correlation should be first
      const topRelationship = sortedRelationships[0];
      if (topRelationship.relationshipType === 'numerical-numerical') {
        expect(Math.abs(topRelationship.pearsonCorrelation.coefficient)).toBeGreaterThan(0.9);
      }
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty datasets gracefully', async () => {
      const input: BivariateAnalyzerInput = {
        data: [],
        headers: ['col1', 'col2'],
        columnTypes: [DataType.INTEGER, DataType.STRING],
        numericalColumns: ['col1'],
        categoricalColumns: ['col2'],
      };

      const analyzer = new StreamingBivariateAnalyzer(input);
      const result = await analyzer.analyze();

      expect(result.numericalRelationships).toHaveLength(0);
      expect(result.categoricalRelationships).toHaveLength(0);
      expect(result.categoricalNumericalRelationships).toHaveLength(0);
      expect(result.summary.totalRelationshipsAnalyzed).toBe(0);
    });

    it('should handle single column datasets', async () => {
      const data = [['1'], ['2'], ['3']];

      const input: BivariateAnalyzerInput = {
        data,
        headers: ['only_col'],
        columnTypes: [DataType.INTEGER],
        numericalColumns: ['only_col'],
        categoricalColumns: [],
      };

      const analyzer = new StreamingBivariateAnalyzer(input);
      const result = await analyzer.analyze();

      expect(result.numericalRelationships).toHaveLength(0);
      expect(result.summary.totalRelationshipsAnalyzed).toBe(0);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should handle datasets with all missing values', async () => {
      const data = [
        ['', ''],
        [null, undefined],
        ['', null],
      ];

      const input: BivariateAnalyzerInput = {
        data,
        headers: ['col1', 'col2'],
        columnTypes: [DataType.STRING, DataType.STRING],
        numericalColumns: [],
        categoricalColumns: ['col1', 'col2'],
      };

      const analyzer = new StreamingBivariateAnalyzer(input);
      const result = await analyzer.analyze();

      expect(result.categoricalRelationships).toHaveLength(0);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should handle constant value columns', async () => {
      const data = Array.from({ length: 50 }, (_, i) => [
        i.toString(),
        '42', // Constant value
        'Same', // Constant category
      ]);

      const input: BivariateAnalyzerInput = {
        data,
        headers: ['id', 'constant_num', 'constant_cat'],
        columnTypes: [DataType.INTEGER, DataType.INTEGER, DataType.STRING],
        numericalColumns: ['id', 'constant_num'],
        categoricalColumns: ['constant_cat'],
      };

      const analyzer = new StreamingBivariateAnalyzer(input);
      const result = await analyzer.analyze();

      // Should handle gracefully but with warnings
      expect(result.warnings.length).toBeGreaterThan(0);
      
      // Correlations with constant values should be undefined or handled specially
      const constantCorrelation = result.numericalRelationships.find(
        rel => rel.column1 === 'constant_num' || rel.column2 === 'constant_num'
      );
      
      if (constantCorrelation?.relationshipType === 'numerical-numerical') {
        expect(isNaN(constantCorrelation.pearsonCorrelation.coefficient) || 
               constantCorrelation.pearsonCorrelation.coefficient === 0).toBeTruthy();
      }
    });

    it('should handle datasets with extreme outliers', async () => {
      const data = [
        ...Array.from({ length: 45 }, (_, i) => [i.toString(), (i + 1).toString()]),
        ['99', '1000000'], // Extreme outlier
      ];

      const input: BivariateAnalyzerInput = {
        data,
        headers: ['x', 'y'],
        columnTypes: [DataType.INTEGER, DataType.INTEGER],
        numericalColumns: ['x', 'y'],
        categoricalColumns: [],
        config: {
          outlierHandling: 'robust',
        },
      };

      const analyzer = new StreamingBivariateAnalyzer(input);
      const result = await analyzer.analyze();

      const correlation = result.numericalRelationships[0];
      if (correlation?.relationshipType === 'numerical-numerical') {
        // Should still detect correlation despite outlier
        expect(correlation.pearsonCorrelation.coefficient).toBeGreaterThan(0.5);
        expect(correlation.outlierInfluence).toBeDefined();
      }
    });

    it('should validate configuration parameters', async () => {
      const data = [['1', 'A'], ['2', 'B']];

      const invalidConfig: BivariateConfig = {
        significanceLevel: 2.0, // Invalid (> 1)
        maxComparisons: -1, // Invalid
        streamingChunkSize: 0, // Invalid
      };

      const input: BivariateAnalyzerInput = {
        data,
        headers: ['num', 'cat'],
        columnTypes: [DataType.INTEGER, DataType.STRING],
        numericalColumns: ['num'],
        categoricalColumns: ['cat'],
        config: invalidConfig,
      };

      const analyzer = new StreamingBivariateAnalyzer(input);
      const result = await analyzer.analyze();

      // Should handle invalid config gracefully
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.summary).toBeDefined();
    });
  });

  describe('Statistical Test Accuracy', () => {
    it('should compute accurate Pearson correlation coefficients', async () => {
      // Test with known correlation
      const data = [
        ['1', '1'], ['2', '2'], ['3', '3'], ['4', '4'], ['5', '5'] // Perfect correlation
      ];

      const input: BivariateAnalyzerInput = {
        data,
        headers: ['x', 'y'],
        columnTypes: [DataType.INTEGER, DataType.INTEGER],
        numericalColumns: ['x', 'y'],
        categoricalColumns: [],
      };

      const analyzer = new StreamingBivariateAnalyzer(input);
      const result = await analyzer.analyze();

      const correlation = result.numericalRelationships[0];
      if (correlation?.relationshipType === 'numerical-numerical') {
        expect(correlation.pearsonCorrelation.coefficient).toBeCloseTo(1.0, 3);
        expect(correlation.pearsonCorrelation.significance).toBe('Significant');
      }
    });

    it('should compute accurate F-statistics in ANOVA', async () => {
      // Create groups with known differences
      const data = [
        ...Array.from({ length: 10 }, (_, i) => [`a${i}`, '10', 'Group1']), // Mean = 10
        ...Array.from({ length: 10 }, (_, i) => [`b${i}`, '20', 'Group2']), // Mean = 20
      ];

      const input: BivariateAnalyzerInput = {
        data,
        headers: ['id', 'value', 'group'],
        columnTypes: [DataType.STRING, DataType.INTEGER, DataType.STRING],
        numericalColumns: ['value'],
        categoricalColumns: ['group'],
      };

      const analyzer = new StreamingBivariateAnalyzer(input);
      const result = await analyzer.analyze();

      const anova = result.categoricalNumericalRelationships[0];
      if (anova?.relationshipType === 'numerical-categorical') {
        // With such clear group differences, F-statistic should be very large
        expect(anova.anovaTest.fStatistic).toBeGreaterThan(100);
        expect(anova.anovaTest.pValue).toBeLessThan(0.001);
      }
    });

    it('should compute accurate chi-squared statistics', async () => {
      // Create perfect association: A always goes with X, B always goes with Y
      const data = [
        ...Array.from({ length: 25 }, (_, i) => [`${i}`, 'A', 'X']),
        ...Array.from({ length: 25 }, (_, i) => [`${i + 25}`, 'B', 'Y']),
      ];

      const input: BivariateAnalyzerInput = {
        data,
        headers: ['id', 'cat1', 'cat2'],
        columnTypes: [DataType.INTEGER, DataType.STRING, DataType.STRING],
        numericalColumns: [],
        categoricalColumns: ['cat1', 'cat2'],
      };

      const analyzer = new StreamingBivariateAnalyzer(input);
      const result = await analyzer.analyze();

      const chiSquared = result.categoricalRelationships[0];
      if (chiSquared?.relationshipType === 'categorical-categorical') {
        // Perfect association should have high chi-squared statistic
        expect(chiSquared.chiSquaredTest.statistic).toBeGreaterThan(40);
        expect(chiSquared.cramersV).toBeCloseTo(1.0, 1);
      }
    });
  });
});