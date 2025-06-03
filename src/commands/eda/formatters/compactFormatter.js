/**
 * Compact Output Formatter for Terminal Viewing
 * Provides condensed analysis output optimized for terminal display
 */

import chalk from 'chalk';

export function formatCompactEDAReport(analysis) {
  const sections = [];
  
  // Header
  sections.push(formatCompactHeader(analysis));
  
  // Quick overview
  sections.push(formatQuickOverview(analysis));
  
  // Key insights
  sections.push(formatKeyInsights(analysis));
  
  // Column summary
  sections.push(formatColumnSummary(analysis));
  
  // Data quality score
  sections.push(formatQualityScore(analysis));
  
  // Actions recommended
  sections.push(formatRecommendedActions(analysis));
  
  return sections.filter(section => section).join('\n\n');
}

function formatCompactHeader(analysis) {
  const title = chalk.bold.blue('📊 DataPilot Analysis Summary');
  const subtitle = chalk.gray(`${analysis.fileName} • ${analysis.rowCount.toLocaleString()} rows • ${analysis.columnCount} columns`);
  
  if (analysis.sampledRows) {
    const sampleNote = chalk.yellow(`(Analyzed ${analysis.sampledRows.toLocaleString()} sampled rows)`);
    return `${title}\n${subtitle} ${sampleNote}`;
  }
  
  return `${title}\n${subtitle}`;
}

function formatQuickOverview(analysis) {
  const items = [];
  
  // Data completeness
  const completeness = (analysis.completeness * 100).toFixed(1);
  const completenessColor = analysis.completeness > 0.9 ? 'green' : 
                           analysis.completeness > 0.7 ? 'yellow' : 'red';
  items.push(`${chalk[completenessColor]('●')} ${completeness}% complete`);
  
  // Duplicates
  if (analysis.duplicateCount > 0) {
    const dupRate = (analysis.duplicateCount / analysis.rowCount * 100).toFixed(1);
    items.push(`${chalk.yellow('●')} ${dupRate}% duplicates`);
  } else {
    items.push(`${chalk.green('●')} No duplicates`);
  }
  
  // Data types
  items.push(`${chalk.blue('●')} ${analysis.numericColumnCount} numeric, ${analysis.categoricalColumnCount} categorical`);
  
  // ML readiness
  if (analysis.mlReadiness && analysis.mlReadiness.overall) {
    const mlScore = (analysis.mlReadiness.overall * 10).toFixed(1);
    const mlColor = analysis.mlReadiness.overall > 0.7 ? 'green' : 
                   analysis.mlReadiness.overall > 0.5 ? 'yellow' : 'red';
    items.push(`${chalk[mlColor]('●')} ${mlScore}/10 ML ready`);
  }
  
  return chalk.bold('Quick Overview:\n') + items.map(item => `  ${item}`).join('\n');
}

function formatKeyInsights(analysis) {
  const insights = analysis.insights || [];
  if (insights.length === 0) return null;
  
  const topInsights = insights.slice(0, 3);
  const items = topInsights.map((insight, idx) => `  ${idx + 1}. ${insight}`);
  
  return chalk.bold('Key Insights:\n') + items.join('\n');
}

function formatColumnSummary(analysis) {
  if (!analysis.columns || analysis.columns.length === 0) return null;
  
  const header = chalk.bold('Column Summary:');
  const maxDisplay = 8; // Show max 8 columns in compact mode
  const columnsToShow = analysis.columns.slice(0, maxDisplay);
  
  const columnLines = columnsToShow.map(col => {
    const name = col.name.length > 15 ? col.name.substring(0, 12) + '...' : col.name;
    const type = col.type;
    const completeness = ((col.nonNullRatio || 0) * 100).toFixed(0);
    
    let typeColor = 'white';
    if (type === 'integer' || type === 'float') typeColor = 'cyan';
    else if (type === 'categorical') typeColor = 'yellow';
    else if (type === 'date') typeColor = 'magenta';
    
    const typeDisplay = chalk[typeColor](type.substring(0, 3).toUpperCase());
    const completenessDisplay = completeness === '100' ? chalk.green('✓') : chalk.yellow(`${completeness}%`);
    
    return `  ${name.padEnd(16)} ${typeDisplay} ${completenessDisplay}`;
  });
  
  if (analysis.columns.length > maxDisplay) {
    const remaining = analysis.columns.length - maxDisplay;
    columnLines.push(chalk.gray(`  ... and ${remaining} more columns`));
  }
  
  return header + '\n' + columnLines.join('\n');
}

