import { PerceptualScorer } from '../evaluators/perceptualScorer.js';

export class ChartSelector {
  constructor() {
    this.perceptualScorer = new PerceptualScorer();
    
    // Chart type definitions with capabilities
    this.chartTypes = {
      bar: {
        tasks: ['comparison', 'ranking', 'deviation'],
        dataTypes: ['categorical', 'numeric'],
        encoding: 'length',
        maxCategories: 50,
        strengths: ['Precise value comparison', 'Clear ranking', 'Handles many categories'],
        weaknesses: ['Poor for time series', 'Limited dimensions']
      },
      column: {
        tasks: ['comparison', 'ranking', 'time_series'],
        dataTypes: ['categorical', 'numeric', 'temporal'],
        encoding: 'length',
        maxCategories: 20,
        strengths: ['Good for time series with few points', 'Clear comparison'],
        weaknesses: ['Limited categories due to width']
      },
      line: {
        tasks: ['trend_analysis', 'time_series', 'comparison'],
        dataTypes: ['temporal', 'numeric'],
        encoding: 'position_common_scale',
        maxSeries: 7,
        strengths: ['Excellent for trends', 'Shows continuity', 'Multiple series'],
        weaknesses: ['Not for categories', 'Implies continuity']
      },
      area: {
        tasks: ['trend_analysis', 'part_to_whole', 'accumulation'],
        dataTypes: ['temporal', 'numeric'],
        encoding: 'area',
        maxSeries: 5,
        strengths: ['Shows volume/accumulation', 'Good for cumulative data'],
        weaknesses: ['Occlusion with multiple series', 'Less precise than line']
      },
      scatter: {
        tasks: ['correlation', 'distribution', 'outliers', 'clustering'],
        dataTypes: ['numeric', 'numeric'],
        encoding: 'position_common_scale',
        maxPoints: 10000,
        strengths: ['Shows relationships', 'Identifies patterns', 'Outlier detection'],
        weaknesses: ['Overplotting', 'Requires two continuous variables']
      },
      bubble: {
        tasks: ['correlation', 'comparison', 'distribution'],
        dataTypes: ['numeric', 'numeric', 'numeric'],
        encoding: 'area',
        maxPoints: 500,
        strengths: ['Three dimensions', 'Engaging visual'],
        weaknesses: ['Area perception issues', 'Overlapping bubbles']
      },
      pie: {
        tasks: ['part_to_whole', 'composition'],
        dataTypes: ['categorical', 'numeric'],
        encoding: 'angle',
        maxCategories: 5,
        strengths: ['Shows parts of whole', 'Familiar to audiences'],
        weaknesses: ['Poor accuracy', 'Limited categories', 'No exact values']
      },
      donut: {
        tasks: ['part_to_whole', 'composition'],
        dataTypes: ['categorical', 'numeric'],
        encoding: 'angle',
        maxCategories: 7,
        strengths: ['Central annotation space', 'Slightly better than pie'],
        weaknesses: ['Same issues as pie charts']
      },
      heatmap: {
        tasks: ['correlation', 'pattern', 'comparison', 'temporal_pattern'],
        dataTypes: ['categorical', 'categorical', 'numeric'],
        encoding: 'color_hue',
        maxCells: 10000,
        strengths: ['Dense data display', 'Pattern detection', 'Matrix visualization'],
        weaknesses: ['Color perception issues', 'Needs color legend']
      },
      treemap: {
        tasks: ['hierarchy', 'part_to_whole', 'comparison'],
        dataTypes: ['hierarchical', 'numeric'],
        encoding: 'area',
        maxNodes: 1000,
        strengths: ['Space-efficient', 'Shows hierarchy and size', 'Good for files/budgets'],
        weaknesses: ['Area perception', 'Deep hierarchies difficult']
      },
      sunburst: {
        tasks: ['hierarchy', 'part_to_whole', 'navigation'],
        dataTypes: ['hierarchical', 'numeric'],
        encoding: 'angle',
        maxLevels: 5,
        strengths: ['Clear hierarchy', 'Interactive navigation', 'Aesthetic appeal'],
        weaknesses: ['Angle perception', 'Center space wasted']
      },
      box: {
        tasks: ['distribution', 'comparison', 'outliers'],
        dataTypes: ['categorical', 'numeric'],
        encoding: 'position_common_scale',
        maxCategories: 20,
        strengths: ['Statistical summary', 'Outlier detection', 'Compare distributions'],
        weaknesses: ['Requires statistical knowledge', 'Hides multimodality']
      },
      violin: {
        tasks: ['distribution', 'comparison', 'density'],
        dataTypes: ['categorical', 'numeric'],
        encoding: 'area',
        maxCategories: 10,
        strengths: ['Shows full distribution', 'Reveals multimodality', 'Aesthetic'],
        weaknesses: ['Complex interpretation', 'Space intensive']
      },
      histogram: {
        tasks: ['distribution', 'frequency'],
        dataTypes: ['numeric'],
        encoding: 'length',
        maxBins: 100,
        strengths: ['Clear frequency display', 'Familiar format', 'Reveals shape'],
        weaknesses: ['Bin size sensitivity', 'Single variable only']
      },
      parallel: {
        tasks: ['multivariate', 'pattern', 'clustering', 'filtering'],
        dataTypes: ['multivariate'],
        encoding: 'position_nonaligned_scale',
        maxDimensions: 10,
        strengths: ['Many dimensions', 'Pattern detection', 'Interactive filtering'],
        weaknesses: ['Line crossings', 'Order dependent']
      },
      radar: {
        tasks: ['multivariate', 'comparison', 'profile'],
        dataTypes: ['multivariate'],
        encoding: 'position_nonaligned_scale',
        maxDimensions: 8,
        maxSeries: 3,
        strengths: ['Compact multivariate', 'Good for profiles', 'Comparative'],
        weaknesses: ['Area distortion', 'Axis order matters']
      },
      sankey: {
        tasks: ['flow', 'relationship', 'proportion'],
        dataTypes: ['categorical', 'categorical', 'numeric'],
        encoding: 'length',
        maxNodes: 50,
        strengths: ['Shows flow and proportion', 'Multiple stages', 'Intuitive'],
        weaknesses: ['Complex layouts', 'Many crossings']
      },
      chord: {
        tasks: ['relationship', 'flow', 'connection'],
        dataTypes: ['categorical', 'categorical', 'numeric'],
        encoding: 'angle',
        maxNodes: 20,
        strengths: ['Bidirectional relationships', 'Aesthetic', 'Compact'],
        weaknesses: ['Hard to read', 'Limited nodes']
      },
      horizon: {
        tasks: ['time_series', 'pattern', 'comparison'],
        dataTypes: ['temporal', 'numeric'],
        encoding: 'position_common_scale',
        maxSeries: 50,
        strengths: ['Space efficient', 'Many time series', 'Patterns visible'],
        weaknesses: ['Learning curve', 'Not intuitive']
      },
      stream: {
        tasks: ['time_series', 'part_to_whole', 'flow'],
        dataTypes: ['temporal', 'categorical', 'numeric'],
        encoding: 'area',
        maxCategories: 20,
        strengths: ['Aesthetic', 'Shows flow over time', 'Organic appearance'],
        weaknesses: ['Imprecise', 'Baseline issues']
      },
      hexbin: {
        tasks: ['density', 'distribution', 'pattern'],
        dataTypes: ['numeric', 'numeric'],
        encoding: 'color_hue',
        maxPoints: 1000000,
        strengths: ['Handles overplotting', 'Scalable', 'Clear density'],
        weaknesses: ['Loss of individual points', 'Binning artifacts']
      },
      contour: {
        tasks: ['density', 'distribution', 'pattern'],
        dataTypes: ['numeric', 'numeric'],
        encoding: 'position_common_scale',
        maxPoints: 100000,
        strengths: ['Smooth density', 'Topographic', 'No binning'],
        weaknesses: ['Abstract', 'Requires interpretation']
      }
    };
  }
  
