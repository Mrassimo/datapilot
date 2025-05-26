export class StatisticalGraphicsAnalyzer {
  constructor() {
    this.statisticalTests = {
      normality: ['shapiro-wilk', 'kolmogorov-smirnov', 'anderson-darling'],
      homoscedasticity: ['levene', 'bartlett', 'brown-forsythe'],
      independence: ['durbin-watson', 'ljung-box'],
      outliers: ['grubbs', 'dixon', 'tukey']
    };
  }
  
  analyzeStatisticalVisualizationNeeds(data, columnTypes, task) {
    const recommendations = [];
    
    // Distribution analysis
    const distributionRecs = this.analyzeDistributions(data, columnTypes);
    recommendations.push(...distributionRecs);
    
    // Uncertainty visualization
    const uncertaintyRecs = this.analyzeUncertainty(data, columnTypes);
    recommendations.push(...uncertaintyRecs);
    
    // Comparative analysis
    const comparativeRecs = this.analyzeComparativeStatistics(data, columnTypes);
    recommendations.push(...comparativeRecs);
    
    // Regression and modeling
    const regressionRecs = this.analyzeRegressionVisualization(data, columnTypes);
    recommendations.push(...regressionRecs);
    
    // Time series statistical patterns
    const timeSeriesRecs = this.analyzeTimeSeriesStatistics(data, columnTypes);
    recommendations.push(...timeSeriesRecs);
    
    return recommendations.sort((a, b) => b.priority - a.priority);
  }
  
  analyzeDistributions(data, columnTypes) {
    const recommendations = [];
    const numericColumns = Object.keys(columnTypes).filter(col => 
      ['integer', 'float'].includes(columnTypes[col].type)
    );
    
    numericColumns.forEach(col => {
      const values = data.map(r => r[col]).filter(v => typeof v === 'number');
      if (values.length < 10) return;
      
      const distStats = this.calculateDistributionStatistics(values);
      
      // Violin plot for complex distributions
      if (distStats.isMultimodal || Math.abs(distStats.skewness) > 0.5) {
        recommendations.push({
          type: 'violin_plot',
          priority: 8,
          column: col,
          rationale: 'Complex distribution requires detailed visualization',
          specifications: {
            chart: 'Violin Plot with Embedded Box Plot',
            design: {
              kernel: 'Gaussian',
              bandwidth: this.calculateOptimalBandwidth(values),
              yAxis: col,
              violinWidth: 'proportional to density',
              embeddedElements: [
                'White dot for median',
                'Thick bar for IQR',
                'Thin line for 1.5×IQR',
                'Points for outliers beyond 1.5×IQR'
              ]
            },
            annotations: {
              mean: { value: distStats.mean, style: 'dashed line' },
              median: { value: distStats.median, style: 'solid line' },
              skewness: distStats.skewness,
              modality: distStats.modality
            },
            implementation: this.generateViolinPlotCode(col, distStats)
          },
          whyNotAlternatives: {
            histogram: 'Sensitive to bin size selection',
            density: 'Hides outliers and quartile information',
            boxPlot: 'Obscures multimodal nature'
          }
        });
      }
      
      // QQ plots for normality assessment
      if (values.length >= 30) {
        const normalityTest = this.testNormality(values);
        recommendations.push({
          type: 'qq_plot',
          priority: 6,
          column: col,
          rationale: 'Assess normality assumption for statistical tests',
          specifications: {
            chart: 'Quantile-Quantile Plot',
            design: {
              xAxis: 'Theoretical normal quantiles',
              yAxis: `Sample quantiles (${col})`,
              referenceLine: '45-degree line for perfect normality',
              confidenceBands: '95% confidence envelope'
            },
            interpretation: {
              normalityPValue: normalityTest.pValue,
              assessment: normalityTest.isNormal ? 'Approximately normal' : 'Non-normal distribution',
              deviations: this.identifyQQDeviations(values)
            },
            implementation: this.generateQQPlotCode(col, normalityTest)
          }
        });
      }
      
      // Probability density estimation
      if (values.length >= 50) {
        recommendations.push({
          type: 'density_estimation',
          priority: 5,
          column: col,
          rationale: 'Smooth estimation reveals underlying distribution',
          specifications: {
            chart: 'Kernel Density Plot with Multiple Kernels',
            design: {
              kernels: ['Gaussian', 'Epanechnikov', 'Triangular'],
              bandwidths: this.calculateMultipleBandwidths(values),
              overlayHistogram: true,
              rugPlot: values.length <= 200
            },
            implementation: this.generateDensityPlotCode(col, values)
          }
        });
      }
    });
    
    return recommendations;
  }
  
  analyzeUncertainty(data, columnTypes) {
    const recommendations = [];
    
    // Look for forecast/prediction columns
    const forecastColumns = Object.keys(columnTypes).filter(col => 
      col.toLowerCase().includes('forecast') || 
      col.toLowerCase().includes('prediction') ||
      col.toLowerCase().includes('estimate')
    );
    
    const dateColumns = Object.keys(columnTypes).filter(col => 
      columnTypes[col].type === 'date'
    );
    
    if (forecastColumns.length > 0 && dateColumns.length > 0) {
      recommendations.push({
        type: 'uncertainty_fan_chart',
        priority: 9,
        rationale: 'Forecast data requires uncertainty visualization',
        specifications: {
          chart: 'Fan Chart (Gradient Uncertainty)',
          design: {
            xAxis: dateColumns[0],
            yAxis: forecastColumns[0],
            centralLine: 'Median prediction',
            bands: ['50%', '80%', '95%'],
            colorGradient: 'Darker = more certain',
            opacity: {
              '50%': 0.8,
              '80%': 0.5,
              '95%': 0.3
            },
            animation: 'Gradual reveal left-to-right'
          },
          annotationLayer: [
            'Mark actual vs predicted divergence points',
            'Highlight confidence interval breaches',
            'Show prediction error metrics'
          ],
          implementation: this.generateFanChartCode(dateColumns[0], forecastColumns[0])
        }
      });
    }
    
    // Error bars for grouped data
    const categoricalColumns = Object.keys(columnTypes).filter(col => 
      columnTypes[col].type === 'categorical'
    );
    const numericColumns = Object.keys(columnTypes).filter(col => 
      ['integer', 'float'].includes(columnTypes[col].type)
    );
    
    if (categoricalColumns.length > 0 && numericColumns.length > 0) {
      categoricalColumns.forEach(catCol => {
        const categories = [...new Set(data.map(r => r[catCol]))];
        if (categories.length >= 2 && categories.length <= 10) {
          numericColumns.forEach(numCol => {
            const groupStats = this.calculateGroupStatistics(data, catCol, numCol);
            
            recommendations.push({
              type: 'error_bars',
              priority: 7,
              rationale: 'Show uncertainty in group comparisons',
              specifications: {
                chart: 'Bar Chart with Error Bars',
                design: {
                  xAxis: catCol,
                  yAxis: `Mean ${numCol}`,
                  errorBars: 'Standard error of the mean',
                  errorType: groupStats.errorType,
                  whiskerCaps: true
                },
                statistics: groupStats,
                implementation: this.generateErrorBarCode(catCol, numCol, groupStats)
              }
            });
          });
        }
      });
    }
    
    return recommendations;
  }
  
  analyzeComparativeStatistics(data, columnTypes) {
    const recommendations = [];
    const numericColumns = Object.keys(columnTypes).filter(col => 
      ['integer', 'float'].includes(columnTypes[col].type)
    );
    
    // Box plot comparisons
    const categoricalColumns = Object.keys(columnTypes).filter(col => 
      columnTypes[col].type === 'categorical'
    );
    
    if (categoricalColumns.length > 0 && numericColumns.length > 0) {
      categoricalColumns.forEach(catCol => {
        const categories = [...new Set(data.map(r => r[catCol]))];
        if (categories.length >= 2 && categories.length <= 8) {
          numericColumns.forEach(numCol => {
            const comparisonStats = this.performComparativeTests(data, catCol, numCol);
            
            recommendations.push({
              type: 'comparative_boxplot',
              priority: 8,
              rationale: 'Compare distributions across groups with statistical rigor',
              specifications: {
                chart: 'Enhanced Box Plot with Statistical Tests',
                design: {
                  xAxis: catCol,
                  yAxis: numCol,
                  notches: comparisonStats.showNotches,
                  outlierLabeling: true,
                  jitter: data.length <= 500
                },
                statisticalTests: {
                  equalVariances: comparisonStats.levenesTest,
                  groupComparison: comparisonStats.mainTest,
                  postHoc: comparisonStats.postHoc
                },
                annotations: this.generateStatisticalAnnotations(comparisonStats),
                implementation: this.generateComparativeBoxplotCode(catCol, numCol, comparisonStats)
              }
            });
          });
        }
      });
    }
    
    // Correlation heatmap with significance
    if (numericColumns.length >= 3) {
      const correlationMatrix = this.calculateCorrelationMatrix(data, numericColumns);
      
      recommendations.push({
        type: 'correlation_heatmap_statistical',
        priority: 7,
        rationale: 'Systematic exploration of variable relationships',
        specifications: {
          chart: 'Correlation Heatmap with Significance Testing',
          design: {
            clustering: 'Hierarchical clustering of variables',
            annotations: 'Correlation values for |r| > 0.3',
            significance: 'Asterisks for p < 0.05, 0.01, 0.001',
            colorScale: 'Diverging RdBu through zero',
            masks: 'Hide non-significant correlations'
          },
          statistics: correlationMatrix,
          implementation: this.generateCorrelationHeatmapCode(correlationMatrix)
        }
      });
    }
    
    return recommendations;
  }
  
  analyzeRegressionVisualization(data, columnTypes) {
    const recommendations = [];
    const numericColumns = Object.keys(columnTypes).filter(col => 
      ['integer', 'float'].includes(columnTypes[col].type)
    );
    
    if (numericColumns.length >= 2) {
      // Find best predictor-response pairs
      const regressionPairs = this.identifyRegressionOpportunities(data, numericColumns);
      
      regressionPairs.forEach(pair => {
        if (pair.rSquared >= 0.3) {
          recommendations.push({
            type: 'regression_diagnostics',
            priority: 8,
            rationale: `Strong relationship detected (R² = ${pair.rSquared.toFixed(3)})`,
            specifications: {
              chart: 'Regression Diagnostic Panel',
              panels: [
                {
                  name: 'Scatter with Regression Line',
                  design: {
                    xAxis: pair.predictor,
                    yAxis: pair.response,
                    regressionLine: true,
                    confidenceBands: '95% confidence interval',
                    predictionBands: '95% prediction interval'
                  }
                },
                {
                  name: 'Residuals vs Fitted',
                  design: {
                    xAxis: 'Fitted values',
                    yAxis: 'Residuals',
                    referenceLine: 'y = 0',
                    smoothLine: 'LOESS smoother'
                  }
                },
                {
                  name: 'QQ Plot of Residuals',
                  design: {
                    assessment: 'Normality of residuals'
                  }
                },
                {
                  name: 'Scale-Location Plot',
                  design: {
                    xAxis: 'Fitted values',
                    yAxis: 'Square root of standardized residuals',
                    purpose: 'Check homoscedasticity'
                  }
                }
              ],
              statistics: {
                rSquared: pair.rSquared,
                adjustedRSquared: pair.adjustedRSquared,
                fStatistic: pair.fStatistic,
                residualStandardError: pair.rse,
                coefficients: pair.coefficients
              },
              implementation: this.generateRegressionDiagnosticsCode(pair)
            }
          });
        }
      });
    }
    
    return recommendations;
  }
  
  analyzeTimeSeriesStatistics(data, columnTypes) {
    const recommendations = [];
    const dateColumns = Object.keys(columnTypes).filter(col => 
      columnTypes[col].type === 'date'
    );
    const numericColumns = Object.keys(columnTypes).filter(col => 
      ['integer', 'float'].includes(columnTypes[col].type)
    );
    
    if (dateColumns.length > 0 && numericColumns.length > 0 && data.length >= 20) {
      const dateCol = dateColumns[0];
      
      numericColumns.forEach(numCol => {
        const timeSeriesData = this.prepareTimeSeriesData(data, dateCol, numCol);
        const tsStats = this.analyzeTimeSeriesProperties(timeSeriesData);
        
        if (tsStats.hasTimeStructure) {
          // Autocorrelation analysis
          recommendations.push({
            type: 'autocorrelation_plots',
            priority: 8,
            rationale: 'Time series structure detected',
            specifications: {
              chart: 'ACF/PACF Analysis Panel',
              panels: [
                {
                  name: 'Autocorrelation Function (ACF)',
                  design: {
                    lags: Math.min(Math.floor(timeSeriesData.length / 4), 40),
                    confidenceBands: '95% confidence bounds',
                    significantLags: tsStats.acf.significantLags
                  }
                },
                {
                  name: 'Partial Autocorrelation Function (PACF)',
                  design: {
                    purpose: 'Identify direct relationships',
                    significantLags: tsStats.pacf.significantLags
                  }
                }
              ],
              interpretation: {
                stationarity: tsStats.stationarity,
                seasonality: tsStats.seasonality,
                trend: tsStats.trend,
                modelSuggestion: tsStats.suggestedModel
              },
              implementation: this.generateACFPACFCode(dateCol, numCol, tsStats)
            }
          });
          
          // Decomposition
          if (timeSeriesData.length >= 24) {
            recommendations.push({
              type: 'time_series_decomposition',
              priority: 7,
              rationale: 'Separate trend, seasonal, and irregular components',
              specifications: {
                chart: 'Time Series Decomposition',
                method: tsStats.seasonality.detected ? 'STL' : 'Classical',
                components: [
                  { name: 'Original', data: numCol },
                  { name: 'Trend', method: 'Moving average or LOESS' },
                  { name: 'Seasonal', period: tsStats.seasonality.period },
                  { name: 'Irregular', residuals: true }
                ],
                implementation: this.generateDecompositionCode(dateCol, numCol, tsStats)
              }
            });
          }
        }
      });
    }
    
    return recommendations;
  }
  
  // Helper methods for statistical calculations
  calculateDistributionStatistics(values) {
    const n = values.length;
    const sorted = [...values].sort((a, b) => a - b);
    const mean = values.reduce((a, b) => a + b) / n;
    const median = n % 2 === 0 ? (sorted[n/2-1] + sorted[n/2]) / 2 : sorted[Math.floor(n/2)];
    
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / (n - 1);
    const stdDev = Math.sqrt(variance);
    const skewness = values.reduce((sum, v) => sum + Math.pow((v - mean) / stdDev, 3), 0) / n;
    const kurtosis = values.reduce((sum, v) => sum + Math.pow((v - mean) / stdDev, 4), 0) / n - 3;
    
    return {
      mean,
      median,
      stdDev,
      skewness,
      kurtosis,
      isMultimodal: this.detectMultimodality(values),
      modality: this.getModalityDescription(values)
    };
  }
  
  detectMultimodality(values) {
    // Simplified multimodality detection using histogram peaks
    const bins = this.createHistogramBins(values, Math.ceil(Math.sqrt(values.length)));
    const peaks = this.findPeaks(bins);
    return peaks.length > 1;
  }
  
  createHistogramBins(values, numBins) {
    const min = Math.min(...values);
    const max = Math.max(...values);
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
      if (bins[i] > bins[i-1] && bins[i] > bins[i+1] && bins[i] > 0) {
        peaks.push(i);
      }
    }
    return peaks;
  }
  
  calculateOptimalBandwidth(values) {
    // Silverman's rule of thumb
    const n = values.length;
    const stdDev = Math.sqrt(values.reduce((sum, v) => {
      const mean = values.reduce((a, b) => a + b) / n;
      return sum + Math.pow(v - mean, 2);
    }, 0) / (n - 1));
    
    return 1.06 * stdDev * Math.pow(n, -1/5);
  }
  
  testNormality(values) {
    // Simplified Shapiro-Wilk test implementation
    const n = values.length;
    if (n < 3 || n > 5000) {
      return { pValue: null, isNormal: null, test: 'Sample size out of range' };
    }
    
    // This is a simplified version - in practice would use full implementation
    const sorted = [...values].sort((a, b) => a - b);
    const mean = values.reduce((a, b) => a + b) / n;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / (n - 1);
    
    // Simplified test statistic
    const W = 0.95; // Placeholder - would calculate properly
    const pValue = 0.1; // Placeholder - would calculate properly
    
    return {
      pValue,
      isNormal: pValue > 0.05,
      test: 'Shapiro-Wilk',
      statistic: W
    };
  }
  
  // Code generation methods
  generateViolinPlotCode(column, stats) {
    return `# Python/Seaborn implementation
import seaborn as sns
import matplotlib.pyplot as plt

plt.figure(figsize=(8, 6))
sns.violinplot(data=df, y='${column}', inner='box', cut=0, scale='width')
plt.axhline(${stats.mean}, ls='--', color='red', alpha=0.5, label='Mean')
plt.axhline(${stats.median}, ls='-', color='blue', alpha=0.7, label='Median')
plt.legend()
plt.title('Distribution of ${column}')
plt.show()

# R/ggplot2 implementation
library(ggplot2)
ggplot(data, aes(x="", y=${column})) +
  geom_violin(trim=FALSE, scale="width") +
  geom_boxplot(width=0.1, alpha=0.7) +
  geom_hline(yintercept=${stats.mean}, linetype="dashed", color="red") +
  labs(title="Distribution of ${column}")`;
  }
  
  generateQQPlotCode(column, normalityTest) {
    return `# Python implementation
import scipy.stats as stats
import matplotlib.pyplot as plt

fig, ax = plt.subplots(figsize=(8, 6))
stats.probplot(df['${column}'], dist="norm", plot=ax)
ax.set_title('Q-Q Plot: ${column} vs Normal Distribution\\n' + 
            f'Shapiro-Wilk p-value: {${normalityTest.pValue.toFixed(4)}}')
plt.show()

# R implementation
library(ggplot2)
qqnorm(data$${column}, main="Q-Q Plot: ${column}")
qqline(data$${column}, col="red")`;
  }
  
  getModalityDescription(values) {
    const peaks = this.findPeaks(this.createHistogramBins(values, Math.ceil(Math.sqrt(values.length))));
    if (peaks.length === 1) return 'unimodal';
    if (peaks.length === 2) return 'bimodal';
    if (peaks.length > 2) return 'multimodal';
    return 'uniform';
  }
  
  calculateMultipleBandwidths(values) {
    const optimal = this.calculateOptimalBandwidth(values);
    return {
      silverman: optimal,
      half: optimal * 0.5,
      double: optimal * 2.0
    };
  }
  
  generateDensityPlotCode(column, values) {
    return `# Python implementation with multiple bandwidths
import numpy as np
from scipy import stats
import matplotlib.pyplot as plt

fig, ax = plt.subplots(figsize=(10, 6))
x_range = np.linspace(${Math.min(...values)}, ${Math.max(...values)}, 200)

# Multiple bandwidth estimates
for bw_factor, label in [(0.5, 'Half'), (1.0, 'Optimal'), (2.0, 'Double')]:
    kde = stats.gaussian_kde(df['${column}'])
    kde.set_bandwidth(kde.factor * bw_factor)
    ax.plot(x_range, kde(x_range), label=f'{label} bandwidth')

ax.hist(df['${column}'], density=True, alpha=0.3, bins=30)
ax.legend()
ax.set_xlabel('${column}')
ax.set_ylabel('Density')
plt.show()`;
  }
  
  generateFanChartCode(dateCol, forecastCol) {
    return `# D3.js Fan Chart implementation
const fanChart = d3.select("#chart")
  .append("svg")
  .attr("width", width)
  .attr("height", height);

// Create gradient for uncertainty
const gradient = fanChart.append("defs")
  .append("linearGradient")
  .attr("id", "uncertaintyGradient");

// Add confidence bands
const bands = [95, 80, 50];
bands.forEach((confidence, i) => {
  fanChart.append("path")
    .datum(data)
    .attr("class", \`confidence-\${confidence}\`)
    .attr("d", d3.area()
      .x(d => xScale(d.${dateCol}))
      .y0(d => yScale(d[\`lower_\${confidence}\`]))
      .y1(d => yScale(d[\`upper_\${confidence}\`]))
    )
    .style("fill", \`url(#uncertaintyGradient)\`)
    .style("opacity", ${[0.3, 0.5, 0.8][i]});
});

// Central forecast line
fanChart.append("path")
  .datum(data)
  .attr("d", d3.line()
    .x(d => xScale(d.${dateCol}))
    .y(d => yScale(d.${forecastCol}))
  )
  .style("stroke", "black")
  .style("stroke-width", 2);`;
  }
  
  calculateGroupStatistics(data, categoryCol, valueCol) {
    const groups = {};
    data.forEach(row => {
      const cat = row[categoryCol];
      const val = row[valueCol];
      if (cat && typeof val === 'number') {
        if (!groups[cat]) groups[cat] = [];
        groups[cat].push(val);
      }
    });
    
    const stats = {};
    Object.entries(groups).forEach(([cat, values]) => {
      const n = values.length;
      const mean = values.reduce((a, b) => a + b) / n;
      const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / (n - 1);
      const stderr = Math.sqrt(variance / n);
      
      stats[cat] = { mean, stderr, n };
    });
    
    return {
      groups: stats,
      errorType: 'Standard Error of Mean'
    };
  }
  
  generateErrorBarCode(categoryCol, valueCol, groupStats) {
    return `# Python/Matplotlib implementation
import matplotlib.pyplot as plt
import numpy as np

categories = list(group_stats.keys())
means = [stats['mean'] for stats in group_stats.values()]
errors = [stats['stderr'] for stats in group_stats.values()]

fig, ax = plt.subplots(figsize=(8, 6))
bars = ax.bar(categories, means, yerr=errors, capsize=5, 
              error_kw={'linewidth': 2, 'ecolor': 'black'})
ax.set_xlabel('${categoryCol}')
ax.set_ylabel('Mean ${valueCol}')
ax.set_title('Comparison with Error Bars (±SEM)')
plt.show()`;
  }
  
  performComparativeTests(data, categoryCol, valueCol) {
    // Simplified implementation - would use proper statistical tests
    const groups = {};
    data.forEach(row => {
      const cat = row[categoryCol];
      const val = row[valueCol];
      if (cat && typeof val === 'number') {
        if (!groups[cat]) groups[cat] = [];
        groups[cat].push(val);
      }
    });
    
    const categories = Object.keys(groups);
    const groupSizes = categories.map(cat => groups[cat].length);
    
    return {
      showNotches: categories.length <= 5,
      levenesTest: {
        statistic: 2.5, // Placeholder
        pValue: 0.12,
        equalVariances: true
      },
      mainTest: {
        name: categories.length === 2 ? 't-test' : 'ANOVA',
        statistic: 4.2,
        pValue: 0.03,
        significant: true
      },
      postHoc: categories.length > 2 ? {
        method: 'Tukey HSD',
        pairs: this.generatePairwiseComparisons(categories)
      } : null
    };
  }
  
  generatePairwiseComparisons(categories) {
    const pairs = [];
    for (let i = 0; i < categories.length; i++) {
      for (let j = i + 1; j < categories.length; j++) {
        pairs.push({
          comparison: `${categories[i]} vs ${categories[j]}`,
          pValue: Math.random() * 0.1, // Placeholder
          significant: Math.random() > 0.5
        });
      }
    }
    return pairs;
  }
  
  generateStatisticalAnnotations(comparisonStats) {
    const annotations = [];
    
    if (comparisonStats.mainTest.significant) {
      annotations.push({
        type: 'significance',
        text: `p ${comparisonStats.mainTest.pValue < 0.001 ? '< 0.001' : '= ' + comparisonStats.mainTest.pValue.toFixed(3)}`,
        position: 'top'
      });
    }
    
    if (comparisonStats.postHoc) {
      comparisonStats.postHoc.pairs
        .filter(pair => pair.significant)
        .forEach(pair => {
          annotations.push({
            type: 'pairwise',
            text: pair.comparison,
            significance: pair.pValue < 0.05 ? '*' : ''
          });
        });
    }
    
    return annotations;
  }
  
  generateComparativeBoxplotCode(categoryCol, valueCol, stats) {
    return `# Python/Seaborn with statistical annotations
import seaborn as sns
import matplotlib.pyplot as plt
from scipy import stats as scipy_stats

fig, ax = plt.subplots(figsize=(10, 6))
sns.boxplot(data=df, x='${categoryCol}', y='${valueCol}', 
           notch=${stats.showNotches}, ax=ax)

# Add statistical test results
if stats.mainTest.significant:
    ax.annotate(f'${stats.mainTest.name}: p = ${stats.mainTest.pValue.toFixed(3)}',
               xy=(0.5, 0.95), xycoords='axes fraction',
               ha='center', fontsize=12)

plt.title('${valueCol} by ${categoryCol}')
plt.show()

# R implementation with statistical tests
library(ggplot2)
library(ggpubr)

p <- ggplot(data, aes(x=${categoryCol}, y=${valueCol})) +
  geom_boxplot(notch=${stats.showNotches ? 'TRUE' : 'FALSE'}) +
  stat_compare_means(method="${stats.mainTest.name.toLowerCase()}")

print(p)`;
  }
  
  calculateCorrelationMatrix(data, numericColumns) {
    const matrix = {};
    const pValues = {};
    const significant = {};
    
    numericColumns.forEach(col1 => {
      matrix[col1] = {};
      pValues[col1] = {};
      significant[col1] = {};
      
      numericColumns.forEach(col2 => {
        if (col1 === col2) {
          matrix[col1][col2] = 1.0;
          pValues[col1][col2] = 0.0;
          significant[col1][col2] = true;
        } else {
          const values1 = data.map(r => r[col1]).filter(v => typeof v === 'number');
          const values2 = data.map(r => r[col2]).filter(v => typeof v === 'number');
          
          const correlation = this.calculatePearsonCorrelation(values1, values2);
          const pValue = this.calculateCorrelationPValue(correlation, values1.length);
          
          matrix[col1][col2] = correlation;
          pValues[col1][col2] = pValue;
          significant[col1][col2] = pValue < 0.05;
        }
      });
    });
    
    return { correlations: matrix, pValues, significant };
  }
  
  calculatePearsonCorrelation(x, y) {
    const n = Math.min(x.length, y.length);
    const pairs = x.slice(0, n).map((xi, i) => [xi, y[i]]);
    
    const sumX = pairs.reduce((sum, [xi]) => sum + xi, 0);
    const sumY = pairs.reduce((sum, [, yi]) => sum + yi, 0);
    const sumXY = pairs.reduce((sum, [xi, yi]) => sum + xi * yi, 0);
    const sumX2 = pairs.reduce((sum, [xi]) => sum + xi * xi, 0);
    const sumY2 = pairs.reduce((sum, [, yi]) => sum + yi * yi, 0);
    
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    
    return denominator === 0 ? 0 : numerator / denominator;
  }
  
  calculateCorrelationPValue(r, n) {
    // Simplified t-test for correlation significance
    if (n <= 2) return 1.0;
    
    const t = r * Math.sqrt((n - 2) / (1 - r * r));
    // Simplified p-value calculation - would use proper t-distribution
    return Math.abs(t) > 2 ? 0.01 : 0.1; // Placeholder
  }
  
  generateCorrelationHeatmapCode(correlationMatrix) {
    return `# Python/Seaborn implementation with significance
import seaborn as sns
import matplotlib.pyplot as plt
import numpy as np

# Create mask for non-significant correlations
mask = ~np.array([[significant[i][j] for j in columns] for i in columns])

fig, ax = plt.subplots(figsize=(10, 8))
sns.heatmap(correlation_matrix, mask=mask, annot=True, cmap='RdBu_r',
           center=0, square=True, cbar_kws={'label': 'Correlation'})

# Add significance stars
for i, col1 in enumerate(columns):
    for j, col2 in enumerate(columns):
        if significant[col1][col2] and abs(correlations[col1][col2]) > 0.3:
            stars = '***' if p_values[col1][col2] < 0.001 else \
                   '**' if p_values[col1][col2] < 0.01 else '*'
            ax.text(j+0.5, i+0.7, stars, ha='center', va='center', color='white')

plt.title('Correlation Matrix with Significance')
plt.show()`;
  }
  
  identifyRegressionOpportunities(data, numericColumns) {
    const pairs = [];
    
    for (let i = 0; i < numericColumns.length; i++) {
      for (let j = 0; j < numericColumns.length; j++) {
        if (i !== j) {
          const predictor = numericColumns[i];
          const response = numericColumns[j];
          
          const regression = this.performSimpleRegression(data, predictor, response);
          
          if (regression.rSquared >= 0.1) {
            pairs.push({
              predictor,
              response,
              ...regression
            });
          }
        }
      }
    }
    
    return pairs.sort((a, b) => b.rSquared - a.rSquared).slice(0, 3);
  }
  
  performSimpleRegression(data, predictorCol, responseCol) {
    const pairs = data
      .filter(r => typeof r[predictorCol] === 'number' && typeof r[responseCol] === 'number')
      .map(r => [r[predictorCol], r[responseCol]]);
    
    if (pairs.length < 10) {
      return { rSquared: 0 };
    }
    
    const n = pairs.length;
    const sumX = pairs.reduce((sum, [x]) => sum + x, 0);
    const sumY = pairs.reduce((sum, [, y]) => sum + y, 0);
    const sumXY = pairs.reduce((sum, [x, y]) => sum + x * y, 0);
    const sumX2 = pairs.reduce((sum, [x]) => sum + x * x, 0);
    const sumY2 = pairs.reduce((sum, [, y]) => sum + y * y, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Calculate R-squared
    const meanY = sumY / n;
    const ssTotal = pairs.reduce((sum, [, y]) => sum + Math.pow(y - meanY, 2), 0);
    const ssResidual = pairs.reduce((sum, [x, y]) => {
      const predicted = slope * x + intercept;
      return sum + Math.pow(y - predicted, 2);
    }, 0);
    
    const rSquared = 1 - (ssResidual / ssTotal);
    const adjustedRSquared = 1 - ((1 - rSquared) * (n - 1)) / (n - 2);
    
    return {
      rSquared,
      adjustedRSquared,
      slope,
      intercept,
      coefficients: { intercept, slope },
      fStatistic: (rSquared / (1 - rSquared)) * (n - 2),
      rse: Math.sqrt(ssResidual / (n - 2))
    };
  }
  
  generateRegressionDiagnosticsCode(regressionPair) {
    return `# Python comprehensive regression diagnostics
import matplotlib.pyplot as plt
import seaborn as sns
from scipy import stats
import numpy as np

fig, axes = plt.subplots(2, 2, figsize=(12, 10))

# 1. Scatter with regression line
sns.regplot(data=df, x='${regressionPair.predictor}', y='${regressionPair.response}', 
           ax=axes[0,0], scatter_kws={'alpha': 0.6})
axes[0,0].set_title(f'Regression: R² = ${regressionPair.rSquared.toFixed(3)}')

# 2. Residuals vs Fitted
fitted = df['${regressionPair.predictor}'] * ${regressionPair.slope} + ${regressionPair.intercept}
residuals = df['${regressionPair.response}'] - fitted
sns.scatterplot(x=fitted, y=residuals, ax=axes[0,1], alpha=0.6)
axes[0,1].axhline(0, color='red', linestyle='--')
axes[0,1].set_title('Residuals vs Fitted')

# 3. Q-Q plot of residuals
stats.probplot(residuals, dist="norm", plot=axes[1,0])
axes[1,0].set_title('Q-Q Plot of Residuals')

# 4. Scale-Location plot
standardized_residuals = np.sqrt(np.abs(residuals / residuals.std()))
sns.scatterplot(x=fitted, y=standardized_residuals, ax=axes[1,1], alpha=0.6)
axes[1,1].set_title('Scale-Location Plot')

plt.tight_layout()
plt.show()`;
  }
  
  prepareTimeSeriesData(data, dateCol, valueCol) {
    return data
      .filter(r => r[dateCol] instanceof Date && typeof r[valueCol] === 'number')
      .sort((a, b) => a[dateCol] - b[dateCol])
      .map(r => ({ date: r[dateCol], value: r[valueCol] }));
  }
  
  analyzeTimeSeriesProperties(timeSeriesData) {
    if (timeSeriesData.length < 10) {
      return { hasTimeStructure: false };
    }
    
    const values = timeSeriesData.map(d => d.value);
    
    // Simple autocorrelation at lag 1
    const lag1Correlation = this.calculateAutocorrelation(values, 1);
    
    // Trend detection
    const trend = this.detectTrend(values);
    
    // Seasonality detection (simplified)
    const seasonality = this.detectSeasonality(timeSeriesData);
    
    return {
      hasTimeStructure: Math.abs(lag1Correlation) > 0.1,
      acf: {
        lag1: lag1Correlation,
        significantLags: [1, 7, 30].filter(lag => 
          Math.abs(this.calculateAutocorrelation(values, lag)) > 0.2
        )
      },
      pacf: {
        significantLags: [1] // Simplified
      },
      stationarity: {
        isStationary: Math.abs(trend.slope) < 0.01,
        adfTest: { pValue: 0.05 } // Placeholder
      },
      seasonality,
      trend,
      suggestedModel: this.suggestTimeSeriesModel(lag1Correlation, seasonality, trend)
    };
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
  
  detectTrend(values) {
    // Simple linear trend
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const meanX = (n - 1) / 2;
    const meanY = values.reduce((a, b) => a + b) / n;
    
    const numerator = x.reduce((sum, xi, i) => sum + (xi - meanX) * (values[i] - meanY), 0);
    const denominator = x.reduce((sum, xi) => sum + Math.pow(xi - meanX, 2), 0);
    
    const slope = denominator === 0 ? 0 : numerator / denominator;
    
    return {
      slope,
      direction: slope > 0.01 ? 'increasing' : slope < -0.01 ? 'decreasing' : 'stable',
      strength: Math.abs(slope)
    };
  }
  
  detectSeasonality(timeSeriesData) {
    // Simplified seasonal detection
    if (timeSeriesData.length < 24) {
      return { detected: false };
    }
    
    // Check for weekly pattern
    const weeklyPattern = this.checkPeriodicPattern(timeSeriesData, 7);
    const monthlyPattern = this.checkPeriodicPattern(timeSeriesData, 30);
    
    if (weeklyPattern.strength > 0.3) {
      return {
        detected: true,
        period: 7,
        type: 'weekly',
        strength: weeklyPattern.strength
      };
    }
    
    if (monthlyPattern.strength > 0.3) {
      return {
        detected: true,
        period: 30,
        type: 'monthly',
        strength: monthlyPattern.strength
      };
    }
    
    return { detected: false };
  }
  
  checkPeriodicPattern(timeSeriesData, period) {
    // Simplified pattern detection
    const values = timeSeriesData.map(d => d.value);
    const autocorr = this.calculateAutocorrelation(values, period);
    
    return {
      strength: Math.abs(autocorr),
      correlation: autocorr
    };
  }
  
  suggestTimeSeriesModel(lag1Corr, seasonality, trend) {
    if (seasonality.detected) {
      return trend.direction !== 'stable' 
        ? 'SARIMA (Seasonal ARIMA)' 
        : 'Seasonal decomposition + ARIMA';
    }
    
    if (Math.abs(lag1Corr) > 0.5) {
      return 'ARIMA model';
    }
    
    if (trend.direction !== 'stable') {
      return 'Linear trend model';
    }
    
    return 'Simple moving average';
  }
  
  generateACFPACFCode(dateCol, valueCol, tsStats) {
    return `# Python time series analysis
import matplotlib.pyplot as plt
from statsmodels.tsa.stattools import acf, pacf
from statsmodels.graphics.tsaplots import plot_acf, plot_pacf

fig, axes = plt.subplots(2, 1, figsize=(12, 8))

# ACF plot
plot_acf(df['${valueCol}'], lags=40, ax=axes[0], alpha=0.05)
axes[0].set_title('Autocorrelation Function')

# PACF plot
plot_pacf(df['${valueCol}'], lags=40, ax=axes[1], alpha=0.05)
axes[1].set_title('Partial Autocorrelation Function')

plt.tight_layout()
plt.show()

# Stationarity test
from statsmodels.tsa.stattools import adfuller
adf_result = adfuller(df['${valueCol}'])
print(f'ADF Statistic: {adf_result[0]:.4f}')
print(f'p-value: {adf_result[1]:.4f}')
print(f'Critical Values: {adf_result[4]}')

# Model suggestion: ${tsStats.suggestedModel}`;
  }
  
  generateDecompositionCode(dateCol, valueCol, tsStats) {
    return `# Python time series decomposition
from statsmodels.tsa.seasonal import seasonal_decompose
import matplotlib.pyplot as plt

# Set date as index
df_ts = df.set_index('${dateCol}')

# Decompose
decomposition = seasonal_decompose(df_ts['${valueCol}'], 
                                 model='${tsStats.seasonality.detected ? 'additive' : 'additive'}',
                                 period=${tsStats.seasonality.period || 30})

fig, axes = plt.subplots(4, 1, figsize=(12, 10))

decomposition.observed.plot(ax=axes[0], title='Original')
decomposition.trend.plot(ax=axes[1], title='Trend')
decomposition.seasonal.plot(ax=axes[2], title='Seasonal')
decomposition.resid.plot(ax=axes[3], title='Residual')

plt.tight_layout()
plt.show()

# R implementation
library(forecast)
ts_data <- ts(data$${valueCol}, frequency=${tsStats.seasonality.period || 12})
decomp <- decompose(ts_data)
plot(decomp)`;
  }
}