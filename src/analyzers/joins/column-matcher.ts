/**
 * Intelligent Column Matching Engine
 * Phase 1: Foundation Architecture - Advanced column similarity detection
 */

import {
  ColumnSchema,
  DataType,
  JoinConfidence,
  CardinalityType,
  TableMeta,
  ForeignKeyCandidate,
  JoinStrategy
} from './types.js';

export interface ColumnMatcher {
  semanticSimilarity(col1: string, col2: string): number;
  distributionSimilarity(data1: any[], data2: any[]): JoinConfidence;
  detectCardinality(table1: TableMeta, table2: TableMeta, col1: string, col2: string): CardinalityType;
  inferForeignKeys(tables: TableMeta[]): ForeignKeyCandidate[];
}

export class IntelligentColumnMatcher implements ColumnMatcher {
  private semanticCache: Map<string, number> = new Map();
  private commonPatterns: Map<string, string[]>;
  private domainKnowledge: Map<string, string[]>;

  constructor() {
    this.initializePatterns();
    this.initializeDomainKnowledge();
  }

  /**
   * Calculate semantic similarity between two column names
   * Uses multiple strategies: exact matching, pattern matching, domain knowledge
   */
  semanticSimilarity(col1: string, col2: string): number {
    const cacheKey = `${col1.toLowerCase()}:${col2.toLowerCase()}`;
    if (this.semanticCache.has(cacheKey)) {
      return this.semanticCache.get(cacheKey)!;
    }

    let similarity = 0;

    // 1. Exact match (highest score)
    if (col1.toLowerCase() === col2.toLowerCase()) {
      similarity = 1.0;
    }
    // 2. Cleaned name match (remove prefixes/suffixes)
    else {
      const clean1 = this.cleanColumnName(col1);
      const clean2 = this.cleanColumnName(col2);
      
      if (clean1 === clean2) {
        similarity = 0.95;
      }
      // 3. Domain knowledge matching
      else {
        similarity = Math.max(
          this.domainBasedSimilarity(clean1, clean2),
          this.patternBasedSimilarity(col1, col2),
          this.structuralSimilarity(col1, col2),
          this.fuzzyStringSimilarity(clean1, clean2)
        );
      }
    }

    this.semanticCache.set(cacheKey, similarity);
    return similarity;
  }

  /**
   * Analyze distribution similarity between column data
   */
  distributionSimilarity(data1: any[], data2: any[]): JoinConfidence {
    const stats1 = this.calculateDetailedStats(data1);
    const stats2 = this.calculateDetailedStats(data2);

    const statistical = this.compareStatisticalProperties(stats1, stats2);
    const structural = this.compareStructuralProperties(stats1, stats2);
    const domain = this.compareDomainProperties(stats1, stats2);
    const semantic = this.compareSemanticProperties(stats1, stats2);

    const overall = (statistical + structural + domain + semantic) / 4;

    return {
      overall,
      statistical,
      structural,
      domain,
      semantic
    };
  }

  /**
   * Detect cardinality relationship between two columns
   */
  detectCardinality(
    table1: TableMeta, 
    table2: TableMeta, 
    col1: string, 
    col2: string
  ): CardinalityType {
    const schema1 = table1.schema.find(s => s.name === col1);
    const schema2 = table2.schema.find(s => s.name === col2);

    if (!schema1 || !schema2) {
      return CardinalityType.MANY_TO_MANY;
    }

    // Analyze uniqueness patterns
    const unique1 = schema1.unique || schema1.distinctCount === table1.rowCount;
    const unique2 = schema2.unique || schema2.distinctCount === table2.rowCount;

    if (unique1 && unique2) {
      return CardinalityType.ONE_TO_ONE;
    } else if (unique1 && !unique2) {
      return CardinalityType.ONE_TO_MANY;
    } else if (!unique1 && unique2) {
      return CardinalityType.MANY_TO_ONE;
    } else {
      return CardinalityType.MANY_TO_MANY;
    }
  }

