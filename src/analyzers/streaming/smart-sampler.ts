/**
 * Smart Sampling Engine for Large Files
 * Implements multiple sampling strategies with intelligent selection
 */

import { ReservoirSampler } from './online-statistics';
import type { ParsedRow } from '../../parsers/types';
import type { CLIOptions } from '../../cli/types';
import { logger, type LogContext } from '../../utils/logger';

export interface SamplingStrategy {
  name: 'random' | 'stratified' | 'systematic' | 'head';
  targetSize: number;
  seed?: number;
  stratifyColumn?: string;
}

export interface SamplingResult {
  samples: ParsedRow[];
  strategy: SamplingStrategy;
  originalRowCount: number;
  sampledRowCount: number;
  samplingRatio: number;
  qualityMetrics: {
    representativeScore: number; // 0-1, how well sample represents original
    convergenceScore: number; // 0-1, statistical convergence quality
    stratificationBalance?: number; // 0-1, balance across strata (if stratified)
  };
  warnings: string[];
}

/**
 * Smart sampler that selects optimal sampling strategy based on data characteristics
 */
export class SmartSampler {
  private logContext: LogContext;

  constructor(
    private options: Required<Pick<CLIOptions, 'autoSample' | 'samplePercentage' | 'sampleRows' | 'sampleSizeBytes' | 'sampleMethod' | 'stratifyBy' | 'seed'>>,
    private fileSize: number,
    logContext?: LogContext,
  ) {
    this.logContext = logContext || {
      section: 'sampling',
      analyzer: 'SmartSampler',
      operation: 'sampling',
    };
  }

  /**
   * Determine if sampling should be enabled based on file size and options
   */
  static shouldEnableSampling(fileSize: number, options: CLIOptions): boolean {
    // Auto-sampling for files over 1GB
    if (options.autoSample && fileSize > 1024 * 1024 * 1024) {
      return true;
    }

    // Explicit sampling options
    return !!(
      options.samplePercentage ||
      options.sampleRows ||
      options.sampleSizeBytes ||
      options.sampleMethod
    );
  }

  /**
   * Calculate optimal sampling strategy based on file characteristics
   */
  calculateSamplingStrategy(estimatedRowCount: number, headers: string[]): SamplingStrategy {
    let targetSize: number;
    let strategy: SamplingStrategy['name'] = this.options.sampleMethod || 'random';

    // Determine target size based on options
    if (this.options.sampleRows) {
      targetSize = this.options.sampleRows;
    } else if (this.options.samplePercentage) {
      targetSize = Math.floor(estimatedRowCount * this.options.samplePercentage);
    } else if (this.options.sampleSizeBytes) {
      // Estimate rows from target size (rough approximation)
      const avgBytesPerRow = this.fileSize / Math.max(estimatedRowCount, 1);
      targetSize = Math.floor(this.options.sampleSizeBytes / avgBytesPerRow);
    } else if (this.options.autoSample) {
      // Default auto-sampling: 10% for files >1GB, with reasonable limits
      const percentage = this.fileSize > 10 * 1024 * 1024 * 1024 ? 0.05 : 0.1; // 5% for >10GB, 10% for 1-10GB
      targetSize = Math.floor(estimatedRowCount * percentage);
      
      // Ensure reasonable bounds
      targetSize = Math.max(10000, Math.min(1000000, targetSize));
    } else {
      // Fallback
      targetSize = Math.min(100000, Math.floor(estimatedRowCount * 0.1));
    }

    // Validate stratification column
    if (strategy === 'stratified' && this.options.stratifyBy) {
      if (!headers.includes(this.options.stratifyBy)) {
        logger.warn(`Stratification column '${this.options.stratifyBy}' not found. Falling back to random sampling.`, this.logContext);
        strategy = 'random';
      }
    }

    return {
      name: strategy,
      targetSize,
      seed: this.options.seed,
      stratifyColumn: strategy === 'stratified' ? this.options.stratifyBy : undefined,
    };
  }

