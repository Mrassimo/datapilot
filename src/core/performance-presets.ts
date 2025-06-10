/**
 * Performance Optimization Presets for Large File Processing
 * Optimized configurations for different file sizes and use cases
 */

import type { DataPilotConfig } from './config';
import { DEFAULT_CONFIG } from './config';

export interface PerformancePreset {
  name: string;
  description: string;
  targetFileSize: string;
  targetMemoryUsage: string;
  expectedPerformance: string;
  config: Partial<DataPilotConfig>;
  optimizations: string[];
  limitations: string[];
}

/**
 * Large File Processing Preset (1-10GB files)
 */
export const LARGE_FILE_PRESET: PerformancePreset = {
  name: 'large-files',
  description: 'Optimized for processing 1-10GB CSV files with minimal memory usage',
  targetFileSize: '1-10GB',
  targetMemoryUsage: '<512MB',
  expectedPerformance: '500K-1M rows/minute',
  config: {
    performance: {
      ...DEFAULT_CONFIG.performance,
      maxRows: 10000000, // 10M rows
      chunkSize: 16 * 1024, // 16KB chunks for memory efficiency
      batchSize: 250, // Smaller batches
      memoryThresholdBytes: 256 * 1024 * 1024, // 256MB conservative threshold
      maxFieldSize: 10 * 1024 * 1024 * 1024, // 10GB
    },
    streaming: {
      ...DEFAULT_CONFIG.streaming,
      memoryThresholdMB: 128, // Very conservative memory limit
      maxRowsAnalyzed: 10000000, // Process all rows
      adaptiveChunkSizing: {
        enabled: true,
        minChunkSize: 4 * 1024, // 4KB minimum
        maxChunkSize: 32 * 1024, // 32KB maximum
        reductionFactor: 0.5, // Aggressive memory pressure response
        expansionFactor: 1.1,
        targetMemoryUtilization: 0.7, // Trigger at 70% memory usage
      },
    },
    analysis: {
      maxCategoricalLevels: 20, // Reduced categorical analysis
      maxCorrelationPairs: 10, // Limited correlations
      samplingThreshold: 50000, // Aggressive sampling
      outlierMethods: ['iqr'],
      normalityTests: ['shapiro'],
      enableMultivariate: false, // Disable memory-intensive multivariate
      enabledAnalyses: ['univariate'],
      highCardinalityThreshold: 80,
      missingValueQualityThreshold: 20,
      multivariateThreshold: 2000, // Reduce multivariate threshold
      maxDimensionsForPCA: 5, // Limited PCA dimensions
      clusteringMethods: ['kmeans'], // Simple clustering only
    },
    output: {
      includeVisualizationRecommendations: false, // Disable viz recommendations
      includeEngineeringInsights: true, // Keep essential engineering insights
      verboseOutput: false, // Minimal output
      progressReporting: true, // Keep progress reporting
    },
  },
  optimizations: [
    'Streaming processing with minimal memory footprint',
    'Aggressive chunk size adaptation based on memory pressure',
    'Disabled memory-intensive multivariate analysis',
    'Limited correlation and clustering analysis',
    'Simplified statistical computations',
    'Reduced categorical level analysis',
    'Conservative memory thresholds with early cleanup',
  ],
  limitations: [
    'No multivariate analysis (correlations, PCA, clustering)',
    'Limited advanced statistical measures',
    'No visualization recommendations',
    'Reduced categorical analysis scope',
    'Sampling may be applied for very large datasets',
  ],
};

/**
 * Ultra Large File Preset (10-100GB files)
 */
export const ULTRA_LARGE_FILE_PRESET: PerformancePreset = {
  name: 'ultra-large-files',
  description: 'Extreme optimization for processing 10-100GB CSV files',
  targetFileSize: '10-100GB',
  targetMemoryUsage: '<256MB',
  expectedPerformance: '200-500K rows/minute',
  config: {
    performance: {
      ...DEFAULT_CONFIG.performance,
      maxRows: 50000000, // 50M rows
      chunkSize: 8 * 1024, // 8KB chunks
      batchSize: 100, // Very small batches
      memoryThresholdBytes: 128 * 1024 * 1024, // 128MB ultra-conservative
      maxFieldSize: 100 * 1024 * 1024 * 1024, // 100GB
    },
    streaming: {
      ...DEFAULT_CONFIG.streaming,
      memoryThresholdMB: 64, // Ultra-conservative memory limit
      maxRowsAnalyzed: 50000000, // Process all rows
      adaptiveChunkSizing: {
        enabled: true,
        minChunkSize: 2 * 1024, // 2KB minimum
        maxChunkSize: 16 * 1024, // 16KB maximum
        reductionFactor: 0.3, // Very aggressive reduction
        expansionFactor: 1.1,
        targetMemoryUtilization: 0.6, // Trigger at 60% memory usage
      },
    },
    analysis: {
      maxCategoricalLevels: 10, // Minimal categorical analysis
      maxCorrelationPairs: 0, // No correlations
      samplingThreshold: 10000, // Heavy sampling
      outlierMethods: ['iqr'],
      normalityTests: ['shapiro'],
      enableMultivariate: false,
      enabledAnalyses: ['univariate'],
      highCardinalityThreshold: 80,
      missingValueQualityThreshold: 20,
      multivariateThreshold: 0, // No multivariate
      maxDimensionsForPCA: 0, // No PCA
      clusteringMethods: [], // No clustering
    },
    output: {
      includeVisualizationRecommendations: false,
      includeEngineeringInsights: false, // Minimal insights only
      verboseOutput: false,
      progressReporting: true,
      format: 'json', // JSON only for efficiency
    },
  },
  optimizations: [
    'Ultra-minimal memory footprint with 2-16KB chunks',
    'Heavy sampling strategy (10K rows maximum)',
    'All advanced analysis disabled',
    'No multivariate, correlation, or clustering analysis',
    'Emergency memory management with 60% threshold',
    'JSON-only output for minimal overhead',
  ],
  limitations: [
    'Analysis limited to 10,000 row sample',
    'No advanced statistical analysis',
    'No multivariate, correlation, or clustering',
    'No visualization or engineering recommendations',
    'Basic data quality and overview only',
  ],
};

