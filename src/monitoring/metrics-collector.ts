/**
 * Advanced Metrics Collection and Aggregation System for DataPilot
 * Collects, processes, and aggregates performance metrics for production monitoring
 */

import { EventEmitter } from 'events';
import { performance } from 'perf_hooks';
import { getConfig } from '../core/config';
import type { LogContext } from '../utils/logger';
import { logger } from '../utils/logger';
import { getPerformanceMonitor } from '../core/performance-monitor';
import { globalMemoryManager } from '../utils/memory-manager';
import { globalErrorHandler } from '../utils/error-handler';

export interface MetricValue {
  value: number;
  timestamp: number;
  labels?: Record<string, string>;
}

export interface MetricSummary {
  name: string;
  type: MetricType;
  description: string;
  unit: string;
  currentValue: number;
  aggregations: {
    min: number;
    max: number;
    avg: number;
    p50: number;
    p95: number;
    p99: number;
    sum: number;
    count: number;
  };
  labels?: Record<string, string>;
  lastUpdated: number;
}

export interface TimeSeries {
  metric: string;
  values: MetricValue[];
  retention: number; // milliseconds
}

export enum MetricType {
  COUNTER = 'counter',
  GAUGE = 'gauge',
  HISTOGRAM = 'histogram',
  SUMMARY = 'summary',
}

export interface MetricConfig {
  name: string;
  type: MetricType;
  description: string;
  unit: string;
  labels?: string[];
  buckets?: number[]; // For histograms
  retention?: number; // Data retention in milliseconds
  aggregationWindow?: number; // Aggregation window in milliseconds
}

export interface SystemMetrics {
  timestamp: number;
  system: {
    uptime: number;
    memory: {
      total: number;
      used: number;
      free: number;
      heapTotal: number;
      heapUsed: number;
      external: number;
      rss: number;
    };
    cpu: {
      usage: number;
      loadAverage: number[];
    };
    process: {
      pid: number;
      ppid: number;
      platform: string;
      arch: string;
      version: string;
    };
  };
  application: {
    requestsTotal: number;
    requestsPerSecond: number;
    responseTimeMs: {
      avg: number;
      p95: number;
      p99: number;
    };
    errorsTotal: number;
    errorRate: number;
    dataProcessing: {
      rowsProcessed: number;
      filesProcessed: number;
      bytesProcessed: number;
      processingRate: number;
    };
    sections: {
      section1: SectionMetrics;
      section2: SectionMetrics;
      section3: SectionMetrics;
      section4: SectionMetrics;
      section5: SectionMetrics;
      section6: SectionMetrics;
    };
  };
}

export interface SectionMetrics {
  executionCount: number;
  totalDuration: number;
  avgDuration: number;
  maxDuration: number;
  errorCount: number;
  successRate: number;
  lastExecution: number;
}

/**
 * Production metrics collection and aggregation system
 */
export class MetricsCollector extends EventEmitter {
  private static instance: MetricsCollector;
  private metrics: Map<string, TimeSeries> = new Map();
  private configs: Map<string, MetricConfig> = new Map();
  private aggregations: Map<string, MetricSummary> = new Map();
  private isCollecting = false;
  private collectionInterval?: NodeJS.Timeout;
  private aggregationInterval?: NodeJS.Timeout;
  private startTime = Date.now();
  private sectionMetrics: Map<string, SectionMetrics> = new Map();

  // Request tracking
  private requestCount = 0;
  private errorCount = 0;
  private responseTimes: number[] = [];
  private dataProcessingStats = {
    rowsProcessed: 0,
    filesProcessed: 0,
    bytesProcessed: 0,
  };

  private constructor() {
    super();
    this.initializeDefaultMetrics();
    this.initializeSectionMetrics();
  }

  static getInstance(): MetricsCollector {
    if (!MetricsCollector.instance) {
      MetricsCollector.instance = new MetricsCollector();
    }
    return MetricsCollector.instance;
  }

  /**
   * Register a new metric
   */
  registerMetric(config: MetricConfig): void {
    this.configs.set(config.name, {
      retention: 24 * 60 * 60 * 1000, // 24 hours default
      aggregationWindow: 5 * 60 * 1000, // 5 minutes default
      ...config,
    });

    this.metrics.set(config.name, {
      metric: config.name,
      values: [],
      retention: config.retention || 24 * 60 * 60 * 1000,
    });

    logger.debug(`Registered metric: ${config.name} (${config.type})`, {
      operation: 'registerMetric',
    });
  }

