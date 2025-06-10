/**
 * Enhanced Error Recovery System
 * Comprehensive error handling with automatic recovery and context preservation
 */

import { EventEmitter } from 'events';
import { performance } from 'perf_hooks';
import { logger } from './logger';
import { DataPilotError, ErrorSeverity, ErrorCategory } from '../core/types';
import { getGlobalCircuitBreakerManager } from '../performance/circuit-breaker';
import { getGlobalResourceLeakDetector } from '../performance/resource-leak-detector';

export interface ErrorContext {
  operation: string;
  component: string;
  userId?: string;
  sessionId?: string;
  filePath?: string;
  metadata?: any;
  retryCount?: number;
  startTime?: number;
  memoryUsage?: number;
  stackTrace?: string;
}

export interface RecoveryStrategy {
  name: string;
  description: string;
  canRecover: (error: Error, context: ErrorContext) => boolean;
  recover: (error: Error, context: ErrorContext) => Promise<any>;
  priority: number; // Lower number = higher priority
  maxRetries?: number;
}

export interface ErrorMetrics {
  totalErrors: number;
  errorsByCategory: { [category: string]: number };
  errorsBySeverity: { [severity: string]: number };
  recoverySuccessRate: number;
  averageRecoveryTime: number;
  frequentErrors: Array<{ message: string; count: number }>;
  recentErrors: Array<{
    timestamp: number;
    error: string;
    context: ErrorContext;
    recovered: boolean;
  }>;
}

export interface ErrorHandlerOptions {
  enableRecovery?: boolean;
  maxRetries?: number;
  retryDelays?: number[];
  trackMetrics?: boolean;
  enableCircuitBreaker?: boolean;
  enableResourceTracking?: boolean;
  contextEnrichment?: boolean;
}

export class EnhancedErrorHandler extends EventEmitter {
  private recoveryStrategies: RecoveryStrategy[] = [];
  private errorMetrics: ErrorMetrics;
  private options: Required<ErrorHandlerOptions>;
  private errorHistory: Map<string, number> = new Map();
  private recentErrors: Array<any> = [];
  private readonly maxErrorHistory = 1000;

  constructor(options: ErrorHandlerOptions = {}) {
    super();

    this.options = {
      enableRecovery: options.enableRecovery ?? true,
      maxRetries: options.maxRetries || 3,
      retryDelays: options.retryDelays || [1000, 2000, 4000], // Exponential backoff
      trackMetrics: options.trackMetrics ?? true,
      enableCircuitBreaker: options.enableCircuitBreaker ?? true,
      enableResourceTracking: options.enableResourceTracking ?? true,
      contextEnrichment: options.contextEnrichment ?? true,
    };

    this.errorMetrics = {
      totalErrors: 0,
      errorsByCategory: {},
      errorsBySeverity: {},
      recoverySuccessRate: 0,
      averageRecoveryTime: 0,
      frequentErrors: [],
      recentErrors: [],
    };

    this.initializeDefaultStrategies();
  }

  /**
   * Handle an error with automatic recovery attempts
   */
  async handleError(
    error: Error,
    context: ErrorContext,
    originalOperation?: () => Promise<any>,
  ): Promise<{ success: boolean; result?: any; finalError?: Error }> {
    const enrichedContext = this.enrichContext(error, context);
    const startTime = performance.now();

    // Update metrics
    this.updateMetrics(error, enrichedContext);

    try {
      // Check if operation is circuit broken
      if (this.options.enableCircuitBreaker) {
        const circuitBreaker = getGlobalCircuitBreakerManager();
        const operationName = `${enrichedContext.component}.${enrichedContext.operation}`;

        if (!circuitBreaker.getCircuitBreaker(operationName, async () => {}).isAvailable()) {
          this.emit('circuit-breaker-blocked', { context: enrichedContext, error });
          return { success: false, finalError: error };
        }
      }

      // Attempt recovery if enabled
      if (this.options.enableRecovery) {
        const recoveryResult = await this.attemptRecovery(
          error,
          enrichedContext,
          originalOperation,
        );

        if (recoveryResult.success) {
          const recoveryTime = performance.now() - startTime;
          this.emit('recovery-success', {
            context: enrichedContext,
            recoveryTime,
            strategy: recoveryResult.strategy,
          });

          return { success: true, result: recoveryResult.result };
        }
      }

      // Recovery failed or disabled
      this.emit('error-unrecoverable', { context: enrichedContext, error });
      return { success: false, finalError: error };
    } catch (handlingError) {
      logger.error(`Error in error handler: ${handlingError.message}`, enrichedContext);
      return { success: false, finalError: error };
    }
  }

