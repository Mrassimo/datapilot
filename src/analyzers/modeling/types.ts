/**
 * Section 6: Predictive Modeling & Advanced Analytics Guidance
 * Type definitions for modeling recommendations and analysis
 */

import type { Section1Result } from '../overview/types';
import type { Section2Result } from '../quality/types';
import type { Section3Result } from '../eda/types';
import type { Section5Result } from '../engineering/types';

// Core modeling task types
export type ModelingTaskType =
  | 'regression'
  | 'binary_classification'
  | 'multiclass_classification'
  | 'clustering'
  | 'time_series_forecasting'
  | 'anomaly_detection'
  | 'survival_analysis'
  | 'dimensionality_reduction'
  | 'association_rule_mining'
  | 'density_estimation'
  | 'manifold_learning'
  | 'topic_modeling'
  | 'synthetic_target_generation';

export type AlgorithmCategory =
  | 'linear_models'
  | 'tree_based'
  | 'ensemble_methods'
  | 'neural_networks'
  | 'probabilistic_models'
  | 'instance_based'
  | 'unsupervised';

export type ModelComplexity = 'simple' | 'moderate' | 'complex' | 'advanced';
export type InterpretabilityLevel = 'high' | 'medium' | 'low' | 'black_box';
export type ConfidenceLevel = 'very_high' | 'high' | 'medium' | 'low';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

// Modeling task identification
export interface ModelingTask {
  taskType: ModelingTaskType;
  targetVariable?: string;
  targetType: 'continuous' | 'binary' | 'multiclass' | 'ordinal' | 'none';
  inputFeatures: string[];
  businessObjective: string;
  technicalObjective: string;
  justification: string[];
  dataRequirements: DataRequirement[];
  feasibilityScore: number; // 0-100
  confidenceLevel: ConfidenceLevel;
  estimatedComplexity: ModelComplexity;
  potentialChallenges: string[];
  successMetrics: string[];
}

export interface DataRequirement {
  requirement: string;
  currentStatus: 'met' | 'partially_met' | 'not_met';
  importance: 'critical' | 'important' | 'optional';
  mitigation?: string;
}

// Algorithm recommendations
export interface AlgorithmRecommendation {
  algorithmName: string;
  category: AlgorithmCategory;
  suitabilityScore: number; // 0-100
  complexity: ModelComplexity;
  interpretability: InterpretabilityLevel;
  strengths: string[];
  weaknesses: string[];
  dataRequirements: string[];
  hyperparameters: HyperparameterGuide[];
  implementationFrameworks: string[];
  evaluationMetrics: string[];
  reasoningNotes: string[];
}

export interface HyperparameterGuide {
  parameterName: string;
  description: string;
  defaultValue: any;
  recommendedRange: string;
  tuningStrategy: string;
  importance: 'critical' | 'important' | 'optional';
}

// CART-specific types (user interest)
export interface CARTAnalysis {
  methodology: string;
  splittingCriterion: 'gini' | 'entropy' | 'variance_reduction';
  stoppingCriteria: StoppingCriterion[];
  pruningStrategy: PruningStrategy;
  treeInterpretation: TreeInterpretation;
  residualAnalysis?: ResidualAnalysis; // For regression trees
  featureImportance: FeatureImportance[];
  visualizationRecommendations: string[];
}

export interface StoppingCriterion {
  criterion: string;
  recommendedValue: any;
  reasoning: string;
}

export interface PruningStrategy {
  method: 'cost_complexity' | 'reduced_error' | 'minimum_error';
  crossValidationFolds: number;
  complexityParameter: number;
  reasoning: string;
}

export interface TreeInterpretation {
  treeDepth: number;
  numberOfLeaves: number;
  keyDecisionPaths: DecisionPath[];
  businessRules: string[];
  visualizationGuidance: string;
}

export interface DecisionPath {
  pathDescription: string;
  conditions: string[];
  prediction: any;
  supportingInstances: number;
  businessMeaning: string;
}

