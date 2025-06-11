/**
 * Performance Optimization Module
 * Exports all performance enhancement components
 */

// Worker pool and parallel processing
export {
  WorkerPool,
  getGlobalWorkerPool,
  shutdownGlobalWorkerPool,
  type WorkerTask,
  type WorkerPoolOptions,
  type WorkerStats
} from './worker-pool';

export {
  ParallelAnalyzer,
  getGlobalParallelAnalyzer,
  shutdownGlobalParallelAnalyzer,
  type AnalysisResult,
  type ParallelAnalysisOptions
} from './parallel-analyzer';

// Memory optimization
export {
  MemoryOptimizer,
  getGlobalMemoryOptimizer,
  shutdownGlobalMemoryOptimizer,
  withMemoryOptimization,
  type MemoryOptimizationOptions,
  type MemoryStats,
  type ChunkSizeRecommendation
} from './memory-optimizer';

// Adaptive streaming
export {
  AdaptiveStreamer,
  getGlobalAdaptiveStreamer,
  shutdownGlobalAdaptiveStreamer,
  type AdaptiveStreamingOptions,
  type StreamingMetrics
} from './adaptive-streamer';

// Enhanced streaming with parallel processing
export {
  ParallelStreamingAnalyzer,
  createParallelStreamingAnalyzer,
  type ParallelStreamingOptions,
  type ParallelAnalysisResult
} from '../analyzers/streaming/parallel-streaming-analyzer';

// Intelligent chunking
export {
  IntelligentChunker,
  getGlobalIntelligentChunker,
  shutdownGlobalIntelligentChunker,
  type ChunkingOptions,
  type DataCharacteristics,
  type ChunkDecision
} from './intelligent-chunker';

// Resource pooling and GC optimization
export {
  ResourcePool,
  ResourcePoolManager,
  GcOptimizer,
  getGlobalResourcePoolManager,
  shutdownGlobalResourcePoolManager,
  createBufferPool,
  createObjectPool,
  type ResourcePoolOptions,
  type ResourceTypeConfig,
  type PoolStats,
  type GcStats
} from './resource-pool';

// Error reduction and reliability components
export {
  WorkerHealthMonitor,
  type WorkerHealthStatus
} from './worker-health-monitor';

export {
  CircuitBreaker,
  CircuitBreakerManager,
  getGlobalCircuitBreakerManager,
  shutdownGlobalCircuitBreakerManager,
  CircuitState,
  type CircuitBreakerOptions,
  type CircuitBreakerMetrics
} from './circuit-breaker';

export {
  ResourceLeakDetector,
  getGlobalResourceLeakDetector,
  shutdownGlobalResourceLeakDetector,
  trackResource,
  type LeakReport
} from './resource-leak-detector';

// Memory optimizer already exported above

// Enhanced error handling
export {
  EnhancedErrorHandler,
  getGlobalEnhancedErrorHandler,
  shutdownGlobalEnhancedErrorHandler,
  withErrorHandling,
  type ErrorContext,
  type RecoveryStrategy,
  type ErrorMetrics
} from '../utils/enhanced-error-handler';

// Input validation
export {
  InputValidator,
  type ValidationResult,
  type ValidationError
} from '../utils/input-validator';

// Format-specific optimizers
export {
  ParquetOptimizer,
  ExcelOptimizer,
  JsonOptimizer,
  getGlobalParquetOptimizer,
  getGlobalExcelOptimizer,
  getGlobalJsonOptimizer,
  initializeFormatOptimizers,
  shutdownAllFormatOptimizers,
  getAllFormatMetrics,
  type ParquetOptimizationOptions,
  type ExcelOptimizationOptions,
  type JsonOptimizationOptions
} from './format-optimizers';

// Performance monitoring and adaptive configuration
export {
  PerformanceDashboard,
  AdaptiveConfigurationManager,
  PerformanceBenchmarkSuite,
  getGlobalPerformanceDashboard,
  getGlobalAdaptiveConfigManager,
  getGlobalBenchmarkSuite,
  runQuickBenchmark,
  initializeMonitoring,
  shutdownAllMonitoring,
  getMonitoringStatus,
  type DashboardConfig,
  type AdaptiveConfigOptions,
  type BenchmarkConfig,
  type BenchmarkReport
} from './monitoring';

// Internal imports for functions used within this module
import { getGlobalMemoryOptimizer } from './memory-optimizer';
import { getGlobalEnhancedErrorHandler, shutdownGlobalEnhancedErrorHandler } from '../utils/enhanced-error-handler';
import { getGlobalResourceLeakDetector, shutdownGlobalResourceLeakDetector } from './resource-leak-detector';
import { getGlobalCircuitBreakerManager, shutdownGlobalCircuitBreakerManager } from './circuit-breaker';

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
 * Initialize all performance optimizations with default settings
 */
