/**
 * Section 6: Modeling - AI-Ready Types (V2)
 * ML task detection and algorithm applicability
 */

// ============================================================================
// ML TASK DETECTION
// ============================================================================

export interface ClassificationTask {
  type: 'classification';
  target_column: string;
  classes: number;
  class_distribution: Record<string, number>; // Class -> count
  is_balanced: boolean;
  min_class_ratio: number; // Smallest class ratio
}

export interface RegressionTask {
  type: 'regression';
  target_column: string;
  range: [number, number];
  distribution_type: 'normal' | 'skewed' | 'bimodal' | 'uniform';
  has_outliers: boolean;
  outlier_ratio: number;
}

export interface ClusteringTask {
  type: 'clustering';
  feature_count: number;
  sample_size: number;
  has_mixed_types: boolean;
}

export type MLTask = ClassificationTask | RegressionTask | ClusteringTask;

// ============================================================================
// ALGORITHM APPLICABILITY
// ============================================================================

export interface AlgorithmApplicability {
  algorithm_family: string; // 'linear', 'tree', 'ensemble', 'neural', 'svm'
  applicable: boolean;
  reasons: string[]; // Factual reasons: 'small_sample_size', 'high_dimensionality', etc.
  computational_complexity: 'low' | 'medium' | 'high';
}

// ============================================================================
// DATA READINESS
// ============================================================================

export interface DataReadiness {
  missing_data_ratio: number; // 0-1
  requires_imputation: boolean;
  requires_scaling: boolean;
  requires_encoding: boolean;
  categorical_features: number;
  numeric_features: number;
  total_features: number;
  sample_size: number;
  train_test_split_feasible: boolean; // Enough samples for 80/20 split
}

// ============================================================================
// MAIN MODELING ANALYSIS (V2)
// ============================================================================

export interface Section6ModelingV2 {
  version: '2.0';

  // Detected ML tasks
  ml_tasks: MLTask[];

  // Algorithm applicability by family
  algorithms: AlgorithmApplicability[];

  // Data readiness
  data_readiness: DataReadiness;

  // Validation strategy
  validation: {
    sample_size: number;
    recommended_cv_folds: number;
    train_size: number;
    test_size: number;
    stratification_required: boolean;
  };

  // Feature importance candidates (columns likely to be predictive)
  feature_candidates: Array<{
    column: string;
    correlation_with_target: number;
    missing_ratio: number;
    importance_score: number; // 0-1, based on correlation + completeness
  }>;
}
