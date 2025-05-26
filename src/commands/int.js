import { parseCSV, detectColumnTypes } from '../utils/parser.js';
import { createSection, createSubSection, formatTimestamp, formatPercentage, bulletList, numberedList } from '../utils/format.js';
import { basename } from 'path';
import ora from 'ora';
import { OutputHandler } from '../utils/output.js';

// Import validators
import { analyseCompleteness } from './int/validators/completeness.js';
import { analyseValidity } from './int/validators/validity.js';
import { analyseAccuracy } from './int/validators/accuracy.js';
import { analyseConsistency } from './int/validators/consistency.js';
import { analyseTimeliness } from './int/validators/timeliness.js';
import { analyseUniqueness } from './int/validators/uniqueness.js';

// Import detectors
import { detectBusinessRules } from './int/detectors/ruleDetector.js';
import { detectPatterns } from './int/detectors/patternDetector.js';
import { detectAnomalies } from './int/detectors/anomalyDetector.js';

// Import analysers
import { analyseFuzzyDuplicates } from './int/analysers/fuzzyMatcher.js';
import { validateAustralianData } from './int/analysers/australianValidator.js';
import { calculateQualityScore, generateQualityReport } from './int/analysers/qualityScorer.js';

// Import fixers
import { generateSQLFixes } from './int/fixers/sqlGenerator.js';
import { generatePythonFixes } from './int/fixers/pythonGenerator.js';

export async function integrity(filePath, options = {}) {
  const outputHandler = new OutputHandler(options);
  const spinner = options.quiet ? null : ora('Reading CSV file...').start();
  
  try {
    // Load data
    let data, headers, columnTypes;
    if (options.preloadedData) {
      data = options.preloadedData.records;
      headers = Object.keys(data[0] || {});
      columnTypes = options.preloadedData.columnTypes;
    } else {
      data = await parseCSV(filePath, { quiet: options.quiet, header: options.header });
      headers = Object.keys(data[0] || {});
      
      if (spinner) spinner.text = 'Detecting column types...';
      columnTypes = detectColumnTypes(data);
    }
    
    const fileName = basename(filePath);
    
    // Handle empty dataset
    if (data.length === 0) {
      let report = createSection('DATA INTEGRITY REPORT',
        `Dataset: ${fileName}\nGenerated: ${formatTimestamp()}\n\n⚠️  Empty dataset - no data to check`);
      
      // Still include the required section header
      report += createSubSection('DATA QUALITY METRICS', 'No data available to analyze');
      
      console.log(report);
      outputHandler.finalize();
      return;
    }

    // Initialize results structure
    const analysisResults = {
      fileName,
      timestamp: formatTimestamp(),
      recordCount: data.length,
      columnCount: headers.length,
      dimensions: {},
      businessRules: null,
      patterns: null,
      anomalies: null,
      fuzzyDuplicates: null,
      australianValidation: null,
      qualityScore: null,
      fixes: {
        sql: null,
        python: null
      }
    };

    // Run quality dimension validators
    if (spinner) spinner.text = 'Analyzing data completeness...';
    analysisResults.dimensions.completeness = analyseCompleteness(data, headers);

    if (spinner) spinner.text = 'Validating data formats...';
    analysisResults.dimensions.validity = analyseValidity(data, headers, columnTypes);

    if (spinner) spinner.text = 'Checking data accuracy...';
    analysisResults.dimensions.accuracy = analyseAccuracy(data, headers, columnTypes);

    if (spinner) spinner.text = 'Evaluating data consistency...';
    analysisResults.dimensions.consistency = analyseConsistency(data, headers);

    if (spinner) spinner.text = 'Assessing data timeliness...';
    analysisResults.dimensions.timeliness = analyseTimeliness(data, headers);

    if (spinner) spinner.text = 'Detecting duplicate records...';
    analysisResults.dimensions.uniqueness = analyseUniqueness(data, headers);

    // Run advanced detectors
    if (spinner) spinner.text = 'Discovering business rules...';
    analysisResults.businessRules = detectBusinessRules(data, headers, columnTypes);

    if (spinner) spinner.text = 'Detecting patterns...';
    analysisResults.patterns = detectPatterns(data, headers, columnTypes);

    if (spinner) spinner.text = 'Finding anomalies...';
    analysisResults.anomalies = detectAnomalies(data, headers, columnTypes);

    // Run specialised analysers
    if (data.length < 10000) {
      if (spinner) spinner.text = 'Performing fuzzy duplicate analysis...';
      analysisResults.fuzzyDuplicates = analyseFuzzyDuplicates(data, headers);
    }

    if (spinner) spinner.text = 'Checking for Australian-specific data...';
    analysisResults.australianValidation = validateAustralianData(data, headers);

    // Calculate quality score
    if (spinner) spinner.text = 'Calculating data quality score...';
    analysisResults.qualityScore = calculateQualityScore(analysisResults.dimensions);

    // Generate fixes
    if (spinner) spinner.text = 'Generating automated fixes...';
    analysisResults.fixes.sql = generateSQLFixes(analysisResults);
    analysisResults.fixes.python = generatePythonFixes(analysisResults, fileName);

    // Generate report
    if (spinner) spinner.succeed('Data integrity analysis complete!');
    
    const report = generateComprehensiveReport(analysisResults);
    console.log(report);

    // Save fix scripts if requested
    if (options.generateFixes) {
      await saveFixes(analysisResults.fixes, fileName);
    }

    outputHandler.finalize();
    return analysisResults;

  } catch (error) {
    outputHandler.restore();
    if (spinner) spinner.fail('Error checking integrity');
    console.error(error.message);
    if (!options.quiet) process.exit(1);
    throw error;
  }
}

