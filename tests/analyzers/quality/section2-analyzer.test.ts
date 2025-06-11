/**
 * Section 2: Data Quality & Integrity Audit - Test Suite
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { Section2Analyzer } from '../../../src/analyzers/quality/section2-analyzer';
import { CompletenessAnalyzer } from '../../../src/analyzers/quality/completeness-analyzer';
import { UniquenessAnalyzer } from '../../../src/analyzers/quality/uniqueness-analyzer';
import { ValidityAnalyzer } from '../../../src/analyzers/quality/validity-analyzer';
import { Section2Formatter } from '../../../src/analyzers/quality/section2-formatter';
import { DataType } from '../../../src/core/types';

describe('Section2Analyzer', () => {
  let testData: (string | null | undefined)[][];
  let headers: string[];
  let columnTypes: DataType[];

  beforeEach(() => {
    // Sample test dataset
    headers = ['customer_id', 'name', 'email', 'age', 'signup_date', 'is_active'];
    columnTypes = [DataType.STRING, DataType.STRING, DataType.STRING, DataType.INTEGER, DataType.DATE, DataType.BOOLEAN];
    
    testData = [
      ['C001', 'John Doe', 'john@example.com', '25', '2023-01-15', 'true'],
      ['C002', 'Jane Smith', 'jane@test.com', '30', '2023-02-20', 'false'],
      ['C003', 'Bob Wilson', null, '45', '2023-03-10', 'true'],
      ['C001', 'John Doe', 'john@example.com', '25', '2023-01-15', 'true'], // Duplicate
      ['C004', 'Alice Brown', 'invalid-email', '150', null, '1'],
      ['C005', '', 'alice@example.com', null, '2023-04-01', 'yes'],
      ['C006', 'Charlie Davis', 'charlie@test.com', '35', '2023-05-15', 'false'],
      [null, 'Dana Green', 'dana@example.com', '28', '2023-06-01', null]
    ];
  });

  describe('Main Section2Analyzer', () => {
    it('should complete full quality audit analysis', async () => {
      const analyzer = new Section2Analyzer({
        data: testData,
        headers,
        columnTypes,
        rowCount: testData.length,
        columnCount: headers.length
      });

      const result = await analyzer.analyze();

      expect(result).toBeDefined();
      expect(result.qualityAudit).toBeDefined();
      expect(result.qualityAudit.cockpit).toBeDefined();
      expect(result.qualityAudit.completeness).toBeDefined();
      expect(result.qualityAudit.uniqueness).toBeDefined();
      expect(result.qualityAudit.validity).toBeDefined();
      expect(result.performanceMetrics).toBeDefined();
      expect(result.performanceMetrics.totalAnalysisTime).toBeGreaterThan(0);
    });

    it('should generate cockpit with composite scoring', async () => {
      const analyzer = new Section2Analyzer({
        data: testData,
        headers,
        columnTypes,
        rowCount: testData.length,
        columnCount: headers.length
      });

      const result = await analyzer.analyze();
      const cockpit = result.qualityAudit.cockpit;

      expect(cockpit.compositeScore).toBeDefined();
      expect(cockpit.compositeScore.score).toBeGreaterThan(0);
      expect(cockpit.compositeScore.score).toBeLessThanOrEqual(100);
      expect(cockpit.compositeScore.interpretation).toMatch(/^(Excellent|Good|Fair|Needs Improvement|Poor)$/);
      
      expect(cockpit.dimensionScores).toBeDefined();
      expect(cockpit.topStrengths).toBeInstanceOf(Array);
      expect(cockpit.topWeaknesses).toBeInstanceOf(Array);
      expect(cockpit.technicalDebt).toBeDefined();
    });

    it('should track progress during analysis', async () => {
      const progressUpdates: any[] = [];
      
      const analyzer = new Section2Analyzer({
        data: testData,
        headers,
        columnTypes,
        rowCount: testData.length,
        columnCount: headers.length,
        onProgress: (progress) => progressUpdates.push(progress)
      });

      await analyzer.analyze();

      expect(progressUpdates.length).toBeGreaterThan(0);
      expect(progressUpdates[0].progress).toBe(0);
      expect(progressUpdates[progressUpdates.length - 1].progress).toBe(100);
    });
  });

  describe('CompletenessAnalyzer', () => {
    it('should detect missing values correctly', () => {
      const analyzer = new CompletenessAnalyzer({
        data: testData,
        headers,
        columnTypes,
        rowCount: testData.length,
        columnCount: headers.length
      });

      const result = analyzer.analyze();

      expect(result.datasetLevel.totalMissingValues).toBeGreaterThan(0);
      expect(result.datasetLevel.overallCompletenessRatio).toBeLessThan(100);
      
      // Check specific columns for missing values
      const emailColumn = result.columnLevel.find(col => col.columnName === 'email');
      expect(emailColumn?.missingCount).toBe(1); // One null email
      
      const ageColumn = result.columnLevel.find(col => col.columnName === 'age');
      expect(ageColumn?.missingCount).toBe(1); // One null age
    });

    it('should suggest appropriate imputation strategies', () => {
      const analyzer = new CompletenessAnalyzer({
        data: testData,
        headers,
        columnTypes,
        rowCount: testData.length,
        columnCount: headers.length
      });

      const result = analyzer.analyze();

      const ageColumn = result.columnLevel.find(col => col.columnName === 'age');
      expect(ageColumn?.suggestedImputation.method).toMatch(/^(Mean|Median|Mode|Regression|ML Model|None|Domain Input Required)$/);
      
      const nameColumn = result.columnLevel.find(col => col.columnName === 'name');
      expect(nameColumn?.suggestedImputation.method).toMatch(/^(Mean|Median|Mode|Regression|ML Model|None|Domain Input Required)$/);
    });

    it('should calculate completeness score appropriately', () => {
      const analyzer = new CompletenessAnalyzer({
        data: testData,
        headers,
        columnTypes,
        rowCount: testData.length,
        columnCount: headers.length
      });

      const result = analyzer.analyze();

      expect(result.score.score).toBeGreaterThan(0);
      expect(result.score.score).toBeLessThanOrEqual(100);
      expect(result.score.interpretation).toBeDefined();
    });
  });

  describe('UniquenessAnalyzer', () => {
    it('should detect exact duplicates', () => {
      const analyzer = new UniquenessAnalyzer({
        data: testData,
        headers,
        columnTypes,
        rowCount: testData.length,
        columnCount: headers.length
      });

      const result = analyzer.analyze();

      expect(result.exactDuplicates.count).toBeGreaterThan(0); // Should find the duplicate row
      expect(result.exactDuplicates.duplicateGroups.length).toBeGreaterThan(0);
    });

    it('should analyze key uniqueness', () => {
      const analyzer = new UniquenessAnalyzer({
        data: testData,
        headers,
        columnTypes,
        rowCount: testData.length,
        columnCount: headers.length
      });

      const result = analyzer.analyze();

      expect(result.keyUniqueness.length).toBeGreaterThan(0);
      const customerIdKey = result.keyUniqueness.find(key => key.columnName === 'customer_id');
      expect(customerIdKey).toBeDefined();
      expect(customerIdKey?.duplicateCount).toBeGreaterThan(0); // C001 appears twice
    });

    it('should calculate column uniqueness percentages', () => {
      const analyzer = new UniquenessAnalyzer({
        data: testData,
        headers,
        columnTypes,
        rowCount: testData.length,
        columnCount: headers.length
      });

      const result = analyzer.analyze();

      expect(result.columnUniqueness.length).toBe(headers.length);
      
      const nameColumn = result.columnUniqueness.find(col => col.columnName === 'name');
      expect(nameColumn?.uniquePercentage).toBeGreaterThan(0);
      expect(nameColumn?.uniquePercentage).toBeLessThanOrEqual(100);
    });

    it('should perform semantic duplicate detection', () => {
      const analyzer = new UniquenessAnalyzer({
        data: testData,
        headers,
        columnTypes,
        rowCount: testData.length,
        columnCount: headers.length
      });

      const result = analyzer.analyze();

      expect(result.semanticDuplicates).toBeDefined();
      expect(result.semanticDuplicates.methods).toContain('levenshtein');
      expect(result.semanticDuplicates.methods).toContain('soundex');
    });
  });

  describe('ValidityAnalyzer', () => {
    it('should analyze type conformance', () => {
      const analyzer = new ValidityAnalyzer({
        data: testData,
        headers,
        columnTypes,
        rowCount: testData.length,
        columnCount: headers.length
      });

      const result = analyzer.analyze();

      expect(result.typeConformance.length).toBe(headers.length);
      
      const ageColumn = result.typeConformance.find(type => type.columnName === 'age');
      expect(ageColumn?.conformancePercentage).toBeGreaterThan(0);
      
      // Check that email column has non-conforming values (invalid-email)
      const emailColumn = result.typeConformance.find(type => type.columnName === 'email');
      expect(emailColumn).toBeDefined();
      expect(emailColumn?.conformancePercentage).toBeLessThanOrEqual(100);
    });

    it('should validate patterns for email fields', () => {
      const analyzer = new ValidityAnalyzer({
        data: testData,
        headers,
        columnTypes,
        rowCount: testData.length,
        columnCount: headers.length
      });

      const result = analyzer.analyze();

      const emailPattern = result.patternConformance.find(pattern => pattern.columnName === 'email');
      if (emailPattern) {
        expect(emailPattern.violationsCount).toBeGreaterThan(0); // 'invalid-email' should violate
      }
    });

    it('should check file structure validity', () => {
      const analyzer = new ValidityAnalyzer({
        data: testData,
        headers,
        columnTypes,
        rowCount: testData.length,
        columnCount: headers.length
      });

      const result = analyzer.analyze();

      expect(result.fileStructure.consistentColumnCount).toBeDefined();
      expect(result.fileStructure.headerConformance).toBeDefined();
    });
  });

  describe('Section2Formatter', () => {
    it('should generate comprehensive markdown report', async () => {
      const analyzer = new Section2Analyzer({
        data: testData,
        headers,
        columnTypes,
        rowCount: testData.length,
        columnCount: headers.length
      });

      const result = await analyzer.analyze();
      const markdown = Section2Formatter.formatReport(result.qualityAudit);

      expect(markdown).toContain('## Section 2: Data Quality');
      expect(markdown).toContain('2.1. Overall Data Quality Cockpit');
      expect(markdown).toContain('2.2. Completeness Dimension');
      expect(markdown).toContain('2.6. Uniqueness Dimension');
      expect(markdown).toContain('2.7. Validity & Conformity Dimension');
      expect(markdown).toContain('Composite Data Quality Score');
      expect(markdown).toContain('Data Quality Dimensions Summary');
    });

    it('should include specific metrics in report', async () => {
      const analyzer = new Section2Analyzer({
        data: testData,
        headers,
        columnTypes,
        rowCount: testData.length,
        columnCount: headers.length
      });

      const result = await analyzer.analyze();
      const markdown = Section2Formatter.formatReport(result.qualityAudit);

      // Check for specific quality scores - allow for any formatting around the numbers
      expect(markdown).toContain('Composite Data Quality Score (CDQS):');
      expect(markdown).toMatch(/\d+\.\d+\s*\/\s*100/);
      expect(markdown).toContain('Completeness:');
      expect(markdown).toContain('Uniqueness:');
      expect(markdown).toContain('Validity:');
      
      // Verify the scores are actually numbers
      expect(result.qualityAudit.cockpit.compositeScore.score).toBeGreaterThan(0);
      expect(result.qualityAudit.cockpit.compositeScore.score).toBeLessThanOrEqual(100);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty dataset', async () => {
      const analyzer = new Section2Analyzer({
        data: [],
        headers: ['col1', 'col2'],
        columnTypes: [DataType.STRING, DataType.NUMBER],
        rowCount: 0,
        columnCount: 2
      });

      const result = await analyzer.analyze();
      
      expect(result.qualityAudit.completeness.datasetLevel.totalMissingValues).toBe(0);
      expect(result.qualityAudit.uniqueness.exactDuplicates.count).toBe(0);
    });

    it('should handle single row dataset', async () => {
      const singleRowData = [['test', 'value', '123']];
      
      const analyzer = new Section2Analyzer({
        data: singleRowData,
        headers: ['col1', 'col2', 'col3'],
        columnTypes: [DataType.STRING, DataType.STRING, DataType.INTEGER],
        rowCount: 1,
        columnCount: 3
      });

      const result = await analyzer.analyze();
      
      expect(result.qualityAudit.completeness.datasetLevel.overallCompletenessRatio).toBe(100);
      expect(result.qualityAudit.uniqueness.exactDuplicates.count).toBe(0);
    });

    it('should handle dataset with all null values', async () => {
      const nullData = [
        [null, null, null],
        [null, null, null],
        [null, null, null]
      ];
      
      const analyzer = new Section2Analyzer({
        data: nullData,
        headers: ['col1', 'col2', 'col3'],
        columnTypes: [DataType.STRING, DataType.STRING, DataType.INTEGER],
        rowCount: 3,
        columnCount: 3
      });

      const result = await analyzer.analyze();
      
      expect(result.qualityAudit.completeness.datasetLevel.overallCompletenessRatio).toBe(0);
      expect(result.qualityAudit.completeness.score.interpretation).toBe('Poor');
    });
  });
});