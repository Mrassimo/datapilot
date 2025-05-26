export class AntipatternDetector {
  detectAntipatterns(visualizationPlan, dataProfile, task) {
    const warnings = [];
    
    // Check each proposed visualization
    visualizationPlan.forEach(viz => {
      const chartWarnings = this.checkChartAntipatterns(viz, dataProfile, task);
      const dataWarnings = this.checkDataAntipatterns(viz, dataProfile);
      const designWarnings = this.checkDesignAntipatterns(viz);
      const perceptualWarnings = this.checkPerceptualAntipatterns(viz, dataProfile);
      
      warnings.push(...chartWarnings, ...dataWarnings, ...designWarnings, ...perceptualWarnings);
    });
    
    // Remove duplicates and sort by severity
    const uniqueWarnings = this.deduplicateWarnings(warnings);
    return this.prioritizeWarnings(uniqueWarnings);
  }
  
  checkChartAntipatterns(viz, dataProfile, task) {
    const warnings = [];
    
    // Skip if viz is not properly defined
    if (!viz || !viz.type) {
      return warnings;
    }
    
    // Pie chart overuse
    if (viz.type === 'pie' || viz.type === 'donut') {
      const categories = viz.categories || 
        (viz.categoryColumn && dataProfile.cardinality[viz.categoryColumn]?.unique) || 0;
      
      if (categories > 7) {
        warnings.push({
          type: 'pie_chart_overuse',
          severity: 'high',
          chart: viz.type,
          issue: `${categories} categories in ${viz.type} chart`,
          problem: 'More than 7 slices become unreadable',
          impact: '40% perception error rate for small slices',
          alternative: 'horizontal bar chart',
          benefit: '5% error rate (8× better accuracy)',
          fix: {
            type: 'bar',
            orientation: 'horizontal',
            sort: 'descending'
          }
        });
      }
      
      if (categories === 2) {
        warnings.push({
          type: 'pie_for_binary',
          severity: 'medium',
          chart: viz.type,
          issue: 'Using pie chart for only 2 categories',
          problem: 'Inefficient use of space',
          alternative: 'single stacked bar or text percentage',
          benefit: 'Clearer and more compact'
        });
      }
    }
    
    // 3D effects
    if (viz.effects3d || viz.type.includes('3d')) {
      warnings.push({
        type: '3d_effects',
        severity: 'high',
        chart: viz.type,
        issue: '3D effects detected',
        problem: 'Distorts data encoding and perception',
        impact: '45% error rate in depth perception',
        alternative: 'Strong 2D design with proper visual hierarchy',
        designPrinciples: [
          'Use whitespace for separation',
          'Bold colors for emphasis',
          'Clear typography hierarchy'
        ]
      });
    }
    
    // Dual Y-axis
    if (viz.dualAxis || viz.secondaryAxis) {
      warnings.push({
        type: 'dual_y_axis',
        severity: 'high',
        chart: viz.type,
        issue: 'Dual Y-axis configuration',
        problem: 'Implies false correlations',
        impact: '68% of viewers misinterpret relationship',
        alternative: 'Small multiples or indexed values',
        benefit: 'Clear, unambiguous comparison'
      });
    }
    
    // Inappropriate chart for task
    if (!this.isChartAppropriateForTask(viz.type, task.type)) {
      warnings.push({
        type: 'task_mismatch',
        severity: 'medium',
        chart: viz.type,
        task: task.type,
        issue: `${viz.type} chart not optimal for ${task.type}`,
        problem: 'Visualization does not support analytical task',
        alternative: this.getOptimalChartForTask(task.type),
        benefit: 'Better task-visualization alignment'
      });
    }
    
    return warnings;
  }
  
  checkDataAntipatterns(viz, dataProfile) {
    const warnings = [];
    const dataPoints = dataProfile.dimensions.rows;
    
    // Overplotting
    if (viz.type === 'scatter' || viz.type === 'bubble') {
      const area = (viz.width || 800) * (viz.height || 600);
      const pointsPerPixel = dataPoints / area;
      
      if (pointsPerPixel > 0.1) {
        warnings.push({
          type: 'overplotting',
          severity: 'high',
          chart: viz.type,
          issue: `${Math.round(pointsPerPixel * 100)} points per 100 pixels`,
          problem: 'Overplotting hides patterns and distributions',
          impact: 'Up to 90% of data points may be hidden',
          solutions: [
            {
              method: 'hexbin',
              benefit: 'Aggregates points into hexagonal bins',
              suitable: dataPoints < 1000000
            },
            {
              method: 'density_contours',
              benefit: 'Shows density without individual points',
              suitable: true
            },
            {
              method: 'sampling',
              benefit: 'Reduces points while maintaining distribution',
              suitable: dataPoints > 100000
            },
            {
              method: 'transparency',
              benefit: 'Reveals density through overlapping',
              suitable: dataPoints < 10000
            }
          ]
        });
      }
    }
    
    // Too many categories
    if (viz.type === 'bar' || viz.type === 'column') {
      const categories = viz.categories || 
        (viz.categoryColumn && dataProfile.cardinality[viz.categoryColumn]?.unique) || 0;
      
      if (categories > 50) {
        warnings.push({
          type: 'too_many_categories',
          severity: 'medium',
          chart: viz.type,
          issue: `${categories} categories in bar chart`,
          problem: 'Too many bars to compare effectively',
          solutions: [
            'Show top 20 with "Others" category',
            'Use hierarchical grouping',
            'Implement search/filter functionality',
            'Consider treemap for part-to-whole'
          ]
        });
      }
    }
    
    // Inappropriate aggregation
    if (viz.aggregation === 'mean' && dataProfile.patterns?.numeric) {
      const numericPatterns = Object.values(dataProfile.patterns.numeric);
      const skewedColumns = numericPatterns.filter(p => 
        Math.abs(p.distribution?.skewness || 0) > 1
      );
      
      if (skewedColumns.length > 0) {
        warnings.push({
          type: 'mean_with_skewed_data',
          severity: 'medium',
          issue: 'Using mean with skewed distributions',
          problem: 'Mean not representative of typical values',
          impact: 'Misleading central tendency',
          alternative: 'Use median for skewed data',
          affectedColumns: skewedColumns.map(p => p.column)
        });
      }
    }
    
    return warnings;
  }
  
  checkDesignAntipatterns(viz) {
    const warnings = [];
    
    // Rainbow color scale
    if (viz.colorScale === 'rainbow' || viz.colors?.length > 7) {
      warnings.push({
        type: 'rainbow_color_scale',
        severity: 'high',
        issue: 'Rainbow or too many colors',
        problem: 'Non-uniform perception and no logical order',
        impact: [
          'Yellow appears artificially brighter',
          'No intuitive ordering',
          'Accessibility issues'
        ],
        alternative: 'Single-hue gradient or ColorBrewer palette',
        recommendations: {
          sequential: 'Blues, Greens, or Viridis',
          diverging: 'RdBu or BrBG (diverging from center)',
          qualitative: 'Set2 or Set3 (distinct categories)'
        }
      });
    }
    
    // Chartjunk
    if (viz.gridlines?.heavy || viz.borders?.decorative || viz.backgrounds?.gradient) {
      warnings.push({
        type: 'chartjunk',
        severity: 'medium',
        issue: 'Excessive non-data ink',
        problem: 'Distracts from data',
        dataInkRatio: this.estimateDataInkRatio(viz),
        target: 'Data-ink ratio should exceed 0.5',
        fixes: [
          'Remove heavy gridlines',
          'Eliminate decorative borders',
          'Use solid backgrounds',
          'Remove unnecessary legends'
        ]
      });
    }
    
    // Truncated axes
    if (viz.yAxis?.min > 0 && viz.type !== 'scatter') {
      warnings.push({
        type: 'truncated_axis',
        severity: 'high',
        issue: 'Y-axis does not start at zero',
        problem: 'Exaggerates differences',
        lieFactor: this.calculateLieFactor(viz),
        impact: 'Visual representation distorts actual proportions',
        exceptions: [
          'Scatter plots where zero is not meaningful',
          'Time series with small variations',
          'Log scales where appropriate'
        ]
      });
    }
    
    // Aspect ratio issues
    if (viz.type === 'line' && viz.aspectRatio) {
      const ratio = viz.width / viz.height;
      if (ratio < 0.5 || ratio > 3) {
        warnings.push({
          type: 'poor_aspect_ratio',
          severity: 'low',
          issue: 'Suboptimal aspect ratio for line chart',
          problem: 'Distorts perception of trends',
          recommendation: 'Banking to 45° for optimal slope perception',
          idealRatio: '1.6:1 to 2:1 for most time series'
        });
      }
    }
    
    return warnings;
  }
  
  checkPerceptualAntipatterns(viz, dataProfile) {
    const warnings = [];
    
    // Area encoding for precise comparison
    if ((viz.type === 'bubble' || viz.type === 'treemap') && 
        viz.purpose?.includes('precise')) {
      warnings.push({
        type: 'area_for_precision',
        severity: 'medium',
        issue: 'Area encoding for precise comparisons',
        problem: 'Humans poor at comparing areas',
        impact: '20-30% error rate in size perception',
        alternative: 'Bar chart for precise comparisons',
        keepIf: 'Overall patterns more important than exact values'
      });
    }
    
    // Color as only differentiator
    if (viz.encoding === 'color' && !viz.redundantEncoding) {
      warnings.push({
        type: 'color_only_encoding',
        severity: 'high',
        issue: 'Color as sole differentiator',
        problem: 'Fails for colorblind users (8% of men)',
        impact: 'Information inaccessible to many',
        solutions: [
          'Add patterns or textures',
          'Use direct labeling',
          'Vary lightness along with hue',
          'Add position or shape encoding'
        ]
      });
    }
    
    // Overlapping labels
    if (viz.labels && dataProfile.dimensions.rows > 20) {
      warnings.push({
        type: 'label_overlap_risk',
        severity: 'low',
        issue: 'Potential label overlap',
        problem: 'Labels may overlap with many data points',
        solutions: [
          'Use hover labels instead',
          'Label only key points',
          'Implement smart label placement',
          'Use leader lines for clarity'
        ]
      });
    }
    
    return warnings;
  }
  
  isChartAppropriateForTask(chartType, taskType) {
    const taskChartMatrix = {
      trend_analysis: ['line', 'area', 'horizon', 'sparkline'],
      comparison: ['bar', 'column', 'bullet', 'dot'],
      part_to_whole: ['stacked_bar', 'treemap', 'pie', 'donut'],
      correlation: ['scatter', 'hexbin', 'contour'],
      distribution: ['histogram', 'box', 'violin', 'density'],
      ranking: ['bar', 'lollipop', 'slope'],
      geospatial: ['choropleth', 'symbol', 'heatmap'],
      pattern: ['heatmap', 'parallel', 'radar']
    };
    
    return taskChartMatrix[taskType]?.includes(chartType) || false;
  }
  
  getOptimalChartForTask(taskType) {
    const optimal = {
      trend_analysis: 'line chart',
      comparison: 'bar chart',
      part_to_whole: 'stacked bar or treemap',
      correlation: 'scatter plot',
      distribution: 'histogram or box plot',
      ranking: 'horizontal bar chart',
      geospatial: 'choropleth map',
      pattern: 'heatmap'
    };
    
    return optimal[taskType] || 'bar chart';
  }
  
  estimateDataInkRatio(viz) {
    let nonDataElements = 0;
    
    if (viz.gridlines?.heavy) nonDataElements += 0.15;
    if (viz.borders?.decorative) nonDataElements += 0.1;
    if (viz.backgrounds?.gradient) nonDataElements += 0.1;
    if (viz.effects3d) nonDataElements += 0.2;
    if (viz.decorations) nonDataElements += 0.15;
    
    return Math.max(0.2, 1 - nonDataElements);
  }
  
  calculateLieFactor(viz) {
    if (!viz.yAxis?.min || viz.yAxis.min === 0) return 1;
    
    const visualRange = viz.yAxis.max - viz.yAxis.min;
    const dataRange = viz.yAxis.max - 0;
    
    return dataRange / visualRange;
  }
  
  deduplicateWarnings(warnings) {
    const seen = new Set();
    return warnings.filter(warning => {
      const key = `${warning.type}-${warning.chart || ''}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
  
  prioritizeWarnings(warnings) {
    const severityOrder = { high: 1, medium: 2, low: 3 };
    
    return warnings.sort((a, b) => {
      const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
      if (severityDiff !== 0) return severityDiff;
      
      // Within same severity, prioritize by type
      const typeOrder = {
        'pie_chart_overuse': 1,
        '3d_effects': 2,
        'dual_y_axis': 3,
        'overplotting': 4,
        'rainbow_color_scale': 5,
        'color_only_encoding': 6,
        'truncated_axis': 7
      };
      
      return (typeOrder[a.type] || 99) - (typeOrder[b.type] || 99);
    });
  }
}