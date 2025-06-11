/**
 * Resource Leak Detection System
 * Monitors and prevents resource leaks in the application
 */

import { EventEmitter } from 'events';
import { performance } from 'perf_hooks';
import { logger } from '../utils/logger';

interface ResourceTracker {
  id: string;
  type: string;
  createdAt: number;
  stackTrace: string;
  metadata?: any;
  isReleased: boolean;
  releasedAt?: number;
}

interface LeakDetectionOptions {
  trackingEnabled?: boolean;
  maxAge?: number; // Max age before considering leaked (ms)
  checkInterval?: number; // How often to check for leaks (ms)
  maxResources?: number; // Max tracked resources before warning
  enableStackTrace?: boolean;
  resourceTypes?: string[]; // Types to track
}

export interface LeakReport {
  resourceType: string;
  leakedCount: number;
  oldestLeak: {
    id: string;
    age: number;
    stackTrace?: string;
  };
  totalMemoryImpact: number;
  recommendations: string[];
}

export class ResourceLeakDetector extends EventEmitter {
  private trackedResources = new Map<string, ResourceTracker>();
  private resourceCounts = new Map<string, number>();
  private leakCheckTimer?: NodeJS.Timeout;
  private options: Required<LeakDetectionOptions>;
  private startTime = Date.now();

  constructor(options: LeakDetectionOptions = {}) {
    super();

    this.options = {
      trackingEnabled: options.trackingEnabled ?? true,
      maxAge: options.maxAge || 300000, // 5 minutes
      checkInterval: options.checkInterval || 30000, // 30 seconds
      maxResources: options.maxResources || 10000,
      enableStackTrace: options.enableStackTrace ?? true,
      resourceTypes: options.resourceTypes || ['worker', 'buffer', 'timer', 'stream', 'handle'],
    };

    if (this.options.trackingEnabled) {
      this.startLeakDetection();
    }
  }

  /**
   * Track a new resource
   */
  trackResource(id: string, type: string, metadata?: any): void {
    if (!this.options.trackingEnabled || !this.options.resourceTypes.includes(type)) {
      return;
    }

    const stackTrace = this.options.enableStackTrace ? this.captureStackTrace() : '';

    const tracker: ResourceTracker = {
      id,
      type,
      createdAt: Date.now(),
      stackTrace,
      metadata,
      isReleased: false,
    };

    this.trackedResources.set(id, tracker);
    this.resourceCounts.set(type, (this.resourceCounts.get(type) || 0) + 1);

    // Check if we're tracking too many resources
    if (this.trackedResources.size > this.options.maxResources) {
      this.emit('resource-limit-exceeded', {
        currentCount: this.trackedResources.size,
        maxResources: this.options.maxResources,
      });
    }

    this.emit('resource-tracked', { id, type, metadata });
  }

  /**
   * Mark a resource as released
   */
  releaseResource(id: string): void {
    const tracker = this.trackedResources.get(id);
    if (tracker && !tracker.isReleased) {
      tracker.isReleased = true;
      tracker.releasedAt = Date.now();

      // Update count
      const currentCount = this.resourceCounts.get(tracker.type) || 0;
      this.resourceCounts.set(tracker.type, Math.max(0, currentCount - 1));

      this.emit('resource-released', {
        id,
        type: tracker.type,
        lifespan: tracker.releasedAt - tracker.createdAt,
      });

      // Remove from tracking after a delay to catch double-releases
      setTimeout(() => {
        this.trackedResources.delete(id);
      }, 5000);
    }
  }

  /**
   * Check for resource leaks
   */
  checkForLeaks(): LeakReport[] {
    const now = Date.now();
    const leaksByType = new Map<string, ResourceTracker[]>();

    // Identify leaked resources
    for (const tracker of this.trackedResources.values()) {
      if (!tracker.isReleased && now - tracker.createdAt > this.options.maxAge) {
        const leaks = leaksByType.get(tracker.type) || [];
        leaks.push(tracker);
        leaksByType.set(tracker.type, leaks);
      }
    }

    // Generate leak reports
    const reports: LeakReport[] = [];

    for (const [type, leaks] of leaksByType) {
      const oldestLeak = leaks.reduce((oldest, current) =>
        current.createdAt < oldest.createdAt ? current : oldest,
      );

      const report: LeakReport = {
        resourceType: type,
        leakedCount: leaks.length,
        oldestLeak: {
          id: oldestLeak.id,
          age: now - oldestLeak.createdAt,
          stackTrace: oldestLeak.stackTrace,
        },
        totalMemoryImpact: this.estimateMemoryImpact(type, leaks.length),
        recommendations: this.generateRecommendations(type, leaks.length),
      };

      reports.push(report);
    }

    // Emit leak events
    if (reports.length > 0) {
      this.emit('leaks-detected', reports);

      for (const report of reports) {
        logger.warn(
          `Resource leak detected: ${report.leakedCount} ${report.resourceType} resources leaked`,
        );
      }
    }

    return reports;
  }