// Regression residual analysis (user interest)
export interface ResidualAnalysis {
  residualDiagnostics: ResidualDiagnostic[];
  normalityTests: NormalityTest[];
  heteroscedasticityTests: HeteroscedasticityTest[];
  autocorrelationTests: AutocorrelationTest[];
  outlierAnalysis: OutlierAnalysis;
  modelAssumptions: ModelAssumption[];
  improvementSuggestions: string[];
}

export interface ResidualDiagnostic {
  plotType: 'residuals_vs_fitted' | 'qq_plot' | 'histogram' | 'scale_location';
  description: string;
  idealPattern: string;
  observedPattern: string;
  interpretation: string;
  actionRequired: boolean;
  recommendations: string[];
}

export interface NormalityTest {
  testName: 'shapiro_wilk' | 'jarque_bera' | 'kolmogorov_smirnov';
  statistic: number;
  pValue: number;
  interpretation: string;
  conclusion: string;
}

export interface HeteroscedasticityTest {
  testName: 'breusch_pagan' | 'white_test' | 'goldfeld_quandt';
  statistic: number;
  pValue: number;
  interpretation: string;
  conclusion: string;
}

export interface AutocorrelationTest {
  testName: 'durbin_watson' | 'ljung_box';
  statistic: number;
  pValue?: number;
  interpretation: string;
  conclusion: string;
}

export interface OutlierAnalysis {
  outlierIndices: number[];
  outlierTypes: OutlierType[];
  influentialPoints: InfluentialPoint[];
  recommendations: string[];
}

export interface OutlierType {
  index: number;
  type: 'leverage' | 'residual' | 'influential';
  severity: 'mild' | 'moderate' | 'severe';
  description: string;
}

export interface InfluentialPoint {
  index: number;
  cooksDistance: number;
  leverage: number;
  studentizedResidual: number;
  impact: string;
}

export interface ModelAssumption {
  assumption: string;
  status: 'satisfied' | 'violated' | 'questionable';
  evidence: string;
  impact: string;
  remediation: string[];
}

// Workflow and methodology
export interface ModelingWorkflow {
  workflowSteps: WorkflowStep[];
  bestPractices: BestPractice[];
  dataSplittingStrategy: DataSplittingStrategy;
  crossValidationApproach: CrossValidationApproach;
  hyperparameterTuning: HyperparameterTuningStrategy;
  evaluationFramework: EvaluationFramework;
  interpretationGuidance: InterpretationGuidance;
}

export interface WorkflowStep {
  stepNumber: number;
  stepName: string;
  description: string;
  inputs: string[];
  outputs: string[];
  estimatedTime: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tools: string[];
  considerations: string[];
  commonPitfalls: string[];
}

export interface BestPractice {
  category: string;
  practice: string;
  reasoning: string;
  implementation: string;
  relatedSteps: number[];
}

export interface DataSplittingStrategy {
  strategy: 'random' | 'stratified' | 'temporal' | 'group_based';
  trainPercent: number;
  validationPercent: number;
  testPercent: number;
  reasoning: string;
  implementation: string;
  considerations: string[];
}

export interface CrossValidationApproach {
  method: 'k_fold' | 'stratified_k_fold' | 'time_series_split' | 'leave_one_out';
  folds: number;
  reasoning: string;
  implementation: string;
  expectedBenefit: string;
}

export interface HyperparameterTuningStrategy {
  method: 'grid_search' | 'random_search' | 'bayesian_optimization' | 'genetic_algorithm';
  searchSpace: SearchSpace[];
  optimizationMetric: string;
  budgetConstraints: BudgetConstraint[];
  earlyStoppingCriteria?: string;
}

export interface SearchSpace {
  parameterName: string;
  parameterType: 'continuous' | 'discrete' | 'categorical';
  searchRange: any;
  searchDistribution?: string;
  priority: 'high' | 'medium' | 'low';
}

export interface BudgetConstraint {
  constraintType: 'time' | 'computational' | 'cost';
  limit: string;
  reasoning: string;
}

