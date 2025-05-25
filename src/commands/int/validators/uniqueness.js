export function analyseUniqueness(data, headers) {
  const results = {
    dimension: 'Uniqueness',
    weight: 0.10,
    issues: [],
    metrics: {},
    score: 100
  };

  const uniquenessAnalysis = {};
  
  headers.forEach((header, colIndex) => {
    const columnData = data.map(row => row[colIndex]).filter(val => val !== null && val !== '');
    if (columnData.length === 0) return;

    const analysis = analyseColumnUniqueness(columnData, header);
    uniquenessAnalysis[header] = analysis;

    if (analysis.exactDuplicates.count > 0) {
      const duplicateRate = (analysis.exactDuplicates.count / columnData.length) * 100;
      
      if (shouldBeUnique(header) && duplicateRate > 0) {
        results.issues.push({
          type: 'critical',
          field: header,
          message: `${analysis.exactDuplicates.count} duplicate values in supposedly unique field`,
          duplicateGroups: analysis.exactDuplicates.topGroups.slice(0, 3),
          impact: 'Data integrity violation - may cause system errors',
          fix: generateDuplicateFixSQL(header, analysis.exactDuplicates.groups)
        });
        results.score -= 20;
      } else if (duplicateRate > 10) {
        results.issues.push({
          type: 'warning',
          field: header,
          message: `High duplication rate: ${duplicateRate.toFixed(1)}%`,
          totalDuplicates: analysis.exactDuplicates.count,
          uniqueValues: analysis.uniqueValues,
          topDuplicates: analysis.exactDuplicates.topGroups.slice(0, 3)
        });
        results.score -= 5;
      }
    }

    if (analysis.uniquenessRatio < 0.5 && columnData.length > 100) {
      results.issues.push({
        type: 'observation',
        field: header,
        message: `Low uniqueness ratio: ${(analysis.uniquenessRatio * 100).toFixed(1)}%`,
        interpretation: 'May indicate categorical data or limited value range',
        distinctValues: analysis.uniqueValues
      });
    }

    if (header.toLowerCase().includes('id') && analysis.naturalKeyCandidate) {
      results.issues.push({
        type: 'observation',
        field: header,
        message: 'Potential natural key detected',
        uniqueness: `${(analysis.uniquenessRatio * 100).toFixed(1)}%`,
        recommendation: 'Consider using as primary/unique key'
      });
    }
  });

  const compositeDuplicates = findCompositeDuplicates(data, headers);
  if (compositeDuplicates.length > 0) {
    compositeDuplicates.forEach(compDup => {
      results.issues.push({
        type: 'warning',
        category: 'Composite Duplicates',
        message: `Duplicate records when combining ${compDup.fields.join(' + ')}`,
        duplicateCount: compDup.count,
        examples: compDup.examples.slice(0, 3),
        recommendation: 'Consider composite unique constraint'
      });
      results.score -= 5;
    });
  }

  const nearDuplicates = analyseNearDuplicates(data, headers);
  if (nearDuplicates.length > 0) {
    results.issues.push({
      type: 'warning',
      category: 'Near Duplicates',
      message: `${nearDuplicates.length} groups of near-duplicate records found`,
      topGroups: nearDuplicates.slice(0, 3).map(group => ({
        similarity: `${group.similarity}%`,
        recordCount: group.records.length,
        fields: group.matchingFields,
        examples: group.records.slice(0, 2)
      })),
      recommendation: 'Review for potential merge'
    });
    results.score -= 10;
  }

  results.metrics = {
    overallUniqueness: calculateOverallUniqueness(uniquenessAnalysis),
    exactDuplicateRecords: countTotalDuplicates(uniquenessAnalysis),
    nearDuplicateGroups: nearDuplicates.length,
    compositeDuplicateGroups: compositeDuplicates.length,
    columnsWithDuplicates: Object.values(uniquenessAnalysis)
      .filter(a => a.exactDuplicates.count > 0).length,
    uniquenessAnalysis: uniquenessAnalysis
  };

  results.score = Math.max(0, results.score);
  return results;
}

