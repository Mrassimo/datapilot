/**
 * Excel Format Performance Optimizer
 * Provides memory-efficient streaming and parsing for Excel files (.xlsx, .xls)
 */

import { EventEmitter } from 'events';
import { logger } from '../../utils/logger';
import { DataPilotError, ErrorSeverity, ErrorCategory } from '../../core/types';
import { getGlobalMemoryOptimizer } from '../memory-optimizer';
import { getGlobalEnhancedErrorHandler } from '../../utils/enhanced-error-handler';

export interface ExcelOptimizationOptions {
  enableStreaming?: boolean;
  enableSharedStringOptimization?: boolean;
  worksheetBatchSize?: number;
  memoryLimitMB?: number;
  enableTypeInference?: boolean;
  skipEmptyRows?: boolean;
  maxConcurrentWorksheets?: number;
  enableFormulaEvaluation?: boolean;
}

export interface ExcelMetrics {
  worksheetsProcessed: number;
  rowsProcessed: number;
  cellsProcessed: number;
  sharedStringsOptimized: number;
  memoryPeakMB: number;
  streamingEfficiency: number;
  totalProcessingTime: number;
  averageRowProcessingTime: number;
}

export interface WorksheetInfo {
  name: string;
  rowCount: number;
  columnCount: number;
  estimatedSizeMB: number;
  hasFormulas: boolean;
  dataTypes: Map<string, string>;
}

export interface ExcelReadOptions {
  worksheets?: string[];
  startRow?: number;
  endRow?: number;
  startColumn?: string;
  endColumn?: string;
  includeEmptyRows?: boolean;
  evaluateFormulas?: boolean;
  convertTypes?: boolean;
}

/**
 * High-performance Excel file optimizer with streaming capabilities
 */
export class ExcelOptimizer extends EventEmitter {
  private options: Required<ExcelOptimizationOptions>;
  private metrics: ExcelMetrics;
  private worksheetInfo: Map<string, WorksheetInfo> = new Map();
  private sharedStringCache: Map<number, string> = new Map();
  private memoryOptimizer = getGlobalMemoryOptimizer();
  private errorHandler = getGlobalEnhancedErrorHandler();

  constructor(options: ExcelOptimizationOptions = {}) {
    super();
    
    this.options = {
      enableStreaming: options.enableStreaming ?? true,
      enableSharedStringOptimization: options.enableSharedStringOptimization ?? true,
      worksheetBatchSize: options.worksheetBatchSize ?? 1000,
      memoryLimitMB: options.memoryLimitMB ?? 512,
      enableTypeInference: options.enableTypeInference ?? true,
      skipEmptyRows: options.skipEmptyRows ?? true,
      maxConcurrentWorksheets: options.maxConcurrentWorksheets ?? 2,
      enableFormulaEvaluation: options.enableFormulaEvaluation ?? false
    };

    this.metrics = this.initializeMetrics();
    
    logger.info('Excel optimizer initialized', {
      component: 'ExcelOptimizer',
      options: this.options
    });
  }

  /**
   * Optimize Excel file reading with streaming and memory efficiency
   */
  async optimizeRead(filePath: string, readOptions: ExcelReadOptions = {}): Promise<any[]> {
    return this.errorHandler.wrapFunction(async () => {
      const startTime = Date.now();
      
      try {
        // Validate file and options
        await this.validateInputs(filePath, readOptions);
        
        // Get workbook metadata
        const workbook = await this.loadWorkbook(filePath);
        
        // Analyze worksheets for optimization
        await this.analyzeWorksheets(workbook, readOptions.worksheets);
        
        // Optimize shared strings if enabled
        if (this.options.enableSharedStringOptimization) {
          await this.optimizeSharedStrings(workbook);
        }
        
        // Read with streaming optimization
        const results = await this.readWithStreaming(workbook, readOptions);
        
        // Update metrics
        this.updateMetrics(results.length, Date.now() - startTime);
        
        logger.info(`Excel read optimized: ${results.length} rows in ${Date.now() - startTime}ms`, {
          component: 'ExcelOptimizer',
          filePath,
          rowCount: results.length
        });
        
        return results;
        
      } catch (error) {
        this.emit('error', error);
        throw new DataPilotError(
          `Excel optimization failed: ${(error as Error).message}`,
          'EXCEL_OPTIMIZATION_ERROR',
          ErrorSeverity.HIGH,
          ErrorCategory.PERFORMANCE
        );
      }
    }, { operation: 'excel-read', component: 'ExcelOptimizer', filePath })();
  }

