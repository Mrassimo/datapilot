/**
 * Section 5: Data Engineering & Structural Insights Types
 * Schema optimization, transformation pipelines, and ML readiness assessment
 */

// Forward declarations to avoid circular imports

// Main Section 5 Result Interface
export interface Section5Result {
  engineeringAnalysis: DataEngineeringAnalysis;
  warnings: Section5Warning[];
  performanceMetrics: Section5PerformanceMetrics;
  metadata: Section5Metadata;
}

export interface Section5Warning {
  category: 'schema' | 'transformation' | 'scalability' | 'performance' | 'security';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  impact: string;
  suggestion: string;
}

export interface Section5PerformanceMetrics {
  analysisTimeMs: number;
  transformationsEvaluated: number;
  schemaRecommendationsGenerated: number;
  mlFeaturesDesigned: number;
}

export interface Section5Metadata {
  analysisApproach: string;
  sourceDatasetSize: number;
  engineeredFeatureCount: number;
  mlReadinessScore: number;
}

// Core Data Engineering Analysis
export interface DataEngineeringAnalysis {
  schemaAnalysis: SchemaAnalysis;
  structuralIntegrity: StructuralIntegrityAnalysis;
  transformationPipeline: TransformationPipelineRecommendations;
  scalabilityAssessment: ScalabilityAssessment;
  dataGovernance: DataGovernanceConsiderations;
  mlReadiness: MLReadinessAssessment;
  knowledgeBaseOutput: KnowledgeBaseOutput;
}

// Schema Analysis & Optimization
export interface SchemaAnalysis {
  currentSchema: CurrentSchemaProfile;
  optimizedSchema: OptimizedSchemaRecommendation;
  dataTypeConversions: DataTypeConversion[];
  characterEncodingRecommendations: EncodingRecommendations;
  normalizationInsights: NormalizationInsights;
}

export interface CurrentSchemaProfile {
  columns: SchemaColumn[];
  estimatedRowCount: number;
  estimatedSizeBytes: number;
  detectedEncoding: string;
}

export interface SchemaColumn {
  originalName: string;
  detectedType: string;
  inferredSemanticType: string;
  nullabilityPercentage: number;
  uniquenessPercentage: number;
  sampleValues: string[];
}

export interface OptimizedSchemaRecommendation {
  targetSystem: string;
  ddlStatement: string;
  columns: OptimizedColumn[];
  indexes: IndexRecommendation[];
  constraints: any[];
}

export interface OptimizedColumn {
  originalName: string;
  optimizedName: string;
  recommendedType: string;
  constraints: string[];
  reasoning: string;
}

export interface DataTypeConversion {
  columnName: string;
  currentType: string;
  recommendedType: string;
  conversionLogic: string;
  reasoning: string;
  riskLevel: 'low' | 'medium' | 'high';
  exampleTransformation: string;
}

export interface EncodingRecommendations {
  detectedEncoding: string;
  recommendedEncoding: string;
  collationRecommendation: string;
  characterSetIssues: string[];
}

export interface NormalizationInsights {
  redundancyDetected: RedundancyAnalysis[];
  normalizationOpportunities: NormalizationOpportunity[];
  denormalizationJustifications: DenormalizationJustification[];
}

// Structural Integrity Analysis
export interface StructuralIntegrityAnalysis {
  primaryKeyCandidates: PrimaryKeyCandidate[];
  foreignKeyRelationships: ForeignKeyRelationship[];
  orphanedRecords: OrphanedRecordAnalysis[];
  dataIntegrityScore: DataIntegrityScore;
}

export interface PrimaryKeyCandidate {
  columnName: string;
  uniqueness: number;
  completeness: number;
  stability: number;
  confidence: 'low' | 'medium' | 'high';
  reasoning: string;
}

export interface ForeignKeyRelationship {
  columnName: string;
  referencedTable: string;
  referencedColumn: string;
  confidence: 'low' | 'medium' | 'high';
  cardinality: string;
  integrityViolations: number;
  actionRecommendation: string;
}

export interface OrphanedRecordAnalysis {
  relationshipDescription: string;
  orphanedCount: number;
  orphanedPercentage: number;
  impactAssessment: string;
  resolutionStrategy: string;
}

export interface DataIntegrityScore {
  score: number;
  interpretation: string;
  factors: IntegrityFactor[];
}

export interface IntegrityFactor {
  factor: string;
  impact: 'positive' | 'negative';
  weight: number;
  description: string;
}

// Transformation Pipeline Recommendations
export interface TransformationPipelineRecommendations {
  columnStandardization: ColumnStandardization[];
  missingValueStrategy: MissingValueStrategy[];
  outlierTreatment: OutlierTreatmentStrategy[];
  categoricalEncoding: CategoricalEncodingStrategy[];
  numericalTransformations: NumericalTransformationStrategy[];
  dateTimeFeatureEngineering: DateTimeEngineeringStrategy[];
  textProcessingPipeline: TextProcessingStrategy[];
  booleanFeatureCreation: BooleanFeatureCreation[];
  featureHashingRecommendations: FeatureHashingRecommendation[];
}

