import { Section1Analyzer, Section1Formatter } from '../../../src/analyzers/overview';
import { writeFileSync, unlinkSync, mkdtempSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('Section1Analyzer', () => {
  let tempDir: string;
  let tempFile: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'datapilot-section1-test-'));
    tempFile = join(tempDir, 'test.csv');
  });

  afterEach(() => {
    try {
      unlinkSync(tempFile);
    } catch (e) {
      // File might not exist
    }
  });

  describe('Basic Analysis', () => {
    it('should perform complete Section 1 analysis', async () => {
      const csvData = `name,age,city,salary
John Doe,28,London,75000
Jane Smith,32,"Paris, France",82000
Bob Johnson,45,New York,95000`;
      
      writeFileSync(tempFile, csvData, 'utf8');
      
      const analyzer = new Section1Analyzer({
        enableFileHashing: false, // Disable for faster testing
        includeHostEnvironment: true,
        privacyMode: 'minimal',
      });
      
      const result = await analyzer.analyze(tempFile);
      
      // Verify structure
      expect(result.overview).toBeDefined();
      expect(result.warnings).toBeDefined();
      expect(result.performanceMetrics).toBeDefined();
      
      // Verify file details
      expect(result.overview.fileDetails.originalFilename).toBe('test.csv');
      expect(result.overview.fileDetails.mimeType).toBe('text/csv');
      expect(result.overview.fileDetails.fileSizeMB).toBeGreaterThan(0);
      
      // Verify parsing metadata
      expect(result.overview.parsingMetadata.encoding.encoding).toBe('utf8');
      expect(result.overview.parsingMetadata.delimiter.delimiter).toBe(',');
      expect(result.overview.parsingMetadata.headerProcessing.headerPresence).toBe('Detected');
      
      // Verify structural dimensions
      expect(result.overview.structuralDimensions.totalDataRows).toBe(3);
      expect(result.overview.structuralDimensions.totalColumns).toBe(4);
      expect(result.overview.structuralDimensions.columnInventory).toHaveLength(4);
      expect(result.overview.structuralDimensions.columnInventory[0].name).toBe('name');
      
      // Verify execution context
      expect(result.overview.executionContext.fullCommandExecuted).toContain('datapilot all');
      expect(result.overview.executionContext.activatedModules).toContain('Advanced CSV Parser');
      
      // Verify performance metrics
      expect(result.performanceMetrics.totalAnalysisTime).toBeGreaterThan(0);
      expect(result.performanceMetrics.phases).toBeDefined();
    }, 10000);

    it('should handle files without headers', async () => {
      const csvData = `John,28,London
Jane,32,Paris
Bob,45,New York`;
      
      writeFileSync(tempFile, csvData, 'utf8');
      
      const analyzer = new Section1Analyzer({
        enableFileHashing: false,
        includeHostEnvironment: false,
      });
      
      const result = await analyzer.analyze(tempFile);
      
      expect(result.overview.structuralDimensions.totalDataRows).toBe(3);
      expect(result.overview.structuralDimensions.columnInventory[0].name).toBe('Col_0');
      expect(result.overview.parsingMetadata.headerProcessing.headerPresence).toBe('Not Detected');
    });

    it('should detect complex CSV features', async () => {
      const csvData = `"name","description","value"
"Smith, John","Person with ""quotes"" in description",123.45
"Jane O'Connor","Simple description",456.78`;
      
      writeFileSync(tempFile, csvData, 'utf8');
      
      const analyzer = new Section1Analyzer({
        enableFileHashing: false,
        includeHostEnvironment: false,
      });
      
      const result = await analyzer.analyze(tempFile);
      
      expect(result.overview.parsingMetadata.quotingCharacter).toBe('"');
      expect(result.overview.structuralDimensions.totalDataRows).toBe(3);
      expect(result.overview.structuralDimensions.totalColumns).toBe(3);
    });

    it('should analyze sparsity correctly', async () => {
      const csvData = `col1,col2,col3
value1,,value3
,value2,
value4,value5,value6`;
      
      writeFileSync(tempFile, csvData, 'utf8');
      
      const analyzer = new Section1Analyzer({
        enableFileHashing: false,
        includeHostEnvironment: false,
      });
      
      const result = await analyzer.analyze(tempFile);
      
      expect(result.overview.structuralDimensions.sparsityAnalysis.sparsityPercentage).toBeGreaterThan(0);
      expect(result.overview.structuralDimensions.sparsityAnalysis.description).toContain('sparse');
    });
  });

  describe('Configuration Options', () => {
    it('should respect privacy mode settings', async () => {
      const csvData = 'a,b,c\n1,2,3';
      writeFileSync(tempFile, csvData, 'utf8');
      
      // Test minimal privacy mode
      const analyzerMinimal = new Section1Analyzer({
        privacyMode: 'minimal',
        enableFileHashing: false,
      });
      
      const resultMinimal = await analyzerMinimal.analyze(tempFile);
      expect(resultMinimal.overview.fileDetails.fullResolvedPath).toBe('test.csv');
      
      // Test full privacy mode
      const analyzerFull = new Section1Analyzer({
        privacyMode: 'full',
        enableFileHashing: false,
      });
      
      const resultFull = await analyzerFull.analyze(tempFile);
      expect(resultFull.overview.fileDetails.fullResolvedPath).toContain(tempFile);
    });

    it('should handle quick analysis mode', async () => {
      const csvData = 'name,value\ntest,123\nother,456';
      writeFileSync(tempFile, csvData, 'utf8');
      
      const analyzer = new Section1Analyzer();
      const result = await analyzer.quickAnalyze(tempFile);
      
      expect(result.overview).toBeDefined();
      expect(result.overview.fileDetails.sha256Hash).toBe('disabled');
      expect(result.overview.executionContext.hostEnvironment).toBeUndefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle non-existent files gracefully', async () => {
      const analyzer = new Section1Analyzer();
      
      await expect(analyzer.analyze('/nonexistent/file.csv')).rejects.toThrow();
    });

    it('should handle empty files', async () => {
      writeFileSync(tempFile, '', 'utf8');
      
      const analyzer = new Section1Analyzer();
      
      await expect(analyzer.analyze(tempFile)).rejects.toThrow();
    });

    it('should validate configuration', () => {
      const analyzer = new Section1Analyzer({
        maxSampleSizeForSparsity: 50, // Too small
        privacyMode: 'invalid' as any,
      });
      
      const validation = analyzer.validateConfig();
      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Progress Tracking', () => {
    it('should report progress during analysis', async () => {
      const csvData = 'col1,col2\nvalue1,value2\nvalue3,value4';
      writeFileSync(tempFile, csvData, 'utf8');
      
      const progressUpdates: any[] = [];
      const analyzer = new Section1Analyzer({
        enableFileHashing: false,
      });
      
      analyzer.setProgressCallback((progress) => {
        progressUpdates.push(progress);
      });
      
      await analyzer.analyze(tempFile);
      
      expect(progressUpdates.length).toBeGreaterThan(0);
      expect(progressUpdates.some(p => p.phase === 'file-analysis')).toBe(true);
      expect(progressUpdates.some(p => p.phase === 'parsing')).toBe(true);
    });
  });
});

