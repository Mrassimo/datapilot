/**
 * Comprehensive error handling and recovery system for DataPilot
 */
import type { ErrorContext, ErrorRecoveryStrategy } from '../core/types';
import { DataPilotError, ErrorSeverity, ErrorCategory } from '../core/types';
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
export declare class ErrorHandler {
    private config;
    private stats;
    private errorHistory;
    constructor(config?: Partial<ErrorHandlerConfig>);
    /**
     * Handle an error with recovery strategies
     */
    handleError<T>(error: DataPilotError, operation: () => Promise<T>, recoveryStrategy?: ErrorRecoveryStrategy): Promise<T | null>;
    /**
     * Handle synchronous errors
     */
    handleErrorSync<T>(error: DataPilotError, operation: () => T, fallbackValue?: T): T | null;
    /**
     * Validate configuration parameters
     */
    validateConfig(config: Record<string, unknown>, schema: Record<string, string>): DataPilotError[];
    /**
     * Check memory usage and throw error if threshold exceeded
     */
    checkMemoryUsage(context?: ErrorContext): void;
    /**
     * Create error with file corruption recovery suggestions
     */
    createFileCorruptionError(filePath: string, details: string): DataPilotError;
    /**
     * Create error for insufficient data
     */
    createInsufficientDataError(context: ErrorContext, minRequired: number, actual: number): DataPilotError;
    /**
     * Wrap operation with automatic error handling
     */
    wrapOperation<T>(operation: () => Promise<T>, operationName: string, context?: ErrorContext, recoveryStrategy?: ErrorRecoveryStrategy): Promise<T | null>;
    /**
     * Get error statistics
     */
    getStats(): ErrorStats;
    /**
     * Get recent errors
     */
    getRecentErrors(limit?: number): DataPilotError[];
    /**
     * Clear error history and reset stats
     */
    reset(): void;
    private recordError;
    private logError;
    private applyRecoveryStrategy;
    private retryOperation;
    private getDefaultRecoveryStrategy;
    private delay;
}
export declare const globalErrorHandler: ErrorHandler;
/**
 * Utility functions for common error scenarios
 */
export declare class ErrorUtils {
    /**
     * Handle CSV parsing errors with recovery
     */
    static handleParsingError(error: unknown, filePath: string, retryWithFallback: () => Promise<any>): Promise<any>;
    /**
     * Handle insufficient data scenarios
     */
    static handleInsufficientData<T>(actualCount: number, minimumRequired: number, context: ErrorContext, fallbackValue?: T): T;
    /**
     * Validate and clean data array
     */
    static validateDataArray(data: any[], context: ErrorContext): any[];
    /**
     * Safe numeric conversion with error handling
     */
    static safeToNumber(value: unknown, defaultValue?: number): number;
    /**
     * Safe property access with error handling
     */
    static safeGet<T>(obj: any, path: string, defaultValue?: T): T | undefined;
}
//# sourceMappingURL=error-handler.d.ts.map