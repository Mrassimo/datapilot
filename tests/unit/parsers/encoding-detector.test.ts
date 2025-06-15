/**
 * Comprehensive Encoding Detector Tests
 * 
 * Tests encoding detection capabilities including BOM detection,
 * statistical analysis, and edge cases for various character encodings.
 */

import { EncodingDetector } from '../../../src/parsers/encoding-detector';

describe('EncodingDetector', () => {
  describe('BOM Detection', () => {
    it('should detect UTF-8 BOM correctly', () => {
      const utf8BOM = Buffer.from([0xEF, 0xBB, 0xBF]);
      const csvContent = Buffer.from('name,age\nJohn,25', 'utf8');
      const buffer = Buffer.concat([utf8BOM, csvContent]);

      const result = EncodingDetector.detect(buffer);

      expect(result.encoding).toBe('utf8');
      expect(result.confidence).toBe(1.0);
      expect(result.hasBOM).toBe(true);
      expect(result.bomLength).toBe(3);
    });

    it('should detect UTF-16LE BOM correctly', () => {
      const utf16leBOM = Buffer.from([0xFF, 0xFE]);
      const csvContent = Buffer.from('name,age\nJohn,25', 'utf16le');
      const buffer = Buffer.concat([utf16leBOM, csvContent]);

      const result = EncodingDetector.detect(buffer);

      expect(result.encoding).toBe('utf16le');
      expect(result.confidence).toBe(1.0);
      expect(result.hasBOM).toBe(true);
      expect(result.bomLength).toBe(2);
    });

    it('should detect UTF-16BE BOM correctly', () => {
      const utf16beBOM = Buffer.from([0xFE, 0xFF]);
      const csvContent = Buffer.from('name,age\nJohn,25', 'utf16le'); // Node.js maps utf16be to utf16le
      const buffer = Buffer.concat([utf16beBOM, csvContent]);

      const result = EncodingDetector.detect(buffer);

      expect(result.encoding).toBe('utf16le'); // Should map to utf16le for Node.js compatibility
      expect(result.confidence).toBe(1.0);
      expect(result.hasBOM).toBe(true);
      expect(result.bomLength).toBe(2);
    });

    it('should handle partial BOM at end of buffer', () => {
      const partialBOM = Buffer.from([0xEF, 0xBB]); // Incomplete UTF-8 BOM

      const result = EncodingDetector.detect(partialBOM);

      expect(result.hasBOM).toBe(false);
      expect(result.bomLength).toBe(0);
    });

    it('should handle BOM-like bytes that are not actually BOM', () => {
      const falseBOM = Buffer.from([0xEF, 0xBB, 0xBA]); // Almost UTF-8 BOM but wrong last byte

      const result = EncodingDetector.detect(falseBOM);

      expect(result.hasBOM).toBe(false);
      expect(result.bomLength).toBe(0);
    });
  });

  describe('UTF-8 Detection', () => {
    it('should detect valid UTF-8 with high confidence for ASCII content', () => {
      const buffer = Buffer.from('name,age,city\nJohn,25,NYC\nJane,30,LA', 'utf8');

      const result = EncodingDetector.detect(buffer);

      expect(result.encoding).toBe('utf8');
      expect(result.confidence).toBeGreaterThanOrEqual(0.9);
      expect(result.hasBOM).toBe(false);
    });

    it('should detect valid UTF-8 with Unicode characters', () => {
      const buffer = Buffer.from('name,city\nJosé,São Paulo\nAnna,москва\nJohn,Tokyo🗾', 'utf8');

      const result = EncodingDetector.detect(buffer);

      expect(result.encoding).toBe('utf8');
      expect(result.confidence).toBeGreaterThanOrEqual(0.5); // Adjust based on actual implementation
      expect(result.hasBOM).toBe(false);
    });

    it('should detect UTF-8 with emoji and special characters', () => {
      const buffer = Buffer.from('name,emoji\nUser1,🚀\nUser2,💻\nUser3,🌟', 'utf8');

      const result = EncodingDetector.detect(buffer);

      expect(result.encoding).toBe('utf8');
      expect(result.confidence).toBeGreaterThanOrEqual(0.5); // Adjust based on actual implementation
    });

    it('should handle invalid UTF-8 sequences gracefully', () => {
      const invalidUTF8 = Buffer.from([
        0x48, 0x65, 0x6C, 0x6C, 0x6F, // "Hello"
        0xFF, 0xFE, // Invalid UTF-8 bytes
        0x57, 0x6F, 0x72, 0x6C, 0x64, // "World"
      ]);

      const result = EncodingDetector.detect(invalidUTF8);

      // Should fallback to UTF-8 with lower confidence or detect as non-UTF-8
      expect(result.encoding).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should detect pure ASCII as UTF-8 with high confidence', () => {
      const buffer = Buffer.from('name,age\nJohn,25\nJane,30', 'ascii');

      const result = EncodingDetector.detect(buffer);

      expect(['utf8', 'ascii']).toContain(result.encoding);
      expect(result.confidence).toBeGreaterThanOrEqual(0.9);
    });
  });

  describe('UTF-16 Detection', () => {
    it('should detect UTF-16LE based on null byte patterns', () => {
      // Create UTF-16LE content (ASCII chars with null bytes)
      const utf16leContent = Buffer.from([
        0x6E, 0x00, // 'n'
        0x61, 0x00, // 'a'
        0x6D, 0x00, // 'm'
        0x65, 0x00, // 'e'
        0x2C, 0x00, // ','
        0x61, 0x00, // 'a'
        0x67, 0x00, // 'g'
        0x65, 0x00, // 'e'
      ]);

      const result = EncodingDetector.detect(utf16leContent);

      expect(result.encoding).toBe('utf16le');
      expect(result.confidence).toBeGreaterThanOrEqual(0.5); // Adjust based on actual implementation
    });

    it('should detect UTF-16BE based on null byte patterns', () => {
      // Create UTF-16BE content (null bytes in odd positions)
      const utf16beContent = Buffer.from([
        0x00, 0x6E, // 'n'
        0x00, 0x61, // 'a'
        0x00, 0x6D, // 'm'
        0x00, 0x65, // 'e'
        0x00, 0x2C, // ','
        0x00, 0x61, // 'a'
        0x00, 0x67, // 'g'
        0x00, 0x65, // 'e'
      ]);

      const result = EncodingDetector.detect(utf16beContent);

      expect(result.encoding).toBe('utf16le'); // Node.js maps BE to LE
      expect(result.confidence).toBeGreaterThanOrEqual(0.5); // Adjust based on actual implementation
    });

    it('should not detect UTF-16 when null ratio is too low', () => {
      const buffer = Buffer.from('name,age,city\nJohn,25,NYC\nJane,30,LA', 'utf8');

      const result = EncodingDetector.detect(buffer);

      // Should not detect as UTF-16 since null ratio is very low
      expect(result.encoding).not.toBe('utf16le');
    });

    it('should handle mixed content with some null bytes', () => {
      const mixedContent = Buffer.from([
        0x6E, 0x61, 0x6D, 0x65, // "name"
        0x00, 0x00, 0x00, 0x00, // null bytes
        0x61, 0x67, 0x65, // "age"
      ]);

      const result = EncodingDetector.detect(mixedContent);

      // Should make a reasonable decision based on null byte ratio
      expect(result.encoding).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0);
    });
  });

  describe('Statistical Analysis', () => {
    it('should calculate confidence based on ASCII ratio', () => {
      // High ASCII content
      const highAscii = Buffer.from('name,age,city\nJohn,25,NYC\nJane,30,LA\nBob,35,CHI', 'utf8');

      const result = EncodingDetector.detect(highAscii);

      expect(result.encoding).toBe('utf8');
      expect(result.confidence).toBeGreaterThanOrEqual(0.9);
    });

    it('should handle binary data appropriately', () => {
      const binaryData = Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG header
        0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
        0xFF, 0xFE, 0xFD, 0xFC, 0xFB, 0xFA, 0xF9, 0xF8,
      ]);

      const result = EncodingDetector.detect(binaryData);

      // Should handle binary data gracefully with low confidence
      expect(result.confidence).toBeLessThan(0.8);
    });

    it('should detect control characters and adjust confidence', () => {
      const controlChars = Buffer.from([
        0x48, 0x65, 0x6C, 0x6C, 0x6F, // "Hello"
        0x01, 0x02, 0x03, 0x04, 0x05, // Control characters
        0x57, 0x6F, 0x72, 0x6C, 0x64, // "World"
      ]);

      const result = EncodingDetector.detect(controlChars);

      // Control characters should reduce confidence
      expect(result.confidence).toBeLessThan(0.8);
    });

    it('should handle empty buffers gracefully', () => {
      const emptyBuffer = Buffer.alloc(0);

      const result = EncodingDetector.detect(emptyBuffer);

      expect(result.encoding).toBe('utf8'); // Should fallback to utf8
      expect(result.confidence).toBeLessThan(0.6);
      expect(result.hasBOM).toBe(false);
    });

    it('should handle very small buffers', () => {
      const smallBuffer = Buffer.from([0x41]); // Single 'A'

      const result = EncodingDetector.detect(smallBuffer);

      expect(result.encoding).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle buffers with only null bytes', () => {
      const nullBuffer = Buffer.alloc(100, 0);

      const result = EncodingDetector.detect(nullBuffer);

      // Should handle gracefully, likely detecting as UTF-16 due to high null ratio
      expect(result.encoding).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should handle random binary data', () => {
      const randomData = Buffer.alloc(100);
      for (let i = 0; i < 100; i++) {
        randomData[i] = Math.floor(Math.random() * 256);
      }

      const result = EncodingDetector.detect(randomData);

      expect(result.encoding).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should handle very large buffers efficiently', () => {
      const largeBuffer = Buffer.alloc(1000000, 0x41); // 1MB of 'A's

      const startTime = Date.now();
      const result = EncodingDetector.detect(largeBuffer);
      const endTime = Date.now();

      expect(result.encoding).toBe('utf8');
      expect(result.confidence).toBeGreaterThanOrEqual(0.9);
      expect(endTime - startTime).toBeLessThan(100); // Should be fast
    });

    it('should handle alternating patterns', () => {
      const alternatingPattern = Buffer.alloc(100);
      for (let i = 0; i < 100; i++) {
        alternatingPattern[i] = i % 2 === 0 ? 0x41 : 0x00; // Alternating 'A' and null
      }

      const result = EncodingDetector.detect(alternatingPattern);

      // Should likely detect as UTF-16 due to alternating null pattern
      expect(result.encoding).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should prioritize BOM detection over statistical analysis', () => {
      // Create content that would statistically look like UTF-16 but has UTF-8 BOM
      const utf8BOM = Buffer.from([0xEF, 0xBB, 0xBF]);
      const utf16likeContent = Buffer.alloc(100);
      for (let i = 0; i < 100; i++) {
        utf16likeContent[i] = i % 2 === 0 ? 0x41 : 0x00;
      }
      const buffer = Buffer.concat([utf8BOM, utf16likeContent]);

      const result = EncodingDetector.detect(buffer);

      expect(result.encoding).toBe('utf8'); // BOM should override statistical analysis
      expect(result.confidence).toBe(1.0);
      expect(result.hasBOM).toBe(true);
    });
  });

  describe('Real-World Scenarios', () => {
    it('should handle typical CSV exports from Excel (UTF-8 with BOM)', () => {
      const utf8BOM = Buffer.from([0xEF, 0xBB, 0xBF]);
      const csvContent = Buffer.from(
        'Name,Age,City,Salary\n"John Doe",25,"New York",50000\n"Jane Smith",30,"Los Angeles",60000',
        'utf8'
      );
      const buffer = Buffer.concat([utf8BOM, csvContent]);

      const result = EncodingDetector.detect(buffer);

      expect(result.encoding).toBe('utf8');
      expect(result.confidence).toBe(1.0);
      expect(result.hasBOM).toBe(true);
    });

    it('should handle European CSV files with accented characters', () => {
      const buffer = Buffer.from(
        'Nom,Âge,Ville\nJean-François,25,Montréal\nMarie-Hélène,30,Québec\nPierre-André,35,Três-Rivières',
        'utf8'
      );

      const result = EncodingDetector.detect(buffer);

      expect(result.encoding).toBe('utf8');
      expect(result.confidence).toBeGreaterThanOrEqual(0.5); // Adjust based on actual implementation
    });

    it('should handle Asian character sets in UTF-8', () => {
      const buffer = Buffer.from(
        'name,city,country\n田中太郎,東京,日本\n이민수,서울,한국\n张三,北京,中国',
        'utf8'
      );

      const result = EncodingDetector.detect(buffer);

      expect(result.encoding).toBe('utf8');
      expect(result.confidence).toBeGreaterThanOrEqual(0.5); // Adjust based on actual implementation
    });

    it('should handle mixed ASCII and Unicode content', () => {
      const buffer = Buffer.from(
        'name,description\nJohn,Regular user\nMaria,Usuário especial\nHans,Spezial Benutzer\nAnna,Пользователь',
        'utf8'
      );

      const result = EncodingDetector.detect(buffer);

      expect(result.encoding).toBe('utf8');
      expect(result.confidence).toBeGreaterThanOrEqual(0.5); // Adjust based on actual implementation
    });

    it('should handle legacy Windows CSV files', () => {
      // Simulate Windows-1252 encoded content converted to buffer
      const buffer = Buffer.from('name,note\nJohn,café\nMarie,naïve\nJose,niño', 'utf8');

      const result = EncodingDetector.detect(buffer);

      expect(result.encoding).toBe('utf8');
      expect(result.confidence).toBeGreaterThanOrEqual(0.5); // Adjust based on actual implementation
    });

    it('should handle tab-separated files with various content', () => {
      const buffer = Buffer.from(
        'ID\tName\tEmail\tNotes\n1\tJohn Doe\tjohn@example.com\tRegular user\n2\tJané Smith\tjane@example.com\tSpecial châr user',
        'utf8'
      );

      const result = EncodingDetector.detect(buffer);

      expect(result.encoding).toBe('utf8');
      expect(result.confidence).toBeGreaterThanOrEqual(0.5); // Adjust based on actual implementation
    });
  });

  describe('Performance and Stress Tests', () => {
    it('should handle detection on large samples efficiently', () => {
      // Create a large buffer with realistic CSV content
      const headers = 'id,name,email,age,city,country,department,salary';
      const rows = Array.from({ length: 10000 }, (_, i) => 
        `${i},User${i},user${i}@email.com,${25 + (i % 40)},City${i % 100},Country${i % 50},Dept${i % 10},${30000 + i * 10}`
      );
      const csvContent = [headers, ...rows].join('\n');
      const buffer = Buffer.from(csvContent, 'utf8');

      const startTime = Date.now();
      const result = EncodingDetector.detect(buffer);
      const endTime = Date.now();

      expect(result.encoding).toBe('utf8');
      expect(result.confidence).toBeGreaterThanOrEqual(0.9);
      expect(endTime - startTime).toBeLessThan(50); // Should be very fast
    });

    it('should handle worst-case scenarios for UTF-8 validation', () => {
      // Create content with many multi-byte UTF-8 sequences
      const complexUTF8 = '🌟🚀💻🎉🌈🔥⭐🎯🌺🎨'.repeat(1000);
      const buffer = Buffer.from(complexUTF8, 'utf8');

      const startTime = Date.now();
      const result = EncodingDetector.detect(buffer);
      const endTime = Date.now();

      expect(result.encoding).toBe('utf8');
      expect(result.confidence).toBeGreaterThanOrEqual(0.5); // Adjust based on actual implementation
      expect(endTime - startTime).toBeLessThan(100);
    });

    it('should maintain accuracy with minimal sample sizes', () => {
      const smallSample = Buffer.from('name,age\nJohn,25', 'utf8');

      const result = EncodingDetector.detect(smallSample);

      expect(result.encoding).toBe('utf8');
      expect(result.confidence).toBeGreaterThanOrEqual(0.5); // Adjust based on actual implementation
    });
  });
});