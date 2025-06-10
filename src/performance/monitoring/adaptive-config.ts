/**
 * Adaptive Configuration System
 * Automatically adjusts performance settings based on workload and system characteristics
 */

import { EventEmitter } from 'events';
import { logger } from '../../utils/logger';
import { DataPilotError, ErrorSeverity, ErrorCategory } from '../../core/types';
import { getGlobalPerformanceDashboard } from './performance-dashboard';

export interface AdaptiveConfigOptions {
  enableAutoAdjustment?: boolean;
  adjustmentInterval?: number; // Milliseconds
  learningRate?: number; // 0-1, how quickly to adapt
  stabilityThreshold?: number; // How stable metrics should be before adjusting
  maxAdjustmentPercentage?: number; // Maximum change per adjustment
  enablePredictiveScaling?: boolean;
  analysisWindowMinutes?: number;
}

export interface WorkloadCharacteristics {
  dataSize: 'small' | 'medium' | 'large' | 'huge';
  complexity: 'simple' | 'moderate' | 'complex' | 'very-complex';
  ioPattern: 'sequential' | 'random' | 'mixed';
  memoryPressure: 'low' | 'medium' | 'high' | 'critical';
  concurrencyLevel: 'single' | 'low' | 'medium' | 'high';
  errorRate: 'minimal' | 'low' | 'moderate' | 'high';
}

export interface PerformanceProfile {
  name: string;
  description: string;
  settings: ConfigurationSettings;
  targetWorkload: Partial<WorkloadCharacteristics>;
  priority: number;
}

export interface ConfigurationSettings {
  // Worker pool settings
  maxWorkers?: number;
  workerIdleTimeout?: number;
  taskTimeout?: number;
  
  // Memory optimization
  memoryLimitMB?: number;
  chunkSize?: number;
  bufferSize?: number;
  
  // Streaming settings
  streamingBatchSize?: number;
  maxConcurrentStreams?: number;
  
  // Error reduction settings
  circuitBreakerThreshold?: number;
  retryAttempts?: number;
  leakDetectionInterval?: number;
  
  // Format-specific settings
  parquetBatchSize?: number;
  excelWorksheetBatchSize?: number;
  jsonArrayBatchSize?: number;
}

export interface AdaptationMetrics {
  adjustmentsMade: number;
  performanceImprovement: number;
  stabilityScore: number;
  learningAccuracy: number;
  lastAdjustmentTime: number;
  currentProfile: string;
  recommendedChanges: string[];
}

/**
 * Adaptive configuration system that automatically tunes performance settings
 */
export class AdaptiveConfigurationManager extends EventEmitter {
  private options: Required<AdaptiveConfigOptions>;
  private currentSettings: ConfigurationSettings = {};
  private baselineSettings: ConfigurationSettings = {};
  private workloadHistory: WorkloadCharacteristics[] = [];
  private performanceHistory: any[] = [];
  private profiles: Map<string, PerformanceProfile> = new Map();
  private adaptationTimer: NodeJS.Timeout | null = null;
  private metrics: AdaptationMetrics;
  private isRunning = false;
  private dashboard = getGlobalPerformanceDashboard();

  constructor(options: AdaptiveConfigOptions = {}) {
    super();
    
    this.options = {
      enableAutoAdjustment: options.enableAutoAdjustment ?? true,
      adjustmentInterval: options.adjustmentInterval ?? 30000, // 30 seconds
      learningRate: options.learningRate ?? 0.1,
      stabilityThreshold: options.stabilityThreshold ?? 0.1, // 10% variation
      maxAdjustmentPercentage: options.maxAdjustmentPercentage ?? 20, // 20% max change
      enablePredictiveScaling: options.enablePredictiveScaling ?? true,
      analysisWindowMinutes: options.analysisWindowMinutes ?? 10
    };

    this.metrics = this.initializeMetrics();
    this.initializeProfiles();
    
    logger.info('Adaptive configuration manager initialized', {
      component: 'AdaptiveConfigManager',
      options: this.options
    });
  }

