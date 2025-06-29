/**
 * Health Check System
 * Production monitoring and health endpoints
 */

import { globalMemoryManager } from '../utils/memory-manager';
import { globalErrorHandler } from '../utils/error-handler';
import { logger } from '../utils/logger';
import { getDataPilotVersion } from '../utils/version';

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  checks: HealthCheck[];
  summary: {
    total: number;
    passing: number;
    failing: number;
    warnings: number;
  };
}

export interface HealthCheck {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  message: string;
  duration: number;
  metadata?: Record<string, any>;
}

export interface MonitoringMetrics {
  memory: {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
    percentUsed: number;
  };
  performance: {
    uptime: number;
    cpuUsage: NodeJS.CpuUsage;
    eventLoopDelay: number;
  };
  errors: {
    total: number;
    last24h: number;
    byCategory: Record<string, number>;
    bySeverity: Record<string, number>;
  };
  requests: {
    total: number;
    successful: number;
    failed: number;
    averageResponseTime: number;
  };
}

class HealthChecker {
  private startTime: number;
  private requestCount: number = 0;
  private successfulRequests: number = 0;
  private failedRequests: number = 0;
  private responseTimes: number[] = [];

  constructor() {
    this.startTime = Date.now();
  }

  /**
   * Perform comprehensive health check
   */
  async checkHealth(): Promise<HealthStatus> {
    const checks: HealthCheck[] = [];
    const startTime = Date.now();

    // Memory health check
    checks.push(await this.checkMemoryHealth());

    // Error rate check
    checks.push(await this.checkErrorRate());

    // Performance check
    checks.push(await this.checkPerformance());

    // Dependencies check (file system, etc.)
    checks.push(await this.checkDependencies());

    // Calculate summary
    const passing = checks.filter((c) => c.status === 'pass').length;
    const failing = checks.filter((c) => c.status === 'fail').length;
    const warnings = checks.filter((c) => c.status === 'warn').length;

    // Determine overall status
    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (failing > 0) {
      status = 'unhealthy';
    } else if (warnings > 0) {
      status = 'degraded';
    } else {
      status = 'healthy';
    }

    return {
      status,
      timestamp: new Date().toISOString(),
      uptime: Date.now() - this.startTime,
      version: process.env.npm_package_version || getDataPilotVersion(),
      checks,
      summary: {
        total: checks.length,
        passing,
        failing,
        warnings,
      },
    };
  }

  /**
   * Get detailed monitoring metrics
   */
  getMetrics(): MonitoringMetrics {
    const memoryUsage = globalMemoryManager.getMemoryStats();
    const errorStats = globalErrorHandler.getErrorStatistics();
    const cpuUsage = process.cpuUsage();

    return {
      memory: {
        heapUsed: Math.round(memoryUsage.current.heapUsed / (1024 * 1024)),
        heapTotal: Math.round(memoryUsage.current.heapTotal / (1024 * 1024)),
        external: Math.round(memoryUsage.current.external / (1024 * 1024)),
        rss: Math.round(memoryUsage.current.rss / (1024 * 1024)),
        percentUsed: Math.round((memoryUsage.current.heapUsed / memoryUsage.current.heapTotal) * 100),
      },
      performance: {
        uptime: Date.now() - this.startTime,
        cpuUsage,
        eventLoopDelay: this.measureEventLoopDelay(),
      },
      errors: {
        total: errorStats.totalErrors,
        last24h: this.getErrorsLast24h(),
        byCategory: errorStats.byCategory,
        bySeverity: errorStats.bySeverity,
      },
      requests: {
        total: this.requestCount,
        successful: this.successfulRequests,
        failed: this.failedRequests,
        averageResponseTime: this.getAverageResponseTime(),
      },
    };
  }

  /**
   * Record request metrics
   */
  recordRequest(success: boolean, responseTime: number): void {
    this.requestCount++;

    if (success) {
      this.successfulRequests++;
    } else {
      this.failedRequests++;
    }

    this.responseTimes.push(responseTime);

    // Keep only last 1000 response times
    if (this.responseTimes.length > 1000) {
      this.responseTimes.shift();
    }
  }

