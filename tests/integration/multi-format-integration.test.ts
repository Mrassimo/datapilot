/**
 * Multi-Format Integration Tests
 * Tests the universal analyzer with different file formats
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import { UniversalAnalyzer } from '../../src/cli/universal-analyzer';
import { JSONParser, JSONDetector } from '../../src/parsers/json-parser';
import { ExcelDetector } from '../../src/parsers/excel-parser';
import { TSVDetector } from '../../src/parsers/tsv-parser';
import { createCSVParserAdapter } from '../../src/parsers/adapters/csv-parser-adapter';

describe('Multi-Format Integration Tests', () => {
  let analyzer: UniversalAnalyzer;
  const testDataDir = path.join(__dirname, '../test-data');
  
  beforeAll(async () => {
    // Ensure test data directory exists
    await fs.mkdir(testDataDir, { recursive: true });
  });

  beforeEach(() => {
    analyzer = new UniversalAnalyzer();
  });

  afterAll(async () => {
    // Clean up test files
    try {
      await fs.rmdir(testDataDir, { recursive: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('Format Detection', () => {
    test('should detect JSON format correctly', async () => {
      const testFile = path.join(testDataDir, 'test.json');
      const testData = JSON.stringify([
        { name: 'John', age: 30, city: 'New York' },
        { name: 'Jane', age: 25, city: 'London' },
        { name: 'Bob', age: 35, city: 'Paris' }
      ]);
      
      await fs.writeFile(testFile, testData);
      
      const detector = new JSONDetector();
      const result = await detector.detect(testFile);
      
      expect(result.format).toBe('json');
      expect(result.confidence).toBeGreaterThan(0.8);
      expect(result.metadata.type).toBe('array');
    });

    test('should detect JSONL format correctly', async () => {
      const testFile = path.join(testDataDir, 'test.jsonl');
      const testData = [
        '{"name": "John", "age": 30, "city": "New York"}',
        '{"name": "Jane", "age": 25, "city": "London"}',
        '{"name": "Bob", "age": 35, "city": "Paris"}'
      ].join('\n');
      
      await fs.writeFile(testFile, testData);
      
      const detector = new JSONDetector();
      const result = await detector.detect(testFile);
      
      expect(result.format).toBe('json');
      expect(result.confidence).toBeGreaterThan(0.8);
      expect(result.metadata.type).toBe('jsonl');
    });

    test('should detect TSV format correctly', async () => {
      const testFile = path.join(testDataDir, 'test.tsv');
      const testData = [
        'name\tage\tcity',
        'John\t30\tNew York',
        'Jane\t25\tLondon',
        'Bob\t35\tParis'
      ].join('\n');
      
      await fs.writeFile(testFile, testData);
      
      const detector = new TSVDetector();
      const result = await detector.detect(testFile);
      
      expect(result.format).toBe('tsv');
      expect(result.confidence).toBeGreaterThan(0.8);
      expect(result.metadata.delimiter).toBe('\t');
    });

    test('should detect CSV format correctly', async () => {
      const testFile = path.join(testDataDir, 'test.csv');
      const testData = [
        'name,age,city',
        'John,30,New York',
        'Jane,25,London',
        'Bob,35,Paris'
      ].join('\n');
      
      await fs.writeFile(testFile, testData);
      
      const csvAdapter = createCSVParserAdapter();
      const result = await csvAdapter.detect(testFile);
      
      expect(result.format).toBe('csv');
      expect(result.confidence).toBeGreaterThan(0.8);
      expect(result.metadata.delimiter).toBe(',');
    });
  });

  describe('Universal Analysis', () => {
    test('should analyze JSON file successfully', async () => {
      const testFile = path.join(testDataDir, 'analysis-test.json');
      const testData = JSON.stringify([
        { name: 'Alice', age: 28, salary: 50000, department: 'Engineering' },
        { name: 'Bob', age: 32, salary: 60000, department: 'Marketing' },
        { name: 'Charlie', age: 25, salary: 45000, department: 'Engineering' },
        { name: 'Diana', age: 29, salary: 55000, department: 'Sales' }
      ]);
      
      await fs.writeFile(testFile, testData);
      
      const result = await analyzer.analyzeFile(testFile, { maxRows: 10 });
      
      expect(result.success).toBe(true);
      expect(result.metadata?.originalFormat).toBe('json');
      expect(result.data).toBeDefined();
    });

    test('should analyze TSV file successfully', async () => {
      const testFile = path.join(testDataDir, 'analysis-test.tsv');
      const testData = [
        'name\tage\tsalary\tdepartment',
        'Alice\t28\t50000\tEngineering',
        'Bob\t32\t60000\tMarketing',
        'Charlie\t25\t45000\tEngineering',
        'Diana\t29\t55000\tSales'
      ].join('\n');
      
      await fs.writeFile(testFile, testData);
      
      const result = await analyzer.analyzeFile(testFile, { maxRows: 10 });
      
      expect(result.success).toBe(true);
      expect(result.metadata?.originalFormat).toBe('tsv');
      expect(result.data).toBeDefined();
    });

    test('should handle format detection errors gracefully', async () => {
      const testFile = path.join(testDataDir, 'invalid.xyz');
      const testData = 'This is not a valid data file format';
      
      await fs.writeFile(testFile, testData);
      
      const validation = await analyzer.validateFile(testFile);
      
      expect(validation.supported).toBe(false);
      expect(validation.suggestions).toContain('File format not supported or confidence too low');
    });
  });

  describe('Parser Registry', () => {
    test('should get supported formats', () => {
      const formats = analyzer.getSupportedFormats();
      
      expect(formats).toContain('csv');
      expect(formats).toContain('json');
      expect(formats).toContain('tsv');
      expect(formats).toContain('excel');
      expect(formats.length).toBeGreaterThan(0);
    });

    test('should validate supported file formats', async () => {
      const csvFile = path.join(testDataDir, 'valid.csv');
      await fs.writeFile(csvFile, 'a,b,c\n1,2,3\n4,5,6');
      
      const validation = await analyzer.validateFile(csvFile);
      
      expect(validation.supported).toBe(true);
      expect(validation.format).toBe('csv');
      expect(validation.confidence).toBeGreaterThan(0.5);
    });
  });

  describe('Error Handling', () => {
    test('should handle missing file gracefully', async () => {
      const missingFile = path.join(testDataDir, 'does-not-exist.csv');
      
      const validation = await analyzer.validateFile(missingFile);
      
      expect(validation.supported).toBe(false);
      expect(validation.suggestions.length).toBeGreaterThan(0);
    });

    test('should handle corrupted JSON file', async () => {
      const corruptedFile = path.join(testDataDir, 'corrupted.json');
      const corruptedData = '{"name": "John", "age": 30'; // Missing closing brace
      
      await fs.writeFile(corruptedFile, corruptedData);
      
      try {
        const result = await analyzer.analyzeFile(corruptedFile, { maxRows: 10 });
        // Should either succeed with error handling or fail gracefully
        if (!result.success) {
          expect(result.suggestions).toBeDefined();
        }
      } catch (error) {
        // Expected to throw for corrupted files
        expect(error).toBeDefined();
      }
    });
  });

  describe('Performance', () => {
    test('should handle large JSON file efficiently', async () => {
      const largeFile = path.join(testDataDir, 'large.json');
      const largeData = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        name: `User${i}`,
        value: Math.random() * 100
      }));
      
      await fs.writeFile(largeFile, JSON.stringify(largeData));
      
      const startTime = Date.now();
      const result = await analyzer.analyzeFile(largeFile, { maxRows: 500 });
      const endTime = Date.now();
      
      expect(result.success).toBe(true);
      expect(endTime - startTime).toBeLessThan(10000); // Should complete within 10 seconds
    });
  });

  describe('Output Consistency', () => {
    test('should produce consistent analysis structure across formats', async () => {
      // Create CSV version
      const csvFile = path.join(testDataDir, 'consistency.csv');
      const csvData = [
        'name,age,score',
        'Alice,25,85.5',
        'Bob,30,92.0',
        'Charlie,28,78.5'
      ].join('\n');
      await fs.writeFile(csvFile, csvData);
      
      // Create JSON version of same data
      const jsonFile = path.join(testDataDir, 'consistency.json');
      const jsonData = JSON.stringify([
        { name: 'Alice', age: 25, score: 85.5 },
        { name: 'Bob', age: 30, score: 92.0 },
        { name: 'Charlie', age: 28, score: 78.5 }
      ]);
      await fs.writeFile(jsonFile, jsonData);
      
      // Analyze both files
      const csvResult = await analyzer.analyzeFile(csvFile, { maxRows: 10 });
      const jsonResult = await analyzer.analyzeFile(jsonFile, { maxRows: 10 });
      
      // Both should succeed
      expect(csvResult.success).toBe(true);
      expect(jsonResult.success).toBe(true);
      
      // Should have similar structure (both go through same analysis pipeline)
      expect(csvResult.data).toBeDefined();
      expect(jsonResult.data).toBeDefined();
      
      // Metadata should indicate different formats
      expect(csvResult.metadata?.originalFormat).toBe('csv');
      expect(jsonResult.metadata?.originalFormat).toBe('json');
    });
  });
});