  /**
   * Start adaptive configuration management
   */
  start(initialSettings: ConfigurationSettings = {}): void {
    if (this.isRunning) {
      logger.warn('Adaptive configuration manager already running');
      return;
    }

    this.isRunning = true;
    this.baselineSettings = { ...initialSettings };
    this.currentSettings = { ...initialSettings };
    
    if (this.options.enableAutoAdjustment) {
      this.adaptationTimer = setInterval(() => {
        this.performAdaptation();
      }, this.options.adjustmentInterval);
    }

    // Initial workload analysis
    this.analyzeCurrentWorkload();
    
    logger.info('Adaptive configuration manager started', {
      component: 'AdaptiveConfigManager',
      initialSettings: Object.keys(initialSettings)
    });
    
    this.emit('started', this.currentSettings);
  }

  /**
   * Stop adaptive configuration management
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    
    if (this.adaptationTimer) {
      clearInterval(this.adaptationTimer);
      this.adaptationTimer = null;
    }
    
    logger.info('Adaptive configuration manager stopped', {
      component: 'AdaptiveConfigManager'
    });
    
    this.emit('stopped');
  }

  /**
   * Get current configuration settings
   */
  getCurrentSettings(): ConfigurationSettings {
    return { ...this.currentSettings };
  }

  /**
   * Get adaptation metrics
   */
  getAdaptationMetrics(): AdaptationMetrics {
    return { ...this.metrics };
  }

  /**
   * Get workload analysis
   */
  getCurrentWorkloadCharacteristics(): WorkloadCharacteristics {
    return this.analyzeCurrentWorkload();
  }

  /**
   * Manually trigger adaptation
   */
  async triggerAdaptation(): Promise<ConfigurationSettings> {
    const oldSettings = { ...this.currentSettings };
    await this.performAdaptation();
    
    this.emit('manual-adaptation-triggered', {
      oldSettings,
      newSettings: this.currentSettings
    });
    
    return this.currentSettings;
  }

  /**
   * Add custom performance profile
   */
  addProfile(profile: PerformanceProfile): void {
    this.profiles.set(profile.name, profile);
    
    logger.debug('Performance profile added', {
      component: 'AdaptiveConfigManager',
      profileName: profile.name
    });
    
    this.emit('profile-added', profile);
  }

  /**
   * Get recommended settings for specific workload
   */
  getRecommendedSettings(workload: WorkloadCharacteristics): ConfigurationSettings {
    const matchingProfile = this.findBestMatchingProfile(workload);
    
    if (matchingProfile) {
      return { ...matchingProfile.settings };
    }
    
    return this.generateAdaptiveSettings(workload);
  }

  /**
   * Perform adaptive configuration adjustment
   */
  private async performAdaptation(): Promise<void> {
    try {
      // Analyze current workload
      const currentWorkload = this.analyzeCurrentWorkload();
      
      // Get performance metrics
      const performanceMetrics = this.dashboard.getCurrentMetrics();
      
      // Store history
      this.workloadHistory.push(currentWorkload);
      this.performanceHistory.push(performanceMetrics);
      
      // Trim history to analysis window
      const maxHistorySize = this.options.analysisWindowMinutes;
      if (this.workloadHistory.length > maxHistorySize) {
        this.workloadHistory = this.workloadHistory.slice(-maxHistorySize);
        this.performanceHistory = this.performanceHistory.slice(-maxHistorySize);
      }
      
      // Check if adaptation is needed
      if (!this.shouldAdapt()) {
        return;
      }
      
      // Generate new settings
      const newSettings = this.generateOptimalSettings(currentWorkload, performanceMetrics);
      
      // Apply gradual changes
      const adjustedSettings = this.applyGradualAdjustment(this.currentSettings, newSettings);
      
      // Validate settings
      const validatedSettings = this.validateSettings(adjustedSettings);
      
      // Apply settings
      const oldSettings = { ...this.currentSettings };
      this.currentSettings = validatedSettings;
      
      // Update metrics
      this.updateAdaptationMetrics(oldSettings, validatedSettings, performanceMetrics);
      
      // Emit change event
      this.emit('settings-adapted', {
        oldSettings,
        newSettings: validatedSettings,
        workload: currentWorkload,
        reason: 'automatic-adaptation'
      });
      
      logger.info('Configuration adapted', {
        component: 'AdaptiveConfigManager',
        changes: this.getSettingsChanges(oldSettings, validatedSettings)
      });
      
    } catch (error) {
      logger.error('Failed to perform adaptation', {
        component: 'AdaptiveConfigManager',
        error: (error as Error).message
      });
    }
  }

