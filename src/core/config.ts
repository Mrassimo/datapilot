/**
 * DataPilot Configuration System
 * Centralized configuration management for all hardcoded values and thresholds
 */

export interface PerformanceConfig {
  /** Maximum number of rows to process */
  maxRows: number;
  /** Maximum field size in bytes */
  maxFieldSize: number;
  /** Memory threshold in bytes before adaptive measures */
  memoryThresholdBytes: number;
  /** Chunk size for streaming processing */
  chunkSize: number;
  /** Sample size for auto-detection */
  sampleSize: number;
  /** Enable adaptive chunk sizing */
  adaptiveChunkSizing: boolean;
  /** Maximum collected rows for multivariate analysis */
  maxCollectedRowsMultivariate: number;
  /** Batch size for streaming */
  batchSize: number;
  /** Performance monitoring interval (chunks) */
  performanceMonitoringInterval: number;
  /** Memory cleanup interval (chunks) */
  memoryCleanupInterval: number;
  /** Emergency memory threshold multiplier */
  emergencyMemoryThresholdMultiplier: number;
}

export interface StatisticalConfig {
  /** Default significance level for statistical tests */
  significanceLevel: number;
  /** Alternative significance levels for different tests */
  alternativeSignificanceLevels: {
    normalityTests: number;
    correlationTests: number;
    hypothesisTests: number;
    outlierDetection: number;
  };
  /** Confidence intervals */
  confidenceLevel: number;
  /** Correlation coefficient thresholds */
  correlationThresholds: {
    weak: number;
    moderate: number;
    strong: number;
    veryStrong: number;
  };
  /** Outlier detection thresholds */
  outlierThresholds: {
    zScoreThreshold: number;
    modifiedZScoreThreshold: number;
    iqrMultiplier: number;
  };
  /** Normality test thresholds */
  normalityThresholds: {
    shapiroWilkMinSample: number;
    shapiroWilkMaxSample: number;
    jarqueBeraThreshold: number;
    ksTestThreshold: number;
  };
}

export interface QualityConfig {
  /** Quality scoring weights */
  qualityWeights: {
    completeness: number;
    uniqueness: number;
    validity: number;
    consistency: number;
    accuracy: number;
    timeliness: number;
    integrity: number;
    reasonableness: number;
    precision: number;
    representational: number;
  };
  /** Quality thresholds */
  qualityThresholds: {
    excellent: number;
    good: number;
    fair: number;
    needsImprovement: number;
  };
  /** Duplicate detection thresholds */
  duplicateThresholds: {
    exactDuplicateThreshold: number;
    semanticSimilarityThreshold: number;
    fuzzyMatchThreshold: number;
  };
  /** Pattern validation settings */
  patternValidation: {
    maxViolationsPerPattern: number;
    maxViolationsToTrack: number;
    enableBuiltInPatterns: boolean;
  };
  /** Business rule validation settings */
  businessRules: {
    maxViolationsToTrack: number;
    enableBuiltInRules: boolean;
  };
  /** External reference validation limits */
  externalValidation: {
    maxSampleSize: number;
    maxExampleViolations: number;
  };
}

export interface AnalysisConfig {
  /** Maximum categorical levels before treating as high cardinality */
  maxCategoricalLevels: number;
  /** Maximum correlation pairs to analyze */
  maxCorrelationPairs: number;
  /** Sampling threshold for large datasets */
  samplingThreshold: number;
  /** Outlier detection methods */
  outlierMethods: string[];
  /** Normality test methods */
  normalityTests: string[];
  /** Enable multivariate analysis */
  enableMultivariate: boolean;
  /** Enabled analysis types */
  enabledAnalyses: string[];
  /** High cardinality threshold percentage */
  highCardinalityThreshold: number;
  /** Missing value threshold for quality alerts */
  missingValueQualityThreshold: number;
  /** Multivariate analysis threshold */
  multivariateThreshold: number;
  /** Maximum dimensions for PCA analysis */
  maxDimensionsForPCA: number;
  /** Clustering methods */
  clusteringMethods: string[];
}

