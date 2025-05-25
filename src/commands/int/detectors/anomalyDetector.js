export function detectAnomalies(data, headers, columnTypes) {
  const anomalies = {
    statistical: [],
    benfordLaw: [],
    roundNumberBias: [],
    timeSeriesAnomalies: [],
    fraudIndicators: []
  };

  headers.forEach((header, colIndex) => {
    const columnData = data.map(row => row[colIndex]);
    const type = columnTypes[header];

    if (type === 'numeric') {
      const numericData = columnData
        .filter(v => v !== null && v !== '')
        .map(v => parseFloat(v))
        .filter(v => !isNaN(v));

      if (numericData.length > 100) {
        const benfordResult = testBenfordsLaw(numericData, header);
        if (benfordResult) {
          anomalies.benfordLaw.push(benfordResult);
        }

        const roundNumberResult = detectRoundNumberBias(numericData, header);
        if (roundNumberResult) {
          anomalies.roundNumberBias.push(roundNumberResult);
        }

        const statisticalAnomalies = detectStatisticalAnomalies(numericData, header);
        anomalies.statistical.push(...statisticalAnomalies);
      }
    }

    if (type === 'date' || header.toLowerCase().includes('date')) {
      const timeSeriesAnomalies = detectTimeSeriesAnomalies(columnData, header, data, colIndex);
      anomalies.timeSeriesAnomalies.push(...timeSeriesAnomalies);
    }
  });

  const fraudPatterns = detectFraudPatterns(data, headers, columnTypes);
  anomalies.fraudIndicators.push(...fraudPatterns);

  return anomalies;
}

function testBenfordsLaw(values, fieldName) {
  const applicableFields = [
    'revenue', 'amount', 'sales', 'transaction', 'price', 
    'payment', 'invoice', 'order', 'purchase', 'expense'
  ];
  
  const fieldLower = fieldName.toLowerCase();
  const isApplicable = applicableFields.some(field => fieldLower.includes(field));
  
  if (!isApplicable) return null;

  const positiveValues = values.filter(v => v > 0);
  if (positiveValues.length < 100) return null;

  const benfordExpected = [30.1, 17.6, 12.5, 9.7, 7.9, 6.7, 5.8, 5.1, 4.6];
  const firstDigitCounts = Array(9).fill(0);
  const observedDistribution = Array(9).fill(0);

  positiveValues.forEach(value => {
    const firstDigit = getFirstDigit(value);
    if (firstDigit >= 1 && firstDigit <= 9) {
      firstDigitCounts[firstDigit - 1]++;
    }
  });

  const total = firstDigitCounts.reduce((a, b) => a + b, 0);
  for (let i = 0; i < 9; i++) {
    observedDistribution[i] = (firstDigitCounts[i] / total) * 100;
  }

  const chiSquare = calculateChiSquare(firstDigitCounts, benfordExpected, total);
  const criticalValue = 21.666;
  const pValue = chiSquare > criticalValue ? '<0.01' : '>0.01';

  if (chiSquare > criticalValue) {
    return {
      type: 'BENFORD_LAW_VIOLATION',
      field: fieldName,
      test: "Benford's Law Test",
      chiSquare: chiSquare.toFixed(2),
      pValue: pValue,
      interpretation: 'Distribution significantly deviates from Benford\'s Law',
      possibleCauses: [
        'Data manipulation or fraud',
        'Artificial constraints on values',
        'Systematic rounding or estimation',
        'Data entry from limited sources'
      ],
      distribution: {
        expected: benfordExpected.map((v, i) => ({
          digit: i + 1,
          expected: `${v}%`,
          observed: `${observedDistribution[i].toFixed(1)}%`,
          deviation: `${(observedDistribution[i] - v).toFixed(1)}%`
        }))
      },
      recommendation: 'Investigate transactions with unusual first-digit patterns'
    };
  }

  return null;
}

function getFirstDigit(value) {
  const str = Math.abs(value).toString().replace(/[^0-9]/g, '');
  return parseInt(str[0]);
}

