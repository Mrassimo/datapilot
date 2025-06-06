/**
 * Section 6: Predictive Modeling & Advanced Analytics Guidance Analyzer
 * Core engine for identifying modeling tasks and generating comprehensive guidance
 */

import type { Section1Result } from '../overview/types';
import type { Section2Result } from '../quality/types';
import type { Section3Result } from '../eda/types';
import type { Section5Result } from '../engineering/types';
import type {
  Section6Result,
  Section6Config,
  Section6Progress,
  Section6Warning,
  ModelingTask,
  ModelingTaskType,
  AlgorithmRecommendation,
  ModelingAnalysis,
  CARTAnalysis,
  ResidualAnalysis,
  ModelingWorkflow,
  EvaluationFramework,
  EthicsAnalysis,
  ConfidenceLevel,
  ModelComplexity,
  InterpretabilityLevel,
} from './types';
import { logger } from '../../utils/logger';
import { AlgorithmRecommender } from './algorithm-recommender';
import { WorkflowEngine } from './workflow-engine';
import { EthicsAnalyzer } from './ethics-analyzer';
import { CARTAnalyzer } from './cart-analyzer';
import { ResidualAnalyzer } from './residual-analyzer';

export class Section6Analyzer {
  private config: Section6Config;
  private warnings: Section6Warning[] = [];
  private startTime: number = 0;
  private algorithmRecommender: AlgorithmRecommender;
  private workflowEngine: WorkflowEngine;
  private ethicsAnalyzer: EthicsAnalyzer;
  private cartAnalyzer: CARTAnalyzer;
  private residualAnalyzer: ResidualAnalyzer;

  constructor(config: Partial<Section6Config> = {}) {
    this.config = {
      focusAreas: ['regression', 'binary_classification', 'clustering'],
      complexityPreference: 'moderate',
      interpretabilityRequirement: 'medium',
      ethicsLevel: 'standard',
      includeAdvancedMethods: true,
      performanceThresholds: {
        minModelAccuracy: 0.8,
        maxComplexity: 0.7,
        minInterpretability: 0.6,
      },
      ...config,
    };

    // Initialize sub-analyzers
    this.algorithmRecommender = new AlgorithmRecommender(this.config);
    this.workflowEngine = new WorkflowEngine(this.config);
    this.ethicsAnalyzer = new EthicsAnalyzer(this.config);
    this.cartAnalyzer = new CARTAnalyzer();
    this.residualAnalyzer = new ResidualAnalyzer();
  }

