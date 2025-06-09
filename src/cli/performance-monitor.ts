/**
 * Performance monitoring for DataPilot CLI
 * Tracks memory usage, CPU, throughput, and other metrics
 */

import { performance } from 'perf_hooks';
import { cpuUsage, memoryUsage } from 'process';
import * as os from 'os';

export interface PerformanceMetrics {
  timestamp: number;
  memory: {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
  };
  cpu: {
    user: number;
    system: number;
    percent: number;
  };
  throughput?: {
    rowsPerSecond: number;
    bytesPerSecond: number;
  };
  phase?: {
    name: string;
    metrics: {
      duration: number;
      memoryDelta: number;
      cpuTime: number;
      rowsProcessed?: number;
    };
  };
}

export interface PerformanceReport {
  summary: {
    totalDuration: number;
    peakMemoryMB: number;
    avgMemoryMB: number;
    avgCpuPercent: number;
    totalRowsProcessed: number;
    avgThroughput: number;
  };
  phases: {
    [phase: string]: {
      duration: number;
      memoryDelta: number;
      cpuTime: number;
      rowsProcessed?: number;
    };
  };
  warnings: string[];
  timeline: PerformanceMetrics[];
}

export class PerformanceMonitor {
  private startTime: number = 0;
  private metrics: PerformanceMetrics[] = [];
  private phaseMarkers: Map<string, { start: number; startMetrics: PerformanceMetrics }> =
    new Map();
  private monitoringInterval?: NodeJS.Timeout;
  private lastCpuUsage?: NodeJS.CpuUsage;
  private totalRowsProcessed: number = 0;
  private enabled: boolean;
  private sampleInterval: number;
  private memoryThreshold: number;

  constructor(
    options: {
      enabled?: boolean;
      sampleInterval?: number;
      memoryThreshold?: number;
    } = {},
  ) {
    this.enabled = options.enabled ?? true;
    this.sampleInterval = options.sampleInterval ?? 100; // ms
    this.memoryThreshold = options.memoryThreshold ?? 0.8; // 80% of available memory
  }

  /**
   * Start performance monitoring
   */
  start(): void {
    if (!this.enabled) return;

    this.startTime = performance.now();
    this.lastCpuUsage = cpuUsage();
    this.metrics = [];

    // Take initial reading
    this.collectMetrics();

    // Start periodic monitoring
    this.monitoringInterval = setInterval(() => {
      this.collectMetrics();
      this.checkThresholds();
    }, this.sampleInterval);
  }

  /**
   * Stop performance monitoring
   */
  stop(): PerformanceReport {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }

    // Take final reading
    this.collectMetrics();