function calculateChiSquare(observed, expected, total) {
  let chiSquare = 0;
  
  for (let i = 0; i < observed.length; i++) {
    const expectedCount = (expected[i] / 100) * total;
    if (expectedCount > 0) {
      chiSquare += Math.pow(observed[i] - expectedCount, 2) / expectedCount;
    }
  }
  
  return chiSquare;
}

function detectRoundNumberBias(values, fieldName) {
  const roundingPatterns = {
    tens: values.filter(v => v % 10 === 0 && v !== 0).length,
    hundreds: values.filter(v => v % 100 === 0 && v !== 0).length,
    thousands: values.filter(v => v % 1000 === 0 && v !== 0).length,
    halfDollars: values.filter(v => {
      const cents = Math.round((v % 1) * 100);
      return cents === 50;
    }).length,
    wholeDollars: values.filter(v => v % 1 === 0).length
  };

  const total = values.length;
  const expectedRates = {
    tens: 0.10,
    hundreds: 0.01,
    thousands: 0.001,
    halfDollars: 0.01,
    wholeDollars: fieldName.toLowerCase().includes('price') ? 0.10 : 0.05
  };

  const biases = [];
  
  Object.entries(roundingPatterns).forEach(([pattern, count]) => {
    const observedRate = count / total;
    const expectedRate = expectedRates[pattern];
    const ratio = observedRate / expectedRate;
    
    if (ratio > 3 && count > 10) {
      biases.push({
        pattern: pattern,
        count: count,
        observedRate: `${(observedRate * 100).toFixed(1)}%`,
        expectedRate: `${(expectedRate * 100).toFixed(1)}%`,
        excessRatio: ratio.toFixed(1)
      });
    }
  });

  if (biases.length > 0) {
    return {
      type: 'ROUND_NUMBER_BIAS',
      field: fieldName,
      totalValues: total,
      biases: biases,
      interpretation: 'Excessive round numbers detected',
      possibleCauses: [
        'Manual data entry or estimation',
        'Psychological pricing strategies',
        'System-imposed rounding',
        'Negotiated or adjusted values'
      ],
      examples: findRoundNumberExamples(values),
      recommendation: 'Review data collection process for artificial rounding'
    };
  }

  return null;
}

function findRoundNumberExamples(values) {
  const examples = {
    hundreds: values.filter(v => v % 100 === 0 && v !== 0).slice(0, 5),
    thousands: values.filter(v => v % 1000 === 0 && v !== 0).slice(0, 5)
  };
  
  return examples;
}

function detectStatisticalAnomalies(values, fieldName) {
  const anomalies = [];
  
  const zScoreAnomalies = detectZScoreAnomalies(values, fieldName);
  if (zScoreAnomalies) {
    anomalies.push(zScoreAnomalies);
  }

  const clusteringAnomalies = detectValueClustering(values, fieldName);
  if (clusteringAnomalies) {
    anomalies.push(clusteringAnomalies);
  }

  const gapAnomalies = detectValueGaps(values, fieldName);
  if (gapAnomalies) {
    anomalies.push(gapAnomalies);
  }

  return anomalies;
}

function detectZScoreAnomalies(values, fieldName) {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);

  const anomalies = values.map((value, index) => ({
    value: value,
    zScore: Math.abs((value - mean) / stdDev),
    index: index
  })).filter(item => item.zScore > 4);

  if (anomalies.length > 0) {
    return {
      type: 'EXTREME_OUTLIERS',
      field: fieldName,
      count: anomalies.length,
      threshold: '4 standard deviations',
      examples: anomalies.slice(0, 5).map(a => ({
        value: a.value,
        zScore: a.zScore.toFixed(2),
        deviation: `${((a.value - mean) / mean * 100).toFixed(1)}% from mean`
      })),
      statistics: {
        mean: mean.toFixed(2),
        stdDev: stdDev.toFixed(2),
        minAnomaly: Math.min(...anomalies.map(a => a.value)),
        maxAnomaly: Math.max(...anomalies.map(a => a.value))
      },
      interpretation: 'Extreme values detected that may indicate errors or special cases'
    };
  }

  return null;
}

