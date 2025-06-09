"use strict";
/**
 * DataPilot Configuration System
 * Centralized configuration management for all hardcoded values and thresholds
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigFactory = exports.ConfigBuilder = exports.ConfigManager = exports.DEFAULT_CONFIG = void 0;
exports.getConfig = getConfig;
exports.loadConfigFromEnvironment = loadConfigFromEnvironment;
exports.getPresetConfig = getPresetConfig;
exports.getUseCaseConfig = getUseCaseConfig;
/**
 * Default configuration values
 */
/**
 * Enhanced default configuration with comprehensive settings
 */
exports.DEFAULT_CONFIG = {
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
class ConfigManager {
    static instance;
    config;
    validationSchema;
    environmentOverrides;
    constructor(initialConfig) {
        this.config = this.mergeConfig(initialConfig);
        this.validationSchema = this.createValidationSchema();
        this.environmentOverrides = new Map();
        this.initializeEnvironmentOverrides();
    }
    static getInstance(initialConfig) {
        if (!ConfigManager.instance) {
            ConfigManager.instance = new ConfigManager(initialConfig);
        }
        return ConfigManager.instance;
    }
    /**
     * Initialize environment-specific configuration overrides
     */
    initializeEnvironmentOverrides() {
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
    applyEnvironmentConfig(environment) {
        const envOverrides = this.environmentOverrides.get(environment);
        if (envOverrides) {
            this.config = this.mergeConfig(envOverrides);
        }
    }
    /**
     * Apply performance preset with type safety
     */
    applyPerformancePreset(preset) {
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
    createValidationSchema() {
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
                        if (typeof weights !== 'object')
                            return false;
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
                            return {
                                isValid: false,
                                message: 'maxFeaturesAutoSelection must be a positive number',
                            };
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
                        const perfMemoryMB = context?.fullConfig.performance.memoryThresholdBytes
                            ? context.fullConfig.performance.memoryThresholdBytes / (1024 * 1024)
                            : null;
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
    getConfig() {
        return { ...this.config };
    }
    /**
     * Get a specific configuration section
     */
    getPerformanceConfig() {
        return { ...this.config.performance };
    }
    getStatisticalConfig() {
        return { ...this.config.statistical };
    }
    getQualityConfig() {
        return { ...this.config.quality };
    }
    getAnalysisConfig() {
        return { ...this.config.analysis };
    }
    getStreamingConfig() {
        return { ...this.config.streaming };
    }
    getVisualizationConfig() {
        return { ...this.config.visualization };
    }
    getModelingConfig() {
        return { ...this.config.modeling };
    }
    /**
     * Update configuration dynamically
     */
    updateConfig(updates) {
        this.config = this.mergeConfig(updates);
    }
    /**
     * Update a specific configuration section
     */
    updatePerformanceConfig(updates) {
        this.config.performance = { ...this.config.performance, ...updates };
    }
    updateStatisticalConfig(updates) {
        this.config.statistical = { ...this.config.statistical, ...updates };
    }
    updateQualityConfig(updates) {
        this.config.quality = { ...this.config.quality, ...updates };
    }
    updateAnalysisConfig(updates) {
        this.config.analysis = { ...this.config.analysis, ...updates };
    }
    updateStreamingConfig(updates) {
        this.config.streaming = { ...this.config.streaming, ...updates };
    }
    updateVisualizationConfig(updates) {
        this.config.visualization = { ...this.config.visualization, ...updates };
    }
    updateModelingConfig(updates) {
        this.config.modeling = { ...this.config.modeling, ...updates };
    }
    /**
     * Reset to default configuration
     */
    reset() {
        this.config = { ...exports.DEFAULT_CONFIG };
    }
    /**
     * Get adaptive thresholds based on dataset characteristics
     */
    getAdaptiveThresholds(datasetSize, memoryAvailable) {
        const adaptiveConfig = {};
        // Adaptive performance settings based on dataset size
        if (datasetSize > 1000000) {
            adaptiveConfig.performance = {
                ...this.config.performance,
                maxRows: Math.min(datasetSize, 2000000),
                chunkSize: 128 * 1024, // Larger chunks for big datasets
                batchSize: 2000,
            };
        }
        else if (datasetSize < 10000) {
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
    mergeConfig(updates) {
        if (!updates) {
            return { ...exports.DEFAULT_CONFIG };
        }
        const merged = { ...exports.DEFAULT_CONFIG };
        Object.keys(updates).forEach((key) => {
            const section = key;
            if (updates[section] && typeof updates[section] === 'object') {
                merged[section] = { ...merged[section], ...updates[section] };
            }
        });
        return merged;
    }
    /**
     * Comprehensive configuration validation using schema
     */
    validateConfig() {
        const errors = [];
        const warnings = [];
        // Validate each section using the schema
        for (const [sectionName, rules] of Object.entries(this.validationSchema)) {
            const sectionConfig = this.config[sectionName];
            for (const rule of rules) {
                const fieldValue = sectionConfig[rule.field];
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
    validateCrossSectionConsistency(errors, warnings) {
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
    validatePerformanceSettings(warnings) {
        const perf = this.config.performance;
        // Check for potential memory issues
        if (perf.memoryThresholdBytes < 256 * 1024 * 1024) {
            // Less than 256MB
            warnings.push('Memory threshold is quite low, consider increasing for better performance');
        }
        // Check chunk size efficiency
        if (perf.chunkSize < 32 * 1024) {
            // Less than 32KB
            warnings.push('Small chunk size may impact performance, consider increasing');
        }
        // Check batch size consistency
        if (perf.batchSize > perf.chunkSize / 100) {
            warnings.push('Batch size seems large relative to chunk size');
        }
    }
}
exports.ConfigManager = ConfigManager;
/**
 * Convenience function to get the global config manager
 */
function getConfig() {
    return ConfigManager.getInstance();
}
/**
 * Create a configuration builder for fluent API
 */
class ConfigBuilder {
    config = {};
    static create() {
        return new ConfigBuilder();
    }
    environment(mode) {
        const manager = ConfigManager.getInstance();
        manager.applyEnvironmentConfig(mode);
        return this;
    }
    preset(presetName) {
        const presetConfig = getPresetConfig(presetName);
        this.config = { ...this.config, ...presetConfig };
        return this;
    }
    useCase(useCase) {
        const useCaseConfig = getUseCaseConfig(useCase);
        this.config = { ...this.config, ...useCaseConfig };
        return this;
    }
    performance(config) {
        this.config.performance = { ...this.config.performance, ...config };
        return this;
    }
    statistical(config) {
        this.config.statistical = { ...this.config.statistical, ...config };
        return this;
    }
    quality(config) {
        this.config.quality = { ...this.config.quality, ...config };
        return this;
    }
    build() {
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
exports.ConfigBuilder = ConfigBuilder;
/**
 * Type-safe configuration factory functions
 */
exports.ConfigFactory = {
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
function loadConfigFromEnvironment() {
    const envConfig = {};
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
        const preset = process.env.DATAPILOT_PRESET;
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
function getPresetConfig(presetName) {
    const presets = {
        small: {
            performance: {
                ...exports.DEFAULT_CONFIG.performance,
                maxRows: 10000,
                chunkSize: 16 * 1024,
                batchSize: 100,
                maxCollectedRowsMultivariate: 500,
            },
            streaming: {
                ...exports.DEFAULT_CONFIG.streaming,
                memoryThresholdMB: 25,
                maxRowsAnalyzed: 10000,
                adaptiveChunkSizing: {
                    ...exports.DEFAULT_CONFIG.streaming.adaptiveChunkSizing,
                    maxChunkSize: 500,
                },
            },
            analysis: {
                ...exports.DEFAULT_CONFIG.analysis,
                enableMultivariate: false, // Disable for small datasets
                maxCorrelationPairs: 25,
            },
        },
        medium: {
            performance: {
                ...exports.DEFAULT_CONFIG.performance,
                maxRows: 100000,
                chunkSize: 32 * 1024,
                batchSize: 500,
                maxCollectedRowsMultivariate: 1000,
            },
            streaming: {
                ...exports.DEFAULT_CONFIG.streaming,
                memoryThresholdMB: 50,
                maxRowsAnalyzed: 100000,
            },
            analysis: {
                ...exports.DEFAULT_CONFIG.analysis,
                enableMultivariate: true,
                maxCorrelationPairs: 50,
            },
        },
        large: {
            performance: {
                ...exports.DEFAULT_CONFIG.performance,
                maxRows: 1000000,
                chunkSize: 64 * 1024,
                batchSize: 1000,
                maxCollectedRowsMultivariate: 2000,
            },
            streaming: {
                ...exports.DEFAULT_CONFIG.streaming,
                memoryThresholdMB: 100,
                maxRowsAnalyzed: 500000,
                adaptiveChunkSizing: {
                    ...exports.DEFAULT_CONFIG.streaming.adaptiveChunkSizing,
                    enabled: true,
                    expansionFactor: 1.2, // More aggressive for large datasets
                },
            },
            analysis: {
                ...exports.DEFAULT_CONFIG.analysis,
                enableMultivariate: true,
                maxCorrelationPairs: 75,
            },
        },
        xlarge: {
            performance: {
                ...exports.DEFAULT_CONFIG.performance,
                maxRows: 5000000,
                chunkSize: 128 * 1024,
                batchSize: 2000,
                maxCollectedRowsMultivariate: 3000,
                emergencyMemoryThresholdMultiplier: 2.0, // More headroom
            },
            streaming: {
                ...exports.DEFAULT_CONFIG.streaming,
                memoryThresholdMB: 200,
                maxRowsAnalyzed: 1000000,
                adaptiveChunkSizing: {
                    ...exports.DEFAULT_CONFIG.streaming.adaptiveChunkSizing,
                    enabled: true,
                    maxChunkSize: 5000,
                    expansionFactor: 1.3,
                },
                memoryManagement: {
                    ...exports.DEFAULT_CONFIG.streaming.memoryManagement,
                    cleanupInterval: 10, // More frequent cleanup
                    forceGarbageCollection: true,
                },
            },
            analysis: {
                ...exports.DEFAULT_CONFIG.analysis,
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
function getUseCaseConfig(useCase) {
    const useCaseConfigs = {
        'data-quality': {
            quality: {
                ...exports.DEFAULT_CONFIG.quality,
                qualityWeights: {
                    completeness: 0.25,
                    uniqueness: 0.2,
                    validity: 0.25,
                    consistency: 0.2,
                    accuracy: 0.1,
                    timeliness: 0.0,
                    integrity: 0.0,
                    reasonableness: 0.0,
                    precision: 0.0,
                    representational: 0.0,
                },
            },
            analysis: {
                ...exports.DEFAULT_CONFIG.analysis,
                enabledAnalyses: ['univariate'], // Focus on quality, not complex analysis
            },
        },
        'eda-focused': {
            analysis: {
                ...exports.DEFAULT_CONFIG.analysis,
                enableMultivariate: true,
                enabledAnalyses: ['univariate', 'bivariate', 'correlations'],
                maxCorrelationPairs: 100,
            },
            statistical: {
                ...exports.DEFAULT_CONFIG.statistical,
                significanceLevel: 0.01, // More stringent for EDA
            },
        },
        'ml-pipeline': {
            analysis: {
                ...exports.DEFAULT_CONFIG.analysis,
                enableMultivariate: true,
                enabledAnalyses: ['univariate', 'bivariate', 'correlations'],
            },
            modeling: {
                ...exports.DEFAULT_CONFIG.modeling,
                algorithmScoringWeights: {
                    performance: 0.5,
                    interpretability: 0.2,
                    scalability: 0.2,
                    robustness: 0.1,
                },
            },
        },
        visualization: {
            visualization: {
                ...exports.DEFAULT_CONFIG.visualization,
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
                ...exports.DEFAULT_CONFIG.performance,
                maxRows: 5000,
                maxCollectedRowsMultivariate: 200,
            },
            analysis: {
                ...exports.DEFAULT_CONFIG.analysis,
                enableMultivariate: false,
                enabledAnalyses: ['univariate'],
                maxCorrelationPairs: 10,
            },
        },
    };
    return useCaseConfigs[useCase];
}
//# sourceMappingURL=config.js.map