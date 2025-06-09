/**
 * Section 1 Analyzer - Main orchestrator for dataset overview analysis
 * Coordinates file metadata, parsing analytics, structural analysis, and environment profiling
 */
import type { Section1Result, Section1Config, Section1Progress } from './types';
export declare class Section1Analyzer {
    private config;
    private fileCollector;
    private parsingTracker;
    private structuralAnalyzer;
    private environmentProfiler;
    private progressCallback?;
    constructor(config?: Partial<Section1Config>);
    /**
     * Set progress callback for long-running operations
     */
    setProgressCallback(callback: (progress: Section1Progress) => void): void;
    /**
     * Perform comprehensive Section 1 analysis
     */
    analyze(filePath: string, command?: string, enabledSections?: string[]): Promise<Section1Result>;
    /**
     * Quick analysis for basic information (no hashing, limited profiling)
     */
    quickAnalyze(filePath: string): Promise<Section1Result>;
    /**
     * Report progress to callback if set
     */
    private reportProgress;
    /**
     * Get DataPilot version
     */
    private getDataPilotVersion;
    /**
     * Validate configuration
     */
    validateConfig(): {
        valid: boolean;
        errors: string[];
    };
    /**
     * Get current configuration
     */
    getConfig(): Section1Config;
    /**
     * Update configuration
     */
    updateConfig(newConfig: Partial<Section1Config>): void;
    /**
     * Check system requirements for analysis
     */
    checkSystemRequirements(): {
        suitable: boolean;
        warnings: string[];
        recommendations: string[];
    };
}
//# sourceMappingURL=section1-analyzer.d.ts.map