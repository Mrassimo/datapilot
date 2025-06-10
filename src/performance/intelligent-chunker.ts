/**
 * Intelligent Chunking Engine
 * Advanced chunk size adaptation based on data characteristics and system performance
 */

import { EventEmitter } from 'events';
import { performance } from 'perf_hooks';
import { promises as fs } from 'fs';
import { getGlobalMemoryOptimizer } from './memory-optimizer';
import { logger } from '../utils/logger';

interface ChunkingOptions {
  baseChunkSize?: number;
  minChunkSize?: number;
  maxChunkSize?: number;
  adaptationSensitivity?: number;
  performanceWindow?: number;
  complexityWeights?: ComplexityWeights;
  enableLearning?: boolean;
  maxLearningHistory?: number;
}

interface ComplexityWeights {
  dataTypeComplexity: number;
  encodingComplexity: number;
  structuralComplexity: number;
  contentComplexity: number;
  memoryPressure: number;
  ioPerformance: number;
}

interface DataCharacteristics {
  fileSize: number;
  estimatedRows: number;
  averageLineLength: number;
  encoding: string;
  hasQuotedFields: boolean;
  hasEscapedFields: boolean;
  columnCount: number;
  dataTypes: string[];
  nullDensity: number;
  compressionRatio: number;
}

interface SystemMetrics {
  memoryPressure: number;
  cpuUsage: number;
  ioLatency: number;
  throughput: number;
  errorRate: number;
}

interface ChunkDecision {
  chunkSize: number;
  reasoning: string[];
  confidence: number;
  adaptationFactors: {
    dataComplexity: number;
    systemPerformance: number;
    memoryConstraint: number;
    learningAdjustment: number;
  };
  expectedPerformance: {
    processingTime: number;
    memoryUsage: number;
    throughput: number;
  };
}

interface LearningData {
  chunkSize: number;
  dataCharacteristics: DataCharacteristics;
  systemMetrics: SystemMetrics;
  actualPerformance: {
    processingTime: number;
    memoryUsage: number;
    throughput: number;
    errorCount: number;
  };
  satisfaction: number; // 0-1 score based on performance vs expectations
}

/**
 * Intelligent chunk size adaptation with machine learning
 */
export class IntelligentChunker extends EventEmitter {
  private options: Required<ChunkingOptions>;
  private performanceHistory: LearningData[] = [];
  private recentDecisions: ChunkDecision[] = [];
  private learningModel: Map<string, number> = new Map();
  private systemBaseline: SystemMetrics;

  constructor(options: ChunkingOptions = {}) {
    super();
    
    this.options = {
      baseChunkSize: options.baseChunkSize || 64 * 1024, // 64KB
      minChunkSize: options.minChunkSize || 4 * 1024,    // 4KB
      maxChunkSize: options.maxChunkSize || 16 * 1024 * 1024, // 16MB
      adaptationSensitivity: options.adaptationSensitivity || 0.2,
      performanceWindow: options.performanceWindow || 10,
      complexityWeights: {
        dataTypeComplexity: 0.25,
        encodingComplexity: 0.15,
        structuralComplexity: 0.20,
        contentComplexity: 0.15,
        memoryPressure: 0.15,
        ioPerformance: 0.10,
        ...options.complexityWeights
      },
      enableLearning: options.enableLearning ?? true,
      maxLearningHistory: options.maxLearningHistory || 1000
    };

    this.systemBaseline = this.getCurrentSystemMetrics();
    this.initializeLearningModel();
    
    logger.info(`Intelligent chunker initialized with learning ${this.options.enableLearning ? 'enabled' : 'disabled'}`);
  }