  /**
   * Record a metric value
   */
  recordMetric(
    name: string,
    value: number,
    labels?: Record<string, string>,
    timestamp?: number,
  ): void {
    const timeSeries = this.metrics.get(name);
    if (!timeSeries) {
      logger.warn(`Metric '${name}' not registered`, { operation: 'recordMetric' });
      return;
    }

    const metricValue: MetricValue = {
      value,
      timestamp: timestamp || Date.now(),
      labels,
    };

    timeSeries.values.push(metricValue);
    this.emit('metricRecorded', name, metricValue);

    // Clean up old values
    this.cleanupTimeSeries(timeSeries);
  }

  /**
   * Increment a counter metric
   */
  incrementCounter(name: string, amount: number = 1, labels?: Record<string, string>): void {
    const config = this.configs.get(name);
    if (!config || config.type !== MetricType.COUNTER) {
      logger.warn(`Counter '${name}' not found or wrong type`, { operation: 'incrementCounter' });
      return;
    }

    this.recordMetric(name, amount, labels);
  }

  /**
   * Set a gauge metric
   */
  setGauge(name: string, value: number, labels?: Record<string, string>): void {
    const config = this.configs.get(name);
    if (!config || config.type !== MetricType.GAUGE) {
      logger.warn(`Gauge '${name}' not found or wrong type`, { operation: 'setGauge' });
      return;
    }

    this.recordMetric(name, value, labels);
  }

  /**
   * Record a histogram value
   */
  recordHistogram(name: string, value: number, labels?: Record<string, string>): void {
    const config = this.configs.get(name);
    if (!config || config.type !== MetricType.HISTOGRAM) {
      logger.warn(`Histogram '${name}' not found or wrong type`, { operation: 'recordHistogram' });
      return;
    }

    this.recordMetric(name, value, labels);
  }

  /**
   * Record timing information
   */
  recordTiming(name: string, startTime: number, labels?: Record<string, string>): void {
    const duration = performance.now() - startTime;
    this.recordHistogram(name, duration, labels);
  }

  /**
   * Start timing operation
   */
  startTimer(name: string): () => void {
    const startTime = performance.now();
    return (labels?: Record<string, string>) => {
      this.recordTiming(name, startTime, labels);
    };
  }

  /**
   * Record section execution metrics
   */
  recordSectionExecution(
    sectionName: string,
    duration: number,
    success: boolean,
    context?: LogContext,
  ): void {
    const metrics = this.sectionMetrics.get(sectionName) || {
      executionCount: 0,
      totalDuration: 0,
      avgDuration: 0,
      maxDuration: 0,
      errorCount: 0,
      successRate: 100,
      lastExecution: 0,
    };

    metrics.executionCount++;
    metrics.totalDuration += duration;
    metrics.avgDuration = metrics.totalDuration / metrics.executionCount;
    metrics.maxDuration = Math.max(metrics.maxDuration, duration);
    metrics.lastExecution = Date.now();

    if (!success) {
      metrics.errorCount++;
    }

    metrics.successRate =
      ((metrics.executionCount - metrics.errorCount) / metrics.executionCount) * 100;

    this.sectionMetrics.set(sectionName, metrics);

    // Record as standard metrics
    this.recordHistogram('section_duration_ms', duration, { section: sectionName });
    this.incrementCounter('section_executions_total', 1, {
      section: sectionName,
      success: success.toString(),
    });

    logger.debug(
      `Recorded section execution: ${sectionName} (${duration.toFixed(2)}ms, success: ${success})`,
      {
        ...context,
        operation: 'recordSectionExecution',
        section: sectionName,
        duration,
      },
    );
  }

  /**
   * Record data processing metrics
   */
  recordDataProcessing(
    rowsProcessed: number,
    bytesProcessed: number,
    fileProcessed: boolean = false,
  ): void {
    this.dataProcessingStats.rowsProcessed += rowsProcessed;
    this.dataProcessingStats.bytesProcessed += bytesProcessed;

    if (fileProcessed) {
      this.dataProcessingStats.filesProcessed++;
    }

    // Record as standard metrics
    this.incrementCounter('rows_processed_total', rowsProcessed);
    this.incrementCounter('bytes_processed_total', bytesProcessed);
    if (fileProcessed) {
      this.incrementCounter('files_processed_total', 1);
    }

    // Calculate processing rate (rows per second)
    const uptimeSeconds = (Date.now() - this.startTime) / 1000;
    const processingRate = this.dataProcessingStats.rowsProcessed / uptimeSeconds;
    this.setGauge('processing_rate_rows_per_second', processingRate);
  }

