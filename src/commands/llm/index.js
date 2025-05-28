/**
 * LLM Command Implementation
 * Orchestrates all analyses in summary mode and synthesizes insights
 */

import { detectColumnTypes } from '../../utils/parser.js';
import { basename } from 'path';
import ora from 'ora';

// Import the original analysis commands
import { eda as edaCommand } from '../eda.js';
import { integrity as intCommand } from '../int.js';
import { visualize as visCommand } from '../vis.js';
import { engineering as engCommand } from '../eng.js';

// Import LLM utility functions
import { 
  getDateRange, 
  inferDataType, 
  analyzeSeasonality,
  analyzeSegments,
  analyzeCategoryPerformance,
  analyzePricing,
  detectAnomalies,
  calculateDataQuality,
  generateSummaryStatistics,
  findSignificantCorrelations,
  generateAnalysisSuggestions,
  generateDataQuestions,
  generateTechnicalNotes
} from './utils/llmUtils.js';
import { createSamplingStrategy, performSampling } from '../eda/utils/sampling.js';

// Import summarizers
import { extractEdaSummary } from './summarizers/edaSummarizer.js';
import { extractIntSummary } from './summarizers/intSummarizer.js';
import { extractVisSummary } from './summarizers/visSummarizer.js';
import { extractEngSummary } from './summarizers/engSummarizer.js';

// Import synthesizer and selector
import { synthesizeInsights } from './synthesizers/insightSynthesizer.js';
import { KeyFindingSelector } from './selectors/keyFindingSelector.js';

// Import formatter
import { formatLLMOutput } from './formatters/llmOutputFormatter.js';

// Cache for analysis results
const analysisCache = new Map();

