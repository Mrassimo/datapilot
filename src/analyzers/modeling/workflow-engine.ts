/**
 * Modeling Workflow Engine for Section 6
 * Generates comprehensive step-by-step modeling guidance and best practices
 */

import type {
  ModelingTask,
  AlgorithmRecommendation,
  ModelingWorkflow,
  WorkflowStep,
  BestPractice,
  DataSplittingStrategy,
  CrossValidationApproach,
  HyperparameterTuningStrategy,
  Section6Config,
} from './types';
import type { Section1Result } from '../overview/types';
import type { Section5Result } from '../engineering/types';
import { logger } from '../../utils/logger';

export class WorkflowEngine {
  private config: Section6Config;

  constructor(config: Section6Config) {
    this.config = config;
  }

  /**
   * Generate comprehensive modeling workflow
   */
  async generateWorkflow(
    tasks: ModelingTask[],
    algorithms: AlgorithmRecommendation[],
    section1Result: Section1Result,
    section5Result: Section5Result,
  ): Promise<ModelingWorkflow> {
    logger.info('Generating modeling workflow guidance');

    const dataSize = section1Result.overview.structuralDimensions.totalDataRows;
    const hasTemporalData = this.detectTemporalData(tasks);
    const primaryTaskType = this.identifyPrimaryTaskType(tasks);

    return {
      workflowSteps: this.generateWorkflowSteps(tasks, algorithms, dataSize, hasTemporalData),
      bestPractices: this.generateBestPractices(primaryTaskType, dataSize),
      dataSplittingStrategy: this.generateDataSplittingStrategy(
        primaryTaskType,
        dataSize,
        hasTemporalData,
      ),
      crossValidationApproach: this.generateCrossValidationApproach(
        primaryTaskType,
        dataSize,
        hasTemporalData,
      ),
      hyperparameterTuning: this.generateHyperparameterTuningStrategy(algorithms, dataSize),
      evaluationFramework: this.generateEvaluationFramework(tasks, algorithms),
      interpretationGuidance: this.generateInterpretationGuidance(algorithms),
    };
  }