export interface StreamingConfig {
  /** Memory threshold in MB for streaming mode */
  memoryThresholdMB: number;
  /** Maximum rows analyzed in streaming mode */
  maxRowsAnalyzed: number;
  /** Adaptive chunk sizing settings */
  adaptiveChunkSizing: {
    enabled: boolean;
    minChunkSize: number;
    maxChunkSize: number;
    reductionFactor: number;
    expansionFactor: number;
    targetMemoryUtilization: number;
  };
  /** Memory management settings */
  memoryManagement: {
    cleanupInterval: number;
    emergencyThresholdMultiplier: number;
    forceGarbageCollection: boolean;
    gcFrequency: number;
    memoryLeakDetection: boolean;
    autoGarbageCollect: boolean;
  };
}

export interface VisualizationConfig {
  /** Maximum data points for visualization */
  maxDataPoints: number;
  /** Chart effectiveness scoring weights */
  chartScoringWeights: {
    dataFit: number;
    clarity: number;
    insightPotential: number;
    accessibility: number;
  };
  /** Color palette preferences */
  colorPalettes: {
    preferColorblindSafe: boolean;
    maxColors: number;
  };
}

export interface ModelingConfig {
  /** Maximum features for automatic algorithm selection */
  maxFeaturesAutoSelection: number;
  /** Algorithm scoring weights */
  algorithmScoringWeights: {
    performance: number;
    interpretability: number;
    scalability: number;
    robustness: number;
  };
  /** Cross-validation settings */
  crossValidation: {
    defaultFolds: number;
    minSampleSize: number;
  };
  /** Feature selection thresholds */
  featureSelection: {
    correlationThreshold: number;
    importanceThreshold: number;
  };
}

export interface OutputConfig {
  /** Include visualization recommendations */
  includeVisualizationRecommendations: boolean;
  /** Include engineering insights */
  includeEngineeringInsights: boolean;
  /** Verbose output */
  verboseOutput: boolean;
  /** Progress reporting */
  progressReporting: boolean;
  /** Output format */
  format?: 'json' | 'markdown' | 'yaml';
}

// Environment-specific configuration types
export type EnvironmentMode = 'development' | 'production' | 'ci' | 'test';

export interface EnvironmentConfig {
  mode: EnvironmentMode;
  performance: Partial<PerformanceConfig>;
  statistical: Partial<StatisticalConfig>;
  quality: Partial<QualityConfig>;
  analysis: Partial<AnalysisConfig>;
  streaming: Partial<StreamingConfig>;
  visualization: Partial<VisualizationConfig>;
  modeling: Partial<ModelingConfig>;
  output: Partial<OutputConfig>;
}

// Performance Preset Types with Discriminated Unions
export type PerformancePreset =
  | { preset: 'low-memory'; maxMemoryMB: 256; maxRows: 10000; enableCache: false }
  | { preset: 'balanced'; maxMemoryMB: 1024; maxRows: 100000; enableCache: true }
  | { preset: 'high-performance'; maxMemoryMB: 4096; maxRows: 1000000; enableCache: true }
  | { preset: 'custom'; config: Partial<PerformanceConfig> };

// Configuration Validation Rules
export interface ConfigValidationRule<T> {
  field: keyof T;
  validator: (
    value: any,
    context?: any,
  ) =>
    | boolean
    | { isValid: boolean; message?: string; suggestedValue?: any; relatedFields?: string[] };
  message: string;
  required?: boolean;
  severity?: 'error' | 'warning';
}

export interface ConfigValidationSchema {
  performance: ConfigValidationRule<PerformanceConfig>[];
  statistical: ConfigValidationRule<StatisticalConfig>[];
  quality: ConfigValidationRule<QualityConfig>[];
  analysis: ConfigValidationRule<AnalysisConfig>[];
  streaming: ConfigValidationRule<StreamingConfig>[];
  visualization: ConfigValidationRule<VisualizationConfig>[];
  modeling: ConfigValidationRule<ModelingConfig>[];
}

/**
 * Complete DataPilot Configuration with Enhanced Typing
 */
export interface DataPilotConfig {
  // Core configuration sections
  performance: PerformanceConfig;
  statistical: StatisticalConfig;
  quality: QualityConfig;
  analysis: AnalysisConfig;
  streaming: StreamingConfig;
  visualization: VisualizationConfig;
  modeling: ModelingConfig;
  output: OutputConfig;

