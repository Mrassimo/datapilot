/**
 * Comprehensive Join Type System for DataPilot Join Intelligence Engine
 * Phase 1: Foundation Architecture - Core type definitions
 */

export interface TableMeta {
  filePath: string;
  tableName: string;
  schema: ColumnSchema[];
  rowCount: number;
  estimatedSize: number;
  lastModified: Date;
  encoding?: string;
  delimiter?: string;
}

export interface ColumnSchema {
  name: string;
  type: DataType;
  nullable: boolean;
  unique: boolean;
  distinctCount: number;
  nullCount: number;
  minValue?: any;
  maxValue?: any;
  avgLength?: number;
  patterns: string[];
  examples: any[];
}

export enum DataType {
  STRING = 'string',
  INTEGER = 'integer',
  FLOAT = 'float',
  DATE = 'date',
  DATETIME = 'datetime',
  BOOLEAN = 'boolean',
  UUID = 'uuid',
  EMAIL = 'email',
  PHONE = 'phone',
  URL = 'url'
}

export enum CardinalityType {
  ONE_TO_ONE = '1:1',
  ONE_TO_MANY = '1:N',
  MANY_TO_ONE = 'N:1',
  MANY_TO_MANY = 'N:M'
}

export enum JoinType {
  INNER = 'INNER',
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
  FULL_OUTER = 'FULL_OUTER',
  CROSS = 'CROSS'
}

export enum JoinStrategy {
  EXACT_MATCH = 'EXACT_MATCH',
  FUZZY_MATCH = 'FUZZY_MATCH', 
  RANGE_OVERLAP = 'RANGE_OVERLAP',
  SEMANTIC_MATCH = 'SEMANTIC_MATCH',
  PATTERN_MATCH = 'PATTERN_MATCH',
  STATISTICAL_MATCH = 'STATISTICAL_MATCH'
}

export interface JoinCandidate {
  leftTable: TableMeta;
  rightTable: TableMeta;
  leftColumn: string;
  rightColumn: string;
  strategy: JoinStrategy;
  confidence: number;
  cardinality: CardinalityType;
  estimatedRows: number;
  qualityMetrics: JoinQualityMetrics;
}

export interface JoinQualityMetrics {
  dataLoss: number;           // % of records lost in join (0-100)
  duplication: number;        // Record multiplication factor
  consistency: number;        // Referential integrity score (0-100)
  performance: JoinPerformance;
  confidence: number;         // ML confidence in join accuracy (0-100)
}

export interface JoinPerformance {
  estimatedTime: number;      // Milliseconds
  estimatedMemory: number;    // Bytes
  complexity: 'LOW' | 'MEDIUM' | 'HIGH';
  indexRecommended: boolean;
}

export interface ForeignKeyCandidate {
  table: string;
  column: string;
  referencedTable: string;
  referencedColumn: string;
  confidence: number;
  matchingRows: number;
  totalRows: number;
  violations: number;
}

export interface TableDependencyGraph {
  nodes: TableNode[];
  edges: DependencyEdge[];
  cycles: TableNode[][];
  depth: number;
}

export interface TableNode {
  table: TableMeta;
  level: number;
  children: string[];
  parents: string[];
  isRoot: boolean;
  isLeaf: boolean;
}

export interface DependencyEdge {
  from: string;
  to: string;
  columns: ColumnRelationship[];
  strength: number;
  type: 'FK' | 'INFERRED' | 'BUSINESS_RULE';
}

export interface ColumnRelationship {
  fromColumn: string;
  toColumn: string;
  similarity: number;
  cardinality: CardinalityType;
}

export interface BusinessRule {
  name: string;
  description: string;
  tables: string[];
  conditions: string[];
  confidence: number;
  source: 'INFERRED' | 'USER_DEFINED' | 'DOMAIN_KNOWLEDGE';
}

