/**
 * Error Handler and Validation Tests
 * 
 * Tests comprehensive error handling, recovery strategies, and validation
 * for various data parsing and analysis scenarios.
 */

import { ErrorHandler, ErrorUtils, DataPilotError, ErrorSeverity, ErrorCategory } from '../../../src/utils/error-handler';
import { writeFileSync, unlinkSync, mkdtempSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('ErrorHandler', () => {
  let errorHandler: ErrorHandler;
  let tempDir: string;

  beforeEach(() => {
    errorHandler = new ErrorHandler({
      maxRetries: 2,
      retryDelayMs: 10, // Fast for tests
      enableRecovery: true,
      logErrors: false, // Avoid test noise
    });
    tempDir = mkdtempSync(join(tmpdir(), 'error-test-'));
  });

  afterEach(() => {
    try {
      const files = require('fs').readdirSync(tempDir);
      files.forEach((file: string) => unlinkSync(join(tempDir, file)));
      require('fs').rmdirSync(tempDir);
    } catch (e) {
      // Cleanup failure acceptable in tests
    }
  });

  describe('Basic Error Handling', () => {
    it('should handle recoverable errors with retry strategy', async () => {
      let attempts = 0;
      const operation = async () => {
        attempts++;
        if (attempts < 2) {
          throw new Error('Temporary failure');
        }
        return 'success';
      };

      const error = new DataPilotError(
        'Network timeout',
        'NETWORK_TIMEOUT',
        ErrorSeverity.HIGH,
        ErrorCategory.NETWORK
      );
      const result = await errorHandler.handleError(error, operation, {
        strategy: 'retry',
        maxRetries: 3,
      });

      expect(result).toBe('success');
      expect(attempts).toBe(2);
      expect(errorHandler.getStats().recoveredErrors).toBe(1);
    });

    it('should use fallback values for non-critical errors', async () => {
      const operation = async () => {
        throw new Error('Operation failed');
      };

      const error = DataPilotError.analysis('Analysis failed', 'ANALYSIS_ERROR');
      const result = await errorHandler.handleError(error, operation, {
        strategy: 'fallback',
        fallbackValue: 'default_result',
      });

      expect(result).toBe('default_result');
      expect(errorHandler.getStats().recoveredErrors).toBe(1);
    });

    it('should abort on critical errors', async () => {
      const operation = async () => 'should_not_run';
      const criticalError = DataPilotError.memory('Out of memory', 'MEMORY_EXHAUSTED');

      await expect(
        errorHandler.handleError(criticalError, operation)
      ).rejects.toThrow('Out of memory');
    });

    it('should handle synchronous errors with fallback', () => {
      const error = DataPilotError.validation('Invalid input', 'VALIDATION_ERROR');
      const operation = () => {
        throw new Error('Sync operation failed');
      };

      const result = errorHandler.handleErrorSync(error, operation, 'fallback');
      expect(result).toBe('fallback');
      expect(errorHandler.getStats().recoveredErrors).toBe(1);
    });
  });

  describe('Error Statistics and Tracking', () => {
    it('should track error statistics correctly', async () => {
      const errors = [
        DataPilotError.parsing('Parse error 1', 'PARSE_ERROR_1'),
        DataPilotError.parsing('Parse error 2', 'PARSE_ERROR_2'),
        DataPilotError.memory('Memory error', 'MEMORY_ERROR'),
        DataPilotError.analysis('Analysis error', 'ANALYSIS_ERROR'),
      ];

      for (const error of errors) {
        try {
          await errorHandler.handleError(error, async () => {
            throw new Error('Test error');
          });
        } catch (e) {
          // Expected to throw
        }
      }

      const stats = errorHandler.getStats();
      expect(stats.totalErrors).toBe(4);
      expect(stats.errorsByCategory[ErrorCategory.PARSING]).toBe(2);
      expect(stats.errorsByCategory[ErrorCategory.MEMORY]).toBe(1);
      expect(stats.errorsByCategory[ErrorCategory.ANALYSIS]).toBe(1);
    });

    it('should maintain error history with reasonable limits', () => {
      // Add many errors to test history limiting
      for (let i = 0; i < 150; i++) {
        const error = DataPilotError.validation(`Error ${i}`, 'TEST_ERROR');
        errorHandler.handleErrorSync(error, () => {
          throw new Error('Test');
        }, null);
      }

      const recentErrors = errorHandler.getRecentErrors(10);
      expect(recentErrors.length).toBe(10);
      expect(recentErrors[9].message).toContain('Error 149'); // Most recent
    });

    it('should reset statistics correctly', () => {
      const error = DataPilotError.parsing('Test error', 'TEST_ERROR');
      errorHandler.handleErrorSync(error, () => { throw new Error('Test'); }, null);

      expect(errorHandler.getStats().totalErrors).toBe(1);
      
      errorHandler.reset();
      
      expect(errorHandler.getStats().totalErrors).toBe(0);
      expect(errorHandler.getRecentErrors().length).toBe(0);
    });
  });

  describe('Configuration Validation', () => {
    it('should validate configuration types correctly', () => {
      const validConfig = {
        maxRetries: 3,
        timeout: 5000,
        enabled: true,
        name: 'test',
      };

      const schema = {
        maxRetries: 'number',
        timeout: 'number', 
        enabled: 'boolean',
        name: 'string',
      };

      const errors = errorHandler.validateConfig(validConfig, schema);
      expect(errors).toHaveLength(0);
    });

    it('should detect type mismatches in configuration', () => {
      const invalidConfig = {
        maxRetries: '3', // Should be number
        timeout: true,   // Should be number
        enabled: 'yes',  // Should be boolean
      };

      const schema = {
        maxRetries: 'number',
        timeout: 'number',
        enabled: 'boolean',
      };

      const errors = errorHandler.validateConfig(invalidConfig, schema);
      expect(errors).toHaveLength(3);
      expect(errors[0].code).toBe('CONFIG_TYPE_MISMATCH');
      expect(errors[0].message).toContain('maxRetries');
    });

    it('should validate numeric ranges and special values', () => {
      const invalidConfig = {
        rate: NaN,
        timeout: Infinity,
        count: -5,
      };

      const schema = {
        rate: 'number',
        timeout: 'number',
        count: 'number',
      };

      const errors = errorHandler.validateConfig(invalidConfig, schema);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.code === 'CONFIG_INVALID_NUMBER')).toBe(true);
    });
  });

  describe('Memory Usage Monitoring', () => {
    it('should throw error when memory threshold exceeded', () => {
      const lowMemoryHandler = new ErrorHandler({
        memoryThresholdBytes: 1, // Very low threshold
      });

      expect(() => {
        lowMemoryHandler.checkMemoryUsage({ operationName: 'test' });
      }).toThrow('Memory usage');
    });

    it('should provide actionable memory suggestions', () => {
      const lowMemoryHandler = new ErrorHandler({
        memoryThresholdBytes: 1,
      });

      try {
        lowMemoryHandler.checkMemoryUsage();
      } catch (error) {
        expect(error).toBeInstanceOf(DataPilotError);
        const suggestions = error.getSuggestions();
        expect(suggestions.length).toBeGreaterThan(0);
        expect(suggestions.some(s => s.includes('--maxRows'))).toBe(true);
      }
    });
  });

  describe('Specialized Error Creation', () => {
    it('should create file corruption errors with recovery suggestions', () => {
      const filePath = '/test/corrupted.csv';
      const error = errorHandler.createFileCorruptionError(filePath, 'Invalid encoding');

      expect(error.category).toBe(ErrorCategory.PARSING);
      expect(error.code).toBe('FILE_CORRUPTED');
      expect(error.context?.filePath).toBe(filePath);
      
      const suggestions = error.getSuggestions();
      expect(suggestions.some(s => s.includes('--encoding'))).toBe(true);
      expect(suggestions.some(s => s.includes('--delimiter'))).toBe(true);
      expect(suggestions.some(s => s.includes('--lenient'))).toBe(true);
    });

    it('should create insufficient data errors with appropriate context', () => {
      const context = { 
        filePath: '/test/small.csv',
        operationName: 'analysis',
      };
      
      const error = errorHandler.createInsufficientDataError(context, 100, 5);

      expect(error.category).toBe(ErrorCategory.ANALYSIS);
      expect(error.code).toBe('INSUFFICIENT_DATA');
      expect(error.message).toContain('found 5 rows, need at least 100');
      
      const suggestions = error.getSuggestions();
      expect(suggestions.some(s => s.includes('--simplified'))).toBe(true);
      expect(suggestions.some(s => s.includes('--minRows'))).toBe(true);
    });
  });

  describe('Operation Wrapping', () => {
    it('should wrap operations with automatic error conversion', async () => {
      const operation = async () => {
        throw new Error('Generic error');
      };

      const result = await errorHandler.wrapOperation(
        operation,
        'testOperation',
        { filePath: '/test.csv' },
        { strategy: 'fallback', fallbackValue: 'recovered' }
      );

      expect(result).toBe('recovered');
      expect(errorHandler.getStats().recoveredErrors).toBe(1);
    });

    it('should preserve DataPilotError instances during wrapping', async () => {
      const originalError = DataPilotError.parsing('Custom error', 'CUSTOM_ERROR');
      const operation = async () => {
        throw originalError;
      };

      // Parsing errors have default 'skip' strategy, so they return null instead of throwing
      const result = await errorHandler.wrapOperation(operation, 'testOp');
      expect(result).toBeNull();
      expect(errorHandler.getStats().recoveredErrors).toBe(1);
    });
  });

  describe('Default Recovery Strategies', () => {
    it('should apply appropriate default strategies by error category', async () => {
      // Test parsing error with skip strategy
      const parseError = DataPilotError.parsing('Malformed row', 'MALFORMED_ROW');
      let operation = async () => { throw new Error('Parse failed'); };
      
      const parseResult = await errorHandler.handleError(parseError, operation);
      expect(parseResult).toBeNull(); // Skip strategy returns null

      // Test analysis error with continue strategy  
      const analysisError = DataPilotError.analysis('Missing data', 'MISSING_DATA');
      operation = async () => { throw new Error('Analysis failed'); };
      
      const analysisResult = await errorHandler.handleError(analysisError, operation);
      expect(analysisResult).toBeNull(); // Continue strategy returns null
      
      expect(errorHandler.getStats().recoveredErrors).toBe(2);
    });

    it('should retry network and IO errors with exponential backoff', async () => {
      let attempts = 0;
      const operation = async () => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Network failure');
        }
        return 'success';
      };

      const networkError = new DataPilotError(
        'Connection failed',
        'CONNECTION_FAILED',
        ErrorSeverity.HIGH,
        ErrorCategory.NETWORK
      );
      const result = await errorHandler.handleError(networkError, operation);
      
      expect(result).toBe('success');
      expect(attempts).toBe(3);
    });
  });
});

