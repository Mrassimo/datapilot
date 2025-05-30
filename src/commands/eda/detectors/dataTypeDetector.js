export function detectAnalysisNeeds(records, columnTypes) {
  
  const analyses = {
    regression: false,
    timeSeries: false,
    cart: false,
    australianData: false,
    mlReadiness: false,
    advancedStats: true, // Always run advanced stats
    distributionTesting: true,
    outlierAnalysis: true,
    correlationAnalysis: false,
    patternDetection: true
  };

  const columns = Object.keys(columnTypes);
  
  // Sample records for analysis detection on large datasets
  
  const sampleSize = Math.min(1000, records.length);
  const sampledRecords = records.length > 1000 ? records.slice(0, sampleSize) : records;
  
  
  // Check for regression analysis (continuous variable with high uniqueness)
  const numericColumns = columns.filter(col => 
    ['integer', 'float'].includes(columnTypes[col].type)
  );
  
  numericColumns.forEach(col => {
    
    try {
      const values = sampledRecords.map(r => r[col]).filter(v => v !== null && v !== undefined);
      
      const uniqueRatio = new Set(values).size / values.length;
      if (uniqueRatio > 0.7 && values.length > 30) {
        analyses.regression = true;
      }
    } catch (error) {
    }
  });

  // Check for time series analysis
  const dateColumns = columns.filter(col => columnTypes[col].type === 'date');
  if (dateColumns.length > 0 && sampledRecords.length > 30) {
    // Check for regular intervals
    const dateCol = dateColumns[0];
    const dates = sampledRecords
      .map(r => r[dateCol])
      .filter(d => d instanceof Date)
      .sort((a, b) => a - b);
    
    if (dates.length > 20) {
      const intervals = [];
      for (let i = 1; i < Math.min(dates.length, 10); i++) {
        intervals.push(dates[i] - dates[i-1]);
      }
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const intervalVariance = intervals.reduce((sum, int) => sum + Math.pow(int - avgInterval, 2), 0) / intervals.length;
      const cv = Math.sqrt(intervalVariance) / avgInterval;
      
      if (cv < 0.3) {
        analyses.timeSeries = true;
      }
    }
  }

  // Check for CART analysis (mixed data types)
  const categoricalColumns = columns.filter(col => 
    columnTypes[col].type === 'categorical'
  );
  
  if (numericColumns.length > 0 && categoricalColumns.length > 0 && records.length > 100) {
    analyses.cart = true;
  }

  // Check for Australian data patterns
  const australianPatterns = [
    /^(0[2-478]\d{8}|04\d{8})$/, // Australian phone
    /^[0-9]{4}$/, // Australian postcode
    /\b(NSW|VIC|QLD|WA|SA|TAS|ACT|NT)\b/i, // State codes
    /\$[\d,]+\.?\d*/, // Currency
    /\b\d{2} \d{3} \d{3} \d{3}\b/, // ABN format
  ];

  for (const col of columns) {
    const sampleValues = records
      .slice(0, 100)
      .map(r => String(r[col] || ''))
      .filter(v => v);
    
    for (const pattern of australianPatterns) {
      const matches = sampleValues.filter(v => pattern.test(v)).length;
      if (matches > sampleValues.length * 0.1) {
        analyses.australianData = true;
        break;
      }
    }
    if (analyses.australianData) break;
  }

  // Check ML readiness
  if (columns.length > 5 && records.length > 1000) {
    analyses.mlReadiness = true;
  }

  // Enable correlation analysis if multiple numeric columns
  if (numericColumns.length >= 2) {
    analyses.correlationAnalysis = true;
  }

  return analyses;
}

export function findPotentialTargets(records, columnTypes) {
  const columns = Object.keys(columnTypes);
  const targets = [];
  
  // Sample for large datasets
  const sampleSize = Math.min(1000, records.length);
  const sampledRecords = records.length > 1000 ? records.slice(0, sampleSize) : records;

  columns.forEach(col => {
    const type = columnTypes[col];
    const values = sampledRecords.map(r => r[col]).filter(v => v !== null && v !== undefined);
    const uniqueRatio = new Set(values).size / values.length;

    // Good regression target: continuous with high variance
    if (['integer', 'float'].includes(type.type) && uniqueRatio > 0.5) {
      targets.push({
        column: col,
        type: 'regression',
        score: uniqueRatio,
        reason: 'Continuous variable with high variance'
      });
    }

    // Good classification target: categorical with 2-10 classes
    if (type.type === 'categorical') {
      const uniqueCount = type.categories.length;
      if (uniqueCount >= 2 && uniqueCount <= 10) {
        targets.push({
          column: col,
          type: 'classification',
          score: 1 - Math.abs(5 - uniqueCount) / 5,
          reason: `Categorical with ${uniqueCount} classes`
        });
      }
    }
  });

  return targets.sort((a, b) => b.score - a.score);
}