function detectValueClustering(values, fieldName) {
  const sortedValues = [...values].sort((a, b) => a - b);
  const clusters = [];
  let currentCluster = [sortedValues[0]];
  
  const threshold = (sortedValues[sortedValues.length - 1] - sortedValues[0]) * 0.01;

  for (let i = 1; i < sortedValues.length; i++) {
    if (sortedValues[i] - sortedValues[i - 1] <= threshold) {
      currentCluster.push(sortedValues[i]);
    } else {
      if (currentCluster.length > values.length * 0.1) {
        clusters.push({
          size: currentCluster.length,
          range: {
            min: currentCluster[0],
            max: currentCluster[currentCluster.length - 1]
          },
          percentage: (currentCluster.length / values.length * 100).toFixed(1)
        });
      }
      currentCluster = [sortedValues[i]];
    }
  }

  if (currentCluster.length > values.length * 0.1) {
    clusters.push({
      size: currentCluster.length,
      range: {
        min: currentCluster[0],
        max: currentCluster[currentCluster.length - 1]
      },
      percentage: (currentCluster.length / values.length * 100).toFixed(1)
    });
  }

  if (clusters.length > 0 && clusters.some(c => parseFloat(c.percentage) > 30)) {
    return {
      type: 'VALUE_CLUSTERING',
      field: fieldName,
      clusters: clusters.filter(c => parseFloat(c.percentage) > 10),
      interpretation: 'Values are heavily clustered in specific ranges',
      possibleCauses: [
        'Pricing tiers or bands',
        'System constraints',
        'Categorical data encoded as numeric',
        'Limited input options'
      ]
    };
  }

  return null;
}

function detectValueGaps(values, fieldName) {
  const sortedValues = [...new Set(values)].sort((a, b) => a - b);
  const gaps = [];
  
  for (let i = 1; i < sortedValues.length; i++) {
    const gap = sortedValues[i] - sortedValues[i - 1];
    const avgGap = (sortedValues[sortedValues.length - 1] - sortedValues[0]) / sortedValues.length;
    
    if (gap > avgGap * 10) {
      gaps.push({
        from: sortedValues[i - 1],
        to: sortedValues[i],
        size: gap,
        ratio: (gap / avgGap).toFixed(1)
      });
    }
  }

  if (gaps.length > 0) {
    return {
      type: 'VALUE_GAPS',
      field: fieldName,
      gaps: gaps.slice(0, 5),
      interpretation: 'Significant gaps in value distribution',
      possibleCauses: [
        'Missing data ranges',
        'Business rule constraints',
        'Data collection limitations',
        'Filtered or excluded values'
      ]
    };
  }

  return null;
}

function detectTimeSeriesAnomalies(values, fieldName, allData, colIndex) {
  const anomalies = [];
  const dateValues = values
    .map((v, i) => ({ date: parseDate(v), index: i, original: v }))
    .filter(item => item.date !== null)
    .sort((a, b) => a.date - b.date);

  if (dateValues.length < 10) return anomalies;

  const intervals = [];
  for (let i = 1; i < dateValues.length; i++) {
    intervals.push(dateValues[i].date - dateValues[i - 1].date);
  }

  const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  const largeGaps = intervals
    .map((interval, i) => ({ interval, index: i }))
    .filter(item => item.interval > avgInterval * 10);

  if (largeGaps.length > 0) {
    anomalies.push({
      type: 'TEMPORAL_GAPS',
      field: fieldName,
      gaps: largeGaps.slice(0, 5).map(gap => ({
        from: dateValues[gap.index].original,
        to: dateValues[gap.index + 1].original,
        days: Math.floor(gap.interval / (1000 * 60 * 60 * 24)),
        averageDays: Math.floor(avgInterval / (1000 * 60 * 60 * 24))
      })),
      interpretation: 'Unusual gaps in temporal data',
      possibleCauses: [
        'System downtime or maintenance',
        'Seasonal patterns',
        'Data collection issues',
        'Business closure periods'
      ]
    });
  }

  const velocityAnomaly = detectVelocityAnomalies(dateValues, fieldName);
  if (velocityAnomaly) {
    anomalies.push(velocityAnomaly);
  }

  return anomalies;
}

