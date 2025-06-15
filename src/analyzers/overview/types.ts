/**
 * Section 1: Dataset Overview - Type Definitions
 * Comprehensive interfaces matching section1.md specification
 */

export interface FileMetadata {
  originalFilename: string;
  fullResolvedPath: string;
  fileSizeBytes: number;
  fileSizeMB: number;
  mimeType: string;
  lastModified: Date;
  sha256Hash: string;
  compressionAnalysis?: CompressionAnalysis;
  healthCheck?: FileHealthCheck;
}

export interface EncodingDetection {
  encoding: BufferEncoding;
  detectionMethod: string;
  confidence: number; // 0-100
  bomDetected: boolean;
  bomType?: string;
}

export interface DelimiterDetection {
  delimiter: string;
  detectionMethod: string;
  confidence: number; // 0-100
  alternativesConsidered: Array<{
    delimiter: string;
    score: number;
  }>;
}

export interface ParsingMetadata {
  dataSourceType: 'Local File System';
  parsingEngine: string;
  parsingTimeSeconds: number;
  encoding: EncodingDetection;
  delimiter: DelimiterDetection;
  lineEnding: 'LF' | 'CRLF';
  quotingCharacter: string;
  emptyLinesEncountered: number;
  headerProcessing: {
    headerPresence: 'Detected' | 'Not Detected' | 'Uncertain';
    headerRowNumbers: number[];
    columnNamesSource: string;
  };
  initialScanLimit: {
    method: string;
    linesScanned: number;
    bytesScanned: number;
  };
}

export interface ColumnInventory {
  index: number;
  name: string;
  originalIndex: number;
}

export interface StructuralDimensions {
  totalRowsRead: number;
  totalDataRows: number;
  totalColumns: number;
  totalDataCells: number;
  columnInventory: ColumnInventory[];
  estimatedInMemorySizeMB: number;
  averageRowLengthBytes: number;
  sparsityAnalysis: {
    sparsityPercentage: number;
    method: string;
    sampleSize: number;
    description: string;
  };
  quickStatistics?: QuickColumnStatistics;
}

export interface SystemEnvironment {
  operatingSystem: string;
  systemArchitecture: string;
  executionRuntime: string;
  availableCpuCores: number;
  availableMemoryGB: number;
  nodeVersion: string;
}

export interface ExecutionContext {
  fullCommandExecuted: string;
  analysisMode: string;
  analysisStartTimestamp: Date;
  globalSamplingStrategy: string;
  activatedModules: string[];
  processingTimeSeconds: number;
  hostEnvironment?: SystemEnvironment; // Optional based on privacy settings
}

export interface Section1Overview {
  fileDetails: FileMetadata;
  parsingMetadata: ParsingMetadata;
  structuralDimensions: StructuralDimensions;
  executionContext: ExecutionContext;
  dataPreview?: DataPreview;
  generatedAt: Date;
  version: string;
}

// Analysis configuration
export interface Section1Config {
  includeHostEnvironment: boolean;
  enableFileHashing: boolean;
  maxSampleSizeForSparsity: number;
  privacyMode: 'full' | 'redacted' | 'minimal';
  detailedProfiling: boolean;
  enableCompressionAnalysis: boolean;
  enableDataPreview: boolean;
  previewRows: number;
  enableHealthChecks: boolean;
  enableQuickStatistics: boolean;
}

// Progress tracking for long operations
export interface Section1Progress {
  phase: 'file-analysis' | 'parsing' | 'structural-analysis' | 'report-generation';
  progress: number; // 0-100
  currentOperation: string;
  timeElapsed: number;
  estimatedTimeRemaining?: number;
}

// Error handling
export interface Section1Warning {
  category: 'file' | 'parsing' | 'structural' | 'environment';
  severity: 'low' | 'medium' | 'high';
  message: string;
  impact?: string;
  suggestion?: string;
}

export interface Section1Result {
  overview: Section1Overview;
  warnings: Section1Warning[];
  performanceMetrics: {
    totalAnalysisTime: number;
    peakMemoryUsage?: number;
    phases: Record<string, number>;
  };
}

// New interfaces for enhanced features

export interface CompressionAnalysis {
  originalSizeBytes: number;
  estimatedGzipSizeBytes: number;
  estimatedGzipReduction: number; // percentage
  estimatedParquetSizeBytes: number;
  estimatedParquetReduction: number; // percentage
  columnEntropy: Array<{
    columnName: string;
    entropy: number;
    compressionPotential: 'high' | 'medium' | 'low';
  }>;
  recommendedFormat: 'gzip' | 'parquet' | 'none';
  analysisMethod: string;
}

export interface FileHealthCheck {
  bomDetected: boolean;
  bomType?: string;
  lineEndingConsistency: 'consistent' | 'mixed' | 'unknown';
  nullBytesDetected: boolean;
  validEncodingThroughout: boolean;
  largeFileWarning: boolean;
  recommendations: string[];
  healthScore: number; // 0-100
}

export interface DataPreview {
  headerRow?: string[];
  sampleRows: string[][];
  totalRowsShown: number;
  totalRowsInFile: number;
  truncated: boolean;
  previewMethod: 'head' | 'sample' | 'stratified';
  generationTimeMs: number;
}

export interface QuickColumnStatistics {
  numericColumns: number;
  textColumns: number;
  dateColumns: number;
  booleanColumns: number;
  emptyColumns: number;
  highCardinalityColumns: number; // >50% unique
  lowCardinalityColumns: number; // <10% unique
  potentialIdColumns: string[];
  columnTypes: Array<{
    columnName: string;
    detectedType: 'numeric' | 'text' | 'date' | 'boolean' | 'empty' | 'mixed';
    uniqueValueCount: number;
    cardinality: 'high' | 'medium' | 'low';
  }>;
  analysisMethod: string;
  sampleSize: number;
}