function generateComprehensiveReport(results) {
  let report = '';

  // Header
  report += createSection('DATA INTEGRITY REPORT',
    `Dataset: ${results.fileName}
Generated: ${results.timestamp}
Quality Framework: ISO 8000 / DAMA-DMBOK Aligned`);

  // Overall Quality Score
  const score = results.qualityScore;
  report += `\nOVERALL DATA QUALITY SCORE: ${score.overallScore}/100 (${score.grade.letter})
${score.grade.label}
${score.trend.symbol} ${score.trend.interpretation}
${score.benchmark.interpretation}\n`;

  // Critical Issues Summary
  const criticalIssues = collectCriticalIssues(results.dimensions);
  if (criticalIssues.length > 0) {
    report += createSubSection('CRITICAL ISSUES (immediate action required)',
      numberedList(criticalIssues.map(issue => 
        `${issue.field || issue.category}: ${issue.message} [${issue.type}]`
      ))
    );
  }

  // Warnings Summary
  const warnings = collectWarnings(results.dimensions);
  if (warnings.length > 0) {
    report += createSubSection('WARNINGS (should be addressed)',
      numberedList(warnings.slice(0, 10).map(issue => 
        `${issue.field || issue.category}: ${issue.message}`
      ))
    );
    if (warnings.length > 10) {
      report += `\n... and ${warnings.length - 10} more warnings\n`;
    }
  }

  // Business Rule Discovery
  if (results.businessRules && results.businessRules.length > 0) {
    report += createSubSection('BUSINESS RULE DISCOVERY',
      `Automatically Detected Rules (Confidence >95%):\n\n` +
      results.businessRules.slice(0, 5).map((rule, idx) => 
        `${idx + 1}. ${rule.type}: ${rule.rule}
   - Confidence: ${rule.confidence.toFixed(1)}%
   - Violations: ${rule.violations} records
   - SQL: ${rule.sql}`
      ).join('\n\n')
    );
  }

  // Pattern-Based Anomalies
  if (results.anomalies) {
    report += generateAnomalyReport(results.anomalies);
  }

  // Fuzzy Duplicate Analysis
  if (results.fuzzyDuplicates && results.fuzzyDuplicates.nearDuplicateGroups.length > 0) {
    report += createSubSection('FUZZY DUPLICATE ANALYSIS',
      `Algorithm Stack: ${results.fuzzyDuplicates.algorithms.join(', ')}
Near-Duplicate Groups Found: ${results.fuzzyDuplicates.nearDuplicateGroups.length}

Top Groups:
${results.fuzzyDuplicates.nearDuplicateGroups.slice(0, 3).map((group, idx) => 
  `[Group ${idx + 1}] ${group.recordCount} records (${group.similarity}% similarity)
${group.records.slice(0, 3).map(r => 
  `  - Row ${r.index}: ${JSON.stringify(r.data).substring(0, 80)}...`
).join('\n')}`
).join('\n\n')}`
    );
  }

  // Australian Data Validation
  if (results.australianValidation && results.australianValidation.detected) {
    report += generateAustralianValidationReport(results.australianValidation);
  }

  // Data Quality Metrics
  report += createSection('DATA QUALITY METRICS',
    `Overall Score: ${score.overallScore}/100 (${score.grade.letter})

Dimensional Breakdown:
┌─────────────────┬────────┬────────────────────────┐
│ Dimension       │ Score  │ Key Issues             │
├─────────────────┼────────┼────────────────────────┤
${score.scoreBreakdown.map(dim => 
  `│ ${dim.dimension.padEnd(15)} │ ${String(dim.score).padEnd(6)} │ ${(dim.performance + ' issues').padEnd(22)} │`
).join('\n')}
└─────────────────┴────────┴────────────────────────┘`
  );

  // Recommendations
  if (score.recommendations) {
    report += createSubSection('RECOMMENDATION PRIORITY MATRIX', '');
    
    if (score.recommendations.quickWins.length > 0) {
      report += '\n🎯 Quick Wins (High Impact, Low Effort):\n';
      report += numberedList(score.recommendations.quickWins.map(r => 
        `${r.action} [Impact: ${r.impact}, Effort: ${r.effort}]`
      ));
    }

    if (score.recommendations.strategic.length > 0) {
      report += '\n📋 Strategic Initiatives (High Impact, High Effort):\n';
      report += numberedList(score.recommendations.strategic.map(r => 
        `${r.action} [Impact: ${r.impact}, Effort: ${r.effort}]`
      ));
    }
  }

  // Automated Fix Scripts Available
  report += createSubSection('AUTOMATED FIX SCRIPTS',
    `SQL fixes available: ${results.fixes.sql ? 'Yes' : 'No'}
Python scripts available: ${results.fixes.python ? 'Yes' : 'No'}

To generate fix scripts, run with --generate-fixes flag`
  );

  // Data Quality Certification
  if (score.certification.certified) {
    report += createSubSection('DATA QUALITY CERTIFICATION',
      `${score.certification.badge} Achieved ${score.certification.level} Certification
Valid until: ${score.certification.validUntil}`
    );
  } else {
    report += createSubSection('CERTIFICATION STATUS',
      `Not yet certified. To achieve ${score.certification.nextLevel}:
- Improve score by ${score.certification.gap.score.toFixed(1)} points
- Fix ${score.certification.gap.criticalIssues} critical issues
- Resolve ${score.certification.gap.warnings} warnings`
    );
  }

  return report;
}

