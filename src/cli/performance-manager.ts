/**
 * Performance Manager for DataPilot CLI
 * Integrates SmartResourceManager and SectionCacheManager for optimal performance
 * Addresses GitHub issue #23: Smart performance defaults and auto-configuration
 */

import type { CLIOptions } from './types';
import { SmartResourceManager, type AutoConfigResult } from '../performance/smart-resource-manager';
import { SectionCacheManager, type CacheConfig } from '../performance/section-cache-manager';
import { PerformanceMonitor, type PerformanceReport } from './performance-monitor';
import { logger } from '../utils/logger';
import * as fs from 'fs';

export interface PerformanceConfig {
  autoConfiguration: AutoConfigResult;
  cacheManager: SectionCacheManager;
  performanceMonitor: PerformanceMonitor;
  optimizedOptions: CLIOptions;
}

export class CLIPerformanceManager {
  private resourceManager: SmartResourceManager;
  private cacheManager?: SectionCacheManager;
  private performanceMonitor?: PerformanceMonitor;
  private currentConfig?: PerformanceConfig;

  constructor() {
    this.resourceManager = new SmartResourceManager();
  }

  /**
   * Initialize performance systems based on CLI options and file characteristics
   */
  async initialize(filePath: string, options: CLIOptions): Promise<PerformanceConfig> {
    logger.info('Initializing smart performance management...');

    // Get file size for optimization
    const fileSizeMB = await this.getFileSizeMB(filePath);

    // Auto-configure if requested or no specific performance options provided
    const shouldAutoConfig = options.autoConfig || this.shouldUseAutoConfig(options);
    
    let autoConfig: AutoConfigResult;
    if (shouldAutoConfig) {
      autoConfig = await this.resourceManager.autoConfigurePerformance(fileSizeMB);
      this.logAutoConfigResults(autoConfig);
    } else {
      // Use manual configuration
      autoConfig = await this.createManualConfig(options, fileSizeMB);
    }

    // Apply preset if specified
    if (options.preset) {
      autoConfig = await this.applyPreset(options.preset, fileSizeMB);
    }

    // Initialize caching system
    const cacheConfig = this.createCacheConfig(options, autoConfig);
    this.cacheManager = new SectionCacheManager(cacheConfig);

    // Initialize performance monitoring
    this.performanceMonitor = new PerformanceMonitor({
      enabled: !options.quiet,
      sampleInterval: 100,
      memoryThreshold: 0.8,
    });

    // Create optimized CLI options
    const optimizedOptions = this.createOptimizedOptions(options, autoConfig);

    this.currentConfig = {
      autoConfiguration: autoConfig,
      cacheManager: this.cacheManager,
      performanceMonitor: this.performanceMonitor,
      optimizedOptions,
    };

    return this.currentConfig;
  }

  /**
   * Start performance monitoring
   */
  startMonitoring(): void {
    if (this.performanceMonitor) {
      this.performanceMonitor.start();
    }
  }

  /**
   * Stop performance monitoring and get report
   */
  stopMonitoring(): PerformanceReport | undefined {
    if (this.performanceMonitor) {
      return this.performanceMonitor.stop();
    }
    return undefined;
  }

  /**
   * Get section result from cache if available
   */
  async getCachedResult<T>(filePath: string, section: string): Promise<T | null> {
    if (!this.cacheManager) return null;
    return await this.cacheManager.get<T>(filePath, section);
  }

  /**
   * Cache section result
   */
  async setCachedResult<T>(filePath: string, section: string, data: T): Promise<void> {
    if (this.cacheManager) {
      await this.cacheManager.set(filePath, section, data);
    }
  }

  /**
   * Check if caching is enabled
   */
  isCachingEnabled(): boolean {
    return Boolean(this.cacheManager);
  }

