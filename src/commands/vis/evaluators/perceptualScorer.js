export class PerceptualScorer {
  constructor() {
    // Cleveland & McGill's ranking of visual encodings by accuracy
    this.encodingAccuracy = {
      position_common_scale: 0.95,      // Position on common scale (most accurate)
      position_nonaligned_scale: 0.85,  // Position on non-aligned scales
      length: 0.80,                     // Length, direction, angle
      angle: 0.65,                      // Angle (pie charts)
      area: 0.60,                       // Area (bubble charts)
      volume: 0.50,                     // 3D volume
      curvature: 0.45,                  // Curvature
      shading: 0.40,                    // Shading, color saturation
      color_hue: 0.35                   // Color hue (least accurate)
    };
    
    // Task-specific encoding preferences
    this.taskEncodingMap = {
      comparison: ['position_common_scale', 'length', 'position_nonaligned_scale'],
      composition: ['position_common_scale', 'length', 'angle', 'area'],
      distribution: ['position_common_scale', 'area', 'length'],
      correlation: ['position_common_scale', 'position_nonaligned_scale'],
      trend: ['position_common_scale', 'length'],
      ranking: ['position_common_scale', 'length'],
      part_to_whole: ['angle', 'area', 'length', 'position_common_scale'],
      deviation: ['position_common_scale', 'length', 'color_hue']
    };
  }
  
  scoreVisualization(visualization, task, dataProfile) {
    const scores = {
      perceptualAccuracy: this.scorePerceptualAccuracy(visualization, task),
      dataInkRatio: this.scoreDataInkRatio(visualization),
      cognitiveLoad: this.scoreCognitiveLoad(visualization, dataProfile),
      taskAlignment: this.scoreTaskAlignment(visualization, task),
      scalability: this.scoreScalability(visualization, dataProfile),
      aesthetics: this.scoreAesthetics(visualization)
    };
    
    // Calculate weighted overall score
    const weights = {
      perceptualAccuracy: 0.35,
      taskAlignment: 0.25,
      dataInkRatio: 0.15,
      cognitiveLoad: 0.15,
      scalability: 0.05,
      aesthetics: 0.05
    };
    
    const overallScore = Object.entries(scores).reduce((sum, [key, score]) => 
      sum + score * weights[key], 0
    );
    
    return {
      overall: overallScore,
      breakdown: scores,
      effectiveness: this.categorizeEffectiveness(overallScore),
      recommendations: this.generateRecommendations(scores, visualization)
    };
  }
  
  scorePerceptualAccuracy(visualization, task) {
    const encoding = visualization.encoding || 'position_common_scale';
    const baseAccuracy = this.encodingAccuracy[encoding] || 0.5;
    
    // Adjust for specific chart types
    const chartTypeAdjustments = {
      bar: 1.0,        // Bar charts are perceptually optimal
      line: 0.95,      // Line charts very good for trends
      scatter: 0.95,   // Scatterplots excellent for correlation
      pie: 0.7,        // Pie charts have known issues
      bubble: 0.75,    // Area encoding less accurate
      heatmap: 0.85,   // Color encoding with position
      treemap: 0.8,    // Area encoding with hierarchy
      sunburst: 0.75,  // Angle encoding with hierarchy
      parallel: 0.85,  // Multiple position encodings
      horizon: 0.9     // Clever use of position and color
    };
    
    const chartAdjustment = chartTypeAdjustments[visualization.type] || 0.8;
    
    return baseAccuracy * chartAdjustment;
  }
  
  scoreDataInkRatio(visualization) {
    // Based on Tufte's principles
    const unnecessaryElements = {
      gridlines: visualization.gridlines?.excessive ? -0.1 : 0,
      borders: visualization.borders?.heavy ? -0.05 : 0,
      backgrounds: visualization.backgrounds?.patterned ? -0.1 : 0,
      effects3d: visualization.effects3d ? -0.2 : 0,
      decorations: visualization.decorations ? -0.15 : 0,
      redundantLegends: visualization.redundantLegends ? -0.1 : 0
    };
    
    const penalty = Object.values(unnecessaryElements).reduce((sum, val) => sum + val, 0);
    const baseScore = 0.9; // Start with good score
    
    return Math.max(0.3, baseScore + penalty);
  }
  
  scoreCognitiveLoad(visualization, dataProfile) {
    let load = 0;
    
    // Number of data dimensions shown
    const dimensions = visualization.dimensions || 2;
    if (dimensions <= 2) load += 0.9;
    else if (dimensions <= 3) load += 0.7;
    else if (dimensions <= 4) load += 0.5;
    else load += 0.3;
    
    // Number of categories/series
    const categories = visualization.categories || 1;
    if (categories <= 5) load += 0.9;
    else if (categories <= 10) load += 0.7;
    else if (categories <= 20) load += 0.5;
    else load += 0.3;
    
    // Data density
    const pointsPerPixel = (dataProfile.dimensions.rows || 100) / 
                          (visualization.width * visualization.height || 400000);
    
    if (pointsPerPixel < 0.01) load += 0.9;
    else if (pointsPerPixel < 0.1) load += 0.7;
    else if (pointsPerPixel < 1) load += 0.5;
    else load += 0.3;
    
    return load / 3; // Average of three factors
  }
  
  scoreTaskAlignment(visualization, task) {
    const taskType = task.type || 'comparison';
    const vizType = visualization.type;
    
    // Task-visualization alignment matrix
    const alignmentMatrix = {
      trend_analysis: {
        line: 1.0,
        area: 0.9,
        scatter: 0.7,
        bar: 0.5,
        horizon: 0.95,
        sparkline: 0.85
      },
      comparison: {
        bar: 1.0,
        column: 0.95,
        line: 0.7,
        scatter: 0.6,
        radar: 0.8,
        bullet: 0.9
      },
      part_to_whole: {
        pie: 0.8,
        donut: 0.85,
        stacked_bar: 0.9,
        treemap: 0.95,
        sunburst: 0.9,
        waffle: 0.85
      },
      distribution: {
        histogram: 1.0,
        box: 0.95,
        violin: 0.95,
        density: 0.9,
        strip: 0.85,
        ridgeline: 0.9
      },
      correlation: {
        scatter: 1.0,
        hexbin: 0.95,
        contour: 0.9,
        correlogram: 0.85,
        bubble: 0.8,
        splom: 0.95
      },
      ranking: {
        bar: 1.0,
        lollipop: 0.95,
        slope: 0.9,
        bump: 0.85,
        column: 0.85
      },
      geospatial: {
        choropleth: 1.0,
        symbol: 0.9,
        heatmap: 0.85,
        flow: 0.9,
        cartogram: 0.8
      },
      hierarchy: {
        tree: 1.0,
        treemap: 0.95,
        sunburst: 0.9,
        circle_pack: 0.85,
        dendogram: 0.9
      }
    };
    
    const taskAlignments = alignmentMatrix[taskType] || {};
    return taskAlignments[vizType] || 0.5;
  }
  
  scoreScalability(visualization, dataProfile) {
    const dataSize = dataProfile.dimensions.rows;
    const vizType = visualization.type;
    
    // Scalability limits by visualization type
    const scalabilityLimits = {
      scatter: { optimal: 1000, max: 10000 },
      line: { optimal: 500, max: 5000 },
      bar: { optimal: 50, max: 200 },
      pie: { optimal: 7, max: 12 },
      heatmap: { optimal: 10000, max: 100000 },
      hexbin: { optimal: 100000, max: 1000000 },
      treemap: { optimal: 100, max: 1000 },
      parallel: { optimal: 1000, max: 10000 },
      horizon: { optimal: 5000, max: 50000 }
    };
    
    const limits = scalabilityLimits[vizType] || { optimal: 100, max: 1000 };
    
    if (dataSize <= limits.optimal) return 1.0;
    if (dataSize <= limits.max) {
      // Linear decay from optimal to max
      return 1.0 - (dataSize - limits.optimal) / (limits.max - limits.optimal) * 0.5;
    }
    return 0.3; // Minimum score for over-limit
  }
  
  scoreAesthetics(visualization) {
    let score = 0.8; // Base aesthetic score
    
    // Positive factors
    if (visualization.colorScheme?.type === 'scientific') score += 0.1;
    if (visualization.typography?.readable) score += 0.05;
    if (visualization.layout?.balanced) score += 0.05;
    
    // Negative factors
    if (visualization.colors?.tooMany) score -= 0.1;
    if (visualization.effects?.distracting) score -= 0.1;
    if (visualization.labels?.overlapping) score -= 0.1;
    
    return Math.max(0.3, Math.min(1.0, score));
  }
  
  categorizeEffectiveness(score) {
    if (score >= 0.9) return 'excellent';
    if (score >= 0.8) return 'very_good';
    if (score >= 0.7) return 'good';
    if (score >= 0.6) return 'acceptable';
    if (score >= 0.5) return 'marginal';
    return 'poor';
  }
  
  generateRecommendations(scores, visualization) {
    const recommendations = [];
    
    // Perceptual accuracy recommendations
    if (scores.perceptualAccuracy < 0.7) {
      recommendations.push({
        type: 'encoding',
        priority: 'high',
        message: 'Consider using position or length encoding instead of ' + 
                 (visualization.encoding || 'current encoding') + 
                 ' for better perceptual accuracy'
      });
    }
    
    // Data-ink ratio recommendations
    if (scores.dataInkRatio < 0.7) {
      recommendations.push({
        type: 'simplification',
        priority: 'medium',
        message: 'Remove unnecessary chart elements like heavy gridlines, borders, or 3D effects'
      });
    }
    
    // Cognitive load recommendations
    if (scores.cognitiveLoad < 0.6) {
      recommendations.push({
        type: 'complexity',
        priority: 'high',
        message: 'Consider breaking down into multiple simpler visualizations or using progressive disclosure'
      });
    }
    
    // Task alignment recommendations
    if (scores.taskAlignment < 0.7) {
      recommendations.push({
        type: 'chart_type',
        priority: 'high',
        message: 'This chart type may not be optimal for your analytical task'
      });
    }
    
    // Scalability recommendations
    if (scores.scalability < 0.6) {
      recommendations.push({
        type: 'data_reduction',
        priority: 'medium',
        message: 'Consider aggregation, sampling, or a different visualization type for this data volume'
      });
    }
    
    return recommendations;
  }
  
  compareVisualizations(viz1, viz2, task, dataProfile) {
    const score1 = this.scoreVisualization(viz1, task, dataProfile);
    const score2 = this.scoreVisualization(viz2, task, dataProfile);
    
    return {
      winner: score1.overall > score2.overall ? viz1 : viz2,
      scores: {
        viz1: score1,
        viz2: score2
      },
      differential: Math.abs(score1.overall - score2.overall),
      recommendation: this.generateComparison(viz1, viz2, score1, score2)
    };
  }
  
  generateComparison(viz1, viz2, score1, score2) {
    const diff = score1.overall - score2.overall;
    
    if (Math.abs(diff) < 0.05) {
      return 'Both visualizations are similarly effective. Choose based on your specific context.';
    }
    
    const better = diff > 0 ? viz1 : viz2;
    const worse = diff > 0 ? viz2 : viz1;
    const betterScore = diff > 0 ? score1 : score2;
    const worseScore = diff > 0 ? score2 : score1;
    
    // Find the key differentiator
    let maxDiff = 0;
    let keyFactor = '';
    
    Object.keys(betterScore.breakdown).forEach(factor => {
      const factorDiff = Math.abs(betterScore.breakdown[factor] - worseScore.breakdown[factor]);
      if (factorDiff > maxDiff) {
        maxDiff = factorDiff;
        keyFactor = factor;
      }
    });
    
    return `${better.type} is ${Math.round(Math.abs(diff) * 100)}% more effective than ${worse.type}, ` +
           `primarily due to better ${keyFactor.replace(/_/g, ' ')}`;
  }
}