  /**
   * Wrap a function with automatic error handling
   */
  wrapFunction<T extends (...args: any[]) => Promise<any>>(
    fn: T,
    context: Partial<ErrorContext>,
  ): T {
    return (async (...args: any[]) => {
      const fullContext: ErrorContext = {
        operation: fn.name || 'anonymous',
        component: 'wrapped-function',
        startTime: performance.now(),
        ...context,
      };

      try {
        return await fn(...args);
      } catch (error) {
        const result = await this.handleError(error as Error, fullContext, () => fn(...args));

        if (result.success) {
          return result.result;
        } else {
          throw result.finalError;
        }
      }
    }) as T;
  }

  /**
   * Add a custom recovery strategy
   */
  addRecoveryStrategy(strategy: RecoveryStrategy): void {
    // Insert strategy in priority order
    const insertIndex = this.recoveryStrategies.findIndex((s) => s.priority > strategy.priority);

    if (insertIndex === -1) {
      this.recoveryStrategies.push(strategy);
    } else {
      this.recoveryStrategies.splice(insertIndex, 0, strategy);
    }

    this.emit('strategy-added', { name: strategy.name, priority: strategy.priority });
  }

  /**
   * Attempt recovery using available strategies
   */
  private async attemptRecovery(
    error: Error,
    context: ErrorContext,
    originalOperation?: () => Promise<any>,
  ): Promise<{ success: boolean; result?: any; strategy?: string }> {
    for (const strategy of this.recoveryStrategies) {
      if (strategy.canRecover(error, context)) {
        const maxRetries = strategy.maxRetries || this.options.maxRetries;
        const currentRetries = context.retryCount || 0;

        if (currentRetries >= maxRetries) {
          continue; // Skip this strategy if max retries exceeded
        }

        try {
          logger.info(`Attempting recovery with strategy: ${strategy.name}`, context);

          const recoveryResult = await strategy.recover(error, {
            ...context,
            retryCount: currentRetries + 1,
          });

          // If recovery succeeded and we have the original operation, try it again
          if (originalOperation && recoveryResult !== false) {
            try {
              const result = await originalOperation();
              return { success: true, result, strategy: strategy.name };
            } catch (retryError) {
              // If retry failed, continue to next strategy
              continue;
            }
          }

          return {
            success: true,
            result: recoveryResult,
            strategy: strategy.name,
          };
        } catch (recoveryError) {
          logger.warn(
            `Recovery strategy ${strategy.name} failed: ${recoveryError.message}`,
            context,
          );
          continue;
        }
      }
    }

    return { success: false };
  }

  /**
   * Enrich error context with additional information
   */
  private enrichContext(error: Error, context: ErrorContext): ErrorContext {
    if (!this.options.contextEnrichment) {
      return context;
    }

    const enriched: ErrorContext = {
      ...context,
      memoryUsage: process.memoryUsage().heapUsed,
      stackTrace: error.stack,
      startTime: context.startTime || performance.now(),
    };

    // Add system resource information
    if (this.options.enableResourceTracking) {
      const leakDetector = getGlobalResourceLeakDetector();
      const resourceStats = leakDetector.getResourceStats();
      enriched.metadata = {
        ...enriched.metadata,
        resourceStats,
      };
    }

    return enriched;
  }

  /**
   * Update error metrics
   */
  private updateMetrics(error: Error, context: ErrorContext): void {
    if (!this.options.trackMetrics) {
      return;
    }

    this.errorMetrics.totalErrors++;

    // Update category counts
    const category = this.categorizeError(error);
    this.errorMetrics.errorsByCategory[category] =
      (this.errorMetrics.errorsByCategory[category] || 0) + 1;

    // Update severity counts
    const severity = this.getSeverity(error);
    this.errorMetrics.errorsBySeverity[severity] =
      (this.errorMetrics.errorsBySeverity[severity] || 0) + 1;

    // Track frequent errors
    const errorKey = `${error.name}: ${error.message}`;
    this.errorHistory.set(errorKey, (this.errorHistory.get(errorKey) || 0) + 1);

    // Add to recent errors
    this.recentErrors.push({
      timestamp: Date.now(),
      error: errorKey,
      context,
      recovered: false, // Will be updated if recovery succeeds
    });

    // Maintain recent errors limit
    if (this.recentErrors.length > 100) {
      this.recentErrors.shift();
    }

    // Update frequent errors list
    this.updateFrequentErrors();
  }