  /**
   * Record request metrics
   */
  recordRequest(responseTime: number, success: boolean): void {
    this.requestCount++;
    this.responseTimes.push(responseTime);

    if (!success) {
      this.errorCount++;
    }

    // Keep only recent response times
    if (this.responseTimes.length > 1000) {
      this.responseTimes = this.responseTimes.slice(-1000);
    }

    // Record as standard metrics
    this.incrementCounter('requests_total', 1, { success: success.toString() });
    this.recordHistogram('request_duration_ms', responseTime);

    const errorRate = (this.errorCount / this.requestCount) * 100;
    this.setGauge('error_rate_percent', errorRate);
  }

  /**
   * Get current system metrics
   */
  async getSystemMetrics(): Promise<SystemMetrics> {
    const memoryUsage = process.memoryUsage();
    const uptimeMs = Date.now() - this.startTime;
    const uptimeSeconds = uptimeMs / 1000;

    // Calculate averages
    const avgResponseTime =
      this.responseTimes.length > 0
        ? this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length
        : 0;

    const p95ResponseTime = this.calculatePercentile(this.responseTimes, 0.95);
    const p99ResponseTime = this.calculatePercentile(this.responseTimes, 0.99);

    const requestsPerSecond = uptimeSeconds > 0 ? this.requestCount / uptimeSeconds : 0;
    const errorRate = this.requestCount > 0 ? (this.errorCount / this.requestCount) * 100 : 0;
    const processingRate =
      uptimeSeconds > 0 ? this.dataProcessingStats.rowsProcessed / uptimeSeconds : 0;

    return {
      timestamp: Date.now(),
      system: {
        uptime: uptimeMs,
        memory: {
          total: memoryUsage.heapTotal + memoryUsage.external,
          used: memoryUsage.heapUsed,
          free: memoryUsage.heapTotal - memoryUsage.heapUsed,
          heapTotal: memoryUsage.heapTotal,
          heapUsed: memoryUsage.heapUsed,
          external: memoryUsage.external,
          rss: memoryUsage.rss,
        },
        cpu: {
          usage: process.cpuUsage().user / 1000000, // Convert to seconds
          loadAverage: [],
        },
        process: {
          pid: process.pid,
          ppid: process.ppid || 0,
          platform: process.platform,
          arch: process.arch,
          version: process.version,
        },
      },
      application: {
        requestsTotal: this.requestCount,
        requestsPerSecond,
        responseTimeMs: {
          avg: avgResponseTime,
          p95: p95ResponseTime,
          p99: p99ResponseTime,
        },
        errorsTotal: this.errorCount,
        errorRate,
        dataProcessing: {
          rowsProcessed: this.dataProcessingStats.rowsProcessed,
          filesProcessed: this.dataProcessingStats.filesProcessed,
          bytesProcessed: this.dataProcessingStats.bytesProcessed,
          processingRate,
        },
        sections: {
          section1: this.sectionMetrics.get('section1') || this.getDefaultSectionMetrics(),
          section2: this.sectionMetrics.get('section2') || this.getDefaultSectionMetrics(),
          section3: this.sectionMetrics.get('section3') || this.getDefaultSectionMetrics(),
          section4: this.sectionMetrics.get('section4') || this.getDefaultSectionMetrics(),
          section5: this.sectionMetrics.get('section5') || this.getDefaultSectionMetrics(),
          section6: this.sectionMetrics.get('section6') || this.getDefaultSectionMetrics(),
        },
      },
    };
  }

  /**
   * Get metric summary with aggregations
   */
  getMetricSummary(name: string): MetricSummary | undefined {
    const timeSeries = this.metrics.get(name);
    const config = this.configs.get(name);

    if (!timeSeries || !config) {
      return undefined;
    }

    const values = timeSeries.values.map((v) => v.value);
    if (values.length === 0) {
      return undefined;
    }

    const sortedValues = [...values].sort((a, b) => a - b);
    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;

    return {
      name,
      type: config.type,
      description: config.description,
      unit: config.unit,
      currentValue: values[values.length - 1],
      aggregations: {
        min: Math.min(...values),
        max: Math.max(...values),
        avg,
        p50: this.calculatePercentile(sortedValues, 0.5),
        p95: this.calculatePercentile(sortedValues, 0.95),
        p99: this.calculatePercentile(sortedValues, 0.99),
        sum,
        count: values.length,
      },
      lastUpdated: timeSeries.values[timeSeries.values.length - 1]?.timestamp || 0,
    };
  }

