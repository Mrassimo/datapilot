/**
 * Section 2: Adapter to convert V1 (bloated) to V2 (lean)
 * Temporary migration layer until we refactor the analyzer itself
 */

import type { Section2QualityAudit } from './types';
import type {
  Section2QualityAuditV2,
  QualityMetrics,
  MissingDataStats,
  ColumnMissingData,
  MissingDataCorrelation,
  ValidationViolations,
  PatternViolation,
  ConsistencyIssues,
  FormatInconsistency,
  DuplicateAnalysis,
  KeyConstraintViolation,
  ImputationCandidates,
  ColumnPatterns,
  DetectedPattern,
} from './types-v2';

export class Section2Adapter {
  /**
   * Convert V1 output to V2 (lean) output
   * Strips all bloat: interpretations, descriptions, recommendations
   */
  public static convertToV2(v1: Section2QualityAudit): Section2QualityAuditV2 {
    return {
      version: '2.0',

      quality_scores: this.extractQualityScores(v1),
      missing_data: this.extractMissingData(v1),
      violations: this.extractViolations(v1),
      pattern_violations: this.extractPatternViolations(v1),
      consistency: this.extractConsistencyIssues(v1),
      format_inconsistencies: this.extractFormatInconsistencies(v1),
      duplicates: this.extractDuplicates(v1),
      key_violations: this.extractKeyViolations(v1),
      patterns: this.extractPatterns(v1),
      imputation_candidates: this.extractImputationCandidates(v1),
      dataset_stats: this.extractDatasetStats(v1),
    };
  }

  private static extractQualityScores(v1: Section2QualityAudit): QualityMetrics {
    const scores = v1.cockpit.dimensionScores;
    return {
      completeness: scores.completeness.score / 100,
      accuracy: scores.accuracy.score / 100,
      consistency: scores.consistency.score / 100,
      uniqueness: scores.uniqueness.score / 100,
      validity: scores.validity.score / 100,
    };
  }

  private static extractMissingData(v1: Section2QualityAudit): Section2QualityAuditV2['missing_data'] {
    const stats: MissingDataStats = {
      total_cells_missing: v1.completeness.datasetLevel.totalMissingValues,
      rows_with_missing: v1.completeness.datasetLevel.rowsWithMissingPercentage / 100,
      columns_with_missing: v1.completeness.datasetLevel.columnsWithMissingPercentage / 100,
      missing_percentage: (100 - v1.completeness.datasetLevel.overallCompletenessRatio) / 100,
    };

    const by_column: ColumnMissingData[] = v1.completeness.columnLevel.map((col) => ({
      column: col.columnName,
      missing_count: col.missingCount,
      missing_ratio: col.missingPercentage / 100,
      empty_strings: 0, // Not tracked in V1
      null_values: col.missingCount, // Approximate
      pattern_type: this.mapMissingnessPattern(col.missingnessPattern.type),
      correlated_with: col.missingnessPattern.correlatedColumns,
    }));

    const correlations: MissingDataCorrelation[] = v1.completeness.missingDataMatrix.correlations.map((corr) => ({
      column_a: corr.column1,
      column_b: corr.column2,
      correlation: corr.correlation,
    }));

    return { stats, by_column, correlations };
  }

  private static mapMissingnessPattern(
    pattern: 'MCAR' | 'MAR' | 'MNAR' | 'Unknown',
  ): 'random' | 'correlated' | 'systematic' | 'unknown' {
    switch (pattern) {
      case 'MCAR':
        return 'random';
      case 'MAR':
        return 'correlated';
      case 'MNAR':
        return 'systematic';
      default:
        return 'unknown';
    }
  }

  private static extractViolations(v1: Section2QualityAudit): ValidationViolations {
    return {
      rule_violations: v1.accuracy.businessRuleSummary?.totalViolations || 0,
      critical_violations: v1.accuracy.businessRuleSummary?.criticalViolations || 0,
      pattern_violations: v1.validity.patternConformance?.length || 0,
      cross_field_violations: v1.accuracy.crossFieldValidation?.reduce((sum, rule) => sum + rule.violations, 0) || 0,
    };
  }

