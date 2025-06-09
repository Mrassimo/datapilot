/**
 * Streaming Data Analysis Engine
 * Memory-efficient analysis using online algorithms and chunk processing
 */
import type { Section3Result, Section3Config, Section3Progress } from '../eda/types';
interface StreamingAnalyzerConfig extends Section3Config {
    chunkSize: number;
    memoryThresholdMB: number;
    maxRowsAnalyzed: number;
    adaptiveChunkSizing: boolean;
}
/**
 * Main Streaming Analysis Engine
 * Processes any size dataset with constant memory usage
 */
export declare class StreamingAnalyzer {
    private config;
    private state;
    private progressCallback?;
    private columnAnalyzers;
    private bivariateAnalyzer;
    private headers;
    private detectedTypes;
    private semanticTypes;
    private warnings;
    private typeDetectionResults;
    private hasHeaders;
    private collectedData;
    private maxCollectedRows;
    constructor(config?: Partial<StreamingAnalyzerConfig>);
    setProgressCallback(callback: (progress: Section3Progress) => void): void;
    /**
     * Analyze a CSV file using streaming processing
     */
    analyzeFile(filePath: string): Promise<Section3Result>;
    /**
     * First pass: Quick scan for headers, types, and basic metadata
     */
    private firstPass;
    /**
     * Main streaming pass: Process data in chunks
     */
    private streamingPass;
    /**
     * Process a single chunk of data
     */
    private processChunk;
    /**
     * Perform aggressive memory cleanup
     */
    private performMemoryCleanup;
    /**
     * Adaptive memory management with aggressive cleanup
     */
    private manageMemory;
    /**
     * Finalize analysis and generate results
     */
    private finalizeResults;
    private extractHeaders;
    private detectColumnTypes;
    private inferSemanticTypes;
    private initializeColumnAnalyzers;
    private initializeBivariateAnalysis;
    private generateStreamingInsights;
    private reportProgress;
    /**
     * Handle analysis errors with graceful degradation
     */
    private handleAnalysisError;
    /**
     * Create a degraded result when full analysis fails
     */
    private createDegradedResult;
    /**
     * Check if multivariate data should be collected
     */
    private shouldCollectMultivariateData;
    /**
     * Collect data for multivariate analysis with memory-efficient approach
     */
    private collectMultivariateData;
    /**
     * Handle memory pressure for multivariate data collection
     */
    private handleMultivariateMemoryPressure;
    /**
     * Perform multivariate analysis with enhanced type safety
     */
    private performMultivariateAnalysis;
    /**
     * Create minimal multivariate analysis when disabled or insufficient data
     */
    private createMinimalMultivariateAnalysis;
    /**
     * Validate analyzer state before operations
     */
    private validateAnalyzerState;
}
/**
 * Convenience function to analyze a file using streaming approach
 */
export declare function analyzeFileStreaming(filePath: string, config?: Partial<StreamingAnalyzerConfig>): Promise<Section3Result>;
export {};
//# sourceMappingURL=streaming-analyzer.d.ts.map