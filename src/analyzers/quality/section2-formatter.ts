/**
 * Section 2: Data Quality & Integrity Audit - Report Formatter
 * Generates comprehensive Markdown report matching section2.md specification
 */

import type {
  Section2QualityAudit,
  DataQualityCockpit,
  CompletenessAnalysis,
  AccuracyAnalysis,
  ConsistencyAnalysis,
  TimelinessAnalysis,
  UniquenessAnalysis,
  ValidityAnalysis,
  IntegrityAnalysis,
  ReasonablenessAnalysis,
  PrecisionAnalysis,
  RepresentationalAnalysis,
  ProfilingInsights,
} from './types.js';

export class Section2Formatter {
  public static formatReport(audit: Section2QualityAudit): string {
    const sections = [
      this.formatHeader(),
      this.formatCockpit(audit.cockpit),
      this.formatCompleteness(audit.completeness),
      this.formatAccuracy(audit.accuracy),
      this.formatConsistency(audit.consistency),
      this.formatTimeliness(audit.timeliness),
      this.formatUniqueness(audit.uniqueness),
      this.formatValidity(audit.validity),
      this.formatIntegrity(audit.integrity),
      this.formatReasonableness(audit.reasonableness),
      this.formatPrecision(audit.precision),
      this.formatRepresentational(audit.representational),
      this.formatProfilingInsights(audit.profilingInsights),
      this.formatFooter(audit),
    ];

    return sections.join('\n\n');
  }

  private static formatHeader(): string {
    return `---

## Section 2: Data Quality

This section provides an exhaustive assessment of the dataset's reliability, structural soundness, and adherence to quality standards. Each dimension of data quality is examined in detail, offering insights from dataset-wide summaries down to granular column-specific checks.`;
  }

  private static formatCockpit(cockpit: DataQualityCockpit): string {
    const { compositeScore, dimensionScores, topStrengths, topWeaknesses, technicalDebt } = cockpit;

    return `**2.1. Overall Data Quality Cockpit:**
    * **Composite Data Quality Score (CDQS):** ${compositeScore.score.toFixed(1)} / 100
        * *Methodology:* Weighted average of individual quality dimension scores.
        * *Interpretation:* ${compositeScore.interpretation} - ${compositeScore.details}
    * **Data Quality Dimensions Summary:**
        * Completeness: ${dimensionScores.completeness.score.toFixed(1)}/100 (${dimensionScores.completeness.interpretation})
        * Uniqueness: ${dimensionScores.uniqueness.score.toFixed(1)}/100 (${dimensionScores.uniqueness.interpretation})
        * Validity: ${dimensionScores.validity.score.toFixed(1)}/100 (${dimensionScores.validity.interpretation})
        * Consistency: ${dimensionScores.consistency.score.toFixed(1)}/100 (${dimensionScores.consistency.interpretation})
        * Accuracy: ${dimensionScores.accuracy.score.toFixed(1)}/100 (${dimensionScores.accuracy.interpretation})
        * Timeliness: ${dimensionScores.timeliness.score.toFixed(1)}/100 (${dimensionScores.timeliness.interpretation})
        * Integrity: ${dimensionScores.integrity.score.toFixed(1)}/100 (${dimensionScores.integrity.interpretation})
        * Reasonableness: ${dimensionScores.reasonableness.score.toFixed(1)}/100 (${dimensionScores.reasonableness.interpretation})
        * Precision: ${dimensionScores.precision.score.toFixed(1)}/100 (${dimensionScores.precision.interpretation})
        * Representational: ${dimensionScores.representational.score.toFixed(1)}/100 (${dimensionScores.representational.interpretation})
    * **Top ${topStrengths.length} Data Quality Strengths:**
${topStrengths.map((strength, i: number) => `        ${i + 1}. ${strength.description} (${strength.category}).`).join('\n')}
    * **Top ${topWeaknesses.length} Data Quality Weaknesses (Areas for Immediate Attention):**
${topWeaknesses.map((weakness, i: number) => `        ${i + 1}. ${weakness.description} (Priority: ${weakness.priority}/10).`).join('\n')}
    * **Estimated Technical Debt (Data Cleaning Effort):**
        * *Time Estimate:* ${technicalDebt.timeEstimate}.
        * *Complexity Level:* ${technicalDebt.complexityLevel}.
        * *Primary Debt Contributors:* ${technicalDebt.primaryDebtContributors.join(', ')}.
    * **Automated Cleaning Potential:**
        * *Number of Issues with Suggested Automated Fixes:* ${technicalDebt.automatedCleaningPotential.fixableIssues}.
        * *Examples:* ${technicalDebt.automatedCleaningPotential.examples.join(', ')}.`;
  }

