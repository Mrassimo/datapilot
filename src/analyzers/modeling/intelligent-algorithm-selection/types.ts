/**
 * Intelligent Algorithm Selection Engine - Type Definitions
 * Advanced algorithm selection based on dataset characteristics and business requirements
 */

import type { DatasetComplexityProfile } from '../advanced-characterization/types';
import type { ModelingTask } from '../types';

// Core algorithm selection types
export interface AlgorithmSelectionProfile {
  selectedAlgorithms: EnhancedAlgorithmRecommendation[];
  selectionReasoning: AlgorithmSelectionReasoning;
  performancePredictions: PerformancePrediction[];
  riskAssessment: AlgorithmRiskAssessment;
  ensembleRecommendations: EnsembleRecommendation[];
  hyperparameterGuidance: HyperparameterOptimizationGuidance;
  implementationStrategy: ImplementationStrategy;
  selectionMetadata: SelectionMetadata;
}

export interface EnhancedAlgorithmRecommendation {
  algorithmName: string;
  algorithmFamily: AlgorithmFamily;
  category: AdvancedAlgorithmCategory;
  suitabilityScore: number; // 0-100, multi-criteria weighted score
  complexity: ModelComplexity;
  interpretability: InterpretabilityLevel;

  // Advanced scoring breakdown
  scoringBreakdown: ScoringBreakdown;

  // Dataset-specific fit
  datasetFitAnalysis: DatasetFitAnalysis;

  // Performance characteristics
  expectedPerformance: PerformanceEstimate;
  computationalRequirements: ComputationalRequirements;

  // Implementation details
  implementationDetails: ImplementationDetails;

  // Risk and limitations
  riskFactors: RiskFactor[];
  limitations: AlgorithmLimitation[];
  mitigationStrategies: MitigationStrategy[];

  // Business alignment
  businessAlignment: BusinessAlignment;

  // Advanced features
  advancedFeatures: AdvancedFeature[];
  customizationOptions: CustomizationOption[];
}

export type AlgorithmFamily =
  | 'linear_models'
  | 'tree_based'
  | 'ensemble_methods'
  | 'neural_networks'
  | 'probabilistic_models'
  | 'instance_based'
  | 'manifold_learning'
  | 'kernel_methods'
  | 'meta_learning'
  | 'automated_ml';

export type AdvancedAlgorithmCategory =
  | 'classical_ml'
  | 'modern_ml'
  | 'deep_learning'
  | 'ensemble_learning'
  | 'probabilistic_ml'
  | 'geometric_ml'
  | 'evolutionary_ml'
  | 'quantum_ml'
  | 'automated_ml'
  | 'specialized';

export type ModelComplexity = 'simple' | 'moderate' | 'complex' | 'advanced' | 'research_level';
export type InterpretabilityLevel =
  | 'very_high'
  | 'high'
  | 'medium'
  | 'low'
  | 'very_low'
  | 'black_box';

// Multi-criteria scoring system
export interface ScoringBreakdown {
  dataFitScore: number; // How well algorithm fits dataset characteristics
  performanceScore: number; // Expected performance based on similar datasets
  interpretabilityScore: number; // Alignment with interpretability requirements
  implementationScore: number; // Ease of implementation and deployment
  robustnessScore: number; // Robustness to data quality issues
  scalabilityScore: number; // Ability to scale with data size
  maintenanceScore: number; // Long-term maintenance considerations

  // Weighted composite scores
  technicalScore: number; // Technical suitability
  businessScore: number; // Business alignment
  overallScore: number; // Final weighted score

  // Scoring methodology
  weightingStrategy: WeightingStrategy;
  confidenceInterval: [number, number];
}

export interface WeightingStrategy {
  weights: ScoringWeights;
  justification: string;
  adaptiveWeighting: boolean; // Whether weights adapt to dataset characteristics
  uncertaintyHandling: UncertaintyHandling;
}

export interface ScoringWeights {
  dataFit: number;
  performance: number;
  interpretability: number;
  implementation: number;
  robustness: number;
  scalability: number;
  maintenance: number;
}

export interface UncertaintyHandling {
  method: 'conservative' | 'aggressive' | 'balanced' | 'adaptive';
  uncertaintyPenalty: number; // Penalty for high uncertainty
  confidenceThreshold: number; // Minimum confidence for recommendations
}

// Dataset fit analysis
export interface DatasetFitAnalysis {
  complexityAlignment: ComplexityAlignment;
  featureCompatibility: FeatureCompatibility;
  sizeSuitability: SizeSuitability;
  distributionCompatibility: DistributionCompatibility;
  noiseRobustness: NoiseRobustness;
  sparsityHandling: SparsityHandling;
  temporalCompatibility?: TemporalCompatibility;
}

export interface ComplexityAlignment {
  intrinsicComplexityFit: number; // 0-1, how well algorithm handles dataset complexity
  nonLinearityHandling: number; // 0-1, ability to capture non-linear patterns
  interactionCapturing: number; // 0-1, ability to capture feature interactions
  manifoldLearning: number; // 0-1, ability to work with manifold structure
  overallAlignment: number; // 0-1, composite complexity alignment
}

export interface FeatureCompatibility {
  numericFeatureHandling: FeatureHandlingCapability;
  categoricalFeatureHandling: FeatureHandlingCapability;
  textFeatureHandling: FeatureHandlingCapability;
  temporalFeatureHandling: FeatureHandlingCapability;
  mixedTypeHandling: FeatureHandlingCapability;
  highDimensionalitySupport: FeatureHandlingCapability;
}

export interface FeatureHandlingCapability {
  nativeSupport: boolean;
  preprocessingRequired: boolean;
  performanceImpact: 'none' | 'minimal' | 'moderate' | 'significant';
  implementationComplexity: 'simple' | 'moderate' | 'complex';
  recommendations: string[];
}

export interface SizeSuitability {
  optimalSampleSize: SampleSizeRange;
  currentDatasetFit: DatasetSizeFit;
  scalabilityCharacteristics: ScalabilityCharacteristics;
  memoryEfficiency: MemoryEfficiency;
  computationalScaling: ComputationalScaling;
}

export interface SampleSizeRange {
  minimum: number;
  recommended: number;
  optimal: number;
  maximum?: number;
}

export interface DatasetSizeFit {
  fit: 'undersized' | 'adequate' | 'optimal' | 'oversized';
  confidenceImpact: number; // How dataset size affects performance confidence
  recommendations: string[];
}

export interface ScalabilityCharacteristics {
  horizontalScalability: ScalabilityLevel; // More samples
  verticalScalability: ScalabilityLevel; // More features
  distributedSupport: boolean;
  streamingCapability: boolean;
  incrementalLearning: boolean;
}

export type ScalabilityLevel = 'poor' | 'fair' | 'good' | 'excellent';

export interface MemoryEfficiency {
  memoryComplexity: 'O(1)' | 'O(n)' | 'O(n²)' | 'O(n³)' | 'exponential';
  inMemoryRequirement: boolean;
  diskBasedSupport: boolean;
  streamingSupport: boolean;
  memoryOptimizations: string[];
}

export interface ComputationalScaling {
  trainingComplexity: ComplexityClass;
  predictionComplexity: ComplexityClass;
  parallelizability: ParallelizationCapability;
  hardwareOptimizations: HardwareOptimization[];
}

export type ComplexityClass =
  | 'O(1)'
  | 'O(log n)'
  | 'O(n)'
  | 'O(n log n)'
  | 'O(n²)'
  | 'O(n³)'
  | 'exponential';

export interface ParallelizationCapability {
  trainingParallelization: boolean;
  predictionParallelization: boolean;
  gpuSupport: boolean;
  tpuSupport: boolean;
  distributedTraining: boolean;
}

export interface HardwareOptimization {
  type: 'cpu' | 'gpu' | 'tpu' | 'fpga' | 'quantum';
  supportLevel: 'native' | 'library' | 'experimental' | 'none';
  performanceGain: number; // Expected speedup factor
  requirements: string[];
}

export interface DistributionCompatibility {
  gaussianAssumptions: boolean;
  robustToOutliers: boolean;
  skewnessHandling: SkewnessHandling;
  multimodalSupport: boolean;
  distributionFreeApproach: boolean;
}

export interface SkewnessHandling {
  leftSkewTolerance: number; // 0-1
  rightSkewTolerance: number; // 0-1
  transformationRecommendations: string[];
  nativeSkewHandling: boolean;
}

