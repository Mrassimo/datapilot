/**
 * Cross-Section Consistency Validator
 * Validates consistency between different analysis sections to catch contradictions
 */

import type { Section1Result } from '../analyzers/overview/types';
import type { Section2Result } from '../analyzers/quality/types';
import type { Section3Result } from '../analyzers/eda/types';
import type { Section4Result } from '../analyzers/visualization/types';
import type { Section5Result } from '../analyzers/engineering/types';
import type { Section6Result } from '../analyzers/modeling/types';

export interface ValidationIssue {
  severity: 'error' | 'warning' | 'info';
  sections: string[];
  issue: string;
  description: string;
  recommendation: string;
}

export class CrossSectionValidator {
  /**
   * Validate consistency across all analysis sections
   */
  static validateConsistency(results: {
    section1?: Section1Result;
    section2?: Section2Result;
    section3?: Section3Result;
    section4?: Section4Result;
    section5?: Section5Result;
    section6?: Section6Result;
  }): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    // Validate column count consistency
    issues.push(...this.validateColumnCounts(results));

    // Validate data type consistency
    issues.push(...this.validateDataTypes(results));

    // Validate PCA consistency
    issues.push(...this.validatePCAConsistency(results));

    // Validate outlier analysis consistency
    issues.push(...this.validateOutlierConsistency(results));

    // Validate quality vs technical metrics
    issues.push(...this.validateQualityMetrics(results));

