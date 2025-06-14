/**
 * Aesthetic Optimization Engine Tests
 * 
 * Tests the sophisticated aesthetic optimization engine that applies design principles,
 * color theory, and perceptual psychology to create visually appealing and effective
 * data visualizations.
 */

import { AestheticOptimizer } from '../../../src/analyzers/visualization/engines/aesthetic-optimization';
import type { 
  AestheticConfiguration,
  ColorPalette,
  TypographySettings,
  LayoutConfiguration,
  DesignPrinciples
} from '../../../src/analyzers/visualization/types';
import { ChartType } from '../../../src/analyzers/visualization/types';

describe('AestheticOptimizer', () => {
  describe('Color Palette Optimization', () => {
    it('should generate perceptually uniform color palettes', () => {
      const optimizer = new AestheticOptimizer();
      
      const palette = optimizer.generateColorPalette({
        type: 'categorical',
        count: 8,
        accessibility: 'AA',
        colorBlindFriendly: true,
      });

      expect(palette.colors.length).toBe(8);
      expect(palette.accessibility.colorBlindFriendly).toBe(true);
      expect(palette.accessibility.contrastRatio).toBeGreaterThanOrEqual(4.5);

      // Should maintain perceptual distance between colors
      palette.colors.forEach((color, index) => {
        if (index > 0) {
          const distance = optimizer.calculatePerceptualDistance(
            palette.colors[index - 1], 
            color
          );
          expect(distance).toBeGreaterThan(10); // Sufficient perceptual separation
        }
      });
    });

    it('should optimize sequential color palettes for numerical data', () => {
      const optimizer = new AestheticOptimizer();
      
      const palette = optimizer.generateColorPalette({
        type: 'sequential',
        count: 9,
        baseColor: '#1f77b4',
        dataRange: { min: 0, max: 100 },
      });

      expect(palette.colors.length).toBe(9);
      expect(palette.type).toBe('sequential');

      // Should show smooth progression
      const luminanceValues = palette.colors.map(color => 
        optimizer.calculateLuminance(color)
      );
      
      // Sequential palettes should have monotonic luminance progression
      for (let i = 1; i < luminanceValues.length; i++) {
        expect(luminanceValues[i]).toBeGreaterThanOrEqual(luminanceValues[i - 1]);
      }
    });

    it('should create diverging palettes for comparison data', () => {
      const optimizer = new AestheticOptimizer();
      
      const palette = optimizer.generateColorPalette({
        type: 'diverging',
        count: 11,
        centerValue: 0,
        positiveColor: '#d73027',
        negativeColor: '#1a9850',
        neutralColor: '#ffffbf',
      });

      expect(palette.colors.length).toBe(11);
      expect(palette.type).toBe('diverging');

      // Should have neutral color at center
      const centerIndex = Math.floor(palette.colors.length / 2);
      const centerColor = palette.colors[centerIndex];
      expect(optimizer.calculateLuminance(centerColor)).toBeGreaterThan(0.8); // Light neutral
    });

    it('should detect and avoid problematic color combinations', () => {
      const optimizer = new AestheticOptimizer();
      
      const problematicPalette = optimizer.validateColorPalette([
        '#ff0000', // Red
        '#00ff00', // Green - problematic for red-green colorblind
        '#0000ff', // Blue
      ]);

      expect(problematicPalette.issues.length).toBeGreaterThan(0);
      expect(problematicPalette.issues).toContain('red_green_confusion');

      // Should provide alternatives
      expect(problematicPalette.suggestions.length).toBeGreaterThan(0);
      expect(problematicPalette.alternatives.colors.length).toBe(3);
    });

    it('should optimize colors for specific chart types', () => {
      const optimizer = new AestheticOptimizer();
      
      // Heatmap optimization
      const heatmapPalette = optimizer.optimizeColorsForChart({
        chartType: ChartType.HEATMAP,
        dataType: 'numerical',
        dataRange: { min: -10, max: 10 },
        emphasizeExtremes: true,
      });

      expect(heatmapPalette.type).toBe('diverging');
      expect(heatmapPalette.properties.emphasizeExtremes).toBe(true);

      // Scatter plot optimization
      const scatterPalette = optimizer.optimizeColorsForChart({
        chartType: ChartType.SCATTER_PLOT,
        categoryCount: 5,
        overlaySupport: true,
      });

      expect(scatterPalette.type).toBe('categorical');
      expect(scatterPalette.properties.transparency).toBeDefined();
      expect(scatterPalette.properties.transparency).toBeGreaterThan(0);
    });
  });

  describe('Typography and Text Optimization', () => {
    it('should optimize typography for readability', () => {
      const optimizer = new AestheticOptimizer();
      
      const typography = optimizer.optimizeTypography({
        chartType: ChartType.BAR_CHART,
        canvasSize: { width: 800, height: 600 },
        textDensity: 'moderate',
        accessibility: 'AA',
      });

      // Should provide appropriate font sizes
      expect(typography.title.fontSize).toBeGreaterThanOrEqual(16);
      expect(typography.axis.fontSize).toBeGreaterThanOrEqual(12);
      expect(typography.labels.fontSize).toBeGreaterThanOrEqual(10);

      // Should maintain proper contrast
      expect(typography.title.contrast).toBeGreaterThanOrEqual(4.5);
      expect(typography.axis.contrast).toBeGreaterThanOrEqual(4.5);

      // Should use appropriate font families
      expect(typography.title.fontFamily).toContain('sans-serif');
      expect(typography.numbers.fontFamily).toContain('monospace');
    });

    it('should adapt typography for different screen sizes', () => {
      const optimizer = new AestheticOptimizer();
      
      const mobileTypography = optimizer.optimizeTypography({
        chartType: ChartType.LINE_CHART,
        canvasSize: { width: 360, height: 640 },
        device: 'mobile',
        touchFriendly: true,
      });

      const desktopTypography = optimizer.optimizeTypography({
        chartType: ChartType.LINE_CHART,
        canvasSize: { width: 1200, height: 800 },
        device: 'desktop',
        touchFriendly: false,
      });

      // Mobile should have larger minimum sizes for touch
      expect(mobileTypography.labels.fontSize).toBeGreaterThan(desktopTypography.labels.fontSize);
      expect(mobileTypography.interactive.minTouchTarget).toBeGreaterThanOrEqual(44);
    });

    it('should handle text overflow and truncation gracefully', () => {
      const optimizer = new AestheticOptimizer();
      
      const textStrategy = optimizer.optimizeTextLayout({
        labels: ['Very Long Category Name That Might Overflow', 'Short', 'Medium Length'],
        availableSpace: { width: 100, height: 20 },
        orientation: 'horizontal',
        priority: 'readability',
      });

      expect(textStrategy.method).toBeOneOf(['truncate', 'rotate', 'wrap', 'abbreviate']);
      expect(textStrategy.fallbacks.length).toBeGreaterThan(0);

      if (textStrategy.method === 'truncate') {
        expect(textStrategy.truncatedLabels.length).toBe(3);
        expect(textStrategy.ellipsis).toBe(true);
      }
    });

    it('should optimize number formatting for clarity', () => {
      const optimizer = new AestheticOptimizer();
      
      const numberFormat = optimizer.optimizeNumberFormatting({
        values: [1234567.89, 987654.321, 12345.67],
        space: 'limited',
        precision: 'auto',
        locale: 'en-US',
      });

      expect(numberFormat.format).toBeDefined();
      expect(numberFormat.abbreviation).toBe(true); // Should use K, M notation
      expect(numberFormat.precision).toBeGreaterThanOrEqual(0);
      expect(numberFormat.examples.length).toBe(3);

      // Should maintain relative magnitude perception
      const formattedValues = numberFormat.examples.map(ex => ex.formatted);
      expect(formattedValues[0]).toContain('1.2M'); // Approximate
    });
  });

  describe('Layout and Spacing Optimization', () => {
    it('should apply golden ratio and design principles', () => {
      const optimizer = new AestheticOptimizer();
      
      const layout = optimizer.optimizeLayout({
        chartType: ChartType.SCATTER_PLOT,
        canvasSize: { width: 800, height: 600 },
        margins: 'auto',
        aspectRatio: 'optimal',
      });

      // Should apply golden ratio principles
      const aspectRatio = layout.chartArea.width / layout.chartArea.height;
      expect(aspectRatio).toBeCloseTo(1.618, 0.2); // Golden ratio approximation

      // Should provide adequate margins
      expect(layout.margins.left).toBeGreaterThan(40);
      expect(layout.margins.bottom).toBeGreaterThan(30);
      expect(layout.margins.top).toBeGreaterThan(20);
      expect(layout.margins.right).toBeGreaterThan(20);
    });

    it('should optimize spacing for visual hierarchy', () => {
      const optimizer = new AestheticOptimizer();
      
      const spacing = optimizer.optimizeVisualHierarchy({
        elements: ['title', 'subtitle', 'chart', 'legend', 'footer'],
        importance: [5, 3, 5, 2, 1],
        available: { width: 1000, height: 700 },
      });

      // Title should have prominent spacing
      expect(spacing.title.marginBottom).toBeGreaterThan(spacing.subtitle.marginBottom);
      expect(spacing.chart.marginTop).toBeGreaterThan(10);

      // Should follow visual hierarchy principles
      const titleSpace = spacing.title.marginTop + spacing.title.marginBottom;
      const legendSpace = spacing.legend.marginTop + spacing.legend.marginBottom;
      expect(titleSpace).toBeGreaterThan(legendSpace);
    });

    it('should balance whitespace for cognitive load reduction', () => {
      const optimizer = new AestheticOptimizer();
      
      const whitespace = optimizer.optimizeWhitespace({
        contentDensity: 'high',
        cognitiveLoad: 'reduce',
        chartType: ChartType.DASHBOARD_GRID,
        elements: 12,
      });

      expect(whitespace.strategy).toBe('generous');
      expect(whitespace.gutters.horizontal).toBeGreaterThan(16);
      expect(whitespace.gutters.vertical).toBeGreaterThan(16);
      expect(whitespace.breathing.ratio).toBeGreaterThan(0.15); // 15% whitespace minimum
    });

    it('should optimize responsive breakpoints', () => {
      const optimizer = new AestheticOptimizer();
      
      const responsive = optimizer.optimizeResponsiveLayout({
        chartType: ChartType.BAR_CHART,
        dataPoints: 50,
        complexElements: ['legend', 'annotations', 'secondary_axis'],
      });

      expect(responsive.breakpoints.length).toBeGreaterThan(2);
      
      // Should have mobile, tablet, desktop optimizations
      const mobileBreakpoint = responsive.breakpoints.find(bp => bp.device === 'mobile');
      const desktopBreakpoint = responsive.breakpoints.find(bp => bp.device === 'desktop');

      expect(mobileBreakpoint).toBeDefined();
      expect(desktopBreakpoint).toBeDefined();

      // Mobile should simplify layout
      expect(mobileBreakpoint?.adaptations.legend.position).toBe('bottom');
      expect(mobileBreakpoint?.adaptations.annotations.display).toBe('simplified');
    });
  });

  describe('Animation and Interaction Aesthetics', () => {
    it('should design smooth and purposeful animations', () => {
      const optimizer = new AestheticOptimizer();
      
      const animations = optimizer.optimizeAnimations({
        chartType: ChartType.LINE_CHART,
        dataUpdates: 'frequent',
        performance: 'smooth',
        accessibility: true,
      });

      // Should use appropriate easing functions
      expect(animations.transitions.dataUpdate.easing).toBeOneOf(['ease-out', 'ease-in-out']);
      expect(animations.transitions.dataUpdate.duration).toBeLessThan(1000); // Under 1 second

      // Should respect accessibility preferences
      expect(animations.reducedMotion.alternative).toBeDefined();
      expect(animations.accessibility.respectsPreferences).toBe(true);

      // Should provide semantic animations
      expect(animations.semantics.enter.meaning).toBe('data_arrival');
      expect(animations.semantics.exit.meaning).toBe('data_removal');
    });

    it('should optimize interaction feedback', () => {
      const optimizer = new AestheticOptimizer();
      
      const interactions = optimizer.optimizeInteractionFeedback({
        chartType: ChartType.SCATTER_PLOT,
        interactionTypes: ['hover', 'click', 'select', 'brush'],
        device: 'desktop',
      });

      // Should provide immediate visual feedback
      expect(interactions.hover.responseTime).toBeLessThan(100); // 100ms
      expect(interactions.hover.visualCue).toBeDefined();

      // Should maintain consistent interaction paradigms
      expect(interactions.consistency.colorScheme).toBeDefined();
      expect(interactions.consistency.timing).toBeDefined();

      // Should provide clear affordances
      expect(interactions.affordances.cursor).toBeDefined();
      expect(interactions.affordances.visual.borderHighlight).toBe(true);
    });

    it('should design progressive disclosure for complex data', () => {
      const optimizer = new AestheticOptimizer();
      
      const disclosure = optimizer.optimizeProgressiveDisclosure({
        chartType: ChartType.CORRELATION_MATRIX,
        dataComplexity: 'high',
        userExpertise: 'mixed',
        initialView: 'overview',
      });

      expect(disclosure.levels.length).toBeGreaterThan(2);
      expect(disclosure.levels[0].label).toBe('overview');
      expect(disclosure.levels[disclosure.levels.length - 1].label).toBe('detail');

      // Should provide clear navigation between levels
      expect(disclosure.navigation.controls).toBeDefined();
      expect(disclosure.navigation.breadcrumbs).toBe(true);

      // Should maintain context during transitions
      expect(disclosure.contextPreservation.visualContinuity).toBe(true);
      expect(disclosure.contextPreservation.spatialConsistency).toBe(true);
    });
  });

  describe('Cultural and Brand Adaptation', () => {
    it('should adapt aesthetics for cultural preferences', () => {
      const optimizer = new AestheticOptimizer();
      
      const westernAesthetics = optimizer.adaptForCulture({
        culture: 'western',
        region: 'north_america',
        chartType: ChartType.BAR_CHART,
      });

      const easternAesthetics = optimizer.adaptForCulture({
        culture: 'eastern',
        region: 'east_asia',
        chartType: ChartType.BAR_CHART,
      });

      // Should respect cultural color associations
      expect(westernAesthetics.colors.success).toBe('#28a745'); // Green for success
      expect(easternAesthetics.colors.prosperity).toBe('#d4af37'); // Gold for prosperity

      // Should adapt layout preferences
      expect(westernAesthetics.layout.readingDirection).toBe('left_to_right');
      expect(easternAesthetics.layout.readingDirection).toBeOneOf(['left_to_right', 'top_to_bottom']);
    });

    it('should integrate brand guidelines seamlessly', () => {
      const optimizer = new AestheticOptimizer();
      
      const brandGuidelines = {
        primaryColor: '#1e3a8a',
        secondaryColor: '#f59e0b',
        fontFamily: 'Inter',
        logoColors: ['#1e3a8a', '#f59e0b', '#64748b'],
        designPrinciples: ['clean', 'modern', 'professional'],
      };

      const brandedAesthetics = optimizer.integratedBrandAesthetics({
        brand: brandGuidelines,
        chartType: ChartType.LINE_CHART,
        dataCategories: 4,
      });

      expect(brandedAesthetics.colorPalette.primary).toBe('#1e3a8a');
      expect(brandedAesthetics.typography.fontFamily).toContain('Inter');
      
      // Should extend brand colors harmoniously
      expect(brandedAesthetics.colorPalette.extended.length).toBe(4);
      
      // Should maintain brand consistency while ensuring accessibility
      expect(brandedAesthetics.accessibility.contrastCompliant).toBe(true);
      expect(brandedAesthetics.brandAlignment.score).toBeGreaterThan(0.8);
    });

    it('should create cohesive style systems', () => {
      const optimizer = new AestheticOptimizer();
      
      const styleSystem = optimizer.createStyleSystem({
        basePalette: ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728'],
        typographyScale: 'modular',
        spacingSystem: 'systematic',
        componentLibrary: true,
      });

      // Should provide systematic scaling
      expect(styleSystem.typography.scale.length).toBeGreaterThan(5);
      expect(styleSystem.spacing.scale.length).toBeGreaterThan(6);

      // Should generate component variations
      expect(styleSystem.components.button.variants.length).toBeGreaterThan(2);
      expect(styleSystem.components.chart.variants.length).toBeGreaterThan(3);

      // Should maintain mathematical harmony
      const spacingRatios = styleSystem.spacing.scale.map((val, i, arr) => 
        i > 0 ? val / arr[i - 1] : 1
      ).slice(1);
      
      // Should follow consistent ratio (e.g., 1.25, 1.5, or golden ratio)
      const averageRatio = spacingRatios.reduce((a, b) => a + b) / spacingRatios.length;
      expect(averageRatio).toBeGreaterThan(1.2);
      expect(averageRatio).toBeLessThan(1.8);
    });
  });

  describe('Performance and Accessibility Integration', () => {
    it('should balance aesthetics with performance', () => {
      const optimizer = new AestheticOptimizer();
      
      const performanceAesthetics = optimizer.optimizeForPerformance({
        targetDevices: ['mobile', 'desktop'],
        dataSize: 'large',
        interactionComplexity: 'high',
        aestheticPriority: 'balanced',
      });

      // Should reduce complexity for performance
      expect(performanceAesthetics.animations.complexity).toBe('reduced');
      expect(performanceAesthetics.effects.shadows).toBe('minimal');
      expect(performanceAesthetics.gradients.complexity).toBe('simple');

      // Should maintain core aesthetic principles
      expect(performanceAesthetics.coreAesthetics.preserved).toBe(true);
      expect(performanceAesthetics.userExperience.quality).toBeGreaterThan(0.8);
    });

    it('should ensure comprehensive accessibility integration', () => {
      const optimizer = new AestheticOptimizer();
      
      const accessibleAesthetics = optimizer.integrateAccessibility({
        chartType: ChartType.HEATMAP,
        requirements: ['WCAG_AA', 'colorblind_friendly', 'screen_reader', 'keyboard_nav'],
        designQuality: 'high',
      });

      // Should maintain design quality while meeting accessibility
      expect(accessibleAesthetics.wcagCompliance.level).toBe('AA');
      expect(accessibleAesthetics.colorAccessibility.colorBlindFriendly).toBe(true);
      expect(accessibleAesthetics.designQuality.score).toBeGreaterThan(0.8);

      // Should provide alternative representations
      expect(accessibleAesthetics.alternatives.patterns).toBe(true);
      expect(accessibleAesthetics.alternatives.textures).toBe(true);
      expect(accessibleAesthetics.alternatives.shapes).toBe(true);

      // Should include semantic markup
      expect(accessibleAesthetics.semantics.ariaLabels).toBe(true);
      expect(accessibleAesthetics.semantics.roleAttributes).toBe(true);
    });

    it('should validate aesthetic decisions against usability principles', () => {
      const optimizer = new AestheticOptimizer();
      
      const validation = optimizer.validateAestheticUsability({
        design: {
          colors: ['#1f77b4', '#ff7f0e', '#2ca02c'],
          typography: { fontSize: 12, contrast: 4.8 },
          layout: { density: 'moderate', whitespace: 0.2 },
        },
        chartType: ChartType.SCATTER_PLOT,
        userContext: 'analytical',
      });

      expect(validation.overall.score).toBeGreaterThan(0.7);
      expect(validation.usability.readability).toBeGreaterThan(0.8);
      expect(validation.usability.scanability).toBeGreaterThan(0.7);

      // Should identify any usability issues
      if (validation.issues.length > 0) {
        expect(validation.recommendations.length).toBeGreaterThan(0);
        validation.recommendations.forEach(rec => {
          expect(rec.impact).toBeOneOf(['low', 'medium', 'high']);
          expect(rec.effort).toBeOneOf(['low', 'medium', 'high']);
        });
      }
    });
  });

  describe('Advanced Aesthetic Intelligence', () => {
    it('should learn from user preferences and usage patterns', () => {
      const optimizer = new AestheticOptimizer();
      
      const userPreferences = {
        colorScheme: 'dark',
        density: 'minimal',
        animations: 'subtle',
        chartInteractions: ['hover', 'click'],
        sessionHistory: [
          { chart: 'bar', satisfaction: 4.2 },
          { chart: 'line', satisfaction: 4.8 },
          { chart: 'scatter', satisfaction: 3.9 },
        ],
      };

      const personalizedAesthetics = optimizer.personalizeAesthetics({
        user: userPreferences,
        chartType: ChartType.LINE_CHART,
        context: 'dashboard',
      });

      expect(personalizedAesthetics.theme).toBe('dark');
      expect(personalizedAesthetics.density).toBe('minimal');
      expect(personalizedAesthetics.personalization.confidence).toBeGreaterThan(0.6);

      // Should adapt based on satisfaction scores
      expect(personalizedAesthetics.adaptations.length).toBeGreaterThan(0);
    });

    it('should generate aesthetic variations for A/B testing', () => {
      const optimizer = new AestheticOptimizer();
      
      const variations = optimizer.generateAestheticVariations({
        baseline: {
          colorScheme: 'blue',
          layout: 'standard',
          typography: 'system',
        },
        variationCount: 3,
        testDimensions: ['color', 'layout', 'typography'],
        constraints: { accessibility: 'AA', performance: 'good' },
      });

      expect(variations.length).toBe(4); // Baseline + 3 variations
      expect(variations[0].id).toBe('baseline');

      variations.slice(1).forEach((variation, index) => {
        expect(variation.id).toBe(`variation_${index + 1}`);
        expect(variation.differences.length).toBeGreaterThan(0);
        expect(variation.hypothesis).toBeDefined();
        expect(variation.metrics.length).toBeGreaterThan(0);
      });
    });

    it('should predict aesthetic effectiveness for different audiences', () => {
      const optimizer = new AestheticOptimizer();
      
      const audienceProfiles = [
        { type: 'executive', experience: 'low', time: 'limited' },
        { type: 'analyst', experience: 'high', time: 'flexible' },
        { type: 'general', experience: 'medium', time: 'moderate' },
      ];

      const predictions = optimizer.predictAestheticEffectiveness({
        design: {
          complexity: 'moderate',
          colorCount: 5,
          interactivity: 'high',
        },
        audiences: audienceProfiles,
        chartType: ChartType.DASHBOARD_GRID,
      });

      expect(predictions.length).toBe(3);
      
      predictions.forEach(prediction => {
        expect(prediction.effectiveness.overall).toBeGreaterThan(0);
        expect(prediction.effectiveness.overall).toBeLessThanOrEqual(1);
        expect(prediction.reasoning.length).toBeGreaterThan(0);
        expect(prediction.confidence).toBeGreaterThan(0);
      });

      // Executive should prefer simpler designs
      const execPrediction = predictions.find(p => p.audience.type === 'executive');
      const analystPrediction = predictions.find(p => p.audience.type === 'analyst');
      
      if (execPrediction && analystPrediction) {
        expect(execPrediction.recommendations.simplification).toBe(true);
        expect(analystPrediction.recommendations.detailLevel).toBe('high');
      }
    });
  });
});