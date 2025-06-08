/**
 * Retry logic utilities for DataPilot
 * Handles transient failures with configurable retry strategies
 */

import { DataPilotError, ErrorSeverity, ErrorCategory } from '../core/types';
import type { LogContext } from './logger';
import { logger } from './logger';

export interface RetryOptions {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  jitter: boolean;
  retryIf?: (error: unknown) => boolean;
  onRetry?: (error: unknown, attempt: number) => void;
}

export interface RetryResult<T> {
  success: boolean;
  result?: T;
  error?: Error;
  attempts: number;
  totalTime: number;
}

export class RetryManager {
  private static defaultOptions: RetryOptions = {
    maxAttempts: 3,
    baseDelayMs: 1000,
    maxDelayMs: 30000,
    backoffMultiplier: 2,
    jitter: true,
    retryIf: (error) => RetryManager.isRetryableError(error),
  };

  /**
   * Execute operation with retry logic
   */
  static async retry<T>(
    operation: () => Promise<T>,
    options: Partial<RetryOptions> = {},
    context?: LogContext,
  ): Promise<T> {
    const opts = { ...this.defaultOptions, ...options };
    const startTime = Date.now();
    let lastError: Error = new Error('No attempts made');

    for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
      try {
        const result = await operation();

        if (attempt > 1) {
          const totalTime = Date.now() - startTime;
          logger.info(`Operation succeeded on attempt ${attempt} after ${totalTime}ms`, {
            ...context,
            operation: 'retry',
          });
        }

        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Check if we should retry this error
        if (!opts.retryIf || !opts.retryIf(error)) {
          logger.debug(`Error not retryable: ${lastError.message}`, context);
          throw lastError;
        }

        // Don't retry on last attempt
        if (attempt === opts.maxAttempts) {
          break;
        }

        // Calculate delay
        const delay = this.calculateDelay(attempt, opts);

        logger.warn(
          `Operation failed on attempt ${attempt}, retrying in ${delay}ms: ${lastError.message}`,
          {
            ...context,
            operation: 'retry',
          },
        );

        // Call onRetry callback if provided
        if (opts.onRetry) {
          try {
            opts.onRetry(error, attempt);
          } catch (callbackError) {
            logger.debug('Error in retry callback', context, callbackError);
          }
        }

        // Wait before retry
        await this.delay(delay);
      }
    }

    const totalTime = Date.now() - startTime;
    const finalError = new Error(
      `Operation failed after ${opts.maxAttempts} attempts over ${totalTime}ms. Last error: ${lastError.message}`,
    );

    logger.error('Retry attempts exhausted', {
      ...context,
      operation: 'retry',
    });

