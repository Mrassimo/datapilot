import { 
  createSection, 
  createSubSection, 
  formatNumber, 
  formatPercentage,
  bulletList,
  formatTimestamp 
} from '../../../utils/format.js';

export function formatComprehensiveEDAReport(analysis) {
  let report = '';
  
  // Header
  report += createSection('EXPLORATORY DATA ANALYSIS REPORT', 
    `Dataset: ${analysis.fileName}\n` +
    `Generated: ${formatTimestamp()}\n` +
    `Analysis Depth: Comprehensive (auto-detected)`
  );
  
  // Handle empty dataset
  if (analysis.empty) {
    report += '\n\n⚠️  Empty dataset - no data to analyze';
    return report;
  }
  
  // Dataset Overview
  report += formatDatasetOverview(analysis);
  
  // Column Analysis with Enhanced Stats
  report += formatEnhancedColumnAnalysis(analysis);
  
  // Distribution Analysis
  if (analysis.distributionAnalysis) {
    report += formatDistributionAnalysis(analysis.distributionAnalysis);
  }
  
  // Outlier Analysis
  if (analysis.outlierAnalysis) {
    report += formatOutlierAnalysis(analysis.outlierAnalysis);
  }
  
  // Decision Tree Insights
  if (analysis.cartAnalysis && analysis.cartAnalysis.applicable) {
    report += formatCARTAnalysis(analysis.cartAnalysis);
  }
  
  // Regression Analysis
  if (analysis.regressionAnalysis && analysis.regressionAnalysis.applicable) {
    report += formatRegressionAnalysis(analysis.regressionAnalysis);
  }
  
  // Multivariate Relationships
  if (analysis.correlationAnalysis) {
    report += formatCorrelationAnalysis(analysis.correlationAnalysis);
  }
  
  // Advanced Statistical Tests
  if (analysis.advancedTests) {
    report += formatAdvancedTests(analysis.advancedTests);
  }
  
  // Australian Data Validation
  if (analysis.australianValidation && analysis.australianValidation.detected) {
    report += formatAustralianValidation(analysis.australianValidation);
  }
  
  // Time Series Analysis
  if (analysis.timeSeriesAnalysis && analysis.timeSeriesAnalysis.applicable) {
    report += formatTimeSeriesAnalysis(analysis.timeSeriesAnalysis);
  }
  
  // Pattern Detection & Anomalies
  if (analysis.patterns) {
    report += formatPatternDetection(analysis.patterns);
  }
  
  // ML Readiness Assessment
  if (analysis.mlReadiness) {
    report += formatMLReadiness(analysis.mlReadiness);
  }
  
  // Data Quality Summary
  report += formatDataQualitySummary(analysis);
  
  // Key Insights & Recommendations
  report += formatKeyInsights(analysis);
  
  // Suggested Deep-Dive Analyses
  report += formatSuggestedAnalyses(analysis);
  
  return report;
}

function formatDatasetOverview(analysis) {
  const items = [
    `Total rows: ${analysis.rowCount.toLocaleString()}`,
    `Total columns: ${analysis.columnCount}`,
    `File size: ${analysis.fileSize}`,
    `Memory usage: ~${estimateMemoryUsage(analysis)}`,
    `Numeric columns: ${analysis.numericColumnCount}`,
    `Categorical columns: ${analysis.categoricalColumnCount}`,
    analysis.dateColumns.length > 0 ? 
      `Date columns: ${analysis.dateColumns.join(', ')}` : 
      'No date columns detected',
    `Data completeness: ${formatPercentage(analysis.completeness)}`
  ];
  
  return createSubSection('DATASET OVERVIEW', bulletList(items));
}

function formatEnhancedColumnAnalysis(analysis) {
  let section = createSubSection('COLUMN ANALYSIS (Enhanced Statistics)', '');
  
  analysis.columns.forEach((col, idx) => {
    section += `\n[Column ${idx + 1}/${analysis.columns.length}] ${col.name}\n`;
    section += `Type: ${col.type} | Non-null: ${formatPercentage(col.nonNullRatio)}\n\n`;
    
    if (col.stats) {
      if (col.type === 'integer' || col.type === 'float') {
        section += formatNumericStats(col.stats);
      } else if (col.type === 'categorical') {
        section += formatCategoricalStats(col.stats);
      }
    }
    
    section += '\n' + '-'.repeat(60) + '\n';
  });
  
  return section;
}

