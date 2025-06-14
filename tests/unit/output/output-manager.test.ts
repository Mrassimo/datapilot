/**
 * Output Manager Tests
 * 
 * Tests output formatting for all supported formats (markdown, JSON, YAML)
 * and validates structure, content accuracy, and format compliance.
 */

import { OutputManager } from '../../../src/cli/output-manager';
import type { CLIOptions } from '../../../src/cli/types';
import type { Section1Result } from '../../../src/analyzers/overview/types';
import type { Section2Result } from '../../../src/analyzers/quality/types';
import type { Section3Result } from '../../../src/analyzers/eda/types';
import { writeFileSync, unlinkSync, mkdtempSync, readFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

// Mock data for testing
const createMockSection1Result = (): Section1Result => ({
  overview: {
    version: '1.3.1',
    generatedAt: new Date('2024-01-01T12:00:00Z'),
    fileDetails: {
      originalFilename: 'test-data.csv',
      fullResolvedPath: '/path/to/test-data.csv',
      fileSizeBytes: 2500000,
      fileSizeMB: 2.5,
      mimeType: 'text/csv',
      lastModified: new Date('2024-01-01T10:00:00Z'),
      sha256Hash: 'abc123def456',
    },
    parsingMetadata: {
      dataSourceType: 'Local File System',
      parsingEngine: 'DataPilot Streaming Parser',
      parsingTimeSeconds: 0.45,
      encoding: {
        encoding: 'utf8',
        detectionMethod: 'Auto-detected',
        confidence: 95,
        bomDetected: false,
        bomType: undefined,
      },
      delimiter: {
        delimiter: ',',
        detectionMethod: 'Statistical Analysis',
        confidence: 98,
        alternativesConsidered: [
          { delimiter: ';', score: 15 },
          { delimiter: '\t', score: 5 },
        ],
      },
      lineEnding: 'LF',
      quotingCharacter: '"',
      emptyLinesEncountered: 2,
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
        { name: 'active', index: 3, originalIndex: 3 },
        { name: 'created_date', index: 4, originalIndex: 4 },
      ],
      estimatedInMemorySizeMB: 8.2,
      averageRowLengthBytes: 50,
      sparsityAnalysis: {
        sparsityPercentage: 2.1,
        method: 'Sample-based',
        sampleSize: 1000,
        description: 'Low sparsity detected',
      },
    },
    executionContext: {
      fullCommandExecuted: 'datapilot overview test-data.csv',
      analysisMode: 'comprehensive',
      analysisStartTimestamp: new Date('2024-01-01T12:00:00Z'),
      globalSamplingStrategy: 'Full dataset',
      activatedModules: ['overview', 'parser'],
      processingTimeSeconds: 1.2,
    },
  },
  warnings: [
    {
      category: 'parsing',
      severity: 'medium',
      message: 'Found 5 empty cells in dataset',
      impact: 'May affect analysis accuracy',
      suggestion: 'Consider data cleaning',
    },
  ],
  performanceMetrics: {
    totalAnalysisTime: 1200,
    peakMemoryUsage: 48.2,
    phases: {
      parsing: 450,
      analysis: 750,
    },
  },
});

