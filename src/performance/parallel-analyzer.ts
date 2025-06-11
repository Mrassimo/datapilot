/**
 * Parallel Analysis Engine
 * Orchestrates parallel processing for multi-format data analysis
 */

import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import type { WorkerTask } from './worker-pool';
import { WorkerPool, getGlobalWorkerPool } from './worker-pool';
import { logger } from '../utils/logger';
import { DataPilotError, ErrorSeverity, ErrorCategory } from '../core/types';
import { performance } from 'perf_hooks';

interface ParallelAnalysisOptions {
  maxWorkers?: number;
  enableMemoryMonitoring?: boolean;
  memoryLimitMB?: number;
  batchSize?: number;
  taskTimeout?: number;
}

export interface AnalysisResult {
  success: boolean;
  results: any[];
  executionTime: number;
  totalTasks: number;
  failedTasks: number;
  memoryUsage?: number;
}

/**
 * High-performance parallel analysis engine
 */
export class ParallelAnalyzer {
  private statisticalWorkerPool: WorkerPool;
  private parsingWorkerPool: WorkerPool;
  private options: Required<ParallelAnalysisOptions>;

  constructor(options: ParallelAnalysisOptions = {}) {
    this.options = {
      maxWorkers: options.maxWorkers || Math.max(2, require('os').cpus().length - 1),
      enableMemoryMonitoring: options.enableMemoryMonitoring ?? true,
      memoryLimitMB: options.memoryLimitMB || 256,
      batchSize: options.batchSize || 1000,
      taskTimeout: options.taskTimeout || 60000,
    };

    // Initialize worker pools with different scripts
    const statisticalWorkerScript = path.join(__dirname, 'workers', 'statistical-worker.js');
    const parsingWorkerScript = path.join(__dirname, 'workers', 'parsing-worker.js');

    this.statisticalWorkerPool = new WorkerPool(statisticalWorkerScript, {
      maxWorkers: this.options.maxWorkers,
      enableMemoryMonitoring: this.options.enableMemoryMonitoring,
      memoryLimitMB: this.options.memoryLimitMB,
      taskTimeout: this.options.taskTimeout,
    });

    this.parsingWorkerPool = new WorkerPool(parsingWorkerScript, {
      maxWorkers: this.options.maxWorkers,
      enableMemoryMonitoring: this.options.enableMemoryMonitoring,
      memoryLimitMB: this.options.memoryLimitMB,
      taskTimeout: this.options.taskTimeout,
    });

    logger.info(`Parallel analyzer initialized with ${this.options.maxWorkers} workers per pool`);
  }

  /**
   * Calculate descriptive statistics for multiple columns in parallel
   */
  async calculateMultipleDescriptiveStats(datasets: number[][]): Promise<AnalysisResult> {
    const startTime = performance.now();

    try {
      // Create tasks for each dataset
      const tasks: WorkerTask[] = datasets.map((values, index) => ({
        id: `desc-stats-${index}-${uuidv4()}`,
        type: 'descriptive-stats',
        data: { values },
        priority: 'normal',
      }));

      logger.info(`Computing descriptive statistics for ${datasets.length} columns in parallel`);

      const results = await this.statisticalWorkerPool.executeAll(tasks);
      const executionTime = performance.now() - startTime;

      return {
        success: true,
        results,
        executionTime,
        totalTasks: tasks.length,
        failedTasks: 0,
      };
    } catch (error) {
      const executionTime = performance.now() - startTime;
      logger.error(`Parallel descriptive statistics failed: ${error.message}`);

      return {
        success: false,
        results: [],
        executionTime,
        totalTasks: datasets.length,
        failedTasks: datasets.length,
      };
    }
  }

  /**
   * Calculate correlations between multiple column pairs in parallel
   */
  async calculateMultipleCorrelations(
    pairs: Array<{ x: number[]; y: number[] }>,
  ): Promise<AnalysisResult> {
    const startTime = performance.now();

    try {
      // Create tasks for each correlation pair
      const tasks: WorkerTask[] = pairs.map((pair, index) => ({
        id: `correlation-${index}-${uuidv4()}`,
        type: 'correlation',
        data: pair,
        priority: 'normal',
      }));

      logger.info(`Computing ${pairs.length} correlations in parallel`);

      const results = await this.statisticalWorkerPool.executeAll(tasks);
      const executionTime = performance.now() - startTime;

      return {
        success: true,
        results,
        executionTime,
        totalTasks: tasks.length,
        failedTasks: 0,
      };
    } catch (error) {
      const executionTime = performance.now() - startTime;
      logger.error(`Parallel correlation calculation failed: ${error.message}`);

      return {
        success: false,
        results: [],
        executionTime,
        totalTasks: pairs.length,
        failedTasks: pairs.length,
      };
    }
  }

