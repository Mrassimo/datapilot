/**
 * Error Handler Infrastructure Tests
 */

import { describe, test, expect, beforeEach } from '@jest/globals';

describe('Error Handling Infrastructure', () => {
  beforeEach(() => {
    // Reset any global state if needed
  });

  test('should import error types successfully', () => {
    const errorHandler = require('../../dist/utils/error-handler.js');
    
    expect(errorHandler.globalErrorHandler).toBeDefined();
    expect(errorHandler.DataPilotError).toBeDefined();
    expect(errorHandler.ErrorSeverity).toBeDefined();
    expect(errorHandler.ErrorCategory).toBeDefined();
  });

  test('should create DataPilotError with correct properties', () => {
    const { DataPilotError } = require('../../dist/utils/error-handler.js');
    
    const error = new DataPilotError(
      'Test error message',
      'TEST_ERROR',
      'high', // ErrorSeverity.HIGH
      'validation', // ErrorCategory.VALIDATION
      { operationName: 'test-context' }
    );

    expect(error.message).toBe('Test error message');
    expect(error.code).toBe('TEST_ERROR');
    expect(error.severity).toBe('high');
    expect(error.category).toBe('validation');
    expect(error.name).toBe('DataPilotError');
  });

  test('should provide formatted error messages', () => {
    const { DataPilotError } = require('../../dist/utils/error-handler.js');
    
    const error = new DataPilotError(
      'Memory threshold exceeded',
      'MEMORY_EXCEEDED',
      'high', // ErrorSeverity.HIGH
      'memory', // ErrorCategory.MEMORY
      { operationName: 'test-operation' }
    );

    const formatted = error.getFormattedMessage();
    expect(formatted).toContain('MEMORY_EXCEEDED');
    expect(formatted).toContain('Memory threshold exceeded');
  });

  test('should handle errors with recovery', async () => {
    const { DataPilotError, globalErrorHandler } = require('../../dist/utils/error-handler.js');
    
    globalErrorHandler.reset();
    
    const error = new DataPilotError(
      'Test handled error',
      'TEST_ERROR',
      'medium', // ErrorSeverity.MEDIUM
      'analysis', // ErrorCategory.ANALYSIS
      undefined,
      undefined,
      true // recoverable
    );

    const mockOperation = jest.fn(() => Promise.resolve('success'));
    
    try {
      await globalErrorHandler.handleError(error, mockOperation);
    } catch (e) {
      // May throw depending on recovery strategy
    }

    const stats = globalErrorHandler.getStats();
    expect(stats.totalErrors).toBeGreaterThan(0);
  });

  test('should provide error statistics', () => {
    const { globalErrorHandler } = require('../../dist/utils/error-handler.js');
    
    const stats = globalErrorHandler.getErrorStatistics();
    expect(stats).toBeDefined();
    expect(stats.totalErrors).toBeDefined();
    expect(stats.byCategory).toBeDefined();
    expect(stats.bySeverity).toBeDefined();
  });

  test('should validate enum definitions', () => {
    const { ErrorSeverity, ErrorCategory } = require('../../dist/utils/error-handler.js');
    
    // Test ErrorSeverity enum
    expect(ErrorSeverity.LOW).toBe('low');
    expect(ErrorSeverity.MEDIUM).toBe('medium');
    expect(ErrorSeverity.HIGH).toBe('high');
    expect(ErrorSeverity.CRITICAL).toBe('critical');
    
    // Test ErrorCategory enum
    expect(ErrorCategory.VALIDATION).toBe('validation');
    expect(ErrorCategory.PARSING).toBe('parsing');
    expect(ErrorCategory.ANALYSIS).toBe('analysis');
    expect(ErrorCategory.MEMORY).toBe('memory');
    expect(ErrorCategory.IO).toBe('io');
  });

  test('should provide suggestions for errors', () => {
    const { DataPilotError } = require('../../dist/utils/error-handler.js');
    
    const error = new DataPilotError(
      'File not found',
      'FILE_NOT_FOUND',
      'critical', // ErrorSeverity.CRITICAL
      'io' // ErrorCategory.IO
    );

    const suggestions = error.getSuggestions();
    expect(Array.isArray(suggestions)).toBe(true);
  });

  test('should handle error categories correctly', async () => {
    const { DataPilotError, globalErrorHandler } = require('../../dist/utils/error-handler.js');
    
    globalErrorHandler.reset();
    
    const validationError = new DataPilotError(
      'Validation failed',
      'VALIDATION_ERROR',
      'high', // ErrorSeverity.HIGH
      'validation' // ErrorCategory.VALIDATION
    );

    const ioError = new DataPilotError(
      'File read failed',
      'IO_ERROR',
      'critical', // ErrorSeverity.CRITICAL
      'io' // ErrorCategory.IO
    );

    const mockOperation = () => Promise.resolve('success');
    
    try {
      await globalErrorHandler.handleError(validationError, mockOperation);
    } catch {}
    
    try {
      await globalErrorHandler.handleError(ioError, mockOperation);
    } catch {}

    const stats = globalErrorHandler.getStats();
    expect(stats.totalErrors).toBe(2);
  });
});