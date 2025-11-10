/**
 * Section 3: EDA Adapter (V1 → V2)
 * Converts bloated EDA output to lean AI-ready format
 */

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
   */
  public static convertToV2(v1: Section3EdaAnalysis): Section3EdaAnalysisV2 {
    const numericCols: NumericStats[] = [];
    const categoricalCols: CategoryStats[] = [];
    const textCols: TextStats[] = [];
    const outliers: OutlierAnalysisV2[] = [];
    const distributions: DistributionFit[] = [];
    const columns: ColumnProfile[] = [];

    // Process each column
    v1.univariateAnalysis.forEach((col) => {
      // Basic profile for all columns
      columns.push(this.extractColumnProfile(col));

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
    });

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
  }

  private static extractColumnProfile(col: ColumnAnalysis): ColumnProfile {
    return {
      column: col.columnName,
      data_type: this.normalizeDataType(col.detectedDataType),
      semantic_type: col.inferredSemanticType?.toLowerCase(),
      total: col.totalValues,
      missing: col.missingValues,
      missing_ratio: col.missingPercentage / 100,
      unique: col.uniqueValues,
      unique_ratio: col.uniquePercentage / 100,
    };
  }

  private static extractNumericStats(col: NumericalColumnAnalysis): NumericStats {
    return {
      column: col.columnName,
      min: col.descriptiveStats.minimum,
      max: col.descriptiveStats.maximum,
      mean: col.descriptiveStats.mean,
      median: col.descriptiveStats.median,
      std_dev: col.descriptiveStats.standardDeviation,
      variance: col.descriptiveStats.variance,
      q1: col.quantileStats.quartile1st,
      q3: col.quantileStats.quartile3rd,
      iqr: col.quantileStats.interquartileRange,
      skewness: col.distributionAnalysis.skewness,
      kurtosis: col.distributionAnalysis.kurtosis,
      zeros: Math.round((col.numericalPatterns?.zeroValuePercentage || 0) * col.totalValues / 100),
      negatives: Math.round((col.numericalPatterns?.negativeValuePercentage || 0) * col.totalValues / 100),
    };
  }

  private static extractCategoryStats(col: CategoricalColumnAnalysis): CategoryStats {
    const top5 = col.frequencyDistribution.slice(0, 5).map((freq) => ({
      value: freq.label,
      count: freq.count,
      ratio: freq.percentage / 100,
    }));

    // Calculate entropy and concentration
    const totalCount = col.totalValues;
    let entropy = 0;
    let topPercent = 0;

    col.frequencyDistribution.forEach((freq, idx) => {
      const p = freq.count / totalCount;
      if (p > 0) {
        entropy -= p * Math.log2(p);
      }
      if (idx < 5) {
        topPercent += p;
      }
    });

    return {
      column: col.columnName,
      unique_categories: col.uniqueCategories,
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
      column: col.columnName,
      min_length: col.textStatistics?.minCharLength || 0,
      max_length: col.textStatistics?.maxCharLength || 0,
      avg_length: col.textStatistics?.avgCharLength || 0,
      patterns,
      contains_urls: (col.textPatterns?.urlCount || 0) > 0,
      contains_emails: (col.textPatterns?.emailCount || 0) > 0,
      contains_phones: false, // Not tracked in V1
      contains_numbers: (col.textPatterns?.numericTextPercentage || 0) > 0,
      mixed_case: false, // Not tracked in V1
    };
  }

  private static extractOutliers(col: NumericalColumnAnalysis): OutlierAnalysisV2 {
    const outlierExamples: number[] = [];
    // V1 doesn't store outlier values, just counts
    // This would need to be added to analyzer

    return {
      column: col.columnName,
      iqr_lower_outliers: col.outlierAnalysis.iqrMethod.lowerOutliers,
      iqr_upper_outliers: col.outlierAnalysis.iqrMethod.upperOutliers,
      iqr_lower_fence: col.outlierAnalysis.iqrMethod.lowerFence,
      iqr_upper_fence: col.outlierAnalysis.iqrMethod.upperFence,
      zscore_outliers: col.outlierAnalysis.zScoreMethod.lowerOutliers + col.outlierAnalysis.zScoreMethod.upperOutliers,
      outlier_examples: outlierExamples,
    };
  }

  private static extractDistribution(col: NumericalColumnAnalysis): DistributionFit {
    return {
      column: col.columnName,
      shapiro_wilk_p: col.normalityTests.shapiroWilk.pValue,
      jarque_bera_p: col.normalityTests.jarqueBera.pValue,
      is_symmetric: Math.abs(col.distributionAnalysis.skewness) < 0.5,
      is_unimodal: col.descriptiveStats.modes.length <= 1,
      has_heavy_tails: Math.abs(col.distributionAnalysis.kurtosis) > 3,
    };
  }

  private static extractCorrelations(v1: Section3EdaAnalysis): CorrelationMatrix {
    const correlations: CorrelationPair[] = [];
    const strong: CorrelationPair[] = [];
    const moderate: CorrelationPair[] = [];
    const numericColumns: string[] = [];

    // Extract from bivariate analysis
    if (v1.bivariateAnalysis?.numericalVsNumerical) {
      const numBivariate = v1.bivariateAnalysis.numericalVsNumerical;

      // Get numeric column names from correlation matrix if available
      if (numBivariate.correlationMatrix?.variables) {
        numericColumns.push(...numBivariate.correlationMatrix.variables);
      }

      // Extract correlations from correlation pairs
      if (numBivariate.correlationPairs) {
        numBivariate.correlationPairs.forEach((corr) => {
          const pair: CorrelationPair = {
            col_a: corr.variable1,
            col_b: corr.variable2,
            correlation: corr.correlation,
            p_value: corr.pValue || 0,
            sample_size: corr.sampleSize || 0,
          };

          correlations.push(pair);

          const absCorr = Math.abs(corr.correlation);
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
}
