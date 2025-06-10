/**
 * High-Performance Worker Pool Manager
 * Provides thread-safe parallel processing for CPU-intensive data analysis operations
 */

import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';
import { cpus } from 'os';
import { EventEmitter } from 'events';
import { logger } from '../utils/logger';
import { DataPilotError, ErrorSeverity, ErrorCategory } from '../core/types';

export interface WorkerTask<T = any, R = any> {
  id: string;
  type: string;
  data: T;
  timeout?: number;
  priority?: 'low' | 'normal' | 'high';
}

export interface WorkerResult<R = any> {
  taskId: string;
  success: boolean;
  result?: R;
  error?: string;
  executionTime: number;
  memoryUsage?: number;
}

export interface WorkerPoolOptions {
  maxWorkers?: number;
  idleTimeout?: number;
  taskTimeout?: number;
  enableMemoryMonitoring?: boolean;
  memoryLimitMB?: number;
}

interface QueuedTask {
  task: WorkerTask;
  resolve: (result: any) => void;
  reject: (error: Error) => void;
  timestamp: number;
}

/**
 * High-performance worker pool for parallel data processing
 */
export class WorkerPool extends EventEmitter {
  private workers: Set<Worker> = new Set();
  private availableWorkers: Worker[] = [];
  private busyWorkers: Map<Worker, string> = new Map();
  private taskQueue: QueuedTask[] = [];
  private activeTasksCount = 0;
  private maxWorkers: number;
  private idleTimeout: number;
  private taskTimeout: number;
  private enableMemoryMonitoring: boolean;
  private memoryLimitMB: number;
  private workerScript: string;

  constructor(workerScript: string, options: WorkerPoolOptions = {}) {
    super();

    this.workerScript = workerScript;
    this.maxWorkers = options.maxWorkers || Math.max(2, cpus().length - 1);
    this.idleTimeout = options.idleTimeout || 30000; // 30 seconds
    this.taskTimeout = options.taskTimeout || 60000; // 60 seconds
    this.enableMemoryMonitoring = options.enableMemoryMonitoring ?? true;
    this.memoryLimitMB = options.memoryLimitMB || 256;

    logger.info(`Initializing worker pool with ${this.maxWorkers} workers`);
  }

  /**
   * Execute a task in the worker pool
   */
  async execute<T, R>(task: WorkerTask<T, R>): Promise<R> {
    return new Promise((resolve, reject) => {
      const queuedTask: QueuedTask = {
        task,
        resolve,
        reject,
        timestamp: Date.now(),
      };

      // Add to priority queue
      this.addToQueue(queuedTask);
      this.processQueue();
    });
  }

  /**
   * Execute multiple tasks in parallel with controlled concurrency
   */
  async executeAll<T, R>(tasks: WorkerTask<T, R>[], maxConcurrency?: number): Promise<R[]> {
    const concurrency = Math.min(maxConcurrency || this.maxWorkers, this.maxWorkers, tasks.length);

    const results: R[] = new Array(tasks.length);
    const errors: Error[] = [];

    // Process tasks in batches
    for (let i = 0; i < tasks.length; i += concurrency) {
      const batch = tasks.slice(i, i + concurrency);
      const batchPromises = batch.map((task, batchIndex) =>
        this.execute(task)
          .then((result) => {
            results[i + batchIndex] = result;
          })
          .catch((error) => {
            errors.push(new Error(`Task ${i + batchIndex} failed: ${error.message}`));
          }),
      );

      await Promise.all(batchPromises);
    }

    if (errors.length > 0) {
      throw new DataPilotError(
        `${errors.length} tasks failed during parallel execution`,
        'WORKER_POOL_BATCH_ERROR',
        ErrorSeverity.HIGH,
        ErrorCategory.PERFORMANCE,
      );
    }

    return results;
  }

