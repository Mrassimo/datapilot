/**
 * Quality Engine - Comprehensive Data Quality Analysis
 * Extracted from original INT command for integration into lean commands
 */

import chalk from 'chalk';

// Import validators
import { analyseCompleteness } from '../commands/int/validators/completeness.js';
import { analyseValidity } from '../commands/int/validators/validity.js';
import { analyseAccuracy } from '../commands/int/validators/accuracy.js';
import { analyseConsistency } from '../commands/int/validators/consistency.js';
import { analyseTimeliness } from '../commands/int/validators/timeliness.js';
import { analyseUniqueness } from '../commands/int/validators/uniqueness.js';

// Import detectors
import { detectBusinessRules } from '../commands/int/detectors/ruleDetector.js';
import { detectPatterns } from '../commands/int/detectors/patternDetector.js';
import { detectAnomalies } from '../commands/int/detectors/anomalyDetector.js';

// Import analysers
import { analyseFuzzyDuplicates } from '../commands/int/analysers/fuzzyMatcher.js';
import { validateAustralianData } from '../commands/int/analysers/australianValidator.js';
import { calculateQualityScore, generateQualityReport } from '../commands/int/analysers/qualityScorer.js';

export class QualityEngine {
  constructor(options = {}) {
    this.options = options;
  }

  async performQualityAnalysis(records, columnTypes, filePath) {
    const results = {
      dimensions: {},
      businessRules: [],
      patterns: {},
      anomalies: [],
      australianValidation: {},
      fuzzyDuplicates: [],
      overallQuality: {},
      recommendations: []
    };

    try {
      const headers = Object.keys(columnTypes);

      // 1. Six Dimensions of Data Quality
      results.dimensions = {
        completeness: await analyseCompleteness(records, headers),
        validity: await analyseValidity(records, columnTypes),
        accuracy: await analyseAccuracy(records, columnTypes),
        consistency: await analyseConsistency(records, headers),
        timeliness: await analyseTimeliness(records, columnTypes),
        uniqueness: await analyseUniqueness(records, headers)
      };

      // 2. Business Rule Detection
      results.businessRules = await detectBusinessRules(records, columnTypes);

      // 3. Pattern Analysis
      results.patterns = await detectPatterns(records, columnTypes);

      // 4. Anomaly Detection
      results.anomalies = await detectAnomalies(records, columnTypes);

      // 5. Australian Data Validation (if applicable)
      results.australianValidation = validateAustralianData(records, headers);

      // 6. Fuzzy Duplicate Analysis
      if (records.length < 10000) { // Skip for very large datasets
        results.fuzzyDuplicates = await analyseFuzzyDuplicates(records, headers);
      }

      // 7. Overall Quality Assessment
      results.overallQuality = calculateQualityScore(results.dimensions);

      // 8. Generate Quality Report and Recommendations
      const qualityReport = generateQualityReport(results, records.length);
      results.recommendations = qualityReport.recommendations;
      results.summary = qualityReport.summary;

      return results;

    } catch (error) {
      console.error(chalk.yellow(`⚠️ Quality Engine error: ${error.message}`));
      return results; // Return partial results
    }
  }

  formatQualityInsights(qualityResults) {
    const insights = [];

    // Overall score insight
    if (qualityResults.overallQuality?.score) {
      const score = qualityResults.overallQuality.score;
      const grade = qualityResults.overallQuality.grade;
      insights.push({
        type: 'overall_quality',
        title: 'Overall Data Quality',
        description: `${grade} grade (${(score * 100).toFixed(0)}% quality score)`,
        score: score,
        severity: score > 0.8 ? 'good' : score > 0.6 ? 'warning' : 'critical'
      });
    }

    // Dimension-specific insights
    Object.entries(qualityResults.dimensions || {}).forEach(([dimension, result]) => {
      if (result.score < 0.8) {
        insights.push({
          type: 'quality_dimension',
          title: `${dimension.charAt(0).toUpperCase() + dimension.slice(1)} Issues`,
          description: result.mainIssue || `Low ${dimension} score: ${(result.score * 100).toFixed(0)}%`,
          score: result.score,
          severity: result.score < 0.5 ? 'critical' : 'warning',
          recommendations: result.recommendations || []
        });
      }
    });

    // Anomaly insights
    if (qualityResults.anomalies && qualityResults.anomalies.length > 0) {
      const criticalAnomalies = qualityResults.anomalies.filter(a => a.severity === 'high');
      if (criticalAnomalies.length > 0) {
        insights.push({
          type: 'anomalies',
          title: 'Data Anomalies Detected',
          description: `${criticalAnomalies.length} critical anomalies found`,
          details: criticalAnomalies.slice(0, 3).map(a => a.description),
          severity: 'warning'
        });
      }
    }

    // Business rule violations
    if (qualityResults.businessRules && qualityResults.businessRules.length > 0) {
      const violations = qualityResults.businessRules.filter(rule => !rule.passed);
      if (violations.length > 0) {
        insights.push({
          type: 'business_rules',
          title: 'Business Rule Violations',
          description: `${violations.length} business rules violated`,
          details: violations.slice(0, 3).map(v => v.description),
          severity: 'warning'
        });
      }
    }

    return insights.sort((a, b) => {
      const severityOrder = { critical: 3, warning: 2, good: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  }

  generateExecutiveSummary(qualityResults) {
    const summary = {
      overallGrade: qualityResults.overallQuality?.grade || 'Unknown',
      qualityScore: qualityResults.overallQuality?.score || 0,
      criticalIssues: [],
      recommendations: []
    };

    // Extract critical issues
    Object.entries(qualityResults.dimensions || {}).forEach(([dimension, result]) => {
      if (result.score < 0.7) {
        summary.criticalIssues.push({
          dimension: dimension,
          score: result.score,
          issue: result.mainIssue || `Low ${dimension} quality`,
          fixAvailable: result.fixable || false
        });
      }
    });

    // Top recommendations
    summary.recommendations = qualityResults.recommendations?.slice(0, 3) || [];

    return summary;
  }

  calculateDataHealth(qualityResults) {
    const dimensions = qualityResults.dimensions || {};
    const scores = Object.values(dimensions).map(d => d.score || 0);
    const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b) / scores.length : 0;

    return {
      healthScore: avgScore,
      healthGrade: avgScore > 0.9 ? 'Excellent' : 
                   avgScore > 0.8 ? 'Good' : 
                   avgScore > 0.6 ? 'Fair' : 'Poor',
      riskLevel: avgScore < 0.5 ? 'High' : avgScore < 0.7 ? 'Medium' : 'Low',
      readyForAnalysis: avgScore > 0.7
    };
  }
}