  selectChart(task, dataProfile, constraints = {}) {
    const candidates = this.getCandidateCharts(task, dataProfile);
    const scoredCandidates = this.scoreCandidates(candidates, task, dataProfile, constraints);
    const filtered = this.applyConstraints(scoredCandidates, constraints);
    
    // Ensure we have a primary chart
    if (!filtered || filtered.length === 0) {
      return {
        primary: null,
        alternatives: [],
        reasoning: 'No suitable visualizations found for this data and task combination'
      };
    }
    
    // Safely extract alternatives, ensuring we don't go out of bounds
    const alternatives = filtered.length > 1 ? filtered.slice(1, Math.min(4, filtered.length)) : [];
    
    return {
      primary: filtered[0],
      alternatives: alternatives,
      reasoning: this.explainSelection(filtered[0], task, dataProfile)
    };
  }
  
  getCandidateCharts(task, dataProfile) {
    const taskType = task.type;
    const candidates = [];
    
    Object.entries(this.chartTypes).forEach(([chartType, config]) => {
      if (config.tasks.includes(taskType)) {
        // Check data type compatibility
        if (this.isDataCompatible(config, dataProfile)) {
          candidates.push({
            type: chartType,
            config: config,
            compatibility: this.calculateCompatibility(config, task, dataProfile)
          });
        }
      }
    });
    
    return candidates.sort((a, b) => b.compatibility - a.compatibility);
  }
  
