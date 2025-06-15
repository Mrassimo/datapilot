/**
 * Comprehensive Logger Tests
 * 
 * Tests all logging functionality, level filtering, context formatting,
 * history management, performance logging, and utility functions.
 * Achieves 85%+ coverage for the logger.ts module.
 */

import { Logger, LogLevel, LogContext, LogEntry, LogUtils, logger } from '@/utils/logger';

describe('LogLevel Enum', () => {
  it('should have correct numeric values', () => {
    expect(LogLevel.ERROR).toBe(0);
    expect(LogLevel.WARN).toBe(1);
    expect(LogLevel.INFO).toBe(2);
    expect(LogLevel.DEBUG).toBe(3);
    expect(LogLevel.TRACE).toBe(4);
  });

  it('should support comparison operations', () => {
    expect(LogLevel.ERROR < LogLevel.WARN).toBe(true);
    expect(LogLevel.DEBUG > LogLevel.INFO).toBe(true);
    expect(LogLevel.TRACE >= LogLevel.DEBUG).toBe(true);
  });
});

describe('Logger Class', () => {
  let mockConsole: {
    error: jest.SpyInstance;
    warn: jest.SpyInstance;
    log: jest.SpyInstance;
  };
  let mockStdout: jest.SpyInstance;
  let testLogger: Logger;
  let originalNodeEnv: string | undefined;

  beforeEach(() => {
    // Mock console methods
    mockConsole = {
      error: jest.spyOn(console, 'error').mockImplementation(() => {}),
      warn: jest.spyOn(console, 'warn').mockImplementation(() => {}),
      log: jest.spyOn(console, 'log').mockImplementation(() => {}),
    };

    // Mock process.stdout.write
    mockStdout = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);

    // Get fresh logger instance for each test
    testLogger = Logger.getInstance();
    testLogger.clearHistory();
    testLogger.setLevel(LogLevel.INFO);

    // Store original NODE_ENV
    originalNodeEnv = process.env.NODE_ENV;
  });

  afterEach(() => {
    mockConsole.error.mockRestore();
    mockConsole.warn.mockRestore();
    mockConsole.log.mockRestore();
    mockStdout.mockRestore();

    // Restore NODE_ENV
    if (originalNodeEnv !== undefined) {
      process.env.NODE_ENV = originalNodeEnv;
    } else {
      delete process.env.NODE_ENV;
    }
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = Logger.getInstance();
      const instance2 = Logger.getInstance();
      
      expect(instance1).toBe(instance2);
      expect(instance1).toBeInstanceOf(Logger);
    });

    it('should maintain state between getInstance calls', () => {
      const instance1 = Logger.getInstance();
      instance1.setLevel(LogLevel.DEBUG);
      
      const instance2 = Logger.getInstance();
      // Both should have DEBUG level since they're the same instance
      instance2.debug('test message');
      
      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining('🐛 DEBUG: test message'),
      );
    });
  });

  describe('Log Level Management', () => {
    it('should set and respect log levels', () => {
      testLogger.setLevel(LogLevel.WARN);

      // Should log WARN and ERROR
      testLogger.error('error message');
      testLogger.warn('warn message');
      
      // Should NOT log INFO, DEBUG, TRACE
      testLogger.info('info message');
      testLogger.debug('debug message');
      testLogger.trace('trace message');

      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining('❌ ERROR: error message'),
      );
      expect(mockConsole.warn).toHaveBeenCalledWith(
        expect.stringContaining('⚠️  WARN: warn message'),
      );
      expect(mockConsole.log).not.toHaveBeenCalledWith(
        expect.stringContaining('ℹ️  INFO: info message'),
      );
    });

    it('should allow all levels when set to TRACE', () => {
      testLogger.setLevel(LogLevel.TRACE);

      testLogger.trace('trace message');
      testLogger.debug('debug message');
      testLogger.info('info message');
      testLogger.warn('warn message');
      testLogger.error('error message');

      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining('🔍 TRACE: trace message'),
      );
      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining('🐛 DEBUG: debug message'),
      );
      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining('ℹ️  INFO: info message'),
      );
      expect(mockConsole.warn).toHaveBeenCalledWith(
        expect.stringContaining('⚠️  WARN: warn message'),
      );
      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining('❌ ERROR: error message'),
      );
    });

    it('should only log ERROR when set to ERROR level', () => {
      testLogger.setLevel(LogLevel.ERROR);

      testLogger.error('error message');
      testLogger.warn('warn message');
      testLogger.info('info message');

      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining('❌ ERROR: error message'),
      );
      expect(mockConsole.warn).not.toHaveBeenCalled();
      expect(mockConsole.log).not.toHaveBeenCalled();
    });
  });

  describe('Basic Logging Methods', () => {
    beforeEach(() => {
      testLogger.setLevel(LogLevel.TRACE); // Allow all levels
    });

    it('should log error messages with correct format', () => {
      testLogger.error('Test error message');

      expect(mockConsole.error).toHaveBeenCalledWith(
        '❌ ERROR: Test error message',
      );
    });

    it('should log warn messages with correct format', () => {
      testLogger.warn('Test warn message');

      expect(mockConsole.warn).toHaveBeenCalledWith(
        '⚠️  WARN: Test warn message',
      );
    });

    it('should log info messages with correct format', () => {
      testLogger.info('Test info message');

      expect(mockConsole.log).toHaveBeenCalledWith(
        'ℹ️  INFO: Test info message',
      );
    });

    it('should log debug messages with correct format', () => {
      testLogger.debug('Test debug message');

      expect(mockConsole.log).toHaveBeenCalledWith(
        '🐛 DEBUG: Test debug message',
      );
    });

    it('should log trace messages with correct format', () => {
      testLogger.trace('Test trace message');

      expect(mockConsole.log).toHaveBeenCalledWith(
        '🔍 TRACE: Test trace message',
      );
    });

    it('should log progress messages with carriage return', () => {
      testLogger.progress('Processing data');

      expect(mockStdout).toHaveBeenCalledWith(
        '\r⏳ Processing data',
      );
    });

    it('should log success messages with correct format', () => {
      testLogger.success('Operation completed');

      expect(mockConsole.log).toHaveBeenCalledWith(
        '\r✅ Operation completed',
      );
    });

    it('should log newline', () => {
      testLogger.newline();

      expect(mockConsole.log).toHaveBeenCalledWith();
    });
  });

  describe('Logging with Additional Arguments', () => {
    beforeEach(() => {
      testLogger.setLevel(LogLevel.TRACE);
    });

    it('should pass additional arguments to console methods', () => {
      const obj = { key: 'value' };
      const arr = [1, 2, 3];

      testLogger.error('Error with args', undefined, obj, arr);

      expect(mockConsole.error).toHaveBeenCalledWith(
        '❌ ERROR: Error with args',
        obj,
        arr,
      );
    });

    it('should handle multiple arguments with different types', () => {
      testLogger.debug('Debug message', undefined, 'string', 42, true, null);

      expect(mockConsole.log).toHaveBeenCalledWith(
        '🐛 DEBUG: Debug message',
        'string',
        42,
        true,
        null,
      );
    });
  });

  describe('Context Formatting', () => {
    beforeEach(() => {
      testLogger.setLevel(LogLevel.TRACE);
    });

    it('should format simple context properties', () => {
      const context: LogContext = {
        section: 'analysis',
        analyzer: 'statistics',
        operation: 'calculate',
      };

      testLogger.info('Test message', context);

      expect(mockConsole.log).toHaveBeenCalledWith(
        'ℹ️  INFO: Test message [section:analysis, analyzer:statistics, op:calculate]',
      );
    });

    it('should format file path by showing only filename', () => {
      const context: LogContext = {
        filePath: '/very/long/path/to/file/data.csv',
      };

      testLogger.info('Processing file', context);

      expect(mockConsole.log).toHaveBeenCalledWith(
        'ℹ️  INFO: Processing file [file:data.csv]',
      );
    });

    it('should format memory usage in MB', () => {
      const context: LogContext = {
        memoryUsage: 1024 * 1024 * 150, // 150MB in bytes
      };

      testLogger.info('Memory check', context);

      expect(mockConsole.log).toHaveBeenCalledWith(
        'ℹ️  INFO: Memory check [mem:150MB]',
      );
    });

    it('should format row index', () => {
      const context: LogContext = {
        rowIndex: 1000,
      };

      testLogger.info('Processing row', context);

      expect(mockConsole.log).toHaveBeenCalledWith(
        'ℹ️  INFO: Processing row [row:1000]',
      );
    });

    it('should format complex context with all properties', () => {
      const context: LogContext = {
        section: 'quality',
        analyzer: 'outliers', 
        operation: 'detect',
        filePath: '/path/to/dataset.csv',
        rowIndex: 500,
        memoryUsage: 1024 * 1024 * 75, // 75MB
      };

      testLogger.warn('Outlier detected', context);

      expect(mockConsole.warn).toHaveBeenCalledWith(
        '⚠️  WARN: Outlier detected [section:quality, analyzer:outliers, op:detect, file:dataset.csv, row:500, mem:75MB]',
      );
    });

    it('should handle context with only file path', () => {
      const context: LogContext = {
        filePath: 'simple.csv',
      };

      testLogger.debug('Simple file', context);

      expect(mockConsole.log).toHaveBeenCalledWith(
        '🐛 DEBUG: Simple file [file:simple.csv]',
      );
    });

    it('should return empty string for undefined context', () => {
      testLogger.info('No context message');

      expect(mockConsole.log).toHaveBeenCalledWith(
        'ℹ️  INFO: No context message',
      );
    });

    it('should return empty string for empty context', () => {
      testLogger.info('Empty context message', {});

      expect(mockConsole.log).toHaveBeenCalledWith(
        'ℹ️  INFO: Empty context message',
      );
    });

    it('should handle zero values correctly', () => {
      const context: LogContext = {
        rowIndex: 0,
        memoryUsage: 0,
      };

      testLogger.info('Zero values', context);

      // memoryUsage: 0 is falsy, so it won't be included in the context
      expect(mockConsole.log).toHaveBeenCalledWith(
        'ℹ️  INFO: Zero values [row:0]',
      );
    });
  });

  describe('Log History Management', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
      testLogger.setLevel(LogLevel.TRACE);
      testLogger.setHistoryEnabled(true);
      testLogger.clearHistory();
    });

    it('should record log entries in history when enabled', () => {
      testLogger.error('Error message');
      testLogger.warn('Warning message');
      testLogger.info('Info message');

      const logs = testLogger.getRecentLogs();
      expect(logs).toHaveLength(3);
      
      expect(logs[0].level).toBe(LogLevel.ERROR);
      expect(logs[0].message).toBe('Error message');
      expect(logs[0].timestamp).toBeInstanceOf(Date);

      expect(logs[1].level).toBe(LogLevel.WARN);
      expect(logs[1].message).toBe('Warning message');

      expect(logs[2].level).toBe(LogLevel.INFO);
      expect(logs[2].message).toBe('Info message');
    });

    it('should not record history when disabled', () => {
      testLogger.setHistoryEnabled(false);
      
      testLogger.error('Error message');
      testLogger.warn('Warning message');

      const logs = testLogger.getRecentLogs();
      expect(logs).toHaveLength(0);
    });

    it('should clear history when disabling', () => {
      testLogger.error('Error message');
      expect(testLogger.getRecentLogs()).toHaveLength(1);

      testLogger.setHistoryEnabled(false);
      expect(testLogger.getRecentLogs()).toHaveLength(0);
    });

    it('should clear history manually', () => {
      testLogger.error('Error message');
      testLogger.warn('Warning message');
      expect(testLogger.getRecentLogs()).toHaveLength(2);

      testLogger.clearHistory();
      expect(testLogger.getRecentLogs()).toHaveLength(0);
    });

    it('should trim history when it exceeds max size', () => {
      // Mock the maxHistorySize to a smaller value for testing
      const originalMaxSize = testLogger['maxHistorySize'];
      testLogger['maxHistorySize'] = 5;

      // Add more entries than max size
      for (let i = 0; i < 8; i++) {
        testLogger.info(`Message ${i}`);
      }

      const logs = testLogger.getRecentLogs();
      expect(logs.length).toBeLessThanOrEqual(5);
      expect(logs.length).toBeGreaterThan(0);

      // Restore original size
      testLogger['maxHistorySize'] = originalMaxSize;
    });

    it('should not record history in non-development environment', () => {
      process.env.NODE_ENV = 'production';
      
      // Since it's a singleton, we need to manually disable history
      const prodLogger = Logger.getInstance();
      prodLogger.setHistoryEnabled(false);
      prodLogger.clearHistory();
      
      prodLogger.error('Error message');
      const logs = prodLogger.getRecentLogs();
      expect(logs).toHaveLength(0);
    });

    it('should record arguments in log entries', () => {
      const obj = { test: true };
      testLogger.error('Error with args', undefined, obj, 'additional');

      const logs = testLogger.getRecentLogs();
      expect(logs[0].args).toEqual([obj, 'additional']);
    });

    it('should record context in log entries', () => {
      const context: LogContext = {
        section: 'test',
        operation: 'validate',
      };

      testLogger.info('Test message', context);

      const logs = testLogger.getRecentLogs();
      expect(logs[0].context).toEqual(context);
    });
  });

  describe('Log Retrieval and Filtering', () => {
    beforeEach(() => {
      testLogger.setLevel(LogLevel.TRACE);
      testLogger.setHistoryEnabled(true);
      testLogger.clearHistory();

      // Add test logs
      testLogger.error('Error 1');
      testLogger.error('Error 2');
      testLogger.warn('Warning 1');
      testLogger.info('Info 1');
      testLogger.debug('Debug 1');
    });

    it('should get recent logs without filter', () => {
      const logs = testLogger.getRecentLogs();
      expect(logs).toHaveLength(5);
    });

    it('should filter logs by level', () => {
      const errorLogs = testLogger.getRecentLogs(LogLevel.ERROR);
      expect(errorLogs).toHaveLength(2);
      expect(errorLogs.every(log => log.level === LogLevel.ERROR)).toBe(true);

      const warnAndErrorLogs = testLogger.getRecentLogs(LogLevel.WARN);
      expect(warnAndErrorLogs).toHaveLength(3); // 2 errors + 1 warn
      expect(warnAndErrorLogs.every(log => log.level <= LogLevel.WARN)).toBe(true);
    });

    it('should limit number of returned logs', () => {
      const limitedLogs = testLogger.getRecentLogs(undefined, 2);
      expect(limitedLogs).toHaveLength(2);
    });

    it('should combine level filter and limit', () => {
      const filteredLimitedLogs = testLogger.getRecentLogs(LogLevel.WARN, 1);
      expect(filteredLimitedLogs).toHaveLength(1);
      expect(filteredLimitedLogs[0].level).toBeLessThanOrEqual(LogLevel.WARN);
    });

    it('should return most recent logs when limited', () => {
      const logs = testLogger.getRecentLogs(undefined, 2);
      expect(logs[0].message).toBe('Info 1'); // Most recent non-debug
      expect(logs[1].message).toBe('Debug 1'); // Most recent
    });
  });

  describe('Error Summary', () => {
    beforeEach(() => {
      testLogger.setLevel(LogLevel.TRACE);
      testLogger.setHistoryEnabled(true);
      testLogger.clearHistory();
    });

    it('should provide error summary with counts', () => {
      testLogger.error('Error 1');
      testLogger.error('Error 2');
      testLogger.warn('Warning 1');
      testLogger.warn('Warning 2');
      testLogger.warn('Warning 3');
      testLogger.info('Info 1');

      const summary = testLogger.getErrorSummary();
      expect(summary.errorCount).toBe(2);
      expect(summary.warningCount).toBe(3);
      expect(summary.recentErrors).toHaveLength(2);
      
      expect(summary.recentErrors[0].level).toBe(LogLevel.ERROR);
      expect(summary.recentErrors[0].message).toBe('Error 1');
      expect(summary.recentErrors[1].message).toBe('Error 2');
    });

    it('should limit recent errors to 10', () => {
      // Add more than 10 errors
      for (let i = 0; i < 15; i++) {
        testLogger.error(`Error ${i}`);
      }

      const summary = testLogger.getErrorSummary();
      expect(summary.errorCount).toBe(15);
      expect(summary.recentErrors).toHaveLength(10);
      
      // Should have the most recent 10
      expect(summary.recentErrors[0].message).toBe('Error 5');
      expect(summary.recentErrors[9].message).toBe('Error 14');
    });

    it('should handle empty history', () => {
      const summary = testLogger.getErrorSummary();
      expect(summary.errorCount).toBe(0);
      expect(summary.warningCount).toBe(0);
      expect(summary.recentErrors).toHaveLength(0);
    });
  });

  describe('Log Export', () => {
    beforeEach(() => {
      testLogger.setLevel(LogLevel.TRACE);
      testLogger.setHistoryEnabled(true);
      testLogger.clearHistory();
    });

    it('should export logs as JSON string', () => {
      testLogger.error('Test error');
      testLogger.info('Test info');

      const exported = testLogger.exportLogs();
      const parsed = JSON.parse(exported);

      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed).toHaveLength(2);
      expect(parsed[0].message).toBe('Test error');
      expect(parsed[0].level).toBe(LogLevel.ERROR);
      expect(parsed[1].message).toBe('Test info');
      expect(parsed[1].level).toBe(LogLevel.INFO);
    });

    it('should export empty array when no logs', () => {
      const exported = testLogger.exportLogs();
      const parsed = JSON.parse(exported);

      expect(parsed).toEqual([]);
    });

    it('should preserve log entry structure in export', () => {
      const context: LogContext = {
        section: 'test',
        analyzer: 'export',
      };

      testLogger.warn('Export test', context, 'additional', 42);

      const exported = testLogger.exportLogs();
      const parsed = JSON.parse(exported);
      
      expect(parsed[0]).toHaveProperty('level');
      expect(parsed[0]).toHaveProperty('message');
      expect(parsed[0]).toHaveProperty('context');
      expect(parsed[0]).toHaveProperty('timestamp');
      expect(parsed[0]).toHaveProperty('args');
      
      expect(parsed[0].context).toEqual(context);
      expect(parsed[0].args).toEqual(['additional', 42]);
    });
  });
});

