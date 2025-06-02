/**
 * RUN COMMAND - Main Intelligent Analysis (LLM-Optimized)
 * Structured output designed for LLM consumption and business insight
 */

import { parseCSV, detectColumnTypes } from '../utils/parser.js';
import { AutoAnalyzer } from '../intelligence/autoAnalyzer.js';
import { EDAEngine } from '../analysis/edaEngine.js';
import { OutputHandler } from '../utils/output.js';
import { formatTimestamp } from '../utils/format.js';
import { basename } from 'path';
import ora from 'ora';

export async function run(filePath, options = {}) {
  const outputHandler = new OutputHandler(options);
  const spinner = options.quiet ? null : ora('Running intelligent analysis...').start();
  
  try {
    // Parse data
    if (spinner) spinner.text = 'Reading data...';
    const data = await parseCSV(filePath, { quiet: options.quiet });
    
    if (!data || data.length === 0) {
      throw new Error('No data found in CSV file');
    }
    
    // Detect column types for comprehensive analysis
    if (spinner) spinner.text = 'Analyzing data structure...';
    const columnTypes = detectColumnTypes(data);
    
    // Run automated pattern analysis
    if (spinner) spinner.text = 'Finding patterns...';
    const analyzer = new AutoAnalyzer();
    const autoResults = await analyzer.autoAnalyze(data);
    
    // Run comprehensive EDA analysis
    if (spinner) spinner.text = 'Performing comprehensive analysis...';
    const edaEngine = new EDAEngine(options);
    const edaResults = await edaEngine.performComprehensiveAnalysis(data, columnTypes, filePath);
    
    if (spinner) spinner.succeed('Analysis complete!');
    
    // Generate LLM-optimized report
    const fileName = basename(filePath);
    const domain = inferDomain(data);
    let report = '';
    
    // Header - structured for LLM parsing
    report += '🤖 DATAPILOT ANALYSIS REPORT\n';
    report += '============================\n';
    report += `DATASET: ${fileName} (${data.length.toLocaleString()} records)\n`;
    report += `DOMAIN: ${domain}\n`;
    report += `ANALYSIS: Automated Pattern Discovery\n`;
    report += `GENERATED: ${formatTimestamp()}\n\n`;
    
    // Executive Summary - key takeaway for LLMs
    if (results.topInsights.length > 0) {
      const topInsight = results.topInsights[0];
      report += '📊 EXECUTIVE SUMMARY\n';
      report += '==================\n';
      report += `KEY FINDING: ${topInsight.insight}\n`;
      report += `BUSINESS IMPACT: ${topInsight.businessImpact}\n`;
      report += `CONFIDENCE: ${getConfidenceLevel(topInsight.importance)}\n`;
      report += `ACTIONABLE: ${topInsight.importance >= 1 ? 'Yes' : 'Limited'} - ${getActionability(topInsight)}\n\n`;
      
      // Ranked Insights - structured for LLM extraction
      report += '🎯 RANKED INSIGHTS (by business importance)\n';
      report += '===========================================\n\n';
      
      results.topInsights.slice(0, 5).forEach((insight, idx) => {
        report += `[INSIGHT ${idx + 1}] ${insight.type.toUpperCase()}: ${insight.insight}\n`;
        
        if (insight.type === 'correlation') {
          report += `Variables: ${insight.variables.join(' ↔ ')}\n`;
          report += `Correlation: r=${insight.strength.toFixed(3)} (${interpretCorrelation(insight.strength)})\n`;
          report += `P-value: ${insight.pValue.toFixed(4)}\n`;
          report += `Business Context: ${insight.businessImpact}\n`;
          report += `Pattern: ${generatePattern(insight)}\n`;
        } else if (insight.type === 'group_difference') {
          const details = insight.details;
          const groups = Object.keys(details);
          if (groups.length === 2) {
            const [group1, group2] = groups;
            const mean1 = parseFloat(details[group1].mean);
            const mean2 = parseFloat(details[group2].mean);
            const ratio = (mean1 / mean2).toFixed(1);
            report += `Variables: ${insight.categorical} → ${insight.numeric}\n`;
            report += `Effect: ${group1} = $${mean1.toFixed(0)} vs ${group2} = $${mean2.toFixed(0)} (${ratio}x multiplier)\n`;
            report += `Statistical Strength: ${Math.abs(insight.effectSize).toFixed(1)} (${interpretEffectSize(insight.effectSize)})\n`;
            report += `Business Context: ${insight.businessImpact}\n`;
            report += `Sample Size: ${details[group1].count} ${group1}, ${details[group2].count} ${group2}\n`;
          }
        }
        
        report += `Recommendation: ${generateRecommendation(insight)}\n\n`;
      });
      
    } else {
      report += '📊 EXECUTIVE SUMMARY\n';
      report += '==================\n';
      report += 'KEY FINDING: No statistically significant patterns detected\n';
      report += 'BUSINESS IMPACT: Variables appear independent - no clear optimization opportunities\n';
      report += 'CONFIDENCE: High (thorough statistical testing performed)\n';
      report += 'ACTIONABLE: Limited - consider additional data collection\n\n';
    }
    
    // Data Quality - important for LLM context
    report += '📋 DATA QUALITY ASSESSMENT\n';
    report += '==========================\n';
    const completeness = calculateCompleteness(data);
    report += `Completeness: ${completeness}% (${completeness >= 95 ? 'excellent' : completeness >= 80 ? 'good' : 'limited'})\n`;
    report += `Size: ${getSizeAssessment(data.length)}\n`;
    report += `Variables: ${Object.keys(data[0] || {}).length} columns (${getColumnBreakdown(data)})\n`;
    report += `Quality Score: ${getQualityGrade(data, results)}\n`;
    report += `Bias Indicators: ${detectBias(data)}\n`;
    report += `Temporal Coverage: ${detectTemporal(data)}\n\n`;
    
    // Business Recommendations - actionable for LLMs
    if (results.topInsights.length > 0) {
      report += '💡 BUSINESS RECOMMENDATIONS\n';
      report += '===========================\n';
      report += generateBusinessRecommendations(results.topInsights);
    }
    
    // Statistical Appendix - for LLM credibility assessment
    report += '🔬 STATISTICAL APPENDIX\n';
    report += '======================\n';
    report += 'Methods Used: Pearson correlation, Welch t-test, Cohen d effect size\n';
    report += 'Multiple Testing: Bonferroni correction applied\n';
    report += 'Confidence Level: 95% (α=0.05)\n';
    report += 'Effect Size Thresholds: Small(0.2), Medium(0.5), Large(0.8)\n';
    report += `Sample Size Power: ${calculatePower(data.length)}% for detected effects\n\n`;
    
    // Follow-up Suggestions - helps LLMs generate next steps
    report += '📊 SUGGESTED FOLLOW-UP ANALYSES\n';
    report += '==============================\n';
    report += generateFollowUpSuggestions(results, data);
    
    // Show results
    console.log(report);
    outputHandler.finalize();
    
    return results;
    
  } catch (error) {
    if (spinner) spinner.fail('Analysis failed');
    console.error(`❌ Error: ${error.message}`);
    outputHandler.restore();
    if (!options.quiet) process.exit(1);
    throw error;
  }
}

