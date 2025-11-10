/**
 * Section 2: Data Quality - AI-Ready Formatter (V2)
 * Outputs lean JSON optimized for AI consumption
 *
 * Key Changes from V1:
 * - NO markdown generation (just JSON)
 * - NO verbose descriptions
 * - NO subjective interpretations
 * - 80-90% size reduction
 */

import type { Section2QualityAuditV2 } from './types-v2';

export class Section2FormatterV2 {
  /**
   * Format quality audit as lean JSON
   * No markdown, no prose, just facts
   */
  public static formatJSON(audit: Section2QualityAuditV2): string {
    return JSON.stringify(audit, null, 2);
  }

  /**
   * Format quality audit as ultra-compact JSON (single line)
   */
  public static formatCompactJSON(audit: Section2QualityAuditV2): string {
    return JSON.stringify(audit);
  }

  /**
   * Get summary statistics (for CLI display, not AI consumption)
   */
  public static getSummaryStats(audit: Section2QualityAuditV2): {
    quality_score: number;
    missing_data_pct: number;
    violations: number;
    duplicates: number;
  } {
    // Average of quality scores
    const scores = audit.quality_scores;
    const avgScore = (scores.completeness + scores.accuracy + scores.consistency + scores.uniqueness + scores.validity) / 5;

    return {
      quality_score: Math.round(avgScore * 100) / 100,
      missing_data_pct: Math.round(audit.missing_data.stats.missing_percentage * 100) / 100,
      violations: audit.violations.rule_violations + audit.violations.pattern_violations,
      duplicates: audit.duplicates.exact_duplicates,
    };
  }

  /**
   * Generate human-readable summary line (for CLI output)
   * Example: "Quality: 0.87 | Missing: 6.8% | Violations: 23 | Duplicates: 0"
   */
  public static getSummaryLine(audit: Section2QualityAuditV2): string {
    const stats = this.getSummaryStats(audit);
    return `Quality: ${stats.quality_score.toFixed(2)} | Missing: ${(stats.missing_data_pct * 100).toFixed(1)}% | Violations: ${stats.violations} | Duplicates: ${stats.duplicates}`;
  }
}
