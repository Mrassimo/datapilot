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
      const analyzer = new Section2Analyzer();
      
      await expect(analyzer.analyze(tempFile))
        .rejects.toThrow(/no data|empty|insufficient/i);
    });

    it('should handle files with only whitespace', async () => {
      writeFileSync(tempFile, '   \n\n  \t  \n   ', 'utf8');
      
      const { Section1Analyzer } = await import('../../src/analyzers/overview');
      const analyzer = new Section1Analyzer();
      
      await expect(analyzer.analyze(tempFile))
        .rejects.toThrow(/empty|no data|whitespace/i);
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
      const analyzer = new Section2Analyzer();
      
      const result = await analyzer.analyze(tempFile);
      
      // Should handle gracefully with warnings
      expect(result.warnings).toBeDefined();
      expect(result.warnings.some(w => w.includes('inconsistent') || w.includes('malformed'))).toBe(true);
      expect(result.summary.totalRecordsAnalyzed).toBeGreaterThan(0);
    });

    it('should handle CSV with complex quoting and escaping', async () => {
      const csvData = `name,description,value
"Smith, John","Person with ""quotes"" in description",123.45
"O'Connor, Jane","Text with\nnewlines\nand commas, semicolons;",456.78
"Complex \"Case\"","Mixed 'quotes' and \"escapes\"",789.01`;
      
      writeFileSync(tempFile, csvData, 'utf8');
      
      const { Section3Analyzer } = await import('../../src/analyzers/eda');
      const analyzer = new Section3Analyzer();
      
      const result = await analyzer.analyze(tempFile);
      
      expect(result.summary.totalRecords).toBe(3);
      expect(result.univariateAnalysis?.['name']).toBeDefined();
      expect(result.univariateAnalysis?.['value']).toBeDefined();
    });

    it('should handle CSV with unusual delimiters and encodings', async () => {
      const csvData = `col1;col2;col3
value1;value2;value3
data1;data2;data3`;
      
      writeFileSync(tempFile, csvData, 'utf8');
      
      const { CSVParser } = await import('../../src/parsers');
      const parser = new CSVParser();
      
      // Should detect delimiter automatically
      const parseResult = await parser.parse(tempFile);
      expect(parseResult.delimiter).toBe(';');
      expect(parseResult.data.length).toBe(2); // Excluding header
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
      expect(result.warnings.some(w => w.includes('parsing') || w.includes('malformed'))).toBe(true);
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
      const analyzer = new Section2Analyzer();
      
      const result = await analyzer.analyze(tempFile);
      
      expect(result.typeConformity.fieldTypeAnalysis).toBeDefined();
      const mixedField = result.typeConformity.fieldTypeAnalysis
        .find(f => f.fieldName === 'mixed_column');
      
      expect(mixedField).toBeDefined();
      expect(mixedField?.typeConsistency).toBe('inconsistent');
      expect(mixedField?.detectedTypes.length).toBeGreaterThan(1);
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
      const analyzer = new Section3Analyzer();
      
      const result = await analyzer.analyze(tempFile);
      
      const extremeAnalysis = result.univariateAnalysis?.['extreme_values'];
      expect(extremeAnalysis).toBeDefined();
      
      // Should handle extreme values without crashing
      expect(extremeAnalysis?.count).toBeGreaterThan(0);
      expect(extremeAnalysis?.min).toBeDefined();
      expect(extremeAnalysis?.max).toBeDefined();
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
      const analyzer = new Section2Analyzer();
      
      const result = await analyzer.analyze(tempFile);
      
      const specialField = result.completenessAnalysis.fieldCompleteness
        .find(f => f.fieldName === 'special_strings');
      
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
      const analyzer = new Section3Analyzer();
      
      const result = await analyzer.analyze(tempFile);
      
      expect(result.summary.totalRecords).toBe(4);
      expect(result.univariateAnalysis?.['unicode_text']).toBeDefined();
      expect(result.univariateAnalysis?.['emojis']).toBeDefined();
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
      const analyzer = new Section3Analyzer();
      
      const result = await analyzer.analyze(tempFile);
      
      const constant1Analysis = result.univariateAnalysis?.['constant1'];
      expect(constant1Analysis).toBeDefined();
      expect(constant1Analysis?.standardDeviation).toBe(0);
      expect(constant1Analysis?.variance).toBe(0);
      
      // Should warn about constant values
      expect(result.warnings.some(w => w.includes('constant') || w.includes('variance'))).toBe(true);
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
      const analyzer = new Section3Analyzer();
      
      const result = await analyzer.analyze(tempFile);
      
      expect(result.correlationAnalysis?.correlationMatrix).toBeDefined();
      
      // Should identify perfect correlation
      const correlations = result.correlationAnalysis?.correlationMatrix;
      const perfectCorr = correlations?.find(corr => Math.abs(corr.correlation) > 0.99);
      expect(perfectCorr).toBeDefined();
      
      // Should warn about multicollinearity
      expect(result.warnings.some(w => w.includes('correlation') || w.includes('collinear'))).toBe(true);
    });

    it('should handle datasets with single data points', async () => {
      const csvData = `single_point
42`;
      
      writeFileSync(tempFile, csvData, 'utf8');
      
      const { Section3Analyzer } = await import('../../src/analyzers/eda');
      const analyzer = new Section3Analyzer();
      
      const result = await analyzer.analyze(tempFile);
      
      expect(result.warnings).toBeDefined();
      expect(result.warnings.some(w => w.includes('single') || w.includes('insufficient'))).toBe(true);
      
      const singleAnalysis = result.univariateAnalysis?.['single_point'];
      expect(singleAnalysis?.count).toBe(1);
      expect(singleAnalysis?.standardDeviation).toBe(0);
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
      const analyzer = new Section2Analyzer();
      
      const result = await analyzer.analyze(tempFile);
      
      const allMissingField = result.completenessAnalysis.fieldCompleteness
        .find(f => f.fieldName === 'all_missing');
      
      expect(allMissingField).toBeDefined();
      expect(allMissingField?.missingCount).toBe(5);
      expect(allMissingField?.completenessRate).toBe(0);
      
      // Should warn about completely missing column
      expect(result.warnings.some(w => w.includes('completely missing') || w.includes('no data'))).toBe(true);
    });
  });

  describe('Configuration Edge Cases', () => {
    it('should handle invalid configuration values', () => {
      const { Section3Analyzer } = require('../../src/analyzers/eda');
      
      const analyzer = new Section3Analyzer({
        maxRecordsForCorrelation: -1, // Invalid
        correlationThreshold: 2.0, // Invalid (should be -1 to 1)
        sampleSize: 0 // Invalid
      });
      
      const validation = analyzer.validateConfig();
      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });

    it('should handle missing configuration gracefully', async () => {
      const csvData = `test,data\n1,a\n2,b\n3,c`;
      writeFileSync(tempFile, csvData, 'utf8');
      
      const { Section1Analyzer } = await import('../../src/analyzers/overview');
      
      // Create analyzer without configuration
      const analyzer = new Section1Analyzer(undefined);
      
      const result = await analyzer.analyze(tempFile);
      expect(result).toBeDefined();
      expect(result.overview.structuralDimensions.totalDataRows).toBe(3);
    });

    it('should handle conflicting configuration options', async () => {
      const csvData = `data\n1\n2\n3\n4\n5`;
      writeFileSync(tempFile, csvData, 'utf8');
      
      const { Section3Analyzer } = await import('../../src/analyzers/eda');
      
      const analyzer = new Section3Analyzer({
        enableCorrelationAnalysis: true,
        maxRecordsForCorrelation: 1, // Conflicts with enabling correlation on 5 records
        enableAdvancedStatistics: true,
        quickAnalysisMode: true // Conflicts with advanced statistics
      });
      
      const result = await analyzer.analyze(tempFile);
      
      // Should resolve conflicts gracefully
      expect(result).toBeDefined();
      expect(result.warnings.some(w => w.includes('config') || w.includes('conflict'))).toBe(true);
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
      const analyzer = new Section3Analyzer({
        maxMemoryUsage: 50 * 1024 * 1024, // 50MB limit
        enableMemoryOptimization: true
      });
      
      const result = await analyzer.analyze(tempFile);
      
      // Should complete with memory optimizations
      expect(result).toBeDefined();
      expect(result.warnings.some(w => w.includes('memory') || w.includes('optimization'))).toBe(true);
    }, 15000);

    it('should handle slow file I/O gracefully', async () => {
      const csvData = `data\n${Array.from({ length: 1000 }, (_, i) => i).join('\n')}`;
      writeFileSync(tempFile, csvData, 'utf8');
      
      const { Section1Analyzer } = await import('../../src/analyzers/overview');
      const analyzer = new Section1Analyzer({
        timeoutMs: 5000 // 5 second timeout
      });
      
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
      
      const section2 = new Section2Analyzer();
      const section3 = new Section3Analyzer();
      
      // Both sections should be able to analyze independently
      const [result2, result3] = await Promise.all([
        section2.analyze(tempFile),
        section3.analyze(tempFile)
      ]);
      
      expect(result2).toBeDefined();
      expect(result3).toBeDefined();
      
      // Results should be consistent
      expect(result2.summary.totalRecordsAnalyzed).toBe(result3.summary.totalRecords);
    });

    it('should handle analyzer failures in pipeline', async () => {
      const csvData = `corrupted,data\nval1,val2\n"unclosed quote,val3`;
      writeFileSync(tempFile, csvData, 'utf8');
      
      const { Section1Analyzer } = await import('../../src/analyzers/overview');
      const { Section2Analyzer } = await import('../../src/analyzers/quality');
      
      // One analyzer might fail, others should continue
      const results = await Promise.allSettled([
        new Section1Analyzer().analyze(tempFile),
        new Section2Analyzer().analyze(tempFile)
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
      const analyzer = new Section2Analyzer();
      
      try {
        await analyzer.analyze(tempFile);
      } catch (error) {
        expect(error.message).toMatch(/empty|no data/i);
        
        // Should suggest what user can do
        expect(error.message).toMatch(/check|verify|ensure|add/i);
      }
    });

    it('should maintain state consistency after errors', async () => {
      const { Section3Analyzer } = await import('../../src/analyzers/eda');
      const analyzer = new Section3Analyzer();
      
      // First, cause an error
      try {
        await analyzer.analyze('/nonexistent.csv');
      } catch (error) {
        // Expected to fail
      }
      
      // Then, use the same analyzer instance successfully
      const csvData = `working,data\n1,a\n2,b\n3,c`;
      writeFileSync(tempFile, csvData, 'utf8');
      
      const result = await analyzer.analyze(tempFile);
      expect(result).toBeDefined();
      expect(result.summary.totalRecords).toBe(3);
    });
  });
});
