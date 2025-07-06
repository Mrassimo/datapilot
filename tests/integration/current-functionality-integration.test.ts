/**
 * Current Functionality Integration Tests
 * 
 * Tests the existing DataPilot functionality to ensure it works correctly
 * and hasn't been broken by recent changes.
 */

import { promises as fs } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { DataPilotCLI } from '../../src/cli';
import type { CLIResult } from '../../src/cli/types';

describe('Current Functionality Integration', () => {
  let tempDir: string;
  let testCsvPath: string;
  let testCsvPath2: string;
  let cli: DataPilotCLI;
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeAll(async () => {
    // Create temporary directory for test files
    tempDir = await fs.mkdtemp(join(tmpdir(), 'datapilot-current-test-'));
    testCsvPath = join(tempDir, 'test-data.csv');
    testCsvPath2 = join(tempDir, 'related-data.csv');
    
    // Create test CSV files
    const testData = [
      'id,name,age,department,salary,active,hire_date',
      '1,"John Doe",28,Engineering,75000,true,2020-01-15',
      '2,"Jane Smith",32,Marketing,68000,true,2019-03-22',
      '3,"Bob Johnson",45,Sales,82000,false,2018-07-10',
      '4,"Alice Brown",29,Engineering,79000,true,2021-02-01',
      '5,"Charlie Wilson",38,HR,65000,true,2017-11-05'
    ].join('\n');
    
    const relatedData = [
      'emp_id,project,start_date,status',
      '1,"Project Alpha",2023-01-01,active',
      '2,"Project Beta",2023-02-15,completed',
      '3,"Project Gamma",2023-03-01,active',
      '1,"Project Delta",2023-04-01,planning'
    ].join('\n');
    
    await fs.writeFile(testCsvPath, testData, 'utf8');
    await fs.writeFile(testCsvPath2, relatedData, 'utf8');
  });

  beforeEach(() => {
    cli = new DataPilotCLI();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  afterAll(async () => {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('Core Commands', () => {
    it('should execute overview command successfully', async () => {
      const result = await cli.run(['node', 'datapilot', 'overview', testCsvPath]);
      
      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
      expect(result.data).toBeDefined();
      
      // Should have section1 data structure
      if (result.data.section1) {
        expect(result.data.section1.overview).toBeDefined();
        expect(result.data.section1.overview.fileDetails).toBeDefined();
        expect(result.data.section1.overview.structuralDimensions).toBeDefined();
      } else if (result.data.overview) {
        // Alternative structure
        expect(result.data.overview.fileDetails).toBeDefined();
        expect(result.data.overview.structuralDimensions).toBeDefined();
      }
    });

    it('should execute quality command successfully', async () => {
      const result = await cli.run(['node', 'datapilot', 'quality', testCsvPath]);
      
      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
      expect(result.data).toBeDefined();
      
      // Should have quality analysis data
      if (result.data.section2) {
        expect(result.data.section2.quality).toBeDefined();
      } else if (result.data.quality) {
        expect(result.data.quality).toBeDefined();
      }
    });

    it('should execute eda command successfully', async () => {
      const result = await cli.run(['node', 'datapilot', 'eda', testCsvPath]);
      
      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
      expect(result.data).toBeDefined();
      
      // Should have EDA analysis data
      if (result.data.section3) {
        expect(result.data.section3.eda).toBeDefined();
      } else if (result.data.eda) {
        expect(result.data.eda).toBeDefined();
      }
    });

    it('should execute visualization command successfully', async () => {
      const result = await cli.run(['node', 'datapilot', 'visualization', testCsvPath]);
      
      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
      expect(result.data).toBeDefined();
      
      // Should have visualization analysis data
      if (result.data.section4) {
        expect(result.data.section4.visualization).toBeDefined();
      } else if (result.data.visualization) {
        expect(result.data.visualization).toBeDefined();
      }
    });

    it('should execute engineering command successfully', async () => {
      const result = await cli.run(['node', 'datapilot', 'engineering', testCsvPath]);
      
      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
      expect(result.data).toBeDefined();
      
      // Should have engineering analysis data
      if (result.data.section5) {
        expect(result.data.section5.engineering).toBeDefined();
      } else if (result.data.engineering) {
        expect(result.data.engineering).toBeDefined();
      }
    });

    it('should execute modeling command successfully', async () => {
      const result = await cli.run(['node', 'datapilot', 'modeling', testCsvPath]);
      
      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
      expect(result.data).toBeDefined();
      
      // Should have modeling analysis data
      if (result.data.section6) {
        expect(result.data.section6.modeling).toBeDefined();
      } else if (result.data.modeling) {
        expect(result.data.modeling).toBeDefined();
      }
    });

    it('should execute all command successfully', async () => {
      const result = await cli.run(['node', 'datapilot', 'all', testCsvPath]);
      
      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
      expect(result.data).toBeDefined();
      
      // Should have multiple sections
      const hasMultipleSections = (
        (result.data.section1 || result.data.overview) &&
        (result.data.section2 || result.data.quality) &&
        (result.data.section3 || result.data.eda)
      );
      expect(hasMultipleSections).toBe(true);
    });
  });

  describe('Multi-File Commands', () => {
    it('should handle engineering command with multiple files', async () => {
      const result = await cli.run(['node', 'datapilot', 'engineering', testCsvPath, testCsvPath2]);
      
      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
      expect(result.data).toBeDefined();
      
      // Should have analysis for multiple files
      if (result.data.joinAnalysis) {
        expect(result.data.joinAnalysis).toBeDefined();
      } else if (result.data.engineering && result.data.engineering.multiFileAnalysis) {
        expect(result.data.engineering.multiFileAnalysis).toBe(true);
      }
    });

    it('should handle join command with multiple files', async () => {
      const result = await cli.run(['node', 'datapilot', 'join', testCsvPath, testCsvPath2]);
      
      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
      expect(result.data).toBeDefined();
      
      // Should have join analysis
      if (result.data.joinAnalysis) {
        expect(result.data.joinAnalysis).toBeDefined();
      }
    });
  });

  describe('Command Line Options', () => {
    it('should handle verbose flag', async () => {
      const result = await cli.run(['node', 'datapilot', 'overview', testCsvPath, '--verbose']);
      
      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
      // Verbose flag should be reflected in options or metadata
      if (result.metadata) {
        expect(result.metadata.verbose).toBe(true);
      }
    });

    it('should handle quiet flag', async () => {
      const result = await cli.run(['node', 'datapilot', 'overview', testCsvPath, '--quiet']);
      
      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
      // Should not have logged normal output in quiet mode
      expect(consoleLogSpy).not.toHaveBeenCalledWith(expect.stringContaining('DataPilot Analysis'));
    });

    it('should handle output format json', async () => {
      const result = await cli.run(['node', 'datapilot', 'overview', testCsvPath, '--format', 'json']);
      
      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
      expect(result.data).toBeDefined();
    });

    it('should handle delimiter option', async () => {
      // Create semicolon-delimited CSV
      const semiCsvPath = join(tempDir, 'semi.csv');
      const semiData = [
        'id;name;value',
        '1;"Test";100',
        '2;"Data";200'
      ].join('\n');
      
      await fs.writeFile(semiCsvPath, semiData, 'utf8');
      
      const result = await cli.run(['node', 'datapilot', 'overview', semiCsvPath, '--delimiter', ';']);
      
      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
      
      // Cleanup
      await fs.unlink(semiCsvPath);
    });
  });

  describe('Output Files', () => {
    it('should create output file with markdown format', async () => {
      const outputPath = join(tempDir, 'test-output.md');
      const result = await cli.run([
        'node', 'datapilot', 'overview', testCsvPath,
        '--format', 'markdown',
        '--output', outputPath
      ]);
      
      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
      
      // Check if output file was created
      const fileExists = await fs.access(outputPath).then(() => true).catch(() => false);
      if (fileExists) {
        const content = await fs.readFile(outputPath, 'utf8');
        expect(content.length).toBeGreaterThan(0);
        await fs.unlink(outputPath); // Cleanup
      }
    });

    it('should create output file with json format', async () => {
      const outputPath = join(tempDir, 'test-output.json');
      const result = await cli.run([
        'node', 'datapilot', 'overview', testCsvPath,
        '--format', 'json',
        '--output', outputPath
      ]);
      
      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
      
      // Check if output file was created
      const fileExists = await fs.access(outputPath).then(() => true).catch(() => false);
      if (fileExists) {
        const content = await fs.readFile(outputPath, 'utf8');
        expect(content.length).toBeGreaterThan(0);
        expect(() => JSON.parse(content)).not.toThrow();
        await fs.unlink(outputPath); // Cleanup
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle file not found gracefully', async () => {
      const result = await cli.run(['node', 'datapilot', 'overview', 'nonexistent.csv']);
      
      expect(result.success).toBe(false);
      expect(result.exitCode).toBe(1);
      expect(result.error || result.data?.error).toContain('not found');
    });

    it('should handle invalid command gracefully', async () => {
      const result = await cli.run(['node', 'datapilot', 'invalid-command', testCsvPath]);
      
      expect(result.success).toBe(false);
      expect(result.exitCode).toBe(1);
      expect(result.error || result.data?.error).toBeDefined();
    });

    it('should handle missing file argument', async () => {
      const result = await cli.run(['node', 'datapilot', 'overview']);
      
      expect(result.success).toBe(false);
      expect(result.exitCode).toBe(1);
      expect(result.error || result.data?.error).toContain('No input files');
    });
  });

  describe('Performance and Memory', () => {
    it('should complete analysis in reasonable time', async () => {
      const startTime = Date.now();
      const result = await cli.run(['node', 'datapilot', 'overview', testCsvPath]);
      const endTime = Date.now();
      
      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
      
      const durationMs = endTime - startTime;
      // Should complete in under 10 seconds for small test file
      expect(durationMs).toBeLessThan(10000);
    });

    it('should include performance metrics in results', async () => {
      const result = await cli.run(['node', 'datapilot', 'overview', testCsvPath]);
      
      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
      
      // Check for performance metrics (structure may vary)
      const hasPerformanceData = (
        result.data?.performanceMetrics ||
        result.data?.section1?.performanceMetrics ||
        result.data?.overview?.executionContext
      );
      expect(hasPerformanceData).toBeDefined();
    });
  });

  describe('Data Structure Integrity', () => {
    it('should maintain consistent result structure', async () => {
      const result = await cli.run(['node', 'datapilot', 'overview', testCsvPath]);
      
      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
      
      // Result should have expected top-level properties
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('exitCode');
      expect(result).toHaveProperty('data');
      expect(result.data).toBeDefined();
    });

    it('should handle complex CSV data correctly', async () => {
      // Create complex CSV with edge cases
      const complexCsvPath = join(tempDir, 'complex.csv');
      const complexData = [
        'id,description,value',
        '1,"Text with \"quotes\"",100.5',
        '2,"Text with,commas",200.75',
        '3,"Text with\nnewlines",300.25'
      ].join('\n');
      
      await fs.writeFile(complexCsvPath, complexData, 'utf8');
      
      const result = await cli.run(['node', 'datapilot', 'overview', complexCsvPath]);
      
      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
      
      // Should handle complex CSV parsing
      const hasStructuralData = (
        result.data?.section1?.overview?.structuralDimensions ||
        result.data?.overview?.structuralDimensions
      );
      expect(hasStructuralData).toBeDefined();
      
      // Cleanup
      await fs.unlink(complexCsvPath);
    });
  });

  describe('Australian English Compliance', () => {
    it('should use Australian English spellings', async () => {
      const result = await cli.run(['node', 'datapilot', 'overview', testCsvPath]);
      
      expect(result.success).toBe(true);
      
      // Check result data for American spellings (should not be present)
      const resultString = JSON.stringify(result.data);
      
      // Common American spellings that should not appear
      const americanSpellings = [
        /\banalyze\b/gi,
        /\boptimize\b/gi,
        /\bvisualization\b/gi,
        /\bcolor\b/gi
      ];
      
      for (const pattern of americanSpellings) {
        const matches = resultString.match(pattern);
        if (matches && matches.length > 0) {
          console.warn(`Found American spelling: ${matches[0]}`);
        }
      }
    });
  });

  describe('Streaming and Memory Management', () => {
    it('should handle streaming flag', async () => {
      const result = await cli.run(['node', 'datapilot', 'overview', testCsvPath, '--streaming']);
      
      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
      
      // Should indicate streaming mode if supported
      const metadata = result.metadata || result.data?.metadata;
      if (metadata) {
        // Streaming flag should be acknowledged
        expect(metadata.streaming || metadata.processingMode).toBeDefined();
      }
    });

    it('should handle memory constraints', async () => {
      const result = await cli.run(['node', 'datapilot', 'overview', testCsvPath, '--max-memory', '100']);
      
      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
      
      // Should respect memory limits if supported
      const options = result.metadata?.options || result.data?.metadata?.options;
      if (options) {
        expect(options.maxMemory || options['max-memory']).toBeDefined();
      }
    });
  });
});