    return issues;
  }

  /**
   * Validate column count consistency across sections
   */
  private static validateColumnCounts(results: any): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    const section1Columns = results.section1?.overview?.structuralDimensions?.totalColumns;
    const section3Columns = results.section3?.edaAnalysis?.metadata?.columnsAnalyzed;

    if (section1Columns && section3Columns && section1Columns !== section3Columns) {
      issues.push({
        severity: 'error',
        sections: ['Section 1', 'Section 3'],
        issue: 'Column count mismatch',
        description: `Section 1 reports ${section1Columns} columns, Section 3 reports ${section3Columns} columns`,
        recommendation:
          'Check data parsing consistency and ensure same dataset is analyzed across sections',
      });
    }

    return issues;
  }

  /**
   * Validate data type classifications between sections
   */
  private static validateDataTypes(results: any): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    // Check for gender column misclassification
    const section3Columns = results.section3?.edaAnalysis?.univariateAnalysis?.columnProfiles;
    const section5Schema =
      results.section5?.engineeringAnalysis?.schemaAnalysis?.optimizedSchema?.columns;

    if (section3Columns && section5Schema) {
      const genderColumn3 = section3Columns.find((col: any) =>
        col.columnName?.toLowerCase().includes('gender'),
      );
      const genderColumn5 = section5Schema.find((col: any) =>
        col.originalName?.toLowerCase().includes('gender'),
      );

      if (genderColumn3 && genderColumn5) {
        if (
          genderColumn3.detectedDataType !== 'categorical' &&
          genderColumn5.inferredDatabaseType === 'DATE'
        ) {
          issues.push({
            severity: 'error',
            sections: ['Section 3', 'Section 5'],
            issue: 'Gender column type misclassification',
            description: `Gender column incorrectly classified as ${genderColumn5.inferredDatabaseType} in Section 5, should be categorical`,
            recommendation:
              'Fix type detection engine to properly identify demographic columns as categorical',
          });
        }
      }
    }

    return issues;
  }

  /**
   * Validate PCA analysis consistency
   */
  private static validatePCAConsistency(results: any): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    const section3PCA = results.section3?.edaAnalysis?.multivariateAnalysis?.pcaAnalysis;
    const section5Challenges = results.section5?.engineeringAnalysis?.mlReadiness?.challenges;

    if (section3PCA && section5Challenges) {
      const section3Failed = !section3PCA.applicable;
      const section5InsufficientFeatures = section5Challenges.some((challenge: any) =>
        challenge.challenge?.includes('Insufficient Numerical Features for PCA'),
      );

      if (section3Failed && section5InsufficientFeatures) {
        const section3Reason = section3PCA.applicabilityReason || '';
        const isComputationalFailure =
          section3Reason.includes('convergence') || section3Reason.includes('decomposition');
        const isDataFailure =
          section3Reason.includes('Insufficient') || section3Reason.includes('variables');

        if (isComputationalFailure && section5InsufficientFeatures) {
          issues.push({
            severity: 'warning',
            sections: ['Section 3', 'Section 5'],
            issue: 'PCA failure reason inconsistency',
            description:
              'Section 3 reports computational failure (convergence), Section 5 reports data insufficiency',
            recommendation:
              'Clarify whether PCA failed due to computational issues or insufficient data. If both, report primary cause first.',
          });
        }
      }
    }

    return issues;
  }

  /**
   * Validate outlier analysis consistency
   */
  private static validateOutlierConsistency(results: any): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    const univariateProfiles = results.section3?.edaAnalysis?.univariateAnalysis?.columnProfiles;
    const multivariateOutliers =
      results.section3?.edaAnalysis?.multivariateAnalysis?.outlierDetection;

    if (univariateProfiles && multivariateOutliers) {
      // Count total univariate outliers
      const totalUnivariateOutliers = univariateProfiles.reduce((sum: number, profile: any) => {
        return sum + (profile.outlierAnalysis?.summary?.totalOutliers || 0);
      }, 0);

      const multivariateOutlierCount = multivariateOutliers.totalOutliers || 0;
      const multivariatePercentage = multivariateOutliers.outlierPercentage || 0;

      // Check for high multivariate outliers with low univariate outliers
      if (totalUnivariateOutliers < 10 && multivariatePercentage > 30) {
        issues.push({
          severity: 'info',
          sections: ['Section 3'],
          issue: 'High multivariate outliers with low univariate outliers',
          description: `Found ${totalUnivariateOutliers} univariate outliers but ${multivariateOutlierCount} multivariate outliers (${multivariatePercentage.toFixed(1)}%)`,
          recommendation:
            'This pattern is normal - multivariate outliers detect unusual combinations of values that are not extreme individually. Consider adding explanation in report.',
        });
      }
    }

    return issues;
  }

  /**
   * Validate quality metrics consistency
   */
  private static validateQualityMetrics(results: any): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    const qualityScore = results.section2?.qualityAudit?.overallScore?.compositeScore;
    const mlReadinessScore =
      results.section5?.engineeringAnalysis?.mlReadiness?.overallReadinessScore;

    if (qualityScore && mlReadinessScore) {
      // Check for inconsistent quality vs ML readiness
      if (qualityScore < 80 && mlReadinessScore > 90) {
        issues.push({
          severity: 'warning',
          sections: ['Section 2', 'Section 5'],
          issue: 'Quality vs ML readiness score inconsistency',
          description: `Low data quality score (${qualityScore}) but high ML readiness (${mlReadinessScore})`,
          recommendation:
            'Review ML readiness calculation to ensure it properly accounts for data quality issues',
        });
      }
    }

    return issues;
  }

  /**
   * Format validation issues for reporting
   */
  static formatValidationReport(issues: ValidationIssue[]): string {
    if (issues.length === 0) {
      return '✅ **Cross-Section Validation**: No consistency issues detected between analysis sections.';
    }

    const errorCount = issues.filter((i) => i.severity === 'error').length;
    const warningCount = issues.filter((i) => i.severity === 'warning').length;
    const infoCount = issues.filter((i) => i.severity === 'info').length;

    let report = `## Cross-Section Validation Report\n\n`;
    report += `**Summary**: ${errorCount} errors, ${warningCount} warnings, ${infoCount} informational items\n\n`;

    issues.forEach((issue, index) => {
      const icon = issue.severity === 'error' ? '❌' : issue.severity === 'warning' ? '⚠️' : 'ℹ️';
      report += `${icon} **${issue.issue}** (${issue.sections.join(' vs ')})\n`;
      report += `   ${issue.description}\n`;
      report += `   *Recommendation*: ${issue.recommendation}\n\n`;
    });

    return report;
  }
}
