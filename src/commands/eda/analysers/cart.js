import { DecisionTreeRegression } from 'ml-cart';

export function performCARTAnalysis(records, columns, columnTypes, targetColumn = null) {
  // Early exit for very large datasets that would be too slow
  if (records.length > 50000) {
    return {
      applicable: false,
      reason: `Dataset too large for CART analysis (${records.length} records). Use sampling or run dedicated ML analysis.`
    };
  }
  
  // Prepare data for CART analysis - validate numeric columns actually contain numbers
  const numericColumns = columns.filter(col => {
    if (!['integer', 'float'].includes(columnTypes[col].type)) return false;
    
    // Additional validation: check if values are actually numeric
    const sampleValues = records.slice(0, 100).map(r => r[col]).filter(v => v !== null && v !== undefined);
    const numericCount = sampleValues.filter(v => typeof v === 'number' || !isNaN(parseFloat(v))).length;
    return numericCount / sampleValues.length > 0.8; // At least 80% should be numeric
  });
  const categoricalColumns = columns.filter(col => 
    columnTypes[col].type === 'categorical' && 
    columnTypes[col].categories.length <= 20 // Limit categories
  );
  
  if (numericColumns.length === 0 || (numericColumns.length + categoricalColumns.length) < 3) {
    return {
      applicable: false,
      reason: 'Insufficient columns for meaningful CART analysis'
    };
  }
  
  // Auto-select target if not provided
  if (!targetColumn) {
    targetColumn = selectBestTarget(records, numericColumns, columnTypes);
  }
  
  if (!targetColumn) {
    return {
      applicable: false,
      reason: 'No suitable target variable found'
    };
  }
  
  // Prepare features and target
  const { features, target, featureNames } = prepareData(
    records, 
    numericColumns, 
    categoricalColumns, 
    targetColumn,
    columnTypes
  );
  
  if (features.length < 50) {
    return {
      applicable: false,
      reason: 'Too few samples for reliable CART analysis'
    };
  }
  
  // Performance optimization: limit sample size for large datasets
  if (features.length > 5000) {
    const targetSampleSize = features.length > 15000 ? 3000 : 5000;
    console.log(`🚀 Performance optimization: Using ${targetSampleSize} samples from ${features.length} for CART analysis`);
    const sampleIndices = [];
    const step = Math.floor(features.length / targetSampleSize);
    for (let i = 0; i < features.length; i += step) {
      sampleIndices.push(i);
      if (sampleIndices.length >= targetSampleSize) break;
    }
    
    const sampledFeatures = sampleIndices.map(i => features[i]);
    const sampledTarget = sampleIndices.map(i => target[i]);
    
    // Build decision tree with sampled data - use faster config for large datasets
    const treeConfig = {
      maxDepth: 4,  // Reduced depth for speed
      minNumSamples: Math.max(10, Math.floor(sampledFeatures.length * 0.1))  // Higher min samples for speed
    };
    
    try {
      const regression = new DecisionTreeRegression(treeConfig);
      regression.train(sampledFeatures, sampledTarget);
      
      return performCARTAnalysisWithTree(
        regression, 
        sampledFeatures, 
        sampledTarget, 
        featureNames, 
        columnTypes, 
        records.length, 
        targetColumn
      );
    } catch (error) {
      return {
        applicable: false,
        reason: 'Performance optimization failed: ' + error.message
      };
    }
  }
  
  // Build decision tree
  const treeConfig = {
    maxDepth: 5,
    minNumSamples: Math.max(5, Math.floor(features.length * 0.05))
  };
  
  try {
    const regression = new DecisionTreeRegression(treeConfig);
    regression.train(features, target);
    
    // Continue with the rest of the analysis
    return performCARTAnalysisWithTree(regression, features, target, featureNames, columnTypes, records.length, targetColumn);
  } catch (error) {
    // Handle matrix/numeric errors gracefully
    if (error.message && error.message.includes('non-numeric')) {
      return {
        applicable: false,
        reason: 'Data contains mixed types that cannot be processed by CART analysis',
        suggestion: 'Ensure all feature columns contain only numeric values'
      };
    }
    throw error; // Re-throw other errors
  }
}

function performCARTAnalysisWithTree(regression, features, target, featureNames, columnTypes, recordCount, targetColumn) {
  // Extract rules
  const rules = extractRules(regression.root, featureNames, 0, columnTypes);
  const importances = calculateFeatureImportances(regression, features, target, featureNames);
  
  // Find interesting segments
  const segments = findBusinessSegments(rules, recordCount);
  
  return {
    applicable: true,
    targetVariable: targetColumn,
    featureNames,
    treeDepth: getTreeDepth(regression.root),
    rules,
    segments,
    featureImportances: importances,
    modelQuality: evaluateModelQuality(regression, features, target)
  };
}