  /**
   * Perform sampling using the specified strategy
   */
  async performSampling(
    rows: ParsedRow[],
    strategy: SamplingStrategy,
    headers: string[],
  ): Promise<SamplingResult> {
    const startTime = Date.now();
    let samples: ParsedRow[];
    const warnings: string[] = [];

    logger.info(`Starting ${strategy.name} sampling: ${strategy.targetSize} samples from ${rows.length} rows`, this.logContext);

    switch (strategy.name) {
      case 'random':
        samples = this.performRandomSampling(rows, strategy);
        break;

      case 'stratified':
        samples = this.performStratifiedSampling(rows, strategy, headers, warnings);
        break;

      case 'systematic':
        samples = this.performSystematicSampling(rows, strategy);
        break;

      case 'head':
        samples = this.performHeadSampling(rows, strategy);
        break;

      default:
        throw new Error(`Unknown sampling strategy: ${strategy.name}`);
    }

    const qualityMetrics = this.calculateQualityMetrics(samples, rows, strategy, headers);
    const processingTime = Date.now() - startTime;

    logger.info(`Sampling completed in ${processingTime}ms: ${samples.length} samples collected`, this.logContext);

    return {
      samples,
      strategy,
      originalRowCount: rows.length,
      sampledRowCount: samples.length,
      samplingRatio: samples.length / rows.length,
      qualityMetrics,
      warnings,
    };
  }

  /**
   * Random sampling using reservoir algorithm
   */
  private performRandomSampling(rows: ParsedRow[], strategy: SamplingStrategy): ParsedRow[] {
    const sampler = new ReservoirSampler<ParsedRow>(strategy.targetSize, strategy.seed);
    
    for (const row of rows) {
      sampler.sample(row);
    }

    return sampler.getSample();
  }

  /**
   * Stratified sampling to maintain proportional representation
   */
  private performStratifiedSampling(
    rows: ParsedRow[],
    strategy: SamplingStrategy,
    headers: string[],
    warnings: string[],
  ): ParsedRow[] {
    if (!strategy.stratifyColumn) {
      warnings.push('No stratification column specified, falling back to random sampling');
      return this.performRandomSampling(rows, strategy);
    }

    const columnIndex = headers.indexOf(strategy.stratifyColumn);
    if (columnIndex === -1) {
      warnings.push(`Stratification column '${strategy.stratifyColumn}' not found, falling back to random sampling`);
      return this.performRandomSampling(rows, strategy);
    }

    // Group rows by strata
    const strata = new Map<string, ParsedRow[]>();
    for (const row of rows) {
      const strataValue = String(row.data[columnIndex] || 'null');
      if (!strata.has(strataValue)) {
        strata.set(strataValue, []);
      }
      strata.get(strataValue)!.push(row);
    }

    const samples: ParsedRow[] = [];
    const totalStrata = strata.size;
    
    // Calculate samples per stratum based on proportional allocation
    for (const [strataValue, strataRows] of strata) {
      const strataSize = strataRows.length;
      const proportion = strataSize / rows.length;
      const targetStrataSize = Math.max(1, Math.floor(strategy.targetSize * proportion));
      
      // Use reservoir sampling for each stratum
      const strataSampler = new ReservoirSampler<ParsedRow>(
        Math.min(targetStrataSize, strataSize),
        strategy.seed ? strategy.seed + strataValue.length : undefined,
      );
      
      for (const row of strataRows) {
        strataSampler.sample(row);
      }
      
      samples.push(...strataSampler.getSample());
      
      logger.debug(`Stratum '${strataValue}': ${strataSampler.getSample().length} samples from ${strataSize} rows`, this.logContext);
    }

    logger.info(`Stratified sampling: ${samples.length} samples from ${totalStrata} strata`, this.logContext);
    
    return samples;
  }

  /**
   * Systematic sampling (every nth row)
   */
  private performSystematicSampling(rows: ParsedRow[], strategy: SamplingStrategy): ParsedRow[] {
    const interval = Math.floor(rows.length / strategy.targetSize);
    if (interval <= 1) {
      return rows.slice(0, strategy.targetSize);
    }

    const samples: ParsedRow[] = [];
    const startOffset = strategy.seed ? strategy.seed % interval : Math.floor(Math.random() * interval);
    
    for (let i = startOffset; i < rows.length && samples.length < strategy.targetSize; i += interval) {
      samples.push(rows[i]);
    }

    return samples;
  }

  /**
   * Head sampling (first n rows)
   */
  private performHeadSampling(rows: ParsedRow[], strategy: SamplingStrategy): ParsedRow[] {
    return rows.slice(0, Math.min(strategy.targetSize, rows.length));
  }

