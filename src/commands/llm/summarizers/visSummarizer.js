/**
 * VIS (Visualization) Summary Extractor
 * Extracts top visualization recommendations and insights for LLM context
 */

export function extractVisSummary(visResults, options = {}) {
  const summary = {
    topVisualizations: [],
    dashboardLayout: null,
    antiPatterns: [],
    interactiveFeatures: []
  };

  // Extract top 3 visualization recommendations
  if (visResults.recommendations) {
    const topRecs = visResults.recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(rec => ({
        type: rec.chartType,
        purpose: rec.analyticalTask,
        dataCoverage: rec.columns,
        insight: rec.expectedInsight,
        implementation: formatImplementationNotes(rec)
      }));
    
    summary.topVisualizations = topRecs;
  }

  // Extract primary dashboard layout recommendation
  if (visResults.dashboardRecommendation) {
    const dash = visResults.dashboardRecommendation;
    summary.dashboardLayout = {
      primaryView: dash.mainVisualization,
      supportingViews: dash.supportingVisualizations.slice(0, 3),
      keyMetrics: dash.kpiCards || [],
      interactivity: dash.interactiveElements || [],
      flow: dash.analyticalFlow || 'overview-to-detail'
    };
  }

  // Extract critical anti-patterns to avoid
  if (visResults.antiPatterns) {
    const criticalAntiPatterns = visResults.antiPatterns
      .filter(ap => ap.severity === 'high' || ap.commonMistake)
      .slice(0, 3)
      .map(ap => ({
        pattern: ap.name,
        issue: ap.description,
        alternative: ap.recommendation,
        example: ap.example || null
      }));
    
    summary.antiPatterns = criticalAntiPatterns;
  }

  // Extract task-specific visualizations
  if (visResults.taskAnalysis) {
    const taskVis = condensetaskVisualizations(visResults.taskAnalysis);
    
    // Merge task-specific recommendations with general ones
    summary.topVisualizations = mergeVisualizations(
      summary.topVisualizations,
      taskVis
    );
  }

  // Extract accessibility and perceptual considerations
  if (visResults.perceptualAnalysis) {
    const perceptual = visResults.perceptualAnalysis;
    
    if (perceptual.colorPalette) {
      summary.colorGuidance = {
        palette: perceptual.colorPalette.name,
        type: perceptual.colorPalette.type,
        accessibility: perceptual.colorPalette.colorblindSafe ? 'Safe' : 'Review needed'
      };
    }
    
    if (perceptual.warnings && perceptual.warnings.length > 0) {
      summary.perceptualWarnings = perceptual.warnings.slice(0, 2);
    }
  }

  // Extract multivariate pattern visualizations
  if (visResults.multivariatePatterns) {
    const mvPatterns = visResults.multivariatePatterns
      .filter(pattern => pattern.strength > 0.7)
      .slice(0, 2)
      .map(pattern => ({
        type: getMultivariateVizType(pattern),
        purpose: `Explore ${pattern.type} relationship`,
        dataCoverage: pattern.variables,
        insight: pattern.interpretation,
        implementation: `Use ${pattern.technique} to reveal ${pattern.pattern}`
      }));
    
    summary.topVisualizations.push(...mvPatterns);
  }

  // Extract interactive features for exploration
  if (visResults.interactiveRecommendations) {
    summary.interactiveFeatures = visResults.interactiveRecommendations
      .filter(feature => feature.importance === 'high')
      .slice(0, 3)
      .map(feature => ({
        feature: feature.name,
        purpose: feature.purpose,
        userBenefit: feature.benefit
      }));
  }

  // Limit to top 3 visualizations after all sources
  summary.topVisualizations = summary.topVisualizations.slice(0, 3);

  return summary;
}

function formatImplementationNotes(recommendation) {
  const notes = [];
  
  // Chart type specific guidance
  switch (recommendation.chartType) {
    case 'time_series':
      notes.push('Include trend line and anomaly highlighting');
      break;
    case 'scatter':
      notes.push('Add regression line and confidence intervals');
      break;
    case 'heatmap':
      notes.push('Use diverging color scheme for correlations');
      break;
    case 'sankey':
      notes.push('Order nodes by flow volume for clarity');
      break;
    case 'treemap':
      notes.push('Use hierarchical coloring for categories');
      break;
  }
  
  // Data considerations
  if (recommendation.dataTransformation) {
    notes.push(recommendation.dataTransformation);
  }
  
  // Scale considerations
  if (recommendation.scaleType) {
    notes.push(`Use ${recommendation.scaleType} scale`);
  }
  
  return notes.join('. ');
}

