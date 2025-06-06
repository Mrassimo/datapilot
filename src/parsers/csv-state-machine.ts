/**
 * High-performance CSV parsing state machine
 * Optimized for streaming large files with minimal memory allocation
 */

import { ParserState, ParseError } from './types';

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

export class CSVStateMachine {
  private state: ParserState = ParserState.FIELD_START;
  private currentField: string = '';
  private currentRow: string[] = [];
  private rowIndex: number = 0;
  private columnIndex: number = 0;
  private charIndex: number = 0;
  private errors: ParseError[] = [];
  
  private readonly delimiter: string;
  private readonly quote: string;
  private readonly escape: string;
  private readonly trimFields: boolean;
  private readonly maxFieldSize: number;

  // Pre-compiled character codes for performance
  private readonly delimiterCode: number;
  private readonly quoteCode: number;
  private readonly escapeCode: number;
  private readonly crCode = 0x0d; // \r
  private readonly lfCode = 0x0a; // \n

  constructor(options: StateMachineOptions) {
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
  processChunk(data: string): string[][] {
    const completedRows: string[][] = [];
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
  private processCharacter(char: string, charCode: number): { rowCompleted: boolean; error?: ParseError } {
    let rowCompleted = false;
    let error: ParseError | undefined;

    try {
      switch (this.state) {
        case ParserState.FIELD_START:
          rowCompleted = this.handleFieldStart(char, charCode);
          break;

        case ParserState.IN_FIELD:
          rowCompleted = this.handleInField(char, charCode);
          break;

        case ParserState.IN_QUOTED_FIELD:
          this.handleInQuotedField(char, charCode);
          break;

        case ParserState.QUOTE_IN_QUOTED_FIELD:
          rowCompleted = this.handleQuoteInQuotedField(char, charCode);
          break;

        case ParserState.FIELD_END:
          rowCompleted = this.handleFieldEnd(char, charCode);
          break;

        case ParserState.ROW_END:
          rowCompleted = this.handleRowEnd(char, charCode);
          break;
      }
    } catch (e) {
      error = {
        row: this.rowIndex,
        column: this.columnIndex,
        message: e instanceof Error ? e.message : 'Unknown parsing error',
        code: 'PARSE_ERROR',
      };
      
      // Reset to field start for error recovery
      this.state = ParserState.FIELD_START;
      this.finishField();
    }

    return { rowCompleted, error };
  }

  private handleFieldStart(char: string, charCode: number): boolean {
    if (charCode === this.quoteCode) {
      this.state = ParserState.IN_QUOTED_FIELD;
    } else if (charCode === this.delimiterCode) {
      this.finishField();
      // Stay in FIELD_START for next field
    } else if (charCode === this.lfCode) {
      this.finishField();
      this.state = ParserState.FIELD_START;
      return true; // Row completed
    } else if (charCode === this.crCode) {
      this.finishField();
      this.state = ParserState.ROW_END;
    } else {
      this.currentField = char;
      this.state = ParserState.IN_FIELD;
    }
    return false;
  }

  private handleInField(char: string, charCode: number): boolean {
    if (charCode === this.delimiterCode) {
      this.finishField();
      this.state = ParserState.FIELD_START;
    } else if (charCode === this.lfCode) {
      this.finishField();
      this.state = ParserState.FIELD_START;
      return true; // Row completed
    } else if (charCode === this.crCode) {
      this.finishField();
      this.state = ParserState.ROW_END;
    } else {
      this.appendToField(char);
    }
    return false;
  }

  private handleInQuotedField(char: string, charCode: number): void {
    if (charCode === this.quoteCode) {
      this.state = ParserState.QUOTE_IN_QUOTED_FIELD;
    } else if (charCode === this.escapeCode) {
      // Next character is escaped - add it directly
      this.appendToField(char);
    } else {
      this.appendToField(char);
    }
  }

  private handleQuoteInQuotedField(char: string, charCode: number): boolean {
    if (charCode === this.quoteCode) {
      // Double quote - add single quote to field
      this.appendToField(char);
      this.state = ParserState.IN_QUOTED_FIELD;
    } else if (charCode === this.delimiterCode) {
      this.finishField();
      this.state = ParserState.FIELD_START;
    } else if (charCode === this.lfCode) {
      this.finishField();
      this.state = ParserState.FIELD_START;
      return true; // Row completed
    } else if (charCode === this.crCode) {
      this.finishField();
      this.state = ParserState.ROW_END;
    } else {
      // Quote not properly closed - treat as end of quoted field
      this.state = ParserState.FIELD_END;
    }
    return false;
  }

  private handleFieldEnd(_char: string, charCode: number): boolean {
    if (charCode === this.delimiterCode) {
      this.state = ParserState.FIELD_START;
    } else if (charCode === this.lfCode) {
      this.state = ParserState.FIELD_START;
      return true; // Row completed
    } else if (charCode === this.crCode) {
      this.state = ParserState.ROW_END;
    }
    // Ignore other characters after quoted field
    return false;
  }

  private handleRowEnd(char: string, charCode: number): boolean {
    if (charCode === this.lfCode) {
      this.state = ParserState.FIELD_START;
      return true; // Row completed
    } else {
      // \r not followed by \n - treat as field content
      this.currentField = '\r' + char;
      this.state = ParserState.IN_FIELD;
    }
    return false;
  }

  private appendToField(char: string): void {
    if (this.currentField.length >= this.maxFieldSize) {
      throw new Error(`Field exceeds maximum size of ${this.maxFieldSize} characters`);
    }
    this.currentField += char;
  }

  private finishField(): void {
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
  finalize(): string[] | null {
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
  getStats(): { rowIndex: number; columnIndex: number; charIndex: number; errors: ParseError[] } {
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
  reset(): void {
    this.state = ParserState.FIELD_START;
    this.currentField = '';
    this.currentRow = [];
    this.rowIndex = 0;
    this.columnIndex = 0;
    this.charIndex = 0;
    this.errors = [];
  }
}