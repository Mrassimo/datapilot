/**
 * Parquet Format Performance Optimizer
 * Provides columnar processing and memory-efficient streaming for Parquet files
 */

import { EventEmitter } from 'events';
import { logger } from '../../utils/logger';
import { DataPilotError, ErrorSeverity, ErrorCategory } from '../../core/types';
import { getGlobalMemoryOptimizer } from '../memory-optimizer';
import { getGlobalEnhancedErrorHandler } from '../../utils/enhanced-error-handler';

export interface ParquetOptimizationOptions {
  enableColumnarProcessing?: boolean;
  enablePredicatePushdown?: boolean;
  batchSize?: number;
  memoryLimitMB?: number;
  enableStatistics?: boolean;
  compressionLevel?: number;
  enableParallelReading?: boolean;
  maxConcurrentColumns?: number;
}

export interface ParquetMetrics {
  rowsProcessed: number;
  columnsRead: number;
  compressionRatio: number;
  readThroughputMBps: number;
  memoryEfficiency: number;
  statisticsHits: number;
  predicateFilteredRows: number;
  totalProcessingTime: number;
}

export interface ColumnStatistics {
  columnName: string;
  dataType: string;
  nullCount: number;
  distinctCount?: number;
  minValue?: any;
  maxValue?: any;
  compressionRatio: number;
  memoryFootprint: number;
}

export interface ParquetReadOptions {
  columns?: string[];
  rowRange?: { start: number; end: number };
  predicate?: (row: any) => boolean;
  enableStatistics?: boolean;
  batchSize?: number;
}

/**
 * High-performance Parquet file optimizer with columnar processing
 */
export class ParquetOptimizer extends EventEmitter {
  private options: Required<ParquetOptimizationOptions>;
  private metrics: ParquetMetrics;
  private columnStatistics: Map<string, ColumnStatistics> = new Map();
  private memoryOptimizer = getGlobalMemoryOptimizer();
  private errorHandler = getGlobalEnhancedErrorHandler();

  constructor(options: ParquetOptimizationOptions = {}) {
    super();
    
    this.options = {
      enableColumnarProcessing: options.enableColumnarProcessing ?? true,
      enablePredicatePushdown: options.enablePredicatePushdown ?? true,
      batchSize: options.batchSize ?? 10000,
      memoryLimitMB: options.memoryLimitMB ?? 256,
      enableStatistics: options.enableStatistics ?? true,
      compressionLevel: options.compressionLevel ?? 6,
      enableParallelReading: options.enableParallelReading ?? true,
      maxConcurrentColumns: options.maxConcurrentColumns ?? 4
    };

    this.metrics = this.initializeMetrics();
    
    logger.info('Parquet optimizer initialized', {
      component: 'ParquetOptimizer',
      options: this.options
    });
  }

  /**
   * Optimize Parquet file reading with columnar processing
   */
  async optimizeRead(filePath: string, readOptions: ParquetReadOptions = {}): Promise<any[]> {
    return this.errorHandler.wrapFunction(async () => {
      const startTime = Date.now();
      
      try {
        // Validate file and options
        await this.validateInputs(filePath, readOptions);
        
        // Get file metadata and statistics
        const metadata = await this.getParquetMetadata(filePath);
        
        // Optimize column selection based on statistics
        const optimizedColumns = await this.optimizeColumnSelection(
          metadata,
          readOptions.columns
        );
        
        // Apply predicate pushdown if enabled
        const optimizedPredicate = this.options.enablePredicatePushdown
          ? this.optimizePredicate(readOptions.predicate, metadata)
          : readOptions.predicate;
        
        // Read with columnar optimization
        const results = await this.readColumnar(
          filePath,
          {
            ...readOptions,
            columns: optimizedColumns,
            predicate: optimizedPredicate
          },
          metadata
        );
        
        // Update metrics
        this.updateMetrics(results.length, Date.now() - startTime);
        
        logger.info(`Parquet read optimized: ${results.length} rows in ${Date.now() - startTime}ms`, {
          component: 'ParquetOptimizer',
          filePath,
          rowCount: results.length
        });
        
        return results;
        
      } catch (error) {
        this.emit('error', error);
        throw new DataPilotError(
          `Parquet optimization failed: ${(error as Error).message}`,
          'PARQUET_OPTIMIZATION_ERROR',
          ErrorSeverity.HIGH,
          ErrorCategory.PERFORMANCE
        );
      }
    }, { operation: 'parquet-read', component: 'ParquetOptimizer', filePath })();
  }