  /**
   * Analyze data characteristics from file sample
   */
  async analyzeDataCharacteristics(filePath: string, sampleSize: number = 64 * 1024): Promise<DataCharacteristics> {
    const fileStats = await fs.stat(filePath);
    const actualSampleSize = Math.min(sampleSize, fileStats.size);
    
    const fileHandle = await fs.open(filePath, 'r');
    const buffer = Buffer.alloc(actualSampleSize);
    
    try {
      await fileHandle.read(buffer, 0, actualSampleSize, 0);
      const sampleText = buffer.toString('utf8');
      
      // Analyze structure
      const lines = sampleText.split(/\r?\n/);
      const nonEmptyLines = lines.filter(line => line.trim().length > 0);
      const averageLineLength = nonEmptyLines.reduce((sum, line) => sum + line.length, 0) / nonEmptyLines.length;
      const estimatedRows = Math.floor(fileStats.size / averageLineLength);
      
      // Detect encoding complexity
      const encoding = this.detectEncoding(buffer);
      
      // Analyze content complexity
      const hasQuotedFields = /["']/.test(sampleText);
      const hasEscapedFields = /\\["'\\]/.test(sampleText);
      const firstLine = nonEmptyLines[0] || '';
      const columnCount = this.estimateColumnCount(firstLine);
      
      // Estimate data types
      const dataTypes = this.estimateDataTypes(nonEmptyLines.slice(0, 10));
      
      // Calculate null density
      const nullPatterns = /^$|^null$|^NULL$|^na$|^NA$|^n\/a$|^N\/A$/gi;
      const totalFields = nonEmptyLines.slice(0, 100).reduce((sum, line) => {
        return sum + line.split(',').length;
      }, 0);
      const nullFields = nonEmptyLines.slice(0, 100).reduce((sum, line) => {
        return sum + line.split(',').filter(field => nullPatterns.test(field.trim())).length;
      }, 0);
      const nullDensity = totalFields > 0 ? nullFields / totalFields : 0;
      
      // Estimate compression ratio (simple heuristic)
      const uniqueChars = new Set(sampleText).size;
      const compressionRatio = uniqueChars / 256; // Rough estimate
      
      return {
        fileSize: fileStats.size,
        estimatedRows,
        averageLineLength,
        encoding,
        hasQuotedFields,
        hasEscapedFields,
        columnCount,
        dataTypes,
        nullDensity,
        compressionRatio
      };
      
    } finally {
      await fileHandle.close();
    }
  }

  /**
   * Calculate optimal chunk size based on data characteristics and system state
   */
  calculateOptimalChunkSize(
    dataCharacteristics: DataCharacteristics,
    currentSystemMetrics?: SystemMetrics
  ): ChunkDecision {
    const systemMetrics = currentSystemMetrics || this.getCurrentSystemMetrics();
    const reasoning: string[] = [];
    
    // Base chunk size
    let chunkSize = this.options.baseChunkSize;
    reasoning.push(`Starting with base chunk size: ${this.formatBytes(chunkSize)}`);
    
    // Data complexity analysis
    const dataComplexity = this.calculateDataComplexity(dataCharacteristics);
    const dataComplexityFactor = Math.max(0.3, Math.min(2.0, 1 / dataComplexity));
    chunkSize *= dataComplexityFactor;
    reasoning.push(`Data complexity factor: ${dataComplexityFactor.toFixed(2)} (complexity: ${dataComplexity.toFixed(2)})`);
    
    // System performance analysis
    const systemPerformanceFactor = this.calculateSystemPerformanceFactor(systemMetrics);
    chunkSize *= systemPerformanceFactor;
    reasoning.push(`System performance factor: ${systemPerformanceFactor.toFixed(2)}`);
    
    // Memory constraint analysis
    const memoryOptimizer = getGlobalMemoryOptimizer();
    const memoryRecommendation = memoryOptimizer.getAdaptiveChunkSize(chunkSize, dataComplexity);
    const memoryConstraintFactor = memoryRecommendation.recommendedSize / chunkSize;
    chunkSize = memoryRecommendation.recommendedSize;
    reasoning.push(`Memory constraint factor: ${memoryConstraintFactor.toFixed(2)} (${memoryRecommendation.reason})`);
    
    // Learning-based adjustment
    let learningAdjustment = 1.0;
    if (this.options.enableLearning && this.performanceHistory.length > 10) {
      learningAdjustment = this.calculateLearningAdjustment(dataCharacteristics, systemMetrics, chunkSize);
      chunkSize *= learningAdjustment;
      reasoning.push(`Learning adjustment: ${learningAdjustment.toFixed(2)} (from ${this.performanceHistory.length} historical samples)`);
    }
    
    // Apply bounds
    const originalChunkSize = chunkSize;
    chunkSize = Math.max(this.options.minChunkSize, Math.min(this.options.maxChunkSize, chunkSize));
    if (chunkSize !== originalChunkSize) {
      reasoning.push(`Applied bounds: ${this.formatBytes(originalChunkSize)} → ${this.formatBytes(chunkSize)}`);
    }
    
    // Calculate confidence based on data quality and learning history
    const confidence = this.calculateConfidence(dataCharacteristics, systemMetrics);
    
    // Predict expected performance
    const expectedPerformance = this.predictPerformance(chunkSize, dataCharacteristics, systemMetrics);
    
    const decision: ChunkDecision = {
      chunkSize: Math.round(chunkSize),
      reasoning,
      confidence,
      adaptationFactors: {
        dataComplexity: dataComplexityFactor,
        systemPerformance: systemPerformanceFactor,
        memoryConstraint: memoryConstraintFactor,
        learningAdjustment
      },
      expectedPerformance
    };
    
    // Store decision for learning
    this.recentDecisions.push(decision);
    if (this.recentDecisions.length > this.options.performanceWindow) {
      this.recentDecisions.shift();
    }
    
    this.emit('chunk-decision', decision);
    return decision;
  }

  /**
   * Record actual performance for learning
   */
  recordPerformance(
    chunkSize: number,
    dataCharacteristics: DataCharacteristics,
    actualPerformance: LearningData['actualPerformance']
  ): void {
    if (!this.options.enableLearning) return;
    
    const systemMetrics = this.getCurrentSystemMetrics();
    
    // Calculate satisfaction score
    const recentDecision = this.recentDecisions.find(d => Math.abs(d.chunkSize - chunkSize) < chunkSize * 0.1);
    const satisfaction = recentDecision 
      ? this.calculateSatisfaction(recentDecision.expectedPerformance, actualPerformance)
      : 0.5; // Neutral score if no matching decision found
    
    const learningData: LearningData = {
      chunkSize,
      dataCharacteristics,
      systemMetrics,
      actualPerformance,
      satisfaction
    };
    
    this.performanceHistory.push(learningData);
    
    // Maintain history size
    if (this.performanceHistory.length > this.options.maxLearningHistory) {
      this.performanceHistory.shift();
    }
    
    // Update learning model
    this.updateLearningModel(learningData);
    
    this.emit('performance-recorded', learningData);
  }

  /**
   * Calculate data complexity score
   */
  private calculateDataComplexity(data: DataCharacteristics): number {
    const weights = this.options.complexityWeights;
    let complexity = 0;
    
    // Data type complexity
    const typeComplexity = this.calculateTypeComplexity(data.dataTypes);
    complexity += typeComplexity * weights.dataTypeComplexity;
    
    // Encoding complexity
    const encodingComplexity = this.calculateEncodingComplexity(data.encoding);
    complexity += encodingComplexity * weights.encodingComplexity;
    
    // Structural complexity
    const structuralComplexity = this.calculateStructuralComplexity(data);
    complexity += structuralComplexity * weights.structuralComplexity;
    
    // Content complexity
    const contentComplexity = this.calculateContentComplexity(data);
    complexity += contentComplexity * weights.contentComplexity;
    
    return Math.max(0.1, Math.min(5.0, complexity));
  }

  /**
   * Calculate system performance factor
   */
  private calculateSystemPerformanceFactor(metrics: SystemMetrics): number {
    // Higher factor for better performance, lower for worse
    const memoryFactor = Math.max(0.3, 1 - metrics.memoryPressure);
    const ioFactor = Math.max(0.3, Math.min(2.0, metrics.throughput / 50)); // Normalized to 50 MB/s baseline
    const latencyFactor = Math.max(0.3, Math.min(2.0, 100 / Math.max(1, metrics.ioLatency))); // Normalized to 100ms baseline
    
    return memoryFactor * ioFactor * latencyFactor;
  }

  /**
   * Calculate learning-based adjustment
   */
  private calculateLearningAdjustment(
    dataCharacteristics: DataCharacteristics,
    systemMetrics: SystemMetrics,
    proposedChunkSize: number
  ): number {
    const similarCases = this.findSimilarCases(dataCharacteristics, systemMetrics);
    if (similarCases.length === 0) return 1.0;
    
    // Calculate weighted average of adjustments from similar cases
    const totalWeight = similarCases.reduce((sum, case_) => sum + case_.weight, 0);
    const weightedAdjustment = similarCases.reduce((sum, case_) => {
      const adjustment = case_.data.chunkSize / proposedChunkSize;
      return sum + (adjustment * case_.weight * case_.data.satisfaction);
    }, 0) / totalWeight;
    
    // Apply dampening to prevent wild swings
    const dampening = 0.3;
    return 1.0 + (weightedAdjustment - 1.0) * dampening;
  }

  /**
   * Find similar historical cases for learning
   */
  private findSimilarCases(
    dataCharacteristics: DataCharacteristics,
    systemMetrics: SystemMetrics,
    maxCases: number = 10
  ): Array<{ data: LearningData; similarity: number; weight: number }> {
    const similarities = this.performanceHistory.map(historyData => {
      const dataSimilarity = this.calculateDataSimilarity(dataCharacteristics, historyData.dataCharacteristics);
      const systemSimilarity = this.calculateSystemSimilarity(systemMetrics, historyData.systemMetrics);
      const overallSimilarity = (dataSimilarity + systemSimilarity) / 2;
      
      return {
        data: historyData,
        similarity: overallSimilarity,
        weight: overallSimilarity * historyData.satisfaction
      };
    });
    
    return similarities
      .filter(item => item.similarity > 0.3) // Minimum similarity threshold
      .sort((a, b) => b.weight - a.weight)
      .slice(0, maxCases);
  }

  /**
   * Calculate data similarity between two data characteristics
   */
  private calculateDataSimilarity(data1: DataCharacteristics, data2: DataCharacteristics): number {
    const fileSizeSimilarity = 1 - Math.abs(Math.log10(data1.fileSize) - Math.log10(data2.fileSize)) / 3; // 3 orders of magnitude
    const rowSimilarity = 1 - Math.abs(Math.log10(data1.estimatedRows) - Math.log10(data2.estimatedRows)) / 3;
    const columnSimilarity = 1 - Math.abs(data1.columnCount - data2.columnCount) / Math.max(data1.columnCount, data2.columnCount);
    const typeSimilarity = this.calculateTypeSetSimilarity(data1.dataTypes, data2.dataTypes);
    
    return (fileSizeSimilarity + rowSimilarity + columnSimilarity + typeSimilarity) / 4;
  }

  /**
   * Calculate system similarity between two system metrics
   */
  private calculateSystemSimilarity(metrics1: SystemMetrics, metrics2: SystemMetrics): number {
    const memoryPressureSimilarity = 1 - Math.abs(metrics1.memoryPressure - metrics2.memoryPressure);
    const throughputSimilarity = 1 - Math.abs(metrics1.throughput - metrics2.throughput) / Math.max(metrics1.throughput, metrics2.throughput);
    const latencySimilarity = 1 - Math.abs(metrics1.ioLatency - metrics2.ioLatency) / Math.max(metrics1.ioLatency, metrics2.ioLatency);
    
    return (memoryPressureSimilarity + throughputSimilarity + latencySimilarity) / 3;
  }

  /**
   * Calculate satisfaction score from expected vs actual performance
   */
  private calculateSatisfaction(expected: ChunkDecision['expectedPerformance'], actual: LearningData['actualPerformance']): number {
    const timeRatio = Math.min(2, expected.processingTime / Math.max(0.1, actual.processingTime));
    const memoryRatio = Math.min(2, expected.memoryUsage / Math.max(0.1, actual.memoryUsage));
    const throughputRatio = Math.min(2, actual.throughput / Math.max(0.1, expected.throughput));
    const errorPenalty = Math.max(0, 1 - actual.errorCount * 0.1);
    
    return (timeRatio + memoryRatio + throughputRatio) / 3 * errorPenalty;
  }

  /**
   * Helper methods for complexity calculations
   */
  private calculateTypeComplexity(dataTypes: string[]): number {
    const complexityMap: { [key: string]: number } = {
      'string': 1.0,
      'integer': 0.8,
      'number': 0.9,
      'boolean': 0.6,
      'date': 1.2,
      'time': 1.3,
      'datetime': 1.4,
      'json': 2.0,
      'xml': 2.2,
      'binary': 1.8
    };
    
    const avgComplexity = dataTypes.reduce((sum, type) => sum + (complexityMap[type] || 1.0), 0) / dataTypes.length;
    return avgComplexity;
  }

  private calculateEncodingComplexity(encoding: string): number {
    const complexityMap: { [key: string]: number } = {
      'ascii': 0.5,
      'utf8': 1.0,
      'utf16': 1.3,
      'latin1': 0.8,
      'binary': 1.5
    };
    
    return complexityMap[encoding.toLowerCase()] || 1.0;
  }

  private calculateStructuralComplexity(data: DataCharacteristics): number {
    let complexity = 1.0;
    
    if (data.hasQuotedFields) complexity += 0.3;
    if (data.hasEscapedFields) complexity += 0.4;
    if (data.nullDensity > 0.1) complexity += data.nullDensity * 0.5;
    if (data.columnCount > 50) complexity += Math.log10(data.columnCount / 50) * 0.3;
    
    return complexity;
  }

  private calculateContentComplexity(data: DataCharacteristics): number {
    let complexity = 1.0;
    
    complexity += (1 - data.compressionRatio) * 0.5; // Less compressible = more complex
    complexity += Math.min(1.0, data.averageLineLength / 1000) * 0.3; // Longer lines = more complex
    
    return complexity;
  }

  /**
   * Utility methods
   */
  private getCurrentSystemMetrics(): SystemMetrics {
    const memoryOptimizer = getGlobalMemoryOptimizer();
    const memoryPressure = memoryOptimizer.getMemoryPressure();
    
    return {
      memoryPressure,
      cpuUsage: 0.5, // Placeholder - would need actual CPU monitoring
      ioLatency: 10,  // Placeholder - would need actual I/O monitoring
      throughput: 50, // Placeholder - would need actual throughput monitoring
      errorRate: 0.0
    };
  }

  private detectEncoding(buffer: Buffer): string {
    // Simple encoding detection
    const text = buffer.toString('utf8');
    const hasNonAscii = /[^\x00-\x7F]/.test(text);
    return hasNonAscii ? 'utf8' : 'ascii';
  }

  private estimateColumnCount(line: string): number {
    // Simple CSV column estimation
    return line.split(',').length;
  }

  private estimateDataTypes(lines: string[]): string[] {
    if (lines.length === 0) return [];
    
    const firstDataLine = lines.find(line => line.trim() && !line.startsWith('#'));
    if (!firstDataLine) return [];
    
    const fields = firstDataLine.split(',');
    return fields.map(field => {
      const trimmed = field.trim().replace(/['"]/g, '');
      
      if (/^\d+$/.test(trimmed)) return 'integer';
      if (/^\d*\.\d+$/.test(trimmed)) return 'number';
      if (/^(true|false)$/i.test(trimmed)) return 'boolean';
      if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return 'date';
      if (/^[{[]/.test(trimmed)) return 'json';
      
      return 'string';
    });
  }

  private calculateTypeSetSimilarity(types1: string[], types2: string[]): number {
    const set1 = new Set(types1);
    const set2 = new Set(types2);
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return union.size > 0 ? intersection.size / union.size : 1;
  }

  private calculateConfidence(data: DataCharacteristics, metrics: SystemMetrics): number {
    let confidence = 0.5; // Base confidence
    
    // Higher confidence for more data
    if (this.performanceHistory.length > 10) confidence += 0.2;
    if (this.performanceHistory.length > 50) confidence += 0.1;
    
    // Higher confidence for stable system metrics
    if (metrics.memoryPressure < 0.6) confidence += 0.1;
    if (metrics.errorRate < 0.01) confidence += 0.1;
    
    // Lower confidence for unusual data characteristics
    if (data.nullDensity > 0.3) confidence -= 0.1;
    if (data.columnCount > 100) confidence -= 0.1;
    
    return Math.max(0.1, Math.min(1.0, confidence));
  }

  private predictPerformance(
    chunkSize: number,
    data: DataCharacteristics,
    metrics: SystemMetrics
  ): ChunkDecision['expectedPerformance'] {
    // Simple performance prediction model
    const baseProcessingTimePerByte = 0.000001; // 1 microsecond per byte
    const complexity = this.calculateDataComplexity(data);
    
    const processingTime = chunkSize * baseProcessingTimePerByte * complexity / Math.max(0.1, 1 - metrics.memoryPressure);
    const memoryUsage = chunkSize * 1.5; // Assume 50% overhead
    const throughput = chunkSize / processingTime / 1024 / 1024; // MB/s
    
    return {
      processingTime,
      memoryUsage,
      throughput
    };
  }

  private initializeLearningModel(): void {
    // Initialize with some basic patterns
    this.learningModel.set('small_file_factor', 1.5);
    this.learningModel.set('large_file_factor', 0.8);
    this.learningModel.set('complex_data_factor', 0.7);
    this.learningModel.set('simple_data_factor', 1.2);
  }

  private updateLearningModel(learningData: LearningData): void {
    // Simple learning model update
    const dataSize = learningData.dataCharacteristics.fileSize;
    const complexity = this.calculateDataComplexity(learningData.dataCharacteristics);
    
    if (dataSize < 1024 * 1024) { // Small file
      const currentFactor = this.learningModel.get('small_file_factor') || 1.0;
      const newFactor = currentFactor * 0.9 + (learningData.satisfaction * 2) * 0.1;
      this.learningModel.set('small_file_factor', newFactor);
    }
    
    if (complexity > 2.0) { // Complex data
      const currentFactor = this.learningModel.get('complex_data_factor') || 1.0;
      const newFactor = currentFactor * 0.9 + (learningData.satisfaction * 2) * 0.1;
      this.learningModel.set('complex_data_factor', newFactor);
    }
  }

  private formatBytes(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(unitIndex > 0 ? 1 : 0)}${units[unitIndex]}`;
  }

  /**
   * Get learning statistics
   */
  getLearningStats() {
    return {
      historySize: this.performanceHistory.length,
      averageSatisfaction: this.performanceHistory.length > 0
        ? this.performanceHistory.reduce((sum, data) => sum + data.satisfaction, 0) / this.performanceHistory.length
        : 0,
      recentDecisions: this.recentDecisions.length,
      learningModel: Object.fromEntries(this.learningModel),
      confidenceDistribution: this.recentDecisions.map(d => d.confidence)
    };
  }

  /**
   * Reset learning data
   */
  resetLearning(): void {
    this.performanceHistory = [];
    this.recentDecisions = [];
    this.initializeLearningModel();
    logger.info('Intelligent chunker learning data reset');
  }

  /**
   * Export learning data for analysis
   */
  exportLearningData(): LearningData[] {
    return [...this.performanceHistory];
  }

  /**
   * Import learning data
   */
  importLearningData(data: LearningData[]): void {
    this.performanceHistory = data.slice(-this.options.maxLearningHistory);
    logger.info(`Imported ${this.performanceHistory.length} learning samples`);
  }
}

/**
 * Global intelligent chunker instance
 */
let globalIntelligentChunker: IntelligentChunker | null = null;

/**
 * Get or create global intelligent chunker
 */
export function getGlobalIntelligentChunker(options?: ChunkingOptions): IntelligentChunker {
  if (!globalIntelligentChunker) {
    globalIntelligentChunker = new IntelligentChunker(options);
  }
  return globalIntelligentChunker;
}

/**
 * Shutdown global intelligent chunker
 */
export function shutdownGlobalIntelligentChunker(): void {
  if (globalIntelligentChunker) {
    globalIntelligentChunker = null;
  }
}