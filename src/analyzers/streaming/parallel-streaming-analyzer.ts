/**
 * Parallel Streaming Analyzer
 * High-performance streaming analysis with parallel processing capabilities
 */

import { EventEmitter } from 'events';
import { performance } from 'perf_hooks';
import type { ParallelAnalyzer } from '../../performance/parallel-analyzer';
import { getGlobalParallelAnalyzer } from '../../performance/parallel-analyzer';
import { logger } from '../../utils/logger';
import { DataPilotError, ErrorSeverity, ErrorCategory } from '../../core/types';
import { StreamingAnalyzer } from './streaming-analyzer';

interface ParallelStreamingOptions {
  // Inherit from base streaming options
  chunkSize?: number;
  memoryThresholdMB?: number;
  maxRowsAnalyzed?: number;
  enabledAnalyses?: string[];
  significanceLevel?: number;
  maxCorrelationPairs?: number;
  enableMultivariate?: boolean;

  // Parallel processing options
  enableParallelProcessing?: boolean;
  maxWorkers?: number;
  batchSize?: number;
  parallelThreshold?: number; // Minimum data size to trigger parallel processing
  memoryLimitPerWorker?: number;
}

interface ParallelAnalysisResult {
  overview: any;
  descriptiveStats: any[];
  correlations: any[];
  outliers: any[];
  frequencyDistributions: any[];
  performanceMetrics: {
    totalExecutionTime: number;
    parallelExecutionTime: number;
    sequentialExecutionTime: number;
    speedupFactor: number;
    tasksExecuted: number;
    memoryEfficiency: number;
  };
}

/**
 * Enhanced streaming analyzer with parallel processing capabilities
 */
export class ParallelStreamingAnalyzer extends EventEmitter {
  private options: Required<ParallelStreamingOptions>;
  private parallelAnalyzer: ParallelAnalyzer;
  private baseAnalyzer: StreamingAnalyzer;
  private isInitialized = false;

  constructor(options: ParallelStreamingOptions = {}) {
    super();

    this.options = {
      // Base streaming options
      chunkSize: options.chunkSize || 1000,
      memoryThresholdMB: options.memoryThresholdMB || 100,
      maxRowsAnalyzed: options.maxRowsAnalyzed || 500000,
      enabledAnalyses: options.enabledAnalyses || ['univariate', 'bivariate', 'correlations'],
      significanceLevel: options.significanceLevel || 0.05,
      maxCorrelationPairs: options.maxCorrelationPairs || 50,
      enableMultivariate: options.enableMultivariate ?? true,

      // Parallel processing options
      enableParallelProcessing: options.enableParallelProcessing ?? true,
      maxWorkers: options.maxWorkers || Math.max(2, require('os').cpus().length - 1),
      batchSize: options.batchSize || 1000,
      parallelThreshold: options.parallelThreshold || 5000, // 5K rows minimum for parallel processing
      memoryLimitPerWorker: options.memoryLimitPerWorker || 256,
    };

    // Initialize parallel analyzer if enabled
    if (this.options.enableParallelProcessing) {
      this.parallelAnalyzer = getGlobalParallelAnalyzer({
        maxWorkers: this.options.maxWorkers,
        memoryLimitMB: this.options.memoryLimitPerWorker,
        batchSize: this.options.batchSize,
      });
    }

    // Initialize base analyzer for fallback and small datasets
    this.baseAnalyzer = new StreamingAnalyzer({
      chunkSize: this.options.chunkSize,
      memoryThresholdMB: this.options.memoryThresholdMB,
      maxRowsAnalyzed: this.options.maxRowsAnalyzed,
      enabledAnalyses: this.options.enabledAnalyses,
      significanceLevel: this.options.significanceLevel,
      maxCorrelationPairs: this.options.maxCorrelationPairs,
      enableMultivariate: this.options.enableMultivariate,
    });

    logger.info(`Parallel streaming analyzer initialized with ${this.options.maxWorkers} workers`);
  }

