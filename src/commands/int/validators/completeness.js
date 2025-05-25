export function analyseCompleteness(data, headers) {
  const results = {
    dimension: 'Completeness',
    weight: 0.20,
    issues: [],
    metrics: {},
    score: 100
  };

  const totalRows = data.length;
  const columnStats = {};

  headers.forEach(header => {
    columnStats[header] = {
      nullCount: 0,
      emptyCount: 0,
      totalMissing: 0,
      missingPattern: [],
      requiredField: false,
      completenessRate: 100
    };
  });

  data.forEach((row, rowIndex) => {
    headers.forEach((header, colIndex) => {
      const value = row[colIndex];
      const stats = columnStats[header];

      if (value === null || value === undefined || value === '') {
        stats.nullCount++;
        stats.totalMissing++;
        stats.missingPattern.push(rowIndex);
      } else if (typeof value === 'string' && value.trim() === '') {
        stats.emptyCount++;
        stats.totalMissing++;
        stats.missingPattern.push(rowIndex);
      }
    });
  });

  headers.forEach(header => {
    const stats = columnStats[header];
    stats.completenessRate = totalRows > 0 
      ? ((totalRows - stats.totalMissing) / totalRows * 100).toFixed(2)
      : 100;

    const missingRate = 100 - stats.completenessRate;
    if (missingRate > 0) {
      const pattern = analyseMissingPattern(stats.missingPattern, totalRows);
      
      if (missingRate > 20) {
        results.issues.push({
          type: 'critical',
          field: header,
          message: `${missingRate.toFixed(1)}% missing values (${stats.totalMissing}/${totalRows} records)`,
          pattern: pattern,
          impact: missingRate > 50 ? 'Field may be unusable' : 'Significant data loss'
        });
        results.score -= 15;
      } else if (missingRate > 5) {
        results.issues.push({
          type: 'warning',
          field: header,
          message: `${missingRate.toFixed(1)}% missing values (${stats.totalMissing}/${totalRows} records)`,
          pattern: pattern,
          impact: 'May affect analysis accuracy'
        });
        results.score -= 5;
      } else if (missingRate > 0) {
        results.issues.push({
          type: 'observation',
          field: header,
          message: `${missingRate.toFixed(1)}% missing values (${stats.totalMissing}/${totalRows} records)`,
          pattern: pattern
        });
        results.score -= 1;
      }
    }

    if (stats.completenessRate === 100 && header.toLowerCase().includes('id')) {
      stats.requiredField = true;
    }
  });

  const overallCompleteness = headers.reduce((sum, header) => 
    sum + parseFloat(columnStats[header].completenessRate), 0) / headers.length;

  results.metrics = {
    overallCompleteness: overallCompleteness.toFixed(2),
    columnsWithMissing: Object.values(columnStats).filter(s => s.totalMissing > 0).length,
    totalMissingCells: Object.values(columnStats).reduce((sum, s) => sum + s.totalMissing, 0),
    columnStats: columnStats
  };

  results.score = Math.max(0, results.score);
  return results;
}

function analyseMissingPattern(missingIndices, totalRows) {
  if (missingIndices.length === 0) return 'None';
  
  const consecutiveRuns = [];
  let currentRun = [missingIndices[0]];
  
  for (let i = 1; i < missingIndices.length; i++) {
    if (missingIndices[i] === missingIndices[i-1] + 1) {
      currentRun.push(missingIndices[i]);
    } else {
      if (currentRun.length > 1) {
        consecutiveRuns.push(currentRun);
      }
      currentRun = [missingIndices[i]];
    }
  }
  if (currentRun.length > 1) {
    consecutiveRuns.push(currentRun);
  }

  if (consecutiveRuns.length > 0) {
    const longestRun = consecutiveRuns.reduce((max, run) => 
      run.length > max.length ? run : max, []);
    if (longestRun.length > totalRows * 0.1) {
      return `Systematic gaps (rows ${longestRun[0]}-${longestRun[longestRun.length-1]})`;
    }
  }

  const lastQuarter = Math.floor(totalRows * 0.75);
  const lastQuarterMissing = missingIndices.filter(i => i >= lastQuarter).length;
  if (lastQuarterMissing > missingIndices.length * 0.5) {
    return 'Missing at Random (MAR) - concentrated in recent records';
  }

  const everyNth = detectEveryNthPattern(missingIndices);
  if (everyNth) {
    return `Periodic pattern (every ${everyNth} records)`;
  }

  return 'Missing Completely at Random (MCAR)';
}

function detectEveryNthPattern(indices) {
  if (indices.length < 3) return null;
  
  const differences = [];
  for (let i = 1; i < indices.length; i++) {
    differences.push(indices[i] - indices[i-1]);
  }
  
  const mode = differences.reduce((acc, diff) => {
    acc[diff] = (acc[diff] || 0) + 1;
    return acc;
  }, {});
  
  const mostCommon = Object.entries(mode).sort((a, b) => b[1] - a[1])[0];
  if (mostCommon && mostCommon[1] > differences.length * 0.8) {
    return mostCommon[0];
  }
  
  return null;
}