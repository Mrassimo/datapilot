/**
 * Smart FK/PK Detection Algorithms
 * Phase 1: Foundation Architecture - Relationship Detection Engine
 */

import { 
  TableMeta, 
  ColumnSchema, 
  ForeignKeyCandidate, 
  CardinalityType, 
  DataType,
  TableDependencyGraph,
  TableNode,
  DependencyEdge,
  ColumnRelationship,
  BusinessRule,
  TemporalJoin,
  IntegrityReport,
  BrokenRelationship,
  OrphanedRecord,
  JoinConfidence
} from './types';
import { CSVParser } from '../../parsers/csv-parser';
import { logger } from '../../utils/logger';
import { DataPilotError } from '../../utils/error-handler';

/**
 * Configuration for data sampling and validation
 */
interface DataSamplingConfig {
  maxSampleSize: number;
  minSampleSize: number;
  confidenceLevel: number;
  dataOverlapThreshold: number;
  cardinalityThreshold: number;
}

/**
 * Statistical validation results for foreign key relationships
 */
interface ValidationResult {
  dataOverlap: number;
  cardinalityRatio: number;
  typeCompatibility: number;
  uniquenessScore: number;
  referentialIntegrity: number;
  overallConfidence: number;
  violations: any[];
}

export class RelationshipDetector {
  private confidenceThreshold: number;
  private enableFuzzyMatching: boolean;
  private enableSemanticAnalysis: boolean;
  private csvParser: CSVParser;
  private samplingConfig: DataSamplingConfig;

  constructor(config: {
    confidenceThreshold?: number;
    enableFuzzyMatching?: boolean;
    enableSemanticAnalysis?: boolean;
    samplingConfig?: Partial<DataSamplingConfig>;
  } = {}) {
    this.confidenceThreshold = config.confidenceThreshold ?? 0.5; // Lowered from 0.7 to 0.5 
    this.enableFuzzyMatching = config.enableFuzzyMatching ?? true;
    this.enableSemanticAnalysis = config.enableSemanticAnalysis ?? true;
    this.csvParser = new CSVParser();
    
    // Enhanced sampling configuration
    this.samplingConfig = {
      maxSampleSize: config.samplingConfig?.maxSampleSize ?? 10000,
      minSampleSize: config.samplingConfig?.minSampleSize ?? 1000,
      confidenceLevel: config.samplingConfig?.confidenceLevel ?? 0.95,
      dataOverlapThreshold: config.samplingConfig?.dataOverlapThreshold ?? 0.7,
      cardinalityThreshold: config.samplingConfig?.cardinalityThreshold ?? 0.8,
      ...config.samplingConfig
    };
  }

