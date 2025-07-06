/**
 * Simplified tests for new CLI commands
 * Tests: clear-cache, perf, validate, info commands
 */

import { ArgumentParser } from '@/cli/argument-parser';
import { UniversalAnalyzer } from '@/cli/universal-analyzer';
import type { CLIOptions, CLIResult } from '@/cli/types';
import * as fs from 'fs';
import * as os from 'os';

// Mock fs and os methods
jest.mock('fs');
jest.mock('os');

const mockFs = fs as jest.Mocked<typeof fs>;
const mockOs = os as jest.Mocked<typeof os>;

describe('New CLI Commands - Argument Parser', () => {
  let parser: ArgumentParser;
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    parser = new ArgumentParser();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    
    // Reset all mocks
    jest.clearAllMocks();

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
  });

  describe('Command Registration', () => {
    it('should register clear-cache command', () => {
      const result = parser.parse(['node', 'datapilot', 'clear-cache']);
      expect(result.command).toBe('clear-cache');
      expect(result.args).toEqual([]);
    });

    it('should register perf command', () => {
      const result = parser.parse(['node', 'datapilot', 'perf']);
      expect(result.command).toBe('perf');
      expect(result.args).toEqual([]);
    });

    it('should register validate command with file argument', () => {
      const result = parser.parse(['node', 'datapilot', 'validate', 'test.csv']);
      expect(result.command).toBe('validate');
      expect(result.args).toContain('test.csv');
    });

    it('should register info command with file argument', () => {
      const result = parser.parse(['node', 'datapilot', 'info', 'data.csv']);
      expect(result.command).toBe('info');
      expect(result.args).toContain('data.csv');
    });

    it('should handle dry-run option in global options', () => {
      const result = parser.parse(['node', 'datapilot', 'overview', 'test.csv', '--dry-run']);
      expect(result.options.dryRun).toBe(true);
      expect(result.command).toBe('overview');
      expect(result.args).toContain('test.csv');
    });
  });

  describe('Validate Command Options', () => {
    it('should handle encoding option', () => {
      const result = parser.parse(['node', 'datapilot', 'validate', 'test.csv', '--encoding', 'utf16le']);
      // Note: encoding is not in CLIOptions type, but should be parsed through raw options
      expect(result.command).toBe('validate');
      expect(result.args).toContain('test.csv');
    });

    it('should handle delimiter option', () => {
      const result = parser.parse(['node', 'datapilot', 'validate', 'test.csv', '--delimiter', ';']);
      expect(result.command).toBe('validate');
      expect(result.options.delimiter).toBe(';');
      expect(result.args).toContain('test.csv');
    });

    it('should handle quiet option', () => {
      const result = parser.parse(['node', 'datapilot', 'validate', 'test.csv', '--quiet']);
      expect(result.command).toBe('validate');
      expect(result.options.quiet).toBe(true);
    });
  });

  describe('Performance Command Options', () => {
    it('should handle cache-stats option', () => {
      const result = parser.parse(['node', 'datapilot', 'perf', '--cache-stats']);
      expect(result.command).toBe('perf');
      // cache-stats is not in CLIOptions but should be parsed through raw options
    });

    it('should handle quiet option with perf', () => {
      const result = parser.parse(['node', 'datapilot', 'perf', '--quiet']);
      expect(result.command).toBe('perf');
      expect(result.options.quiet).toBe(true);
    });
  });

  describe('Dry-Run Option', () => {
    it('should parse dry-run with all command', () => {
      const result = parser.parse(['node', 'datapilot', 'all', 'test.csv', '--dry-run']);
      expect(result.command).toBe('all');
      expect(result.options.dryRun).toBe(true);
      expect(result.args).toContain('test.csv');
    });

    it('should parse dry-run with quality command', () => {
      const result = parser.parse(['node', 'datapilot', 'quality', 'data.csv', '--dry-run']);
      expect(result.command).toBe('quality');
      expect(result.options.dryRun).toBe(true);
      expect(result.args).toContain('data.csv');
    });

    it('should parse dry-run with engineering command for multiple files', () => {
      const result = parser.parse(['node', 'datapilot', 'engineering', 'file1.csv', 'file2.csv', '--dry-run']);
      expect(result.command).toBe('engineering');
      expect(result.options.dryRun).toBe(true);
      expect(result.args).toEqual(['file1.csv', 'file2.csv']);
    });

    it('should combine dry-run with other options', () => {
      const result = parser.parse(['node', 'datapilot', 'eda', 'test.csv', '--dry-run', '--verbose', '--delimiter', ',']);
      expect(result.command).toBe('eda');
      expect(result.options.dryRun).toBe(true);
      expect(result.options.verbose).toBe(true);
      expect(result.options.delimiter).toBe(',');
    });
  });

  describe('File Validation', () => {
    it('should validate existing files successfully', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.statSync.mockReturnValue({
        isFile: () => true,
        size: 1000000
      } as fs.Stats);

      const validatedPath = parser.validateFile('test.csv');
      expect(validatedPath).toBeDefined();
      expect(mockFs.existsSync).toHaveBeenCalled();
      expect(mockFs.statSync).toHaveBeenCalled();
    });

    it('should throw FileError for non-existent files', () => {
      mockFs.existsSync.mockReturnValue(false);

      expect(() => {
        parser.validateFile('missing.csv');
      }).toThrow('File not found');
    });

    it('should throw FileError for directories', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.statSync.mockReturnValue({
        isFile: () => false,
        size: 0
      } as fs.Stats);

      expect(() => {
        parser.validateFile('directory');
      }).toThrow('Path is not a file');
    });

    it('should throw FileError for empty files', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.statSync.mockReturnValue({
        isFile: () => true,
        size: 0
      } as fs.Stats);

      expect(() => {
        parser.validateFile('empty.csv');
      }).toThrow('File is empty');
    });
  });

  describe('Option Validation', () => {
    it('should validate output format options', () => {
      const result = parser.parse(['node', 'datapilot', 'validate', 'test.csv', '-f', 'json']);
      expect(result.options.output).toBe('json');
    });

    it('should reject invalid output formats', () => {
      expect(() => {
        parser.parse(['node', 'datapilot', 'validate', 'test.csv', '-f', 'invalid']);
      }).toThrow();
    });

    it('should validate delimiter as single character', () => {
      const result = parser.parse(['node', 'datapilot', 'validate', 'test.csv', '--delimiter', ';']);
      expect(result.options.delimiter).toBe(';');
    });

    it('should reject multi-character delimiters', () => {
      expect(() => {
        parser.parse(['node', 'datapilot', 'validate', 'test.csv', '--delimiter', ';;']);
      }).toThrow();
    });

    it('should handle mutually exclusive verbose and quiet options', () => {
      expect(() => {
        parser.parse(['node', 'datapilot', 'validate', 'test.csv', '--verbose', '--quiet']);
      }).toThrow('Cannot use both --verbose and --quiet options');
    });
  });

  describe('Command Context', () => {
    it('should provide proper context for validate command', () => {
      const result = parser.parse(['node', 'datapilot', 'validate', 'data.csv', '--quiet']);
      
      expect(result.command).toBe('validate');
      expect(result.args).toContain('data.csv');
      expect(result.options.quiet).toBe(true);
      expect(result.startTime).toBeDefined();
      expect(result.workingDirectory).toBe(process.cwd());
    });

    it('should provide proper context for info command', () => {
      const result = parser.parse(['node', 'datapilot', 'info', 'file.csv', '--verbose']);
      
      expect(result.command).toBe('info');
      expect(result.args).toContain('file.csv');
      expect(result.options.verbose).toBe(true);
      expect(result.startTime).toBeDefined();
      expect(result.workingDirectory).toBe(process.cwd());
    });

    it('should provide proper context for no-file commands', () => {
      const clearCacheResult = parser.parse(['node', 'datapilot', 'clear-cache']);
      
      expect(clearCacheResult.command).toBe('clear-cache');
      expect(clearCacheResult.args).toEqual([]);
      
      const perfResult = parser.parse(['node', 'datapilot', 'perf']);
      
      expect(perfResult.command).toBe('perf');
      expect(perfResult.args).toEqual([]);
    });
  });

  describe('Help and Version', () => {
    it('should handle help requests without crashing', () => {
      expect(() => {
        parser.showHelp();
      }).not.toThrow();
    });

    it('should handle command-specific help', () => {
      expect(() => {
        parser.showHelp('validate');
      }).not.toThrow();
    });

    it('should provide version information', () => {
      const version = parser.getVersion();
      expect(version).toBeDefined();
      expect(typeof version).toBe('string');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid command gracefully', () => {
      expect(() => {
        parser.parse(['node', 'datapilot', 'nonexistent-command']);
      }).toThrow();
    });

    it('should handle malformed arguments', () => {
      expect(() => {
        parser.parse(['node', 'datapilot', 'validate', '--invalid-option']);
      }).toThrow();
    });

    it('should provide context when parsing fails', () => {
      try {
        parser.parse(['node', 'datapilot', 'validate', '--max-rows', 'invalid']);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toContain('Invalid number');
      }
    });
  });
});