function collectCriticalIssues(dimensions) {
  const issues = [];
  Object.values(dimensions).forEach(dim => {
    if (dim.issues) {
      issues.push(...dim.issues.filter(i => i.type === 'critical'));
    }
  });
  return issues;
}

function collectWarnings(dimensions) {
  const warnings = [];
  Object.values(dimensions).forEach(dim => {
    if (dim.issues) {
      warnings.push(...dim.issues.filter(i => i.type === 'warning'));
    }
  });
  return warnings;
}

function generateAnomalyReport(anomalies) {
  let report = createSubSection('PATTERN-BASED ANOMALIES', '');

  if (anomalies.benfordLaw.length > 0) {
    report += "\nBenford's Law Analysis:\n";
    anomalies.benfordLaw.forEach(result => {
      report += `- ${result.field}: ${result.interpretation} (χ² = ${result.chiSquare}, p ${result.pValue})\n`;
    });
  }

  if (anomalies.roundNumberBias.length > 0) {
    report += '\nRound Number Bias:\n';
    anomalies.roundNumberBias.forEach(result => {
      report += `- ${result.field}: ${result.interpretation}\n`;
      result.biases.forEach(bias => {
        report += `  * ${bias.pattern}: ${bias.observedRate} vs expected ${bias.expectedRate}\n`;
      });
    });
  }

  if (anomalies.fraudIndicators.length > 0) {
    report += '\nPotential Fraud Indicators:\n';
    anomalies.fraudIndicators.forEach(indicator => {
      report += `- ${indicator.type}: ${indicator.interpretation}\n`;
    });
  }

  return report;
}

function generateAustralianValidationReport(validation) {
  let report = createSubSection('AUSTRALIAN DATA VALIDATION', '');

  if (validation.validations.abn) {
    const abn = validation.validations.abn;
    report += `\nABN Validation:
- Valid format: ${abn.valid}/${abn.total} (${abn.validRate})
- Invalid check digit: ${abn.invalid.length}
- Defunct companies: ${abn.defunct.length}\n`;
  }

  if (validation.validations.postcodes) {
    const pc = validation.validations.postcodes;
    report += `\nPostcode Analysis:
- Valid postcodes: ${pc.valid}/${pc.total} (${pc.validRate})
- State mismatches: ${pc.stateMismatches.length}
- Distribution: ${Object.entries(pc.distribution).map(([state, pct]) => `${state}: ${pct}`).join(', ')}\n`;
  }

  if (validation.validations.phoneNumbers) {
    report += '\nPhone Number Validation:\n';
    Object.entries(validation.validations.phoneNumbers).forEach(([col, result]) => {
      report += `- ${col}: ${result.validRate} valid (Mobile: ${result.breakdown.mobile}, Landline: ${result.breakdown.landline})\n`;
    });
  }

  return report;
}

async function saveFixes(fixes, fileName) {
  const fs = await import('fs/promises');
  
  if (fixes.sql) {
    const sqlFile = fileName.replace('.csv', '_fixes.sql');
    await fs.writeFile(sqlFile, fixes.sql);
    console.log(`\n✅ SQL fixes saved to: ${sqlFile}`);
  }

  if (fixes.python) {
    const pyFile = fileName.replace('.csv', '_fixes.py');
    await fs.writeFile(pyFile, fixes.python);
    console.log(`✅ Python scripts saved to: ${pyFile}`);
  }
}