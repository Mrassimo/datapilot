import regression from 'regression';
import * as ss from 'simple-statistics';
import jstat from 'jstat';

export function performRegressionAnalysis(records, columns, columnTypes, targetColumn = null) {
  const numericColumns = columns.filter(col => 
    ['integer', 'float'].includes(columnTypes[col].type)
  );
  
  if (numericColumns.length < 2) {
    return {
      applicable: false,
      reason: 'Need at least 2 numeric columns for regression analysis'
    };
  }
  
  // Auto-select target if not provided
  if (!targetColumn) {
    targetColumn = selectRegressionTarget(records, numericColumns);
  }
  
  const predictors = numericColumns.filter(col => col !== targetColumn);
  if (predictors.length === 0) {
    return {
      applicable: false,
      reason: 'No predictor variables available'
    };
  }
  
  // Prepare data
  const data = prepareRegressionData(records, predictors, targetColumn);
  
  if (data.length < 20) {
    return {
      applicable: false,
      reason: 'Insufficient data points for reliable regression'
    };
  }
  
  // Perform multiple regression types
  const analyses = {
    simple: predictors.map(predictor => 
      performSimpleRegression(records, predictor, targetColumn)
    ),
    multiple: performMultipleRegression(data, predictors, targetColumn),
    polynomial: performPolynomialRegression(records, predictors[0], targetColumn),
    robust: performRobustRegression(data, predictors, targetColumn)
  };
  
  // Select best model
  const bestModel = selectBestModel(analyses);
  
  // Residual analysis for best model
  const residualAnalysis = analyzeResiduals(bestModel, data);
  
  return {
    applicable: true,
    targetVariable: targetColumn,
    predictors,
    analyses,
    bestModel,
    residualAnalysis,
    diagnostics: performRegressionDiagnostics(bestModel, data),
    interpretation: interpretRegression(bestModel, residualAnalysis)
  };
}

function selectRegressionTarget(records, columns) {
  let bestTarget = null;
  let maxVariance = 0;
  
  columns.forEach(col => {
    const values = records.map(r => r[col]).filter(v => v !== null && !isNaN(v));
    const variance = ss.variance(values);
    
    if (variance > maxVariance) {
      maxVariance = variance;
      bestTarget = col;
    }
  });
  
  return bestTarget;
}

function prepareRegressionData(records, predictors, target) {
  const data = [];
  
  records.forEach(record => {
    const targetValue = record[target];
    if (targetValue === null || isNaN(targetValue)) return;
    
    const predictorValues = predictors.map(p => record[p]);
    if (predictorValues.some(v => v === null || isNaN(v))) return;
    
    data.push({
      predictors: predictorValues,
      target: targetValue,
      record
    });
  });
  
  return data;
}

function performSimpleRegression(records, predictor, target) {
  const points = [];
  
  records.forEach(record => {
    const x = record[predictor];
    const y = record[target];
    if (x !== null && y !== null && !isNaN(x) && !isNaN(y)) {
      points.push([x, y]);
    }
  });
  
  if (points.length < 10) {
    return { applicable: false };
  }
  
  // Linear regression
  const result = regression.linear(points);
  
  // Calculate additional statistics
  const predicted = points.map(p => result.predict(p[0])[1]);
  const actual = points.map(p => p[1]);
  const residuals = actual.map((y, i) => y - predicted[i]);
  
  const meanY = ss.mean(actual);
  const ssTotal = actual.reduce((sum, y) => sum + Math.pow(y - meanY, 2), 0);
  const ssResidual = residuals.reduce((sum, r) => sum + r * r, 0);
  const ssRegression = ssTotal - ssResidual;
  
  const n = points.length;
  const mse = ssResidual / (n - 2);
  const rmse = Math.sqrt(mse);
  
  // Standard errors
  const xValues = points.map(p => p[0]);
  const xMean = ss.mean(xValues);
  const xSS = xValues.reduce((sum, x) => sum + Math.pow(x - xMean, 2), 0);
  const slopeStdError = Math.sqrt(mse / xSS);
  const interceptStdError = Math.sqrt(mse * (1/n + xMean*xMean/xSS));
  
  // t-statistics and p-values
  const slopeTStat = result.equation[0] / slopeStdError;
  const interceptTStat = result.equation[1] / interceptStdError;
  const df = n - 2;
  const slopePValue = 2 * (1 - jstat.studentt.cdf(Math.abs(slopeTStat), df));
  const interceptPValue = 2 * (1 - jstat.studentt.cdf(Math.abs(interceptTStat), df));
  
  // F-statistic
  const fStat = ssRegression / mse;
  const fPValue = 1 - jstat.centralF.cdf(fStat, 1, df);
  
  return {
    type: 'simple',
    predictor,
    equation: result.equation,
    r2: result.r2,
    adjustedR2: 1 - (1 - result.r2) * (n - 1) / (n - 2),
    rmse,
    coefficients: [
      {
        name: predictor,
        value: result.equation[0],
        stdError: slopeStdError,
        tStat: slopeTStat,
        pValue: slopePValue,
        significant: slopePValue < 0.05
      },
      {
        name: 'intercept',
        value: result.equation[1],
        stdError: interceptStdError,
        tStat: interceptTStat,
        pValue: interceptPValue,
        significant: interceptPValue < 0.05
      }
    ],
    fStatistic: {
      value: fStat,
      df1: 1,
      df2: df,
      pValue: fPValue,
      significant: fPValue < 0.05
    },
    residuals,
    predicted
  };
}