export interface NoiseRobustness {
  noiseResistance: number; // 0-1, general noise resistance
  outlierRobustness: number; // 0-1, resistance to outliers
  labelNoiseHandling: number; // 0-1, handling of label noise
  featureNoiseHandling: number; // 0-1, handling of feature noise
  robustnessMechanisms: RobustnessMechanism[];
}

export interface RobustnessMechanism {
  mechanism: string;
  effectiveness: number; // 0-1
  tradeoffs: string[];
  configurationRequired: boolean;
}

export interface SparsityHandling {
  sparseSupport: boolean;
  sparseOptimizations: boolean;
  sparsityThreshold: number; // Threshold where algorithm becomes inefficient
  densificationRequired: boolean;
  sparsityStrategies: SparsityStrategy[];
}

export interface SparsityStrategy {
  strategy:
    | 'imputation'
    | 'sparse_algorithms'
    | 'feature_selection'
    | 'regularization'
    | 'embedding';
  applicability: number; // 0-1
  performanceImpact: number; // 0-1, negative values indicate improvement
  implementationComplexity: 'simple' | 'moderate' | 'complex';
}

export interface TemporalCompatibility {
  timeSeriesSupport: boolean;
  temporalPatternCapture: TemporalPatternCapture;
  forecastingCapability: ForecastingCapability;
  conceptDriftHandling: ConceptDriftHandling;
}

export interface TemporalPatternCapture {
  trendCapture: boolean;
  seasonalityCapture: boolean;
  cyclicalPatternCapture: boolean;
  longTermDependencies: boolean;
  shortTermDependencies: boolean;
}

export interface ForecastingCapability {
  univariateForecast: boolean;
  multivariateForecast: boolean;
  shortTermAccuracy: number; // 0-1
  longTermAccuracy: number; // 0-1
  uncertaintyQuantification: boolean;
}

export interface ConceptDriftHandling {
  driftDetection: boolean;
  driftAdaptation: boolean;
  adaptationSpeed: 'fast' | 'moderate' | 'slow';
  forgettingMechanism: boolean;
}

// Performance prediction
export interface PerformancePrediction {
  algorithmName: string;
  expectedMetrics: ExpectedMetrics;
  confidenceIntervals: ConfidenceIntervals;
  performanceFactors: PerformanceFactor[];
  scenarioAnalysis: ScenarioAnalysis;
  benchmarkComparison: BenchmarkComparison;
}

export interface ExpectedMetrics {
  primaryMetric: MetricPrediction;
  secondaryMetrics: MetricPrediction[];
  businessMetrics: BusinessMetricPrediction[];
  robustnessMetrics: RobustnessMetricPrediction[];
}

export interface MetricPrediction {
  metricName: string;
  expectedValue: number;
  confidenceInterval: [number, number];
  predictionMethod: PredictionMethod;
  reliability: number; // 0-1
}

export interface PerformanceEstimate {
  accuracy?: number;
  precision?: number;
  recall?: number;
  f1Score?: number;
  rmse?: number;
  mae?: number;
  rSquared?: number;
  confidenceInterval: [number, number];
  performanceFactors: string[];
}

export type PredictionMethod =
  | 'meta_learning'
  | 'similar_datasets'
  | 'theoretical_bounds'
  | 'expert_knowledge'
  | 'hybrid_approach';

export interface BusinessMetricPrediction {
  metricName: string;
  expectedImpact: number;
  impactType: 'revenue' | 'cost_savings' | 'efficiency' | 'risk_reduction' | 'satisfaction';
  confidenceLevel: number; // 0-1
  assumptions: string[];
}

export interface RobustnessMetricPrediction {
  metricName: string;
  robustnessScore: number; // 0-1
  vulnerabilities: string[];
  mitigations: string[];
}

export interface ConfidenceIntervals {
  methodology: 'bootstrap' | 'bayesian' | 'frequentist' | 'ensemble';
  confidenceLevel: number; // e.g., 0.95 for 95%
  intervalWidth: number;
  asymmetry: number; // 0 = symmetric, >0 = right-skewed
}

export interface PerformanceFactor {
  factor: string;
  impact: number; // -1 to 1, effect on performance
  importance: number; // 0-1, importance of this factor
  controllability: number; // 0-1, how much control we have over this factor
  mitigation: string[];
}

export interface ScenarioAnalysis {
  bestCase: ScenarioOutcome;
  expectedCase: ScenarioOutcome;
  worstCase: ScenarioOutcome;
  sensitivityAnalysis: SensitivityFactor[];
}

export interface ScenarioOutcome {
  scenario: string;
  probability: number;
  expectedPerformance: number;
  keyFactors: string[];
  implications: string[];
}

export interface SensitivityFactor {
  factor: string;
  sensitivity: number; // How much performance changes per unit change in factor
  threshold: number; // Critical value where performance significantly changes
  recommendation: string;
}

export interface BenchmarkComparison {
  similarDatasets: SimilarDatasetBenchmark[];
  industryBenchmarks: IndustryBenchmark[];
  theoreticalLimits: TheoreticalLimit[];
  relativeRanking: RelativeRanking;
}

export interface SimilarDatasetBenchmark {
  datasetCharacteristics: DatasetCharacteristics;
  algorithmPerformance: AlgorithmPerformance[];
  similarity: number; // 0-1, similarity to current dataset
  transferability: number; // 0-1, how transferable the results are
}

export interface DatasetCharacteristics {
  size: number;
  features: number;
  complexity: number;
  domain: string;
  taskType: string;
}

export interface AlgorithmPerformance {
  algorithmName: string;
  performance: number;
  trainingTime: number;
  implementation: string;
  notes: string[];
}

export interface IndustryBenchmark {
  industry: string;
  problemType: string;
  typicalPerformance: PerformanceRange;
  bestPractices: string[];
  commonPitfalls: string[];
}

export interface PerformanceRange {
  minimum: number;
  average: number;
  maximum: number;
  percentiles: PerformileDistribution;
}

export interface PerformileDistribution {
  p25: number;
  p50: number;
  p75: number;
  p90: number;
  p95: number;
}

export interface TheoreticalLimit {
  limitType: 'bayes_optimal' | 'information_theoretic' | 'computational' | 'statistical';
  limitValue: number;
  assumptions: string[];
  achievability: number; // 0-1, how achievable this limit is in practice
}

export interface RelativeRanking {
  algorithmRankings: AlgorithmRanking[];
  rankingCriteria: RankingCriterion[];
  rankingConfidence: number; // 0-1
  rankingStability: number; // 0-1, how stable rankings are to small changes
}

export interface AlgorithmRanking {
  algorithmName: string;
  rank: number;
  score: number;
  strengths: string[];
  weaknesses: string[];
}

export interface RankingCriterion {
  criterion: string;
  weight: number;
  justification: string;
}

// Algorithm selection reasoning
export interface AlgorithmSelectionReasoning {
  selectionCriteria: SelectionCriterion[];
  decisionTree: DecisionTreeNode;
  alternativeConsiderations: AlternativeConsideration[];
  selectionConfidence: SelectionConfidence;
  assumptions: SelectionAssumption[];
  sensitivityAnalysis: SelectionSensitivityAnalysis;
}

export interface SelectionCriterion {
  criterion: string;
  weight: number;
  satisfaction: number; // 0-1, how well selected algorithms satisfy this criterion
  criticality: 'must_have' | 'important' | 'nice_to_have';
  tradeoffs: string[];
}

export interface DecisionTreeNode {
  decision: string;
  reasoning: string;
  alternatives: AlternativeOption[];
  children?: DecisionTreeNode[];
  confidence: number; // 0-1
}

export interface AlternativeOption {
  option: string;
  pros: string[];
  cons: string[];
  score: number;
  selected: boolean;
}

export interface AlternativeConsideration {
  algorithmName: string;
  reasonForExclusion: string;
  alternativeScore: number;
  reconsiderationTriggers: string[];
}

export interface SelectionConfidence {
  overallConfidence: number; // 0-1
  confidenceFactors: ConfidenceFactor[];
  uncertaintySource: string[];
  robustnessToAssumptions: number; // 0-1
}

export interface ConfidenceFactor {
  factor: string;
  contribution: number; // -1 to 1, effect on confidence
  importance: number; // 0-1
  mitigation: string[];
}

export interface SelectionAssumption {
  assumption: string;
  validity: number; // 0-1, how valid we think this assumption is
  impact: number; // 0-1, impact if assumption is violated
  verification: string[];
}

export interface SelectionSensitivityAnalysis {
  parameterSensitivity: ParameterSensitivity[];
  assumptionSensitivity: AssumptionSensitivity[];
  dataCharacteristicSensitivity: DataCharacteristicSensitivity[];
}

