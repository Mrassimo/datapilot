/**
 * Section 3: EDA Adapter (V1 → V2)
 * Converts bloated EDA output to lean AI-ready format
 */

import { logger } from '@/utils/logger';
import type {
  Section3EdaAnalysis,
  ColumnAnalysis,
  NumericalColumnAnalysis,
  CategoricalColumnAnalysis,
  TextColumnAnalysis,
} from './types';

import type {
  Section3EdaAnalysisV2,
  ColumnProfile,
  NumericStats,
  CategoryStats,
  TextStats,
  OutlierAnalysis as OutlierAnalysisV2,
  CorrelationMatrix,
  CorrelationPair,
  DistributionFit,
} from './types-v2';

export class Section3Adapter {
  /**
   * Convert V1 (bloated) to V2 (lean)
   * Expected 86% size reduction
   *
   * Error handling strategy:
   * - Validates V1 input structure before processing
   * - Uses type guards to safely process different column types
   * - Skips invalid column data with warnings
   * - Returns minimal valid structure on critical errors
   */
  public static convertToV2(v1: Section3EdaAnalysis): Section3EdaAnalysisV2 {
    try {
      // Validate input
      if (!this.isValidV1Input(v1)) {
        logger.warn('Section3Adapter: Invalid V1 input, returning minimal structure', {
          context: 'convertToV2',
          hasInput: !!v1,
          inputType: typeof v1,
        });
        return this.getMinimalV2Structure();
      }
      const numericCols: NumericStats[] = [];
      const categoricalCols: CategoryStats[] = [];
      const textCols: TextStats[] = [];
      const outliers: OutlierAnalysisV2[] = [];
      const distributions: DistributionFit[] = [];
      const columns: ColumnProfile[] = [];

      // Process each column
      const univariateAnalysis = v1?.univariateAnalysis;
      if (Array.isArray(univariateAnalysis)) {
        univariateAnalysis.forEach((col) => {
          if (!col || typeof col !== 'object') {
            logger.warn('Section3Adapter: Skipping invalid column data', {
              context: 'convertToV2',
            });
            return;
          }

          try {
            // Basic profile for all columns
            const profile = this.extractColumnProfile(col);
            columns.push(profile);

            // Type-specific stats
            if (this.isNumerical(col)) {
              const numCol = col as NumericalColumnAnalysis;
              numericCols.push(this.extractNumericStats(numCol));
              outliers.push(this.extractOutliers(numCol));
              distributions.push(this.extractDistribution(numCol));
            } else if (this.isCategorical(col)) {
              categoricalCols.push(this.extractCategoryStats(col as CategoricalColumnAnalysis));
            } else if (this.isText(col)) {
              textCols.push(this.extractTextStats(col as TextColumnAnalysis));
            }
          } catch (error) {
            logger.warn('Section3Adapter: Error processing column', {
              context: 'convertToV2',
              columnName: col.columnName,
              error: error instanceof Error ? error.message : String(error),
            });
          }
        });
      }

      return {
        version: '2.0',
        columns,
        numeric_stats: numericCols,
        categorical_stats: categoricalCols,
        text_stats: textCols,
        outliers,
        correlations: this.extractCorrelations(v1),
        distributions,
        dataset_summary: this.extractDatasetSummary(v1, columns),
      };
    } catch (error) {
      logger.error('Section3Adapter: Critical error during V2 conversion', {
        context: 'convertToV2',
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      return this.getMinimalV2Structure();
    }
  }

  private static extractColumnProfile(col: ColumnAnalysis): ColumnProfile {
    return {
      column: col?.columnName || 'unknown',
      data_type: this.normalizeDataType(col?.detectedDataType || 'text'),
      semantic_type: col?.inferredSemanticType?.toLowerCase(),
      total: col?.totalValues || 0,
      missing: col?.missingValues || 0,
      missing_ratio: (col?.missingPercentage || 0) / 100,
      unique: col?.uniqueValues || 0,
      unique_ratio: (col?.uniquePercentage || 0) / 100,
    };
  }

  private static extractNumericStats(col: NumericalColumnAnalysis): NumericStats {
    const descriptiveStats = col?.descriptiveStats || ({} as any);
    const quantileStats = col?.quantileStats || ({} as any);
    const distributionAnalysis = col?.distributionAnalysis || ({} as any);
    const totalValues = col?.totalValues || 0;

    return {
      column: col?.columnName || 'unknown',
      min: descriptiveStats.minimum ?? 0,
      max: descriptiveStats.maximum ?? 0,
      mean: descriptiveStats.mean ?? 0,
      median: descriptiveStats.median ?? 0,
      std_dev: descriptiveStats.standardDeviation ?? 0,
      variance: descriptiveStats.variance ?? 0,
      q1: quantileStats.quartile1st ?? 0,
      q3: quantileStats.quartile3rd ?? 0,
      iqr: quantileStats.interquartileRange ?? 0,
      skewness: distributionAnalysis.skewness ?? 0,
      kurtosis: distributionAnalysis.kurtosis ?? 0,
      zeros: Math.round((col?.numericalPatterns?.zeroValuePercentage || 0) * totalValues / 100),
      negatives: Math.round((col?.numericalPatterns?.negativeValuePercentage || 0) * totalValues / 100),
    };
  }

  private static extractCategoryStats(col: CategoricalColumnAnalysis): CategoryStats {
    const frequencyDistribution = col?.frequencyDistribution || [];
    const totalCount = col?.totalValues || 1; // Avoid division by zero

    const top5: CategoryStats['top_5'] = [];
    if (Array.isArray(frequencyDistribution)) {
      frequencyDistribution.slice(0, 5).forEach((freq) => {
        if (!freq || typeof freq !== 'object') {
          return;
        }
        top5.push({
          value: freq.label ?? 'unknown',
          count: freq.count ?? 0,
          ratio: (freq.percentage ?? 0) / 100,
        });
      });
    }

    // Calculate entropy and concentration
    let entropy = 0;
    let topPercent = 0;

    if (Array.isArray(frequencyDistribution)) {
      frequencyDistribution.forEach((freq, idx) => {
        if (!freq || typeof freq !== 'object') {
          return;
        }
        const p = (freq.count || 0) / totalCount;
        if (p > 0) {
          entropy -= p * Math.log2(p);
        }
        if (idx < 5) {
          topPercent += p;
        }
      });
    }

    return {
      column: col?.columnName || 'unknown',
      unique_categories: col?.uniqueCategories || 0,
      top_5: top5,
      entropy: entropy,
      concentration: topPercent, // How concentrated in top 5
    };
  }

  private static extractTextStats(col: TextColumnAnalysis): TextStats {
    const patterns: TextStats['patterns'] = [];

    // Extract patterns if available (V1 may not have detailed patterns)
    // This would need to be added to analyzer

    return {
      column: col?.columnName || 'unknown',
      min_length: col?.textStatistics?.minCharLength || 0,
      max_length: col?.textStatistics?.maxCharLength || 0,
      avg_length: col?.textStatistics?.avgCharLength || 0,
      patterns,
      contains_urls: (col?.textPatterns?.urlCount || 0) > 0,
      contains_emails: (col?.textPatterns?.emailCount || 0) > 0,
      contains_phones: false, // Not tracked in V1
      contains_numbers: (col?.textPatterns?.numericTextPercentage || 0) > 0,
      mixed_case: false, // Not tracked in V1
    };
  }

  private static extractOutliers(col: NumericalColumnAnalysis): OutlierAnalysisV2 {
    const outlierExamples: number[] = [];
    // V1 doesn't store outlier values, just counts
    // This would need to be added to analyzer

    const iqrMethod = col?.outlierAnalysis?.iqrMethod || ({} as any);
    const zScoreMethod = col?.outlierAnalysis?.zScoreMethod || ({} as any);

    return {
      column: col?.columnName || 'unknown',
      iqr_lower_outliers: iqrMethod.lowerOutliers || 0,
      iqr_upper_outliers: iqrMethod.upperOutliers || 0,
      iqr_lower_fence: iqrMethod.lowerFence || 0,
      iqr_upper_fence: iqrMethod.upperFence || 0,
      zscore_outliers: (zScoreMethod.lowerOutliers || 0) + (zScoreMethod.upperOutliers || 0),
      outlier_examples: outlierExamples,
    };
  }

  private static extractDistribution(col: NumericalColumnAnalysis): DistributionFit {
    const normalityTests = col?.normalityTests || ({} as any);
    const distributionAnalysis = col?.distributionAnalysis || ({} as any);
    const descriptiveStats = col?.descriptiveStats || ({} as any);

    return {
      column: col?.columnName || 'unknown',
      shapiro_wilk_p: normalityTests.shapiroWilk?.pValue || 0,
      jarque_bera_p: normalityTests.jarqueBera?.pValue || 0,
      is_symmetric: Math.abs(distributionAnalysis.skewness || 0) < 0.5,
      is_unimodal: Array.isArray(descriptiveStats.modes) ? descriptiveStats.modes.length <= 1 : true,
      has_heavy_tails: Math.abs(distributionAnalysis.kurtosis || 0) > 3,
    };
  }

  private static extractCorrelations(v1: Section3EdaAnalysis): CorrelationMatrix {
    try {
      const correlations: CorrelationPair[] = [];
      const strong: CorrelationPair[] = [];
      const moderate: CorrelationPair[] = [];
      const numericColumns: string[] = [];

      // Extract from bivariate analysis
      const numBivariate = v1?.bivariateAnalysis?.numericalVsNumerical;
      if (numBivariate) {
        // Get numeric column names from correlation matrix if available
        const variables = numBivariate.correlationMatrix?.variables;
        if (Array.isArray(variables)) {
          numericColumns.push(...variables);
        }

        // Extract correlations from correlation pairs
        const correlationPairs = numBivariate.correlationPairs;
        if (Array.isArray(correlationPairs)) {
          correlationPairs.forEach((corr) => {
            if (!corr || typeof corr !== 'object') {
              return;
            }

            const pair: CorrelationPair = {
              col_a: corr.variable1 || 'unknown',
              col_b: corr.variable2 || 'unknown',
              correlation: corr.correlation || 0,
              p_value: corr.pValue || 0,
              sample_size: corr.sampleSize || 0,
            };

            correlations.push(pair);

            const absCorr = Math.abs(corr.correlation || 0);
            if (absCorr > 0.7) {
              strong.push(pair);
            } else if (absCorr > 0.3) {
              moderate.push(pair);
            }
          });
        }
      }

      return {
        numeric_columns: numericColumns,
        correlations,
        strong_correlations: strong,
        moderate_correlations: moderate,
      };
    } catch (error) {
      logger.warn('Section3Adapter: Error extracting correlations', {
        context: 'extractCorrelations',
        error: error instanceof Error ? error.message : String(error),
      });
      return {
        numeric_columns: [],
        correlations: [],
        strong_correlations: [],
        moderate_correlations: [],
      };
    }
  }

  private static extractDatasetSummary(v1: Section3EdaAnalysis, columns: ColumnProfile[]) {
    let numericCount = 0;
    let categoricalCount = 0;
    let textCount = 0;
    let datetimeCount = 0;

    columns.forEach((col) => {
      switch (col.data_type) {
        case 'numeric':
          numericCount++;
          break;
        case 'categorical':
          categoricalCount++;
          break;
        case 'text':
          textCount++;
          break;
        case 'datetime':
          datetimeCount++;
          break;
      }
    });

    return {
      total_rows: columns[0]?.total || 0,
      total_columns: columns.length,
      numeric_columns: numericCount,
      categorical_columns: categoricalCount,
      text_columns: textCount,
      datetime_columns: datetimeCount,
    };
  }

  // Type guards
  private static isNumerical(col: ColumnAnalysis): boolean {
    return 'descriptiveStats' in col;
  }

  private static isCategorical(col: ColumnAnalysis): boolean {
    return 'frequencyDistribution' in col && !('descriptiveStats' in col);
  }

  private static isText(col: ColumnAnalysis): boolean {
    return 'textStatistics' in col;
  }

  private static normalizeDataType(type: string): string {
    const lower = type.toLowerCase();
    if (lower.includes('numerical') || lower.includes('float') || lower.includes('integer')) {
      return 'numeric';
    }
    if (lower.includes('categorical')) {
      return 'categorical';
    }
    if (lower.includes('text')) {
      return 'text';
    }
    if (lower.includes('date') || lower.includes('time')) {
      return 'datetime';
    }
    if (lower.includes('boolean')) {
      return 'boolean';
    }
    return 'text'; // Default
  }

  /**
   * Validates V1 input structure
   * Checks for required univariate analysis array
   */
  private static isValidV1Input(v1: Section3EdaAnalysis): boolean {
    if (!v1 || typeof v1 !== 'object') {
      return false;
    }

    // Check for required univariateAnalysis array
    return Array.isArray(v1.univariateAnalysis);
  }

  /**
   * Returns a minimal valid V2 structure for error cases
   * Ensures that downstream consumers always receive valid structure
   */
  private static getMinimalV2Structure(): Section3EdaAnalysisV2 {
    return {
      version: '2.0',
      columns: [],
      numeric_stats: [],
      categorical_stats: [],
      text_stats: [],
      outliers: [],
      correlations: {
        numeric_columns: [],
        correlations: [],
        strong_correlations: [],
        moderate_correlations: [],
      },
      distributions: [],
      dataset_summary: {
        total_rows: 0,
        total_columns: 0,
        numeric_columns: 0,
        categorical_columns: 0,
        text_columns: 0,
        datetime_columns: 0,
      },
    };
  }
}
