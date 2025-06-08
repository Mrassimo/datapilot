import { Section2Formatter } from '../../src/analyzers/quality/section2-formatter';
import { Section3Formatter } from '../../src/analyzers/eda/section3-formatter';
import { Section4Formatter } from '../../src/analyzers/visualization/section4-formatter';
import { writeFileSync, unlinkSync, mkdtempSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('Section Formatters', () => {
  let tempDir: string;
  let tempFile: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'datapilot-formatters-test-'));
    tempFile = join(tempDir, 'test.csv');
  });

  afterEach(() => {
    try {
      unlinkSync(tempFile);
    } catch (e) {
      // File might not exist
    }
  });

  describe('Section2Formatter - Data Quality', () => {
    it('should format complete quality report in markdown', async () => {
      const csvData = `id,name,email,age
1,John,john@example.com,25
2,Jane,,30
3,Bob,bob@invalid,
4,Alice,alice@test.com,35`;
      
      writeFileSync(tempFile, csvData, 'utf8');
      
      // Import and use the analyzer to get real data
      const { Section2Analyzer } = await import('../../src/analyzers/quality');
      const analyzer = new Section2Analyzer();
      const result = await analyzer.analyze(tempFile);
      
      const formatter = new Section2Formatter();
      const report = formatter.formatReport(result);
      
      // Verify markdown structure
      expect(report).toContain('# Section 2: Data Quality & Integrity Audit');
      expect(report).toContain('## 2.1. Completeness Analysis');
      expect(report).toContain('## 2.2. Data Type Conformity Assessment');
      expect(report).toContain('## 2.3. Uniqueness & Duplicate Detection');
      expect(report).toContain('## 2.4. Data Consistency & Validity Patterns');
      
      // Verify data accuracy
      expect(report).toContain('Missing Value Rate');
      expect(report).toContain('email');
      expect(report).toContain('25%'); // Should show missing percentage
      
      // Verify formatting elements
      expect(report).toContain('**');
      expect(report).toContain('|'); // Tables
      expect(report).toContain('---'); // Table separators
    });

    it('should format JSON output correctly', async () => {
      const csvData = `col1,col2\nval1,val2\nval3,`;
      writeFileSync(tempFile, csvData, 'utf8');
      
      const { Section2Analyzer } = await import('../../src/analyzers/quality');
      const analyzer = new Section2Analyzer();
      const result = await analyzer.analyze(tempFile);
      
      const formatter = new Section2Formatter();
      const jsonOutput = formatter.formatJSON(result);
      
      const parsed = JSON.parse(jsonOutput);
      expect(parsed).toHaveProperty('section');
      expect(parsed).toHaveProperty('summary');
      expect(parsed).toHaveProperty('completenessAnalysis');
      expect(parsed).toHaveProperty('typeConformity');
      expect(parsed).toHaveProperty('uniquenessAnalysis');
      expect(parsed).toHaveProperty('consistencyPatterns');
      
      // Verify nested structure
      expect(parsed.summary).toHaveProperty('totalFieldsAnalyzed');
      expect(parsed.summary).toHaveProperty('overallQualityScore');
    });

    it('should format YAML output correctly', async () => {
      const csvData = `test,data\n1,2\n3,4`;
      writeFileSync(tempFile, csvData, 'utf8');
      
      const { Section2Analyzer } = await import('../../src/analyzers/quality');
      const analyzer = new Section2Analyzer();
      const result = await analyzer.analyze(tempFile);
      
      const formatter = new Section2Formatter();
      const yamlOutput = formatter.formatYAML(result);
      
      expect(yamlOutput).toContain('section:');
      expect(yamlOutput).toContain('summary:');
      expect(yamlOutput).toContain('totalFieldsAnalyzed:');
      expect(yamlOutput).toContain('overallQualityScore:');
      
      // Should be valid YAML (no parsing errors)
      expect(() => require('yaml').parse(yamlOutput)).not.toThrow();
    });

    it('should format executive summary', async () => {
      const csvData = `important,data\nvalue1,100\nvalue2,200`;
      writeFileSync(tempFile, csvData, 'utf8');
      
      const { Section2Analyzer } = await import('../../src/analyzers/quality');
      const analyzer = new Section2Analyzer();
      const result = await analyzer.analyze(tempFile);
      
      const formatter = new Section2Formatter();
      const summary = formatter.formatSummary(result);
      
      expect(summary).toContain('Data Quality Summary');
      expect(summary).toContain('Overall Quality Score');
      expect(summary).toContain('Key Findings');
      expect(summary).toContain('Recommendations');
      
      // Should be concise
      expect(summary.length).toBeLessThan(1000);
    });
  });

  describe('Section3Formatter - EDA', () => {
    it('should format complete EDA report in markdown', async () => {
      const csvData = `numeric1,numeric2,categorical
1,10,A
2,20,B
3,30,A
4,40,C
5,50,B`;
      
      writeFileSync(tempFile, csvData, 'utf8');
      
      const { Section3Analyzer } = await import('../../src/analyzers/eda');
      const analyzer = new Section3Analyzer();
      const result = await analyzer.analyze(tempFile);
      
      const formatter = new Section3Formatter();
      const report = formatter.formatReport(result);
      
      // Verify markdown structure
      expect(report).toContain('# Section 3: Exploratory Data Analysis (EDA)');
      expect(report).toContain('## 3.1. Univariate Analysis');
      expect(report).toContain('## 3.2. Bivariate Analysis');
      expect(report).toContain('## 3.3. Correlation Analysis');
      expect(report).toContain('## 3.4. Distribution Analysis');
      
      // Verify statistical content
      expect(report).toContain('Mean');
      expect(report).toContain('Standard Deviation');
      expect(report).toContain('Quartiles');
      expect(report).toContain('Correlation');
      
      // Verify categorical analysis
      expect(report).toContain('categorical');
      expect(report).toContain('Frequency Distribution');
    });

    it('should format statistical tables correctly', async () => {
      const csvData = `values\n1\n2\n3\n4\n5\n6\n7\n8\n9\n10`;
      writeFileSync(tempFile, csvData, 'utf8');
      
      const { Section3Analyzer } = await import('../../src/analyzers/eda');
      const analyzer = new Section3Analyzer();
      const result = await analyzer.analyze(tempFile);
      
      const formatter = new Section3Formatter();
      const report = formatter.formatReport(result);
      
      // Should contain properly formatted tables
      expect(report).toContain('| Statistic');
      expect(report).toContain('| Value |');
      expect(report).toContain('|---|---|');
      
      // Should have proper number formatting
      expect(report).toMatch(/\d+\.\d{2}/); // Decimal places
    });

    it('should handle different data types appropriately', async () => {
      const csvData = `integer,float,text,boolean
1,1.5,hello,true
2,2.5,world,false
3,3.5,test,true`;
      
      writeFileSync(tempFile, csvData, 'utf8');
      
      const { Section3Analyzer } = await import('../../src/analyzers/eda');
      const analyzer = new Section3Analyzer();
      const result = await analyzer.analyze(tempFile);
      
      const formatter = new Section3Formatter();
      const report = formatter.formatReport(result);
      
      // Should handle numeric columns with statistics
      expect(report).toContain('integer');
      expect(report).toContain('float');
      
      // Should handle categorical columns differently
      expect(report).toContain('text');
      expect(report).toContain('boolean');
      expect(report).toContain('Unique Values');
    });
  });

  describe('Section4Formatter - Visualization', () => {
    it('should format complete visualization report', async () => {
      const csvData = `category,value1,value2
A,10,100
B,20,200
C,30,300
A,15,150
B,25,250`;
      
      writeFileSync(tempFile, csvData, 'utf8');
      
      const { Section4Analyzer } = await import('../../src/analyzers/visualization');
      const analyzer = new Section4Analyzer();
      const result = await analyzer.analyze(tempFile);
      
      const formatter = new Section4Formatter();
      const report = formatter.formatReport(result);
      
      // Verify structure
      expect(report).toContain('# Section 4: Visualization Intelligence & Recommendations');
      expect(report).toContain('## 4.1. Recommended Chart Types');
      expect(report).toContain('## 4.2. Data Summaries for Visualization');
      expect(report).toContain('## 4.3. Advanced Visualization Strategies');
      
      // Should recommend appropriate charts
      expect(report).toContain('Bar Chart');
      expect(report).toContain('Scatter Plot');
      expect(report).toMatch(/histogram|distribution/i);
    });

    it('should include data summaries for charts', async () => {
      const csvData = `x,y\n1,2\n2,4\n3,6\n4,8\n5,10`;
      writeFileSync(tempFile, csvData, 'utf8');
      
      const { Section4Analyzer } = await import('../../src/analyzers/visualization');
      const analyzer = new Section4Analyzer();
      const result = await analyzer.analyze(tempFile);
      
      const formatter = new Section4Formatter();
      const report = formatter.formatReport(result);
      
      // Should include summarized data for visualization
      expect(report).toContain('Data Summary');
      expect(report).toContain('x');
      expect(report).toContain('y');
      
      // Should provide chart-specific recommendations
      expect(report).toMatch(/scatter.*plot/i);
      expect(report).toMatch(/correlation/i);
    });

    it('should recommend appropriate chart libraries', async () => {
      const csvData = `data\n1\n2\n3\n4\n5`;
      writeFileSync(tempFile, csvData, 'utf8');
      
      const { Section4Analyzer } = await import('../../src/analyzers/visualization');
      const analyzer = new Section4Analyzer();
      const result = await analyzer.analyze(tempFile);
      
      const formatter = new Section4Formatter();
      const report = formatter.formatReport(result);
      
      // Should recommend visualization tools/libraries
      expect(report).toMatch(/matplotlib|seaborn|plotly|ggplot/i);
      expect(report).toContain('Recommended Tools');
    });
  });

  describe('Cross-Formatter Consistency', () => {
    it('should maintain consistent markdown formatting across sections', async () => {
      const csvData = `test,data\n1,a\n2,b\n3,c`;
      writeFileSync(tempFile, csvData, 'utf8');
      
      // Get formatters for different sections
      const { Section2Analyzer } = await import('../../src/analyzers/quality');
      const { Section3Analyzer } = await import('../../src/analyzers/eda');
      
      const section2Analyzer = new Section2Analyzer();
      const section3Analyzer = new Section3Analyzer();
      
      const section2Result = await section2Analyzer.analyze(tempFile);
      const section3Result = await section3Analyzer.analyze(tempFile);
      
      const section2Formatter = new Section2Formatter();
      const section3Formatter = new Section3Formatter();
      
      const section2Report = section2Formatter.formatReport(section2Result);
      const section3Report = section3Formatter.formatReport(section3Result);
      
      // Both should use consistent heading levels
      expect(section2Report).toMatch(/^# Section 2:/m);
      expect(section3Report).toMatch(/^# Section 3:/m);
      
      // Both should use consistent table formatting
      const section2Tables = section2Report.match(/\|.*\|/g) || [];
      const section3Tables = section3Report.match(/\|.*\|/g) || [];
      
      expect(section2Tables.length).toBeGreaterThan(0);
      expect(section3Tables.length).toBeGreaterThan(0);
      
      // Table separators should be consistent
      expect(section2Report).toMatch(/\|[-:]+\|/);
      expect(section3Report).toMatch(/\|[-:]+\|/);
    });

    it('should maintain consistent JSON structure across sections', async () => {
      const csvData = `col1,col2\nval1,val2\nval3,val4`;
      writeFileSync(tempFile, csvData, 'utf8');
      
      const { Section2Analyzer } = await import('../../src/analyzers/quality');
      const { Section3Analyzer } = await import('../../src/analyzers/eda');
      
      const section2Analyzer = new Section2Analyzer();
      const section3Analyzer = new Section3Analyzer();
      
      const section2Result = await section2Analyzer.analyze(tempFile);
      const section3Result = await section3Analyzer.analyze(tempFile);
      
      const section2Formatter = new Section2Formatter();
      const section3Formatter = new Section3Formatter();
      
      const section2JSON = JSON.parse(section2Formatter.formatJSON(section2Result));
      const section3JSON = JSON.parse(section3Formatter.formatJSON(section3Result));
      
      // Both should have consistent top-level structure
      expect(section2JSON).toHaveProperty('section');
      expect(section2JSON).toHaveProperty('summary');
      expect(section3JSON).toHaveProperty('section');
      expect(section3JSON).toHaveProperty('summary');
      
      // Section identifiers should be correct
      expect(section2JSON.section).toBe('Section 2: Data Quality & Integrity Audit');
      expect(section3JSON.section).toBe('Section 3: Exploratory Data Analysis (EDA)');
    });
  });

  describe('Formatter Error Handling', () => {
    it('should handle empty or minimal results gracefully', async () => {
      const csvData = `single\nvalue`;
      writeFileSync(tempFile, csvData, 'utf8');
      
      const { Section2Analyzer } = await import('../../src/analyzers/quality');
      const analyzer = new Section2Analyzer();
      const result = await analyzer.analyze(tempFile);
      
      // Artificially create minimal result
      const minimalResult = {
        ...result,
        completenessAnalysis: { fieldCompleteness: [] },
        typeConformity: { fieldTypeAnalysis: [] }
      };
      
      const formatter = new Section2Formatter();
      
      expect(() => formatter.formatReport(minimalResult)).not.toThrow();
      expect(() => formatter.formatJSON(minimalResult)).not.toThrow();
      expect(() => formatter.formatYAML(minimalResult)).not.toThrow();
    });

    it('should handle special characters and encoding properly', async () => {
      const csvData = `special,chars\n"quotes",apostrophe's\néàü,unicode☃\n<html>,&amp;`;
      writeFileSync(tempFile, csvData, 'utf8');
      
      const { Section3Analyzer } = await import('../../src/analyzers/eda');
      const analyzer = new Section3Analyzer();
      const result = await analyzer.analyze(tempFile);
      
      const formatter = new Section3Formatter();
      const report = formatter.formatReport(result);
      
      // Should handle special characters without breaking
      expect(report).toContain('special');
      expect(report).toContain('chars');
      
      // Should properly escape markdown special characters
      expect(report).not.toContain('<html>');
      expect(report).toMatch(/&lt;html&gt;|\<html\>/);
    });

    it('should handle very large numbers and precision', async () => {
      const csvData = `large,precise\n1234567890123,3.141592653589793\n9876543210987,2.718281828459045`;
      writeFileSync(tempFile, csvData, 'utf8');
      
      const { Section3Analyzer } = await import('../../src/analyzers/eda');
      const analyzer = new Section3Analyzer();
      const result = await analyzer.analyze(tempFile);
      
      const formatter = new Section3Formatter();
      const report = formatter.formatReport(result);
      
      // Should format large numbers appropriately
      expect(report).toMatch(/1\.23e\+12|1,234,567,890,123/);
      
      // Should handle precision appropriately
      expect(report).toMatch(/3\.14|3\.142/);
    });
  });

  describe('Formatter Performance', () => {
    it('should format large results efficiently', async () => {
      // Create a dataset that will generate substantial results
      let csvData = 'id';
      for (let i = 1; i <= 20; i++) {
        csvData += `,col${i}`;
      }
      csvData += '\n';
      
      for (let row = 0; row < 100; row++) {
        csvData += `${row}`;
        for (let col = 1; col <= 20; col++) {
          csvData += `,${Math.random() * 1000}`;
        }
        csvData += '\n';
      }
      
      writeFileSync(tempFile, csvData, 'utf8');
      
      const { Section3Analyzer } = await import('../../src/analyzers/eda');
      const analyzer = new Section3Analyzer();
      const result = await analyzer.analyze(tempFile);
      
      const formatter = new Section3Formatter();
      
      const startTime = Date.now();
      const report = formatter.formatReport(result);
      const endTime = Date.now();
      
      expect(report).toBeDefined();
      expect(report.length).toBeGreaterThan(1000);
      expect(endTime - startTime).toBeLessThan(5000); // Should format in under 5 seconds
    }, 10000);
  });

  describe('Format-Specific Features', () => {
    it('should include metadata in appropriate formats', async () => {
      const csvData = `metadata,test\nvalue1,100\nvalue2,200`;
      writeFileSync(tempFile, csvData, 'utf8');
      
      const { Section2Analyzer } = await import('../../src/analyzers/quality');
      const analyzer = new Section2Analyzer();
      const result = await analyzer.analyze(tempFile);
      
      const formatter = new Section2Formatter();
      
      // Markdown should include human-readable metadata
      const mdReport = formatter.formatReport(result);
      expect(mdReport).toContain('Generated');
      expect(mdReport).toMatch(/\d{4}-\d{2}-\d{2}/);
      
      // JSON should include structured metadata
      const jsonReport = JSON.parse(formatter.formatJSON(result));
      expect(jsonReport).toHaveProperty('metadata');
      expect(jsonReport.metadata).toHaveProperty('generatedAt');
      expect(jsonReport.metadata).toHaveProperty('version');
    });

    it('should provide appropriate level of detail for each format', async () => {
      const csvData = `detailed,analysis\ntest1,100\ntest2,200\ntest3,300`;
      writeFileSync(tempFile, csvData, 'utf8');
      
      const { Section3Analyzer } = await import('../../src/analyzers/eda');
      const analyzer = new Section3Analyzer();
      const result = await analyzer.analyze(tempFile);
      
      const formatter = new Section3Formatter();
      
      const summary = formatter.formatSummary(result);
      const fullReport = formatter.formatReport(result);
      const jsonReport = formatter.formatJSON(result);
      
      // Summary should be much shorter than full report
      expect(summary.length).toBeLessThan(fullReport.length / 2);
      
      // JSON should preserve all data without formatting
      expect(jsonReport.length).toBeGreaterThan(summary.length);
      
      // Full report should be the most comprehensive
      expect(fullReport).toContain('Mean');
      expect(fullReport).toContain('Standard Deviation');
      expect(fullReport).toContain('detailed');
    });
  });
});
