/**
 * Example of INT command migrated to unified formatting
 * This shows the pattern for updating all commands
 */

import { parseCSV, detectColumnTypes } from '../utils/parser.js';
import { formatTimestamp } from '../utils/format.js';
import { 
  colors, 
  symbols, 
  createHeader,
  createSubsection,
  createTable,
  createList,
  createStandardSpinner,
  formatPercent,
  createSuccess,
  createWarning,
  createError,
  createInfo,
  OutputFormatter,
  createKeyValue,
  createSummaryBox,
  createProgressBar,
  withStandardFormatting
} from '../utils/unifiedFormat.js';
import { basename } from 'path';
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
  
  return withStandardFormatting('Data Integrity Analysis', async (spinner) => {
    try {
      // Load data
      let data, headers, columnTypes;
      if (options.preloadedData) {
        data = options.preloadedData.records;
        headers = Object.keys(data[0] || {});
        columnTypes = options.preloadedData.columnTypes;
      } else {
        spinner.update({ text: 'Reading CSV file...' });
        data = await parseCSV(filePath, { quiet: options.quiet, header: options.header });
        headers = Object.keys(data[0] || {});
        
        spinner.update({ text: 'Detecting column types...' });
        columnTypes = detectColumnTypes(data);
      }
      
      const fileName = basename(filePath);
      
      // Handle empty dataset
      if (data.length === 0) {
        const formatter = new OutputFormatter('Data Integrity');
        formatter
          .addHeader('Data Integrity Report', `Dataset: ${fileName}`)
          .addSection('Analysis Status', createWarning('Empty dataset - no data to check'), symbols.warning);
        
        console.log(formatter.render());
        outputHandler.finalize();
        return;
      }
      
      // Run analyses with progress updates
      spinner.update({ text: 'Analyzing data completeness...' });
      const completeness = analyseCompleteness(data, headers);
      spinner.updateProgress(1, 6, 'Analyzing data quality');
      
      spinner.update({ text: 'Validating data types...' });
      const validity = analyseValidity(data, headers, columnTypes);
      spinner.updateProgress(2, 6, 'Analyzing data quality');
      
      spinner.update({ text: 'Checking data accuracy...' });
      const accuracy = analyseAccuracy(data, headers, columnTypes);
      spinner.updateProgress(3, 6, 'Analyzing data quality');
      
      spinner.update({ text: 'Analyzing consistency...' });
      const consistency = analyseConsistency(data, headers, columnTypes);
      spinner.updateProgress(4, 6, 'Analyzing data quality');
      
      spinner.update({ text: 'Detecting patterns...' });
      const businessRules = detectBusinessRules(data, headers, columnTypes);
      const patterns = detectPatterns(data, headers, columnTypes);
      const anomalies = detectAnomalies(data, headers, columnTypes);
      spinner.updateProgress(5, 6, 'Analyzing data quality');
      
      spinner.update({ text: 'Calculating quality score...' });
      const dimensions = {
        completeness,
        validity,
        accuracy,
        consistency,
        timeliness: analyseTimeliness(data, headers, columnTypes),
        uniqueness: analyseUniqueness(data, headers, columnTypes)
      };
      
      const qualityScore = calculateQualityScore(dimensions);
      spinner.updateProgress(6, 6, 'Finalizing analysis');
      
      // Generate unified format report
      const report = generateUnifiedReport({
        fileName,
        timestamp: formatTimestamp(),
        dimensions,
        qualityScore,
        businessRules,
        patterns,
        anomalies,
        fixes: {
          sql: generateSQLFixes(dimensions, businessRules),
          python: generatePythonFixes(dimensions, businessRules)
        }
      });
      
      console.log(report);
      outputHandler.finalize();
      
      return {
        dimensions,
        qualityScore,
        businessRules,
        patterns,
        anomalies
      };
      
    } catch (error) {
      outputHandler.restore();
      throw error;
    }
  });
}

