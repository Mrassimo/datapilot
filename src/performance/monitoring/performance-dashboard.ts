/**
 * Performance Monitoring Dashboard
 * Real-time performance monitoring and metrics visualization
 */

import { EventEmitter } from 'events';
import { logger } from '../../utils/logger';
import { DataPilotError, ErrorSeverity, ErrorCategory } from '../../core/types';

export interface DashboardMetrics {
  system: SystemMetrics;
  performance: PerformanceMetrics;
  errorReduction: ErrorReductionMetrics;
  formatOptimizers: FormatOptimizerMetrics;
  trends: TrendMetrics;
  alerts: AlertMetrics[];
}

export interface SystemMetrics {
  timestamp: number;
  uptime: number;
  memoryUsage: {
    used: number;
    free: number;
    total: number;
    percentage: number;
  };
  cpuUsage: {
    user: number;
    system: number;
    idle: number;
    percentage: number;
  };
  nodeVersion: string;
  platform: string;
}

export interface PerformanceMetrics {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  averageExecutionTime: number;
  throughputPerSecond: number;
  memoryEfficiency: number;
  parallelWorkers: {
    active: number;
    idle: number;
    total: number;
  };
  streaming: {
    activeStreams: number;
    totalBytesProcessed: number;
    averageStreamingSpeed: number;
  };
}

export interface ErrorReductionMetrics {
  circuitBreakers: {
    total: number;
    open: number;
    halfOpen: number;
    closed: number;
    overallHealth: number;
  };
  resourceLeaks: {
    tracked: number;
    potential: number;
    cleaned: number;
    efficiency: number;
  };
  errorRecovery: {
    totalErrors: number;
    recovered: number;
    recoveryRate: number;
    averageRecoveryTime: number;
  };
  inputValidation: {
    totalValidations: number;
    passed: number;
    failed: number;
    successRate: number;
  };
}

export interface FormatOptimizerMetrics {
  parquet: {
    filesProcessed: number;
    rowsProcessed: number;
    compressionRatio: number;
    columnarEfficiency: number;
  };
  excel: {
    filesProcessed: number;
    worksheetsProcessed: number;
    streamingEfficiency: number;
    memoryOptimization: number;
  };
  json: {
    filesProcessed: number;
    recordsProcessed: number;
    schemaDetected: number;
    validationRate: number;
  };
}

export interface TrendMetrics {
  performance: number[]; // Last 60 data points
  memory: number[];
  errors: number[];
  throughput: number[];
  timeWindow: number; // Minutes
}

export interface AlertMetrics {
  id: string;
  type: 'warning' | 'error' | 'critical';
  message: string;
  timestamp: number;
  component: string;
  resolved: boolean;
  threshold?: number;
  currentValue?: number;
}

export interface DashboardConfig {
  updateInterval: number; // Milliseconds
  historySize: number; // Number of data points to keep
  alertThresholds: AlertThresholds;
  enableRealTimeUpdates: boolean;
  enableTrendAnalysis: boolean;
  enablePredictiveAlerts: boolean;
}

export interface AlertThresholds {
  memoryUsage: number; // Percentage
  cpuUsage: number; // Percentage
  errorRate: number; // Percentage
  responseTime: number; // Milliseconds
  throughputDrop: number; // Percentage
  circuitBreakerHealth: number; // Percentage
}

/**
 * Real-time performance monitoring dashboard
 */
export class PerformanceDashboard extends EventEmitter {
  private config: DashboardConfig;
  private metrics: DashboardMetrics;
  private metricsHistory: DashboardMetrics[] = [];
  private updateTimer: NodeJS.Timeout | null = null;
  private alerts: Map<string, AlertMetrics> = new Map();
  private isRunning = false;
  private startTime = Date.now();

