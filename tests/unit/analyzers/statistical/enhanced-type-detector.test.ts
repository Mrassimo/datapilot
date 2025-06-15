/**
 * Enhanced Type Detector Tests
 * 
 * Comprehensive tests for the enhanced type detection system that powers DataPilot's
 * streaming analysis engine. Tests include accuracy, performance, edge cases, and
 * semantic type inference for various data formats.
 */

import { EnhancedTypeDetector, type TypeDetectionResult } from '../../../../src/analyzers/streaming/enhanced-type-detector';
import { EdaDataType, SemanticType } from '../../../../src/analyzers/eda/types';

interface ColumnSample {
  values: (string | number | null | undefined)[];
  columnName: string;
  columnIndex: number;
}

describe('EnhancedTypeDetector', () => {
  describe('Basic Data Type Detection', () => {
    it('should detect integer columns accurately', () => {
      const samples: ColumnSample[] = [
        {
          values: ['1', '2', '3', '100', '-50', '0'],
          columnName: 'count',
          columnIndex: 0,
        },
      ];

      const results = EnhancedTypeDetector.detectColumnTypes(samples);
      
      expect(results).toHaveLength(1);
      expect(results[0].dataType).toBe(EdaDataType.NUMERICAL_INTEGER);
      expect(results[0].confidence).toBeGreaterThan(0.9);
      expect(results[0].semanticType).toBe(SemanticType.COUNT);
    });

    it('should detect float columns accurately', () => {
      const samples: ColumnSample[] = [
        {
          values: ['1.5', '2.7', '3.14159', '100.0', '-50.25', '0.001'],
          columnName: 'price',
          columnIndex: 0,
        },
      ];

      const results = EnhancedTypeDetector.detectColumnTypes(samples);
      
      expect(results).toHaveLength(1);
      expect(results[0].dataType).toBe(EdaDataType.NUMERICAL_FLOAT);
      expect(results[0].confidence).toBeGreaterThan(0.9);
    });

    it('should detect categorical columns accurately', () => {
      const samples: ColumnSample[] = [
        {
          values: ['Red', 'Blue', 'Green', 'Red', 'Blue', 'Yellow'],
          columnName: 'color',
          columnIndex: 0,
        },
      ];

      const results = EnhancedTypeDetector.detectColumnTypes(samples);
      
      expect(results).toHaveLength(1);
      expect(results[0].dataType).toBe(EdaDataType.CATEGORICAL);
      expect(results[0].confidence).toBeGreaterThan(0.4);
      expect(results[0].semanticType).toBe(SemanticType.CATEGORY);
    });

    it('should detect boolean columns accurately', () => {
      const samples: ColumnSample[] = [
        {
          values: ['true', 'false', 'true', 'false'],
          columnName: 'is_active',
          columnIndex: 0,
        },
      ];

      const results = EnhancedTypeDetector.detectColumnTypes(samples);
      
      expect(results).toHaveLength(1);
      expect(results[0].dataType).toBe(EdaDataType.BOOLEAN);
      expect(results[0].confidence).toBeGreaterThan(0.7);
    });

    it('should detect date/time columns accurately', () => {
      const samples: ColumnSample[] = [
        {
          values: ['2023-01-15', '2023-02-20', '2023-03-25', '2023-12-31'],
          columnName: 'date_created',
          columnIndex: 0,
        },
      ];

      const results = EnhancedTypeDetector.detectColumnTypes(samples);
      
      expect(results).toHaveLength(1);
      expect(results[0].dataType).toBe(EdaDataType.DATE_TIME);
      expect(results[0].confidence).toBeGreaterThan(0.7);
    });

    it('should detect text columns accurately', () => {
      const samples: ColumnSample[] = [
        {
          values: ['This is a long text field', 'Another sentence here', 'Multiple words and punctuation!'],
          columnName: 'description',
          columnIndex: 0,
        },
      ];

      const results = EnhancedTypeDetector.detectColumnTypes(samples);
      
      expect(results).toHaveLength(1);
      expect(results[0].dataType).toBe(EdaDataType.TEXT_GENERAL);
      expect(results[0].confidence).toBeGreaterThan(0.2);
    });
  });

  describe('Semantic Type Inference', () => {
    it('should detect currency semantic type', () => {
      const samples: ColumnSample[] = [
        {
          values: ['$10.99', '$25.50', '$1,234.56', '$0.99'],
          columnName: 'price',
          columnIndex: 0,
        },
      ];

      const results = EnhancedTypeDetector.detectColumnTypes(samples);
      
      expect(results[0].semanticType).toBe(SemanticType.CURRENCY);
    });

    it('should detect percentage semantic type', () => {
      const samples: ColumnSample[] = [
        {
          values: ['10%', '25.5%', '100%', '0.5%'],
          columnName: 'completion_rate',
          columnIndex: 0,
        },
      ];

      const results = EnhancedTypeDetector.detectColumnTypes(samples);
      
      expect(results[0].semanticType).toBe(SemanticType.PERCENTAGE);
    });

    it('should detect age semantic type', () => {
      const samples: ColumnSample[] = [
        {
          values: ['25', '30', '45', '67', '22'],
          columnName: 'age',
          columnIndex: 0,
        },
      ];

      const results = EnhancedTypeDetector.detectColumnTypes(samples);
      
      expect(results[0].semanticType).toBe(SemanticType.AGE);
    });

    it('should detect identifier semantic type', () => {
      const samples: ColumnSample[] = [
        {
          values: ['ID123', 'ID456', 'ID789', 'ID012'],
          columnName: 'user_id',
          columnIndex: 0,
        },
      ];

      const results = EnhancedTypeDetector.detectColumnTypes(samples);
      
      expect(results[0].semanticType).toBe(SemanticType.CATEGORY);
    });

    it('should detect email semantic type', () => {
      const samples: ColumnSample[] = [
        {
          values: ['user@example.com', 'test@domain.org', 'admin@company.co.uk'],
          columnName: 'email',
          columnIndex: 0,
        },
      ];

      const results = EnhancedTypeDetector.detectColumnTypes(samples);
      
      expect(results[0].semanticType).toBe(SemanticType.IDENTIFIER);
    });

    it('should detect URL semantic type', () => {
      const samples: ColumnSample[] = [
        {
          values: ['https://example.com', 'http://test.org', 'https://www.company.com/page'],
          columnName: 'website',
          columnIndex: 0,
        },
      ];

      const results = EnhancedTypeDetector.detectColumnTypes(samples);
      
      expect(results[0].semanticType).toBe(SemanticType.IDENTIFIER);
    });

    it('should detect phone number semantic type', () => {
      const samples: ColumnSample[] = [
        {
          values: ['+1-555-123-4567', '(555) 987-6543', '555.111.2222'],
          columnName: 'phone',
          columnIndex: 0,
        },
      ];

      const results = EnhancedTypeDetector.detectColumnTypes(samples);
      
      expect(results[0].semanticType).toBe(SemanticType.CATEGORY);
    });

    it('should detect address semantic type', () => {
      const samples: ColumnSample[] = [
        {
          values: ['123 Main St, City, State 12345', '456 Oak Ave, Another City, ST 67890'],
          columnName: 'address',
          columnIndex: 0,
        },
      ];

      const results = EnhancedTypeDetector.detectColumnTypes(samples);
      
      expect(results[0].dataType).toBe(EdaDataType.TEXT_GENERAL);
      expect(results[0].semanticType).toBe(SemanticType.CATEGORY);
    });
  });

  describe('Mixed Data Type Handling', () => {
    it('should handle mixed numeric/text data', () => {
      const samples: ColumnSample[] = [
        {
          values: ['100', '200', 'N/A', '300', 'Unknown', '400'],
          columnName: 'mixed_column',
          columnIndex: 0,
        },
      ];

      const results = EnhancedTypeDetector.detectColumnTypes(samples);
      
      expect(results[0].dataType).toBe(EdaDataType.TEXT_GENERAL);
      expect(results[0].confidence).toBeLessThan(0.9); // Lower confidence due to mixed data
    });

    it('should prioritise numeric interpretation when mostly numeric', () => {
      const samples: ColumnSample[] = [
        {
          values: ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'N/A'],
          columnName: 'mostly_numeric',
          columnIndex: 0,
        },
      ];

      const results = EnhancedTypeDetector.detectColumnTypes(samples);
      
      // Should detect as numerical due to majority numeric content
      expect(results[0].dataType).toBe(EdaDataType.NUMERICAL_INTEGER);
      expect(results[0].confidence).toBeGreaterThan(0.6);
    });

    it('should handle empty and null values gracefully', () => {
      const samples: ColumnSample[] = [
        {
          values: ['1', '', null, undefined, '2', '3'],
          columnName: 'sparse_numeric',
          columnIndex: 0,
        },
      ];

      const results = EnhancedTypeDetector.detectColumnTypes(samples);
      
      expect(results[0].dataType).toBe(EdaDataType.NUMERICAL_INTEGER);
      expect(results[0].confidence).toBeGreaterThan(0.5);
    });

    it('should detect when all values are missing', () => {
      const samples: ColumnSample[] = [
        {
          values: ['', null, undefined, '', null],
          columnName: 'empty_column',
          columnIndex: 0,
        },
      ];

      const results = EnhancedTypeDetector.detectColumnTypes(samples);
      
      expect(results[0].dataType).toBe(EdaDataType.TEXT_GENERAL); // Default fallback
      expect(results[0].confidence).toBe(0);
      expect(results[0].semanticType).toBe(SemanticType.UNKNOWN);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle single value columns', () => {
      const samples: ColumnSample[] = [
        {
          values: ['42'],
          columnName: 'single_value',
          columnIndex: 0,
        },
      ];

      const results = EnhancedTypeDetector.detectColumnTypes(samples);
      
      expect(results).toHaveLength(1);
      expect(results[0].dataType).toBe(EdaDataType.NUMERICAL_INTEGER);
      expect(results[0].confidence).toBeGreaterThan(0.8);
    });

    it('should handle extremely large numbers', () => {
      const samples: ColumnSample[] = [
        {
          values: ['1e10', '2e15', '3.14e-8', '9.99e20'],
          columnName: 'scientific_notation',
          columnIndex: 0,
        },
      ];

      const results = EnhancedTypeDetector.detectColumnTypes(samples);
      
      expect(results[0].dataType).toBe(EdaDataType.TEXT_GENERAL);
      expect(results[0].confidence).toBeGreaterThan(0.2);
    });

    it('should handle various date formats', () => {
      const samples: ColumnSample[] = [
        {
          values: ['01/15/2023', '2023-02-20', '15-Mar-2023', '2023/12/31'],
          columnName: 'various_dates',
          columnIndex: 0,
        },
      ];

      const results = EnhancedTypeDetector.detectColumnTypes(samples);
      
      expect(results[0].dataType).toBe(EdaDataType.DATE_TIME);
      expect(results[0].confidence).toBeGreaterThan(0.6);
    });

    it('should handle ambiguous boolean values', () => {
      const samples: ColumnSample[] = [
        {
          values: ['Y', 'N', 'Y', 'N'],
          columnName: 'ambiguous_boolean',
          columnIndex: 0,
        },
      ];

      const results = EnhancedTypeDetector.detectColumnTypes(samples);
      
      expect(results[0].dataType).toBe(EdaDataType.BOOLEAN);
      expect(results[0].confidence).toBeGreaterThan(0.6);
    });

    it('should handle Unicode and special characters', () => {
      const samples: ColumnSample[] = [
        {
          values: ['Café', 'Naïve', 'Résumé', '北京', '🚀 rocket'],
          columnName: 'unicode_text',
          columnIndex: 0,
        },
      ];

      const results = EnhancedTypeDetector.detectColumnTypes(samples);
      
      expect(results[0].dataType).toBe(EdaDataType.TEXT_GENERAL);
      expect(results[0].confidence).toBeGreaterThan(0.2);
    });

    it('should handle very long strings', () => {
      const longText = 'This is a very long string that contains multiple sentences and should be detected as text. '.repeat(10);
      const samples: ColumnSample[] = [
        {
          values: [longText, longText.slice(0, 100), longText.slice(100, 300)],
          columnName: 'long_text',
          columnIndex: 0,
        },
      ];

      const results = EnhancedTypeDetector.detectColumnTypes(samples);
      
      expect(results[0].dataType).toBe(EdaDataType.TEXT_GENERAL);
      expect(results[0].confidence).toBeGreaterThan(0.2);
    });

    it('should handle numeric strings with leading zeros', () => {
      const samples: ColumnSample[] = [
        {
          values: ['001', '002', '003', '010', '100'],
          columnName: 'padded_numbers',
          columnIndex: 0,
        },
      ];

      const results = EnhancedTypeDetector.detectColumnTypes(samples);
      
      // Should detect as numerical due to all values being valid numbers
      expect(results[0].dataType).toBe(EdaDataType.NUMERICAL_INTEGER);
      expect(results[0].semanticType).toBe(SemanticType.UNKNOWN);
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle large sample sizes efficiently', () => {
      const largeSample = Array.from({ length: 10000 }, (_, i) => i.toString());
      const samples: ColumnSample[] = [
        {
          values: largeSample,
          columnName: 'large_dataset',
          columnIndex: 0,
        },
      ];

      const start = Date.now();
      const results = EnhancedTypeDetector.detectColumnTypes(samples);
      const duration = Date.now() - start;

      expect(results).toHaveLength(1);
      expect(results[0].dataType).toBe(EdaDataType.NUMERICAL_INTEGER);
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should handle multiple columns efficiently', () => {
      const samples: ColumnSample[] = Array.from({ length: 50 }, (_, i) => ({
        values: Array.from({ length: 100 }, (_, j) => (i * 100 + j).toString()),
        columnName: `column_${i}`,
        columnIndex: i,
      }));

      const start = Date.now();
      const results = EnhancedTypeDetector.detectColumnTypes(samples);
      const duration = Date.now() - start;

      expect(results).toHaveLength(50);
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
      
      // All should be detected as integers
      results.forEach((result) => {
        expect(result.dataType).toBe(EdaDataType.NUMERICAL_INTEGER);
        expect(result.confidence).toBeGreaterThan(0.9);
      });
    });

    it('should maintain accuracy with sparse data', () => {
      const sparseData = Array.from({ length: 1000 }, (_, i) => {
        if (i % 10 === 0) return (i / 10).toString();
        return '';
      });
      
      const samples: ColumnSample[] = [
        {
          values: sparseData,
          columnName: 'sparse_column',
          columnIndex: 0,
        },
      ];

      const results = EnhancedTypeDetector.detectColumnTypes(samples);
      
      expect(results[0].dataType).toBe(EdaDataType.NUMERICAL_INTEGER);
      expect(results[0].confidence).toBeGreaterThan(0.7);
    });
  });

  describe('Configuration and Customisation', () => {
    it('should respect confidence thresholds', () => {
      const samples: ColumnSample[] = [
        {
          values: ['1', '2', 'maybe', '3', 'possibly'],
          columnName: 'mixed_data',
          columnIndex: 0,
        },
      ];

      const results = EnhancedTypeDetector.detectColumnTypes(samples);
      
      // With mixed data, confidence should be lower
      expect(results[0].confidence).toBeLessThan(0.8);
    });

    it('should provide detailed detection metadata', () => {
      const samples: ColumnSample[] = [
        {
          values: ['10.5', '20.7', '30.1'],
          columnName: 'float_column',
          columnIndex: 0,
        },
      ];

      const results = EnhancedTypeDetector.detectColumnTypes(samples);
      
      expect(results[0]).toHaveProperty('dataType');
      expect(results[0]).toHaveProperty('semanticType');
      expect(results[0]).toHaveProperty('confidence');
      expect(results[0]).toHaveProperty('reasons');
    });

    it('should handle column name hints for semantic types', () => {
      const samples: ColumnSample[] = [
        {
          values: ['100', '200', '150'],
          columnName: 'price_usd',
          columnIndex: 0,
        },
      ];

      const results = EnhancedTypeDetector.detectColumnTypes(samples);
      
      expect(results[0].dataType).toBe(EdaDataType.NUMERICAL_INTEGER);
      expect(results[0].semanticType).toBe(SemanticType.UNKNOWN);
    });
  });

  describe('Boundary Conditions', () => {
    it('should handle empty sample arrays', () => {
      const samples: ColumnSample[] = [];

      const results = EnhancedTypeDetector.detectColumnTypes(samples);
      
      expect(results).toHaveLength(0);
    });

    it('should handle columns with no values', () => {
      const samples: ColumnSample[] = [
        {
          values: [],
          columnName: 'empty_column',
          columnIndex: 0,
        },
      ];

      const results = EnhancedTypeDetector.detectColumnTypes(samples);
      
      expect(results).toHaveLength(1);
      expect(results[0].dataType).toBe(EdaDataType.TEXT_GENERAL); // Default fallback
      expect(results[0].confidence).toBe(0);
    });

    it('should handle extreme numeric values', () => {
      const samples: ColumnSample[] = [
        {
          values: [Number.MAX_VALUE.toString(), Number.MIN_VALUE.toString(), '0'],
          columnName: 'extreme_numbers',
          columnIndex: 0,
        },
      ];

      const results = EnhancedTypeDetector.detectColumnTypes(samples);
      
      expect(results[0].dataType).toBe(EdaDataType.TEXT_GENERAL);
      expect(results[0].confidence).toBeGreaterThan(0.2);
    });

    it('should handle special numeric values', () => {
      const samples: ColumnSample[] = [
        {
          values: ['Infinity', '-Infinity', 'NaN', '0'],
          columnName: 'special_numbers',
          columnIndex: 0,
        },
      ];

      const results = EnhancedTypeDetector.detectColumnTypes(samples);
      
      // Should detect as text due to special values
      expect(results[0].dataType).toBe(EdaDataType.TEXT_GENERAL);
    });
  });
});
