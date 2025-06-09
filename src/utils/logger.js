"use strict";
/**
 * Simple logger utility for DataPilot
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogUtils = exports.logger = exports.Logger = exports.LogLevel = void 0;
/* eslint-disable no-console */
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["ERROR"] = 0] = "ERROR";
    LogLevel[LogLevel["WARN"] = 1] = "WARN";
    LogLevel[LogLevel["INFO"] = 2] = "INFO";
    LogLevel[LogLevel["DEBUG"] = 3] = "DEBUG";
    LogLevel[LogLevel["TRACE"] = 4] = "TRACE";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
class Logger {
    static instance;
    level = LogLevel.INFO;
    logHistory = [];
    maxHistorySize = 1000;
    enableHistory = process.env.NODE_ENV === 'development';
    constructor() { }
    static getInstance() {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }
    setLevel(level) {
        this.level = level;
    }
    error(message, context, ...args) {
        const entry = {
            level: LogLevel.ERROR,
            message,
            context,
            timestamp: new Date(),
            args,
        };
        this.addToHistory(entry);
        if (this.level >= LogLevel.ERROR) {
            const contextStr = this.formatContext(context);
            console.error(`❌ ERROR: ${message}${contextStr}`, ...args);
        }
    }
    warn(message, context, ...args) {
        const entry = {
            level: LogLevel.WARN,
            message,
            context,
            timestamp: new Date(),
            args,
        };
        this.addToHistory(entry);
        if (this.level >= LogLevel.WARN) {
            const contextStr = this.formatContext(context);
            console.warn(`⚠️  WARN: ${message}${contextStr}`, ...args);
        }
    }
    info(message, context, ...args) {
        const entry = {
            level: LogLevel.INFO,
            message,
            context,
            timestamp: new Date(),
            args,
        };
        this.addToHistory(entry);
        if (this.level >= LogLevel.INFO) {
            const contextStr = this.formatContext(context);
            console.log(`ℹ️  INFO: ${message}${contextStr}`, ...args);
        }
    }
    debug(message, context, ...args) {
        const entry = {
            level: LogLevel.DEBUG,
            message,
            context,
            timestamp: new Date(),
            args,
        };
        this.addToHistory(entry);
        if (this.level >= LogLevel.DEBUG) {
            const contextStr = this.formatContext(context);
            console.log(`🐛 DEBUG: ${message}${contextStr}`, ...args);
        }
    }
    progress(message, context) {
        if (this.level >= LogLevel.INFO) {
            const contextStr = this.formatContext(context);
            process.stdout.write(`\r⏳ ${message}${contextStr}`);
        }
    }
    success(message, context) {
        if (this.level >= LogLevel.INFO) {
            const contextStr = this.formatContext(context);
            console.log(`\r✅ ${message}${contextStr}`);
        }
    }
    trace(message, context, ...args) {
        const entry = {
            level: LogLevel.TRACE,
            message,
            context,
            timestamp: new Date(),
            args,
        };
        this.addToHistory(entry);
        if (this.level >= LogLevel.TRACE) {
            const contextStr = this.formatContext(context);
            console.log(`🔍 TRACE: ${message}${contextStr}`, ...args);
        }
    }
    /**
     * Log performance metrics
     */
    performance(operation, duration, context) {
        const perfContext = {
            ...context,
            operation,
            timestamp: new Date(),
        };
        if (duration > 5000) {
            this.warn(`Slow operation: ${operation} took ${duration}ms`, perfContext);
        }
        else if (duration > 1000) {
            this.info(`Operation completed: ${operation} took ${duration}ms`, perfContext);
        }
        else {
            this.debug(`Operation completed: ${operation} took ${duration}ms`, perfContext);
        }
    }
    /**
     * Log memory usage
     */
    memory(context) {
        const memUsage = process.memoryUsage();
        const memContext = {
            ...context,
            memoryUsage: memUsage.heapUsed,
        };
        const heapMB = Math.round(memUsage.heapUsed / 1024 / 1024);
        const rssMode = Math.round(memUsage.rss / 1024 / 1024);
        if (heapMB > 512) {
            this.warn(`High memory usage: ${heapMB}MB heap, ${rssMode}MB RSS`, memContext);
        }
        else {
            this.debug(`Memory usage: ${heapMB}MB heap, ${rssMode}MB RSS`, memContext);
        }
    }
    /**
     * Log error with stack trace and context
     */
    errorWithStack(error, context) {
        const errorContext = {
            ...context,
            errorCode: error.name,
        };
        this.error(error.message, errorContext);
        if (this.level >= LogLevel.DEBUG && error.stack) {
            console.error('Stack trace:');
            console.error(error.stack);
        }
    }
    /**
     * Get recent log entries
     */
    getRecentLogs(level, limit) {
        let filtered = this.logHistory;
        if (level !== undefined) {
            filtered = filtered.filter((entry) => entry.level <= level);
        }
        if (limit) {
            filtered = filtered.slice(-limit);
        }
        return filtered;
    }
    /**
     * Get error summary for debugging
     */
    getErrorSummary() {
        const errors = this.logHistory.filter((entry) => entry.level === LogLevel.ERROR);
        const warnings = this.logHistory.filter((entry) => entry.level === LogLevel.WARN);
        const recentErrors = errors.slice(-10);
        return {
            errorCount: errors.length,
            warningCount: warnings.length,
            recentErrors,
        };
    }
    /**
     * Enable or disable log history
     */
    setHistoryEnabled(enabled) {
        this.enableHistory = enabled;
        if (!enabled) {
            this.logHistory = [];
        }
    }
    /**
     * Clear log history
     */
    clearHistory() {
        this.logHistory = [];
    }
    /**
     * Export logs for debugging
     */
    exportLogs() {
        return JSON.stringify(this.logHistory, null, 2);
    }
    newline() {
        console.log();
    }
    formatContext(context) {
        if (!context)
            return '';
        const parts = [];
        if (context.section)
            parts.push(`section:${context.section}`);
        if (context.analyzer)
            parts.push(`analyzer:${context.analyzer}`);
        if (context.operation)
            parts.push(`op:${context.operation}`);
        if (context.filePath) {
            // Show only filename for brevity
            const filename = context.filePath.split('/').pop() || context.filePath;
            parts.push(`file:${filename}`);
        }
        if (context.rowIndex !== undefined)
            parts.push(`row:${context.rowIndex}`);
        if (context.memoryUsage) {
            const memMB = Math.round(context.memoryUsage / 1024 / 1024);
            parts.push(`mem:${memMB}MB`);
        }
        return parts.length > 0 ? ` [${parts.join(', ')}]` : '';
    }
    addToHistory(entry) {
        if (!this.enableHistory)
            return;
        this.logHistory.push(entry);
        // Trim history if it gets too large
        if (this.logHistory.length > this.maxHistorySize) {
            this.logHistory = this.logHistory.slice(-Math.floor(this.maxHistorySize * 0.8));
        }
    }
}
exports.Logger = Logger;
exports.logger = Logger.getInstance();
/**
 * Utility functions for structured logging
 */
class LogUtils {
    /**
     * Create a logger context for a specific operation
     */
    static createContext(section, analyzer, filePath, operation) {
        return {
            section,
            analyzer,
            filePath,
            operation,
            timestamp: new Date(),
        };
    }
    /**
     * Log operation start
     */
    static logOperationStart(operation, context) {
        const startTime = new Date();
        exports.logger.debug(`Starting operation: ${operation}`, { ...context, operation });
        return startTime;
    }
    /**
     * Log operation end with duration
     */
    static logOperationEnd(operation, startTime, context) {
        const duration = Date.now() - startTime.getTime();
        exports.logger.performance(operation, duration, context);
    }
    /**
     * Create a scoped logger that automatically includes context
     */
    static createScopedLogger(context) {
        return {
            error: (message, ...args) => exports.logger.error(message, context, ...args),
            warn: (message, ...args) => exports.logger.warn(message, context, ...args),
            info: (message, ...args) => exports.logger.info(message, context, ...args),
            debug: (message, ...args) => exports.logger.debug(message, context, ...args),
            trace: (message, ...args) => exports.logger.trace(message, context, ...args),
        };
    }
}
exports.LogUtils = LogUtils;
//# sourceMappingURL=logger.js.map