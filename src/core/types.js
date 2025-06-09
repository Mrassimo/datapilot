"use strict";
/**
 * Core type definitions for DataPilot
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataPilotError = exports.ErrorCategory = exports.ErrorSeverity = exports.DataType = void 0;
// Data Types
var DataType;
(function (DataType) {
    DataType["STRING"] = "string";
    DataType["NUMBER"] = "number";
    DataType["INTEGER"] = "integer";
    DataType["FLOAT"] = "float";
    DataType["DATE"] = "date";
    DataType["DATETIME"] = "datetime";
    DataType["BOOLEAN"] = "boolean";
    DataType["UNKNOWN"] = "unknown";
})(DataType || (exports.DataType = DataType = {}));
// Error Types
var ErrorSeverity;
(function (ErrorSeverity) {
    ErrorSeverity["LOW"] = "low";
    ErrorSeverity["MEDIUM"] = "medium";
    ErrorSeverity["HIGH"] = "high";
    ErrorSeverity["CRITICAL"] = "critical";
})(ErrorSeverity || (exports.ErrorSeverity = ErrorSeverity = {}));
var ErrorCategory;
(function (ErrorCategory) {
    ErrorCategory["PARSING"] = "parsing";
    ErrorCategory["VALIDATION"] = "validation";
    ErrorCategory["ANALYSIS"] = "analysis";
    ErrorCategory["MEMORY"] = "memory";
    ErrorCategory["IO"] = "io";
    ErrorCategory["CONFIGURATION"] = "configuration";
    ErrorCategory["NETWORK"] = "network";
    ErrorCategory["PERMISSION"] = "permission";
})(ErrorCategory || (exports.ErrorCategory = ErrorCategory = {}));
class DataPilotError extends Error {
    code;
    severity;
    category;
    context;
    suggestions;
    recoverable;
    details;
    constructor(message, code, severity = ErrorSeverity.MEDIUM, category = ErrorCategory.ANALYSIS, context, suggestions, recoverable = true, details) {
        super(message);
        this.code = code;
        this.severity = severity;
        this.category = category;
        this.context = context;
        this.suggestions = suggestions;
        this.recoverable = recoverable;
        this.details = details;
        this.name = 'DataPilotError';
    }
    /**
     * Create a parsing error with appropriate context
     */
    static parsing(message, code, context, suggestions) {
        return new DataPilotError(message, code, ErrorSeverity.HIGH, ErrorCategory.PARSING, context, suggestions, true);
    }
    /**
     * Create a memory error with appropriate context
     */
    static memory(message, code, context, suggestions) {
        return new DataPilotError(message, code, ErrorSeverity.CRITICAL, ErrorCategory.MEMORY, context, suggestions, true);
    }
    /**
     * Create a validation error with appropriate context
     */
    static validation(message, code, context, suggestions) {
        return new DataPilotError(message, code, ErrorSeverity.HIGH, ErrorCategory.VALIDATION, context, suggestions, false);
    }
    /**
     * Create an analysis error with graceful degradation
     */
    static analysis(message, code, context, suggestions) {
        return new DataPilotError(message, code, ErrorSeverity.MEDIUM, ErrorCategory.ANALYSIS, context, suggestions, true);
    }
    /**
     * Get formatted error message with context
     */
    getFormattedMessage() {
        let message = `[${this.category.toUpperCase()}:${this.code}] ${this.message}`;
        if (this.context) {
            const contextParts = [];
            if (this.context.filePath)
                contextParts.push(`File: ${this.context.filePath}`);
            if (this.context.section)
                contextParts.push(`Section: ${this.context.section}`);
            if (this.context.analyzer)
                contextParts.push(`Analyzer: ${this.context.analyzer}`);
            if (this.context.rowIndex !== undefined)
                contextParts.push(`Row: ${this.context.rowIndex}`);
            if (this.context.columnName)
                contextParts.push(`Column: ${this.context.columnName}`);
            if (contextParts.length > 0) {
                message += ` (${contextParts.join(', ')})`;
            }
        }
        return message;
    }
    /**
     * Get actionable suggestions as formatted text
     */
    getSuggestions() {
        if (!this.suggestions || this.suggestions.length === 0) {
            return [];
        }
        return this.suggestions.map((suggestion) => {
            let text = `• ${suggestion.action}: ${suggestion.description}`;
            if (suggestion.command) {
                text += ` (Run: ${suggestion.command})`;
            }
            return text;
        });
    }
}
exports.DataPilotError = DataPilotError;
//# sourceMappingURL=types.js.map