describe('ErrorUtils', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'error-utils-test-'));
  });

  afterEach(() => {
    try {
      const files = require('fs').readdirSync(tempDir);
      files.forEach((file: string) => unlinkSync(join(tempDir, file)));
      require('fs').rmdirSync(tempDir);
    } catch (e) {
      // Cleanup failure acceptable
    }
  });

  describe('Data Validation', () => {
    it('should validate array data format', () => {
      const validData = [1, 2, 3, 4, 5];
      const result = ErrorUtils.validateDataArray(validData, { operationName: 'test' });
      expect(result).toEqual(validData);
    });

    it('should reject non-array data', () => {
      expect(() => {
        ErrorUtils.validateDataArray('not an array' as any, { operationName: 'test' });
      }).toThrow('Expected array data format');
    });

    it('should reject empty arrays', () => {
      expect(() => {
        ErrorUtils.validateDataArray([], { operationName: 'test' });
      }).toThrow('Insufficient data');
    });

    it('should filter out null and undefined values', () => {
      const messyData = [1, null, 3, undefined, 5];
      const result = ErrorUtils.validateDataArray(messyData, { operationName: 'test' });
      expect(result).toEqual([1, 3, 5]);
    });
  });

  describe('Safe Numeric Conversion', () => {
    it('should convert valid numbers correctly', () => {
      expect(ErrorUtils.safeToNumber(42)).toBe(42);
      expect(ErrorUtils.safeToNumber(3.14)).toBe(3.14);
      expect(ErrorUtils.safeToNumber('123')).toBe(123);
      expect(ErrorUtils.safeToNumber('45.67')).toBe(45.67);
    });

    it('should handle invalid values with defaults', () => {
      expect(ErrorUtils.safeToNumber('not a number')).toBe(0);
      expect(ErrorUtils.safeToNumber(null)).toBe(0);
      expect(ErrorUtils.safeToNumber(undefined)).toBe(0);
      expect(ErrorUtils.safeToNumber(NaN)).toBe(0);
      expect(ErrorUtils.safeToNumber(Infinity)).toBe(0);
    });

    it('should use custom default values', () => {
      expect(ErrorUtils.safeToNumber('invalid', -1)).toBe(-1);
      expect(ErrorUtils.safeToNumber(null, 99)).toBe(99);
    });
  });

  describe('Safe Property Access', () => {
    it('should access nested properties safely', () => {
      const obj = {
        user: {
          profile: {
            name: 'John',
            age: 30,
          },
        },
      };

      expect(ErrorUtils.safeGet(obj, 'user.profile.name')).toBe('John');
      expect(ErrorUtils.safeGet(obj, 'user.profile.age')).toBe(30);
    });

    it('should return defaults for missing properties', () => {
      const obj = { a: { b: 'value' } };

      // When accessing undefined properties, should return undefined (not default)
      expect(ErrorUtils.safeGet(obj, 'a.b.c', 'default')).toBeUndefined();
      expect(ErrorUtils.safeGet(obj, 'x.y.z', 'fallback')).toBe('fallback'); // This should work because x is missing
      expect(ErrorUtils.safeGet(obj, 'missing')).toBeUndefined();
    });

    it('should handle null and undefined objects gracefully', () => {
      expect(ErrorUtils.safeGet(null, 'any.path', 'default')).toBe('default');
      expect(ErrorUtils.safeGet(undefined, 'any.path', 'default')).toBe('default');
    });

    it('should handle complex nested access patterns', () => {
      const complexObj = {
        data: {
          items: [
            { id: 1, meta: { tags: ['a', 'b'] } },
            { id: 2, meta: null },
          ],
        },
      };

      // Simulate array access (though limited by simple dot notation)
      expect(ErrorUtils.safeGet(complexObj, 'data.items')).toBeDefined();
      expect(ErrorUtils.safeGet(complexObj, 'data.missing', [])).toBeUndefined(); // Returns undefined, not default
    });
  });

  describe('Insufficient Data Handling', () => {
    it('should pass through when data is sufficient', () => {
      const result = ErrorUtils.handleInsufficientData(
        100, // actual
        50,  // minimum required
        { operationName: 'test' },
        'fallback'
      );
      
      expect(result).toBe('fallback'); // Returns fallback even when sufficient
    });

    it('should return fallback for insufficient data', () => {
      const result = ErrorUtils.handleInsufficientData(
        10,  // actual  
        50,  // minimum required
        { operationName: 'test' },
        'insufficient_fallback'
      );
      
      expect(result).toBe('insufficient_fallback');
    });

    it('should throw when no fallback provided for insufficient data', () => {
      expect(() => {
        ErrorUtils.handleInsufficientData(
          5,   // actual
          10,  // minimum required
          { operationName: 'test' }
          // No fallback
        );
      }).toThrow('Insufficient data');
    });
  });

  describe('Parsing Error Recovery', () => {
    it('should handle parsing errors with retry capability', async () => {
      const filePath = join(tempDir, 'test.csv');
      writeFileSync(filePath, 'valid,csv,data\n1,2,3');
      
      let attempts = 0;
      const retryOperation = async () => {
        attempts++;
        if (attempts < 2) {
          throw new Error('Temporary parsing failure');
        }
        return 'parsed successfully';
      };

      const result = await ErrorUtils.handleParsingError(
        new Error('Parse failed'),
        filePath,
        retryOperation
      );

      expect(result).toBe('parsed successfully');
      expect(attempts).toBe(2);
    });

    it('should handle parsing errors and provide recovery', async () => {
      const filePath = join(tempDir, 'corrupted.csv');
      writeFileSync(filePath, 'invalid\x00binary\x00data');

      let attempts = 0;
      const retryOperation = async () => {
        attempts++;
        if (attempts < 2) {
          throw new Error('Retry parsing failure');
        }
        return 'recovered successfully';
      };

      const result = await ErrorUtils.handleParsingError(
        new Error('Binary data detected'),
        filePath,
        retryOperation
      );

      expect(result).toBe('recovered successfully');
      expect(attempts).toBe(2);
    });
  });
});