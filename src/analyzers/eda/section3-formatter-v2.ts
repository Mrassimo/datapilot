/**
 * Section 3: EDA - AI-Ready Formatter (V2)
 * Lean JSON output for AI consumption
 */

import type { Section3EdaAnalysisV2 } from './types-v2';

export class Section3FormatterV2 {
  /**
   * Format EDA analysis as lean JSON
   */
  public static formatJSON(analysis: Section3EdaAnalysisV2): string {
    return JSON.stringify(analysis, null, 2);
  }

  /**
   * Format as compact single-line JSON
   */
  public static formatCompactJSON(analysis: Section3EdaAnalysisV2): string {
    return JSON.stringify(analysis);
  }

  /**
   * Get summary statistics for CLI display
   */
  public static getSummaryStats(analysis: Section3EdaAnalysisV2): {
    total_columns: number;
    numeric_columns: number;
    categorical_columns: number;
    strong_correlations: number;
    columns_with_outliers: number;
  } {
    return {
      total_columns: analysis.dataset_summary.total_columns,
      numeric_columns: analysis.dataset_summary.numeric_columns,
      categorical_columns: analysis.dataset_summary.categorical_columns,
      strong_correlations: analysis.correlations.strong_correlations.length,
      columns_with_outliers: analysis.outliers.filter((o) => o.iqr_lower_outliers + o.iqr_upper_outliers > 0).length,
    };
  }

  /**
   * Generate summary line for CLI
   * Example: "43 cols | 23 numeric | 20 categorical | 12 strong correlations | 5 cols with outliers"
   */
  public static getSummaryLine(analysis: Section3EdaAnalysisV2): string {
    const stats = this.getSummaryStats(analysis);
    return `${stats.total_columns} cols | ${stats.numeric_columns} numeric | ${stats.categorical_columns} categorical | ${stats.strong_correlations} strong correlations | ${stats.columns_with_outliers} cols with outliers`;
  }
}
