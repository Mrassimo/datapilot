/**
 * Memory management and cleanup utilities for DataPilot
 */

import { EventEmitter } from 'events';
import { DataPilotError, ErrorSeverity } from '../core/types';
import type { LogContext } from './logger';
import { logger } from './logger';

export interface MemoryStats {
  heapUsed: number;
  heapTotal: number;
  external: number;
  rss: number;
  arrayBuffers: number;
}

export interface MemoryThresholds {
  warningMB: number;
  criticalMB: number;
  maxMB: number;
}

export interface MemoryManagerConfig {
  thresholds: MemoryThresholds;
  monitoringInterval: number;
  enableAutomaticCleanup: boolean;
  enableGarbageCollection: boolean;
  logMemoryUsage: boolean;
}

export class MemoryManager extends EventEmitter {
  private config: MemoryManagerConfig;
  private monitoringTimer?: NodeJS.Timeout;
  private cleanupCallbacks: Array<() => void> = [];
  private isMonitoring = false;
  private lastMemoryStats?: MemoryStats;
  private memoryHistory: MemoryStats[] = [];
  private maxHistorySize = 100;
  private isLogging = false; // Guard against recursive logging

  constructor(config: Partial<MemoryManagerConfig> = {}) {
    super();

    this.config = {
      thresholds: {
        warningMB: 256,
        criticalMB: 512,
        maxMB: 1024,
      },
      monitoringInterval: 5000, // 5 seconds
      enableAutomaticCleanup: true,
      enableGarbageCollection: true,
      logMemoryUsage: false,
      ...config,
    };

    // Set up event listeners
    this.on('warning', this.handleMemoryWarning.bind(this));
    this.on('critical', this.handleMemoryCritical.bind(this));
    this.on('max', this.handleMemoryMax.bind(this));
  }

  /**
   * Start memory monitoring
   */
  startMonitoring(context?: LogContext): void {
    if (this.isMonitoring) {
      return;
    }

    this.isMonitoring = true;
    
    // Guard against recursive logging
    if (!this.isLogging) {
      this.isLogging = true;
      logger.debug('Starting memory monitoring', context);
      this.isLogging = false;
    }

    this.monitoringTimer = setInterval(() => {
      try {
        this.checkMemoryUsage(context);
      } catch (error) {
        if (!this.isLogging) {
          this.isLogging = true;
          logger.error('Error during memory monitoring', context, error);
          this.isLogging = false;
        }
      }
    }, this.config.monitoringInterval);

    // Initial check
    this.checkMemoryUsage(context);
  }

