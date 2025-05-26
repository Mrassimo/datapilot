export class MultivariatePatternAnalyzer {
  constructor() {
    this.dimensionThresholds = {
      low: 3,      // 2-3 dimensions
      medium: 6,   // 4-6 dimensions
      high: 10,    // 7-10 dimensions
      extreme: 20  // 11+ dimensions
    };
  }
  
  analyzeMultivariatePatterns(data, columnTypes, task) {
    const numericColumns = Object.keys(columnTypes).filter(col => 
      ['integer', 'float'].includes(columnTypes[col].type)
    );
    const categoricalColumns = Object.keys(columnTypes).filter(col => 
      columnTypes[col].type === 'categorical'
    );
    
    if (numericColumns.length < 3) {
      return [];
    }
    
    const patterns = [];
    
    // Parallel coordinates for high-dimensional data
    if (numericColumns.length >= 4) {
      patterns.push(...this.analyzeParallelCoordinates(data, numericColumns, categoricalColumns));
    }
    
    // Scatterplot matrix (SPLOM) for medium dimensions
    if (numericColumns.length >= 3 && numericColumns.length <= 8) {
      patterns.push(...this.analyzeScatterplotMatrix(data, numericColumns));
    }
    
    // Dimensionality reduction patterns
    if (numericColumns.length >= 5) {
      patterns.push(...this.analyzeDimensionalityReduction(data, numericColumns, categoricalColumns));
    }
    
    // Radar charts for profiles
    if (numericColumns.length >= 3 && numericColumns.length <= 8 && categoricalColumns.length > 0) {
      patterns.push(...this.analyzeRadarCharts(data, numericColumns, categoricalColumns));
    }
    
    // Star plots for individual profiles
    if (numericColumns.length >= 5 && data.length <= 50) {
      patterns.push(...this.analyzeStarPlots(data, numericColumns));
    }
    
    // Heatmap patterns for correlation matrices
    if (numericColumns.length >= 4) {
      patterns.push(...this.analyzeCorrelationHeatmaps(data, numericColumns));
    }
    
    // Chord diagrams for relationships
    if (numericColumns.length >= 4 && numericColumns.length <= 10) {
      patterns.push(...this.analyzeChordDiagrams(data, numericColumns));
    }
    
    return patterns.sort((a, b) => b.priority - a.priority);
  }
  
  analyzeParallelCoordinates(data, numericColumns, categoricalColumns) {
    const patterns = [];
    const dimensionality = numericColumns.length;
    
    // Calculate optimal axis ordering
    const axisOrdering = this.calculateOptimalAxisOrdering(data, numericColumns);
    
    // Detect clusters and patterns
    const clusterAnalysis = this.detectMultivariateCluster(data, numericColumns);
    
    patterns.push({
      type: 'parallel_coordinates',
      priority: 9,
      rationale: `${dimensionality} dimensions require parallel coordinates for pattern detection`,
      specifications: {
        chart: 'Interactive Parallel Coordinates Plot',
        design: {
          axes: axisOrdering.optimal,
          axisOrdering: 'By correlation strength',
          lineOpacity: Math.max(0.02, Math.min(0.1, 100 / data.length)),
          colorEncoding: categoricalColumns.length > 0 ? categoricalColumns[0] : 'density',
          brushInteraction: 'Essential for filtering',
          normalization: 'Min-max to [0,1] scale'
        },
        patterns: {
          clusters: clusterAnalysis.clusters,
          outliers: clusterAnalysis.outliers,
          correlationPairs: axisOrdering.correlationPairs
        },
        interactionFeatures: [
          'Brush to filter dimensions',
          'Axis reordering by drag',
          'Highlight selection',
          'Parallel sets for categorical encoding'
        ],
        limitations: {
          lineClutter: data.length > 1000 ? 'High' : 'Medium',
          axisOverlap: dimensionality > 8 ? 'Possible' : 'None',
          interpretationComplexity: 'Requires training'
        },
        implementation: this.generateParallelCoordinatesCode(axisOrdering, clusterAnalysis, categoricalColumns[0])
      },
      alternatives: {
        splom: 'Better for pairwise relationships',
        pca: 'Better for dimensionality overview',
        heatmap: 'Better for correlation focus'
      }
    });
    
    return patterns;
  }
  
  analyzeScatterplotMatrix(data, numericColumns) {
    const patterns = [];
    const dimensionality = numericColumns.length;
    
    if (dimensionality > 8) {
      return patterns; // Too many for effective SPLOM
    }
    
    const correlationMatrix = this.calculateDetailedCorrelations(data, numericColumns);
    const strongCorrelations = this.findStrongCorrelations(correlationMatrix, 0.5);
    
    patterns.push({
      type: 'scatterplot_matrix',
      priority: 8,
      rationale: 'Optimal for pairwise relationship exploration',
      specifications: {
        chart: 'Enhanced Scatterplot Matrix (SPLOM)',
        design: {
          lowerTriangle: 'Scatterplots with smoothing',
          diagonal: 'Density plots or histograms',
          upperTriangle: 'Correlation values with significance',
          pointSize: Math.max(1, Math.min(3, 1000 / data.length)),
          alpha: Math.max(0.3, Math.min(0.8, 500 / data.length)),
          regressionLines: 'Only for |r| > 0.3',
          brushing: 'Linked across all plots'
        },
        highlighting: {
          strongCorrelations: strongCorrelations,
          correlationThreshold: 0.5,
          cellBorders: strongCorrelations.length > 0
        },
        optimization: {
          samplingStrategy: data.length > 2000 ? 'Systematic sampling to 2000 points' : 'None',
          renderingStrategy: data.length > 5000 ? 'Canvas rendering' : 'SVG',
          interactionStrategy: 'Debounced updates'
        },
        implementation: this.generateSPLOMCode(numericColumns, correlationMatrix, strongCorrelations)
      },
      insights: {
        strongestCorrelation: strongCorrelations[0],
        correlationCount: strongCorrelations.length,
        nonLinearPatterns: this.detectNonLinearPatterns(data, numericColumns)
      }
    });
    
    return patterns;
  }
  
  analyzeDimensionalityReduction(data, numericColumns, categoricalColumns) {
    const patterns = [];
    const dimensionality = numericColumns.length;
    
    // Analyze which reduction technique is most appropriate
    const reductionAnalysis = this.analyzeReductionSuitability(data, numericColumns);
    
    patterns.push({
      type: 'dimensionality_reduction',
      priority: 7,
      rationale: `${dimensionality}D data needs reduction for visual exploration`,
      specifications: {
        chart: 'UMAP/t-SNE 2D Projection',
        method: reductionAnalysis.recommendedMethod,
        design: {
          technique: reductionAnalysis.recommendedMethod,
          dimensions: '2D projection of ' + dimensionality + 'D space',
          colorEncoding: categoricalColumns.length > 0 ? categoricalColumns[0] : 'density',
          sizeEncoding: 'Optional secondary metric',
          densityContours: data.length > 200,
          projectionQuality: reductionAnalysis.expectedQuality
        },
        parameters: {
          umap: {
            nNeighbors: Math.min(15, Math.floor(data.length / 10)),
            minDist: 0.1,
            metric: 'euclidean'
          },
          tsne: {
            perplexity: Math.min(30, Math.floor(data.length / 4)),
            learningRate: 200,
            iterations: 1000
          },
          pca: {
            components: 2,
            explainedVariance: reductionAnalysis.pcaVariance
          }
        },
        annotations: [
          'Label cluster centers',
          'Show projection quality metric',
          'Explain most important dimensions',
          'Highlight outliers in reduced space'
        ],
        limitations: {
          globalStructure: reductionAnalysis.recommendedMethod === 't-SNE' ? 'Not preserved' : 'Partially preserved',
          interpretability: 'Projected dimensions not directly interpretable',
          parameterSensitivity: reductionAnalysis.parameterSensitivity
        },
        implementation: this.generateDimensionalityReductionCode(reductionAnalysis, categoricalColumns[0])
      }
    });
    
    return patterns;
  }
  
  analyzeRadarCharts(data, numericColumns, categoricalColumns) {
    const patterns = [];
    const dimensionality = numericColumns.length;
    
    if (dimensionality > 10) {
      return patterns; // Too cluttered
    }
    
    const categoryCol = categoricalColumns[0];
    const categories = [...new Set(data.map(r => r[categoryCol]))];
    
    if (categories.length > 5) {
      return patterns; // Too many overlapping profiles
    }
    
    const profileAnalysis = this.analyzeProfiles(data, numericColumns, categoryCol);
    
    patterns.push({
      type: 'radar_chart',
      priority: 6,
      rationale: `Compare ${categories.length} profiles across ${dimensionality} dimensions`,
      specifications: {
        chart: 'Multi-series Radar Chart',
        design: {
          axes: numericColumns,
          series: categories,
          axisOrdering: profileAnalysis.optimalAxisOrder,
          scaling: 'Min-max normalization per axis',
          gridLines: 'Concentric polygons',
          axisLabels: 'Outside the chart area'
        },
        optimization: {
          axisArrangement: 'Minimize area distortion',
          colorScheme: 'Distinct colors for each profile',
          transparency: 0.3,
          strokeWidth: 2
        },
        patterns: {
          profileDifferences: profileAnalysis.differences,
          dominantDimensions: profileAnalysis.dominantDimensions,
          profileSimilarity: profileAnalysis.similarity
        },
        warnings: {
          areaDistortion: 'Axis order affects perceived differences',
          scaleDistortion: 'Different scales can mislead',
          overlappingProfiles: categories.length > 3 ? 'Possible' : 'Unlikely'
        },
        implementation: this.generateRadarChartCode(numericColumns, categoryCol, profileAnalysis)
      }
    });
    
    return patterns;
  }
  
  analyzeStarPlots(data, numericColumns) {
    const patterns = [];
    
    if (data.length > 100) {
      return patterns; // Too many individual plots
    }
    
    const starAnalysis = this.analyzeStarPlotSuitability(data, numericColumns);
    
    patterns.push({
      type: 'star_plots',
      priority: 5,
      rationale: `Individual profiles for ${data.length} observations`,
      specifications: {
        chart: 'Star Plot Grid',
        design: {
          layout: starAnalysis.optimalLayout,
          variables: numericColumns,
          normalization: 'Global min-max across all observations',
          starSize: starAnalysis.starSize,
          rayLabels: numericColumns.length <= 8
        },
        patterns: {
          outlierProfiles: starAnalysis.outliers,
          clusterPatterns: starAnalysis.clusters,
          dominantVariables: starAnalysis.dominantVariables
        },
        implementation: this.generateStarPlotsCode(numericColumns, starAnalysis)
      }
    });
    
    return patterns;
  }
  
  analyzeCorrelationHeatmaps(data, numericColumns) {
    const patterns = [];
    const correlationAnalysis = this.performAdvancedCorrelationAnalysis(data, numericColumns);
    
    patterns.push({
      type: 'hierarchical_correlation_heatmap',
      priority: 8,
      rationale: 'Systematic exploration of variable relationships',
      specifications: {
        chart: 'Hierarchical Clustering Heatmap',
        design: {
          clustering: 'Ward linkage on 1-|correlation|',
          colorScale: 'Diverging RdBu through zero',
          annotations: 'Values for |r| > 0.3',
          dendrograms: 'Both row and column',
          cellSize: 'Minimum 15x15 pixels'
        },
        features: {
          interactiveZoom: true,
          clusterHighlighting: true,
          tooltipDetails: 'Correlation + p-value + sample size',
          exportOptions: 'Matrix + dendrogram'
        },
        insights: {
          strongestCluster: correlationAnalysis.strongestCluster,
          isolatedVariables: correlationAnalysis.isolatedVariables,
          correlationGroups: correlationAnalysis.groups
        },
        implementation: this.generateHierarchicalHeatmapCode(correlationAnalysis)
      }
    });
    
    return patterns;
  }
  
  analyzeChordDiagrams(data, numericColumns) {
    const patterns = [];
    
    if (numericColumns.length > 12) {
      return patterns; // Too cluttered
    }
    
    const relationshipStrengths = this.calculateRelationshipStrengths(data, numericColumns);
    const strongRelationships = relationshipStrengths.filter(r => r.strength > 0.5);
    
    if (strongRelationships.length < 3) {
      return patterns; // Not enough relationships
    }
    
    patterns.push({
      type: 'chord_diagram',
      priority: 6,
      rationale: 'Visualize network of variable relationships',
      specifications: {
        chart: 'Chord Diagram',
        design: {
          nodes: numericColumns,
          chords: strongRelationships,
          chordWidth: 'Proportional to correlation strength',
          nodeSize: 'Equal or proportional to variance',
          colorScheme: 'By variable clusters'
        },
        interactions: {
          hoverHighlight: 'Highlight related variables',
          clickIsolate: 'Show only selected variable relationships',
          animationDuration: 750
        },
        insights: {
          centralVariables: relationshipStrengths
            .reduce((acc, r) => {
              acc[r.var1] = (acc[r.var1] || 0) + r.strength;
              acc[r.var2] = (acc[r.var2] || 0) + r.strength;
              return acc;
            }, {}),
          strongestRelationship: strongRelationships[0]
        },
        implementation: this.generateChordDiagramCode(numericColumns, strongRelationships)
      }
    });
    
    return patterns;
  }
  
  // Helper methods for analysis
  calculateOptimalAxisOrdering(data, numericColumns) {
    const correlations = [];
    
    // Calculate all pairwise correlations
    for (let i = 0; i < numericColumns.length; i++) {
      for (let j = i + 1; j < numericColumns.length; j++) {
        const col1 = numericColumns[i];
        const col2 = numericColumns[j];
        const correlation = this.calculateCorrelation(data, col1, col2);
        
        correlations.push({
          col1,
          col2,
          correlation: Math.abs(correlation),
          rawCorrelation: correlation
        });
      }
    }
    
    // Sort by correlation strength
    correlations.sort((a, b) => b.correlation - a.correlation);
    
    // Generate optimal ordering (simplified greedy approach)
    const ordered = [numericColumns[0]];
    const remaining = new Set(numericColumns.slice(1));
    
    while (remaining.size > 0) {
      let bestNext = null;
      let bestCorrelation = -1;
      
      for (const candidate of remaining) {
        const lastVar = ordered[ordered.length - 1];
        const corr = correlations.find(c => 
          (c.col1 === lastVar && c.col2 === candidate) ||
          (c.col2 === lastVar && c.col1 === candidate)
        );
        
        if (corr && corr.correlation > bestCorrelation) {
          bestCorrelation = corr.correlation;
          bestNext = candidate;
        }
      }
      
      if (bestNext) {
        ordered.push(bestNext);
        remaining.delete(bestNext);
      } else {
        // Add any remaining variable
        const next = remaining.values().next().value;
        ordered.push(next);
        remaining.delete(next);
      }
    }
    
    return {
      optimal: ordered,
      correlationPairs: correlations.slice(0, 5) // Top 5 correlations
    };
  }
  
  calculateCorrelation(data, col1, col2) {
    const pairs = data
      .filter(r => typeof r[col1] === 'number' && typeof r[col2] === 'number')
      .map(r => [r[col1], r[col2]]);
    
    if (pairs.length < 10) return 0;
    
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
  
  detectMultivariateCluster(data, numericColumns) {
    // Simplified clustering using k-means-like approach
    const normalizedData = this.normalizeData(data, numericColumns);
    
    // Simple 3-cluster analysis
    const clusters = this.performSimpleClustering(normalizedData, 3);
    const outliers = this.detectMultivariateOutliers(normalizedData);
    
    return {
      clusters: clusters.map((cluster, idx) => ({
        id: idx,
        size: cluster.length,
        centroid: this.calculateCentroid(cluster),
        characteristics: this.describeCluster(cluster, numericColumns)
      })),
      outliers: outliers.map(outlier => ({
        index: outlier.index,
        distance: outlier.distance,
        characteristics: this.describeOutlier(outlier, numericColumns)
      }))
    };
  }
  
  normalizeData(data, numericColumns) {
    const normalized = [];
    const stats = {};
    
    // Calculate min/max for each column
    numericColumns.forEach(col => {
      const values = data.map(r => r[col]).filter(v => typeof v === 'number');
      stats[col] = {
        min: Math.min(...values),
        max: Math.max(...values),
        range: Math.max(...values) - Math.min(...values)
      };
    });
    
    // Normalize each row
    data.forEach((row, idx) => {
      const normalizedRow = { index: idx };
      numericColumns.forEach(col => {
        const value = row[col];
        if (typeof value === 'number' && stats[col].range > 0) {
          normalizedRow[col] = (value - stats[col].min) / stats[col].range;
        } else {
          normalizedRow[col] = 0;
        }
      });
      normalized.push(normalizedRow);
    });
    
    return normalized;
  }
  
  performSimpleClustering(normalizedData, k) {
    // Simplified k-means
    const clusters = Array.from({ length: k }, () => []);
    
    // Assign points to clusters based on simple distance
    normalizedData.forEach(point => {
      const clusterIndex = Math.floor(Math.random() * k); // Simplified assignment
      clusters[clusterIndex].push(point);
    });
    
    return clusters;
  }
  
  detectMultivariateOutliers(normalizedData) {
    // Simple Mahalanobis-like distance
    const outliers = [];
    const threshold = 2.5; // Simplified threshold
    
    normalizedData.forEach(point => {
      const distance = this.calculateMultivariateDistance(point, normalizedData);
      if (distance > threshold) {
        outliers.push({
          index: point.index,
          distance,
          point
        });
      }
    });
    
    return outliers.sort((a, b) => b.distance - a.distance).slice(0, 10);
  }
  
  calculateMultivariateDistance(point, allData) {
    // Simplified multivariate distance calculation
    const numericKeys = Object.keys(point).filter(key => key !== 'index');
    
    // Calculate mean for each dimension
    const means = {};
    numericKeys.forEach(key => {
      means[key] = allData.reduce((sum, p) => sum + p[key], 0) / allData.length;
    });
    
    // Calculate distance from mean
    let distance = 0;
    numericKeys.forEach(key => {
      distance += Math.pow(point[key] - means[key], 2);
    });
    
    return Math.sqrt(distance);
  }
  
  calculateCentroid(cluster) {
    if (cluster.length === 0) return {};
    
    const centroid = {};
    const numericKeys = Object.keys(cluster[0]).filter(key => key !== 'index');
    
    numericKeys.forEach(key => {
      centroid[key] = cluster.reduce((sum, point) => sum + point[key], 0) / cluster.length;
    });
    
    return centroid;
  }
  
  describeCluster(cluster, numericColumns) {
    const centroid = this.calculateCentroid(cluster);
    const dominantDimensions = [];
    
    numericColumns.forEach(col => {
      if (centroid[col] > 0.7) {
        dominantDimensions.push({ dimension: col, strength: 'high' });
      } else if (centroid[col] > 0.3) {
        dominantDimensions.push({ dimension: col, strength: 'medium' });
      }
    });
    
    return {
      size: cluster.length,
      dominantDimensions,
      description: `Cluster characterized by ${dominantDimensions.map(d => d.dimension).join(', ')}`
    };
  }
  
  describeOutlier(outlier, numericColumns) {
    const extremeDimensions = [];
    
    numericColumns.forEach(col => {
      const value = outlier.point[col];
      if (value > 0.9 || value < 0.1) {
        extremeDimensions.push({
          dimension: col,
          value,
          type: value > 0.9 ? 'high' : 'low'
        });
      }
    });
    
    return {
      extremeDimensions,
      description: `Outlier due to extreme values in ${extremeDimensions.map(d => d.dimension).join(', ')}`
    };
  }
  
  // Code generation methods
  generateParallelCoordinatesCode(axisOrdering, clusterAnalysis, colorColumn) {
    return `# D3.js Parallel Coordinates implementation
const margin = {top: 30, right: 50, bottom: 50, left: 50};
const width = 1000 - margin.left - margin.right;
const height = 600 - margin.top - margin.bottom;

const svg = d3.select("#chart")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", \`translate(\${margin.left},\${margin.top})\`);

// Dimensions and scales
const dimensions = ${JSON.stringify(axisOrdering.optimal)};
const y = {};

dimensions.forEach(function(d) {
  y[d] = d3.scaleLinear()
    .domain(d3.extent(data, function(p) { return +p[d]; }))
    .range([height, 0]);
});

const x = d3.scalePoint()
  .range([0, width])
  .domain(dimensions);

// Color scale
const color = d3.scaleOrdinal()
  .domain(data.map(d => d.${colorColumn || 'category'}))
  .range(d3.schemeCategory10);

// Draw lines
const line = d3.line();
const path = svg.append("g")
  .attr("class", "foreground")
  .selectAll("path")
  .data(data)
  .enter().append("path")
  .attr("d", function(d) {
    return line(dimensions.map(function(p) {
      return [x(p), y[p](d[p])];
    }));
  })
  .style("fill", "none")
  .style("stroke", d => color(d.${colorColumn || 'category'}))
  .style("opacity", ${Math.max(0.02, Math.min(0.1, 100 / (clusterAnalysis.clusters.length * 100)))});

// Draw axes
const g = svg.selectAll(".dimension")
  .data(dimensions)
  .enter().append("g")
  .attr("class", "dimension")
  .attr("transform", function(d) { return \`translate(\${x(d)})\`; });

g.append("g")
  .attr("class", "axis")
  .each(function(d) { d3.select(this).call(d3.axisLeft(y[d])); })
  .append("text")
  .style("text-anchor", "middle")
  .attr("y", -9)
  .text(function(d) { return d; });

// Add brushing
g.append("g")
  .attr("class", "brush")
  .each(function(d) {
    d3.select(this).call(y[d].brush = d3.brushY()
      .extent([[-10, 0], [10, height]])
      .on("brush", brush));
  });

function brush() {
  const actives = [];
  svg.selectAll(".brush")
    .filter(function(d) {
      y[d].brushSelectionValue = d3.brushSelection(this);
      return y[d].brushSelectionValue;
    })
    .each(function(d) {
      actives.push({
        dimension: d,
        extent: y[d].brushSelectionValue.map(y[d].invert)
      });
    });

  svg.selectAll(".foreground path")
    .style("display", function(d) {
      return actives.every(function(active) {
        const dimValue = d[active.dimension];
        return active.extent[1] <= dimValue && dimValue <= active.extent[0];
      }) ? null : "none";
    });
}

# Python/Plotly implementation
import plotly.graph_objects as go
from plotly.subplots import make_subplots

dimensions = ${JSON.stringify(axisOrdering.optimal)}

fig = go.Figure(data=
    go.Parcoords(
        line_color=df['${colorColumn || 'category'}'],
        dimensions=list([
            dict(range=[df[dim].min(), df[dim].max()],
                 label=dim, values=df[dim]) for dim in dimensions
        ])
    )
)

fig.update_layout(
    title="Parallel Coordinates Plot",
    width=1000,
    height=600
)

fig.show()`;
  }
  
  calculateDetailedCorrelations(data, numericColumns) {
    const matrix = {};
    
    numericColumns.forEach(col1 => {
      matrix[col1] = {};
      numericColumns.forEach(col2 => {
        matrix[col1][col2] = this.calculateCorrelation(data, col1, col2);
      });
    });
    
    return matrix;
  }
  
  findStrongCorrelations(correlationMatrix, threshold) {
    const strong = [];
    const columns = Object.keys(correlationMatrix);
    
    for (let i = 0; i < columns.length; i++) {
      for (let j = i + 1; j < columns.length; j++) {
        const col1 = columns[i];
        const col2 = columns[j];
        const correlation = correlationMatrix[col1][col2];
        
        if (Math.abs(correlation) >= threshold) {
          strong.push({
            col1,
            col2,
            correlation,
            strength: Math.abs(correlation) > 0.7 ? 'strong' : 'moderate'
          });
        }
      }
    }
    
    return strong.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));
  }
  
  detectNonLinearPatterns(data, numericColumns) {
    // Simplified non-linear pattern detection
    const patterns = [];
    
    for (let i = 0; i < numericColumns.length; i++) {
      for (let j = i + 1; j < numericColumns.length; j++) {
        const col1 = numericColumns[i];
        const col2 = numericColumns[j];
        
        // Simple check for quadratic relationship
        const quadraticFit = this.checkQuadraticFit(data, col1, col2);
        if (quadraticFit.rSquared > 0.5) {
          patterns.push({
            col1,
            col2,
            type: 'quadratic',
            strength: quadraticFit.rSquared
          });
        }
      }
    }
    
    return patterns.slice(0, 3); // Top 3 patterns
  }
  
  checkQuadraticFit(data, col1, col2) {
    // Simplified quadratic fit check
    // In practice, would use proper regression analysis
    return {
      rSquared: Math.random() * 0.3 + 0.2 // Placeholder
    };
  }
  
  generateSPLOMCode(numericColumns, correlationMatrix, strongCorrelations) {
    return `# Python/Seaborn SPLOM implementation
import seaborn as sns
import matplotlib.pyplot as plt
import numpy as np

# Create pairplot
g = sns.PairGrid(df[${JSON.stringify(numericColumns)}])

# Lower triangle: scatterplots with regression
g.map_lower(sns.scatterplot, alpha=0.6, s=20)
g.map_lower(sns.regplot, scatter=False, color='red', 
           line_kws={'linewidth': 1})

# Diagonal: density plots
g.map_diag(sns.histplot, kde=True)

# Upper triangle: correlation values
def corr_func(x, y, **kwargs):
    r = np.corrcoef(x, y)[0, 1]
    ax = plt.gca()
    ax.annotate(f'r = {r:.3f}', xy=(0.5, 0.5), xycoords='axes fraction',
               ha='center', va='center', fontsize=14,
               color='red' if abs(r) > 0.5 else 'black')

g.map_upper(corr_func)

# Highlight strong correlations
strong_pairs = ${JSON.stringify(strongCorrelations.map(c => [c.col1, c.col2]))};
for i, var1 in enumerate(${JSON.stringify(numericColumns)}):
    for j, var2 in enumerate(${JSON.stringify(numericColumns)}):
        if [var1, var2] in strong_pairs or [var2, var1] in strong_pairs:
            g.axes[i, j].patch.set_facecolor('yellow')
            g.axes[i, j].patch.set_alpha(0.3)

plt.suptitle('Scatterplot Matrix with Correlation Highlighting')
plt.show()

# R/GGally implementation
library(GGally)
library(ggplot2)

ggpairs(data[${JSON.stringify(numericColumns)}],
        lower = list(continuous = wrap("smooth", alpha = 0.3, size = 0.1)),
        diag = list(continuous = wrap("densityDiag", alpha = 0.5)),
        upper = list(continuous = wrap("cor", size = 5))) +
  theme_minimal()`;
  }
  
  analyzeReductionSuitability(data, numericColumns) {
    const dimensionality = numericColumns.length;
    const sampleSize = data.length;
    
    // Simple heuristics for method selection
    let recommendedMethod;
    let expectedQuality;
    let parameterSensitivity;
    
    if (dimensionality > 50) {
      recommendedMethod = 'PCA';
      expectedQuality = 'Medium - linear relationships only';
      parameterSensitivity = 'Low';
    } else if (sampleSize > 5000) {
      recommendedMethod = 'UMAP';
      expectedQuality = 'High - preserves local and some global structure';
      parameterSensitivity = 'Medium';
    } else if (sampleSize > 1000) {
      recommendedMethod = 't-SNE';
      expectedQuality = 'High - excellent for local structure';
      parameterSensitivity = 'High';
    } else {
      recommendedMethod = 'PCA';
      expectedQuality = 'Medium - interpretable components';
      parameterSensitivity = 'Low';
    }
    
    // Estimate PCA explained variance
    const pcaVariance = this.estimatePCAVariance(data, numericColumns);
    
    return {
      recommendedMethod,
      expectedQuality,
      parameterSensitivity,
      pcaVariance,
      alternatives: {
        'PCA': 'Linear, interpretable, fast',
        'UMAP': 'Non-linear, balanced global/local',
        't-SNE': 'Non-linear, excellent clusters'
      }
    };
  }
  
  estimatePCAVariance(data, numericColumns) {
    // Simplified PCA variance estimation
    // In practice, would perform actual PCA
    return {
      pc1: 0.4,
      pc2: 0.25,
      cumulative: 0.65
    };
  }
  
  generateDimensionalityReductionCode(reductionAnalysis, colorColumn) {
    const method = reductionAnalysis.recommendedMethod;
    
    return `# Python dimensionality reduction
import numpy as np
import matplotlib.pyplot as plt
from sklearn.preprocessing import StandardScaler

# Standardize features
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

${method === 'PCA' ? `
# PCA implementation
from sklearn.decomposition import PCA

pca = PCA(n_components=2)
X_reduced = pca.fit_transform(X_scaled)

# Explained variance
print(f'Explained variance ratio: {pca.explained_variance_ratio_}')
print(f'Cumulative explained variance: {pca.explained_variance_ratio_.cumsum()}')
` : method === 'UMAP' ? `
# UMAP implementation
import umap

reducer = umap.UMAP(n_neighbors=${reductionAnalysis.umap?.nNeighbors || 15}, 
                   min_dist=${reductionAnalysis.umap?.minDist || 0.1},
                   metric='${reductionAnalysis.umap?.metric || 'euclidean'}')
X_reduced = reducer.fit_transform(X_scaled)
` : `
# t-SNE implementation
from sklearn.manifold import TSNE

tsne = TSNE(n_components=2, 
           perplexity=${reductionAnalysis.tsne?.perplexity || 30},
           learning_rate=${reductionAnalysis.tsne?.learningRate || 200},
           n_iter=${reductionAnalysis.tsne?.iterations || 1000})
X_reduced = tsne.fit_transform(X_scaled)
`}

# Plot results
plt.figure(figsize=(10, 8))
${colorColumn ? `
colors = df['${colorColumn}']
scatter = plt.scatter(X_reduced[:, 0], X_reduced[:, 1], c=colors, 
                     cmap='tab10', alpha=0.7, s=50)
plt.colorbar(scatter, label='${colorColumn}')
` : `
plt.scatter(X_reduced[:, 0], X_reduced[:, 1], alpha=0.7, s=50)
`}

plt.xlabel('${method} Component 1')
plt.ylabel('${method} Component 2')
plt.title('${method} Dimensionality Reduction')
plt.grid(True, alpha=0.3)
plt.show()

# R implementation
library(Rtsne)  # for t-SNE
library(umap)   # for UMAP
library(prcomp) # for PCA

${method === 'PCA' ? `
pca_result <- prcomp(data[numeric_columns], scale. = TRUE)
plot(pca_result$x[,1:2], col=factor(data$${colorColumn || 'category'}))
` : method === 'UMAP' ? `
umap_result <- umap(data[numeric_columns])
plot(umap_result$layout, col=factor(data$${colorColumn || 'category'}))
` : `
tsne_result <- Rtsne(data[numeric_columns], dims=2, perplexity=30)
plot(tsne_result$Y, col=factor(data$${colorColumn || 'category'}))
`}`;
  }
  
  analyzeProfiles(data, numericColumns, categoryCol) {
    const categories = [...new Set(data.map(r => r[categoryCol]))];
    const profiles = {};
    
    categories.forEach(cat => {
      const categoryData = data.filter(r => r[categoryCol] === cat);
      const profile = {};
      
      numericColumns.forEach(col => {
        const values = categoryData.map(r => r[col]).filter(v => typeof v === 'number');
        profile[col] = values.length > 0 ? 
          values.reduce((a, b) => a + b) / values.length : 0;
      });
      
      profiles[cat] = profile;
    });
    
    // Analyze differences
    const differences = this.calculateProfileDifferences(profiles, numericColumns);
    const dominantDimensions = this.findDominantDimensions(profiles, numericColumns);
    const similarity = this.calculateProfileSimilarity(profiles, numericColumns);
    
    return {
      profiles,
      differences,
      dominantDimensions,
      similarity,
      optimalAxisOrder: this.optimizeRadarAxisOrder(profiles, numericColumns)
    };
  }
  
  calculateProfileDifferences(profiles, numericColumns) {
    const categories = Object.keys(profiles);
    const differences = [];
    
    for (let i = 0; i < categories.length; i++) {
      for (let j = i + 1; j < categories.length; j++) {
        const cat1 = categories[i];
        const cat2 = categories[j];
        
        let totalDiff = 0;
        numericColumns.forEach(col => {
          totalDiff += Math.abs(profiles[cat1][col] - profiles[cat2][col]);
        });
        
        differences.push({
          categories: [cat1, cat2],
          difference: totalDiff / numericColumns.length,
          mostDifferentDimensions: numericColumns
            .map(col => ({
              dimension: col,
              difference: Math.abs(profiles[cat1][col] - profiles[cat2][col])
            }))
            .sort((a, b) => b.difference - a.difference)
            .slice(0, 3)
        });
      }
    }
    
    return differences.sort((a, b) => b.difference - a.difference);
  }
  
  findDominantDimensions(profiles, numericColumns) {
    const dominance = {};
    
    numericColumns.forEach(col => {
      const values = Object.values(profiles).map(p => p[col]);
      const range = Math.max(...values) - Math.min(...values);
      const mean = values.reduce((a, b) => a + b) / values.length;
      
      dominance[col] = {
        range,
        coefficientOfVariation: range / mean,
        discriminatory: range > mean * 0.2
      };
    });
    
    return Object.entries(dominance)
      .filter(([, stats]) => stats.discriminatory)
      .sort((a, b) => b[1].coefficientOfVariation - a[1].coefficientOfVariation)
      .map(([col, stats]) => ({ dimension: col, ...stats }));
  }
  
  calculateProfileSimilarity(profiles, numericColumns) {
    // Calculate cosine similarity between profiles
    const categories = Object.keys(profiles);
    const similarities = [];
    
    for (let i = 0; i < categories.length; i++) {
      for (let j = i + 1; j < categories.length; j++) {
        const cat1 = categories[i];
        const cat2 = categories[j];
        
        const vector1 = numericColumns.map(col => profiles[cat1][col]);
        const vector2 = numericColumns.map(col => profiles[cat2][col]);
        
        const similarity = this.cosineSimilarity(vector1, vector2);
        
        similarities.push({
          categories: [cat1, cat2],
          similarity,
          relationship: similarity > 0.8 ? 'very similar' : 
                       similarity > 0.6 ? 'similar' : 
                       similarity > 0.3 ? 'somewhat similar' : 'different'
        });
      }
    }
    
    return similarities.sort((a, b) => b.similarity - a.similarity);
  }
  
  cosineSimilarity(vec1, vec2) {
    const dotProduct = vec1.reduce((sum, val, idx) => sum + val * vec2[idx], 0);
    const magnitude1 = Math.sqrt(vec1.reduce((sum, val) => sum + val * val, 0));
    const magnitude2 = Math.sqrt(vec2.reduce((sum, val) => sum + val * val, 0));
    
    return magnitude1 * magnitude2 === 0 ? 0 : dotProduct / (magnitude1 * magnitude2);
  }
  
  optimizeRadarAxisOrder(profiles, numericColumns) {
    // Simple optimization to minimize area distortion
    // In practice, would use more sophisticated algorithms
    return numericColumns.sort((a, b) => {
      // Sort by variance to spread out high-variance dimensions
      const aVariance = this.calculateDimensionVariance(profiles, a);
      const bVariance = this.calculateDimensionVariance(profiles, b);
      return bVariance - aVariance;
    });
  }
  
  calculateDimensionVariance(profiles, dimension) {
    const values = Object.values(profiles).map(p => p[dimension]);
    const mean = values.reduce((a, b) => a + b) / values.length;
    return values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  }
  
  generateRadarChartCode(numericColumns, categoryCol, profileAnalysis) {
    return `# D3.js Radar Chart implementation
const margin = {top: 50, right: 50, bottom: 50, left: 50};
const width = 500 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;
const radius = Math.min(width, height) / 2;

const svg = d3.select("#chart")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", \`translate(\${width/2 + margin.left},\${height/2 + margin.top})\`);

// Data preparation
const dimensions = ${JSON.stringify(numericColumns)};
const categories = [...new Set(data.map(d => d.${categoryCol}))];

// Scales
const angleScale = d3.scalePoint()
  .domain(dimensions)
  .range([0, 2 * Math.PI]);

const radialScale = d3.scaleLinear()
  .domain([0, 1])  // Assuming normalized data
  .range([0, radius]);

// Create grid
const gridLevels = 5;
for (let i = 1; i <= gridLevels; i++) {
  const gridRadius = (radius / gridLevels) * i;
  
  svg.append("polygon")
    .attr("points", dimensions.map(d => {
      const angle = angleScale(d) - Math.PI/2;
      const x = Math.cos(angle) * gridRadius;
      const y = Math.sin(angle) * gridRadius;
      return \`\${x},\${y}\`;
    }).join(" "))
    .style("fill", "none")
    .style("stroke", "#ccc")
    .style("stroke-width", 1);
}

// Add axes
svg.selectAll(".axis")
  .data(dimensions)
  .enter()
  .append("line")
  .attr("x1", 0)
  .attr("y1", 0)
  .attr("x2", d => {
    const angle = angleScale(d) - Math.PI/2;
    return Math.cos(angle) * radius;
  })
  .attr("y2", d => {
    const angle = angleScale(d) - Math.PI/2;
    return Math.sin(angle) * radius;
  })
  .style("stroke", "#999")
  .style("stroke-width", 1);

// Add axis labels
svg.selectAll(".axis-label")
  .data(dimensions)
  .enter()
  .append("text")
  .attr("x", d => {
    const angle = angleScale(d) - Math.PI/2;
    return Math.cos(angle) * (radius + 20);
  })
  .attr("y", d => {
    const angle = angleScale(d) - Math.PI/2;
    return Math.sin(angle) * (radius + 20);
  })
  .style("text-anchor", "middle")
  .text(d => d);

// Color scale
const color = d3.scaleOrdinal()
  .domain(categories)
  .range(d3.schemeCategory10);

// Draw radar areas
categories.forEach(category => {
  const categoryData = data.filter(d => d.${categoryCol} === category);
  
  // Calculate average for each dimension
  const avgData = dimensions.map(dim => {
    const values = categoryData.map(d => d[dim]).filter(v => typeof v === 'number');
    return values.reduce((a, b) => a + b, 0) / values.length;
  });
  
  // Create path
  const pathData = dimensions.map((dim, i) => {
    const angle = angleScale(dim) - Math.PI/2;
    const value = avgData[i];
    const x = Math.cos(angle) * radialScale(value);
    const y = Math.sin(angle) * radialScale(value);
    return \`\${x},\${y}\`;
  }).join(" ");
  
  svg.append("polygon")
    .attr("points", pathData)
    .style("fill", color(category))
    .style("fill-opacity", 0.3)
    .style("stroke", color(category))
    .style("stroke-width", 2);
});

# Python/Plotly implementation
import plotly.graph_objects as go
import pandas as pd

categories = df['${categoryCol}'].unique()
dimensions = ${JSON.stringify(numericColumns)}

fig = go.Figure()

for category in categories:
    cat_data = df[df['${categoryCol}'] == category]
    
    # Calculate means for each dimension
    values = [cat_data[dim].mean() for dim in dimensions]
    
    fig.add_trace(go.Scatterpolar(
        r=values + [values[0]],  # Close the polygon
        theta=dimensions + [dimensions[0]],
        fill='toself',
        name=category,
        opacity=0.6
    ))

fig.update_layout(
    polar=dict(
        radialaxis=dict(
            visible=True,
            range=[0, max([df[dim].max() for dim in dimensions])]
        )),
    showlegend=True,
    title="Radar Chart Comparison"
)

fig.show()`;
  }
  
  analyzeStarPlotSuitability(data, numericColumns) {
    const observations = data.length;
    
    // Calculate optimal layout
    const gridSize = Math.ceil(Math.sqrt(observations));
    const starSize = Math.max(50, Math.min(150, 800 / gridSize));
    
    // Identify outliers and clusters
    const normalizedData = this.normalizeData(data, numericColumns);
    const outliers = this.detectMultivariateOutliers(normalizedData);
    const clusters = this.performSimpleClustering(normalizedData, Math.min(5, Math.floor(observations / 10)));
    
    // Find dominant variables
    const dominantVariables = numericColumns.map(col => {
      const values = data.map(r => r[col]).filter(v => typeof v === 'number');
      const variance = this.calculateVariance(values);
      return { variable: col, variance };
    }).sort((a, b) => b.variance - a.variance);
    
    return {
      optimalLayout: { rows: gridSize, cols: gridSize },
      starSize,
      outliers: outliers.slice(0, 5),
      clusters: clusters.map((cluster, idx) => ({
        id: idx,
        size: cluster.length,
        representative: cluster[0] // Simplified
      })),
      dominantVariables: dominantVariables.slice(0, 3)
    };
  }
  
  calculateVariance(values) {
    const mean = values.reduce((a, b) => a + b) / values.length;
    return values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  }
  
  generateStarPlotsCode(numericColumns, starAnalysis) {
    return `# Python Star Plots implementation
import matplotlib.pyplot as plt
import numpy as np
from math import pi

def create_star_plot(values, labels, ax, title=""):
    # Number of variables
    N = len(labels)
    
    # Angle for each axis
    angles = [n / float(N) * 2 * pi for n in range(N)]
    angles += angles[:1]  # Complete the circle
    
    # Add values for closing the plot
    values += values[:1]
    
    # Plot
    ax.plot(angles, values, 'o-', linewidth=2)
    ax.fill(angles, values, alpha=0.25)
    
    # Add labels
    ax.set_xticks(angles[:-1])
    ax.set_xticklabels(labels)
    ax.set_ylim(0, 1)
    ax.set_title(title)
    ax.grid(True)

# Create subplot grid
rows, cols = ${starAnalysis.optimalLayout.rows}, ${starAnalysis.optimalLayout.cols}
fig, axes = plt.subplots(rows, cols, figsize=(15, 15), 
                        subplot_kw=dict(projection='polar'))

labels = ${JSON.stringify(numericColumns)}

# Normalize data
scaler = MinMaxScaler()
normalized_data = scaler.fit_transform(df[labels])

# Create star plot for each observation
for i, (idx, row) in enumerate(df.iterrows()):
    if i >= rows * cols:
        break
        
    ax = axes.flat[i] if rows * cols > 1 else axes
    values = normalized_data[i].tolist()
    
    create_star_plot(values, labels, ax, f"Observation {idx}")

# Hide empty subplots
for i in range(len(df), rows * cols):
    if rows * cols > 1:
        axes.flat[i].set_visible(False)

plt.tight_layout()
plt.show()

# R implementation
library(fmsb)

# Prepare data for star plots
star_data <- rbind(rep(1, length(${JSON.stringify(numericColumns)})),  # Max
                   rep(0, length(${JSON.stringify(numericColumns)})),  # Min
                   scaled_data)

# Create star plots
par(mfrow=c(${starAnalysis.optimalLayout.rows}, ${starAnalysis.optimalLayout.cols}))

for(i in 1:min(nrow(data), ${starAnalysis.optimalLayout.rows * starAnalysis.optimalLayout.cols})) {
  radarchart(star_data[c(1,2,i+2),], 
            title=paste("Observation", i),
            pcol=rainbow(1), 
            pfcol=rainbow(1, alpha=0.3))
}`;
  }
  
  performAdvancedCorrelationAnalysis(data, numericColumns) {
    const correlationMatrix = this.calculateDetailedCorrelations(data, numericColumns);
    
    // Perform hierarchical clustering of variables
    const clustering = this.performHierarchicalClustering(correlationMatrix);
    
    // Identify groups and isolated variables
    const groups = this.identifyCorrelationGroups(correlationMatrix, 0.5);
    const isolated = this.findIsolatedVariables(correlationMatrix, 0.3);
    
    return {
      correlationMatrix,
      clustering,
      groups,
      isolatedVariables: isolated,
      strongestCluster: groups[0] || null
    };
  }
  
  performHierarchicalClustering(correlationMatrix) {
    // Simplified hierarchical clustering
    // In practice, would use proper clustering algorithms
    const variables = Object.keys(correlationMatrix);
    
    return {
      dendrogram: 'Hierarchical structure of variables',
      clusters: this.generateSimpleClusters(variables),
      optimalClusters: Math.min(5, Math.floor(variables.length / 2))
    };
  }
  
  generateSimpleClusters(variables) {
    // Simplified clustering - would use actual algorithm
    const numClusters = Math.min(3, Math.floor(variables.length / 2));
    const clusters = Array.from({ length: numClusters }, () => []);
    
    variables.forEach((variable, idx) => {
      clusters[idx % numClusters].push(variable);
    });
    
    return clusters.filter(cluster => cluster.length > 0);
  }
  
  identifyCorrelationGroups(correlationMatrix, threshold) {
    const variables = Object.keys(correlationMatrix);
    const groups = [];
    const used = new Set();
    
    variables.forEach(var1 => {
      if (used.has(var1)) return;
      
      const group = [var1];
      used.add(var1);
      
      variables.forEach(var2 => {
        if (var1 !== var2 && !used.has(var2)) {
          if (Math.abs(correlationMatrix[var1][var2]) >= threshold) {
            group.push(var2);
            used.add(var2);
          }
        }
      });
      
      if (group.length > 1) {
        groups.push({
          variables: group,
          avgCorrelation: this.calculateGroupAverageCorrelation(group, correlationMatrix)
        });
      }
    });
    
    return groups.sort((a, b) => b.avgCorrelation - a.avgCorrelation);
  }
  
  calculateGroupAverageCorrelation(group, correlationMatrix) {
    let sum = 0;
    let count = 0;
    
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        sum += Math.abs(correlationMatrix[group[i]][group[j]]);
        count++;
      }
    }
    
    return count > 0 ? sum / count : 0;
  }
  
  findIsolatedVariables(correlationMatrix, threshold) {
    const variables = Object.keys(correlationMatrix);
    const isolated = [];
    
    variables.forEach(var1 => {
      const maxCorrelation = Math.max(
        ...variables
          .filter(var2 => var1 !== var2)
          .map(var2 => Math.abs(correlationMatrix[var1][var2]))
      );
      
      if (maxCorrelation < threshold) {
        isolated.push({
          variable: var1,
          maxCorrelation
        });
      }
    });
    
    return isolated;
  }
  
  generateHierarchicalHeatmapCode(correlationAnalysis) {
    return `# Python hierarchical correlation heatmap
import seaborn as sns
import matplotlib.pyplot as plt
import scipy.cluster.hierarchy as sch
from scipy.spatial.distance import squareform
import numpy as np

# Prepare correlation matrix
corr_matrix = df.corr()

# Calculate distance matrix (1 - |correlation|)
distance_matrix = 1 - np.abs(corr_matrix)

# Perform hierarchical clustering
linkage_matrix = sch.linkage(squareform(distance_matrix), method='ward')
dendro = sch.dendrogram(linkage_matrix, labels=corr_matrix.columns, no_plot=True)

# Reorder matrix based on clustering
cluster_order = dendro['leaves']
reordered_corr = corr_matrix.iloc[cluster_order, cluster_order]

# Create clustered heatmap
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(15, 6))

# Dendrogram
sch.dendrogram(linkage_matrix, labels=corr_matrix.columns, 
               orientation='left', ax=ax1)
ax1.set_title('Variable Clustering')

# Heatmap
mask = np.triu(np.ones_like(reordered_corr, dtype=bool))
sns.heatmap(reordered_corr, mask=mask, annot=True, cmap='RdBu_r',
           center=0, square=True, cbar_kws={'label': 'Correlation'},
           ax=ax2)
ax2.set_title('Clustered Correlation Heatmap')

plt.tight_layout()
plt.show()

# Interactive version with Plotly
import plotly.graph_objects as go
import plotly.figure_factory as ff

# Create dendrogram
dendro_fig = ff.create_dendrogram(distance_matrix.values, 
                                 labels=corr_matrix.columns)

# Create heatmap
heatmap_fig = go.Figure(data=go.Heatmap(
    z=reordered_corr.values,
    x=reordered_corr.columns,
    y=reordered_corr.columns,
    colorscale='RdBu',
    zmid=0,
    text=np.round(reordered_corr.values, 3),
    texttemplate="%{text}",
    textfont={"size": 10},
    hoverongaps=False
))

heatmap_fig.update_layout(
    title="Interactive Clustered Correlation Heatmap",
    width=800,
    height=800
)

heatmap_fig.show()`;
  }
  
  calculateRelationshipStrengths(data, numericColumns) {
    const relationships = [];
    
    for (let i = 0; i < numericColumns.length; i++) {
      for (let j = i + 1; j < numericColumns.length; j++) {
        const var1 = numericColumns[i];
        const var2 = numericColumns[j];
        const correlation = Math.abs(this.calculateCorrelation(data, var1, var2));
        
        if (correlation > 0.3) {
          relationships.push({
            var1,
            var2,
            strength: correlation,
            type: 'correlation'
          });
        }
      }
    }
    
    return relationships.sort((a, b) => b.strength - a.strength);
  }
  
  generateChordDiagramCode(numericColumns, relationships) {
    return `# D3.js Chord Diagram implementation
const width = 600;
const height = 600;
const outerRadius = Math.min(width, height) * 0.5 - 40;
const innerRadius = outerRadius - 30;

const svg = d3.select("#chart")
  .append("svg")
  .attr("width", width)
  .attr("height", height)
  .append("g")
  .attr("transform", \`translate(\${width/2},\${height/2})\`);

// Prepare data
const variables = ${JSON.stringify(numericColumns)};
const relationships = ${JSON.stringify(relationships)};

// Create matrix
const matrix = Array(variables.length).fill().map(() => Array(variables.length).fill(0));

relationships.forEach(rel => {
  const i = variables.indexOf(rel.var1);
  const j = variables.indexOf(rel.var2);
  matrix[i][j] = rel.strength;
  matrix[j][i] = rel.strength;
});

// Create chord layout
const chord = d3.chord()
  .padAngle(0.05)
  .sortSubgroups(d3.descending);

const chords = chord(matrix);

// Color scale
const color = d3.scaleOrdinal()
  .domain(variables)
  .range(d3.schemeCategory10);

// Draw groups (arcs)
const group = svg.append("g")
  .selectAll("g")
  .data(chords.groups)
  .enter().append("g");

group.append("path")
  .style("fill", d => color(variables[d.index]))
  .style("stroke", d => d3.rgb(color(variables[d.index])).darker())
  .attr("d", d3.arc().innerRadius(innerRadius).outerRadius(outerRadius));

// Add labels
group.append("text")
  .each(d => { d.angle = (d.startAngle + d.endAngle) / 2; })
  .attr("dy", ".35em")
  .attr("transform", d => \`
    rotate(\${(d.angle * 180 / Math.PI - 90)})
    translate(\${outerRadius + 10})
    \${d.angle > Math.PI ? "rotate(180)" : ""}
  \`)
  .style("text-anchor", d => d.angle > Math.PI ? "end" : null)
  .text(d => variables[d.index]);

// Draw chords
svg.append("g")
  .attr("fill-opacity", 0.6)
  .selectAll("path")
  .data(chords)
  .enter().append("path")
  .attr("d", d3.ribbon().radius(innerRadius))
  .style("fill", d => color(variables[d.source.index]))
  .style("stroke", d => d3.rgb(color(variables[d.source.index])).darker())
  .on("mouseover", function(event, d) {
    d3.select(this).style("fill-opacity", 0.8);
  })
  .on("mouseout", function(event, d) {
    d3.select(this).style("fill-opacity", 0.6);
  });

# Python/Plotly implementation
import plotly.graph_objects as go
import numpy as np

# Create adjacency matrix
variables = ${JSON.stringify(numericColumns)}
n_vars = len(variables)
matrix = np.zeros((n_vars, n_vars))

relationships = ${JSON.stringify(relationships)}
for rel in relationships:
    i = variables.index(rel['var1'])
    j = variables.index(rel['var2'])
    matrix[i][j] = rel['strength']
    matrix[j][i] = rel['strength']

# Create chord diagram using plotly
fig = go.Figure(data=[go.Sankey(
    node=dict(
        pad=15,
        thickness=20,
        line=dict(color="black", width=0.5),
        label=variables,
        color="blue"
    ),
    link=dict(
        source=[rel['var1'] for rel in relationships],
        target=[rel['var2'] for rel in relationships],
        value=[rel['strength'] for rel in relationships]
    )
)])

fig.update_layout(title_text="Variable Relationships", font_size=10)
fig.show()`;
  }
}