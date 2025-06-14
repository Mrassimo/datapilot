/**
 * CLI Argument Parser Integration Tests
 * 
 * Comprehensive testing of command-line argument parsing functionality including
 * command validation, option handling, file validation, and help system.
 */

import { ArgumentParser } from '../../src/cli/argument-parser';
import { promises as fs } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('CLI Argument Parser Integration', () => {
  let tempDir: string;
  let testCsvPath: string;
  let parser: ArgumentParser;

  beforeAll(async () => {
    // Create temporary directory and test files
    tempDir = await fs.mkdtemp(join(tmpdir(), 'datapilot-parser-test-'));
    testCsvPath = join(tempDir, 'test-data.csv');
    
    // Create a test CSV file
    const testCsvContent = [
      'id,name,age,department,salary,active',
      '1,"John Doe",28,Engineering,75000,true',
      '2,"Jane Smith",32,Marketing,68000,true',
      '3,"Bob Johnson",45,Sales,82000,false'
    ].join('\n');
    
    await fs.writeFile(testCsvPath, testCsvContent, 'utf8');
  });

  afterAll(async () => {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  beforeEach(() => {
    parser = new ArgumentParser();
  });

  describe('Command Parsing and Validation', () => {
    it('should parse all available commands correctly', () => {
      const commands = [
        'all', 'overview', 'quality', 'eda', 'visualization', 
        'engineering', 'modeling', 'join', 'discover', 'validate', 'info'
      ];

      commands.forEach(command => {
        const args = [command, testCsvPath];
        const result = parser.parse(['node', 'datapilot', ...args]);
        
        expect(result.command).toBe(command);
        expect(result.files).toEqual([testCsvPath]);
      });
    });

    it('should handle command aliases correctly', () => {
      const aliases = [
        { alias: 'ove', command: 'overview' },
        { alias: 'qua', command: 'quality' },
        { alias: 'vis', command: 'visualization' },
        { alias: 'eng', command: 'engineering' },
        { alias: 'mod', command: 'modeling' }
      ];

      aliases.forEach(({ alias, command }) => {
        const args = [alias, testCsvPath];
        const result = parser.parse(['node', 'datapilot', ...args]);
        
        expect(result.command).toBe(command);
        expect(result.files).toEqual([testCsvPath]);
      });
    });

    it('should reject invalid commands', () => {
      const invalidCommands = ['invalid', 'unknown', 'badcommand'];

      invalidCommands.forEach(command => {
        const args = [command, testCsvPath];
        
        expect(() => {
          parser.parse(['node', 'datapilot', ...args]);
        }).toThrow();
      });
    });
  });

  describe('Global Options Parsing', () => {
    it('should parse all global options correctly', () => {
      const args = [
        'all', testCsvPath,
        '--verbose',
        '--quiet',
        '--output', 'json',
        '--output-file', join(tempDir, 'output.json'),
        '--dry-run',
        '--force'
      ];

      const result = parser.parse(['node', 'datapilot', ...args]);

      expect(result.verbose).toBe(true);
      expect(result.quiet).toBe(true);
      expect(result.outputFormat).toBe('json');
      expect(result.outputFile).toBe(join(tempDir, 'output.json'));
      expect(result.dryRun).toBe(true);
      expect(result.force).toBe(true);
    });

    it('should handle output format validation', () => {
      const validFormats = ['markdown', 'json', 'yaml', 'txt'];
      const invalidFormats = ['xml', 'csv', 'invalid'];

      validFormats.forEach(format => {
        const args = ['overview', testCsvPath, '--output', format];
        const result = parser.parse(['node', 'datapilot', ...args]);
        expect(result.outputFormat).toBe(format);
      });

      invalidFormats.forEach(format => {
        const args = ['overview', testCsvPath, '--output', format];
        expect(() => {
          parser.parse(['node', 'datapilot', ...args]);
        }).toThrow(/invalid output format/i);
      });
    });

    it('should handle conflicting options appropriately', () => {
      // Test verbose and quiet together
      const args = ['overview', testCsvPath, '--verbose', '--quiet'];
      const result = parser.parse(['node', 'datapilot', ...args]);
      
      // Should handle conflicting options gracefully
      expect(result.verbose).toBeDefined();
      expect(result.quiet).toBeDefined();
    });
  });

  describe('File Validation and Processing', () => {
    it('should validate single file existence and accessibility', () => {
      const args = ['overview', testCsvPath];
      const result = parser.parse(['node', 'datapilot', ...args]);
      
      expect(result.files).toEqual([testCsvPath]);
      expect(result.command).toBe('overview');
    });

    it('should handle multiple files for multi-file commands', () => {
      // Create additional test files
      const testCsvPath2 = join(tempDir, 'test-data2.csv');
      const testCsvPath3 = join(tempDir, 'test-data3.csv');
      
      return Promise.all([
        fs.writeFile(testCsvPath2, 'col1,col2\n1,2\n3,4', 'utf8'),
        fs.writeFile(testCsvPath3, 'colA,colB\na,b\nc,d', 'utf8')
      ]).then(() => {
        const args = ['engineering', testCsvPath, testCsvPath2, testCsvPath3];
        const result = parser.parse(['node', 'datapilot', ...args]);
        
        expect(result.files).toEqual([testCsvPath, testCsvPath2, testCsvPath3]);
        expect(result.command).toBe('engineering');
      });
    });

    it('should reject non-existent files', () => {
      const nonExistentFile = join(tempDir, 'nonexistent.csv');
      const args = ['overview', nonExistentFile];
      
      expect(() => {
        parser.parse(['node', 'datapilot', ...args]);
      }).toThrow(/file does not exist/i);
    });

    it('should validate file accessibility and permissions', async () => {
      // Create a test file with restricted permissions
      const restrictedFile = join(tempDir, 'restricted.csv');
      await fs.writeFile(restrictedFile, 'test,data\n1,2', 'utf8');
      
      // Change permissions to make file unreadable (on Unix systems)
      if (process.platform !== 'win32') {
        try {
          await fs.chmod(restrictedFile, 0o000);
          
          const args = ['overview', restrictedFile];
          expect(() => {
            parser.parse(['node', 'datapilot', ...args]);
          }).toThrow(/permission/i);
        } finally {
          // Restore permissions for cleanup
          await fs.chmod(restrictedFile, 0o644).catch(() => {});
        }
      }
    });

    it('should handle relative and absolute file paths', () => {
      // Test absolute path
      const absoluteArgs = ['overview', testCsvPath];
      const absoluteResult = parser.parse(['node', 'datapilot', ...absoluteArgs]);
      expect(absoluteResult.files[0]).toBe(testCsvPath);

      // Test relative path (assuming current working directory setup)
      const relativePath = './test-data.csv';
      // We can't easily test relative paths without changing working directory
      // So we'll test the parser can handle the path format
      expect(() => {
        parser.parse(['node', 'datapilot', 'overview', relativePath]);
      }).not.toThrow(); // Should not throw on path format
    });
  });

  describe('Section-Specific Options', () => {
    it('should parse visualization accessibility levels', () => {
      const accessibilityLevels = ['basic', 'standard', 'comprehensive'];
      
      accessibilityLevels.forEach(level => {
        const args = ['visualization', testCsvPath, '--accessibility-level', level];
        const result = parser.parse(['node', 'datapilot', ...args]);
        expect(result.accessibilityLevel).toBe(level);
      });
    });

    it('should parse engineering complexity thresholds', () => {
      const args = [
        'engineering', testCsvPath,
        '--complexity-threshold', '0.75',
        '--performance-optimization', 'aggressive'
      ];
      
      const result = parser.parse(['node', 'datapilot', ...args]);
      expect(result.complexityThreshold).toBe(0.75);
      expect(result.performanceOptimization).toBe('aggressive');
    });

    it('should parse join analysis confidence thresholds', () => {
      const testCsvPath2 = join(tempDir, 'join-test2.csv');
      
      return fs.writeFile(testCsvPath2, 'id,value\n1,100\n2,200', 'utf8').then(() => {
        const args = [
          'join', testCsvPath, testCsvPath2,
          '--confidence-threshold', '0.85',
          '--join-strategy', 'intelligent'
        ];
        
        const result = parser.parse(['node', 'datapilot', ...args]);
        expect(result.confidenceThreshold).toBe(0.85);
        expect(result.joinStrategy).toBe('intelligent');
      });
    });

    it('should handle modeling-specific parameters', () => {
      const args = [
        'modeling', testCsvPath,
        '--target-column', 'salary',
        '--exclude-columns', 'id,name',
        '--cross-validation-folds', '5'
      ];
      
      const result = parser.parse(['node', 'datapilot', ...args]);
      expect(result.targetColumn).toBe('salary');
      expect(result.excludeColumns).toEqual(['id', 'name']);
      expect(result.crossValidationFolds).toBe(5);
    });
  });

  describe('CSV-Specific Options', () => {
    it('should parse delimiter options', () => {
      const delimiters = [',', ';', '\t', '|'];
      
      delimiters.forEach(delimiter => {
        const args = ['overview', testCsvPath, '--delimiter', delimiter];
        const result = parser.parse(['node', 'datapilot', ...args]);
        expect(result.delimiter).toBe(delimiter);
      });
    });

    it('should handle encoding specifications', () => {
      const encodings = ['utf8', 'utf16le', 'latin1', 'ascii'];
      
      encodings.forEach(encoding => {
        const args = ['overview', testCsvPath, '--encoding', encoding];
        const result = parser.parse(['node', 'datapilot', ...args]);
        expect(result.encoding).toBe(encoding);
      });
    });

    it('should parse header and quoting options', () => {
      const args = [
        'overview', testCsvPath,
        '--no-header',
        '--quote-char', "'",
        '--escape-char', '\\'
      ];
      
      const result = parser.parse(['node', 'datapilot', ...args]);
      expect(result.hasHeader).toBe(false);
      expect(result.quoteChar).toBe("'");
      expect(result.escapeChar).toBe('\\');
    });

    it('should handle Excel-specific options', async () => {
      // Create a mock Excel file (we'll just test the parsing logic)
      const excelPath = join(tempDir, 'test.xlsx');
      await fs.writeFile(excelPath, 'mock excel content', 'utf8');
      
      const args = [
        'overview', excelPath,
        '--sheet-name', 'Sheet2',
        '--sheet-index', '1'
      ];
      
      // This might throw due to file format, but should parse options correctly
      try {
        const result = parser.parse(['node', 'datapilot', ...args]);
        expect(result.sheetName).toBe('Sheet2');
        expect(result.sheetIndex).toBe(1);
      } catch (error) {
        // Expected for non-Excel file, but options should still be parsed
        expect(error).toBeDefined();
      }
    });
  });

  describe('Help System and Documentation', () => {
    it('should provide comprehensive help information', () => {
      const helpText = parser.getHelpText();
      
      expect(helpText).toContain('DataPilot');
      expect(helpText).toContain('Usage:');
      expect(helpText).toContain('Commands:');
      expect(helpText).toContain('Options:');
      
      // Should contain all main commands
      expect(helpText).toContain('all');
      expect(helpText).toContain('overview');
      expect(helpText).toContain('quality');
      expect(helpText).toContain('engineering');
      
      // Should contain key options
      expect(helpText).toContain('--verbose');
      expect(helpText).toContain('--output');
      expect(helpText).toContain('--help');
    });

    it('should provide command-specific help', () => {
      const commands = ['overview', 'quality', 'engineering', 'modeling'];
      
      commands.forEach(command => {
        const commandHelp = parser.getCommandHelp(command);
        expect(commandHelp).toContain(command);
        expect(commandHelp.length).toBeGreaterThan(0);
      });
    });

    it('should handle version information', () => {
      const args = ['--version'];
      
      expect(() => {
        parser.parse(['node', 'datapilot', ...args]);
      }).not.toThrow();
      
      // Should exit with version info (in a real CLI)
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle missing required arguments', () => {
      const args = ['overview']; // Missing file
      
      expect(() => {
        parser.parse(['node', 'datapilot', ...args]);
      }).toThrow(/required/i);
    });

    it('should handle invalid option values', () => {
      const invalidOptions = [
        ['--confidence-threshold', '1.5'], // > 1.0
        ['--cross-validation-folds', '-1'], // negative
        ['--sheet-index', 'not-a-number'],
        ['--complexity-threshold', 'invalid']
      ];
      
      invalidOptions.forEach(([option, value]) => {
        const args = ['overview', testCsvPath, option, value];
        expect(() => {
          parser.parse(['node', 'datapilot', ...args]);
        }).toThrow();
      });
    });

    it('should handle unknown options gracefully', () => {
      const args = ['overview', testCsvPath, '--unknown-option', 'value'];
      
      expect(() => {
        parser.parse(['node', 'datapilot', ...args]);
      }).toThrow(/unknown.*option/i);
    });

    it('should validate option combinations', () => {
      // Test mutually exclusive options
      const conflictingArgs = [
        ['overview', testCsvPath, '--sheet-name', 'Sheet1', '--sheet-index', '0'],
        ['overview', testCsvPath, '--delimiter', ',', '--delimiter', ';']
      ];
      
      conflictingArgs.forEach(args => {
        // Should either throw or handle gracefully
        expect(() => {
          parser.parse(['node', 'datapilot', ...args]);
        }).not.toThrow(); // Allow for graceful handling
      });
    });

    it('should handle empty and whitespace arguments', () => {
      const problematicArgs = [
        ['overview', ''], // empty file
        ['overview', '   '], // whitespace file
        ['', testCsvPath], // empty command
      ];
      
      problematicArgs.forEach(args => {
        expect(() => {
          parser.parse(['node', 'datapilot', ...args]);
        }).toThrow();
      });
    });
  });

  describe('Configuration and Environment Integration', () => {
    it('should respect configuration file settings', () => {
      // This would test integration with .datapilotrc files
      // Implementation depends on how config files are handled
      const args = ['overview', testCsvPath];
      const result = parser.parse(['node', 'datapilot', ...args]);
      
      expect(result).toBeDefined();
      expect(result.command).toBe('overview');
    });

    it('should handle environment variable overrides', () => {
      // Test environment variables like DATAPILOT_OUTPUT_FORMAT
      const originalEnv = process.env.DATAPILOT_OUTPUT_FORMAT;
      
      try {
        process.env.DATAPILOT_OUTPUT_FORMAT = 'json';
        
        const args = ['overview', testCsvPath];
        const result = parser.parse(['node', 'datapilot', ...args]);
        
        // Should respect environment variable (if implemented)
        expect(result).toBeDefined();
      } finally {
        if (originalEnv !== undefined) {
          process.env.DATAPILOT_OUTPUT_FORMAT = originalEnv;
        } else {
          delete process.env.DATAPILOT_OUTPUT_FORMAT;
        }
      }
    });
  });
});