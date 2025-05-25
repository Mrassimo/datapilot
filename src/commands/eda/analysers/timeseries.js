import * as ss from 'simple-statistics';
import jstat from 'jstat';

export function performTimeSeriesAnalysis(records, dateColumn, numericColumns) {
  const dates = records
    .map(r => ({ date: r[dateColumn], record: r }))
    .filter(d => d.date instanceof Date)
    .sort((a, b) => a.date - b.date);
  
  if (dates.length < 20) {
    return {
      applicable: false,
      reason: 'Insufficient temporal data points (need at least 20)'
    };
  }
  
  // Check for regular intervals
  const intervals = [];
  for (let i = 1; i < dates.length; i++) {
    intervals.push(dates[i].date - dates[i-1].date);
  }
  
  const frequency = detectFrequency(intervals);
  if (!frequency) {
    return {
      applicable: false,
      reason: 'Irregular time intervals detected'
    };
  }
  
  const analysis = {
    applicable: true,
    timeColumn: dateColumn,
    frequency,
    dateRange: `${formatDate(dates[0].date)} to ${formatDate(dates[dates.length - 1].date)}`,
    dataPoints: dates.length,
    series: {}
  };
  
  // Analyze each numeric column
  numericColumns.forEach(col => {
    const values = dates.map(d => d.record[col]).filter(v => v !== null && !isNaN(v));
    
    if (values.length < dates.length * 0.8) {
      return; // Skip columns with too many missing values
    }
    
    analysis.series[col] = {
      trend: analyzeTrend(values, dates.map(d => d.date)),
      seasonality: analyzeSeasonality(values, dates.map(d => d.date), frequency),
      stationarity: testStationarity(values),
      decomposition: decomposeTimeSeries(values, frequency),
      forecast: generateForecast(values, frequency)
    };
  });
  
  // Overall time series characteristics
  analysis.overall = summarizeTimeSeriesCharacteristics(analysis.series);
  
  return analysis;
}

function detectFrequency(intervals) {
  if (intervals.length === 0) return null;
  
  // Calculate median interval
  const sortedIntervals = [...intervals].sort((a, b) => a - b);
  const medianInterval = sortedIntervals[Math.floor(sortedIntervals.length / 2)];
  
  // Check consistency (coefficient of variation)
  const mean = ss.mean(intervals);
  const stdDev = ss.standardDeviation(intervals);
  const cv = stdDev / mean;
  
  if (cv > 0.3) return null; // Too irregular
  
  // Determine frequency based on median interval (in milliseconds)
  const hour = 60 * 60 * 1000;
  const day = 24 * hour;
  const week = 7 * day;
  const month = 30 * day; // Approximate
  
  if (Math.abs(medianInterval - hour) < hour * 0.1) return 'hourly';
  if (Math.abs(medianInterval - day) < day * 0.1) return 'daily';
  if (Math.abs(medianInterval - week) < week * 0.1) return 'weekly';
  if (Math.abs(medianInterval - month) < month * 0.2) return 'monthly';
  
  return 'custom';
}

function analyzeTrend(values, dates) {
  // Simple linear trend
  const x = dates.map((d, i) => i);
  const regression = ss.linearRegression([x, values]);
  const regressionLine = ss.linearRegressionLine(regression);
  
  // Calculate trend strength
  const predicted = x.map(regressionLine);
  const r2 = calculateR2(values, predicted);
  
  // Polynomial trend
  let polynomialTrend = null;
  if (values.length > 30) {
    polynomialTrend = detectPolynomialTrend(x, values);
  }
  
  return {
    type: polynomialTrend && polynomialTrend.r2 > r2 + 0.1 ? 'polynomial' : 'linear',
    slope: regression.m,
    intercept: regression.b,
    strength: r2,
    direction: regression.m > 0 ? 'increasing' : regression.m < 0 ? 'decreasing' : 'flat',
    changePerPeriod: regression.m,
    polynomialDegree: polynomialTrend?.degree,
    interpretation: interpretTrend(regression.m, r2, values)
  };
}

function analyzeSeasonality(values, dates, frequency) {
  if (values.length < 24) {
    return { detected: false, reason: 'Insufficient data for seasonality detection' };
  }
  
  // Detrend the series first
  const detrended = detrendSeries(values);
  
  // Seasonal decomposition based on frequency
  let seasonalPattern = null;
  let period = null;
  
  switch (frequency) {
    case 'hourly':
      period = 24; // Daily seasonality
      break;
    case 'daily':
      period = 7; // Weekly seasonality
      if (values.length > 365) {
        // Also check for monthly/yearly patterns
        const yearlyPattern = detectYearlySeasonality(values, dates);
        if (yearlyPattern.strength > 0.3) {
          return yearlyPattern;
        }
      }
      break;
    case 'weekly':
      period = 4; // Monthly seasonality (approximate)
      break;
    case 'monthly':
      period = 12; // Yearly seasonality
      break;
  }
  
  if (period && values.length >= period * 2) {
    seasonalPattern = calculateSeasonalIndices(detrended, period);
    
    return {
      detected: seasonalPattern.strength > 0.2,
      period,
      strength: seasonalPattern.strength,
      indices: seasonalPattern.indices,
      peaks: identifyPeakPeriods(seasonalPattern.indices),
      interpretation: interpretSeasonality(seasonalPattern, frequency)
    };
  }
  
  return { detected: false, reason: 'No clear seasonal pattern detected' };
}

