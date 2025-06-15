/**
 * Smart Resource Manager - Automatic system resource detection and configuration
 * Addresses GitHub issue #23: Smart performance defaults and auto-configuration
 */

import * as os from 'os';
import * as fs from 'fs';
import { logger } from '../utils/logger';

export interface SystemResources {
  totalMemoryGB: number;
  freeMemoryGB: number;
  cpuCount: number;
  cpuLoadAverage: number;
  nodeVersion: string;
  platform: string;
  arch: string;
}

export interface PerformanceProfile {
  name: string;
  description: string;
  maxMemoryMB: number;
  chunkSize: number;
  enableParallel: boolean;
  enableCaching: boolean;
  maxWorkers: number;
  aggressiveCleanup: boolean;
  streamingOptimizations: boolean;
}

export interface AutoConfigResult {
  detectedResources: SystemResources;
  selectedProfile: PerformanceProfile;
  customizations: Record<string, any>;
  recommendations: string[];
  warnings: string[];
}

export class SmartResourceManager {
  private cachedResources?: SystemResources;
  private lastDetectionTime = 0;
  private readonly CACHE_DURATION_MS = 30000; // 30 seconds

  /**
   * Auto-configure DataPilot based on system resources
   */
  async autoConfigurePerformance(fileSizeMB?: number): Promise<AutoConfigResult> {
    logger.info('Starting smart performance auto-configuration...');
    
    const resources = await this.detectSystemResources();
    const profile = this.selectOptimalProfile(resources, fileSizeMB);
    const customizations = this.generateCustomizations(resources, profile, fileSizeMB);
    const { recommendations, warnings } = this.generateGuidance(resources, profile, fileSizeMB);

    const result: AutoConfigResult = {
      detectedResources: resources,
      selectedProfile: profile,
      customizations,
      recommendations,
      warnings,
    };

    this.logAutoConfiguration(result);
    return result;
  }

  /**
   * Detect current system resources with caching
   */
  async detectSystemResources(): Promise<SystemResources> {
    const now = Date.now();
    
    // Return cached resources if recent
    if (this.cachedResources && (now - this.lastDetectionTime) < this.CACHE_DURATION_MS) {
      return this.cachedResources;
    }

    const totalMemoryBytes = os.totalmem();
    const freeMemoryBytes = os.freemem();
    const loadAvg = os.loadavg();

    const resources: SystemResources = {
      totalMemoryGB: Math.round((totalMemoryBytes / (1024 ** 3)) * 100) / 100,
      freeMemoryGB: Math.round((freeMemoryBytes / (1024 ** 3)) * 100) / 100,
      cpuCount: os.cpus().length,
      cpuLoadAverage: loadAvg[0], // 1-minute average
      nodeVersion: process.version,
      platform: os.platform(),
      arch: os.arch(),
    };

    // Cache the results
    this.cachedResources = resources;
    this.lastDetectionTime = now;

    return resources;
  }

  /**
   * Select optimal performance profile based on system resources
   */
  private selectOptimalProfile(resources: SystemResources, fileSizeMB?: number): PerformanceProfile {
    const profiles = this.getPerformanceProfiles();
    
    // Score each profile based on system resources
    const scores = profiles.map(profile => ({
      profile,
      score: this.calculateProfileScore(profile, resources, fileSizeMB),
    }));

    // Sort by score (highest first)
    scores.sort((a, b) => b.score - a.score);
    
    logger.info(`Selected performance profile: ${scores[0].profile.name} (score: ${scores[0].score})`);
    return scores[0].profile;
  }

