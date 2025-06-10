/**
 * Format-Specific Optimizers
 * Centralized access to all format optimization components
 */

// Parquet Optimizer
export {
  ParquetOptimizer,
  getGlobalParquetOptimizer,
  shutdownGlobalParquetOptimizer,
  type ParquetOptimizationOptions,
  type ParquetMetrics,
  type ColumnStatistics,
  type ParquetReadOptions
} from './parquet-optimizer';

// Excel Optimizer
export {
  ExcelOptimizer,
  getGlobalExcelOptimizer,
  shutdownGlobalExcelOptimizer,
  type ExcelOptimizationOptions,
  type ExcelMetrics,
  type WorksheetInfo,
  type ExcelReadOptions
} from './excel-optimizer';

// JSON Optimizer
export {
  JsonOptimizer,
  getGlobalJsonOptimizer,
  shutdownGlobalJsonOptimizer,
  type JsonOptimizationOptions,
  type JsonMetrics,
  type JsonSchema,
  type JsonReadOptions,
  type SchemaValidationResult
} from './json-optimizer';

/**
 * Initialize all format optimizers
 */
export function initializeFormatOptimizers(): void {
  // Optimizers are initialized lazily when first accessed
  // This prevents unnecessary memory usage
}

/**
 * Shutdown all format optimizers
 */
export async function shutdownAllFormatOptimizers(): Promise<void> {
  await Promise.all([
    shutdownGlobalParquetOptimizer(),
    shutdownGlobalExcelOptimizer(),
    shutdownGlobalJsonOptimizer()
  ]);
}

/**
 * Get comprehensive format optimization metrics
 */
export function getAllFormatMetrics(): {
  parquet: any;
  excel: any;
  json: any;
} {
  try {
    return {
      parquet: getGlobalParquetOptimizer().getMetrics(),
      excel: getGlobalExcelOptimizer().getMetrics(),
      json: getGlobalJsonOptimizer().getMetrics()
    };
  } catch (error) {
    // Return empty metrics if optimizers not initialized
    return {
      parquet: null,
      excel: null,
      json: null
    };
  }
}