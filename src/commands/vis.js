import { parseCSV, detectColumnTypes } from '../utils/parser.js';
import { calculateStats, calculateCorrelation } from '../utils/stats.js';
import { createSection, createSubSection, formatTimestamp, formatNumber, bulletList, numberedList } from '../utils/format.js';
import { OutputHandler } from '../utils/output.js';
import { basename } from 'path';
import ora from 'ora';

export async function visualize(filePath, options = {}) {
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
      if (spinner) spinner.text = 'Analyzing visualization opportunities...';
      columnTypes = detectColumnTypes(records);
    }
    
    const fileName = basename(filePath);
    const columns = Object.keys(columnTypes);
    
    // Handle empty dataset
    if (records.length === 0) {
      const report = createSection('VISUALISATION ANALYSIS',
        `Dataset: ${fileName}\nGenerated: ${formatTimestamp()}\n\n⚠️  Empty dataset - no visualizations to recommend`);
      console.log(report);
      outputHandler.finalize();
      return;
    }
    
    // Build report
    let report = createSection('VISUALISATION ANALYSIS',
      `Dataset: ${fileName}\nGenerated: ${formatTimestamp()}`);
    
    report += createSubSection('RECOMMENDED VISUALISATIONS', '');
    
    const recommendations = [];
    
    // Find numeric and date columns
    const numericColumns = columns.filter(col => 
      ['integer', 'float'].includes(columnTypes[col].type)
    );
    const dateColumns = columns.filter(col => 
      columnTypes[col].type === 'date'
    );
    const categoricalColumns = columns.filter(col => 
      columnTypes[col].type === 'categorical'
    );
    
    // 1. Time Series Analysis
    if (dateColumns.length > 0 && numericColumns.length > 0) {
      const dateCol = dateColumns[0];
      const primaryNumeric = findPrimaryNumericColumn(records, numericColumns);
      
      recommendations.push({
        title: 'Time Series Line Chart',
        config: {
          xAxis: `${dateCol} (daily aggregation)`,
          yAxis: `sum of ${primaryNumeric}`,
          purpose: 'Show revenue/value trend over time',
          keyInsight: analyzeTimeTrend(records, dateCol, primaryNumeric),
          additionalLayers: 'Add 30-day moving average, mark promotional periods'
        }
      });
    }
    
    // 2. Categorical Analysis
    if (categoricalColumns.length > 0 && numericColumns.length > 0) {
      const mainCategory = findMainCategoryColumn(records, categoricalColumns);
      const valueColumn = findPrimaryNumericColumn(records, numericColumns);
      
      recommendations.push({
        title: 'Customer Segment Bar Chart',
        config: {
          xAxis: `${mainCategory}`,
          yAxis: `average ${valueColumn}`,
          purpose: `Compare ${valueColumn} across ${mainCategory} categories`,
          keyInsight: analyzeCategoryDifferences(records, mainCategory, valueColumn),
          enhancement: 'Add error bars showing standard deviation'
        }
      });
    }
    
    // 3. Heatmap for temporal patterns
    if (dateColumns.length > 0 && records.length > 100) {
      const dateCol = dateColumns[0];
      const hasTimeComponent = checkTimeComponent(records, dateCol);
      
      if (hasTimeComponent) {
        recommendations.push({
          title: 'Heatmap: Day of Week vs Hour of Day',
          config: {
            xAxis: 'Hour of day (0-23)',
            yAxis: 'Day of week',
            colorIntensity: 'Number of transactions/records',
            purpose: 'Identify peak activity times',
            keyInsight: analyzeTemporalPatterns(records, dateCol)
          }
        });
      }
    }
    
    // 4. Correlation Analysis
    if (numericColumns.length >= 2) {
      const correlationPairs = findStrongCorrelations(records, numericColumns);
      
      if (correlationPairs.length > 0) {
        const bestPair = correlationPairs[0];
        recommendations.push({
          title: 'Scatter Plot with Regression',
          config: {
            xAxis: bestPair.col1,
            yAxis: bestPair.col2,
            color: categoricalColumns.length > 0 ? categoricalColumns[0] : 'single color',
            size: numericColumns.length > 2 ? 'number_of_records' : 'fixed',
            purpose: `Explore relationship between ${bestPair.col1} and ${bestPair.col2}`,
            keyInsight: `${bestPair.strength} correlation (r=${formatNumber(bestPair.correlation, 2)}) ${bestPair.direction}`
          }
        });
      }
    }
    
    // 5. Distribution Analysis
    if (numericColumns.length > 0) {
      const primaryNumeric = findPrimaryNumericColumn(records, numericColumns);
      const stats = calculateStats(records.map(r => r[primaryNumeric]));
      
      recommendations.push({
        title: 'Distribution Histogram',
        config: {
          variable: primaryNumeric,
          bins: '50',
          yAxis: 'Frequency',
          purpose: `Understand ${primaryNumeric} distribution`,
          keyInsight: describeDistribution(stats, primaryNumeric)
        }
      });
    }
    
    // 6. Geographic visualization if location data exists
    const geoColumns = findGeographicColumns(columns, columnTypes);
    if (geoColumns.length > 0 && numericColumns.length > 0) {
      recommendations.push({
        title: 'Geographic Heat Map',
        config: {
          location: geoColumns[0],
          intensity: numericColumns[0],
          purpose: 'Show geographic distribution of values',
          keyInsight: 'Identify regional patterns and hotspots'
        }
      });
    }
    
    // 7. Pie/Donut chart for proportions
    if (categoricalColumns.length > 0) {
      const category = findBestPieCategory(records, categoricalColumns);
      if (category) {
        recommendations.push({
          title: 'Donut Chart: Category Distribution',
          config: {
            category: category.column,
            values: 'Count or sum of values',
            purpose: `Show proportion of ${category.column}`,
            keyInsight: `${category.topValue} accounts for ${formatNumber(category.topPercentage * 100, 1)}% of total`
          }
        });
      }
    }
    
    // Format recommendations
    recommendations.forEach((rec, idx) => {
      report += `\n[${idx + 1}] ${rec.title}\n`;
      Object.entries(rec.config).forEach(([key, value]) => {
        report += `- ${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}\n`;
      });
    });
    
    // Dashboard Layout Suggestion
    report += createSubSection('DASHBOARD LAYOUT SUGGESTION', 
      `Top row: Time series showing overall trend
Middle row: Customer segment comparison | Geographic heat map
Bottom row: Transaction distribution | Correlation matrix`
    );
    
    // Interactive Features
    report += createSubSection('INTERACTIVE FEATURES TO INCLUDE', 
      numberedList([
        'Date range selector for time series',
        'Drill-down capability on customer segments',
        'Hover tooltips showing exact values',
        'Export functionality for each chart',
        'Filter controls for categorical variables',
        'Zoom and pan for scatter plots',
        'Click-to-filter across all charts'
      ])
    );
    
    // Color Palette Recommendation
    report += createSubSection('COLOR PALETTE RECOMMENDATION', bulletList([
      'Primary: #2E86AB (blue) for main metrics',
      'Secondary: #F24236 (red) for negative/warning values',
      'Accent: #F6AE2D (yellow) for highlights',
      'Neutral: #2F3E46 (dark gray) for text and axes',
      'Background: #FFFFFF (white) or #F8F9FA (light gray)',
      'Ensure colorblind-friendly options',
      'Use consistent colors across all visualizations'
    ]));
    
    // Technical Considerations
    report += createSubSection('TECHNICAL IMPLEMENTATION NOTES', bulletList([
      `Dataset size: ${records.length} rows - ${records.length > 10000 ? 'consider sampling or aggregation for performance' : 'suitable for client-side rendering'}`,
      `Recommended libraries: D3.js for custom visualizations, Chart.js for simple charts, Plotly for interactive dashboards`,
      numericColumns.length > 5 ? 'Consider dimensionality reduction (PCA) for correlation matrix' : '',
      dateColumns.length > 0 ? 'Implement proper date parsing and timezone handling' : '',
      'Add loading states for data processing',
      'Implement responsive design for mobile viewing'
    ].filter(Boolean)));
    
    if (spinner) {
      spinner.succeed('Visualization analysis complete!');
    }
    console.log(report);
    
    outputHandler.finalize();
    
  } catch (error) {
    outputHandler.restore();
    if (spinner) spinner.fail('Error analyzing visualizations');
    console.error(error.message);
    if (!options.quiet) process.exit(1);
    throw error;
  }
}

