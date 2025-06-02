/**
 * EDA Engine - Comprehensive Exploratory Data Analysis
 * Extracted from original EDA command for integration into lean commands
 */

import { statSync } from 'fs';
import chalk from 'chalk';

// Import all the analysis modules
import { calculateEnhancedStats, calculateCategoricalStats } from '../commands/eda/analysers/basicStats.js';
import { analyzeDistribution } from '../commands/eda/analysers/distributions.js';
import { detectOutliers } from '../commands/eda/analysers/outliers.js';
import { performCorrelationAnalysis } from '../commands/eda/analysers/correlations.js';
import { performTimeSeriesAnalysis } from '../commands/eda/analysers/timeseries.js';
import { validateAustralianData, generateAustralianInsights } from '../commands/eda/analysers/australian.js';
import { assessMLReadiness } from '../commands/eda/analysers/mlReadiness.js';
import { detectAnalysisNeeds, findPotentialTargets } from '../commands/eda/detectors/dataTypeDetector.js';
import { detectPatterns } from '../commands/eda/detectors/patternDetector.js';

export class EDAEngine {
  constructor(options = {}) {
    this.options = options;
  }

  async performComprehensiveAnalysis(records, columnTypes, filePath) {
    const results = {
      basicStats: {},
      distributions: {},
      correlations: {},
      outliers: {},
      patterns: {},
      australianInsights: {},
      mlReadiness: {},
      timeSeries: null,
      summary: {}
    };

    try {
      const headers = Object.keys(columnTypes);
      const fileStats = statSync(filePath);
      
      // 1. Basic Statistics for all columns
      for (const column of headers) {
        const columnType = columnTypes[column];
        const values = records.map(r => r[column]).filter(v => v !== null && v !== undefined);
        
        if (columnType.type === 'integer' || columnType.type === 'float') {
          results.basicStats[column] = await calculateEnhancedStats(values, column);
        } else if (columnType.type === 'categorical') {
          results.basicStats[column] = calculateCategoricalStats(values, column);
        }
      }

      // 2. Distribution Analysis
      const numericColumns = headers.filter(h => 
        columnTypes[h].type === 'integer' || columnTypes[h].type === 'float'
      );
      
      for (const column of numericColumns) {
        const values = records.map(r => r[column]).filter(v => typeof v === 'number');
        if (values.length > 0) {
          results.distributions[column] = await analyzeDistribution(values);
        }
      }

      // 3. Correlation Analysis
      if (numericColumns.length >= 2) {
        results.correlations = await performCorrelationAnalysis(records, numericColumns);
      }

      // 4. Outlier Detection
      for (const column of numericColumns) {
        const values = records.map(r => r[column]).filter(v => typeof v === 'number');
        if (values.length > 0) {
          results.outliers[column] = detectOutliers(values);
        }
      }

      // 5. Pattern Detection
      results.patterns = detectPatterns(records, columnTypes);

      // 6. Australian Data Validation (if applicable)
      const australianValidation = validateAustralianData(records, headers);
      if (australianValidation.hasAustralianData) {
        results.australianInsights = generateAustralianInsights(records, headers, australianValidation);
      }

      // 7. ML Readiness Assessment
      results.mlReadiness = assessMLReadiness(records, columnTypes);

      // 8. Time Series Analysis (if date columns exist)
      const dateColumns = headers.filter(h => columnTypes[h].type === 'date');
      if (dateColumns.length > 0 && numericColumns.length > 0) {
        results.timeSeries = await performTimeSeriesAnalysis(
          records, 
          dateColumns[0], 
          numericColumns,
          columnTypes
        );
      }

      // 9. Generate comprehensive summary
      results.summary = this.generateSummary(results, records, columnTypes, fileStats);

      return results;

    } catch (error) {
      console.error(chalk.yellow(`⚠️ EDA Engine error: ${error.message}`));
      return results; // Return partial results
    }
  }

  generateSummary(results, records, columnTypes, fileStats) {
    const headers = Object.keys(columnTypes);
    const summary = {
      datasetSize: {
        rows: records.length,
        columns: headers.length,
        fileSize: fileStats.size
      },
      columnBreakdown: this.analyzeColumnTypes(columnTypes),
      keyFindings: this.extractKeyFindings(results),
      dataQuality: this.assessDataQuality(results, records),
      recommendations: this.generateRecommendations(results)
    };

    return summary;
  }

  analyzeColumnTypes(columnTypes) {
    const breakdown = {
      numeric: 0,
      categorical: 0,
      date: 0,
      identifier: 0,
      other: 0
    };

    Object.values(columnTypes).forEach(type => {
      if (type.type === 'integer' || type.type === 'float') {
        breakdown.numeric++;
      } else if (type.type === 'categorical') {
        breakdown.categorical++;
      } else if (type.type === 'date') {
        breakdown.date++;
      } else if (type.type === 'identifier') {
        breakdown.identifier++;
      } else {
        breakdown.other++;
      }
    });

    return breakdown;
  }

  extractKeyFindings(results) {
    const findings = [];

    // Strong correlations
    if (results.correlations && results.correlations.significantCorrelations) {
      results.correlations.significantCorrelations.slice(0, 3).forEach(corr => {
        findings.push({
          type: 'correlation',
          description: `${corr.variables.join(' vs ')} correlation: ${corr.coefficient.toFixed(3)}`,
          importance: Math.abs(corr.coefficient)
        });
      });
    }

    // Significant outliers
    Object.entries(results.outliers || {}).forEach(([column, outlierData]) => {
      if (outlierData.outliers && outlierData.outliers.length > 0) {
        const percentage = (outlierData.outliers.length / outlierData.total * 100).toFixed(1);
        findings.push({
          type: 'outliers',
          description: `${column} has ${outlierData.outliers.length} outliers (${percentage}%)`,
          importance: outlierData.outliers.length / outlierData.total
        });
      }
    });

    // Distribution insights
    Object.entries(results.distributions || {}).forEach(([column, dist]) => {
      if (dist.skewness && Math.abs(dist.skewness) > 1) {
        findings.push({
          type: 'distribution',
          description: `${column} is ${dist.skewness > 0 ? 'right' : 'left'}-skewed (${dist.skewness.toFixed(2)})`,
          importance: Math.abs(dist.skewness) / 3
        });
      }
    });

    return findings.sort((a, b) => b.importance - a.importance).slice(0, 5);
  }

  assessDataQuality(results, records) {
    const totalCells = records.length * Object.keys(records[0] || {}).length;
    let missingCells = 0;

    records.forEach(record => {
      Object.values(record).forEach(value => {
        if (value === null || value === undefined || value === '') {
          missingCells++;
        }
      });
    });

    const completeness = ((totalCells - missingCells) / totalCells * 100);

    return {
      completeness: completeness.toFixed(1),
      outlierCount: Object.values(results.outliers || {}).reduce((sum, o) => 
        sum + (o.outliers ? o.outliers.length : 0), 0),
      mlReadiness: results.mlReadiness?.overallScore || 0
    };
  }

  generateRecommendations(results) {
    const recommendations = [];

    // ML recommendations
    if (results.mlReadiness?.overallScore > 0.7) {
      recommendations.push('Data is ready for machine learning analysis');
    } else {
      recommendations.push('Consider data preprocessing before ML analysis');
    }

    // Time series recommendations
    if (results.timeSeries) {
      recommendations.push('Time series analysis available - consider trend and seasonality modeling');
    }

    // Correlation recommendations
    if (results.correlations?.significantCorrelations?.length > 0) {
      recommendations.push('Strong correlations detected - suitable for predictive modeling');
    }

    return recommendations;
  }
}