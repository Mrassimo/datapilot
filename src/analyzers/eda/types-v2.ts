/**
 * Section 3: EDA - AI-Ready Types (V2)
 * Facts-only statistical analysis optimized for AI interpretation
 */

// ============================================================================
// CORE COLUMN PROFILE (Lean)
// ============================================================================

export interface ColumnProfile {
  column: string;
  data_type: string; // 'numeric', 'categorical', 'text', 'datetime', 'boolean'
  semantic_type?: string; // 'currency', 'age', 'identifier', etc. (optional hint, not interpretation)

  // Basic counts
  total: number;
  missing: number;
  missing_ratio: number; // 0-1
  unique: number;
  unique_ratio: number; // 0-1
}

// ============================================================================
// NUMERICAL STATISTICS (Lean)
// ============================================================================

export interface NumericStats {
  column: string;

  // Descriptive stats
  min: number;
  max: number;
  mean: number;
  median: number;
  std_dev: number;
  variance: number;

  // Quantiles
  q1: number; // 25th percentile
  q3: number; // 75th percentile
  iqr: number;

  // Shape
  skewness: number;
  kurtosis: number;

  // Special values
  zeros: number;
  negatives: number;
}

// ============================================================================
// CATEGORICAL STATISTICS (Lean)
// ============================================================================

export interface CategoryStats {
  column: string;

  // Counts
  unique_categories: number;

  // Top categories
  top_5: Array<{
    value: string;
    count: number;
    ratio: number; // 0-1
  }>;

  // Distribution
  entropy: number; // Measure of randomness
  concentration: number; // How concentrated in top values (0-1)
}

// ============================================================================
// TEXT STATISTICS (Lean)
// ============================================================================

export interface TextStats {
  column: string;

  // Length stats
  min_length: number;
  max_length: number;
  avg_length: number;

  // Pattern detection
  patterns: Array<{
    regex: string;
    matches: number;
    ratio: number; // 0-1
    examples: string[]; // Max 3
  }>;

  // Anomalies (boolean flags)
  contains_urls: boolean;
  contains_emails: boolean;
  contains_phones: boolean;
  contains_numbers: boolean;
  mixed_case: boolean;
}

// ============================================================================
// OUTLIER DETECTION (Lean)
// ============================================================================

export interface OutlierAnalysis {
  column: string;

  // IQR method
  iqr_lower_outliers: number;
  iqr_upper_outliers: number;
  iqr_lower_fence: number;
  iqr_upper_fence: number;

  // Z-score method
  zscore_outliers: number; // Count beyond ±3σ

  // Examples
  outlier_examples: number[]; // Up to 5
}

// ============================================================================
// CORRELATION ANALYSIS (Lean)
// ============================================================================

export interface CorrelationPair {
  col_a: string;
  col_b: string;
  correlation: number; // -1 to 1
  p_value: number;
  sample_size: number;
}

export interface CorrelationMatrix {
  numeric_columns: string[];
  correlations: CorrelationPair[];
  // Only include pairs with |correlation| > threshold (e.g., 0.3)
  strong_correlations: CorrelationPair[]; // |r| > 0.7
  moderate_correlations: CorrelationPair[]; // 0.3 < |r| < 0.7
}

// ============================================================================
// DISTRIBUTION DETECTION (Lean)
// ============================================================================

export interface DistributionFit {
  column: string;

  // Normality tests (just p-values, AI interprets)
  shapiro_wilk_p: number;
  jarque_bera_p: number;

  // Distribution characteristics
  is_symmetric: boolean; // |skewness| < 0.5
  is_unimodal: boolean;
  has_heavy_tails: boolean; // |kurtosis| > 3
}

// ============================================================================
// MAIN EDA RESULT (V2)
// ============================================================================

export interface Section3EdaAnalysisV2 {
  version: '2.0';

  // Column profiles
  columns: ColumnProfile[];

  // Statistics by type
  numeric_stats: NumericStats[];
  categorical_stats: CategoryStats[];
  text_stats: TextStats[];

  // Outliers
  outliers: OutlierAnalysis[];

  // Correlations
  correlations: CorrelationMatrix;

  // Distributions
  distributions: DistributionFit[];

  // Dataset summary
  dataset_summary: {
    total_rows: number;
    total_columns: number;
    numeric_columns: number;
    categorical_columns: number;
    text_columns: number;
    datetime_columns: number;
  };
}
