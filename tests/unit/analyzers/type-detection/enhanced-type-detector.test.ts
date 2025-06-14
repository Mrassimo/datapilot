/**
 * Enhanced Type Detector Tests
 * 
 * Tests the sophisticated data type inference system that powers
 * DataPilot's column analysis and EDA.
 */

import { EnhancedTypeDetector } from '../../../../src/analyzers/streaming/enhanced-type-detector';
import { EdaDataType, SemanticType } from '../../../../src/analyzers/eda/types';

// Helper function to create column samples
function createColumnSample(columnName: string, values: (string | number | null)[], columnIndex = 0) {
  return {
    columnName,
    values,
    columnIndex,
  };
}

describe('EnhancedTypeDetector', () => {
  describe('Numerical Type Detection', () => {
    it('should detect integer columns', () => {
      const sample = createColumnSample('id', [1, 2, 3, 4, 5]);
      const results = EnhancedTypeDetector.detectColumnTypes([sample]);
      
      expect(results[0].dataType).toBe(EdaDataType.NUMERICAL_INTEGER);
      expect(results[0].semanticType).toBe(SemanticType.IDENTIFIER);
      expect(results[0].confidence).toBeGreaterThan(0.8);
      expect(results[0].reasons).toContain('Column name suggests numerical data');
    });

    it('should detect float columns', () => {
      const sample = createColumnSample('score', [85.5, 92.0, 78.3, 96.7, 81.2]);
      const results = EnhancedTypeDetector.detectColumnTypes([sample]);
      
      expect(results[0].dataType).toBe(EdaDataType.NUMERICAL_FLOAT);
      expect(results[0].semanticType).toBe(SemanticType.RATING);
      expect(results[0].confidence).toBeGreaterThan(0.8);
    });

    it('should detect age columns with semantic meaning', () => {
      const sample = createColumnSample('age', [25, 30, 35, 28, 45]);
      const results = EnhancedTypeDetector.detectColumnTypes([sample]);
      
      expect(results[0].dataType).toBe(EdaDataType.NUMERICAL_INTEGER);
      expect(results[0].semanticType).toBe(SemanticType.AGE);
      expect(results[0].confidence).toBeGreaterThan(0.8);
    });

    it('should handle mixed string numbers', () => {
      const sample = createColumnSample('count', ['10', '20', '30', '40']);
      const results = EnhancedTypeDetector.detectColumnTypes([sample]);
      
      expect(results[0].dataType).toBe(EdaDataType.NUMERICAL_INTEGER);
      expect(results[0].confidence).toBeGreaterThan(0.7);
    });

    it('should avoid misclassifying percentage in column name', () => {
      const sample = createColumnSample('attendance_percentage', [85.5, 92.0, 78.3]);
      const results = EnhancedTypeDetector.detectColumnTypes([sample]);
      
      // Should detect as numerical but with percentage semantic type
      expect(results[0].dataType).toBe(EdaDataType.NUMERICAL_FLOAT);
      expect(results[0].semanticType).toBe(SemanticType.PERCENTAGE);
    });

    it('should handle edge case with damage_assessment', () => {
      const sample = createColumnSample('damage_assessment', [1.5, 2.3, 0.8, 3.1]);
      const results = EnhancedTypeDetector.detectColumnTypes([sample]);
      
      expect(results[0].dataType).toBe(EdaDataType.NUMERICAL_FLOAT);
      // Should NOT be classified as age despite containing "age"
      expect(results[0].semanticType).not.toBe(SemanticType.AGE);
    });
  });

  describe('Boolean Type Detection', () => {
    it('should detect true/false boolean columns', () => {
      const sample = createColumnSample('is_active', ['true', 'false', 'true', 'false']);
      const results = EnhancedTypeDetector.detectColumnTypes([sample]);
      
      expect(results[0].dataType).toBe(EdaDataType.BOOLEAN);
      expect(results[0].semanticType).toBe(SemanticType.STATUS);
      expect(results[0].confidence).toBeGreaterThan(0.8);
    });

    it('should detect yes/no boolean columns', () => {
      const sample = createColumnSample('approved', ['yes', 'no', 'yes', 'no', 'yes']);
      const results = EnhancedTypeDetector.detectColumnTypes([sample]);
      
      expect(results[0].dataType).toBe(EdaDataType.BOOLEAN);
      expect(results[0].confidence).toBeGreaterThan(0.8);
    });

    it('should detect 1/0 boolean columns', () => {
      const sample = createColumnSample('flag', ['1', '0', '1', '0']);
      const results = EnhancedTypeDetector.detectColumnTypes([sample]);
      
      expect(results[0].dataType).toBe(EdaDataType.BOOLEAN);
      expect(results[0].confidence).toBeGreaterThan(0.8);
    });

    it('should detect active/inactive pattern', () => {
      const sample = createColumnSample('status', ['active', 'inactive', 'active', 'active']);
      const results = EnhancedTypeDetector.detectColumnTypes([sample]);
      
      expect(results[0].dataType).toBe(EdaDataType.BOOLEAN);
      expect(results[0].confidence).toBeGreaterThan(0.8);
    });
  });

  describe('Date/Time Type Detection', () => {
    it('should detect ISO date format', () => {
      const sample = createColumnSample('created_date', [
        '2024-01-15', '2024-01-16', '2024-01-17', '2024-01-18'
      ]);
      const results = EnhancedTypeDetector.detectColumnTypes([sample]);
      
      expect(results[0].dataType).toBe(EdaDataType.DATE_TIME);
      expect(results[0].confidence).toBeGreaterThan(0.8);
      expect(results[0].reasons).toContain('Column name suggests datetime');
    });

    it('should detect US date format', () => {
      const sample = createColumnSample('birth_date', [
        '01/15/2024', '01/16/2024', '01/17/2024'
      ]);
      const results = EnhancedTypeDetector.detectColumnTypes([sample]);
      
      expect(results[0].dataType).toBe(EdaDataType.DATE_TIME);
      expect(results[0].confidence).toBeGreaterThan(0.8);
    });

    it('should detect ISO datetime format', () => {
      const sample = createColumnSample('timestamp', [
        '2024-01-15T10:30:00', '2024-01-15T11:45:00', '2024-01-15T12:00:00'
      ]);
      const results = EnhancedTypeDetector.detectColumnTypes([sample]);
      
      expect(results[0].dataType).toBe(EdaDataType.DATE_TIME);
      expect(results[0].confidence).toBeGreaterThan(0.8);
    });

    it('should avoid misclassifying gender as date', () => {
      const sample = createColumnSample('gender', ['male', 'female', 'male', 'female']);
      const results = EnhancedTypeDetector.detectColumnTypes([sample]);
      
      // Should NOT be detected as date
      expect(results[0].dataType).not.toBe(EdaDataType.DATE_TIME);
      expect(results[0].dataType).toBe(EdaDataType.CATEGORICAL);
    });

    it('should avoid misclassifying numeric columns as dates', () => {
      const sample = createColumnSample('blood_pressure', [120, 130, 125, 140]);
      const results = EnhancedTypeDetector.detectColumnTypes([sample]);
      
      // Should be detected as numerical, not date
      expect(results[0].dataType).toBe(EdaDataType.NUMERICAL_INTEGER);
      expect(results[0].dataType).not.toBe(EdaDataType.DATE_TIME);
    });

    it('should require name hints for ambiguous dates', () => {
      // Pure numbers that could be dates but column name doesn't suggest it
      const sample = createColumnSample('value', ['20240115', '20240116', '20240117']);
      const results = EnhancedTypeDetector.detectColumnTypes([sample]);
      
      // Without date-suggestive name, should prefer numerical interpretation
      expect(results[0].dataType).toBe(EdaDataType.NUMERICAL_INTEGER);
    });
  });

  describe('Categorical Type Detection', () => {
    it('should detect gender categories', () => {
      const sample = createColumnSample('gender', ['male', 'female', 'male', 'female', 'male']);
      const results = EnhancedTypeDetector.detectColumnTypes([sample]);
      
      expect(results[0].dataType).toBe(EdaDataType.CATEGORICAL);
      expect(results[0].semanticType).toBe(SemanticType.DEMOGRAPHIC);
      expect(results[0].confidence).toBeGreaterThan(0.95);
    });

    it('should detect department categories', () => {
      const sample = createColumnSample('department', [
        'Engineering', 'Sales', 'Marketing', 'Engineering', 'Sales'
      ]);
      const results = EnhancedTypeDetector.detectColumnTypes([sample]);
      
      expect(results[0].dataType).toBe(EdaDataType.CATEGORICAL);
      expect(results[0].semanticType).toBe(SemanticType.ORGANIZATIONAL_UNIT);
      expect(results[0].confidence).toBeGreaterThan(0.7);
    });

    it('should detect status categories', () => {
      const sample = createColumnSample('order_status', [
        'pending', 'shipped', 'delivered', 'pending', 'shipped'
      ]);
      const results = EnhancedTypeDetector.detectColumnTypes([sample]);
      
      expect(results[0].dataType).toBe(EdaDataType.CATEGORICAL);
      expect(results[0].semanticType).toBe(SemanticType.STATUS);
      expect(results[0].confidence).toBeGreaterThan(0.7);
    });

    it('should handle low cardinality text', () => {
      const sample = createColumnSample('grade', ['A', 'B', 'C', 'A', 'B', 'A', 'C']);
      const results = EnhancedTypeDetector.detectColumnTypes([sample]);
      
      expect(results[0].dataType).toBe(EdaDataType.CATEGORICAL);
      expect(results[0].confidence).toBeGreaterThan(0.5);
    });

    it('should require reasonable cardinality', () => {
      const sample = createColumnSample('name', [
        'John', 'Jane', 'Bob', 'Alice', 'Charlie', 'Diana', 'Eve'
      ]);
      const results = EnhancedTypeDetector.detectColumnTypes([sample]);
      
      // High cardinality names should not be categorical
      expect(results[0].dataType).toBe(EdaDataType.TEXT_GENERAL);
    });
  });

  describe('Specialized Type Detection', () => {
    it('should detect email addresses', () => {
      const sample = createColumnSample('email', [
        'john@example.com', 'jane@test.org', 'bob@company.co.uk'
      ]);
      const results = EnhancedTypeDetector.detectColumnTypes([sample]);
      
      expect(results[0].dataType).toBe(EdaDataType.TEXT_ADDRESS);
      expect(results[0].semanticType).toBe(SemanticType.IDENTIFIER);
      expect(results[0].confidence).toBeGreaterThan(0.9);
    });

    it('should detect URLs', () => {
      const sample = createColumnSample('website', [
        'https://example.com', 'http://test.org', 'https://company.co.uk'
      ]);
      const results = EnhancedTypeDetector.detectColumnTypes([sample]);
      
      expect(results[0].dataType).toBe(EdaDataType.TEXT_ADDRESS);
      expect(results[0].semanticType).toBe(SemanticType.IDENTIFIER);
      expect(results[0].confidence).toBeGreaterThan(0.8);
    });

    it('should detect currency values', () => {
      const sample = createColumnSample('price', [
        '$29.99', '$15.50', '$142.00', '$8.75'
      ]);
      const results = EnhancedTypeDetector.detectColumnTypes([sample]);
      
      expect(results[0].dataType).toBe(EdaDataType.NUMERICAL_FLOAT);
      expect(results[0].semanticType).toBe(SemanticType.CURRENCY);
      expect(results[0].confidence).toBeGreaterThan(0.8);
    });

    it('should detect percentage values', () => {
      const sample = createColumnSample('completion_rate', [
        '85.5%', '92.0%', '78.3%', '96.7%'
      ]);
      const results = EnhancedTypeDetector.detectColumnTypes([sample]);
      
      expect(results[0].dataType).toBe(EdaDataType.NUMERICAL_FLOAT);
      expect(results[0].semanticType).toBe(SemanticType.PERCENTAGE);
      expect(results[0].confidence).toBeGreaterThan(0.8);
    });

    it('should detect international currency formats', () => {
      const sample = createColumnSample('amount', [
        '1234.56 EUR', '567.89 USD', '890.12 GBP'
      ]);
      const results = EnhancedTypeDetector.detectColumnTypes([sample]);
      
      expect(results[0].dataType).toBe(EdaDataType.NUMERICAL_FLOAT);
      expect(results[0].semanticType).toBe(SemanticType.CURRENCY);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty columns', () => {
      const sample = createColumnSample('empty_col', []);
      const results = EnhancedTypeDetector.detectColumnTypes([sample]);
      
      expect(results[0].dataType).toBe(EdaDataType.TEXT_GENERAL);
      expect(results[0].semanticType).toBe(SemanticType.UNKNOWN);
      expect(results[0].confidence).toBe(0);
      expect(results[0].reasons).toContain('No valid values found');
    });

    it('should handle null and undefined values', () => {
      const sample = createColumnSample('mixed', [1, null, 3, undefined, 5, '']);
      const results = EnhancedTypeDetector.detectColumnTypes([sample]);
      
      expect(results[0].dataType).toBe(EdaDataType.NUMERICAL_INTEGER);
      expect(results[0].confidence).toBeGreaterThan(0.7);
    });

    it('should handle mixed types gracefully', () => {
      const sample = createColumnSample('mixed', ['text', 123, 'more text', 456]);
      const results = EnhancedTypeDetector.detectColumnTypes([sample]);
      
      // Should fall back to text since it's mixed
      expect(results[0].dataType).toBe(EdaDataType.TEXT_GENERAL);
      expect(results[0].confidence).toBeLessThan(0.8);
    });

    it('should prioritize column name hints', () => {
      // Values could be interpreted as dates, but column name suggests numerical
      const sample = createColumnSample('blood_sugar_level', [120, 130, 125, 140]);
      const results = EnhancedTypeDetector.detectColumnTypes([sample]);
      
      expect(results[0].dataType).toBe(EdaDataType.NUMERICAL_INTEGER);
      expect(results[0].confidence).toBeGreaterThan(0.8);
    });

    it('should handle very long text fields', () => {
      const longText = 'This is a very long description that contains multiple sentences and would clearly indicate that this is a text field rather than any other data type.';
      const sample = createColumnSample('description', [longText, longText, longText]);
      const results = EnhancedTypeDetector.detectColumnTypes([sample]);
      
      expect(results[0].dataType).toBe(EdaDataType.TEXT_GENERAL);
      expect(results[0].semanticType).toBe(SemanticType.UNKNOWN);
    });

    it('should handle single value columns', () => {
      const sample = createColumnSample('singleton', [42]);
      const results = EnhancedTypeDetector.detectColumnTypes([sample]);
      
      expect(results[0].dataType).toBe(EdaDataType.NUMERICAL_INTEGER);
      expect(results[0].confidence).toBeGreaterThan(0.5);
    });
  });

  describe('Multiple Column Detection', () => {
    it('should detect types for multiple columns simultaneously', () => {
      const samples = [
        createColumnSample('id', [1, 2, 3], 0),
        createColumnSample('name', ['John', 'Jane', 'Bob'], 1),
        createColumnSample('email', ['john@test.com', 'jane@test.com', 'bob@test.com'], 2),
        createColumnSample('active', ['true', 'false', 'true'], 3),
      ];
      
      const results = EnhancedTypeDetector.detectColumnTypes(samples);
      
      expect(results).toHaveLength(4);
      expect(results[0].dataType).toBe(EdaDataType.NUMERICAL_INTEGER);
      expect(results[1].dataType).toBe(EdaDataType.TEXT_GENERAL);
      expect(results[2].dataType).toBe(EdaDataType.TEXT_ADDRESS);
      expect(results[3].dataType).toBe(EdaDataType.BOOLEAN);
    });

    it('should maintain high confidence for clear types', () => {
      const samples = [
        createColumnSample('user_id', [1, 2, 3, 4, 5]),
        createColumnSample('gender', ['male', 'female', 'male', 'female']),
        createColumnSample('score', [85.5, 92.0, 78.3, 96.7]),
      ];
      
      const results = EnhancedTypeDetector.detectColumnTypes(samples);
      
      results.forEach(result => {
        expect(result.confidence).toBeGreaterThan(0.8);
      });
    });
  });

  describe('Confidence Scoring', () => {
    it('should assign higher confidence with name hints', () => {
      const sampleWithHint = createColumnSample('user_age', [25, 30, 35]);
      const sampleWithoutHint = createColumnSample('col1', [25, 30, 35]);
      
      const resultsWithHint = EnhancedTypeDetector.detectColumnTypes([sampleWithHint]);
      const resultsWithoutHint = EnhancedTypeDetector.detectColumnTypes([sampleWithoutHint]);
      
      expect(resultsWithHint[0].confidence).toBeGreaterThan(resultsWithoutHint[0].confidence);
    });

    it('should assign higher confidence for cleaner data', () => {
      const cleanSample = createColumnSample('score', [85, 90, 95, 100, 75]);
      const messySample = createColumnSample('score', [85, '90', null, 95, '', 75]);
      
      const cleanResults = EnhancedTypeDetector.detectColumnTypes([cleanSample]);
      const messyResults = EnhancedTypeDetector.detectColumnTypes([messySample]);
      
      expect(cleanResults[0].confidence).toBeGreaterThan(messyResults[0].confidence);
    });

    it('should provide detailed reasoning', () => {
      const sample = createColumnSample('user_email', [
        'test@example.com', 'user@test.org', 'admin@company.com'
      ]);
      const results = EnhancedTypeDetector.detectColumnTypes([sample]);
      
      expect(results[0].reasons).toContain('Column name suggests email');
      expect(results[0].reasons.some(r => r.includes('% of values match email pattern'))).toBe(true);
    });
  });

  describe('Performance', () => {
    it('should handle large datasets efficiently', () => {
      const largeValues = Array.from({length: 1000}, (_, i) => i + 1);
      const sample = createColumnSample('big_id_column', largeValues);
      
      const start = Date.now();
      const results = EnhancedTypeDetector.detectColumnTypes([sample]);
      const duration = Date.now() - start;
      
      expect(results[0].dataType).toBe(EdaDataType.NUMERICAL_INTEGER);
      expect(duration).toBeLessThan(100); // Should be fast even for large datasets
    });

    it('should sample large datasets for efficiency', () => {
      // Create dataset with 200 values but some bad ones at the end
      const values = Array.from({length: 95}, (_, i) => i + 1);
      values.push(...Array.from({length: 105}, () => 'text')); // Add text at end
      
      const sample = createColumnSample('test_col', values);
      const results = EnhancedTypeDetector.detectColumnTypes([sample]);
      
      // Should detect as numerical since it samples first 100 values
      expect(results[0].dataType).toBe(EdaDataType.NUMERICAL_INTEGER);
    });
  });
});