function detectVelocityAnomalies(dateValues, fieldName) {
  const hourlyBuckets = {};
  const dailyBuckets = {};
  
  dateValues.forEach(item => {
    const hourKey = `${item.date.toISOString().split('T')[0]}-${item.date.getHours()}`;
    const dayKey = item.date.toISOString().split('T')[0];
    
    hourlyBuckets[hourKey] = (hourlyBuckets[hourKey] || 0) + 1;
    dailyBuckets[dayKey] = (dailyBuckets[dayKey] || 0) + 1;
  });

  const hourlyValues = Object.values(hourlyBuckets);
  const dailyValues = Object.values(dailyBuckets);
  
  if (hourlyValues.length > 24) {
    const hourlyMean = hourlyValues.reduce((a, b) => a + b, 0) / hourlyValues.length;
    const hourlyStdDev = Math.sqrt(
      hourlyValues.reduce((sum, val) => sum + Math.pow(val - hourlyMean, 2), 0) / hourlyValues.length
    );
    
    const spikes = Object.entries(hourlyBuckets)
      .filter(([_, count]) => count > hourlyMean + 3 * hourlyStdDev)
      .sort((a, b) => b[1] - a[1]);
    
    if (spikes.length > 0) {
      return {
        type: 'VELOCITY_SPIKES',
        field: fieldName,
        spikes: spikes.slice(0, 5).map(([time, count]) => ({
          time: time,
          count: count,
          deviation: `${((count - hourlyMean) / hourlyStdDev).toFixed(1)} std devs`
        })),
        average: hourlyMean.toFixed(1),
        interpretation: 'Unusual spikes in data creation velocity',
        possibleCauses: [
          'Batch processing or imports',
          'System testing or load testing',
          'Bot activity or automated processes',
          'Data migration events'
        ]
      };
    }
  }
  
  return null;
}

function detectFraudPatterns(data, headers, columnTypes) {
  const patterns = [];
  
  const duplicateTimestamps = detectDuplicateTimestamps(data, headers);
  if (duplicateTimestamps) {
    patterns.push(duplicateTimestamps);
  }

  const suspiciousSequences = detectSuspiciousSequences(data, headers, columnTypes);
  patterns.push(...suspiciousSequences);

  const velocityPatterns = detectAbnormalVelocity(data, headers);
  if (velocityPatterns) {
    patterns.push(velocityPatterns);
  }

  return patterns;
}

function detectDuplicateTimestamps(data, headers) {
  const timestampColumns = headers
    .map((h, i) => ({ header: h, index: i }))
    .filter(col => col.header.toLowerCase().includes('timestamp') || 
                   col.header.toLowerCase().includes('created_at') ||
                   col.header.toLowerCase().includes('datetime'));

  if (timestampColumns.length === 0) return null;

  const duplicates = [];
  
  timestampColumns.forEach(tsCol => {
    const timestampCounts = {};
    
    data.forEach((row, index) => {
      const timestamp = row[tsCol.index];
      if (timestamp) {
        if (!timestampCounts[timestamp]) {
          timestampCounts[timestamp] = [];
        }
        timestampCounts[timestamp].push(index);
      }
    });

    const duplicateGroups = Object.entries(timestampCounts)
      .filter(([_, indices]) => indices.length > 1)
      .sort((a, b) => b[1].length - a[1].length);

    if (duplicateGroups.length > 0) {
      duplicates.push({
        field: tsCol.header,
        groups: duplicateGroups.slice(0, 5).map(([timestamp, indices]) => ({
          timestamp: timestamp,
          count: indices.length,
          rows: indices.slice(0, 10).map(i => i + 1)
        }))
      });
    }
  });

  if (duplicates.length > 0) {
    return {
      type: 'DUPLICATE_TIMESTAMPS',
      duplicates: duplicates,
      interpretation: 'Multiple records with identical timestamps',
      possibleCauses: [
        'Batch processing without proper timestamps',
        'System clock issues',
        'Data import problems',
        'Potential fraud or manipulation'
      ],
      recommendation: 'Investigate records with duplicate timestamps for validity'
    };
  }

  return null;
}