  // Environment and deployment settings
  environment?: EnvironmentConfig;

  // Feature flags for experimental features
  features?: {
    enableAdvancedMultivariate?: boolean;
    enableMLReadinessScoring?: boolean;
    enableRealTimeProcessing?: boolean;
    enableCloudIntegration?: boolean;
  };

  // Custom analyzers and extensions
  extensions?: {
    customAnalyzers?: string[];
    pluginPaths?: string[];
    externalValidators?: Record<string, string>;
  };

  // Security and privacy settings
  security?: {
    enableDataEncryption?: boolean;
    redactSensitiveData?: boolean;
    auditLogging?: boolean;
    maxFileSize?: number;
  };
}

/**
 * Default configuration values
 */
/**
 * Enhanced default configuration with comprehensive settings
 */
export const DEFAULT_CONFIG: DataPilotConfig = {
  performance: {
    maxRows: 1000000,
    maxFieldSize: 1024 * 1024, // 1MB
    memoryThresholdBytes: 1024 * 1024 * 1024, // 1GB
    chunkSize: 64 * 1024, // 64KB
    sampleSize: 1024 * 1024, // 1MB
    adaptiveChunkSizing: true,
    maxCollectedRowsMultivariate: 2000,
    batchSize: 1000,
    performanceMonitoringInterval: 10,
    memoryCleanupInterval: 20,
    emergencyMemoryThresholdMultiplier: 1.5,
  },

  statistical: {
    significanceLevel: 0.05,
    alternativeSignificanceLevels: {
      normalityTests: 0.05,
      correlationTests: 0.01,
      hypothesisTests: 0.05,
      outlierDetection: 0.01,
    },
    confidenceLevel: 0.95,
    correlationThresholds: {
      weak: 0.3,
      moderate: 0.5,
      strong: 0.7,
      veryStrong: 0.9,
    },
    outlierThresholds: {
      zScoreThreshold: 3.0,
      modifiedZScoreThreshold: 3.5,
      iqrMultiplier: 1.5,
    },
    normalityThresholds: {
      shapiroWilkMinSample: 3,
      shapiroWilkMaxSample: 5000,
      jarqueBeraThreshold: 0.05,
      ksTestThreshold: 0.05,
    },
  },

  quality: {
    qualityWeights: {
      completeness: 0.2,
      uniqueness: 0.15,
      validity: 0.2,
      consistency: 0.15,
      accuracy: 0.15,
      timeliness: 0.05,
      integrity: 0.05,
      reasonableness: 0.03,
      precision: 0.01,
      representational: 0.01,
    },
    qualityThresholds: {
      excellent: 95,
      good: 85,
      fair: 70,
      needsImprovement: 50,
    },
    duplicateThresholds: {
      exactDuplicateThreshold: 1.0,
      semanticSimilarityThreshold: 0.8,
      fuzzyMatchThreshold: 0.7,
    },
    patternValidation: {
      maxViolationsPerPattern: 100,
      maxViolationsToTrack: 1000,
      enableBuiltInPatterns: true,
    },
    businessRules: {
      maxViolationsToTrack: 1000,
      enableBuiltInRules: true,
    },
    externalValidation: {
      maxSampleSize: 1000,
      maxExampleViolations: 10,
    },
  },

  analysis: {
    maxCategoricalLevels: 50,
    maxCorrelationPairs: 50,
    samplingThreshold: 10000,
    outlierMethods: ['iqr', 'zscore', 'modified_zscore'],
    normalityTests: ['shapiro', 'jarque_bera', 'ks_test'],
    enableMultivariate: true,
    enabledAnalyses: ['univariate', 'bivariate', 'correlations'],
    highCardinalityThreshold: 80,
    missingValueQualityThreshold: 20,
    multivariateThreshold: 1000,
    maxDimensionsForPCA: 10,
    clusteringMethods: ['kmeans', 'hierarchical'],
  },

  streaming: {
    memoryThresholdMB: 100,
    maxRowsAnalyzed: 500000,
    adaptiveChunkSizing: {
      enabled: true,
      minChunkSize: 50,
      maxChunkSize: 2000,
      reductionFactor: 0.6,
      expansionFactor: 1.1,
      targetMemoryUtilization: 0.8,
    },
    memoryManagement: {
      cleanupInterval: 20,
      emergencyThresholdMultiplier: 1.5,
      forceGarbageCollection: true,
      gcFrequency: 1000,
      memoryLeakDetection: false,
      autoGarbageCollect: false,
    },
  },

  visualization: {
    maxDataPoints: 10000,
    chartScoringWeights: {
      dataFit: 0.4,
      clarity: 0.3,
      insightPotential: 0.2,
      accessibility: 0.1,
    },
    colorPalettes: {
      preferColorblindSafe: true,
      maxColors: 12,
    },
  },

  modeling: {
    maxFeaturesAutoSelection: 100,
    algorithmScoringWeights: {
      performance: 0.4,
      interpretability: 0.3,
      scalability: 0.2,
      robustness: 0.1,
    },
    crossValidation: {
      defaultFolds: 5,
      minSampleSize: 30,
    },
    featureSelection: {
      correlationThreshold: 0.95,
      importanceThreshold: 0.01,
    },
  },

  output: {
    includeVisualizationRecommendations: true,
    includeEngineeringInsights: true,
    verboseOutput: false,
    progressReporting: true,
    format: 'json',
  },

  // Environment configuration
  environment: {
    mode: 'development',
    performance: {},
    statistical: {},
    quality: {},
    analysis: {},
    streaming: {},
    visualization: {},
    modeling: {},
    output: {},
  },

  // Feature flags
  features: {
    enableAdvancedMultivariate: true,
    enableMLReadinessScoring: true,
    enableRealTimeProcessing: false,
    enableCloudIntegration: false,
  },

  // Extensions
  extensions: {
    customAnalyzers: [],
    pluginPaths: [],
    externalValidators: {},
  },

  // Security settings
  security: {
    enableDataEncryption: false,
    redactSensitiveData: true,
    auditLogging: false,
    maxFileSize: 10 * 1024 * 1024 * 1024, // 10GB
  },
};

