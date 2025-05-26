export class DataProfiler {
  analyzeData(data, columnTypes) {
    const profile = {
      dimensions: this.analyzeDimensions(data, columnTypes),
      cardinality: this.analyzeCardinality(data, columnTypes),
      density: this.analyzeDensity(data, columnTypes),
      patterns: this.analyzePatterns(data, columnTypes),
      quality: this.analyzeQuality(data, columnTypes),
      relationships: this.analyzeRelationships(data, columnTypes)
    };
    
    return profile;
  }
  
  analyzeDimensions(data, columnTypes) {
    const columns = Object.keys(columnTypes);
    
    return {
      rows: data.length,
      columns: columns.length,
      continuous: columns.filter(col => ['integer', 'float'].includes(columnTypes[col].type)).length,
      discrete: columns.filter(col => columnTypes[col].type === 'categorical').length,
      temporal: columns.filter(col => columnTypes[col].type === 'date').length,
      text: columns.filter(col => columnTypes[col].type === 'string').length,
      geographic: this.countGeographicColumns(columns, columnTypes),
      density: data.length * columns.length,
      sizeCategory: this.categorizeSze(data.length)
    };
  }
  
  categorizeSze(rowCount) {
    if (rowCount < 100) return 'small';
    if (rowCount < 1000) return 'medium';
    if (rowCount < 10000) return 'large';
    if (rowCount < 100000) return 'very_large';
    return 'massive';
  }
  
  analyzeCardinality(data, columnTypes) {
    const cardinality = {};
    const columns = Object.keys(columnTypes);
    
    columns.forEach(col => {
      const uniqueValues = new Set(data.map(r => r[col])).size;
      const ratio = uniqueValues / data.length;
      
      cardinality[col] = {
        unique: uniqueValues,
        ratio: ratio,
        category: this.categorizeCardinality(ratio, uniqueValues, columnTypes[col].type)
      };
    });
    
    return cardinality;
  }
  
  categorizeCardinality(ratio, unique, type) {
    if (type === 'categorical') {
      if (unique === 2) return 'binary';
      if (unique <= 5) return 'low_categorical';
      if (unique <= 10) return 'medium_categorical';
      if (unique <= 20) return 'high_categorical';
      return 'very_high_categorical';
    }
    
    if (ratio > 0.95) return 'unique_identifier';
    if (ratio > 0.5) return 'high_cardinality';
    if (ratio > 0.1) return 'medium_cardinality';
    return 'low_cardinality';
  }
  
  analyzeDensity(data, columnTypes) {
    const columns = Object.keys(columnTypes);
    const density = {
      overall: 1,
      byColumn: {},
      sparsity: 0,
      missingPatterns: []
    };
    
    // Calculate missing values per column
    columns.forEach(col => {
      const missing = data.filter(r => r[col] === null || r[col] === undefined).length;
      const missingRatio = missing / data.length;
      
      density.byColumn[col] = {
        populated: 1 - missingRatio,
        missing: missing,
        missingPercentage: missingRatio * 100
      };
      
      if (missingRatio > 0.1) {
        density.missingPatterns.push({
          column: col,
          percentage: missingRatio * 100,
          impact: missingRatio > 0.5 ? 'severe' : missingRatio > 0.2 ? 'moderate' : 'low'
        });
      }
    });
    
    // Overall density
    const totalCells = data.length * columns.length;
    const missingCells = columns.reduce((sum, col) => 
      sum + density.byColumn[col].missing, 0
    );
    density.overall = 1 - (missingCells / totalCells);
    density.sparsity = missingCells / totalCells;
    
    return density;
  }
  
  analyzePatterns(data, columnTypes) {
    const patterns = {
      temporal: this.detectTemporalPatterns(data, columnTypes),
      categorical: this.detectCategoricalPatterns(data, columnTypes),
      numeric: this.detectNumericPatterns(data, columnTypes),
      compound: this.detectCompoundPatterns(data, columnTypes)
    };
    
    return patterns;
  }
  
  detectTemporalPatterns(data, columnTypes) {
    const dateColumns = Object.keys(columnTypes).filter(col => 
      columnTypes[col].type === 'date'
    );
    
    if (dateColumns.length === 0) return null;
    
    const patterns = {};
    
    dateColumns.forEach(col => {
      const dates = data
        .map(r => r[col])
        .filter(d => d instanceof Date)
        .sort((a, b) => a - b);
      
      if (dates.length < 2) return;
      
      // Analyze frequency
      const intervals = [];
      for (let i = 1; i < dates.length; i++) {
        intervals.push(dates[i] - dates[i-1]);
      }
      
      const avgInterval = intervals.reduce((a, b) => a + b) / intervals.length;
      const frequency = this.detectFrequency(avgInterval);
      
      // Analyze range
      const range = {
        start: dates[0],
        end: dates[dates.length - 1],
        span: dates[dates.length - 1] - dates[0],
        spanDays: (dates[dates.length - 1] - dates[0]) / (1000 * 60 * 60 * 24)
      };
      
      // Check for gaps
      const gaps = intervals
        .map((interval, idx) => ({ interval, index: idx }))
        .filter(item => item.interval > avgInterval * 2)
        .map(item => ({
          start: dates[item.index],
          end: dates[item.index + 1],
          duration: item.interval
        }));
      
      patterns[col] = {
        frequency,
        range,
        hasGaps: gaps.length > 0,
        gaps,
        completeness: dates.length / data.length
      };
    });
    
    return patterns;
  }
  
  detectFrequency(avgIntervalMs) {
    const hour = 1000 * 60 * 60;
    const day = hour * 24;
    const week = day * 7;
    const month = day * 30;
    
    if (avgIntervalMs < hour * 2) return 'hourly';
    if (avgIntervalMs < day * 2) return 'daily';
    if (avgIntervalMs < week * 2) return 'weekly';
    if (avgIntervalMs < month * 2) return 'monthly';
    if (avgIntervalMs < month * 4) return 'quarterly';
    return 'irregular';
  }
  
  detectCategoricalPatterns(data, columnTypes) {
    const categoricalColumns = Object.keys(columnTypes).filter(col => 
      columnTypes[col].type === 'categorical'
    );
    
    const patterns = {};
    
    categoricalColumns.forEach(col => {
      const values = data.map(r => r[col]).filter(v => v !== null);
      const valueCounts = {};
      values.forEach(v => valueCounts[v] = (valueCounts[v] || 0) + 1);
      
      const sorted = Object.entries(valueCounts)
        .sort((a, b) => b[1] - a[1]);
      
      // Analyze distribution
      const total = values.length;
      const distribution = sorted.map(([value, count]) => ({
        value,
        count,
        percentage: count / total * 100
      }));
      
      // Check for imbalance
      const topPercentage = distribution[0]?.percentage || 0;
      const imbalanced = topPercentage > 50;
      
      // Check for rare categories
      const rareCategories = distribution.filter(d => d.percentage < 5);
      
      patterns[col] = {
        uniqueValues: sorted.length,
        distribution: distribution.slice(0, 10), // Top 10
        imbalanced,
        dominantValue: imbalanced ? distribution[0].value : null,
        rareCategories: rareCategories.length,
        entropy: this.calculateEntropy(Object.values(valueCounts))
      };
    });
    
    return patterns;
  }
  
  calculateEntropy(counts) {
    const total = counts.reduce((a, b) => a + b, 0);
    const probabilities = counts.map(c => c / total);
    
    return -probabilities.reduce((sum, p) => {
      return p > 0 ? sum + p * Math.log2(p) : sum;
    }, 0);
  }
  
  detectNumericPatterns(data, columnTypes) {
    const numericColumns = Object.keys(columnTypes).filter(col => 
      ['integer', 'float'].includes(columnTypes[col].type)
    );
    
    const patterns = {};
    
    numericColumns.forEach(col => {
      const values = data
        .map(r => r[col])
        .filter(v => typeof v === 'number')
        .sort((a, b) => a - b);
      
      if (values.length < 10) return;
      
      // Basic statistics
      const n = values.length;
      const mean = values.reduce((a, b) => a + b) / n;
      const median = n % 2 === 0 
        ? (values[n/2 - 1] + values[n/2]) / 2 
        : values[Math.floor(n/2)];
      
      // Check for specific patterns
      const isMonetary = this.checkMonetaryPattern(values);
      const isPercentage = this.checkPercentagePattern(values);
      const isCount = this.checkCountPattern(values);
      const hasNegative = values.some(v => v < 0);
      
      // Scale
      const range = values[n-1] - values[0];
      const orderOfMagnitude = Math.floor(Math.log10(Math.max(...values.map(Math.abs))));
      
      patterns[col] = {
        dataPattern: isMonetary ? 'monetary' : isPercentage ? 'percentage' : isCount ? 'count' : 'continuous',
        scale: {
          min: values[0],
          max: values[n-1],
          range,
          orderOfMagnitude
        },
        hasNegative,
        distribution: {
          mean,
          median,
          skewness: this.calculateSkewness(values, mean, n)
        }
      };
    });
    
    return patterns;
  }
  
  checkMonetaryPattern(values) {
    // Check if values look like money (2 decimal places common)
    const decimalCounts = values.map(v => {
      const str = v.toString();
      const decimalIndex = str.indexOf('.');
      return decimalIndex === -1 ? 0 : str.length - decimalIndex - 1;
    });
    
    const twoDecimals = decimalCounts.filter(d => d === 2).length;
    return twoDecimals / values.length > 0.5;
  }
  
  checkPercentagePattern(values) {
    // Check if values are between 0 and 100 or 0 and 1
    const between0And1 = values.every(v => v >= 0 && v <= 1);
    const between0And100 = values.every(v => v >= 0 && v <= 100);
    
    return between0And1 || (between0And100 && values.some(v => v > 1));
  }
  
  checkCountPattern(values) {
    // Check if all values are integers
    return values.every(v => Number.isInteger(v)) && values.every(v => v >= 0);
  }
  
  calculateSkewness(values, mean, n) {
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / n;
    const stdDev = Math.sqrt(variance);
    
    if (stdDev === 0) return 0;
    
    return values.reduce((sum, v) => sum + Math.pow((v - mean) / stdDev, 3), 0) / n;
  }
  
  detectCompoundPatterns(data, columnTypes) {
    const patterns = [];
    
    // Detect time series patterns
    const dateColumns = Object.keys(columnTypes).filter(col => 
      columnTypes[col].type === 'date'
    );
    const numericColumns = Object.keys(columnTypes).filter(col => 
      ['integer', 'float'].includes(columnTypes[col].type)
    );
    
    if (dateColumns.length > 0 && numericColumns.length > 0) {
      patterns.push({
        type: 'time_series',
        temporal: dateColumns,
        measures: numericColumns,
        strength: 'high'
      });
    }
    
    // Detect hierarchical patterns
    const hierarchicalCandidates = this.findHierarchicalCandidates(data, columnTypes);
    if (hierarchicalCandidates.length > 0) {
      patterns.push({
        type: 'hierarchical',
        levels: hierarchicalCandidates,
        strength: 'medium'
      });
    }
    
    // Detect geographic patterns
    const geoColumns = this.findGeographicColumns(Object.keys(columnTypes), columnTypes);
    if (geoColumns.length > 0 && numericColumns.length > 0) {
      patterns.push({
        type: 'geographic',
        location: geoColumns,
        measures: numericColumns,
        strength: 'high'
      });
    }
    
    return patterns;
  }
  
  findHierarchicalCandidates(data, columnTypes) {
    const categoricalColumns = Object.keys(columnTypes).filter(col => 
      columnTypes[col].type === 'categorical'
    );
    
    const candidates = [];
    
    // Check cardinality relationships
    for (let i = 0; i < categoricalColumns.length; i++) {
      for (let j = i + 1; j < categoricalColumns.length; j++) {
        const col1 = categoricalColumns[i];
        const col2 = categoricalColumns[j];
        
        const unique1 = new Set(data.map(r => r[col1])).size;
        const unique2 = new Set(data.map(r => r[col2])).size;
        
        // One should have significantly fewer unique values
        if (unique1 < unique2 / 3) {
          candidates.push([col1, col2]);
        } else if (unique2 < unique1 / 3) {
          candidates.push([col2, col1]);
        }
      }
    }
    
    return candidates;
  }
  
  analyzeQuality(data, columnTypes) {
    const quality = {
      completeness: 0,
      consistency: [],
      validity: [],
      accuracy: []
    };
    
    // Completeness
    const totalCells = data.length * Object.keys(columnTypes).length;
    const missingCells = Object.keys(columnTypes).reduce((sum, col) => 
      sum + data.filter(r => r[col] === null || r[col] === undefined).length, 0
    );
    quality.completeness = 1 - (missingCells / totalCells);
    
    // Check for consistency issues
    Object.keys(columnTypes).forEach(col => {
      if (columnTypes[col].type === 'categorical') {
        // Check for similar but different values
        const values = [...new Set(data.map(r => r[col]).filter(v => v !== null))];
        const similar = this.findSimilarValues(values);
        
        if (similar.length > 0) {
          quality.consistency.push({
            column: col,
            issue: 'similar_values',
            examples: similar
          });
        }
      }
    });
    
    return quality;
  }
  
  findSimilarValues(values) {
    const similar = [];
    
    for (let i = 0; i < values.length; i++) {
      for (let j = i + 1; j < values.length; j++) {
        const v1 = values[i].toString().toLowerCase();
        const v2 = values[j].toString().toLowerCase();
        
        // Check for case differences
        if (v1 === v2 && values[i] !== values[j]) {
          similar.push([values[i], values[j]]);
        }
        
        // Check for leading/trailing spaces
        if (v1.trim() === v2.trim() && values[i] !== values[j]) {
          similar.push([values[i], values[j]]);
        }
      }
    }
    
    return similar.slice(0, 5); // Return top 5 examples
  }
  
  analyzeRelationships(data, columnTypes) {
    const relationships = {
      correlations: [],
      dependencies: [],
      associations: []
    };
    
    // Find numeric correlations
    const numericColumns = Object.keys(columnTypes).filter(col => 
      ['integer', 'float'].includes(columnTypes[col].type)
    );
    
    for (let i = 0; i < numericColumns.length; i++) {
      for (let j = i + 1; j < numericColumns.length; j++) {
        const correlation = this.calculateCorrelation(
          data.map(r => r[numericColumns[i]]),
          data.map(r => r[numericColumns[j]])
        );
        
        if (Math.abs(correlation) > 0.3) {
          relationships.correlations.push({
            column1: numericColumns[i],
            column2: numericColumns[j],
            correlation,
            strength: Math.abs(correlation) > 0.7 ? 'strong' : 'moderate'
          });
        }
      }
    }
    
    return relationships;
  }
  
  calculateCorrelation(x, y) {
    const pairs = x
      .map((xi, i) => [xi, y[i]])
      .filter(([xi, yi]) => typeof xi === 'number' && typeof yi === 'number');
    
    if (pairs.length < 10) return 0;
    
    const n = pairs.length;
    const sumX = pairs.reduce((sum, [xi]) => sum + xi, 0);
    const sumY = pairs.reduce((sum, [, yi]) => sum + yi, 0);
    const sumXY = pairs.reduce((sum, [xi, yi]) => sum + xi * yi, 0);
    const sumX2 = pairs.reduce((sum, [xi]) => sum + xi * xi, 0);
    const sumY2 = pairs.reduce((sum, [, yi]) => sum + yi * yi, 0);
    
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    
    return denominator === 0 ? 0 : numerator / denominator;
  }
  
  countGeographicColumns(columns, columnTypes) {
    const geoKeywords = ['state', 'country', 'city', 'region', 'location', 'address', 
                        'postcode', 'zip', 'latitude', 'longitude', 'lat', 'lon', 'lng'];
    
    return columns.filter(col => {
      const isGeo = geoKeywords.some(keyword => col.toLowerCase().includes(keyword));
      const isAppropriateType = ['categorical', 'postcode', 'string', 'float', 'integer']
        .includes(columnTypes[col]?.type || 'unknown');
      return isGeo && isAppropriateType;
    }).length;
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
}