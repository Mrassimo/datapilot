/**
 * Section 5: Engineering - V2 Formatter (Lean)
 * JSON-only output, no markdown bloat
 */

import type { Section5EngineeringV2 } from './types-v2';

export class Section5FormatterV2 {
  /**
   * Format as lean JSON (no markdown)
   */
  public static formatJSON(analysis: Section5EngineeringV2): string {
    return JSON.stringify(analysis, null, 2);
  }

  /**
   * Generate concise CLI summary
   */
  public static formatCLISummary(analysis: Section5EngineeringV2): string {
    const lines: string[] = [];

    lines.push('🔧 Engineering Analysis (V2)');
    lines.push('');
    lines.push(`Type Optimizations: ${analysis.type_optimizations.length}`);
    lines.push(`Categorical Candidates: ${analysis.categorical_candidates.length}`);
    lines.push(`Interaction Features: ${analysis.interaction_features.length}`);
    lines.push(`Binning Candidates: ${analysis.binning_candidates.length}`);
    lines.push(`Date Features: ${analysis.date_features.length}`);

    if (analysis.join_candidates && analysis.join_candidates.length > 0) {
      lines.push(`Join Candidates: ${analysis.join_candidates.length}`);
    }

    lines.push('');
    lines.push(`Memory:`);
    lines.push(`  Current: ${analysis.current_memory_mb.toFixed(2)} MB`);
    lines.push(`  Optimized: ${analysis.optimized_memory_mb.toFixed(2)} MB`);
    lines.push(`  Reduction: ${(analysis.memory_reduction_ratio * 100).toFixed(1)}%`);

    return lines.join('\n');
  }
}
