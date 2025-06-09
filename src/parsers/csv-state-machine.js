"use strict";
/**
 * High-performance CSV parsing state machine
 * Optimized for streaming large files with minimal memory allocation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CSVStateMachine = void 0;
const types_1 = require("./types");
class CSVStateMachine {
    state = types_1.ParserState.FIELD_START;
    currentField = '';
    currentRow = [];
    rowIndex = 0;
    columnIndex = 0;
    charIndex = 0;
    errors = [];
    delimiter;
    quote;
    escape;
    trimFields;
    maxFieldSize;
    // Pre-compiled character codes for performance
    delimiterCode;
    quoteCode;
    escapeCode;
    crCode = 0x0d; // \r
    lfCode = 0x0a; // \n
    constructor(options) {
        this.delimiter = options.delimiter;
        this.quote = options.quote;
        this.escape = options.escape;
        this.trimFields = options.trimFields;
        this.maxFieldSize = options.maxFieldSize;
        // Pre-calculate character codes for faster comparison
        this.delimiterCode = this.delimiter.charCodeAt(0);
        this.quoteCode = this.quote.charCodeAt(0);
        this.escapeCode = this.escape.charCodeAt(0);
    }
    /**
     * Process a chunk of data efficiently
     * Returns array of completed rows
     */
    processChunk(data) {
        const completedRows = [];
        const length = data.length;
        for (let i = 0; i < length; i++) {
            const char = data[i];
            const charCode = data.charCodeAt(i);
            this.charIndex++;
            const result = this.processCharacter(char, charCode);
            if (result.rowCompleted) {
                completedRows.push([...this.currentRow]);
                this.currentRow = [];
                this.rowIndex++;
                this.columnIndex = 0;
            }
            if (result.error) {
                this.errors.push(result.error);
            }
        }
        return completedRows;
    }
    /**
     * Process a single character using optimized state machine
     */
    processCharacter(char, charCode) {
        let rowCompleted = false;
        let error;
        try {
            switch (this.state) {
                case types_1.ParserState.FIELD_START:
                    rowCompleted = this.handleFieldStart(char, charCode);
                    break;
                case types_1.ParserState.IN_FIELD:
                    rowCompleted = this.handleInField(char, charCode);
                    break;
                case types_1.ParserState.IN_QUOTED_FIELD:
                    this.handleInQuotedField(char, charCode);
                    break;
                case types_1.ParserState.QUOTE_IN_QUOTED_FIELD:
                    rowCompleted = this.handleQuoteInQuotedField(char, charCode);
                    break;
                case types_1.ParserState.FIELD_END:
                    rowCompleted = this.handleFieldEnd(char, charCode);
                    break;
                case types_1.ParserState.ROW_END:
                    rowCompleted = this.handleRowEnd(char, charCode);
                    break;
            }
        }
        catch (e) {
            error = {
                row: this.rowIndex,
                column: this.columnIndex,
                message: e instanceof Error ? e.message : 'Unknown parsing error',
                code: 'PARSE_ERROR',
            };
            // Reset to field start for error recovery
            this.state = types_1.ParserState.FIELD_START;
            this.finishField();
        }
        return { rowCompleted, error };
    }
    handleFieldStart(char, charCode) {
        if (charCode === this.quoteCode) {
            this.state = types_1.ParserState.IN_QUOTED_FIELD;
        }
        else if (charCode === this.delimiterCode) {
            this.finishField();
            // Stay in FIELD_START for next field
        }
        else if (charCode === this.lfCode) {
            this.finishField();
            this.state = types_1.ParserState.FIELD_START;
            return true; // Row completed
        }
        else if (charCode === this.crCode) {
            this.finishField();
            this.state = types_1.ParserState.ROW_END;
        }
        else {
            this.currentField = char;
            this.state = types_1.ParserState.IN_FIELD;
        }
        return false;
    }
    handleInField(char, charCode) {
        if (charCode === this.delimiterCode) {
            this.finishField();
            this.state = types_1.ParserState.FIELD_START;
        }
        else if (charCode === this.lfCode) {
            this.finishField();
            this.state = types_1.ParserState.FIELD_START;
            return true; // Row completed
        }
        else if (charCode === this.crCode) {
            this.finishField();
            this.state = types_1.ParserState.ROW_END;
        }
        else {
            this.appendToField(char);
        }
        return false;
    }
    handleInQuotedField(char, charCode) {
        if (charCode === this.quoteCode) {
            this.state = types_1.ParserState.QUOTE_IN_QUOTED_FIELD;
        }
        else if (charCode === this.escapeCode) {
            // Next character is escaped - add it directly
            this.appendToField(char);
        }
        else {
            this.appendToField(char);
        }
    }
    handleQuoteInQuotedField(char, charCode) {
        if (charCode === this.quoteCode) {
            // Double quote - add single quote to field
            this.appendToField(char);
            this.state = types_1.ParserState.IN_QUOTED_FIELD;
        }
        else if (charCode === this.delimiterCode) {
            this.finishField();
            this.state = types_1.ParserState.FIELD_START;
        }
        else if (charCode === this.lfCode) {
            this.finishField();
            this.state = types_1.ParserState.FIELD_START;
            return true; // Row completed
        }
        else if (charCode === this.crCode) {
            this.finishField();
            this.state = types_1.ParserState.ROW_END;
        }
        else {
            // Quote not properly closed - treat as end of quoted field
            this.state = types_1.ParserState.FIELD_END;
        }
        return false;
    }
    handleFieldEnd(_char, charCode) {
        if (charCode === this.delimiterCode) {
            this.state = types_1.ParserState.FIELD_START;
        }
        else if (charCode === this.lfCode) {
            this.state = types_1.ParserState.FIELD_START;
            return true; // Row completed
        }
        else if (charCode === this.crCode) {
            this.state = types_1.ParserState.ROW_END;
        }
        // Ignore other characters after quoted field
        return false;
    }
    handleRowEnd(char, charCode) {
        if (charCode === this.lfCode) {
            this.state = types_1.ParserState.FIELD_START;
            return true; // Row completed
        }
        else {
            // \r not followed by \n - treat as field content
            this.currentField = '\r' + char;
            this.state = types_1.ParserState.IN_FIELD;
        }
        return false;
    }
    appendToField(char) {
        if (this.currentField.length >= this.maxFieldSize) {
            throw new Error(`Field exceeds maximum size of ${this.maxFieldSize} characters`);
        }
        this.currentField += char;
    }
    finishField() {
        let field = this.currentField;
        if (this.trimFields) {
            field = field.trim();
        }
        this.currentRow.push(field);
        this.currentField = '';
        this.columnIndex++;
    }
    /**
     * Finalize parsing and return any remaining row
     */
    finalize() {
        if (this.currentField.length > 0 || this.currentRow.length > 0) {
            this.finishField();
            const finalRow = [...this.currentRow];
            this.currentRow = [];
            return finalRow;
        }
        return null;
    }
    /**
     * Get current parsing statistics
     */
    getStats() {
        return {
            rowIndex: this.rowIndex,
            columnIndex: this.columnIndex,
            charIndex: this.charIndex,
            errors: [...this.errors],
        };
    }
    /**
     * Reset state machine for reuse
     */
    reset() {
        this.state = types_1.ParserState.FIELD_START;
        this.currentField = '';
        this.currentRow = [];
        this.rowIndex = 0;
        this.columnIndex = 0;
        this.charIndex = 0;
        this.errors = [];
    }
}
exports.CSVStateMachine = CSVStateMachine;
//# sourceMappingURL=csv-state-machine.js.map