  /**
   * Analyze current workload characteristics
   */
  private analyzeCurrentWorkload(): WorkloadCharacteristics {
    const performanceMetrics = this.dashboard.getCurrentMetrics();
    
    // Analyze data size based on throughput and processing time
    const dataSize = this.classifyDataSize(performanceMetrics);
    
    // Analyze complexity based on processing time and resource usage
    const complexity = this.classifyComplexity(performanceMetrics);
    
    // Analyze I/O pattern based on streaming metrics
    const ioPattern = this.classifyIOPattern(performanceMetrics);
    
    // Analyze memory pressure
    const memoryPressure = this.classifyMemoryPressure(performanceMetrics);
    
    // Analyze concurrency level
    const concurrencyLevel = this.classifyConcurrencyLevel(performanceMetrics);
    
    // Analyze error rate
    const errorRate = this.classifyErrorRate(performanceMetrics);
    
    return {
      dataSize,
      complexity,
      ioPattern,
      memoryPressure,
      concurrencyLevel,
      errorRate
    };
  }

  /**
   * Classification helper methods
   */
  private classifyDataSize(metrics: any): 'small' | 'medium' | 'large' | 'huge' {
    const bytesProcessed = metrics.performance.streaming.totalBytesProcessed;
    
    if (bytesProcessed < 10 * 1024 * 1024) return 'small'; // < 10MB
    if (bytesProcessed < 100 * 1024 * 1024) return 'medium'; // < 100MB
    if (bytesProcessed < 1024 * 1024 * 1024) return 'large'; // < 1GB
    return 'huge'; // >= 1GB
  }

  private classifyComplexity(metrics: any): 'simple' | 'moderate' | 'complex' | 'very-complex' {
    const avgExecutionTime = metrics.performance.averageExecutionTime;
    const memoryEfficiency = metrics.performance.memoryEfficiency;
    
    const complexityScore = (avgExecutionTime / 1000) + (1 - memoryEfficiency) * 10;
    
    if (complexityScore < 1) return 'simple';
    if (complexityScore < 3) return 'moderate';
    if (complexityScore < 7) return 'complex';
    return 'very-complex';
  }

  private classifyIOPattern(metrics: any): 'sequential' | 'random' | 'mixed' {
    const streamingSpeed = metrics.performance.streaming.averageStreamingSpeed;
    const activeStreams = metrics.performance.streaming.activeStreams;
    
    // Simple heuristic based on streaming characteristics
    if (activeStreams <= 1) return 'sequential';
    if (streamingSpeed > 50) return 'sequential'; // High speed suggests sequential
    return 'mixed';
  }

  private classifyMemoryPressure(metrics: any): 'low' | 'medium' | 'high' | 'critical' {
    const memoryPercentage = metrics.system.memoryUsage.percentage;
    
    if (memoryPercentage < 50) return 'low';
    if (memoryPercentage < 70) return 'medium';
    if (memoryPercentage < 90) return 'high';
    return 'critical';
  }

  private classifyConcurrencyLevel(metrics: any): 'single' | 'low' | 'medium' | 'high' {
    const activeWorkers = metrics.performance.parallelWorkers.active;
    const totalWorkers = metrics.performance.parallelWorkers.total;
    
    if (totalWorkers <= 1) return 'single';
    
    const utilization = totalWorkers > 0 ? activeWorkers / totalWorkers : 0;
    
    if (utilization < 0.3) return 'low';
    if (utilization < 0.7) return 'medium';
    return 'high';
  }

  private classifyErrorRate(metrics: any): 'minimal' | 'low' | 'moderate' | 'high' {
    const errorRate = metrics.performance.totalOperations > 0 ? 
      (metrics.performance.failedOperations / metrics.performance.totalOperations) * 100 : 0;
    
    if (errorRate < 1) return 'minimal';
    if (errorRate < 5) return 'low';
    if (errorRate < 15) return 'moderate';
    return 'high';
  }