  /**
   * Add task to priority queue
   */
  private addToQueue(queuedTask: QueuedTask): void {
    const priority = queuedTask.task.priority || 'normal';

    // Insert based on priority (high > normal > low)
    let insertIndex = this.taskQueue.length;

    if (priority === 'high') {
      insertIndex = this.taskQueue.findIndex((item) => (item.task.priority || 'normal') !== 'high');
      if (insertIndex === -1) insertIndex = this.taskQueue.length;
    } else if (priority === 'normal') {
      insertIndex = this.taskQueue.findIndex((item) => (item.task.priority || 'normal') === 'low');
      if (insertIndex === -1) insertIndex = this.taskQueue.length;
    }

    this.taskQueue.splice(insertIndex, 0, queuedTask);
  }

  /**
   * Process the task queue
   */
  private async processQueue(): Promise<void> {
    while (this.taskQueue.length > 0 && this.availableWorkers.length > 0) {
      const queuedTask = this.taskQueue.shift();
      const worker = this.availableWorkers.pop();

      this.executeTaskOnWorker(worker, queuedTask);
    }

    // Create new workers if needed and under limit
    if (this.taskQueue.length > 0 && this.workers.size < this.maxWorkers) {
      const workersToCreate = Math.min(this.taskQueue.length, this.maxWorkers - this.workers.size);

      for (let i = 0; i < workersToCreate; i++) {
        try {
          await this.createWorker();
          // Process queue again with new worker
          setImmediate(() => this.processQueue());
        } catch (error) {
          logger.error(`Failed to create worker: ${error.message}`);
        }
      }
    }
  }

  /**
   * Execute a task on a specific worker
   */
  private async executeTaskOnWorker(worker: Worker, queuedTask: QueuedTask): Promise<void> {
    const { task, resolve, reject } = queuedTask;
    const startTime = Date.now();

    this.busyWorkers.set(worker, task.id);
    this.activeTasksCount++;

    // Set up timeout
    const timeout = setTimeout(() => {
      this.handleWorkerTimeout(worker, task.id);
      reject(new Error(`Task ${task.id} timed out after ${this.taskTimeout}ms`));
    }, task.timeout || this.taskTimeout);

    // Handle worker response
    const messageHandler = (result: WorkerResult) => {
      if (result.taskId === task.id) {
        clearTimeout(timeout);
        worker.off('message', messageHandler);
        worker.off('error', errorHandler);

        this.busyWorkers.delete(worker);
        this.activeTasksCount--;
        this.availableWorkers.push(worker);

        const executionTime = Date.now() - startTime;

        if (result.success) {
          logger.debug(`Task ${task.id} completed in ${executionTime}ms`);
          resolve(result.result);
        } else {
          logger.warn(`Task ${task.id} failed: ${result.error}`);
          reject(new Error(result.error));
        }

        // Process next task in queue
        setImmediate(() => this.processQueue());
      }
    };

    const errorHandler = (error: Error) => {
      clearTimeout(timeout);
      worker.off('message', messageHandler);
      worker.off('error', errorHandler);

      this.busyWorkers.delete(worker);
      this.activeTasksCount--;

      // Remove problematic worker and create a new one
      this.removeWorker(worker);
      setImmediate(() => this.createWorker());

      reject(
        new DataPilotError(
          `Worker error for task ${task.id}: ${error.message}`,
          'WORKER_ERROR',
          ErrorSeverity.HIGH,
          ErrorCategory.PERFORMANCE,
        ),
      );
    };

    worker.on('message', messageHandler);
    worker.on('error', errorHandler);

    // Send task to worker
    worker.postMessage({
      taskId: task.id,
      type: task.type,
      data: task.data,
      enableMemoryMonitoring: this.enableMemoryMonitoring,
      memoryLimitMB: this.memoryLimitMB,
    });
  }