const createMockSection2Result = (): Section2Result => ({
  qualityAudit: {
    version: '1.3.1',
    generatedAt: new Date('2024-01-01T12:00:00Z'),
    cockpit: {
      compositeScore: {
        score: 87.5,
        interpretation: 'Good',
        details: 'Overall data quality is acceptable with some areas for improvement',
      },
      dimensionScores: {
        completeness: { score: 92, interpretation: 'Excellent', details: 'Very few missing values detected' },
        accuracy: { score: 88, interpretation: 'Good', details: 'Most data appears accurate' },
        consistency: { score: 85, interpretation: 'Good', details: 'Some format inconsistencies found' },
        timeliness: { score: 90, interpretation: 'Excellent', details: 'Data is current and up-to-date' },
        uniqueness: { score: 95, interpretation: 'Excellent', details: 'Minimal duplicate records detected' },
        validity: { score: 86, interpretation: 'Good', details: 'Data mostly conforms to expected formats' },
        integrity: { score: 80, interpretation: 'Fair', details: 'Some referential integrity issues found' },
        reasonableness: { score: 88, interpretation: 'Good', details: 'Values are generally within expected ranges' },
        precision: { score: 92, interpretation: 'Excellent', details: 'Appropriate level of precision maintained' },
        representational: { score: 84, interpretation: 'Good', details: 'Minor formatting inconsistencies' },
      },
      topStrengths: [
        {
          description: 'High data completeness with minimal missing values',
          category: 'completeness',
          impact: 'high',
        },
      ],
      topWeaknesses: [
        {
          description: 'Inconsistent date formats across records',
          category: 'consistency',
          severity: 'medium',
          priority: 3,
          estimatedEffort: '4-6 hours',
        },
      ],
      technicalDebt: {
        timeEstimate: '8-12 hours',
        complexityLevel: 'Medium',
        primaryDebtContributors: ['Date format standardization', 'Duplicate detection'],
        automatedCleaningPotential: {
          fixableIssues: 156,
          examples: ['Date format conversion', 'Whitespace trimming'],
        },
      },
    },
    completeness: {
      datasetLevel: {
        overallCompletenessRatio: 0.92,
        totalMissingValues: 156,
        rowsWithMissingPercentage: 8.2,
        columnsWithMissingPercentage: 16.7,
        distributionOverview: 'Missing values are concentrated in optional fields',
      },
      columnLevel: [
        {
          columnName: 'optional_field',
          missingCount: 89,
          missingPercentage: 8.9,
          missingnessPattern: {
            type: 'MCAR',
            description: 'Missing completely at random',
            correlatedColumns: [],
          },
          suggestedImputation: {
            method: 'Mean',
            rationale: 'Suitable for numeric field with random missingness',
            confidence: 85,
          },
          sparklineRepresentation: '▁▂▃▅▇',
        },
      ],
      missingDataMatrix: {
        correlations: [
          {
            column1: 'field_a',
            column2: 'field_b',
            correlation: 0.45,
            description: 'Moderate correlation in missing patterns',
          },
        ],
        blockPatterns: ['Block pattern detected in rows 100-150'],
      },
      score: {
        score: 92,
        interpretation: 'Excellent',
        details: 'Very high completeness with minimal impact on analysis',
      },
    },
    accuracy: {
      valueConformity: [
        {
          columnName: 'price',
          standard: 'Positive numeric values',
          violationsFound: 3,
          examples: ['-10.50', '-5.00'],
          description: 'Negative price values detected',
        },
      ],
      crossFieldValidation: [
        {
          ruleId: 'price_total_check',
          description: 'Price * quantity should equal total',
          violations: 12,
          examples: [
            {
              rowIndex: 150,
              values: { price: 10.0, quantity: 2, total: 25.0 },
              issue: 'Calculation mismatch',
            },
          ],
        },
      ],
      outlierImpact: {
        percentageErrornousOutliers: 2.1,
        description: 'Small percentage of outliers appear to be data errors',
      },
      score: {
        score: 88,
        interpretation: 'Good',
        details: 'Most data is accurate with some calculation errors',
      },
    },
    consistency: {
      intraRecord: [
        {
          ruleDescription: 'Date fields should be consistent within record',
          violatingRecords: 45,
          examples: [
            {
              rowIndex: 234,
              inconsistentValues: { start_date: '2024-01-01', end_date: '2023-12-31' },
              issue: 'End date before start date',
            },
          ],
        },
      ],
      interRecord: [
        {
          entityType: 'customer',
          inconsistentEntities: 23,
          examples: [
            {
              entityId: 'CUST001',
              conflictingValues: [
                {
                  column: 'name',
                  value1: 'John Smith',
                  value2: 'J. Smith',
                  recordIndices: [100, 250],
                },
              ],
            },
          ],
        },
      ],
      formatConsistency: [
        {
          columnName: 'date_field',
          analysisType: 'format_standardization',
          currentFormats: [
            {
              format: 'YYYY-MM-DD',
              count: 980,
              percentage: '98.0%',
              examples: ['2024-01-15', '2024-02-20'],
            },
            {
              format: 'MM/DD/YYYY',
              count: 20,
              percentage: '2.0%',
              examples: ['01/15/2024', '02/20/2024'],
            },
          ],
          recommendedAction: 'Standardize to ISO 8601 format (YYYY-MM-DD)',
          consistency: {
            isConsistent: false,
            dominantFormat: 'YYYY-MM-DD',
            inconsistencyCount: 20,
            inconsistencyPercentage: '2.0%',
          },
          score: {
            score: 85,
            interpretation: 'Good',
            details: 'Minor format inconsistencies detected',
          },
        },
      ],
      score: {
        score: 85,
        interpretation: 'Good',
        details: 'Some format inconsistencies need attention',
      },
    },
    timeliness: {
      dataFreshness: {
        latestTimestamp: new Date('2024-01-15T12:00:00Z'),
        datasetAge: '2 days',
        staleRecordsPercentage: 5.2,
        threshold: '7 days',
      },
      score: {
        score: 90,
        interpretation: 'Excellent',
        details: 'Data is current and well-maintained',
      },
    },
    uniqueness: {
      exactDuplicates: {
        count: 12,
        percentage: 1.2,
        duplicateGroups: [
          {
            rowIndices: [100, 150],
            duplicateType: 'Exact',
            confidence: 100,
          },
        ],
      },
      keyUniqueness: [
        {
          columnName: 'id',
          isPrimaryKey: true,
          duplicateCount: 3,
          cardinality: 997,
          duplicateValues: [
            { value: 'ID001', frequency: 2 },
            { value: 'ID002', frequency: 2 },
          ],
        },
      ],
      columnUniqueness: [
        {
          columnName: 'email',
          uniquePercentage: 95.5,
          duplicateCount: 45,
          mostFrequentDuplicate: {
            value: 'test@example.com',
            frequency: 5,
          },
        },
      ],
      semanticDuplicates: {
        suspectedPairs: 8,
        duplicates: [
          {
            recordPair: [100, 200],
            confidence: 0.85,
            method: 'fuzzy_matching',
            similarity: { name: 0.9, address: 0.8 },
          },
        ],
        methods: ['fuzzy_matching', 'phonetic_matching'],
      },
      score: {
        score: 95,
        interpretation: 'Excellent',
        details: 'Very few duplicate records detected',
      },
    },
    validity: {
      typeConformance: [
        {
          columnName: 'age',
          expectedType: 'integer',
          actualType: 'mixed',
          confidence: 95,
          nonConformingCount: 5,
          conformancePercentage: 99.5,
          examples: ['25.5', 'unknown'],
          conversionStrategy: 'Round decimals, handle text values',
        },
      ],
      rangeConformance: [
        {
          columnName: 'price',
          expectedRange: '0 to 10000',
          violationsCount: 3,
          outliers: [
            { value: -10.50, rowIndex: 150 },
            { value: 15000, rowIndex: 300 },
          ],
        },
      ],
      patternConformance: [
        {
          columnName: 'email',
          expectedPattern: 'email format',
          violationsCount: 12,
          examples: ['invalid-email', 'test@'],
        },
      ],
      businessRules: [
        {
          ruleId: 'age_consistency',
          description: 'Age should be between 18 and 120',
          violations: 8,
          averageDiscrepancy: 2.5,
          examples: [
            {
              rowIndex: 250,
              issue: 'Age below minimum',
              values: { age: 15 },
            },
          ],
        },
      ],
      fileStructure: {
        consistentColumnCount: true,
        headerConformance: true,
        deviatingRows: 0,
      },
      score: {
        score: 86,
        interpretation: 'Good',
        details: 'Most data conforms to expected formats',
      },
    },
    integrity: {
      orphanedRecords: [
        {
          parentColumn: 'customer_id',
          childColumn: 'order_id',
          orphanedValues: [
            { value: 'ORD123', count: 1 },
            { value: 'ORD456', count: 2 },
          ],
        },
      ],
      cardinalityViolations: [
        {
          relationship: 'customer_orders',
          expectedCardinality: 'one-to-many',
          violations: 5,
          description: 'Some orders reference non-existent customers',
        },
      ],
      score: {
        score: 80,
        interpretation: 'Fair',
        details: 'Some referential integrity issues found',
      },
    },
    reasonableness: {
      statisticalPlausibility: [
        {
          columnName: 'income',
          mean: 50000,
          standardDeviation: 15000,
          implausibleValues: [
            {
              value: 500000,
              rowIndex: 200,
              standardDeviations: 3.2,
            },
          ],
        },
      ],
      semanticPlausibility: [
        {
          description: 'Birth date after current date',
          violations: 3,
          examples: [
            {
              rowIndex: 150,
              issue: 'Future birth date',
              values: { birth_date: '2025-01-01' },
            },
          ],
        },
      ],
      contextualAnomalies: [
        {
          description: 'Unusually high values for region',
          severity: 'Medium',
          affectedRecords: 12,
        },
      ],
      score: {
        score: 88,
        interpretation: 'Good',
        details: 'Most values are within reasonable ranges',
      },
    },
    precision: {
      numericPrecision: [
        {
          columnName: 'price',
          maxDecimalPlaces: 2,
          inconsistentPrecision: false,
          examples: [
            { value: 10.50, decimalPlaces: 2 },
            { value: 15.99, decimalPlaces: 2 },
          ],
          expectedPrecision: 2,
        },
      ],
      temporalGranularity: [
        {
          columnName: 'timestamp',
          granularity: 'Second',
          sufficient: true,
          recommendation: 'Current precision is appropriate',
        },
      ],
      categoricalSpecificity: [
        {
          columnName: 'category',
          levelOfDetail: 'Specific',
          hierarchyLevels: 2,
          consistentGranularity: true,
          examples: ['Electronics > Laptops', 'Clothing > Shoes'],
        },
      ],
      score: {
        score: 92,
        interpretation: 'Excellent',
        details: 'Appropriate level of precision maintained',
      },
    },
    representational: {
      unitStandardization: [
        {
          columnName: 'weight',
          standardized: false,
          detectedUnits: ['kg', 'lbs'],
          recommendedStandard: 'kg',
          conversionNeeded: true,
        },
      ],
      codeStandardization: [
        {
          columnName: 'country_code',
          codeType: 'Abbreviation',
          standardized: true,
          representations: [
            { value: 'US', count: 500 },
            { value: 'CA', count: 300 },
          ],
          dictionaryAvailable: true,
          recommendedStandard: 'ISO 3166-1 alpha-2',
        },
      ],
      textFormatting: [
        {
          columnName: 'description',
          issues: [
            {
              type: 'Whitespace',
              count: 23,
              examples: [' extra spaces ', '\ttab character'],
            },
          ],
          recommendations: ['Trim whitespace', 'Normalize text formatting'],
        },
      ],
      score: {
        score: 84,
        interpretation: 'Good',
        details: 'Minor formatting inconsistencies detected',
      },
    },
    profilingInsights: {
      valueLengthAnalysis: [
        {
          columnName: 'description',
          minLength: 5,
          maxLength: 500,
          averageLength: 125.5,
          medianLength: 110,
          standardDeviation: 45.2,
          lengthDistribution: [
            { range: '0-50', count: 100, percentage: 10 },
            { range: '51-100', count: 300, percentage: 30 },
            { range: '101-200', count: 400, percentage: 40 },
            { range: '201+', count: 200, percentage: 20 },
          ],
          unusualLengths: [
            {
              length: 500,
              count: 5,
              examples: ['Very long description that exceeds normal limits...'],
            },
          ],
        },
      ],
      characterSetAnalysis: [
        {
          columnName: 'name',
          predominantCharset: 'ASCII',
          nonAsciiCount: 25,
          encodingIssues: [
            {
              type: 'Special characters',
              count: 15,
              examples: ['José', 'François'],
            },
          ],
        },
      ],
      specialCharacterAnalysis: [
        {
          columnName: 'address',
          leadingTrailingSpaces: 45,
          controlCharacters: [
            { character: '\t', count: 12 },
            { character: '\n', count: 8 },
          ],
          placeholderValues: [
            { value: 'N/A', count: 23 },
            { value: 'TBD', count: 15 },
          ],
        },
      ],
    },
  },
  warnings: [
    {
      category: 'data',
      severity: 'medium',
      message: 'Data quality score below 90%',
      impact: 'May affect analysis accuracy',
      suggestion: 'Consider data cleaning before analysis',
    },
  ],
  performanceMetrics: {
    totalAnalysisTime: 2500,
    peakMemoryUsage: 52.1,
    phases: {
      completeness: 500,
      accuracy: 400,
      consistency: 600,
      uniqueness: 300,
      validity: 400,
      integrity: 300,
    },
  },
});

