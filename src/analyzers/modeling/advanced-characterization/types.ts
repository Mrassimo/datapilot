/**
 * Advanced Dataset Characterization Engine - Type Definitions
 * Provides sophisticated dataset analysis beyond basic statistics
 */

// Core complexity analysis types
export interface DatasetComplexityProfile {
  intrinsicDimensionality: IntrinsicDimensionalityAnalysis;
  featureInteractionDensity: FeatureInteractionAnalysis;
  nonLinearityScore: NonLinearityAnalysis;
  separabilityIndex: SeparabilityAnalysis;
  noiseLevel: NoiseAnalysis;
  sparsityCharacteristics: SparsityProfile;
  temporalComplexity?: TimeSeriesComplexity;
  overallComplexityScore: number; // 0-100, weighted composite score
  confidenceLevel: 'very_high' | 'high' | 'medium' | 'low';
  analysisMetadata: AnalysisMetadata;
}

export interface IntrinsicDimensionalityAnalysis {
  estimatedDimension: number;
  actualFeatureCount: number;
  dimensionalityReduction: number; // How much the actual dimensionality can be reduced
  method: 'pca_eigenvalue' | 'mle' | 'correlation_dimension';
  confidence: number; // 0-1
  redundantFeatures: string[];
  criticalFeatures: string[];
}

export interface FeatureInteractionAnalysis {
  overallInteractionStrength: number; // 0-1
  pairwiseInteractions: PairwiseInteraction[];
  higherOrderInteractions: HigherOrderInteraction[];
  interactionDensity: number; // Percentage of feature pairs with significant interactions
  dominantInteractionTypes: InteractionType[];
  featureInteractionNetwork: InteractionNetwork;
}

export interface PairwiseInteraction {
  feature1: string;
  feature2: string;
  interactionStrength: number; // 0-1
  interactionType: InteractionType;
  mutualInformation: number;
  statisticalSignificance: number; // p-value
  businessRelevance?: number; // 0-1, if domain knowledge available
}

export type InteractionType =
  | 'linear_correlation'
  | 'non_linear_dependency'
  | 'conditional_dependency'
  | 'mutual_exclusion'
  | 'synergistic'
  | 'redundant'
  | 'complementary';

export interface HigherOrderInteraction {
  features: string[];
  interactionOrder: number; // 3, 4, 5, etc.
  interactionStrength: number;
  conditionalDependencies: ConditionalDependency[];
}

export interface ConditionalDependency {
  dependentFeature: string;
  conditioningFeatures: string[];
  dependencyStrength: number;
  conditioningContext: string; // Human-readable description
}

export interface InteractionNetwork {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  centralityScores: CentralityScore[];
  communityStructure: FeatureCommunity[];
}

export interface NetworkNode {
  featureName: string;
  importance: number;
  connectivity: number;
  role: 'hub' | 'bridge' | 'peripheral' | 'specialist';
}

export interface NetworkEdge {
  source: string;
  target: string;
  weight: number;
  interactionType: InteractionType;
}

export interface CentralityScore {
  feature: string;
  betweennessCentrality: number;
  closenessCentrality: number;
  degreeCentrality: number;
  eigenvectorCentrality: number;
}

export interface FeatureCommunity {
  communityId: string;
  features: string[];
  cohesionScore: number;
  functionalDescription?: string;
}

// Non-linearity analysis
export interface NonLinearityAnalysis {
  overallNonLinearityScore: number; // 0-1
  featureNonLinearity: FeatureNonLinearity[];
  targetNonLinearity?: TargetNonLinearity;
  nonLinearPatterns: NonLinearPattern[];
  complexityIndicators: ComplexityIndicator[];
}

export interface FeatureNonLinearity {
  featureName: string;
  linearityScore: number; // 0-1, higher = more linear
  nonLinearPatterns: string[];
  transformationSuggestions: TransformationSuggestion[];
}

export interface TargetNonLinearity {
  targetVariable: string;
  linearityWithFeatures: number; // 0-1
  nonLinearRelationships: NonLinearRelationship[];
  modelingImplications: string[];
}

