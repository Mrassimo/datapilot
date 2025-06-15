/**
 * Structural Analyzer - Dataset dimensions and memory analysis
 * Handles memory estimation, sparsity analysis, and column profiling
 */

import type { ParsedRow } from '../../parsers/types';
import type {
  StructuralDimensions,
  ColumnInventory,
  Section1Config,
  Section1Warning,
  QuickColumnStatistics,
} from './types';

export class StructuralAnalyzer {
  private config: Section1Config;
  private warnings: Section1Warning[] = [];

  constructor(config: Section1Config) {
    this.config = config;
  }

  /**
   * Analyze dataset structural dimensions and memory characteristics
   */
  analyzeStructure(rows: ParsedRow[], hasHeader: boolean): StructuralDimensions {
    if (rows.length === 0) {
      return this.createEmptyStructure();
    }

    // Basic dimensions
    const totalRowsRead = rows.length;
    const totalDataRows = hasHeader ? totalRowsRead - 1 : totalRowsRead;
    const totalColumns = rows[0]?.data.length || 0;
    const totalDataCells = totalDataRows * totalColumns;

    // Column inventory
    const columnInventory = this.createColumnInventory(rows, hasHeader);

    // Memory estimation
    const estimatedInMemorySizeMB = this.estimateMemoryUsage(rows, totalDataRows);

    // Row length analysis
    const averageRowLengthBytes = this.calculateAverageRowLength(rows);

    // Sparsity analysis
    const sparsityAnalysis = this.analyzeSparsity(rows, hasHeader);

    // Quick statistics if enabled
    const quickStatistics = this.config.enableQuickStatistics
      ? this.generateQuickStatistics(rows, hasHeader, columnInventory)
      : undefined;

    // Add warnings for structural issues
    this.addStructuralWarnings(totalDataRows, totalColumns, estimatedInMemorySizeMB);

    return {
      totalRowsRead,
      totalDataRows,
      totalColumns,
      totalDataCells,
      columnInventory,
      estimatedInMemorySizeMB,
      averageRowLengthBytes,
      sparsityAnalysis,
      quickStatistics,
    };
  }

  /**
   * Create column inventory with names and indices
   */
  private createColumnInventory(rows: ParsedRow[], hasHeader: boolean): ColumnInventory[] {
    if (rows.length === 0) {
      return [];
    }

    const firstRow = rows[0];
    const columnCount = firstRow.data.length;
    const inventory: ColumnInventory[] = [];

    for (let i = 0; i < columnCount; i++) {
      let columnName: string;

      if (hasHeader) {
        // Use header row for column names
        columnName = firstRow.data[i] || `Column_${i}`;
      } else {
        // Generate generic column names
        columnName = `Col_${i}`;
      }

      inventory.push({
        index: i + 1, // 1-based indexing for display
        name: columnName,
        originalIndex: i, // 0-based original index
      });
    }

    return inventory;
  }

  /**
   * Estimate memory usage of the dataset
   */
  private estimateMemoryUsage(rows: ParsedRow[], dataRows: number): number {
    if (rows.length === 0) return 0;

    // Sample-based estimation for large datasets
    const sampleSize = Math.min(rows.length, 1000);
    const sampleRows = rows.slice(0, sampleSize);

    let totalSampleBytes = 0;

    for (const row of sampleRows) {
      for (const field of row.data) {
        // Estimate memory per field:
        // - String storage overhead (~24 bytes for V8 string object)
        // - Character storage (2 bytes per character for UTF-16 in V8)
        totalSampleBytes += 24 + field.length * 2;
      }
      // Row object overhead (~16 bytes)
      totalSampleBytes += 16;
    }

    // Average bytes per row
    const avgBytesPerRow = totalSampleBytes / sampleSize;

    // Extrapolate to full dataset
    const totalEstimatedBytes = avgBytesPerRow * dataRows;

    // Add overhead for data structures (arrays, indices, etc.) - roughly 30%
    const totalWithOverhead = totalEstimatedBytes * 1.3;

    // Convert to MB
    return Number((totalWithOverhead / (1024 * 1024)).toFixed(2));
  }