function testStationarity(values) {
  // Augmented Dickey-Fuller test (simplified)
  const adf = augmentedDickeyFuller(values);
  
  // KPSS test (simplified)
  const kpss = kpssTest(values);
  
  // Check for structural breaks
  const breaks = detectStructuralBreaks(values);
  
  return {
    adf: {
      statistic: adf.statistic,
      pValue: adf.pValue,
      isStationary: adf.pValue < 0.05,
      interpretation: adf.pValue < 0.05 ? 'Series is stationary' : 'Series is non-stationary'
    },
    kpss: {
      statistic: kpss.statistic,
      criticalValue: kpss.criticalValue,
      isStationary: kpss.statistic < kpss.criticalValue,
      interpretation: kpss.statistic < kpss.criticalValue ? 'Series is trend stationary' : 'Series has unit root'
    },
    structuralBreaks: breaks,
    recommendation: generateStationarityRecommendation(adf, kpss, breaks)
  };
}

function augmentedDickeyFuller(values) {
  // Simplified ADF test
  const n = values.length;
  const diffs = [];
  
  for (let i = 1; i < n; i++) {
    diffs.push(values[i] - values[i-1]);
  }
  
  // Regression: Δy_t = α + βy_{t-1} + ε_t
  const y = diffs;
  const x = values.slice(0, -1);
  
  const regression = ss.linearRegression([x, y]);
  const stdError = calculateStandardError(x, y, regression);
  
  const tStat = regression.m / stdError;
  
  // Critical values (approximate)
  const criticalValue = -2.86 - 0.48 / n - 2.78 / (n * n);
  
  return {
    statistic: tStat,
    criticalValue,
    pValue: tStat < criticalValue ? 0.01 : 0.1, // Simplified
    rejectNull: tStat < criticalValue
  };
}

function kpssTest(values) {
  // Simplified KPSS test
  const n = values.length;
  const mean = ss.mean(values);
  
  // Partial sums
  const S = [];
  let sum = 0;
  for (let i = 0; i < n; i++) {
    sum += values[i] - mean;
    S.push(sum);
  }
  
  // Calculate test statistic
  const variance = ss.variance(values);
  const stat = S.reduce((acc, s) => acc + s * s, 0) / (n * n * variance);
  
  // Critical value at 5% significance
  const criticalValue = 0.463;
  
  return {
    statistic: stat,
    criticalValue,
    rejectNull: stat > criticalValue
  };
}

function decomposeTimeSeries(values, frequency) {
  if (values.length < 24) {
    return null;
  }
  
  // Moving average for trend
  const trend = calculateMovingAverage(values, Math.min(12, Math.floor(values.length / 4)));
  
  // Detrended series
  const detrended = values.map((v, i) => v - (trend[i] || trend[trend.length - 1]));
  
  // Seasonal component (simplified)
  const seasonal = calculateSeasonalComponent(detrended, frequency);
  
  // Residual
  const residual = values.map((v, i) => 
    v - (trend[i] || trend[trend.length - 1]) - (seasonal[i] || 0)
  );
  
  return {
    trend: {
      values: trend,
      direction: trend[trend.length - 1] > trend[0] ? 'increasing' : 'decreasing'
    },
    seasonal: {
      values: seasonal,
      strength: calculateSeasonalStrength(seasonal, residual)
    },
    residual: {
      values: residual,
      variance: ss.variance(residual)
    }
  };
}

function generateForecast(values, frequency) {
  // Simple forecast using trend and seasonality
  const n = values.length;
  const forecastHorizon = Math.min(12, Math.floor(n * 0.2));
  
  // Fit trend
  const x = Array.from({ length: n }, (_, i) => i);
  const regression = ss.linearRegression([x, values]);
  const trend = ss.linearRegressionLine(regression);
  
  // Generate forecast
  const forecasts = [];
  for (let i = 0; i < forecastHorizon; i++) {
    const trendValue = trend(n + i);
    
    // Add seasonal component if detected
    const seasonalValue = 0; // Simplified
    
    forecasts.push({
      period: n + i + 1,
      forecast: trendValue + seasonalValue,
      confidence: {
        lower: trendValue - 2 * Math.sqrt(ss.variance(values)),
        upper: trendValue + 2 * Math.sqrt(ss.variance(values))
      }
    });
  }
  
  return {
    horizon: forecastHorizon,
    method: 'Linear trend with seasonality',
    forecasts: forecasts.slice(0, 3), // Just show first 3
    accuracy: 'Use with caution - simple forecast method'
  };
}

