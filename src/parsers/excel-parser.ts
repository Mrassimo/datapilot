/**
 * Excel Parser Implementation
 * Supports .xlsx, .xls, and .xlsm formats using ExcelJS
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import * as ExcelJS from 'exceljs';
import type {
  ParsedRow,
  ParseOptions,
  FormatDetectionResult,
  FormatDetector,
} from './base/data-parser';
import { BaseParser } from './base/data-parser';
import { DataPilotError, ErrorSeverity, ErrorCategory } from '../core/types';
import { logger } from '../utils/logger';

interface ExcelMetadata {
  sheetCount: number;
  sheets: Array<{
    name: string;
    index: number;
    rowCount: number;
    columnCount: number;
    hasData: boolean;
  }>;
  selectedSheet?: {
    name: string;
    index: number;
    rowCount: number;
    columnCount: number;
  };
}

/**
 * Excel Format Detector
 */
export class ExcelDetector implements FormatDetector {
  getSupportedExtensions(): string[] {
    return ['.xlsx', '.xls', '.xlsm'];
  }

  getFormatName(): string {
    return 'excel';
  }

  async detect(filePath: string): Promise<FormatDetectionResult> {
    try {
      // Check extension first
      const ext = path.extname(filePath).toLowerCase();
      const extensionScore = this.getSupportedExtensions().includes(ext) ? 0.3 : 0;

      if (extensionScore === 0) {
        return {
          format: 'excel',
          confidence: 0,
          metadata: { reason: 'Unsupported extension' },
        };
      }

      // Try to read Excel metadata without parsing full file
      const metadata = await this.readExcelMetadata(filePath);

      if (metadata.sheetCount > 0) {
        const confidence = Math.min(0.95, extensionScore + 0.7);

        return {
          format: 'excel',
          confidence,
          metadata,
          estimatedRows: metadata.sheets.reduce((total, sheet) => total + sheet.rowCount, 0),
          estimatedColumns: Math.max(...metadata.sheets.map((sheet) => sheet.columnCount)),
          suggestedOptions: {
            sheetIndex: 0, // Default to first sheet with data
            sheetName: metadata.sheets.find((s) => s.hasData)?.name,
          },
        };
      }

      return {
        format: 'excel',
        confidence: extensionScore,
        metadata: { reason: 'No sheets with data found' },
      };
    } catch (error) {
      logger.warn(`Excel detection failed: ${error.message}`);
      return {
        format: 'excel',
        confidence: 0,
        metadata: { error: error.message },
      };
    }
  }

  private async readExcelMetadata(filePath: string): Promise<ExcelMetadata> {
    const workbook = new ExcelJS.Workbook();

    try {
      await workbook.xlsx.readFile(filePath);

      const sheets = workbook.worksheets.map((worksheet, index) => ({
        name: worksheet.name,
        index,
        rowCount: worksheet.rowCount,
        columnCount: worksheet.columnCount,
        hasData: worksheet.rowCount > 0 && worksheet.columnCount > 0,
      }));

      return {
        sheetCount: sheets.length,
        sheets,
      };
    } catch (error) {
      throw new DataPilotError(
        `Failed to read Excel metadata: ${error.message}`,
        'EXCEL_METADATA_ERROR',
        ErrorSeverity.MEDIUM,
        ErrorCategory.PARSING,
      );
    }
  }
}

/**
 * Excel Parser Implementation
 */
export class ExcelParser extends BaseParser {
  private headers: string[] = [];

  getSupportedExtensions(): string[] {
    return ['.xlsx', '.xls', '.xlsm'];
  }

  getFormatName(): string {
    return 'excel';
  }

  async detect(filePath: string): Promise<FormatDetectionResult> {
    const detector = new ExcelDetector();
    return detector.detect(filePath);
  }

