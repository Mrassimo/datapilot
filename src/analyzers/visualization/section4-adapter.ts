/**
 * Section 4: Visualization Adapter (V1 → V2)
 * Converts bloated visualization recommendations to lean chart candidate facts
 */

import { logger } from '@/utils/logger';
import type { VisualizationAnalysis, ColumnVisualizationProfile, BivariateVisualizationProfile } from './types';
import type {
  Section4VisualizationV2,
  ScatterPlotCandidate,
  HistogramCandidate,
  BarChartCandidate,
  BoxPlotCandidate,
  HeatmapCandidate,
  TimeSeriesCandidate,
} from './types-v2';

export class Section4Adapter {
  /**
   * Convert V1 (bloated) to V2 (lean)
   * Strips: recommendations, reasoning, code examples, design guidelines
   * Keeps: factual chart candidates based on data characteristics
   *
   * Error handling strategy:
   * - Validates V1 input structure before processing
   * - Uses safe navigation and defaults for missing fields
   * - Skips invalid recommendations with warnings
   * - Returns minimal valid structure on critical errors
   */
  public static convertToV2(v1: VisualizationAnalysis): Section4VisualizationV2 {
    try {
      // Validate input
      if (!this.isValidV1Input(v1)) {
        logger.warn('Section4Adapter: Invalid V1 input, returning minimal structure', {
          context: 'convertToV2',
          hasInput: !!v1,
          inputType: typeof v1,
        });
        return this.getMinimalV2Structure();
      }
      const scatterPlots: ScatterPlotCandidate[] = [];
      const histograms: HistogramCandidate[] = [];
      const barCharts: BarChartCandidate[] = [];
      const boxPlots: BoxPlotCandidate[] = [];
      const heatmaps: HeatmapCandidate[] = [];
      const timeSeries: TimeSeriesCandidate[] = [];

      // Extract univariate chart candidates
      const univariateRecs = v1?.univariateRecommendations;
      if (Array.isArray(univariateRecs)) {
        univariateRecs.forEach((col) => {
          if (!col || typeof col !== 'object') {
            return;
          }
          try {
            this.extractUnivariateCharts(col, histograms, barCharts, boxPlots, timeSeries);
          } catch (error) {
            logger.warn('Section4Adapter: Error extracting univariate charts', {
              context: 'convertToV2',
              columnName: col.columnName,
              error: error instanceof Error ? error.message : String(error),
            });
          }
        });
      }

      // Extract bivariate chart candidates
      const bivariateRecs = v1?.bivariateRecommendations;
      if (Array.isArray(bivariateRecs)) {
        bivariateRecs.forEach((bivar) => {
          if (!bivar || typeof bivar !== 'object') {
            return;
          }
          try {
            this.extractBivariateCharts(bivar, scatterPlots, heatmaps);
          } catch (error) {
            logger.warn('Section4Adapter: Error extracting bivariate charts', {
              context: 'convertToV2',
              error: error instanceof Error ? error.message : String(error),
            });
          }
        });
      }

      return {
        version: '2.0',
        scatter_plots: scatterPlots,
        histograms,
        bar_charts: barCharts,
        box_plots: boxPlots,
        heatmaps,
        time_series: timeSeries,
        color_blind_safe_palettes: ['viridis', 'cividis', 'plasma'],
        requires_alt_text: true,
        suggested_width_px: this.calculateWidth(v1),
        suggested_height_px: this.calculateHeight(v1),
        dataset_size: this.getDatasetSize(v1),
        high_cardinality_columns: this.getHighCardinalityColumns(v1),
        sparse_data_columns: this.getSparseColumns(v1),
      };
    } catch (error) {
      logger.error('Section4Adapter: Critical error during V2 conversion', {
        context: 'convertToV2',
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      return this.getMinimalV2Structure();
    }
  }

  private static extractUnivariateCharts(
    col: ColumnVisualizationProfile,
    histograms: HistogramCandidate[],
    barCharts: BarChartCandidate[],
    boxPlots: BoxPlotCandidate[],
    timeSeries: TimeSeriesCandidate[],
  ): void {
    const dataType = col?.dataType?.toLowerCase() || '';
    const semanticType = col?.semanticType?.toLowerCase() || '';
    const columnName = col?.columnName || 'unknown';

    // Look for histogram candidates (numeric columns)
    if (dataType.includes('numerical') || dataType.includes('numeric')) {
      histograms.push({
        column: columnName,
        data_type: 'numeric',
        bin_count_suggestion: this.calculateBinCount(col),
        skewness: col?.distribution?.skewness || 0,
        has_outliers: false, // V1 doesn't track this at column level
      });

      boxPlots.push({
        column: columnName,
        has_outliers: false, // V1 doesn't track this at column level
        outlier_count: 0,
        iqr: 0, // V1 doesn't track this in visualization types
      });
    }

    // Look for bar chart candidates (categorical columns)
    if (dataType.includes('categorical')) {
      barCharts.push({
        column: columnName,
        category_count: col?.cardinality || 0,
        top_category_ratio: 0, // V1 doesn't track concentration
        is_ordered: false, // V1 doesn't track this
      });
    }

    // Look for time series candidates
    if (semanticType.includes('date') || semanticType.includes('time')) {
      // Time series would need a value column - this is handled in bivariate
      // Just mark that we have a date column
    }
  }

  private static extractBivariateCharts(
    bivar: BivariateVisualizationProfile,
    scatterPlots: ScatterPlotCandidate[],
    heatmaps: HeatmapCandidate[],
  ): void {
    // Scatter plots for numeric vs numeric
    if (bivar?.relationshipType === 'numerical_numerical') {
      scatterPlots.push({
        x_column: bivar.variable1 || 'unknown',
        y_column: bivar.variable2 || 'unknown',
        correlation: bivar.strength || 0,
        sample_size: 0, // V1 doesn't track this
        has_outliers: false, // V1 doesn't track this
      });
    }

    // Heatmaps - not enough info in V1 BivariateVisualizationProfile
    // Would need access to correlation matrix from Section 3
  }

  private static calculateBinCount(col: ColumnVisualizationProfile): number {
    // Sturges' rule: k = ceil(log2(n) + 1)
    // V1 doesn't track sampleSize in distribution, use default
    const n = 100;
    return Math.ceil(Math.log2(n) + 1);
  }

  private static calculateWidth(v1: VisualizationAnalysis): number {
    // Base on data density
    const complexity = v1?.strategy?.complexity || 'medium';
    switch (complexity) {
      case 'simple':
        return 600;
      case 'moderate':
        return 800;
      case 'complex':
        return 1200;
      default:
        return 800;
    }
  }

  private static calculateHeight(v1: VisualizationAnalysis): number {
    // Typically 2:3 aspect ratio
    return Math.round(this.calculateWidth(v1) * 0.67);
  }

  private static getDatasetSize(v1: VisualizationAnalysis): number {
    // V1 doesn't track sampleSize in distribution
    return 0;
  }

  private static getHighCardinalityColumns(v1: VisualizationAnalysis): string[] {
    try {
      const univariateRecs = v1?.univariateRecommendations;
      if (!Array.isArray(univariateRecs)) {
        return [];
      }
      return univariateRecs
        .filter((col) => col && typeof col === 'object' && (col.cardinality || 0) > 50)
        .map((col) => col.columnName || 'unknown');
    } catch (error) {
      logger.warn('Section4Adapter: Error getting high cardinality columns', {
        context: 'getHighCardinalityColumns',
        error: error instanceof Error ? error.message : String(error),
      });
      return [];
    }
  }

  private static getSparseColumns(v1: VisualizationAnalysis): string[] {
    try {
      const univariateRecs = v1?.univariateRecommendations;
      if (!Array.isArray(univariateRecs)) {
        return [];
      }
      return univariateRecs
        .filter((col) => col && typeof col === 'object' && (col.completeness || 1) < 0.5)
        .map((col) => col.columnName || 'unknown');
    } catch (error) {
      logger.warn('Section4Adapter: Error getting sparse columns', {
        context: 'getSparseColumns',
        error: error instanceof Error ? error.message : String(error),
      });
      return [];
    }
  }

  /**
   * Validates V1 input structure
   * Checks for required fields (at least one recommendation array)
   */
  private static isValidV1Input(v1: VisualizationAnalysis): boolean {
    if (!v1 || typeof v1 !== 'object') {
      return false;
    }

    // Check for at least some recommendation data
    return true; // V1 can have empty arrays, which is valid
  }

  /**
   * Returns a minimal valid V2 structure for error cases
   * Ensures that downstream consumers always receive valid structure
   */
  private static getMinimalV2Structure(): Section4VisualizationV2 {
    return {
      version: '2.0',
      scatter_plots: [],
      histograms: [],
      bar_charts: [],
      box_plots: [],
      heatmaps: [],
      time_series: [],
      color_blind_safe_palettes: ['viridis', 'cividis', 'plasma'],
      requires_alt_text: true,
      suggested_width_px: 800,
      suggested_height_px: 536,
      dataset_size: 0,
      high_cardinality_columns: [],
      sparse_data_columns: [],
    };
  }
}
