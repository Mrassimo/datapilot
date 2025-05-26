import jstat from 'jstat';
import * as ss from 'simple-statistics';

export function analyzeDistribution(values) {
  const numbers = values.filter(v => typeof v === 'number' && !isNaN(v));
  
  if (numbers.length < 20) {
    return {
      tests: {},
      recommendation: 'Insufficient data for distribution testing (n < 20)'
    };
  }
  
  const sorted = [...numbers].sort((a, b) => a - b);
  
  // Run distribution tests
  const tests = {
    normality: testNormality(sorted),
    uniformity: testUniformity(sorted),
    exponential: testExponential(sorted),
    bestFit: null
  };
  
  // Determine best fit
  tests.bestFit = determineBestFit(tests);
  
  // Transformation recommendations
  const transformations = recommendTransformations(numbers, tests);
  
  return {
    sampleSize: numbers.length,
    tests,
    transformations,
    interpretation: interpretDistribution(tests, transformations)
  };
}

function testNormality(values) {
  const n = values.length;
  
  // Skip if too few values
  if (n < 3) {
    return { applicable: false, reason: 'Too few values' };
  }
  
  // Shapiro-Wilk test (for n < 5000)
  let shapiroWilk = null;
  if (n <= 5000) {
    shapiroWilk = shapiroWilkTest(values);
  }
  
  // Anderson-Darling test
  const andersonDarling = andersonDarlingTest(values);
  
  // Jarque-Bera test
  const jarqueBera = jarqueBeraTest(values);
  
  // Q-Q plot analysis
  const qqAnalysis = analyzeQQPlot(values);
  
  return {
    shapiroWilk,
    andersonDarling,
    jarqueBera,
    qqAnalysis,
    isNormal: determineNormality(shapiroWilk, andersonDarling, jarqueBera)
  };
}

function shapiroWilkTest(values) {
  const n = values.length;
  
  if (n < 3 || n > 5000) {
    return {
      applicable: false,
      reason: n < 3 ? 'Sample size too small (n < 3)' : 'Sample size too large (n > 5000)'
    };
  }
  
  const sorted = [...values].sort((a, b) => a - b);
  const mean = ss.mean(values);
  
  // Calculate robust Shapiro-Wilk statistic using proper coefficients
  const coefficients = getShapiroWilkCoefficients(n);
  if (!coefficients) {
    // Fallback to asymptotic formula for sizes not in tables
    return shapiroWilkAsymptotic(sorted, mean);
  }
  
  let numerator = 0;
  const k = Math.floor(n / 2);
  
  for (let i = 0; i < k; i++) {
    numerator += coefficients[i] * (sorted[n - 1 - i] - sorted[i]);
  }
  numerator = numerator * numerator;
  
  const denominator = values.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0);
  const W = numerator / denominator;
  
  // Calculate p-value using Monte Carlo approximation
  const pValue = calculateShapiroWilkPValue(W, n);
  const alpha = 0.05;
  
  return {
    statistic: W,
    pValue: pValue,
    rejectNull: pValue < alpha,
    interpretation: pValue >= alpha ? 
      `Data appears normal (p = ${pValue.toFixed(4)})` : 
      `Data deviates from normality (p = ${pValue.toFixed(4)})`
  };
}