export interface ParameterSensitivity {
  parameter: string;
  sensitivity: number; // How much selection changes with parameter changes
  criticalRange: [number, number];
  recommendations: string[];
}

export interface AssumptionSensitivity {
  assumption: string;
  violationImpact: number; // 0-1, impact if assumption is violated
  detectionMethods: string[];
  contingencyPlans: string[];
}

export interface DataCharacteristicSensitivity {
  characteristic: string;
  sensitivityLevel: number; // 0-1
  thresholds: DataThreshold[];
  adaptationStrategies: string[];
}

export interface DataThreshold {
  threshold: number;
  implication: string;
  recommendedAction: string;
}

// Risk assessment
export interface AlgorithmRiskAssessment {
  overallRiskLevel: RiskLevel;
  riskCategories: RiskCategory[];
  mitigationPlan: MitigationPlan;
  contingencyStrategies: ContingencyStrategy[];
  monitoringPlan: RiskMonitoringPlan;
}

export type RiskLevel = 'very_low' | 'low' | 'medium' | 'high' | 'very_high';

export interface RiskCategory {
  category: RiskCategoryType;
  riskLevel: RiskLevel;
  riskFactors: RiskFactor[];
  likelihood: number; // 0-1
  impact: number; // 0-1
  detectability: number; // 0-1
}

export type RiskCategoryType =
  | 'performance_risk'
  | 'implementation_risk'
  | 'maintenance_risk'
  | 'scalability_risk'
  | 'interpretability_risk'
  | 'business_risk'
  | 'technical_debt_risk'
  | 'compliance_risk';

export interface RiskFactor {
  factor: string;
  severity: RiskLevel;
  probability: number; // 0-1
  timeframe: 'immediate' | 'short_term' | 'medium_term' | 'long_term';
  dependencies: string[];
  indicators: string[];
}

export interface MitigationPlan {
  primaryMitigations: MitigationStrategy[];
  secondaryMitigations: MitigationStrategy[];
  preventiveMeasures: PreventiveMeasure[];
  contingencyPlans: ContingencyPlan[];
}

export interface MitigationStrategy {
  strategy: string;
  applicability: string[];
  effectiveness: number; // 0-1
  implementationCost: 'low' | 'medium' | 'high';
  timeToImplement: number; // days
  dependencies: string[];
}

export interface PreventiveMeasure {
  measure: string;
  targetRisks: string[];
  implementation: string;
  cost: 'low' | 'medium' | 'high';
  effectiveness: number; // 0-1
}

export interface ContingencyPlan {
  trigger: string;
  actions: ContingencyAction[];
  fallbackOptions: FallbackOption[];
  decisionCriteria: string[];
}

export interface ContingencyAction {
  action: string;
  priority: number;
  timeframe: string;
  resources: string[];
  successCriteria: string[];
}

export interface FallbackOption {
  option: string;
  performanceImpact: number; // -1 to 1
  implementationEffort: 'low' | 'medium' | 'high';
  viability: number; // 0-1
}

export interface ContingencyStrategy {
  scenario: string;
  strategy: string;
  triggers: string[];
  implementation: string[];
  rollbackPlan: string[];
}

export interface RiskMonitoringPlan {
  monitoringMetrics: MonitoringMetric[];
  alertThresholds: AlertThreshold[];
  reviewSchedule: ReviewSchedule;
  escalationProcedures: EscalationProcedure[];
}

export interface MonitoringMetric {
  metric: string;
  purpose: string;
  frequency: 'real_time' | 'hourly' | 'daily' | 'weekly' | 'monthly';
  threshold: number;
  action: string;
}

export interface AlertThreshold {
  metric: string;
  warningThreshold: number;
  criticalThreshold: number;
  responseTime: number; // minutes
  responsibleParty: string;
}

export interface ReviewSchedule {
  frequency: 'weekly' | 'monthly' | 'quarterly' | 'annually';
  scope: string[];
  participants: string[];
  deliverables: string[];
}

export interface EscalationProcedure {
  level: number;
  trigger: string;
  timeframe: number; // minutes
  actions: string[];
  authority: string;
}

// Additional types for completeness
export interface ImplementationDetails {
  frameworks: FrameworkSupport[];
  libraries: LibraryRecommendation[];
  dependencies: DependencyRequirement[];
  configuration: ConfigurationGuidance;
  deployment: DeploymentConsiderations;
}

export interface FrameworkSupport {
  framework: string;
  supportLevel: 'native' | 'plugin' | 'community' | 'custom';
  maturity: 'experimental' | 'beta' | 'stable' | 'mature';
  documentation: 'poor' | 'fair' | 'good' | 'excellent';
  communitySize: 'small' | 'medium' | 'large';
}

export interface LibraryRecommendation {
  library: string;
  version: string;
  purpose: string;
  alternatives: string[];
  pros: string[];
  cons: string[];
}

export interface DependencyRequirement {
  dependency: string;
  version: string;
  optional: boolean;
  purpose: string;
  installationComplexity: 'simple' | 'moderate' | 'complex';
}

export interface ConfigurationGuidance {
  requiredParameters: ConfigurationParameter[];
  optionalParameters: ConfigurationParameter[];
  tuningPriority: TuningPriority[];
  bestPractices: string[];
}

export interface ConfigurationParameter {
  parameter: string;
  type: 'number' | 'string' | 'boolean' | 'array' | 'object';
  defaultValue: any;
  range?: [number, number];
  options?: string[];
  description: string;
  impact: 'low' | 'medium' | 'high';
}

export interface TuningPriority {
  parameter: string;
  priority: number;
  tuningMethod: 'grid_search' | 'random_search' | 'bayesian' | 'manual';
  effort: 'low' | 'medium' | 'high';
  expectedGain: number; // 0-1
}

export interface DeploymentConsiderations {
  deploymentPatterns: DeploymentPattern[];
  infrastructureRequirements: InfrastructureRequirement[];
  scalingConsiderations: ScalingConsideration[];
  maintenanceRequirements: MaintenanceRequirement[];
}

export interface DeploymentPattern {
  pattern: 'batch' | 'real_time' | 'streaming' | 'edge' | 'hybrid';
  suitability: number; // 0-1
  considerations: string[];
  implementation: string[];
}

export interface InfrastructureRequirement {
  component: string;
  requirement: string;
  criticality: 'required' | 'recommended' | 'optional';
  alternatives: string[];
}

export interface ScalingConsideration {
  dimension: 'data_volume' | 'user_load' | 'feature_count' | 'model_complexity';
  scalingStrategy: string;
  limitations: string[];
  costImplications: string[];
}

export interface MaintenanceRequirement {
  task: string;
  frequency: string;
  effort: 'low' | 'medium' | 'high';
  automation: 'fully_automated' | 'semi_automated' | 'manual';
  skillsRequired: string[];
}

export interface ComputationalRequirements {
  trainingRequirements: ResourceRequirement;
  predictionRequirements: ResourceRequirement;
  storageRequirements: StorageRequirement;
  networkRequirements: NetworkRequirement;
}

export interface ResourceRequirement {
  cpu: CpuRequirement;
  memory: MemoryRequirement;
  gpu?: GpuRequirement;
  timeComplexity: string;
  parallelization: ParallelizationSupport;
}

export interface CpuRequirement {
  cores: number;
  architecture: string[];
  specialInstructions: string[];
  utilization: number; // 0-1
}

export interface MemoryRequirement {
  minimum: number; // MB
  recommended: number; // MB
  scaling: 'constant' | 'linear' | 'quadratic' | 'exponential';
  pattern: 'in_memory' | 'streaming' | 'disk_based';
}

export interface GpuRequirement {
  required: boolean;
  memory: number; // GB
  computeCapability: string;
  frameworks: string[];
  expectedSpeedup: number; // factor
}

export interface ParallelizationSupport {
  dataParallelism: boolean;
  modelParallelism: boolean;
  maxWorkers: number;
  efficiency: number; // 0-1
}

export interface StorageRequirement {
  modelSize: number; // MB
  temporaryStorage: number; // MB
  dataFormat: string[];
  compressionSupport: boolean;
}

export interface NetworkRequirement {
  bandwidth: number; // Mbps
  latency: number; // ms
  reliability: number; // 0-1
  distributedSupport: boolean;
}

export interface AlgorithmLimitation {
  limitation: string;
  severity: 'minor' | 'moderate' | 'major' | 'critical';
  affectedScenarios: string[];
  workarounds: string[];
  fundamentalLimitation: boolean;
}

