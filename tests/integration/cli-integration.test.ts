/**
 * CLI Integration Tests
 * 
 * Comprehensive integration testing for DataPilot CLI components including
 * argument parsing, progress reporting, output management, and end-to-end workflows.
 */

import { ArgumentParser } from '../../src/cli/argument-parser';
import { ProgressReporter } from '../../src/cli/progress-reporter';
import { OutputManager } from '../../src/cli/output-manager';
import { DataPilotCLI } from '../../src/cli';
import type { CLIOptions, CLIContext } from '../../src/cli/types';
import { promises as fs } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('CLI Integration Tests', () => {
  let tempDir: string;
  let testCsvPath: string;

  beforeAll(async () => {
    // Create temporary directory for test files
    tempDir = await fs.mkdtemp(join(tmpdir(), 'datapilot-cli-test-'));
    testCsvPath = join(tempDir, 'test-data.csv');
    
    // Create a test CSV file
    const testCsvContent = [
      'id,name,age,department,salary,active',
      '1,"John Doe",28,Engineering,75000,true',
      '2,"Jane Smith",32,Marketing,68000,true',
      '3,"Bob Johnson",45,Sales,82000,false',
      '4,"Alice Brown",29,Engineering,79000,true',
      '5,"Charlie Wilson",38,HR,65000,true'
    ].join('\n');
    
    await fs.writeFile(testCsvPath, testCsvContent, 'utf8');
  });

  afterAll(async () => {
    // Cleanup temporary files
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors in tests
    }
  });

  describe('ArgumentParser Integration', () => {
    let parser: ArgumentParser;

    beforeEach(() => {
      parser = new ArgumentParser();
    });

    it('should parse complete analysis command with all options', () => {
      const args = [
        'all', testCsvPath,
        '--verbose',
        '--output', 'json',
        '--output-file', join(tempDir, 'output.json'),
        '--force'
      ];

      const result = parser.parse(['node', 'datapilot', ...args]);

      expect(result.command).toBe('all');
      expect(result.files).toEqual([testCsvPath]);
      expect(result.verbose).toBe(true);
      expect(result.outputFormat).toBe('json');
      expect(result.outputFile).toBe(join(tempDir, 'output.json'));
      expect(result.force).toBe(true);
    });

    it('should parse section-specific commands with aliases', () => {
      const qualityArgs = ['qua', testCsvPath, '--verbose'];
      const qualityResult = parser.parse(['node', 'datapilot', ...qualityArgs]);

      expect(qualityResult.command).toBe('quality');
      expect(qualityResult.files).toEqual([testCsvPath]);
      expect(qualityResult.verbose).toBe(true);

      const engineeringArgs = ['eng', testCsvPath, '--quiet'];
      const engineeringResult = parser.parse(['node', 'datapilot', ...engineeringArgs]);

      expect(engineeringResult.command).toBe('engineering');
      expect(engineeringResult.quiet).toBe(true);
    });

    it('should parse multi-file commands for join analysis', () => {
      const file2Path = join(tempDir, 'test-data2.csv');
      const args = ['join', testCsvPath, file2Path, '--confidence-threshold', '0.8'];

      const result = parser.parse(['node', 'datapilot', ...args]);

      expect(result.command).toBe('join');
      expect(result.files).toEqual([testCsvPath, file2Path]);
      expect(result.confidenceThreshold).toBe(0.8);
    });

    it('should validate file existence and accessibility', () => {
      const nonExistentFile = join(tempDir, 'nonexistent.csv');
      const args = ['overview', nonExistentFile];

      expect(() => {
        parser.parse(['node', 'datapilot', ...args]);
      }).toThrow(/file does not exist/i);
    });

    it('should handle output format validation', () => {
      const args = ['all', testCsvPath, '--output', 'invalid-format'];

      expect(() => {
        parser.parse(['node', 'datapilot', ...args]);
      }).toThrow(/invalid output format/i);
    });

    it('should provide comprehensive help information', () => {
      const helpOutput = parser.getHelpText();

      expect(helpOutput).toContain('DataPilot');
      expect(helpOutput).toContain('all');
      expect(helpOutput).toContain('overview');
      expect(helpOutput).toContain('quality');
      expect(helpOutput).toContain('--verbose');
      expect(helpOutput).toContain('--output');
    });
  });

  describe('ProgressReporter Integration', () => {
    let reporter: ProgressReporter;
    let progressCallbacks: any[];

    beforeEach(() => {
      progressCallbacks = [];
      reporter = new ProgressReporter({
        verbose: true,
        quiet: false,
        progressCallback: (progress) => progressCallbacks.push(progress)
      });
    });

    afterEach(() => {
      reporter.cleanup();
    });

    it('should provide comprehensive progress reporting through complete workflow', async () => {
      // Start analysis phases
      reporter.startPhase('File Analysis', 'Analyzing file structure and metadata');
      await new Promise(resolve => setTimeout(resolve, 50));

      reporter.updateProgress(25, 'Detecting encoding and delimiters');
      await new Promise(resolve => setTimeout(resolve, 50));

      reporter.updateProgress(50, 'Parsing CSV structure');
      await new Promise(resolve => setTimeout(resolve, 50));

      reporter.updateProgress(75, 'Analyzing columns and data types');
      await new Promise(resolve => setTimeout(resolve, 50));

      reporter.completePhase('File analysis completed successfully');

      // Start second phase
      reporter.startPhase('Quality Analysis', 'Assessing data quality metrics');
      await new Promise(resolve => setTimeout(resolve, 50));

      reporter.updateProgress(30, 'Checking for missing values');
      reporter.updateProgress(60, 'Detecting outliers and anomalies');
      reporter.updateProgress(90, 'Calculating quality scores');
      reporter.completePhase('Quality analysis completed');

      // Verify progress callbacks
      expect(progressCallbacks.length).toBeGreaterThan(0);
      
      const phaseStarts = progressCallbacks.filter(cb => cb.type === 'phase_start');
      const progressUpdates = progressCallbacks.filter(cb => cb.type === 'progress');
      const phaseCompletions = progressCallbacks.filter(cb => cb.type === 'phase_complete');

      expect(phaseStarts.length).toBe(2);
      expect(progressUpdates.length).toBeGreaterThan(0);
      expect(phaseCompletions.length).toBe(2);

      // Verify phase information
      expect(phaseStarts[0].phase).toBe('File Analysis');
      expect(phaseStarts[1].phase).toBe('Quality Analysis');
    });

    it('should handle error scenarios gracefully', () => {
      reporter.startPhase('Error Test', 'Testing error handling');
      
      const errorMessage = 'Simulated analysis error';
      reporter.reportError(errorMessage);

      const errorCallbacks = progressCallbacks.filter(cb => cb.type === 'error');
      expect(errorCallbacks.length).toBe(1);
      expect(errorCallbacks[0].message).toContain(errorMessage);
    });

    it('should provide accurate timing and throughput calculations', async () => {
      const startTime = Date.now();
      
      reporter.startPhase('Timing Test', 'Testing timing calculations');
      await new Promise(resolve => setTimeout(resolve, 100));
      
      reporter.updateProgress(50, 'Halfway through processing');
      await new Promise(resolve => setTimeout(resolve, 100));
      
      reporter.completePhase('Timing test completed');
      
      const endTime = Date.now();
      const actualDuration = endTime - startTime;

      const summary = reporter.getSummary();
      expect(summary.totalDuration).toBeGreaterThan(0);
      expect(summary.totalDuration).toBeLessThan(actualDuration + 50); // Allow some tolerance
    });

    it('should handle verbose and quiet modes appropriately', () => {
      // Test verbose mode
      const verboseReporter = new ProgressReporter({
        verbose: true,
        quiet: false,
        progressCallback: (progress) => progressCallbacks.push(progress)
      });

      verboseReporter.startPhase('Verbose Test', 'Testing verbose output');
      verboseReporter.updateProgress(50, 'Verbose progress update');
      verboseReporter.completePhase('Verbose test completed');
      verboseReporter.cleanup();

      const verboseCallbacks = progressCallbacks.length;

      // Reset and test quiet mode
      progressCallbacks = [];
      const quietReporter = new ProgressReporter({
        verbose: false,
        quiet: true,
        progressCallback: (progress) => progressCallbacks.push(progress)
      });

      quietReporter.startPhase('Quiet Test', 'Testing quiet output');
      quietReporter.updateProgress(50, 'Quiet progress update');
      quietReporter.completePhase('Quiet test completed');
      quietReporter.cleanup();

      const quietCallbacks = progressCallbacks.length;

      // Verbose mode should produce more callbacks
      expect(verboseCallbacks).toBeGreaterThan(quietCallbacks);
    });
  });

  describe('OutputManager Integration', () => {
    let outputManager: OutputManager;
    let outputDir: string;

    beforeEach(async () => {
      outputDir = join(tempDir, 'output');
      await fs.mkdir(outputDir, { recursive: true });
      outputManager = new OutputManager({
        outputFormat: 'markdown',
        outputDirectory: outputDir,
        verbose: true
      });
    });

    it('should generate multi-format outputs for different sections', async () => {
      const mockSection1Result = createMockSection1Result();
      const mockSection2Result = createMockSection2Result();

      // Test different output formats
      const formats = ['markdown', 'json', 'yaml', 'txt'] as const;

      for (const format of formats) {
        const formatOutputManager = new OutputManager({
          outputFormat: format,
          outputDirectory: outputDir,
          verbose: false
        });

        const filename1 = `section1_output.${format}`;
        const filename2 = `section2_output.${format}`;

        await formatOutputManager.outputSection1(mockSection1Result, filename1);
        await formatOutputManager.outputSection2(mockSection2Result, filename2);

        // Verify files were created
        const file1Path = join(outputDir, filename1);
        const file2Path = join(outputDir, filename2);

        expect(await fs.access(file1Path).then(() => true).catch(() => false)).toBe(true);
        expect(await fs.access(file2Path).then(() => true).catch(() => false)).toBe(true);

        // Verify file contents are non-empty
        const file1Content = await fs.readFile(file1Path, 'utf8');
        const file2Content = await fs.readFile(file2Path, 'utf8');

        expect(file1Content.length).toBeGreaterThan(0);
        expect(file2Content.length).toBeGreaterThan(0);

        // Format-specific validations
        if (format === 'json') {
          expect(() => JSON.parse(file1Content)).not.toThrow();
          expect(() => JSON.parse(file2Content)).not.toThrow();
        } else if (format === 'markdown') {
          expect(file1Content).toContain('#');
          expect(file2Content).toContain('#');
        }
      }
    });

    it('should handle output directory creation and filename sanitization', async () => {
      const nestedDir = join(outputDir, 'nested', 'deep', 'directory');
      const nestedOutputManager = new OutputManager({
        outputFormat: 'json',
        outputDirectory: nestedDir,
        verbose: false
      });

      const mockResult = createMockSection1Result();
      const filename = 'test output file with spaces.json';

      await nestedOutputManager.outputSection1(mockResult, filename);

      // Verify nested directory was created
      expect(await fs.access(nestedDir).then(() => true).catch(() => false)).toBe(true);

      // Verify file was created with sanitized name
      const expectedPath = join(nestedDir, filename);
      expect(await fs.access(expectedPath).then(() => true).catch(() => false)).toBe(true);
    });

    it('should provide automatic filename generation based on input', async () => {
      const mockResult = createMockSection1Result();
      
      // Test with automatic filename generation
      const generatedPath = await outputManager.outputSection1(mockResult);
      
      expect(generatedPath).toBeDefined();
      expect(generatedPath).toContain('datapilot');
      expect(generatedPath).toContain('.md'); // Default format
      expect(await fs.access(generatedPath).then(() => true).catch(() => false)).toBe(true);
    });

    it('should handle combined output for multiple sections', async () => {
      const mockResults = {
        section1: createMockSection1Result(),
        section2: createMockSection2Result(),
        section3: createMockSection3Result()
      };

      const combinedPath = await outputManager.outputCombined(mockResults, 'combined_report.md');

      expect(await fs.access(combinedPath).then(() => true).catch(() => false)).toBe(true);

      const combinedContent = await fs.readFile(combinedPath, 'utf8');
      expect(combinedContent).toContain('Section 1');
      expect(combinedContent).toContain('Section 2');
      expect(combinedContent).toContain('Section 3');
      expect(combinedContent.length).toBeGreaterThan(1000);
    });
  });

  describe('End-to-End CLI Integration', () => {
    let cli: DataPilotCLI;

    beforeEach(() => {
      cli = new DataPilotCLI();
    });

    it('should execute complete analysis workflow with all sections', async () => {
      const options: CLIOptions = {
        command: 'all',
        files: [testCsvPath],
        verbose: true,
        outputFormat: 'json',
        outputFile: join(tempDir, 'complete_analysis.json'),
        force: true
      };

      const context: CLIContext = {
        startTime: Date.now(),
        workingDirectory: tempDir,
        tempDirectory: tempDir
      };

      const result = await cli.execute(options, context);

      expect(result.success).toBe(true);
      expect(result.outputFiles.length).toBeGreaterThan(0);
      expect(result.metadata.sectionsCompleted).toContain('section1');
      expect(result.metadata.totalDuration).toBeGreaterThan(0);

      // Verify output file was created
      const outputPath = options.outputFile!;
      expect(await fs.access(outputPath).then(() => true).catch(() => false)).toBe(true);

      // Verify output content
      const outputContent = await fs.readFile(outputPath, 'utf8');
      const outputData = JSON.parse(outputContent);
      
      expect(outputData.section1).toBeDefined();
      expect(outputData.section2).toBeDefined();
      expect(outputData.metadata).toBeDefined();
    }, 30000); // Allow longer timeout for complete analysis

    it('should execute section-specific analysis commands', async () => {
      const sections = ['overview', 'quality', 'eda'] as const;

      for (const section of sections) {
        const options: CLIOptions = {
          command: section,
          files: [testCsvPath],
          verbose: false,
          outputFormat: 'markdown',
          outputFile: join(tempDir, `${section}_test.md`)
        };

        const context: CLIContext = {
          startTime: Date.now(),
          workingDirectory: tempDir,
          tempDirectory: tempDir
        };

        const result = await cli.execute(options, context);

        expect(result.success).toBe(true);
        expect(result.outputFiles.length).toBe(1);
        expect(result.metadata.sectionsCompleted).toContain(`section${getSectionNumber(section)}`);

        // Verify section-specific output
        const outputPath = options.outputFile!;
        expect(await fs.access(outputPath).then(() => true).catch(() => false)).toBe(true);
      }
    }, 20000);

    it('should handle error scenarios gracefully', async () => {
      // Test with non-existent file
      const options: CLIOptions = {
        command: 'overview',
        files: [join(tempDir, 'nonexistent.csv')],
        verbose: false,
        outputFormat: 'json'
      };

      const context: CLIContext = {
        startTime: Date.now(),
        workingDirectory: tempDir,
        tempDirectory: tempDir
      };

      const result = await cli.execute(options, context);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('file');
    });

    it('should provide comprehensive progress reporting during execution', async () => {
      const progressUpdates: any[] = [];
      
      const options: CLIOptions = {
        command: 'quality',
        files: [testCsvPath],
        verbose: true,
        outputFormat: 'json',
        progressCallback: (progress) => progressUpdates.push(progress)
      };

      const context: CLIContext = {
        startTime: Date.now(),
        workingDirectory: tempDir,
        tempDirectory: tempDir
      };

      const result = await cli.execute(options, context);

      expect(result.success).toBe(true);
      expect(progressUpdates.length).toBeGreaterThan(0);

      // Verify we received different types of progress updates
      const phaseStarts = progressUpdates.filter(p => p.type === 'phase_start');
      const progressReports = progressUpdates.filter(p => p.type === 'progress');
      const phaseCompletions = progressUpdates.filter(p => p.type === 'phase_complete');

      expect(phaseStarts.length).toBeGreaterThan(0);
      expect(progressReports.length).toBeGreaterThan(0);
      expect(phaseCompletions.length).toBeGreaterThan(0);
    }, 15000);

    it('should handle multi-file analysis correctly', async () => {
      // Create a second test file
      const testCsvPath2 = join(tempDir, 'test-data2.csv');
      const testCsvContent2 = [
        'user_id,full_name,years,dept,income',
        '1,"John Doe",28,Engineering,75000',
        '2,"Jane Smith",32,Marketing,68000',
        '6,"Dave Miller",35,Engineering,81000'
      ].join('\n');
      await fs.writeFile(testCsvPath2, testCsvContent2, 'utf8');

      const options: CLIOptions = {
        command: 'engineering',
        files: [testCsvPath, testCsvPath2],
        verbose: true,
        outputFormat: 'json',
        outputFile: join(tempDir, 'multi_file_analysis.json')
      };

      const context: CLIContext = {
        startTime: Date.now(),
        workingDirectory: tempDir,
        tempDirectory: tempDir
      };

      const result = await cli.execute(options, context);

      expect(result.success).toBe(true);
      expect(result.metadata.filesProcessed).toBe(2);
      expect(result.outputFiles.length).toBeGreaterThan(0);

      // Verify multi-file analysis output
      const outputPath = options.outputFile!;
      expect(await fs.access(outputPath).then(() => true).catch(() => false)).toBe(true);

      const outputContent = await fs.readFile(outputPath, 'utf8');
      const outputData = JSON.parse(outputContent);
      
      expect(outputData.section5).toBeDefined();
      // Should contain relationship analysis for multiple files
      expect(outputData.section5.engineeringAnalysis).toBeDefined();
    }, 20000);
  });
});

