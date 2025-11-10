/**
 * Section 4: Visualization - AI-Ready Types (V2)
 * Chart candidates without prescriptive recommendations
 */

// ============================================================================
// CHART CANDIDATES (Facts, not recommendations)
// ============================================================================

export interface ScatterPlotCandidate {
  x_column: string;
  y_column: string;
  correlation: number;
  sample_size: number;
  has_outliers: boolean;
}

export interface HistogramCandidate {
  column: string;
  data_type: 'numeric';
  bin_count_suggestion: number; // Sturges' rule result
  skewness: number;
  has_outliers: boolean;
}

export interface BarChartCandidate {
  column: string;
  category_count: number;
  top_category_ratio: number; // Concentration in top category
  is_ordered: boolean;
}

export interface BoxPlotCandidate {
  column: string;
  has_outliers: boolean;
  outlier_count: number;
  iqr: number;
}

export interface HeatmapCandidate {
  columns: string[];
  correlation_range: [number, number]; // Min and max correlation
  strong_correlations: number;
}

export interface TimeSeriesCandidate {
  date_column: string;
  value_column: string;
  has_trend: boolean;
  has_seasonality: boolean;
  data_points: number;
}

// ============================================================================
// MAIN VISUALIZATION ANALYSIS (V2)
// ============================================================================

export interface Section4VisualizationV2 {
  version: '2.0';

  // Chart candidates by type
  scatter_plots: ScatterPlotCandidate[];
  histograms: HistogramCandidate[];
  bar_charts: BarChartCandidate[];
  box_plots: BoxPlotCandidate[];
  heatmaps: HeatmapCandidate[];
  time_series: TimeSeriesCandidate[];

  // Accessibility considerations (factual)
  color_blind_safe_palettes: string[]; // e.g., ['viridis', 'cividis']
  requires_alt_text: boolean;
  suggested_width_px: number; // Based on data density
  suggested_height_px: number;

  // Data characteristics affecting visualization
  dataset_size: number;
  high_cardinality_columns: string[]; // > 50 unique values
  sparse_data_columns: string[]; // > 50% missing
}
