/**
 * Comprehensive validation utilities for DataPilot
 */

import { existsSync, statSync, accessSync, constants } from 'fs';
import { extname, isAbsolute, resolve } from 'path';
import type { ActionableSuggestion } from '../core/types';
import { DataPilotError, ErrorSeverity } from '../core/types';

export interface ValidationRule<T = unknown> {
  name: string;
  validate: (value: T) => boolean;
  message: string;
  suggestion?: ActionableSuggestion;
}

export interface ValidationResult {
  isValid: boolean;
  errors: DataPilotError[];
  warnings: DataPilotError[];
}

export class Validator {
  /**
   * Validate file path and accessibility
   */
  static validateFilePath(filePath: string): ValidationResult {
    const errors: DataPilotError[] = [];
    const warnings: DataPilotError[] = [];

    // Basic path validation
    if (!filePath || typeof filePath !== 'string') {
      errors.push(
        DataPilotError.validation(
          'File path must be a non-empty string',
          'INVALID_FILE_PATH_TYPE',
          { filePath },
          [
            {
              action: 'Provide valid file path',
              description: 'Ensure the file path is a valid string',
              severity: ErrorSeverity.HIGH,
            },
          ],
        ),
      );
      return { isValid: false, errors, warnings };
    }

    // Check if path is absolute, make it absolute if not
    const absolutePath = isAbsolute(filePath) ? filePath : resolve(filePath);

    // Check file existence
    if (!existsSync(absolutePath)) {
      errors.push(
        DataPilotError.validation(
          `File does not exist: ${absolutePath}`,
          'FILE_NOT_FOUND',
          { filePath: absolutePath },
          [
            {
              action: 'Check file path',
              description: 'Verify the file path is correct and the file exists',
              severity: ErrorSeverity.HIGH,
            },
            {
              action: 'Check current directory',
              description: 'Ensure you are in the correct directory',
              severity: ErrorSeverity.MEDIUM,
            },
          ],
        ),
      );
      return { isValid: false, errors, warnings };
    }

    // Check file accessibility
    try {
      accessSync(absolutePath, constants.R_OK);
    } catch (error) {
      errors.push(
        DataPilotError.validation(
          `File is not readable: ${absolutePath}`,
          'FILE_NOT_READABLE',
          { filePath: absolutePath },
          [
            {
              action: 'Check file permissions',
              description: 'Ensure you have read permission for the file',
              severity: ErrorSeverity.HIGH,
              command: 'chmod +r ' + absolutePath,
            },
            {
              action: 'Check file ownership',
              description: 'Verify you own the file or have appropriate access',
              severity: ErrorSeverity.MEDIUM,
            },
          ],
        ),
      );
      return { isValid: false, errors, warnings };
    }

    // Get file stats
    let stats;
    try {
      stats = statSync(absolutePath);
    } catch (error) {
      errors.push(
        DataPilotError.validation(
          `Cannot access file stats: ${error instanceof Error ? error.message : 'Unknown error'}`,
          'FILE_STATS_ERROR',
          { filePath: absolutePath },
        ),
      );
      return { isValid: false, errors, warnings };
    }

    // Check if it's a file
    if (!stats.isFile()) {
      errors.push(
        DataPilotError.validation(
          `Path is not a file: ${absolutePath}`,
          'NOT_A_FILE',
          { filePath: absolutePath },
          [
            {
              action: 'Provide file path',
              description: 'Ensure the path points to a file, not a directory',
              severity: ErrorSeverity.HIGH,
            },
          ],
        ),
      );
      return { isValid: false, errors, warnings };
    }

    // Check file extension
    const extension = extname(absolutePath).toLowerCase();
    const validExtensions = ['.csv', '.tsv', '.txt'];

    if (!validExtensions.includes(extension)) {
      warnings.push(
        DataPilotError.validation(
          `Unexpected file extension: ${extension}. Expected: ${validExtensions.join(', ')}`,
          'UNEXPECTED_EXTENSION',
          { filePath: absolutePath },
          [
            {
              action: 'Verify file format',
              description: 'Ensure the file contains CSV-formatted data',
              severity: ErrorSeverity.MEDIUM,
            },
          ],
        ),
      );
    }

    // Check file size
    const fileSizeMB = stats.size / (1024 * 1024);

    if (stats.size === 0) {
      errors.push(
        DataPilotError.validation('File is empty', 'EMPTY_FILE', { filePath: absolutePath }, [
          {
            action: 'Check file content',
            description: 'Ensure the file contains data',
            severity: ErrorSeverity.HIGH,
          },
        ]),
      );
      return { isValid: false, errors, warnings };
    }

    if (fileSizeMB > 1000) {
      // 1GB warning
      warnings.push(
        DataPilotError.validation(
          `Large file detected: ${fileSizeMB.toFixed(1)}MB. Processing may be slow.`,
          'LARGE_FILE_WARNING',
          { filePath: absolutePath },
          [
            {
              action: 'Use streaming mode',
              description: 'Consider using --maxRows to limit processing',
              severity: ErrorSeverity.MEDIUM,
              command: '--maxRows 100000',
            },
            {
              action: 'Increase memory',
              description: 'Consider increasing available memory',
              severity: ErrorSeverity.LOW,
            },
          ],
        ),
      );
    }

    // Check file age
    const fileAgeDays = (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60 * 24);
    if (fileAgeDays > 365) {
      warnings.push(
        DataPilotError.validation(
          `File is quite old (${Math.round(fileAgeDays)} days). Data may be outdated.`,
          'OLD_FILE_WARNING',
          { filePath: absolutePath },
          [
            {
              action: 'Verify data currency',
              description: 'Ensure the data is still relevant for analysis',
              severity: ErrorSeverity.LOW,
            },
          ],
        ),
      );
    }

    return { isValid: true, errors, warnings };
  }

