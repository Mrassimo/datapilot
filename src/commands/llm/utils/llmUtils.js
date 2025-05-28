/**
 * LLM Utility Functions
 * Extracted from llm.js to avoid circular dependencies
 */

import { calculateStats, calculateCorrelation, analyzeDistribution } from '../../../utils/stats.js';
import { formatTimestamp, formatNumber, formatPercentage, formatCurrency } from '../../../utils/format.js';

export function getDateRange(records, dateColumns) {
  if (dateColumns.length === 0) return null;
  
  const dates = records
    .map(r => r[dateColumns[0]])
    .filter(d => d instanceof Date)
    .sort((a, b) => a - b);
  
  if (dates.length === 0) return null;
  
  return {
    start: formatDate(dates[0]),
    end: formatDate(dates[dates.length - 1])
  };
}

function formatDate(date) {
  if (!(date instanceof Date)) return 'Invalid date';
  const months = ['January', 'February', 'March', 'April', 'May', 'June',
                  'July', 'August', 'September', 'October', 'November', 'December'];
  return `${months[date.getMonth()]} ${date.getFullYear()}`;
}

export function inferDataType(columns, columnTypes) {
  const columnNames = columns.map(c => c.toLowerCase()).join(' ');
  
  // Medical/Healthcare domain
  if (columnNames.includes('patient') || columnNames.includes('diagnosis') || columnNames.includes('treatment') || 
      columnNames.includes('medical') || columnNames.includes('health') || columnNames.includes('hospital') ||
      columnNames.includes('doctor') || columnNames.includes('medication') || columnNames.includes('symptom') ||
      columnNames.includes('diabetes') || columnNames.includes('glucose') || columnNames.includes('blood') ||
      columnNames.includes('pressure') || columnNames.includes('cholesterol') || columnNames.includes('bmi')) {
    return 'medical/healthcare data';
  }
  
  // Scientific/Research domain
  if (columnNames.includes('experiment') || columnNames.includes('measurement') || columnNames.includes('sample') ||
      columnNames.includes('trial') || columnNames.includes('research') || columnNames.includes('lab') ||
      columnNames.includes('test') && columnNames.includes('result')) {
    return 'scientific/research data';
  }
  
  // Education domain
  if (columnNames.includes('student') || columnNames.includes('grade') || columnNames.includes('course') ||
      columnNames.includes('school') || columnNames.includes('teacher') || columnNames.includes('exam')) {
    return 'educational data';
  }
  
  // Environmental/Climate domain
  if (columnNames.includes('temperature') || columnNames.includes('climate') || columnNames.includes('weather') ||
      columnNames.includes('pollution') || columnNames.includes('emission') || columnNames.includes('environment')) {
    return 'environmental data';
  }
  
  // Manufacturing/Production domain
  if (columnNames.includes('production') || columnNames.includes('manufacturing') || columnNames.includes('assembly') ||
      columnNames.includes('defect') || columnNames.includes('quality') && columnNames.includes('control')) {
    return 'manufacturing/production data';
  }
  
  // Transportation/Logistics domain
  if (columnNames.includes('shipment') || columnNames.includes('delivery') || columnNames.includes('route') ||
      columnNames.includes('vehicle') || columnNames.includes('transport') || columnNames.includes('logistics')) {
    return 'transportation/logistics data';
  }
  
  // Business/Sales domains (moved to later priority)
  if (columnNames.includes('transaction') || columnNames.includes('order') || columnNames.includes('sale')) {
    return 'sales transaction data';
  }
  if (columnNames.includes('customer') && columnNames.includes('purchase')) {
    return 'customer purchase data';
  }
  if (columnNames.includes('product') && columnNames.includes('inventory')) {
    return 'product inventory data';
  }
  if (columnNames.includes('user') || columnNames.includes('account')) {
    return 'user account data';
  }
  if (columnNames.includes('employee') || columnNames.includes('staff')) {
    return 'employee/HR data';
  }
  if (columnNames.includes('revenue') || columnNames.includes('profit')) {
    return 'financial data';
  }
  
  // Look at column types
  const hasTransactionLikeData = columns.some(c => 
    columnTypes[c] && columnTypes[c].type === 'identifier' && columns.some(c2 => columnTypes[c2] && ['float', 'integer'].includes(columnTypes[c2].type))
  );
  
  if (hasTransactionLikeData) {
    return 'transactional data';
  }
  
  return 'general structured data';
}

