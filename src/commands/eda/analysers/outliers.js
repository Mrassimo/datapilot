import * as ss from 'simple-statistics';
import jstat from 'jstat';

export function detectOutliers(values, columnName) {
  const numbers = values.filter(v => typeof v === 'number' && !isNaN(v));
  
  if (numbers.length < 4) {
    return {
      column: columnName,
      totalRecords: values.length,
      numericRecords: numbers.length,
      methods: {},
      contextual: { patterns: [], recommendations: [] },
      aggregated: [],
      summary: 'Insufficient data for outlier detection (n < 4)'
    };
  }
  
  const sorted = [...numbers].sort((a, b) => a - b);
  
  // Run multiple outlier detection methods
  const methods = {
    iqr: detectIQROutliers(sorted),
    modifiedZScore: detectModifiedZScoreOutliers(sorted),
    gesd: numbers.length >= 25 ? detectGESDOutliers(sorted) : null,
    isolation: detectIsolationOutliers(numbers),
    grubbs: numbers.length >= 7 ? grubbsTest(sorted) : null
  };
  
  // Contextual analysis
  const contextual = analyzeOutlierContext(values, methods);
  
  // Aggregate outliers
  const allOutliers = aggregateOutliers(methods);
  
  return {
    column: columnName,
    totalRecords: values.length,
    numericRecords: numbers.length,
    methods,
    contextual,
    aggregated: allOutliers,
    summary: summarizeOutliers(methods, contextual, allOutliers)
  };
}

function detectIQROutliers(sortedValues) {
  const q1 = ss.quantile(sortedValues, 0.25);
  const q3 = ss.quantile(sortedValues, 0.75);
  const iqr = q3 - q1;
  
  const innerFenceLower = q1 - 1.5 * iqr;
  const innerFenceUpper = q3 + 1.5 * iqr;
  const outerFenceLower = q1 - 3 * iqr;
  const outerFenceUpper = q3 + 3 * iqr;
  
  const outliers = {
    mild: [],
    extreme: []
  };
  
  sortedValues.forEach(value => {
    if (value < outerFenceLower || value > outerFenceUpper) {
      outliers.extreme.push(value);
    } else if (value < innerFenceLower || value > innerFenceUpper) {
      outliers.mild.push(value);
    }
  });
  
  return {
    method: 'Tukey\'s Fences (IQR)',
    q1,
    q3,
    iqr,
    bounds: {
      innerLower: innerFenceLower,
      innerUpper: innerFenceUpper,
      outerLower: outerFenceLower,
      outerUpper: outerFenceUpper
    },
    outliers,
    totalOutliers: outliers.mild.length + outliers.extreme.length,
    outlierRate: (outliers.mild.length + outliers.extreme.length) / sortedValues.length * 100
  };
}

function detectModifiedZScoreOutliers(sortedValues) {
  const median = ss.median(sortedValues);
  const mad = ss.medianAbsoluteDeviation(sortedValues);
  
  if (mad === 0) {
    return {
      method: 'Modified Z-Score (Iglewicz-Hoaglin)',
      applicable: false,
      reason: 'MAD is zero - all values may be identical'
    };
  }
  
  const threshold = 3.5;
  const outliers = [];
  const scores = [];
  
  sortedValues.forEach(value => {
    const modifiedZScore = 0.6745 * Math.abs(value - median) / mad;
    scores.push({ value, score: modifiedZScore });
    
    if (modifiedZScore > threshold) {
      outliers.push({
        value,
        score: modifiedZScore,
        severity: modifiedZScore > 5 ? 'extreme' : 'moderate'
      });
    }
  });
  
  return {
    method: 'Modified Z-Score (Iglewicz-Hoaglin)',
    median,
    mad,
    threshold,
    outliers,
    totalOutliers: outliers.length,
    outlierRate: outliers.length / sortedValues.length * 100,
    maxScore: Math.max(...scores.map(s => s.score))
  };
}

