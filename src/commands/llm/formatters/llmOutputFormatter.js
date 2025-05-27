/**
 * LLM Output Formatter
 * Formats the synthesized analysis into the familiar LLM-ready context format
 */

import { createSection, createSubSection, formatTimestamp, formatNumber, formatPercentage, formatCurrency, bulletList } from '../../../utils/format.js';

export function formatLLMOutput(analysisResults, fileName) {
  let report = '';
  
  // Header
  report += createSection('LLM-READY CONTEXT',
    `Dataset: ${fileName}\nGenerated: ${formatTimestamp()}`);
  
  // Dataset summary
  report += formatDatasetSummary(analysisResults);
  
  // Key columns and characteristics
  report += formatKeyColumns(analysisResults);
  
  // Important patterns and insights (enhanced with synthesis)
  report += formatImportantPatterns(analysisResults);
  
  // Data quality notes (filtered from INT)
  report += formatDataQualityNotes(analysisResults);
  
  // Statistical summary (key metrics from EDA)
  report += formatStatisticalSummary(analysisResults);
  
  // Correlations discovered (significant only)
  report += formatCorrelations(analysisResults);
  
  // Visualization priorities (top 3 from VIS)
  report += formatVisualizationPriorities(analysisResults);
  
  // Engineering considerations (critical from ENG)
  report += formatEngineeringConsiderations(analysisResults);
  
  // Suggested analyses
  report += formatSuggestedAnalyses(analysisResults);
  
  // Questions this data could answer
  report += formatDataQuestions(analysisResults);
  
  // Technical notes
  report += formatTechnicalNotes(analysisResults);
  
  report += '\nEND OF CONTEXT\n';
  
  return report;
}

function formatDatasetSummary(results) {
  let summary = createSubSection('DATASET SUMMARY FOR AI ANALYSIS', '');
  
  const { originalAnalysis, summaries } = results;
  const edaSummary = summaries.edaSummary;
  
  // Basic dataset info
  const recordCount = originalAnalysis.recordCount || 0;
  const columnCount = originalAnalysis.columnCount || 0;
  const dataType = originalAnalysis.dataType || 'structured business data';
  
  summary += `I have a CSV dataset with ${recordCount.toLocaleString()} rows and ${columnCount} columns containing ${dataType}`;
  
  // Date range if available
  if (originalAnalysis.dateRange) {
    summary += `. The data spans from ${originalAnalysis.dateRange.start} to ${originalAnalysis.dateRange.end}`;
  }
  
  summary += '.\n';
  
  // Add quality context if critical
  const intSummary = summaries.intSummary;
  if (intSummary?.qualityScore && intSummary.qualityScore.score < 0.8) {
    summary += `\nIMPORTANT: Data quality is ${intSummary.qualityScore.grade} (${(intSummary.qualityScore.score * 100).toFixed(0)}%), which may affect analysis accuracy.\n`;
  }
  
  return summary;
}

function formatKeyColumns(results) {
  let section = createSubSection('KEY COLUMNS AND THEIR CHARACTERISTICS', '');
  
  const { originalAnalysis } = results;
  const columns = originalAnalysis.columns || [];
  const columnTypes = originalAnalysis.columnTypes || {};
  
  // Limit to most important columns
  const keyColumns = identifyKeyColumns(columns, columnTypes, results.summaries);
  
  keyColumns.forEach((column, idx) => {
    section += `\n${idx + 1}. ${column.name}: `;
    section += column.description;
    
    if (column.qualityIssue) {
      section += ` (⚠️ ${column.qualityIssue})`;
    }
  });
  
  section += '\n';
  
  return section;
}

function formatImportantPatterns(results) {
  let section = createSubSection('IMPORTANT PATTERNS AND INSIGHTS', '');
  
  const { keyFindings, synthesis } = results;
  
  if (!keyFindings || keyFindings.length === 0) {
    section += '\nNo significant patterns detected in the data.\n';
    return section;
  }
  
  // Format key findings with enhanced context
  keyFindings.forEach((finding, idx) => {
    section += `\n${idx + 1}. ${finding.title}: `;
    
    // Main finding
    section += finding.description;
    
    // Add impact if available
    if (finding.impact && finding.impact !== finding.description) {
      section += `, ${finding.impact}`;
    }
    
    // Add action if available
    if (finding.action) {
      section += `. ${finding.action}`;
    }
    
    // Add confidence indicator for uncertain findings
    if (finding.confidence < 0.8) {
      section += ' (moderate confidence)';
    }
    
    section += '\n';
  });
  
  // Add cross-analysis patterns if significant
  if (synthesis?.crossAnalysisPatterns && synthesis.crossAnalysisPatterns.length > 0) {
    const topPattern = synthesis.crossAnalysisPatterns[0];
    section += `\n${keyFindings.length + 1}. PATTERN: ${topPattern.pattern} - ${topPattern.description}\n`;
  }
  
  return section;
}

