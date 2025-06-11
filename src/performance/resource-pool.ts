/**
 * Advanced Resource Pool Management
 * Memory pooling, garbage collection optimization, and resource lifecycle management
 */

import { EventEmitter } from 'events';
import { performance } from 'perf_hooks';
import { logger } from '../utils/logger';

export interface ResourcePoolOptions {
  maxPoolSize?: number;
  minPoolSize?: number;
  maxResourceAge?: number;
  cleanupInterval?: number;
  enableGcOptimization?: boolean;
  gcHeuristics?: GcHeuristics;
  resourceTypes?: ResourceTypeConfig[];
}

export interface GcHeuristics {
  memoryPressureThreshold?: number;
  timeBetweenGcMin?: number;
  timeBetweenGcMax?: number;
  gcEfficiencyThreshold?: number;
  adaptiveGcTiming?: boolean;
}

export interface ResourceTypeConfig {
  name: string;
  factory: () => any;
  cleanup: (resource: any) => void;
  validator: (resource: any) => boolean;
  maxAge?: number;
  maxPoolSize?: number;
}

export interface PooledResource<T = any> {
  resource: T;
  createdAt: number;
  lastUsed: number;
  useCount: number;
  isHealthy: boolean;
}

export interface PoolStats {
  totalCreated: number;
  totalDestroyed: number;
  totalReused: number;
  currentPoolSize: number;
  activeResources: number;
  poolHitRate: number;
  averageResourceAge: number;
  memoryUsage: number;
}

export interface GcStats {
  totalGcRuns: number;
  totalGcTime: number;
  averageGcTime: number;
  memoryFreed: number;
  lastGcTime: number;
  gcEfficiency: number;
  adaptiveTimingEnabled: boolean;
}

/**
 * Generic resource pool with advanced lifecycle management
 */
export class ResourcePool<T = any> extends EventEmitter {
  private pool: PooledResource<T>[] = [];
  private activeResources = new Set<PooledResource<T>>();
  private options: Required<ResourcePoolOptions>;
  private stats: PoolStats;
  private cleanupTimer?: NodeJS.Timeout;
  private factory: () => T;
  private cleanup: (resource: T) => void;
  private validator: (resource: T) => boolean;

  constructor(
    factory: () => T,
    cleanup: (resource: T) => void,
    validator: (resource: T) => boolean = () => true,
    options: ResourcePoolOptions = {}
  ) {
    super();
    
    this.factory = factory;
    this.cleanup = cleanup;
    this.validator = validator;
    
    this.options = {
      maxPoolSize: options.maxPoolSize || 50,
      minPoolSize: options.minPoolSize || 5,
      maxResourceAge: options.maxResourceAge || 300000, // 5 minutes
      cleanupInterval: options.cleanupInterval || 30000,  // 30 seconds
      enableGcOptimization: options.enableGcOptimization ?? true,
      gcHeuristics: {
        memoryPressureThreshold: 0.8,
        timeBetweenGcMin: 5000,  // 5 seconds
        timeBetweenGcMax: 60000, // 1 minute
        gcEfficiencyThreshold: 0.1, // 10% memory freed minimum
        adaptiveGcTiming: true,
        ...options.gcHeuristics
      },
      resourceTypes: options.resourceTypes || []
    };

    this.stats = {
      totalCreated: 0,
      totalDestroyed: 0,
      totalReused: 0,
      currentPoolSize: 0,
      activeResources: 0,
      poolHitRate: 0,
      averageResourceAge: 0,
      memoryUsage: 0
    };

    this.startCleanupTimer();
    this.prewarmPool();
    
    logger.info(`Resource pool initialized with ${this.options.maxPoolSize} max resources`);
  }

  /**
   * Acquire a resource from the pool
   */
  acquire(): T {
    const startTime = performance.now();
    
    // Try to get from pool first
    let pooledResource = this.getFromPool();
    
    if (pooledResource) {
      this.stats.totalReused++;
      this.emit('resource-reused', { resource: pooledResource.resource, useCount: pooledResource.useCount });
    } else {
      // Create new resource
      const resource = this.factory();
      pooledResource = {
        resource,
        createdAt: Date.now(),
        lastUsed: Date.now(),
        useCount: 0,
        isHealthy: true
      };
      this.stats.totalCreated++;
      this.emit('resource-created', { resource });
    }

    pooledResource.lastUsed = Date.now();
    pooledResource.useCount++;
    this.activeResources.add(pooledResource);
    
    this.updateStats();
    this.emit('resource-acquired', { 
      resource: pooledResource.resource, 
      acquisitionTime: performance.now() - startTime 
    });
    
    return pooledResource.resource;
  }

