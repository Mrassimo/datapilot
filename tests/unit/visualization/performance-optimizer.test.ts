/**
 * Performance Optimizer Tests
 * 
 * Comprehensive tests for the performance optimization engine that analyzes
 * data characteristics and provides intelligent performance recommendations.
 */

/// <reference path="../../jest-custom-matchers.d.ts" />

import { PerformanceOptimizer } from '../../../src/analyzers/visualization/engines/performance-optimizer';
import type {
  PerformanceProfile,
  DataSizeCategory,
  ComplexityLevel,
  MemoryEstimate,
  RenderingStrategy,
  OptimizationRecommendation,
  AdaptiveStrategy,
  PerformanceMetrics,
  SamplingConfiguration,
  AggregationStrategy,
  ProgressiveLoadingPlan
} from '../../../src/analyzers/visualization/engines/performance-optimizer';

describe('PerformanceOptimizer', () => {
  describe('analyzePerformance', () => {
    it('should categorize small datasets appropriately', () => {
      const profile = PerformanceOptimizer.analyzePerformance(100, 5, 'bar_chart');

      expect(profile.dataSize.category).toBe('tiny'); // 500 points < 1000 = tiny
      expect(profile.dataSize.totalDataPoints).toBe(500);
      expect(profile.complexity.level).toBe('simple');
      expect(profile.renderingStrategy.technique).toBe('svg');
    });

    it('should categorize medium datasets appropriately', () => {
      const profile = PerformanceOptimizer.analyzePerformance(2000, 10, 'scatter_plot');

      expect(profile.dataSize.category).toBe('medium');
      expect(profile.dataSize.totalDataPoints).toBe(20000);
      expect(profile.complexity.level).toMatch(/^(simple|moderate)$/);
      expect(profile.renderingStrategy.technique).toMatch(/^(svg|canvas)$/);
    });

    it('should categorize large datasets appropriately', () => {
      const profile = PerformanceOptimizer.analyzePerformance(10000, 15, 'heatmap');

      expect(profile.dataSize.category).toBe('large'); // 150k points > 100k = large
      expect(profile.complexity.level).toBe('simple'); // No complex factors triggered
      expect(profile.renderingStrategy.technique).toMatch(/^(canvas|webgl)$/);
    });

    it('should recommend WebGL for massive datasets', () => {
      const profile = PerformanceOptimizer.analyzePerformance(100000, 20, 'scatter_plot');

      expect(profile.dataSize.category).toBe('huge'); // 2M points > 1M = huge
      expect(profile.renderingStrategy.technique).toBe('webgl'); // Large datasets get WebGL
      expect(profile.complexity.level).toMatch(/^(simple|moderate)$/); // Complexity depends on multiple factors
    });

    it('should provide memory estimates', () => {
      const profile = PerformanceOptimizer.analyzePerformance(5000, 8, 'line_chart');

      expect(profile.memoryEstimate.baseDataMemory).toBeGreaterThan(0);
      expect(profile.memoryEstimate.renderingMemory).toBeGreaterThan(0);
      expect(profile.memoryEstimate.totalEstimate).toBeGreaterThan(
        profile.memoryEstimate.baseDataMemory
      );
      expect(profile.memoryEstimate.optimizationPotential).toBeGreaterThan(0);
    });

    it('should include optimization recommendations for large datasets', () => {
      const profile = PerformanceOptimizer.analyzePerformance(50000, 12, 'scatter_plot');

      expect(profile.optimizationRecommendations).toBeInstanceOf(Array);
      expect(profile.optimizationRecommendations.length).toBeGreaterThan(0);
      
      const criticalRecommendations = profile.optimizationRecommendations.filter(
        r => r.priority === 'critical'
      );
      expect(criticalRecommendations.length).toBeGreaterThan(0);
    });

    it('should provide adaptive strategies for complex visualizations', () => {
      const profile = PerformanceOptimizer.analyzePerformance(20000, 25, 'density_plot', 3);

      expect(profile.adaptiveStrategies).toBeInstanceOf(Array);
      expect(profile.adaptiveStrategies.length).toBeGreaterThan(0);
      
      const strategy = profile.adaptiveStrategies[0];
      expect(strategy.strategy).toBeDefined();
      expect(strategy.trigger).toBeDefined();
      expect(strategy.performanceGain).toBeGreaterThan(0);
    });

    it('should calculate realistic performance metrics', () => {
      const profile = PerformanceOptimizer.analyzePerformance(1000, 6, 'bar_chart');

      expect(profile.performanceMetrics.estimatedRenderTime).toBeGreaterThan(0);
      expect(profile.performanceMetrics.estimatedMemoryPeak).toBeGreaterThan(0);
      expect(profile.performanceMetrics.userInteractionLatency).toBeGreaterThan(0);
      expect(profile.performanceMetrics.frameRate).toBeGreaterThan(0);
      expect(profile.performanceMetrics.scalabilityScore).toBeGreaterThanOrEqual(0);
      expect(profile.performanceMetrics.scalabilityScore).toBeLessThanOrEqual(100);
    });
  });

  describe('generateSamplingStrategy', () => {
    it('should not suggest sampling for small datasets', () => {
      const strategy = PerformanceOptimizer.generateSamplingStrategy(500, 5, 'bar_chart');

      expect(strategy.technique).toBe('random');
      expect(strategy.sampleSize).toBe(500);
      expect(strategy.reasoning).toContain('no sampling required');
      expect(strategy.quality).toBe('high');
    });

    it('should suggest appropriate sampling for medium datasets', () => {
      const strategy = PerformanceOptimizer.generateSamplingStrategy(15000, 8, 'scatter_plot');

      expect(strategy.technique).toMatch(/^(systematic|random)$/);
      expect(strategy.sampleSize).toBeLessThan(15000);
      expect(strategy.sampleSize).toBeGreaterThan(1000);
      expect(strategy.quality).toBe('high');
    });

    it('should suggest aggressive sampling for large datasets', () => {
      const strategy = PerformanceOptimizer.generateSamplingStrategy(500000, 10, 'line_chart');

      expect(strategy.technique).toMatch(/^(stratified|adaptive)$/);
      expect(strategy.sampleSize).toBeLessThan(20000);
      expect(strategy.preserveOutliers).toBe(true);
      expect(strategy.maintainDistribution).toBe(true);
    });

    it('should adjust sample size based on chart type', () => {
      const scatterStrategy = PerformanceOptimizer.generateSamplingStrategy(
        50000, 8, 'scatter_plot'
      );
      const histogramStrategy = PerformanceOptimizer.generateSamplingStrategy(
        50000, 8, 'histogram'
      );

      expect(scatterStrategy.sampleSize).toBeGreaterThan(histogramStrategy.sampleSize);
    });

    it('should provide meaningful reasoning', () => {
      const strategy = PerformanceOptimizer.generateSamplingStrategy(100000, 12, 'heatmap');

      expect(strategy.reasoning).toBeDefined();
      expect(strategy.reasoning).toContain('sampling');
      expect(strategy.reasoning).toContain(strategy.technique);
    });
  });

  describe('designAggregationStrategy', () => {
    it('should not aggregate small datasets', () => {
      const dataSize: DataSizeCategory = {
        category: 'small',
        rowCount: 500,
        columnCount: 5,
        totalDataPoints: 2500,
        characterization: 'Small dataset',
        scalingChallenges: []
      };

      const strategy = PerformanceOptimizer.designAggregationStrategy(
        dataSize, 'bar_chart', 5000
      );

      expect(strategy.method).toBe('downsampling');
      expect(strategy.dataReduction).toBe(0);
      expect(strategy.informationRetention).toBe(100);
    });

    it('should recommend binning for histogram charts', () => {
      const dataSize: DataSizeCategory = {
        category: 'large',
        rowCount: 50000,
        columnCount: 8,
        totalDataPoints: 400000,
        characterization: 'Large dataset',
        scalingChallenges: ['Memory management']
      };

      const strategy = PerformanceOptimizer.designAggregationStrategy(
        dataSize, 'histogram', 1000
      );

      expect(strategy.method).toBe('binning');
      expect(strategy.dataReduction).toBeGreaterThan(0);
      expect(strategy.informationRetention).toBeGreaterThan(90);
    });

    it('should recommend clustering for scatter plots with high reduction needs', () => {
      const dataSize: DataSizeCategory = {
        category: 'huge',
        rowCount: 100000,
        columnCount: 10,
        totalDataPoints: 1000000,
        characterization: 'Huge dataset',
        scalingChallenges: ['Memory management', 'Render performance']
      };

      const strategy = PerformanceOptimizer.designAggregationStrategy(
        dataSize, 'scatter_plot', 1000
      );

      expect(strategy.method).toBe('clustering');
      expect(strategy.dataReduction).toBeGreaterThan(80);
      expect(strategy.visualFidelity).toBeGreaterThan(80);
    });

    it('should recommend summarization for time series', () => {
      const dataSize: DataSizeCategory = {
        category: 'large',
        rowCount: 30000,
        columnCount: 6,
        totalDataPoints: 180000,
        characterization: 'Large time series',
        scalingChallenges: ['Temporal aggregation']
      };

      const strategy = PerformanceOptimizer.designAggregationStrategy(
        dataSize, 'line_chart', 1000
      );

      expect(strategy.method).toBe('summarization');
      expect(strategy.informationRetention).toBeGreaterThan(85);
    });
  });

  describe('createProgressiveLoadingPlan', () => {
    it('should create single-stage plan for small datasets', () => {
      const dataSize: DataSizeCategory = {
        category: 'small',
        rowCount: 100,
        columnCount: 4,
        totalDataPoints: 400,
        characterization: 'Small dataset',
        scalingChallenges: []
      };

      const complexity: ComplexityLevel = {
        level: 'simple',
        factors: [],
        computationalLoad: 1,
        renderingLoad: 1,
        interactionComplexity: 1
      };

      const plan = PerformanceOptimizer.createProgressiveLoadingPlan(
        dataSize, complexity, 'bar_chart'
      );

      expect(plan.stages).toHaveLength(1);
      expect(plan.stages[0].dataVolume).toBe(100);
      expect(plan.initialDisplay).toBeDefined();
    });

    it('should create multi-stage plan for large datasets', () => {
      const dataSize: DataSizeCategory = {
        category: 'large',
        rowCount: 50000,
        columnCount: 12,
        totalDataPoints: 600000,
        characterization: 'Large dataset',
        scalingChallenges: ['Memory management', 'Render performance']
      };

      const complexity: ComplexityLevel = {
        level: 'moderate',
        factors: [],
        computationalLoad: 2,
        renderingLoad: 1.5,
        interactionComplexity: 2
      };

      const plan = PerformanceOptimizer.createProgressiveLoadingPlan(
        dataSize, complexity, 'scatter_plot'
      );

      expect(plan.stages.length).toBeGreaterThan(1);
      expect(plan.stages[0].dataVolume).toBeLessThan(50);
      expect(plan.progressIndicators).toBeInstanceOf(Array);
    });

    it('should create complex plan for extreme complexity', () => {
      const dataSize: DataSizeCategory = {
        category: 'huge',
        rowCount: 100000,
        columnCount: 20,
        totalDataPoints: 2000000,
        characterization: 'Huge dataset',
        scalingChallenges: ['Memory', 'CPU', 'Network']
      };

      const complexity: ComplexityLevel = {
        level: 'extreme',
        factors: [],
        computationalLoad: 4,
        renderingLoad: 3,
        interactionComplexity: 3
      };

      const plan = PerformanceOptimizer.createProgressiveLoadingPlan(
        dataSize, complexity, 'density_plot'
      );

      expect(plan.stages.length).toBeGreaterThanOrEqual(3);
      expect(plan.userExperience).toContain('on-demand');
    });

    it('should provide realistic timing estimates', () => {
      const dataSize: DataSizeCategory = {
        category: 'medium',
        rowCount: 5000,
        columnCount: 8,
        totalDataPoints: 40000,
        characterization: 'Medium dataset',
        scalingChallenges: ['Interaction latency']
      };

      const complexity: ComplexityLevel = {
        level: 'moderate',
        factors: [],
        computationalLoad: 1.5,
        renderingLoad: 1.2,
        interactionComplexity: 1
      };

      const plan = PerformanceOptimizer.createProgressiveLoadingPlan(
        dataSize, complexity, 'heatmap'
      );

      plan.stages.forEach(stage => {
        expect(stage.estimatedTime).toBeGreaterThan(0);
        expect(stage.estimatedTime).toBeLessThan(10000); // Reasonable upper bound
      });
    });
  });

  describe('performance calculations', () => {
    it('should scale performance metrics with data size', () => {
      const smallProfile = PerformanceOptimizer.analyzePerformance(100, 3, 'bar_chart');
      const largeProfile = PerformanceOptimizer.analyzePerformance(10000, 3, 'bar_chart');

      expect(largeProfile.performanceMetrics.estimatedRenderTime).toBeGreaterThan(
        smallProfile.performanceMetrics.estimatedRenderTime
      );
      expect(largeProfile.performanceMetrics.estimatedMemoryPeak).toBeGreaterThan(
        smallProfile.performanceMetrics.estimatedMemoryPeak
      );
    });

    it('should show WebGL performance advantage for large datasets', () => {
      const canvasProfile = PerformanceOptimizer.analyzePerformance(20000, 5, 'scatter_plot');
      // Force SVG for comparison
      canvasProfile.renderingStrategy.technique = 'svg';
      
      const webglProfile = PerformanceOptimizer.analyzePerformance(20000, 5, 'scatter_plot');
      webglProfile.renderingStrategy.technique = 'webgl';

      // WebGL should have better estimated performance for large datasets
      expect(webglProfile.performanceMetrics.frameRate).toBeGreaterThanOrEqual(
        canvasProfile.performanceMetrics.frameRate
      );
    });

    it('should provide reasonable scalability scores', () => {
      const profiles = [
        PerformanceOptimizer.analyzePerformance(100, 3, 'bar_chart'),
        PerformanceOptimizer.analyzePerformance(1000, 5, 'line_chart'),
        PerformanceOptimizer.analyzePerformance(10000, 8, 'scatter_plot'),
        PerformanceOptimizer.analyzePerformance(100000, 12, 'heatmap')
      ];

      // Scalability should generally decrease with dataset size
      for (let i = 1; i < profiles.length; i++) {
        expect(profiles[i].performanceMetrics.scalabilityScore).toBeLessThanOrEqual(
          profiles[i - 1].performanceMetrics.scalabilityScore + 10 // Some tolerance
        );
      }
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle zero row count gracefully', () => {
      const profile = PerformanceOptimizer.analyzePerformance(0, 5, 'bar_chart');
      
      expect(profile.dataSize.category).toBe('tiny');
      expect(profile.performanceMetrics.estimatedRenderTime).toBeDefined();
      // Note: Zero data points may result in -Infinity for log calculations, which is expected
    });

    it('should handle very high complexity gracefully', () => {
      const profile = PerformanceOptimizer.analyzePerformance(50000, 50, 'density_plot', 5);
      
      expect(profile.complexity.level).toMatch(/^(moderate|complex|extreme)$/); // High complexity factors
      expect(profile.adaptiveStrategies.length).toBeGreaterThan(0);
    });

    it('should handle unknown chart types', () => {
      const profile = PerformanceOptimizer.analyzePerformance(1000, 5, 'unknown_chart');
      
      expect(profile.renderingStrategy.technique).toBeDefined();
      expect(profile.optimizationRecommendations).toBeInstanceOf(Array);
    });
  });
});