export interface NonLinearRelationship {
  feature: string;
  relationshipType:
    | 'polynomial'
    | 'exponential'
    | 'logarithmic'
    | 'sinusoidal'
    | 'step'
    | 'complex';
  strength: number; // 0-1
  description: string;
}

export interface NonLinearPattern {
  patternType: string;
  affectedFeatures: string[];
  patternStrength: number;
  modelingImpact: 'low' | 'medium' | 'high';
  recommendedApproach: string;
}

export interface ComplexityIndicator {
  indicator: string;
  value: number;
  interpretation: string;
  modelingImplication: string;
}

export interface TransformationSuggestion {
  transformation:
    | 'log'
    | 'sqrt'
    | 'square'
    | 'reciprocal'
    | 'box_cox'
    | 'yeo_johnson'
    | 'polynomial';
  expectedImprovement: number; // 0-1
  preservesInterpretability: boolean;
  computationalCost: 'low' | 'medium' | 'high';
}

// Separability analysis (for classification tasks)
export interface SeparabilityAnalysis {
  overallSeparability: number; // 0-1
  classSeparability: ClassSeparability[];
  separabilityMethods: SeparabilityMethod[];
  visualSeparability: VisualSeparability[];
  geometricProperties: GeometricProperties;
}

export interface ClassSeparability {
  className: string;
  separabilityFromOthers: number; // 0-1
  confusionLikelihood: ConfusionLikelihood[];
  distinctiveFeatures: string[];
  problematicRegions: ProblematicRegion[];
}

export interface ConfusionLikelihood {
  confusedWith: string;
  confusionProbability: number;
  confusionCauses: string[];
  mitigation: string[];
}

export interface ProblematicRegion {
  description: string;
  features: string[];
  severity: 'low' | 'medium' | 'high';
  recommendedAction: string;
}

export interface SeparabilityMethod {
  method: 'distance_based' | 'density_based' | 'linear_discriminant' | 'manifold_based';
  separabilityScore: number;
  confidence: number;
  methodSpecificMetrics: Record<string, number>;
}

export interface VisualSeparability {
  dimensions: string[];
  separabilityScore: number;
  visualizationRecommendation: string;
  plotType: 'scatter' | 'parallel_coordinates' | 'radar' | 'projection';
}

export interface GeometricProperties {
  dataManifoldDimension: number;
  manifoldComplexity: number;
  clusteringTendency: number;
  boundaryComplexity: number;
  volumeRatio: number; // Data volume vs feature space volume
}

// Noise analysis
export interface NoiseAnalysis {
  overallNoiseLevel: number; // 0-1
  signalToNoiseRatio: number;
  noiseCharacteristics: NoiseCharacteristic[];
  noiseDistribution: NoiseDistribution;
  outlierAnalysis: OutlierAnalysis;
  dataQualityImpact: DataQualityImpact;
}

export interface NoiseCharacteristic {
  feature: string;
  noiseLevel: number; // 0-1
  noiseType: 'gaussian' | 'uniform' | 'systematic' | 'sporadic' | 'mixed';
  noiseSources: string[];
  filteringRecommendations: FilteringRecommendation[];
}

export interface FilteringRecommendation {
  method: string;
  expectedImprovement: number; // 0-1
  preservesSignal: boolean;
  implementationComplexity: 'low' | 'medium' | 'high';
}

export interface NoiseDistribution {
  globalNoise: number;
  localNoise: LocalNoiseRegion[];
  systematicNoise: SystematicNoise[];
  temporalNoisePattern?: TemporalNoisePattern;
}

export interface LocalNoiseRegion {
  region: string;
  noiseLevel: number;
  affectedSamples: number;
  characteristics: string[];
}

export interface SystematicNoise {
  pattern: string;
  affectedFeatures: string[];
  noiseStrength: number;
  correctionStrategy: string;
}

export interface TemporalNoisePattern {
  pattern: 'increasing' | 'decreasing' | 'cyclical' | 'sporadic';
  temporalFeature: string;
  noiseEvolution: number[];
  seasonality?: number;
}

export interface OutlierAnalysis {
  outlierPercentage: number;
  outlierTypes: OutlierType[];
  outlierImpact: OutlierImpact;
  treatmentRecommendations: OutlierTreatment[];
}

