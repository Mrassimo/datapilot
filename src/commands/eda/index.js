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
import { formatCompactEDAReport } from './formatters/compactFormatter.js';

// Import utilities
import { parseCSV, detectColumnTypes } from '../../utils/parser.js';
import { OutputHandler } from '../../utils/output.js';
import { formatFileSize } from '../../utils/format.js';
import { createSamplingStrategy, performSampling, createProgressTracker } from './utils/sampling.js';
import { ResumeManager, ResumableProgressTracker } from '../../utils/resumeManager.js';
import { estimateProcessingTime, formatEstimatedTime, shouldUseSampling, askUserForSampling, displaySamplingInfo, isNonInteractive } from '../../utils/progressEstimator.js';

export async function edaComprehensive(filePath, options = {}) {
  const outputHandler = new OutputHandler(options);
  const spinner = options.quiet ? null : ora('Performing comprehensive EDA analysis...').start();
  
  // Structured data mode for LLM consumption
  const structuredMode = options.structuredOutput || options.llmMode;
  
  // Incremental output for large datasets
  const incrementalMode = options.incremental || false;
  
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
      // Performance timing for detailed analysis
      const timingLog = [];
      const startTime = Date.now();
      
      // Resume capability for large files
      const resumeManager = new ResumeManager(filePath, 'eda');
      let resumeData = null;
      
      // Check for existing resume data
      if (resumeManager.hasResumeData()) {
        resumeData = await ResumeManager.promptForResume(resumeManager);
      }
      
      // Initialize progress tracker with time estimation for large files
      const shouldEstimateProgress = options.estimateProgress || 
        (resumeManager.fileStats && resumeManager.fileStats.size > 10 * 1024 * 1024); // > 10MB
      
      const progressTracker = shouldEstimateProgress ? 
        new EstimatedProgressTracker(filePath, 'eda') :
        new ResumableProgressTracker(8, resumeManager, 0);
      
      // Use preloaded data if available or resume from saved state
      let records, columnTypes;
      if (resumeData && resumeData.data.records) {
        records = resumeData.data.records;
        columnTypes = resumeData.data.columnTypes;
        console.log(chalk.green('📂 Loaded data from resume checkpoint'));
        progressTracker.currentStage = 2; // Skip parsing stages
      } else if (options.preloadedData) {
        records = options.preloadedData.records;
        columnTypes = options.preloadedData.columnTypes;
      } else {
        // Parse CSV with enhanced error handling
        if (spinner) spinner.text = 'Reading CSV file...';
        progressTracker.advance('Reading CSV file');
        
        const parseStart = Date.now();
        try {
          records = await parseCSV(filePath, { quiet: options.quiet, header: options.header });
          timingLog.push(`CSV parsing: ${Date.now() - parseStart}ms`);
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
          timingLog.push(`Column type detection: ${Date.now() - typeStart}ms`);
          
          // Save checkpoint after parsing for large files
          if (records.length > 50000) {
            resumeManager.createCheckpoint('parsing_complete', { records, columnTypes }, 20);
          }
          
          progressTracker.advance('Column type detection', { records: records.length, columns: Object.keys(columnTypes).length });
        } catch (typeError) {
          throw new Error(`Column type detection failed: ${typeError.message}`);
        }
      }
      
      // Get file info
      const fileStats = statSync(filePath);
      const fileName = basename(filePath);
      const columns = Object.keys(columnTypes);
      
      // Note: Smart sampling is now handled earlier based on time estimation
      // Set up incremental output for very large remaining datasets  
      let useIncrementalOutput = records.length > 50000;
      
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
      const analysisStart = Date.now();
      
      const analysisNeeds = detectAnalysisNeeds(records, columnTypes);
      timingLog.push(`Analysis detection: ${Date.now() - analysisStart}ms`);
      
      // Store original record count before any sampling
      const originalRecordCount = records.length;
      
      // Smart time estimation and sampling
      const estimatedTime = estimateProcessingTime(records.length, analysisNeeds);
      const samplingDecision = shouldUseSampling(records.length, estimatedTime, {
        alwaysSample: options.alwaysSample || 120,
        askUser: options.askUser || 60,
        autoSample: options.autoSample || 30,
        minRowsForSampling: options.minRowsForSampling || 5000
      });
      
      // Handle sampling based on time estimation
      if (samplingDecision.shouldSample === true) {
        // Auto-sampling
        console.log(chalk.yellow(`\n⏱️  Processing Time Estimate: ${formatEstimatedTime(estimatedTime)}`));
        console.log(chalk.cyan('🚀 Auto-applying smart sampling for optimal performance...'));
        
        const samplingStrategy = createSamplingStrategy(records, 'basic');
        samplingStrategy.method = 'random';  // Force sampling method
        samplingStrategy.sampleSize = samplingDecision.sampleSize;
        samplingStrategy.samplingRate = samplingDecision.sampleSize / records.length;
        records = performSampling(records, samplingStrategy);
        displaySamplingInfo(originalRecordCount, records.length, samplingDecision.reason);
        
      } else if (samplingDecision.shouldSample === 'ask_user' && !isNonInteractive() && !options.force) {
        // Interactive user prompt
        const userChoice = await askUserForSampling(records.length, estimatedTime, samplingDecision.sampleSize);
        
        if (userChoice.useSampling) {
          const samplingStrategy = createSamplingStrategy(records, 'basic');
          samplingStrategy.method = 'random';  // Force sampling method
          samplingStrategy.sampleSize = userChoice.sampleSize;
          samplingStrategy.samplingRate = userChoice.sampleSize / records.length;
          records = performSampling(records, samplingStrategy);
          displaySamplingInfo(originalRecordCount, records.length, 'user_choice');
        } else {
          console.log(chalk.yellow(`⏱️  Processing full dataset (${formatEstimatedTime(estimatedTime)})...`));
        }
        
      } else if (samplingDecision.shouldSample === 'ask_user' && (isNonInteractive() || options.force)) {
        // Non-interactive environment - auto-sample
        console.log(chalk.yellow(`\n⏱️  Processing Time Estimate: ${formatEstimatedTime(estimatedTime)}`));
        console.log(chalk.cyan('🤖 Non-interactive mode: Auto-applying smart sampling...'));
        
        const samplingStrategy = createSamplingStrategy(records, 'basic');
        samplingStrategy.method = 'random';  // Force sampling method
        samplingStrategy.sampleSize = samplingDecision.sampleSize;
        samplingStrategy.samplingRate = samplingDecision.sampleSize / records.length;
        records = performSampling(records, samplingStrategy);
        displaySamplingInfo(originalRecordCount, records.length, 'auto_sample_non_interactive');
        
      } else if (estimatedTime > 30) {
        // Show time estimate even if not sampling
        console.log(chalk.yellow(`\n⏱️  Processing Time Estimate: ${formatEstimatedTime(estimatedTime)}`));
      }
      
      // Update spinner with current processing status
      if (spinner && records.length !== originalRecordCount) {
        spinner.text = `Analyzing ${records.length.toLocaleString()} sampled rows...`;
      } else if (spinner) {
        spinner.text = `Processing ${records.length.toLocaleString()} rows...`;
      }
      
      // For extremely large datasets, disable expensive analyses (smart sampling should handle most cases)
      if (records.length > 50000) {
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
      const statsStart = Date.now();
      
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
          } else if (type.type === 'boolean' && values.length > 0) {
            // Treat boolean columns as categorical for better insights
            // Especially for columns like smoker (yes/no) which are more meaningful as categories
            columnAnalysis.type = 'categorical'; // Override type for display
            try {
              // Convert boolean values back to meaningful labels if possible
              const categoricalValues = values.map(v => {
                if (column.toLowerCase().includes('smoker')) {
                  return v === true ? 'yes' : 'no';
                } else {
                  return v ? 'true' : 'false';
                }
              });
              columnAnalysis.stats = calculateCategoricalStats(categoricalValues);
              analysis.categoricalColumnCount++;
            } catch (catError) {
              console.log(chalk.yellow(`⚠️  Skipping categorical stats for boolean column ${column}: ${catError.message}`));
              columnAnalysis.stats = { error: 'Calculation failed' };
              analysis.categoricalColumnCount++;
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
      timingLog.push(`Column statistics: ${Date.now() - statsStart}ms`);
      progressTracker.advance('Column statistics analysis', { completeness: analysis.completeness });
      
      // Save checkpoint after basic statistics for large files
      if (records.length > 20000) {
        resumeManager.createCheckpoint('basic_stats_complete', { analysis }, 40);
      }
      
      // Incremental output: Show basic statistics immediately for large datasets
      if (useIncrementalOutput && !structuredMode) {
        outputIncrementalResults('BASIC_STATS', {
          fileName,
          rowCount: originalRecordCount,
          columnCount: columns.length,
          columns: analysis.columns.slice(0, 5), // Show first 5 columns
          completeness: analysis.completeness
        });
      }
      
      analysis.completeness = totalNonNull / (records.length * columns.length);
      analysis.completenessLevel = analysis.completeness > 0.9 ? 'good' : 
                                   analysis.completeness > 0.7 ? 'fair' : 'poor';
      
      
      // Count duplicates with timeout protection
      const duplicateStart = Date.now();
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
        timingLog.push(`Duplicate check: ${Date.now() - duplicateStart}ms`);
      } catch (dupError) {
        console.log(chalk.yellow(`⚠️  Skipping duplicate check: ${dupError.message}`));
        analysis.duplicateCount = 0;
        timingLog.push(`Duplicate check (failed): ${Date.now() - duplicateStart}ms`);
      }
      
      // Distribution analysis
      if (analysisNeeds.distributionTesting) {
        const distStart = Date.now();
        if (spinner) spinner.text = 'Analyzing distributions...';
        analysis.distributionAnalysis = {};
        
        const numericColumns = columns.filter(col => 
          ['integer', 'float'].includes(columnTypes[col].type)
        );
        
        for (const col of numericColumns) {
          try {
            const values = records.map(r => r[col]);
            
            analysis.distributionAnalysis[col] = await analyzeDistribution(values);
          } catch (distError) {
            throw distError;
          }
        }
        timingLog.push(`Distribution analysis: ${Date.now() - distStart}ms`);
      }
      
      // Outlier analysis
      if (analysisNeeds.outlierAnalysis) {
        const outlierStart = Date.now();
        if (spinner) spinner.text = 'Detecting outliers...';
        analysis.outlierAnalysis = {};
        
        const numericColumns = columns.filter(col => 
          ['integer', 'float'].includes(columnTypes[col].type)
        );
        
        let totalOutliers = 0;
        for (const col of numericColumns) {
          try {
            const values = records.map(r => r[col]);
            
            const outlierResult = detectOutliers(values, col);
            
            analysis.outlierAnalysis[col] = outlierResult;
            if (outlierResult.aggregated) {
              totalOutliers += outlierResult.aggregated.length;
            }
          } catch (outlierError) {
            throw outlierError;
          }
        }
        
        analysis.outlierRate = totalOutliers / (records.length * numericColumns.length);
        timingLog.push(`Outlier analysis: ${Date.now() - outlierStart}ms`);
      }
      
      // CART analysis (reasonable limit with smart sampling)
      if (analysisNeeds.cart && records.length < 10000) {
        if (spinner) spinner.text = 'Performing CART analysis...';
        
        try {
          const targets = findPotentialTargets(records, columnTypes);
          
          if (targets.length > 0) {
            analysis.cartAnalysis = await performCARTAnalysis(
              records, 
              columns, 
              columnTypes, 
              targets[0].column
            );
          } else {
            analysis.cartAnalysis = { applicable: false, reason: 'No suitable target variables found' };
          }
        } catch (cartError) {
          analysis.cartAnalysis = { applicable: false, reason: `Error: ${cartError.message}` };
        }
      } else if (analysisNeeds.cart) {
        analysis.cartAnalysis = { skipped: true, reason: 'Dataset too large' };
      }
      
      // Regression analysis (skip for large datasets)
      if (analysisNeeds.regression && records.length < 5000) {
        if (spinner) spinner.text = 'Performing regression analysis...';
        
        try {
          analysis.regressionAnalysis = await performRegressionAnalysis(
            records, 
            columns, 
            columnTypes
          );
        } catch (regressionError) {
          throw regressionError;
        }
      } else if (analysisNeeds.regression) {
        analysis.regressionAnalysis = { skipped: true, reason: 'Dataset too large' };
      }
      
      // Correlation analysis (reasonable limit with smart sampling)
      if (analysisNeeds.correlationAnalysis && records.length < 15000) {
        if (spinner) spinner.text = 'Analyzing correlations...';
        
        try {
          analysis.correlationAnalysis = performCorrelationAnalysis(records, columns, columnTypes);
        } catch (correlationError) {
          throw correlationError;
        }
      } else if (analysisNeeds.correlationAnalysis) {
        if (spinner) spinner.text = 'Skipping correlation analysis for large dataset...';
        analysis.correlationAnalysis = { skipped: true, reason: 'Dataset too large' };
      }
      
      // Pattern detection (limit for large datasets)
      if (analysisNeeds.patternDetection) {
        if (spinner) spinner.text = 'Detecting patterns...';
        
        try {
          const patternRecords = records.length > 5000 ? records.slice(0, 5000) : records;
          
          analysis.patterns = detectPatterns(patternRecords, columns, columnTypes);
          
          if (records.length > 5000) {
            analysis.patterns.note = 'Analyzed first 5000 rows for patterns';
          }
        } catch (patternError) {
          throw patternError;
        }
      }
      
      // Time series analysis (limit for large datasets)
      if (analysisNeeds.timeSeries && records.length < 10000) {
        if (spinner) spinner.text = 'Analyzing time series...';
        
        try {
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
          } else {
          }
        } catch (timeSeriesError) {
          throw timeSeriesError;
        }
      } else if (analysisNeeds.timeSeries) {
        analysis.timeSeriesAnalysis = { skipped: true, reason: 'Dataset too large for time series analysis' };
      }
      
      // Australian data validation
      if (analysisNeeds.australianData) {
        if (spinner) spinner.text = 'Validating Australian data patterns...';
        
        try {
          analysis.australianValidation = await validateAustralianData(records, columns, columnTypes);
          
          if (analysis.australianValidation.detected) {
            const australianInsights = generateAustralianInsights(analysis.australianValidation);
            analysis.insights = [...(analysis.insights || []), ...australianInsights];
          }
        } catch (australianError) {
          throw australianError;
        }
      }
      
      // ML readiness assessment
      if (analysisNeeds.mlReadiness) {
        if (spinner) spinner.text = 'Assessing ML readiness...';
        
        try {
          analysis.mlReadiness = assessMLReadiness(records, columns, columnTypes, analysis);
        } catch (mlError) {
          throw mlError;
        }
      }
      
      // Generate insights
      try {
        analysis.insights = generateInsights(analysis);
      } catch (insightsError) {
        throw insightsError;
      }
      
      try {
        analysis.suggestions = generateSuggestions(analysis, analysisNeeds);
      } catch (suggestionsError) {
        throw suggestionsError;
      }
      
      // Calculate final metrics
      try {
        analysis.consistencyScore = calculateConsistencyScore(analysis);
        
        analysis.highMissingColumns = columns.filter(col => {
          const stats = columnAnalyses[col];
          return stats && (1 - stats.nonNullRatio) > 0.1;
        }).length;
      } catch (metricsError) {
        throw metricsError;
      }
      
      // Return structured data if requested for LLM consumption
      if (structuredMode) {
        try {
          if (spinner) spinner.succeed('Comprehensive EDA analysis complete!');
          
          const dataQuality = {
            completeness: analysis.completeness,
            duplicateRows: analysis.duplicateCount / analysis.rowCount,
            outlierPercentage: analysis.outlierRate || 0
          };
          
          const correlations = analysis.correlationAnalysis?.correlations || [];
          
          const distributions = analysis.distributionAnalysis ? 
            Object.entries(analysis.distributionAnalysis).map(([col, dist]) => ({
              column: col,
              ...dist
            })) : [];
          
          
          const summaryStats = analysis.columns.reduce((acc, col) => {
            acc[col.name] = col.stats;
            return acc;
          }, {});
          
          const columnNames = analysis.columns.map(col => col.name);
          
          return {
            analysis,
            structuredResults: {
              statisticalInsights: analysis.insights || [],
              dataQuality,
              correlations,
              distributions,
              timeSeries: analysis.timeSeriesAnalysis || null,
              summaryStats,
              mlReadiness: analysis.mlReadiness || { overallScore: 0.8, majorIssues: [] },
              columns: columnNames
            }
          };
        } catch (structuredError) {
          throw structuredError;
        }
      }
      
      // Output timing analysis for debugging
      timingLog.push(`Total analysis time: ${Date.now() - startTime}ms`);
      
      // Show timing breakdown for large datasets or debug mode
      if (records.length > 50000 || options.debug) {
        console.log(chalk.cyan('\n⏱️  Performance Timing Breakdown:'));
        timingLog.forEach((timing, idx) => {
          console.log(chalk.gray(`   ${idx + 1}. ${timing}`));
        });
        console.log(''); // Add spacing
      }
      
      // Format and output report
      try {
        const report = options.compact ? 
          formatCompactEDAReport(analysis) : 
          formatComprehensiveEDAReport(analysis);
        
        if (spinner) spinner.succeed('Comprehensive EDA analysis complete!');
        progressTracker.complete();
        console.log(report);
        
        outputHandler.finalize();
      } catch (reportError) {
        throw reportError;
      }
      
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

function outputIncrementalResults(stage, data) {
  // Output partial results immediately for large datasets
  console.log(chalk.cyan(`\n📊 ${stage} Results Available:`));
  
  switch (stage) {
    case 'BASIC_STATS':
      console.log(chalk.white(`Dataset: ${data.fileName}`));
      console.log(chalk.white(`Rows: ${data.rowCount.toLocaleString()}, Columns: ${data.columnCount}`));
      console.log(chalk.white(`Completeness: ${(data.completeness * 100).toFixed(1)}%`));
      
      if (data.columns && data.columns.length > 0) {
        console.log(chalk.white('\nFirst 5 Columns:'));
        data.columns.forEach((col, idx) => {
          console.log(chalk.gray(`  ${idx + 1}. ${col.name} (${col.type})`));
        });
      }
      console.log(chalk.gray('Continuing analysis...'));
      break;
      
    case 'DISTRIBUTIONS':
      console.log(chalk.white(`Distribution analysis complete for ${Object.keys(data).length} columns`));
      console.log(chalk.gray('Proceeding to outlier detection...'));
      break;
      
    case 'PATTERNS':
      console.log(chalk.white(`Pattern detection complete`));
      console.log(chalk.gray('Finalizing report...'));
      break;
  }
}