  /**
   * Get Parquet file metadata with enhanced statistics
   */
  private async getParquetMetadata(filePath: string): Promise<any> {
    try {
      // Import parquet library dynamically
      const parquet = await import('hyparquet');
      
      const metadata = await parquet.parquetMetadataAsync(filePath);
      
      if (this.options.enableStatistics) {
        await this.buildColumnStatistics(filePath, metadata);
      }
      
      return metadata;
      
    } catch (error) {
      throw new DataPilotError(
        `Failed to read Parquet metadata: ${(error as Error).message}`,
        'PARQUET_METADATA_ERROR',
        ErrorSeverity.HIGH,
        ErrorCategory.PARSING
      );
    }
  }

  /**
   * Build detailed column statistics for optimization
   */
  private async buildColumnStatistics(filePath: string, metadata: any): Promise<void> {
    try {
      const parquet = await import('hyparquet');
      const schema = parquet.parquetSchema(metadata);
      
      for (const column of schema.columns || []) {
        const stats: ColumnStatistics = {
          columnName: column.name,
          dataType: column.type,
          nullCount: column.statistics?.null_count || 0,
          distinctCount: column.statistics?.distinct_count,
          minValue: column.statistics?.min,
          maxValue: column.statistics?.max,
          compressionRatio: this.calculateCompressionRatio(column),
          memoryFootprint: this.estimateMemoryFootprint(column)
        };
        
        this.columnStatistics.set(column.name, stats);
      }
      
      logger.debug('Column statistics built', {
        component: 'ParquetOptimizer',
        columnCount: this.columnStatistics.size
      });
      
    } catch (error) {
      logger.warn('Failed to build column statistics', {
        component: 'ParquetOptimizer',
        error: (error as Error).message
      });
    }
  }

  /**
   * Optimize column selection based on statistics and usage patterns
   */
  private async optimizeColumnSelection(
    metadata: any,
    requestedColumns?: string[]
  ): Promise<string[]> {
    if (!requestedColumns) {
      // Return all columns if none specified
      const parquet = await import('hyparquet');
      const schema = parquet.parquetSchema(metadata);
      return schema.columns?.map((col: any) => col.name) || [];
    }
    
    // Filter columns based on statistics and memory efficiency
    const optimizedColumns = requestedColumns.filter(colName => {
      const stats = this.columnStatistics.get(colName);
      if (!stats) return true; // Include if no stats available
      
      // Skip columns with very high memory footprint unless specifically needed
      const memoryThresholdMB = this.options.memoryLimitMB * 0.3;
      if (stats.memoryFootprint > memoryThresholdMB * 1024 * 1024) {
        logger.warn(`Column ${colName} exceeds memory threshold, consider optimization`, {
          component: 'ParquetOptimizer',
          memoryFootprint: stats.memoryFootprint
        });
      }
      
      return true; // Include all requested columns for now
    });
    
    logger.debug('Column selection optimized', {
      component: 'ParquetOptimizer',
      requested: requestedColumns.length,
      optimized: optimizedColumns.length
    });
    
    return optimizedColumns;
  }

  /**
   * Optimize predicate for pushdown to Parquet engine
   */
  private optimizePredicate(
    predicate?: (row: any) => boolean,
    metadata?: any
  ): ((row: any) => boolean) | undefined {
    if (!predicate) return undefined;
    
    // Wrap predicate with statistics-based pre-filtering
    return (row: any) => {
      // Apply column statistics for early filtering
      for (const [colName, stats] of this.columnStatistics) {
        const value = row[colName];
        
        // Skip null checks if column has no nulls
        if (stats.nullCount === 0 && value === null) {
          return false;
        }
        
        // Use min/max bounds for range filtering
        if (stats.minValue !== undefined && value < stats.minValue) {
          this.metrics.predicateFilteredRows++;
          return false;
        }
        
        if (stats.maxValue !== undefined && value > stats.maxValue) {
          this.metrics.predicateFilteredRows++;
          return false;
        }
      }
      
      // Apply original predicate
      return predicate(row);
    };
  }