  /**
   * Load Excel workbook with memory optimization
   */
  private async loadWorkbook(filePath: string): Promise<any> {
    throw new DataPilotError(
      'Excel performance optimizer has been disabled due to security vulnerabilities in xlsx dependency. Use the standard ExcelJS parser instead.',
      ErrorSeverity.ERROR,
      ErrorCategory.DEPENDENCY,
      { filePath, reason: 'xlsx_security_vulnerability' }
    );
  }

  /**
   * Analyze worksheets for optimization strategies
   */
  private async analyzeWorksheets(workbook: any, requestedWorksheets?: string[]): Promise<void> {
    const worksheetNames = requestedWorksheets || workbook.SheetNames || [];
    
    for (const sheetName of worksheetNames) {
      const worksheet = workbook.Sheets[sheetName];
      if (!worksheet) continue;
      
      try {
        const info = await this.analyzeWorksheet(worksheet, sheetName);
        this.worksheetInfo.set(sheetName, info);
        
        logger.debug(`Analyzed worksheet: ${sheetName}`, {
          component: 'ExcelOptimizer',
          rowCount: info.rowCount,
          columnCount: info.columnCount,
          estimatedSizeMB: info.estimatedSizeMB
        });
        
      } catch (error) {
        logger.warn(`Failed to analyze worksheet ${sheetName}`, {
          component: 'ExcelOptimizer',
          error: (error as Error).message
        });
      }
    }
  }

  /**
   * Analyze individual worksheet for optimization
   */
  private async analyzeWorksheet(worksheet: any, name: string): Promise<WorksheetInfo> {
    const range = worksheet['!ref'];
    const dataTypes = new Map<string, string>();
    
    let rowCount = 0;
    let columnCount = 0;
    let hasFormulas = false;
    
    if (range) {
      // Import xlsx utilities
      const XLSX = await import('xlsx');
      const decoded = XLSX.utils.decode_range(range);
      
      rowCount = decoded.e.r - decoded.s.r + 1;
      columnCount = decoded.e.c - decoded.s.c + 1;
      
      // Sample cells for type inference
      const sampleSize = Math.min(100, rowCount);
      for (let r = decoded.s.r; r < decoded.s.r + sampleSize; r++) {
        for (let c = decoded.s.c; c <= decoded.e.c; c++) {
          const cellAddress = XLSX.utils.encode_cell({ r, c });
          const cell = worksheet[cellAddress];
          
          if (cell) {
            if (cell.f) hasFormulas = true;
            
            const columnName = XLSX.utils.encode_col(c);
            if (cell.t && !dataTypes.has(columnName)) {
              dataTypes.set(columnName, this.mapCellTypeToDataType(cell.t));
            }
          }
        }
      }
    }
    
    // Estimate memory size
    const estimatedSizeMB = this.estimateWorksheetSize(rowCount, columnCount);
    
    return {
      name,
      rowCount,
      columnCount,
      estimatedSizeMB,
      hasFormulas,
      dataTypes
    };
  }

  /**
   * Optimize shared strings table for memory efficiency
   */
  private async optimizeSharedStrings(workbook: any): Promise<void> {
    try {
      // Build optimized shared string cache
      const sharedStrings = workbook.SST || [];
      
      for (let i = 0; i < sharedStrings.length; i++) {
        const str = sharedStrings[i];
        if (typeof str === 'string') {
          this.sharedStringCache.set(i, str);
        }
      }
      
      this.metrics.sharedStringsOptimized = this.sharedStringCache.size;
      
      logger.debug(`Optimized ${this.sharedStringCache.size} shared strings`, {
        component: 'ExcelOptimizer'
      });
      
    } catch (error) {
      logger.warn('Failed to optimize shared strings', {
        component: 'ExcelOptimizer',
        error: (error as Error).message
      });
    }
  }

