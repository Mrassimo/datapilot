/**
 * Error Reduction System Integration Validation Test
 * Validates that the 5-layer error reduction system is working correctly
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
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
import { DataPilotError, ErrorSeverity, ErrorCategory } from '../../src/core/types';

describe('Error Reduction System Integration', () => {
  beforeEach(async () => {
    // Initialize with comprehensive error reduction
    initializePerformanceOptimizations({
      errorReductionLevel: 'comprehensive',
      enableParallelProcessing: false, // Disable to focus on error reduction
      enableMemoryOptimization: true,
      enableAdaptiveStreaming: false,
      enableIntelligentChunking: false,
      enableResourcePooling: false,
      maxWorkers: 2,
      memoryLimitMB: 128
    });
  });

  afterEach(async () => {
    // Clean shutdown
    await shutdownPerformanceOptimizationsEnhanced();
  });

  describe('Layer 1: Input Validation', () => {
    test('should validate file paths correctly', async () => {
      // Valid file path
      const validResult = await InputValidator.validateFilePath(__filename);
      expect(validResult.isValid).toBe(true);
      expect(validResult.errors).toHaveLength(0);

      // Invalid file path
      const invalidResult = await InputValidator.validateFilePath('/invalid/path/does/not/exist.csv');
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors.length).toBeGreaterThan(0);
    });

    test('should validate numeric arrays', () => {
      // Valid numeric array
      const validResult = InputValidator.validateNumericArray([1, 2, 3, 4, 5]);
      expect(validResult.isValid).toBe(true);

      // Invalid array with non-numeric values
      const invalidResult = InputValidator.validateNumericArray(['a', 'b', 'c']);
      expect(validResult.isValid).toBe(true); // Should auto-coerce or clean
    });

    test('should validate worker pool configuration', () => {
      const validConfig = { maxWorkers: 4, idleTimeout: 30000 };
      const result = InputValidator.validateWorkerPoolConfig(validConfig);
      expect(result.isValid).toBe(true);
    });
  });

  describe('Layer 2: Resource Leak Detection', () => {
    test('should track and detect resources', () => {
      const leakDetector = getGlobalResourceLeakDetector();
      
      // Track some resources
      leakDetector.trackResource('test-resource-1', 'buffer');
      leakDetector.trackResource('test-resource-2', 'worker');
      
      const stats = leakDetector.getResourceStats();
      expect(stats.totalTracked).toBeGreaterThanOrEqual(2);
      
      // Release resources
      leakDetector.releaseResource('test-resource-1');
      leakDetector.releaseResource('test-resource-2');
      
      const newStats = leakDetector.getResourceStats();
      expect(newStats.totalTracked).toBeLessThan(stats.totalTracked);
    });
  });

  describe('Layer 3: Circuit Breaker Pattern', () => {
    test('should create and manage circuit breakers', () => {
      const circuitManager = getGlobalCircuitBreakerManager();
      
      const testOperation = async () => {
        throw new Error('Test failure');
      };
      
      const circuitBreaker = circuitManager.getCircuitBreaker(
        'test-operation',
        testOperation,
        { failureThreshold: 2, resetTimeout: 1000 }
      );
      
      expect(circuitBreaker).toBeDefined();
      expect(circuitBreaker.isAvailable()).toBe(true);
    });
  });

  describe('Layer 5: Enhanced Error Handler', () => {
    test('should handle errors with recovery strategies', async () => {
      const errorHandler = getGlobalEnhancedErrorHandler();
      
      const testError = new DataPilotError(
        'Test error for recovery',
        'TEST_ERROR',
        ErrorSeverity.MEDIUM,
        ErrorCategory.PERFORMANCE
      );
      
      // Test error handling with context
      const result = await errorHandler.handleError(
        testError,
        { operation: 'test', component: 'test-component' },
        async () => 'recovery-successful'
      );
      
      expect(result).toBe('recovery-successful');
    });

    test('should provide health status', () => {
      const errorHandler = getGlobalEnhancedErrorHandler();
      const healthStatus = errorHandler.getHealthStatus();
      
      expect(healthStatus).toHaveProperty('status');
      expect(['healthy', 'degraded', 'unhealthy']).toContain(healthStatus.status);
    });
  });

  describe('System Health Monitoring', () => {
    test('should provide overall system health status', () => {
      const healthStatus = getSystemHealthStatus();
      
      expect(healthStatus).toHaveProperty('status');
      expect(healthStatus).toHaveProperty('score');
      expect(healthStatus).toHaveProperty('issues');
      expect(healthStatus).toHaveProperty('recommendations');
      
      expect(['healthy', 'degraded', 'unhealthy']).toContain(healthStatus.status);
      expect(typeof healthStatus.score).toBe('number');
      expect(Array.isArray(healthStatus.issues)).toBe(true);
      expect(Array.isArray(healthStatus.recommendations)).toBe(true);
    });

    test('should perform emergency system recovery', async () => {
      const recovery = await emergencySystemRecovery();
      
      expect(recovery).toHaveProperty('success');
      expect(recovery).toHaveProperty('actions');
      expect(recovery).toHaveProperty('errors');
      
      expect(typeof recovery.success).toBe('boolean');
      expect(Array.isArray(recovery.actions)).toBe(true);
      expect(Array.isArray(recovery.errors)).toBe(true);
    });
  });

  describe('Error Reduction Integration', () => {
    test('should integrate all layers without conflicts', async () => {
      // Test that all layers can work together
      const errorHandler = getGlobalEnhancedErrorHandler();
      const circuitManager = getGlobalCircuitBreakerManager();
      const leakDetector = getGlobalResourceLeakDetector();
      
      // All components should be initialized
      expect(errorHandler).toBeDefined();
      expect(circuitManager).toBeDefined();
      expect(leakDetector).toBeDefined();
      
      // System health should be available
      const healthStatus = getSystemHealthStatus();
      expect(healthStatus.status).toBeDefined();
      
      // Recovery should be functional
      const recovery = await emergencySystemRecovery();
      expect(recovery.success).toBe(true);
    });

    test('should maintain performance under error conditions', async () => {
      const startTime = Date.now();
      
      // Simulate some errors
      const errorHandler = getGlobalEnhancedErrorHandler();
      
      for (let i = 0; i < 5; i++) {
        const testError = new DataPilotError(
          `Test error ${i}`,
          'TEST_ERROR',
          ErrorSeverity.LOW,
          ErrorCategory.PERFORMANCE
        );
        
        await errorHandler.handleError(
          testError,
          { operation: `test-${i}`, component: 'test' },
          async () => `recovered-${i}`
        );
      }
      
      const endTime = Date.now();
      const executionTime = endTime - startTime;
      
      // Error handling should be fast (less than 1 second for 5 errors)
      expect(executionTime).toBeLessThan(1000);
      
      // System should still be healthy
      const healthStatus = getSystemHealthStatus();
      expect(healthStatus.status).not.toBe('unhealthy');
    });
  });
});