  private static formatCompleteness(completeness: CompletenessAnalysis): string {
    const { datasetLevel, columnLevel, missingDataMatrix, score } = completeness;

    const columnDetails = columnLevel
      .slice(0, 10)
      .map(
        (col) =>
          `        * \`${col.columnName}\`:
            * Number of Missing Values: ${col.missingCount}.
            * Percentage of Missing Values: ${col.missingPercentage.toFixed(2)}%.
            * Missingness Pattern: ${col.missingnessPattern.description}.
            * Suggested Imputation Strategy: ${col.suggestedImputation.method} (Confidence: ${col.suggestedImputation.confidence}%).
            * Missing Data Distribution: ${col.sparklineRepresentation || 'N/A'}.`,
      )
      .join('\n');

    const correlationDetails = missingDataMatrix.correlations
      .slice(0, 3)
      .map((corr) => `        * ${corr.description} (Correlation: ${corr.correlation.toFixed(3)}).`)
      .join('\n');

    return `**2.2. Completeness Dimension (Absence of Missing Data):**
    * **Dataset-Level Completeness Overview:**
        * Overall Dataset Completeness Ratio: ${datasetLevel.overallCompletenessRatio.toFixed(2)}%.
        * Total Missing Values (Entire Dataset): ${datasetLevel.totalMissingValues}.
        * Percentage of Rows Containing at Least One Missing Value: ${datasetLevel.rowsWithMissingPercentage.toFixed(2)}%.
        * Percentage of Columns Containing at Least One Missing Value: ${datasetLevel.columnsWithMissingPercentage.toFixed(2)}%.
        * Missing Value Distribution Overview: ${datasetLevel.distributionOverview}.
    * **Column-Level Completeness Deep Dive:** (Showing top ${Math.min(10, columnLevel.length)} columns)
${columnDetails}
    * **Missing Data Correlations:**
${correlationDetails || '        * No significant missing data correlations detected.'}
    * **Missing Data Block Patterns:**
${missingDataMatrix.blockPatterns.map((pattern: string) => `        * ${pattern}.`).join('\n') || '        * No block patterns detected.'}
    * **Completeness Score:** ${score.score.toFixed(1)}/100 (${score.interpretation}) - ${score.details}.`;
  }

  private static formatAccuracy(accuracy: AccuracyAnalysis): string {
    const crossFieldDetails =
      accuracy.crossFieldValidation
        ?.slice(0, 5)
        .map(
          (rule) =>
            `        * *Rule ${rule.ruleId}:* ${rule.description}. (Number of Violations: ${rule.violations}).`,
        )
        .join('\n') || '        * No cross-field rules configured.';

    const patternDetails =
      accuracy.patternValidation
        ?.slice(0, 5)
        .map(
          (pattern) =>
            `        * *${pattern.patternName}:* ${pattern.description}. Violations: ${pattern.violationCount} across columns: ${pattern.affectedColumns.join(', ')}.`,
        )
        .join('\n') || '        * No pattern validation issues detected.';

    const businessRulesSummary = accuracy.businessRuleSummary
      ? `        * *Business Rules Summary:* ${accuracy.businessRuleSummary.totalRules} rules evaluated, ${accuracy.businessRuleSummary.totalViolations} violations (${accuracy.businessRuleSummary.criticalViolations} critical).`
      : '        * Business rules analysis not performed.';

    return `**2.3. Accuracy Dimension (Conformity to "True" Values):**
    * *(Note: True accuracy often requires external validation or domain expertise. Analysis shows rule-based conformity checks.)*
    * **Value Conformity Assessment:** ${accuracy.score.details}
    * **Cross-Field Validation Results:**
${crossFieldDetails}
    * **Pattern Validation Results:**
${patternDetails}
    * **Business Rules Analysis:**
${businessRulesSummary}
    * **Impact of Outliers on Accuracy:** ${accuracy.outlierImpact.description}
    * **Accuracy Score:** ${accuracy.score.score.toFixed(1)}/100 (${accuracy.score.interpretation}).`;
  }