  /**
   * Read Excel with streaming optimization
   */
  private async readWithStreaming(workbook: any, options: ExcelReadOptions): Promise<any[]> {
    return this.memoryOptimizer.withOptimization(async () => {
      const XLSX = await import('xlsx');
      const results: any[] = [];
      
      const worksheetNames = options.worksheets || workbook.SheetNames || [];
      
      if (this.options.maxConcurrentWorksheets > 1 && worksheetNames.length > 1) {
        // Process worksheets in parallel batches
        const worksheetBatches = this.batchArray(worksheetNames, this.options.maxConcurrentWorksheets);
        
        for (const batch of worksheetBatches) {
          const batchPromises = batch.map(sheetName => 
            this.processWorksheetStreaming(workbook.Sheets[sheetName], sheetName, options)
          );
          
          const batchResults = await Promise.all(batchPromises);
          batchResults.forEach(sheetData => results.push(...sheetData));
          
          // Memory check between batches
          await this.checkMemoryPressure();
        }
        
      } else {
        // Sequential processing
        for (const sheetName of worksheetNames) {
          const sheetData = await this.processWorksheetStreaming(
            workbook.Sheets[sheetName],
            sheetName,
            options
          );
          results.push(...sheetData);
          
          await this.checkMemoryPressure();
        }
      }
      
      return results;
    });
  }

  /**
   * Process individual worksheet with streaming
   */
  private async processWorksheetStreaming(
    worksheet: any,
    sheetName: string,
    options: ExcelReadOptions
  ): Promise<any[]> {
    const XLSX = await import('xlsx');
    const results: any[] = [];
    
    if (!worksheet || !worksheet['!ref']) {
      return results;
    }
    
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    const startRow = options.startRow ?? range.s.r;
    const endRow = options.endRow ?? range.e.r;
    const startCol = options.startColumn ? XLSX.utils.decode_col(options.startColumn) : range.s.c;
    const endCol = options.endColumn ? XLSX.utils.decode_col(options.endColumn) : range.e.c;
    
    // Process in batches for memory efficiency
    const batchSize = this.options.worksheetBatchSize;
    
    for (let batchStart = startRow; batchStart <= endRow; batchStart += batchSize) {
      const batchEnd = Math.min(batchStart + batchSize - 1, endRow);
      
      const batchData = await this.processBatch(
        worksheet,
        sheetName,
        batchStart,
        batchEnd,
        startCol,
        endCol,
        options
      );
      
      results.push(...batchData);
      
      // Memory check every batch
      if (results.length % batchSize === 0) {
        await this.checkMemoryPressure();
      }
      
      this.metrics.rowsProcessed += batchData.length;
    }
    
    this.metrics.worksheetsProcessed++;
    
    logger.debug(`Processed worksheet ${sheetName}: ${results.length} rows`, {
      component: 'ExcelOptimizer',
      worksheet: sheetName,
      rows: results.length
    });
    
    return results;
  }

  /**
   * Process a batch of rows from worksheet
   */
  private async processBatch(
    worksheet: any,
    sheetName: string,
    startRow: number,
    endRow: number,
    startCol: number,
    endCol: number,
    options: ExcelReadOptions
  ): Promise<any[]> {
    const XLSX = await import('xlsx');
    const batchResults: any[] = [];
    
    for (let r = startRow; r <= endRow; r++) {
      const row: any = { _worksheet: sheetName, _row: r };
      let hasData = false;
      
      for (let c = startCol; c <= endCol; c++) {
        const cellAddress = XLSX.utils.encode_cell({ r, c });
        const cell = worksheet[cellAddress];
        
        if (cell) {
          const columnName = XLSX.utils.encode_col(c);
          let value = this.getCellValue(cell, options);
          
          if (this.options.enableTypeInference && value !== null && value !== undefined) {
            value = this.inferAndConvertType(value, columnName);
          }
          
          row[columnName] = value;
          this.metrics.cellsProcessed++;
          hasData = true;
        }
      }
      
      // Skip empty rows if configured
      if (!hasData && this.options.skipEmptyRows && !options.includeEmptyRows) {
        continue;
      }
      
      batchResults.push(row);
    }
    
    return batchResults;
  }