  /**
   * Calculate average row length in bytes
   */
  private calculateAverageRowLength(rows: ParsedRow[]): number {
    if (rows.length === 0) return 0;

    // Sample first 100 rows for performance
    const sampleRows = rows.slice(0, Math.min(100, rows.length));
    let totalBytes = 0;

    for (const row of sampleRows) {
      let rowBytes = 0;
      for (const field of row.data) {
        // UTF-8 byte estimation (most characters are 1 byte, some are 2-4)
        rowBytes += this.estimateUtf8Bytes(field);
      }
      // Add delimiter and line ending bytes
      rowBytes += row.data.length - 1; // delimiters between fields
      rowBytes += 1; // line ending
      totalBytes += rowBytes;
    }

    return Math.round(totalBytes / sampleRows.length);
  }

  /**
   * Estimate UTF-8 byte count for a string
   */
  private estimateUtf8Bytes(str: string): number {
    let bytes = 0;
    for (let i = 0; i < str.length; i++) {
      const code = str.charCodeAt(i);
      if (code < 0x80) {
        bytes += 1;
      } else if (code < 0x800) {
        bytes += 2;
      } else if (code < 0x10000) {
        bytes += 3;
      } else {
        bytes += 4;
      }
    }
    return bytes;
  }

  /**
   * Analyze dataset sparsity (empty/null values)
   */
  private analyzeSparsity(
    rows: ParsedRow[],
    hasHeader: boolean,
  ): {
    sparsityPercentage: number;
    method: string;
    sampleSize: number;
    description: string;
  } {
    if (rows.length === 0) {
      return {
        sparsityPercentage: 0,
        method: 'No data available',
        sampleSize: 0,
        description: 'Empty dataset',
      };
    }

    // Determine sample size
    const dataRows = hasHeader ? rows.slice(1) : rows;
    const maxSampleSize = this.config.maxSampleSizeForSparsity || 10000;
    const sampleSize = Math.min(dataRows.length, maxSampleSize);
    const sampleRows = dataRows.slice(0, sampleSize);

    let emptyCells = 0;
    let totalCells = 0;

    for (const row of sampleRows) {
      for (const field of row.data) {
        totalCells++;
        if (this.isEmptyCell(field)) {
          emptyCells++;
        }
      }
    }

    const sparsityPercentage =
      totalCells > 0 ? Number(((emptyCells / totalCells) * 100).toFixed(2)) : 0;

    let description: string;
    if (sparsityPercentage < 5) {
      description = 'Dense dataset with minimal missing values';
    } else if (sparsityPercentage < 20) {
      description = 'Moderately dense with some missing values';
    } else if (sparsityPercentage < 50) {
      description = 'Moderately sparse with significant missing values';
    } else {
      description = 'Highly sparse dataset with extensive missing values';
    }

    const method =
      sampleSize === dataRows.length
        ? 'Full dataset analysis'
        : `Statistical sampling of ${sampleSize} rows`;

    return {
      sparsityPercentage,
      method,
      sampleSize,
      description,
    };
  }

  /**
   * Check if a cell is considered empty
   */
  private isEmptyCell(value: string): boolean {
    // Consider various representations of empty/null values
    const trimmed = value.trim().toLowerCase();
    return (
      trimmed === '' ||
      trimmed === 'null' ||
      trimmed === 'undefined' ||
      trimmed === 'na' ||
      trimmed === 'n/a' ||
      trimmed === '-' ||
      trimmed === '#n/a'
    );
  }

  /**
   * Add warnings for structural characteristics
   */
  private addStructuralWarnings(dataRows: number, columns: number, memoryMB: number): void {
    // Large dataset warnings
    if (dataRows > 1000000) {
      this.warnings.push({
        category: 'structural',
        severity: 'medium',
        message: `Large dataset detected (${dataRows.toLocaleString()} rows)`,
        impact: 'Higher memory usage and longer processing times',
        suggestion: 'Consider using sampling for exploratory analysis',
      });
    }

    // Wide dataset warnings
    if (columns > 100) {
      this.warnings.push({
        category: 'structural',
        severity: 'medium',
        message: `Wide dataset detected (${columns} columns)`,
        impact: 'Complex correlation analysis and visualization challenges',
        suggestion: 'Consider feature selection or dimensionality reduction',
      });
    }

    // Memory warnings
    if (memoryMB > 1000) {
      this.warnings.push({
        category: 'structural',
        severity: 'high',
        message: `High memory usage estimated (${memoryMB}MB)`,
        impact: 'May exceed available system memory',
        suggestion: 'Consider processing in chunks or using sampling',
      });
    }

    // Small dataset warnings
    if (dataRows < 10) {
      this.warnings.push({
        category: 'structural',
        severity: 'low',
        message: `Very small dataset (${dataRows} rows)`,
        impact: 'Limited statistical analysis capability',
        suggestion: 'Statistical tests may have low power',
      });
    }
  }

