/**
 * INT Index - Comprehensive Integrity Analysis
 * Exports a function for integration into the lean run command
 */

// Import validators
import { analyseCompleteness } from './validators/completeness.js';
import { analyseValidity } from './validators/validity.js';
import { analyseAccuracy } from './validators/accuracy.js';
import { analyseConsistency } from './validators/consistency.js';
import { analyseTimeliness } from './validators/timeliness.js';
import { analyseUniqueness } from './validators/uniqueness.js';

// Import detectors
import { detectBusinessRules } from './detectors/ruleDetector.js';
import { detectPatterns } from './detectors/patternDetector.js';
import { detectAnomalies } from './detectors/anomalyDetector.js';

// Import analysers
import { analyseFuzzyDuplicates } from './analysers/fuzzyMatcher.js';
import { validateAustralianData } from './analysers/australianValidator.js';
import { calculateQualityScore, generateQualityReport } from './analysers/qualityScorer.js';

// Import fixers
import { generateSQLFixes } from './fixers/sqlGenerator.js';
import { generatePythonFixes } from './fixers/pythonGenerator.js';

export async function comprehensiveIntegrityAnalysis(data, headers, columnTypes, fileName) {
  const analysisResults = {
    fileName,
    recordCount: data.length,
    columnCount: headers.length,
    dimensions: {},
    businessRules: null,
    patterns: null,
    anomalies: null,
    fuzzyDuplicates: null,
    australianValidation: null,
    qualityScore: null,
    criticalIssues: [],
    fixes: {
      sql: null,
      python: null
    }
  };

  try {
    // Run quality dimension validators
    analysisResults.dimensions.completeness = analyseCompleteness(data, headers);
    analysisResults.dimensions.validity = analyseValidity(data, headers, columnTypes);
    analysisResults.dimensions.accuracy = analyseAccuracy(data, headers, columnTypes);
    analysisResults.dimensions.consistency = analyseConsistency(data, headers);
    analysisResults.dimensions.timeliness = analyseTimeliness(data, headers);
    analysisResults.dimensions.uniqueness = analyseUniqueness(data, headers);

    // Run advanced detectors
    analysisResults.businessRules = detectBusinessRules(data, headers, columnTypes);
    analysisResults.patterns = detectPatterns(data, headers, columnTypes);
    analysisResults.anomalies = detectAnomalies(data, headers, columnTypes);

    // Run specialised analysers (only for smaller datasets)
    if (data.length < 10000) {
      analysisResults.fuzzyDuplicates = analyseFuzzyDuplicates(data, headers);
    }
    analysisResults.australianValidation = validateAustralianData(data, headers);

    // Calculate quality score
    analysisResults.qualityScore = calculateQualityScore(analysisResults.dimensions);

    // Generate fixes
    analysisResults.fixes.sql = generateSQLFixes(analysisResults);
    analysisResults.fixes.python = generatePythonFixes(analysisResults, fileName);

    // Extract critical issues
    analysisResults.criticalIssues = extractCriticalIssues(analysisResults);

    return analysisResults;
  } catch (error) {
    console.error('Error in integrity analysis:', error);
    throw error;
  }
}

function extractCriticalIssues(results) {
  const issues = [];

  // Check completeness
  if (results.dimensions.completeness && results.dimensions.completeness.score < 0.8) {
    issues.push(`Low data completeness: ${(results.dimensions.completeness.score * 100).toFixed(1)}%`);
  }

  // Check validity
  if (results.dimensions.validity && results.dimensions.validity.score < 0.8) {
    issues.push(`Data validity issues: ${(results.dimensions.validity.score * 100).toFixed(1)}% valid`);
  }

  // Check duplicates
  if (results.dimensions.uniqueness && results.dimensions.uniqueness.duplicateRatio > 0.05) {
    issues.push(`High duplicate ratio: ${(results.dimensions.uniqueness.duplicateRatio * 100).toFixed(1)}%`);
  }

  // Check anomalies
  if (results.anomalies && results.anomalies.fraudIndicators && results.anomalies.fraudIndicators.length > 0) {
    issues.push(`Potential fraud indicators detected`);
  }

  return issues;
}