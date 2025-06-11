/**
 * Memory Optimizer
 * Advanced memory management for streaming data analysis
 */

import { EventEmitter } from 'events';
import { performance } from 'perf_hooks';
import { logger } from '../utils/logger';

export interface MemoryOptimizationOptions {
  maxMemoryMB?: number;
  gcThresholdMB?: number;
  memoryCheckInterval?: number;
  enableMemoryPooling?: boolean;
  bufferPoolSize?: number;
  adaptiveChunkSizing?: boolean;
  memoryPressureThreshold?: number;
}

export interface MemoryStats {
  heapUsed: number;
  heapTotal: number;
  external: number;
  rss: number;
  arrayBuffers: number;
}

export interface ChunkSizeRecommendation {
  recommendedSize: number;
  reason: string;
  memoryPressure: number;
  adaptationFactor: number;
}

/**
 * Buffer pool for memory reuse
 */
class BufferPool {
  private pools: Map<number, Buffer[]> = new Map();
  private maxPoolSize: number;
  private totalBuffersCreated = 0;
  private totalBuffersReused = 0;

  constructor(maxPoolSize: number = 50) {
    this.maxPoolSize = maxPoolSize;
  }

  /**
   * Get buffer from pool or create new one
   */
  getBuffer(size: number): Buffer {
    const roundedSize = this.roundToStandardSize(size);
    const pool = this.pools.get(roundedSize);

    if (pool && pool.length > 0) {
      this.totalBuffersReused++;
      return pool.pop();
    }

    this.totalBuffersCreated++;
    return Buffer.alloc(roundedSize);
  }

  /**
   * Return buffer to pool
   */
  returnBuffer(buffer: Buffer): void {
    const size = buffer.length;
    const roundedSize = this.roundToStandardSize(size);

    if (!this.pools.has(roundedSize)) {
      this.pools.set(roundedSize, []);
    }

    const pool = this.pools.get(roundedSize);
    if (pool.length < this.maxPoolSize) {
      // Clear buffer before returning to pool
      buffer.fill(0);
      pool.push(buffer);
    }
  }

  /**
   * Round buffer size to standard sizes for better pooling
   */
  private roundToStandardSize(size: number): number {
    const standardSizes = [
      1024, // 1KB
      4096, // 4KB
      16384, // 16KB
      65536, // 64KB
      262144, // 256KB
      1048576, // 1MB
      4194304, // 4MB
      16777216, // 16MB
      67108864, // 64MB
    ];

    return standardSizes.find((s) => s >= size) || size;
  }

  /**
   * Clear all pools and release memory
   */
  clear(): void {
    this.pools.clear();
  }

  /**
   * Get pool statistics
   */
  getStats() {
    const totalBuffersInPool = Array.from(this.pools.values()).reduce(
      (sum, pool) => sum + pool.length,
      0,
    );

    return {
      totalBuffersCreated: this.totalBuffersCreated,
      totalBuffersReused: this.totalBuffersReused,
      reuseRate:
        this.totalBuffersCreated > 0
          ? ((this.totalBuffersReused / this.totalBuffersCreated) * 100).toFixed(2) + '%'
          : '0%',
      buffersInPool: totalBuffersInPool,
      poolSizes: Object.fromEntries(
        Array.from(this.pools.entries()).map(([size, pool]) => [size, pool.length]),
      ),
    };
  }
}

/**
 * Advanced memory optimizer with adaptive streaming
 */
export class MemoryOptimizer extends EventEmitter {
  private options: Required<MemoryOptimizationOptions>;
  private bufferPool: BufferPool;
  private memoryCheckTimer?: NodeJS.Timeout;
  private memoryHistory: MemoryStats[] = [];
  private isMonitoring = false;
  private lastGcTime = 0;
  private baselineMemory: MemoryStats;

  constructor(options: MemoryOptimizationOptions = {}) {
    super();

    this.options = {
      maxMemoryMB: options.maxMemoryMB || 512,
      gcThresholdMB: options.gcThresholdMB || 256,
      memoryCheckInterval: options.memoryCheckInterval || 1000,
      enableMemoryPooling: options.enableMemoryPooling ?? true,
      bufferPoolSize: options.bufferPoolSize || 100,
      adaptiveChunkSizing: options.adaptiveChunkSizing ?? true,
      memoryPressureThreshold: options.memoryPressureThreshold || 0.8,
    };

    this.bufferPool = new BufferPool(this.options.bufferPoolSize);
    this.baselineMemory = this.getCurrentMemoryStats();

    logger.info(`Memory optimizer initialized with ${this.options.maxMemoryMB}MB limit`);
  }