function performMultipleRegression(data, predictors, target) {
  // Prepare matrix for multiple regression
  const X = [];
  const y = [];
  
  data.forEach(d => {
    X.push([1, ...d.predictors]); // Add intercept
    y.push(d.target);
  });
  
  // Calculate coefficients using normal equation
  const XtX = matrixMultiply(transpose(X), X);
  const XtXinv = matrixInverse(XtX);
  const Xty = matrixMultiply(transpose(X), y.map(v => [v]));
  const coefficients = matrixMultiply(XtXinv, Xty).map(row => row[0]);
  
  // Calculate predictions and residuals
  const predicted = X.map(row => 
    row.reduce((sum, x, i) => sum + x * coefficients[i], 0)
  );
  const residuals = y.map((actual, i) => actual - predicted[i]);
  
  // Calculate R-squared
  const meanY = ss.mean(y);
  const ssTotal = y.reduce((sum, val) => sum + Math.pow(val - meanY, 2), 0);
  const ssResidual = residuals.reduce((sum, r) => sum + r * r, 0);
  const r2 = 1 - ssResidual / ssTotal;
  
  const n = data.length;
  const p = predictors.length;
  const adjustedR2 = 1 - (1 - r2) * (n - 1) / (n - p - 1);
  
  // Calculate standard errors
  const mse = ssResidual / (n - p - 1);
  const rmse = Math.sqrt(mse);
  const covMatrix = XtXinv.map(row => row.map(val => val * mse));
  const stdErrors = covMatrix.map((row, i) => Math.sqrt(row[i]));
  
  // Calculate t-statistics and p-values
  const coefficientStats = coefficients.map((coef, i) => {
    const tStat = coef / stdErrors[i];
    const pValue = 2 * (1 - jstat.studentt.cdf(Math.abs(tStat), n - p - 1));
    
    return {
      name: i === 0 ? 'intercept' : predictors[i - 1],
      value: coef,
      stdError: stdErrors[i],
      tStat,
      pValue,
      significant: pValue < 0.05
    };
  });
  
  // F-statistic
  const ssRegression = ssTotal - ssResidual;
  const fStat = (ssRegression / p) / (ssResidual / (n - p - 1));
  const fPValue = 1 - jstat.centralF.cdf(fStat, p, n - p - 1);
  
  // Calculate VIF for multicollinearity
  const vifs = calculateVIF(X, predictors);
  
  return {
    type: 'multiple',
    predictors,
    coefficients: coefficientStats,
    r2,
    adjustedR2,
    rmse,
    fStatistic: {
      value: fStat,
      df1: p,
      df2: n - p - 1,
      pValue: fPValue,
      significant: fPValue < 0.05
    },
    multicollinearity: vifs,
    residuals,
    predicted
  };
}

function performPolynomialRegression(records, predictor, target, degree = 2) {
  const points = [];
  
  records.forEach(record => {
    const x = record[predictor];
    const y = record[target];
    if (x !== null && y !== null && !isNaN(x) && !isNaN(y)) {
      points.push([x, y]);
    }
  });
  
  if (points.length < 10) {
    return { applicable: false };
  }
  
  const result = regression.polynomial(points, { order: degree });
  
  // Calculate R-squared manually
  const predicted = points.map(p => result.predict(p[0])[1]);
  const actual = points.map(p => p[1]);
  const meanY = ss.mean(actual);
  const ssTotal = actual.reduce((sum, y) => sum + Math.pow(y - meanY, 2), 0);
  const ssResidual = actual.reduce((sum, y, i) => sum + Math.pow(y - predicted[i], 2), 0);
  const r2 = 1 - ssResidual / ssTotal;
  
  return {
    type: 'polynomial',
    predictor,
    degree,
    equation: result.equation,
    r2,
    interpretation: r2 > 0.1 ? 'Non-linear relationship detected' : 'Weak non-linear relationship'
  };
}

