import { statSync } from 'fs';
import { basename } from 'path';
import ora from 'ora';
import chalk from 'chalk';

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
import { performTimeSeriesAnalysis } from './analysers/timeseries.js';
import { validateAustralianData, generateAustralianInsights } from './analysers/australian.js';
import { assessMLReadiness } from './analysers/mlReadiness.js';

// Import formatters
import { formatComprehensiveEDAReport } from './formatters/textFormatter.js';

// Import utilities
import { parseCSV, detectColumnTypes } from '../../utils/parser.js';
import { OutputHandler } from '../../utils/output.js';
import { formatFileSize } from '../../utils/format.js';
import { createSamplingStrategy, performSampling, createProgressTracker } from './utils/sampling.js';

export async function edaComprehensive(filePath, options = {}) {
  const outputHandler = new OutputHandler(options);
  const spinner = options.quiet ? null : ora('Performing comprehensive EDA analysis...').start();
  
  // Structured data mode for LLM consumption
  const structuredMode = options.structuredOutput || options.llmMode;
  
  // Set timeout for analysis (default 60 seconds for large datasets)
  const timeoutMs = options.timeout || 60000;
  
  const analysisPromise = performAnalysis();
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(`⏱️  EDA analysis timed out after ${timeoutMs / 1000} seconds. This may indicate issues with the data format or file size.`));
    }, timeoutMs);
  });
  
  try {
    return await Promise.race([analysisPromise, timeoutPromise]);
  } catch (error) {
    outputHandler.restore();
    if (spinner) spinner.fail('Analysis failed or timed out');
    
    if (error.message.includes('timed out')) {
      console.error(chalk.red('🚨 EDA Analysis Timeout'));
      console.error(chalk.yellow('💡 Suggestions:'));
      console.error(chalk.yellow('   • Try using a smaller sample of your data'));
      console.error(chalk.yellow('   • Check if the CSV file has formatting issues'));
      console.error(chalk.yellow('   • Use --timeout flag to increase timeout (e.g., --timeout 60000 for 1 minute)'));
      console.error(chalk.yellow('   • Try the EDA function on a subset of columns'));
    } else {
      console.error(error.message);
    }
    
    if (!options.quiet) process.exit(1);
    throw error;
  }
  
  async function performAnalysis() {
    try {
      // Use preloaded data if available
      let records, columnTypes;
      if (options.preloadedData) {
        records = options.preloadedData.records;
        columnTypes = options.preloadedData.columnTypes;
      } else {
        // Parse CSV with enhanced error handling
        if (spinner) spinner.text = 'Reading CSV file...';
        try {
          records = await parseCSV(filePath, { quiet: options.quiet, header: options.header });
        } catch (parseError) {
          throw new Error(`CSV parsing failed: ${parseError.message}`);
        }
        
        // Validate parsed data
        if (!records || records.length === 0) {
          throw new Error('No data found in CSV file. Please check the file format and content.');
        }
        
        if (spinner) spinner.text = 'Detecting column types...';
        const typeStart = Date.now();
        try {
          columnTypes = detectColumnTypes(records);
          console.log(`Column type detection took ${Date.now() - typeStart}ms`);
        } catch (typeError) {
          throw new Error(`Column type detection failed: ${typeError.message}`);
        }
      }
      
      // Get file info
      const fileStats = statSync(filePath);
      const fileName = basename(filePath);
      const columns = Object.keys(columnTypes);
      
      // Apply sampling for large datasets
      const originalRecordCount = records.length;
      if (records.length > 10000) {
        if (spinner) spinner.text = `Sampling large dataset (${records.length} rows)...`;
        const samplingStrategy = createSamplingStrategy(records, 'basic');
        // For EDA, use max 5000 rows for analysis
        samplingStrategy.sampleSize = Math.min(5000, samplingStrategy.sampleSize);
        records = performSampling(records, samplingStrategy);
        if (spinner) spinner.text = `Analyzing sample of ${records.length} rows from ${originalRecordCount} total rows...`;
      }
      
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
      
      // Add safety check for undefined values
      const sampleRecord = records[0];
      const undefinedCount = Object.values(sampleRecord).filter(v => v === undefined).length;
      if (undefinedCount > Object.keys(sampleRecord).length * 0.5) {
        console.log(chalk.yellow('⚠️  Warning: High number of undefined values detected in data.'));
        console.log(chalk.yellow('   This may indicate CSV parsing issues. Consider checking file encoding.'));
      }
      
      // Detect what analyses to run with timeout protection
      if (spinner) spinner.text = 'Detecting analysis requirements...';
      const analysisNeeds = detectAnalysisNeeds(records, columnTypes);
      
      // For very large datasets, disable expensive analyses
      if (records.length > 10000) {
        analysisNeeds.regression = false;
        analysisNeeds.cart = false;
        analysisNeeds.correlationAnalysis = false;
        analysisNeeds.timeSeries = false;
        analysisNeeds.mlReadiness = false;
      }
      
      // Initialize analysis object
      const analysis = {
        fileName,
        fileSize: formatFileSize(fileStats.size),
        rowCount: originalRecordCount,
        columnCount: columns.length,
        sampledRows: records.length < originalRecordCount ? records.length : undefined,
        columns: [],
        numericColumnCount: 0,
        categoricalColumnCount: 0,
        dateColumns: [],
        completeness: 0,
        duplicateCount: 0,
        insights: [],
        suggestions: [],
        processingTime: new Date()
      };
      
      // Basic column analysis with enhanced stats and timeout protection
      if (spinner) spinner.text = 'Calculating enhanced statistics...';
      
      const columnAnalyses = {};
      let totalNonNull = 0;
      
      // Process columns with timeout protection  
      const sampleForStats = records.slice(0, Math.min(5000, records.length));
      
      for (const column of columns) {
        try {
          const type = columnTypes[column];
          // For large datasets, estimate non-null ratio from sample
          const sampleValues = sampleForStats.map(r => r[column]);
          const nonNullInSample = sampleValues.filter(v => v !== null && v !== undefined).length;
          const nonNullRatio = nonNullInSample / sampleForStats.length;
          const estimatedNonNullCount = Math.round(nonNullRatio * records.length);
          
          // Use sampled values for stats
          const values = sampleValues.filter(v => v !== null && v !== undefined);
          
          const columnAnalysis = {
            name: column,
            type: type.type,
            nonNullRatio: nonNullRatio
          };
          
          totalNonNull += estimatedNonNullCount;
          
          // Add timeout protection for expensive calculations
          if (['integer', 'float'].includes(type.type) && values.length > 0) {
            const statsPromise = Promise.resolve(calculateEnhancedStats(values));
            const statsTimeout = new Promise((_, reject) => {
              setTimeout(() => reject(new Error('Stats calculation timeout')), 5000);
            });
            
            try {
              columnAnalysis.stats = await Promise.race([statsPromise, statsTimeout]);
              analysis.numericColumnCount++;
            } catch (statsError) {
              console.log(chalk.yellow(`⚠️  Skipping stats for column ${column}: ${statsError.message}`));
              columnAnalysis.stats = { error: 'Calculation timeout' };
              analysis.numericColumnCount++;
            }
          } else if (type.type === 'categorical' && values.length > 0) {
            try {
              columnAnalysis.stats = calculateCategoricalStats(values);
              analysis.categoricalColumnCount++;
            } catch (catError) {
              console.log(chalk.yellow(`⚠️  Skipping categorical stats for column ${column}: ${catError.message}`));
              columnAnalysis.stats = { error: 'Calculation failed' };
              analysis.categoricalColumnCount++;
            }
          } else if (type.type === 'date') {
            analysis.dateColumns.push(column);
          }
          
          analysis.columns.push(columnAnalysis);
          columnAnalyses[column] = columnAnalysis;
          
        } catch (columnError) {
          console.log(chalk.yellow(`⚠️  Error processing column ${column}: ${columnError.message}`));
          // Continue with next column
        }
      }
      
      analysis.completeness = totalNonNull / (records.length * columns.length);
      analysis.completenessLevel = analysis.completeness > 0.9 ? 'good' : 
                                   analysis.completeness > 0.7 ? 'fair' : 'poor';
      
      // Count duplicates with timeout protection
      try {
        if (spinner) spinner.text = 'Checking for duplicates...';
        const duplicatePromise = Promise.resolve((() => {
          const seen = new Set();
          let duplicates = 0;
          // Limit duplicate checking for very large datasets
          const checkLimit = Math.min(records.length, 10000);
          records.slice(0, checkLimit).forEach(record => {
            const key = JSON.stringify(record);
            if (seen.has(key)) duplicates++;
            else seen.add(key);
          });
          return duplicates;
        })());
        
        const duplicateTimeout = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Duplicate check timeout')), 5000);
        });
        
        analysis.duplicateCount = await Promise.race([duplicatePromise, duplicateTimeout]);
      } catch (dupError) {
        console.log(chalk.yellow(`⚠️  Skipping duplicate check: ${dupError.message}`));
        analysis.duplicateCount = 0;
      }
      
      // Distribution analysis
      if (analysisNeeds.distributionTesting) {
        if (spinner) spinner.text = 'Analyzing distributions...';
        analysis.distributionAnalysis = {};
        
        const numericColumns = columns.filter(col => 
          ['integer', 'float'].includes(columnTypes[col].type)
        );
        
        for (const col of numericColumns) {
          const values = records.map(r => r[col]);
          analysis.distributionAnalysis[col] = await analyzeDistribution(values);
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
      
      // CART analysis (skip for large datasets)
      if (analysisNeeds.cart && records.length < 5000) {
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
      } else if (analysisNeeds.cart) {
        analysis.cartAnalysis = { skipped: true, reason: 'Dataset too large' };
      }
      
      // Regression analysis (skip for large datasets)
      if (analysisNeeds.regression && records.length < 5000) {
        if (spinner) spinner.text = 'Performing regression analysis...';
        analysis.regressionAnalysis = performRegressionAnalysis(
          records, 
          columns, 
          columnTypes
        );
      } else if (analysisNeeds.regression) {
        analysis.regressionAnalysis = { skipped: true, reason: 'Dataset too large' };
      }
      
      // Correlation analysis (skip for large datasets)
      if (analysisNeeds.correlationAnalysis && records.length < 5000) {
        if (spinner) spinner.text = 'Analyzing correlations...';
        analysis.correlationAnalysis = performCorrelationAnalysis(records, columns, columnTypes);
      } else if (analysisNeeds.correlationAnalysis) {
        if (spinner) spinner.text = 'Skipping correlation analysis for large dataset...';
        analysis.correlationAnalysis = { skipped: true, reason: 'Dataset too large' };
      }
      
      // Pattern detection (limit for large datasets)
      if (analysisNeeds.patternDetection) {
        if (spinner) spinner.text = 'Detecting patterns...';
        const patternRecords = records.length > 5000 ? records.slice(0, 5000) : records;
        analysis.patterns = detectPatterns(patternRecords, columns, columnTypes);
        if (records.length > 5000) {
          analysis.patterns.note = 'Analyzed first 5000 rows for patterns';
        }
      }
      
      // Time series analysis (limit for large datasets)
      if (analysisNeeds.timeSeries && records.length < 10000) {
        if (spinner) spinner.text = 'Analyzing time series...';
        const dateColumn = analysis.dateColumns[0]; // Use first date column
        const numericColumns = columns.filter(col => 
          ['integer', 'float'].includes(columnTypes[col].type)
        );
        
        if (dateColumn && numericColumns.length > 0) {
          analysis.timeSeriesAnalysis = performTimeSeriesAnalysis(
            records, 
            dateColumn, 
            numericColumns
          );
        }
      } else if (analysisNeeds.timeSeries) {
        analysis.timeSeriesAnalysis = { skipped: true, reason: 'Dataset too large for time series analysis' };
      }
      
      // Australian data validation
      if (analysisNeeds.australianData) {
        if (spinner) spinner.text = 'Validating Australian data patterns...';
        analysis.australianValidation = validateAustralianData(records, columns, columnTypes);
        
        if (analysis.australianValidation.detected) {
          const australianInsights = generateAustralianInsights(analysis.australianValidation);
          analysis.insights = [...(analysis.insights || []), ...australianInsights];
        }
      }
      
      // ML readiness assessment
      if (analysisNeeds.mlReadiness) {
        if (spinner) spinner.text = 'Assessing ML readiness...';
        analysis.mlReadiness = assessMLReadiness(records, columns, columnTypes, analysis);
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
      
      // Return structured data if requested for LLM consumption
      if (structuredMode) {
        if (spinner) spinner.succeed('Comprehensive EDA analysis complete!');
        return {
          analysis,
          structuredResults: {
            statisticalInsights: analysis.insights || [],
            dataQuality: {
              completeness: analysis.completeness,
              duplicateRows: analysis.duplicateCount / analysis.rowCount,
              outlierPercentage: analysis.outlierRate || 0
            },
            correlations: analysis.correlationAnalysis?.correlations || [],
            distributions: analysis.distributionAnalysis ? 
              Object.entries(analysis.distributionAnalysis).map(([col, dist]) => ({
                column: col,
                ...dist
              })) : [],
            timeSeries: analysis.timeSeriesAnalysis || null,
            summaryStats: analysis.columns.reduce((acc, col) => {
              acc[col.name] = col.stats;
              return acc;
            }, {}),
            mlReadiness: analysis.mlReadiness || { overallScore: 0.8, majorIssues: [] },
            columns: analysis.columns.map(col => col.name)
          }
        };
      }
      
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