  /**
   * Update frequent errors list
   */
  private updateFrequentErrors(): void {
    this.errorMetrics.frequentErrors = Array.from(this.errorHistory.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([message, count]) => ({ message, count }));
  }

  /**
   * Categorize error for metrics
   */
  private categorizeError(error: Error): string {
    if (error instanceof DataPilotError) {
      return error.category;
    }

    // Categorize based on error type and message
    const message = error.message.toLowerCase();

    if (message.includes('memory') || message.includes('heap')) {
      return ErrorCategory.MEMORY;
    } else if (message.includes('timeout') || message.includes('network')) {
      return ErrorCategory.NETWORK;
    } else if (message.includes('file') || message.includes('permission')) {
      return ErrorCategory.IO;
    } else if (message.includes('parse') || message.includes('invalid')) {
      return ErrorCategory.PARSING;
    }

    return ErrorCategory.ANALYSIS;
  }

  /**
   * Get error severity
   */
  private getSeverity(error: Error): string {
    if (error instanceof DataPilotError) {
      return error.severity;
    }

    // Determine severity based on error characteristics
    const message = error.message.toLowerCase();

    if (message.includes('critical') || message.includes('fatal')) {
      return ErrorSeverity.CRITICAL;
    } else if (message.includes('memory') || message.includes('worker')) {
      return ErrorSeverity.HIGH;
    } else if (message.includes('timeout') || message.includes('retry')) {
      return ErrorSeverity.MEDIUM;
    }

    return ErrorSeverity.LOW;
  }

  /**
   * Initialize default recovery strategies
   */
  private initializeDefaultStrategies(): void {
    // Memory pressure recovery
    this.addRecoveryStrategy({
      name: 'memory-pressure-recovery',
      description: 'Recover from memory pressure by triggering GC and reducing chunk size',
      priority: 1,
      canRecover: (error, context) => {
        return (
          error.message.toLowerCase().includes('memory') ||
          error.message.toLowerCase().includes('heap')
        );
      },
      recover: async (error, context) => {
        // Force garbage collection
        if (global.gc) {
          global.gc();
        }

        // Reduce memory usage in context metadata
        if (context.metadata) {
          context.metadata.memoryRecoveryApplied = true;
        }

        await new Promise((resolve) => setTimeout(resolve, 1000)); // Brief pause
        return true;
      },
    });

    // Worker failure recovery
    this.addRecoveryStrategy({
      name: 'worker-failure-recovery',
      description: 'Recover from worker failures by creating new workers',
      priority: 2,
      canRecover: (error, context) => {
        return (
          error.message.toLowerCase().includes('worker') ||
          context.component?.toLowerCase().includes('worker')
        );
      },
      recover: async (error, context) => {
        logger.warn('Attempting worker recovery', context);

        // Signal to create new worker (implementation would depend on specific worker pool)
        if (context.metadata) {
          context.metadata.workerRecoveryApplied = true;
        }

        return true;
      },
    });

    // File system recovery
    this.addRecoveryStrategy({
      name: 'file-system-recovery',
      description: 'Recover from file system errors with retries and fallbacks',
      priority: 3,
      maxRetries: 5,
      canRecover: (error, context) => {
        const message = error.message.toLowerCase();
        return (
          message.includes('enoent') ||
          message.includes('eacces') ||
          message.includes('emfile') ||
          message.includes('file')
        );
      },
      recover: async (error, context) => {
        const retryCount = context.retryCount || 0;
        const delay = Math.min(1000 * Math.pow(2, retryCount), 10000); // Exponential backoff, max 10s

        logger.info(`File system recovery attempt ${retryCount + 1}, waiting ${delay}ms`, context);
        await new Promise((resolve) => setTimeout(resolve, delay));

        return true;
      },
    });

    // Network/timeout recovery
    this.addRecoveryStrategy({
      name: 'network-timeout-recovery',
      description: 'Recover from network timeouts and connection issues',
      priority: 4,
      canRecover: (error, context) => {
        const message = error.message.toLowerCase();
        return (
          message.includes('timeout') ||
          message.includes('network') ||
          message.includes('connection')
        );
      },
      recover: async (error, context) => {
        const retryCount = context.retryCount || 0;
        const delay = Math.min(2000 * Math.pow(2, retryCount), 30000); // Exponential backoff, max 30s

        logger.info(`Network recovery attempt ${retryCount + 1}, waiting ${delay}ms`, context);
        await new Promise((resolve) => setTimeout(resolve, delay));

        return true;
      },
    });

    // Generic retry strategy (lowest priority)
    this.addRecoveryStrategy({
      name: 'generic-retry',
      description: 'Generic retry strategy for transient errors',
      priority: 100,
      maxRetries: 2,
      canRecover: (error, context) => {
        // Don't retry validation errors or programming errors
        const message = error.message.toLowerCase();
        return (
          !message.includes('validation') &&
          !message.includes('type') &&
          !message.includes('syntax')
        );
      },
      recover: async (error, context) => {
        const retryCount = context.retryCount || 0;
        const delay =
          this.options.retryDelays[Math.min(retryCount, this.options.retryDelays.length - 1)];

        logger.info(`Generic retry attempt ${retryCount + 1}, waiting ${delay}ms`, context);
        await new Promise((resolve) => setTimeout(resolve, delay));

        return true;
      },
    });
  }