  /**
   * Check if adaptation should be performed
   */
  private shouldAdapt(): boolean {
    // Need sufficient history
    if (this.performanceHistory.length < 3) {
      return false;
    }
    
    // Check stability threshold
    const recentMetrics = this.performanceHistory.slice(-3);
    const stability = this.calculateStability(recentMetrics);
    
    if (stability > this.options.stabilityThreshold) {
      return false; // Too unstable
    }
    
    // Check if performance is degrading
    const trend = this.calculatePerformanceTrend(recentMetrics);
    
    return trend === 'degrading' || trend === 'suboptimal';
  }

  /**
   * Calculate stability score from metrics
   */
  private calculateStability(metrics: any[]): number {
    if (metrics.length < 2) return 0;
    
    const throughputs = metrics.map(m => m.performance.throughputPerSecond);
    const mean = throughputs.reduce((sum, val) => sum + val, 0) / throughputs.length;
    const variance = throughputs.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / throughputs.length;
    const stdDev = Math.sqrt(variance);
    
    return mean > 0 ? stdDev / mean : 0; // Coefficient of variation
  }

  /**
   * Calculate performance trend
   */
  private calculatePerformanceTrend(metrics: any[]): 'improving' | 'stable' | 'degrading' | 'suboptimal' {
    if (metrics.length < 2) return 'stable';
    
    const recent = metrics[metrics.length - 1];
    const previous = metrics[metrics.length - 2];
    
    const throughputChange = (recent.performance.throughputPerSecond - previous.performance.throughputPerSecond) / 
                            Math.max(previous.performance.throughputPerSecond, 1);
    
    const memoryChange = recent.system.memoryUsage.percentage - previous.system.memoryUsage.percentage;
    const errorChange = recent.performance.failedOperations - previous.performance.failedOperations;
    
    // Combined score
    const score = throughputChange - (memoryChange / 100) - (errorChange / 10);
    
    if (score > 0.1) return 'improving';
    if (score < -0.1) return 'degrading';
    if (recent.system.memoryUsage.percentage > 80 || recent.performance.averageExecutionTime > 5000) {
      return 'suboptimal';
    }
    return 'stable';
  }

  /**
   * Generate optimal settings for workload
   */
  private generateOptimalSettings(
    workload: WorkloadCharacteristics,
    performanceMetrics: any
  ): ConfigurationSettings {
    const settings: ConfigurationSettings = {};
    
    // Worker pool optimization
    settings.maxWorkers = this.optimizeWorkerCount(workload, performanceMetrics);
    settings.taskTimeout = this.optimizeTaskTimeout(workload);
    
    // Memory optimization
    settings.memoryLimitMB = this.optimizeMemoryLimit(workload, performanceMetrics);
    settings.chunkSize = this.optimizeChunkSize(workload);
    
    // Streaming optimization
    settings.streamingBatchSize = this.optimizeStreamingBatch(workload);
    settings.maxConcurrentStreams = this.optimizeConcurrentStreams(workload);
    
    // Error reduction optimization
    settings.circuitBreakerThreshold = this.optimizeCircuitBreakerThreshold(workload);
    settings.retryAttempts = this.optimizeRetryAttempts(workload);
    
    // Format-specific optimization
    settings.parquetBatchSize = this.optimizeFormatBatchSize(workload, 'parquet');
    settings.excelWorksheetBatchSize = this.optimizeFormatBatchSize(workload, 'excel');
    settings.jsonArrayBatchSize = this.optimizeFormatBatchSize(workload, 'json');
    
    return settings;
  }

  /**
   * Optimization helper methods
   */
  private optimizeWorkerCount(workload: WorkloadCharacteristics, metrics: any): number {
    const cpuCount = require('os').cpus().length;
    let optimal = Math.max(2, cpuCount - 1);
    
    // Adjust based on workload
    switch (workload.concurrencyLevel) {
      case 'single':
        optimal = 1;
        break;
      case 'low':
        optimal = Math.max(2, Math.floor(cpuCount * 0.5));
        break;
      case 'medium':
        optimal = Math.max(2, Math.floor(cpuCount * 0.75));
        break;
      case 'high':
        optimal = cpuCount;
        break;
    }
    
    // Adjust for memory pressure
    if (workload.memoryPressure === 'high' || workload.memoryPressure === 'critical') {
      optimal = Math.max(1, Math.floor(optimal * 0.7));
    }
    
    return optimal;
  }