  /**
   * Calculate quality metrics for the sampling result
   */
  private calculateQualityMetrics(
    samples: ParsedRow[],
    originalRows: ParsedRow[],
    strategy: SamplingStrategy,
    headers: string[],
  ): SamplingResult['qualityMetrics'] {
    // Representative score based on sample size vs target
    const sizeRatio = samples.length / Math.min(strategy.targetSize, originalRows.length);
    const representativeScore = Math.min(1, sizeRatio);

    // Convergence score based on sampling adequacy
    const samplingRatio = samples.length / originalRows.length;
    const convergenceScore = Math.min(1, Math.sqrt(samplingRatio * 10)); // Heuristic

    let stratificationBalance: number | undefined;
    
    // Calculate stratification balance if applicable
    if (strategy.name === 'stratified' && strategy.stratifyColumn) {
      stratificationBalance = this.calculateStratificationBalance(
        samples,
        originalRows,
        headers,
        strategy.stratifyColumn,
      );
    }

    return {
      representativeScore,
      convergenceScore,
      stratificationBalance,
    };
  }

  /**
   * Calculate how well stratified sampling preserved proportions
   */
  private calculateStratificationBalance(
    samples: ParsedRow[],
    originalRows: ParsedRow[],
    headers: string[],
    stratifyColumn: string,
  ): number {
    const columnIndex = headers.indexOf(stratifyColumn);
    if (columnIndex === -1) return 0;

    // Calculate original proportions
    const originalCounts = new Map<string, number>();
    for (const row of originalRows) {
      const value = String(row.data[columnIndex] || 'null');
      originalCounts.set(value, (originalCounts.get(value) || 0) + 1);
    }

    // Calculate sample proportions
    const sampleCounts = new Map<string, number>();
    for (const row of samples) {
      const value = String(row.data[columnIndex] || 'null');
      sampleCounts.set(value, (sampleCounts.get(value) || 0) + 1);
    }

    // Calculate balance score using Chi-square goodness of fit concept
    let totalDeviation = 0;
    let totalExpected = 0;

    for (const [value, originalCount] of originalCounts) {
      const expectedProportion = originalCount / originalRows.length;
      const expectedSampleCount = expectedProportion * samples.length;
      const actualSampleCount = sampleCounts.get(value) || 0;
      
      const deviation = Math.abs(actualSampleCount - expectedSampleCount);
      totalDeviation += deviation;
      totalExpected += expectedSampleCount;
    }

    // Convert to 0-1 score (higher is better)
    const balanceScore = Math.max(0, 1 - (totalDeviation / totalExpected));
    return balanceScore;
  }

  /**
   * Generate sampling notice for reports
   */
  generateSamplingNotice(result: SamplingResult): string {
    const { strategy, originalRowCount, sampledRowCount, samplingRatio, qualityMetrics } = result;
    
    let notice = `## 📊 SAMPLING NOTICE\n`;
    notice += `- Original Dataset: ${originalRowCount.toLocaleString()} rows\n`;
    notice += `- Sample Size: ${sampledRowCount.toLocaleString()} rows (${(samplingRatio * 100).toFixed(1)}%)\n`;
    notice += `- Sampling Method: ${strategy.name.charAt(0).toUpperCase() + strategy.name.slice(1)}`;
    
    if (strategy.seed !== undefined) {
      notice += ` (seed: ${strategy.seed})`;
    }
    notice += `\n`;

    if (strategy.stratifyColumn) {
      notice += `- Stratification Column: ${strategy.stratifyColumn}\n`;
    }

    notice += `- Statistical Confidence: Results representative within ±${this.calculateMarginOfError(samplingRatio).toFixed(1)}% margin\n`;
    
    if (qualityMetrics.stratificationBalance !== undefined) {
      notice += `- Stratification Balance: ${(qualityMetrics.stratificationBalance * 100).toFixed(1)}%\n`;
    }

    if (result.warnings.length > 0) {
      notice += `- Warnings: ${result.warnings.join('; ')}\n`;
    }

    return notice;
  }

  /**
   * Calculate rough margin of error for sampling
   */
  private calculateMarginOfError(samplingRatio: number, confidence: number = 0.95): number {
    // Simplified margin of error calculation
    const zScore = confidence === 0.95 ? 1.96 : 2.58; // 95% or 99%
    const marginOfError = zScore * Math.sqrt((0.25) / (samplingRatio * 1000000)) * 100;
    return Math.min(50, Math.max(1, marginOfError)); // Bound between 1% and 50%
  }
}