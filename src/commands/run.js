/**
 * RUN COMMAND - Comprehensive Data Analysis
 * Combines EDA (statistical analysis) + INT (quality checks) + LLM-optimized output
 */

import { parseCSV, detectColumnTypes } from '../utils/parser.js';
import { EDAEngine } from '../analysis/edaEngine.js';
import { QualityEngine } from '../analysis/qualityEngine.js';
import { OutputHandler } from '../utils/output.js';
import { formatTimestamp, createSection, createSubSection, formatPercentage, formatNumber } from '../utils/format.js';
import { basename } from 'path';
import ora from 'ora';
import chalk from 'chalk';
import { edaComprehensive } from './eda/index.js';
import { comprehensiveIntegrityAnalysis } from './int/index.js';

export async function run(filePath, options = {}) {
  const outputHandler = new OutputHandler(options);
  const spinner = options.quiet ? null : ora('Starting comprehensive analysis...').start();
  
  try {
    // Parse data
    if (spinner) spinner.text = 'Reading data...';
    const data = await parseCSV(filePath, { quiet: options.quiet });
    
    if (!data || data.length === 0) {
      throw new Error('No data found in CSV file');
    }
    
    // Detect column types
    if (spinner) spinner.text = 'Analyzing data structure...';
    const columnTypes = detectColumnTypes(data);
    const headers = Object.keys(columnTypes);
    const fileName = basename(filePath);
    
    // Prepare data for sub-commands
    const preloadedData = {
      records: data,
      columnTypes,
      headers
    };
    
    // Create enhanced options
    const enhancedOptions = {
      ...options,
      preloadedData,
      structuredOutput: true,
      quiet: true
    };
    
    // Run EDA analysis
    if (spinner) spinner.text = 'Performing statistical analysis...';
    const edaResults = await edaComprehensive(filePath, enhancedOptions);
    
    // Run INT analysis
    if (spinner) spinner.text = 'Analyzing data quality...';
    const intResults = await comprehensiveIntegrityAnalysis(data, headers, columnTypes, fileName);
    
    if (spinner) spinner.succeed('Analysis complete!');
    
    // Generate LLM-optimized combined report
    const report = generateCombinedReport(fileName, data.length, edaResults, intResults);
    
    console.log(report);
    outputHandler.finalize();
    
    return {
      eda: edaResults,
      quality: intResults,
      report
    };
    
  } catch (error) {
    if (spinner) spinner.fail('Analysis failed');
    console.error(chalk.red(`❌ Error: ${error.message}`));
    outputHandler.restore();
    if (!options.quiet) process.exit(1);
    throw error;
  }
}

