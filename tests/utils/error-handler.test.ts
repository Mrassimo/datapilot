/**
 * Error Handler Infrastructure Tests
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import { DataPilotError, ErrorSeverity, ErrorCategory, globalErrorHandler } from '../../src/utils/error-handler';

describe('Error Handling Infrastructure', () => {
  beforeEach(() => {
    // Clear any previous error handlers
    globalErrorHandler.clearHistory();
  });

  describe('DataPilotError Class', () => {
    test('should create error with all properties', () => {
      const error = new DataPilotError(
        'Test error message',
        ErrorSeverity.HIGH,
        ErrorCategory.VALIDATION,
        'test-context'
      );

      expect(error.message).toBe('Test error message');
      expect(error.severity).toBe(ErrorSeverity.HIGH);
      expect(error.category).toBe(ErrorCategory.VALIDATION);
      expect(error.context).toBe('test-context');
      expect(error.name).toBe('DataPilotError');
      expect(error.timestamp).toBeDefined();
    });

    test('should provide actionable suggestions', () => {
      const error = new DataPilotError(
        'File not found',
        ErrorSeverity.CRITICAL,
        ErrorCategory.IO
      );

      expect(error.getSuggestions()).toBeDefined();
      expect(Array.isArray(error.getSuggestions())).toBe(true);
      expect(error.getSuggestions().length).toBeGreaterThan(0);
    });

    test('should generate user-friendly summary', () => {
      const error = new DataPilotError(
        'Memory threshold exceeded',
        ErrorSeverity.HIGH,
        ErrorCategory.MEMORY
      );

      const summary = error.getUserFriendlySummary();
      expect(summary).toBeDefined();
      expect(summary.message).toBeDefined();
      expect(summary.severity).toBeDefined();
      expect(summary.category).toBeDefined();
      expect(summary.suggestions).toBeDefined();
    });
  });

  describe('Global Error Handler', () => {
    test('should handle and log errors', () => {
      const error = new DataPilotError(
        'Test handled error',
        ErrorSeverity.MEDIUM,
        ErrorCategory.ANALYSIS
      );

      expect(() => globalErrorHandler.handleError(error)).not.toThrow();
      
      const history = globalErrorHandler.getErrorHistory();
      expect(history.length).toBeGreaterThan(0);
      expect(history[0].error.message).toBe('Test handled error');
    });

    test('should categorize errors correctly', () => {
      const validationError = new DataPilotError(
        'Validation failed',
        ErrorSeverity.HIGH,
        ErrorCategory.VALIDATION
      );

      const ioError = new DataPilotError(
        'File read failed',
        ErrorSeverity.CRITICAL,
        ErrorCategory.IO
      );

      globalErrorHandler.handleError(validationError);
      globalErrorHandler.handleError(ioError);

      const history = globalErrorHandler.getErrorHistory();
      expect(history.length).toBe(2);
      
      const validationErrors = history.filter(h => h.error.category === ErrorCategory.VALIDATION);
      const ioErrors = history.filter(h => h.error.category === ErrorCategory.IO);
      
      expect(validationErrors.length).toBe(1);
      expect(ioErrors.length).toBe(1);
    });

    test('should provide error statistics', () => {
      // Add multiple errors
      for (let i = 0; i < 5; i++) {
        globalErrorHandler.handleError(new DataPilotError(
          `Error ${i}`,
          ErrorSeverity.MEDIUM,
          ErrorCategory.ANALYSIS
        ));
      }

      const stats = globalErrorHandler.getErrorStatistics();
      expect(stats).toBeDefined();
      expect(stats.totalErrors).toBe(5);
      expect(stats.bySeverity[ErrorSeverity.MEDIUM]).toBe(5);
      expect(stats.byCategory[ErrorCategory.ANALYSIS]).toBe(5);
    });

    test('should clear error history', () => {
      globalErrorHandler.handleError(new DataPilotError(
        'Test error',
        ErrorSeverity.LOW,
        ErrorCategory.PARSING
      ));

      expect(globalErrorHandler.getErrorHistory().length).toBe(1);
      
      globalErrorHandler.clearHistory();
      expect(globalErrorHandler.getErrorHistory().length).toBe(0);
    });
  });

  describe('Error Severity Levels', () => {
    test('should have all severity levels defined', () => {
      expect(ErrorSeverity.LOW).toBeDefined();
      expect(ErrorSeverity.MEDIUM).toBeDefined();
      expect(ErrorSeverity.HIGH).toBeDefined();
      expect(ErrorSeverity.CRITICAL).toBeDefined();
    });

    test('should prioritize errors correctly', () => {
      const lowError = new DataPilotError('Low', ErrorSeverity.LOW, ErrorCategory.ANALYSIS);
      const criticalError = new DataPilotError('Critical', ErrorSeverity.CRITICAL, ErrorCategory.ANALYSIS);

      expect(criticalError.severity).toBeGreaterThan(lowError.severity);
    });
  });

  describe('Error Categories', () => {
    test('should have all categories defined', () => {
      expect(ErrorCategory.VALIDATION).toBeDefined();
      expect(ErrorCategory.PARSING).toBeDefined();
      expect(ErrorCategory.ANALYSIS).toBeDefined();
      expect(ErrorCategory.MEMORY).toBeDefined();
      expect(ErrorCategory.NETWORK).toBeDefined();
      expect(ErrorCategory.IO).toBeDefined();
    });

    test('should provide category-specific suggestions', () => {
      const memoryError = new DataPilotError(
        'Out of memory',
        ErrorSeverity.HIGH,
        ErrorCategory.MEMORY
      );

      const suggestions = memoryError.getSuggestions();
      expect(suggestions.some(s => s.includes('memory') || s.includes('reduce'))).toBe(true);
    });
  });
});