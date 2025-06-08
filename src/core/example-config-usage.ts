/**
 * Example Usage of DataPilot Configuration System
 * Demonstrates how to use the new configurable thresholds and performance monitoring
 */

import {
  getConfig,
  loadConfigFromEnvironment,
  getPresetConfig,
  type DataPilotConfig,
} from './config';
import { getPerformanceMonitor, ResourceDetector } from './performance-monitor';
import { CSVParser } from '../parsers/csv-parser';
import { StreamingAnalyzer } from '../analyzers/streaming/streaming-analyzer';

/**
 * Example 1: Basic configuration usage
 */
export function exampleBasicConfig() {
  // Get default configuration
  const configManager = getConfig();
  const config = configManager.getConfig();
  console.log('Default max rows:', config.performance.maxRows);

  // Update specific configuration sections
  configManager.updatePerformanceConfig({
    maxRows: 2000000,
    chunkSize: 128 * 1024,
  });

  configManager.updateStatisticalConfig({
    significanceLevel: 0.01, // More stringent
    correlationThresholds: {
      weak: 0.2,
      moderate: 0.5,
      strong: 0.7,
      veryStrong: 0.9,
    },
  });

  // Validate configuration
  const validation = configManager.validateConfig();
  if (!validation.isValid) {
    console.error('Configuration errors:', validation.errors);
  }
}

/**
 * Example 2: Environment-based configuration
 */
export function exampleEnvironmentConfig() {
  // Set environment variables
  process.env.DATAPILOT_MAX_ROWS = '500000';
  process.env.DATAPILOT_MEMORY_THRESHOLD_MB = '150';
  process.env.DATAPILOT_SIGNIFICANCE_LEVEL = '0.01';

  // Load from environment
  const envConfig = loadConfigFromEnvironment();
  const configManager = getConfig();
  configManager.updateConfig(envConfig);

  console.log('Environment-configured max rows:', configManager.getPerformanceConfig().maxRows);
}

/**
 * Example 3: Preset configurations for different dataset sizes
 */
export function examplePresetConfigs() {
  const configManager = getConfig();

  // Small dataset configuration
  const smallConfig = getPresetConfig('small');
  configManager.updateConfig(smallConfig);
  console.log('Small dataset config - max rows:', configManager.getPerformanceConfig().maxRows);

  // Large dataset configuration
  const largeConfig = getPresetConfig('large');
  configManager.updateConfig(largeConfig);
  console.log('Large dataset config - max rows:', configManager.getPerformanceConfig().maxRows);
}

/**
 * Example 4: Adaptive configuration based on system resources
 */
export function exampleAdaptiveConfig() {
  const configManager = getConfig();

  // Detect system resources
  const resources = ResourceDetector.detectSystemResources();
  console.log('Available memory:', resources.availableMemoryMB, 'MB');
  console.log('Recommended config:', resources.recommendedConfig);

  // Apply recommended configuration
  configManager.updateConfig(resources.recommendedConfig);

  // Get adaptive thresholds for dataset size
  const datasetSize = 100000; // Example dataset size
  const memoryAvailable = resources.availableMemoryMB * 1024 * 1024; // Convert to bytes
  const adaptiveConfig = configManager.getAdaptiveThresholds(datasetSize, memoryAvailable);
  configManager.updateConfig(adaptiveConfig);
}

/**
 * Example 5: Performance monitoring with automatic adaptation
 */
export async function examplePerformanceMonitoring() {
  const perfMonitor = getPerformanceMonitor();

  // Start monitoring with 2-second intervals
  perfMonitor.startMonitoring(2000);

  // Enable automatic threshold adaptation
  perfMonitor.setAutoAdaptation(true);

  // Simulate some work
  for (let i = 0; i < 1000; i++) {
    perfMonitor.recordOperation('operation');
    if (i % 100 === 0) {
      perfMonitor.recordOperation('row', 100);
    }

    // Simulate some processing time
    await new Promise((resolve) => setTimeout(resolve, 10));
  }

  // Get performance summary
  const summary = perfMonitor.getPerformanceSummary();
  console.log('Performance summary:', {
    rowsProcessed: summary.operationalMetrics.rowsProcessed,
    errorRate: summary.operationalMetrics.errorRate,
    adaptiveThresholds: summary.adaptiveThresholds.length,
    alerts: summary.recentAlerts.length,
  });

  // Stop monitoring
  perfMonitor.stopMonitoring();
}

/**
 * Example 6: Using configuration with CSV parser
 */