  /**
   * Stop memory monitoring
   */
  stopMonitoring(context?: LogContext): void {
    if (!this.isMonitoring) {
      return;
    }

    this.isMonitoring = false;
    logger.debug('Stopping memory monitoring', context);

    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer);
      this.monitoringTimer = undefined;
    }
  }

  /**
   * Check current memory usage and emit events if thresholds are exceeded
   */
  checkMemoryUsage(context?: LogContext): MemoryStats {
    const memoryUsage = process.memoryUsage();
    const stats: MemoryStats = {
      heapUsed: memoryUsage.heapUsed,
      heapTotal: memoryUsage.heapTotal,
      external: memoryUsage.external,
      rss: memoryUsage.rss,
      arrayBuffers: memoryUsage.arrayBuffers || 0,
    };

    // Add to history
    this.memoryHistory.push(stats);
    if (this.memoryHistory.length > this.maxHistorySize) {
      this.memoryHistory = this.memoryHistory.slice(-this.maxHistorySize);
    }

    const heapMB = stats.heapUsed / (1024 * 1024);
    const rssMB = stats.rss / (1024 * 1024);
    const totalMB = Math.max(heapMB, rssMB);

    // Log memory usage if enabled
    if (this.config.logMemoryUsage && !this.isLogging) {
      this.isLogging = true;
      logger.trace(`Memory usage: ${heapMB.toFixed(1)}MB heap, ${rssMB.toFixed(1)}MB RSS`, {
        ...context,
        memoryUsage: stats.heapUsed,
      });
      this.isLogging = false;
    }

    // Check thresholds and emit events
    if (totalMB >= this.config.thresholds.maxMB) {
      this.emit('max', stats, context);
    } else if (totalMB >= this.config.thresholds.criticalMB) {
      this.emit('critical', stats, context);
    } else if (totalMB >= this.config.thresholds.warningMB) {
      this.emit('warning', stats, context);
    }

    this.lastMemoryStats = stats;
    return stats;
  }

  /**
   * Register cleanup callback
   */
  registerCleanupCallback(callback: () => void): void {
    this.cleanupCallbacks.push(callback);
  }

  /**
   * Force garbage collection if available
   */
  forceGarbageCollection(context?: LogContext): void {
    if (!this.config.enableGarbageCollection) {
      return;
    }

    if (global.gc) {
      logger.debug('Forcing garbage collection', context);
      const before = process.memoryUsage().heapUsed;
      global.gc();
      const after = process.memoryUsage().heapUsed;
      const freedMB = (before - after) / (1024 * 1024);

      if (freedMB > 1) {
        logger.debug(`Garbage collection freed ${freedMB.toFixed(1)}MB`, context);
      }
    } else {
      logger.debug('Garbage collection not available (run with --expose-gc)', context);
    }
  }

  /**
   * Run cleanup callbacks
   */
  runCleanup(context?: LogContext): void {
    if (!this.config.enableAutomaticCleanup) {
      return;
    }

    logger.debug(`Running ${this.cleanupCallbacks.length} cleanup callbacks`, context);

    for (const callback of this.cleanupCallbacks) {
      try {
        callback();
      } catch (error) {
        logger.error('Error in cleanup callback', context, error);
      }
    }
  }

  /**
   * Get memory statistics
   */
  getMemoryStats(): {
    current: MemoryStats | undefined;
    peak: MemoryStats | undefined;
    average: MemoryStats | undefined;
    history: MemoryStats[];
  } {
    if (this.memoryHistory.length === 0) {
      return {
        current: this.lastMemoryStats,
        peak: undefined,
        average: undefined,
        history: [],
      };
    }

    const peak = this.memoryHistory.reduce((max, stats) =>
      stats.heapUsed > max.heapUsed ? stats : max,
    );

    const average: MemoryStats = {
      heapUsed:
        this.memoryHistory.reduce((sum, stats) => sum + stats.heapUsed, 0) /
        this.memoryHistory.length,
      heapTotal:
        this.memoryHistory.reduce((sum, stats) => sum + stats.heapTotal, 0) /
        this.memoryHistory.length,
      external:
        this.memoryHistory.reduce((sum, stats) => sum + stats.external, 0) /
        this.memoryHistory.length,
      rss:
        this.memoryHistory.reduce((sum, stats) => sum + stats.rss, 0) / this.memoryHistory.length,
      arrayBuffers:
        this.memoryHistory.reduce((sum, stats) => sum + stats.arrayBuffers, 0) /
        this.memoryHistory.length,
    };

    return {
      current: this.lastMemoryStats,
      peak,
      average,
      history: [...this.memoryHistory],
    };
  }

  /**
   * Get memory growth rate
   */
  getMemoryGrowthRate(): number | undefined {
    if (this.memoryHistory.length < 2) {
      return undefined;
    }

    const recent = this.memoryHistory.slice(-10); // Last 10 measurements
    if (recent.length < 2) {
      return undefined;
    }

    const first = recent[0];
    const last = recent[recent.length - 1];
    const timeDiff = recent.length * this.config.monitoringInterval; // Approximate time diff
    const memoryDiff = last.heapUsed - first.heapUsed;

    return memoryDiff / timeDiff; // Bytes per millisecond
  }

  /**
   * Predict memory exhaustion time
   */
  predictMemoryExhaustion(): Date | undefined {
    const growthRate = this.getMemoryGrowthRate();
    if (!growthRate || growthRate <= 0 || !this.lastMemoryStats) {
      return undefined;
    }

    const currentMB = this.lastMemoryStats.heapUsed / (1024 * 1024);
    const remainingMB = this.config.thresholds.maxMB - currentMB;
    const remainingBytes = remainingMB * 1024 * 1024;
    const timeToExhaustionMs = remainingBytes / growthRate;

    if (timeToExhaustionMs > 0 && timeToExhaustionMs < 300000) {
      // Within 5 minutes
      return new Date(Date.now() + timeToExhaustionMs);
    }

    return undefined;
  }

  /**
   * Create memory error based on current usage
   */
  createMemoryError(context?: LogContext): DataPilotError {
    const stats = this.checkMemoryUsage(context);
    const heapMB = stats.heapUsed / (1024 * 1024);

    return DataPilotError.memory(
      `Memory limit exceeded: ${heapMB.toFixed(1)}MB used (limit: ${this.config.thresholds.maxMB}MB)`,
      'MEMORY_LIMIT_EXCEEDED',
      {
        ...context,
        memoryUsage: stats.heapUsed,
      },
      [
        {
          action: 'Reduce data scope',
          description: 'Process data in smaller chunks or reduce maxRows',
          severity: ErrorSeverity.HIGH,
          command: '--maxRows 10000 or --chunkSize 1000',
        },
        {
          action: 'Increase memory limit',
          description: 'Increase available memory for the process',
          severity: ErrorSeverity.MEDIUM,
          command: '--max-old-space-size=2048',
        },
        {
          action: 'Use streaming mode',
          description: 'Enable streaming analysis for large datasets',
          severity: ErrorSeverity.HIGH,
          automated: true,
        },
      ],
    );
  }

  /**
   * Cleanup and dispose
   */
  dispose(): void {
    this.stopMonitoring();
    this.removeAllListeners();
    this.cleanupCallbacks = [];
    this.memoryHistory = [];
  }

  private handleMemoryWarning(stats: MemoryStats, context?: LogContext): void {
    const heapMB = stats.heapUsed / (1024 * 1024);
    
    if (!this.isLogging) {
      this.isLogging = true;
      logger.warn(`Memory usage warning: ${heapMB.toFixed(1)}MB`, {
        ...context,
        memoryUsage: stats.heapUsed,
      });
      this.isLogging = false;
    }

    if (this.config.enableAutomaticCleanup) {
      this.forceGarbageCollection(context);
    }
  }

  private handleMemoryCritical(stats: MemoryStats, context?: LogContext): void {
    const heapMB = stats.heapUsed / (1024 * 1024);
    
    if (!this.isLogging) {
      this.isLogging = true;
      logger.error(`Critical memory usage: ${heapMB.toFixed(1)}MB`, {
        ...context,
        memoryUsage: stats.heapUsed,
      });
      this.isLogging = false;
    }

    if (this.config.enableAutomaticCleanup) {
      this.runCleanup(context);
      this.forceGarbageCollection(context);
    }

    // Predict exhaustion
    const exhaustionTime = this.predictMemoryExhaustion();
    if (exhaustionTime && !this.isLogging) {
      const timeLeft = exhaustionTime.getTime() - Date.now();
      this.isLogging = true;
      logger.error(
        `Memory exhaustion predicted in ${(timeLeft / 1000).toFixed(1)} seconds`,
        context,
      );
      this.isLogging = false;
    }
  }

  private handleMemoryMax(stats: MemoryStats, context?: LogContext): void {
    const heapMB = stats.heapUsed / (1024 * 1024);
    
    if (!this.isLogging) {
      this.isLogging = true;
      logger.error(`Maximum memory limit reached: ${heapMB.toFixed(1)}MB`, {
        ...context,
        memoryUsage: stats.heapUsed,
      });
      this.isLogging = false;
    }

    if (this.config.enableAutomaticCleanup) {
      this.runCleanup(context);
      this.forceGarbageCollection(context);
    }

    // Throw error to stop processing
    throw this.createMemoryError(context);
  }
}

