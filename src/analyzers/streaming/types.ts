/**
 * Streaming Analyzer Types
 * Type definitions for streaming data analysis components
 */

import { DataType } from '../../core/types';
import type { Section3Config } from '../eda/types';

// Streaming configuration
export interface StreamingConfig {
  chunkSize: number;
  memoryThreshold: number;
  enableAdaptiveChunking?: boolean;
  maxChunkSize?: number;
  minChunkSize?: number;
}

// Streaming analyzer configuration (extending Section3Config for compatibility)
export interface StreamingAnalyzerConfig extends Section3Config {
  chunkSize: number;
  memoryThresholdMB: number;
  maxRowsAnalyzed: number;
  adaptiveChunkSizing: boolean;
  enableMemoryOptimization: boolean;
  enableAdaptiveStreaming: boolean;
  enableParallelProcessing: boolean;
}

// Base streaming analyzer input (for test compatibility)
export interface StreamingAnalyzerInput {
  data: string[][];
  headers: string[];
  columnTypes: DataType[];
  config?: StreamingConfig;
}

// Bivariate analyzer configuration
export interface BivariateConfig {
  significanceLevel: number;
  maxComparisons: number;
  enableAdvancedTests?: boolean;
  correlationThreshold?: number;
}

// Bivariate analyzer input
export interface BivariateAnalyzerInput {
  data: string[][];
  headers: string[];
  columnTypes: DataType[];
  numericalColumns: string[];
  categoricalColumns: string[];
  config?: BivariateConfig;
}

// Processing summary for streaming operations
export interface ProcessingSummary {
  totalRowsProcessed: number;
  chunksProcessed: number;
  memoryUsage: {
    peakUsage: number;
    averageUsage: number;
  };
  processingTime: number;
}

// Column analysis result for streaming
export interface StreamingColumnAnalysis {
  columnName: string;
  dataType: DataType;
  statistics: {
    count: number;
    uniqueValues?: number;
    nullCount?: number;
    mean?: number;
    standardDeviation?: number;
    min?: number;
    max?: number;
  };
}

// Streaming analyzer result
export interface StreamingAnalyzerResult {
  columnAnalyses: StreamingColumnAnalysis[];
  processingSummary: ProcessingSummary;
  metadata: {
    analysisStartTime: Date;
    analysisEndTime: Date;
    version: string;
  };
}

// Bivariate relationship result
export interface BivariateRelationship {
  column1: string;
  column2: string;
  relationshipType: 'numerical-numerical' | 'numerical-categorical' | 'categorical-categorical';
  strength: number;
  significance: number;
  method: string;
}

// Bivariate analyzer result
export interface BivariateAnalyzerResult {
  numericalRelationships: BivariateRelationship[];
  categoricalRelationships: BivariateRelationship[];
  mixedRelationships: BivariateRelationship[];
  metadata: {
    totalComparisons: number;
    significantRelationships: number;
    analysisTime: number;
  };
}