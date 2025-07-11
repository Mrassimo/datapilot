/**
 * Section 3: Exploratory Data Analysis (EDA) Deep Dive - Type Definitions
 * Comprehensive interfaces matching Section3.md specification
 */

// Semantic type classification for enhanced analysis
export enum SemanticType {
  CURRENCY = 'currency',
  AGE = 'age',
  IDENTIFIER = 'identifier',
  CATEGORY = 'category',
  STATUS = 'status',
  DEMOGRAPHIC = 'demographic',
  DATE_TRANSACTION = 'date_transaction',
  ORGANIZATIONAL_UNIT = 'organizational_unit',
  RATING = 'rating',
  PERCENTAGE = 'percentage',
  COUNT = 'count',
  UNKNOWN = 'unknown',
}

// Enhanced data type classification beyond basic types
export enum EdaDataType {
  NUMERICAL_FLOAT = 'numerical_float',
  NUMERICAL_INTEGER = 'numerical_integer',
  CATEGORICAL = 'categorical',
  DATE_TIME = 'date_time',
  BOOLEAN = 'boolean',
  TEXT_GENERAL = 'text_general',
  TEXT_ADDRESS = 'text_address',
}

// Base column profile for all analyses
export interface BaseColumnProfile {
  columnName: string;
  detectedDataType: EdaDataType;
  inferredSemanticType: SemanticType;
  dataQualityFlag: string; // From Section 2
  totalValues: number;
  missingValues: number;
  missingPercentage: number;
  uniqueValues: number;
  uniquePercentage: number;
}

// Descriptive statistics for numerical data
export interface DescriptiveStatistics {
  minimum: number;
  maximum: number;
  range: number;
  sum: number;
  mean: number;
  median: number;
  modes: Array<{ value: number; frequency: number; percentage: number }>;
  standardDeviation: number;
  variance: number;
  coefficientOfVariation: number;
}

// Quantile and percentile statistics
export interface QuantileStatistics {
  percentile1st: number;
  percentile5th: number;
  percentile10th: number;
  quartile1st: number; // 25th percentile
  quartile3rd: number; // 75th percentile
  percentile90th: number;
  percentile95th: number;
  percentile99th: number;
  interquartileRange: number;
  medianAbsoluteDeviation: number;
}

// Distribution shape analysis
export interface DistributionAnalysis {
  skewness: number;
  skewnessInterpretation: string;
  kurtosis: number; // Excess kurtosis
  kurtosisInterpretation: string;
  histogramSummary: string;
}

// Normality test results
export interface NormalityTests {
  shapiroWilk: {
    statistic: number;
    pValue: number;
    interpretation: string;
  };
  jarqueBera: {
    statistic: number;
    pValue: number;
    interpretation: string;
  };
  kolmogorovSmirnov: {
    statistic: number;
    pValue: number;
    interpretation: string;
  };
}

// Outlier detection methods
export interface OutlierAnalysis {
  iqrMethod: {
    lowerFence: number;
    upperFence: number;
    lowerOutliers: number;
    upperOutliers: number;
    lowerPercentage: number;
    upperPercentage: number;
    extremeOutliers: number;
    extremePercentage: number;
  };
  zScoreMethod: {
    threshold: number;
    lowerOutliers: number;
    upperOutliers: number;
  };
  modifiedZScoreMethod: {
    threshold: number;
    outliers: number;
  };
  summary: {
    totalOutliers: number;
    totalPercentage: number;
    minOutlierValue: number;
    maxOutlierValue: number;
    potentialImpact: string;
  };
}

// Numerical patterns and characteristics
export interface NumericalPatterns {
  zeroValuePercentage: number;
  negativeValuePercentage: number;
  roundNumbersNote: string;
  logTransformationPotential: string;
}

// Complete numerical column analysis
export interface NumericalColumnAnalysis extends BaseColumnProfile {
  descriptiveStats: DescriptiveStatistics;
  quantileStats: QuantileStatistics;
  distributionAnalysis: DistributionAnalysis;
  normalityTests: NormalityTests;
  outlierAnalysis: OutlierAnalysis;
  numericalPatterns: NumericalPatterns;
}

// Frequency distribution for categorical data
export interface CategoryFrequency {
  label: string;
  count: number;
  percentage: number;
  cumulativePercentage: number;
}

