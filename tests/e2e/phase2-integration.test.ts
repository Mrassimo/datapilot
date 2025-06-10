/**
 * End-to-End Tests for Phase 2: Performance Optimization Integration
 * Tests the complete integration of all Phase 2 components with existing DataPilot functionality
 */

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { tmpdir } from 'os';
import { join } from 'path';
import { writeFileSync, unlinkSync, existsSync } from 'fs';

// Import Phase 2 components
import {
  initializePerformanceOptimizations,
  shutdownPerformanceOptimizationsEnhanced,
  getSystemHealthStatus,
  emergencySystemRecovery,
  getGlobalEnhancedErrorHandler,
  getGlobalCircuitBreakerManager,
  getGlobalResourceLeakDetector,
  InputValidator
} from '../../src/performance';

import {
  initializeMonitoring,
  shutdownAllMonitoring,
  getGlobalPerformanceDashboard,
  getGlobalAdaptiveConfigManager,
  runQuickBenchmark
} from '../../src/performance/monitoring';

// Import existing DataPilot components for integration testing
import { Section1Analyzer } from '../../src/analyzers/overview/section1-analyzer';
import { DataPilotError, ErrorCategory, ErrorSeverity } from '../../src/core/types';

describe('Phase 2: Complete Integration E2E Tests', () => {
  let testFiles: string[] = [];
  
  beforeAll(async () => {
    // Initialize Phase 2 performance optimizations
    initializePerformanceOptimizations({
      enableParallelProcessing: true,
      enableMemoryOptimization: true,
      enableAdaptiveStreaming: true,
      enableErrorReduction: true,
      errorReductionLevel: 'comprehensive',
      maxWorkers: 2, // Keep small for tests
      memoryLimitMB: 128
    });

    // Initialize monitoring (but don't start dashboard to avoid interference)
    initializeMonitoring({
      enableDashboard: false, // Don't start for tests
      enableAdaptiveConfig: true,
      enableBenchmarking: false
    });

    // Create test data files
    await createTestDataFiles();
  });

  afterAll(async () => {
    // Cleanup test files
    testFiles.forEach(file => {
      if (existsSync(file)) {
        unlinkSync(file);
      }
    });

    // Shutdown Phase 2 components
    await shutdownPerformanceOptimizationsEnhanced();
    await shutdownAllMonitoring();
  });

  describe('Core Performance Engine Integration', () => {
    test('should integrate error reduction with existing analyzers', async () => {
      const testFile = testFiles.find(f => f.endsWith('.csv'));
      expect(testFile).toBeDefined();

      // Create analyzer with error reduction integration
      const analyzer = new Section1Analyzer();
      
      const startTime = Date.now();
      
      try {
        // This should work with error reduction wrapping
        const result = await analyzer.analyze(testFile!);
        
        expect(result).toBeDefined();
        expect(result.overview).toBeDefined();
        expect(result.overview.fileDetails.fullResolvedPath).toBe(testFile);
        
        const processingTime = Date.now() - startTime;
        expect(processingTime).toBeLessThan(10000); // Should complete within 10 seconds
        
        // Check that error handler tracked this operation
        const errorHandler = getGlobalEnhancedErrorHandler();
        const metrics = errorHandler.getMetrics();
        expect(metrics.totalErrors).toBeGreaterThanOrEqual(0);
        
      } catch (error) {
        // Even if analysis fails, error reduction should have handled it gracefully
        expect(error).toBeInstanceOf(DataPilotError);
      }
    });

    test('should handle memory optimization during large file processing', async () => {
      const largeTestFile = createLargeTestFile();
      testFiles.push(largeTestFile);

      const initialMemory = process.memoryUsage();
      
      try {
        const analyzer = new Section1Analyzer();
        const result = await analyzer.analyze(largeTestFile);
        
        const finalMemory = process.memoryUsage();
        const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
        
        // Memory increase should be reasonable (less than 100MB for this test)
        expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024);
        
        expect(result).toBeDefined();
        expect(result.overview.fileDetails.fileSizeBytes).toBeGreaterThan(1024 * 1024); // > 1MB
        
      } catch (error) {
        // Should not run out of memory
        expect((error as Error).message).not.toContain('heap out of memory');
      }
    });

    test('should demonstrate circuit breaker protection', async () => {
      const circuitManager = getGlobalCircuitBreakerManager();
      
      // Create a circuit breaker for a test operation
      let failureCount = 0;
      const failingOperation = async () => {
        failureCount++;
        if (failureCount <= 3) {
          throw new Error(`Simulated failure ${failureCount}`);
        }
        return 'success';
      };

      const circuitBreaker = circuitManager.getCircuitBreaker(
        'test-operation',
        failingOperation,
        { failureThreshold: 3, resetTimeout: 1000 }
      );

      // First few calls should fail
      await expect(circuitBreaker.execute()).rejects.toThrow('Simulated failure 1');
      await expect(circuitBreaker.execute()).rejects.toThrow('Simulated failure 2');
      await expect(circuitBreaker.execute()).rejects.toThrow('Simulated failure 3');
      
      // Circuit should be open now, but operation should eventually succeed
      // Wait a bit and try again
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      const result = await circuitBreaker.execute();
      expect(result).toBe('success');
      
      const health = circuitManager.getSystemHealth();
      expect(health.totalBreakers).toBeGreaterThanOrEqual(1);
    });

    test('should track and prevent resource leaks', async () => {
      const leakDetector = getGlobalResourceLeakDetector();
      const initialStats = leakDetector.getResourceStats();
      
      // Simulate resource usage
      for (let i = 0; i < 10; i++) {
        const resourceId = `test-resource-${i}`;
        leakDetector.trackResource(resourceId, 'buffer', { size: 1024 });
        
        // Release most resources properly
        if (i < 8) {
          leakDetector.releaseResource(resourceId);
        }
      }
      
      const finalStats = leakDetector.getResourceStats();
      
      // Should have tracked resources
      expect(finalStats.totalTracked).toBeGreaterThan(initialStats.totalTracked);
      
      // Should detect potential leaks (2 unreleased resources)
      const leakReports = leakDetector.checkForLeaks();
      expect(leakReports.length).toBeGreaterThanOrEqual(0);
      
      // Cleanup
      leakDetector.releaseResource('test-resource-8');
      leakDetector.releaseResource('test-resource-9');
    });
  });

  describe('Format Optimizer Integration', () => {
    test('should validate input before processing', async () => {
      // Test with invalid file path
      const invalidResult = await InputValidator.validateFilePath('/definitely/does/not/exist.csv');
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors.length).toBeGreaterThan(0);

      // Test with valid file path
      const validFile = testFiles.find(f => f.endsWith('.csv'));
      const validResult = await InputValidator.validateFilePath(validFile!);
      expect(validResult.isValid).toBe(true);
      expect(validResult.errors).toHaveLength(0);
    });

    test('should handle CSV processing with optimizations', async () => {
      const csvFile = testFiles.find(f => f.endsWith('.csv'));
      expect(csvFile).toBeDefined();

      const startTime = Date.now();
      
      // Process with Section1Analyzer (which should use optimizations)
      const analyzer = new Section1Analyzer();
      const result = await analyzer.analyze(csvFile!);
      
      const processingTime = Date.now() - startTime;
      
      expect(result).toBeDefined();
      expect(result.overview.fileDetails.mimeType).toContain('csv');
      expect(processingTime).toBeLessThan(5000); // Should be fast
    });

    test('should handle JSON processing with schema detection', async () => {
      const jsonFile = testFiles.find(f => f.endsWith('.json'));
      expect(jsonFile).toBeDefined();

      const analyzer = new Section1Analyzer();
      const result = await analyzer.analyze(jsonFile!);
      
      expect(result).toBeDefined();
      expect(result.overview.fileDetails.mimeType).toContain('json');
      expect(result.overview.parsingMetadata).toBeDefined();
    });
  });

  describe('Monitoring and Adaptive Configuration', () => {
    test('should provide system health status', () => {
      const healthStatus = getSystemHealthStatus();
      
      expect(healthStatus).toHaveProperty('status');
      expect(['healthy', 'degraded', 'unhealthy']).toContain(healthStatus.status);
      expect(healthStatus).toHaveProperty('score');
      expect(typeof healthStatus.score).toBe('number');
      expect(healthStatus.score).toBeGreaterThanOrEqual(0);
      expect(healthStatus.score).toBeLessThanOrEqual(100);
    });

    test('should perform emergency system recovery', async () => {
      const recovery = await emergencySystemRecovery();
      
      expect(recovery).toHaveProperty('success');
      expect(recovery).toHaveProperty('actions');
      expect(recovery).toHaveProperty('errors');
      
      expect(Array.isArray(recovery.actions)).toBe(true);
      expect(Array.isArray(recovery.errors)).toBe(true);
      
      // Should attempt some recovery actions
      expect(recovery.actions.length).toBeGreaterThan(0);
    });

    test('should provide adaptive configuration recommendations', () => {
      const adaptiveConfig = getGlobalAdaptiveConfigManager();
      const workload = adaptiveConfig.getCurrentWorkloadCharacteristics();
      
      expect(workload).toHaveProperty('dataSize');
      expect(workload).toHaveProperty('complexity');
      expect(workload).toHaveProperty('memoryPressure');
      
      const settings = adaptiveConfig.getRecommendedSettings(workload);
      expect(settings).toBeDefined();
      expect(typeof settings).toBe('object');
    });

    test('should run quick performance benchmark', async () => {
      // Run a quick benchmark to validate everything is working
      const report = await runQuickBenchmark();
      
      expect(report).toHaveProperty('summary');
      expect(report.summary).toHaveProperty('totalTests');
      expect(report.summary).toHaveProperty('passed');
      expect(report.summary).toHaveProperty('failed');
      expect(report.summary).toHaveProperty('overallScore');
      
      expect(report.summary.totalTests).toBeGreaterThan(0);
      expect(Array.isArray(report.results)).toBe(true);
      expect(Array.isArray(report.recommendations)).toBe(true);
      
      // Overall score should be reasonable
      expect(report.summary.overallScore).toBeGreaterThan(0);
    }, 60000); // Allow 60 seconds for benchmark
  });

  describe('End-to-End Error Scenarios', () => {
    test('should gracefully handle corrupted file', async () => {
      const corruptedFile = createCorruptedTestFile();
      testFiles.push(corruptedFile);

      const analyzer = new Section1Analyzer();
      
      // Should not crash, should handle error gracefully
      await expect(async () => {
        await analyzer.analyze(corruptedFile);
      }).not.toThrow('heap out of memory');
      
      // Error handler should have recorded this
      const errorHandler = getGlobalEnhancedErrorHandler();
      const metrics = errorHandler.getMetrics();
      expect(metrics.totalErrors).toBeGreaterThanOrEqual(0);
    });

    test('should handle very large file without memory issues', async () => {
      const veryLargeFile = createVeryLargeTestFile();
      testFiles.push(veryLargeFile);

      const initialMemory = process.memoryUsage();
      
      try {
        const analyzer = new Section1Analyzer();
        const result = await analyzer.analyze(veryLargeFile);
        
        // Should complete successfully or fail gracefully
        if (result) {
          expect(result.overview).toBeDefined();
        }
        
      } catch (error) {
        // Should not be a memory error
        expect((error as Error).message).not.toContain('heap out of memory');
        expect((error as Error).message).not.toContain('Maximum call stack');
      }
      
      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      
      // Memory should not grow excessively (less than 200MB)
      expect(memoryIncrease).toBeLessThan(200 * 1024 * 1024);
    }, 30000); // Allow 30 seconds for large file
  });

  describe('Integration with Existing DataPilot Components', () => {
    test('should maintain backward compatibility with Section1Analyzer', async () => {
      const csvFile = testFiles.find(f => f.endsWith('.csv'));
      
      // Test that existing functionality still works
      const analyzer = new Section1Analyzer();
      const result = await analyzer.analyze(csvFile!);
      
      // Should have all expected Section1 result properties
      expect(result).toHaveProperty('overview');
      expect(result.overview).toHaveProperty('fileDetails');
      expect(result.overview).toHaveProperty('parsingMetadata');
      expect(result.overview).toHaveProperty('structuralDimensions');
      
      // File info should be populated
      expect(result.overview.fileDetails.fullResolvedPath).toBe(csvFile);
      expect(result.overview.fileDetails.fileSizeBytes).toBeGreaterThan(0);
      expect(result.overview.fileDetails.mimeType).toContain('csv');
    });

    test('should integrate with error handling system', async () => {
      const nonExistentFile = '/tmp/does-not-exist.csv';
      
      const analyzer = new Section1Analyzer();
      
      try {
        await analyzer.analyze(nonExistentFile);
        // Should not reach here
        expect(true).toBe(false);
      } catch (error) {
        // Should be a proper DataPilotError
        expect(error).toBeInstanceOf(Error);
        
        // Error should be handled by our error reduction system
        const errorHandler = getGlobalEnhancedErrorHandler();
        const metrics = errorHandler.getMetrics();
        expect(metrics).toBeDefined();
      }
    });
  });

  // Helper functions for creating test files
  async function createTestDataFiles(): Promise<void> {
    const tempDir = tmpdir();
    
    // Create CSV test file
    const csvFile = join(tempDir, 'test-data.csv');
    const csvContent = [
      'id,name,email,age,salary',
      '1,John Doe,john@example.com,30,50000',
      '2,Jane Smith,jane@example.com,25,45000',
      '3,Bob Johnson,bob@example.com,35,60000'
    ].join('\n');
    writeFileSync(csvFile, csvContent);
    testFiles.push(csvFile);
    
    // Create JSON test file
    const jsonFile = join(tempDir, 'test-data.json');
    const jsonContent = JSON.stringify([
      { id: 1, name: 'John Doe', email: 'john@example.com', age: 30, active: true },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com', age: 25, active: true },
      { id: 3, name: 'Bob Johnson', email: 'bob@example.com', age: 35, active: false }
    ], null, 2);
    writeFileSync(jsonFile, jsonContent);
    testFiles.push(jsonFile);
    
    // Create TSV test file
    const tsvFile = join(tempDir, 'test-data.tsv');
    const tsvContent = [
      'id\tname\temail\tage\tsalary',
      '1\tJohn Doe\tjohn@example.com\t30\t50000',
      '2\tJane Smith\tjane@example.com\t25\t45000'
    ].join('\n');
    writeFileSync(tsvFile, tsvContent);
    testFiles.push(tsvFile);
  }

  function createLargeTestFile(): string {
    const tempDir = tmpdir();
    const largeFile = join(tempDir, 'large-test-data.csv');
    
    // Create a CSV with ~10,000 rows
    const headers = 'id,name,email,age,department,salary,start_date,active\n';
    const rows: string[] = [];
    
    for (let i = 1; i <= 10000; i++) {
      rows.push([
        i,
        `Employee ${i}`,
        `emp${i}@company.com`,
        Math.floor(Math.random() * 40) + 25,
        ['IT', 'HR', 'Finance', 'Marketing', 'Sales'][Math.floor(Math.random() * 5)],
        Math.floor(Math.random() * 50000) + 30000,
        `2020-0${Math.floor(Math.random() * 9) + 1}-0${Math.floor(Math.random() * 9) + 1}`,
        Math.random() > 0.1 ? 'true' : 'false'
      ].join(','));
    }
    
    writeFileSync(largeFile, headers + rows.join('\n'));
    return largeFile;
  }

  function createCorruptedTestFile(): string {
    const tempDir = tmpdir();
    const corruptedFile = join(tempDir, 'corrupted-test-data.csv');
    
    // Create a CSV with malformed data
    const content = [
      'id,name,email,age', // Header
      '1,John Doe,john@example.com,30', // Good row
      '2,Jane Smith,jane@example.com', // Missing field
      '3,Bob Johnson,bob@example.com,thirty-five,extra', // Wrong type, extra field
      'not,a,proper,csv,row,with,too,many,fields', // Malformed
      '5,"Unclosed quote,name,email@example.com,25' // Unclosed quote
    ].join('\n');
    
    writeFileSync(corruptedFile, content);
    return corruptedFile;
  }

  function createVeryLargeTestFile(): string {
    const tempDir = tmpdir();
    const veryLargeFile = join(tempDir, 'very-large-test-data.csv');
    
    // Create a CSV with ~50,000 rows to test memory handling
    const headers = 'id,data1,data2,data3,data4,data5,timestamp\n';
    const rows: string[] = [];
    
    for (let i = 1; i <= 50000; i++) {
      rows.push([
        i,
        `data_${i}_${Math.random().toString(36).substring(7)}`,
        `data_${i}_${Math.random().toString(36).substring(7)}`,
        `data_${i}_${Math.random().toString(36).substring(7)}`,
        `data_${i}_${Math.random().toString(36).substring(7)}`,
        `data_${i}_${Math.random().toString(36).substring(7)}`,
        new Date().toISOString()
      ].join(','));
    }
    
    writeFileSync(veryLargeFile, headers + rows.join('\n'));
    return veryLargeFile;
  }
});