export interface BusinessAlignment {
  businessObjectives: BusinessObjective[];
  stakeholderRequirements: StakeholderRequirement[];
  constraintCompliance: ConstraintCompliance[];
  valueProposition: ValueProposition;
}

export interface BusinessObjective {
  objective: string;
  alignment: number; // 0-1
  contribution: string;
  measurability: string;
  timeframe: string;
}

export interface StakeholderRequirement {
  stakeholder: string;
  requirement: string;
  satisfaction: number; // 0-1
  criticality: 'must_have' | 'should_have' | 'nice_to_have';
  tradeoffs: string[];
}

export interface ConstraintCompliance {
  constraint: string;
  complianceLevel: number; // 0-1
  gapAnalysis: string[];
  mitigationPlan: string[];
}

export interface ValueProposition {
  primaryValue: string;
  quantifiableVBenefits: QuantifiableBenefit[];
  qualitativeBenefits: string[];
  investmentRequired: InvestmentRequirement;
  roi: ROIAnalysis;
}

export interface QuantifiableBenefit {
  benefit: string;
  metric: string;
  expectedValue: number;
  confidenceLevel: number; // 0-1
  timeframe: string;
}

export interface InvestmentRequirement {
  initialInvestment: number;
  ongoingCosts: number;
  resourceRequirements: string[];
  timeInvestment: number; // person-days
}

export interface ROIAnalysis {
  expectedROI: number;
  paybackPeriod: number; // months
  netPresentValue: number;
  riskAdjustedROI: number;
  assumptions: string[];
}

export interface AdvancedFeature {
  feature: string;
  description: string;
  benefit: string;
  implementationComplexity: 'simple' | 'moderate' | 'complex';
  maturity: 'experimental' | 'beta' | 'stable';
  documentation: string;
}

export interface CustomizationOption {
  option: string;
  purpose: string;
  flexibility: number; // 0-1
  complexity: 'simple' | 'moderate' | 'complex';
  impact: string;
  examples: string[];
}

// Ensemble recommendations
export interface EnsembleRecommendation {
  ensembleType: EnsembleType;
  baseModels: BaseModelRecommendation[];
  combinationStrategy: CombinationStrategy;
  expectedImprovement: number; // 0-1
  implementationComplexity: ModelComplexity;
  diversityAnalysis: DiversityAnalysis;
  ensembleMetrics: EnsembleMetrics;
}

export type EnsembleType =
  | 'bagging'
  | 'boosting'
  | 'stacking'
  | 'blending'
  | 'voting'
  | 'multi_level'
  | 'dynamic_ensemble'
  | 'meta_ensemble';

export interface BaseModelRecommendation {
  algorithmName: string;
  role: 'primary' | 'specialist' | 'diversity' | 'calibration' | 'robustness';
  weight: number;
  contribution: string;
  strengths: string[];
  hyperparameterStrategy: string;
}

export interface CombinationStrategy {
  method: 'averaging' | 'weighted_average' | 'voting' | 'stacking' | 'blending' | 'dynamic';
  parameters: any;
  adaptivity: boolean;
  confidence: number; // 0-1
}

export interface DiversityAnalysis {
  diversityMetrics: DiversityMetric[];
  optimalDiversity: number; // 0-1
  diversityStrategies: DiversityStrategy[];
  diversityMaintenance: string[];
}

export interface DiversityMetric {
  metric: string;
  value: number;
  interpretation: string;
  target: number;
}

export interface DiversityStrategy {
  strategy: string;
  effectiveness: number; // 0-1
  implementation: string;
  tradeoffs: string[];
}

export interface EnsembleMetrics {
  biasVarianceTradeoff: BiasVarianceAnalysis;
  stabilityAnalysis: StabilityAnalysis;
  calibrationAnalysis: CalibrationAnalysis;
  uncertaintyQuantification: UncertaintyQuantification;
}

export interface BiasVarianceAnalysis {
  biasReduction: number; // 0-1
  varianceReduction: number; // 0-1
  overallImprovement: number; // 0-1
  optimalComplexity: string;
}

export interface StabilityAnalysis {
  predictionStability: number; // 0-1
  rankingStability: number; // 0-1
  robustnessToData: number; // 0-1
  stabilityFactors: string[];
}

export interface CalibrationAnalysis {
  calibrationScore: number; // 0-1
  overconfidence: number; // 0-1
  underconfidence: number; // 0-1
  calibrationMethods: string[];
}

export interface UncertaintyQuantification {
  uncertaintyType: 'aleatoric' | 'epistemic' | 'both';
  quantificationMethod: string;
  reliability: number; // 0-1
  coverage: number; // 0-1
}

// Hyperparameter optimization guidance
export interface HyperparameterOptimizationGuidance {
  optimizationStrategy: OptimizationStrategy;
  parameterImportance: ParameterImportanceRanking[];
  searchSpaceDefinition: SearchSpaceDefinition;
  optimizationBudget: OptimizationBudget;
  multiObjectiveConsiderations: MultiObjectiveOptimization;
  transferLearningOpportunities: TransferLearningOpportunity[];
}

export interface OptimizationStrategy {
  primaryMethod: OptimizationMethod;
  fallbackMethods: OptimizationMethod[];
  multiPhaseStrategy: OptimizationPhase[];
  earlyStoppingCriteria: EarlyStoppingCriterion[];
  warmStartingStrategy: WarmStartingStrategy;
}

export type OptimizationMethod =
  | 'grid_search'
  | 'random_search'
  | 'bayesian_optimization'
  | 'evolutionary_algorithms'
  | 'population_based_training'
  | 'hyperband'
  | 'optuna'
  | 'multi_fidelity'
  | 'neural_architecture_search';

export interface OptimizationPhase {
  phase: string;
  method: OptimizationMethod;
  budget: number;
  focus: string[];
  successCriteria: string[];
}

export interface EarlyStoppingCriterion {
  criterion: string;
  threshold: number;
  patience: number;
  monitor: string;
}

export interface WarmStartingStrategy {
  strategy: string;
  sourceData: string[];
  transferability: number; // 0-1
  adaptation: string[];
}

export interface ParameterImportanceRanking {
  parameter: string;
  importance: number; // 0-1
  sensitivityAnalysis: ParameterSensitivityAnalysis;
  interactionEffects: ParameterInteraction[];
  tuningRecommendations: TuningRecommendation[];
}

export interface ParameterSensitivityAnalysis {
  sensitivity: number; // 0-1
  optimalRange: [number, number];
  defaultPerformance: number;
  maxImprovement: number;
  robustness: number; // 0-1
}

export interface ParameterInteraction {
  otherParameter: string;
  interactionStrength: number; // 0-1
  interactionType: 'synergistic' | 'antagonistic' | 'neutral';
  jointOptimizationBenefit: number; // 0-1
}

export interface TuningRecommendation {
  recommendation: string;
  priority: 'high' | 'medium' | 'low';
  expectedImprovement: number; // 0-1
  effort: 'low' | 'medium' | 'high';
  riskLevel: 'low' | 'medium' | 'high';
}

export interface SearchSpaceDefinition {
  continuousParameters: ContinuousParameter[];
  discreteParameters: DiscreteParameter[];
  categoricalParameters: CategoricalParameter[];
  conditionalParameters: ConditionalParameter[];
  constraints: ParameterConstraint[];
}

export interface ContinuousParameter {
  name: string;
  type: 'float' | 'int';
  min: number;
  max: number;
  scale: 'linear' | 'log' | 'uniform';
  default: number;
  prior?: PriorDistribution;
}

export interface DiscreteParameter {
  name: string;
  values: number[];
  default: number;
  distribution?: number[]; // Prior probabilities
}

export interface CategoricalParameter {
  name: string;
  choices: string[];
  default: string;
  probabilities?: number[];
}

export interface ConditionalParameter {
  name: string;
  condition: ParameterCondition;
  parameter: ContinuousParameter | DiscreteParameter | CategoricalParameter;
}

export interface ParameterCondition {
  parentParameter: string;
  operator: 'equals' | 'not_equals' | 'greater' | 'less' | 'in' | 'not_in';
  value: any;
}

export interface ParameterConstraint {
  type: 'linear' | 'nonlinear' | 'logical';
  expression: string;
  parameters: string[];
  violation: 'warning' | 'error';
}

export interface PriorDistribution {
  distribution: 'normal' | 'uniform' | 'beta' | 'gamma' | 'exponential';
  parameters: number[];
  confidence: number; // 0-1
}

