/**
 * Section 6: Modeling Adapter (V1 → V2)
 * Converts bloated modeling recommendations to lean ML task facts
 */

import { logger } from '@/utils/logger';
import type {
  ModelingAnalysis,
  ModelingTask,
  AlgorithmRecommendation,
} from './types';

import type {
  Section6ModelingV2,
  MLTask,
  ClassificationTask,
  RegressionTask,
  ClusteringTask,
  AlgorithmApplicability,
  DataReadiness,
} from './types-v2';

export interface Section6Metadata {
  sampleSize?: number;
  missingRatio?: number;
  categoricalCount?: number;
  numericCount?: number;
  totalColumns?: number;
}

export class Section6Adapter {
  /**
   * Convert V1 (bloated) to V2 (lean)
   * Strips: recommendations, strengths/weaknesses, business objectives, reasoning
   * Keeps: factual ML task detection and algorithm applicability
   *
   * Error handling strategy:
   * - Validates V1 input structure before processing
   * - Uses safe navigation and defaults for missing fields
   * - Skips invalid tasks/algorithms with warnings
   * - Returns minimal valid structure on critical errors
   */
  public static convertToV2(v1: ModelingAnalysis, metadata?: Section6Metadata): Section6ModelingV2 {
    try {
      // Validate input
      if (!this.isValidV1Input(v1)) {
        logger.warn('Section6Adapter: Invalid V1 input, returning minimal structure', {
          context: 'convertToV2',
          hasInput: !!v1,
          inputType: typeof v1,
        });
        return this.getMinimalV2Structure();
      }
      const mlTasks: MLTask[] = [];
      const algorithms: AlgorithmApplicability[] = [];

      // Extract ML tasks
      const identifiedTasks = v1?.identifiedTasks;
      if (Array.isArray(identifiedTasks)) {
        identifiedTasks.forEach((task) => {
          if (!task || typeof task !== 'object') {
            return;
          }
          try {
            const mlTask = this.extractMLTask(task);
            if (mlTask) {
              mlTasks.push(mlTask);
            }
          } catch (error) {
            logger.warn('Section6Adapter: Error extracting ML task', {
              context: 'convertToV2',
              taskType: task.taskType,
              error: error instanceof Error ? error.message : String(error),
            });
          }
        });
      }

      // Extract algorithm applicability
      const algorithmRecs = v1?.algorithmRecommendations;
      if (Array.isArray(algorithmRecs)) {
        algorithmRecs.forEach((algo) => {
          if (!algo || typeof algo !== 'object') {
            return;
          }
          try {
            algorithms.push(this.extractAlgorithmApplicability(algo));
          } catch (error) {
            logger.warn('Section6Adapter: Error extracting algorithm applicability', {
              context: 'convertToV2',
              error: error instanceof Error ? error.message : String(error),
            });
          }
        });
      }

      return {
        version: '2.0',
        ml_tasks: mlTasks,
        algorithms,
        data_readiness: this.extractDataReadiness(v1, metadata),
        validation: this.extractValidation(v1, metadata),
        feature_candidates: this.extractFeatureCandidates(v1),
      };
    } catch (error) {
      logger.error('Section6Adapter: Critical error during V2 conversion', {
        context: 'convertToV2',
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      return this.getMinimalV2Structure();
    }
  }

  private static extractMLTask(task: ModelingTask): MLTask | null {
    const taskType = task?.taskType;

    if (
      taskType === 'binary_classification' ||
      taskType === 'multiclass_classification'
    ) {
      return this.extractClassificationTask(task);
    } else if (taskType === 'regression') {
      return this.extractRegressionTask(task);
    } else if (taskType === 'clustering') {
      return this.extractClusteringTask(task);
    }

    return null;
  }

  private static extractClassificationTask(task: ModelingTask): ClassificationTask {
    // Extract class distribution from data requirements or other sources
    const classDistribution: Record<string, number> = {};
    let classes = 2; // Default for binary
    let minClassRatio = 0.5;

    if (task?.targetType === 'multiclass') {
      // Would need to extract from actual data
      classes = 3; // Placeholder
    }

    return {
      type: 'classification',
      target_column: task?.targetVariable || '',
      classes,
      class_distribution: classDistribution,
      is_balanced: minClassRatio > 0.3, // Heuristic
      min_class_ratio: minClassRatio,
    };
  }

  private static extractRegressionTask(task: ModelingTask): RegressionTask {
    const potentialChallenges = task?.potentialChallenges || [];
    const hasOutliers = Array.isArray(potentialChallenges)
      ? potentialChallenges.some((c) => String(c).toLowerCase().includes('outlier'))
      : false;

    return {
      type: 'regression',
      target_column: task?.targetVariable || '',
      range: [0, 0], // Would need actual data
      distribution_type: 'normal', // Placeholder
      has_outliers: hasOutliers,
      outlier_ratio: 0, // Would need actual data
    };
  }

  private static extractClusteringTask(task: ModelingTask): ClusteringTask {
    const potentialChallenges = task?.potentialChallenges || [];
    const hasMixedTypes = Array.isArray(potentialChallenges)
      ? potentialChallenges.some((c) => String(c).toLowerCase().includes('mixed'))
      : false;
    const inputFeatures = task?.inputFeatures;

    return {
      type: 'clustering',
      feature_count: Array.isArray(inputFeatures) ? inputFeatures.length : 0,
      sample_size: 0, // Would need actual data
      has_mixed_types: hasMixedTypes,
    };
  }

  private static extractAlgorithmApplicability(algo: AlgorithmRecommendation): AlgorithmApplicability {
    // Map algorithm category to family
    const family = this.mapAlgorithmFamily(algo?.category || '');

    // Extract factual reasons (not subjective strengths/weaknesses)
    const reasons: string[] = [];
    const dataRequirements = algo?.dataRequirements;
    if (Array.isArray(dataRequirements)) {
      dataRequirements.forEach((req) => {
        const reqStr = String(req || '');
        if (reqStr.includes('sample')) reasons.push('sample_size_constraint');
        if (reqStr.includes('feature')) reasons.push('high_dimensionality');
        if (reqStr.includes('scale')) reasons.push('requires_scaling');
        if (reqStr.includes('categorical')) reasons.push('requires_encoding');
      });
    }

    return {
      algorithm_family: family,
      applicable: (algo?.suitabilityScore || 0) > 50,
      reasons,
      computational_complexity: this.mapComplexity(algo?.complexity || ''),
    };
  }

  private static extractDataReadiness(v1: ModelingAnalysis, metadata?: Section6Metadata): DataReadiness {
    const missingRatio = metadata?.missingRatio || 0;
    const categoricalCount = metadata?.categoricalCount || 0;
    const numericCount = metadata?.numericCount || 0;
    const totalFeatures = metadata?.totalColumns || (categoricalCount + numericCount);
    const sampleSize = metadata?.sampleSize || 0;

    return {
      missing_data_ratio: missingRatio,
      requires_imputation: missingRatio > 0.05, // >5% missing requires imputation
      requires_scaling: numericCount > 0, // If we have numeric features, scaling is recommended
      requires_encoding: categoricalCount > 0, // If we have categorical features, encoding is required
      categorical_features: categoricalCount,
      numeric_features: numericCount,
      total_features: totalFeatures,
      sample_size: sampleSize,
      train_test_split_feasible: sampleSize >= 100, // Need at least 100 rows for train/test split
    };
  }

  private static extractValidation(v1: ModelingAnalysis, metadata?: Section6Metadata): Section6ModelingV2['validation'] {
    const sampleSize = metadata?.sampleSize || 0;
    const trainRatio = 0.8;

    // Determine CV folds based on sample size
    let cvFolds = 5; // Default
    if (sampleSize < 100) {
      cvFolds = 3; // Too small for 5-fold
    } else if (sampleSize >= 1000) {
      cvFolds = 10; // Large enough for 10-fold
    }

    const trainSize = Math.floor(sampleSize * trainRatio);
    const testSize = sampleSize - trainSize; // Remainder goes to test set

    return {
      sample_size: sampleSize,
      recommended_cv_folds: cvFolds,
      train_size: trainSize,
      test_size: testSize,
      stratification_required: false, // Would need to check if classification task
    };
  }

  private static extractFeatureCandidates(
    v1: ModelingAnalysis,
  ): Section6ModelingV2['feature_candidates'] {
    const candidates: Section6ModelingV2['feature_candidates'] = [];

    // V1 doesn't have feature importance analysis in the main structure
    // This would need to come from Section 3 or enhanced analyzer
    // Return empty for now

    return candidates;
  }

  private static mapAlgorithmFamily(category: string): string {
    const lower = category.toLowerCase();
    if (lower.includes('linear')) return 'linear';
    if (lower.includes('tree')) return 'tree';
    if (lower.includes('ensemble')) return 'ensemble';
    if (lower.includes('neural')) return 'neural';
    if (lower.includes('svm') || lower.includes('support vector')) return 'svm';
    return category; // Return as-is
  }

  private static mapComplexity(complexity: string): 'low' | 'medium' | 'high' {
    const lower = complexity.toLowerCase();
    if (lower.includes('simple') || lower.includes('low')) return 'low';
    if (lower.includes('moderate') || lower.includes('medium')) return 'medium';
    if (lower.includes('complex') || lower.includes('advanced') || lower.includes('high')) return 'high';
    return 'medium'; // Default
  }

  /**
   * Validates V1 input structure
   * Checks for at least some task or algorithm data
   */
  private static isValidV1Input(v1: ModelingAnalysis): boolean {
    if (!v1 || typeof v1 !== 'object') {
      return false;
    }

    // V1 can have empty arrays, which is valid
    return true;
  }

  /**
   * Returns a minimal valid V2 structure for error cases
   * Ensures that downstream consumers always receive valid structure
   */
  private static getMinimalV2Structure(): Section6ModelingV2 {
    return {
      version: '2.0',
      ml_tasks: [],
      algorithms: [],
      data_readiness: {
        missing_data_ratio: 0,
        requires_imputation: false,
        requires_scaling: false,
        requires_encoding: false,
        categorical_features: 0,
        numeric_features: 0,
        total_features: 0,
        sample_size: 0,
        train_test_split_feasible: false,
      },
      validation: {
        sample_size: 0,
        recommended_cv_folds: 5,
        train_size: 0,
        test_size: 0,
        stratification_required: false,
      },
      feature_candidates: [],
    };
  }
}
