/**
 * Section 4: Visualization - V2 Formatter (Lean)
 * JSON-only output, no markdown bloat
 */

import type { Section4VisualizationV2 } from './types-v2';

export class Section4FormatterV2 {
  /**
   * Format as lean JSON (no markdown)
   */
  public static formatJSON(analysis: Section4VisualizationV2): string {
    return JSON.stringify(analysis, null, 2);
  }

  /**
   * Generate concise CLI summary
   */
  public static formatCLISummary(analysis: Section4VisualizationV2): string {
    const lines: string[] = [];

    lines.push('📊 Visualization Analysis (V2)');
    lines.push('');
    lines.push(`Chart Candidates:`);
    lines.push(`  Scatter Plots: ${analysis.scatter_plots.length}`);
    lines.push(`  Histograms: ${analysis.histograms.length}`);
    lines.push(`  Bar Charts: ${analysis.bar_charts.length}`);
    lines.push(`  Box Plots: ${analysis.box_plots.length}`);
    lines.push(`  Heatmaps: ${analysis.heatmaps.length}`);
    lines.push(`  Time Series: ${analysis.time_series.length}`);
    lines.push('');
    lines.push(`Dataset Size: ${analysis.dataset_size} rows`);
    lines.push(`Suggested Dimensions: ${analysis.suggested_width_px}x${analysis.suggested_height_px}px`);

    if (analysis.high_cardinality_columns.length > 0) {
      lines.push(`High Cardinality Columns: ${analysis.high_cardinality_columns.join(', ')}`);
    }

    return lines.join('\n');
  }
}
