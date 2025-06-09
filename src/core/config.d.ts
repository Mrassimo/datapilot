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
export type PerformancePreset = {
    preset: 'low-memory';
    maxMemoryMB: 256;
    maxRows: 10000;
    enableCache: false;
} | {
    preset: 'balanced';
    maxMemoryMB: 1024;
    maxRows: 100000;
    enableCache: true;
} | {
    preset: 'high-performance';
    maxMemoryMB: 4096;
    maxRows: 1000000;
    enableCache: true;
} | {
    preset: 'custom';
    config: Partial<PerformanceConfig>;
};
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
    performance: PerformanceConfig;
    statistical: StatisticalConfig;
    quality: QualityConfig;
    analysis: AnalysisConfig;
    streaming: StreamingConfig;
    visualization: VisualizationConfig;
    modeling: ModelingConfig;
    environment?: EnvironmentConfig;
    features?: {
        enableAdvancedMultivariate?: boolean;
        enableMLReadinessScoring?: boolean;
        enableRealTimeProcessing?: boolean;
        enableCloudIntegration?: boolean;
    };
    extensions?: {
        customAnalyzers?: string[];
        pluginPaths?: string[];
        externalValidators?: Record<string, string>;
    };
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
export declare const DEFAULT_CONFIG: DataPilotConfig;
/**
 * Enhanced Configuration Manager with Type Safety and Validation
 */
export declare class ConfigManager {
    private static instance;
    private config;
    private validationSchema;
    private environmentOverrides;
    private constructor();
    static getInstance(initialConfig?: Partial<DataPilotConfig>): ConfigManager;
    /**
     * Initialize environment-specific configuration overrides
     */
    private initializeEnvironmentOverrides;
    /**
     * Apply environment-specific configuration
     */
    applyEnvironmentConfig(environment: EnvironmentMode): void;
    /**
     * Apply performance preset with type safety
     */
    applyPerformancePreset(preset: PerformancePreset): void;
    /**
     * Create comprehensive validation schema
     */
    private createValidationSchema;
    /**
     * Get the complete configuration
     */
    getConfig(): DataPilotConfig;
    /**
     * Get a specific configuration section
     */
    getPerformanceConfig(): PerformanceConfig;
    getStatisticalConfig(): StatisticalConfig;
    getQualityConfig(): QualityConfig;
    getAnalysisConfig(): AnalysisConfig;
    getStreamingConfig(): StreamingConfig;
    getVisualizationConfig(): VisualizationConfig;
    getModelingConfig(): ModelingConfig;
    /**
     * Update configuration dynamically
     */
    updateConfig(updates: Partial<DataPilotConfig>): void;
    /**
     * Update a specific configuration section
     */
    updatePerformanceConfig(updates: Partial<PerformanceConfig>): void;
    updateStatisticalConfig(updates: Partial<StatisticalConfig>): void;
    updateQualityConfig(updates: Partial<QualityConfig>): void;
    updateAnalysisConfig(updates: Partial<AnalysisConfig>): void;
    updateStreamingConfig(updates: Partial<StreamingConfig>): void;
    updateVisualizationConfig(updates: Partial<VisualizationConfig>): void;
    updateModelingConfig(updates: Partial<ModelingConfig>): void;
    /**
     * Reset to default configuration
     */
    reset(): void;
    /**
     * Get adaptive thresholds based on dataset characteristics
     */
    getAdaptiveThresholds(datasetSize: number, memoryAvailable: number): Partial<DataPilotConfig>;
    /**
     * Merge configurations with deep object merging
     */
    private mergeConfig;
    /**
     * Comprehensive configuration validation using schema
     */
    validateConfig(): {
        isValid: boolean;
        errors: string[];
        warnings: string[];
    };
    /**
     * Validate consistency across configuration sections
     */
    private validateCrossSectionConsistency;
    /**
     * Validate performance settings and provide recommendations
     */
    private validatePerformanceSettings;
}
/**
 * Convenience function to get the global config manager
 */
export declare function getConfig(): ConfigManager;
/**
 * Create a configuration builder for fluent API
 */
export declare class ConfigBuilder {
    private config;
    static create(): ConfigBuilder;
    environment(mode: EnvironmentMode): ConfigBuilder;
    preset(presetName: 'small' | 'medium' | 'large' | 'xlarge'): ConfigBuilder;
    useCase(useCase: 'data-quality' | 'eda-focused' | 'ml-pipeline' | 'visualization' | 'quick-scan'): ConfigBuilder;
    performance(config: Partial<PerformanceConfig>): ConfigBuilder;
    statistical(config: Partial<StatisticalConfig>): ConfigBuilder;
    quality(config: Partial<QualityConfig>): ConfigBuilder;
    build(): DataPilotConfig;
}
/**
 * Type-safe configuration factory functions
 */
export declare const ConfigFactory: {
    development: () => ConfigBuilder;
    production: () => ConfigBuilder;
    ci: () => ConfigBuilder;
    test: () => ConfigBuilder;
    small: () => ConfigBuilder;
    medium: () => ConfigBuilder;
    large: () => ConfigBuilder;
    xlarge: () => ConfigBuilder;
    dataQuality: () => ConfigBuilder;
    eda: () => ConfigBuilder;
    ml: () => ConfigBuilder;
    visualization: () => ConfigBuilder;
    quickScan: () => ConfigBuilder;
};
/**
 * Enhanced environment-based configuration loading with validation
 */
export declare function loadConfigFromEnvironment(): Partial<DataPilotConfig>;
/**
 * Enhanced dataset size-based configuration presets with type safety
 */
export declare function getPresetConfig(presetName: 'small' | 'medium' | 'large' | 'xlarge'): Partial<DataPilotConfig>;
/**
 * Create configuration for specific use cases
 */
export declare function getUseCaseConfig(useCase: 'data-quality' | 'eda-focused' | 'ml-pipeline' | 'visualization' | 'quick-scan'): Partial<DataPilotConfig>;
//# sourceMappingURL=config.d.ts.map