// Re-export refactored managers
// Configuration managers temporarily disabled pending refactor

/**
 * Enhanced Configuration Manager - Refactored as Facade
 * Delegates to focused managers for single responsibility
 */
// Config managers with full method implementations
class CoreConfigManager {
  private config: DataPilotConfig;

  constructor(config?: any) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  getConfig() { return this.config; }
  getCoreConfig() { return this.config; }
  
  updateConfig(updates?: Partial<DataPilotConfig>) { 
    if (!updates) return;
    this.config = { ...this.config, ...updates }; 
  }
  
  reset() { 
    this.config = { ...DEFAULT_CONFIG }; 
  }

  getPerformanceConfig() { return JSON.parse(JSON.stringify(this.config.performance)); }
  getStatisticalConfig() { return JSON.parse(JSON.stringify(this.config.statistical)); }
  getQualityConfig() { return JSON.parse(JSON.stringify(this.config.quality)); }
  getAnalysisConfig() { return JSON.parse(JSON.stringify(this.config.analysis)); }
  getStreamingConfig() { return JSON.parse(JSON.stringify(this.config.streaming)); }
  getVisualizationConfig() { return JSON.parse(JSON.stringify(this.config.visualization)); }
  getModelingConfig() { return JSON.parse(JSON.stringify(this.config.modeling)); }
  getOutputConfig() { return JSON.parse(JSON.stringify(this.config.output)); }

  updatePerformanceConfig(updates?: Partial<PerformanceConfig>) {
    if (!updates) return;
    this.config.performance = { ...this.config.performance, ...updates };
  }

  updateStatisticalConfig(updates?: Partial<StatisticalConfig>) {
    if (!updates) return;
    this.config.statistical = { ...this.config.statistical, ...updates };
  }

  updateQualityConfig(updates?: Partial<QualityConfig>) {
    if (!updates) return;
    this.config.quality = { ...this.config.quality, ...updates };
  }

  updateAnalysisConfig(updates?: Partial<AnalysisConfig>) {
    if (!updates) return;
    this.config.analysis = { ...this.config.analysis, ...updates };
  }