export interface TemporalJoin {
  leftTable: string;
  rightTable: string;
  leftTimeColumn: string;
  rightTimeColumn: string;
  strategy: 'EXACT' | 'NEAREST' | 'RANGE' | 'SLIDING_WINDOW';
  tolerance?: number;
  unit?: 'SECONDS' | 'MINUTES' | 'HOURS' | 'DAYS';
}

export interface JoinConfidence {
  overall: number;
  semantic: number;
  statistical: number;
  structural: number;
  domain: number;
}

export interface IntegrityReport {
  validJoins: JoinCandidate[];
  brokenRelationships: BrokenRelationship[];
  orphanedRecords: OrphanedRecord[];
  circularDependencies: string[][];
  recommendations: string[];
}

export interface BrokenRelationship {
  fromTable: string;
  toTable: string;
  fromColumn: string;
  toColumn: string;
  violationCount: number;
  violationExamples: any[];
}

export interface OrphanedRecord {
  table: string;
  column: string;
  value: any;
  count: number;
}

export interface JoinAnalysisResult {
  summary: JoinSummary;
  candidates: JoinCandidate[];
  dependencyGraph: TableDependencyGraph;
  integrityReport: IntegrityReport;
  businessRules: BusinessRule[];
  temporalJoins: TemporalJoin[];
  recommendations: JoinRecommendation[];
  performance: PerformanceAnalysis;
}

export interface JoinSummary {
  tablesAnalyzed: number;
  totalRows: number;
  joinCandidatesFound: number;
  highConfidenceJoins: number;
  potentialIssues: number;
  analysisTime: number;
}

export interface JoinRecommendation {
  type: 'PERFORMANCE' | 'QUALITY' | 'BUSINESS_LOGIC' | 'SCHEMA_DESIGN';
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  description: string;
  impact: string;
  implementation: string;
  estimatedEffort: 'MINUTES' | 'HOURS' | 'DAYS';
}

export interface PerformanceAnalysis {
  overallComplexity: 'LOW' | 'MEDIUM' | 'HIGH';
  bottlenecks: PerformanceBottleneck[];
  optimizations: OptimizationSuggestion[];
  scalabilityAssessment: ScalabilityAssessment;
}

export interface PerformanceBottleneck {
  location: string;
  type: 'MEMORY' | 'CPU' | 'IO' | 'NETWORK';
  severity: number;
  description: string;
}

export interface OptimizationSuggestion {
  category: 'INDEX' | 'ALGORITHM' | 'CACHING' | 'PARTITIONING';
  description: string;
  expectedImprovement: string;
  implementationComplexity: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface ScalabilityAssessment {
  currentCapacity: DataVolume;
  projectedCapacity: DataVolume;
  scalingStrategy: 'VERTICAL' | 'HORIZONTAL' | 'HYBRID';
  recommendations: string[];
}

export interface DataVolume {
  rows: number;
  sizeGB: number;
  tables: number;
  complexity: string;
}

// Configuration interfaces
export interface JoinAnalysisConfig {
  maxTables: number;
  confidenceThreshold: number;
  enableFuzzyMatching: boolean;
  enableSemanticAnalysis: boolean;
  enableTemporalJoins: boolean;
  performanceMode: 'FAST' | 'BALANCED' | 'THOROUGH';
  outputFormats: OutputFormat[];
}

export interface OutputFormat {
  type: 'JSON' | 'MARKDOWN' | 'HTML' | 'PDF' | 'SQL' | 'DIAGRAM';
  path?: string;
  options?: Record<string, any>;
}

// Error handling
export class JoinAnalysisError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'JoinAnalysisError';
  }
}

export enum JoinErrorCode {
  INVALID_TABLE = 'INVALID_TABLE',
  INCOMPATIBLE_SCHEMAS = 'INCOMPATIBLE_SCHEMAS', 
  MEMORY_LIMIT_EXCEEDED = 'MEMORY_LIMIT_EXCEEDED',
  TIMEOUT = 'TIMEOUT',
  CIRCULAR_DEPENDENCY = 'CIRCULAR_DEPENDENCY',
  NO_JOIN_CANDIDATES = 'NO_JOIN_CANDIDATES'
}