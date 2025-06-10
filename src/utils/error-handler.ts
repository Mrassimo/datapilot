/**
 * Comprehensive error handling and recovery system for DataPilot
 */

import type { ErrorContext, ErrorRecoveryStrategy } from '../core/types';
import { DataPilotError, ErrorSeverity, ErrorCategory, ActionableSuggestion } from '../core/types';
import { logger } from './logger';

export interface ErrorHandlerConfig {
  maxRetries: number;
  retryDelayMs: number;
  enableRecovery: boolean;
  logErrors: boolean;
  abortOnCritical: boolean;
  memoryThresholdBytes: number;
}

export interface ErrorStats {
  totalErrors: number;
  errorsByCategory: Record<ErrorCategory, number>;
  errorsBySeverity: Record<ErrorSeverity, number>;
  recoveredErrors: number;
  criticalErrors: number;
}

export class ErrorHandler {
  private config: ErrorHandlerConfig;
  private stats: ErrorStats;
  private errorHistory: DataPilotError[] = [];

  constructor(config: Partial<ErrorHandlerConfig> = {}) {
    this.config = {
      maxRetries: 3,
      retryDelayMs: 1000,
      enableRecovery: true,
      logErrors: true,
      abortOnCritical: true,
      memoryThresholdBytes: 512 * 1024 * 1024, // 512MB
      ...config,
    };

    this.stats = {
      totalErrors: 0,
      errorsByCategory: {} as Record<ErrorCategory, number>,
      errorsBySeverity: {} as Record<ErrorSeverity, number>,
      recoveredErrors: 0,
      criticalErrors: 0,
    };

    // Initialize counters
    Object.values(ErrorCategory).forEach((category) => {
      this.stats.errorsByCategory[category as ErrorCategory] = 0;
    });
    Object.values(ErrorSeverity).forEach((severity) => {
      this.stats.errorsBySeverity[severity as ErrorSeverity] = 0;
    });
  }

  /**
   * Handle an error with recovery strategies
   */
  async handleError<T>(
    error: DataPilotError,
    operation: () => Promise<T>,
    recoveryStrategy?: ErrorRecoveryStrategy,
  ): Promise<T | null> {
    this.recordError(error);

    if (this.config.logErrors) {
      this.logError(error);
    }

    // Check if error is critical and should abort
    if (error.severity === ErrorSeverity.CRITICAL && this.config.abortOnCritical) {
      throw error;
    }

    // Check if recovery is enabled and error is recoverable
    if (!this.config.enableRecovery || !error.recoverable) {
      throw error;
    }

    // Apply recovery strategy
    if (recoveryStrategy) {
      return await this.applyRecoveryStrategy(error, operation, recoveryStrategy);
    }

    // Default recovery strategies based on error category
    const defaultStrategy = this.getDefaultRecoveryStrategy(error);
    if (defaultStrategy) {
      return await this.applyRecoveryStrategy(error, operation, defaultStrategy);
    }

    throw error;
  }

  /**
   * Handle synchronous errors
   */
  handleErrorSync<T>(error: DataPilotError, operation: () => T, fallbackValue?: T): T | null {
    this.recordError(error);

    if (this.config.logErrors) {
      this.logError(error);
    }

    if (error.severity === ErrorSeverity.CRITICAL && this.config.abortOnCritical) {
      throw error;
    }

    if (!error.recoverable) {
      if (fallbackValue !== undefined) {
        this.stats.recoveredErrors++;
        return fallbackValue;
      }
      throw error;
    }

    // Try to execute with fallback
    try {
      return operation();
    } catch (retryError) {
      if (fallbackValue !== undefined) {
        this.stats.recoveredErrors++;
        logger.warn(
          `Operation failed, using fallback value: ${retryError instanceof Error ? retryError.message : 'Unknown error'}`,
        );
        return fallbackValue;
      }
      throw error;
    }
  }