  /**
   * Get all metric summaries
   */
  getAllMetricSummaries(): MetricSummary[] {
    return Array.from(this.configs.keys())
      .map((name) => this.getMetricSummary(name))
      .filter((summary): summary is MetricSummary => summary !== undefined);
  }

  /**
   * Export metrics in Prometheus format
   */
  exportPrometheusMetrics(): string {
    const lines: string[] = [];
    const timestamp = Date.now();

    for (const [name, config] of this.configs.entries()) {
      const summary = this.getMetricSummary(name);
      if (!summary) continue;

      lines.push(`# HELP datapilot_${name} ${config.description}`);
      lines.push(`# TYPE datapilot_${name} ${config.type}`);

      switch (config.type) {
        case MetricType.COUNTER:
        case MetricType.GAUGE:
          lines.push(`datapilot_${name} ${summary.currentValue} ${timestamp}`);
          break;

        case MetricType.HISTOGRAM:
          // Export histogram buckets and summary statistics
          lines.push(`datapilot_${name}_count ${summary.aggregations.count} ${timestamp}`);
          lines.push(`datapilot_${name}_sum ${summary.aggregations.sum} ${timestamp}`);
          lines.push(`datapilot_${name}_avg ${summary.aggregations.avg} ${timestamp}`);
          lines.push(`datapilot_${name}_p95 ${summary.aggregations.p95} ${timestamp}`);
          lines.push(`datapilot_${name}_p99 ${summary.aggregations.p99} ${timestamp}`);
          break;

        case MetricType.SUMMARY:
          lines.push(`datapilot_${name}_count ${summary.aggregations.count} ${timestamp}`);
          lines.push(`datapilot_${name}_sum ${summary.aggregations.sum} ${timestamp}`);
          lines.push(`datapilot_${name}{quantile="0.5"} ${summary.aggregations.p50} ${timestamp}`);
          lines.push(`datapilot_${name}{quantile="0.95"} ${summary.aggregations.p95} ${timestamp}`);
          lines.push(`datapilot_${name}{quantile="0.99"} ${summary.aggregations.p99} ${timestamp}`);
          break;
      }
    }

    return lines.join('\n') + '\n';
  }

  /**
   * Export metrics in JSON format
   */
  exportJSONMetrics(): any {
    return {
      timestamp: Date.now(),
      uptime: Date.now() - this.startTime,
      metrics: this.getAllMetricSummaries(),
      system: {
        requests: {
          total: this.requestCount,
          errors: this.errorCount,
          errorRate: this.requestCount > 0 ? (this.errorCount / this.requestCount) * 100 : 0,
        },
        dataProcessing: this.dataProcessingStats,
        sections: Object.fromEntries(this.sectionMetrics.entries()),
      },
    };
  }

  /**
   * Start automatic metrics collection
   */
  startCollection(intervalMs: number = 30000): void {
    if (this.isCollecting) {
      logger.warn('Metrics collection already started');
      return;
    }

    this.isCollecting = true;
    logger.info(`Starting metrics collection with ${intervalMs}ms interval`);

    // Collect system metrics periodically
    this.collectionInterval = setInterval(async () => {
      try {
        await this.collectSystemMetrics();
      } catch (error) {
        logger.error(
          `Error collecting system metrics: ${error instanceof Error ? error.message : 'Unknown error'}`,
          {
            operation: 'collectSystemMetrics',
            error: error instanceof Error ? error.stack : String(error),
          },
        );
      }
    }, intervalMs);

    // Aggregate metrics less frequently
    this.aggregationInterval = setInterval(() => {
      try {
        this.aggregateMetrics();
      } catch (error) {
        logger.error(
          `Error aggregating metrics: ${error instanceof Error ? error.message : 'Unknown error'}`,
          {
            operation: 'aggregateMetrics',
            error: error instanceof Error ? error.stack : String(error),
          },
        );
      }
    }, intervalMs * 2);
  }

