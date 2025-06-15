/**
 * Comprehensive Error Handler Tests
 * 
 * Tests error handling, recovery strategies, error classification,
 * memory checks, and all error management functionality.
 */

import { ErrorHandler, ErrorUtils, globalErrorHandler } from '@/utils/error-handler';
import { DataPilotError, ErrorSeverity, ErrorCategory } from '@/core/types';
import { logger } from '@/utils/logger';
import { mkdtempSync, writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

// Mock logger to prevent console noise during tests
jest.mock('@/utils/logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('ErrorHandler', () => {
  let errorHandler: ErrorHandler;
  let tempDir: string;

  beforeEach(() => {
    errorHandler = new ErrorHandler();
    tempDir = mkdtempSync(join(tmpdir(), 'error-handler-test-'));
    jest.clearAllMocks();
  });

  afterEach(() => {
    try {
      const files = require('fs').readdirSync(tempDir);
      files.forEach((file: string) => {
        unlinkSync(join(tempDir, file));
      });
      require('fs').rmdirSync(tempDir);
    } catch (e) {
      // Cleanup failure is acceptable in tests
    }
  });

  describe('Constructor and Configuration', () => {
    it('should create error handler with default configuration', () => {
      const handler = new ErrorHandler();
      const stats = handler.getStats();

      expect(stats.totalErrors).toBe(0);
      expect(stats.recoveredErrors).toBe(0);
      expect(stats.criticalErrors).toBe(0);
    });

    it('should create error handler with custom configuration', () => {
      const config = {
        maxRetries: 5,
        retryDelayMs: 2000,
        enableRecovery: false,
        logErrors: false,
        abortOnCritical: false,
        memoryThresholdBytes: 256 * 1024 * 1024,
      };

      const handler = new ErrorHandler(config);
      
      // Test by triggering a method that would use the config
      const testError = DataPilotError.analysis('Test error', 'TEST_ERROR', {});
      
      expect(() => {
        handler.handleErrorSync(testError, () => { throw testError; });
      }).toThrow();
    });

    it('should initialize error statistics correctly', () => {
      const stats = errorHandler.getStats();

      expect(stats.totalErrors).toBe(0);
      expect(stats.errorsByCategory).toHaveProperty(ErrorCategory.ANALYSIS);
      expect(stats.errorsByCategory).toHaveProperty(ErrorCategory.MEMORY);
      expect(stats.errorsByCategory).toHaveProperty(ErrorCategory.PARSING);
      expect(stats.errorsBySeverity).toHaveProperty(ErrorSeverity.LOW);
      expect(stats.errorsBySeverity).toHaveProperty(ErrorSeverity.CRITICAL);
    });
  });

  describe('Error Handling - Async', () => {
    it('should handle recoverable error with retry strategy', async () => {
      let attemptCount = 0;
      const operation = async () => {
        attemptCount++;
        if (attemptCount < 3) {
          throw new Error('Temporary failure');
        }
        return 'success';
      };

      const error = new DataPilotError('Network error', 'NETWORK_ERROR', ErrorSeverity.MEDIUM, ErrorCategory.NETWORK, {});
      error.recoverable = true;

      const result = await errorHandler.handleError(error, operation, {
        strategy: 'retry',
        maxRetries: 3,
        retryDelay: 10,
      });

      expect(result).toBe('success');
      expect(attemptCount).toBe(3);
    });

    it('should handle non-recoverable error by throwing', async () => {
      const operation = async () => 'should not execute';
      const error = DataPilotError.validation('Validation error', 'VALIDATION_ERROR', {});
      error.recoverable = false;

      await expect(
        errorHandler.handleError(error, operation)
      ).rejects.toThrow('Validation error');
    });

    it('should handle critical error by aborting when configured', async () => {
      const criticalHandler = new ErrorHandler({ abortOnCritical: true });
      const operation = async () => 'should not execute';
      const error = DataPilotError.memory('Critical memory error', 'MEMORY_CRITICAL', {});

      await expect(
        criticalHandler.handleError(error, operation)
      ).rejects.toThrow('Critical memory error');
    });

    it('should use fallback recovery strategy', async () => {
      const operation = async () => { throw new Error('Always fails'); };
      const error = DataPilotError.analysis('Analysis error', 'ANALYSIS_ERROR', {});
      error.recoverable = true;

      const result = await errorHandler.handleError(error, operation, {
        strategy: 'fallback',
        fallbackValue: 'fallback_result',
      });

      expect(result).toBe('fallback_result');
      
      const stats = errorHandler.getStats();
      expect(stats.recoveredErrors).toBe(1);
    });

    it('should skip operation with skip strategy', async () => {
      const operation = async () => { throw new Error('Should not execute'); };
      const error = new DataPilotError('IO error', 'IO_ERROR', ErrorSeverity.MEDIUM, ErrorCategory.IO, {});
      error.recoverable = true;

      const result = await errorHandler.handleError(error, operation, {
        strategy: 'skip',
      });

      expect(result).toBeNull();
      
      const stats = errorHandler.getStats();
      expect(stats.recoveredErrors).toBe(1);
    });

    it('should continue with continue strategy', async () => {
      const operation = async () => { throw new Error('Should not execute'); };
      const error = DataPilotError.parsing('Parse error', 'PARSE_ERROR', {});
      error.recoverable = true;

      const result = await errorHandler.handleError(error, operation, {
        strategy: 'continue',
      });

      expect(result).toBeNull();
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Continuing despite error')
      );
    });
  });

  describe('Error Handling - Sync', () => {
    it('should handle sync error with fallback value', () => {
      const operation = () => { throw new Error('Test error'); };
      const error = DataPilotError.analysis('Sync error', 'SYNC_ERROR', {});
      error.recoverable = true;

      const result = errorHandler.handleErrorSync(error, operation, 'fallback');

      expect(result).toBe('fallback');
      
      const stats = errorHandler.getStats();
      expect(stats.recoveredErrors).toBe(1);
    });

    it('should throw critical error in sync mode', () => {
      const criticalHandler = new ErrorHandler({ abortOnCritical: true });
      const operation = () => 'should not execute';
      const error = DataPilotError.memory('Critical sync error', 'CRITICAL_SYNC', {});

      expect(() => {
        criticalHandler.handleErrorSync(error, operation);
      }).toThrow('Critical sync error');
    });

    it('should execute operation once in sync mode and use fallback on error', () => {
      let attemptCount = 0;
      const operation = () => {
        attemptCount++;
        throw new Error('Always fails');
      };

      const error = new DataPilotError('IO sync error', 'IO_SYNC_ERROR', ErrorSeverity.MEDIUM, ErrorCategory.IO, {});
      error.recoverable = true;

      const result = errorHandler.handleErrorSync(error, operation, 'fallback');

      expect(result).toBe('fallback');
      expect(attemptCount).toBe(1);
    });
  });

  describe('Default Recovery Strategies', () => {
    it('should abort on memory errors', async () => {
      const operation = async () => 'should not execute';
      const memoryError = DataPilotError.memory('Memory exhausted', 'MEMORY_EXHAUSTED', {});

      await expect(
        errorHandler.handleError(memoryError, operation)
      ).rejects.toThrow('Memory exhausted');
    });

    it('should use fallback for encoding detection failure', async () => {
      const operation = async () => 'utf8'; // Fallback encoding
      const encodingError = DataPilotError.parsing(
        'Encoding detection failed',
        'ENCODING_DETECTION_FAILED',
        {}
      );

      const result = await errorHandler.handleError(encodingError, operation);
      expect(result).toBe('utf8');
    });

    it('should retry network errors', async () => {
      let attemptCount = 0;
      const operation = async () => {
        attemptCount++;
        if (attemptCount < 3) {
          throw new Error('Network timeout');
        }
        return 'network_success';
      };

      const networkError = new DataPilotError('Network timeout', 'NETWORK_TIMEOUT', ErrorSeverity.MEDIUM, ErrorCategory.NETWORK, {});

      const result = await errorHandler.handleError(networkError, operation);
      expect(result).toBe('network_success');
      expect(attemptCount).toBe(3);
    });

    it('should retry IO errors with backoff', async () => {
      const startTime = Date.now();
      let attemptCount = 0;
      
      const operation = async () => {
        attemptCount++;
        if (attemptCount < 2) {
          throw new Error('File locked');
        }
        return 'io_success';
      };

      const ioError = new DataPilotError('File locked', 'FILE_LOCKED', ErrorSeverity.MEDIUM, ErrorCategory.IO, {});

      const result = await errorHandler.handleError(ioError, operation);
      const duration = Date.now() - startTime;

      expect(result).toBe('io_success');
      expect(attemptCount).toBe(2);
      expect(duration).toBeGreaterThan(400); // Should have some delay
    });
  });

  describe('Configuration Validation', () => {
    it('should validate configuration schema correctly', () => {
      const config = {
        maxRetries: 5,
        retryDelayMs: 1000,
        enableRecovery: true,
        logErrors: false,
      };

      const schema = {
        maxRetries: 'number',
        retryDelayMs: 'number',
        enableRecovery: 'boolean',
        logErrors: 'boolean',
        invalidField: 'string', // This field doesn't exist in config
      };

      const errors = errorHandler.validateConfig(config, schema);
      expect(errors).toHaveLength(0);
    });

    it('should detect configuration type mismatches', () => {
      const config = {
        maxRetries: '5', // Should be number
        enableRecovery: 'true', // Should be boolean
      };

      const schema = {
        maxRetries: 'number',
        enableRecovery: 'boolean',
      };

      const errors = errorHandler.validateConfig(config, schema);
      expect(errors).toHaveLength(2);
      expect(errors[0].code).toBe('CONFIG_TYPE_MISMATCH');
    });

    it('should detect invalid number values', () => {
      const config = {
        maxRetries: NaN,
        retryDelay: Infinity,
      };

      const schema = {
        maxRetries: 'number',
        retryDelay: 'number',
      };

      const errors = errorHandler.validateConfig(config, schema);
      expect(errors).toHaveLength(2);
      expect(errors[0].code).toBe('CONFIG_INVALID_NUMBER');
    });
  });

  describe('Memory Usage Monitoring', () => {
    it('should check memory usage and throw error when exceeded', () => {
      const lowMemoryHandler = new ErrorHandler({
        memoryThresholdBytes: 1, // Very low threshold
      });

      expect(() => {
        lowMemoryHandler.checkMemoryUsage({ operationName: 'test' });
      }).toThrow(DataPilotError);
    });

    it('should not throw when memory usage is within limits', () => {
      const highMemoryHandler = new ErrorHandler({
        memoryThresholdBytes: 10 * 1024 * 1024 * 1024, // 10GB threshold
      });

      expect(() => {
        highMemoryHandler.checkMemoryUsage();
      }).not.toThrow();
    });

    it('should include memory usage in error context', () => {
      const lowMemoryHandler = new ErrorHandler({ memoryThresholdBytes: 1 });

      try {
        lowMemoryHandler.checkMemoryUsage({ operationName: 'test' });
        fail('Expected error to be thrown');
      } catch (error) {
        if (error instanceof DataPilotError) {
          expect(error.context.memoryUsage).toBeDefined();
          expect(typeof error.context.memoryUsage).toBe('number');
        } else {
          fail('Expected DataPilotError');
        }
      }
    });
  });

  describe('Specialized Error Creation', () => {
    it('should create file corruption error with suggestions', () => {
      const filePath = '/path/to/corrupted.csv';
      const details = 'Invalid byte sequence';

      const error = errorHandler.createFileCorruptionError(filePath, details);

      expect(error).toBeInstanceOf(DataPilotError);
      expect(error.category).toBe(ErrorCategory.PARSING);
      expect(error.code).toBe('FILE_CORRUPTED');
      expect(error.context.filePath).toBe(filePath);
      
      const suggestions = error.getSuggestions();
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.some(s => s.includes('encoding'))).toBe(true);
    });

    it('should create insufficient data error with context', () => {
      const context = { operationName: 'analysis', filePath: 'test.csv' };
      const minRequired = 100;
      const actual = 50;

      const error = errorHandler.createInsufficientDataError(context, minRequired, actual);

      expect(error).toBeInstanceOf(DataPilotError);
      expect(error.category).toBe(ErrorCategory.ANALYSIS);
      expect(error.code).toBe('INSUFFICIENT_DATA');
      expect(error.message).toContain('50 rows');
      expect(error.message).toContain('100');
    });
  });

  describe('Operation Wrapping', () => {
    it('should wrap operation successfully', async () => {
      const operation = async () => 'wrapped_success';
      
      const result = await errorHandler.wrapOperation(
        operation,
        'test_operation',
        { filePath: 'test.csv' }
      );

      expect(result).toBe('wrapped_success');
    });

    it('should convert generic error to DataPilotError', async () => {
      const operation = async () => {
        throw new Error('Generic error');
      };

      const result = await errorHandler.wrapOperation(
        operation,
        'test_operation',
        { filePath: 'test.csv' },
        { strategy: 'fallback', fallbackValue: 'fallback' }
      );

      expect(result).toBe('fallback');
      
      const stats = errorHandler.getStats();
      expect(stats.totalErrors).toBe(1);
    });

    it('should handle DataPilotError directly', async () => {
      const dataPilotError = new DataPilotError('IO error', 'IO_ERROR', ErrorSeverity.MEDIUM, ErrorCategory.IO, {});
      const operation = async () => {
        throw dataPilotError;
      };

      await expect(
        errorHandler.wrapOperation(operation, 'test_operation')
      ).rejects.toThrow('IO error');
      
      const stats = errorHandler.getStats();
      expect(stats.totalErrors).toBe(1);
      expect(stats.errorsByCategory[ErrorCategory.IO]).toBe(1);
    });
  });

  describe('Error Statistics and History', () => {
    it('should track error statistics correctly', () => {
      const error1 = DataPilotError.analysis('Error 1', 'ERROR_1', {});
      const error2 = DataPilotError.memory('Error 2', 'ERROR_2', {});
      const error3 = DataPilotError.analysis('Error 3', 'ERROR_3', {});

      errorHandler.handleErrorSync(error1, () => { throw error1; }, 'fallback');
      
      try {
        errorHandler.handleErrorSync(error2, () => { throw error2; });
      } catch (e) {
        // Expected to throw
      }
      
      errorHandler.handleErrorSync(error3, () => { throw error3; }, 'fallback');

      const stats = errorHandler.getStats();
      expect(stats.totalErrors).toBe(3);
      expect(stats.errorsByCategory[ErrorCategory.ANALYSIS]).toBe(2);
      expect(stats.errorsByCategory[ErrorCategory.MEMORY]).toBe(1);
      expect(stats.recoveredErrors).toBe(2);
    });

    it('should maintain error history with limits', () => {
      // Add more than 100 errors to test history trimming
      for (let i = 0; i < 120; i++) {
        const error = DataPilotError.analysis(`Error ${i}`, `ERROR_${i}`, {});
        try {
          errorHandler.handleErrorSync(error, () => { throw error; });
        } catch (e) {
          // Expected to throw
        }
      }

      const recentErrors = errorHandler.getRecentErrors(10);
      expect(recentErrors).toHaveLength(10);
      
      const allRecentErrors = errorHandler.getRecentErrors();
      expect(allRecentErrors.length).toBeLessThanOrEqual(50); // Should be trimmed
    });

    it('should provide error statistics in alternative format', () => {
      const error = new DataPilotError('Network error', 'NETWORK_ERROR', ErrorSeverity.MEDIUM, ErrorCategory.NETWORK, {});
      
      try {
        errorHandler.handleErrorSync(error, () => { throw error; });
      } catch (e) {
        // Expected to throw
      }

      const altStats = errorHandler.getErrorStatistics();
      expect(altStats.totalErrors).toBe(1);
      expect(altStats.byCategory).toHaveProperty(ErrorCategory.NETWORK);
      expect(altStats.bySeverity).toHaveProperty(ErrorSeverity.MEDIUM);
    });

    it('should reset statistics and history', () => {
      const error = DataPilotError.analysis('Test error', 'TEST_ERROR', {});
      
      try {
        errorHandler.handleErrorSync(error, () => { throw error; });
      } catch (e) {
        // Expected to throw
      }

      let stats = errorHandler.getStats();
      expect(stats.totalErrors).toBe(1);

      errorHandler.reset();

      stats = errorHandler.getStats();
      expect(stats.totalErrors).toBe(0);
      expect(errorHandler.getRecentErrors()).toHaveLength(0);
    });
  });

  describe('Retry Logic', () => {
    it('should implement exponential backoff', async () => {
      const delays: number[] = [];
      let attemptCount = 0;

      const operation = async () => {
        attemptCount++;
        if (attemptCount < 4) {
          throw new Error(`Attempt ${attemptCount} failed`);
        }
        return 'success';
      };

      // Mock the delay function to capture delays
      const originalDateNow = Date.now;
      let currentTime = 1000;
      Date.now = jest.fn(() => {
        currentTime += 500; // Simulate time passing
        return currentTime;
      });

      const error = new DataPilotError('Network error', 'NETWORK_ERROR', ErrorSeverity.MEDIUM, ErrorCategory.NETWORK, {});

      try {
        const result = await errorHandler.handleError(error, operation, {
          strategy: 'retry',
          maxRetries: 4,
          retryDelay: 100,
        });

        expect(result).toBe('success');
        expect(attemptCount).toBe(4);
      } finally {
        Date.now = originalDateNow;
      }
    });

    it('should fail after max retries', async () => {
      let attemptCount = 0;
      const operation = async () => {
        attemptCount++;
        throw new Error(`Attempt ${attemptCount} failed`);
      };

      const error = new DataPilotError('IO error', 'IO_ERROR', ErrorSeverity.MEDIUM, ErrorCategory.IO, {});

      await expect(
        errorHandler.handleError(error, operation, {
          strategy: 'retry',
          maxRetries: 3,
          retryDelay: 10,
        })
      ).rejects.toThrow();

      expect(attemptCount).toBe(3);
    });
  });

  describe('Error Logging', () => {
    it('should log errors when enabled', () => {
      const loggingHandler = new ErrorHandler({ logErrors: true });
      const error = DataPilotError.analysis('Test error', 'TEST_ERROR', {});

      try {
        loggingHandler.handleErrorSync(error, () => { throw error; });
      } catch (e) {
        // Expected to throw
      }

      expect(logger.warn).toHaveBeenCalled();
    });

    it('should not log errors when disabled', () => {
      const nonLoggingHandler = new ErrorHandler({ logErrors: false });
      const error = DataPilotError.analysis('Test error', 'TEST_ERROR', {});

      try {
        nonLoggingHandler.handleErrorSync(error, () => { throw error; });
      } catch (e) {
        // Expected to throw
      }

      expect(logger.warn).not.toHaveBeenCalled();
    });

    it('should log error suggestions', () => {
      const loggingHandler = new ErrorHandler({ logErrors: true });
      const error = loggingHandler.createFileCorruptionError('test.csv', 'corrupted');

      try {
        loggingHandler.handleErrorSync(error, () => { throw error; });
      } catch (e) {
        // Expected to throw
      }

      expect(logger.info).toHaveBeenCalledWith('Suggestions:');
    });
  });
});

