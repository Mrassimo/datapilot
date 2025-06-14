/**
 * Chart Composer Engine Tests
 * 
 * Tests the advanced chart composition engine that intelligently combines multiple
 * visualization components, handles complex multi-dimensional data encoding, and
 * creates sophisticated composite visualizations.
 */

import { ChartComposer } from '../../../src/analyzers/visualization/engines/chart-composer';
import type { 
  ChartComposition,
  VisualLayer,
  DataBinding,
  InteractionSpec,
  LayoutSpec
} from '../../../src/analyzers/visualization/types';
import { ChartType } from '../../../src/analyzers/visualization/types';

describe('ChartComposer', () => {
  describe('Multi-Layer Chart Composition', () => {
    it('should compose scatter plot with regression line overlay', () => {
      const composer = new ChartComposer();
      
      const composition = composer.composeChart({
        baseChart: {
          type: ChartType.SCATTER_PLOT,
          data: {
            x: 'height',
            y: 'weight',
            color: 'gender',
          },
        },
        overlays: [
          {
            type: 'regression_line',
            data: { method: 'linear', confidence_interval: true },
            style: { color: '#666', strokeWidth: 2, opacity: 0.8 },
          },
          {
            type: 'annotation',
            data: { points: [{ x: 180, y: 80, label: 'Outlier' }] },
            style: { color: '#ff4444', fontSize: 12 },
          }
        ],
      });

      expect(composition.layers.length).toBe(3); // scatter + regression + annotation
      expect(composition.layers[0].type).toBe('scatter');
      expect(composition.layers[1].type).toBe('regression_line');
      expect(composition.layers[2].type).toBe('annotation');

      // Should handle z-ordering correctly
      expect(composition.layers[0].zIndex).toBeLessThan(composition.layers[1].zIndex);
      expect(composition.layers[2].zIndex).toBeGreaterThan(composition.layers[1].zIndex);
    });

    it('should create complex time series with multiple metrics', () => {
      const composer = new ChartComposer();
      
      const composition = composer.composeChart({
        baseChart: {
          type: ChartType.TIME_SERIES_LINE,
          data: {
            x: 'date',
            y: 'revenue',
            series: 'primary',
          },
        },
        secondaryAxis: {
          type: ChartType.TIME_SERIES_LINE,
          data: {
            x: 'date',
            y: 'user_count',
            series: 'secondary',
          },
          axis: 'right',
        },
        overlays: [
          {
            type: 'area_band',
            data: { y_min: 'revenue_lower', y_max: 'revenue_upper' },
            style: { fill: '#1f77b4', opacity: 0.2 },
          },
          {
            type: 'vertical_lines',
            data: { events: [{ date: '2024-01-15', label: 'Launch' }] },
            style: { stroke: '#ff7f0e', strokeDasharray: '5,5' },
          }
        ],
      });

      expect(composition.axes.length).toBe(3); // x, y-left, y-right
      expect(composition.axes.find(axis => axis.position === 'right')).toBeDefined();
      
      // Should handle dual-axis scaling
      expect(composition.scaling.primary.domain).toBeDefined();
      expect(composition.scaling.secondary.domain).toBeDefined();
      expect(composition.scaling.synchronized).toBe(false);
    });

    it('should compose faceted visualizations with shared scales', () => {
      const composer = new ChartComposer();
      
      const composition = composer.composeFacetedChart({
        baseChart: {
          type: ChartType.LINE_CHART,
          data: {
            x: 'month',
            y: 'sales',
            color: 'product',
          },
        },
        facets: {
          type: 'grid',
          rows: 'region',
          columns: 'year',
          scaleSharing: {
            x: 'shared',
            y: 'shared',
            color: 'shared',
          },
        },
        layout: {
          spacing: { horizontal: 20, vertical: 15 },
          labels: { show: true, position: 'outer' },
        },
      });

      expect(composition.facets.grid.rows).toBeGreaterThan(1);
      expect(composition.facets.grid.columns).toBeGreaterThan(1);
      expect(composition.facets.scaleSharing.x).toBe('shared');

      // Should create consistent scales across facets
      composition.facets.panels.forEach(panel => {
        expect(panel.scales.x.domain).toEqual(composition.globalScales.x.domain);
        expect(panel.scales.y.domain).toEqual(composition.globalScales.y.domain);
      });
    });

    it('should handle marginal plots for enhanced distribution view', () => {
      const composer = new ChartComposer();
      
      const composition = composer.composeMarginalPlots({
        centerChart: {
          type: ChartType.SCATTER_PLOT,
          data: { x: 'height', y: 'weight', color: 'gender' },
        },
        marginals: {
          top: {
            type: ChartType.HISTOGRAM,
            data: { x: 'height', bins: 30 },
            height: 0.2, // 20% of total height
          },
          right: {
            type: ChartType.HISTOGRAM,
            data: { x: 'weight', bins: 30, orientation: 'vertical' },
            width: 0.2, // 20% of total width
          },
        },
        alignment: 'precise',
      });

      expect(composition.layout.type).toBe('marginal');
      expect(composition.layout.regions.center).toBeDefined();
      expect(composition.layout.regions.top).toBeDefined();
      expect(composition.layout.regions.right).toBeDefined();

      // Should align axes precisely
      expect(composition.axisAlignment.x.synchronized).toBe(true);
      expect(composition.axisAlignment.y.synchronized).toBe(true);
    });
  });

  describe('Advanced Data Binding and Transformations', () => {
    it('should handle complex data transformations for composed charts', () => {
      const composer = new ChartComposer();
      
      const composition = composer.composeWithTransformations({
        data: [
          { date: '2024-01-01', sales: 1000, region: 'North', product: 'A' },
          { date: '2024-01-01', sales: 1500, region: 'South', product: 'A' },
          // ... more data
        ],
        transformations: [
          {
            type: 'aggregate',
            groupBy: ['date', 'region'],
            measures: { 
              total_sales: { field: 'sales', operation: 'sum' },
              avg_sales: { field: 'sales', operation: 'mean' },
            },
          },
          {
            type: 'calculate',
            field: 'growth_rate',
            expression: '(total_sales - lag(total_sales)) / lag(total_sales)',
            partitionBy: 'region',
            orderBy: 'date',
          }
        ],
        composition: {
          baseChart: {
            type: ChartType.LINE_CHART,
            data: { x: 'date', y: 'total_sales', color: 'region' },
          },
          overlay: {
            type: ChartType.BAR_CHART,
            data: { x: 'date', y: 'growth_rate', color: 'region' },
            axis: 'secondary',
          },
        },
      });

      expect(composition.dataTransformations.length).toBe(2);
      expect(composition.transformedData.length).toBeGreaterThan(0);
      
      // Should create derived fields
      const sampleRecord = composition.transformedData[0];
      expect(sampleRecord).toHaveProperty('total_sales');
      expect(sampleRecord).toHaveProperty('avg_sales');
      expect(sampleRecord).toHaveProperty('growth_rate');
    });

    it('should bind data efficiently across multiple layers', () => {
      const composer = new ChartComposer();
      
      const composition = composer.optimizeDataBinding({
        layers: [
          {
            type: 'scatter',
            data: { source: 'main', fields: ['x', 'y', 'size'] },
            size: 10000, // Large dataset
          },
          {
            type: 'density_contour',
            data: { source: 'main', fields: ['x', 'y'], aggregation: true },
            size: 100, // Aggregated
          },
          {
            type: 'annotation',
            data: { source: 'annotations', fields: ['x', 'y', 'label'] },
            size: 5, // Small dataset
          }
        ],
        optimization: {
          sharedDataStructures: true,
          lazyLoading: true,
          memoryEfficient: true,
        },
      });

      expect(composition.dataBinding.strategy).toBe('optimized');
      expect(composition.dataBinding.sharedStructures.length).toBeGreaterThan(0);
      
      // Should use different strategies for different layer sizes
      const scatterBinding = composition.layers.find(l => l.type === 'scatter')?.dataBinding;
      const densityBinding = composition.layers.find(l => l.type === 'density_contour')?.dataBinding;
      
      expect(scatterBinding?.strategy).toBe('streaming');
      expect(densityBinding?.strategy).toBe('aggregated');
    });

    it('should handle real-time data updates across composed charts', () => {
      const composer = new ChartComposer();
      
      const composition = composer.setupRealTimeComposition({
        updateFrequency: 1000, // 1 second
        maxDataPoints: 1000,
        charts: [
          {
            type: ChartType.TIME_SERIES_LINE,
            data: { x: 'timestamp', y: 'value', buffer: 'sliding_window' },
          },
          {
            type: ChartType.HISTOGRAM,
            data: { x: 'value', bins: 20, update: 'incremental' },
          }
        ],
        transitions: {
          duration: 750,
          easing: 'ease-out',
          stagger: 50,
        },
      });

      expect(composition.realTime.updateStrategy).toBe('streaming');
      expect(composition.realTime.bufferManagement.type).toBe('sliding_window');
      expect(composition.realTime.bufferManagement.maxSize).toBe(1000);

      // Should configure appropriate transitions
      expect(composition.transitions.duration).toBeLessThan(composition.realTime.updateFrequency);
      expect(composition.transitions.performance.optimized).toBe(true);
    });

    it('should create coordinated brushing and linking', () => {
      const composer = new ChartComposer();
      
      const composition = composer.setupCoordinatedViews({
        charts: [
          {
            id: 'scatter_main',
            type: ChartType.SCATTER_PLOT,
            data: { x: 'height', y: 'weight', id: 'person_id' },
            interactions: ['brush', 'hover'],
          },
          {
            id: 'histogram_height',
            type: ChartType.HISTOGRAM,
            data: { x: 'height', id: 'person_id' },
            interactions: ['brush', 'hover'],
          },
          {
            id: 'bar_category',
            type: ChartType.BAR_CHART,
            data: { x: 'category', y: 'count', id: 'person_id' },
            interactions: ['click', 'hover'],
          }
        ],
        coordination: {
          brushing: {
            bidirectional: true,
            unions: true,
            intersections: true,
          },
          highlighting: {
            persistent: false,
            fadeOthers: true,
            strokeWidth: 2,
          },
        },
      });

      expect(composition.coordination.type).toBe('brushing_and_linking');
      expect(composition.coordination.connections.length).toBe(3); // All connected

      // Should set up event handlers
      composition.charts.forEach(chart => {
        expect(chart.eventHandlers.brush).toBeDefined();
        expect(chart.eventHandlers.hover).toBeDefined();
      });

      // Should define selection states
      expect(composition.selectionState.manager).toBeDefined();
      expect(composition.selectionState.synchronizer).toBeDefined();
    });
  });

  describe('Layout and Spatial Coordination', () => {
    it('should optimize layout for dashboard-style compositions', () => {
      const composer = new ChartComposer();
      
      const composition = composer.optimizeDashboardLayout({
        charts: [
          { id: 'kpi1', type: 'metric', size: 'small', priority: 'high' },
          { id: 'kpi2', type: 'metric', size: 'small', priority: 'high' },
          { id: 'trend', type: 'line', size: 'large', priority: 'high' },
          { id: 'distribution', type: 'histogram', size: 'medium', priority: 'medium' },
          { id: 'breakdown', type: 'pie', size: 'medium', priority: 'low' },
        ],
        constraints: {
          canvasSize: { width: 1200, height: 800 },
          minChartSize: { width: 200, height: 150 },
          spacing: 20,
        },
        strategy: 'visual_hierarchy',
      });

      expect(composition.layout.type).toBe('adaptive_grid');
      expect(composition.layout.regions.length).toBe(5);

      // Should respect priority in positioning
      const highPriorityCharts = composition.layout.regions.filter(r => 
        r.priority === 'high'
      );
      highPriorityCharts.forEach(chart => {
        expect(chart.position.y).toBeLessThan(400); // Top half
      });

      // Should maintain aspect ratios appropriately
      composition.layout.regions.forEach(region => {
        const aspectRatio = region.size.width / region.size.height;
        expect(aspectRatio).toBeGreaterThan(0.5);
        expect(aspectRatio).toBeLessThan(3.0);
      });
    });

    it('should handle responsive layout adaptations', () => {
      const composer = new ChartComposer();
      
      const composition = composer.createResponsiveComposition({
        charts: [
          { id: 'main', type: 'line', flexibility: 'high' },
          { id: 'detail1', type: 'scatter', flexibility: 'medium' },
          { id: 'detail2', type: 'bar', flexibility: 'low' },
        ],
        breakpoints: [
          { width: 320, layout: 'single_column' },
          { width: 768, layout: 'two_column' },
          { width: 1024, layout: 'three_column' },
        ],
      });

      expect(composition.responsive.breakpoints.length).toBe(3);
      
      composition.responsive.breakpoints.forEach(breakpoint => {
        expect(breakpoint.adaptations.length).toBeGreaterThan(0);
        
        if (breakpoint.width <= 320) {
          // Mobile should stack vertically
          expect(breakpoint.layout.columns).toBe(1);
          expect(breakpoint.adaptations).toContain('hide_secondary_elements');
        }
        
        if (breakpoint.width >= 1024) {
          // Desktop should show all elements
          expect(breakpoint.layout.columns).toBe(3);
          expect(breakpoint.adaptations).toContain('show_all_elements');
        }
      });
    });

    it('should coordinate scales and axes across multiple charts', () => {
      const composer = new ChartComposer();
      
      const composition = composer.coordinateScales({
        charts: [
          {
            id: 'chart1',
            type: ChartType.LINE_CHART,
            data: { x: 'date', y: 'sales', domain: { x: ['2024-01-01', '2024-12-31'], y: [0, 10000] } },
          },
          {
            id: 'chart2',
            type: ChartType.BAR_CHART,
            data: { x: 'date', y: 'profit', domain: { x: ['2024-01-01', '2024-12-31'], y: [-1000, 5000] } },
          }
        ],
        coordination: {
          x_axis: 'shared', // Same time range
          y_axis: 'independent', // Different metrics
          zoom: 'synchronized',
          pan: 'synchronized',
        },
      });

      expect(composition.scaleCoordination.x.type).toBe('shared');
      expect(composition.scaleCoordination.y.type).toBe('independent');

      // Should synchronize interactions
      expect(composition.interactions.zoom.synchronized).toBe(true);
      expect(composition.interactions.pan.synchronized).toBe(true);

      // Should maintain domain consistency where shared
      const chart1XDomain = composition.charts[0].scales.x.domain;
      const chart2XDomain = composition.charts[1].scales.x.domain;
      expect(chart1XDomain).toEqual(chart2XDomain);
    });

    it('should handle complex nested layouts', () => {
      const composer = new ChartComposer();
      
      const composition = composer.createNestedLayout({
        structure: {
          type: 'hierarchical',
          root: {
            type: 'horizontal_split',
            ratio: 0.7,
            left: {
              type: 'vertical_split',
              ratio: 0.6,
              top: { chart: 'main_view', type: 'scatter' },
              bottom: { chart: 'timeline', type: 'line' },
            },
            right: {
              type: 'vertical_stack',
              children: [
                { chart: 'summary', type: 'metric', weight: 1 },
                { chart: 'breakdown', type: 'pie', weight: 2 },
                { chart: 'details', type: 'table', weight: 2 },
              ],
            },
          },
        },
      });

      expect(composition.layout.structure.type).toBe('hierarchical');
      expect(composition.layout.nesting.depth).toBeGreaterThan(1);

      // Should calculate proper dimensions for nested elements
      const mainView = composition.layout.chartPositions.find(pos => pos.chartId === 'main_view');
      const timeline = composition.layout.chartPositions.find(pos => pos.chartId === 'timeline');
      
      expect(mainView).toBeDefined();
      expect(timeline).toBeDefined();
      
      if (mainView && timeline) {
        // Should be vertically stacked in left panel
        expect(mainView.bounds.x).toEqual(timeline.bounds.x);
        expect(mainView.bounds.y).toBeLessThan(timeline.bounds.y);
      }
    });
  });

  describe('Interaction and Animation Composition', () => {
    it('should orchestrate complex interaction sequences', () => {
      const composer = new ChartComposer();
      
      const composition = composer.orchestrateInteractions({
        charts: [
          { id: 'overview', type: 'line', role: 'context' },
          { id: 'detail', type: 'scatter', role: 'focus' },
          { id: 'filter', type: 'bar', role: 'control' },
        ],
        interactions: [
          {
            trigger: { chart: 'overview', event: 'brush' },
            effects: [
              { chart: 'detail', action: 'filter_data', transition: 'smooth' },
              { chart: 'filter', action: 'update_bins', transition: 'immediate' },
            ],
          },
          {
            trigger: { chart: 'filter', event: 'click' },
            effects: [
              { chart: 'overview', action: 'highlight_series', transition: 'fade' },
              { chart: 'detail', action: 'emphasize_category', transition: 'scale' },
            ],
          }
        ],
      });

      expect(composition.interactionGraph.nodes.length).toBe(3);
      expect(composition.interactionGraph.edges.length).toBe(2);

      // Should define state management
      expect(composition.stateManager.globalState).toBeDefined();
      expect(composition.stateManager.transitions.length).toBeGreaterThan(0);

      // Should handle interaction conflicts
      expect(composition.conflictResolution.strategy).toBeDefined();
    });

    it('should create smooth animation sequences for data updates', () => {
      const composer = new ChartComposer();
      
      const composition = composer.choreographAnimations({
        charts: [
          { id: 'chart1', type: 'bar', animationComplexity: 'medium' },
          { id: 'chart2', type: 'line', animationComplexity: 'low' },
          { id: 'chart3', type: 'scatter', animationComplexity: 'high' },
        ],
        sequence: {
          type: 'staggered',
          delay: 150,
          overlap: 0.3,
        },
        performance: {
          maxConcurrent: 2,
          fallbackStrategy: 'immediate',
          budgetMs: 16, // 60fps
        },
      });

      expect(composition.animationSequence.phases.length).toBe(3);
      expect(composition.performance.estimatedDuration).toBeLessThan(2000);

      // Should respect performance budget
      composition.animationSequence.phases.forEach(phase => {
        expect(phase.duration).toBeLessThan(composition.performance.budgetMs * 10);
      });

      // Should provide fallback strategies
      expect(composition.performance.fallback).toBeDefined();
    });

    it('should handle touch and gesture interactions on mobile', () => {
      const composer = new ChartComposer();
      
      const composition = composer.optimizeForTouch({
        charts: [
          { id: 'main', type: 'scatter', touchPriority: 'high' },
          { id: 'mini', type: 'line', touchPriority: 'low' },
        ],
        device: 'mobile',
        gestures: {
          pan: { enabled: true, momentum: true },
          zoom: { enabled: true, constraints: { min: 0.5, max: 5 } },
          tap: { enabled: true, doubleTap: true },
          longPress: { enabled: true, duration: 500 },
        },
      });

      expect(composition.touchOptimization.targetSize.minimum).toBeGreaterThanOrEqual(44); // 44pt Apple guideline
      expect(composition.gestures.pan.momentum).toBe(true);
      expect(composition.gestures.zoom.constraints.min).toBe(0.5);

      // Should adapt interaction areas for touch
      composition.charts.forEach(chart => {
        if (chart.touchPriority === 'high') {
          expect(chart.touchTargets.expanded).toBe(true);
          expect(chart.interactions.sensitivity.increased).toBe(true);
        }
      });
    });

    it('should coordinate animations with data loading states', () => {
      const composer = new ChartComposer();
      
      const composition = composer.coordinateLoadingAnimations({
        charts: [
          { id: 'chart1', loadTime: 500, priority: 'high' },
          { id: 'chart2', loadTime: 1200, priority: 'medium' },
          { id: 'chart3', loadTime: 800, priority: 'low' },
        ],
        strategy: 'progressive_disclosure',
        placeholders: {
          type: 'skeleton',
          animated: true,
          respectsMotionPreferences: true,
        },
      });

      expect(composition.loadingStrategy.type).toBe('progressive_disclosure');
      expect(composition.loadingOrder.length).toBe(3);

      // Should load high priority first
      expect(composition.loadingOrder[0].chartId).toBe('chart1');
      expect(composition.loadingOrder[0].priority).toBe('high');

      // Should provide loading states
      composition.charts.forEach(chart => {
        expect(chart.loadingState.placeholder).toBeDefined();
        expect(chart.loadingState.transitions.fadeIn).toBeDefined();
      });
    });
  });

  describe('Performance and Optimization', () => {
    it('should optimize rendering for complex compositions', () => {
      const composer = new ChartComposer();
      
      const composition = composer.optimizeRendering({
        charts: [
          { id: 'heavy', type: 'scatter', dataPoints: 100000, complexity: 'high' },
          { id: 'medium', type: 'line', dataPoints: 10000, complexity: 'medium' },
          { id: 'light', type: 'bar', dataPoints: 100, complexity: 'low' },
        ],
        constraints: {
          targetFPS: 60,
          memoryLimit: '512MB',
          renderBudget: 16, // ms per frame
        },
        strategies: ['webgl', 'canvas_pooling', 'lazy_rendering'],
      });

      expect(composition.renderingOptimization.strategy).toContain('webgl');
      expect(composition.performance.estimatedFPS).toBeGreaterThan(30);

      // Should use appropriate rendering strategies
      const heavyChart = composition.charts.find(c => c.id === 'heavy');
      const lightChart = composition.charts.find(c => c.id === 'light');

      expect(heavyChart?.renderingStrategy).toBe('webgl');
      expect(lightChart?.renderingStrategy).toBe('canvas');
    });

    it('should implement level-of-detail rendering', () => {
      const composer = new ChartComposer();
      
      const composition = composer.implementLevelOfDetail({
        chart: {
          type: ChartType.SCATTER_PLOT,
          dataPoints: 1000000,
          interactionStates: ['overview', 'zoom', 'detail'],
        },
        levels: [
          { name: 'overview', maxPoints: 1000, sampling: 'systematic' },
          { name: 'zoom', maxPoints: 10000, sampling: 'density_based' },
          { name: 'detail', maxPoints: 100000, sampling: 'spatial' },
        ],
        transitions: {
          smooth: true,
          duration: 300,
          easing: 'ease-out',
        },
      });

      expect(composition.levelOfDetail.levels.length).toBe(3);
      expect(composition.levelOfDetail.currentLevel).toBe('overview');

      // Should provide smooth transitions between levels
      composition.levelOfDetail.levels.forEach(level => {
        expect(level.transitionIn).toBeDefined();
        expect(level.transitionOut).toBeDefined();
      });

      // Should maintain visual continuity
      expect(composition.visualContinuity.preserveScales).toBe(true);
      expect(composition.visualContinuity.preserveSelection).toBe(true);
    });

    it('should handle memory management for large compositions', () => {
      const composer = new ChartComposer();
      
      const composition = composer.manageMemory({
        charts: Array.from({ length: 20 }, (_, i) => ({
          id: `chart_${i}`,
          type: 'scatter',
          dataSize: 'large',
          visibility: i < 5 ? 'visible' : 'hidden',
        })),
        strategies: {
          virtualScrolling: true,
          lazyLoading: true,
          memoryPooling: true,
          garbageCollection: 'aggressive',
        },
      });

      expect(composition.memoryManagement.strategy).toBe('virtual_scrolling');
      expect(composition.memoryManagement.activeCharts).toBeLessThanOrEqual(10);

      // Should implement cleanup strategies
      expect(composition.cleanup.scheduleGC).toBe(true);
      expect(composition.cleanup.releaseInactive).toBe(true);

      // Should monitor memory usage
      expect(composition.monitoring.memoryThreshold).toBeDefined();
      expect(composition.monitoring.warningLevel).toBeDefined();
    });

    it('should optimize for specific device capabilities', () => {
      const composer = new ChartComposer();
      
      const mobileComposition = composer.optimizeForDevice({
        device: {
          type: 'mobile',
          gpu: 'limited',
          memory: '2GB',
          pixelRatio: 2,
        },
        charts: [
          { id: 'main', type: 'line', priority: 'high' },
          { id: 'secondary', type: 'bar', priority: 'low' },
        ],
      });

      const desktopComposition = composer.optimizeForDevice({
        device: {
          type: 'desktop',
          gpu: 'dedicated',
          memory: '16GB',
          pixelRatio: 1,
        },
        charts: [
          { id: 'main', type: 'line', priority: 'high' },
          { id: 'secondary', type: 'bar', priority: 'low' },
        ],
      });

      // Mobile should use simpler rendering
      expect(mobileComposition.renderingStrategy).toBe('canvas');
      expect(mobileComposition.effects.enabled).toBe(false);

      // Desktop can use advanced features
      expect(desktopComposition.renderingStrategy).toBe('webgl');
      expect(desktopComposition.effects.enabled).toBe(true);
    });
  });

  describe('Error Handling and Fallbacks', () => {
    it('should handle composition failures gracefully', () => {
      const composer = new ChartComposer();
      
      const composition = composer.composeWithFallbacks({
        charts: [
          { id: 'problematic', type: 'invalid_type' as any, data: null },
          { id: 'working', type: 'bar', data: { x: 'category', y: 'value' } },
        ],
        fallbackStrategy: 'graceful_degradation',
        errorHandling: 'isolate_failures',
      });

      expect(composition.status).toBe('partial_success');
      expect(composition.errors.length).toBeGreaterThan(0);
      expect(composition.charts.length).toBe(1); // Only working chart

      // Should provide error information
      const error = composition.errors[0];
      expect(error.chartId).toBe('problematic');
      expect(error.type).toBe('invalid_configuration');
      expect(error.fallbackApplied).toBe(true);
    });

    it('should provide alternative compositions when primary fails', () => {
      const composer = new ChartComposer();
      
      const composition = composer.composeWithAlternatives({
        primary: {
          type: 'complex_multivariate',
          requirements: ['webgl', 'large_memory'],
        },
        alternatives: [
          {
            type: 'simplified_bivariate',
            requirements: ['canvas'],
            fallbackReason: 'insufficient_gpu',
          },
          {
            type: 'basic_univariate',
            requirements: [],
            fallbackReason: 'minimal_capabilities',
          }
        ],
        deviceCapabilities: {
          webgl: false,
          memory: 'limited',
          canvas: true,
        },
      });

      expect(composition.selectedComposition.type).toBe('simplified_bivariate');
      expect(composition.fallbackReason).toBe('insufficient_gpu');
      expect(composition.alternatives.length).toBe(1); // One remaining alternative
    });

    it('should validate compositions before rendering', () => {
      const composer = new ChartComposer();
      
      const validation = composer.validateComposition({
        charts: [
          {
            type: ChartType.SCATTER_PLOT,
            data: { x: 'missing_field', y: 'valid_field' },
          },
          {
            type: ChartType.LINE_CHART,
            data: { x: 'date', y: 'value' },
            scales: { x: { type: 'invalid' } },
          }
        ],
        strictMode: true,
      });

      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
      expect(validation.warnings.length).toBeGreaterThanOrEqual(0);

      // Should provide specific error details
      const dataError = validation.errors.find(e => e.type === 'missing_data_field');
      const scaleError = validation.errors.find(e => e.type === 'invalid_scale_type');

      expect(dataError).toBeDefined();
      expect(scaleError).toBeDefined();

      // Should suggest fixes
      expect(validation.suggestions.length).toBeGreaterThan(0);
    });

    it('should handle data inconsistencies across charts', () => {
      const composer = new ChartComposer();
      
      const composition = composer.handleDataInconsistencies({
        charts: [
          {
            id: 'chart1',
            data: { fields: ['date', 'sales'], dateFormat: 'YYYY-MM-DD' },
          },
          {
            id: 'chart2',
            data: { fields: ['timestamp', 'revenue'], dateFormat: 'Unix' },
          }
        ],
        resolution: 'automatic_harmonization',
      });

      expect(composition.dataHarmonization.applied).toBe(true);
      expect(composition.dataHarmonization.transformations.length).toBeGreaterThan(0);

      // Should align data formats
      const dateTransform = composition.dataHarmonization.transformations.find(t => 
        t.type === 'date_format_alignment'
      );
      expect(dateTransform).toBeDefined();
      expect(dateTransform?.targetFormat).toBeDefined();
    });
  });
});