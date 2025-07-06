/**
 * Comprehensive tests for new CLI commands
 * Tests: clear-cache, perf, validate, info commands
 */

import { DataPilotCLI } from '@/cli';
import { ArgumentParser } from '@/cli/argument-parser';
import { UniversalAnalyzer } from '@/cli/universal-analyzer';
import type { CLIOptions, CLIResult } from '@/cli/types';
import * as fs from 'fs';
import * as os from 'os';

// Mock fs and os methods
jest.mock('fs');
jest.mock('os');
jest.mock('@/performance/section-cache-manager');
jest.mock('@/cli/result-cache');

const mockFs = fs as jest.Mocked<typeof fs>;
const mockOs = os as jest.Mocked<typeof os>;

// Mock implementations
let mockSectionCacheManager: any;
let mockResultCache: any;

// Create the mocks
mockSectionCacheManager = {
  getStats: jest.fn().mockResolvedValue({
    totalEntries: 5,
    totalSizeBytes: 10485760, // 10MB
    hitRate: 0.85
  }),
  clearAll: jest.fn().mockResolvedValue(undefined)
};

mockResultCache = {
  getStats: jest.fn().mockReturnValue({
    totalEntries: 3,
    totalSizeBytes: 5242880, // 5MB
    hitCount: 15,
    missCount: 5
  }),
  clear: jest.fn().mockResolvedValue(undefined),
  dispose: jest.fn().mockResolvedValue(undefined)
};

// Mock the modules using jest.mock at the top level
jest.mock('@/performance/section-cache-manager', () => ({
  SectionCacheManager: jest.fn().mockImplementation(() => mockSectionCacheManager)
}));

jest.mock('@/cli/result-cache', () => ({
  createResultCache: jest.fn(() => mockResultCache)
}));