  /**
   * Detect foreign key relationships across multiple tables
   */
  async inferForeignKeys(tables: TableMeta[]): Promise<ForeignKeyCandidate[]> {
    const candidates: ForeignKeyCandidate[] = [];

    for (let i = 0; i < tables.length; i++) {
      for (let j = 0; j < tables.length; j++) {
        if (i === j) continue;

        const fkCandidates = await this.detectForeignKeysBetweenTables(
          tables[i], 
          tables[j]
        );
        candidates.push(...fkCandidates);
      }
    }

    // Return both high-confidence and suggested joins
    const highConfidence = candidates.filter(candidate => candidate.confidence >= this.confidenceThreshold);
    const suggestedJoins = candidates.filter(candidate => 
      candidate.confidence >= 0.3 && candidate.confidence < this.confidenceThreshold
    );
    
    return [...highConfidence, ...suggestedJoins]
      .sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Build comprehensive dependency graph showing table relationships
   */
  async buildDependencyGraph(tables: TableMeta[]): Promise<TableDependencyGraph> {
    const foreignKeys = await this.inferForeignKeys(tables);
    const nodes: TableNode[] = tables.map(table => ({
      table,
      level: 0,
      children: [],
      parents: [],
      isRoot: false,
      isLeaf: false
    }));

    const edges: DependencyEdge[] = [];
    const nodeMap = new Map(nodes.map(node => [node.table.tableName, node]));

    // Build edges from foreign key relationships
    for (const fk of foreignKeys) {
      const fromNode = nodeMap.get(fk.table);
      const toNode = nodeMap.get(fk.referencedTable);

      if (fromNode && toNode) {
        fromNode.parents.push(fk.referencedTable);
        toNode.children.push(fk.table);

        edges.push({
          from: fk.table,
          to: fk.referencedTable,
          columns: [{
            fromColumn: fk.column,
            toColumn: fk.referencedColumn,
            similarity: fk.confidence,
            cardinality: this.inferCardinality(fk)
          }],
          strength: fk.confidence,
          type: 'FK'
        });
      }
    }

    // Calculate levels and identify roots/leaves
    this.calculateNodeLevels(nodes, edges);
    const cycles = this.detectCycles(nodes, edges);

    return {
      nodes,
      edges,
      cycles,
      depth: Math.max(...nodes.map(n => n.level), 0)
    };
  }

  /**
   * Infer business relationships from table structures and naming patterns
   */
  async inferBusinessRelationships(graph: TableDependencyGraph): Promise<BusinessRule[]> {
    const rules: BusinessRule[] = [];

    // Common business patterns
    const businessPatterns = [
      {
        name: 'Customer-Order Pattern',
        tables: ['customer', 'order'],
        description: 'Customers place orders',
        conditions: ['orders.customer_id references customers.id']
      },
      {
        name: 'Order-Item Pattern', 
        tables: ['order', 'item', 'product'],
        description: 'Orders contain items which reference products',
        conditions: ['items.order_id references orders.id', 'items.product_id references products.id']
      },
      {
        name: 'User-Profile Pattern',
        tables: ['user', 'profile'],
        description: 'Users have profiles (1:1 relationship)',
        conditions: ['profiles.user_id references users.id']
      }
    ];

    for (const pattern of businessPatterns) {
      const matchingTables = graph.nodes.filter(node => 
        pattern.tables.some(patternTable => 
          node.table.tableName.toLowerCase().includes(patternTable)
        )
      );

      if (matchingTables.length >= pattern.tables.length) {
        rules.push({
          name: pattern.name,
          description: pattern.description,
          tables: matchingTables.map(t => t.table.tableName),
          conditions: pattern.conditions,
          confidence: this.calculateBusinessRuleConfidence(matchingTables, pattern),
          source: 'INFERRED'
        });
      }
    }

    return rules.filter(rule => rule.confidence >= this.confidenceThreshold);
  }

  /**
   * Detect temporal relationships for time-series joins
   */
  async detectTemporalRelationships(tables: TableMeta[]): Promise<TemporalJoin[]> {
    const temporalJoins: TemporalJoin[] = [];
    const timeColumns = this.identifyTimeColumns(tables);

    for (let i = 0; i < tables.length; i++) {
      for (let j = i + 1; j < tables.length; j++) {
        const leftTimeColumns = timeColumns.get(tables[i].tableName) || [];
        const rightTimeColumns = timeColumns.get(tables[j].tableName) || [];

        for (const leftCol of leftTimeColumns) {
          for (const rightCol of rightTimeColumns) {
            temporalJoins.push({
              leftTable: tables[i].tableName,
              rightTable: tables[j].tableName,
              leftTimeColumn: leftCol,
              rightTimeColumn: rightCol,
              strategy: 'EXACT' // Default strategy
            });
          }
        }
      }
    }

    return temporalJoins;
  }

  /**
   * Validate referential integrity across identified relationships
   */
  async validateIntegrity(foreignKeys: ForeignKeyCandidate[]): Promise<IntegrityReport> {
    const validJoins: ForeignKeyCandidate[] = [];
    const brokenRelationships: BrokenRelationship[] = [];
    const orphanedRecords: OrphanedRecord[] = [];
    const recommendations: string[] = [];

    for (const fk of foreignKeys) {
      if (fk.violations === 0) {
        validJoins.push(fk);
      } else {
        brokenRelationships.push({
          fromTable: fk.table,
          toTable: fk.referencedTable,
          fromColumn: fk.column,
          toColumn: fk.referencedColumn,
          violationCount: fk.violations,
          violationExamples: [] // Would be populated with actual data
        });

        recommendations.push(
          `Consider cleaning data in ${fk.table}.${fk.column} - ${fk.violations} referential integrity violations found`
        );
      }
    }

    return {
      validJoins: [], // Will be populated with actual JoinCandidate objects
      brokenRelationships,
      orphanedRecords,
      circularDependencies: [],
      recommendations
    };
  }

  /**
   * Calculate semantic similarity between column names
   */
  semanticSimilarity(col1: string, col2: string): number {
    if (!this.enableSemanticAnalysis) return 0;

    // Exact match
    if (col1.toLowerCase() === col2.toLowerCase()) return 1.0;

    // Remove common prefixes/suffixes
    const clean1 = this.cleanColumnName(col1);
    const clean2 = this.cleanColumnName(col2);

    if (clean1 === clean2) return 0.95;

    // Common patterns
    const patterns = [
      ['id', 'identifier', 'key'],
      ['name', 'title', 'label'],
      ['date', 'time', 'timestamp'],
      ['email', 'mail', 'email_address'],
      ['phone', 'telephone', 'mobile']
    ];

    for (const pattern of patterns) {
      if (pattern.includes(clean1) && pattern.includes(clean2)) {
        return 0.8;
      }
    }

    // Levenshtein distance
    return this.enableFuzzyMatching ? 
      1 - (this.levenshteinDistance(clean1, clean2) / Math.max(clean1.length, clean2.length)) :
      0;
  }

  /**
   * Analyze value distribution similarity between columns
   */
  distributionSimilarity(data1: any[], data2: any[]): JoinConfidence {
    const stats1 = this.calculateDistributionStats(data1);
    const stats2 = this.calculateDistributionStats(data2);

    const rangeSimilarity = this.compareRanges(stats1, stats2);
    const patternSimilarity = this.comparePatterns(stats1, stats2);
    const typeSimilarity = this.compareTypes(stats1, stats2);

    return {
      overall: (rangeSimilarity + patternSimilarity + typeSimilarity) / 3,
      semantic: 0, // Would be calculated separately
      statistical: rangeSimilarity,
      structural: typeSimilarity,
      domain: patternSimilarity
    };
  }

  // Private helper methods

  private async detectForeignKeysBetweenTables(
    table1: TableMeta, 
    table2: TableMeta
  ): Promise<ForeignKeyCandidate[]> {
    const candidates: ForeignKeyCandidate[] = [];

    try {
      // Load sample data from both tables
      const table1Data = await this.loadSampleData(table1);
      const table2Data = await this.loadSampleData(table2);

      logger.info(`Analyzing relationships between ${table1.tableName} and ${table2.tableName}`, {
        table1Rows: table1Data.length,
        table2Rows: table2Data.length
      });

      for (const col1 of table1.schema) {
        for (const col2 of table2.schema) {
          // Check semantic similarity first as a filter
          const semanticSimilarity = this.semanticSimilarity(col1.name, col2.name);
          
          // Only proceed with expensive data analysis if there's some semantic similarity
          // or if columns have compatible types
          if (semanticSimilarity >= 0.3 || this.areTypesCompatible(col1.type, col2.type)) {
            const validationResult = await this.validateForeignKeyRelationship(
              table1Data, table2Data, col1.name, col2.name, col1, col2
            );

            // Enhanced confidence calculation based on multiple factors
            const overallConfidence = this.calculateOverallConfidence(
              semanticSimilarity,
              validationResult
            );

            if (overallConfidence >= this.confidenceThreshold) {
              const candidate: ForeignKeyCandidate = {
                table: table1.tableName,
                column: col1.name,
                referencedTable: table2.tableName,
                referencedColumn: col2.name,
                confidence: overallConfidence,
                matchingRows: Math.floor(table1Data.length * (validationResult.dataOverlap || 0)),
                totalRows: table1Data.length,
                violations: validationResult.violations ? validationResult.violations.length : 0
              };

              candidates.push(candidate);
            }
          }
        }
      }

      return candidates.sort((a, b) => b.confidence - a.confidence);

    } catch (error) {
      logger.error('Error detecting foreign keys between tables', {
        table1: table1.tableName,
        table2: table2.tableName,
        error: error.message
      });
      
      // Fallback to semantic-only detection
      return this.detectForeignKeysSemanticOnly(table1, table2);
    }
  }

  private inferCardinality(fk: ForeignKeyCandidate): CardinalityType {
    const matchRatio = fk.matchingRows / fk.totalRows;
    
    if (matchRatio > 0.95) {
      return CardinalityType.MANY_TO_ONE;
    } else if (matchRatio > 0.5) {
      return CardinalityType.ONE_TO_MANY;
    } else {
      return CardinalityType.MANY_TO_MANY;
    }
  }

  private calculateNodeLevels(nodes: TableNode[], edges: DependencyEdge[]): void {
    // Identify root nodes (no parents)
    const roots = nodes.filter(node => node.parents.length === 0);
    roots.forEach(node => {
      node.isRoot = true;
      node.level = 0;
    });

    // BFS to calculate levels
    const queue = [...roots];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current.table.tableName)) continue;
      visited.add(current.table.tableName);