export interface ColumnStandardization {
  originalName: string;
  standardizedName: string;
  namingConvention: string;
  reasoning: string;
}

export interface MissingValueStrategy {
  columnName: string;
  strategy: 'drop' | 'median' | 'mean' | 'mode' | 'forward_fill' | 'backward_fill' | 'interpolate' | 'model_based' | 'fixed_value';
  parameters: Record<string, any>;
  flagColumn: string;
  reasoning: string;
  impact: string;
}

export interface OutlierTreatmentStrategy {
  columnName: string;
  detectionMethod: string;
  treatmentMethod: 'cap' | 'winsorize' | 'remove' | 'transform' | 'flag_only';
  parameters: Record<string, any>;
  flagColumn: string;
  reasoning: string;
  expectedImpact: string;
}

export interface CategoricalEncodingStrategy {
  columnName: string;
  encodingMethod: 'one_hot' | 'ordinal' | 'target' | 'binary' | 'hash' | 'leave_as_is';
  parameters: Record<string, any>;
  resultingColumns: string[];
  reasoning: string;
  considerations: string[];
}

export interface NumericalTransformationStrategy {
  columnName: string;
  transformations: NumericalTransformation[];
  reasoning: string;
  mlConsiderations: string[];
}

export interface NumericalTransformation {
  transformation: 'log' | 'sqrt' | 'power' | 'box_cox' | 'yeo_johnson' | 'standard_scale' | 'min_max_scale' | 'robust_scale' | 'quantile_transform';
  parameters: Record<string, any>;
  resultingColumnName: string;
  purpose: string;
}

export interface DateTimeEngineeringStrategy {
  columnName: string;
  extractedFeatures: DateTimeFeature[];
  calculatedFeatures: CalculatedDateFeature[];
  reasoning: string;
}

export interface DateTimeFeature {
  featureName: string;
  extractionMethod: string;
  purpose: string;
}

export interface CalculatedDateFeature {
  featureName: string;
  calculationMethod: string;
  basedOnColumns: string[];
  purpose: string;
}

export interface TextProcessingStrategy {
  columnName: string;
  cleaningSteps: TextCleaningStep[];
  vectorizationMethod: 'tfidf' | 'count' | 'word2vec' | 'doc2vec' | 'bert' | 'none';
  vectorizationParameters: Record<string, any>;
  resultingFeatureCount: number;
  considerations: string[];
}

export interface TextCleaningStep {
  step: string;
  description: string;
  purpose: string;
}

export interface BooleanFeatureCreation {
  featureName: string;
  creationLogic: string;
  basedOnColumns: string[];
  purpose: string;
  businessRule: string;
}

export interface FeatureHashingRecommendation {
  columnName: string;
  currentCardinality: number;
  recommendedHashSize: number;
  reasoning: string;
  tradeoffs: string[];
}

// Scalability Assessment
export interface ScalabilityAssessment {
  currentMetrics: DataVolumeMetrics;
  scalabilityAnalysis: ScalabilityAnalysis;
  indexingRecommendations: IndexRecommendation[];
  partitioningStrategies: PartitioningStrategy[];
  performanceOptimizations: PerformanceOptimization[];
}

export interface DataVolumeMetrics {
  diskSizeMB: number;
  inMemorySizeMB: number;
  rowCount: number;
  columnCount: number;
  estimatedGrowthRate: number;
}

export interface ScalabilityAnalysis {
  currentCapability: string;
  futureProjections: FutureProjection[];
  technologyRecommendations: TechnologyRecommendation[];
  bottleneckAnalysis: BottleneckAnalysis[];
}

export interface FutureProjection {
  timeframe: string;
  projectedSize: number;
  projectedComplexity: string;
  recommendedApproach: string;
}

export interface TechnologyRecommendation {
  technology: string;
  useCase: string;
  benefits: string[];
  considerations: string[];
  implementationComplexity: 'low' | 'medium' | 'high';
}

export interface BottleneckAnalysis {
  component: string;
  currentLimitation: string;
  impactOnPerformance: string;
  mitigationStrategy: string;
}

export interface IndexRecommendation {
  indexType: 'primary' | 'unique' | 'btree' | 'hash' | 'composite';
  columns: string[];
  purpose: string;
  expectedImpact: string;
  maintenanceConsiderations: string;
}

export interface PartitioningStrategy {
  partitionType: 'range' | 'list' | 'hash' | 'composite';
  partitionColumns: string[];
  reasoning: string;
  expectedBenefits: string[];
  implementationNotes: string[];
}

export interface PerformanceOptimization {
  area: string;
  currentIssue: string;
  recommendation: string;
  expectedImprovement: string;
  implementationEffort: 'low' | 'medium' | 'high';
}

