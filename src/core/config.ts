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
  validator: (value: any) => boolean;
  message: string;
  required?: boolean;
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

/**
 * Enhanced Configuration Manager with Type Safety and Validation
 */
export class ConfigManager {
  private static instance: ConfigManager;
  private config: DataPilotConfig;
  private validationSchema: ConfigValidationSchema;
  private environmentOverrides: Map<EnvironmentMode, Partial<DataPilotConfig>>;

  private constructor(initialConfig?: Partial<DataPilotConfig>) {
    this.config = this.mergeConfig(initialConfig);
    this.validationSchema = this.createValidationSchema();
    this.environmentOverrides = new Map();
    this.initializeEnvironmentOverrides();
  }

  static getInstance(initialConfig?: Partial<DataPilotConfig>): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager(initialConfig);
    }
    return ConfigManager.instance;
  }

  /**
   * Initialize environment-specific configuration overrides
   */
  private initializeEnvironmentOverrides(): void {
    // Development environment - more verbose, smaller limits
    this.environmentOverrides.set('development', {
      performance: {
        maxRows: 50000,
        memoryThresholdBytes: 512 * 1024 * 1024, // 512MB
      },
      streaming: {
        memoryThresholdMB: 50,
        maxRowsAnalyzed: 50000,
      },
    });

    // Production environment - optimized for performance
    this.environmentOverrides.set('production', {
      performance: {
        maxRows: 2000000,
        memoryThresholdBytes: 4 * 1024 * 1024 * 1024, // 4GB
        adaptiveChunkSizing: true,
      },
      streaming: {
        memoryThresholdMB: 500,
        maxRowsAnalyzed: 2000000,
      },
    });

    // CI environment - fast and minimal
    this.environmentOverrides.set('ci', {
      performance: {
        maxRows: 10000,
        memoryThresholdBytes: 256 * 1024 * 1024, // 256MB
      },
      analysis: {
        enableMultivariate: false,
      },
    });

    // Test environment - predictable and limited
    this.environmentOverrides.set('test', {
      performance: {
        maxRows: 1000,
        memoryThresholdBytes: 128 * 1024 * 1024, // 128MB
      },
      statistical: {
        significanceLevel: 0.1, // Less strict for testing
      },
    });
  }

  /**
   * Apply environment-specific configuration
   */
  applyEnvironmentConfig(environment: EnvironmentMode): void {
    const envOverrides = this.environmentOverrides.get(environment);
    if (envOverrides) {
      this.config = this.mergeConfig(envOverrides);
    }
  }

  /**
   * Apply performance preset with type safety
   */
  applyPerformancePreset(preset: PerformancePreset): void {
    switch (preset.preset) {
      case 'low-memory':
        this.updatePerformanceConfig({
          maxRows: preset.maxRows,
          memoryThresholdBytes: preset.maxMemoryMB * 1024 * 1024,
          adaptiveChunkSizing: false,
        });
        this.updateStreamingConfig({
          memoryThresholdMB: preset.maxMemoryMB / 4,
          maxRowsAnalyzed: preset.maxRows,
        });
        break;
      
      case 'balanced':
        this.updatePerformanceConfig({
          maxRows: preset.maxRows,
          memoryThresholdBytes: preset.maxMemoryMB * 1024 * 1024,
          adaptiveChunkSizing: true,
        });
        break;
      
      case 'high-performance':
        this.updatePerformanceConfig({
          maxRows: preset.maxRows,
          memoryThresholdBytes: preset.maxMemoryMB * 1024 * 1024,
          adaptiveChunkSizing: true,
          batchSize: 5000,
        });
        break;
      
      case 'custom':
        this.updatePerformanceConfig(preset.config);
        break;
    }
  }

  /**
   * Create comprehensive validation schema
   */
  private createValidationSchema(): ConfigValidationSchema {
    return {
      performance: [
        {
          field: 'maxRows',
          validator: (value) => typeof value === 'number' && value > 0,
          message: 'maxRows must be a positive number',
          required: true,
        },
        {
          field: 'memoryThresholdBytes',
          validator: (value) => typeof value === 'number' && value > 0,
          message: 'memoryThresholdBytes must be a positive number',
          required: true,
        },
        {
          field: 'chunkSize',
          validator: (value) => typeof value === 'number' && value >= 1024,
          message: 'chunkSize must be at least 1024 bytes',
        },
      ],
      statistical: [
        {
          field: 'significanceLevel',
          validator: (value) => typeof value === 'number' && value > 0 && value < 1,
          message: 'significanceLevel must be between 0 and 1',
          required: true,
        },
        {
          field: 'confidenceLevel',
          validator: (value) => typeof value === 'number' && value > 0 && value < 1,
          message: 'confidenceLevel must be between 0 and 1',
          required: true,
        },
      ],
      quality: [
        {
          field: 'qualityWeights',
          validator: (weights) => {
            if (typeof weights !== 'object') return false;
            const sum = Object.values(weights).reduce((a, b) => a + b, 0);
            return Math.abs(sum - 1.0) < 0.01;
          },
          message: 'qualityWeights must sum to 1.0',
          required: true,
        },
      ],
      analysis: [
        {
          field: 'maxCategoricalLevels',
          validator: (value) => typeof value === 'number' && value > 0,
          message: 'maxCategoricalLevels must be a positive number',
        },
      ],
      streaming: [
        {
          field: 'memoryThresholdMB',
          validator: (value) => typeof value === 'number' && value > 0,
          message: 'memoryThresholdMB must be a positive number',
        },
      ],
      visualization: [
        {
          field: 'maxDataPoints',
          validator: (value) => typeof value === 'number' && value > 0,
          message: 'maxDataPoints must be a positive number',
        },
      ],
      modeling: [
        {
          field: 'maxFeaturesAutoSelection',
          validator: (value, context) => {
            if (typeof value !== 'number' || value <= 0) {
              return { isValid: false, message: 'maxFeaturesAutoSelection must be a positive number' };
            }
            
            // Warn about very large feature counts
            if (value > 1000) {
              return {
                isValid: true,
                message: 'Very large feature count may impact performance and interpretability',
              };
            }
            
            return { isValid: true };
          },
          message: 'maxFeaturesAutoSelection must be a positive number',
          severity: 'warning',
        },
      ],
      
      // Additional validation sections with enhanced rules
      streaming: [
        {
          field: 'memoryThresholdMB',
          validator: (value, context) => {
            if (typeof value !== 'number' || value <= 0) {
              return { isValid: false, message: 'memoryThresholdMB must be a positive number' };
            }
            
            // Check consistency with performance memory settings
            const perfMemoryMB = context?.fullConfig.performance.memoryThresholdBytes ? 
              context.fullConfig.performance.memoryThresholdBytes / (1024 * 1024) : null;
            
            if (perfMemoryMB && value > perfMemoryMB) {
              return {
                isValid: false,
                message: 'streaming.memoryThresholdMB should not exceed performance memory threshold',
                suggestedValue: Math.floor(perfMemoryMB * 0.8),
                relatedFields: ['performance.memoryThresholdBytes'],
              };
            }
            
            return { isValid: true };
          },
          message: 'memoryThresholdMB must be a positive number',
          severity: 'warning',
          dependencies: ['performance'],
        },
      ],
    };
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
    if (memoryAvailable < 512 * 1024 * 1024) {
      // Less than 512MB
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
   * Comprehensive configuration validation using schema
   */
  validateConfig(): { isValid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate each section using the schema
    for (const [sectionName, rules] of Object.entries(this.validationSchema)) {
      const sectionConfig = this.config[sectionName as keyof DataPilotConfig];
      
      for (const rule of rules) {
        const fieldValue = (sectionConfig as any)[rule.field];
        
        // Check required fields
        if (rule.required && (fieldValue === undefined || fieldValue === null)) {
          errors.push(`${sectionName}.${String(rule.field)} is required`);
          continue;
        }
        
        // Skip validation if field is not present and not required
        if (fieldValue === undefined || fieldValue === null) {
          continue;
        }
        
        // Run the validator
        if (!rule.validator(fieldValue)) {
          errors.push(`${sectionName}.${String(rule.field)}: ${rule.message}`);
        }
      }
    }

    // Additional cross-section validation
    this.validateCrossSectionConsistency(errors, warnings);

    // Performance warnings
    this.validatePerformanceSettings(warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate consistency across configuration sections
   */
  private validateCrossSectionConsistency(errors: string[], warnings: string[]): void {
    // Check memory consistency
    const performanceMemoryMB = this.config.performance.memoryThresholdBytes / (1024 * 1024);
    const streamingMemoryMB = this.config.streaming.memoryThresholdMB;
    
    if (streamingMemoryMB > performanceMemoryMB) {
      warnings.push('streaming.memoryThresholdMB should not exceed performance memory threshold');
    }

    // Check row count consistency
    if (this.config.streaming.maxRowsAnalyzed > this.config.performance.maxRows) {
      warnings.push('streaming.maxRowsAnalyzed should not exceed performance.maxRows');
    }

    // Check significance levels are reasonable
    const baseLevel = this.config.statistical.significanceLevel;
    const altLevels = this.config.statistical.alternativeSignificanceLevels;
    
    if (altLevels.correlationTests < baseLevel) {
      warnings.push('correlationTests significance level is more strict than base level');
    }
  }

  /**
   * Validate performance settings and provide recommendations
   */
  private validatePerformanceSettings(warnings: string[]): void {
    const perf = this.config.performance;
    
    // Check for potential memory issues
    if (perf.memoryThresholdBytes < 256 * 1024 * 1024) { // Less than 256MB
      warnings.push('Memory threshold is quite low, consider increasing for better performance');
    }
    
    // Check chunk size efficiency
    if (perf.chunkSize < 32 * 1024) { // Less than 32KB
      warnings.push('Small chunk size may impact performance, consider increasing');
    }
    
    // Check batch size consistency
    if (perf.batchSize > perf.chunkSize / 100) {
      warnings.push('Batch size seems large relative to chunk size');
    }
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
    const presetConfig = getPresetConfig(presetName);
    this.config = { ...this.config, ...presetConfig };
    return this;
  }

  useCase(useCase: 'data-quality' | 'eda-focused' | 'ml-pipeline' | 'visualization' | 'quick-scan'): ConfigBuilder {
    const useCaseConfig = getUseCaseConfig(useCase);
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
  const envConfig: Partial<DataPilotConfig> = {};

  // Performance settings
  if (process.env.DATAPILOT_MAX_ROWS) {
    const maxRows = parseInt(process.env.DATAPILOT_MAX_ROWS, 10);
    if (!isNaN(maxRows) && maxRows > 0) {
      envConfig.performance = {
        ...envConfig.performance,
        maxRows,
      };
    }
  }

  if (process.env.DATAPILOT_MEMORY_THRESHOLD_MB) {
    const memoryMB = parseInt(process.env.DATAPILOT_MEMORY_THRESHOLD_MB, 10);
    if (!isNaN(memoryMB) && memoryMB > 0) {
      envConfig.performance = {
        ...envConfig.performance,
        memoryThresholdBytes: memoryMB * 1024 * 1024,
      };
      envConfig.streaming = {
        ...envConfig.streaming,
        memoryThresholdMB: memoryMB,
      };
    }
  }

  // Statistical settings
  if (process.env.DATAPILOT_SIGNIFICANCE_LEVEL) {
    const sigLevel = parseFloat(process.env.DATAPILOT_SIGNIFICANCE_LEVEL);
    if (!isNaN(sigLevel) && sigLevel > 0 && sigLevel < 1) {
      envConfig.statistical = {
        ...envConfig.statistical,
        significanceLevel: sigLevel,
      };
    }
  }

  // Feature flags
  if (process.env.DATAPILOT_ENABLE_MULTIVARIATE) {
    const enabled = process.env.DATAPILOT_ENABLE_MULTIVARIATE.toLowerCase() === 'true';
    envConfig.analysis = {
      ...envConfig.analysis,
      enableMultivariate: enabled,
    };
  }

  // Security settings
  if (process.env.DATAPILOT_MAX_FILE_SIZE_MB) {
    const maxFileSizeMB = parseInt(process.env.DATAPILOT_MAX_FILE_SIZE_MB, 10);
    if (!isNaN(maxFileSizeMB) && maxFileSizeMB > 0) {
      envConfig.security = {
        ...envConfig.security,
        maxFileSize: maxFileSizeMB * 1024 * 1024,
      };
    }
  }

  // Preset selection
  if (process.env.DATAPILOT_PRESET) {
    const preset = process.env.DATAPILOT_PRESET as 'small' | 'medium' | 'large' | 'xlarge';
    if (['small', 'medium', 'large', 'xlarge'].includes(preset)) {
      const presetConfig = getPresetConfig(preset);
      Object.assign(envConfig, presetConfig);
    }
  }

  return envConfig;
}

/**
 * Enhanced dataset size-based configuration presets with type safety
 */
export function getPresetConfig(
  presetName: 'small' | 'medium' | 'large' | 'xlarge',
): Partial<DataPilotConfig> {
  const presets: Record<string, Partial<DataPilotConfig>> = {
    small: {
      performance: {
        ...DEFAULT_CONFIG.performance,
        maxRows: 10000,
        chunkSize: 16 * 1024,
        batchSize: 100,
        maxCollectedRowsMultivariate: 500,
      },
      streaming: {
        ...DEFAULT_CONFIG.streaming,
        memoryThresholdMB: 25,
        maxRowsAnalyzed: 10000,
        adaptiveChunkSizing: {
          ...DEFAULT_CONFIG.streaming.adaptiveChunkSizing,
          maxChunkSize: 500,
        },
      },
      analysis: {
        ...DEFAULT_CONFIG.analysis,
        enableMultivariate: false, // Disable for small datasets
        maxCorrelationPairs: 25,
      },
    },
    medium: {
      performance: {
        ...DEFAULT_CONFIG.performance,
        maxRows: 100000,
        chunkSize: 32 * 1024,
        batchSize: 500,
        maxCollectedRowsMultivariate: 1000,
      },
      streaming: {
        ...DEFAULT_CONFIG.streaming,
        memoryThresholdMB: 50,
        maxRowsAnalyzed: 100000,
      },
      analysis: {
        ...DEFAULT_CONFIG.analysis,
        enableMultivariate: true,
        maxCorrelationPairs: 50,
      },
    },
    large: {
      performance: {
        ...DEFAULT_CONFIG.performance,
        maxRows: 1000000,
        chunkSize: 64 * 1024,
        batchSize: 1000,
        maxCollectedRowsMultivariate: 2000,
      },
      streaming: {
        ...DEFAULT_CONFIG.streaming,
        memoryThresholdMB: 100,
        maxRowsAnalyzed: 500000,
        adaptiveChunkSizing: {
          ...DEFAULT_CONFIG.streaming.adaptiveChunkSizing,
          enabled: true,
          expansionFactor: 1.2, // More aggressive for large datasets
        },
      },
      analysis: {
        ...DEFAULT_CONFIG.analysis,
        enableMultivariate: true,
        maxCorrelationPairs: 75,
      },
    },
    xlarge: {
      performance: {
        ...DEFAULT_CONFIG.performance,
        maxRows: 5000000,
        chunkSize: 128 * 1024,
        batchSize: 2000,
        maxCollectedRowsMultivariate: 3000,
        emergencyMemoryThresholdMultiplier: 2.0, // More headroom
      },
      streaming: {
        ...DEFAULT_CONFIG.streaming,
        memoryThresholdMB: 200,
        maxRowsAnalyzed: 1000000,
        adaptiveChunkSizing: {
          ...DEFAULT_CONFIG.streaming.adaptiveChunkSizing,
          enabled: true,
          maxChunkSize: 5000,
          expansionFactor: 1.3,
        },
        memoryManagement: {
          ...DEFAULT_CONFIG.streaming.memoryManagement,
          cleanupInterval: 10, // More frequent cleanup
          forceGarbageCollection: true,
        },
      },
      analysis: {
        ...DEFAULT_CONFIG.analysis,
        enableMultivariate: true,
        maxCorrelationPairs: 100,
        samplingThreshold: 50000, // Use sampling for very large datasets
      },
    },
  };

  return presets[presetName];
}

/**
 * Create configuration for specific use cases
 */
export function getUseCaseConfig(
  useCase: 'data-quality' | 'eda-focused' | 'ml-pipeline' | 'visualization' | 'quick-scan'
): Partial<DataPilotConfig> {
  const useCaseConfigs: Record<string, Partial<DataPilotConfig>> = {
    'data-quality': {
      quality: {
        ...DEFAULT_CONFIG.quality,
        qualityWeights: {
          completeness: 0.25,
          uniqueness: 0.20,
          validity: 0.25,
          consistency: 0.20,
          accuracy: 0.10,
          timeliness: 0.0,
          integrity: 0.0,
          reasonableness: 0.0,
          precision: 0.0,
          representational: 0.0,
        },
      },
      analysis: {
        ...DEFAULT_CONFIG.analysis,
        enabledAnalyses: ['univariate'], // Focus on quality, not complex analysis
      },
    },
    'eda-focused': {
      analysis: {
        ...DEFAULT_CONFIG.analysis,
        enableMultivariate: true,
        enabledAnalyses: ['univariate', 'bivariate', 'correlations'],
        maxCorrelationPairs: 100,
      },
      statistical: {
        ...DEFAULT_CONFIG.statistical,
        significanceLevel: 0.01, // More stringent for EDA
      },
    },
    'ml-pipeline': {
      analysis: {
        ...DEFAULT_CONFIG.analysis,
        enableMultivariate: true,
        enabledAnalyses: ['univariate', 'bivariate', 'correlations'],
      },
      modeling: {
        ...DEFAULT_CONFIG.modeling,
        algorithmScoringWeights: {
          performance: 0.5,
          interpretability: 0.2,
          scalability: 0.2,
          robustness: 0.1,
        },
      },
    },
    'visualization': {
      visualization: {
        ...DEFAULT_CONFIG.visualization,
        maxDataPoints: 50000, // More points for rich visualizations
        chartScoringWeights: {
          dataFit: 0.3,
          clarity: 0.3,
          insightPotential: 0.3,
          accessibility: 0.1,
        },
      },
    },
    'quick-scan': {
      performance: {
        ...DEFAULT_CONFIG.performance,
        maxRows: 5000,
        maxCollectedRowsMultivariate: 200,
      },
      analysis: {
        ...DEFAULT_CONFIG.analysis,
        enableMultivariate: false,
        enabledAnalyses: ['univariate'],
        maxCorrelationPairs: 10,
      },
    },
  };

  return useCaseConfigs[useCase];
}