export function analyzeSeasonality(records, dateColumn, columns, columnTypes) {
  const numericColumns = columns.filter(c => columnTypes[c] && ['integer', 'float'].includes(columnTypes[c].type));
  if (numericColumns.length === 0) return null;
  
  const monthlyData = {};
  records.forEach(record => {
    const date = record[dateColumn];
    if (date instanceof Date) {
      const month = date.getMonth();
      if (!monthlyData[month]) monthlyData[month] = [];
      
      numericColumns.forEach(col => {
        if (typeof record[col] === 'number') {
          monthlyData[month].push(record[col]);
        }
      });
    }
  });
  
  if (Object.keys(monthlyData).length < 6) return null;
  
  const monthlyAverages = Object.entries(monthlyData)
    .map(([month, values]) => ({
      month: parseInt(month),
      avg: values.reduce((a, b) => a + b, 0) / values.length
    }));
  
  const overallAvg = monthlyAverages.reduce((a, b) => a + b.avg, 0) / monthlyAverages.length;
  const peak = monthlyAverages.reduce((a, b) => a.avg > b.avg ? a : b);
  
  if (peak.avg > overallAvg * 1.2) {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                        'July', 'August', 'September', 'October', 'November', 'December'];
    return `Strong seasonal pattern with ${monthNames[peak.month]} showing ${formatPercentage((peak.avg / overallAvg) - 1)} above average`;
  }
  
  return null;
}

export function analyzeSegments(records, columns, columnTypes) {
  const segmentColumns = columns.filter(c => 
    c.toLowerCase().includes('segment') || 
    c.toLowerCase().includes('tier') ||
    c.toLowerCase().includes('type') ||
    c.toLowerCase().includes('category') ||
    c.toLowerCase().includes('group') ||
    c.toLowerCase().includes('class')
  ).filter(c => columnTypes[c] && columnTypes[c].type === 'categorical');
  
  if (segmentColumns.length === 0) return null;
  
  const valueColumns = columns.filter(c => 
    (c.toLowerCase().includes('amount') || c.toLowerCase().includes('value') || 
     c.toLowerCase().includes('score') || c.toLowerCase().includes('count') ||
     c.toLowerCase().includes('result') || c.toLowerCase().includes('outcome')) &&
    columnTypes[c] && ['integer', 'float'].includes(columnTypes[c].type)
  );
  
  if (valueColumns.length === 0) return null;
  
  const segmentCol = segmentColumns[0];
  const valueCol = valueColumns[0];
  
  const segmentStats = {};
  records.forEach(record => {
    const segment = record[segmentCol];
    const value = record[valueCol];
    
    if (segment && typeof value === 'number') {
      if (!segmentStats[segment]) {
        segmentStats[segment] = { sum: 0, count: 0 };
      }
      segmentStats[segment].sum += value;
      segmentStats[segment].count++;
    }
  });
  
  const segments = Object.entries(segmentStats)
    .map(([name, stats]) => ({
      name,
      average: stats.sum / stats.count,
      percentage: stats.count / records.length
    }))
    .sort((a, b) => b.average - a.average);
  
  if (segments.length >= 2) {
    const top = segments[0];
    const totalValue = segments.reduce((sum, s) => sum + s.average * s.percentage, 0);
    const topValueShare = (top.average * top.percentage) / totalValue;
    
    // Determine appropriate title based on data type
    const dataType = inferDataType(columns, columnTypes);
    let title = 'SEGMENT ANALYSIS';
    let entityType = 'records';
    
    if (dataType === 'medical/healthcare data') {
      title = 'PATIENT GROUP ANALYSIS';
      entityType = 'patients';
    } else if (dataType === 'educational data') {
      title = 'STUDENT GROUP ANALYSIS';
      entityType = 'students';
    } else if (dataType === 'scientific/research data') {
      title = 'EXPERIMENTAL GROUP ANALYSIS';
      entityType = 'samples';
    } else if (dataType.includes('customer')) {
      title = 'CUSTOMER BEHAVIOR';
      entityType = 'customers';
    } else if (dataType.includes('product')) {
      title = 'PRODUCT CATEGORY ANALYSIS';
      entityType = 'products';
    }
    
    return {
      title: title,
      insight: `${top.name} ${entityType} account for ${formatPercentage(top.percentage)} of ${entityType} but ${formatPercentage(topValueShare)} of total ${valueCol}. Average ${valueCol}: ${formatNumber(top.average)}`
    };
  }
  
  return null;
}

