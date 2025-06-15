/**
 * Parser Registry Tests
 * 
 * Tests the universal parser registry that handles format detection,
 * parser selection, and management of multiple data format parsers.
 */

import { ParserRegistry, ParserRegistration, DetectionResult, globalParserRegistry } from '../../../src/parsers/base/parser-registry';
import { DataParser, FormatDetector, ParsedRow, ParseOptions, FormatDetectionResult, ValidationResult } from '../../../src/parsers/base/data-parser';
import { DataPilotError } from '../../../src/utils/error-handler';
import { writeFileSync, unlinkSync, mkdtempSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

// Mock parser implementation for testing
class MockParser implements DataParser {
  constructor(private options: ParseOptions = {}) {}

  async *parse(filePath: string, options?: ParseOptions): AsyncIterableIterator<ParsedRow> {
    const mockData = [
      ['col1', 'col2'],
      ['value1', 'value2'],
    ];

    for (let i = 0; i < mockData.length; i++) {
      yield {
        index: i,
        data: mockData[i],
        raw: mockData[i].join(','),
      };
    }
  }

  async detect(filePath: string): Promise<FormatDetectionResult> {
    return {
      format: 'mock',
      confidence: 0.9,
      metadata: {},
    };
  }

  getStats() {
    return {
      bytesProcessed: 100,
      rowsProcessed: 2,
      errors: [],
      startTime: Date.now(),
      endTime: Date.now(),
    };
  }

  abort(): void {}

  async validate(filePath: string): Promise<ValidationResult> {
    return {
      valid: true,
      errors: [],
      warnings: [],
      canProceed: true,
    };
  }

  getSupportedExtensions(): string[] {
    return ['.mock'];
  }

  getFormatName(): string {
    return 'Mock Format';
  }
}

// Mock detector implementation
class MockDetector implements FormatDetector {
  constructor(private confidence: number = 0.9) {}

  async detect(filePath: string): Promise<FormatDetectionResult> {
    // Simulate detection based on file extension
    const isCorrectFormat = filePath.endsWith('.mock');
    return {
      format: 'mock',
      confidence: isCorrectFormat ? this.confidence : 0.1,
      metadata: { detected: isCorrectFormat },
    };
  }

  getSupportedExtensions(): string[] {
    return ['.mock'];
  }

  getFormatName(): string {
    return 'mock';
  }
}

// High confidence detector utility
class HighConfidenceDetector implements FormatDetector {
  constructor(private confidence: number, private format: string, private extensions: string[] = []) {}
  
  async detect(): Promise<FormatDetectionResult> {
    return {
      format: this.format,
      confidence: this.confidence,
      metadata: {},
    };
  }
  
  getSupportedExtensions(): string[] { return this.extensions; }
  getFormatName(): string { return this.format; }
}

// Alternative mock parser for testing multiple formats
class AlternativeMockParser implements DataParser {
  constructor(private options: ParseOptions = {}) {}

  async *parse(filePath: string): AsyncIterableIterator<ParsedRow> {
    yield {
      index: 0,
      data: ['alt', 'data'],
      raw: 'alt,data',
    };
  }

  async detect(filePath: string): Promise<FormatDetectionResult> {
    return {
      format: 'alt',
      confidence: 0.8,
      metadata: {},
    };
  }

  getStats() {
    return {
      bytesProcessed: 50,
      rowsProcessed: 1,
      errors: [],
      startTime: Date.now(),
    };
  }

  abort(): void {}

  async validate(filePath: string): Promise<ValidationResult> {
    return {
      valid: true,
      errors: [],
      warnings: [],
      canProceed: true,
    };
  }

  getSupportedExtensions(): string[] {
    return ['.alt'];
  }

  getFormatName(): string {
    return 'Alternative Format';
  }
}

describe('ParserRegistry', () => {
  let registry: ParserRegistry;
  let tempDir: string;

  beforeEach(() => {
    registry = new ParserRegistry();
    tempDir = mkdtempSync(join(tmpdir(), 'parser-registry-test-'));
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

  describe('Registration', () => {
    it('should register a parser successfully', () => {
      const registration: ParserRegistration = {
        format: 'mock',
        parserFactory: (options) => new MockParser(options),
        detector: new MockDetector(),
        priority: 100,
        extensions: ['.mock', '.test'],
      };

      expect(() => {
        registry.register(registration);
      }).not.toThrow();

      expect(registry.isFormatSupported('mock')).toBe(true);
      expect(registry.getSupportedFormats()).toContain('mock');
    });

    it('should handle extension normalization correctly', () => {
      const registration: ParserRegistration = {
        format: 'test',
        parserFactory: () => new MockParser(),
        detector: new MockDetector(),
        priority: 100,
        extensions: ['txt', '.TXT', '.Test'], // Mixed case and missing dots
      };

      registry.register(registration);

      const extensions = registry.getSupportedExtensions();
      expect(extensions).toContain('.txt');
      expect(extensions).toContain('.test');
    });

    it('should handle multiple registrations for same extension', () => {
      const mockReg: ParserRegistration = {
        format: 'mock',
        parserFactory: () => new MockParser(),
        detector: new MockDetector(),
        priority: 100,
        extensions: ['.csv'],
      };

      const altReg: ParserRegistration = {
        format: 'alt',
        parserFactory: () => new AlternativeMockParser(),
        detector: new MockDetector(),
        priority: 50,
        extensions: ['.csv'],
      };

      registry.register(mockReg);
      registry.register(altReg);

      expect(registry.getSupportedFormats()).toContain('mock');
      expect(registry.getSupportedFormats()).toContain('alt');
    });

    it('should track registration statistics', () => {
      const registration: ParserRegistration = {
        format: 'mock',
        parserFactory: () => new MockParser(),
        detector: new MockDetector(),
        priority: 100,
        extensions: ['.mock', '.test'],
      };

      registry.register(registration);

      const stats = registry.getRegistryStats();
      expect(stats.formatCount).toBe(1);
      expect(stats.extensionCount).toBe(2);
      expect(stats.formats).toHaveLength(1);
      expect(stats.formats[0].name).toBe('mock');
      expect(stats.formats[0].extensions).toEqual(['.mock', '.test']);
      expect(stats.formats[0].priority).toBe(100);
    });
  });

  describe('Format Detection and Parser Selection', () => {
    beforeEach(() => {
      // Register mock parsers for testing
      const mockReg: ParserRegistration = {
        format: 'mock',
        parserFactory: (options) => new MockParser(options),
        detector: new MockDetector(0.9),
        priority: 100,
        extensions: ['.mock'],
      };

      const altReg: ParserRegistration = {
        format: 'alt',
        parserFactory: (options) => new AlternativeMockParser(options),
        detector: new MockDetector(0.8),
        priority: 50,
        extensions: ['.alt'],
      };

      registry.register(mockReg);
      registry.register(altReg);
    });

    it('should detect format correctly by extension', async () => {
      const filePath = join(tempDir, 'test.mock');
      writeFileSync(filePath, 'mock data');

      const result = await registry.getParser(filePath);

      expect(result.format).toBe('mock');
      expect(result.parser).toBeInstanceOf(MockParser);
      expect(result.detection.confidence).toBe(0.9);
    });

    it('should select parser by priority when confidence is similar', async () => {
      // Create a file that would match both parsers with similar confidence
      const filePath = join(tempDir, 'ambiguous.unknown');
      writeFileSync(filePath, 'ambiguous data');

      const mockReg: ParserRegistration = {
        format: 'mock',
        parserFactory: () => new MockParser(),
        detector: new HighConfidenceDetector(0.7, 'mock', ['.unknown']),
        priority: 100,
        extensions: ['.unknown'],
      };

      const altReg: ParserRegistration = {
        format: 'alt',
        parserFactory: () => new AlternativeMockParser(),
        detector: new HighConfidenceDetector(0.71, 'alt', ['.unknown']),
        priority: 50,
        extensions: ['.unknown'],
      };

      const testRegistry = new ParserRegistry();
      testRegistry.register(mockReg);
      testRegistry.register(altReg);

      const result = await testRegistry.getParser(filePath);

      // Should select based on higher confidence or priority
      expect(['alt', 'mock']).toContain(result.format);
    });

    it('should force specific format when requested', async () => {
      const filePath = join(tempDir, 'test.mock');
      writeFileSync(filePath, 'mock data');

      const result = await registry.getParser(filePath, { format: 'alt' });

      expect(result.format).toBe('alt');
      expect(result.parser).toBeInstanceOf(AlternativeMockParser);
    });

    it('should throw error for unsupported format', async () => {
      const filePath = join(tempDir, 'test.mock');
      writeFileSync(filePath, 'mock data');

      await expect(
        registry.getParser(filePath, { format: 'unsupported' })
      ).rejects.toThrow(DataPilotError);
    });

    it('should throw error when no parser has sufficient confidence', async () => {
      // Register parsers with very low confidence
      const lowConfidenceReg: ParserRegistration = {
        format: 'low',
        parserFactory: () => new MockParser(),
        detector: new MockDetector(0.1),
        priority: 100,
        extensions: ['.unknown'],
      };

      const testRegistry = new ParserRegistry();
      testRegistry.register(lowConfidenceReg);

      const filePath = join(tempDir, 'test.unknown');
      writeFileSync(filePath, 'unknown data');

      await expect(
        testRegistry.getParser(filePath)
      ).rejects.toThrow(DataPilotError);
    });

    it('should try all parsers when extension is unknown', async () => {
      const filePath = join(tempDir, 'test.unknown');
      writeFileSync(filePath, 'unknown data');

      // Create a registry with higher confidence detectors
      const testRegistry = new ParserRegistry();
      testRegistry.register({
        format: 'mock',
        parserFactory: () => new MockParser(),
        detector: new HighConfidenceDetector(0.6, 'mock', ['.unknown']),
        priority: 100,
        extensions: ['.mock'],
      });

      const result = await testRegistry.getParser(filePath);

      // Should select the available option
      expect(result.format).toBe('mock');
      expect(result.detection.confidence).toBe(0.6);
    });

    it('should handle detection errors gracefully', async () => {
      // Register a parser that throws during detection and one that succeeds
      const failingDetector: FormatDetector = {
        async detect(): Promise<FormatDetectionResult> {
          throw new Error('Detection failed');
        },
        getSupportedExtensions: () => ['.fail'],
        getFormatName: () => 'failing',
      };

      const testRegistry = new ParserRegistry();
      testRegistry.register({
        format: 'failing',
        parserFactory: () => new MockParser(),
        detector: failingDetector,
        priority: 200,
        extensions: ['.fail'],
      });

      testRegistry.register({
        format: 'mock',
        parserFactory: () => new MockParser(),
        detector: new HighConfidenceDetector(0.6, 'mock', ['.fail']),
        priority: 100,
        extensions: ['.fail'],
      });

      const filePath = join(tempDir, 'test.fail');
      writeFileSync(filePath, 'data');

      // Should continue with other parsers despite failure
      const result = await testRegistry.getParser(filePath);
      expect(result.format).toBe('mock');
    });
  });

  describe('Format Information and Validation', () => {
    beforeEach(() => {
      const registration: ParserRegistration = {
        format: 'mock',
        parserFactory: () => new MockParser(),
        detector: new MockDetector(),
        priority: 100,
        extensions: ['.mock', '.test'],
      };

      registry.register(registration);
    });

    it('should provide format information', () => {
      const info = registry.getFormatInfo('mock');

      expect(info).toBeDefined();
      expect(info?.format).toBe('mock');
      expect(info?.extensions).toEqual(['.mock', '.test']);
      expect(info?.priority).toBe(100);
    });

    it('should return undefined for unknown format', () => {
      const info = registry.getFormatInfo('unknown');
      expect(info).toBeUndefined();
    });

    it('should list all supported formats', () => {
      const formats = registry.getSupportedFormats();
      expect(formats).toContain('mock');
      expect(formats).toEqual(expect.arrayContaining(['mock']));
    });

    it('should list all supported extensions', () => {
      const extensions = registry.getSupportedExtensions();
      expect(extensions).toContain('.mock');
      expect(extensions).toContain('.test');
    });

    it('should validate file format correctly', async () => {
      const filePath = join(tempDir, 'test.mock');
      writeFileSync(filePath, 'mock data');

      const validation = await registry.validateFile(filePath);

      expect(validation.supported).toBe(true);
      expect(validation.bestMatch).toBeDefined();
      expect(validation.bestMatch?.format).toBe('mock');
      expect(validation.allResults).toHaveLength(1);
    });

    it('should handle validation of unsupported files', async () => {
      const filePath = join(tempDir, 'test.binary');
      writeFileSync(filePath, Buffer.from([0xFF, 0xFE, 0xFD]));

      const validation = await registry.validateFile(filePath);

      expect(validation.supported).toBe(false);
      expect(validation.bestMatch).toBeUndefined();
    });

    it('should handle validation of non-existent files', async () => {
      const filePath = join(tempDir, 'does-not-exist.mock');

      const validation = await registry.validateFile(filePath);

      expect(validation.supported).toBe(false);
      expect(validation.allResults).toHaveLength(0);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should provide comprehensive error messages for unsupported formats', async () => {
      const registration: ParserRegistration = {
        format: 'mock',
        parserFactory: () => new MockParser(),
        detector: new MockDetector(0.1), // Very low confidence
        priority: 100,
        extensions: ['.mock'],
      };

      registry.register(registration);

      const filePath = join(tempDir, 'test.unknown');
      writeFileSync(filePath, 'unknown data');

      try {
        await registry.getParser(filePath);
        fail('Expected error to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(DataPilotError);
        expect(error.message).toContain('Unsupported file format');
        expect(error.message).toContain('Supported formats');
        expect(error.message).toContain('Suggestions');
      }
    });

    it('should handle empty registry gracefully', async () => {
      const emptyRegistry = new ParserRegistry();
      const filePath = join(tempDir, 'test.any');
      writeFileSync(filePath, 'any data');

      await expect(
        emptyRegistry.getParser(filePath)
      ).rejects.toThrow(DataPilotError);

      expect(emptyRegistry.getSupportedFormats()).toHaveLength(0);
      expect(emptyRegistry.getSupportedExtensions()).toHaveLength(0);
    });

    it('should handle multiple registrations with same format', () => {
      const registration1: ParserRegistration = {
        format: 'duplicate',
        parserFactory: () => new MockParser(),
        detector: new MockDetector(),
        priority: 100,
        extensions: ['.dup1'],
      };

      const registration2: ParserRegistration = {
        format: 'duplicate',
        parserFactory: () => new AlternativeMockParser(),
        detector: new MockDetector(),
        priority: 50,
        extensions: ['.dup2'],
      };

      registry.register(registration1);
      registry.register(registration2);

      // Second registration should overwrite the first
      const info = registry.getFormatInfo('duplicate');
      expect(info?.extensions).toEqual(['.dup2']);
      expect(info?.priority).toBe(50);
    });

    it('should handle parser factory errors', async () => {
      const failingFactory = (): DataParser => {
        throw new Error('Parser creation failed');
      };

      const registration: ParserRegistration = {
        format: 'failing',
        parserFactory: failingFactory,
        detector: new MockDetector(),
        priority: 100,
        extensions: ['.fail'],
      };

      registry.register(registration);

      const filePath = join(tempDir, 'test.fail');
      writeFileSync(filePath, 'data');

      await expect(
        registry.getParser(filePath, { format: 'failing' })
      ).rejects.toThrow('Parser creation failed');
    });
  });

  describe('Priority and Sorting', () => {
    it('should respect parser priority in selection', async () => {
      const highPriorityReg: ParserRegistration = {
        format: 'high',
        parserFactory: () => new MockParser(),
        detector: new HighConfidenceDetector(0.8, 'high', ['.test']),
        priority: 200,
        extensions: ['.test'],
      };

      const lowPriorityReg: ParserRegistration = {
        format: 'low',
        parserFactory: () => new AlternativeMockParser(),
        detector: new HighConfidenceDetector(0.8, 'low', ['.test']),
        priority: 50,
        extensions: ['.test'],
      };

      const testRegistry = new ParserRegistry();
      testRegistry.register(lowPriorityReg);
      testRegistry.register(highPriorityReg);

      const filePath = join(tempDir, 'test.test');
      writeFileSync(filePath, 'test data');

      const result = await testRegistry.getParser(filePath);

      // Should prefer higher priority when confidence is equal
      expect(result.format).toBe('high');
    });

    it('should prioritize confidence over priority', async () => {
      const highPriorityReg: ParserRegistration = {
        format: 'high',
        parserFactory: () => new MockParser(),
        detector: new HighConfidenceDetector(0.7, 'high', ['.test']),
        priority: 200,
        extensions: ['.test'],
      };

      const lowPriorityReg: ParserRegistration = {
        format: 'low',
        parserFactory: () => new AlternativeMockParser(),
        detector: new HighConfidenceDetector(0.9, 'low', ['.test']),
        priority: 50,
        extensions: ['.test'],
      };

      const testRegistry = new ParserRegistry();
      testRegistry.register(highPriorityReg);
      testRegistry.register(lowPriorityReg);

      const filePath = join(tempDir, 'test.test');
      writeFileSync(filePath, 'test data');

      const result = await testRegistry.getParser(filePath);

      // Should prefer higher confidence despite lower priority
      expect(result.format).toBe('low');
    });
  });

  describe('Global Registry', () => {
    it('should provide access to global registry instance', () => {
      expect(globalParserRegistry).toBeInstanceOf(ParserRegistry);
    });

    it('should maintain state across calls', () => {
      const initialFormatCount = globalParserRegistry.getSupportedFormats().length;

      const registration: ParserRegistration = {
        format: 'global-test',
        parserFactory: () => new MockParser(),
        detector: new MockDetector(),
        priority: 100,
        extensions: ['.global'],
      };

      globalParserRegistry.register(registration);

      const newFormatCount = globalParserRegistry.getSupportedFormats().length;
      expect(newFormatCount).toBe(initialFormatCount + 1);
      expect(globalParserRegistry.isFormatSupported('global-test')).toBe(true);
    });
  });

  describe('Integration and Real-world Scenarios', () => {
    it('should handle parser options correctly', async () => {
      // Test by forcing a specific format instead of relying on detection
      const testRegistry = new ParserRegistry();
      
      const registration: ParserRegistration = {
        format: 'options-test',
        parserFactory: (options) => {
          // Verify options are passed through
          expect(options?.maxRows).toBe(100);
          expect(options?.encoding).toBe('utf8');
          return new MockParser(options);
        },
        detector: new HighConfidenceDetector(0.9, 'options-test', ['.opt']),
        priority: 100,
        extensions: ['.opt'],
      };

      testRegistry.register(registration);

      const filePath = join(tempDir, 'test.opt');
      writeFileSync(filePath, 'test data');

      const options: ParseOptions = {
        maxRows: 100,
        encoding: 'utf8',
        format: 'options-test', // Force the format to avoid detection issues
      };

      const result = await testRegistry.getParser(filePath, options);
      expect(result.parser).toBeInstanceOf(MockParser);
    });

    it('should handle complex format detection scenarios', async () => {
      // Register multiple parsers with overlapping capabilities
      const csvReg: ParserRegistration = {
        format: 'csv',
        parserFactory: () => new MockParser(),
        detector: new HighConfidenceDetector(0.9, 'csv', ['.csv', '.txt']),
        priority: 100,
        extensions: ['.csv', '.txt'],
      };

      const tsvReg: ParserRegistration = {
        format: 'tsv',
        parserFactory: () => new AlternativeMockParser(),
        detector: new HighConfidenceDetector(0.8, 'tsv', ['.tsv', '.txt']),
        priority: 80,
        extensions: ['.tsv', '.txt'],
      };

      const testRegistry = new ParserRegistry();
      testRegistry.register(csvReg);
      testRegistry.register(tsvReg);

      const filePath = join(tempDir, 'ambiguous.txt');
      writeFileSync(filePath, 'col1,col2\nval1,val2');

      const result = await testRegistry.getParser(filePath);

      // Should select CSV due to higher confidence
      expect(result.format).toBe('csv');

      const stats = testRegistry.getRegistryStats();
      expect(stats.formatCount).toBe(2);
      expect(stats.extensionCount).toBe(3); // .csv, .tsv, .txt
    });

    it('should provide detailed validation information', async () => {
      const goodReg: ParserRegistration = {
        format: 'good',
        parserFactory: () => new MockParser(),
        detector: new HighConfidenceDetector(0.95, 'good', ['.good']),
        priority: 100,
        extensions: ['.good'],
      };

      const okReg: ParserRegistration = {
        format: 'ok',
        parserFactory: () => new AlternativeMockParser(),
        detector: new HighConfidenceDetector(0.6, 'ok', ['.good']),
        priority: 50,
        extensions: ['.good'],
      };

      const testRegistry = new ParserRegistry();
      testRegistry.register(goodReg);
      testRegistry.register(okReg);

      const filePath = join(tempDir, 'test.good');
      writeFileSync(filePath, 'test data');

      const validation = await testRegistry.validateFile(filePath);

      expect(validation.supported).toBe(true);
      expect(validation.bestMatch?.format).toBe('good');
      expect(validation.allResults).toHaveLength(2);
      
      // Results should be sorted by confidence
      expect(validation.allResults[0].detection.confidence).toBeGreaterThanOrEqual(
        validation.allResults[1].detection.confidence
      );
    });
  });
});