function findPrimaryNumericColumn(records, numericColumns) {
  // Prefer columns with 'amount', 'value', 'price', 'total' in name
  const preferredNames = ['amount', 'value', 'price', 'total', 'revenue', 'sales'];
  
  for (const preferred of preferredNames) {
    const found = numericColumns.find(col => 
      col.toLowerCase().includes(preferred)
    );
    if (found) return found;
  }
  
  // Otherwise return the numeric column with highest variance
  let maxVariance = 0;
  let bestColumn = numericColumns[0];
  
  numericColumns.forEach(col => {
    const values = records.map(r => r[col]).filter(v => typeof v === 'number');
    if (values.length > 0) {
      const variance = calculateVariance(values);
      if (variance > maxVariance) {
        maxVariance = variance;
        bestColumn = col;
      }
    }
  });
  
  return bestColumn;
}

function findMainCategoryColumn(records, categoricalColumns) {
  // Prefer columns with 'type', 'category', 'segment', 'group' in name
  const preferredNames = ['segment', 'category', 'type', 'group', 'class'];
  
  for (const preferred of preferredNames) {
    const found = categoricalColumns.find(col => 
      col.toLowerCase().includes(preferred)
    );
    if (found) return found;
  }
  
  // Otherwise return categorical column with 2-10 unique values
  const suitable = categoricalColumns.find(col => {
    const unique = new Set(records.map(r => r[col]).filter(v => v !== null)).size;
    return unique >= 2 && unique <= 10;
  });
  
  return suitable || categoricalColumns[0];
}