function formatNumericStats(stats) {
  let result = 'CENTRAL TENDENCY:\n';
  result += `  Mean: ${formatNumber(stats.mean)} | Median: ${formatNumber(stats.median)} | Mode: ${formatNumber(stats.mode)}\n`;
  
  result += '\nSPREAD:\n';
  result += `  Std Dev: ${formatNumber(stats.standardDeviation)} | Variance: ${formatNumber(stats.variance)}\n`;
  result += `  IQR: ${formatNumber(stats.iqr)} | Range: [${formatNumber(stats.min)}, ${formatNumber(stats.max)}]\n`;
  result += `  CV: ${formatPercentage(stats.coefficientOfVariation / 100)}\n`;
  
  result += '\nPERCENTILES:\n';
  result += `  5th: ${formatNumber(stats.p5)} | 25th: ${formatNumber(stats.p25)} | `;
  result += `50th: ${formatNumber(stats.p50)} | 75th: ${formatNumber(stats.p75)} | `;
  result += `95th: ${formatNumber(stats.p95)}\n`;
  
  result += '\nSHAPE:\n';
  result += `  Skewness: ${formatNumber(stats.skewness, 3)} (${interpretSkewness(stats.skewness)})\n`;
  result += `  Kurtosis: ${formatNumber(stats.kurtosis, 3)} (${interpretKurtosis(stats.kurtosis)})\n`;
  
  if (stats.outliers) {
    result += '\nOUTLIERS:\n';
    result += `  IQR method: ${stats.outliers.iqr.length} outliers\n`;
    result += `  Z-score method: ${stats.outliers.zscore.length} outliers\n`;
  }
  
  return result;
}

function formatCategoricalStats(stats) {
  let result = 'CATEGORY STATISTICS:\n';
  result += `  Unique values: ${stats.uniqueCount}\n`;
  result += `  Mode: "${stats.mode}" (${formatPercentage(stats.modePercentage / 100)})\n`;
  result += `  Entropy: ${formatNumber(stats.entropy, 3)} | Normalized: ${formatNumber(stats.normalizedEntropy, 3)}\n`;
  
  result += '\nTOP VALUES:\n';
  stats.topValues.slice(0, 5).forEach(val => {
    result += `  "${val.value}": ${val.count} (${formatPercentage(val.percentage / 100)})\n`;
  });
  
  if (stats.rareCount > 0) {
    result += `\nRARE VALUES: ${stats.rareCount} categories < 1% (${formatPercentage(stats.rarePercentage / 100)} of data)\n`;
  }
  
  return result;
}

function formatDistributionAnalysis(distAnalysis) {
  let section = createSubSection('DISTRIBUTION DEEP DIVE', '');
  
  Object.entries(distAnalysis).forEach(([column, analysis]) => {
    section += `\n${column}:\n`;
    
    if (analysis.tests.normality) {
      section += formatNormalityTests(analysis.tests.normality);
    }
    
    if (analysis.tests.bestFit) {
      section += `\nBest Fit: ${analysis.tests.bestFit.distribution}\n`;
    }
    
    if (analysis.transformations && analysis.transformations.length > 0) {
      section += '\nRECOMMENDED TRANSFORMATIONS:\n';
      analysis.transformations.forEach(trans => {
        section += `  - ${trans.description}: `;
        section += `Skewness ${formatNumber(trans.originalSkewness, 2)} → ${formatNumber(trans.transformedSkewness, 2)}\n`;
      });
    }
  });
  
  return section;
}

function formatNormalityTests(normality) {
  let result = '\nNORMALITY TESTS:\n';
  
  if (normality.shapiroWilk) {
    result += `  Shapiro-Wilk: W=${formatNumber(normality.shapiroWilk.statistic, 3)} `;
    result += `(${normality.shapiroWilk.interpretation})\n`;
  }
  
  if (normality.jarqueBera) {
    result += `  Jarque-Bera: JB=${formatNumber(normality.jarqueBera.statistic, 2)} `;
    result += `p=${formatNumber(normality.jarqueBera.pValue, 3)}\n`;
  }
  
  result += `  Overall: ${normality.isNormal ? '✓ Normal' : '✗ Non-normal'}\n`;
  
  return result;
}