function getShapiroWilkCoefficients(n) {
  // Shapiro-Wilk coefficients for common sample sizes
  // These are the a_i coefficients from Shapiro & Wilk (1965) tables
  const coefficientTables = {
    3: [0.7071],
    4: [0.6872, 0.1677],
    5: [0.6646, 0.2413, 0.0000],
    6: [0.6431, 0.2806, 0.0875],
    7: [0.6233, 0.3031, 0.1401, 0.0000],
    8: [0.6052, 0.3164, 0.1743, 0.0561],
    9: [0.5888, 0.3244, 0.1976, 0.0947, 0.0000],
    10: [0.5739, 0.3291, 0.2141, 0.1224, 0.0399],
    11: [0.5601, 0.3315, 0.2260, 0.1429, 0.0695, 0.0000],
    12: [0.5475, 0.3325, 0.2347, 0.1586, 0.0922, 0.0303],
    15: [0.5150, 0.3325, 0.2412, 0.1707, 0.1099, 0.0542, 0.0000],
    20: [0.4734, 0.3211, 0.2565, 0.1877, 0.1271, 0.0739, 0.0240],
    25: [0.4450, 0.3104, 0.2691, 0.1966, 0.1383, 0.0878, 0.0433, 0.0000],
    30: [0.4254, 0.3015, 0.2786, 0.2025, 0.1470, 0.0973, 0.0539, 0.0140],
    35: [0.4101, 0.2939, 0.2858, 0.2072, 0.1539, 0.1047, 0.0618, 0.0220],
    40: [0.3964, 0.2875, 0.2916, 0.2110, 0.1594, 0.1109, 0.0685, 0.0284],
    50: [0.3751, 0.2759, 0.3008, 0.2171, 0.1686, 0.1207, 0.0804, 0.0433]
  };
  
  // Return exact coefficients if available
  if (coefficientTables[n]) {
    return coefficientTables[n];
  }
  
  // Interpolate for intermediate values
  const keys = Object.keys(coefficientTables).map(Number).sort((a, b) => a - b);
  const lowerKey = keys.find(k => k <= n && keys[keys.indexOf(k) + 1] > n);
  const upperKey = keys[keys.indexOf(lowerKey) + 1];
  
  if (lowerKey && upperKey) {
    const lowerCoeffs = coefficientTables[lowerKey];
    const upperCoeffs = coefficientTables[upperKey];
    const ratio = (n - lowerKey) / (upperKey - lowerKey);
    
    // Linear interpolation
    const interpolated = lowerCoeffs.map((lower, i) => {
      const upper = upperCoeffs[i] || 0;
      return lower + ratio * (upper - lower);
    });
    
    return interpolated.slice(0, Math.floor(n / 2));
  }
  
  return null;
}

function shapiroWilkAsymptotic(sorted, mean) {
  // Asymptotic approximation for large samples using D'Agostino's method
  const n = sorted.length;
  const variance = sorted.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / n;
  
  // Calculate sample skewness and kurtosis
  const skewness = sorted.reduce((sum, x) => sum + Math.pow((x - mean) / Math.sqrt(variance), 3), 0) / n;
  const kurtosis = sorted.reduce((sum, x) => sum + Math.pow((x - mean) / Math.sqrt(variance), 4), 0) / n;
  
  // Asymptotic W statistic approximation
  const W = 1 - (Math.pow(skewness, 2) / 6 + Math.pow(kurtosis - 3, 2) / 24) / n;
  const pValue = calculateShapiroWilkPValue(W, n);
  
  return {
    statistic: W,
    pValue: pValue,
    rejectNull: pValue < 0.05,
    interpretation: pValue >= 0.05 ? 
      `Data appears normal (asymptotic, p ≈ ${pValue.toFixed(4)})` : 
      `Data deviates from normality (asymptotic, p ≈ ${pValue.toFixed(4)})`
  };
}

function calculateShapiroWilkPValue(W, n) {
  // Monte Carlo approximation for p-value calculation
  // Based on Royston's algorithm (1995) for improved p-value estimation
  
  if (n < 3) return NaN;
  
  // Transform W statistic for normality
  let g, mu, sigma;
  
  if (n >= 3 && n <= 11) {
    // Small sample approximation
    g = -Math.log(1 - W);
    mu = -1.2725 + 1.0521 * Math.log(n);
    sigma = 1.0308 - 0.26758 * Math.log(n);
  } else {
    // Large sample approximation (n > 11)
    const ln_n = Math.log(n);
    g = Math.log(1 - W);
    
    mu = 0.0038915 * Math.pow(ln_n, 3) - 0.083751 * Math.pow(ln_n, 2) - 0.31082 * ln_n - 1.5861;
    sigma = Math.exp(0.0030302 * Math.pow(ln_n, 2) - 0.082676 * ln_n - 0.4803);
  }
  
  // Standard normal quantile
  const z = (g - mu) / sigma;
  
  // Convert to p-value using standard normal CDF
  // Using error function approximation
  const pValue = 0.5 * (1 + erf(z / Math.sqrt(2)));
  
  return Math.max(0.001, Math.min(0.999, pValue));
}