  /**
   * Detect outliers in multiple columns in parallel
   */
  async detectMultipleOutliers(
    datasets: number[][],
    multiplier: number = 1.5,
  ): Promise<AnalysisResult> {
    const startTime = performance.now();

    try {
      const tasks: WorkerTask[] = datasets.map((values, index) => ({
        id: `outliers-${index}-${uuidv4()}`,
        type: 'outlier-detection',
        data: { values, multiplier },
        priority: 'normal',
      }));

      logger.info(`Detecting outliers in ${datasets.length} columns in parallel`);

      const results = await this.statisticalWorkerPool.executeAll(tasks);
      const executionTime = performance.now() - startTime;

      return {
        success: true,
        results,
        executionTime,
        totalTasks: tasks.length,
        failedTasks: 0,
      };
    } catch (error) {
      const executionTime = performance.now() - startTime;
      logger.error(`Parallel outlier detection failed: ${error.message}`);

      return {
        success: false,
        results: [],
        executionTime,
        totalTasks: datasets.length,
        failedTasks: datasets.length,
      };
    }
  }

  /**
   * Calculate frequency distributions for multiple categorical columns in parallel
   */
  async calculateMultipleFrequencyDistributions(datasets: any[][]): Promise<AnalysisResult> {
    const startTime = performance.now();

    try {
      const tasks: WorkerTask[] = datasets.map((values, index) => ({
        id: `freq-dist-${index}-${uuidv4()}`,
        type: 'frequency-distribution',
        data: { values },
        priority: 'normal',
      }));

      logger.info(`Computing frequency distributions for ${datasets.length} columns in parallel`);

      const results = await this.statisticalWorkerPool.executeAll(tasks);
      const executionTime = performance.now() - startTime;

      return {
        success: true,
        results,
        executionTime,
        totalTasks: tasks.length,
        failedTasks: 0,
      };
    } catch (error) {
      const executionTime = performance.now() - startTime;
      logger.error(`Parallel frequency distribution calculation failed: ${error.message}`);

      return {
        success: false,
        results: [],
        executionTime,
        totalTasks: datasets.length,
        failedTasks: datasets.length,
      };
    }
  }

  /**
   * Parse multiple CSV chunks in parallel
   */
  async parseMultipleCSVChunks(chunks: string[], options: any = {}): Promise<AnalysisResult> {
    const startTime = performance.now();

    try {
      const tasks: WorkerTask[] = chunks.map((chunk, index) => ({
        id: `csv-parse-${index}-${uuidv4()}`,
        type: 'parse-csv-chunk',
        data: { chunk, options },
        priority: 'high', // Parsing is often blocking
      }));

      logger.info(`Parsing ${chunks.length} CSV chunks in parallel`);

      const results = await this.parsingWorkerPool.executeAll(tasks);
      const executionTime = performance.now() - startTime;

      return {
        success: true,
        results,
        executionTime,
        totalTasks: tasks.length,
        failedTasks: 0,
      };
    } catch (error) {
      const executionTime = performance.now() - startTime;
      logger.error(`Parallel CSV parsing failed: ${error.message}`);

      return {
        success: false,
        results: [],
        executionTime,
        totalTasks: chunks.length,
        failedTasks: chunks.length,
      };
    }
  }

  /**
   * Parse multiple JSON objects in parallel
   */
  async parseMultipleJSON(jsonStrings: string[], options: any = {}): Promise<AnalysisResult> {
    const startTime = performance.now();

    try {
      const tasks: WorkerTask[] = jsonStrings.map((content, index) => ({
        id: `json-parse-${index}-${uuidv4()}`,
        type: 'parse-json',
        data: { content, options },
        priority: 'high',
      }));

      logger.info(`Parsing ${jsonStrings.length} JSON objects in parallel`);

      const results = await this.parsingWorkerPool.executeAll(tasks);
      const executionTime = performance.now() - startTime;

      return {
        success: true,
        results,
        executionTime,
        totalTasks: tasks.length,
        failedTasks: 0,
      };
    } catch (error) {
      const executionTime = performance.now() - startTime;
      logger.error(`Parallel JSON parsing failed: ${error.message}`);

      return {
        success: false,
        results: [],
        executionTime,
        totalTasks: jsonStrings.length,
        failedTasks: jsonStrings.length,
      };
    }
  }

