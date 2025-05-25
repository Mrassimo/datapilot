import { parseCSV, detectColumnTypes } from '../utils/parser.js';
import { calculateStats, calculateCorrelation, analyzeDistribution } from '../utils/stats.js';
import { createSection, createSubSection, formatTimestamp, formatNumber, formatPercentage, formatCurrency, bulletList } from '../utils/format.js';
import { OutputHandler } from '../utils/output.js';
import { basename } from 'path';
import ora from 'ora';

export async function llmContext(filePath, options = {}) {
  const outputHandler = new OutputHandler(options);
  const spinner = options.quiet ? null : ora('Reading CSV file...').start();
  
  try {
    // Use preloaded data if available
    let records, columnTypes;
    if (options.preloadedData) {
      records = options.preloadedData.records;
      columnTypes = options.preloadedData.columnTypes;
    } else {
      // Parse CSV
      records = await parseCSV(filePath, { quiet: options.quiet, header: options.header });
      if (spinner) spinner.text = 'Generating LLM context...';
      columnTypes = detectColumnTypes(records);
    }
    
    const fileName = basename(filePath);
    const columns = Object.keys(columnTypes);
    
    // Build report
    let report = createSection('LLM-READY CONTEXT',
      `Dataset: ${fileName}\nGenerated: ${formatTimestamp()}`);
    
    report += createSubSection('DATASET SUMMARY FOR AI ANALYSIS', '');
    
    // Generate natural language summary
    const dateColumns = columns.filter(col => columnTypes[col].type === 'date');
    const dateRange = getDateRange(records, dateColumns);
    
    report += `I have a CSV dataset with ${records.length.toLocaleString()} rows and ${columns.length} columns`;
    
    // Try to infer what kind of data this is
    const dataType = inferDataType(columns, columnTypes);
    report += ` containing ${dataType}`;
    
    if (dateRange) {
      report += `. The data spans from ${dateRange.start} to ${dateRange.end}`;
    }
    report += '.\n';
    
    // Key columns and characteristics
    report += createSubSection('KEY COLUMNS AND THEIR CHARACTERISTICS', '');
    
    columns.forEach((column, idx) => {
      const type = columnTypes[column];
      const values = records.map(r => r[column]);
      
      report += `\n${idx + 1}. ${column}: `;
      
      if (type.type === 'identifier') {
        const unique = new Set(values.filter(v => v !== null)).size;
        report += `Unique identifier${unique === records.length ? '' : ` (${unique} unique values)`}`;
      } else if (type.type === 'integer' || type.type === 'float') {
        const stats = calculateStats(values);
        const range = `range: ${formatValue(stats.min, column)} to ${formatValue(stats.max, column)}`;
        report += `${inferColumnPurpose(column)} (${range})`;
      } else if (type.type === 'categorical') {
        const topValues = getTopCategoricalValues(values, 3);
        report += `${type.categories.length} categories: ${topValues}`;
      } else if (type.type === 'date') {
        report += 'Date field';
        const dates = values.filter(v => v instanceof Date);
        if (dates.length > 0) {
          const sorted = dates.sort((a, b) => a - b);
          report += ` (${formatDate(sorted[0])} to ${formatDate(sorted[sorted.length - 1])})`;
        }
      } else {
        report += type.type.charAt(0).toUpperCase() + type.type.slice(1);
      }
    });
    
    // Important patterns and insights
    report += '\n' + createSubSection('IMPORTANT PATTERNS AND INSIGHTS', '');
    
    let insightNumber = 1;
    
    // Seasonality analysis
    if (dateColumns.length > 0) {
      const seasonalPattern = analyzeSeasonality(records, dateColumns[0], columns, columnTypes);
      if (seasonalPattern) {
        report += `\n${insightNumber}. SEASONALITY: ${seasonalPattern}\n`;
        insightNumber++;
      }
    }
    
    // Customer/segment analysis
    const segmentAnalysis = analyzeSegments(records, columns, columnTypes);
    if (segmentAnalysis) {
      report += `\n${insightNumber}. ${segmentAnalysis.title}: ${segmentAnalysis.insight}\n`;
      insightNumber++;
    }
    
    // Category performance
    const categoryAnalysis = analyzeCategoryPerformance(records, columns, columnTypes);
    if (categoryAnalysis) {
      report += `\n${insightNumber}. ${categoryAnalysis.title}: ${categoryAnalysis.insight}\n`;
      insightNumber++;
    }
    
    // Pricing insights
    const pricingInsights = analyzePricing(records, columns, columnTypes);
    if (pricingInsights) {
      report += `\n${insightNumber}. PRICING INSIGHTS: ${pricingInsights}\n`;
      insightNumber++;
    }
    
    // Anomalies
    const anomalies = detectAnomalies(records, columns, columnTypes);
    if (anomalies.length > 0) {
      report += `\n${insightNumber}. ANOMALIES DETECTED:\n`;
      anomalies.forEach(anomaly => {
        report += `   - ${anomaly}\n`;
      });
      insightNumber++;
    }
    
    // Data quality notes
    const qualityMetrics = calculateDataQuality(records, columns);
    report += createSubSection('DATA QUALITY NOTES', bulletList([
      `Missing values: ${qualityMetrics.missingDetails}`,
      `Completeness: ${formatPercentage(qualityMetrics.completeness)} overall`,
      qualityMetrics.duplicates > 0 ? `${qualityMetrics.duplicates} duplicate records identified` : 'No duplicate records found',
      qualityMetrics.dateGaps ? qualityMetrics.dateGaps : 'Date range has no gaps'
    ]));
    
    // Statistical summary
    report += createSubSection('STATISTICAL SUMMARY', '');
    
    const summaryStats = generateSummaryStatistics(records, columns, columnTypes);
    summaryStats.forEach(stat => {
      report += `- ${stat}\n`;
    });
    
    // Correlations discovered
    const correlations = findSignificantCorrelations(records, columns, columnTypes);
    if (correlations.length > 0) {
      report += createSubSection('CORRELATIONS DISCOVERED', '');
      correlations.forEach(corr => {
        report += `- ${corr}\n`;
      });
    }
    
    // Suggested analyses
    report += createSubSection('SUGGESTED ANALYSES FOR THIS DATA', '');
    
    const suggestions = generateAnalysisSuggestions(columns, columnTypes, records);
    suggestions.forEach((suggestion, idx) => {
      report += `\n${idx + 1}. ${suggestion}`;
    });
    
    // Questions this data could answer
    report += '\n' + createSubSection('QUESTIONS THIS DATA COULD ANSWER', '');
    
    const questions = generateDataQuestions(columns, columnTypes, dataType, records);
    questions.forEach(question => {
      report += `- ${question}\n`;
    });
    
    // Technical notes
    report += createSubSection('TECHNICAL NOTES FOR ANALYSIS', '');
    
    const technicalNotes = generateTechnicalNotes(records, columns, columnTypes);
    technicalNotes.forEach(note => {
      report += `- ${note}\n`;
    });
    
    report += '\nEND OF CONTEXT\n\n[Paste this into your preferred LLM and ask specific questions about the data]\n';
    
    if (spinner) {
      spinner.succeed('LLM context generated!');
    }
    console.log(report);
    
    outputHandler.finalize();
    
  } catch (error) {
    outputHandler.restore();
    if (spinner) spinner.fail('Error generating LLM context');
    console.error(error.message);
    if (!options.quiet) process.exit(1);
    throw error;
  }
}

