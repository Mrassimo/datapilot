/**
 * Additional functions for enhanced performance module
 * These will be integrated into the main index.ts
 */

import { 
  getGlobalEnhancedErrorHandler, 
  shutdownGlobalEnhancedErrorHandler 
} from '../utils/enhanced-error-handler';
import { 
  getGlobalCircuitBreakerManager, 
  shutdownGlobalCircuitBreakerManager 
} from './circuit-breaker';
import { 
  getGlobalResourceLeakDetector, 
  shutdownGlobalResourceLeakDetector 
} from './resource-leak-detector';
import { 
  getGlobalMemoryOptimizer,
  getGlobalParallelAnalyzer,
  getGlobalAdaptiveStreamer,
  getGlobalIntelligentChunker,
  getGlobalResourcePoolManager
} from './index';

/**
 * Initialize error reduction components
 */
function initializeErrorReduction(level: 'basic' | 'standard' | 'comprehensive'): void {
  // Always initialize enhanced error handler
  getGlobalEnhancedErrorHandler({
    enableRecovery: true,
    maxRetries: level === 'basic' ? 2 : level === 'standard' ? 3 : 5,
    trackMetrics: true,
    enableCircuitBreaker: level !== 'basic',
    enableResourceTracking: level === 'comprehensive'
  });

  // Initialize circuit breaker for standard and comprehensive levels
  if (level !== 'basic') {
    getGlobalCircuitBreakerManager();
  }

  // Initialize resource leak detection for comprehensive level
  if (level === 'comprehensive') {
    getGlobalResourceLeakDetector({
      trackingEnabled: true,
      maxAge: 300000, // 5 minutes
      checkInterval: 30000, // 30 seconds
      enableStackTrace: true
    });
  }
}

/**
 * Enhanced shutdown with proper error handling
 */
async function shutdownPerformanceOptimizationsEnhanced(): Promise<void> {
  return Promise.all([
    // Shutdown error reduction components first
    shutdownGlobalEnhancedErrorHandler(),
    shutdownGlobalCircuitBreakerManager(),
    shutdownGlobalResourceLeakDetector(),
    
    // Then shutdown performance components
    // Note: These would need to be wrapped with proper error handling
  ]).then(() => {
    console.log('All performance optimizations shutdown successfully');
  }).catch(error => {
    console.error('Error during performance optimization shutdown:', error);
    throw error;
  });
}

/**
 * Get overall system health status
 */
export function getSystemHealthStatus(): {
  status: 'healthy' | 'degraded' | 'unhealthy';
  score: number;
  issues: string[];
  recommendations: string[];
} {
  const issues: string[] = [];
  const recommendations: string[] = [];
  let totalScore = 100;

  try {
    // Check error handler health
    const errorHealth = getGlobalEnhancedErrorHandler().getHealthStatus();
    if (errorHealth.status === 'unhealthy') {
      totalScore -= 30;
      issues.push('High error rate detected');
      recommendations.push(...errorHealth.recommendations);
    } else if (errorHealth.status === 'degraded') {
      totalScore -= 15;
      issues.push('Elevated error rate');
    }

    // Check circuit breaker health
    const circuitHealth = getGlobalCircuitBreakerManager().getSystemHealth();
    if (circuitHealth.overallHealth < 70) {
      totalScore -= 20;
      issues.push(`${circuitHealth.openBreakers} circuit breakers open`);
      recommendations.push('Investigate failing operations');
    }

    // Check resource leak status
    const resourceStats = getGlobalResourceLeakDetector().getResourceStats();
    if (resourceStats.potentialLeaks > 10) {
      totalScore -= 25;
      issues.push(`${resourceStats.potentialLeaks} potential resource leaks`);
      recommendations.push('Review resource cleanup patterns');
    }

    // Check memory pressure
    const memoryStats = getGlobalMemoryOptimizer().getDetailedStats();
    if (memoryStats.pressure.level > 0.8) {
      totalScore -= 20;
      issues.push('High memory pressure');
      recommendations.push('Consider reducing memory usage or increasing limits');
    }

  } catch (error) {
    totalScore -= 50;
    issues.push('Error collecting system health metrics');
    recommendations.push('Check system component initialization');
  }

  let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
  if (totalScore < 50) {
    status = 'unhealthy';
  } else if (totalScore < 80) {
    status = 'degraded';
  }

  return {
    status,
    score: Math.max(0, totalScore),
    issues,
    recommendations
  };
}

/**
 * Emergency system recovery function
 */
export async function emergencySystemRecovery(): Promise<{
  success: boolean;
  actions: string[];
  errors: string[];
}> {
  const actions: string[] = [];
  const errors: string[] = [];

  try {
    // Force all circuit breakers to closed state
    const circuitBreaker = getGlobalCircuitBreakerManager();
    circuitBreaker.forceAllClosed();
    actions.push('Reset all circuit breakers to closed state');

    // Force garbage collection
    if (global.gc) {
      global.gc();
      actions.push('Forced garbage collection');
    }

    // Clean up resource leaks
    const leakDetector = getGlobalResourceLeakDetector();
    const cleanedCount = leakDetector.forceCleanupAll();
    actions.push(`Cleaned up ${cleanedCount} tracked resources`);

    // Reset error metrics
    const errorHandler = getGlobalEnhancedErrorHandler();
    errorHandler.resetMetrics();
    actions.push('Reset error handler metrics');

    // Clear memory optimizer buffers
    const memoryOptimizer = getGlobalMemoryOptimizer();
    memoryOptimizer.forceGarbageCollection();
    actions.push('Cleared memory optimizer buffers');

    return { success: true, actions, errors };

  } catch (error) {
    errors.push(`Recovery action failed: ${(error as Error).message}`);
    return { success: false, actions, errors };
  }
}