  /**
   * Get optimized cell value
   */
  private getCellValue(cell: any, options: ExcelReadOptions): any {
    if (!cell) return null;
    
    // Handle formulas
    if (cell.f && this.options.enableFormulaEvaluation && options.evaluateFormulas) {
      return cell.v !== undefined ? cell.v : cell.w || cell.f;
    }
    
    // Handle shared strings
    if (cell.t === 's' && this.sharedStringCache.has(cell.v)) {
      return this.sharedStringCache.get(cell.v);
    }
    
    // Return calculated value, raw value, or formatted text
    return cell.v !== undefined ? cell.v : cell.w;
  }

  /**
   * Infer and convert data types
   */
  private inferAndConvertType(value: any, columnName: string): any {
    if (value === null || value === undefined || value === '') {
      return null;
    }
    
    const strValue = String(value).trim();
    
    // Try number conversion
    if (/^-?\d+\.?\d*$/.test(strValue)) {
      const num = Number(strValue);
      if (!isNaN(num)) {
        return num;
      }
    }
    
    // Try boolean conversion
    if (/^(true|false|yes|no|1|0)$/i.test(strValue)) {
      return /^(true|yes|1)$/i.test(strValue);
    }
    
    // Try date conversion
    if (value instanceof Date || this.isDateString(strValue)) {
      const date = new Date(strValue);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
    
    return value;
  }

  /**
   * Check if string represents a date
   */
  private isDateString(str: string): boolean {
    const datePatterns = [
      /^\d{4}-\d{2}-\d{2}$/,
      /^\d{2}\/\d{2}\/\d{4}$/,
      /^\d{2}-\d{2}-\d{4}$/,
      /^\d{4}\/\d{2}\/\d{2}$/
    ];
    
    return datePatterns.some(pattern => pattern.test(str));
  }

  /**
   * Map Excel cell type to data type
   */
  private mapCellTypeToDataType(cellType: string): string {
    const typeMap: Record<string, string> = {
      'n': 'number',
      's': 'string',
      'b': 'boolean',
      'd': 'date',
      'e': 'error',
      'z': 'empty'
    };
    
    return typeMap[cellType] || 'unknown';
  }

  /**
   * Estimate worksheet memory size
   */
  private estimateWorksheetSize(rowCount: number, columnCount: number): number {
    const avgCellSize = 20; // Bytes per cell estimate
    const totalCells = rowCount * columnCount;
    const estimatedBytes = totalCells * avgCellSize;
    
    return estimatedBytes / (1024 * 1024); // Convert to MB
  }

  /**
   * Split array into batches
   */
  private batchArray<T>(array: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < array.length; i += batchSize) {
      batches.push(array.slice(i, i + batchSize));
    }
    return batches;
  }

