/**
 * Section 2: Data Quality - AI-Ready Types (V2)
 * Facts-only output optimized for AI interpretation
 *
 * Design Philosophy:
 * - NO subjective interpretations ("Good", "Poor")
 * - NO verbose descriptions
 * - NO recommendations (AI decides)
 * - YES raw numbers, patterns, flags
 */

// ============================================================================
// CORE TYPES (Lean)
// ============================================================================

/**
 * Raw quality scores (0-1 decimal, not 0-100)
 * AI interprets whether score is good/bad based on context
 */
export interface QualityMetrics {
  completeness: number; // 0-1
  accuracy: number; // 0-1
  consistency: number; // 0-1
  uniqueness: number; // 0-1
  validity: number; // 0-1
}

// ============================================================================
// COMPLETENESS
// ============================================================================

export interface MissingDataStats {
  total_cells_missing: number;
  rows_with_missing: number; // 0-1 ratio
  columns_with_missing: number; // 0-1 ratio
  missing_percentage: number; // 0-1
}

export interface ColumnMissingData {
  column: string;
  missing_count: number;
  missing_ratio: number; // 0-1
  empty_strings: number;
  null_values: number;
  // Pattern classification (factual, not interpretive)
  pattern_type: 'random' | 'correlated' | 'systematic' | 'unknown';
  correlated_with?: string[]; // Just the column names, AI infers relationship
}

export interface MissingDataCorrelation {
  column_a: string;
  column_b: string;
  correlation: number; // -1 to 1
}

// ============================================================================
// ACCURACY & VALIDITY
// ============================================================================

export interface ValidationViolations {
  rule_violations: number;
  critical_violations: number;
  pattern_violations: number;
  cross_field_violations: number;
}

export interface PatternViolation {
  pattern: string; // regex or rule name
  column: string;
  violation_count: number;
  examples: string[]; // Up to 3 examples
}

// ============================================================================
// CONSISTENCY
// ============================================================================

export interface ConsistencyIssues {
  format_inconsistencies: number;
  casing_inconsistencies: number;
  encoding_issues: number;
  delimiter_issues: number;
}

export interface FormatInconsistency {
  column: string;
  patterns_found: string[]; // List of different formats detected
  pattern_counts: number[]; // Count for each pattern
  examples: string[][]; // Examples for each pattern
}

// ============================================================================
// UNIQUENESS & DUPLICATES
// ============================================================================

export interface DuplicateAnalysis {
  exact_duplicates: number;
  exact_duplicate_ratio: number; // 0-1
  fuzzy_duplicates?: number;
  duplicate_groups?: number;
}

export interface KeyConstraintViolation {
  columns: string[];
  violation_count: number;
  expected_unique: boolean;
  actual_unique_ratio: number; // 0-1
}

// ============================================================================
// PATTERN DETECTION
// ============================================================================

export interface DetectedPattern {
  regex: string;
  count: number;
  ratio: number; // 0-1
  examples: string[]; // Max 3
}

export interface ColumnPatterns {
  column: string;
  patterns: DetectedPattern[];
  // Anomaly flags (boolean/counts only, no severity ratings)
  anomalies: {
    urls_detected?: number;
    emails_detected?: number;
    phone_numbers?: number;
    mixed_types?: number;
    mixed_units?: number;
    non_printable_chars?: number;
    cross_column_leakage?: boolean;
  };
}

// ============================================================================
// IMPUTATION CANDIDATES
// ============================================================================

/**
 * Factual assessment of imputation applicability
 * AI decides which method to use based on these facts
 */
export interface ImputationCandidates {
  // Columns where statistical methods work
  mean_applicable: string[];
  median_applicable: string[];
  mode_applicable: string[];

  // Columns where ML/advanced methods needed
  ml_imputation_candidates: string[];

  // Columns requiring domain knowledge
  domain_knowledge_required: string[];

  // Columns better dropped
  drop_candidates: string[]; // High missing ratio + low correlation
}

// ============================================================================
// MAIN QUALITY AUDIT STRUCTURE (V2)
// ============================================================================

export interface Section2QualityAuditV2 {
  version: '2.0';

  // Overall quality metrics (just numbers)
  quality_scores: QualityMetrics;

  // Missing data analysis
  missing_data: {
    stats: MissingDataStats;
    by_column: ColumnMissingData[];
    correlations: MissingDataCorrelation[];
  };

  // Validation violations
  violations: ValidationViolations;
  pattern_violations?: PatternViolation[];

  // Consistency issues
  consistency: ConsistencyIssues;
  format_inconsistencies?: FormatInconsistency[];

  // Duplicates
  duplicates: DuplicateAnalysis;
  key_violations?: KeyConstraintViolation[];

  // Pattern detection
  patterns?: ColumnPatterns[];

  // Imputation guidance (factual, not prescriptive)
  imputation_candidates: ImputationCandidates;

  // Raw statistics for AI context
  dataset_stats: {
    total_rows: number;
    total_columns: number;
    total_cells: number;
    data_types: Record<string, number>; // { "numeric": 15, "text": 28 }
  };
}

// ============================================================================
// MIGRATION HELPERS
// ============================================================================

/**
 * Helper to convert old score (0-100) to new score (0-1)
 */
export function normalizeScore(oldScore: number): number {
  return oldScore / 100;
}

/**
 * Helper to strip interpretation and keep only score
 */
export function stripInterpretation(old: { score: number; interpretation: string; details?: string }): number {
  return normalizeScore(old.score);
}