  /**
   * Clear cache for a specific file
   */
  async clearFileCache(filePath: string): Promise<void> {
    if (this.cacheManager) {
      await this.cacheManager.clearFile(filePath);
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats() {
    if (this.cacheManager) {
      return await this.cacheManager.getStats();
    }
    return null;
  }

  /**
   * Get current performance configuration
   */
  getCurrentConfig(): PerformanceConfig | undefined {
    return this.currentConfig;
  }

  /**
   * Get recommended CLI options for a file
   */
  async getRecommendedOptions(filePath: string): Promise<string[]> {
    const fileSizeMB = await this.getFileSizeMB(filePath);
    return await this.resourceManager.getRecommendedCLIOptions(fileSizeMB);
  }

  /**
   * Check if auto-configuration should be used
   */
  private shouldUseAutoConfig(options: CLIOptions): boolean {
    // Use auto-config if no specific performance options are set
    return !options.maxMemory && 
           !options.threads && 
           !options.preset && 
           options.enableCaching === undefined;
  }

  /**
   * Get file size in MB
   */
  private async getFileSizeMB(filePath: string): Promise<number> {
    try {
      const stats = await fs.promises.stat(filePath);
      return stats.size / (1024 * 1024);
    } catch (error) {
      logger.warn(`Could not determine file size for ${filePath}, using default optimization`);
      return 100; // Default assumption
    }
  }

  /**
   * Create manual configuration from CLI options
   */
  private async createManualConfig(options: CLIOptions, fileSizeMB: number): Promise<AutoConfigResult> {
    const resources = await this.resourceManager.detectSystemResources();
    
    return {
      detectedResources: resources,
      selectedProfile: {
        name: 'manual',
        description: 'Manually configured via CLI options',
        maxMemoryMB: options.maxMemory || 2048,
        chunkSize: options.chunkSize || 10000,
        enableParallel: options.threads ? options.threads > 1 : true,
        enableCaching: options.enableCaching ?? true,
        maxWorkers: options.threads || 4,
        aggressiveCleanup: false,
        streamingOptimizations: options.streamingOptimizations || false,
      },
      customizations: {
        maxMemoryMB: options.maxMemory || 2048,
        chunkSize: options.chunkSize || 10000,
        maxWorkers: options.threads || 4,
        enableCaching: options.enableCaching ?? true,
        streamingOptimizations: options.streamingOptimizations || false,
        progressiveReporting: options.progressiveReporting || false,
      },
      recommendations: [`Using manual configuration from CLI options`],
      warnings: [],
    };
  }

  /**
   * Apply performance preset
   */
  private async applyPreset(preset: string, fileSizeMB: number): Promise<AutoConfigResult> {
    logger.info(`Applying performance preset: ${preset}`);
    return await this.resourceManager.autoConfigurePerformance(fileSizeMB);
  }

  /**
   * Create cache configuration
   */
  private createCacheConfig(options: CLIOptions, autoConfig: AutoConfigResult): CacheConfig {
    const enabled = options.enableCaching ?? autoConfig.customizations.enableCaching;
    
    return {
      enabled,
      maxSizeBytes: (options.cacheSize || autoConfig.customizations.cacheSize || 500) * 1024 * 1024,
      maxEntries: 1000,
      ttlMs: 24 * 60 * 60 * 1000, // 24 hours
      cacheDirectory: require('path').join(require('os').tmpdir(), 'datapilot-cache'),
      enableDiskCache: enabled,
      enableMemoryCache: enabled,
      compressionLevel: 6,
    };
  }

  /**
   * Create optimized CLI options
   */
  private createOptimizedOptions(options: CLIOptions, autoConfig: AutoConfigResult): CLIOptions {
    return {
      ...options,
      maxMemory: options.maxMemory || autoConfig.customizations.maxMemoryMB,
      chunkSize: options.chunkSize || autoConfig.customizations.chunkSize,
      threads: options.threads || autoConfig.customizations.maxWorkers,
      enableCaching: options.enableCaching ?? autoConfig.customizations.enableCaching,
      streamingOptimizations: options.streamingOptimizations || autoConfig.customizations.streamingOptimizations,
      progressiveReporting: options.progressiveReporting || autoConfig.customizations.progressiveReporting || false,
    };
  }

  /**
   * Log auto-configuration results
   */
  private logAutoConfigResults(autoConfig: AutoConfigResult): void {
    if (!autoConfig.recommendations.length && !autoConfig.warnings.length) {
      return;
    }

    logger.info('🚀 Smart Performance Auto-Configuration Applied');
    
    if (autoConfig.recommendations.length > 0) {
      logger.info('💡 Performance Recommendations:');
      autoConfig.recommendations.forEach(rec => logger.info(`  • ${rec}`));
    }
    
    if (autoConfig.warnings.length > 0) {
      logger.warn('⚠️  Performance Warnings:');
      autoConfig.warnings.forEach(warn => logger.warn(`  • ${warn}`));
    }
  }

  /**
   * Show performance dashboard
   */
  showDashboard(): void {
    if (!this.currentConfig) {
      console.log('❌ Performance manager not initialized');
      return;
    }

    const { autoConfiguration: config } = this.currentConfig;
    const resources = config.detectedResources;
    
    console.log('\n📊 DataPilot Performance Dashboard');
    console.log('='.repeat(50));
    
    console.log('\n🖥️  System Resources:');
    console.log(`   Platform: ${resources.platform}/${resources.arch}`);
    console.log(`   CPU Cores: ${resources.cpuCount}`);
    console.log(`   Total Memory: ${resources.totalMemoryGB.toFixed(1)} GB`);
    console.log(`   Available Memory: ${resources.freeMemoryGB.toFixed(1)} GB`);
    console.log(`   Load Average: ${resources.cpuLoadAverage.toFixed(2)}`);
    
    console.log('\n⚡ Active Configuration:');
    console.log(`   Profile: ${config.selectedProfile.name}`);
    console.log(`   Memory Limit: ${config.customizations.maxMemoryMB} MB`);
    console.log(`   Chunk Size: ${config.customizations.chunkSize} rows`);
    console.log(`   Workers: ${config.customizations.maxWorkers}`);
    console.log(`   Caching: ${config.customizations.enableCaching ? 'Enabled' : 'Disabled'}`);
    console.log(`   Streaming: ${config.customizations.streamingOptimizations ? 'Enabled' : 'Disabled'}`);
    
    if (this.cacheManager) {
      this.cacheManager.getStats().then(stats => {
        console.log('\n💾 Cache Statistics:');
        console.log(`   Total Entries: ${stats.totalEntries}`);
        console.log(`   Cache Size: ${(stats.totalSizeBytes / 1024 / 1024).toFixed(1)} MB`);
        console.log(`   Hit Rate: ${(stats.hitRate * 100).toFixed(1)}%`);
        console.log(`   Total Hits: ${stats.totalHits}`);
        console.log(`   Total Misses: ${stats.totalMisses}`);
      }).catch(() => {
        console.log('\n💾 Cache Statistics: Not available');
      });
    }
  }
}