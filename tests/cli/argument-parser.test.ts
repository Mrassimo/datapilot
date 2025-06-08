import { ArgumentParser } from '../../src/cli/argument-parser';
import { writeFileSync, unlinkSync, mkdtempSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('ArgumentParser', () => {
  let parser: ArgumentParser;
  let tempDir: string;
  let tempFile: string;

  beforeEach(() => {
    parser = new ArgumentParser();
    tempDir = mkdtempSync(join(tmpdir(), 'datapilot-parser-test-'));
    tempFile = join(tempDir, 'test.csv');
    writeFileSync(tempFile, 'col1,col2\nval1,val2', 'utf8');
  });

  afterEach(() => {
    try {
      unlinkSync(tempFile);
    } catch (e) {
      // File might not exist
    }
  });

  describe('Command Parsing', () => {
    it('should parse help command and exit', () => {
      const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called');
      });
      
      try {
        const args = ['node', 'datapilot', '--help'];
        expect(() => parser.parse(args)).toThrow('process.exit called');
        expect(mockExit).toHaveBeenCalledWith(0);
      } finally {
        mockExit.mockRestore();
      }
    });

    it('should handle empty arguments and show help', () => {
      const args = ['node', 'datapilot'];
      const result = parser.parse(args);
      
      expect(result.command).toBe('help');
    });
  });

  describe('File Validation', () => {
    it('should validate existing files', () => {
      const validatedPath = parser.validateFile(tempFile);
      expect(validatedPath).toBeDefined();
      expect(validatedPath).toContain('test.csv');
    });

    it('should reject non-existent files', () => {
      expect(() => parser.validateFile('/nonexistent/file.csv')).toThrow();
    });

    it('should reject empty files', () => {
      const emptyFile = join(tempDir, 'empty.csv');
      writeFileSync(emptyFile, '', 'utf8');
      
      try {
        expect(() => parser.validateFile(emptyFile)).toThrow();
      } finally {
        unlinkSync(emptyFile);
      }
    });
  });

  describe('Help System', () => {
    it('should show general help', () => {
      const consoleSpy = jest.spyOn(process.stdout, 'write').mockImplementation();
      
      try {
        parser.showHelp();
        expect(consoleSpy).toHaveBeenCalled();
      } finally {
        consoleSpy.mockRestore();
      }
    });

    it('should show command-specific help', () => {
      const consoleSpy = jest.spyOn(process.stdout, 'write').mockImplementation();
      
      try {
        parser.showHelp('all');
        expect(consoleSpy).toHaveBeenCalled();
      } finally {
        consoleSpy.mockRestore();
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid command gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      try {
        parser.showHelp('invalid-command');
        expect(consoleSpy).toHaveBeenCalledWith('Unknown command: invalid-command');
      } finally {
        consoleSpy.mockRestore();
      }
    });
  });
});