function getDateRange(records, dateColumns) {
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

function inferDataType(columns, columnTypes) {
  const columnNames = columns.map(c => c.toLowerCase()).join(' ');
  
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
    columnTypes[c].type === 'identifier' && columns.some(c2 => ['float', 'integer'].includes(columnTypes[c2].type))
  );
  
  if (hasTransactionLikeData) {
    return 'transactional data';
  }
  
  return 'structured business data';
}

function inferColumnPurpose(column) {
  const col = column.toLowerCase();
  
  if (col.includes('amount') || col.includes('total') || col.includes('sum')) {
    return 'Transaction amount';
  }
  if (col.includes('price')) {
    return 'Price information';
  }
  if (col.includes('quantity') || col.includes('qty')) {
    return 'Quantity/count';
  }
  if (col.includes('age')) {
    return 'Age data';
  }
  if (col.includes('score') || col.includes('rating')) {
    return 'Score/rating';
  }
  if (col.includes('discount')) {
    return 'Discount percentage/amount';
  }
  if (col.includes('id')) {
    return 'Identifier';
  }
  
  return 'Numeric field';
}

function formatValue(value, column) {
  if (column.toLowerCase().includes('amount') || 
      column.toLowerCase().includes('price') || 
      column.toLowerCase().includes('total') ||
      column.toLowerCase().includes('revenue')) {
    return formatCurrency(value);
  }
  
  if (column.toLowerCase().includes('percent') || column.toLowerCase().includes('rate')) {
    return formatPercentage(value / 100);
  }
  
  return formatNumber(value);
}

