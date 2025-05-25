import * as ss from 'simple-statistics';

export function assessMLReadiness(records, columns, columnTypes, analysis) {
  const totalRows = records.length;
  const totalColumns = columns.length;
  
  // Initialize assessment
  const assessment = {
    overallScore: 0,
    featureQuality: [],
    dataQuality: {},
    recommendations: [],
    modelSuggestions: [],
    readinessLevel: 'low'
  };
  
  // Check minimum requirements
  if (totalRows < 50) {
    assessment.recommendations.push('Dataset too small for ML (< 50 rows)');
    assessment.readinessLevel = 'insufficient';
    return assessment;
  }
  
  // Assess data quality
  assessment.dataQuality = assessDataQuality(records, columns, columnTypes, analysis);
  
  // Assess feature quality
  assessment.featureQuality = assessFeatureQuality(records, columns, columnTypes, analysis);
  
  // Calculate overall score
  const scores = calculateReadinessScores(assessment, totalRows, totalColumns);
  assessment.overallScore = scores.overall;
  
  // Generate recommendations
  assessment.recommendations = generateMLRecommendations(assessment, analysis);
  
  // Suggest appropriate models
  assessment.modelSuggestions = suggestModels(columnTypes, analysis, assessment);
  
  // Determine readiness level
  assessment.readinessLevel = 
    assessment.overallScore >= 8 ? 'high' :
    assessment.overallScore >= 6 ? 'medium' :
    assessment.overallScore >= 4 ? 'low' :
    'insufficient';
  
  return assessment;
}

function assessDataQuality(records, columns, columnTypes, analysis) {
  const quality = {
    completeness: 0,
    consistency: 0,
    uniqueness: 0,
    validity: 0,
    issues: []
  };
  
  // Completeness
  quality.completeness = analysis.completeness || 0;
  if (quality.completeness < 0.8) {
    quality.issues.push(`Low data completeness (${(quality.completeness * 100).toFixed(1)}%)`);
  }
  
  // Consistency (based on outliers and patterns)
  const outlierRate = analysis.outlierRate || 0;
  quality.consistency = Math.max(0, 1 - outlierRate * 2);
  if (outlierRate > 0.1) {
    quality.issues.push(`High outlier rate (${(outlierRate * 100).toFixed(1)}%)`);
  }
  
  // Uniqueness (check for duplicate rows)
  const duplicateRate = (analysis.duplicateCount || 0) / records.length;
  quality.uniqueness = 1 - duplicateRate;
  if (duplicateRate > 0.05) {
    quality.issues.push(`${analysis.duplicateCount} duplicate rows found`);
  }
  
  // Validity (based on type detection confidence)
  let totalConfidence = 0;
  let confCount = 0;
  columns.forEach(col => {
    if (columnTypes[col].confidence) {
      totalConfidence += columnTypes[col].confidence;
      confCount++;
    }
  });
  quality.validity = confCount > 0 ? totalConfidence / confCount : 1;
  
  return quality;
}

