/**
 * High-performance CSV parsing state machine
 * Optimized for streaming large files with minimal memory allocation
 */
import type { ParseError } from './types';
export interface StateMachineOptions {
    delimiter: string;
    quote: string;
    escape: string;
    trimFields: boolean;
    maxFieldSize: number;
}
export interface FieldBuilder {
    content: string;
    startIndex: number;
    endIndex: number;
}
export declare class CSVStateMachine {
    private state;
    private currentField;
    private currentRow;
    private rowIndex;
    private columnIndex;
    private charIndex;
    private errors;
    private readonly delimiter;
    private readonly quote;
    private readonly escape;
    private readonly trimFields;
    private readonly maxFieldSize;
    private readonly delimiterCode;
    private readonly quoteCode;
    private readonly escapeCode;
    private readonly crCode;
    private readonly lfCode;
    constructor(options: StateMachineOptions);
    /**
     * Process a chunk of data efficiently
     * Returns array of completed rows
     */
    processChunk(data: string): string[][];
    /**
     * Process a single character using optimized state machine
     */
    private processCharacter;
    private handleFieldStart;
    private handleInField;
    private handleInQuotedField;
    private handleQuoteInQuotedField;
    private handleFieldEnd;
    private handleRowEnd;
    private appendToField;
    private finishField;
    /**
     * Finalize parsing and return any remaining row
     */
    finalize(): string[] | null;
    /**
     * Get current parsing statistics
     */
    getStats(): {
        rowIndex: number;
        columnIndex: number;
        charIndex: number;
        errors: ParseError[];
    };
    /**
     * Reset state machine for reuse
     */
    reset(): void;
}
//# sourceMappingURL=csv-state-machine.d.ts.map