  updateStreamingConfig(updates?: Partial<StreamingConfig>) {
    if (!updates) return;
    this.config.streaming = { 
      ...this.config.streaming, 
      ...updates,
      // Handle nested updates for adaptiveChunkSizing
      adaptiveChunkSizing: updates.adaptiveChunkSizing 
        ? { ...this.config.streaming.adaptiveChunkSizing, ...updates.adaptiveChunkSizing }
        : this.config.streaming.adaptiveChunkSizing
    };
  }

  updateVisualizationConfig(updates?: Partial<VisualizationConfig>) {
    if (!updates) return;
    this.config.visualization = { ...this.config.visualization, ...updates };
  }

  updateModelingConfig(updates?: Partial<ModelingConfig>) {
    if (!updates) return;
    this.config.modeling = { ...this.config.modeling, ...updates };
  }

  updateOutputConfig(updates?: Partial<OutputConfig>) {
    if (!updates) return;
    this.config.output = { ...this.config.output, ...updates };
  }
}

class EnvironmentConfigManager {
  private environment: EnvironmentMode = 'development';

  loadFromEnvironmentVariables() { return {}; }
  
  setEnvironment(env: EnvironmentMode) {
    this.environment = env;
  }

  getEnvironmentConfig(env: EnvironmentMode) {
    return {};
  }

  getPerformancePresetConfig(preset: PerformancePreset) {
    return {};
  }