    throw finalError;
  }

  /**
   * Execute operation with retry and return detailed result
   */
  static async retryWithResult<T>(
    operation: () => Promise<T>,
    options: Partial<RetryOptions> = {},
    context?: LogContext,
  ): Promise<RetryResult<T>> {
    const startTime = Date.now();
    let attempts = 0;

    try {
      const result = await this.retry(
        operation,
        {
          ...options,
          onRetry: (error, attempt) => {
            attempts = attempt;
            if (options.onRetry) {
              options.onRetry(error, attempt);
            }
          },
        },
        context,
      );

      return {
        success: true,
        result,
        attempts: Math.max(attempts, 1),
        totalTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        attempts: attempts || (options.maxAttempts ?? this.defaultOptions.maxAttempts),
        totalTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Batch retry multiple operations
   */
  static async retryBatch<T>(
    operations: Array<() => Promise<T>>,
    options: Partial<RetryOptions> = {},
    context?: LogContext,
  ): Promise<Array<RetryResult<T>>> {
    const results = await Promise.allSettled(
      operations.map((op, index) =>
        this.retryWithResult(op, options, {
          ...context,
          operation: `batch_${index}`,
        }),
      ),
    );

    return results.map((result) =>
      result.status === 'fulfilled'
        ? result.value
        : {
            success: false,
            error:
              result.reason instanceof Error ? result.reason : new Error(String(result.reason)),
            attempts: options.maxAttempts ?? this.defaultOptions.maxAttempts,
            totalTime: 0,
          },
    );
  }

  /**
   * Check if an error is retryable
   */
  static isRetryableError(error: unknown): boolean {
    if (error instanceof DataPilotError) {
      // Don't retry validation errors or critical analysis errors
      if (error.category === ErrorCategory.VALIDATION) {
        return false;
      }

      // Don't retry if explicitly marked as non-recoverable
      if (!error.recoverable) {
        return false;
      }

      // Retry network, IO, and memory errors (with caution)
      const retryableCategories = [ErrorCategory.NETWORK, ErrorCategory.IO];

      return retryableCategories.includes(error.category);
    }

    if (error instanceof Error) {
      const message = error.message.toLowerCase();

      // Network-related errors
      if (
        message.includes('timeout') ||
        message.includes('connection') ||
        message.includes('network') ||
        message.includes('enotfound') ||
        message.includes('econnreset')
      ) {
        return true;
      }

      // File system errors that might be transient
      if (message.includes('ebusy') || message.includes('eagain') || message.includes('emfile')) {
        return true;
      }

      // Memory errors are generally not retryable
      if (
        message.includes('out of memory') ||
        message.includes('heap') ||
        message.includes('memory')
      ) {
        return false;
      }
    }

    return false;
  }

  /**
   * Create retry-specific error with context
   */
  static createRetryError(
    originalError: Error,
    attempts: number,
    totalTime: number,
    context?: LogContext,
  ): DataPilotError {
    return DataPilotError.analysis(
      `Operation failed after ${attempts} retry attempts over ${totalTime}ms: ${originalError.message}`,
      'RETRY_EXHAUSTED',
      {
        ...context,
        retryCount: attempts,
        timeElapsed: totalTime,
      },
      [
        {
          action: 'Check underlying issue',
          description: 'Investigate the root cause of the recurring failure',
          severity: ErrorSeverity.HIGH,
        },
        {
          action: 'Increase retry limits',
          description: 'Consider increasing maxAttempts or delay if issue is transient',
          severity: ErrorSeverity.MEDIUM,
        },
        {
          action: 'Check system resources',
          description: 'Verify sufficient memory, disk space, and network connectivity',
          severity: ErrorSeverity.MEDIUM,
        },
      ],
    );
  }

  /**
   * Calculate exponential backoff delay with jitter
   */
  private static calculateDelay(attempt: number, options: RetryOptions): number {
    const exponentialDelay = options.baseDelayMs * Math.pow(options.backoffMultiplier, attempt - 1);
    const cappedDelay = Math.min(exponentialDelay, options.maxDelayMs);

    if (!options.jitter) {
      return cappedDelay;
    }

    // Add jitter (±25% of delay)
    const jitterRange = cappedDelay * 0.25;
    const jitter = (Math.random() - 0.5) * 2 * jitterRange;

    return Math.max(0, cappedDelay + jitter);
  }

  /**
   * Promise-based delay
   */
  private static delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Specialized retry strategies for common operations
 */
export class RetryStrategies {
  /**
   * File operations retry strategy
   */
  static fileOperations(): Partial<RetryOptions> {
    return {
      maxAttempts: 3,
      baseDelayMs: 500,
      maxDelayMs: 5000,
      backoffMultiplier: 1.5,
      jitter: true,
      retryIf: (error): boolean => {
        if (error instanceof Error) {
          const message = error.message.toLowerCase();
          return (
            message.includes('ebusy') ||
            message.includes('eagain') ||
            message.includes('emfile') ||
            message.includes('enoent')
          ); // Sometimes files become temporarily unavailable
        }
        return false;
      },
    };
  }

  /**
   * Network operations retry strategy
   */
  static networkOperations(): Partial<RetryOptions> {
    return {
      maxAttempts: 5,
      baseDelayMs: 1000,
      maxDelayMs: 30000,
      backoffMultiplier: 2,
      jitter: true,
      retryIf: (error): boolean => {
        if (error instanceof Error) {
          const message = error.message.toLowerCase();
          return (
            message.includes('timeout') ||
            message.includes('connection') ||
            message.includes('network') ||
            message.includes('enotfound') ||
            message.includes('econnreset') ||
            message.includes('502') ||
            message.includes('503') ||
            message.includes('504')
          );
        }
        return false;
      },
    };
  }

  /**
   * Analysis operations retry strategy
   */
  static analysisOperations(): Partial<RetryOptions> {
    return {
      maxAttempts: 2,
      baseDelayMs: 2000,
      maxDelayMs: 10000,
      backoffMultiplier: 1.5,
      jitter: false,
      retryIf: (error): boolean => {
        if (error instanceof DataPilotError) {
          // Only retry analysis errors that are marked as recoverable
          return (
            error.recoverable &&
            error.category !== ErrorCategory.VALIDATION &&
            error.severity !== ErrorSeverity.CRITICAL
          );
        }
        return false;
      },
    };
  }

  /**
   * Memory-sensitive operations retry strategy
   */
  static memorySensitiveOperations(): Partial<RetryOptions> {
    return {
      maxAttempts: 2,
      baseDelayMs: 5000, // Longer delay to allow memory to free up
      maxDelayMs: 15000,
      backoffMultiplier: 1.5,
      jitter: false,
      retryIf: (error): boolean => {
        // Don't retry memory errors - they usually require intervention
        if (error instanceof DataPilotError && error.category === ErrorCategory.MEMORY) {
          return false;
        }

        if (error instanceof Error) {
          const message = error.message.toLowerCase();
          if (message.includes('memory') || message.includes('heap')) {
            return false;
          }
        }

        return RetryManager.isRetryableError(error);
      },
      onRetry: (): void => {
        // Force garbage collection if available before retry
        if (global.gc) {
          global.gc();
        }
      },
    };
  }

  /**
   * Quick operations retry strategy (for fast, simple operations)
   */
  static quickOperations(): Partial<RetryOptions> {
    return {
      maxAttempts: 3,
      baseDelayMs: 100,
      maxDelayMs: 1000,
      backoffMultiplier: 2,
      jitter: true,
    };
  }
}

/**
 * Utility class for common retry patterns
 */
export class RetryUtils {
  /**
   * Retry file read operation
   */
  static async retryFileRead<T>(operation: () => Promise<T>, context?: LogContext): Promise<T> {
    return RetryManager.retry(operation, RetryStrategies.fileOperations(), {
      ...context,
      operation: 'fileRead',
    });
  }

  /**
   * Retry network operation
   */
  static async retryNetworkOperation<T>(
    operation: () => Promise<T>,
    context?: LogContext,
  ): Promise<T> {
    return RetryManager.retry(operation, RetryStrategies.networkOperations(), {
      ...context,
      operation: 'network',
    });
  }

  /**
   * Retry analysis operation with error handling
   */
  static async retryAnalysis<T>(operation: () => Promise<T>, context?: LogContext): Promise<T> {
    return RetryManager.retry(operation, RetryStrategies.analysisOperations(), {
      ...context,
      operation: 'analysis',
    });
  }

  /**
   * Wrap operation with automatic retry based on error type
   */
  static async autoRetry<T>(operation: () => Promise<T>, context?: LogContext): Promise<T> {
    return RetryManager.retry(
      operation,
      {
        maxAttempts: 3,
        baseDelayMs: 1000,
        maxDelayMs: 10000,
        backoffMultiplier: 1.5,
        jitter: true,
        retryIf: (error): boolean => RetryManager.isRetryableError(error),
      },
      { ...context, operation: 'autoRetry' },
    );
  }
}