export interface OptimizationBudget {
  totalEvaluations: number;
  parallelEvaluations: number;
  timeLimit: number; // minutes
  computeResources: ComputeResourceBudget;
  costLimit?: number;
  adaptiveBudgetAllocation: boolean;
}

export interface ComputeResourceBudget {
  cpuHours: number;
  gpuHours?: number;
  memoryGB: number;
  storageGB: number;
  networkBandwidth?: number;
}

export interface MultiObjectiveOptimization {
  objectives: OptimizationObjective[];
  tradeoffAnalysis: TradeoffAnalysis;
  paretoOptimization: ParetoOptimization;
  scalarization: ScalarizationStrategy;
}

export interface OptimizationObjective {
  name: string;
  type: 'maximize' | 'minimize';
  weight: number;
  priority: number;
  constraint?: ObjectiveConstraint;
}

export interface ObjectiveConstraint {
  type: 'threshold' | 'range';
  value: number | [number, number];
  hard: boolean; // Hard vs soft constraint
}

export interface TradeoffAnalysis {
  objectivePairs: ObjectivePairAnalysis[];
  tradeoffStrength: number; // 0-1
  dominantObjectives: string[];
  compromiseSolutions: CompromiseSolution[];
}

export interface ObjectivePairAnalysis {
  objective1: string;
  objective2: string;
  correlation: number; // -1 to 1
  conflictLevel: number; // 0-1
  resolutionStrategies: string[];
}

export interface CompromiseSolution {
  solution: string;
  objectiveValues: number[];
  satisfactionLevel: number; // 0-1
  stakeholderAcceptance: number; // 0-1
}

export interface ParetoOptimization {
  enabled: boolean;
  frontierSize: number;
  diversityMaintenance: boolean;
  convergenceMetrics: ConvergenceMetric[];
}

export interface ConvergenceMetric {
  metric: string;
  target: number;
  currentValue: number;
  trend: 'improving' | 'stable' | 'degrading';
}

export interface ScalarizationStrategy {
  method: 'weighted_sum' | 'epsilon_constraint' | 'goal_programming' | 'chebyshev';
  parameters: any;
  adaptiveWeights: boolean;
  robustness: number; // 0-1
}

export interface TransferLearningOpportunity {
  sourceDataset: string;
  similarity: number; // 0-1
  transferableParameters: string[];
  expectedImprovement: number; // 0-1
  transferMethod: TransferMethod;
}

export interface TransferMethod {
  method: 'direct_transfer' | 'fine_tuning' | 'meta_learning' | 'domain_adaptation';
  adaptationRequired: boolean;
  effort: 'low' | 'medium' | 'high';
  success: 'likely' | 'moderate' | 'uncertain';
}

// Implementation strategy
export interface ImplementationStrategy {
  phaseAPproach: ImplementationPhase[];
  riskMitigation: ImplementationRiskMitigation;
  resourcePlanning: ResourcePlanning;
  timeline: ImplementationTimeline;
  qualityAssurance: QualityAssuranceStrategy;
  rolloutStrategy: RolloutStrategy;
}

export interface ImplementationPhase {
  phase: string;
  objectives: string[];
  deliverables: string[];
  duration: number; // days
  dependencies: string[];
  riskLevel: RiskLevel;
  successCriteria: string[];
}

export interface ImplementationRiskMitigation {
  identifiedRisks: ImplementationRisk[];
  mitigationStrategies: ImplementationMitigationStrategy[];
  contingencyPlans: ImplementationContingencyPlan[];
  monitoring: RiskMonitoringStrategy;
}

export interface ImplementationRisk {
  risk: string;
  likelihood: number; // 0-1
  impact: number; // 0-1
  phase: string;
  mitigation: string[];
}

export interface ImplementationMitigationStrategy {
  strategy: string;
  applicableRisks: string[];
  effectiveness: number; // 0-1
  cost: 'low' | 'medium' | 'high';
  timeline: number; // days
}

export interface ImplementationContingencyPlan {
  trigger: string;
  actions: string[];
  fallbackOptions: string[];
  decisionTimeframe: number; // hours
}

export interface RiskMonitoringStrategy {
  monitoringPoints: MonitoringPoint[];
  escalationProcedures: string[];
  reviewFrequency: string;
  responsibilityMatrix: ResponsibilityAssignment[];
}

export interface MonitoringPoint {
  phase: string;
  metrics: string[];
  thresholds: number[];
  frequency: string;
  responsible: string;
}

export interface ResponsibilityAssignment {
  role: string;
  responsibilities: string[];
  authority: string[];
  escalationPath: string[];
}

export interface ResourcePlanning {
  humanResources: HumanResourceRequirement[];
  technicalResources: TechnicalResourceRequirement[];
  budgetEstimate: BudgetEstimate;
  resourceTimeline: ResourceTimeline;
}

export interface HumanResourceRequirement {
  role: string;
  skillsRequired: string[];
  experienceLevel: 'junior' | 'mid' | 'senior' | 'expert';
  timeCommitment: number; // percentage
  duration: number; // days
  availability: 'full_time' | 'part_time' | 'consultant';
}

export interface TechnicalResourceRequirement {
  resource: string;
  specification: string;
  quantity: number;
  duration: number; // days
  cost: number;
  alternatives: string[];
}

export interface BudgetEstimate {
  totalCost: number;
  costBreakdown: CostComponent[];
  confidenceLevel: number; // 0-1
  contingencyFactor: number; // 0-1
  costRange: [number, number];
}

export interface CostComponent {
  component: string;
  cost: number;
  category: 'labor' | 'technology' | 'infrastructure' | 'training' | 'other';
  confidence: number; // 0-1
}

export interface ResourceTimeline {
  milestones: ResourceMilestone[];
  criticalPath: string[];
  buffers: TimeBuffer[];
  dependencies: ResourceDependency[];
}

export interface ResourceMilestone {
  milestone: string;
  date: Date;
  dependencies: string[];
  deliverables: string[];
  approvals: string[];
}

export interface TimeBuffer {
  phase: string;
  bufferDays: number;
  justification: string;
  triggers: string[];
}

export interface ResourceDependency {
  dependent: string;
  prerequisite: string;
  type: 'hard' | 'soft';
  lead: number; // days
}

export interface ImplementationTimeline {
  totalDuration: number; // days
  phases: PhaseTimeline[];
  criticalMilestones: CriticalMilestone[];
  buffers: TimeBuffer[];
  parallelActivities: ParallelActivity[];
}

export interface PhaseTimeline {
  phase: string;
  startDate: Date;
  endDate: Date;
  duration: number; // days
  predecessors: string[];
  successors: string[];
}

export interface CriticalMilestone {
  milestone: string;
  date: Date;
  criticality: 'critical' | 'important' | 'desirable';
  impact: string;
  contingency: string[];
}

export interface ParallelActivity {
  activities: string[];
  coordination: string[];
  conflictResolution: string[];
  synchronization: string[];
}

export interface QualityAssuranceStrategy {
  qualityStandards: QualityStandard[];
  testingStrategy: TestingStrategy;
  reviewProcesses: ReviewProcess[];
  validationCriteria: ValidationCriterion[];
}

export interface QualityStandard {
  standard: string;
  description: string;
  measurability: string[];
  compliance: string[];
  verification: string[];
}

export interface TestingStrategy {
  testingPhases: TestingPhase[];
  testingTypes: TestingType[];
  automationLevel: number; // 0-1
  coverageTargets: CoverageTarget[];
}

export interface TestingPhase {
  phase: string;
  objectives: string[];
  methods: string[];
  criteria: string[];
  timeline: number; // days
}

export interface TestingType {
  type: 'unit' | 'integration' | 'system' | 'performance' | 'security' | 'usability';
  coverage: number; // 0-1
  automation: boolean;
  frequency: string;
}

export interface CoverageTarget {
  area: string;
  target: number; // 0-1
  measurement: string;
  tools: string[];
}

export interface ReviewProcess {
  process: string;
  frequency: string;
  participants: string[];
  criteria: string[];
  deliverables: string[];
}

export interface ValidationCriterion {
  criterion: string;
  measurement: string;
  threshold: number;
  importance: 'critical' | 'important' | 'desirable';
}

export interface RolloutStrategy {
  rolloutPhases: RolloutPhase[];
  rolloutCriteria: RolloutCriterion[];
  rollbackPlan: RollbackPlan;
  userAcceptance: UserAcceptanceStrategy;
}

export interface RolloutPhase {
  phase: string;
  scope: string[];
  duration: number; // days
  prerequisites: string[];
  success: string[];
  monitoring: string[];
}