function generateUnifiedReport(results) {
  const formatter = new OutputFormatter('Data Integrity');
  
  // Header with subtitle
  formatter.addHeader(
    'Data Integrity Report',
    `${results.fileName} • ${results.timestamp}`
  );
  
  // Quality Score Summary Box
  const score = results.qualityScore;
  const scoreColor = score.overallScore >= 80 ? 'success' : 
                     score.overallScore >= 60 ? 'warning' : 'error';
  
  formatter.addSummary('Overall Quality Score', [
    { label: 'Score', value: colors[scoreColor](`${score.overallScore}/100 (${score.grade.letter})`) },
    { label: 'Grade', value: score.grade.label },
    { label: 'Trend', value: `${score.trend.symbol} ${score.trend.interpretation}` },
    { label: 'Benchmark', value: score.benchmark.interpretation }
  ]);
  
  // Critical Issues with styled alerts
  const criticalIssues = collectCriticalIssues(results.dimensions);
  if (criticalIssues.length > 0) {
    formatter.addSection(
      'Critical Issues', 
      createList(
        criticalIssues.map(issue => 
          createError(`${issue.field || issue.category}: ${issue.message} [${issue.type}]`)
        ),
        { bullet: symbols.error }
      ),
      symbols.error
    );
  }
  
  // Warnings with styled alerts
  const warnings = collectWarnings(results.dimensions);
  if (warnings.length > 0) {
    formatter.addSection(
      'Warnings',
      createList(
        warnings.slice(0, 10).map(issue => 
          createWarning(`${issue.field || issue.category}: ${issue.message}`)
        ),
        { bullet: symbols.warning }
      ),
      symbols.warning
    );
    
    if (warnings.length > 10) {
      formatter.addSection('', colors.muted(`... and ${warnings.length - 10} more warnings`));
    }
  }
  
  // Business Rules as a formatted table
  if (results.businessRules && results.businessRules.length > 0) {
    const ruleRows = results.businessRules.slice(0, 5).map(rule => [
      rule.type,
      rule.rule,
      formatPercent(rule.confidence / 100),
      colors.number(rule.violations)
    ]);
    
    formatter.addTable(
      'Business Rule Discovery',
      ['Type', 'Rule', 'Confidence', 'Violations'],
      ruleRows,
      { icon: symbols.lightbulb }
    );
  }
  
  // Data Quality Dimensions with progress bars
  formatter.addSection(
    'Data Quality Dimensions',
    generateDimensionsDisplay(results.dimensions),
    symbols.chart
  );
  
  // Pattern-Based Anomalies
  if (results.anomalies && results.anomalies.length > 0) {
    formatter.addSection(
      'Pattern Anomalies Detected',
      createList(
        results.anomalies.slice(0, 5).map(anomaly => 
          `${colors.warning(anomaly.type)}: ${anomaly.description} (${colors.number(anomaly.count)} occurrences)`
        )
      ),
      symbols.analysis
    );
  }
  
  // Available Fixes
  if (results.fixes.sql || results.fixes.python) {
    const fixes = [];
    if (results.fixes.sql) fixes.push(createSuccess('SQL automated fixes generated'));
    if (results.fixes.python) fixes.push(createSuccess('Python automated fixes generated'));
    
    formatter.addSection(
      'Automated Fixes Available',
      fixes.join('\n'),
      symbols.optimize
    );
  }
  
  formatter.addSeparator();
  
  // Footer with recommendations
  formatter.addSection(
    'Next Steps',
    createList([
      'Review critical issues and apply automated fixes',
      'Investigate pattern anomalies for business rule violations',
      'Monitor quality score trends over time',
      'Consider implementing data validation at source'
    ]),
    symbols.arrow
  );
  
  return formatter.render();
}

function generateDimensionsDisplay(dimensions) {
  const dimensionData = [
    { name: 'Completeness', value: dimensions.completeness.score },
    { name: 'Validity', value: dimensions.validity.score },
    { name: 'Accuracy', value: dimensions.accuracy.score },
    { name: 'Consistency', value: dimensions.consistency.score },
    { name: 'Timeliness', value: dimensions.timeliness.score },
    { name: 'Uniqueness', value: dimensions.uniqueness.score }
  ];
  
  return dimensionData.map(dim => {
    const bar = createProgressBar(dim.value, 100, { width: 20 });
    return `${dim.name.padEnd(15)} ${bar}`;
  }).join('\n');
}

function collectCriticalIssues(dimensions) {
  const issues = [];
  
  Object.entries(dimensions).forEach(([dimension, results]) => {
    if (results.criticalIssues) {
      issues.push(...results.criticalIssues);
    }
  });
  
  return issues.sort((a, b) => (b.severity || 0) - (a.severity || 0));
}

function collectWarnings(dimensions) {
  const warnings = [];
  
  Object.entries(dimensions).forEach(([dimension, results]) => {
    if (results.warnings) {
      warnings.push(...results.warnings);
    }
  });
  
  return warnings;
}