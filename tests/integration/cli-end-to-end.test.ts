/**
 * CLI End-to-End Integration Tests
 * 
 * Comprehensive integration testing for DataPilot CLI components with realistic
 * workflows and proper interface usage.
 */

import { ArgumentParser } from '../../src/cli/argument-parser';
import { ProgressReporter } from '../../src/cli/progress-reporter';
import { OutputManager } from '../../src/cli/output-manager';
import type { CLIContext, CLIOptions } from '../../src/cli/types';
import { promises as fs } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('CLI End-to-End Integration', () => {
  let tempDir: string;
  let testCsvPath: string;

  beforeAll(async () => {
    // Create temporary directory for test files
    tempDir = await fs.mkdtemp(join(tmpdir(), 'datapilot-e2e-test-'));
    testCsvPath = join(tempDir, 'test-data.csv');
    
    // Create a test CSV file with realistic data
    const testCsvContent = [
      'id,name,age,department,salary,active,hire_date',
      '1,"John Doe",28,Engineering,75000,true,2020-01-15',
      '2,"Jane Smith",32,Marketing,68000,true,2019-03-22',
      '3,"Bob Johnson",45,Sales,82000,false,2018-07-10',
      '4,"Alice Brown",29,Engineering,79000,true,2021-02-01',
      '5,"Charlie Wilson",38,HR,65000,true,2017-11-05',
      '6,"Diana Davis",31,Marketing,71000,true,2020-08-18',
      '7,"Eve Anderson",27,Engineering,73000,true,2021-09-12',
      '8,"Frank Miller",43,Sales,85000,true,2016-04-03',
      '9,"Grace Taylor",35,HR,67000,true,2019-12-15',
      '10,"Henry Clark",39,Engineering,81000,true,2018-01-20'
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

  describe('ArgumentParser Real Interface Tests', () => {
    let parser: ArgumentParser;

    beforeEach(() => {
      parser = new ArgumentParser();
    });

    it('should parse command line arguments and return CLIContext', () => {
      const args = ['overview', testCsvPath, '--verbose'];
      const context = parser.parse(['node', 'datapilot', ...args]);

      expect(context.command).toBe('overview');
      expect(context.args).toContain(testCsvPath);
      expect(context.startTime).toBeGreaterThan(0);
      expect(context.workingDirectory).toBeDefined();
      expect(context.options).toBeDefined();
    });

    it('should handle help command appropriately', () => {
      const args = ['--help'];
      const context = parser.parse(['node', 'datapilot', ...args]);

      expect(context.command).toBe('help');
      expect(context.args).toEqual([]);
      expect(context.options).toEqual({});
    });

    it('should validate file existence in arguments', () => {
      const nonExistentFile = join(tempDir, 'nonexistent.csv');
      const args = ['overview', nonExistentFile];

      expect(() => {
        parser.parse(['node', 'datapilot', ...args]);
      }).toThrow();
    });

    it('should parse multiple files for join commands', () => {
      // Create additional test files
      const testCsvPath2 = join(tempDir, 'test-data2.csv');
      
      return fs.writeFile(testCsvPath2, 'user_id,score\n1,95\n2,87', 'utf8').then(() => {
        const args = ['join', testCsvPath, testCsvPath2];
        const context = parser.parse(['node', 'datapilot', ...args]);

        expect(context.command).toBe('join');
        expect(context.args).toContain(testCsvPath);
        expect(context.args).toContain(testCsvPath2);
      });
    });

    it('should handle various CLI options properly', () => {
      const args = [
        'all', testCsvPath,
        '--verbose',
        '--output', 'json',
        '--force'
      ];
      
      const context = parser.parse(['node', 'datapilot', ...args]);

      expect(context.command).toBe('all');
      expect(context.options).toBeDefined();
      // Options are stored in the CLIOptions object within context
    });
  });

  describe('ProgressReporter Real Interface Tests', () => {
    let reporter: ProgressReporter;
    let progressMessages: Array<{ message: string; progress: number }>;

    beforeEach(() => {
      progressMessages = [];
      reporter = new ProgressReporter(false, true); // Not quiet, verbose
      reporter.setProgressCallback((progress) => {
        progressMessages.push(progress);
      });
    });

    afterEach(() => {
      reporter.cleanup();
    });

    it('should provide progress reporting through analysis workflow', async () => {
      reporter.startPhase('File Analysis', 'Analyzing file structure');
      await simulateWork(50);

      reporter.updateProgress(25, 'Parsing CSV headers');
      await simulateWork(30);

      reporter.updateProgress(50, 'Detecting data types');
      await simulateWork(30);

      reporter.updateProgress(75, 'Computing statistics');
      await simulateWork(30);

      reporter.completePhase('File analysis completed');

      // Verify progress callbacks were received
      expect(progressMessages.length).toBeGreaterThan(0);
      
      // Check that we received starting and completion messages
      const hasStartMessage = progressMessages.some(msg => 
        msg.message.includes('Starting File Analysis')
      );
      const hasCompletionMessage = progressMessages.some(msg => 
        msg.message.includes('completed')
      );

      expect(hasStartMessage).toBe(true);
      expect(hasCompletionMessage).toBe(true);
    });

    it('should handle multiple phases correctly', async () => {
      const phases = [
        { name: 'File Analysis', message: 'Analyzing structure' },
        { name: 'Quality Analysis', message: 'Checking data quality' },
        { name: 'EDA', message: 'Statistical analysis' }
      ];

      for (const phase of phases) {
        reporter.startPhase(phase.name, phase.message);
        await simulateWork(20);
        
        reporter.updateProgress(50, `${phase.name} in progress`);
        await simulateWork(20);
        
        reporter.completePhase(`${phase.name} completed`);
        await simulateWork(10);
      }

      expect(progressMessages.length).toBeGreaterThan(phases.length * 2);
    });

    it('should handle quiet mode appropriately', () => {
      const quietReporter = new ProgressReporter(true, false); // Quiet mode
      const quietMessages: Array<{ message: string; progress: number }> = [];
      
      quietReporter.setProgressCallback((progress) => {
        quietMessages.push(progress);
      });

      quietReporter.startPhase('Quiet Test', 'Testing quiet mode');
      quietReporter.updateProgress(50, 'Quiet progress');
      quietReporter.completePhase('Quiet completed');
      quietReporter.cleanup();

      // Quiet mode should still send callbacks but minimize console output
      expect(quietMessages.length).toBeGreaterThan(0);
    });

    it('should report errors appropriately', () => {
      reporter.startPhase('Error Test', 'Testing error handling');
      
      const errorMessage = 'Test error occurred';
      reporter.reportError(errorMessage);

      // Should continue to function after error
      reporter.updateProgress(50, 'Continuing after error');
      reporter.completePhase('Error test completed');

      expect(progressMessages.length).toBeGreaterThan(0);
    });
  });

  describe('OutputManager Real Interface Tests', () => {
    let outputManager: OutputManager;
    let outputDir: string;

    beforeEach(async () => {
      outputDir = join(tempDir, 'output');
      await fs.mkdir(outputDir, { recursive: true });
      
      outputManager = new OutputManager({
        format: 'markdown',
        outputDir: outputDir,
        verbose: true
      });
    });

    it('should create output files with correct formatting', async () => {
      const mockSection1Result = createMockSection1Result();

      // Test output generation
      const outputFiles = await outputManager.outputSection1(mockSection1Result);

      expect(outputFiles).toBeDefined();
      expect(outputFiles.length).toBeGreaterThan(0);

      // Verify file was created
      const outputFile = outputFiles[0];
      expect(await fs.access(outputFile).then(() => true).catch(() => false)).toBe(true);

      // Verify file content
      const content = await fs.readFile(outputFile, 'utf8');
      expect(content.length).toBeGreaterThan(0);
      expect(content).toContain('DataPilot'); // Should contain some expected content
    });

    it('should handle different output formats', async () => {
      const formats = ['json', 'yaml', 'txt'] as const;
      const mockResult = createMockSection1Result();

      for (const format of formats) {
        const formatOutputManager = new OutputManager({
          format: format,
          outputDir: outputDir,
          verbose: false
        });

        const outputFiles = await formatOutputManager.outputSection1(mockResult);
        expect(outputFiles.length).toBeGreaterThan(0);

        const outputFile = outputFiles[0];
        expect(outputFile).toContain(`.${format}`);
        
        const content = await fs.readFile(outputFile, 'utf8');
        expect(content.length).toBeGreaterThan(0);

        if (format === 'json') {
          expect(() => JSON.parse(content)).not.toThrow();
        }
      }
    });

    it('should handle custom output filenames', async () => {
      const mockResult = createMockSection1Result();
      const customFilename = 'custom-report.md';

      const outputFiles = await outputManager.outputSection1(mockResult, customFilename);
      
      expect(outputFiles.length).toBeGreaterThan(0);
      expect(outputFiles[0]).toContain(customFilename);
    });

    it('should create directory structure as needed', async () => {
      const nestedDir = join(outputDir, 'nested', 'deep');
      const nestedOutputManager = new OutputManager({
        format: 'markdown',
        outputDir: nestedDir,
        verbose: false
      });

      const mockResult = createMockSection1Result();
      const outputFiles = await nestedOutputManager.outputSection1(mockResult);

      expect(outputFiles.length).toBeGreaterThan(0);
      expect(await fs.access(nestedDir).then(() => true).catch(() => false)).toBe(true);
    });
  });

  describe('Integrated CLI Workflow Tests', () => {
    it('should simulate complete analysis workflow', async () => {
      // Step 1: Parse arguments
      const parser = new ArgumentParser();
      const args = ['all', testCsvPath, '--verbose', '--output', 'json'];
      const context = parser.parse(['node', 'datapilot', ...args]);

      expect(context.command).toBe('all');

      // Step 2: Set up progress reporting
      const progressUpdates: Array<{ message: string; progress: number }> = [];
      const reporter = new ProgressReporter(false, true);
      reporter.setProgressCallback((progress) => {
        progressUpdates.push(progress);
      });

      try {
        // Step 3: Simulate analysis phases
        reporter.startPhase('File Analysis', 'Starting analysis');
        await simulateWork(100);
        reporter.updateProgress(100, 'File analysis complete');
        reporter.completePhase('File analysis completed');

        reporter.startPhase('Quality Analysis', 'Analyzing data quality');
        await simulateWork(150);
        reporter.updateProgress(100, 'Quality analysis complete');
        reporter.completePhase('Quality analysis completed');

        // Step 4: Generate output
        const outputManager = new OutputManager({
          format: 'json',
          outputDir: tempDir,
          verbose: true
        });

        const mockResult = createMockSection1Result();
        const outputFiles = await outputManager.outputSection1(mockResult);

        // Verify the complete workflow
        expect(progressUpdates.length).toBeGreaterThan(0);
        expect(outputFiles.length).toBeGreaterThan(0);
        
        // Verify output file exists
        const outputFile = outputFiles[0];
        expect(await fs.access(outputFile).then(() => true).catch(() => false)).toBe(true);

        // Verify content
        const content = await fs.readFile(outputFile, 'utf8');
        expect(content.length).toBeGreaterThan(0);

      } finally {
        reporter.cleanup();
      }
    });

    it('should handle error scenarios gracefully', async () => {
      const parser = new ArgumentParser();
      
      // Test with non-existent file
      const nonExistentFile = join(tempDir, 'does-not-exist.csv');
      const args = ['overview', nonExistentFile];

      expect(() => {
        parser.parse(['node', 'datapilot', ...args]);
      }).toThrow();
    });

    it('should support multi-file analysis workflows', async () => {
      // Create additional test files
      const testCsvPath2 = join(tempDir, 'departments.csv');
      const departmentData = [
        'dept_id,dept_name,manager',
        '1,Engineering,"Alice Johnson"',
        '2,Marketing,"Bob Smith"',
        '3,Sales,"Carol Brown"',
        '4,HR,"David Wilson"'
      ].join('\n');
      
      await fs.writeFile(testCsvPath2, departmentData, 'utf8');

      // Parse multi-file command
      const parser = new ArgumentParser();
      const args = ['engineering', testCsvPath, testCsvPath2, '--verbose'];
      const context = parser.parse(['node', 'datapilot', ...args]);

      expect(context.command).toBe('engineering');
      expect(context.args.length).toBe(2);
      expect(context.args).toContain(testCsvPath);
      expect(context.args).toContain(testCsvPath2);

      // Simulate multi-file progress tracking
      const reporter = new ProgressReporter(false, true);
      const progressUpdates: Array<{ message: string; progress: number }> = [];
      reporter.setProgressCallback((progress) => {
        progressUpdates.push(progress);
      });

      try {
        reporter.startPhase('Multi-file Analysis', 'Processing multiple files');
        
        for (let i = 0; i < context.args.length; i++) {
          const fileName = context.args[i];
          const progress = ((i + 1) / context.args.length) * 100;
          reporter.updateProgress(progress, `Processing ${fileName}`);
          await simulateWork(50);
        }
        
        reporter.completePhase('Multi-file analysis completed');

        expect(progressUpdates.length).toBeGreaterThan(context.args.length);

      } finally {
        reporter.cleanup();
      }
    });
  });
});

// Helper function to simulate processing work
function simulateWork(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Helper function to create mock Section 1 result
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
        totalRowsRead: 10,
        totalDataRows: 10,
        totalColumns: 7,
        totalDataCells: 70,
        columnInventory: [
          { index: 0, name: 'id', originalIndex: 0 },
          { index: 1, name: 'name', originalIndex: 1 },
          { index: 2, name: 'age', originalIndex: 2 },
          { index: 3, name: 'department', originalIndex: 3 },
          { index: 4, name: 'salary', originalIndex: 4 },
          { index: 5, name: 'active', originalIndex: 5 },
          { index: 6, name: 'hire_date', originalIndex: 6 },
        ],
        estimatedInMemorySizeMB: 0.5,
        averageRowLengthBytes: 64,
        sparsityAnalysis: {
          sparsityPercentage: 0,
          method: 'Complete scan',
          sampleSize: 10,
          description: 'No sparsity detected',
        },
      },
      executionContext: {
        fullCommandExecuted: 'datapilot all test-dataset.csv',
        analysisMode: 'complete',
        analysisStartTimestamp: new Date('2024-01-15T10:00:00Z'),
        globalSamplingStrategy: 'full_scan',
        activatedModules: ['section1'],
        processingTimeSeconds: 0.5,
      },
      generatedAt: new Date('2024-01-15T10:00:01Z'),
      version: '1.3.1',
    },
    warnings: [],
    performanceMetrics: {
      totalAnalysisTime: 500,
      peakMemoryUsage: 64,
      phases: {
        'file-analysis': 200,
        'parsing': 200,
        'structural-analysis': 100,
      },
    },
  };
}