export function analyzeCategoryPerformance(records, columns, columnTypes) {
  const categoryColumns = columns.filter(c => 
    (c.toLowerCase().includes('category') || c.toLowerCase().includes('product')) &&
    columnTypes[c] && columnTypes[c].type === 'categorical'
  );
  
  if (categoryColumns.length === 0) return null;
  
  const performanceColumns = columns.filter(c => 
    (c.toLowerCase().includes('margin') || 
     c.toLowerCase().includes('profit') ||
     c.toLowerCase().includes('revenue')) &&
    columnTypes[c] && ['integer', 'float'].includes(columnTypes[c].type)
  );
  
  if (performanceColumns.length === 0) return null;
  
  const categoryCol = categoryColumns[0];
  const perfCol = performanceColumns[0];
  
  const categoryPerformance = {};
  records.forEach(record => {
    const category = record[categoryCol];
    const performance = record[perfCol];
    
    if (category && typeof performance === 'number') {
      if (!categoryPerformance[category]) {
        categoryPerformance[category] = { values: [], count: 0 };
      }
      categoryPerformance[category].values.push(performance);
      categoryPerformance[category].count++;
    }
  });
  
  const categories = Object.entries(categoryPerformance)
    .map(([name, data]) => ({
      name,
      average: data.values.reduce((a, b) => a + b, 0) / data.values.length,
      volume: data.count
    }))
    .sort((a, b) => b.average - a.average);
  
  if (categories.length >= 2) {
    const highMargin = categories[0];
    const highVolume = categories.sort((a, b) => b.volume - a.volume)[0];
    
    if (highMargin.name !== highVolume.name) {
      return {
        title: 'PRODUCT PERFORMANCE',
        insight: `${highMargin.name} shows highest ${perfCol} (${formatNumber(highMargin.average)}) but ${highVolume.name} has highest volume (${highVolume.volume} records)`
      };
    }
  }
  
  return null;
}

export function analyzePricing(records, columns, columnTypes) {
  const priceColumns = columns.filter(c => 
    c.toLowerCase().includes('price') &&
    columnTypes[c] && ['integer', 'float'].includes(columnTypes[c].type)
  );
  
  if (priceColumns.length === 0) return null;
  
  const priceCol = priceColumns[0];
  const prices = records.map(r => r[priceCol]).filter(p => typeof p === 'number' && p > 0);
  
  if (prices.length === 0) return null;
  
  // Check for psychological pricing
  const endingIn99 = prices.filter(p => {
    const cents = Math.round((p % 1) * 100);
    return cents === 99;
  });
  
  const roundPrices = prices.filter(p => p % 1 === 0);
  
  const insights = [];
  
  if (endingIn99.length > prices.length * 0.3) {
    insights.push(`${formatPercentage(endingIn99.length / prices.length)} of prices end in .99`);
  }
  
  if (roundPrices.length > prices.length * 0.4) {
    const commonRoundPrices = {};
    roundPrices.forEach(p => {
      commonRoundPrices[p] = (commonRoundPrices[p] || 0) + 1;
    });
    
    const topPrices = Object.entries(commonRoundPrices)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([price]) => formatCurrency(parseFloat(price)));
    
    insights.push(`Common price points: ${topPrices.join(', ')}`);
  }
  
  if (insights.length > 0) {
    insights.push('(psychological pricing effect detected)');
    return insights.join('. ');
  }
  
  return null;
}

