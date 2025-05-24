import * as ss from 'simple-statistics';

export function calculateStats(values) {
  const numbers = values.filter(v => typeof v === 'number' && !isNaN(v));
  
  if (numbers.length === 0) {
    return { count: 0, nullCount: values.length };
  }
  
  const sorted = [...numbers].sort((a, b) => a - b);
  
  return {
    count: numbers.length,
    nullCount: values.length - numbers.length,
    mean: ss.mean(numbers),
    median: ss.median(sorted),
    mode: ss.mode(numbers),
    min: ss.min(numbers),
    max: ss.max(numbers),
    sum: ss.sum(numbers),
    standardDeviation: numbers.length > 1 ? ss.standardDeviation(numbers) : 0,
    variance: numbers.length > 1 ? ss.variance(numbers) : 0,
    q1: ss.quantile(sorted, 0.25),
    q3: ss.quantile(sorted, 0.75),
    iqr: ss.interquartileRange(sorted),
    skewness: numbers.length > 2 ? calculateSkewness(numbers) : 0,
    kurtosis: numbers.length > 3 ? calculateKurtosis(numbers) : 0,
    outliers: findOutliers(sorted)
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

function findOutliers(sortedValues) {
  if (sortedValues.length < 4) return [];
  
  const q1 = ss.quantile(sortedValues, 0.25);
  const q3 = ss.quantile(sortedValues, 0.75);
  const iqr = q3 - q1;
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;
  
  return sortedValues.filter(v => v < lowerBound || v > upperBound);
}

export function calculateCorrelation(values1, values2) {
  const pairs = [];
  
  for (let i = 0; i < Math.min(values1.length, values2.length); i++) {
    if (typeof values1[i] === 'number' && typeof values2[i] === 'number' &&
        !isNaN(values1[i]) && !isNaN(values2[i])) {
      pairs.push([values1[i], values2[i]]);
    }
  }
  
  if (pairs.length < 2) return null;
  
  const x = pairs.map(p => p[0]);
  const y = pairs.map(p => p[1]);
  
  return ss.sampleCorrelation(x, y);
}

export function analyzeDistribution(values) {
  const numbers = values.filter(v => typeof v === 'number' && !isNaN(v));
  
  if (numbers.length === 0) {
    return { type: 'empty' };
  }
  
  const stats = calculateStats(values);
  const skewness = stats.skewness;
  const kurtosis = stats.kurtosis;
  
  let distribution = {
    type: 'unknown',
    skewness: skewness,
    kurtosis: kurtosis,
    description: ''
  };
  
  // Determine distribution type based on skewness and kurtosis
  if (Math.abs(skewness) < 0.5 && Math.abs(kurtosis) < 0.5) {
    distribution.type = 'normal';
    distribution.description = 'Approximately normal distribution';
  } else if (skewness > 1) {
    distribution.type = 'right-skewed';
    distribution.description = 'Right-skewed (positive skew) distribution';
  } else if (skewness < -1) {
    distribution.type = 'left-skewed';
    distribution.description = 'Left-skewed (negative skew) distribution';
  } else if (kurtosis > 1) {
    distribution.type = 'leptokurtic';
    distribution.description = 'Heavy-tailed distribution (leptokurtic)';
  } else if (kurtosis < -1) {
    distribution.type = 'platykurtic';
    distribution.description = 'Light-tailed distribution (platykurtic)';
  } else {
    distribution.type = 'moderately-skewed';
    distribution.description = 'Moderately skewed distribution';
  }
  
  // Check for specific patterns
  const uniqueValues = [...new Set(numbers)];
  if (uniqueValues.length < 10) {
    distribution.type = 'discrete';
    distribution.description = 'Discrete distribution with limited values';
  }
  
  // Check for log-normal pattern (common in financial data)
  if (skewness > 2 && stats.min > 0) {
    const logValues = numbers.map(v => Math.log(v));
    const logSkewness = calculateSkewness(logValues);
    if (Math.abs(logSkewness) < 1) {
      distribution.type = 'log-normal';
      distribution.description = 'Log-normal distribution (typical of financial/purchase data)';
    }
  }
  
  return distribution;
}

export function findPatterns(records, column) {
  const values = records.map(r => r[column]);
  const patterns = {
    missing: [],
    duplicates: {},
    sequences: [],
    anomalies: []
  };
  
  // Find missing values
  values.forEach((val, idx) => {
    if (val === null || val === undefined || val === '') {
      patterns.missing.push(idx);
    }
  });
  
  // Find duplicates
  const valueCounts = {};
  values.forEach((val, idx) => {
    if (val !== null && val !== undefined) {
      const key = String(val);
      if (!valueCounts[key]) {
        valueCounts[key] = [];
      }
      valueCounts[key].push(idx);
    }
  });
  
  Object.entries(valueCounts).forEach(([val, indices]) => {
    if (indices.length > 1) {
      patterns.duplicates[val] = indices;
    }
  });
  
  // Find sequences (for numeric data)
  if (values.some(v => typeof v === 'number')) {
    const numbers = values
      .map((v, i) => ({ value: v, index: i }))
      .filter(item => typeof item.value === 'number')
      .sort((a, b) => a.index - b.index);
    
    for (let i = 1; i < numbers.length; i++) {
      const diff = numbers[i].value - numbers[i-1].value;
      if (Math.abs(diff - 1) < 0.0001) {
        // Found a sequence
        let seqStart = i - 1;
        let seqEnd = i;
        while (seqEnd < numbers.length - 1 && 
               Math.abs(numbers[seqEnd + 1].value - numbers[seqEnd].value - 1) < 0.0001) {
          seqEnd++;
        }
        if (seqEnd - seqStart >= 2) {
          patterns.sequences.push({
            start: numbers[seqStart].index,
            end: numbers[seqEnd].index,
            length: seqEnd - seqStart + 1
          });
        }
        i = seqEnd;
      }
    }
  }
  
  return patterns;
}