// Evaluation framework
export interface EvaluationFramework {
  primaryMetrics: EvaluationMetric[];
  secondaryMetrics: EvaluationMetric[];
  interpretationGuidelines: MetricInterpretation[];
  benchmarkComparisons: BenchmarkComparison[];
  businessImpactAssessment: BusinessImpactMetric[];
  robustnessTests: RobustnessTest[];
}

export interface EvaluationMetric {
  metricName: string;
  metricType: 'accuracy' | 'precision' | 'recall' | 'f1' | 'auc' | 'rmse' | 'mae' | 'r2';
  description: string;
  interpretation: string;
  idealValue: number | string;
  acceptableRange: string;
  calculationMethod: string;
  useCases: string[];
  limitations: string[];
}

export interface MetricInterpretation {
  metricName: string;
  valueRanges: ValueRange[];
  contextualFactors: string[];
  comparisonGuidelines: string[];
}

export interface ValueRange {
  range: string;
  interpretation: string;
  actionRecommendation: string;
}

export interface BenchmarkComparison {
  benchmarkType: 'baseline' | 'naive' | 'domain_standard' | 'state_of_art';
  description: string;
  expectedPerformance: string;
  comparisonMethod: string;
}

export interface BusinessImpactMetric {
  metricName: string;
  businessValue: string;
  measurementMethod: string;
  timeframe: string;
  dependencies: string[];
}

export interface RobustnessTest {
  testName: string;
  testType: 'data_drift' | 'adversarial' | 'cross_validation' | 'sensitivity';
  description: string;
  implementation: string;
  passingCriteria: string;
}

// Interpretation and explainability
export interface InterpretationGuidance {
  globalInterpretation: GlobalInterpretation;
  localInterpretation: LocalInterpretation;
  featureImportance: FeatureImportanceAnalysis;
  modelBehaviorAnalysis: ModelBehaviorAnalysis;
  visualizationStrategies: VisualizationStrategy[];
}

export interface GlobalInterpretation {
  methods: string[];
  overallModelBehavior: string;
  keyPatterns: string[];
  featureRelationships: string[];
  modelLimitations: string[];
}

export interface LocalInterpretation {
  methods: string[];
  exampleExplanations: ExampleExplanation[];
  explanationReliability: string;
  useCases: string[];
}

export interface ExampleExplanation {
  instanceId: string;
  prediction: any;
  featureContributions: FeatureContribution[];
  confidence: number;
  explanation: string;
}

export interface FeatureContribution {
  featureName: string;
  contribution: number;
  direction: 'positive' | 'negative';
  importance: number;
  explanation: string;
}

export interface FeatureImportanceAnalysis {
  importanceMethod: 'permutation' | 'gini' | 'information_gain' | 'shap';
  featureRankings: FeatureImportance[];
  stabilityAnalysis: string;
  businessRelevance: string[];
}

export interface FeatureImportance {
  featureName: string;
  importance: number;
  rank: number;
  confidenceInterval?: [number, number];
  businessMeaning: string;
}

export interface ModelBehaviorAnalysis {
  decisionBoundaries: string;
  nonlinearEffects: string[];
  interactionEffects: InteractionEffect[];
  predictionConfidence: string;
}

export interface InteractionEffect {
  features: [string, string];
  effectType: 'synergistic' | 'antagonistic' | 'conditional';
  magnitude: number;
  description: string;
  businessImplication: string;
}

export interface VisualizationStrategy {
  visualizationType: string;
  purpose: string;
  implementation: string;
  interpretationGuide: string;
  toolSuggestions: string[];
}

// Ethics and bias detection
export interface EthicsAnalysis {
  biasAssessment: BiasAssessment;
  fairnessMetrics: FairnessMetric[];
  ethicalConsiderations: EthicalConsideration[];
  transparencyRequirements: TransparencyRequirement[];
  governanceRecommendations: GovernanceRecommendation[];
  riskMitigation: RiskMitigation[];
}

