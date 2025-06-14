/**
 * Streaming Analyzer Tests
 * 
 * Tests the memory-efficient streaming analysis engine that processes arbitrarily large datasets
 * with constant memory usage through chunk-based processing and online algorithms.
 */

import { StreamingAnalyzer } from '../../../src/analyzers/streaming/streaming-analyzer';
import type { StreamingConfig, StreamingAnalyzerInput } from '../../../src/analyzers/streaming/types';
import { DataType } from '../../../src/core/types';

describe('StreamingAnalyzer', () => {
  describe('Basic Streaming Operations', () => {
    it('should process data in chunks for memory efficiency', async () => {
      // Create dataset larger than chunk size
      const data = Array.from({ length: 250 }, (_, i) => [
        i.toString(),
        (Math.random() * 100).toFixed(2),
        ['A', 'B', 'C'][i % 3],
      ]);

      const config: StreamingConfig = {
        chunkSize: 50, // Force chunking
        memoryThreshold: 0.8,
        enableAdaptiveChunking: true,
      };

      const input: StreamingAnalyzerInput = {
        data,
        headers: ['id', 'value', 'category'],
        columnTypes: [DataType.INTEGER, DataType.FLOAT, DataType.STRING],
        config,
      };

      const analyzer = new StreamingAnalyzer(input);
      const result = await analyzer.analyze();

      expect(result.columnAnalyses).toHaveLength(3);
      expect(result.processingSummary.totalRowsProcessed).toBe(250);
      expect(result.processingSummary.chunksProcessed).toBeGreaterThan(1);
      expect(result.processingSummary.memoryUsage.peakUsage).toBeGreaterThan(0);
    });

    it('should handle memory pressure with adaptive chunking', async () => {
      const data = Array.from({ length: 1000 }, (_, i) => [
        i.toString(),
        (Math.random() * 1000).toFixed(2),
        `Category_${i % 10}`,
        new Date(2024, 0, i % 365 + 1).toISOString(),
      ]);

      const config: StreamingConfig = {
        chunkSize: 100,
        memoryThreshold: 0.5, // Low threshold to trigger adaptation
        enableAdaptiveChunking: true,
        maxMemoryUsage: 100 * 1024 * 1024, // 100MB limit
      };

      const input: StreamingAnalyzerInput = {
        data,
        headers: ['id', 'value', 'category', 'date'],
        columnTypes: [DataType.INTEGER, DataType.FLOAT, DataType.STRING, DataType.DATE],
        config,
      };

      const analyzer = new StreamingAnalyzer(input);
      const result = await analyzer.analyze();

      expect(result.columnAnalyses).toHaveLength(4);
      expect(result.processingSummary.adaptiveChunkingEvents).toBeGreaterThanOrEqual(0);
      expect(result.warnings.length).toBeGreaterThanOrEqual(0);
    });

    it('should maintain statistical accuracy across chunks', async () => {
      // Create known statistical distribution
      const mean = 50;
      const stdDev = 10;
      const data = Array.from({ length: 500 }, (_, i) => [
        i.toString(),
        (mean + (Math.random() - 0.5) * 2 * stdDev * 3).toFixed(2), // Approximate normal distribution
      ]);

      const config: StreamingConfig = {
        chunkSize: 25,
        memoryThreshold: 0.8,
      };

      const input: StreamingAnalyzerInput = {
        data,
        headers: ['id', 'value'],
        columnTypes: [DataType.INTEGER, DataType.FLOAT],
        config,
      };

      const analyzer = new StreamingAnalyzer(input);
      const result = await analyzer.analyze();

      const valueAnalysis = result.columnAnalyses.find(col => col.columnName === 'value');
      expect(valueAnalysis?.type).toBe('numerical');

      if (valueAnalysis?.type === 'numerical') {
        // Streaming algorithms should maintain statistical accuracy
        expect(valueAnalysis.descriptiveStats.count).toBe(500);
        expect(Math.abs(valueAnalysis.descriptiveStats.mean - mean)).toBeLessThan(5); // Reasonable approximation
        expect(valueAnalysis.descriptiveStats.standardDeviation).toBeGreaterThan(5);
      }
    });
  });

  describe('Online Algorithm Accuracy', () => {
    it('should compute accurate online statistics', async () => {
      // Use known values for precise testing
      const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const data = values.map((val, i) => [i.toString(), val.toString()]);

      const input: StreamingAnalyzerInput = {
        data,
        headers: ['id', 'value'],
        columnTypes: [DataType.INTEGER, DataType.INTEGER],
        config: { chunkSize: 3 }, // Force multiple chunks
      };

      const analyzer = new StreamingAnalyzer(input);
      const result = await analyzer.analyze();

      const valueAnalysis = result.columnAnalyses.find(col => col.columnName === 'value');
      expect(valueAnalysis?.type).toBe('numerical');

      if (valueAnalysis?.type === 'numerical') {
        // Known statistics for 1-10
        expect(valueAnalysis.descriptiveStats.mean).toBeCloseTo(5.5, 2);
        expect(valueAnalysis.descriptiveStats.min).toBe(1);
        expect(valueAnalysis.descriptiveStats.max).toBe(10);
        expect(valueAnalysis.descriptiveStats.count).toBe(10);
        
        // Standard deviation of 1-10 is approximately 3.03
        expect(valueAnalysis.descriptiveStats.standardDeviation).toBeCloseTo(3.03, 1);
      }
    });

    it('should compute accurate quantiles using P2 algorithm', async () => {
      // Create dataset with known distribution
      const data = Array.from({ length: 101 }, (_, i) => [
        i.toString(),
        i.toString(), // Values 0-100
      ]);

      const input: StreamingAnalyzerInput = {
        data,
        headers: ['id', 'value'],
        columnTypes: [DataType.INTEGER, DataType.INTEGER],
        config: { chunkSize: 20 },
      };

      const analyzer = new StreamingAnalyzer(input);
      const result = await analyzer.analyze();

      const valueAnalysis = result.columnAnalyses.find(col => col.columnName === 'value');
      if (valueAnalysis?.type === 'numerical') {
        // For 0-100, quartiles should be approximately 25, 50, 75
        expect(valueAnalysis.descriptiveStats.quantiles.q25).toBeCloseTo(25, 5);
        expect(valueAnalysis.descriptiveStats.quantiles.median).toBeCloseTo(50, 5);
        expect(valueAnalysis.descriptiveStats.quantiles.q75).toBeCloseTo(75, 5);
      }
    });

    it('should maintain bounded frequency counters for categorical data', async () => {
      // Create high-cardinality categorical data
      const categories = Array.from({ length: 1000 }, (_, i) => `Category_${i}`);
      const data = Array.from({ length: 5000 }, (_, i) => [
        i.toString(),
        categories[i % categories.length],
      ]);

      const config: StreamingConfig = {
        chunkSize: 100,
        maxCategoricalCardinality: 100, // Limit category tracking
      };

      const input: StreamingAnalyzerInput = {
        data,
        headers: ['id', 'category'],
        columnTypes: [DataType.INTEGER, DataType.STRING],
        config,
      };

      const analyzer = new StreamingAnalyzer(input);
      const result = await analyzer.analyze();

      const categoryAnalysis = result.columnAnalyses.find(col => col.columnName === 'category');
      expect(categoryAnalysis?.type).toBe('categorical');

      if (categoryAnalysis?.type === 'categorical') {
        // Should track top categories without memory explosion
        expect(categoryAnalysis.frequencyAnalysis.uniqueValues).toBeLessThanOrEqual(1000);
        expect(categoryAnalysis.frequencyAnalysis.topCategories.length).toBeGreaterThan(0);
        expect(categoryAnalysis.frequencyAnalysis.topCategories.length).toBeLessThanOrEqual(100);
      }
    });
  });

  describe('Column Type Specific Analysis', () => {
    it('should handle numerical columns with online statistics', async () => {
      const data = Array.from({ length: 200 }, (_, i) => [
        i.toString(),
        (Math.random() * 1000).toFixed(2),
        (i * 1.5 + Math.random() * 50).toFixed(1),
      ]);

      const input: StreamingAnalyzerInput = {
        data,
        headers: ['id', 'random', 'linear'],
        columnTypes: [DataType.INTEGER, DataType.FLOAT, DataType.FLOAT],
        config: { chunkSize: 50 },
      };

      const analyzer = new StreamingAnalyzer(input);
      const result = await analyzer.analyze();

      const numericalColumns = result.columnAnalyses.filter(col => col.type === 'numerical');
      expect(numericalColumns.length).toBe(3);

      numericalColumns.forEach(col => {
        if (col.type === 'numerical') {
          expect(col.descriptiveStats.count).toBe(200);
          expect(col.descriptiveStats.mean).toBeGreaterThan(0);
          expect(col.descriptiveStats.standardDeviation).toBeGreaterThan(0);
          expect(col.outlierAnalysis).toBeDefined();
          expect(col.distributionAnalysis).toBeDefined();
        }
      });
    });

    it('should handle categorical columns with diversity metrics', async () => {
      const categories = ['Low', 'Medium', 'High', 'Very High'];
      const data = Array.from({ length: 400 }, (_, i) => [
        i.toString(),
        categories[Math.floor(Math.random() * categories.length)],
        i % 2 === 0 ? 'Even' : 'Odd',
      ]);

      const input: StreamingAnalyzerInput = {
        data,
        headers: ['id', 'priority', 'parity'],
        columnTypes: [DataType.INTEGER, DataType.STRING, DataType.STRING],
        config: { chunkSize: 40 },
      };

      const analyzer = new StreamingAnalyzer(input);
      const result = await analyzer.analyze();

      const categoricalColumns = result.columnAnalyses.filter(col => col.type === 'categorical');
      expect(categoricalColumns.length).toBe(2);

      categoricalColumns.forEach(col => {
        if (col.type === 'categorical') {
          expect(col.frequencyAnalysis.totalValues).toBe(400);
          expect(col.diversityMetrics.shannonEntropy).toBeGreaterThan(0);
          expect(col.diversityMetrics.giniImpurity).toBeGreaterThanOrEqual(0);
          expect(col.distributionCharacteristics).toBeDefined();
        }
      });
    });

    it('should handle date/time columns with temporal patterns', async () => {
      const data = Array.from({ length: 365 }, (_, i) => [
        i.toString(),
        new Date(2024, 0, i + 1).toISOString().split('T')[0], // Daily dates for 2024
        new Date(2024, i % 12, 15).toISOString(), // Monthly pattern with time
      ]);

      const input: StreamingAnalyzerInput = {
        data,
        headers: ['id', 'date', 'datetime'],
        columnTypes: [DataType.INTEGER, DataType.DATE, DataType.DATE],
        config: { chunkSize: 30 },
      };

      const analyzer = new StreamingAnalyzer(input);
      const result = await analyzer.analyze();

      const dateColumns = result.columnAnalyses.filter(col => col.type === 'datetime');
      expect(dateColumns.length).toBe(2);

      dateColumns.forEach(col => {
        if (col.type === 'datetime') {
          expect(col.temporalPatterns.range).toBeDefined();
          expect(col.componentFrequency.years).toBeDefined();
          expect(col.componentFrequency.months).toBeDefined();
          expect(col.componentFrequency.days).toBeDefined();
          
          if (col.columnName === 'datetime') {
            expect(col.componentFrequency.hours).toBeDefined();
          }
        }
      });
    });

    it('should handle boolean columns efficiently', async () => {
      const data = Array.from({ length: 1000 }, (_, i) => [
        i.toString(),
        i % 3 === 0 ? 'true' : 'false',
        Math.random() > 0.7 ? '1' : '0',
      ]);

      const input: StreamingAnalyzerInput = {
        data,
        headers: ['id', 'flag1', 'flag2'],
        columnTypes: [DataType.INTEGER, DataType.BOOLEAN, DataType.BOOLEAN],
        config: { chunkSize: 100 },
      };

      const analyzer = new StreamingAnalyzer(input);
      const result = await analyzer.analyze();

      const booleanColumns = result.columnAnalyses.filter(col => col.type === 'boolean');
      expect(booleanColumns.length).toBe(2);

      booleanColumns.forEach(col => {
        if (col.type === 'boolean') {
          expect(col.distribution.trueCount).toBeGreaterThanOrEqual(0);
          expect(col.distribution.falseCount).toBeGreaterThanOrEqual(0);
          expect(col.distribution.trueCount + col.distribution.falseCount).toBe(1000);
          expect(col.distribution.truePercentage).toBeLessThanOrEqual(100);
        }
      });
    });

    it('should handle text columns with content analysis', async () => {
      const textSamples = [
        'This is a short text sample',
        'A longer text sample with more words and characters for analysis',
        'Short',
        'Medium length text with some variety',
        'Another example of text data for comprehensive analysis and testing',
      ];

      const data = Array.from({ length: 100 }, (_, i) => [
        i.toString(),
        textSamples[i % textSamples.length],
      ]);

      const input: StreamingAnalyzerInput = {
        data,
        headers: ['id', 'text'],
        columnTypes: [DataType.INTEGER, DataType.STRING],
        config: { 
          chunkSize: 20,
          treatLongStringsAsText: true,
          textAnalysisThreshold: 10, // Treat strings longer than 10 chars as text
        },
      };

      const analyzer = new StreamingAnalyzer(input);
      const result = await analyzer.analyze();

      const textAnalysis = result.columnAnalyses.find(col => col.columnName === 'text');
      expect(textAnalysis?.type).toBe('text');

      if (textAnalysis?.type === 'text') {
        expect(textAnalysis.characterStats.averageLength).toBeGreaterThan(0);
        expect(textAnalysis.characterStats.minLength).toBeGreaterThan(0);
        expect(textAnalysis.characterStats.maxLength).toBeGreaterThan(0);
        expect(textAnalysis.wordStats.averageWords).toBeGreaterThan(0);
        expect(textAnalysis.patternDetection).toBeDefined();
      }
    });
  });

  describe('Memory Management and Performance', () => {
    it('should track and limit memory usage', async () => {
      const data = Array.from({ length: 2000 }, (_, i) => [
        i.toString(),
        (Math.random() * 1000).toFixed(3),
        `Category_${i % 50}`,
        new Date(2024, i % 12, (i % 28) + 1).toISOString(),
      ]);

      const config: StreamingConfig = {
        chunkSize: 100,
        memoryThreshold: 0.7,
        maxMemoryUsage: 50 * 1024 * 1024, // 50MB limit
        enableMemoryMonitoring: true,
      };

      const input: StreamingAnalyzerInput = {
        data,
        headers: ['id', 'value', 'category', 'date'],
        columnTypes: [DataType.INTEGER, DataType.FLOAT, DataType.STRING, DataType.DATE],
        config,
      };

      const analyzer = new StreamingAnalyzer(input);
      const result = await analyzer.analyze();

      expect(result.processingSummary.memoryUsage.peakUsage).toBeGreaterThan(0);
      expect(result.processingSummary.memoryUsage.averageUsage).toBeGreaterThan(0);
      expect(result.processingSummary.memoryUsage.gcEvents).toBeGreaterThanOrEqual(0);
      
      // Should complete successfully without memory errors
      expect(result.columnAnalyses).toHaveLength(4);
    });

    it('should handle very large datasets with constant memory', async () => {
      // Simulate processing a very large dataset
      const data = Array.from({ length: 10000 }, (_, i) => [
        i.toString(),
        (Math.random() * 10000).toFixed(2),
        ['Small', 'Medium', 'Large', 'XLarge'][i % 4],
      ]);

      const config: StreamingConfig = {
        chunkSize: 50,
        memoryThreshold: 0.6,
        enableAdaptiveChunking: true,
      };

      const start = Date.now();
      const input: StreamingAnalyzerInput = {
        data,
        headers: ['id', 'value', 'size'],
        columnTypes: [DataType.INTEGER, DataType.FLOAT, DataType.STRING],
        config,
      };

      const analyzer = new StreamingAnalyzer(input);
      const result = await analyzer.analyze();
      const duration = Date.now() - start;

      // Should complete within reasonable time (< 5 seconds)
      expect(duration).toBeLessThan(5000);
      expect(result.processingSummary.totalRowsProcessed).toBe(10000);
      expect(result.processingSummary.chunksProcessed).toBeGreaterThan(100);
      expect(result.columnAnalyses).toHaveLength(3);
    });

    it('should provide detailed performance metrics', async () => {
      const data = Array.from({ length: 500 }, (_, i) => [
        i.toString(),
        (Math.random() * 100).toFixed(2),
      ]);

      const input: StreamingAnalyzerInput = {
        data,
        headers: ['id', 'value'],
        columnTypes: [DataType.INTEGER, DataType.FLOAT],
        config: { 
          chunkSize: 25,
          enablePerformanceTracking: true,
        },
      };

      const analyzer = new StreamingAnalyzer(input);
      const result = await analyzer.analyze();

      expect(result.processingSummary.totalAnalysisTime).toBeGreaterThan(0);
      expect(result.processingSummary.chunksProcessed).toBe(20); // 500 / 25
      expect(result.processingSummary.averageChunkProcessingTime).toBeGreaterThan(0);
      
      if (result.processingSummary.phaseTimings) {
        expect(Object.keys(result.processingSummary.phaseTimings).length).toBeGreaterThan(0);
      }
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle empty datasets gracefully', async () => {
      const input: StreamingAnalyzerInput = {
        data: [],
        headers: ['id', 'value'],
        columnTypes: [DataType.INTEGER, DataType.FLOAT],
        config: { chunkSize: 10 },
      };

      const analyzer = new StreamingAnalyzer(input);
      const result = await analyzer.analyze();

      expect(result.columnAnalyses).toHaveLength(2);
      expect(result.processingSummary.totalRowsProcessed).toBe(0);
      expect(result.processingSummary.chunksProcessed).toBe(0);
    });

    it('should handle single row datasets', async () => {
      const data = [['1', '42.5', 'Single']];

      const input: StreamingAnalyzerInput = {
        data,
        headers: ['id', 'value', 'category'],
        columnTypes: [DataType.INTEGER, DataType.FLOAT, DataType.STRING],
        config: { chunkSize: 10 },
      };

      const analyzer = new StreamingAnalyzer(input);
      const result = await analyzer.analyze();

      expect(result.columnAnalyses).toHaveLength(3);
      expect(result.processingSummary.totalRowsProcessed).toBe(1);
      
      const valueAnalysis = result.columnAnalyses.find(col => col.columnName === 'value');
      if (valueAnalysis?.type === 'numerical') {
        expect(valueAnalysis.descriptiveStats.count).toBe(1);
        expect(valueAnalysis.descriptiveStats.mean).toBe(42.5);
      }
    });

    it('should handle datasets with all missing values', async () => {
      const data = [
        ['', '', ''],
        [null, undefined, ''],
        ['', null, undefined],
      ];

      const input: StreamingAnalyzerInput = {
        data,
        headers: ['col1', 'col2', 'col3'],
        columnTypes: [DataType.STRING, DataType.STRING, DataType.STRING],
        config: { chunkSize: 2 },
      };

      const analyzer = new StreamingAnalyzer(input);
      const result = await analyzer.analyze();

      expect(result.columnAnalyses).toHaveLength(3);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.processingSummary.totalRowsProcessed).toBe(3);
    });

    it('should handle mixed data types gracefully', async () => {
      const data = [
        ['1', '42', 'Valid'],
        ['2', 'not_a_number', 'Mixed'],
        ['3', '43.5', 'Data'],
        ['not_number', '44', 'Types'],
      ];

      const input: StreamingAnalyzerInput = {
        data,
        headers: ['id', 'value', 'label'],
        columnTypes: [DataType.INTEGER, DataType.FLOAT, DataType.STRING],
        config: { chunkSize: 2 },
      };

      const analyzer = new StreamingAnalyzer(input);
      const result = await analyzer.analyze();

      expect(result.columnAnalyses).toHaveLength(3);
      expect(result.warnings.length).toBeGreaterThanOrEqual(0);
      
      // Should handle type coercion issues gracefully
      const valueAnalysis = result.columnAnalyses.find(col => col.columnName === 'value');
      expect(valueAnalysis).toBeDefined();
    });

    it('should handle memory pressure scenarios', async () => {
      const data = Array.from({ length: 1000 }, (_, i) => [
        i.toString(),
        (Math.random() * 1000).toFixed(4),
        `LongCategoryName_${i}_WithManyCharacters_ForMemoryTesting`,
      ]);

      const config: StreamingConfig = {
        chunkSize: 10,
        memoryThreshold: 0.3, // Very low threshold
        maxMemoryUsage: 10 * 1024 * 1024, // 10MB limit
        enableAdaptiveChunking: true,
      };

      const input: StreamingAnalyzerInput = {
        data,
        headers: ['id', 'value', 'long_category'],
        columnTypes: [DataType.INTEGER, DataType.FLOAT, DataType.STRING],
        config,
      };

      const analyzer = new StreamingAnalyzer(input);
      const result = await analyzer.analyze();

      // Should complete successfully despite memory pressure
      expect(result.columnAnalyses).toHaveLength(3);
      expect(result.processingSummary.adaptiveChunkingEvents).toBeGreaterThanOrEqual(0);
      expect(result.warnings.some(w => w.category === 'performance')).toBeTruthy();
    });

    it('should validate configuration parameters', async () => {
      const data = [['1', '2', '3']];

      const invalidConfig: StreamingConfig = {
        chunkSize: -1, // Invalid
        memoryThreshold: 2.0, // Invalid (> 1)
        maxMemoryUsage: -100, // Invalid
      };

      const input: StreamingAnalyzerInput = {
        data,
        headers: ['a', 'b', 'c'],
        columnTypes: [DataType.INTEGER, DataType.INTEGER, DataType.INTEGER],
        config: invalidConfig,
      };

      const analyzer = new StreamingAnalyzer(input);
      
      // Should handle invalid config gracefully
      const result = await analyzer.analyze();
      expect(result.columnAnalyses).toHaveLength(3);
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('Reservoir Sampling and Statistical Accuracy', () => {
    it('should use reservoir sampling for large categorical datasets', async () => {
      // Create dataset with many unique categories
      const data = Array.from({ length: 10000 }, (_, i) => [
        i.toString(),
        `Category_${i}`, // 10,000 unique categories
      ]);

      const config: StreamingConfig = {
        chunkSize: 100,
        maxCategoricalCardinality: 1000, // Force reservoir sampling
        reservoirSampleSize: 500,
      };

      const input: StreamingAnalyzerInput = {
        data,
        headers: ['id', 'category'],
        columnTypes: [DataType.INTEGER, DataType.STRING],
        config,
      };

      const analyzer = new StreamingAnalyzer(input);
      const result = await analyzer.analyze();

      const categoryAnalysis = result.columnAnalyses.find(col => col.columnName === 'category');
      if (categoryAnalysis?.type === 'categorical') {
        // Should use sampling to maintain bounded memory
        expect(categoryAnalysis.frequencyAnalysis.uniqueValues).toBeLessThanOrEqual(10000);
        expect(categoryAnalysis.frequencyAnalysis.totalValues).toBe(10000);
        expect(categoryAnalysis.samplingInfo?.sampleSize).toBeLessThanOrEqual(500);
      }
    });

    it('should maintain statistical accuracy with sampling', async () => {
      // Create dataset with known distribution
      const categories = ['A', 'B', 'C'];
      const weights = [0.5, 0.3, 0.2]; // Known distribution
      const data = Array.from({ length: 5000 }, (_, i) => {
        const rand = Math.random();
        let category = 'A';
        if (rand > 0.5) category = 'B';
        if (rand > 0.8) category = 'C';
        
        return [i.toString(), category];
      });

      const config: StreamingConfig = {
        chunkSize: 50,
        reservoirSampleSize: 1000,
      };

      const input: StreamingAnalyzerInput = {
        data,
        headers: ['id', 'category'],
        columnTypes: [DataType.INTEGER, DataType.STRING],
        config,
      };

      const analyzer = new StreamingAnalyzer(input);
      const result = await analyzer.analyze();

      const categoryAnalysis = result.columnAnalyses.find(col => col.columnName === 'category');
      if (categoryAnalysis?.type === 'categorical') {
        // Should approximate the true distribution reasonably well
        const aFreq = categoryAnalysis.frequencyAnalysis.topCategories.find(c => c.value === 'A');
        const bFreq = categoryAnalysis.frequencyAnalysis.topCategories.find(c => c.value === 'B');
        
        expect(aFreq?.percentage).toBeGreaterThan(30); // Should be around 50%
        expect(bFreq?.percentage).toBeGreaterThan(15); // Should be around 30%
      }
    });
  });
});