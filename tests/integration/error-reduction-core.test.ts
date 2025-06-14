/**
 * Core Error Reduction Components Validation Test
 * Tests the individual error reduction components that have been implemented
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { 
  getGlobalEnhancedErrorHandler,
  shutdownGlobalEnhancedErrorHandler,
  getGlobalCircuitBreakerManager,
  shutdownGlobalCircuitBreakerManager,
  getGlobalResourceLeakDetector,
  shutdownGlobalResourceLeakDetector,
  InputValidator
} from '../../src/performance';
import { DataPilotError, ErrorSeverity, ErrorCategory } from '../../src/core/types';

describe('Core Error Reduction Components', () => {
  afterEach(async () => {
    // Clean shutdown after each test
    try {
      await shutdownGlobalEnhancedErrorHandler();
      await shutdownGlobalCircuitBreakerManager();
      await shutdownGlobalResourceLeakDetector();
    } catch (error) {
      // Ignore shutdown errors in tests
    }
    
    // Stop any monitoring and cleanup global resources
    const { globalMemoryManager, globalResourceManager } = await import('../../src/utils/memory-manager');
    globalMemoryManager.stopMonitoring();
    globalMemoryManager.runCleanup();
    globalResourceManager.cleanupAll();
    
    // Allow cleanup to complete
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  describe('Enhanced Error Handler', () => {
    test('should initialize and handle errors with recovery', async () => {
      const errorHandler = getGlobalEnhancedErrorHandler({
        enableRecovery: true,
        maxRetries: 3,
        trackMetrics: true
      });

      const testError = new DataPilotError(
        'Test error for recovery',
        'TEST_ERROR',
        ErrorSeverity.MEDIUM,
        ErrorCategory.PERFORMANCE
      );

      // Test error handling with recovery operation
      const result = await errorHandler.handleError(
        testError,
        { operation: 'test', component: 'test-component' },
        async () => 'recovery-successful'
      );

      expect(result).toBe('recovery-successful');
    });

    test('should track error metrics', () => {
      const errorHandler = getGlobalEnhancedErrorHandler();
      const metrics = errorHandler.getMetrics();
      
      expect(metrics).toHaveProperty('totalErrors');
      expect(metrics).toHaveProperty('recoverySuccessRate');
      expect(metrics).toHaveProperty('averageRecoveryTime');
      expect(typeof metrics.totalErrors).toBe('number');
    });

    test('should provide health status', () => {
      const errorHandler = getGlobalEnhancedErrorHandler();
      const healthStatus = errorHandler.getHealthStatus();
      
      expect(healthStatus).toHaveProperty('status');
      expect(['healthy', 'degraded', 'unhealthy']).toContain(healthStatus.status);
      expect(healthStatus).toHaveProperty('recommendations');
      expect(Array.isArray(healthStatus.recommendations)).toBe(true);
    });
  });

  describe('Circuit Breaker Manager', () => {
    test('should create and manage circuit breakers', () => {
      const circuitManager = getGlobalCircuitBreakerManager();
      
      const testOperation = async () => {
        return 'success';
      };
      
      const circuitBreaker = circuitManager.getCircuitBreaker(
        'test-operation',
        testOperation,
        { failureThreshold: 3, resetTimeout: 5000 }
      );
      
      expect(circuitBreaker).toBeDefined();
      expect(circuitBreaker.isAvailable()).toBe(true);
    });

    test('should provide system health metrics', () => {
      const circuitManager = getGlobalCircuitBreakerManager();
      const systemHealth = circuitManager.getSystemHealth();
      
      expect(systemHealth).toHaveProperty('overallHealth');
      expect(systemHealth).toHaveProperty('openBreakers');
      expect(systemHealth).toHaveProperty('totalBreakers');
      expect(typeof systemHealth.overallHealth).toBe('number');
    });

    test('should execute operations through circuit breaker', async () => {
      const circuitManager = getGlobalCircuitBreakerManager();
      
      const successOperation = async () => 'operation-result';
      
      const circuitBreaker = circuitManager.getCircuitBreaker(
        'success-test',
        successOperation,
        { failureThreshold: 2 }
      );
      
      const result = await circuitBreaker.execute();
      expect(result).toBe('operation-result');
    });
  });

  describe('Resource Leak Detector', () => {
    test('should track and release resources', () => {
      const leakDetector = getGlobalResourceLeakDetector({
        trackingEnabled: true,
        maxAge: 60000,
        checkInterval: 10000
      });
      
      // Track some test resources
      leakDetector.trackResource('test-resource-1', 'buffer', { size: 1024 });
      leakDetector.trackResource('test-resource-2', 'worker', { id: 'worker-1' });
      
      const stats = leakDetector.getResourceStats();
      expect(stats.totalTracked).toBeGreaterThanOrEqual(2);
      
      // Release resources
      leakDetector.releaseResource('test-resource-1');
      leakDetector.releaseResource('test-resource-2');
      
      const newStats = leakDetector.getResourceStats();
      expect(newStats.totalTracked).toBeLessThan(stats.totalTracked);
    });

    test('should detect potential leaks', () => {
      const leakDetector = getGlobalResourceLeakDetector();
      
      // Track a resource but don't release it immediately
      leakDetector.trackResource('potential-leak', 'buffer');
      
      const reports = leakDetector.checkForLeaks();
      expect(Array.isArray(reports)).toBe(true);
    });

    test('should provide resource statistics', () => {
      const leakDetector = getGlobalResourceLeakDetector();
      const stats = leakDetector.getResourceStats();
      
      expect(stats).toHaveProperty('totalTracked');
      expect(stats).toHaveProperty('potentialLeaks');
      expect(stats).toHaveProperty('byType');
      expect(typeof stats.totalTracked).toBe('number');
    });
  });

  describe('Input Validator', () => {
    test('should validate file paths correctly', async () => {
      // Test with current file (should exist)
      const validResult = await InputValidator.validateFilePath(__filename);
      expect(validResult.isValid).toBe(true);
      expect(validResult.errors).toHaveLength(0);

      // Test with non-existent file
      const invalidResult = await InputValidator.validateFilePath('/non/existent/path.csv');
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors.length).toBeGreaterThan(0);
    });

    test('should validate numeric arrays', () => {
      // Valid numeric array
      const validResult = InputValidator.validateNumericArray([1, 2, 3, 4, 5]);
      expect(validResult.isValid).toBe(true);

      // Array with some non-numeric values (should handle gracefully)
      const mixedResult = InputValidator.validateNumericArray([1, 'not-a-number', 3]);
      expect(mixedResult.isValid).toBe(true); // Should clean/coerce
    });

    test('should validate worker pool configuration', () => {
      const validConfig = { 
        maxWorkers: 4, 
        idleTimeout: 30000,
        taskTimeout: 60000,
        enableMemoryMonitoring: true
      };
      
      const result = InputValidator.validateWorkerPoolConfig(validConfig);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('Error Reduction Integration', () => {
    test('should work together without conflicts', async () => {
      // Initialize all core components
      const errorHandler = getGlobalEnhancedErrorHandler();
      const circuitManager = getGlobalCircuitBreakerManager();
      const leakDetector = getGlobalResourceLeakDetector();
      
      // All components should be functional
      expect(errorHandler).toBeDefined();
      expect(circuitManager).toBeDefined();
      expect(leakDetector).toBeDefined();
      
      // Test integrated functionality
      const testOperation = async () => {
        leakDetector.trackResource('integration-test', 'buffer');
        await new Promise(resolve => setTimeout(resolve, 10)); // Small delay
        leakDetector.releaseResource('integration-test');
        return 'integration-success';
      };
      
      const circuitBreaker = circuitManager.getCircuitBreaker(
        'integration-test',
        testOperation
      );
      
      const result = await errorHandler.handleError(
        new DataPilotError('Integration test', 'INTEGRATION_TEST', ErrorSeverity.LOW, ErrorCategory.PERFORMANCE),
        { operation: 'integration', component: 'test' },
        () => circuitBreaker.execute()
      );
      
      expect(result).toBe('integration-success');
    });

    test('should maintain performance under moderate load', async () => {
      const errorHandler = getGlobalEnhancedErrorHandler();
      const startTime = Date.now();
      
      // Process multiple errors concurrently
      const errorPromises = Array.from({ length: 10 }, async (_, i) => {
        const testError = new DataPilotError(
          `Load test error ${i}`,
          'LOAD_TEST',
          ErrorSeverity.LOW,
          ErrorCategory.PERFORMANCE
        );
        
        return errorHandler.handleError(
          testError,
          { operation: `load-test-${i}`, component: 'test' },
          async () => `result-${i}`
        );
      });
      
      const results = await Promise.all(errorPromises);
      const endTime = Date.now();
      
      // All should succeed
      expect(results).toHaveLength(10);
      results.forEach((result, i) => {
        expect(result).toBe(`result-${i}`);
      });
      
      // Should complete in reasonable time (less than 2 seconds)
      const executionTime = endTime - startTime;
      expect(executionTime).toBeLessThan(2000);
    });
  });
});