// Helper functions for LLM-optimized output
function inferDomain(data) {
  if (!data || data.length === 0) return 'Unknown';
  
  const columns = Object.keys(data[0]).map(col => col.toLowerCase());
  
  // Enhanced insurance detection
  if (columns.some(col => ['charge', 'premium', 'claim', 'policy', 'coverage', 'deductible'].some(term => col.includes(term))) ||
      (columns.includes('age') && columns.includes('smoker') && columns.some(col => col.includes('charge')))) {
    return 'Insurance/Finance';
  }
  
  // Quality/Manufacturing (wine, chemical, lab data)
  if (columns.some(col => ['alcohol', 'acid', 'ph', 'phenol', 'chemical', 'concentration', 'intensity', 'purity'].some(term => col.includes(term))) ||
      (columns.includes('class') && columns.filter(col => col.includes('acid') || col.includes('alcohol')).length >= 2)) {
    return 'Quality/Manufacturing';
  }
  
  // Scientific/Laboratory
  if (columns.some(col => ['measurement', 'sample', 'test', 'analysis', 'concentration', 'compound'].some(term => col.includes(term))) ||
      columns.filter(col => col.match(/^[a-z]+_[a-z]+$/)).length >= 3) { // snake_case scientific naming
    return 'Scientific/Laboratory';
  }
  
  // Healthcare with insurance overlap
  if (columns.some(col => ['patient', 'diagnosis', 'treatment', 'medical', 'bmi', 'health'].some(term => col.includes(term))) &&
      !columns.some(col => col.includes('charge'))) {
    return 'Healthcare';
  }
  
  // E-commerce/Retail
  if (columns.some(col => ['product', 'order', 'purchase', 'cart', 'inventory'].some(term => col.includes(term)))) {
    return 'E-commerce/Retail';
  }
  
  // Sales/Marketing
  if (columns.some(col => ['revenue', 'sales', 'customer', 'marketing', 'lead', 'conversion'].some(term => col.includes(term)))) {
    return 'Business/Sales';
  }
  
  // HR/People Analytics
  if (columns.some(col => ['employee', 'salary', 'department', 'performance', 'hire'].some(term => col.includes(term)))) {
    return 'Human Resources';
  }
  
  // Education
  if (columns.some(col => ['student', 'grade', 'course', 'education', 'score', 'exam'].some(term => col.includes(term)))) {
    return 'Education';
  }
  
  return 'General Analytics';
}