/**
 * Speed Optimized Preset (Fast processing)
 */
export const SPEED_OPTIMIZED_PRESET: PerformancePreset = {
  name: 'speed-optimized',
  description: 'Optimized for fastest possible processing with good quality',
  targetFileSize: '100MB-5GB',
  targetMemoryUsage: '<1GB',
  expectedPerformance: '1-2M rows/minute',
  config: {
    performance: {
      ...DEFAULT_CONFIG.performance,
      maxRows: 5000000, // 5M rows
      chunkSize: 128 * 1024, // Large 128KB chunks for speed
      batchSize: 1000, // Large batches
      memoryThresholdBytes: 512 * 1024 * 1024, // 512MB threshold
      maxFieldSize: 5 * 1024 * 1024 * 1024, // 5GB
    },
    streaming: {
      ...DEFAULT_CONFIG.streaming,
      memoryThresholdMB: 256,
      maxRowsAnalyzed: 5000000,
    },
    analysis: {
      ...DEFAULT_CONFIG.analysis,
      maxCategoricalLevels: 50, // Full categorical analysis
      maxCorrelationPairs: 50, // More correlations
      samplingThreshold: 100000, // Less aggressive sampling
      multivariateThreshold: 5000,
      maxDimensionsForPCA: 10,
      clusteringMethods: ['kmeans', 'hierarchical'],
      enableMultivariate: true,
    },
    output: {
      includeVisualizationRecommendations: true,
      includeEngineeringInsights: true,
      verboseOutput: true,
      progressReporting: true,
    },
  },
  optimizations: [
    'Large chunk sizes for faster I/O',
    'Parallel processing for CPU-intensive operations',
    'Fixed chunking to avoid adaptation overhead',
    'Full feature set with speed optimizations',
    'Parallel statistical computations',
    'Higher memory thresholds for better performance',
  ],
  limitations: [
    'Higher memory usage (up to 1GB)',
    'May not be suitable for memory-constrained environments',
    'Processing time may increase with very large files',
  ],
};

/**
 * Memory Constrained Preset (Low memory environments)
 */
export const MEMORY_CONSTRAINED_PRESET: PerformancePreset = {
  name: 'memory-constrained',
  description: 'Optimized for environments with very limited memory (< 512MB)',
  targetFileSize: '10MB-1GB',
  targetMemoryUsage: '<128MB',
  expectedPerformance: '100-300K rows/minute',
  config: {
    performance: {
      ...DEFAULT_CONFIG.performance,
      maxRows: 1000000, // 1M rows
      chunkSize: 4 * 1024, // Tiny 4KB chunks
      batchSize: 50, // Very small batches
      memoryThresholdBytes: 64 * 1024 * 1024, // 64MB threshold
      maxFieldSize: 1024 * 1024 * 1024, // 1GB
    },
    streaming: {
      ...DEFAULT_CONFIG.streaming,
      memoryThresholdMB: 32, // Very low memory threshold
      maxRowsAnalyzed: 1000000,
      adaptiveChunkSizing: {
        enabled: true,
        minChunkSize: 1024, // 1KB minimum
        maxChunkSize: 8 * 1024, // 8KB maximum
        reductionFactor: 0.25, // Very aggressive reduction
        expansionFactor: 1.1,
        targetMemoryUtilization: 0.5, // Trigger at 50% memory usage
      },
    },
    analysis: {
      maxCategoricalLevels: 5, // Very limited categorical
      maxCorrelationPairs: 5, // Minimal correlations
      samplingThreshold: 5000, // Aggressive sampling
      outlierMethods: ['iqr'],
      normalityTests: ['shapiro'],
      enableMultivariate: false, // Disable for memory
      enabledAnalyses: ['univariate'],
      highCardinalityThreshold: 80,
      missingValueQualityThreshold: 20,
      multivariateThreshold: 500,
      maxDimensionsForPCA: 3,
      clusteringMethods: ['kmeans'], // Single clustering method
    },
    output: {
      includeVisualizationRecommendations: false,
      includeEngineeringInsights: false,
      verboseOutput: false,
      progressReporting: true,
      format: 'json', // Minimal output format
    },
  },
  optimizations: [
    'Ultra-small chunk sizes (1-8KB)',
    'Aggressive memory pressure response (50% threshold)',
    'Heavy sampling strategy (5K rows)',
    'Minimal feature set to reduce memory usage',
    'Frequent garbage collection triggers',
    'Simplified analysis algorithms',
  ],
  limitations: [
    'Analysis limited to 5,000 row sample',
    'Very limited advanced analysis',
    'No visualization or engineering recommendations',
    'Slow processing due to small chunks',
    'Basic quality assessment only',
  ],
};