  /**
   * Release a resource back to the pool
   */
  release(resource: T): void {
    const pooledResource = this.findActiveResource(resource);
    if (!pooledResource) {
      logger.warn('Attempted to release unknown resource');
      return;
    }

    this.activeResources.delete(pooledResource);
    
    // Validate resource health
    if (this.validator(resource) && pooledResource.isHealthy) {
      // Resource is healthy, return to pool if there's space
      if (this.pool.length < this.options.maxPoolSize) {
        pooledResource.lastUsed = Date.now();
        this.pool.push(pooledResource);
        this.emit('resource-returned', { resource });
      } else {
        // Pool is full, destroy resource
        this.destroyResource(pooledResource);
      }
    } else {
      // Resource is unhealthy, destroy it
      pooledResource.isHealthy = false;
      this.destroyResource(pooledResource);
    }

    this.updateStats();
  }

  /**
   * Get resource from pool with health check
   */
  private getFromPool(): PooledResource<T> | null {
    while (this.pool.length > 0) {
      const pooledResource = this.pool.shift()!;
      
      // Check if resource is still valid
      if (this.isResourceValid(pooledResource)) {
        return pooledResource;
      } else {
        // Resource is expired or unhealthy, destroy it
        this.destroyResource(pooledResource);
      }
    }
    
    return null;
  }

  /**
   * Check if a pooled resource is still valid
   */
  private isResourceValid(pooledResource: PooledResource<T>): boolean {
    const now = Date.now();
    const age = now - pooledResource.createdAt;
    
    return age < this.options.maxResourceAge && 
           pooledResource.isHealthy && 
           this.validator(pooledResource.resource);
  }

  /**
   * Find active resource by reference
   */
  private findActiveResource(resource: T): PooledResource<T> | undefined {
    for (const pooledResource of this.activeResources) {
      if (pooledResource.resource === resource) {
        return pooledResource;
      }
    }
    return undefined;
  }

  /**
   * Destroy a resource and update stats
   */
  private destroyResource(pooledResource: PooledResource<T>): void {
    try {
      this.cleanup(pooledResource.resource);
      this.stats.totalDestroyed++;
      this.emit('resource-destroyed', { 
        resource: pooledResource.resource, 
        age: Date.now() - pooledResource.createdAt,
        useCount: pooledResource.useCount 
      });
    } catch (error) {
      logger.error(`Error destroying resource: ${error.message}`);
    }
  }

  /**
   * Prewarm the pool with minimum resources
   */
  private prewarmPool(): void {
    const targetSize = Math.min(this.options.minPoolSize, this.options.maxPoolSize);
    
    for (let i = 0; i < targetSize; i++) {
      try {
        const resource = this.factory();
        const pooledResource: PooledResource<T> = {
          resource,
          createdAt: Date.now(),
          lastUsed: Date.now(),
          useCount: 0,
          isHealthy: true
        };
        this.pool.push(pooledResource);
        this.stats.totalCreated++;
      } catch (error) {
        logger.error(`Error prewarming pool: ${error.message}`);
        break;
      }
    }
    
    this.updateStats();
    logger.info(`Pool prewarmed with ${this.pool.length} resources`);
  }

  /**
   * Cleanup expired resources
   */
  private cleanupExpiredResources(): void {
    const now = Date.now();
    let cleanupCount = 0;
    
    // Clean pool
    this.pool = this.pool.filter(pooledResource => {
      if (!this.isResourceValid(pooledResource)) {
        this.destroyResource(pooledResource);
        cleanupCount++;
        return false;
      }
      return true;
    });
    
    // Clean active resources (mark as unhealthy)
    for (const pooledResource of this.activeResources) {
      if (!this.isResourceValid(pooledResource)) {
        pooledResource.isHealthy = false;
        cleanupCount++;
      }
    }
    
    if (cleanupCount > 0) {
      logger.info(`Cleaned up ${cleanupCount} expired resources`);
      this.emit('cleanup-completed', { cleanupCount });
    }
    
    this.updateStats();
  }