  constructor(config: Partial<DashboardConfig> = {}) {
    super();
    
    this.config = {
      updateInterval: config.updateInterval ?? 5000, // 5 seconds
      historySize: config.historySize ?? 60, // 1 hour of 1-minute data
      enableRealTimeUpdates: config.enableRealTimeUpdates ?? true,
      enableTrendAnalysis: config.enableTrendAnalysis ?? true,
      enablePredictiveAlerts: config.enablePredictiveAlerts ?? true,
      alertThresholds: {
        memoryUsage: 85,
        cpuUsage: 80,
        errorRate: 5,
        responseTime: 5000,
        throughputDrop: 20,
        circuitBreakerHealth: 70,
        ...config.alertThresholds
      }
    };

    this.metrics = this.initializeMetrics();
    
    logger.info('Performance dashboard initialized', {
      component: 'PerformanceDashboard',
      updateInterval: this.config.updateInterval
    });
  }

  /**
   * Start the performance monitoring dashboard
   */
  start(): void {
    if (this.isRunning) {
      logger.warn('Performance dashboard already running');
      return;
    }

    this.isRunning = true;
    this.startTime = Date.now();
    
    if (this.config.enableRealTimeUpdates) {
      this.updateTimer = setInterval(() => {
        this.updateMetrics();
      }, this.config.updateInterval);
    }

    // Initial metrics collection
    this.updateMetrics();
    
    logger.info('Performance dashboard started', {
      component: 'PerformanceDashboard'
    });
    
    this.emit('started');
  }

  /**
   * Stop the performance monitoring dashboard
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = null;
    }
    
    logger.info('Performance dashboard stopped', {
      component: 'PerformanceDashboard'
    });
    
    this.emit('stopped');
  }

  /**
   * Get current dashboard metrics
   */
  getCurrentMetrics(): DashboardMetrics {
    if (this.config.enableRealTimeUpdates || !this.isRunning) {
      this.updateMetrics();
    }
    
    return { ...this.metrics };
  }

  /**
   * Get metrics history for trend analysis
   */
  getMetricsHistory(minutes?: number): DashboardMetrics[] {
    const count = minutes ? Math.min(minutes, this.metricsHistory.length) : this.metricsHistory.length;
    return this.metricsHistory.slice(-count);
  }

  /**
   * Get current alerts
   */
  getActiveAlerts(): AlertMetrics[] {
    return Array.from(this.alerts.values()).filter(alert => !alert.resolved);
  }

  /**
   * Get performance summary report
   */
  getPerformanceSummary(): any {
    const current = this.getCurrentMetrics();
    const history = this.getMetricsHistory(60); // Last hour
    
    return {
      current: {
        system: current.system,
        performance: current.performance,
        alerts: current.alerts.filter(a => !a.resolved).length
      },
      trends: this.calculateTrends(history),
      recommendations: this.generateRecommendations(current, history),
      healthScore: this.calculateHealthScore(current)
    };
  }

  /**
   * Update all metrics
   */
  private updateMetrics(): void {
    try {
      const newMetrics: DashboardMetrics = {
        system: this.collectSystemMetrics(),
        performance: this.collectPerformanceMetrics(),
        errorReduction: this.collectErrorReductionMetrics(),
        formatOptimizers: this.collectFormatOptimizerMetrics(),
        trends: this.calculateCurrentTrends(),
        alerts: Array.from(this.alerts.values())
      };

      // Check for alerts
      this.checkAlerts(newMetrics);
      
      // Update metrics
      this.metrics = newMetrics;
      
      // Add to history
      this.metricsHistory.push({ ...newMetrics });
      
      // Trim history if needed
      if (this.metricsHistory.length > this.config.historySize) {
        this.metricsHistory = this.metricsHistory.slice(-this.config.historySize);
      }
      
      // Emit metrics update
      this.emit('metrics-updated', newMetrics);
      
    } catch (error) {
      logger.error('Failed to update dashboard metrics', {
        component: 'PerformanceDashboard',
        error: (error as Error).message
      });
    }
  }

  /**
   * Collect system metrics
   */
  private collectSystemMetrics(): SystemMetrics {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    // Get system memory info (approximate)
    const totalMemory = memUsage.heapTotal + memUsage.external + (50 * 1024 * 1024); // Estimate
    const usedMemory = memUsage.heapUsed + memUsage.external;
    
    return {
      timestamp: Date.now(),
      uptime: Date.now() - this.startTime,
      memoryUsage: {
        used: usedMemory,
        free: totalMemory - usedMemory,
        total: totalMemory,
        percentage: (usedMemory / totalMemory) * 100
      },
      cpuUsage: {
        user: cpuUsage.user,
        system: cpuUsage.system,
        idle: 0, // Not available in Node.js
        percentage: ((cpuUsage.user + cpuUsage.system) / 1000000) * 100 // Convert to percentage estimate
      },
      nodeVersion: process.version,
      platform: process.platform
    };
  }

