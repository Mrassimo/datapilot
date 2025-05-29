export function analyseTimeliness(data, headers) {
  const results = {
    dimension: 'Timeliness',
    weight: 0.15,
    issues: [],
    metrics: {},
    score: 100
  };

  const dateColumns = identifyDateColumns(data, headers);
  const timelinessAnalysis = {};
  
  if (dateColumns.length === 0) {
    results.metrics = {
      message: 'No date columns detected for timeliness analysis',
      recommendation: 'Add timestamp columns to track data freshness'
    };
    return results;
  }

  dateColumns.forEach(dateCol => {
    const analysis = analyseDateColumn(data, dateCol);
    timelinessAnalysis[dateCol.header] = analysis;

    // Check if this looks like cohort/test data (all dates within a short period)
    const isCohortPattern = analysis.range && analysis.range.span <= 90 && 
                           analysis.validDates.length > 5 &&
                           analysis.patterns.yearlyTrend && 
                           Object.keys(analysis.patterns.yearlyTrend).length === 1;

    if (isCohortPattern) {
      results.issues.push({
        type: 'observation',
        field: dateCol.header,
        message: `Cohort pattern detected - all dates within ${analysis.range.span} days`,
        details: `Date range: ${analysis.range.oldest} to ${analysis.range.newest}`,
        interpretation: 'Appears to be test data or study cohort'
      });
      // Don't penalize cohort data for "staleness"
    } else if (analysis.staleness.percentage > 30) {
      results.issues.push({
        type: 'critical',
        field: dateCol.header,
        message: `${analysis.staleness.percentage.toFixed(1)}% of records are stale (>${analysis.staleness.threshold} days old)`,
        details: `${analysis.staleness.count}/${analysis.validDates.length} records`,
        oldestRecord: analysis.range.oldest,
        impact: 'Data may not reflect current state'
      });
      results.score -= 15;
    } else if (analysis.staleness.percentage > 15) {
      results.issues.push({
        type: 'warning',
        field: dateCol.header,
        message: `${analysis.staleness.percentage.toFixed(1)}% of records are becoming stale`,
        details: `${analysis.staleness.count} records older than ${analysis.staleness.threshold} days`,
        recommendation: 'Consider updating or archiving old records'
      });
      results.score -= 7;
    }

    if (analysis.future.count > 0) {
      results.issues.push({
        type: 'critical',
        field: dateCol.header,
        message: `${analysis.future.count} records have future dates`,
        examples: analysis.future.examples.slice(0, 3),
        impact: 'Data integrity issue - impossible timestamps'
      });
      results.score -= 10;
    }

    if (analysis.suspicious && analysis.suspicious.beforeBusinessStart > 0) {
      results.issues.push({
        type: 'warning',
        field: dateCol.header,
        message: `${analysis.suspicious.beforeBusinessStart} records predate reasonable business start`,
        earliestDate: analysis.suspicious.earliestDate,
        recommendation: 'Verify or correct historical data'
      });
      results.score -= 5;
    }

    if (analysis.updateFrequency) {
      if (analysis.updateFrequency.daysWithoutUpdate > 30) {
        results.issues.push({
          type: 'observation',
          field: dateCol.header,
          message: `No updates in the last ${analysis.updateFrequency.daysWithoutUpdate} days`,
          lastUpdate: analysis.updateFrequency.lastUpdate,
          averageUpdateInterval: `${analysis.updateFrequency.averageInterval.toFixed(1)} days`,
          impact: 'May indicate process issues or abandonment'
        });
        results.score -= 3;
      }
    }

    if (analysis.patterns.weekend > 20 && analysis.patterns.weekend < 80) {
      results.issues.push({
        type: 'observation',
        field: dateCol.header,
        message: `Unusual weekend activity pattern (${analysis.patterns.weekend.toFixed(1)}% on weekends)`,
        interpretation: 'May indicate automated processes or data quality issues'
      });
    }
  });

  const modificationColumns = findModificationColumns(headers, dateColumns);
  if (modificationColumns.created && modificationColumns.modified) {
    const updateAnalysis = analyseUpdatePatterns(
      data, 
      modificationColumns.created, 
      modificationColumns.modified
    );
    
    if (updateAnalysis.neverModified > 50) {
      results.issues.push({
        type: 'observation',
        category: 'Update Patterns',
        message: `${updateAnalysis.neverModified.toFixed(1)}% of records never modified since creation`,
        count: updateAnalysis.neverModifiedCount,
        interpretation: 'May indicate abandoned records or lack of maintenance'
      });
      results.score -= 5;
    }

    if (updateAnalysis.frequentlyModified.length > 0) {
      results.issues.push({
        type: 'observation',
        category: 'Update Patterns',
        message: `${updateAnalysis.frequentlyModified.length} records modified unusually often`,
        topRecords: updateAnalysis.frequentlyModified.slice(0, 3),
        interpretation: 'May indicate data quality issues or system problems'
      });
    }
  }

  const freshnessScore = calculateOverallFreshness(timelinessAnalysis);
  
  results.metrics = {
    dateColumnsAnalysed: dateColumns.length,
    overallFreshness: `${freshnessScore.toFixed(1)}%`,
    stalestColumn: getStalestColumn(timelinessAnalysis),
    updatePatterns: modificationColumns.created && modificationColumns.modified ? {
      neverModified: `${updateAnalysis?.neverModified?.toFixed(1)}%`,
      averageUpdateAge: updateAnalysis?.averageAge ? `${updateAnalysis.averageAge.toFixed(1)} days` : 'N/A'
    } : null,
    timelinessAnalysis: timelinessAnalysis
  };

  results.score = Math.max(0, results.score);
  return results;
}