function analyseColumnUniqueness(values, columnName) {
  const valueCounts = {};
  const duplicateGroups = {};
  
  values.forEach((value, index) => {
    const key = String(value);
    valueCounts[key] = (valueCounts[key] || 0) + 1;
    
    if (!duplicateGroups[key]) {
      duplicateGroups[key] = [];
    }
    duplicateGroups[key].push(index);
  });

  const uniqueValues = Object.keys(valueCounts).length;
  const duplicates = Object.entries(valueCounts)
    .filter(([_, count]) => count > 1);
  
  const duplicateCount = duplicates.reduce((sum, [_, count]) => sum + count - 1, 0);
  
  const topGroups = duplicates
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([value, count]) => ({
      value: value.length > 50 ? value.substring(0, 47) + '...' : value,
      count: count,
      percentage: ((count / values.length) * 100).toFixed(1)
    }));

  const isNaturalKey = uniqueValues === values.length || 
                      (uniqueValues / values.length) > 0.99;

  return {
    totalValues: values.length,
    uniqueValues: uniqueValues,
    uniquenessRatio: uniqueValues / values.length,
    exactDuplicates: {
      count: duplicateCount,
      groups: duplicateGroups,
      topGroups: topGroups
    },
    naturalKeyCandidate: isNaturalKey,
    entropy: calculateEntropy(valueCounts, values.length)
  };
}

function shouldBeUnique(columnName) {
  const uniqueIndicators = [
    'id', 'code', 'number', 'key', 'email', 'username', 
    'account', 'reference', 'sku', 'isbn', 'ean', 'upc',
    'ssn', 'ein', 'abn', 'acn', 'phone', 'mobile'
  ];
  
  const columnLower = columnName.toLowerCase();
  return uniqueIndicators.some(indicator => columnLower.includes(indicator));
}

function findCompositeDuplicates(data, headers) {
  const compositeDuplicates = [];
  
  const candidateCombinations = generateCandidateCombinations(headers);
  
  candidateCombinations.forEach(combination => {
    const compositeKeys = {};
    
    data.forEach((row, index) => {
      const key = combination.indices
        .map(idx => row[idx])
        .filter(val => val !== null && val !== '')
        .join('|');
      
      if (!compositeKeys[key]) {
        compositeKeys[key] = [];
      }
      compositeKeys[key].push(index);
    });

    const duplicates = Object.entries(compositeKeys)
      .filter(([_, indices]) => indices.length > 1);

    if (duplicates.length > 0) {
      const totalDuplicates = duplicates.reduce((sum, [_, indices]) => 
        sum + indices.length - 1, 0);
      
      if (totalDuplicates > data.length * 0.01) {
        compositeDuplicates.push({
          fields: combination.fields,
          count: totalDuplicates,
          groups: duplicates.length,
          examples: duplicates.slice(0, 3).map(([key, indices]) => ({
            compositeKey: key,
            recordCount: indices.length,
            rows: indices.slice(0, 5).map(i => i + 1)
          }))
        });
      }
    }
  });

  return compositeDuplicates.sort((a, b) => b.count - a.count);
}

function generateCandidateCombinations(headers) {
  const combinations = [];
  
  const keyFields = headers.map((h, i) => ({ header: h, index: i }))
    .filter(field => {
      const lower = field.header.toLowerCase();
      return lower.includes('name') || lower.includes('email') || 
             lower.includes('phone') || lower.includes('address') ||
             lower.includes('id') || lower.includes('code');
    });

  for (let i = 0; i < keyFields.length - 1; i++) {
    for (let j = i + 1; j < keyFields.length; j++) {
      combinations.push({
        fields: [keyFields[i].header, keyFields[j].header],
        indices: [keyFields[i].index, keyFields[j].index]
      });
    }
  }

  return combinations.slice(0, 10);
}

function analyseNearDuplicates(data, headers) {
  if (data.length > 5000) {
    return analyseSampledNearDuplicates(data, headers, 1000);
  }

  const textColumns = headers.map((h, i) => ({ header: h, index: i }))
    .filter(col => {
      const sample = data.slice(0, 100).map(row => row[col.index])
        .filter(v => v && typeof v === 'string');
      return sample.length > 50;
    });

  if (textColumns.length === 0) return [];

  const nearDuplicateGroups = [];
  const processed = new Set();

  for (let i = 0; i < data.length - 1; i++) {
    if (processed.has(i)) continue;

    const group = {
      records: [i],
      similarity: 0,
      matchingFields: []
    };

    for (let j = i + 1; j < data.length; j++) {
      if (processed.has(j)) continue;

      const similarity = calculateRecordSimilarity(data[i], data[j], textColumns);
      
      if (similarity.score > 85) {
        group.records.push(j);
        group.similarity = Math.max(group.similarity, similarity.score);
        group.matchingFields = similarity.matchingFields;
        processed.add(j);
      }
    }

    if (group.records.length > 1) {
      processed.add(i);
      nearDuplicateGroups.push(group);
    }
  }

  return nearDuplicateGroups
    .sort((a, b) => b.records.length - a.records.length)
    .slice(0, 10);
}