function detectGESDOutliers(sortedValues) {
  // Generalized Extreme Studentized Deviate test
  const alpha = 0.05;
  const maxOutliers = Math.floor(sortedValues.length * 0.1); // Test up to 10% as outliers
  
  const outliers = [];
  const testResults = [];
  let workingValues = [...sortedValues];
  
  for (let i = 0; i < maxOutliers; i++) {
    if (workingValues.length < 3) break;
    
    const mean = ss.mean(workingValues);
    const stdDev = ss.standardDeviation(workingValues);
    
    if (stdDev === 0) break;
    
    // Find the value with maximum deviation
    let maxDeviation = 0;
    let maxIndex = -1;
    let maxValue = null;
    
    workingValues.forEach((value, index) => {
      const deviation = Math.abs(value - mean) / stdDev;
      if (deviation > maxDeviation) {
        maxDeviation = deviation;
        maxIndex = index;
        maxValue = value;
      }
    });
    
    // Calculate critical value
    const n = workingValues.length;
    const tCrit = jstat.studentt.inv(1 - alpha / (2 * n), n - 2);
    const lambda = (n - 1) * tCrit / Math.sqrt(n * (n - 2 + tCrit * tCrit));
    
    testResults.push({
      iteration: i + 1,
      value: maxValue,
      statistic: maxDeviation,
      criticalValue: lambda,
      isOutlier: maxDeviation > lambda
    });
    
    if (maxDeviation > lambda) {
      outliers.push(maxValue);
      workingValues.splice(maxIndex, 1);
    } else {
      break; // No more outliers
    }
  }
  
  return {
    method: 'Generalized ESD Test',
    alpha,
    outliers,
    testResults,
    totalOutliers: outliers.length,
    outlierRate: outliers.length / sortedValues.length * 100
  };
}

function detectIsolationOutliers(values) {
  // Simplified Isolation Forest concept
  // In practice, this would use the full ml-isolation-forest library
  const n = values.length;
  const sampleSize = Math.min(256, n);
  const numTrees = 100;
  
  // Calculate isolation scores
  const scores = values.map(value => {
    let totalPathLength = 0;
    
    for (let tree = 0; tree < numTrees; tree++) {
      // Simulate isolation tree path length
      let pathLength = 0;
      let currentMin = Math.min(...values);
      let currentMax = Math.max(...values);
      let currentValue = value;
      
      while (pathLength < Math.log2(sampleSize)) {
        const splitPoint = Math.random() * (currentMax - currentMin) + currentMin;
        pathLength++;
        
        if (currentValue < splitPoint) {
          currentMax = splitPoint;
        } else {
          currentMin = splitPoint;
        }
        
        if (currentMax - currentMin < 0.001) break;
      }
      
      totalPathLength += pathLength;
    }
    
    const avgPathLength = totalPathLength / numTrees;
    const c = 2 * Math.log(sampleSize - 1) - 2 * (sampleSize - 1) / sampleSize;
    const anomalyScore = Math.pow(2, -avgPathLength / c);
    
    return { value, score: anomalyScore };
  });
  
  // Threshold for outliers (typically 0.5-0.6)
  const threshold = 0.6;
  const outliers = scores.filter(s => s.score > threshold);
  
  return {
    method: 'Isolation Forest (Simplified)',
    threshold,
    outliers: outliers.map(o => ({ value: o.value, anomalyScore: o.score })),
    totalOutliers: outliers.length,
    outlierRate: outliers.length / values.length * 100,
    averageScore: ss.mean(scores.map(s => s.score))
  };
}

function grubbsTest(sortedValues) {
  const n = sortedValues.length;
  const mean = ss.mean(sortedValues);
  const stdDev = ss.standardDeviation(sortedValues);
  
  if (stdDev === 0) {
    return {
      method: 'Grubbs Test',
      applicable: false,
      reason: 'Standard deviation is zero'
    };
  }
  
  // Test for single outlier
  const deviations = sortedValues.map(v => Math.abs(v - mean));
  const maxDeviation = Math.max(...deviations);
  const maxIndex = deviations.indexOf(maxDeviation);
  const suspectValue = sortedValues[maxIndex];
  
  const G = maxDeviation / stdDev;
  
  // Critical value at 0.05 significance
  const alpha = 0.05;
  const tCrit = jstat.studentt.inv(1 - alpha / (2 * n), n - 2);
  const GCrit = ((n - 1) / Math.sqrt(n)) * Math.sqrt(tCrit * tCrit / (n - 2 + tCrit * tCrit));
  
  return {
    method: 'Grubbs Test',
    suspectValue,
    statistic: G,
    criticalValue: GCrit,
    isOutlier: G > GCrit,
    interpretation: G > GCrit ? 
      `Value ${suspectValue} is a significant outlier` : 
      'No significant outliers detected'
  };
}