  /**
   * Main analysis method for Section 6
   */
  async analyze(
    section1Result: Section1Result,
    section2Result: Section2Result,
    section3Result: Section3Result,
    section5Result: Section5Result,
    progressCallback?: (progress: Section6Progress) => void,
  ): Promise<Section6Result> {
    this.startTime = Date.now();
    logger.info('Starting Section 6: Predictive Modeling & Advanced Analytics analysis');

    try {
      this.reportProgress(progressCallback, 'initialization', 0, 'Initializing modeling analysis');

      // Phase 1: Identify potential modeling tasks
      const identifiedTasks = await this.identifyModelingTasks(
        section1Result,
        section2Result,
        section3Result,
        section5Result,
        progressCallback
      );

      // Phase 2: Generate algorithm recommendations
      const algorithmRecommendations = await this.generateAlgorithmRecommendations(
        identifiedTasks,
        section1Result,
        section3Result,
        section5Result,
        progressCallback
      );

      // Phase 3: Create specialized analyses (CART, Residuals)
      const { cartAnalysis, residualAnalysis } = await this.generateSpecializedAnalyses(
        identifiedTasks,
        algorithmRecommendations,
        progressCallback
      );

      // Phase 4: Build workflow guidance
      const workflowGuidance = await this.generateWorkflowGuidance(
        identifiedTasks,
        algorithmRecommendations,
        section1Result,
        section5Result,
        progressCallback
      );

      // Phase 5: Create evaluation framework
      const evaluationFramework = await this.generateEvaluationFramework(
        identifiedTasks,
        algorithmRecommendations,
        progressCallback
      );

      // Phase 6: Generate interpretation guidance
      const interpretationGuidance = await this.generateInterpretationGuidance(
        algorithmRecommendations,
        progressCallback
      );

      // Phase 7: Perform ethics analysis
      const ethicsAnalysis = await this.performEthicsAnalysis(
        identifiedTasks,
        section1Result,
        section2Result,
        progressCallback
      );

      // Phase 8: Create implementation roadmap
      const implementationRoadmap = await this.generateImplementationRoadmap(
        identifiedTasks,
        algorithmRecommendations,
        progressCallback
      );

      const analysisTime = Date.now() - this.startTime;
      this.reportProgress(progressCallback, 'finalization', 100, 'Modeling analysis complete');

      const modelingAnalysis: ModelingAnalysis = {
        identifiedTasks,
        algorithmRecommendations,
        cartAnalysis,
        residualAnalysis,
        workflowGuidance,
        evaluationFramework,
        interpretationGuidance,
        ethicsAnalysis,
        implementationRoadmap,
      };

      return {
        modelingAnalysis,
        warnings: this.warnings,
        performanceMetrics: {
          analysisTimeMs: analysisTime,
          tasksIdentified: identifiedTasks.length,
          algorithmsEvaluated: algorithmRecommendations.length,
          ethicsChecksPerformed: this.ethicsAnalyzer.getChecksPerformed(),
          recommendationsGenerated: this.calculateTotalRecommendations(modelingAnalysis),
        },
        metadata: {
          analysisApproach: 'Comprehensive modeling guidance with specialized focus on interpretability',
          complexityLevel: this.config.complexityPreference,
          recommendationConfidence: this.calculateOverallConfidence(identifiedTasks),
          primaryFocus: this.config.focusAreas,
          limitationsIdentified: this.collectLimitations(identifiedTasks, algorithmRecommendations),
        },
      };
    } catch (error) {
      logger.error('Section 6 analysis failed:', error);
      throw error;
    }
  }

  /**
   * Identify potential modeling tasks based on data characteristics
   */
  private async identifyModelingTasks(
    section1Result: Section1Result,
    section2Result: Section2Result,
    section3Result: Section3Result,
    section5Result: Section5Result,
    progressCallback?: (progress: Section6Progress) => void,
  ): Promise<ModelingTask[]> {
    this.reportProgress(progressCallback, 'task_identification', 15, 'Identifying potential modeling tasks');

    const tasks: ModelingTask[] = [];
    const columns = section1Result.overview.structuralDimensions.columnInventory;
    const mlReadiness = section5Result.engineeringAnalysis.mlReadiness;

    // Analyze column types and characteristics
    const numericalColumns = columns.filter(col => col.dataType === 'continuous' || col.dataType === 'integer');
    const categoricalColumns = columns.filter(col => col.dataType === 'nominal' || col.dataType === 'ordinal' || col.dataType === 'string');
    const temporalColumns = columns.filter(col => col.dataType === 'date' || col.dataType === 'datetime');

    // Identify regression tasks
    for (const numCol of numericalColumns) {
      if (this.isPotentialTarget(numCol, section3Result)) {
        tasks.push(this.createRegressionTask(numCol, columns, section3Result, mlReadiness));
      }
    }

    // Identify classification tasks
    for (const catCol of categoricalColumns) {
      if (this.isPotentialCategoricalTarget(catCol, section3Result)) {
        const uniqueValues = this.getUniqueValueCount(catCol, section3Result);
        if (uniqueValues === 2) {
          tasks.push(this.createBinaryClassificationTask(catCol, columns, section3Result, mlReadiness));
        } else if (uniqueValues > 2 && uniqueValues <= 10) {
          tasks.push(this.createMulticlassClassificationTask(catCol, columns, section3Result, mlReadiness));
        }
      }
    }

    // Identify clustering tasks (unsupervised)
    if (numericalColumns.length >= 2) {
      tasks.push(this.createClusteringTask(columns, section3Result, mlReadiness));
    }

    // Identify time series forecasting
    if (temporalColumns.length > 0 && numericalColumns.length > 0) {
      tasks.push(this.createTimeSeriesForecastingTask(temporalColumns, numericalColumns, section3Result, mlReadiness));
    }

    // Identify anomaly detection
    if (this.hasAnomalyPotential(section2Result, section3Result)) {
      tasks.push(this.createAnomalyDetectionTask(columns, section2Result, section3Result, mlReadiness));
    }

    // Filter tasks based on config focus areas
    const filteredTasks = tasks.filter(task => 
      this.config.focusAreas.includes(task.taskType)
    );

    logger.info(`Identified ${filteredTasks.length} potential modeling tasks`);
    return filteredTasks;
  }

