export function detectBusinessRules(data, headers, columnTypes) {
  const rules = [];
  
  headers.forEach((header, colIndex) => {
    const columnData = data.map(row => row[colIndex]);
    const type = columnTypes[header];

    if (type === 'numeric') {
      const numericRules = detectNumericRules(columnData, header, data, headers, colIndex);
      rules.push(...numericRules);
    }

    const constraintRules = detectConstraintRules(columnData, header);
    rules.push(...constraintRules);

    const conditionalRules = detectConditionalRules(data, headers, colIndex);
    rules.push(...conditionalRules);
  });

  const derivedFieldRules = detectDerivedFieldRules(data, headers, columnTypes);
  rules.push(...derivedFieldRules);

  const relationshipRules = detectRelationshipRules(data, headers);
  rules.push(...relationshipRules);

  return rules.filter(rule => rule.confidence >= 95);
}

function detectNumericRules(values, fieldName, allData, allHeaders, colIndex) {
  const rules = [];
  const numericValues = values
    .filter(v => v !== null && v !== '')
    .map(v => parseFloat(v))
    .filter(v => !isNaN(v));

  if (numericValues.length === 0) return rules;

  const min = Math.min(...numericValues);
  const max = Math.max(...numericValues);
  const mean = numericValues.reduce((a, b) => a + b, 0) / numericValues.length;

  if (min >= 0 && max <= 150 && fieldName.toLowerCase().includes('age')) {
    const violations = numericValues.filter(v => v < 0 || v > 120);
    const confidence = ((numericValues.length - violations.length) / numericValues.length) * 100;
    
    if (confidence >= 95) {
      rules.push({
        type: 'RANGE_CONSTRAINT',
        field: fieldName,
        rule: `${fieldName} BETWEEN 0 AND 120`,
        confidence: confidence,
        violations: violations.length,
        examples: violations.slice(0, 3),
        sql: `CHECK (${fieldName} >= 0 AND ${fieldName} <= 120)`,
        description: 'Age must be between 0 and 120 years'
      });
    }
  }

  if (min >= 0 && fieldName.toLowerCase().match(/price|amount|cost|revenue|total/)) {
    const violations = numericValues.filter(v => v < 0);
    const confidence = ((numericValues.length - violations.length) / numericValues.length) * 100;
    
    if (confidence >= 95) {
      rules.push({
        type: 'NON_NEGATIVE_CONSTRAINT',
        field: fieldName,
        rule: `${fieldName} >= 0`,
        confidence: confidence,
        violations: violations.length,
        sql: `CHECK (${fieldName} >= 0)`,
        description: 'Monetary values must be non-negative'
      });
    }
  }

  const roundNumberPercentage = (numericValues.filter(v => v % 1 === 0).length / numericValues.length) * 100;
  if (roundNumberPercentage > 98 && !fieldName.toLowerCase().includes('decimal')) {
    rules.push({
      type: 'INTEGER_CONSTRAINT',
      field: fieldName,
      rule: `${fieldName} must be whole number`,
      confidence: roundNumberPercentage,
      violations: numericValues.filter(v => v % 1 !== 0).length,
      sql: `CHECK (${fieldName} = FLOOR(${fieldName}))`,
      description: 'Field contains only whole numbers'
    });
  }

  return rules;
}

function detectConstraintRules(values, fieldName) {
  const rules = [];
  const nonNullValues = values.filter(v => v !== null && v !== '');
  
  if (nonNullValues.length === 0) return rules;

  const uniqueValues = [...new Set(nonNullValues)];
  const uniquenessRatio = uniqueValues.length / nonNullValues.length;

  if (uniquenessRatio === 1 && fieldName.toLowerCase().match(/id|email|username|code|reference/)) {
    rules.push({
      type: 'UNIQUENESS_CONSTRAINT',
      field: fieldName,
      rule: `${fieldName} must be unique`,
      confidence: 100,
      violations: 0,
      sql: `UNIQUE (${fieldName})`,
      description: 'All values are currently unique'
    });
  }

  const lengthCounts = {};
  nonNullValues.forEach(value => {
    const length = String(value).length;
    lengthCounts[length] = (lengthCounts[length] || 0) + 1;
  });

  const dominantLength = Object.entries(lengthCounts)
    .sort((a, b) => b[1] - a[1])[0];
  
  if (dominantLength && dominantLength[1] / nonNullValues.length > 0.95) {
    const expectedLength = parseInt(dominantLength[0]);
    const violations = nonNullValues.filter(v => String(v).length !== expectedLength);
    
    rules.push({
      type: 'LENGTH_CONSTRAINT',
      field: fieldName,
      rule: `LENGTH(${fieldName}) = ${expectedLength}`,
      confidence: (dominantLength[1] / nonNullValues.length) * 100,
      violations: violations.length,
      examples: violations.slice(0, 3),
      sql: `CHECK (LENGTH(${fieldName}) = ${expectedLength})`,
      description: `Field has fixed length of ${expectedLength} characters`
    });
  }

  const patternMatches = detectPatternConstraint(nonNullValues, fieldName);
  if (patternMatches) {
    rules.push(patternMatches);
  }

  return rules;
}

