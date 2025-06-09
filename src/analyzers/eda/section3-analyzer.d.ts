/**
 * Section 3 EDA Analyzer - Streaming-only implementation
 * Memory-efficient analysis using streaming algorithms
 */
import type { Section3Result, Section3Config, Section3Progress, Section3AnalyzerInput } from './types';
export declare class Section3Analyzer {
    private config;
    private progressCallback?;
    constructor(config?: Partial<Section3Config>);
    setProgressCallback(callback: (progress: Section3Progress) => void): void;
    /**
     * Perform comprehensive Section 3 EDA analysis using streaming
     */
    analyze(input: Section3AnalyzerInput): Promise<Section3Result>;
}
//# sourceMappingURL=section3-analyzer.d.ts.map