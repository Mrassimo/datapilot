/**
 * Section 6: Modeling Adapter (V1 → V2)
 * Converts bloated modeling recommendations to lean ML task facts
 */

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

export class Section6Adapter {
  /**
   * Convert V1 (bloated) to V2 (lean)
   * Strips: recommendations, strengths/weaknesses, business objectives, reasoning
   * Keeps: factual ML task detection and algorithm applicability
   */
  public static convertToV2(v1: ModelingAnalysis): Section6ModelingV2 {
    const mlTasks: MLTask[] = [];
    const algorithms: AlgorithmApplicability[] = [];

    // Extract ML tasks
    if (v1.identifiedTasks) {
      v1.identifiedTasks.forEach((task) => {
        const mlTask = this.extractMLTask(task);
        if (mlTask) {
          mlTasks.push(mlTask);
        }
      });
    }

    // Extract algorithm applicability
    if (v1.algorithmRecommendations) {
      v1.algorithmRecommendations.forEach((algo) => {
        algorithms.push(this.extractAlgorithmApplicability(algo));
      });
    }

    return {
      version: '2.0',
      ml_tasks: mlTasks,
      algorithms,
      data_readiness: this.extractDataReadiness(v1),
      validation: this.extractValidation(v1),
      feature_candidates: this.extractFeatureCandidates(v1),
    };
  }

  private static extractMLTask(task: ModelingTask): MLTask | null {
    const taskType = task.taskType;

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

    if (task.targetType === 'multiclass') {
      // Would need to extract from actual data
      classes = 3; // Placeholder
    }

    return {
      type: 'classification',
      target_column: task.targetVariable || '',
      classes,
      class_distribution: classDistribution,
      is_balanced: minClassRatio > 0.3, // Heuristic
      min_class_ratio: minClassRatio,
    };
  }

  private static extractRegressionTask(task: ModelingTask): RegressionTask {
    return {
      type: 'regression',
      target_column: task.targetVariable || '',
      range: [0, 0], // Would need actual data
      distribution_type: 'normal', // Placeholder
      has_outliers: task.potentialChallenges?.some((c) => c.toLowerCase().includes('outlier')) || false,
      outlier_ratio: 0, // Would need actual data
    };
  }

  private static extractClusteringTask(task: ModelingTask): ClusteringTask {
    return {
      type: 'clustering',
      feature_count: task.inputFeatures?.length || 0,
      sample_size: 0, // Would need actual data
      has_mixed_types: task.potentialChallenges?.some((c) => c.toLowerCase().includes('mixed')) || false,
    };
  }

  private static extractAlgorithmApplicability(algo: AlgorithmRecommendation): AlgorithmApplicability {
    // Map algorithm category to family
    const family = this.mapAlgorithmFamily(algo.category);

    // Extract factual reasons (not subjective strengths/weaknesses)
    const reasons: string[] = [];
    algo.dataRequirements?.forEach((req) => {
      if (req.includes('sample')) reasons.push('sample_size_constraint');
      if (req.includes('feature')) reasons.push('high_dimensionality');
      if (req.includes('scale')) reasons.push('requires_scaling');
      if (req.includes('categorical')) reasons.push('requires_encoding');
    });

    return {
      algorithm_family: family,
      applicable: algo.suitabilityScore > 50,
      reasons,
      computational_complexity: this.mapComplexity(algo.complexity),
    };
  }

  private static extractDataReadiness(v1: ModelingAnalysis): DataReadiness {
    // V1 doesn't have detailed data readiness info
    // Would need to integrate with Sections 1-3 for accurate data

    return {
      missing_data_ratio: 0, // Would need Section 2 data
      requires_imputation: false, // Would need Section 2 data
      requires_scaling: false, // Default assumption
      requires_encoding: false, // Default assumption
      categorical_features: 0, // Would need Section 3 data
      numeric_features: 0, // Would need Section 3 data
      total_features: 0, // Would need Section 3 data
      sample_size: 0, // Would need Section 1 data
      train_test_split_feasible: true, // Assume true unless we have data
    };
  }

  private static extractValidation(v1: ModelingAnalysis): Section6ModelingV2['validation'] {
    // Extract from evaluation framework
    const evalFramework = v1.evaluationFramework;

    return {
      sample_size: 0, // Would need Section 1 data
      recommended_cv_folds: 5, // Default
      train_size: 800, // Placeholder (80% of 1000)
      test_size: 200, // Placeholder (20% of 1000)
      stratification_required: false, // Default
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
}
