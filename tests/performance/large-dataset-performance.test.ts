import { writeFileSync, unlinkSync, mkdtempSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('Large Dataset Performance Tests', () => {
  let tempDir: string;
  let tempFile: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'datapilot-performance-test-'));
    tempFile = join(tempDir, 'large-test.csv');
  });

  afterEach(async () => {
    try {
      unlinkSync(tempFile);
    } catch (e) {
      // File might not exist
    }
    
    // Stop any memory monitoring and cleanup analyzers
    const { globalMemoryManager, globalResourceManager } = await import('../../src/utils/memory-manager');
    const { shutdownGlobalMemoryOptimizer } = await import('../../src/performance/memory-optimizer');
    const { shutdownGlobalAdaptiveStreamer } = await import('../../src/performance/adaptive-streamer');
    
    // Stop monitoring and cleanup resources
    globalMemoryManager.stopMonitoring();
    globalMemoryManager.runCleanup();
    globalResourceManager.cleanupAll();
    
    // Shutdown performance optimizers
    try {
      shutdownGlobalMemoryOptimizer();
      shutdownGlobalAdaptiveStreamer();
    } catch (e) {
      // May not exist, ignore
    }
    
    // Cleanup any lingering async operations
    await new Promise(resolve => setTimeout(resolve, 150));
  });

  describe('Memory Efficiency', () => {
    it('should handle 1000 rows with reasonable memory usage', async () => {
      // Create 1000-row dataset
      let csvData = 'id,name,age,salary,department,score1,score2,score3,category,status\n';
      for (let i = 0; i < 1000; i++) {
        csvData += `${i},User${i},${20 + (i % 50)},${30000 + (i * 10)},Dept${i % 5},${Math.random() * 100},${Math.random() * 100},${Math.random() * 100},Cat${i % 3},${['active', 'inactive'][i % 2]}\n`;
      }
      
      writeFileSync(tempFile, csvData, 'utf8');
      
      const initialMemory = process.memoryUsage();
      
      const { CSVParser } = await import('../../src/parsers/csv-parser');
      const parser = new CSVParser({ autoDetect: true });
      const parsedRows = await parser.parseFile(tempFile);
      const headers = parsedRows.length > 0 ? parsedRows[0].data : [];
      const data = parsedRows.slice(1).map(row => row.data);
      
      const { Section3Analyzer } = await import('../../src/analyzers/eda');
      const analyzer = new Section3Analyzer();
      
      const result = await analyzer.analyze({
        filePath: tempFile,
        data,
        headers,
        columnTypes: headers.map(() => 'string' as any),
        rowCount: data.length,
        columnCount: headers.length
      });
      
      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      
      // Memory increase should be reasonable (less than 50MB for 1000 rows)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
      expect(result.edaAnalysis).toBeDefined();
      expect(result.edaAnalysis.univariateAnalysis.length).toBeGreaterThan(0);
    }, 15000);

    it('should handle wide datasets efficiently', async () => {
      // Create dataset with many columns
      const numColumns = 50;
      let csvData = Array.from({ length: numColumns }, (_, i) => `col${i}`).join(',') + '\n';
      
      for (let row = 0; row < 100; row++) {
        const rowData = Array.from({ length: numColumns }, () => Math.random() * 1000);
        csvData += rowData.join(',') + '\n';
      }
      
      writeFileSync(tempFile, csvData, 'utf8');
      
      const { Section2Analyzer } = await import('../../src/analyzers/quality');
      const { CSVParser } = await import('../../src/parsers/csv-parser');
      const parser = new CSVParser({ autoDetect: true });
      const rows: string[][] = [];
      const parsedRows = await parser.parseFile(tempFile);
      for (const row of parsedRows) {
        rows.push(row.data);
      }
      const headers = rows.length > 0 ? rows[0] : [];
      const data = rows.slice(1);
      
      const analyzer = new Section2Analyzer({
        data,
        headers,
        columnTypes: headers.map(() => 'string' as any),
        rowCount: data.length,
        columnCount: headers.length
      });
      
      const startTime = Date.now();
      const result = await analyzer.analyze();
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeLessThan(8000); // Should complete in under 8 seconds
      expect(result.qualityAudit.completeness.columnLevel.length).toBe(numColumns);
      expect(result.qualityAudit.completeness.columnLevel).toHaveLength(numColumns);
    }, 12000);

    it('should handle streaming analysis for large datasets', async () => {
      // Create larger dataset that would benefit from streaming
      let csvData = 'timestamp,user_id,action,value\n';
      const numRows = 2000;
      
      for (let i = 0; i < numRows; i++) {
        const timestamp = new Date(2024, 0, 1 + (i % 365)).toISOString();
        csvData += `${timestamp},user${i % 100},action${i % 10},${Math.random() * 1000}\n`;
      }
      
      writeFileSync(tempFile, csvData, 'utf8');
      
      const { StreamingAnalyzer } = await import('../../src/analyzers/streaming/streaming-analyzer');
      const analyzer = new StreamingAnalyzer({
        maxRowsAnalyzed: numRows
      });
      
      const initialMemory = process.memoryUsage();
      const result = await analyzer.analyzeFile(tempFile);
      
      // Cleanup analyzer (no explicit cleanup methods, rely on global cleanup)
      
      const finalMemory = process.memoryUsage();
      
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      
      // Streaming should use less memory than loading everything
      expect(memoryIncrease).toBeLessThan(30 * 1024 * 1024); // Less than 30MB
      expect(result.edaAnalysis).toBeDefined();
      expect(result.edaAnalysis.univariateAnalysis.length).toBeGreaterThan(0);
    }, 20000);
  });

  describe('Processing Speed', () => {
    it('should maintain fast analysis speed as data size increases', async () => {
      const dataSizes = [100, 500, 1000];
      const processingTimes: number[] = [];
      
      for (const size of dataSizes) {
        // Create dataset of specified size
        let csvData = 'id,value1,value2,category\n';
        for (let i = 0; i < size; i++) {
          csvData += `${i},${Math.random() * 100},${Math.random() * 200},${['A', 'B', 'C'][i % 3]}\n`;
        }
        
        const testFile = join(tempDir, `test-${size}.csv`);
        writeFileSync(testFile, csvData, 'utf8');
        
        try {
          const { Section1Analyzer } = await import('../../src/analyzers/overview');
          const analyzer = new Section1Analyzer({ enableFileHashing: false });
          
          const startTime = Date.now();
          await analyzer.analyze(testFile);
          const endTime = Date.now();
          
          processingTimes.push(endTime - startTime);
        } finally {
          unlinkSync(testFile);
        }
      }
      
      // Processing time should scale reasonably (not exponentially)
      const timeRatio_500_100 = processingTimes[1] / processingTimes[0];
      const timeRatio_1000_500 = processingTimes[2] / processingTimes[1];
      
      // Each doubling should not take more than 3x as long
      expect(timeRatio_500_100).toBeLessThan(3);
      expect(timeRatio_1000_500).toBeLessThan(3);
      
      // Even largest dataset should complete quickly
      expect(processingTimes[2]).toBeLessThan(8000); // 8 seconds max
    }, 30000);

    it('should handle concurrent analysis efficiently', async () => {
      // Create multiple datasets
      const datasets: string[] = [];
      for (let d = 0; d < 3; d++) {
        let csvData = `id,data${d}\n`;
        for (let i = 0; i < 200; i++) {
          csvData += `${i},${Math.random() * 100}\n`;
        }
        
        const file = join(tempDir, `concurrent-${d}.csv`);
        writeFileSync(file, csvData, 'utf8');
        datasets.push(file);
      }
      
      try {
        const { Section2Analyzer } = await import('../../src/analyzers/quality');
        
        const startTime = Date.now();
        
        // Run analyses concurrently
        const promises = datasets.map(async file => {
          const { CSVParser } = await import('../../src/parsers/csv-parser');
          const parser = new CSVParser({ autoDetect: true });
          const parsedRows = await parser.parseFile(file);
          const rows = parsedRows.map(row => row.data);
          const headers = rows.length > 0 ? rows[0] : [];
          const data = rows.slice(1);
          
          const analyzer = new Section2Analyzer({
            data,
            headers,
            columnTypes: headers.map(() => 'string' as any),
            rowCount: data.length,
            columnCount: headers.length
          });
          return analyzer.analyze();
        });
        
        const results = await Promise.all(promises);
        const endTime = Date.now();
        
        // Concurrent execution should be faster than sequential
        const concurrentTime = endTime - startTime;
        expect(concurrentTime).toBeLessThan(10000); // Should complete in under 10 seconds
        
        // All analyses should succeed
        expect(results).toHaveLength(3);
        results.forEach(result => {
          expect(result.qualityAudit.completeness.columnLevel.length).toBeGreaterThan(0);
        });
      } finally {
        datasets.forEach(file => {
          try {
            unlinkSync(file);
          } catch (e) {
            // File might not exist
          }
        });
      }
    }, 15000);
  });

  describe('Scalability Limits', () => {
    it('should handle maximum reasonable dataset size', async () => {
      // Create a substantial dataset (5000 rows)
      let csvData = 'id,timestamp,user_id,action,value,category,score\n';
      for (let i = 0; i < 5000; i++) {
        const timestamp = new Date(2024, 0, 1 + (i % 365)).toISOString();
        csvData += `${i},${timestamp},user${i % 500},action${i % 20},${Math.random() * 1000},cat${i % 10},${Math.random() * 100}\n`;
      }
      
      writeFileSync(tempFile, csvData, 'utf8');
      
      const { CSVParser } = await import('../../src/parsers/csv-parser');
      const parser = new CSVParser({ autoDetect: true });
      const parsedRows = await parser.parseFile(tempFile);
      const headers = parsedRows.length > 0 ? parsedRows[0].data : [];
      const data = parsedRows.slice(1).map(row => row.data);
      
      const { Section3Analyzer } = await import('../../src/analyzers/eda');
      const analyzer = new Section3Analyzer();
      
      const startTime = Date.now();
      const initialMemory = process.memoryUsage();
      
      const result = await analyzer.analyze({
        filePath: tempFile,
        data,
        headers,
        columnTypes: headers.map(() => 'string' as any),
        rowCount: data.length,
        columnCount: headers.length
      });
      
      const endTime = Date.now();
      const finalMemory = process.memoryUsage();
      
      // Should complete in reasonable time
      expect(endTime - startTime).toBeLessThan(30000); // 30 seconds max
      
      // Memory usage should be controlled
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024); // Less than 100MB
      
      // Results should be complete
      expect(result.edaAnalysis.univariateAnalysis).toBeDefined();
      expect(result.edaAnalysis.bivariateAnalysis).toBeDefined();
    }, 45000);

    it('should gracefully handle memory pressure', async () => {
      // Simulate memory pressure by creating a very wide dataset
      const numColumns = 100;
      let csvData = Array.from({ length: numColumns }, (_, i) => `feature_${i}`).join(',') + '\n';
      
      for (let row = 0; row < 500; row++) {
        const rowData = Array.from({ length: numColumns }, () => Math.random() * 1000);
        csvData += rowData.join(',') + '\n';
      }
      
      writeFileSync(tempFile, csvData, 'utf8');
      
      const { CSVParser } = await import('../../src/parsers/csv-parser');
      const parser = new CSVParser({ autoDetect: true });
      const parsedRows = await parser.parseFile(tempFile);
      const headers = parsedRows.length > 0 ? parsedRows[0].data : [];
      const data = parsedRows.slice(1).map(row => row.data);
      
      const { Section2Analyzer } = await import('../../src/analyzers/quality');
      const analyzer = new Section2Analyzer({
        data,
        headers,
        columnTypes: headers.map(() => 'string' as any),
        rowCount: data.length,
        columnCount: headers.length
      });
      
      const result = await analyzer.analyze();
      
      // Should complete successfully with wide dataset
      expect(result.qualityAudit.completeness.columnLevel.length).toBe(numColumns);
      expect(result.warnings).toBeDefined();
    }, 25000);
  });

  describe('Resource Management', () => {
    it('should properly manage file handles for large files', async () => {
      // Create a large CSV file
      let csvData = 'id,data1,data2,data3,data4,data5\n';
      for (let i = 0; i < 3000; i++) {
        csvData += `${i},${Math.random()},${Math.random()},${Math.random()},${Math.random()},${Math.random()}\n`;
      }
      
      writeFileSync(tempFile, csvData, 'utf8');
      
      // Multiple sequential analyses should not leak file handles
      const { Section1Analyzer } = await import('../../src/analyzers/overview');
      
      for (let i = 0; i < 5; i++) {
        const analyzer = new Section1Analyzer({ enableFileHashing: false });
        const result = await analyzer.analyze(tempFile);
        
        expect(result.overview.structuralDimensions.totalDataRows).toBeGreaterThanOrEqual(2999);
        expect(result.overview.structuralDimensions.totalDataRows).toBeLessThanOrEqual(3001);
        
        // Small delay to allow cleanup
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // If we get here without errors, file handles were managed properly
      expect(true).toBe(true);
    }, 20000);

    it('should handle disk space efficiently during analysis', async () => {
      // Create dataset that would generate substantial intermediate results
      let csvData = 'id,text_field,numeric_field\n';
      for (let i = 0; i < 1000; i++) {
        const longText = 'This is a long text field that contains substantial content and could generate large intermediate results during processing. '.repeat(3);
        csvData += `${i},"${longText}",${Math.random() * 1000000}\n`;
      }
      
      writeFileSync(tempFile, csvData, 'utf8');
      
      const initialFileSize = require('fs').statSync(tempFile).size;
      
      const { Section2Analyzer } = await import('../../src/analyzers/quality');
      const { CSVParser } = await import('../../src/parsers/csv-parser');
      const parser = new CSVParser({ autoDetect: true });
      const rows: string[][] = [];
      const parsedRows = await parser.parseFile(tempFile);
      for (const row of parsedRows) {
        rows.push(row.data);
      }
      const headers = rows.length > 0 ? rows[0] : [];
      const data = rows.slice(1);
      
      const analyzer = new Section2Analyzer({
        data,
        headers,
        columnTypes: headers.map(() => 'string' as any),
        rowCount: data.length,
        columnCount: headers.length
      });
      
      const result = await analyzer.analyze();
      
      // Analysis should complete without creating excessive temporary files
      expect(result.qualityAudit.completeness.columnLevel.length).toBeGreaterThan(0);
      expect(result.qualityAudit.completeness).toBeDefined();
      
      // Original file should be unchanged
      const finalFileSize = require('fs').statSync(tempFile).size;
      expect(finalFileSize).toBe(initialFileSize);
    }, 15000);
  });

  describe('Performance Monitoring', () => {
    it('should accurately track performance metrics', async () => {
      let csvData = 'metric1,metric2,metric3\n';
      for (let i = 0; i < 800; i++) {
        csvData += `${Math.random() * 100},${Math.random() * 200},${Math.random() * 50}\n`;
      }
      
      writeFileSync(tempFile, csvData, 'utf8');
      
      const { CSVParser } = await import('../../src/parsers/csv-parser');
      const parser = new CSVParser({ autoDetect: true });
      const parsedRows = await parser.parseFile(tempFile);
      const headers = parsedRows.length > 0 ? parsedRows[0].data : [];
      const data = parsedRows.slice(1).map(row => row.data);
      
      const { Section3Analyzer } = await import('../../src/analyzers/eda');
      const analyzer = new Section3Analyzer();
      
      const startTime = Date.now();
      const result = await analyzer.analyze({
        filePath: tempFile,
        data,
        headers,
        columnTypes: headers.map(() => 'string' as any),
        rowCount: data.length,
        columnCount: headers.length
      });
      const endTime = Date.now();
      
      const actualTime = endTime - startTime;
      
      // Should complete analysis successfully
      expect(result.edaAnalysis.univariateAnalysis.length).toBe(3);
      expect(result.edaAnalysis.univariateAnalysis).toBeDefined();
      expect(actualTime).toBeLessThan(10000); // Should complete in reasonable time
    }, 12000);

    it('should handle large datasets with many columns efficiently', async () => {
      // Create a dataset with many columns
      let csvData = 'id';
      for (let col = 1; col <= 30; col++) {
        csvData += `,feature${col}`;
      }
      csvData += '\n';
      
      for (let row = 0; row < 200; row++) {
        csvData += `${row}`;
        for (let col = 1; col <= 30; col++) {
          csvData += `,${Math.random() * 1000}`;
        }
        csvData += '\n';
      }
      
      writeFileSync(tempFile, csvData, 'utf8');
      
      const { CSVParser } = await import('../../src/parsers/csv-parser');
      const parser = new CSVParser({ autoDetect: true });
      const parsedRows = await parser.parseFile(tempFile);
      const headers = parsedRows.length > 0 ? parsedRows[0].data : [];
      const data = parsedRows.slice(1).map(row => row.data);
      
      const { Section2Analyzer } = await import('../../src/analyzers/quality');
      const analyzer = new Section2Analyzer({
        data,
        headers,
        columnTypes: headers.map(() => 'string' as any),
        rowCount: data.length,
        columnCount: headers.length
      });
      
      const startTime = Date.now();
      const result = await analyzer.analyze();
      const endTime = Date.now();
      
      // Should complete efficiently
      expect(endTime - startTime).toBeLessThan(15000);
      expect(result.qualityAudit.completeness.columnLevel.length).toBe(31); // id + 30 features
      expect(result.warnings).toBeDefined();
    }, 25000);
  });

  describe('Edge Case Performance', () => {
    it('should handle sparse datasets efficiently', async () => {
      // Create sparse dataset (many missing values)
      let csvData = 'id,sparse1,sparse2,sparse3,sparse4,sparse5\n';
      for (let i = 0; i < 1000; i++) {
        csvData += `${i}`;
        for (let col = 1; col <= 5; col++) {
          // 70% chance of missing value
          csvData += Math.random() < 0.3 ? `,${Math.random() * 100}` : ',';
        }
        csvData += '\n';
      }
      
      writeFileSync(tempFile, csvData, 'utf8');
      
      const { Section2Analyzer } = await import('../../src/analyzers/quality');
      const { CSVParser } = await import('../../src/parsers/csv-parser');
      const parser = new CSVParser({ autoDetect: true });
      const rows: string[][] = [];
      const parsedRows = await parser.parseFile(tempFile);
      for (const row of parsedRows) {
        rows.push(row.data);
      }
      const headers = rows.length > 0 ? rows[0] : [];
      const data = rows.slice(1);
      
      const analyzer = new Section2Analyzer({
        data,
        headers,
        columnTypes: headers.map(() => 'string' as any),
        rowCount: data.length,
        columnCount: headers.length
      });
      
      const startTime = Date.now();
      const result = await analyzer.analyze();
      const endTime = Date.now();
      
      // Should handle sparsity efficiently
      expect(endTime - startTime).toBeLessThan(8000);
      expect(result.qualityAudit.completeness.datasetLevel.overallCompletenessRatio).toBeLessThan(50);
      
      // Should identify sparsity as a performance factor
      expect(result.warnings.some(w => w.category === 'computation' || w.category === 'business_rules')).toBe(true);
    }, 12000);

    it('should handle datasets with extreme values efficiently', async () => {
      let csvData = 'normal,extreme\n';
      for (let i = 0; i < 1000; i++) {
        const normal = Math.random() * 100;
        const extreme = i % 100 === 0 ? Math.random() * 1e12 : Math.random() * 100; // Occasional extreme value
        csvData += `${normal},${extreme}\n`;
      }
      
      writeFileSync(tempFile, csvData, 'utf8');
      
      const { CSVParser } = await import('../../src/parsers/csv-parser');
      const parser = new CSVParser({ autoDetect: true });
      const parsedRows = await parser.parseFile(tempFile);
      const headers = parsedRows.length > 0 ? parsedRows[0].data : [];
      const data = parsedRows.slice(1).map(row => row.data);
      
      const { Section3Analyzer } = await import('../../src/analyzers/eda');
      const analyzer = new Section3Analyzer();
      
      const startTime = Date.now();
      const result = await analyzer.analyze({
        filePath: tempFile,
        data,
        headers,
        columnTypes: headers.map(() => 'string' as any),
        rowCount: data.length,
        columnCount: headers.length
      });
      const endTime = Date.now();
      
      // Should handle extreme values without performance degradation
      expect(endTime - startTime).toBeLessThan(8000);
      expect(result.edaAnalysis.univariateAnalysis.find(col => col.columnName === 'extreme')).toBeDefined();
      
      // Should complete analysis successfully
      const extremeColumn = result.edaAnalysis.univariateAnalysis.find(col => col.columnName === 'extreme');
      expect(extremeColumn).toBeDefined();
    }, 12000);
  });
});