function detectPatternConstraint(values, fieldName) {
  const patterns = [
    { 
      name: 'ALPHANUMERIC_UPPERCASE',
      regex: /^[A-Z0-9]+$/,
      sql: "CHECK ({field} ~ '^[A-Z0-9]+$')",
      description: 'Only uppercase letters and numbers'
    },
    { 
      name: 'NUMERIC_ONLY',
      regex: /^[0-9]+$/,
      sql: "CHECK ({field} ~ '^[0-9]+$')",
      description: 'Only numeric digits'
    },
    { 
      name: 'EMAIL_FORMAT',
      regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      sql: "CHECK ({field} ~ '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$')",
      description: 'Valid email format'
    },
    { 
      name: 'CODE_PATTERN',
      regex: /^[A-Z]{2,3}-[0-9]{4,6}$/,
      sql: "CHECK ({field} ~ '^[A-Z]{2,3}-[0-9]{4,6}$')",
      description: 'Code pattern like ABC-12345'
    }
  ];

  for (const pattern of patterns) {
    const matches = values.filter(v => pattern.regex.test(String(v))).length;
    const confidence = (matches / values.length) * 100;
    
    if (confidence >= 95) {
      const violations = values.filter(v => !pattern.regex.test(String(v)));
      return {
        type: 'PATTERN_CONSTRAINT',
        field: fieldName,
        rule: `${fieldName} matches ${pattern.name}`,
        confidence: confidence,
        violations: violations.length,
        examples: violations.slice(0, 3),
        sql: pattern.sql.replace('{field}', fieldName),
        description: pattern.description
      };
    }
  }

  return null;
}

function detectConditionalRules(data, headers, targetColIndex) {
  const rules = [];
  const targetHeader = headers[targetColIndex];
  
  headers.forEach((conditionHeader, conditionIndex) => {
    if (conditionIndex === targetColIndex) return;
    
    const conditionalPatterns = analyseConditionalPatterns(
      data, 
      conditionIndex, 
      targetColIndex,
      conditionHeader,
      targetHeader
    );
    
    conditionalPatterns.forEach(pattern => {
      if (pattern.confidence >= 95) {
        rules.push(pattern);
      }
    });
  });

  return rules;
}

function analyseConditionalPatterns(data, conditionCol, targetCol, conditionHeader, targetHeader) {
  const patterns = [];
  const conditionalValues = {};
  
  data.forEach(row => {
    const condition = row[conditionCol];
    const target = row[targetCol];
    
    if (condition !== null && condition !== '' && target !== null && target !== '') {
      if (!conditionalValues[condition]) {
        conditionalValues[condition] = {};
      }
      const key = String(target);
      conditionalValues[condition][key] = (conditionalValues[condition][key] || 0) + 1;
    }
  });

  Object.entries(conditionalValues).forEach(([conditionValue, targetDistribution]) => {
    const totalCount = Object.values(targetDistribution).reduce((a, b) => a + b, 0);
    
    Object.entries(targetDistribution).forEach(([targetValue, count]) => {
      const percentage = (count / totalCount) * 100;
      
      if (percentage >= 95 && totalCount >= 10) {
        patterns.push({
          type: 'CONDITIONAL_CONSTRAINT',
          field: targetHeader,
          rule: `IF ${conditionHeader} = '${conditionValue}' THEN ${targetHeader} = '${targetValue}'`,
          confidence: percentage,
          violations: totalCount - count,
          occurrences: totalCount,
          sql: `CHECK (${conditionHeader} != '${conditionValue}' OR ${targetHeader} = '${targetValue}')`,
          description: `When ${conditionHeader} is '${conditionValue}', ${targetHeader} is always '${targetValue}'`
        });
      }
    });

    const uniqueTargets = Object.keys(targetDistribution).length;
    if (uniqueTargets === 1 && totalCount >= 5 && 
        conditionHeader.toLowerCase().includes('status') && 
        targetHeader.toLowerCase().includes('email')) {
      const targetValue = Object.keys(targetDistribution)[0];
      if (targetValue === '') {
        patterns.push({
          type: 'SOFT_DELETE_PATTERN',
          field: targetHeader,
          rule: `${targetHeader} is empty when ${conditionHeader} = '${conditionValue}'`,
          confidence: 100,
          violations: 0,
          occurrences: totalCount,
          sql: `UNIQUE (${targetHeader}) WHERE ${conditionHeader} != '${conditionValue}'`,
          description: 'Soft delete pattern detected - field cleared on status change'
        });
      }
    }
  });

  return patterns;
}

