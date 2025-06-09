/**
 * Simple logger utility for DataPilot
 */
export declare enum LogLevel {
    ERROR = 0,
    WARN = 1,
    INFO = 2,
    DEBUG = 3,
    TRACE = 4
}
export interface LogContext {
    section?: string;
    analyzer?: string;
    filePath?: string;
    rowIndex?: number;
    operation?: string;
    timestamp?: Date;
    memoryUsage?: number;
    errorCode?: string;
    error?: string;
}
export interface LogEntry {
    level: LogLevel;
    message: string;
    context?: LogContext;
    timestamp: Date;
    args?: unknown[];
}
export declare class Logger {
    private static instance;
    private level;
    private logHistory;
    private maxHistorySize;
    private enableHistory;
    private constructor();
    static getInstance(): Logger;
    setLevel(level: LogLevel): void;
    error(message: string, context?: LogContext, ...args: unknown[]): void;
    warn(message: string, context?: LogContext, ...args: unknown[]): void;
    info(message: string, context?: LogContext, ...args: unknown[]): void;
    debug(message: string, context?: LogContext, ...args: unknown[]): void;
    progress(message: string, context?: LogContext): void;
    success(message: string, context?: LogContext): void;
    trace(message: string, context?: LogContext, ...args: unknown[]): void;
    /**
     * Log performance metrics
     */
    performance(operation: string, duration: number, context?: LogContext): void;
    /**
     * Log memory usage
     */
    memory(context?: LogContext): void;
    /**
     * Log error with stack trace and context
     */
    errorWithStack(error: Error, context?: LogContext): void;
    /**
     * Get recent log entries
     */
    getRecentLogs(level?: LogLevel, limit?: number): LogEntry[];
    /**
     * Get error summary for debugging
     */
    getErrorSummary(): {
        errorCount: number;
        warningCount: number;
        recentErrors: LogEntry[];
    };
    /**
     * Enable or disable log history
     */
    setHistoryEnabled(enabled: boolean): void;
    /**
     * Clear log history
     */
    clearHistory(): void;
    /**
     * Export logs for debugging
     */
    exportLogs(): string;
    newline(): void;
    private formatContext;
    private addToHistory;
}
export declare const logger: Logger;
/**
 * Utility functions for structured logging
 */
export declare class LogUtils {
    /**
     * Create a logger context for a specific operation
     */
    static createContext(section?: string, analyzer?: string, filePath?: string, operation?: string): LogContext;
    /**
     * Log operation start
     */
    static logOperationStart(operation: string, context?: LogContext): Date;
    /**
     * Log operation end with duration
     */
    static logOperationEnd(operation: string, startTime: Date, context?: LogContext): void;
    /**
     * Create a scoped logger that automatically includes context
     */
    static createScopedLogger(context: LogContext): {
        error: (message: string, ...args: unknown[]) => void;
        warn: (message: string, ...args: unknown[]) => void;
        info: (message: string, ...args: unknown[]) => void;
        debug: (message: string, ...args: unknown[]) => void;
        trace: (message: string, ...args: unknown[]) => void;
    };
}
//# sourceMappingURL=logger.d.ts.map