    return this.generateReport();
  }

  /**
   * Mark the start of a phase
   */
  startPhase(phaseName: string): void {
    if (!this.enabled) return;

    const currentMetrics = this.getCurrentMetrics();
    this.phaseMarkers.set(phaseName, {
      start: performance.now(),
      startMetrics: currentMetrics,
    });
  }

  /**
   * Mark the end of a phase
   */
  endPhase(phaseName: string, rowsProcessed?: number): void {
    if (!this.enabled) return;

    const phaseData = this.phaseMarkers.get(phaseName);
    if (!phaseData) return;

    const endMetrics = this.getCurrentMetrics();
    const duration = performance.now() - phaseData.start;

    if (rowsProcessed) {
      this.totalRowsProcessed += rowsProcessed;
    }

    // Store phase metrics for report
    const phaseMetrics = {
      duration,
      memoryDelta: endMetrics.memory.heapUsed - phaseData.startMetrics.memory.heapUsed,
      cpuTime:
        endMetrics.cpu.user +
        endMetrics.cpu.system -
        (phaseData.startMetrics.cpu.user + phaseData.startMetrics.cpu.system),
      rowsProcessed,
    };

    // We'll store these in the metrics array with phase markers
    this.metrics.push({
      ...endMetrics,
      phase: { name: phaseName, metrics: phaseMetrics },
    } as any);
  }

  /**
   * Update row processing count
   */
  updateRowCount(rows: number): void {
    this.totalRowsProcessed += rows;
  }

  /**
   * Collect current performance metrics
   */
  private collectMetrics(): void {
    const currentMetrics = this.getCurrentMetrics();
    this.metrics.push(currentMetrics);
  }

  /**
   * Get current performance metrics
   */
  private getCurrentMetrics(): PerformanceMetrics {
    const mem = memoryUsage();
    const cpu = this.getCpuUsage();

    return {
      timestamp: performance.now() - this.startTime,
      memory: {
        heapUsed: mem.heapUsed,
        heapTotal: mem.heapTotal,
        external: mem.external,
        rss: mem.rss,
      },
      cpu,
      throughput: this.calculateThroughput(),
    };
  }

  /**
   * Calculate CPU usage percentage
   */
  private getCpuUsage(): PerformanceMetrics['cpu'] {
    const usage = cpuUsage();
    let percent = 0;

    if (this.lastCpuUsage && this.metrics.length > 0) {
      const userDelta = usage.user - this.lastCpuUsage.user;
      const systemDelta = usage.system - this.lastCpuUsage.system;
      const timeDelta = (performance.now() - this.startTime) * 1000; // Convert to microseconds

      percent = ((userDelta + systemDelta) / timeDelta) * 100;
    }

    this.lastCpuUsage = usage;

    return {
      user: usage.user / 1000000, // Convert to seconds
      system: usage.system / 1000000,
      percent: Math.min(percent, 100 * os.cpus().length), // Cap at number of CPUs * 100
    };
  }

  /**
   * Calculate current throughput
   */
  private calculateThroughput(): PerformanceMetrics['throughput'] | undefined {
    if (this.totalRowsProcessed === 0 || this.metrics.length === 0) {
      return undefined;
    }

    const duration = (performance.now() - this.startTime) / 1000; // seconds
    const rowsPerSecond = this.totalRowsProcessed / duration;

    // Estimate bytes per second (rough approximation)
    const avgRowSize = 100; // bytes (estimate)
    const bytesPerSecond = rowsPerSecond * avgRowSize;

    return {
      rowsPerSecond: Math.round(rowsPerSecond),
      bytesPerSecond: Math.round(bytesPerSecond),
    };
  }

  /**
   * Check performance thresholds and emit warnings
   */
  private checkThresholds(): void {
    const currentMetrics = this.metrics[this.metrics.length - 1];
    if (!currentMetrics) return;

    const totalMemory = os.totalmem();
    const memoryUsagePercent = currentMetrics.memory.rss / totalMemory;

    if (memoryUsagePercent > this.memoryThreshold) {
      console.warn(
        `⚠️  High memory usage: ${(memoryUsagePercent * 100).toFixed(1)}% of system memory`,
      );
    }

    // Check if memory is growing rapidly
    if (this.metrics.length > 10) {
      const recentMetrics = this.metrics.slice(-10);
      const memoryGrowth = recentMetrics[9].memory.heapUsed - recentMetrics[0].memory.heapUsed;
      const timeSpan = recentMetrics[9].timestamp - recentMetrics[0].timestamp;
      const growthRate = memoryGrowth / timeSpan; // bytes per ms

      if (growthRate > 1000000) {
        // 1MB per ms
        console.warn(`⚠️  Rapid memory growth detected: ${(growthRate / 1000000).toFixed(1)} MB/s`);
      }
    }
  }

  /**
   * Generate performance report
   */
  private generateReport(): PerformanceReport {
    const duration = performance.now() - this.startTime;
    const warnings: string[] = [];

    // Calculate summary metrics
    const memoryMetrics = this.metrics.map((m) => m.memory.heapUsed);
    const cpuMetrics = this.metrics.map((m) => m.cpu.percent);

    const peakMemoryMB = Math.max(...memoryMetrics) / 1024 / 1024;
    const avgMemoryMB =
      memoryMetrics.reduce((a, b) => a + b, 0) / memoryMetrics.length / 1024 / 1024;
    const avgCpuPercent = cpuMetrics.reduce((a, b) => a + b, 0) / cpuMetrics.length;

    // Check for performance issues
    if (peakMemoryMB > 1024) {
      warnings.push(`Peak memory usage exceeded 1GB: ${peakMemoryMB.toFixed(0)}MB`);
    }

    if (avgCpuPercent > 80) {
      warnings.push(`High average CPU usage: ${avgCpuPercent.toFixed(1)}%`);
    }

    // Extract phase information
    const phases: PerformanceReport['phases'] = {};
    this.metrics.forEach((metric) => {
      if (metric.phase) {
        phases[metric.phase.name] = metric.phase.metrics;
      }
    });

    return {
      summary: {
        totalDuration: duration,
        peakMemoryMB,
        avgMemoryMB,
        avgCpuPercent,
        totalRowsProcessed: this.totalRowsProcessed,
        avgThroughput: this.totalRowsProcessed / (duration / 1000),
      },
      phases,
      warnings,
      timeline: this.metrics,
    };
  }

  /**
   * Format performance report for display
   */
  static formatReport(report: PerformanceReport): string {
    const lines: string[] = [];

    lines.push('📊 Performance Report');
    lines.push('='.repeat(50));

    lines.push('\n📈 Summary:');
    lines.push(`   Total Duration: ${(report.summary.totalDuration / 1000).toFixed(2)}s`);
    lines.push(`   Peak Memory: ${report.summary.peakMemoryMB.toFixed(1)} MB`);
    lines.push(`   Avg Memory: ${report.summary.avgMemoryMB.toFixed(1)} MB`);
    lines.push(`   Avg CPU: ${report.summary.avgCpuPercent.toFixed(1)}%`);
    lines.push(`   Rows Processed: ${report.summary.totalRowsProcessed.toLocaleString()}`);
    lines.push(`   Throughput: ${report.summary.avgThroughput.toFixed(0)} rows/s`);

    if (Object.keys(report.phases).length > 0) {
      lines.push('\n⏱️  Phase Breakdown:');
      for (const [phase, metrics] of Object.entries(report.phases)) {
        lines.push(`   ${phase}:`);
        lines.push(`      Duration: ${(metrics.duration / 1000).toFixed(2)}s`);
        lines.push(`      Memory Δ: ${(metrics.memoryDelta / 1024 / 1024).toFixed(1)} MB`);
        if (metrics.rowsProcessed) {
          lines.push(`      Rows: ${metrics.rowsProcessed.toLocaleString()}`);
        }
      }
    }

    if (report.warnings.length > 0) {
      lines.push('\n⚠️  Warnings:');
      report.warnings.forEach((warning) => {
        lines.push(`   • ${warning}`);
      });
    }

    return lines.join('\n');
  }
}

// Export types
// Types are already exported above