function selectBestTarget(records, numericColumns, columnTypes) {
  let bestTarget = null;
  let bestScore = 0;
  
  // Priority patterns for common target variables
  const targetPatterns = {
    // Financial/outcome variables (highest priority)
    'charges|cost|price|premium|amount|fee|total|revenue|profit|loss|value': 5.0,
    // Performance metrics
    'score|rating|performance|quality|satisfaction|efficiency': 4.0,
    // Measurements that are typically outcomes
    'weight|height|speed|distance|duration|time|length|size': 3.0,
    // General numeric outcomes
    'count|number|quantity|volume|rate|percentage|ratio': 2.0
  };
  
  numericColumns.forEach(col => {
    const values = records.map(r => r[col]).filter(v => v !== null && v !== undefined);
    const uniqueRatio = new Set(values).size / values.length;
    const variance = calculateVariance(values);
    
    // Base score from variance and uniqueness
    let score = uniqueRatio * Math.log(1 + variance);
    
    // Apply semantic boost for likely target variables
    const colLower = col.toLowerCase();
    for (const [pattern, boost] of Object.entries(targetPatterns)) {
      const regex = new RegExp(pattern);
      if (regex.test(colLower)) {
        score *= boost;
        break; // Take the first match (highest priority)
      }
    }
    
    // Boost for high-variance continuous variables (likely targets)
    if (uniqueRatio > 0.8 && variance > 1000) {
      score *= 2.0;
    }
    
    // Penalize columns that look like IDs or codes
    if (colLower.includes('id') || colLower.includes('code') || colLower.includes('key')) {
      score *= 0.1;
    }
    
    if (score > bestScore) {
      bestScore = score;
      bestTarget = col;
    }
  });
  
  return bestTarget;
}

function prepareData(records, numericColumns, categoricalColumns, targetColumn, columnTypes) {
  const features = [];
  const target = [];
  const featureNames = [];
  
  // Prepare feature names
  numericColumns.forEach(col => {
    if (col !== targetColumn) {
      featureNames.push(col);
    }
  });
  
  // One-hot encode categorical variables
  const encodings = {};
  categoricalColumns.forEach(col => {
    if (col !== targetColumn) {
      const categories = columnTypes[col].categories;
      encodings[col] = {};
      categories.forEach((cat, idx) => {
        const featureName = `${col}_${cat}`;
        encodings[col][cat] = featureNames.length;
        featureNames.push(featureName);
      });
    }
  });
  
  // Build feature matrix
  records.forEach(record => {
    const targetValue = record[targetColumn];
    if (targetValue === null || targetValue === undefined) return;
    
    // Ensure target value is numeric
    const numericTarget = typeof targetValue === 'number' ? targetValue : parseFloat(targetValue);
    if (isNaN(numericTarget)) return;
    
    const row = [];
    
    // Numeric features
    numericColumns.forEach(col => {
      if (col !== targetColumn) {
        const value = record[col];
        // Ensure value is actually numeric
        if (value !== null && value !== undefined) {
          const numericValue = typeof value === 'number' ? value : parseFloat(value);
          row.push(isNaN(numericValue) ? 0 : numericValue);
        } else {
          row.push(0);
        }
      }
    });
    
    // Categorical features (one-hot)
    categoricalColumns.forEach(col => {
      if (col !== targetColumn) {
        const value = record[col];
        const categories = columnTypes[col].categories;
        categories.forEach(cat => {
          row.push(value === cat ? 1 : 0);
        });
      }
    });
    
    features.push(row);
    target.push(numericTarget);
  });
  
  return { features, target, featureNames };
}

function extractRules(node, featureNames, depth = 0, columnTypes, path = []) {
  const rules = [];
  
  if (!node || depth > 5) {
    return rules;
  }
  
  // Treat nodes at max depth as leaf nodes, or actual leaf nodes
  if (depth === 5 || node.left === null && node.right === null) {
    // Leaf node - create rule
    const support = node.numberSamples || node.samples || (node.values ? node.values.length : 0);
    
    if (path.length > 0 && support >= 5) { // Reduced from 10 to 5 for smaller segments
      
      // Get the prediction value from the ml-cart decision tree node
      let avgValue = 0;
      if (node.distribution !== undefined) {
        // This is where ml-cart stores the regression prediction value
        avgValue = node.distribution;
      } else if (node.response !== undefined) {
        avgValue = node.response;
      } else if (node.prediction !== undefined) {
        avgValue = node.prediction;
      } else if (node.value !== undefined) {
        avgValue = node.value;
      } else if (node.values && node.values.length > 0) {
        avgValue = node.values.reduce((a, b) => a + b, 0) / node.values.length;
      }
      
      rules.push({
        conditions: [...path],
        prediction: avgValue,
        support,
        confidence: node.values ? calculateConfidence(node.values) : 0.8,
        depth
      });
    }
  } else {
    // Internal node
    const feature = featureNames[node.splitColumn];
    const threshold = node.splitValue;
    
    // Skip nodes with undefined features (corrupted nodes)
    if (!feature || threshold === undefined) {
      return rules;
    }
    
    if (node.left) {
      const leftPath = [...path, `${feature} <= ${threshold.toFixed(2)}`];
      rules.push(...extractRules(node.left, featureNames, depth + 1, columnTypes, leftPath));
    }
    
    if (node.right) {
      const rightPath = [...path, `${feature} > ${threshold.toFixed(2)}`];
      rules.push(...extractRules(node.right, featureNames, depth + 1, columnTypes, rightPath));
    }
  }
  
  return rules;
}

