/**
 * Section 5: Engineering - AI-Ready Types (V2)
 * Schema optimization and feature engineering candidates
 */

// ============================================================================
// TYPE OPTIMIZATION
// ============================================================================

export interface TypeOptimization {
  column: string;
  current_type: string;
  suggested_type: string;
  conversion_safe: boolean; // No data loss
  memory_savings_ratio: number; // 0-1
}

export interface CategoricalCandidate {
  column: string;
  unique_ratio: number; // 0-1
  cardinality: number;
  encoding_recommendation: 'onehot' | 'label' | 'target' | 'frequency';
}

// ============================================================================
// FEATURE ENGINEERING
// ============================================================================

export interface InteractionFeature {
  col_a: string;
  col_b: string;
  interaction_type: 'multiply' | 'divide' | 'add' | 'subtract';
  correlation_with_target?: number;
}

export interface BinningCandidate {
  column: string;
  current_unique: number;
  suggested_bins: number;
  binning_method: 'equal_width' | 'equal_frequency' | 'kmeans';
}

export interface DateFeatureCandidate {
  column: string;
  extractable_features: string[]; // e.g., ['year', 'month', 'day_of_week', 'is_weekend']
}

// ============================================================================
// MULTI-FILE RELATIONSHIPS
// ============================================================================

export interface JoinCandidate {
  left_file: string;
  right_file: string;
  left_column: string;
  right_column: string;
  join_type: 'one_to_one' | 'one_to_many' | 'many_to_many';
  match_ratio: number; // 0-1, how many rows would match
  cardinality_left: number;
  cardinality_right: number;
}

// ============================================================================
// MAIN ENGINEERING ANALYSIS (V2)
// ============================================================================

export interface Section5EngineeringV2 {
  version: '2.0';

  // Type optimization
  type_optimizations: TypeOptimization[];
  categorical_candidates: CategoricalCandidate[];

  // Feature engineering
  interaction_features: InteractionFeature[];
  binning_candidates: BinningCandidate[];
  date_features: DateFeatureCandidate[];

  // Multi-file analysis (if applicable)
  join_candidates?: JoinCandidate[];

  // Memory stats
  current_memory_mb: number;
  optimized_memory_mb: number;
  memory_reduction_ratio: number; // 0-1
}
