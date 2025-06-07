/**
 * Simple logger utility for DataPilot
 */

/* eslint-disable no-console */

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
  TRACE = 4,
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
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  context?: LogContext;
  timestamp: Date;
  args?: unknown[];
}

export class Logger {
  private static instance: Logger;
  private level: LogLevel = LogLevel.INFO;
  private logHistory: LogEntry[] = [];
  private maxHistorySize = 1000;
  private enableHistory = process.env.NODE_ENV === 'development';

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  error(message: string, context?: LogContext, ...args: unknown[]): void {
    const entry: LogEntry = {
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

  warn(message: string, context?: LogContext, ...args: unknown[]): void {
    const entry: LogEntry = {
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

  info(message: string, context?: LogContext, ...args: unknown[]): void {
    const entry: LogEntry = {
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

  debug(message: string, context?: LogContext, ...args: unknown[]): void {
    const entry: LogEntry = {
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

  progress(message: string, context?: LogContext): void {
    if (this.level >= LogLevel.INFO) {
      const contextStr = this.formatContext(context);
      process.stdout.write(`\r⏳ ${message}${contextStr}`);
    }
  }

  success(message: string, context?: LogContext): void {
    if (this.level >= LogLevel.INFO) {
      const contextStr = this.formatContext(context);
      console.log(`\r✅ ${message}${contextStr}`);
    }
  }

  trace(message: string, context?: LogContext, ...args: unknown[]): void {
    const entry: LogEntry = {
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
  performance(operation: string, duration: number, context?: LogContext): void {
    const perfContext = {
      ...context,
      operation,
      timestamp: new Date(),
    };
    
    if (duration > 5000) {
      this.warn(`Slow operation: ${operation} took ${duration}ms`, perfContext);
    } else if (duration > 1000) {
      this.info(`Operation completed: ${operation} took ${duration}ms`, perfContext);
    } else {
      this.debug(`Operation completed: ${operation} took ${duration}ms`, perfContext);
    }
  }

  /**
   * Log memory usage
   */
  memory(context?: LogContext): void {
    const memUsage = process.memoryUsage();
    const memContext = {
      ...context,
      memoryUsage: memUsage.heapUsed,
    };
    
    const heapMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    const rssMode = Math.round(memUsage.rss / 1024 / 1024);
    
    if (heapMB > 512) {
      this.warn(`High memory usage: ${heapMB}MB heap, ${rssMode}MB RSS`, memContext);
    } else {
      this.debug(`Memory usage: ${heapMB}MB heap, ${rssMode}MB RSS`, memContext);
    }
  }

  /**
   * Log error with stack trace and context
   */
  errorWithStack(error: Error, context?: LogContext): void {
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
  getRecentLogs(level?: LogLevel, limit?: number): LogEntry[] {
    let filtered = this.logHistory;
    
    if (level !== undefined) {
      filtered = filtered.filter(entry => entry.level <= level);
    }
    
    if (limit) {
      filtered = filtered.slice(-limit);
    }
    
    return filtered;
  }

  /**
   * Get error summary for debugging
   */
  getErrorSummary(): { errorCount: number; warningCount: number; recentErrors: LogEntry[] } {
    const errors = this.logHistory.filter(entry => entry.level === LogLevel.ERROR);
    const warnings = this.logHistory.filter(entry => entry.level === LogLevel.WARN);
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
  setHistoryEnabled(enabled: boolean): void {
    this.enableHistory = enabled;
    if (!enabled) {
      this.logHistory = [];
    }
  }

  /**
   * Clear log history
   */
  clearHistory(): void {
    this.logHistory = [];
  }

  /**
   * Export logs for debugging
   */
  exportLogs(): string {
    return JSON.stringify(this.logHistory, null, 2);
  }

  newline(): void {
    console.log();
  }

  private formatContext(context?: LogContext): string {
    if (!context) return '';
    
    const parts: string[] = [];
    
    if (context.section) parts.push(`section:${context.section}`);
    if (context.analyzer) parts.push(`analyzer:${context.analyzer}`);
    if (context.operation) parts.push(`op:${context.operation}`);
    if (context.filePath) {
      // Show only filename for brevity
      const filename = context.filePath.split('/').pop() || context.filePath;
      parts.push(`file:${filename}`);
    }
    if (context.rowIndex !== undefined) parts.push(`row:${context.rowIndex}`);
    if (context.memoryUsage) {
      const memMB = Math.round(context.memoryUsage / 1024 / 1024);
      parts.push(`mem:${memMB}MB`);
    }
    
    return parts.length > 0 ? ` [${parts.join(', ')}]` : '';
  }

  private addToHistory(entry: LogEntry): void {
    if (!this.enableHistory) return;
    
    this.logHistory.push(entry);
    
    // Trim history if it gets too large
    if (this.logHistory.length > this.maxHistorySize) {
      this.logHistory = this.logHistory.slice(-Math.floor(this.maxHistorySize * 0.8));
    }
  }
}

export const logger = Logger.getInstance();

/**
 * Utility functions for structured logging
 */
export class LogUtils {
  /**
   * Create a logger context for a specific operation
   */
  static createContext(
    section?: string,
    analyzer?: string,
    filePath?: string,
    operation?: string
  ): LogContext {
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
  static logOperationStart(operation: string, context?: LogContext): Date {
    const startTime = new Date();
    logger.debug(`Starting operation: ${operation}`, { ...context, operation });
    return startTime;
  }

  /**
   * Log operation end with duration
   */
  static logOperationEnd(operation: string, startTime: Date, context?: LogContext): void {
    const duration = Date.now() - startTime.getTime();
    logger.performance(operation, duration, context);
  }

  /**
   * Create a scoped logger that automatically includes context
   */
  static createScopedLogger(context: LogContext) {
    return {
      error: (message: string, ...args: unknown[]) => logger.error(message, context, ...args),
      warn: (message: string, ...args: unknown[]) => logger.warn(message, context, ...args),
      info: (message: string, ...args: unknown[]) => logger.info(message, context, ...args),
      debug: (message: string, ...args: unknown[]) => logger.debug(message, context, ...args),
      trace: (message: string, ...args: unknown[]) => logger.trace(message, context, ...args),
    };
  }
}
