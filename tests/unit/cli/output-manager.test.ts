/**
 * Comprehensive tests for CLI Output Manager
 * Focus on OutputManager functionality with simplified mock data
 */

import { OutputManager } from '@/cli/output-manager';
import type { CLIOptions } from '@/cli/types';
import { writeFileSync, unlinkSync, mkdtempSync, readFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

// Mock fs methods
jest.mock('fs');
const mockFs = {
  writeFileSync: writeFileSync as jest.MockedFunction<typeof writeFileSync>,
  unlinkSync: unlinkSync as jest.MockedFunction<typeof unlinkSync>,
  mkdtempSync: mkdtempSync as jest.MockedFunction<typeof mkdtempSync>,
  readFileSync: readFileSync as jest.MockedFunction<typeof readFileSync>,
  mkdirSync: mkdirSync as jest.MockedFunction<typeof mkdirSync>,
};

// Create minimal valid mock data that satisfies the type requirements
const createMinimalSection1Result = () => ({
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
} as any);

const createMinimalSection2Result = () => ({
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
      topStrengths: [
        { description: 'High uniqueness', category: 'uniqueness', impact: 'high' },
      ],
      topWeaknesses: [
        { description: 'Some accuracy issues', category: 'accuracy', severity: 'medium', priority: 3 }
      ],
      technicalDebt: {
        timeEstimate: '2 hours',
        complexityLevel: 'Medium',
        primaryDebtContributors: ['Missing values'],
        automatedCleaningPotential: {
          fixableIssues: 5,
          examples: ['Fill nulls', 'Remove duplicates'],
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
  warnings: [],
  performanceMetrics: {
    totalAnalysisTime: 1500,
    peakMemoryUsage: 45.2,
    phases: {
      parsing: 200,
      analysis: 1300
    }
  },
} as any);

const createMinimalSection3Result = () => ({
  edaAnalysis: {
    crossVariableInsights: {
      topFindings: [
        'Strong correlation between price and quality',
        'Age distribution is right-skewed',
        'Category shows significant variance'
      ],
      dataQualityIssues: [],
      hypothesesGenerated: [],
      preprocessingRecommendations: []
    },
  },
  warnings: [],
  performanceMetrics: {
    totalAnalysisTime: 2500,
    peakMemoryUsage: 65.8,
  },
  metadata: {
    analysisApproach: 'comprehensive',
    datasetSize: 1000,
    columnsAnalyzed: 5,
    samplingApplied: false
  }
} as any);

const createMinimalSection4Result = () => ({
  visualizationAnalysis: {
    chartRecommendations: [],
    aestheticGuidance: {},
    accessibilityAssessment: {}
  },
  warnings: [
    {
      severity: 'critical',
      message: 'Color accessibility concerns',
      impact: 'May not meet WCAG standards',
      suggestion: 'Update color palette',
      affectedComponents: ['charts']
    },
    {
      severity: 'high',
      message: 'Chart complexity high',
      impact: 'Consider simplification',
      suggestion: 'Reduce chart elements',
      affectedComponents: ['visualization']
    },
  ],
  performanceMetrics: {
    analysisTimeMs: 1800,
    recommendationsGenerated: 12,
    chartTypesConsidered: 8,
    accessibilityChecks: 5
  },
  metadata: {
    analysisApproach: 'comprehensive',
    totalColumns: 5,
    bivariateRelationships: 10,
    recommendationConfidence: 0.92
  }
} as any);

const createMinimalSection5Result = () => ({
  engineeringAnalysis: {
    schemaAnalysis: {
      optimizedSchema: {
        targetSystem: 'PostgreSQL',
        ddlStatement: 'CREATE TABLE...',
        columns: [],
        constraints: [],
        indexes: []
      },
      recommendations: [],
      migrationComplexity: 'Medium'
    },
    featureEngineering: {},
    mlReadiness: {}
  },
  warnings: [],
  performanceMetrics: {
    analysisTimeMs: 3200,
    transformationsEvaluated: 25,
    schemaRecommendationsGenerated: 8,
    mlFeaturesDesigned: 12
  },
  metadata: {
    analysisApproach: 'comprehensive',
    sourceDatasetSize: 1000,
    engineeredFeatureCount: 12,
    mlReadinessScore: 88
  }
} as any);

const createMinimalSection6Result = () => ({
  modelingAnalysis: {
    identifiedTasks: [],
    algorithmRecommendations: [],
    workflowGuidance: {
      phases: [],
      recommendations: [],
      bestPractices: []
    },
    evaluationFramework: {
      strategy: 'cross-validation',
      testSize: 0.2,
      validationMethods: []
    },
    interpretationGuidance: {
      featureImportance: {
        importanceMethod: 'permutation',
        featureRankings: [],
        stabilityAnalysis: {
          variability: 0.1,
          confidence: 0.95
        },
        businessRelevance: []
      },
      explanationMethods: [],
      businessContext: []
    },
    ethicsAnalysis: {
      biasAssessment: {
        potentialBiasSources: [],
        sensitiveAttributes: [],
        biasTests: [],
        overallRiskLevel: 'low',
        mitigationStrategies: []
      },
      fairnessMetrics: [],
      recommendations: []
    },
    implementationRoadmap: {
      phases: [],
      milestones: [],
      riskAssessment: []
    }
  },
  warnings: [],
  performanceMetrics: {
    analysisTimeMs: 4100,
    tasksIdentified: 3,
    algorithmsEvaluated: 15,
    ethicsChecksPerformed: 8,
    recommendationsGenerated: 12
  },
  metadata: {
    analysisApproach: 'comprehensive',
    complexityLevel: 'medium',
    recommendationConfidence: 'high',
    primaryFocus: ['classification', 'regression'],
    limitationsIdentified: ['small dataset', 'limited features']
  }
} as any);

describe('OutputManager', () => {
  let tempDir: string;
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeAll(() => {
    // Setup mock implementations
    mockFs.mkdtempSync.mockImplementation((prefix: string) => `/tmp/test-${Date.now()}`);
    mockFs.writeFileSync.mockImplementation(() => {});
    mockFs.readFileSync.mockImplementation((path: string) => {
      if (path.includes('test-content')) {
        return 'test file content';
      }
      return '';
    });
    mockFs.mkdirSync.mockImplementation(() => undefined as any);
  });

  beforeEach(() => {
    tempDir = `/tmp/test-${Date.now()}`;
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    jest.clearAllMocks();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('Constructor and Basic Setup', () => {
    it('should create OutputManager with default options', () => {
      const options: CLIOptions = {};
      const manager = new OutputManager(options);
      
      expect(manager).toBeInstanceOf(OutputManager);
    });

    it('should create OutputManager with full options', () => {
      const options: CLIOptions = {
        output: 'json',
        outputFile: '/path/to/output.json',
        verbose: true,
        quiet: false,
      };
      const manager = new OutputManager(options);
      
      expect(manager).toBeInstanceOf(OutputManager);
    });
  });

  describe('Section 1 Output - All Formats', () => {
    let mockResult: any;

    beforeEach(() => {
      mockResult = createMinimalSection1Result();
    });

    describe('Markdown Output', () => {
      it('should output Section 1 as markdown to file', () => {
        const options: CLIOptions = {
          output: 'markdown',
          outputFile: join(tempDir, 'section1.md'),
          quiet: true,
        };
        const manager = new OutputManager(options);
        
        const outputFiles = manager.outputSection1(mockResult);
        
        expect(outputFiles).toHaveLength(1);
        expect(outputFiles[0]).toBe(join(tempDir, 'section1.md'));
        expect(mockFs.writeFileSync).toHaveBeenCalledWith(
          join(tempDir, 'section1.md'),
          expect.any(String),
          'utf8'
        );
      });

      it('should output Section 1 as markdown to stdout when no file specified', () => {
        const options: CLIOptions = {
          output: 'markdown',
          quiet: true,
        };
        const manager = new OutputManager(options);
        
        const outputFiles = manager.outputSection1(mockResult);
        
        expect(outputFiles).toHaveLength(0);
        expect(consoleLogSpy).toHaveBeenCalled();
      });

      it('should auto-generate filename when input filename provided', () => {
        const options: CLIOptions = {
          output: 'markdown',
          quiet: true,
        };
        const manager = new OutputManager(options);
        
        const outputFiles = manager.outputSection1(mockResult, 'input.csv');
        
        expect(outputFiles).toHaveLength(1);
        expect(outputFiles[0]).toBe('input_datapilot_report.md');
      });

      it('should handle default output format (fallback to markdown)', () => {
        const options: CLIOptions = {
          quiet: true,
        };
        const manager = new OutputManager(options);
        
        const outputFiles = manager.outputSection1(mockResult, 'input.csv');
        
        expect(outputFiles).toHaveLength(1);
        expect(outputFiles[0]).toBe('input_datapilot_report.md');
      });
    });

    describe('JSON Output', () => {
      it('should output Section 1 as JSON', () => {
        const options: CLIOptions = {
          output: 'json',
          outputFile: join(tempDir, 'section1.json'),
          quiet: true,
        };
        const manager = new OutputManager(options);
        
        const outputFiles = manager.outputSection1(mockResult);
        
        expect(outputFiles).toHaveLength(1);
        expect(mockFs.writeFileSync).toHaveBeenCalledWith(
          join(tempDir, 'section1.json'),
          expect.stringContaining('"metadata"'),
          'utf8'
        );
      });

      it('should create valid JSON structure', () => {
        const options: CLIOptions = {
          output: 'json',
          quiet: true,
        };
        const manager = new OutputManager(options);
        
        manager.outputSection1(mockResult);
        
        const jsonCall = consoleLogSpy.mock.calls.find(call => 
          call[0].includes('"metadata"')
        );
        expect(jsonCall).toBeDefined();
        
        const jsonContent = jsonCall[0];
        expect(() => JSON.parse(jsonContent)).not.toThrow();
        
        const parsed = JSON.parse(jsonContent);
        expect(parsed.metadata).toBeDefined();
        expect(parsed.metadata.version).toBe('1.0.0');
        expect(parsed.metadata.command).toBe('datapilot');
        expect(parsed.overview).toBeDefined();
        expect(parsed.warnings).toBeDefined();
      });
    });

    describe('YAML Output', () => {
      it('should output Section 1 as YAML', () => {
        const options: CLIOptions = {
          output: 'yaml',
          outputFile: join(tempDir, 'section1.yaml'),
          quiet: true,
        };
        const manager = new OutputManager(options);
        
        const outputFiles = manager.outputSection1(mockResult);
        
        expect(outputFiles).toHaveLength(1);
        expect(mockFs.writeFileSync).toHaveBeenCalledWith(
          join(tempDir, 'section1.yaml'),
          expect.stringMatching(/metadata:/),
          'utf8'
        );
      });

      it('should handle special characters in YAML', () => {
        const options: CLIOptions = {
          output: 'yaml',
          quiet: true,
        };
        const manager = new OutputManager(options);
        
        // Add special characters
        mockResult.overview.fileDetails.originalFilename = 'data with "quotes" & symbols.csv';
        mockResult.warnings[0].message = 'Warning with \n newlines and \\ backslashes';
        
        manager.outputSection1(mockResult);
        
        expect(consoleLogSpy).toHaveBeenCalled();
        const yamlContent = consoleLogSpy.mock.calls[0][0];
        expect(yamlContent).toContain('originalFilename:');
        expect(yamlContent).toContain('\\"quotes\\"');
        expect(yamlContent).toContain('\\n');
        expect(yamlContent).toContain('\\\\');
      });

      it('should handle circular references in YAML', () => {
        const options: CLIOptions = {
          output: 'yaml',
          quiet: true,
        };
        const manager = new OutputManager(options);
        
        // Create circular reference
        const circular: any = { prop: 'value' };
        circular.self = circular;
        mockResult.circular = circular;
        
        expect(() => manager.outputSection1(mockResult)).not.toThrow();
        
        const yamlContent = consoleLogSpy.mock.calls[0][0];
        expect(yamlContent).toContain('[Circular Reference]');
      });

      it('should handle undefined values correctly', () => {
        const options: CLIOptions = {
          output: 'yaml',
          quiet: true,
        };
        const manager = new OutputManager(options);
        
        // Add undefined values
        mockResult.undefinedProp = undefined;
        mockResult.overview.undefinedNested = undefined;
        
        manager.outputSection1(mockResult);
        
        const yamlContent = consoleLogSpy.mock.calls[0][0];
        expect(yamlContent).not.toContain('undefined');
      });

      it('should handle null values correctly', () => {
        const options: CLIOptions = {
          output: 'yaml',
          quiet: true,
        };
        const manager = new OutputManager(options);
        
        // Add null values
        mockResult.overview.parsingMetadata.encoding.bomType = null;
        
        manager.outputSection1(mockResult);
        
        const yamlContent = consoleLogSpy.mock.calls[0][0];
        expect(yamlContent).toContain('bomType: null');
      });

      it('should handle empty arrays in YAML', () => {
        const options: CLIOptions = {
          output: 'yaml',
          quiet: true,
        };
        const manager = new OutputManager(options);
        
        mockResult.warnings = [];
        
        manager.outputSection1(mockResult);
        
        const yamlContent = consoleLogSpy.mock.calls[0][0];
        expect(yamlContent).toMatch(/warnings: \[\]/);
      });
    });

    describe('Text Output', () => {
      it('should output Section 1 as text', () => {
        const options: CLIOptions = {
          output: 'txt',
          outputFile: join(tempDir, 'section1.txt'),
          quiet: true,
        };
        const manager = new OutputManager(options);
        
        const outputFiles = manager.outputSection1(mockResult);
        
        expect(outputFiles).toHaveLength(1);
        expect(outputFiles[0]).toBe(join(tempDir, 'section1.txt'));
      });

      it('should auto-generate text filename', () => {
        const options: CLIOptions = {
          output: 'txt',
          quiet: true,
        };
        const manager = new OutputManager(options);
        
        const outputFiles = manager.outputSection1(mockResult, 'data.csv');
        
        expect(outputFiles).toHaveLength(1);
        expect(outputFiles[0]).toBe('data_datapilot_report.txt');
      });
    });

    describe('Verbose Mode', () => {
      it('should show summary when verbose and not quiet', () => {
        const options: CLIOptions = {
          output: 'markdown',
          verbose: true,
          quiet: false,
        };
        const manager = new OutputManager(options);
        
        manager.outputSection1(mockResult);
        
        expect(consoleLogSpy).toHaveBeenCalledWith('\n📋 Quick Summary:');
        expect(consoleLogSpy).toHaveBeenCalledWith(expect.any(String));
      });

      it('should not show summary when quiet', () => {
        const options: CLIOptions = {
          output: 'markdown',
          verbose: true,
          quiet: true,
        };
        const manager = new OutputManager(options);
        
        manager.outputSection1(mockResult);
        
        expect(consoleLogSpy).not.toHaveBeenCalledWith('\n📋 Quick Summary:');
      });

      it('should not show summary when not verbose', () => {
        const options: CLIOptions = {
          output: 'markdown',
          verbose: false,
          quiet: false,
        };
        const manager = new OutputManager(options);
        
        manager.outputSection1(mockResult);
        
        expect(consoleLogSpy).not.toHaveBeenCalledWith('\n📋 Quick Summary:');
      });
    });
  });

  describe('Section 2 Output - Quality Analysis', () => {
    let mockResult: any;

    beforeEach(() => {
      mockResult = createMinimalSection2Result();
    });

    it('should output Section 2 as JSON with quality-specific metadata', () => {
      const options: CLIOptions = {
        output: 'json',
        quiet: true,
      };
      const manager = new OutputManager(options);
      
      manager.outputSection2(mockResult);
      
      const jsonContent = consoleLogSpy.mock.calls[0][0];
      const parsed = JSON.parse(jsonContent);
      
      expect(parsed.metadata.command).toBe('datapilot quality');
      expect(parsed.metadata.analysisType).toBe('Data Quality & Integrity Audit');
      expect(parsed.qualityAudit).toBeDefined();
    });

    it('should generate quality-specific filename', () => {
      const options: CLIOptions = {
        output: 'markdown',
        quiet: true,
      };
      const manager = new OutputManager(options);
      
      const outputFiles = manager.outputSection2(mockResult, 'data.csv');
      
      expect(outputFiles[0]).toBe('data_datapilot_quality.md');
    });

    it('should show quality summary in verbose mode', () => {
      const options: CLIOptions = {
        output: 'markdown',
        verbose: true,
        quiet: false,
      };
      const manager = new OutputManager(options);
      
      manager.outputSection2(mockResult);
      
      expect(consoleLogSpy).toHaveBeenCalledWith('\n🧐 Data Quality Summary:');
      expect(consoleLogSpy).toHaveBeenCalledWith('   Overall Score: 85.5/100');
      expect(consoleLogSpy).toHaveBeenCalledWith('   Interpretation: Good');
    });

    it('should handle YAML output for Section 2', () => {
      const options: CLIOptions = {
        output: 'yaml',
        quiet: true,
      };
      const manager = new OutputManager(options);
      
      manager.outputSection2(mockResult);
      
      const yamlContent = consoleLogSpy.mock.calls[0][0];
      expect(yamlContent).toContain('command: "datapilot quality"');
      expect(yamlContent).toContain('analysisType: "Data Quality & Integrity Audit"');
    });
  });

  describe('Section 3 Output - EDA', () => {
    let mockResult: any;

    beforeEach(() => {
      mockResult = createMinimalSection3Result();
    });

    it('should output Section 3 with EDA-specific metadata', () => {
      const options: CLIOptions = {
        output: 'json',
        quiet: true,
      };
      const manager = new OutputManager(options);
      
      manager.outputSection3('EDA Report Content', mockResult);
      
      const jsonContent = consoleLogSpy.mock.calls[0][0];
      const parsed = JSON.parse(jsonContent);
      
      expect(parsed.metadata.command).toBe('datapilot eda');
      expect(parsed.metadata.analysisType).toBe('Exploratory Data Analysis');
      expect(parsed.analysisMetadata).toBeDefined();
    });

    it('should generate EDA-specific filename', () => {
      const options: CLIOptions = {
        output: 'txt',
        quiet: true,
      };
      const manager = new OutputManager(options);
      
      const outputFiles = manager.outputSection3('EDA Report', mockResult, 'input.csv');
      
      expect(outputFiles[0]).toBe('input_datapilot_eda.txt');
    });

    it('should show EDA insights in verbose mode', () => {
      const options: CLIOptions = {
        output: 'markdown',
        verbose: true,
        quiet: false,
      };
      const manager = new OutputManager(options);
      
      manager.outputSection3('EDA Report', mockResult);
      
      expect(consoleLogSpy).toHaveBeenCalledWith('\n📊 EDA Quick Summary:');
      expect(consoleLogSpy).toHaveBeenCalledWith('   1. Strong correlation between price and quality');
      expect(consoleLogSpy).toHaveBeenCalledWith('   2. Age distribution is right-skewed');
      expect(consoleLogSpy).toHaveBeenCalledWith('   3. Category shows significant variance');
    });

    it('should handle case with no top findings', () => {
      const options: CLIOptions = {
        output: 'markdown',
        verbose: true,
        quiet: false,
      };
      const manager = new OutputManager(options);
      
      // Clear top findings
      mockResult.edaAnalysis.crossVariableInsights.topFindings = [];
      
      manager.outputSection3('EDA Report', mockResult);
      
      expect(consoleLogSpy).not.toHaveBeenCalledWith('\n📊 EDA Quick Summary:');
    });

    it('should handle missing edaAnalysis gracefully', () => {
      const options: CLIOptions = {
        output: 'markdown',
        verbose: true,
        quiet: false,
      };
      const manager = new OutputManager(options);
      
      mockResult.edaAnalysis = undefined;
      
      expect(() => {
        manager.outputSection3('EDA Report', mockResult);
      }).not.toThrow();
    });
  });

  describe('Section 4 Output - Visualization', () => {
    let mockResult: any;

    beforeEach(() => {
      mockResult = createMinimalSection4Result();
    });

    it('should output Section 4 with visualization metadata', () => {
      const options: CLIOptions = {
        output: 'yaml',
        quiet: true,
      };
      const manager = new OutputManager(options);
      
      manager.outputSection4('Viz Report Content', mockResult);
      
      const yamlContent = consoleLogSpy.mock.calls[0][0];
      expect(yamlContent).toContain('command: "datapilot viz"');
      expect(yamlContent).toContain('analysisType: "Visualization Intelligence"');
    });

    it('should generate visualization-specific filename', () => {
      const options: CLIOptions = {
        output: 'markdown',
        quiet: true,
      };
      const manager = new OutputManager(options);
      
      const outputFiles = manager.outputSection4('Viz Report', mockResult, 'chart_data.csv');
      
      expect(outputFiles[0]).toBe('chart_data_datapilot_viz.md');
    });

    it('should show visualization summary with warnings', () => {
      const options: CLIOptions = {
        output: 'markdown',
        verbose: true,
        quiet: false,
      };
      const manager = new OutputManager(options);
      
      manager.outputSection4('Viz Report', mockResult);
      
      expect(consoleLogSpy).toHaveBeenCalledWith('\n📊 Visualization Intelligence Quick Summary:');
      expect(consoleLogSpy).toHaveBeenCalledWith('   • Generated 12 chart recommendations across 8 types');
      expect(consoleLogSpy).toHaveBeenCalledWith('   • Overall confidence: 92%');
      expect(consoleLogSpy).toHaveBeenCalledWith('   • Accessibility: WCAG 2.1 AA Ready');
      expect(consoleLogSpy).toHaveBeenCalledWith('   ⚠️  2 critical considerations identified');
    });

    it('should handle case with no warnings', () => {
      const options: CLIOptions = {
        output: 'markdown',
        verbose: true,
        quiet: false,
      };
      const manager = new OutputManager(options);
      
      // Clear warnings
      mockResult.warnings = [];
      
      manager.outputSection4('Viz Report', mockResult);
      
      expect(consoleLogSpy).toHaveBeenCalledWith('\n📊 Visualization Intelligence Quick Summary:');
      expect(consoleLogSpy).not.toHaveBeenCalledWith(expect.stringContaining('critical considerations'));
    });

    it('should handle missing performance metrics', () => {
      const options: CLIOptions = {
        output: 'markdown',
        verbose: true,
        quiet: false,
      };
      const manager = new OutputManager(options);
      
      mockResult.performanceMetrics = undefined;
      mockResult.metadata = undefined;
      
      expect(() => {
        manager.outputSection4('Viz Report', mockResult);
      }).not.toThrow();
    });
  });

  describe('Section 5 Output - Engineering', () => {
    let mockResult: any;

    beforeEach(() => {
      mockResult = createMinimalSection5Result();
    });

    it('should output Section 5 with engineering metadata', () => {
      const options: CLIOptions = {
        output: 'json',
        quiet: true,
      };
      const manager = new OutputManager(options);
      
      manager.outputSection5('Engineering Report', mockResult);
      
      const jsonContent = consoleLogSpy.mock.calls[0][0];
      const parsed = JSON.parse(jsonContent);
      
      expect(parsed.metadata.command).toBe('datapilot engineering');
      expect(parsed.metadata.analysisType).toBe('Data Engineering & Structural Insights');
    });

    it('should generate engineering-specific filename', () => {
      const options: CLIOptions = {
        output: 'yaml',
        quiet: true,
      };
      const manager = new OutputManager(options);
      
      const outputFiles = manager.outputSection5('Eng Report', mockResult, 'database.csv');
      
      expect(outputFiles[0]).toBe('database_datapilot_engineering.yaml');
    });

    it('should show engineering summary', () => {
      const options: CLIOptions = {
        output: 'markdown',
        verbose: true,
        quiet: false,
      };
      const manager = new OutputManager(options);
      
      manager.outputSection5('Engineering Report', mockResult);
      
      expect(consoleLogSpy).toHaveBeenCalledWith('\n🏗️ Data Engineering Quick Summary:');
      expect(consoleLogSpy).toHaveBeenCalledWith('   • ML Readiness Score: 88%');
      expect(consoleLogSpy).toHaveBeenCalledWith('   • Transformations Evaluated: 25');
      expect(consoleLogSpy).toHaveBeenCalledWith('   • Schema Optimization: Ready for PostgreSQL');
    });

    it('should handle missing target system gracefully', () => {
      const options: CLIOptions = {
        output: 'markdown',
        verbose: true,
        quiet: false,
      };
      const manager = new OutputManager(options);
      
      mockResult.engineeringAnalysis.schemaAnalysis.optimizedSchema.targetSystem = null;
      
      manager.outputSection5('Engineering Report', mockResult);
      
      expect(consoleLogSpy).toHaveBeenCalledWith('   • Schema Optimization: Ready for generic SQL');
    });
  });

  describe('Section 6 Output - Modeling', () => {
    let mockResult: any;

    beforeEach(() => {
      mockResult = createMinimalSection6Result();
    });

    it('should output Section 6 with modeling metadata', () => {
      const options: CLIOptions = {
        output: 'yaml',
        quiet: true,
      };
      const manager = new OutputManager(options);
      
      manager.outputSection6('Modeling Report', mockResult);
      
      const yamlContent = consoleLogSpy.mock.calls[0][0];
      expect(yamlContent).toContain('command: "datapilot modeling"');
      expect(yamlContent).toContain('analysisType: "Predictive Modeling & Advanced Analytics Guidance"');
    });

    it('should generate modeling-specific filename', () => {
      const options: CLIOptions = {
        output: 'txt',
        quiet: true,
      };
      const manager = new OutputManager(options);
      
      const outputFiles = manager.outputSection6('Model Report', mockResult, 'ml_data.csv');
      
      expect(outputFiles[0]).toBe('ml_data_datapilot_modeling.txt');
    });

    it('should show modeling summary', () => {
      const options: CLIOptions = {
        output: 'markdown',
        verbose: true,
        quiet: false,
      };
      const manager = new OutputManager(options);
      
      manager.outputSection6('Modeling Report', mockResult);
      
      expect(consoleLogSpy).toHaveBeenCalledWith('\n🧠 Modeling Analysis Quick Summary:');
      expect(consoleLogSpy).toHaveBeenCalledWith('   • Tasks Identified: 3');
      expect(consoleLogSpy).toHaveBeenCalledWith('   • Algorithms Evaluated: 15');
      expect(consoleLogSpy).toHaveBeenCalledWith('   • Ethics Assessment: Complete with bias analysis');
    });
  });

  describe('Utility Functions', () => {
    describe('outputValidation', () => {
      it('should output validation success', () => {
        const options: CLIOptions = {};
        const manager = new OutputManager(options);
        
        manager.outputValidation('/path/to/file.csv', true, []);
        
        expect(consoleLogSpy).toHaveBeenCalledWith('✅ file.csv is a valid CSV file');
      });

      it('should output validation errors', () => {
        const options: CLIOptions = {};
        const manager = new OutputManager(options);
        
        const errors = ['Missing header', 'Invalid delimiter', 'Empty file'];
        manager.outputValidation('/path/to/problematic.csv', false, errors);
        
        expect(consoleLogSpy).toHaveBeenCalledWith('❌ problematic.csv has validation issues:');
        expect(consoleLogSpy).toHaveBeenCalledWith('   • Missing header');
        expect(consoleLogSpy).toHaveBeenCalledWith('   • Invalid delimiter');
        expect(consoleLogSpy).toHaveBeenCalledWith('   • Empty file');
      });

      it('should handle filename extraction correctly', () => {
        const options: CLIOptions = {};
        const manager = new OutputManager(options);
        
        manager.outputValidation('file.csv', true, []);
        
        expect(consoleLogSpy).toHaveBeenCalledWith('✅ file.csv is a valid CSV file');
      });
    });

    describe('outputFileInfo', () => {
      it('should output complete file information', () => {
        const options: CLIOptions = {};
        const manager = new OutputManager(options);
        
        const metadata = {
          originalFilename: 'data.csv',
          fileSizeMB: 25.5,
          encoding: 'utf-8',
          mimeType: 'text/csv',
          lastModified: new Date('2024-01-15T10:30:00Z'),
        };
        
        manager.outputFileInfo(metadata);
        
        expect(consoleLogSpy).toHaveBeenCalledWith('📁 File Information:');
        expect(consoleLogSpy).toHaveBeenCalledWith('   • Name: data.csv');
        expect(consoleLogSpy).toHaveBeenCalledWith('   • Size: 25.50 MB');
        expect(consoleLogSpy).toHaveBeenCalledWith('   • Encoding: utf-8');
        expect(consoleLogSpy).toHaveBeenCalledWith('   • Format: text/csv');
        expect(consoleLogSpy).toHaveBeenCalledWith('   • Modified: 2024-01-15T10:30:00.000Z');
      });

      it('should handle missing metadata gracefully', () => {
        const options: CLIOptions = {};
        const manager = new OutputManager(options);
        
        const metadata = {
          originalFilename: 'data.csv',
          fileSizeMB: undefined,
        };
        
        expect(() => {
          manager.outputFileInfo(metadata);
        }).not.toThrow();
        
        expect(consoleLogSpy).toHaveBeenCalledWith('📁 File Information:');
        expect(consoleLogSpy).toHaveBeenCalledWith('   • Name: data.csv');
        expect(consoleLogSpy).toHaveBeenCalledWith('   • Size: unknown');
        expect(consoleLogSpy).toHaveBeenCalledWith('   • Encoding: auto-detected');
        expect(consoleLogSpy).toHaveBeenCalledWith('   • Modified: unknown');
      });

      it('should handle invalid date gracefully', () => {
        const options: CLIOptions = {};
        const manager = new OutputManager(options);
        
        const metadata = {
          originalFilename: 'data.csv',
          fileSizeMB: 1.5,
          lastModified: {} as Date, // Invalid date object
        };
        
        manager.outputFileInfo(metadata);
        
        expect(consoleLogSpy).toHaveBeenCalledWith('   • Modified: unknown');
      });
    });

    describe('formatFileSize', () => {
      it('should format small sizes as KB', () => {
        const options: CLIOptions = {};
        const manager = new OutputManager(options);
        
        const metadata = { fileSizeMB: 0.005 }; // 5 KB
        manager.outputFileInfo(metadata);
        
        expect(consoleLogSpy).toHaveBeenCalledWith('   • Size: 5.1 KB');
      });

      it('should format medium sizes as MB', () => {
        const options: CLIOptions = {};
        const manager = new OutputManager(options);
        
        const metadata = { fileSizeMB: 150.25 };
        manager.outputFileInfo(metadata);
        
        expect(consoleLogSpy).toHaveBeenCalledWith('   • Size: 150.25 MB');
      });

      it('should format large sizes as GB', () => {
        const options: CLIOptions = {};
        const manager = new OutputManager(options);
        
        const metadata = { fileSizeMB: 2048.5 }; // ~2GB
        manager.outputFileInfo(metadata);
        
        expect(consoleLogSpy).toHaveBeenCalledWith('   • Size: 2.00 GB');
      });

      it('should handle very small sizes', () => {
        const options: CLIOptions = {};
        const manager = new OutputManager(options);
        
        const metadata = { fileSizeMB: 0.0001 }; // Very small
        manager.outputFileInfo(metadata);
        
        expect(consoleLogSpy).toHaveBeenCalledWith('   • Size: 0.1 KB');
      });
    });
  });

  describe('Combined Output Mode', () => {
    let manager: OutputManager;

    beforeEach(() => {
      const options: CLIOptions = {
        output: 'markdown',
        quiet: true,
      };
      manager = new OutputManager(options);
    });

    it('should start and manage combined output mode', () => {
      manager.startCombinedOutput();
      
      // In combine mode, individual sections shouldn't write files
      const section1Result = createMinimalSection1Result();
      const outputFiles = manager.outputSection1(section1Result);
      
      expect(outputFiles).toHaveLength(0);
    });

    it('should combine multiple sections and output', () => {
      manager.startCombinedOutput();
      
      const section1Result = createMinimalSection1Result();
      const section2Result = createMinimalSection2Result();
      
      manager.outputSection1(section1Result);
      manager.outputSection2(section2Result);
      
      const combinedFiles = manager.outputCombined('input.csv');
      
      expect(combinedFiles).toHaveLength(1);
      expect(combinedFiles[0]).toBe('input_datapilot_full_report.md');
      
      // Should write combined content with separator
      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        'input_datapilot_full_report.md',
        expect.stringContaining('\n\n---\n\n'),
        'utf8'
      );
    });

    it('should output combined to stdout when no filename', () => {
      manager.startCombinedOutput();
      
      manager.outputSection1(createMinimalSection1Result());
      
      const combinedFiles = manager.outputCombined();
      
      expect(combinedFiles).toHaveLength(0);
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should output combined to specified file', () => {
      const options: CLIOptions = {
        output: 'txt',
        outputFile: join(tempDir, 'combined.txt'),
        quiet: true,
      };
      manager = new OutputManager(options);
      
      manager.startCombinedOutput();
      manager.outputSection1(createMinimalSection1Result());
      
      const combinedFiles = manager.outputCombined();
      
      expect(combinedFiles).toHaveLength(1);
      expect(combinedFiles[0]).toBe(join(tempDir, 'combined.txt'));
    });

    it('should handle empty combined sections', () => {
      manager.startCombinedOutput();
      
      const combinedFiles = manager.outputCombined('input.csv');
      
      expect(combinedFiles).toHaveLength(0);
    });

    it('should only combine markdown and txt formats', () => {
      const options: CLIOptions = {
        output: 'json',
        quiet: true,
      };
      manager = new OutputManager(options);
      
      manager.startCombinedOutput();
      
      const section1Result = createMinimalSection1Result();
      const outputFiles = manager.outputSection1(section1Result);
      
      // JSON should not be combined, should output normally
      expect(outputFiles).toHaveLength(0);
      expect(consoleLogSpy).toHaveBeenCalled(); // Should output to stdout
    });

    it('should reset combine mode after output', () => {
      manager.startCombinedOutput();
      manager.outputSection1(createMinimalSection1Result());
      manager.outputCombined('input.csv');
      
      // After outputCombined, should reset to normal mode
      const section1Result = createMinimalSection1Result();
      const outputFiles = manager.outputSection1(section1Result, 'test.csv');
      
      expect(outputFiles).toHaveLength(1); // Should create file normally
    });
  });

  describe('File Operations', () => {
    it('should ensure correct file extension', () => {
      const options: CLIOptions = {
        output: 'json',
        outputFile: join(tempDir, 'report'),
        quiet: true,
      };
      const manager = new OutputManager(options);
      
      const outputFiles = manager.outputSection1(createMinimalSection1Result());
      
      expect(outputFiles[0]).toBe(join(tempDir, 'report.json'));
    });

    it('should replace existing extension', () => {
      const options: CLIOptions = {
        output: 'yaml',
        outputFile: join(tempDir, 'report.txt'),
        quiet: true,
      };
      const manager = new OutputManager(options);
      
      const outputFiles = manager.outputSection1(createMinimalSection1Result());
      
      expect(outputFiles[0]).toBe(join(tempDir, 'report.yaml'));
    });

    it('should keep correct extension when already matching', () => {
      const options: CLIOptions = {
        output: 'json',
        outputFile: join(tempDir, 'report.json'),
        quiet: true,
      };
      const manager = new OutputManager(options);
      
      const outputFiles = manager.outputSection1(createMinimalSection1Result());
      
      expect(outputFiles[0]).toBe(join(tempDir, 'report.json'));
    });

    it('should handle write errors gracefully', () => {
      const options: CLIOptions = {
        output: 'json',
        outputFile: join(tempDir, 'report.json'),
        quiet: true,
      };
      const manager = new OutputManager(options);
      
      // Mock write error
      mockFs.writeFileSync.mockImplementationOnce(() => {
        throw new Error('Permission denied');
      });
      
      expect(() => {
        manager.outputSection1(createMinimalSection1Result());
      }).toThrow('Failed to write output file: Permission denied');
    });

    it('should handle non-Error exceptions', () => {
      const options: CLIOptions = {
        output: 'json',
        outputFile: join(tempDir, 'report.json'),
        quiet: true,
      };
      const manager = new OutputManager(options);
      
      // Mock non-Error exception
      mockFs.writeFileSync.mockImplementationOnce(() => {
        throw 'String error';
      });
      
      expect(() => {
        manager.outputSection1(createMinimalSection1Result());
      }).toThrow('Failed to write output file: Unknown error');
    });

    it('should show success message when not quiet', () => {
      const options: CLIOptions = {
        output: 'json',
        outputFile: join(tempDir, 'report.json'),
        quiet: false,
      };
      const manager = new OutputManager(options);
      
      manager.outputSection1(createMinimalSection1Result());
      
      expect(consoleLogSpy).toHaveBeenCalledWith(`📄 Report written to: ${join(tempDir, 'report.json')}`);
    });

    it('should create directories when needed', () => {
      const options: CLIOptions = {
        output: 'json',
        outputFile: join(tempDir, 'subdir', 'report.json'),
        quiet: true,
      };
      const manager = new OutputManager(options);
      
      manager.outputSection1(createMinimalSection1Result());
      
      expect(mockFs.mkdirSync).toHaveBeenCalledWith(
        join(tempDir, 'subdir'),
        { recursive: true }
      );
    });
  });

  describe('Static Methods', () => {
    it('should show available output formats', () => {
      OutputManager.showFormats();
      
      expect(consoleLogSpy).toHaveBeenCalledWith('📄 Available output formats:');
      expect(consoleLogSpy).toHaveBeenCalledWith('   • markdown (default) - Human-readable report with full details');
      expect(consoleLogSpy).toHaveBeenCalledWith('   • json              - Machine-readable structured data');
      expect(consoleLogSpy).toHaveBeenCalledWith('   • yaml              - Human and machine-readable structured data');
      expect(consoleLogSpy).toHaveBeenCalledWith('\nExample: datapilot all data.csv --output json --output-file report.json');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle missing performance metrics', () => {
      const options: CLIOptions = {
        output: 'json',
        quiet: true,
      };
      const manager = new OutputManager(options);
      
      const section4Result = createMinimalSection4Result();
      section4Result.performanceMetrics = undefined;
      
      expect(() => {
        manager.outputSection4('Report', section4Result);
      }).not.toThrow();
    });

    it('should handle missing metadata', () => {
      const options: CLIOptions = {
        output: 'json',
        quiet: true,
      };
      const manager = new OutputManager(options);
      
      const section5Result = createMinimalSection5Result();
      section5Result.metadata = undefined;
      
      expect(() => {
        manager.outputSection5('Report', section5Result);
      }).not.toThrow();
    });

    it('should handle very large objects', () => {
      const options: CLIOptions = {
        output: 'json',
        quiet: true,
      };
      const manager = new OutputManager(options);
      
      const section1Result = createMinimalSection1Result();
      
      // Add large array
      section1Result.warnings = Array.from({ length: 1000 }, (_, i) => ({
        category: 'structural',
        severity: 'low',
        message: `Warning ${i}`,
        impact: `Impact ${i}`,
        suggestion: `Fix ${i}`,
      }));
      
      expect(() => {
        manager.outputSection1(section1Result);
      }).not.toThrow();
    });

    it('should handle deeply nested objects in YAML', () => {
      const options: CLIOptions = {
        output: 'yaml',
        quiet: true,
      };
      const manager = new OutputManager(options);
      
      const section1Result = createMinimalSection1Result();
      section1Result.deepNesting = {
        level1: {
          level2: {
            level3: {
              level4: {
                level5: 'deep value'
              }
            }
          }
        }
      };
      
      expect(() => {
        manager.outputSection1(section1Result);
      }).not.toThrow();
    });

    it('should handle arrays with mixed types in YAML', () => {
      const options: CLIOptions = {
        output: 'yaml',
        quiet: true,
      };
      const manager = new OutputManager(options);
      
      const section1Result = createMinimalSection1Result();
      section1Result.mixedArray = [
        'string',
        42,
        true,
        null,
        { nested: 'object' },
        ['nested', 'array']
      ];
      
      expect(() => {
        manager.outputSection1(section1Result);
      }).not.toThrow();
    });

    it('should handle Date objects correctly in YAML', () => {
      const options: CLIOptions = {
        output: 'yaml',
        quiet: true,
      };
      const manager = new OutputManager(options);
      
      const section1Result = createMinimalSection1Result();
      
      manager.outputSection1(section1Result);
      
      const yamlContent = consoleLogSpy.mock.calls[0][0];
      expect(yamlContent).toContain('2024-01-15T14:30:45.000Z');
    });
  });
});