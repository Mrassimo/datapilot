/**
 * Visual Engine - Comprehensive Visualization Analysis
 * Extracted from original VIS command for integration into lean commands
 */

import chalk from 'chalk';

// Import VIS modules
import { VisualTaskDetector } from '../commands/vis/analysers/taskDetector.js';
import { DataProfiler } from '../commands/vis/analysers/dataProfiler.js';
import { ChartSelector } from '../commands/vis/recommenders/chartSelector.js';
import { PerceptualScorer } from '../commands/vis/evaluators/perceptualScorer.js';
import { AntipatternDetector } from '../commands/vis/evaluators/antipatternDetector.js';
import { AccessibilityChecker } from '../commands/vis/evaluators/accessibilityChecker.js';
import { PaletteSelector } from '../commands/vis/generators/paletteSelector.js';

export class VisualEngine {
  constructor(options = {}) {
    this.options = options;
    this.taskDetector = new VisualTaskDetector();
    this.dataProfiler = new DataProfiler();
    this.chartSelector = new ChartSelector();
    this.antipatternDetector = new AntipatternDetector();
    this.accessibilityChecker = new AccessibilityChecker();
    this.paletteSelector = new PaletteSelector();
  }

  async performVisualizationAnalysis(records, columnTypes, filePath) {
    const results = {
      dataProfile: {},
      visualTasks: [],
      recommendations: [],
      antiPatterns: [],
      accessibility: {},
      colorPalettes: {},
      dashboardLayout: null,
      summary: {}
    };

    try {
      // 1. Profile the data for visualization
      results.dataProfile = this.dataProfiler.analyzeData(records, columnTypes);

      // 2. Detect visual tasks
      results.visualTasks = this.taskDetector.detectTasks(records, columnTypes);

      // 3. Generate visualization recommendations
      results.recommendations = this.generateRecommendations(
        results.visualTasks, 
        results.dataProfile
      );

      // 4. Check for visualization anti-patterns
      results.antiPatterns = this.antipatternDetector.detectAntipatterns(
        results.recommendations,
        results.dataProfile
      );

      // 5. Accessibility analysis
      results.accessibility = this.accessibilityChecker.analyzeAccessibility(
        results.recommendations
      );

      // 6. Color palette recommendations
      results.colorPalettes = this.paletteSelector.recommendPalettes(
        results.dataProfile,
        results.recommendations
      );

      // 7. Dashboard layout (if multiple charts)
      if (results.recommendations.length > 1) {
        results.dashboardLayout = this.generateDashboardLayout(results.recommendations);
      }

      // 8. Generate summary
      results.summary = this.generateVisualizationSummary(results);

      return results;

    } catch (error) {
      console.error(chalk.yellow(`⚠️ Visual Engine error: ${error.message}`));
      return results; // Return partial results
    }
  }

  generateRecommendations(visualTasks, dataProfile) {
    const recommendations = [];
    const constraints = {
      audience: this.options.audience || 'general',
      interactive: !this.options.static,
      width: this.options.width || 800,
      height: this.options.height || 600
    };

    visualTasks.slice(0, 5).forEach((task, index) => {
      const chartRecommendation = this.chartSelector.selectChart(task, dataProfile, constraints);
      
      if (chartRecommendation.primary) {
        recommendations.push({
          priority: index + 1,
          task: task,
          chart: chartRecommendation.primary,
          alternatives: chartRecommendation.alternatives || [],
          reasoning: chartRecommendation.reasoning,
          specifications: this.generateChartSpecs(chartRecommendation.primary, task, dataProfile)
        });
      }
    });

    return recommendations;
  }

  generateChartSpecs(chart, task, dataProfile) {
    return {
      chartType: chart.type,
      encoding: chart.encoding,
      data: {
        xAxis: task.columns?.independent || task.columns?.temporal,
        yAxis: task.columns?.dependent || task.columns?.measure,
        color: task.columns?.category,
        size: task.columns?.size
      },
      design: {
        title: this.generateChartTitle(task),
        subtitle: this.generateChartSubtitle(task, dataProfile),
        axes: this.generateAxisSpecs(task),
        legend: this.generateLegendSpecs(task)
      },
      interactions: chart.interactions || ['hover', 'zoom'],
      accessibility: {
        altText: this.generateAltText(chart, task),
        colorblindSafe: true,
        keyboardNavigation: true
      }
    };
  }