function formatOutlierAnalysis(outlierAnalysis) {
  let section = createSubSection('UNIVARIATE OUTLIER ANALYSIS', '');
  
  Object.entries(outlierAnalysis).forEach(([column, analysis]) => {
    if (!analysis.methods) return;
    
    section += `\n[Column: ${column}]\n`;
    section += `Statistical Outliers: ${analysis.aggregated.length} records\n`;
    
    // Method summary
    if (analysis.methods.iqr && analysis.methods.iqr.totalOutliers > 0) {
      section += `  - IQR Method: ${analysis.methods.iqr.totalOutliers} outliers `;
      section += `(${analysis.methods.iqr.outliers.mild.length} mild, ${analysis.methods.iqr.outliers.extreme.length} extreme)\n`;
    }
    
    if (analysis.methods.modifiedZScore && analysis.methods.modifiedZScore.totalOutliers > 0) {
      section += `  - Modified Z-Score: ${analysis.methods.modifiedZScore.totalOutliers} outliers `;
      section += `(threshold: 3.5)\n`;
    }
    
    // Top outliers
    if (analysis.aggregated.length > 0) {
      const topOutliers = analysis.aggregated
        .filter(o => o.confidence === 'high' || o.confidence === 'very high')
        .slice(0, 5)
        .map(o => formatNumber(o.value));
      
      if (topOutliers.length > 0) {
        section += `  - Top extreme values: [${topOutliers.join(', ')}]\n`;
      }
    }
    
    // Contextual analysis
    if (analysis.contextual && analysis.contextual.patterns.length > 0) {
      section += `  - Pattern: ${analysis.contextual.patterns[0]}\n`;
    }
    
    if (analysis.contextual && analysis.contextual.recommendations.length > 0) {
      section += `  - Recommendation: ${analysis.contextual.recommendations[0]}\n`;
    }
  });
  
  return section;
}

function formatCARTAnalysis(cartAnalysis) {
  let section = createSubSection('DECISION TREE INSIGHTS', '');
  
  section += `Target Variable: ${cartAnalysis.targetVariable}\n`;
  section += `Tree Depth: ${cartAnalysis.treeDepth} | Model Quality: ${cartAnalysis.modelQuality.interpretation}\n\n`;
  
  section += 'KEY BUSINESS RULES DISCOVERED:\n';
  
  cartAnalysis.segments.slice(0, 5).forEach((segment, idx) => {
    section += `\n${idx + 1}. ${segment.type.toUpperCase()} SEGMENT (${segment.avgValue}):\n`;
    section += `   ${segment.description}\n`;
    section += `   ├─ Size: ${segment.size} customers (${segment.sizePercentage}%)\n`;
    section += `   ├─ Confidence: ${segment.confidence}%\n`;
    section += `   └─ Action: ${segment.actionability}\n`;
  });
  
  if (cartAnalysis.featureImportances.length > 0) {
    section += '\nFEATURE IMPORTANCE:\n';
    cartAnalysis.featureImportances.slice(0, 5).forEach(feat => {
      section += `  - ${feat.feature}: ${feat.importance}%\n`;
    });
  }
  
  return section;
}

function formatRegressionAnalysis(regression) {
  let section = createSubSection('REGRESSION ANALYSIS', '');
  
  section += `Target: ${regression.targetVariable} | Predictors: ${regression.predictors.join(', ')}\n\n`;
  
  if (regression.bestModel) {
    const model = regression.bestModel;
    section += `BEST MODEL: ${model.type}\n`;
    section += `  R²: ${formatNumber(model.r2, 3)} | Adjusted R²: ${formatNumber(model.adjustedR2, 3)}\n`;
    section += `  RMSE: ${formatNumber(model.rmse, 2)}\n`;
    
    if (model.fStatistic) {
      section += `  F-statistic: ${formatNumber(model.fStatistic.value, 2)} `;
      section += `(p=${formatNumber(model.fStatistic.pValue, 4)})\n`;
    }
    
    section += '\nCOEFFICIENTS:\n';
    model.coefficients.forEach(coef => {
      section += `  ${coef.name}: ${formatNumber(coef.value, 3)} `;
      section += `(SE=${formatNumber(coef.stdError, 3)}, p=${formatNumber(coef.pValue, 3)})`;
      section += coef.significant ? ' *' : '';
      section += '\n';
    });
  }
  
  if (regression.residualAnalysis) {
    section += formatResidualAnalysis(regression.residualAnalysis);
  }
  
  return section;
}