  /**
   * Collect performance metrics
   */
  private collectPerformanceMetrics(): PerformanceMetrics {
    try {
      // Try to get metrics from global components
      let parallelStats = { totalWorkers: 0, availableWorkers: 0, busyWorkers: 0 };
      let memoryStats = { pressure: { level: 0 } };
      
      try {
        const { getGlobalWorkerPool } = require('../worker-pool');
        const workerPool = getGlobalWorkerPool();
        if (workerPool) {
          parallelStats = workerPool.getStats();
        }
      } catch (error) {
        // Worker pool not initialized
      }
      
      try {
        const { getGlobalMemoryOptimizer } = require('../memory-optimizer');
        const memoryOptimizer = getGlobalMemoryOptimizer();
        if (memoryOptimizer) {
          memoryStats = memoryOptimizer.getDetailedStats();
        }
      } catch (error) {
        // Memory optimizer not initialized
      }

      return {
        totalOperations: this.calculateTotalOperations(),
        successfulOperations: this.calculateSuccessfulOperations(),
        failedOperations: this.calculateFailedOperations(),
        averageExecutionTime: this.calculateAverageExecutionTime(),
        throughputPerSecond: this.calculateThroughput(),
        memoryEfficiency: 1 - memoryStats.pressure.level,
        parallelWorkers: {
          active: parallelStats.busyWorkers || 0,
          idle: parallelStats.availableWorkers || 0,
          total: parallelStats.totalWorkers || 0
        },
        streaming: {
          activeStreams: this.calculateActiveStreams(),
          totalBytesProcessed: this.calculateTotalBytesProcessed(),
          averageStreamingSpeed: this.calculateStreamingSpeed()
        }
      };
      
    } catch (error) {
      logger.warn('Error collecting performance metrics', {
        component: 'PerformanceDashboard',
        error: (error as Error).message
      });
      
      return {
        totalOperations: 0,
        successfulOperations: 0,
        failedOperations: 0,
        averageExecutionTime: 0,
        throughputPerSecond: 0,
        memoryEfficiency: 1,
        parallelWorkers: { active: 0, idle: 0, total: 0 },
        streaming: { activeStreams: 0, totalBytesProcessed: 0, averageStreamingSpeed: 0 }
      };
    }
  }

