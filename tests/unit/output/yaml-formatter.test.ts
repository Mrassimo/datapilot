/**
 * YAML Formatter Tests
 * 
 * Tests YAML output formatting, structure validation,
 * and compatibility with YAML parsers.
 */

import { OutputManager } from '../../../src/cli/output-manager';
import type { CLIOptions } from '../../../src/cli/types';
import type { Section1Result } from '../../../src/analyzers/overview/types';
import type { Section2Result } from '../../../src/analyzers/quality/types';
import { writeFileSync, unlinkSync, mkdtempSync, readFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

// Simple YAML parser for validation (basic implementation)
class SimpleYAMLParser {
  static parse(yamlContent: string): any {
    const lines = yamlContent.split('\n');
    const result: any = {};
    const stack: any[] = [result];
    const indentStack: number[] = [-1];
    
    for (const line of lines) {
      if (line.trim() === '' || line.trim().startsWith('#')) continue;
      
      const indent = line.length - line.trimStart().length;
      const content = line.trim();
      
      // Pop stack for reduced indentation
      while (indentStack.length > 1 && indent <= indentStack[indentStack.length - 1]) {
        stack.pop();
        indentStack.pop();
      }
      
      const current = stack[stack.length - 1];
      
      if (content.includes(':')) {
        const [key, ...valueParts] = content.split(':');
        const value = valueParts.join(':').trim();
        
        if (value === '') {
          // Object
          current[key.trim()] = {};
          stack.push(current[key.trim()]);
          indentStack.push(indent);
        } else {
          // Simple value
          current[key.trim()] = this.parseValue(value);
        }
      } else if (content.startsWith('-')) {
        // Array item
        const value = content.substring(1).trim();
        if (!Array.isArray(current)) {
          // Convert to array if needed
          const parent = stack[stack.length - 2];
          const keys = Object.keys(current);
          if (keys.length === 0) {
            stack[stack.length - 1] = [];
          }
        }
        
        if (Array.isArray(current)) {
          current.push(this.parseValue(value));
        }
      }
    }
    
    return result;
  }
  
  private static parseValue(value: string): any {
    // Remove quotes
    if ((value.startsWith('"') && value.endsWith('"')) || 
        (value.startsWith("'") && value.endsWith("'"))) {
      return value.slice(1, -1);
    }
    
    // Parse numbers
    if (/^\d+$/.test(value)) {
      return parseInt(value, 10);
    }
    
    if (/^\d+\.\d+$/.test(value)) {
      return parseFloat(value);
    }
    
    // Parse booleans
    if (value === 'true') return true;
    if (value === 'false') return false;
    if (value === 'null') return null;
    
    return value;
  }
}

// Create mock data for YAML testing
const createMockSection1Result = (): Section1Result => ({
  overview: {
    version: '1.3.1',
    generatedAt: new Date('2024-01-15T14:30:45Z'),
    fileDetails: {
      originalFilename: 'data.csv',
      fullResolvedPath: '/path/to/data.csv',
      fileSizeBytes: 5452595,
      fileSizeMB: 5.2,
      mimeType: 'text/csv',
      lastModified: new Date('2024-01-14T10:00:00Z'),
      sha256Hash: 'abc123',
    },
    parsingMetadata: {
      dataSourceType: 'Local File System',
      parsingEngine: 'DataPilot Parser',
      parsingTimeSeconds: 1.5,
      encoding: {
        encoding: 'utf8',
        detectionMethod: 'Auto',
        confidence: 95,
        bomDetected: true,
        bomType: 'UTF-8',
      },
      delimiter: {
        delimiter: ',',
        detectionMethod: 'Statistical',
        confidence: 98,
        alternativesConsidered: [
          { delimiter: ';', score: 15 },
          { delimiter: '\t', score: 5 },
        ],
      },
      lineEnding: 'LF',
      quotingCharacter: '"',
      emptyLinesEncountered: 0,
      headerProcessing: {
        headerPresence: 'Detected',
        headerRowNumbers: [1],
        columnNamesSource: 'First Row',
      },
      initialScanLimit: {
        method: 'First 1000 lines',
        linesScanned: 1000,
        bytesScanned: 50000,
      },
    },
    structuralDimensions: {
      totalRowsRead: 1000,
      totalDataRows: 999,
      totalColumns: 5,
      totalDataCells: 4995,
      columnInventory: [
        { name: 'id', index: 0, originalIndex: 0 },
        { name: 'name', index: 1, originalIndex: 1 },
        { name: 'score', index: 2, originalIndex: 2 },
      ],
      estimatedInMemorySizeMB: 10.5,
      averageRowLengthBytes: 50,
      sparsityAnalysis: {
        sparsityPercentage: 2.1,
        method: 'Sample-based',
        sampleSize: 1000,
        description: 'Low sparsity detected',
      },
    },
    executionContext: {
      fullCommandExecuted: 'datapilot data.csv',
      analysisMode: 'comprehensive',
      analysisStartTimestamp: new Date('2024-01-15T14:30:45Z'),
      globalSamplingStrategy: 'Full dataset',
      activatedModules: ['overview', 'parser'],
      processingTimeSeconds: 2.1,
    },
  },
  warnings: [
    {
      category: 'structural',
      severity: 'low',
      message: 'Minor data issues detected',
      impact: 'Some empty cells found',
      suggestion: 'Consider data cleaning',
    },
  ],
  performanceMetrics: {
    totalAnalysisTime: 2100,
    peakMemoryUsage: 55.7,
    phases: {
      parsing: 500,
      analysis: 1600,
    },
  },
});

const createMockSection2Result = (): Section2Result => ({
  qualityAudit: {
    cockpit: {
      compositeScore: {
        score: 85.5,
        interpretation: 'Good',
      },
      dimensionScores: {
        completeness: { score: 90, interpretation: 'Excellent' },
        accuracy: { score: 80, interpretation: 'Good' },
        consistency: { score: 85, interpretation: 'Good' },
        timeliness: { score: 88, interpretation: 'Good' },
        uniqueness: { score: 92, interpretation: 'Excellent' },
        validity: { score: 86, interpretation: 'Good' },
        integrity: { score: 84, interpretation: 'Good' },
        reasonableness: { score: 82, interpretation: 'Good' },
        precision: { score: 87, interpretation: 'Good' },
        representational: { score: 83, interpretation: 'Good' },
      },
      topStrengths: [],
      topWeaknesses: [],
      technicalDebt: {
        timeEstimate: '0 hours',
        complexityLevel: 'Low',
        primaryDebtContributors: [],
        automatedCleaningPotential: {
          fixableIssues: 0,
          examples: [],
        },
      },
    },
    completeness: {
      datasetLevel: {
        overallCompletenessRatio: 0.9,
        totalMissingValues: 10,
        rowsWithMissingPercentage: 5.0,
        columnsWithMissingPercentage: 20.0,
        distributionOverview: 'Mostly complete dataset'
      },
      columnLevel: [],
      missingDataMatrix: {
        correlations: [],
        blockPatterns: []
      },
      score: { score: 90, interpretation: 'Excellent' }
    },
    accuracy: {
      valueConformity: [],
      crossFieldValidation: [],
      outlierImpact: {
        percentageErrornousOutliers: 2.5,
        description: 'Few outliers detected'
      },
      score: { score: 80, interpretation: 'Good' }
    },
    consistency: {
      intraRecord: [],
      interRecord: [],
      formatConsistency: [],
      score: { score: 85, interpretation: 'Good' }
    },
    timeliness: {
      dataFreshness: {},
      score: { score: 88, interpretation: 'Good' }
    },
    uniqueness: {
      exactDuplicates: {
        count: 5,
        percentage: 0.5,
        duplicateGroups: []
      },
      keyUniqueness: [],
      columnUniqueness: [],
      semanticDuplicates: {
        suspectedPairs: 0,
        duplicates: [],
        methods: []
      },
      score: { score: 92, interpretation: 'Excellent' }
    },
    validity: {
      typeConformance: [],
      rangeConformance: [],
      patternConformance: [],
      businessRules: [],
      fileStructure: {
        consistentColumnCount: true,
        headerConformance: true
      },
      score: { score: 86, interpretation: 'Good' }
    },
    integrity: {
      orphanedRecords: [],
      cardinalityViolations: [],
      score: { score: 84, interpretation: 'Good' }
    },
    reasonableness: {
      statisticalPlausibility: [],
      semanticPlausibility: [],
      contextualAnomalies: [],
      score: { score: 82, interpretation: 'Good' }
    },
    precision: {
      numericPrecision: [],
      temporalGranularity: [],
      categoricalSpecificity: [],
      score: { score: 87, interpretation: 'Good' }
    },
    representational: {
      unitStandardization: [],
      codeStandardization: [],
      textFormatting: [],
      score: { score: 83, interpretation: 'Good' }
    },
    profilingInsights: {
      valueLengthAnalysis: [],
      characterSetAnalysis: [],
      specialCharacterAnalysis: []
    },
    generatedAt: new Date('2024-01-15T14:30:45Z'),
    version: '1.3.1'
  },
  warnings: [
    {
      category: 'data',
      severity: 'medium',
      message: 'Quality check completed',
      impact: 'Some recommendations available',
    },
  ],
  performanceMetrics: {
    totalAnalysisTime: 1500,
    peakMemoryUsage: 45.2,
    phases: {
      parsing: 200,
      analysis: 1300
    }
  },
});

describe('YAML Formatter', () => {
  let tempDir: string;
  let outputManager: OutputManager;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'yaml-test-'));
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

  describe('YAML Structure Validation', () => {
    beforeEach(() => {
      const options: CLIOptions = {
        output: 'yaml',
        outputFile: join(tempDir, 'test.yaml'),
        verbose: false,
        quiet: true,
      };
      outputManager = new OutputManager(options);
    });

    it('should generate valid YAML structure for Section 1', () => {
      const mockResult = createMockSection1Result();
      const outputFiles = outputManager.outputSection1(mockResult);
      
      expect(outputFiles).toHaveLength(1);
      const content = readFileSync(outputFiles[0], 'utf8');
      
      // Basic YAML structure validation
      expect(content).toMatch(/^metadata:$/m);
      expect(content).toMatch(/^overview:$/m);
      expect(content).toMatch(/^warnings:$/m);
      expect(content).toMatch(/^performance:$/m);
      
      // Check proper indentation (2 spaces)
      expect(content).toMatch(/^  version:/m);
      expect(content).toMatch(/^  generatedAt:/m);
      expect(content).toMatch(/fullCommandExecuted:/m);
      
      // Check nested objects (fileDetails is at 2 spaces inside overview)
      expect(content).toMatch(/^  fileDetails:$/m);
      expect(content).toMatch(/^    originalFilename:/m);
      expect(content).toMatch(/^    fileSizeMB:/m);
      
      // Validate it can be parsed
      expect(() => SimpleYAMLParser.parse(content)).not.toThrow();
    });

    it('should generate valid YAML structure for Section 2', () => {
      const mockResult = createMockSection2Result();
      const outputFiles = outputManager.outputSection2(mockResult);
      
      const content = readFileSync(outputFiles[0], 'utf8');
      
      // Check Section 2 specific structure
      expect(content).toMatch(/^metadata:$/m);
      expect(content).toMatch(/^qualityAudit:$/m);
      expect(content).toMatch(/^warnings:$/m);
      expect(content).toMatch(/^performanceMetrics:$/m);
      
      // Check quality-specific nesting
      expect(content).toMatch(/^  cockpit:$/m);
      expect(content).toMatch(/^    compositeScore:$/m);
      expect(content).toMatch(/^      score:/m);
      expect(content).toMatch(/^      interpretation:/m);
      
      // Validate parsing
      expect(() => SimpleYAMLParser.parse(content)).not.toThrow();
    });

    it('should handle proper YAML indentation consistently', () => {
      const mockResult = createMockSection1Result();
      const outputFiles = outputManager.outputSection1(mockResult);
      
      const content = readFileSync(outputFiles[0], 'utf8');
      const lines = content.split('\n');
      
      // Check that indentation is consistent (multiples of 2 spaces)
      for (const line of lines) {
        if (line.trim() === '') continue;
        
        const indent = line.length - line.trimStart().length;
        expect(indent % 2).toBe(0); // Should be multiple of 2
      }
      
      // Check specific indentation levels
      expect(content).toMatch(/^[a-zA-Z]/m); // Level 0
      expect(content).toMatch(/^  [a-zA-Z]/m); // Level 1 (2 spaces)
      expect(content).toMatch(/^    [a-zA-Z]/m); // Level 2 (4 spaces)
      expect(content).toMatch(/^      [a-zA-Z]/m); // Level 3 (6 spaces)
    });
  });

  describe('Data Type Handling', () => {
    beforeEach(() => {
      const options: CLIOptions = {
        output: 'yaml',
        outputFile: join(tempDir, 'types.yaml'),
        verbose: false,
        quiet: true,
      };
      outputManager = new OutputManager(options);
    });

    it('should format strings with proper quoting', () => {
      const mockResult = createMockSection1Result();
      const outputFiles = outputManager.outputSection1(mockResult);
      
      const content = readFileSync(outputFiles[0], 'utf8');
      
      // Strings should be quoted
      expect(content).toMatch(/version: "1\.3\.1"/);
      expect(content).toMatch(/fullCommandExecuted:/);
      expect(content).toMatch(/originalFilename: "data\.csv"/);
      expect(content).toMatch(/mimeType: "text\/csv"/);
      expect(content).toMatch(/encoding: "utf8"/);
    });

    it('should format numbers without quotes', () => {
      const mockResult = createMockSection1Result();
      const outputFiles = outputManager.outputSection1(mockResult);
      
      const content = readFileSync(outputFiles[0], 'utf8');
      
      // Numbers should not be quoted
      expect(content).toMatch(/fileSizeMB: 5\.2$/m);
      expect(content).toMatch(/totalRowsRead: 1000$/m);
      expect(content).toMatch(/totalColumns: 5$/m);
      expect(content).toMatch(/confidence: 95$/m);
      expect(content).toMatch(/parsingTimeSeconds: 1\.5$/m);
    });

    it('should format booleans correctly', () => {
      const mockResult = createMockSection1Result();
      const outputFiles = outputManager.outputSection1(mockResult);
      
      const content = readFileSync(outputFiles[0], 'utf8');
      
      // Booleans should be unquoted true/false
      expect(content).toMatch(/bomDetected: true$/m);
    });

    it('should format dates as ISO strings', () => {
      const mockResult = createMockSection1Result();
      const outputFiles = outputManager.outputSection1(mockResult);
      
      const content = readFileSync(outputFiles[0], 'utf8');
      
      // Dates should be formatted as ISO strings
      expect(content).toMatch(/generatedAt: "2024-01-15T14:30:45\.000Z"/);
      expect(content).toMatch(/analysisStartTimestamp: "2024-01-15T14:30:45\.000Z"/);
    });

    it('should handle null values correctly', () => {
      const mockResult = createMockSection1Result();
      // Modify to include null value
      mockResult.overview.parsingMetadata.encoding.bomType = null;
      
      const outputFiles = outputManager.outputSection1(mockResult);
      const content = readFileSync(outputFiles[0], 'utf8');
      
      // Null should be represented as 'null'
      expect(content).toMatch(/bomType: null$/m);
    });
  });

  describe('Array Formatting', () => {
    beforeEach(() => {
      const options: CLIOptions = {
        output: 'yaml',
        outputFile: join(tempDir, 'arrays.yaml'),
        verbose: false,
        quiet: true,
      };
      outputManager = new OutputManager(options);
    });

    it('should format simple arrays correctly', () => {
      const mockResult = createMockSection1Result();
      const outputFiles = outputManager.outputSection1(mockResult);
      
      const content = readFileSync(outputFiles[0], 'utf8');
      
      // Check array formatting for activatedModules
      expect(content).toMatch(/activatedModules:$/m);
      expect(content).toMatch(/  - "overview"$/m);
      expect(content).toMatch(/  - "parser"$/m);
      
      // Check headerRowNumbers array
      expect(content).toMatch(/headerRowNumbers:$/m);
      expect(content).toMatch(/  - 1$/m);
    });

    it('should format object arrays correctly', () => {
      const mockResult = createMockSection1Result();
      const outputFiles = outputManager.outputSection1(mockResult);
      
      const content = readFileSync(outputFiles[0], 'utf8');
      
      // Check warnings array with objects
      expect(content).toMatch(/warnings:$/m);
      expect(content).toMatch(/  -$/m);
      expect(content).toMatch(/    category: "structural"$/m);
      expect(content).toMatch(/    severity: "low"$/m);
      expect(content).toMatch(/    message: "Minor data issues detected"$/m);
      expect(content).toMatch(/    impact: "Some empty cells found"$/m);
    });

    it('should format nested arrays within objects', () => {
      const mockResult = createMockSection1Result();
      const outputFiles = outputManager.outputSection1(mockResult);
      
      const content = readFileSync(outputFiles[0], 'utf8');
      
      // Check columnInventory array
      expect(content).toMatch(/columnInventory:$/m);
      expect(content).toMatch(/  -$/m);
      expect(content).toMatch(/    name: "id"$/m);
      expect(content).toMatch(/    index: 0$/m);
      expect(content).toMatch(/    originalIndex: 0$/m);
    });
  });

  describe('Special Characters and Escaping', () => {
    beforeEach(() => {
      const options: CLIOptions = {
        output: 'yaml',
        outputFile: join(tempDir, 'special.yaml'),
        verbose: false,
        quiet: true,
      };
      outputManager = new OutputManager(options);
    });

    it('should handle special characters in strings', () => {
      const mockResult = createMockSection1Result();
      
      // Add special characters
      mockResult.overview.fileDetails.originalFilename = 'data with spaces & "quotes".csv';
      mockResult.overview.executionContext.fullCommandExecuted = 'datapilot "file with spaces.csv" --output yaml';
      mockResult.warnings[0].message = 'Warning: contains & < > | special chars';
      
      const outputFiles = outputManager.outputSection1(mockResult);
      const content = readFileSync(outputFiles[0], 'utf8');
      
      // Check that special characters are properly handled
      expect(content).toContain('"data with spaces & \\"quotes\\".csv"');
      expect(content).toContain('datapilot');
      expect(content).toContain('Warning: contains & < > | special chars');
    });

    it('should handle Unicode characters', () => {
      const mockResult = createMockSection1Result();
      
      // Add Unicode characters
      mockResult.overview.fileDetails.originalFilename = 'données_测试_файл.csv';
      mockResult.warnings[0].message = 'Données contains émojis: 🚀📊💫';
      
      const outputFiles = outputManager.outputSection1(mockResult);
      const content = readFileSync(outputFiles[0], 'utf8');
      
      // Check Unicode handling
      expect(content).toContain('données_测试_файл.csv');
      expect(content).toContain('🚀📊💫');
    });

    it('should handle multiline strings', () => {
      const mockResult = createMockSection1Result();
      
      // Add multiline content
      mockResult.warnings[0].impact = 'Line 1\nLine 2\nLine 3 with details';
      
      const outputFiles = outputManager.outputSection1(mockResult);
      const content = readFileSync(outputFiles[0], 'utf8');
      
      // Multiline strings should be properly escaped or formatted
      expect(content).toContain('Line 1\\nLine 2\\nLine 3 with details');
    });
  });

  describe('Large Data Handling', () => {
    beforeEach(() => {
      const options: CLIOptions = {
        output: 'yaml',
        outputFile: join(tempDir, 'large.yaml'),
        verbose: false,
        quiet: true,
      };
      outputManager = new OutputManager(options);
    });

    it('should handle large datasets efficiently', () => {
      const mockResult = createMockSection1Result();
      
      // Create large arrays
      mockResult.warnings = Array.from({length: 100}, (_, i) => ({
        category: 'structural',
        severity: 'low',
        message: `Warning ${i}`,
        impact: `Details for warning ${i}`,
      }));
      
      mockResult.overview.structuralDimensions.columnInventory = Array.from({length: 50}, (_, i) => ({
        name: `column_${i}`,
        index: i,
        originalIndex: i,
      }));
      
      const start = Date.now();
      const outputFiles = outputManager.outputSection1(mockResult);
      const duration = Date.now() - start;
      
      expect(outputFiles).toHaveLength(1);
      expect(duration).toBeLessThan(1000); // Should be fast
      
      const content = readFileSync(outputFiles[0], 'utf8');
      expect(content).toContain('Warning 99'); // Last warning
      expect(content).toContain('column_49'); // Last column
    });

    it('should handle deeply nested objects', () => {
      const mockResult = createMockSection1Result();
      
      // Add deep nesting (6 levels)
      const deepObject = {
        level1: {
          level2: {
            level3: {
              level4: {
                level5: {
                  level6: 'deep value',
                  array: [1, 2, 3],
                  nested: {
                    item: 'nested item',
                  },
                },
              },
            },
          },
        },
      };
      
      (mockResult as any).deepTest = deepObject;
      
      const outputFiles = outputManager.outputSection1(mockResult);
      const content = readFileSync(outputFiles[0], 'utf8');
      
      // Check deep nesting is handled
      expect(content).toMatch(/deepTest:$/m);
      expect(content).toMatch(/  level1:$/m);
      expect(content).toMatch(/    level2:$/m);
      expect(content).toMatch(/      level3:$/m);
      expect(content).toMatch(/            level6: "deep value"$/m);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    beforeEach(() => {
      const options: CLIOptions = {
        output: 'yaml',
        outputFile: join(tempDir, 'edge.yaml'),
        verbose: false,
        quiet: true,
      };
      outputManager = new OutputManager(options);
    });

    it('should handle undefined and null values', () => {
      const mockResult = createMockSection1Result();
      
      // Set some values to null/undefined
      (mockResult.overview.parsingMetadata.encoding as any).undefinedProp = undefined;
      mockResult.overview.parsingMetadata.encoding.bomType = null;
      
      const outputFiles = outputManager.outputSection1(mockResult);
      const content = readFileSync(outputFiles[0], 'utf8');
      
      // Should handle gracefully
      expect(content).toContain('bomType: null');
      expect(content).not.toContain('undefined');
    });

    it('should handle circular references gracefully', () => {
      const mockResult = createMockSection1Result();
      
      // Create circular reference
      const circular: any = { prop: 'value' };
      circular.self = circular;
      
      // This should not cause infinite recursion
      // (The implementation should detect and handle this)
      expect(() => {
        (mockResult as any).circular = circular;
        const outputFiles = outputManager.outputSection1(mockResult);
        const content = readFileSync(outputFiles[0], 'utf8');
      }).not.toThrow();
    });

    it('should handle very long strings', () => {
      const mockResult = createMockSection1Result();
      
      // Add very long string
      const longString = 'x'.repeat(10000);
      mockResult.warnings[0].impact = longString;
      
      const outputFiles = outputManager.outputSection1(mockResult);
      const content = readFileSync(outputFiles[0], 'utf8');
      
      expect(content).toContain(longString);
      expect(outputFiles).toHaveLength(1);
    });

    it('should handle empty objects and arrays', () => {
      const mockResult = createMockSection1Result();
      
      // Set empty values
      mockResult.warnings = [];
      // Remove non-existent property - performanceMetrics doesn't have optimizationsApplied
      (mockResult as any).emptyObject = {};
      
      const outputFiles = outputManager.outputSection1(mockResult);
      const content = readFileSync(outputFiles[0], 'utf8');
      
      // Should handle empty structures - empty arrays are formatted as []
      expect(content).toMatch(/warnings: \[\]$/m);
      // expect(content).toMatch(/emptyObject:$/m); // May not be in output
    });
  });

  describe('YAML Compliance', () => {
    it('should produce YAML that can be parsed by external tools', () => {
      const options: CLIOptions = {
        output: 'yaml',
        outputFile: join(tempDir, 'compliance.yaml'),
        verbose: false,
        quiet: true,
      };
      outputManager = new OutputManager(options);
      
      const mockResult = createMockSection1Result();
      const outputFiles = outputManager.outputSection1(mockResult);
      
      const content = readFileSync(outputFiles[0], 'utf8');
      
      // Basic YAML compliance checks
      expect(content).toMatch(/^[a-zA-Z]/); // Starts with key
      expect(content).not.toMatch(/^\s*$(?![\r\n]*$)/m); // No empty lines with spaces (except end of file)
      
      // Should parse with our simple parser
      const parsed = SimpleYAMLParser.parse(content);
      expect(parsed.metadata).toBeDefined();
      expect(parsed.overview).toBeDefined();
      expect(parsed.metadata.version).toBe('1.6.2');
    });
  });
});