import * as ss from 'simple-statistics';

export function calculateEnhancedStats(values) {
  const numbers = values.filter(v => typeof v === 'number' && !isNaN(v));
  
  if (numbers.length === 0) {
    return { 
      count: 0, 
      nullCount: values.length,
      hasData: false 
    };
  }
  
  const sorted = [...numbers].sort((a, b) => a - b);
  
  // Calculate all percentiles
  const percentiles = [5, 10, 25, 50, 75, 90, 95].reduce((acc, p) => {
    acc[`p${p}`] = ss.quantile(sorted, p / 100);
    return acc;
  }, {});
  
  // Basic stats
  const basicStats = {
    count: numbers.length,
    nullCount: values.length - numbers.length,
    nullPercentage: ((values.length - numbers.length) / values.length) * 100,
    hasData: true,
    
    // Central tendency
    mean: ss.mean(numbers),
    median: ss.median(sorted),
    mode: ss.mode(numbers),
    
    // Spread
    min: ss.min(numbers),
    max: ss.max(numbers),
    range: ss.max(numbers) - ss.min(numbers),
    sum: ss.sum(numbers),
    standardDeviation: numbers.length > 1 ? ss.standardDeviation(numbers) : 0,
    variance: numbers.length > 1 ? ss.variance(numbers) : 0,
    coefficientOfVariation: 0,
    
    // Quartiles and IQR
    q1: percentiles.p25,
    q3: percentiles.p75,
    iqr: percentiles.p75 - percentiles.p25,
    
    // Percentiles
    ...percentiles,
    
    // Shape
    skewness: numbers.length > 2 ? calculateSkewness(numbers) : 0,
    kurtosis: numbers.length > 3 ? calculateKurtosis(numbers) : 0,
    
    // Additional metrics
    uniqueCount: new Set(numbers).size,
    uniqueRatio: new Set(numbers).size / numbers.length,
    zeroCount: numbers.filter(v => v === 0).length,
    positiveCount: numbers.filter(v => v > 0).length,
    negativeCount: numbers.filter(v => v < 0).length
  };
  
  // Coefficient of variation (only for positive mean)
  if (basicStats.mean > 0) {
    basicStats.coefficientOfVariation = (basicStats.standardDeviation / basicStats.mean) * 100;
  }
  
  // Outliers using multiple methods
  basicStats.outliers = detectOutliers(sorted, basicStats);
  
  // Distribution characteristics
  basicStats.distribution = analyzeDistributionShape(basicStats);
  
  return basicStats;
}

export function calculateCategoricalStats(values) {
  const nonNull = values.filter(v => v !== null && v !== undefined);
  
  if (nonNull.length === 0) {
    return {
      count: 0,
      nullCount: values.length,
      hasData: false
    };
  }
  
  // Value counts
  const valueCounts = {};
  nonNull.forEach(v => {
    const key = String(v);
    valueCounts[key] = (valueCounts[key] || 0) + 1;
  });
  
  const sortedValues = Object.entries(valueCounts)
    .sort((a, b) => b[1] - a[1]);
  
  const uniqueCount = sortedValues.length;
  
  // Calculate entropy (diversity measure)
  const entropy = sortedValues.reduce((sum, [_, count]) => {
    const p = count / nonNull.length;
    return sum - (p > 0 ? p * Math.log2(p) : 0);
  }, 0);
  
  // Find rare categories
  const rareThreshold = nonNull.length * 0.01;
  const rareCategories = sortedValues.filter(([_, count]) => count < rareThreshold);
  
  return {
    count: nonNull.length,
    nullCount: values.length - nonNull.length,
    nullPercentage: ((values.length - nonNull.length) / values.length) * 100,
    hasData: true,
    
    uniqueCount,
    uniqueRatio: uniqueCount / nonNull.length,
    
    // Top values
    topValues: sortedValues.slice(0, 10).map(([value, count]) => ({
      value,
      count,
      percentage: (count / nonNull.length) * 100
    })),
    
    // Mode
    mode: sortedValues[0][0],
    modeCount: sortedValues[0][1],
    modePercentage: (sortedValues[0][1] / nonNull.length) * 100,
    
    // Diversity metrics
    entropy,
    normalizedEntropy: uniqueCount > 1 ? entropy / Math.log2(uniqueCount) : 0,
    
    // Rare categories
    rareCount: rareCategories.length,
    rarePercentage: (rareCategories.reduce((sum, [_, count]) => sum + count, 0) / nonNull.length) * 100,
    
    // Category length stats (for string values)
    lengthStats: calculateStringLengthStats(nonNull)
  };
}