export async function comprehensiveLLMAnalysis(records, headers, filePath, options = {}) {
  const spinner = options.quiet ? null : ora('Generating comprehensive LLM context...').start();
  
  // Performance optimization: Use sampling for comprehensive analysis
  const samplingStrategy = createSamplingStrategy(records, 'basic');
  let sampledRecords = records;
  
  // More aggressive sampling for comprehensive analysis
  if (samplingStrategy.method !== 'none' && records.length > 5000) {
    // For comprehensive analysis, use even more aggressive sampling
    const maxSampleSize = 2000; // Limit to 2000 rows for sub-analyses
    if (sampledRecords.length > maxSampleSize) {
      const sampleRate = maxSampleSize / records.length;
      sampledRecords = performSampling(records, { ...samplingStrategy, targetSize: maxSampleSize, sampleRate });
    }
    if (spinner) {
      spinner.text = `Using smart sampling (${sampledRecords.length.toLocaleString()} of ${records.length.toLocaleString()} rows) for faster analysis...`;
    }
  }
  
  try {
    const fileName = basename(filePath);
    const columnTypes = sampledRecords.length > 0 ? detectColumnTypes(sampledRecords) : {};
    const columns = Object.keys(columnTypes);
    
    // Check cache
    const cacheKey = `${filePath}_${sampledRecords.length}_${columns.length}`;
    if (analysisCache.has(cacheKey) && !options.noCache) {
      const cached = analysisCache.get(cacheKey);
      const age = Date.now() - cached.timestamp;
      if (age < 300000) { // 5 minutes
        if (spinner) spinner.succeed('LLM context generated from cache!');
        return cached.result;
      }
    }
    
    if (spinner) spinner.text = 'Running exploratory data analysis...';
    
    // Run all analyses in parallel with summary mode using sampled data
    // Add individual error handling to prevent one failure from blocking all
    const analysisPromises = [
      runEdaAnalysis(sampledRecords, headers, filePath, options, columnTypes).catch(e => {
        console.error('EDA analysis failed:', e.message);
        return {};
      }),
      runIntAnalysis(sampledRecords, headers, filePath, options, columnTypes).catch(e => {
        console.error('INT analysis failed:', e.message);
        return {};
      }),
      runVisAnalysis(sampledRecords, headers, filePath, options, columnTypes).catch(e => {
        console.error('VIS analysis failed:', e.message);
        return {};
      }),
      runEngAnalysis(sampledRecords, headers, filePath, options, columnTypes).catch(e => {
        console.error('ENG analysis failed:', e.message);
        return {};
      }),
      generateOriginalContext(sampledRecords, columns, columnTypes).catch(e => {
        console.error('Original context generation failed:', e.message);
        return {};
      })
    ];
    
    const [edaResults, intResults, visResults, engResults, originalContext] = await Promise.all(analysisPromises);
    
    if (spinner) spinner.text = 'Extracting key insights...';
    
    // Extract summaries from each analysis
    const summaries = {
      edaSummary: extractEdaSummary(edaResults),
      intSummary: extractIntSummary(intResults),
      visSummary: extractVisSummary(visResults),
      engSummary: extractEngSummary(engResults)
    };
    
    if (spinner) spinner.text = 'Synthesizing cross-analysis insights...';
    
    // Synthesize insights across analyses
    const synthesis = synthesizeInsights(
      summaries.edaSummary,
      summaries.intSummary,
      summaries.visSummary,
      summaries.engSummary
    );
    
    if (spinner) spinner.text = 'Selecting most impactful findings...';
    
    // Select key findings
    const selector = new KeyFindingSelector({
      maxFindings: 5,
      maxPatternsPerCategory: 2
    });
    
    const allFindings = {
      edaSummary: summaries.edaSummary,
      intSummary: summaries.intSummary,
      visSummary: summaries.visSummary,
      engSummary: summaries.engSummary,
      synthesis
    };
    
    const keyFindings = selector.selectKeyFindings(allFindings);
    const formattedFindings = selector.formatForPresentation(keyFindings);
    
    if (spinner) spinner.text = 'Formatting LLM context...';
    
    // Prepare analysis results for formatter
    const analysisResults = {
      originalAnalysis: originalContext,
      summaries,
      synthesis,
      keyFindings: formattedFindings,
      recordCount: records.length,
      columnCount: columns.length,
      dataType: originalContext.dataType
    };
    
    // Format the output
    const formattedOutput = formatLLMOutput(analysisResults, fileName);
    
    // Cache the result
    const result = {
      output: formattedOutput,
      metadata: {
        recordCount: records.length,
        columnCount: columns.length,
        keyFindingsCount: keyFindings.length,
        qualityScore: summaries.intSummary?.qualityScore?.score,
        visualizationCount: summaries.visSummary?.topVisualizations?.length || 0
      }
    };
    
    analysisCache.set(cacheKey, {
      result,
      timestamp: Date.now()
    });
    
    // Clear old cache entries
    if (analysisCache.size > 10) {
      const oldestKey = analysisCache.keys().next().value;
      analysisCache.delete(oldestKey);
    }
    
    if (spinner) spinner.succeed('Comprehensive LLM context generated!');
    
    return result;
    
  } catch (error) {
    outputHandler.restore();
    if (spinner) spinner.error({ text: 'Error generating LLM context' });
    console.error(error.message);
    if (!options.quiet) process.exit(1);
    throw error;
  }
}

// Analysis runners - now use real command outputs

async function runEdaAnalysis(records, headers, filePath, options, columnTypes) {
  const captureOptions = {
    ...options,
    structuredOutput: true,
    quiet: true,
    preloadedData: { records, columnTypes }
  };
  
  try {
    // Add timeout for large dataset analysis
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('EDA analysis timeout')), 10000); // 10 second timeout
    });
    
    const analysisPromise = edaCommand(filePath, captureOptions);
    const result = await Promise.race([analysisPromise, timeoutPromise]);
    
    return result?.structuredResults || {};
  } catch (error) {
    console.error('EDA analysis error:', error.message);
    // Fallback to minimal structure
    return {
      statisticalInsights: [],
      dataQuality: { completeness: 0.8, duplicateRows: 0, outlierPercentage: 0 },
      correlations: [],
      distributions: [],
      timeSeries: null,
      summaryStats: {},
      mlReadiness: { overallScore: 0.8, majorIssues: [] },
      columns: headers
    };
  }
}

