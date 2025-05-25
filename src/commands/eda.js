import { parseCSV, detectColumnTypes } from '../utils/parser.js';
import { calculateStats, calculateCorrelation, analyzeDistribution } from '../utils/stats.js';
import { createSection, createSubSection, formatColumnAnalysis, formatTimestamp, formatNumber, formatPercentage, bulletList, formatFileSize, formatSmallDatasetWarning, formatDataTable } from '../utils/format.js';
import { statSync } from 'fs';
import { basename } from 'path';
import ora from 'ora';
import { OutputHandler } from '../utils/output.js';

export async function eda(filePath, options = {}) {
  const outputHandler = new OutputHandler(options);
  const spinner = options.quiet ? null : ora('Reading CSV file...').start();
  
  try {
    // Use preloaded data if available (from 'all' command)
    let records, columnTypes;
    if (options.preloadedData) {
      records = options.preloadedData.records;
      columnTypes = options.preloadedData.columnTypes;
    } else {
      // Parse CSV
      records = await parseCSV(filePath, { quiet: options.quiet, header: options.header });
      if (spinner) spinner.text = 'Analyzing data...';
      columnTypes = detectColumnTypes(records);
    }
    
    // Get file info
    const fileStats = statSync(filePath);
    const fileName = basename(filePath);
    
    const columns = Object.keys(columnTypes);
    
    // Handle empty dataset
    if (records.length === 0) {
      const report = createSection('EXPLORATORY DATA ANALYSIS REPORT', 
        `Dataset: ${fileName}\nGenerated: ${formatTimestamp()}\n\n⚠️  Empty dataset - no data to analyze`);
      console.log(report);
      outputHandler.finalize();
      return;
    }
    
    // Build report
    let report = createSection('EXPLORATORY DATA ANALYSIS REPORT', 
      `Dataset: ${fileName}\nGenerated: ${formatTimestamp()}`);
    
    // Check for small dataset
    const smallDatasetInfo = formatSmallDatasetWarning(records.length);
    if (smallDatasetInfo) {
      report += '\n' + smallDatasetInfo.warning + '\n';
    }
    
    // Dataset overview
    report += createSubSection('DATASET OVERVIEW', bulletList([
      `Total rows: ${records.length.toLocaleString()}`,
      `Total columns: ${columns.length}`,
      `File size: ${formatFileSize(fileStats.size)}`,
      records.length > 0 && columnTypes[columns[0]]?.type === 'date' ? 
        `Date range: ${getDateRange(records, columns[0])}` : 
        'No date column detected'
    ]));
    
    // Show full data for tiny datasets
    if (smallDatasetInfo?.showFullData) {
      report += createSubSection('COMPLETE DATASET', 
        'Since this is a small dataset, here is the complete data:\n' + 
        formatDataTable(records, columns));
    }
    
    // Column Analysis
    report += createSubSection('COLUMN ANALYSIS', '');
    
    columns.forEach((column, idx) => {
      report += `\n[Column ${idx + 1}/${columns.length}] ${column}\n`;
      
      const values = records.map(r => r[column]);
      const type = columnTypes[column];
      
      // Show confidence if available
      if (type.confidence && type.confidence < 1) {
        report += `- Type confidence: ${formatPercentage(type.confidence)}\n`;
      }
      
      if (type.type === 'integer' || type.type === 'float') {
        const stats = calculateStats(values);
        const distribution = analyzeDistribution(values);
        
        report += formatColumnAnalysis(column, stats, type);
        
        if (distribution.description && !options.quick) {
          report += `\n- ${distribution.description}`;
        }
      } else if (type.type === 'categorical') {
        const valueCounts = {};
        values.forEach(v => {
          if (v !== null) {
            valueCounts[v] = (valueCounts[v] || 0) + 1;
          }
        });
        
        const sortedValues = Object.entries(valueCounts)
          .sort((a, b) => b[1] - a[1]);
        
        report += `- Data type: ${type.type}\n`;
        report += `- Unique values: ${type.categories.length}\n`;
        report += `- Top values:\n`;
        sortedValues.slice(0, 5).forEach(([val, count]) => {
          report += `  * "${val}": ${count} (${formatPercentage(count / records.length)})\n`;
        });
      } else if (type.type === 'identifier') {
        const uniqueCount = new Set(values.filter(v => v !== null)).size;
        report += `- Data type: Unique identifier (${formatPercentage(uniqueCount / records.length)} unique values)\n`;
        report += `- Non-null count: ${values.filter(v => v !== null).length} (${formatPercentage(values.filter(v => v !== null).length / records.length)})\n`;
        report += uniqueCount === records.length ? '- No duplicates found\n' : `- Duplicate values: ${records.length - uniqueCount}\n`;
        report += '- Appears to be primary key\n';
      } else if (type.type === 'date') {
        const dates = values.filter(v => v instanceof Date);
        report += `- Data type: Date\n`;
        report += `- Non-null count: ${dates.length} (${formatPercentage(dates.length / records.length)})\n`;
        if (dates.length > 0) {
          const sortedDates = dates.sort((a, b) => a - b);
          report += `- Date range: ${formatDate(sortedDates[0])} to ${formatDate(sortedDates[sortedDates.length - 1])}\n`;
        }
        // Show format info if available
        if (type.formats) {
          report += `- Detected formats: ${type.formats.join(', ')}\n`;
        }
        if (type.ambiguousCount) {
          report += `- Ambiguous dates: ${type.ambiguousCount} entries (e.g., ${type.ambiguousExamples.join(', ')})\n`;
        }
      } else {
        report += `- Data type: ${type.type}\n`;
        report += `- Non-null count: ${values.filter(v => v !== null).length} (${formatPercentage(values.filter(v => v !== null).length / records.length)})\n`;
      }
    });
    
    // Correlation Insights (skip in quick mode)
    if (!options.quick) {
      const numericColumns = columns.filter(col => 
        ['integer', 'float'].includes(columnTypes[col].type)
      );
      
      const correlations = [];
      
      if (numericColumns.length >= 2) {
        report += createSubSection('CORRELATION INSIGHTS', '');
        
        for (let i = 0; i < numericColumns.length; i++) {
          for (let j = i + 1; j < numericColumns.length; j++) {
            const col1 = numericColumns[i];
            const col2 = numericColumns[j];
            const values1 = records.map(r => r[col1]);
            const values2 = records.map(r => r[col2]);
            const corr = calculateCorrelation(values1, values2);
            
            if (corr !== null && Math.abs(corr) > 0.3) {
              correlations.push({ col1, col2, correlation: corr });
            }
          }
        }
        
        correlations
          .sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation))
          .slice(0, 5)
          .forEach(({ col1, col2, correlation }) => {
            const strength = Math.abs(correlation) > 0.7 ? 'Strong' : 'Moderate';
            const direction = correlation > 0 ? 'positive' : 'negative';
            report += `- ${strength} ${direction} correlation (${formatNumber(correlation, 2)}) between ${col1} and ${col2}\n`;
          });
      }
    }
    
    // Key Patterns Detected (skip detailed patterns in quick mode)
    if (!options.quick) {
      report += createSubSection('KEY PATTERNS DETECTED', '');
      
      let patternCount = 1;
      
      // Check for seasonal patterns in date columns
      const dateColumns = columns.filter(col => columnTypes[col].type === 'date');
      const numericColumns = columns.filter(col => 
        ['integer', 'float'].includes(columnTypes[col].type)
      );
      
      if (dateColumns.length > 0 && numericColumns.length > 0) {
        const dateCol = dateColumns[0];
        const dates = records.map(r => r[dateCol]).filter(d => d instanceof Date);
        
        if (dates.length > 30) {
          const monthlyAverages = {};
          records.forEach(record => {
            const date = record[dateCol];
            if (date instanceof Date) {
              const month = date.getMonth();
              numericColumns.forEach(numCol => {
                if (!monthlyAverages[numCol]) monthlyAverages[numCol] = {};
                if (!monthlyAverages[numCol][month]) monthlyAverages[numCol][month] = [];
                if (typeof record[numCol] === 'number') {
                  monthlyAverages[numCol][month].push(record[numCol]);
                }
              });
            }
          });
          
          numericColumns.forEach(numCol => {
            const monthAvgs = Object.entries(monthlyAverages[numCol] || {})
              .map(([month, values]) => ({
                month: parseInt(month),
                avg: values.reduce((a, b) => a + b, 0) / values.length
              }))
              .filter(m => !isNaN(m.avg));
            
            if (monthAvgs.length >= 6) {
              const overallAvg = monthAvgs.reduce((a, b) => a + b.avg, 0) / monthAvgs.length;
              const maxMonth = monthAvgs.reduce((a, b) => a.avg > b.avg ? a : b);
              
              if (maxMonth.avg > overallAvg * 1.2) {
                const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                                    'July', 'August', 'September', 'October', 'November', 'December'];
                report += `${patternCount}. Seasonal trend: ${monthNames[maxMonth.month]} ${numCol} is ${formatPercentage((maxMonth.avg / overallAvg) - 1)} higher than average\n`;
                patternCount++;
              }
            }
          });
        }
      }
      
      // Check for missing data patterns
      const missingPatterns = [];
      columns.forEach(col => {
        const values = records.map(r => r[col]);
        const missingCount = values.filter(v => v === null || v === undefined).length;
        if (missingCount > records.length * 0.05) {
          missingPatterns.push({ column: col, percentage: missingCount / records.length });
        }
      });
      
      if (missingPatterns.length > 0) {
        report += `${patternCount}. Missing data concentrated in: ${missingPatterns
          .sort((a, b) => b.percentage - a.percentage)
          .slice(0, 3)
          .map(p => `${p.column} (${formatPercentage(p.percentage)})`)
          .join(', ')}\n`;
        patternCount++;
      }
    }
    
    // Data Quality Summary
    const totalCells = records.length * columns.length;
    const filledCells = columns.reduce((sum, col) => {
      const values = records.map(r => r[col]);
      return sum + values.filter(v => v !== null && v !== undefined).length;
    }, 0);
    
    const completeness = filledCells / totalCells;
    const dateColumns = columns.filter(col => columnTypes[col].type === 'date');
    
    report += createSubSection('DATA QUALITY SUMMARY', bulletList([
      `Completeness: ${formatPercentage(completeness)} (${completeness > 0.9 ? 'good' : completeness > 0.7 ? 'fair' : 'poor'})`,
      `Duplicate rows: ${findDuplicateRows(records)} ${findDuplicateRows(records) === 0 ? '(excellent)' : '(consider deduplication)'}`,
      `Columns with >10% missing: ${columns.filter(col => {
        const values = records.map(r => r[col]);
        const missingCount = values.filter(v => v === null || v === undefined).length;
        return missingCount > records.length * 0.1;
      }).length}`,
      `Date consistency: ${dateColumns.length > 0 ? 'All dates are valid and within expected range' : 'No date columns found'}`
    ]));
    
    // Recommendations
    if (!options.quick) {
      report += createSubSection('RECOMMENDATIONS FOR ANALYSIS', '');
      
      const recommendations = [];
      const numericColumns = columns.filter(col => 
        ['integer', 'float'].includes(columnTypes[col].type)
      );
      
      // Check for skewed distributions
      numericColumns.forEach(col => {
        const values = records.map(r => r[col]);
        const stats = calculateStats(values);
        if (Math.abs(stats.skewness) > 2) {
          recommendations.push(`The high skew in ${col} suggests using median for central tendency`);
          recommendations.push(`Consider log transformation for ${col} in predictive models`);
        }
      });
      
      const correlations = [];
      for (let i = 0; i < numericColumns.length; i++) {
        for (let j = i + 1; j < numericColumns.length; j++) {
          const col1 = numericColumns[i];
          const col2 = numericColumns[j];
          const values1 = records.map(r => r[col1]);
          const values2 = records.map(r => r[col2]);
          const corr = calculateCorrelation(values1, values2);
          if (corr !== null && Math.abs(corr) > 0.3) {
            correlations.push({ col1, col2, correlation: corr });
          }
        }
      }
      
      if (correlations.length > 0) {
        const highCorr = correlations.filter(c => Math.abs(c.correlation) > 0.7);
        if (highCorr.length > 0) {
          recommendations.push(`High correlations detected - consider multicollinearity in models`);
        }
      }
      
      const missingPatterns = columns.filter(col => {
        const values = records.map(r => r[col]);
        const missingCount = values.filter(v => v === null || v === undefined).length;
        return missingCount > records.length * 0.05;
      });
      
      if (missingPatterns.length > 0) {
        recommendations.push(`Investigate missing data patterns - consider imputation strategies`);
      }
      
      report += numberedList(recommendations.slice(0, 5));
    }
    
    if (spinner) spinner.succeed('Analysis complete!');
    console.log(report);
    
    outputHandler.finalize();
    
  } catch (error) {
    outputHandler.restore();
    if (spinner) spinner.fail('Error analyzing file');
    console.error(error.message);
    if (!options.quiet) process.exit(1);
    throw error;
  }
}

function getDateRange(records, dateColumn) {
  const dates = records
    .map(r => r[dateColumn])
    .filter(d => d instanceof Date)
    .sort((a, b) => a - b);
  
  if (dates.length === 0) return 'No valid dates';
  
  return `${formatDate(dates[0])} to ${formatDate(dates[dates.length - 1])}`;
}

function formatDate(date) {
  if (!(date instanceof Date)) return 'Invalid date';
  return date.toISOString().split('T')[0];
}

function findDuplicateRows(records) {
  const seen = new Set();
  let duplicates = 0;
  
  records.forEach(record => {
    const key = JSON.stringify(record);
    if (seen.has(key)) {
      duplicates++;
    } else {
      seen.add(key);
    }
  });
  
  return duplicates;
}

function numberedList(items) {
  return items.map((item, idx) => `${idx + 1}. ${item}`).join('\n');
}