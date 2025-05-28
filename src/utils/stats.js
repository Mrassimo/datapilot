import * as ss from 'simple-statistics';
import { InputValidator, SafeArrayOps, withErrorBoundary } from './errorHandler.js';

// Add timeout wrapper for expensive calculations
function withTimeout(promise, timeoutMs = 5000, operation = 'calculation') {
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(`${operation} timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });
  
  return Promise.race([promise, timeoutPromise]);
}

// Enhanced calculateStats with timeout protection
export const calculateStats = withErrorBoundary(async function calculateStatsInternal(values, options = {}) {
  const timeoutMs = options.timeout || 5000;
  
  const statsPromise = new Promise((resolve) => {
    // Validate input array
    const validatedValues = InputValidator.validateArray(values, 'values', { allowEmpty: false });
    
    const cleanValues = SafeArrayOps.safeFilter(validatedValues, v => {
      return typeof v === 'number' && !isNaN(v) && isFinite(v);
    });
    
    if (cleanValues.length === 0) {
      resolve({
        count: 0,
        min: null,
        max: null,
        mean: null,
        median: null,
        mode: null,
        std: null,
        variance: null,
        error: 'No valid numeric values found'
      });
      return;
    }

    // Limit processing for very large arrays to prevent hanging
    const processLimit = Math.min(cleanValues.length, 50000);
    const processValues = cleanValues.slice(0, processLimit);
    
    if (cleanValues.length > processLimit) {
      console.warn(`⚠️  Large dataset detected, processing first ${processLimit.toLocaleString()} values for statistics`);
    }
    
    try {
      const sorted = [...processValues].sort((a, b) => a - b);
      const count = processValues.length;
      const sum = processValues.reduce((a, b) => a + b, 0);
      const mean = sum / count;
      
      // Calculate median
      const median = count % 2 === 0 
        ? (sorted[Math.floor(count / 2) - 1] + sorted[Math.floor(count / 2)]) / 2
        : sorted[Math.floor(count / 2)];
      
      // Calculate mode (limit to reasonable sample size)
      const sampleForMode = processValues.slice(0, Math.min(10000, processValues.length));
      const frequency = {};
      sampleForMode.forEach(v => frequency[v] = (frequency[v] || 0) + 1);
      const mode = Object.keys(frequency).reduce((a, b) => frequency[a] > frequency[b] ? a : b);
      
      // Calculate variance and standard deviation
      const variance = processValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / count;
      const std = Math.sqrt(variance);
      
      resolve({
        count: cleanValues.length, // Use original count
        min: sorted[0],
        max: sorted[sorted.length - 1],
        mean: Number(mean.toFixed(6)),
        median: Number(median.toFixed(6)),
        mode: Number(mode),
        std: Number(std.toFixed(6)),
        variance: Number(variance.toFixed(6)),
        processed: processValues.length,
        samplingUsed: cleanValues.length > processLimit
      });
    } catch (error) {
      resolve({
        count: cleanValues.length,
        error: `Calculation failed: ${error.message}`
      });
    }
  });
  
  return withTimeout(statsPromise, timeoutMs, 'Statistical calculation');
}, null, { function: 'calculateStats' });

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

export async function analyzeDistribution(values) {
  const numbers = values.filter(v => typeof v === 'number' && !isNaN(v));
  
  if (numbers.length === 0) {
    return { type: 'empty' };
  }
  
  const stats = await calculateStats(values);
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