  /**
   * Validate CLI options
   */
  static validateCLIOptions(options: Record<string, unknown>): ValidationResult {
    const errors: DataPilotError[] = [];
    const warnings: DataPilotError[] = [];

    // Validate output format
    if (options.output) {
      const validFormats = ['txt', 'markdown', 'json', 'yaml'];
      if (typeof options.output !== 'string' || !validFormats.includes(options.output)) {
        errors.push(
          DataPilotError.validation(
            `Invalid output format: ${String(options.output)}. Valid formats: ${validFormats.join(', ')}`,
            'INVALID_OUTPUT_FORMAT',
            { operationName: 'validateOutput' },
            [
              {
                action: 'Use valid format',
                description: `Choose from: ${validFormats.join(', ')}`,
                severity: ErrorSeverity.MEDIUM,
              },
            ],
          ),
        );
      }
    }

    // Validate maxRows
    if (options.maxRows !== undefined) {
      const maxRows = Number(options.maxRows);
      if (!Number.isInteger(maxRows) || maxRows <= 0) {
        errors.push(
          DataPilotError.validation(
            `Invalid maxRows value: ${String(options.maxRows)}. Must be a positive integer.`,
            'INVALID_MAX_ROWS',
            { operationName: 'validateMaxRows' },
            [
              {
                action: 'Use positive integer',
                description: 'Specify a positive number for maxRows',
                severity: ErrorSeverity.MEDIUM,
                command: '--maxRows 100000',
              },
            ],
          ),
        );
      } else if (maxRows > 10000000) {
        // 10M rows
        warnings.push(
          DataPilotError.validation(
            `Very large maxRows value: ${maxRows}. This may consume significant memory.`,
            'LARGE_MAX_ROWS_WARNING',
            { option: 'maxRows', value: maxRows },
            [
              {
                action: 'Consider reducing',
                description: 'Start with a smaller value and increase if needed',
                severity: ErrorSeverity.MEDIUM,
                command: '--maxRows 1000000',
              },
              {
                action: 'Monitor memory',
                description: 'Watch memory usage during processing',
                severity: ErrorSeverity.LOW,
              },
            ],
          ),
        );
      }
    }

    // Validate memory settings
    if (options.maxMemory !== undefined) {
      const maxMemory = Number(options.maxMemory);
      if (!Number.isInteger(maxMemory) || maxMemory <= 0) {
        errors.push(
          DataPilotError.validation(
            `Invalid maxMemory value: ${String(options.maxMemory)}. Must be a positive integer (MB).`,
            'INVALID_MAX_MEMORY',
            { operationName: 'validateMaxMemory' },
            [
              {
                action: 'Use positive integer',
                description: 'Specify memory limit in megabytes',
                severity: ErrorSeverity.MEDIUM,
                command: '--maxMemory 1024',
              },
            ],
          ),
        );
      } else if (maxMemory < 128) {
        warnings.push(
          DataPilotError.validation(
            `Low memory limit: ${maxMemory}MB. This may cause processing failures.`,
            'LOW_MEMORY_WARNING',
            { operationName: 'validateMaxMemory' },
            [
              {
                action: 'Increase memory limit',
                description: 'Consider at least 512MB for reliable processing',
                severity: ErrorSeverity.MEDIUM,
                command: '--maxMemory 512',
              },
            ],
          ),
        );
      }
    }

    // Validate privacy mode
    if (options.privacyMode) {
      const validModes = ['full', 'redacted', 'minimal'];
      if (typeof options.privacyMode !== 'string' || !validModes.includes(options.privacyMode)) {
        errors.push(
          DataPilotError.validation(
            `Invalid privacy mode: ${String(options.privacyMode)}. Valid modes: ${validModes.join(', ')}`,
            'INVALID_PRIVACY_MODE',
            { option: 'privacyMode', value: options.privacyMode },
            [
              {
                action: 'Use valid mode',
                description: `Choose from: ${validModes.join(', ')}`,
                severity: ErrorSeverity.MEDIUM,
              },
            ],
          ),
        );
      }
    }

    // Validate conflicting options
    if (options.quiet && options.verbose) {
      errors.push(
        DataPilotError.validation(
          'Cannot use both --quiet and --verbose flags',
          'CONFLICTING_OPTIONS',
          { options: ['quiet', 'verbose'] },
          [
            {
              action: 'Choose one option',
              description: 'Use either --quiet OR --verbose, not both',
              severity: ErrorSeverity.MEDIUM,
            },
          ],
        ),
      );
    }

    // Validate encoding
    if (options.encoding) {
      const validEncodings = ['utf8', 'utf16le', 'latin1', 'ascii'];
      if (typeof options.encoding !== 'string' || !validEncodings.includes(options.encoding)) {
        warnings.push(
          DataPilotError.validation(
            `Uncommon encoding: ${String(options.encoding)}. Consider using utf8 if unsure.`,
            'UNCOMMON_ENCODING',
            { option: 'encoding', value: options.encoding },
            [
              {
                action: 'Verify encoding',
                description: 'Ensure the encoding matches your file format',
                severity: ErrorSeverity.LOW,
              },
            ],
          ),
        );
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate numeric configuration values
   */
  static validateNumericConfig(
    config: Record<string, unknown>,
    rules: Record<string, { min?: number; max?: number; integer?: boolean }>,
  ): ValidationResult {
    const errors: DataPilotError[] = [];
    const warnings: DataPilotError[] = [];

    for (const [key, rule] of Object.entries(rules)) {
      const value = config[key];

      if (value === undefined || value === null) {
        continue; // Skip undefined values
      }

      const numValue = Number(value);

      if (!Number.isFinite(numValue)) {
        errors.push(
          DataPilotError.validation(
            `${key} must be a valid number, got: ${String(value)}`,
            'INVALID_NUMERIC_VALUE',
            { option: key, value },
            [
              {
                action: 'Provide valid number',
                description: `Ensure ${key} is a numeric value`,
                severity: ErrorSeverity.MEDIUM,
              },
            ],
          ),
        );
        continue;
      }

      if (rule.integer && !Number.isInteger(numValue)) {
        errors.push(
          DataPilotError.validation(
            `${key} must be an integer, got: ${String(value)}`,
            'INVALID_INTEGER_VALUE',
            { option: key, value },
            [
              {
                action: 'Use integer value',
                description: `Ensure ${key} is a whole number`,
                severity: ErrorSeverity.MEDIUM,
              },
            ],
          ),
        );
        continue;
      }

      if (rule.min !== undefined && numValue < rule.min) {
        errors.push(
          DataPilotError.validation(
            `${key} must be at least ${rule.min}, got: ${String(value)}`,
            'VALUE_TOO_SMALL',
            { operationName: `validate_${key}` },
            [
              {
                action: 'Increase value',
                description: `Set ${key} to at least ${rule.min}`,
                severity: ErrorSeverity.MEDIUM,
              },
            ],
          ),
        );
      }

      if (rule.max !== undefined && numValue > rule.max) {
        if (rule.max > 1000000) {
          // Warning for very large limits
          warnings.push(
            DataPilotError.validation(
              `${key} is very large (${String(value)}), consider reducing for better performance`,
              'VALUE_VERY_LARGE',
              { option: key, value, maximum: rule.max },
              [
                {
                  action: 'Consider reducing',
                  description: `Large values for ${key} may impact performance`,
                  severity: ErrorSeverity.LOW,
                },
              ],
            ),
          );
        } else {
          errors.push(
            DataPilotError.validation(
              `${key} must be at most ${rule.max}, got: ${String(value)}`,
              'VALUE_TOO_LARGE',
              { option: key, value, maximum: rule.max },
              [
                {
                  action: 'Reduce value',
                  description: `Set ${key} to at most ${rule.max}`,
                  severity: ErrorSeverity.MEDIUM,
                },
              ],
            ),
          );
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate string configuration values
   */
  static validateStringConfig(
    config: Record<string, unknown>,
    rules: Record<string, { allowedValues?: string[]; minLength?: number; maxLength?: number }>,
  ): ValidationResult {
    const errors: DataPilotError[] = [];
    const warnings: DataPilotError[] = [];

    for (const [key, rule] of Object.entries(rules)) {
      const value = config[key];

      if (value === undefined || value === null) {
        continue; // Skip undefined values
      }

      if (typeof value !== 'string') {
        errors.push(
          DataPilotError.validation(
            `${key} must be a string, got: ${typeof value}`,
            'INVALID_STRING_VALUE',
            { option: key, value },
            [
              {
                action: 'Provide string value',
                description: `Ensure ${key} is a text value`,
                severity: ErrorSeverity.MEDIUM,
              },
            ],
          ),
        );
        continue;
      }

      if (rule.allowedValues && !rule.allowedValues.includes(value)) {
        errors.push(
          DataPilotError.validation(
            `${key} must be one of: ${rule.allowedValues.join(', ')}, got: ${value}`,
            'INVALID_STRING_CHOICE',
            { option: key, value, allowedValues: rule.allowedValues },
            [
              {
                action: 'Use valid value',
                description: `Choose from: ${rule.allowedValues.join(', ')}`,
                severity: ErrorSeverity.MEDIUM,
              },
            ],
          ),
        );
      }

      if (rule.minLength !== undefined && value.length < rule.minLength) {
        errors.push(
          DataPilotError.validation(
            `${key} must be at least ${rule.minLength} characters, got: ${value.length}`,
            'STRING_TOO_SHORT',
            { option: key, value, minLength: rule.minLength },
            [
              {
                action: 'Provide longer value',
                description: `Ensure ${key} has at least ${rule.minLength} characters`,
                severity: ErrorSeverity.MEDIUM,
              },
            ],
          ),
        );
      }

      if (rule.maxLength !== undefined && value.length > rule.maxLength) {
        errors.push(
          DataPilotError.validation(
            `${key} must be at most ${rule.maxLength} characters, got: ${value.length}`,
            'STRING_TOO_LONG',
            { option: key, value, maxLength: rule.maxLength },
            [
              {
                action: 'Shorten value',
                description: `Ensure ${key} has at most ${rule.maxLength} characters`,
                severity: ErrorSeverity.MEDIUM,
              },
            ],
          ),
        );
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate system resources
   */
  static validateSystemResources(): ValidationResult {
    const errors: DataPilotError[] = [];
    const warnings: DataPilotError[] = [];

    // Check available memory
    const memUsage = process.memoryUsage();
    const totalMemoryMB = (memUsage.rss + memUsage.external) / (1024 * 1024);

    if (totalMemoryMB > 512) {
      warnings.push(
        DataPilotError.validation(
          `High initial memory usage: ${totalMemoryMB.toFixed(1)}MB`,
          'HIGH_INITIAL_MEMORY',
          { memoryUsage: totalMemoryMB },
          [
            {
              action: 'Monitor memory',
              description: 'Watch for memory issues during processing',
              severity: ErrorSeverity.LOW,
            },
            {
              action: 'Close other applications',
              description: 'Free up system memory before processing large files',
              severity: ErrorSeverity.MEDIUM,
            },
          ],
        ),
      );
    }

    // Check Node.js version
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.substring(1).split('.')[0]);

    if (majorVersion < 16) {
      warnings.push(
        DataPilotError.validation(
          `Old Node.js version detected: ${nodeVersion}. Consider upgrading to v16+`,
          'OLD_NODEJS_VERSION',
          { operationName: 'validateNodeVersion' },
          [
            {
              action: 'Update Node.js',
              description: 'Upgrade to a more recent version for better performance',
              severity: ErrorSeverity.LOW,
            },
          ],
        ),
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Comprehensive validation combining all checks
   */
  static validateAll(filePath: string, options: Record<string, unknown>): ValidationResult {
    const results = [
      this.validateFilePath(filePath),
      this.validateCLIOptions(options),
      this.validateSystemResources(),
    ];

    const allErrors = results.flatMap((r) => r.errors);
    const allWarnings = results.flatMap((r) => r.warnings);

    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings,
    };
  }
}

/**
 * Data quality validation utilities
 */
export class DataQualityValidator {
  /**
   * Validate CSV data format
   */
  static validateCSVFormat(data: string[][], headers?: string[]): ValidationResult {
    const errors: DataPilotError[] = [];
    const warnings: DataPilotError[] = [];

    if (data.length === 0) {
      errors.push(
        DataPilotError.validation('CSV data is empty', 'EMPTY_CSV_DATA', { rowCount: 0 }, [
          {
            action: 'Check data source',
            description: 'Ensure the CSV file contains data rows',
            severity: ErrorSeverity.HIGH,
          },
        ]),
      );
      return { isValid: false, errors, warnings };
    }

    // Check for consistent column count
    const expectedColumns = headers ? headers.length : data[0].length;
    const inconsistentRows = data.filter((row) => {
      return row.length !== expectedColumns;
    });

    if (inconsistentRows.length > 0) {
      const inconsistentCount = inconsistentRows.length;
      const inconsistentPercentage = (inconsistentCount / data.length) * 100;

      if (inconsistentPercentage > 10) {
        errors.push(
          DataPilotError.validation(
            `${inconsistentCount} rows (${inconsistentPercentage.toFixed(1)}%) have inconsistent column count`,
            'INCONSISTENT_COLUMN_COUNT',
            { operationName: 'validateColumnConsistency' },
            [
              {
                action: 'Check CSV format',
                description: 'Verify that all rows have the same number of columns',
                severity: ErrorSeverity.HIGH,
              },
              {
                action: 'Check delimiters',
                description: 'Ensure consistent delimiter usage throughout the file',
                severity: ErrorSeverity.MEDIUM,
              },
            ],
          ),
        );
      } else {
        warnings.push(
          DataPilotError.validation(
            `${inconsistentCount} rows have inconsistent column count (may be acceptable)`,
            'MINOR_COLUMN_INCONSISTENCY',
            { operationName: 'validateColumnConsistency' },
            [
              {
                action: 'Review data',
                description: 'Check if the inconsistent rows are expected',
                severity: ErrorSeverity.LOW,
              },
            ],
          ),
        );
      }
    }

    // Check for completely empty rows
    const emptyRows = data.filter((row) => row.every((cell) => !cell || cell.trim() === ''));
    if (emptyRows.length > data.length * 0.05) {
      // More than 5% empty rows
      warnings.push(
        DataPilotError.validation(
          `${emptyRows.length} completely empty rows detected`,
          'MANY_EMPTY_ROWS',
          { operationName: 'validateEmptyRows' },
          [
            {
              action: 'Clean data',
              description: 'Consider removing empty rows from the dataset',
              severity: ErrorSeverity.LOW,
            },
          ],
        ),
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }
}
