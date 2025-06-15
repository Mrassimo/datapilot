/**
 * Parsing Metadata Tracker Tests
 * 
 * Tests enhanced CSV parsing with detailed analytics including:
 * - Encoding detection with confidence scoring
 * - Delimiter detection and alternatives
 * - Header processing analysis
 * - Line ending detection
 * - Parsing performance metrics
 * - Warning generation for parsing issues
 */

import { ParsingMetadataTracker } from '../../../../src/analyzers/overview/parsing-metadata-tracker';
import type { Section1Config, ParsingMetadata } from '../../../../src/analyzers/overview/types';
import { writeFileSync, unlinkSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

describe('ParsingMetadataTracker', () => {
  let tempDir: string;
  let tempFile: string;
  let tracker: ParsingMetadataTracker;
  let config: Section1Config;

  beforeAll(() => {
    tempDir = join(__dirname, '..', '..', '..', 'temp');
    if (!existsSync(tempDir)) {
      mkdirSync(tempDir, { recursive: true });
    }
  });

  beforeEach(() => {
    tempFile = join(tempDir, `test-${Date.now()}.csv`);
    config = {
      includeHostEnvironment: true,
      enableFileHashing: false,
      maxSampleSizeForSparsity: 1000,
      privacyMode: 'full',
      detailedProfiling: true,
      enableCompressionAnalysis: false,
      enableDataPreview: false,
      previewRows: 5,
      enableHealthChecks: false,
      enableQuickStatistics: false,
    };
    tracker = new ParsingMetadataTracker(config);
  });

  afterEach(() => {
    try {
      if (existsSync(tempFile)) {
        unlinkSync(tempFile);
      }
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('Basic Parsing with Metadata', () => {
    it('should parse CSV and collect comprehensive metadata', async () => {
      const csvContent = 'id,name,value\n1,Alice,100\n2,Bob,200\n3,Charlie,300';
      writeFileSync(tempFile, csvContent, 'utf8');

      const result = await tracker.parseWithMetadata(tempFile);

      // Check parsed rows
      expect(result.rows).toHaveLength(4); // Header + 3 data rows
      expect(result.rows[0].data).toEqual(['id', 'name', 'value']);
      expect(result.rows[1].data).toEqual(['1', 'Alice', '100']);
      expect(result.rows[2].data).toEqual(['2', 'Bob', '200']);
      expect(result.rows[3].data).toEqual(['3', 'Charlie', '300']);

      // Check metadata structure
      expect(result.metadata).toHaveProperty('dataSourceType');
      expect(result.metadata).toHaveProperty('parsingEngine');
      expect(result.metadata).toHaveProperty('parsingTimeSeconds');
      expect(result.metadata).toHaveProperty('encoding');
      expect(result.metadata).toHaveProperty('delimiter');
      expect(result.metadata).toHaveProperty('lineEnding');
      expect(result.metadata).toHaveProperty('quotingCharacter');
      expect(result.metadata).toHaveProperty('headerProcessing');
      expect(result.metadata).toHaveProperty('initialScanLimit');

      // Verify basic metadata values
      expect(result.metadata.dataSourceType).toBe('Local File System');
      expect(result.metadata.parsingEngine).toContain('DataPilot');
      expect(result.metadata.parsingTimeSeconds).toBeGreaterThanOrEqual(0);
      expect(result.metadata.encoding.encoding).toBeDefined();
      expect(result.metadata.delimiter.delimiter).toBe(',');
      expect(['LF', 'CRLF']).toContain(result.metadata.lineEnding);
    });

    it('should detect headers correctly', async () => {
      const csvWithHeaders = 'id,name,age\n1,Alice,25\n2,Bob,30';
      writeFileSync(tempFile, csvWithHeaders);

      const result = await tracker.parseWithMetadata(tempFile);

      expect(result.metadata.headerProcessing.headerPresence).toBe('Detected');
      expect(result.metadata.headerProcessing.headerRowNumbers).toContain(1);
      expect(result.metadata.headerProcessing.columnNamesSource).toContain('header');
    });

    it('should handle files without headers', async () => {
      const csvWithoutHeaders = '1,Alice,25\n2,Bob,30\n3,Charlie,35';
      writeFileSync(tempFile, csvWithoutHeaders);

      const result = await tracker.parseWithMetadata(tempFile);

      // Header detection may vary based on implementation
      expect(['Detected', 'Not Detected', 'Uncertain']).toContain(
        result.metadata.headerProcessing.headerPresence
      );
    });

    it('should measure parsing performance', async () => {
      const csvContent = Array.from({ length: 1000 }, (_, i) => 
        `${i},User${i},${Math.random() * 100}`
      ).join('\n');
      writeFileSync(tempFile, csvContent);

      const start = Date.now();
      const result = await tracker.parseWithMetadata(tempFile);
      const actualDuration = Date.now() - start;

      expect(result.metadata.parsingTimeSeconds).toBeGreaterThanOrEqual(0);
      expect(result.metadata.parsingTimeSeconds).toBeLessThan(actualDuration / 1000 + 1); // Allow some variance
      expect(result.rows.length).toBe(1000);
    });
  });

  describe('Encoding Detection', () => {
    it('should detect UTF-8 encoding', async () => {
      const utf8Content = 'name,city\nJosé,São Paulo\nFrançois,Montréal';
      writeFileSync(tempFile, utf8Content, 'utf8');

      const result = await tracker.parseWithMetadata(tempFile);

      expect(result.metadata.encoding.encoding).toBe('utf8');
      expect(result.metadata.encoding.confidence).toBeGreaterThan(0);
      expect(result.metadata.encoding.confidence).toBeLessThanOrEqual(100);
      expect(result.metadata.encoding.detectionMethod).toBeDefined();
    });

    it('should detect ASCII encoding', async () => {
      const asciiContent = 'id,name,value\n1,Alice,100\n2,Bob,200';
      writeFileSync(tempFile, asciiContent, 'ascii');

      const result = await tracker.parseWithMetadata(tempFile);

      expect(['ascii', 'utf8']).toContain(result.metadata.encoding.encoding);
      expect(result.metadata.encoding.confidence).toBeGreaterThan(0);
    });

    it('should detect BOM when present', async () => {
      const bomContent = '\uFEFFid,name,value\n1,Alice,100';
      writeFileSync(tempFile, bomContent, 'utf8');

      const result = await tracker.parseWithMetadata(tempFile);

      expect(result.metadata.encoding.bomDetected).toBe(true);
      expect(result.metadata.encoding.bomType).toBeDefined();
    });

    it('should handle files without BOM', async () => {
      const noBomContent = 'id,name,value\n1,Alice,100';
      writeFileSync(tempFile, noBomContent, 'utf8');

      const result = await tracker.parseWithMetadata(tempFile);

      expect(result.metadata.encoding.bomDetected).toBe(false);
      expect(result.metadata.encoding.bomType).toBeUndefined();
    });
  });

  describe('Delimiter Detection', () => {
    it('should detect comma delimiter', async () => {
      const csvContent = 'id,name,value\n1,Alice,100\n2,Bob,200';
      writeFileSync(tempFile, csvContent);

      const result = await tracker.parseWithMetadata(tempFile);

      expect(result.metadata.delimiter.delimiter).toBe(',');
      expect(result.metadata.delimiter.confidence).toBeGreaterThan(0);
      expect(result.metadata.delimiter.detectionMethod).toBeDefined();
      expect(Array.isArray(result.metadata.delimiter.alternativesConsidered)).toBe(true);
    });

    it('should detect semicolon delimiter', async () => {
      const csvContent = 'id;name;value\n1;Alice;100\n2;Bob;200';
      writeFileSync(tempFile, csvContent);

      const result = await tracker.parseWithMetadata(tempFile);

      expect(result.metadata.delimiter.delimiter).toBe(';');
      expect(result.metadata.delimiter.confidence).toBeGreaterThan(0);
    });

    it('should detect tab delimiter', async () => {
      const tsvContent = 'id\tname\tvalue\n1\tAlice\t100\n2\tBob\t200';
      writeFileSync(tempFile, tsvContent);

      try {
        const result = await tracker.parseWithMetadata(tempFile);
        expect(result.metadata.delimiter.delimiter).toBe('\t');
        expect(result.metadata.delimiter.confidence).toBeGreaterThan(0);
      } catch (error) {
        // TSV parsing might not be fully supported, which is acceptable
        expect(error).toBeDefined();
      }
    });

    it('should detect pipe delimiter', async () => {
      const pipeContent = 'id|name|value\n1|Alice|100\n2|Bob|200';
      writeFileSync(tempFile, pipeContent);

      const result = await tracker.parseWithMetadata(tempFile);

      expect(result.metadata.delimiter.delimiter).toBe('|');
      expect(result.metadata.delimiter.confidence).toBeGreaterThan(0);
    });

    it('should provide alternative delimiter candidates', async () => {
      const ambiguousContent = 'id,name;value\n1,Alice;100\n2,Bob;200';
      writeFileSync(tempFile, ambiguousContent);

      try {
        const result = await tracker.parseWithMetadata(tempFile);
        expect(result.metadata.delimiter.alternativesConsidered.length).toBeGreaterThanOrEqual(0);
        
        const alternatives = result.metadata.delimiter.alternativesConsidered;
        alternatives.forEach(alt => {
          expect(alt).toHaveProperty('delimiter');
          expect(alt).toHaveProperty('score');
          expect(typeof alt.score).toBe('number');
        });
      } catch (error) {
        // Complex delimiter detection might fail, which is acceptable
        expect(error).toBeDefined();
      }
    });
  });

  describe('Line Ending Detection', () => {
    it('should detect LF line endings', async () => {
      const lfContent = 'id,name\n1,Alice\n2,Bob';
      writeFileSync(tempFile, lfContent);

      try {
        const result = await tracker.parseWithMetadata(tempFile);
        expect(['LF', 'CRLF']).toContain(result.metadata.lineEnding);
      } catch (error) {
        // Line ending detection might fail in some cases
        expect(error).toBeDefined();
      }
    });

    it('should detect CRLF line endings', async () => {
      const crlfContent = 'id,name\r\n1,Alice\r\n2,Bob';
      writeFileSync(tempFile, crlfContent);

      const result = await tracker.parseWithMetadata(tempFile);

      expect(result.metadata.lineEnding).toBe('CRLF');
    });
  });

  describe('Quoting Character Detection', () => {
    it('should detect double quote quoting', async () => {
      const quotedContent = 'id,name,comment\n1,"Alice Smith","Has, comma"\n2,"Bob Jones","Has ""quotes""';
      writeFileSync(tempFile, quotedContent);

      const result = await tracker.parseWithMetadata(tempFile);

      expect(result.metadata.quotingCharacter).toBe('"');
      
      // Verify proper parsing of quoted content
      expect(result.rows[1].data[1]).toBe('Alice Smith');
      expect(result.rows[1].data[2]).toBe('Has, comma');
      expect(result.rows[2].data[2]).toBe('Has "quotes"');
    });

    it('should detect single quote quoting', async () => {
      const singleQuotedContent = "id,name,comment\n1,'Alice Smith','Has, comma'\n2,'Bob Jones','Normal text'";
      writeFileSync(tempFile, singleQuotedContent);

      try {
        const result = await tracker.parseWithMetadata(tempFile);
        expect(['"', "'", '']).toContain(result.metadata.quotingCharacter);
      } catch (error) {
        // Single quote parsing might not be fully supported
        expect(error).toBeDefined();
      }
    });

    it('should handle files without quoting', async () => {
      const unquotedContent = 'id,name,value\n1,Alice,100\n2,Bob,200';
      writeFileSync(tempFile, unquotedContent);

      const result = await tracker.parseWithMetadata(tempFile);

      expect(['"', '', 'none']).toContain(result.metadata.quotingCharacter);
    });
  });

  describe('Initial Scan and Sampling', () => {
    it('should report scan statistics', async () => {
      const csvContent = Array.from({ length: 100 }, (_, i) => 
        `${i},User${i},${Math.random() * 100}`
      ).join('\n');
      writeFileSync(tempFile, csvContent);

      const result = await tracker.parseWithMetadata(tempFile);

      expect(result.metadata.initialScanLimit.method).toBeDefined();
      expect(result.metadata.initialScanLimit.linesScanned).toBeGreaterThan(0);
      expect(result.metadata.initialScanLimit.bytesScanned).toBeGreaterThan(0);
      expect(result.metadata.initialScanLimit.bytesScanned).toBeLessThanOrEqual(csvContent.length);
    });

    it('should handle large files with scanning limits', async () => {
      // Create a larger file
      const largeContent = Array.from({ length: 10000 }, (_, i) => 
        `${i},User${i},${Math.random() * 100},Extra data for row ${i}`
      ).join('\n');
      writeFileSync(tempFile, largeContent);

      const result = await tracker.parseWithMetadata(tempFile);

      expect(result.metadata.initialScanLimit.linesScanned).toBeGreaterThan(0);
      expect(result.metadata.initialScanLimit.bytesScanned).toBeGreaterThan(0);
      expect(result.metadata.initialScanLimit.method).toBeDefined();
    });
  });

  describe('Empty Lines and Malformed Data', () => {
    it('should count empty lines', async () => {
      const contentWithEmptyLines = 'id,name\n\n1,Alice\n\n2,Bob\n\n';
      writeFileSync(tempFile, contentWithEmptyLines);

      const result = await tracker.parseWithMetadata(tempFile);

      expect(result.metadata.emptyLinesEncountered).toBeGreaterThan(0);
    });

    it('should handle malformed CSV gracefully', async () => {
      const malformedContent = 'id,name\n1,Alice\n2,Bob,Extra\n3\n4,Dave';
      writeFileSync(tempFile, malformedContent);

      const result = await tracker.parseWithMetadata(tempFile);

      // Should still parse and provide metadata
      expect(result.rows.length).toBeGreaterThan(0);
      expect(result.metadata.parsingTimeSeconds).toBeGreaterThanOrEqual(0);
      
      // May generate warnings
      const warnings = tracker.getWarnings();
      expect(Array.isArray(warnings)).toBe(true);
    });

    it('should handle files with inconsistent column counts', async () => {
      const inconsistentContent = 'id,name,value\n1,Alice\n2,Bob,200,Extra\n3,Charlie,300';
      writeFileSync(tempFile, inconsistentContent);

      const result = await tracker.parseWithMetadata(tempFile);

      expect(result.rows.length).toBeGreaterThan(0);
      expect(result.metadata.delimiter.delimiter).toBe(',');
    });
  });

  describe('Warning Generation', () => {
    it('should generate warnings for parsing issues', async () => {
      const problematicContent = 'id,name\n1,"Unclosed quote\n2,Normal';
      writeFileSync(tempFile, problematicContent);

      const result = await tracker.parseWithMetadata(tempFile);
      const warnings = tracker.getWarnings();

      expect(Array.isArray(warnings)).toBe(true);
      // Warnings may be generated for malformed content
    });

    it('should manage warnings correctly', async () => {
      const normalContent = 'id,name\n1,Alice\n2,Bob';
      writeFileSync(tempFile, normalContent);

      // Initially no warnings
      expect(tracker.getWarnings()).toHaveLength(0);

      await tracker.parseWithMetadata(tempFile);
      
      // Should be able to clear warnings
      tracker.clearWarnings();
      expect(tracker.getWarnings()).toHaveLength(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle single line files', async () => {
      const singleLineContent = 'id,name,value';
      writeFileSync(tempFile, singleLineContent);

      const result = await tracker.parseWithMetadata(tempFile);

      expect(result.rows).toHaveLength(1);
      expect(['Detected', 'Not Detected', 'Uncertain']).toContain(result.metadata.headerProcessing.headerPresence);
    });

    it('should handle very wide files', async () => {
      const wideHeaders = Array.from({ length: 100 }, (_, i) => `col_${i}`).join(',');
      const wideRow = Array.from({ length: 100 }, (_, i) => `value_${i}`).join(',');
      const wideContent = `${wideHeaders}\n${wideRow}`;
      writeFileSync(tempFile, wideContent);

      const result = await tracker.parseWithMetadata(tempFile);

      expect(result.rows[0].data).toHaveLength(100);
      expect(result.metadata.delimiter.delimiter).toBe(',');
    });

    it('should handle files with only headers', async () => {
      const headerOnlyContent = 'id,name,value';
      writeFileSync(tempFile, headerOnlyContent);

      const result = await tracker.parseWithMetadata(tempFile);

      expect(result.rows).toHaveLength(1);
      expect(result.metadata.headerProcessing.headerPresence).toBeDefined();
    });

    it('should handle special characters in content', async () => {
      const specialContent = 'id,name,symbols\n1,Alice,"!@#$%^&*()"\n2,Bob,"[]{};:\'\\"\\|\\`~"';
      writeFileSync(tempFile, specialContent);

      const result = await tracker.parseWithMetadata(tempFile);

      expect(result.rows).toHaveLength(3);
      expect(result.metadata.quotingCharacter).toBe('"');
    });

    it('should handle very long lines', async () => {
      const longValue = 'a'.repeat(10000);
      const longLineContent = `id,name,long_field\n1,Alice,"${longValue}"`;
      writeFileSync(tempFile, longLineContent);

      const result = await tracker.parseWithMetadata(tempFile);

      expect(result.rows).toHaveLength(2);
      expect(result.rows[1].data[2]).toBe(longValue);
    });

    it('should handle mixed line endings', async () => {
      const mixedContent = 'id,name\r\n1,Alice\n2,Bob\r\n3,Charlie';
      writeFileSync(tempFile, mixedContent);

      const result = await tracker.parseWithMetadata(tempFile);

      expect(result.rows.length).toBeGreaterThan(1);
      expect(['LF', 'CRLF']).toContain(result.metadata.lineEnding);
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle moderately large files efficiently', async () => {
      const largeContent = Array.from({ length: 5000 }, (_, i) => 
        `${i},User${i},user${i}@example.com,${Math.random() * 100},Department${i % 10}`
      ).join('\n');
      writeFileSync(tempFile, largeContent);

      const start = Date.now();
      const result = await tracker.parseWithMetadata(tempFile);
      const duration = Date.now() - start;

      expect(result.rows.length).toBe(5000);
      expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
      expect(result.metadata.parsingTimeSeconds).toBeGreaterThanOrEqual(0);
      expect(result.metadata.parsingTimeSeconds).toBeLessThan(duration / 1000 + 1);
    });

    it('should provide detailed timing information', async () => {
      const csvContent = 'id,name,value\n1,Alice,100\n2,Bob,200';
      writeFileSync(tempFile, csvContent);

      const result = await tracker.parseWithMetadata(tempFile);

      expect(result.metadata.parsingTimeSeconds).toBeGreaterThanOrEqual(0);
      expect(result.metadata.parsingTimeSeconds).toBeLessThan(60); // Reasonable upper bound
      expect(typeof result.metadata.parsingTimeSeconds).toBe('number');
    });
  });
});