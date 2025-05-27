/**
 * Data-driven relationship validation for ENG command
 * Validates potential relationships with actual data sampling
 */

export class RelationshipValidator {
  constructor(records, columns, columnTypes) {
    this.records = records;
    this.columns = columns;
    this.columnTypes = columnTypes;
    this.sampleSize = Math.min(1000, records.length);
  }

  /**
   * Validates a potential foreign key relationship with data sampling
   */
  async validateForeignKey(sourceColumn, targetTable, targetColumn = 'id') {
    const validation = {
      sourceColumn,
      targetTable,
      targetColumn,
      isValid: false,
      confidence: 0,
      dataValidation: {
        sampleSize: 0,
        matchingRecords: 0,
        distinctValues: 0,
        nullCount: 0,
        orphanedRecords: 0
      },
      issues: []
    };

    // Get sample of source column values
    const sourceValues = this.getSampleValues(sourceColumn, this.sampleSize);
    validation.dataValidation.sampleSize = sourceValues.length;
    validation.dataValidation.nullCount = this.records.filter(r => 
      r[sourceColumn] === null || r[sourceColumn] === undefined || r[sourceColumn] === ''
    ).length;

    // Calculate distinct values
    const distinctValues = new Set(sourceValues.filter(v => v !== null && v !== undefined && v !== ''));
    validation.dataValidation.distinctValues = distinctValues.size;

    // Check for format consistency
    const formatCheck = this.checkFormatConsistency(sourceValues);
    if (!formatCheck.isConsistent) {
      validation.issues.push({
        type: 'format_mismatch',
        message: `Inconsistent formats found: ${formatCheck.formats.join(', ')}`,
        severity: 'warning'
      });
      validation.confidence -= 0.2;
    }

    // Check cardinality (many-to-one expected for FK)
    const cardinalityRatio = distinctValues.size / sourceValues.length;
    if (cardinalityRatio > 0.95) {
      validation.issues.push({
        type: 'high_cardinality',
        message: 'Nearly unique values suggest this might not be a foreign key',
        severity: 'warning'
      });
      validation.confidence -= 0.3;
    }

    // Check for referential integrity patterns
    const integrityCheck = this.checkReferentialIntegrity(sourceValues, targetTable);
    validation.dataValidation.orphanedRecords = integrityCheck.orphanedCount;
    
    if (integrityCheck.orphanedRate > 0.1) {
      validation.issues.push({
        type: 'referential_integrity',
        message: `${(integrityCheck.orphanedRate * 100).toFixed(1)}% of records would be orphaned`,
        severity: 'critical'
      });
      validation.confidence -= 0.5;
    }

    // Calculate final confidence based on multiple factors
    validation.confidence = this.calculateRelationshipConfidence({
      nameMatch: this.calculateNameMatchScore(sourceColumn, targetTable),
      formatConsistency: formatCheck.consistency,
      cardinalityScore: 1 - cardinalityRatio,
      integrityScore: 1 - integrityCheck.orphanedRate,
      nullRate: validation.dataValidation.nullCount / this.records.length
    });

    validation.isValid = validation.confidence > 0.6;

    return validation;
  }

  /**
   * Validates relationships by comparing actual data values
   */
  async validateWithData(sourceColumn, targetData, targetColumn) {
    if (!targetData || targetData.length === 0) {
      return {
        isValid: false,
        confidence: 0,
        reason: 'No target data available for validation'
      };
    }

    const sourceValues = new Set(
      this.records
        .map(r => r[sourceColumn])
        .filter(v => v !== null && v !== undefined && v !== '')
    );

    const targetValues = new Set(
      targetData
        .map(r => r[targetColumn])
        .filter(v => v !== null && v !== undefined && v !== '')
    );

    const matches = [...sourceValues].filter(v => targetValues.has(v));
    const matchRate = matches.length / sourceValues.size;

    return {
      isValid: matchRate > 0.8,
      confidence: matchRate,
      matchingRecords: matches.length,
      orphanedRecords: sourceValues.size - matches.length,
      details: {
        sourceUnique: sourceValues.size,
        targetUnique: targetValues.size,
        overlap: matches.length
      }
    };
  }

  /**
   * Detects relationship patterns through data analysis
   */
  detectDataPatterns(column1, column2) {
    const patterns = {
      oneToOne: false,
      oneToMany: false,
      manyToMany: false,
      cardinality: null
    };

    const pairs = new Map();
    
    this.records.forEach(record => {
      const val1 = record[column1];
      const val2 = record[column2];
      
      if (val1 !== null && val2 !== null) {
        const key = `${val1}|${val2}`;
        pairs.set(key, (pairs.get(key) || 0) + 1);
      }
    });

    // Analyze cardinality
    const val1Groups = new Map();
    const val2Groups = new Map();
    
    pairs.forEach((count, key) => {
      const [val1, val2] = key.split('|');
      
      if (!val1Groups.has(val1)) val1Groups.set(val1, new Set());
      if (!val2Groups.has(val2)) val2Groups.set(val2, new Set());
      
      val1Groups.get(val1).add(val2);
      val2Groups.get(val2).add(val1);
    });

    // Determine relationship type
    const avgVal2PerVal1 = [...val1Groups.values()].reduce((sum, set) => sum + set.size, 0) / val1Groups.size;
    const avgVal1PerVal2 = [...val2Groups.values()].reduce((sum, set) => sum + set.size, 0) / val2Groups.size;

    if (avgVal2PerVal1 <= 1.1 && avgVal1PerVal2 <= 1.1) {
      patterns.oneToOne = true;
      patterns.cardinality = '1:1';
    } else if (avgVal2PerVal1 > 1.5 && avgVal1PerVal2 <= 1.1) {
      patterns.oneToMany = true;
      patterns.cardinality = '1:N';
    } else if (avgVal2PerVal1 > 1.5 && avgVal1PerVal2 > 1.5) {
      patterns.manyToMany = true;
      patterns.cardinality = 'M:N';
    }

    return patterns;
  }

