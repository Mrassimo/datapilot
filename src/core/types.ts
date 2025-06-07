/**
 * Core type definitions for DataPilot
 */

// Data Types
export enum DataType {
  STRING = 'string',
  NUMBER = 'number',
  INTEGER = 'integer',
  FLOAT = 'float',
  DATE = 'date',
  DATETIME = 'datetime',
  BOOLEAN = 'boolean',
  UNKNOWN = 'unknown',
}

// CSV Parsing Types
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

// Column Types
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

// Quality Assessment Types
export interface QualityDimension {
  score: number; // 0-100
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
    automationPotential: number; // 0-100
  };
}

// Analysis Results
export interface AnalysisResult<T> {
  section: string;
  timestamp: Date;
  processingTime: number; // milliseconds
  data: T;
  warnings?: string[];
  errors?: string[];
}

// Report Types
export interface DataPilotReport {
  metadata: {
    version: string;
    analysisDate: Date;
    commandExecuted: string;
    totalProcessingTime: number;
  };
  sections: {
    overview?: AnalysisResult<CSVMetadata & { columns: ColumnMetadata[] }>;
    quality?: AnalysisResult<DataQualityReport>;
    eda?: AnalysisResult<EDAReport>;
    visualization?: AnalysisResult<VisualizationRecommendations>;
    engineering?: AnalysisResult<EngineeringInsights>;
    modeling?: AnalysisResult<ModelingGuidance>;
  };
}

// EDA Types
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
  shapiroWilk?: { statistic: number; pValue: number };
  jarqueBera?: { statistic: number; pValue: number };
  normalityAssessment: 'normal' | 'possibly-normal' | 'non-normal';
}

// Visualization Types
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
  effectivenessScore: number; // 0-100
  data?: unknown[]; // Aggregated data for the chart
  designTips: string[];
}

export interface DashboardConcept {
  name: string;
  description: string;
  charts: string[]; // References to recommended charts
  layout: string;
}

export interface ColorPalette {
  name: string;
  colors: string[];
  colorblindSafe: boolean;
  useCase: string;
}

// Engineering Types
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
  score: number; // 0-100
  readyFeatures: string[];
  featuresNeedingWork: Array<{
    feature: string;
    issues: string[];
    recommendations: string[];
  }>;
}

// Modeling Types
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

// Error Types
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum ErrorCategory {
  PARSING = 'parsing',
  VALIDATION = 'validation',
  ANALYSIS = 'analysis',
  MEMORY = 'memory',
  IO = 'io',
  CONFIGURATION = 'configuration',
  NETWORK = 'network',
  PERMISSION = 'permission'
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

export class DataPilotError extends Error {
  constructor(
    message: string,
    public code: string,
    public severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    public category: ErrorCategory = ErrorCategory.ANALYSIS,
    public context?: ErrorContext,
    public suggestions?: ActionableSuggestion[],
    public recoverable: boolean = true,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'DataPilotError';
  }

  /**
   * Create a parsing error with appropriate context
   */
  static parsing(
    message: string,
    code: string,
    context?: ErrorContext,
    suggestions?: ActionableSuggestion[]
  ): DataPilotError {
    return new DataPilotError(
      message,
      code,
      ErrorSeverity.HIGH,
      ErrorCategory.PARSING,
      context,
      suggestions,
      true
    );
  }

  /**
   * Create a memory error with appropriate context
   */
  static memory(
    message: string,
    code: string,
    context?: ErrorContext,
    suggestions?: ActionableSuggestion[]
  ): DataPilotError {
    return new DataPilotError(
      message,
      code,
      ErrorSeverity.CRITICAL,
      ErrorCategory.MEMORY,
      context,
      suggestions,
      true
    );
  }

  /**
   * Create a validation error with appropriate context
   */
  static validation(
    message: string,
    code: string,
    context?: ErrorContext,
    suggestions?: ActionableSuggestion[]
  ): DataPilotError {
    return new DataPilotError(
      message,
      code,
      ErrorSeverity.HIGH,
      ErrorCategory.VALIDATION,
      context,
      suggestions,
      false
    );
  }

  /**
   * Create an analysis error with graceful degradation
   */
  static analysis(
    message: string,
    code: string,
    context?: ErrorContext,
    suggestions?: ActionableSuggestion[]
  ): DataPilotError {
    return new DataPilotError(
      message,
      code,
      ErrorSeverity.MEDIUM,
      ErrorCategory.ANALYSIS,
      context,
      suggestions,
      true
    );
  }

  /**
   * Get formatted error message with context
   */
  getFormattedMessage(): string {
    let message = `[${this.category.toUpperCase()}:${this.code}] ${this.message}`;
    
    if (this.context) {
      const contextParts = [];
      if (this.context.filePath) contextParts.push(`File: ${this.context.filePath}`);
      if (this.context.section) contextParts.push(`Section: ${this.context.section}`);
      if (this.context.analyzer) contextParts.push(`Analyzer: ${this.context.analyzer}`);
      if (this.context.rowIndex !== undefined) contextParts.push(`Row: ${this.context.rowIndex}`);
      if (this.context.columnName) contextParts.push(`Column: ${this.context.columnName}`);
      
      if (contextParts.length > 0) {
        message += ` (${contextParts.join(', ')})`;
      }
    }
    
    return message;
  }

  /**
   * Get actionable suggestions as formatted text
   */
  getSuggestions(): string[] {
    if (!this.suggestions || this.suggestions.length === 0) {
      return [];
    }
    
    return this.suggestions.map(suggestion => {
      let text = `• ${suggestion.action}: ${suggestion.description}`;
      if (suggestion.command) {
        text += ` (Run: ${suggestion.command})`;
      }
      return text;
    });
  }
}

// Configuration Types (Legacy - replaced by new config system)
export interface DataPilotConfig {
  maxFileSize?: number;
  maxRowsInMemory?: number;
  outputFormat?: 'markdown' | 'json' | 'yaml';
  verbosity?: 'quiet' | 'normal' | 'verbose';
  parallelProcessing?: boolean;
  customAnalyzers?: string[];
}