function formatDataQualityNotes(results) {
  const intSummary = results.summaries.intSummary;
  const notes = [];
  
  // Overall quality score
  if (intSummary?.qualityScore) {
    notes.push(`Overall quality: ${intSummary.qualityScore.grade} (${(intSummary.qualityScore.score * 100).toFixed(0)}%)`);
  }
  
  // Critical issues only
  if (intSummary?.criticalIssues) {
    const topIssues = intSummary.criticalIssues.slice(0, 2);
    topIssues.forEach(issue => {
      notes.push(`${issue.issue}${issue.fixAvailable ? ' (automated fix available)' : ''}`);
    });
  }
  
  // Validation failures
  if (intSummary?.validationFailures) {
    const criticalFailures = intSummary.validationFailures
      .filter(f => f.score < 0.7)
      .slice(0, 1);
    
    criticalFailures.forEach(failure => {
      notes.push(`Low ${failure.dimension}: ${failure.mainIssue}`);
    });
  }
  
  // Missing data from original analysis
  if (results.originalAnalysis?.qualityMetrics) {
    const metrics = results.originalAnalysis.qualityMetrics;
    if (metrics.missingDetails && metrics.missingDetails !== 'No missing values') {
      notes.push(`Missing values: ${metrics.missingDetails}`);
    }
  }
  
  return createSubSection('DATA QUALITY NOTES', bulletList(notes));
}

function formatStatisticalSummary(results) {
  let section = createSubSection('STATISTICAL SUMMARY', '');
  
  const edaSummary = results.summaries.edaSummary;
  const stats = [];
  
  // Key metrics from EDA summary
  if (edaSummary?.metrics) {
    Object.entries(edaSummary.metrics).forEach(([column, metrics]) => {
      if (metrics.total) {
        stats.push(`Total ${column}: ${formatValue(metrics.total, column)}`);
      }
      if (metrics.average) {
        stats.push(`Average ${column}: ${formatValue(metrics.average, column)}`);
      }
      if (metrics.growth) {
        stats.push(`${column} growth rate: ${formatPercentage(metrics.growth)}`);
      }
    });
  }
  
  // Add original summary stats if available
  if (results.originalAnalysis?.summaryStats) {
    results.originalAnalysis.summaryStats
      .filter(stat => !stats.some(s => s.includes(stat.split(':')[0])))
      .slice(0, 3)
      .forEach(stat => stats.push(stat));
  }
  
  stats.forEach(stat => {
    section += `- ${stat}\n`;
  });
  
  return section;
}

function formatCorrelations(results) {
  const edaSummary = results.summaries.edaSummary;
  
  if (!edaSummary?.correlations || edaSummary.correlations.length === 0) {
    return '';
  }
  
  let section = createSubSection('CORRELATIONS DISCOVERED', '');
  
  edaSummary.correlations.forEach(corr => {
    const strength = corr.strength > 0.8 ? 'Strong' : 'Moderate';
    section += `- ${strength} ${corr.direction}: ${corr.columns[0]} vs ${corr.columns[1]} (${formatNumber(corr.strength, 2)})`;
    
    if (corr.businessMeaning) {
      section += ` - ${corr.businessMeaning}`;
    }
    
    section += '\n';
  });
  
  return section;
}

function formatVisualizationPriorities(results) {
  const visSummary = results.summaries.visSummary;
  
  if (!visSummary?.topVisualizations || visSummary.topVisualizations.length === 0) {
    return '';
  }
  
  let section = createSubSection('VISUALIZATION PRIORITIES', '');
  
  visSummary.topVisualizations.forEach((viz, idx) => {
    section += `${idx + 1}. ${viz.type} for ${viz.purpose}`;
    
    if (viz.insight) {
      section += ` (${viz.insight})`;
    }
    
    section += '\n';
  });
  
  return section;
}