  /**
   * Read Parquet file with columnar optimization
   */
  private async readColumnar(
    filePath: string,
    options: ParquetReadOptions,
    metadata: any
  ): Promise<any[]> {
    return this.memoryOptimizer.withOptimization(async () => {
      const parquet = await import('hyparquet');
      const results: any[] = [];
      
      // Create async buffer for streaming
      const asyncBuffer = await parquet.asyncBufferFromFile(filePath);
      
      // Configure batch reading
      const batchSize = options.batchSize || this.options.batchSize;
      let processedRows = 0;
      
      if (this.options.enableParallelReading && options.columns) {
        // Parallel columnar reading
        const columnData = await this.readColumnsInParallel(
          asyncBuffer,
          options.columns,
          options.rowRange
        );
        
        // Reconstruct rows from column data
        const rowCount = columnData[0]?.length || 0;
        for (let i = 0; i < rowCount; i++) {
          const row: any = {};
          options.columns.forEach((colName, colIndex) => {
            row[colName] = columnData[colIndex][i];
          });
          
          // Apply predicate if specified
          if (!options.predicate || options.predicate(row)) {
            results.push(row);
          }
          
          processedRows++;
          
          // Memory check every batch
          if (processedRows % batchSize === 0) {
            await this.checkMemoryPressure();
          }
        }
        
      } else {
        // Sequential reading with optimization
        for await (const batch of parquet.parquetReadObjects(asyncBuffer, {
          limit: batchSize,
          offset: options.rowRange?.start,
          columns: options.columns
        })) {
          for (const row of batch) {
            // Apply predicate if specified
            if (!options.predicate || options.predicate(row)) {
              results.push(row);
            }
            
            processedRows++;
            
            // Memory check every batch
            if (processedRows % batchSize === 0) {
              await this.checkMemoryPressure();
            }
            
            // Stop if we've reached the end range
            if (options.rowRange?.end && processedRows >= options.rowRange.end) {
              break;
            }
          }
        }
      }
      
      this.metrics.rowsProcessed += processedRows;
      this.metrics.columnsRead += options.columns?.length || 0;
      
      return results;
    });
  }

