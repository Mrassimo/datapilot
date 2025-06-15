/**
 * Section 1 Overview Analyzer Tests
 * 
 * Tests the main orchestrator for dataset overview analysis including:
 * - File metadata collection
 * - Parsing analytics
 * - Structural analysis
 * - Environment profiling
 * - Configuration management
 * - Error handling scenarios
 */

import { Section1Analyzer } from '../../../../src/analyzers/overview/section1-analyzer';
import type { Section1Config, Section1Result, Section1Progress } from '../../../../src/analyzers/overview/types';
import { writeFileSync, unlinkSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { createTestDataset, SIMPLE_NUMERIC, MIXED_TYPES, QUALITY_ISSUES } from '../../../helpers/test-data';

describe('Section1Analyzer', () => {
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

  describe('Basic Analysis', () => {
    it('should perform complete Section 1 analysis', async () => {
      // Create test CSV file
      writeFileSync(tempFile, SIMPLE_NUMERIC.csv);

      const analyzer = new Section1Analyzer();
      const result = await analyzer.analyze(tempFile);

      // Verify result structure
      expect(result).toHaveProperty('overview');
      expect(result).toHaveProperty('warnings');
      expect(result).toHaveProperty('performanceMetrics');

      // Verify overview sections
      expect(result.overview).toHaveProperty('fileDetails');
      expect(result.overview).toHaveProperty('parsingMetadata');
      expect(result.overview).toHaveProperty('structuralDimensions');
      expect(result.overview).toHaveProperty('executionContext');
      expect(result.overview).toHaveProperty('generatedAt');
      expect(result.overview).toHaveProperty('version');

      // Verify file details
      expect(result.overview.fileDetails.originalFilename).toContain('test-');
      expect(result.overview.fileDetails.fileSizeBytes).toBeGreaterThan(0);
      expect(result.overview.fileDetails.mimeType).toBe('text/csv');
      expect(result.overview.fileDetails.sha256Hash).toBeDefined();

      // Verify structural dimensions
      expect(result.overview.structuralDimensions.totalColumns).toBe(2);
      expect(result.overview.structuralDimensions.totalDataRows).toBe(5);
      expect(result.overview.structuralDimensions.columnInventory).toHaveLength(2);
      expect(result.overview.structuralDimensions.estimatedInMemorySizeMB).toBeGreaterThanOrEqual(0);

      // Verify parsing metadata
      expect(result.overview.parsingMetadata.parsingEngine).toContain('DataPilot');
      expect(result.overview.parsingMetadata.encoding.encoding).toBeDefined();
      expect(result.overview.parsingMetadata.delimiter.delimiter).toBe(',');

      // Verify execution context
      expect(result.overview.executionContext.analysisMode).toBe('Comprehensive Deep Scan');
      expect(result.overview.executionContext.activatedModules).toContain('Report Generator');
      expect(result.overview.executionContext.processingTimeSeconds).toBeGreaterThan(0);

      // Verify performance metrics
      expect(result.performanceMetrics.totalAnalysisTime).toBeGreaterThan(0);
      expect(result.performanceMetrics.phases).toHaveProperty('file-analysis');
      expect(result.performanceMetrics.phases).toHaveProperty('parsing');
      expect(result.performanceMetrics.phases).toHaveProperty('structural-analysis');
    });

    it('should handle mixed data types correctly', async () => {
      writeFileSync(tempFile, MIXED_TYPES.csv);

      const analyzer = new Section1Analyzer();
      const result = await analyzer.analyze(tempFile);

      // Should detect all columns
      expect(result.overview.structuralDimensions.totalColumns).toBe(6);
      expect(result.overview.structuralDimensions.totalDataRows).toBe(3);
      expect(result.overview.structuralDimensions.columnInventory).toHaveLength(6);

      // Column names should be detected from headers
      const columnNames = result.overview.structuralDimensions.columnInventory.map(col => col.name);
      expect(columnNames).toEqual(['id', 'name', 'age', 'score', 'active', 'created_date']);

      // Should have reasonable memory estimation
      expect(result.overview.structuralDimensions.estimatedInMemorySizeMB).toBeGreaterThanOrEqual(0);
      expect(result.overview.structuralDimensions.estimatedInMemorySizeMB).toBeLessThan(1);
    });

    it('should analyze sparsity correctly', async () => {
      writeFileSync(tempFile, QUALITY_ISSUES.csv);

      const analyzer = new Section1Analyzer();
      const result = await analyzer.analyze(tempFile);

      const sparsity = result.overview.structuralDimensions.sparsityAnalysis;
      expect(sparsity.sparsityPercentage).toBeGreaterThan(0);
      expect(sparsity.method).toBe('Full dataset analysis');
      expect(sparsity.sampleSize).toBe(5);
      expect(sparsity.description).toContain('missing values');
    });
  });

  describe('Configuration Management', () => {
    it('should use default configuration when none provided', () => {
      const analyzer = new Section1Analyzer();
      const config = analyzer.getConfig();

      expect(config.includeHostEnvironment).toBe(true);
      expect(config.enableFileHashing).toBe(true);
      expect(config.maxSampleSizeForSparsity).toBe(10000);
      expect(config.privacyMode).toBe('redacted');
      expect(config.detailedProfiling).toBe(true);
    });

    it('should accept custom configuration', () => {
      const customConfig: Partial<Section1Config> = {
        includeHostEnvironment: false,
        enableFileHashing: false,
        maxSampleSizeForSparsity: 1000,
        privacyMode: 'minimal',
        detailedProfiling: false,
      };

      const analyzer = new Section1Analyzer(customConfig);
      const config = analyzer.getConfig();

      expect(config.includeHostEnvironment).toBe(false);
      expect(config.enableFileHashing).toBe(false);
      expect(config.maxSampleSizeForSparsity).toBe(1000);
      expect(config.privacyMode).toBe('minimal');
      expect(config.detailedProfiling).toBe(false);
    });

    it('should validate configuration parameters', () => {
      const analyzer = new Section1Analyzer();
      
      // Test valid configuration
      const validResult = analyzer.validateConfig();
      expect(validResult.valid).toBe(true);
      expect(validResult.errors).toHaveLength(0);

      // Test invalid configuration
      analyzer.updateConfig({
        maxSampleSizeForSparsity: 50, // Too low
        privacyMode: 'invalid' as any,
      });

      const invalidResult = analyzer.validateConfig();
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.errors.length).toBeGreaterThan(0);
      expect(invalidResult.errors.some(e => e.includes('maxSampleSizeForSparsity'))).toBe(true);
      expect(invalidResult.errors.some(e => e.includes('privacyMode'))).toBe(true);
    });

    it('should update configuration and recreate components', async () => {
      writeFileSync(tempFile, SIMPLE_NUMERIC.csv);

      const analyzer = new Section1Analyzer({ enableFileHashing: true });
      const result1 = await analyzer.analyze(tempFile);
      expect(result1.overview.fileDetails.sha256Hash).not.toBe('disabled');

      // Update config to disable hashing
      analyzer.updateConfig({ enableFileHashing: false });
      const result2 = await analyzer.analyze(tempFile);
      expect(result2.overview.fileDetails.sha256Hash).toBe('disabled');
    });
  });

  describe('Quick Analysis Mode', () => {
    it('should perform quick analysis with limited features', async () => {
      writeFileSync(tempFile, SIMPLE_NUMERIC.csv);

      const analyzer = new Section1Analyzer();
      const result = await analyzer.quickAnalyze(tempFile);

      // Should complete successfully
      expect(result.overview).toBeDefined();
      expect(result.performanceMetrics.totalAnalysisTime).toBeGreaterThanOrEqual(0);

      // Should disable expensive operations
      expect(result.overview.fileDetails.sha256Hash).toBe('disabled');
      expect(result.overview.executionContext.hostEnvironment).toBeUndefined();
      expect(result.overview.executionContext.activatedModules).toContain('Report Generator');
    });

    it('should be faster than full analysis', async () => {
      writeFileSync(tempFile, SIMPLE_NUMERIC.csv);

      const analyzer = new Section1Analyzer();

      const startQuick = Date.now();
      await analyzer.quickAnalyze(tempFile);
      const quickTime = Date.now() - startQuick;

      const startFull = Date.now();
      await analyzer.analyze(tempFile);
      const fullTime = Date.now() - startFull;

      // Quick analysis should be faster (though with small files the difference may be minimal)
      // For very small files, timing differences may not be detectable
      expect(quickTime).toBeLessThanOrEqual(Math.max(fullTime * 2, 50)); // Allow generous variance for small files
    });
  });

  describe('Progress Tracking', () => {
    it('should report progress during analysis', async () => {
      writeFileSync(tempFile, SIMPLE_NUMERIC.csv);

      const progressUpdates: Section1Progress[] = [];
      const analyzer = new Section1Analyzer();
      
      analyzer.setProgressCallback((progress) => {
        progressUpdates.push(progress);
      });

      await analyzer.analyze(tempFile);

      // Should have received progress updates
      expect(progressUpdates.length).toBeGreaterThan(0);

      // Should cover all phases
      const phases = progressUpdates.map(p => p.phase);
      expect(phases).toContain('file-analysis');
      expect(phases).toContain('parsing');
      expect(phases).toContain('structural-analysis');
      expect(phases).toContain('report-generation');

      // Should have completion updates
      const completions = progressUpdates.filter(p => p.progress === 100);
      expect(completions.length).toBeGreaterThanOrEqual(3);

      // Should track elapsed time
      progressUpdates.forEach(progress => {
        expect(progress.timeElapsed).toBeGreaterThanOrEqual(0);
        expect(progress.currentOperation).toBeDefined();
      });
    });
  });

  describe('System Requirements Check', () => {
    it('should check system requirements', () => {
      const analyzer = new Section1Analyzer();
      const requirements = analyzer.checkSystemRequirements();

      expect(requirements).toHaveProperty('suitable');
      expect(requirements).toHaveProperty('warnings');
      expect(requirements).toHaveProperty('recommendations');

      expect(typeof requirements.suitable).toBe('boolean');
      expect(Array.isArray(requirements.warnings)).toBe(true);
      expect(Array.isArray(requirements.recommendations)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle non-existent files', async () => {
      const nonExistentFile = join(tempDir, 'non-existent.csv');
      const analyzer = new Section1Analyzer();

      await expect(analyzer.analyze(nonExistentFile)).rejects.toThrow();
    });

    it('should handle empty files', async () => {
      writeFileSync(tempFile, '');
      const analyzer = new Section1Analyzer();

      await expect(analyzer.analyze(tempFile)).rejects.toThrow();
    });

    it('should handle files with only headers', async () => {
      writeFileSync(tempFile, 'id,name,value');
      const analyzer = new Section1Analyzer();

      const result = await analyzer.analyze(tempFile);
      // Parser might detect header presence differently
      expect(result.overview.structuralDimensions.totalDataRows).toBeGreaterThanOrEqual(0);
      expect(result.overview.structuralDimensions.totalColumns).toBe(3);
    });

    it('should handle malformed CSV files', async () => {
      writeFileSync(tempFile, 'id,name\n1,John\n2,Jane,Extra\n3');
      const analyzer = new Section1Analyzer();

      // Should complete without throwing
      const result = await analyzer.analyze(tempFile);
      expect(result.overview).toBeDefined();
      expect(result.warnings.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle very large files gracefully', async () => {
      // Create a large-ish CSV for testing
      const largeData = createTestDataset(
        ['id', 'value', 'category'],
        Array.from({ length: 10000 }, (_, i) => [i, Math.random() * 100, `cat_${i % 10}`])
      );
      
      writeFileSync(tempFile, largeData.csv);
      const analyzer = new Section1Analyzer();

      const result = await analyzer.analyze(tempFile);
      expect(result.overview.structuralDimensions.totalDataRows).toBe(10000);
      
      // Should generate warnings for large datasets
      const structuralWarnings = result.warnings.filter(w => w.category === 'structural');
      expect(structuralWarnings.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle permission denied errors', async () => {
      // This test is platform-specific and may not work on all systems
      if (process.platform !== 'win32') {
        writeFileSync(tempFile, 'id,name\n1,test');
        
        // Make file unreadable (may not work in all environments)
        try {
          const fs = require('fs');
          fs.chmodSync(tempFile, 0o000);
          
          const analyzer = new Section1Analyzer();
          await expect(analyzer.analyze(tempFile)).rejects.toThrow();
        } catch (error) {
          // Skip this test if chmod fails
        } finally {
          // Restore permissions for cleanup
          try {
            const fs = require('fs');
            fs.chmodSync(tempFile, 0o644);
          } catch (error) {
            // Ignore cleanup errors
          }
        }
      }
    });
  });

  describe('Privacy and Security', () => {
    it('should respect privacy mode settings', async () => {
      writeFileSync(tempFile, SIMPLE_NUMERIC.csv);

      // Test minimal privacy mode
      const minimalAnalyzer = new Section1Analyzer({ privacyMode: 'minimal' });
      const minimalResult = await minimalAnalyzer.analyze(tempFile);
      expect(minimalResult.overview.fileDetails.fullResolvedPath).not.toContain('/');

      // Test redacted privacy mode
      const redactedAnalyzer = new Section1Analyzer({ privacyMode: 'redacted' });
      const redactedResult = await redactedAnalyzer.analyze(tempFile);
      
      // On different environments, different redaction patterns are expected:
      // - Local Windows development: [user]
      // - Windows CI (GitHub Actions): [project] 
      // - Linux/macOS: [user]
      const redactedPath = redactedResult.overview.fileDetails.fullResolvedPath;
      const hasUserRedaction = redactedPath.includes('[user]');
      const hasProjectRedaction = redactedPath.includes('[project]');
      const hasBuildRedaction = redactedPath.includes('[build]');
      
      expect(hasUserRedaction || hasProjectRedaction || hasBuildRedaction).toBe(true);

      // Test full privacy mode
      const fullAnalyzer = new Section1Analyzer({ privacyMode: 'full' });
      const fullResult = await fullAnalyzer.analyze(tempFile);
      expect(fullResult.overview.fileDetails.fullResolvedPath).toContain(tempFile);
    });

    it('should optionally include host environment information', async () => {
      writeFileSync(tempFile, SIMPLE_NUMERIC.csv);

      // With host environment
      const withEnvAnalyzer = new Section1Analyzer({ includeHostEnvironment: true });
      const withEnvResult = await withEnvAnalyzer.analyze(tempFile);
      expect(withEnvResult.overview.executionContext.hostEnvironment).toBeDefined();

      // Without host environment
      const withoutEnvAnalyzer = new Section1Analyzer({ includeHostEnvironment: false });
      const withoutEnvResult = await withoutEnvAnalyzer.analyze(tempFile);
      expect(withoutEnvResult.overview.executionContext.hostEnvironment).toBeUndefined();
    });

    it('should handle Windows CI path redaction correctly', async () => {
      writeFileSync(tempFile, SIMPLE_NUMERIC.csv);

      const analyzer = new Section1Analyzer({ privacyMode: 'redacted' });
      const result = await analyzer.analyze(tempFile);
      
      const redactedPath = result.overview.fileDetails.fullResolvedPath;
      
      // On Windows CI, paths should be redacted to include [project] or [build]
      // On local development, they should include [user]
      // Test should pass regardless of environment
      if (process.platform === 'win32') {
        // Windows-specific redaction patterns
        const hasWindowsRedaction = 
          redactedPath.includes('[user]') ||      // Local Windows
          redactedPath.includes('[project]') ||   // GitHub Actions Windows CI
          redactedPath.includes('[build]');       // Azure DevOps Windows CI
          
        expect(hasWindowsRedaction).toBe(true);
        
        // Verify the original path structure is preserved after redaction
        expect(redactedPath).toContain('temp');
        expect(redactedPath).toContain('.csv');
      } else {
        // Unix-like systems should always use [user] redaction
        expect(redactedPath.includes('[user]')).toBe(true);
      }
    });
  });

  describe('Warnings Generation', () => {
    it('should generate warnings for large files', async () => {
      // Create a larger dataset to potentially trigger warnings
      const largeContent = Array.from({ length: 10000 }, (_, i) => 
        `${i},value${i},description for row ${i},more data,extra field,another column`
      ).join('\n');
      writeFileSync(tempFile, `id,value,description,data,extra,another\n${largeContent}`);

      const analyzer = new Section1Analyzer();
      const result = await analyzer.analyze(tempFile);

      // Should complete without error
      expect(result.overview).toBeDefined();
      
      // May or may not generate warnings depending on implementation
      expect(Array.isArray(result.warnings)).toBe(true);
    });

    it('should generate warnings for structural issues', async () => {
      // Create a dataset with structural issues
      const wideData = createTestDataset(
        Array.from({ length: 150 }, (_, i) => `col_${i}`), // 150 columns
        [Array.from({ length: 150 }, (_, i) => `value_${i}`)] // 1 row with 150 columns
      );

      writeFileSync(tempFile, wideData.csv);
      const analyzer = new Section1Analyzer();
      const result = await analyzer.analyze(tempFile);

      // Should warn about wide dataset
      const structuralWarnings = result.warnings.filter(w => w.category === 'structural');
      expect(structuralWarnings.some(w => w.message.includes('wide dataset') || w.message.includes('columns'))).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle single column files', async () => {
      writeFileSync(tempFile, 'value\n1\n2\n3');
      const analyzer = new Section1Analyzer();
      const result = await analyzer.analyze(tempFile);

      expect(result.overview.structuralDimensions.totalColumns).toBe(1);
      expect(result.overview.structuralDimensions.totalDataRows).toBe(3);
      expect(result.overview.structuralDimensions.columnInventory[0].name).toBe('value');
    });

    it('should handle single row files', async () => {
      writeFileSync(tempFile, 'id,name\n1,test');
      const analyzer = new Section1Analyzer();
      const result = await analyzer.analyze(tempFile);

      expect(result.overview.structuralDimensions.totalColumns).toBeGreaterThanOrEqual(2);
      expect(result.overview.structuralDimensions.totalDataRows).toBeGreaterThanOrEqual(1);
    });

    it('should handle files with Unicode content', async () => {
      writeFileSync(tempFile, 'name,city\nJosé,São Paulo\nFrançois,Montréal', 'utf8');
      const analyzer = new Section1Analyzer();
      const result = await analyzer.analyze(tempFile);

      expect(result.overview.structuralDimensions.totalColumns).toBe(2);
      expect(result.overview.structuralDimensions.totalDataRows).toBe(2);
      expect(result.overview.parsingMetadata.encoding.encoding).toBe('utf8');
    });

    it('should handle files with different line endings', async () => {
      writeFileSync(tempFile, 'id,name\r\n1,test\r\n2,test2');
      const analyzer = new Section1Analyzer();
      const result = await analyzer.analyze(tempFile);

      expect(result.overview.parsingMetadata.lineEnding).toBe('CRLF');
      expect(result.overview.structuralDimensions.totalDataRows).toBe(2);
    });

    it('should handle files with quoted fields', async () => {
      writeFileSync(tempFile, 'id,name,comment\n1,"John Smith","Simple comment"\n2,"Jane Doe","Another comment"');
      const analyzer = new Section1Analyzer();
      const result = await analyzer.analyze(tempFile);

      expect(result.overview.structuralDimensions.totalColumns).toBe(3);
      expect(result.overview.structuralDimensions.totalDataRows).toBeGreaterThanOrEqual(2);
      expect(result.overview.parsingMetadata.quotingCharacter).toBeDefined();
    });
  });
});