  // Helper methods

  getSampleValues(column, sampleSize) {
    const step = Math.max(1, Math.floor(this.records.length / sampleSize));
    const values = [];
    
    for (let i = 0; i < this.records.length; i += step) {
      values.push(this.records[i][column]);
    }
    
    return values;
  }

  checkFormatConsistency(values) {
    const formats = new Map();
    
    values.forEach(value => {
      if (value !== null && value !== undefined && value !== '') {
        const format = this.detectValueFormat(value);
        formats.set(format, (formats.get(format) || 0) + 1);
      }
    });

    const totalValues = values.filter(v => v !== null && v !== undefined && v !== '').length;
    const dominantFormat = [...formats.entries()].sort((a, b) => b[1] - a[1])[0];
    
    return {
      isConsistent: formats.size === 1,
      consistency: dominantFormat ? dominantFormat[1] / totalValues : 0,
      formats: [...formats.keys()]
    };
  }

  detectValueFormat(value) {
    const strValue = String(value);
    
    if (/^\d+$/.test(strValue)) return 'numeric';
    if (/^[A-Z0-9]{2,10}$/.test(strValue)) return 'code_uppercase';
    if (/^[a-z0-9]{2,10}$/.test(strValue)) return 'code_lowercase';
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(strValue)) return 'uuid';
    if (/^[A-Z]{2,3}-\d{4,6}$/.test(strValue)) return 'prefixed_id';
    
    return 'mixed';
  }

  checkReferentialIntegrity(sourceValues, targetTable) {
    // Simulate checking against known ID patterns
    // In real implementation, this would check against actual target data
    const validPatterns = this.getExpectedPatterns(targetTable);
    let orphanedCount = 0;
    
    sourceValues.forEach(value => {
      if (value !== null && value !== undefined && value !== '') {
        const isValid = validPatterns.some(pattern => 
          pattern.test ? pattern.test(String(value)) : pattern === this.detectValueFormat(value)
        );
        if (!isValid) orphanedCount++;
      }
    });

    return {
      orphanedCount,
      orphanedRate: orphanedCount / sourceValues.length
    };
  }

  getExpectedPatterns(tableName) {
    // Common ID patterns by table type
    const patterns = {
      users: [/^\d+$/, 'numeric', 'uuid'],
      customers: [/^\d+$/, 'code_uppercase', 'prefixed_id'],
      products: [/^[A-Z0-9]{3,10}$/, 'code_uppercase', 'numeric'],
      orders: [/^\d+$/, 'prefixed_id', 'uuid'],
      transactions: [/^\d+$/, 'uuid', 'prefixed_id']
    };

    // Find best matching pattern
    for (const [key, value] of Object.entries(patterns)) {
      if (tableName.toLowerCase().includes(key)) {
        return value;
      }
    }

    // Default patterns
    return [/^\d+$/, 'numeric', 'uuid', 'code_uppercase'];
  }

  calculateNameMatchScore(sourceColumn, targetTable) {
    const colLower = sourceColumn.toLowerCase();
    const tableLower = targetTable.toLowerCase();
    
    // Direct match (e.g., user_id -> users)
    if (colLower.includes(tableLower.replace(/s$/, ''))) return 0.9;
    if (colLower.includes(tableLower)) return 0.8;
    
    // Partial match
    const colParts = colLower.split(/[_\s-]/);
    const tableParts = tableLower.split(/[_\s-]/);
    
    const matches = colParts.filter(part => 
      tableParts.some(tPart => part.includes(tPart) || tPart.includes(part))
    );
    
    return matches.length / Math.max(colParts.length, tableParts.length);
  }

  calculateRelationshipConfidence(factors) {
    // Weighted confidence calculation
    const weights = {
      nameMatch: 0.3,
      formatConsistency: 0.25,
      cardinalityScore: 0.2,
      integrityScore: 0.2,
      nullRate: 0.05
    };

    let confidence = 0;
    
    for (const [factor, value] of Object.entries(factors)) {
      if (weights[factor]) {
        confidence += weights[factor] * (factor === 'nullRate' ? 1 - value : value);
      }
    }

    return Math.min(1, Math.max(0, confidence));
  }
}

export function createRelationshipValidator(records, columns, columnTypes) {
  return new RelationshipValidator(records, columns, columnTypes);
}