  isDataCompatible(chartConfig, dataProfile) {
    const dimensions = dataProfile.dimensions;
    
    // Check if we have the required data types
    if (chartConfig.dataTypes.includes('temporal') && dimensions.temporal === 0) {
      return false;
    }
    
    if (chartConfig.dataTypes.includes('hierarchical') && 
        !dataProfile.patterns.compound.some(p => p.type === 'hierarchical')) {
      return false;
    }
    
    if (chartConfig.dataTypes.includes('multivariate') && 
        dimensions.continuous < 3) {
      return false;
    }
    
    return true;
  }
  
  calculateCompatibility(chartConfig, task, dataProfile) {
    let score = 0;
    
    // Task alignment
    const taskIndex = chartConfig.tasks.indexOf(task.type);
    if (taskIndex === 0) score += 0.4;  // Primary task
    else if (taskIndex === 1) score += 0.3;  // Secondary task
    else score += 0.2;  // Tertiary task
    
    // Data volume compatibility
    const dataSize = dataProfile.dimensions.rows;
    if (chartConfig.maxCategories) {
      const categories = dataProfile.cardinality[task.columns?.category]?.unique || 10;
      if (categories <= chartConfig.maxCategories) {
        score += 0.2;
      } else {
        score -= 0.1;
      }
    }
    
    if (chartConfig.maxPoints) {
      if (dataSize <= chartConfig.maxPoints * 0.5) {
        score += 0.2;
      } else if (dataSize <= chartConfig.maxPoints) {
        score += 0.1;
      } else {
        score -= 0.2;
      }
    }
    
    // Encoding effectiveness
    const encodingScore = this.perceptualScorer.encodingAccuracy[chartConfig.encoding] || 0.5;
    score += encodingScore * 0.2;
    
    return Math.max(0, Math.min(1, score));
  }
  
  scoreCandidates(candidates, task, dataProfile, constraints) {
    return candidates.map(candidate => {
      const visualization = {
        type: candidate.type,
        encoding: candidate.config.encoding,
        dimensions: this.countDimensions(candidate.config),
        categories: dataProfile.cardinality[task.columns?.category]?.unique || 1,
        width: constraints.width || 800,
        height: constraints.height || 600
      };
      
      const perceptualScore = this.perceptualScorer.scoreVisualization(
        visualization, task, dataProfile
      );
      
      return {
        ...candidate,
        score: perceptualScore.overall,
        perceptualScore: perceptualScore,
        recommendation: this.generateRecommendation(candidate, perceptualScore, task, dataProfile)
      };
    }).sort((a, b) => b.score - a.score);
  }
  
  countDimensions(chartConfig) {
    return chartConfig.dataTypes.filter(type => 
      ['numeric', 'temporal', 'categorical'].includes(type)
    ).length;
  }
  