  /**
   * Validate configuration parameters
   */
  validateConfig(
    config: Record<string, unknown>,
    schema: Record<string, string>,
  ): DataPilotError[] {
    const errors: DataPilotError[] = [];

    for (const [key, expectedType] of Object.entries(schema)) {
      const value = config[key];

      if (value === undefined || value === null) {
        continue; // Optional parameters
      }

      const actualType = typeof value;
      if (actualType !== expectedType) {
        errors.push(
          DataPilotError.validation(
            `Invalid configuration parameter type for '${key}': expected ${expectedType}, got ${actualType}`,
            'CONFIG_TYPE_MISMATCH',
            { operationName: 'validateConfig' },
            [
              {
                action: 'Fix configuration',
                description: `Change '${key}' to type ${expectedType}`,
                severity: ErrorSeverity.MEDIUM,
              },
            ],
          ),
        );
      }

      // Additional validations based on type
      if (expectedType === 'number') {
        const numValue = value as number;
        if (isNaN(numValue) || !isFinite(numValue)) {
          errors.push(
            DataPilotError.validation(
              `Invalid number value for '${key}': ${value}`,
              'CONFIG_INVALID_NUMBER',
              { operationName: 'validateConfig' },
              [
                {
                  action: 'Fix configuration',
                  description: `Provide a valid number for '${key}'`,
                  severity: ErrorSeverity.MEDIUM,
                },
              ],
            ),
          );
        }
      }
    }

    return errors;
  }

  /**
   * Check memory usage and throw error if threshold exceeded
   */
  checkMemoryUsage(context?: ErrorContext): void {
    const memUsage = process.memoryUsage();

    if (memUsage.heapUsed > this.config.memoryThresholdBytes) {
      const error = DataPilotError.memory(
        `Memory usage (${Math.round(memUsage.heapUsed / 1024 / 1024)}MB) exceeds threshold (${Math.round(this.config.memoryThresholdBytes / 1024 / 1024)}MB)`,
        'MEMORY_THRESHOLD_EXCEEDED',
        { ...context, memoryUsage: memUsage.heapUsed },
        [
          {
            action: 'Reduce memory usage',
            description: 'Process data in smaller chunks or increase memory limit',
            severity: ErrorSeverity.HIGH,
            command: '--maxRows 10000 or --memoryLimit 1024',
          },
          {
            action: 'Free memory',
            description: 'Close other applications to free system memory',
            severity: ErrorSeverity.MEDIUM,
          },
        ],
      );
      throw error;
    }
  }

  /**
   * Create error with file corruption recovery suggestions
   */
  createFileCorruptionError(filePath: string, details: string): DataPilotError {
    return DataPilotError.parsing(
      `File appears to be corrupted or invalid: ${details}`,
      'FILE_CORRUPTED',
      { filePath, operationName: 'parseFile' },
      [
        {
          action: 'Check file encoding',
          description: 'Try specifying encoding explicitly (utf8, utf16, latin1)',
          severity: ErrorSeverity.HIGH,
          command: '--encoding utf8',
        },
        {
          action: 'Validate file format',
          description: 'Open file in text editor to check for obvious corruption',
          severity: ErrorSeverity.HIGH,
        },
        {
          action: 'Try manual delimiter detection',
          description: 'Specify delimiter explicitly if auto-detection fails',
          severity: ErrorSeverity.MEDIUM,
          command: '--delimiter "," or --delimiter "\\t"',
        },
        {
          action: 'Skip problematic rows',
          description: 'Enable lenient parsing mode',
          severity: ErrorSeverity.LOW,
          command: '--lenient',
        },
      ],
    );
  }

  /**
   * Create error for insufficient data
   */
  createInsufficientDataError(
    context: ErrorContext,
    minRequired: number,
    actual: number,
  ): DataPilotError {
    return DataPilotError.analysis(
      `Insufficient data for analysis: found ${actual} rows, need at least ${minRequired}`,
      'INSUFFICIENT_DATA',
      context,
      [
        {
          action: 'Check data source',
          description: 'Verify that the file contains the expected amount of data',
          severity: ErrorSeverity.HIGH,
        },
        {
          action: 'Adjust analysis parameters',
          description: 'Reduce minimum requirements or enable simplified analysis',
          severity: ErrorSeverity.MEDIUM,
          command: '--simplified or --minRows 10',
        },
        {
          action: 'Combine with other data',
          description: 'Add more data to reach minimum requirements',
          severity: ErrorSeverity.LOW,
        },
      ],
    );
  }

