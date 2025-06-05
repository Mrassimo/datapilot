/**
 * Environment Profiler - System context and execution tracking
 * Captures OS, runtime, resources, and performance metrics
 */

import { platform, arch, cpus, totalmem, freemem } from 'os';
import { performance } from 'perf_hooks';
import type { 
  ExecutionContext, 
  SystemEnvironment, 
  Section1Config 
} from './types';

export class EnvironmentProfiler {
  private config: Section1Config;
  private startTime: number;
  private phaseTimers: Map<string, number> = new Map();

  constructor(config: Section1Config) {
    this.config = config;
    this.startTime = performance.now();
  }

  /**
   * Start timing a specific phase
   */
  startPhase(phaseName: string): void {
    this.phaseTimers.set(phaseName, performance.now());
  }

  /**
   * End timing a specific phase and return duration
   */
  endPhase(phaseName: string): number {
    const startTime = this.phaseTimers.get(phaseName);
    if (!startTime) {
      throw new Error(`Phase '${phaseName}' was not started`);
    }
    
    const duration = performance.now() - startTime;
    this.phaseTimers.delete(phaseName);
    return duration;
  }

  /**
   * Create execution context with performance and environment data
   */
  createExecutionContext(
    command: string,
    modules: string[],
    analysisMode: string = 'Comprehensive Deep Scan'
  ): ExecutionContext {
    const now = new Date();
    const totalProcessingTime = Number(((performance.now() - this.startTime) / 1000).toFixed(3));

    const context: ExecutionContext = {
      fullCommandExecuted: command,
      analysisMode,
      analysisStartTimestamp: new Date(now.getTime() - (totalProcessingTime * 1000)),
      globalSamplingStrategy: 'Full dataset analysis (No record sampling applied for initial overview)',
      activatedModules: modules,
      processingTimeSeconds: totalProcessingTime,
    };

    // Add system environment if enabled
    if (this.config.includeHostEnvironment) {
      context.hostEnvironment = this.captureSystemEnvironment();
    }

    return context;
  }

  /**
   * Capture comprehensive system environment details
   */
  private captureSystemEnvironment(): SystemEnvironment {
    const totalMemGB = Number((totalmem() / (1024 * 1024 * 1024)).toFixed(2));
    const cpuCount = cpus().length;
    
    return {
      operatingSystem: this.getOperatingSystemDetails(),
      systemArchitecture: this.getArchitectureDetails(),
      executionRuntime: this.getRuntimeDetails(),
      availableCpuCores: cpuCount,
      availableMemoryGB: totalMemGB,
      nodeVersion: process.version,
    };
  }

  /**
   * Get detailed operating system information
   */
  private getOperatingSystemDetails(): string {
    const platformName = platform();
    const release = process.platform;
    
    switch (platformName) {
      case 'darwin':
        return `macOS (${this.getMacOSVersion()})`;
      case 'win32':
        return `Windows (${process.getuid ? 'with Unix compatibility' : 'native'})`;
      case 'linux':
        return `Linux (${release})`;
      case 'freebsd':
        return 'FreeBSD';
      case 'openbsd':
        return 'OpenBSD';
      default:
        return `${platformName} (${release})`;
    }
  }

  /**
   * Get macOS version information
   */
  private getMacOSVersion(): string {
    try {
      // This is a simplified version - in production you might want to read from system files
      const version = process.env.SYSTEM_VERSION || 'Unknown Version';
      return version;
    } catch {
      return 'macOS';
    }
  }

  /**
   * Get architecture details
   */
  private getArchitectureDetails(): string {
    const architecture = arch();
    
    switch (architecture) {
      case 'x64':
        return 'x86_64 (Intel/AMD 64-bit)';
      case 'arm64':
        return 'ARM64 (Apple Silicon/ARM 64-bit)';
      case 'arm':
        return 'ARM 32-bit';
      case 'ia32':
        return 'x86 (32-bit)';
      default:
        return architecture;
    }
  }

  /**
   * Get runtime environment details
   */
  private getRuntimeDetails(): string {
    const nodeVersion = process.version;
    const v8Version = process.versions.v8;
    const platform = process.platform;
    
    return `Node.js ${nodeVersion} (V8 ${v8Version}) on ${platform}`;
  }

