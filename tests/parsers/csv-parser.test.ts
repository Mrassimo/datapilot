import { CSVParser } from '../../src/parsers/csv-parser';
import { writeFileSync, unlinkSync, mkdtempSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('CSVParser', () => {
  let tempDir: string;
  let tempFile: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'datapilot-test-'));
    tempFile = join(tempDir, 'test.csv');
  });

  afterEach(() => {
    try {
      unlinkSync(tempFile);
    } catch (e) {
      // File might not exist
    }
  });

  describe('Basic CSV Parsing', () => {
    it('should parse simple CSV data', () => {
      const csvData = 'name,age,city\nJohn,25,London\nJane,30,Paris';
      const parser = new CSVParser({ autoDetect: false });
      
      const rows = parser.parseString(csvData);
      
      expect(rows).toHaveLength(3);
      expect(rows[0].data).toEqual(['name', 'age', 'city']);
      expect(rows[1].data).toEqual(['John', '25', 'London']);
      expect(rows[2].data).toEqual(['Jane', '30', 'Paris']);
    });

    it('should handle quoted fields with commas', () => {
      const csvData = 'name,description\n"John Doe","A person, who lives in London"';
      const parser = new CSVParser({ autoDetect: false });
      
      const rows = parser.parseString(csvData);
      
      expect(rows).toHaveLength(2);
      expect(rows[1].data).toEqual(['John Doe', 'A person, who lives in London']);
    });

    it('should handle escaped quotes', () => {
      const csvData = 'name,quote\n"John","He said ""Hello"" to me"';
      const parser = new CSVParser({ autoDetect: false });
      
      const rows = parser.parseString(csvData);
      
      expect(rows).toHaveLength(2);
      expect(rows[1].data).toEqual(['John', 'He said "Hello" to me']);
    });

    it('should handle multiline quoted fields', () => {
      const csvData = 'name,address\n"John","123 Main St\nAnytown, ST 12345"';
      const parser = new CSVParser({ autoDetect: false });
      
      const rows = parser.parseString(csvData);
      
      expect(rows).toHaveLength(2);
      expect(rows[1].data).toEqual(['John', '123 Main St\nAnytown, ST 12345']);
    });

    it('should handle different delimiters', () => {
      const csvData = 'name;age;city\nJohn;25;London';
      const parser = new CSVParser({ delimiter: ';', autoDetect: false });
      
      const rows = parser.parseString(csvData);
      
      expect(rows).toHaveLength(2);
      expect(rows[1].data).toEqual(['John', '25', 'London']);
    });

    it('should trim fields when configured', () => {
      const csvData = 'name, age , city\n John , 25 , London ';
      const parser = new CSVParser({ trimFields: true, autoDetect: false });
      
      const rows = parser.parseString(csvData);
      
      expect(rows[1].data).toEqual(['John', '25', 'London']);
    });

    it('should skip empty lines when configured', () => {
      const csvData = 'name,age\nJohn,25\n\n\nJane,30';
      const parser = new CSVParser({ skipEmptyLines: true, autoDetect: false });
      
      const rows = parser.parseString(csvData);
      
      expect(rows).toHaveLength(3);
      expect(rows.map(r => r.data)).toEqual([
        ['name', 'age'],
        ['John', '25'],
        ['Jane', '30'],
      ]);
    });
  });

  describe('File Parsing', () => {
    it('should parse CSV from file', async () => {
      const csvData = 'name,age,city\nJohn,25,London\nJane,30,Paris';
      writeFileSync(tempFile, csvData, 'utf8');
      
      const parser = new CSVParser({ autoDetect: false });
      const rows = await parser.parseFile(tempFile);
      
      expect(rows).toHaveLength(3);
      expect(rows[0].data).toEqual(['name', 'age', 'city']);
    });

    it('should handle large files efficiently', async () => {
      // Generate a larger CSV for performance testing
      let csvData = 'col1,col2,col3,col4,col5\n';
      for (let i = 0; i < 1000; i++) {
        csvData += `value${i},${i},${i * 2},${i * 3},${i * 4}\n`;
      }
      
      writeFileSync(tempFile, csvData, 'utf8');
      
      const parser = new CSVParser({ autoDetect: false });
      const startTime = Date.now();
      const rows = await parser.parseFile(tempFile);
      const endTime = Date.now();
      
      expect(rows).toHaveLength(1001); // Header + 1000 data rows
      expect(endTime - startTime).toBeLessThan(1000); // Should complete in under 1 second
      
      const stats = parser.getStats();
      expect(stats.rowsProcessed).toBe(1001);
      expect(stats.errors).toHaveLength(0);
    });
  });

  describe('Auto-detection', () => {
    it('should auto-detect comma delimiter', async () => {
      const csvData = 'name,age,city\nJohn,25,London';
      writeFileSync(tempFile, csvData, 'utf8');
      
      const parser = new CSVParser({ autoDetect: true });
      await parser.parseFile(tempFile);
      
      const options = parser.getOptions();
      expect(options.delimiter).toBe(',');
    });

    it('should auto-detect semicolon delimiter', async () => {
      const csvData = 'name;age;city\nJohn;25;London';
      writeFileSync(tempFile, csvData, 'utf8');
      
      const parser = new CSVParser({ autoDetect: true });
      await parser.parseFile(tempFile);
      
      const options = parser.getOptions();
      expect(options.delimiter).toBe(';');
    });

    it('should auto-detect tab delimiter', async () => {
      const csvData = 'name\tage\tcity\nJohn\t25\tLondon';
      writeFileSync(tempFile, csvData, 'utf8');
      
      const parser = new CSVParser({ autoDetect: true });
      await parser.parseFile(tempFile);
      
      const options = parser.getOptions();
      expect(options.delimiter).toBe('\t');
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed quotes gracefully', () => {
      const csvData = 'name,description\nJohn,"Unclosed quote\nJane,Normal field';
      const parser = new CSVParser({ autoDetect: false });
      
      const rows = parser.parseString(csvData);
      
      expect(rows.length).toBeGreaterThan(0);
      // Should still parse some data even with errors
    });

    it('should throw error for non-existent file', async () => {
      const parser = new CSVParser();
      
      await expect(parser.parseFile('/nonexistent/file.csv')).rejects.toThrow();
    });

    it('should handle empty files', async () => {
      writeFileSync(tempFile, '', 'utf8');
      
      const parser = new CSVParser();
      
      await expect(parser.parseFile(tempFile)).rejects.toThrow('File is empty');
    });
  });

  describe('Performance Features', () => {
    it('should respect maxRows limit', () => {
      const csvData = 'name,age\nJohn,25\nJane,30\nBob,35';
      const parser = new CSVParser({ maxRows: 2, autoDetect: false });
      
      const rows = parser.parseString(csvData);
      
      expect(rows).toHaveLength(2);
    });

    it('should provide accurate statistics', () => {
      const csvData = 'name,age\nJohn,25\nJane,30';
      const parser = new CSVParser({ autoDetect: false });
      
      parser.parseString(csvData);
      const stats = parser.getStats();
      
      expect(stats.rowsProcessed).toBe(3);
      expect(stats.bytesProcessed).toBe(csvData.length);
      expect(stats.startTime).toBeDefined();
    });
  });

  describe('Streaming Interface', () => {
    it('should create a transform stream', () => {
      const parser = new CSVParser();
      const stream = parser.createStream();
      
      expect(stream).toBeDefined();
      expect(typeof stream.write).toBe('function');
      expect(typeof stream.read).toBe('function');
    });
  });
});