function formatEngineeringConsiderations(results) {
  const engSummary = results.summaries.engSummary;
  const considerations = [];
  
  // Schema recommendation
  if (engSummary?.schemaRecommendation) {
    considerations.push(`Schema: ${engSummary.schemaRecommendation.approach} approach recommended (${engSummary.schemaRecommendation.rationale})`);
  }
  
  // Performance considerations
  if (engSummary?.performanceConsiderations) {
    engSummary.performanceConsiderations.slice(0, 2).forEach(perf => {
      considerations.push(`${perf.aspect}: ${perf.recommendation}`);
    });
  }
  
  // Critical ETL requirements
  if (engSummary?.etlRequirements && engSummary.etlRequirements.length > 0) {
    const critical = engSummary.etlRequirements[0];
    considerations.push(`ETL: ${critical.requirement} - ${critical.specifics}`);
  }
  
  if (considerations.length === 0) {
    return '';
  }
  
  return createSubSection('ENGINEERING CONSIDERATIONS', bulletList(considerations));
}

function formatSuggestedAnalyses(results) {
  let section = createSubSection('SUGGESTED ANALYSES FOR THIS DATA', '');
  
  const suggestions = [];
  
  // From unified recommendations
  if (results.synthesis?.unifiedRecommendations) {
    results.synthesis.unifiedRecommendations
      .filter(rec => rec.category === 'Analysis')
      .forEach(rec => {
        suggestions.push(rec.action);
      });
  }
  
  // From original analysis suggestions
  if (results.originalAnalysis?.analysisSuggestions && Array.isArray(results.originalAnalysis.analysisSuggestions)) {
    results.originalAnalysis.analysisSuggestions
      .filter(sugg => sugg && !suggestions.some(s => s.includes(sugg.split(' ')[0])))
      .slice(0, 5 - suggestions.length)
      .forEach(sugg => suggestions.push(sugg));
  }
  
  // Default suggestions based on data characteristics
  if (suggestions.length < 3) {
    const defaults = generateDefaultSuggestions(results);
    if (defaults && Array.isArray(defaults)) {
      defaults
        .filter(sugg => sugg && !suggestions.includes(sugg))
        .slice(0, 5 - suggestions.length)
        .forEach(sugg => suggestions.push(sugg));
    }
  }
  
  suggestions.forEach((suggestion, idx) => {
    section += `\n${idx + 1}. ${suggestion}`;
  });
  
  section += '\n';
  
  return section;
}

function formatDataQuestions(results) {
  let section = createSubSection('QUESTIONS THIS DATA COULD ANSWER', '');
  
  const questions = results.originalAnalysis?.dataQuestions || [];
  
  // Add synthesis-driven questions
  if (results.synthesis?.crossAnalysisPatterns) {
    results.synthesis.crossAnalysisPatterns.forEach(pattern => {
      const question = patternToQuestion(pattern);
      if (question && !questions.includes(question)) {
        questions.unshift(question);
      }
    });
  }
  
  questions.slice(0, 8).forEach(question => {
    section += `- ${question}\n`;
  });
  
  return section;
}

function formatTechnicalNotes(results) {
  const notes = [];
  
  // From EDA patterns
  const edaSummary = results.summaries.edaSummary;
  if (edaSummary?.patterns) {
    edaSummary.patterns
      .filter(p => p.type === 'distribution' && p.impact)
      .forEach(p => notes.push(p.impact));
  }
  
  // From engineering
  const engSummary = results.summaries.engSummary;
  if (engSummary?.performanceConsiderations) {
    engSummary.performanceConsiderations
      .filter(c => c.aspect === 'Data Volume')
      .forEach(c => notes.push(c.issue));
  }
  
  // From original technical notes
  if (results.originalAnalysis?.technicalNotes) {
    results.originalAnalysis.technicalNotes
      .filter(note => !notes.some(n => n.includes(note.split(' ')[0])))
      .slice(0, 3)
      .forEach(note => notes.push(note));
  }
  
  if (notes.length === 0) {
    return '';
  }
  
  return createSubSection('TECHNICAL NOTES FOR ANALYSIS', bulletList(notes));
}

// Helper functions