// Diversity and balance metrics
export interface DiversityMetrics {
  shannonEntropy: number;
  maxEntropy: number;
  giniImpurity: number;
  balanceInterpretation: string;
  majorCategoryDominance: string;
}

// Category label analysis
export interface CategoryLabelAnalysis {
  minLabelLength: number;
  maxLabelLength: number;
  avgLabelLength: number;
  emptyLabelsCount: number;
}

// Categorical analysis issues and recommendations
export interface CategoricalRecommendations {
  highCardinalityWarning?: string;
  rareCategoriesNote?: string;
  suspectedTyposNote?: string;
}

// Complete categorical column analysis
export interface CategoricalColumnAnalysis extends BaseColumnProfile {
  uniqueCategories: number;
  mostFrequentCategory: CategoryFrequency;
  secondMostFrequentCategory: CategoryFrequency;
  leastFrequentCategory: CategoryFrequency;
  frequencyDistribution: CategoryFrequency[];
  diversityMetrics: DiversityMetrics;
  labelAnalysis: CategoryLabelAnalysis;
  recommendations: CategoricalRecommendations;
}

// DateTime analysis
export interface DateTimeAnalysis extends BaseColumnProfile {
  minDateTime: Date;
  maxDateTime: Date;
  timeSpan: string;
  detectedGranularity: string;
  implicitPrecision: string;
  mostCommonYears: string[];
  mostCommonMonths: string[];
  mostCommonDaysOfWeek: string[];
  mostCommonHours: string[];
  temporalPatterns: string;
  gapAnalysis: string;
  validityNotes: string;
}

// Boolean analysis
export interface BooleanAnalysis extends BaseColumnProfile {
  trueCount: number;
  falseCount: number;
  truePercentage: number;
  falsePercentage: number;
  interpretation: string;
}

// Text analysis statistics
export interface TextStatistics {
  minCharLength: number;
  maxCharLength: number;
  avgCharLength: number;
  medianCharLength: number;
  stdCharLength: number;
  minWordCount: number;
  maxWordCount: number;
  avgWordCount: number;
}

// Text patterns
export interface TextPatterns {
  emptyStringPercentage: number;
  numericTextPercentage: number;
  urlCount: number;
  emailCount: number;
  urlPercentage: number;
  emailPercentage: number;
}

// Complete text column analysis
export interface TextColumnAnalysis extends BaseColumnProfile {
  textStatistics: TextStatistics;
  textPatterns: TextPatterns;
  topFrequentWords: string[];
}

// Union type for all column analyses
export type ColumnAnalysis =
  | NumericalColumnAnalysis
  | CategoricalColumnAnalysis
  | DateTimeAnalysis
  | BooleanAnalysis
  | TextColumnAnalysis;

// Correlation analysis
export interface CorrelationPair {
  variable1: string;
  variable2: string;
  correlation: number;
  pearsonCorrelation?: number;
  spearmanCorrelation?: number;
  pValue?: number;
  strength: string;
  direction: string;
  significance: string;
  sampleSize: number;
  interpretation?: string;
}

// Scatter plot insights
export interface ScatterPlotInsight {
  variable1: string;
  variable2: string;
  pattern: string;
  outlierCount: number;
  recommendedVisualization: string;
  insights: string;
  xVariable?: string; // For backward compatibility
  yVariable?: string; // For backward compatibility
  description?: string; // For backward compatibility
  rSquared?: number;
  slope?: number;
  intercept?: number;
}

// Numerical vs Numerical bivariate analysis
export interface NumericalBivariateAnalysis {
  totalPairsAnalyzed: number;
  correlationPairs: CorrelationPair[];
  strongestPositiveCorrelation: CorrelationPair | null;
  strongestNegativeCorrelation: CorrelationPair | null;
  strongCorrelations: CorrelationPair[];
  scatterPlotInsights: ScatterPlotInsight[];
  regressionInsights: Array<{
    dependent: string;
    independent: string;
    rSquared: number;
    slope: number;
    intercept: number;
  }>;
  correlationMatrix?: {
    variables: string[];
    pearsonMatrix: number[][];
    spearmanMatrix: number[][];
  };
  topPositiveCorrelations?: CorrelationPair[];
  topNegativeCorrelations?: CorrelationPair[];
}

// Group comparison statistics
export interface GroupComparison {
  category: string;
  count: number;
  mean: number;
  median: number;
  standardDeviation: number;
  quartile1st: number;
  quartile3rd: number;
  groupName?: string; // For backward compatibility
}