  /**
   * Collect error reduction metrics
   */
  private collectErrorReductionMetrics(): ErrorReductionMetrics {
    try {
      let circuitBreakerStats = { overallHealth: 100, openBreakers: 0, totalBreakers: 0 };
      let resourceStats = { totalTracked: 0, potentialLeaks: 0 };
      let errorHandlerStats = { totalErrors: 0, recoverySuccessRate: 1, averageRecoveryTime: 0 };
      
      try {
        const { getGlobalCircuitBreakerManager } = require('../circuit-breaker');
        const circuitManager = getGlobalCircuitBreakerManager();
        if (circuitManager) {
          circuitBreakerStats = circuitManager.getSystemHealth();
        }
      } catch (error) {
        // Circuit breaker not initialized
      }
      
      try {
        const { getGlobalResourceLeakDetector } = require('../resource-leak-detector');
        const leakDetector = getGlobalResourceLeakDetector();
        if (leakDetector) {
          resourceStats = leakDetector.getResourceStats();
        }
      } catch (error) {
        // Resource leak detector not initialized
      }
      
      try {
        const { getGlobalEnhancedErrorHandler } = require('../../utils/enhanced-error-handler');
        const errorHandler = getGlobalEnhancedErrorHandler();
        if (errorHandler) {
          errorHandlerStats = errorHandler.getMetrics();
        }
      } catch (error) {
        // Error handler not initialized
      }

      return {
        circuitBreakers: {
          total: circuitBreakerStats.totalBreakers,
          open: circuitBreakerStats.openBreakers,
          halfOpen: 0, // Not available in current implementation
          closed: circuitBreakerStats.totalBreakers - circuitBreakerStats.openBreakers,
          overallHealth: circuitBreakerStats.overallHealth
        },
        resourceLeaks: {
          tracked: resourceStats.totalTracked,
          potential: resourceStats.potentialLeaks,
          cleaned: resourceStats.totalTracked - resourceStats.potentialLeaks,
          efficiency: resourceStats.totalTracked > 0 ? 
            ((resourceStats.totalTracked - resourceStats.potentialLeaks) / resourceStats.totalTracked) * 100 : 100
        },
        errorRecovery: {
          totalErrors: errorHandlerStats.totalErrors,
          recovered: Math.floor(errorHandlerStats.totalErrors * errorHandlerStats.recoverySuccessRate),
          recoveryRate: errorHandlerStats.recoverySuccessRate * 100,
          averageRecoveryTime: errorHandlerStats.averageRecoveryTime
        },
        inputValidation: {
          totalValidations: this.calculateTotalValidations(),
          passed: this.calculatePassedValidations(),
          failed: this.calculateFailedValidations(),
          successRate: this.calculateValidationSuccessRate()
        }
      };
      
    } catch (error) {
      logger.warn('Error collecting error reduction metrics', {
        component: 'PerformanceDashboard',
        error: (error as Error).message
      });
      
      return {
        circuitBreakers: { total: 0, open: 0, halfOpen: 0, closed: 0, overallHealth: 100 },
        resourceLeaks: { tracked: 0, potential: 0, cleaned: 0, efficiency: 100 },
        errorRecovery: { totalErrors: 0, recovered: 0, recoveryRate: 100, averageRecoveryTime: 0 },
        inputValidation: { totalValidations: 0, passed: 0, failed: 0, successRate: 100 }
      };
    }
  }

  /**
   * Collect format optimizer metrics
   */
  private collectFormatOptimizerMetrics(): FormatOptimizerMetrics {
    try {
      let parquetMetrics = { rowsProcessed: 0, columnsRead: 0, compressionRatio: 1, memoryEfficiency: 1 };
      let excelMetrics = { worksheetsProcessed: 0, rowsProcessed: 0, streamingEfficiency: 1, memoryPeakMB: 0 };
      let jsonMetrics = { recordsProcessed: 0, schemasDetected: 0, validationErrors: 0, schemaConsistency: 1 };
      
      try {
        const { getGlobalParquetOptimizer } = require('../format-optimizers/parquet-optimizer');
        const parquetOptimizer = getGlobalParquetOptimizer();
        if (parquetOptimizer) {
          parquetMetrics = parquetOptimizer.getMetrics();
        }
      } catch (error) {
        // Parquet optimizer not initialized
      }
      
      try {
        const { getGlobalExcelOptimizer } = require('../format-optimizers/excel-optimizer');
        const excelOptimizer = getGlobalExcelOptimizer();
        if (excelOptimizer) {
          excelMetrics = excelOptimizer.getMetrics();
        }
      } catch (error) {
        // Excel optimizer not initialized
      }
      
      try {
        const { getGlobalJsonOptimizer } = require('../format-optimizers/json-optimizer');
        const jsonOptimizer = getGlobalJsonOptimizer();
        if (jsonOptimizer) {
          jsonMetrics = jsonOptimizer.getMetrics();
        }
      } catch (error) {
        // JSON optimizer not initialized
      }

      return {
        parquet: {
          filesProcessed: 0, // Not tracked in current implementation
          rowsProcessed: parquetMetrics.rowsProcessed,
          compressionRatio: parquetMetrics.compressionRatio,
          columnarEfficiency: parquetMetrics.memoryEfficiency
        },
        excel: {
          filesProcessed: 0, // Not tracked in current implementation
          worksheetsProcessed: excelMetrics.worksheetsProcessed,
          streamingEfficiency: excelMetrics.streamingEfficiency,
          memoryOptimization: excelMetrics.memoryPeakMB > 0 ? (1 - (excelMetrics.memoryPeakMB / 512)) * 100 : 100
        },
        json: {
          filesProcessed: 0, // Not tracked in current implementation
          recordsProcessed: jsonMetrics.recordsProcessed,
          schemaDetected: jsonMetrics.schemasDetected,
          validationRate: jsonMetrics.schemaConsistency * 100
        }
      };
      
    } catch (error) {
      logger.warn('Error collecting format optimizer metrics', {
        component: 'PerformanceDashboard',
        error: (error as Error).message
      });
      
      return {
        parquet: { filesProcessed: 0, rowsProcessed: 0, compressionRatio: 1, columnarEfficiency: 100 },
        excel: { filesProcessed: 0, worksheetsProcessed: 0, streamingEfficiency: 100, memoryOptimization: 100 },
        json: { filesProcessed: 0, recordsProcessed: 0, schemaDetected: 0, validationRate: 100 }
      };
    }
  }