  /**
   * Calculate suitability score for a performance profile
   */
  private calculateProfileScore(
    profile: PerformanceProfile,
    resources: SystemResources,
    fileSizeMB?: number,
  ): number {
    let score = 100;

    // Memory considerations
    const requiredMemoryGB = profile.maxMemoryMB / 1024;
    const memoryUtilization = requiredMemoryGB / resources.freeMemoryGB;
    
    if (memoryUtilization > 0.8) {
      score -= 30; // Heavy penalty for memory pressure
    } else if (memoryUtilization > 0.5) {
      score -= 15; // Moderate penalty
    } else if (memoryUtilization < 0.2) {
      score -= 5; // Small penalty for underutilization
    }

    // CPU considerations
    if (profile.enableParallel && resources.cpuCount < 4) {
      score -= 20; // Penalty for parallel processing on few cores
    }
    
    if (profile.maxWorkers > resources.cpuCount) {
      score -= 10; // Penalty for more workers than cores
    }

    // File size considerations
    if (fileSizeMB) {
      if (profile.name === 'ultra-large-files' && fileSizeMB < 1000) {
        score -= 25; // Overkill for smaller files
      }
      
      if (profile.name === 'speed-optimized' && fileSizeMB > 5000) {
        score -= 20; // Not suitable for very large files
      }
      
      if (profile.name === 'memory-constrained' && resources.freeMemoryGB > 8) {
        score -= 15; // Unnecessary constraints
      }
    }

    // Load average considerations
    if (resources.cpuLoadAverage > 2.0 && profile.enableParallel) {
      score -= 15; // System already under load
    }

    // Platform-specific adjustments
    if (resources.platform === 'win32' && profile.enableParallel) {
      score -= 5; // Slightly lower score for Windows parallel processing
    }

    return Math.max(0, score);
  }

  /**
   * Generate customizations based on system characteristics
   */
  private generateCustomizations(
    resources: SystemResources,
    profile: PerformanceProfile,
    fileSizeMB?: number,
  ): Record<string, any> {
    const customizations: Record<string, any> = {};

    // Memory customizations
    const conservativeMemory = Math.floor(resources.freeMemoryGB * 0.4 * 1024); // 40% of free memory
    const aggressiveMemory = Math.floor(resources.freeMemoryGB * 0.7 * 1024); // 70% of free memory
    
    customizations.maxMemoryMB = resources.freeMemoryGB > 8 ? aggressiveMemory : conservativeMemory;
    customizations.maxMemoryMB = Math.min(customizations.maxMemoryMB, 8192); // Cap at 8GB

    // Chunk size customizations
    const baseChunkSize = profile.chunkSize;
    if (resources.freeMemoryGB > 16) {
      customizations.chunkSize = baseChunkSize * 2; // Larger chunks for high memory
    } else if (resources.freeMemoryGB < 4) {
      customizations.chunkSize = Math.max(1000, baseChunkSize / 2); // Smaller chunks for low memory
    } else {
      customizations.chunkSize = baseChunkSize;
    }

    // Worker customizations
    if (profile.enableParallel) {
      customizations.maxWorkers = Math.min(profile.maxWorkers, Math.max(1, resources.cpuCount - 1));
      
      // Reduce workers if system is under load
      if (resources.cpuLoadAverage > 1.5) {
        customizations.maxWorkers = Math.max(1, Math.floor(customizations.maxWorkers / 2));
      }
    } else {
      customizations.maxWorkers = 1;
    }

    // Caching customizations
    customizations.enableCaching = profile.enableCaching && resources.freeMemoryGB > 2;
    
    if (customizations.enableCaching) {
      // Cache size based on available memory
      customizations.cacheSize = Math.floor(resources.freeMemoryGB * 0.1 * 1024); // 10% of free memory
      customizations.cacheSize = Math.min(customizations.cacheSize, 2048); // Cap at 2GB
    }

    // Streaming optimizations
    customizations.streamingOptimizations = profile.streamingOptimizations;
    if (fileSizeMB && fileSizeMB > 100) {
      customizations.streamingOptimizations = true; // Force for large files
    }

    // Cleanup customizations
    customizations.aggressiveCleanup = profile.aggressiveCleanup || resources.freeMemoryGB < 4;
    
    // Adaptive settings
    customizations.adaptiveChunking = resources.freeMemoryGB > 8;
    customizations.memoryMonitoring = true;
    customizations.progressReporting = true;

    return customizations;
  }

