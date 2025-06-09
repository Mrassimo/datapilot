"use strict";
/**
 * Comprehensive error handling and recovery system for DataPilot
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorUtils = exports.globalErrorHandler = exports.ErrorHandler = void 0;
const types_1 = require("../core/types");
const logger_1 = require("./logger");
class ErrorHandler {
    config;
    stats;
    errorHistory = [];
    constructor(config = {}) {
        this.config = {
            maxRetries: 3,
            retryDelayMs: 1000,
            enableRecovery: true,
            logErrors: true,
            abortOnCritical: true,
            memoryThresholdBytes: 512 * 1024 * 1024, // 512MB
            ...config,
        };
        this.stats = {
            totalErrors: 0,
            errorsByCategory: {},
            errorsBySeverity: {},
            recoveredErrors: 0,
            criticalErrors: 0,
        };
        // Initialize counters
        Object.values(types_1.ErrorCategory).forEach((category) => {
            this.stats.errorsByCategory[category] = 0;
        });
        Object.values(types_1.ErrorSeverity).forEach((severity) => {
            this.stats.errorsBySeverity[severity] = 0;
        });
    }
    /**
     * Handle an error with recovery strategies
     */
    async handleError(error, operation, recoveryStrategy) {
        this.recordError(error);
        if (this.config.logErrors) {
            this.logError(error);
        }
        // Check if error is critical and should abort
        if (error.severity === types_1.ErrorSeverity.CRITICAL && this.config.abortOnCritical) {
            throw error;
        }
        // Check if recovery is enabled and error is recoverable
        if (!this.config.enableRecovery || !error.recoverable) {
            throw error;
        }
        // Apply recovery strategy
        if (recoveryStrategy) {
            return await this.applyRecoveryStrategy(error, operation, recoveryStrategy);
        }
        // Default recovery strategies based on error category
        const defaultStrategy = this.getDefaultRecoveryStrategy(error);
        if (defaultStrategy) {
            return await this.applyRecoveryStrategy(error, operation, defaultStrategy);
        }
        throw error;
    }
    /**
     * Handle synchronous errors
     */
    handleErrorSync(error, operation, fallbackValue) {
        this.recordError(error);
        if (this.config.logErrors) {
            this.logError(error);
        }
        if (error.severity === types_1.ErrorSeverity.CRITICAL && this.config.abortOnCritical) {
            throw error;
        }
        if (!error.recoverable) {
            if (fallbackValue !== undefined) {
                this.stats.recoveredErrors++;
                return fallbackValue;
            }
            throw error;
        }
        // Try to execute with fallback
        try {
            return operation();
        }
        catch (retryError) {
            if (fallbackValue !== undefined) {
                this.stats.recoveredErrors++;
                logger_1.logger.warn(`Operation failed, using fallback value: ${retryError instanceof Error ? retryError.message : 'Unknown error'}`);
                return fallbackValue;
            }
            throw error;
        }
    }
    /**
     * Validate configuration parameters
     */
    validateConfig(config, schema) {
        const errors = [];
        for (const [key, expectedType] of Object.entries(schema)) {
            const value = config[key];
            if (value === undefined || value === null) {
                continue; // Optional parameters
            }
            const actualType = typeof value;
            if (actualType !== expectedType) {
                errors.push(types_1.DataPilotError.validation(`Invalid configuration parameter type for '${key}': expected ${expectedType}, got ${actualType}`, 'CONFIG_TYPE_MISMATCH', { operationName: 'validateConfig' }, [
                    {
                        action: 'Fix configuration',
                        description: `Change '${key}' to type ${expectedType}`,
                        severity: types_1.ErrorSeverity.MEDIUM,
                    },
                ]));
            }
            // Additional validations based on type
            if (expectedType === 'number') {
                const numValue = value;
                if (isNaN(numValue) || !isFinite(numValue)) {
                    errors.push(types_1.DataPilotError.validation(`Invalid number value for '${key}': ${value}`, 'CONFIG_INVALID_NUMBER', { operationName: 'validateConfig' }, [
                        {
                            action: 'Fix configuration',
                            description: `Provide a valid number for '${key}'`,
                            severity: types_1.ErrorSeverity.MEDIUM,
                        },
                    ]));
                }
            }
        }
        return errors;
    }
    /**
     * Check memory usage and throw error if threshold exceeded
     */
    checkMemoryUsage(context) {
        const memUsage = process.memoryUsage();
        if (memUsage.heapUsed > this.config.memoryThresholdBytes) {
            const error = types_1.DataPilotError.memory(`Memory usage (${Math.round(memUsage.heapUsed / 1024 / 1024)}MB) exceeds threshold (${Math.round(this.config.memoryThresholdBytes / 1024 / 1024)}MB)`, 'MEMORY_THRESHOLD_EXCEEDED', { ...context, memoryUsage: memUsage.heapUsed }, [
                {
                    action: 'Reduce memory usage',
                    description: 'Process data in smaller chunks or increase memory limit',
                    severity: types_1.ErrorSeverity.HIGH,
                    command: '--maxRows 10000 or --memoryLimit 1024',
                },
                {
                    action: 'Free memory',
                    description: 'Close other applications to free system memory',
                    severity: types_1.ErrorSeverity.MEDIUM,
                },
            ]);
            throw error;
        }
    }
    /**
     * Create error with file corruption recovery suggestions
     */
    createFileCorruptionError(filePath, details) {
        return types_1.DataPilotError.parsing(`File appears to be corrupted or invalid: ${details}`, 'FILE_CORRUPTED', { filePath, operationName: 'parseFile' }, [
            {
                action: 'Check file encoding',
                description: 'Try specifying encoding explicitly (utf8, utf16, latin1)',
                severity: types_1.ErrorSeverity.HIGH,
                command: '--encoding utf8',
            },
            {
                action: 'Validate file format',
                description: 'Open file in text editor to check for obvious corruption',
                severity: types_1.ErrorSeverity.HIGH,
            },
            {
                action: 'Try manual delimiter detection',
                description: 'Specify delimiter explicitly if auto-detection fails',
                severity: types_1.ErrorSeverity.MEDIUM,
                command: '--delimiter "," or --delimiter "\\t"',
            },
            {
                action: 'Skip problematic rows',
                description: 'Enable lenient parsing mode',
                severity: types_1.ErrorSeverity.LOW,
                command: '--lenient',
            },
        ]);
    }
    /**
     * Create error for insufficient data
     */
    createInsufficientDataError(context, minRequired, actual) {
        return types_1.DataPilotError.analysis(`Insufficient data for analysis: found ${actual} rows, need at least ${minRequired}`, 'INSUFFICIENT_DATA', context, [
            {
                action: 'Check data source',
                description: 'Verify that the file contains the expected amount of data',
                severity: types_1.ErrorSeverity.HIGH,
            },
            {
                action: 'Adjust analysis parameters',
                description: 'Reduce minimum requirements or enable simplified analysis',
                severity: types_1.ErrorSeverity.MEDIUM,
                command: '--simplified or --minRows 10',
            },
            {
                action: 'Combine with other data',
                description: 'Add more data to reach minimum requirements',
                severity: types_1.ErrorSeverity.LOW,
            },
        ]);
    }
    /**
     * Wrap operation with automatic error handling
     */
    async wrapOperation(operation, operationName, context, recoveryStrategy) {
        try {
            return await operation();
        }
        catch (error) {
            let dataPilotError;
            if (error instanceof types_1.DataPilotError) {
                dataPilotError = error;
            }
            else {
                // Convert generic error to DataPilotError
                dataPilotError = new types_1.DataPilotError(error instanceof Error ? error.message : 'Unknown error', 'UNKNOWN_ERROR', types_1.ErrorSeverity.MEDIUM, types_1.ErrorCategory.ANALYSIS, { ...context, operationName });
            }
            return await this.handleError(dataPilotError, operation, recoveryStrategy);
        }
    }
    /**
     * Get error statistics
     */
    getStats() {
        return { ...this.stats };
    }
    /**
     * Get recent errors
     */
    getRecentErrors(limit = 10) {
        return this.errorHistory.slice(-limit);
    }
    /**
     * Clear error history and reset stats
     */
    reset() {
        this.errorHistory = [];
        this.stats = {
            totalErrors: 0,
            errorsByCategory: {},
            errorsBySeverity: {},
            recoveredErrors: 0,
            criticalErrors: 0,
        };
        Object.values(types_1.ErrorCategory).forEach((category) => {
            this.stats.errorsByCategory[category] = 0;
        });
        Object.values(types_1.ErrorSeverity).forEach((severity) => {
            this.stats.errorsBySeverity[severity] = 0;
        });
    }
    recordError(error) {
        this.stats.totalErrors++;
        this.stats.errorsByCategory[error.category]++;
        this.stats.errorsBySeverity[error.severity]++;
        if (error.severity === types_1.ErrorSeverity.CRITICAL) {
            this.stats.criticalErrors++;
        }
        this.errorHistory.push(error);
        // Keep history limited to prevent memory issues
        if (this.errorHistory.length > 100) {
            this.errorHistory = this.errorHistory.slice(-50);
        }
    }
    logError(error) {
        const message = error.getFormattedMessage();
        const suggestions = error.getSuggestions();
        switch (error.severity) {
            case types_1.ErrorSeverity.CRITICAL:
                logger_1.logger.error(message);
                break;
            case types_1.ErrorSeverity.HIGH:
                logger_1.logger.error(message);
                break;
            case types_1.ErrorSeverity.MEDIUM:
                logger_1.logger.warn(message);
                break;
            case types_1.ErrorSeverity.LOW:
                logger_1.logger.info(message);
                break;
        }
        if (suggestions.length > 0) {
            logger_1.logger.info('Suggestions:');
            suggestions.forEach((suggestion) => logger_1.logger.info(suggestion));
        }
    }
    async applyRecoveryStrategy(error, operation, strategy) {
        switch (strategy.strategy) {
            case 'retry':
                return await this.retryOperation(operation, strategy.maxRetries || this.config.maxRetries, strategy.retryDelay || this.config.retryDelayMs);
            case 'fallback':
                this.stats.recoveredErrors++;
                return strategy.fallbackValue;
            case 'skip':
                this.stats.recoveredErrors++;
                return null;
            case 'continue':
                this.stats.recoveredErrors++;
                logger_1.logger.warn(`Continuing despite error: ${error.message}`);
                return null;
            case 'abort':
                throw error;
            default:
                throw error;
        }
    }
    async retryOperation(operation, maxRetries, delayMs) {
        let lastError;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const result = await operation();
                if (attempt > 1) {
                    this.stats.recoveredErrors++;
                    logger_1.logger.info(`Operation succeeded on attempt ${attempt}`);
                }
                return result;
            }
            catch (error) {
                lastError = error instanceof Error ? error : new Error('Unknown error');
                if (attempt < maxRetries) {
                    logger_1.logger.warn(`Operation failed on attempt ${attempt}, retrying in ${delayMs}ms...`);
                    await this.delay(delayMs);
                    delayMs *= 1.5; // Exponential backoff
                }
            }
        }
        throw lastError;
    }
    getDefaultRecoveryStrategy(error) {
        switch (error.category) {
            case types_1.ErrorCategory.MEMORY:
                return { strategy: 'abort' }; // Memory errors should generally abort
            case types_1.ErrorCategory.PARSING:
                if (error.code === 'ENCODING_DETECTION_FAILED') {
                    return { strategy: 'fallback', fallbackValue: 'utf8' };
                }
                return { strategy: 'skip' }; // Skip malformed rows
            case types_1.ErrorCategory.ANALYSIS:
                return { strategy: 'continue' }; // Continue with reduced functionality
            case types_1.ErrorCategory.NETWORK:
                return { strategy: 'retry', maxRetries: 3, retryDelay: 1000 };
            case types_1.ErrorCategory.IO:
                return { strategy: 'retry', maxRetries: 2, retryDelay: 500 };
            default:
                return null;
        }
    }
    delay(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
exports.ErrorHandler = ErrorHandler;
// Global error handler instance
exports.globalErrorHandler = new ErrorHandler();
/**
 * Utility functions for common error scenarios
 */
class ErrorUtils {
    /**
     * Handle CSV parsing errors with recovery
     */
    static async handleParsingError(error, filePath, retryWithFallback) {
        let dataPilotError;
        if (error instanceof types_1.DataPilotError) {
            dataPilotError = error;
        }
        else {
            const errorMessage = error instanceof Error ? error.message : 'Unknown parsing error';
            dataPilotError = exports.globalErrorHandler.createFileCorruptionError(filePath, errorMessage);
        }
        return await exports.globalErrorHandler.handleError(dataPilotError, retryWithFallback, {
            strategy: 'retry',
            maxRetries: 2,
        });
    }
    /**
     * Handle insufficient data scenarios
     */
    static handleInsufficientData(actualCount, minimumRequired, context, fallbackValue) {
        if (actualCount >= minimumRequired) {
            return fallbackValue; // Not actually an error
        }
        const error = exports.globalErrorHandler.createInsufficientDataError(context, minimumRequired, actualCount);
        return exports.globalErrorHandler.handleErrorSync(error, () => {
            throw error; // Force fallback
        }, fallbackValue);
    }
    /**
     * Validate and clean data array
     */
    static validateDataArray(data, context) {
        if (!Array.isArray(data)) {
            throw types_1.DataPilotError.validation('Expected array data format', 'INVALID_DATA_FORMAT', context, [
                {
                    action: 'Check data source',
                    description: 'Ensure data is properly formatted as an array',
                    severity: types_1.ErrorSeverity.HIGH,
                },
            ]);
        }
        if (data.length === 0) {
            throw exports.globalErrorHandler.createInsufficientDataError(context, 1, 0);
        }
        return data.filter((row) => row !== null && row !== undefined);
    }
    /**
     * Safe numeric conversion with error handling
     */
    static safeToNumber(value, defaultValue = 0) {
        if (typeof value === 'number' && isFinite(value)) {
            return value;
        }
        if (typeof value === 'string') {
            const parsed = parseFloat(value);
            if (isFinite(parsed)) {
                return parsed;
            }
        }
        return defaultValue;
    }
    /**
     * Safe property access with error handling
     */
    static safeGet(obj, path, defaultValue) {
        try {
            const keys = path.split('.');
            let current = obj;
            for (const key of keys) {
                if (current === null || current === undefined) {
                    return defaultValue;
                }
                current = current[key];
            }
            return current;
        }
        catch {
            return defaultValue;
        }
    }
}
exports.ErrorUtils = ErrorUtils;
//# sourceMappingURL=error-handler.js.map