export function initializePerformanceOptimizations(options: {
  enableParallelProcessing?: boolean;
  enableMemoryOptimization?: boolean;
  enableAdaptiveStreaming?: boolean;
  enableIntelligentChunking?: boolean;
  enableResourcePooling?: boolean;
  enableErrorReduction?: boolean;
  maxWorkers?: number;
  memoryLimitMB?: number;
  errorReductionLevel?: 'basic' | 'standard' | 'comprehensive';
} = {}): void {
  const {
    enableParallelProcessing = true,
    enableMemoryOptimization = true,
    enableAdaptiveStreaming = true,
    enableIntelligentChunking = true,
    enableResourcePooling = true,
    enableErrorReduction = true,
    maxWorkers = Math.max(2, require('os').cpus().length - 1),
    memoryLimitMB = 512,
    errorReductionLevel = 'standard'
  } = options;

  // Initialize error reduction components first
  if (enableErrorReduction) {
    initializeErrorReduction(errorReductionLevel);
  }

  if (enableMemoryOptimization) {
    getGlobalMemoryOptimizer({
      maxMemoryMB: memoryLimitMB,
      enableMemoryPooling: enableResourcePooling,
      adaptiveChunkSizing: enableIntelligentChunking
    });
  }

  if (enableParallelProcessing) {
    getGlobalParallelAnalyzer({
      maxWorkers,
      memoryLimitMB: memoryLimitMB / maxWorkers,
      enableMemoryMonitoring: enableMemoryOptimization
    });
  }

  if (enableAdaptiveStreaming) {
    getGlobalAdaptiveStreamer({
      maxConcurrentChunks: Math.min(3, maxWorkers),
      memoryPressureThreshold: 0.8,
      enableProgressiveLoading: true
    });
  }

  if (enableIntelligentChunking) {
    getGlobalIntelligentChunker({
      enableLearning: true,
      adaptationSensitivity: 0.2
    });
  }

  if (enableResourcePooling) {
    getGlobalResourcePoolManager({
      enableGcOptimization: true,
      maxPoolSize: 50,
      resourceTypes: [
        {
          name: 'buffer',
          factory: () => Buffer.alloc(64 * 1024),
          cleanup: (buffer: Buffer) => buffer.fill(0),
          validator: (buffer: Buffer) => Buffer.isBuffer(buffer),
          maxPoolSize: 100
        },
        {
          name: 'array',
          factory: () => new Array(1000),
          cleanup: (array: any[]) => array.length = 0,
          validator: (array: any[]) => Array.isArray(array),
          maxPoolSize: 50
        }
      ]
    });
  }
}

/**
 * Shutdown all performance optimizations
 */
export function shutdownPerformanceOptimizations(): void {
  shutdownGlobalParallelAnalyzer();
  shutdownGlobalMemoryOptimizer();
  shutdownGlobalAdaptiveStreamer();
  shutdownGlobalIntelligentChunker();
  shutdownGlobalResourcePoolManager();
  shutdownGlobalWorkerPool();
}

/**
 * Enhanced shutdown with proper error handling
 */
export async function shutdownPerformanceOptimizationsEnhanced(): Promise<void> {
  return Promise.all([
    // Shutdown error reduction components first
    shutdownGlobalEnhancedErrorHandler(),
    shutdownGlobalCircuitBreakerManager(),
    shutdownGlobalResourceLeakDetector(),
    
    // Then shutdown performance components
    shutdownGlobalParallelAnalyzer(),
    shutdownGlobalMemoryOptimizer(),
    shutdownGlobalAdaptiveStreamer(),
    shutdownGlobalIntelligentChunker(),
    shutdownGlobalResourcePoolManager(),
    shutdownGlobalWorkerPool()
  ]).then(() => {
    console.log('All performance optimizations shutdown successfully');
  }).catch(error => {
    console.error('Error during performance optimization shutdown:', error);
    throw error;
  });
}

/**
 * Get comprehensive performance statistics
 */
export function getPerformanceStats(): {
  parallel: any;
  memory: any;
  streaming: any;
  chunking: any;
  resources: any;
} {
  return {
    parallel: getGlobalParallelAnalyzer().getPerformanceStats(),
    memory: getGlobalMemoryOptimizer().getDetailedStats(),
    streaming: getGlobalAdaptiveStreamer().getOverallStats(),
    chunking: getGlobalIntelligentChunker().getLearningStats(),
    resources: getGlobalResourcePoolManager().getAllStats()
  };
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