export function exampleConfiguredCSVParser() {
  const configManager = getConfig();
  const perfConfig = configManager.getPerformanceConfig();

  // Create parser with configuration-based options
  const parser = new CSVParser({
    maxRows: perfConfig.maxRows,
    chunkSize: perfConfig.chunkSize,
    maxFieldSize: perfConfig.maxFieldSize,
  });

  console.log('Parser configured with max rows:', perfConfig.maxRows);
  return parser;
}

/**
 * Example 7: Using configuration with streaming analyzer
 */
export function exampleConfiguredStreamingAnalyzer() {
  const configManager = getConfig();

  // Configuration is automatically applied in StreamingAnalyzer constructor
  const analyzer = new StreamingAnalyzer({
    // Override specific settings if needed
    enableMultivariate: true,
    // Other settings come from global configuration
  });

  console.log('Streaming analyzer configured from global config');
  return analyzer;
}

/**
 * Example 8: Custom configuration for specific use cases
 */
export function exampleCustomConfiguration() {
  const configManager = getConfig();

  // Configuration for high-precision statistical analysis
  const highPrecisionConfig: Partial<DataPilotConfig> = {
    statistical: {
      significanceLevel: 0.001, // Very stringent
      alternativeSignificanceLevels: {
        normalityTests: 0.001,
        correlationTests: 0.001,
        hypothesisTests: 0.001,
        outlierDetection: 0.001,
      },
      confidenceLevel: 0.999,
    },
    analysis: {
      maxCorrelationPairs: 200, // More comprehensive analysis
      outlierMethods: ['iqr', 'zscore', 'modified_zscore'],
      normalityTests: ['shapiro', 'jarque_bera', 'ks_test'],
    },
  };

  configManager.updateConfig(highPrecisionConfig);
  console.log('Applied high-precision configuration');

  // Configuration for memory-constrained environments
  const memoryConstrainedConfig: Partial<DataPilotConfig> = {
    performance: {
      maxRows: 50000,
      chunkSize: 8 * 1024,
      batchSize: 100,
    },
    streaming: {
      memoryThresholdMB: 50,
      maxRowsAnalyzed: 50000,
    },
    analysis: {
      maxCorrelationPairs: 20,
      samplingThreshold: 2000,
      enableMultivariate: false, // Disable memory-intensive analysis
    },
  };

  configManager.updateConfig(memoryConstrainedConfig);
  console.log('Applied memory-constrained configuration');
}

/**
 * Example 9: Configuration validation and error handling
 */
export function exampleConfigValidation() {
  const configManager = getConfig();

  // Try to set invalid configuration
  try {
    configManager.updateStatisticalConfig({
      significanceLevel: 1.5, // Invalid - must be 0-1
    });

    const validation = configManager.validateConfig();
    if (!validation.isValid) {
      console.error('Configuration validation failed:', validation.errors);

      // Reset to default configuration
      configManager.reset();
      console.log('Configuration reset to defaults');
    }
  } catch (error) {
    console.error('Configuration error:', error);
  }
}

/**
 * Example 10: Runtime configuration monitoring
 */
export function exampleConfigurationMonitoring() {
  const configManager = getConfig();
  const perfMonitor = getPerformanceMonitor();

  // Start with default configuration
  console.log('Initial chunk size:', configManager.getPerformanceConfig().chunkSize);

  // Start performance monitoring
  perfMonitor.startMonitoring(1000);

  // Simulate high memory usage that triggers adaptation
  setTimeout(() => {
    // Manually trigger memory pressure simulation
    perfMonitor.setThreshold('chunkSize', 8192, 'Simulated memory pressure');

    console.log('Adapted chunk size:', perfMonitor.getAdaptiveThreshold('chunkSize'));
  }, 3000);

  // Stop monitoring after 10 seconds
  setTimeout(() => {
    perfMonitor.stopMonitoring();

    const summary = perfMonitor.getPerformanceSummary();
    console.log('Adaptation history:', summary.adaptationHistory);
  }, 10000);
}

// Export all examples for easy testing
export const configExamples = {
  basicConfig: exampleBasicConfig,
  environmentConfig: exampleEnvironmentConfig,
  presetConfigs: examplePresetConfigs,
  adaptiveConfig: exampleAdaptiveConfig,
  performanceMonitoring: examplePerformanceMonitoring,
  configuredCSVParser: exampleConfiguredCSVParser,
  configuredStreamingAnalyzer: exampleConfiguredStreamingAnalyzer,
  customConfiguration: exampleCustomConfiguration,
  configValidation: exampleConfigValidation,
  configurationMonitoring: exampleConfigurationMonitoring,
};