function getTopCategoricalValues(values, limit) {
  const counts = {};
  values.forEach(v => {
    if (v !== null) counts[v] = (counts[v] || 0) + 1;
  });
  
  const sorted = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([val, count]) => `${val} (${formatPercentage(count / values.length)})`);
  
  return sorted.join(', ') + (Object.keys(counts).length > limit ? ', ...' : '');
}

function analyzeSeasonality(records, dateColumn, columns, columnTypes) {
  const numericColumns = columns.filter(c => ['integer', 'float'].includes(columnTypes[c].type));
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

function analyzeSegments(records, columns, columnTypes) {
  const segmentColumns = columns.filter(c => 
    c.toLowerCase().includes('segment') || 
    c.toLowerCase().includes('tier') ||
    c.toLowerCase().includes('type') ||
    c.toLowerCase().includes('category')
  ).filter(c => columnTypes[c].type === 'categorical');
  
  if (segmentColumns.length === 0) return null;
  
  const valueColumns = columns.filter(c => 
    (c.toLowerCase().includes('amount') || c.toLowerCase().includes('value')) &&
    ['integer', 'float'].includes(columnTypes[c].type)
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
    
    return {
      title: 'CUSTOMER BEHAVIOR',
      insight: `${top.name} customers account for ${formatPercentage(top.percentage)} of customer base but ${formatPercentage(topValueShare)} of value. Average ${valueCol}: ${formatCurrency(top.average)}`
    };
  }
  
  return null;
}

function analyzeCategoryPerformance(records, columns, columnTypes) {
  const categoryColumns = columns.filter(c => 
    (c.toLowerCase().includes('category') || c.toLowerCase().includes('product')) &&
    columnTypes[c].type === 'categorical'
  );
  
  if (categoryColumns.length === 0) return null;
  
  const performanceColumns = columns.filter(c => 
    (c.toLowerCase().includes('margin') || 
     c.toLowerCase().includes('profit') ||
     c.toLowerCase().includes('revenue')) &&
    ['integer', 'float'].includes(columnTypes[c].type)
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

function analyzePricing(records, columns, columnTypes) {
  const priceColumns = columns.filter(c => 
    c.toLowerCase().includes('price') &&
    ['integer', 'float'].includes(columnTypes[c].type)
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

function detectAnomalies(records, columns, columnTypes) {
  const anomalies = [];
  
  // Check for zero amounts
  const amountColumns = columns.filter(c => 
    c.toLowerCase().includes('amount') &&
    ['integer', 'float'].includes(columnTypes[c].type)
  );
  
  amountColumns.forEach(col => {
    const zeros = records.filter(r => r[col] === 0).length;
    if (zeros > 0) {
      anomalies.push(`${zeros} transactions with $0 ${col} (likely returns or errors)`);
    }
  });
  
  // Check for suspicious patterns
  const idColumns = columns.filter(c => columnTypes[c].type === 'identifier');
  if (idColumns.length > 0) {
    // Check for duplicate IDs
    const ids = records.map(r => r[idColumns[0]]).filter(id => id !== null);
    const uniqueIds = new Set(ids);
    if (uniqueIds.size < ids.length) {
      anomalies.push(`${ids.length - uniqueIds.size} duplicate ${idColumns[0]} values found`);
    }
  }
  
  // Check for outliers in date data
  const dateColumns = columns.filter(c => columnTypes[c].type === 'date');
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

function calculateDataQuality(records, columns) {
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

function generateSummaryStatistics(records, columns, columnTypes) {
  const stats = [];
  
  // Total value statistics
  const valueColumns = columns.filter(c => 
    (c.toLowerCase().includes('amount') || 
     c.toLowerCase().includes('total') ||
     c.toLowerCase().includes('revenue')) &&
    ['integer', 'float'].includes(columnTypes[c].type)
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
  
  // Customer/entity statistics
  const customerColumns = columns.filter(c => 
    c.toLowerCase().includes('customer') && 
    columnTypes[c].type === 'identifier'
  );
  
  if (customerColumns.length > 0) {
    const customers = new Set(records.map(r => r[customerColumns[0]]).filter(c => c !== null));
    const customerPurchases = {};
    
    records.forEach(record => {
      const customer = record[customerColumns[0]];
      if (customer) {
        customerPurchases[customer] = (customerPurchases[customer] || 0) + 1;
      }
    });
    
    const repeatCustomers = Object.values(customerPurchases).filter(count => count > 1).length;
    const retentionRate = repeatCustomers / customers.size;
    
    stats.push(`Customer retention rate: ${formatPercentage(retentionRate)} (based on repeat activity)`);
  }
  
  // Time-based statistics
  const dateColumns = columns.filter(c => columnTypes[c].type === 'date');
  if (dateColumns.length > 0) {
    const dates = records.map(r => r[dateColumns[0]]).filter(d => d instanceof Date);
    
    if (dates.length > 0) {
      const dayOfWeekCounts = new Array(7).fill(0);
      const hourCounts = new Array(24).fill(0);
      
      dates.forEach(date => {
        dayOfWeekCounts[date.getDay()]++;
        hourCounts[date.getHours()]++;
      });
      
      const peakDay = dayOfWeekCounts.indexOf(Math.max(...dayOfWeekCounts));
      const peakHour = hourCounts.indexOf(Math.max(...hourCounts));
      
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      
      stats.push(`Most active day: ${dayNames[peakDay]} (${formatPercentage(dayOfWeekCounts[peakDay] / dates.length)} of activity)`);
      
      if (hourCounts.some(c => c > 0)) {
        stats.push(`Peak hour: ${peakHour}:00-${peakHour + 1}:00 (${formatPercentage(hourCounts[peakHour] / dates.length)} of activity)`);
      }
    }
  }
  
  return stats;
}

function findSignificantCorrelations(records, columns, columnTypes) {
  const numericColumns = columns.filter(c => ['integer', 'float'].includes(columnTypes[c].type));
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

function generateAnalysisSuggestions(columns, columnTypes, records) {
  const suggestions = [];
  
  // Check for customer analysis potential
  if (columns.some(c => c.toLowerCase().includes('customer'))) {
    suggestions.push('Customer Lifetime Value (CLV) calculation and segmentation');
  }
  
  // Check for product analysis
  if (columns.some(c => c.toLowerCase().includes('product') || c.toLowerCase().includes('sku'))) {
    suggestions.push('Market basket analysis to find product associations');
  }
  
  // Check for time series potential
  if (columns.some(c => columnTypes[c].type === 'date')) {
    suggestions.push('Time series forecasting for demand prediction');
    
    if (columns.some(c => c.toLowerCase().includes('customer'))) {
      suggestions.push('Cohort analysis for customer retention');
    }
  }
  
  // Check for pricing analysis
  if (columns.some(c => c.toLowerCase().includes('price'))) {
    suggestions.push('Price elasticity analysis by product category');
  }
  
  // Check for churn analysis
  if (columns.some(c => c.toLowerCase().includes('status') || c.toLowerCase().includes('active'))) {
    suggestions.push('Churn prediction based on activity patterns');
  }
  
  // Check for inventory optimization
  if (columns.some(c => c.toLowerCase().includes('inventory') || c.toLowerCase().includes('stock'))) {
    suggestions.push('Inventory optimization based on sales velocity');
  }
  
  // Check for fraud detection
  if (columns.some(c => c.toLowerCase().includes('transaction')) && records.length > 1000) {
    suggestions.push('Fraud detection for suspicious transaction patterns');
  }
  
  // Check for A/B testing
  if (columns.some(c => columnTypes[c].type === 'categorical' && columnTypes[c].categories && columnTypes[c].categories.length === 2)) {
    suggestions.push('A/B test analysis for binary categorical variables');
  }
  
  return suggestions;
}

function generateDataQuestions(columns, columnTypes, dataType, records) {
  const questions = [];
  
  // Generic questions based on data type
  if (dataType.includes('sales') || dataType.includes('transaction')) {
    questions.push('What factors drive sales performance?');
    questions.push('Which products/services generate the most revenue?');
    questions.push('What are the seasonal trends in sales?');
  }
  
  if (dataType.includes('customer')) {
    questions.push('What factors drive customer loyalty?');
    questions.push('Which customer segments are most valuable?');
    questions.push('What is the typical customer journey?');
  }
  
  // Column-specific questions
  if (columns.some(c => c.toLowerCase().includes('price'))) {
    questions.push('How does pricing affect purchase behavior?');
    questions.push('What is the optimal pricing strategy?');
  }
  
  if (columns.some(c => c.toLowerCase().includes('discount'))) {
    questions.push('What is the optimal discount strategy?');
    questions.push('How do discounts impact profitability?');
  }
  
  if (columns.some(c => c.toLowerCase().includes('category'))) {
    questions.push('Which categories perform best?');
    questions.push('How do categories differ in customer behavior?');
  }
  
  if (columns.some(c => columnTypes[c].type === 'date')) {
    questions.push('What are the growth trends over time?');
    questions.push('Are there any cyclical patterns?');
  }
  
  // Risk-related questions
  if (records.length > 1000) {
    questions.push('Which records represent outliers or anomalies?');
    questions.push('What patterns indicate risk or opportunity?');
  }
  
  return questions.slice(0, 8);
}

function generateTechnicalNotes(records, columns, columnTypes) {
  const notes = [];
  
  // Check for skewed distributions
  const numericColumns = columns.filter(c => ['integer', 'float'].includes(columnTypes[c].type));
  
  numericColumns.forEach(col => {
    const values = records.map(r => r[col]).filter(v => typeof v === 'number');
    if (values.length > 0) {
      const dist = analyzeDistribution(values);
      if (Math.abs(dist.skewness) > 2) {
        notes.push(`Log transformation recommended for ${col} (heavy ${dist.skewness > 0 ? 'right' : 'left'} skew)`);
      }
    }
  });
  
  // Check for cyclical features
  const dateColumns = columns.filter(c => columnTypes[c].type === 'date');
  if (dateColumns.length > 0) {
    notes.push('Consider encoding cyclical features for day_of_week and month');
  }
  
  // Check for high cardinality
  const highCardColumns = columns.filter(c => {
    if (columnTypes[c].type === 'identifier') return true;
    if (columnTypes[c].type === 'categorical' && columnTypes[c].categories) {
      return columnTypes[c].categories.length > 50;
    }
    return false;
  });
  
  if (highCardColumns.length > 0) {
    notes.push(`${highCardColumns[0]} has high cardinality - consider embedding approaches`);
  }
  
  // Time series recommendations
  if (dateColumns.length > 0 && records.length > 100) {
    notes.push('Time series shows trend and seasonality - STL decomposition recommended');
  }
  
  // Sampling recommendations
  if (records.length > 100000) {
    notes.push('Large dataset - consider stratified sampling for initial exploration');
  }
  
  return notes;
}