  /**
   * Get current memory usage
   */
  getCurrentMemoryUsage(): {
    used: number;
    total: number;
    free: number;
    usage: number;
  } {
    const totalMem = totalmem();
    const freeMem = freemem();
    const usedMem = totalMem - freeMem;
    
    return {
      used: Number((usedMem / (1024 * 1024 * 1024)).toFixed(2)),
      total: Number((totalMem / (1024 * 1024 * 1024)).toFixed(2)),
      free: Number((freeMem / (1024 * 1024 * 1024)).toFixed(2)),
      usage: Number(((usedMem / totalMem) * 100).toFixed(1)),
    };
  }

  /**
   * Get process-specific memory usage
   */
  getProcessMemoryUsage(): {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
  } {
    const memUsage = process.memoryUsage();
    
    return {
      heapUsed: Number((memUsage.heapUsed / (1024 * 1024)).toFixed(2)),
      heapTotal: Number((memUsage.heapTotal / (1024 * 1024)).toFixed(2)),
      external: Number((memUsage.external / (1024 * 1024)).toFixed(2)),
      rss: Number((memUsage.rss / (1024 * 1024)).toFixed(2)),
    };
  }

  /**
   * Create performance summary
   */
  createPerformanceSummary(): {
    totalAnalysisTime: number;
    peakMemoryUsage?: number;
    phases: Record<string, number>;
  } {
    const processMemory = this.getProcessMemoryUsage();
    
    return {
      totalAnalysisTime: Number(((performance.now() - this.startTime) / 1000).toFixed(3)),
      peakMemoryUsage: this.config.detailedProfiling ? processMemory.rss : undefined,
      phases: this.getPhaseTimings(),
    };
  }

  /**
   * Get all recorded phase timings
   */
  private getPhaseTimings(): Record<string, number> {
    const timings: Record<string, number> = {};
    
    // Add any completed phases
    // In a real implementation, you'd track completed phases
    // For now, return empty object as phases are managed externally
    
    return timings;
  }

  /**
   * Generate module activation list
   */
  generateModuleList(enabledSections: string[]): string[] {
    const baseModules = [
      'File I/O Manager',
      'Advanced CSV Parser',
      'Metadata Collector',
      'Structural Analyzer',
    ];

    const sectionModules: Record<string, string> = {
      'quality': 'Quality Assessor',
      'eda': 'EDA Engine',
      'visualization': 'Visualization Intelligence',
      'engineering': 'Data Engineering Advisor',
      'modeling': 'Predictive Modeling Guide',
    };

    const activatedModules = [...baseModules];
    
    for (const section of enabledSections) {
      if (sectionModules[section]) {
        activatedModules.push(sectionModules[section]);
      }
    }

    activatedModules.push('Report Generator');
    
    return activatedModules;
  }

  /**
   * Check system resource availability
   */
  checkResourceAvailability(): {
    memoryAvailable: boolean;
    diskSpaceWarning: boolean;
    cpuLoadEstimate: 'low' | 'medium' | 'high';
  } {
    const memory = this.getCurrentMemoryUsage();
    
    return {
      memoryAvailable: memory.free > 1, // At least 1GB free
      diskSpaceWarning: false, // Would need additional disk space checking
      cpuLoadEstimate: this.estimateCpuLoad(),
    };
  }

  /**
   * Estimate current CPU load (simplified)
   */
  private estimateCpuLoad(): 'low' | 'medium' | 'high' {
    // This is a simplified estimation
    // In production, you might want to sample CPU usage over time
    const cpuCount = cpus().length;
    
    if (cpuCount >= 8) {
      return 'low';
    } else if (cpuCount >= 4) {
      return 'medium';
    } else {
      return 'high';
    }
  }

  /**
   * Reset profiler for new analysis
   */
  reset(): void {
    this.startTime = performance.now();
    this.phaseTimers.clear();
  }

  /**
   * Get total elapsed time since start
   */
  getElapsedTime(): number {
    return Number(((performance.now() - this.startTime) / 1000).toFixed(3));
  }
}