const createMockSection3Result = (): Section3Result => ({
  edaAnalysis: {
    univariateAnalysis: [],
    bivariateAnalysis: {
      correlationMatrix: {
        matrix: {},
        significantCorrelations: [],
        strongCorrelations: [],
        insights: {
          strongestPositiveCorrelation: {
            column1: 'age',
            column2: 'income',
            correlation: 0.82,
          },
          strongestNegativeCorrelation: {
            column1: 'age',
            column2: 'energy',
            correlation: -0.45,
          },
          totalSignificantPairs: 8,
          interpretation: 'Strong positive correlation between age and income',
        },
      },
      associationTests: [],
    },
    multivariateAnalysis: {
      summary: {
        analysisPerformed: true,
        applicabilityAssessment: 'Suitable for multivariate analysis',
        numericVariablesCount: 5,
        variablesAnalyzed: ['age', 'income', 'score'],
        sampleSize: 1000,
        analysisLimitations: [],
      },
      principalComponentAnalysis: {
        isApplicable: true,
        applicabilityReason: 'Sufficient numeric variables',
        totalVariance: 100,
        componentsAnalyzed: 3,
        components: [],
        screeData: [],
        varianceThresholds: {
          componentsFor80Percent: 2,
          componentsFor85Percent: 2,
          componentsFor90Percent: 3,
          componentsFor95Percent: 3,
        },
        dominantVariables: [],
        dimensionalityRecommendations: [],
      },
      clusteringAnalysis: {
        isApplicable: true,
        applicabilityReason: 'Sufficient data for clustering',
        optimalClusters: 3,
        clusteringResults: {
          silhouetteScore: 0.65,
          inertia: 150.5,
          clusters: [],
        },
        clusterValidation: {
          silhouetteAnalysis: {
            averageScore: 0.65,
            clusterScores: [],
          },
          elbowMethod: {
            optimalK: 3,
            elbowData: [],
          },
        },
        insights: {
          bestClusterConfiguration: 3,
          clusterInterpretation: [],
          businessImplications: [],
        },
      },
      outlierDetection: {
        summary: {
          totalOutliers: 5,
          outlierPercentage: 0.5,
          method: 'Mahalanobis distance',
        },
        outliers: [],
        insights: {
          severityDistribution: {
            mild: 3,
            moderate: 2,
            severe: 0,
          },
          affectedVariables: ['income', 'score'],
          patterns: [],
          recommendations: [],
        },
      },
      normalityTests: {
        multivariateNormality: {
          hypothesis: 'Data follows multivariate normal distribution',
          testStatistic: 15.6,
          pValue: 0.045,
          interpretation: 'Reject null hypothesis - not multivariate normal',
        },
        overallAssessment: {
          isMultivariateNormal: false,
          confidence: 95,
          violations: ['Non-normal distribution detected'],
          recommendations: ['Consider data transformation'],
        },
      },
      relationshipAnalysis: {
        variableInteractions: [],
        correlationStructure: {
          stronglyCorrelatedGroups: [],
          independentVariables: [],
          redundantVariables: [],
        },
        dimensionalityInsights: {
          effectiveDimensionality: 3,
          intrinsicDimensionality: 2,
          dimensionalityReduction: {
            recommended: true,
            methods: ['PCA'],
            expectedVarianceRetention: 85,
          },
        },
      },
      insights: {
        keyFindings: [
          'Strong positive correlation between age and income (r=0.82)',
          'Score distribution is approximately normal',
          'Active users represent 68% of dataset',
        ],
        dataQualityIssues: [],
        hypothesesGenerated: [],
        preprocessingRecommendations: [],
        analysisRecommendations: [],
      },
      technicalMetadata: {
        analysisTime: 3200,
        memoryUsage: '67.8 MB',
        computationalComplexity: 'O(n²)',
        algorithmsUsed: ['PCA', 'K-means', 'Mahalanobis distance'],
      },
    },
    crossVariableInsights: {
      topFindings: [
        'Strong positive correlation between age and income (r=0.82)',
        'Score distribution is approximately normal',
        'Active users represent 68% of dataset',
      ],
      dataQualityIssues: [],
      hypothesesGenerated: [],
      preprocessingRecommendations: [],
    },
  },
  warnings: [
    {
      category: 'statistical',
      severity: 'low',
      message: 'Small sample size may affect correlation reliability',
      impact: 'Consider gathering more data for robust analysis',
      suggestion: 'Increase sample size for better statistical power',
    },
  ],
  performanceMetrics: {
    totalAnalysisTime: 3200,
    peakMemoryUsage: 67.8,
    phases: {
      univariate: 800,
      bivariate: 1200,
      multivariate: 1200,
    },
  },
  metadata: {
    analysisApproach: 'comprehensive',
    datasetSize: 1000,
    columnsAnalyzed: 5,
    samplingApplied: false,
  },
});