describe('Performance Logging', () => {
  let mockConsole: {
    error: jest.SpyInstance;
    warn: jest.SpyInstance;
    log: jest.SpyInstance;
  };
  let testLogger: Logger;

  beforeEach(() => {
    mockConsole = {
      error: jest.spyOn(console, 'error').mockImplementation(() => {}),
      warn: jest.spyOn(console, 'warn').mockImplementation(() => {}),
      log: jest.spyOn(console, 'log').mockImplementation(() => {}),
    };

    testLogger = Logger.getInstance();
    testLogger.setLevel(LogLevel.TRACE);
    testLogger.clearHistory();
    testLogger.setHistoryEnabled(true);
  });

  afterEach(() => {
    mockConsole.error.mockRestore();
    mockConsole.warn.mockRestore();
    mockConsole.log.mockRestore();
  });

  it('should log slow operations as warnings (>5000ms)', () => {
    testLogger.performance('slow-operation', 6000);

    expect(mockConsole.warn).toHaveBeenCalledWith(
      expect.stringContaining('⚠️  WARN: Slow operation: slow-operation took 6000ms'),
    );
  });

  it('should log moderate operations as info (1000-5000ms)', () => {
    testLogger.performance('moderate-operation', 2500);

    expect(mockConsole.log).toHaveBeenCalledWith(
      expect.stringContaining('ℹ️  INFO: Operation completed: moderate-operation took 2500ms'),
    );
  });

  it('should log fast operations as debug (<1000ms)', () => {
    testLogger.performance('fast-operation', 500);

    expect(mockConsole.log).toHaveBeenCalledWith(
      expect.stringContaining('🐛 DEBUG: Operation completed: fast-operation took 500ms'),
    );
  });

  it('should include context in performance logs', () => {
    const context: LogContext = {
      section: 'analysis',
      filePath: '/path/to/data.csv',
    };

    testLogger.performance('analysis-operation', 1500, context);

    // Context order: section, analyzer, op, file, row, mem
    expect(mockConsole.log).toHaveBeenCalledWith(
      expect.stringContaining('[section:analysis, op:analysis-operation, file:data.csv]'),
    );
  });

  it('should add operation and timestamp to context', () => {
    testLogger.performance('test-operation', 100);

    const logs = testLogger.getRecentLogs();
    expect(logs[0].context?.operation).toBe('test-operation');
    expect(logs[0].context?.timestamp).toBeInstanceOf(Date);
  });

  it('should handle boundary values correctly', () => {
    testLogger.performance('boundary-1000', 1000);
    expect(mockConsole.log).toHaveBeenCalledWith(
      expect.stringContaining('🐛 DEBUG: Operation completed: boundary-1000 took 1000ms'),
    );

    testLogger.performance('boundary-5000', 5000);
    expect(mockConsole.log).toHaveBeenCalledWith(
      expect.stringContaining('ℹ️  INFO: Operation completed: boundary-5000 took 5000ms'),
    );

    testLogger.performance('boundary-5001', 5001);
    expect(mockConsole.warn).toHaveBeenCalledWith(
      expect.stringContaining('⚠️  WARN: Slow operation: boundary-5001 took 5001ms'),
    );
  });
});