  /**
   * Start cleanup timer
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanupExpiredResources();
    }, this.options.cleanupInterval);
  }

  /**
   * Update pool statistics
   */
  private updateStats(): void {
    const totalRequests = this.stats.totalCreated + this.stats.totalReused;
    this.stats.poolHitRate = totalRequests > 0 ? this.stats.totalReused / totalRequests : 0;
    this.stats.currentPoolSize = this.pool.length;
    this.stats.activeResources = this.activeResources.size;
    
    if (this.pool.length > 0) {
      const now = Date.now();
      const totalAge = this.pool.reduce((sum, pr) => sum + (now - pr.createdAt), 0);
      this.stats.averageResourceAge = totalAge / this.pool.length;
    }
    
    // Estimate memory usage (rough calculation)
    const memoryUsage = process.memoryUsage();
    this.stats.memoryUsage = memoryUsage.heapUsed / 1024 / 1024; // MB
  }

  /**
   * Get current pool statistics
   */
  getStats(): PoolStats {
    this.updateStats();
    return { ...this.stats };
  }

  /**
   * Shutdown pool and cleanup all resources
   */
  shutdown(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
    
    // Destroy all pooled resources
    for (const pooledResource of this.pool) {
      this.destroyResource(pooledResource);
    }
    this.pool = [];
    
    // Mark active resources as unhealthy
    for (const pooledResource of this.activeResources) {
      pooledResource.isHealthy = false;
    }
    
    this.updateStats();
    logger.info('Resource pool shutdown complete');
    this.emit('shutdown');
  }
}

/**
 * Advanced garbage collection optimizer
 */
export class GcOptimizer extends EventEmitter {
  private options: Required<GcHeuristics>;
  private stats: GcStats;
  private lastGcTime = 0;
  private lastMemoryUsage = 0;
  private gcTimer?: NodeJS.Timeout;
  private isOptimizing = false;

  constructor(options: GcHeuristics = {}) {
    super();
    
    this.options = {
      memoryPressureThreshold: options.memoryPressureThreshold || 0.8,
      timeBetweenGcMin: options.timeBetweenGcMin || 5000,
      timeBetweenGcMax: options.timeBetweenGcMax || 60000,
      gcEfficiencyThreshold: options.gcEfficiencyThreshold || 0.1,
      adaptiveGcTiming: options.adaptiveGcTiming ?? true
    };

    this.stats = {
      totalGcRuns: 0,
      totalGcTime: 0,
      averageGcTime: 0,
      memoryFreed: 0,
      lastGcTime: 0,
      gcEfficiency: 0,
      adaptiveTimingEnabled: this.options.adaptiveGcTiming
    };

    this.lastMemoryUsage = process.memoryUsage().heapUsed;
    
    if (this.options.adaptiveGcTiming) {
      this.startAdaptiveGc();
    }
  }