export interface RolloutCriterion {
  criterion: string;
  threshold: number;
  measurement: string;
  frequency: string;
}

export interface RollbackPlan {
  triggers: string[];
  procedures: string[];
  timeframe: number; // hours
  dataProtection: string[];
  communication: string[];
}

export interface UserAcceptanceStrategy {
  userGroups: UserGroup[];
  acceptanceCriteria: UserAcceptanceCriterion[];
  training: TrainingPlan;
  support: SupportPlan;
}

export interface UserGroup {
  group: string;
  size: number;
  characteristics: string[];
  requirements: string[];
  concerns: string[];
}

export interface UserAcceptanceCriterion {
  criterion: string;
  measurement: string;
  target: number;
  userGroup: string;
}

export interface TrainingPlan {
  trainingModules: TrainingModule[];
  deliveryMethods: string[];
  timeline: number; // days
  assessment: string[];
}

export interface TrainingModule {
  module: string;
  duration: number; // hours
  audience: string[];
  objectives: string[];
  materials: string[];
}

export interface SupportPlan {
  supportChannels: SupportChannel[];
  escalationProcedures: string[];
  knowledgeBase: string[];
  feedbackMechanisms: string[];
}

export interface SupportChannel {
  channel: string;
  availability: string;
  response: number; // hours
  capacity: number;
}

// Metadata
export interface SelectionMetadata {
  selectionTimestamp: Date;
  selectionVersion: string;
  computationTime: number; // milliseconds
  dataCharacteristics: DatasetCharacteristicsSnapshot;
  selectionConfidence: number; // 0-1
  assumptions: string[];
  limitations: string[];
  reproducibilityInfo: SelectionReproducibilityInfo;
}

export interface DatasetCharacteristicsSnapshot {
  size: number;
  features: number;
  complexity: number;
  quality: number;
  domain: string;
  taskType: string;
}

export interface SelectionReproducibilityInfo {
  randomSeed?: number;
  softwareVersions: SoftwareVersionInfo[];
  configurationParameters: any;
  environmentInfo: EnvironmentInfo;
  deterministicSelection: boolean;
}

export interface SoftwareVersionInfo {
  package: string;
  version: string;
  purpose: string;
  critical: boolean;
}

export interface EnvironmentInfo {
  platform: string;
  architecture: string;
  runtime: string;
  dependencies: string[];
}

// Configuration
export interface AlgorithmSelectionConfig {
  selectionCriteria: SelectionCriteriaConfig;
  performancePrediction: PerformancePredictionConfig;
  riskTolerance: RiskToleranceConfig;
  implementationConstraints: ImplementationConstraintsConfig;
  businessRequirements: BusinessRequirementsConfig;
  computationalBudget: ComputationalBudgetConfig;
}

export interface SelectionCriteriaConfig {
  primaryCriteria: string[];
  weights: CriteriaWeights;
  weightingStrategy: 'fixed' | 'adaptive' | 'context_dependent';
  tradeoffAcceptance: TradeoffAcceptance;
}

export interface CriteriaWeights {
  performance: number;
  interpretability: number;
  implementation: number;
  maintenance: number;
  robustness: number;
  scalability: number;
}

export interface TradeoffAcceptance {
  performanceForInterpretability: number; // 0-1
  implementationForPerformance: number; // 0-1
  robustnessForComplexity: number; // 0-1
  customTradeoffs: CustomTradeoff[];
}

export interface CustomTradeoff {
  tradeoff: string;
  acceptance: number; // 0-1
  conditions: string[];
}

export interface PerformancePredictionConfig {
  predictionMethods: PredictionMethodConfig[];
  confidenceRequirements: ConfidenceRequirementsConfig;
  benchmarkingStrategy: BenchmarkingStrategyConfig;
  uncertaintyHandling: UncertaintyHandlingConfig;
}

export interface PredictionMethodConfig {
  method: PredictionMethod;
  weight: number;
  applicabilityConditions: string[];
  fallbackMethods: PredictionMethod[];
}

export interface ConfidenceRequirementsConfig {
  minimumConfidence: number; // 0-1
  criticalMetrics: string[];
  uncertaintyTolerance: number; // 0-1
  conservatismLevel: number; // 0-1
}

export interface BenchmarkingStrategyConfig {
  includeSimilarDatasets: boolean;
  includeIndustryBenchmarks: boolean;
  includeTheoreticalLimits: boolean;
  similarityThreshold: number; // 0-1
}

export interface UncertaintyHandlingConfig {
  propagationMethod: 'monte_carlo' | 'analytical' | 'bootstrap' | 'bayesian';
  samplingSize: number;
  confidenceLevel: number; // e.g., 0.95
  uncertaintyVisualization: boolean;
}

export interface RiskToleranceConfig {
  overallRiskTolerance: RiskLevel;
  categorySpecificTolerance: CategoryRiskTolerance[];
  riskMitigationPreference: RiskMitigationPreference;
  contingencyPlanning: ContingencyPlanningConfig;
}

export interface CategoryRiskTolerance {
  category: RiskCategoryType;
  tolerance: RiskLevel;
  justification: string;
  monitoring: string[];
}

export interface RiskMitigationPreference {
  preventive: number; // 0-1, preference for preventive measures
  reactive: number; // 0-1, preference for reactive measures
  riskTransfer: number; // 0-1, preference for risk transfer (e.g., insurance)
  riskAcceptance: number; // 0-1, willingness to accept certain risks
}

export interface ContingencyPlanningConfig {
  planningHorizon: number; // months
  scenarioPlanning: boolean;
  contingencyBudget: number; // percentage of total budget
  decisionFramework: string[];
}

export interface ImplementationConstraintsConfig {
  timeConstraints: TimeConstraintsConfig;
  resourceConstraints: ResourceConstraintsConfig;
  technicalConstraints: TechnicalConstraintsConfig;
  organizationalConstraints: OrganizationalConstraintsConfig;
}

export interface TimeConstraintsConfig {
  maxImplementationTime: number; // days
  phaseDeadlines: PhaseDeadline[];
  timeBuffers: number; // percentage
  accelerationOptions: AccelerationOption[];
}

export interface PhaseDeadline {
  phase: string;
  deadline: Date;
  flexibility: number; // days
  criticality: 'hard' | 'soft';
}

export interface AccelerationOption {
  option: string;
  timeReduction: number; // days
  additionalCost: number;
  riskIncrease: number; // 0-1
}

export interface ResourceConstraintsConfig {
  budgetConstraints: BudgetConstraintsConfig;
  humanResourceConstraints: HumanResourceConstraintsConfig;
  technicalResourceConstraints: TechnicalResourceConstraintsConfig;
  externalResourceConstraints: ExternalResourceConstraintsConfig;
}

export interface BudgetConstraintsConfig {
  totalBudget: number;
  budgetPhasing: BudgetPhasing[];
  contingencyPercentage: number;
  flexibilityRanges: FlexibilityRange[];
}

export interface BudgetPhasing {
  phase: string;
  allocation: number;
  flexibility: number; // percentage
  dependencies: string[];
}

export interface FlexibilityRange {
  category: string;
  minBudget: number;
  maxBudget: number;
  implications: string[];
}

export interface HumanResourceConstraintsConfig {
  availableRoles: AvailableRole[];
  skillConstraints: SkillConstraint[];
  trainingBudget: number;
  externalConsultingBudget: number;
}

export interface AvailableRole {
  role: string;
  availability: number; // percentage
  skillLevel: 'junior' | 'mid' | 'senior' | 'expert';
  cost: number; // per day
}

export interface SkillConstraint {
  skill: string;
  required: boolean;
  currentLevel: number; // 0-1
  targetLevel: number; // 0-1
  developmentTime: number; // days
}

export interface TechnicalResourceConstraintsConfig {
  computingResources: ComputingResourceConstraints;
  softwareLicenses: SoftwareLicenseConstraints;
  dataAccessConstraints: DataAccessConstraints;
  securityConstraints: SecurityConstraints;
}

export interface ComputingResourceConstraints {
  cpuHours: number;
  gpuHours?: number;
  memoryGB: number;
  storageGB: number;
  networkBandwidth: number;
  cloudBudget?: number;
}

export interface SoftwareLicenseConstraints {
  availableLicenses: AvailableLicense[];
  licenseBudget: number;
  procurementTime: number; // days
  restrictions: string[];
}

export interface AvailableLicense {
  software: string;
  licenses: number;
  cost: number;
  renewalDate?: Date;
  restrictions: string[];
}

