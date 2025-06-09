/**
 * Core type definitions for DataPilot
 */
export declare enum DataType {
    STRING = "string",
    NUMBER = "number",
    INTEGER = "integer",
    FLOAT = "float",
    DATE = "date",
    DATETIME = "datetime",
    BOOLEAN = "boolean",
    UNKNOWN = "unknown"
}
export interface CSVParsingOptions {
    delimiter?: string;
    quote?: string;
    escape?: string;
    encoding?: BufferEncoding;
    hasHeader?: boolean;
    lineEnding?: '\n' | '\r\n';
    skipEmptyLines?: boolean;
    maxRows?: number;
}
export interface CSVMetadata {
    filename: string;
    filepath: string;
    fileSize: number;
    createdAt: Date;
    modifiedAt: Date;
    hash: string;
    encoding: BufferEncoding;
    encodingConfidence: number;
    delimiter: string;
    delimiterConfidence: number;
    lineEnding: string;
    quote: string;
    hasHeader: boolean;
    rowCount: number;
    columnCount: number;
    estimatedMemorySize: number;
}
export interface ColumnMetadata {
    index: number;
    name: string;
    dataType: DataType;
    nullCount: number;
    uniqueCount: number;
    exampleValues: unknown[];
}
export interface ColumnStatistics {
    column: string;
    dataType: DataType;
    count: number;
    missing: number;
    unique: number;
    mean?: number;
    median?: number;
    mode?: unknown;
    stdDev?: number;
    variance?: number;
    min?: number | Date;
    max?: number | Date;
    quartiles?: [number, number, number];
    skewness?: number;
    kurtosis?: number;
}
export interface QualityDimension {
    score: number;
    issues: QualityIssue[];
    recommendations: string[];
}
export interface QualityIssue {
    severity: 'low' | 'medium' | 'high' | 'critical';
    column?: string;
    rowIndices?: number[];
    description: string;
    impact: string;
}
export interface DataQualityReport {
    overallScore: number;
    completeness: QualityDimension;
    accuracy: QualityDimension;
    consistency: QualityDimension;
    timeliness: QualityDimension;
    uniqueness: QualityDimension;
    validity: QualityDimension;
    technicalDebt: {
        estimatedHours: number;
        complexity: 'low' | 'medium' | 'high';
        automationPotential: number;
    };
}
export interface AnalysisResult<T> {
    section: string;
    timestamp: Date;
    processingTime: number;
    data: T;
    warnings?: string[];
    errors?: string[];
}
export interface DataPilotReport {
    metadata: {
        version: string;
        analysisDate: Date;
        commandExecuted: string;
        totalProcessingTime: number;
    };
    sections: {
        overview?: AnalysisResult<CSVMetadata & {
            columns: ColumnMetadata[];
        }>;
        quality?: AnalysisResult<DataQualityReport>;
        eda?: AnalysisResult<EDAReport>;
        visualization?: AnalysisResult<VisualizationRecommendations>;
        engineering?: AnalysisResult<EngineeringInsights>;
        modeling?: AnalysisResult<ModelingGuidance>;
    };
}
export interface EDAReport {
    univariate: ColumnStatistics[];
    bivariate: {
        correlations: CorrelationMatrix;
        associations: Association[];
    };
    multivariate?: {
        pcaSuggestion?: string;
        clusteringSuggestion?: string;
    };
    outliers: OutlierAnalysis[];
    distributions: DistributionAnalysis[];
}
export interface CorrelationMatrix {
    method: 'pearson' | 'spearman';
    matrix: number[][];
    columns: string[];
    significantPairs: Array<{
        column1: string;
        column2: string;
        correlation: number;
        pValue?: number;
    }>;
}
export interface Association {
    column1: string;
    column2: string;
    testType: 'chi-squared' | 'anova' | 'kruskal-wallis';
    statistic: number;
    pValue: number;
    effectSize?: number;
}
export interface OutlierAnalysis {
    column: string;
    method: 'iqr' | 'z-score' | 'modified-z-score' | 'isolation-forest';
    outlierCount: number;
    outlierPercentage: number;
    outlierIndices: number[];
}
export interface DistributionAnalysis {
    column: string;
    shapiroWilk?: {
        statistic: number;
        pValue: number;
    };
    jarqueBera?: {
        statistic: number;
        pValue: number;
    };
    normalityAssessment: 'normal' | 'possibly-normal' | 'non-normal';
}
export interface VisualizationRecommendations {
    primaryVisualizations: ChartRecommendation[];
    dashboardConcepts: DashboardConcept[];
    colorPalettes: ColorPalette[];
}
export interface ChartRecommendation {
    chartType: string;
    purpose: string;
    variables: {
        x?: string;
        y?: string | string[];
        color?: string;
        size?: string;
    };
    effectivenessScore: number;
    data?: unknown[];
    designTips: string[];
}
export interface DashboardConcept {
    name: string;
    description: string;
    charts: string[];
    layout: string;
}
export interface ColorPalette {
    name: string;
    colors: string[];
    colorblindSafe: boolean;
    useCase: string;
}
export interface EngineeringInsights {
    currentSchema: SchemaDefinition;
    optimizedSchema: SchemaDefinition;
    transformations: Transformation[];
    relationships: Relationship[];
    mlReadiness: MLReadinessAssessment;
}
export interface SchemaDefinition {
    columns: Array<{
        name: string;
        dataType: string;
        nullable: boolean;
        constraints?: string[];
    }>;
    ddl: string;
}
export interface Transformation {
    type: 'imputation' | 'encoding' | 'scaling' | 'feature-engineering';
    column: string;
    method: string;
    rationale: string;
    code?: string;
}
export interface Relationship {
    type: 'primary-key' | 'foreign-key' | 'one-to-many' | 'many-to-many';
    columns: string[];
    confidence: number;
    description: string;
}
export interface MLReadinessAssessment {
    score: number;
    readyFeatures: string[];
    featuresNeedingWork: Array<{
        feature: string;
        issues: string[];
        recommendations: string[];
    }>;
}
export interface ModelingGuidance {
    identifiedTasks: ModelingTask[];
    recommendedAlgorithms: AlgorithmRecommendation[];
    workflowGuidance: WorkflowStep[];
    evaluationStrategy: EvaluationStrategy;
    ethicalConsiderations: string[];
}
export interface ModelingTask {
    taskType: 'regression' | 'classification' | 'clustering' | 'time-series';
    targetVariable?: string;
    confidence: number;
    rationale: string;
}
export interface AlgorithmRecommendation {
    algorithm: string;
    suitabilityScore: number;
    pros: string[];
    cons: string[];
    hyperparameters?: Record<string, unknown>;
    specialNotes?: string[];
}
export interface WorkflowStep {
    step: number;
    name: string;
    description: string;
    considerations: string[];
}
export interface EvaluationStrategy {
    metrics: string[];
    crossValidation: string;
    testSetSize: number;
    additionalChecks: string[];
}
export declare enum ErrorSeverity {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    CRITICAL = "critical"
}
export declare enum ErrorCategory {
    PARSING = "parsing",
    VALIDATION = "validation",
    ANALYSIS = "analysis",
    MEMORY = "memory",
    IO = "io",
    CONFIGURATION = "configuration",
    NETWORK = "network",
    PERMISSION = "permission"
}
export interface ErrorContext {
    filePath?: string;
    section?: string;
    analyzer?: string;
    rowIndex?: number;
    columnIndex?: number;
    columnName?: string;
    operationName?: string;
    memoryUsage?: number;
    timeElapsed?: number;
    retryCount?: number;
    option?: string;
    options?: string;
    rowCount?: number;
    value?: unknown;
}
export interface ErrorRecoveryStrategy {
    strategy: 'skip' | 'retry' | 'fallback' | 'abort' | 'continue';
    fallbackValue?: unknown;
    maxRetries?: number;
    retryDelay?: number;
    condition?: (error: DataPilotError) => boolean;
}
export interface ActionableSuggestion {
    action: string;
    description: string;
    severity: ErrorSeverity;
    automated?: boolean;
    command?: string;
}
export declare class DataPilotError extends Error {
    code: string;
    severity: ErrorSeverity;
    category: ErrorCategory;
    context?: ErrorContext | undefined;
    suggestions?: ActionableSuggestion[] | undefined;
    recoverable: boolean;
    details?: unknown | undefined;
    constructor(message: string, code: string, severity?: ErrorSeverity, category?: ErrorCategory, context?: ErrorContext | undefined, suggestions?: ActionableSuggestion[] | undefined, recoverable?: boolean, details?: unknown | undefined);
    /**
     * Create a parsing error with appropriate context
     */
    static parsing(message: string, code: string, context?: ErrorContext, suggestions?: ActionableSuggestion[]): DataPilotError;
    /**
     * Create a memory error with appropriate context
     */
    static memory(message: string, code: string, context?: ErrorContext, suggestions?: ActionableSuggestion[]): DataPilotError;
    /**
     * Create a validation error with appropriate context
     */
    static validation(message: string, code: string, context?: ErrorContext, suggestions?: ActionableSuggestion[]): DataPilotError;
    /**
     * Create an analysis error with graceful degradation
     */
    static analysis(message: string, code: string, context?: ErrorContext, suggestions?: ActionableSuggestion[]): DataPilotError;
    /**
     * Get formatted error message with context
     */
    getFormattedMessage(): string;
    /**
     * Get actionable suggestions as formatted text
     */
    getSuggestions(): string[];
}
export interface DataPilotConfig {
    maxFileSize?: number;
    maxRowsInMemory?: number;
    outputFormat?: 'markdown' | 'json' | 'yaml';
    verbosity?: 'quiet' | 'normal' | 'verbose';
    parallelProcessing?: boolean;
    customAnalyzers?: string[];
}
//# sourceMappingURL=types.d.ts.map