  /**
   * Wrap operation with automatic error handling
   */
  async wrapOperation<T>(
    operation: () => Promise<T>,
    operationName: string,
    context?: ErrorContext,
    recoveryStrategy?: ErrorRecoveryStrategy,
  ): Promise<T | null> {
    try {
      return await operation();
    } catch (error) {
      let dataPilotError: DataPilotError;

      if (error instanceof DataPilotError) {
        dataPilotError = error;
      } else {
        // Convert generic error to DataPilotError
        dataPilotError = new DataPilotError(
          error instanceof Error ? error.message : 'Unknown error',
          'UNKNOWN_ERROR',
          ErrorSeverity.MEDIUM,
          ErrorCategory.ANALYSIS,
          { ...context, operationName },
        );
      }

      return await this.handleError(dataPilotError, operation, recoveryStrategy);
    }
  }

  /**
   * Get error statistics
   */
  getStats(): ErrorStats {
    return { ...this.stats };
  }

  /**
   * Get recent errors
   */
  getRecentErrors(limit: number = 10): DataPilotError[] {
    return this.errorHistory.slice(-limit);
  }

  /**
   * Clear error history and reset stats
   */
  reset(): void {
    this.errorHistory = [];
    this.stats = {
      totalErrors: 0,
      errorsByCategory: {} as Record<ErrorCategory, number>,
      errorsBySeverity: {} as Record<ErrorSeverity, number>,
      recoveredErrors: 0,
      criticalErrors: 0,
    };

    Object.values(ErrorCategory).forEach((category) => {
      this.stats.errorsByCategory[category as ErrorCategory] = 0;
    });
    Object.values(ErrorSeverity).forEach((severity) => {
      this.stats.errorsBySeverity[severity as ErrorSeverity] = 0;
    });
  }

  private recordError(error: DataPilotError): void {
    this.stats.totalErrors++;
    this.stats.errorsByCategory[error.category]++;
    this.stats.errorsBySeverity[error.severity]++;

    if (error.severity === ErrorSeverity.CRITICAL) {
      this.stats.criticalErrors++;
    }

    this.errorHistory.push(error);

    // Keep history limited to prevent memory issues
    if (this.errorHistory.length > 100) {
      this.errorHistory = this.errorHistory.slice(-50);
    }
  }

  private logError(error: DataPilotError): void {
    const message = error.getFormattedMessage();
    const suggestions = error.getSuggestions();

    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
        logger.error(message);
        break;
      case ErrorSeverity.HIGH:
        logger.error(message);
        break;
      case ErrorSeverity.MEDIUM:
        logger.warn(message);
        break;
      case ErrorSeverity.LOW:
        logger.info(message);
        break;
    }