  /**
   * Create regression modeling task
   */
  private createRegressionTask(
    targetColumn: any,
    allColumns: any[],
    section3Result: Section3Result,
    mlReadiness: any
  ): ModelingTask {
    const inputFeatures = allColumns
      .filter(col => col.name !== targetColumn.name)
      .map(col => col.name)
      .slice(0, 10); // Limit for initial analysis

    return {
      taskType: 'regression',
      targetVariable: targetColumn.name,
      targetType: 'continuous',
      inputFeatures,
      businessObjective: `Predict ${targetColumn.name} values based on available features`,
      technicalObjective: `Build regression model to estimate continuous ${targetColumn.name} values`,
      justification: [
        `${targetColumn.name} is a continuous numerical variable suitable for regression`,
        `Correlation analysis shows relationships with other variables`,
        `Sufficient data quality for predictive modeling`
      ],
      dataRequirements: this.generateDataRequirements('regression', mlReadiness),
      feasibilityScore: this.calculateFeasibilityScore('regression', targetColumn, allColumns, mlReadiness),
      confidenceLevel: this.assessConfidenceLevel('regression', targetColumn, mlReadiness),
      estimatedComplexity: this.estimateComplexity('regression', allColumns.length, mlReadiness),
      potentialChallenges: this.identifyRegressionChallenges(targetColumn, section3Result),
      successMetrics: ['R²', 'RMSE', 'MAE', 'Cross-validation score']
    };
  }

  /**
   * Create binary classification task
   */
  private createBinaryClassificationTask(
    targetColumn: any,
    allColumns: any[],
    section3Result: Section3Result,
    mlReadiness: any
  ): ModelingTask {
    const inputFeatures = allColumns
      .filter(col => col.name !== targetColumn.name)
      .map(col => col.name)
      .slice(0, 10);

    return {
      taskType: 'binary_classification',
      targetVariable: targetColumn.name,
      targetType: 'binary',
      inputFeatures,
      businessObjective: `Classify instances into two categories based on ${targetColumn.name}`,
      technicalObjective: `Build binary classifier for ${targetColumn.name} prediction`,
      justification: [
        `${targetColumn.name} is a binary categorical variable`,
        `Features show discriminative power for classification`,
        `Balanced or manageable class distribution`
      ],
      dataRequirements: this.generateDataRequirements('binary_classification', mlReadiness),
      feasibilityScore: this.calculateFeasibilityScore('binary_classification', targetColumn, allColumns, mlReadiness),
      confidenceLevel: this.assessConfidenceLevel('binary_classification', targetColumn, mlReadiness),
      estimatedComplexity: this.estimateComplexity('binary_classification', allColumns.length, mlReadiness),
      potentialChallenges: this.identifyClassificationChallenges(targetColumn, section3Result),
      successMetrics: ['Accuracy', 'Precision', 'Recall', 'F1-Score', 'ROC AUC']
    };
  }