// Global memory manager instance
export const globalMemoryManager = new MemoryManager();

/**
 * Resource cleanup utilities
 */
export class ResourceManager {
  private resources: Map<string, { cleanup: () => void; type: string }> = new Map();
  private disposed = false;

  /**
   * Register a resource for cleanup
   */
  register(id: string, cleanup: () => void, type: string = 'generic'): void {
    if (this.disposed) {
      logger.warn(`Cannot register resource ${id}: ResourceManager is disposed`);
      return;
    }

    this.resources.set(id, { cleanup, type });
  }

  /**
   * Unregister a resource
   */
  unregister(id: string): boolean {
    return this.resources.delete(id);
  }

  /**
   * Clean up a specific resource
   */
  cleanup(id: string, context?: LogContext): boolean {
    const resource = this.resources.get(id);
    if (!resource) {
      return false;
    }

    try {
      resource.cleanup();
      this.resources.delete(id);
      logger.debug(`Cleaned up resource: ${id} (${resource.type})`, context);
      return true;
    } catch (error) {
      logger.error(`Failed to clean up resource ${id}`, context, error);
      return false;
    }
  }

  /**
   * Clean up all resources of a specific type
   */
  cleanupByType(type: string, context?: LogContext): number {
    let cleaned = 0;

    for (const [id, resource] of this.resources.entries()) {
      if (resource.type === type) {
        if (this.cleanup(id, context)) {
          cleaned++;
        }
      }
    }

    return cleaned;
  }

