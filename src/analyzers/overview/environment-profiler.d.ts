/**
 * Environment Profiler - System context and execution tracking
 * Captures OS, runtime, resources, and performance metrics
 */
import type { ExecutionContext, Section1Config } from './types';
export declare class EnvironmentProfiler {
    private config;
    private startTime;
    private phaseTimers;
    constructor(config: Section1Config);
    /**
     * Start timing a specific phase
     */
    startPhase(phaseName: string): void;
    /**
     * End timing a specific phase and return duration
     */
    endPhase(phaseName: string): number;
    /**
     * Create execution context with performance and environment data
     */
    createExecutionContext(command: string, modules: string[], analysisMode?: string): ExecutionContext;
    /**
     * Capture comprehensive system environment details
     */
    private captureSystemEnvironment;
    /**
     * Get detailed operating system information
     */
    private getOperatingSystemDetails;
    /**
     * Get macOS version information
     */
    private getMacOSVersion;
    /**
     * Get architecture details
     */
    private getArchitectureDetails;
    /**
     * Get runtime environment details
     */
    private getRuntimeDetails;
    /**
     * Get current memory usage
     */
    getCurrentMemoryUsage(): {
        used: number;
        total: number;
        free: number;
        usage: number;
    };
    /**
     * Get process-specific memory usage
     */
    getProcessMemoryUsage(): {
        heapUsed: number;
        heapTotal: number;
        external: number;
        rss: number;
    };
    /**
     * Create performance summary
     */
    createPerformanceSummary(): {
        totalAnalysisTime: number;
        peakMemoryUsage?: number;
        phases: Record<string, number>;
    };
    /**
     * Get all recorded phase timings
     */
    private getPhaseTimings;
    /**
     * Generate module activation list
     */
    generateModuleList(enabledSections: string[]): string[];
    /**
     * Check system resource availability
     */
    checkResourceAvailability(): {
        memoryAvailable: boolean;
        diskSpaceWarning: boolean;
        cpuLoadEstimate: 'low' | 'medium' | 'high';
    };
    /**
     * Estimate current CPU load (simplified)
     */
    private estimateCpuLoad;
    /**
     * Reset profiler for new analysis
     */
    reset(): void;
    /**
     * Get total elapsed time since start
     */
    getElapsedTime(): number;
}
//# sourceMappingURL=environment-profiler.d.ts.map