// Data Governance Considerations
export interface DataGovernanceConsiderations {
  sensitivityClassification: SensitivityClassification[];
  dataFreshnessAnalysis: DataFreshnessAnalysis;
  versioningRecommendations: VersioningRecommendation[];
  lineageConsiderations: LineageConsideration[];
  retentionPolicyRecommendations: RetentionPolicyRecommendation[];
  complianceConsiderations: ComplianceConsideration[];
}

export interface SensitivityClassification {
  columnName: string;
  sensitivityLevel: 'public' | 'internal' | 'confidential' | 'restricted';
  dataCategory: string;
  protectionRecommendations: string[];
  accessControlSuggestions: string[];
}

export interface DataFreshnessAnalysis {
  lastUpdateDetected: string | null;
  updateFrequencyEstimate: string;
  freshnessScore: number;
  implications: string[];
  recommendations: string[];
}

export interface VersioningRecommendation {
  strategy: string;
  implementation: string;
  benefits: string[];
  considerations: string[];
}

export interface LineageConsideration {
  aspect: string;
  recommendation: string;
  toolSuggestions: string[];
  implementationApproach: string;
}

export interface RetentionPolicyRecommendation {
  dataCategory: string;
  recommendedRetentionPeriod: string;
  reasoning: string;
  complianceFactors: string[];
}

export interface ComplianceConsideration {
  regulation: string;
  applicableColumns: string[];
  requirements: string[];
  recommendations: string[];
}

// ML Readiness Assessment
export interface MLReadinessAssessment {
  overallScore: number;
  enhancingFactors: MLEnhancingFactor[];
  remainingChallenges: MLChallenge[];
  featurePreparationMatrix: FeaturePreparationEntry[];
  modelingConsiderations: ModelingConsideration[];
}

export interface MLEnhancingFactor {
  factor: string;
  impact: 'high' | 'medium' | 'low';
  description: string;
}

export interface MLChallenge {
  challenge: string;
  severity: 'high' | 'medium' | 'low';
  impact: string;
  mitigationStrategy: string;
  estimatedEffort: string;
}

export interface FeaturePreparationEntry {
  featureName: string;
  originalColumn: string;
  finalDataType: string;
  keyIssues: string[];
  engineeringSteps: string[];
  finalMLFeatureType: string;
  modelingNotes: string[];
}

export interface ModelingConsideration {
  aspect: string;
  consideration: string;
  impact: string;
  recommendations: string[];
}

// Knowledge Base Output
export interface KnowledgeBaseOutput {
  datasetProfile: DatasetProfile;
  schemaRecommendations: SchemaRecommendationSummary[];
  inferredRelationships: InferredRelationshipSummary[];
  keyTransformations: TransformationSummary[];
}

export interface DatasetProfile {
  fileName: string;
  analysisDate: string;
  totalRows: number;
  totalColumnsOriginal: number;
  totalColumnsEngineeredForML: number;
  estimatedTechnicalDebtHours: number;
  mlReadinessScore: number;
}

export interface SchemaRecommendationSummary {
  columnNameOriginal: string;
  columnNameTarget: string;
  recommendedType: string;
  constraints: string[];
  transformations: string[];
}

export interface InferredRelationshipSummary {
  fromColumn: string;
  toTableColumn: string;
  relationshipType: string;
  confidence: string;
}

export interface TransformationSummary {
  featureGroup: string;
  steps: string[];
  impact: string;
}

// Helper Types
export interface RedundancyAnalysis {
  redundancyType: string;
  affectedColumns: string[];
  description: string;
  recommendedAction: string;
}

export interface NormalizationOpportunity {
  opportunity: string;
  affectedColumns: string[];
  normalizedForm: string;
  benefits: string[];
  considerations: string[];
}

export interface DenormalizationJustification {
  justification: string;
  affectedColumns: string[];
  reasoning: string;
  tradeoffs: string[];
}

// Configuration
export interface Section5Config {
  enabledAnalyses: ('schema' | 'integrity' | 'transformations' | 'scalability' | 'governance' | 'ml_readiness')[];
  targetDatabaseSystem: 'postgresql' | 'mysql' | 'sqlite' | 'generic_sql';
  mlFrameworkTarget: 'scikit_learn' | 'pytorch' | 'tensorflow' | 'generic';
  includeKnowledgeBase: boolean;
  governanceLevel: 'basic' | 'standard' | 'enterprise';
  performanceOptimizationLevel: 'basic' | 'moderate' | 'aggressive';
}

// Progress Tracking
export interface Section5Progress {
  stage: 'initialization' | 'schema_analysis' | 'integrity_analysis' | 'transformations' | 'scalability' | 'governance' | 'ml_readiness' | 'finalization';
  percentage: number;
  message: string;
  currentStep: number;
  totalSteps: number;
}