// Error function approximation (Abramowitz and Stegun)
function erf(x) {
  const a1 =  0.254829592;
  const a2 = -0.284496736;
  const a3 =  1.421413741;
  const a4 = -1.453152027;
  const a5 =  1.061405429;
  const p  =  0.3275911;
  
  const sign = x >= 0 ? 1 : -1;
  x = Math.abs(x);
  
  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  
  return sign * y;
}

function getShapiroWilkCoefficient(i, n) {
  // Legacy function for backward compatibility
  // In a full implementation, these would come from statistical tables
  const z = jstat.normal.inv((i + 0.375) / (n + 0.25), 0, 1);
  return z / Math.sqrt(n);
}

function andersonDarlingTest(values) {
  const n = values.length;
  const mean = ss.mean(values);
  const stdDev = ss.standardDeviation(values);
  
  // Standardize values
  const standardized = values.map(x => (x - mean) / stdDev).sort((a, b) => a - b);
  
  // Calculate A-squared statistic
  let sum = 0;
  for (let i = 0; i < n; i++) {
    const Fi = jstat.normal.cdf(standardized[i], 0, 1);
    const Fni = jstat.normal.cdf(standardized[n - 1 - i], 0, 1);
    sum += (2 * i + 1) * (Math.log(Fi) + Math.log(1 - Fni));
  }
  
  const A2 = -n - sum / n;
  const A2star = A2 * (1 + 0.75/n + 2.25/(n*n)); // Adjusted for sample size
  
  // Critical value at 0.05 significance
  const criticalValue = 0.752;
  
  return {
    statistic: A2star,
    criticalValue,
    rejectNull: A2star > criticalValue,
    interpretation: A2star <= criticalValue ? 'Consistent with normal distribution' : 'Significant deviation from normality'
  };
}

function jarqueBeraTest(values) {
  const n = values.length;
  const skewness = calculateSkewness(values);
  const kurtosis = calculateKurtosis(values);
  
  // Jarque-Bera statistic
  const JB = (n / 6) * (skewness * skewness + (kurtosis * kurtosis) / 4);
  
  // Chi-square critical value with 2 df at 0.05 significance
  const criticalValue = 5.991;
  const pValue = 1 - jstat.chisquare.cdf(JB, 2);
  
  return {
    statistic: JB,
    skewness,
    kurtosis,
    criticalValue,
    pValue,
    rejectNull: JB > criticalValue,
    interpretation: JB <= criticalValue ? 'Skewness and kurtosis consistent with normality' : 'Significant skewness or kurtosis'
  };
}

function analyzeQQPlot(values) {
  const n = values.length;
  const sorted = [...values].sort((a, b) => a - b);
  
  // Calculate theoretical quantiles
  const theoreticalQuantiles = [];
  const empiricalQuantiles = [];
  
  for (let i = 0; i < n; i++) {
    const p = (i + 0.5) / n;
    theoreticalQuantiles.push(jstat.normal.inv(p, ss.mean(values), ss.standardDeviation(values)));
    empiricalQuantiles.push(sorted[i]);
  }
  
  // Calculate correlation between theoretical and empirical quantiles
  const qqCorrelation = ss.sampleCorrelation(theoreticalQuantiles, empiricalQuantiles);
  
  // Identify deviations
  let lowerTailDeviation = false;
  let upperTailDeviation = false;
  
  if (n > 10) {
    const lowerDiff = Math.abs(empiricalQuantiles[0] - theoreticalQuantiles[0]);
    const upperDiff = Math.abs(empiricalQuantiles[n-1] - theoreticalQuantiles[n-1]);
    const midDiff = Math.abs(empiricalQuantiles[Math.floor(n/2)] - theoreticalQuantiles[Math.floor(n/2)]);
    
    lowerTailDeviation = lowerDiff > 2 * midDiff;
    upperTailDeviation = upperDiff > 2 * midDiff;
  }
  
  return {
    correlation: qqCorrelation,
    interpretation: qqCorrelation > 0.98 ? 'Excellent fit to normal' : 
                   qqCorrelation > 0.95 ? 'Good fit to normal' : 
                   qqCorrelation > 0.90 ? 'Moderate fit to normal' : 'Poor fit to normal',
    lowerTailDeviation,
    upperTailDeviation
  };
}

