/**
 * Test utilities for consistent async cleanup
 */

/**
 * Cleanup function for tests that use analyzers
 */
export async function cleanupAnalyzers(): Promise<void> {
  // Stop memory monitoring
  try {
    const { globalMemoryManager, globalResourceManager } = await import('../src/utils/memory-manager');
    globalMemoryManager.stopMonitoring();
    globalMemoryManager.runCleanup();
    globalResourceManager.cleanupAll();
  } catch (error) {
    // Memory manager may not exist
  }
  
  // Shutdown performance optimizers
  try {
    const { shutdownGlobalMemoryOptimizer } = await import('../src/performance/memory-optimizer');
    shutdownGlobalMemoryOptimizer();
  } catch (error) {
    // May not exist
  }
  
  try {
    const { shutdownGlobalAdaptiveStreamer } = await import('../src/performance/adaptive-streamer');
    shutdownGlobalAdaptiveStreamer();
  } catch (error) {
    // May not exist
  }
}

/**
 * Cleanup function for tests that use streaming analyzers
 */
export async function cleanupStreamingAnalyzer(analyzer: any): Promise<void> {
  if (analyzer) {
    if (typeof analyzer.cleanup === 'function') {
      await analyzer.cleanup();
    }
    if (typeof analyzer.stopMonitoring === 'function') {
      analyzer.stopMonitoring();
    }
    if (typeof analyzer.dispose === 'function') {
      analyzer.dispose();
    }
  }
}

/**
 * Cleanup function for performance-related tests
 */
export async function cleanupPerformanceComponents(): Promise<void> {
  try {
    const { shutdownPerformanceOptimizationsEnhanced } = await import('../src/performance');
    await shutdownPerformanceOptimizationsEnhanced();
  } catch (error) {
    // May not exist
  }
  
  try {
    const { shutdownAllMonitoring } = await import('../src/performance/monitoring');
    await shutdownAllMonitoring();
  } catch (error) {
    // May not exist
  }
}

/**
 * Complete test cleanup - runs all cleanup functions
 */
export async function completeTestCleanup(): Promise<void> {
  await cleanupAnalyzers();
  await cleanupPerformanceComponents();
  
  // Force garbage collection if available
  if (global.gc) {
    global.gc();
  }
  
  // Give time for cleanup to complete
  await new Promise(resolve => setTimeout(resolve, 100));
}

/**
 * Wrapper for analyzer tests to ensure cleanup
 */
export function withAnalyzerCleanup<T extends (...args: any[]) => Promise<any>>(testFn: T): T {
  return (async (...args: any[]) => {
    try {
      return await testFn(...args);
    } finally {
      await cleanupAnalyzers();
    }
  }) as T;
}

/**
 * Clear all active timers (for tests that create timers)
 */
export function clearAllTimers(): void {
  // Clear all known timer IDs
  let id = setTimeout(() => {}, 0);
  for (let i = 1; i <= id; i++) {
    clearTimeout(i);
    clearInterval(i);
  }
}