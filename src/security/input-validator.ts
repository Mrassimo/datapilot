/**
 * Input Validation and Sanitization
 * Security layer for file paths and CSV content
 */

import { resolve, normalize, join } from 'path';
import { DataPilotError, ErrorSeverity, ErrorCategory } from '../utils/error-handler';

export interface ValidationResult {
  isValid: boolean;
  valid: boolean; // Backwards compatibility
  sanitizedValue?: string;
  sanitized?: string; // Backwards compatibility
  errors: (string | DataPilotError)[];
  warnings: string[];
}

export interface SecurityConfig {
  allowedExtensions: string[];
  maxFileSize: number;
  maxPathLength: number;
  allowedDirectories: string[];
  blockedPatterns: RegExp[];
}

const DEFAULT_SECURITY_CONFIG: SecurityConfig = {
  allowedExtensions: ['.csv', '.tsv', '.txt'],
  maxFileSize: 10 * 1024 * 1024 * 1024, // 10GB
  maxPathLength: 1000,
  allowedDirectories: [], // Empty means allow current working directory
  blockedPatterns: [
    /\.\./, // Path traversal
    /[<>:"|?*]/, // Windows invalid chars
    /[\x00-\x1f]/, // Control characters
    /^\s|\s$/, // Leading/trailing spaces
  ],
};

export class InputValidator {
  private config: SecurityConfig;

  constructor(config: Partial<SecurityConfig> = {}) {
    this.config = { ...DEFAULT_SECURITY_CONFIG, ...config };
  }

  /**
   * Validate and sanitize file path
   */
  validateFilePath(inputPath: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic validation
    if (!inputPath || typeof inputPath !== 'string') {
      errors.push('File path is required and must be a string');
      return { 
        isValid: false, 
        valid: false, 
        errors, 
        warnings 
      };
    }

    if (inputPath.length > this.config.maxPathLength) {
      errors.push(`File path too long (max ${this.config.maxPathLength} characters)`);
    }

    // Check for blocked patterns
    for (const pattern of this.config.blockedPatterns) {
      if (pattern.test(inputPath)) {
        errors.push(`File path contains invalid pattern: ${pattern.source}`);
      }
    }

    try {
      // Normalize and resolve path
      const normalizedPath = normalize(inputPath);
      const resolvedPath = resolve(normalizedPath);

      // Check file extension
      const extension = this.getFileExtension(resolvedPath);
      if (!this.config.allowedExtensions.includes(extension)) {
        errors.push(
          `File extension '${extension}' not allowed. Allowed: ${this.config.allowedExtensions.join(', ')}`,
        );
      }

      // Check if path stays within allowed directories
      if (this.config.allowedDirectories.length > 0) {
        const isAllowed = this.config.allowedDirectories.some((allowedDir) => {
          const normalizedAllowed = resolve(allowedDir);
          return resolvedPath.startsWith(normalizedAllowed);
        });

        if (!isAllowed) {
          errors.push('File path outside allowed directories');
        }
      }

      const isValid = errors.length === 0;
      return {
        isValid,
        valid: isValid,
        sanitizedValue: resolvedPath,
        sanitized: resolvedPath,
        errors,
        warnings,
      };
    } catch (error) {
      errors.push(
        `Path resolution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return { 
        isValid: false, 
        valid: false, 
        errors, 
        warnings 
      };
    }
  }

  /**
   * Validate CSV content header
   */
  validateCSVHeader(header: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!header || typeof header !== 'string') {
      errors.push('CSV header is required');
      return { isValid: false, valid: false, errors, warnings };
    }

    // Check for control characters
    if (/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(header)) {
      errors.push('CSV header contains control characters');
    }

    // Check for extremely long headers
    if (header.length > 10000) {
      warnings.push('CSV header is very long (>10KB)');
    }

    // Check for suspicious patterns
    const suspiciousPatterns = [
      /javascript:/i,
      /data:.*base64/i,
      /<script/i,
      /eval\s*\(/i,
      /function\s*\(/i,
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(header)) {
        warnings.push(`CSV header contains suspicious pattern: ${pattern.source}`);
      }
    }

    const isValid = errors.length === 0;
    return {
      isValid,
      valid: isValid,
      sanitizedValue: header.trim(),
      sanitized: header.trim(),
      errors,
      warnings,
    };
  }

  /**
   * Validate individual CSV field
   */
  validateCSVField(field: string, maxLength: number = 1000): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (field && field.length > maxLength) {
      errors.push(`Field too long (max ${maxLength} characters)`);
    }

    // Check for null bytes
    if (field && field.includes('\x00')) {
      errors.push('Field contains null bytes');
    }

    const isValid = errors.length === 0;
    return {
      isValid,
      valid: isValid,
      sanitizedValue: field,
      sanitized: field,
      errors,
      warnings,
    };
  }

  /**
   * Validate configuration object
   */
  validateConfig(config: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config || typeof config !== 'object') {
      errors.push('Configuration must be an object');
      return { isValid: false, valid: false, errors, warnings };
    }

    // Check for dangerous configuration values
    const dangerousKeys = ['eval', 'function', 'require', 'import', '__proto__', 'constructor'];

    const checkObject = (obj: any, path = ''): void => {
      for (const key in obj) {
        const fullPath = path ? `${path}.${key}` : key;

        if (dangerousKeys.includes(key.toLowerCase())) {
          warnings.push(`Potentially dangerous configuration key: ${fullPath}`);
        }

        if (typeof obj[key] === 'object' && obj[key] !== null) {
          checkObject(obj[key], fullPath);
        }
      }
    };

    checkObject(config);

    const isValid = errors.length === 0;
    return {
      isValid,
      valid: isValid,
      sanitizedValue: config,
      sanitized: config,
      errors,
      warnings,
    };
  }

  /**
   * Validate CLI input options
   */
  validateCLIInput(options: Record<string, unknown>, context?: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const sanitizedOptions: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(options)) {
      // Check for dangerous keys
      if (['eval', 'function', 'require', 'import', '__proto__', 'constructor'].includes(key.toLowerCase())) {
        errors.push(`Dangerous CLI option key: ${key}`);
        continue;
      }

      // Sanitize string values
      if (typeof value === 'string') {
        // Check for script injection
        if (/<script|javascript:|data:/.test(value)) {
          errors.push(`Potentially dangerous value in CLI option: ${key}`);
          continue;
        }
        sanitizedOptions[key] = value.trim();
      } else {
        sanitizedOptions[key] = value;
      }
    }

    const isValid = errors.length === 0;
    return {
      isValid,
      valid: isValid,
      sanitizedValue: sanitizedOptions as any,
      sanitized: sanitizedOptions as any,
      errors,
      warnings,
    };
  }

  /**
   * Comprehensive security validation
   */
  validateInput(input: { filePath?: string; config?: any; csvHeader?: string }): ValidationResult {
    const allErrors: string[] = [];
    const allWarnings: string[] = [];

    if (input.filePath) {
      const pathResult = this.validateFilePath(input.filePath);
      allErrors.push(...pathResult.errors.map(e => typeof e === 'string' ? e : e.message));
      allWarnings.push(...pathResult.warnings);
    }

    if (input.config) {
      const configResult = this.validateConfig(input.config);
      allErrors.push(...configResult.errors.map(e => typeof e === 'string' ? e : e.message));
      allWarnings.push(...configResult.warnings);
    }

    if (input.csvHeader) {
      const headerResult = this.validateCSVHeader(input.csvHeader);
      allErrors.push(...headerResult.errors.map(e => typeof e === 'string' ? e : e.message));
      allWarnings.push(...headerResult.warnings);
    }

    const isValid = allErrors.length === 0;
    return {
      isValid,
      valid: isValid,
      errors: allErrors,
      warnings: allWarnings,
    };
  }

  private getFileExtension(filePath: string): string {
    const lastDot = filePath.lastIndexOf('.');
    return lastDot === -1 ? '' : filePath.substring(lastDot).toLowerCase();
  }
}

// Global validator instance
export const globalInputValidator = new InputValidator();

/**
 * Factory function for easy access
 */
export function getInputValidator(): InputValidator {
  return globalInputValidator;
}

/**
 * External data validator for additional security checks
 */
export class ExternalDataValidator {
  private validator: InputValidator;

  constructor() {
    this.validator = new InputValidator();
  }

  /**
   * Validate external data sources
   */
  validateDataSource(source: string, context?: any): ValidationResult {
    return this.validator.validateFilePath(source);
  }

  /**
   * Sanitize external input
   */
  sanitizeInput(input: string): string {
    return input.replace(/[<>:"|?*\x00-\x1f]/g, '').trim();
  }
}