  applyConstraints(candidates, constraints) {
    let filtered = [...candidates];
    
    // Apply audience constraints
    if (constraints.audience === 'executive') {
      // Prefer familiar, simple charts
      filtered = filtered.filter(c => 
        !['parallel', 'horizon', 'hexbin', 'contour'].includes(c.type)
      );
    } else if (constraints.audience === 'technical') {
      // All charts acceptable
    } else if (constraints.audience === 'public') {
      // Very simple charts only
      filtered = filtered.filter(c => 
        ['bar', 'line', 'pie', 'donut', 'column'].includes(c.type)
      );
    }
    
    // Apply size constraints
    if (constraints.small) {
      filtered = filtered.filter(c => 
        !['parallel', 'treemap', 'sankey'].includes(c.type)
      );
    }
    
    // Apply interactivity constraints
    if (constraints.static) {
      filtered = filtered.filter(c => 
        !['sunburst', 'parallel', 'horizon'].includes(c.type)
      );
    }
    
    // Ensure we have at least one option
    if (filtered.length === 0) {
      filtered = [candidates[0]];
    }
    
    return filtered;
  }
  
  generateRecommendation(candidate, perceptualScore, task, dataProfile) {
    const chart = candidate.config;
    const rec = {
      type: candidate.type,
      purpose: this.describePurpose(candidate.type, task),
      encoding: {
        primary: this.describeEncoding(chart.encoding),
        effectiveness: Math.round(perceptualScore.breakdown.perceptualAccuracy * 100) + '%'
      },
      specifications: this.generateSpecifications(candidate, task, dataProfile),
      enhancements: this.suggestEnhancements(candidate, task, dataProfile),
      interactions: this.suggestInteractions(candidate.type),
      accessibility: this.getAccessibilityNotes(candidate.type)
    };
    
    return rec;
  }
  
  describePurpose(chartType, task) {
    const purposes = {
      bar: 'Compare values across categories with maximum precision',
      line: 'Show trends and changes over time',
      scatter: 'Reveal relationships and correlations between variables',
      pie: 'Display parts of a whole (use sparingly)',
      heatmap: 'Identify patterns in large matrices of data',
      treemap: 'Show hierarchical data with size proportions',
      box: 'Compare statistical distributions across groups',
      parallel: 'Explore patterns across multiple dimensions',
      horizon: 'Compare many time series in limited space'
    };
    
    return purposes[chartType] || 'Visualize data patterns';
  }
  
  describeEncoding(encoding) {
    const descriptions = {
      position_common_scale: 'Position on common scale (most accurate)',
      position_nonaligned_scale: 'Position on separate scales',
      length: 'Length/height encoding',
      angle: 'Angle encoding (less accurate)',
      area: 'Area encoding (size perception)',
      color_hue: 'Color encoding (categorical distinction)'
    };
    
    return descriptions[encoding] || encoding;
  }
  
  generateSpecifications(candidate, task, dataProfile) {
    const specs = {
      dimensions: {},
      design: {},
      data: {}
    };
    
    // Map data to visual channels
    if (task.columns) {
      if (task.columns.temporal) {
        specs.dimensions.x = task.columns.temporal;
      }
      if (task.columns.category) {
        specs.dimensions.y = task.columns.category;
      }
      if (task.columns.measure) {
        specs.dimensions.value = task.columns.measure;
      }
    }
    
    // Design specifications
    specs.design = this.getDesignSpecs(candidate.type, dataProfile);
    
    // Data handling
    specs.data = this.getDataSpecs(candidate.type, dataProfile);
    
    return specs;
  }
  
