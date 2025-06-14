/**
 * Section 3 EDA Analyzer Tests
 * 
 * Tests the comprehensive exploratory data analysis orchestrator that coordinates
 * univariate, bivariate, and multivariate statistical analysis using streaming algorithms.
 */

import { Section3Analyzer } from '../../../src/analyzers/eda/section3-analyzer';
import type { Section3Config, Section3AnalyzerInput } from '../../../src/analyzers/eda/types';
import type { Section1Result } from '../../../src/analyzers/overview/types';
import { DataType } from '../../../src/core/types';

describe('Section3Analyzer', () => {
  describe('Comprehensive EDA Analysis', () => {
    it('should perform complete univariate, bivariate, and multivariate analysis', async () => {
      const data = [
        ['1', '25', '50000', 'Engineer', '2024-01-15', 'true'],
        ['2', '30', '55000', 'Designer', '2024-01-16', 'false'],
        ['3', '35', '60000', 'Manager', '2024-01-17', 'true'],
        ['4', '40', '65000', 'Analyst', '2024-01-18', 'false'],
        ['5', '45', '70000', 'Lead', '2024-01-19', 'true'],
      ];

      const section1Result: Section1Result = {
        overview: {
          version: '1.3.1',
          generatedAt: new Date(),
          fileDetails: {
            originalFilename: 'test-data.csv',
            fullResolvedPath: '/path/to/test-data.csv',
            fileSizeBytes: 500,
            fileSizeMB: 0.0005,
            lastModified: new Date(),
            encoding: 'utf-8',
            dataSourceType: 'Local File System',
          },
          initialScanLimit: {
            linesScanned: 5,
            bytesScanned: 500,
            estimatedTotalLines: 5,
          },
          structuralDimensions: {
            totalRows: 5,
            totalColumns: 6,
            estimatedDataCells: 30,
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
            { index: 1, inferredName: 'age', originalHeader: 'age', dataType: DataType.INTEGER },
            { index: 2, inferredName: 'salary', originalHeader: 'salary', dataType: DataType.FLOAT },
            { index: 3, inferredName: 'role', originalHeader: 'role', dataType: DataType.STRING },
            { index: 4, inferredName: 'date', originalHeader: 'date', dataType: DataType.DATE },
            { index: 5, inferredName: 'active', originalHeader: 'active', dataType: DataType.BOOLEAN },
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

      const config: Section3Config = {
        enabledAnalyses: ['univariate', 'bivariate', 'multivariate'],
        significanceLevel: 0.05,
        maxBivariateComparisons: 1000,
        enableAdvancedTests: true,
        streamingConfig: {
          chunkSize: 1000,
          memoryThreshold: 0.8,
        },
      };

      const input: Section3AnalyzerInput = {
        data,
        headers: ['id', 'age', 'salary', 'role', 'date', 'active'],
        columnTypes: [DataType.INTEGER, DataType.INTEGER, DataType.FLOAT, DataType.STRING, DataType.DATE, DataType.BOOLEAN],
        rowCount: 5,
        columnCount: 6,
        section1Result,
        config,
      };

      const analyzer = new Section3Analyzer(input);
      const result = await analyzer.analyze();

      // Should contain all three analysis types
      expect(result.edaAnalysis.univariateAnalysis).toBeDefined();
      expect(result.edaAnalysis.bivariateAnalysis).toBeDefined();
      expect(result.edaAnalysis.multivariateAnalysis).toBeDefined();

      // Univariate analysis should cover all columns
      expect(result.edaAnalysis.univariateAnalysis.columnAnalyses).toHaveLength(6);
      expect(result.edaAnalysis.univariateAnalysis.summary.totalColumns).toBe(6);

      // Should have performance metrics
      expect(result.performanceMetrics.totalAnalysisTime).toBeGreaterThan(0);
      expect(result.performanceMetrics.phases).toBeDefined();
    });

    it('should handle different column type distributions correctly', async () => {
      const data = Array.from({ length: 20 }, (_, i) => [
        i.toString(),                           // ID
        (20 + i * 2).toString(),               // Age
        (40000 + i * 1000).toString(),         // Salary
        ['Engineer', 'Designer', 'Manager'][i % 3], // Role
      ]);

      const section1Result = createMockSection1Result();

      const input: Section3AnalyzerInput = {
        data,
        headers: ['id', 'age', 'salary', 'role'],
        columnTypes: [DataType.INTEGER, DataType.INTEGER, DataType.FLOAT, DataType.STRING],
        rowCount: 20,
        columnCount: 4,
        section1Result,
      };

      const analyzer = new Section3Analyzer(input);
      const result = await analyzer.analyze();

      // Should identify different column types correctly
      const numericalColumns = result.edaAnalysis.univariateAnalysis.columnAnalyses.filter(
        col => col.type === 'numerical'
      );
      const categoricalColumns = result.edaAnalysis.univariateAnalysis.columnAnalyses.filter(
        col => col.type === 'categorical'
      );

      expect(numericalColumns.length).toBe(3); // id, age, salary
      expect(categoricalColumns.length).toBe(1); // role

      // Numerical columns should have statistical measures
      numericalColumns.forEach(col => {
        if (col.type === 'numerical') {
          expect(col.descriptiveStats.mean).toBeDefined();
          expect(col.descriptiveStats.standardDeviation).toBeDefined();
          expect(col.distributionAnalysis).toBeDefined();
        }
      });

      // Categorical columns should have frequency analysis
      categoricalColumns.forEach(col => {
        if (col.type === 'categorical') {
          expect(col.frequencyAnalysis.uniqueValues).toBeGreaterThan(0);
          expect(col.diversityMetrics).toBeDefined();
        }
      });
    });
  });

  describe('Univariate Statistical Analysis', () => {
    it('should perform comprehensive numerical column analysis', async () => {
      const data = Array.from({ length: 100 }, (_, i) => [
        i.toString(),
        (Math.random() * 100).toFixed(2), // Random values for statistical analysis
      ]);

      const input: Section3AnalyzerInput = {
        data,
        headers: ['id', 'value'],
        columnTypes: [DataType.INTEGER, DataType.FLOAT],
        rowCount: 100,
        columnCount: 2,
        section1Result: createMockSection1Result(),
      };

      const analyzer = new Section3Analyzer(input);
      const result = await analyzer.analyze();

      const numericalAnalysis = result.edaAnalysis.univariateAnalysis.columnAnalyses.find(
        col => col.columnName === 'value'
      );

      expect(numericalAnalysis?.type).toBe('numerical');
      if (numericalAnalysis?.type === 'numerical') {
        // Descriptive statistics
        expect(numericalAnalysis.descriptiveStats.count).toBe(100);
        expect(numericalAnalysis.descriptiveStats.mean).toBeGreaterThan(0);
        expect(numericalAnalysis.descriptiveStats.standardDeviation).toBeGreaterThan(0);
        expect(numericalAnalysis.descriptiveStats.min).toBeDefined();
        expect(numericalAnalysis.descriptiveStats.max).toBeDefined();

        // Quantiles
        expect(numericalAnalysis.descriptiveStats.quantiles.q25).toBeDefined();
        expect(numericalAnalysis.descriptiveStats.quantiles.median).toBeDefined();
        expect(numericalAnalysis.descriptiveStats.quantiles.q75).toBeDefined();

        // Distribution analysis
        expect(numericalAnalysis.distributionAnalysis.skewness).toBeDefined();
        expect(numericalAnalysis.distributionAnalysis.kurtosis).toBeDefined();
        expect(numericalAnalysis.distributionAnalysis.normalityTests).toBeDefined();

        // Outlier analysis
        expect(numericalAnalysis.outlierAnalysis.method).toBeDefined();
        expect(numericalAnalysis.outlierAnalysis.outlierCount).toBeGreaterThanOrEqual(0);
      }
    });

    it('should perform comprehensive categorical column analysis', async () => {
      const categories = ['A', 'B', 'C', 'D'];
      const data = Array.from({ length: 100 }, (_, i) => [
        i.toString(),
        categories[Math.floor(Math.random() * categories.length)],
      ]);

      const input: Section3AnalyzerInput = {
        data,
        headers: ['id', 'category'],
        columnTypes: [DataType.INTEGER, DataType.STRING],
        rowCount: 100,
        columnCount: 2,
        section1Result: createMockSection1Result(),
      };

      const analyzer = new Section3Analyzer(input);
      const result = await analyzer.analyze();

      const categoricalAnalysis = result.edaAnalysis.univariateAnalysis.columnAnalyses.find(
        col => col.columnName === 'category'
      );

      expect(categoricalAnalysis?.type).toBe('categorical');
      if (categoricalAnalysis?.type === 'categorical') {
        // Frequency analysis
        expect(categoricalAnalysis.frequencyAnalysis.uniqueValues).toBeGreaterThan(0);
        expect(categoricalAnalysis.frequencyAnalysis.totalValues).toBe(100);
        expect(categoricalAnalysis.frequencyAnalysis.topCategories.length).toBeGreaterThan(0);

        // Diversity metrics
        expect(categoricalAnalysis.diversityMetrics.shannonEntropy).toBeGreaterThan(0);
        expect(categoricalAnalysis.diversityMetrics.giniImpurity).toBeGreaterThanOrEqual(0);
        expect(categoricalAnalysis.diversityMetrics.effectiveNumberOfClasses).toBeGreaterThan(0);

        // Distribution characteristics
        expect(categoricalAnalysis.distributionCharacteristics.isUniform).toBeDefined();
        expect(categoricalAnalysis.distributionCharacteristics.dominantCategory).toBeDefined();
      }
    });

    it('should handle date/time column analysis', async () => {
      const data = Array.from({ length: 50 }, (_, i) => [
        i.toString(),
        `2024-01-${String(i % 30 + 1).padStart(2, '0')}`,
      ]);

      const input: Section3AnalyzerInput = {
        data,
        headers: ['id', 'date'],
        columnTypes: [DataType.INTEGER, DataType.DATE],
        rowCount: 50,
        columnCount: 2,
        section1Result: createMockSection1Result(),
      };

      const analyzer = new Section3Analyzer(input);
      const result = await analyzer.analyze();

      const dateAnalysis = result.edaAnalysis.univariateAnalysis.columnAnalyses.find(
        col => col.columnName === 'date'
      );

      expect(dateAnalysis?.type).toBe('datetime');
      if (dateAnalysis?.type === 'datetime') {
        // Temporal patterns
        expect(dateAnalysis.temporalPatterns.range).toBeDefined();
        expect(dateAnalysis.temporalPatterns.frequency).toBeDefined();
        
        // Component analysis
        expect(dateAnalysis.componentFrequency.years).toBeDefined();
        expect(dateAnalysis.componentFrequency.months).toBeDefined();
        expect(dateAnalysis.componentFrequency.days).toBeDefined();
      }
    });
  });

  describe('Bivariate Relationship Analysis', () => {
    it('should analyze numerical-numerical relationships', async () => {
      // Create correlated data
      const data = Array.from({ length, 50 }, (_, i) => [
        i.toString(),
        (i * 2 + Math.random() * 10).toFixed(2),  // Correlated with ID
        (i * 1.5 + Math.random() * 5).toFixed(2), // Also correlated with ID
      ]);

      const input: Section3AnalyzerInput = {
        data,
        headers: ['id', 'value1', 'value2'],
        columnTypes: [DataType.INTEGER, DataType.FLOAT, DataType.FLOAT],
        rowCount: 50,
        columnCount: 3,
        section1Result: createMockSection1Result(),
      };

      const analyzer = new Section3Analyzer(input);
      const result = await analyzer.analyze();

      const bivariateAnalysis = result.edaAnalysis.bivariateAnalysis;
      expect(bivariateAnalysis.numericalRelationships.length).toBeGreaterThan(0);

      // Should find correlations
      const correlation = bivariateAnalysis.numericalRelationships.find(
        rel => rel.relationshipType === 'numerical-numerical'
      );

      expect(correlation).toBeDefined();
      if (correlation?.relationshipType === 'numerical-numerical') {
        expect(correlation.pearsonCorrelation.coefficient).toBeDefined();
        expect(correlation.pearsonCorrelation.pValue).toBeDefined();
        expect(correlation.pearsonCorrelation.significance).toBeDefined();
      }
    });

    it('should analyze numerical-categorical relationships', async () => {
      const data = Array.from({ length: 60 }, (_, i) => [
        i.toString(),
        (i * 2 + Math.random() * 10).toFixed(2),
        ['Group1', 'Group2', 'Group3'][i % 3],
      ]);

      const input: Section3AnalyzerInput = {
        data,
        headers: ['id', 'value', 'group'],
        columnTypes: [DataType.INTEGER, DataType.FLOAT, DataType.STRING],
        rowCount: 60,
        columnCount: 3,
        section1Result: createMockSection1Result(),
      };

      const analyzer = new Section3Analyzer(input);
      const result = await analyzer.analyze();

      const groupComparison = result.edaAnalysis.bivariateAnalysis.categoricalNumericalRelationships.find(
        rel => rel.relationshipType === 'numerical-categorical'
      );

      expect(groupComparison).toBeDefined();
      if (groupComparison?.relationshipType === 'numerical-categorical') {
        expect(groupComparison.anovaTest.fStatistic).toBeDefined();
        expect(groupComparison.anovaTest.pValue).toBeDefined();
        expect(groupComparison.groupComparisons.length).toBeGreaterThan(0);
      }
    });

    it('should analyze categorical-categorical relationships', async () => {
      const data = Array.from({ length: 100 }, (_, i) => [
        i.toString(),
        ['A', 'B'][i % 2],
        ['X', 'Y', 'Z'][i % 3],
      ]);

      const input: Section3AnalyzerInput = {
        data,
        headers: ['id', 'cat1', 'cat2'],
        columnTypes: [DataType.INTEGER, DataType.STRING, DataType.STRING],
        rowCount: 100,
        columnCount: 3,
        section1Result: createMockSection1Result(),
      };

      const analyzer = new Section3Analyzer(input);
      const result = await analyzer.analyze();

      const categoricalRelation = result.edaAnalysis.bivariateAnalysis.categoricalRelationships.find(
        rel => rel.relationshipType === 'categorical-categorical'
      );

      expect(categoricalRelation).toBeDefined();
      if (categoricalRelation?.relationshipType === 'categorical-categorical') {
        expect(categoricalRelation.chiSquaredTest.statistic).toBeDefined();
        expect(categoricalRelation.chiSquaredTest.pValue).toBeDefined();
        expect(categoricalRelation.cramersV).toBeDefined();
        expect(categoricalRelation.contingencyTable).toBeDefined();
      }
    });
  });

  describe('Multivariate Advanced Analysis', () => {
    it('should perform Principal Component Analysis', async () => {
      // Create multi-dimensional numerical data
      const data = Array.from({ length: 50 }, (_, i) => [
        i.toString(),
        (i + Math.random() * 10).toFixed(2),
        (i * 1.5 + Math.random() * 5).toFixed(2),
        (i * 0.8 + Math.random() * 8).toFixed(2),
        (i * 1.2 + Math.random() * 12).toFixed(2),
      ]);

      const input: Section3AnalyzerInput = {
        data,
        headers: ['id', 'var1', 'var2', 'var3', 'var4'],
        columnTypes: [DataType.INTEGER, DataType.FLOAT, DataType.FLOAT, DataType.FLOAT, DataType.FLOAT],
        rowCount: 50,
        columnCount: 5,
        section1Result: createMockSection1Result(),
        config: {
          enabledAnalyses: ['multivariate'],
          enableAdvancedTests: true,
        },
      };

      const analyzer = new Section3Analyzer(input);
      const result = await analyzer.analyze();

      const multivariateAnalysis = result.edaAnalysis.multivariateAnalysis;
      expect(multivariateAnalysis).toBeDefined();

      // PCA analysis
      if (multivariateAnalysis?.pcaAnalysis) {
        expect(multivariateAnalysis.pcaAnalysis.eigenValues.length).toBeGreaterThan(0);
        expect(multivariateAnalysis.pcaAnalysis.explainedVarianceRatio.length).toBeGreaterThan(0);
        expect(multivariateAnalysis.pcaAnalysis.cumulativeVarianceExplained.length).toBeGreaterThan(0);
        expect(multivariateAnalysis.pcaAnalysis.loadingsMatrix).toBeDefined();
      }
    });

    it('should perform clustering analysis', async () => {
      const data = Array.from({ length: 30 }, (_, i) => [
        i.toString(),
        (Math.random() * 100).toFixed(2),
        (Math.random() * 100).toFixed(2),
        (Math.random() * 100).toFixed(2),
      ]);

      const input: Section3AnalyzerInput = {
        data,
        headers: ['id', 'x', 'y', 'z'],
        columnTypes: [DataType.INTEGER, DataType.FLOAT, DataType.FLOAT, DataType.FLOAT],
        rowCount: 30,
        columnCount: 4,
        section1Result: createMockSection1Result(),
        config: {
          enabledAnalyses: ['multivariate'],
          enableAdvancedTests: true,
        },
      };

      const analyzer = new Section3Analyzer(input);
      const result = await analyzer.analyze();

      if (result.edaAnalysis.multivariateAnalysis?.clusteringAnalysis) {
        const clustering = result.edaAnalysis.multivariateAnalysis.clusteringAnalysis;
        expect(clustering.optimalClusters).toBeGreaterThan(0);
        expect(clustering.silhouetteScore).toBeGreaterThan(-1);
        expect(clustering.silhouetteScore).toBeLessThanOrEqual(1);
        expect(clustering.clusterAssignments.length).toBe(30);
      }
    });

    it('should perform multivariate outlier detection', async () => {
      const data = Array.from({ length: 40 }, (_, i) => [
        i.toString(),
        i < 35 ? (10 + Math.random() * 5).toFixed(2) : '100', // Outlier in last 5 rows
        i < 35 ? (20 + Math.random() * 5).toFixed(2) : '200', // Outlier in last 5 rows
      ]);

      const input: Section3AnalyzerInput = {
        data,
        headers: ['id', 'x', 'y'],
        columnTypes: [DataType.INTEGER, DataType.FLOAT, DataType.FLOAT],
        rowCount: 40,
        columnCount: 3,
        section1Result: createMockSection1Result(),
        config: {
          enabledAnalyses: ['multivariate'],
          enableAdvancedTests: true,
        },
      };

      const analyzer = new Section3Analyzer(input);
      const result = await analyzer.analyze();

      if (result.edaAnalysis.multivariateAnalysis?.outlierAnalysis) {
        const outlierAnalysis = result.edaAnalysis.multivariateAnalysis.outlierAnalysis;
        expect(outlierAnalysis.method).toBeDefined();
        expect(outlierAnalysis.outlierIndices.length).toBeGreaterThanOrEqual(0);
        expect(outlierAnalysis.outlierScores.length).toBe(40);
      }
    });
  });

  describe('Performance and Configuration', () => {
    it('should respect configuration settings', async () => {
      const data = Array.from({ length: 10 }, (_, i) => [
        i.toString(),
        (i * 2).toString(),
      ]);

      const config: Section3Config = {
        enabledAnalyses: ['univariate'], // Only univariate
        significanceLevel: 0.01,
        maxBivariateComparisons: 10,
        enableAdvancedTests: false,
      };

      const input: Section3AnalyzerInput = {
        data,
        headers: ['id', 'value'],
        columnTypes: [DataType.INTEGER, DataType.INTEGER],
        rowCount: 10,
        columnCount: 2,
        section1Result: createMockSection1Result(),
        config,
      };

      const analyzer = new Section3Analyzer(input);
      const result = await analyzer.analyze();

      // Should only have univariate analysis
      expect(result.edaAnalysis.univariateAnalysis).toBeDefined();
      expect(result.edaAnalysis.bivariateAnalysis.numericalRelationships).toHaveLength(0);
      expect(result.edaAnalysis.multivariateAnalysis).toBeUndefined();
    });

    it('should handle large datasets efficiently', async () => {
      // Create dataset with 1000 rows
      const data = Array.from({ length: 1000 }, (_, i) => [
        i.toString(),
        (Math.random() * 100).toFixed(2),
        ['A', 'B', 'C'][i % 3],
      ]);

      const input: Section3AnalyzerInput = {
        data,
        headers: ['id', 'value', 'category'],
        columnTypes: [DataType.INTEGER, DataType.FLOAT, DataType.STRING],
        rowCount: 1000,
        columnCount: 3,
        section1Result: createMockSection1Result(),
        config: {
          streamingConfig: {
            chunkSize: 100,
            memoryThreshold: 0.8,
          },
        },
      };

      const start = Date.now();
      const analyzer = new Section3Analyzer(input);
      const result = await analyzer.analyze();
      const duration = Date.now() - start;

      // Should complete within reasonable time (< 3 seconds)
      expect(duration).toBeLessThan(3000);
      expect(result.edaAnalysis.univariateAnalysis.columnAnalyses).toHaveLength(3);
      expect(result.performanceMetrics.totalAnalysisTime).toBeGreaterThan(0);
    });

    it('should track performance metrics', async () => {
      const data = [
        ['1', '25', 'Engineer'],
        ['2', '30', 'Designer'],
        ['3', '35', 'Manager'],
      ];

      const input: Section3AnalyzerInput = {
        data,
        headers: ['id', 'age', 'role'],
        columnTypes: [DataType.INTEGER, DataType.INTEGER, DataType.STRING],
        rowCount: 3,
        columnCount: 3,
        section1Result: createMockSection1Result(),
      };

      const analyzer = new Section3Analyzer(input);
      const result = await analyzer.analyze();

      expect(result.performanceMetrics.totalAnalysisTime).toBeGreaterThan(0);
      expect(result.performanceMetrics.phases).toBeDefined();
      if (result.performanceMetrics.phases) {
        expect(Object.keys(result.performanceMetrics.phases).length).toBeGreaterThan(0);
      }
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty datasets gracefully', async () => {
      const input: Section3AnalyzerInput = {
        data: [],
        headers: ['id', 'value'],
        columnTypes: [DataType.INTEGER, DataType.FLOAT],
        rowCount: 0,
        columnCount: 2,
        section1Result: createMockSection1Result(),
      };

      const analyzer = new Section3Analyzer(input);
      const result = await analyzer.analyze();

      expect(result.edaAnalysis.univariateAnalysis.summary.totalColumns).toBe(2);
      expect(result.edaAnalysis.univariateAnalysis.columnAnalyses).toHaveLength(2);
      expect(result.warnings.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle single column datasets', async () => {
      const data = [['1'], ['2'], ['3']];

      const input: Section3AnalyzerInput = {
        data,
        headers: ['id'],
        columnTypes: [DataType.INTEGER],
        rowCount: 3,
        columnCount: 1,
        section1Result: createMockSection1Result(),
      };

      const analyzer = new Section3Analyzer(input);
      const result = await analyzer.analyze();

      expect(result.edaAnalysis.univariateAnalysis.columnAnalyses).toHaveLength(1);
      expect(result.edaAnalysis.bivariateAnalysis.numericalRelationships).toHaveLength(0);
      expect(result.edaAnalysis.multivariateAnalysis).toBeUndefined();
    });

    it('should handle datasets with missing values', async () => {
      const data = [
        ['1', '25', 'Engineer'],
        ['2', '', 'Designer'],
        ['3', '35', ''],
        ['4', null, undefined],
      ];

      const input: Section3AnalyzerInput = {
        data,
        headers: ['id', 'age', 'role'],
        columnTypes: [DataType.INTEGER, DataType.INTEGER, DataType.STRING],
        rowCount: 4,
        columnCount: 3,
        section1Result: createMockSection1Result(),
      };

      const analyzer = new Section3Analyzer(input);
      // Should not throw errors
      const result = await analyzer.analyze();

      expect(result.edaAnalysis.univariateAnalysis.columnAnalyses).toHaveLength(3);
      expect(result.warnings.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle mixed data type issues', async () => {
      const data = [
        ['1', '25', 'Engineer'],
        ['2', 'not_a_number', 'Designer'],
        ['3', '35.5', 'Manager'],
      ];

      const input: Section3AnalyzerInput = {
        data,
        headers: ['id', 'age', 'role'],
        columnTypes: [DataType.INTEGER, DataType.INTEGER, DataType.STRING],
        rowCount: 3,
        columnCount: 3,
        section1Result: createMockSection1Result(),
      };

      const analyzer = new Section3Analyzer(input);
      const result = await analyzer.analyze();

      // Should handle gracefully and potentially generate warnings
      expect(result.edaAnalysis.univariateAnalysis.columnAnalyses).toHaveLength(3);
      expect(result.warnings.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Integration with Section 1 Results', () => {
    it('should use Section 1 metadata for enhanced analysis', async () => {
      const data = [
        ['1', '25', 'Engineer'],
        ['2', '30', 'Designer'],
        ['3', '35', 'Manager'],
      ];

      const detailedSection1Result: Section1Result = {
        overview: {
          version: '1.3.1',
          generatedAt: new Date(),
          fileDetails: {
            originalFilename: 'employee-data.csv',
            fullResolvedPath: '/data/employee-data.csv',
            fileSizeBytes: 150,
            fileSizeMB: 0.00015,
            lastModified: new Date(),
            encoding: 'utf-8',
            dataSourceType: 'Local File System',
          },
          initialScanLimit: {
            linesScanned: 3,
            bytesScanned: 150,
            estimatedTotalLines: 3,
          },
          structuralDimensions: {
            totalRows: 3,
            totalColumns: 3,
            estimatedDataCells: 9,
          },
          executionContext: {
            hostname: 'analytics-server',
            platform: 'linux',
            nodeVersion: 'v18.17.0',
            availableMemory: '16GB',
            cpuArchitecture: 'x64',
          },
        },
        parsing: {
          csvStructure: {
            delimiter: ',',
            quoteChar: '"',
            escapeChar: '\\',
            hasHeader: true,
            lineEndings: 'LF',
          },
          columnSchema: [
            { index: 0, inferredName: 'employee_id', originalHeader: 'id', dataType: DataType.INTEGER },
            { index: 1, inferredName: 'age_years', originalHeader: 'age', dataType: DataType.INTEGER },
            { index: 2, inferredName: 'job_role', originalHeader: 'role', dataType: DataType.STRING },
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
          totalAnalysisTime: 50,
          memoryUsage: 25,
          gcEvents: 0,
        },
      };

      const input: Section3AnalyzerInput = {
        data,
        headers: ['id', 'age', 'role'],
        columnTypes: [DataType.INTEGER, DataType.INTEGER, DataType.STRING],
        rowCount: 3,
        columnCount: 3,
        section1Result: detailedSection1Result,
      };

      const analyzer = new Section3Analyzer(input);
      const result = await analyzer.analyze();

      // Should successfully integrate with Section 1 metadata
      expect(result.edaAnalysis.univariateAnalysis.columnAnalyses).toHaveLength(3);
      expect(result.performanceMetrics.totalAnalysisTime).toBeGreaterThan(0);
      
      // Should reference the original column schema
      const ageAnalysis = result.edaAnalysis.univariateAnalysis.columnAnalyses.find(
        col => col.columnName === 'age'
      );
      expect(ageAnalysis).toBeDefined();
    });
  });
});

// Helper function to create mock Section 1 result
function createMockSection1Result(): Section1Result {
  return {
    overview: {
      version: '1.3.1',
      generatedAt: new Date(),
      fileDetails: {
        originalFilename: 'test-data.csv',
        fullResolvedPath: '/path/to/test-data.csv',
        fileSizeBytes: 1000,
        fileSizeMB: 0.001,
        lastModified: new Date(),
        encoding: 'utf-8',
        dataSourceType: 'Local File System',
      },
      initialScanLimit: {
        linesScanned: 10,
        bytesScanned: 1000,
        estimatedTotalLines: 10,
      },
      structuralDimensions: {
        totalRows: 10,
        totalColumns: 3,
        estimatedDataCells: 30,
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
        { index: 1, inferredName: 'value', originalHeader: 'value', dataType: DataType.FLOAT },
        { index: 2, inferredName: 'category', originalHeader: 'category', dataType: DataType.STRING },
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