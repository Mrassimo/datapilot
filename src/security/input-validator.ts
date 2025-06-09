/**
 * Input Validation and Sanitization
 * Security layer for file paths and CSV content
 */

import { resolve, normalize, join } from 'path';
import { DataPilotError, ErrorSeverity, ErrorCategory } from '../utils/error-handler';

export interface ValidationResult {
  valid: boolean;
  sanitized?: string;
  errors: string[];
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
    /\.\./,           // Path traversal
    /[<>:"|?*]/,      // Windows invalid chars
    /[\x00-\x1f]/,    // Control characters
    /^\s|\s$/,        // Leading/trailing spaces
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
      return { valid: false, errors, warnings };
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
        errors.push(`File extension '${extension}' not allowed. Allowed: ${this.config.allowedExtensions.join(', ')}`);
      }

      // Check if path stays within allowed directories
      if (this.config.allowedDirectories.length > 0) {
        const isAllowed = this.config.allowedDirectories.some(allowedDir => {
          const normalizedAllowed = resolve(allowedDir);
          return resolvedPath.startsWith(normalizedAllowed);
        });

        if (!isAllowed) {
          errors.push('File path outside allowed directories');
        }
      }

      return {
        valid: errors.length === 0,
        sanitized: resolvedPath,
        errors,
        warnings,
      };
    } catch (error) {
      errors.push(`Path resolution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { valid: false, errors, warnings };
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
      return { valid: false, errors, warnings };
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

    return {
      valid: errors.length === 0,
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

    return {
      valid: errors.length === 0,
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
      return { valid: false, errors, warnings };
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

    return {
      valid: errors.length === 0,
      sanitized: config,
      errors,
      warnings,
    };
  }

  /**
   * Comprehensive security validation
   */
  validateInput(input: {
    filePath?: string;
    config?: any;
    csvHeader?: string;
  }): ValidationResult {
    const allErrors: string[] = [];
    const allWarnings: string[] = [];

    if (input.filePath) {
      const pathResult = this.validateFilePath(input.filePath);
      allErrors.push(...pathResult.errors);
      allWarnings.push(...pathResult.warnings);
    }

    if (input.config) {
      const configResult = this.validateConfig(input.config);
      allErrors.push(...configResult.errors);
      allWarnings.push(...configResult.warnings);
    }

    if (input.csvHeader) {
      const headerResult = this.validateCSVHeader(input.csvHeader);
      allErrors.push(...headerResult.errors);
      allWarnings.push(...headerResult.warnings);
    }

    return {
      valid: allErrors.length === 0,
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