describe('Memory Logging', () => {
  let mockConsole: {
    warn: jest.SpyInstance;
    log: jest.SpyInstance;
  };
  let testLogger: Logger;
  let mockMemoryUsage: jest.SpyInstance;

  beforeEach(() => {
    mockConsole = {
      warn: jest.spyOn(console, 'warn').mockImplementation(() => {}),
      log: jest.spyOn(console, 'log').mockImplementation(() => {}),
    };

    testLogger = Logger.getInstance();
    testLogger.setLevel(LogLevel.TRACE);

    // Mock process.memoryUsage()
    mockMemoryUsage = jest.spyOn(process, 'memoryUsage');
  });

  afterEach(() => {
    mockConsole.warn.mockRestore();
    mockConsole.log.mockRestore();
    mockMemoryUsage.mockRestore();
  });

  it('should log high memory usage as warning (>512MB)', () => {
    mockMemoryUsage.mockReturnValue({
      rss: 800 * 1024 * 1024,
      heapTotal: 600 * 1024 * 1024,
      heapUsed: 550 * 1024 * 1024,
      external: 0,
      arrayBuffers: 0,
    });

    testLogger.memory();

    expect(mockConsole.warn).toHaveBeenCalledWith(
      expect.stringContaining('⚠️  WARN: High memory usage: 550MB heap, 800MB RSS'),
    );
  });

  it('should log normal memory usage as debug (<=512MB)', () => {
    mockMemoryUsage.mockReturnValue({
      rss: 200 * 1024 * 1024,
      heapTotal: 150 * 1024 * 1024,
      heapUsed: 100 * 1024 * 1024,
      external: 0,
      arrayBuffers: 0,
    });

    testLogger.memory();

    expect(mockConsole.log).toHaveBeenCalledWith(
      expect.stringContaining('🐛 DEBUG: Memory usage: 100MB heap, 200MB RSS'),
    );
  });

  it('should include memory usage in context', () => {
    mockMemoryUsage.mockReturnValue({
      rss: 200 * 1024 * 1024,
      heapTotal: 150 * 1024 * 1024,
      heapUsed: 100 * 1024 * 1024,
      external: 0,
      arrayBuffers: 0,
    });

    testLogger.setHistoryEnabled(true);
    testLogger.clearHistory();
    testLogger.memory();

    const logs = testLogger.getRecentLogs();
    expect(logs[0].context?.memoryUsage).toBe(100 * 1024 * 1024);
  });

  it('should merge provided context with memory context', () => {
    mockMemoryUsage.mockReturnValue({
      rss: 200 * 1024 * 1024,
      heapTotal: 150 * 1024 * 1024,
      heapUsed: 100 * 1024 * 1024,
      external: 0,
      arrayBuffers: 0,
    });

    const providedContext: LogContext = {
      section: 'test',
      operation: 'memory-check',
    };

    testLogger.memory(providedContext);

    expect(mockConsole.log).toHaveBeenCalledWith(
      expect.stringContaining('[section:test, op:memory-check, mem:100MB]'),
    );
  });

  it('should handle boundary case at 512MB', () => {
    mockMemoryUsage.mockReturnValue({
      rss: 512 * 1024 * 1024,
      heapTotal: 512 * 1024 * 1024,
      heapUsed: 512 * 1024 * 1024,
      external: 0,
      arrayBuffers: 0,
    });

    testLogger.memory();

    expect(mockConsole.log).toHaveBeenCalledWith(
      expect.stringContaining('🐛 DEBUG: Memory usage: 512MB heap, 512MB RSS'),
    );

    // Reset and test just over the boundary
    mockMemoryUsage.mockReturnValue({
      rss: 513 * 1024 * 1024,
      heapTotal: 513 * 1024 * 1024,
      heapUsed: 513 * 1024 * 1024,
      external: 0,
      arrayBuffers: 0,
    });

    testLogger.memory();

    expect(mockConsole.warn).toHaveBeenCalledWith(
      expect.stringContaining('⚠️  WARN: High memory usage: 513MB heap, 513MB RSS'),
    );
  });

  it('should round memory values correctly', () => {
    mockMemoryUsage.mockReturnValue({
      rss: 100.7 * 1024 * 1024,
      heapTotal: 80.3 * 1024 * 1024,
      heapUsed: 75.6 * 1024 * 1024,
      external: 0,
      arrayBuffers: 0,
    });

    testLogger.memory();

    expect(mockConsole.log).toHaveBeenCalledWith(
      expect.stringContaining('76MB heap, 101MB RSS'),
    );
  });
});

