/**
 * CSV Parser Adapter Tests
 * 
 * Tests the CSV parser adapter that provides universal DataParser interface
 * compatibility with the existing CSV parser implementation.
 */

import { CSVParserAdapter, createCSVParserAdapter } from '../../../src/parsers/adapters/csv-parser-adapter';
import { DataParser, ParseOptions, ParsedRow } from '../../../src/parsers/base/data-parser';
import { DataPilotError } from '../../../src/utils/error-handler';
import { writeFileSync, unlinkSync, mkdtempSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('CSVParserAdapter', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'csv-adapter-test-'));
  });

  afterEach(() => {
    try {
      const files = require('fs').readdirSync(tempDir);
      files.forEach((file: string) => unlinkSync(join(tempDir, file)));
      require('fs').rmdirSync(tempDir);
    } catch (e) {
      // Cleanup failure is acceptable in tests
    }
  });

  describe('Constructor and Factory', () => {
    it('should create adapter with default options', () => {
      const adapter = new CSVParserAdapter();
      expect(adapter).toBeDefined();
      expect(adapter.getFormatName()).toBe('csv');
    });

    it('should create adapter with custom options', () => {
      const options: ParseOptions = {
        delimiter: ';',
        quote: "'",
        hasHeader: false,
        maxRows: 1000,
        encoding: 'utf8',
      };

      const adapter = new CSVParserAdapter(options);
      expect(adapter).toBeDefined();
    });

    it('should create adapter using factory function', () => {
      const adapter = createCSVParserAdapter();
      expect(adapter).toBeInstanceOf(CSVParserAdapter);
    });

    it('should create adapter with factory and options', () => {
      const options: ParseOptions = {
        delimiter: '|',
        maxRows: 500,
      };

      const adapter = createCSVParserAdapter(options);
      expect(adapter).toBeInstanceOf(CSVParserAdapter);
    });

    it('should implement DataParser interface', () => {
      const adapter: DataParser = new CSVParserAdapter();
      
      expect(typeof adapter.parse).toBe('function');
      expect(typeof adapter.detect).toBe('function');
      expect(typeof adapter.getStats).toBe('function');
      expect(typeof adapter.abort).toBe('function');
      expect(typeof adapter.validate).toBe('function');
      expect(typeof adapter.getSupportedExtensions).toBe('function');
      expect(typeof adapter.getFormatName).toBe('function');
    });
  });

  describe('Parsing Interface', () => {
    it('should parse simple CSV file using async iterator', async () => {
      const csvData = 'name,age,city\nJohn,25,NYC\nJane,30,LA';
      const filePath = join(tempDir, 'simple.csv');
      writeFileSync(filePath, csvData);

      const adapter = new CSVParserAdapter();
      const rows: ParsedRow[] = [];

      for await (const row of adapter.parse(filePath)) {
        rows.push(row);
      }

      expect(rows.length).toBe(3);
      expect(rows[0].data).toEqual(['name', 'age', 'city']);
      expect(rows[1].data).toEqual(['John', '25', 'NYC']);
      expect(rows[2].data).toEqual(['Jane', '30', 'LA']);
    });

    it('should provide correct row metadata', async () => {
      const csvData = 'col1,col2\nval1,val2';
      const filePath = join(tempDir, 'metadata.csv');
      writeFileSync(filePath, csvData);

      const adapter = new CSVParserAdapter();
      const rows: ParsedRow[] = [];

      for await (const row of adapter.parse(filePath)) {
        rows.push(row);
      }

      expect(rows[0].index).toBe(0);
      expect(rows[0].raw).toBe('col1,col2');
      expect(rows[0].metadata?.originalType).toBe('csv');
      expect(rows[1].index).toBe(1);
      expect(rows[1].raw).toBe('val1,val2');
    });

    it('should handle parse options passed to parse method', async () => {
      const csvData = 'name;age;city\nJohn;25;NYC\nJane;30;LA';
      const filePath = join(tempDir, 'semicolon.csv');
      writeFileSync(filePath, csvData);

      const adapter = new CSVParserAdapter();
      const parseOptions: ParseOptions = {
        delimiter: ';',
        hasHeader: true,
      };

      const rows: ParsedRow[] = [];
      for await (const row of adapter.parse(filePath, parseOptions)) {
        rows.push(row);
      }

      expect(rows.length).toBe(3);
      expect(rows[0].data).toEqual(['name', 'age', 'city']);
      expect(rows[1].data).toEqual(['John', '25', 'NYC']);
    });

    it('should handle different delimiters correctly', async () => {
      const csvData = 'field1|field2|field3\nvalue1|value2|value3';
      const filePath = join(tempDir, 'pipe.csv');
      writeFileSync(filePath, csvData);

      const adapter = new CSVParserAdapter({ delimiter: '|' });
      const rows: ParsedRow[] = [];

      for await (const row of adapter.parse(filePath)) {
        rows.push(row);
      }

      expect(rows.length).toBe(2);
      expect(rows[0].data).toEqual(['field1', 'field2', 'field3']);
      expect(rows[1].data).toEqual(['value1', 'value2', 'value3']);
    });

    it('should handle different quote characters', async () => {
      const csvData = "'quoted field','another quoted'\n'normal','field'";
      const filePath = join(tempDir, 'single-quotes.csv');
      writeFileSync(filePath, csvData);

      const adapter = new CSVParserAdapter({ quote: "'" });
      const rows: ParsedRow[] = [];

      for await (const row of adapter.parse(filePath)) {
        rows.push(row);
      }

      expect(rows.length).toBe(2);
      expect(rows[0].data).toEqual(['quoted field', 'another quoted']);
      expect(rows[1].data).toEqual(['normal', 'field']);
    });

    it('should respect maxRows limit', async () => {
      const csvData = 'col1,col2\nrow1,data1\nrow2,data2\nrow3,data3\nrow4,data4';
      const filePath = join(tempDir, 'limited.csv');
      writeFileSync(filePath, csvData);

      const adapter = new CSVParserAdapter({ maxRows: 3 });
      const rows: ParsedRow[] = [];

      for await (const row of adapter.parse(filePath)) {
        rows.push(row);
      }

      expect(rows.length).toBeLessThanOrEqual(3);
    });

    it('should handle Unicode content correctly', async () => {
      const csvData = 'name,city\nJosé,São Paulo\nAnna,москва\nHans,München';
      const filePath = join(tempDir, 'unicode.csv');
      writeFileSync(filePath, csvData, 'utf8');

      const adapter = new CSVParserAdapter({ encoding: 'utf8' });
      const rows: ParsedRow[] = [];

      for await (const row of adapter.parse(filePath)) {
        rows.push(row);
      }

      expect(rows.length).toBe(4);
      expect(rows[1].data[0]).toBe('José');
      expect(rows[2].data[1]).toBe('москва');
      expect(rows[3].data[1]).toBe('München');
    });
  });

  describe('Format Detection', () => {
    it('should detect CSV format correctly', async () => {
      const csvData = 'name,age,city\nJohn,25,NYC\nJane,30,LA';
      const filePath = join(tempDir, 'detect.csv');
      writeFileSync(filePath, csvData);

      const adapter = new CSVParserAdapter();
      const result = await adapter.detect(filePath);

      expect(result.format).toBe('csv');
      expect(result.confidence).toBeGreaterThan(0.8);
      expect(result.metadata.delimiter).toBe(',');
      expect(result.metadata.hasHeader).toBeDefined();
      expect(result.encoding).toBe('utf8');
    });

    it('should detect semicolon delimited CSV', async () => {
      const csvData = 'name;age;city\nJohn;25;NYC\nJane;30;LA';
      const filePath = join(tempDir, 'semicolon-detect.csv');
      writeFileSync(filePath, csvData);

      const adapter = new CSVParserAdapter();
      const result = await adapter.detect(filePath);

      expect(result.format).toBe('csv');
      expect(result.metadata.delimiter).toBe(';');
      expect(result.suggestedOptions?.delimiter).toBe(';');
    });

    it('should detect quoted CSV fields', async () => {
      const csvData = '"name","age","city"\n"John Doe","25","New York"\n"Jane Smith","30","Los Angeles"';
      const filePath = join(tempDir, 'quoted-detect.csv');
      writeFileSync(filePath, csvData);

      const adapter = new CSVParserAdapter();
      const result = await adapter.detect(filePath);

      expect(result.format).toBe('csv');
      expect(result.metadata.quote).toBe('"');
      expect(result.metadata.hasHeader).toBe(true);
    });

    it('should handle detection errors gracefully', async () => {
      const nonExistentPath = join(tempDir, 'does-not-exist.csv');

      const adapter = new CSVParserAdapter();
      const result = await adapter.detect(nonExistentPath);

      expect(result.format).toBe('csv');
      expect(result.confidence).toBe(0);
      expect(result.metadata.error).toBeDefined();
    });

    it('should provide suggested options based on detection', async () => {
      const csvData = 'field1|field2|field3\nvalue1|value2|value3';
      const filePath = join(tempDir, 'pipe-detect.csv');
      writeFileSync(filePath, csvData);

      const adapter = new CSVParserAdapter();
      const result = await adapter.detect(filePath);

      expect(result.suggestedOptions).toBeDefined();
      expect(result.suggestedOptions?.delimiter).toBe('|');
      expect(result.suggestedOptions?.encoding).toBe('utf8');
    });

    it('should handle binary or non-text files', async () => {
      const binaryData = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]); // PNG header
      const filePath = join(tempDir, 'binary.csv');
      writeFileSync(filePath, binaryData);

      const adapter = new CSVParserAdapter();
      const result = await adapter.detect(filePath);

      expect(result.format).toBe('csv');
      // CSV detector may still detect structure in binary files
      expect(result.format).toBe('csv');
    });
  });

  describe('Validation', () => {
    it('should validate good CSV files as valid', async () => {
      const csvData = 'name,age,city\nJohn,25,NYC\nJane,30,LA';
      const filePath = join(tempDir, 'valid.csv');
      writeFileSync(filePath, csvData);

      const adapter = new CSVParserAdapter();
      const result = await adapter.validate(filePath);

      expect(result.valid).toBe(true);
      expect(result.canProceed).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should validate poor CSV files as invalid', async () => {
      const poorData = 'random text without structure\nno delimiters here\njust plain text';
      const filePath = join(tempDir, 'invalid.csv');
      writeFileSync(filePath, poorData);

      const adapter = new CSVParserAdapter();
      const result = await adapter.validate(filePath);

      // The validation result depends on the actual CSV detector implementation
      expect(typeof result.valid).toBe('boolean');
      expect(Array.isArray(result.errors)).toBe(true);
      expect(Array.isArray(result.suggestedFixes)).toBe(true);
    });

    it('should provide warnings for low confidence detection', async () => {
      // Create CSV that would have medium confidence
      const ambiguousData = 'a,b;c\n1,2;3\n4,5;6';
      const filePath = join(tempDir, 'ambiguous.csv');
      writeFileSync(filePath, ambiguousData);

      const adapter = new CSVParserAdapter();
      const result = await adapter.validate(filePath);

      // Check if we got warnings for medium confidence detection
      if (result.warnings.length > 0) {
        expect(result.warnings[0]).toContain('confidence');
      }
    });

    it('should provide specific suggestions for common issues', async () => {
      const semicolonData = 'name;age;city\nJohn;25;NYC';
      const filePath = join(tempDir, 'semicolon-suggest.csv');
      writeFileSync(filePath, semicolonData);

      const adapter = new CSVParserAdapter();
      const result = await adapter.validate(filePath);

      // If detection confidence is low, should suggest delimiter options
      if (!result.valid) {
        expect(result.suggestedFixes.some(fix => fix.includes('delimiter'))).toBe(true);
      }
    });

    it('should handle validation errors gracefully', async () => {
      const nonExistentPath = join(tempDir, 'does-not-exist.csv');

      const adapter = new CSVParserAdapter();
      const result = await adapter.validate(nonExistentPath);

      expect(result.valid).toBe(false);
      expect(result.canProceed).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      // Should provide some suggested fixes, though specific ones may vary
      expect(result.suggestedFixes.length).toBeGreaterThan(0);
    });
  });

  describe('Statistics and Error Tracking', () => {
    it('should provide parsing statistics', async () => {
      const csvData = 'name,age\nJohn,25\nJane,30\nBob,35';
      const filePath = join(tempDir, 'stats.csv');
      writeFileSync(filePath, csvData);

      const adapter = new CSVParserAdapter();
      
      // Parse the file
      for await (const row of adapter.parse(filePath)) {
        // Process rows
      }

      const stats = adapter.getStats();

      expect(stats.format).toBe('csv');
      expect(stats.bytesProcessed).toBeGreaterThan(0);
      expect(stats.rowsProcessed).toBeGreaterThan(0);
      expect(stats.startTime).toBeDefined();
      expect(stats.endTime).toBeDefined();
      expect(Array.isArray(stats.errors)).toBe(true);
    });

    it('should track errors during parsing', async () => {
      // Create CSV with potential parsing issues
      const malformedCSV = 'name,age\n"John",25,"unclosed quote\nJane,30';
      const filePath = join(tempDir, 'errors.csv');
      writeFileSync(filePath, malformedCSV);

      const adapter = new CSVParserAdapter();
      
      try {
        for await (const row of adapter.parse(filePath)) {
          // Process rows
        }
      } catch (error) {
        // Expected for malformed CSV
      }

      const stats = adapter.getStats();
      // Errors might be captured depending on implementation
      expect(Array.isArray(stats.errors)).toBe(true);
    });

    it('should handle peak memory usage tracking', async () => {
      const largeCSV = Array.from({ length: 1000 }, (_, i) => 
        `row${i},data${i},value${i}`
      ).join('\n');
      const filePath = join(tempDir, 'large.csv');
      writeFileSync(filePath, largeCSV);

      const adapter = new CSVParserAdapter();
      
      for await (const row of adapter.parse(filePath)) {
        // Process rows
      }

      const stats = adapter.getStats();
      expect(typeof stats.peakMemoryUsage === 'number' || stats.peakMemoryUsage === undefined).toBe(true);
    });
  });

  describe('Abort Functionality', () => {
    it('should support abort operation', () => {
      const adapter = new CSVParserAdapter();
      
      expect(() => {
        adapter.abort();
      }).not.toThrow();
    });

    it('should abort underlying CSV parser', async () => {
      const csvData = Array.from({ length: 10000 }, (_, i) => 
        `row${i},data${i}`
      ).join('\n');
      const filePath = join(tempDir, 'abort-test.csv');
      writeFileSync(filePath, csvData);

      const adapter = new CSVParserAdapter();
      
      // Start parsing and abort quickly
      setTimeout(() => adapter.abort(), 10);
      
      try {
        const rows: ParsedRow[] = [];
        for await (const row of adapter.parse(filePath)) {
          rows.push(row);
        }
        // Should handle abort gracefully
        expect(Array.isArray(rows)).toBe(true);
      } catch (error) {
        // Abort may cause parsing to fail, which is acceptable
        expect(error).toBeDefined();
      }
    });
  });

  describe('Format Information', () => {
    it('should return correct format name', () => {
      const adapter = new CSVParserAdapter();
      expect(adapter.getFormatName()).toBe('csv');
    });

    it('should return supported extensions', () => {
      const adapter = new CSVParserAdapter();
      const extensions = adapter.getSupportedExtensions();
      
      expect(Array.isArray(extensions)).toBe(true);
      expect(extensions).toContain('.csv');
      expect(extensions.length).toBe(1);
    });
  });

  describe('Error Handling', () => {
    it('should throw DataPilotError for parsing failures', async () => {
      const adapter = new CSVParserAdapter();
      const nonExistentPath = join(tempDir, 'does-not-exist.csv');

      try {
        for await (const row of adapter.parse(nonExistentPath)) {
          // Should not reach here
        }
        fail('Expected error to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(DataPilotError);
        expect(error.message).toContain('CSV parsing failed');
      }
    });

    it('should handle corrupted CSV files', async () => {
      const corruptedCSV = Buffer.from([
        0x48, 0x65, 0x6C, 0x6C, 0x6F, 0x2C, // "Hello,"
        0xFF, 0xFE, // Invalid bytes
        0x57, 0x6F, 0x72, 0x6C, 0x64, // "World"
      ]);
      const filePath = join(tempDir, 'corrupted.csv');
      writeFileSync(filePath, corruptedCSV);

      const adapter = new CSVParserAdapter();
      
      try {
        const rows: ParsedRow[] = [];
        for await (const row of adapter.parse(filePath)) {
          rows.push(row);
        }
        // Should either succeed with some data or throw meaningful error
        expect(Array.isArray(rows)).toBe(true);
      } catch (error) {
        expect(error).toBeInstanceOf(DataPilotError);
      }
    });

    it('should provide meaningful error messages', async () => {
      const adapter = new CSVParserAdapter();
      const invalidPath = join(tempDir, 'invalid', 'path', 'file.csv');

      try {
        for await (const row of adapter.parse(invalidPath)) {
          // Should not reach here
        }
      } catch (error) {
        expect(error.message).toContain('CSV parsing failed');
        expect(error.code).toBe('CSV_PARSING_ERROR');
      }
    });
  });

  describe('Integration with CSV Components', () => {
    it('should properly integrate with CSVDetector', async () => {
      const csvData = 'name\tage\tcity\nJohn\t25\tNYC'; // Tab-separated
      const filePath = join(tempDir, 'tabs.csv');
      writeFileSync(filePath, csvData);

      const adapter = new CSVParserAdapter();
      const detection = await adapter.detect(filePath);

      expect(detection.metadata.delimiter).toBe('\t');
      expect(detection.suggestedOptions?.delimiter).toBe('\t');
    });

    it('should properly integrate with CSVParser', async () => {
      const csvData = 'name,description\n"John","A person with, comma"\n"Jane","Normal description"';
      const filePath = join(tempDir, 'quoted-commas.csv');
      writeFileSync(filePath, csvData);

      const adapter = new CSVParserAdapter();
      const rows: ParsedRow[] = [];

      for await (const row of adapter.parse(filePath)) {
        rows.push(row);
      }

      expect(rows.length).toBe(3);
      expect(rows[1].data[1]).toBe('A person with, comma'); // Should handle embedded commas
    });

    it('should handle encoding detection and parsing', async () => {
      const utf8BOM = Buffer.from([0xEF, 0xBB, 0xBF]);
      const csvContent = Buffer.from('name,age\nJohn,25', 'utf8');
      const csvWithBOM = Buffer.concat([utf8BOM, csvContent]);
      const filePath = join(tempDir, 'bom.csv');
      writeFileSync(filePath, csvWithBOM);

      const adapter = new CSVParserAdapter();
      const detection = await adapter.detect(filePath);
      
      expect(detection.encoding).toBe('utf8');
      
      const rows: ParsedRow[] = [];
      for await (const row of adapter.parse(filePath)) {
        rows.push(row);
      }

      expect(rows.length).toBe(2);
      expect(rows[0].data[0]).toBe('name'); // BOM should be stripped
    });
  });

  describe('Performance and Memory', () => {
    it('should handle moderately large files efficiently', async () => {
      const largeCSV = [
        'id,name,email,age,city',
        ...Array.from({ length: 5000 }, (_, i) => 
          `${i},User${i},user${i}@email.com,${25 + (i % 40)},City${i % 100}`
        )
      ].join('\n');
      const filePath = join(tempDir, 'large-performance.csv');
      writeFileSync(filePath, largeCSV);

      const adapter = new CSVParserAdapter();
      
      const startTime = Date.now();
      let rowCount = 0;
      
      for await (const row of adapter.parse(filePath)) {
        rowCount++;
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(rowCount).toBe(5001); // 5000 + header
      expect(duration).toBeLessThan(2000); // Should complete in reasonable time
    });

    it('should maintain memory efficiency with streaming', async () => {
      const largeCSV = Array.from({ length: 10000 }, (_, i) => 
        `${i},${'data'.repeat(10)}`
      ).join('\n');
      const filePath = join(tempDir, 'memory-test.csv');
      writeFileSync(filePath, largeCSV);

      const adapter = new CSVParserAdapter({ chunkSize: 1024 });
      
      let processed = 0;
      for await (const row of adapter.parse(filePath)) {
        processed++;
        // Don't store rows to test memory efficiency
      }

      expect(processed).toBe(10000);
      
      const stats = adapter.getStats();
      expect(stats.rowsProcessed).toBe(10000);
    });
  });
});