/**
 * Comprehensive tests for dry-run functionality
 * Tests --dry-run option across different commands and scenarios
 */

import { DataPilotCLI } from '@/cli';
import { UniversalAnalyzer } from '@/cli/universal-analyzer';
import type { CLIOptions, CLIResult } from '@/cli/types';
import * as fs from 'fs';

// Mock fs methods
jest.mock('fs');
const mockFs = fs as jest.Mocked<typeof fs>;

describe('Dry-Run Functionality', () => {
  let cli: DataPilotCLI;
  let analyzer: UniversalAnalyzer;
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    cli = new DataPilotCLI();
    analyzer = new UniversalAnalyzer();
    (cli as any).analyzer = analyzer;

    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    
    // Reset all mocks
    jest.clearAllMocks();

    // Setup default fs mocks for valid files
    mockFs.existsSync.mockReturnValue(true);
    mockFs.statSync.mockReturnValue({
      isFile: () => true,
      size: 2000000, // 2MB
      mtime: new Date('2024-01-15T10:30:00Z')
    } as fs.Stats);
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('Basic Dry-Run Validation', () => {
    it('should perform dry-run validation for single file commands', async () => {
      const mockValidateAndPreview = jest.spyOn(analyzer, 'validateAndPreview').mockResolvedValue({
        success: true,
        exitCode: 0,
        data: {
          dryRun: true,
          validationResults: [{
            filePath: 'test.csv',
            valid: true,
            format: 'csv',
            confidence: 0.95,
            fileSize: 2000000,
            fileSizeMB: 1.91,
            estimatedRows: 5000,
            columns: 8,
            hasHeader: true,
            estimatedProcessingTime: 1500,
            estimatedMemoryUsage: 50,
            errors: [],
            warnings: ['Minor formatting inconsistencies detected']
          }],
          analysisPlan: {
            command: 'all',
            sections: ['1', '2', '3', '4', '5', '6'],
            executionMode: 'sequential',
            multiFile: false,
            estimatedSteps: 6
          },
          resourceEstimates: {
            estimatedProcessingTimeMs: 1500,
            estimatedMemoryUsageMB: 50,
            numberOfFiles: 1
          },
          wouldExecute: true
        },
        metadata: {
          command: 'dry-run',
          filePaths: ['test.csv'],
          timestamp: new Date().toISOString(),
          options: {
            command: 'all',
            sections: ['1', '2', '3', '4', '5', '6'],
            multiFile: false
          }
        }
      });

      const result = await cli.run(['node', 'datapilot', 'all', 'test.csv', '--dry-run']);

      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
      expect(result.data.dryRun).toBe(true);
      expect(result.data.wouldExecute).toBe(true);
      expect(result.data.validationResults).toHaveLength(1);
      expect(result.data.validationResults[0].valid).toBe(true);
      expect(result.data.analysisPlan.command).toBe('all');
      expect(result.data.analysisPlan.sections).toEqual(['1', '2', '3', '4', '5', '6']);

      expect(mockValidateAndPreview).toHaveBeenCalledWith(['test.csv'], expect.objectContaining({
        command: 'all',
        dryRun: true
      }));

      expect(consoleLogSpy).toHaveBeenCalledWith('🔍 DRY RUN MODE - No analysis was performed');
    });

    it('should perform dry-run validation for multi-file commands', async () => {
      const mockValidateAndPreview = jest.spyOn(analyzer, 'validateAndPreview').mockResolvedValue({
        success: true,
        exitCode: 0,
        data: {
          dryRun: true,
          validationResults: [
            {
              filePath: 'file1.csv',
              valid: true,
              format: 'csv',
              confidence: 0.92,
              fileSize: 1500000,
              fileSizeMB: 1.43,
              estimatedRows: 3000,
              columns: 6,
              hasHeader: true,
              estimatedProcessingTime: 1200,
              estimatedMemoryUsage: 35,
              errors: [],
              warnings: []
            },
            {
              filePath: 'file2.csv',
              valid: true,
              format: 'csv',
              confidence: 0.88,
              fileSize: 2500000,
              fileSizeMB: 2.38,
              estimatedRows: 7500,
              columns: 4,
              hasHeader: true,
              estimatedProcessingTime: 2000,
              estimatedMemoryUsage: 60,
              errors: [],
              warnings: ['Some duplicate entries detected']
            }
          ],
          analysisPlan: {
            command: 'join',
            sections: ['5'], // Engineering section for join analysis
            executionMode: 'multi-file',
            multiFile: true,
            estimatedSteps: 3
          },
          resourceEstimates: {
            estimatedProcessingTimeMs: 3200,
            estimatedMemoryUsageMB: 60, // Max of the two files
            numberOfFiles: 2
          },
          wouldExecute: true
        },
        metadata: {
          command: 'dry-run',
          filePaths: ['file1.csv', 'file2.csv'],
          timestamp: new Date().toISOString(),
          options: {
            command: 'join',
            sections: ['5'],
            multiFile: true
          }
        }
      });

      const result = await cli.run(['node', 'datapilot', 'join', 'file1.csv', 'file2.csv', '--dry-run']);

      expect(result.success).toBe(true);
      expect(result.data.validationResults).toHaveLength(2);
      expect(result.data.analysisPlan.multiFile).toBe(true);
      expect(result.data.resourceEstimates.numberOfFiles).toBe(2);
      expect(result.data.resourceEstimates.estimatedMemoryUsageMB).toBe(60);

      expect(mockValidateAndPreview).toHaveBeenCalledWith(['file1.csv', 'file2.csv'], expect.objectContaining({
        command: 'join',
        dryRun: true
      }));
    });

    it('should handle validation failures in dry-run mode', async () => {
      const mockValidateAndPreview = jest.spyOn(analyzer, 'validateAndPreview').mockResolvedValue({
        success: false,
        exitCode: 1,
        data: {
          dryRun: true,
          validationResults: [{
            filePath: 'invalid.csv',
            valid: false,
            fileSize: 100,
            fileSizeMB: 0.0001,
            estimatedProcessingTime: 0,
            estimatedMemoryUsage: 0,
            errors: [
              'File is too small to be a valid CSV',
              'No valid delimiter detected'
            ],
            warnings: []
          }],
          analysisPlan: {
            command: 'overview',
            sections: ['1'],
            executionMode: 'individual',
            multiFile: false,
            estimatedSteps: 1
          },
          resourceEstimates: {
            estimatedProcessingTimeMs: 0,
            estimatedMemoryUsageMB: 0,
            numberOfFiles: 1
          },
          wouldExecute: false
        },
        error: 'Validation failed for one or more input files',
        suggestions: [
          'Fix file validation issues shown above',
          'Check file paths and permissions',
          'Ensure files are in supported formats'
        ]
      });

      const result = await cli.run(['node', 'datapilot', 'overview', 'invalid.csv', '--dry-run']);

      expect(result.success).toBe(false);
      expect(result.exitCode).toBe(1);
      expect(result.data.wouldExecute).toBe(false);
      expect(result.data.validationResults[0].valid).toBe(false);
      expect(result.data.validationResults[0].errors).toContain('File is too small to be a valid CSV');
      expect(result.error).toBe('Validation failed for one or more input files');
      expect(result.suggestions).toContain('Fix file validation issues shown above');
    });
  });

  describe('Dry-Run with Different Commands', () => {
    it('should handle dry-run for overview command', async () => {
      const mockValidateAndPreview = jest.spyOn(analyzer, 'validateAndPreview').mockResolvedValue({
        success: true,
        exitCode: 0,
        data: {
          dryRun: true,
          validationResults: [{
            filePath: 'data.csv',
            valid: true,
            format: 'csv',
            confidence: 0.98,
            fileSize: 1000000,
            fileSizeMB: 0.95,
            estimatedRows: 2000,
            columns: 5,
            hasHeader: true,
            estimatedProcessingTime: 800,
            estimatedMemoryUsage: 25,
            errors: [],
            warnings: []
          }],
          analysisPlan: {
            command: 'overview',
            sections: ['1'],
            executionMode: 'individual',
            multiFile: false,
            estimatedSteps: 1
          },
          resourceEstimates: {
            estimatedProcessingTimeMs: 800,
            estimatedMemoryUsageMB: 25,
            numberOfFiles: 1
          },
          wouldExecute: true
        }
      });

      const result = await cli.run(['node', 'datapilot', 'overview', 'data.csv', '--dry-run']);

      expect(result.success).toBe(true);
      expect(result.data.analysisPlan.command).toBe('overview');
      expect(result.data.analysisPlan.sections).toEqual(['1']);
    });

    it('should handle dry-run for quality command', async () => {
      const mockValidateAndPreview = jest.spyOn(analyzer, 'validateAndPreview').mockResolvedValue({
        success: true,
        exitCode: 0,
        data: {
          dryRun: true,
          validationResults: [{
            filePath: 'data.csv',
            valid: true,
            format: 'csv',
            confidence: 0.96,
            fileSize: 5000000,
            fileSizeMB: 4.77,
            estimatedRows: 10000,
            columns: 12,
            hasHeader: true,
            estimatedProcessingTime: 3000,
            estimatedMemoryUsage: 80,
            errors: [],
            warnings: ['Large dataset detected']
          }],
          analysisPlan: {
            command: 'quality',
            sections: ['1', '2'], // Overview + Quality
            executionMode: 'sequential',
            multiFile: false,
            estimatedSteps: 2
          },
          resourceEstimates: {
            estimatedProcessingTimeMs: 3000,
            estimatedMemoryUsageMB: 80,
            numberOfFiles: 1
          },
          wouldExecute: true
        }
      });

      const result = await cli.run(['node', 'datapilot', 'quality', 'data.csv', '--dry-run']);

      expect(result.success).toBe(true);
      expect(result.data.analysisPlan.command).toBe('quality');
      expect(result.data.analysisPlan.sections).toEqual(['1', '2']);
      expect(result.data.validationResults[0].warnings).toContain('Large dataset detected');
    });

    it('should handle dry-run for engineering command with multiple files', async () => {
      const mockValidateAndPreview = jest.spyOn(analyzer, 'validateAndPreview').mockResolvedValue({
        success: true,
        exitCode: 0,
        data: {
          dryRun: true,
          validationResults: [
            {
              filePath: 'customers.csv',
              valid: true,
              format: 'csv',
              confidence: 0.94,
              fileSize: 3000000,
              fileSizeMB: 2.86,
              estimatedRows: 8000,
              columns: 10,
              hasHeader: true,
              estimatedProcessingTime: 2500,
              estimatedMemoryUsage: 70,
              errors: [],
              warnings: []
            },
            {
              filePath: 'orders.csv',
              valid: true,
              format: 'csv',
              confidence: 0.91,
              fileSize: 4500000,
              fileSizeMB: 4.29,
              estimatedRows: 15000,
              columns: 8,
              hasHeader: true,
              estimatedProcessingTime: 4000,
              estimatedMemoryUsage: 90,
              errors: [],
              warnings: ['Potential encoding issues detected']
            }
          ],
          analysisPlan: {
            command: 'engineering',
            sections: ['1', '5'], // Overview + Engineering with relationship analysis
            executionMode: 'multi-file',
            multiFile: true,
            estimatedSteps: 4
          },
          resourceEstimates: {
            estimatedProcessingTimeMs: 6500,
            estimatedMemoryUsageMB: 90,
            numberOfFiles: 2
          },
          wouldExecute: true
        }
      });

      const result = await cli.run(['node', 'datapilot', 'engineering', 'customers.csv', 'orders.csv', '--dry-run']);

      expect(result.success).toBe(true);
      expect(result.data.analysisPlan.multiFile).toBe(true);
      expect(result.data.resourceEstimates.numberOfFiles).toBe(2);
      expect(result.data.validationResults[1].warnings).toContain('Potential encoding issues detected');
    });
  });

  describe('Dry-Run Error Handling', () => {
    it('should handle file not found errors in dry-run', async () => {
      mockFs.existsSync.mockReturnValue(false);

      const mockValidateAndPreview = jest.spyOn(analyzer, 'validateAndPreview').mockResolvedValue({
        success: false,
        exitCode: 1,
        data: {
          dryRun: true,
          validationResults: [{
            filePath: 'missing.csv',
            valid: false,
            fileSize: 0,
            fileSizeMB: 0,
            estimatedProcessingTime: 0,
            estimatedMemoryUsage: 0,
            errors: ['File not found: missing.csv'],
            warnings: []
          }],
          analysisPlan: {
            command: 'all',
            sections: ['1', '2', '3', '4', '5', '6'],
            executionMode: 'sequential',
            multiFile: false,
            estimatedSteps: 6
          },
          resourceEstimates: {
            estimatedProcessingTimeMs: 0,
            estimatedMemoryUsageMB: 0,
            numberOfFiles: 1
          },
          wouldExecute: false
        },
        error: 'Validation failed for one or more input files',
        suggestions: [
          'Fix file validation issues shown above',
          'Check file paths and permissions'
        ]
      });

      const result = await cli.run(['node', 'datapilot', 'all', 'missing.csv', '--dry-run']);

      expect(result.success).toBe(false);
      expect(result.exitCode).toBe(1);
      expect(result.data.validationResults[0].errors).toContain('File not found: missing.csv');
      expect(result.data.wouldExecute).toBe(false);
    });

    it('should handle mixed validation results (some valid, some invalid)', async () => {
      const mockValidateAndPreview = jest.spyOn(analyzer, 'validateAndPreview').mockResolvedValue({
        success: false,
        exitCode: 1,
        data: {
          dryRun: true,
          validationResults: [
            {
              filePath: 'valid.csv',
              valid: true,
              format: 'csv',
              confidence: 0.95,
              fileSize: 2000000,
              fileSizeMB: 1.91,
              estimatedRows: 5000,
              columns: 6,
              hasHeader: true,
              estimatedProcessingTime: 1500,
              estimatedMemoryUsage: 50,
              errors: [],
              warnings: []
            },
            {
              filePath: 'invalid.csv',
              valid: false,
              fileSize: 0,
              fileSizeMB: 0,
              estimatedProcessingTime: 0,
              estimatedMemoryUsage: 0,
              errors: ['Empty file detected'],
              warnings: []
            }
          ],
          analysisPlan: {
            command: 'join',
            sections: ['5'],
            executionMode: 'multi-file',
            multiFile: true,
            estimatedSteps: 3
          },
          resourceEstimates: {
            estimatedProcessingTimeMs: 1500,
            estimatedMemoryUsageMB: 50,
            numberOfFiles: 2
          },
          wouldExecute: false
        },
        error: 'Validation failed for one or more input files'
      });

      const result = await cli.run(['node', 'datapilot', 'join', 'valid.csv', 'invalid.csv', '--dry-run']);

      expect(result.success).toBe(false);
      expect(result.data.validationResults).toHaveLength(2);
      expect(result.data.validationResults[0].valid).toBe(true);
      expect(result.data.validationResults[1].valid).toBe(false);
      expect(result.data.wouldExecute).toBe(false);
    });

    it('should handle analyzer errors in dry-run mode', async () => {
      const mockValidateAndPreview = jest.spyOn(analyzer, 'validateAndPreview').mockRejectedValue(
        new Error('Analysis engine error')
      );

      const result = await cli.run(['node', 'datapilot', 'all', 'test.csv', '--dry-run']);

      expect(result.success).toBe(false);
      expect(result.exitCode).toBe(1);
      expect(result.data.error).toContain('Analysis engine error');
    });
  });

  describe('Dry-Run Output and Display', () => {
    it('should show detailed dry-run results in non-quiet mode', async () => {
      const mockValidateAndPreview = jest.spyOn(analyzer, 'validateAndPreview').mockResolvedValue({
        success: true,
        exitCode: 0,
        data: {
          dryRun: true,
          validationResults: [{
            filePath: 'test.csv',
            valid: true,
            format: 'csv',
            confidence: 0.95,
            fileSize: 2000000,
            fileSizeMB: 1.91,
            estimatedRows: 5000,
            columns: 8,
            hasHeader: true,
            estimatedProcessingTime: 1500,
            estimatedMemoryUsage: 50,
            errors: [],
            warnings: []
          }],
          analysisPlan: {
            command: 'eda',
            sections: ['1', '2', '3'],
            executionMode: 'sequential',
            multiFile: false,
            estimatedSteps: 3
          },
          resourceEstimates: {
            estimatedProcessingTimeMs: 1500,
            estimatedMemoryUsageMB: 50,
            numberOfFiles: 1
          },
          wouldExecute: true
        }
      });

      const result = await cli.run(['node', 'datapilot', 'eda', 'test.csv', '--dry-run']);

      expect(result.success).toBe(true);
      expect(consoleLogSpy).toHaveBeenCalledWith('🔍 DRY RUN MODE - No analysis was performed');
      expect(consoleLogSpy).toHaveBeenCalledWith('='.repeat(60));
    });

    it('should suppress dry-run output in quiet mode', async () => {
      const mockValidateAndPreview = jest.spyOn(analyzer, 'validateAndPreview').mockResolvedValue({
        success: true,
        exitCode: 0,
        data: {
          dryRun: true,
          validationResults: [{
            filePath: 'test.csv',
            valid: true,
            format: 'csv',
            confidence: 0.95,
            fileSize: 1000000,
            fileSizeMB: 0.95,
            estimatedRows: 2000,
            columns: 5,
            hasHeader: true,
            estimatedProcessingTime: 800,
            estimatedMemoryUsage: 30,
            errors: [],
            warnings: []
          }],
          analysisPlan: {
            command: 'overview',
            sections: ['1'],
            executionMode: 'individual',
            multiFile: false,
            estimatedSteps: 1
          },
          resourceEstimates: {
            estimatedProcessingTimeMs: 800,
            estimatedMemoryUsageMB: 30,
            numberOfFiles: 1
          },
          wouldExecute: true
        }
      });

      const result = await cli.run(['node', 'datapilot', 'overview', 'test.csv', '--dry-run', '--quiet']);

      expect(result.success).toBe(true);
      expect(consoleLogSpy).not.toHaveBeenCalledWith('🔍 DRY RUN MODE - No analysis was performed');
    });
  });

  describe('Dry-Run Option Validation', () => {
    it('should handle dry-run with custom options', async () => {
      const mockValidateAndPreview = jest.spyOn(analyzer, 'validateAndPreview').mockResolvedValue({
        success: true,
        exitCode: 0,
        data: {
          dryRun: true,
          validationResults: [{
            filePath: 'semicolon.csv',
            valid: true,
            format: 'csv',
            confidence: 0.89,
            fileSize: 1500000,
            fileSizeMB: 1.43,
            estimatedRows: 3000,
            columns: 7,
            hasHeader: true,
            estimatedProcessingTime: 1200,
            estimatedMemoryUsage: 40,
            errors: [],
            warnings: ['Non-standard delimiter detected']
          }],
          analysisPlan: {
            command: 'quality',
            sections: ['1', '2'],
            executionMode: 'sequential',
            multiFile: false,
            estimatedSteps: 2
          },
          resourceEstimates: {
            estimatedProcessingTimeMs: 1200,
            estimatedMemoryUsageMB: 40,
            numberOfFiles: 1
          },
          wouldExecute: true
        }
      });

      const result = await cli.run(['node', 'datapilot', 'quality', 'semicolon.csv', '--dry-run', '--delimiter', ';', '--max-rows', '10000']);

      expect(result.success).toBe(true);
      expect(mockValidateAndPreview).toHaveBeenCalledWith(['semicolon.csv'], expect.objectContaining({
        command: 'quality',
        delimiter: ';',
        maxRows: 10000,
        dryRun: true
      }));
    });

    it('should validate dry-run mode is properly enabled', async () => {
      const mockValidateAndPreview = jest.spyOn(analyzer, 'validateAndPreview').mockResolvedValue({
        success: true,
        exitCode: 0,
        data: {
          dryRun: true,
          validationResults: [],
          analysisPlan: {},
          resourceEstimates: {},
          wouldExecute: true
        }
      });

      const result = await cli.run(['node', 'datapilot', 'overview', 'test.csv', '--dry-run']);

      expect(result.data.dryRun).toBe(true);
      expect(mockValidateAndPreview).toHaveBeenCalledWith(
        expect.any(Array),
        expect.objectContaining({ dryRun: true })
      );
    });
  });

  describe('Resource Estimates', () => {
    it('should provide accurate resource estimates for small files', async () => {
      const mockValidateAndPreview = jest.spyOn(analyzer, 'validateAndPreview').mockResolvedValue({
        success: true,
        exitCode: 0,
        data: {
          dryRun: true,
          validationResults: [{
            filePath: 'small.csv',
            valid: true,
            format: 'csv',
            confidence: 0.98,
            fileSize: 100000, // 100KB
            fileSizeMB: 0.1,
            estimatedRows: 500,
            columns: 4,
            hasHeader: true,
            estimatedProcessingTime: 300,
            estimatedMemoryUsage: 5,
            errors: [],
            warnings: []
          }],
          analysisPlan: {
            command: 'all',
            sections: ['1', '2', '3', '4', '5', '6'],
            executionMode: 'sequential',
            multiFile: false,
            estimatedSteps: 6
          },
          resourceEstimates: {
            estimatedProcessingTimeMs: 300,
            estimatedMemoryUsageMB: 5,
            numberOfFiles: 1
          },
          wouldExecute: true
        }
      });

      const result = await cli.run(['node', 'datapilot', 'all', 'small.csv', '--dry-run']);

      expect(result.success).toBe(true);
      expect(result.data.resourceEstimates.estimatedProcessingTimeMs).toBe(300);
      expect(result.data.resourceEstimates.estimatedMemoryUsageMB).toBe(5);
      expect(result.data.validationResults[0].fileSizeMB).toBe(0.1);
    });

    it('should provide accurate resource estimates for large files', async () => {
      const mockValidateAndPreview = jest.spyOn(analyzer, 'validateAndPreview').mockResolvedValue({
        success: true,
        exitCode: 0,
        data: {
          dryRun: true,
          validationResults: [{
            filePath: 'large.csv',
            valid: true,
            format: 'csv',
            confidence: 0.92,
            fileSize: 100000000, // 100MB
            fileSizeMB: 95.37,
            estimatedRows: 500000,
            columns: 15,
            hasHeader: true,
            estimatedProcessingTime: 25000,
            estimatedMemoryUsage: 250,
            errors: [],
            warnings: ['Large file detected - consider sampling']
          }],
          analysisPlan: {
            command: 'eda',
            sections: ['1', '2', '3'],
            executionMode: 'streaming',
            multiFile: false,
            estimatedSteps: 3
          },
          resourceEstimates: {
            estimatedProcessingTimeMs: 25000,
            estimatedMemoryUsageMB: 250,
            numberOfFiles: 1
          },
          wouldExecute: true
        }
      });

      const result = await cli.run(['node', 'datapilot', 'eda', 'large.csv', '--dry-run']);

      expect(result.success).toBe(true);
      expect(result.data.resourceEstimates.estimatedProcessingTimeMs).toBe(25000);
      expect(result.data.resourceEstimates.estimatedMemoryUsageMB).toBe(250);
      expect(result.data.validationResults[0].warnings).toContain('Large file detected - consider sampling');
    });
  });
});