  /**
   * Check memory pressure and optimize if needed
   */
  private async checkMemoryPressure(): Promise<void> {
    const memoryStats = this.memoryOptimizer.getDetailedStats();
    
    if (memoryStats.pressure.level > 0.8) {
      logger.warn('High memory pressure during Excel processing', {
        component: 'ExcelOptimizer',
        pressure: memoryStats.pressure.level
      });
      
      // Clear caches if memory pressure is high
      if (memoryStats.pressure.level > 0.9) {
        this.sharedStringCache.clear();
        logger.debug('Cleared shared string cache due to memory pressure');
      }
      
      // Force garbage collection
      this.memoryOptimizer.forceGarbageCollection();
      
      // Small delay to allow GC
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Update peak memory usage
    const currentMemoryMB = process.memoryUsage().heapUsed / (1024 * 1024);
    if (currentMemoryMB > this.metrics.memoryPeakMB) {
      this.metrics.memoryPeakMB = currentMemoryMB;
    }
  }

  /**
   * Validate inputs for Excel operations
   */
  private async validateInputs(filePath: string, options: ExcelReadOptions): Promise<void> {
    if (!filePath || typeof filePath !== 'string') {
      throw new DataPilotError(
        'Invalid file path provided',
        'INVALID_INPUT',
        ErrorSeverity.HIGH,
        ErrorCategory.VALIDATION
      );
    }
    
    if (!filePath.match(/\.(xlsx?|xlsm|xlsb)$/i)) {
      throw new DataPilotError(
        'File must be a valid Excel format (.xlsx, .xls, .xlsm, .xlsb)',
        'INVALID_FILE_FORMAT',
        ErrorSeverity.HIGH,
        ErrorCategory.VALIDATION
      );
    }
    
    if (options.startRow !== undefined && options.startRow < 0) {
      throw new DataPilotError(
        'Start row must be non-negative',
        'INVALID_ROW_RANGE',
        ErrorSeverity.MEDIUM,
        ErrorCategory.VALIDATION
      );
    }
    
    if (options.endRow !== undefined && options.startRow !== undefined && options.endRow < options.startRow) {
      throw new DataPilotError(
        'End row must be greater than or equal to start row',
        'INVALID_ROW_RANGE',
        ErrorSeverity.MEDIUM,
        ErrorCategory.VALIDATION
      );
    }
  }

  /**
   * Update performance metrics
   */
  private updateMetrics(totalRows: number, processingTime: number): void {
    this.metrics.totalProcessingTime += processingTime;
    
    if (totalRows > 0 && processingTime > 0) {
      this.metrics.averageRowProcessingTime = processingTime / totalRows;
    }
    
    // Calculate streaming efficiency
    const memoryStats = this.memoryOptimizer.getDetailedStats();
    this.metrics.streamingEfficiency = 1 - memoryStats.pressure.level;
  }

  /**
   * Initialize metrics structure
   */
  private initializeMetrics(): ExcelMetrics {
    return {
      worksheetsProcessed: 0,
      rowsProcessed: 0,
      cellsProcessed: 0,
      sharedStringsOptimized: 0,
      memoryPeakMB: 0,
      streamingEfficiency: 1.0,
      totalProcessingTime: 0,
      averageRowProcessingTime: 0
    };
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): ExcelMetrics {
    return { ...this.metrics };
  }

  /**
   * Get worksheet information
   */
  getWorksheetInfo(worksheetName?: string): WorksheetInfo | Map<string, WorksheetInfo> {
    if (worksheetName) {
      return this.worksheetInfo.get(worksheetName) || {
        name: worksheetName,
        rowCount: 0,
        columnCount: 0,
        estimatedSizeMB: 0,
        hasFormulas: false,
        dataTypes: new Map()
      };
    }
    return new Map(this.worksheetInfo);
  }

  /**
   * Reset metrics and caches
   */
  reset(): void {
    this.metrics = this.initializeMetrics();
    this.worksheetInfo.clear();
    this.sharedStringCache.clear();
    
    logger.debug('Excel optimizer reset', {
      component: 'ExcelOptimizer'
    });
  }

  /**
   * Cleanup and shutdown
   */
  async shutdown(): Promise<void> {
    this.removeAllListeners();
    this.worksheetInfo.clear();
    this.sharedStringCache.clear();
    
    logger.info('Excel optimizer shutdown', {
      component: 'ExcelOptimizer'
    });
  }
}

/**
 * Global Excel optimizer instance
 */
let globalExcelOptimizer: ExcelOptimizer | null = null;

/**
 * Get or create global Excel optimizer
 */
export function getGlobalExcelOptimizer(options?: ExcelOptimizationOptions): ExcelOptimizer {
  if (!globalExcelOptimizer) {
    globalExcelOptimizer = new ExcelOptimizer(options);
  }
  return globalExcelOptimizer;
}

/**
 * Shutdown global Excel optimizer
 */
export async function shutdownGlobalExcelOptimizer(): Promise<void> {
  if (globalExcelOptimizer) {
    await globalExcelOptimizer.shutdown();
    globalExcelOptimizer = null;
  }
}