  validateConfig(config: DataPilotConfig): { isValid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Performance validation
    if (config.performance.maxRows <= 0) {
      errors.push('performance.maxRows must be positive');
    }
    if (config.performance.chunkSize < 1024) {
      errors.push('performance.chunkSize must be at least 1024 bytes');
    }
    if (config.performance.memoryThresholdBytes < 256 * 1024 * 1024) {
      warnings.push('Low memory threshold may impact performance');
    }
    if (config.performance.chunkSize < 32 * 1024) {
      warnings.push('Small chunk size may impact performance, consider increasing');
    }
    if (config.performance.batchSize > config.performance.chunkSize / 64) {
      warnings.push('Batch size seems large relative to chunk size');
    }

    // Quality validation
    const qualityWeights = config.quality.qualityWeights;
    const weightSum = Object.values(qualityWeights).reduce((a, b) => a + b, 0);
    if (Math.abs(weightSum - 1.0) > 0.01) {
      errors.push('quality.qualityWeights: qualityWeights must sum to 1.0');
    }

    // Cross-section validation
    if (config.streaming.memoryThresholdMB * 1024 * 1024 > config.performance.memoryThresholdBytes) {
      warnings.push('streaming.memoryThresholdMB should not exceed performance memory threshold');
    }
    if (config.streaming.maxRowsAnalyzed > config.performance.maxRows) {
      warnings.push('streaming.maxRowsAnalyzed should not exceed performance.maxRows');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}

class RuntimeConfigManager {
  private runtimeOverrides: Partial<DataPilotConfig> = {};
  private adaptiveCache: Map<string, any> = new Map();

  private deepMerge(target: any, source: any): any {
    const result = JSON.parse(JSON.stringify(target));
    
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    
    return result;
  }

  getPresetConfig(preset: string) { 
    const presetConfigs = {
      'small': {
        performance: {
          maxRows: 10000,
        },
        streaming: {
          memoryThresholdMB: 25,
        },
        analysis: {
          enableMultivariate: false,
        },
      },
      'medium': {
        performance: {
          maxRows: 100000,
        },
        streaming: {
          memoryThresholdMB: 50,
        },
        analysis: {
          enableMultivariate: true,
        },
      },
      'large': {
        performance: {
          maxRows: 1000000,
        },
        streaming: {
          memoryThresholdMB: 100,
          adaptiveChunkSizing: {
            expansionFactor: 1.2,
          },
        },
      },
      'xlarge': {
        performance: {
          maxRows: 5000000,
        },
        streaming: {
          memoryThresholdMB: 200,
          memoryManagement: {
            cleanupInterval: 10,
          },
        },
        analysis: {
          samplingThreshold: 50000,
        },
      },
    };
    
    const presetConfig = presetConfigs[preset as keyof typeof presetConfigs];
    return presetConfig ? this.deepMerge(DEFAULT_CONFIG, presetConfig) : JSON.parse(JSON.stringify(DEFAULT_CONFIG));
  }
  
  getUseCaseConfig(useCase: string) { 
    const useCaseConfigs = {
      'data-quality': {
        quality: {
          qualityWeights: {
            completeness: 0.25,
            uniqueness: 0.15,
            validity: 0.2,
            consistency: 0.15,
            accuracy: 0.15,
            timeliness: 0.05,
            integrity: 0.05,
            reasonableness: 0.03,
            precision: 0.01,
            representational: 0.01,
          },
        },
        analysis: {
          enabledAnalyses: ['univariate'],
        },
      },
      'eda-focused': {
        analysis: {
          enableMultivariate: true,
          maxCorrelationPairs: 100,
        },
        statistical: {
          significanceLevel: 0.01,
        },
      },
      'ml-pipeline': {
        analysis: {
          enableMultivariate: true,
        },
        modeling: {
          algorithmScoringWeights: {
            performance: 0.5,
            interpretability: 0.3,
            scalability: 0.2,
            robustness: 0.0,
          },
        },
      },
      'visualization': {
        visualization: {
          maxDataPoints: 50000,
          chartScoringWeights: {
            dataFit: 0.3,
            clarity: 0.3,
            insightPotential: 0.2,
            accessibility: 0.2,
          },
        },
      },
      'quick-scan': {
        performance: {
          maxRows: 5000,
        },
        analysis: {
          enableMultivariate: false,
          maxCorrelationPairs: 10,
        },
      },
    };
    
    const useCaseConfig = useCaseConfigs[useCase as keyof typeof useCaseConfigs];
    return useCaseConfig ? this.deepMerge(DEFAULT_CONFIG, useCaseConfig) : JSON.parse(JSON.stringify(DEFAULT_CONFIG));
  }

  mergeConfigs(base: DataPilotConfig, override: DataPilotConfig): DataPilotConfig {
    return { ...base, ...override };
  }

  applyRuntimeOverrides(config: DataPilotConfig): DataPilotConfig {
    return { ...config, ...this.runtimeOverrides };
  }

  clearRuntimeOverrides() {
    this.runtimeOverrides = {};
  }

  clearAdaptiveCache() {
    this.adaptiveCache.clear();
  }

  getAdaptiveThresholds(datasetSize: number, memoryAvailable: number, config: DataPilotConfig): Partial<DataPilotConfig> {
    return {};
  }
}

export class ConfigManager {
  private static instance: ConfigManager;
  private coreConfigManager: any; // Will be CoreConfigManager
  private environmentConfigManager: any; // Will be EnvironmentConfigManager
  private runtimeConfigManager: any; // Will be RuntimeConfigManager

  private constructor(initialConfig?: Partial<DataPilotConfig>) {
    // Initialize stub managers
    this.coreConfigManager = new CoreConfigManager(initialConfig);
    this.environmentConfigManager = new EnvironmentConfigManager();
    this.runtimeConfigManager = new RuntimeConfigManager();

    // Apply environment config if specified
    if (initialConfig?.environment?.mode) {
      this.applyEnvironmentConfig(initialConfig.environment.mode);
    }
  }

  static getInstance(initialConfig?: Partial<DataPilotConfig>): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager(initialConfig);
    }
    return ConfigManager.instance;
  }


  /**
   * Apply environment-specific configuration
   */
  applyEnvironmentConfig(environment: EnvironmentMode): void {
    this.environmentConfigManager.setEnvironment(environment);
    const envConfig = this.environmentConfigManager.getEnvironmentConfig(environment);
    if (envConfig) {
      this.updateConfig(envConfig);
    }
  }

  /**
   * Apply performance preset with type safety
   */
  applyPerformancePreset(preset: PerformancePreset): void {
    const presetConfig = this.environmentConfigManager.getPerformancePresetConfig(preset);
    this.updateConfig(presetConfig);
  }

  /**
   * Get the complete configuration
   */
  getConfig(): DataPilotConfig {
    // Get core config
    const coreConfig = this.coreConfigManager.getCoreConfig();
    
    // Apply runtime overrides
    const mergedConfig = this.runtimeConfigManager.mergeConfigs(
      DEFAULT_CONFIG,
      coreConfig
    );
    
    // Apply any runtime overrides
    return this.runtimeConfigManager.applyRuntimeOverrides(mergedConfig);
  }