function calculateSkewness(values) {
  const mean = ss.mean(values);
  const stdDev = ss.standardDeviation(values);
  const n = values.length;
  
  if (stdDev === 0) return 0;
  
  const sum = values.reduce((acc, val) => acc + Math.pow((val - mean) / stdDev, 3), 0);
  return (n / ((n - 1) * (n - 2))) * sum;
}

function calculateKurtosis(values) {
  const mean = ss.mean(values);
  const stdDev = ss.standardDeviation(values);
  const n = values.length;
  
  if (stdDev === 0) return 0;
  
  const sum = values.reduce((acc, val) => acc + Math.pow((val - mean) / stdDev, 4), 0);
  return ((n * (n + 1)) / ((n - 1) * (n - 2) * (n - 3))) * sum - 
         (3 * (n - 1) * (n - 1)) / ((n - 2) * (n - 3));
}

function detectOutliers(sortedValues, stats) {
  const outliers = {
    iqr: [],
    zscore: [],
    modifiedZscore: [],
    extreme: []
  };
  
  if (sortedValues.length < 4) return outliers;
  
  // IQR method
  const lowerBound = stats.q1 - 1.5 * stats.iqr;
  const upperBound = stats.q3 + 1.5 * stats.iqr;
  const extremeLower = stats.q1 - 3 * stats.iqr;
  const extremeUpper = stats.q3 + 3 * stats.iqr;
  
  sortedValues.forEach(v => {
    if (v < lowerBound || v > upperBound) {
      outliers.iqr.push(v);
      if (v < extremeLower || v > extremeUpper) {
        outliers.extreme.push(v);
      }
    }
  });
  
  // Z-score method
  if (stats.standardDeviation > 0) {
    sortedValues.forEach(v => {
      const zscore = Math.abs((v - stats.mean) / stats.standardDeviation);
      if (zscore > 3) {
        outliers.zscore.push(v);
      }
    });
  }
  
  // Modified Z-score (Iglewicz-Hoaglin method)
  const mad = ss.medianAbsoluteDeviation(sortedValues);
  if (mad > 0) {
    sortedValues.forEach(v => {
      const modifiedZscore = 0.6745 * Math.abs(v - stats.median) / mad;
      if (modifiedZscore > 3.5) {
        outliers.modifiedZscore.push(v);
      }
    });
  }
  
  return outliers;
}

function analyzeDistributionShape(stats) {
  const shape = {
    type: 'unknown',
    description: '',
    characteristics: []
  };
  
  // Skewness interpretation
  if (Math.abs(stats.skewness) < 0.5) {
    shape.characteristics.push('symmetric');
  } else if (stats.skewness > 2) {
    shape.characteristics.push('highly right-skewed');
    shape.type = 'right-skewed';
  } else if (stats.skewness > 1) {
    shape.characteristics.push('moderately right-skewed');
    shape.type = 'right-skewed';
  } else if (stats.skewness < -2) {
    shape.characteristics.push('highly left-skewed');
    shape.type = 'left-skewed';
  } else if (stats.skewness < -1) {
    shape.characteristics.push('moderately left-skewed');
    shape.type = 'left-skewed';
  }
  
  // Kurtosis interpretation
  if (Math.abs(stats.kurtosis) < 0.5) {
    shape.characteristics.push('mesokurtic (normal-like tails)');
  } else if (stats.kurtosis > 1) {
    shape.characteristics.push('leptokurtic (heavy tails)');
  } else if (stats.kurtosis < -1) {
    shape.characteristics.push('platykurtic (light tails)');
  }
  
  // Overall shape determination
  if (Math.abs(stats.skewness) < 0.5 && Math.abs(stats.kurtosis) < 0.5) {
    shape.type = 'normal';
    shape.description = 'Approximately normal distribution';
  } else if (stats.skewness > 2 && stats.min > 0) {
    shape.type = 'log-normal';
    shape.description = 'Possible log-normal distribution';
  } else if (stats.uniqueCount < 10) {
    shape.type = 'discrete';
    shape.description = 'Discrete distribution with limited values';
  } else {
    shape.description = `Distribution is ${shape.characteristics.join(', ')}`;
  }
  
  return shape;
}

function calculateStringLengthStats(values) {
  const lengths = values.map(v => String(v).length);
  
  if (lengths.length === 0) return null;
  
  return {
    minLength: Math.min(...lengths),
    maxLength: Math.max(...lengths),
    avgLength: ss.mean(lengths),
    stdLength: lengths.length > 1 ? ss.standardDeviation(lengths) : 0,
    fixedLength: new Set(lengths).size === 1
  };
}