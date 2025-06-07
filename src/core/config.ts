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
  };
  /** Memory management settings */
  memoryManagement: {
    cleanupInterval: number;
    emergencyThresholdMultiplier: number;
    forceGarbageCollection: boolean;
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

/**
 * Complete DataPilot Configuration
 */
export interface DataPilotConfig {
  performance: PerformanceConfig;
  statistical: StatisticalConfig;
  quality: QualityConfig;
  analysis: AnalysisConfig;
  streaming: StreamingConfig;
  visualization: VisualizationConfig;
  modeling: ModelingConfig;
}

/**
 * Default configuration values
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
    },
    memoryManagement: {
      cleanupInterval: 20,
      emergencyThresholdMultiplier: 1.5,
      forceGarbageCollection: true,
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
};

/**
 * Configuration Manager
 */
export class ConfigManager {
  private static instance: ConfigManager;
  private config: DataPilotConfig;

  private constructor(initialConfig?: Partial<DataPilotConfig>) {
    this.config = this.mergeConfig(initialConfig);
  }

  static getInstance(initialConfig?: Partial<DataPilotConfig>): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager(initialConfig);
    }
    return ConfigManager.instance;
  }

  /**
   * Get the complete configuration
   */
  getConfig(): DataPilotConfig {
    return { ...this.config };
  }

  /**
   * Get a specific configuration section
   */
  getPerformanceConfig(): PerformanceConfig {
    return { ...this.config.performance };
  }

  getStatisticalConfig(): StatisticalConfig {
    return { ...this.config.statistical };
  }

  getQualityConfig(): QualityConfig {
    return { ...this.config.quality };
  }

  getAnalysisConfig(): AnalysisConfig {
    return { ...this.config.analysis };
  }

  getStreamingConfig(): StreamingConfig {
    return { ...this.config.streaming };
  }

  getVisualizationConfig(): VisualizationConfig {
    return { ...this.config.visualization };
  }

  getModelingConfig(): ModelingConfig {
    return { ...this.config.modeling };
  }

  /**
   * Update configuration dynamically
   */
  updateConfig(updates: Partial<DataPilotConfig>): void {
    this.config = this.mergeConfig(updates);
  }

  /**
   * Update a specific configuration section
   */
  updatePerformanceConfig(updates: Partial<PerformanceConfig>): void {
    this.config.performance = { ...this.config.performance, ...updates };
  }

  updateStatisticalConfig(updates: Partial<StatisticalConfig>): void {
    this.config.statistical = { ...this.config.statistical, ...updates };
  }

  updateQualityConfig(updates: Partial<QualityConfig>): void {
    this.config.quality = { ...this.config.quality, ...updates };
  }

  updateAnalysisConfig(updates: Partial<AnalysisConfig>): void {
    this.config.analysis = { ...this.config.analysis, ...updates };
  }

  updateStreamingConfig(updates: Partial<StreamingConfig>): void {
    this.config.streaming = { ...this.config.streaming, ...updates };
  }

  updateVisualizationConfig(updates: Partial<VisualizationConfig>): void {
    this.config.visualization = { ...this.config.visualization, ...updates };
  }

  updateModelingConfig(updates: Partial<ModelingConfig>): void {
    this.config.modeling = { ...this.config.modeling, ...updates };
  }

  /**
   * Reset to default configuration
   */
  reset(): void {
    this.config = { ...DEFAULT_CONFIG };
  }

  /**
   * Get adaptive thresholds based on dataset characteristics
   */
  getAdaptiveThresholds(datasetSize: number, memoryAvailable: number): Partial<DataPilotConfig> {
    const adaptiveConfig: Partial<DataPilotConfig> = {};

    // Adaptive performance settings based on dataset size
    if (datasetSize > 1000000) {
      adaptiveConfig.performance = {
        ...this.config.performance,
        maxRows: Math.min(datasetSize, 2000000),
        chunkSize: 128 * 1024, // Larger chunks for big datasets
        batchSize: 2000,
      };
    } else if (datasetSize < 10000) {
      adaptiveConfig.performance = {
        ...this.config.performance,
        chunkSize: 16 * 1024, // Smaller chunks for small datasets
        batchSize: 100,
      };
    }

    // Adaptive memory settings based on available memory
    if (memoryAvailable < 512 * 1024 * 1024) { // Less than 512MB
      adaptiveConfig.streaming = {
        ...this.config.streaming,
        memoryThresholdMB: 50,
        maxRowsAnalyzed: 100000,
        adaptiveChunkSizing: {
          ...this.config.streaming.adaptiveChunkSizing,
          maxChunkSize: 500,
        },
      };
      adaptiveConfig.performance = {
        ...this.config.performance,
        maxCollectedRowsMultivariate: 500,
      };
    }

    return adaptiveConfig;
  }

  /**
   * Merge configurations with deep object merging
   */
  private mergeConfig(updates?: Partial<DataPilotConfig>): DataPilotConfig {
    if (!updates) {
      return { ...DEFAULT_CONFIG };
    }

    const merged = { ...DEFAULT_CONFIG };

    Object.keys(updates).forEach((key) => {
      const section = key as keyof DataPilotConfig;
      if (updates[section] && typeof updates[section] === 'object') {
        merged[section] = { ...merged[section], ...updates[section] };
      }
    });

    return merged;
  }

  /**
   * Validate configuration values
   */
  validateConfig(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate performance config
    if (this.config.performance.maxRows <= 0) {
      errors.push('performance.maxRows must be greater than 0');
    }
    if (this.config.performance.memoryThresholdBytes <= 0) {
      errors.push('performance.memoryThresholdBytes must be greater than 0');
    }

    // Validate statistical config
    if (this.config.statistical.significanceLevel <= 0 || this.config.statistical.significanceLevel >= 1) {
      errors.push('statistical.significanceLevel must be between 0 and 1');
    }

    // Validate quality weights sum to 1
    const weightsSum = Object.values(this.config.quality.qualityWeights).reduce((sum, weight) => sum + weight, 0);
    if (Math.abs(weightsSum - 1.0) > 0.01) {
      errors.push('quality.qualityWeights must sum to 1.0');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

/**
 * Convenience function to get the global config manager
 */
export function getConfig(): ConfigManager {
  return ConfigManager.getInstance();
}

/**
 * Environment-based configuration loading
 */
export function loadConfigFromEnvironment(): Partial<DataPilotConfig> {
  const envConfig: Partial<DataPilotConfig> = {};

  // Load from environment variables
  if (process.env.DATAPILOT_MAX_ROWS) {
    envConfig.performance = {
      ...DEFAULT_CONFIG.performance,
      maxRows: parseInt(process.env.DATAPILOT_MAX_ROWS, 10),
    };
  }

  if (process.env.DATAPILOT_MEMORY_THRESHOLD_MB) {
    envConfig.streaming = {
      ...DEFAULT_CONFIG.streaming,
      memoryThresholdMB: parseInt(process.env.DATAPILOT_MEMORY_THRESHOLD_MB, 10),
    };
  }

  if (process.env.DATAPILOT_SIGNIFICANCE_LEVEL) {
    envConfig.statistical = {
      ...DEFAULT_CONFIG.statistical,
      significanceLevel: parseFloat(process.env.DATAPILOT_SIGNIFICANCE_LEVEL),
    };
  }

  return envConfig;
}

/**
 * Dataset size-based configuration presets
 */
export function getPresetConfig(presetName: 'small' | 'medium' | 'large' | 'xlarge'): Partial<DataPilotConfig> {
  const presets = {
    small: {
      performance: {
        ...DEFAULT_CONFIG.performance,
        maxRows: 10000,
        chunkSize: 16 * 1024,
        batchSize: 100,
      },
      streaming: {
        ...DEFAULT_CONFIG.streaming,
        memoryThresholdMB: 25,
        maxRowsAnalyzed: 10000,
      },
    },
    medium: {
      performance: {
        ...DEFAULT_CONFIG.performance,
        maxRows: 100000,
        chunkSize: 32 * 1024,
        batchSize: 500,
      },
      streaming: {
        ...DEFAULT_CONFIG.streaming,
        memoryThresholdMB: 50,
        maxRowsAnalyzed: 100000,
      },
    },
    large: {
      performance: {
        ...DEFAULT_CONFIG.performance,
        maxRows: 1000000,
        chunkSize: 64 * 1024,
        batchSize: 1000,
      },
      streaming: {
        ...DEFAULT_CONFIG.streaming,
        memoryThresholdMB: 100,
        maxRowsAnalyzed: 500000,
      },
    },
    xlarge: {
      performance: {
        ...DEFAULT_CONFIG.performance,
        maxRows: 5000000,
        chunkSize: 128 * 1024,
        batchSize: 2000,
      },
      streaming: {
        ...DEFAULT_CONFIG.streaming,
        memoryThresholdMB: 200,
        maxRowsAnalyzed: 1000000,
      },
    },
  };

  return presets[presetName];
}