  /**
   * Get current resource statistics
   */
  getResourceStats(): {
    totalTracked: number;
    byType: { [type: string]: number };
    potentialLeaks: number;
    oldestResource: { id: string; type: string; age: number } | null;
    memoryUsage: number;
  } {
    const now = Date.now();
    let potentialLeaks = 0;
    let oldestResource: { id: string; type: string; age: number } | null = null;
    let oldestAge = 0;

    for (const tracker of this.trackedResources.values()) {
      if (!tracker.isReleased) {
        const age = now - tracker.createdAt;

        if (age > this.options.maxAge * 0.8) {
          // 80% of max age
          potentialLeaks++;
        }

        if (age > oldestAge) {
          oldestAge = age;
          oldestResource = {
            id: tracker.id,
            type: tracker.type,
            age,
          };
        }
      }
    }

    return {
      totalTracked: this.trackedResources.size,
      byType: Object.fromEntries(this.resourceCounts),
      potentialLeaks,
      oldestResource,
      memoryUsage: process.memoryUsage().heapUsed,
    };
  }

  /**
   * Force cleanup of all tracked resources (emergency)
   */
  forceCleanupAll(): number {
    const cleanedCount = this.trackedResources.size;

    for (const [id, tracker] of this.trackedResources) {
      if (!tracker.isReleased) {
        this.emit('resource-force-cleanup', {
          id: tracker.id,
          type: tracker.type,
          age: Date.now() - tracker.createdAt,
        });
      }
    }

    this.trackedResources.clear();
    this.resourceCounts.clear();

    logger.warn(`Force cleaned ${cleanedCount} tracked resources`);
    return cleanedCount;
  }

  /**
   * Get detailed leak analysis
   */
  getLeakAnalysis(): {
    summary: {
      totalLeaks: number;
      leakRate: number;
      criticalTypes: string[];
    };
    details: Array<{
      resourceId: string;
      type: string;
      age: number;
      stackTrace?: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
    }>;
    recommendations: string[];
  } {
    const now = Date.now();
    const leaks: Array<{
      resourceId: string;
      type: string;
      age: number;
      stackTrace?: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
    }> = [];

    const typeCounts = new Map<string, number>();

    for (const tracker of this.trackedResources.values()) {
      if (!tracker.isReleased) {
        const age = now - tracker.createdAt;

        if (age > this.options.maxAge) {
          const severity = this.calculateLeakSeverity(age, tracker.type);

          leaks.push({
            resourceId: tracker.id,
            type: tracker.type,
            age,
            stackTrace: tracker.stackTrace,
            severity,
          });

          typeCounts.set(tracker.type, (typeCounts.get(tracker.type) || 0) + 1);
        }
      }
    }

    const criticalTypes = Array.from(typeCounts.entries())
      .filter(([_, count]) => count > 5)
      .map(([type, _]) => type);

    const totalResources = this.trackedResources.size;
    const leakRate = totalResources > 0 ? (leaks.length / totalResources) * 100 : 0;

    return {
      summary: {
        totalLeaks: leaks.length,
        leakRate,
        criticalTypes,
      },
      details: leaks.sort((a, b) => b.age - a.age), // Sort by age, oldest first
      recommendations: this.generateSystemRecommendations(leaks, criticalTypes),
    };
  }

  /**
   * Start periodic leak detection
   */
  private startLeakDetection(): void {
    this.leakCheckTimer = setInterval(() => {
      this.checkForLeaks();
    }, this.options.checkInterval);

    logger.info('Resource leak detection started');
  }

  /**
   * Stop leak detection
   */
  private stopLeakDetection(): void {
    if (this.leakCheckTimer) {
      clearInterval(this.leakCheckTimer);
      this.leakCheckTimer = undefined;
    }
  }

  /**
   * Capture stack trace for debugging
   */
  private captureStackTrace(): string {
    const stack = new Error().stack || '';
    return stack.split('\n').slice(3, 8).join('\n'); // Skip first few frames
  }

  /**
   * Estimate memory impact of leaked resources
   */
  private estimateMemoryImpact(type: string, count: number): number {
    const estimates: { [key: string]: number } = {
      worker: 50 * 1024 * 1024, // 50MB per worker
      buffer: 1024 * 1024, // 1MB per buffer (average)
      timer: 1024, // 1KB per timer
      stream: 64 * 1024, // 64KB per stream
      handle: 4 * 1024, // 4KB per handle
    };

    return (estimates[type] || 1024) * count;
  }

