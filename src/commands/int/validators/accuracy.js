import * as ss from 'simple-statistics';

export function analyseAccuracy(data, headers, columnTypes) {
  const results = {
    dimension: 'Accuracy',
    weight: 0.20,
    issues: [],
    metrics: {},
    score: 100
  };

  const accuracyChecks = {};

  headers.forEach((header, colIndex) => {
    const columnData = data.map(row => row[colIndex]).filter(val => val !== null && val !== '');
    const type = columnTypes[header];

    accuracyChecks[header] = {
      outliers: [],
      impossibleValues: [],
      statisticalAnomalies: [],
      businessRuleViolations: []
    };

    if (type === 'numeric' && columnData.length > 0) {
      const numericData = columnData.map(v => parseFloat(v)).filter(v => !isNaN(v));
      
      if (numericData.length > 10) {
        const outliers = detectStatisticalOutliers(numericData);
        const impossible = detectImpossibleValues(numericData, header);
        const anomalies = detectStatisticalAnomalies(numericData, header);

        accuracyChecks[header].outliers = outliers;
        accuracyChecks[header].impossibleValues = impossible;
        accuracyChecks[header].statisticalAnomalies = anomalies;

        if (outliers.severe.length > 0) {
          results.issues.push({
            type: 'critical',
            field: header,
            message: `${outliers.severe.length} severe outliers detected`,
            details: `Values beyond 3 standard deviations: ${outliers.severe.slice(0, 5).join(', ')}${outliers.severe.length > 5 ? '...' : ''}`,
            impact: 'May indicate data entry errors or system issues'
          });
          results.score -= 10;
        }

        if (impossible.length > 0) {
          results.issues.push({
            type: 'critical',
            field: header,
            message: `${impossible.length} impossible values found`,
            examples: impossible.slice(0, 5).map(v => v.value),
            reasons: impossible.slice(0, 3).map(v => v.reason)
          });
          results.score -= 15;
        }

        if (anomalies.length > 0) {
          anomalies.forEach(anomaly => {
            results.issues.push({
              type: anomaly.severity,
              field: header,
              message: anomaly.message,
              details: anomaly.details,
              statisticalTest: anomaly.test
            });
            results.score -= anomaly.severity === 'critical' ? 10 : 5;
          });
        }
      }
    }

    const businessRules = detectBusinessRuleViolations(columnData, header, data, headers, colIndex);
    if (businessRules.length > 0) {
      accuracyChecks[header].businessRuleViolations = businessRules;
      businessRules.forEach(rule => {
        results.issues.push({
          type: rule.severity,
          field: header,
          message: rule.message,
          violationCount: rule.count,
          confidence: rule.confidence
        });
        results.score -= rule.severity === 'critical' ? 10 : 5;
      });
    }
  });

  const referentialIssues = checkReferentialIntegrity(data, headers);
  if (referentialIssues.length > 0) {
    results.issues.push(...referentialIssues);
    referentialIssues.forEach(issue => {
      results.score -= issue.type === 'critical' ? 10 : 5;
    });
  }

  results.metrics = {
    totalOutliers: Object.values(accuracyChecks).reduce((sum, check) => 
      sum + (check.outliers?.severe?.length || 0) + (check.outliers?.moderate?.length || 0), 0),
    totalImpossibleValues: Object.values(accuracyChecks).reduce((sum, check) => 
      sum + check.impossibleValues.length, 0),
    totalBusinessRuleViolations: Object.values(accuracyChecks).reduce((sum, check) => 
      sum + check.businessRuleViolations.reduce((s, r) => s + r.count, 0), 0),
    accuracyChecks: accuracyChecks
  };

  results.score = Math.max(0, results.score);
  return results;
}

function detectStatisticalOutliers(values) {
  if (values.length < 10) return { severe: [], moderate: [] };

  const mean = ss.mean(values);
  const stdDev = ss.standardDeviation(values);
  const q1 = ss.quantile(values, 0.25);
  const q3 = ss.quantile(values, 0.75);
  const iqr = q3 - q1;

  const outliers = {
    severe: [],
    moderate: []
  };

  values.forEach(value => {
    const zScore = Math.abs((value - mean) / stdDev);
    
    if (zScore > 3) {
      outliers.severe.push(value);
    } else if (zScore > 2) {
      outliers.moderate.push(value);
    }

    if (value < q1 - 3 * iqr || value > q3 + 3 * iqr) {
      if (!outliers.severe.includes(value)) {
        outliers.severe.push(value);
      }
    } else if (value < q1 - 1.5 * iqr || value > q3 + 1.5 * iqr) {
      if (!outliers.moderate.includes(value) && !outliers.severe.includes(value)) {
        outliers.moderate.push(value);
      }
    }
  });

  return outliers;
}

