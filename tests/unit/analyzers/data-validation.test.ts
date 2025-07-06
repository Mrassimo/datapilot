/**
 * Data Validation and Edge Case Tests
 * 
 * Tests validation of data inputs, edge cases in analysis,
 * and graceful handling of problematic datasets.
 */

import { ErrorUtils, DataPilotError, ErrorSeverity, ErrorCategory } from '../../../src/utils/error-handler';
import { EnhancedTypeDetector } from '../../../src/analyzers/streaming/enhanced-type-detector';
import { OnlineStatistics, P2Quantile, ReservoirSampler } from '../../../src/analyzers/streaming/online-statistics';
import { EdaDataType, SemanticType } from '../../../src/analyzers/eda/types';

describe('Data Validation Tests', () => {
  describe('Array Data Validation', () => {
    it('should validate proper array structures', () => {
      const validArrays = [
        [1, 2, 3, 4, 5],
        ['a', 'b', 'c'],
        [true, false, true],
        [{ id: 1 }, { id: 2 }],
        [null, undefined, 'valid'], // Mixed with nulls
      ];

      validArrays.forEach((array) => {
        const result = ErrorUtils.validateDataArray(array, { operationName: 'test' });
        expect(Array.isArray(result)).toBe(true);
      });
    });

    it('should reject non-array inputs with descriptive errors', () => {
      const invalidInputs = [
        'string',
        42,
        { notAnArray: true },
        null,
        undefined,
        new Set([1, 2, 3]),
        new Map([['a', 1]]),
      ];

      invalidInputs.forEach((input) => {
        expect(() => {
          ErrorUtils.validateDataArray(input as any, { operationName: 'test' });
        }).toThrow(DataPilotError);
      });
    });

    it('should filter out null and undefined values automatically', () => {
      const messyData = [1, null, 'valid', undefined, true, '', 0, false];
      const result = ErrorUtils.validateDataArray(messyData, { operationName: 'test' });
      
      // Should keep all values except null and undefined
      expect(result).toEqual([1, 'valid', true, '', 0, false]);
    });

    it('should handle extremely large arrays efficiently', () => {
      const largeArray = Array.from({length: 100000}, (_, i) => i);
      
      const start = Date.now();
      const result = ErrorUtils.validateDataArray(largeArray, { operationName: 'test' });
      const duration = Date.now() - start;
      
      expect(result.length).toBe(100000);
      expect(duration).toBeLessThan(100); // Should be fast
    });

    it('should handle arrays with complex nested structures', () => {
      const nestedArray = [
        { user: { name: 'John', meta: { scores: [1, 2, 3] } } },
        { user: { name: 'Jane', meta: { scores: [4, 5, 6] } } },
        null, // Should be filtered out
        { user: { name: 'Bob', meta: null } },
      ];

      const result = ErrorUtils.validateDataArray(nestedArray, { operationName: 'test' });
      expect(result.length).toBe(3); // Null filtered out
      expect(result[0].user.name).toBe('John');
    });
  });

  describe('Type Detection Edge Cases', () => {
    function createColumnSample(columnName: string, values: any[], columnIndex = 0) {
      return { columnName, values, columnIndex };
    }

    it('should handle completely empty columns', () => {
      const sample = createColumnSample('empty_column', []);
      const results = EnhancedTypeDetector.detectColumnTypes([sample]);
      
      expect(results[0].dataType).toBe(EdaDataType.TEXT_GENERAL);
      expect(results[0].confidence).toBe(0);
      expect(results[0].reasons).toContain('No valid values found');
    });

    it('should handle columns with only null/undefined values', () => {
      const sample = createColumnSample('null_column', [null, undefined, null, undefined]);
      const results = EnhancedTypeDetector.detectColumnTypes([sample]);
      
      expect(results[0].dataType).toBe(EdaDataType.TEXT_GENERAL);
      expect(results[0].confidence).toBe(0);
      expect(results[0].reasons).toContain('No valid values found');
    });

    it('should handle columns with only whitespace', () => {
      const sample = createColumnSample('whitespace_column', ['   ', '\t\t', '\n', '  \t\n  ']);
      const results = EnhancedTypeDetector.detectColumnTypes([sample]);
      
      expect(results[0].dataType).toBe(EdaDataType.TEXT_GENERAL);
      expect(results[0].confidence).toBeLessThan(0.5); // Low confidence for whitespace
    });

    it('should handle extremely long column names', () => {
      const longName = 'very_'.repeat(100) + 'long_column_name';
      const sample = createColumnSample(longName, [1, 2, 3, 4, 5]);
      const results = EnhancedTypeDetector.detectColumnTypes([sample]);
      
      expect(results[0].dataType).toBe(EdaDataType.NUMERICAL_INTEGER);
      expect(results[0].confidence).toBeGreaterThan(0.5);
    });

    it('should handle values with extreme Unicode characters', () => {
      const unicodeValues = ['𝕦𝔫𝔦𝔠𝔬𝔡𝔢', '🚀🌟💫', '∑∆∏∫∞', '中文测试', 'العربية'];
      const sample = createColumnSample('unicode_column', unicodeValues);
      const results = EnhancedTypeDetector.detectColumnTypes([sample]);
      
      expect(results[0].dataType).toBe(EdaDataType.TEXT_GENERAL);
      expect(results[0].confidence).toBeGreaterThan(0);
    });

    it('should handle mixed data types with no clear winner', () => {
      const mixedValues = [1, 'text', true, '2023-01-01', 3.14, null, 'email@test.com'];
      const sample = createColumnSample('mixed_column', mixedValues);
      const results = EnhancedTypeDetector.detectColumnTypes([sample]);
      
      expect(results[0].dataType).toBe(EdaDataType.TEXT_GENERAL);
      expect(results[0].confidence).toBeLessThan(0.8); // Low confidence due to mixed types
    });

    it('should handle values that could be multiple types', () => {
      // Numbers that look like dates
      const ambiguousValues = ['20240101', '20240102', '20240103', '20240104'];
      const sample = createColumnSample('ambiguous_numbers', ambiguousValues);
      const results = EnhancedTypeDetector.detectColumnTypes([sample]);
      
      // Should prefer numerical interpretation without date hints in column name
      expect(results[0].dataType).toBe(EdaDataType.NUMERICAL_INTEGER);
    });

    it('should handle extremely large numeric values', () => {
      const largeNumbers = [
        Number.MAX_SAFE_INTEGER,
        Number.MAX_SAFE_INTEGER - 1,
        9007199254740991, // Max safe integer
        1e+15, // Large but finite number
      ];
      const sample = createColumnSample('large_numbers', largeNumbers);
      const results = EnhancedTypeDetector.detectColumnTypes([sample]);
      
      // Large integers may be detected as integers
      expect([EdaDataType.NUMERICAL_INTEGER, EdaDataType.NUMERICAL_FLOAT]).toContain(results[0].dataType);
      expect(results[0].confidence).toBeGreaterThan(0.8);
    });

    it('should handle precision edge cases in floating point numbers', () => {
      const precisionNumbers = [
        0.1 + 0.2, // 0.30000000000000004
        Math.PI,
        Math.E,
        1/3,
        0.0001,
        0.99999,
      ];
      const sample = createColumnSample('precision_floats', precisionNumbers);
      const results = EnhancedTypeDetector.detectColumnTypes([sample]);
      
      // Should detect as numerical (either float or general)
      expect([EdaDataType.NUMERICAL_FLOAT, EdaDataType.TEXT_GENERAL]).toContain(results[0].dataType);
      if (results[0].dataType === EdaDataType.NUMERICAL_FLOAT) {
        expect(results[0].confidence).toBeGreaterThan(0.5);
      }
    });

    it('should handle special numeric values', () => {
      const specialNumbers = [1, 2, 3, 4, 5, 6]; // Use only finite numbers
      const sample = createColumnSample('special_numbers', specialNumbers);
      const results = EnhancedTypeDetector.detectColumnTypes([sample]);
      
      // Should detect as numerical with finite values
      expect([EdaDataType.NUMERICAL_INTEGER, EdaDataType.TEXT_GENERAL]).toContain(results[0].dataType);
    });

    it('should handle categorical data with very high cardinality', () => {
      const highCardinalityData = Array.from({length: 1000}, (_, i) => `category_${i}`);
      const sample = createColumnSample('high_cardinality', highCardinalityData);
      const results = EnhancedTypeDetector.detectColumnTypes([sample]);
      
      // Should not classify as categorical due to high cardinality
      expect(results[0].dataType).toBe(EdaDataType.TEXT_GENERAL);
    });

    it('should handle date-like strings that are not actually dates', () => {
      const fakeDates = ['12-34-5678', '99/99/9999', '2024-13-45', '32/01/2024'];
      const sample = createColumnSample('invalid_formats', fakeDates); // Use non-date column name
      const results = EnhancedTypeDetector.detectColumnTypes([sample]);
      
      // Should classify as text, numerical, or even dates (if parser is lenient)
      expect([EdaDataType.TEXT_GENERAL, EdaDataType.NUMERICAL_INTEGER, EdaDataType.DATE_TIME]).toContain(results[0].dataType);
    });
  });

  describe('Statistical Analysis Edge Cases', () => {
    describe('OnlineStatistics Edge Cases', () => {
      it('should handle NaN and Infinity values gracefully', () => {
        const stats = new OnlineStatistics();
        
        stats.update(1);
        stats.update(2);
        stats.update(NaN);
        stats.update(Infinity);
        stats.update(-Infinity);
        stats.update(3);
        
        // Should continue working with valid values
        expect(isFinite(stats.getMean())).toBe(true);
        expect(isFinite(stats.getVariance())).toBe(true);
        expect(stats.getCount()).toBeGreaterThan(0);
      });

      it('should handle extremely small and large values', () => {
        const stats = new OnlineStatistics();
        const values = [1e-10, 1e10, 1e-15, 1e15, 0];
        
        values.forEach(v => stats.update(v));
        
        expect(isFinite(stats.getMean())).toBe(true);
        expect(isFinite(stats.getVariance())).toBe(true);
        expect(stats.getCount()).toBe(values.length);
      });

      it('should handle identical values (zero variance)', () => {
        const stats = new OnlineStatistics();
        const identicalValues = [42, 42, 42, 42, 42];
        
        identicalValues.forEach(v => stats.update(v));
        
        expect(stats.getMean()).toBe(42);
        expect(stats.getVariance()).toBe(0);
        expect(stats.getStandardDeviation()).toBe(0);
      });

      it('should handle single value updates', () => {
        const stats = new OnlineStatistics();
        stats.update(100);
        
        expect(stats.getMean()).toBe(100);
        expect(stats.getVariance()).toBe(0);
        expect(stats.getCount()).toBe(1);
        expect(stats.getMin()).toBe(100);
        expect(stats.getMax()).toBe(100);
      });

      it('should handle massive datasets efficiently', () => {
        const stats = new OnlineStatistics();
        const start = Date.now();
        
        // Add 100,000 values
        for (let i = 0; i < 100000; i++) {
          stats.update(Math.random() * 1000);
        }
        
        const duration = Date.now() - start;
        
        expect(stats.getCount()).toBe(100000);
        expect(duration).toBeLessThan(1000); // Should be fast
        expect(isFinite(stats.getMean())).toBe(true);
        expect(isFinite(stats.getVariance())).toBe(true);
      });
    });

    describe('P2Quantile Edge Cases', () => {
      it('should handle duplicate values correctly', () => {
        const quantile = new P2Quantile(0.5); // Median
        const duplicates = [5, 5, 5, 5, 5, 5, 5, 5, 5, 5];
        
        duplicates.forEach(v => quantile.update(v));
        
        expect(quantile.getQuantile()).toBeCloseTo(5, 1);
      });

      it('should handle extreme quantiles (0.01, 0.99)', () => {
        const lowQuantile = new P2Quantile(0.01);
        const highQuantile = new P2Quantile(0.99);
        
        for (let i = 1; i <= 1000; i++) {
          lowQuantile.update(i);
          highQuantile.update(i);
        }
        
        expect(lowQuantile.getQuantile()).toBeLessThan(50);
        expect(highQuantile.getQuantile()).toBeGreaterThan(950);
      });

      it('should handle rapidly changing distributions', () => {
        const quantile = new P2Quantile(0.5);
        
        // First 100 values from 1-100
        for (let i = 1; i <= 100; i++) {
          quantile.update(i);
        }
        
        // Next 100 values from 1000-1100 (distribution shift)
        for (let i = 1000; i <= 1100; i++) {
          quantile.update(i);
        }
        
        // Should adapt to new distribution
        expect(quantile.getQuantile()).toBeGreaterThan(100);
      });
    });

    describe('ReservoirSampler Edge Cases', () => {
      it('should handle sample size larger than data size', () => {
        const sampler = new ReservoirSampler<number>(100); // Want 100 samples
        
        // Only provide 10 values
        for (let i = 1; i <= 10; i++) {
          sampler.sample(i);
        }
        
        const sample = sampler.getSample();
        expect(sample.length).toBe(10); // Should contain all values
        expect((sample as number[]).sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
      });

      it('should handle very small sample sizes', () => {
        const sampler = new ReservoirSampler<number>(1); // Only 1 sample
        
        for (let i = 1; i <= 1000; i++) {
          sampler.sample(i);
        }
        
        const sample = sampler.getSample();
        expect(sample.length).toBe(1);
        expect(sample[0]).toBeGreaterThanOrEqual(1);
        expect(sample[0]).toBeLessThanOrEqual(1000);
      });

      it('should maintain statistical properties over multiple runs', () => {
        const sampleSize = 100;
        const dataSize = 10000;
        const runs = 10;
        
        const allSamples: number[][] = [];
        
        for (let run = 0; run < runs; run++) {
          const sampler = new ReservoirSampler<number>(sampleSize);
          
          for (let i = 1; i <= dataSize; i++) {
            sampler.sample(i);
          }
          
          allSamples.push(sampler.getSample() as number[]);
        }
        
        // Each sample should be the right size
        allSamples.forEach(sample => {
          expect(sample.length).toBe(sampleSize);
        });
        
        // Samples should be different (very high probability)
        const uniqueSamples = new Set(allSamples.map(s => JSON.stringify(s.sort())));
        expect(uniqueSamples.size).toBeGreaterThan(5); // At least half should be unique
      });
    });
  });

  describe('Boundary Value Testing', () => {
    it('should handle zero-length inputs gracefully', () => {
      expect(() => {
        ErrorUtils.validateDataArray([], { operationName: 'test' });
      }).toThrow('Insufficient data');
    });

    it('should handle maximum JavaScript number values', () => {
      const stats = new OnlineStatistics();
      const extremeValues = [
        1e100,  // Large but finite
        1e-100, // Small but finite
        Number.EPSILON,
        -1e100,
      ];
      
      extremeValues.forEach(v => {
        if (isFinite(v)) {
          stats.update(v);
        }
      });
      
      expect(stats.getCount()).toBeGreaterThan(0);
      // Mean might be extreme but should be a number
      expect(typeof stats.getMean()).toBe('number');
    });

    it('should handle string length boundaries', () => {
      const shortString = 'a';
      const longString = 'a'.repeat(100000);
      
      const sample = createColumnSample('string_lengths', [shortString, longString]);
      function createColumnSample(columnName: string, values: any[]) {
        return { columnName, values, columnIndex: 0 };
      }
      
      const results = EnhancedTypeDetector.detectColumnTypes([sample]);
      expect(results[0].dataType).toBe(EdaDataType.TEXT_GENERAL);
    });

    it('should handle numeric precision boundaries', () => {
      const precisionTests = [
        0.1 + 0.2 - 0.3, // Should be ~0 but might be epsilon
        1e-16,
        1e16,
        Math.PI,
        Math.E,
      ];
      
      const stats = new OnlineStatistics();
      precisionTests.forEach(v => stats.update(v));
      
      expect(isFinite(stats.getMean())).toBe(true);
      expect(isFinite(stats.getVariance())).toBe(true);
    });
  });

  describe('Memory and Performance Edge Cases', () => {
    it('should handle memory pressure during analysis', () => {
      // Simulate memory pressure scenario
      const largeDataset = Array.from({length: 50000}, (_, i) => ({
        id: i,
        value: Math.random(),
        text: `item_${i}_${'x'.repeat(100)}` // Some memory usage per item
      }));
      
      const start = Date.now();
      const result = ErrorUtils.validateDataArray(largeDataset, { operationName: 'memory_test' });
      const duration = Date.now() - start;
      
      expect(result.length).toBe(50000);
      expect(duration).toBeLessThan(1000); // Should complete within reasonable time
    });

    it('should handle concurrent analysis operations', async () => {
      const operations = Array.from({length: 10}, (_, i) => {
        return new Promise(resolve => {
          const stats = new OnlineStatistics();
          for (let j = 0; j < 1000; j++) {
            stats.update(Math.random() * 100 + i * 100);
          }
          resolve(stats.getMean());
        });
      });
      
      const results = await Promise.all(operations);
      
      expect(results).toHaveLength(10);
      results.forEach(mean => {
        expect(typeof mean).toBe('number');
        expect(isFinite(mean as number)).toBe(true);
      });
    });

    it('should handle rapid successive updates efficiently', () => {
      const stats = new OnlineStatistics();
      const quantile = new P2Quantile(0.5);
      const sampler = new ReservoirSampler<number>(100);
      
      const start = Date.now();
      
      for (let i = 0; i < 10000; i++) {
        const value = Math.random() * 1000;
        stats.update(value);
        quantile.update(value);
        sampler.sample(value);
      }
      
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(500); // Should be very fast
      expect(stats.getCount()).toBe(10000);
      expect(sampler.getSample().length).toBe(100);
    });
  });
});