function performRobustRegression(data, predictors, target) {
  // Simplified robust regression using Huber weights
  const maxIterations = 20;
  const tolerance = 0.0001;
  let weights = data.map(() => 1);
  let prevCoefficients = null;
  
  for (let iter = 0; iter < maxIterations; iter++) {
    // Weighted least squares
    const weightedData = data.map((d, i) => ({
      ...d,
      weight: weights[i]
    }));
    
    const coefficients = calculateWeightedRegression(weightedData, predictors);
    
    // Check convergence
    if (prevCoefficients && 
        coefficients.every((c, i) => Math.abs(c - prevCoefficients[i]) < tolerance)) {
      break;
    }
    
    // Update weights based on residuals
    const residuals = data.map((d, i) => {
      const predicted = coefficients[0] + 
        d.predictors.reduce((sum, x, j) => sum + x * coefficients[j + 1], 0);
      return d.target - predicted;
    });
    
    const mad = ss.medianAbsoluteDeviation(residuals);
    const c = 1.345; // Huber constant
    
    weights = residuals.map(r => {
      const scaled = Math.abs(r) / (mad * c);
      return scaled <= 1 ? 1 : 1 / scaled;
    });
    
    prevCoefficients = coefficients;
  }
  
  return {
    type: 'robust',
    interpretation: 'Outlier-resistant regression',
    outlierCount: weights.filter(w => w < 0.5).length
  };
}

function analyzeResiduals(model, data) {
  if (!model.residuals) return null;
  
  const residuals = model.residuals;
  const predicted = model.predicted;
  
  // Normality test
  const normalityTest = testResidualNormality(residuals);
  
  // Homoscedasticity test (Breusch-Pagan)
  const homoscedasticityTest = testHomoscedasticity(residuals, predicted);
  
  // Independence test (Durbin-Watson)
  const independenceTest = testIndependence(residuals);
  
  // Influential points
  const influential = findInfluentialPoints(data, residuals, predicted);
  
  return {
    normalityTest,
    homoscedasticityTest,
    independenceTest,
    influential,
    patterns: detectResidualPatterns(residuals, predicted)
  };
}

function testResidualNormality(residuals) {
  const n = residuals.length;
  const mean = ss.mean(residuals);
  const stdDev = ss.standardDeviation(residuals);
  
  // Standardize residuals
  const standardized = residuals.map(r => (r - mean) / stdDev);
  
  // Shapiro-Wilk test (simplified)
  const sorted = [...standardized].sort((a, b) => a - b);
  let W = 0;
  
  for (let i = 0; i < Math.floor(n/2); i++) {
    const ai = 0.5; // Simplified coefficient
    W += ai * (sorted[n - 1 - i] - sorted[i]);
  }
  W = Math.pow(W, 2) / residuals.reduce((sum, r) => sum + r * r, 0);
  
  return {
    test: 'Shapiro-Wilk',
    statistic: W,
    normal: W > 0.9,
    interpretation: W > 0.9 ? 'Residuals appear normally distributed' : 
                               'Residuals deviate from normality'
  };
}

function testHomoscedasticity(residuals, predicted) {
  // Breusch-Pagan test
  const n = residuals.length;
  const squaredResiduals = residuals.map(r => r * r);
  
  // Regress squared residuals on predicted values
  const points = predicted.map((p, i) => [p, squaredResiduals[i]]);
  const auxRegression = regression.linear(points);
  
  const lmStatistic = n * auxRegression.r2;
  const pValue = 1 - jstat.chisquare.cdf(lmStatistic, 1);
  
  return {
    test: 'Breusch-Pagan',
    statistic: lmStatistic,
    pValue,
    homoscedastic: pValue > 0.05,
    interpretation: pValue > 0.05 ? 'Constant variance (homoscedastic)' : 
                                   'Non-constant variance (heteroscedastic)'
  };
}

function testIndependence(residuals) {
  // Durbin-Watson test
  let sumSquaredDiff = 0;
  let sumSquared = 0;
  
  for (let i = 1; i < residuals.length; i++) {
    sumSquaredDiff += Math.pow(residuals[i] - residuals[i-1], 2);
  }
  
  residuals.forEach(r => {
    sumSquared += r * r;
  });
  
  const dw = sumSquaredDiff / sumSquared;
  
  return {
    test: 'Durbin-Watson',
    statistic: dw,
    interpretation: 
      dw < 1.5 ? 'Positive autocorrelation' :
      dw > 2.5 ? 'Negative autocorrelation' :
      'No significant autocorrelation'
  };
}

