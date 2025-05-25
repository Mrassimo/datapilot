import * as ss from 'simple-statistics';
import jstat from 'jstat';

export function performCorrelationAnalysis(records, columns, columnTypes) {
  const numericColumns = columns.filter(col => 
    ['integer', 'float'].includes(columnTypes[col].type)
  );
  
  if (numericColumns.length < 2) {
    return null;
  }
  
  const analysis = {
    pearson: [],
    spearman: [],
    distanceCorrelation: [],
    partialCorrelations: [],
    multicollinearity: []
  };
  
  // Calculate pairwise correlations
  for (let i = 0; i < numericColumns.length; i++) {
    for (let j = i + 1; j < numericColumns.length; j++) {
      const col1 = numericColumns[i];
      const col2 = numericColumns[j];
      
      const values1 = records.map(r => r[col1]).filter(v => v !== null && !isNaN(v));
      const values2 = records.map(r => r[col2]).filter(v => v !== null && !isNaN(v));
      
      // Get paired values
      const pairs = [];
      records.forEach(r => {
        const v1 = r[col1];
        const v2 = r[col2];
        if (v1 !== null && v2 !== null && !isNaN(v1) && !isNaN(v2)) {
          pairs.push([v1, v2]);
        }
      });
      
      if (pairs.length < 10) continue;
      
      // Pearson correlation
      const pearson = ss.sampleCorrelation(pairs.map(p => p[0]), pairs.map(p => p[1]));
      if (!isNaN(pearson) && Math.abs(pearson) > 0.1) {
        analysis.pearson.push({
          var1: col1,
          var2: col2,
          value: pearson,
          pValue: calculateCorrelationPValue(pearson, pairs.length),
          significant: Math.abs(pearson) > 0.3
        });
      }
      
      // Spearman correlation
      const spearman = calculateSpearmanCorrelation(pairs);
      if (!isNaN(spearman) && Math.abs(spearman) > 0.1) {
        analysis.spearman.push({
          var1: col1,
          var2: col2,
          value: spearman,
          interpretation: interpretCorrelation(spearman)
        });
      }
    }
  }
  
  // Sort by absolute value
  analysis.pearson.sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
  analysis.spearman.sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
  
  // Calculate VIF for multicollinearity
  if (numericColumns.length >= 3) {
    analysis.multicollinearity = calculateMulticollinearity(records, numericColumns);
  }
  
  return analysis;
}

function calculateSpearmanCorrelation(pairs) {
  // Rank the values
  const ranks1 = getRanks(pairs.map(p => p[0]));
  const ranks2 = getRanks(pairs.map(p => p[1]));
  
  // Calculate Pearson correlation on ranks
  return ss.sampleCorrelation(ranks1, ranks2);
}

function getRanks(values) {
  const sorted = values
    .map((v, i) => ({ value: v, index: i }))
    .sort((a, b) => a.value - b.value);
  
  const ranks = new Array(values.length);
  
  for (let i = 0; i < sorted.length; i++) {
    let j = i;
    while (j < sorted.length - 1 && sorted[j + 1].value === sorted[i].value) {
      j++;
    }
    
    const avgRank = (i + j + 2) / 2;
    for (let k = i; k <= j; k++) {
      ranks[sorted[k].index] = avgRank;
    }
    
    i = j;
  }
  
  return ranks;
}

function calculateCorrelationPValue(r, n) {
  if (n < 3) return 1;
  
  const t = r * Math.sqrt((n - 2) / (1 - r * r));
  const df = n - 2;
  
  return 2 * (1 - jstat.studentt.cdf(Math.abs(t), df));
}

function interpretCorrelation(r) {
  const absR = Math.abs(r);
  const direction = r > 0 ? 'positive' : 'negative';
  
  if (absR >= 0.9) return `Very strong ${direction}`;
  if (absR >= 0.7) return `Strong ${direction}`;
  if (absR >= 0.5) return `Moderate ${direction}`;
  if (absR >= 0.3) return `Weak ${direction}`;
  return 'Negligible';
}

function calculateMulticollinearity(records, columns) {
  const vifs = [];
  
  columns.forEach((targetCol, idx) => {
    const otherCols = columns.filter((_, i) => i !== idx);
    
    if (otherCols.length === 0) return;
    
    // Prepare data
    const y = records.map(r => r[targetCol]).filter(v => v !== null && !isNaN(v));
    const X = [];
    
    records.forEach(record => {
      const targetValue = record[targetCol];
      if (targetValue === null || isNaN(targetValue)) return;
      
      const row = otherCols.map(col => {
        const val = record[col];
        return val !== null && !isNaN(val) ? val : 0;
      });
      
      if (row.every(v => !isNaN(v))) {
        X.push(row);
      }
    });
    
    if (X.length < 10) return;
    
    // Simple R-squared approximation
    const r2 = calculateR2Approximation(X, y);
    const vif = 1 / (1 - r2);
    
    vifs.push({
      variable: targetCol,
      value: vif,
      interpretation: 
        vif > 10 ? 'Severe multicollinearity' :
        vif > 5 ? 'Moderate multicollinearity' :
        'No concern'
    });
  });
  
  return vifs.sort((a, b) => b.value - a.value);
}

function calculateR2Approximation(X, y) {
  // Very simple approximation using average correlation
  if (X.length === 0 || X[0].length === 0) return 0;
  
  let totalCorr = 0;
  let count = 0;
  
  for (let j = 0; j < X[0].length; j++) {
    const xCol = X.map(row => row[j]);
    const corr = ss.sampleCorrelation(xCol, y);
    
    if (!isNaN(corr)) {
      totalCorr += Math.abs(corr);
      count++;
    }
  }
  
  const avgCorr = count > 0 ? totalCorr / count : 0;
  return Math.min(0.99, avgCorr * avgCorr * 1.5); // Rough approximation
}