  /**
   * Create empty structure for edge cases
   */
  private createEmptyStructure(): StructuralDimensions {
    return {
      totalRowsRead: 0,
      totalDataRows: 0,
      totalColumns: 0,
      totalDataCells: 0,
      columnInventory: [],
      estimatedInMemorySizeMB: 0,
      averageRowLengthBytes: 0,
      sparsityAnalysis: {
        sparsityPercentage: 0,
        method: 'No data available',
        sampleSize: 0,
        description: 'Empty dataset',
      },
    };
  }

  /**
   * Generate quick column statistics for overview
   */
  private generateQuickStatistics(
    rows: ParsedRow[],
    hasHeader: boolean,
    columnInventory: ColumnInventory[]
  ): QuickColumnStatistics {
    if (rows.length === 0) {
      return this.createEmptyStatistics();
    }

    const dataStartIndex = hasHeader ? 1 : 0;
    const sampleSize = Math.min(rows.length - dataStartIndex, 1000); // Sample first 1000 data rows
    const sampleRows = rows.slice(dataStartIndex, dataStartIndex + sampleSize);
    
    let numericColumns = 0;
    let textColumns = 0;
    let dateColumns = 0;
    let booleanColumns = 0;
    let emptyColumns = 0;
    let highCardinalityColumns = 0;
    let lowCardinalityColumns = 0;
    const potentialIdColumns: string[] = [];
    
    const columnTypes: Array<{
      columnName: string;
      detectedType: 'numeric' | 'text' | 'date' | 'boolean' | 'empty' | 'mixed';
      uniqueValueCount: number;
      cardinality: 'high' | 'medium' | 'low';
    }> = [];

    for (let colIndex = 0; colIndex < columnInventory.length; colIndex++) {
      const column = columnInventory[colIndex];
      const values: string[] = [];
      
      // Collect values from sample
      for (const row of sampleRows) {
        if (row.data[colIndex] !== undefined) {
          values.push(row.data[colIndex]);
        }
      }
      
      if (values.length === 0) {
        emptyColumns++;
        columnTypes.push({
          columnName: column.name,
          detectedType: 'empty',
          uniqueValueCount: 0,
          cardinality: 'low',
        });
        continue;
      }

      // Analyze column type and characteristics
      const typeAnalysis = this.analyzeColumnType(values);
      const uniqueValueCount = new Set(values).size;
      const cardinalityRatio = uniqueValueCount / values.length;
      
      let cardinality: 'high' | 'medium' | 'low' = 'medium';
      if (cardinalityRatio > 0.5) {
        cardinality = 'high';
        highCardinalityColumns++;
      } else if (cardinalityRatio < 0.1) {
        cardinality = 'low';
        lowCardinalityColumns++;
      }

      // Count by type
      switch (typeAnalysis.primaryType) {
        case 'numeric':
          numericColumns++;
          break;
        case 'date':
          dateColumns++;
          break;
        case 'boolean':
          booleanColumns++;
          break;
        case 'text':
        default:
          textColumns++;
          break;
      }

      if (typeAnalysis.primaryType === 'empty') {
        emptyColumns++;
      }

      // Check if potentially an ID column
      if (this.isPotentialIdColumn(column.name, values, uniqueValueCount)) {
        potentialIdColumns.push(column.name);
      }

      columnTypes.push({
        columnName: column.name,
        detectedType: typeAnalysis.primaryType,
        uniqueValueCount,
        cardinality,
      });
    }

    return {
      numericColumns,
      textColumns,
      dateColumns,
      booleanColumns,
      emptyColumns,
      highCardinalityColumns,
      lowCardinalityColumns,
      potentialIdColumns,
      columnTypes,
      analysisMethod: `Sample-based analysis (${sampleSize} rows)`,
      sampleSize,
    };
  }