function calculateConfidence(values) {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  const cv = Math.sqrt(variance) / (Math.abs(mean) + 1);
  return Math.max(0, 1 - cv);
}

function calculateFeatureImportances(model, features, target, featureNames) {
  // Simple importance based on split frequency and depth
  const importances = {};
  featureNames.forEach(name => { importances[name] = 0; });
  
  function traverseTree(node, depth = 1) {
    if (!node || !node.splitColumn !== undefined) return;
    
    const feature = featureNames[node.splitColumn];
    if (feature) {
      // Weight by inverse depth (earlier splits are more important)
      importances[feature] += 1 / depth;
    }
    
    if (node.left) traverseTree(node.left, depth + 1);
    if (node.right) traverseTree(node.right, depth + 1);
  }
  
  traverseTree(model.root);
  
  // Normalize
  const total = Object.values(importances).reduce((a, b) => a + b, 0);
  if (total > 0) {
    Object.keys(importances).forEach(key => {
      importances[key] = (importances[key] / total) * 100;
    });
  }
  
  return Object.entries(importances)
    .filter(([_, importance]) => importance > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([feature, importance]) => ({
      feature,
      importance: importance.toFixed(1)
    }));
}

function findBusinessSegments(rules, totalRecords) {
  // Convert rules to business-friendly segments
  const segments = [];
  
  // Sort rules by support and prediction value
  const sortedRules = rules.sort((a, b) => b.support - a.support);
  
  sortedRules.slice(0, 10).forEach((rule, idx) => {
    const segment = {
      id: idx + 1,
      description: formatSegmentDescription(rule),
      conditions: rule.conditions,
      size: rule.support,
      sizePercentage: (rule.support / totalRecords * 100).toFixed(1),
      avgValue: rule.prediction.toFixed(2),
      confidence: (rule.confidence * 100).toFixed(0)
    };
    
    // Classify segment
    if (rule.prediction > getPercentile(rules.map(r => r.prediction), 0.75)) {
      segment.type = 'high-value';
      segment.actionability = 'Focus on retention and upselling';
    } else if (rule.prediction < getPercentile(rules.map(r => r.prediction), 0.25)) {
      segment.type = 'low-value';
      segment.actionability = 'Investigate improvement opportunities';
    } else {
      segment.type = 'medium-value';
      segment.actionability = 'Monitor and optimize';
    }
    
    segments.push(segment);
  });
  
  return segments;
}

function formatSegmentDescription(rule) {
  const conditions = rule.conditions.map(cond => {
    // Make conditions more readable
    return cond
      .replace(/_/g, ' ')
      .replace(/([<>]=?)/g, ' $1 ')
      .replace(/\s+/g, ' ')
      .trim();
  });
  
  if (conditions.length === 1) {
    return `When ${conditions[0]}`;
  } else if (conditions.length === 2) {
    return `When ${conditions[0]} AND ${conditions[1]}`;
  } else {
    return `When ${conditions.slice(0, -1).join(', ')} AND ${conditions[conditions.length - 1]}`;
  }
}

function getTreeDepth(node, currentDepth = 0) {
  if (!node || (node.left === null && node.right === null)) {
    return currentDepth;
  }
  
  const leftDepth = node.left ? getTreeDepth(node.left, currentDepth + 1) : currentDepth;
  const rightDepth = node.right ? getTreeDepth(node.right, currentDepth + 1) : currentDepth;
  
  return Math.max(leftDepth, rightDepth);
}

function evaluateModelQuality(model, features, target) {
  // Simple R-squared calculation
  const predictions = features.map(f => model.predict([f])[0]);
  const targetMean = target.reduce((a, b) => a + b, 0) / target.length;
  
  const ssTotal = target.reduce((sum, val) => sum + Math.pow(val - targetMean, 2), 0);
  const ssResidual = target.reduce((sum, val, idx) => 
    sum + Math.pow(val - predictions[idx], 2), 0
  );
  
  const rSquared = 1 - (ssResidual / ssTotal);
  
  return {
    rSquared: rSquared.toFixed(3),
    interpretation: 
      rSquared > 0.7 ? 'Strong predictive power' :
      rSquared > 0.5 ? 'Moderate predictive power' :
      rSquared > 0.3 ? 'Weak predictive power' :
      'Poor predictive power'
  };
}

function calculateVariance(values) {
  const numbers = values.filter(v => typeof v === 'number');
  if (numbers.length < 2) return 0;
  
  const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
  return numbers.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / numbers.length;
}

function getPercentile(values, percentile) {
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil(percentile * sorted.length) - 1;
  return sorted[index];
}