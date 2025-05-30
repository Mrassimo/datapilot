import { parseCSV, detectColumnTypes } from '../utils/parser.js';
import { calculateStats, calculateCorrelation, analyzeDistribution } from '../utils/stats.js';
import { createSection, createSubSection, formatTimestamp, formatNumber, formatPercentage, formatCurrency, bulletList, formatSmallDatasetWarning, formatDataTable } from '../utils/format.js';
import { createSamplingStrategy, performSampling, createProgressTracker } from './eda/utils/sampling.js';
import { InputValidator, SafeArrayOps, withErrorBoundary, safeGet } from '../utils/errorHandler.js';
import { OutputHandler } from '../utils/output.js';
import { basename } from 'path';
import ora from 'ora';
import { comprehensiveLLMAnalysis } from './llm/index.js';
import chalk from 'chalk';

export const llmContext = withErrorBoundary(async function llmContextInternal(filePath, options = {}) {
  const outputHandler = new OutputHandler(options);
  const spinner = options.quiet ? null : ora('Reading CSV file...').start();
  
  // Set timeout for analysis (default 60 seconds for LLM as it's more complex)
  const timeoutMs = options.timeout || 60000;
  
  const analysisPromise = performLLMAnalysis();
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(`⏱️  LLM analysis timed out after ${timeoutMs / 1000} seconds. This may indicate issues with the data format or file size.`));
    }, timeoutMs);
  });
  
  try {
    return await Promise.race([analysisPromise, timeoutPromise]);
  } catch (error) {
    outputHandler.restore();
    if (spinner) spinner.fail('LLM analysis failed or timed out');
    
    if (error.message.includes('timed out')) {
      console.error(chalk.red('🚨 LLM Analysis Timeout'));
      console.error(chalk.yellow('💡 Suggestions:'));
      console.error(chalk.yellow('   • Try using a smaller sample of your data'));
      console.error(chalk.yellow('   • Check if the CSV file has formatting issues'));
      console.error(chalk.yellow('   • Use --timeout flag to increase timeout (e.g., --timeout 120000 for 2 minutes)'));
      console.error(chalk.yellow('   • Try the --comprehensive=false flag for faster processing'));
    } else {
      console.error(error.message);
    }
    
    if (!options.quiet) process.exit(1);
    throw error;
  }
  
  async function performLLMAnalysis() {
    try {
      // Check if we should use comprehensive analysis
      const useComprehensive = options.comprehensive !== false; // Default to true
      
      // Use preloaded data if available
      let records, columnTypes, headers;
      if (options.preloadedData) {
        records = options.preloadedData.records;
        columnTypes = options.preloadedData.columnTypes;
        headers = Object.keys(columnTypes);
      } else {
        // Parse CSV with enhanced error handling
        try {
          const allRecords = await parseCSV(filePath, { quiet: options.quiet, header: options.header });
          const originalSize = allRecords.length;
          
          // Validate parsed data
          if (!allRecords || allRecords.length === 0) {
            throw new Error('No data found in CSV file. Please check the file format and content.');
          }
          
          // Create smart sampling strategy for large datasets
          const samplingStrategy = createSamplingStrategy(allRecords, 'basic');
          
          // Handle large datasets with user-friendly notifications
          let maxRowsForLLM = 10000;
          
          if (originalSize > 10000) {
            console.log(chalk.yellow(`\n⚠️  Large dataset detected: ${originalSize.toLocaleString()} rows`));
            
            if (originalSize > 50000) {
              // Very large dataset
              maxRowsForLLM = 10000;
              console.log(chalk.cyan('📊 Using intelligent sampling for LLM context generation.'));
              console.log(chalk.cyan(`   Processing ${maxRowsForLLM.toLocaleString()} representative rows...`));
            } else {
              // Medium-large dataset
              maxRowsForLLM = 20000;
              console.log(chalk.cyan('⏱️  Analysis may take up to 30 seconds...'));
              console.log(chalk.cyan(`   Processing ${Math.min(maxRowsForLLM, originalSize).toLocaleString()} rows...`));
            }
            
            if (spinner) {
              spinner.text = `Analyzing ${Math.min(maxRowsForLLM, originalSize).toLocaleString()} rows...`;
            }
          } else if (spinner) {
            spinner.text = `Analyzing ${originalSize.toLocaleString()} rows...`;
          }
          
          if (originalSize > maxRowsForLLM) {
            
            const customStrategy = {
              method: 'systematic',
              sampleSize: maxRowsForLLM,
              targetSize: maxRowsForLLM,
              sampleRate: maxRowsForLLM / originalSize
            };
            records = performSampling(allRecords, customStrategy);
            if (records.length === 0) {
              console.error('❌ Sampling returned 0 records! Falling back to first 5000 rows');
              records = allRecords.slice(0, maxRowsForLLM);
            }
            console.log(`⚠️  Large dataset sampled: ${records.length.toLocaleString()} of ${originalSize.toLocaleString()} rows`);
          } else if (samplingStrategy.method !== 'none') {
            if (spinner) {
              spinner.text = `Dataset detected (${originalSize.toLocaleString()} rows). Applying smart sampling...`;
            }
            records = performSampling(allRecords, samplingStrategy);
            console.log(`⚠️  Dataset sampled: ${records.length.toLocaleString()} of ${originalSize.toLocaleString()} rows (${samplingStrategy.method} sampling)`);
          } else {
            records = allRecords;
          }
          
          if (spinner) spinner.text = 'Generating LLM context...';
          
          try {
            columnTypes = detectColumnTypes(records);
            headers = Object.keys(columnTypes);
          } catch (typeError) {
            throw new Error(`Column type detection failed: ${typeError.message}`);
          }
          
        } catch (parseError) {
          throw new Error(`CSV parsing failed: ${parseError.message}`);
        }
      }
      
      // Add safety check for undefined values
      if (records.length > 0) {
        const sampleRecord = records[0];
        const undefinedCount = Object.values(sampleRecord).filter(v => v === undefined).length;
        if (undefinedCount > Object.keys(sampleRecord).length * 0.5) {
          console.log(chalk.yellow('⚠️  Warning: High number of undefined values detected in data.'));
          console.log(chalk.yellow('   This may indicate CSV parsing issues. Consider checking file encoding.'));
          
          // Option to continue with degraded analysis
          if (!options.force) {
            throw new Error('Data quality issues detected. Use --force flag to continue anyway.');
          }
        }
      }
      
      // Use comprehensive analysis if enabled
      if (useComprehensive && records.length > 0) {
        try {
          const result = await comprehensiveLLMAnalysis(records, headers, filePath, options);
          console.log(result.output);
          outputHandler.finalize();
          return;
        } catch (error) {
          // Fall back to original implementation if comprehensive fails
          console.error(chalk.yellow(`Comprehensive analysis failed (${error.message}), using simplified analysis...`));
        }
      }
      
      const fileName = basename(filePath);
      const columns = Object.keys(columnTypes);
      
      // Handle empty dataset
      if (records.length === 0) {
        let report = createSection('LLM-READY CONTEXT',
          `Dataset: ${fileName}\nGenerated: ${formatTimestamp()}\n\n⚠️  Empty dataset - no context to generate`);
        
        // Still include the required section header
        report += createSubSection('DATASET SUMMARY FOR AI ANALYSIS', 'No data available for analysis');
        
        console.log(report);
        outputHandler.finalize();
        return;
      }
      
      // Build report
      let report = createSection('LLM-READY CONTEXT',
        `Dataset: ${fileName}\nGenerated: ${formatTimestamp()}`);
      
      // Check for small dataset
      const smallDatasetInfo = formatSmallDatasetWarning(records.length);
      if (smallDatasetInfo) {
        report += '\n' + smallDatasetInfo.warning + '\n';
      }
      
      // Add parsing metadata
      report += createSubSection('PARSING METADATA', bulletList([
        `File encoding: ${options.encoding || 'UTF-8 (auto-detected)'}`,
        `Delimiter: ${options.delimiter || 'comma (auto-detected)'}`,
        `Header detection: ${options.header === false ? 'No headers (generated column names)' : 'Headers detected'}`,
        `Rows processed: ${records.length}`,
        `Analysis confidence: ${smallDatasetInfo ? 'Reduced due to small sample size' : 'High'}`
      ]));
      
      report += createSubSection('DATASET SUMMARY FOR AI ANALYSIS', '');
      
      // Generate natural language summary
      const dateColumns = columns.filter(col => columnTypes[col] && columnTypes[col].type === 'date');
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
      
      // For large datasets, use simpler column descriptions
      const isLargeDataset = records.length > 5000;
      
      for (let idx = 0; idx < columns.length; idx++) {
        const column = columns[idx];
        const type = safeGet(columnTypes, column, { type: 'unknown' });
        
        report += `\n${idx + 1}. ${column}: `;
        
        if (type.type === 'identifier') {
          report += `Unique identifier`;
        } else if (type.type === 'integer' || type.type === 'float') {
          if (isLargeDataset) {
            // For large datasets, just show the type without calculating stats
            report += `${inferColumnPurpose(column)} (numeric)`;
          } else {
            const values = SafeArrayOps.safeMap(records, r => safeGet(r, column), []);
            const stats = await calculateStats(values);
            const range = `range: ${formatValue(stats.min, column)} to ${formatValue(stats.max, column)}`;
            report += `${inferColumnPurpose(column)} (${range})`;
          }
        } else if (type.type === 'categorical') {
          const topValues = isLargeDataset ? 'multiple categories' : getTopCategoricalValues(SafeArrayOps.safeMap(records, r => safeGet(r, column), []), 3);
          const categoryCount = type.categories ? type.categories.length : 0;
          report += `${categoryCount} categories${isLargeDataset ? '' : `: ${topValues}`}`;
        } else if (type.type === 'date') {
          report += 'Date field';
          if (!isLargeDataset) {
            const values = SafeArrayOps.safeMap(records, r => safeGet(r, column), []);
            const dates = values.filter(v => v instanceof Date);
            if (dates.length > 0) {
              const sorted = dates.sort((a, b) => a - b);
              report += ` (${formatDate(sorted[0])} to ${formatDate(sorted[sorted.length - 1])})`;
            }
          }
        } else {
          report += type.type.charAt(0).toUpperCase() + type.type.slice(1);
        }
      }
      
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
      
      // Correlations discovered - skip for large datasets to improve performance
      if (records.length < 10000) {
        const correlations = findSignificantCorrelations(records, columns, columnTypes);
        if (correlations.length > 0) {
          report += createSubSection('CORRELATIONS DISCOVERED', '');
          correlations.forEach(corr => {
            report += `- ${corr}\n`;
          });
        }
      }
      
      // Suggested analyses
      report += createSubSection('SUGGESTED ANALYSES FOR THIS DATA', '');
      
      const suggestions = generateAnalysisSuggestions(columns, columnTypes);
      suggestions.forEach((suggestion, idx) => {
        report += `\n${idx + 1}. ${suggestion}`;
      });
      
      // Questions this data could answer
      report += '\n' + createSubSection('QUESTIONS THIS DATA COULD ANSWER', '');
      
      const questions = generateDataQuestions(columns, columnTypes, dataType, records);
      questions.forEach(question => {
        report += `- ${question}\n`;
      });
      
      // Technical notes - skip for large datasets to improve performance
      if (records.length < 10000) {
        report += createSubSection('TECHNICAL NOTES FOR ANALYSIS', '');
        
        const technicalNotes = await generateTechnicalNotes(records, columns, columnTypes);
        technicalNotes.forEach(note => {
          report += `- ${note}\n`;
        });
      }
      
      // Show sample data for context
      if (records.length > 0) {
        report += createSubSection('SAMPLE DATA', 'First 5 rows and last 5 rows:');
        const sampleRows = [
          ...records.slice(0, 5),
          ...(records.length > 10 ? records.slice(-5) : [])
        ];
        report += formatDataTable(sampleRows, columns.slice(0, 5)); // Show first 5 columns
        if (columns.length > 5) {
          report += `\n(${columns.length - 5} additional columns not shown in sample)\n`;
        }
      }
      
      // Add suggested validation queries
      report += createSubSection('VALIDATION QUERIES', 'SQL queries to verify data integrity:');
      const validationQueries = generateValidationQueries(columns, columnTypes, records);
      validationQueries.forEach((query, idx) => {
        report += `\n${idx + 1}. ${query.purpose}:\n\`\`\`sql\n${query.sql}\n\`\`\`\n`;
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
}, null, { function: 'llmContext' });

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
  
  // Medical/Healthcare detection
  if (columnNames.includes('patient') || columnNames.includes('diagnosis') || 
      columnNames.includes('treatment') || columnNames.includes('medical') ||
      columnNames.includes('health') || columnNames.includes('disease') ||
      columnNames.includes('symptom') || columnNames.includes('medication') ||
      columnNames.includes('glucose') || columnNames.includes('blood') ||
      columnNames.includes('diabetes') || columnNames.includes('bmi')) {
    return 'medical/healthcare data';
  }
  
  // Scientific/Research detection
  if (columnNames.includes('experiment') || columnNames.includes('sample') ||
      columnNames.includes('measurement') || columnNames.includes('observation') ||
      columnNames.includes('hypothesis') || columnNames.includes('control')) {
    return 'scientific/research data';
  }
  
  // Educational detection
  if (columnNames.includes('student') || columnNames.includes('grade') ||
      columnNames.includes('score') || columnNames.includes('course') ||
      columnNames.includes('exam') || columnNames.includes('attendance')) {
    return 'educational data';
  }
  
  // Environmental detection
  if (columnNames.includes('temperature') || columnNames.includes('humidity') ||
      columnNames.includes('pollution') || columnNames.includes('emission') ||
      columnNames.includes('climate') || columnNames.includes('weather')) {
    return 'environmental data';
  }
  
  // Manufacturing detection
  if (columnNames.includes('defect') || columnNames.includes('quality') ||
      columnNames.includes('production') || columnNames.includes('batch') ||
      columnNames.includes('assembly') || columnNames.includes('inspection')) {
    return 'manufacturing/quality data';
  }
  
  // Transportation detection
  if (columnNames.includes('route') || columnNames.includes('trip') ||
      columnNames.includes('vehicle') || columnNames.includes('driver') ||
      columnNames.includes('delivery') || columnNames.includes('shipment')) {
    return 'transportation/logistics data';
  }
  
  // Insurance/Financial detection
  if (columnNames.includes('insurance') || columnNames.includes('premium') ||
      columnNames.includes('policy') || columnNames.includes('claim') ||
      columnNames.includes('coverage') || columnNames.includes('deductible') ||
      (columnNames.includes('charges') && columnNames.includes('smoker')) ||
      (columnNames.includes('charges') && columnNames.includes('bmi'))) {
    return 'insurance/financial data';
  }
  
  // Business/Sales detection (moved after specific domains)
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
  
  return 'structured data';
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
  if (!values || !Array.isArray(values) || values.length === 0) {
    return 'No values';
  }
  
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

export function analyzeSeasonality(records, dateColumn, columns, columnTypes) {
  const numericColumns = columns.filter(c => columnTypes[c] && ['integer', 'float'].includes(columnTypes[c].type));
  if (numericColumns.length === 0) return null;
  
  const monthlyData = {};
  
  // Performance optimization: Use sampling for large datasets
  const samplingStrategy = createSamplingStrategy(records, 'timeseries');
  const sampledRecords = performSampling(records, samplingStrategy);
  
  SafeArrayOps.safeForEach(sampledRecords, record => {
    const date = safeGet(record, dateColumn);
    if (date instanceof Date) {
      const month = date.getMonth();
      if (!monthlyData[month]) monthlyData[month] = [];
      
      SafeArrayOps.safeForEach(numericColumns, col => {
        const value = safeGet(record, col);
        if (typeof value === 'number') {
          monthlyData[month].push(value);
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
    c.toLowerCase().includes('category')
  ).filter(c => columnTypes[c] && columnTypes[c].type === 'categorical');
  
  if (segmentColumns.length === 0) return null;
  
  const valueColumns = columns.filter(c => 
    (c.toLowerCase().includes('amount') || c.toLowerCase().includes('value')) &&
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
    
    return {
      title: 'CUSTOMER BEHAVIOR',
      insight: `${top.name} customers account for ${formatPercentage(top.percentage)} of customer base but ${formatPercentage(topValueShare)} of value. Average ${valueCol}: ${formatCurrency(top.average)}`
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
  
  // Check for zero amounts
  const amountColumns = columns.filter(c => 
    c.toLowerCase().includes('amount') &&
    columnTypes[c] && ['integer', 'float'].includes(columnTypes[c].type)
  );
  
  amountColumns.forEach(col => {
    const zeros = records.filter(r => r[col] === 0).length;
    if (zeros > 0) {
      anomalies.push(`${zeros} transactions with $0 ${col} (likely returns or errors)`);
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
  
  // Customer/entity statistics
  const customerColumns = columns.filter(c => 
    c.toLowerCase().includes('customer') && 
    columnTypes[c] && columnTypes[c].type === 'identifier'
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
  const dateColumns = columns.filter(c => columnTypes[c] && columnTypes[c].type === 'date');
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
  const dataType = inferDataType(columns, columnTypes);
  
  // Medical/Healthcare specific suggestions
  if (dataType === 'medical/healthcare data') {
    if (columns.some(c => c.toLowerCase().includes('patient'))) {
      suggestions.push('Patient outcome analysis and risk stratification');
      suggestions.push('Treatment effectiveness comparison');
    }
    if (columns.some(c => c.toLowerCase().includes('diagnosis') || c.toLowerCase().includes('condition'))) {
      suggestions.push('Disease progression modeling');
      suggestions.push('Comorbidity analysis');
    }
    if (columns.some(c => c.toLowerCase().includes('medication') || c.toLowerCase().includes('treatment'))) {
      suggestions.push('Treatment pattern analysis');
      suggestions.push('Medication adherence tracking');
    }
    if (columns.some(c => columnTypes[c] && columnTypes[c].type === 'date')) {
      suggestions.push('Temporal analysis of health trends');
      suggestions.push('Readmission risk prediction');
    }
    return suggestions;
  }
  
  // Scientific/Research specific suggestions
  if (dataType === 'scientific/research data') {
    suggestions.push('Statistical hypothesis testing');
    suggestions.push('Correlation and causation analysis');
    suggestions.push('Experimental design optimization');
    if (columns.some(c => columnTypes[c] && columnTypes[c].type === 'date')) {
      suggestions.push('Time series analysis of measurements');
    }
    return suggestions;
  }
  
  // Educational specific suggestions
  if (dataType === 'educational data') {
    suggestions.push('Student performance prediction');
    suggestions.push('Learning pattern analysis');
    suggestions.push('Grade distribution analysis');
    if (columns.some(c => c.toLowerCase().includes('attendance'))) {
      suggestions.push('Attendance impact on performance');
    }
    return suggestions;
  }
  
  // Default business suggestions for other data types
  // Check for customer analysis potential
  if (columns.some(c => c.toLowerCase().includes('customer'))) {
    suggestions.push('Customer Lifetime Value (CLV) calculation and segmentation');
  }
  
  // Check for product analysis
  if (columns.some(c => c.toLowerCase().includes('product') || c.toLowerCase().includes('sku'))) {
    suggestions.push('Market basket analysis to find product associations');
  }
  
  // Check for time series potential
  if (columns.some(c => columnTypes[c] && columnTypes[c].type === 'date')) {
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
  if (columns.some(c => c.toLowerCase().includes('transaction'))) {
    suggestions.push('Fraud detection for suspicious transaction patterns');
  }
  
  // Check for A/B testing
  if (columns.some(c => columnTypes[c] && columnTypes[c].type === 'categorical' && columnTypes[c].categories && columnTypes[c].categories.length === 2)) {
    suggestions.push('A/B test analysis for binary categorical variables');
  }
  
  return suggestions;
}

export function generateDataQuestions(columns, columnTypes, dataType, records = []) {
  const questions = [];
  
  // Medical/Healthcare questions
  if (dataType === 'medical/healthcare data') {
    questions.push('What are the key risk factors for adverse patient outcomes?');
    questions.push('Which treatments show the highest effectiveness rates?');
    questions.push('Are there patterns in patient demographics and health conditions?');
    questions.push('What factors correlate with successful treatment outcomes?');
    questions.push('How do different patient groups respond to various treatments?');
  }
  // Scientific/Research questions
  else if (dataType === 'scientific/research data') {
    questions.push('What are the statistically significant findings?');
    questions.push('Which variables show the strongest correlations?');
    questions.push('Are there any unexpected patterns in the data?');
    questions.push('What factors influence the experimental outcomes?');
    questions.push('How do the results compare to the hypothesis?');
  }
  // Educational questions
  else if (dataType === 'educational data') {
    questions.push('What factors most influence student performance?');
    questions.push('Are there patterns in learning outcomes by demographics?');
    questions.push('Which teaching methods yield the best results?');
    questions.push('How does attendance correlate with grades?');
    questions.push('What early indicators predict student success?');
  }
  // Environmental questions
  else if (dataType === 'environmental data') {
    questions.push('What are the main environmental trends over time?');
    questions.push('Which factors contribute most to environmental changes?');
    questions.push('Are there seasonal patterns in the data?');
    questions.push('What are the critical threshold values?');
    questions.push('How do different regions compare?');
  }
  // Manufacturing questions
  else if (dataType === 'manufacturing/quality data') {
    questions.push('What are the main causes of defects?');
    questions.push('Which production lines have the highest quality?');
    questions.push('Are there patterns in quality issues by shift or time?');
    questions.push('What factors correlate with production efficiency?');
    questions.push('How can the process be optimized?');
  }
  // Business/Sales questions (only for actual business data)
  else if (dataType.includes('sales') || dataType.includes('transaction')) {
    questions.push('What factors drive sales performance?');
    questions.push('Which products/services generate the most revenue?');
    questions.push('What are the seasonal trends in sales?');
  }
  else if (dataType.includes('customer')) {
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
  
  if (columns.some(c => columnTypes[c] && columnTypes[c].type === 'date')) {
    questions.push('What are the growth trends over time?');
    questions.push('Are there any cyclical patterns?');
  }
  
  // Risk-related questions
  if (records && records.length > 1000) {
    questions.push('Which records represent outliers or anomalies?');
    questions.push('What patterns indicate risk or opportunity?');
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
  
  // Check for cyclical features
  const dateColumns = columns.filter(c => columnTypes[c] && columnTypes[c].type === 'date');
  if (dateColumns.length > 0) {
    notes.push('Consider encoding cyclical features for day_of_week and month');
  }
  
  // Check for high cardinality
  const highCardColumns = columns.filter(c => {
    if (columnTypes[c] && columnTypes[c].type === 'identifier') return true;
    if (columnTypes[c] && columnTypes[c].type === 'categorical' && columnTypes[c].categories) {
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

function generateValidationQueries(columns, columnTypes, records) {
  const queries = [];
  const tableName = 'your_table'; // Placeholder
  
  // Check for orphaned foreign keys
  columns.forEach(col => {
    if (col.toLowerCase().includes('_id') && !col.toLowerCase().includes('transaction_id')) {
      const targetTable = col.replace('_id', '').toLowerCase();
      queries.push({
        purpose: `Verify ${col} foreign key relationship`,
        sql: `SELECT COUNT(*) as orphaned_records 
FROM ${tableName} t1
WHERE t1.${col} NOT IN (
  SELECT ${col} FROM ${targetTable}
) AND t1.${col} IS NOT NULL`
      });
    }
  });
  
  // Check date format consistency
  const dateColumns = columns.filter(c => columnTypes[c] && columnTypes[c].type === 'date');
  dateColumns.forEach(col => {
    queries.push({
      purpose: `Check ${col} date format consistency`,
      sql: `SELECT 
  COUNT(DISTINCT DATE_FORMAT(${col}, '%Y-%m-%d')) as formats,
  MIN(${col}) as earliest_date,
  MAX(${col}) as latest_date
FROM ${tableName}
WHERE ${col} IS NOT NULL`
    });
  });
  
  // Check for duplicate identifiers
  const idColumns = columns.filter(c => columnTypes[c] && columnTypes[c].type === 'identifier');
  if (idColumns.length > 0) {
    queries.push({
      purpose: `Check for duplicate ${idColumns[0]} values`,
      sql: `SELECT ${idColumns[0]}, COUNT(*) as occurrences
FROM ${tableName}
GROUP BY ${idColumns[0]}
HAVING COUNT(*) > 1
ORDER BY occurrences DESC
LIMIT 10`
    });
  }
  
  // Check numeric column ranges
  const numericColumns = columns.filter(c => columnTypes[c] && ['integer', 'float'].includes(columnTypes[c].type));
  if (numericColumns.length > 0) {
    const col = numericColumns[0];
    queries.push({
      purpose: `Verify ${col} value ranges and outliers`,
      sql: `WITH stats AS (
  SELECT 
    AVG(${col}) as mean,
    STDDEV(${col}) as std_dev
  FROM ${tableName}
  WHERE ${col} IS NOT NULL
)
SELECT COUNT(*) as outliers
FROM ${tableName}, stats
WHERE ${col} > mean + 3 * std_dev
   OR ${col} < mean - 3 * std_dev`
    });
  }
  
  return queries.slice(0, 5); // Limit to 5 most relevant queries
}