  /**
   * Create clustering task for unsupervised learning
   */
  private createClusteringTask(
    allColumns: any[],
    section3Result: Section3Result,
    mlReadiness: any
  ): ModelingTask {
    const numericalColumns = allColumns.filter(col => 
      col.inferredType?.includes('numerical')
    );

    return {
      taskType: 'clustering',
      targetType: 'none',
      inputFeatures: numericalColumns.map(col => col.name),
      businessObjective: 'Discover natural groupings or segments in the data',
      technicalObjective: 'Identify clusters of similar instances for segmentation analysis',
      justification: [
        'Multiple numerical variables available for clustering',
        'No predefined target variable - unsupervised learning appropriate',
        'Potential for discovering hidden patterns or segments'
      ],
      dataRequirements: this.generateDataRequirements('clustering', mlReadiness),
      feasibilityScore: this.calculateFeasibilityScore('clustering', null, allColumns, mlReadiness),
      confidenceLevel: this.assessConfidenceLevel('clustering', null, mlReadiness),
      estimatedComplexity: this.estimateComplexity('clustering', allColumns.length, mlReadiness),
      potentialChallenges: this.identifyClusteringChallenges(numericalColumns, section3Result),
      successMetrics: ['Silhouette Score', 'Davies-Bouldin Index', 'Inertia', 'Cluster Validation']
    };
  }

  /**
   * Generate algorithm recommendations for identified tasks
   */
  private async generateAlgorithmRecommendations(
    tasks: ModelingTask[],
    section1Result: Section1Result,
    section3Result: Section3Result,
    section5Result: Section5Result,
    progressCallback?: (progress: Section6Progress) => void,
  ): Promise<AlgorithmRecommendation[]> {
    this.reportProgress(progressCallback, 'algorithm_selection', 35, 'Generating algorithm recommendations');

    const recommendations: AlgorithmRecommendation[] = [];

    for (const task of tasks) {
      const taskRecommendations = await this.algorithmRecommender.recommendAlgorithms(
        task,
        section1Result,
        section3Result,
        section5Result
      );
      recommendations.push(...taskRecommendations);
    }

    // Sort by suitability score
    recommendations.sort((a, b) => b.suitabilityScore - a.suitabilityScore);

    logger.info(`Generated ${recommendations.length} algorithm recommendations`);
    return recommendations;
  }

  /**
   * Generate specialized analyses (CART and Residual Analysis)
   */
  private async generateSpecializedAnalyses(
    tasks: ModelingTask[],
    algorithms: AlgorithmRecommendation[],
    progressCallback?: (progress: Section6Progress) => void,
  ): Promise<{ cartAnalysis?: CARTAnalysis; residualAnalysis?: ResidualAnalysis }> {
    this.reportProgress(progressCallback, 'workflow_design', 50, 'Generating specialized analyses');

    let cartAnalysis: CARTAnalysis | undefined;
    let residualAnalysis: ResidualAnalysis | undefined;

    // Generate CART analysis if tree-based algorithms are recommended
    const treeAlgorithms = algorithms.filter(alg => 
      alg.category === 'tree_based' || alg.algorithmName.toLowerCase().includes('tree')
    );

    if (treeAlgorithms.length > 0) {
      cartAnalysis = await this.cartAnalyzer.generateCARTAnalysis(tasks, treeAlgorithms);
    }

    // Generate residual analysis for regression tasks
    const regressionTasks = tasks.filter(task => task.taskType === 'regression');
    if (regressionTasks.length > 0) {
      residualAnalysis = await this.residualAnalyzer.generateResidualAnalysis(regressionTasks, algorithms);
    }

    return { cartAnalysis, residualAnalysis };
  }

  // Helper methods for task identification
  private isPotentialTarget(column: any, _section3Result: Section3Result): boolean {
    // Simple heuristic: numerical columns with reasonable variance
    return (column.dataType === 'continuous' || column.dataType === 'integer') && 
           !column.name.toLowerCase().includes('id') &&
           !column.name.toLowerCase().includes('index');
  }

  private isPotentialCategoricalTarget(column: any, section3Result: Section3Result): boolean {
    // Categorical columns that aren't likely to be identifiers
    return !column.name.toLowerCase().includes('id') &&
           !column.name.toLowerCase().includes('name') &&
           !column.name.toLowerCase().includes('description');
  }