function analyzeOutlierContext(allValues, methods) {
  const analysis = {
    patterns: [],
    recommendations: []
  };
  
  // Check if outliers are clustered
  const allOutlierValues = [];
  Object.values(methods).forEach(method => {
    if (method && method.outliers) {
      if (Array.isArray(method.outliers)) {
        allOutlierValues.push(...method.outliers.map(o => 
          typeof o === 'object' ? o.value : o
        ));
      } else if (method.outliers.mild) {
        allOutlierValues.push(...method.outliers.mild, ...method.outliers.extreme);
      }
    }
  });
  
  const uniqueOutliers = [...new Set(allOutlierValues)];
  
  // Check for systematic patterns
  if (uniqueOutliers.length > 0) {
    const outlierIndices = uniqueOutliers.map(v => allValues.indexOf(v));
    
    // Check if outliers appear in sequences
    const sequences = findSequences(outlierIndices.sort((a, b) => a - b));
    if (sequences.length > 0) {
      analysis.patterns.push('Outliers appear in sequences - may indicate temporal anomalies');
    }
    
    // Check if all outliers are in one direction
    const numbers = allValues.filter(v => typeof v === 'number' && !isNaN(v));
    const median = ss.median(numbers);
    const upperOutliers = uniqueOutliers.filter(v => v > median).length;
    const lowerOutliers = uniqueOutliers.filter(v => v < median).length;
    
    if (upperOutliers > 0 && lowerOutliers === 0) {
      analysis.patterns.push('All outliers are high values');
      analysis.recommendations.push('Consider if these represent legitimate peak events');
    } else if (lowerOutliers > 0 && upperOutliers === 0) {
      analysis.patterns.push('All outliers are low values');
      analysis.recommendations.push('Check for data quality issues or minimum thresholds');
    }
    
    // Check percentage of outliers
    const outlierPercentage = (uniqueOutliers.length / numbers.length) * 100;
    if (outlierPercentage > 10) {
      analysis.patterns.push(`High outlier rate (${outlierPercentage.toFixed(1)}%)`);
      analysis.recommendations.push('Review if these are true anomalies or natural variation');
    }
  }
  
  return analysis;
}

function findSequences(indices) {
  const sequences = [];
  let currentSequence = [indices[0]];
  
  for (let i = 1; i < indices.length; i++) {
    if (indices[i] - indices[i-1] === 1) {
      currentSequence.push(indices[i]);
    } else {
      if (currentSequence.length >= 3) {
        sequences.push(currentSequence);
      }
      currentSequence = [indices[i]];
    }
  }
  
  if (currentSequence.length >= 3) {
    sequences.push(currentSequence);
  }
  
  return sequences;
}

function aggregateOutliers(methods) {
  const outlierCounts = {};
  
  // Count how many methods flag each value
  Object.entries(methods).forEach(([methodName, result]) => {
    if (!result || !result.outliers) return;
    
    let outlierValues = [];
    if (Array.isArray(result.outliers)) {
      outlierValues = result.outliers.map(o => 
        typeof o === 'object' ? o.value : o
      );
    } else if (result.outliers.mild) {
      outlierValues = [...result.outliers.mild, ...result.outliers.extreme];
    }
    
    outlierValues.forEach(value => {
      if (!outlierCounts[value]) {
        outlierCounts[value] = { value, methods: [], confidence: 'low' };
      }
      outlierCounts[value].methods.push(methodName);
    });
  });
  
  // Classify confidence based on agreement
  const outliers = Object.values(outlierCounts);
  outliers.forEach(outlier => {
    const methodCount = outlier.methods.length;
    if (methodCount >= 4) {
      outlier.confidence = 'very high';
    } else if (methodCount >= 3) {
      outlier.confidence = 'high';
    } else if (methodCount >= 2) {
      outlier.confidence = 'medium';
    } else {
      outlier.confidence = 'low';
    }
  });
  
  return outliers.sort((a, b) => b.methods.length - a.methods.length);
}

function summarizeOutliers(methods, contextual, aggregated) {
  const summary = [];
  
  const totalMethods = Object.values(methods).filter(m => m && m.totalOutliers !== undefined).length;
  const methodsWithOutliers = Object.values(methods).filter(m => m && m.totalOutliers > 0).length;
  
  if (methodsWithOutliers === 0) {
    summary.push('No outliers detected by any method');
  } else {
    const highConfidence = aggregated.filter(o => o.confidence === 'high' || o.confidence === 'very high');
    const topOutliers = aggregated.slice(0, 5).map(o => o.value);
    
    summary.push(`${aggregated.length} potential outliers detected`);
    summary.push(`${highConfidence.length} high-confidence outliers`);
    summary.push(`Top extreme values: [${topOutliers.join(', ')}]`);
    
    if (contextual.patterns.length > 0) {
      summary.push(`Patterns: ${contextual.patterns[0]}`);
    }
    
    if (contextual.recommendations.length > 0) {
      summary.push(`Recommendation: ${contextual.recommendations[0]}`);
    }
  }
  
  return summary.join('\n');
}