function assessFeatureQuality(records, columns, columnTypes, analysis) {
  const features = [];
  
  columns.forEach(col => {
    const type = columnTypes[col];
    const values = records.map(r => r[col]);
    const nonNullValues = values.filter(v => v !== null && v !== undefined);
    
    const feature = {
      feature: col,
      type: type.type,
      quality: 'unknown',
      issues: [],
      recommendations: []
    };
    
    // Check completeness
    const completeness = nonNullValues.length / values.length;
    if (completeness < 0.5) {
      feature.quality = 'poor';
      feature.issues.push('High missing rate');
      feature.recommendations.push('Consider dropping or advanced imputation');
    }
    
    // Check variance
    if (['integer', 'float'].includes(type.type)) {
      const variance = ss.variance(nonNullValues.filter(v => typeof v === 'number'));
      const uniqueRatio = new Set(nonNullValues).size / nonNullValues.length;
      
      if (variance === 0 || uniqueRatio < 0.01) {
        feature.quality = 'poor';
        feature.issues.push('Zero or near-zero variance');
        feature.recommendations.push('Remove constant feature');
      } else if (uniqueRatio > 0.95 && type.type !== 'identifier') {
        feature.quality = 'good';
        feature.assessment = 'High cardinality numeric feature';
      } else {
        feature.quality = 'good';
      }
      
      // Check for skewness
      const stats = analysis.columns?.find(c => c.name === col)?.stats;
      if (stats && Math.abs(stats.skewness) > 2) {
        feature.issues.push('Highly skewed distribution');
        feature.recommendations.push('Apply log or Box-Cox transformation');
      }
    }
    
    // Check categorical features
    if (type.type === 'categorical') {
      const cardinality = type.categories.length;
      const sampleRatio = cardinality / records.length;
      
      if (cardinality === 1) {
        feature.quality = 'poor';
        feature.issues.push('Single value only');
        feature.recommendations.push('Remove constant feature');
      } else if (cardinality > 50 && sampleRatio > 0.5) {
        feature.quality = 'fair';
        feature.issues.push('High cardinality');
        feature.recommendations.push('Consider target encoding or embedding');
      } else if (cardinality <= 10) {
        feature.quality = 'excellent';
        feature.assessment = 'Low cardinality - suitable for one-hot encoding';
      } else {
        feature.quality = 'good';
      }
    }
    
    // Check for identifiers
    if (type.type === 'identifier') {
      feature.quality = 'exclude';
      feature.assessment = 'Identifier column - exclude from features';
    }
    
    // Check date features
    if (type.type === 'date') {
      feature.quality = 'transform';
      feature.assessment = 'Date feature - extract components';
      feature.recommendations.push('Extract year, month, day, day_of_week features');
    }
    
    features.push(feature);
  });
  
  return features;
}

function calculateReadinessScores(assessment, totalRows, totalColumns) {
  const scores = {
    dataSize: 0,
    dataQuality: 0,
    featureQuality: 0,
    overall: 0
  };
  
  // Data size score (0-10)
  if (totalRows >= 10000) scores.dataSize = 10;
  else if (totalRows >= 5000) scores.dataSize = 8;
  else if (totalRows >= 1000) scores.dataSize = 6;
  else if (totalRows >= 500) scores.dataSize = 4;
  else if (totalRows >= 100) scores.dataSize = 2;
  else scores.dataSize = 1;
  
  // Data quality score (0-10)
  const qualityMetrics = assessment.dataQuality;
  scores.dataQuality = (
    qualityMetrics.completeness * 2.5 +
    qualityMetrics.consistency * 2.5 +
    qualityMetrics.uniqueness * 2.5 +
    qualityMetrics.validity * 2.5
  );
  
  // Feature quality score (0-10)
  const goodFeatures = assessment.featureQuality.filter(f => 
    ['good', 'excellent'].includes(f.quality)
  ).length;
  const totalFeatures = assessment.featureQuality.filter(f => 
    f.quality !== 'exclude'
  ).length;
  
  if (totalFeatures > 0) {
    scores.featureQuality = (goodFeatures / totalFeatures) * 10;
  }
  
  // Overall score (weighted average)
  scores.overall = (
    scores.dataSize * 0.2 +
    scores.dataQuality * 0.4 +
    scores.featureQuality * 0.4
  );
  
  return scores;
}

function generateMLRecommendations(assessment, analysis) {
  const recommendations = [];
  
  // Data quality recommendations
  assessment.dataQuality.issues.forEach(issue => {
    if (issue.includes('completeness')) {
      recommendations.push('Handle missing values with imputation or removal');
    }
    if (issue.includes('outlier')) {
      recommendations.push('Address outliers with robust scaling or removal');
    }
    if (issue.includes('duplicate')) {
      recommendations.push('Remove duplicate rows before modeling');
    }
  });
  
  // Feature recommendations
  const transformFeatures = assessment.featureQuality.filter(f => 
    f.recommendations.length > 0
  );
  
  if (transformFeatures.length > 0) {
    recommendations.push(`Transform ${transformFeatures.length} features as suggested`);
  }
  
  // Scaling recommendations
  const numericFeatures = assessment.featureQuality.filter(f => 
    ['integer', 'float'].includes(f.type) && f.quality !== 'exclude'
  );
  
  if (numericFeatures.length > 0) {
    recommendations.push('Standardize or normalize numeric features');
  }
  
  // Encoding recommendations
  const categoricalFeatures = assessment.featureQuality.filter(f => 
    f.type === 'categorical' && f.quality !== 'exclude'
  );
  
  if (categoricalFeatures.length > 0) {
    const highCardinality = categoricalFeatures.filter(f => 
      f.issues.some(i => i.includes('High cardinality'))
    );
    
    if (highCardinality.length > 0) {
      recommendations.push('Use target encoding for high-cardinality categorical features');
    } else {
      recommendations.push('Apply one-hot encoding to categorical features');
    }
  }
  
  // Class imbalance check (if target detected)
  if (analysis.cartAnalysis && analysis.cartAnalysis.targetVariable) {
    recommendations.push('Check for class imbalance in target variable');
  }
  
  // Feature engineering
  if (assessment.overallScore < 7) {
    recommendations.push('Consider feature engineering to create interaction terms');
  }
  
  // Cross-validation
  recommendations.push('Use cross-validation to avoid overfitting');
  
  return recommendations;
}

