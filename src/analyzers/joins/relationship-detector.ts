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
} from './types.js';

export class RelationshipDetector {
  private confidenceThreshold: number;
  private enableFuzzyMatching: boolean;
  private enableSemanticAnalysis: boolean;

  constructor(config: {
    confidenceThreshold?: number;
    enableFuzzyMatching?: boolean;
    enableSemanticAnalysis?: boolean;
  } = {}) {
    this.confidenceThreshold = config.confidenceThreshold ?? 0.7;
    this.enableFuzzyMatching = config.enableFuzzyMatching ?? true;
    this.enableSemanticAnalysis = config.enableSemanticAnalysis ?? true;
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

    return candidates
      .filter(candidate => candidate.confidence >= this.confidenceThreshold)
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

    for (const col1 of table1.schema) {
      for (const col2 of table2.schema) {
        const similarity = this.semanticSimilarity(col1.name, col2.name);
        
        if (similarity >= this.confidenceThreshold) {
          const candidate: ForeignKeyCandidate = {
            table: table1.tableName,
            column: col1.name,
            referencedTable: table2.tableName,
            referencedColumn: col2.name,
            confidence: similarity,
            matchingRows: 0, // Would be calculated from actual data
            totalRows: table1.rowCount,
            violations: 0
          };

          candidates.push(candidate);
        }
      }
    }

    return candidates;
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
}