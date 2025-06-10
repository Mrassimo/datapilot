/**
 * Format Detection Tests
 * Tests for auto-detection of different file formats
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import { JSONDetector } from '../../src/parsers/json-parser';
import { ExcelDetector } from '../../src/parsers/excel-parser';
import { TSVDetector } from '../../src/parsers/tsv-parser';
import { createCSVParserAdapter } from '../../src/parsers/adapters/csv-parser-adapter';
import { globalParserRegistry } from '../../src/parsers/base/parser-registry';

describe('Format Detection Tests', () => {
  const testDataDir = path.join(__dirname, '../test-data/format-detection');
  
  beforeAll(async () => {
    await fs.mkdir(testDataDir, { recursive: true });
  });

  afterAll(async () => {
    try {
      await fs.rmdir(testDataDir, { recursive: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('JSON Detection', () => {
    let detector: JSONDetector;

    beforeEach(() => {
      detector = new JSONDetector();
    });

    test('should detect JSON array format', async () => {
      const testFile = path.join(testDataDir, 'array.json');
      const data = JSON.stringify([
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' }
      ]);
      await fs.writeFile(testFile, data);

      const result = await detector.detect(testFile);

      expect(result.format).toBe('json');
      expect(result.confidence).toBeGreaterThan(0.9);
      expect(result.metadata.type).toBe('array');
      expect(result.metadata.estimatedRecords).toBe(2);
    });

    test('should detect JSON object format', async () => {
      const testFile = path.join(testDataDir, 'object.json');
      const data = JSON.stringify({
        name: 'John',
        age: 30,
        address: { city: 'New York', country: 'USA' }
      });
      await fs.writeFile(testFile, data);

      const result = await detector.detect(testFile);

      expect(result.format).toBe('json');
      expect(result.confidence).toBeGreaterThan(0.9);
      expect(result.metadata.type).toBe('object');
      expect(result.metadata.keys).toContain('name');
      expect(result.metadata.keys).toContain('age');
    });

    test('should detect JSONL format', async () => {
      const testFile = path.join(testDataDir, 'lines.jsonl');
      const data = [
        '{"id": 1, "name": "Alice"}',
        '{"id": 2, "name": "Bob"}',
        '{"id": 3, "name": "Charlie"}'
      ].join('\n');
      await fs.writeFile(testFile, data);

      const result = await detector.detect(testFile);

      expect(result.format).toBe('json');
      expect(result.confidence).toBeGreaterThan(0.8);
      expect(result.metadata.type).toBe('jsonl');
      expect(result.metadata.estimatedRecords).toBe(3);
    });

    test('should handle malformed JSON', async () => {
      const testFile = path.join(testDataDir, 'malformed.json');
      const data = '{"name": "John", "age":'; // Incomplete JSON
      await fs.writeFile(testFile, data);

      const result = await detector.detect(testFile);

      expect(result.format).toBe('json');
      expect(result.confidence).toBe(0);
      expect(result.metadata.error).toBeDefined();
    });

    test('should calculate nesting levels correctly', async () => {
      const testFile = path.join(testDataDir, 'nested.json');
      const data = JSON.stringify({
        user: {
          profile: {
            personal: {
              name: 'John',
              age: 30
            },
            settings: {
              theme: 'dark'
            }
          }
        }
      });
      await fs.writeFile(testFile, data);

      const result = await detector.detect(testFile);

      expect(result.format).toBe('json');
      expect(result.confidence).toBeGreaterThan(0.9);
      expect(result.metadata.nestedLevels).toBeGreaterThan(2);
    });
  });

  describe('TSV Detection', () => {
    let detector: TSVDetector;

    beforeEach(() => {
      detector = new TSVDetector();
    });

    test('should detect TSV format with .tsv extension', async () => {
      const testFile = path.join(testDataDir, 'data.tsv');
      const data = [
        'name\tage\tcity',
        'John\t30\tNew York',
        'Jane\t25\tLondon'
      ].join('\n');
      await fs.writeFile(testFile, data);

      const result = await detector.detect(testFile);

      expect(result.format).toBe('tsv');
      expect(result.confidence).toBeGreaterThan(0.8);
      expect(result.metadata.delimiter).toBe('\t');
      expect(result.metadata.hasHeader).toBe(true);
    });

    test('should detect TSV format with .tab extension', async () => {
      const testFile = path.join(testDataDir, 'data.tab');
      const data = [
        'id\tvalue\tdescription',
        '1\t100\tFirst item',
        '2\t200\tSecond item'
      ].join('\n');
      await fs.writeFile(testFile, data);

      const result = await detector.detect(testFile);

      expect(result.format).toBe('tsv');
      expect(result.confidence).toBeGreaterThan(0.8);
      expect(result.metadata.estimatedColumns).toBe(3);
    });

    test('should handle inconsistent tab usage', async () => {
      const testFile = path.join(testDataDir, 'inconsistent.tsv');
      const data = [
        'a\tb\tc',
        '1\t2', // Missing column
        '3\t4\t5\t6' // Extra column
      ].join('\n');
      await fs.writeFile(testFile, data);

      const result = await detector.detect(testFile);

      expect(result.format).toBe('tsv');
      // Should have lower confidence due to inconsistency
      expect(result.confidence).toBeLessThan(0.9);
    });

    test('should reject non-TSV files', async () => {
      const testFile = path.join(testDataDir, 'not-tsv.txt');
      const data = 'This is just plain text without tabs';
      await fs.writeFile(testFile, data);

      const result = await detector.detect(testFile);

      expect(result.format).toBe('tsv');
      expect(result.confidence).toBeLessThan(0.5);
    });
  });

  describe('CSV Detection (via adapter)', () => {
    test('should detect CSV format correctly', async () => {
      const testFile = path.join(testDataDir, 'data.csv');
      const data = [
        'name,age,city',
        'John,30,"New York"',
        'Jane,25,London'
      ].join('\n');
      await fs.writeFile(testFile, data);

      const adapter = createCSVParserAdapter();
      const result = await adapter.detect(testFile);

      expect(result.format).toBe('csv');
      expect(result.confidence).toBeGreaterThan(0.8);
      expect(result.metadata.delimiter).toBe(',');
      expect(result.metadata.hasHeader).toBe(true);
    });

    test('should handle quoted fields', async () => {
      const testFile = path.join(testDataDir, 'quoted.csv');
      const data = [
        'name,description,value',
        '"John Doe","Software Engineer",50000',
        '"Jane Smith","Product Manager, Senior",75000'
      ].join('\n');
      await fs.writeFile(testFile, data);

      const adapter = createCSVParserAdapter();
      const result = await adapter.detect(testFile);

      expect(result.format).toBe('csv');
      expect(result.confidence).toBeGreaterThan(0.8);
      expect(result.metadata.quote).toBe('"');
    });
  });

  describe('Excel Detection', () => {
    let detector: ExcelDetector;

    beforeEach(() => {
      detector = new ExcelDetector();
    });

    test('should detect Excel extensions', async () => {
      const xlsxResult = await detector.detect('test.xlsx');
      const xlsResult = await detector.detect('test.xls');
      const xlsmResult = await detector.detect('test.xlsm');

      // Should at least recognize the extensions
      expect(xlsxResult.format).toBe('excel');
      expect(xlsResult.format).toBe('excel');
      expect(xlsmResult.format).toBe('excel');
    });

    test('should reject non-Excel extensions', async () => {
      const result = await detector.detect('test.txt');

      expect(result.format).toBe('excel');
      expect(result.confidence).toBe(0);
    });
  });

  describe('Parser Registry Integration', () => {
    test('should register and retrieve parsers correctly', () => {
      // Test that parsers can be registered and found
      const formats = globalParserRegistry.getSupportedFormats();
      const extensions = globalParserRegistry.getSupportedExtensions();

      expect(formats.length).toBeGreaterThan(0);
      expect(extensions.length).toBeGreaterThan(0);
    });

    test('should prioritize formats correctly', async () => {
      const csvFile = path.join(testDataDir, 'priority-test.csv');
      const data = 'a,b,c\n1,2,3';
      await fs.writeFile(csvFile, data);

      // CSV should be detected with high priority
      const validation = await globalParserRegistry.validateFile(csvFile);
      
      expect(validation.supported).toBe(true);
      if (validation.bestMatch) {
        expect(validation.bestMatch.format).toBe('csv');
      }
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty files', async () => {
      const testFile = path.join(testDataDir, 'empty.json');
      await fs.writeFile(testFile, '');

      const detector = new JSONDetector();
      const result = await detector.detect(testFile);

      expect(result.format).toBe('json');
      expect(result.confidence).toBe(0);
    });

    test('should handle very large files (sample reading)', async () => {
      const testFile = path.join(testDataDir, 'large.json');
      const largeObject = {
        data: Array.from({ length: 10000 }, (_, i) => ({ id: i, value: `item${i}` }))
      };
      await fs.writeFile(testFile, JSON.stringify(largeObject));

      const detector = new JSONDetector();
      const result = await detector.detect(testFile);

      expect(result.format).toBe('json');
      expect(result.confidence).toBeGreaterThan(0.8);
      // Should detect as object type despite large size
      expect(result.metadata.type).toBe('object');
    });

    test('should handle files with unusual encodings', async () => {
      const testFile = path.join(testDataDir, 'encoding-test.json');
      const data = JSON.stringify({ name: 'Café', description: 'Résumé' });
      await fs.writeFile(testFile, data, 'utf8');

      const detector = new JSONDetector();
      const result = await detector.detect(testFile);

      expect(result.format).toBe('json');
      expect(result.confidence).toBeGreaterThan(0.8);
    });
  });

  describe('Confidence Scoring', () => {
    test('should provide appropriate confidence scores', async () => {
      // Perfect JSON should have high confidence
      const perfectJson = path.join(testDataDir, 'perfect.json');
      await fs.writeFile(perfectJson, JSON.stringify({ test: true }));
      
      const detector = new JSONDetector();
      const perfectResult = await detector.detect(perfectJson);
      
      expect(perfectResult.confidence).toBeGreaterThan(0.9);

      // Ambiguous content should have lower confidence
      const ambiguous = path.join(testDataDir, 'ambiguous.txt');
      await fs.writeFile(ambiguous, 'maybe json?');
      
      const ambiguousResult = await detector.detect(ambiguous);
      expect(ambiguousResult.confidence).toBeLessThan(0.5);
    });
  });
});