describe('New CLI Commands', () => {
  let cli: DataPilotCLI;
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let processExitSpy: jest.SpyInstance;

  beforeEach(() => {
    cli = new DataPilotCLI();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    processExitSpy = jest.spyOn(process, 'exit').mockImplementation();
    
    // Reset all mocks
    jest.clearAllMocks();
    
    // Reset cache mocks to default state
    mockSectionCacheManager.getStats.mockResolvedValue({
      totalEntries: 5,
      totalSizeBytes: 10485760, // 10MB
      hitRate: 0.85
    });
    mockSectionCacheManager.clearAll.mockResolvedValue(undefined);
    
    mockResultCache.getStats.mockReturnValue({
      totalEntries: 3,
      totalSizeBytes: 5242880, // 5MB
      hitCount: 15,
      missCount: 5
    });
    mockResultCache.clear.mockResolvedValue(undefined);
    mockResultCache.dispose.mockResolvedValue(undefined);

    // Setup default fs mocks
    mockFs.existsSync.mockReturnValue(true);
    mockFs.statSync.mockReturnValue({
      isFile: () => true,
      size: 1000000, // 1MB
      mtime: new Date('2024-01-15T10:30:00Z')
    } as fs.Stats);

    // Setup default os mocks
    mockOs.platform.mockReturnValue('linux');
    mockOs.arch.mockReturnValue('x64');
    mockOs.cpus.mockReturnValue(Array(8).fill({ model: 'Mock CPU' }));
    mockOs.totalmem.mockReturnValue(16 * 1024 * 1024 * 1024); // 16GB
    mockOs.freemem.mockReturnValue(8 * 1024 * 1024 * 1024);   // 8GB
    mockOs.loadavg.mockReturnValue([1.5, 1.2, 0.9]);
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    processExitSpy.mockRestore();
  });

  describe('Clear Cache Command', () => {
    it('should clear all caches successfully when caches have data', async () => {
      const result = await cli.run(['node', 'datapilot', 'clear-cache']);

      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
      expect(result.data.totalCleared).toBe(8); // 5 + 3 entries
      expect(result.data.details).toHaveLength(2);
      expect(result.metadata.command).toBe('clear-cache');
      expect(result.metadata.entriesCleared).toBe(8);

      expect(mockSectionCacheManager.clearAll).toHaveBeenCalled();
      expect(mockResultCache.clear).toHaveBeenCalled();
      expect(mockResultCache.dispose).toHaveBeenCalled();
    });

    it('should handle empty caches gracefully', async () => {
      // Mock empty caches
      mockSectionCacheManager.getStats.mockResolvedValueOnce({
        totalEntries: 0,
        totalSizeBytes: 0,
        hitRate: 0
      });
      mockResultCache.getStats.mockReturnValueOnce({
        totalEntries: 0,
        totalSizeBytes: 0,
        hitCount: 0,
        missCount: 0
      });

      const result = await cli.run(['node', 'datapilot', 'clear-cache']);

      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
      expect(result.data.totalCleared).toBe(0);
      expect(result.data.details).toContain('No cache entries found to clear');
    });

    it('should show output in non-quiet mode', async () => {
      const result = await cli.run(['node', 'datapilot', 'clear-cache']);

      expect(result.success).toBe(true);
      expect(consoleLogSpy).toHaveBeenCalledWith('✅ Cache clearing completed');
      expect(consoleLogSpy).toHaveBeenCalledWith('📊 Summary:');
      expect(consoleLogSpy).toHaveBeenCalledWith('🗑️  Total entries cleared: 8');
    });

    it('should suppress output in quiet mode', async () => {
      const result = await cli.run(['node', 'datapilot', 'clear-cache', '--quiet']);

      expect(result.success).toBe(true);
      expect(consoleLogSpy).not.toHaveBeenCalledWith('✅ Cache clearing completed');
    });

    it('should handle cache clearing errors gracefully', async () => {
      mockSectionCacheManager.clearAll.mockRejectedValueOnce(new Error('Permission denied'));

      const result = await cli.run(['node', 'datapilot', 'clear-cache']);

      expect(result.success).toBe(false);
      expect(result.exitCode).toBe(1);
      expect(result.error).toContain('Failed to clear cache: Permission denied');
      expect(result.suggestions).toContain('Check if cache directories are accessible');
    });

    it('should handle module import errors', async () => {
      // Mock import failure
      const originalImport = require('@/performance/section-cache-manager');
      jest.doMock('@/performance/section-cache-manager', () => {
        throw new Error('Module not found');
      });

      const result = await cli.run(['node', 'datapilot', 'clear-cache']);

      expect(result.success).toBe(false);
      expect(result.exitCode).toBe(1);
      expect(result.error).toContain('Failed to clear cache');
    });
  });

  describe('Performance Dashboard Command', () => {
    it('should show performance dashboard with system info', async () => {
      const result = await cli.run(['node', 'datapilot', 'perf']);

      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
      expect(result.data.systemInfo).toBeDefined();
      expect(result.data.systemInfo.platform).toBe('linux');
      expect(result.data.systemInfo.arch).toBe('x64');
      expect(result.data.systemInfo.cpuCount).toBe(8);
      expect(result.data.systemInfo.totalMemoryGB).toBe(16);
      expect(result.data.systemInfo.freeMemoryGB).toBe(8);
      expect(result.metadata.command).toBe('perf');

      expect(consoleLogSpy).toHaveBeenCalledWith('📊 DataPilot Performance Dashboard');
      expect(consoleLogSpy).toHaveBeenCalledWith('🖥️  System Information:');
      expect(consoleLogSpy).toHaveBeenCalledWith('   Platform: linux/x64');
    });

    it('should show cache statistics when requested', async () => {
      const result = await cli.run(['node', 'datapilot', 'perf', '--cache-stats']);

      expect(result.success).toBe(true);
      expect(result.data.cacheStats).toBeDefined();
      expect(result.data.cacheStats.sectionCache.totalEntries).toBe(5);
      expect(result.data.cacheStats.resultCache.totalEntries).toBe(3);

      expect(consoleLogSpy).toHaveBeenCalledWith('💾 Cache Statistics:');
      expect(consoleLogSpy).toHaveBeenCalledWith('   Section Cache Entries: 5');
      expect(consoleLogSpy).toHaveBeenCalledWith('   Result Cache Entries: 3');
    });

    it('should suppress output in quiet mode', async () => {
      const result = await cli.run(['node', 'datapilot', 'perf', '--quiet']);

      expect(result.success).toBe(true);
      expect(consoleLogSpy).not.toHaveBeenCalledWith('📊 DataPilot Performance Dashboard');
    });

    it('should handle errors in system info gathering', async () => {
      mockOs.platform.mockImplementation(() => {
        throw new Error('OS error');
      });

      const result = await cli.run(['node', 'datapilot', 'perf']);

      expect(result.success).toBe(false);
      expect(result.exitCode).toBe(1);
      expect(result.error).toContain('Failed to show performance dashboard');
    });

    it('should handle cache stats errors gracefully', async () => {
      mockSectionCacheManager.getStats.mockRejectedValueOnce(new Error('Cache error'));

      const result = await cli.run(['node', 'datapilot', 'perf', '--cache-stats']);

      expect(result.success).toBe(true); // Should still succeed
      expect(result.data.cacheStats).toBeDefined();
    });

    it('should show available commands', async () => {
      const result = await cli.run(['node', 'datapilot', 'perf']);

      expect(result.success).toBe(true);
      expect(consoleLogSpy).toHaveBeenCalledWith('🔧 Available Commands:');
      expect(consoleLogSpy).toHaveBeenCalledWith('   datapilot clear-cache    Clear all cached analysis results');
    });
  });

  describe('Validate Command', () => {
    let analyzer: UniversalAnalyzer;

    beforeEach(() => {
      analyzer = new UniversalAnalyzer();
      // Mock the analyzer in the CLI
      (cli as any).analyzer = analyzer;
    });

    it('should validate a valid CSV file successfully', async () => {
      // Mock successful validation
      const mockValidateCSVFile = jest.spyOn(analyzer, 'validateCSVFile').mockResolvedValue({
        success: true,
        exitCode: 0,
        data: {
          validation: {
            isValid: true,
            format: 'csv',
            confidence: 0.95,
            fileSize: 1000000,
            fileSizeMB: 0.95,
            estimatedRows: 1000,
            columns: 5,
            hasHeader: true,
            detectedDelimiter: ',',
            detectedEncoding: 'utf8',
            warnings: []
          }
        },
        metadata: {
          command: 'validate',
          filePath: 'test.csv',
          timestamp: new Date().toISOString(),
          validationTime: Date.now()
        }
      });

      const result = await cli.run(['node', 'datapilot', 'validate', 'test.csv']);

      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
      expect(result.data.validation.isValid).toBe(true);
      expect(result.data.validation.format).toBe('csv');
      expect(result.data.validation.confidence).toBe(0.95);
      expect(mockValidateCSVFile).toHaveBeenCalledWith('test.csv', expect.objectContaining({
        command: 'validate'
      }));
    });

    it('should handle invalid CSV file', async () => {
      const mockValidateCSVFile = jest.spyOn(analyzer, 'validateCSVFile').mockResolvedValue({
        success: false,
        exitCode: 1,
        error: 'CSV format validation failed: Invalid delimiter usage',
        suggestions: [
          'Check CSV formatting and structure',
          'Ensure proper delimiter usage'
        ]
      });

      const result = await cli.run(['node', 'datapilot', 'validate', 'invalid.csv']);

      expect(result.success).toBe(false);
      expect(result.exitCode).toBe(1);
      expect(result.error).toContain('CSV format validation failed');
      expect(result.suggestions).toContain('Check CSV formatting and structure');
      expect(mockValidateCSVFile).toHaveBeenCalledWith('invalid.csv', expect.any(Object));
    });

    it('should handle file not found error', async () => {
      const mockValidateCSVFile = jest.spyOn(analyzer, 'validateCSVFile').mockResolvedValue({
        success: false,
        exitCode: 1,
        error: 'File not found: nonexistent.csv',
        suggestions: [
          'Check the file path is correct',
          'Ensure the file exists and is accessible'
        ]
      });

      const result = await cli.run(['node', 'datapilot', 'validate', 'nonexistent.csv']);

      expect(result.success).toBe(false);
      expect(result.exitCode).toBe(1);
      expect(result.error).toBe('File not found: nonexistent.csv');
    });

    it('should pass through delimiter option', async () => {
      const mockValidateCSVFile = jest.spyOn(analyzer, 'validateCSVFile').mockResolvedValue({
        success: true,
        exitCode: 0,
        data: { validation: { isValid: true } }
      });

      await cli.run(['node', 'datapilot', 'validate', 'test.csv', '--delimiter', ';']);

      expect(mockValidateCSVFile).toHaveBeenCalledWith('test.csv', expect.objectContaining({
        delimiter: ';'
      }));
    });

    it('should handle low confidence detection', async () => {
      const mockValidateCSVFile = jest.spyOn(analyzer, 'validateCSVFile').mockResolvedValue({
        success: false,
        exitCode: 1,
        error: 'Low confidence in file format detection (45.0%)',
        suggestions: [
          'Detected format: csv',
          'Try specifying format options manually',
          '--delimiter "," --encoding utf8'
        ]
      });

      const result = await cli.run(['node', 'datapilot', 'validate', 'ambiguous.csv']);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Low confidence in file format detection');
      expect(result.suggestions).toContain('Try specifying format options manually');
    });
  });

  describe('Info Command', () => {
    let analyzer: UniversalAnalyzer;

    beforeEach(() => {
      analyzer = new UniversalAnalyzer();
      (cli as any).analyzer = analyzer;
    });

    it('should show file information successfully', async () => {
      const mockGetFileInfo = jest.spyOn(analyzer, 'getFileInfo').mockResolvedValue({
        success: true,
        exitCode: 0,
        data: {
          fileInfo: {
            filePath: '/path/to/test.csv',
            fileName: 'test.csv',
            fileSize: 1000000,
            fileSizeMB: 0.95,
            lastModified: new Date('2024-01-15T10:30:00Z'),
            format: 'csv',
            formatConfidence: 0.98,
            estimatedRows: 2000,
            columns: 8,
            hasHeader: true,
            delimiter: ',',
            encoding: 'utf8',
            preview: [
              ['id', 'name', 'age', 'city'],
              ['1', 'John Doe', '30', 'New York'],
              ['2', 'Jane Smith', '25', 'Los Angeles']
            ]
          }
        },
        metadata: {
          command: 'info',
          filePath: 'test.csv',
          timestamp: new Date().toISOString()
        }
      });

      const result = await cli.run(['node', 'datapilot', 'info', 'test.csv']);

      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
      expect(result.data.fileInfo.fileName).toBe('test.csv');
      expect(result.data.fileInfo.format).toBe('csv');
      expect(result.data.fileInfo.formatConfidence).toBe(0.98);
      expect(result.data.fileInfo.estimatedRows).toBe(2000);
      expect(result.data.fileInfo.columns).toBe(8);
      expect(result.data.fileInfo.preview).toHaveLength(3);
      expect(mockGetFileInfo).toHaveBeenCalledWith('test.csv', expect.objectContaining({
        command: 'info'
      }));
    });

    it('should handle file not found error', async () => {
      const mockGetFileInfo = jest.spyOn(analyzer, 'getFileInfo').mockResolvedValue({
        success: false,
        exitCode: 1,
        error: 'File not found: missing.csv',
        suggestions: ['Check the file path is correct']
      });

      const result = await cli.run(['node', 'datapilot', 'info', 'missing.csv']);

      expect(result.success).toBe(false);
      expect(result.exitCode).toBe(1);
      expect(result.error).toBe('File not found: missing.csv');
    });

    it('should handle directory instead of file', async () => {
      const mockGetFileInfo = jest.spyOn(analyzer, 'getFileInfo').mockResolvedValue({
        success: false,
        exitCode: 1,
        error: 'Path is not a file: /some/directory',
        suggestions: ['Provide a path to a file, not a directory']
      });

      const result = await cli.run(['node', 'datapilot', 'info', '/some/directory']);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Path is not a file');
    });

    it('should show file info with unknown format', async () => {
      const mockGetFileInfo = jest.spyOn(analyzer, 'getFileInfo').mockResolvedValue({
        success: true,
        exitCode: 0,
        data: {
          fileInfo: {
            filePath: '/path/to/data.txt',
            fileName: 'data.txt',
            fileSize: 500000,
            fileSizeMB: 0.48,
            lastModified: new Date('2024-01-10T15:20:00Z'),
            format: 'unknown',
            formatConfidence: 0.1,
            estimatedRows: 0,
            columns: 0,
            hasHeader: false,
            delimiter: ',',
            encoding: 'utf8',
            preview: []
          }
        }
      });

      const result = await cli.run(['node', 'datapilot', 'info', 'data.txt']);

      expect(result.success).toBe(true);
      expect(result.data.fileInfo.format).toBe('unknown');
      expect(result.data.fileInfo.formatConfidence).toBe(0.1);
      expect(result.data.fileInfo.preview).toHaveLength(0);
    });
  });

  describe('Command Integration', () => {
    it('should handle missing file argument gracefully', async () => {
      const result = await cli.run(['node', 'datapilot', 'validate']);

      expect(result.success).toBe(false);
      expect(result.exitCode).toBe(1);
      expect(result.data?.error || result.error).toContain('No input files specified');
    });

    it('should handle unknown no-file command', async () => {
      // Mock unknown command by bypassing argument parser validation
      const result = await (cli as any).handleNoFileCommand('unknown-cmd', {});

      expect(result.success).toBe(false);
      expect(result.exitCode).toBe(1);
      expect(result.error).toBe('Unknown no-file command: unknown-cmd');
      expect(result.suggestions).toContain('Use --help to see available commands');
    });

    it('should handle CLI execution errors gracefully', async () => {
      // Mock error in run method
      const originalAnalyzer = (cli as any).analyzer;
      (cli as any).analyzer = null; // This will cause an error

      const result = await cli.run(['node', 'datapilot', 'validate', 'test.csv']);

      expect(result.success).toBe(false);
      expect(result.exitCode).toBe(1);
      expect(result.data.error).toBeDefined();

      // Restore analyzer
      (cli as any).analyzer = originalAnalyzer;
    });
  });

  describe('Exit Codes', () => {
    it('should return exit code 0 for successful clear-cache', async () => {
      const result = await cli.run(['node', 'datapilot', 'clear-cache']);
      expect(result.exitCode).toBe(0);
    });

    it('should return exit code 0 for successful perf command', async () => {
      const result = await cli.run(['node', 'datapilot', 'perf']);
      expect(result.exitCode).toBe(0);
    });

    it('should return exit code 1 for validation failure', async () => {
      jest.spyOn(UniversalAnalyzer.prototype, 'validateCSVFile').mockResolvedValue({
        success: false,
        exitCode: 1,
        error: 'Validation failed'
      });

      const result = await cli.run(['node', 'datapilot', 'validate', 'bad.csv']);
      expect(result.exitCode).toBe(1);
    });

    it('should return exit code 1 for cache clearing failure', async () => {
      mockSectionCacheManager.clearAll.mockRejectedValueOnce(new Error('Cache error'));

      const result = await cli.run(['node', 'datapilot', 'clear-cache']);
      expect(result.exitCode).toBe(1);
    });
  });
});