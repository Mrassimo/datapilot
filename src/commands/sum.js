/**
 * SUM COMMAND - Executive Summary (3-Letter)
 * Concise business insights for executives and decision makers
 */

import { parseCSV } from '../utils/parser.js';
import { AutoAnalyzer } from '../intelligence/autoAnalyzer.js';
import { OutputHandler } from '../utils/output.js';
import { formatTimestamp } from '../utils/format.js';
import { basename } from 'path';
import ora from 'ora';

export async function sum(filePath, options = {}) {
  const outputHandler = new OutputHandler(options);
  const spinner = options.quiet ? null : ora('Generating executive summary...').start();
  
  try {
    // Parse data
    if (spinner) spinner.text = 'Reading data...';
    const data = await parseCSV(filePath, { quiet: options.quiet });
    
    if (!data || data.length === 0) {
      throw new Error('No data found in CSV file');
    }
    
    // Run analysis
    if (spinner) spinner.text = 'Finding key insights...';
    const analyzer = new AutoAnalyzer();
    const results = await analyzer.autoAnalyze(data);
    
    if (spinner) spinner.succeed('Summary ready!');
    
    // Generate executive summary
    const fileName = basename(filePath);
    let report = '';
    
    // Header
    report += '📊 EXECUTIVE SUMMARY\n';
    report += '===================\n';
    report += `Dataset: ${fileName} • ${data.length.toLocaleString()} records • ${formatTimestamp()}\n\n`;
    
    if (results.topInsights.length > 0) {
      const topInsight = results.topInsights[0];
      
      // Key Finding
      report += '🎯 KEY FINDING\n';
      report += '--------------\n';
      report += `${topInsight.insight}\n\n`;
      
      // Business Impact
      report += '💼 BUSINESS IMPACT\n';
      report += '------------------\n';
      report += `${topInsight.businessImpact}\n`;
      
      if (topInsight.type === 'group_difference') {
        const details = topInsight.details;
        const groups = Object.keys(details);
        if (groups.length === 2) {
          const [group1, group2] = groups;
          const mean1 = parseFloat(details[group1].mean);
          const mean2 = parseFloat(details[group2].mean);
          const difference = Math.abs(mean1 - mean2);
          report += `Financial Impact: $${difference.toFixed(0)} average difference per record\n`;
        }
      }
      
      report += `Confidence Level: ${getConfidenceLevel(topInsight.importance)}\n\n`;
      
      // Top 3 Insights
      if (results.topInsights.length > 1) {
        report += '📈 ADDITIONAL INSIGHTS\n';
        report += '----------------------\n';
        results.topInsights.slice(1, 3).forEach((insight, idx) => {
          report += `${idx + 2}. ${insight.insight}\n`;
          report += `   Impact: ${insight.businessImpact}\n\n`;
        });
      }
      
      // Recommendations
      report += '💡 IMMEDIATE ACTIONS\n';
      report += '-------------------\n';
      results.topInsights.slice(0, 2).forEach((insight, idx) => {
        report += `${idx + 1}. ${generateExecutiveRecommendation(insight)}\n`;
      });
      
    } else {
      report += '🎯 KEY FINDING\n';
      report += '--------------\n';
      report += 'No statistically significant patterns detected in the data.\n\n';
      
      report += '💼 BUSINESS IMPACT\n';
      report += '------------------\n';
      report += 'Variables appear independent - no clear optimization opportunities.\n';
      report += 'This suggests current operations may already be optimized,\n';
      report += 'or additional data collection may be needed.\n\n';
      
      report += '💡 IMMEDIATE ACTIONS\n';
      report += '-------------------\n';
      report += '1. Consider collecting additional business metrics\n';
      report += '2. Explore external data sources for new insights\n';
      report += '3. Focus on operational efficiency improvements\n';
    }
    
    // Data Quality
    report += '\n📋 DATA RELIABILITY\n';
    report += '-------------------\n';
    const completeness = calculateCompleteness(data);
    report += `Data Quality: ${getQualityGrade(completeness, data.length)}\n`;
    report += `Sample Size: ${getSizeAssessment(data.length)}\n`;
    report += `Analysis Confidence: ${results.allInsights.length > 0 ? 'High' : 'Limited'}\n`;
    
    report += '\n🏛️ DATA ARCHITECTURE INTELLIGENCE\n';
    report += '-----------------------------------\n';
    report += 'For warehouse analysis and table relationships:\n';
    report += '• Multi-table analysis: datapilot eng analyze *.csv\n';
    report += '• Architecture report: datapilot eng report\n';
    report += '• Relationship map: datapilot eng map\n';
    
    // Show results
    console.log(report);
    outputHandler.finalize();
    
    return results;
    
  } catch (error) {
    if (spinner) spinner.fail('Summary generation failed');
    console.error(`❌ Error: ${error.message}`);
    outputHandler.restore();
    if (!options.quiet) process.exit(1);
    throw error;
  }
}

function getConfidenceLevel(importance) {
  if (importance >= 2) return 'Very High';
  if (importance >= 1) return 'High';
  if (importance >= 0.5) return 'Medium';
  return 'Low';
}

function generateExecutiveRecommendation(insight) {
  if (insight.type === 'group_difference') {
    return `Review ${insight.categorical} strategy - significant performance differences detected`;
  }
  if (insight.type === 'correlation') {
    return `Leverage ${insight.variables.join('/')} relationship for predictive optimization`;
  }
  return 'Investigate this pattern for strategic opportunities';
}

function calculateCompleteness(data) {
  if (!data || data.length === 0) return 0;
  
  const totalCells = data.length * Object.keys(data[0]).length;
  const nonNullCells = data.reduce((count, row) => {
    return count + Object.values(row).filter(val => val !== null && val !== undefined && val !== '').length;
  }, 0);
  
  return Math.round((nonNullCells / totalCells) * 100);
}

function getQualityGrade(completeness, size) {
  if (completeness >= 95 && size >= 100) return 'Excellent';
  if (completeness >= 90 && size >= 50) return 'Good';
  if (completeness >= 80 && size >= 30) return 'Adequate';
  return 'Limited';
}

function getSizeAssessment(rowCount) {
  if (rowCount >= 1000) return 'Statistically robust';
  if (rowCount >= 100) return 'Reliable for analysis';
  if (rowCount >= 30) return 'Adequate sample size';
  return 'Small sample - limited reliability';
}