function identifyDateColumns(data, headers) {
  const dateColumns = [];
  
  headers.forEach((header) => {
    const headerLower = header.toLowerCase();
    const isLikelyDate = headerLower.includes('date') || 
                        headerLower.includes('time') ||
                        headerLower.includes('created') ||
                        headerLower.includes('modified') ||
                        headerLower.includes('updated') ||
                        headerLower.includes('_at') ||
                        headerLower.includes('_on');

    if (isLikelyDate || isDateColumn(data, header)) {
      dateColumns.push({ header });
    }
  });

  return dateColumns;
}

function isDateColumn(data, header) {
  const sample = data.slice(0, Math.min(100, data.length))
    .map(row => row[header])
    .filter(val => val !== null && val !== '');

  if (sample.length === 0) return false;

  let validDates = 0;
  sample.forEach(value => {
    const date = parseDate(value);
    if (date && !isNaN(date.getTime())) {
      validDates++;
    }
  });

  return validDates > sample.length * 0.8;
}

function analyseDateColumn(data, dateCol) {
  const now = new Date();
  const validDates = [];
  const invalidDates = [];
  const futureDates = [];
  
  data.forEach((row, index) => {
    const value = row[dateCol.header];
    if (value === null || value === '') return;

    const date = parseDate(value);
    if (date && !isNaN(date.getTime())) {
      validDates.push({ date, value, rowIndex: index });
      if (date > now) {
        futureDates.push({ date, value, rowIndex: index });
      }
    } else {
      invalidDates.push({ value, rowIndex: index });
    }
  });

  if (validDates.length === 0) {
    return {
      validDates: [],
      invalidDates: invalidDates,
      staleness: { percentage: 0, count: 0 },
      future: { count: 0, examples: [] },
      patterns: {}
    };
  }

  validDates.sort((a, b) => a.date - b.date);
  
  const oldestDate = validDates[0].date;
  const newestDate = validDates[validDates.length - 1].date;
  
  const stalenessThreshold = determineStalenessThreshold(dateCol.header);
  const staleDate = new Date(now.getTime() - stalenessThreshold * 24 * 60 * 60 * 1000);
  const staleRecords = validDates.filter(d => d.date < staleDate);

  const businessStartDate = new Date('1990-01-01');
  const suspiciousOld = validDates.filter(d => d.date < businessStartDate);

  const patterns = analyseTemporalPatterns(validDates);
  const updateFrequency = analyseUpdateFrequency(validDates);

  return {
    validDates: validDates,
    invalidDates: invalidDates,
    range: {
      oldest: oldestDate.toISOString().split('T')[0],
      newest: newestDate.toISOString().split('T')[0],
      span: Math.floor((newestDate - oldestDate) / (1000 * 60 * 60 * 24))
    },
    staleness: {
      threshold: stalenessThreshold,
      count: staleRecords.length,
      percentage: (staleRecords.length / validDates.length) * 100,
      examples: staleRecords.slice(-3).map(r => ({
        value: r.value,
        age: Math.floor((now - r.date) / (1000 * 60 * 60 * 24))
      }))
    },
    future: {
      count: futureDates.length,
      examples: futureDates.map(f => ({
        value: f.value,
        daysInFuture: Math.ceil((f.date - now) / (1000 * 60 * 60 * 24))
      }))
    },
    suspicious: {
      beforeBusinessStart: suspiciousOld.length,
      earliestDate: suspiciousOld.length > 0 ? suspiciousOld[0].date.toISOString().split('T')[0] : null
    },
    patterns: patterns,
    updateFrequency: updateFrequency
  };
}