  /**
   * Read multiple columns in parallel for better performance
   */
  private async readColumnsInParallel(
    asyncBuffer: any,
    columns: string[],
    rowRange?: { start: number; end: number }
  ): Promise<any[][]> {
    const maxConcurrency = this.options.maxConcurrentColumns;
    const columnData: any[][] = [];
    
    // Process columns in batches to control concurrency
    for (let i = 0; i < columns.length; i += maxConcurrency) {
      const columnBatch = columns.slice(i, i + maxConcurrency);
      
      const batchPromises = columnBatch.map(async (columnName) => {
        try {
          const parquet = await import('hyparquet');
          
          // Read single column data
          const columnValues: any[] = [];
          for await (const batch of parquet.parquetReadObjects(asyncBuffer, {
            columns: [columnName],
            offset: rowRange?.start,
            limit: rowRange ? rowRange.end - (rowRange.start || 0) : undefined
          })) {
            for (const row of batch) {
              columnValues.push(row[columnName]);
            }
          }
          
          return columnValues;
          
        } catch (error) {
          logger.warn(`Failed to read column ${columnName}`, {
            component: 'ParquetOptimizer',
            error: (error as Error).message
          });
          return [];
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      columnData.push(...batchResults);
    }
    
    return columnData;
  }

  /**
   * Check memory pressure and trigger GC if needed
   */
  private async checkMemoryPressure(): Promise<void> {
    const memoryStats = this.memoryOptimizer.getDetailedStats();
    
    if (memoryStats.pressure.level > 0.8) {
      logger.warn('High memory pressure during Parquet processing', {
        component: 'ParquetOptimizer',
        pressure: memoryStats.pressure.level
      });
      
      // Trigger garbage collection
      this.memoryOptimizer.forceGarbageCollection();
      
      // Small delay to allow GC
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  /**
   * Calculate compression ratio for a column
   */
  private calculateCompressionRatio(column: any): number {
    if (!column.statistics) return 1.0;
    
    const uncompressed = column.statistics.uncompressed_size || 1;
    const compressed = column.statistics.compressed_size || uncompressed;
    
    return uncompressed / compressed;
  }

  /**
   * Estimate memory footprint for a column
   */
  private estimateMemoryFootprint(column: any): number {
    if (!column.statistics) return 1024; // Default 1KB estimate
    
    const rowCount = column.statistics.row_count || 1000;
    const avgValueSize = this.getAverageValueSize(column.type);
    
    return rowCount * avgValueSize;
  }

  /**
   * Get average value size for data type
   */
  private getAverageValueSize(dataType: string): number {
    const sizeMap: Record<string, number> = {
      'INT32': 4,
      'INT64': 8,
      'FLOAT': 4,
      'DOUBLE': 8,
      'BOOLEAN': 1,
      'BYTE_ARRAY': 32, // Estimate for strings
      'FIXED_LEN_BYTE_ARRAY': 16
    };
    
    return sizeMap[dataType.toUpperCase()] || 16;
  }

  /**
   * Validate inputs for Parquet operations
   */
  private async validateInputs(filePath: string, options: ParquetReadOptions): Promise<void> {
    if (!filePath || typeof filePath !== 'string') {
      throw new DataPilotError(
        'Invalid file path provided',
        'INVALID_INPUT',
        ErrorSeverity.HIGH,
        ErrorCategory.VALIDATION
      );
    }
    
    if (options.batchSize && (options.batchSize < 1 || options.batchSize > 100000)) {
      throw new DataPilotError(
        'Batch size must be between 1 and 100,000',
        'INVALID_BATCH_SIZE',
        ErrorSeverity.MEDIUM,
        ErrorCategory.VALIDATION
      );
    }
    
    if (options.rowRange) {
      const { start, end } = options.rowRange;
      if (start < 0 || (end !== undefined && end <= start)) {
        throw new DataPilotError(
          'Invalid row range specified',
          'INVALID_ROW_RANGE',
          ErrorSeverity.MEDIUM,
          ErrorCategory.VALIDATION
        );
      }
    }
  }

  /**
   * Update performance metrics
   */
  private updateMetrics(rowCount: number, processingTime: number): void {
    this.metrics.totalProcessingTime += processingTime;
    
    if (processingTime > 0) {
      // Calculate throughput (rows per second)
      const rowsPerSecond = (rowCount / processingTime) * 1000;
      this.metrics.readThroughputMBps = (rowsPerSecond * 100) / (1024 * 1024); // Estimate MB/s
    }
    
    // Update memory efficiency
    const memoryStats = this.memoryOptimizer.getDetailedStats();
    this.metrics.memoryEfficiency = 1 - memoryStats.pressure.level;
  }

  /**
   * Initialize metrics structure
   */
  private initializeMetrics(): ParquetMetrics {
    return {
      rowsProcessed: 0,
      columnsRead: 0,
      compressionRatio: 1.0,
      readThroughputMBps: 0,
      memoryEfficiency: 1.0,
      statisticsHits: 0,
      predicateFilteredRows: 0,
      totalProcessingTime: 0
    };
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): ParquetMetrics {
    return { ...this.metrics };
  }

  /**
   * Get column statistics
   */
  getColumnStatistics(columnName?: string): ColumnStatistics | Map<string, ColumnStatistics> {
    if (columnName) {
      return this.columnStatistics.get(columnName) || {
        columnName,
        dataType: 'unknown',
        nullCount: 0,
        compressionRatio: 1.0,
        memoryFootprint: 0
      };
    }
    return new Map(this.columnStatistics);
  }

  /**
   * Reset metrics and statistics
   */
  reset(): void {
    this.metrics = this.initializeMetrics();
    this.columnStatistics.clear();
    
    logger.debug('Parquet optimizer reset', {
      component: 'ParquetOptimizer'
    });
  }

  /**
   * Cleanup and shutdown
   */
  async shutdown(): Promise<void> {
    this.removeAllListeners();
    this.columnStatistics.clear();
    
    logger.info('Parquet optimizer shutdown', {
      component: 'ParquetOptimizer'
    });
  }
}

/**
 * Global Parquet optimizer instance
 */
let globalParquetOptimizer: ParquetOptimizer | null = null;

/**
 * Get or create global Parquet optimizer
 */
export function getGlobalParquetOptimizer(options?: ParquetOptimizationOptions): ParquetOptimizer {
  if (!globalParquetOptimizer) {
    globalParquetOptimizer = new ParquetOptimizer(options);
  }
  return globalParquetOptimizer;
}

/**
 * Shutdown global Parquet optimizer
 */
export async function shutdownGlobalParquetOptimizer(): Promise<void> {
  if (globalParquetOptimizer) {
    await globalParquetOptimizer.shutdown();
    globalParquetOptimizer = null;
  }
}