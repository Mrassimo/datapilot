export function detectPatterns(records, columns, columnTypes) {
  const patterns = {
    benfordLaw: [],
    businessRules: [],
    temporalPatterns: [],
    duplicatePatterns: [],
    anomalies: []
  };

  columns.forEach(col => {
    const type = columnTypes[col];
    const values = records.map(r => r[col]);

    // Benford's Law for financial data
    if (['integer', 'float'].includes(type.type)) {
      const benfordResult = checkBenfordLaw(values);
      if (benfordResult.applicable) {
        patterns.benfordLaw.push({
          column: col,
          ...benfordResult
        });
      }
    }

    // Business rule detection
    const rules = detectBusinessRules(values, type);
    if (rules.length > 0) {
      patterns.businessRules.push({
        column: col,
        rules
      });
    }

    // Temporal patterns for date columns
    if (type.type === 'date') {
      const temporal = detectTemporalPatterns(records, col);
      if (temporal.patterns.length > 0) {
        patterns.temporalPatterns.push({
          column: col,
          ...temporal
        });
      }
    }
  });

  // Detect row-level duplicates
  patterns.duplicatePatterns = detectDuplicatePatterns(records, columns);

  // Detect multivariate anomalies
  patterns.anomalies = detectAnomalies(records, columns, columnTypes);

  return patterns;
}

function checkBenfordLaw(values) {
  const numbers = values.filter(v => typeof v === 'number' && v > 0);
  
  if (numbers.length < 100) {
    return { applicable: false, reason: 'Too few positive numbers' };
  }

  // Count first digits
  const firstDigitCounts = Array(9).fill(0);
  numbers.forEach(num => {
    const firstDigit = parseInt(String(Math.abs(num))[0]);
    if (firstDigit >= 1 && firstDigit <= 9) {
      firstDigitCounts[firstDigit - 1]++;
    }
  });

  // Calculate expected vs actual
  const expectedFreq = [0.301, 0.176, 0.125, 0.097, 0.079, 0.067, 0.058, 0.051, 0.046];
  const actualFreq = firstDigitCounts.map(count => count / numbers.length);
  
  // Chi-square test
  let chiSquare = 0;
  for (let i = 0; i < 9; i++) {
    if (expectedFreq[i] > 0) {
      chiSquare += Math.pow(actualFreq[i] - expectedFreq[i], 2) / expectedFreq[i];
    }
  }

  const criticalValue = 15.507; // Chi-square critical value at 0.05 significance, 8 df
  const followsBenford = chiSquare < criticalValue;

  return {
    applicable: true,
    followsBenford,
    chiSquare: chiSquare.toFixed(3),
    firstDigitDistribution: actualFreq.map((f, i) => ({
      digit: i + 1,
      expected: (expectedFreq[i] * 100).toFixed(1) + '%',
      actual: (f * 100).toFixed(1) + '%'
    })),
    interpretation: followsBenford 
      ? 'Data follows Benford\'s Law (typical of natural financial data)'
      : 'Data deviates from Benford\'s Law (may indicate artificial or manipulated data)'
  };
}

function detectBusinessRules(values, type) {
  const rules = [];
  const nonNull = values.filter(v => v !== null && v !== undefined);

  if (nonNull.length === 0) return rules;

  // Numeric constraints
  if (['integer', 'float'].includes(type.type)) {
    const numbers = nonNull.filter(v => typeof v === 'number');
    const min = Math.min(...numbers);
    const max = Math.max(...numbers);
    
    // Check for common constraints
    if (min >= 0) rules.push('Non-negative values only');
    if (min >= 1) rules.push('Positive values only');
    if (max <= 100 && min >= 0) rules.push('Percentage values (0-100)');
    if (max <= 1 && min >= 0) rules.push('Probability values (0-1)');
    
    // Check for integer multiples
    if (type.type === 'integer' && numbers.length > 10) {
      const gcd = numbers.reduce((a, b) => {
        while (b) {
          const temp = b;
          b = a % b;
          a = temp;
        }
        return a;
      });
      if (gcd > 1) rules.push(`Values are multiples of ${gcd}`);
    }
  }

  // String patterns
  if (type.type === 'categorical') {
    const lengths = nonNull.map(v => String(v).length);
    const uniqueLengths = new Set(lengths);
    
    if (uniqueLengths.size === 1) {
      rules.push(`Fixed length: ${lengths[0]} characters`);
    }
    
    // Check for common prefixes/suffixes
    if (nonNull.length > 10) {
      const strings = nonNull.map(v => String(v));
      const commonPrefix = strings.reduce((prefix, str) => {
        while (str.indexOf(prefix) !== 0) {
          prefix = prefix.substring(0, prefix.length - 1);
        }
        return prefix;
      });
      
      if (commonPrefix.length > 2) {
        rules.push(`Common prefix: "${commonPrefix}"`);
      }
    }
  }

  return rules;
}