function formatResidualAnalysis(residuals) {
  let result = '\nRESIDUAL ANALYSIS:\n';
  
  if (residuals.normalityTest) {
    result += `  - Normality: ${residuals.normalityTest.interpretation}\n`;
  }
  
  if (residuals.homoscedasticityTest) {
    result += `  - Homoscedasticity: ${residuals.homoscedasticityTest.interpretation}\n`;
  }
  
  if (residuals.independenceTest) {
    result += `  - Independence: ${residuals.independenceTest.interpretation}\n`;
  }
  
  if (residuals.influential && residuals.influential.length > 0) {
    result += `  - Influential points: ${residuals.influential.length} detected\n`;
  }
  
  if (residuals.patterns && residuals.patterns.length > 0) {
    result += `  - Patterns: ${residuals.patterns.join('; ')}\n`;
  }
  
  return result;
}

function formatCorrelationAnalysis(correlations) {
  let section = createSubSection('MULTIVARIATE RELATIONSHIPS', '');
  
  if (correlations.pearson && correlations.pearson.length > 0) {
    section += 'PEARSON CORRELATIONS (Linear):\n';
    correlations.pearson.slice(0, 10).forEach(corr => {
      const strength = Math.abs(corr.value) > 0.7 ? 'Strong' : 
                      Math.abs(corr.value) > 0.5 ? 'Moderate' : 'Weak';
      const direction = corr.value > 0 ? 'positive' : 'negative';
      section += `  - ${corr.var1} ↔ ${corr.var2}: ${formatNumber(corr.value, 3)} `;
      section += `(${strength} ${direction})\n`;
    });
  }
  
  if (correlations.multicollinearity && correlations.multicollinearity.length > 0) {
    section += '\nMULTICOLLINEARITY CHECK:\n';
    correlations.multicollinearity.forEach(vif => {
      section += `  - ${vif.variable}: VIF=${formatNumber(vif.value, 2)} `;
      section += `(${vif.interpretation})\n`;
    });
  }
  
  return section;
}

function formatAustralianValidation(validation) {
  let section = createSubSection('AUSTRALIAN DATA VALIDATION', '');
  
  Object.entries(validation.results).forEach(([column, results]) => {
    section += `\n[${column}]\n`;
    
    results.forEach(result => {
      section += `  ${result.type}: `;
      if (result.valid) {
        section += `✓ ${result.validCount} valid entries\n`;
        if (result.details) {
          Object.entries(result.details).forEach(([key, value]) => {
            section += `    - ${key}: ${value}\n`;
          });
        }
      } else {
        section += `✗ ${result.invalidCount} invalid entries\n`;
        if (result.examples) {
          section += `    Examples: ${result.examples.slice(0, 3).join(', ')}\n`;
        }
      }
    });
  });
  
  return section;
}

function formatTimeSeriesAnalysis(timeSeries) {
  let section = createSubSection('TIME SERIES ANALYSIS', '');
  
  section += `Time Column: ${timeSeries.timeColumn}\n`;
  section += `Frequency: ${timeSeries.frequency}\n`;
  section += `Date Range: ${timeSeries.dateRange}\n\n`;
  
  if (timeSeries.trend) {
    section += 'TREND ANALYSIS:\n';
    section += `  - Type: ${timeSeries.trend.type}\n`;
    section += `  - Strength: ${formatNumber(timeSeries.trend.strength, 3)}\n`;
    if (timeSeries.trend.slope) {
      section += `  - Slope: ${formatNumber(timeSeries.trend.slope, 4)} per period\n`;
    }
  }
  
  if (timeSeries.seasonality) {
    section += '\nSEASONALITY:\n';
    section += `  - Period: ${timeSeries.seasonality.period}\n`;
    section += `  - Strength: ${formatNumber(timeSeries.seasonality.strength, 3)}\n`;
    if (timeSeries.seasonality.peaks) {
      section += `  - Peak periods: ${timeSeries.seasonality.peaks.join(', ')}\n`;
    }
  }
  
  if (timeSeries.stationarity) {
    section += '\nSTATIONARITY TESTS:\n';
    section += `  - ADF test: ${timeSeries.stationarity.adf.interpretation}\n`;
    section += `  - KPSS test: ${timeSeries.stationarity.kpss.interpretation}\n`;
  }
  
  return section;
}