function analyseSampledNearDuplicates(data, headers, sampleSize) {
  const sample = [];
  const step = Math.floor(data.length / sampleSize);
  
  for (let i = 0; i < data.length; i += step) {
    sample.push({ data: data[i], originalIndex: i });
  }

  const textColumns = headers.map((h, i) => ({ header: h, index: i }))
    .filter(col => {
      const testSample = sample.slice(0, 100).map(s => s.data[col.index])
        .filter(v => v && typeof v === 'string');
      return testSample.length > 50;
    });

  if (textColumns.length === 0) return [];

  const nearDuplicateGroups = [];

  for (let i = 0; i < sample.length - 1; i++) {
    const group = {
      records: [sample[i].originalIndex],
      similarity: 0,
      matchingFields: []
    };

    for (let j = i + 1; j < sample.length; j++) {
      const similarity = calculateRecordSimilarity(
        sample[i].data, 
        sample[j].data, 
        textColumns
      );
      
      if (similarity.score > 90) {
        group.records.push(sample[j].originalIndex);
        group.similarity = Math.max(group.similarity, similarity.score);
        group.matchingFields = similarity.matchingFields;
      }
    }

    if (group.records.length > 1) {
      nearDuplicateGroups.push(group);
    }
  }

  return nearDuplicateGroups
    .sort((a, b) => b.records.length - a.records.length)
    .slice(0, 5);
}

function calculateRecordSimilarity(record1, record2, textColumns) {
  let totalScore = 0;
  let matchingFields = [];
  let comparedFields = 0;

  textColumns.forEach(col => {
    const val1 = String(record1[col.index] || '').toLowerCase().trim();
    const val2 = String(record2[col.index] || '').toLowerCase().trim();

    if (val1 && val2) {
      const similarity = calculateStringSimilarity(val1, val2);
      if (similarity > 80) {
        matchingFields.push({
          field: col.header,
          similarity: similarity
        });
      }
      totalScore += similarity;
      comparedFields++;
    }
  });

  return {
    score: comparedFields > 0 ? Math.round(totalScore / comparedFields) : 0,
    matchingFields: matchingFields
  };
}

function calculateStringSimilarity(str1, str2) {
  if (str1 === str2) return 100;
  
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 100;
  
  const editDistance = levenshteinDistance(longer, shorter);
  const similarity = ((longer.length - editDistance) / longer.length) * 100;
  
  return Math.round(similarity);
}

function levenshteinDistance(str1, str2) {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

function calculateEntropy(valueCounts, total) {
  let entropy = 0;
  
  Object.values(valueCounts).forEach(count => {
    const probability = count / total;
    if (probability > 0) {
      entropy -= probability * Math.log2(probability);
    }
  });
  
  return entropy;
}

function generateDuplicateFixSQL(columnName, duplicateGroups) {
  const duplicates = Object.entries(duplicateGroups)
    .filter(([_, indices]) => indices.length > 1)
    .slice(0, 3);

  let sql = `-- Remove duplicates from ${columnName}\n`;
  sql += `WITH duplicates AS (\n`;
  sql += `  SELECT ${columnName}, \n`;
  sql += `    ROW_NUMBER() OVER (PARTITION BY ${columnName} ORDER BY created_date) AS rn\n`;
  sql += `  FROM your_table\n`;
  sql += `)\n`;
  sql += `DELETE FROM your_table\n`;
  sql += `WHERE ${columnName} IN (\n`;
  sql += `  SELECT ${columnName} FROM duplicates WHERE rn > 1\n`;
  sql += `);\n\n`;
  sql += `-- Add unique constraint\n`;
  sql += `ALTER TABLE your_table ADD CONSTRAINT uk_${columnName} UNIQUE (${columnName});`;

  return sql;
}

function calculateOverallUniqueness(uniquenessAnalysis) {
  const scores = Object.values(uniquenessAnalysis)
    .filter(analysis => analysis.totalValues > 0)
    .map(analysis => analysis.uniquenessRatio * 100);

  if (scores.length === 0) return 100;
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}

function countTotalDuplicates(uniquenessAnalysis) {
  return Object.values(uniquenessAnalysis)
    .reduce((sum, analysis) => sum + analysis.exactDuplicates.count, 0);
}