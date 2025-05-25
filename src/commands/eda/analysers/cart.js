import mlCart from 'ml-cart';
const { DecisionTreeRegression } = mlCart;

export function performCARTAnalysis(records, columns, columnTypes, targetColumn = null) {
  // Prepare data for CART analysis
  const numericColumns = columns.filter(col => 
    ['integer', 'float'].includes(columnTypes[col].type)
  );
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
  
  // Build decision tree
  const treeConfig = {
    maxDepth: 5,
    minNumSamples: Math.max(5, Math.floor(features.length * 0.05))
  };
  
  const regression = new DecisionTreeRegression(treeConfig);
  regression.train(features, target);
  
  // Extract rules
  const rules = extractRules(regression.root, featureNames, 0, columnTypes);
  const importances = calculateFeatureImportances(regression, features, target, featureNames);
  
  // Find interesting segments
  const segments = findBusinessSegments(rules, records.length);
  
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
  
  numericColumns.forEach(col => {
    const values = records.map(r => r[col]).filter(v => v !== null && v !== undefined);
    const uniqueRatio = new Set(values).size / values.length;
    const variance = calculateVariance(values);
    
    // Score based on variance and uniqueness
    const score = uniqueRatio * Math.log(1 + variance);
    
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
    
    const row = [];
    
    // Numeric features
    numericColumns.forEach(col => {
      if (col !== targetColumn) {
        const value = record[col];
        row.push(value !== null && value !== undefined ? value : 0);
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
    target.push(targetValue);
  });
  
  return { features, target, featureNames };
}

function extractRules(node, featureNames, depth = 0, columnTypes, path = []) {
  const rules = [];
  
  if (!node || depth > 5) return rules;
  
  if (node.left === null && node.right === null) {
    // Leaf node - create rule
    if (path.length > 0 && node.values && node.values.length > 10) {
      const avgValue = node.values.reduce((a, b) => a + b, 0) / node.values.length;
      const support = node.values.length;
      
      rules.push({
        conditions: [...path],
        prediction: avgValue,
        support,
        confidence: calculateConfidence(node.values),
        depth
      });
    }
  } else {
    // Internal node
    const feature = featureNames[node.splitColumn];
    const threshold = node.splitValue;
    
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