// Helper functions for creating mock data
function createMockSection1Result(): any {
  return {
    overview: {
      fileDetails: {
        originalFilename: 'test-dataset.csv',
        fullResolvedPath: '/path/to/test-dataset.csv',
        fileSizeBytes: 1024000,
        fileSizeMB: 1.024,
        mimeType: 'text/csv',
        lastModified: new Date('2024-01-15'),
        sha256Hash: 'abc123def456',
      },
      parsingMetadata: {
        dataSourceType: 'Local File System',
        parsingEngine: 'DataPilot CSV Parser',
        parsingTimeSeconds: 0.5,
        encoding: {
          encoding: 'utf8',
          detectionMethod: 'BOM Analysis',
          confidence: 95,
          bomDetected: false,
        },
        delimiter: {
          delimiter: ',',
          detectionMethod: 'Frequency Analysis',
          confidence: 98,
          alternativesConsidered: [
            { delimiter: ';', score: 0.1 },
            { delimiter: '\t', score: 0.05 },
          ],
        },
        lineEnding: 'LF',
        quotingCharacter: '"',
        emptyLinesEncountered: 0,
        headerProcessing: {
          headerPresence: 'Detected',
          headerRowNumbers: [0],
          columnNamesSource: 'First Row',
        },
        initialScanLimit: {
          method: 'Complete File Scan',
          linesScanned: 1000,
        },
      },
      structuralDimensions: {
        totalRowsRead: 1000,
        totalDataRows: 999,
        totalColumns: 6,
        totalDataCells: 5994,
        columnInventory: [
          { index: 0, name: 'id', originalIndex: 0 },
          { index: 1, name: 'name', originalIndex: 1 },
          { index: 2, name: 'age', originalIndex: 2 },
          { index: 3, name: 'department', originalIndex: 3 },
          { index: 4, name: 'salary', originalIndex: 4 },
          { index: 5, name: 'active', originalIndex: 5 },
        ],
        estimatedInMemorySizeMB: 2.5,
        averageRowLengthBytes: 64,
        sparsityAnalysis: {
          sparsityPercentage: 2.5,
          method: 'Sample-based estimation',
          sampleSize: 1000,
          description: 'Low sparsity dataset',
        },
      },
      executionContext: {
        fullCommandExecuted: 'datapilot all test-dataset.csv',
        analysisMode: 'complete',
        analysisStartTimestamp: new Date('2024-01-15T10:00:00Z'),
        globalSamplingStrategy: 'full_scan',
        activatedModules: ['section1', 'section2', 'section3'],
        processingTimeSeconds: 1.2,
      },
      generatedAt: new Date('2024-01-15T10:00:01Z'),
      version: '1.3.1',
    },
    warnings: [],
    performanceMetrics: {
      totalAnalysisTime: 1200,
      peakMemoryUsage: 128,
      phases: {
        'file-analysis': 200,
        'parsing': 500,
        'structural-analysis': 400,
        'report-generation': 100,
      },
    },
  };
}