  /**
   * Get a specific configuration section - Delegate to CoreConfigManager
   */
  getPerformanceConfig(): PerformanceConfig {
    return this.coreConfigManager.getPerformanceConfig();
  }

  getStatisticalConfig(): StatisticalConfig {
    return this.coreConfigManager.getStatisticalConfig();
  }

  getQualityConfig(): QualityConfig {
    return this.coreConfigManager.getQualityConfig();
  }

  getAnalysisConfig(): AnalysisConfig {
    return this.coreConfigManager.getAnalysisConfig();
  }

  getStreamingConfig(): StreamingConfig {
    return this.coreConfigManager.getStreamingConfig();
  }

  getVisualizationConfig(): VisualizationConfig {
    return this.coreConfigManager.getVisualizationConfig();
  }

  getModelingConfig(): ModelingConfig {
    return this.coreConfigManager.getModelingConfig();
  }

  getOutputConfig(): OutputConfig {
    return this.coreConfigManager.getOutputConfig();
  }

  /**
   * Update configuration dynamically
   */
  updateConfig(updates?: Partial<DataPilotConfig>): void {
    if (!updates) return;
    
    // Update core config sections
    if (updates.performance) {
      this.coreConfigManager.updatePerformanceConfig(updates.performance);
    }
    if (updates.statistical) {
      this.coreConfigManager.updateStatisticalConfig(updates.statistical);
    }
    if (updates.quality) {
      this.coreConfigManager.updateQualityConfig(updates.quality);
    }
    if (updates.analysis) {
      this.coreConfigManager.updateAnalysisConfig(updates.analysis);
    }
    if (updates.streaming) {
      this.coreConfigManager.updateStreamingConfig(updates.streaming);
    }
    if (updates.visualization) {
      this.coreConfigManager.updateVisualizationConfig(updates.visualization);
    }
    if (updates.modeling) {
      this.coreConfigManager.updateModelingConfig(updates.modeling);
    }
    if (updates.output) {
      this.coreConfigManager.updateOutputConfig(updates.output);
    }
    
    // Handle environment updates
    if (updates.environment?.mode) {
      this.applyEnvironmentConfig(updates.environment.mode);
    }
  }

  /**
   * Update specific configuration sections - Delegate to CoreConfigManager
   */
  updatePerformanceConfig(updates: Partial<PerformanceConfig>): void {
    this.coreConfigManager.updatePerformanceConfig(updates);
  }

  updateStatisticalConfig(updates: Partial<StatisticalConfig>): void {
    this.coreConfigManager.updateStatisticalConfig(updates);
  }

  updateQualityConfig(updates: Partial<QualityConfig>): void {
    this.coreConfigManager.updateQualityConfig(updates);
  }

  updateAnalysisConfig(updates: Partial<AnalysisConfig>): void {
    this.coreConfigManager.updateAnalysisConfig(updates);
  }

  updateStreamingConfig(updates: Partial<StreamingConfig>): void {
    this.coreConfigManager.updateStreamingConfig(updates);
  }

  updateVisualizationConfig(updates: Partial<VisualizationConfig>): void {
    this.coreConfigManager.updateVisualizationConfig(updates);
  }

  updateModelingConfig(updates: Partial<ModelingConfig>): void {
    this.coreConfigManager.updateModelingConfig(updates);
  }

  updateOutputConfig(updates: Partial<OutputConfig>): void {
    this.coreConfigManager.updateOutputConfig(updates);
  }

  /**
   * Reset to default configuration
   */
  reset(): void {
    this.coreConfigManager.reset();
    this.runtimeConfigManager.clearRuntimeOverrides();
    this.runtimeConfigManager.clearAdaptiveCache();
  }

  /**
   * Get adaptive thresholds based on dataset characteristics - Delegate to RuntimeConfigManager
   */
  getAdaptiveThresholds(datasetSize: number, memoryAvailable: number): Partial<DataPilotConfig> {
    return this.runtimeConfigManager.getAdaptiveThresholds(
      datasetSize,
      memoryAvailable,
      this.getConfig()
    );
  }

  /**
   * Comprehensive configuration validation - Delegate to EnvironmentConfigManager
   */
  validateConfig(): { isValid: boolean; errors: string[]; warnings: string[] } {
    return this.environmentConfigManager.validateConfig(this.getConfig());
  }
}