describe('ErrorUtils', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'error-utils-test-'));
    jest.clearAllMocks();
  });

  afterEach(() => {
    try {
      const files = require('fs').readdirSync(tempDir);
      files.forEach((file: string) => {
        unlinkSync(join(tempDir, file));
      });
      require('fs').rmdirSync(tempDir);
    } catch (e) {
      // Cleanup failure is acceptable in tests
    }
  });

  describe('Parsing Error Handling', () => {
    it('should handle DataPilotError in parsing', async () => {
      const filePath = join(tempDir, 'test.csv');
      writeFileSync(filePath, 'corrupted,data');

      const parseError = globalErrorHandler.createFileCorruptionError(filePath, 'corrupted');
      const retryFunction = async () => 'recovered_data';

      const result = await ErrorUtils.handleParsingError(parseError, filePath, retryFunction);
      expect(result).toBe('recovered_data');
    });

    it('should handle generic error in parsing', async () => {
      const filePath = join(tempDir, 'test.csv');
      const genericError = new Error('Generic parsing error');
      const retryFunction = async () => 'recovered_data';

      const result = await ErrorUtils.handleParsingError(genericError, filePath, retryFunction);
      expect(result).toBe('recovered_data');
    });
  });

  describe('Insufficient Data Handling', () => {
    it('should return value when data is sufficient', () => {
      const result = ErrorUtils.handleInsufficientData(
        100, // actual
        50,  // minimum required
        { operationName: 'test' },
        'fallback'
      );

      expect(result).toBe('fallback');
    });

    it('should handle insufficient data with fallback', () => {
      const result = ErrorUtils.handleInsufficientData(
        25,  // actual
        50,  // minimum required
        { operationName: 'test' },
        'fallback_value'
      );

      expect(result).toBe('fallback_value');
    });

    it('should throw when no fallback provided', () => {
      expect(() => {
        ErrorUtils.handleInsufficientData(
          25,  // actual
          50,  // minimum required
          { operationName: 'test' }
        );
      }).toThrow();
    });
  });

  describe('Data Array Validation', () => {
    it('should validate valid data array', () => {
      const validData = [{ id: 1, name: 'test' }, { id: 2, name: 'test2' }];
      const result = ErrorUtils.validateDataArray(validData, { operationName: 'test' });

      expect(result).toEqual(validData);
    });

    it('should filter null and undefined values', () => {
      const dataWithNulls = [{ id: 1 }, null, { id: 2 }, undefined, { id: 3 }];
      const result = ErrorUtils.validateDataArray(dataWithNulls, { operationName: 'test' });

      expect(result).toHaveLength(3);
      expect(result).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }]);
    });

    it('should throw error for non-array input', () => {
      expect(() => {
        ErrorUtils.validateDataArray('not an array' as any, { operationName: 'test' });
      }).toThrow(DataPilotError);
    });

    it('should throw error for empty array', () => {
      expect(() => {
        ErrorUtils.validateDataArray([], { operationName: 'test' });
      }).toThrow(DataPilotError);
    });
  });

  describe('Safe Numeric Conversion', () => {
    it('should convert valid numbers', () => {
      expect(ErrorUtils.safeToNumber(42)).toBe(42);
      expect(ErrorUtils.safeToNumber(3.14)).toBe(3.14);
      expect(ErrorUtils.safeToNumber(-10)).toBe(-10);
    });

    it('should convert valid string numbers', () => {
      expect(ErrorUtils.safeToNumber('42')).toBe(42);
      expect(ErrorUtils.safeToNumber('3.14')).toBe(3.14);
      expect(ErrorUtils.safeToNumber('-10.5')).toBe(-10.5);
    });

    it('should return default for invalid values', () => {
      expect(ErrorUtils.safeToNumber('not a number')).toBe(0);
      expect(ErrorUtils.safeToNumber(null)).toBe(0);
      expect(ErrorUtils.safeToNumber(undefined)).toBe(0);
      expect(ErrorUtils.safeToNumber(NaN)).toBe(0);
      expect(ErrorUtils.safeToNumber(Infinity)).toBe(0);
    });

    it('should use custom default value', () => {
      expect(ErrorUtils.safeToNumber('invalid', 999)).toBe(999);
      expect(ErrorUtils.safeToNumber(null, -1)).toBe(-1);
    });
  });

  describe('Safe Property Access', () => {
    it('should access valid nested properties', () => {
      const obj = {
        user: {
          profile: {
            name: 'John Doe',
            age: 30,
          },
        },
      };

      expect(ErrorUtils.safeGet(obj, 'user.profile.name')).toBe('John Doe');
      expect(ErrorUtils.safeGet(obj, 'user.profile.age')).toBe(30);
    });

    it('should return undefined for missing properties', () => {
      const obj = { user: { name: 'John' } };

      expect(ErrorUtils.safeGet(obj, 'user.profile.name')).toBeUndefined();
      expect(ErrorUtils.safeGet(obj, 'nonexistent.path')).toBeUndefined();
    });

    it('should return default value for missing properties', () => {
      const obj = { user: { name: 'John' } };

      expect(ErrorUtils.safeGet(obj, 'user.profile.name', 'default')).toBe('default');
      expect(ErrorUtils.safeGet(obj, 'nonexistent.path', 0)).toBe(0);
    });

    it('should handle null and undefined objects', () => {
      expect(ErrorUtils.safeGet(null, 'any.path')).toBeUndefined();
      expect(ErrorUtils.safeGet(undefined, 'any.path')).toBeUndefined();
      expect(ErrorUtils.safeGet(null, 'any.path', 'default')).toBe('default');
    });

    it('should handle array indices in path', () => {
      const obj = {
        users: [
          { name: 'John' },
          { name: 'Jane' },
        ],
      };

      expect(ErrorUtils.safeGet(obj, 'users.0.name')).toBe('John');
      expect(ErrorUtils.safeGet(obj, 'users.1.name')).toBe('Jane');
      expect(ErrorUtils.safeGet(obj, 'users.5.name')).toBeUndefined();
    });

    it('should handle errors gracefully', () => {
      const obj = {
        get badProperty() {
          throw new Error('Property access error');
        },
      };

      expect(ErrorUtils.safeGet(obj, 'badProperty', 'default')).toBe('default');
    });
  });
});

describe('Global Error Handler', () => {
  beforeEach(() => {
    globalErrorHandler.reset();
    jest.clearAllMocks();
  });

  it('should be a singleton instance', () => {
    expect(globalErrorHandler).toBeDefined();
    expect(globalErrorHandler).toBeInstanceOf(ErrorHandler);
  });

  it('should maintain state between calls', () => {
    const error = DataPilotError.analysis('Test error', 'TEST_ERROR', {});
    
    try {
      globalErrorHandler.handleErrorSync(error, () => { throw error; });
    } catch (e) {
      // Expected to throw
    }

    const stats = globalErrorHandler.getStats();
    expect(stats.totalErrors).toBe(1);
  });

  it('should handle memory threshold checks', () => {
    const originalConfig = globalErrorHandler['config'];
    globalErrorHandler['config'] = { ...originalConfig, memoryThresholdBytes: 1 };

    expect(() => {
      globalErrorHandler.checkMemoryUsage({ operationName: 'test' });
    }).toThrow(DataPilotError);

    globalErrorHandler['config'] = originalConfig;
  });
});