// Statistical test results for numerical vs categorical
export interface NumericalCategoricalTests {
  anova: {
    fStatistic: number;
    pValue: number;
    interpretation: string;
  };
  kruskalWallis: {
    hStatistic: number;
    pValue: number;
    interpretation: string;
  };
}

// Numerical vs Categorical bivariate analysis
export interface NumericalCategoricalAnalysis {
  numericalVariable: string;
  categoricalVariable: string;
  groupComparisons: GroupComparison[];
  statisticalTests: NumericalCategoricalTests;
  summary: string;
  variable?: string; // For backward compatibility
  groupingVariable?: string; // For backward compatibility
  boxPlotInsights?: string; // For backward compatibility
}

// Contingency table
export interface ContingencyTable {
  table: Record<string, Record<string, number>>;
  rowTotals: Record<string, number>;
  columnTotals: Record<string, number>;
  variable1?: string;
  variable2?: string;
  grandTotal?: number;
}

// Categorical vs Categorical tests
export interface CategoricalAssociationTests {
  chiSquare: {
    statistic: number;
    pValue: number;
    degreesOfFreedom: number;
    interpretation: string;
  };
  cramersV: {
    statistic: number;
    interpretation: string;
    value?: number; // For backward compatibility
  };
  contingencyCoefficient: {
    statistic: number;
    interpretation: string;
  };
  chiSquared?: {
    // For backward compatibility
    statistic: number;
    degreesOfFreedom: number;
    pValue: number;
    interpretation: string;
  };
}

// Categorical vs Categorical bivariate analysis
export interface CategoricalBivariateAnalysis {
  variable1: string;
  variable2: string;
  contingencyTable: ContingencyTable;
  associationTests: CategoricalAssociationTests;
  insights: string;
}

// Complete bivariate analysis
export interface BivariateAnalysis {
  numericalVsNumerical: NumericalBivariateAnalysis;
  numericalVsCategorical: NumericalCategoricalAnalysis[];
  categoricalVsCategorical: CategoricalBivariateAnalysis[];
  // Legacy compatibility properties for feature engineering
  column1?: string;
  column2?: string;
  correlation?: number;
}

// ===== MULTIVARIATE ANALYSIS TYPES =====

// Principal Component Analysis (PCA) results
export interface PrincipalComponent {
  componentNumber: number;
  eigenvalue: number;
  varianceExplained: number;
  cumulativeVarianceExplained: number;
  loadings: Record<string, number>; // Variable name -> loading value
  interpretation: string;
}

export interface PCAAnalysis {
  isApplicable: boolean;
  applicabilityReason: string;
  totalVariance: number;
  componentsAnalyzed: number;
  components: PrincipalComponent[];
  screeData: Array<{ component: number; eigenvalue: number }>;
  varianceThresholds: {
    componentsFor80Percent: number;
    componentsFor85Percent: number;
    componentsFor90Percent: number;
    componentsFor95Percent: number;
  };
  dominantVariables: Array<{
    variable: string;
    dominantComponent: number;
    maxLoading: number;
    interpretation: string;
  }>;
  dimensionalityRecommendations: string[];
  featureImportance?: Array<{
    variable: string;
    importance: number;
    contributingComponents: Array<{ component: number; loading: number; weight: number }>;
    interpretation: string;
  }>;
  variableSelection?: {
    selectedVariables: string[];
    rejectedVariables: string[];
    selectionRatio: number;
    method: string;
    rationale: string;
  };
  technicalDetails: {
    covarianceMatrix: number[][];
    correlationMatrix: number[][];
    standardizedData: boolean;
    numericVariablesUsed: string[];
    sampleSize: number;
    eigenvalueDecompositionConverged?: boolean;
  };
}

// Clustering analysis types
export interface ClusterValidationMetrics {
  silhouetteScore: number;
  silhouetteInterpretation: string;
  wcss: number; // Within-cluster sum of squares
  betweenClusterVariance: number;
  totalVariance: number;
  varianceExplainedRatio: number;
  daviesBouldinIndex?: number; // Lower is better
  calinskiHarabaszIndex?: number; // Higher is better
  dunnIndex?: number; // Higher is better
  qualityInterpretation?: string; // Overall quality assessment
  interpretation?: string; // General interpretation field
  stabilityAnalysis?: {
    stabilityScore: number;
    confidenceInterval: [number, number];
    interpretation: string;
  };
}

