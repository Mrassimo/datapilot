import { StreamingAnalyzer } from '../../../src/analyzers/streaming/streaming-analyzer';
import { Section3Formatter } from '../../../src/analyzers/eda/section3-formatter';
import { writeFileSync, unlinkSync, mkdtempSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('Section3Analyzer (Streaming)', () => {
  let tempDir: string;
  let tempFile: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'datapilot-section3-test-'));
    tempFile = join(tempDir, 'test-eda.csv');
  });

  afterEach(() => {
    try {
      unlinkSync(tempFile);
    } catch (e) {
      // File might not exist
    }
  });

  describe('Deterministic Analysis', () => {
    it('should produce consistent results with seeded random sampling', async () => {
      const csvData = `id,value,category,attendance_percentage
1,10.5,A,85.2
2,15.2,B,92.1
3,10.5,A,78.9
4,20.0,A,95.5
5,,B,
6,25.3,C,88.7`;
      writeFileSync(tempFile, csvData, 'utf8');

      const analyzer1 = new StreamingAnalyzer({ maxRowsAnalyzed: 100 });
      const result1 = await analyzer1.analyzeFile(tempFile);

      const analyzer2 = new StreamingAnalyzer({ maxRowsAnalyzed: 100 });
      const result2 = await analyzer2.analyzeFile(tempFile);

      // Results should be identical due to seeded sampling
      expect(result1.edaAnalysis.univariateAnalysis).toHaveLength(4);
      expect(result2.edaAnalysis.univariateAnalysis).toHaveLength(4);

      // Check specific statistical values are consistent
      const valueAnalysis1 = result1.edaAnalysis.univariateAnalysis.find(a => a.columnName === 'value') as any;
      const valueAnalysis2 = result2.edaAnalysis.univariateAnalysis.find(a => a.columnName === 'value') as any;

      expect(valueAnalysis1?.descriptiveStats?.mean).toBe(valueAnalysis2?.descriptiveStats?.mean);
      expect(valueAnalysis1?.quantileStats?.medianAbsoluteDeviation).toBe(valueAnalysis2?.quantileStats?.medianAbsoluteDeviation);
    });

    it('should correctly infer semantic types and avoid misclassification', async () => {
      const csvData = `age,attendance_percentage,average_score,damage_assessment
25,85.2,78.5,15.3
30,92.1,82.1,8.7
28,78.9,91.2,22.1`;
      writeFileSync(tempFile, csvData, 'utf8');

      const analyzer = new StreamingAnalyzer({ maxRowsAnalyzed: 100 });
      const result = await analyzer.analyzeFile(tempFile);
      
      // Cleanup analyzer (no explicit cleanup method, rely on global cleanup)

      const ageColumn = result.edaAnalysis.univariateAnalysis.find(a => a.columnName === 'age');
      const attendanceColumn = result.edaAnalysis.univariateAnalysis.find(a => a.columnName === 'attendance_percentage');
      const averageColumn = result.edaAnalysis.univariateAnalysis.find(a => a.columnName === 'average_score');
      const damageColumn = result.edaAnalysis.univariateAnalysis.find(a => a.columnName === 'damage_assessment');

      // Age should be correctly identified as AGE
      expect(ageColumn?.inferredSemanticType).toBe('age');

      // attendance_percentage should NOT be classified as AGE
      expect(attendanceColumn?.inferredSemanticType).toBe('percentage');
      expect(attendanceColumn?.inferredSemanticType).not.toBe('age');

      // average_score should NOT be classified as AGE
      expect(averageColumn?.inferredSemanticType).not.toBe('age');

      // damage_assessment should NOT be classified as AGE
      expect(damageColumn?.inferredSemanticType).not.toBe('age');
    });
  });

  describe('Bivariate Analysis Correctness', () => {
    it('should compute correct group statistics for numerical vs categorical analysis', async () => {
      const csvData = `gender,age,category
Female,25,A
Female,30,A
Male,35,B
Male,40,B
Female,28,A`;
      writeFileSync(tempFile, csvData, 'utf8');

      const analyzer = new StreamingAnalyzer({ maxRowsAnalyzed: 100 });
      const result = await analyzer.analyzeFile(tempFile);
      
      // Cleanup analyzer (no explicit cleanup method, rely on global cleanup)

      const numCatAnalysis = result.edaAnalysis.bivariateAnalysis.numericalVsCategorical;
      expect(numCatAnalysis).toHaveLength(2); // gender by age, category by age

      // Find the gender by age analysis
      const genderAgeAnalysis = numCatAnalysis.find(
        analysis => analysis.categoricalVariable.includes('gender') || analysis.numericalVariable.includes('age')
      );

      expect(genderAgeAnalysis).toBeDefined();
      expect(genderAgeAnalysis!.groupComparisons).toHaveLength(2); // Female, Male

      // Statistics should NOT be zeros
      const femaleStats = genderAgeAnalysis!.groupComparisons.find(g => g.category === 'Female');
      const maleStats = genderAgeAnalysis!.groupComparisons.find(g => g.category === 'Male');

      expect(femaleStats?.mean).toBeGreaterThan(0);
      expect(maleStats?.mean).toBeGreaterThan(0);
      expect(femaleStats?.standardDeviation).toBeGreaterThanOrEqual(0);
      expect(maleStats?.standardDeviation).toBeGreaterThanOrEqual(0);

      // Sanity check: Female mean should be around (25+30+28)/3 = 27.67
      expect(femaleStats?.mean).toBeCloseTo(27.67, 1);
      // Male mean should be around (35+40)/2 = 37.5
      expect(maleStats?.mean).toBeCloseTo(37.5, 1);
    });
  });

  describe('Memory Efficiency', () => {
    it('should handle large datasets without memory explosion', async () => {
      // Generate a larger dataset to test memory efficiency
      const rows = [];
      rows.push('id,value,category,status');
      for (let i = 1; i <= 1000; i++) {
        const value = Math.random() * 100;
        const category = ['A', 'B', 'C'][i % 3];
        const status = i % 2 === 0 ? 'active' : 'inactive';
        rows.push(`${i},${value.toFixed(2)},${category},${status}`);
      }
      writeFileSync(tempFile, rows.join('\n'), 'utf8');

      const analyzer = new StreamingAnalyzer({ maxRowsAnalyzed: 1000 });
      const result = await analyzer.analyzeFile(tempFile);

      expect(result.edaAnalysis.univariateAnalysis).toHaveLength(4);
      expect(result.edaAnalysis.bivariateAnalysis.numericalVsCategorical.length).toBeGreaterThan(0);

      // Verify that analysis completed successfully for large dataset
      const valueAnalysis = result.edaAnalysis.univariateAnalysis.find(a => a.columnName === 'value');
      expect(valueAnalysis?.totalValues).toBeGreaterThanOrEqual(998); // Allow for parsing variations and header exclusion
      expect(valueAnalysis?.missingValues).toBeLessThanOrEqual(1); // Allow for header parsing edge case
    });
  });

  describe('Edge Cases', () => {
    it('should handle columns with all missing values', async () => {
      const csvData = `col1,col2,col3
value1,,
value2,,
value3,,`;
      writeFileSync(tempFile, csvData, 'utf8');

      const analyzer = new StreamingAnalyzer({ maxRowsAnalyzed: 100 });
      const result = await analyzer.analyzeFile(tempFile);
      
      // Cleanup analyzer (no explicit cleanup method, rely on global cleanup)

      const col2Analysis = result.edaAnalysis.univariateAnalysis.find(a => a.columnName === 'col2');
      expect(col2Analysis?.missingValues).toBe(3);
      expect(col2Analysis?.dataQualityFlag).toBe('Poor');

      // Should handle empty column gracefully - may or may not generate warnings
      expect(result.edaAnalysis.univariateAnalysis.some(a => a.columnName === 'col2')).toBe(true);
    });

    it('should handle mixed data types in same column', async () => {
      const csvData = `mixed_col
123
text_value
456.78
another_text
789`;
      writeFileSync(tempFile, csvData, 'utf8');

      const analyzer = new StreamingAnalyzer({ maxRowsAnalyzed: 100 });
      const result = await analyzer.analyzeFile(tempFile);
      
      // Cleanup analyzer (no explicit cleanup method, rely on global cleanup)

      const mixedAnalysis = result.edaAnalysis.univariateAnalysis.find(a => a.columnName === 'mixed_col');
      expect(mixedAnalysis).toBeDefined();
      // Should likely be classified as text due to mixed content
      expect(['text_general', 'categorical']).toContain(mixedAnalysis?.detectedDataType);
    });
  });
});

