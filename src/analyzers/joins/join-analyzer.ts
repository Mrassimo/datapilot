/**
 * Core Join Analysis Orchestrator
 * Phase 1: Foundation Architecture - Main join analysis engine
 */

import { CSVParser } from '../../parsers/csv-parser';
import { CSVDetector } from '../../parsers/csv-detector';
import { RelationshipDetector } from './relationship-detector';
import { globalErrorHandler, DataPilotError } from '../../utils/error-handler';
import { logger } from '../../utils/logger';
import {
  TableMeta,
  ColumnSchema,
  DataType,
  JoinAnalysisResult,
  JoinAnalysisConfig,
  JoinCandidate,
  JoinStrategy,
  JoinQualityMetrics,
  JoinPerformance,
  CardinalityType,
  JoinSummary,
  JoinRecommendation,
  PerformanceAnalysis,
  JoinErrorCode,
  JoinAnalysisError
} from './types';

export class JoinAnalyzer {
  private relationshipDetector: RelationshipDetector;
  private config: JoinAnalysisConfig;
  private csvParser: CSVParser;
  private csvDetector: CSVDetector;

  constructor(config: Partial<JoinAnalysisConfig> = {}) {
    this.config = {
      maxTables: config.maxTables ?? 10,
      confidenceThreshold: config.confidenceThreshold ?? 0.7,
      enableFuzzyMatching: config.enableFuzzyMatching ?? true,
      enableSemanticAnalysis: config.enableSemanticAnalysis ?? true,
      enableTemporalJoins: config.enableTemporalJoins ?? false,
      performanceMode: config.performanceMode ?? 'BALANCED',
      outputFormats: config.outputFormats ?? [{ type: 'JSON' }]
    };

    this.relationshipDetector = new RelationshipDetector({
      confidenceThreshold: this.config.confidenceThreshold,
      enableFuzzyMatching: this.config.enableFuzzyMatching,
      enableSemanticAnalysis: this.config.enableSemanticAnalysis
    });

    this.csvParser = new CSVParser();
    this.csvDetector = new CSVDetector();
  }

  /**
   * Main entry point for join analysis across multiple files
   */
  async analyzeJoins(filePaths: string[]): Promise<JoinAnalysisResult> {
    const startTime = Date.now();
    
    try {
      logger.info('Starting join analysis', { 
        fileCount: filePaths.length,
        config: this.config 
      });

      // Validate input
      this.validateInput(filePaths);

      // Load and analyze table metadata
      const tables = await this.loadTableMetadata(filePaths);
      
      // Detect relationships
      const foreignKeys = await this.relationshipDetector.inferForeignKeys(tables);
      const dependencyGraph = await this.relationshipDetector.buildDependencyGraph(tables);
      
      // Generate join candidates
      const joinCandidates = await this.generateJoinCandidates(tables, foreignKeys);
      
      // Validate integrity
      const integrityReport = await this.relationshipDetector.validateIntegrity(foreignKeys);
      
      // Infer business rules
      const businessRules = await this.relationshipDetector.inferBusinessRelationships(dependencyGraph);
      
      // Detect temporal joins if enabled
      const temporalJoins = this.config.enableTemporalJoins ? 
        await this.relationshipDetector.detectTemporalRelationships(tables) : 
        [];
      
      // Generate recommendations
      const recommendations = await this.generateRecommendations(
        joinCandidates, 
        integrityReport, 
        dependencyGraph
      );
      
      // Analyze performance
      const performance = await this.analyzePerformance(joinCandidates, tables);
      
      // Create summary
      const summary = this.createSummary(
        tables, 
        joinCandidates, 
        startTime
      );

      const result: JoinAnalysisResult = {
        summary,
        candidates: joinCandidates,
        dependencyGraph,
        integrityReport,
        businessRules,
        temporalJoins,
        recommendations,
        performance
      };

      logger.info('Join analysis completed', { 
        duration: Date.now() - startTime,
        joinCandidates: joinCandidates.length 
      });

      return result;

    } catch (error) {
      const joinError = error instanceof JoinAnalysisError ? 
        error : 
        new JoinAnalysisError(
          `Join analysis failed: ${error.message}`,
          JoinErrorCode.INVALID_TABLE,
          { originalError: error }
        );

      logger.error('Join analysis failed: ' + joinError.message);
      
      throw joinError;
    }
  }

