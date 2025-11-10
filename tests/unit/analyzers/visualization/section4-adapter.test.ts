/**
 * Section 4 Visualization Adapter Tests
 *
 * Tests the V1 → V2 conversion for Visualization recommendations
 * Verifies chart candidate extraction and metadata
 */

import { Section4Adapter } from '../../../../src/analyzers/visualization/section4-adapter';
import type {
  VisualizationAnalysis,
  ColumnVisualizationProfile,
  BivariateVisualizationProfile,
} from '../../../../src/analyzers/visualization/types';
import type { Section4VisualizationV2 } from '../../../../src/analyzers/visualization/types-v2';

describe('Section4Adapter', () => {
  describe('convertToV2', () => {
    describe('Happy Path Tests', () => {
      it('should convert numeric column to histogram and box plot', () => {
        const v1Input: VisualizationAnalysis = {
          univariateRecommendations: [
            {
              columnName: 'age',
              dataType: 'Numerical',
              cardinality: 50,
              completeness: 0.95,
              distribution: {
                skewness: 0.3,
              },
            } as ColumnVisualizationProfile,
          ],
          bivariateRecommendations: [],
        } as any;

        const v2Output = Section4Adapter.convertToV2(v1Input);

        expect(v2Output.version).toBe('2.0');
        expect(v2Output.histograms).toHaveLength(1);
        expect(v2Output.histograms[0].column).toBe('age');
        expect(v2Output.histograms[0].data_type).toBe('numeric');
        expect(v2Output.histograms[0].skewness).toBe(0.3);
        expect(v2Output.histograms[0].bin_count_suggestion).toBeGreaterThan(0);

        expect(v2Output.box_plots).toHaveLength(1);
        expect(v2Output.box_plots[0].column).toBe('age');
      });

      it('should convert categorical column to bar chart', () => {
        const v1Input: VisualizationAnalysis = {
          univariateRecommendations: [
            {
              columnName: 'category',
              dataType: 'Categorical',
              cardinality: 10,
              completeness: 1.0,
            } as ColumnVisualizationProfile,
          ],
          bivariateRecommendations: [],
        } as any;

        const v2Output = Section4Adapter.convertToV2(v1Input);

        expect(v2Output.bar_charts).toHaveLength(1);
        expect(v2Output.bar_charts[0].column).toBe('category');
        expect(v2Output.bar_charts[0].category_count).toBe(10);
      });

      it('should convert numeric vs numeric to scatter plot', () => {
        const v1Input: VisualizationAnalysis = {
          univariateRecommendations: [],
          bivariateRecommendations: [
            {
              variable1: 'age',
              variable2: 'income',
              relationshipType: 'numerical_numerical',
              strength: 0.75,
            } as BivariateVisualizationProfile,
          ],
        } as any;

        const v2Output = Section4Adapter.convertToV2(v1Input);

        expect(v2Output.scatter_plots).toHaveLength(1);
        expect(v2Output.scatter_plots[0].x_column).toBe('age');
        expect(v2Output.scatter_plots[0].y_column).toBe('income');
        expect(v2Output.scatter_plots[0].correlation).toBe(0.75);
      });

      it('should extract high cardinality columns', () => {
        const v1Input: VisualizationAnalysis = {
          univariateRecommendations: [
            {
              columnName: 'low_card',
              dataType: 'Categorical',
              cardinality: 10,
              completeness: 1.0,
            } as ColumnVisualizationProfile,
            {
              columnName: 'high_card',
              dataType: 'Categorical',
              cardinality: 100,
              completeness: 1.0,
            } as ColumnVisualizationProfile,
          ],
          bivariateRecommendations: [],
        } as any;

        const v2Output = Section4Adapter.convertToV2(v1Input);

        expect(v2Output.high_cardinality_columns).toContain('high_card');
        expect(v2Output.high_cardinality_columns).not.toContain('low_card');
      });

      it('should extract sparse data columns', () => {
        const v1Input: VisualizationAnalysis = {
          univariateRecommendations: [
            {
              columnName: 'complete_col',
              dataType: 'Numerical',
              cardinality: 50,
              completeness: 1.0,
            } as ColumnVisualizationProfile,
            {
              columnName: 'sparse_col',
              dataType: 'Numerical',
              cardinality: 30,
              completeness: 0.3,
            } as ColumnVisualizationProfile,
          ],
          bivariateRecommendations: [],
        } as any;

        const v2Output = Section4Adapter.convertToV2(v1Input);

        expect(v2Output.sparse_data_columns).toContain('sparse_col');
        expect(v2Output.sparse_data_columns).not.toContain('complete_col');
      });

      it('should set default width and height based on complexity', () => {
        const v1Input: VisualizationAnalysis = {
          strategy: {
            complexity: 'simple',
          },
          univariateRecommendations: [],
          bivariateRecommendations: [],
        } as any;

        const v2Output = Section4Adapter.convertToV2(v1Input);

        expect(v2Output.suggested_width_px).toBe(600);
        expect(v2Output.suggested_height_px).toBe(Math.round(600 * 0.67));
      });

      it('should handle complex strategy with larger dimensions', () => {
        const v1Input: VisualizationAnalysis = {
          strategy: {
            complexity: 'complex',
          },
          univariateRecommendations: [],
          bivariateRecommendations: [],
        } as any;

        const v2Output = Section4Adapter.convertToV2(v1Input);

        expect(v2Output.suggested_width_px).toBe(1200);
        expect(v2Output.suggested_height_px).toBe(Math.round(1200 * 0.67));
      });
    });

    describe('Edge Case Tests', () => {
      it('should handle empty recommendations', () => {
        const v1Input: VisualizationAnalysis = {
          univariateRecommendations: [],
          bivariateRecommendations: [],
        } as any;

        const v2Output = Section4Adapter.convertToV2(v1Input);

        expect(v2Output.version).toBe('2.0');
        expect(v2Output.scatter_plots).toHaveLength(0);
        expect(v2Output.histograms).toHaveLength(0);
        expect(v2Output.bar_charts).toHaveLength(0);
        expect(v2Output.box_plots).toHaveLength(0);
      });

      it('should handle undefined univariate recommendations', () => {
        const v1Input: VisualizationAnalysis = {
          univariateRecommendations: undefined,
          bivariateRecommendations: [],
        } as any;

        const v2Output = Section4Adapter.convertToV2(v1Input);

        expect(v2Output.histograms).toHaveLength(0);
        expect(v2Output.bar_charts).toHaveLength(0);
      });

      it('should handle undefined bivariate recommendations', () => {
        const v1Input: VisualizationAnalysis = {
          univariateRecommendations: [],
          bivariateRecommendations: undefined,
        } as any;

        const v2Output = Section4Adapter.convertToV2(v1Input);

        expect(v2Output.scatter_plots).toHaveLength(0);
      });

      it('should handle missing distribution data', () => {
        const v1Input: VisualizationAnalysis = {
          univariateRecommendations: [
            {
              columnName: 'age',
              dataType: 'Numerical',
              cardinality: 50,
              completeness: 0.95,
              // Missing distribution
            } as ColumnVisualizationProfile,
          ],
          bivariateRecommendations: [],
        } as any;

        const v2Output = Section4Adapter.convertToV2(v1Input);

        expect(v2Output.histograms[0].skewness).toBe(0);
      });

      it('should handle missing cardinality', () => {
        const v1Input: VisualizationAnalysis = {
          univariateRecommendations: [
            {
              columnName: 'category',
              dataType: 'Categorical',
              // Missing cardinality
              completeness: 1.0,
            } as ColumnVisualizationProfile,
          ],
          bivariateRecommendations: [],
        } as any;

        const v2Output = Section4Adapter.convertToV2(v1Input);

        expect(v2Output.bar_charts[0].category_count).toBe(0);
      });

      it('should handle missing completeness', () => {
        const v1Input: VisualizationAnalysis = {
          univariateRecommendations: [
            {
              columnName: 'sparse_col',
              dataType: 'Numerical',
              cardinality: 30,
              // Missing completeness
            } as ColumnVisualizationProfile,
          ],
          bivariateRecommendations: [],
        } as any;

        const v2Output = Section4Adapter.convertToV2(v1Input);

        // Should default to 1.0, so not sparse
        expect(v2Output.sparse_data_columns).not.toContain('sparse_col');
      });

      it('should handle missing relationship strength', () => {
        const v1Input: VisualizationAnalysis = {
          univariateRecommendations: [],
          bivariateRecommendations: [
            {
              variable1: 'age',
              variable2: 'income',
              relationshipType: 'numerical_numerical',
              // Missing strength
            } as BivariateVisualizationProfile,
          ],
        } as any;

        const v2Output = Section4Adapter.convertToV2(v1Input);

        expect(v2Output.scatter_plots[0].correlation).toBe(0);
      });

      it('should handle missing strategy', () => {
        const v1Input: VisualizationAnalysis = {
          // Missing strategy
          univariateRecommendations: [],
          bivariateRecommendations: [],
        } as any;

        const v2Output = Section4Adapter.convertToV2(v1Input);

        expect(v2Output.suggested_width_px).toBe(800); // Default
        expect(v2Output.suggested_height_px).toBe(Math.round(800 * 0.67));
      });

      it('should handle zero cardinality', () => {
        const v1Input: VisualizationAnalysis = {
          univariateRecommendations: [
            {
              columnName: 'empty_col',
              dataType: 'Categorical',
              cardinality: 0,
              completeness: 0,
            } as ColumnVisualizationProfile,
          ],
          bivariateRecommendations: [],
        } as any;

        const v2Output = Section4Adapter.convertToV2(v1Input);

        expect(v2Output.bar_charts[0].category_count).toBe(0);
      });

      it('should handle very high cardinality', () => {
        const v1Input: VisualizationAnalysis = {
          univariateRecommendations: [
            {
              columnName: 'unique_ids',
              dataType: 'Categorical',
              cardinality: 1000000,
              completeness: 1.0,
            } as ColumnVisualizationProfile,
          ],
          bivariateRecommendations: [],
        } as any;

        const v2Output = Section4Adapter.convertToV2(v1Input);

        expect(v2Output.high_cardinality_columns).toContain('unique_ids');
        expect(v2Output.bar_charts[0].category_count).toBe(1000000);
      });

      it('should handle extreme negative skewness', () => {
        const v1Input: VisualizationAnalysis = {
          univariateRecommendations: [
            {
              columnName: 'left_skewed',
              dataType: 'Numerical',
              cardinality: 50,
              completeness: 1.0,
              distribution: {
                skewness: -5.5,
              },
            } as ColumnVisualizationProfile,
          ],
          bivariateRecommendations: [],
        } as any;

        const v2Output = Section4Adapter.convertToV2(v1Input);

        expect(v2Output.histograms[0].skewness).toBe(-5.5);
      });
    });

    describe('Output Validation', () => {
      it('should always have version 2.0', () => {
        const v1Input: any = {
          univariateRecommendations: [],
          bivariateRecommendations: [],
        };

        const v2Output = Section4Adapter.convertToV2(v1Input);

        expect(v2Output.version).toBe('2.0');
      });

      it('should always have required fields defined', () => {
        const v1Input: any = {
          univariateRecommendations: [],
          bivariateRecommendations: [],
        };

        const v2Output = Section4Adapter.convertToV2(v1Input);

        expect(v2Output.scatter_plots).toBeDefined();
        expect(v2Output.histograms).toBeDefined();
        expect(v2Output.bar_charts).toBeDefined();
        expect(v2Output.box_plots).toBeDefined();
        expect(v2Output.heatmaps).toBeDefined();
        expect(v2Output.time_series).toBeDefined();
        expect(v2Output.color_blind_safe_palettes).toBeDefined();
        expect(v2Output.requires_alt_text).toBeDefined();
        expect(v2Output.suggested_width_px).toBeDefined();
        expect(v2Output.suggested_height_px).toBeDefined();
        expect(v2Output.dataset_size).toBeDefined();
        expect(v2Output.high_cardinality_columns).toBeDefined();
        expect(v2Output.sparse_data_columns).toBeDefined();
      });

      it('should ensure arrays are always arrays not null', () => {
        const v1Input: any = {
          univariateRecommendations: [],
          bivariateRecommendations: [],
        };

        const v2Output = Section4Adapter.convertToV2(v1Input);

        expect(Array.isArray(v2Output.scatter_plots)).toBe(true);
        expect(Array.isArray(v2Output.histograms)).toBe(true);
        expect(Array.isArray(v2Output.bar_charts)).toBe(true);
        expect(Array.isArray(v2Output.box_plots)).toBe(true);
        expect(Array.isArray(v2Output.heatmaps)).toBe(true);
        expect(Array.isArray(v2Output.time_series)).toBe(true);
        expect(Array.isArray(v2Output.color_blind_safe_palettes)).toBe(true);
        expect(Array.isArray(v2Output.high_cardinality_columns)).toBe(true);
        expect(Array.isArray(v2Output.sparse_data_columns)).toBe(true);
      });

      it('should always have default color palettes', () => {
        const v1Input: any = {
          univariateRecommendations: [],
          bivariateRecommendations: [],
        };

        const v2Output = Section4Adapter.convertToV2(v1Input);

        expect(v2Output.color_blind_safe_palettes).toContain('viridis');
        expect(v2Output.color_blind_safe_palettes).toContain('cividis');
        expect(v2Output.color_blind_safe_palettes).toContain('plasma');
      });

      it('should always require alt text', () => {
        const v1Input: any = {
          univariateRecommendations: [],
          bivariateRecommendations: [],
        };

        const v2Output = Section4Adapter.convertToV2(v1Input);

        expect(v2Output.requires_alt_text).toBe(true);
      });

      it('should have positive dimensions', () => {
        const v1Input: any = {
          univariateRecommendations: [],
          bivariateRecommendations: [],
        };

        const v2Output = Section4Adapter.convertToV2(v1Input);

        expect(v2Output.suggested_width_px).toBeGreaterThan(0);
        expect(v2Output.suggested_height_px).toBeGreaterThan(0);
      });

      it('should handle moderate complexity', () => {
        const v1Input: VisualizationAnalysis = {
          strategy: {
            complexity: 'moderate',
          },
          univariateRecommendations: [],
          bivariateRecommendations: [],
        } as any;

        const v2Output = Section4Adapter.convertToV2(v1Input);

        expect(v2Output.suggested_width_px).toBe(800);
        expect(v2Output.suggested_height_px).toBe(Math.round(800 * 0.67));
      });

      it('should handle mixed chart types', () => {
        const v1Input: VisualizationAnalysis = {
          univariateRecommendations: [
            {
              columnName: 'numeric1',
              dataType: 'Numerical',
              cardinality: 50,
              completeness: 0.95,
              distribution: { skewness: 0.5 },
            } as ColumnVisualizationProfile,
            {
              columnName: 'category1',
              dataType: 'Categorical',
              cardinality: 10,
              completeness: 1.0,
            } as ColumnVisualizationProfile,
            {
              columnName: 'numeric2',
              dataType: 'Numeric',
              cardinality: 100,
              completeness: 0.8,
              distribution: { skewness: -0.3 },
            } as ColumnVisualizationProfile,
          ],
          bivariateRecommendations: [
            {
              variable1: 'numeric1',
              variable2: 'numeric2',
              relationshipType: 'numerical_numerical',
              strength: 0.6,
            } as BivariateVisualizationProfile,
          ],
        } as any;

        const v2Output = Section4Adapter.convertToV2(v1Input);

        expect(v2Output.histograms.length).toBeGreaterThanOrEqual(2);
        expect(v2Output.bar_charts).toHaveLength(1);
        expect(v2Output.scatter_plots).toHaveLength(1);
      });
    });
  });
});