export interface BiasAssessment {
  potentialBiasSources: BiasSource[];
  sensitiveAttributes: SensitiveAttribute[];
  biasTests: BiasTest[];
  overallRiskLevel: RiskLevel;
  mitigationStrategies: string[];
}

export interface BiasSource {
  sourceType: 'historical' | 'selection' | 'measurement' | 'algorithmic';
  description: string;
  riskLevel: RiskLevel;
  evidence: string[];
  mitigation: string[];
}

export interface SensitiveAttribute {
  attributeName: string;
  attributeType: 'protected_class' | 'proxy_variable' | 'derived';
  availableInData: boolean;
  riskAssessment: string;
  handlingRecommendation: string;
}

export interface BiasTest {
  testName: string;
  testType: 'statistical_parity' | 'equalized_odds' | 'demographic_parity';
  result: number;
  interpretation: string;
  passingThreshold: number;
  recommendations: string[];
}

export interface FairnessMetric {
  metricName: string;
  value: number;
  interpretation: string;
  acceptableRange: string;
  improvementSuggestions: string[];
}

export interface EthicalConsideration {
  consideration: string;
  domain: 'privacy' | 'consent' | 'transparency' | 'accountability' | 'fairness';
  riskLevel: RiskLevel;
  requirements: string[];
  implementation: string[];
}

export interface TransparencyRequirement {
  requirement: string;
  level: 'model_level' | 'prediction_level' | 'system_level';
  implementation: string;
  audience: string[];
  complianceNeed: boolean;
}

export interface GovernanceRecommendation {
  area: string;
  recommendation: string;
  priority: 'immediate' | 'short_term' | 'long_term';
  implementation: string;
  stakeholders: string[];
}

export interface RiskMitigation {
  riskType: string;
  mitigationStrategy: string;
  implementation: string;
  monitoring: string;
  effectiveness: string;
}

// Configuration and progress tracking
export interface Section6Config {
  focusAreas: ModelingTaskType[];
  complexityPreference: ModelComplexity;
  interpretabilityRequirement: InterpretabilityLevel;
  ethicsLevel: 'basic' | 'standard' | 'comprehensive';
  includeAdvancedMethods: boolean;
  customDomainRules?: string[];
  performanceThresholds: Record<string, number>;
  businessContext?: string;
  enableClusteringRecommendations?: boolean;
  enableCARTAnalysis?: boolean;
  maxRecordsForAnalysis?: number;
}

export interface Section6Progress {
  stage:
    | 'initialization'
    | 'task_identification'
    | 'algorithm_selection'
    | 'workflow_design'
    | 'evaluation_framework'
    | 'ethics_analysis'
    | 'interpretation_guide'
    | 'finalization';
  percentage: number;
  message: string;
  currentStep: number;
  totalSteps: number;
  estimatedTimeRemaining?: string;
}

export interface Section6Warning {
  category: 'data_quality' | 'modeling' | 'ethics' | 'interpretation' | 'implementation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  impact: string;
  suggestion: string;
  affectedComponents: string[];
}

// Main result interface
export interface Section6Result {
  modelingAnalysis: ModelingAnalysis;
  warnings: Section6Warning[];
  performanceMetrics: Section6PerformanceMetrics;
  metadata: Section6Metadata;
}

export interface ModelingAnalysis {
  identifiedTasks: ModelingTask[];
  algorithmRecommendations: AlgorithmRecommendation[];
  cartAnalysis?: CARTAnalysis;
  residualAnalysis?: ResidualAnalysis;
  workflowGuidance: ModelingWorkflow;
  evaluationFramework: EvaluationFramework;
  interpretationGuidance: InterpretationGuidance;
  ethicsAnalysis: EthicsAnalysis;
  implementationRoadmap: ImplementationRoadmap;
  unsupervisedAnalysis?: UnsupervisedAnalysisResult;
}

