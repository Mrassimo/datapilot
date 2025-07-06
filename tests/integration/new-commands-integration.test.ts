/**
 * Integration tests for new CLI commands
 * 
 * Tests all new commands work end-to-end with real files and proper integration
 * with the existing analyzer infrastructure.
 */

import { promises as fs } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { DataPilotCLI } from '../../src/cli';
import { ArgumentParser } from '../../src/cli/argument-parser';
import { UniversalAnalyzer } from '../../src/cli/universal-analyzer';
import type { CLIContext, CLIResult } from '../../src/cli/types';

describe('New Commands Integration', () => {
  let tempDir: string;
  let testCsvPath: string;
  let testCsvPath2: string;
  let cli: DataPilotCLI;
  let analyzer: UniversalAnalyzer;
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let processExitSpy: jest.SpyInstance;

  beforeAll(async () => {
    // Create temporary directory for test files
    tempDir = await fs.mkdtemp(join(tmpdir(), 'datapilot-integration-test-'));
    testCsvPath = join(tempDir, 'employees.csv');
    testCsvPath2 = join(tempDir, 'departments.csv');
    
    // Create test CSV files with realistic data
    const employeesData = [
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
    
    const departmentsData = [
      'dept_id,dept_name,manager,budget',
      '1,Engineering,"Alice Johnson",500000',
      '2,Marketing,"Bob Smith",300000',
      '3,Sales,"Carol Brown",250000',
      '4,HR,"David Wilson",150000'
    ].join('\n');
    
    await fs.writeFile(testCsvPath, employeesData, 'utf8');
    await fs.writeFile(testCsvPath2, departmentsData, 'utf8');
  });

  beforeEach(() => {
    cli = new DataPilotCLI();
    analyzer = new UniversalAnalyzer();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    processExitSpy = jest.spyOn(process, 'exit').mockImplementation();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    processExitSpy.mockRestore();
  });

  afterAll(async () => {
    // Cleanup temporary files
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('Clear Cache Command Integration', () => {
    it('should clear caches and show appropriate feedback', async () => {
      // Mock cache managers for integration test
      const mockCacheStats = {
        sectionCache: { totalEntries: 5, totalSizeBytes: 1024000 },
        resultCache: { totalEntries: 3, totalSizeBytes: 512000 }
      };
      
      jest.doMock('../../src/performance/section-cache-manager', () => ({
        SectionCacheManager: jest.fn().mockImplementation(() => ({
          getStats: jest.fn().mockResolvedValue(mockCacheStats.sectionCache),
          clearAll: jest.fn().mockResolvedValue(undefined)
        }))
      }));

      jest.doMock('../../src/cli/result-cache', () => ({
        createResultCache: jest.fn().mockReturnValue({
          getStats: jest.fn().mockReturnValue(mockCacheStats.resultCache),
          clear: jest.fn().mockResolvedValue(undefined),
          dispose: jest.fn().mockResolvedValue(undefined)
        })
      }));

      const result = await cli.run(['node', 'datapilot', 'clear-cache']);
      
      // Should work correctly even if actual cache modules don't exist
      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
      expect(result.data).toHaveProperty('totalCleared');
      expect(result.metadata.command).toBe('clear-cache');
    });

    it('should handle quiet mode correctly', async () => {
      const result = await cli.run(['node', 'datapilot', 'clear-cache', '--quiet']);
      
      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
      // In quiet mode, should not log normal output
      expect(consoleLogSpy).not.toHaveBeenCalledWith('✅ Cache clearing completed');
    });
  });

  describe('Performance Dashboard Integration', () => {
    it('should show system information and performance metrics', async () => {
      const result = await cli.run(['node', 'datapilot', 'perf']);
      
      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
      expect(result.data.systemInfo).toBeDefined();
      expect(result.data.systemInfo.platform).toBeDefined();
      expect(result.data.systemInfo.arch).toBeDefined();
      expect(result.data.systemInfo.cpuCount).toBeGreaterThan(0);
      expect(result.data.systemInfo.totalMemoryGB).toBeGreaterThan(0);
    });

    it('should show cache statistics when requested', async () => {
      const result = await cli.run(['node', 'datapilot', 'perf', '--cache-stats']);
      
      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
      // Should have attempted to get cache stats
      expect(result.data.cacheStats).toBeDefined();
    });

    it('should handle quiet mode appropriately', async () => {
      const result = await cli.run(['node', 'datapilot', 'perf', '--quiet']);
      
      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
      // Should not show dashboard output in quiet mode
      expect(consoleLogSpy).not.toHaveBeenCalledWith('📊 DataPilot Performance Dashboard');
    });
  });

  describe('Validate Command Integration', () => {
    it('should validate CSV files successfully', async () => {
      const result = await cli.run(['node', 'datapilot', 'validate', testCsvPath]);
      
      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
      expect(result.data.validation).toBeDefined();
      expect(result.data.validation.isValid).toBe(true);
      expect(result.data.validation.format).toBe('csv');
      expect(result.data.validation.confidence).toBeGreaterThan(0.5);
      expect(result.data.validation.estimatedRows).toBeGreaterThan(0);
      expect(result.data.validation.columns).toBeGreaterThan(0);
    });

    it('should handle invalid files gracefully', async () => {
      const invalidPath = join(tempDir, 'nonexistent.csv');
      const result = await cli.run(['node', 'datapilot', 'validate', invalidPath]);
      
      expect(result.success).toBe(false);
      expect(result.exitCode).toBe(1);
      expect(result.error).toContain('not found');
    });

    it('should handle custom delimiters and options', async () => {
      // Create a semicolon-delimited CSV
      const semiColonPath = join(tempDir, 'semicolon.csv');
      const semiColonData = [
        'id;name;department',
        '1;John;Engineering',
        '2;Jane;Marketing'
      ].join('\n');
      
      await fs.writeFile(semiColonPath, semiColonData, 'utf8');
      
      const result = await cli.run(['node', 'datapilot', 'validate', semiColonPath, '--delimiter', ';']);
      
      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
      expect(result.data.validation.detectedDelimiter).toBe(';');
      
      // Cleanup
      await fs.unlink(semiColonPath);
    });
  });

  describe('Info Command Integration', () => {
    it('should show comprehensive file information', async () => {
      const result = await cli.run(['node', 'datapilot', 'info', testCsvPath]);
      
      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
      expect(result.data.fileInfo).toBeDefined();
      expect(result.data.fileInfo.fileName).toBe('employees.csv');
      expect(result.data.fileInfo.format).toBe('csv');
      expect(result.data.fileInfo.formatConfidence).toBeGreaterThan(0.5);
      expect(result.data.fileInfo.estimatedRows).toBeGreaterThan(0);
      expect(result.data.fileInfo.columns).toBeGreaterThan(0);
      expect(result.data.fileInfo.preview).toBeDefined();
      expect(result.data.fileInfo.preview.length).toBeGreaterThan(0);
    });

    it('should handle binary files gracefully', async () => {
      // Create a binary file
      const binaryPath = join(tempDir, 'binary.bin');
      await fs.writeFile(binaryPath, Buffer.from([0x00, 0x01, 0x02, 0x03]));
      
      const result = await cli.run(['node', 'datapilot', 'info', binaryPath]);
      
      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
      expect(result.data.fileInfo.format).toBe('unknown');
      expect(result.data.fileInfo.formatConfidence).toBeLessThan(0.5);
      
      // Cleanup
      await fs.unlink(binaryPath);
    });
  });

  describe('Dry-Run Integration', () => {
    it('should perform dry-run validation for single file commands', async () => {
      const result = await cli.run(['node', 'datapilot', 'overview', testCsvPath, '--dry-run']);
      
      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
      expect(result.data.dryRun).toBe(true);
      expect(result.data.fileValidation).toBeDefined();
      expect(result.data.analysisEstimate).toBeDefined();
      expect(result.data.analysisEstimate.command).toBe('overview');
      expect(result.data.analysisEstimate.estimatedTime).toBeGreaterThan(0);
      expect(result.data.analysisEstimate.estimatedMemory).toBeGreaterThan(0);
    });

    it('should perform dry-run validation for multi-file commands', async () => {
      const result = await cli.run(['node', 'datapilot', 'engineering', testCsvPath, testCsvPath2, '--dry-run']);
      
      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
      expect(result.data.dryRun).toBe(true);
      expect(result.data.fileValidation).toBeDefined();
      expect(result.data.fileValidation.length).toBe(2);
      expect(result.data.analysisEstimate.command).toBe('engineering');
      expect(result.data.analysisEstimate.fileCount).toBe(2);
    });

    it('should handle dry-run errors gracefully', async () => {
      const invalidPath = join(tempDir, 'missing.csv');
      const result = await cli.run(['node', 'datapilot', 'overview', invalidPath, '--dry-run']);
      
      expect(result.success).toBe(false);
      expect(result.exitCode).toBe(1);
      expect(result.error).toContain('not found');
    });
  });

  describe('Multi-File Analysis Integration', () => {
    it('should handle engineering analysis with multiple files', async () => {
      const result = await cli.run(['node', 'datapilot', 'engineering', testCsvPath, testCsvPath2, '--dry-run']);
      
      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
      expect(result.data.analysisEstimate.command).toBe('engineering');
      expect(result.data.analysisEstimate.fileCount).toBe(2);
      expect(result.data.analysisEstimate.multiFileAnalysis).toBe(true);
    });

    it('should detect relationships between files', async () => {
      const result = await cli.run(['node', 'datapilot', 'engineering', testCsvPath, testCsvPath2, '--dry-run']);
      
      expect(result.success).toBe(true);
      expect(result.data.analysisEstimate.relationshipAnalysis).toBeDefined();
      expect(result.data.analysisEstimate.relationshipAnalysis.enabled).toBe(true);
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle invalid command arguments gracefully', async () => {
      const result = await cli.run(['node', 'datapilot', 'invalid-command']);
      
      expect(result.success).toBe(false);
      expect(result.exitCode).toBe(1);
      expect(result.error).toContain('Unknown command');
    });

    it('should handle missing file arguments', async () => {
      const result = await cli.run(['node', 'datapilot', 'overview']);
      
      expect(result.success).toBe(false);
      expect(result.exitCode).toBe(1);
      expect(result.error).toContain('No input files specified');
    });

    it('should provide helpful suggestions for common mistakes', async () => {
      const result = await cli.run(['node', 'datapilot', 'overiew', testCsvPath]); // Typo in command
      
      expect(result.success).toBe(false);
      expect(result.exitCode).toBe(1);
      expect(result.suggestions).toBeDefined();
      expect(result.suggestions.length).toBeGreaterThan(0);
    });
  });

  describe('Output Format Integration', () => {
    it('should handle different output formats with new commands', async () => {
      const formats = ['json', 'yaml', 'txt'] as const;
      
      for (const format of formats) {
        const result = await cli.run(['node', 'datapilot', 'validate', testCsvPath, '--output', format]);
        
        expect(result.success).toBe(true);
        expect(result.exitCode).toBe(0);
        expect(result.data.validation).toBeDefined();
      }
    });

    it('should handle output file specification', async () => {
      const outputPath = join(tempDir, 'validation-output.json');
      const result = await cli.run(['node', 'datapilot', 'validate', testCsvPath, '--output', 'json', '--output-file', outputPath]);
      
      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
      
      // Verify output file was created
      expect(await fs.access(outputPath).then(() => true).catch(() => false)).toBe(true);
      
      // Verify content
      const content = await fs.readFile(outputPath, 'utf8');
      expect(content.length).toBeGreaterThan(0);
      expect(() => JSON.parse(content)).not.toThrow();
      
      // Cleanup
      await fs.unlink(outputPath);
    });
  });

  describe('Performance and Memory Integration', () => {
    it('should handle memory constraints appropriately', async () => {
      const result = await cli.run(['node', 'datapilot', 'perf', '--cache-stats']);
      
      expect(result.success).toBe(true);
      expect(result.data.systemInfo.totalMemoryGB).toBeGreaterThan(0);
      expect(result.data.systemInfo.freeMemoryGB).toBeGreaterThan(0);
    });

    it('should provide timing information in dry-run mode', async () => {
      const result = await cli.run(['node', 'datapilot', 'all', testCsvPath, '--dry-run']);
      
      expect(result.success).toBe(true);
      expect(result.data.analysisEstimate.estimatedTime).toBeGreaterThan(0);
      expect(result.data.analysisEstimate.estimatedMemory).toBeGreaterThan(0);
    });
  });

  describe('Regression Prevention', () => {
    it('should maintain backward compatibility with existing commands', async () => {
      const result = await cli.run(['node', 'datapilot', 'overview', testCsvPath, '--dry-run']);
      
      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
      expect(result.data.analysisEstimate.command).toBe('overview');
    });

    it('should handle help command correctly', async () => {
      const result = await cli.run(['node', 'datapilot', '--help']);
      
      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
      expect(result.data.help).toBeDefined();
    });

    it('should handle version command correctly', async () => {
      const result = await cli.run(['node', 'datapilot', '--version']);
      
      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
      expect(result.data.version).toBeDefined();
    });
  });

  describe('Australian English Compliance', () => {
    it('should use Australian English spelling in output', async () => {
      const result = await cli.run(['node', 'datapilot', 'validate', testCsvPath]);
      
      expect(result.success).toBe(true);
      
      // Check for Australian English spellings in output
      const output = JSON.stringify(result.data);
      // Should use 'analyse' instead of 'analyze'
      expect(output.toLowerCase()).not.toMatch(/\banalyze\b/);
      // Should use 'colour' instead of 'color' where applicable
      expect(output.toLowerCase()).not.toMatch(/\bcolor\b/);
      // Should use 'optimise' instead of 'optimize'
      expect(output.toLowerCase()).not.toMatch(/\boptimize\b/);
    });
  });
});