  /**
   * Generate recommendations based on leak type
   */
  private generateRecommendations(type: string, count: number): string[] {
    const recommendations: string[] = [];

    switch (type) {
      case 'worker':
        recommendations.push('Ensure all workers are properly terminated after use');
        recommendations.push('Check for unhandled worker errors that prevent cleanup');
        if (count > 5) {
          recommendations.push('Consider implementing worker pooling to reuse workers');
        }
        break;

      case 'buffer':
        recommendations.push('Return buffers to buffer pools after use');
        recommendations.push('Use streaming instead of loading large buffers into memory');
        break;

      case 'timer':
        recommendations.push('Clear all timers and intervals when no longer needed');
        recommendations.push('Use AbortController for cancellable operations');
        break;

      case 'stream':
        recommendations.push('Close streams explicitly in finally blocks');
        recommendations.push('Handle stream errors to prevent hung connections');
        break;

      default:
        recommendations.push('Implement proper cleanup in finally blocks');
        recommendations.push('Use try-with-resources pattern where possible');
    }

    return recommendations;
  }

  /**
   * Calculate leak severity based on age and type
   */
  private calculateLeakSeverity(age: number, type: string): 'low' | 'medium' | 'high' | 'critical' {
    const ageHours = age / (1000 * 60 * 60);

    // Critical resources (workers, large buffers) are more severe
    const isCriticalType = ['worker', 'buffer'].includes(type);

    if (ageHours > 24 || (isCriticalType && ageHours > 4)) {
      return 'critical';
    } else if (ageHours > 4 || (isCriticalType && ageHours > 1)) {
      return 'high';
    } else if (ageHours > 1) {
      return 'medium';
    }

    return 'low';
  }

  /**
   * Generate system-wide recommendations
   */
  private generateSystemRecommendations(leaks: any[], criticalTypes: string[]): string[] {
    const recommendations: string[] = [];

    if (leaks.length > 10) {
      recommendations.push(
        'High number of resource leaks detected - review resource management patterns',
      );
    }

    if (criticalTypes.length > 0) {
      recommendations.push(
        `Critical leak types detected: ${criticalTypes.join(', ')} - prioritize fixing these`,
      );
    }

    const severeCounts = leaks.filter(
      (l) => l.severity === 'critical' || l.severity === 'high',
    ).length;
    if (severeCounts > 5) {
      recommendations.push(
        'Multiple severe leaks detected - consider implementing automated resource cleanup',
      );
    }

    recommendations.push('Enable stack traces in production for better leak debugging');
    recommendations.push('Implement resource limits to prevent runaway resource usage');

    return recommendations;
  }

  /**
   * Enable or disable tracking
   */
  setTrackingEnabled(enabled: boolean): void {
    this.options.trackingEnabled = enabled;

    if (enabled) {
      this.startLeakDetection();
    } else {
      this.stopLeakDetection();
    }
  }

  /**
   * Shutdown leak detector
   */
  shutdown(): void {
    this.stopLeakDetection();
    this.forceCleanupAll();
    this.emit('shutdown');
  }
}

/**
 * Global resource leak detector
 */
let globalResourceLeakDetector: ResourceLeakDetector | null = null;

export function getGlobalResourceLeakDetector(
  options?: LeakDetectionOptions,
): ResourceLeakDetector {
  if (!globalResourceLeakDetector) {
    globalResourceLeakDetector = new ResourceLeakDetector(options);
  }
  return globalResourceLeakDetector;
}

export function shutdownGlobalResourceLeakDetector(): void {
  if (globalResourceLeakDetector) {
    globalResourceLeakDetector.shutdown();
    globalResourceLeakDetector = null;
  }
}

/**
 * Decorator for automatic resource tracking
 */
export function trackResource<T extends (...args: any[]) => any>(
  resourceType: string,
  getResourceId?: (result: ReturnType<T>) => string,
) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = function (...args: any[]) {
      const result = method.apply(this, args);
      const detector = getGlobalResourceLeakDetector();

      if (result && typeof result === 'object') {
        const resourceId = getResourceId
          ? getResourceId(result)
          : `${resourceType}-${Date.now()}-${Math.random()}`;
        detector.trackResource(resourceId, resourceType, { method: propertyName, args });

        // Try to auto-detect release (works for EventEmitters)
        if (typeof result.on === 'function') {
          result.on('close', () => detector.releaseResource(resourceId));
          result.on('end', () => detector.releaseResource(resourceId));
          result.on('exit', () => detector.releaseResource(resourceId));
        }
      }

      return result;
    };

    return descriptor;
  };
}