  /**
   * Infer foreign key relationships using statistical signatures
   */
  inferForeignKeys(tables: TableMeta[]): ForeignKeyCandidate[] {
    const candidates: ForeignKeyCandidate[] = [];

    for (let i = 0; i < tables.length; i++) {
      for (let j = 0; j < tables.length; j++) {
        if (i === j) continue;

        const fkCandidates = this.detectForeignKeysBetweenTables(tables[i], tables[j]);
        candidates.push(...fkCandidates);
      }
    }

    return candidates
      .filter(c => c.confidence >= 0.6)
      .sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Suggest optimal join strategy based on column characteristics
   */
  suggestJoinStrategy(
    col1: ColumnSchema, 
    col2: ColumnSchema, 
    semanticSim: number,
    distributionSim: JoinConfidence
  ): JoinStrategy {
    // Exact match strategy
    if (semanticSim >= 0.95 && distributionSim.overall >= 0.9) {
      return JoinStrategy.EXACT_MATCH;
    }

    // Semantic match for similar naming
    if (semanticSim >= 0.8) {
      return JoinStrategy.SEMANTIC_MATCH;
    }

    // Pattern match for formatted data
    if (this.hasCommonPatterns(col1, col2)) {
      return JoinStrategy.PATTERN_MATCH;
    }

    // Range overlap for numeric/date data
    if (this.isNumericOrDate(col1.type) && this.isNumericOrDate(col2.type)) {
      return JoinStrategy.RANGE_OVERLAP;
    }

    // Fuzzy match for string data with variations
    if (col1.type === DataType.STRING && col2.type === DataType.STRING) {
      return JoinStrategy.FUZZY_MATCH;
    }

    return JoinStrategy.STATISTICAL_MATCH;
  }

  // Private helper methods

  private initializePatterns(): void {
    this.commonPatterns = new Map([
      ['id', ['identifier', 'key', 'pk', 'primary_key', 'id_number']],
      ['name', ['title', 'label', 'full_name', 'display_name', 'description']],
      ['email', ['mail', 'email_address', 'e_mail', 'contact_email']],
      ['phone', ['telephone', 'mobile', 'contact_number', 'phone_number']],
      ['date', ['time', 'timestamp', 'created_at', 'updated_at', 'date_time']],
      ['address', ['location', 'street', 'addr', 'postal_address']],
      ['code', ['abbreviation', 'short_code', 'symbol', 'reference']],
      ['amount', ['price', 'cost', 'value', 'total', 'sum']],
      ['count', ['quantity', 'number', 'num', 'total_count']],
      ['status', ['state', 'condition', 'flag', 'is_active']]
    ]);
  }

  private initializeDomainKnowledge(): void {
    this.domainKnowledge = new Map([
      // Customer domain
      ['customer', ['client', 'user', 'account', 'member', 'subscriber']],
      ['order', ['purchase', 'transaction', 'sale', 'booking', 'reservation']],
      ['product', ['item', 'article', 'good', 'service', 'offering']],
      
      // Financial domain
      ['payment', ['transaction', 'charge', 'billing', 'invoice']],
      ['account', ['wallet', 'balance', 'ledger', 'financial_account']],
      
      // Geographic domain
      ['country', ['nation', 'territory', 'state', 'region']],
      ['city', ['town', 'municipality', 'locality', 'urban_area']],
      
      // Temporal domain
      ['start', ['begin', 'commence', 'initiate', 'open']],
      ['end', ['finish', 'complete', 'close', 'terminate']],
      
      // Business domain
      ['employee', ['staff', 'worker', 'personnel', 'team_member']],
      ['department', ['division', 'unit', 'section', 'group']],
      ['manager', ['supervisor', 'lead', 'director', 'head']],
      
      // Technical domain
      ['server', ['host', 'machine', 'node', 'instance']],
      ['database', ['db', 'datastore', 'repository', 'storage']],
      ['application', ['app', 'system', 'platform', 'service']]
    ]);
  }

  private cleanColumnName(name: string): string {
    return name.toLowerCase()
      // Remove table prefixes
      .replace(/^(tbl_|table_|tb_|t_)/, '')
      // Remove common suffixes
      .replace(/_(id|key|fk|pk|number|num|code|cd)$/, '')
      // Remove common prefixes
      .replace(/^(is_|has_|can_|should_)/, '')
      // Normalize separators
      .replace(/[_\s\-\.]+/g, '_')
      // Remove trailing/leading underscores
      .replace(/^_+|_+$/g, '')
      .trim();
  }

  private domainBasedSimilarity(name1: string, name2: string): number {
    for (const [domain, synonyms] of this.domainKnowledge) {
      const inDomain1 = name1.includes(domain) || synonyms.some(s => name1.includes(s));
      const inDomain2 = name2.includes(domain) || synonyms.some(s => name2.includes(s));
      
      if (inDomain1 && inDomain2) {
        return 0.85;
      }
    }
    return 0;
  }

  private patternBasedSimilarity(name1: string, name2: string): number {
    for (const [pattern, variations] of this.commonPatterns) {
      const matches1 = name1.toLowerCase().includes(pattern) || 
                      variations.some(v => name1.toLowerCase().includes(v));
      const matches2 = name2.toLowerCase().includes(pattern) || 
                      variations.some(v => name2.toLowerCase().includes(v));
      
      if (matches1 && matches2) {
        return 0.8;
      }
    }
    return 0;
  }

  private structuralSimilarity(name1: string, name2: string): number {
    // Compare structural patterns
    const pattern1 = this.extractStructuralPattern(name1);
    const pattern2 = this.extractStructuralPattern(name2);
    
    if (pattern1 === pattern2) {
      return 0.7;
    }
    
    // Check for similar prefixes/suffixes
    const commonPrefix = this.longestCommonPrefix(name1.toLowerCase(), name2.toLowerCase());
    const commonSuffix = this.longestCommonSuffix(name1.toLowerCase(), name2.toLowerCase());
    
    const totalLength = Math.max(name1.length, name2.length);
    const similarity = (commonPrefix.length + commonSuffix.length) / totalLength;
    
    return Math.min(similarity * 0.6, 0.6); // Cap at 0.6 for structural similarity
  }

  private fuzzyStringSimilarity(str1: string, str2: string): number {
    const distance = this.levenshteinDistance(str1, str2);
    const maxLength = Math.max(str1.length, str2.length);
    
    if (maxLength === 0) return 1;
    
    const similarity = 1 - (distance / maxLength);
    return Math.max(similarity - 0.3, 0); // Apply threshold to reduce noise
  }

  private calculateDetailedStats(data: any[]): any {
    const nonNullData = data.filter(d => d != null);
    const stringData = nonNullData.filter(d => typeof d === 'string');
    const numericData = nonNullData.filter(d => typeof d === 'number' || !isNaN(Number(d)));
    
    return {
      total: data.length,
      nonNull: nonNullData.length,
      unique: new Set(nonNullData).size,
      
      // String statistics
      avgLength: stringData.length > 0 ? 
        stringData.reduce((sum, s) => sum + String(s).length, 0) / stringData.length : 0,
      maxLength: stringData.length > 0 ? 
        Math.max(...stringData.map(s => String(s).length)) : 0,
      minLength: stringData.length > 0 ? 
        Math.min(...stringData.map(s => String(s).length)) : 0,
      
      // Numeric statistics
      min: numericData.length > 0 ? Math.min(...numericData.map(Number)) : null,
      max: numericData.length > 0 ? Math.max(...numericData.map(Number)) : null,
      mean: numericData.length > 0 ? 
        numericData.reduce((sum, n) => sum + Number(n), 0) / numericData.length : null,
      
      // Patterns
      patterns: this.extractDataPatterns(nonNullData),
      types: this.analyzeDataTypes(nonNullData),
      
      // Distribution
      distribution: this.calculateDistribution(nonNullData)
    };
  }

  private compareStatisticalProperties(stats1: any, stats2: any): number {
    let score = 0;
    let factors = 0;

    // Compare ranges for numeric data
    if (stats1.min !== null && stats2.min !== null) {
      const range1 = stats1.max - stats1.min;
      const range2 = stats2.max - stats2.min;
      const overlap = Math.max(0, Math.min(stats1.max, stats2.max) - Math.max(stats1.min, stats2.min));
      
      if (range1 > 0 && range2 > 0) {
        score += overlap / Math.max(range1, range2);
        factors++;
      }
    }

    // Compare string lengths
    if (stats1.avgLength > 0 && stats2.avgLength > 0) {
      const lengthSim = 1 - Math.abs(stats1.avgLength - stats2.avgLength) / Math.max(stats1.avgLength, stats2.avgLength);
      score += lengthSim;
      factors++;
    }

    // Compare uniqueness ratios
    const uniqueRatio1 = stats1.unique / stats1.nonNull;
    const uniqueRatio2 = stats2.unique / stats2.nonNull;
    const uniqueSim = 1 - Math.abs(uniqueRatio1 - uniqueRatio2);
    score += uniqueSim;
    factors++;

    return factors > 0 ? score / factors : 0;
  }

  private compareStructuralProperties(stats1: any, stats2: any): number {
    let score = 0;
    let factors = 0;

    // Compare data type distributions
    const typeOverlap = this.calculateTypeOverlap(stats1.types, stats2.types);
    score += typeOverlap;
    factors++;

    // Compare pattern similarities
    const patternOverlap = this.calculatePatternOverlap(stats1.patterns, stats2.patterns);
    score += patternOverlap;
    factors++;

    return factors > 0 ? score / factors : 0;
  }

  private compareDomainProperties(stats1: any, stats2: any): number {
    // Compare domain-specific patterns (emails, phones, dates, etc.)
    const domainScore = this.calculateDomainSpecificSimilarity(stats1.patterns, stats2.patterns);
    return domainScore;
  }

  private compareSemanticProperties(stats1: any, stats2: any): number {
    // This would integrate with NLP libraries for semantic analysis
    // For now, return a basic score based on pattern matching
    return this.calculatePatternOverlap(stats1.patterns, stats2.patterns) * 0.5;
  }

  private detectForeignKeysBetweenTables(table1: TableMeta, table2: TableMeta): ForeignKeyCandidate[] {
    const candidates: ForeignKeyCandidate[] = [];

    for (const col1 of table1.schema) {
      for (const col2 of table2.schema) {
        const semantic = this.semanticSimilarity(col1.name, col2.name);
        
        if (semantic >= 0.6) {
          // Additional checks for FK likelihood
          const isForeignKeyLikely = this.assessForeignKeyLikelihood(col1, col2, table1, table2);
          
          if (isForeignKeyLikely) {
            candidates.push({
              table: table1.tableName,
              column: col1.name,
              referencedTable: table2.tableName,
              referencedColumn: col2.name,
              confidence: semantic * isForeignKeyLikely,
              matchingRows: 0, // Would be calculated from actual data
              totalRows: table1.rowCount,
              violations: 0
            });
          }
        }
      }
    }

    return candidates;
  }

  private assessForeignKeyLikelihood(
    col1: ColumnSchema, 
    col2: ColumnSchema, 
    table1: TableMeta, 
    table2: TableMeta
  ): number {
    let likelihood = 0.5; // Base likelihood

    // FK columns are often non-unique in the referencing table
    if (!col1.unique && col2.unique) {
      likelihood += 0.3;
    }

    // FK columns typically have high cardinality but not 100% unique
    const cardinality1 = col1.distinctCount / table1.rowCount;
    if (cardinality1 > 0.1 && cardinality1 < 0.9) {
      likelihood += 0.2;
    }

    // Same data types
    if (col1.type === col2.type) {
      likelihood += 0.2;
    }

    // Naming patterns suggesting relationships
    if (col1.name.toLowerCase().includes(table2.tableName.toLowerCase()) ||
        col1.name.toLowerCase().includes('id')) {
      likelihood += 0.3;
    }

    return Math.min(likelihood, 1.0);
  }

  private hasCommonPatterns(col1: ColumnSchema, col2: ColumnSchema): boolean {
    const patterns1 = new Set(col1.patterns);
    const patterns2 = new Set(col2.patterns);
    const intersection = new Set([...patterns1].filter(p => patterns2.has(p)));
    
    return intersection.size > 0;
  }

  private isNumericOrDate(type: DataType): boolean {
    return [DataType.INTEGER, DataType.FLOAT, DataType.DATE, DataType.DATETIME].includes(type);
  }

  private extractStructuralPattern(name: string): string {
    return name.replace(/[a-zA-Z]/g, 'X').replace(/[0-9]/g, 'N').replace(/[^XN]/g, '_');
  }

  private longestCommonPrefix(str1: string, str2: string): string {
    let i = 0;
    while (i < Math.min(str1.length, str2.length) && str1[i] === str2[i]) {
      i++;
    }
    return str1.substring(0, i);
  }

  private longestCommonSuffix(str1: string, str2: string): string {
    let i = 0;
    while (i < Math.min(str1.length, str2.length) && 
           str1[str1.length - 1 - i] === str2[str2.length - 1 - i]) {
      i++;
    }
    return str1.substring(str1.length - i);
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

  private extractDataPatterns(data: any[]): string[] {
    const patterns: string[] = [];
    const sample = data.slice(0, 100);

    // Email pattern
    if (sample.some(d => /\S+@\S+\.\S+/.test(String(d)))) {
      patterns.push('email');
    }

    // Phone pattern
    if (sample.some(d => /^\+?[\d\s\-\(\)]+$/.test(String(d)))) {
      patterns.push('phone');
    }

    // UUID pattern
    if (sample.some(d => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(d)))) {
      patterns.push('uuid');
    }

    // URL pattern
    if (sample.some(d => /^https?:\/\//.test(String(d)))) {
      patterns.push('url');
    }

    // Date patterns
    if (sample.some(d => /^\d{4}-\d{2}-\d{2}$/.test(String(d)))) {
      patterns.push('date_iso');
    }

    if (sample.some(d => /^\d{2}\/\d{2}\/\d{4}$/.test(String(d)))) {
      patterns.push('date_us');
    }

    return patterns;
  }

  private analyzeDataTypes(data: any[]): Record<string, number> {
    const types: Record<string, number> = {};
    
    for (const item of data) {
      const type = typeof item;
      types[type] = (types[type] || 0) + 1;
    }

    return types;
  }

  private calculateDistribution(data: any[]): any {
    const freq: Record<string, number> = {};
    
    for (const item of data) {
      const key = String(item);
      freq[key] = (freq[key] || 0) + 1;
    }

    return {
      uniqueValues: Object.keys(freq).length,
      mostFrequent: Object.entries(freq).sort(([,a], [,b]) => b - a)[0],
      distribution: freq
    };
  }

  private calculateTypeOverlap(types1: Record<string, number>, types2: Record<string, number>): number {
    const keys1 = new Set(Object.keys(types1));
    const keys2 = new Set(Object.keys(types2));
    const intersection = new Set([...keys1].filter(k => keys2.has(k)));
    const union = new Set([...keys1, ...keys2]);
    
    return intersection.size / union.size;
  }

  private calculatePatternOverlap(patterns1: string[], patterns2: string[]): number {
    const set1 = new Set(patterns1);
    const set2 = new Set(patterns2);
    const intersection = new Set([...set1].filter(p => set2.has(p)));
    const union = new Set([...set1, ...set2]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  private calculateDomainSpecificSimilarity(patterns1: string[], patterns2: string[]): number {
    const domainPatterns = ['email', 'phone', 'uuid', 'url', 'date_iso', 'date_us'];
    
    const domain1 = patterns1.filter(p => domainPatterns.includes(p));
    const domain2 = patterns2.filter(p => domainPatterns.includes(p));
    
    if (domain1.length === 0 && domain2.length === 0) return 0;
    
    const commonDomain = domain1.filter(p => domain2.includes(p));
    return commonDomain.length / Math.max(domain1.length, domain2.length);
  }
}