  /**
   * Detect data types for multiple columns in parallel
   */
  async detectMultipleDataTypes(columns: string[][]): Promise<AnalysisResult> {
    const startTime = performance.now();

    try {
      // Split columns into batches for parallel processing
      const batchSize = Math.ceil(columns.length / this.options.maxWorkers);
      const batches: string[][][] = [];

      for (let i = 0; i < columns.length; i += batchSize) {
        batches.push(columns.slice(i, i + batchSize));
      }

      const tasks: WorkerTask[] = batches.map((batch, index) => ({
        id: `type-detection-${index}-${uuidv4()}`,
        type: 'detect-data-types',
        data: { columns: batch },
        priority: 'normal',
      }));

      logger.info(
        `Detecting data types for ${columns.length} columns in ${batches.length} parallel batches`,
      );

      const batchResults = await this.parsingWorkerPool.executeAll(tasks);

      // Flatten batch results
      const results = batchResults.flat();
      const executionTime = performance.now() - startTime;

      return {
        success: true,
        results,
        executionTime,
        totalTasks: tasks.length,
        failedTasks: 0,
      };
    } catch (error) {
      const executionTime = performance.now() - startTime;
      logger.error(`Parallel data type detection failed: ${error.message}`);

      return {
        success: false,
        results: [],
        executionTime,
        totalTasks: columns.length,
        failedTasks: columns.length,
      };
    }
  }

  /**
   * Execute mixed workload (statistical + parsing) with intelligent scheduling
   */
  async executeMixedWorkload(
    statisticalTasks: WorkerTask[],
    parsingTasks: WorkerTask[],
  ): Promise<{ statistical: AnalysisResult; parsing: AnalysisResult }> {
    const startTime = performance.now();

    try {
      logger.info(
        `Executing mixed workload: ${statisticalTasks.length} statistical + ${parsingTasks.length} parsing tasks`,
      );

      // Execute both types of tasks in parallel
      const [statisticalResults, parsingResults] = await Promise.all([
        this.statisticalWorkerPool.executeAll(statisticalTasks),
        this.parsingWorkerPool.executeAll(parsingTasks),
      ]);

      const executionTime = performance.now() - startTime;

      return {
        statistical: {
          success: true,
          results: statisticalResults,
          executionTime,
          totalTasks: statisticalTasks.length,
          failedTasks: 0,
        },
        parsing: {
          success: true,
          results: parsingResults,
          executionTime,
          totalTasks: parsingTasks.length,
          failedTasks: 0,
        },
      };
    } catch (error) {
      const executionTime = performance.now() - startTime;
      logger.error(`Mixed workload execution failed: ${error.message}`);

      throw new DataPilotError(
        `Mixed workload execution failed: ${error.message}`,
        'PARALLEL_MIXED_WORKLOAD_ERROR',
        ErrorSeverity.HIGH,
        ErrorCategory.PERFORMANCE,
      );
    }
  }

  /**
   * Get performance statistics from both worker pools
   */
  getPerformanceStats() {
    const statisticalStats = this.statisticalWorkerPool.getStats();
    const parsingStats = this.parsingWorkerPool.getStats();

    return {
      statistical: statisticalStats,
      parsing: parsingStats,
      total: {
        totalWorkers: statisticalStats.totalWorkers + parsingStats.totalWorkers,
        availableWorkers: statisticalStats.availableWorkers + parsingStats.availableWorkers,
        busyWorkers: statisticalStats.busyWorkers + parsingStats.busyWorkers,
        queuedTasks: statisticalStats.queuedTasks + parsingStats.queuedTasks,
        activeTasksCount: statisticalStats.activeTasksCount + parsingStats.activeTasksCount,
      },
    };
  }

  /**
   * Adaptive batch size calculation based on data size and available workers
   */
  calculateOptimalBatchSize(
    dataSize: number,
    complexity: 'low' | 'medium' | 'high' = 'medium',
  ): number {
    const baseComplexity = complexity === 'low' ? 1 : complexity === 'medium' ? 2 : 4;
    const availableWorkers = this.options.maxWorkers;

    // Calculate optimal batch size based on data size, complexity, and available workers
    const targetTasksPerWorker = 2; // Keep workers busy with 2 tasks each
    const targetTotalTasks = availableWorkers * targetTasksPerWorker;

    let batchSize = Math.ceil(dataSize / targetTotalTasks / baseComplexity);

    // Ensure reasonable bounds
    batchSize = Math.max(100, Math.min(10000, batchSize));

    return batchSize;
  }

  /**
   * Gracefully shutdown both worker pools
   */
  async shutdown(): Promise<void> {
    logger.info('Shutting down parallel analyzer');

    await Promise.all([this.statisticalWorkerPool.shutdown(), this.parsingWorkerPool.shutdown()]);

    logger.info('Parallel analyzer shutdown complete');
  }
}

/**
 * Global parallel analyzer instance
 */
let globalParallelAnalyzer: ParallelAnalyzer | null = null;

/**
 * Get or create the global parallel analyzer
 */
export function getGlobalParallelAnalyzer(options?: ParallelAnalysisOptions): ParallelAnalyzer {
  if (!globalParallelAnalyzer) {
    globalParallelAnalyzer = new ParallelAnalyzer(options);
  }
  return globalParallelAnalyzer;
}

/**
 * Shutdown the global parallel analyzer
 */
export async function shutdownGlobalParallelAnalyzer(): Promise<void> {
  if (globalParallelAnalyzer) {
    await globalParallelAnalyzer.shutdown();
    globalParallelAnalyzer = null;
  }
}
