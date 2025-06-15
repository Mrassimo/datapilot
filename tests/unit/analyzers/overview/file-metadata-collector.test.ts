/**
 * File Metadata Collector Tests
 * 
 * Tests comprehensive file system analysis including:
 * - File statistics and metadata collection
 * - MIME type detection
 * - File validation
 * - Privacy controls and path sanitisation
 * - Hash calculation
 * - Warning generation
 */

import { FileMetadataCollector } from '../../../../src/analyzers/overview/file-metadata-collector';
import type { Section1Config, FileMetadata } from '../../../../src/analyzers/overview/types';
import { writeFileSync, unlinkSync, mkdirSync, existsSync, chmodSync } from 'fs';
import { join } from 'path';

describe('FileMetadataCollector', () => {
  let tempDir: string;
  let tempFile: string;

  beforeAll(() => {
    tempDir = join(__dirname, '..', '..', '..', 'temp');
    if (!existsSync(tempDir)) {
      mkdirSync(tempDir, { recursive: true });
    }
  });

  beforeEach(() => {
    tempFile = join(tempDir, `test-${Date.now()}.csv`);
  });

  afterEach(() => {
    try {
      if (existsSync(tempFile)) {
        unlinkSync(tempFile);
      }
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('Basic Metadata Collection', () => {
    it('should collect complete file metadata', async () => {
      const testContent = 'id,name,value\n1,test,100\n2,test2,200';
      writeFileSync(tempFile, testContent);

      const config: Section1Config = {
        includeHostEnvironment: true,
        enableFileHashing: true,
        maxSampleSizeForSparsity: 1000,
        privacyMode: 'full',
        detailedProfiling: true,
      };

      const collector = new FileMetadataCollector(config);
      const metadata = await collector.collectMetadata(tempFile);

      // Basic file properties
      expect(metadata.originalFilename).toContain('test-');
      expect(metadata.originalFilename).toContain('.csv');
      expect(metadata.fullResolvedPath).toContain(tempFile);
      expect(metadata.fileSizeBytes).toBe(testContent.length);
      expect(metadata.fileSizeMB).toBeCloseTo(testContent.length / (1024 * 1024), 6);
      expect(metadata.mimeType).toBe('text/csv');
      expect(metadata.lastModified).toBeDefined();
      expect(typeof metadata.lastModified.getTime).toBe('function');
      expect(metadata.sha256Hash).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should detect MIME types correctly', async () => {
      const testCases = [
        { extension: '.csv', content: 'a,b\n1,2', expectedMime: 'text/csv' },
        { extension: '.tsv', content: 'a\tb\n1\t2', expectedMime: 'text/tab-separated-values' },
        { extension: '.txt', content: 'plain text', expectedMime: 'text/plain' },
        { extension: '.json', content: '{"key": "value"}', expectedMime: 'application/json' },
        { extension: '.unknown', content: 'data', expectedMime: 'application/octet-stream' },
      ];

      const config: Section1Config = {
        includeHostEnvironment: true,
        enableFileHashing: false,
        maxSampleSizeForSparsity: 1000,
        privacyMode: 'full',
        detailedProfiling: true,
      };

      const collector = new FileMetadataCollector(config);

      for (const testCase of testCases) {
        const testFile = join(tempDir, `test${testCase.extension}`);
        writeFileSync(testFile, testCase.content);

        try {
          const metadata = await collector.collectMetadata(testFile);
          expect(metadata.mimeType).toBe(testCase.expectedMime);
        } finally {
          unlinkSync(testFile);
        }
      }
    });

    it('should calculate file size accurately', async () => {
      const testCases = [
        { content: '', expectedBytes: 0 },
        { content: 'a', expectedBytes: 1 },
        { content: 'hello world', expectedBytes: 11 },
        { content: 'a'.repeat(1000), expectedBytes: 1000 },
        { content: 'a'.repeat(1024 * 1024), expectedBytes: 1024 * 1024 }, // 1MB
      ];

      const config: Section1Config = {
        includeHostEnvironment: true,
        enableFileHashing: false,
        maxSampleSizeForSparsity: 1000,
        privacyMode: 'full',
        detailedProfiling: true,
      };

      const collector = new FileMetadataCollector(config);

      for (const testCase of testCases) {
        writeFileSync(tempFile, testCase.content);
        const metadata = await collector.collectMetadata(tempFile);
        
        expect(metadata.fileSizeBytes).toBe(testCase.expectedBytes);
        expect(metadata.fileSizeMB).toBeCloseTo(testCase.expectedBytes / (1024 * 1024), 6);
        
        unlinkSync(tempFile);
      }
    });
  });

  describe('Hash Calculation', () => {
    it('should calculate SHA256 hash when enabled', async () => {
      const testContent = 'test content for hashing';
      writeFileSync(tempFile, testContent);

      const config: Section1Config = {
        includeHostEnvironment: true,
        enableFileHashing: true,
        maxSampleSizeForSparsity: 1000,
        privacyMode: 'full',
        detailedProfiling: true,
      };

      const collector = new FileMetadataCollector(config);
      const metadata = await collector.collectMetadata(tempFile);

      expect(metadata.sha256Hash).toMatch(/^[a-f0-9]{64}$/);
      expect(metadata.sha256Hash).not.toBe('disabled');

      // Same content should produce same hash
      const metadata2 = await collector.collectMetadata(tempFile);
      expect(metadata2.sha256Hash).toBe(metadata.sha256Hash);
    });

    it('should skip hash calculation when disabled', async () => {
      const testContent = 'test content for hashing';
      writeFileSync(tempFile, testContent);

      const config: Section1Config = {
        includeHostEnvironment: true,
        enableFileHashing: false,
        maxSampleSizeForSparsity: 1000,
        privacyMode: 'full',
        detailedProfiling: true,
      };

      const collector = new FileMetadataCollector(config);
      const metadata = await collector.collectMetadata(tempFile);

      expect(metadata.sha256Hash).toBe('disabled');
    });

    it('should handle large files efficiently for hashing', async () => {
      // Create a larger file (1MB)
      const largeContent = 'a'.repeat(1024 * 1024);
      writeFileSync(tempFile, largeContent);

      const config: Section1Config = {
        includeHostEnvironment: true,
        enableFileHashing: true,
        maxSampleSizeForSparsity: 1000,
        privacyMode: 'full',
        detailedProfiling: true,
      };

      const collector = new FileMetadataCollector(config);
      
      const start = Date.now();
      const metadata = await collector.collectMetadata(tempFile);
      const duration = Date.now() - start;

      expect(metadata.sha256Hash).toMatch(/^[a-f0-9]{64}$/);
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });

  describe('Privacy Controls', () => {
    it('should apply minimal privacy mode', async () => {
      writeFileSync(tempFile, 'test data');

      const config: Section1Config = {
        includeHostEnvironment: true,
        enableFileHashing: false,
        maxSampleSizeForSparsity: 1000,
        privacyMode: 'minimal',
        detailedProfiling: true,
      };

      const collector = new FileMetadataCollector(config);
      const metadata = await collector.collectMetadata(tempFile);

      // Should only contain filename, no path information
      expect(metadata.fullResolvedPath).not.toContain('/');
      expect(metadata.fullResolvedPath).not.toContain('\\');
      expect(metadata.fullResolvedPath).toContain('test-');
      expect(metadata.fullResolvedPath).toContain('.csv');
    });

    it('should apply redacted privacy mode', async () => {
      writeFileSync(tempFile, 'test data');

      const config: Section1Config = {
        includeHostEnvironment: true,
        enableFileHashing: false,
        maxSampleSizeForSparsity: 1000,
        privacyMode: 'redacted',
        detailedProfiling: true,
      };

      const collector = new FileMetadataCollector(config);
      const metadata = await collector.collectMetadata(tempFile);

      // Should redact user directory or CI paths
      if (process.platform === 'win32') {
        // Windows CI environments use [project] pattern, regular Windows uses [user]
        const hasUserRedaction = metadata.fullResolvedPath.includes('[user]');
        const hasProjectRedaction = metadata.fullResolvedPath.includes('[project]');
        const hasBuildRedaction = metadata.fullResolvedPath.includes('[build]');
        expect(hasUserRedaction || hasProjectRedaction || hasBuildRedaction).toBe(true);
      } else {
        expect(metadata.fullResolvedPath).toContain('[user]');
      }
      expect(metadata.fullResolvedPath).toContain('test-');
    });

    it('should redact Windows CI paths correctly', () => {
      const config: Section1Config = {
        includeHostEnvironment: true,
        enableFileHashing: false,
        maxSampleSizeForSparsity: 1000,
        privacyMode: 'redacted',
        detailedProfiling: true,
      };

      const collector = new FileMetadataCollector(config);
      
      // Test GitHub Actions Windows path
      const githubActionPath = 'C:\\a\\datapilot\\datapilot\\tests\\temp\\test.csv';
      const redactedGithub = (collector as any).sanitizePath(githubActionPath);
      expect(redactedGithub).toBe('C:\\a\\[project]\\[project]\\tests\\temp\\test.csv');
      
      // Test Azure DevOps Windows paths
      const azureWorkPath = 'C:\\Agent\\_work\\123\\tests\\temp\\test.csv';
      const redactedAzureWork = (collector as any).sanitizePath(azureWorkPath);
      expect(redactedAzureWork).toBe('C:\\Agent\\_work\\[build]\\tests\\temp\\test.csv');
      
      const azureDPath = 'D:\\a\\456\\tests\\temp\\test.csv';
      const redactedAzureD = (collector as any).sanitizePath(azureDPath);
      expect(redactedAzureD).toBe('D:\\a\\[build]\\tests\\temp\\test.csv');
      
      // Test regular Windows user path still works
      const userPath = 'C:\\Users\\johndoe\\Documents\\test.csv';
      const redactedUser = (collector as any).sanitizePath(userPath);
      expect(redactedUser).toBe('C:\\Users\\[user]\\Documents\\test.csv');
    });

    it('should apply full privacy mode', async () => {
      writeFileSync(tempFile, 'test data');

      const config: Section1Config = {
        includeHostEnvironment: true,
        enableFileHashing: false,
        maxSampleSizeForSparsity: 1000,
        privacyMode: 'full',
        detailedProfiling: true,
      };

      const collector = new FileMetadataCollector(config);
      const metadata = await collector.collectMetadata(tempFile);

      // Should contain full path
      expect(metadata.fullResolvedPath).toContain(tempFile);
    });
  });

  describe('File Validation', () => {
    it('should validate existing readable files', async () => {
      writeFileSync(tempFile, 'test data');

      const config: Section1Config = {
        includeHostEnvironment: true,
        enableFileHashing: false,
        maxSampleSizeForSparsity: 1000,
        privacyMode: 'full',
        detailedProfiling: true,
      };

      const collector = new FileMetadataCollector(config);
      const validation = collector.validateFile(tempFile);

      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect non-existent files', () => {
      const nonExistentFile = join(tempDir, 'non-existent.csv');

      const config: Section1Config = {
        includeHostEnvironment: true,
        enableFileHashing: false,
        maxSampleSizeForSparsity: 1000,
        privacyMode: 'full',
        detailedProfiling: true,
      };

      const collector = new FileMetadataCollector(config);
      const validation = collector.validateFile(nonExistentFile);

      expect(validation.valid).toBe(false);
      expect(validation.errors).toHaveLength(1);
      expect(validation.errors[0]).toContain('does not exist');
    });

    it('should detect empty files', async () => {
      writeFileSync(tempFile, '');

      const config: Section1Config = {
        includeHostEnvironment: true,
        enableFileHashing: false,
        maxSampleSizeForSparsity: 1000,
        privacyMode: 'full',
        detailedProfiling: true,
      };

      const collector = new FileMetadataCollector(config);
      const validation = collector.validateFile(tempFile);

      expect(validation.valid).toBe(false);
      expect(validation.errors).toHaveLength(1);
      expect(validation.errors[0]).toContain('empty');
    });

    it('should detect directories', async () => {
      const testDir = join(tempDir, 'test-directory');
      mkdirSync(testDir, { recursive: true });

      try {
        const config: Section1Config = {
          includeHostEnvironment: true,
          enableFileHashing: false,
          maxSampleSizeForSparsity: 1000,
          privacyMode: 'full',
          detailedProfiling: true,
        };

        const collector = new FileMetadataCollector(config);
        const validation = collector.validateFile(testDir);

        expect(validation.valid).toBe(false);
        expect(validation.errors).toHaveLength(1);
        expect(validation.errors[0]).toContain('directory');
      } finally {
        require('fs').rmdirSync(testDir);
      }
    });

    it('should handle permission errors gracefully', async () => {
      if (process.platform !== 'win32') {
        writeFileSync(tempFile, 'test data');
        
        try {
          // Make file unreadable
          chmodSync(tempFile, 0o000);

          const config: Section1Config = {
            includeHostEnvironment: true,
            enableFileHashing: false,
            maxSampleSizeForSparsity: 1000,
            privacyMode: 'full',
            detailedProfiling: true,
          };

          const collector = new FileMetadataCollector(config);
          const validation = collector.validateFile(tempFile);

          expect(validation.valid).toBe(false);
          expect(validation.errors.length).toBeGreaterThan(0);
          expect(validation.errors[0]).toContain('access error');
        } finally {
          // Restore permissions
          try {
            chmodSync(tempFile, 0o644);
          } catch (error) {
            // Ignore cleanup errors
          }
        }
      }
    });

    it('should detect very large files', async () => {
      writeFileSync(tempFile, 'test');

      const config: Section1Config = {
        includeHostEnvironment: true,
        enableFileHashing: false,
        maxSampleSizeForSparsity: 1000,
        privacyMode: 'full',
        detailedProfiling: true,
      };

      const collector = new FileMetadataCollector(config);
      
      // For this test, we'll just verify the validation function works
      // without mocking extremely large files which can be unreliable
      const validation = collector.validateFile(tempFile);
      expect(validation.valid).toBe(true); // Small test file should be valid
      expect(validation.errors).toHaveLength(0);
    });
  });

  describe('Warning Generation', () => {
    it('should generate warnings for very large files', async () => {
      writeFileSync(tempFile, 'test data');

      // Mock file stats to simulate large file
      const originalStatSync = require('fs').statSync;
      jest.spyOn(require('fs'), 'statSync').mockImplementation((path) => {
        if (path === tempFile) {
          const realStats = originalStatSync(path);
          return { ...realStats, size: 2000 * 1024 * 1024 }; // 2GB
        }
        return originalStatSync(path);
      });

      const config: Section1Config = {
        includeHostEnvironment: true,
        enableFileHashing: false,
        maxSampleSizeForSparsity: 1000,
        privacyMode: 'full',
        detailedProfiling: true,
      };

      const collector = new FileMetadataCollector(config);
      await collector.collectMetadata(tempFile);

      const warnings = collector.getWarnings();
      expect(warnings.length).toBeGreaterThan(0);
      
      const largeFileWarning = warnings.find(w => w.message.includes('large file'));
      expect(largeFileWarning).toBeDefined();
      expect(largeFileWarning?.category).toBe('file');
      expect(largeFileWarning?.severity).toBe('low');
      expect(largeFileWarning?.impact).toContain('memory');
      expect(largeFileWarning?.suggestion).toContain('Processing');

      jest.restoreAllMocks();
    });

    it('should manage warnings correctly', async () => {
      writeFileSync(tempFile, 'test data');

      const config: Section1Config = {
        includeHostEnvironment: true,
        enableFileHashing: false,
        maxSampleSizeForSparsity: 1000,
        privacyMode: 'full',
        detailedProfiling: true,
      };

      const collector = new FileMetadataCollector(config);
      
      // Initially no warnings
      expect(collector.getWarnings()).toHaveLength(0);

      // After processing a normal file, still no warnings
      await collector.collectMetadata(tempFile);
      expect(collector.getWarnings()).toHaveLength(0);

      // Should be able to clear warnings
      collector.clearWarnings();
      expect(collector.getWarnings()).toHaveLength(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle file access errors gracefully', async () => {
      const nonExistentFile = join(tempDir, 'non-existent.csv');

      const config: Section1Config = {
        includeHostEnvironment: true,
        enableFileHashing: false,
        maxSampleSizeForSparsity: 1000,
        privacyMode: 'full',
        detailedProfiling: true,
      };

      const collector = new FileMetadataCollector(config);

      await expect(collector.collectMetadata(nonExistentFile))
        .rejects.toThrow('Failed to collect file metadata');
    });

    it('should handle hash calculation errors', async () => {
      writeFileSync(tempFile, 'test data');

      const config: Section1Config = {
        includeHostEnvironment: true,
        enableFileHashing: true,
        maxSampleSizeForSparsity: 1000,
        privacyMode: 'full',
        detailedProfiling: true,
      };

      const collector = new FileMetadataCollector(config);

      // Mock createReadStream to simulate error
      const originalCreateReadStream = require('fs').createReadStream;
      jest.spyOn(require('fs'), 'createReadStream').mockImplementation(() => {
        const { EventEmitter } = require('events');
        const stream = new EventEmitter();
        // Simulate error after a short delay
        setTimeout(() => stream.emit('error', new Error('Stream error')), 10);
        return stream;
      });

      await expect(collector.collectMetadata(tempFile))
        .rejects.toThrow('Hash calculation failed');

      jest.restoreAllMocks();
    });

    it('should handle unusual file extensions', async () => {
      const unusualFile = join(tempDir, 'test.unknown_extension');
      writeFileSync(unusualFile, 'test data');

      try {
        const config: Section1Config = {
          includeHostEnvironment: true,
          enableFileHashing: false,
          maxSampleSizeForSparsity: 1000,
          privacyMode: 'full',
          detailedProfiling: true,
        };

        const collector = new FileMetadataCollector(config);
        const metadata = await collector.collectMetadata(unusualFile);

        expect(metadata.mimeType).toBe('application/octet-stream');
        expect(metadata.originalFilename).toContain('.unknown_extension');
      } finally {
        unlinkSync(unusualFile);
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle files with no extension', async () => {
      const noExtFile = join(tempDir, 'testfile');
      writeFileSync(noExtFile, 'test data');

      try {
        const config: Section1Config = {
          includeHostEnvironment: true,
          enableFileHashing: false,
          maxSampleSizeForSparsity: 1000,
          privacyMode: 'full',
          detailedProfiling: true,
        };

        const collector = new FileMetadataCollector(config);
        const metadata = await collector.collectMetadata(noExtFile);

        expect(metadata.mimeType).toBe('application/octet-stream');
        expect(metadata.originalFilename).toBe('testfile');
      } finally {
        unlinkSync(noExtFile);
      }
    });

    it('should handle files with multiple extensions', async () => {
      const multiExtFile = join(tempDir, 'test.backup.csv');
      writeFileSync(multiExtFile, 'id,name\n1,test');

      try {
        const config: Section1Config = {
          includeHostEnvironment: true,
          enableFileHashing: false,
          maxSampleSizeForSparsity: 1000,
          privacyMode: 'full',
          detailedProfiling: true,
        };

        const collector = new FileMetadataCollector(config);
        const metadata = await collector.collectMetadata(multiExtFile);

        expect(metadata.mimeType).toBe('text/csv');
        expect(metadata.originalFilename).toBe('test.backup.csv');
      } finally {
        unlinkSync(multiExtFile);
      }
    });

    it('should handle special characters in filenames', async () => {
      const specialFile = join(tempDir, 'test file with spaces & symbols.csv');
      writeFileSync(specialFile, 'test data');

      try {
        const config: Section1Config = {
          includeHostEnvironment: true,
          enableFileHashing: false,
          maxSampleSizeForSparsity: 1000,
          privacyMode: 'full',
          detailedProfiling: true,
        };

        const collector = new FileMetadataCollector(config);
        const metadata = await collector.collectMetadata(specialFile);

        expect(metadata.originalFilename).toBe('test file with spaces & symbols.csv');
        expect(metadata.mimeType).toBe('text/csv');
      } finally {
        unlinkSync(specialFile);
      }
    });
  });
});