  /**
   * Stop metrics collection
   */
  stopCollection(): void {
    if (!this.isCollecting) {
      return;
    }

    this.isCollecting = false;

    if (this.collectionInterval) {
      clearInterval(this.collectionInterval);
      this.collectionInterval = undefined;
    }

    if (this.aggregationInterval) {
      clearInterval(this.aggregationInterval);
      this.aggregationInterval = undefined;
    }

    logger.info('Metrics collection stopped');
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.metrics.clear();
    this.aggregations.clear();
    this.requestCount = 0;
    this.errorCount = 0;
    this.responseTimes = [];
    this.dataProcessingStats = {
      rowsProcessed: 0,
      filesProcessed: 0,
      bytesProcessed: 0,
    };
    this.sectionMetrics.clear();
    this.startTime = Date.now();
    this.initializeSectionMetrics();
    logger.info('Metrics reset');
  }

  /**
   * Dispose of the metrics collector
   */
  dispose(): void {
    this.stopCollection();
    this.removeAllListeners();
    this.metrics.clear();
    this.configs.clear();
    this.aggregations.clear();
  }

  private async collectSystemMetrics(): Promise<void> {
    // Collect memory metrics
    const memoryUsage = globalMemoryManager.checkMemoryUsage();
    this.setGauge('memory_heap_used_bytes', memoryUsage.heapUsed);
    this.setGauge('memory_heap_total_bytes', memoryUsage.heapTotal);
    this.setGauge('memory_external_bytes', memoryUsage.external);
    this.setGauge('memory_rss_bytes', memoryUsage.rss);

    // Collect performance metrics
    const performanceMonitor = getPerformanceMonitor();
    const performanceSummary = performanceMonitor.getPerformanceSummary();

    if (performanceSummary.currentMetrics) {
      this.setGauge('cpu_usage_seconds', performanceSummary.currentMetrics.cpuTime || 0);
      this.setGauge(
        'processing_rate_rows_per_second',
        performanceSummary.currentMetrics.processingRate || 0,
      );
      this.setGauge(
        'throughput_operations_per_second',
        performanceSummary.currentMetrics.throughput || 0,
      );
    }

    // Collect error metrics
    const errorStats = globalErrorHandler.getStats();
    this.setGauge('errors_total', errorStats.totalErrors);
    this.setGauge('critical_errors_total', errorStats.criticalErrors);
    this.setGauge('recovered_errors_total', errorStats.recoveredErrors);

    this.emit('systemMetricsCollected');
  }

  private aggregateMetrics(): void {
    for (const [name, config] of this.configs.entries()) {
      const summary = this.getMetricSummary(name);
      if (summary) {
        this.aggregations.set(name, summary);
      }
    }

    this.emit('metricsAggregated');
  }

  private cleanupTimeSeries(timeSeries: TimeSeries): void {
    const cutoff = Date.now() - timeSeries.retention;
    timeSeries.values = timeSeries.values.filter((value) => value.timestamp > cutoff);
  }

  private calculatePercentile(sortedValues: number[], percentile: number): number {
    if (sortedValues.length === 0) return 0;

    const index = percentile * (sortedValues.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);

    if (lower === upper) {
      return sortedValues[lower];
    }

    const weight = index - lower;
    return sortedValues[lower] * (1 - weight) + sortedValues[upper] * weight;
  }

  private getDefaultSectionMetrics(): SectionMetrics {
    return {
      executionCount: 0,
      totalDuration: 0,
      avgDuration: 0,
      maxDuration: 0,
      errorCount: 0,
      successRate: 100,
      lastExecution: 0,
    };
  }