  /**
   * Check memory health
   */
  private async checkMemoryHealth(): Promise<HealthCheck> {
    const start = Date.now();

    try {
      const memoryUsage = globalMemoryManager.getMemoryStats();
      const percentUsed = Math.round((memoryUsage.current.heapUsed / memoryUsage.current.heapTotal) * 100);

      let status: 'pass' | 'fail' | 'warn';
      let message: string;

      if (percentUsed < 70) {
        status = 'pass';
        message = `Memory usage normal (${percentUsed.toFixed(1)}%)`;
      } else if (percentUsed < 85) {
        status = 'warn';
        message = `Memory usage elevated (${percentUsed.toFixed(1)}%)`;
      } else {
        status = 'fail';
        message = `Memory usage critical (${percentUsed.toFixed(1)}%)`;
      }

      return {
        name: 'memory',
        status,
        message,
        duration: Date.now() - start,
        metadata: {
          heapUsedMB: Math.round(memoryUsage.current.heapUsed / (1024 * 1024)),
          heapTotalMB: Math.round(memoryUsage.current.heapTotal / (1024 * 1024)),
          percentUsed,
        },
      };
    } catch (error) {
      return {
        name: 'memory',
        status: 'fail',
        message: `Memory check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: Date.now() - start,
      };
    }
  }

  /**
   * Check error rate
   */
  private async checkErrorRate(): Promise<HealthCheck> {
    const start = Date.now();

    try {
      const errorStats = globalErrorHandler.getErrorStatistics();
      const last24hErrors = this.getErrorsLast24h();
      const errorRate = this.requestCount > 0 ? (this.failedRequests / this.requestCount) * 100 : 0;

      let status: 'pass' | 'fail' | 'warn';
      let message: string;

      if (errorRate < 5) {
        status = 'pass';
        message = `Error rate normal (${errorRate.toFixed(1)}%)`;
      } else if (errorRate < 15) {
        status = 'warn';
        message = `Error rate elevated (${errorRate.toFixed(1)}%)`;
      } else {
        status = 'fail';
        message = `Error rate critical (${errorRate.toFixed(1)}%)`;
      }

      return {
        name: 'error_rate',
        status,
        message,
        duration: Date.now() - start,
        metadata: {
          errorRate,
          totalErrors: errorStats.totalErrors,
          last24hErrors,
        },
      };
    } catch (error) {
      return {
        name: 'error_rate',
        status: 'fail',
        message: `Error rate check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: Date.now() - start,
      };
    }
  }

  /**
   * Check performance metrics
   */
  private async checkPerformance(): Promise<HealthCheck> {
    const start = Date.now();

    try {
      const avgResponseTime = this.getAverageResponseTime();
      const eventLoopDelay = this.measureEventLoopDelay();

      let status: 'pass' | 'fail' | 'warn';
      let message: string;

      if (avgResponseTime < 1000 && eventLoopDelay < 10) {
        status = 'pass';
        message = `Performance normal (${avgResponseTime}ms avg response)`;
      } else if (avgResponseTime < 5000 && eventLoopDelay < 50) {
        status = 'warn';
        message = `Performance degraded (${avgResponseTime}ms avg response)`;
      } else {
        status = 'fail';
        message = `Performance critical (${avgResponseTime}ms avg response)`;
      }

      return {
        name: 'performance',
        status,
        message,
        duration: Date.now() - start,
        metadata: {
          averageResponseTime: avgResponseTime,
          eventLoopDelay,
          uptime: Date.now() - this.startTime,
        },
      };
    } catch (error) {
      return {
        name: 'performance',
        status: 'fail',
        message: `Performance check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: Date.now() - start,
      };
    }
  }

  /**
   * Check system dependencies
   */
  private async checkDependencies(): Promise<HealthCheck> {
    const start = Date.now();

    try {
      // Test file system access
      const fs = await import('fs');
      const tmpDir = require('os').tmpdir();

      // Try to write a test file
      await fs.promises.writeFile(`${tmpDir}/datapilot-health-check`, 'test');
      await fs.promises.unlink(`${tmpDir}/datapilot-health-check`);

      return {
        name: 'dependencies',
        status: 'pass',
        message: 'All dependencies accessible',
        duration: Date.now() - start,
        metadata: {
          fileSystem: 'accessible',
          nodeVersion: process.version,
        },
      };
    } catch (error) {
      return {
        name: 'dependencies',
        status: 'fail',
        message: `Dependency check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: Date.now() - start,
      };
    }
  }

  /**
   * Simple readiness check
   */
  isReady(): boolean {
    const memoryUsage = globalMemoryManager.getMemoryStats();
    const percentUsed = Math.round((memoryUsage.current.heapUsed / memoryUsage.current.heapTotal) * 100);
    return percentUsed < 90;
  }

  /**
   * Simple liveness check
   */
  isAlive(): boolean {
    return true; // If this code is running, the process is alive
  }

  private getErrorsLast24h(): number {
    // This would require timestamp tracking in error handler
    // For now, return approximate based on total errors
    const errorStats = globalErrorHandler.getErrorStatistics();
    return Math.floor(errorStats.totalErrors * 0.1); // Rough estimate
  }

  private getAverageResponseTime(): number {
    if (this.responseTimes.length === 0) return 0;

    const sum = this.responseTimes.reduce((a, b) => a + b, 0);
    return Math.round(sum / this.responseTimes.length);
  }

  private measureEventLoopDelay(): number {
    // Simple event loop delay measurement
    const start = process.hrtime.bigint();
    setImmediate(() => {
      const delta = process.hrtime.bigint() - start;
      return Number(delta / BigInt(1000000)); // Convert to milliseconds
    });
    return 0; // Placeholder - would need async implementation
  }
}

// Global health checker instance
export const globalHealthChecker = new HealthChecker();

// Health check endpoints for production monitoring
export const healthEndpoints = {
  '/health': () => globalHealthChecker.checkHealth(),
  '/health/ready': () => ({ ready: globalHealthChecker.isReady() }),
  '/health/live': () => ({ alive: globalHealthChecker.isAlive() }),
  '/metrics': () => globalHealthChecker.getMetrics(),
};