export function detectAnomalies(records, columns, columnTypes) {
  const anomalies = [];
  const dataType = inferDataType(columns, columnTypes);
  
  // Check for zero values in numeric columns
  const numericColumns = columns.filter(c => 
    (c.toLowerCase().includes('amount') || c.toLowerCase().includes('value') || 
     c.toLowerCase().includes('score') || c.toLowerCase().includes('result') ||
     c.toLowerCase().includes('measurement') || c.toLowerCase().includes('count')) &&
    columnTypes[c] && ['integer', 'float'].includes(columnTypes[c].type)
  );
  
  numericColumns.forEach(col => {
    const zeros = records.filter(r => r[col] === 0).length;
    if (zeros > 0) {
      let context = 'records';
      let explanation = '';
      
      if (dataType === 'medical/healthcare data') {
        context = 'patients';
        explanation = '(potential missing or baseline measurements)';
      } else if (dataType === 'educational data') {
        context = 'students';
        explanation = '(potential missing assignments or zero scores)';
      } else if (dataType === 'scientific/research data') {
        context = 'measurements';
        explanation = '(potential calibration or measurement issues)';
      } else if (dataType.includes('sales') || dataType.includes('transaction')) {
        context = 'transactions';
        explanation = '(likely returns or errors)';
      } else {
        explanation = '(potential data quality issues)';
      }
      
      anomalies.push(`${zeros} ${context} with zero ${col} ${explanation}`);
    }
    
    // Check for negative values where they shouldn't exist
    const negatives = records.filter(r => typeof r[col] === 'number' && r[col] < 0).length;
    if (negatives > 0 && !col.toLowerCase().includes('profit') && !col.toLowerCase().includes('loss')) {
      anomalies.push(`${negatives} records with negative ${col} values`);
    }
  });
  
  // Check for suspicious patterns
  const idColumns = columns.filter(c => columnTypes[c] && columnTypes[c].type === 'identifier');
  if (idColumns.length > 0) {
    // Check for duplicate IDs
    const ids = records.map(r => r[idColumns[0]]).filter(id => id !== null);
    const uniqueIds = new Set(ids);
    if (uniqueIds.size < ids.length) {
      anomalies.push(`${ids.length - uniqueIds.size} duplicate ${idColumns[0]} values found`);
    }
  }
  
  // Check for outliers in date data
  const dateColumns = columns.filter(c => columnTypes[c] && columnTypes[c].type === 'date');
  if (dateColumns.length > 0) {
    const dates = records.map(r => r[dateColumns[0]]).filter(d => d instanceof Date);
    if (dates.length > 100) {
      const sorted = dates.sort((a, b) => a - b);
      const gaps = [];
      
      for (let i = 1; i < sorted.length; i++) {
        const daysDiff = (sorted[i] - sorted[i-1]) / (1000 * 60 * 60 * 24);
        if (daysDiff > 30) {
          gaps.push({ start: sorted[i-1], end: sorted[i], days: daysDiff });
        }
      }
      
      if (gaps.length > 0) {
        anomalies.push(`Data gaps detected: ${gaps.length} periods with >30 day gaps`);
      }
    }
  }
  
  return anomalies;
}