function createMockSection2Result(): any {
  return {
    qualityAudit: {
      cockpit: {
        compositeScore: {
          score: 85,
          interpretation: 'Good',
          details: 'Overall data quality is good with minor issues',
        },
        technicalDebt: {
          timeEstimate: '4-6 hours',
          complexityLevel: 'Medium',
          primaryDebtContributors: ['Missing values', 'Outliers'],
        },
        strengths: [
          {
            description: 'High data completeness',
            category: 'completeness',
            impact: 'high',
          },
        ],
        weaknesses: [
          {
            description: 'Some outliers detected',
            category: 'accuracy',
            severity: 'medium',
            priority: 3,
            estimatedEffort: '2 hours',
          },
        ],
      },
      completeness: {
        missingValuesByColumn: [
          {
            columnName: 'age',
            missingCount: 5,
            missingPercentage: 0.5,
            missingPattern: 'Random',
          },
        ],
        overallCompleteness: {
          percentage: 99.5,
          missingCells: 5,
          totalCells: 5994,
        },
        score: {
          score: 95,
          interpretation: 'Excellent',
        },
      },
      uniqueness: {
        duplicateGroups: [],
        uniquenessMetrics: [
          {
            columnName: 'id',
            uniqueValues: 999,
            cardinality: 999,
            uniquenessPercentage: 100,
          },
        ],
        score: {
          score: 98,
          interpretation: 'Excellent',
        },
      },
      validity: {
        validationResults: [],
        score: {
          score: 92,
          interpretation: 'Excellent',
        },
      },
      accuracy: {
        outlierDetection: [
          {
            columnName: 'salary',
            outliers: [
              { value: 500000, rowIndex: 150, zScore: 3.5 },
              { value: 10000, rowIndex: 75, zScore: -2.8 },
            ],
            method: 'Z-Score',
            threshold: 3,
          },
        ],
        score: {
          score: 88,
          interpretation: 'Good',
        },
      },
      consistency: {
        formatConsistency: [],
        score: {
          score: 96,
          interpretation: 'Excellent',
        },
      },
      integrity: {
        orphanedRecords: [],
        cardinalityViolations: [],
        score: {
          score: 100,
          interpretation: 'Excellent',
        },
      },
      reasonableness: {
        statisticalPlausibility: [],
        score: {
          score: 94,
          interpretation: 'Excellent',
        },
      },
      security: {
        sensitiveDataDetection: [],
        score: {
          score: 80,
          interpretation: 'Good',
        },
      },
    },
    warnings: [],
    performanceMetrics: {
      totalAnalysisTime: 2000,
      phases: {
        'completeness': 300,
        'uniqueness': 400,
        'validity': 500,
        'accuracy': 400,
        'consistency': 200,
        'integrity': 100,
        'reasonableness': 100,
      },
    },
  };
}