    if (suggestions.length > 0) {
      logger.info('Suggestions:');
      suggestions.forEach((suggestion) => logger.info(suggestion));
    }
  }

  private async applyRecoveryStrategy<T>(
    error: DataPilotError,
    operation: () => Promise<T>,
    strategy: ErrorRecoveryStrategy,
  ): Promise<T | null> {
    switch (strategy.strategy) {
      case 'retry':
        return await this.retryOperation(
          operation,
          strategy.maxRetries || this.config.maxRetries,
          strategy.retryDelay || this.config.retryDelayMs,
        );

      case 'fallback':
        this.stats.recoveredErrors++;
        return strategy.fallbackValue as T;

      case 'skip':
        this.stats.recoveredErrors++;
        return null;

      case 'continue':
        this.stats.recoveredErrors++;
        logger.warn(`Continuing despite error: ${error.message}`);
        return null;

      case 'abort':
        throw error;

      default:
        throw error;
    }
  }

  private async retryOperation<T>(
    operation: () => Promise<T>,
    maxRetries: number,
    delayMs: number,
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await operation();
        if (attempt > 1) {
          this.stats.recoveredErrors++;
          logger.info(`Operation succeeded on attempt ${attempt}`);
        }
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');

        if (attempt < maxRetries) {
          logger.warn(`Operation failed on attempt ${attempt}, retrying in ${delayMs}ms...`);
          await this.delay(delayMs);
          delayMs *= 1.5; // Exponential backoff
        }
      }
    }

    throw lastError;
  }

  private getDefaultRecoveryStrategy(error: DataPilotError): ErrorRecoveryStrategy | null {
    switch (error.category) {
      case ErrorCategory.MEMORY:
        return { strategy: 'abort' }; // Memory errors should generally abort

      case ErrorCategory.PARSING:
        if (error.code === 'ENCODING_DETECTION_FAILED') {
          return { strategy: 'fallback', fallbackValue: 'utf8' };
        }
        return { strategy: 'skip' }; // Skip malformed rows

      case ErrorCategory.ANALYSIS:
        return { strategy: 'continue' }; // Continue with reduced functionality

      case ErrorCategory.NETWORK:
        return { strategy: 'retry', maxRetries: 3, retryDelay: 1000 };

      case ErrorCategory.IO:
        return { strategy: 'retry', maxRetries: 2, retryDelay: 500 };

      default:
        return null;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Global error handler instance
export const globalErrorHandler = new ErrorHandler();

/**
 * Utility functions for common error scenarios
 */
export class ErrorUtils {
  /**
   * Handle CSV parsing errors with recovery
   */
  static async handleParsingError(
    error: unknown,
    filePath: string,
    retryWithFallback: () => Promise<any>,
  ): Promise<any> {
    let dataPilotError: DataPilotError;

    if (error instanceof DataPilotError) {
      dataPilotError = error;
    } else {
      const errorMessage = error instanceof Error ? error.message : 'Unknown parsing error';
      dataPilotError = globalErrorHandler.createFileCorruptionError(filePath, errorMessage);
    }

    return await globalErrorHandler.handleError(dataPilotError, retryWithFallback, {
      strategy: 'retry',
      maxRetries: 2,
    });
  }

  /**
   * Handle insufficient data scenarios
   */
  static handleInsufficientData<T>(
    actualCount: number,
    minimumRequired: number,
    context: ErrorContext,
    fallbackValue?: T,
  ): T {
    if (actualCount >= minimumRequired) {
      return fallbackValue; // Not actually an error
    }

    const error = globalErrorHandler.createInsufficientDataError(
      context,
      minimumRequired,
      actualCount,
    );

    return globalErrorHandler.handleErrorSync(
      error,
      () => {
        throw error; // Force fallback
      },
      fallbackValue,
    );
  }

  /**
   * Validate and clean data array
   */
  static validateDataArray(data: any[], context: ErrorContext): any[] {
    if (!Array.isArray(data)) {
      throw DataPilotError.validation(
        'Expected array data format',
        'INVALID_DATA_FORMAT',
        context,
        [
          {
            action: 'Check data source',
            description: 'Ensure data is properly formatted as an array',
            severity: ErrorSeverity.HIGH,
          },
        ],
      );
    }

    if (data.length === 0) {
      throw globalErrorHandler.createInsufficientDataError(context, 1, 0);
    }

    return data.filter((row) => row !== null && row !== undefined);
  }

  /**
   * Safe numeric conversion with error handling
   */
  static safeToNumber(value: unknown, defaultValue: number = 0): number {
    if (typeof value === 'number' && isFinite(value)) {
      return value;
    }

    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      if (isFinite(parsed)) {
        return parsed;
      }
    }

    return defaultValue;
  }

  /**
   * Safe property access with error handling
   */
  static safeGet<T>(obj: any, path: string, defaultValue?: T): T | undefined {
    try {
      const keys = path.split('.');
      let current = obj;

      for (const key of keys) {
        if (current === null || current === undefined) {
          return defaultValue;
        }
        current = current[key];
      }

      return current as T;
    } catch {
      return defaultValue;
    }
  }
}