  /**
   * Calculate current trends
   */
  private calculateCurrentTrends(): TrendMetrics {
    const historyWindow = Math.min(60, this.metricsHistory.length);
    const recentHistory = this.metricsHistory.slice(-historyWindow);
    
    return {
      performance: recentHistory.map(m => m.performance.throughputPerSecond),
      memory: recentHistory.map(m => m.system.memoryUsage.percentage),
      errors: recentHistory.map(m => m.performance.failedOperations),
      throughput: recentHistory.map(m => m.performance.throughputPerSecond),
      timeWindow: historyWindow
    };
  }

  /**
   * Check for alerts based on thresholds
   */
  private checkAlerts(metrics: DashboardMetrics): void {
    const thresholds = this.config.alertThresholds;
    
    // Memory usage alert
    if (metrics.system.memoryUsage.percentage > thresholds.memoryUsage) {
      this.createAlert('memory-usage', 'warning', 
        `High memory usage: ${metrics.system.memoryUsage.percentage.toFixed(1)}%`,
        'System', thresholds.memoryUsage, metrics.system.memoryUsage.percentage);
    } else {
      this.resolveAlert('memory-usage');
    }
    
    // CPU usage alert
    if (metrics.system.cpuUsage.percentage > thresholds.cpuUsage) {
      this.createAlert('cpu-usage', 'warning',
        `High CPU usage: ${metrics.system.cpuUsage.percentage.toFixed(1)}%`,
        'System', thresholds.cpuUsage, metrics.system.cpuUsage.percentage);
    } else {
      this.resolveAlert('cpu-usage');
    }
    
    // Error rate alert
    const errorRate = metrics.performance.totalOperations > 0 ? 
      (metrics.performance.failedOperations / metrics.performance.totalOperations) * 100 : 0;
    
    if (errorRate > thresholds.errorRate) {
      this.createAlert('error-rate', 'error',
        `High error rate: ${errorRate.toFixed(1)}%`,
        'Performance', thresholds.errorRate, errorRate);
    } else {
      this.resolveAlert('error-rate');
    }
    
    // Circuit breaker health alert
    if (metrics.errorReduction.circuitBreakers.overallHealth < thresholds.circuitBreakerHealth) {
      this.createAlert('circuit-breaker-health', 'warning',
        `Circuit breaker health degraded: ${metrics.errorReduction.circuitBreakers.overallHealth.toFixed(1)}%`,
        'ErrorReduction', thresholds.circuitBreakerHealth, metrics.errorReduction.circuitBreakers.overallHealth);
    } else {
      this.resolveAlert('circuit-breaker-health');
    }
    
    // Response time alert
    if (metrics.performance.averageExecutionTime > thresholds.responseTime) {
      this.createAlert('response-time', 'warning',
        `High response time: ${metrics.performance.averageExecutionTime.toFixed(0)}ms`,
        'Performance', thresholds.responseTime, metrics.performance.averageExecutionTime);
    } else {
      this.resolveAlert('response-time');
    }
  }

  /**
   * Create or update an alert
   */
  private createAlert(
    id: string,
    type: 'warning' | 'error' | 'critical',
    message: string,
    component: string,
    threshold?: number,
    currentValue?: number
  ): void {
    const existingAlert = this.alerts.get(id);
    
    if (!existingAlert || existingAlert.resolved) {
      const alert: AlertMetrics = {
        id,
        type,
        message,
        timestamp: Date.now(),
        component,
        resolved: false,
        threshold,
        currentValue
      };
      
      this.alerts.set(id, alert);
      this.emit('alert-created', alert);
      
      logger.warn(`Alert created: ${message}`, {
        component: 'PerformanceDashboard',
        alertType: type,
        alertComponent: component
      });
    }
  }

