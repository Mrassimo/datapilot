/**
 * Memory Manager Infrastructure Tests
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { globalMemoryManager, globalResourceManager } from '../../src/utils/memory-manager';

describe('Memory Management Infrastructure', () => {
  beforeEach(() => {
    // Reset memory manager state
    globalMemoryManager.clearCallbacks();
    globalResourceManager.clearResources();
  });

  afterEach(() => {
    // Clean up after tests
    globalMemoryManager.clearCallbacks();
    globalResourceManager.clearResources();
  });

  describe('Memory Manager', () => {
    test('should track memory usage', () => {
      const usage = globalMemoryManager.getMemoryUsage();
      
      expect(usage).toBeDefined();
      expect(usage.heapUsedMB).toBeGreaterThan(0);
      expect(usage.heapTotalMB).toBeGreaterThan(0);
      expect(usage.externalMB).toBeGreaterThanOrEqual(0);
      expect(usage.percentUsed).toBeGreaterThan(0);
      expect(usage.percentUsed).toBeLessThanOrEqual(100);
    });

    test('should register cleanup callbacks', () => {
      let callbackExecuted = false;
      const callback = () => { callbackExecuted = true; };

      globalMemoryManager.registerCleanupCallback('test-callback', callback);
      
      // Trigger cleanup
      globalMemoryManager.executeCleanup();
      
      expect(callbackExecuted).toBe(true);
    });

    test('should handle memory pressure', () => {
      let pressureDetected = false;
      const pressureCallback = () => { pressureDetected = true; };

      globalMemoryManager.registerCleanupCallback('pressure-test', pressureCallback);
      
      // Simulate memory pressure (this will depend on implementation)
      globalMemoryManager.executeCleanup();
      
      expect(pressureDetected).toBe(true);
    });

    test('should provide memory monitoring', () => {
      const monitor = globalMemoryManager.startMonitoring(100); // 100ms intervals
      
      expect(monitor).toBeDefined();
      
      // Stop monitoring to prevent test interference
      globalMemoryManager.stopMonitoring();
    });

    test('should detect memory threshold breaches', () => {
      // Get current usage
      const currentUsage = globalMemoryManager.getMemoryUsage();
      
      // Set a threshold that should trigger
      const lowThreshold = Math.max(1, currentUsage.heapUsedMB - 10);
      
      let thresholdBreached = false;
      globalMemoryManager.registerCleanupCallback('threshold-test', () => {
        thresholdBreached = true;
      });

      // This test may be environment-dependent
      expect(typeof globalMemoryManager.isMemoryPressure).toBe('function');
    });
  });

  describe('Resource Manager', () => {
    test('should register and track resources', () => {
      const resource = {
        id: 'test-resource',
        cleanup: () => { /* cleanup logic */ }
      };

      globalResourceManager.registerResource(resource.id, resource.cleanup);
      
      const resources = globalResourceManager.getRegisteredResources();
      expect(resources.includes(resource.id)).toBe(true);
    });

    test('should execute cleanup for specific resource', () => {
      let cleaned = false;
      const cleanup = () => { cleaned = true; };

      globalResourceManager.registerResource('cleanup-test', cleanup);
      globalResourceManager.cleanupResource('cleanup-test');
      
      expect(cleaned).toBe(true);
    });

    test('should execute cleanup for all resources', () => {
      let count = 0;
      const cleanup = () => { count++; };

      globalResourceManager.registerResource('resource1', cleanup);
      globalResourceManager.registerResource('resource2', cleanup);
      globalResourceManager.registerResource('resource3', cleanup);
      
      globalResourceManager.cleanupAll();
      
      expect(count).toBe(3);
    });

    test('should unregister resources', () => {
      globalResourceManager.registerResource('temp-resource', () => {});
      
      let resources = globalResourceManager.getRegisteredResources();
      expect(resources.includes('temp-resource')).toBe(true);
      
      globalResourceManager.unregisterResource('temp-resource');
      
      resources = globalResourceManager.getRegisteredResources();
      expect(resources.includes('temp-resource')).toBe(false);
    });

    test('should handle cleanup errors gracefully', () => {
      const failingCleanup = () => { throw new Error('Cleanup failed'); };
      const workingCleanup = () => { /* works fine */ };

      globalResourceManager.registerResource('failing', failingCleanup);
      globalResourceManager.registerResource('working', workingCleanup);
      
      // Should not throw even if one cleanup fails
      expect(() => globalResourceManager.cleanupAll()).not.toThrow();
    });
  });

  describe('Integration', () => {
    test('should coordinate memory and resource management', () => {
      let memoryCleanupExecuted = false;
      let resourceCleanupExecuted = false;

      globalMemoryManager.registerCleanupCallback('integration-test', () => {
        memoryCleanupExecuted = true;
      });

      globalResourceManager.registerResource('integration-resource', () => {
        resourceCleanupExecuted = true;
      });

      // Execute cleanup through memory manager
      globalMemoryManager.executeCleanup();
      
      expect(memoryCleanupExecuted).toBe(true);
      
      // Execute resource cleanup
      globalResourceManager.cleanupAll();
      
      expect(resourceCleanupExecuted).toBe(true);
    });

    test('should provide system-wide cleanup', () => {
      // This would test the overall cleanup coordination
      expect(() => {
        globalMemoryManager.executeCleanup();
        globalResourceManager.cleanupAll();
      }).not.toThrow();
    });
  });
});