export function calculateDataQuality(records, columns) {
  const totalCells = records.length * columns.length;
  let missingCells = 0;
  const missingByColumn = {};
  
  columns.forEach(col => {
    const missing = records.filter(r => r[col] === null || r[col] === undefined).length;
    missingCells += missing;
    if (missing > 0) {
      missingByColumn[col] = missing;
    }
  });
  
  const topMissing = Object.entries(missingByColumn)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([col, count]) => `${col} (${formatPercentage(count / records.length)})`);
  
  const duplicates = findDuplicateRows(records);
  
  return {
    completeness: (totalCells - missingCells) / totalCells,
    missingDetails: topMissing.length > 0 ? topMissing.join(', ') : 'No missing values',
    duplicates: duplicates.length,
    dateGaps: null // Will be filled by date analysis
  };
}

function findDuplicateRows(records) {
  const seen = new Set();
  const duplicates = [];
  
  records.forEach((record, idx) => {
    const key = JSON.stringify(record);
    if (seen.has(key)) {
      duplicates.push(idx);
    } else {
      seen.add(key);
    }
  });
  
  return duplicates;
}

export function generateSummaryStatistics(records, columns, columnTypes) {
  const stats = [];
  
  // Total value statistics
  const valueColumns = columns.filter(c => 
    (c.toLowerCase().includes('amount') || 
     c.toLowerCase().includes('total') ||
     c.toLowerCase().includes('revenue')) &&
    columnTypes[c] && ['integer', 'float'].includes(columnTypes[c].type)
  );
  
  valueColumns.forEach(col => {
    const values = records.map(r => r[col]).filter(v => typeof v === 'number');
    if (values.length > 0) {
      const total = values.reduce((a, b) => a + b, 0);
      const avg = total / values.length;
      const sorted = [...values].sort((a, b) => a - b);
      const median = sorted[Math.floor(sorted.length / 2)];
      
      stats.push(`Total ${col}: ${formatCurrency(total)}`);
      stats.push(`Average ${col}: ${formatCurrency(avg)}`);
      stats.push(`Median ${col}: ${formatCurrency(median)}`);
    }
  });
  
  return stats;
}

export function findSignificantCorrelations(records, columns, columnTypes) {
  const numericColumns = columns.filter(c => columnTypes[c] && ['integer', 'float'].includes(columnTypes[c].type));
  const correlations = [];
  
  for (let i = 0; i < numericColumns.length; i++) {
    for (let j = i + 1; j < numericColumns.length; j++) {
      const col1 = numericColumns[i];
      const col2 = numericColumns[j];
      const values1 = records.map(r => r[col1]);
      const values2 = records.map(r => r[col2]);
      const corr = calculateCorrelation(values1, values2);
      
      if (corr !== null && Math.abs(corr) > 0.5) {
        const strength = Math.abs(corr) > 0.8 ? 'Strong' : 'Moderate';
        const direction = corr > 0 ? 'positive' : 'negative';
        correlations.push(`${strength} ${direction}: ${col1} vs ${col2} (${formatNumber(corr, 2)})`);
      }
    }
  }
  
  return correlations.slice(0, 5);
}