function detectTemporalPatterns(records, dateColumn) {
  const dates = records
    .map(r => r[dateColumn])
    .filter(d => d instanceof Date);

  if (dates.length < 30) {
    return { patterns: [] };
  }

  const patterns = [];
  
  // Day of week distribution
  const dayOfWeekCounts = Array(7).fill(0);
  dates.forEach(date => {
    dayOfWeekCounts[date.getDay()]++;
  });
  
  const avgPerDay = dates.length / 7;
  const peakDay = dayOfWeekCounts.indexOf(Math.max(...dayOfWeekCounts));
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  if (Math.max(...dayOfWeekCounts) > avgPerDay * 1.5) {
    patterns.push(`Peak activity on ${dayNames[peakDay]}`);
  }

  // Hour distribution (if time component exists)
  const hasTime = dates.some(d => d.getHours() !== 0 || d.getMinutes() !== 0);
  if (hasTime) {
    const hourCounts = Array(24).fill(0);
    dates.forEach(date => {
      hourCounts[date.getHours()]++;
    });
    
    const peakHour = hourCounts.indexOf(Math.max(...hourCounts));
    patterns.push(`Peak hour: ${peakHour}:00`);
    
    // Business hours check
    const businessHours = hourCounts.slice(9, 17).reduce((a, b) => a + b, 0);
    const afterHours = dates.length - businessHours;
    if (businessHours > dates.length * 0.8) {
      patterns.push('Primarily business hours activity');
    }
  }

  return { patterns };
}

function detectDuplicatePatterns(records, columns) {
  const patterns = [];
  
  // Full row duplicates
  const rowStrings = records.map(r => JSON.stringify(r));
  const duplicateRows = rowStrings.filter((row, index) => 
    rowStrings.indexOf(row) !== index
  ).length;
  
  if (duplicateRows > 0) {
    patterns.push({
      type: 'full_row',
      count: duplicateRows,
      percentage: (duplicateRows / records.length * 100).toFixed(1)
    });
  }

  // Subset duplicates (excluding likely ID columns)
  const nonIdColumns = columns.filter(col => {
    const values = records.map(r => r[col]);
    const uniqueRatio = new Set(values).size / values.length;
    return uniqueRatio < 0.95;
  });

  if (nonIdColumns.length > 2) {
    const subsetStrings = records.map(r => 
      JSON.stringify(nonIdColumns.reduce((obj, col) => {
        obj[col] = r[col];
        return obj;
      }, {}))
    );
    
    const subsetDuplicates = subsetStrings.filter((row, index) => 
      subsetStrings.indexOf(row) !== index
    ).length;
    
    if (subsetDuplicates > duplicateRows) {
      patterns.push({
        type: 'subset',
        count: subsetDuplicates - duplicateRows,
        percentage: ((subsetDuplicates - duplicateRows) / records.length * 100).toFixed(1),
        note: 'Duplicates when ignoring potential ID columns'
      });
    }
  }

  return patterns;
}

function detectAnomalies(records, columns, columnTypes) {
  const anomalies = [];
  
  // Check for suspicious null patterns
  const nullCounts = {};
  columns.forEach(col => {
    nullCounts[col] = records.filter(r => r[col] === null || r[col] === undefined).length;
  });
  
  // Find rows with many nulls
  const suspiciousRows = [];
  records.forEach((record, index) => {
    const nullCount = columns.filter(col => 
      record[col] === null || record[col] === undefined
    ).length;
    
    if (nullCount > columns.length * 0.5) {
      suspiciousRows.push(index);
    }
  });
  
  if (suspiciousRows.length > 0) {
    anomalies.push({
      type: 'sparse_rows',
      count: suspiciousRows.length,
      indices: suspiciousRows.slice(0, 5),
      description: 'Rows with >50% missing values'
    });
  }

  return anomalies;
}