  async *parse(filePath: string, options?: ParseOptions): AsyncIterableIterator<ParsedRow> {
    const mergedOptions = { ...this.options, ...options };

    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(filePath);

      // Get file size for stats
      const fileStats = await fs.stat(filePath);
      this.updateStats(fileStats.size, 0);

      // Select worksheet
      const worksheet = this.selectWorksheet(workbook, mergedOptions);

      if (!worksheet) {
        throw new DataPilotError(
          'No valid worksheet found or specified sheet does not exist',
          'EXCEL_WORKSHEET_ERROR',
          ErrorSeverity.HIGH,
          ErrorCategory.VALIDATION,
        );
      }

      logger.info(
        `Parsing Excel sheet: ${worksheet.name} (${worksheet.rowCount} rows, ${worksheet.columnCount} columns)`,
      );

      yield* this.parseWorksheet(worksheet, mergedOptions);
    } catch (error) {
      throw new DataPilotError(
        `Excel parsing failed: ${error.message}`,
        'EXCEL_PARSING_ERROR',
        ErrorSeverity.HIGH,
        ErrorCategory.PARSING,
      );
    }
  }

  private selectWorksheet(
    workbook: ExcelJS.Workbook,
    options: ParseOptions,
  ): ExcelJS.Worksheet | null {
    // Priority 1: Specific sheet name
    if (options.sheetName) {
      const worksheet = workbook.getWorksheet(options.sheetName);
      if (worksheet) {
        return worksheet;
      } else {
        throw new DataPilotError(
          `Sheet "${options.sheetName}" not found. Available sheets: ${workbook.worksheets.map((ws) => ws.name).join(', ')}`,
          'EXCEL_SHEET_NOT_FOUND',
          ErrorSeverity.HIGH,
          ErrorCategory.VALIDATION,
        );
      }
    }

    // Priority 2: Specific sheet index
    if (options.sheetIndex !== undefined) {
      const worksheet = workbook.getWorksheet(options.sheetIndex + 1); // ExcelJS is 1-based
      if (worksheet) {
        return worksheet;
      } else {
        throw new DataPilotError(
          `Sheet index ${options.sheetIndex} not found. Available sheets: 0-${workbook.worksheets.length - 1}`,
          'EXCEL_SHEET_INDEX_ERROR',
          ErrorSeverity.HIGH,
          ErrorCategory.VALIDATION,
        );
      }
    }

    // Priority 3: First worksheet with data
    const worksheetWithData = workbook.worksheets.find(
      (ws) => ws.rowCount > 0 && ws.columnCount > 0,
    );
    if (worksheetWithData) {
      return worksheetWithData;
    }

    // Priority 4: First worksheet (even if empty)
    return workbook.worksheets[0] || null;
  }

  private async *parseWorksheet(
    worksheet: ExcelJS.Worksheet,
    options: ParseOptions,
  ): AsyncIterableIterator<ParsedRow> {
    const maxRows = options.maxRows || worksheet.rowCount;
    const hasHeader = options.hasHeader ?? true;
    let rowIndex = 0;
    let dataRowIndex = 0;

    // Collect rows first since eachRow doesn't support async iteration
    const rows: ParsedRow[] = [];

    // Iterate through rows
    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (this.aborted || dataRowIndex >= maxRows) return;

      // Convert ExcelJS row to string array
      const values = row.values as any[];
      // Skip the first element (it's undefined in ExcelJS)
      const cellData = values.slice(1).map((cell) => this.formatCellValue(cell));

      // Handle header row
      if (rowIndex === 0 && hasHeader) {
        this.headers = cellData.map((cell) =>
          String(cell || `Column_${cellData.indexOf(cell) + 1}`),
        );
        rowIndex++;
        return; // Skip yielding header row
      }

      // Ensure consistent column count with headers
      const normalizedData = this.normalizeRowData(cellData, this.headers.length);

      rows.push({
        index: dataRowIndex++,
        data: normalizedData,
        raw: normalizedData.join('\t'), // Use tab as delimiter for Excel
        metadata: {
          originalType: 'excel',
          sheetName: worksheet.name,
          excelRow: rowNumber,
          columnCount: normalizedData.length,
        },
      });

      this.updateStats(0, 1);
      rowIndex++;
    });

    // If no headers were detected, generate them
    if (this.headers.length === 0 && rows.length > 0) {
      // Get first row to determine column count
      const firstRow = worksheet.getRow(1);
      const columnCount = firstRow.cellCount;
      this.headers = Array.from({ length: columnCount }, (_, i) => `Column_${i + 1}`);
    }

    // Yield collected rows
    for (const row of rows) {
      yield row;
    }
  }

  private formatCellValue(cell: any): string {
    if (cell === null || cell === undefined) {
      return '';
    }

    // Handle ExcelJS cell objects
    if (typeof cell === 'object') {
      // Rich text cell
      if (cell.richText) {
        return cell.richText.map((rt: any) => rt.text || '').join('');
      }

      // Formula cell
      if (cell.formula) {
        return cell.result !== undefined ? String(cell.result) : '';
      }

      // Hyperlink cell
      if (cell.hyperlink) {
        return cell.text || cell.hyperlink.text || '';
      }

      // Regular cell with text property
      if (cell.text !== undefined) {
        return String(cell.text);
      }

      // Cell with value property
      if (cell.value !== undefined) {
        return String(cell.value);
      }
    }

    // Handle Date objects
    if (cell instanceof Date) {
      return cell.toISOString().split('T')[0]; // Return date as YYYY-MM-DD
    }

    // Handle primitive values
    return String(cell);
  }

  private normalizeRowData(data: string[], expectedLength: number): string[] {
    // Ensure consistent column count
    const normalized = [...data];

    // Pad with empty strings if row is shorter
    while (normalized.length < expectedLength) {
      normalized.push('');
    }

    // Truncate if row is longer
    if (normalized.length > expectedLength) {
      normalized.length = expectedLength;
    }

    return normalized;
  }

  /**
   * Get detected headers for column mapping
   */
  getHeaders(): string[] {
    return [...this.headers];
  }

  /**
   * Get available worksheets in the file
   */
  async getWorksheets(filePath: string): Promise<
    Array<{
      name: string;
      index: number;
      rowCount: number;
      columnCount: number;
    }>
  > {
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(filePath);

      return workbook.worksheets.map((worksheet, index) => ({
        name: worksheet.name,
        index,
        rowCount: worksheet.rowCount,
        columnCount: worksheet.columnCount,
      }));
    } catch (error) {
      throw new DataPilotError(
        `Failed to read Excel worksheets: ${error.message}`,
        'EXCEL_WORKSHEETS_ERROR',
        ErrorSeverity.HIGH,
        ErrorCategory.PARSING,
      );
    }
  }
}

/**
 * Factory function to create Excel parser
 */
export function createExcelParser(options?: ParseOptions): ExcelParser {
  return new ExcelParser(options);
}
