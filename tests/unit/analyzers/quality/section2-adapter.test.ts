/**
 * Section 2 Adapter Tests
 *
 * Tests the V1 → V2 conversion for Quality Audit data
 * Verifies field mappings, calculations, and edge cases
 */

import { Section2Adapter } from '../../../../src/analyzers/quality/section2-adapter';
import type { Section2QualityAudit } from '../../../../src/analyzers/quality/types';
import type { Section2QualityAuditV2 } from '../../../../src/analyzers/quality/types-v2';

describe('Section2Adapter', () => {
  describe('convertToV2', () => {
    describe('Happy Path Tests', () => {
      it('should convert valid V1 quality audit to V2 format', () => {
        const v1Input: Section2QualityAudit = {
          cockpit: {
            overallScore: 85,
            dimensionScores: {
              completeness: { score: 95, interpretation: 'Excellent' },
              accuracy: { score: 80, interpretation: 'Good' },
              consistency: { score: 90, interpretation: 'Very Good' },
              uniqueness: { score: 75, interpretation: 'Acceptable' },
              validity: { score: 85, interpretation: 'Good' },
            },
          },
          completeness: {
            datasetLevel: {
              totalMissingValues: 100,
              overallCompletenessRatio: 95.5,
              rowsWithMissingPercentage: 10.5,
              columnsWithMissingPercentage: 20.0,
              distributionOverview: "",
            },
            columnLevel: [
              {
                columnName: 'id',
                missingCount: 0,
                missingPercentage: 0,
                missingnessPattern: {
                  type: 'MCAR',
                  correlatedColumns: [],
                },
                suggestedImputation: {
                  method: 'None',
                  reason: 'No missing values',
                },
              },
              {
                columnName: 'age',
                missingCount: 50,
                missingPercentage: 5.0,
                missingnessPattern: {
                  type: 'MAR',
                  correlatedColumns: ['income'],
                },
                suggestedImputation: {
                  method: 'Median',
                  reason: 'Numeric with outliers',
                },
              },
            ],
            missingDataMatrix: {
              correlations: [
                { column1: 'age', column2: 'income', correlation: 0.75 },
              ],
            },
          },
          accuracy: {
            businessRuleSummary: {
              totalViolations: 15,
              criticalViolations: 3,
            },
            patternValidation: [
              {
                patternName: 'Email Pattern',
                affectedColumns: ['email'],
                violationCount: 5,
              },
            ],
            crossFieldValidation: [
              {
                ruleName: 'Date Range',
                violations: 10,
              },
            ],
          },
          validity: {
            patternConformance: [
              { columnName: 'zip', conformancePercentage: 95.5 },
            ],
          },
          consistency: {
            formatConsistency: [
              {
                columnName: 'date',
                consistencyScore: 80.0,
              },
            ],
          },
          uniqueness: {
            exactDuplicates: {
              count: 25,
              percentage: 2.5,
              duplicateGroups: Array(10).fill({}), // Array with 10 items
            },
          },
        } as any;

        const v2Output = Section2Adapter.convertToV2(v1Input);

        // Verify version
        expect(v2Output.version).toBe('2.0');

        // Verify quality scores (converted to 0-1)
        expect(v2Output.quality_scores.completeness).toBe(0.95);
        expect(v2Output.quality_scores.accuracy).toBe(0.80);
        expect(v2Output.quality_scores.consistency).toBe(0.90);
        expect(v2Output.quality_scores.uniqueness).toBe(0.75);
        expect(v2Output.quality_scores.validity).toBe(0.85);

        // Verify missing data stats
        expect(v2Output.missing_data.stats.total_cells_missing).toBe(100);
        expect(v2Output.missing_data.stats.missing_percentage).toBeCloseTo(0.045, 2);
        expect(v2Output.missing_data.stats.rows_with_missing).toBeCloseTo(0.105, 2);
        expect(v2Output.missing_data.stats.columns_with_missing).toBe(0.20);

        // Verify column-level missing data
        expect(v2Output.missing_data.by_column).toHaveLength(2);
        expect(v2Output.missing_data.by_column[0].column).toBe('id');
        expect(v2Output.missing_data.by_column[0].missing_count).toBe(0);
        expect(v2Output.missing_data.by_column[0].missing_ratio).toBe(0);
        expect(v2Output.missing_data.by_column[0].pattern_type).toBe('random');

        expect(v2Output.missing_data.by_column[1].column).toBe('age');
        expect(v2Output.missing_data.by_column[1].missing_count).toBe(50);
        expect(v2Output.missing_data.by_column[1].missing_ratio).toBe(0.05);
        expect(v2Output.missing_data.by_column[1].pattern_type).toBe('correlated');
        expect(v2Output.missing_data.by_column[1].correlated_with).toContain('income');

        // Verify violations
        expect(v2Output.violations.rule_violations).toBe(15);
        expect(v2Output.violations.critical_violations).toBe(3);
        expect(v2Output.violations.pattern_violations).toBe(1);
        expect(v2Output.violations.cross_field_violations).toBe(10);

        // Verify duplicates
        expect(v2Output.duplicates.exact_duplicates).toBe(25);
        expect(v2Output.duplicates.exact_duplicate_ratio).toBe(0.025);
        expect(v2Output.duplicates.duplicate_groups).toBe(10);

        // Verify imputation candidates
        expect(v2Output.imputation_candidates.median_applicable).toContain('age');
      });

      it('should correctly map missingness patterns', () => {
        const v1Input: Section2QualityAudit = {
          cockpit: {
            overallScore: 90,
            dimensionScores: {
              completeness: { score: 90, interpretation: 'Good' },
              accuracy: { score: 90, interpretation: 'Good' },
              consistency: { score: 90, interpretation: 'Good' },
              uniqueness: { score: 90, interpretation: 'Good' },
              validity: { score: 90, interpretation: 'Good' },
            },
          },
          completeness: {
            datasetLevel: {
              totalMissingValues: 100,
              overallCompletenessRatio: 90,
              rowsWithMissingPercentage: 10,
              columnsWithMissingPercentage: 20,
              distributionOverview: "",
            },
            columnLevel: [
              {
                columnName: 'col_mcar',
                missingCount: 10,
                missingPercentage: 1,
                missingnessPattern: { type: 'MCAR', correlatedColumns: [] },
                suggestedImputation: { method: 'Mean', reason: 'test' },
              },
              {
                columnName: 'col_mar',
                missingCount: 20,
                missingPercentage: 2,
                missingnessPattern: { type: 'MAR', correlatedColumns: ['other'] },
                suggestedImputation: { method: 'Median', reason: 'test' },
              },
              {
                columnName: 'col_mnar',
                missingCount: 30,
                missingPercentage: 3,
                missingnessPattern: { type: 'MNAR', correlatedColumns: [] },
                suggestedImputation: { method: 'Mode', reason: 'test' },
              },
              {
                columnName: 'col_unknown',
                missingCount: 40,
                missingPercentage: 4,
                missingnessPattern: { type: 'Unknown', correlatedColumns: [] },
                suggestedImputation: { method: 'Domain Input Required', reason: 'test' },
              },
            ],
            missingDataMatrix: { correlations: [] },
          },
          accuracy: {},
          validity: {},
          consistency: {},
          uniqueness: {},
        } as any;

        const v2Output = Section2Adapter.convertToV2(v1Input);

        expect(v2Output.missing_data.by_column[0].pattern_type).toBe('random');
        expect(v2Output.missing_data.by_column[1].pattern_type).toBe('correlated');
        expect(v2Output.missing_data.by_column[2].pattern_type).toBe('systematic');
        expect(v2Output.missing_data.by_column[3].pattern_type).toBe('unknown');
      });

      it('should correctly classify imputation methods', () => {
        const v1Input: Section2QualityAudit = {
          cockpit: {
            overallScore: 90,
            dimensionScores: {
              completeness: { score: 90, interpretation: 'Good' },
              accuracy: { score: 90, interpretation: 'Good' },
              consistency: { score: 90, interpretation: 'Good' },
              uniqueness: { score: 90, interpretation: 'Good' },
              validity: { score: 90, interpretation: 'Good' },
            },
          },
          completeness: {
            datasetLevel: {
              totalMissingValues: 100,
              overallCompletenessRatio: 90,
              rowsWithMissingPercentage: 10,
              columnsWithMissingPercentage: 20,
              distributionOverview: "",
            },
            columnLevel: [
              {
                columnName: 'mean_col',
                missingCount: 10,
                missingPercentage: 10,
                missingnessPattern: { type: 'MCAR', correlatedColumns: [] },
                suggestedImputation: { method: 'Mean', reason: 'test' },
              },
              {
                columnName: 'median_col',
                missingCount: 20,
                missingPercentage: 20,
                missingnessPattern: { type: 'MCAR', correlatedColumns: [] },
                suggestedImputation: { method: 'Median', reason: 'test' },
              },
              {
                columnName: 'mode_col',
                missingCount: 30,
                missingPercentage: 30,
                missingnessPattern: { type: 'MCAR', correlatedColumns: [] },
                suggestedImputation: { method: 'Mode', reason: 'test' },
              },
              {
                columnName: 'ml_col',
                missingCount: 40,
                missingPercentage: 40,
                missingnessPattern: { type: 'MAR', correlatedColumns: [] },
                suggestedImputation: { method: 'ML Model', reason: 'test' },
              },
              {
                columnName: 'regression_col',
                missingCount: 50,
                missingPercentage: 50,
                missingnessPattern: { type: 'MAR', correlatedColumns: [] },
                suggestedImputation: { method: 'Regression', reason: 'test' },
              },
              {
                columnName: 'domain_col',
                missingCount: 60,
                missingPercentage: 60,
                missingnessPattern: { type: 'MNAR', correlatedColumns: [] },
                suggestedImputation: { method: 'Domain Input Required', reason: 'test' },
              },
              {
                columnName: 'drop_col',
                missingCount: 800,
                missingPercentage: 80,
                missingnessPattern: { type: 'MNAR', correlatedColumns: [] },
                suggestedImputation: { method: 'Drop Column', reason: 'test' },
              },
            ],
            missingDataMatrix: { correlations: [] },
          },
          accuracy: {},
          validity: {},
          consistency: {},
          uniqueness: {},
        } as any;

        const v2Output = Section2Adapter.convertToV2(v1Input);

        expect(v2Output.imputation_candidates.mean_applicable).toContain('mean_col');
        expect(v2Output.imputation_candidates.median_applicable).toContain('median_col');
        expect(v2Output.imputation_candidates.mode_applicable).toContain('mode_col');
        expect(v2Output.imputation_candidates.ml_imputation_candidates).toContain('ml_col');
        expect(v2Output.imputation_candidates.ml_imputation_candidates).toContain('regression_col');
        expect(v2Output.imputation_candidates.domain_knowledge_required).toContain('domain_col');
        expect(v2Output.imputation_candidates.drop_candidates).toContain('drop_col');
      });
    });

    describe('Edge Case Tests', () => {
      it('should handle empty completeness data', () => {
        const v1Input: Section2QualityAudit = {
          cockpit: {
            overallScore: 100,
            dimensionScores: {
              completeness: { score: 100, interpretation: 'Perfect' },
              accuracy: { score: 100, interpretation: 'Perfect' },
              consistency: { score: 100, interpretation: 'Perfect' },
              uniqueness: { score: 100, interpretation: 'Perfect' },
              validity: { score: 100, interpretation: 'Perfect' },
            },
          },
          completeness: {
            datasetLevel: {
              totalMissingValues: 0,
              overallCompletenessRatio: 100,
              rowsWithMissingPercentage: 0,
              columnsWithMissingPercentage: 0,
              distributionOverview: "",
            },
            columnLevel: [],
            missingDataMatrix: { correlations: [] },
          },
          accuracy: {},
          validity: {},
          consistency: {},
          uniqueness: {},
        } as any;

        const v2Output = Section2Adapter.convertToV2(v1Input);

        expect(v2Output.version).toBe('2.0');
        expect(v2Output.missing_data.by_column).toHaveLength(0);
        expect(v2Output.missing_data.stats.total_cells_missing).toBe(0);
      });

      it('should handle missing optional fields gracefully', () => {
        const v1Input: Section2QualityAudit = {
          cockpit: {
            overallScore: 50,
            dimensionScores: {
              completeness: { score: 50, interpretation: 'Poor' },
              accuracy: { score: 50, interpretation: 'Poor' },
              consistency: { score: 50, interpretation: 'Poor' },
              uniqueness: { score: 50, interpretation: 'Poor' },
              validity: { score: 50, interpretation: 'Poor' },
            },
          },
          completeness: {
            datasetLevel: {
              totalMissingValues: 500,
              overallCompletenessRatio: 50,
              rowsWithMissingPercentage: 50,
              columnsWithMissingPercentage: 50,
              distributionOverview: "",
            },
            columnLevel: [
              {
                columnName: 'test',
                missingCount: 500,
                missingPercentage: 50,
                missingnessPattern: { type: 'MCAR', correlatedColumns: [] },
                suggestedImputation: { method: 'Mean', reason: 'test' },
              },
            ],
            missingDataMatrix: { correlations: [] },
          },
          accuracy: {},
          validity: {},
          consistency: {},
          uniqueness: {},
        } as any;

        const v2Output = Section2Adapter.convertToV2(v1Input);

        expect(v2Output.version).toBe('2.0');
        expect(v2Output.violations.rule_violations).toBe(0);
        expect(v2Output.violations.critical_violations).toBe(0);
        expect(v2Output.violations.pattern_violations).toBe(0);
        expect(v2Output.pattern_violations).toBeUndefined();
      });

      it('should handle null and undefined businessRuleSummary', () => {
        const v1Input: Section2QualityAudit = {
          cockpit: {
            overallScore: 90,
            dimensionScores: {
              completeness: { score: 90, interpretation: 'Good' },
              accuracy: { score: 90, interpretation: 'Good' },
              consistency: { score: 90, interpretation: 'Good' },
              uniqueness: { score: 90, interpretation: 'Good' },
              validity: { score: 90, interpretation: 'Good' },
            },
          },
          completeness: {
            datasetLevel: {
              totalMissingValues: 0,
              overallCompletenessRatio: 100,
              rowsWithMissingPercentage: 0,
              columnsWithMissingPercentage: 0,
              distributionOverview: '',
            },
            columnLevel: [],
            missingDataMatrix: { correlations: [], blockPatterns: [] },
          },
          accuracy: {
            businessRuleSummary: undefined,
            valueConformity: [],
            crossFieldValidation: [],
            outlierImpact: { percentageErrornousOutliers: 0, description: '' },
          },
          validity: {},
          consistency: {},
          uniqueness: {},
        } as any;

        const v2Output = Section2Adapter.convertToV2(v1Input);

        expect(v2Output.violations.rule_violations).toBe(0);
        expect(v2Output.violations.critical_violations).toBe(0);
      });

      it('should handle empty arrays in V1 input', () => {
        const v1Input: Section2QualityAudit = {
          cockpit: {
            overallScore: 90,
            dimensionScores: {
              completeness: { score: 90, interpretation: 'Good' },
              accuracy: { score: 90, interpretation: 'Good' },
              consistency: { score: 90, interpretation: 'Good' },
              uniqueness: { score: 90, interpretation: 'Good' },
              validity: { score: 90, interpretation: 'Good' },
            },
          },
          completeness: {
            datasetLevel: {
              totalMissingValues: 0,
              overallCompletenessRatio: 100,
              rowsWithMissingPercentage: 0,
              columnsWithMissingPercentage: 0,
              distributionOverview: "",
            },
            columnLevel: [],
            missingDataMatrix: { correlations: [] },
          },
          accuracy: {
            patternValidation: [],
            crossFieldValidation: [],
          },
          validity: {
            patternConformance: [],
          },
          consistency: {
            formatConsistency: [],
          },
          uniqueness: {},
        } as any;

        const v2Output = Section2Adapter.convertToV2(v1Input);

        expect(v2Output.pattern_violations).toBeUndefined();
        expect(v2Output.format_inconsistencies).toBeUndefined();
        expect(Array.isArray(v2Output.missing_data.by_column)).toBe(true);
      });

      it('should handle very large values', () => {
        const v1Input: Section2QualityAudit = {
          cockpit: {
            overallScore: 100,
            dimensionScores: {
              completeness: { score: 100, interpretation: 'Perfect' },
              accuracy: { score: 100, interpretation: 'Perfect' },
              consistency: { score: 100, interpretation: 'Perfect' },
              uniqueness: { score: 100, interpretation: 'Perfect' },
              validity: { score: 100, interpretation: 'Perfect' },
            },
          },
          completeness: {
            datasetLevel: {
              totalMissingValues: 1000000000,
              overallCompletenessRatio: 50,
              rowsWithMissingPercentage: 99.99,
              columnsWithMissingPercentage: 100,
              distributionOverview: "",
            },
            columnLevel: [
              {
                columnName: 'huge_missing',
                missingCount: 999999999,
                missingPercentage: 99.9999,
                missingnessPattern: { type: 'MNAR', correlatedColumns: [] },
                suggestedImputation: { method: 'Drop Column', reason: 'Too many missing' },
              },
            ],
            missingDataMatrix: { correlations: [] },
          },
          accuracy: {},
          validity: {},
          consistency: {},
          uniqueness: {},
        } as any;

        const v2Output = Section2Adapter.convertToV2(v1Input);

        expect(v2Output.missing_data.stats.total_cells_missing).toBe(1000000000);
        expect(v2Output.missing_data.by_column[0].missing_count).toBe(999999999);
        expect(v2Output.missing_data.by_column[0].missing_ratio).toBeCloseTo(0.999999, 5);
      });

      it('should handle zero and near-zero values', () => {
        const v1Input: Section2QualityAudit = {
          cockpit: {
            overallScore: 1,
            dimensionScores: {
              completeness: { score: 0.1, interpretation: 'Very Poor' },
              accuracy: { score: 0.01, interpretation: 'Critical' },
              consistency: { score: 0, interpretation: 'Critical' },
              uniqueness: { score: 0.001, interpretation: 'Critical' },
              validity: { score: 0.1, interpretation: 'Very Poor' },
            },
          },
          completeness: {
            datasetLevel: {
              totalMissingValues: 1,
              overallCompletenessRatio: 99.999,
              rowsWithMissingPercentage: 0.001,
              columnsWithMissingPercentage: 0.1,
              distributionOverview: "",
            },
            columnLevel: [
              {
                columnName: 'minimal_missing',
                missingCount: 1,
                missingPercentage: 0.001,
                missingnessPattern: { type: 'MCAR', correlatedColumns: [] },
                suggestedImputation: { method: 'Mean', reason: 'Minimal impact' },
              },
            ],
            missingDataMatrix: { correlations: [] },
          },
          accuracy: {},
          validity: {},
          consistency: {},
          uniqueness: {},
        } as any;

        const v2Output = Section2Adapter.convertToV2(v1Input);

        expect(v2Output.quality_scores.completeness).toBeCloseTo(0.001, 6);
        expect(v2Output.quality_scores.consistency).toBe(0);
        expect(v2Output.missing_data.by_column[0].missing_ratio).toBeCloseTo(0.00001, 6);
      });
    });

    describe('Output Validation', () => {
      it('should always have version 2.0', () => {
        const v1Input: any = {
          cockpit: {
            overallScore: 90,
            dimensionScores: {
              completeness: { score: 90, interpretation: 'Good' },
              accuracy: { score: 90, interpretation: 'Good' },
              consistency: { score: 90, interpretation: 'Good' },
              uniqueness: { score: 90, interpretation: 'Good' },
              validity: { score: 90, interpretation: 'Good' },
            },
          },
          completeness: {
            datasetLevel: {
              totalMissingValues: 0,
              overallCompletenessRatio: 100,
              rowsWithMissingPercentage: 0,
              columnsWithMissingPercentage: 0,
              distributionOverview: "",
            },
            columnLevel: [],
            missingDataMatrix: { correlations: [] },
          },
          accuracy: {},
          validity: {},
          consistency: {},
          uniqueness: {},
        };

        const v2Output = Section2Adapter.convertToV2(v1Input);

        expect(v2Output.version).toBe('2.0');
      });

      it('should always have required fields defined', () => {
        const v1Input: any = {
          cockpit: {
            overallScore: 90,
            dimensionScores: {
              completeness: { score: 90, interpretation: 'Good' },
              accuracy: { score: 90, interpretation: 'Good' },
              consistency: { score: 90, interpretation: 'Good' },
              uniqueness: { score: 90, interpretation: 'Good' },
              validity: { score: 90, interpretation: 'Good' },
            },
          },
          completeness: {
            datasetLevel: {
              totalMissingValues: 0,
              overallCompletenessRatio: 100,
              rowsWithMissingPercentage: 0,
              columnsWithMissingPercentage: 0,
              distributionOverview: "",
            },
            columnLevel: [],
            missingDataMatrix: { correlations: [] },
          },
          accuracy: {},
          validity: {},
          consistency: {},
          uniqueness: {},
        };

        const v2Output = Section2Adapter.convertToV2(v1Input);

        expect(v2Output.quality_scores).toBeDefined();
        expect(v2Output.missing_data).toBeDefined();
        expect(v2Output.violations).toBeDefined();
        expect(v2Output.consistency).toBeDefined();
        expect(v2Output.duplicates).toBeDefined();
        expect(v2Output.imputation_candidates).toBeDefined();
        expect(v2Output.dataset_stats).toBeDefined();
      });

      it('should ensure arrays are always arrays not null', () => {
        const v1Input: any = {
          cockpit: {
            overallScore: 90,
            dimensionScores: {
              completeness: { score: 90, interpretation: 'Good' },
              accuracy: { score: 90, interpretation: 'Good' },
              consistency: { score: 90, interpretation: 'Good' },
              uniqueness: { score: 90, interpretation: 'Good' },
              validity: { score: 90, interpretation: 'Good' },
            },
          },
          completeness: {
            datasetLevel: {
              totalMissingValues: 0,
              overallCompletenessRatio: 100,
              rowsWithMissingPercentage: 0,
              columnsWithMissingPercentage: 0,
              distributionOverview: "",
            },
            columnLevel: [],
            missingDataMatrix: { correlations: [] },
          },
          accuracy: {},
          validity: {},
          consistency: {},
          uniqueness: {},
        };

        const v2Output = Section2Adapter.convertToV2(v1Input);

        expect(Array.isArray(v2Output.missing_data.by_column)).toBe(true);
        expect(Array.isArray(v2Output.missing_data.correlations)).toBe(true);
        expect(Array.isArray(v2Output.imputation_candidates.mean_applicable)).toBe(true);
        expect(Array.isArray(v2Output.imputation_candidates.median_applicable)).toBe(true);
        expect(Array.isArray(v2Output.imputation_candidates.mode_applicable)).toBe(true);
        expect(Array.isArray(v2Output.imputation_candidates.ml_imputation_candidates)).toBe(true);
        expect(Array.isArray(v2Output.imputation_candidates.domain_knowledge_required)).toBe(true);
        expect(Array.isArray(v2Output.imputation_candidates.drop_candidates)).toBe(true);
      });

      it('should ensure numeric fields are numbers not NaN', () => {
        const v1Input: any = {
          cockpit: {
            overallScore: 90,
            dimensionScores: {
              completeness: { score: 90, interpretation: 'Good' },
              accuracy: { score: 90, interpretation: 'Good' },
              consistency: { score: 90, interpretation: 'Good' },
              uniqueness: { score: 90, interpretation: 'Good' },
              validity: { score: 90, interpretation: 'Good' },
            },
          },
          completeness: {
            datasetLevel: {
              totalMissingValues: 100,
              overallCompletenessRatio: 90,
              rowsWithMissingPercentage: 10,
              columnsWithMissingPercentage: 20,
              distributionOverview: "",
            },
            columnLevel: [],
            missingDataMatrix: { correlations: [] },
          },
          accuracy: {},
          validity: {},
          consistency: {},
          uniqueness: {},
        };

        const v2Output = Section2Adapter.convertToV2(v1Input);

        expect(Number.isNaN(v2Output.quality_scores.completeness)).toBe(false);
        expect(Number.isNaN(v2Output.missing_data.stats.total_cells_missing)).toBe(false);
        expect(Number.isNaN(v2Output.missing_data.stats.missing_percentage)).toBe(false);
        expect(Number.isNaN(v2Output.violations.rule_violations)).toBe(false);
      });

      it('should convert all percentage fields from 0-100 to 0-1', () => {
        const v1Input: Section2QualityAudit = {
          cockpit: {
            overallScore: 85,
            dimensionScores: {
              completeness: { score: 95.5, interpretation: 'Excellent' },
              accuracy: { score: 87.3, interpretation: 'Good' },
              consistency: { score: 92.8, interpretation: 'Very Good' },
              uniqueness: { score: 76.2, interpretation: 'Acceptable' },
              validity: { score: 89.1, interpretation: 'Good' },
            },
          },
          completeness: {
            datasetLevel: {
              totalMissingValues: 100,
              overallCompletenessRatio: 95.5,
              rowsWithMissingPercentage: 10.5,
              columnsWithMissingPercentage: 20.0,
              distributionOverview: "",
            },
            columnLevel: [
              {
                columnName: 'test',
                missingCount: 50,
                missingPercentage: 5.25,
                missingnessPattern: { type: 'MCAR', correlatedColumns: [] },
                suggestedImputation: { method: 'Mean', reason: 'test' },
              },
            ],
            missingDataMatrix: { correlations: [] },
          },
          accuracy: {},
          validity: {},
          consistency: {},
          uniqueness: {
            exactDuplicates: {
              count: 25,
              percentage: 2.75,
            },
          },
        } as any;

        const v2Output = Section2Adapter.convertToV2(v1Input);

        // Quality scores should be 0-1
        expect(v2Output.quality_scores.completeness).toBeCloseTo(0.955, 3);
        expect(v2Output.quality_scores.accuracy).toBeCloseTo(0.873, 3);
        expect(v2Output.quality_scores.consistency).toBeCloseTo(0.928, 3);
        expect(v2Output.quality_scores.uniqueness).toBeCloseTo(0.762, 3);
        expect(v2Output.quality_scores.validity).toBeCloseTo(0.891, 3);

        // Ratios should be 0-1
        expect(v2Output.missing_data.stats.rows_with_missing).toBeCloseTo(0.105, 3);
        expect(v2Output.missing_data.stats.columns_with_missing).toBeCloseTo(0.20, 2);
        expect(v2Output.missing_data.by_column[0].missing_ratio).toBeCloseTo(0.0525, 4);
        expect(v2Output.duplicates.exact_duplicate_ratio).toBeCloseTo(0.0275, 4);
      });
    });
  });
});
