import { OutputManager } from '../../src/cli/output-manager';
import { writeFileSync, unlinkSync, existsSync, readFileSync, mkdtempSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('OutputManager', () => {
  let tempDir: string;
  let outputManager: OutputManager;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'datapilot-output-test-'));
    outputManager = new OutputManager();
  });

  afterEach(() => {
    // Clean up any created files
    try {
      const files = require('fs').readdirSync(tempDir);
      for (const file of files) {
        unlinkSync(join(tempDir, file));
      }
      require('fs').rmdirSync(tempDir);
    } catch (e) {
      // Directory might be empty or not exist
    }
  });

  describe('Format Detection', () => {
    it('should detect format from file extension', () => {
      const tests = [
        { file: 'report.md', expected: 'md' },
        { file: 'report.txt', expected: 'txt' },
        { file: 'data.json', expected: 'json' },
        { file: 'config.yaml', expected: 'yaml' },
        { file: 'config.yml', expected: 'yaml' }
      ];

      for (const { file, expected } of tests) {
        const format = outputManager.detectFormatFromFilename(file);
        expect(format).toBe(expected);
      }
    });

    it('should return default format for unknown extensions', () => {
      const format = outputManager.detectFormatFromFilename('file.unknown');
      expect(format).toBe('txt');
    });

    it('should handle files without extensions', () => {
      const format = outputManager.detectFormatFromFilename('report');
      expect(format).toBe('txt');
    });
  });

  describe('Output File Generation', () => {
    it('should generate output filename from input', () => {
      const tests = [
        { input: 'data.csv', format: 'md', expected: 'data_datapilot_analysis.md' },
        { input: 'sample.csv', format: 'txt', expected: 'sample_datapilot_analysis.txt' },
        { input: '/path/to/file.csv', format: 'json', expected: 'file_datapilot_analysis.json' },
        { input: 'complex-name.csv', format: 'yaml', expected: 'complex-name_datapilot_analysis.yaml' }
      ];

      for (const { input, format, expected } of tests) {
        const output = outputManager.generateOutputFilename(input, format as any);
        expect(output).toBe(expected);
      }
    });

    it('should handle section-specific outputs', () => {
      const output = outputManager.generateOutputFilename(
        'data.csv', 
        'md', 
        'quality'
      );
      expect(output).toBe('data_datapilot_quality.md');
    });

    it('should sanitise special characters in filenames', () => {
      const input = 'file with spaces & symbols!.csv';
      const output = outputManager.generateOutputFilename(input, 'md');
      expect(output).toBe('file_with_spaces___symbols__datapilot_analysis.md');
    });
  });

  describe('Content Writing', () => {
    it('should write markdown content correctly', async () => {
      const content = '# Test Report\n\nThis is a test.';
      const outputFile = join(tempDir, 'test.md');
      
      await outputManager.writeOutput(content, outputFile, 'md');
      
      expect(existsSync(outputFile)).toBe(true);
      const writtenContent = readFileSync(outputFile, 'utf8');
      expect(writtenContent).toBe(content);
    });

    it('should write JSON content with proper formatting', async () => {
      const data = { test: 'value', nested: { key: 'data' } };
      const outputFile = join(tempDir, 'test.json');
      
      await outputManager.writeOutput(JSON.stringify(data), outputFile, 'json');
      
      expect(existsSync(outputFile)).toBe(true);
      const writtenContent = readFileSync(outputFile, 'utf8');
      const parsed = JSON.parse(writtenContent);
      expect(parsed).toEqual(data);
    });

    it('should write YAML content correctly', async () => {
      const yamlContent = 'test: value\nnested:\n  key: data';
      const outputFile = join(tempDir, 'test.yaml');
      
      await outputManager.writeOutput(yamlContent, outputFile, 'yaml');
      
      expect(existsSync(outputFile)).toBe(true);
      const writtenContent = readFileSync(outputFile, 'utf8');
      expect(writtenContent).toBe(yamlContent);
    });

    it('should handle large content efficiently', async () => {
      const largeContent = 'x'.repeat(1000000); // 1MB of content
      const outputFile = join(tempDir, 'large.txt');
      
      const startTime = Date.now();
      await outputManager.writeOutput(largeContent, outputFile, 'txt');
      const endTime = Date.now();
      
      expect(existsSync(outputFile)).toBe(true);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete in under 5 seconds
    });
  });

  describe('Console Output', () => {
    let consoleSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it('should output to console when no file specified', async () => {
      const content = 'Test content';
      
      await outputManager.writeOutput(content, undefined, 'txt');
      
      expect(consoleSpy).toHaveBeenCalledWith(content);
    });

    it('should format console output for different formats', async () => {
      const content = 'Test content';
      
      await outputManager.writeOutput(content, undefined, 'md');
      expect(consoleSpy).toHaveBeenCalledWith(content);
      
      const jsonContent = '{"test": "value"}';
      await outputManager.writeOutput(jsonContent, undefined, 'json');
      expect(consoleSpy).toHaveBeenCalledWith(jsonContent);
    });
  });

  describe('File Validation', () => {
    it('should validate output file permissions', async () => {
      const readOnlyFile = join(tempDir, 'readonly.txt');
      writeFileSync(readOnlyFile, 'initial');
      
      // Make file read-only (on Unix systems)
      if (process.platform !== 'win32') {
        require('fs').chmodSync(readOnlyFile, 0o444);
        
        await expect(
          outputManager.writeOutput('new content', readOnlyFile, 'txt')
        ).rejects.toThrow();
      }
    });

    it('should create directories if they do not exist', async () => {
      const nestedPath = join(tempDir, 'nested', 'deep', 'file.txt');
      
      await outputManager.writeOutput('content', nestedPath, 'txt');
      
      expect(existsSync(nestedPath)).toBe(true);
    });

    it('should handle concurrent writes safely', async () => {
      const file1 = join(tempDir, 'concurrent1.txt');
      const file2 = join(tempDir, 'concurrent2.txt');
      
      const promises = [
        outputManager.writeOutput('content1', file1, 'txt'),
        outputManager.writeOutput('content2', file2, 'txt')
      ];
      
      await Promise.all(promises);
      
      expect(readFileSync(file1, 'utf8')).toBe('content1');
      expect(readFileSync(file2, 'utf8')).toBe('content2');
    });
  });

  describe('Progress Reporting', () => {
    it('should report progress during large file writes', async () => {
      const progressUpdates: any[] = [];
      outputManager.setProgressCallback((progress) => {
        progressUpdates.push(progress);
      });
      
      const largeContent = 'x'.repeat(100000);
      const outputFile = join(tempDir, 'progress-test.txt');
      
      await outputManager.writeOutput(largeContent, outputFile, 'txt');
      
      // Should have received some progress updates for large files
      expect(progressUpdates.length).toBeGreaterThan(0);
    });
  });

  describe('Format Conversion', () => {
    it('should convert between compatible formats', async () => {
      const markdownContent = '# Title\n\nContent with **bold** text.';
      const outputFile = join(tempDir, 'converted.txt');
      
      await outputManager.writeOutput(markdownContent, outputFile, 'txt');
      
      const content = readFileSync(outputFile, 'utf8');
      expect(content).toBe(markdownContent); // Should preserve content as-is for txt
    });

    it('should validate JSON before writing', async () => {
      const invalidJson = '{invalid json';
      const outputFile = join(tempDir, 'invalid.json');
      
      await expect(
        outputManager.writeOutput(invalidJson, outputFile, 'json')
      ).rejects.toThrow('Invalid JSON');
    });

    it('should validate YAML before writing', async () => {
      const invalidYaml = 'invalid: yaml: content: [';
      const outputFile = join(tempDir, 'invalid.yaml');
      
      await expect(
        outputManager.writeOutput(invalidYaml, outputFile, 'yaml')
      ).rejects.toThrow('Invalid YAML');
    });
  });

  describe('Metadata and Statistics', () => {
    it('should track output statistics', async () => {
      const content = 'Test content with multiple lines\nSecond line\nThird line';
      const outputFile = join(tempDir, 'stats.txt');
      
      const stats = await outputManager.writeOutputWithStats(content, outputFile, 'txt');
      
      expect(stats.bytesWritten).toBeGreaterThan(0);
      expect(stats.linesWritten).toBe(3);
      expect(stats.writeTime).toBeGreaterThan(0);
      expect(stats.outputPath).toBe(outputFile);
    });

    it('should add metadata headers to reports', async () => {
      const content = 'Report content';
      const outputFile = join(tempDir, 'with-metadata.md');
      
      await outputManager.writeOutputWithMetadata(
        content, 
        outputFile, 
        'md',
        {
          generatedAt: new Date().toISOString(),
          inputFile: 'source.csv',
          version: '1.0.0'
        }
      );
      
      const writtenContent = readFileSync(outputFile, 'utf8');
      expect(writtenContent).toContain('Generated at:');
      expect(writtenContent).toContain('source.csv');
      expect(writtenContent).toContain('Report content');
    });
  });

  describe('Error Handling', () => {
    it('should handle disk space issues gracefully', async () => {
      // Mock a disk space error
      const originalWriteFile = require('fs').promises.writeFile;
      require('fs').promises.writeFile = jest.fn().mockRejectedValue(
        new Error('ENOSPC: no space left on device')
      );
      
      try {
        await expect(
          outputManager.writeOutput('content', join(tempDir, 'nospace.txt'), 'txt')
        ).rejects.toThrow('no space left');
      } finally {
        require('fs').promises.writeFile = originalWriteFile;
      }
    });

    it('should handle invalid file paths', async () => {
      const invalidPaths = [
        '', // Empty path
        '\0invalid', // Null character
        '/dev/null/impossible', // Cannot create file under /dev/null
      ];
      
      for (const path of invalidPaths) {
        await expect(
          outputManager.writeOutput('content', path, 'txt')
        ).rejects.toThrow();
      }
    });

    it('should provide helpful error messages', async () => {
      try {
        await outputManager.writeOutput('content', '/nonexistent/path/file.txt', 'txt');
      } catch (error) {
        expect(error.message).toContain('Unable to write output');
        expect(error.message).toContain('file.txt');
      }
    });
  });
});