  private getUniqueValueCount(column: any, section3Result: Section3Result): number {
    // Simplified - would normally extract from EDA results
    return 2; // Default for demonstration
  }

  private hasAnomalyPotential(section2Result: Section2Result, section3Result: Section3Result): boolean {
    // Check if data quality issues or outliers suggest anomaly detection value
    return section2Result.qualityAudit?.completeness?.overallCompletenessScore < 90 ||
           section2Result.qualityAudit?.validity?.overallValidityScore < 85;
  }

  // Helper methods for task creation
  private generateDataRequirements(taskType: ModelingTaskType, mlReadiness: any): any[] {
    const baseRequirements = [
      {
        requirement: 'Sufficient sample size',
        currentStatus: mlReadiness.overallScore > 70 ? 'met' : 'partially_met' as const,
        importance: 'critical' as const,
        mitigation: 'Consider data augmentation if sample size is insufficient'
      },
      {
        requirement: 'Feature quality',
        currentStatus: 'met' as const,
        importance: 'critical' as const,
      }
    ];

    return baseRequirements;
  }

  private calculateFeasibilityScore(taskType: ModelingTaskType, targetColumn: any, columns: any[], mlReadiness: any): number {
    let score = mlReadiness.overallScore || 70;
    
    // Adjust based on task type complexity
    if (taskType === 'regression' || taskType === 'binary_classification') {
      score += 10; // These are generally easier
    }
    
    // Adjust based on feature count
    if (columns.length < 5) score -= 10;
    if (columns.length > 20) score -= 5;
    
    return Math.min(100, Math.max(0, score));
  }

  private assessConfidenceLevel(taskType: ModelingTaskType, targetColumn: any, mlReadiness: any): ConfidenceLevel {
    const score = mlReadiness.overallScore || 70;
    
    if (score >= 85) return 'very_high';
    if (score >= 75) return 'high';
    if (score >= 60) return 'medium';
    return 'low';
  }

  private estimateComplexity(taskType: ModelingTaskType, featureCount: number, mlReadiness: any): ModelComplexity {
    if (featureCount < 5) return 'simple';
    if (featureCount < 15) return 'moderate';
    if (featureCount < 25) return 'complex';
    return 'advanced';
  }

  private identifyRegressionChallenges(targetColumn: any, section3Result: Section3Result): string[] {
    return [
      'Potential non-linear relationships requiring feature engineering',
      'Outliers may affect model performance',
      'Feature selection needed for optimal performance'
    ];
  }

  private identifyClassificationChallenges(targetColumn: any, section3Result: Section3Result): string[] {
    return [
      'Class imbalance may require specialized techniques',
      'Feature importance analysis needed',
      'Cross-validation required for reliable performance estimates'
    ];
  }

  private identifyClusteringChallenges(numericalColumns: any[], section3Result: Section3Result): string[] {
    return [
      'Determining optimal number of clusters',
      'Feature scaling may be required',
      'Cluster interpretation and validation'
    ];
  }

  // Additional helper methods
  private createTimeSeriesForecastingTask(temporalColumns: any[], numericalColumns: any[], section3Result: Section3Result, mlReadiness: any): ModelingTask {
    return {
      taskType: 'time_series_forecasting',
      targetVariable: numericalColumns[0]?.name,
      targetType: 'continuous',
      inputFeatures: [...temporalColumns.map(c => c.name), ...numericalColumns.slice(1, 6).map(c => c.name)],
      businessObjective: 'Forecast future values based on temporal patterns',
      technicalObjective: 'Build time series model for forecasting',
      justification: [
        'Temporal data available with numerical targets',
        'Time-based forecasting has business value',
        'Historical patterns can inform future predictions'
      ],
      dataRequirements: this.generateDataRequirements('time_series_forecasting', mlReadiness),
      feasibilityScore: this.calculateFeasibilityScore('time_series_forecasting', null, [...temporalColumns, ...numericalColumns], mlReadiness),
      confidenceLevel: this.assessConfidenceLevel('time_series_forecasting', null, mlReadiness),
      estimatedComplexity: 'moderate',
      potentialChallenges: [
        'Seasonality and trend detection',
        'Handling missing temporal data',
        'Model selection for time series'
      ],
      successMetrics: ['MAPE', 'RMSE', 'MAE', 'Forecast accuracy']
    };
  }

