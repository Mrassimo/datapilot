/**
 * Global test setup for consistent async cleanup
 */

import { beforeEach, afterEach } from '@jest/globals';

// Track global timers and cleanup operations
let globalCleanupTasks: Array<() => Promise<void> | void> = [];

// Register a global cleanup task
export function registerGlobalCleanup(task: () => Promise<void> | void): void {
  globalCleanupTasks.push(task);
}

// Global afterEach to ensure all async operations are cleaned up
afterEach(async () => {
  // Run all registered cleanup tasks
  for (const task of globalCleanupTasks) {
    try {
      await task();
    } catch (error) {
      // Ignore cleanup errors in tests
      console.warn('Global cleanup task failed:', error);
    }
  }
  
  // Clear the cleanup tasks for next test
  globalCleanupTasks = [];
  
  // Dynamic imports to avoid circular dependencies
  try {
    const { globalMemoryManager, globalResourceManager } = await import('../src/utils/memory-manager');
    
    // Stop any active monitoring
    if (globalMemoryManager && typeof globalMemoryManager.stopMonitoring === 'function') {
      globalMemoryManager.stopMonitoring();
    }
    
    // Run cleanup callbacks
    if (globalMemoryManager && typeof globalMemoryManager.runCleanup === 'function') {
      globalMemoryManager.runCleanup();
    }
    
    // Cleanup all registered resources
    if (globalResourceManager && typeof globalResourceManager.cleanupAll === 'function') {
      globalResourceManager.cleanupAll();
    }
  } catch (error) {
    // Memory manager may not exist in all tests
  }
  
  // Try to cleanup performance optimizers
  try {
    const { shutdownGlobalMemoryOptimizer } = await import('../src/performance/memory-optimizer');
    shutdownGlobalMemoryOptimizer();
  } catch (error) {
    // May not exist or already shutdown
  }
  
  try {
    const { shutdownGlobalAdaptiveStreamer } = await import('../src/performance/adaptive-streamer');
    shutdownGlobalAdaptiveStreamer();
  } catch (error) {
    // May not exist or already shutdown
  }
  
  // Small delay to allow async operations to complete
  await new Promise(resolve => setTimeout(resolve, 50));
});

// Global beforeEach to set up clean state
beforeEach(() => {
  // Clear any residual cleanup tasks
  globalCleanupTasks = [];
});

// Suppress console output during tests to prevent async logging issues
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;

// Override console methods to be safer during tests
console.log = (...args: any[]) => {
  // Only log if we're in a proper test context
  try {
    originalConsoleLog(...args);
  } catch (e) {
    // Ignore logging errors during test cleanup
  }
};

console.warn = (...args: any[]) => {
  // Only warn if we're in a proper test context  
  try {
    originalConsoleWarn(...args);
  } catch (e) {
    // Ignore logging errors during test cleanup
  }
};

// Export utilities for tests to use
export {
  globalCleanupTasks
};