  /**
   * Generate detailed workflow steps
   */
  private generateWorkflowSteps(
    tasks: ModelingTask[],
    algorithms: AlgorithmRecommendation[],
    dataSize: number,
    hasTemporalData: boolean,
  ): WorkflowStep[] {
    const steps: WorkflowStep[] = [];

    // Step 1: Data Preparation and Validation
    steps.push({
      stepNumber: 1,
      stepName: 'Data Preparation and Validation',
      description:
        'Prepare the dataset for modeling by applying transformations from Section 5 and validating data quality',
      inputs: ['Raw dataset', 'Section 5 transformation recommendations', 'Quality audit results'],
      outputs: ['Clean dataset', 'Transformed features', 'Data validation report'],
      estimatedTime: dataSize > 10000 ? '2-4 hours' : '30-60 minutes',
      difficulty: 'intermediate',
      tools: ['pandas', 'scikit-learn preprocessing', 'NumPy'],
      considerations: [
        'Apply feature engineering recommendations from Section 5',
        'Handle missing values according to imputation strategy',
        'Scale numerical features if required by chosen algorithms',
        'Encode categorical variables appropriately',
      ],
      commonPitfalls: [
        'Data leakage through improper scaling before train/test split',
        'Inconsistent handling of missing values between train and test sets',
        'Forgetting to save transformation parameters for production use',
      ],
    });

    // Step 2: Train/Validation/Test Split
    steps.push({
      stepNumber: 2,
      stepName: 'Data Splitting Strategy',
      description: hasTemporalData
        ? 'Create temporal train/validation/test splits to respect time ordering'
        : 'Split data into training, validation, and test sets for unbiased evaluation',
      inputs: ['Prepared dataset', 'Target variable', 'Temporal indicators (if applicable)'],
      outputs: ['Training set', 'Validation set', 'Test set', 'Split documentation'],
      estimatedTime: '15-30 minutes',
      difficulty: 'beginner',
      tools: ['scikit-learn train_test_split', 'pandas', 'stratification tools'],
      considerations: [
        hasTemporalData
          ? 'Maintain temporal order in splits'
          : 'Ensure representative sampling across classes',
        'Document split ratios and random seeds for reproducibility',
        'Verify class balance in each split for classification tasks',
      ],
      commonPitfalls: [
        hasTemporalData
          ? 'Using random splits instead of temporal splits'
          : 'Inadequate stratification for imbalanced classes',
        'Test set too small for reliable performance estimates',
        'Information leakage between splits',
      ],
    });

    // Step 3: Baseline Model Implementation
    steps.push({
      stepNumber: 3,
      stepName: 'Baseline Model Implementation',
      description: 'Implement simple baseline models to establish performance benchmarks',
      inputs: ['Training set', 'Validation set', 'Algorithm recommendations'],
      outputs: ['Baseline model(s)', 'Baseline performance metrics', 'Model comparison framework'],
      estimatedTime: '1-2 hours',
      difficulty: 'intermediate',
      tools: ['scikit-learn', 'statsmodels', 'evaluation metrics'],
      considerations: [
        'Start with simplest recommended algorithm (e.g., Linear/Logistic Regression)',
        'Establish clear evaluation metrics and benchmarks',
        'Document all hyperparameters and assumptions',
      ],
      commonPitfalls: [
        'Skipping baseline models and jumping to complex algorithms',
        'Using inappropriate evaluation metrics for the task',
        'Over-optimizing baseline models instead of treating them as benchmarks',
      ],
    });

    // Step 4: Advanced Model Implementation
    if (algorithms.some((alg) => alg.complexity !== 'simple')) {
      steps.push({
        stepNumber: 4,
        stepName: 'Advanced Model Implementation',
        description: 'Implement more sophisticated algorithms based on recommendations',
        inputs: [
          'Training set',
          'Validation set',
          'Baseline performance',
          'Advanced algorithm recommendations',
        ],
        outputs: [
          'Advanced model(s)',
          'Comparative performance analysis',
          'Model complexity assessment',
        ],
        estimatedTime: '3-6 hours',
        difficulty: 'advanced',
        tools: ['scikit-learn', 'XGBoost/LightGBM', 'specialized libraries'],
        considerations: [
          'Implement recommended tree-based and ensemble methods',
          'Focus on algorithms with high suitability scores',
          'Compare against baseline performance',
        ],
        commonPitfalls: [
          'Implementing too many algorithms without proper evaluation',
          'Neglecting computational resource constraints',
          'Overfitting to validation set through excessive model tuning',
        ],
      });
    }

    // Step 5: Hyperparameter Tuning
    steps.push({
      stepNumber: steps.length + 1,
      stepName: 'Hyperparameter Optimization',
      description: 'Systematically tune hyperparameters for best-performing algorithms',
      inputs: ['Trained models', 'Validation set', 'Hyperparameter search spaces'],
      outputs: ['Optimized models', 'Hyperparameter tuning results', 'Cross-validation scores'],
      estimatedTime: dataSize > 10000 ? '4-8 hours' : '1-3 hours',
      difficulty: 'advanced',
      tools: ['GridSearchCV', 'RandomizedSearchCV', 'Optuna/Hyperopt'],
      considerations: [
        'Use cross-validation within training set for hyperparameter tuning',
        'Focus on most important hyperparameters first',
        'Monitor for diminishing returns vs computational cost',
      ],
      commonPitfalls: [
        'Tuning on test set (causes overfitting)',
        'Excessive hyperparameter tuning leading to overfitting',
        'Ignoring computational budget constraints',
      ],
    });

    // Step 6: Model Evaluation and Interpretation
    steps.push({
      stepNumber: steps.length + 1,
      stepName: 'Model Evaluation and Interpretation',
      description: 'Comprehensive evaluation of final models and interpretation of results',
      inputs: ['Optimized models', 'Test set', 'Evaluation frameworks'],
      outputs: ['Final model performance', 'Model interpretations', 'Feature importance analysis'],
      estimatedTime: '2-4 hours',
      difficulty: 'intermediate',
      tools: ['Model evaluation metrics', 'SHAP/LIME', 'visualization libraries'],
      considerations: [
        'Evaluate models on held-out test set',
        'Generate model interpretation and explanations',
        'Assess model robustness and stability',
      ],
      commonPitfalls: [
        'Using validation performance as final performance estimate',
        'Inadequate model interpretation and explanation',
        'Ignoring model assumptions and limitations',
      ],
    });

    // Step 7: Model Validation and Diagnostics
    if (tasks.some((task) => task.taskType === 'regression')) {
      steps.push({
        stepNumber: steps.length + 1,
        stepName: 'Regression Model Diagnostics',
        description:
          'Perform detailed residual analysis and assumption checking for regression models',
        inputs: ['Trained regression models', 'Test predictions', 'Residuals'],
        outputs: [
          'Residual diagnostic plots',
          'Assumption validation',
          'Model improvement recommendations',
        ],
        estimatedTime: '1-2 hours',
        difficulty: 'advanced',
        tools: ['Matplotlib/Seaborn', 'SciPy stats', 'Statsmodels'],
        considerations: [
          'Generate comprehensive residual plots (vs fitted, Q-Q, histogram)',
          'Test for homoscedasticity, normality, and independence',
          'Identify influential outliers and leverage points',
        ],
        commonPitfalls: [
          'Ignoring violation of regression assumptions',
          'Misinterpreting residual patterns',
          'Failing to validate assumptions on test data',
        ],
      });
    }

    // Step 8: Documentation and Reporting
    steps.push({
      stepNumber: steps.length + 1,
      stepName: 'Documentation and Reporting',
      description: 'Document methodology, results, and recommendations for stakeholders',
      inputs: ['Model results', 'Performance metrics', 'Interpretations', 'Business context'],
      outputs: [
        'Technical report',
        'Executive summary',
        'Model documentation',
        'Deployment recommendations',
      ],
      estimatedTime: '2-4 hours',
      difficulty: 'intermediate',
      tools: ['Jupyter notebooks', 'Documentation tools', 'Visualization libraries'],
      considerations: [
        'Document all methodological decisions and rationale',
        'Create clear visualizations for stakeholder communication',
        'Provide actionable business recommendations',
      ],
      commonPitfalls: [
        'Inadequate documentation of methodology',
        'Technical jargon in business-facing reports',
        'Missing discussion of limitations and assumptions',
      ],
    });

    return steps;
  }