  private createMulticlassClassificationTask(targetColumn: any, allColumns: any[], section3Result: Section3Result, mlReadiness: any): ModelingTask {
    const inputFeatures = allColumns
      .filter(col => col.name !== targetColumn.name)
      .map(col => col.name)
      .slice(0, 10);

    return {
      taskType: 'multiclass_classification',
      targetVariable: targetColumn.name,
      targetType: 'multiclass',
      inputFeatures,
      businessObjective: `Classify instances into multiple categories based on ${targetColumn.name}`,
      technicalObjective: `Build multiclass classifier for ${targetColumn.name} prediction`,
      justification: [
        `${targetColumn.name} has multiple discrete categories`,
        'Features available for discrimination between classes',
        'Multiclass classification applicable to business problem'
      ],
      dataRequirements: this.generateDataRequirements('multiclass_classification', mlReadiness),
      feasibilityScore: this.calculateFeasibilityScore('multiclass_classification', targetColumn, allColumns, mlReadiness),
      confidenceLevel: this.assessConfidenceLevel('multiclass_classification', targetColumn, mlReadiness),
      estimatedComplexity: this.estimateComplexity('multiclass_classification', allColumns.length, mlReadiness),
      potentialChallenges: [
        'Handling multiple classes with potential imbalance',
        'Feature selection for multiclass discrimination',
        'Model evaluation with multiple classes'
      ],
      successMetrics: ['Accuracy', 'Macro/Micro F1-Score', 'Confusion Matrix', 'Per-class Precision/Recall']
    };
  }

  private createAnomalyDetectionTask(columns: any[], section2Result: Section2Result, section3Result: Section3Result, mlReadiness: any): ModelingTask {
    const numericalColumns = columns.filter(col => col.inferredType?.includes('numerical'));
    
    return {
      taskType: 'anomaly_detection',
      targetType: 'none',
      inputFeatures: numericalColumns.map(col => col.name),
      businessObjective: 'Identify unusual or anomalous instances in the data',
      technicalObjective: 'Build anomaly detection model to flag outliers',
      justification: [
        'Data quality issues suggest presence of anomalies',
        'Outliers detected in exploratory analysis',
        'Business value in identifying unusual patterns'
      ],
      dataRequirements: this.generateDataRequirements('anomaly_detection', mlReadiness),
      feasibilityScore: this.calculateFeasibilityScore('anomaly_detection', null, columns, mlReadiness),
      confidenceLevel: this.assessConfidenceLevel('anomaly_detection', null, mlReadiness),
      estimatedComplexity: 'moderate',
      potentialChallenges: [
        'Defining what constitutes an anomaly',
        'Balancing false positives vs false negatives',
        'Validating anomaly detection without labeled data'
      ],
      successMetrics: ['Precision@K', 'Recall@K', 'AUC', 'Anomaly Score Distribution']
    };
  }

  // Workflow and framework generation methods (simplified)
  private async generateWorkflowGuidance(tasks: ModelingTask[], algorithms: AlgorithmRecommendation[], section1Result: Section1Result, section5Result: Section5Result, progressCallback?: (progress: Section6Progress) => void): Promise<ModelingWorkflow> {
    return await this.workflowEngine.generateWorkflow(tasks, algorithms, section1Result, section5Result);
  }

  private async generateEvaluationFramework(tasks: ModelingTask[], algorithms: AlgorithmRecommendation[], progressCallback?: (progress: Section6Progress) => void): Promise<EvaluationFramework> {
    this.reportProgress(progressCallback, 'evaluation_framework', 70, 'Creating evaluation framework');
    
    // Simplified implementation - would be more comprehensive
    return {
      primaryMetrics: [],
      secondaryMetrics: [],
      interpretationGuidelines: [],
      benchmarkComparisons: [],
      businessImpactAssessment: [],
      robustnessTests: []
    };
  }