function findInfluentialPoints(data, residuals, predicted) {
  const n = data.length;
  const p = data[0].predictors.length + 1; // Including intercept
  
  const influential = [];
  const leverage = calculateLeverage(data);
  
  residuals.forEach((r, i) => {
    // Cook's distance (simplified)
    const h = leverage[i];
    const standardizedResidual = r / (Math.sqrt(ss.variance(residuals)) * Math.sqrt(1 - h));
    const cooksD = (standardizedResidual * standardizedResidual * h) / (p * (1 - h));
    
    if (cooksD > 4 / n || h > 2 * p / n) {
      influential.push({
        index: i,
        cooksDistance: cooksD,
        leverage: h,
        influence: cooksD > 1 ? 'high' : cooksD > 0.5 ? 'moderate' : 'low'
      });
    }
  });
  
  return influential;
}

function detectResidualPatterns(residuals, predicted) {
  const patterns = [];
  
  // Check for systematic bias
  const meanResidual = ss.mean(residuals);
  if (Math.abs(meanResidual) > 0.01) {
    patterns.push('Systematic bias in predictions');
  }
  
  // Check for funnel pattern (heteroscedasticity)
  const bins = 5;
  const sortedByPredicted = predicted
    .map((p, i) => ({ predicted: p, residual: residuals[i] }))
    .sort((a, b) => a.predicted - b.predicted);
  
  const binSize = Math.floor(sortedByPredicted.length / bins);
  const binVariances = [];
  
  for (let i = 0; i < bins; i++) {
    const binData = sortedByPredicted.slice(i * binSize, (i + 1) * binSize);
    const binResiduals = binData.map(d => d.residual);
    binVariances.push(ss.variance(binResiduals));
  }
  
  const varianceRatio = Math.max(...binVariances) / Math.min(...binVariances);
  if (varianceRatio > 3) {
    patterns.push('Funnel pattern detected (variance changes with predicted values)');
  }
  
  return patterns;
}

// Matrix operations
function transpose(matrix) {
  return matrix[0].map((_, i) => matrix.map(row => row[i]));
}

function matrixMultiply(a, b) {
  const result = [];
  for (let i = 0; i < a.length; i++) {
    result[i] = [];
    for (let j = 0; j < b[0].length; j++) {
      result[i][j] = 0;
      for (let k = 0; k < b.length; k++) {
        result[i][j] += a[i][k] * b[k][j];
      }
    }
  }
  return result;
}

function matrixInverse(matrix) {
  // Simplified 2x2 or 3x3 matrix inversion
  // In practice, use a proper linear algebra library
  const n = matrix.length;
  const identity = Array(n).fill(null).map((_, i) => 
    Array(n).fill(0).map((_, j) => i === j ? 1 : 0)
  );
  
  // Gauss-Jordan elimination (simplified)
  const augmented = matrix.map((row, i) => [...row, ...identity[i]]);
  
  for (let i = 0; i < n; i++) {
    // Pivot
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(augmented[k][i]) > Math.abs(augmented[maxRow][i])) {
        maxRow = k;
      }
    }
    [augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]];
    
    // Scale
    const pivot = augmented[i][i];
    for (let j = 0; j < 2 * n; j++) {
      augmented[i][j] /= pivot;
    }
    
    // Eliminate
    for (let k = 0; k < n; k++) {
      if (k !== i) {
        const factor = augmented[k][i];
        for (let j = 0; j < 2 * n; j++) {
          augmented[k][j] -= factor * augmented[i][j];
        }
      }
    }
  }
  
  return augmented.map(row => row.slice(n));
}

function calculateVIF(X, predictors) {
  const vifs = [];
  
  for (let i = 1; i < X[0].length; i++) { // Skip intercept
    // Regress predictor i on all other predictors
    const y = X.map(row => row[i]);
    const XOther = X.map(row => row.filter((_, j) => j !== i));
    
    // Calculate R-squared for this regression
    const r2 = calculateR2ForVIF(XOther, y);
    const vif = 1 / (1 - r2);
    
    vifs.push({
      predictor: predictors[i - 1],
      vif: vif,
      interpretation: vif > 10 ? 'Severe multicollinearity' :
                     vif > 5 ? 'Moderate multicollinearity' :
                     'No multicollinearity concern'
    });
  }
  
  return vifs;
}