  /**
   * Create a new worker
   */
  private async createWorker(): Promise<Worker> {
    return new Promise((resolve, reject) => {
      try {
        const worker = new Worker(this.workerScript, {
          resourceLimits: {
            maxOldGenerationSizeMb: this.memoryLimitMB,
            maxYoungGenerationSizeMb: Math.floor(this.memoryLimitMB * 0.3),
          },
        });

        worker.on('error', (error) => {
          logger.error(`Worker creation error: ${error.message}`);
          this.removeWorker(worker);
          reject(error);
        });

        worker.on('exit', (code) => {
          if (code !== 0) {
            logger.warn(`Worker exited with code ${code}`);
          }
          this.removeWorker(worker);
        });

        // Worker is ready
        worker.on('message', (message) => {
          if (message.type === 'ready') {
            this.workers.add(worker);
            this.availableWorkers.push(worker);

            logger.debug(`Worker created, pool size: ${this.workers.size}`);
            resolve(worker);
          }
        });

        // Setup idle timeout
        this.setupWorkerIdleTimeout(worker);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Setup idle timeout for worker cleanup
   */
  private setupWorkerIdleTimeout(worker: Worker): void {
    const timeoutId = setTimeout(() => {
      if (this.availableWorkers.includes(worker) && this.workers.size > 2) {
        this.removeWorker(worker);
        logger.debug(`Removed idle worker, pool size: ${this.workers.size}`);
      }
    }, this.idleTimeout);

    // Clear timeout if worker becomes busy
    const originalPostMessage = worker.postMessage.bind(worker);
    worker.postMessage = (message: any) => {
      clearTimeout(timeoutId);
      return originalPostMessage(message);
    };
  }

  /**
   * Handle worker timeout
   */
  private handleWorkerTimeout(worker: Worker, taskId: string): void {
    logger.warn(`Task ${taskId} timed out, terminating worker`);
    this.busyWorkers.delete(worker);
    this.activeTasksCount--;
    this.removeWorker(worker);

    // Create replacement worker
    setImmediate(() => this.createWorker());
  }

  /**
   * Remove a worker from the pool
   */
  private removeWorker(worker: Worker): void {
    this.workers.delete(worker);
    this.availableWorkers = this.availableWorkers.filter((w) => w !== worker);
    this.busyWorkers.delete(worker);

    try {
      worker.terminate();
    } catch (error) {
      logger.warn(`Error terminating worker: ${error.message}`);
    }
  }

  /**
   * Get pool statistics
   */
  getStats() {
    return {
      totalWorkers: this.workers.size,
      availableWorkers: this.availableWorkers.length,
      busyWorkers: this.busyWorkers.size,
      queuedTasks: this.taskQueue.length,
      activeTasksCount: this.activeTasksCount,
      maxWorkers: this.maxWorkers,
    };
  }

  /**
   * Gracefully shutdown the worker pool
   */
  async shutdown(): Promise<void> {
    logger.info(`Shutting down worker pool with ${this.workers.size} workers`);

    // Wait for active tasks to complete (with timeout)
    const maxWaitTime = 30000; // 30 seconds
    const startTime = Date.now();

    while (this.activeTasksCount > 0 && Date.now() - startTime < maxWaitTime) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // Terminate all workers
    const terminationPromises = Array.from(this.workers).map(
      (worker) =>
        new Promise<void>((resolve) => {
          worker
            .terminate()
            .then(() => resolve())
            .catch(() => resolve());
        }),
    );

    await Promise.all(terminationPromises);

    this.workers.clear();
    this.availableWorkers = [];
    this.busyWorkers.clear();
    this.taskQueue = [];

    logger.info('Worker pool shutdown complete');
  }

  /**
   * Check if we're running in the main thread
   */
  static isMainThread(): boolean {
    return isMainThread;
  }
}

/**
 * Global worker pool instance
 */
let globalWorkerPool: WorkerPool | null = null;

/**
 * Get or create the global worker pool
 */
export function getGlobalWorkerPool(
  workerScript?: string,
  options?: WorkerPoolOptions,
): WorkerPool {
  if (!globalWorkerPool && workerScript) {
    globalWorkerPool = new WorkerPool(workerScript, options);
  }

  if (!globalWorkerPool) {
    throw new DataPilotError(
      'Worker pool not initialized. Call with workerScript parameter first.',
      'WORKER_POOL_NOT_INITIALIZED',
      ErrorSeverity.HIGH,
      ErrorCategory.PERFORMANCE,
    );
  }

  return globalWorkerPool;
}

/**
 * Shutdown the global worker pool
 */
export async function shutdownGlobalWorkerPool(): Promise<void> {
  if (globalWorkerPool) {
    await globalWorkerPool.shutdown();
    globalWorkerPool = null;
  }
}