describe('Section1Formatter', () => {
  it('should format complete report correctly', async () => {
    const csvData = 'name,age\nJohn,25\nJane,30';
    const tempFile = join(tmpdir(), 'formatter-test.csv');
    writeFileSync(tempFile, csvData, 'utf8');
    
    try {
      const analyzer = new Section1Analyzer({
        enableFileHashing: false,
        includeHostEnvironment: true,
      });
      
      const result = await analyzer.analyze(tempFile);
      const formatter = new Section1Formatter();
      
      const report = formatter.formatReport(result);
      
      // Verify report structure
      expect(report).toContain('DATAPILOT COMPLETE ANALYSIS ENGINE');
      expect(report).toContain('Section 1: Comprehensive Dataset & Analysis Overview');
      expect(report).toContain('1.1. Input Data File Details');
      expect(report).toContain('1.2. Data Ingestion & Parsing Parameters');
      expect(report).toContain('1.3. Dataset Structural Dimensions');
      expect(report).toContain('1.4. Analysis Configuration & Execution Context');
      
      // Verify data accuracy
      expect(report).toContain('formatter-test.csv');
      expect(report).toContain('Total Rows of Data (excluding header): 2');
      expect(report).toContain('Total Columns Detected: 2');
      
      // Test summary format
      const summary = formatter.formatSummary(result);
      expect(summary).toContain('Dataset Summary');
      expect(summary).toContain('2 rows × 2 columns');
      
    } finally {
      unlinkSync(tempFile);
    }
  });
});