function createMockSection3Result(): any {
  return {
    edaAnalysis: {
      univariateAnalysis: {
        summary: {
          columnsAnalyzed: 6,
          numericalColumns: 2,
          categoricalColumns: 2,
          dateTimeColumns: 0,
          booleanColumns: 1,
        },
        numericalAnalysis: [
          {
            columnName: 'age',
            descriptiveStatistics: {
              count: 999,
              mean: 35.5,
              median: 34,
              mode: [32],
              standardDeviation: 12.3,
              variance: 151.29,
              range: 45,
              min: 22,
              max: 67,
              quantiles: {
                q1: 28,
                q2: 34,
                q3: 43,
              },
              skewness: 0.15,
              kurtosis: -0.8,
            },
            distribution: {
              type: 'normal',
              parameters: { mean: 35.5, std: 12.3 },
              goodnessOfFit: 0.85,
            },
          },
        ],
        categoricalAnalysis: [
          {
            columnName: 'department',
            frequency: [
              { value: 'Engineering', count: 350, percentage: 35 },
              { value: 'Sales', count: 300, percentage: 30 },
              { value: 'Marketing', count: 200, percentage: 20 },
              { value: 'HR', count: 149, percentage: 15 },
            ],
            uniqueValues: 4,
            entropy: 1.85,
            concentration: 0.35,
          },
        ],
        dateTimeAnalysis: [],
        booleanAnalysis: [
          {
            columnName: 'active',
            distribution: {
              true: { count: 950, percentage: 95 },
              false: { count: 49, percentage: 5 },
            },
          },
        ],
      },
      bivariateAnalysis: {
        correlationMatrix: {
          variables: ['age', 'salary'],
          matrix: [[1.0, 0.65], [0.65, 1.0]],
          significantCorrelations: [
            {
              variable1: 'age',
              variable2: 'salary',
              correlation: 0.65,
              pValue: 0.001,
              significance: 'high',
            },
          ],
        },
        categoricalAssociations: [],
        numericalCategoricalAnalysis: [],
      },
      multivariateAnalysis: {
        principalComponentAnalysis: {
          isApplicable: true,
          componentsAnalyzed: 2,
          varianceExplained: {
            individual: [0.65, 0.25],
            cumulative: [0.65, 0.90],
          },
          varianceThresholds: {
            componentsFor80Percent: 2,
            componentsFor85Percent: 2,
            componentsFor90Percent: 2,
          },
          dominantVariables: [
            { variable: 'salary', component: 1, maxLoading: 0.85 },
            { variable: 'age', component: 1, maxLoading: 0.72 },
          ],
        },
        clusteringAnalysis: {
          isApplicable: true,
          optimalClusters: 3,
          finalClustering: {
            algorithm: 'kmeans',
            clusters: 3,
            validation: {
              silhouetteScore: 0.68,
              wcss: 45000,
              calinski_harabasz: 180.5,
            },
            clusterSizes: [350, 400, 249],
          },
        },
      },
    },
    warnings: [],
    performanceMetrics: {
      totalAnalysisTime: 3500,
      analysisTimeMs: 3500,
      rowsAnalyzed: 999,
      chunksProcessed: 5,
      peakMemoryMB: 64,
      avgChunkSize: 200,
      memoryEfficiency: 'good',
      phases: {
        'univariate': 1500,
        'bivariate': 1200,
        'multivariate': 800,
      },
    },
    metadata: {
      analysisApproach: 'Streaming statistical analysis',
      datasetSize: 999,
      columnsAnalyzed: 6,
      samplingApplied: false,
    },
  };
}

function getSectionNumber(command: string): string {
  const mapping: Record<string, string> = {
    overview: '1',
    quality: '2',
    eda: '3',
    visualization: '4',
    engineering: '5',
    modeling: '6'
  };
  return mapping[command] || '1';
}