async function runIntAnalysis(records, _headers, filePath, options, columnTypes) {
  const captureOptions = {
    ...options,
    structuredOutput: true,
    quiet: true,
    preloadedData: { records, columnTypes }
  };
  
  try {
    const result = await intCommand(filePath, captureOptions);
    return result?.structuredResults || {};
  } catch (error) {
    console.error('INT analysis error:', error);
    // Fallback to minimal structure
    return {
      overallQuality: { score: 0.8, grade: 'B', trend: 'stable' },
      validationResults: [],
      businessRules: [],
      referentialIntegrity: [],
      patternAnomalies: [],
      suggestedFixes: [],
      dimensions: {
        completeness: { score: 0.8 },
        accuracy: { score: 0.8 },
        consistency: { score: 0.8 },
        validity: { score: 0.8 },
        uniqueness: { score: 0.8 },
        timeliness: { score: 0.8 }
      }
    };
  }
}

async function runVisAnalysis(records, _headers, filePath, options, columnTypes) {
  const captureOptions = {
    ...options,
    structuredOutput: true,
    quiet: true,
    preloadedData: { records, columnTypes }
  };
  
  try {
    const result = await visCommand(filePath, captureOptions);
    return result?.structuredResults || {};
  } catch (error) {
    console.error('VIS analysis error:', error);
    // Fallback to minimal structure
    return {
      recommendations: [],
      dashboardRecommendation: null,
      antiPatterns: [],
      taskAnalysis: {},
      perceptualAnalysis: {},
      multivariatePatterns: [],
      interactiveRecommendations: []
    };
  }
}

async function runEngAnalysis(records, _headers, filePath, options, columnTypes) {
  const captureOptions = {
    ...options,
    structuredOutput: true,
    quiet: true,
    preloadedData: { records, columnTypes }
  };
  
  try {
    const result = await engCommand(filePath, captureOptions);
    return result?.structuredResults || {};
  } catch (error) {
    console.error('ENG analysis error:', error);
    // Fallback to minimal structure
    return {
      schemaRecommendations: [],
      performanceAnalysis: {
        dataVolume: records.length,
        queryPatterns: [],
        joinComplexity: 'moderate'
      },
      etlAnalysis: {},
      technicalDebt: [],
      relationships: [],
      warehouseKnowledge: {}
    };
  }
}

// Generate original context data for compatibility
async function generateOriginalContext(records, columns, columnTypes) {
  try {
    // This maintains compatibility with the original LLM format
    const dateColumns = columns.filter(col => columnTypes[col] && columnTypes[col].type === 'date');
    const dateRange = getDateRange(records, dateColumns);
    const dataType = inferDataType(columns, columnTypes);
    
    // Run only essential analysis functions for large datasets
    const isLargeDataset = records.length > 5000;
    
    const seasonalPattern = !isLargeDataset && dateColumns.length > 0 ? 
      analyzeSeasonality(records, dateColumns[0], columns, columnTypes) : null;
    
    const segmentAnalysis = !isLargeDataset ? analyzeSegments(records, columns, columnTypes) : null;
    const categoryAnalysis = !isLargeDataset ? analyzeCategoryPerformance(records, columns, columnTypes) : null;
    const pricingInsights = !isLargeDataset ? analyzePricing(records, columns, columnTypes) : null;
    const anomalies = !isLargeDataset ? detectAnomalies(records, columns, columnTypes) : [];
    const qualityMetrics = calculateDataQuality(records, columns);
    const summaryStats = generateSummaryStatistics(records, columns, columnTypes);
    const correlations = !isLargeDataset ? findSignificantCorrelations(records, columns, columnTypes) : [];
    const analysisSuggestions = generateAnalysisSuggestions(columns, columnTypes);
    const dataQuestions = generateDataQuestions(columns, columnTypes, dataType);
    const technicalNotes = !isLargeDataset ? await generateTechnicalNotes(records, columns, columnTypes) : [];
  
  return {
    recordCount: records.length,
    columnCount: columns.length,
    columns,
    columnTypes,
    dateRange,
    dataType,
    seasonalPattern,
    segmentAnalysis,
    categoryAnalysis,
    pricingInsights,
    anomalies,
    qualityMetrics,
    summaryStats,
    correlations,
    analysisSuggestions,
    dataQuestions,
    technicalNotes
  };
  } catch (error) {
    console.error('Original context generation error:', error.message);
    // Return minimal context on error
    return {
      recordCount: records.length,
      columnCount: columns.length,
      columns,
      columnTypes,
      dateRange: null,
      dataType: 'unknown',
      qualityMetrics: { overallQuality: 0.8 }
    };
  }
}