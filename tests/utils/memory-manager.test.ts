/**
 * Memory Manager Infrastructure Tests
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { globalMemoryManager, globalResourceManager } from '../../src/utils/memory-manager';

describe('Memory Management Infrastructure', () => {
  beforeEach(() => {
    // Reset memory manager state - no clearCallbacks method available
    // globalMemoryManager starts fresh for each test
  });

  afterEach(() => {
    // Clean up after tests
    globalResourceManager.cleanupAll();
  });

  describe('Memory Manager', () => {
    test('should track memory usage', () => {
      const stats = globalMemoryManager.getMemoryStats();
      
      expect(stats).toBeDefined();
      expect(stats.current).toBeDefined();
      expect(stats.history).toBeDefined();
      expect(Array.isArray(stats.history)).toBe(true);
    });

    test('should register cleanup callbacks', () => {
      let callbackExecuted = false;
      const callback = () => { callbackExecuted = true; };
      
      // registerCleanupCallback only takes one parameter
      globalMemoryManager.registerCleanupCallback(callback);
      
      globalMemoryManager.runCleanup();
      
      expect(callbackExecuted).toBe(true);
    });

    test('should start and stop monitoring', () => {
      expect(() => {
        globalMemoryManager.startMonitoring();
        globalMemoryManager.stopMonitoring();
      }).not.toThrow();
    });

    test('should provide memory statistics', () => {
      const stats = globalMemoryManager.getMemoryStats();
      
      expect(stats).toBeDefined();
      expect(typeof stats).toBe('object');
      expect(stats.current).toBeDefined();
      expect(Array.isArray(stats.history)).toBe(true);
    });

    test('should check memory usage', () => {
      const memoryStats = globalMemoryManager.checkMemoryUsage();
      
      expect(memoryStats).toBeDefined();
      expect(memoryStats.heapUsed).toBeGreaterThan(0);
      expect(memoryStats.heapTotal).toBeGreaterThan(0);
      expect(memoryStats.rss).toBeGreaterThan(0);
    });
  });

  describe('Resource Manager', () => {
    test('should register and cleanup resources', () => {
      let cleanupExecuted = false;
      const cleanup = () => { cleanupExecuted = true; };
      
      globalResourceManager.register('test-resource', cleanup);
      
      const cleaned = globalResourceManager.cleanup('test-resource');
      
      expect(cleaned).toBe(true);
      expect(cleanupExecuted).toBe(true);
    });

    test('should cleanup all resources', () => {
      let cleanup1Executed = false;
      let cleanup2Executed = false;
      
      globalResourceManager.register('resource1', () => { cleanup1Executed = true; });
      globalResourceManager.register('resource2', () => { cleanup2Executed = true; });
      
      const cleanedCount = globalResourceManager.cleanupAll();
      
      expect(cleanedCount).toBe(2);
      expect(cleanup1Executed).toBe(true);
      expect(cleanup2Executed).toBe(true);
    });

    test('should get resource count', () => {
      globalResourceManager.register('test1', () => {});
      globalResourceManager.register('test2', () => {}, 'database');
      
      const totalCount = globalResourceManager.getResourceCount();
      const dbCount = globalResourceManager.getResourceCount('database');
      
      expect(totalCount).toBeGreaterThanOrEqual(2);
      expect(dbCount).toBe(1);
    });

    test('should list resources', () => {
      globalResourceManager.register('test-resource', () => {}, 'test');
      
      const resources = globalResourceManager.listResources();
      
      expect(Array.isArray(resources)).toBe(true);
      expect(resources.some(r => r.id === 'test-resource')).toBe(true);
    });

    test('should cleanup by type', () => {
      globalResourceManager.register('db1', () => {}, 'database');
      globalResourceManager.register('db2', () => {}, 'database');
      globalResourceManager.register('file1', () => {}, 'file');
      
      const cleanedCount = globalResourceManager.cleanupByType('database');
      
      expect(cleanedCount).toBe(2);
      expect(globalResourceManager.getResourceCount('database')).toBe(0);
      expect(globalResourceManager.getResourceCount('file')).toBe(1);
    });
  });

  describe('System Integration', () => {
    test('should provide system-wide cleanup', () => {
      // This would test the overall cleanup coordination
      expect(() => {
        globalMemoryManager.runCleanup();
        globalResourceManager.cleanupAll();
      }).not.toThrow();
    });
  });
});