  /**
   * Generate modeling best practices
   */
  private generateBestPractices(primaryTaskType: string, dataSize: number): BestPractice[] {
    const practices: BestPractice[] = [];

    // Cross-validation practices
    practices.push({
      category: 'Cross-Validation',
      practice: 'Always use cross-validation for model selection and hyperparameter tuning',
      reasoning:
        'Provides more robust estimates of model performance and reduces overfitting to validation set',
      implementation:
        'Use stratified k-fold for classification, regular k-fold for regression, time series split for temporal data',
      relatedSteps: [3, 4, 5],
    });

    // Feature engineering practices
    practices.push({
      category: 'Feature Engineering',
      practice: 'Apply feature transformations consistently across train/validation/test sets',
      reasoning: 'Prevents data leakage and ensures model can be deployed reliably',
      implementation:
        'Fit transformers on training data only, then apply to all sets. Save transformation parameters.',
      relatedSteps: [1, 2],
    });

    // Model selection practices
    practices.push({
      category: 'Model Selection',
      practice: 'Start simple and increase complexity gradually',
      reasoning:
        'Simple models are more interpretable and often sufficient. Complex models risk overfitting.',
      implementation:
        'Begin with linear/logistic regression baseline, then try tree-based and ensemble methods',
      relatedSteps: [3, 4],
    });

    // Evaluation practices
    practices.push({
      category: 'Model Evaluation',
      practice: 'Use multiple evaluation metrics appropriate for your problem',
      reasoning:
        'Single metrics can be misleading. Different metrics highlight different aspects of performance.',
      implementation: primaryTaskType.includes('classification')
        ? 'Use accuracy, precision, recall, F1-score, and ROC AUC for classification'
        : 'Use R², RMSE, MAE, and MAPE for regression',
      relatedSteps: [6],
    });

    // Interpretability practices
    if (this.config.interpretabilityRequirement !== 'low') {
      practices.push({
        category: 'Model Interpretability',
        practice: 'Prioritize model interpretability based on business requirements',
        reasoning: 'Interpretable models build trust and enable better decision-making',
        implementation:
          'Use SHAP values, feature importance plots, and decision tree visualization',
        relatedSteps: [6],
      });
    }

    // Documentation practices
    practices.push({
      category: 'Documentation',
      practice: 'Document all modeling decisions and assumptions',
      reasoning: 'Enables reproducibility and helps future model maintenance',
      implementation:
        'Record data preprocessing steps, model hyperparameters, and evaluation methodology',
      relatedSteps: [8],
    });

    return practices;
  }