  /**
   * Analyze specific join between two tables
   */
  async analyzePairwiseJoin(
    leftPath: string, 
    rightPath: string,
    leftColumn?: string,
    rightColumn?: string
  ): Promise<JoinCandidate[]> {
    try {
      const tables = await this.loadTableMetadata([leftPath, rightPath]);
      
      if (tables.length !== 2) {
        throw new JoinAnalysisError(
          'Expected exactly 2 tables for pairwise join',
          JoinErrorCode.INVALID_TABLE
        );
      }

      const [leftTable, rightTable] = tables;

      // If columns specified, analyze that specific join
      if (leftColumn && rightColumn) {
        const candidate = await this.analyzeSpecificJoin(
          leftTable, rightTable, leftColumn, rightColumn
        );
        return candidate ? [candidate] : [];
      }

      // Otherwise, find all possible joins
      return await this.generateJoinCandidates(tables, []);

    } catch (error) {
      logger.error('Pairwise join analysis failed: ' + (error as Error).message);
      throw error;
    }
  }

  /**
   * Get join recommendations for a specific scenario
   */
  async getJoinRecommendations(
    filePaths: string[],
    businessContext?: string
  ): Promise<JoinRecommendation[]> {
    const analysis = await this.analyzeJoins(filePaths);
    
    // Filter recommendations based on business context if provided
    if (businessContext) {
      return analysis.recommendations.filter(rec => 
        rec.description.toLowerCase().includes(businessContext.toLowerCase())
      );
    }

    return analysis.recommendations;
  }

  // Private helper methods

  private validateInput(filePaths: string[]): void {
    if (!filePaths || filePaths.length === 0) {
      throw new JoinAnalysisError(
        'No file paths provided',
        JoinErrorCode.INVALID_TABLE
      );
    }

    if (filePaths.length > this.config.maxTables) {
      throw new JoinAnalysisError(
        `Too many tables. Maximum allowed: ${this.config.maxTables}`,
        JoinErrorCode.INVALID_TABLE
      );
    }

    // Validate file extensions
    const supportedExtensions = ['.csv', '.tsv'];
    for (const path of filePaths) {
      const ext = path.toLowerCase().slice(path.lastIndexOf('.'));
      if (!supportedExtensions.includes(ext)) {
        throw new JoinAnalysisError(
          `Unsupported file type: ${ext}. Supported: ${supportedExtensions.join(', ')}`,
          JoinErrorCode.INVALID_TABLE
        );
      }
    }
  }

  private async loadTableMetadata(filePaths: string[]): Promise<TableMeta[]> {
    const tables: TableMeta[] = [];

    for (const filePath of filePaths) {
      try {
        // Simplified metadata loading for Phase 1
        const tableName = this.extractTableName(filePath);
        
        // Create basic table metadata (will be enhanced in later phases)
        const table: TableMeta = {
          filePath,
          tableName,
          schema: this.generateMockSchema(tableName), // Mock for Phase 1
          rowCount: 1000, // Mock data
          estimatedSize: 1024 * 1024, // 1MB mock
          lastModified: new Date(),
          encoding: 'utf8',
          delimiter: ','
        };

        tables.push(table);

      } catch (error) {
        logger.warn(`Failed to load table metadata for ${filePath}`, { error });
        // Continue with other tables rather than failing completely
      }
    }

    return tables;
  }

