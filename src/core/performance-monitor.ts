/**
 * Performance Monitoring and Adaptive Thresholds System
 * Provides real-time performance tracking and dynamic configuration adjustment
 */

import { getConfig, type DataPilotConfig } from './config';
import { logger } from '../utils/logger';

export interface PerformanceMetrics {
  timestamp: number;
  memoryUsageMB: number;
  heapUsedMB: number;
  heapTotalMB: number;
  externalMB: number;
  rss: number;
  cpuTime?: number;
  processingRate?: number; // rows/second
  throughput?: number; // operations/second
}

export interface PerformanceAlert {
  type: 'memory' | 'cpu' | 'throughput' | 'error_rate';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  metrics: PerformanceMetrics;
  recommendation: string;
  timestamp: number;
}

export interface AdaptiveThreshold {
  name: string;
  currentValue: number;
  defaultValue: number;
  adaptedValue: number;
  lastAdjustment: number;
  adjustmentReason: string;
}

/**
 * Performance Monitor with Adaptive Configuration Management
 */
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetrics[] = [];
  private alerts: PerformanceAlert[] = [];
  private adaptiveThresholds: Map<string, AdaptiveThreshold> = new Map();
  private monitoringInterval?: NodeJS.Timeout;
  private isMonitoring = false;

  // Performance tracking
  private startTime: number = 0;
  private operationCount = 0;
  private rowsProcessed = 0;
  private errorsEncountered = 0;

  // Adaptive configuration
  private autoAdaptEnabled = true;
  private adaptationHistory: Array<{
    timestamp: number;
    threshold: string;
    oldValue: number;
    newValue: number;
    reason: string;
  }> = [];

  private constructor() {
    this.initializeAdaptiveThresholds();
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Initialize adaptive thresholds with default values
   */
  private initializeAdaptiveThresholds(): void {
    const config = getConfig().getConfig();

    const thresholds = [
      { name: 'maxRows', value: config.performance.maxRows },
      { name: 'chunkSize', value: config.performance.chunkSize },
      { name: 'memoryThresholdMB', value: config.streaming.memoryThresholdMB },
      { name: 'maxCorrelationPairs', value: config.analysis.maxCorrelationPairs },
      { name: 'significanceLevel', value: config.statistical.significanceLevel },
      { name: 'samplingThreshold', value: config.analysis.samplingThreshold },
    ];

    thresholds.forEach(({ name, value }) => {
      this.adaptiveThresholds.set(name, {
        name,
        currentValue: value,
        defaultValue: value,
        adaptedValue: value,
        lastAdjustment: Date.now(),
        adjustmentReason: 'Initial value',
      });
    });
  }

  /**
   * Start performance monitoring
   */
  startMonitoring(intervalMs: number = 5000): void {
    if (this.isMonitoring) {
      return;
    }

    this.isMonitoring = true;
    this.startTime = Date.now();

    this.monitoringInterval = setInterval(() => {
      this.collectMetrics();
      this.analyzePerformance();
      this.adaptThresholds();
    }, intervalMs);

    logger.info('Performance monitoring started');
  }

  /**
   * Stop performance monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }
    this.isMonitoring = false;
    logger.info('Performance monitoring stopped');
  }

  /**
   * Collect current performance metrics
   */
  private collectMetrics(): void {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    const metrics: PerformanceMetrics = {
      timestamp: Date.now(),
      memoryUsageMB: Math.round(memUsage.heapUsed / (1024 * 1024)),
      heapUsedMB: Math.round(memUsage.heapUsed / (1024 * 1024)),
      heapTotalMB: Math.round(memUsage.heapTotal / (1024 * 1024)),
      externalMB: Math.round(memUsage.external / (1024 * 1024)),
      rss: Math.round(memUsage.rss / (1024 * 1024)),
      cpuTime: (cpuUsage.user + cpuUsage.system) / 1000000, // Convert to seconds
    };

    // Calculate processing rates
    const elapsedSeconds = (Date.now() - this.startTime) / 1000;
    if (elapsedSeconds > 0) {
      metrics.processingRate = this.rowsProcessed / elapsedSeconds;
      metrics.throughput = this.operationCount / elapsedSeconds;
    }

    this.metrics.push(metrics);

    // Keep only last 100 metrics
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }
  }

  /**
   * Analyze performance and generate alerts
   */
  private analyzePerformance(): void {
    if (this.metrics.length === 0) return;

    const currentMetrics = this.metrics[this.metrics.length - 1];
    const config = getConfig().getConfig();

    // Memory usage alerts
    if (currentMetrics.memoryUsageMB > config.streaming.memoryThresholdMB * 0.9) {
      this.createAlert({
        type: 'memory',
        severity:
          currentMetrics.memoryUsageMB > config.streaming.memoryThresholdMB ? 'critical' : 'high',
        message: `High memory usage: ${currentMetrics.memoryUsageMB}MB`,
        metrics: currentMetrics,
        recommendation: 'Consider reducing chunk size or enabling more aggressive memory cleanup',
        timestamp: Date.now(),
      });
    }

    // Throughput degradation alerts
    if (this.metrics.length >= 5) {
      const recentMetrics = this.metrics.slice(-5);
      const avgThroughput =
        recentMetrics.reduce((sum, m) => sum + (m.throughput || 0), 0) / recentMetrics.length;
      const firstThroughput = recentMetrics[0].throughput || 0;

      if (firstThroughput > 0 && avgThroughput < firstThroughput * 0.5) {
        this.createAlert({
          type: 'throughput',
          severity: 'medium',
          message: `Throughput degraded by ${Math.round((1 - avgThroughput / firstThroughput) * 100)}%`,
          metrics: currentMetrics,
          recommendation: 'Performance may be degrading due to memory pressure or CPU load',
          timestamp: Date.now(),
        });
      }
    }

    // Error rate monitoring
    const errorRate = this.operationCount > 0 ? this.errorsEncountered / this.operationCount : 0;
    if (errorRate > 0.05) {
      // 5% error rate threshold
      this.createAlert({
        type: 'error_rate',
        severity: errorRate > 0.2 ? 'critical' : 'high',
        message: `High error rate: ${(errorRate * 100).toFixed(1)}%`,
        metrics: currentMetrics,
        recommendation: 'Check data quality or reduce processing complexity',
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Adaptively adjust thresholds based on performance
   */
  private adaptThresholds(): void {
    if (!this.autoAdaptEnabled || this.metrics.length < 3) {
      return;
    }

    const currentMetrics = this.metrics[this.metrics.length - 1];
    const config = getConfig();

    // Memory-based adaptations
    if (currentMetrics.memoryUsageMB > config.getStreamingConfig().memoryThresholdMB * 0.8) {
      // Reduce chunk size for memory efficiency
      this.adaptThreshold(
        'chunkSize',
        (current) => Math.max(1000, Math.floor(current * 0.8)),
        'High memory usage detected',
      );

      // Reduce correlation pairs
      this.adaptThreshold(
        'maxCorrelationPairs',
        (current) => Math.max(20, Math.floor(current * 0.8)),
        'Memory optimization',
      );
    } else if (currentMetrics.memoryUsageMB < config.getStreamingConfig().memoryThresholdMB * 0.3) {
      // Increase processing capacity when memory is available
      this.adaptThreshold(
        'chunkSize',
        (current) => Math.min(32768, Math.floor(current * 1.2)),
        'Low memory usage - increasing efficiency',
      );
    }

    // Throughput-based adaptations
    if (currentMetrics.processingRate && currentMetrics.processingRate < 1000) {
      // Less than 1K rows/sec
      this.adaptThreshold(
        'significanceLevel',
        (current) => Math.min(0.1, current * 1.5),
        'Low throughput - relaxing statistical rigor',
      );

      this.adaptThreshold(
        'samplingThreshold',
        (current) => Math.max(1000, Math.floor(current * 0.7)),
        'Low throughput - increasing sampling',
      );
    }

    // Apply adaptations to configuration
    this.applyAdaptiveConfiguration();
  }

  /**
   * Adapt a specific threshold
   */
  private adaptThreshold(
    name: string,
    adaptFunction: (current: number) => number,
    reason: string,
  ): void {
    const threshold = this.adaptiveThresholds.get(name);
    if (!threshold) return;

    const newValue = adaptFunction(threshold.currentValue);
    if (newValue !== threshold.currentValue) {
      this.adaptationHistory.push({
        timestamp: Date.now(),
        threshold: name,
        oldValue: threshold.currentValue,
        newValue,
        reason,
      });

      threshold.adaptedValue = newValue;
      threshold.currentValue = newValue;
      threshold.lastAdjustment = Date.now();
      threshold.adjustmentReason = reason;

      logger.info(`Adapted ${name}: ${threshold.adaptedValue} (${reason})`);
    }
  }

  /**
   * Apply adaptive configuration to the global config
   */
  private applyAdaptiveConfiguration(): void {
    const configManager = getConfig();
    const adaptiveUpdates: Partial<DataPilotConfig> = {};

    // Apply performance adaptations
    const chunkSize = this.adaptiveThresholds.get('chunkSize');
    const memoryThreshold = this.adaptiveThresholds.get('memoryThresholdMB');
    if (chunkSize || memoryThreshold) {
      const baseConfig = configManager.getConfig();
      adaptiveUpdates.performance = { ...baseConfig.performance };
      if (chunkSize) {
        adaptiveUpdates.performance.chunkSize = chunkSize.currentValue;
      }
    }

    // Apply streaming adaptations
    if (memoryThreshold) {
      const baseConfig = configManager.getConfig();
      adaptiveUpdates.streaming = {
        ...baseConfig.streaming,
        memoryThresholdMB: memoryThreshold.currentValue,
      };
    }

    // Apply analysis adaptations
    const maxCorrelationPairs = this.adaptiveThresholds.get('maxCorrelationPairs');
    const samplingThreshold = this.adaptiveThresholds.get('samplingThreshold');
    if (maxCorrelationPairs || samplingThreshold) {
      const baseConfig = configManager.getConfig();
      adaptiveUpdates.analysis = { ...baseConfig.analysis };
      if (maxCorrelationPairs) {
        adaptiveUpdates.analysis.maxCorrelationPairs = maxCorrelationPairs.currentValue;
      }
      if (samplingThreshold) {
        adaptiveUpdates.analysis.samplingThreshold = samplingThreshold.currentValue;
      }
    }

    // Apply statistical adaptations
    const significanceLevel = this.adaptiveThresholds.get('significanceLevel');
    if (significanceLevel) {
      const baseConfig = configManager.getConfig();
      adaptiveUpdates.statistical = {
        ...baseConfig.statistical,
        significanceLevel: significanceLevel.currentValue,
      };
    }

    if (Object.keys(adaptiveUpdates).length > 0) {
      configManager.updateConfig(adaptiveUpdates);
    }
  }

  /**
   * Create a performance alert
   */
  private createAlert(alert: PerformanceAlert): void {
    this.alerts.push(alert);

    // Keep only last 50 alerts
    if (this.alerts.length > 50) {
      this.alerts = this.alerts.slice(-50);
    }

    // Log critical alerts
    if (alert.severity === 'critical' || alert.severity === 'high') {
      logger.warn(`Performance Alert [${alert.severity.toUpperCase()}]: ${alert.message}`);
    }
  }

  /**
   * Record operation metrics
   */
  recordOperation(type: 'row' | 'operation' | 'error', count: number = 1): void {
    switch (type) {
      case 'row':
        this.rowsProcessed += count;
        break;
      case 'operation':
        this.operationCount += count;
        break;
      case 'error':
        this.errorsEncountered += count;
        break;
    }
  }

  /**
   * Get current performance summary
   */
  getPerformanceSummary(): {
    currentMetrics: PerformanceMetrics | null;
    recentAlerts: PerformanceAlert[];
    adaptiveThresholds: AdaptiveThreshold[];
    adaptationHistory: typeof this.adaptationHistory;
    operationalMetrics: {
      rowsProcessed: number;
      operationCount: number;
      errorsEncountered: number;
      errorRate: number;
      elapsedTimeMs: number;
    };
  } {
    const currentMetrics = this.metrics.length > 0 ? this.metrics[this.metrics.length - 1] : null;
    const recentAlerts = this.alerts.slice(-10);
    const adaptiveThresholds = Array.from(this.adaptiveThresholds.values());

    return {
      currentMetrics,
      recentAlerts,
      adaptiveThresholds,
      adaptationHistory: [...this.adaptationHistory],
      operationalMetrics: {
        rowsProcessed: this.rowsProcessed,
        operationCount: this.operationCount,
        errorsEncountered: this.errorsEncountered,
        errorRate: this.operationCount > 0 ? this.errorsEncountered / this.operationCount : 0,
        elapsedTimeMs: Date.now() - this.startTime,
      },
    };
  }

  /**
   * Reset monitoring state
   */
  reset(): void {
    this.metrics = [];
    this.alerts = [];
    this.adaptationHistory = [];
    this.startTime = Date.now();
    this.operationCount = 0;
    this.rowsProcessed = 0;
    this.errorsEncountered = 0;
    this.initializeAdaptiveThresholds();
  }

  /**
   * Enable/disable auto-adaptation
   */
  setAutoAdaptation(enabled: boolean): void {
    this.autoAdaptEnabled = enabled;
    logger.info(`Auto-adaptation ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Get adaptive threshold value
   */
  getAdaptiveThreshold(name: string): number | undefined {
    return this.adaptiveThresholds.get(name)?.currentValue;
  }

  /**
   * Manually adjust threshold
   */
  setThreshold(name: string, value: number, reason: string = 'Manual adjustment'): void {
    const threshold = this.adaptiveThresholds.get(name);
    if (threshold) {
      this.adaptThreshold(name, () => value, reason);
      this.applyAdaptiveConfiguration();
    }
  }
}

/**
 * Convenience function to get performance monitor instance
 */
export function getPerformanceMonitor(): PerformanceMonitor {
  return PerformanceMonitor.getInstance();
}

/**
 * Performance monitoring decorator for methods
 */
export function monitorPerformance(
  target: unknown,
  propertyName: string,
  descriptor: PropertyDescriptor,
): void {
  const method = descriptor.value;
  descriptor.value = function (...args: unknown[]): unknown {
    const monitor = getPerformanceMonitor();

    try {
      monitor.recordOperation('operation');
      const result = method.apply(this, args) as unknown;

      // Handle async methods
      if (result && typeof result === 'object' && 'then' in result && typeof (result as any).then === 'function') {
        return (result as Promise<unknown>).catch((error: Error) => {
          monitor.recordOperation('error');
          throw error;
        });
      }

      return result;
    } catch (error) {
      monitor.recordOperation('error');
      throw error;
    }
  };
}

/**
 * System resource detection for adaptive configuration
 */
export class ResourceDetector {
  /**
   * Detect available system resources
   */
  static detectSystemResources(): {
    availableMemoryMB: number;
    totalMemoryMB: number;
    cpuCores: number;
    recommendedConfig: Partial<DataPilotConfig>;
  } {
    const memUsage = process.memoryUsage();
    const totalMemoryMB = Math.round(memUsage.rss / (1024 * 1024));
    const availableMemoryMB = Math.round(
      (process.memoryUsage().heapTotal - process.memoryUsage().heapUsed) / (1024 * 1024),
    );

    // Estimate total system memory (rough approximation)
    const estimatedTotalMemoryMB = totalMemoryMB * 4; // Assuming process uses ~25% of system memory

    let recommendedConfig: Partial<DataPilotConfig> = {};

    // Low memory system (< 1GB available)
    if (availableMemoryMB < 1024) {
      recommendedConfig = {
        performance: {
          maxRows: 50000,
          maxFieldSize: 512 * 1024,
          memoryThresholdBytes: 256 * 1024 * 1024, // 256MB
          chunkSize: 8 * 1024,
          sampleSize: 512 * 1024,
          adaptiveChunkSizing: true,
          maxCollectedRowsMultivariate: 500,
          batchSize: 100,
          performanceMonitoringInterval: 10,
          memoryCleanupInterval: 20,
          emergencyMemoryThresholdMultiplier: 1.5,
        },
        streaming: {
          memoryThresholdMB: 50,
          maxRowsAnalyzed: 50000,
          adaptiveChunkSizing: {
            enabled: true,
            minChunkSize: 50,
            maxChunkSize: 1000,
            reductionFactor: 0.5,
            expansionFactor: 1.1,
            targetMemoryUtilization: 0.7,
          },
          memoryManagement: {
            cleanupInterval: 10,
            emergencyThresholdMultiplier: 1.2,
            forceGarbageCollection: true,
            gcFrequency: 500,
            memoryLeakDetection: true,
            autoGarbageCollect: true,
          },
        },
        analysis: {
          maxCategoricalLevels: 20,
          maxCorrelationPairs: 20,
          samplingThreshold: 5000,
          outlierMethods: ['iqr'],
          normalityTests: ['shapiro'],
          enableMultivariate: false,
          enabledAnalyses: ['univariate'],
          highCardinalityThreshold: 80,
          missingValueQualityThreshold: 20,
          multivariateThreshold: 500,
          maxDimensionsForPCA: 3,
          clusteringMethods: ['kmeans'],
        },
      };
    }
    // Medium memory system (1-4GB available)
    else if (availableMemoryMB < 4096) {
      const configManager = getConfig();
      const baseConfig = configManager.getConfig();
      recommendedConfig = {
        performance: {
          ...baseConfig.performance,
          maxRows: 200000,
          chunkSize: 32 * 1024,
          batchSize: 500,
          maxCollectedRowsMultivariate: 1000,
          memoryThresholdBytes: 512 * 1024 * 1024, // 512MB
        },
        streaming: {
          ...baseConfig.streaming,
          memoryThresholdMB: 100,
          maxRowsAnalyzed: 200000,
        },
        analysis: {
          ...baseConfig.analysis,
          maxCorrelationPairs: 50,
          samplingThreshold: 10000,
        },
      };
    }
    // High memory system (4GB+ available)
    else {
      const configManager = getConfig();
      const baseConfig = configManager.getConfig();
      recommendedConfig = {
        performance: {
          ...baseConfig.performance,
          maxRows: 1000000,
          chunkSize: 64 * 1024,
          batchSize: 1000,
          maxCollectedRowsMultivariate: 2000,
          memoryThresholdBytes: 1024 * 1024 * 1024, // 1GB
        },
        streaming: {
          ...baseConfig.streaming,
          memoryThresholdMB: 200,
          maxRowsAnalyzed: 1000000,
        },
        analysis: {
          ...baseConfig.analysis,
          maxCorrelationPairs: 100,
          samplingThreshold: 20000,
        },
      };
    }

    return {
      availableMemoryMB,
      totalMemoryMB: estimatedTotalMemoryMB,
      cpuCores: 1, // Node.js doesn't easily expose this
      recommendedConfig,
    };
  }
}