  /**
   * Start memory monitoring
   */
  startMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.memoryCheckTimer = setInterval(() => {
      this.checkMemoryUsage();
    }, this.options.memoryCheckInterval);

    logger.info('Memory monitoring started');
  }

  /**
   * Stop memory monitoring
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;
    if (this.memoryCheckTimer) {
      clearInterval(this.memoryCheckTimer);
      this.memoryCheckTimer = undefined;
    }

    logger.info('Memory monitoring stopped');
  }

  /**
   * Get current memory statistics
   */
  getCurrentMemoryStats(): MemoryStats {
    const usage = process.memoryUsage();
    return {
      heapUsed: usage.heapUsed / 1024 / 1024, // MB
      heapTotal: usage.heapTotal / 1024 / 1024, // MB
      external: usage.external / 1024 / 1024, // MB
      rss: usage.rss / 1024 / 1024, // MB
      arrayBuffers: usage.arrayBuffers / 1024 / 1024, // MB
    };
  }

  /**
   * Calculate memory pressure (0-1 scale)
   */
  getMemoryPressure(): number {
    const current = this.getCurrentMemoryStats();
    const pressure = current.heapUsed / this.options.maxMemoryMB;
    return Math.min(1, Math.max(0, pressure));
  }

  /**
   * Get adaptive chunk size recommendation
   */
  getAdaptiveChunkSize(baseChunkSize: number, dataComplexity: number = 1): ChunkSizeRecommendation {
    if (!this.options.adaptiveChunkSizing) {
      return {
        recommendedSize: baseChunkSize,
        reason: 'Adaptive sizing disabled',
        memoryPressure: this.getMemoryPressure(),
        adaptationFactor: 1,
      };
    }

    const memoryPressure = this.getMemoryPressure();
    const memoryTrend = this.calculateMemoryTrend();

    // Base adaptation factor on memory pressure and trend
    let adaptationFactor = 1;
    let reason = 'Normal memory conditions';

    if (memoryPressure > this.options.memoryPressureThreshold) {
      // High memory pressure - reduce chunk size
      adaptationFactor = Math.max(
        0.25,
        1 - (memoryPressure - this.options.memoryPressureThreshold) * 2,
      );
      reason = `High memory pressure (${(memoryPressure * 100).toFixed(1)}%)`;
    } else if (memoryTrend > 0.1) {
      // Memory growing rapidly - be conservative
      adaptationFactor = Math.max(0.5, 1 - memoryTrend);
      reason = `Memory trending upward (${(memoryTrend * 100).toFixed(1)}%/sec)`;
    } else if (memoryPressure < 0.3 && memoryTrend < 0.05) {
      // Low memory pressure and stable - can increase chunk size
      adaptationFactor = Math.min(2, 1 + (0.3 - memoryPressure));
      reason = `Low memory pressure, increasing efficiency`;
    }

    // Apply data complexity factor
    adaptationFactor /= Math.max(1, dataComplexity);

    const recommendedSize = Math.max(
      1024, // Minimum 1KB
      Math.min(
        64 * 1024 * 1024, // Maximum 64MB
        Math.round(baseChunkSize * adaptationFactor),
      ),
    );

    return {
      recommendedSize,
      reason,
      memoryPressure,
      adaptationFactor,
    };
  }

  /**
   * Get or create buffer with memory pooling
   */
  getBuffer(size: number): Buffer {
    if (this.options.enableMemoryPooling) {
      return this.bufferPool.getBuffer(size);
    }
    return Buffer.alloc(size);
  }

  /**
   * Return buffer to pool
   */
  returnBuffer(buffer: Buffer): void {
    if (this.options.enableMemoryPooling) {
      this.bufferPool.returnBuffer(buffer);
    }
  }

  /**
   * Force garbage collection if possible and beneficial
   */
  forceGarbageCollection(): boolean {
    const now = Date.now();
    const timeSinceLastGc = now - this.lastGcTime;

    // Only run GC if enough time has passed and memory pressure is high
    if (timeSinceLastGc < 5000 || this.getMemoryPressure() < 0.6) {
      return false;
    }

    try {
      if (global.gc) {
        const beforeGc = this.getCurrentMemoryStats();
        global.gc();
        const afterGc = this.getCurrentMemoryStats();

        this.lastGcTime = now;

        const memoryFreed = beforeGc.heapUsed - afterGc.heapUsed;
        logger.info(`Garbage collection freed ${memoryFreed.toFixed(2)}MB`);

        this.emit('gc-completed', { memoryFreed, beforeGc, afterGc });
        return true;
      }
    } catch (error) {
      logger.warn(`Garbage collection failed: ${error.message}`);
    }

    return false;
  }

  /**
   * Check memory usage and take action if needed
   */
  private checkMemoryUsage(): void {
    const current = this.getCurrentMemoryStats();
    this.memoryHistory.push(current);

    // Keep only last 60 readings (1 minute at 1 second intervals)
    if (this.memoryHistory.length > 60) {
      this.memoryHistory.shift();
    }

    const memoryPressure = this.getMemoryPressure();

    // Emit memory pressure events
    if (memoryPressure > 0.9) {
      this.emit('memory-critical', { pressure: memoryPressure, stats: current });
    } else if (memoryPressure > this.options.memoryPressureThreshold) {
      this.emit('memory-pressure', { pressure: memoryPressure, stats: current });
    }

    // Auto-trigger GC if memory usage is high
    if (current.heapUsed > this.options.gcThresholdMB) {
      this.forceGarbageCollection();
    }

    // Clear buffer pools if memory pressure is very high
    if (memoryPressure > 0.95) {
      this.bufferPool.clear();
      logger.warn('Cleared buffer pools due to extreme memory pressure');
    }
  }

  /**
   * Calculate memory usage trend (MB per second)
   */
  private calculateMemoryTrend(): number {
    if (this.memoryHistory.length < 10) return 0;

    const recent = this.memoryHistory.slice(-10);
    const timeSpan = (recent.length - 1) * (this.options.memoryCheckInterval / 1000);
    const memoryChange = recent[recent.length - 1].heapUsed - recent[0].heapUsed;

    return memoryChange / timeSpan; // MB per second
  }

  /**
   * Get comprehensive memory statistics
   */
  getDetailedStats() {
    const current = this.getCurrentMemoryStats();
    const memoryPressure = this.getMemoryPressure();
    const memoryTrend = this.calculateMemoryTrend();

    return {
      current,
      baseline: this.baselineMemory,
      memoryGrowth: {
        heapUsed: current.heapUsed - this.baselineMemory.heapUsed,
        heapTotal: current.heapTotal - this.baselineMemory.heapTotal,
        rss: current.rss - this.baselineMemory.rss,
      },
      pressure: {
        level: memoryPressure,
        threshold: this.options.memoryPressureThreshold,
        status:
          memoryPressure > 0.9
            ? 'critical'
            : memoryPressure > this.options.memoryPressureThreshold
              ? 'high'
              : 'normal',
      },
      trend: {
        mbPerSecond: memoryTrend,
        direction: memoryTrend > 0.1 ? 'increasing' : memoryTrend < -0.1 ? 'decreasing' : 'stable',
      },
      bufferPool: this.options.enableMemoryPooling ? this.bufferPool.getStats() : null,
      monitoring: {
        isActive: this.isMonitoring,
        interval: this.options.memoryCheckInterval,
        historySize: this.memoryHistory.length,
      },
    };
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    this.stopMonitoring();
    this.bufferPool.clear();
    this.memoryHistory = [];
    this.emit('cleanup-completed');
    logger.info('Memory optimizer cleanup completed');
  }
}