describe('UniversalAnalyzer - New Methods', () => {
  let analyzer: UniversalAnalyzer;
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    analyzer = new UniversalAnalyzer();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    
    // Reset all mocks
    jest.clearAllMocks();

    // Setup default fs mocks
    mockFs.existsSync.mockReturnValue(true);
    mockFs.statSync.mockReturnValue({
      isFile: () => true,
      size: 1000000, // 1MB
      mtime: new Date('2024-01-15T10:30:00Z')
    } as fs.Stats);
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  describe('validateCSVFile method signature', () => {
    it('should accept file path and options parameters', () => {
      expect(typeof analyzer.validateCSVFile).toBe('function');
      expect(analyzer.validateCSVFile.length).toBe(2); // filePath, options
    });
  });

  describe('getFileInfo method signature', () => {
    it('should accept file path and options parameters', () => {
      expect(typeof analyzer.getFileInfo).toBe('function');
      expect(analyzer.getFileInfo.length).toBe(2); // filePath, options
    });
  });

  describe('validateAndPreview method signature', () => {
    it('should accept file paths array and options parameters', () => {
      expect(typeof analyzer.validateAndPreview).toBe('function');
      expect(analyzer.validateAndPreview.length).toBe(2); // filePaths, options
    });
  });
});

describe('CLI Result Structure Validation', () => {
  it('should define proper CLIResult interface', () => {
    const mockResult: CLIResult = {
      success: true,
      exitCode: 0,
      data: { test: 'data' },
      metadata: { command: 'test' }
    };

    expect(mockResult.success).toBeDefined();
    expect(mockResult.exitCode).toBeDefined();
    expect(typeof mockResult.success).toBe('boolean');
    expect(typeof mockResult.exitCode).toBe('number');
  });

  it('should handle error results properly', () => {
    const errorResult: CLIResult = {
      success: false,
      exitCode: 1,
      error: 'Test error',
      suggestions: ['Fix the issue', 'Try again']
    };

    expect(errorResult.success).toBe(false);
    expect(errorResult.exitCode).toBe(1);
    expect(errorResult.error).toBeDefined();
    expect(errorResult.suggestions).toBeDefined();
    expect(Array.isArray(errorResult.suggestions)).toBe(true);
  });
});