function determineStalenessThreshold(columnName) {
  const columnLower = columnName.toLowerCase();
  
  // Medical/clinical data has different staleness thresholds
  if (columnLower.includes('visit') || columnLower.includes('appointment') || columnLower.includes('encounter')) {
    return 730; // 2 years for medical visits
  } else if (columnLower.includes('enrollment') || columnLower.includes('study')) {
    return 1825; // 5 years for study enrollment
  } else if (columnLower.includes('test_date') || columnLower.includes('lab_date')) {
    return 365; // 1 year for lab tests
  } else if (columnLower.includes('last_login') || columnLower.includes('last_active')) {
    return 90;
  } else if (columnLower.includes('modified') || columnLower.includes('updated')) {
    return 180;
  } else if (columnLower.includes('created') || columnLower.includes('registration')) {
    return 365;
  } else if (columnLower.includes('birth') || columnLower.includes('dob')) {
    return 36500;
  } else if (columnLower.includes('order') || columnLower.includes('transaction')) {
    return 90;
  } else if (columnLower.includes('email') || columnLower.includes('contact')) {
    return 365;
  }
  
  return 365;
}

function analyseTemporalPatterns(validDates) {
  const patterns = {
    weekend: 0,
    weekday: 0,
    morning: 0,
    afternoon: 0,
    evening: 0,
    night: 0,
    monthlyDistribution: Array(12).fill(0),
    yearlyTrend: {}
  };

  validDates.forEach(({ date }) => {
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      patterns.weekend++;
    } else {
      patterns.weekday++;
    }

    const hour = date.getHours();
    if (hour >= 6 && hour < 12) patterns.morning++;
    else if (hour >= 12 && hour < 17) patterns.afternoon++;
    else if (hour >= 17 && hour < 22) patterns.evening++;
    else patterns.night++;

    patterns.monthlyDistribution[date.getMonth()]++;
    
    const year = date.getFullYear();
    patterns.yearlyTrend[year] = (patterns.yearlyTrend[year] || 0) + 1;
  });

  const total = validDates.length;
  patterns.weekend = (patterns.weekend / total) * 100;
  patterns.weekday = (patterns.weekday / total) * 100;

  return patterns;
}

function analyseUpdateFrequency(validDates) {
  if (validDates.length < 2) return null;

  const now = new Date();
  const mostRecent = validDates[validDates.length - 1].date;
  const daysWithoutUpdate = Math.floor((now - mostRecent) / (1000 * 60 * 60 * 24));

  const intervals = [];
  for (let i = 1; i < validDates.length; i++) {
    const interval = validDates[i].date - validDates[i-1].date;
    intervals.push(interval / (1000 * 60 * 60 * 24));
  }

  const averageInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;

  return {
    lastUpdate: mostRecent.toISOString().split('T')[0],
    daysWithoutUpdate: daysWithoutUpdate,
    averageInterval: averageInterval,
    updateCount: validDates.length
  };
}