export interface OutlierType {
  type: 'global' | 'local' | 'contextual' | 'collective';
  count: number;
  severity: 'mild' | 'moderate' | 'severe';
  features: string[];
  characteristics: string[];
}

export interface OutlierImpact {
  modelingSensitivity: 'low' | 'medium' | 'high';
  statisticalImpact: number; // 0-1
  businessRelevance: 'noise' | 'important' | 'critical';
  interpretationImpact: string;
}

export interface OutlierTreatment {
  treatment: 'remove' | 'cap' | 'transform' | 'separate_model' | 'robust_method';
  applicability: number; // 0-1
  tradeoffs: string[];
  implementation: string;
}

export interface DataQualityImpact {
  reliabilityScore: number; // 0-1
  uncertaintyMeasures: UncertaintyMeasure[];
  modelingRecommendations: string[];
  dataCollectionSuggestions: string[];
}

export interface UncertaintyMeasure {
  source: string;
  uncertaintyLevel: number; // 0-1
  propagationImpact: number; // How much this affects modeling
  mitigation: string[];
}

// Sparsity analysis
export interface SparsityProfile {
  overallSparsity: number; // 0-1
  featureSparsity: FeatureSparsity[];
  sparsityPatterns: SparsityPattern[];
  sparsityImpact: SparsityImpact;
  handlingRecommendations: SparsityHandling[];
}

export interface FeatureSparsity {
  feature: string;
  sparsityLevel: number; // 0-1
  missingPatterns: MissingPattern[];
  informationContent: number; // Despite sparsity
  criticalityAssessment: 'essential' | 'important' | 'optional' | 'redundant';
}

export interface MissingPattern {
  pattern: 'random' | 'systematic' | 'informative' | 'clustered';
  description: string;
  implicationForModeling: string;
  treatmentPriority: 'high' | 'medium' | 'low';
}

export interface SparsityPattern {
  patternType: string;
  affectedFeatures: string[];
  patternStrength: number;
  businessExplanation?: string;
  modelingStrategy: string;
}

export interface SparsityImpact {
  algorithmSensitivity: AlgorithmSensitivity[];
  performanceImpact: number; // Expected performance degradation
  interpretabilityImpact: string;
  computationalImpact: string;
}

export interface AlgorithmSensitivity {
  algorithmCategory: string;
  sensitivityLevel: 'low' | 'medium' | 'high';
  specificConcerns: string[];
  adaptations: string[];
}

export interface SparsityHandling {
  method: 'imputation' | 'sparse_algorithms' | 'feature_selection' | 'regularization';
  applicability: number; // 0-1
  expectedImpact: number; // 0-1
  implementationComplexity: 'low' | 'medium' | 'high';
  preservesInterpretability: boolean;
}

// Time series complexity (when applicable)
export interface TimeSeriesComplexity {
  temporalFeature: string;
  trendComplexity: TrendComplexity;
  seasonalityComplexity: SeasonalityComplexity;
  cyclicalComplexity: CyclicalComplexity;
  irregularityAnalysis: IrregularityAnalysis;
  forecastabilityAssessment: ForecastabilityAssessment;
}

export interface TrendComplexity {
  trendPresence: boolean;
  trendType: 'linear' | 'polynomial' | 'exponential' | 'complex';
  trendStrength: number; // 0-1
  changePoints: ChangePoint[];
  trendStability: number; // 0-1
}

export interface ChangePoint {
  timestamp: number;
  changeType: 'level' | 'trend' | 'variance';
  magnitude: number;
  confidence: number;
  businessContext?: string;
}

export interface SeasonalityComplexity {
  seasonalPresence: boolean;
  seasonalPeriods: SeasonalPeriod[];
  seasonalStrength: number; // 0-1
  seasonalStability: number; // 0-1
  harmonic: number; // Number of harmonic components
}

export interface SeasonalPeriod {
  period: number;
  strength: number;
  description: string;
  businessRelevance: string;
}

export interface CyclicalComplexity {
  cyclicalPresence: boolean;
  cyclicalPeriods: number[];
  cyclicalStrength: number;
  cyclicalRegularity: number; // How regular the cycles are
}