describe('Section3Formatter', () => {
  it('should generate complete EDA report with consistent structure', async () => {
    const csvData = `name,age,department,salary
John,25,Engineering,75000
Jane,30,Marketing,68000
Bob,35,Engineering,82000
Alice,28,Sales,71000`;
    const tempFile = join(tmpdir(), 'formatter-test.csv');
    writeFileSync(tempFile, csvData, 'utf8');

    try {
      const analyzer = new StreamingAnalyzer({ maxRowsAnalyzed: 100 });
      const result = await analyzer.analyzeFile(tempFile);
      
      // Cleanup analyzer (no explicit cleanup method, rely on global cleanup)

      const report = Section3Formatter.formatSection3(result);

      // Test the formatter with a snapshot
      expect(report).toContain('### **Section 3: Exploratory Data Analysis (EDA) Deep Dive**');
      expect(report).toContain('**3.1. EDA Methodology Overview:**');
      expect(report).toContain('**3.2. Univariate Analysis (Per-Column In-Depth Profile):**');
      expect(report).toContain('bivariate'); // Check for bivariate analysis content

      // Check for specific column analysis
      expect(report).toContain('**Column: `age`**');
      expect(report).toContain('**Column: `department`**');
      expect(report).toContain('**Column: `salary`**');

      // Check for statistical content
      expect(report).toContain('Mean');
      expect(report).toContain('Standard Deviation');
      expect(report).toContain('Missing Values');

      // Verify bivariate analysis content (flexible check)
      const lowerReport = report.toLowerCase();
      expect(lowerReport.includes('bivariate') || lowerReport.includes('correlation')).toBe(true);

    } finally {
      unlinkSync(tempFile);
    }
  });

  it('should handle analysis results with warnings appropriately', async () => {
    const csvData = `col1,empty_col,mixed_col
value1,,123
value2,,text
value3,,456`;
    const tempFile = join(tmpdir(), 'warning-test.csv');
    writeFileSync(tempFile, csvData, 'utf8');

    try {
      const analyzer = new StreamingAnalyzer({ maxRowsAnalyzed: 100 });
      const result = await analyzer.analyzeFile(tempFile);
      
      // Cleanup analyzer (no explicit cleanup method, rely on global cleanup)

      const report = Section3Formatter.formatSection3(result);

      // Report should be generated successfully regardless of warnings
      expect(report).toContain('### **Section 3: Exploratory Data Analysis (EDA) Deep Dive**');
      expect(report.length).toBeGreaterThan(100); // Should have substantial content

    } finally {
      unlinkSync(tempFile);
    }
  });
});