  /**
   * Generate performance guidance and warnings
   */
  private generateGuidance(
    resources: SystemResources,
    profile: PerformanceProfile,
    fileSizeMB?: number,
  ): { recommendations: string[]; warnings: string[] } {
    const recommendations: string[] = [];
    const warnings: string[] = [];

    // Memory guidance
    if (resources.freeMemoryGB < 2) {
      warnings.push('Low available memory detected. Consider closing other applications.');
      recommendations.push('Use --max-memory 512 to limit memory usage');
      recommendations.push('Process files in smaller chunks with --chunk-size 1000');
    } else if (resources.freeMemoryGB > 16) {
      recommendations.push('High memory system detected. DataPilot will use larger buffers for optimal performance');
      recommendations.push('Consider processing multiple files in parallel');
    }

    // CPU guidance
    if (resources.cpuCount === 1) {
      warnings.push('Single-core system detected. Parallel processing disabled.');
    } else if (resources.cpuCount >= 8) {
      recommendations.push('Multi-core system detected. Parallel processing enabled for optimal performance');
    }

    // Load guidance
    if (resources.cpuLoadAverage > 2.0) {
      warnings.push('High system load detected. Performance may be impacted.');
      recommendations.push('Consider running analysis during off-peak hours');
    }

    // File size guidance
    if (fileSizeMB) {
      if (fileSizeMB > 1000) {
        recommendations.push('Large file detected. Using streaming algorithms for memory efficiency');
        recommendations.push('Consider using --progressive flag for incremental analysis');
      } else if (fileSizeMB < 1) {
        recommendations.push('Small file detected. Using fast processing mode');
      }
    }

    // Platform-specific guidance
    if (resources.platform === 'win32') {
      recommendations.push('Windows system detected. Using Windows-optimized settings');
    } else if (resources.platform === 'darwin') {
      recommendations.push('macOS system detected. Using macOS-optimized settings');
    } else {
      recommendations.push('Linux system detected. Using Linux-optimized settings');
    }

    // Node.js version guidance
    const nodeVersionNum = parseFloat(resources.nodeVersion.replace('v', ''));
    if (nodeVersionNum < 16) {
      warnings.push('Older Node.js version detected. Consider upgrading for better performance');
    }

    return { recommendations, warnings };
  }

  /**
   * Get predefined performance profiles
   */
  private getPerformanceProfiles(): PerformanceProfile[] {
    return [
      {
        name: 'ultra-large-files',
        description: 'Optimized for files >10GB with minimal memory usage',
        maxMemoryMB: 512,
        chunkSize: 1000,
        enableParallel: false,
        enableCaching: false,
        maxWorkers: 1,
        aggressiveCleanup: true,
        streamingOptimizations: true,
      },
      {
        name: 'large-files',
        description: 'Balanced performance for files 1-10GB',
        maxMemoryMB: 1024,
        chunkSize: 5000,
        enableParallel: true,
        enableCaching: false,
        maxWorkers: 2,
        aggressiveCleanup: true,
        streamingOptimizations: true,
      },
      {
        name: 'balanced',
        description: 'Default balanced performance for most use cases',
        maxMemoryMB: 2048,
        chunkSize: 10000,
        enableParallel: true,
        enableCaching: true,
        maxWorkers: 4,
        aggressiveCleanup: false,
        streamingOptimizations: false,
      },
      {
        name: 'speed-optimized',
        description: 'Maximum speed for files <5GB on high-memory systems',
        maxMemoryMB: 4096,
        chunkSize: 50000,
        enableParallel: true,
        enableCaching: true,
        maxWorkers: 8,
        aggressiveCleanup: false,
        streamingOptimizations: false,
      },
      {
        name: 'memory-constrained',
        description: 'Minimal memory usage for low-resource systems',
        maxMemoryMB: 256,
        chunkSize: 1000,
        enableParallel: false,
        enableCaching: false,
        maxWorkers: 1,
        aggressiveCleanup: true,
        streamingOptimizations: true,
      },
    ];
  }

