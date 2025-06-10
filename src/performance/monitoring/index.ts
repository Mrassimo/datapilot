/**
 * Performance Monitoring and Adaptive Configuration
 * Centralized access to monitoring, configuration, and benchmarking components
 */

// Performance Dashboard
export {
  PerformanceDashboard,
  getGlobalPerformanceDashboard,
  shutdownGlobalPerformanceDashboard,
  type DashboardMetrics,
  type SystemMetrics,
  type PerformanceMetrics,
  type ErrorReductionMetrics,
  type FormatOptimizerMetrics,
  type TrendMetrics,
  type AlertMetrics,
  type DashboardConfig,
  type AlertThresholds
} from './performance-dashboard';

// Adaptive Configuration
export {
  AdaptiveConfigurationManager,
  getGlobalAdaptiveConfigManager,
  shutdownGlobalAdaptiveConfigManager,
  type AdaptiveConfigOptions,
  type WorkloadCharacteristics,
  type PerformanceProfile,
  type ConfigurationSettings,
  type AdaptationMetrics
} from './adaptive-config';

// Benchmarking Suite
export {
  PerformanceBenchmarkSuite,
  getGlobalBenchmarkSuite,
  runQuickBenchmark,
  shutdownGlobalBenchmarkSuite,
  type BenchmarkConfig,
  type BenchmarkResult,
  type BenchmarkReport,
  type BenchmarkSuite,
  type BenchmarkTest
} from '../benchmarking/benchmark-suite';

/**
 * Initialize all monitoring components
 */
export function initializeMonitoring(options: {
  enableDashboard?: boolean;
  enableAdaptiveConfig?: boolean;
  enableBenchmarking?: boolean;
  dashboardConfig?: any;
  adaptiveConfigOptions?: any;
  benchmarkConfig?: any;
} = {}): void {
  const {
    enableDashboard = true,
    enableAdaptiveConfig = true,
    enableBenchmarking = false, // Only enable on demand
    dashboardConfig,
    adaptiveConfigOptions,
    benchmarkConfig
  } = options;

  if (enableDashboard) {
    const dashboard = getGlobalPerformanceDashboard(dashboardConfig);
    dashboard.start();
  }

  if (enableAdaptiveConfig) {
    const adaptiveConfig = getGlobalAdaptiveConfigManager(adaptiveConfigOptions);
    // Note: Adaptive config needs to be started explicitly with initial settings
  }

  if (enableBenchmarking) {
    // Benchmark suite is initialized but not automatically started
    getGlobalBenchmarkSuite(benchmarkConfig);
  }
}

/**
 * Shutdown all monitoring components
 */
export async function shutdownAllMonitoring(): Promise<void> {
  await Promise.all([
    shutdownGlobalPerformanceDashboard(),
    shutdownGlobalAdaptiveConfigManager(),
    shutdownGlobalBenchmarkSuite()
  ]);
}

/**
 * Get comprehensive monitoring status
 */
export function getMonitoringStatus(): {
  dashboard: any;
  adaptiveConfig: any;
  benchmarking: any;
} {
  try {
    return {
      dashboard: getGlobalPerformanceDashboard().getCurrentMetrics(),
      adaptiveConfig: getGlobalAdaptiveConfigManager().getAdaptationMetrics(),
      benchmarking: getGlobalBenchmarkSuite().getLatestReport()
    };
  } catch (error) {
    return {
      dashboard: null,
      adaptiveConfig: null,
      benchmarking: null
    };
  }
}