  private async generateInterpretationGuidance(algorithms: AlgorithmRecommendation[], progressCallback?: (progress: Section6Progress) => void): Promise<any> {
    this.reportProgress(progressCallback, 'interpretation_guide', 80, 'Generating interpretation guidance');
    
    // Simplified implementation
    return {
      globalInterpretation: { methods: [], overallModelBehavior: '', keyPatterns: [], featureRelationships: [], modelLimitations: [] },
      localInterpretation: { methods: [], exampleExplanations: [], explanationReliability: '', useCases: [] },
      featureImportance: { importanceMethod: 'permutation', featureRankings: [], stabilityAnalysis: '', businessRelevance: [] },
      modelBehaviorAnalysis: { decisionBoundaries: '', nonlinearEffects: [], interactionEffects: [], predictionConfidence: '' },
      visualizationStrategies: []
    };
  }

  private async performEthicsAnalysis(tasks: ModelingTask[], section1Result: Section1Result, section2Result: Section2Result, progressCallback?: (progress: Section6Progress) => void): Promise<EthicsAnalysis> {
    this.reportProgress(progressCallback, 'ethics_analysis', 90, 'Performing ethics analysis');
    return await this.ethicsAnalyzer.analyzeEthics(tasks, section1Result, section2Result);
  }

  private async generateImplementationRoadmap(tasks: ModelingTask[], algorithms: AlgorithmRecommendation[], progressCallback?: (progress: Section6Progress) => void): Promise<any> {
    // Simplified implementation
    return {
      phases: [],
      estimatedTimeline: '4-8 weeks',
      resourceRequirements: [],
      riskFactors: [],
      successCriteria: []
    };
  }

  // Utility methods
  private calculateTotalRecommendations(analysis: ModelingAnalysis): number {
    return analysis.identifiedTasks.length + 
           analysis.algorithmRecommendations.length + 
           (analysis.cartAnalysis ? 1 : 0) + 
           (analysis.residualAnalysis ? 1 : 0);
  }

  private calculateOverallConfidence(tasks: ModelingTask[]): ConfidenceLevel {
    if (tasks.length === 0) return 'low';
    
    const confidenceScores = tasks.map(task => {
      switch (task.confidenceLevel) {
        case 'very_high': return 4;
        case 'high': return 3;
        case 'medium': return 2;
        default: return 1;
      }
    });
    
    const avgScore = confidenceScores.reduce((a, b) => a + b, 0) / confidenceScores.length;
    
    if (avgScore >= 3.5) return 'very_high';
    if (avgScore >= 2.5) return 'high';
    if (avgScore >= 1.5) return 'medium';
    return 'low';
  }

  private collectLimitations(tasks: ModelingTask[], algorithms: AlgorithmRecommendation[]): string[] {
    const limitations = new Set<string>();
    
    tasks.forEach(task => {
      task.potentialChallenges.forEach(challenge => limitations.add(challenge));
    });
    
    algorithms.forEach(alg => {
      alg.weaknesses.forEach(weakness => limitations.add(weakness));
    });
    
    return Array.from(limitations);
  }

  private reportProgress(
    callback: ((progress: Section6Progress) => void) | undefined,
    stage: Section6Progress['stage'],
    percentage: number,
    message: string,
  ): void {
    if (callback) {
      callback({
        stage,
        percentage,
        message,
        currentStep: Math.floor(percentage / 12.5),
        totalSteps: 8,
        estimatedTimeRemaining: this.estimateTimeRemaining(percentage),
      });
    }
  }

  private estimateTimeRemaining(percentage: number): string {
    if (percentage >= 95) return 'Almost complete';
    if (percentage >= 75) return '< 1 minute';
    if (percentage >= 50) return '2-3 minutes';
    if (percentage >= 25) return '3-5 minutes';
    return '5-8 minutes';
  }
}