function formatPatternDetection(patterns) {
  let section = createSubSection('PATTERN DETECTION & ANOMALIES', '');
  
  if (patterns.benfordLaw && patterns.benfordLaw.length > 0) {
    section += 'BENFORD\'S LAW ANALYSIS:\n';
    patterns.benfordLaw.forEach(result => {
      section += `  - ${result.column}: ${result.interpretation}\n`;
    });
    section += '\n';
  }
  
  if (patterns.businessRules && patterns.businessRules.length > 0) {
    section += 'DETECTED BUSINESS RULES:\n';
    patterns.businessRules.forEach(rule => {
      section += `  ${rule.column}:\n`;
      rule.rules.forEach(r => {
        section += `    - ${r}\n`;
      });
    });
    section += '\n';
  }
  
  if (patterns.duplicatePatterns && patterns.duplicatePatterns.length > 0) {
    section += 'DUPLICATE PATTERNS:\n';
    patterns.duplicatePatterns.forEach(dup => {
      section += `  - ${dup.type}: ${dup.count} duplicates (${dup.percentage}%)\n`;
    });
  }
  
  return section;
}

function formatMLReadiness(mlReadiness) {
  let section = createSubSection('ML READINESS ASSESSMENT', '');
  
  section += `Overall Score: ${mlReadiness.overallScore}/10\n\n`;
  
  section += 'FEATURE QUALITY:\n';
  mlReadiness.featureQuality.forEach(feat => {
    section += `  - ${feat.feature}: ${feat.assessment}\n`;
  });
  
  section += '\nDATA PREPARATION RECOMMENDATIONS:\n';
  mlReadiness.recommendations.forEach((rec, idx) => {
    section += `  ${idx + 1}. ${rec}\n`;
  });
  
  if (mlReadiness.modelSuggestions) {
    section += '\nSUGGESTED MODELS:\n';
    mlReadiness.modelSuggestions.forEach(model => {
      section += `  - ${model.type}: ${model.reason}\n`;
    });
  }
  
  return section;
}

function formatDataQualitySummary(analysis) {
  const items = [
    `Completeness: ${formatPercentage(analysis.completeness)} (${analysis.completenessLevel})`,
    `Duplicate rows: ${analysis.duplicateCount} ${analysis.duplicateCount === 0 ? '(excellent)' : '(consider deduplication)'}`,
    `Columns with >10% missing: ${analysis.highMissingColumns}`,
    `Data consistency: ${analysis.consistencyScore}/10`,
    `Outlier prevalence: ${formatPercentage(analysis.outlierRate)} of numeric data`
  ];
  
  return createSubSection('DATA QUALITY SUMMARY', bulletList(items));
}

function formatKeyInsights(analysis) {
  let section = createSubSection('KEY INSIGHTS & RECOMMENDATIONS', '');
  
  analysis.insights.forEach((insight, idx) => {
    section += `${idx + 1}. ${insight}\n`;
  });
  
  return section;
}

function formatSuggestedAnalyses(analysis) {
  let section = createSubSection('SUGGESTED DEEP-DIVE ANALYSES', '');
  
  analysis.suggestions.forEach((suggestion, idx) => {
    section += `${idx + 1}. ${suggestion.title}\n`;
    section += `   Rationale: ${suggestion.rationale}\n`;
    section += `   Approach: ${suggestion.approach}\n\n`;
  });
  
  return section;
}

// Helper functions
function interpretSkewness(skewness) {
  if (Math.abs(skewness) < 0.5) return 'symmetric';
  if (skewness > 2) return 'highly right-skewed';
  if (skewness > 1) return 'moderately right-skewed';
  if (skewness < -2) return 'highly left-skewed';
  if (skewness < -1) return 'moderately left-skewed';
  return 'slightly skewed';
}

function interpretKurtosis(kurtosis) {
  if (Math.abs(kurtosis) < 0.5) return 'normal tails';
  if (kurtosis > 1) return 'heavy tails';
  if (kurtosis < -1) return 'light tails';
  return 'near-normal tails';
}

function estimateMemoryUsage(analysis) {
  const bytesPerCell = 8; // Rough estimate
  const totalCells = analysis.rowCount * analysis.columnCount;
  const bytes = totalCells * bytesPerCell;
  
  if (bytes < 1024) return `${bytes} bytes`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}