  /**
   * Clean up all resources
   */
  cleanupAll(context?: LogContext): number {
    let cleaned = 0;

    for (const id of this.resources.keys()) {
      if (this.cleanup(id, context)) {
        cleaned++;
      }
    }

    return cleaned;
  }

  /**
   * Get resource count by type
   */
  getResourceCount(type?: string): number {
    if (!type) {
      return this.resources.size;
    }

    return Array.from(this.resources.values()).filter((r) => r.type === type).length;
  }

  /**
   * List all resources
   */
  listResources(): Array<{ id: string; type: string }> {
    return Array.from(this.resources.entries()).map(([id, resource]) => ({
      id,
      type: resource.type,
    }));
  }

  /**
   * Dispose of the resource manager
   */
  dispose(context?: LogContext): void {
    if (this.disposed) {
      return;
    }

    logger.debug(`Disposing ResourceManager with ${this.resources.size} resources`, context);
    this.cleanupAll(context);
    this.disposed = true;
  }

  /**
   * Check if disposed
   */
  isDisposed(): boolean {
    return this.disposed;
  }
}

// Global resource manager instance
export const globalResourceManager = new ResourceManager();

/**
 * Process cleanup handler
 */
export class ProcessCleanupHandler {
  private static instance?: ProcessCleanupHandler;
  private handlers: Array<() => void | Promise<void>> = [];
  private isShuttingDown = false;

  private constructor() {
    // Register process exit handlers
    process.on('exit', this.handleExit.bind(this));
    process.on('SIGINT', (signal) => {
      void this.handleSignal(signal as 'SIGINT');
    });
    process.on('SIGTERM', (signal) => {
      void this.handleSignal(signal as 'SIGTERM');
    });
    process.on('uncaughtException', (error) => {
      void this.handleUncaughtException(error);
    });
    process.on('unhandledRejection', (reason) => {
      void this.handleUnhandledRejection(reason);
    });
  }

  static getInstance(): ProcessCleanupHandler {
    if (!ProcessCleanupHandler.instance) {
      ProcessCleanupHandler.instance = new ProcessCleanupHandler();
    }
    return ProcessCleanupHandler.instance;
  }

  /**
   * Register cleanup handler
   */
  register(handler: () => void | Promise<void>): void {
    this.handlers.push(handler);
  }

  /**
   * Run all cleanup handlers
   */
  async runCleanup(): Promise<void> {
    if (this.isShuttingDown) {
      return;
    }

    this.isShuttingDown = true;
    logger.info('Running process cleanup handlers');

    for (const handler of this.handlers) {
      try {
        await handler();
      } catch (error) {
        logger.error('Error in cleanup handler', undefined, error);
      }
    }

    // Clean up global managers
    try {
      globalMemoryManager.dispose();
      globalResourceManager.dispose();
    } catch (error) {
      logger.error('Error disposing global managers', undefined, error);
    }
  }

  private handleExit(): void {
    if (!this.isShuttingDown) {
      // Synchronous cleanup only for exit event
      logger.info('Process exiting, running synchronous cleanup');
      globalMemoryManager.dispose();
      globalResourceManager.dispose();
    }
  }

  private async handleSignal(signal: string): Promise<void> {
    logger.info(`Received ${signal}, initiating graceful shutdown`);
    await this.runCleanup();
    process.exit(0);
  }

  private async handleUncaughtException(error: Error): Promise<void> {
    logger.error('Uncaught exception, running cleanup before exit', undefined, error);
    await this.runCleanup();
    process.exit(1);
  }

  private async handleUnhandledRejection(reason: unknown): Promise<void> {
    logger.error('Unhandled promise rejection, running cleanup before exit', undefined, reason);
    await this.runCleanup();
    process.exit(1);
  }
}

// Initialize global cleanup handler
export const globalCleanupHandler = ProcessCleanupHandler.getInstance();