  /**
   * Analyze the type of a column based on its values
   */
  private analyzeColumnType(values: string[]): { primaryType: 'numeric' | 'text' | 'date' | 'boolean' | 'empty' | 'mixed' } {
    if (values.length === 0) {
      return { primaryType: 'empty' };
    }

    let numericCount = 0;
    let dateCount = 0;
    let booleanCount = 0;
    let emptyCount = 0;
    
    for (const value of values.slice(0, 50)) { // Sample first 50 values for type detection
      const trimmed = value.trim();
      
      if (this.isEmptyCell(trimmed)) {
        emptyCount++;
      } else if (this.isNumeric(trimmed)) {
        numericCount++;
      } else if (this.isDate(trimmed)) {
        dateCount++;
      } else if (this.isBoolean(trimmed)) {
        booleanCount++;
      }
    }

    const sampleSize = Math.min(values.length, 50);
    const threshold = sampleSize * 0.6; // 60% threshold for type determination

    if (numericCount >= threshold) return { primaryType: 'numeric' };
    if (dateCount >= threshold) return { primaryType: 'date' };
    if (booleanCount >= threshold) return { primaryType: 'boolean' };
    if (emptyCount >= threshold) return { primaryType: 'empty' };

    // Check for mixed types
    const totalTypedValues = numericCount + dateCount + booleanCount;
    if (totalTypedValues >= threshold) {
      return { primaryType: 'mixed' };
    }

    return { primaryType: 'text' };
  }

  /**
   * Check if a value is numeric
   */
  private isNumeric(value: string): boolean {
    if (value === '') return false;
    const num = Number(value.replace(/,/g, '')); // Remove commas
    return !isNaN(num) && isFinite(num);
  }

  /**
   * Check if a value looks like a date
   */
  private isDate(value: string): boolean {
    if (value === '') return false;
    
    // Common date patterns
    const datePatterns = [
      /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
      /^\d{2}\/\d{2}\/\d{4}$/, // MM/DD/YYYY
      /^\d{2}-\d{2}-\d{4}$/, // MM-DD-YYYY
      /^\d{4}\/\d{2}\/\d{2}$/, // YYYY/MM/DD
    ];
    
    return datePatterns.some(pattern => pattern.test(value)) || !isNaN(Date.parse(value));
  }

  /**
   * Check if a value is boolean
   */
  private isBoolean(value: string): boolean {
    const lower = value.toLowerCase().trim();
    return ['true', 'false', 'yes', 'no', 'y', 'n', '1', '0'].includes(lower);
  }

  /**
   * Check if a column might be an ID column
   */
  private isPotentialIdColumn(
    columnName: string,
    values: string[],
    uniqueValueCount: number
  ): boolean {
    // Check name patterns
    const namePatterns = [/id$/i, /^id/i, /key$/i, /^key/i, /index$/i, /^index/i];
    const hasIdName = namePatterns.some(pattern => pattern.test(columnName));
    
    // Check uniqueness (high cardinality suggests ID)
    const uniquenessRatio = uniqueValueCount / values.length;
    const isHighlyUnique = uniquenessRatio > 0.9;
    
    // Check if values look like IDs (sequential numbers, UUIDs, etc.)
    const sampleValues = values.slice(0, 10);
    const looksLikeIds = sampleValues.every(value => {
      const trimmed = value.trim();
      return /^[a-zA-Z0-9\-_]+$/.test(trimmed) && trimmed.length >= 3;
    });
    
    return hasIdName || (isHighlyUnique && looksLikeIds);
  }

  /**
   * Create empty statistics for edge cases
   */
  private createEmptyStatistics(): QuickColumnStatistics {
    return {
      numericColumns: 0,
      textColumns: 0,
      dateColumns: 0,
      booleanColumns: 0,
      emptyColumns: 0,
      highCardinalityColumns: 0,
      lowCardinalityColumns: 0,
      potentialIdColumns: [],
      columnTypes: [],
      analysisMethod: 'No data available',
      sampleSize: 0,
    };
  }

  /**
   * Get collected warnings
   */
  getWarnings(): Section1Warning[] {
    return [...this.warnings];
  }

  /**
   * Clear warnings
   */
  clearWarnings(): void {
    this.warnings = [];
  }
}
