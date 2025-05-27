/**
 * EDA Summary Extractor
 * Extracts key findings from comprehensive EDA analysis for LLM context
 */

export function extractEdaSummary(edaResults, options = {}) {
  const summary = {
    keyFindings: [],
    criticalInsights: [],
    metrics: {},
    patterns: [],
    correlations: []
  };

  // Extract top statistical insights
  if (edaResults.statisticalInsights && Array.isArray(edaResults.statisticalInsights) && edaResults.statisticalInsights.length > 0) {
    const topInsights = edaResults.statisticalInsights
      .filter(insight => insight && (insight.importance === 'high' || insight.significance > 0.8))
      .slice(0, 3);
    
    summary.keyFindings.push(...topInsights.map(insight => ({
      type: 'statistical',
      finding: insight.finding,
      impact: insight.businessImpact || 'Data characteristic identified',
      confidence: insight.confidence || 0.9
    })));
  }

  // Extract critical data quality issues
  if (edaResults.dataQuality) {
    const criticalQuality = Object.entries(edaResults.dataQuality)
      .filter(([metric, value]) => {
        if (metric === 'completeness' && value < 0.8) return true;
        if (metric === 'duplicateRows' && value > 0.05) return true;
        if (metric === 'outlierPercentage' && value > 0.1) return true;
        return false;
      })
      .map(([metric, value]) => ({
        type: 'quality',
        finding: formatQualityIssue(metric, value),
        impact: getQualityImpact(metric, value),
        confidence: 1.0
      }));
    
    summary.criticalInsights.push(...criticalQuality);
  }

  // Extract significant correlations
  if (edaResults.correlations && Array.isArray(edaResults.correlations) && edaResults.correlations.length > 0) {
    const significantCorrelations = edaResults.correlations
      .filter(corr => corr && corr.value && Math.abs(corr.value) > 0.5)
      .sort((a, b) => Math.abs(b.value || 0) - Math.abs(a.value || 0))
      .slice(0, 3)
      .map(corr => ({
        columns: [corr.column1, corr.column2],
        strength: Math.abs(corr.value),
        direction: corr.value > 0 ? 'positive' : 'negative',
        businessMeaning: inferCorrelationMeaning(corr)
      }));
    
    summary.correlations = significantCorrelations;
  }

  // Extract distribution patterns
  if (edaResults.distributions && Array.isArray(edaResults.distributions) && edaResults.distributions.length > 0) {
    const notableDistributions = edaResults.distributions
      .filter(dist => dist && (dist.skewness > 2 || dist.kurtosis > 7 || dist.bimodal))
      .slice(0, 3)
      .map(dist => ({
        column: dist.column,
        pattern: describeDistribution(dist),
        recommendation: getDistributionRecommendation(dist)
      }));
    
    summary.patterns.push(...notableDistributions.map(dist => ({
      type: 'distribution',
      finding: dist.pattern,
      impact: dist.recommendation,
      confidence: 0.95
    })));
  }

  // Extract time series patterns
  if (edaResults.timeSeries) {
    const timePatterns = [];
    
    if (edaResults.timeSeries.trend) {
      timePatterns.push({
        type: 'trend',
        finding: `${edaResults.timeSeries.trend.direction} trend detected with ${edaResults.timeSeries.trend.strength} strength`,
        impact: edaResults.timeSeries.trend.growthRate ? 
          `${(edaResults.timeSeries.trend.growthRate * 100).toFixed(1)}% growth rate` : 
          'Systematic change over time',
        confidence: edaResults.timeSeries.trend.confidence || 0.85
      });
    }
    
    if (edaResults.timeSeries.seasonality) {
      timePatterns.push({
        type: 'seasonality',
        finding: `${edaResults.timeSeries.seasonality.type} seasonality with peak in ${edaResults.timeSeries.seasonality.peak}`,
        impact: `${edaResults.timeSeries.seasonality.amplitude}% variation from baseline`,
        confidence: edaResults.timeSeries.seasonality.confidence || 0.9
      });
    }
    
    summary.patterns.push(...timePatterns);
  }

  // Extract key metrics for summary statistics
  if (edaResults.summaryStats) {
    // Only include the most business-relevant metrics
    const relevantColumns = identifyBusinessMetrics(edaResults.columns || []);
    
    relevantColumns.forEach(col => {
      if (edaResults.summaryStats[col]) {
        const stats = edaResults.summaryStats[col];
        summary.metrics[col] = {
          total: stats.sum,
          average: stats.mean,
          median: stats.median,
          growth: stats.growthRate || null
        };
      }
    });
  }

  // ML readiness summary
  if (edaResults.mlReadiness) {
    if (edaResults.mlReadiness.overallScore < 0.7) {
      summary.criticalInsights.push({
        type: 'ml_readiness',
        finding: `Low ML readiness score: ${(edaResults.mlReadiness.overallScore * 100).toFixed(0)}%`,
        impact: edaResults.mlReadiness.majorIssues ? edaResults.mlReadiness.majorIssues.join(', ') : 'Data preparation needed',
        confidence: 0.95
      });
    }
  }

  return summary;
}

