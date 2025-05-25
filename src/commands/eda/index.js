import { statSync } from 'fs';
import { basename } from 'path';
import ora from 'ora';

// Import detectors
import { detectAnalysisNeeds, findPotentialTargets } from './detectors/dataTypeDetector.js';
import { detectPatterns } from './detectors/patternDetector.js';

// Import analysers
import { calculateEnhancedStats, calculateCategoricalStats } from './analysers/basicStats.js';
import { analyzeDistribution } from './analysers/distributions.js';
import { detectOutliers } from './analysers/outliers.js';
import { performCARTAnalysis } from './analysers/cart.js';
import { performRegressionAnalysis } from './analysers/regression.js';
import { performCorrelationAnalysis } from './analysers/correlations.js';

// Import formatters
import { formatComprehensiveEDAReport } from './formatters/textFormatter.js';

// Import utilities
import { parseCSV, detectColumnTypes } from '../../utils/parser.js';
import { OutputHandler } from '../../utils/output.js';
import { formatFileSize } from '../../utils/format.js';

export async function edaComprehensive(filePath, options = {}) {
  const outputHandler = new OutputHandler(options);
  const spinner = options.quiet ? null : ora('Performing comprehensive EDA analysis...').start();
  
  try {
    // Use preloaded data if available
    let records, columnTypes;
    if (options.preloadedData) {
      records = options.preloadedData.records;
      columnTypes = options.preloadedData.columnTypes;
    } else {
      // Parse CSV
      if (spinner) spinner.text = 'Reading CSV file...';
      records = await parseCSV(filePath, { quiet: options.quiet, header: options.header });
      
      if (spinner) spinner.text = 'Detecting column types...';
      columnTypes = detectColumnTypes(records);
    }
    
    // Get file info
    const fileStats = statSync(filePath);
    const fileName = basename(filePath);
    const columns = Object.keys(columnTypes);
    
    // Handle empty dataset
    if (records.length === 0) {
      const report = formatComprehensiveEDAReport({
        fileName,
        rowCount: 0,
        columnCount: 0,
        empty: true
      });
      console.log(report);
      outputHandler.finalize();
      return;
    }
    
    // Detect what analyses to run
    if (spinner) spinner.text = 'Detecting analysis requirements...';
    const analysisNeeds = detectAnalysisNeeds(records, columnTypes);
    
    // Initialize analysis object
    const analysis = {
      fileName,
      fileSize: formatFileSize(fileStats.size),
      rowCount: records.length,
      columnCount: columns.length,
      columns: [],
      numericColumnCount: 0,
      categoricalColumnCount: 0,
      dateColumns: [],
      completeness: 0,
      duplicateCount: 0,
      insights: [],
      suggestions: []
    };
    
    // Basic column analysis with enhanced stats
    if (spinner) spinner.text = 'Calculating enhanced statistics...';
    
    const columnAnalyses = {};
    let totalNonNull = 0;
    
    for (const column of columns) {
      const type = columnTypes[column];
      const values = records.map(r => r[column]);
      
      const columnAnalysis = {
        name: column,
        type: type.type,
        nonNullRatio: values.filter(v => v !== null && v !== undefined).length / values.length
      };
      
      totalNonNull += values.filter(v => v !== null && v !== undefined).length;
      
      if (['integer', 'float'].includes(type.type)) {
        columnAnalysis.stats = calculateEnhancedStats(values);
        analysis.numericColumnCount++;
      } else if (type.type === 'categorical') {
        columnAnalysis.stats = calculateCategoricalStats(values);
        analysis.categoricalColumnCount++;
      } else if (type.type === 'date') {
        analysis.dateColumns.push(column);
      }
      
      analysis.columns.push(columnAnalysis);
      columnAnalyses[column] = columnAnalysis;
    }
    
    analysis.completeness = totalNonNull / (records.length * columns.length);
    analysis.completenessLevel = analysis.completeness > 0.9 ? 'good' : 
                                 analysis.completeness > 0.7 ? 'fair' : 'poor';
    
    // Count duplicates
    const seen = new Set();
    let duplicates = 0;
    records.forEach(record => {
      const key = JSON.stringify(record);
      if (seen.has(key)) duplicates++;
      else seen.add(key);
    });
    analysis.duplicateCount = duplicates;
    
    // Distribution analysis
    if (analysisNeeds.distributionTesting) {
      if (spinner) spinner.text = 'Analyzing distributions...';
      analysis.distributionAnalysis = {};
      
      const numericColumns = columns.filter(col => 
        ['integer', 'float'].includes(columnTypes[col].type)
      );
      
      for (const col of numericColumns) {
        const values = records.map(r => r[col]);
        analysis.distributionAnalysis[col] = analyzeDistribution(values);
      }
    }
    
    // Outlier analysis
    if (analysisNeeds.outlierAnalysis) {
      if (spinner) spinner.text = 'Detecting outliers...';
      analysis.outlierAnalysis = {};
      
      const numericColumns = columns.filter(col => 
        ['integer', 'float'].includes(columnTypes[col].type)
      );
      
      let totalOutliers = 0;
      for (const col of numericColumns) {
        const values = records.map(r => r[col]);
        const outlierResult = detectOutliers(values, col);
        analysis.outlierAnalysis[col] = outlierResult;
        if (outlierResult.aggregated) {
          totalOutliers += outlierResult.aggregated.length;
        }
      }
      
      analysis.outlierRate = totalOutliers / (records.length * numericColumns.length);
    }
    
    // CART analysis
    if (analysisNeeds.cart) {
      if (spinner) spinner.text = 'Performing CART analysis...';
      const targets = findPotentialTargets(records, columnTypes);
      if (targets.length > 0) {
        analysis.cartAnalysis = performCARTAnalysis(
          records, 
          columns, 
          columnTypes, 
          targets[0].column
        );
      }
    }
    
    // Regression analysis
    if (analysisNeeds.regression) {
      if (spinner) spinner.text = 'Performing regression analysis...';
      analysis.regressionAnalysis = performRegressionAnalysis(
        records, 
        columns, 
        columnTypes
      );
    }
    
    // Correlation analysis
    if (analysisNeeds.correlationAnalysis) {
      if (spinner) spinner.text = 'Analyzing correlations...';
      analysis.correlationAnalysis = performCorrelationAnalysis(records, columns, columnTypes);
    }
    
    // Pattern detection
    if (analysisNeeds.patternDetection) {
      if (spinner) spinner.text = 'Detecting patterns...';
      analysis.patterns = detectPatterns(records, columns, columnTypes);
    }
    
    // Generate insights
    analysis.insights = generateInsights(analysis);
    analysis.suggestions = generateSuggestions(analysis, analysisNeeds);
    
    // Calculate final metrics
    analysis.consistencyScore = calculateConsistencyScore(analysis);
    analysis.highMissingColumns = columns.filter(col => {
      const stats = columnAnalyses[col];
      return stats && (1 - stats.nonNullRatio) > 0.1;
    }).length;
    
    // Format and output report
    const report = formatComprehensiveEDAReport(analysis);
    
    if (spinner) spinner.succeed('Comprehensive EDA analysis complete!');
    console.log(report);
    
    outputHandler.finalize();
    
  } catch (error) {
    outputHandler.restore();
    if (spinner) spinner.fail('Error during analysis');
    console.error(error.message);
    if (!options.quiet) process.exit(1);
    throw error;
  }
}