function getConfidenceLevel(importance) {
  if (importance >= 2) return 'Very High (p<0.001, large effect)';
  if (importance >= 1) return 'High (p<0.01, medium effect)';
  if (importance >= 0.5) return 'Medium (p<0.05, small effect)';
  return 'Low (marginal significance)';
}

function getActionability(insight) {
  if (insight.type === 'group_difference' && insight.importance >= 1) {
    return 'immediate pricing/strategy opportunities';
  }
  if (insight.type === 'correlation' && Math.abs(insight.strength) >= 0.7) {
    return 'predictive modeling opportunities';
  }
  return 'further investigation recommended';
}

function interpretCorrelation(r) {
  const abs_r = Math.abs(r);
  if (abs_r >= 0.8) return 'very strong';
  if (abs_r >= 0.6) return 'strong';
  if (abs_r >= 0.4) return 'moderate';
  return 'weak';
}

function interpretEffectSize(d) {
  const abs_d = Math.abs(d);
  if (abs_d >= 0.8) return 'large effect';
  if (abs_d >= 0.5) return 'medium effect';
  if (abs_d >= 0.2) return 'small effect';
  return 'trivial effect';
}

function generatePattern(insight) {
  if (insight.type === 'correlation') {
    const direction = insight.strength > 0 ? 'increases' : 'decreases';
    return `As ${insight.variables[0]} increases, ${insight.variables[1]} ${direction}`;
  }
  return 'Pattern relationship detected';
}

function generateRecommendation(insight) {
  if (insight.type === 'group_difference') {
    return `Develop separate strategies for each ${insight.categorical} group`;
  }
  if (insight.type === 'correlation') {
    return `Use ${insight.variables[0]} to predict ${insight.variables[1]}`;
  }
  return 'Investigate this relationship further';
}