export interface IrregularityAnalysis {
  irregularityLevel: number; // 0-1
  irregularityType: 'random' | 'systematic' | 'episodic';
  volatilityClustering: boolean;
  extremeEvents: ExtremeEvent[];
}

export interface ExtremeEvent {
  timestamp: number;
  magnitude: number;
  type: 'outlier' | 'structural_break' | 'regime_change';
  description: string;
  modelingImplication: string;
}

export interface ForecastabilityAssessment {
  shortTermForecastability: number; // 0-1
  longTermForecastability: number; // 0-1
  optimalForecastHorizon: number;
  forecastingChallenges: string[];
  recommendedApproaches: string[];
}

// Analysis metadata
export interface AnalysisMetadata {
  analysisTimestamp: Date;
  analysisVersion: string;
  computationTime: number; // milliseconds
  sampleSize: number;
  samplingStrategy?: string;
  confidenceBounds: ConfidenceBounds;
  limitationsAndCaveats: string[];
  reproducibilityInfo: ReproducibilityInfo;
}

export interface ConfidenceBounds {
  overallConfidence: number; // 0-1
  componentConfidences: ComponentConfidence[];
  uncertaintySources: string[];
  confidenceInterpretation: string;
}

export interface ComponentConfidence {
  component: string;
  confidence: number;
  limitingFactors: string[];
}

export interface ReproducibilityInfo {
  randomSeed?: number;
  softwareVersions: SoftwareVersion[];
  configurationParameters: Record<string, any>;
  deterministicAnalysis: boolean;
}

export interface SoftwareVersion {
  package: string;
  version: string;
  purpose: string;
}

// Configuration for the characterization engine
export interface DatasetCharacterizationConfig {
  analysisDepth: 'basic' | 'standard' | 'comprehensive' | 'exhaustive';
  focusAreas: CharacterizationFocus[];
  computationalBudget: ComputationalBudget;
  confidenceRequirements: ConfidenceRequirements;
  businessContext?: BusinessContext;
  temporalAnalysis: boolean;
  interactionAnalysisDepth: number; // Maximum interaction order to consider
  samplingStrategy: SamplingStrategy;
}

export type CharacterizationFocus =
  | 'complexity'
  | 'interactions'
  | 'non_linearity'
  | 'separability'
  | 'noise'
  | 'sparsity'
  | 'temporal'
  | 'all';

export interface ComputationalBudget {
  maxComputationTime: number; // milliseconds
  maxMemoryUsage: number; // MB
  parallelizationLevel: number; // Number of threads
  approximationTolerance?: number; // For large datasets
}

export interface ConfidenceRequirements {
  minimumConfidence: number; // 0-1
  criticalComponents: string[]; // Components requiring high confidence
  uncertaintyTolerance: number; // 0-1
}

export interface BusinessContext {
  domain: string;
  businessObjective: string;
  stakeholderRequirements: string[];
  interpretabilityNeeds: 'low' | 'medium' | 'high';
  regulatoryConstraints: string[];
}

export interface SamplingStrategy {
  strategy: 'full' | 'stratified' | 'random' | 'systematic' | 'adaptive';
  sampleSize?: number;
  stratificationColumns?: string[];
  preserveDistributions: boolean;
}

// Progress tracking
export interface CharacterizationProgress {
  phase:
    | 'initialization'
    | 'complexity_analysis'
    | 'interaction_analysis'
    | 'noise_analysis'
    | 'finalization';
  progress: number; // 0-100
  currentOperation: string;
  estimatedTimeRemaining: number; // milliseconds
  completedComponents: string[];
  errorCount: number;
  warningCount: number;
}

// Error and warning types
export interface CharacterizationWarning {
  category: 'data_quality' | 'computational' | 'statistical' | 'configuration';
  severity: 'low' | 'medium' | 'high';
  message: string;
  component: string;
  impact: string;
  recommendation: string;
}

export class CharacterizationError extends Error {
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
    category: CharacterizationError['category'],
    component: string,
    recoverable: boolean,
    fallbackStrategy?: string,
  ) {
    super(message);
    this.name = 'CharacterizationError';
    this.category = category;
    this.component = component;
    this.recoverable = recoverable;
    this.fallbackStrategy = fallbackStrategy;

    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CharacterizationError);
    }
  }
}
