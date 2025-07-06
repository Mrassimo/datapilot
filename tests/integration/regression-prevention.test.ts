/**
 * Regression Prevention Integration Tests
 * 
 * Ensures that changes to DataPilot don't break existing functionality.
 * These tests validate that all core features continue to work as expected.
 */

import { promises as fs } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { DataPilotCLI } from '../../src/cli';
import type { CLIResult } from '../../src/cli/types';

describe('Regression Prevention', () => {
  let tempDir: string;
  let standardCsvPath: string;
  let complexCsvPath: string;
  let cli: DataPilotCLI;
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeAll(async () => {
    // Create temporary directory for test files
    tempDir = await fs.mkdtemp(join(tmpdir(), 'datapilot-regression-test-'));
    standardCsvPath = join(tempDir, 'standard.csv');
    complexCsvPath = join(tempDir, 'complex.csv');
    
    // Create standard test data (mimics original DataPilot test data)
    const standardData = [
      'id,name,age,department,salary,active,hire_date',
      '1,"John Doe",28,Engineering,75000,true,2020-01-15',
      '2,"Jane Smith",32,Marketing,68000,true,2019-03-22',
      '3,"Bob Johnson",45,Sales,82000,false,2018-07-10',
      '4,"Alice Brown",29,Engineering,79000,true,2021-02-01',
      '5,"Charlie Wilson",38,HR,65000,true,2017-11-05'
    ].join('\n');
    
    // Create complex test data with edge cases
    const complexData = [
      'id,description,price,category,tags,metadata,updated_at',
      '1,"Product with \"quotes\"",19.99,Electronics,"tag1,tag2","{\"key\": \"value\"}",2023-01-15T10:30:00Z',
      '2,"Product\nwith\nnewlines",29.50,Books,"fiction,mystery","{\"pages\": 300}",2023-02-20T15:45:30Z',
      '3,"Product, with, commas",99.00,Home & Garden,"outdoor,furniture","{\"weight\": \"25kg\"}",2023-03-10T08:15:00Z',
      '4,"Product with emoji 🚀",15.75,Toys,"space,educational","{\"age\": \"8+\"}",2023-04-05T12:00:00Z',
      '5,"Long description that goes on and on and contains lots of text to test parsing with very long field values that might cause issues with certain parsers",5.99,Miscellaneous,"long,text,description","{\"length\": \"very long\"}",2023-05-12T20:30:45Z'
    ].join('\n');
    
    await fs.writeFile(standardCsvPath, standardData, 'utf8');
    await fs.writeFile(complexCsvPath, complexData, 'utf8');
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

  describe('Core Command Compatibility', () => {
    it('should maintain overview command functionality', async () => {
      const result = await cli.run(['node', 'datapilot', 'overview', standardCsvPath]);
      
      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
      expect(result.data.overview).toBeDefined();
      expect(result.data.overview.fileDetails).toBeDefined();
      expect(result.data.overview.parsingMetadata).toBeDefined();
      expect(result.data.overview.structuralDimensions).toBeDefined();
      
      // Verify structure matches expected schema
      expect(result.data.overview.fileDetails.originalFilename).toBe('standard.csv');
      expect(result.data.overview.structuralDimensions.totalDataRows).toBe(5);
      expect(result.data.overview.structuralDimensions.totalColumns).toBe(7);
    });

    it('should maintain quality command functionality', async () => {
      const result = await cli.run(['node', 'datapilot', 'quality', standardCsvPath]);
      
      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
      expect(result.data.quality).toBeDefined();
      expect(result.data.quality.completeness).toBeDefined();
      expect(result.data.quality.uniqueness).toBeDefined();
      expect(result.data.quality.validity).toBeDefined();
      
      // Verify quality metrics are calculated
      expect(result.data.quality.completeness.overallCompleteness).toBeGreaterThan(0);
      expect(result.data.quality.uniqueness.overallUniqueness).toBeGreaterThan(0);
    });

    it('should maintain eda command functionality', async () => {
      const result = await cli.run(['node', 'datapilot', 'eda', standardCsvPath]);
      
      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
      expect(result.data.eda).toBeDefined();
      expect(result.data.eda.univariate).toBeDefined();
      expect(result.data.eda.bivariate).toBeDefined();
      
      // Verify statistical analysis is performed
      expect(Object.keys(result.data.eda.univariate).length).toBeGreaterThan(0);
    });

    it('should maintain visualisation command functionality', async () => {
      const result = await cli.run(['node', 'datapilot', 'visualisation', standardCsvPath]);
      
      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
      expect(result.data.visualisation).toBeDefined();
      expect(result.data.visualisation.recommendations).toBeDefined();
      
      // Verify visualisation recommendations are generated
      expect(result.data.visualisation.recommendations.length).toBeGreaterThan(0);
    });

    it('should maintain engineering command functionality', async () => {
      const result = await cli.run(['node', 'datapilot', 'engineering', standardCsvPath]);
      
      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
      expect(result.data.engineering).toBeDefined();
      expect(result.data.engineering.schemaOptimisation).toBeDefined();
      expect(result.data.engineering.featureEngineering).toBeDefined();
      
      // Verify engineering analysis is performed
      expect(result.data.engineering.schemaOptimisation.recommendations).toBeDefined();
    });

    it('should maintain modelling command functionality', async () => {
      const result = await cli.run(['node', 'datapilot', 'modelling', standardCsvPath]);
      
      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
      expect(result.data.modelling).toBeDefined();
      expect(result.data.modelling.algorithmRecommendations).toBeDefined();
      
      // Verify modelling recommendations are generated
      expect(result.data.modelling.algorithmRecommendations.length).toBeGreaterThan(0);
    });

    it('should maintain all command functionality', async () => {
      const result = await cli.run(['node', 'datapilot', 'all', standardCsvPath]);
      
      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
      
      // Should have all sections
      expect(result.data.overview).toBeDefined();
      expect(result.data.quality).toBeDefined();
      expect(result.data.eda).toBeDefined();
      expect(result.data.visualisation).toBeDefined();
      expect(result.data.engineering).toBeDefined();
      expect(result.data.modelling).toBeDefined();
      
      // Verify each section has expected structure
      expect(result.data.overview.fileDetails).toBeDefined();
      expect(result.data.quality.completeness).toBeDefined();
      expect(result.data.eda.univariate).toBeDefined();
      expect(result.data.visualisation.recommendations).toBeDefined();
      expect(result.data.engineering.schemaOptimisation).toBeDefined();
      expect(result.data.modelling.algorithmRecommendations).toBeDefined();
    });
  });

  describe('Output Format Compatibility', () => {
    it('should maintain markdown output format', async () => {
      const outputPath = join(tempDir, 'regression-markdown.md');
      const result = await cli.run([
        'node', 'datapilot', 'overview', standardCsvPath,
        '--output', 'markdown',
        '--output-file', outputPath
      ]);
      
      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
      
      // Verify output file was created
      expect(await fs.access(outputPath).then(() => true).catch(() => false)).toBe(true);
      
      // Verify content structure
      const content = await fs.readFile(outputPath, 'utf8');
      expect(content).toContain('# DataPilot Analysis Report');
      expect(content).toContain('## Section 1: Overview');
      expect(content).toContain('### File Details');
      
      // Cleanup
      await fs.unlink(outputPath);
    });

    it('should maintain JSON output format', async () => {
      const outputPath = join(tempDir, 'regression-json.json');
      const result = await cli.run([
        'node', 'datapilot', 'overview', standardCsvPath,
        '--output', 'json',
        '--output-file', outputPath
      ]);
      
      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
      
      // Verify output file was created
      expect(await fs.access(outputPath).then(() => true).catch(() => false)).toBe(true);
      
      // Verify JSON structure
      const content = await fs.readFile(outputPath, 'utf8');
      expect(() => JSON.parse(content)).not.toThrow();
      
      const parsed = JSON.parse(content);
      expect(parsed.overview).toBeDefined();
      expect(parsed.overview.fileDetails).toBeDefined();
      
      // Cleanup
      await fs.unlink(outputPath);
    });
  });

  describe('CLI Flag Compatibility', () => {
    it('should maintain verbose flag functionality', async () => {
      const result = await cli.run(['node', 'datapilot', 'overview', standardCsvPath, '--verbose']);
      
      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
      expect(result.metadata.verbose).toBe(true);
    });

    it('should maintain quiet flag functionality', async () => {
      const result = await cli.run(['node', 'datapilot', 'overview', standardCsvPath, '--quiet']);
      
      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
      expect(result.metadata.quiet).toBe(true);
      
      // Should not have logged normal output messages
      expect(consoleLogSpy).not.toHaveBeenCalledWith(expect.stringContaining('DataPilot Analysis'));
    });

    it('should maintain force flag functionality', async () => {
      const result = await cli.run(['node', 'datapilot', 'overview', standardCsvPath, '--force']);
      
      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
      expect(result.metadata.force).toBe(true);
    });

    it('should maintain confidence flag functionality', async () => {
      const result = await cli.run(['node', 'datapilot', 'overview', standardCsvPath, '--confidence', '0.8']);
      
      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
      expect(result.metadata.confidenceThreshold).toBe(0.8);
    });
  });

  describe('Complex Data Handling', () => {
    it('should handle complex CSV data correctly', async () => {
      const result = await cli.run(['node', 'datapilot', 'overview', complexCsvPath]);
      
      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
      expect(result.data.overview).toBeDefined();
      
      // Should correctly parse CSV with quotes, commas, newlines
      expect(result.data.overview.structuralDimensions.totalDataRows).toBe(5);
      expect(result.data.overview.structuralDimensions.totalColumns).toBe(7);
    });

    it('should handle quality analysis with complex data', async () => {
      const result = await cli.run(['node', 'datapilot', 'quality', complexCsvPath]);
      
      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
      expect(result.data.quality).toBeDefined();
      
      // Should analyse all columns despite complex content
      expect(Object.keys(result.data.quality.completeness.columnCompleteness).length).toBe(7);
    });
  });

  describe('Error Handling Consistency', () => {
    it('should handle file not found errors consistently', async () => {
      const result = await cli.run(['node', 'datapilot', 'overview', 'nonexistent.csv']);
      
      expect(result.success).toBe(false);
      expect(result.exitCode).toBe(1);
      expect(result.error).toContain('not found');
      expect(result.suggestions).toBeDefined();
      expect(result.suggestions.length).toBeGreaterThan(0);
    });

    it('should handle invalid command errors consistently', async () => {
      const result = await cli.run(['node', 'datapilot', 'invalid-command', standardCsvPath]);
      
      expect(result.success).toBe(false);
      expect(result.exitCode).toBe(1);
      expect(result.error).toContain('Unknown command');
    });

    it('should handle missing arguments consistently', async () => {
      const result = await cli.run(['node', 'datapilot', 'overview']);
      
      expect(result.success).toBe(false);
      expect(result.exitCode).toBe(1);
      expect(result.error).toContain('No input files');
    });
  });

  describe('Performance Characteristics', () => {
    it('should maintain reasonable performance for standard operations', async () => {
      const startTime = Date.now();
      const result = await cli.run(['node', 'datapilot', 'overview', standardCsvPath]);
      const endTime = Date.now();
      
      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
      
      const durationMs = endTime - startTime;
      // Overview should complete in under 10 seconds for small files
      expect(durationMs).toBeLessThan(10000);
    });

    it('should maintain memory efficiency', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      const result = await cli.run(['node', 'datapilot', 'all', standardCsvPath]);
      
      expect(result.success).toBe(true);
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      const memoryIncreaseMB = memoryIncrease / (1024 * 1024);
      
      // Should not use excessive memory for small files
      expect(memoryIncreaseMB).toBeLessThan(50);
    });
  });

  describe('Metadata Consistency', () => {
    it('should maintain consistent metadata structure', async () => {
      const result = await cli.run(['node', 'datapilot', 'overview', standardCsvPath]);
      
      expect(result.success).toBe(true);
      expect(result.metadata).toBeDefined();
      expect(result.metadata.command).toBe('overview');
      expect(result.metadata.timestamp).toBeDefined();
      expect(result.metadata.version).toBeDefined();
      expect(result.metadata.filePaths).toContain(standardCsvPath);
    });

    it('should maintain performance metrics structure', async () => {
      const result = await cli.run(['node', 'datapilot', 'overview', standardCsvPath]);
      
      expect(result.success).toBe(true);
      expect(result.data.performanceMetrics).toBeDefined();
      expect(result.data.performanceMetrics.totalAnalysisTime).toBeGreaterThan(0);
      expect(result.data.performanceMetrics.peakMemoryUsage).toBeGreaterThan(0);
      expect(result.data.performanceMetrics.phases).toBeDefined();
    });
  });

  describe('Australian English Consistency', () => {
    it('should maintain Australian English in all outputs', async () => {
      const result = await cli.run(['node', 'datapilot', 'all', standardCsvPath]);
      
      expect(result.success).toBe(true);
      
      // Check various sections for Australian English
      const dataString = JSON.stringify(result.data);
      
      // Should use 'analyse' not 'analyze'
      expect(dataString.toLowerCase()).not.toMatch(/\banalyze\b/);
      
      // Should use 'optimise' not 'optimize'
      expect(dataString.toLowerCase()).not.toMatch(/\boptimize\b/);
      
      // Should use 'visualisation' not 'visualization'
      expect(dataString.toLowerCase()).not.toMatch(/\bvisualization\b/);
      
      // Should use 'colour' not 'color' where applicable
      if (dataString.toLowerCase().includes('color')) {
        // Allow technical terms like 'colormap' but flag generic 'color'
        const colorMatches = dataString.toLowerCase().match(/\bcolor\b/g);
        if (colorMatches && colorMatches.length > 0) {
          console.warn(`Found American spelling 'color' in output`);
        }
      }
    });
  });

  describe('Backwards Compatibility', () => {
    it('should maintain API compatibility for result structure', async () => {
      const result = await cli.run(['node', 'datapilot', 'overview', standardCsvPath]);
      
      expect(result.success).toBe(true);
      
      // Core structure should remain the same
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('exitCode');
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('metadata');
      
      // Overview specific structure
      expect(result.data.overview).toHaveProperty('fileDetails');
      expect(result.data.overview).toHaveProperty('parsingMetadata');
      expect(result.data.overview).toHaveProperty('structuralDimensions');
      expect(result.data.overview).toHaveProperty('executionContext');
    });

    it('should maintain compatibility for all sections', async () => {
      const result = await cli.run(['node', 'datapilot', 'all', standardCsvPath]);
      
      expect(result.success).toBe(true);
      
      // All sections should be present with expected structure
      const expectedSections = ['overview', 'quality', 'eda', 'visualisation', 'engineering', 'modelling'];
      
      for (const section of expectedSections) {
        expect(result.data).toHaveProperty(section);
        expect(result.data[section]).toBeDefined();
        expect(typeof result.data[section]).toBe('object');
      }
    });
  });
});