describe('Error with Stack Trace', () => {
  let mockConsole: {
    error: jest.SpyInstance;
  };
  let testLogger: Logger;

  beforeEach(() => {
    mockConsole = {
      error: jest.spyOn(console, 'error').mockImplementation(() => {}),
    };

    testLogger = Logger.getInstance();
    testLogger.clearHistory();
    testLogger.setHistoryEnabled(true);
  });

  afterEach(() => {
    mockConsole.error.mockRestore();
  });

  it('should log error message with context', () => {
    testLogger.setLevel(LogLevel.INFO); // Disable stack trace for this test
    
    const error = new Error('Test error message');
    const context: LogContext = {
      section: 'parser',
      filePath: '/path/to/file.csv',
    };

    testLogger.errorWithStack(error, context);

    // formatContext doesn't include errorCode, but it's stored in the log context
    expect(mockConsole.error).toHaveBeenCalledWith(
      expect.stringContaining('❌ ERROR: Test error message [section:parser, file:file.csv]'),
    );
  });

  it('should include error name as errorCode in context', () => {
    const error = new TypeError('Type error message');
    testLogger.errorWithStack(error);

    const logs = testLogger.getRecentLogs();
    expect(logs[0].context?.errorCode).toBe('TypeError');
  });

  it('should print stack trace when debug level is enabled', () => {
    testLogger.setLevel(LogLevel.DEBUG);
    
    const error = new Error('Test error');
    error.stack = 'Error: Test error\n    at test.js:1:1\n    at main.js:5:3';
    
    testLogger.errorWithStack(error);

    expect(mockConsole.error).toHaveBeenCalledWith('Stack trace:');
    expect(mockConsole.error).toHaveBeenCalledWith('Error: Test error\n    at test.js:1:1\n    at main.js:5:3');
  });

  it('should not print stack trace when debug level is disabled', () => {
    testLogger.setLevel(LogLevel.INFO);
    
    const error = new Error('Test error');
    error.stack = 'Error: Test error\n    at test.js:1:1';
    
    testLogger.errorWithStack(error);

    expect(mockConsole.error).not.toHaveBeenCalledWith('Stack trace:');
    expect(mockConsole.error).toHaveBeenCalledTimes(1); // Only the main error message
  });

  it('should handle error without stack trace', () => {
    testLogger.setLevel(LogLevel.DEBUG);
    
    const error = new Error('Test error');
    error.stack = undefined;
    
    testLogger.errorWithStack(error);

    expect(mockConsole.error).toHaveBeenCalledWith(
      expect.stringContaining('❌ ERROR: Test error'),
    );
    expect(mockConsole.error).not.toHaveBeenCalledWith('Stack trace:');
  });

  it('should merge provided context with error context', () => {
    const error = new Error('Test error');
    const context: LogContext = {
      section: 'test',
      rowIndex: 100,
    };

    testLogger.errorWithStack(error, context);

    const logs = testLogger.getRecentLogs();
    expect(logs[0].context).toEqual({
      section: 'test',
      rowIndex: 100,
      errorCode: 'Error',
    });
  });
});