function formatQualityScore(analysis) {
  const score = analysis.consistencyScore || 0;
  let scoreColor = 'green';
  let grade = 'A+';
  
  if (score < 6) {
    scoreColor = 'red';
    grade = 'F';
  } else if (score < 7) {
    scoreColor = 'yellow';
    grade = 'D';
  } else if (score < 8) {
    scoreColor = 'yellow';
    grade = 'C';
  } else if (score < 9) {
    scoreColor = 'cyan';
    grade = 'B';
  } else if (score < 10) {
    scoreColor = 'green';
    grade = 'A';
  }
  
  const header = chalk.bold('Data Quality:');
  const scoreDisplay = chalk[scoreColor](`${score}/10 (${grade})`);
  
  const issues = [];
  if (analysis.completeness < 0.9) issues.push('Missing data');
  if (analysis.duplicateCount > 0) issues.push('Duplicates');
  if (analysis.outlierRate > 0.1) issues.push('Many outliers');
  if (analysis.highMissingColumns > 0) issues.push('Incomplete columns');
  
  const issuesText = issues.length > 0 ? 
    chalk.yellow(`Issues: ${issues.join(', ')}`) : 
    chalk.green('No major issues detected');
  
  return `${header} ${scoreDisplay}\n  ${issuesText}`;
}

function formatRecommendedActions(analysis) {
  const actions = [];
  
  // Based on data quality
  if (analysis.completeness < 0.8) {
    actions.push('Consider data imputation for missing values');
  }
  
  if (analysis.duplicateCount > analysis.rowCount * 0.05) {
    actions.push('Review and remove duplicate records');
  }
  
  // Based on ML readiness
  if (analysis.mlReadiness && analysis.mlReadiness.overall < 0.6) {
    actions.push('Prepare data for machine learning');
  }
  
  // Based on analysis results
  if (analysis.cartAnalysis && analysis.cartAnalysis.applicable) {
    actions.push('Explore decision tree insights for business rules');
  }
  
  if (analysis.correlationAnalysis && analysis.correlationAnalysis.strongCorrelations > 3) {
    actions.push('Investigate strong correlations between variables');
  }
  
  // Based on patterns
  if (analysis.patterns && analysis.patterns.anomalies && analysis.patterns.anomalies.length > 0) {
    actions.push('Review detected anomalies');
  }
  
  if (actions.length === 0) {
    actions.push('Data looks good - ready for analysis!');
  }
  
  const topActions = actions.slice(0, 3);
  const header = chalk.bold('Recommended Actions:');
  const actionItems = topActions.map((action, idx) => `  ${idx + 1}. ${action}`);
  
  return header + '\n' + actionItems.join('\n');
}

// Compact format for specific analysis components
export function formatCompactDistributions(distributionAnalysis) {
  if (!distributionAnalysis) return null;
  
  const distributions = Object.entries(distributionAnalysis);
  if (distributions.length === 0) return null;
  
  const normalCount = distributions.filter(([_, dist]) => 
    dist.tests && dist.tests.normality && dist.tests.normality.isNormal
  ).length;
  
  const summary = `${normalCount}/${distributions.length} columns normally distributed`;
  return chalk.bold('Distributions: ') + summary;
}

export function formatCompactCorrelations(correlationAnalysis) {
  if (!correlationAnalysis || !correlationAnalysis.correlations) return null;
  
  const correlations = correlationAnalysis.correlations;
  const strongCorrs = correlations.filter(corr => Math.abs(corr.correlation) > 0.7);
  
  if (strongCorrs.length === 0) return chalk.bold('Correlations: ') + 'No strong correlations found';
  
  const summary = `${strongCorrs.length} strong correlation${strongCorrs.length > 1 ? 's' : ''} detected`;
  return chalk.bold('Correlations: ') + summary;
}

export function formatCompactOutliers(outlierAnalysis) {
  if (!outlierAnalysis) return null;
  
  const columns = Object.keys(outlierAnalysis);
  let totalOutliers = 0;
  
  columns.forEach(col => {
    const result = outlierAnalysis[col];
    if (result.aggregated) {
      totalOutliers += result.aggregated.length;
    }
  });
  
  if (totalOutliers === 0) return chalk.bold('Outliers: ') + 'None detected';
  
  const summary = `${totalOutliers} outlier${totalOutliers > 1 ? 's' : ''} across ${columns.length} columns`;
  return chalk.bold('Outliers: ') + summary;
}