export interface ImplementationRoadmap {
  phases: ImplementationPhase[];
  estimatedTimeline: string;
  resourceRequirements: ResourceRequirement[];
  riskFactors: string[];
  successCriteria: string[];
}

export interface ImplementationPhase {
  phaseNumber: number;
  phaseName: string;
  duration: string;
  deliverables: string[];
  dependencies: string[];
  riskLevel: RiskLevel;
}

export interface ResourceRequirement {
  resourceType: 'computational' | 'human' | 'data' | 'infrastructure';
  requirement: string;
  criticality: 'essential' | 'important' | 'optional';
  alternatives: string[];
}

export interface Section6PerformanceMetrics {
  analysisTimeMs: number;
  tasksIdentified: number;
  algorithmsEvaluated: number;
  ethicsChecksPerformed: number;
  recommendationsGenerated: number;
  recordsAnalyzed?: number;
}

export interface Section6Metadata {
  analysisApproach: string;
  complexityLevel: ModelComplexity;
  recommendationConfidence: ConfidenceLevel;
  primaryFocus: string[];
  limitationsIdentified: string[];
}

// =====================================
// Enhanced Unsupervised Learning Types
// =====================================

export interface SyntheticTargetRecommendation {
  targetName: string;
  targetType: 'clustering_based' | 'outlier_based' | 'composite' | 'temporal' | 'domain_derived';
  description: string;
  businessValue: string;
  technicalImplementation: string;
  sourceColumns: string[];
  expectedCardinality?: number;
  feasibilityScore: number; // 0-100
  codeExample: string;
  validationStrategy: string;
  useCases: string[];
}

export interface UnsupervisedLearningRecommendation {
  approach: 'clustering' | 'dimensionality_reduction' | 'association_mining' | 'anomaly_detection' | 'density_estimation';
  algorithmName: string;
  description: string;
  businessValue: string;
  technicalDetails: UnsupervisedTechnicalDetails;
  codeImplementation: CodeImplementation;
  evaluationMetrics: string[];
  interpretationGuidance: string[];
  scalabilityNotes: string[];
}

export interface UnsupervisedTechnicalDetails {
  inputFeatures: string[];
  preprocessing: string[];
  hyperparameters: HyperparameterGuide[];
  computationalComplexity: string;
  memoryRequirements: string;
  optimalDataSize: string;
}

export interface CodeImplementation {
  framework: 'scikit-learn' | 'pandas' | 'numpy' | 'tensorflow' | 'pytorch';
  importStatements: string[];
  preprocessingCode: string[];
  mainImplementation: string[];
  evaluationCode: string[];
  visualizationCode?: string[];
}

export interface AutoMLRecommendation {
  platform: 'H2O_AutoML' | 'AutoGluon' | 'MLflow' | 'DataRobot' | 'Google_AutoML' | 'Azure_AutoML';
  suitabilityScore: number; // 0-100
  strengths: string[];
  limitations: string[];
  dataRequirements: string[];
  estimatedCost: string;
  setupComplexity: ModelComplexity;
  codeExample: string;
  configurationRecommendations: Record<string, any>;
}

export interface FeatureEngineeringRecipe {
  recipeName: string;
  description: string;
  applicableColumns: string[];
  businessRationale: string;
  codeImplementation: string[];
  expectedImpact: string;
  prerequisites: string[];
  riskFactors: string[];
}

export interface UnsupervisedAnalysisResult {
  syntheticTargets: SyntheticTargetRecommendation[];
  unsupervisedApproaches: UnsupervisedLearningRecommendation[];
  autoMLRecommendations: AutoMLRecommendation[];
  featureEngineeringRecipes: FeatureEngineeringRecipe[];
  deploymentConsiderations: DeploymentConsideration[];
}

export interface DeploymentConsideration {
  aspect: 'data_pipeline' | 'monitoring' | 'api_schema' | 'infrastructure' | 'maintenance';
  requirements: string[];
  recommendations: string[];
  riskFactors: string[];
  codeTemplates?: string[];
}
