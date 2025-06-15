/**
 * Comprehensive Input Validation and Sanitization System
 * Prevents errors through strict input validation and safe defaults
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import { logger } from './logger';
import { DataPilotError, ErrorSeverity, ErrorCategory } from '../core/types';

export interface ValidationRule<T = any> {
  validate: (value: T) => boolean;
  message: string;
  severity: 'error' | 'warning';
  sanitize?: (value: T) => T;
}

export interface ValidationSchema {
  [key: string]: {
    type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'function' | 'buffer';
    required?: boolean;
    rules?: ValidationRule[];
    default?: any;
    min?: number;
    max?: number;
    pattern?: RegExp;
    enum?: any[];
    nested?: ValidationSchema;
  };
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  sanitizedValue: any;
}

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
  value: any;
  expectedType?: string;
}

export class InputValidator {
  private static readonly FILE_SIZE_LIMITS = {
    maxFileSize: 10 * 1024 * 1024 * 1024, // 10GB
    maxMemoryFile: 100 * 1024 * 1024, // 100MB for in-memory processing
  };

  private static readonly SECURITY_PATTERNS = {
    pathTraversal: /\.\.[\/\\]/,
    sqlInjection: /(union|select|insert|update|delete|drop|create|alter|exec|execute)/i,
    // Comprehensive HTML/Script injection patterns - more secure approach
    htmlTags: /<\/?[a-z][\s\S]*>/gi,
    scriptElements: /<script[\s\S]*?<\/script>/gi,
    dangerousElements: /<(script|iframe|object|embed|form|input|link|meta|style|base|applet)[\s\S]*?>/gi,
    eventHandlers: /\bon\w+\s*=\s*["']?[^"'>]*["']?/gi,
    javascriptProtocol: /javascript\s*:/gi,
    vbscriptProtocol: /vbscript\s*:/gi,
    dataUrls: /data\s*:\s*text\s*\/\s*(html|javascript)/gi,
    commandInjection: /[;&|`$(){}\[\]]/,
  };

  /**
   * Validate and sanitize file path
   */
  static async validateFilePath(filePath: string): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    let sanitizedPath = filePath;

    try {
      // Basic validation
      if (!filePath || typeof filePath !== 'string') {
        errors.push({
          field: 'filePath',
          message: 'File path must be a non-empty string',
          severity: 'error',
          value: filePath,
          expectedType: 'string',
        });
        return { isValid: false, errors, warnings, sanitizedValue: null };
      }

      // Sanitize path
      sanitizedPath = path.normalize(filePath.trim());

      // Security checks
      if (this.SECURITY_PATTERNS.pathTraversal.test(sanitizedPath)) {
        errors.push({
          field: 'filePath',
          message: 'Path traversal detected in file path',
          severity: 'error',
          value: filePath,
        });
      }

      // Check if path is absolute
      if (!path.isAbsolute(sanitizedPath)) {
        sanitizedPath = path.resolve(sanitizedPath);
        warnings.push({
          field: 'filePath',
          message: 'Relative path converted to absolute',
          severity: 'warning',
          value: filePath,
        });
      }

      // Check file existence and permissions
      try {
        const stats = await fs.stat(sanitizedPath);

        if (!stats.isFile()) {
          errors.push({
            field: 'filePath',
            message: 'Path does not point to a regular file',
            severity: 'error',
            value: sanitizedPath,
          });
        }

        // Check file size
        if (stats.size > this.FILE_SIZE_LIMITS.maxFileSize) {
          errors.push({
            field: 'filePath',
            message: `File size (${stats.size}) exceeds maximum limit (${this.FILE_SIZE_LIMITS.maxFileSize})`,
            severity: 'error',
            value: stats.size,
          });
        }

        if (stats.size > this.FILE_SIZE_LIMITS.maxMemoryFile) {
          warnings.push({
            field: 'filePath',
            message: 'File is large and will require streaming processing',
            severity: 'warning',
            value: stats.size,
          });
        }
      } catch (fsError: any) {
        if (fsError.code === 'ENOENT') {
          errors.push({
            field: 'filePath',
            message: 'File does not exist',
            severity: 'error',
            value: sanitizedPath,
          });
        } else if (fsError.code === 'EACCES') {
          errors.push({
            field: 'filePath',
            message: 'Permission denied accessing file',
            severity: 'error',
            value: sanitizedPath,
          });
        } else {
          errors.push({
            field: 'filePath',
            message: `File system error: ${fsError.message}`,
            severity: 'error',
            value: sanitizedPath,
          });
        }
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        sanitizedValue: sanitizedPath,
      };
    } catch (error: any) {
      errors.push({
        field: 'filePath',
        message: `Validation error: ${error.message}`,
        severity: 'error',
        value: filePath,
      });

      return { isValid: false, errors, warnings, sanitizedValue: null };
    }
  }

  /**
   * Validate worker pool configuration
   */
  static validateWorkerPoolConfig(config: any): ValidationResult {
    const schema: ValidationSchema = {
      maxWorkers: {
        type: 'number',
        required: false,
        default: Math.max(2, require('os').cpus().length - 1),
        min: 1,
        max: 32,
        rules: [
          {
            validate: (value: number) => Number.isInteger(value),
            message: 'maxWorkers must be an integer',
            severity: 'error',
          },
        ],
      },
      memoryLimitMB: {
        type: 'number',
        required: false,
        default: 256,
        min: 64,
        max: 8192,
        rules: [
          {
            validate: (value: number) => value % 64 === 0,
            message: 'memoryLimitMB should be a multiple of 64',
            severity: 'warning',
          },
        ],
      },
      taskTimeout: {
        type: 'number',
        required: false,
        default: 30000,
        min: 1000,
        max: 300000,
      },
      enableMemoryMonitoring: {
        type: 'boolean',
        required: false,
        default: true,
      },
    };

    return this.validateObject(config, schema, 'workerPoolConfig');
  }

  /**
   * Validate streaming configuration
   */
  static validateStreamingConfig(config: any): ValidationResult {
    const schema: ValidationSchema = {
      chunkSize: {
        type: 'number',
        required: false,
        default: 64 * 1024,
        min: 1024,
        max: 64 * 1024 * 1024,
        rules: [
          {
            validate: (value: number) => (value & (value - 1)) === 0,
            message: 'chunkSize should be a power of 2 for optimal performance',
            severity: 'warning',
          },
        ],
      },
      memoryThresholdMB: {
        type: 'number',
        required: false,
        default: 512,
        min: 64,
        max: 16384,
      },
      maxRowsAnalyzed: {
        type: 'number',
        required: false,
        default: 1000000,
        min: 1000,
        max: 100000000,
      },
      enableAdaptiveStreaming: {
        type: 'boolean',
        required: false,
        default: true,
      },
    };

    return this.validateObject(config, schema, 'streamingConfig');
  }

  /**
   * Validate buffer data
   */
  static validateBuffer(buffer: any, maxSize?: number): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    if (!Buffer.isBuffer(buffer)) {
      errors.push({
        field: 'buffer',
        message: 'Value is not a valid Buffer',
        severity: 'error',
        value: typeof buffer,
        expectedType: 'Buffer',
      });
      return { isValid: false, errors, warnings, sanitizedValue: null };
    }

    if (maxSize && buffer.length > maxSize) {
      errors.push({
        field: 'buffer',
        message: `Buffer size (${buffer.length}) exceeds maximum (${maxSize})`,
        severity: 'error',
        value: buffer.length,
      });
    }

    if (buffer.length === 0) {
      warnings.push({
        field: 'buffer',
        message: 'Buffer is empty',
        severity: 'warning',
        value: buffer.length,
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      sanitizedValue: buffer,
    };
  }

  /**
   * Validate and sanitize CSV parsing options
   */
  static validateCSVOptions(options: any): ValidationResult {
    const schema: ValidationSchema = {
      delimiter: {
        type: 'string',
        required: false,
        default: ',',
        rules: [
          {
            validate: (value: string) => value.length === 1,
            message: 'Delimiter must be a single character',
            severity: 'error',
          },
        ],
      },
      quote: {
        type: 'string',
        required: false,
        default: '"',
        rules: [
          {
            validate: (value: string) => value.length === 1,
            message: 'Quote character must be a single character',
            severity: 'error',
          },
        ],
      },
      encoding: {
        type: 'string',
        required: false,
        default: 'utf8',
        enum: ['utf8', 'ascii', 'latin1', 'utf16le', 'base64', 'hex'],
      },
      hasHeader: {
        type: 'boolean',
        required: false,
        default: true,
      },
      maxRows: {
        type: 'number',
        required: false,
        default: 1000000,
        min: 1,
        max: 100000000,
      },
    };

    return this.validateObject(options, schema, 'csvOptions');
  }

  /**
   * Validate numeric array data
   */
  static validateNumericArray(data: any, fieldName: string = 'data'): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    const sanitizedData = data;

    if (!Array.isArray(data)) {
      errors.push({
        field: fieldName,
        message: 'Value must be an array',
        severity: 'error',
        value: typeof data,
        expectedType: 'array',
      });
      return { isValid: false, errors, warnings, sanitizedValue: null };
    }

    if (data.length === 0) {
      warnings.push({
        field: fieldName,
        message: 'Array is empty',
        severity: 'warning',
        value: data.length,
      });
      return { isValid: true, errors, warnings, sanitizedValue: [] };
    }

    // Validate and sanitize numeric values
    const sanitizedArray: number[] = [];
    let invalidCount = 0;

    for (let i = 0; i < data.length; i++) {
      const value = data[i];

      if (typeof value === 'number' && isFinite(value)) {
        sanitizedArray.push(value);
      } else if (typeof value === 'string') {
        const parsed = parseFloat(value);
        if (isFinite(parsed)) {
          sanitizedArray.push(parsed);
        } else {
          invalidCount++;
        }
      } else if (value === null || value === undefined) {
        // Skip null/undefined values
        continue;
      } else {
        invalidCount++;
      }
    }

    if (invalidCount > 0) {
      const invalidRatio = invalidCount / data.length;
      if (invalidRatio > 0.5) {
        errors.push({
          field: fieldName,
          message: `Too many invalid numeric values (${invalidCount}/${data.length})`,
          severity: 'error',
          value: invalidCount,
        });
      } else {
        warnings.push({
          field: fieldName,
          message: `Skipped ${invalidCount} invalid numeric values`,
          severity: 'warning',
          value: invalidCount,
        });
      }
    }

    return {
      isValid: errors.length === 0 && sanitizedArray.length > 0,
      errors,
      warnings,
      sanitizedValue: sanitizedArray,
    };
  }

  /**
   * Generic object validation against schema
   */
  static validateObject(
    obj: any,
    schema: ValidationSchema,
    objectName: string = 'object',
  ): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    const sanitizedValue: any = {};

    if (typeof obj !== 'object' || obj === null) {
      errors.push({
        field: objectName,
        message: 'Value must be an object',
        severity: 'error',
        value: typeof obj,
        expectedType: 'object',
      });
      return { isValid: false, errors, warnings, sanitizedValue: null };
    }

    // Validate each field in schema
    for (const [fieldName, fieldSchema] of Object.entries(schema)) {
      const fieldPath = `${objectName}.${fieldName}`;
      let value = obj[fieldName];

      // Handle missing required fields
      if (value === undefined || value === null) {
        if (fieldSchema.required) {
          errors.push({
            field: fieldPath,
            message: `Required field '${fieldName}' is missing`,
            severity: 'error',
            value: value,
          });
          continue;
        } else if (fieldSchema.default !== undefined) {
          value = fieldSchema.default;
        } else {
          continue; // Skip optional fields without defaults
        }
      }

      // Type validation
      if (!this.validateType(value, fieldSchema.type)) {
        errors.push({
          field: fieldPath,
          message: `Field '${fieldName}' must be of type ${fieldSchema.type}`,
          severity: 'error',
          value: typeof value,
          expectedType: fieldSchema.type,
        });
        continue;
      }

      // Range validation for numbers
      if (fieldSchema.type === 'number') {
        if (fieldSchema.min !== undefined && value < fieldSchema.min) {
          errors.push({
            field: fieldPath,
            message: `Field '${fieldName}' must be >= ${fieldSchema.min}`,
            severity: 'error',
            value: value,
          });
          continue;
        }
        if (fieldSchema.max !== undefined && value > fieldSchema.max) {
          errors.push({
            field: fieldPath,
            message: `Field '${fieldName}' must be <= ${fieldSchema.max}`,
            severity: 'error',
            value: value,
          });
          continue;
        }
      }

      // Pattern validation for strings
      if (fieldSchema.type === 'string' && fieldSchema.pattern) {
        if (!fieldSchema.pattern.test(value)) {
          errors.push({
            field: fieldPath,
            message: `Field '${fieldName}' does not match required pattern`,
            severity: 'error',
            value: value,
          });
          continue;
        }
      }

      // Enum validation
      if (fieldSchema.enum && !fieldSchema.enum.includes(value)) {
        errors.push({
          field: fieldPath,
          message: `Field '${fieldName}' must be one of: ${fieldSchema.enum.join(', ')}`,
          severity: 'error',
          value: value,
        });
        continue;
      }

      // Custom rule validation
      if (fieldSchema.rules) {
        let sanitizedFieldValue = value;

        for (const rule of fieldSchema.rules) {
          if (!rule.validate(value)) {
            if (rule.severity === 'error') {
              errors.push({
                field: fieldPath,
                message: rule.message,
                severity: 'error',
                value: value,
              });
            } else {
              warnings.push({
                field: fieldPath,
                message: rule.message,
                severity: 'warning',
                value: value,
              });
            }
          }

          // Apply sanitization if available
          if (rule.sanitize) {
            sanitizedFieldValue = rule.sanitize(sanitizedFieldValue);
          }
        }

        value = sanitizedFieldValue;
      }

      sanitizedValue[fieldName] = value;
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      sanitizedValue: errors.length === 0 ? sanitizedValue : null,
    };
  }

  /**
   * Type validation helper
   */
  private static validateType(value: any, expectedType: string): boolean {
    switch (expectedType) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number' && isFinite(value);
      case 'boolean':
        return typeof value === 'boolean';
      case 'array':
        return Array.isArray(value);
      case 'object':
        return typeof value === 'object' && value !== null && !Array.isArray(value);
      case 'function':
        return typeof value === 'function';
      case 'buffer':
        return Buffer.isBuffer(value);
      default:
        return false;
    }
  }

  /**
   * Security sanitization for string inputs
   * Uses comprehensive HTML filtering to prevent XSS attacks
   */
  static sanitizeString(input: string): string {
    if (typeof input !== 'string') {
      return '';
    }

    return input
      // Remove dangerous HTML elements and script tags
      .replace(this.SECURITY_PATTERNS.dangerousElements, '')
      .replace(this.SECURITY_PATTERNS.scriptElements, '')
      // Remove event handlers (onclick, onload, etc.)
      .replace(this.SECURITY_PATTERNS.eventHandlers, '')
      // Remove dangerous protocols
      .replace(this.SECURITY_PATTERNS.javascriptProtocol, '')
      .replace(this.SECURITY_PATTERNS.vbscriptProtocol, '')
      // Remove data URLs that could contain HTML/JS
      .replace(this.SECURITY_PATTERNS.dataUrls, '')
      // Remove control characters and null bytes
      .replace(/[\x00-\x1F\x7F]/g, '')
      .trim()
      .slice(0, 10000); // Limit length
  }

  /**
   * Secure HTML sanitization for content that may contain HTML
   * Implements a whitelist approach for maximum security
   */
  static sanitizeHTML(input: string, allowedTags: string[] = []): string {
    if (typeof input !== 'string') {
      return '';
    }

    // First pass: Remove all HTML if no tags are allowed
    if (allowedTags.length === 0) {
      return input
        .replace(this.SECURITY_PATTERNS.htmlTags, '')
        .replace(/[\x00-\x1F\x7F]/g, '')
        .trim();
    }

    // Second pass: Remove dangerous elements and attributes
    let sanitized = input
      // Remove dangerous elements completely
      .replace(this.SECURITY_PATTERNS.dangerousElements, '')
      // Remove all event handlers
      .replace(this.SECURITY_PATTERNS.eventHandlers, '')
      // Remove dangerous protocols
      .replace(this.SECURITY_PATTERNS.javascriptProtocol, 'removed:')
      .replace(this.SECURITY_PATTERNS.vbscriptProtocol, 'removed:')
      // Remove dangerous data URLs
      .replace(this.SECURITY_PATTERNS.dataUrls, 'removed:');

    // Third pass: Only allow specified tags
    const allowedTagsRegex = new RegExp(
      `<(?!/?(?:${allowedTags.join('|')})(?:\\s|>))[^>]*>`,
      'gi'
    );
    sanitized = sanitized.replace(allowedTagsRegex, '');

    return sanitized
      .replace(/[\x00-\x1F\x7F]/g, '')
      .trim()
      .slice(0, 50000); // Larger limit for HTML content
  }

  /**
   * Validate and throw on validation errors
   */
  static validateAndThrow(result: ValidationResult, operation: string): any {
    if (!result.isValid) {
      const errorMessages = result.errors.map((e) => `${e.field}: ${e.message}`).join('; ');
      throw new DataPilotError(
        `Validation failed for ${operation}: ${errorMessages}`,
        'VALIDATION_ERROR',
        ErrorSeverity.HIGH,
        ErrorCategory.VALIDATION,
      );
    }

    // Log warnings
    if (result.warnings.length > 0) {
      const warningMessages = result.warnings.map((w) => `${w.field}: ${w.message}`).join('; ');
      logger.warn(`Validation warnings for ${operation}: ${warningMessages}`);
    }

    return result.sanitizedValue;
  }
}