function detectImpossibleValues(values, fieldName) {
  const impossible = [];
  const fieldLower = fieldName.toLowerCase();

  values.forEach(value => {
    if (fieldLower.includes('age')) {
      if (value < 0 || value > 150) {
        impossible.push({ value, reason: 'Age outside valid range (0-150)' });
      }
    } else if (fieldLower.includes('percentage') || fieldLower.includes('percent')) {
      if (value < 0 || value > 100) {
        impossible.push({ value, reason: 'Percentage outside 0-100 range' });
      }
    } else if (fieldLower.includes('price') || fieldLower.includes('amount') || fieldLower.includes('cost')) {
      if (value < 0) {
        impossible.push({ value, reason: 'Negative monetary value' });
      }
    } else if (fieldLower.includes('quantity') || fieldLower.includes('count')) {
      if (value < 0 || !Number.isInteger(value)) {
        impossible.push({ value, reason: 'Invalid quantity (must be non-negative integer)' });
      }
    } else if (fieldLower.includes('year')) {
      const currentYear = new Date().getFullYear();
      if (value < 1900 || value > currentYear + 10) {
        impossible.push({ value, reason: `Year outside reasonable range (1900-${currentYear + 10})` });
      }
    }
  });

  return impossible;
}

function detectStatisticalAnomalies(values, fieldName) {
  const anomalies = [];

  if (values.length > 100) {
    const benfordResult = checkBenfordsLaw(values, fieldName);
    if (benfordResult) {
      anomalies.push(benfordResult);
    }

    const roundNumberBias = checkRoundNumberBias(values);
    if (roundNumberBias) {
      anomalies.push(roundNumberBias);
    }
  }

  const distributionAnomaly = checkDistributionAnomaly(values);
  if (distributionAnomaly) {
    anomalies.push(distributionAnomaly);
  }

  return anomalies;
}

function checkBenfordsLaw(values, fieldName) {
  const applicableFields = ['revenue', 'amount', 'sales', 'transaction', 'price'];
  const fieldLower = fieldName.toLowerCase();
  
  if (!applicableFields.some(field => fieldLower.includes(field))) {
    return null;
  }

  const positiveValues = values.filter(v => v > 0);
  if (positiveValues.length < 100) return null;

  const firstDigitCounts = Array(9).fill(0);
  const expectedBenford = [30.1, 17.6, 12.5, 9.7, 7.9, 6.7, 5.8, 5.1, 4.6];

  positiveValues.forEach(value => {
    const firstDigit = parseInt(value.toString().replace('.', '')[0]);
    if (firstDigit >= 1 && firstDigit <= 9) {
      firstDigitCounts[firstDigit - 1]++;
    }
  });

  const observedPercentages = firstDigitCounts.map(count => 
    (count / positiveValues.length) * 100
  );

  let chiSquare = 0;
  for (let i = 0; i < 9; i++) {
    const expected = expectedBenford[i] * positiveValues.length / 100;
    const observed = firstDigitCounts[i];
    if (expected > 0) {
      chiSquare += Math.pow(observed - expected, 2) / expected;
    }
  }

  if (chiSquare > 21.666) {
    return {
      test: "Benford's Law",
      severity: 'warning',
      message: "Distribution doesn't follow Benford's Law",
      details: `Chi-square: ${chiSquare.toFixed(2)}, p-value < 0.01`,
      interpretation: 'Possible data manipulation or artificial values'
    };
  }

  return null;
}

function checkRoundNumberBias(values) {
  const roundNumbers = values.filter(v => {
    const str = v.toString();
    return v % 10 === 0 || v % 100 === 0 || v % 1000 === 0 ||
           str.endsWith('00') || str.endsWith('000');
  });

  const roundPercentage = (roundNumbers.length / values.length) * 100;
  const expectedPercentage = 10;

  if (roundPercentage > expectedPercentage * 3) {
    return {
      test: 'Round Number Bias',
      severity: 'warning',
      message: `Excessive round numbers detected (${roundPercentage.toFixed(1)}% vs expected ~${expectedPercentage}%)`,
      details: `${roundNumbers.length} round numbers out of ${values.length} values`,
      interpretation: 'Likely manual entries or estimates'
    };
  }

  return null;
}