export interface DataAccessConstraints {
  dataAvailability: DataAvailability[];
  privacyConstraints: PrivacyConstraint[];
  dataGovernance: DataGovernanceConstraint[];
  dataQuality: DataQualityConstraint[];
}

export interface DataAvailability {
  dataSource: string;
  availability: 'full' | 'partial' | 'restricted' | 'unavailable';
  accessTime: number; // days
  cost: number;
  conditions: string[];
}

export interface PrivacyConstraint {
  constraint: string;
  applicableData: string[];
  compliance: string[];
  mitigations: string[];
}

export interface DataGovernanceConstraint {
  policy: string;
  requirements: string[];
  approvals: string[];
  timeline: number; // days
}

export interface DataQualityConstraint {
  qualityMetric: string;
  currentLevel: number; // 0-1
  requiredLevel: number; // 0-1
  improvementCost: number;
  improvementTime: number; // days
}

export interface SecurityConstraints {
  securityRequirements: SecurityRequirement[];
  complianceFrameworks: ComplianceFramework[];
  securityBudget: number;
  securityTimeline: number; // days
}

export interface SecurityRequirement {
  requirement: string;
  criticality: 'critical' | 'important' | 'desirable';
  currentCompliance: number; // 0-1
  targetCompliance: number; // 0-1
  implementation: string[];
}

export interface ComplianceFramework {
  framework: string;
  applicability: string[];
  requirements: string[];
  auditFrequency: string;
  penalties: string[];
}

export interface ExternalResourceConstraintsConfig {
  vendorConstraints: VendorConstraint[];
  partnerConstraints: PartnerConstraint[];
  regulatoryConstraints: RegulatoryConstraint[];
  marketConstraints: MarketConstraint[];
}

export interface VendorConstraint {
  vendor: string;
  services: string[];
  availability: string;
  cost: number;
  contractTerms: string[];
}

export interface PartnerConstraint {
  partner: string;
  capabilities: string[];
  availability: number; // 0-1
  cost: number;
  dependencies: string[];
}

export interface RegulatoryConstraint {
  regulation: string;
  applicability: string[];
  compliance: string[];
  penalties: string[];
  timeline: number; // days
}

export interface MarketConstraint {
  constraint: string;
  impact: string[];
  timeline: string;
  mitigation: string[];
}

export interface TechnicalConstraintsConfig {
  platformConstraints: PlatformConstraint[];
  integrationConstraints: IntegrationConstraint[];
  performanceConstraints: PerformanceConstraint[];
  scalabilityConstraints: ScalabilityConstraint[];
}

export interface PlatformConstraint {
  platform: string;
  supportedFeatures: string[];
  limitations: string[];
  migrationCost?: number;
  migrationTime?: number; // days
}

export interface IntegrationConstraint {
  system: string;
  integrationPoints: string[];
  complexity: 'simple' | 'moderate' | 'complex';
  timeline: number; // days
  dependencies: string[];
}

export interface PerformanceConstraint {
  metric: string;
  requirement: number;
  currentPerformance?: number;
  improvement: string[];
  cost: number;
}

export interface ScalabilityConstraint {
  dimension: string;
  currentCapacity: number;
  requiredCapacity: number;
  scalingStrategy: string[];
  cost: number;
}

export interface OrganizationalConstraintsConfig {
  culturalConstraints: CulturalConstraint[];
  processConstraints: ProcessConstraint[];
  governanceConstraints: GovernanceConstraint[];
  changeManagementConstraints: ChangeManagementConstraint[];
}

export interface CulturalConstraint {
  aspect: string;
  currentState: string;
  desiredState: string;
  changeStrategy: string[];
  timeline: number; // days
}

export interface ProcessConstraint {
  process: string;
  currentMaturity: number; // 0-1
  requiredMaturity: number; // 0-1
  improvementPlan: string[];
  effort: number; // person-days
}

export interface GovernanceConstraint {
  governanceArea: string;
  requirements: string[];
  approvalProcess: string[];
  timeline: number; // days
  stakeholders: string[];
}

export interface ChangeManagementConstraint {
  change: string;
  resistance: number; // 0-1
  champions: string[];
  strategy: string[];
  timeline: number; // days
}

export interface BusinessRequirementsConfig {
  businessObjectives: BusinessObjectiveConfig[];
  stakeholderRequirements: StakeholderRequirementConfig[];
  constraintCompliance: ConstraintComplianceConfig[];
  valueRequirements: ValueRequirementConfig;
}

export interface BusinessObjectiveConfig {
  objective: string;
  weight: number;
  measurementCriteria: string[];
  timeframe: string;
  dependencies: string[];
}

export interface StakeholderRequirementConfig {
  stakeholder: string;
  requirements: RequirementConfig[];
  influence: number; // 0-1
  satisfaction: number; // 0-1, current satisfaction
}

export interface RequirementConfig {
  requirement: string;
  priority: 'must_have' | 'should_have' | 'nice_to_have';
  measurability: string[];
  acceptanceCriteria: string[];
}

export interface ConstraintComplianceConfig {
  constraints: ComplianceConstraintConfig[];
  monitoringStrategy: ComplianceMonitoringConfig;
  violationHandling: ViolationHandlingConfig;
}

export interface ComplianceConstraintConfig {
  constraint: string;
  type: 'regulatory' | 'internal' | 'contractual' | 'industry';
  strictness: 'strict' | 'moderate' | 'flexible';
  penalties: string[];
}

export interface ComplianceMonitoringConfig {
  frequency: string;
  methods: string[];
  reporting: string[];
  escalation: string[];
}

export interface ViolationHandlingConfig {
  detectionMethods: string[];
  responseTime: number; // hours
  correctionProcedures: string[];
  preventiveMeasures: string[];
}

export interface ValueRequirementConfig {
  valueMetrics: ValueMetricConfig[];
  roiRequirements: ROIRequirementConfig;
  timeToValue: TimeToValueConfig;
  sustainabilityRequirements: SustainabilityRequirementConfig;
}

export interface ValueMetricConfig {
  metric: string;
  target: number;
  measurement: string;
  frequency: string;
  responsibility: string;
}

export interface ROIRequirementConfig {
  minimumROI: number;
  timeframe: number; // months
  calculationMethod: string;
  includedCosts: string[];
  includedBenefits: string[];
}

export interface TimeToValueConfig {
  targetTime: number; // months
  valueMilestones: ValueMilestone[];
  accelerationOptions: ValueAccelerationOption[];
}

export interface ValueMilestone {
  milestone: string;
  targetDate: Date;
  valueDelivered: number; // percentage
  dependencies: string[];
}

export interface ValueAccelerationOption {
  option: string;
  timeReduction: number; // months
  additionalCost: number;
  riskIncrease: number; // 0-1
}

export interface SustainabilityRequirementConfig {
  environmentalImpact: EnvironmentalImpactConfig;
  socialImpact: SocialImpactConfig;
  economicSustainability: EconomicSustainabilityConfig;
}

export interface EnvironmentalImpactConfig {
  carbonFootprint: CarbonFootprintConfig;
  resourceUsage: ResourceUsageConfig;
  wasteGeneration: WasteGenerationConfig;
}

export interface CarbonFootprintConfig {
  targetReduction: number; // percentage
  measurement: string;
  offsetting: boolean;
  reporting: string[];
}

export interface ResourceUsageConfig {
  efficiency: ResourceEfficiencyConfig[];
  renewable: RenewableResourceConfig[];
  conservation: ConservationConfig[];
}

export interface ResourceEfficiencyConfig {
  resource: string;
  currentEfficiency: number; // 0-1
  targetEfficiency: number; // 0-1
  improvement: string[];
}

export interface RenewableResourceConfig {
  resource: string;
  currentPercentage: number; // 0-1
  targetPercentage: number; // 0-1
  transition: string[];
}

export interface ConservationConfig {
  initiative: string;
  target: number;
  measurement: string;
  implementation: string[];
}

export interface WasteGenerationConfig {
  wasteTypes: WasteType[];
  reductionTargets: ReductionTarget[];
  disposalMethods: DisposalMethod[];
}

export interface WasteType {
  type: string;
  currentGeneration: number;
  targetReduction: number; // percentage
  management: string[];
}

export interface ReductionTarget {
  target: string;
  timeline: number; // months
  methods: string[];
  measurement: string;
}

export interface DisposalMethod {
  method: string;
  applicableWaste: string[];
  environmental: number; // 0-1, environmental friendliness
  cost: number;
}

export interface SocialImpactConfig {
  communityBenefit: CommunityBenefitConfig[];
  employmentImpact: EmploymentImpactConfig;
  diversityInclusion: DiversityInclusionConfig;
}