  private static formatConsistency(consistency: ConsistencyAnalysis): string {
    const intraRecordDetails =
      consistency.intraRecord
        ?.slice(0, 5)
        .map(
          (rule) =>
            `        * *${rule.ruleDescription}:* ${rule.violatingRecords} violating records.`,
        )
        .join('\n') || '        * No intra-record consistency issues detected.';

    const formatConsistencyDetails =
      consistency.formatConsistency
        ?.slice(0, 5)
        .map(
          (format) =>
            `        * *${format.columnName}* (${format.analysisType}): ${format.recommendedAction}. Inconsistency: ${format.consistency.inconsistencyPercentage}% of values.`,
        )
        .join('\n') || '        * No format consistency issues detected.';

    const patternSummary = consistency.patternSummary
      ? `        * *Pattern Analysis:* ${consistency.patternSummary.totalPatterns} patterns evaluated, ${consistency.patternSummary.totalViolations} violations across ${consistency.patternSummary.problematicColumns?.length || 0} columns.`
      : '        * Pattern analysis not performed.';

    return `**2.4. Consistency Dimension (Absence of Contradictions):**
    * **Intra-Record Consistency (Logical consistency across columns within the same row):**
${intraRecordDetails}
    * **Inter-Record Consistency (Consistency of facts across different records for the same entity):**
        * No entity resolution performed.
    * **Format & Representational Consistency (Standardization of Data Values):**
${formatConsistencyDetails}
    * **Pattern Consistency Summary:**
${patternSummary}
    * **Consistency Score (Rule-based and pattern detection):** ${consistency.score.score.toFixed(1)}/100 (${consistency.score.interpretation}).`;
  }

  private static formatTimeliness(timeliness: TimelinessAnalysis): string {
    return `**2.5. Timeliness & Currency Dimension:**
    * **Data Freshness Indicators:** ${timeliness.score.details}
    * **Update Frequency Analysis:** Not applicable for single-snapshot data.
    * **Timeliness Score:** ${timeliness.score.score.toFixed(1)}/100 (${timeliness.score.interpretation}).`;
  }

  private static formatUniqueness(uniqueness: UniquenessAnalysis): string {
    const { exactDuplicates, keyUniqueness, columnUniqueness, semanticDuplicates, score } =
      uniqueness;

    const keyDetails = keyUniqueness
      .slice(0, 5)
      .map(
        (key) =>
          `        * \`${key.columnName} ${key.isPrimaryKey ? '(Potential PK)' : ''}\`: ${key.duplicateCount} duplicate values found. Cardinality: ${key.cardinality}.`,
      )
      .join('\n');

    const columnDetails = columnUniqueness
      .slice(0, 8)
      .map(
        (col) =>
          `        * \`${col.columnName}\`: ${col.uniquePercentage.toFixed(1)}% unique values. ${col.duplicateCount} duplicates.${col.mostFrequentDuplicate ? ` Most frequent: "${col.mostFrequentDuplicate.value}" (${col.mostFrequentDuplicate.frequency} times).` : ''}`,
      )
      .join('\n');

    return `**2.6. Uniqueness Dimension (Minimisation of Redundancy):**
    * **Exact Duplicate Record Detection:**
        * Number of Fully Duplicate Rows: ${exactDuplicates.count}.
        * Percentage of Dataset Comprised of Exact Duplicates: ${exactDuplicates.percentage.toFixed(2)}%.
    * **Key Uniqueness & Integrity:**
${keyDetails || '        * No key-like columns identified.'}
    * **Column-Level Value Uniqueness Profile:**
${columnDetails}
    * **Fuzzy/Semantic Duplicate Detection:**
        * Number of Record Pairs Suspected to be Semantic Duplicates: ${semanticDuplicates.suspectedPairs} pairs.
        * Methods Used: ${semanticDuplicates.methods.join(', ')}.
    * **Uniqueness Score:** ${score.score.toFixed(1)}/100 (${score.interpretation}) - ${score.details}.`;
  }