  getDesignSpecs(chartType, dataProfile) {
    const baseSpecs = {
      bar: {
        orientation: 'horizontal',
        barWidth: 'automatic',
        spacing: '20% of bar width',
        gridlines: 'x-axis only',
        sort: 'descending by value'
      },
      line: {
        strokeWidth: 2,
        points: dataProfile.dimensions.rows < 50,
        smoothing: 'none',
        missingData: 'interpolate',
        multipleLines: 'direct labeling'
      },
      scatter: {
        pointSize: 3,
        opacity: dataProfile.dimensions.rows > 1000 ? 0.5 : 0.8,
        jitter: 'none',
        regression: 'optional',
        densityContours: dataProfile.dimensions.rows > 5000
      },
      heatmap: {
        colorScale: 'sequential',
        cellBorders: 'white 1px',
        clustering: 'optional',
        annotations: 'values if < 100 cells',
        aspectRatio: 'automatic'
      }
    };
    
    return baseSpecs[chartType] || {};
  }
  
  getDataSpecs(chartType, dataProfile) {
    const specs = {
      aggregation: 'automatic',
      sampling: dataProfile.dimensions.rows > 10000 ? 'recommended' : 'none',
      binning: chartType === 'histogram' ? 'sturges rule' : 'none',
      transformation: 'none'
    };
    
    return specs;
  }
  
  suggestEnhancements(candidate, task, dataProfile) {
    const enhancements = [];
    
    // Statistical enhancements
    if (['scatter', 'line'].includes(candidate.type)) {
      enhancements.push({
        type: 'statistical',
        options: ['trend line', 'confidence intervals', 'moving average']
      });
    }
    
    // Annotation enhancements
    if (task.type === 'trend_analysis') {
      enhancements.push({
        type: 'annotations',
        options: ['mark key events', 'highlight anomalies', 'show targets']
      });
    }
    
    // Reference lines
    if (['bar', 'column', 'line'].includes(candidate.type)) {
      enhancements.push({
        type: 'reference',
        options: ['average line', 'target line', 'benchmark']
      });
    }
    
    return enhancements;
  }
  
  suggestInteractions(chartType) {
    const interactions = {
      bar: ['hover details', 'click to filter', 'sort controls'],
      line: ['hover crosshair', 'zoom and pan', 'time brush'],
      scatter: ['hover details', 'lasso selection', 'zoom'],
      heatmap: ['hover cell details', 'row/column highlighting', 'zoom'],
      treemap: ['click to drill down', 'hover details', 'breadcrumb trail'],
      parallel: ['axis brushing', 'line highlighting', 'reorder axes']
    };
    
    return interactions[chartType] || ['hover details'];
  }
  
  getAccessibilityNotes(chartType) {
    const notes = {
      general: ['Ensure color is not the only encoding', 'Provide text alternatives', 
                'Use ARIA labels', 'Enable keyboard navigation'],
      specific: {}
    };
    
    notes.specific = {
      pie: 'Consider bar chart alternative for screen readers',
      color: 'Use colorblind-safe palettes',
      scatter: 'Provide data table alternative',
      heatmap: 'Include value labels or sonification'
    };
    
    return notes;
  }
  
  explainSelection(selected, task, dataProfile) {
    if (!selected) {
      return 'No suitable visualization found for this data and task combination.';
    }
    
    const explanation = {
      chosen: selected.type,
      reason: `Selected for ${task.type} task based on:`,
      factors: [
        `Perceptual accuracy: ${Math.round(selected.perceptualScore.overall * 100)}%`,
        `Task alignment: Optimized for ${task.type}`,
        `Data compatibility: Handles ${dataProfile.dimensions.rows} rows effectively`,
        `Encoding: Uses ${selected.config.encoding} (${this.describeEncoding(selected.config.encoding)})`
      ],
      tradeoffs: this.explainTradeoffs(selected, task, dataProfile)
    };
    
    return explanation;
  }
  
  explainTradeoffs(selected, task, dataProfile) {
    const tradeoffs = [];
    
    if (selected.config.encoding === 'angle' || selected.config.encoding === 'area') {
      tradeoffs.push('Less accurate perception than position-based charts');
    }
    
    if (dataProfile.dimensions.rows > selected.config.maxPoints * 0.8) {
      tradeoffs.push('May require aggregation or sampling for performance');
    }
    
    if (selected.type === 'pie' && 
        dataProfile.cardinality[task.columns?.category]?.unique > 5) {
      tradeoffs.push('Too many categories for effective pie chart use');
    }
    
    return tradeoffs;
  }
}