  private analyzeColumnSchema(data: any[]): ColumnSchema[] {
    if (data.length === 0) return [];

    const headers = Object.keys(data[0]);
    const schema: ColumnSchema[] = [];

    for (const header of headers) {
      const values = data.map(row => row[header]).filter(v => v != null);
      
      const column: ColumnSchema = {
        name: header,
        type: this.inferDataType(values),
        nullable: values.length < data.length,
        unique: new Set(values).size === values.length,
        distinctCount: new Set(values).size,
        nullCount: data.length - values.length,
        examples: values.slice(0, 5),
        patterns: this.extractColumnPatterns(values)
      };

      // Add min/max for numeric columns
      const numericValues = values.filter(v => typeof v === 'number');
      if (numericValues.length > 0) {
        column.minValue = Math.min(...numericValues);
        column.maxValue = Math.max(...numericValues);
      }

      // Add average length for string columns
      const stringValues = values.filter(v => typeof v === 'string');
      if (stringValues.length > 0) {
        column.avgLength = stringValues.reduce((sum, s) => sum + s.length, 0) / stringValues.length;
      }

      schema.push(column);
    }

    return schema;
  }

  private inferDataType(values: any[]): DataType {
    if (values.length === 0) return DataType.STRING;

    const sample = values.slice(0, 100);

    // Check for specific patterns first
    if (sample.every(v => /^\S+@\S+\.\S+$/.test(String(v)))) {
      return DataType.EMAIL;
    }

    if (sample.every(v => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(v)))) {
      return DataType.UUID;
    }

    if (sample.every(v => /^\+?[\d\s\-\(\)]+$/.test(String(v)))) {
      return DataType.PHONE;
    }

    // Check for numeric types
    const numericCount = sample.filter(v => !isNaN(Number(v))).length;
    if (numericCount / sample.length > 0.8) {
      const hasDecimals = sample.some(v => String(v).includes('.'));
      return hasDecimals ? DataType.FLOAT : DataType.INTEGER;
    }

    // Check for dates
    const dateCount = sample.filter(v => !isNaN(Date.parse(String(v)))).length;
    if (dateCount / sample.length > 0.8) {
      return DataType.DATE;
    }

    // Check for booleans
    const boolCount = sample.filter(v => 
      ['true', 'false', '1', '0', 'yes', 'no'].includes(String(v).toLowerCase())
    ).length;
    if (boolCount / sample.length > 0.8) {
      return DataType.BOOLEAN;
    }