  /**
   * Force garbage collection with optimization
   */
  forceGc(): boolean {
    if (!global.gc) {
      logger.warn('Garbage collection not available (run with --expose-gc)');
      return false;
    }

    const startTime = performance.now();
    const beforeMemory = process.memoryUsage().heapUsed;
    
    try {
      global.gc();
      
      const afterMemory = process.memoryUsage().heapUsed;
      const gcTime = performance.now() - startTime;
      const memoryFreed = beforeMemory - afterMemory;
      const efficiency = memoryFreed / beforeMemory;
      
      // Update statistics
      this.stats.totalGcRuns++;
      this.stats.totalGcTime += gcTime;
      this.stats.averageGcTime = this.stats.totalGcTime / this.stats.totalGcRuns;
      this.stats.memoryFreed += memoryFreed;
      this.stats.lastGcTime = Date.now();
      this.stats.gcEfficiency = efficiency;
      
      this.lastGcTime = Date.now();
      this.lastMemoryUsage = afterMemory;
      
      logger.info(`GC completed: ${(memoryFreed / 1024 / 1024).toFixed(2)}MB freed in ${gcTime.toFixed(2)}ms (${(efficiency * 100).toFixed(1)}% efficiency)`);
      
      this.emit('gc-completed', {
        memoryFreed,
        gcTime,
        efficiency,
        beforeMemory,
        afterMemory
      });
      
      return true;
    } catch (error) {
      logger.error(`Garbage collection failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Check if GC should be triggered
   */
  shouldTriggerGc(): boolean {
    const now = Date.now();
    const timeSinceLastGc = now - this.lastGcTime;
    const currentMemory = process.memoryUsage().heapUsed;
    const memoryGrowth = currentMemory - this.lastMemoryUsage;
    const memoryGrowthRatio = this.lastMemoryUsage > 0 ? memoryGrowth / this.lastMemoryUsage : 0;
    
    // Don't run GC too frequently
    if (timeSinceLastGc < this.options.timeBetweenGcMin) {
      return false;
    }
    
    // Force GC if memory pressure is high
    const memoryPressure = this.getCurrentMemoryPressure();
    if (memoryPressure > this.options.memoryPressureThreshold) {
      return true;
    }
    
    // Trigger GC if memory growth is significant
    if (memoryGrowthRatio > 0.2 && timeSinceLastGc > this.options.timeBetweenGcMin * 2) {
      return true;
    }
    
    // Force GC if too much time has passed
    if (timeSinceLastGc > this.options.timeBetweenGcMax) {
      return true;
    }
    
    return false;
  }

  /**
   * Get current memory pressure (0-1)
   */
  getCurrentMemoryPressure(): number {
    const usage = process.memoryUsage();
    const totalMemory = usage.heapTotal + usage.external;
    const usedMemory = usage.heapUsed + usage.external;
    
    return totalMemory > 0 ? usedMemory / totalMemory : 0;
  }

  /**
   * Start adaptive GC timing
   */
  private startAdaptiveGc(): void {
    if (this.isOptimizing) return;
    
    this.isOptimizing = true;
    
    const checkInterval = Math.min(this.options.timeBetweenGcMin / 2, 2000); // Check every 2 seconds max
    
    this.gcTimer = setInterval(() => {
      if (this.shouldTriggerGc()) {
        this.forceGc();
      }
    }, checkInterval);
    
    logger.info('Adaptive garbage collection optimization started');
  }

  /**
   * Stop adaptive GC timing
   */
  stopAdaptiveGc(): void {
    if (this.gcTimer) {
      clearInterval(this.gcTimer);
      this.gcTimer = undefined;
    }
    
    this.isOptimizing = false;
    logger.info('Adaptive garbage collection optimization stopped');
  }

  /**
   * Get GC statistics
   */
  getStats(): GcStats {
    return { ...this.stats };
  }

  /**
   * Reset GC statistics
   */
  resetStats(): void {
    this.stats = {
      totalGcRuns: 0,
      totalGcTime: 0,
      averageGcTime: 0,
      memoryFreed: 0,
      lastGcTime: 0,
      gcEfficiency: 0,
      adaptiveTimingEnabled: this.options.adaptiveGcTiming
    };
  }

  /**
   * Shutdown GC optimizer
   */
  shutdown(): void {
    this.stopAdaptiveGc();
    this.emit('shutdown');
  }
}

/**
 * Multi-type resource pool manager
 */
export class ResourcePoolManager extends EventEmitter {
  private pools = new Map<string, ResourcePool>();
  private gcOptimizer: GcOptimizer;
  private options: Required<ResourcePoolOptions>;

  constructor(options: ResourcePoolOptions = {}) {
    super();
    
    this.options = {
      maxPoolSize: options.maxPoolSize || 50,
      minPoolSize: options.minPoolSize || 5,
      maxResourceAge: options.maxResourceAge || 300000,
      cleanupInterval: options.cleanupInterval || 30000,
      enableGcOptimization: options.enableGcOptimization ?? true,
      gcHeuristics: {
        memoryPressureThreshold: 0.8,
        timeBetweenGcMin: 5000,
        timeBetweenGcMax: 60000,
        gcEfficiencyThreshold: 0.1,
        adaptiveGcTiming: true,
        ...options.gcHeuristics
      },
      resourceTypes: options.resourceTypes || []
    };

    this.gcOptimizer = new GcOptimizer(this.options.gcHeuristics);
    
    // Initialize predefined resource types
    for (const resourceType of this.options.resourceTypes) {
      this.addResourceType(resourceType);
    }
    
    logger.info('Resource pool manager initialized');
  }

  /**
   * Add a new resource type
   */
  addResourceType(config: ResourceTypeConfig): void {
    const pool = new ResourcePool(
      config.factory,
      config.cleanup,
      config.validator,
      {
        maxPoolSize: config.maxPoolSize || this.options.maxPoolSize,
        maxResourceAge: config.maxAge || this.options.maxResourceAge,
        cleanupInterval: this.options.cleanupInterval
      }
    );
    
    this.pools.set(config.name, pool);
    
    // Forward events
    pool.on('resource-created', (data) => this.emit('resource-created', { type: config.name, ...data }));
    pool.on('resource-destroyed', (data) => this.emit('resource-destroyed', { type: config.name, ...data }));
    pool.on('cleanup-completed', (data) => this.emit('cleanup-completed', { type: config.name, ...data }));
    
    logger.info(`Added resource pool for type: ${config.name}`);
  }

  /**
   * Get resource pool by type
   */
  getPool<T>(type: string): ResourcePool<T> | undefined {
    return this.pools.get(type) as ResourcePool<T>;
  }

  /**
   * Acquire resource of specific type
   */
  acquire<T>(type: string): T | undefined {
    const pool = this.getPool<T>(type);
    return pool ? pool.acquire() : undefined;
  }

  /**
   * Release resource of specific type
   */
  release<T>(type: string, resource: T): void {
    const pool = this.getPool<T>(type);
    if (pool) {
      pool.release(resource);
    }
  }

  /**
   * Get aggregated statistics for all pools
   */
  getAllStats(): { [type: string]: PoolStats } & { gc: GcStats } {
    const stats: { [type: string]: PoolStats } = {};
    
    for (const [type, pool] of this.pools) {
      stats[type] = pool.getStats();
    }
    
    return {
      ...stats,
      gc: this.gcOptimizer.getStats()
    };
  }

  /**
   * Force garbage collection
   */
  forceGc(): boolean {
    return this.gcOptimizer.forceGc();
  }

  /**
   * Shutdown all pools and GC optimizer
   */
  shutdown(): void {
    for (const [type, pool] of this.pools) {
      pool.shutdown();
    }
    this.pools.clear();
    
    this.gcOptimizer.shutdown();
    
    this.emit('shutdown');
    logger.info('Resource pool manager shutdown complete');
  }
}

/**
 * Global resource pool manager
 */
let globalResourcePoolManager: ResourcePoolManager | null = null;

/**
 * Get or create global resource pool manager
 */
export function getGlobalResourcePoolManager(options?: ResourcePoolOptions): ResourcePoolManager {
  if (!globalResourcePoolManager) {
    globalResourcePoolManager = new ResourcePoolManager(options);
  }
  return globalResourcePoolManager;
}

/**
 * Shutdown global resource pool manager
 */
export function shutdownGlobalResourcePoolManager(): void {
  if (globalResourcePoolManager) {
    globalResourcePoolManager.shutdown();
    globalResourcePoolManager = null;
  }
}

/**
 * Convenient buffer pool factory
 */
export function createBufferPool(options: { 
  maxSize?: number; 
  bufferSizes?: number[]; 
}): ResourcePool<Buffer> {
  const bufferSizes = options.bufferSizes || [1024, 4096, 16384, 65536, 262144]; // 1KB to 256KB
  let currentSizeIndex = 0;
  
  return new ResourcePool<Buffer>(
    () => Buffer.alloc(bufferSizes[currentSizeIndex++ % bufferSizes.length]),
    (buffer) => buffer.fill(0),
    (buffer) => Buffer.isBuffer(buffer),
    { maxPoolSize: options.maxSize || 100 }
  );
}

/**
 * Convenient object pool factory
 */
export function createObjectPool<T>(
  factory: () => T,
  reset: (obj: T) => void,
  options?: ResourcePoolOptions
): ResourcePool<T> {
  return new ResourcePool<T>(
    factory,
    reset,
    () => true, // Objects are generally always valid unless explicitly marked
    options
  );
}