function findModificationColumns(headers, dateColumns) {
  const result = {};
  
  dateColumns.forEach(col => {
    const headerLower = col.header.toLowerCase();
    if (headerLower.includes('created') || headerLower.includes('create')) {
      result.created = col;
    } else if (headerLower.includes('modified') || headerLower.includes('updated')) {
      result.modified = col;
    }
  });

  return result;
}

function analyseUpdatePatterns(data, createdCol, modifiedCol) {
  let neverModified = 0;
  const modificationCounts = {};
  const modificationAges = [];

  data.forEach((row, index) => {
    const created = parseDate(row[createdCol.header]);
    const modified = parseDate(row[modifiedCol.header]);

    if (created && modified) {
      if (created.getTime() === modified.getTime()) {
        neverModified++;
      } else {
        const daysSinceModified = Math.floor((new Date() - modified) / (1000 * 60 * 60 * 24));
        modificationAges.push(daysSinceModified);
        
        const key = `row_${index}`;
        if (!modificationCounts[key]) {
          modificationCounts[key] = {
            count: 0,
            created: created,
            lastModified: modified
          };
        }
        modificationCounts[key].count++;
      }
    }
  });

  const totalRecords = data.length;
  const neverModifiedPercentage = (neverModified / totalRecords) * 100;

  const frequentlyModified = Object.entries(modificationCounts)
    .filter(([_, info]) => {
      const daysSinceCreated = (info.lastModified - info.created) / (1000 * 60 * 60 * 24);
      const modificationsPerDay = info.count / daysSinceCreated;
      return modificationsPerDay > 0.1;
    })
    .map(([key, info]) => ({
      row: parseInt(key.split('_')[1]) + 1,
      modifications: info.count,
      daysSinceCreated: Math.floor((info.lastModified - info.created) / (1000 * 60 * 60 * 24))
    }))
    .sort((a, b) => b.modifications - a.modifications);

  const averageAge = modificationAges.length > 0 
    ? modificationAges.reduce((a, b) => a + b, 0) / modificationAges.length 
    : null;

  return {
    neverModified: neverModifiedPercentage,
    neverModifiedCount: neverModified,
    frequentlyModified: frequentlyModified,
    averageAge: averageAge
  };
}

function calculateOverallFreshness(timelinessAnalysis) {
  const scores = [];
  
  Object.values(timelinessAnalysis).forEach(analysis => {
    if (analysis.validDates && analysis.validDates.length > 0) {
      const freshnessScore = 100 - analysis.staleness.percentage;
      scores.push(freshnessScore);
    }
  });

  if (scores.length === 0) return 100;
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}

function getStalestColumn(timelinessAnalysis) {
  let stalest = null;
  let highestStaleness = 0;

  Object.entries(timelinessAnalysis).forEach(([column, analysis]) => {
    if (analysis.staleness && analysis.staleness.percentage > highestStaleness) {
      highestStaleness = analysis.staleness.percentage;
      stalest = {
        column: column,
        staleness: `${analysis.staleness.percentage.toFixed(1)}%`,
        threshold: `${analysis.staleness.threshold} days`
      };
    }
  });

  return stalest;
}

function parseDate(value) {
  if (!value) return null;
  
  const formats = [
    value => new Date(value),
    value => new Date(value.replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$2/$1/$3')),
    value => new Date(value.replace(/(\d{2})-(\d{2})-(\d{4})/, '$2/$1/$3')),
  ];

  for (const format of formats) {
    try {
      const date = format(value);
      if (!isNaN(date.getTime()) && date.getFullYear() > 1900 && date.getFullYear() < 2100) {
        return date;
      }
    } catch (e) {
      continue;
    }
  }

  return null;
}