export interface ClusterProfile {
  clusterId: number;
  clusterName: string;
  size: number;
  percentage: number;
  centroid: Record<string, number>;
  characteristics: Array<{
    variable: string;
    mean: number;
    relativeToGlobal: 'much_higher' | 'higher' | 'similar' | 'lower' | 'much_lower';
    zScore: number;
    interpretation: string;
  }>;
  distinctiveFeatures: string[];
  description: string;
}

export interface KMeansAnalysis {
  isApplicable: boolean;
  applicabilityReason: string;
  optimalClusters: number;
  optimalityMethod: 'elbow' | 'silhouette' | 'gap_statistic';
  elbowAnalysis: Array<{
    k: number;
    wcss: number;
    silhouetteScore: number;
    improvement: number;
  }>;
  finalClustering: {
    k: number;
    converged: boolean;
    iterations: number;
    validation: ClusterValidationMetrics;
    clusterProfiles: ClusterProfile[];
  };
  insights: string[];
  recommendations: string[];
  technicalDetails: {
    numericVariablesUsed: string[];
    standardizedData: boolean;
    sampleSize: number;
    randomSeed: number;
  };
}

// Multivariate outlier detection
export interface MultivariateOutlier {
  rowIndex: number;
  mahalanobisDistance: number;
  pValue: number;
  isOutlier: boolean;
  severity: 'mild' | 'moderate' | 'extreme';
  affectedVariables: Array<{
    variable: string;
    value: number;
    zScore: number;
    contribution: number; // Contribution to outlier score
  }>;
  interpretation: string;
}

export interface MultivariateOutlierAnalysis {
  isApplicable: boolean;
  applicabilityReason: string;
  method: 'mahalanobis_distance';
  threshold: number;
  criticalValue: number;
  totalOutliers: number;
  outlierPercentage: number;
  outliers: MultivariateOutlier[];
  severityDistribution: {
    mild: number;
    moderate: number;
    extreme: number;
  };
  affectedVariables: Array<{
    variable: string;
    outliersCount: number;
    meanContribution: number;
  }>;
  recommendations: string[];
  technicalDetails: {
    numericVariablesUsed: string[];
    covarianceMatrix: number[][];
    sampleSize: number;
    degreesOfFreedom: number;
  };
}

// Multivariate normality and assumptions testing
export interface MultivariateNormalityTests {
  mardiasTest: {
    skewnessStatistic: number;
    kurtosisStatistic: number;
    skewnessPValue: number;
    kurtosisPValue: number;
    interpretation: string;
  };
  roystonTest: {
    statistic: number;
    pValue: number;
    interpretation: string;
  };
  overallAssessment: {
    isMultivariateNormal: boolean;
    confidence: number;
    violations: string[];
    recommendations: string[];
  };
}

// Multivariate relationship analysis
export interface MultivariateRelationshipAnalysis {
  variableInteractions: Array<{
    variables: string[];
    interactionType: 'linear' | 'non_linear' | 'threshold' | 'synergistic';
    strength: number;
    significance: number;
    interpretation: string;
  }>;
  correlationStructure: {
    stronglyCorrelatedGroups: Array<{
      variables: string[];
      avgCorrelation: number;
      description: string;
    }>;
    independentVariables: string[];
    redundantVariables: Array<{
      variable: string;
      redundantWith: string;
      correlation: number;
    }>;
  };
  dimensionalityInsights: {
    effectiveDimensionality: number;
    intrinsicDimensionality: number;
    dimensionalityReduction: {
      recommended: boolean;
      methods: string[];
      expectedVarianceRetention: number;
    };
  };
}

// Main multivariate analysis interface (replaces MultivariatePlaceholder)
export interface MultivariateAnalysis {
  summary: {
    analysisPerformed: boolean;
    applicabilityAssessment: string;
    numericVariablesCount: number;
    variablesAnalyzed: string[];
    sampleSize: number;
    analysisLimitations: string[];
  };
  principalComponentAnalysis: PCAAnalysis;
  clusteringAnalysis: KMeansAnalysis;
  outlierDetection: MultivariateOutlierAnalysis;
  normalityTests: MultivariateNormalityTests;
  relationshipAnalysis: MultivariateRelationshipAnalysis;
  insights: {
    keyFindings: string[];
    dataQualityIssues: string[];
    hypothesesGenerated: string[];
    preprocessingRecommendations: string[];
    analysisRecommendations: string[];
  };
  technicalMetadata: {
    analysisTime: number;
    memoryUsage: string;
    computationalComplexity: string;
    algorithmsUsed: string[];
  };

