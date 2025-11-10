/**
 * Section 2: Adapter to convert V1 (bloated) to V2 (lean)
 * Temporary migration layer until we refactor the analyzer itself
 */

import { logger } from '@/utils/logger';
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
   *
   * Error handling strategy:
   * - Validates V1 input structure before processing
   * - Uses safe navigation and defaults for missing fields
   * - Returns minimal valid structure on critical errors
   * - Logs warnings for unexpected data, not errors
   */
  public static convertToV2(v1: Section2QualityAudit): Section2QualityAuditV2 {
    try {
      // Validate input
      if (!this.isValidV1Input(v1)) {
        logger.warn('Section2Adapter: Invalid V1 input, returning minimal structure', {
          context: 'convertToV2',
          hasInput: !!v1,
          inputType: typeof v1,
        });
        return this.getMinimalV2Structure();
      }

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
    } catch (error) {
      logger.error('Section2Adapter: Critical error during V2 conversion', {
        context: 'convertToV2',
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      return this.getMinimalV2Structure();
    }
  }

  private static extractQualityScores(v1: Section2QualityAudit): QualityMetrics {
    try {
      const scores = v1?.cockpit?.dimensionScores;
      if (!scores) {
        logger.warn('Section2Adapter: Missing dimension scores, using defaults', {
          context: 'extractQualityScores',
        });
        return {
          completeness: 0,
          accuracy: 0,
          consistency: 0,
          uniqueness: 0,
          validity: 0,
        };
      }

      return {
        completeness: (scores.completeness?.score || 0) / 100,
        accuracy: (scores.accuracy?.score || 0) / 100,
        consistency: (scores.consistency?.score || 0) / 100,
        uniqueness: (scores.uniqueness?.score || 0) / 100,
        validity: (scores.validity?.score || 0) / 100,
      };
    } catch (error) {
      logger.warn('Section2Adapter: Error extracting quality scores', {
        context: 'extractQualityScores',
        error: error instanceof Error ? error.message : String(error),
      });
      return {
        completeness: 0,
        accuracy: 0,
        consistency: 0,
        uniqueness: 0,
        validity: 0,
      };
    }
  }

  private static extractMissingData(v1: Section2QualityAudit): Section2QualityAuditV2['missing_data'] {
    try {
      const completeness = v1?.completeness;
      if (!completeness) {
        logger.warn('Section2Adapter: Missing completeness data, using defaults', {
          context: 'extractMissingData',
        });
        return {
          stats: {
            total_cells_missing: 0,
            rows_with_missing: 0,
            columns_with_missing: 0,
            missing_percentage: 0,
          },
          by_column: [],
          correlations: [],
        };
      }

      const datasetLevel = completeness.datasetLevel || ({} as any);
      const stats: MissingDataStats = {
        total_cells_missing: datasetLevel.totalMissingValues || 0,
        rows_with_missing: (datasetLevel.rowsWithMissingPercentage || 0) / 100,
        columns_with_missing: (datasetLevel.columnsWithMissingPercentage || 0) / 100,
        missing_percentage: (100 - (datasetLevel.overallCompletenessRatio || 100)) / 100,
      };

      const by_column: ColumnMissingData[] = [];
      if (Array.isArray(completeness.columnLevel)) {
        completeness.columnLevel.forEach((col) => {
          if (!col || typeof col !== 'object') {
            logger.warn('Section2Adapter: Skipping invalid column data in missing data', {
              context: 'extractMissingData',
            });
            return;
          }

          by_column.push({
            column: col.columnName || 'unknown',
            missing_count: col.missingCount || 0,
            missing_ratio: (col.missingPercentage || 0) / 100,
            empty_strings: 0, // Not tracked in V1
            null_values: col.missingCount || 0, // Approximate
            pattern_type: this.mapMissingnessPattern(col.missingnessPattern?.type),
            correlated_with: col.missingnessPattern?.correlatedColumns || [],
          });
        });
      }

      const correlations: MissingDataCorrelation[] = [];
      const matrixCorrelations = completeness.missingDataMatrix?.correlations;
      if (Array.isArray(matrixCorrelations)) {
        matrixCorrelations.forEach((corr) => {
          if (!corr || typeof corr !== 'object') {
            return;
          }
          correlations.push({
            column_a: corr.column1 || '',
            column_b: corr.column2 || '',
            correlation: corr.correlation || 0,
          });
        });
      }

      return { stats, by_column, correlations };
    } catch (error) {
      logger.warn('Section2Adapter: Error extracting missing data', {
        context: 'extractMissingData',
        error: error instanceof Error ? error.message : String(error),
      });
      return {
        stats: {
          total_cells_missing: 0,
          rows_with_missing: 0,
          columns_with_missing: 0,
          missing_percentage: 0,
        },
        by_column: [],
        correlations: [],
      };
    }
  }

  private static mapMissingnessPattern(
    pattern?: 'MCAR' | 'MAR' | 'MNAR' | 'Unknown',
  ): 'random' | 'correlated' | 'systematic' | 'unknown' {
    if (!pattern) {
      return 'unknown';
    }

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
    try {
      return {
        rule_violations: v1?.accuracy?.businessRuleSummary?.totalViolations || 0,
        critical_violations: v1?.accuracy?.businessRuleSummary?.criticalViolations || 0,
        pattern_violations: v1?.validity?.patternConformance?.length || 0,
        cross_field_violations: v1?.accuracy?.crossFieldValidation?.reduce((sum, rule) => sum + (rule?.violations || 0), 0) || 0,
      };
    } catch (error) {
      logger.warn('Section2Adapter: Error extracting violations', {
        context: 'extractViolations',
        error: error instanceof Error ? error.message : String(error),
      });
      return {
        rule_violations: 0,
        critical_violations: 0,
        pattern_violations: 0,
        cross_field_violations: 0,
      };
    }
  }

  private static extractPatternViolations(v1: Section2QualityAudit): PatternViolation[] | undefined {
    try {
      const patternValidation = v1?.accuracy?.patternValidation;
      if (!Array.isArray(patternValidation) || patternValidation.length === 0) {
        return undefined;
      }

      const violations: PatternViolation[] = [];
      patternValidation.forEach((pattern) => {
        if (!pattern || typeof pattern !== 'object') {
          return;
        }
        violations.push({
          pattern: pattern.patternName || 'unknown',
          column: Array.isArray(pattern.affectedColumns) ? pattern.affectedColumns.join(', ') : '',
          violation_count: pattern.violationCount || 0,
          examples: [], // Not available in V1
        });
      });

      return violations.length > 0 ? violations : undefined;
    } catch (error) {
      logger.warn('Section2Adapter: Error extracting pattern violations', {
        context: 'extractPatternViolations',
        error: error instanceof Error ? error.message : String(error),
      });
      return undefined;
    }
  }

  private static extractConsistencyIssues(v1: Section2QualityAudit): ConsistencyIssues {
    try {
      return {
        format_inconsistencies: v1?.consistency?.formatConsistency?.length || 0,
        casing_inconsistencies: 0, // Not tracked in V1
        encoding_issues: 0, // Not tracked in V1
        delimiter_issues: 0, // Not tracked in V1
      };
    } catch (error) {
      logger.warn('Section2Adapter: Error extracting consistency issues', {
        context: 'extractConsistencyIssues',
        error: error instanceof Error ? error.message : String(error),
      });
      return {
        format_inconsistencies: 0,
        casing_inconsistencies: 0,
        encoding_issues: 0,
        delimiter_issues: 0,
      };
    }
  }

  private static extractFormatInconsistencies(v1: Section2QualityAudit): FormatInconsistency[] | undefined {
    try {
      const formatConsistency = v1?.consistency?.formatConsistency;
      if (!Array.isArray(formatConsistency) || formatConsistency.length === 0) {
        return undefined;
      }

      const inconsistencies: FormatInconsistency[] = [];
      formatConsistency.forEach((format) => {
        if (!format || typeof format !== 'object') {
          return;
        }
        inconsistencies.push({
          column: format.columnName || 'unknown',
          patterns_found: [], // Not detailed enough in V1
          pattern_counts: [],
          examples: [],
        });
      });

      return inconsistencies.length > 0 ? inconsistencies : undefined;
    } catch (error) {
      logger.warn('Section2Adapter: Error extracting format inconsistencies', {
        context: 'extractFormatInconsistencies',
        error: error instanceof Error ? error.message : String(error),
      });
      return undefined;
    }
  }

  private static extractDuplicates(v1: Section2QualityAudit): DuplicateAnalysis {
    try {
      const exactDuplicates = v1?.uniqueness?.exactDuplicates;
      return {
        exact_duplicates: exactDuplicates?.count || 0,
        exact_duplicate_ratio: (exactDuplicates?.percentage || 0) / 100,
        fuzzy_duplicates: undefined, // Not in V1
        duplicate_groups: exactDuplicates?.duplicateGroups?.length,
      };
    } catch (error) {
      logger.warn('Section2Adapter: Error extracting duplicates', {
        context: 'extractDuplicates',
        error: error instanceof Error ? error.message : String(error),
      });
      return {
        exact_duplicates: 0,
        exact_duplicate_ratio: 0,
        fuzzy_duplicates: undefined,
        duplicate_groups: undefined,
      };
    }
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
    try {
      const mean_applicable: string[] = [];
      const median_applicable: string[] = [];
      const mode_applicable: string[] = [];
      const ml_imputation_candidates: string[] = [];
      const domain_knowledge_required: string[] = [];
      const drop_candidates: string[] = [];

      const columnLevel = v1?.completeness?.columnLevel;
      if (!Array.isArray(columnLevel)) {
        logger.warn('Section2Adapter: Missing column level data for imputation candidates', {
          context: 'extractImputationCandidates',
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

      // Classify based on imputation method suggestions
      columnLevel.forEach((col) => {
        if (!col || typeof col !== 'object') {
          return;
        }

        const method = col.suggestedImputation?.method;
        const missingPct = col.missingPercentage || 0;
        const columnName = col.columnName || 'unknown';

        // High missing percentage -> consider dropping
        if (missingPct > 70) {
          drop_candidates.push(columnName);
        }

        switch (method) {
          case 'Mean':
            mean_applicable.push(columnName);
            break;
          case 'Median':
            median_applicable.push(columnName);
            break;
          case 'Mode':
            mode_applicable.push(columnName);
            break;
          case 'ML Model':
          case 'Regression':
            ml_imputation_candidates.push(columnName);
            break;
          case 'Domain Input Required':
            domain_knowledge_required.push(columnName);
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
    } catch (error) {
      logger.warn('Section2Adapter: Error extracting imputation candidates', {
        context: 'extractImputationCandidates',
        error: error instanceof Error ? error.message : String(error),
      });
      return {
        mean_applicable: [],
        median_applicable: [],
        mode_applicable: [],
        ml_imputation_candidates: [],
        domain_knowledge_required: [],
        drop_candidates: [],
      };
    }
  }

  private static extractDatasetStats(v1: Section2QualityAudit): Section2QualityAuditV2['dataset_stats'] {
    try {
      const columnLevel = v1?.completeness?.columnLevel;
      const datasetLevel = v1?.completeness?.datasetLevel;
      const totalColumns = Array.isArray(columnLevel) ? columnLevel.length : 0;

      let totalCells = 0;
      if (datasetLevel) {
        const missingValues = datasetLevel.totalMissingValues || 0;
        const completenessRatio = datasetLevel.overallCompletenessRatio || 100;
        const denominator = 1 - completenessRatio / 100;
        if (denominator > 0) {
          totalCells = missingValues / denominator;
        }
      }

      return {
        total_rows: 0, // Not available in V1 quality audit
        total_columns: totalColumns,
        total_cells: totalCells,
        data_types: {}, // Not tracked in V1
      };
    } catch (error) {
      logger.warn('Section2Adapter: Error extracting dataset stats', {
        context: 'extractDatasetStats',
        error: error instanceof Error ? error.message : String(error),
      });
      return {
        total_rows: 0,
        total_columns: 0,
        total_cells: 0,
        data_types: {},
      };
    }
  }

  /**
   * Validates V1 input structure
   * Checks for required top-level fields
   */
  private static isValidV1Input(v1: Section2QualityAudit): boolean {
    if (!v1 || typeof v1 !== 'object') {
      return false;
    }

    // Check for required top-level structures
    const hasRequiredFields =
      v1.cockpit !== undefined &&
      v1.completeness !== undefined &&
      v1.accuracy !== undefined &&
      v1.consistency !== undefined &&
      v1.uniqueness !== undefined &&
      v1.validity !== undefined;

    return hasRequiredFields;
  }

  /**
   * Returns a minimal valid V2 structure for error cases
   * Ensures that downstream consumers always receive valid structure
   */
  private static getMinimalV2Structure(): Section2QualityAuditV2 {
    return {
      version: '2.0',
      quality_scores: {
        completeness: 0,
        accuracy: 0,
        consistency: 0,
        uniqueness: 0,
        validity: 0,
      },
      missing_data: {
        stats: {
          total_cells_missing: 0,
          rows_with_missing: 0,
          columns_with_missing: 0,
          missing_percentage: 0,
        },
        by_column: [],
        correlations: [],
      },
      violations: {
        rule_violations: 0,
        critical_violations: 0,
        pattern_violations: 0,
        cross_field_violations: 0,
      },
      pattern_violations: undefined,
      consistency: {
        format_inconsistencies: 0,
        casing_inconsistencies: 0,
        encoding_issues: 0,
        delimiter_issues: 0,
      },
      format_inconsistencies: undefined,
      duplicates: {
        exact_duplicates: 0,
        exact_duplicate_ratio: 0,
        fuzzy_duplicates: undefined,
        duplicate_groups: undefined,
      },
      key_violations: undefined,
      patterns: undefined,
      imputation_candidates: {
        mean_applicable: [],
        median_applicable: [],
        mode_applicable: [],
        ml_imputation_candidates: [],
        domain_knowledge_required: [],
        drop_candidates: [],
      },
      dataset_stats: {
        total_rows: 0,
        total_columns: 0,
        total_cells: 0,
        data_types: {},
      },
    };
  }
}