export function generateAnalysisSuggestions(columns, columnTypes) {
  const suggestions = [];
  const columnNames = columns.map(c => c.toLowerCase()).join(' ');
  const dataType = inferDataType(columns, columnTypes);
  
  // Medical/Healthcare specific suggestions
  if (dataType === 'medical/healthcare data') {
    if (columns.some(c => c.toLowerCase().includes('patient'))) {
      suggestions.push('Patient outcome analysis and risk stratification');
      suggestions.push('Treatment effectiveness comparison');
    }
    if (columns.some(c => c.toLowerCase().includes('diagnosis') || c.toLowerCase().includes('condition'))) {
      suggestions.push('Disease progression modeling and prediction');
      suggestions.push('Comorbidity analysis and pattern detection');
    }
    if (columns.some(c => columnTypes[c] && columnTypes[c].type === 'date')) {
      suggestions.push('Treatment timeline analysis and optimization');
      suggestions.push('Patient readmission risk prediction');
    }
    if (columnNames.includes('glucose') || columnNames.includes('diabetes')) {
      suggestions.push('Glucose pattern analysis and diabetes management insights');
      suggestions.push('Risk factor identification for diabetic complications');
    }
    return suggestions;
  }
  
  // Scientific/Research specific suggestions
  if (dataType === 'scientific/research data') {
    suggestions.push('Experiment result validation and reproducibility analysis');
    suggestions.push('Statistical significance testing and confidence intervals');
    if (columns.some(c => columnTypes[c] && columnTypes[c].type === 'date')) {
      suggestions.push('Temporal trend analysis in experimental results');
    }
    return suggestions;
  }
  
  // Educational specific suggestions
  if (dataType === 'educational data') {
    if (columns.some(c => c.toLowerCase().includes('student'))) {
      suggestions.push('Student performance prediction and early intervention');
      suggestions.push('Learning pattern analysis and personalization');
    }
    if (columns.some(c => c.toLowerCase().includes('grade') || c.toLowerCase().includes('score'))) {
      suggestions.push('Grade distribution analysis and fairness assessment');
      suggestions.push('Performance factors and correlation analysis');
    }
    return suggestions;
  }
  
  // Environmental specific suggestions
  if (dataType === 'environmental data') {
    suggestions.push('Environmental impact assessment and trend analysis');
    suggestions.push('Anomaly detection in environmental measurements');
    if (columns.some(c => columnTypes[c] && columnTypes[c].type === 'date')) {
      suggestions.push('Seasonal pattern analysis and climate modeling');
    }
    return suggestions;
  }
  
  // Manufacturing specific suggestions
  if (dataType === 'manufacturing/production data') {
    suggestions.push('Quality control analysis and defect prediction');
    suggestions.push('Production efficiency optimization');
    if (columns.some(c => c.toLowerCase().includes('defect'))) {
      suggestions.push('Root cause analysis for defects');
    }
    return suggestions;
  }
  
  // Transportation/Logistics specific suggestions
  if (dataType === 'transportation/logistics data') {
    suggestions.push('Route optimization and delivery performance analysis');
    suggestions.push('Fleet efficiency and utilization analysis');
    if (columns.some(c => columnTypes[c] && columnTypes[c].type === 'date')) {
      suggestions.push('Delivery time prediction and delay analysis');
    }
    return suggestions;
  }
  
  // Business/Sales suggestions (existing logic)
  if (columns.some(c => c.toLowerCase().includes('customer'))) {
    suggestions.push('Customer Lifetime Value (CLV) calculation and segmentation');
  }
  
  if (columns.some(c => c.toLowerCase().includes('product') || c.toLowerCase().includes('sku'))) {
    suggestions.push('Market basket analysis to find product associations');
  }
  
  if (columns.some(c => columnTypes[c] && columnTypes[c].type === 'date')) {
    if (dataType.includes('sales') || dataType.includes('transaction')) {
      suggestions.push('Time series forecasting for demand prediction');
    }
    
    if (columns.some(c => c.toLowerCase().includes('customer'))) {
      suggestions.push('Cohort analysis for customer retention');
    }
  }
  
  return suggestions;
}