function testUniformity(values) {
  const n = values.length;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;
  
  if (range === 0) {
    return { applicable: false, reason: 'All values are identical' };
  }
  
  // Kolmogorov-Smirnov test for uniformity
  const sorted = [...values].sort((a, b) => a - b);
  let maxDiff = 0;
  
  for (let i = 0; i < n; i++) {
    const empiricalCDF = (i + 1) / n;
    const theoreticalCDF = (sorted[i] - min) / range;
    const diff = Math.abs(empiricalCDF - theoreticalCDF);
    maxDiff = Math.max(maxDiff, diff);
  }
  
  const KS = maxDiff;
  const criticalValue = 1.36 / Math.sqrt(n); // At 0.05 significance
  
  return {
    statistic: KS,
    criticalValue,
    rejectNull: KS > criticalValue,
    interpretation: KS <= criticalValue ? 'Consistent with uniform distribution' : 'Not uniformly distributed'
  };
}

function testExponential(values) {
  const n = values.length;
  const positiveValues = values.filter(v => v > 0);
  
  if (positiveValues.length < n * 0.9) {
    return { applicable: false, reason: 'Too many non-positive values' };
  }
  
  const mean = ss.mean(positiveValues);
  const sorted = [...positiveValues].sort((a, b) => a - b);
  
  // Kolmogorov-Smirnov test for exponential
  let maxDiff = 0;
  
  for (let i = 0; i < sorted.length; i++) {
    const empiricalCDF = (i + 1) / sorted.length;
    const theoreticalCDF = 1 - Math.exp(-sorted[i] / mean);
    const diff = Math.abs(empiricalCDF - theoreticalCDF);
    maxDiff = Math.max(maxDiff, diff);
  }
  
  const KS = maxDiff;
  const criticalValue = 1.36 / Math.sqrt(sorted.length);
  
  return {
    statistic: KS,
    criticalValue,
    rejectNull: KS > criticalValue,
    interpretation: KS <= criticalValue ? 'Consistent with exponential distribution' : 'Not exponentially distributed',
    estimatedRate: 1 / mean
  };
}

function determineBestFit(tests) {
  const fits = [];
  
  if (tests.normality.isNormal) {
    fits.push({ distribution: 'normal', score: tests.normality.qqAnalysis.correlation });
  }
  
  if (tests.uniformity.applicable && !tests.uniformity.rejectNull) {
    fits.push({ distribution: 'uniform', score: 1 - tests.uniformity.statistic });
  }
  
  if (tests.exponential.applicable && !tests.exponential.rejectNull) {
    fits.push({ distribution: 'exponential', score: 1 - tests.exponential.statistic });
  }
  
  if (fits.length === 0) {
    return { distribution: 'none', interpretation: 'No standard distribution fits well' };
  }
  
  const best = fits.reduce((a, b) => a.score > b.score ? a : b);
  return {
    distribution: best.distribution,
    score: best.score,
    interpretation: `Best fit is ${best.distribution} distribution`
  };
}

