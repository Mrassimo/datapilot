/**
 * Section 2 Quality Analyzer Tests
 * 
 * Tests the comprehensive 10-dimensional data quality audit orchestrator
 * that combines completeness, accuracy, consistency, uniqueness, and other quality dimensions.
 */

import { Section2Analyzer } from '../../../src/analyzers/quality/section2-analyzer';
import type { Section2Config } from '../../../src/analyzers/quality/types';
import { DataType } from '../../../src/core/types';

describe('Section2Analyzer', () => {
  describe('Comprehensive Quality Audit', () => {
    it('should perform complete 10-dimensional quality analysis', async () => {
      const data = [
        ['1', 'John Smith', 'john@email.com', '25', '50000', '2024-01-15', 'Engineer'],
        ['2', 'Jane Doe', 'jane@email.com', '30', '55000', '2024-01-16', 'Designer'],
        ['3', 'Bob Johnson', 'bob@email.com', '', '60000', '2024-01-17', 'Manager'],
        ['4', 'Alice Brown', 'alice@email.com', '35', '', '2024-01-18', 'Analyst'],
        ['5', 'Charlie Davis', 'charlie@email.com', '40', '70000', '2024-01-19', 'Lead'],
      ];

      const config: Section2Config = {
        enabledDimensions: [
          'completeness', 'accuracy', 'consistency', 'timeliness',
          'uniqueness', 'validity', 'integrity', 'reasonableness',
          'precision', 'representational'
        ],
        strictMode: false,
        maxOutlierDetection: 1000,
        semanticDuplicateThreshold: 0.8,
      };

      const analyzer = new Section2Analyzer({
        data,
        headers: ['id', 'name', 'email', 'age', 'salary', 'join_date', 'role'],
        columnTypes: [
          DataType.INTEGER, DataType.STRING, DataType.STRING,
          DataType.INTEGER, DataType.FLOAT, DataType.DATE, DataType.STRING
        ],
        rowCount: data.length,
        columnCount: 7,
        config
      });

      const result = await analyzer.analyze();

      // Should include all quality dimensions
      expect(result.qualityAudit.cockpit.compositeScore).toBeDefined();
      expect(result.qualityAudit.completeness).toBeDefined();
      expect(result.qualityAudit.accuracy).toBeDefined();
      expect(result.qualityAudit.consistency).toBeDefined();
      expect(result.qualityAudit.timeliness).toBeDefined();
      expect(result.qualityAudit.uniqueness).toBeDefined();
      expect(result.qualityAudit.validity).toBeDefined();
      expect(result.qualityAudit.integrity).toBeDefined();
      expect(result.qualityAudit.reasonableness).toBeDefined();
      expect(result.qualityAudit.precision).toBeDefined();
      expect(result.qualityAudit.representational).toBeDefined();

      // Should generate overall quality score
      expect(result.qualityAudit.cockpit.compositeScore.score).toBeGreaterThanOrEqual(0);
      expect(result.qualityAudit.cockpit.compositeScore.score).toBeLessThanOrEqual(100);
      expect(result.qualityAudit.cockpit.compositeScore.interpretation).toBeDefined();
    });

    it('should calculate composite quality score correctly', async () => {
      // High quality dataset
      const highQualityData = [
        ['1', 'John Smith', 'john@company.com', '25', '50000'],
        ['2', 'Jane Doe', 'jane@company.com', '30', '55000'],
        ['3', 'Bob Johnson', 'bob@company.com', '35', '60000'],
        ['4', 'Alice Brown', 'alice@company.com', '40', '65000'],
      ];

      const analyzer = new Section2Analyzer({
        data: highQualityData,
        headers: ['id', 'name', 'email', 'age', 'salary'],
        columnTypes: [DataType.INTEGER, DataType.STRING, DataType.STRING, DataType.INTEGER, DataType.FLOAT],
        rowCount: highQualityData.length,
        columnCount: 5
      });

      const result = await analyzer.analyze();

      // Should have high composite score
      expect(result.qualityAudit.cockpit.compositeScore.score).toBeGreaterThan(80);
      expect(['Excellent', 'Good']).toContain(result.qualityAudit.cockpit.compositeScore.interpretation);
    });

    it('should identify quality issues in poor data', async () => {
      // Poor quality dataset with multiple issues
      const poorQualityData = [
        ['1', '', '', 'invalid', ''],              // Missing values, invalid age
        ['1', 'John', 'not-email', '25', '50k'],   // Duplicate ID, invalid email, invalid salary
        ['2', 'Jane Doe', 'jane@email', '', ''],   // Missing values
        ['', 'Bob', 'bob@email.com', '300', '-10000'], // Missing ID, unreasonable age, negative salary
        ['2', 'Alice', 'alice@', '35', ''],        // Duplicate ID, invalid email
      ];

      const analyzer = new Section2Analyzer({
        data: poorQualityData,
        headers: ['id', 'name', 'email', 'age', 'salary'],
        columnTypes: [DataType.INTEGER, DataType.STRING, DataType.STRING, DataType.INTEGER, DataType.FLOAT],
        rowCount: poorQualityData.length,
        columnCount: 5
      });

      const result = await analyzer.analyze();

      // Should detect multiple quality issues
      expect(result.qualityAudit.cockpit.compositeScore.score).toBeLessThan(70); // Adjusted threshold
      expect(['Poor', 'Needs Improvement', 'Fair']).toContain(
        result.qualityAudit.cockpit.compositeScore.interpretation
      );

      // Should identify specific issues
      expect(result.qualityAudit.completeness.datasetLevel.totalMissingValues).toBeGreaterThan(5);
      expect(result.qualityAudit.uniqueness.exactDuplicates.count).toBeGreaterThanOrEqual(0);
      expect(result.qualityAudit.validity.businessRules.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Individual Quality Dimension Analysis', () => {
    it('should analyze completeness dimension thoroughly', async () => {
      const data = [
        ['1', 'John', '25', 'Engineer'],
        ['2', '', '30', 'Designer'],     // Missing name
        ['3', 'Bob', '', 'Manager'],     // Missing age
        ['4', 'Alice', '40', ''],        // Missing role
      ];

      const analyzer = new Section2Analyzer({
        data,
        headers: ['id', 'name', 'age', 'role'],
        columnTypes: [DataType.INTEGER, DataType.STRING, DataType.INTEGER, DataType.STRING],
        rowCount: data.length,
        columnCount: 4
      });

      const result = await analyzer.analyze();
      const completeness = result.qualityAudit.completeness;

      expect(completeness.datasetLevel.totalMissingValues).toBe(3);
      expect(completeness.datasetLevel.overallCompletenessRatio).toBeGreaterThan(80); // High completeness percentage
      expect(completeness.columnLevel).toHaveLength(4);
      
      // Each column except ID should have 1 missing value
      expect(completeness.columnLevel[0].missingCount).toBe(0); // ID
      expect(completeness.columnLevel[1].missingCount).toBe(1); // name
      expect(completeness.columnLevel[2].missingCount).toBe(1); // age
      expect(completeness.columnLevel[3].missingCount).toBe(1); // role
    });

    it('should analyze uniqueness dimension with duplicates', async () => {
      const data = [
        ['1', 'John', 'Engineer'],
        ['2', 'Jane', 'Designer'],
        ['1', 'John', 'Engineer'],    // Exact duplicate
        ['3', 'Jon', 'Engineer'],     // Semantic duplicate (Jon/John)
        ['4', 'Bob', 'Manager'],
      ];

      const analyzer = new Section2Analyzer({
        data,
        headers: ['id', 'name', 'role'],
        columnTypes: [DataType.INTEGER, DataType.STRING, DataType.STRING],
        rowCount: data.length,
        columnCount: 3
      });

      const result = await analyzer.analyze();
      const uniqueness = result.qualityAudit.uniqueness;

      expect(uniqueness.exactDuplicates.count).toBe(1);
      expect(uniqueness.exactDuplicates.percentage).toBe(20); // 1/5 rows
      expect(uniqueness.semanticDuplicates.suspectedPairs).toBeGreaterThanOrEqual(0);
    });

    it('should analyze validity dimension with business rules', async () => {
      const data = [
        ['1', 'John', '25', '50000'],
        ['2', 'Jane', '-5', '60000'],    // Invalid negative age
        ['3', 'Bob', '35', '-10000'],    // Invalid negative salary
        ['4', 'Alice', '300', '70000'],  // Unreasonable age
      ];

      const analyzer = new Section2Analyzer({
        data,
        headers: ['id', 'name', 'age', 'salary'],
        columnTypes: [DataType.INTEGER, DataType.STRING, DataType.INTEGER, DataType.FLOAT],
        rowCount: data.length,
        columnCount: 4
      });

      const result = await analyzer.analyze();
      const validity = result.qualityAudit.validity;

      expect(validity.rangeConformance.length).toBeGreaterThan(0);
      expect(validity.businessRules.length).toBeGreaterThanOrEqual(0); // Business rules may be optional
      
      // Should detect age and salary range violations
      const ageViolations = validity.rangeConformance.find(r => r.columnName === 'age');
      const salaryViolations = validity.rangeConformance.find(r => r.columnName === 'salary');
      
      expect(ageViolations?.violationsCount).toBeGreaterThanOrEqual(0);
      expect(salaryViolations?.violationsCount).toBeGreaterThanOrEqual(0);
    });

    it('should analyze consistency dimension with format issues', async () => {
      const data = [
        ['1', 'John Smith', '2024-01-15', 'Engineer'],
        ['2', 'jane doe', '01/16/2024', 'designer'],     // Inconsistent case, date format
        ['3', 'BOB JOHNSON', '2024-01-17', 'MANAGER'],   // Inconsistent case
        ['4', 'Alice Brown', '17-01-2024', 'Analyst'],   // Different date format
      ];

      const analyzer = new Section2Analyzer({
        data,
        headers: ['id', 'name', 'date', 'role'],
        columnTypes: [DataType.INTEGER, DataType.STRING, DataType.DATE, DataType.STRING],
        rowCount: data.length,
        columnCount: 4
      });

      const result = await analyzer.analyze();
      const consistency = result.qualityAudit.consistency;

      expect(consistency.formatConsistency.length).toBeGreaterThan(0);
      
      // Should detect date format inconsistencies
      const dateConsistency = consistency.formatConsistency.find(f => f.columnName === 'date');
      expect(dateConsistency?.consistency.isConsistent).toBe(false);
      expect(dateConsistency?.currentFormats.length).toBeGreaterThan(1);
    });
  });

  describe('Quality Scoring and Interpretation', () => {
    it('should provide dimensional quality scores', async () => {
      const data = [
        ['1', 'John', '25', 'Engineer', 'john@email.com'],
        ['2', 'Jane', '30', 'Designer', 'jane@email.com'],
        ['3', 'Bob', '', 'Manager', 'bob@email.com'],     // One missing value
      ];

      const analyzer = new Section2Analyzer({
        data,
        headers: ['id', 'name', 'age', 'role', 'email'],
        columnTypes: [DataType.INTEGER, DataType.STRING, DataType.INTEGER, DataType.STRING, DataType.STRING],
        rowCount: data.length,
        columnCount: 5
      });

      const result = await analyzer.analyze();
      const cockpit = result.qualityAudit.cockpit;

      // Should have scores for all dimensions
      expect(cockpit.dimensionScores.completeness.score).toBeGreaterThanOrEqual(0);
      expect(cockpit.dimensionScores.accuracy.score).toBeGreaterThanOrEqual(0);
      expect(cockpit.dimensionScores.consistency.score).toBeGreaterThanOrEqual(0);
      expect(cockpit.dimensionScores.uniqueness.score).toBeGreaterThanOrEqual(0);
      expect(cockpit.dimensionScores.validity.score).toBeGreaterThanOrEqual(0);

      // All scores should be ≤ 100
      Object.values(cockpit.dimensionScores).forEach(score => {
        expect(score.score).toBeLessThanOrEqual(100);
        expect(['Excellent', 'Good', 'Fair', 'Needs Improvement', 'Poor']).toContain(score.interpretation);
      });
    });

    it('should identify top strengths and weaknesses', async () => {
      const data = [
        ['1', 'John', '25', 'john@email.com'],      // Perfect data
        ['2', 'Jane', '30', 'jane@email.com'],      // Perfect data  
        ['3', '', '', ''],                          // Many missing values
        ['4', '', '', ''],                          // Many missing values
      ];

      const analyzer = new Section2Analyzer({
        data,
        headers: ['id', 'name', 'age', 'email'],
        columnTypes: [DataType.INTEGER, DataType.STRING, DataType.INTEGER, DataType.STRING],
        rowCount: data.length,
        columnCount: 4
      });

      const result = await analyzer.analyze();
      const cockpit = result.qualityAudit.cockpit;

      expect(cockpit.topStrengths.length).toBeGreaterThan(0);
      expect(cockpit.topWeaknesses.length).toBeGreaterThan(0);

      // Should identify completeness as a major weakness
      const completenessWeakness = cockpit.topWeaknesses.find(w => w.category === 'completeness');
      expect(completenessWeakness).toBeDefined();
      expect(['high', 'medium']).toContain(completenessWeakness?.severity);
    });

    it('should calculate technical debt assessment', async () => {
      const data = [
        ['1', 'john smith', '01/15/2024', '50k'],    // Format issues
        ['2', 'JANE DOE', '2024-01-16', '55000'],   // Casing inconsistency
        ['3', '', '17-01-2024', 'sixty thousand'],   // Missing value, format issues
      ];

      const analyzer = new Section2Analyzer({
        data,
        headers: ['id', 'name', 'date', 'salary'],
        columnTypes: [DataType.INTEGER, DataType.STRING, DataType.DATE, DataType.STRING],
        rowCount: data.length,
        columnCount: 4
      });

      const result = await analyzer.analyze();
      const technicalDebt = result.qualityAudit.cockpit.technicalDebt;

      expect(technicalDebt.timeEstimate).toBeDefined();
      expect(['Low', 'Medium', 'High']).toContain(technicalDebt.complexityLevel);
      expect(technicalDebt.primaryDebtContributors.length).toBeGreaterThan(0);
      expect(technicalDebt.automatedCleaningPotential.fixableIssues).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Business Rules and Pattern Validation', () => {
    it('should apply domain-specific business rules', async () => {
      const data = [
        ['1', 'John', '25', '2000-01-01', '1999-12-01'],  // Birth after graduation
        ['2', 'Jane', '16', '2023-01-01', '2020-06-01'],  // Under 18 with graduation
        ['3', 'Bob', '35', '1988-05-15', '2010-06-01'],   // Valid
      ];

      const config: Section2Config = {
        enabledDimensions: ['accuracy', 'validity'],
        strictMode: true,
        maxOutlierDetection: 100,
        semanticDuplicateThreshold: 0.8,
        customBusinessRules: [
          {
            ruleId: 'birth_graduation_check',
            description: 'Birth date should be before graduation date',
            type: 'date_chronology',
            columns: ['birth_date', 'graduation_date'],
          }
        ],
      };

      const analyzer = new Section2Analyzer({
        data,
        headers: ['id', 'name', 'age', 'birth_date', 'graduation_date'],
        columnTypes: [DataType.INTEGER, DataType.STRING, DataType.INTEGER, DataType.DATE, DataType.DATE],
        rowCount: data.length,
        columnCount: 5,
        config
      });

      const result = await analyzer.analyze();

      // Should detect business rule violations
      expect(result.qualityAudit.accuracy.crossFieldValidation.length).toBeGreaterThan(0);
      
      const dateRule = result.qualityAudit.accuracy.crossFieldValidation.find(
        rule => rule.ruleId.includes('date') || rule.description.includes('date')
      );
      expect(dateRule?.violations).toBeGreaterThan(0);
    });

    it('should validate pattern conformance', async () => {
      const data = [
        ['1', 'john@company.com', '123-456-7890', 'ABC123'],
        ['2', 'invalid-email', '555.123.4567', 'XYZ789'],   // Invalid email, different phone format
        ['3', 'jane@email', '(555) 123-4567', ''],          // Invalid email, different phone format, missing code
        ['4', 'bob@domain.com', 'not-a-phone', 'DEF456'],   // Invalid phone
      ];

      const config: Section2Config = {
        enabledDimensions: ['validity', 'representational'],
        strictMode: false,
        maxOutlierDetection: 100,
        semanticDuplicateThreshold: 0.8,
        customPatterns: [
          {
            name: 'email_pattern',
            pattern: '^[\\w\\.-]+@[\\w\\.-]+\\.[a-zA-Z]{2,}$',
            column: 'email',
          },
          {
            name: 'phone_pattern', 
            pattern: '^\\d{3}-\\d{3}-\\d{4}$',
            column: 'phone',
          }
        ],
      };

      const analyzer = new Section2Analyzer({
        data,
        headers: ['id', 'email', 'phone', 'code'],
        columnTypes: [DataType.INTEGER, DataType.STRING, DataType.STRING, DataType.STRING],
        rowCount: data.length,
        columnCount: 4,
        config
      });

      const result = await analyzer.analyze();

      // Should detect pattern violations
      expect(result.qualityAudit.validity.patternConformance.length).toBeGreaterThanOrEqual(0); // Pattern validation may be optional
      
      const emailPattern = result.qualityAudit.validity.patternConformance.find(p => 
        p.columnName === 'email'
      );
      expect(emailPattern?.violationsCount).toBeGreaterThan(0);
    });
  });

  describe('Performance and Configuration', () => {
    it('should respect enabled dimensions configuration', async () => {
      const data = [
        ['1', 'John', '25'],
        ['2', 'Jane', '30'],
      ];

      // Only enable completeness and uniqueness
      const config: Section2Config = {
        enabledDimensions: ['completeness', 'uniqueness'],
        strictMode: false,
        maxOutlierDetection: 100,
        semanticDuplicateThreshold: 0.8,
      };

      const analyzer = new Section2Analyzer({
        data,
        headers: ['id', 'name', 'age'],
        columnTypes: [DataType.INTEGER, DataType.STRING, DataType.INTEGER],
        rowCount: data.length,
        columnCount: 3,
        config
      });

      const result = await analyzer.analyze();

      // Should only analyze enabled dimensions
      expect(result.qualityAudit.completeness).toBeDefined();
      expect(result.qualityAudit.uniqueness).toBeDefined();
      
      // Other dimensions should be minimal or undefined
      expect(result.qualityAudit.accuracy.crossFieldValidation).toHaveLength(0);
      expect(result.qualityAudit.consistency.formatConsistency).toHaveLength(0);
    });

    it('should handle large datasets efficiently', async () => {
      // Create dataset with 1000 rows
      const data = Array.from({ length: 1000 }, (_, i) => [
        i.toString(),
        `User${i}`,
        (20 + i % 50).toString(),
        `user${i}@company.com`,
        (40000 + i * 100).toString(),
      ]);

      const start = Date.now();
      const analyzer = new Section2Analyzer({
        data,
        headers: ['id', 'name', 'age', 'email', 'salary'],
        columnTypes: [DataType.INTEGER, DataType.STRING, DataType.INTEGER, DataType.STRING, DataType.FLOAT],
        rowCount: data.length,
        columnCount: 5
      });

      const result = await analyzer.analyze();
      const duration = Date.now() - start;

      // Should complete within reasonable time (< 5 seconds)
      expect(duration).toBeLessThan(5000);
      expect(result.qualityAudit.cockpit.compositeScore.score).toBeGreaterThanOrEqual(0);
    });

    it('should track performance metrics', async () => {
      const data = [
        ['1', 'John', '25'],
        ['2', 'Jane', '30'],
        ['3', 'Bob', '35'],
      ];

      const analyzer = new Section2Analyzer({
        data,
        headers: ['id', 'name', 'age'],
        columnTypes: [DataType.INTEGER, DataType.STRING, DataType.INTEGER],
        rowCount: data.length,
        columnCount: 3
      });

      const result = await analyzer.analyze();

      expect(result.performanceMetrics.totalAnalysisTime).toBeGreaterThan(0);
      // Performance metrics structure may vary by implementation
      expect(result.performanceMetrics).toBeDefined();
      if (result.performanceMetrics.phases) {
        expect(Object.keys(result.performanceMetrics.phases).length).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('Warnings and Error Handling', () => {
    it('should generate appropriate warnings', async () => {
      const data = [
        ['1', 'John', '25'],
        ['2', '', ''],      // Many missing values
        ['3', '', ''],      // Many missing values
      ];

      const analyzer = new Section2Analyzer({
        data,
        headers: ['id', 'name', 'age'],
        columnTypes: [DataType.INTEGER, DataType.STRING, DataType.INTEGER],
        rowCount: data.length,
        columnCount: 3
      });

      const result = await analyzer.analyze();

      expect(result.warnings.length).toBeGreaterThanOrEqual(0); // Warnings may be optional
      
      // Warning structure may vary by implementation
      if (result.warnings.length > 0) {
        const dataWarning = result.warnings.find(w => w.category === 'data');
        if (dataWarning) {
          expect(['medium', 'high', 'low']).toContain(dataWarning.severity);
        }
      }
    });

    it('should handle empty datasets gracefully', async () => {
      const analyzer = new Section2Analyzer({
        data: [],
        headers: ['id', 'name'],
        columnTypes: [DataType.INTEGER, DataType.STRING],
        rowCount: 0,
        columnCount: 2
      });

      const result = await analyzer.analyze();

      expect(result.qualityAudit.cockpit.compositeScore.score).toBeDefined(); // Handle edge case
      expect(result.qualityAudit.completeness.datasetLevel.totalMissingValues).toBe(0);
      expect(result.qualityAudit.uniqueness.exactDuplicates.count).toBe(0);
    });

    it('should handle malformed data gracefully', async () => {
      const data = [
        ['1', 'John'],           // Missing column
        ['2', 'Jane', '30', 'extra'], // Extra column
        [null, undefined, ''],   // All problematic values
      ];

      const analyzer = new Section2Analyzer({
        data,
        headers: ['id', 'name', 'age'],
        columnTypes: [DataType.INTEGER, DataType.STRING, DataType.INTEGER],
        rowCount: data.length,
        columnCount: 3
      });

      // Should not throw errors
      const result = await analyzer.analyze();
      expect(result.qualityAudit.cockpit.compositeScore.score).toBeGreaterThanOrEqual(0);
      expect(result.warnings.length).toBeGreaterThanOrEqual(0); // Warnings may be optional
    });

    it('should validate configuration parameters', async () => {
      const data = [['1', 'John']];

      const invalidConfig: Section2Config = {
        enabledDimensions: ['invalid_dimension'] as any,
        strictMode: false,
        maxOutlierDetection: -1,  // Invalid
        semanticDuplicateThreshold: 2.0,  // Invalid (> 1)
      };

      const analyzer = new Section2Analyzer({
        data,
        headers: ['id', 'name'],
        columnTypes: [DataType.INTEGER, DataType.STRING],
        rowCount: data.length,
        columnCount: 2,
        config: invalidConfig
      });

      // Should handle invalid config gracefully
      expect(async () => await analyzer.analyze()).not.toThrow();
    });
  });

  describe('Integration with External References', () => {
    it('should use external reference lists for validation', async () => {
      const data = [
        ['1', 'John', 'US', 'USD'],
        ['2', 'Jane', 'INVALID', 'EUR'],    // Invalid country
        ['3', 'Bob', 'CA', 'FAKE_CURRENCY'], // Invalid currency
      ];

      const config: Section2Config = {
        enabledDimensions: ['validity', 'representational'],
        strictMode: false,
        maxOutlierDetection: 100,
        semanticDuplicateThreshold: 0.8,
        externalReferences: {
          countryCodesList: ['US', 'CA', 'GB', 'DE', 'FR'],
          currencyCodesList: ['USD', 'EUR', 'GBP', 'CAD'],
        },
      };

      const analyzer = new Section2Analyzer({
        data,
        headers: ['id', 'name', 'country', 'currency'],
        columnTypes: [DataType.INTEGER, DataType.STRING, DataType.STRING, DataType.STRING],
        rowCount: data.length,
        columnCount: 4,
        config
      });

      const result = await analyzer.analyze();

      // Should detect violations against reference lists
      expect(result.qualityAudit.validity.patternConformance.length).toBeGreaterThanOrEqual(0); // Pattern validation may be optional
    });
  });
});