/**
 * Convenience function to get the global config manager
 */
export function getConfig(): ConfigManager {
  return ConfigManager.getInstance();
}

/**
 * Create a configuration builder for fluent API
 */
export class ConfigBuilder {
  private config: Partial<DataPilotConfig> = {};

  static create(): ConfigBuilder {
    return new ConfigBuilder();
  }

  environment(mode: EnvironmentMode): ConfigBuilder {
    const manager = ConfigManager.getInstance();
    manager.applyEnvironmentConfig(mode);
    return this;
  }

  preset(presetName: 'small' | 'medium' | 'large' | 'xlarge'): ConfigBuilder {
    // Config manager temporarily disabled
    const runtimeManager = new RuntimeConfigManager();
    const presetConfig = runtimeManager.getPresetConfig(presetName);
    this.config = { ...this.config, ...presetConfig };
    return this;
  }

  useCase(
    useCase: 'data-quality' | 'eda-focused' | 'ml-pipeline' | 'visualization' | 'quick-scan',
  ): ConfigBuilder {
    // Config manager temporarily disabled
    const runtimeManager = new RuntimeConfigManager();
    const useCaseConfig = runtimeManager.getUseCaseConfig(useCase);
    this.config = { ...this.config, ...useCaseConfig };
    return this;
  }

  performance(config: Partial<PerformanceConfig>): ConfigBuilder {
    this.config.performance = { ...this.config.performance, ...config };
    return this;
  }

  statistical(config: Partial<StatisticalConfig>): ConfigBuilder {
    this.config.statistical = { ...this.config.statistical, ...config };
    return this;
  }

  quality(config: Partial<QualityConfig>): ConfigBuilder {
    this.config.quality = { ...this.config.quality, ...config };
    return this;
  }

  build(): DataPilotConfig {
    const manager = ConfigManager.getInstance(this.config);
    const validation = manager.validateConfig();

    if (!validation.isValid) {
      throw new Error(`Configuration validation failed: ${validation.errors.join(', ')}`);
    }

    if (validation.warnings.length > 0) {
      console.warn('Configuration warnings:', validation.warnings);
    }

    return manager.getConfig();
  }
}

/**
 * Type-safe configuration factory functions
 */
export const ConfigFactory = {
  development: () => ConfigBuilder.create().environment('development'),
  production: () => ConfigBuilder.create().environment('production'),
  ci: () => ConfigBuilder.create().environment('ci'),
  test: () => ConfigBuilder.create().environment('test'),

  small: () => ConfigBuilder.create().preset('small'),
  medium: () => ConfigBuilder.create().preset('medium'),
  large: () => ConfigBuilder.create().preset('large'),
  xlarge: () => ConfigBuilder.create().preset('xlarge'),

  dataQuality: () => ConfigBuilder.create().useCase('data-quality'),
  eda: () => ConfigBuilder.create().useCase('eda-focused'),
  ml: () => ConfigBuilder.create().useCase('ml-pipeline'),
  visualization: () => ConfigBuilder.create().useCase('visualization'),
  quickScan: () => ConfigBuilder.create().useCase('quick-scan'),
};

/**
 * Enhanced environment-based configuration loading with validation
 */
export function loadConfigFromEnvironment(): Partial<DataPilotConfig> {
    // Config manager temporarily disabled
  const envManager = new EnvironmentConfigManager();
  return envManager.loadFromEnvironmentVariables();
}

/**
 * Enhanced dataset size-based configuration presets
 */
export function getPresetConfig(
  presetName: 'small' | 'medium' | 'large' | 'xlarge',
): Partial<DataPilotConfig> {
    // Config manager temporarily disabled
  const runtimeManager = new RuntimeConfigManager();
  return runtimeManager.getPresetConfig(presetName);
}

/**
 * Create configuration for specific use cases
 */
export function getUseCaseConfig(
  useCase: 'data-quality' | 'eda-focused' | 'ml-pipeline' | 'visualization' | 'quick-scan',
): Partial<DataPilotConfig> {
    // Config manager temporarily disabled
  const runtimeManager = new RuntimeConfigManager();
  return runtimeManager.getUseCaseConfig(useCase);
}