export interface CommunityBenefitConfig {
  benefit: string;
  targetCommunity: string[];
  measurement: string;
  timeline: number; // months
}

export interface EmploymentImpactConfig {
  jobCreation: number;
  skillDevelopment: SkillDevelopmentConfig[];
  retention: RetentionConfig;
}

export interface SkillDevelopmentConfig {
  skill: string;
  targetGroup: string[];
  development: string[];
  timeline: number; // months
}

export interface RetentionConfig {
  targetRetention: number; // percentage
  strategies: string[];
  measurement: string;
  incentives: string[];
}

export interface DiversityInclusionConfig {
  targets: DiversityTarget[];
  initiatives: DiversityInitiative[];
  measurement: DiversityMeasurement[];
}

export interface DiversityTarget {
  dimension: string;
  currentState: number; // percentage
  target: number; // percentage
  timeline: number; // months
}

export interface DiversityInitiative {
  initiative: string;
  targetGroups: string[];
  implementation: string[];
  budget: number;
}

export interface DiversityMeasurement {
  metric: string;
  frequency: string;
  reporting: string[];
  accountability: string[];
}

export interface EconomicSustainabilityConfig {
  longTermViability: LongTermViabilityConfig;
  stakeholderValue: StakeholderValueConfig;
  riskManagement: EconomicRiskManagementConfig;
}

export interface LongTermViabilityConfig {
  planningHorizon: number; // years
  viabilityMetrics: ViabilityMetric[];
  scenarios: EconomicScenario[];
  adaptationStrategy: AdaptationStrategy[];
}

export interface ViabilityMetric {
  metric: string;
  currentValue: number;
  projectedValue: number;
  trend: 'improving' | 'stable' | 'declining';
}

export interface EconomicScenario {
  scenario: string;
  probability: number; // 0-1
  impact: number; // -1 to 1
  strategies: string[];
}

export interface AdaptationStrategy {
  strategy: string;
  triggers: string[];
  implementation: string[];
  timeline: number; // months
}

export interface StakeholderValueConfig {
  stakeholders: EconomicStakeholder[];
  valueDistribution: ValueDistribution[];
  balancingStrategy: BalancingStrategy[];
}

export interface EconomicStakeholder {
  stakeholder: string;
  valueMetrics: string[];
  currentSatisfaction: number; // 0-1
  targetSatisfaction: number; // 0-1
}

export interface ValueDistribution {
  stakeholder: string;
  valueShare: number; // percentage
  valueType: string[];
  measurement: string;
}

export interface BalancingStrategy {
  strategy: string;
  stakeholders: string[];
  tradeoffs: string[];
  resolution: string[];
}

export interface EconomicRiskManagementConfig {
  riskTypes: EconomicRiskType[];
  mitigation: EconomicRiskMitigation[];
  monitoring: EconomicRiskMonitoring[];
}

export interface EconomicRiskType {
  risk: string;
  likelihood: number; // 0-1
  impact: number; // -1 to 1
  timeframe: string;
  indicators: string[];
}

export interface EconomicRiskMitigation {
  risk: string;
  strategies: string[];
  effectiveness: number; // 0-1
  cost: number;
  timeline: number; // months
}

export interface EconomicRiskMonitoring {
  risk: string;
  metrics: string[];
  frequency: string;
  thresholds: number[];
  actions: string[];
}

export interface ComputationalBudgetConfig {
  totalBudget: ComputationalBudget;
  allocationStrategy: AllocationStrategy;
  optimizationPriorities: OptimizationPriority[];
  resourceManagement: ResourceManagementConfig;
}

export interface ComputationalBudget {
  computeHours: number;
  memoryGBHours: number;
  storageGB: number;
  networkBandwidth: number; // GB
  specializedResources: SpecializedResource[];
}

export interface SpecializedResource {
  resource: 'gpu' | 'tpu' | 'fpga' | 'quantum';
  amount: number;
  unit: string;
  cost: number;
  availability: string;
}

export interface AllocationStrategy {
  strategy: 'fixed' | 'adaptive' | 'priority_based' | 'demand_driven';
  parameters: any;
  reallocationTriggers: string[];
  buffers: AllocationBuffer[];
}

export interface AllocationBuffer {
  resource: string;
  bufferPercentage: number;
  purpose: string;
  releaseConditions: string[];
}

export interface OptimizationPriority {
  aspect: 'algorithm_selection' | 'hyperparameter_tuning' | 'ensemble_optimization' | 'validation';
  priority: number;
  budgetAllocation: number; // percentage
  optimization: string[];
}

export interface ResourceManagementConfig {
  monitoring: ResourceMonitoringConfig;
  optimization: ResourceOptimizationConfig;
  scaling: ResourceScalingConfig;
  cleanup: ResourceCleanupConfig;
}

export interface ResourceMonitoringConfig {
  metrics: string[];
  frequency: string;
  alerting: AlertingConfig[];
  reporting: ReportingConfig[];
}

export interface AlertingConfig {
  condition: string;
  threshold: number;
  action: string;
  recipients: string[];
}

export interface ReportingConfig {
  report: string;
  frequency: string;
  recipients: string[];
  format: string;
}

export interface ResourceOptimizationConfig {
  techniques: OptimizationTechnique[];
  automation: AutomationConfig[];
  costOptimization: CostOptimizationConfig[];
}

export interface OptimizationTechnique {
  technique: string;
  applicability: string[];
  expectedSavings: number; // percentage
  implementation: string[];
}

export interface AutomationConfig {
  process: string;
  automation: 'full' | 'partial' | 'manual';
  triggers: string[];
  safeguards: string[];
}

export interface CostOptimizationConfig {
  strategy: string;
  targetSavings: number; // percentage
  methods: string[];
  constraints: string[];
}

export interface ResourceScalingConfig {
  scalingPolicies: ScalingPolicy[];
  scalingTriggers: ScalingTrigger[];
  scalingLimits: ScalingLimit[];
}

export interface ScalingPolicy {
  resource: string;
  direction: 'up' | 'down' | 'both';
  strategy: 'reactive' | 'predictive' | 'scheduled';
  parameters: any;
}

export interface ScalingTrigger {
  metric: string;
  threshold: number;
  duration: number; // minutes
  action: string;
}

export interface ScalingLimit {
  resource: string;
  minAmount: number;
  maxAmount: number;
  justification: string;
}

export interface ResourceCleanupConfig {
  policies: CleanupPolicy[];
  automation: CleanupAutomation[];
  verification: CleanupVerification[];
}

export interface CleanupPolicy {
  resource: string;
  retention: number; // days
  conditions: string[];
  exceptions: string[];
}

export interface CleanupAutomation {
  process: string;
  schedule: string;
  safety: string[];
  rollback: string[];
}

export interface CleanupVerification {
  verification: string;
  frequency: string;
  metrics: string[];
  alerts: string[];
}

// Progress tracking
export interface SelectionProgress {
  phase:
    | 'initialization'
    | 'algorithm_discovery'
    | 'evaluation'
    | 'performance_prediction'
    | 'risk_assessment'
    | 'ensemble_analysis'
    | 'hyperparameter_guidance'
    | 'implementation_planning'
    | 'reasoning_generation'
    | 'finalization';
  progress: number; // 0-100
  currentOperation: string;
  estimatedTimeRemaining: number; // milliseconds
  completedComponents: string[];
  errorCount: number;
  warningCount: number;
  algorithmsEvaluated: number;
  selectionConfidence: number; // 0-1
}

// Error and warning types
export interface SelectionWarning {
  category:
    | 'algorithm_discovery'
    | 'evaluation'
    | 'performance_prediction'
    | 'risk_assessment'
    | 'configuration'
    | 'data_quality';
  severity: 'low' | 'medium' | 'high';
  message: string;
  component: string;
  impact: string;
  recommendation: string;
}

export class SelectionError extends Error {
  public readonly category:
    | 'data_error'
    | 'computational_error'
    | 'configuration_error'
    | 'resource_error';
  public readonly component: string;
  public readonly recoverable: boolean;
  public readonly fallbackStrategy?: string;

  constructor(
    message: string,
    category: SelectionError['category'],
    component: string,
    recoverable: boolean,
    fallbackStrategy?: string,
  ) {
    super(message);
    this.name = 'SelectionError';
    this.category = category;
    this.component = component;
    this.recoverable = recoverable;
    this.fallbackStrategy = fallbackStrategy;

    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, SelectionError);
    }
  }
}
