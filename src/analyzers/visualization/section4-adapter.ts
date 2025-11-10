/**
 * Section 4: Visualization Adapter (V1 → V2)
 * Converts bloated visualization recommendations to lean chart candidate facts
 */

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
   */
  public static convertToV2(v1: VisualizationAnalysis): Section4VisualizationV2 {
    const scatterPlots: ScatterPlotCandidate[] = [];
    const histograms: HistogramCandidate[] = [];
    const barCharts: BarChartCandidate[] = [];
    const boxPlots: BoxPlotCandidate[] = [];
    const heatmaps: HeatmapCandidate[] = [];
    const timeSeries: TimeSeriesCandidate[] = [];

    // Extract univariate chart candidates
    v1.univariateRecommendations?.forEach((col) => {
      this.extractUnivariateCharts(col, histograms, barCharts, boxPlots, timeSeries);
    });

    // Extract bivariate chart candidates
    v1.bivariateRecommendations?.forEach((bivar) => {
      this.extractBivariateCharts(bivar, scatterPlots, heatmaps);
    });

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
  }

  private static extractUnivariateCharts(
    col: ColumnVisualizationProfile,
    histograms: HistogramCandidate[],
    barCharts: BarChartCandidate[],
    boxPlots: BoxPlotCandidate[],
    timeSeries: TimeSeriesCandidate[],
  ): void {
    // Look for histogram candidates (numeric columns)
    if (col.dataType?.toLowerCase().includes('numerical') || col.dataType?.toLowerCase().includes('numeric')) {
      histograms.push({
        column: col.columnName,
        data_type: 'numeric',
        bin_count_suggestion: this.calculateBinCount(col),
        skewness: col.distribution?.skewness || 0,
        has_outliers: false, // V1 doesn't track this at column level
      });

      boxPlots.push({
        column: col.columnName,
        has_outliers: false, // V1 doesn't track this at column level
        outlier_count: 0,
        iqr: 0, // V1 doesn't track this in visualization types
      });
    }

    // Look for bar chart candidates (categorical columns)
    if (col.dataType?.toLowerCase().includes('categorical')) {
      barCharts.push({
        column: col.columnName,
        category_count: col.cardinality || 0,
        top_category_ratio: 0, // V1 doesn't track concentration
        is_ordered: false, // V1 doesn't track this
      });
    }

    // Look for time series candidates
    if (col.semanticType?.toLowerCase().includes('date') || col.semanticType?.toLowerCase().includes('time')) {
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
    if (bivar.relationshipType === 'numerical_numerical') {
      scatterPlots.push({
        x_column: bivar.variable1,
        y_column: bivar.variable2,
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
    const complexity = v1.strategy?.complexity || 'medium';
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
    return (
      v1.univariateRecommendations
        ?.filter((col) => (col.cardinality || 0) > 50)
        .map((col) => col.columnName) || []
    );
  }

  private static getSparseColumns(v1: VisualizationAnalysis): string[] {
    return (
      v1.univariateRecommendations
        ?.filter((col) => (col.completeness || 1) < 0.5)
        .map((col) => col.columnName) || []
    );
  }
}