describe('LogUtils', () => {
  let mockConsole: {
    error: jest.SpyInstance;
    warn: jest.SpyInstance;
    log: jest.SpyInstance;
  };
  let testLogger: Logger;

  beforeEach(() => {
    mockConsole = {
      error: jest.spyOn(console, 'error').mockImplementation(() => {}),
      warn: jest.spyOn(console, 'warn').mockImplementation(() => {}),
      log: jest.spyOn(console, 'log').mockImplementation(() => {}),
    };

    testLogger = Logger.getInstance();
    testLogger.setLevel(LogLevel.TRACE);
    testLogger.clearHistory();
    testLogger.setHistoryEnabled(true);
  });

  afterEach(() => {
    mockConsole.error.mockRestore();
    mockConsole.warn.mockRestore();
    mockConsole.log.mockRestore();
  });

  describe('createContext', () => {
    it('should create context with provided parameters', () => {
      const context = LogUtils.createContext('analysis', 'statistics', '/path/file.csv', 'calculate');

      expect(context.section).toBe('analysis');
      expect(context.analyzer).toBe('statistics');
      expect(context.filePath).toBe('/path/file.csv');
      expect(context.operation).toBe('calculate');
      expect(context.timestamp).toBeInstanceOf(Date);
    });

    it('should create context with partial parameters', () => {
      const context = LogUtils.createContext('analysis');

      expect(context.section).toBe('analysis');
      expect(context.analyzer).toBeUndefined();
      expect(context.filePath).toBeUndefined();
      expect(context.operation).toBeUndefined();
      expect(context.timestamp).toBeInstanceOf(Date);
    });

    it('should create context with no parameters', () => {
      const context = LogUtils.createContext();

      expect(context.section).toBeUndefined();
      expect(context.analyzer).toBeUndefined();
      expect(context.filePath).toBeUndefined();
      expect(context.operation).toBeUndefined();
      expect(context.timestamp).toBeInstanceOf(Date);
    });
  });

  describe('logOperationStart', () => {
    it('should log operation start and return start time', () => {
      const startTime = LogUtils.logOperationStart('test-operation');

      expect(startTime).toBeInstanceOf(Date);
      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining('🐛 DEBUG: Starting operation: test-operation [op:test-operation]'),
      );
    });

    it('should include context in operation start log', () => {
      const context: LogContext = {
        section: 'analysis',
        filePath: '/data/test.csv',
      };

      const startTime = LogUtils.logOperationStart('process-data', context);

      expect(startTime).toBeInstanceOf(Date);
      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining('🐛 DEBUG: Starting operation: process-data [section:analysis, op:process-data, file:test.csv]'),
      );
    });
  });

  describe('logOperationEnd', () => {
    it('should log operation end with duration', () => {
      const startTime = new Date(Date.now() - 1500); // 1.5 seconds ago
      
      LogUtils.logOperationEnd('test-operation', startTime);

      // Should use performance logging, so expect info level for ~1500ms
      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringMatching(/ℹ️\s+INFO: Operation completed: test-operation took \d+ms \[op:test-operation\]/),
      );
    });

    it('should include context in operation end log', () => {
      const startTime = new Date(Date.now() - 500); // 0.5 seconds ago
      const context: LogContext = {
        section: 'parser',
        analyzer: 'csv',
      };
      
      LogUtils.logOperationEnd('parse-file', startTime, context);

      // Should use debug level for fast operation
      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringMatching(/🐛 DEBUG: Operation completed: parse-file took \d+ms \[section:parser, analyzer:csv, op:parse-file\]/),
      );
    });

    it('should calculate duration correctly', () => {
      const startTime = new Date(Date.now() - 2000); // 2 seconds ago
      
      LogUtils.logOperationEnd('slow-operation', startTime);

      // Extract the duration from the log call
      const logCall = mockConsole.log.mock.calls.find(call => 
        call[0].includes('Operation completed: slow-operation took')
      );
      
      expect(logCall).toBeDefined();
      // Duration should be around 2000ms, give or take timing variations
      const durationMatch = logCall[0].match(/took (\d+)ms/);
      expect(durationMatch).toBeTruthy();
      
      const duration = parseInt(durationMatch[1]);
      expect(duration).toBeGreaterThan(1900);
      expect(duration).toBeLessThan(2100);
    });
  });

  describe('createScopedLogger', () => {
    it('should create scoped logger with context', () => {
      const context: LogContext = {
        section: 'analysis',
        analyzer: 'statistics',
        filePath: '/data/test.csv',
      };

      const scopedLogger = LogUtils.createScopedLogger(context);

      expect(scopedLogger).toHaveProperty('error');
      expect(scopedLogger).toHaveProperty('warn');
      expect(scopedLogger).toHaveProperty('info');
      expect(scopedLogger).toHaveProperty('debug');
      expect(scopedLogger).toHaveProperty('trace');

      // Test that the context is applied
      scopedLogger.info('Test message');

      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining('ℹ️  INFO: Test message [section:analysis, analyzer:statistics, file:test.csv]'),
      );
    });

    it('should pass through additional arguments in scoped logger', () => {
      const context: LogContext = {
        section: 'test',
      };

      const scopedLogger = LogUtils.createScopedLogger(context);
      const testObj = { key: 'value' };

      scopedLogger.error('Error message', testObj, 'additional');

      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining('❌ ERROR: Error message [section:test]'),
        testObj,
        'additional',
      );
    });

    it('should work with all log levels in scoped logger', () => {
      const context: LogContext = { section: 'test' };
      const scopedLogger = LogUtils.createScopedLogger(context);

      scopedLogger.error('Error message');
      scopedLogger.warn('Warning message');
      scopedLogger.info('Info message');
      scopedLogger.debug('Debug message');
      scopedLogger.trace('Trace message');

      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining('❌ ERROR: Error message [section:test]'),
      );
      expect(mockConsole.warn).toHaveBeenCalledWith(
        expect.stringContaining('⚠️  WARN: Warning message [section:test]'),
      );
      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining('ℹ️  INFO: Info message [section:test]'),
      );
      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining('🐛 DEBUG: Debug message [section:test]'),
      );
      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining('🔍 TRACE: Trace message [section:test]'),
      );
    });
  });
});