function identifyKeyColumns(columns, columnTypes, summaries) {
  const keyColumns = [];
  const MAX_COLUMNS = 10;
  
  // Priority 1: Business metrics
  const businessKeywords = ['amount', 'revenue', 'price', 'cost', 'profit', 'total', 'value'];
  const businessColumns = columns.filter(col => 
    businessKeywords.some(keyword => col.toLowerCase().includes(keyword))
  );
  
  // Priority 2: Key dimensions
  const dimensionKeywords = ['customer', 'product', 'date', 'category', 'region', 'segment'];
  const dimensionColumns = columns.filter(col => 
    dimensionKeywords.some(keyword => col.toLowerCase().includes(keyword))
  );
  
  // Priority 3: Columns with quality issues
  const qualityIssueColumns = [];
  if (summaries.intSummary?.criticalIssues) {
    summaries.intSummary.criticalIssues.forEach(issue => {
      if (issue.column && !qualityIssueColumns.includes(issue.column)) {
        qualityIssueColumns.push({
          name: issue.column,
          issue: issue.issue
        });
      }
    });
  }
  
  // Combine and format
  [...businessColumns, ...dimensionColumns].forEach(col => {
    if (keyColumns.length >= MAX_COLUMNS) return;
    
    const type = columnTypes[col];
    const qualityIssue = qualityIssueColumns.find(q => q.name === col);
    
    keyColumns.push({
      name: col,
      description: formatColumnDescription(col, type),
      qualityIssue: qualityIssue?.issue
    });
  });
  
  // Fill with other columns if needed
  columns.forEach(col => {
    if (keyColumns.length >= MAX_COLUMNS) return;
    if (keyColumns.some(kc => kc.name === col)) return;
    
    keyColumns.push({
      name: col,
      description: formatColumnDescription(col, columnTypes[col])
    });
  });
  
  return keyColumns.slice(0, MAX_COLUMNS);
}

function formatColumnDescription(column, type) {
  if (!type) return 'Unknown type';
  
  if (type.type === 'identifier') {
    const unique = type.uniqueCount || 'unknown';
    return `Unique identifier (${unique} values)`;
  } else if (type.type === 'integer' || type.type === 'float') {
    const purpose = inferColumnPurpose(column);
    if (type.stats) {
      return `${purpose} (range: ${formatValue(type.stats.min, column)} to ${formatValue(type.stats.max, column)})`;
    }
    return purpose;
  } else if (type.type === 'categorical') {
    const categories = type.categories ? type.categories.length : 'unknown';
    return `${categories} categories`;
  } else if (type.type === 'date') {
    return 'Date field';
  } else {
    return type.type.charAt(0).toUpperCase() + type.type.slice(1);
  }
}

function inferColumnPurpose(column) {
  const col = column.toLowerCase();
  
  if (col.includes('amount') || col.includes('total')) return 'Transaction amount';
  if (col.includes('price')) return 'Price information';
  if (col.includes('quantity') || col.includes('qty')) return 'Quantity/count';
  if (col.includes('age')) return 'Age data';
  if (col.includes('score') || col.includes('rating')) return 'Score/rating';
  if (col.includes('discount')) return 'Discount percentage/amount';
  if (col.includes('id')) return 'Identifier';
  
  return 'Numeric field';
}

function formatValue(value, column) {
  if (column.toLowerCase().includes('amount') || 
      column.toLowerCase().includes('price') || 
      column.toLowerCase().includes('total') ||
      column.toLowerCase().includes('revenue') ||
      column.toLowerCase().includes('cost')) {
    return formatCurrency(value);
  }
  
  if (column.toLowerCase().includes('percent') || column.toLowerCase().includes('rate')) {
    return formatPercentage(value / 100);
  }
  
  return formatNumber(value);
}

function generateDefaultSuggestions(results) {
  const suggestions = [];
  const { summaries } = results;
  
  // Based on data characteristics
  if (summaries.edaSummary?.correlations && summaries.edaSummary.correlations.length > 0) {
    suggestions.push('Predictive modeling based on discovered correlations');
  }
  
  if (summaries.edaSummary?.patterns?.some(p => p.type === 'seasonality')) {
    suggestions.push('Time series forecasting with seasonal decomposition');
  }
  
  if (summaries.intSummary?.criticalIssues?.length > 3) {
    suggestions.push('Data quality improvement pipeline implementation');
  }
  
  if (summaries.visSummary?.dashboardLayout) {
    suggestions.push('Interactive dashboard development for monitoring');
  }
  
  // Generic valuable analyses
  suggestions.push(
    'Customer segmentation analysis',
    'Anomaly detection for fraud/errors',
    'Cohort analysis for retention',
    'A/B testing framework setup'
  );
  
  return suggestions;
}

function patternToQuestion(pattern) {
  switch (pattern.pattern) {
    case 'Growth-Quality Trade-off':
      return 'How is rapid growth affecting data quality and reliability?';
    case 'Segmentation Opportunity':
      return 'What distinct customer segments exist and how do they differ?';
    case 'Complex Relationship Network':
      return 'How do entity relationships impact business operations?';
    default:
      return null;
  }
}