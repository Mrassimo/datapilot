/**
 * Worker Health Monitor
 * Comprehensive health monitoring and recovery for worker threads
 */

import { EventEmitter } from 'events';
import { Worker } from 'worker_threads';
import { performance } from 'perf_hooks';
import { logger } from '../utils/logger';

interface WorkerHealthStatus {
  workerId: string;
  isHealthy: boolean;
  lastHeartbeat: number;
  taskCount: number;
  memoryUsage: number;
  errorCount: number;
  responseTime: number;
  status: 'active' | 'idle' | 'busy' | 'unresponsive' | 'failed' | 'terminating';
}

interface HealthCheckOptions {
  heartbeatInterval?: number;
  heartbeatTimeout?: number;
  maxErrorCount?: number;
  maxResponseTime?: number;
  memoryThreshold?: number;
  enableAutoRecovery?: boolean;
  healthCheckRetries?: number;
}

export class WorkerHealthMonitor extends EventEmitter {
  private workers = new Map<string, Worker>();
  private healthStatus = new Map<string, WorkerHealthStatus>();
  private healthCheckTimer?: NodeJS.Timeout;
  private options: Required<HealthCheckOptions>;
  private pendingHealthChecks = new Map<string, NodeJS.Timeout>();

  constructor(options: HealthCheckOptions = {}) {
    super();
    
    this.options = {
      heartbeatInterval: options.heartbeatInterval || 5000,
      heartbeatTimeout: options.heartbeatTimeout || 10000,
      maxErrorCount: options.maxErrorCount || 5,
      maxResponseTime: options.maxResponseTime || 30000,
      memoryThreshold: options.memoryThreshold || 256 * 1024 * 1024, // 256MB
      enableAutoRecovery: options.enableAutoRecovery ?? true,
      healthCheckRetries: options.healthCheckRetries || 3
    };
  }

  /**
   * Register a worker for health monitoring
   */
  registerWorker(workerId: string, worker: Worker): void {
    this.workers.set(workerId, worker);
    
    // Initialize health status
    this.healthStatus.set(workerId, {
      workerId,
      isHealthy: true,
      lastHeartbeat: Date.now(),
      taskCount: 0,
      memoryUsage: 0,
      errorCount: 0,
      responseTime: 0,
      status: 'idle'
    });

    // Set up worker event listeners
    this.setupWorkerListeners(workerId, worker);
    
    // Start health monitoring if this is the first worker
    if (this.workers.size === 1) {
      this.startHealthMonitoring();
    }
    
    logger.info(`Worker ${workerId} registered for health monitoring`);
  }

  /**
   * Unregister a worker from health monitoring
   */
  unregisterWorker(workerId: string): void {
    const worker = this.workers.get(workerId);
    if (worker) {
      this.cleanupWorker(workerId);
      this.workers.delete(workerId);
      this.healthStatus.delete(workerId);
      
      // Stop monitoring if no workers left
      if (this.workers.size === 0) {
        this.stopHealthMonitoring();
      }
      
      logger.info(`Worker ${workerId} unregistered from health monitoring`);
    }
  }

  /**
   * Get health status for a specific worker
   */
  getWorkerHealth(workerId: string): WorkerHealthStatus | null {
    return this.healthStatus.get(workerId) || null;
  }

  /**
   * Get health status for all workers
   */
  getAllWorkerHealth(): WorkerHealthStatus[] {
    return Array.from(this.healthStatus.values());
  }

  /**
   * Check if a worker is healthy
   */
  isWorkerHealthy(workerId: string): boolean {
    const status = this.healthStatus.get(workerId);
    return status ? status.isHealthy && status.status !== 'failed' : false;
  }

  /**
   * Get count of healthy workers
   */
  getHealthyWorkerCount(): number {
    return Array.from(this.healthStatus.values())
      .filter(status => status.isHealthy && status.status !== 'failed').length;
  }

  /**
   * Force health check for a specific worker
   */
  async checkWorkerHealth(workerId: string): Promise<boolean> {
    const worker = this.workers.get(workerId);
    const status = this.healthStatus.get(workerId);
    
    if (!worker || !status) {
      return false;
    }

    try {
      const startTime = performance.now();
      
      // Send health check message
      const healthCheckPromise = new Promise<boolean>((resolve) => {
        const timeout = setTimeout(() => {
          resolve(false);
        }, this.options.heartbeatTimeout);

        const messageHandler = (message: any) => {
          if (message.type === 'health-check-response') {
            clearTimeout(timeout);
            worker.off('message', messageHandler);
            resolve(true);
          }
        };

        worker.on('message', messageHandler);
        worker.postMessage({ type: 'health-check' });
      });

      const isResponsive = await healthCheckPromise;
      const responseTime = performance.now() - startTime;
      
      // Update health status
      status.lastHeartbeat = Date.now();
      status.responseTime = responseTime;
      
      if (!isResponsive) {
        status.errorCount++;
        status.isHealthy = false;
        status.status = 'unresponsive';
        
        this.emit('worker-unresponsive', { workerId, status });
        
        if (this.options.enableAutoRecovery) {
          await this.recoverWorker(workerId);
        }
        
        return false;
      }
      
      // Reset error count on successful health check
      if (status.errorCount > 0) {
        status.errorCount = Math.max(0, status.errorCount - 1);
      }
      
      status.isHealthy = true;
      status.status = 'active';
      
      return true;
    } catch (error) {
      logger.error(`Health check failed for worker ${workerId}: ${error.message}`);
      status.isHealthy = false;
      status.status = 'failed';
      status.errorCount++;
      
      this.emit('worker-health-check-failed', { workerId, error: error.message });
      
      return false;
    }
  }

