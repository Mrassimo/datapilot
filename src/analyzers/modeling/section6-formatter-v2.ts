/**
 * Section 6: Modeling - V2 Formatter (Lean)
 * JSON-only output, no markdown bloat
 */

import type { Section6ModelingV2 } from './types-v2';

export class Section6FormatterV2 {
  /**
   * Format as lean JSON (no markdown)
   */
  public static formatJSON(analysis: Section6ModelingV2): string {
    return JSON.stringify(analysis, null, 2);
  }

  /**
   * Generate concise CLI summary
   */
  public static formatCLISummary(analysis: Section6ModelingV2): string {
    const lines: string[] = [];

    lines.push('🤖 Modeling Analysis (V2)');
    lines.push('');
    lines.push(`ML Tasks Detected: ${analysis.ml_tasks.length}`);

    analysis.ml_tasks.forEach((task) => {
      if (task.type === 'classification') {
        lines.push(`  - Classification: ${task.target_column} (${task.classes} classes)`);
      } else if (task.type === 'regression') {
        lines.push(`  - Regression: ${task.target_column}`);
      } else if (task.type === 'clustering') {
        lines.push(`  - Clustering: ${task.feature_count} features`);
      }
    });

    lines.push('');
    lines.push(`Applicable Algorithms: ${analysis.algorithms.filter((a) => a.applicable).length}/${analysis.algorithms.length}`);

    lines.push('');
    lines.push(`Data Readiness:`);
    lines.push(`  Missing Data: ${(analysis.data_readiness.missing_data_ratio * 100).toFixed(1)}%`);
    lines.push(`  Requires Imputation: ${analysis.data_readiness.requires_imputation ? 'Yes' : 'No'}`);
    lines.push(`  Requires Scaling: ${analysis.data_readiness.requires_scaling ? 'Yes' : 'No'}`);
    lines.push(`  Requires Encoding: ${analysis.data_readiness.requires_encoding ? 'Yes' : 'No'}`);

    lines.push('');
    lines.push(`Validation Strategy:`);
    lines.push(`  CV Folds: ${analysis.validation.recommended_cv_folds}`);
    lines.push(`  Train/Test Split: ${analysis.validation.train_size}/${analysis.validation.test_size}`);

    return lines.join('\n');
  }
}