describe('OutputManager', () => {
  let tempDir: string;
  let outputManager: OutputManager;
  let mockSection1Result: Section1Result;
  let mockSection2Result: Section2Result;
  let mockSection3Result: Section3Result;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'output-test-'));
    mockSection1Result = createMockSection1Result();
    mockSection2Result = createMockSection2Result();
    mockSection3Result = createMockSection3Result();
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

  describe('Markdown Output', () => {
    beforeEach(() => {
      const options: CLIOptions = {
        output: 'markdown',
        outputFile: join(tempDir, 'report.md'),
        verbose: false,
        quiet: true,
      };
      outputManager = new OutputManager(options);
    });

    it('should generate valid markdown for Section 1', () => {
      const outputFiles = outputManager.outputSection1(mockSection1Result);
      
      expect(outputFiles).toHaveLength(1);
      expect(outputFiles[0]).toBe(join(tempDir, 'report.md'));
      
      const content = readFileSync(outputFiles[0], 'utf8');
      
      // Check markdown structure
      expect(content).toContain('# DataPilot Analysis Report');
      expect(content).toContain('## Section 1: Overview');
      expect(content).toContain('**1.1. Input Data File Details:**');
      expect(content).toContain('**1.2. Data Ingestion & Parsing Parameters:**');
      
      // Check data integrity
      expect(content).toContain('test-data.csv');
      expect(content).toContain('2.50 MB');
      expect(content).toContain('utf8');
      expect(content).toContain('1000');
      expect(content).toContain('5');
      
      // Validate markdown formatting
      expect(content).toMatch(/^# /m); // Header level 1
      expect(content).toMatch(/^## /m); // Header level 2
      expect(content).toMatch(/^\* /m); // List items
      expect(content).toContain('`'); // Code formatting
    });

    it('should generate valid markdown for Section 2', () => {
      const outputFiles = outputManager.outputSection2(mockSection2Result);
      
      expect(outputFiles).toHaveLength(1);
      const content = readFileSync(outputFiles[0], 'utf8');
      
      // Check quality-specific content
      expect(content).toContain('Data Quality');
      expect(content).toContain('87.5');
      expect(content).toContain('Good');
      expect(content).toContain('completeness');
      expect(content).toContain('consistency');
      
      // Check recommendations
      expect(content).toContain('recommendations');
      expect(content).toContain('Standardize date format');
    });

    it('should handle warnings and performance metrics properly', () => {
      const outputFiles = outputManager.outputSection1(mockSection1Result);
      const content = readFileSync(outputFiles[0], 'utf8');
      
      // Check warnings section
      expect(content).toMatch(/warning|issue/i);
      expect(content).toContain('Found 5 empty cells');
      expect(content).toContain('medium');
      
      // Check performance metrics
      expect(content).toContain('1200');
      expect(content).toContain('48.2');
      expect(content).toContain('833');
    });
  });

  describe('JSON Output', () => {
    beforeEach(() => {
      const options: CLIOptions = {
        output: 'json',
        outputFile: join(tempDir, 'report.json'),
        verbose: false,
        quiet: true,
      };
      outputManager = new OutputManager(options);
    });

    it('should generate valid JSON for Section 1', () => {
      const outputFiles = outputManager.outputSection1(mockSection1Result);
      
      expect(outputFiles).toHaveLength(1);
      expect(outputFiles[0]).toBe(join(tempDir, 'report.json'));
      
      const content = readFileSync(outputFiles[0], 'utf8');
      
      // Parse and validate JSON structure
      const jsonData = JSON.parse(content);
      
      expect(jsonData).toHaveProperty('metadata');
      expect(jsonData).toHaveProperty('overview');
      expect(jsonData).toHaveProperty('warnings');
      expect(jsonData).toHaveProperty('performance');
      
      // Check metadata
      expect(jsonData.metadata.version).toBe('1.0.0');
      expect(jsonData.metadata.command).toBe('datapilot');
      expect(jsonData.metadata.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      
      // Check data integrity
      expect(jsonData.overview.fileDetails.originalFilename).toBe('test-data.csv');
      expect(jsonData.overview.fileDetails.fileSizeMB).toBe(2.5);
      expect(jsonData.overview.structuralDimensions.totalRows).toBe(1000);
      expect(jsonData.overview.structuralDimensions.totalColumns).toBe(5);
      
      // Check arrays and nested objects
      expect(Array.isArray(jsonData.warnings)).toBe(true);
      expect(jsonData.warnings).toHaveLength(1);
      expect(jsonData.warnings[0].type).toBe('data_quality');
      
      // Validate performance metrics
      expect(jsonData.performance.totalProcessingTimeMs).toBe(1200);
      expect(jsonData.performance.memoryPeakUsageMB).toBe(48.2);
    });

    it('should generate valid JSON for Section 2', () => {
      const outputFiles = outputManager.outputSection2(mockSection2Result);
      const content = readFileSync(outputFiles[0], 'utf8');
      const jsonData = JSON.parse(content);
      
      expect(jsonData.metadata.command).toBe('datapilot quality');
      expect(jsonData.metadata.analysisType).toBe('Data Quality & Integrity Audit');
      
      // Check quality audit structure
      expect(jsonData.qualityAudit.cockpit.compositeScore.score).toBe(87.5);
      expect(jsonData.qualityAudit.cockpit.compositeScore.interpretation).toBe('Good');
      expect(jsonData.qualityAudit.dimensionDetails.completeness.score).toBe(92);
      
      // Check performance metrics
      expect(jsonData.performanceMetrics.qualityChecksPerformed).toBe(15);
      expect(jsonData.performanceMetrics.issuesDetected).toBe(3);
    });

    it('should generate valid JSON for Section 3', () => {
      const section3Report = 'Mock section 3 markdown report content';
      const outputFiles = outputManager.outputSection3(section3Report, mockSection3Result);
      const content = readFileSync(outputFiles[0], 'utf8');
      const jsonData = JSON.parse(content);
      
      expect(jsonData.metadata.command).toBe('datapilot eda');
      expect(jsonData.metadata.analysisType).toBe('Exploratory Data Analysis');
      
      // Check EDA analysis structure
      expect(jsonData.edaAnalysis.crossVariableInsights.topFindings).toHaveLength(3);
      expect(jsonData.edaAnalysis.crossVariableInsights.topFindings[0]).toContain('correlation');
      expect(jsonData.edaAnalysis.distributionAnalysis.normalDistributions).toContain('score');
      
      // Check metadata
      expect(jsonData.analysisMetadata.analysisDepth).toBe('comprehensive');
      expect(jsonData.analysisMetadata.confidenceLevel).toBe(0.95);
    });

    it('should handle null and undefined values correctly', () => {
      const resultWithNulls = {
        ...mockSection1Result,
        overview: {
          ...mockSection1Result.overview,
          parsingMetadata: {
            ...mockSection1Result.overview.parsingMetadata,
            encoding: {
              ...mockSection1Result.overview.parsingMetadata.encoding,
              bomType: null,
            },
          },
        },
        warnings: [],
      };
      
      const outputFiles = outputManager.outputSection1(resultWithNulls);
      const content = readFileSync(outputFiles[0], 'utf8');
      const jsonData = JSON.parse(content);
      
      expect(jsonData.overview.parsingMetadata.encoding.bomType).toBeNull();
      expect(jsonData.warnings).toEqual([]);
    });
  });

  describe('YAML Output', () => {
    beforeEach(() => {
      const options: CLIOptions = {
        output: 'yaml',
        outputFile: join(tempDir, 'report.yaml'),
        verbose: false,
        quiet: true,
      };
      outputManager = new OutputManager(options);
    });

    it('should generate valid YAML for Section 1', () => {
      const outputFiles = outputManager.outputSection1(mockSection1Result);
      
      expect(outputFiles).toHaveLength(1);
      expect(outputFiles[0]).toBe(join(tempDir, 'report.yaml'));
      
      const content = readFileSync(outputFiles[0], 'utf8');
      
      // Check YAML structure patterns
      expect(content).toMatch(/^metadata:/m);
      expect(content).toMatch(/^overview:/m);
      expect(content).toMatch(/^warnings:/m);
      expect(content).toMatch(/^performance:/m);
      
      // Check proper YAML formatting
      expect(content).toMatch(/^  version: "1\.0\.0"/m);
      expect(content).toMatch(/^  command: "datapilot"/m);
      expect(content).toMatch(/^    originalFilename: "test-data\.csv"/m);
      expect(content).toMatch(/^    fileSizeMB: 2\.5$/m);
      
      // Check array formatting
      expect(content).toMatch(/^  - type: "data_quality"/m);
      expect(content).toMatch(/^    severity: "medium"/m);
      
      // Check nested object formatting
      expect(content).toMatch(/^    fileDetails:$/m);
      expect(content).toMatch(/^      originalFilename:/m);
      
      // Validate boolean and number values
      expect(content).toMatch(/cachingEnabled: true$/m);
      expect(content).toMatch(/totalProcessingTimeMs: 1200$/m);
    });

    it('should generate valid YAML for Section 2', () => {
      const outputFiles = outputManager.outputSection2(mockSection2Result);
      const content = readFileSync(outputFiles[0], 'utf8');
      
      // Check Section 2 specific YAML structure
      expect(content).toMatch(/^  command: "datapilot quality"/m);
      expect(content).toMatch(/^  analysisType: "Data Quality & Integrity Audit"/m);
      expect(content).toMatch(/^qualityAudit:/m);
      expect(content).toMatch(/^  cockpit:/m);
      expect(content).toMatch(/^    compositeScore:/m);
      expect(content).toMatch(/^      score: 87\.5$/m);
      expect(content).toMatch(/^      interpretation: "Good"/m);
      
      // Check nested quality dimensions
      expect(content).toMatch(/^  dimensionDetails:/m);
      expect(content).toMatch(/^    completeness:/m);
      expect(content).toMatch(/^      score: 92$/m);
    });

    it('should handle arrays correctly in YAML', () => {
      const outputFiles = outputManager.outputSection3('Mock report', mockSection3Result);
      const content = readFileSync(outputFiles[0], 'utf8');
      
      // Check array formatting in YAML
      expect(content).toMatch(/^    topFindings:$/m);
      expect(content).toMatch(/^      - "Strong positive correlation/m);
      expect(content).toMatch(/^      - "Score distribution/m);
      expect(content).toMatch(/^      - "Active users represent/m);
      
      // Check nested arrays
      expect(content).toMatch(/^    normalDistributions:$/m);
      expect(content).toMatch(/^      - "score"$/m);
      expect(content).toMatch(/^      - "age"$/m);
    });

    it('should handle special characters and escaping', () => {
      const specialResult = {
        ...mockSection1Result,
        overview: {
          ...mockSection1Result.overview,
          fileDetails: {
            ...mockSection1Result.overview.fileDetails,
            originalFilename: 'test-file with spaces & symbols.csv',
          },
        },
        warnings: [
          {
            category: 'parsing' as const,
            severity: 'low' as const,
            message: 'File contains "quotes" and \'apostrophes\'',
            impact: 'Special: & < > | characters detected',
            suggestion: 'Consider data cleaning',
          },
        ],
      };
      
      const outputFiles = outputManager.outputSection1(specialResult);
      const content = readFileSync(outputFiles[0], 'utf8');
      
      // Check proper escaping
      expect(content).toContain('"test-file with spaces & symbols.csv"');
      expect(content).toContain('"quotes"');
      expect(content).toContain('\'apostrophes\'');
    });
  });

  describe('Text Output', () => {
    beforeEach(() => {
      const options: CLIOptions = {
        output: 'txt',
        outputFile: join(tempDir, 'report.txt'),
        verbose: false,
        quiet: true,
      };
      outputManager = new OutputManager(options);
    });

    it('should generate plain text for Section 1', () => {
      const outputFiles = outputManager.outputSection1(mockSection1Result);
      const content = readFileSync(outputFiles[0], 'utf8');
      
      // Text should be the same as markdown but saved as .txt
      expect(content).toContain('# DataPilot Analysis Report');
      expect(content).toContain('test-data.csv');
      expect(content).toContain('2.50 MB');
      expect(outputFiles[0]).toMatch(/\.txt$/);
    });
  });

  describe('File Operations', () => {
    it('should create directories automatically', () => {
      const deepPath = join(tempDir, 'reports', 'analysis', 'output.md');
      const options: CLIOptions = {
        output: 'markdown',
        outputFile: deepPath,
        verbose: false,
        quiet: true,
      };
      outputManager = new OutputManager(options);
      
      const outputFiles = outputManager.outputSection1(mockSection1Result);
      
      expect(outputFiles).toHaveLength(1);
      expect(outputFiles[0]).toBe(deepPath);
      
      // Verify file exists and has content
      const content = readFileSync(deepPath, 'utf8');
      expect(content).toContain('DataPilot Analysis Report');
    });

    it('should auto-generate filenames when no output file specified', () => {
      const options: CLIOptions = {
        output: 'json',
        outputFile: undefined,
        verbose: false,
        quiet: true,
      };
      outputManager = new OutputManager(options);
      
      const outputFiles = outputManager.outputSection1(mockSection1Result, 'input-data.csv');
      
      expect(outputFiles).toHaveLength(1);
      expect(outputFiles[0]).toMatch(/input-data_datapilot_report\.json$/);
    });

    it('should ensure correct file extensions', () => {
      const options: CLIOptions = {
        output: 'yaml',
        outputFile: join(tempDir, 'report.json'), // Wrong extension
        verbose: false,
        quiet: true,
      };
      outputManager = new OutputManager(options);
      
      const outputFiles = outputManager.outputSection1(mockSection1Result);
      
      expect(outputFiles[0]).toBe(join(tempDir, 'report.yaml')); // Corrected extension
    });

    it('should handle section-specific filename generation', () => {
      const options: CLIOptions = {
        output: 'json',
        outputFile: undefined,
        verbose: false,
        quiet: true,
      };
      outputManager = new OutputManager(options);
      
      const section2Files = outputManager.outputSection2(mockSection2Result, 'data.csv');
      const section3Files = outputManager.outputSection3('report', mockSection3Result, 'data.csv');
      
      expect(section2Files[0]).toMatch(/data_datapilot_quality\.json$/);
      expect(section3Files[0]).toMatch(/data_datapilot_eda\.json$/);
    });
  });

  describe('Combined Output Mode', () => {
    beforeEach(() => {
      const options: CLIOptions = {
        output: 'markdown',
        outputFile: join(tempDir, 'combined.md'),
        verbose: false,
        quiet: true,
      };
      outputManager = new OutputManager(options);
    });

    it('should collect sections for combined output', () => {
      outputManager.startCombinedOutput();
      
      const section1Files = outputManager.outputSection1(mockSection1Result);
      const section2Files = outputManager.outputSection2(mockSection2Result);
      
      // No individual files should be created in combine mode
      expect(section1Files).toHaveLength(0);
      expect(section2Files).toHaveLength(0);
      
      const combinedFiles = outputManager.outputCombined('test.csv');
      
      expect(combinedFiles).toHaveLength(1);
      const content = readFileSync(combinedFiles[0], 'utf8');
      
      // Should contain both sections separated by dividers
      expect(content).toContain('Section 1: Overview');
      expect(content).toContain('Data Quality');
      expect(content).toContain('---'); // Section divider
    });
  });

  describe('Verbose Output', () => {
    beforeEach(() => {
      const options: CLIOptions = {
        output: 'markdown',
        outputFile: join(tempDir, 'report.md'),
        verbose: true,
        quiet: false,
      };
      outputManager = new OutputManager(options);
    });

    it('should output summaries in verbose mode', () => {
      // Capture console output
      const consoleLogs: string[] = [];
      const originalLog = console.log;
      console.log = (...args: any[]) => {
        consoleLogs.push(args.join(' '));
      };
      
      try {
        outputManager.outputSection1(mockSection1Result);
        outputManager.outputSection2(mockSection2Result);
        
        // Check for summary output
        expect(consoleLogs.some(log => log.includes('Quick Summary'))).toBe(true);
        expect(consoleLogs.some(log => log.includes('Data Quality Summary'))).toBe(true);
        expect(consoleLogs.some(log => log.includes('87.5/100'))).toBe(true);
        expect(consoleLogs.some(log => log.includes('Good'))).toBe(true);
      } finally {
        console.log = originalLog;
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle write permission errors gracefully', () => {
      const readOnlyPath = join(tempDir, 'readonly.md');
      writeFileSync(readOnlyPath, 'existing content');
      
      try {
        require('fs').chmodSync(readOnlyPath, 0o444); // Read-only
        
        const options: CLIOptions = {
          output: 'markdown',
          outputFile: readOnlyPath,
          verbose: false,
          quiet: true,
        };
        outputManager = new OutputManager(options);
        
        expect(() => {
          outputManager.outputSection1(mockSection1Result);
        }).toThrow('Failed to write output file');
        
      } finally {
        try {
          require('fs').chmodSync(readOnlyPath, 0o644); // Restore permissions
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    });

    it('should handle malformed data gracefully', () => {
      const malformedResult = {
        ...mockSection1Result,
        overview: {
          ...mockSection1Result.overview,
          fileDetails: {
            ...mockSection1Result.overview.fileDetails,
            fileSizeMB: NaN,
            lastModified: 'invalid-date' as any,
          },
        },
      };
      
      const options: CLIOptions = {
        output: 'json',
        outputFile: join(tempDir, 'malformed.json'),
        verbose: false,
        quiet: true,
      };
      outputManager = new OutputManager(options);
      
      // Should not throw but handle gracefully
      const outputFiles = outputManager.outputSection1(malformedResult);
      expect(outputFiles).toHaveLength(1);
      
      const content = readFileSync(outputFiles[0], 'utf8');
      const jsonData = JSON.parse(content); // Should still be valid JSON
      expect(jsonData.overview.fileDetails.fileSizeMB).toBeNull();
    });
  });

  describe('Performance', () => {
    it('should handle large outputs efficiently', () => {
      // Create large mock data
      const largeWarnings = Array.from({length: 1000}, (_, i) => ({
        category: 'data' as const,
        severity: 'low' as const,
        message: `Warning ${i}: Large dataset processing notice`,
        impact: `Processing item ${i} of large dataset with extensive details and descriptions that take up space`,
        suggestion: 'Consider optimizing processing',
      }));
      
      const largeResult = {
        ...mockSection1Result,
        warnings: largeWarnings,
      };
      
      const options: CLIOptions = {
        output: 'json',
        outputFile: join(tempDir, 'large.json'),
        verbose: false,
        quiet: true,
      };
      outputManager = new OutputManager(options);
      
      const start = Date.now();
      const outputFiles = outputManager.outputSection1(largeResult);
      const duration = Date.now() - start;
      
      expect(outputFiles).toHaveLength(1);
      expect(duration).toBeLessThan(1000); // Should complete quickly
      
      const content = readFileSync(outputFiles[0], 'utf8');
      const jsonData = JSON.parse(content);
      expect(jsonData.warnings).toHaveLength(1000);
    });
  });
});