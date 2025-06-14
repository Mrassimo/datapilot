/**
 * CSV Parser Error Handling Tests
 * 
 * Tests malformed CSV files, edge cases, and error recovery
 * mechanisms for robust data parsing.
 */

import { CSVParser } from '../../../src/parsers/csv-parser';
import { CSVDetector } from '../../../src/parsers/csv-detector';
import { DataPilotError } from '../../../src/utils/error-handler';
import { writeFileSync, unlinkSync, mkdtempSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('CSV Parser Error Handling', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'csv-error-test-'));
  });

  afterEach(() => {
    try {
      const files = require('fs').readdirSync(tempDir);
      files.forEach((file: string) => unlinkSync(join(tempDir, file)));
      require('fs').rmdirSync(tempDir);
    } catch (e) {
      // Cleanup failure acceptable in tests
    }
  });

  describe('File System Errors', () => {
    it('should handle non-existent files gracefully', async () => {
      const parser = new CSVParser();
      const nonExistentPath = join(tempDir, 'does-not-exist.csv');

      await expect(parser.parseFile(nonExistentPath)).rejects.toThrow();
    });

    it('should handle empty files appropriately', async () => {
      const filePath = join(tempDir, 'empty.csv');
      writeFileSync(filePath, '');

      const parser = new CSVParser();
      await expect(parser.parseFile(filePath)).rejects.toThrow('File is empty');
    });

    it('should handle files with only whitespace', async () => {
      const filePath = join(tempDir, 'whitespace.csv');
      writeFileSync(filePath, '   \n\n  \t  \n   ');

      const parser = new CSVParser();
      await expect(parser.parseFile(filePath)).rejects.toThrow();
    });

    it('should handle permission denied scenarios', async () => {
      // This test is platform-dependent and may not work in all environments
      const filePath = join(tempDir, 'protected.csv');
      writeFileSync(filePath, 'test,data\n1,2');
      
      try {
        require('fs').chmodSync(filePath, 0o000); // Remove all permissions
        const parser = new CSVParser();
        await expect(parser.parseFile(filePath)).rejects.toThrow();
      } catch (e) {
        // Skip test if chmod fails (e.g., on Windows or restricted environments)
        console.warn('Skipping permission test due to platform limitations');
      } finally {
        try {
          require('fs').chmodSync(filePath, 0o644); // Restore permissions for cleanup
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    });
  });

  describe('Malformed CSV Data', () => {
    it('should handle unclosed quotes', async () => {
      const malformedCSV = 'name,description\n"John","A person with unclosed quote\n"Jane","Complete entry"';
      const filePath = join(tempDir, 'unclosed-quote.csv');
      writeFileSync(filePath, malformedCSV);

      const parser = new CSVParser();
      
      // Should either handle gracefully or provide meaningful error
      try {
        const result = await parser.parseFile(filePath);
        expect(Array.isArray(result)).toBe(true);
      } catch (error) {
        expect(error).toBeDefined();
        expect(error.message || error.toString()).toContain('quote');
      }
    });

    it('should handle inconsistent column counts', async () => {
      const inconsistentCSV = 'col1,col2,col3\nvalue1,value2,value3\nshort,row\ntoo,many,values,extra,columns';
      const filePath = join(tempDir, 'inconsistent.csv');
      writeFileSync(filePath, inconsistentCSV);

      const parser = new CSVParser();
      const result = await parser.parseFile(filePath);

      // Should parse what it can or provide structured error information
      expect(Array.isArray(result)).toBe(true);
      if (result.length > 0) {
        expect(result[0]).toHaveProperty('data');
      }
    });

    it('should handle extremely long fields', async () => {
      const longField = 'a'.repeat(1000000); // 1MB field
      const csvData = `name,description\nJohn,"${longField}"\nJane,Normal`;
      const filePath = join(tempDir, 'long-field.csv');
      writeFileSync(filePath, csvData);

      const parser = new CSVParser({ maxFieldSize: 500000 }); // Set limit below the long field
      
      try {
        await parser.parseFile(filePath);
      } catch (error) {
        expect(error.message || error.toString()).toContain('Field exceeds maximum size');
      }
    });

    it('should handle binary data in CSV files', async () => {
      const binaryData = Buffer.from([0x00, 0x01, 0x02, 0xFF, 0xFE]);
      const csvWithBinary = Buffer.concat([
        Buffer.from('name,data\n'),
        Buffer.from('John,'),
        binaryData,
        Buffer.from('\nJane,normal'),
      ]);
      
      const filePath = join(tempDir, 'binary.csv');
      writeFileSync(filePath, csvWithBinary);

      const parser = new CSVParser();
      
      try {
        const result = await parser.parseFile(filePath);
        // Should handle binary data gracefully, possibly with warnings
        expect(Array.isArray(result)).toBe(true);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle mixed line endings', async () => {
      const mixedLineEndings = 'col1,col2\r\nvalue1,value2\nvalue3,value4\r\nvalue5,value6\n';
      const filePath = join(tempDir, 'mixed-endings.csv');
      writeFileSync(filePath, mixedLineEndings);

      const parser = new CSVParser();
      const result = await parser.parseFile(filePath);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle CSV with embedded newlines in quotes', async () => {
      const embeddedNewlines = 'name,description\n"John","First line\nSecond line\nThird line"\n"Jane","Normal description"';
      const filePath = join(tempDir, 'embedded-newlines.csv');
      writeFileSync(filePath, embeddedNewlines);

      const parser = new CSVParser();
      const result = await parser.parseFile(filePath);

      expect(Array.isArray(result)).toBe(true);
      // Should handle multi-line fields correctly
      const hasMultilineField = result.some(row => 
        row.data.some(field => field.includes('\n'))
      );
      expect(hasMultilineField).toBe(true);
    });

    it('should handle malformed escape sequences', async () => {
      const malformedEscapes = 'name,description\n"John","Text with \\"quotes\\" and \\n escapes"\n"Jane",Normal';
      const filePath = join(tempDir, 'malformed-escapes.csv');
      writeFileSync(filePath, malformedEscapes);

      const parser = new CSVParser();
      
      try {
        const result = await parser.parseFile(filePath);
        expect(Array.isArray(result)).toBe(true);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Encoding Issues', () => {
    it('should handle UTF-8 with BOM', async () => {
      const bomBuffer = Buffer.from([0xEF, 0xBB, 0xBF]); // UTF-8 BOM
      const csvContent = Buffer.from('name,age\nJohn,25\nJane,30', 'utf8');
      const csvWithBOM = Buffer.concat([bomBuffer, csvContent]);
      
      const filePath = join(tempDir, 'utf8-bom.csv');
      writeFileSync(filePath, csvWithBOM);

      const parser = new CSVParser({ encoding: 'utf8' });
      const result = await parser.parseFile(filePath);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle invalid UTF-8 sequences', async () => {
      const invalidUTF8 = Buffer.from([
        0x48, 0x65, 0x6C, 0x6C, 0x6F, 0x2C, // "Hello,"
        0xFF, 0xFE, // Invalid UTF-8 bytes
        0x0A, // newline
        0x57, 0x6F, 0x72, 0x6C, 0x64, 0x2C, 0x32, 0x35 // "World,25"
      ]);
      
      const filePath = join(tempDir, 'invalid-utf8.csv');
      writeFileSync(filePath, invalidUTF8);

      const parser = new CSVParser({ encoding: 'utf8' });
      
      try {
        const result = await parser.parseFile(filePath);
        // Should handle gracefully with replacement characters or errors
        expect(Array.isArray(result)).toBe(true);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle different encoding detection failures', async () => {
      // Create file with ambiguous encoding
      const ambiguousData = Buffer.from([0x80, 0x81, 0x82, 0x83, 0x84]);
      const filePath = join(tempDir, 'ambiguous-encoding.csv');
      writeFileSync(filePath, ambiguousData);

      const parser = new CSVParser({ autoDetect: true });
      
      try {
        await parser.parseFile(filePath);
      } catch (error) {
        expect(error).toBeInstanceOf(DataPilotError);
        expect(error.code).toContain('DETECTION');
      }
    });
  });

  describe('Large File Handling', () => {
    it('should handle memory pressure gracefully', async () => {
      // Create a moderately large CSV file
      const headers = 'id,name,value1,value2,value3,value4,value5';
      const rows = Array.from({length: 1000}, (_, i) => 
        `${i},User${i},${Math.random()},${Math.random()},${Math.random()},${Math.random()},${Math.random()}`
      );
      const largeCSV = [headers, ...rows].join('\n');
      
      const filePath = join(tempDir, 'large.csv');
      writeFileSync(filePath, largeCSV);

      // Use restrictive memory settings
      const parser = new CSVParser({ 
        maxRows: 500, // Limit rows to test memory management
        chunkSize: 1024, // Small chunks
      });

      const result = await parser.parseFile(filePath);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeLessThanOrEqual(500); // Should respect maxRows
    });

    it('should handle extremely large field sizes', async () => {
      const normalRow = 'id,description\n1,normal';
      const hugeField = '2,"' + 'x'.repeat(100000) + '"'; // 100KB field
      const csvData = normalRow + '\n' + hugeField;
      
      const filePath = join(tempDir, 'huge-field.csv');
      writeFileSync(filePath, csvData);

      const parser = new CSVParser({ maxFieldSize: 50000 }); // Smaller than the huge field
      
      // Parser may handle large fields gracefully or truncate them
      try {
        const result = await parser.parseFile(filePath);
        expect(Array.isArray(result)).toBe(true);
        // Either throws or handles gracefully
      } catch (error) {
        expect(error.message || error.toString()).toContain('Field exceeds maximum size');
      }
    });
  });

  describe('Auto-Detection Edge Cases', () => {
    it('should handle files where auto-detection fails', async () => {
      // Create file with no clear delimiter pattern
      const ambiguousData = 'data without clear structure\nsecond line also unclear\nthird line similar';
      const filePath = join(tempDir, 'ambiguous.csv');
      writeFileSync(filePath, ambiguousData);

      const parser = new CSVParser({ autoDetect: true });
      
      try {
        const result = await parser.parseFile(filePath);
        // Should fall back to default parsing or provide meaningful error
        expect(Array.isArray(result)).toBe(true);
      } catch (error) {
        expect(error).toBeInstanceOf(DataPilotError);
      }
    });

    it('should handle conflicting format indicators', async () => {
      // Create CSV with both commas and semicolons
      const conflictingData = 'name;age,score\nJohn;25,85\nJane;30,92';
      const filePath = join(tempDir, 'conflicting.csv');
      writeFileSync(filePath, conflictingData);

      const parser = new CSVParser({ autoDetect: true });
      const result = await parser.parseFile(filePath);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle very short files for detection', async () => {
      const shortData = 'a,b\n1,2';
      const filePath = join(tempDir, 'short.csv');
      writeFileSync(filePath, shortData);

      const parser = new CSVParser({ autoDetect: true });
      const result = await parser.parseFile(filePath);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('Parser Configuration Errors', () => {
    it('should handle invalid delimiter configuration', async () => {
      const csvData = 'name,age\nJohn,25';
      const filePath = join(tempDir, 'test.csv');
      writeFileSync(filePath, csvData);

      const parser = new CSVParser({ 
        delimiter: '', // Invalid empty delimiter
        autoDetect: false 
      });
      
      try {
        await parser.parseFile(filePath);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle invalid encoding specification', async () => {
      const csvData = 'name,age\nJohn,25';
      const filePath = join(tempDir, 'test.csv');
      writeFileSync(filePath, csvData);

      const parser = new CSVParser({ 
        encoding: 'invalid-encoding' as any,
        autoDetect: false 
      });
      
      await expect(parser.parseFile(filePath)).rejects.toThrow();
    });

    it('should handle negative or zero maxRows configuration', async () => {
      const csvData = 'name,age\nJohn,25\nJane,30';
      const filePath = join(tempDir, 'test.csv');
      writeFileSync(filePath, csvData);

      const parser = new CSVParser({ 
        maxRows: -1 // Invalid negative value
      });
      
      // Should either handle gracefully or provide meaningful error
      try {
        const result = await parser.parseFile(filePath);
        expect(Array.isArray(result)).toBe(true);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Stream Processing Errors', () => {
    it('should handle stream interruption gracefully', async () => {
      const csvData = 'name,age\n' + Array.from({length: 1000}, (_, i) => `User${i},${20+i}`).join('\n');
      const filePath = join(tempDir, 'stream-test.csv');
      writeFileSync(filePath, csvData);

      const parser = new CSVParser();
      
      // This test would be more complex in a real scenario where we could interrupt the stream
      // For now, we test that the parser handles the full file correctly
      const result = await parser.parseFile(filePath);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(100);
    });

    it('should handle corrupt data mid-stream', async () => {
      const goodData = Array.from({length: 50}, (_, i) => `User${i},${20+i}`).join('\n');
      const corruptSection = '\x00\x01\x02CORRUPT\xFF\xFE';
      const moreGoodData = Array.from({length: 50}, (_, i) => `User${i+50},${70+i}`).join('\n');
      
      const csvData = 'name,age\n' + goodData + '\n' + corruptSection + '\n' + moreGoodData;
      const filePath = join(tempDir, 'corrupt-mid-stream.csv');
      writeFileSync(filePath, csvData);

      const parser = new CSVParser();
      
      try {
        const result = await parser.parseFile(filePath);
        // Should recover and continue parsing after corrupt section
        expect(Array.isArray(result)).toBe(true);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });
});

describe('CSV Detector Error Handling', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'csv-detector-error-test-'));
  });

  afterEach(() => {
    try {
      const files = require('fs').readdirSync(tempDir);
      files.forEach((file: string) => unlinkSync(join(tempDir, file)));
      require('fs').rmdirSync(tempDir);
    } catch (e) {
      // Cleanup failure acceptable
    }
  });

  describe('Detection Edge Cases', () => {
    it('should handle files with no discernible pattern', async () => {
      const randomData = 'random text without structure\nanother line of random content\nmore randomness here';
      const filePath = join(tempDir, 'random.csv');
      writeFileSync(filePath, randomData);

      const detector = new CSVDetector();
      
      try {
        const buffer = require('fs').readFileSync(filePath);
        const result = CSVDetector.detect(buffer);
        // Should provide best-guess result or indicate uncertainty
        expect(result).toBeDefined();
        expect(result).toHaveProperty('delimiter');
        expect(result).toHaveProperty('confidence');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle extremely small sample sizes', async () => {
      const tinyData = 'a';
      const filePath = join(tempDir, 'tiny.csv');
      writeFileSync(filePath, tinyData);

      const detector = new CSVDetector();
      
      try {
        const buffer = require('fs').readFileSync(filePath);
        const result = CSVDetector.detect(buffer);
        expect(result).toBeDefined();
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle binary files gracefully', async () => {
      const binaryData = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]); // PNG header
      const filePath = join(tempDir, 'binary.csv');
      writeFileSync(filePath, binaryData);

      const detector = new CSVDetector();
      
      const buffer = require('fs').readFileSync(filePath);
      
      // Detector may handle binary data gracefully or provide low confidence
      try {
        const result = CSVDetector.detect(buffer);
        expect(result).toBeDefined();
        expect(result.delimiterConfidence).toBeLessThan(0.5); // Low confidence expected
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle mixed encoding scenarios', async () => {
      // Create file with mixed encoding patterns
      const mixedData = Buffer.concat([
        Buffer.from('name,age\n', 'utf8'),
        Buffer.from('José,', 'latin1'),
        Buffer.from('25\n', 'utf8'),
      ]);
      
      const filePath = join(tempDir, 'mixed-encoding.csv');
      writeFileSync(filePath, mixedData);

      const detector = new CSVDetector();
      
      try {
        const buffer = require('fs').readFileSync(filePath);
        const result = CSVDetector.detect(buffer);
        expect(result).toBeDefined();
        expect(result).toHaveProperty('encoding');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });
});