  /**
   * Resolve an alert
   */
  private resolveAlert(id: string): void {
    const alert = this.alerts.get(id);
    
    if (alert && !alert.resolved) {
      alert.resolved = true;
      this.emit('alert-resolved', alert);
      
      logger.info(`Alert resolved: ${alert.message}`, {
        component: 'PerformanceDashboard',
        alertType: alert.type
      });
    }
  }

  /**
   * Calculate trends from history
   */
  private calculateTrends(history: DashboardMetrics[]): any {
    if (history.length < 2) {
      return { performance: 'stable', memory: 'stable', errors: 'stable' };
    }
    
    const recent = history.slice(-10); // Last 10 data points
    const older = history.slice(-20, -10); // Previous 10 data points
    
    const avgRecentPerf = recent.reduce((sum, m) => sum + m.performance.throughputPerSecond, 0) / recent.length;
    const avgOlderPerf = older.length > 0 ? older.reduce((sum, m) => sum + m.performance.throughputPerSecond, 0) / older.length : avgRecentPerf;
    
    const avgRecentMem = recent.reduce((sum, m) => sum + m.system.memoryUsage.percentage, 0) / recent.length;
    const avgOlderMem = older.length > 0 ? older.reduce((sum, m) => sum + m.system.memoryUsage.percentage, 0) / older.length : avgRecentMem;
    
    const avgRecentErrors = recent.reduce((sum, m) => sum + m.performance.failedOperations, 0) / recent.length;
    const avgOlderErrors = older.length > 0 ? older.reduce((sum, m) => sum + m.performance.failedOperations, 0) / older.length : avgRecentErrors;
    
    return {
      performance: this.getTrendDirection(avgRecentPerf, avgOlderPerf),
      memory: this.getTrendDirection(avgRecentMem, avgOlderMem, true), // Higher memory is worse
      errors: this.getTrendDirection(avgRecentErrors, avgOlderErrors, true) // More errors is worse
    };
  }

  /**
   * Get trend direction
   */
  private getTrendDirection(recent: number, older: number, inverse = false): string {
    const threshold = 0.1; // 10% change threshold
    const change = (recent - older) / Math.max(older, 1);
    
    if (Math.abs(change) < threshold) {
      return 'stable';
    }
    
    if (inverse) {
      return change > 0 ? 'worsening' : 'improving';
    } else {
      return change > 0 ? 'improving' : 'worsening';
    }
  }

  /**
   * Generate performance recommendations
   */
  private generateRecommendations(current: DashboardMetrics, history: DashboardMetrics[]): string[] {
    const recommendations: string[] = [];
    
    // Memory recommendations
    if (current.system.memoryUsage.percentage > 80) {
      recommendations.push('Consider increasing memory limits or optimizing memory usage');
    }
    
    // Performance recommendations
    if (current.performance.averageExecutionTime > 3000) {
      recommendations.push('High response times detected - consider parallel processing optimization');
    }
    
    // Error reduction recommendations
    if (current.errorReduction.circuitBreakers.overallHealth < 80) {
      recommendations.push('Circuit breaker health is degraded - review failing operations');
    }
    
    if (current.errorReduction.resourceLeaks.potential > 5) {
      recommendations.push('Resource leaks detected - review resource cleanup patterns');
    }
    
    // Format optimizer recommendations
    if (current.formatOptimizers.excel.streamingEfficiency < 0.8) {
      recommendations.push('Excel processing efficiency is low - consider reducing batch sizes');
    }
    
    if (current.formatOptimizers.json.validationRate < 90) {
      recommendations.push('JSON validation rate is low - review schema consistency');
    }
    
    return recommendations;
  }

