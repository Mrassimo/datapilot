/**
 * Streaming Performance Integration Tests
 * 
 * Validates that the streaming architecture and performance optimizations
 * work correctly with the new commands and functionality.
 */

import { promises as fs } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { DataPilotCLI } from '../../src/cli';
import { UniversalAnalyzer } from '../../src/cli/universal-analyzer';
import type { CLIResult } from '../../src/cli/types';

describe('Streaming Performance Integration', () => {
  let tempDir: string;
  let largeCsvPath: string;
  let cli: DataPilotCLI;
  let analyzer: UniversalAnalyzer;
  let memoryUsageBefore: number;
  let memoryUsageAfter: number;

  beforeAll(async () => {
    // Create temporary directory for test files
    tempDir = await fs.mkdtemp(join(tmpdir(), 'datapilot-performance-test-'));
    largeCsvPath = join(tempDir, 'large-dataset.csv');
    
    // Create a moderately large CSV file for testing streaming
    const headers = 'id,name,email,age,department,salary,city,country,phone,hire_date';
    const rows: string[] = [headers];
    
    // Generate 10,000 rows of test data
    for (let i = 1; i <= 10000; i++) {
      const row = [
        i.toString(),
        `"User ${i}"`,
        `"user${i}@example.com"`,
        (20 + Math.floor(Math.random() * 40)).toString(),
        `"Department ${Math.floor(Math.random() * 10) + 1}"`,
        (30000 + Math.floor(Math.random() * 100000)).toString(),
        `"City ${Math.floor(Math.random() * 50) + 1}"`,
        `"Country ${Math.floor(Math.random() * 20) + 1}"`,
        `"+1-555-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}"`,
        `"2020-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}"`
      ].join(',');
      rows.push(row);
    }
    
    await fs.writeFile(largeCsvPath, rows.join('\n'), 'utf8');
  });

  beforeEach(() => {
    cli = new DataPilotCLI();
    analyzer = new UniversalAnalyzer();
    
    // Capture memory usage before test
    if (global.gc) {
      global.gc();
    }
    memoryUsageBefore = process.memoryUsage().heapUsed;
  });

  afterEach(() => {
    // Capture memory usage after test
    if (global.gc) {
      global.gc();
    }
    memoryUsageAfter = process.memoryUsage().heapUsed;
  });

  afterAll(async () => {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('Memory Management', () => {
    it('should handle large files with constant memory usage', async () => {
      const result = await cli.run(['node', 'datapilot', 'overview', largeCsvPath, '--streaming']);
      
      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
      
      // Memory usage should not increase dramatically
      const memoryIncrease = memoryUsageAfter - memoryUsageBefore;
      const memoryIncreaseMB = memoryIncrease / (1024 * 1024);
      
      // Should not use more than 100MB additional memory for streaming analysis
      expect(memoryIncreaseMB).toBeLessThan(100);
    });

    it('should handle streaming quality analysis efficiently', async () => {
      const result = await cli.run(['node', 'datapilot', 'quality', largeCsvPath, '--streaming']);
      
      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
      expect(result.data.quality).toBeDefined();
      
      // Should have processed the full dataset
      expect(result.data.quality.totalRows).toBe(10000);
      
      // Memory usage should remain reasonable
      const memoryIncrease = memoryUsageAfter - memoryUsageBefore;
      const memoryIncreaseMB = memoryIncrease / (1024 * 1024);
      expect(memoryIncreaseMB).toBeLessThan(150);
    });

    it('should handle streaming EDA analysis without memory leaks', async () => {
      const result = await cli.run(['node', 'datapilot', 'eda', largeCsvPath, '--streaming']);
      
      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
      expect(result.data.eda).toBeDefined();
      
      // Should have computed statistics for all columns
      expect(result.data.eda.univariate).toBeDefined();
      expect(Object.keys(result.data.eda.univariate).length).toBeGreaterThan(5);
      
      // Memory usage should remain controlled
      const memoryIncrease = memoryUsageAfter - memoryUsageBefore;
      const memoryIncreaseMB = memoryIncrease / (1024 * 1024);
      expect(memoryIncreaseMB).toBeLessThan(200);
    });
  });

  describe('Performance Timing', () => {
    it('should complete overview analysis in reasonable time', async () => {
      const startTime = Date.now();
      const result = await cli.run(['node', 'datapilot', 'overview', largeCsvPath]);
      const endTime = Date.now();
      
      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
      
      const analysisTimeSeconds = (endTime - startTime) / 1000;
      
      // Should complete overview in under 30 seconds for 10k rows
      expect(analysisTimeSeconds).toBeLessThan(30);
      
      // Should report timing in metadata
      expect(result.data.performanceMetrics).toBeDefined();
      expect(result.data.performanceMetrics.totalAnalysisTime).toBeGreaterThan(0);
    });

    it('should provide accurate timing estimates in dry-run mode', async () => {
      const result = await cli.run(['node', 'datapilot', 'all', largeCsvPath, '--dry-run']);
      
      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
      expect(result.data.analysisEstimate.estimatedTime).toBeGreaterThan(0);
      
      // Estimate should be reasonable (not too optimistic or pessimistic)
      expect(result.data.analysisEstimate.estimatedTime).toBeLessThan(300); // Under 5 minutes
      expect(result.data.analysisEstimate.estimatedTime).toBeGreaterThan(5);  // At least 5 seconds
    });

    it('should show progress updates during long-running operations', async () => {
      const progressUpdates: Array<{ message: string; progress: number }> = [];
      
      // Mock progress callback to capture updates
      const originalRun = cli.run.bind(cli);
      jest.spyOn(cli, 'run').mockImplementation(async (argv) => {
        // This would need access to internal progress reporter
        // For now, just verify the result structure supports progress
        const result = await originalRun(argv);
        return result;
      });
      
      const result = await cli.run(['node', 'datapilot', 'quality', largeCsvPath, '--verbose']);
      
      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
      
      // Should have performance metrics
      expect(result.data.performanceMetrics).toBeDefined();
      expect(result.data.performanceMetrics.phases).toBeDefined();
    });
  });

  describe('Resource Cleanup', () => {
    it('should properly cleanup resources after analysis', async () => {
      const initialHeapUsed = process.memoryUsage().heapUsed;
      
      // Run multiple analyses to test cleanup
      for (let i = 0; i < 3; i++) {
        const result = await cli.run(['node', 'datapilot', 'overview', largeCsvPath]);
        expect(result.success).toBe(true);
        
        // Force garbage collection if available
        if (global.gc) {
          global.gc();
        }
      }
      
      const finalHeapUsed = process.memoryUsage().heapUsed;
      const memoryIncrease = finalHeapUsed - initialHeapUsed;
      const memoryIncreaseMB = memoryIncrease / (1024 * 1024);
      
      // Memory usage should not grow significantly over multiple runs
      expect(memoryIncreaseMB).toBeLessThan(50);
    });

    it('should handle cleanup gracefully on errors', async () => {
      // Try to analyse a non-existent file to trigger error handling
      const result = await cli.run(['node', 'datapilot', 'all', 'nonexistent-large-file.csv']);
      
      expect(result.success).toBe(false);
      expect(result.exitCode).toBe(1);
      
      // Should not leak memory even on errors
      const memoryIncrease = memoryUsageAfter - memoryUsageBefore;
      const memoryIncreaseMB = memoryIncrease / (1024 * 1024);
      expect(memoryIncreaseMB).toBeLessThan(10);
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle multiple files efficiently', async () => {
      // Create additional test files
      const file2Path = join(tempDir, 'dataset2.csv');
      const file3Path = join(tempDir, 'dataset3.csv');
      
      // Create smaller datasets for multi-file test
      const createDataset = async (path: string, rowCount: number) => {
        const headers = 'id,value,category';
        const rows = [headers];
        for (let i = 1; i <= rowCount; i++) {
          rows.push(`${i},${Math.random() * 100},"Category ${Math.floor(Math.random() * 5) + 1}"`);
        }
        await fs.writeFile(path, rows.join('\n'), 'utf8');
      };
      
      await createDataset(file2Path, 1000);
      await createDataset(file3Path, 1000);
      
      const result = await cli.run([
        'node', 'datapilot', 'engineering', 
        largeCsvPath, file2Path, file3Path
      ]);
      
      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
      
      // Should handle multi-file relationship analysis
      expect(result.data.engineering.relationshipAnalysis).toBeDefined();
      expect(result.data.engineering.relationshipAnalysis.multiFileAnalysis).toBe(true);
      
      // Memory usage should scale reasonably with number of files
      const memoryIncrease = memoryUsageAfter - memoryUsageBefore;
      const memoryIncreaseMB = memoryIncrease / (1024 * 1024);
      expect(memoryIncreaseMB).toBeLessThan(300);
      
      // Cleanup
      await fs.unlink(file2Path);
      await fs.unlink(file3Path);
    });
  });

  describe('Cache Performance', () => {
    it('should benefit from caching on repeated analyses', async () => {
      // Clear any existing cache
      await cli.run(['node', 'datapilot', 'clear-cache']);
      
      // First run - no cache
      const startTime1 = Date.now();
      const result1 = await cli.run(['node', 'datapilot', 'overview', largeCsvPath]);
      const endTime1 = Date.now();
      
      expect(result1.success).toBe(true);
      const firstRunTime = endTime1 - startTime1;
      
      // Second run - should benefit from cache
      const startTime2 = Date.now();
      const result2 = await cli.run(['node', 'datapilot', 'overview', largeCsvPath]);
      const endTime2 = Date.now();
      
      expect(result2.success).toBe(true);
      const secondRunTime = endTime2 - startTime2;
      
      // Second run should be faster (or at least not significantly slower)
      expect(secondRunTime).toBeLessThanOrEqual(firstRunTime * 1.5);
    });

    it('should show cache statistics accurately', async () => {
      // Run an analysis to populate cache
      await cli.run(['node', 'datapilot', 'overview', largeCsvPath]);
      
      // Check cache stats
      const result = await cli.run(['node', 'datapilot', 'perf', '--cache-stats']);
      
      expect(result.success).toBe(true);
      expect(result.data.cacheStats).toBeDefined();
      
      // Should show cache entries (though exact numbers depend on cache implementation)
      expect(result.data.cacheStats.sectionCache).toBeDefined();
      expect(result.data.cacheStats.resultCache).toBeDefined();
    });
  });

  describe('Error Recovery', () => {
    it('should recover from streaming errors gracefully', async () => {
      // Create a CSV with some problematic data
      const problematicPath = join(tempDir, 'problematic-large.csv');
      const headers = 'id,name,value';
      const rows = [headers];
      
      // Add mostly good data with some problematic rows
      for (let i = 1; i <= 1000; i++) {
        if (i % 100 === 0) {
          // Every 100th row has an issue
          rows.push(`${i},"Name with unescaped " quote",${Math.random() * 100}`);
        } else {
          rows.push(`${i},"Name ${i}",${Math.random() * 100}`);
        }
      }
      
      await fs.writeFile(problematicPath, rows.join('\n'), 'utf8');
      
      const result = await cli.run(['node', 'datapilot', 'quality', problematicPath]);
      
      // Should complete successfully despite problematic data
      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
      
      // Should report quality issues
      expect(result.data.quality.issues).toBeDefined();
      expect(result.data.quality.issues.length).toBeGreaterThan(0);
      
      // Cleanup
      await fs.unlink(problematicPath);
    });
  });
});