  /**
   * Analyze file with intelligent parallel/sequential routing
   */
  async analyzeFile(filePath: string): Promise<ParallelAnalysisResult> {
    const startTime = performance.now();

    try {
      // First, analyze the file to determine if parallel processing is beneficial
      const fileInfo = await this.analyzeFileCharacteristics(filePath);

      if (this.shouldUseParallelProcessing(fileInfo)) {
        logger.info(`Using parallel processing for large dataset (${fileInfo.estimatedRows} rows)`);
        return await this.analyzeFileParallel(filePath, fileInfo);
      } else {
        logger.info(
          `Using sequential processing for smaller dataset (${fileInfo.estimatedRows} rows)`,
        );
        return await this.analyzeFileSequential(filePath, fileInfo);
      }
    } catch (error) {
      throw new DataPilotError(
        `Parallel streaming analysis failed: ${error.message}`,
        'PARALLEL_STREAMING_ERROR',
        ErrorSeverity.HIGH,
        ErrorCategory.PERFORMANCE,
      );
    }
  }

  /**
   * Analyze file characteristics to determine processing strategy
   */
  private async analyzeFileCharacteristics(filePath: string): Promise<any> {
    const { promises: fs } = await import('fs');
    const fileStats = await fs.stat(filePath);

    // Quick sample analysis to estimate data characteristics
    const sampleSize = Math.min(fileStats.size, 64 * 1024); // 64KB sample
    const sampleBuffer = Buffer.alloc(sampleSize);
    const fileHandle = await fs.open(filePath, 'r');
    await fileHandle.read(sampleBuffer, 0, sampleSize, 0);
    await fileHandle.close();

    const sampleText = sampleBuffer.toString('utf8');
    const lineCount = (sampleText.match(/\n/g) || []).length;
    const avgLineLength = sampleText.length / lineCount;

    // Estimate total rows and complexity
    const estimatedRows = Math.floor(fileStats.size / avgLineLength);
    const estimatedColumns = (sampleText.split('\n')[0] || '').split(',').length;

    // Determine data complexity based on content analysis
    const hasQuotedFields = /["']/.test(sampleText);
    const hasComplexStructures = /[\[\]{},:]/.test(sampleText);
    const complexity = hasComplexStructures ? 'high' : hasQuotedFields ? 'medium' : 'low';

    return {
      fileSize: fileStats.size,
      estimatedRows,
      estimatedColumns,
      avgLineLength,
      complexity,
      sample: sampleText.slice(0, 1000), // Keep first 1KB for format detection
    };
  }

  /**
   * Determine if parallel processing should be used
   */
  private shouldUseParallelProcessing(fileInfo: any): boolean {
    if (!this.options.enableParallelProcessing) return false;

    // Use parallel processing for large datasets or complex data
    const sizeCriteria = fileInfo.estimatedRows >= this.options.parallelThreshold;
    const complexityCriteria = fileInfo.complexity === 'high' && fileInfo.estimatedRows >= 1000;
    const columnCriteria = fileInfo.estimatedColumns >= 20 && fileInfo.estimatedRows >= 2000;

    return sizeCriteria || complexityCriteria || columnCriteria;
  }

  /**
   * Parallel file analysis for large datasets
   */
  private async analyzeFileParallel(
    filePath: string,
    fileInfo: any,
  ): Promise<ParallelAnalysisResult> {
    const parallelStartTime = performance.now();

    try {
      // Step 1: Parse data in parallel chunks
      logger.info('Phase 1: Parallel data parsing');
      const parseResult = await this.parseFileInParallel(filePath, fileInfo);

      // Step 2: Parallel statistical analysis
      logger.info('Phase 2: Parallel statistical analysis');
      const statsResult = await this.calculateParallelStatistics(parseResult.data);

      // Step 3: Parallel correlation analysis (if enabled)
      let correlationResult: any = { results: [] };
      if (this.options.enabledAnalyses.includes('correlations')) {
        logger.info('Phase 3: Parallel correlation analysis');
        correlationResult = await this.calculateParallelCorrelations(parseResult.numericColumns);
      }

      // Step 4: Parallel outlier detection
      let outlierResult: any = { results: [] };
      if (this.options.enabledAnalyses.includes('outlier_detection')) {
        logger.info('Phase 4: Parallel outlier detection');
        outlierResult = await this.detectParallelOutliers(parseResult.numericColumns);
      }

      // Step 5: Parallel frequency analysis for categorical data
      let frequencyResult: any = { results: [] };
      if (this.options.enabledAnalyses.includes('frequency_analysis')) {
        logger.info('Phase 5: Parallel frequency analysis');
        frequencyResult = await this.calculateParallelFrequencies(parseResult.categoricalColumns);
      }

      const parallelExecutionTime = performance.now() - parallelStartTime;

      // Get performance metrics
      const performanceMetrics = this.calculatePerformanceMetrics(
        parallelExecutionTime,
        parseResult,
        statsResult,
        correlationResult,
        outlierResult,
        frequencyResult,
      );

      return {
        overview: {
          totalRows: parseResult.totalRows,
          totalColumns: parseResult.totalColumns,
          numericColumns: parseResult.numericColumns.length,
          categoricalColumns: parseResult.categoricalColumns.length,
          processingMode: 'parallel',
          fileInfo,
        },
        descriptiveStats: statsResult.results,
        correlations: correlationResult.results,
        outliers: outlierResult.results,
        frequencyDistributions: frequencyResult.results,
        performanceMetrics,
      };
    } catch (error) {
      logger.error(`Parallel analysis failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Sequential file analysis for smaller datasets
   */
  private async analyzeFileSequential(
    filePath: string,
    fileInfo: any,
  ): Promise<ParallelAnalysisResult> {
    const sequentialStartTime = performance.now();

    try {
      // Use base analyzer for sequential processing
      const baseResult = await this.baseAnalyzer.analyzeFile(filePath);
      const sequentialExecutionTime = performance.now() - sequentialStartTime;

      // Convert base result to parallel result format
      return {
        overview: {
          ...baseResult,
          processingMode: 'sequential',
          fileInfo,
        },
        descriptiveStats: baseResult.edaAnalysis?.univariateAnalysis || [],
        correlations: Array.isArray(baseResult.edaAnalysis?.bivariateAnalysis?.correlation)
          ? baseResult.edaAnalysis.bivariateAnalysis.correlation
          : [],
        outliers: [],
        frequencyDistributions: [],
        performanceMetrics: {
          totalExecutionTime: sequentialExecutionTime,
          parallelExecutionTime: 0,
          sequentialExecutionTime,
          speedupFactor: 1,
          tasksExecuted: 1,
          memoryEfficiency: 1,
        },
      };
    } catch (error) {
      logger.error(`Sequential analysis failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Parse file in parallel chunks
   */
  private async parseFileInParallel(filePath: string, fileInfo: any): Promise<any> {
    const { promises: fs } = await import('fs');
    const fileSize = fileInfo.fileSize;
    const chunkSize = this.calculateOptimalChunkSize(fileSize);

    // Split file into chunks
    const chunks: Buffer[] = [];
    const fileHandle = await fs.open(filePath, 'r');

    try {
      for (let offset = 0; offset < fileSize; offset += chunkSize) {
        const actualChunkSize = Math.min(chunkSize, fileSize - offset);
        const chunk = Buffer.alloc(actualChunkSize);
        await fileHandle.read(chunk, 0, actualChunkSize, offset);
        chunks.push(chunk);
      }
    } finally {
      await fileHandle.close();
    }

    // Parse chunks in parallel
    const chunkStrings = chunks.map((chunk) => chunk.toString('utf8'));
    const parseResult = await this.parallelAnalyzer.parseMultipleCSVChunks(chunkStrings, {
      delimiter: ',', // This could be detected from the sample
      hasHeader: true,
      trimFields: true,
    });

    // Combine and organize results
    const allRows: string[][] = [];
    let headers: string[] = [];

    parseResult.results.forEach((chunkResult: any, index: number) => {
      if (index === 0 && chunkResult.rows.length > 0) {
        headers = chunkResult.rows[0]; // First row as headers
        allRows.push(...chunkResult.rows.slice(1));
      } else {
        allRows.push(...chunkResult.rows);
      }
    });

    // Separate numeric and categorical columns
    const numericColumns: number[][] = [];
    const categoricalColumns: any[][] = [];

    for (let colIndex = 0; colIndex < headers.length; colIndex++) {
      const columnData = allRows.map((row) => row[colIndex]);

      // Simple type detection
      const numericValues = columnData.map((val) => parseFloat(val)).filter((val) => !isNaN(val));

      if (numericValues.length / columnData.length > 0.7) {
        numericColumns.push(numericValues);
      } else {
        categoricalColumns.push(columnData);
      }
    }

    return {
      data: allRows,
      headers,
      totalRows: allRows.length,
      totalColumns: headers.length,
      numericColumns,
      categoricalColumns,
    };
  }

  /**
   * Calculate statistics in parallel
   */
  private async calculateParallelStatistics(numericColumns: number[][]): Promise<any> {
    if (numericColumns.length === 0) {
      return { results: [], executionTime: 0 };
    }

    return await this.parallelAnalyzer.calculateMultipleDescriptiveStats(numericColumns);
  }

  /**
   * Calculate correlations in parallel
   */
  private async calculateParallelCorrelations(numericColumns: number[][]): Promise<any> {
    if (numericColumns.length < 2) {
      return { results: [], executionTime: 0 };
    }

    // Generate correlation pairs (limit to maxCorrelationPairs)
    const pairs: Array<{ x: number[]; y: number[] }> = [];
    const maxPairs = Math.min(
      this.options.maxCorrelationPairs,
      (numericColumns.length * (numericColumns.length - 1)) / 2,
    );

    let pairCount = 0;
    for (let i = 0; i < numericColumns.length && pairCount < maxPairs; i++) {
      for (let j = i + 1; j < numericColumns.length && pairCount < maxPairs; j++) {
        pairs.push({ x: numericColumns[i], y: numericColumns[j] });
        pairCount++;
      }
    }

    return await this.parallelAnalyzer.calculateMultipleCorrelations(pairs);
  }

  /**
   * Detect outliers in parallel
   */
  private async detectParallelOutliers(numericColumns: number[][]): Promise<any> {
    if (numericColumns.length === 0) {
      return { results: [], executionTime: 0 };
    }

    return await this.parallelAnalyzer.detectMultipleOutliers(numericColumns, 1.5);
  }

  /**
   * Calculate frequency distributions in parallel
   */
  private async calculateParallelFrequencies(categoricalColumns: any[][]): Promise<any> {
    if (categoricalColumns.length === 0) {
      return { results: [], executionTime: 0 };
    }

    return await this.parallelAnalyzer.calculateMultipleFrequencyDistributions(categoricalColumns);
  }

  /**
   * Calculate optimal chunk size for file parsing
   */
  private calculateOptimalChunkSize(fileSize: number): number {
    const targetChunks = this.options.maxWorkers * 2; // 2 chunks per worker
    let chunkSize = Math.ceil(fileSize / targetChunks);

    // Ensure reasonable bounds (1MB to 64MB)
    chunkSize = Math.max(1024 * 1024, Math.min(64 * 1024 * 1024, chunkSize));

    return chunkSize;
  }

  /**
   * Calculate performance metrics
   */
  private calculatePerformanceMetrics(
    parallelTime: number,
    parseResult: any,
    statsResult: any,
    correlationResult: any,
    outlierResult: any,
    frequencyResult: any,
  ): any {
    const totalTasks =
      1 + // parsing
      (statsResult.totalTasks || 0) +
      (correlationResult.totalTasks || 0) +
      (outlierResult.totalTasks || 0) +
      (frequencyResult.totalTasks || 0);

    // Estimate sequential execution time (for comparison)
    const estimatedSequentialTime = parallelTime * this.options.maxWorkers * 0.7; // Assume 70% efficiency
    const speedupFactor = estimatedSequentialTime / parallelTime;

    return {
      totalExecutionTime: parallelTime,
      parallelExecutionTime: parallelTime,
      sequentialExecutionTime: estimatedSequentialTime,
      speedupFactor: Math.max(1, speedupFactor),
      tasksExecuted: totalTasks,
      memoryEfficiency: this.calculateMemoryEfficiency(),
    };
  }

  /**
   * Calculate memory efficiency metric
   */
  private calculateMemoryEfficiency(): number {
    const memoryUsage = process.memoryUsage();
    const totalMemoryMB = memoryUsage.heapUsed / 1024 / 1024;
    const maxAllowedMemoryMB = this.options.memoryThresholdMB;

    return Math.max(0, 1 - totalMemoryMB / maxAllowedMemoryMB);
  }

  /**
   * Get real-time performance statistics
   */
  getPerformanceStats() {
    if (this.parallelAnalyzer) {
      return this.parallelAnalyzer.getPerformanceStats();
    }
    return null;
  }

  /**
   * Gracefully shutdown parallel resources
   */
  async shutdown(): Promise<void> {
    if (this.parallelAnalyzer) {
      await this.parallelAnalyzer.shutdown();
    }
    logger.info('Parallel streaming analyzer shutdown complete');
  }
}

/**
 * Factory function for creating parallel streaming analyzer
 */
export function createParallelStreamingAnalyzer(
  options?: ParallelStreamingOptions,
): ParallelStreamingAnalyzer {
  return new ParallelStreamingAnalyzer(options);
}