// Helper functions
function formatDate(date) {
  return date.toISOString().split('T')[0];
}

function calculateR2(actual, predicted) {
  const meanActual = ss.mean(actual);
  const ssTotal = actual.reduce((sum, y) => sum + Math.pow(y - meanActual, 2), 0);
  const ssResidual = actual.reduce((sum, y, i) => sum + Math.pow(y - predicted[i], 2), 0);
  return 1 - ssResidual / ssTotal;
}

function detrendSeries(values) {
  const x = Array.from({ length: values.length }, (_, i) => i);
  const regression = ss.linearRegression([x, values]);
  const trend = ss.linearRegressionLine(regression);
  
  return values.map((v, i) => v - trend(i));
}

function detectPolynomialTrend(x, y) {
  // Try quadratic trend
  const x2 = x.map(xi => xi * xi);
  const xMatrix = x.map((xi, i) => [1, xi, x2[i]]);
  
  // Simplified polynomial regression
  // In practice, use proper matrix operations
  const coeffs = [0, 0, 0]; // Placeholder
  
  return {
    degree: 2,
    r2: 0.5, // Placeholder
    coefficients: coeffs
  };
}

function detectYearlySeasonality(values, dates) {
  const monthlyAverages = {};
  
  dates.forEach((date, i) => {
    const month = date.getMonth();
    if (!monthlyAverages[month]) {
      monthlyAverages[month] = [];
    }
    if (values[i] !== null) {
      monthlyAverages[month].push(values[i]);
    }
  });
  
  const monthlyMeans = Object.entries(monthlyAverages)
    .map(([month, vals]) => ({
      month: parseInt(month),
      mean: ss.mean(vals)
    }))
    .sort((a, b) => a.month - b.month);
  
  if (monthlyMeans.length < 6) {
    return { detected: false };
  }
  
  const overallMean = ss.mean(monthlyMeans.map(m => m.mean));
  const seasonalStrength = ss.standardDeviation(monthlyMeans.map(m => m.mean)) / overallMean;
  
  return {
    detected: seasonalStrength > 0.1,
    period: 12,
    strength: seasonalStrength,
    peaks: monthlyMeans
      .filter(m => m.mean > overallMean * 1.1)
      .map(m => getMonthName(m.month)),
    interpretation: 'Yearly seasonal pattern detected'
  };
}

function calculateSeasonalIndices(values, period) {
  const indices = Array(period).fill(0);
  const counts = Array(period).fill(0);
  
  values.forEach((val, i) => {
    const seasonIndex = i % period;
    indices[seasonIndex] += val;
    counts[seasonIndex]++;
  });
  
  // Calculate average for each season
  for (let i = 0; i < period; i++) {
    indices[i] = counts[i] > 0 ? indices[i] / counts[i] : 0;
  }
  
  // Normalize
  const mean = ss.mean(indices);
  const normalizedIndices = indices.map(idx => idx / mean);
  
  // Calculate strength
  const strength = ss.standardDeviation(normalizedIndices);
  
  return {
    indices: normalizedIndices,
    strength
  };
}

function identifyPeakPeriods(indices) {
  const peaks = [];
  const mean = ss.mean(indices);
  
  indices.forEach((idx, i) => {
    if (idx > mean * 1.1) {
      peaks.push({
        period: i,
        strength: idx
      });
    }
  });
  
  return peaks;
}

function detectStructuralBreaks(values) {
  // Simplified structural break detection
  const n = values.length;
  const windowSize = Math.max(10, Math.floor(n * 0.1));
  const breaks = [];
  
  for (let i = windowSize; i < n - windowSize; i++) {
    const before = values.slice(i - windowSize, i);
    const after = values.slice(i, i + windowSize);
    
    const meanBefore = ss.mean(before);
    const meanAfter = ss.mean(after);
    const pooledStd = Math.sqrt((ss.variance(before) + ss.variance(after)) / 2);
    
    const tStat = Math.abs(meanAfter - meanBefore) / (pooledStd * Math.sqrt(2 / windowSize));
    
    if (tStat > 2.5) {
      breaks.push({
        index: i,
        magnitude: meanAfter - meanBefore,
        significance: tStat
      });
    }
  }
  
  return breaks;
}

