"use strict";
/**
 * Section 3 EDA Analyzer - Streaming-only implementation
 * Memory-efficient analysis using streaming algorithms
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Section3Analyzer = void 0;
const streaming_analyzer_1 = require("../streaming/streaming-analyzer");
const logger_1 = require("../../utils/logger");
class Section3Analyzer {
    config;
    progressCallback;
    constructor(config = {}) {
        this.config = {
            enabledAnalyses: ['univariate', 'bivariate', 'correlations'],
            significanceLevel: 0.05,
            maxCorrelationPairs: 50,
            outlierMethods: ['iqr', 'zscore', 'modified_zscore'],
            normalityTests: ['shapiro', 'jarque_bera', 'ks_test'],
            maxCategoricalLevels: 50,
            enableMultivariate: true,
            samplingThreshold: 10000,
            useStreamingAnalysis: true,
            ...config,
        };
    }
    setProgressCallback(callback) {
        this.progressCallback = callback;
    }
    /**
     * Perform comprehensive Section 3 EDA analysis using streaming
     */
    async analyze(input) {
        logger_1.logger.info('Starting Section 3 EDA analysis with streaming');
        if (!input.filePath) {
            throw new Error('Streaming analysis requires filePath in input');
        }
        const streamingAnalyzer = new streaming_analyzer_1.StreamingAnalyzer({
            enabledAnalyses: this.config.enabledAnalyses,
            significanceLevel: this.config.significanceLevel,
            maxCorrelationPairs: this.config.maxCorrelationPairs,
            samplingThreshold: this.config.samplingThreshold,
            chunkSize: 1000,
            memoryThresholdMB: 200,
            maxRowsAnalyzed: 1000000,
            adaptiveChunkSizing: true,
        });
        if (this.progressCallback) {
            streamingAnalyzer.setProgressCallback(this.progressCallback);
        }
        return streamingAnalyzer.analyzeFile(input.filePath);
    }
}
exports.Section3Analyzer = Section3Analyzer;
//# sourceMappingURL=section3-analyzer.js.map