  private static formatValidity(validity: ValidityAnalysis): string {
    const {
      typeConformance,
      rangeConformance,
      patternConformance,
      businessRules,
      fileStructure,
      score,
    } = validity;

    const typeDetails = typeConformance
      .slice(0, 8)
      .map(
        (type) =>
          `        * \`${type.columnName}\` (Expected: ${type.expectedType}, Detected: ${type.actualType}, Confidence: ${type.confidence}%):
            * Non-Conforming Values: ${type.nonConformingCount} (${type.conformancePercentage.toFixed(1)}% conformance).
            * Examples: ${
              type.examples
                .slice(0, 3)
                .map((ex: string) => `"${ex}"`)
                .join(', ') || 'None'
            }.
            * Conversion Strategy: ${type.conversionStrategy}.`,
      )
      .join('\n');

    const rangeDetails =
      rangeConformance.length > 0
        ? rangeConformance
            .slice(0, 5)
            .map(
              (range) =>
                `        * \`${range.columnName}\` (Range: ${range.expectedRange}): ${range.violationsCount} violations.`,
            )
            .join('\n')
        : '        * No range constraints defined.';

    const patternDetails =
      patternConformance.length > 0
        ? patternConformance
            .slice(0, 5)
            .map(
              (pattern) =>
                `        * \`${pattern.columnName}\` (${pattern.expectedPattern}): ${pattern.violationsCount} violations.`,
            )
            .join('\n')
        : '        * No pattern constraints detected.';

    return `**2.7. Validity & Conformity Dimension:**
    * **Data Type Conformance Deep Dive:**
${typeDetails}
    * **Range & Value Set Conformance:**
${rangeDetails}
    * **Pattern Conformance (Regex Validation):**
${patternDetails}
    * **Cross-Column Validation Rules:**
        * Business rules: ${businessRules.length} configured rules.
    * **File Structure & Schema Validity:**
        * Consistent Number of Columns Per Row: ${fileStructure.consistentColumnCount ? 'Yes' : `No (${fileStructure.deviatingRows} rows deviate)`}.
        * Header Row Conformance: ${fileStructure.headerConformance ? 'Yes' : 'No'}.
    * **Validity Score:** ${score.score.toFixed(1)}/100 (${score.interpretation}) - ${score.details}.`;
  }

  private static formatIntegrity(integrity: IntegrityAnalysis): string {
    return `**2.8. Integrity Dimension (Relationships & Structural Soundness):**
    * **Potential Orphaned Record Detection:** ${integrity.score.details}
    * **Relationship Cardinality Conformance:** No relationships defined.
    * **Data Model Integrity:** Schema validation not performed.
    * **Integrity Score:** ${integrity.score.score.toFixed(1)}/100 (${integrity.score.interpretation}).`;
  }

  private static formatReasonableness(reasonableness: ReasonablenessAnalysis): string {
    return `**2.9. Reasonableness & Plausibility Dimension:**
    * **Value Plausibility Analysis:** ${reasonableness.score.details}
    * **Inter-Field Semantic Plausibility:** No semantic rules configured.
    * **Contextual Anomaly Detection:** Statistical analysis pending.
    * **Plausibility Score:** ${reasonableness.score.score.toFixed(1)}/100 (${reasonableness.score.interpretation}).`;
  }

  private static formatPrecision(precision: PrecisionAnalysis): string {
    return `**2.10. Precision & Granularity Dimension:**
    * **Numeric Precision Analysis:** ${precision.score.details}
    * **Temporal Granularity:** To be implemented.
    * **Categorical Specificity:** To be implemented.
    * **Precision Score:** ${precision.score.score.toFixed(1)}/100 (${precision.score.interpretation}).`;
  }

  private static formatRepresentational(representational: RepresentationalAnalysis): string {
    return `**2.11. Representational Form & Interpretability:**
    * **Standardisation Analysis:** ${representational.score.details}
    * **Abbreviation & Code Standardisation:** To be implemented.
    * **Boolean Value Representation:** To be implemented.
    * **Text Field Formatting:** To be implemented.
    * **Interpretability Score:** ${representational.score.score.toFixed(1)}/100 (${representational.score.interpretation}).`;
  }

  private static formatProfilingInsights(insights: ProfilingInsights): string {
    return `**2.13. Data Profiling Insights Directly Impacting Quality:**
    * **Value Length Analysis:** ${insights.valueLengthAnalysis.length} columns analysed.
    * **Character Set & Encoding Validation:** ${insights.characterSetAnalysis.length} columns analysed.
    * **Special Character Analysis:** ${insights.specialCharacterAnalysis.length} columns analysed.
    * *Note: Detailed profiling insights to be implemented in future versions.*`;
  }

  private static formatFooter(audit: Section2QualityAudit): string {
    return `---

**Data Quality Audit Summary:**
* **Generated:** ${audit.generatedAt.toISOString()}
* **Version:** ${audit.version}
* **Overall Assessment:** ${audit.cockpit.compositeScore.interpretation} data quality with ${audit.cockpit.compositeScore.score.toFixed(1)}/100 composite score.

This comprehensive quality audit provides actionable insights for data improvement initiatives. Focus on addressing the identified weaknesses to enhance overall data reliability and analytical value.`;
  }
}