function detectDerivedFieldRules(data, headers, columnTypes) {
  const rules = [];
  
  headers.forEach((header, colIndex) => {
    if (!header.toLowerCase().match(/total|sum|calculated|derived/)) return;
    
    const potentialComponents = findPotentialComponents(header, headers);
    if (potentialComponents.length === 0) return;

    let bestMatch = null;
    let bestConfidence = 0;

    potentialComponents.forEach(components => {
      let matchCount = 0;
      let totalCount = 0;

      data.forEach(row => {
        const targetValue = parseFloat(row[colIndex]);
        if (isNaN(targetValue)) return;

        const sum = components.reduce((acc, compIndex) => {
          const val = parseFloat(row[compIndex]);
          return acc + (isNaN(val) ? 0 : val);
        }, 0);

        totalCount++;
        if (Math.abs(targetValue - sum) < 0.01) {
          matchCount++;
        }
      });

      const confidence = totalCount > 0 ? (matchCount / totalCount) * 100 : 0;
      if (confidence > bestConfidence) {
        bestConfidence = confidence;
        bestMatch = {
          components: components,
          matchCount: matchCount,
          totalCount: totalCount
        };
      }
    });

    if (bestMatch && bestConfidence >= 95) {
      const componentNames = bestMatch.components.map(idx => headers[idx]);
      const violations = bestMatch.totalCount - bestMatch.matchCount;
      
      rules.push({
        type: 'DERIVED_FIELD_RULE',
        field: header,
        rule: `${header} = SUM(${componentNames.join(', ')})`,
        confidence: bestConfidence,
        violations: violations,
        components: componentNames,
        sql: `CHECK (${header} = ${componentNames.join(' + ')})`,
        description: 'Calculated field should equal sum of components',
        discrepancies: analyseDiscrepancies(data, colIndex, bestMatch.components)
      });
    }
  });

  return rules;
}

function findPotentialComponents(targetField, headers) {
  const candidates = [];
  const baseName = targetField.toLowerCase()
    .replace('total', '')
    .replace('sum', '')
    .replace('calculated', '')
    .trim();

  const relatedIndices = headers
    .map((h, i) => ({ header: h, index: i }))
    .filter(item => {
      const headerLower = item.header.toLowerCase();
      return item.header !== targetField &&
             !headerLower.includes('total') &&
             !headerLower.includes('sum') &&
             (headerLower.includes(baseName) || baseName.includes(headerLower));
    })
    .map(item => item.index);

  if (relatedIndices.length >= 2) {
    candidates.push(relatedIndices);
  }

  for (let i = 2; i <= Math.min(4, relatedIndices.length); i++) {
    const combinations = getCombinations(relatedIndices, i);
    candidates.push(...combinations);
  }

  return candidates;
}

function getCombinations(arr, size) {
  const result = [];
  
  function combine(start, combo) {
    if (combo.length === size) {
      result.push([...combo]);
      return;
    }
    
    for (let i = start; i < arr.length; i++) {
      combo.push(arr[i]);
      combine(i + 1, combo);
      combo.pop();
    }
  }
  
  combine(0, []);
  return result;
}

function analyseDiscrepancies(data, targetCol, componentCols) {
  const discrepancies = [];
  
  data.forEach((row, index) => {
    const target = parseFloat(row[targetCol]);
    const sum = componentCols.reduce((acc, col) => {
      const val = parseFloat(row[col]);
      return acc + (isNaN(val) ? 0 : val);
    }, 0);
    
    if (!isNaN(target) && Math.abs(target - sum) >= 0.01) {
      discrepancies.push({
        row: index + 1,
        expected: sum,
        actual: target,
        difference: target - sum
      });
    }
  });

  const analysis = {
    count: discrepancies.length,
    range: discrepancies.length > 0 ? {
      min: Math.min(...discrepancies.map(d => d.difference)),
      max: Math.max(...discrepancies.map(d => d.difference))
    } : null,
    examples: discrepancies.slice(0, 3)
  };

  return analysis;
}

function detectRelationshipRules(data, headers) {
  const rules = [];
  
  const idColumns = headers
    .map((h, i) => ({ header: h, index: i }))
    .filter(col => col.header.toLowerCase().endsWith('_id') || 
                   col.header.toLowerCase().includes('_id_'));

  idColumns.forEach(idCol => {
    const entityName = idCol.header.toLowerCase()
      .replace('_id', '')
      .replace('id_', '');
    
    const values = data.map(row => row[idCol.index])
      .filter(v => v !== null && v !== '');
    
    const uniqueValues = [...new Set(values)];
    const cardinality = uniqueValues.length / values.length;

    if (cardinality < 0.5) {
      rules.push({
        type: 'FOREIGN_KEY_CONSTRAINT',
        field: idCol.header,
        rule: `${idCol.header} references ${entityName}(id)`,
        confidence: 99,
        violations: 0,
        cardinality: `Many-to-one (${uniqueValues.length} unique values)`,
        sql: `FOREIGN KEY (${idCol.header}) REFERENCES ${entityName}(id)`,
        description: `Foreign key relationship to ${entityName} table detected`
      });
    }
  });

  return rules;
}