  /**
   * Generate data splitting strategy
   */
  private generateDataSplittingStrategy(
    primaryTaskType: string,
    dataSize: number,
    hasTemporalData: boolean,
  ): DataSplittingStrategy {
    if (hasTemporalData) {
      return {
        strategy: 'temporal',
        trainPercent: 70,
        validationPercent: 15,
        testPercent: 15,
        reasoning:
          'Temporal data requires chronological splits to simulate real-world prediction scenarios',
        implementation:
          'Split data chronologically: oldest 70% for training, next 15% for validation, newest 15% for testing',
        considerations: [
          'Ensure sufficient recent data in validation and test sets',
          'Consider seasonal patterns when determining split points',
          'Validate that training period covers representative patterns',
        ],
      };
    }

    if (primaryTaskType.includes('classification')) {
      return {
        strategy: 'stratified',
        trainPercent: dataSize > 1000 ? 70 : 80,
        validationPercent: dataSize > 1000 ? 15 : 10,
        testPercent: dataSize > 1000 ? 15 : 10,
        reasoning:
          'Stratified sampling ensures representative class distribution across all splits',
        implementation:
          'Use stratified random sampling to maintain class proportions in train/validation/test sets',
        considerations: [
          'Verify class balance is maintained in each split',
          'Adjust split ratios for very small datasets to ensure minimum samples per class',
          'Consider stratification by important categorical variables beyond target',
        ],
      };
    }

    return {
      strategy: 'random',
      trainPercent: dataSize > 1000 ? 70 : 80,
      validationPercent: dataSize > 1000 ? 15 : 10,
      testPercent: dataSize > 1000 ? 15 : 10,
      reasoning: 'Random sampling provides unbiased representation for regression tasks',
      implementation: 'Use random sampling with fixed seed for reproducibility',
      considerations: [
        'Set random seed for reproducible splits',
        'Verify training set covers full range of target variable',
        'Consider blocking by important grouping variables if applicable',
      ],
    };
  }

  /**
   * Generate cross-validation approach
   */
  private generateCrossValidationApproach(
    primaryTaskType: string,
    dataSize: number,
    hasTemporalData: boolean,
  ): CrossValidationApproach {
    if (hasTemporalData) {
      return {
        method: 'time_series_split',
        folds: Math.min(5, Math.floor(dataSize / 100)),
        reasoning:
          'Time series cross-validation respects temporal ordering and simulates realistic forecasting scenarios',
        implementation:
          'Use TimeSeriesSplit from scikit-learn with expanding or sliding window approach',
        expectedBenefit: 'Realistic performance estimates for time-dependent predictions',
      };
    }

    if (primaryTaskType.includes('classification')) {
      return {
        method: 'stratified_k_fold',
        folds: dataSize > 1000 ? 5 : Math.max(3, Math.floor(dataSize / 50)),
        reasoning:
          'Stratified cross-validation maintains class distribution in each fold, providing stable performance estimates',
        implementation:
          'Use StratifiedKFold from scikit-learn to maintain class proportions across folds',
        expectedBenefit: 'Robust performance estimates with balanced class representation',
      };
    }

    return {
      method: 'k_fold',
      folds: dataSize > 1000 ? 5 : Math.max(3, Math.floor(dataSize / 50)),
      reasoning:
        'K-fold cross-validation provides robust performance estimates for regression tasks',
      implementation: 'Use KFold from scikit-learn with random shuffling',
      expectedBenefit: 'Stable performance estimates across different data subsets',
    };
  }