function checkDistributionAnomaly(values) {
  if (values.length < 30) return null;

  const mean = ss.mean(values);
  const median = ss.median(values);
  const stdDev = ss.standardDeviation(values);
  
  const skewness = ss.sampleSkewness(values);
  const kurtosis = values.length > 3 ? calculateKurtosis(values) : null;

  if (Math.abs(skewness) > 2) {
    return {
      test: 'Distribution Skewness',
      severity: 'observation',
      message: `Highly ${skewness > 0 ? 'right' : 'left'}-skewed distribution`,
      details: `Skewness: ${skewness.toFixed(2)}, Mean: ${mean.toFixed(2)}, Median: ${median.toFixed(2)}`,
      interpretation: skewness > 0 ? 'Long tail of high values' : 'Long tail of low values'
    };
  }

  if (kurtosis && Math.abs(kurtosis - 3) > 3) {
    return {
      test: 'Distribution Kurtosis',
      severity: 'observation',
      message: kurtosis > 3 ? 'Heavy-tailed distribution' : 'Light-tailed distribution',
      details: `Kurtosis: ${kurtosis.toFixed(2)} (normal = 3)`,
      interpretation: kurtosis > 3 ? 'More outliers than normal' : 'Fewer outliers than normal'
    };
  }

  return null;
}

function calculateKurtosis(values) {
  const n = values.length;
  const mean = ss.mean(values);
  const stdDev = ss.standardDeviation(values);
  
  let sum = 0;
  values.forEach(value => {
    sum += Math.pow((value - mean) / stdDev, 4);
  });
  
  return (n * (n + 1) / ((n - 1) * (n - 2) * (n - 3))) * sum - 
         (3 * Math.pow(n - 1, 2)) / ((n - 2) * (n - 3));
}

function detectBusinessRuleViolations(columnData, header, allData, allHeaders, colIndex) {
  const violations = [];
  const headerLower = header.toLowerCase();

  if (headerLower.includes('total') || headerLower.includes('sum')) {
    const relatedColumns = findRelatedColumns(header, allHeaders);
    if (relatedColumns.length > 0) {
      let violationCount = 0;
      allData.forEach((row, rowIndex) => {
        const total = parseFloat(row[colIndex]);
        if (!isNaN(total)) {
          const sum = relatedColumns.reduce((acc, relCol) => {
            const val = parseFloat(row[relCol.index]);
            return acc + (isNaN(val) ? 0 : val);
          }, 0);
          
          if (Math.abs(total - sum) > 0.01) {
            violationCount++;
          }
        }
      });

      if (violationCount > 0) {
        violations.push({
          rule: 'Calculated Field Consistency',
          message: `${header} doesn't match sum of related fields`,
          count: violationCount,
          confidence: ((allData.length - violationCount) / allData.length * 100).toFixed(1) + '%',
          severity: violationCount > allData.length * 0.1 ? 'critical' : 'warning'
        });
      }
    }
  }

  return violations;
}

function findRelatedColumns(totalColumn, allHeaders) {
  const related = [];
  const baseName = totalColumn.toLowerCase()
    .replace('total', '')
    .replace('sum', '')
    .trim();

  allHeaders.forEach((header, index) => {
    const headerLower = header.toLowerCase();
    if (header !== totalColumn && 
        (headerLower.includes(baseName) || baseName.includes(headerLower)) &&
        !headerLower.includes('total') && 
        !headerLower.includes('sum')) {
      related.push({ header, index });
    }
  });

  return related;
}

function checkReferentialIntegrity(data, headers) {
  const issues = [];
  const idColumns = headers.map((h, i) => ({ header: h, index: i }))
    .filter(col => col.header.toLowerCase().includes('_id') || 
                   col.header.toLowerCase().endsWith('id'));

  idColumns.forEach(idCol => {
    const referencedEntity = idCol.header.toLowerCase()
      .replace('_id', '')
      .replace('id', '');
    
    const uniqueIds = new Set();
    const idCounts = {};

    data.forEach(row => {
      const id = row[idCol.index];
      if (id !== null && id !== '') {
        uniqueIds.add(id);
        idCounts[id] = (idCounts[id] || 0) + 1;
      }
    });

    const orphanedIds = Array.from(uniqueIds).filter(id => {
      return false;
    });

    if (orphanedIds.length > 0) {
      issues.push({
        type: 'warning',
        field: idCol.header,
        message: `Potential referential integrity issue`,
        details: `${orphanedIds.length} unique IDs may reference missing ${referencedEntity} records`,
        recommendation: 'Verify foreign key relationships'
      });
    }
  });

  return issues;
}