  private initializeDefaultMetrics(): void {
    // Counter metrics
    this.registerMetric({
      name: 'requests_total',
      type: MetricType.COUNTER,
      description: 'Total number of requests processed',
      unit: 'requests',
      labels: ['success'],
    });

    this.registerMetric({
      name: 'rows_processed_total',
      type: MetricType.COUNTER,
      description: 'Total number of data rows processed',
      unit: 'rows',
    });

    this.registerMetric({
      name: 'bytes_processed_total',
      type: MetricType.COUNTER,
      description: 'Total number of bytes processed',
      unit: 'bytes',
    });

    this.registerMetric({
      name: 'files_processed_total',
      type: MetricType.COUNTER,
      description: 'Total number of files processed',
      unit: 'files',
    });

    this.registerMetric({
      name: 'section_executions_total',
      type: MetricType.COUNTER,
      description: 'Total number of section executions',
      unit: 'executions',
      labels: ['section', 'success'],
    });

    // Gauge metrics
    this.registerMetric({
      name: 'memory_heap_used_bytes',
      type: MetricType.GAUGE,
      description: 'Current heap memory usage in bytes',
      unit: 'bytes',
    });

    this.registerMetric({
      name: 'memory_heap_total_bytes',
      type: MetricType.GAUGE,
      description: 'Total heap memory available in bytes',
      unit: 'bytes',
    });

    this.registerMetric({
      name: 'memory_external_bytes',
      type: MetricType.GAUGE,
      description: 'External memory usage in bytes',
      unit: 'bytes',
    });

    this.registerMetric({
      name: 'memory_rss_bytes',
      type: MetricType.GAUGE,
      description: 'Resident set size in bytes',
      unit: 'bytes',
    });

    this.registerMetric({
      name: 'cpu_usage_seconds',
      type: MetricType.GAUGE,
      description: 'CPU usage in seconds',
      unit: 'seconds',
    });

    this.registerMetric({
      name: 'processing_rate_rows_per_second',
      type: MetricType.GAUGE,
      description: 'Current data processing rate in rows per second',
      unit: 'rows/second',
    });

    this.registerMetric({
      name: 'throughput_operations_per_second',
      type: MetricType.GAUGE,
      description: 'Current operation throughput per second',
      unit: 'operations/second',
    });

    this.registerMetric({
      name: 'error_rate_percent',
      type: MetricType.GAUGE,
      description: 'Current error rate as percentage',
      unit: 'percent',
    });

    this.registerMetric({
      name: 'errors_total',
      type: MetricType.GAUGE,
      description: 'Total number of errors encountered',
      unit: 'errors',
    });

    this.registerMetric({
      name: 'critical_errors_total',
      type: MetricType.GAUGE,
      description: 'Total number of critical errors',
      unit: 'errors',
    });

    this.registerMetric({
      name: 'recovered_errors_total',
      type: MetricType.GAUGE,
      description: 'Total number of recovered errors',
      unit: 'errors',
    });

    // Histogram metrics
    this.registerMetric({
      name: 'request_duration_ms',
      type: MetricType.HISTOGRAM,
      description: 'Request duration in milliseconds',
      unit: 'milliseconds',
      buckets: [1, 5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000],
    });

    this.registerMetric({
      name: 'section_duration_ms',
      type: MetricType.HISTOGRAM,
      description: 'Section execution duration in milliseconds',
      unit: 'milliseconds',
      labels: ['section'],
      buckets: [10, 50, 100, 500, 1000, 5000, 10000, 30000, 60000],
    });

    logger.info('Default metrics registered', { operation: 'initializeDefaultMetrics' });
  }

  private initializeSectionMetrics(): void {
    const sections = ['section1', 'section2', 'section3', 'section4', 'section5', 'section6'];

    sections.forEach((section) => {
      this.sectionMetrics.set(section, this.getDefaultSectionMetrics());
    });
  }
}

/**
 * Global metrics collector instance
 */
export const globalMetricsCollector = MetricsCollector.getInstance();

/**
 * Metrics collection utilities
 */
export class MetricsUtils {
  /**
   * Create a timing decorator for automatic duration tracking
   */
  static timing(metricName: string, labels?: Record<string, string>) {
    return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
      const method = descriptor.value;

      descriptor.value = async function (...args: any[]) {
        const endTimer = globalMetricsCollector.startTimer(metricName);

        try {
          const result = await method.apply(this, args);
          endTimer();
          return result;
        } catch (error) {
          endTimer();
          throw error;
        }
      };
    };
  }

  /**
   * Create a counter decorator for automatic counting
   */
  static counter(metricName: string, labels?: Record<string, string>) {
    return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
      const method = descriptor.value;

      descriptor.value = async function (...args: any[]) {
        try {
          const result = await method.apply(this, args);
          globalMetricsCollector.incrementCounter(metricName, 1, { ...labels, success: 'true' });
          return result;
        } catch (error) {
          globalMetricsCollector.incrementCounter(metricName, 1, { ...labels, success: 'false' });
          throw error;
        }
      };
    };
  }

  /**
   * Create metrics for data processing operations
   */
  static recordDataOperation(
    operationType: string,
    rowCount: number,
    byteCount: number,
    duration: number,
    success: boolean,
  ): void {
    globalMetricsCollector.recordDataProcessing(rowCount, byteCount, operationType === 'file');
    globalMetricsCollector.recordHistogram('data_operation_duration_ms', duration, {
      operation: operationType,
      success: success.toString(),
    });
    globalMetricsCollector.incrementCounter('data_operations_total', 1, {
      operation: operationType,
      success: success.toString(),
    });
  }
}