  // Backward compatibility fields
  keyPatterns?: string[];
  pcaOverview?: {
    componentsFor85PercentVariance: number;
    dominantVariables: string[];
  };
  clusterAnalysis?: {
    optimalClusters: number;
    clusterProfiles: Array<{
      clusterName: string;
      description: string;
      keyCharacteristics: Record<string, number>;
    }>;
  };
  interactionTerms?: string[];
}

// Key insights and hypotheses
export interface EdaInsights {
  topFindings: string[];
  dataQualityIssues: string[];
  hypothesesGenerated: string[];
  preprocessingRecommendations: string[];
}

// Main Section 3 EDA result
export interface Section3EdaAnalysis {
  univariateAnalysis: ColumnAnalysis[];
  bivariateAnalysis: BivariateAnalysis;
  multivariateAnalysis: MultivariateAnalysis;
  crossVariableInsights: EdaInsights;
  methodology?: {
    approach: string;
    columnTypeClassification: string;
    statisticalSignificance: string;
    samplingNote: string;
  };
  insights?: EdaInsights; // For backward compatibility
  generatedAt?: Date;
  version?: string;
}

// Configuration for EDA analysis
export interface Section3Config {
  enabledAnalyses: string[];
  significanceLevel: number; // Default 0.05
  maxCorrelationPairs: number;
  outlierMethods: ('iqr' | 'zscore' | 'modified_zscore')[];
  normalityTests: ('shapiro' | 'jarque_bera' | 'ks_test')[];
  maxCategoricalLevels: number; // For high cardinality warning
  enableMultivariate: boolean;
  samplingThreshold: number; // For intensive computations
  useStreamingAnalysis?: boolean; // Use streaming algorithms for memory efficiency

  // Advanced statistical configuration (from global config)
  alternativeSignificanceLevels?: {
    normalityTests: number;
    correlationTests: number;
    hypothesisTests: number;
    outlierDetection: number;
  };
  confidenceLevel?: number;
  correlationThresholds?: {
    weak: number;
    moderate: number;
    strong: number;
    veryStrong: number;
  };
  outlierThresholds?: {
    zScoreThreshold: number;
    modifiedZScoreThreshold: number;
    iqrMultiplier: number;
  };
  normalityThresholds?: {
    shapiroWilkMinSample: number;
    shapiroWilkMaxSample: number;
    jarqueBeraThreshold: number;
    ksTestThreshold: number;
  };
}

// Progress tracking
export interface Section3Progress {
  stage: string;
  percentage: number;
  message: string;
  currentStep: number;
  totalSteps: number;
  phase?:
    | 'initialization'
    | 'univariate'
    | 'bivariate'
    | 'multivariate'
    | 'insights'
    | 'report-generation';
  progress?: number; // 0-100
  currentOperation?: string;
  timeElapsed?: number;
  estimatedTimeRemaining?: number;
}

// Warning system
export interface Section3Warning {
  category: 'performance' | 'statistical' | 'data' | 'computation' | 'error';
  severity: 'low' | 'medium' | 'high';
  message: string;
  impact?: string;
  suggestion?: string;
}

// Final result interface
export interface Section3Result {
  edaAnalysis: Section3EdaAnalysis;
  warnings: Section3Warning[];
  performanceMetrics: {
    totalAnalysisTime?: number;
    analysisTimeMs?: number;
    rowsAnalyzed?: number;
    chunksProcessed?: number;
    peakMemoryMB?: number;
    avgChunkSize?: number;
    memoryEfficiency?: string;
    peakMemoryUsage?: number;
    phases?: Record<string, number>;
  };
  metadata?: {
    analysisApproach: string;
    datasetSize: number;
    columnsAnalyzed: number;
    samplingApplied: boolean;
  };
}

// Input interface for the main analyzer
export interface Section3AnalyzerInput {
  data: (string | number | null | undefined)[][];
  headers: string[];
  columnTypes: EdaDataType[];
  rowCount: number;
  columnCount: number;
  filePath?: string; // For streaming analysis
  config?: Section3Config;
  onProgress?: (progress: Section3Progress) => void;
}
