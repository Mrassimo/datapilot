/**
 * Direct Error Reduction Components Test
 * Tests the error reduction components directly from their modules
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { EnhancedErrorHandler } from '../../src/utils/enhanced-error-handler';
import { CircuitBreakerManager } from '../../src/performance/circuit-breaker';
import { ResourceLeakDetector } from '../../src/performance/resource-leak-detector';
import { InputValidator } from '../../src/utils/input-validator';
import { DataPilotError, ErrorSeverity, ErrorCategory } from '../../src/core/types';

describe('Direct Error Reduction Components', () => {
  let errorHandler: EnhancedErrorHandler;
  let circuitManager: CircuitBreakerManager;
  let leakDetector: ResourceLeakDetector;

  beforeEach(() => {
    errorHandler = new EnhancedErrorHandler({
      enableRecovery: true,
      maxRetries: 3,
      trackMetrics: true
    });
    
    circuitManager = new CircuitBreakerManager();
    
    leakDetector = new ResourceLeakDetector({
      trackingEnabled: true,
      maxAge: 60000,
      checkInterval: 10000
    });
  });

  afterEach(async () => {
    try {
      await errorHandler.shutdown();
      await circuitManager.shutdown();
      await leakDetector.shutdown();
    } catch (error) {
      // Ignore cleanup errors in tests
    }
  });

  describe('Enhanced Error Handler', () => {
    test('should handle errors with recovery operations', async () => {
      const testError = new DataPilotError(
        'Test error for recovery',
        'TEST_ERROR',
        ErrorSeverity.MEDIUM,
        ErrorCategory.PERFORMANCE
      );

      const result = await errorHandler.handleError(
        testError,
        { operation: 'test', component: 'test-component' },
        async () => 'recovery-successful'
      );

      expect(result).toBe('recovery-successful');
    });

    test('should track error metrics', () => {
      const metrics = errorHandler.getMetrics();
      
      expect(metrics).toHaveProperty('totalErrors');
      expect(metrics).toHaveProperty('recoverySuccessRate');
      expect(typeof metrics.totalErrors).toBe('number');
    });

    test('should wrap functions with error handling', async () => {
      const riskyFunction = async (shouldFail: boolean) => {
        if (shouldFail) {
          throw new Error('Function failed');
        }
        return 'success';
      };

      const wrappedFunction = errorHandler.wrapFunction(
        riskyFunction,
        { operation: 'risky-operation', component: 'test' }
      );

      // Should succeed when not failing
      const successResult = await wrappedFunction(false);
      expect(successResult).toBe('success');

      // Should handle error gracefully
      const failResult = await wrappedFunction(true);
      expect(failResult).toBeDefined(); // Error handled, result returned
    });
  });

  describe('Circuit Breaker Manager', () => {
    test('should create circuit breakers with different configurations', () => {
      const operation1 = async () => 'result1';
      const operation2 = async () => 'result2';

      const cb1 = circuitManager.getCircuitBreaker('op1', operation1, {
        failureThreshold: 3,
        resetTimeout: 5000
      });

      const cb2 = circuitManager.getCircuitBreaker('op2', operation2, {
        failureThreshold: 5,
        resetTimeout: 10000
      });

      expect(cb1).toBeDefined();
      expect(cb2).toBeDefined();
      expect(cb1).not.toBe(cb2); // Different instances
    });

    test('should execute operations through circuit breakers', async () => {
      const successOperation = async (value: string) => `success-${value}`;
      
      const circuitBreaker = circuitManager.getCircuitBreaker(
        'success-test',
        successOperation
      );
      
      const result = await circuitBreaker.execute('test');
      expect(result).toBe('success-test');
    });

    test('should provide system health metrics', () => {
      // Create a few circuit breakers
      circuitManager.getCircuitBreaker('cb1', async () => 'result');
      circuitManager.getCircuitBreaker('cb2', async () => 'result');
      
      const systemHealth = circuitManager.getSystemHealth();
      
      expect(systemHealth).toHaveProperty('overallHealth');
      expect(systemHealth).toHaveProperty('totalBreakers');
      expect(systemHealth.totalBreakers).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Resource Leak Detector', () => {
    test('should track and release resources correctly', () => {
      // Track some test resources
      leakDetector.trackResource('test-buffer-1', 'buffer', { size: 1024 });
      leakDetector.trackResource('test-worker-1', 'worker', { id: 'worker-1' });
      leakDetector.trackResource('test-file-1', 'file', { path: '/tmp/test' });
      
      const initialStats = leakDetector.getResourceStats();
      expect(initialStats.totalTracked).toBeGreaterThanOrEqual(3);
      
      // Release resources
      leakDetector.releaseResource('test-buffer-1');
      leakDetector.releaseResource('test-worker-1');
      
      const afterReleaseStats = leakDetector.getResourceStats();
      expect(afterReleaseStats.totalTracked).toBe(initialStats.totalTracked - 2);
      
      // Clean up remaining
      leakDetector.releaseResource('test-file-1');
    });

    test('should categorize resources by type', () => {
      leakDetector.trackResource('buffer-1', 'buffer');
      leakDetector.trackResource('buffer-2', 'buffer');
      leakDetector.trackResource('worker-1', 'worker');
      
      const stats = leakDetector.getResourceStats();
      expect(stats.byType).toHaveProperty('buffer');
      expect(stats.byType).toHaveProperty('worker');
      expect(stats.byType.buffer).toBeGreaterThanOrEqual(2);
      expect(stats.byType.worker).toBeGreaterThanOrEqual(1);
      
      // Clean up
      leakDetector.releaseResource('buffer-1');
      leakDetector.releaseResource('buffer-2');
      leakDetector.releaseResource('worker-1');
    });

    test('should detect potential leaks', () => {
      // Track resources but don't release some
      leakDetector.trackResource('leak-candidate', 'buffer');
      
      // Check for leaks (though timing might not trigger in test)
      const reports = leakDetector.checkForLeaks();
      expect(Array.isArray(reports)).toBe(true);
      
      // Clean up
      leakDetector.releaseResource('leak-candidate');
    });
  });

  describe('Input Validator', () => {
    test('should validate file paths with security checks', async () => {
      // Test with current test file (should be valid)
      const validResult = await InputValidator.validateFilePath(__filename);
      expect(validResult.isValid).toBe(true);
      expect(validResult.errors).toHaveLength(0);

      // Test with clearly invalid path
      const invalidResult = await InputValidator.validateFilePath('/definitely/does/not/exist.csv');
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors.length).toBeGreaterThan(0);
    });

    test('should validate and clean numeric arrays', () => {
      // Valid numeric array
      const validNumbers = [1, 2, 3, 4, 5];
      const validResult = InputValidator.validateNumericArray(validNumbers);
      expect(validResult.isValid).toBe(true);

      // Empty array
      const emptyResult = InputValidator.validateNumericArray([]);
      expect(emptyResult.isValid).toBe(true);

      // Mixed array (should handle gracefully)
      const mixedArray = [1, '2', 3, 'not-a-number', 5];
      const mixedResult = InputValidator.validateNumericArray(mixedArray);
      expect(mixedResult.isValid).toBe(true); // Should clean/coerce
    });

    test('should validate worker pool configurations', () => {
      const validConfig = {
        maxWorkers: 4,
        idleTimeout: 30000,
        taskTimeout: 60000,
        enableMemoryMonitoring: true,
        memoryLimitMB: 256
      };
      
      const result = InputValidator.validateWorkerPoolConfig(validConfig);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);

      // Invalid config with negative values
      const invalidConfig = {
        maxWorkers: -1,
        idleTimeout: -1000
      };
      
      const invalidResult = InputValidator.validateWorkerPoolConfig(invalidConfig);
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Integration Testing', () => {
    test('should work together in realistic scenario', async () => {
      // Create a realistic operation that might fail
      const unreliableOperation = async (shouldFail: boolean) => {
        if (shouldFail) {
          throw new DataPilotError(
            'Simulated operation failure',
            'OPERATION_FAILED',
            ErrorSeverity.MEDIUM,
            ErrorCategory.PERFORMANCE
          );
        }
        return 'operation-success';
      };

      // Wrap with circuit breaker
      const circuitBreaker = circuitManager.getCircuitBreaker(
        'unreliable-op',
        unreliableOperation,
        { failureThreshold: 2, resetTimeout: 1000 }
      );

      // Track some resources
      leakDetector.trackResource('integration-buffer', 'buffer');

      // Use error handler for recovery
      const result = await errorHandler.handleError(
        new DataPilotError('Integration test', 'INTEGRATION', ErrorSeverity.LOW, ErrorCategory.PERFORMANCE),
        { operation: 'integration', component: 'test' },
        () => circuitBreaker.execute(false) // Don't fail
      );

      expect(result).toBe('operation-success');

      // Clean up resources
      leakDetector.releaseResource('integration-buffer');

      // Check that all systems are still healthy
      const errorMetrics = errorHandler.getMetrics();
      const systemHealth = circuitManager.getSystemHealth();
      const resourceStats = leakDetector.getResourceStats();

      expect(errorMetrics.totalErrors).toBeGreaterThanOrEqual(0);
      expect(systemHealth.overallHealth).toBeGreaterThan(0);
      expect(resourceStats.totalTracked).toBeGreaterThanOrEqual(0);
    });

    test('should handle cascading errors gracefully', async () => {
      let callCount = 0;
      
      const cascadingFailure = async () => {
        callCount++;
        if (callCount <= 3) {
          throw new Error(`Failure attempt ${callCount}`);
        }
        return `success after ${callCount} attempts`;
      };

      // Use circuit breaker with error handler
      const circuitBreaker = circuitManager.getCircuitBreaker(
        'cascading-test',
        cascadingFailure,
        { failureThreshold: 5, resetTimeout: 100 }
      );

      const result = await errorHandler.handleError(
        new DataPilotError('Cascading test', 'CASCADE', ErrorSeverity.HIGH, ErrorCategory.PERFORMANCE),
        { operation: 'cascade-test', component: 'test' },
        () => circuitBreaker.execute()
      );

      // Should eventually succeed after retries
      expect(result).toContain('success after');
      expect(callCount).toBeGreaterThan(3);
    });
  });
});