function analyzeTimeTrend(records, dateCol, valueCol) {
  const sorted = [...records].sort((a, b) => {
    const dateA = a[dateCol];
    const dateB = b[dateCol];
    return dateA - dateB;
  });
  
  const firstHalf = sorted.slice(0, Math.floor(sorted.length / 2));
  const secondHalf = sorted.slice(Math.floor(sorted.length / 2));
  
  const firstAvg = average(firstHalf.map(r => r[valueCol]).filter(v => typeof v === 'number'));
  const secondAvg = average(secondHalf.map(r => r[valueCol]).filter(v => typeof v === 'number'));
  
  if (secondAvg > firstAvg * 1.1) {
    return 'Clear upward trend with ' + formatNumber((secondAvg / firstAvg - 1) * 100, 1) + '% growth';
  } else if (secondAvg < firstAvg * 0.9) {
    return 'Downward trend with ' + formatNumber((1 - secondAvg / firstAvg) * 100, 1) + '% decline';
  } else {
    return 'Relatively stable with minor fluctuations';
  }
}

function analyzeCategoryDifferences(records, categoryCol, valueCol) {
  const categoryStats = {};
  
  records.forEach(record => {
    const category = record[categoryCol];
    const value = record[valueCol];
    
    if (category && typeof value === 'number') {
      if (!categoryStats[category]) {
        categoryStats[category] = [];
      }
      categoryStats[category].push(value);
    }
  });
  
  const categoryAverages = Object.entries(categoryStats)
    .map(([cat, values]) => ({
      category: cat,
      average: average(values),
      count: values.length
    }))
    .sort((a, b) => b.average - a.average);
  
  if (categoryAverages.length >= 2) {
    const highest = categoryAverages[0];
    const lowest = categoryAverages[categoryAverages.length - 1];
    const ratio = highest.average / lowest.average;
    
    return `${highest.category} ${valueCol} is ${formatNumber(ratio, 1)}x higher than ${lowest.category}`;
  }
  
  return 'Similar values across categories';
}

function checkTimeComponent(records, dateCol) {
  const sample = records.slice(0, 100).map(r => r[dateCol]).filter(d => d instanceof Date);
  return sample.some(date => date.getHours() !== 0 || date.getMinutes() !== 0);
}

function analyzeTemporalPatterns(records, dateCol) {
  const hourCounts = new Array(24).fill(0);
  const dayCounts = new Array(7).fill(0);
  
  records.forEach(record => {
    const date = record[dateCol];
    if (date instanceof Date) {
      hourCounts[date.getHours()]++;
      dayCounts[date.getDay()]++;
    }
  });
  
  const peakHour = hourCounts.indexOf(Math.max(...hourCounts));
  const peakDay = dayCounts.indexOf(Math.max(...dayCounts));
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  return `Highest activity ${dayNames[peakDay]}s ${peakHour}-${peakHour + 1} (${formatNumber(hourCounts[peakHour] / records.length * 100, 1)}% of activity)`;
}

function findStrongCorrelations(records, numericColumns) {
  const correlations = [];
  
  for (let i = 0; i < numericColumns.length; i++) {
    for (let j = i + 1; j < numericColumns.length; j++) {
      const col1 = numericColumns[i];
      const col2 = numericColumns[j];
      const values1 = records.map(r => r[col1]);
      const values2 = records.map(r => r[col2]);
      const corr = calculateCorrelation(values1, values2);
      
      if (corr !== null && Math.abs(corr) > 0.3) {
        correlations.push({
          col1,
          col2,
          correlation: corr,
          strength: Math.abs(corr) > 0.7 ? 'Strong' : 'Moderate',
          direction: corr > 0 ? 'positive relationship' : 'negative relationship'
        });
      }
    }
  }
  
  return correlations.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));
}

function describeDistribution(stats) {
  const skewDescription = stats.skewness > 1 ? 'right-skewed (long tail)' : 
                         stats.skewness < -1 ? 'left-skewed' : 
                         'approximately normal';
  
  return `${skewDescription} distribution with median ${formatCurrency(stats.median)}, mean ${formatCurrency(stats.mean)}`;
}

function findGeographicColumns(columns, columnTypes) {
  const geoKeywords = ['state', 'country', 'city', 'region', 'location', 'address', 'postcode', 'zip'];
  
  return columns.filter(col => {
    const isGeo = geoKeywords.some(keyword => col.toLowerCase().includes(keyword));
    const isAppropriateType = ['categorical', 'postcode', 'string'].includes(columnTypes[col].type);
    return isGeo && isAppropriateType;
  });
}

function findBestPieCategory(records, categoricalColumns) {
  for (const col of categoricalColumns) {
    const values = records.map(r => r[col]).filter(v => v !== null);
    const unique = new Set(values).size;
    
    if (unique >= 2 && unique <= 8) {
      const counts = {};
      values.forEach(v => counts[v] = (counts[v] || 0) + 1);
      const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
      
      return {
        column: col,
        topValue: sorted[0][0],
        topPercentage: sorted[0][1] / values.length
      };
    }
  }
  
  return null;
}

function calculateVariance(values) {
  const mean = average(values);
  return average(values.map(v => Math.pow(v - mean, 2)));
}

function average(values) {
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function formatCurrency(num) {
  return '$' + num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}