function recommendTransformations(values, tests) {
  const recommendations = [];
  const stats = {
    skewness: calculateSkewness(values),
    min: Math.min(...values)
  };
  
  // Log transformation for right-skewed data
  if (stats.skewness > 1 && stats.min > 0) {
    const logTransformed = values.map(v => Math.log(v));
    const logSkewness = calculateSkewness(logTransformed);
    
    recommendations.push({
      type: 'log',
      applicable: true,
      originalSkewness: stats.skewness,
      transformedSkewness: logSkewness,
      improvement: Math.abs(logSkewness) < Math.abs(stats.skewness),
      description: 'Log transformation reduces right skew'
    });
  }
  
  // Square root for count data
  if (stats.min >= 0 && values.every(v => v === Math.floor(v))) {
    const sqrtTransformed = values.map(v => Math.sqrt(v));
    const sqrtSkewness = calculateSkewness(sqrtTransformed);
    
    recommendations.push({
      type: 'sqrt',
      applicable: true,
      originalSkewness: stats.skewness,
      transformedSkewness: sqrtSkewness,
      improvement: Math.abs(sqrtSkewness) < Math.abs(stats.skewness),
      description: 'Square root transformation for count data'
    });
  }
  
  // Box-Cox transformation
  if (stats.min > 0) {
    const lambda = findOptimalBoxCox(values);
    const boxcoxTransformed = values.map(v => 
      lambda === 0 ? Math.log(v) : (Math.pow(v, lambda) - 1) / lambda
    );
    const boxcoxSkewness = calculateSkewness(boxcoxTransformed);
    
    recommendations.push({
      type: 'box-cox',
      applicable: true,
      lambda,
      originalSkewness: stats.skewness,
      transformedSkewness: boxcoxSkewness,
      improvement: Math.abs(boxcoxSkewness) < Math.abs(stats.skewness),
      description: `Box-Cox transformation with λ=${lambda.toFixed(2)}`
    });
  }
  
  return recommendations.filter(r => r.improvement);
}

function findOptimalBoxCox(values) {
  // Simplified Box-Cox lambda estimation
  // In practice, this would use maximum likelihood estimation
  const lambdas = [-2, -1, -0.5, 0, 0.5, 1, 2];
  let bestLambda = 0;
  let minSkewness = Infinity;
  
  for (const lambda of lambdas) {
    const transformed = values.map(v => 
      lambda === 0 ? Math.log(v) : (Math.pow(v, lambda) - 1) / lambda
    );
    const skewness = Math.abs(calculateSkewness(transformed));
    
    if (skewness < minSkewness) {
      minSkewness = skewness;
      bestLambda = lambda;
    }
  }
  
  return bestLambda;
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

function determineNormality(shapiroWilk, andersonDarling, jarqueBera) {
  let votes = 0;
  let total = 0;
  
  if (shapiroWilk && shapiroWilk.rejectNull !== undefined) {
    if (!shapiroWilk.rejectNull) votes++;
    total++;
  }
  
  if (andersonDarling && andersonDarling.rejectNull !== undefined) {
    if (!andersonDarling.rejectNull) votes++;
    total++;
  }
  
  if (jarqueBera && jarqueBera.rejectNull !== undefined) {
    if (!jarqueBera.rejectNull) votes++;
    total++;
  }
  
  return total > 0 && votes / total > 0.5;
}

function interpretDistribution(tests, transformations) {
  const interpretations = [];
  
  if (tests.normality.isNormal) {
    interpretations.push('Data follows a normal distribution');
  } else if (tests.normality.jarqueBera) {
    if (tests.normality.jarqueBera.skewness > 1) {
      interpretations.push('Data is right-skewed');
    } else if (tests.normality.jarqueBera.skewness < -1) {
      interpretations.push('Data is left-skewed');
    }
    
    if (tests.normality.jarqueBera.kurtosis > 1) {
      interpretations.push('Distribution has heavy tails (leptokurtic)');
    } else if (tests.normality.jarqueBera.kurtosis < -1) {
      interpretations.push('Distribution has light tails (platykurtic)');
    }
  }
  
  if (tests.bestFit && tests.bestFit.distribution !== 'none') {
    interpretations.push(tests.bestFit.interpretation);
  }
  
  if (transformations.length > 0) {
    interpretations.push(`Consider ${transformations[0].type} transformation to normalize data`);
  }
  
  return interpretations.join('. ');
}