  generateChartTitle(task) {
    switch (task.type) {
      case 'distribution':
        return `Distribution of ${task.columns?.measure || 'Values'}`;
      case 'correlation':
        return `Relationship: ${task.columns?.independent} vs ${task.columns?.dependent}`;
      case 'trend_analysis':
        return `Trend Analysis: ${task.columns?.measure} Over Time`;
      case 'comparison':
        return `Comparison by ${task.columns?.category}`;
      default:
        return 'Data Visualization';
    }
  }

  generateChartSubtitle(task, dataProfile) {
    const recordCount = dataProfile.dimensions?.rows || 0;
    return `Based on ${recordCount.toLocaleString()} records`;
  }

  generateAxisSpecs(task) {
    return {
      x: {
        title: task.columns?.independent || task.columns?.temporal || 'X Axis',
        type: task.columns?.temporal ? 'temporal' : 'linear'
      },
      y: {
        title: task.columns?.dependent || task.columns?.measure || 'Y Axis',
        type: 'linear'
      }
    };
  }

  generateLegendSpecs(task) {
    if (task.columns?.category) {
      return {
        show: true,
        title: task.columns.category,
        position: 'right'
      };
    }
    return { show: false };
  }

  generateAltText(chart, task) {
    return `${chart.type} chart showing ${task.description || 'data visualization'}`;
  }

  generateDashboardLayout(recommendations) {
    const layout = {
      type: 'grid',
      columns: Math.min(2, Math.ceil(Math.sqrt(recommendations.length))),
      charts: recommendations.map((rec, index) => ({
        position: index + 1,
        chartId: `chart_${index + 1}`,
        title: rec.specifications?.design?.title,
        size: this.calculateChartSize(rec, recommendations.length)
      })),
      navigation: recommendations.length > 4 ? 'tabs' : 'none'
    };

    return layout;
  }

  calculateChartSize(recommendation, totalCharts) {
    if (totalCharts === 1) return 'large';
    if (totalCharts <= 4) return 'medium';
    return 'small';
  }

  generateVisualizationSummary(results) {
    return {
      totalRecommendations: results.recommendations.length,
      primaryChartType: results.recommendations[0]?.chart?.type || 'none',
      dataCharacteristics: {
        rows: results.dataProfile.dimensions?.rows || 0,
        columns: results.dataProfile.dimensions?.columns || 0,
        hasTimeData: results.dataProfile.temporal?.hasTimeData || false,
        hasCategories: results.dataProfile.categorical?.hasCategorical || false
      },
      visualComplexity: this.assessVisualComplexity(results),
      accessibilityScore: this.calculateAccessibilityScore(results.accessibility),
      topTasks: results.visualTasks.slice(0, 3).map(task => task.type)
    };
  }

  assessVisualComplexity(results) {
    const factors = [
      results.recommendations.length,
      results.dataProfile.dimensions?.columns || 0,
      results.visualTasks.length
    ];
    
    const complexity = factors.reduce((sum, factor) => sum + factor, 0);
    
    if (complexity < 5) return 'simple';
    if (complexity < 10) return 'moderate';
    return 'complex';
  }

  calculateAccessibilityScore(accessibility) {
    if (!accessibility || Object.keys(accessibility).length === 0) return 0.5;
    
    // Simple scoring based on accessibility features
    const features = Object.values(accessibility).filter(Boolean).length;
    const totalFeatures = Object.keys(accessibility).length;
    
    return totalFeatures > 0 ? features / totalFeatures : 0.5;
  }

  formatVisualizationInsights(visualResults) {
    const insights = [];

    // Primary recommendation insight
    if (visualResults.recommendations && visualResults.recommendations.length > 0) {
      const primary = visualResults.recommendations[0];
      insights.push({
        type: 'visualization',
        title: 'Primary Visualization',
        description: `${primary.chart.type} chart recommended for ${primary.task.type}`,
        chart: primary.chart.type,
        purpose: primary.task.description,
        priority: 'high'
      });
    }

    // Dashboard opportunity
    if (visualResults.recommendations && visualResults.recommendations.length > 1) {
      insights.push({
        type: 'dashboard',
        title: 'Dashboard Opportunity',
        description: `${visualResults.recommendations.length} charts can be combined into an interactive dashboard`,
        layout: visualResults.dashboardLayout?.type || 'grid',
        priority: 'medium'
      });
    }

    // Accessibility insights
    if (visualResults.accessibility && this.calculateAccessibilityScore(visualResults.accessibility) < 0.8) {
      insights.push({
        type: 'accessibility',
        title: 'Accessibility Improvements Needed',
        description: 'Consider colorblind-safe palettes and alternative text',
        priority: 'medium'
      });
    }

    return insights;
  }
}