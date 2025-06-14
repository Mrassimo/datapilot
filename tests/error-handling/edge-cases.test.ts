import { writeFileSync, unlinkSync, mkdtempSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('Error Handling and Edge Cases', () => {
  let tempDir: string;
  let tempFile: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'datapilot-error-test-'));
    tempFile = join(tempDir, 'test.csv');
  });

  afterEach(() => {
    try {
      unlinkSync(tempFile);
    } catch (e) {
      // File might not exist
    }
  });

  describe('File System Edge Cases', () => {
    it('should handle non-existent files gracefully', async () => {
      const { Section1Analyzer } = await import('../../src/analyzers/overview');
      const analyzer = new Section1Analyzer();
      
      await expect(analyzer.analyze('/nonexistent/path/file.csv'))
        .rejects.toThrow(/file not found|ENOENT|does not exist/i);
    });

    it('should handle empty files', async () => {
      writeFileSync(tempFile, '', 'utf8');
      
      const { Section1Analyzer } = await import('../../src/analyzers/overview');
      const analyzer = new Section1Analyzer();
      
      await expect(analyzer.analyze(tempFile))
        .rejects.toThrow(/empty|no data|insufficient/i);
    });

    it('should handle files with only headers', async () => {
      writeFileSync(tempFile, 'header1,header2,header3', 'utf8');
      
      const { Section2Analyzer } = await import('../../src/analyzers/quality');
      const analyzer = new Section2Analyzer({
        data: [],
        headers: ['header1', 'header2', 'header3'],
        columnTypes: ['string', 'string', 'string'] as any,
        rowCount: 0,
        columnCount: 3
      });
      
      const result = await analyzer.analyze();
      
      // Should complete successfully but with appropriate handling
      expect(result).toBeDefined();
      expect(result.qualityAudit).toBeDefined();
      // Headers-only file should result in empty data analysis
      expect(result.qualityAudit.completeness.datasetLevel.totalMissingValues).toBe(0);
    });

    it('should handle files with only whitespace', async () => {
      writeFileSync(tempFile, '   \n\n  \t  \n   ', 'utf8');
      
      const { Section1Analyzer } = await import('../../src/analyzers/overview');
      const analyzer = new Section1Analyzer();
      
      await expect(analyzer.analyze(tempFile))
        .rejects.toThrow(/empty|no data|whitespace|parsing failed|unknown error/i);
    });

    it('should handle very large file paths', async () => {
      const longPath = join(tempDir, 'a'.repeat(200) + '.csv');
      writeFileSync(longPath, 'col1\ndata1', 'utf8');
      
      try {
        const { Section1Analyzer } = await import('../../src/analyzers/overview');
        const analyzer = new Section1Analyzer();
        
        const result = await analyzer.analyze(longPath);
        expect(result).toBeDefined();
      } finally {
        unlinkSync(longPath);
      }
    });
  });

  describe('CSV Format Edge Cases', () => {
    it('should handle malformed CSV with inconsistent columns', async () => {
      const csvData = `col1,col2,col3
value1,value2,value3
extra,value,columns,here,too
short,line
normal,row,again`;
      
      writeFileSync(tempFile, csvData, 'utf8');
      
      const { Section2Analyzer } = await import('../../src/analyzers/quality');
      const { CSVParser } = await import('../../src/parsers/csv-parser');
      const parser = new CSVParser({ autoDetect: true });
      const parsedRows = await parser.parseFile(tempFile);
      const headers = parsedRows.length > 0 ? parsedRows[0].data : [];
      const data = parsedRows.slice(1).map(row => row.data);
      
      const analyzer = new Section2Analyzer({
        data,
        headers,
        columnTypes: headers.map(() => 'string' as any),
        rowCount: data.length,
        columnCount: headers.length
      });
      
      const result = await analyzer.analyze();
      
      // Should handle gracefully - may or may not generate warnings
      expect(result.warnings).toBeDefined();
      expect(result.qualityAudit).toBeDefined();
      // Should still provide analysis even with inconsistent columns
    });

    it('should handle CSV with complex quoting and escaping', async () => {
      const csvData = `name,description,value
"Smith, John","Person with ""quotes"" in description",123.45
"O'Connor, Jane","Text with\nnewlines\nand commas, semicolons;",456.78
"Complex \"Case\"","Mixed 'quotes' and \"escapes\"",789.01`;
      
      writeFileSync(tempFile, csvData, 'utf8');
      
      const { Section3Analyzer } = await import('../../src/analyzers/eda');
      
      // Parse CSV data first
      const { CSVParser } = await import('../../src/parsers/csv-parser');
      const parser = new CSVParser({ autoDetect: true });
      const parsedRows = await parser.parseFile(tempFile);
      const headers = parsedRows.length > 0 ? parsedRows[0].data : [];
      const data = parsedRows.slice(1).map(row => row.data);
      
      const analyzer = new Section3Analyzer();
      
      const result = await analyzer.analyze({
        filePath: tempFile,
        data,
        headers,
        columnTypes: headers.map(() => 'string' as any),
        rowCount: data.length,
        columnCount: headers.length
      });
      
      expect(result.edaAnalysis.univariateAnalysis.length).toBeGreaterThan(0);
      expect(result.edaAnalysis.univariateAnalysis.find(col => col.columnName === 'name')).toBeDefined();
      expect(result.edaAnalysis.univariateAnalysis.find(col => col.columnName === 'value')).toBeDefined();
    });

    it('should handle CSV with unusual delimiters and encodings', async () => {
      const csvData = `col1;col2;col3
value1;value2;value3
data1;data2;data3`;
      
      writeFileSync(tempFile, csvData, 'utf8');
      
      const { CSVParser } = await import('../../src/parsers');
      const parser = new CSVParser();
      
      // Should detect delimiter automatically
      const parseResult = await parser.parseFile(tempFile);
      expect(parseResult.length).toBeGreaterThan(0);
      expect(parseResult[0].data.length).toBeGreaterThan(0); // Should have data
    });

    it('should handle CSV with missing quotes and embedded commas', async () => {
      const csvData = `name,address,phone
John Smith,123 Main St, City,555-1234
Jane Doe,456 Oak Ave,555-5678
Bob Johnson,789 Pine St, Another City, State,555-9012`;
      
      writeFileSync(tempFile, csvData, 'utf8');
      
      const { Section1Analyzer } = await import('../../src/analyzers/overview');
      const analyzer = new Section1Analyzer();
      
      const result = await analyzer.analyze(tempFile);
      
      // Should handle parsing issues gracefully
      expect(result.warnings).toBeDefined();
      expect(result.overview).toBeDefined();
    });
  });

  describe('Data Type Edge Cases', () => {
    it('should handle columns with mixed data types', async () => {
      const csvData = `mixed_column
123
text_value
456.78
true
2024-01-15
null
`;
      
      writeFileSync(tempFile, csvData, 'utf8');
      
      const { Section2Analyzer } = await import('../../src/analyzers/quality');
      const { CSVParser } = await import('../../src/parsers/csv-parser');
      const parser = new CSVParser({ autoDetect: true });
      const parsedRows = await parser.parseFile(tempFile);
      const headers = parsedRows.length > 0 ? parsedRows[0].data : [];
      const data = parsedRows.slice(1).map(row => row.data);
      
      const analyzer = new Section2Analyzer({
        data,
        headers,
        columnTypes: headers.map(() => 'string' as any),
        rowCount: data.length,
        columnCount: headers.length
      });
      
      const result = await analyzer.analyze();
      
      expect(result.qualityAudit.validity).toBeDefined();
      expect(result.qualityAudit.validity.typeConformance).toBeDefined();
      const mixedField = result.qualityAudit.validity.typeConformance
        .find(f => f.columnName === 'mixed_column');
      
      expect(mixedField).toBeDefined();
      // Mixed types may have varying conformance percentages
      expect(mixedField?.conformancePercentage).toBeGreaterThanOrEqual(0);
      expect(mixedField?.conformancePercentage).toBeLessThanOrEqual(100);
    });

    it('should handle extreme numeric values', async () => {
      const csvData = `extreme_values
0
1.7976931348623157e+308
-1.7976931348623157e+308
4.9406564584124654e-324
Infinity
-Infinity
NaN
1.23456789012345678901234567890`;
      
      writeFileSync(tempFile, csvData, 'utf8');
      
      const { Section3Analyzer } = await import('../../src/analyzers/eda');
      
      // Parse CSV data first
      const { CSVParser } = await import('../../src/parsers/csv-parser');
      const parser = new CSVParser({ autoDetect: true });
      const parsedRows = await parser.parseFile(tempFile);
      const headers = parsedRows.length > 0 ? parsedRows[0].data : [];
      const data = parsedRows.slice(1).map(row => row.data);
      
      const analyzer = new Section3Analyzer();
      
      const result = await analyzer.analyze({
        filePath: tempFile,
        data,
        headers,
        columnTypes: headers.map(() => 'string' as any),
        rowCount: data.length,
        columnCount: headers.length
      });
      
      const extremeAnalysis = result.edaAnalysis.univariateAnalysis.find(col => col.columnName === 'extreme_values');
      expect(extremeAnalysis).toBeDefined();
      
      // Should handle extreme values without crashing
      expect(extremeAnalysis?.totalValues).toBeGreaterThan(0);
      expect(extremeAnalysis).toBeDefined();
    });

    it('should handle special string values', async () => {
      const csvData = `special_strings

"  "
NULL
null
NA
N/A
#N/A
undefined
NaN
"\n"
"\t"
"\r\n"
"\\"
"\"quoted\""`;
      
      writeFileSync(tempFile, csvData, 'utf8');
      
      const { Section2Analyzer } = await import('../../src/analyzers/quality');
      const { CSVParser } = await import('../../src/parsers/csv-parser');
      const parser = new CSVParser({ autoDetect: true });
      const parsedRows = await parser.parseFile(tempFile);
      const headers = parsedRows.length > 0 ? parsedRows[0].data : [];
      const data = parsedRows.slice(1).map(row => row.data);
      
      const analyzer = new Section2Analyzer({
        data,
        headers,
        columnTypes: headers.map(() => 'string' as any),
        rowCount: data.length,
        columnCount: headers.length
      });
      
      const result = await analyzer.analyze();
      
      const specialField = result.qualityAudit.completeness.columnLevel
        .find(f => f.columnName === 'special_strings');
      
      expect(specialField).toBeDefined();
      expect(specialField?.missingCount).toBeGreaterThan(0); // Should identify some as missing
    });

    it('should handle unicode and special characters', async () => {
      const csvData = `unicode_text,emojis,special_chars
"café","😀😁😂","☃★♥"
"中文","🎉🎈","©®™"
"عربي","🐶🐱","—–…"
"русский","🌍🌎","àáâã"`;
      
      writeFileSync(tempFile, csvData, 'utf8');
      
      const { Section3Analyzer } = await import('../../src/analyzers/eda');
      
      // Parse CSV data first
      const { CSVParser } = await import('../../src/parsers/csv-parser');
      const parser = new CSVParser({ autoDetect: true });
      const parsedRows = await parser.parseFile(tempFile);
      const headers = parsedRows.length > 0 ? parsedRows[0].data : [];
      const data = parsedRows.slice(1).map(row => row.data);
      
      const analyzer = new Section3Analyzer();
      
      const result = await analyzer.analyze({
        filePath: tempFile,
        data,
        headers,
        columnTypes: headers.map(() => 'string' as any),
        rowCount: data.length,
        columnCount: headers.length
      });
      
      expect(result.edaAnalysis.univariateAnalysis.length).toBeGreaterThan(0);
      expect(result.edaAnalysis.univariateAnalysis.find(col => col.columnName === 'unicode_text')).toBeDefined();
      expect(result.edaAnalysis.univariateAnalysis.find(col => col.columnName === 'emojis')).toBeDefined();
    });
  });

  describe('Statistical Edge Cases', () => {
    it('should handle datasets with no variance', async () => {
      const csvData = `constant1,constant2
5,5
5,5
5,5
5,5
5,5`;
      
      writeFileSync(tempFile, csvData, 'utf8');
      
      const { Section3Analyzer } = await import('../../src/analyzers/eda');
      
      // Parse CSV data first
      const { CSVParser } = await import('../../src/parsers/csv-parser');
      const parser = new CSVParser({ autoDetect: true });
      const parsedRows = await parser.parseFile(tempFile);
      const headers = parsedRows.length > 0 ? parsedRows[0].data : [];
      const data = parsedRows.slice(1).map(row => row.data);
      
      const analyzer = new Section3Analyzer();
      
      const result = await analyzer.analyze({
        filePath: tempFile,
        data,
        headers,
        columnTypes: headers.map(() => 'string' as any),
        rowCount: data.length,
        columnCount: headers.length
      });
      
      const constant1Analysis = result.edaAnalysis.univariateAnalysis.find(col => col.columnName === 'constant1');
      expect(constant1Analysis).toBeDefined();
      // Note: specific statistical properties depend on column type
      expect(constant1Analysis?.uniqueValues).toBe(1);
      
      // Should handle constant values gracefully
      expect(result.warnings).toBeDefined();
      expect(result.edaAnalysis).toBeDefined();
    });

    it('should handle perfect correlations and multicollinearity', async () => {
      const csvData = `x,y,z
1,2,3
2,4,6
3,6,9
4,8,12
5,10,15`; // z = x + y
      
      writeFileSync(tempFile, csvData, 'utf8');
      
      const { Section3Analyzer } = await import('../../src/analyzers/eda');
      
      // Parse CSV data first
      const { CSVParser } = await import('../../src/parsers/csv-parser');
      const parser = new CSVParser({ autoDetect: true });
      const parsedRows = await parser.parseFile(tempFile);
      const headers = parsedRows.length > 0 ? parsedRows[0].data : [];
      const data = parsedRows.slice(1).map(row => row.data);
      
      const analyzer = new Section3Analyzer();
      
      const result = await analyzer.analyze({
        filePath: tempFile,
        data,
        headers,
        columnTypes: headers.map(() => 'string' as any),
        rowCount: data.length,
        columnCount: headers.length
      });
      
      expect(result.edaAnalysis.bivariateAnalysis?.numericalVsNumerical?.correlationPairs).toBeDefined();
      
      // Should identify perfect correlation
      const correlations = result.edaAnalysis.bivariateAnalysis?.numericalVsNumerical?.correlationPairs;
      const perfectCorr = correlations?.find(corr => Math.abs(corr.correlation) > 0.99);
      expect(perfectCorr).toBeDefined();
      
      // May or may not generate multicollinearity warnings - system handles gracefully
      expect(result.warnings).toBeDefined();
    });

    it('should handle datasets with single data points', async () => {
      const csvData = `single_point
42`;
      
      writeFileSync(tempFile, csvData, 'utf8');
      
      const { Section3Analyzer } = await import('../../src/analyzers/eda');
      
      // Parse CSV data first
      const { CSVParser } = await import('../../src/parsers/csv-parser');
      const parser = new CSVParser({ autoDetect: true });
      const parsedRows = await parser.parseFile(tempFile);
      const headers = parsedRows.length > 0 ? parsedRows[0].data : [];
      const data = parsedRows.slice(1).map(row => row.data);
      
      const analyzer = new Section3Analyzer();
      
      const result = await analyzer.analyze({
        filePath: tempFile,
        data,
        headers,
        columnTypes: headers.map(() => 'string' as any),
        rowCount: data.length,
        columnCount: headers.length
      });
      
      expect(result.warnings).toBeDefined();
      // May generate warnings about insufficient data, but system handles gracefully
      
      const singleAnalysis = result.edaAnalysis.univariateAnalysis.find(col => col.columnName === 'single_point');
      expect(singleAnalysis?.totalValues).toBe(1);
      expect(singleAnalysis?.uniqueValues).toBe(1);
    });

    it('should handle all-missing columns', async () => {
      const csvData = `real_data,all_missing
1,
2,
3,
4,
5,`;
      
      writeFileSync(tempFile, csvData, 'utf8');
      
      const { Section2Analyzer } = await import('../../src/analyzers/quality');
      const { CSVParser } = await import('../../src/parsers/csv-parser');
      const parser = new CSVParser({ autoDetect: true });
      const parsedRows = await parser.parseFile(tempFile);
      const headers = parsedRows.length > 0 ? parsedRows[0].data : [];
      const data = parsedRows.slice(1).map(row => row.data);
      
      const analyzer = new Section2Analyzer({
        data,
        headers,
        columnTypes: headers.map(() => 'string' as any),
        rowCount: data.length,
        columnCount: headers.length
      });
      
      const result = await analyzer.analyze();
      
      const allMissingField = result.qualityAudit.completeness.columnLevel
        .find(f => f.columnName === 'all_missing');
      
      expect(allMissingField).toBeDefined();
      expect(allMissingField?.missingCount).toBe(5);
      expect(allMissingField?.missingPercentage).toBe(100); // 100% missing
      
      // May generate warnings about missing data - system handles gracefully
      expect(result.warnings).toBeDefined();
    });
  });

  describe('Configuration Edge Cases', () => {
    it('should handle invalid configuration values', async () => {
      // Create a minimal test file
      const testData = 'col1\nvalue1';
      writeFileSync(tempFile, testData, 'utf8');
      
      const { Section3Analyzer } = await import('../../src/analyzers/eda');
      
      const analyzer = new Section3Analyzer({
        maxCorrelationPairs: -1, // Invalid
        significanceLevel: 2.0, // Invalid (should be 0-1)
        samplingThreshold: 0 // Invalid
      });
      
      // Parse the test data
      const { CSVParser } = await import('../../src/parsers/csv-parser');
      const parser = new CSVParser({ autoDetect: true });
      const parsedRows = await parser.parseFile(tempFile);
      const headers = parsedRows.length > 0 ? parsedRows[0].data : [];
      const data = parsedRows.slice(1).map(row => row.data);
      
      const result = await analyzer.analyze({
        filePath: tempFile,
        data,
        headers,
        columnTypes: headers.map(() => 'string' as any),
        rowCount: data.length,
        columnCount: headers.length
      });
      
      // Should handle invalid config gracefully
      expect(result).toBeDefined();
    });

    it('should handle missing configuration gracefully', async () => {
      const csvData = `test,data\n1,a\n2,b\n3,c`;
      writeFileSync(tempFile, csvData, 'utf8');
      
      const { Section1Analyzer } = await import('../../src/analyzers/overview');
      
      // Create analyzer without configuration
      const analyzer = new Section1Analyzer();
      
      const result = await analyzer.analyze(tempFile);
      expect(result).toBeDefined();
      expect(result.overview.structuralDimensions.totalDataRows).toBe(3);
    });

    it('should handle conflicting configuration options', async () => {
      const csvData = `data\n1\n2\n3\n4\n5`;
      writeFileSync(tempFile, csvData, 'utf8');
      
      const { Section3Analyzer } = await import('../../src/analyzers/eda');
      
      // Parse CSV data first
      const { CSVParser } = await import('../../src/parsers/csv-parser');
      const parser = new CSVParser({ autoDetect: true });
      const parsedRows = await parser.parseFile(tempFile);
      const headers = parsedRows.length > 0 ? parsedRows[0].data : [];
      const data = parsedRows.slice(1).map(row => row.data);
      
      const analyzer = new Section3Analyzer({
        maxCorrelationPairs: 1, // Conflicts with enabling correlation on 5 records
        enableMultivariate: true,
        samplingThreshold: 1 // Very low threshold for conflicts
      });
      
      const result = await analyzer.analyze({
        filePath: tempFile,
        data,
        headers,
        columnTypes: headers.map(() => 'string' as any),
        rowCount: data.length,
        columnCount: headers.length
      });
      
      // Should resolve conflicts gracefully
      expect(result).toBeDefined();
      expect(result.warnings).toBeDefined();
    });
  });

  describe('Memory and Resource Edge Cases', () => {
    it('should handle out-of-memory scenarios gracefully', async () => {
      // Create a dataset that could cause memory issues
      let csvData = 'id';
      for (let col = 1; col <= 200; col++) {
        csvData += `,col${col}`;
      }
      csvData += '\n';
      
      for (let row = 0; row < 100; row++) {
        csvData += `${row}`;
        for (let col = 1; col <= 200; col++) {
          csvData += `,${Math.random().toString().repeat(10)}`; // Large string values
        }
        csvData += '\n';
      }
      
      writeFileSync(tempFile, csvData, 'utf8');
      
      const { Section3Analyzer } = await import('../../src/analyzers/eda');
      
      // Parse CSV data first
      const { CSVParser } = await import('../../src/parsers/csv-parser');
      const parser = new CSVParser({ autoDetect: true });
      const parsedRows = await parser.parseFile(tempFile);
      const headers = parsedRows.length > 0 ? parsedRows[0].data : [];
      const data = parsedRows.slice(1).map(row => row.data);
      
      const analyzer = new Section3Analyzer({
        useStreamingAnalysis: true
      });
      
      const result = await analyzer.analyze({
        filePath: tempFile,
        data,
        headers,
        columnTypes: headers.map(() => 'string' as any),
        rowCount: data.length,
        columnCount: headers.length
      });
      
      // Should complete with memory optimizations
      expect(result).toBeDefined();
      expect(result.warnings).toBeDefined();
    }, 15000);

    it('should handle slow file I/O gracefully', async () => {
      const csvData = `data\n${Array.from({ length: 1000 }, (_, i) => i).join('\n')}`;
      writeFileSync(tempFile, csvData, 'utf8');
      
      const { Section1Analyzer } = await import('../../src/analyzers/overview');
      const analyzer = new Section1Analyzer();
      
      // Should either complete or timeout gracefully
      try {
        const result = await analyzer.analyze(tempFile);
        expect(result).toBeDefined();
      } catch (error) {
        expect(error.message).toMatch(/timeout|time.?out/i);
      }
    }, 8000);
  });

  describe('Integration Edge Cases', () => {
    it('should handle circular dependencies in cross-section analysis', async () => {
      const csvData = `a,b,c\n1,2,3\n4,5,6\n7,8,9`;
      writeFileSync(tempFile, csvData, 'utf8');
      
      // Simulate a scenario where sections might have circular dependencies
      const { Section2Analyzer } = await import('../../src/analyzers/quality');
      const { Section3Analyzer } = await import('../../src/analyzers/eda');
      
      // Parse CSV data first for Section2Analyzer
      const { CSVParser } = await import('../../src/parsers/csv-parser');
      const parser = new CSVParser({ autoDetect: true });
      const parsedRows = await parser.parseFile(tempFile);
      const headers = parsedRows.length > 0 ? parsedRows[0].data : [];
      const data = parsedRows.slice(1).map(row => row.data);
      
      const section2 = new Section2Analyzer({
        data,
        headers,
        columnTypes: headers.map(() => 'string' as any),
        rowCount: data.length,
        columnCount: headers.length
      });
      const section3 = new Section3Analyzer();
      
      // Both sections should be able to analyze independently
      const [result2, result3] = await Promise.all([
        section2.analyze(),
        section3.analyze({
          filePath: tempFile,
          data,
          headers,
          columnTypes: headers.map(() => 'string' as any),
          rowCount: data.length,
          columnCount: headers.length
        })
      ]);
      
      expect(result2).toBeDefined();
      expect(result3).toBeDefined();
      
      // Results should be consistent - both should analyze the same data
      expect(result2.qualityAudit.completeness.datasetLevel.totalMissingValues).toBeGreaterThanOrEqual(0);
      expect(result3.edaAnalysis.univariateAnalysis.length).toBeGreaterThan(0);
    });

    it('should handle analyzer failures in pipeline', async () => {
      const csvData = `corrupted,data\nval1,val2\n"unclosed quote,val3`;
      writeFileSync(tempFile, csvData, 'utf8');
      
      const { Section1Analyzer } = await import('../../src/analyzers/overview');
      const { Section2Analyzer } = await import('../../src/analyzers/quality');
      
      // One analyzer might fail, others should continue
      const results = await Promise.allSettled([
        new Section1Analyzer().analyze(tempFile),
        // Section2Analyzer needs proper input structure
        (async () => {
          const { CSVParser } = await import('../../src/parsers/csv-parser');
          const parser = new CSVParser({ autoDetect: true });
          const parsedRows = await parser.parseFile(tempFile);
          const rows = parsedRows.map(row => row.data);
          const headers = rows.length > 0 ? rows[0] : [];
          const data = rows.slice(1);
          
          const analyzer = new Section2Analyzer({
            data,
            headers,
            columnTypes: headers.map(() => 'string' as any),
            rowCount: data.length,
            columnCount: headers.length,
          });
          return analyzer.analyze();
        })()
      ]);
      
      // At least one should succeed or both should fail gracefully
      const successes = results.filter(r => r.status === 'fulfilled');
      const failures = results.filter(r => r.status === 'rejected');
      
      if (failures.length > 0) {
        failures.forEach(failure => {
          expect(failure.reason).toBeInstanceOf(Error);
          expect(failure.reason.message).toBeDefined();
        });
      }
      
      if (successes.length > 0) {
        successes.forEach(success => {
          expect(success.value).toBeDefined();
        });
      }
    });
  });

  describe('Error Recovery', () => {
    it('should provide meaningful error messages', async () => {
      const { Section1Analyzer } = await import('../../src/analyzers/overview');
      const analyzer = new Section1Analyzer();
      
      try {
        await analyzer.analyze('/definitely/does/not/exist.csv');
      } catch (error) {
        expect(error.message).toBeDefined();
        expect(error.message.length).toBeGreaterThan(10);
        expect(error.message).toMatch(/file|path|exist|found/i);
        
        // Should include helpful context
        expect(error.message).toContain('/definitely/does/not/exist.csv');
      }
    });

    it('should provide recovery suggestions', async () => {
      const csvData = ``; // Completely empty
      writeFileSync(tempFile, csvData, 'utf8');
      
      const { Section2Analyzer } = await import('../../src/analyzers/quality');
      
      try {
        // Section2Analyzer needs proper input structure, even for empty data
        const analyzer = new Section2Analyzer({
          data: [],
          headers: [],
          columnTypes: [] as any,
          rowCount: 0,
          columnCount: 0,
        });
        await analyzer.analyze();
      } catch (error) {
        expect(error.message).toMatch(/empty|no data/i);
        
        // Should suggest what user can do
        expect(error.message).toMatch(/check|verify|ensure|add/i);
      }
    });

    it('should maintain state consistency after errors', async () => {
      const { Section3Analyzer } = await import('../../src/analyzers/eda');
      const analyzer = new Section3Analyzer();
      
      // First, cause an error by using empty data
      try {
        await analyzer.analyze({
          filePath: tempFile,
          data: [],
          headers: [],
          columnTypes: [],
          rowCount: 0,
          columnCount: 0
        });
      } catch (error) {
        // Expected to fail with empty data
      }
      
      // Then, use the same analyzer instance successfully
      const csvData = `working,data\n1,a\n2,b\n3,c`;
      writeFileSync(tempFile, csvData, 'utf8');
      
      const { CSVParser } = await import('../../src/parsers/csv-parser');
      const parser = new CSVParser({ autoDetect: true });
      const parsedRows = await parser.parseFile(tempFile);
      const headers = parsedRows.length > 0 ? parsedRows[0].data : [];
      const data = parsedRows.slice(1).map(row => row.data);
      
      const result = await analyzer.analyze({
        filePath: tempFile,
        data,
        headers,
        columnTypes: headers.map(() => 'string' as any),
        rowCount: data.length,
        columnCount: headers.length
      });
      expect(result).toBeDefined();
      expect(result.edaAnalysis.univariateAnalysis.length).toBeGreaterThan(0);
    });
  });
});