  private optimizeTaskTimeout(workload: WorkloadCharacteristics): number {
    let timeout = 60000; // Default 60 seconds
    
    switch (workload.complexity) {
      case 'simple':
        timeout = 30000;
        break;
      case 'moderate':
        timeout = 60000;
        break;
      case 'complex':
        timeout = 120000;
        break;
      case 'very-complex':
        timeout = 300000;
        break;
    }
    
    // Adjust for data size
    if (workload.dataSize === 'large' || workload.dataSize === 'huge') {
      timeout *= 2;
    }
    
    return timeout;
  }

  private optimizeMemoryLimit(workload: WorkloadCharacteristics, metrics: any): number {
    let limit = 256; // Default 256MB
    
    // Base on current usage
    const currentUsageMB = (metrics.system.memoryUsage.used / (1024 * 1024));
    
    // Adjust for workload
    switch (workload.dataSize) {
      case 'small':
        limit = Math.max(128, Math.floor(currentUsageMB * 1.2));
        break;
      case 'medium':
        limit = Math.max(256, Math.floor(currentUsageMB * 1.5));
        break;
      case 'large':
        limit = Math.max(512, Math.floor(currentUsageMB * 2));
        break;
      case 'huge':
        limit = Math.max(1024, Math.floor(currentUsageMB * 3));
        break;
    }
    
    // Adjust for memory pressure
    if (workload.memoryPressure === 'high' || workload.memoryPressure === 'critical') {
      limit = Math.floor(limit * 0.8);
    }
    
    return limit;
  }

  private optimizeChunkSize(workload: WorkloadCharacteristics): number {
    let chunkSize = 64 * 1024; // Default 64KB
    
    switch (workload.ioPattern) {
      case 'sequential':
        chunkSize = 128 * 1024; // Larger chunks for sequential
        break;
      case 'random':
        chunkSize = 32 * 1024; // Smaller chunks for random
        break;
      case 'mixed':
        chunkSize = 64 * 1024; // Balanced
        break;
    }
    
    // Adjust for memory pressure
    if (workload.memoryPressure === 'high' || workload.memoryPressure === 'critical') {
      chunkSize = Math.floor(chunkSize * 0.5);
    }
    
    return chunkSize;
  }

  private optimizeStreamingBatch(workload: WorkloadCharacteristics): number {
    let batchSize = 1000;
    
    switch (workload.dataSize) {
      case 'small':
        batchSize = 500;
        break;
      case 'medium':
        batchSize = 1000;
        break;
      case 'large':
        batchSize = 2000;
        break;
      case 'huge':
        batchSize = 5000;
        break;
    }
    
    // Adjust for memory pressure
    if (workload.memoryPressure === 'high' || workload.memoryPressure === 'critical') {
      batchSize = Math.floor(batchSize * 0.5);
    }
    
    return batchSize;
  }

  private optimizeConcurrentStreams(workload: WorkloadCharacteristics): number {
    let streams = 3;
    
    switch (workload.concurrencyLevel) {
      case 'single':
        streams = 1;
        break;
      case 'low':
        streams = 2;
        break;
      case 'medium':
        streams = 3;
        break;
      case 'high':
        streams = 5;
        break;
    }
    
    // Adjust for memory pressure
    if (workload.memoryPressure === 'high' || workload.memoryPressure === 'critical') {
      streams = Math.max(1, Math.floor(streams * 0.6));
    }
    
    return streams;
  }

  private optimizeCircuitBreakerThreshold(workload: WorkloadCharacteristics): number {
    let threshold = 5;
    
    switch (workload.errorRate) {
      case 'minimal':
        threshold = 3;
        break;
      case 'low':
        threshold = 5;
        break;
      case 'moderate':
        threshold = 8;
        break;
      case 'high':
        threshold = 10;
        break;
    }
    
    return threshold;
  }

  private optimizeRetryAttempts(workload: WorkloadCharacteristics): number {
    let retries = 3;
    
    switch (workload.errorRate) {
      case 'minimal':
        retries = 2;
        break;
      case 'low':
        retries = 3;
        break;
      case 'moderate':
        retries = 4;
        break;
      case 'high':
        retries = 5;
        break;
    }
    
    return retries;
  }