/**
 * All available performance presets
 */
export const PERFORMANCE_PRESETS: Record<string, PerformancePreset> = {
  'large-files': LARGE_FILE_PRESET,
  'ultra-large-files': ULTRA_LARGE_FILE_PRESET,
  'speed-optimized': SPEED_OPTIMIZED_PRESET,
  'memory-constrained': MEMORY_CONSTRAINED_PRESET,
};

/**
 * Automatically select appropriate preset based on file characteristics
 */
export function selectOptimalPreset(
  fileSizeBytes: number,
  availableMemoryMB: number,
  userPriority: 'speed' | 'memory' | 'quality' | 'auto' = 'auto',
): PerformancePreset {
  const fileSizeGB = fileSizeBytes / (1024 * 1024 * 1024);

  // Memory constraints override file size considerations
  if (availableMemoryMB < 256) {
    return MEMORY_CONSTRAINED_PRESET;
  }

  // User priority overrides
  if (userPriority === 'speed' && fileSizeGB < 5) {
    return SPEED_OPTIMIZED_PRESET;
  }

  if (userPriority === 'memory') {
    return MEMORY_CONSTRAINED_PRESET;
  }

  // Auto-selection based on file size
  if (fileSizeGB > 10) {
    return ULTRA_LARGE_FILE_PRESET;
  }

  if (fileSizeGB > 1) {
    return LARGE_FILE_PRESET;
  }

  if (fileSizeGB > 0.1) {
    return SPEED_OPTIMIZED_PRESET;
  }

  // Default for small files
  return SPEED_OPTIMIZED_PRESET;
}

/**
 * Apply preset configuration to base config
 */
export function applyPerformancePreset(
  baseConfig: Partial<DataPilotConfig>,
  preset: PerformancePreset,
): DataPilotConfig {
  // Deep merge preset config with base config
  const mergedConfig = {
    ...baseConfig,
    performance: {
      ...baseConfig.performance,
      ...preset.config.performance,
    },
    streaming: {
      ...baseConfig.streaming,
      ...preset.config.streaming,
    },
    analysis: {
      ...baseConfig.analysis,
      ...preset.config.analysis,
    },
    output: {
      ...baseConfig.output,
      ...preset.config.output,
    },
  };

  return mergedConfig as DataPilotConfig;
}

/**
 * Get performance recommendations for given file characteristics
 */
export function getPerformanceRecommendations(
  fileSizeBytes: number,
  availableMemoryMB: number,
  currentConfig?: Partial<DataPilotConfig>,
): {
  recommendedPreset: PerformancePreset;
  optimizations: string[];
  warnings: string[];
  estimatedMetrics: {
    processingTimeMinutes: number;
    memoryUsageMB: number;
    qualityScore: number;
  };
} {
  const preset = selectOptimalPreset(fileSizeBytes, availableMemoryMB);
  const fileSizeGB = fileSizeBytes / (1024 * 1024 * 1024);

  const optimizations: string[] = [...preset.optimizations];
  const warnings: string[] = [];

  // Add specific optimizations based on file characteristics
  if (fileSizeGB > 5) {
    optimizations.push('Consider using data sampling for faster analysis');
  }

  if (availableMemoryMB < 512) {
    warnings.push('Low memory environment detected - analysis will be limited');
  }

  if (fileSizeGB > availableMemoryMB / 1024) {
    warnings.push('File size exceeds available memory - streaming processing required');
  }

  // Estimate processing metrics
  const rowsPerGB = 10000000; // Estimate 10M rows per GB
  const estimatedRows = fileSizeGB * rowsPerGB;
  const processingSpeed =
    preset.name === 'speed-optimized'
      ? 1500000
      : preset.name === 'large-files'
        ? 750000
        : preset.name === 'ultra-large-files'
          ? 350000
          : 150000;

  const estimatedMetrics = {
    processingTimeMinutes: Math.ceil(estimatedRows / processingSpeed / 60),
    memoryUsageMB: Math.min(
      parseInt(preset.targetMemoryUsage.replace(/[<>]/g, '').replace('MB', '')),
      availableMemoryMB * 0.8,
    ),
    qualityScore:
      preset.name === 'speed-optimized'
        ? 95
        : preset.name === 'large-files'
          ? 80
          : preset.name === 'ultra-large-files'
            ? 60
            : 70,
  };

  return {
    recommendedPreset: preset,
    optimizations,
    warnings,
    estimatedMetrics,
  };
}
