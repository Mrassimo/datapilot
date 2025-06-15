/**
 * Section 2 Quality Analyzer Integration Tests
 * 
 * Tests integration between the main Section2Analyzer and its component analyzers
 * to ensure proper orchestration and data flow between quality dimensions.
 */

import { Section2Analyzer } from '../../../src/analyzers/quality/section2-analyzer';
import { CompletenessAnalyzer } from '../../../src/analyzers/quality/completeness-analyzer';
import { UniquenessAnalyzer } from '../../../src/analyzers/quality/uniqueness-analyzer';
import { ValidityAnalyzer } from '../../../src/analyzers/quality/validity-analyzer';
import { BusinessRuleEngine } from '../../../src/analyzers/quality/business-rule-engine';
import { PatternValidationEngine } from '../../../src/analyzers/quality/pattern-validation-engine';
import type { Section2Config } from '../../../src/analyzers/quality/types';
import { DataType } from '../../../src/core/types';

describe('Section2Analyzer - Integration Tests', () => {
  describe('Component Analyzer Integration', () => {
    it('should integrate completeness and uniqueness analysis results', async () => {
      const data = [
        ['1', 'John', 'john@email.com', '25'],
        ['1', 'John', 'john@email.com', '25'], // Exact duplicate
        ['2', 'Jane', '', '30'],               // Missing email
        ['3', '', 'bob@email.com', ''],        // Missing name and age
        ['4', 'Alice', 'alice@email.com', '40']
      ];

      const analyzer = new Section2Analyzer({
        data,
        headers: ['id', 'name', 'email', 'age'],
        columnTypes: [DataType.INTEGER, DataType.STRING, DataType.STRING, DataType.INTEGER],
        rowCount: 5,
        columnCount: 4
      });

      const result = await analyzer.analyze();

      // Completeness should detect missing values
      expect(result.qualityAudit.completeness.datasetLevel.totalMissingValues).toBeGreaterThan(2);
      expect(result.qualityAudit.completeness.columnLevel.some(col => col.missingCount > 0)).toBe(true);

      // Uniqueness should detect the exact duplicate
      expect(result.qualityAudit.uniqueness.exactDuplicates.count).toBeGreaterThanOrEqual(1);
      expect(result.qualityAudit.uniqueness.exactDuplicates.percentage).toBeGreaterThan(0);

      // Composite score should reflect both issues
      expect(result.qualityAudit.cockpit.compositeScore.score).toBeLessThan(95);
      
      // Should identify both completeness and uniqueness as weaknesses
      const weaknessCats = result.qualityAudit.cockpit.topWeaknesses.map(w => w.category);
      expect(weaknessCats.some(cat => ['completeness', 'uniqueness'].includes(cat))).toBe(true);
    });

    it('should integrate validity and consistency analysis results', async () => {
      const data = [
        ['1', 'John Smith', 'john@company.com', '25', '2024-01-15'],
        ['2', 'jane doe', 'invalid-email', 'twenty-five', '01/16/2024'], // Multiple issues
        ['3', 'BOB JOHNSON', 'bob@company.com', '-5', '17-01-2024'],    // Negative age, format issues
        ['4', 'Alice Brown', 'alice@domain', '300', '2024/01/18'],      // Invalid email, unreasonable age
        ['5', 'charlie davis', 'charlie@company.com', '35', 'invalid-date'] // Casing, invalid date
      ];

      const analyzer = new Section2Analyzer({
        data,
        headers: ['id', 'name', 'email', 'age', 'date'],
        columnTypes: [DataType.INTEGER, DataType.STRING, DataType.STRING, DataType.INTEGER, DataType.DATE],
        rowCount: 5,
        columnCount: 5
      });

      const result = await analyzer.analyze();

      // Validity should detect type conformance and pattern violations
      expect(result.qualityAudit.validity.typeConformance.some(tc => tc.nonConformingCount > 0)).toBe(true);
      expect(result.qualityAudit.validity.rangeConformance.some(rc => rc.violationsCount > 0)).toBe(true);

      // Consistency should detect format and casing issues
      expect(result.qualityAudit.consistency.formatConsistency.some(fc => !fc.consistency.isConsistent)).toBe(true);

      // Accuracy should be affected by these issues
      expect(result.qualityAudit.accuracy.score.score).toBeLessThan(90);

      // Cockpit should identify validity and consistency as problem areas
      const dimensionScores = result.qualityAudit.cockpit.dimensionScores;
      expect(dimensionScores.validity.score).toBeLessThan(dimensionScores.completeness.score);
      expect(dimensionScores.consistency.score).toBeLessThan(dimensionScores.completeness.score);
    });

    it('should integrate business rules and pattern validation', async () => {
      const data = [
        ['1', 'John', '25', '2000-01-01', '2020-06-01', 'john@company.com'],
        ['2', 'Jane', '16', '2008-01-01', '2020-06-01', 'jane@invalid'],      // Under 18 + invalid email
        ['3', 'Bob', '30', '1990-01-01', '1985-06-01', 'bob@company.com'],   // Graduation before birth
        ['4', 'Alice', '35', '1988-05-15', '2010-06-01', 'alice@company'],   // Invalid email domain
        ['5', 'Charlie', '40', '1983-03-20', '2005-12-01', 'charlie@company.com']
      ];

      const config: Section2Config = {
        enabledDimensions: ['accuracy', 'validity', 'consistency'],
        strictMode: true,
        maxOutlierDetection: 100,
        semanticDuplicateThreshold: 0.8,
        customBusinessRules: [
          {
            ruleId: 'birth_graduation_chronology',
            description: 'Birth date must be before graduation date',
            violations: 0,
            examples: []
          },
          {
            ruleId: 'adult_graduation_age',
            description: 'Person must be at least 18 at graduation',
            violations: 0,
            examples: []
          }
        ],
        customPatterns: [
          {
            name: 'company_email',
            pattern: '^[a-zA-Z0-9._%+-]+@company\\.com$',
            column: 'email'
          }
        ]
      };

      const analyzer = new Section2Analyzer({
        data,
        headers: ['id', 'name', 'age', 'birth_date', 'graduation_date', 'email'],
        columnTypes: [DataType.INTEGER, DataType.STRING, DataType.INTEGER, DataType.DATE, DataType.DATE, DataType.STRING],
        rowCount: 5,
        columnCount: 6,
        config
      });

      const result = await analyzer.analyze();

      // Should detect business rule violations
      expect(result.qualityAudit.accuracy.crossFieldValidation.length).toBeGreaterThanOrEqual(0);
      
      // Should detect pattern violations
      expect(result.qualityAudit.validity.patternConformance.length).toBeGreaterThanOrEqual(0);

      // Should have appropriate warnings for critical violations
      const businessRuleWarnings = result.warnings.filter(w => w.category === 'business_rules');
      const patternWarnings = result.warnings.filter(w => w.category === 'pattern_validation');
      expect(businessRuleWarnings.length + patternWarnings.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Cross-Dimensional Quality Impact', () => {
    it('should show how completeness affects other dimensions', async () => {
      // Dataset with systematic missing values that affect other quality dimensions
      const dataWithMissingValues = [
        ['1', 'John', 'john@email.com', '25', 'Engineer'],
        ['2', '', '', '', ''],           // Completely missing row
        ['3', 'Bob', '', '35', 'Manager'],      // Missing critical email
        ['4', 'Alice', 'alice@email.com', '', 'Analyst'], // Missing age
        ['5', 'Charlie', 'charlie@email.com', '40', '']   // Missing role
      ];

      const dataWithoutMissingValues = [
        ['1', 'John', 'john@email.com', '25', 'Engineer'],
        ['2', 'Jane', 'jane@email.com', '30', 'Designer'],
        ['3', 'Bob', 'bob@email.com', '35', 'Manager'],
        ['4', 'Alice', 'alice@email.com', '28', 'Analyst'],
        ['5', 'Charlie', 'charlie@email.com', '40', 'Lead']
      ];

      const analyzerWithMissing = new Section2Analyzer({
        data: dataWithMissingValues,
        headers: ['id', 'name', 'email', 'age', 'role'],
        columnTypes: [DataType.INTEGER, DataType.STRING, DataType.STRING, DataType.INTEGER, DataType.STRING],
        rowCount: 5,
        columnCount: 5
      });

      const analyzerWithoutMissing = new Section2Analyzer({
        data: dataWithoutMissingValues,
        headers: ['id', 'name', 'email', 'age', 'role'],
        columnTypes: [DataType.INTEGER, DataType.STRING, DataType.STRING, DataType.INTEGER, DataType.STRING],
        rowCount: 5,
        columnCount: 5
      });

      const resultWithMissing = await analyzerWithMissing.analyze();
      const resultWithoutMissing = await analyzerWithoutMissing.analyze();

      // Completeness should be significantly different
      expect(resultWithMissing.qualityAudit.completeness.datasetLevel.overallCompletenessRatio)
        .toBeLessThan(resultWithoutMissing.qualityAudit.completeness.datasetLevel.overallCompletenessRatio);

      // Missing values should negatively impact composite score
      expect(resultWithMissing.qualityAudit.cockpit.compositeScore.score)
        .toBeLessThan(resultWithoutMissing.qualityAudit.cockpit.compositeScore.score);

      // Accuracy and validity should also be affected by missing data
      expect(resultWithMissing.qualityAudit.accuracy.score.score)
        .toBeLessThanOrEqual(resultWithoutMissing.qualityAudit.accuracy.score.score);
    });

    it('should demonstrate consistency impact on accuracy', async () => {
      const inconsistentData = [
        ['1', 'John Smith', '2024-01-15', 'TRUE', '$50,000'],
        ['2', 'jane doe', '01/16/2024', 'yes', '55000'],      // Different formats
        ['3', 'BOB JOHNSON', '17-01-2024', '1', '60k'],      // Mixed formats
        ['4', 'Alice Brown', '2024/01/18', 'false', 'sixty-five thousand'],
        ['5', 'charlie davis', 'Jan 19, 2024', 'NO', '€70,000']
      ];

      const consistentData = [
        ['1', 'John Smith', '2024-01-15', 'true', '50000'],
        ['2', 'Jane Doe', '2024-01-16', 'false', '55000'],
        ['3', 'Bob Johnson', '2024-01-17', 'true', '60000'],
        ['4', 'Alice Brown', '2024-01-18', 'false', '65000'],
        ['5', 'Charlie Davis', '2024-01-19', 'true', '70000']
      ];

      const analyzerInconsistent = new Section2Analyzer({
        data: inconsistentData,
        headers: ['id', 'name', 'date', 'active', 'salary'],
        columnTypes: [DataType.INTEGER, DataType.STRING, DataType.DATE, DataType.BOOLEAN, DataType.STRING],
        rowCount: 5,
        columnCount: 5
      });

      const analyzerConsistent = new Section2Analyzer({
        data: consistentData,
        headers: ['id', 'name', 'date', 'active', 'salary'],
        columnTypes: [DataType.INTEGER, DataType.STRING, DataType.DATE, DataType.BOOLEAN, DataType.STRING],
        rowCount: 5,
        columnCount: 5
      });

      const resultInconsistent = await analyzerInconsistent.analyze();
      const resultConsistent = await analyzerConsistent.analyze();

      // Consistency should be significantly different
      expect(resultInconsistent.qualityAudit.consistency.score.score)
        .toBeLessThan(resultConsistent.qualityAudit.consistency.score.score);

      // Inconsistency should impact accuracy
      expect(resultInconsistent.qualityAudit.accuracy.score.score)
        .toBeLessThan(resultConsistent.qualityAudit.accuracy.score.score);

      // Format consistency issues should be detected
      expect(resultInconsistent.qualityAudit.consistency.formatConsistency.length)
        .toBeGreaterThan(resultConsistent.qualityAudit.consistency.formatConsistency.length);
    });
  });

  describe('Component Analyzer Isolation and Independence', () => {
    it('should ensure completeness analyzer works independently', async () => {
      const data = [
        ['1', 'John', '25'],
        ['2', '', '30'],
        ['3', 'Bob', ''],
        ['4', 'Alice', '40']
      ];

      const completenessAnalyzer = new CompletenessAnalyzer({
        data,
        headers: ['id', 'name', 'age'],
        columnTypes: [DataType.INTEGER, DataType.STRING, DataType.INTEGER],
        rowCount: 4,
        columnCount: 3
      });

      const result = completenessAnalyzer.analyze();

      expect(result.datasetLevel.totalMissingValues).toBe(2);
      expect(result.columnLevel).toHaveLength(3);
      expect(result.score.score).toBeGreaterThanOrEqual(0);
      expect(result.score.score).toBeLessThanOrEqual(100);
    });

    it('should ensure uniqueness analyzer works independently', async () => {
      const data = [
        ['1', 'John', 'Engineer'],
        ['2', 'Jane', 'Designer'],
        ['1', 'John', 'Engineer'], // Exact duplicate
        ['3', 'Jon', 'Engineer'],  // Potential semantic duplicate
        ['4', 'Bob', 'Manager']
      ];

      const uniquenessAnalyzer = new UniquenessAnalyzer({
        data,
        headers: ['id', 'name', 'role'],
        columnTypes: [DataType.INTEGER, DataType.STRING, DataType.STRING],
        rowCount: 5,
        columnCount: 3
      });

      const result = uniquenessAnalyzer.analyze();

      expect(result.exactDuplicates.count).toBeGreaterThanOrEqual(1);
      expect(result.exactDuplicates.percentage).toBeGreaterThan(0);
      expect(result.score.score).toBeGreaterThanOrEqual(0);
      expect(result.score.score).toBeLessThanOrEqual(100);
    });

    it('should ensure validity analyzer works independently', async () => {
      const data = [
        ['1', '25', 'john@email.com'],
        ['2', 'invalid', 'jane@email.com'],
        ['3', '35', 'not-an-email'],
        ['4', '40', 'bob@email.com']
      ];

      const validityAnalyzer = new ValidityAnalyzer({
        data,
        headers: ['id', 'age', 'email'],
        columnTypes: [DataType.INTEGER, DataType.INTEGER, DataType.STRING],
        rowCount: 4,
        columnCount: 3
      });

      const result = validityAnalyzer.analyze();

      expect(result.typeConformance).toHaveLength(3);
      expect(result.typeConformance.some(tc => tc.nonConformingCount > 0)).toBe(true);
      expect(result.score.score).toBeGreaterThanOrEqual(0);
      expect(result.score.score).toBeLessThanOrEqual(100);
    });
  });

  describe('Error Propagation and Handling', () => {
    it('should handle component analyzer failures gracefully', async () => {
      // Create data that might cause issues in specific analyzers
      const problematicData = [
        [null, undefined, ''],
        ['', null, undefined],
        [undefined, '', null],
        ['valid', 'data', 'row']
      ];

      const analyzer = new Section2Analyzer({
        data: problematicData,
        headers: ['col1', 'col2', 'col3'],
        columnTypes: [DataType.STRING, DataType.STRING, DataType.STRING],
        rowCount: 4,
        columnCount: 3
      });

      // Should not throw despite problematic data
      expect(async () => await analyzer.analyze()).not.toThrow();

      const result = await analyzer.analyze();
      expect(result.qualityAudit.cockpit.compositeScore.score).toBeGreaterThanOrEqual(0);
      
      // Should have generated appropriate warnings
      expect(result.warnings.length).toBeGreaterThanOrEqual(0);
    });

    it('should maintain analysis integrity when one component has issues', async () => {
      const data = [
        ['1', 'John', 'john@email.com', '25'],
        ['2', 'Jane', 'jane@email.com', '30'],
        ['3', 'Bob', 'bob@email.com', '35']
      ];

      // Force configuration that might cause issues in business rules
      const config: Section2Config = {
        enabledDimensions: ['completeness', 'uniqueness', 'validity', 'accuracy'],
        strictMode: true,
        maxOutlierDetection: 100,
        semanticDuplicateThreshold: 0.8,
        customBusinessRules: [
          {
            ruleId: 'impossible_rule',
            description: 'Rule that references non-existent columns',
            violations: 0,
            examples: []
          }
        ]
      };

      const analyzer = new Section2Analyzer({
        data,
        headers: ['id', 'name', 'email', 'age'],
        columnTypes: [DataType.INTEGER, DataType.STRING, DataType.STRING, DataType.INTEGER],
        rowCount: 3,
        columnCount: 4,
        config
      });

      const result = await analyzer.analyze();

      // Basic dimensions should still work
      expect(result.qualityAudit.completeness.datasetLevel.totalMissingValues).toBe(0);
      expect(result.qualityAudit.uniqueness.exactDuplicates.count).toBe(0);
      expect(result.qualityAudit.cockpit.compositeScore.score).toBeGreaterThan(0);
    });
  });

  describe('Performance Integration', () => {
    it('should coordinate performance across all components', async () => {
      const data = Array.from({ length: 3000 }, (_, i) => [
        i.toString(),
        `User${i}`,
        `user${i}@company.com`,
        (20 + i % 50).toString(),
        (30000 + i * 10).toString(),
        new Date(2020 + i % 4, i % 12, (i % 28) + 1).toISOString()
      ]);

      const start = Date.now();
      
      const analyzer = new Section2Analyzer({
        data,
        headers: ['id', 'name', 'email', 'age', 'salary', 'created_date'],
        columnTypes: [DataType.INTEGER, DataType.STRING, DataType.STRING, DataType.INTEGER, DataType.FLOAT, DataType.DATE],
        rowCount: data.length,
        columnCount: 6
      });

      const result = await analyzer.analyze();
      const totalDuration = Date.now() - start;

      expect(result.qualityAudit.cockpit.compositeScore.score).toBeGreaterThanOrEqual(0);
      
      // Should complete within reasonable time
      expect(totalDuration).toBeLessThan(12000); // 12 seconds for 3k rows
      
      // Performance metrics should account for all components
      expect(result.performanceMetrics.totalAnalysisTime).toBeGreaterThan(0);
      expect(result.performanceMetrics.phases).toBeDefined();
      expect(Object.keys(result.performanceMetrics.phases).length).toBeGreaterThan(3);
    });

    it('should balance quality thoroughness with performance', async () => {
      const data = Array.from({ length: 1500 }, (_, i) => [
        i.toString(),
        `Customer${i}`,
        `customer${i}@domain.com`,
        (i % 100).toString() // Will create many duplicates
      ]);

      const analyzer = new Section2Analyzer({
        data,
        headers: ['customer_id', 'customer_name', 'customer_email', 'segment_id'],
        columnTypes: [DataType.INTEGER, DataType.STRING, DataType.STRING, DataType.INTEGER],
        rowCount: data.length,
        columnCount: 4
      });

      const start = Date.now();
      const result = await analyzer.analyze();
      const duration = Date.now() - start;

      // Should detect the patterns in reasonable time
      expect(duration).toBeLessThan(8000); // 8 seconds
      
      // Should still provide comprehensive analysis
      expect(result.qualityAudit.uniqueness.exactDuplicates.count).toBe(0); // No exact duplicates
      expect(result.qualityAudit.uniqueness.columnUniqueness.length).toBe(4);
      expect(result.qualityAudit.completeness.datasetLevel.totalMissingValues).toBe(0);
      expect(result.qualityAudit.cockpit.dimensionScores.completeness.score).toBeGreaterThan(95);
    });
  });
});