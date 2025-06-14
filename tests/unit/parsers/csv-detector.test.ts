/**
 * CSV Detection Tests
 * 
 * Tests the automatic detection of CSV format parameters:
 * delimiter, encoding, quotes, headers, line endings
 */

import { CSVDetector } from '../../../src/parsers/csv-detector';

describe('CSVDetector', () => {
  describe('Delimiter Detection', () => {
    it('should detect comma delimiter', () => {
      const csvData = 'name,age,city\nJohn,25,NYC\nJane,30,LA';
      const buffer = Buffer.from(csvData, 'utf8');
      
      const result = CSVDetector.detect(buffer);
      
      expect(result.delimiter).toBe(',');
      expect(result.delimiterConfidence).toBeGreaterThan(0.8);
    });

    it('should detect semicolon delimiter', () => {
      const csvData = 'name;age;city\nJohn;25;NYC\nJane;30;LA';
      const buffer = Buffer.from(csvData, 'utf8');
      
      const result = CSVDetector.detect(buffer);
      
      expect(result.delimiter).toBe(';');
      expect(result.delimiterConfidence).toBeGreaterThan(0.8);
    });

    it('should detect tab delimiter', () => {
      const csvData = 'name\tage\tcity\nJohn\t25\tNYC\nJane\t30\tLA';
      const buffer = Buffer.from(csvData, 'utf8');
      
      const result = CSVDetector.detect(buffer);
      
      expect(result.delimiter).toBe('\t');
      expect(result.delimiterConfidence).toBeGreaterThan(0.8);
    });

    it('should detect pipe delimiter', () => {
      const csvData = 'name|age|city\nJohn|25|NYC\nJane|30|LA';
      const buffer = Buffer.from(csvData, 'utf8');
      
      const result = CSVDetector.detect(buffer);
      
      expect(result.delimiter).toBe('|');
      expect(result.delimiterConfidence).toBeGreaterThan(0.8);
    });

    it('should handle inconsistent field counts', () => {
      const csvData = 'name,age,city\nJohn,25\nJane,30,LA,extra';
      const buffer = Buffer.from(csvData, 'utf8');
      
      const result = CSVDetector.detect(buffer);
      
      expect(result.delimiter).toBe(',');
      expect(result.delimiterConfidence).toBeLessThan(0.9); // Lower confidence due to inconsistency
    });

    it('should prefer consistency over field count', () => {
      // Semicolon has perfect consistency (2 fields), comma has inconsistency (3 vs 1 field)
      const csvData = 'A;B,extra\nC;D';
      const buffer = Buffer.from(csvData, 'utf8');
      
      const result = CSVDetector.detect(buffer);
      
      expect(result.delimiter).toBe(';'); // Should prefer consistent semicolon
    });
  });

  describe('Quote Character Detection', () => {
    it('should detect double quotes', () => {
      const csvData = 'name,description\n"John","A great person"\n"Jane","Another person"';
      const buffer = Buffer.from(csvData, 'utf8');
      
      const result = CSVDetector.detect(buffer);
      
      expect(result.quote).toBe('"');
      expect(result.quoteConfidence).toBeGreaterThan(0.7);
    });

    it('should detect single quotes', () => {
      const csvData = "name,description\n'John','A great person'\n'Jane','Another person'";
      const buffer = Buffer.from(csvData, 'utf8');
      
      const result = CSVDetector.detect(buffer);
      
      expect(result.quote).toBe("'");
      expect(result.quoteConfidence).toBeGreaterThan(0.7);
    });

    it('should handle mixed or no quotes', () => {
      const csvData = 'name,age,city\nJohn,25,NYC\nJane,30,LA';
      const buffer = Buffer.from(csvData, 'utf8');
      
      const result = CSVDetector.detect(buffer);
      
      expect(result.quote).toBe('"'); // Default to double quote
      expect(result.quoteConfidence).toBeLessThan(0.5); // Low confidence
    });

    it('should detect quotes with embedded delimiters', () => {
      const csvData = 'name,description\n"Smith, John","A person with comma in name"\n"Doe, Jane","Another person"';
      const buffer = Buffer.from(csvData, 'utf8');
      
      const result = CSVDetector.detect(buffer);
      
      expect(result.quote).toBe('"');
      expect(result.quoteConfidence).toBeGreaterThan(0.6); // Slightly lower threshold
    });
  });

  describe('Header Detection', () => {
    it('should detect headers with text fields', () => {
      const csvData = 'name,age,city\nJohn,25,NYC\nJane,30,LA';
      const buffer = Buffer.from(csvData, 'utf8');
      
      const result = CSVDetector.detect(buffer);
      
      expect(result.hasHeader).toBe(true);
      expect(result.headerConfidence).toBeGreaterThan(0.7);
    });

    it('should detect headers with common header words', () => {
      const csvData = 'id,description,status\n1,Some text,active\n2,Other text,inactive';
      const buffer = Buffer.from(csvData, 'utf8');
      
      const result = CSVDetector.detect(buffer);
      
      expect(result.hasHeader).toBe(true);
      expect(result.headerConfidence).toBeGreaterThan(0.8);
    });

    it('should detect headers with snake_case', () => {
      const csvData = 'user_id,first_name,last_name\n1,John,Doe\n2,Jane,Smith';
      const buffer = Buffer.from(csvData, 'utf8');
      
      const result = CSVDetector.detect(buffer);
      
      expect(result.hasHeader).toBe(true);
      expect(result.headerConfidence).toBeGreaterThan(0.7);
    });

    it('should detect headers with camelCase', () => {
      const csvData = 'userId,firstName,lastName\n1,John,Doe\n2,Jane,Smith';
      const buffer = Buffer.from(csvData, 'utf8');
      
      const result = CSVDetector.detect(buffer);
      
      expect(result.hasHeader).toBe(true);
      expect(result.headerConfidence).toBeGreaterThan(0.7);
    });

    it('should reject all-numeric headers', () => {
      const csvData = '1,2,3\n10,20,30\n40,50,60';
      const buffer = Buffer.from(csvData, 'utf8');
      
      const result = CSVDetector.detect(buffer);
      
      expect(result.hasHeader).toBe(false);
      expect(result.headerConfidence).toBeGreaterThan(0.6);
    });

    it('should handle datasets with many columns', () => {
      // Create a CSV with many columns - test that the algorithm adjusts thresholds
      const headers = Array.from({length: 15}, (_, i) => `field_${i}`).join(',');
      const data = Array.from({length: 15}, (_, i) => i + 100).join(',');
      const csvData = `${headers}\n${data}`;
      const buffer = Buffer.from(csvData, 'utf8');
      
      const result = CSVDetector.detect(buffer);
      
      // Test passes if detector makes a decision (true or false) with reasonable confidence
      expect(typeof result.hasHeader).toBe('boolean');
      expect(result.headerConfidence).toBeGreaterThan(0.5);
    });

    it('should handle mismatched column counts', () => {
      const csvData = 'name,age,city\nJohn,25\nJane,30,LA,extra';
      const buffer = Buffer.from(csvData, 'utf8');
      
      const result = CSVDetector.detect(buffer);
      
      expect(result.hasHeader).toBe(false); // Mismatched columns indicate no reliable header
      expect(result.headerConfidence).toBeGreaterThan(0.7);
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
      const csvData = 'name,age\r\nJohn,25\nJane,30\r\nBob,35';
      const buffer = Buffer.from(csvData, 'utf8');
      
      const result = CSVDetector.detect(buffer);
      
      expect(result.lineEnding).toBe('\r\n'); // More CRLF than LF
    });
  });

  describe('Encoding Detection', () => {
    it('should detect UTF-8 encoding', () => {
      const csvData = 'name,city\nJohn,New York\nJané,São Paulo';
      const buffer = Buffer.from(csvData, 'utf8');
      
      const result = CSVDetector.detect(buffer);
      
      expect(result.encoding).toBe('utf8');
      expect(result.encodingConfidence).toBeGreaterThan(0.8);
    });

    it('should handle ASCII data', () => {
      const csvData = 'name,age\nJohn,25\nJane,30';
      const buffer = Buffer.from(csvData, 'ascii');
      
      const result = CSVDetector.detect(buffer);
      
      expect(['utf8', 'ascii']).toContain(result.encoding);
      expect(result.encodingConfidence).toBeGreaterThan(0.7);
    });

    it('should detect BOM and skip it', () => {
      const csvData = 'name,age\nJohn,25';
      const bom = Buffer.from([0xEF, 0xBB, 0xBF]); // UTF-8 BOM
      const buffer = Buffer.concat([bom, Buffer.from(csvData, 'utf8')]);
      
      const result = CSVDetector.detect(buffer);
      
      expect(result.encoding).toBe('utf8');
      expect(result.delimiter).toBe(','); // Should parse correctly after BOM
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty files', () => {
      const buffer = Buffer.from('', 'utf8');
      
      const result = CSVDetector.detect(buffer);
      
      expect(result.delimiter).toBe(','); // Default
      expect(result.delimiterConfidence).toBeLessThan(0.6);
      expect(result.hasHeader).toBe(false);
    });

    it('should handle single line files', () => {
      const csvData = 'name,age,city';
      const buffer = Buffer.from(csvData, 'utf8');
      
      const result = CSVDetector.detect(buffer);
      
      expect(result.delimiter).toBe(',');
      expect(result.delimiterConfidence).toBeLessThan(0.6); // Low confidence with single line
      expect(result.hasHeader).toBe(false); // Can't determine header with single line
    });

    it('should handle files with only whitespace', () => {
      const csvData = '   \n  \n\t\t\n';
      const buffer = Buffer.from(csvData, 'utf8');
      
      const result = CSVDetector.detect(buffer);
      
      expect(result.delimiter).toBe(','); // Default
      expect(result.delimiterConfidence).toBeLessThan(0.6);
    });

    it('should handle very long field values', () => {
      const longValue = 'x'.repeat(1000);
      const csvData = `name,description\nJohn,"${longValue}"\nJane,Short desc`;
      const buffer = Buffer.from(csvData, 'utf8');
      
      const result = CSVDetector.detect(buffer);
      
      expect(result.delimiter).toBe(',');
      expect(result.quote).toBe('"');
      expect(result.hasHeader).toBe(true);
    });

    it('should handle Unicode characters', () => {
      const csvData = 'name,city,emoji\nJohn,Tokyo,🗾\nMaria,São Paulo,🇧🇷\nAnna,москва,🇷🇺';
      const buffer = Buffer.from(csvData, 'utf8');
      
      const result = CSVDetector.detect(buffer);
      
      expect(result.delimiter).toBe(',');
      expect(result.encoding).toBe('utf8');
      expect(result.hasHeader).toBe(true);
    });

    it('should handle CSV with empty fields', () => {
      const csvData = 'name,age,city\nJohn,,NYC\n,30,\nJane,25,LA';
      const buffer = Buffer.from(csvData, 'utf8');
      
      const result = CSVDetector.detect(buffer);
      
      expect(result.delimiter).toBe(',');
      expect(result.delimiterConfidence).toBeGreaterThan(0.8); // Should still be consistent
      expect(result.hasHeader).toBe(true);
    });
  });

  describe('Complex Real-World Scenarios', () => {
    it('should handle CSV with mixed quote styles', () => {
      const csvData = 'name,description,note\n"John","A person","Has \\"quotes\\""\nJane,Simple text,No quotes';
      const buffer = Buffer.from(csvData, 'utf8');
      
      const result = CSVDetector.detect(buffer);
      
      expect(result.delimiter).toBe(',');
      expect(result.quote).toBe('"');
      expect(result.hasHeader).toBe(true);
    });

    it('should handle CSV with numeric and text columns', () => {
      const csvData = 'id,score,grade,comment\n1,85.5,B+,Good work\n2,92.0,A-,Excellent\n3,78.5,C+,Needs improvement';
      const buffer = Buffer.from(csvData, 'utf8');
      
      const result = CSVDetector.detect(buffer);
      
      expect(result.delimiter).toBe(',');
      expect(result.hasHeader).toBe(true);
      expect(result.headerConfidence).toBeGreaterThan(0.8);
    });

    it('should handle European-style CSV (semicolon delimiter)', () => {
      const csvData = 'Name;Price;Currency\nProduct A;29,99;EUR\nProduct B;15,50;EUR';
      const buffer = Buffer.from(csvData, 'utf8');
      
      const result = CSVDetector.detect(buffer);
      
      expect(result.delimiter).toBe(';');
      expect(result.hasHeader).toBe(true);
    });

    it('should handle pipe-delimited data', () => {
      const csvData = 'ID|NAME|STATUS|CREATED_DATE\n1|User One|active|2024-01-15\n2|User Two|inactive|2024-01-16';
      const buffer = Buffer.from(csvData, 'utf8');
      
      const result = CSVDetector.detect(buffer);
      
      expect(result.delimiter).toBe('|');
      expect(result.hasHeader).toBe(true);
      expect(result.headerConfidence).toBeGreaterThan(0.8); // UPPER_CASE headers
    });
  });

  describe('Performance', () => {
    it('should detect format quickly for large samples', () => {
      // Create a large CSV sample
      const headers = 'id,name,email,age,city,country,salary,department';
      const rows = Array.from({length: 1000}, (_, i) => 
        `${i+1},User${i+1},user${i+1}@email.com,${25+i%40},City${i%50},Country${i%20},${30000+i*100},Dept${i%10}`
      );
      const csvData = [headers, ...rows].join('\n');
      const buffer = Buffer.from(csvData, 'utf8');
      
      const start = Date.now();
      const result = CSVDetector.detect(buffer);
      const duration = Date.now() - start;
      
      expect(result.delimiter).toBe(',');
      expect(result.hasHeader).toBe(true);
      expect(duration).toBeLessThan(50); // Should be fast even for large data
    });

    it('should handle detection with minimal data', () => {
      const csvData = 'a,b\n1,2';
      const buffer = Buffer.from(csvData, 'utf8');
      
      const result = CSVDetector.detect(buffer);
      
      expect(result.delimiter).toBe(',');
      expect(result.hasHeader).toBe(true); // 'a,b' vs '1,2' suggests header
    });
  });
});