function formatQualityIssue(metric, value) {
  switch (metric) {
    case 'completeness':
      return `Only ${(value * 100).toFixed(1)}% data completeness`;
    case 'duplicateRows':
      return `${(value * 100).toFixed(1)}% duplicate records detected`;
    case 'outlierPercentage':
      return `${(value * 100).toFixed(1)}% outliers found in numeric data`;
    default:
      return `${metric}: ${value}`;
  }
}

function getQualityImpact(metric, value) {
  switch (metric) {
    case 'completeness':
      return 'May affect analysis accuracy and model performance';
    case 'duplicateRows':
      return 'Inflated metrics and biased analysis results';
    case 'outlierPercentage':
      return 'Potential data quality issues or genuine anomalies to investigate';
    default:
      return 'Data quality concern';
  }
}

function inferCorrelationMeaning(correlation) {
  const col1 = correlation.column1.toLowerCase();
  const col2 = correlation.column2.toLowerCase();
  const strength = Math.abs(correlation.value);
  
  // Price/revenue correlations
  if ((col1.includes('price') && col2.includes('quantity')) ||
      (col2.includes('price') && col1.includes('quantity'))) {
    return correlation.value < 0 ? 
      'Price elasticity detected - higher prices reduce demand' :
      'Unusual positive price-quantity relationship';
  }
  
  // Customer behavior
  if ((col1.includes('age') && col2.includes('spend')) ||
      (col2.includes('age') && col1.includes('spend'))) {
    return correlation.value > 0 ?
      'Older customers tend to spend more' :
      'Younger customers are higher spenders';
  }
  
  // Time-based correlations
  if (col1.includes('time') || col2.includes('time') || 
      col1.includes('duration') || col2.includes('duration')) {
    return 'Time-dependent relationship detected';
  }
  
  // Generic interpretation
  if (strength > 0.8) {
    return 'Strong predictive relationship';
  } else if (strength > 0.6) {
    return 'Moderate relationship worth investigating';
  } else {
    return 'Meaningful correlation detected';
  }
}

function describeDistribution(dist) {
  const descriptions = [];
  
  if (dist.bimodal) {
    descriptions.push('Bimodal distribution suggesting two distinct groups');
  }
  
  if (dist.skewness > 2) {
    descriptions.push(`Heavy right skew (${dist.skewness.toFixed(1)})`);
  } else if (dist.skewness < -2) {
    descriptions.push(`Heavy left skew (${dist.skewness.toFixed(1)})`);
  }
  
  if (dist.kurtosis > 7) {
    descriptions.push('Extreme outliers present');
  }
  
  if (dist.zeroinflated) {
    descriptions.push(`${(dist.zeroPercentage * 100).toFixed(0)}% zero values`);
  }
  
  return descriptions.join(', ') || 'Non-normal distribution';
}

function getDistributionRecommendation(dist) {
  if (dist.bimodal) {
    return 'Consider segmentation analysis to identify groups';
  }
  
  if (Math.abs(dist.skewness) > 2) {
    return 'Log transformation recommended for modeling';
  }
  
  if (dist.kurtosis > 7) {
    return 'Outlier treatment required before analysis';
  }
  
  if (dist.zeroinflated) {
    return 'Consider zero-inflated models or separate zero analysis';
  }
  
  return 'May require transformation for parametric analysis';
}

function identifyBusinessMetrics(columns) {
  if (!columns || !Array.isArray(columns)) return [];
  
  const businessKeywords = [
    'revenue', 'sales', 'amount', 'total', 'price',
    'cost', 'profit', 'margin', 'quantity', 'count',
    'value', 'payment', 'balance', 'spend'
  ];
  
  return columns.filter(col => {
    if (!col || typeof col !== 'string') return false;
    const colLower = col.toLowerCase();
    return businessKeywords.some(keyword => colLower.includes(keyword));
  }).slice(0, 5); // Limit to top 5 business metrics
}