  /**
   * Calculate overall health score
   */
  private calculateHealthScore(metrics: DashboardMetrics): number {
    let score = 100;
    
    // Memory impact
    score -= Math.max(0, metrics.system.memoryUsage.percentage - 70) * 0.5;
    
    // Error impact
    const errorRate = metrics.performance.totalOperations > 0 ? 
      (metrics.performance.failedOperations / metrics.performance.totalOperations) * 100 : 0;
    score -= errorRate * 2;
    
    // Circuit breaker impact
    score -= Math.max(0, 100 - metrics.errorReduction.circuitBreakers.overallHealth) * 0.3;
    
    // Resource leak impact
    score -= metrics.errorReduction.resourceLeaks.potential * 2;
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Helper methods for metric calculations
   * These would typically pull from actual component statistics
   */
  private calculateTotalOperations(): number {
    // This would aggregate from all components
    return 0;
  }

  private calculateSuccessfulOperations(): number {
    return 0;
  }

  private calculateFailedOperations(): number {
    return 0;
  }

  private calculateAverageExecutionTime(): number {
    return 0;
  }

  private calculateThroughput(): number {
    return 0;
  }

  private calculateActiveStreams(): number {
    return 0;
  }

  private calculateTotalBytesProcessed(): number {
    return 0;
  }

  private calculateStreamingSpeed(): number {
    return 0;
  }

  private calculateTotalValidations(): number {
    return 0;
  }

  private calculatePassedValidations(): number {
    return 0;
  }

  private calculateFailedValidations(): number {
    return 0;
  }

  private calculateValidationSuccessRate(): number {
    const total = this.calculateTotalValidations();
    const passed = this.calculatePassedValidations();
    return total > 0 ? (passed / total) * 100 : 100;
  }

  /**
   * Initialize empty metrics structure
   */
  private initializeMetrics(): DashboardMetrics {
    return {
      system: {
        timestamp: Date.now(),
        uptime: 0,
        memoryUsage: { used: 0, free: 0, total: 0, percentage: 0 },
        cpuUsage: { user: 0, system: 0, idle: 0, percentage: 0 },
        nodeVersion: process.version,
        platform: process.platform
      },
      performance: {
        totalOperations: 0,
        successfulOperations: 0,
        failedOperations: 0,
        averageExecutionTime: 0,
        throughputPerSecond: 0,
        memoryEfficiency: 1,
        parallelWorkers: { active: 0, idle: 0, total: 0 },
        streaming: { activeStreams: 0, totalBytesProcessed: 0, averageStreamingSpeed: 0 }
      },
      errorReduction: {
        circuitBreakers: { total: 0, open: 0, halfOpen: 0, closed: 0, overallHealth: 100 },
        resourceLeaks: { tracked: 0, potential: 0, cleaned: 0, efficiency: 100 },
        errorRecovery: { totalErrors: 0, recovered: 0, recoveryRate: 100, averageRecoveryTime: 0 },
        inputValidation: { totalValidations: 0, passed: 0, failed: 0, successRate: 100 }
      },
      formatOptimizers: {
        parquet: { filesProcessed: 0, rowsProcessed: 0, compressionRatio: 1, columnarEfficiency: 100 },
        excel: { filesProcessed: 0, worksheetsProcessed: 0, streamingEfficiency: 100, memoryOptimization: 100 },
        json: { filesProcessed: 0, recordsProcessed: 0, schemaDetected: 0, validationRate: 100 }
      },
      trends: {
        performance: [],
        memory: [],
        errors: [],
        throughput: [],
        timeWindow: 0
      },
      alerts: []
    };
  }

  /**
   * Cleanup and shutdown
   */
  async shutdown(): Promise<void> {
    this.stop();
    this.removeAllListeners();
    this.alerts.clear();
    this.metricsHistory = [];
    
    logger.info('Performance dashboard shutdown', {
      component: 'PerformanceDashboard'
    });
  }
}

/**
 * Global dashboard instance
 */
let globalDashboard: PerformanceDashboard | null = null;

/**
 * Get or create global performance dashboard
 */
export function getGlobalPerformanceDashboard(config?: Partial<DashboardConfig>): PerformanceDashboard {
  if (!globalDashboard) {
    globalDashboard = new PerformanceDashboard(config);
  }
  return globalDashboard;
}

/**
 * Shutdown global performance dashboard
 */
export async function shutdownGlobalPerformanceDashboard(): Promise<void> {
  if (globalDashboard) {
    await globalDashboard.shutdown();
    globalDashboard = null;
  }
}