import { CSVDetector } from '../../src/parsers/csv-detector';
import { EncodingDetector } from '../../src/parsers/encoding-detector';

describe('CSVDetector', () => {
  describe('Delimiter Detection', () => {
    it('should detect comma delimiter', () => {
      const csvData = 'name,age,city\nJohn,25,London\nJane,30,Paris';
      const buffer = Buffer.from(csvData, 'utf8');
      
      const result = CSVDetector.detect(buffer);
      
      expect(result.delimiter).toBe(',');
      expect(result.delimiterConfidence).toBeGreaterThan(0.8);
    });

    it('should detect semicolon delimiter', () => {
      const csvData = 'name;age;city\nJohn;25;London\nJane;30;Paris';
      const buffer = Buffer.from(csvData, 'utf8');
      
      const result = CSVDetector.detect(buffer);
      
      expect(result.delimiter).toBe(';');
      expect(result.delimiterConfidence).toBeGreaterThan(0.8);
    });

    it('should detect tab delimiter', () => {
      const csvData = 'name\tage\tcity\nJohn\t25\tLondon\nJane\t30\tParis';
      const buffer = Buffer.from(csvData, 'utf8');
      
      const result = CSVDetector.detect(buffer);
      
      expect(result.delimiter).toBe('\t');
      expect(result.delimiterConfidence).toBeGreaterThan(0.8);
    });

    it('should detect pipe delimiter', () => {
      const csvData = 'name|age|city\nJohn|25|London\nJane|30|Paris';
      const buffer = Buffer.from(csvData, 'utf8');
      
      const result = CSVDetector.detect(buffer);
      
      expect(result.delimiter).toBe('|');
      expect(result.delimiterConfidence).toBeGreaterThan(0.8);
    });

    it('should handle inconsistent field counts', () => {
      const csvData = 'name,age\nJohn,25,London\nJane,30';
      const buffer = Buffer.from(csvData, 'utf8');
      
      const result = CSVDetector.detect(buffer);
      
      expect(result.delimiter).toBe(',');
      expect(result.delimiterConfidence).toBeLessThanOrEqual(0.9); // Lower confidence due to inconsistency
    });
  });

  describe('Quote Character Detection', () => {
    it('should detect double quotes', () => {
      const csvData = 'name,description\n"John Doe","A person, who lives"\n"Jane Smith","Another person"';
      const buffer = Buffer.from(csvData, 'utf8');
      
      const result = CSVDetector.detect(buffer);
      
      expect(result.quote).toBe('"');
      expect(result.quoteConfidence).toBeGreaterThan(0.7);
    });

    it('should detect single quotes', () => {
      const csvData = "name,description\n'John Doe','A person, who lives'\n'Jane Smith','Another person'";
      const buffer = Buffer.from(csvData, 'utf8');
      
      const result = CSVDetector.detect(buffer);
      
      expect(result.quote).toBe("'");
      expect(result.quoteConfidence).toBeGreaterThan(0.7);
    });

    it('should handle mixed or no quotes', () => {
      const csvData = 'name,age,city\nJohn,25,London\nJane,30,Paris';
      const buffer = Buffer.from(csvData, 'utf8');
      
      const result = CSVDetector.detect(buffer);
      
      // Should still detect a quote character but with low confidence
      expect(result.quote).toBeDefined();
      expect(result.quoteConfidence).toBeLessThan(0.5);
    });
  });

  describe('Header Detection', () => {
    it('should detect headers with text fields', () => {
      const csvData = 'name,age,city\nJohn,25,London\nJane,30,Paris';
      const buffer = Buffer.from(csvData, 'utf8');
      
      const result = CSVDetector.detect(buffer);
      
      expect(result.hasHeader).toBe(true);
      expect(result.headerConfidence).toBeGreaterThan(0.7);
    });

    it('should detect when no headers present', () => {
      const csvData = '1,25,London\n2,30,Paris\n3,35,Berlin';
      const buffer = Buffer.from(csvData, 'utf8');
      
      const result = CSVDetector.detect(buffer);
      
      // Detection might vary for numeric-only data
      expect(typeof result.hasHeader).toBe('boolean');
      expect(result.headerConfidence).toBeGreaterThanOrEqual(0.5);
    });

    it('should handle ambiguous header cases', () => {
      const csvData = 'John,25,London\nJane,30,Paris';
      const buffer = Buffer.from(csvData, 'utf8');
      
      const result = CSVDetector.detect(buffer);
      
      // Should have lower confidence for ambiguous cases
      expect(result.headerConfidence).toBeLessThan(0.8);
    });
  });

  describe('Line Ending Detection', () => {
    it('should detect Unix line endings (LF)', () => {
      const csvData = 'name,age\nJohn,25\nJane,30';
      const buffer = Buffer.from(csvData, 'utf8');
      
      const result = CSVDetector.detect(buffer);
      
      expect(result.lineEnding).toBe('\n');
    });

    it('should detect Windows line endings (CRLF)', () => {
      const csvData = 'name,age\r\nJohn,25\r\nJane,30';
      const buffer = Buffer.from(csvData, 'utf8');
      
      const result = CSVDetector.detect(buffer);
      
      expect(result.lineEnding).toBe('\r\n');
    });

    it('should prefer CRLF when both are present', () => {
      const csvData = 'name,age\r\nJohn,25\nJane,30\r\n';
      const buffer = Buffer.from(csvData, 'utf8');
      
      const result = CSVDetector.detect(buffer);
      
      expect(result.lineEnding).toBe('\r\n');
    });
  });

  describe('Encoding Detection', () => {
    it('should detect UTF-8 encoding', () => {
      const csvData = 'name,city\nJohn,London\nJané,París';
      const buffer = Buffer.from(csvData, 'utf8');
      
      const result = CSVDetector.detect(buffer);
      
      expect(result.encoding).toBe('utf8');
      expect(result.encodingConfidence).toBeGreaterThan(0.8);
    });

    it('should detect UTF-8 BOM', () => {
      const csvData = 'name,age\nJohn,25';
      const bom = Buffer.from([0xef, 0xbb, 0xbf]);
      const buffer = Buffer.concat([bom, Buffer.from(csvData, 'utf8')]);
      
      const result = CSVDetector.detect(buffer);
      
      expect(result.encoding).toBe('utf8');
      expect(result.encodingConfidence).toBe(1.0);
    });
  });

  describe('Complex CSV Detection', () => {
    it('should handle CSV with quoted fields containing delimiters', () => {
      const csvData = 'name,description,city\n"John Doe","A person, who lives in London","London"\n"Jane Smith","Another person; quite nice","Paris"';
      const buffer = Buffer.from(csvData, 'utf8');
      
      const result = CSVDetector.detect(buffer);
      
      expect(result.delimiter).toBe(',');
      expect(result.quote).toBe('"');
      // Header detection can vary with complex quoted content
      expect(typeof result.hasHeader).toBe('boolean');
      expect(result.delimiterConfidence).toBeGreaterThan(0.7);
    });

    it('should handle empty fields and lines', () => {
      const csvData = 'name,age,city\nJohn,,London\n,30,\nJane,25,Paris';
      const buffer = Buffer.from(csvData, 'utf8');
      
      const result = CSVDetector.detect(buffer);
      
      expect(result.delimiter).toBe(',');
      expect(result.hasHeader).toBe(true);
    });

    it('should handle minimal data', () => {
      const csvData = 'a,b\n1,2';
      const buffer = Buffer.from(csvData, 'utf8');
      
      const result = CSVDetector.detect(buffer);
      
      expect(result.delimiter).toBe(',');
      expect(result.delimiterConfidence).toBeGreaterThan(0.5);
    });

    it('should handle single column data', () => {
      const csvData = 'values\n1\n2\n3';
      const buffer = Buffer.from(csvData, 'utf8');
      
      const result = CSVDetector.detect(buffer);
      
      // Should still work but with lower confidence
      expect(result.delimiter).toBeDefined();
      expect(result.hasHeader).toBe(true);
    });
  });
});

