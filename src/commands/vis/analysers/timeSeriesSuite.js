export class TimeSeriesVisualizationSuite {
  constructor() {
    this.patterns = {
      TREND: 'trend',
      SEASONAL: 'seasonal',
      CYCLIC: 'cyclic',
      IRREGULAR: 'irregular',
      LEVEL_SHIFT: 'level_shift',
      VOLATILITY: 'volatility',
      OUTLIER: 'outlier'
    };
    
    this.frequencies = {
      INTRADAY: 'intraday',
      DAILY: 'daily',
      WEEKLY: 'weekly',
      MONTHLY: 'monthly',
      QUARTERLY: 'quarterly',
      YEARLY: 'yearly'
    };
  }
  
  analyzeTimeSeriesVisualization(data, columnTypes, task) {
    const dateColumns = Object.keys(columnTypes).filter(col => 
      columnTypes[col].type === 'date'
    );
    const numericColumns = Object.keys(columnTypes).filter(col => 
      ['integer', 'float'].includes(columnTypes[col].type)
    );
    
    if (dateColumns.length === 0 || numericColumns.length === 0 || data.length < 10) {
      return [];
    }
    
    const timeSeriesData = this.prepareTimeSeriesData(data, dateColumns[0], numericColumns);
    const characteristics = this.analyzeTimeSeriesCharacteristics(timeSeriesData);
    
    const visualizations = [];
    
    // Primary time series visualizations
    visualizations.push(...this.generatePrimaryTimeSeriesViz(timeSeriesData, characteristics));
    
    // Advanced patterns
    if (timeSeriesData.length >= 50) {
      visualizations.push(...this.generateAdvancedTimeSeriesViz(timeSeriesData, characteristics));
    }
    
    // Multiple series comparisons
    if (numericColumns.length > 1) {
      visualizations.push(...this.generateMultiSeriesViz(data, dateColumns[0], numericColumns, characteristics));
    }
    
    // Interactive time series
    visualizations.push(...this.generateInteractiveTimeSeriesViz(timeSeriesData, characteristics));
    
    return visualizations.sort((a, b) => b.priority - a.priority);
  }
  
  prepareTimeSeriesData(data, dateColumn, numericColumns) {
    const timeSeriesData = data
      .filter(r => r[dateColumn] instanceof Date)
      .sort((a, b) => a[dateColumn] - b[dateColumn])
      .map(r => {
        const tsPoint = { date: r[dateColumn] };
        numericColumns.forEach(col => {
          if (typeof r[col] === 'number') {
            tsPoint[col] = r[col];
          }
        });
        return tsPoint;
      });
    
    return timeSeriesData;
  }
  
  analyzeTimeSeriesCharacteristics(timeSeriesData) {
    if (timeSeriesData.length < 10) {
      return { frequency: 'unknown', patterns: [] };
    }
    
    const characteristics = {
      length: timeSeriesData.length,
      frequency: this.detectFrequency(timeSeriesData),
      dateRange: {
        start: timeSeriesData[0].date,
        end: timeSeriesData[timeSeriesData.length - 1].date,
        span: timeSeriesData[timeSeriesData.length - 1].date - timeSeriesData[0].date
      },
      patterns: {},
      gaps: this.detectGaps(timeSeriesData),
      multipleSeries: Object.keys(timeSeriesData[0]).filter(k => k !== 'date').length > 1
    };
    
    // Analyze each numeric series
    Object.keys(timeSeriesData[0]).forEach(col => {
      if (col !== 'date') {
        characteristics.patterns[col] = this.analyzeSeriesPatterns(timeSeriesData, col);
      }
    });
    
    return characteristics;
  }
  
  detectFrequency(timeSeriesData) {
    if (timeSeriesData.length < 3) return 'unknown';
    
    const intervals = [];
    for (let i = 1; i < Math.min(timeSeriesData.length, 20); i++) {
      const interval = timeSeriesData[i].date - timeSeriesData[i-1].date;
      intervals.push(interval);
    }
    
    const avgInterval = intervals.reduce((a, b) => a + b) / intervals.length;
    
    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;
    const week = 7 * day;
    const month = 30 * day;
    
    if (avgInterval < hour) return this.frequencies.INTRADAY;
    if (avgInterval < day * 2) return this.frequencies.DAILY;
    if (avgInterval < week * 2) return this.frequencies.WEEKLY;
    if (avgInterval < month * 2) return this.frequencies.MONTHLY;
    if (avgInterval < month * 6) return this.frequencies.QUARTERLY;
    return this.frequencies.YEARLY;
  }
  
  detectGaps(timeSeriesData) {
    const gaps = [];
    const expectedInterval = this.calculateExpectedInterval(timeSeriesData);
    
    for (let i = 1; i < timeSeriesData.length; i++) {
      const actualInterval = timeSeriesData[i].date - timeSeriesData[i-1].date;
      if (actualInterval > expectedInterval * 2) {
        gaps.push({
          start: timeSeriesData[i-1].date,
          end: timeSeriesData[i].date,
          duration: actualInterval,
          expectedPoints: Math.floor(actualInterval / expectedInterval) - 1
        });
      }
    }
    
    return gaps;
  }
  
  calculateExpectedInterval(timeSeriesData) {
    const intervals = [];
    for (let i = 1; i < Math.min(timeSeriesData.length, 10); i++) {
      intervals.push(timeSeriesData[i].date - timeSeriesData[i-1].date);
    }
    return intervals.reduce((a, b) => a + b) / intervals.length;
  }
  
  analyzeSeriesPatterns(timeSeriesData, column) {
    const values = timeSeriesData.map(d => d[column]).filter(v => typeof v === 'number');
    
    if (values.length < 10) {
      return { patterns: [], characteristics: {} };
    }
    
    const patterns = [];
    
    // Trend analysis
    const trend = this.detectTrend(values);
    if (trend.significant) {
      patterns.push({
        type: this.patterns.TREND,
        direction: trend.direction,
        strength: trend.strength,
        significance: trend.pValue
      });
    }
    
    // Seasonality detection
    const seasonality = this.detectSeasonality(timeSeriesData, column);
    if (seasonality.detected) {
      patterns.push({
        type: this.patterns.SEASONAL,
        period: seasonality.period,
        strength: seasonality.strength,
        type_detail: seasonality.type
      });
    }
    
    // Volatility analysis
    const volatility = this.analyzeVolatility(values);
    if (volatility.clusters.length > 1) {
      patterns.push({
        type: this.patterns.VOLATILITY,
        clusters: volatility.clusters,
        heteroscedastic: volatility.heteroscedastic
      });
    }
    
    // Level shifts
    const levelShifts = this.detectLevelShifts(values);
    if (levelShifts.length > 0) {
      patterns.push({
        type: this.patterns.LEVEL_SHIFT,
        shifts: levelShifts
      });
    }
    
    // Outliers
    const outliers = this.detectTimeSeriesOutliers(timeSeriesData, column);
    if (outliers.length > 0) {
      patterns.push({
        type: this.patterns.OUTLIER,
        outliers: outliers
      });
    }
    
    return {
      patterns,
      characteristics: {
        mean: values.reduce((a, b) => a + b) / values.length,
        variance: this.calculateVariance(values),
        autocorrelation: this.calculateAutocorrelation(values, 1),
        stationarity: this.testStationarity(values)
      }
    };
  }
  
  detectTrend(values) {
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const meanX = (n - 1) / 2;
    const meanY = values.reduce((a, b) => a + b) / n;
    
    const numerator = x.reduce((sum, xi, i) => sum + (xi - meanX) * (values[i] - meanY), 0);
    const denominator = x.reduce((sum, xi) => sum + Math.pow(xi - meanX, 2), 0);
    
    const slope = denominator === 0 ? 0 : numerator / denominator;
    
    // Simplified significance test
    const correlation = Math.abs(numerator) / Math.sqrt(denominator * values.reduce((sum, yi) => sum + Math.pow(yi - meanY, 2), 0));
    const tStat = correlation * Math.sqrt((n - 2) / (1 - correlation * correlation));
    const pValue = tStat > 2 ? 0.01 : 0.1; // Simplified
    
    return {
      slope,
      direction: slope > 0 ? 'increasing' : slope < 0 ? 'decreasing' : 'stable',
      strength: Math.abs(correlation),
      significant: pValue < 0.05,
      pValue
    };
  }
  
  detectSeasonality(timeSeriesData, column) {
    const values = timeSeriesData.map(d => d[column]).filter(v => typeof v === 'number');
    
    if (values.length < 24) {
      return { detected: false };
    }
    
    // Check for different seasonal periods
    const periods = [7, 12, 24, 30, 365]; // weekly, monthly, etc.
    let bestPeriod = null;
    let bestStrength = 0;
    
    periods.forEach(period => {
      if (values.length >= period * 2) {
        const strength = this.calculateSeasonalStrength(values, period);
        if (strength > bestStrength) {
          bestStrength = strength;
          bestPeriod = period;
        }
      }
    });
    
    return {
      detected: bestStrength > 0.3,
      period: bestPeriod,
      strength: bestStrength,
      type: this.interpretSeasonalPeriod(bestPeriod)
    };
  }
  
  calculateSeasonalStrength(values, period) {
    // Simplified seasonal strength calculation
    const seasonalMeans = Array(period).fill(0);
    const seasonalCounts = Array(period).fill(0);
    
    values.forEach((value, index) => {
      const seasonIndex = index % period;
      seasonalMeans[seasonIndex] += value;
      seasonalCounts[seasonIndex]++;
    });
    
    seasonalMeans.forEach((sum, i) => {
      seasonalMeans[i] = seasonalCounts[i] > 0 ? sum / seasonalCounts[i] : 0;
    });
    
    const globalMean = values.reduce((a, b) => a + b) / values.length;
    const seasonalVariance = seasonalMeans.reduce((sum, mean) => 
      sum + Math.pow(mean - globalMean, 2), 0
    ) / period;
    
    const totalVariance = values.reduce((sum, val) => 
      sum + Math.pow(val - globalMean, 2), 0
    ) / values.length;
    
    return totalVariance > 0 ? seasonalVariance / totalVariance : 0;
  }
  
  interpretSeasonalPeriod(period) {
    const interpretations = {
      7: 'weekly',
      12: 'monthly',
      24: 'daily',
      30: 'monthly',
      365: 'yearly'
    };
    return interpretations[period] || 'unknown';
  }
  
  analyzeVolatility(values) {
    // Simple volatility clustering detection
    const returns = [];
    for (let i = 1; i < values.length; i++) {
      if (values[i-1] !== 0) {
        returns.push((values[i] - values[i-1]) / values[i-1]);
      }
    }
    
    const squaredReturns = returns.map(r => r * r);
    const movingVariances = [];
    const windowSize = Math.min(10, Math.floor(returns.length / 5));
    
    for (let i = windowSize; i < squaredReturns.length; i++) {
      const window = squaredReturns.slice(i - windowSize, i);
      const variance = window.reduce((a, b) => a + b) / window.length;
      movingVariances.push(variance);
    }
    
    // Detect volatility clusters (simplified)
    const threshold = this.calculateQuantile(movingVariances, 0.75);
    let clusters = [];
    let currentCluster = null;
    
    movingVariances.forEach((variance, index) => {
      if (variance > threshold) {
        if (!currentCluster) {
          currentCluster = { start: index, end: index, maxVolatility: variance };
        } else {
          currentCluster.end = index;
          currentCluster.maxVolatility = Math.max(currentCluster.maxVolatility, variance);
        }
      } else {
        if (currentCluster) {
          clusters.push(currentCluster);
          currentCluster = null;
        }
      }
    });
    
    if (currentCluster) clusters.push(currentCluster);
    
    return {
      clusters: clusters.slice(0, 5), // Top 5 clusters
      heteroscedastic: clusters.length > 0,
      averageVolatility: movingVariances.reduce((a, b) => a + b) / movingVariances.length
    };
  }
  
  detectLevelShifts(values) {
    const shifts = [];
    const windowSize = Math.max(5, Math.floor(values.length / 10));
    
    for (let i = windowSize; i < values.length - windowSize; i++) {
      const before = values.slice(i - windowSize, i);
      const after = values.slice(i, i + windowSize);
      
      const beforeMean = before.reduce((a, b) => a + b) / before.length;
      const afterMean = after.reduce((a, b) => a + b) / after.length;
      
      const difference = Math.abs(afterMean - beforeMean);
      const beforeStd = Math.sqrt(this.calculateVariance(before));
      
      if (difference > 2 * beforeStd) { // 2 standard deviations
        shifts.push({
          index: i,
          beforeMean,
          afterMean,
          magnitude: afterMean - beforeMean,
          significance: difference / beforeStd
        });
      }
    }
    
    return shifts.slice(0, 3); // Top 3 shifts
  }
  
  detectTimeSeriesOutliers(timeSeriesData, column) {
    const values = timeSeriesData.map(d => d[column]).filter(v => typeof v === 'number');
    const outliers = [];
    
    // Simple IQR method
    const q1 = this.calculateQuantile(values, 0.25);
    const q3 = this.calculateQuantile(values, 0.75);
    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;
    
    timeSeriesData.forEach((point, index) => {
      const value = point[column];
      if (typeof value === 'number' && (value < lowerBound || value > upperBound)) {
        outliers.push({
          index,
          date: point.date,
          value,
          type: value < lowerBound ? 'low' : 'high',
          deviation: value < lowerBound ? (lowerBound - value) / iqr : (value - upperBound) / iqr
        });
      }
    });
    
    return outliers.slice(0, 10); // Top 10 outliers
  }
  
  calculateVariance(values) {
    const mean = values.reduce((a, b) => a + b) / values.length;
    return values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  }
  
  calculateAutocorrelation(values, lag) {
    if (lag >= values.length) return 0;
    
    const n = values.length - lag;
    const mean = values.reduce((a, b) => a + b) / values.length;
    
    let numerator = 0;
    let denominator = 0;
    
    for (let i = 0; i < n; i++) {
      numerator += (values[i] - mean) * (values[i + lag] - mean);
    }
    
    for (let i = 0; i < values.length; i++) {
      denominator += Math.pow(values[i] - mean, 2);
    }
    
    return denominator === 0 ? 0 : numerator / denominator;
  }
  
  testStationarity(values) {
    // Simplified stationarity test (ADF-like)
    const trend = this.detectTrend(values);
    const autocorr = Math.abs(this.calculateAutocorrelation(values, 1));
    
    return {
      isStationary: !trend.significant && autocorr < 0.8,
      trend: trend.significant,
      unitRoot: autocorr > 0.95
    };
  }
  
  calculateQuantile(values, q) {
    const sorted = [...values].sort((a, b) => a - b);
    const index = q * (sorted.length - 1);
    
    if (Number.isInteger(index)) {
      return sorted[index];
    } else {
      const lower = sorted[Math.floor(index)];
      const upper = sorted[Math.ceil(index)];
      return lower + (upper - lower) * (index - Math.floor(index));
    }
  }
  
  generatePrimaryTimeSeriesViz(timeSeriesData, characteristics) {
    const visualizations = [];
    const seriesColumns = Object.keys(timeSeriesData[0]).filter(k => k !== 'date');
    
    // Line chart (primary recommendation)
    visualizations.push({
      type: 'line_chart',
      priority: 10,
      rationale: 'Standard time series visualization showing temporal progression',
      specifications: {
        chart: 'Time Series Line Chart',
        design: {
          xAxis: 'Time (chronological)',
          yAxis: seriesColumns[0],
          lineWeight: characteristics.length > 1000 ? 1 : 2,
          pointMarkers: characteristics.length <= 100,
          interpolation: 'linear',
          missingDataHandling: 'gap'
        },
        enhancements: this.generateTimeSeriesEnhancements(characteristics),
        implementation: this.generateLineChartCode(timeSeriesData, characteristics)
      }
    });
    
    // Connected scatter plot for cycles
    if (characteristics.patterns[seriesColumns[0]]?.patterns.some(p => p.type === 'seasonal')) {
      visualizations.push({
        type: 'connected_scatterplot',
        priority: 8,
        rationale: 'Reveals cyclical patterns and seasonal loops',
        specifications: {
          chart: 'Connected Scatterplot',
          design: {
            xAxis: this.getSeasonalComponent(characteristics),
            yAxis: 'Detrended values',
            connectionLine: 'Chronological order',
            colorGradient: 'Time progression',
            annotations: 'Mark key events'
          },
          patterns: {
            cycles: 'Closed loops indicate seasonality',
            trends: 'Overall movement direction',
            anomalies: 'Points far from typical pattern'
          },
          implementation: this.generateConnectedScatterCode(timeSeriesData, characteristics)
        }
      });
    }
    
    // Calendar heatmap for patterns
    if (characteristics.frequency === 'daily' && characteristics.length >= 365) {
      visualizations.push({
        type: 'calendar_heatmap',
        priority: 7,
        rationale: 'Natural time navigation and pattern detection',
        specifications: {
          chart: 'Calendar Heatmap',
          design: {
            layout: 'GitHub contribution style',
            colorScale: 'Diverging from median',
            cellBorders: 'White 2px separation',
            tooltips: 'Exact values with context'
          },
          patterns: {
            dayOfWeek: 'Vertical patterns',
            monthlyTrends: 'Block patterns',
            holidays: 'Visible gaps',
            consistency: 'Color uniformity over time'
          },
          implementation: this.generateCalendarHeatmapCode(timeSeriesData, characteristics)
        }
      });
    }
    
    return visualizations;
  }
  
  generateAdvancedTimeSeriesViz(timeSeriesData, characteristics) {
    const visualizations = [];
    const seriesColumns = Object.keys(timeSeriesData[0]).filter(k => k !== 'date');
    
    // Horizon chart for dense data
    if (characteristics.length > 500) {
      visualizations.push({
        type: 'horizon_chart',
        priority: 8,
        rationale: 'Space-efficient visualization for long time series',
        specifications: {
          chart: 'Horizon Chart',
          design: {
            bands: '3 positive, 3 negative from baseline',
            baseline: this.calculateBaseline(timeSeriesData, seriesColumns[0]),
            colorScheme: 'Blue (+) to red (-) through white',
            heightCompression: '3x compression saves 67% space'
          },
          benefits: [
            'See patterns at multiple scales',
            'Identify anomalies quickly',
            'Compare multiple series vertically'
          ],
          implementation: this.generateHorizonChartCode(timeSeriesData, characteristics)
        }
      });
    }
    
    // Decomposition plots
    const mainSeries = seriesColumns[0];
    if (characteristics.patterns[mainSeries]?.patterns.some(p => p.type === 'seasonal' || p.type === 'trend')) {
      visualizations.push({
        type: 'decomposition_plot',
        priority: 7,
        rationale: 'Separate trend, seasonal, and irregular components',
        specifications: {
          chart: 'Time Series Decomposition',
          method: characteristics.patterns[mainSeries].patterns.some(p => p.type === 'seasonal') ? 'STL' : 'Classical',
          components: [
            { name: 'Original', data: mainSeries },
            { name: 'Trend', method: 'Moving average or LOESS' },
            { name: 'Seasonal', period: this.getSeasonalPeriod(characteristics, mainSeries) },
            { name: 'Irregular', residuals: true }
          ],
          implementation: this.generateDecompositionCode(timeSeriesData, characteristics, mainSeries)
        }
      });
    }
    
    // Lag plots for autocorrelation
    if (characteristics.patterns[mainSeries]?.characteristics.autocorrelation > 0.3) {
      visualizations.push({
        type: 'lag_plot',
        priority: 6,
        rationale: 'Visualize autocorrelation structure',
        specifications: {
          chart: 'Lag Plot Matrix',
          lags: [1, 2, 3, 7, 30],
          design: {
            scatterplots: 'Value(t) vs Value(t-lag)',
            regressionLines: 'Show relationship strength',
            correlation: 'Display correlation coefficient'
          },
          interpretation: {
            linear: 'Strong autocorrelation',
            random: 'White noise',
            curved: 'Non-linear dependence'
          },
          implementation: this.generateLagPlotCode(timeSeriesData, characteristics)
        }
      });
    }
    
    return visualizations;
  }
  
  generateMultiSeriesViz(data, dateColumn, numericColumns, characteristics) {
    const visualizations = [];
    
    if (numericColumns.length < 2) return visualizations;
    
    // Multiple line chart
    visualizations.push({
      type: 'multiple_line_chart',
      priority: 8,
      rationale: `Compare ${numericColumns.length} time series simultaneously`,
      specifications: {
        chart: 'Multi-Series Line Chart',
        design: {
          normalization: 'Individual or common scale',
          colorScheme: 'Distinct colors for each series',
          lineStyles: numericColumns.length > 6 ? 'Vary line styles' : 'Solid lines',
          legend: 'Interactive legend with toggle'
        },
        scalingOptions: [
          { name: 'Raw values', pros: 'Actual magnitudes', cons: 'Different scales obscure patterns' },
          { name: 'Normalized', pros: 'Comparable patterns', cons: 'Loses magnitude information' },
          { name: 'Indexed', pros: 'Relative changes', cons: 'Arbitrary baseline' }
        ],
        implementation: this.generateMultiLineChartCode(data, dateColumn, numericColumns)
      }
    });
    
    // Small multiples
    if (numericColumns.length <= 8) {
      visualizations.push({
        type: 'small_multiples',
        priority: 7,
        rationale: 'Clear comparison without visual interference',
        specifications: {
          chart: 'Small Multiples (Faceted Time Series)',
          layout: this.calculateOptimalFacetLayout(numericColumns.length),
          design: {
            commonXAxis: 'Aligned time axis',
            commonYAxis: 'Optional common scale',
            aspect: 'Wide aspect ratio for time series',
            spacing: 'Minimal gaps for comparison'
          },
          benefits: [
            'No line overlap',
            'Individual scaling possible',
            'Pattern comparison easy'
          ],
          implementation: this.generateSmallMultiplesCode(data, dateColumn, numericColumns)
        }
      });
    }
    
    // Stream graph for cumulative data
    const cumulative = this.checkCumulativeNature(data, numericColumns);
    if (cumulative.suitable) {
      visualizations.push({
        type: 'stream_graph',
        priority: 6,
        rationale: 'Show flow and proportion changes over time',
        specifications: {
          chart: 'Stream Graph (Stacked Area)',
          design: {
            stacking: 'Symmetric around baseline',
            interpolation: 'Smooth curves',
            colorScheme: 'Qualitative palette',
            interaction: 'Hover for exact values'
          },
          suitability: cumulative,
          limitations: [
            'Individual series harder to read',
            'Baseline changes affect perception',
            'Not suitable for negative values'
          ],
          implementation: this.generateStreamGraphCode(data, dateColumn, numericColumns)
        }
      });
    }
    
    return visualizations;
  }
  
  generateInteractiveTimeSeriesViz(timeSeriesData, characteristics) {
    const visualizations = [];
    
    // Brush and zoom
    visualizations.push({
      type: 'brush_zoom_timeseries',
      priority: 9,
      rationale: 'Essential for exploring temporal patterns at different scales',
      specifications: {
        chart: 'Interactive Time Series with Brush & Zoom',
        features: {
          overview: 'Full time range with brush selector',
          detail: 'Zoomed view with full interactivity',
          brushing: 'Linked brushing across multiple series',
          tooltips: 'Hover for exact values and context'
        },
        interactions: [
          'Brush to select time range',
          'Zoom with mouse wheel',
          'Pan with click and drag',
          'Reset zoom with double-click'
        ],
        implementation: this.generateBrushZoomCode(timeSeriesData, characteristics)
      }
    });
    
    // Crossfilter dashboard
    if (Object.keys(timeSeriesData[0]).length > 2) { // More than just date + one series
      visualizations.push({
        type: 'crossfilter_dashboard',
        priority: 7,
        rationale: 'Interactive exploration of multiple time series dimensions',
        specifications: {
          chart: 'Multi-Dimensional Time Series Dashboard',
          components: [
            'Timeline brush for date filtering',
            'Histogram filters for value ranges',
            'Category selectors if applicable',
            'Linked visualizations'
          ],
          features: {
            realTimeFiltering: 'Instant updates across views',
            resetFilters: 'Clear all filters button',
            filterIndicators: 'Show active filter count'
          },
          implementation: this.generateCrossfilterCode(timeSeriesData, characteristics)
        }
      });
    }
    
    return visualizations;
  }
  
  // Helper methods for generating code
  generateTimeSeriesEnhancements(characteristics) {
    const enhancements = [];
    
    if (characteristics.gaps.length > 0) {
      enhancements.push({
        type: 'gap_indicators',
        description: 'Mark data gaps with distinct styling'
      });
    }
    
    const patterns = Object.values(characteristics.patterns)[0]?.patterns || [];
    
    if (patterns.some(p => p.type === 'trend')) {
      enhancements.push({
        type: 'trend_line',
        description: 'Add trend line with confidence interval'
      });
    }
    
    if (patterns.some(p => p.type === 'seasonal')) {
      enhancements.push({
        type: 'seasonal_overlay',
        description: 'Highlight seasonal patterns'
      });
    }
    
    if (patterns.some(p => p.type === 'outlier')) {
      enhancements.push({
        type: 'outlier_markers',
        description: 'Mark outliers with special symbols'
      });
    }
    
    return enhancements;
  }
  
  getSeasonalComponent(characteristics) {
    const patterns = Object.values(characteristics.patterns)[0]?.patterns || [];
    const seasonal = patterns.find(p => p.type === 'seasonal');
    
    switch(seasonal?.type_detail) {
      case 'weekly': return 'Day of week';
      case 'monthly': return 'Day of month';
      case 'yearly': return 'Month of year';
      default: return 'Seasonal component';
    }
  }
  
  calculateBaseline(timeSeriesData, column) {
    const values = timeSeriesData.map(d => d[column]).filter(v => typeof v === 'number');
    const mean = values.reduce((a, b) => a + b) / values.length;
    
    // Use moving average as baseline
    const windowSize = Math.min(30, Math.floor(values.length / 10));
    return {
      type: 'moving_average',
      window: windowSize,
      value: mean
    };
  }
  
  getSeasonalPeriod(characteristics, seriesColumn) {
    const patterns = characteristics.patterns[seriesColumn]?.patterns || [];
    const seasonal = patterns.find(p => p.type === 'seasonal');
    return seasonal?.period || 12;
  }
  
  calculateOptimalFacetLayout(numSeries) {
    if (numSeries <= 2) return { rows: 1, cols: 2 };
    if (numSeries <= 4) return { rows: 2, cols: 2 };
    if (numSeries <= 6) return { rows: 2, cols: 3 };
    return { rows: 3, cols: 3 };
  }
  
  checkCumulativeNature(data, numericColumns) {
    // Check if series represent parts of a whole
    const sampleSize = Math.min(100, data.length);
    const sample = data.slice(0, sampleSize);
    
    let allPositive = true;
    let sumsConsistent = true;
    
    sample.forEach(row => {
      let sum = 0;
      numericColumns.forEach(col => {
        const value = row[col];
        if (typeof value === 'number') {
          if (value < 0) allPositive = false;
          sum += value;
        }
      });
      
      // Check if sums are relatively consistent (parts of whole)
      if (sum < 0.5 || sum > 2.0) sumsConsistent = false;
    });
    
    return {
      suitable: allPositive && numericColumns.length >= 3,
      allPositive,
      partsOfWhole: sumsConsistent,
      recommendation: allPositive ? 'Suitable for stream graph' : 'Consider other visualization'
    };
  }
  
  // Code generation methods
  generateLineChartCode(timeSeriesData, characteristics) {
    const seriesColumn = Object.keys(timeSeriesData[0]).filter(k => k !== 'date')[0];
    
    return `# D3.js Time Series Line Chart
const margin = {top: 20, right: 30, bottom: 40, left: 50};
const width = 800 - margin.left - margin.right;
const height = 400 - margin.top - margin.bottom;

const svg = d3.select("#chart")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", \`translate(\${margin.left},\${margin.top})\`);

// Parse time
const parseTime = d3.timeParse("%Y-%m-%d");
data.forEach(d => {
  d.date = parseTime(d.date);
  d.${seriesColumn} = +d.${seriesColumn};
});

// Scales
const xScale = d3.scaleTime()
  .domain(d3.extent(data, d => d.date))
  .range([0, width]);

const yScale = d3.scaleLinear()
  .domain(d3.extent(data, d => d.${seriesColumn}))
  .range([height, 0]);

// Line generator
const line = d3.line()
  .x(d => xScale(d.date))
  .y(d => yScale(d.${seriesColumn}))
  ${characteristics.length > 1000 ? '.curve(d3.curveLinear)' : '.curve(d3.curveMonotoneX)'};

// Add the line
svg.append("path")
  .datum(data)
  .attr("fill", "none")
  .attr("stroke", "steelblue")
  .attr("stroke-width", ${characteristics.length > 1000 ? 1 : 2})
  .attr("d", line);

// Add axes
svg.append("g")
  .attr("transform", \`translate(0,\${height})\`)
  .call(d3.axisBottom(xScale));

svg.append("g")
  .call(d3.axisLeft(yScale));

// Add brushing for interaction
const brush = d3.brushX()
  .extent([[0, 0], [width, height]])
  .on("end", brushed);

svg.append("g")
  .attr("class", "brush")
  .call(brush);

function brushed(event) {
  if (!event.selection) return;
  const [x0, x1] = event.selection.map(xScale.invert);
  // Update visualization based on selection
}

# Python/Plotly implementation
import plotly.graph_objects as go
import plotly.express as px

fig = go.Figure()

fig.add_trace(go.Scatter(
    x=df['date'],
    y=df['${seriesColumn}'],
    mode='lines${characteristics.length <= 100 ? '+markers' : ''}',
    name='${seriesColumn}',
    line=dict(width=${characteristics.length > 1000 ? 1 : 2})
))

fig.update_layout(
    title='Time Series: ${seriesColumn}',
    xaxis_title='Date',
    yaxis_title='${seriesColumn}',
    hovermode='x unified'
)

# Add range selector
fig.update_layout(
    xaxis=dict(
        rangeselector=dict(
            buttons=list([
                dict(count=1, label="1m", step="month", stepmode="backward"),
                dict(count=6, label="6m", step="month", stepmode="backward"),
                dict(count=1, label="1y", step="year", stepmode="backward"),
                dict(step="all")
            ])
        ),
        rangeslider=dict(visible=True),
        type="date"
    )
)

fig.show()`;
  }
  
  generateConnectedScatterCode(timeSeriesData, characteristics) {
    return `# Connected Scatterplot for Cyclical Patterns
import matplotlib.pyplot as plt
import numpy as np

# Extract seasonal component (simplified)
df['day_of_year'] = df['date'].dt.dayofyear
df['detrended'] = signal.detrend(df['${Object.keys(timeSeriesData[0]).filter(k => k !== 'date')[0]}'])

fig, ax = plt.subplots(figsize=(10, 8))

# Create color map for time progression
colors = plt.cm.viridis(np.linspace(0, 1, len(df)))

# Plot connected scatter
for i in range(len(df) - 1):
    ax.plot([df.iloc[i]['day_of_year'], df.iloc[i+1]['day_of_year']], 
           [df.iloc[i]['detrended'], df.iloc[i+1]['detrended']], 
           color=colors[i], alpha=0.6, linewidth=0.8)

ax.scatter(df['day_of_year'], df['detrended'], c=colors, s=20, alpha=0.7)

ax.set_xlabel('Day of Year')
ax.set_ylabel('Detrended Values')
ax.set_title('Connected Scatterplot: Seasonal Cycles')
ax.grid(True, alpha=0.3)

# Add colorbar for time
sm = plt.cm.ScalarMappable(cmap=plt.cm.viridis)
sm.set_array([])
cbar = plt.colorbar(sm)
cbar.set_label('Time Progression')

plt.show()`;
  }
  
  generateCalendarHeatmapCode(timeSeriesData, characteristics) {
    return `# Calendar Heatmap
import matplotlib.pyplot as plt
import pandas as pd
import numpy as np
import calmap

# Prepare daily data
df_daily = df.set_index('date').resample('D').mean()

# Create calendar heatmap
fig, ax = plt.subplots(figsize=(16, 10))
calmap.calendarplot(df_daily['${Object.keys(timeSeriesData[0]).filter(k => k !== 'date')[0]}'], 
                   cmap='RdYlBu_r', 
                   fillcolor='lightgrey',
                   linewidth=0.5,
                   fig_kws={'figsize': (16, 10)})

plt.suptitle('Calendar Heatmap: Daily Patterns', fontsize=16)
plt.show()

# D3.js Calendar Heatmap
const width = 960;
const height = 136;
const cellSize = 17;

const year = new Date().getFullYear();
const formatPercent = d3.format(".1%");
const format = d3.timeFormat("%Y-%m-%d");
const timeWeek = d3.timeWeek;
const countDay = d => d.getDay();
const timeDay = d3.timeDay;

const color = d3.scaleSequential(d3.interpolateRdYlBu)
  .domain(d3.extent(data, d => d.value));

const svg = d3.select("#calendar")
  .selectAll("svg")
  .data([year])
  .enter().append("svg")
  .attr("width", width)
  .attr("height", height)
  .append("g")
  .attr("transform", \`translate(\${(width - cellSize * 53) / 2},\${height - cellSize * 7 - 1})\`);

const rect = svg.selectAll(".day")
  .data(d => timeDay.range(new Date(d, 0, 1), new Date(d + 1, 0, 1)))
  .enter().append("rect")
  .attr("class", "day")
  .attr("width", cellSize)
  .attr("height", cellSize)
  .attr("x", d => timeWeek.count(new Date(d.getFullYear(), 0, 1), d) * cellSize)
  .attr("y", d => countDay(d) * cellSize)
  .datum(format);

rect.filter(d => data.has(d))
  .attr("fill", d => color(data.get(d)))
  .append("title")
  .text(d => \`\${d}: \${data.get(d)}\`);`;
  }
  
  generateHorizonChartCode(timeSeriesData, characteristics) {
    const seriesColumn = Object.keys(timeSeriesData[0]).filter(k => k !== 'date')[0];
    
    return `# D3.js Horizon Chart
const bands = 4;
const height = 30;
const width = 800;

// Prepare data with baseline
const baseline = d3.mean(data, d => d.${seriesColumn});
const extent = d3.extent(data, d => d.${seriesColumn} - baseline);
const maxValue = Math.max(Math.abs(extent[0]), Math.abs(extent[1]));

const xScale = d3.scaleTime()
  .domain(d3.extent(data, d => d.date))
  .range([0, width]);

const yScale = d3.scaleLinear()
  .domain([0, maxValue])
  .range([0, height]);

const area = d3.area()
  .x(d => xScale(d.date))
  .y0(height)
  .y1(d => {
    const value = Math.abs(d.${seriesColumn} - baseline);
    return height - yScale(Math.min(value, maxValue / bands));
  });

const svg = d3.select("#horizon")
  .append("svg")
  .attr("width", width)
  .attr("height", height * bands * 2);

// Positive bands
for (let i = 0; i < bands; i++) {
  const bandData = data.map(d => ({
    ...d,
    bandValue: Math.max(0, (d.${seriesColumn} - baseline) - (maxValue / bands) * i)
  }));
  
  svg.append("path")
    .datum(bandData)
    .attr("d", area)
    .attr("fill", d3.interpolateBlues((i + 1) / bands))
    .attr("transform", \`translate(0, \${i * height})\`);
}

// Negative bands
for (let i = 0; i < bands; i++) {
  const bandData = data.map(d => ({
    ...d,
    bandValue: Math.max(0, Math.abs(Math.min(0, d.${seriesColumn} - baseline)) - (maxValue / bands) * i)
  }));
  
  svg.append("path")
    .datum(bandData)
    .attr("d", area)
    .attr("fill", d3.interpolateReds((i + 1) / bands))
    .attr("transform", \`translate(0, \${(bands + i) * height}) scale(1, -1)\`);
}

# Python Horizon Chart
import matplotlib.pyplot as plt
import numpy as np

def horizon_chart(data, bands=4):
    baseline = data.mean()
    data_centered = data - baseline
    
    fig, axes = plt.subplots(bands * 2, 1, figsize=(12, bands))
    
    # Positive bands
    for i in range(bands):
        band_data = np.maximum(0, data_centered - (data_centered.max() / bands) * i)
        axes[i].fill_between(range(len(band_data)), 0, band_data, 
                           color=plt.cm.Blues((i + 1) / bands), alpha=0.8)
        axes[i].set_ylim(0, data_centered.max() / bands)
        axes[i].set_ylabel(f'Band {i+1}')
    
    # Negative bands  
    for i in range(bands):
        band_data = np.maximum(0, np.abs(np.minimum(0, data_centered)) - (np.abs(data_centered.min()) / bands) * i)
        axes[bands + i].fill_between(range(len(band_data)), 0, band_data, 
                                   color=plt.cm.Reds((i + 1) / bands), alpha=0.8)
        axes[bands + i].set_ylim(0, np.abs(data_centered.min()) / bands)
        axes[bands + i].set_ylabel(f'Band -{i+1}')
    
    plt.tight_layout()
    plt.show()

horizon_chart(df['${seriesColumn}'])`;
  }
  
  generateDecompositionCode(timeSeriesData, characteristics, seriesColumn) {
    return `# Time Series Decomposition
import matplotlib.pyplot as plt
from statsmodels.tsa.seasonal import seasonal_decompose

# Set date as index
df_ts = df.set_index('date')

# Perform decomposition
decomposition = seasonal_decompose(df_ts['${seriesColumn}'], 
                                 model='additive',  # or 'multiplicative'
                                 period=${this.getSeasonalPeriod(characteristics, seriesColumn)})

# Plot decomposition
fig, axes = plt.subplots(4, 1, figsize=(12, 10))

decomposition.observed.plot(ax=axes[0], title='Original Time Series')
decomposition.trend.plot(ax=axes[1], title='Trend Component')
decomposition.seasonal.plot(ax=axes[2], title='Seasonal Component')
decomposition.resid.plot(ax=axes[3], title='Residual Component')

plt.tight_layout()
plt.show()

# Print statistics
print(f"Seasonal strength: {1 - np.var(decomposition.resid.dropna()) / np.var(decomposition.observed.dropna()):.3f}")
print(f"Trend strength: {1 - np.var(decomposition.resid.dropna()) / np.var(decomposition.observed.dropna() - decomposition.seasonal.dropna()):.3f}")

# R implementation
library(forecast)
library(ggplot2)

ts_data <- ts(data$${seriesColumn}, frequency=${this.getSeasonalPeriod(characteristics, seriesColumn)})
decomp <- decompose(ts_data, type='additive')

# Plot
autoplot(decomp) + 
  ggtitle('Time Series Decomposition') +
  theme_minimal()

# STL decomposition (more robust)
stl_decomp <- stl(ts_data, s.window='periodic')
autoplot(stl_decomp)`;
  }
  
  generateLagPlotCode(timeSeriesData, characteristics) {
    const seriesColumn = Object.keys(timeSeriesData[0]).filter(k => k !== 'date')[0];
    
    return `# Lag Plot Analysis
import matplotlib.pyplot as plt
import pandas as pd
import numpy as np

def lag_plot(data, lags=[1, 2, 3, 7, 30]):
    n_lags = len(lags)
    fig, axes = plt.subplots(1, n_lags, figsize=(4*n_lags, 4))
    if n_lags == 1:
        axes = [axes]
    
    for i, lag in enumerate(lags):
        # Create lagged data
        lagged_data = pd.DataFrame({
            'value': data['${seriesColumn}'][lag:],
            'lagged': data['${seriesColumn}'][:-lag]
        })
        
        # Scatter plot
        axes[i].scatter(lagged_data['lagged'], lagged_data['value'], 
                       alpha=0.6, s=20)
        
        # Calculate correlation
        correlation = lagged_data['value'].corr(lagged_data['lagged'])
        
        # Add regression line
        z = np.polyfit(lagged_data['lagged'], lagged_data['value'], 1)
        p = np.poly1d(z)
        axes[i].plot(lagged_data['lagged'], p(lagged_data['lagged']), 
                    "r--", alpha=0.8)
        
        axes[i].set_xlabel(f'Value(t-{lag})')
        axes[i].set_ylabel(f'Value(t)')
        axes[i].set_title(f'Lag {lag}\\nr = {correlation:.3f}')
        axes[i].grid(True, alpha=0.3)
    
    plt.tight_layout()
    plt.show()

lag_plot(df)

# Autocorrelation function plot
from statsmodels.graphics.tsaplots import plot_acf, plot_pacf

fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(12, 8))

plot_acf(df['${seriesColumn}'], lags=40, ax=ax1, alpha=0.05)
ax1.set_title('Autocorrelation Function')

plot_pacf(df['${seriesColumn}'], lags=40, ax=ax2, alpha=0.05)
ax2.set_title('Partial Autocorrelation Function')

plt.tight_layout()
plt.show()`;
  }
  
  generateMultiLineChartCode(data, dateColumn, numericColumns) {
    return `# Multi-Series Time Series Chart
import plotly.graph_objects as go
from plotly.subplots import make_subplots

fig = go.Figure()

colors = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', 
          '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf']

for i, column in enumerate(${JSON.stringify(numericColumns)}):
    fig.add_trace(go.Scatter(
        x=df['${dateColumn}'],
        y=df[column],
        mode='lines',
        name=column,
        line=dict(color=colors[i % len(colors)], width=2),
        hovertemplate=f'{column}: %{{y}}<br>Date: %{{x}}<extra></extra>'
    ))

fig.update_layout(
    title='Multiple Time Series Comparison',
    xaxis_title='Date',
    yaxis_title='Values',
    hovermode='x unified',
    legend=dict(
        yanchor="top",
        y=0.99,
        xanchor="left",
        x=1.01
    )
)

# Add range selector
fig.update_layout(
    xaxis=dict(
        rangeselector=dict(
            buttons=list([
                dict(count=1, label="1M", step="month", stepmode="backward"),
                dict(count=6, label="6M", step="month", stepmode="backward"),
                dict(count=1, label="1Y", step="year", stepmode="backward"),
                dict(step="all")
            ])
        ),
        rangeslider=dict(visible=True),
        type="date"
    )
)

fig.show()

# Normalized version for pattern comparison
fig_norm = go.Figure()

for i, column in enumerate(${JSON.stringify(numericColumns)}):
    # Normalize to 0-1 scale
    normalized = (df[column] - df[column].min()) / (df[column].max() - df[column].min())
    
    fig_norm.add_trace(go.Scatter(
        x=df['${dateColumn}'],
        y=normalized,
        mode='lines',
        name=f'{column} (normalized)',
        line=dict(color=colors[i % len(colors)], width=2)
    ))

fig_norm.update_layout(
    title='Normalized Time Series (Pattern Comparison)',
    xaxis_title='Date',
    yaxis_title='Normalized Values (0-1)',
    yaxis=dict(range=[0, 1])
)

fig_norm.show()`;
  }
  
  generateSmallMultiplesCode(data, dateColumn, numericColumns) {
    return `# Small Multiples Time Series
from plotly.subplots import make_subplots
import plotly.graph_objects as go
import math

# Calculate layout
n_series = len(${JSON.stringify(numericColumns)})
cols = min(3, n_series)
rows = math.ceil(n_series / cols)

fig = make_subplots(
    rows=rows, 
    cols=cols,
    subplot_titles=${JSON.stringify(numericColumns)},
    shared_xaxes=True,
    vertical_spacing=0.08
)

for i, column in enumerate(${JSON.stringify(numericColumns)}):
    row = i // cols + 1
    col = i % cols + 1
    
    fig.add_trace(
        go.Scatter(
            x=df['${dateColumn}'],
            y=df[column],
            mode='lines',
            name=column,
            line=dict(width=2),
            showlegend=False
        ),
        row=row, col=col
    )

fig.update_layout(
    height=300 * rows,
    title_text="Small Multiples: Individual Time Series",
    showlegend=False
)

# Update x-axis for all subplots
fig.update_xaxes(title_text="Date", row=rows)

fig.show()

# matplotlib version
import matplotlib.pyplot as plt

fig, axes = plt.subplots(rows, cols, figsize=(5*cols, 3*rows), 
                        sharex=True, sharey=False)

if rows == 1:
    axes = axes.reshape(1, -1)
if cols == 1:
    axes = axes.reshape(-1, 1)

for i, column in enumerate(${JSON.stringify(numericColumns)}):
    row = i // cols
    col = i % cols
    
    axes[row, col].plot(df['${dateColumn}'], df[column], linewidth=2)
    axes[row, col].set_title(column)
    axes[row, col].grid(True, alpha=0.3)
    
    if row == rows - 1:  # Bottom row
        axes[row, col].set_xlabel('Date')

# Hide empty subplots
for i in range(n_series, rows * cols):
    row = i // cols
    col = i % cols
    axes[row, col].set_visible(False)

plt.tight_layout()
plt.show()`;
  }
  
  generateStreamGraphCode(data, dateColumn, numericColumns) {
    return `# Stream Graph (Stacked Area)
import matplotlib.pyplot as plt
import numpy as np

# Prepare data for stacking
dates = df['${dateColumn}']
series_data = [df[col].values for col in ${JSON.stringify(numericColumns)}]

# Create stack
fig, ax = plt.subplots(figsize=(12, 8))

# Use symmetric baseline (stream graph style)
y_baseline = np.zeros(len(dates))
y_stack = []

# Calculate symmetric stacking
total_values = np.sum(series_data, axis=0)
cumulative = np.zeros(len(dates))

for i, series in enumerate(series_data):
    y_stack.append(cumulative + series/2)
    cumulative += series

# Adjust for symmetric layout
adjustment = total_values / 2
for i in range(len(y_stack)):
    y_stack[i] -= adjustment

# Plot areas
colors = plt.cm.Set3(np.linspace(0, 1, len(${JSON.stringify(numericColumns)})))

for i, (series, color) in enumerate(zip(series_data, colors)):
    if i == 0:
        ax.fill_between(dates, y_stack[i] - series/2, y_stack[i] + series/2,
                       alpha=0.8, color=color, label=${JSON.stringify(numericColumns)}[i])
    else:
        prev_top = y_stack[i-1] + np.array(series_data[i-1])/2
        curr_bottom = y_stack[i] - series/2
        curr_top = y_stack[i] + series/2
        
        ax.fill_between(dates, curr_bottom, curr_top,
                       alpha=0.8, color=color, label=${JSON.stringify(numericColumns)}[i])

ax.set_xlabel('Date')
ax.set_ylabel('Values')
ax.set_title('Stream Graph: Flow Over Time')
ax.legend(bbox_to_anchor=(1.05, 1), loc='upper left')
ax.grid(True, alpha=0.3)

plt.tight_layout()
plt.show()

# D3.js Stream Graph
const stack = d3.stack()
  .keys(${JSON.stringify(numericColumns)})
  .offset(d3.stackOffsetSilhouette)  // Symmetric baseline
  .order(d3.stackOrderInsideOut);

const series = stack(data);

const xScale = d3.scaleTime()
  .domain(d3.extent(data, d => d.date))
  .range([0, width]);

const yScale = d3.scaleLinear()
  .domain(d3.extent(series.flat(2)))
  .range([height, 0]);

const area = d3.area()
  .x(d => xScale(d.data.date))
  .y0(d => yScale(d[0]))
  .y1(d => yScale(d[1]))
  .curve(d3.curveBasis);

const color = d3.scaleOrdinal()
  .domain(${JSON.stringify(numericColumns)})
  .range(d3.schemeSet3);

svg.selectAll("path")
  .data(series)
  .enter().append("path")
  .attr("d", area)
  .attr("fill", d => color(d.key))
  .attr("opacity", 0.8);`;
  }
  
  generateBrushZoomCode(timeSeriesData, characteristics) {
    return `# Interactive Brush & Zoom Time Series
import plotly.graph_objects as go
from plotly.subplots import make_subplots

# Create subplots: overview + detail
fig = make_subplots(
    rows=2, cols=1,
    shared_xaxes=True,
    row_heights=[0.7, 0.3],
    subplot_titles=['Detail View', 'Overview (Brush to Zoom)']
)

series_column = '${Object.keys(timeSeriesData[0]).filter(k => k !== 'date')[0]}'

# Detail view (top)
fig.add_trace(
    go.Scatter(
        x=df['date'],
        y=df[series_column],
        mode='lines',
        name=series_column,
        line=dict(width=2)
    ),
    row=1, col=1
)

# Overview (bottom) 
fig.add_trace(
    go.Scatter(
        x=df['date'],
        y=df[series_column],
        mode='lines',
        name=f'{series_column} (overview)',
        line=dict(width=1, color='gray'),
        showlegend=False
    ),
    row=2, col=1
)

fig.update_layout(
    height=600,
    title_text="Interactive Time Series with Brush & Zoom",
    
    # Add range selector to bottom plot
    xaxis2=dict(
        title="Date",
        rangeslider=dict(
            visible=True,
            thickness=0.1
        ),
        type="date"
    ),
    
    # Top plot follows bottom plot selection
    xaxis=dict(title="Date (Zoomed)"),
    yaxis=dict(title=series_column)
)

fig.show()

# D3.js Brush & Zoom implementation
const margin = {top: 20, right: 30, bottom: 100, left: 50};
const margin2 = {top: 430, right: 30, bottom: 20, left: 50};
const width = 800 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;
const height2 = 500 - margin2.top - margin2.bottom;

const svg = d3.select("#chart")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom);

// Clip path for main chart
svg.append("defs").append("clipPath")
  .attr("id", "clip")
  .append("rect")
  .attr("width", width)
  .attr("height", height);

// Main chart area
const focus = svg.append("g")
  .attr("transform", \`translate(\${margin.left},\${margin.top})\`);

// Overview chart area  
const context = svg.append("g")
  .attr("transform", \`translate(\${margin2.left},\${margin2.top})\`);

// Scales
const xScale = d3.scaleTime().range([0, width]);
const yScale = d3.scaleLinear().range([height, 0]);
const xScale2 = d3.scaleTime().range([0, width]);
const yScale2 = d3.scaleLinear().range([height2, 0]);

// Line generators
const line = d3.line()
  .x(d => xScale(d.date))
  .y(d => yScale(d.${series_column}));

const line2 = d3.line()
  .x(d => xScale2(d.date))
  .y(d => yScale2(d.${series_column}));

// Set domains
xScale.domain(d3.extent(data, d => d.date));
yScale.domain(d3.extent(data, d => d.${series_column}));
xScale2.domain(xScale.domain());
yScale2.domain(yScale.domain());

// Add the main line
focus.append("path")
  .datum(data)
  .attr("class", "line")
  .attr("clip-path", "url(#clip)")
  .attr("d", line);

// Add the overview line
context.append("path")
  .datum(data)
  .attr("class", "line")
  .attr("d", line2);

// Add brush
const brush = d3.brushX()
  .extent([[0, 0], [width, height2]])
  .on("brush end", brushed);

context.append("g")
  .attr("class", "brush")
  .call(brush)
  .call(brush.move, xScale.range());

// Add zoom
const zoom = d3.zoom()
  .scaleExtent([1, Infinity])
  .translateExtent([[0, 0], [width, height]])
  .extent([[0, 0], [width, height]])
  .on("zoom", zoomed);

focus.append("rect")
  .attr("class", "zoom")
  .attr("width", width)
  .attr("height", height)
  .attr("fill", "none")
  .attr("pointer-events", "all")
  .call(zoom);

function brushed(event) {
  if (event.selection) {
    const s = event.selection;
    xScale.domain(s.map(xScale2.invert, xScale2));
    focus.select(".line").attr("d", line);
    focus.select(".x.axis").call(d3.axisBottom(xScale));
  }
}

function zoomed(event) {
  if (event.sourceEvent && event.sourceEvent.type === "brush") return;
  const t = event.transform;
  xScale.domain(t.rescaleX(xScale2).domain());
  focus.select(".line").attr("d", line);
  focus.select(".x.axis").call(d3.axisBottom(xScale));
  context.select(".brush").call(brush.move, xScale.range().map(t.invertX, t));
}`;
  }
  
  generateCrossfilterCode(timeSeriesData, characteristics) {
    return `# Crossfilter Dashboard for Time Series
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import plotly.express as px

# Create dashboard with multiple linked views
series_columns = ${JSON.stringify(Object.keys(timeSeriesData[0]).filter(k => k !== 'date'))}

fig = make_subplots(
    rows=2, cols=2,
    subplot_titles=['Time Series', 'Distribution', 'Correlation', 'Summary Stats'],
    specs=[[{"secondary_y": True}, {"type": "histogram"}],
           [{"type": "scatter"}, {"type": "table"}]]
)

# Main time series (top left)
for i, col in enumerate(series_columns[:2]):  # Limit to 2 series for clarity
    fig.add_trace(
        go.Scatter(
            x=df['date'],
            y=df[col],
            mode='lines',
            name=col,
            yaxis='y' if i == 0 else 'y2'
        ),
        row=1, col=1, secondary_y=(i==1)
    )

# Distribution histogram (top right)
fig.add_trace(
    go.Histogram(
        x=df[series_columns[0]],
        name=f'{series_columns[0]} distribution',
        showlegend=False
    ),
    row=1, col=2
)

# Correlation scatter (bottom left)
if len(series_columns) >= 2:
    fig.add_trace(
        go.Scatter(
            x=df[series_columns[0]],
            y=df[series_columns[1]],
            mode='markers',
            name=f'{series_columns[0]} vs {series_columns[1]}',
            showlegend=False
        ),
        row=2, col=1
    )

# Summary statistics table (bottom right)
stats_data = []
for col in series_columns:
    stats_data.append([
        col,
        f"{df[col].mean():.2f}",
        f"{df[col].std():.2f}",
        f"{df[col].min():.2f}",
        f"{df[col].max():.2f}"
    ])

fig.add_trace(
    go.Table(
        header=dict(values=['Series', 'Mean', 'Std', 'Min', 'Max']),
        cells=dict(values=list(zip(*stats_data)))
    ),
    row=2, col=2
)

fig.update_layout(
    height=800,
    title_text="Time Series Dashboard with Linked Views",
    showlegend=True
)

# Add range slider to main time series
fig.update_layout(
    xaxis=dict(
        rangeslider=dict(visible=True),
        type="date"
    )
)

fig.show()

# JavaScript Crossfilter implementation
const cf = crossfilter(data);

// Create dimensions
const dateDim = cf.dimension(d => d.date);
const valueDim = cf.dimension(d => d.${series_columns[0]});

// Create groups
const dateGroup = dateDim.group(d3.timeMonth);
const valueGroup = valueDim.group(d => Math.floor(d / 10) * 10);

// Create charts
const timeChart = dc.lineChart("#time-chart")
  .dimension(dateDim)
  .group(dateGroup)
  .x(d3.scaleTime().domain(d3.extent(data, d => d.date)))
  .elasticY(true)
  .brushOn(true);

const valueChart = dc.barChart("#value-chart")
  .dimension(valueDim)
  .group(valueGroup)
  .x(d3.scaleLinear().domain(d3.extent(data, d => d.${series_columns[0]})))
  .elasticY(true);

// Render all charts
dc.renderAll();`;
  }
}