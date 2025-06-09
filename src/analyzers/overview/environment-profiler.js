"use strict";
/**
 * Environment Profiler - System context and execution tracking
 * Captures OS, runtime, resources, and performance metrics
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnvironmentProfiler = void 0;
const os_1 = require("os");
const perf_hooks_1 = require("perf_hooks");
class EnvironmentProfiler {
    config;
    startTime;
    phaseTimers = new Map();
    constructor(config) {
        this.config = config;
        this.startTime = perf_hooks_1.performance.now();
    }
    /**
     * Start timing a specific phase
     */
    startPhase(phaseName) {
        this.phaseTimers.set(phaseName, perf_hooks_1.performance.now());
    }
    /**
     * End timing a specific phase and return duration
     */
    endPhase(phaseName) {
        const startTime = this.phaseTimers.get(phaseName);
        if (!startTime) {
            throw new Error(`Phase '${phaseName}' was not started`);
        }
        const duration = perf_hooks_1.performance.now() - startTime;
        this.phaseTimers.delete(phaseName);
        return duration;
    }
    /**
     * Create execution context with performance and environment data
     */
    createExecutionContext(command, modules, analysisMode = 'Comprehensive Deep Scan') {
        const now = new Date();
        const totalProcessingTime = Number(((perf_hooks_1.performance.now() - this.startTime) / 1000).toFixed(3));
        const context = {
            fullCommandExecuted: command,
            analysisMode,
            analysisStartTimestamp: new Date(now.getTime() - totalProcessingTime * 1000),
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
    captureSystemEnvironment() {
        const totalMemGB = Number(((0, os_1.totalmem)() / (1024 * 1024 * 1024)).toFixed(2));
        const cpuCount = (0, os_1.cpus)().length;
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
    getOperatingSystemDetails() {
        const platformName = (0, os_1.platform)();
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
    getMacOSVersion() {
        try {
            // This is a simplified version - in production you might want to read from system files
            const version = process.env.SYSTEM_VERSION || 'Unknown Version';
            return version;
        }
        catch {
            return 'macOS';
        }
    }
    /**
     * Get architecture details
     */
    getArchitectureDetails() {
        const architecture = (0, os_1.arch)();
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
    getRuntimeDetails() {
        const nodeVersion = process.version;
        const v8Version = process.versions.v8;
        const platform = process.platform;
        return `Node.js ${nodeVersion} (V8 ${v8Version}) on ${platform}`;
    }
    /**
     * Get current memory usage
     */
    getCurrentMemoryUsage() {
        const totalMem = (0, os_1.totalmem)();
        const freeMem = (0, os_1.freemem)();
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
    getProcessMemoryUsage() {
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
    createPerformanceSummary() {
        const processMemory = this.getProcessMemoryUsage();
        return {
            totalAnalysisTime: Number(((perf_hooks_1.performance.now() - this.startTime) / 1000).toFixed(3)),
            peakMemoryUsage: this.config.detailedProfiling ? processMemory.rss : undefined,
            phases: this.getPhaseTimings(),
        };
    }
    /**
     * Get all recorded phase timings
     */
    getPhaseTimings() {
        const timings = {};
        // Add any completed phases
        // In a real implementation, you'd track completed phases
        // For now, return empty object as phases are managed externally
        return timings;
    }
    /**
     * Generate module activation list
     */
    generateModuleList(enabledSections) {
        const baseModules = [
            'File I/O Manager',
            'Advanced CSV Parser',
            'Metadata Collector',
            'Structural Analyzer',
        ];
        const sectionModules = {
            quality: 'Quality Assessor',
            eda: 'EDA Engine',
            visualization: 'Visualization Intelligence',
            engineering: 'Data Engineering Advisor',
            modeling: 'Predictive Modeling Guide',
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
    checkResourceAvailability() {
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
    estimateCpuLoad() {
        // This is a simplified estimation
        // In production, you might want to sample CPU usage over time
        const cpuCount = (0, os_1.cpus)().length;
        if (cpuCount >= 8) {
            return 'low';
        }
        else if (cpuCount >= 4) {
            return 'medium';
        }
        else {
            return 'high';
        }
    }
    /**
     * Reset profiler for new analysis
     */
    reset() {
        this.startTime = perf_hooks_1.performance.now();
        this.phaseTimers.clear();
    }
    /**
     * Get total elapsed time since start
     */
    getElapsedTime() {
        return Number(((perf_hooks_1.performance.now() - this.startTime) / 1000).toFixed(3));
    }
}
exports.EnvironmentProfiler = EnvironmentProfiler;
//# sourceMappingURL=environment-profiler.js.map