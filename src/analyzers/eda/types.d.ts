/**
 * Section 3: Exploratory Data Analysis (EDA) Deep Dive - Type Definitions
 * Comprehensive interfaces matching Section3.md specification
 */
export declare enum SemanticType {
    CURRENCY = "currency",
    AGE = "age",
    IDENTIFIER = "identifier",
    CATEGORY = "category",
    STATUS = "status",
    DEMOGRAPHIC = "demographic",
    DATE_TRANSACTION = "date_transaction",
    ORGANIZATIONAL_UNIT = "organizational_unit",
    RATING = "rating",
    PERCENTAGE = "percentage",
    COUNT = "count",
    UNKNOWN = "unknown"
}
export declare enum EdaDataType {
    NUMERICAL_FLOAT = "numerical_float",
    NUMERICAL_INTEGER = "numerical_integer",
    CATEGORICAL = "categorical",
    DATE_TIME = "date_time",
    BOOLEAN = "boolean",
    TEXT_GENERAL = "text_general",
    TEXT_ADDRESS = "text_address"
}
export interface BaseColumnProfile {
    columnName: string;
    detectedDataType: EdaDataType;
    inferredSemanticType: SemanticType;
    dataQualityFlag: string;
    totalValues: number;
    missingValues: number;
    missingPercentage: number;
    uniqueValues: number;
    uniquePercentage: number;
}
export interface DescriptiveStatistics {
    minimum: number;
    maximum: number;
    range: number;
    sum: number;
    mean: number;
    median: number;
    modes: Array<{
        value: number;
        frequency: number;
        percentage: number;
    }>;
    standardDeviation: number;
    variance: number;
    coefficientOfVariation: number;
}
export interface QuantileStatistics {
    percentile1st: number;
    percentile5th: number;
    percentile10th: number;
    quartile1st: number;
    quartile3rd: number;
    percentile90th: number;
    percentile95th: number;
    percentile99th: number;
    interquartileRange: number;
    medianAbsoluteDeviation: number;
}
export interface DistributionAnalysis {
    skewness: number;
    skewnessInterpretation: string;
    kurtosis: number;
    kurtosisInterpretation: string;
    histogramSummary: string;
}
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
export interface NumericalPatterns {
    zeroValuePercentage: number;
    negativeValuePercentage: number;
    roundNumbersNote: string;
    logTransformationPotential: string;
}
export interface NumericalColumnAnalysis extends BaseColumnProfile {
    descriptiveStats: DescriptiveStatistics;
    quantileStats: QuantileStatistics;
    distributionAnalysis: DistributionAnalysis;
    normalityTests: NormalityTests;
    outlierAnalysis: OutlierAnalysis;
    numericalPatterns: NumericalPatterns;
}
export interface CategoryFrequency {
    label: string;
    count: number;
    percentage: number;
    cumulativePercentage: number;
}
export interface DiversityMetrics {
    shannonEntropy: number;
    maxEntropy: number;
    giniImpurity: number;
    balanceInterpretation: string;
    majorCategoryDominance: string;
}
export interface CategoryLabelAnalysis {
    minLabelLength: number;
    maxLabelLength: number;
    avgLabelLength: number;
    emptyLabelsCount: number;
}
export interface CategoricalRecommendations {
    highCardinalityWarning?: string;
    rareCategoriesNote?: string;
    suspectedTyposNote?: string;
}
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
export interface BooleanAnalysis extends BaseColumnProfile {
    trueCount: number;
    falseCount: number;
    truePercentage: number;
    falsePercentage: number;
    interpretation: string;
}
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
export interface TextPatterns {
    emptyStringPercentage: number;
    numericTextPercentage: number;
    urlCount: number;
    emailCount: number;
    urlPercentage: number;
    emailPercentage: number;
}
export interface TextColumnAnalysis extends BaseColumnProfile {
    textStatistics: TextStatistics;
    textPatterns: TextPatterns;
    topFrequentWords: string[];
}
export type ColumnAnalysis = NumericalColumnAnalysis | CategoricalColumnAnalysis | DateTimeAnalysis | BooleanAnalysis | TextColumnAnalysis;
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
export interface ScatterPlotInsight {
    variable1: string;
    variable2: string;
    pattern: string;
    outlierCount: number;
    recommendedVisualization: string;
    insights: string;
    xVariable?: string;
    yVariable?: string;
    description?: string;
    rSquared?: number;
    slope?: number;
    intercept?: number;
}
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
export interface GroupComparison {
    category: string;
    count: number;
    mean: number;
    median: number;
    standardDeviation: number;
    quartile1st: number;
    quartile3rd: number;
    groupName?: string;
}
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
export interface NumericalCategoricalAnalysis {
    numericalVariable: string;
    categoricalVariable: string;
    groupComparisons: GroupComparison[];
    statisticalTests: NumericalCategoricalTests;
    summary: string;
    variable?: string;
    groupingVariable?: string;
    boxPlotInsights?: string;
}
export interface ContingencyTable {
    table: Record<string, Record<string, number>>;
    rowTotals: Record<string, number>;
    columnTotals: Record<string, number>;
    variable1?: string;
    variable2?: string;
    grandTotal?: number;
}
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
        value?: number;
    };
    contingencyCoefficient: {
        statistic: number;
        interpretation: string;
    };
    chiSquared?: {
        statistic: number;
        degreesOfFreedom: number;
        pValue: number;
        interpretation: string;
    };
}
export interface CategoricalBivariateAnalysis {
    variable1: string;
    variable2: string;
    contingencyTable: ContingencyTable;
    associationTests: CategoricalAssociationTests;
    insights: string;
}
export interface BivariateAnalysis {
    numericalVsNumerical: NumericalBivariateAnalysis;
    numericalVsCategorical: NumericalCategoricalAnalysis[];
    categoricalVsCategorical: CategoricalBivariateAnalysis[];
    column1?: string;
    column2?: string;
    correlation?: number;
}
export interface PrincipalComponent {
    componentNumber: number;
    eigenvalue: number;
    varianceExplained: number;
    cumulativeVarianceExplained: number;
    loadings: Record<string, number>;
    interpretation: string;
}
export interface PCAAnalysis {
    isApplicable: boolean;
    applicabilityReason: string;
    totalVariance: number;
    componentsAnalyzed: number;
    components: PrincipalComponent[];
    screeData: Array<{
        component: number;
        eigenvalue: number;
    }>;
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
        contributingComponents: Array<{
            component: number;
            loading: number;
            weight: number;
        }>;
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
export interface ClusterValidationMetrics {
    silhouetteScore: number;
    silhouetteInterpretation: string;
    wcss: number;
    betweenClusterVariance: number;
    totalVariance: number;
    varianceExplainedRatio: number;
    daviesBouldinIndex?: number;
    calinskiHarabaszIndex?: number;
    dunnIndex?: number;
    qualityInterpretation?: string;
    interpretation?: string;
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
        contribution: number;
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
export interface EdaInsights {
    topFindings: string[];
    dataQualityIssues: string[];
    hypothesesGenerated: string[];
    preprocessingRecommendations: string[];
}
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
    insights?: EdaInsights;
    generatedAt?: Date;
    version?: string;
}
export interface Section3Config {
    enabledAnalyses: string[];
    significanceLevel: number;
    maxCorrelationPairs: number;
    outlierMethods: ('iqr' | 'zscore' | 'modified_zscore')[];
    normalityTests: ('shapiro' | 'jarque_bera' | 'ks_test')[];
    maxCategoricalLevels: number;
    enableMultivariate: boolean;
    samplingThreshold: number;
    useStreamingAnalysis?: boolean;
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
export interface Section3Progress {
    stage: string;
    percentage: number;
    message: string;
    currentStep: number;
    totalSteps: number;
    phase?: 'initialization' | 'univariate' | 'bivariate' | 'multivariate' | 'insights' | 'report-generation';
    progress?: number;
    currentOperation?: string;
    timeElapsed?: number;
    estimatedTimeRemaining?: number;
}
export interface Section3Warning {
    category: 'performance' | 'statistical' | 'data' | 'computation' | 'error';
    severity: 'low' | 'medium' | 'high';
    message: string;
    impact?: string;
    suggestion?: string;
}
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
export interface Section3AnalyzerInput {
    data: (string | number | null | undefined)[][];
    headers: string[];
    columnTypes: EdaDataType[];
    rowCount: number;
    columnCount: number;
    filePath?: string;
    config?: Section3Config;
    onProgress?: (progress: Section3Progress) => void;
}
//# sourceMappingURL=types.d.ts.map