  /**
   * Attempt to recover an unhealthy worker
   */
  private async recoverWorker(workerId: string): Promise<boolean> {
    const worker = this.workers.get(workerId);
    const status = this.healthStatus.get(workerId);
    
    if (!worker || !status) {
      return false;
    }

    logger.warn(`Attempting to recover worker ${workerId}`);
    
    try {
      // First, try to terminate the worker gracefully
      status.status = 'terminating';
      
      const terminationPromise = new Promise<void>((resolve) => {
        const timeout = setTimeout(() => {
          // Force kill if graceful termination fails
          worker.terminate();
          resolve();
        }, 5000);

        worker.on('exit', () => {
          clearTimeout(timeout);
          resolve();
        });
      });

      worker.postMessage({ type: 'terminate' });
      await terminationPromise;
      
      // Emit worker recovery event
      this.emit('worker-recovery-attempted', { workerId, previousStatus: status });
      
      return true;
    } catch (error) {
      logger.error(`Worker recovery failed for ${workerId}: ${error.message}`);
      this.emit('worker-recovery-failed', { workerId, error: error.message });
      return false;
    }
  }

  /**
   * Set up event listeners for a worker
   */
  private setupWorkerListeners(workerId: string, worker: Worker): void {
    worker.on('error', (error) => {
      const status = this.healthStatus.get(workerId);
      if (status) {
        status.errorCount++;
        status.isHealthy = false;
        status.status = 'failed';
        
        this.emit('worker-error', { workerId, error: error.message, status });
        
        if (status.errorCount >= this.options.maxErrorCount && this.options.enableAutoRecovery) {
          this.recoverWorker(workerId);
        }
      }
    });

    worker.on('exit', (code) => {
      const status = this.healthStatus.get(workerId);
      if (status) {
        status.isHealthy = false;
        status.status = 'failed';
        
        this.emit('worker-exit', { workerId, exitCode: code, status });
      }
    });

    worker.on('message', (message) => {
      if (message.type === 'task-started') {
        const status = this.healthStatus.get(workerId);
        if (status) {
          status.taskCount++;
          status.status = 'busy';
          status.lastHeartbeat = Date.now();
        }
      } else if (message.type === 'task-completed') {
        const status = this.healthStatus.get(workerId);
        if (status) {
          status.status = 'idle';
          status.lastHeartbeat = Date.now();
        }
      } else if (message.type === 'memory-usage') {
        const status = this.healthStatus.get(workerId);
        if (status) {
          status.memoryUsage = message.memoryUsage;
          
          // Check memory threshold
          if (message.memoryUsage > this.options.memoryThreshold) {
            this.emit('worker-memory-threshold-exceeded', { workerId, memoryUsage: message.memoryUsage });
          }
        }
      }
    });
  }

  /**
   * Start periodic health monitoring
   */
  private startHealthMonitoring(): void {
    if (this.healthCheckTimer) {
      return;
    }

    this.healthCheckTimer = setInterval(async () => {
      const healthCheckPromises = Array.from(this.workers.keys()).map(workerId => 
        this.checkWorkerHealth(workerId).catch(error => {
          logger.error(`Health check error for worker ${workerId}: ${error.message}`);
          return false;
        })
      );

      await Promise.allSettled(healthCheckPromises);
      
      // Emit overall health status
      const healthyCount = this.getHealthyWorkerCount();
      const totalCount = this.workers.size;
      
      this.emit('health-check-completed', {
        healthyWorkers: healthyCount,
        totalWorkers: totalCount,
        healthPercentage: totalCount > 0 ? (healthyCount / totalCount) * 100 : 0
      });
      
    }, this.options.heartbeatInterval);

    logger.info('Worker health monitoring started');
  }

  /**
   * Stop health monitoring
   */
  private stopHealthMonitoring(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = undefined;
    }

    // Clear pending health checks
    for (const timeout of this.pendingHealthChecks.values()) {
      clearTimeout(timeout);
    }
    this.pendingHealthChecks.clear();

    logger.info('Worker health monitoring stopped');
  }

  /**
   * Clean up worker resources
   */
  private cleanupWorker(workerId: string): void {
    const pendingTimeout = this.pendingHealthChecks.get(workerId);
    if (pendingTimeout) {
      clearTimeout(pendingTimeout);
      this.pendingHealthChecks.delete(workerId);
    }
  }

  /**
   * Get overall system health metrics
   */
  getSystemHealthMetrics(): {
    totalWorkers: number;
    healthyWorkers: number;
    failedWorkers: number;
    averageResponseTime: number;
    totalErrorCount: number;
    memoryUsage: number;
  } {
    const statuses = Array.from(this.healthStatus.values());
    
    return {
      totalWorkers: statuses.length,
      healthyWorkers: statuses.filter(s => s.isHealthy).length,
      failedWorkers: statuses.filter(s => s.status === 'failed').length,
      averageResponseTime: statuses.length > 0 
        ? statuses.reduce((sum, s) => sum + s.responseTime, 0) / statuses.length 
        : 0,
      totalErrorCount: statuses.reduce((sum, s) => sum + s.errorCount, 0),
      memoryUsage: statuses.reduce((sum, s) => sum + s.memoryUsage, 0)
    };
  }

  /**
   * Shutdown health monitor
   */
  shutdown(): void {
    this.stopHealthMonitoring();
    
    for (const [workerId, worker] of this.workers) {
      this.cleanupWorker(workerId);
    }
    
    this.workers.clear();
    this.healthStatus.clear();
    
    this.emit('shutdown');
    logger.info('Worker health monitor shutdown complete');
  }
}