      for (const childName of current.children) {
        const child = nodes.find(n => n.table.tableName === childName);
        if (child && !visited.has(childName)) {
          child.level = Math.max(child.level, current.level + 1);
          queue.push(child);
        }
      }
    }

    // Identify leaf nodes
    nodes.forEach(node => {
      node.isLeaf = node.children.length === 0;
    });
  }

  private detectCycles(nodes: TableNode[], edges: DependencyEdge[]): TableNode[][] {
    // Simple cycle detection - would be enhanced for production
    return [];
  }

  private calculateBusinessRuleConfidence(
    tables: TableNode[], 
    pattern: any
  ): number {
    // Calculate confidence based on naming patterns and relationships
    return 0.8; // Simplified for now
  }

  private identifyTimeColumns(tables: TableMeta[]): Map<string, string[]> {
    const timeColumns = new Map<string, string[]>();

    for (const table of tables) {
      const timeColumnNames = table.schema
        .filter(col => 
          col.type === DataType.DATE || 
          col.type === DataType.DATETIME ||
          col.name.toLowerCase().includes('time') ||
          col.name.toLowerCase().includes('date')
        )
        .map(col => col.name);

      if (timeColumnNames.length > 0) {
        timeColumns.set(table.tableName, timeColumnNames);
      }
    }

    return timeColumns;
  }

  private cleanColumnName(name: string): string {
    return name.toLowerCase()
      .replace(/^(tbl_|table_|tb_)/, '')
      .replace(/_(id|key|fk|pk)$/, '')
      .replace(/[_\s]+/g, '_')
      .trim();
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => 
      Array(str1.length + 1).fill(null)
    );

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  private calculateDistributionStats(data: any[]): any {
    // Calculate statistical properties of the data
    return {
      min: Math.min(...data.filter(d => typeof d === 'number')),
      max: Math.max(...data.filter(d => typeof d === 'number')),
      uniqueValues: new Set(data).size,
      nullCount: data.filter(d => d == null).length,
      patterns: this.extractPatterns(data)
    };
  }

  private compareRanges(stats1: any, stats2: any): number {
    if (typeof stats1.min !== 'number' || typeof stats2.min !== 'number') {
      return 0;
    }

    const range1 = stats1.max - stats1.min;
    const range2 = stats2.max - stats2.min;
    const overlap = Math.max(0, Math.min(stats1.max, stats2.max) - Math.max(stats1.min, stats2.min));
    
    return overlap / Math.max(range1, range2, 1);
  }

  private comparePatterns(stats1: any, stats2: any): number {
    const patterns1 = new Set(stats1.patterns);
    const patterns2 = new Set(stats2.patterns);
    const intersection = new Set([...patterns1].filter(p => patterns2.has(p)));
    
    return intersection.size / Math.max(patterns1.size, patterns2.size, 1);
  }

  private compareTypes(stats1: any, stats2: any): number {
    // Compare data type compatibility
    return 0.8; // Simplified for now
  }

  private extractPatterns(data: any[]): string[] {
    const patterns: string[] = [];
    const stringData = data.filter(d => typeof d === 'string').slice(0, 100);

    // Email pattern
    if (stringData.some(s => /\S+@\S+\.\S+/.test(s))) {
      patterns.push('email');
    }

    // Phone pattern
    if (stringData.some(s => /^\+?[\d\s\-\(\)]+$/.test(s))) {
      patterns.push('phone');
    }

    // UUID pattern
    if (stringData.some(s => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s))) {
      patterns.push('uuid');
    }

    return patterns;
  }

  /**
   * Load sample data from a table for analysis
   */
  private async loadSampleData(table: TableMeta): Promise<any[]> {
    try {
      const rawData = await this.csvParser.parseFile(table.filePath);
      
      // Convert from ParsedRow format to object format
      const convertedData = this.convertParsedRowsToObjects(rawData, table.schema);
      
      // Sample data if it's too large
      if (convertedData.length > this.samplingConfig.maxSampleSize) {
        // Use systematic sampling to ensure representativeness
        const step = Math.floor(convertedData.length / this.samplingConfig.maxSampleSize);
        const sample = [];
        
        for (let i = 0; i < convertedData.length; i += step) {
          sample.push(convertedData[i]);
          if (sample.length >= this.samplingConfig.maxSampleSize) break;
        }
        
        logger.info(`Sampled ${sample.length} rows from ${convertedData.length} total rows`, {
          table: table.tableName,
          samplingRatio: sample.length / convertedData.length
        });
        
        return sample;
      }
      
      return convertedData;
    } catch (error) {
      logger.error(`Failed to load sample data for ${table.tableName}`, { error });
      throw new DataPilotError(
        `Failed to load sample data for table ${table.tableName}: ${error.message}`,
        'DATA_LOADING_ERROR'
      );
    }
  }

  /**
   * Convert ParsedRow array to object array using schema column names
   */
  private convertParsedRowsToObjects(rawData: any[], schema: ColumnSchema[]): any[] {
    if (rawData.length === 0) return [];
    
    // Extract column names from schema
    const columnNames = schema.map(col => col.name);
    
    // Find header row (first row with data property that matches schema length)
    let headerRowIndex = -1;
    let dataStartIndex = 0;
    
    for (let i = 0; i < rawData.length; i++) {
      const row = rawData[i];
      if (row.data && Array.isArray(row.data)) {
        if (row.data.length === columnNames.length) {
          // Check if this row contains the column names (header row)
          const isHeaderRow = row.data.some(cell => 
            columnNames.includes(String(cell).toLowerCase()) || 
            columnNames.includes(String(cell))
          );
          
          if (isHeaderRow) {
            headerRowIndex = i;
            dataStartIndex = i + 1;
            break;
          } else if (headerRowIndex === -1) {
            // If no header found yet, assume first valid row starts data
            dataStartIndex = i;
            break;
          }
        }
      }
    }
    
    // Convert data rows to objects
    const objectData = [];
    
    for (let i = dataStartIndex; i < rawData.length; i++) {
      const row = rawData[i];
      if (row.data && Array.isArray(row.data) && row.data.length >= columnNames.length) {
        const obj: any = {};
        
        for (let j = 0; j < columnNames.length; j++) {
          obj[columnNames[j]] = row.data[j];
        }
        
        objectData.push(obj);
      }
    }
    
    logger.info(`Converted ${rawData.length} raw rows to ${objectData.length} object rows`, {
      headerRowIndex,
      dataStartIndex,
      columnNames
    });
    
    return objectData;
  }

  /**
   * Validate foreign key relationship using actual data
   */
  private async validateForeignKeyRelationship(
    table1Data: any[],
    table2Data: any[],
    col1Name: string,
    col2Name: string,
    col1Schema: ColumnSchema,
    col2Schema: ColumnSchema
  ): Promise<ValidationResult> {
    const result: ValidationResult = {
      dataOverlap: 0,
      cardinalityRatio: 0,
      typeCompatibility: 0,
      uniquenessScore: 0,
      referentialIntegrity: 0,
      overallConfidence: 0,
      violations: []
    };

    // Extract column values
    const col1Values = table1Data.map(row => row[col1Name]).filter(v => v != null);
    const col2Values = table2Data.map(row => row[col2Name]).filter(v => v != null);

    if (col1Values.length === 0 || col2Values.length === 0) {
      return result;
    }

    // Calculate data overlap
    const col1Set = new Set(col1Values.map(v => String(v).toLowerCase().trim()));
    const col2Set = new Set(col2Values.map(v => String(v).toLowerCase().trim()));
    const intersection = new Set([...col1Set].filter(v => col2Set.has(v)));
    
    result.dataOverlap = intersection.size / Math.max(col1Set.size, col2Set.size);

    // Check referential integrity (FK values exist in PK table)
    const violations = [];
    let validReferences = 0;
    
    for (const fkValue of col1Values) {
      const normalizedFkValue = String(fkValue).toLowerCase().trim();
      if (col2Set.has(normalizedFkValue)) {
        validReferences++;
      } else {
        violations.push({ value: fkValue, type: 'missing_reference' });
      }
    }
    
    result.referentialIntegrity = validReferences / col1Values.length;
    result.violations = violations.slice(0, 10); // Keep first 10 violations as examples

    // Calculate cardinality ratio
    const col1Unique = new Set(col1Values).size;
    const col2Unique = new Set(col2Values).size;
    result.cardinalityRatio = Math.min(col1Unique / col1Values.length, col2Unique / col2Values.length);

    // Check type compatibility
    result.typeCompatibility = this.calculateTypeCompatibility(col1Schema.type, col2Schema.type);

    // Calculate uniqueness score (higher for potential PK columns)
    result.uniquenessScore = Math.max(
      col1Schema.distinctCount / Math.max(col1Values.length, 1),
      col2Schema.distinctCount / Math.max(col2Values.length, 1)
    );

    return result;
  }

  /**
   * Calculate overall confidence based on multiple factors
   */
  private calculateOverallConfidence(semanticSimilarity: number, validation: ValidationResult): number {
    const weights = {
      semantic: 0.15,     // Reduced weight for naming similarity
      dataOverlap: 0.35,  // High weight for actual data overlap
      referentialIntegrity: 0.25, // High weight for referential integrity
      typeCompatibility: 0.15,    // Type compatibility
      uniqueness: 0.10            // Uniqueness patterns
    };

    const confidence = (
      semanticSimilarity * weights.semantic +
      validation.dataOverlap * weights.dataOverlap +
      validation.referentialIntegrity * weights.referentialIntegrity +
      validation.typeCompatibility * weights.typeCompatibility +
      validation.uniquenessScore * weights.uniqueness
    );

    return Math.min(confidence, 1.0);
  }

  /**
   * Check if two data types are compatible for foreign key relationships
   */
  private areTypesCompatible(type1: DataType, type2: DataType): boolean {
    // Exact match
    if (type1 === type2) return true;

    // Compatible numeric types
    const numericTypes = [DataType.INTEGER, DataType.FLOAT];
    if (numericTypes.includes(type1) && numericTypes.includes(type2)) {
      return true;
    }

    // Compatible date types
    const dateTypes = [DataType.DATE, DataType.DATETIME];
    if (dateTypes.includes(type1) && dateTypes.includes(type2)) {
      return true;
    }

    // String types are often compatible with other types
    if (type1 === DataType.STRING || type2 === DataType.STRING) {
      return true;
    }

    return false;
  }

  /**
   * Calculate type compatibility score
   */
  private calculateTypeCompatibility(type1: DataType, type2: DataType): number {
    if (type1 === type2) return 1.0;
    if (this.areTypesCompatible(type1, type2)) return 0.8;
    return 0.2;
  }

  /**
   * Fallback to semantic-only detection when data analysis fails
   */
  private async detectForeignKeysSemanticOnly(
    table1: TableMeta, 
    table2: TableMeta
  ): Promise<ForeignKeyCandidate[]> {
    const candidates: ForeignKeyCandidate[] = [];

    for (const col1 of table1.schema) {
      for (const col2 of table2.schema) {
        const similarity = this.semanticSimilarity(col1.name, col2.name);
        
        if (similarity >= this.confidenceThreshold) {
          const candidate: ForeignKeyCandidate = {
            table: table1.tableName,
            column: col1.name,
            referencedTable: table2.tableName,
            referencedColumn: col2.name,
            confidence: similarity * 0.6, // Reduced confidence for semantic-only
            matchingRows: Math.floor(table1.rowCount * 0.5), // Estimated
            totalRows: table1.rowCount,
            violations: 0
          };

          candidates.push(candidate);
        }
      }
    }

    return candidates;
  }
}