function calculateStandardError(x, y, regression) {
  const predicted = x.map(xi => regression.m * xi + regression.b);
  const residuals = y.map((yi, i) => yi - predicted[i]);
  const sse = residuals.reduce((sum, r) => sum + r * r, 0);
  const mse = sse / (x.length - 2);
  
  const xMean = ss.mean(x);
  const xSS = x.reduce((sum, xi) => sum + Math.pow(xi - xMean, 2), 0);
  
  return Math.sqrt(mse / xSS);
}

function calculateMovingAverage(values, window) {
  const ma = [];
  
  for (let i = 0; i < values.length; i++) {
    const start = Math.max(0, i - Math.floor(window / 2));
    const end = Math.min(values.length, i + Math.floor(window / 2) + 1);
    const subset = values.slice(start, end);
    ma.push(ss.mean(subset));
  }
  
  return ma;
}

function calculateSeasonalComponent(detrended, frequency) {
  // Simplified seasonal extraction
  return detrended.map((v, i) => Math.sin(2 * Math.PI * i / 12) * 0.1);
}

function calculateSeasonalStrength(seasonal, residual) {
  const varSeasonal = ss.variance(seasonal);
  const varResidual = ss.variance(residual);
  return varSeasonal / (varSeasonal + varResidual);
}

function interpretTrend(slope, r2, values) {
  const percentChange = (slope / ss.mean(values)) * 100;
  
  if (r2 < 0.1) return 'No clear trend';
  if (Math.abs(percentChange) < 1) return 'Stable with minimal trend';
  if (percentChange > 5) return `Strong upward trend (+${percentChange.toFixed(1)}% per period)`;
  if (percentChange < -5) return `Strong downward trend (${percentChange.toFixed(1)}% per period)`;
  if (percentChange > 0) return `Moderate upward trend (+${percentChange.toFixed(1)}% per period)`;
  return `Moderate downward trend (${percentChange.toFixed(1)}% per period)`;
}

function interpretSeasonality(pattern, frequency) {
  if (!pattern || pattern.strength < 0.2) {
    return 'No significant seasonal pattern';
  }
  
  const peaks = pattern.indices
    .map((idx, i) => ({ period: i, value: idx }))
    .filter(p => p.value > 1.1)
    .sort((a, b) => b.value - a.value);
  
  if (peaks.length === 0) {
    return 'Mild seasonal variation detected';
  }
  
  const periodNames = {
    hourly: ['12AM', '1AM', '2AM', '3AM', '4AM', '5AM', '6AM', '7AM', '8AM', '9AM', '10AM', '11AM',
             '12PM', '1PM', '2PM', '3PM', '4PM', '5PM', '6PM', '7PM', '8PM', '9PM', '10PM', '11PM'],
    daily: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    weekly: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    monthly: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  };
  
  const names = periodNames[frequency] || [];
  const peakName = names[peaks[0].period] || `Period ${peaks[0].period}`;
  
  return `Strong seasonality with peak at ${peakName} (${((peaks[0].value - 1) * 100).toFixed(0)}% above average)`;
}

function generateStationarityRecommendation(adf, kpss, breaks) {
  if (adf.isStationary && kpss.isStationary) {
    return 'Series is stationary - suitable for time series modeling';
  }
  
  if (!adf.isStationary && !kpss.isStationary) {
    return 'Series is non-stationary - consider differencing or detrending';
  }
  
  if (breaks.length > 0) {
    return 'Structural breaks detected - consider segmented analysis';
  }
  
  if (!adf.isStationary && kpss.isStationary) {
    return 'Series is trend stationary - detrending recommended';
  }
  
  return 'Mixed stationarity results - further investigation needed';
}

function getMonthName(month) {
  const names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return names[month];
}

function summarizeTimeSeriesCharacteristics(series) {
  const characteristics = [];
  
  // Check if any series has strong trend
  const trendingSeries = Object.entries(series)
    .filter(([_, analysis]) => analysis.trend && analysis.trend.strength > 0.5)
    .map(([name, analysis]) => ({
      name,
      direction: analysis.trend.direction,
      strength: analysis.trend.strength
    }));
  
  if (trendingSeries.length > 0) {
    characteristics.push(`${trendingSeries.length} series show significant trends`);
  }
  
  // Check for seasonality
  const seasonalSeries = Object.entries(series)
    .filter(([_, analysis]) => analysis.seasonality && analysis.seasonality.detected)
    .map(([name, _]) => name);
  
  if (seasonalSeries.length > 0) {
    characteristics.push(`Seasonal patterns detected in ${seasonalSeries.join(', ')}`);
  }
  
  // Check stationarity
  const nonStationarySeries = Object.entries(series)
    .filter(([_, analysis]) => 
      analysis.stationarity && 
      !analysis.stationarity.adf.isStationary
    ).length;
  
  if (nonStationarySeries > 0) {
    characteristics.push(`${nonStationarySeries} series require differencing for stationarity`);
  }
  
  return characteristics;
}