    return DataType.STRING;
  }

  private extractColumnPatterns(values: any[]): string[] {
    const patterns: string[] = [];
    const stringValues = values.filter(v => typeof v === 'string').slice(0, 100);

    if (stringValues.some(v => /^\d+$/.test(v))) patterns.push('numeric_string');
    if (stringValues.some(v => /^[A-Z]{2,}$/.test(v))) patterns.push('uppercase');
    if (stringValues.some(v => /^[a-z_]+$/.test(v))) patterns.push('lowercase_underscore');
    if (stringValues.some(v => /^\d{4}-\d{2}-\d{2}$/.test(v))) patterns.push('date_iso');

    return patterns;
  }

  private extractTableName(filePath: string): string {
    return filePath.split('/').pop()?.replace(/\.[^/.]+$/, '') || 'unknown';
  }

  private generateMockSchema(tableName: string): ColumnSchema[] {
    // Generate realistic mock schema based on table name for Phase 1 testing
    const commonSchemas: Record<string, ColumnSchema[]> = {
      'customers': [
        { name: 'customer_id', type: DataType.INTEGER, nullable: false, unique: true, distinctCount: 1000, nullCount: 0, patterns: ['numeric'], examples: [1, 2, 3] },
        { name: 'name', type: DataType.STRING, nullable: false, unique: false, distinctCount: 950, nullCount: 0, patterns: ['name'], examples: ['John Doe', 'Jane Smith'] },
        { name: 'email', type: DataType.EMAIL, nullable: true, unique: true, distinctCount: 995, nullCount: 5, patterns: ['email'], examples: ['john@example.com'] }
      ],
      'orders': [
        { name: 'order_id', type: DataType.INTEGER, nullable: false, unique: true, distinctCount: 1000, nullCount: 0, patterns: ['numeric'], examples: [101, 102, 103] },
        { name: 'customer_id', type: DataType.INTEGER, nullable: false, unique: false, distinctCount: 300, nullCount: 0, patterns: ['numeric'], examples: [1, 2, 1] },
        { name: 'product', type: DataType.STRING, nullable: false, unique: false, distinctCount: 50, nullCount: 0, patterns: ['name'], examples: ['Laptop', 'Phone'] },
        { name: 'amount', type: DataType.FLOAT, nullable: false, unique: false, distinctCount: 800, nullCount: 0, patterns: ['currency'], examples: [99.99, 199.99] }
      ]
    };

    // Return schema if we have a predefined one, otherwise generate generic
    if (commonSchemas[tableName.toLowerCase()]) {
      return commonSchemas[tableName.toLowerCase()];
    }

    // Generic schema for unknown tables
    return [
      { name: 'id', type: DataType.INTEGER, nullable: false, unique: true, distinctCount: 1000, nullCount: 0, patterns: ['numeric'], examples: [1, 2, 3] },
      { name: 'name', type: DataType.STRING, nullable: true, unique: false, distinctCount: 800, nullCount: 20, patterns: ['name'], examples: ['Item 1', 'Item 2'] }
    ];
  }

  private async generateJoinCandidates(
    tables: TableMeta[], 
    foreignKeys: any[]
  ): Promise<JoinCandidate[]> {
    const candidates: JoinCandidate[] = [];

    // Generate candidates from foreign key relationships
    for (const fk of foreignKeys) {
      const leftTable = tables.find(t => t.tableName === fk.table);
      const rightTable = tables.find(t => t.tableName === fk.referencedTable);

      if (leftTable && rightTable) {
        const candidate: JoinCandidate = {
          leftTable,
          rightTable,
          leftColumn: fk.column,
          rightColumn: fk.referencedColumn,
          strategy: JoinStrategy.EXACT_MATCH,
          confidence: fk.confidence,
          cardinality: CardinalityType.MANY_TO_ONE,
          estimatedRows: Math.min(leftTable.rowCount, rightTable.rowCount),
          qualityMetrics: await this.calculateJoinQuality(leftTable, rightTable, fk.column, fk.referencedColumn)
        };

        candidates.push(candidate);
      }
    }

    // Generate candidates from semantic similarity
    for (let i = 0; i < tables.length; i++) {
      for (let j = i + 1; j < tables.length; j++) {
        const semanticCandidates = await this.findSemanticJoinCandidates(tables[i], tables[j]);
        candidates.push(...semanticCandidates);
      }
    }

    return candidates
      .filter(c => c.confidence >= this.config.confidenceThreshold)
      .sort((a, b) => b.confidence - a.confidence);
  }

  private async analyzeSpecificJoin(
    leftTable: TableMeta,
    rightTable: TableMeta,
    leftColumn: string,
    rightColumn: string
  ): Promise<JoinCandidate | null> {
    const leftCol = leftTable.schema.find(c => c.name === leftColumn);
    const rightCol = rightTable.schema.find(c => c.name === rightColumn);

    if (!leftCol || !rightCol) {
      return null;
    }

    const confidence = this.relationshipDetector.semanticSimilarity(leftColumn, rightColumn);
    
    return {
      leftTable,
      rightTable,
      leftColumn,
      rightColumn,
      strategy: JoinStrategy.EXACT_MATCH,
      confidence,
      cardinality: CardinalityType.MANY_TO_MANY, // Would be calculated from actual data
      estimatedRows: Math.min(leftTable.rowCount, rightTable.rowCount),
      qualityMetrics: await this.calculateJoinQuality(leftTable, rightTable, leftColumn, rightColumn)
    };
  }

  private async findSemanticJoinCandidates(
    table1: TableMeta, 
    table2: TableMeta
  ): Promise<JoinCandidate[]> {
    const candidates: JoinCandidate[] = [];

    for (const col1 of table1.schema) {
      for (const col2 of table2.schema) {
        const similarity = this.relationshipDetector.semanticSimilarity(col1.name, col2.name);
        
        if (similarity >= this.config.confidenceThreshold) {
          candidates.push({
            leftTable: table1,
            rightTable: table2,
            leftColumn: col1.name,
            rightColumn: col2.name,
            strategy: JoinStrategy.SEMANTIC_MATCH,
            confidence: similarity,
            cardinality: CardinalityType.MANY_TO_MANY,
            estimatedRows: Math.min(table1.rowCount, table2.rowCount),
            qualityMetrics: await this.calculateJoinQuality(table1, table2, col1.name, col2.name)
          });
        }
      }
    }

    return candidates;
  }

  private async calculateJoinQuality(
    leftTable: TableMeta,
    rightTable: TableMeta,
    leftColumn: string,
    rightColumn: string
  ): Promise<JoinQualityMetrics> {
    // Simplified quality calculation - would be enhanced with actual data analysis
    return {
      dataLoss: 10, // Estimated percentage
      duplication: 1.2, // Estimated multiplication factor
      consistency: 90, // Estimated integrity score
      performance: {
        estimatedTime: leftTable.rowCount * rightTable.rowCount / 1000000, // Rough estimate
        estimatedMemory: (leftTable.estimatedSize + rightTable.estimatedSize) * 2,
        complexity: leftTable.rowCount > 1000000 ? 'HIGH' : 'MEDIUM',
        indexRecommended: leftTable.rowCount > 100000
      },
      confidence: 85
    };
  }

  private async generateRecommendations(
    joinCandidates: JoinCandidate[],
    integrityReport: any,
    dependencyGraph: any
  ): Promise<JoinRecommendation[]> {
    const recommendations: JoinRecommendation[] = [];

    // Performance recommendations
    const highComplexityJoins = joinCandidates.filter(c => 
      c.qualityMetrics.performance.complexity === 'HIGH'
    );

    if (highComplexityJoins.length > 0) {
      recommendations.push({
        type: 'PERFORMANCE',
        priority: 'HIGH',
        title: 'Consider indexing for large joins',
        description: `${highComplexityJoins.length} joins involve large tables that would benefit from indexing`,
        impact: 'Significant performance improvement',
        implementation: 'Create indexes on join columns before executing joins',
        estimatedEffort: 'MINUTES'
      });
    }

    // Quality recommendations
    if (integrityReport.brokenRelationships.length > 0) {
      recommendations.push({
        type: 'QUALITY',
        priority: 'HIGH',
        title: 'Data quality issues detected',
        description: `${integrityReport.brokenRelationships.length} referential integrity violations found`,
        impact: 'Improved join accuracy and data consistency',
        implementation: 'Clean data or add data validation rules',
        estimatedEffort: 'HOURS'
      });
    }

    return recommendations;
  }

  private async analyzePerformance(
    joinCandidates: JoinCandidate[],
    tables: TableMeta[]
  ): Promise<PerformanceAnalysis> {
    const totalRows = tables.reduce((sum, t) => sum + t.rowCount, 0);
    const totalSize = tables.reduce((sum, t) => sum + t.estimatedSize, 0);

    return {
      overallComplexity: totalRows > 10000000 ? 'HIGH' : 
                        totalRows > 1000000 ? 'MEDIUM' : 'LOW',
      bottlenecks: [],
      optimizations: [],
      scalabilityAssessment: {
        currentCapacity: {
          rows: totalRows,
          sizeGB: totalSize / (1024 * 1024 * 1024),
          tables: tables.length,
          complexity: 'MEDIUM'
        },
        projectedCapacity: {
          rows: totalRows * 10,
          sizeGB: (totalSize * 10) / (1024 * 1024 * 1024),
          tables: tables.length,
          complexity: 'HIGH'
        },
        scalingStrategy: 'HORIZONTAL',
        recommendations: ['Consider distributed processing for 10x growth']
      }
    };
  }

  private createSummary(
    tables: TableMeta[],
    joinCandidates: JoinCandidate[],
    startTime: number
  ): JoinSummary {
    const highConfidenceJoins = joinCandidates.filter(c => c.confidence >= 0.9).length;
    const totalRows = tables.reduce((sum, t) => sum + t.rowCount, 0);

    return {
      tablesAnalyzed: tables.length,
      totalRows,
      joinCandidatesFound: joinCandidates.length,
      highConfidenceJoins,
      potentialIssues: joinCandidates.filter(c => 
        c.qualityMetrics.dataLoss > 20 || c.qualityMetrics.consistency < 80
      ).length,
      analysisTime: Date.now() - startTime
    };
  }
}