function suggestModels(columnTypes, analysis, assessment) {
  const suggestions = [];
  const numericColumns = Object.keys(columnTypes).filter(col => 
    ['integer', 'float'].includes(columnTypes[col].type)
  );
  const categoricalColumns = Object.keys(columnTypes).filter(col => 
    columnTypes[col].type === 'categorical'
  );
  
  // Determine problem type
  let problemType = 'unknown';
  let targetInfo = null;
  
  if (analysis.regressionAnalysis && analysis.regressionAnalysis.targetVariable) {
    problemType = 'regression';
    targetInfo = analysis.regressionAnalysis.targetVariable;
  } else if (analysis.cartAnalysis && analysis.cartAnalysis.targetVariable) {
    const targetType = columnTypes[analysis.cartAnalysis.targetVariable];
    if (targetType && targetType.type === 'categorical') {
      problemType = 'classification';
      targetInfo = analysis.cartAnalysis.targetVariable;
    } else {
      problemType = 'regression';
      targetInfo = analysis.cartAnalysis.targetVariable;
    }
  }
  
  // Regression models
  if (problemType === 'regression') {
    suggestions.push({
      type: 'Linear Regression',
      reason: 'Good baseline model for regression tasks',
      requirements: 'Assumes linear relationships'
    });
    
    if (assessment.overallScore >= 6) {
      suggestions.push({
        type: 'Random Forest Regressor',
        reason: 'Handles non-linear relationships and interactions well',
        requirements: 'No scaling required, handles mixed data types'
      });
      
      suggestions.push({
        type: 'Gradient Boosting (XGBoost/LightGBM)',
        reason: 'Often best performance for structured data',
        requirements: 'Requires hyperparameter tuning'
      });
    }
    
    if (numericColumns.length > 10) {
      suggestions.push({
        type: 'Ridge/Lasso Regression',
        reason: 'Good for high-dimensional data with regularization',
        requirements: 'Requires feature scaling'
      });
    }
  }
  
  // Classification models
  if (problemType === 'classification') {
    suggestions.push({
      type: 'Logistic Regression',
      reason: 'Simple, interpretable baseline for classification',
      requirements: 'Works well for linearly separable data'
    });
    
    if (assessment.overallScore >= 6) {
      suggestions.push({
        type: 'Random Forest Classifier',
        reason: 'Robust to outliers, handles imbalanced data well',
        requirements: 'No scaling required'
      });
      
      suggestions.push({
        type: 'Gradient Boosting Classifier',
        reason: 'High accuracy for complex patterns',
        requirements: 'Careful tuning to avoid overfitting'
      });
    }
    
    if (numericColumns.length > 2) {
      suggestions.push({
        type: 'Support Vector Machine',
        reason: 'Effective in high-dimensional spaces',
        requirements: 'Requires feature scaling'
      });
    }
  }
  
  // Clustering (unsupervised)
  if (problemType === 'unknown' && numericColumns.length >= 2) {
    suggestions.push({
      type: 'K-Means Clustering',
      reason: 'Discover natural groupings in data',
      requirements: 'Requires scaled features and choosing k'
    });
    
    if (assessment.overallScore >= 7) {
      suggestions.push({
        type: 'DBSCAN',
        reason: 'Finds clusters of arbitrary shape',
        requirements: 'Good for outlier detection'
      });
    }
  }
  
  // Deep learning
  if (assessment.overallScore >= 8 && 
      Object.keys(columnTypes).length > 50 && 
      analysis.rowCount > 10000) {
    suggestions.push({
      type: 'Neural Network',
      reason: 'Can capture complex non-linear patterns',
      requirements: 'Requires large dataset and careful architecture design'
    });
  }
  
  return suggestions;
}