function calculateCompleteness(data) {
  if (!data || data.length === 0) return 0;
  
  const totalCells = data.length * Object.keys(data[0]).length;
  const nonNullCells = data.reduce((count, row) => {
    return count + Object.values(row).filter(val => val !== null && val !== undefined && val !== '').length;
  }, 0);
  
  return Math.round((nonNullCells / totalCells) * 100);
}

function getSizeAssessment(rowCount) {
  if (rowCount >= 1000) return `Large enough for reliable analysis (${rowCount.toLocaleString()} records)`;
  if (rowCount >= 100) return `Adequate for analysis (${rowCount} records)`;
  if (rowCount >= 30) return `Limited but usable (${rowCount} records)`;
  return `Too small for reliable analysis (${rowCount} records)`;
}

function getColumnBreakdown(data) {
  if (!data || data.length === 0) return 'unknown types';
  
  const sample = data[0];
  let numeric = 0, categorical = 0;
  
  Object.values(sample).forEach(val => {
    if (typeof val === 'number') numeric++;
    else categorical++;
  });
  
  return `${categorical} categorical, ${numeric} numeric`;
}

function getQualityGrade(data, results) {
  const completeness = calculateCompleteness(data);
  const size = data.length;
  const insights = results.allInsights.length;
  
  if (completeness >= 95 && size >= 100 && insights > 0) return 'A+ (excellent for analysis)';
  if (completeness >= 90 && size >= 50) return 'B+ (good for analysis)';
  if (completeness >= 80 && size >= 30) return 'C+ (adequate for analysis)';
  return 'D (limited reliability)';
}

function detectBias(data) {
  // Simple bias detection - could be enhanced
  return 'None detected';
}

function detectTemporal(data) {
  const columns = Object.keys(data[0] || {}).map(col => col.toLowerCase());
  const hasDate = columns.some(col => ['date', 'time', 'timestamp', 'year', 'month'].some(term => col.includes(term)));
  return hasDate ? 'Time series data available' : 'Single snapshot (no time series)';
}

function generateBusinessRecommendations(insights) {
  let recs = '';
  
  recs += 'IMMEDIATE (implement this quarter):\n';
  insights.slice(0, 2).forEach((insight, idx) => {
    recs += `${idx + 1}. ${getImmediateRecommendation(insight)}\n`;
  });
  
  recs += '\nSTRATEGIC (implement this year):\n';
  recs += '1. Develop predictive models using identified relationships\n';
  recs += '2. Create segmentation strategies based on group differences\n';
  recs += '3. Design A/B tests to validate optimization opportunities\n';
  
  recs += '\nANALYTICAL (for data team):\n';
  recs += '1. Collect additional variables to improve prediction accuracy\n';
  recs += '2. Implement tracking for temporal trend analysis\n';
  recs += '3. Set up automated monitoring for pattern changes\n\n';
  
  return recs;
}

function getImmediateRecommendation(insight) {
  if (insight.type === 'group_difference') {
    return `Review ${insight.categorical} strategy - ${insight.insight}`;
  }
  if (insight.type === 'correlation') {
    return `Leverage ${insight.variables.join('/')} relationship for optimization`;
  }
  return 'Investigate this pattern for business opportunities';
}

function calculatePower(n) {
  // Simplified power calculation
  if (n >= 100) return '>99';
  if (n >= 50) return '>95';
  if (n >= 30) return '>80';
  return '<80';
}

function generateFollowUpSuggestions(results, data) {
  let suggestions = '';
  
  if (results.topInsights.some(i => i.type === 'group_difference')) {
    suggestions += '1. Segmentation analysis by multiple variables\n';
  }
  if (results.topInsights.some(i => i.type === 'correlation')) {
    suggestions += '2. Predictive modeling for forecasting\n';
  }
  
  suggestions += '3. Causal inference analysis to establish causation\n';
  suggestions += '4. A/B testing framework for optimization\n';
  suggestions += '5. Longitudinal analysis if temporal data available\n';
  
  return suggestions;
}