  private optimizeFormatBatchSize(workload: WorkloadCharacteristics, format: string): number {
    const baseSizes = {
      parquet: 10000,
      excel: 1000,
      json: 1000
    };
    
    let batchSize = baseSizes[format as keyof typeof baseSizes] || 1000;
    
    // Adjust for data size
    switch (workload.dataSize) {
      case 'small':
        batchSize = Math.floor(batchSize * 0.5);
        break;
      case 'medium':
        batchSize = batchSize;
        break;
      case 'large':
        batchSize = Math.floor(batchSize * 1.5);
        break;
      case 'huge':
        batchSize = Math.floor(batchSize * 2);
        break;
    }
    
    // Adjust for memory pressure
    if (workload.memoryPressure === 'high' || workload.memoryPressure === 'critical') {
      batchSize = Math.floor(batchSize * 0.7);
    }
    
    return Math.max(100, batchSize);
  }

  /**
   * Apply gradual adjustment to prevent sudden changes
   */
  private applyGradualAdjustment(
    current: ConfigurationSettings,
    target: ConfigurationSettings
  ): ConfigurationSettings {
    const adjusted: ConfigurationSettings = {};
    const maxChange = this.options.maxAdjustmentPercentage / 100;
    
    for (const [key, targetValue] of Object.entries(target)) {
      const currentValue = current[key as keyof ConfigurationSettings];
      
      if (typeof targetValue === 'number' && typeof currentValue === 'number') {
        const maxChangeAmount = currentValue * maxChange;
        const change = targetValue - currentValue;
        const limitedChange = Math.sign(change) * Math.min(Math.abs(change), maxChangeAmount);
        
        adjusted[key as keyof ConfigurationSettings] = Math.round(currentValue + limitedChange) as any;
      } else {
        adjusted[key as keyof ConfigurationSettings] = targetValue;
      }
    }
    
    return adjusted;
  }

  /**
   * Validate settings to ensure they're within reasonable bounds
   */
  private validateSettings(settings: ConfigurationSettings): ConfigurationSettings {
    const validated = { ...settings };
    
    // Validate worker count
    if (validated.maxWorkers) {
      validated.maxWorkers = Math.max(1, Math.min(32, validated.maxWorkers));
    }
    
    // Validate memory limit
    if (validated.memoryLimitMB) {
      validated.memoryLimitMB = Math.max(64, Math.min(4096, validated.memoryLimitMB));
    }
    
    // Validate timeouts
    if (validated.taskTimeout) {
      validated.taskTimeout = Math.max(5000, Math.min(600000, validated.taskTimeout));
    }
    
    // Validate batch sizes
    if (validated.streamingBatchSize) {
      validated.streamingBatchSize = Math.max(100, Math.min(50000, validated.streamingBatchSize));
    }
    
    return validated;
  }

  /**
   * Find best matching performance profile
   */
  private findBestMatchingProfile(workload: WorkloadCharacteristics): PerformanceProfile | null {
    let bestMatch: PerformanceProfile | null = null;
    let bestScore = 0;
    
    for (const profile of this.profiles.values()) {
      const score = this.calculateProfileMatchScore(workload, profile.targetWorkload);
      
      if (score > bestScore) {
        bestScore = score;
        bestMatch = profile;
      }
    }
    
    return bestScore > 0.7 ? bestMatch : null; // Require 70% match
  }

  /**
   * Calculate how well a profile matches the workload
   */
  private calculateProfileMatchScore(
    workload: WorkloadCharacteristics,
    target: Partial<WorkloadCharacteristics>
  ): number {
    let matches = 0;
    let total = 0;
    
    for (const [key, value] of Object.entries(target)) {
      total++;
      if (workload[key as keyof WorkloadCharacteristics] === value) {
        matches++;
      }
    }
    
    return total > 0 ? matches / total : 0;
  }

  /**
   * Generate adaptive settings without profile
   */
  private generateAdaptiveSettings(workload: WorkloadCharacteristics): ConfigurationSettings {
    // This would implement a more sophisticated algorithm
    // For now, use the same optimization logic
    return this.generateOptimalSettings(workload, this.dashboard.getCurrentMetrics());
  }