export function generateDataQuestions(columns, columnTypes, dataType) {
  const questions = [];
  const columnNames = columns.map(c => c.toLowerCase()).join(' ');
  
  // Medical/Healthcare questions
  if (dataType === 'medical/healthcare data') {
    questions.push('What are the key risk factors for adverse patient outcomes?');
    questions.push('Which treatments show the highest effectiveness rates?');
    questions.push('Are there patterns in patient demographics and health conditions?');
    questions.push('What factors correlate with successful treatment outcomes?');
    questions.push('How do different patient groups respond to various treatments?');
    questions.push('What are the early warning signs for complications?');
    if (columnNames.includes('diabetes') || columnNames.includes('glucose')) {
      questions.push('What patterns exist in glucose levels across different patient groups?');
      questions.push('Which factors most strongly correlate with diabetes complications?');
    }
  }
  
  // Scientific/Research questions
  else if (dataType === 'scientific/research data') {
    questions.push('What variables show the strongest correlations in the experiments?');
    questions.push('Are there any unexpected patterns in the research data?');
    questions.push('Which experimental conditions yield the most consistent results?');
    questions.push('What factors might be influencing measurement variability?');
    questions.push('Are there any outliers that warrant further investigation?');
  }
  
  // Educational questions
  else if (dataType === 'educational data') {
    questions.push('What factors most strongly predict student success?');
    questions.push('Are there achievement gaps between different student groups?');
    questions.push('Which teaching methods or courses show the best outcomes?');
    questions.push('What early indicators suggest students need additional support?');
    questions.push('How do attendance and engagement correlate with performance?');
  }
  
  // Environmental questions
  else if (dataType === 'environmental data') {
    questions.push('What are the long-term trends in environmental indicators?');
    questions.push('Which factors show the strongest environmental impact?');
    questions.push('Are there seasonal or cyclical patterns in the data?');
    questions.push('What anomalies or extreme events are present in the data?');
    questions.push('How do different environmental variables interact?');
  }
  
  // Manufacturing questions
  else if (dataType === 'manufacturing/production data') {
    questions.push('What factors contribute most to production defects?');
    questions.push('Which production lines or shifts show the best quality metrics?');
    questions.push('Are there patterns in equipment failures or maintenance needs?');
    questions.push('What variables correlate with production efficiency?');
    questions.push('How can quality control processes be optimized?');
  }
  
  // Transportation/Logistics questions
  else if (dataType === 'transportation/logistics data') {
    questions.push('What factors cause delivery delays?');
    questions.push('Which routes show the best efficiency metrics?');
    questions.push('Are there patterns in vehicle performance or maintenance?');
    questions.push('How do external factors (weather, traffic) impact operations?');
    questions.push('What opportunities exist for route optimization?');
  }
  
  // Business/Sales questions (existing logic)
  else if (dataType.includes('sales') || dataType.includes('transaction')) {
    questions.push('What factors drive sales performance?');
    questions.push('Which products/services generate the most revenue?');
    questions.push('What are the seasonal trends in sales?');
    questions.push('How do pricing changes affect sales volume?');
    questions.push('Which customer segments drive the most value?');
  }
  
  else if (dataType.includes('customer')) {
    questions.push('What factors drive customer loyalty?');
    questions.push('Which customer segments are most valuable?');
    questions.push('What is the typical customer journey?');
    questions.push('How can customer churn be predicted and prevented?');
    questions.push('What patterns exist in customer behavior?');
  }
  
  // General questions for unclassified data
  else {
    questions.push('What are the key patterns and trends in this data?');
    questions.push('Which variables show the strongest correlations?');
    questions.push('Are there any notable outliers or anomalies?');
    questions.push('What insights can be derived from the data distribution?');
    questions.push('How has the data changed over time?');
  }
  
  return questions.slice(0, 8);
}

export async function generateTechnicalNotes(records, columns, columnTypes) {
  const notes = [];
  
  // Check for skewed distributions
  const numericColumns = columns.filter(c => columnTypes[c] && ['integer', 'float'].includes(columnTypes[c].type));
  
  for (const col of numericColumns) {
    const values = records.map(r => r[col]).filter(v => typeof v === 'number');
    if (values.length > 0) {
      const dist = await analyzeDistribution(values);
      if (Math.abs(dist.skewness) > 2) {
        notes.push(`Log transformation recommended for ${col} (heavy ${dist.skewness > 0 ? 'right' : 'left'} skew)`);
      }
    }
  }
  
  return notes;
}