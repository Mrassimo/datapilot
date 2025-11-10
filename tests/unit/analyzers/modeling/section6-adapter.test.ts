/**
 * Section 6 Modeling Adapter Tests
 *
 * Tests the V1 → V2 conversion for Modeling analysis
 * Verifies ML task extraction and algorithm applicability
 */

import { Section6Adapter, Section6Metadata } from '../../../../src/analyzers/modeling/section6-adapter';
import type { ModelingAnalysis, ModelingTask, AlgorithmRecommendation } from '../../../../src/analyzers/modeling/types';
import type { Section6ModelingV2 } from '../../../../src/analyzers/modeling/types-v2';

describe('Section6Adapter', () => {
  describe('convertToV2', () => {
    describe('Happy Path Tests', () => {
      it('should convert classification task correctly', () => {
        const v1Input: ModelingAnalysis = {
          identifiedTasks: [
            {
              taskType: 'binary_classification',
              targetVariable: 'churn',
              targetType: 'binary',
              inputFeatures: ['age', 'income', 'tenure'],
              potentialChallenges: ['imbalanced classes'],
            } as any,
          ],
          algorithmRecommendations: [],
        } as any;

        const v2Output = Section6Adapter.convertToV2(v1Input);

        expect(v2Output.version).toBe('2.0');
        expect(v2Output.ml_tasks).toHaveLength(1);
        expect(v2Output.ml_tasks[0].type).toBe('classification');
        const classificationTask = v2Output.ml_tasks[0] as any;
        expect(classificationTask.target_column).toBe('churn');
        expect(classificationTask.classes).toBe(2);
      });

      it('should convert regression task correctly', () => {
        const v1Input: ModelingAnalysis = {
          identifiedTasks: [
            {
              taskType: 'regression',
              targetVariable: 'price',
              inputFeatures: ['size', 'location', 'age'],
              potentialChallenges: ['outliers present'],
            } as any,
          ],
          algorithmRecommendations: [],
        } as any;

        const v2Output = Section6Adapter.convertToV2(v1Input);

        expect(v2Output.ml_tasks).toHaveLength(1);
        expect(v2Output.ml_tasks[0].type).toBe('regression');
        const regressionTask = v2Output.ml_tasks[0] as any;
        expect(regressionTask.target_column).toBe('price');
        expect(regressionTask.has_outliers).toBe(true);
      });

      it('should convert clustering task correctly', () => {
        const v1Input: ModelingAnalysis = {
          identifiedTasks: [
            {
              taskType: 'clustering',
              inputFeatures: ['feature1', 'feature2', 'feature3'],
              potentialChallenges: ['mixed data types'],
            } as any,
          ],
          algorithmRecommendations: [],
        } as any;

        const v2Output = Section6Adapter.convertToV2(v1Input);

        expect(v2Output.ml_tasks).toHaveLength(1);
        expect(v2Output.ml_tasks[0].type).toBe('clustering');
        expect((v2Output.ml_tasks[0] as any).feature_count).toBe(3);
        expect((v2Output.ml_tasks[0] as any).has_mixed_types).toBe(true);
      });

      it('should convert algorithm recommendations correctly', () => {
        const v1Input: ModelingAnalysis = {
          identifiedTasks: [],
          algorithmRecommendations: [
            {
              algorithmName: 'Random Forest',
              category: 'Tree-based Ensemble',
              suitabilityScore: 85,
              complexity: 'Moderate',
              dataRequirements: [
                'Minimum 1000 samples recommended',
                'Handles mixed feature types',
              ],
            } as any,
            {
              algorithmName: 'Linear Regression',
              category: 'Linear Model',
              suitabilityScore: 45,
              complexity: 'Simple',
              dataRequirements: ['Must scale features before training'],
            } as any,
          ],
        } as any;

        const v2Output = Section6Adapter.convertToV2(v1Input);

        expect(v2Output.algorithms).toHaveLength(2);

        const rfAlgo = v2Output.algorithms[0];
        expect(rfAlgo.algorithm_family).toBe('tree');
        expect(rfAlgo.applicable).toBe(true); // Score > 50
        expect(rfAlgo.computational_complexity).toBe('medium');
        expect(rfAlgo.reasons).toContain('sample_size_constraint');

        const lrAlgo = v2Output.algorithms[1];
        expect(lrAlgo.algorithm_family).toBe('linear');
        expect(lrAlgo.applicable).toBe(false); // Score < 50
        expect(lrAlgo.computational_complexity).toBe('low');
        expect(lrAlgo.reasons).toContain('requires_scaling');
        expect(lrAlgo.reasons).toContain('high_dimensionality');
      });

      it('should extract data readiness from metadata', () => {
        const v1Input: ModelingAnalysis = {
          identifiedTasks: [],
          algorithmRecommendations: [],
        } as any;

        const metadata: Section6Metadata = {
          sampleSize: 1000,
          missingRatio: 0.1,
          categoricalCount: 5,
          numericCount: 10,
          totalColumns: 15,
        };

        const v2Output = Section6Adapter.convertToV2(v1Input, metadata);

        expect(v2Output.data_readiness.missing_data_ratio).toBe(0.1);
        expect(v2Output.data_readiness.requires_imputation).toBe(true); // > 5%
        expect(v2Output.data_readiness.requires_scaling).toBe(true); // Has numeric
        expect(v2Output.data_readiness.requires_encoding).toBe(true); // Has categorical
        expect(v2Output.data_readiness.categorical_features).toBe(5);
        expect(v2Output.data_readiness.numeric_features).toBe(10);
        expect(v2Output.data_readiness.total_features).toBe(15);
        expect(v2Output.data_readiness.sample_size).toBe(1000);
        expect(v2Output.data_readiness.train_test_split_feasible).toBe(true); // >= 100
      });

      it('should calculate validation strategy from metadata', () => {
        const v1Input: ModelingAnalysis = {
          identifiedTasks: [],
          algorithmRecommendations: [],
        } as any;

        const metadata: Section6Metadata = {
          sampleSize: 500,
        };

        const v2Output = Section6Adapter.convertToV2(v1Input, metadata);

        expect(v2Output.validation.sample_size).toBe(500);
        expect(v2Output.validation.recommended_cv_folds).toBe(5);
        expect(v2Output.validation.train_size).toBe(400); // 80% of 500
        expect(v2Output.validation.test_size).toBe(100); // 20% of 500
      });
    });

    describe('Edge Case Tests', () => {
      it('should handle empty tasks and algorithms', () => {
        const v1Input: ModelingAnalysis = {
          identifiedTasks: [],
          algorithmRecommendations: [],
        } as any;

        const v2Output = Section6Adapter.convertToV2(v1Input);

        expect(v2Output.version).toBe('2.0');
        expect(v2Output.ml_tasks).toHaveLength(0);
        expect(v2Output.algorithms).toHaveLength(0);
      });

      it('should handle undefined identifiedTasks', () => {
        const v1Input: ModelingAnalysis = {
          identifiedTasks: undefined,
          algorithmRecommendations: [],
        } as any;

        const v2Output = Section6Adapter.convertToV2(v1Input);

        expect(v2Output.ml_tasks).toHaveLength(0);
      });

      it('should handle undefined algorithmRecommendations', () => {
        const v1Input: ModelingAnalysis = {
          identifiedTasks: [],
          algorithmRecommendations: undefined,
        } as any;

        const v2Output = Section6Adapter.convertToV2(v1Input);

        expect(v2Output.algorithms).toHaveLength(0);
      });

      it('should handle missing metadata with defaults', () => {
        const v1Input: ModelingAnalysis = {
          identifiedTasks: [],
          algorithmRecommendations: [],
        } as any;

        const v2Output = Section6Adapter.convertToV2(v1Input);

        expect(v2Output.data_readiness.sample_size).toBe(0);
        expect(v2Output.data_readiness.missing_data_ratio).toBe(0);
        expect(v2Output.data_readiness.requires_imputation).toBe(false);
        expect(v2Output.data_readiness.train_test_split_feasible).toBe(false); // < 100
      });

      it('should handle small sample sizes for CV folds', () => {
        const v1Input: ModelingAnalysis = {
          identifiedTasks: [],
          algorithmRecommendations: [],
        } as any;

        const metadata: Section6Metadata = {
          sampleSize: 50,
        };

        const v2Output = Section6Adapter.convertToV2(v1Input, metadata);

        expect(v2Output.validation.recommended_cv_folds).toBe(3); // Too small for 5-fold
      });

      it('should handle large sample sizes for CV folds', () => {
        const v1Input: ModelingAnalysis = {
          identifiedTasks: [],
          algorithmRecommendations: [],
        } as any;

        const metadata: Section6Metadata = {
          sampleSize: 10000,
        };

        const v2Output = Section6Adapter.convertToV2(v1Input, metadata);

        expect(v2Output.validation.recommended_cv_folds).toBe(10); // Large enough for 10-fold
      });

      it('should handle very low missing ratio', () => {
        const v1Input: ModelingAnalysis = {
          identifiedTasks: [],
          algorithmRecommendations: [],
        } as any;

        const metadata: Section6Metadata = {
          sampleSize: 1000,
          missingRatio: 0.01, // 1% missing
          numericCount: 10,
          categoricalCount: 0,
        };

        const v2Output = Section6Adapter.convertToV2(v1Input, metadata);

        expect(v2Output.data_readiness.requires_imputation).toBe(false); // < 5%
      });

      it('should handle no numeric or categorical features', () => {
        const v1Input: ModelingAnalysis = {
          identifiedTasks: [],
          algorithmRecommendations: [],
        } as any;

        const metadata: Section6Metadata = {
          sampleSize: 1000,
          missingRatio: 0,
          numericCount: 0,
          categoricalCount: 0,
        };

        const v2Output = Section6Adapter.convertToV2(v1Input, metadata);

        expect(v2Output.data_readiness.requires_scaling).toBe(false);
        expect(v2Output.data_readiness.requires_encoding).toBe(false);
      });

      it('should handle missing targetVariable', () => {
        const v1Input: ModelingAnalysis = {
          identifiedTasks: [
            {
              taskType: 'binary_classification',
              // Missing targetVariable
              inputFeatures: [],
            } as any,
          ],
          algorithmRecommendations: [],
        } as any;

        const v2Output = Section6Adapter.convertToV2(v1Input);

        const task = v2Output.ml_tasks[0] as any;
        expect(task.target_column).toBe('');
      });

      it('should handle missing inputFeatures', () => {
        const v1Input: ModelingAnalysis = {
          identifiedTasks: [
            {
              taskType: 'clustering',
              // Missing inputFeatures
            } as any,
          ],
          algorithmRecommendations: [],
        } as any;

        const v2Output = Section6Adapter.convertToV2(v1Input);

        expect((v2Output.ml_tasks[0] as any).feature_count).toBe(0);
      });

      it('should handle missing dataRequirements', () => {
        const v1Input: ModelingAnalysis = {
          identifiedTasks: [],
          algorithmRecommendations: [
            {
              algorithmName: 'SVM',
              category: 'Support Vector Machine',
              suitabilityScore: 75,
              complexity: 'Advanced',
              // Missing dataRequirements
            } as any,
          ],
        } as any;

        const v2Output = Section6Adapter.convertToV2(v1Input);

        expect(v2Output.algorithms[0].reasons).toHaveLength(0);
      });

      it('should handle missing complexity', () => {
        const v1Input: ModelingAnalysis = {
          identifiedTasks: [],
          algorithmRecommendations: [
            {
              algorithmName: 'Unknown Algo',
              category: 'Unknown',
              suitabilityScore: 60,
              // Missing complexity
              dataRequirements: [],
            } as any,
          ],
        } as any;

        const v2Output = Section6Adapter.convertToV2(v1Input);

        expect(v2Output.algorithms[0].computational_complexity).toBe('medium'); // Default
      });

      it('should handle unknown task type', () => {
        const v1Input: ModelingAnalysis = {
          identifiedTasks: [
            {
              taskType: 'unknown_task_type',
              targetVariable: 'target',
              inputFeatures: [],
            } as any,
          ],
          algorithmRecommendations: [],
        } as any;

        const v2Output = Section6Adapter.convertToV2(v1Input);

        expect(v2Output.ml_tasks).toHaveLength(0); // Unknown type filtered out
      });
    });

    describe('Metadata Tests', () => {
      it('should handle partial metadata', () => {
        const v1Input: ModelingAnalysis = {
          identifiedTasks: [],
          algorithmRecommendations: [],
        } as any;

        const metadata: Section6Metadata = {
          sampleSize: 500,
          // Missing other fields
        };

        const v2Output = Section6Adapter.convertToV2(v1Input, metadata);

        expect(v2Output.data_readiness.sample_size).toBe(500);
        expect(v2Output.data_readiness.missing_data_ratio).toBe(0);
        expect(v2Output.data_readiness.categorical_features).toBe(0);
        expect(v2Output.data_readiness.numeric_features).toBe(0);
      });

      it('should calculate total_features from categorical and numeric if not provided', () => {
        const v1Input: ModelingAnalysis = {
          identifiedTasks: [],
          algorithmRecommendations: [],
        } as any;

        const metadata: Section6Metadata = {
          sampleSize: 1000,
          categoricalCount: 5,
          numericCount: 10,
          // totalColumns not provided
        };

        const v2Output = Section6Adapter.convertToV2(v1Input, metadata);

        expect(v2Output.data_readiness.total_features).toBe(15); // 5 + 10
      });

      it('should use totalColumns when provided', () => {
        const v1Input: ModelingAnalysis = {
          identifiedTasks: [],
          algorithmRecommendations: [],
        } as any;

        const metadata: Section6Metadata = {
          sampleSize: 1000,
          categoricalCount: 5,
          numericCount: 10,
          totalColumns: 20, // Includes datetime, etc.
        };

        const v2Output = Section6Adapter.convertToV2(v1Input, metadata);

        expect(v2Output.data_readiness.total_features).toBe(20);
      });
    });

    describe('Output Validation', () => {
      it('should always have version 2.0', () => {
        const v1Input: any = {
          identifiedTasks: [],
          algorithmRecommendations: [],
        };

        const v2Output = Section6Adapter.convertToV2(v1Input);

        expect(v2Output.version).toBe('2.0');
      });

      it('should always have required fields defined', () => {
        const v1Input: any = {
          identifiedTasks: [],
          algorithmRecommendations: [],
        };

        const v2Output = Section6Adapter.convertToV2(v1Input);

        expect(v2Output.ml_tasks).toBeDefined();
        expect(v2Output.algorithms).toBeDefined();
        expect(v2Output.data_readiness).toBeDefined();
        expect(v2Output.validation).toBeDefined();
        expect(v2Output.feature_candidates).toBeDefined();
      });

      it('should ensure arrays are always arrays not null', () => {
        const v1Input: any = {
          identifiedTasks: [],
          algorithmRecommendations: [],
        };

        const v2Output = Section6Adapter.convertToV2(v1Input);

        expect(Array.isArray(v2Output.ml_tasks)).toBe(true);
        expect(Array.isArray(v2Output.algorithms)).toBe(true);
        expect(Array.isArray(v2Output.feature_candidates)).toBe(true);
      });

      it('should ensure numeric fields are numbers not NaN', () => {
        const v1Input: any = {
          identifiedTasks: [],
          algorithmRecommendations: [],
        };

        const metadata: Section6Metadata = {
          sampleSize: 1000,
          missingRatio: 0.1,
          categoricalCount: 5,
          numericCount: 10,
        };

        const v2Output = Section6Adapter.convertToV2(v1Input, metadata);

        expect(Number.isNaN(v2Output.data_readiness.sample_size)).toBe(false);
        expect(Number.isNaN(v2Output.data_readiness.missing_data_ratio)).toBe(false);
        expect(Number.isNaN(v2Output.validation.sample_size)).toBe(false);
        expect(Number.isNaN(v2Output.validation.recommended_cv_folds)).toBe(false);
        expect(Number.isNaN(v2Output.validation.train_size)).toBe(false);
        expect(Number.isNaN(v2Output.validation.test_size)).toBe(false);
      });

      it('should map algorithm families correctly', () => {
        const v1Input: ModelingAnalysis = {
          identifiedTasks: [],
          algorithmRecommendations: [
            {
              algorithmName: 'Linear Regression',
              category: 'Linear Model',
              suitabilityScore: 70,
              complexity: 'Simple',
              dataRequirements: [],
            } as any,
            {
              algorithmName: 'Decision Tree',
              category: 'Tree-based',
              suitabilityScore: 65,
              complexity: 'Simple',
              dataRequirements: [],
            } as any,
            {
              algorithmName: 'Neural Network',
              category: 'Neural Network',
              suitabilityScore: 80,
              complexity: 'Complex',
              dataRequirements: [],
            } as any,
            {
              algorithmName: 'SVM',
              category: 'Support Vector Machine',
              suitabilityScore: 75,
              complexity: 'Advanced',
              dataRequirements: [],
            } as any,
          ],
        } as any;

        const v2Output = Section6Adapter.convertToV2(v1Input);

        expect(v2Output.algorithms[0].algorithm_family).toBe('linear');
        expect(v2Output.algorithms[1].algorithm_family).toBe('tree');
        expect(v2Output.algorithms[2].algorithm_family).toBe('neural');
        expect(v2Output.algorithms[3].algorithm_family).toBe('svm');
      });

      it('should map complexity levels correctly', () => {
        const v1Input: ModelingAnalysis = {
          identifiedTasks: [],
          algorithmRecommendations: [
            {
              algorithmName: 'Simple Algo',
              category: 'Unknown',
              suitabilityScore: 70,
              complexity: 'Simple',
              dataRequirements: [],
            } as any,
            {
              algorithmName: 'Moderate Algo',
              category: 'Unknown',
              suitabilityScore: 70,
              complexity: 'Moderate',
              dataRequirements: [],
            } as any,
            {
              algorithmName: 'Complex Algo',
              category: 'Unknown',
              suitabilityScore: 70,
              complexity: 'Advanced',
              dataRequirements: [],
            } as any,
          ],
        } as any;

        const v2Output = Section6Adapter.convertToV2(v1Input);

        expect(v2Output.algorithms[0].computational_complexity).toBe('low');
        expect(v2Output.algorithms[1].computational_complexity).toBe('medium');
        expect(v2Output.algorithms[2].computational_complexity).toBe('high');
      });

      it('should handle multiclass classification', () => {
        const v1Input: ModelingAnalysis = {
          identifiedTasks: [
            {
              taskType: 'multiclass_classification',
              targetVariable: 'species',
              targetType: 'multiclass',
              inputFeatures: ['sepal_length', 'sepal_width'],
            } as any,
          ],
          algorithmRecommendations: [],
        } as any;

        const v2Output = Section6Adapter.convertToV2(v1Input);

        expect(v2Output.ml_tasks[0].type).toBe('classification');
        expect((v2Output.ml_tasks[0] as any).classes).toBeGreaterThan(2);
      });
    });
  });
});