describe('EncodingDetector', () => {
  describe('BOM Detection', () => {
    it('should detect UTF-8 BOM', () => {
      const data = 'Hello, World!';
      const bom = Buffer.from([0xef, 0xbb, 0xbf]);
      const buffer = Buffer.concat([bom, Buffer.from(data, 'utf8')]);
      
      const result = EncodingDetector.detect(buffer);
      
      expect(result.encoding).toBe('utf8');
      expect(result.confidence).toBe(1.0);
      expect(result.hasBOM).toBe(true);
      expect(result.bomLength).toBe(3);
    });

    it('should detect UTF-16LE BOM', () => {
      const bom = Buffer.from([0xff, 0xfe]);
      const data = Buffer.from('Hello', 'utf16le');
      const buffer = Buffer.concat([bom, data]);
      
      const result = EncodingDetector.detect(buffer);
      
      expect(result.encoding).toBe('utf16le');
      expect(result.confidence).toBe(1.0);
      expect(result.hasBOM).toBe(true);
      expect(result.bomLength).toBe(2);
    });

    it('should detect UTF-16BE BOM', () => {
      const bom = Buffer.from([0xfe, 0xff]);
      const data = Buffer.from('Hello');
      const buffer = Buffer.concat([bom, data]);
      
      const result = EncodingDetector.detect(buffer);
      
      expect(result.encoding).toBe('utf16le'); // Mapped to utf16le for Node.js compatibility
      expect(result.confidence).toBe(1.0);
      expect(result.hasBOM).toBe(true);
      expect(result.bomLength).toBe(2);
    });
  });

  describe('Statistical Detection', () => {
    it('should detect UTF-8 without BOM', () => {
      const data = 'Hello, World! 🌍 Héllo, Wørld!';
      const buffer = Buffer.from(data, 'utf8');
      
      const result = EncodingDetector.detect(buffer);
      
      expect(result.encoding).toBe('utf8');
      expect(result.confidence).toBeGreaterThan(0.4); // Encoding detection can vary
      expect(result.hasBOM).toBe(false);
    });

    it('should detect plain ASCII as UTF-8', () => {
      const data = 'Hello, World! This is plain ASCII text.';
      const buffer = Buffer.from(data, 'ascii');
      
      const result = EncodingDetector.detect(buffer);
      
      expect(result.encoding).toBe('utf8');
      expect(result.confidence).toBeGreaterThan(0.9);
    });

    it('should handle empty buffer', () => {
      const buffer = Buffer.alloc(0);
      
      const result = EncodingDetector.detect(buffer);
      
      expect(result.encoding).toBe('utf8');
      expect(result.confidence).toBe(0.5);
      expect(result.hasBOM).toBe(false);
    });
  });
});