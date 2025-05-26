export class VisualTaskDetector {
  constructor() {
    this.tasks = {
      TREND_ANALYSIS: 'trend_analysis',
      PART_TO_WHOLE: 'part_to_whole',
      CORRELATION: 'correlation',
      DISTRIBUTION: 'distribution',
      COMPARISON: 'comparison',
      RANKING: 'ranking',
      DEVIATION: 'deviation',
      GEOSPATIAL: 'geospatial',
      COMPOSITION: 'composition',
      FLOW: 'flow',
      HIERARCHY: 'hierarchy',
      PATTERN: 'pattern'
    };
  }

  detectTasks(data, columnTypes) {
    const tasks = [];
    const columns = Object.keys(columnTypes);
    
    // Analyze column types
    const numericColumns = columns.filter(col => 
      ['integer', 'float'].includes(columnTypes[col].type)
    );
    const dateColumns = columns.filter(col => 
      columnTypes[col].type === 'date'
    );
    const categoricalColumns = columns.filter(col => 
      columnTypes[col].type === 'categorical'
    );
    const geographicColumns = this.findGeographicColumns(columns, columnTypes);
    
    // Detect temporal patterns
    if (dateColumns.length > 0) {
      const temporalStrength = this.calculateTemporalStrength(data, dateColumns[0]);
      if (temporalStrength > 0.7) {
        tasks.push({
          type: this.tasks.TREND_ANALYSIS,
          priority: 1,
          strength: temporalStrength,
          columns: {
            temporal: dateColumns[0],
            measures: numericColumns
          },
          description: 'Strong temporal patterns detected - ideal for trend analysis'
        });
      }
      
      // Check for seasonality
      const seasonality = this.detectSeasonality(data, dateColumns[0], numericColumns[0]);
      if (seasonality.detected) {
        tasks.push({
          type: this.tasks.PATTERN,
          priority: 2,
          strength: seasonality.strength,
          pattern: seasonality.type,
          columns: {
            temporal: dateColumns[0],
            measure: numericColumns[0]
          },
          description: `${seasonality.type} seasonality pattern detected`
        });
      }
    }
    
    // Detect part-to-whole relationships
    if (categoricalColumns.length > 0 && numericColumns.length > 0) {
      const partToWhole = this.detectPartToWhole(data, categoricalColumns, numericColumns);
      if (partToWhole.detected) {
        tasks.push({
          type: this.tasks.PART_TO_WHOLE,
          priority: partToWhole.categories <= 5 ? 1 : 3,
          strength: partToWhole.strength,
          columns: partToWhole.columns,
          description: `${partToWhole.categories} categories comprise the whole`
        });
      }
    }
    
    // Detect correlations
    if (numericColumns.length >= 2) {
      const correlations = this.detectCorrelations(data, numericColumns);
      if (correlations.length > 0) {
        tasks.push({
          type: this.tasks.CORRELATION,
          priority: 2,
          strength: Math.max(...correlations.map(c => Math.abs(c.correlation))),
          relationships: correlations,
          description: `${correlations.length} significant correlations found`
        });
      }
    }
    
    // Detect distributions
    if (numericColumns.length > 0) {
      numericColumns.forEach(col => {
        const distribution = this.analyzeDistribution(data, col);
        tasks.push({
          type: this.tasks.DISTRIBUTION,
          priority: 3,
          columns: {
            measure: col
          },
          characteristics: distribution,
          description: `${distribution.type} distribution for ${col}`
        });
      });
    }
    
    // Detect comparison opportunities
    if (categoricalColumns.length > 0 && numericColumns.length > 0) {
      const comparisons = this.detectComparisons(data, categoricalColumns, numericColumns);
      comparisons.forEach(comp => {
        tasks.push({
          type: this.tasks.COMPARISON,
          priority: 2,
          ...comp
        });
      });
    }
    
    // Detect ranking opportunities
    if (categoricalColumns.length > 0 && numericColumns.length > 0) {
      const ranking = this.detectRanking(data, categoricalColumns[0], numericColumns[0]);
      if (ranking.suitable) {
        tasks.push({
          type: this.tasks.RANKING,
          priority: 2,
          ...ranking
        });
      }
    }
    
    // Detect geographic patterns
    if (geographicColumns.length > 0 && numericColumns.length > 0) {
      tasks.push({
        type: this.tasks.GEOSPATIAL,
        priority: 2,
        columns: {
          geographic: geographicColumns[0],
          measure: numericColumns[0]
        },
        description: 'Geographic data detected - suitable for map visualization'
      });
    }
    
    // Detect hierarchical relationships
    const hierarchy = this.detectHierarchy(data, columns);
    if (hierarchy.detected) {
      tasks.push({
        type: this.tasks.HIERARCHY,
        priority: 2,
        ...hierarchy
      });
    }
    
    // Sort by priority and return
    return tasks.sort((a, b) => a.priority - b.priority);
  }
  
  calculateTemporalStrength(data, dateColumn) {
    if (!dateColumn || data.length < 10) return 0;
    
    // Check if dates are sequential and evenly spaced
    const dates = data
      .map(r => r[dateColumn])
      .filter(d => d instanceof Date)
      .sort((a, b) => a - b);
    
    if (dates.length < 10) return 0;
    
    // Calculate intervals
    const intervals = [];
    for (let i = 1; i < dates.length; i++) {
      intervals.push(dates[i] - dates[i-1]);
    }
    
    // Check consistency of intervals
    const avgInterval = intervals.reduce((a, b) => a + b) / intervals.length;
    const variance = intervals.reduce((sum, int) => sum + Math.pow(int - avgInterval, 2), 0) / intervals.length;
    const cv = Math.sqrt(variance) / avgInterval; // Coefficient of variation
    
    // Lower CV means more regular time series
    return Math.max(0, 1 - cv);
  }
  
  detectSeasonality(data, dateColumn, valueColumn) {
    if (!dateColumn || !valueColumn || data.length < 100) {
      return { detected: false };
    }
    
    // Group by time periods
    const monthlyData = {};
    const weeklyData = {};
    const dailyData = {};
    
    data.forEach(row => {
      const date = row[dateColumn];
      const value = row[valueColumn];
      if (date instanceof Date && typeof value === 'number') {
        const month = date.getMonth();
        const dayOfWeek = date.getDay();
        const dayOfMonth = date.getDate();
        
        monthlyData[month] = monthlyData[month] || [];
        monthlyData[month].push(value);
        
        weeklyData[dayOfWeek] = weeklyData[dayOfWeek] || [];
        weeklyData[dayOfWeek].push(value);
        
        dailyData[dayOfMonth] = dailyData[dayOfMonth] || [];
        dailyData[dayOfMonth].push(value);
      }
    });
    
    // Calculate variance across periods
    const monthlyVariance = this.calculatePeriodVariance(monthlyData);
    const weeklyVariance = this.calculatePeriodVariance(weeklyData);
    
    if (monthlyVariance > 0.3) {
      return {
        detected: true,
        type: 'monthly',
        strength: monthlyVariance
      };
    } else if (weeklyVariance > 0.3) {
      return {
        detected: true,
        type: 'weekly',
        strength: weeklyVariance
      };
    }
    
    return { detected: false };
  }
  
  calculatePeriodVariance(periodData) {
    const periodAverages = Object.values(periodData).map(values => 
      values.reduce((a, b) => a + b) / values.length
    );
    
    if (periodAverages.length < 2) return 0;
    
    const globalAverage = periodAverages.reduce((a, b) => a + b) / periodAverages.length;
    const variance = periodAverages.reduce((sum, avg) => 
      sum + Math.pow(avg - globalAverage, 2), 0
    ) / periodAverages.length;
    
    return Math.sqrt(variance) / globalAverage;
  }
  
  detectPartToWhole(data, categoricalColumns, numericColumns) {
    for (const catCol of categoricalColumns) {
      const uniqueValues = new Set(data.map(r => r[catCol])).size;
      
      if (uniqueValues >= 2 && uniqueValues <= 10) {
        // Check if numeric column sums to meaningful total
        for (const numCol of numericColumns) {
          const categoryTotals = {};
          data.forEach(row => {
            const cat = row[catCol];
            const val = row[numCol];
            if (cat && typeof val === 'number') {
              categoryTotals[cat] = (categoryTotals[cat] || 0) + val;
            }
          });
          
          const total = Object.values(categoryTotals).reduce((a, b) => a + b, 0);
          const percentages = Object.values(categoryTotals).map(v => v / total);
          
          // Check if this looks like a meaningful part-to-whole
          if (percentages.every(p => p > 0.01 && p < 0.99)) {
            return {
              detected: true,
              categories: uniqueValues,
              strength: 1 - this.calculateGini(percentages),
              columns: {
                category: catCol,
                value: numCol
              }
            };
          }
        }
      }
    }
    
    return { detected: false };
  }
  
  calculateGini(values) {
    // Gini coefficient for inequality measurement
    const sorted = [...values].sort((a, b) => a - b);
    const n = sorted.length;
    let sum = 0;
    
    for (let i = 0; i < n; i++) {
      sum += (2 * (i + 1) - n - 1) * sorted[i];
    }
    
    return sum / (n * sorted.reduce((a, b) => a + b, 0));
  }
  
  detectCorrelations(data, numericColumns) {
    const correlations = [];
    
    for (let i = 0; i < numericColumns.length; i++) {
      for (let j = i + 1; j < numericColumns.length; j++) {
        const col1 = numericColumns[i];
        const col2 = numericColumns[j];
        
        const pairs = data
          .filter(r => typeof r[col1] === 'number' && typeof r[col2] === 'number')
          .map(r => [r[col1], r[col2]]);
        
        if (pairs.length < 10) continue;
        
        const correlation = this.calculatePearsonCorrelation(pairs);
        
        if (Math.abs(correlation) > 0.3) {
          correlations.push({
            column1: col1,
            column2: col2,
            correlation: correlation,
            strength: Math.abs(correlation) > 0.7 ? 'strong' : 'moderate'
          });
        }
      }
    }
    
    return correlations.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));
  }
  
  calculatePearsonCorrelation(pairs) {
    const n = pairs.length;
    const sumX = pairs.reduce((sum, [x]) => sum + x, 0);
    const sumY = pairs.reduce((sum, [, y]) => sum + y, 0);
    const sumXY = pairs.reduce((sum, [x, y]) => sum + x * y, 0);
    const sumX2 = pairs.reduce((sum, [x]) => sum + x * x, 0);
    const sumY2 = pairs.reduce((sum, [, y]) => sum + y * y, 0);
    
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    
    return denominator === 0 ? 0 : numerator / denominator;
  }
  
  analyzeDistribution(data, column) {
    const values = data
      .map(r => r[column])
      .filter(v => typeof v === 'number')
      .sort((a, b) => a - b);
    
    if (values.length < 10) {
      return { type: 'unknown', characteristics: {} };
    }
    
    const n = values.length;
    const mean = values.reduce((a, b) => a + b) / n;
    const median = n % 2 === 0 
      ? (values[n/2 - 1] + values[n/2]) / 2 
      : values[Math.floor(n/2)];
    
    // Calculate moments
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / n;
    const stdDev = Math.sqrt(variance);
    const skewness = values.reduce((sum, v) => sum + Math.pow((v - mean) / stdDev, 3), 0) / n;
    const kurtosis = values.reduce((sum, v) => sum + Math.pow((v - mean) / stdDev, 4), 0) / n - 3;
    
    // Determine distribution type
    let type = 'unknown';
    if (Math.abs(skewness) < 0.5 && Math.abs(kurtosis) < 1) {
      type = 'normal';
    } else if (skewness > 1) {
      type = 'right-skewed';
    } else if (skewness < -1) {
      type = 'left-skewed';
    } else if (kurtosis > 1) {
      type = 'heavy-tailed';
    } else if (kurtosis < -1) {
      type = 'light-tailed';
    }
    
    // Check for multimodality
    const bins = this.createHistogramBins(values, 20);
    const peaks = this.findPeaks(bins);
    if (peaks.length > 1) {
      type = 'multimodal';
    }
    
    return {
      type,
      characteristics: {
        mean,
        median,
        stdDev,
        skewness,
        kurtosis,
        range: values[n-1] - values[0],
        iqr: values[Math.floor(n * 0.75)] - values[Math.floor(n * 0.25)],
        outliers: this.detectOutliers(values)
      }
    };
  }
  
  createHistogramBins(values, numBins) {
    const min = values[0];
    const max = values[values.length - 1];
    const binWidth = (max - min) / numBins;
    const bins = new Array(numBins).fill(0);
    
    values.forEach(v => {
      const binIndex = Math.min(Math.floor((v - min) / binWidth), numBins - 1);
      bins[binIndex]++;
    });
    
    return bins;
  }
  
  findPeaks(bins) {
    const peaks = [];
    for (let i = 1; i < bins.length - 1; i++) {
      if (bins[i] > bins[i-1] && bins[i] > bins[i+1]) {
        peaks.push(i);
      }
    }
    return peaks;
  }
  
  detectOutliers(sortedValues) {
    const n = sortedValues.length;
    const q1 = sortedValues[Math.floor(n * 0.25)];
    const q3 = sortedValues[Math.floor(n * 0.75)];
    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;
    
    return {
      count: sortedValues.filter(v => v < lowerBound || v > upperBound).length,
      percentage: sortedValues.filter(v => v < lowerBound || v > upperBound).length / n
    };
  }
  
  detectComparisons(data, categoricalColumns, numericColumns) {
    const comparisons = [];
    
    categoricalColumns.forEach(catCol => {
      const uniqueValues = new Set(data.map(r => r[catCol])).size;
      
      if (uniqueValues >= 2 && uniqueValues <= 20) {
        numericColumns.forEach(numCol => {
          // Calculate variance between categories
          const categoryStats = this.calculateCategoryStats(data, catCol, numCol);
          
          if (categoryStats.varianceRatio > 0.1) {
            comparisons.push({
              categoryColumn: catCol,
              valueColumn: numCol,
              categories: uniqueValues,
              varianceRatio: categoryStats.varianceRatio,
              description: `Compare ${numCol} across ${uniqueValues} ${catCol} categories`
            });
          }
        });
      }
    });
    
    return comparisons;
  }
  
  calculateCategoryStats(data, categoryCol, valueCol) {
    const categoryValues = {};
    
    data.forEach(row => {
      const cat = row[categoryCol];
      const val = row[valueCol];
      if (cat && typeof val === 'number') {
        categoryValues[cat] = categoryValues[cat] || [];
        categoryValues[cat].push(val);
      }
    });
    
    const categoryMeans = Object.values(categoryValues).map(values => 
      values.reduce((a, b) => a + b) / values.length
    );
    
    const globalMean = categoryMeans.reduce((a, b) => a + b) / categoryMeans.length;
    const betweenVariance = categoryMeans.reduce((sum, mean) => 
      sum + Math.pow(mean - globalMean, 2), 0
    ) / categoryMeans.length;
    
    return {
      varianceRatio: betweenVariance / Math.pow(globalMean, 2)
    };
  }
  
  detectRanking(data, categoryCol, valueCol) {
    const categoryTotals = {};
    
    data.forEach(row => {
      const cat = row[categoryCol];
      const val = row[valueCol];
      if (cat && typeof val === 'number') {
        categoryTotals[cat] = (categoryTotals[cat] || 0) + val;
      }
    });
    
    const sorted = Object.entries(categoryTotals)
      .sort((a, b) => b[1] - a[1]);
    
    if (sorted.length < 3 || sorted.length > 30) {
      return { suitable: false };
    }
    
    // Check if there's meaningful variance
    const values = sorted.map(([, v]) => v);
    const max = values[0];
    const min = values[values.length - 1];
    
    if (max / min < 1.5) {
      return { suitable: false };
    }
    
    return {
      suitable: true,
      categoryColumn: categoryCol,
      valueColumn: valueCol,
      topItems: sorted.slice(0, 5).map(([cat, val]) => ({ category: cat, value: val })),
      description: `Rank ${sorted.length} categories by ${valueCol}`
    };
  }
  
  findGeographicColumns(columns, columnTypes) {
    const geoKeywords = ['state', 'country', 'city', 'region', 'location', 'address', 
                        'postcode', 'zip', 'latitude', 'longitude', 'lat', 'lon', 'lng'];
    
    return columns.filter(col => {
      const isGeo = geoKeywords.some(keyword => col.toLowerCase().includes(keyword));
      const isAppropriateType = ['categorical', 'postcode', 'string', 'float', 'integer']
        .includes(columnTypes[col]?.type || 'unknown');
      return isGeo && isAppropriateType;
    });
  }
  
  detectHierarchy(data, columns) {
    // Look for parent-child relationships
    const hierarchicalPatterns = [
      ['category', 'subcategory'],
      ['department', 'team'],
      ['country', 'state', 'city'],
      ['year', 'month', 'day'],
      ['region', 'district', 'store']
    ];
    
    for (const pattern of hierarchicalPatterns) {
      const matchedColumns = [];
      
      for (const level of pattern) {
        const found = columns.find(col => 
          col.toLowerCase().includes(level)
        );
        if (found) {
          matchedColumns.push(found);
        }
      }
      
      if (matchedColumns.length >= 2) {
        return {
          detected: true,
          levels: matchedColumns,
          depth: matchedColumns.length,
          description: `Hierarchical structure detected: ${matchedColumns.join(' → ')}`
        };
      }
    }
    
    return { detected: false };
  }
}