  /**
   * Update adaptation metrics
   */
  private updateAdaptationMetrics(
    oldSettings: ConfigurationSettings,
    newSettings: ConfigurationSettings,
    performanceMetrics: any
  ): void {
    this.metrics.adjustmentsMade++;
    this.metrics.lastAdjustmentTime = Date.now();
    
    // Calculate performance improvement (simplified)
    const changes = this.getSettingsChanges(oldSettings, newSettings);
    this.metrics.recommendedChanges = Object.keys(changes);
    
    // Update stability score
    if (this.performanceHistory.length >= 3) {
      this.metrics.stabilityScore = 1 - this.calculateStability(this.performanceHistory.slice(-3));
    }
    
    // Update current profile
    const currentWorkload = this.analyzeCurrentWorkload();
    const matchingProfile = this.findBestMatchingProfile(currentWorkload);
    this.metrics.currentProfile = matchingProfile ? matchingProfile.name : 'adaptive';
  }

  /**
   * Get changes between settings
   */
  private getSettingsChanges(old: ConfigurationSettings, current: ConfigurationSettings): any {
    const changes: any = {};
    
    for (const [key, value] of Object.entries(current)) {
      const oldValue = old[key as keyof ConfigurationSettings];
      if (oldValue !== value) {
        changes[key] = { from: oldValue, to: value };
      }
    }
    
    return changes;
  }

  /**
   * Initialize default performance profiles
   */
  private initializeProfiles(): void {
    // High-throughput profile
    this.addProfile({
      name: 'high-throughput',
      description: 'Optimized for maximum throughput with large datasets',
      priority: 1,
      targetWorkload: {
        dataSize: 'large',
        concurrencyLevel: 'high',
        memoryPressure: 'low'
      },
      settings: {
        maxWorkers: require('os').cpus().length,
        memoryLimitMB: 1024,
        streamingBatchSize: 5000,
        maxConcurrentStreams: 5,
        parquetBatchSize: 20000,
        excelWorksheetBatchSize: 2000,
        jsonArrayBatchSize: 2000
      }
    });
    
    // Memory-constrained profile
    this.addProfile({
      name: 'memory-efficient',
      description: 'Optimized for low memory usage',
      priority: 2,
      targetWorkload: {
        memoryPressure: 'high',
        dataSize: 'medium'
      },
      settings: {
        maxWorkers: 2,
        memoryLimitMB: 128,
        streamingBatchSize: 500,
        maxConcurrentStreams: 1,
        parquetBatchSize: 5000,
        excelWorksheetBatchSize: 500,
        jsonArrayBatchSize: 500
      }
    });
    
    // Error-resilient profile
    this.addProfile({
      name: 'error-resilient',
      description: 'Optimized for high error rate scenarios',
      priority: 3,
      targetWorkload: {
        errorRate: 'high',
        complexity: 'complex'
      },
      settings: {
        circuitBreakerThreshold: 10,
        retryAttempts: 5,
        taskTimeout: 300000,
        streamingBatchSize: 1000
      }
    });
  }

  /**
   * Initialize metrics
   */
  private initializeMetrics(): AdaptationMetrics {
    return {
      adjustmentsMade: 0,
      performanceImprovement: 0,
      stabilityScore: 1,
      learningAccuracy: 0,
      lastAdjustmentTime: 0,
      currentProfile: 'baseline',
      recommendedChanges: []
    };
  }

  /**
   * Cleanup and shutdown
   */
  async shutdown(): Promise<void> {
    this.stop();
    this.removeAllListeners();
    this.workloadHistory = [];
    this.performanceHistory = [];
    this.profiles.clear();
    
    logger.info('Adaptive configuration manager shutdown', {
      component: 'AdaptiveConfigManager'
    });
  }
}

/**
 * Global adaptive configuration manager instance
 */
let globalAdaptiveConfig: AdaptiveConfigurationManager | null = null;

/**
 * Get or create global adaptive configuration manager
 */
export function getGlobalAdaptiveConfigManager(options?: AdaptiveConfigOptions): AdaptiveConfigurationManager {
  if (!globalAdaptiveConfig) {
    globalAdaptiveConfig = new AdaptiveConfigurationManager(options);
  }
  return globalAdaptiveConfig;
}

/**
 * Shutdown global adaptive configuration manager
 */
export async function shutdownGlobalAdaptiveConfigManager(): Promise<void> {
  if (globalAdaptiveConfig) {
    await globalAdaptiveConfig.shutdown();
    globalAdaptiveConfig = null;
  }
}