  /**
   * Generate hyperparameter tuning strategy
   */
  private generateHyperparameterTuningStrategy(
    algorithms: AlgorithmRecommendation[],
    dataSize: number,
  ): HyperparameterTuningStrategy {
    const complexAlgorithms = algorithms.filter(
      (alg) => alg.complexity === 'moderate' || alg.complexity === 'complex',
    );

    const method =
      dataSize > 10000 && complexAlgorithms.length > 0 ? 'random_search' : 'grid_search';

    return {
      method,
      searchSpace: this.generateSearchSpaces(algorithms),
      optimizationMetric: this.selectOptimizationMetric(algorithms),
      budgetConstraints: [
        {
          constraintType: 'time',
          limit: dataSize > 10000 ? '4 hours' : '2 hours',
          reasoning: 'Balance between thorough search and practical time limits',
        },
        {
          constraintType: 'computational',
          limit: 'Single machine with available cores',
          reasoning: 'Optimize for typical development environment resources',
        },
      ],
      earlyStoppingCriteria:
        method === 'random_search' ? 'No improvement for 50 iterations' : undefined,
    };
  }

  // Helper methods
  private detectTemporalData(tasks: ModelingTask[]): boolean {
    return tasks.some(
      (task) =>
        task.taskType === 'time_series_forecasting' ||
        task.inputFeatures.some(
          (feature) =>
            feature.toLowerCase().includes('date') || feature.toLowerCase().includes('time'),
        ),
    );
  }

  private identifyPrimaryTaskType(tasks: ModelingTask[]): string {
    if (tasks.length === 0) return 'unknown';

    // Return the most common task type
    const taskCounts = tasks.reduce(
      (counts, task) => {
        counts[task.taskType] = (counts[task.taskType] || 0) + 1;
        return counts;
      },
      {} as Record<string, number>,
    );

    return Object.entries(taskCounts).sort(([, a], [, b]) => b - a)[0][0];
  }

  private generateSearchSpaces(algorithms: AlgorithmRecommendation[]): any[] {
    // Simplified implementation - would be more sophisticated
    return algorithms.map((alg) => ({
      algorithmName: alg.algorithmName,
      parameters: alg.hyperparameters.map((hp) => hp.parameterName),
      searchType: 'grid',
    }));
  }

  private selectOptimizationMetric(algorithms: AlgorithmRecommendation[]): string {
    // Simplified logic - would analyze task types
    const hasClassification = algorithms.some(
      (alg) =>
        alg.evaluationMetrics.includes('Accuracy') || alg.evaluationMetrics.includes('F1-Score'),
    );

    return hasClassification ? 'f1_macro' : 'neg_mean_squared_error';
  }

  private generateEvaluationFramework(
    tasks: ModelingTask[],
    algorithms: AlgorithmRecommendation[],
  ): any {
    // Simplified implementation
    return {
      primaryMetrics: [],
      secondaryMetrics: [],
      interpretationGuidelines: [],
      benchmarkComparisons: [],
      businessImpactAssessment: [],
      robustnessTests: [],
    };
  }

  private generateInterpretationGuidance(algorithms: AlgorithmRecommendation[]): any {
    // Simplified implementation
    return {
      globalInterpretation: {
        methods: [],
        overallModelBehavior: '',
        keyPatterns: [],
        featureRelationships: [],
        modelLimitations: [],
      },
      localInterpretation: {
        methods: [],
        exampleExplanations: [],
        explanationReliability: '',
        useCases: [],
      },
      featureImportance: {
        importanceMethod: 'permutation',
        featureRankings: [],
        stabilityAnalysis: '',
        businessRelevance: [],
      },
      modelBehaviorAnalysis: {
        decisionBoundaries: '',
        nonlinearEffects: [],
        interactionEffects: [],
        predictionConfidence: '',
      },
      visualizationStrategies: [],
    };
  }
}