  /**
   * Get current error metrics
   */
  getMetrics(): ErrorMetrics {
    return {
      ...this.errorMetrics,
      recentErrors: [...this.recentErrors],
    };
  }

  /**
   * Reset error metrics
   */
  resetMetrics(): void {
    this.errorMetrics = {
      totalErrors: 0,
      errorsByCategory: {},
      errorsBySeverity: {},
      recoverySuccessRate: 0,
      averageRecoveryTime: 0,
      frequentErrors: [],
      recentErrors: [],
    };

    this.errorHistory.clear();
    this.recentErrors = [];
  }

  /**
   * Get health status
   */
  getHealthStatus(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    errorRate: number;
    recoveryRate: number;
    recommendations: string[];
  } {
    const recentErrorCount = this.recentErrors.filter(
      (e) => Date.now() - e.timestamp < 300000, // Last 5 minutes
    ).length;

    const errorRate = recentErrorCount; // Errors per 5 minutes
    const recoveredCount = this.recentErrors.filter((e) => e.recovered).length;
    const recoveryRate =
      this.recentErrors.length > 0 ? recoveredCount / this.recentErrors.length : 1;

    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    const recommendations: string[] = [];

    if (errorRate > 10) {
      status = 'unhealthy';
      recommendations.push('High error rate detected - investigate root causes');
    } else if (errorRate > 3) {
      status = 'degraded';
      recommendations.push('Elevated error rate - monitor system closely');
    }

    if (recoveryRate < 0.5) {
      status = status === 'healthy' ? 'degraded' : 'unhealthy';
      recommendations.push('Low recovery rate - review recovery strategies');
    }

    const topErrors = this.errorMetrics.frequentErrors.slice(0, 3);
    if (topErrors.length > 0 && topErrors[0].count > 5) {
      recommendations.push(
        `Frequent error pattern: ${topErrors[0].message} (${topErrors[0].count} occurrences)`,
      );
    }

    return {
      status,
      errorRate,
      recoveryRate,
      recommendations,
    };
  }

  /**
   * Shutdown error handler
   */
  shutdown(): void {
    this.removeAllListeners();
    this.emit('shutdown');
  }
}

/**
 * Global enhanced error handler
 */
let globalEnhancedErrorHandler: EnhancedErrorHandler | null = null;

export function getGlobalEnhancedErrorHandler(options?: ErrorHandlerOptions): EnhancedErrorHandler {
  if (!globalEnhancedErrorHandler) {
    globalEnhancedErrorHandler = new EnhancedErrorHandler(options);
  }
  return globalEnhancedErrorHandler;
}

export function shutdownGlobalEnhancedErrorHandler(): void {
  if (globalEnhancedErrorHandler) {
    globalEnhancedErrorHandler.shutdown();
    globalEnhancedErrorHandler = null;
  }
}

/**
 * Decorator for automatic error handling
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  context: Partial<ErrorContext>,
) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    const errorHandler = getGlobalEnhancedErrorHandler();

    descriptor.value = errorHandler.wrapFunction(method, {
      operation: propertyName,
      component: target.constructor.name,
      ...context,
    });

    return descriptor;
  };
}
