/**
 * Configuration System Tests
 * Comprehensive tests for DataPilot configuration management, validation, and utilities
 */

import {
  DEFAULT_CONFIG,
  ConfigManager,
  ConfigBuilder,
  ConfigFactory,
  getConfig,
  loadConfigFromEnvironment,
  getPresetConfig,
  getUseCaseConfig,
  type DataPilotConfig,
  type PerformanceConfig,
  type StatisticalConfig,
  type QualityConfig,
  type AnalysisConfig,
  type StreamingConfig,
  type VisualizationConfig,
  type ModelingConfig,
  type OutputConfig,
  type EnvironmentConfig,
  type EnvironmentMode,
  type PerformancePreset,
  type ConfigValidationRule,
  type ConfigValidationSchema,
} from '../../../src/core/config';

describe('Configuration System', () => {

  describe('DEFAULT_CONFIG', () => {
    it('should contain all required configuration sections', () => {
      expect(DEFAULT_CONFIG).toHaveProperty('performance');
      expect(DEFAULT_CONFIG).toHaveProperty('statistical');
      expect(DEFAULT_CONFIG).toHaveProperty('quality');
      expect(DEFAULT_CONFIG).toHaveProperty('analysis');
      expect(DEFAULT_CONFIG).toHaveProperty('streaming');
      expect(DEFAULT_CONFIG).toHaveProperty('visualization');
      expect(DEFAULT_CONFIG).toHaveProperty('modeling');
      expect(DEFAULT_CONFIG).toHaveProperty('output');
      expect(DEFAULT_CONFIG).toHaveProperty('environment');
      expect(DEFAULT_CONFIG).toHaveProperty('features');
      expect(DEFAULT_CONFIG).toHaveProperty('extensions');
      expect(DEFAULT_CONFIG).toHaveProperty('security');
    });

    it('should have valid performance configuration defaults', () => {
      const perf = DEFAULT_CONFIG.performance;
      expect(perf.maxRows).toBe(1000000);
      expect(perf.maxFieldSize).toBe(1024 * 1024);
      expect(perf.memoryThresholdBytes).toBe(1024 * 1024 * 1024);
      expect(perf.chunkSize).toBe(64 * 1024);
      expect(perf.adaptiveChunkSizing).toBe(true);
      expect(perf.batchSize).toBe(1000);
    });

    it('should have valid statistical configuration defaults', () => {
      const stats = DEFAULT_CONFIG.statistical;
      expect(stats.significanceLevel).toBe(0.05);
      expect(stats.confidenceLevel).toBe(0.95);
      expect(stats.correlationThresholds.weak).toBe(0.3);
      expect(stats.correlationThresholds.strong).toBe(0.7);
      expect(stats.outlierThresholds.zScoreThreshold).toBe(3.0);
    });

    it('should have valid quality configuration defaults', () => {
      const quality = DEFAULT_CONFIG.quality;
      expect(quality.qualityWeights.completeness).toBe(0.2);
      expect(quality.qualityThresholds.excellent).toBe(90);
      expect(quality.duplicateThresholds.exactDuplicateThreshold).toBe(1.0);
    });

    it('should have weights that sum to 1.0', () => {
      const weights = DEFAULT_CONFIG.quality.qualityWeights;
      const sum = Object.values(weights).reduce((a, b) => a + b, 0);
      expect(Math.abs(sum - 1.0)).toBeLessThan(0.01);
    });

    it('should have valid analysis configuration defaults', () => {
      const analysis = DEFAULT_CONFIG.analysis;
      expect(analysis.maxCategoricalLevels).toBe(50);
      expect(analysis.enableMultivariate).toBe(true);
      expect(analysis.enabledAnalyses).toContain('univariate');
      expect(analysis.outlierMethods).toContain('iqr');
    });

    it('should have valid streaming configuration defaults', () => {
      const streaming = DEFAULT_CONFIG.streaming;
      expect(streaming.memoryThresholdMB).toBe(100);
      expect(streaming.adaptiveChunkSizing.enabled).toBe(true);
      expect(streaming.memoryManagement.cleanupInterval).toBe(20);
    });

    it('should have valid output configuration defaults', () => {
      const output = DEFAULT_CONFIG.output;
      expect(output.includeVisualizationRecommendations).toBe(true);
      expect(output.progressReporting).toBe(true);
      expect(output.format).toBe('json');
    });
  });

  describe('ConfigManager Singleton', () => {
    beforeEach(() => {
      // Reset singleton for each test
      (ConfigManager as any).instance = null;
    });

    afterEach(() => {
      // Clean up singleton
      (ConfigManager as any).instance = null;
    });

    it('should return the same instance (singleton pattern)', () => {
      const manager1 = ConfigManager.getInstance();
      const manager2 = ConfigManager.getInstance();
      expect(manager1).toBe(manager2);
    });

    it('should accept initial configuration', () => {
      const initialConfig: Partial<DataPilotConfig> = {
        performance: { 
          ...DEFAULT_CONFIG.performance,
          maxRows: 500000 
        }
      };
      // Reset singleton to ensure clean state
      (ConfigManager as any).instance = null;
      const customManager = ConfigManager.getInstance(initialConfig);
      const config = customManager.getConfig();
      expect(config.performance.maxRows).toBe(500000);
    });

    it('should get complete configuration', () => {
      const manager = ConfigManager.getInstance();
      const config = manager.getConfig();
      expect(config).toEqual(DEFAULT_CONFIG);
    });

    it('should reset to default configuration', () => {
      const manager = ConfigManager.getInstance();
      manager.updatePerformanceConfig({ maxRows: 999999 });
      expect(manager.getPerformanceConfig().maxRows).toBe(999999);
      
      manager.reset();
      expect(manager.getPerformanceConfig().maxRows).toBe(DEFAULT_CONFIG.performance.maxRows);
    });
  });

  describe('Configuration Section Getters', () => {
    let manager: ConfigManager;

    beforeEach(() => {
      (ConfigManager as any).instance = null;
      manager = ConfigManager.getInstance();
    });

    afterEach(() => {
      (ConfigManager as any).instance = null;
    });

    it('should get performance configuration', () => {
      const config = manager.getPerformanceConfig();
      expect(config).toEqual(DEFAULT_CONFIG.performance);
      expect(config.maxRows).toBe(1000000);
    });

    it('should get statistical configuration', () => {
      const config = manager.getStatisticalConfig();
      expect(config).toEqual(DEFAULT_CONFIG.statistical);
      expect(config.significanceLevel).toBe(0.05);
    });

    it('should get quality configuration', () => {
      const config = manager.getQualityConfig();
      expect(config).toEqual(DEFAULT_CONFIG.quality);
    });

    it('should get analysis configuration', () => {
      const config = manager.getAnalysisConfig();
      expect(config).toEqual(DEFAULT_CONFIG.analysis);
    });

    it('should get streaming configuration', () => {
      const config = manager.getStreamingConfig();
      expect(config).toEqual(DEFAULT_CONFIG.streaming);
    });

    it('should get visualization configuration', () => {
      const config = manager.getVisualizationConfig();
      expect(config).toEqual(DEFAULT_CONFIG.visualization);
    });

    it('should get modeling configuration', () => {
      const config = manager.getModelingConfig();
      expect(config).toEqual(DEFAULT_CONFIG.modeling);
    });

    it('should get output configuration', () => {
      const config = manager.getOutputConfig();
      expect(config).toEqual(DEFAULT_CONFIG.output);
    });
  });

  describe('Configuration Section Updates', () => {
    let manager: ConfigManager;

    beforeEach(() => {
      (ConfigManager as any).instance = null;
      manager = ConfigManager.getInstance();
    });

    afterEach(() => {
      (ConfigManager as any).instance = null;
    });

    it('should update performance configuration', () => {
      const updates: Partial<PerformanceConfig> = {
        maxRows: 500000,
        chunkSize: 32 * 1024
      };
      
      manager.updatePerformanceConfig(updates);
      const config = manager.getPerformanceConfig();
      
      expect(config.maxRows).toBe(500000);
      expect(config.chunkSize).toBe(32 * 1024);
      expect(config.batchSize).toBe(DEFAULT_CONFIG.performance.batchSize); // Unchanged
    });

    it('should update statistical configuration', () => {
      const updates: Partial<StatisticalConfig> = {
        significanceLevel: 0.01,
        confidenceLevel: 0.99
      };
      
      manager.updateStatisticalConfig(updates);
      const config = manager.getStatisticalConfig();
      
      expect(config.significanceLevel).toBe(0.01);
      expect(config.confidenceLevel).toBe(0.99);
    });

    it('should update quality configuration', () => {
      const updates: Partial<QualityConfig> = {
        qualityThresholds: {
          excellent: 90,
          good: 80,
          fair: 60,
          needsImprovement: 40
        }
      };
      
      manager.updateQualityConfig(updates);
      const config = manager.getQualityConfig();
      
      expect(config.qualityThresholds.excellent).toBe(90);
      expect(config.qualityThresholds.good).toBe(80);
    });

    it('should update analysis configuration', () => {
      const updates: Partial<AnalysisConfig> = {
        enableMultivariate: false,
        maxCategoricalLevels: 25
      };
      
      manager.updateAnalysisConfig(updates);
      const config = manager.getAnalysisConfig();
      
      expect(config.enableMultivariate).toBe(false);
      expect(config.maxCategoricalLevels).toBe(25);
    });

    it('should update streaming configuration', () => {
      const updates: Partial<StreamingConfig> = {
        memoryThresholdMB: 200,
        adaptiveChunkSizing: {
          enabled: false,
          minChunkSize: 10,
          maxChunkSize: 100,
          reductionFactor: 0.5,
          expansionFactor: 1.2,
          targetMemoryUtilization: 0.9,
        }
      };
      
      manager.updateStreamingConfig(updates);
      const config = manager.getStreamingConfig();
      
      expect(config.memoryThresholdMB).toBe(200);
      expect(config.adaptiveChunkSizing.enabled).toBe(false);
      expect(config.adaptiveChunkSizing.expansionFactor).toBe(1.2);
    });

    it('should update visualization configuration', () => {
      const updates: Partial<VisualizationConfig> = {
        maxDataPoints: 5000,
        colorPalettes: {
          preferColorblindSafe: false,
          maxColors: 8
        }
      };
      
      manager.updateVisualizationConfig(updates);
      const config = manager.getVisualizationConfig();
      
      expect(config.maxDataPoints).toBe(5000);
      expect(config.colorPalettes.preferColorblindSafe).toBe(false);
    });

    it('should update modeling configuration', () => {
      const updates: Partial<ModelingConfig> = {
        maxFeaturesAutoSelection: 50,
        crossValidation: {
          defaultFolds: 10,
          minSampleSize: 100
        }
      };
      
      manager.updateModelingConfig(updates);
      const config = manager.getModelingConfig();
      
      expect(config.maxFeaturesAutoSelection).toBe(50);
      expect(config.crossValidation.defaultFolds).toBe(10);
    });

    it('should update output configuration', () => {
      const updates: Partial<OutputConfig> = {
        verboseOutput: true,
        format: 'yaml' as const
      };
      
      manager.updateOutputConfig(updates);
      const config = manager.getOutputConfig();
      
      expect(config.verboseOutput).toBe(true);
      expect(config.format).toBe('yaml');
    });

    it('should update complete configuration', () => {
      const updates: Partial<DataPilotConfig> = {
        performance: { 
          ...DEFAULT_CONFIG.performance,
          maxRows: 750000 
        },
        output: { 
          ...DEFAULT_CONFIG.output,
          verboseOutput: true 
        }
      };
      
      manager.updateConfig(updates);
      const config = manager.getConfig();
      
      expect(config.performance.maxRows).toBe(750000);
      expect(config.output.verboseOutput).toBe(true);
    });
  });

  describe('Environment Configuration', () => {
    let manager: ConfigManager;

    beforeEach(() => {
      (ConfigManager as any).instance = null;
      manager = ConfigManager.getInstance();
    });

    afterEach(() => {
      (ConfigManager as any).instance = null;
    });

    it('should apply development environment configuration', () => {
      manager.applyEnvironmentConfig('development');
      const config = manager.getConfig();
      
      expect(config.performance.maxRows).toBe(50000);
      expect(config.streaming.memoryThresholdMB).toBe(50);
      expect(config.streaming.adaptiveChunkSizing.enabled).toBe(false);
    });

    it('should apply production environment configuration', () => {
      manager.applyEnvironmentConfig('production');
      const config = manager.getConfig();
      
      expect(config.performance.maxRows).toBe(2000000);
      expect(config.streaming.memoryThresholdMB).toBe(500);
      expect(config.streaming.adaptiveChunkSizing.enabled).toBe(true);
    });

    it('should apply CI environment configuration', () => {
      manager.applyEnvironmentConfig('ci');
      const config = manager.getConfig();
      
      expect(config.performance.maxRows).toBe(10000);
      expect(config.analysis.enableMultivariate).toBe(false);
      expect(config.analysis.enabledAnalyses).toEqual(['univariate']);
    });

    it('should apply test environment configuration', () => {
      manager.applyEnvironmentConfig('test');
      const config = manager.getConfig();
      
      expect(config.performance.maxRows).toBe(1000);
      expect(config.statistical.significanceLevel).toBe(0.1);
      expect(config.statistical.confidenceLevel).toBe(0.9);
    });
  });

  describe('Performance Presets', () => {
    let manager: ConfigManager;

    beforeEach(() => {
      (ConfigManager as any).instance = null;
      manager = ConfigManager.getInstance();
    });

    afterEach(() => {
      (ConfigManager as any).instance = null;
    });

    it('should apply low-memory preset', () => {
      const preset: PerformancePreset = {
        preset: 'low-memory',
        maxMemoryMB: 256,
        maxRows: 10000,
        enableCache: false
      };
      
      manager.applyPerformancePreset(preset);
      const config = manager.getConfig();
      
      expect(config.performance.maxRows).toBe(10000);
      expect(config.performance.memoryThresholdBytes).toBe(256 * 1024 * 1024);
      expect(config.performance.adaptiveChunkSizing).toBe(false);
      expect(config.streaming.memoryThresholdMB).toBe(64); // 256/4
    });

    it('should apply balanced preset', () => {
      const preset: PerformancePreset = {
        preset: 'balanced',
        maxMemoryMB: 1024,
        maxRows: 100000,
        enableCache: true
      };
      
      manager.applyPerformancePreset(preset);
      const config = manager.getConfig();
      
      expect(config.performance.maxRows).toBe(100000);
      expect(config.performance.memoryThresholdBytes).toBe(1024 * 1024 * 1024);
      expect(config.performance.adaptiveChunkSizing).toBe(true);
    });

    it('should apply high-performance preset', () => {
      const preset: PerformancePreset = {
        preset: 'high-performance',
        maxMemoryMB: 4096,
        maxRows: 1000000,
        enableCache: true
      };
      
      manager.applyPerformancePreset(preset);
      const config = manager.getConfig();
      
      expect(config.performance.maxRows).toBe(1000000);
      expect(config.performance.memoryThresholdBytes).toBe(4096 * 1024 * 1024);
      expect(config.performance.batchSize).toBe(5000);
    });

    it('should apply custom preset', () => {
      const customConfig: Partial<PerformanceConfig> = {
        maxRows: 500000,
        chunkSize: 128 * 1024
      };
      
      const preset: PerformancePreset = {
        preset: 'custom',
        config: customConfig
      };
      
      manager.applyPerformancePreset(preset);
      const config = manager.getConfig();
      
      expect(config.performance.maxRows).toBe(500000);
      expect(config.performance.chunkSize).toBe(128 * 1024);
    });
  });

  describe('Adaptive Thresholds', () => {
    let manager: ConfigManager;

    beforeEach(() => {
      (ConfigManager as any).instance = null;
      manager = ConfigManager.getInstance();
    });

    afterEach(() => {
      (ConfigManager as any).instance = null;
    });

    it('should provide adaptive configuration for large datasets', () => {
      const datasetSize = 2000000;
      const memoryAvailable = 2 * 1024 * 1024 * 1024; // 2GB
      
      const adaptive = manager.getAdaptiveThresholds(datasetSize, memoryAvailable);
      
      expect(adaptive.performance?.maxRows).toBe(2000000);
      expect(adaptive.performance?.chunkSize).toBe(128 * 1024);
      expect(adaptive.performance?.batchSize).toBe(2000);
    });

    it('should provide adaptive configuration for small datasets', () => {
      const datasetSize = 5000;
      const memoryAvailable = 1024 * 1024 * 1024; // 1GB
      
      const adaptive = manager.getAdaptiveThresholds(datasetSize, memoryAvailable);
      
      expect(adaptive.performance?.chunkSize).toBe(16 * 1024);
      expect(adaptive.performance?.batchSize).toBe(100);
    });

    it('should provide adaptive configuration for low memory', () => {
      const datasetSize = 100000;
      const memoryAvailable = 256 * 1024 * 1024; // 256MB
      
      const adaptive = manager.getAdaptiveThresholds(datasetSize, memoryAvailable);
      
      expect(adaptive.streaming?.memoryThresholdMB).toBe(50);
      expect(adaptive.streaming?.maxRowsAnalyzed).toBe(100000);
      expect(adaptive.streaming?.adaptiveChunkSizing?.maxChunkSize).toBe(500);
      expect(adaptive.performance?.maxCollectedRowsMultivariate).toBe(500);
    });

    it('should not provide adaptive configuration for medium datasets and memory', () => {
      const datasetSize = 50000;
      const memoryAvailable = 1024 * 1024 * 1024; // 1GB
      
      const adaptive = manager.getAdaptiveThresholds(datasetSize, memoryAvailable);
      
      expect(adaptive.performance).toBeUndefined();
      expect(adaptive.streaming).toBeUndefined();
    });
  });

  describe('Configuration Validation', () => {
    let manager: ConfigManager;

    beforeEach(() => {
      (ConfigManager as any).instance = null;
      manager = ConfigManager.getInstance();
    });

    afterEach(() => {
      (ConfigManager as any).instance = null;
    });

    it('should validate default configuration successfully', () => {
      const validation = manager.validateConfig();
      
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect invalid performance configuration', () => {
      manager.updatePerformanceConfig({
        maxRows: -100, // Invalid: must be positive
        chunkSize: 500 // Invalid: must be at least 1024
      });
      
      const validation = manager.validateConfig();
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('performance.maxRows: maxRows must be a positive number');
      expect(validation.errors).toContain('performance.chunkSize: chunkSize must be at least 1024 bytes');
    });

    it('should detect invalid statistical configuration', () => {
      manager.updateStatisticalConfig({
        significanceLevel: 1.5, // Invalid: must be between 0 and 1
        confidenceLevel: -0.1 // Invalid: must be between 0 and 1
      });
      
      const validation = manager.validateConfig();
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('statistical.significanceLevel: significanceLevel must be between 0 and 1');
      expect(validation.errors).toContain('statistical.confidenceLevel: confidenceLevel must be between 0 and 1');
    });

    it('should detect invalid quality weights', () => {
      manager.updateQualityConfig({
        qualityWeights: {
          completeness: 0.5,
          uniqueness: 0.5,
          validity: 0.2, // This will make sum > 1.0
          consistency: 0.15,
          accuracy: 0.15,
          timeliness: 0.05,
          integrity: 0.05,
          reasonableness: 0.03,
          precision: 0.01,
          representational: 0.01,
        }
      });
      
      const validation = manager.validateConfig();
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('quality.qualityWeights: qualityWeights must sum to 1.0');
    });

    it('should generate performance warnings', () => {
      manager.updatePerformanceConfig({
        memoryThresholdBytes: 128 * 1024 * 1024, // 128MB - will trigger warning
        chunkSize: 16 * 1024, // 16KB - will trigger warning
        batchSize: 10000 // Large relative to chunk size
      });
      
      const validation = manager.validateConfig();
      
      expect(validation.warnings).toContain('Memory threshold is quite low, consider increasing for better performance');
      expect(validation.warnings).toContain('Small chunk size may impact performance, consider increasing');
      expect(validation.warnings).toContain('Batch size seems large relative to chunk size');
    });

    it('should detect cross-section consistency issues', () => {
      manager.updatePerformanceConfig({
        memoryThresholdBytes: 512 * 1024 * 1024, // 512MB
        maxRows: 100000
      });
      manager.updateStreamingConfig({
        memoryThresholdMB: 600, // 600MB > 512MB
        maxRowsAnalyzed: 200000 // > performance.maxRows
      });
      
      const validation = manager.validateConfig();
      
      expect(validation.warnings).toContain('streaming.memoryThresholdMB should not exceed performance memory threshold');
      expect(validation.warnings).toContain('streaming.maxRowsAnalyzed should not exceed performance.maxRows');
    });

    it('should warn about strict correlation test significance', () => {
      manager.updateStatisticalConfig({
        significanceLevel: 0.05,
        alternativeSignificanceLevels: {
          normalityTests: 0.05,
          correlationTests: 0.001, // More strict than base level
          hypothesisTests: 0.05,
          outlierDetection: 0.01,
        }
      });
      
      const validation = manager.validateConfig();
      
      expect(validation.warnings).toContain('correlationTests significance level is more strict than base level');
    });
  });

  describe('getConfig Global Function', () => {
    afterEach(() => {
      (ConfigManager as any).instance = null;
    });

    it('should return ConfigManager instance', () => {
      const manager = getConfig();
      expect(manager).toBeInstanceOf(ConfigManager);
    });

    it('should return same instance on multiple calls', () => {
      const manager1 = getConfig();
      const manager2 = getConfig();
      expect(manager1).toBe(manager2);
    });
  });

  describe('ConfigBuilder', () => {
    it('should create a new ConfigBuilder instance', () => {
      const builder = ConfigBuilder.create();
      expect(builder).toBeInstanceOf(ConfigBuilder);
    });

    it('should build configuration with environment', () => {
      // Mock console.warn to prevent test output pollution
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      try {
        // Reset singleton to ensure clean state
        (ConfigManager as any).instance = null;
        
        // Create a new manager with valid environment config
        const validTestConfig: Partial<DataPilotConfig> = {
          performance: {
            ...DEFAULT_CONFIG.performance,
            maxRows: 1000,
            chunkSize: 25 * 1024, // Valid chunk size >= 1024
          },
          statistical: {
            ...DEFAULT_CONFIG.statistical,
            significanceLevel: 0.1,
          }
        };
        
        const config = ConfigBuilder.create()
          .performance(validTestConfig.performance!)
          .statistical(validTestConfig.statistical!)
          .build();
        
        expect(config.performance.maxRows).toBe(1000);
        expect(config.statistical.significanceLevel).toBe(0.1);
      } finally {
        consoleSpy.mockRestore();
      }
    });

    it('should build configuration with preset', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      try {
        // Reset singleton to ensure clean state
        (ConfigManager as any).instance = null;
        
        const config = ConfigBuilder.create()
          .preset('small')
          .build();
        
        expect(config.performance.maxRows).toBe(10000); // Small preset setting
        expect(config.streaming.memoryThresholdMB).toBe(25); // Small preset setting
      } finally {
        consoleSpy.mockRestore();
      }
    });

    it('should build configuration with use case', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      try {
        // Reset singleton to ensure clean state
        (ConfigManager as any).instance = null;
        
        const config = ConfigBuilder.create()
          .useCase('data-quality')
          .build();
        
        expect(config.quality.qualityWeights.completeness).toBe(0.25); // Data quality use case
        expect(config.analysis.enabledAnalyses).toEqual(['univariate']); // Data quality focus
      } finally {
        consoleSpy.mockRestore();
      }
    });

    it('should build configuration with custom sections', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      try {
        // Reset singleton to ensure clean state
        (ConfigManager as any).instance = null;
        
        const config = ConfigBuilder.create()
          .performance({ maxRows: 750000 })
          .statistical({ significanceLevel: 0.01 })
          .quality({ qualityThresholds: { excellent: 98, good: 85, fair: 70, needsImprovement: 50 } })
          .build();
        
        expect(config.performance.maxRows).toBe(750000);
        expect(config.statistical.significanceLevel).toBe(0.01);
        expect(config.quality.qualityThresholds.excellent).toBe(98);
      } finally {
        consoleSpy.mockRestore();
      }
    });

    it('should throw error for invalid configuration', () => {
      // Reset singleton to ensure clean state
      (ConfigManager as any).instance = null;
      
      expect(() => {
        ConfigBuilder.create()
          .performance({ maxRows: -100 }) // Invalid
          .build();
      }).toThrow('Configuration validation failed');
    });

    it('should show warnings for valid but suboptimal configuration', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      try {
        // Reset singleton to ensure clean state
        (ConfigManager as any).instance = null;
        
        ConfigBuilder.create()
          .performance({ memoryThresholdBytes: 128 * 1024 * 1024 }) // Low memory - will warn
          .build();
        
        expect(consoleSpy).toHaveBeenCalledWith('Configuration warnings:', expect.any(Array));
      } finally {
        consoleSpy.mockRestore();
      }
    });
  });

  describe('ConfigFactory', () => {
    afterEach(() => {
      (ConfigManager as any).instance = null;
    });

    it('should create development configuration', () => {
      const builder = ConfigFactory.development();
      expect(builder).toBeInstanceOf(ConfigBuilder);
    });

    it('should create production configuration', () => {
      const builder = ConfigFactory.production();
      expect(builder).toBeInstanceOf(ConfigBuilder);
    });

    it('should create CI configuration', () => {
      const builder = ConfigFactory.ci();
      expect(builder).toBeInstanceOf(ConfigBuilder);
    });

    it('should create test configuration', () => {
      const builder = ConfigFactory.test();
      expect(builder).toBeInstanceOf(ConfigBuilder);
    });

    it('should create preset configurations', () => {
      expect(ConfigFactory.small()).toBeInstanceOf(ConfigBuilder);
      expect(ConfigFactory.medium()).toBeInstanceOf(ConfigBuilder);
      expect(ConfigFactory.large()).toBeInstanceOf(ConfigBuilder);
      expect(ConfigFactory.xlarge()).toBeInstanceOf(ConfigBuilder);
    });

    it('should create use case configurations', () => {
      expect(ConfigFactory.dataQuality()).toBeInstanceOf(ConfigBuilder);
      expect(ConfigFactory.eda()).toBeInstanceOf(ConfigBuilder);
      expect(ConfigFactory.ml()).toBeInstanceOf(ConfigBuilder);
      expect(ConfigFactory.visualization()).toBeInstanceOf(ConfigBuilder);
      expect(ConfigFactory.quickScan()).toBeInstanceOf(ConfigBuilder);
    });
  });

  describe('Environment Configuration Loading', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      jest.resetModules();
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it('should load performance settings from environment', () => {
      process.env.DATAPILOT_MAX_ROWS = '500000';
      process.env.DATAPILOT_MEMORY_THRESHOLD_MB = '2048';
      
      const config = loadConfigFromEnvironment();
      
      expect(config.performance?.maxRows).toBe(500000);
      expect(config.performance?.memoryThresholdBytes).toBe(2048 * 1024 * 1024);
      expect(config.streaming?.memoryThresholdMB).toBe(2048);
    });

    it('should load statistical settings from environment', () => {
      process.env.DATAPILOT_SIGNIFICANCE_LEVEL = '0.01';
      
      const config = loadConfigFromEnvironment();
      
      expect(config.statistical?.significanceLevel).toBe(0.01);
    });

    it('should load feature flags from environment', () => {
      process.env.DATAPILOT_ENABLE_MULTIVARIATE = 'false';
      
      const config = loadConfigFromEnvironment();
      
      expect(config.analysis?.enableMultivariate).toBe(false);
    });

    it('should load security settings from environment', () => {
      process.env.DATAPILOT_MAX_FILE_SIZE_MB = '1024';
      
      const config = loadConfigFromEnvironment();
      
      expect(config.security?.maxFileSize).toBe(1024 * 1024 * 1024);
    });

    it('should load preset from environment', () => {
      process.env.DATAPILOT_PRESET = 'large';
      
      const config = loadConfigFromEnvironment();
      
      expect(config.performance?.maxRows).toBe(1000000);
      expect(config.streaming?.memoryThresholdMB).toBe(100);
    });

    it('should ignore invalid environment values', () => {
      process.env.DATAPILOT_MAX_ROWS = 'invalid';
      process.env.DATAPILOT_MEMORY_THRESHOLD_MB = 'not-a-number';
      process.env.DATAPILOT_SIGNIFICANCE_LEVEL = '2.0'; // Invalid: > 1
      process.env.DATAPILOT_PRESET = 'invalid-preset';
      
      const config = loadConfigFromEnvironment();
      
      expect(config.performance?.maxRows).toBeUndefined();
      expect(config.performance?.memoryThresholdBytes).toBeUndefined();
      expect(config.statistical?.significanceLevel).toBeUndefined();
      expect(config.performance?.maxRows).toBeUndefined(); // Preset not applied
    });

    it('should return empty configuration for no environment variables', () => {
      const config = loadConfigFromEnvironment();
      
      expect(config).toEqual({});
    });
  });

  describe('Preset Configuration Functions', () => {
    it('should get small preset configuration', () => {
      const config = getPresetConfig('small');
      
      expect(config.performance?.maxRows).toBe(10000);
      expect(config.streaming?.memoryThresholdMB).toBe(25);
      expect(config.analysis?.enableMultivariate).toBe(false);
    });

    it('should get medium preset configuration', () => {
      const config = getPresetConfig('medium');
      
      expect(config.performance?.maxRows).toBe(100000);
      expect(config.streaming?.memoryThresholdMB).toBe(50);
      expect(config.analysis?.enableMultivariate).toBe(true);
    });

    it('should get large preset configuration', () => {
      const config = getPresetConfig('large');
      
      expect(config.performance?.maxRows).toBe(1000000);
      expect(config.streaming?.memoryThresholdMB).toBe(100);
      expect(config.streaming?.adaptiveChunkSizing?.expansionFactor).toBe(1.2);
    });

    it('should get xlarge preset configuration', () => {
      const config = getPresetConfig('xlarge');
      
      expect(config.performance?.maxRows).toBe(5000000);
      expect(config.streaming?.memoryThresholdMB).toBe(200);
      expect(config.streaming?.memoryManagement?.cleanupInterval).toBe(10);
      expect(config.analysis?.samplingThreshold).toBe(50000);
    });
  });

  describe('Use Case Configuration Functions', () => {
    it('should get data-quality use case configuration', () => {
      const config = getUseCaseConfig('data-quality');
      
      expect(config.quality?.qualityWeights?.completeness).toBe(0.25);
      expect(config.analysis?.enabledAnalyses).toEqual(['univariate']);
    });

    it('should get eda-focused use case configuration', () => {
      const config = getUseCaseConfig('eda-focused');
      
      expect(config.analysis?.enableMultivariate).toBe(true);
      expect(config.analysis?.maxCorrelationPairs).toBe(100);
      expect(config.statistical?.significanceLevel).toBe(0.01);
    });

    it('should get ml-pipeline use case configuration', () => {
      const config = getUseCaseConfig('ml-pipeline');
      
      expect(config.analysis?.enableMultivariate).toBe(true);
      expect(config.modeling?.algorithmScoringWeights?.performance).toBe(0.5);
    });

    it('should get visualization use case configuration', () => {
      const config = getUseCaseConfig('visualization');
      
      expect(config.visualization?.maxDataPoints).toBe(50000);
      expect(config.visualization?.chartScoringWeights?.dataFit).toBe(0.3);
    });

    it('should get quick-scan use case configuration', () => {
      const config = getUseCaseConfig('quick-scan');
      
      expect(config.performance?.maxRows).toBe(5000);
      expect(config.analysis?.enableMultivariate).toBe(false);
      expect(config.analysis?.maxCorrelationPairs).toBe(10);
    });
  });

  describe('Configuration Immutability', () => {
    let manager: ConfigManager;

    beforeEach(() => {
      (ConfigManager as any).instance = null;
      manager = ConfigManager.getInstance();
    });

    afterEach(() => {
      (ConfigManager as any).instance = null;
    });

    it('should return deep copies of configuration objects', () => {
      const config1 = manager.getConfig();
      const config2 = manager.getConfig();
      
      expect(config1).not.toBe(config2); // Different objects
      expect(config1).toEqual(config2); // Same content
      
      // Mutating one shouldn't affect the other
      config1.performance.maxRows = 999999;
      expect(config2.performance.maxRows).toBe(DEFAULT_CONFIG.performance.maxRows);
    });

    it('should return deep copies of section configurations', () => {
      const perf1 = manager.getPerformanceConfig();
      const perf2 = manager.getPerformanceConfig();
      
      expect(perf1).not.toBe(perf2);
      expect(perf1).toEqual(perf2);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    let manager: ConfigManager;

    beforeEach(() => {
      (ConfigManager as any).instance = null;
      manager = ConfigManager.getInstance();
    });

    afterEach(() => {
      (ConfigManager as any).instance = null;
    });

    it('should handle undefined updates gracefully', () => {
      expect(() => {
        manager.updateConfig(undefined as any);
      }).not.toThrow();
      
      expect(() => {
        manager.updatePerformanceConfig(undefined as any);
      }).not.toThrow();
    });

    it('should handle empty updates gracefully', () => {
      manager.updateConfig({});
      manager.updatePerformanceConfig({});
      
      const config = manager.getConfig();
      expect(config).toEqual(DEFAULT_CONFIG);
    });

    it('should handle partial nested updates', () => {
      manager.updateStreamingConfig({
        adaptiveChunkSizing: {
          ...DEFAULT_CONFIG.streaming.adaptiveChunkSizing,
          enabled: false
          // Other properties should remain unchanged
        }
      });
      
      const config = manager.getStreamingConfig();
      expect(config.adaptiveChunkSizing.enabled).toBe(false);
      expect(config.adaptiveChunkSizing.minChunkSize).toBe(DEFAULT_CONFIG.streaming.adaptiveChunkSizing.minChunkSize);
    });

    it('should maintain singleton after configuration changes', () => {
      const manager1 = ConfigManager.getInstance();
      manager1.updatePerformanceConfig({ maxRows: 777777 });
      
      const manager2 = ConfigManager.getInstance();
      expect(manager1).toBe(manager2);
      expect(manager2.getPerformanceConfig().maxRows).toBe(777777);
    });
  });

  describe('Type Safety', () => {
    let manager: ConfigManager;

    beforeEach(() => {
      (ConfigManager as any).instance = null;
      manager = ConfigManager.getInstance();
    });

    afterEach(() => {
      (ConfigManager as any).instance = null;
    });

    it('should enforce environment mode types', () => {
      const validModes: EnvironmentMode[] = ['development', 'production', 'ci', 'test'];
      
      validModes.forEach(mode => {
        expect(() => manager.applyEnvironmentConfig(mode)).not.toThrow();
      });
    });

    it('should enforce output format types', () => {
      const validFormats: Array<'json' | 'markdown' | 'yaml'> = ['json', 'markdown', 'yaml'];
      
      validFormats.forEach(format => {
        expect(() => {
          manager.updateOutputConfig({ format });
        }).not.toThrow();
      });
    });

    it('should maintain type consistency in configuration sections', () => {
      const performanceConfig = manager.getPerformanceConfig();
      
      expect(typeof performanceConfig.maxRows).toBe('number');
      expect(typeof performanceConfig.adaptiveChunkSizing).toBe('boolean');
      expect(Array.isArray(DEFAULT_CONFIG.analysis.outlierMethods)).toBe(true);
    });
  });
});