/**
 * Global memory optimizer instance
 */
let globalMemoryOptimizer: MemoryOptimizer | null = null;

/**
 * Get or create global memory optimizer
 */
export function getGlobalMemoryOptimizer(options?: MemoryOptimizationOptions): MemoryOptimizer {
  if (!globalMemoryOptimizer) {
    globalMemoryOptimizer = new MemoryOptimizer(options);
    globalMemoryOptimizer.startMonitoring();
  }
  return globalMemoryOptimizer;
}

/**
 * Shutdown global memory optimizer
 */
export function shutdownGlobalMemoryOptimizer(): void {
  if (globalMemoryOptimizer) {
    globalMemoryOptimizer.cleanup();
    globalMemoryOptimizer = null;
  }
}

/**
 * Memory optimization decorator for async functions
 */
export function withMemoryOptimization<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options?: {
    enableGc?: boolean;
    bufferPooling?: boolean;
    memoryThreshold?: number;
  },
): T {
  return (async (...args: any[]) => {
    const optimizer = getGlobalMemoryOptimizer();
    const initialPressure = optimizer.getMemoryPressure();

    try {
      const result = await fn(...args);

      // Optionally trigger GC after operation
      if (options?.enableGc && optimizer.getMemoryPressure() > (options.memoryThreshold || 0.7)) {
        optimizer.forceGarbageCollection();
      }

      return result;
    } catch (error) {
      // Force cleanup on error
      if (optimizer.getMemoryPressure() > initialPressure + 0.2) {
        optimizer.forceGarbageCollection();
      }
      throw error;
    }
  }) as T;
}