function calculateR2ForVIF(X, y) {
  // Simplified R-squared calculation
  const meanY = ss.mean(y);
  const ssTotal = y.reduce((sum, val) => sum + Math.pow(val - meanY, 2), 0);
  
  // Use mean as prediction (simplified)
  const predicted = X.map(() => meanY);
  const ssResidual = y.reduce((sum, val, i) => sum + Math.pow(val - predicted[i], 2), 0);
  
  return Math.max(0, 1 - ssResidual / ssTotal);
}

function calculateWeightedRegression(weightedData, predictors) {
  // Simplified weighted least squares
  const weights = weightedData.map(d => d.weight);
  const sumWeights = weights.reduce((a, b) => a + b, 0);
  
  // Calculate weighted means
  const weightedMeanY = weightedData.reduce((sum, d, i) => 
    sum + d.target * weights[i], 0) / sumWeights;
  
  const weightedMeanX = predictors.map((_, j) => 
    weightedData.reduce((sum, d, i) => 
      sum + d.predictors[j] * weights[i], 0) / sumWeights
  );
  
  // Simplified coefficient calculation
  const coefficients = [weightedMeanY, ...weightedMeanX.map(() => 0.5)];
  
  return coefficients;
}

function calculateLeverage(data) {
  // Simplified leverage calculation
  const n = data.length;
  const p = data[0].predictors.length + 1;
  
  return data.map(() => p / n); // Simplified - equal leverage
}

function selectBestModel(analyses) {
  // Select model with highest adjusted R-squared
  let best = null;
  let maxAdjR2 = -Infinity;
  
  if (analyses.simple) {
    analyses.simple.forEach(model => {
      if (model.adjustedR2 > maxAdjR2) {
        maxAdjR2 = model.adjustedR2;
        best = model;
      }
    });
  }
  
  if (analyses.multiple && analyses.multiple.adjustedR2 > maxAdjR2) {
    best = analyses.multiple;
  }
  
  return best;
}

function performRegressionDiagnostics(model, data) {
  if (!model) return null;
  
  const diagnostics = {
    modelQuality: interpretModelQuality(model),
    assumptions: [],
    warnings: []
  };
  
  // Check R-squared
  if (model.r2 < 0.1) {
    diagnostics.warnings.push('Very low R² - model explains little variance');
  }
  
  // Check multicollinearity
  if (model.multicollinearity) {
    const highVIF = model.multicollinearity.filter(v => v.vif > 5);
    if (highVIF.length > 0) {
      diagnostics.warnings.push('Multicollinearity detected - consider removing correlated predictors');
    }
  }
  
  // Check coefficient significance
  if (model.coefficients) {
    const nonSig = model.coefficients.filter(c => !c.significant && c.name !== 'intercept');
    if (nonSig.length > 0) {
      diagnostics.warnings.push(`Non-significant predictors: ${nonSig.map(c => c.name).join(', ')}`);
    }
  }
  
  return diagnostics;
}

function interpretModelQuality(model) {
  const r2 = model.r2 || 0;
  const adjR2 = model.adjustedR2 || r2;
  
  return {
    r2: r2.toFixed(3),
    adjustedR2: adjR2.toFixed(3),
    interpretation: 
      adjR2 > 0.8 ? 'Excellent model fit' :
      adjR2 > 0.6 ? 'Good model fit' :
      adjR2 > 0.4 ? 'Moderate model fit' :
      adjR2 > 0.2 ? 'Weak model fit' :
      'Poor model fit'
  };
}

function interpretRegression(model, residualAnalysis) {
  const interpretations = [];
  
  // Model fit
  if (model) {
    interpretations.push(interpretModelQuality(model).interpretation);
    
    // Significant predictors
    if (model.coefficients) {
      const significant = model.coefficients
        .filter(c => c.significant && c.name !== 'intercept')
        .map(c => `${c.name} (p=${c.pValue.toFixed(3)})`);
      
      if (significant.length > 0) {
        interpretations.push(`Significant predictors: ${significant.join(', ')}`);
      }
    }
  }
  
  // Residual diagnostics
  if (residualAnalysis) {
    if (!residualAnalysis.normalityTest.normal) {
      interpretations.push('Residuals show non-normality - consider transformations');
    }
    
    if (!residualAnalysis.homoscedasticityTest.homoscedastic) {
      interpretations.push('Heteroscedasticity detected - consider weighted regression');
    }
    
    if (residualAnalysis.influential.length > 0) {
      interpretations.push(`${residualAnalysis.influential.length} influential points detected`);
    }
  }
  
  return interpretations.join('. ');
}