function generateCombinedReport(fileName, recordCount, edaResults, intResults) {
  let report = '';
  
  // Header
  report += chalk.cyan('🤖 DATAPILOT COMPREHENSIVE ANALYSIS\n');
  report += chalk.cyan('===================================\n');
  report += `${chalk.gray('Dataset:')} ${fileName} (${recordCount.toLocaleString()} records)\n`;
  report += `${chalk.gray('Generated:')} ${formatTimestamp()}\n\n`;
  
  // Extract key findings from EDA
  const edaAnalysis = edaResults.analysis || {};
  const structuredEDA = edaResults.structuredResults || {};
  
  // Extract key findings from INT
  const qualityScore = intResults.qualityScore || {};
  const dimensions = intResults.dimensions || {};
  
  // Executive Summary
  report += createSection('EXECUTIVE SUMMARY', '');
  
  // Quality Overview
  report += chalk.yellow(`📊 Data Quality: ${qualityScore.grade?.letter || 'Unknown'} (${qualityScore.overallScore || 0}/100)\n`);
  if (qualityScore.summary) {
    report += `   ${qualityScore.summary}\n`;
  }
  report += '\n';
  
  // Statistical Overview
  if (edaAnalysis.insights && edaAnalysis.insights.length > 0) {
    report += chalk.yellow('🎯 Key Statistical Insights:\n');
    edaAnalysis.insights.slice(0, 3).forEach((insight, idx) => {
      report += `   ${idx + 1}. ${insight}\n`;
    });
  }
  report += '\n';
  
  // Data Quality Section
  report += createSection('DATA QUALITY ASSESSMENT', '');
  
  // Six dimensions
  if (dimensions.completeness) {
    report += chalk.cyan('📊 Quality Dimensions:\n');
    report += `   • Completeness: ${formatPercentage(dimensions.completeness.score / 100)} ${dimensions.completeness.score > 90 ? '✅' : '⚠️'}\n`;
    report += `   • Validity: ${formatPercentage((dimensions.validity?.score || 0) / 100)} ${(dimensions.validity?.score || 0) > 90 ? '✅' : '⚠️'}\n`;
    report += `   • Accuracy: ${formatPercentage((dimensions.accuracy?.score || 0) / 100)} ${(dimensions.accuracy?.score || 0) > 90 ? '✅' : '⚠️'}\n`;
    report += `   • Consistency: ${formatPercentage((dimensions.consistency?.score || 0) / 100)} ${(dimensions.consistency?.score || 0) > 90 ? '✅' : '⚠️'}\n`;
    report += `   • Uniqueness: ${formatPercentage((dimensions.uniqueness?.score || 0) / 100)} ${(dimensions.uniqueness?.score || 0) > 90 ? '✅' : '⚠️'}\n`;
    report += `   • Timeliness: ${dimensions.timeliness?.status || 'Unknown'}\n`;
  }
  report += '\n';
  
  // Key Issues
  if (intResults.criticalIssues && intResults.criticalIssues.length > 0) {
    report += chalk.red('🚨 Critical Issues:\n');
    intResults.criticalIssues.forEach((issue, idx) => {
      report += `   ${idx + 1}. ${issue}\n`;
    });
    report += '\n';
  }
  
  // Statistical Analysis Section
  report += createSection('STATISTICAL ANALYSIS', '');
  
  // Column Statistics
  if (edaAnalysis.columns && edaAnalysis.columns.length > 0) {
    report += chalk.cyan('📊 Column Overview:\n');
    report += `   • Numeric columns: ${edaAnalysis.numericColumnCount || 0}\n`;
    report += `   • Categorical columns: ${edaAnalysis.categoricalColumnCount || 0}\n`;
    report += `   • Date columns: ${edaAnalysis.dateColumns?.length || 0}\n`;
    report += '\n';
    
    // Key numeric columns
    const numericCols = edaAnalysis.columns.filter(col => ['integer', 'float'].includes(col.type));
    if (numericCols.length > 0) {
      report += chalk.cyan('📈 Numeric Column Summary:\n');
      numericCols.slice(0, 5).forEach(col => {
        if (col.stats && !col.stats.error) {
          report += `   ${col.name}: mean=${formatNumber(col.stats.mean)}, std=${formatNumber(col.stats.standardDeviation)}\n`;
        }
      });
      report += '\n';
    }
  }
  
  // Correlations
  if (structuredEDA.correlations && structuredEDA.correlations.length > 0) {
    report += chalk.cyan('🔗 Significant Correlations:\n');
    structuredEDA.correlations.slice(0, 3).forEach(corr => {
      report += `   • ${corr.var1} ↔ ${corr.var2}: r=${corr.correlation.toFixed(3)}\n`;
    });
    report += '\n';
  }
  
  // Pattern Detection
  if (intResults.patterns && intResults.patterns.length > 0) {
    report += chalk.cyan('🔍 Detected Patterns:\n');
    intResults.patterns.slice(0, 3).forEach((pattern, idx) => {
      report += `   ${idx + 1}. ${pattern.description || pattern}\n`;
    });
    report += '\n';
  }
  
  // Business Rules
  if (intResults.businessRules && intResults.businessRules.length > 0) {
    report += chalk.cyan('📋 Business Rules Discovered:\n');
    intResults.businessRules.slice(0, 3).forEach((rule, idx) => {
      report += `   ${idx + 1}. ${rule.description || rule}\n`;
    });
    report += '\n';
  }
  
  // Recommendations Section
  report += createSection('RECOMMENDATIONS', '');
  
  // Data Quality Recommendations
  if (qualityScore.recommendations && qualityScore.recommendations.length > 0) {
    report += chalk.yellow('🔧 Data Quality Improvements:\n');
    qualityScore.recommendations.slice(0, 3).forEach((rec, idx) => {
      report += `   ${idx + 1}. ${rec}\n`;
    });
    report += '\n';
  }
  
  // Analysis Recommendations
  if (edaAnalysis.suggestions && edaAnalysis.suggestions.length > 0) {
    report += chalk.yellow('📊 Further Analysis Suggestions:\n');
    edaAnalysis.suggestions.slice(0, 3).forEach((sug, idx) => {
      report += `   ${idx + 1}. ${sug.title}: ${sug.rationale}\n`;
    });
    report += '\n';
  }
  
  // ML Readiness
  if (structuredEDA.mlReadiness) {
    report += chalk.cyan('🤖 Machine Learning Readiness:\n');
    // Ensure score is between 0-100 and handle both decimal and percentage formats
    const mlScore = structuredEDA.mlReadiness.overallScore > 1 
      ? Math.min(structuredEDA.mlReadiness.overallScore, 100) 
      : (structuredEDA.mlReadiness.overallScore * 100);
    report += `   • Overall Score: ${mlScore.toFixed(0)}%\n`;
    if (structuredEDA.mlReadiness.majorIssues && structuredEDA.mlReadiness.majorIssues.length > 0) {
      report += `   • Major Issues: ${structuredEDA.mlReadiness.majorIssues.join(', ')}\n`;
    }
    report += '\n';
  }
  
  // Footer
  report += chalk.gray('─'.repeat(50)) + '\n';
  report += chalk.gray('Use `datapilot vis` for visualization recommendations\n');
  report += chalk.gray('Use `datapilot all` for complete analysis including visualizations\n');
  
  return report;
}