function detectSuspiciousSequences(data, headers, columnTypes) {
  const patterns = [];
  
  headers.forEach((header, colIndex) => {
    if (columnTypes[header] !== 'numeric') return;
    
    const values = data
      .map((row, i) => ({ value: parseFloat(row[colIndex]), index: i }))
      .filter(item => !isNaN(item.value));
    
    for (let i = 0; i < values.length - 4; i++) {
      const sequence = values.slice(i, i + 5).map(item => item.value);
      
      if (isArithmeticSequence(sequence) || isGeometricSequence(sequence)) {
        patterns.push({
          type: 'SUSPICIOUS_SEQUENCE',
          field: header,
          startRow: values[i].index + 1,
          sequence: sequence,
          pattern: isArithmeticSequence(sequence) ? 'Arithmetic' : 'Geometric',
          interpretation: 'Artificial sequential pattern detected'
        });
      }
    }
  });

  return patterns.slice(0, 5);
}

function isArithmeticSequence(values) {
  if (values.length < 3) return false;
  const diff = values[1] - values[0];
  
  for (let i = 2; i < values.length; i++) {
    if (Math.abs((values[i] - values[i - 1]) - diff) > 0.01) {
      return false;
    }
  }
  
  return Math.abs(diff) > 0;
}

function isGeometricSequence(values) {
  if (values.length < 3 || values.some(v => v === 0)) return false;
  const ratio = values[1] / values[0];
  
  for (let i = 2; i < values.length; i++) {
    if (Math.abs((values[i] / values[i - 1]) - ratio) > 0.01) {
      return false;
    }
  }
  
  return Math.abs(ratio - 1) > 0.01;
}

function detectAbnormalVelocity(data, headers) {
  const userColumns = headers
    .map((h, i) => ({ header: h, index: i }))
    .filter(col => col.header.toLowerCase().includes('user') || 
                   col.header.toLowerCase().includes('customer') ||
                   col.header.toLowerCase().includes('account'));

  const dateColumns = headers
    .map((h, i) => ({ header: h, index: i }))
    .filter(col => col.header.toLowerCase().includes('date') || 
                   col.header.toLowerCase().includes('time'));

  if (userColumns.length === 0 || dateColumns.length === 0) return null;

  const userActivity = {};
  
  data.forEach(row => {
    const userId = row[userColumns[0].index];
    const date = parseDate(row[dateColumns[0].index]);
    
    if (userId && date) {
      if (!userActivity[userId]) {
        userActivity[userId] = [];
      }
      userActivity[userId].push(date);
    }
  });

  const suspiciousUsers = [];
  
  Object.entries(userActivity).forEach(([userId, dates]) => {
    if (dates.length < 5) return;
    
    dates.sort((a, b) => a - b);
    const intervals = [];
    
    for (let i = 1; i < dates.length; i++) {
      intervals.push(dates[i] - dates[i - 1]);
    }
    
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const minInterval = Math.min(...intervals);
    
    if (minInterval < 1000 || avgInterval < 60000) {
      suspiciousUsers.push({
        userId: userId,
        activityCount: dates.length,
        minIntervalSeconds: minInterval / 1000,
        avgIntervalSeconds: avgInterval / 1000
      });
    }
  });

  if (suspiciousUsers.length > 0) {
    return {
      type: 'ABNORMAL_USER_VELOCITY',
      users: suspiciousUsers.slice(0, 10),
      interpretation: 'Users with impossibly fast activity patterns',
      possibleCauses: [
        'Bot or automated activity',
        'System testing accounts',
        'Data import with incorrect timestamps',
        'Potential fraud or abuse'
      ],
      recommendation: 'Review accounts with superhuman activity speeds'
    };
  }

  return null;
}

function parseDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date;
}