function generateInsights(analysis) {
  const insights = [];
  
  // Data quality insights
  if (analysis.completeness < 0.8) {
    insights.push(`Data completeness is ${(analysis.completeness * 100).toFixed(1)}% - consider data imputation strategies`);
  }
  
  if (analysis.duplicateCount > analysis.rowCount * 0.05) {
    insights.push(`${analysis.duplicateCount} duplicate rows detected - investigate data collection process`);
  }
  
  // Distribution insights
  if (analysis.distributionAnalysis) {
    const nonNormal = Object.entries(analysis.distributionAnalysis)
      .filter(([_, dist]) => dist.tests && dist.tests.normality && !dist.tests.normality.isNormal);
    
    if (nonNormal.length > 0) {
      insights.push(`${nonNormal.length} numeric columns show non-normal distributions`);
    }
  }
  
  // Outlier insights
  if (analysis.outlierAnalysis && analysis.outlierRate > 0.05) {
    insights.push(`High outlier prevalence (${(analysis.outlierRate * 100).toFixed(1)}%) - review data quality`);
  }
  
  // Model insights
  if (analysis.regressionAnalysis && analysis.regressionAnalysis.bestModel) {
    const r2 = analysis.regressionAnalysis.bestModel.adjustedR2;
    if (r2 > 0.7) {
      insights.push(`Strong predictive relationships found (R²=${r2.toFixed(3)})`);
    }
  }
  
  if (analysis.cartAnalysis && analysis.cartAnalysis.segments) {
    insights.push(`${analysis.cartAnalysis.segments.length} distinct business segments identified`);
  }
  
  // Pattern insights
  if (analysis.patterns && analysis.patterns.benfordLaw) {
    const violations = analysis.patterns.benfordLaw.filter(b => !b.followsBenford);
    if (violations.length > 0) {
      insights.push('Potential data quality issues detected via Benford\'s Law');
    }
  }
  
  return insights.length > 0 ? insights : ['Dataset appears well-structured with no major issues'];
}

function generateSuggestions(analysis, analysisNeeds) {
  const suggestions = [];
  
  // Based on data characteristics
  if (analysis.numericColumnCount >= 3 && !analysisNeeds.regression) {
    suggestions.push({
      title: 'Multivariate Analysis',
      rationale: 'Multiple numeric columns available for deeper analysis',
      approach: 'Consider PCA or factor analysis to identify latent variables'
    });
  }
  
  if (analysis.dateColumns.length > 0 && !analysisNeeds.timeSeries) {
    suggestions.push({
      title: 'Time-based Aggregation',
      rationale: 'Date columns present but no clear time series pattern',
      approach: 'Aggregate by time periods to reveal hidden trends'
    });
  }
  
  // Based on findings
  if (analysis.outlierRate > 0.1) {
    suggestions.push({
      title: 'Robust Statistical Methods',
      rationale: 'High outlier prevalence may skew traditional analyses',
      approach: 'Use median-based statistics and robust regression techniques'
    });
  }
  
  if (analysis.patterns && analysis.patterns.duplicatePatterns.length > 0) {
    suggestions.push({
      title: 'Entity Resolution',
      rationale: 'Duplicate patterns suggest potential entity matching issues',
      approach: 'Implement fuzzy matching to identify related records'
    });
  }
  
  return suggestions;
}

function calculateConsistencyScore(analysis) {
  let score = 10;
  
  // Deduct for quality issues
  if (analysis.completeness < 0.9) score -= 2;
  if (analysis.duplicateCount > 0) score -= 1;
  if (analysis.outlierRate > 0.1) score -= 2;
  if (analysis.highMissingColumns > 0) score -= 1;
  
  // Deduct for consistency issues
  if (analysis.patterns && analysis.patterns.anomalies && analysis.patterns.anomalies.length > 0) {
    score -= analysis.patterns.anomalies.length * 0.5;
  }
  
  return Math.max(0, Math.round(score));
}