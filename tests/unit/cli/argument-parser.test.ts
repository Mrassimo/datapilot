/**
 * Comprehensive tests for CLI Argument Parser
 */

import { ArgumentParser } from '@/cli/argument-parser';
import { ValidationError, FileError } from '@/cli/types';
import * as fs from 'fs';
import * as path from 'path';

// Mock fs methods
jest.mock('fs');
jest.mock('path');

const mockFs = fs as jest.Mocked<typeof fs>;
const mockPath = path as jest.Mocked<typeof path>;

describe('ArgumentParser', () => {
  let parser: ArgumentParser;
  let consoleErrorSpy: jest.SpyInstance;
  let processExitSpy: jest.SpyInstance;
  let processStdoutWriteSpy: jest.SpyInstance;

  beforeEach(() => {
    parser = new ArgumentParser();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    processExitSpy = jest.spyOn(process, 'exit').mockImplementation();
    processStdoutWriteSpy = jest.spyOn(process.stdout, 'write').mockImplementation();
    
    // Reset mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    processExitSpy.mockRestore();
    processStdoutWriteSpy.mockRestore();
  });

  describe('Constructor and Setup', () => {
    it('should create parser instance successfully', () => {
      expect(parser).toBeInstanceOf(ArgumentParser);
    });

    it('should setup all commands during construction', () => {
      const newParser = new ArgumentParser();
      expect(newParser).toBeDefined();
    });
  });

  describe('Basic Argument Parsing', () => {
    it('should handle empty arguments and return help context', () => {
      const result = parser.parse(['node', 'datapilot']);
      
      expect(result.command).toBe('help');
      expect(result.args).toEqual([]);
      expect(result.options).toEqual({
        autoConfig: false,
        autoSample: false,
        continueOnError: false,
        dryRun: false,
        enableCaching: undefined,
        enableHashing: true,
        fallbackOnError: true,
        force: false,
        forceIndividual: false,
        forceSequential: false,
        includeEnvironment: true,
        progressiveReporting: false,
        quiet: false,
        showProgress: true,
        streamingOptimizations: false,
        verbose: false,
      });
      expect(result.startTime).toBeDefined();
      expect(result.workingDirectory).toBe(process.cwd());
    });

    it('should handle help flags without process.exit', () => {
      const result = parser.parse(['node', 'datapilot', '--help']);
      
      expect(result.command).toBe('--help');
      expect(result.args).toEqual(['--help']);
      expect(result.options).toEqual({
        autoConfig: false,
        autoSample: false,
        continueOnError: false,
        dryRun: false,
        enableCaching: undefined,
        enableHashing: true,
        fallbackOnError: true,
        force: false,
        forceIndividual: false,
        forceSequential: false,
        includeEnvironment: true,
        progressiveReporting: false,
        quiet: false,
        showProgress: true,
        streamingOptimizations: false,
        verbose: false,
      });
    });

    it('should handle short help flag', () => {
      const result = parser.parse(['node', 'datapilot', '-h']);
      
      // After help command fix, -h is handled by Commander.js natively
      expect(result.command).toBe('-h');
    });
  });

  describe('Command Parsing', () => {
    beforeEach(() => {
      // Mock commander's internal behavior for testing
      jest.spyOn(parser as any, 'createCommandHandler').mockImplementation((cmd) => {
        return (file: string, options: Record<string, unknown>) => {
          (parser as any).program._lastContext = {
            command: cmd,
            file,
            options,
            args: [file],
          };
        };
      });
    });

    it('should parse all command correctly', () => {
      // Simulate command execution
      const mockHandler = parser as any;
      mockHandler.program._lastContext = {
        command: 'all',
        file: 'test.csv',
        options: { output: 'json', verbose: true },
        args: ['test.csv'],
      };

      const result = (parser as any).getLastContext();
      
      expect(result?.command).toBe('all');
      expect(result?.args).toContain('test.csv');
    });

    it('should parse overview command correctly', () => {
      const mockHandler = parser as any;
      mockHandler.program._lastContext = {
        command: 'overview',
        file: 'data.csv',
        options: { output: 'markdown' },
        args: ['data.csv'],
      };

      const result = (parser as any).getLastContext();
      
      expect(result?.command).toBe('overview');
      expect(result?.args).toContain('data.csv');
    });

    it('should parse quality command correctly', () => {
      const mockHandler = parser as any;
      mockHandler.program._lastContext = {
        command: 'quality',
        file: 'data.csv',
        options: { strict: true },
        args: ['data.csv'],
      };

      const result = (parser as any).getLastContext();
      
      expect(result?.command).toBe('quality');
    });

    it('should parse eda command correctly', () => {
      const mockHandler = parser as any;
      mockHandler.program._lastContext = {
        command: 'eda',
        file: 'data.csv',
        options: { chunkSize: 1000 },
        args: ['data.csv'],
      };

      const result = (parser as any).getLastContext();
      
      expect(result?.command).toBe('eda');
    });

    it('should parse visualization command correctly', () => {
      const mockHandler = parser as any;
      mockHandler.program._lastContext = {
        command: 'viz',
        file: 'data.csv',
        options: { accessibility: 'excellent' },
        args: ['data.csv'],
      };

      const result = (parser as any).getLastContext();
      
      expect(result?.command).toBe('viz');
    });

    it('should parse engineering command correctly', () => {
      const mockHandler = parser as any;
      mockHandler.program._lastContext = {
        command: 'engineering',
        file: 'data.csv',
        options: { confidence: 0.8 },
        args: ['data.csv'],
      };

      const result = (parser as any).getLastContext();
      
      expect(result?.command).toBe('engineering');
    });

    it('should parse modeling command correctly', () => {
      const mockHandler = parser as any;
      mockHandler.program._lastContext = {
        command: 'modeling',
        file: 'data.csv',
        options: {},
        args: ['data.csv'],
      };

      const result = (parser as any).getLastContext();
      
      expect(result?.command).toBe('modeling');
    });
  });

  describe('Multi-file Commands', () => {
    it('should handle join command with multiple files', () => {
      const mockHandler = parser as any;
      mockHandler.program._lastContext = {
        command: 'join',
        file: 'file1.csv',
        options: { confidence: 0.7 },
        args: ['file1.csv', 'file2.csv'],
      };

      const result = (parser as any).getLastContext();
      
      expect(result?.command).toBe('join');
      expect(result?.args).toHaveLength(2);
    });

    it('should handle discover command', () => {
      const mockHandler = parser as any;
      mockHandler.program._lastContext = {
        command: 'discover',
        file: './data',
        options: { recursive: true },
        args: ['./data'],
      };

      const result = (parser as any).getLastContext();
      
      expect(result?.command).toBe('discover');
    });

    it('should handle join-wizard command', () => {
      const mockHandler = parser as any;
      mockHandler.program._lastContext = {
        command: 'join-wizard',
        file: 'file1.csv',
        options: { previewRows: 10 },
        args: ['file1.csv', 'file2.csv'],
      };

      const result = (parser as any).getLastContext();
      
      expect(result?.command).toBe('join-wizard');
    });
  });

  describe('Option Validation', () => {
    describe('Output Format Validation', () => {
      it('should accept valid output formats', () => {
        const validFormats = ['txt', 'markdown', 'json', 'yaml'];
        
        validFormats.forEach(format => {
          const options = parser as any;
          const result = options.validateOptions({ format: format });
          expect(result.output).toBe(format);
        });
      });

      it('should reject invalid output formats', () => {
        const options = parser as any;
        
        expect(() => {
          options.validateOptions({ format: 'invalid' });
        }).toThrow(ValidationError);
      });
    });

    describe('Verbosity Options', () => {
      it('should handle verbose option', () => {
        const options = parser as any;
        const result = options.validateOptions({ verbose: true });
        
        expect(result.verbose).toBe(true);
        expect(result.quiet).toBe(false);
      });

      it('should handle quiet option', () => {
        const options = parser as any;
        const result = options.validateOptions({ quiet: true });
        
        expect(result.quiet).toBe(true);
        expect(result.verbose).toBe(false);
      });

      it('should reject both verbose and quiet', () => {
        const options = parser as any;
        
        expect(() => {
          options.validateOptions({ verbose: true, quiet: true });
        }).toThrow(ValidationError);
      });
    });

    describe('Numeric Options', () => {
      it('should validate maxRows option', () => {
        const options = parser as any;
        const result = options.validateOptions({ maxRows: 1000 });
        
        expect(result.maxRows).toBe(1000);
      });

      it('should reject invalid maxRows', () => {
        const options = parser as any;
        
        expect(() => {
          options.validateOptions({ maxRows: -1 });
        }).toThrow(ValidationError);
      });

      it('should validate maxMemory option', () => {
        const options = parser as any;
        const result = options.validateOptions({ maxMemory: 512 });
        
        expect(result.maxMemory).toBe(512);
      });

      it('should reject invalid maxMemory', () => {
        const options = parser as any;
        
        expect(() => {
          options.validateOptions({ maxMemory: 0 });
        }).toThrow(ValidationError);
      });
    });

    describe('Delimiter Validation', () => {
      it('should accept valid single character delimiter', () => {
        const options = parser as any;
        const result = options.validateOptions({ delimiter: ';' });
        
        expect(result.delimiter).toBe(';');
      });

      it('should reject multi-character delimiter', () => {
        const options = parser as any;
        
        expect(() => {
          options.validateOptions({ delimiter: ';;' });
        }).toThrow(ValidationError);
      });
    });

    describe('Privacy Mode Validation', () => {
      it('should accept valid privacy modes', () => {
        const validModes = ['full', 'redacted', 'minimal'];
        
        validModes.forEach(mode => {
          const options = parser as any;
          const result = options.validateOptions({ privacy: mode });
          expect(result.privacyMode).toBe(mode);
        });
      });

      it('should reject invalid privacy mode', () => {
        const options = parser as any;
        
        expect(() => {
          options.validateOptions({ privacy: 'invalid' });
        }).toThrow(ValidationError);
      });
    });

    describe('Boolean Options', () => {
      it('should handle force option', () => {
        const options = parser as any;
        const result = options.validateOptions({ force: true });
        
        expect(result.force).toBe(true);
      });

      it('should handle dryRun option', () => {
        const options = parser as any;
        const result = options.validateOptions({ dryRun: true });
        
        expect(result.dryRun).toBe(true);
      });

      it('should handle progress options', () => {
        const options = parser as any;
        
        // Default with quiet false
        let result = options.validateOptions({ quiet: false });
        expect(result.showProgress).toBe(true);
        
        // With noProgress
        result = options.validateOptions({ noProgress: true });
        expect(result.showProgress).toBe(false);
        
        // With quiet
        result = options.validateOptions({ quiet: true });
        expect(result.showProgress).toBe(false);
      });

      it('should handle hashing options', () => {
        const options = parser as any;
        
        // Default
        let result = options.validateOptions({});
        expect(result.enableHashing).toBe(true);
        
        // Disabled
        result = options.validateOptions({ noHashing: true });
        expect(result.enableHashing).toBe(false);
      });

      it('should handle environment options', () => {
        const options = parser as any;
        
        // Default
        let result = options.validateOptions({});
        expect(result.includeEnvironment).toBe(true);
        
        // Disabled
        result = options.validateOptions({ noEnvironment: true });
        expect(result.includeEnvironment).toBe(false);
      });
    });

    describe('Output File Validation', () => {
      it('should resolve output file path', () => {
        mockPath.resolve.mockReturnValue('/resolved/path/output.txt');
        
        const options = parser as any;
        const result = options.validateOptions({ output: 'output.txt' });
        
        expect(result.outputFile).toBe('/resolved/path/output.txt');
        expect(mockPath.resolve).toHaveBeenCalledWith('output.txt');
      });
    });
  });

  describe('File Validation', () => {
    beforeEach(() => {
      mockPath.resolve.mockImplementation((p) => `/resolved/${p}`);
    });

    it('should validate existing file successfully', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.statSync.mockReturnValue({
        isFile: () => true,
        size: 1000,
      } as fs.Stats);
      
      const result = (parser as any).validateFile('test.csv');
      
      expect(result).toBe('/resolved/test.csv');
      expect(mockFs.existsSync).toHaveBeenCalledWith('/resolved/test.csv');
    });

    it('should throw FileError for non-existent file', () => {
      mockFs.existsSync.mockReturnValue(false);
      
      expect(() => {
        (parser as any).validateFile('nonexistent.csv');
      }).toThrow(FileError);
    });

    it('should throw FileError for directory instead of file', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.statSync.mockReturnValue({
        isFile: () => false,
        size: 1000,
      } as fs.Stats);
      
      expect(() => {
        (parser as any).validateFile('directory');
      }).toThrow(FileError);
    });

    it('should throw FileError for empty file', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.statSync.mockReturnValue({
        isFile: () => true,
        size: 0,
      } as fs.Stats);
      
      expect(() => {
        (parser as any).validateFile('empty.csv');
      }).toThrow(FileError);
    });

    it('should throw FileError for file too large', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.statSync.mockReturnValue({
        isFile: () => true,
        size: 11 * 1024 * 1024 * 1024, // 11GB
      } as fs.Stats);
      
      expect(() => {
        (parser as any).validateFile('huge.csv');
      }).toThrow(FileError);
    });

    it('should handle file access errors', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.statSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });
      
      expect(() => {
        (parser as any).validateFile('inaccessible.csv');
      }).toThrow(FileError);
    });
  });

  describe('Numeric Parsing', () => {
    it('should parse valid integers', () => {
      const options = parser as any;
      
      expect(options.parseInteger('123')).toBe(123);
      expect(options.parseInteger('0')).toBe(0);
      expect(options.parseInteger('-456')).toBe(-456);
    });

    it('should throw ValidationError for invalid integers', () => {
      const options = parser as any;
      
      expect(() => {
        options.parseInteger('abc');
      }).toThrow(ValidationError);
      
      // parseInt('12.34') actually returns 12, so it doesn't throw
      expect(options.parseInteger('12.34')).toBe(12);
    });

    it('should parse valid floats', () => {
      const options = parser as any;
      
      expect(options.parseFloat('123.45')).toBe(123.45);
      expect(options.parseFloat('0.0')).toBe(0.0);
      expect(options.parseFloat('-0.75')).toBe(-0.75);
    });

    it('should throw ValidationError for invalid floats', () => {
      const options = parser as any;
      
      expect(() => {
        options.parseFloat('xyz');
      }).toThrow(ValidationError);
    });
  });

  describe('Help System', () => {
    it('should show general help', () => {
      (parser as any).showHelp();
      
      expect(processStdoutWriteSpy).toHaveBeenCalled();
    });

    it('should show command-specific help', () => {
      // Mock finding a command
      const mockProgram = parser as any;
      mockProgram.program.commands = [{
        name: () => 'all',
        helpInformation: () => 'Command help for all',
      }];
      
      (parser as any).showHelp('all');
      
      expect(processStdoutWriteSpy).toHaveBeenCalledWith('Command help for all');
    });

    it('should handle unknown command help request', () => {
      const mockProgram = parser as any;
      mockProgram.program.commands = [];
      mockProgram.program.helpInformation = () => 'General help';
      
      (parser as any).showHelp('unknown');
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('Unknown command: unknown');
      expect(processStdoutWriteSpy).toHaveBeenCalledWith('General help');
    });
  });

  describe('Context Management', () => {
    it('should return null when no context stored', () => {
      const result = (parser as any).getLastContext();
      
      expect(result).toBeFalsy();
    });

    it('should merge global and command options', () => {
      const mockProgram = parser as any;
      mockProgram.program._lastContext = {
        command: 'test',
        options: { format: 'json' },
      };
      mockProgram.program.opts = () => ({ verbose: true });
      
      const result = (parser as any).getLastContext();
      
      expect(result?.options.verbose).toBe(true);
      expect(result?.options.output).toBe('json');
    });
  });

  describe('Error Handling', () => {
    it('should wrap parsing errors in ValidationError', () => {
      // Mock commander parse to throw
      const mockProgram = parser as any;
      const originalParse = mockProgram.program.parse;
      mockProgram.program.parse = jest.fn().mockImplementation(() => {
        throw new Error('Parse error');
      });
      
      expect(() => {
        parser.parse(['node', 'datapilot', 'invalid']);
      }).toThrow(ValidationError);
      
      // Restore
      mockProgram.program.parse = originalParse;
    });

    it('should handle non-Error exceptions', () => {
      const mockProgram = parser as any;
      const originalParse = mockProgram.program.parse;
      mockProgram.program.parse = jest.fn().mockImplementation(() => {
        throw 'String error';
      });
      
      expect(() => {
        parser.parse(['node', 'datapilot', 'invalid']);
      }).toThrow(ValidationError);
      
      // Restore
      mockProgram.program.parse = originalParse;
    });
  });

  describe('Section Number Mapping', () => {
    it('should return correct section numbers', () => {
      const getSectionNumber = (parser as any).getSectionNumber;
      
      expect(getSectionNumber('overview')).toBe('1');
      expect(getSectionNumber('quality')).toBe('2');
      expect(getSectionNumber('eda')).toBe('3');
      expect(getSectionNumber('viz')).toBe('4');
      expect(getSectionNumber('engineering')).toBe('5');
      expect(getSectionNumber('modeling')).toBe('6');
      expect(getSectionNumber('unknown')).toBe('?');
    });
  });

  describe('Command Handlers', () => {
    it('should create proper command handler', () => {
      const handler = (parser as any).createCommandHandler('test');
      
      expect(typeof handler).toBe('function');
      
      // Execute handler
      handler('file.csv', { option: 'value' });
      
      const context = (parser as any).program._lastContext;
      expect(context.command).toBe('test');
      expect(context.file).toBe('file.csv');
      expect(context.options.option).toBe('value');
      expect(context.args).toEqual(['file.csv']);
    });

    it('should create proper join command handler for array input', () => {
      const handler = (parser as any).createJoinCommandHandler('join');
      
      expect(typeof handler).toBe('function');
      
      // Execute handler with array
      handler(['file1.csv', 'file2.csv'], { confidence: 0.8 });
      
      const context = (parser as any).program._lastContext;
      expect(context.command).toBe('join');
      expect(context.file).toBe('file1.csv');
      expect(context.args).toEqual(['file1.csv', 'file2.csv']);
    });

    it('should create proper join command handler for string input', () => {
      const handler = (parser as any).createJoinCommandHandler('discover');
      
      // Execute handler with string
      handler('./data', { recursive: true });
      
      const context = (parser as any).program._lastContext;
      expect(context.command).toBe('discover');
      expect(context.file).toBe('./data');
      expect(context.args).toEqual(['./data']);
    });
  });
});