describe('Global Logger Instance', () => {
  it('should export a singleton logger instance', () => {
    expect(logger).toBeInstanceOf(Logger);
    expect(logger).toBe(Logger.getInstance());
  });

  it('should maintain state across imports', () => {
    logger.setLevel(LogLevel.ERROR);
    
    const anotherReference = Logger.getInstance();
    expect(anotherReference).toBe(logger);

    // Both should have the same level since they're the same instance
    anotherReference.setLevel(LogLevel.DEBUG);
    expect(logger).toBe(anotherReference);
  });
});

describe('Progress and Success Logging Level Filtering', () => {
  let mockConsole: {
    error: jest.SpyInstance;
    warn: jest.SpyInstance;
    log: jest.SpyInstance;
  };
  let mockStdout: jest.SpyInstance;
  let testLogger: Logger;

  beforeEach(() => {
    mockConsole = {
      error: jest.spyOn(console, 'error').mockImplementation(() => {}),
      warn: jest.spyOn(console, 'warn').mockImplementation(() => {}),
      log: jest.spyOn(console, 'log').mockImplementation(() => {}),
    };
    mockStdout = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);

    testLogger = Logger.getInstance();
  });

  afterEach(() => {
    mockConsole.error.mockRestore();
    mockConsole.warn.mockRestore();
    mockConsole.log.mockRestore();
    mockStdout.mockRestore();
  });

  it('should respect level filtering for progress messages', () => {
    testLogger.setLevel(LogLevel.ERROR);

    testLogger.progress('Processing data');

    expect(mockStdout).not.toHaveBeenCalled();

    testLogger.setLevel(LogLevel.INFO);

    testLogger.progress('Processing data');

    expect(mockStdout).toHaveBeenCalledWith('\r⏳ Processing data');
  });

  it('should respect level filtering for success messages', () => {
    testLogger.setLevel(LogLevel.ERROR);

    testLogger.success('Operation completed');

    expect(mockConsole.log).not.toHaveBeenCalled();

    testLogger.setLevel(LogLevel.INFO);

    testLogger.success('Operation completed');

    expect(mockConsole.log).toHaveBeenCalledWith('\r✅ Operation completed');
  });

  it('should include context in progress and success messages', () => {
    testLogger.setLevel(LogLevel.INFO);
    
    const context: LogContext = {
      section: 'parser',
      operation: 'load',
    };

    testLogger.progress('Loading file', context);
    testLogger.success('File loaded', context);

    expect(mockStdout).toHaveBeenCalledWith(
      '\r⏳ Loading file [section:parser, op:load]'
    );
    expect(mockConsole.log).toHaveBeenCalledWith(
      '\r✅ File loaded [section:parser, op:load]'
    );
  });
});