  /**
   * Log auto-configuration results
   */
  private logAutoConfiguration(result: AutoConfigResult): void {
    const { detectedResources: res, selectedProfile: profile, customizations } = result;
    
    logger.info('📊 Smart Performance Auto-Configuration Results:');
    logger.info(`  System: ${res.platform}/${res.arch}, ${res.cpuCount} cores, ${res.totalMemoryGB}GB RAM`);
    logger.info(`  Available Memory: ${res.freeMemoryGB}GB, Load: ${res.cpuLoadAverage.toFixed(2)}`);
    logger.info(`  Selected Profile: ${profile.name}`);
    logger.info(`  Memory Limit: ${customizations.maxMemoryMB}MB`);
    logger.info(`  Chunk Size: ${customizations.chunkSize} rows`);
    logger.info(`  Parallel Processing: ${customizations.maxWorkers > 1 ? 'Enabled' : 'Disabled'} (${customizations.maxWorkers} workers)`);
    logger.info(`  Caching: ${customizations.enableCaching ? 'Enabled' : 'Disabled'}`);
    
    if (result.recommendations.length > 0) {
      logger.info('💡 Recommendations:');
      result.recommendations.forEach(rec => logger.info(`  - ${rec}`));
    }
    
    if (result.warnings.length > 0) {
      logger.warn('⚠️  Warnings:');
      result.warnings.forEach(warn => logger.warn(`  - ${warn}`));
    }
  }

  /**
   * Get system information for performance dashboard
   */
  async getSystemInfo(): Promise<SystemResources & { performanceScore: number }> {
    const resources = await this.detectSystemResources();
    const performanceScore = this.calculatePerformanceScore(resources);
    
    return {
      ...resources,
      performanceScore,
    };
  }

  /**
   * Calculate overall system performance score (0-100)
   */
  private calculatePerformanceScore(resources: SystemResources): number {
    let score = 0;

    // Memory score (0-40 points)
    if (resources.freeMemoryGB >= 16) score += 40;
    else if (resources.freeMemoryGB >= 8) score += 30;
    else if (resources.freeMemoryGB >= 4) score += 20;
    else if (resources.freeMemoryGB >= 2) score += 10;
    else score += 5;

    // CPU score (0-30 points)
    if (resources.cpuCount >= 8) score += 30;
    else if (resources.cpuCount >= 4) score += 25;
    else if (resources.cpuCount >= 2) score += 15;
    else score += 5;

    // Load score (0-20 points)
    if (resources.cpuLoadAverage <= 0.5) score += 20;
    else if (resources.cpuLoadAverage <= 1.0) score += 15;
    else if (resources.cpuLoadAverage <= 2.0) score += 10;
    else score += 5;

    // Platform score (0-10 points)
    if (resources.platform === 'linux') score += 10;
    else if (resources.platform === 'darwin') score += 8;
    else score += 6; // Windows

    return Math.min(100, score);
  }

  /**
   * Check if file size requires special handling
   */
  isLargeFile(fileSizeMB: number): boolean {
    return fileSizeMB > 100; // 100MB threshold
  }

  /**
   * Get recommended command-line options for a file
   */
  async getRecommendedCLIOptions(fileSizeMB: number): Promise<string[]> {
    const config = await this.autoConfigurePerformance(fileSizeMB);
    const options: string[] = [];

    options.push(`--max-memory ${config.customizations.maxMemoryMB}`);
    options.push(`--chunk-size ${config.customizations.chunkSize}`);
    
    if (config.customizations.maxWorkers > 1) {
      options.push(`--threads ${config.customizations.maxWorkers}`);
    }
    
    if (config.customizations.enableCaching) {
      options.push('--cache');
    }
    
    if (config.customizations.streamingOptimizations) {
      options.push('--streaming');
    }

    if (this.isLargeFile(fileSizeMB)) {
      options.push('--progressive');
    }

    return options;
  }
}