function condensetaskVisualizations(taskAnalysis) {
  const taskVis = [];
  
  // Comparison tasks
  if (taskAnalysis.comparison && taskAnalysis.comparison.score > 0.8) {
    taskVis.push({
      type: taskAnalysis.comparison.bestChart,
      purpose: 'Compare values across categories',
      dataCoverage: taskAnalysis.comparison.dimensions,
      insight: 'Relative differences and rankings',
      implementation: 'Sort by value for easier comparison'
    });
  }
  
  // Trend analysis
  if (taskAnalysis.trend && taskAnalysis.trend.hasTimeSeries) {
    taskVis.push({
      type: 'time_series_with_forecast',
      purpose: 'Analyze trends and patterns over time',
      dataCoverage: [taskAnalysis.trend.timeColumn, ...taskAnalysis.trend.metrics],
      insight: taskAnalysis.trend.pattern || 'Temporal patterns',
      implementation: 'Include moving average and seasonality decomposition'
    });
  }
  
  // Distribution analysis
  if (taskAnalysis.distribution && taskAnalysis.distribution.interestingDists > 0) {
    taskVis.push({
      type: taskAnalysis.distribution.recommendedChart,
      purpose: 'Understand data distribution and outliers',
      dataCoverage: taskAnalysis.distribution.columns,
      insight: 'Skewness, modes, and extreme values',
      implementation: 'Add statistical overlays (mean, median, percentiles)'
    });
  }
  
  // Relationship exploration
  if (taskAnalysis.relationship && taskAnalysis.relationship.strongRelationships > 0) {
    taskVis.push({
      type: 'scatter_matrix',
      purpose: 'Explore multivariate relationships',
      dataCoverage: taskAnalysis.relationship.keyVariables,
      insight: 'Correlations and clustering patterns',
      implementation: 'Color by categories, size by importance metric'
    });
  }
  
  return taskVis;
}

function mergeVisualizations(primary, secondary) {
  const merged = [...primary];
  const existingTypes = new Set(primary.map(v => v.type));
  
  // Add non-duplicate visualizations from secondary
  secondary.forEach(vis => {
    if (!existingTypes.has(vis.type) && merged.length < 5) {
      merged.push(vis);
      existingTypes.add(vis.type);
    }
  });
  
  return merged;
}

function getMultivariateVizType(pattern) {
  switch (pattern.type) {
    case 'cluster':
      return 'scatter_plot_with_clustering';
    case 'correlation_network':
      return 'network_diagram';
    case 'dimensional_reduction':
      return 'pca_biplot';
    case 'hierarchical':
      return 'dendrogram';
    case 'flow':
      return 'sankey_diagram';
    default:
      return 'parallel_coordinates';
  }
}

export function assessVisualizationComplexity(data) {
  const factors = {
    columnCount: data.columns.length,
    rowCount: data.records.length,
    categoricalColumns: data.categoricalColumns || 0,
    numericColumns: data.numericColumns || 0,
    timeSeriesPresent: data.hasTimeSeries || false,
    hierarchicalData: data.hasHierarchy || false
  };
  
  let complexity = 'simple';
  
  if (factors.columnCount > 10 || factors.rowCount > 10000) {
    complexity = 'moderate';
  }
  
  if (factors.columnCount > 20 || factors.rowCount > 100000 || 
      (factors.hierarchicalData && factors.categoricalColumns > 3)) {
    complexity = 'complex';
  }
  
  return {
    level: complexity,
    factors,
    recommendation: getComplexityRecommendation(complexity, factors)
  };
}

function getComplexityRecommendation(complexity, factors) {
  switch (complexity) {
    case 'simple':
      return 'Standard visualizations will work well';
    case 'moderate':
      return 'Consider aggregation or sampling for performance';
    case 'complex':
      return 'Use specialized tools and progressive disclosure techniques';
    default:
      return 'Assess visualization requirements carefully';
  }
}