  private static extractPatternViolations(v1: Section2QualityAudit): PatternViolation[] | undefined {
    if (!v1.accuracy.patternValidation || v1.accuracy.patternValidation.length === 0) {
      return undefined;
    }

    return v1.accuracy.patternValidation.map((pattern) => ({
      pattern: pattern.patternName,
      column: pattern.affectedColumns.join(', '),
      violation_count: pattern.violationCount,
      examples: [], // Not available in V1
    }));
  }

  private static extractConsistencyIssues(v1: Section2QualityAudit): ConsistencyIssues {
    return {
      format_inconsistencies: v1.consistency.formatConsistency?.length || 0,
      casing_inconsistencies: 0, // Not tracked in V1
      encoding_issues: 0, // Not tracked in V1
      delimiter_issues: 0, // Not tracked in V1
    };
  }

  private static extractFormatInconsistencies(v1: Section2QualityAudit): FormatInconsistency[] | undefined {
    if (!v1.consistency.formatConsistency || v1.consistency.formatConsistency.length === 0) {
      return undefined;
    }

    return v1.consistency.formatConsistency.map((format) => ({
      column: format.columnName,
      patterns_found: [], // Not detailed enough in V1
      pattern_counts: [],
      examples: [],
    }));
  }

  private static extractDuplicates(v1: Section2QualityAudit): DuplicateAnalysis {
    return {
      exact_duplicates: v1.uniqueness.exactDuplicates?.count || 0,
      exact_duplicate_ratio: (v1.uniqueness.exactDuplicates?.percentage || 0) / 100,
      fuzzy_duplicates: undefined, // Not in V1
      duplicate_groups: v1.uniqueness.exactDuplicates?.duplicateGroups?.length,
    };
  }

  private static extractKeyViolations(v1: Section2QualityAudit): KeyConstraintViolation[] | undefined {
    // V1 structure doesn't have detailed key violations
    // TODO: Map from keyUniqueness when available
    return undefined;
  }

  private static extractPatterns(v1: Section2QualityAudit): ColumnPatterns[] | undefined {
    // V1 doesn't have detailed pattern detection
    // This would need to be added to the analyzer
    return undefined;
  }

  private static extractImputationCandidates(v1: Section2QualityAudit): ImputationCandidates {
    const mean_applicable: string[] = [];
    const median_applicable: string[] = [];
    const mode_applicable: string[] = [];
    const ml_imputation_candidates: string[] = [];
    const domain_knowledge_required: string[] = [];
    const drop_candidates: string[] = [];

    // Classify based on imputation method suggestions
    v1.completeness.columnLevel.forEach((col) => {
      const method = col.suggestedImputation.method;
      const missingPct = col.missingPercentage;

      // High missing percentage -> consider dropping
      if (missingPct > 70) {
        drop_candidates.push(col.columnName);
      }

      switch (method) {
        case 'Mean':
          mean_applicable.push(col.columnName);
          break;
        case 'Median':
          median_applicable.push(col.columnName);
          break;
        case 'Mode':
          mode_applicable.push(col.columnName);
          break;
        case 'ML Model':
        case 'Regression':
          ml_imputation_candidates.push(col.columnName);
          break;
        case 'Domain Input Required':
          domain_knowledge_required.push(col.columnName);
          break;
      }
    });

    return {
      mean_applicable,
      median_applicable,
      mode_applicable,
      ml_imputation_candidates,
      domain_knowledge_required,
      drop_candidates,
    };
  }

  private static extractDatasetStats(v1: Section2QualityAudit): Section2QualityAuditV2['dataset_stats'] {
    // Need to extract from profiling insights
    const totalColumns = v1.completeness.columnLevel.length;

    return {
      total_rows: 0, // Not available in V1 quality audit
      total_columns: totalColumns,
      total_cells: v1.completeness.datasetLevel.totalMissingValues / (1 - v1.completeness.datasetLevel.overallCompletenessRatio / 100),
      data_types: {}, // Not tracked in V1
    };
  }
}
