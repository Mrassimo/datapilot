/**
 * Section 3 EDA Analyzer - Streaming-only implementation
 * Memory-efficient analysis using streaming algorithms
 */

import { StreamingAnalyzer } from '../streaming/streaming-analyzer';
import { logger } from '../../utils/logger';
import type {
  Section3Result,
  Section3Config,
  Section3Progress,
  Section3AnalyzerInput,
} from './types';

export class Section3Analyzer {
  private config: Section3Config;
  private progressCallback?: (progress: Section3Progress) => void;

  constructor(config: Partial<Section3Config> = {}) {
    this.config = {
      enabledAnalyses: ['univariate', 'bivariate', 'correlations'],
      significanceLevel: 0.05,
      maxCorrelationPairs: 50,
      outlierMethods: ['iqr', 'zscore', 'modified_zscore'],
      normalityTests: ['shapiro', 'jarque_bera', 'ks_test'],
      maxCategoricalLevels: 50,
      enableMultivariate: false,
      samplingThreshold: 10000,
      useStreamingAnalysis: true,
      ...config,
    };
  }

  setProgressCallback(callback: (progress: Section3Progress) => void): void {
    this.progressCallback = callback;
  }

  /**
   * Perform comprehensive Section 3 EDA analysis using streaming
   */
  async analyze(input: Section3AnalyzerInput): Promise<Section3Result> {
    logger.info('Starting Section 3 EDA analysis with streaming');

    if (!input.filePath) {
      throw new Error('Streaming analysis requires filePath in input');
    }

    const streamingAnalyzer = new StreamingAnalyzer({
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