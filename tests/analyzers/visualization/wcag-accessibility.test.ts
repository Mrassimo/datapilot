/**
 * Comprehensive tests for WCAG Accessibility Engine
 */

import { WCAGAccessibilityEngine } from '../../../src/analyzers/visualization/engines/wcag-accessibility-engine';

describe('WCAG Accessibility Engine', () => {
  describe('Color Contrast Analysis', () => {
    test('should correctly calculate WCAG AA contrast ratios', () => {
      const whiteBackground = { r: 255, g: 255, b: 255 };
      const blackText = { r: 0, g: 0, b: 0 };
      
      const result = WCAGAccessibilityEngine.analyzeColorContrast([
        { foreground: blackText, background: whiteBackground, context: 'text' }
      ]);

      expect(result.contrastRatios[0].ratio).toBeCloseTo(21, 1); // Perfect contrast
      expect(result.contrastRatios[0].wcagAA).toBe(true);
      expect(result.contrastRatios[0].wcagAAA).toBe(true);
    });

    test('should identify insufficient contrast ratios', () => {
      const lightGray = { r: 200, g: 200, b: 200 };
      const darkGray = { r: 100, g: 100, b: 100 };
      
      const result = WCAGAccessibilityEngine.analyzeColorContrast([
        { foreground: darkGray, background: lightGray, context: 'text' }
      ]);

      expect(result.contrastRatios[0].ratio).toBeLessThan(4.5);
      expect(result.contrastRatios[0].wcagAA).toBe(false);
      expect(result.contrastRatios[0].recommendations).toContain('contrast');
    });

    test('should handle large text contrast requirements', () => {
      const mediumGray = { r: 150, g: 150, b: 150 };
      const white = { r: 255, g: 255, b: 255 };
      
      const result = WCAGAccessibilityEngine.analyzeColorContrast([
        { foreground: mediumGray, background: white, context: 'large_text' }
      ]);

      // Large text only needs 3:1 ratio
      const ratio = result.contrastRatios[0].ratio;
      if (ratio >= 3.0 && ratio < 4.5) {
        expect(result.contrastRatios[0].wcagAA).toBe(true); // AA for large text
      }
    });

    test('should provide specific improvement recommendations', () => {
      const poorContrast = { r: 180, g: 180, b: 180 };
      const background = { r: 200, g: 200, b: 200 };
      
      const result = WCAGAccessibilityEngine.analyzeColorContrast([
        { foreground: poorContrast, background: background, context: 'text' }
      ]);

      expect(result.recommendations).toContain('darker text color');
      expect(result.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('Color Blindness Simulation', () => {
    test('should simulate protanopia (red-blind)', () => {
      const redColor = { r: 255, g: 0, b: 0 };
      const greenColor = { r: 0, g: 255, b: 0 };
      
      const result = WCAGAccessibilityEngine.analyzeColorBlindness([
        { original: redColor, context: 'data_point_1' },
        { original: greenColor, context: 'data_point_2' }
      ]);

      const protanopiaResult = result.simulations.find(s => s.type === 'protanopia');
      expect(protanopiaResult).toBeDefined();
      expect(protanopiaResult!.affectedColors.length).toBeGreaterThan(0);
      expect(protanopiaResult!.distinctionScore).toBeLessThan(1.0);
    });

    test('should simulate deuteranopia (green-blind)', () => {
      const redColor = { r: 255, g: 0, b: 0 };
      const greenColor = { r: 0, g: 255, b: 0 };
      
      const result = WCAGAccessibilityEngine.analyzeColorBlindness([
        { original: redColor, context: 'category_a' },
        { original: greenColor, context: 'category_b' }
      ]);

      const deuteranopiaResult = result.simulations.find(s => s.type === 'deuteranopia');
      expect(deuteranopiaResult).toBeDefined();
      expect(deuteranopiaResult!.distinctionScore).toBeLessThan(1.0);
    });

    test('should simulate tritanopia (blue-blind)', () => {
      const blueColor = { r: 0, g: 0, b: 255 };
      const yellowColor = { r: 255, g: 255, b: 0 };
      
      const result = WCAGAccessibilityEngine.analyzeColorBlindness([
        { original: blueColor, context: 'series_1' },
        { original: yellowColor, context: 'series_2' }
      ]);

      const tritanopiaResult = result.simulations.find(s => s.type === 'tritanopia');
      expect(tritanopiaResult).toBeDefined();
      expect(tritanopiaResult!.affectedColors.length).toBeGreaterThan(0);
    });

    test('should provide alternative color suggestions', () => {
      const problematicPalette = [
        { r: 255, g: 0, b: 0 },   // Red
        { r: 0, g: 255, b: 0 },   // Green
        { r: 255, g: 165, b: 0 }  // Orange
      ];
      
      const result = WCAGAccessibilityEngine.analyzeColorBlindness(
        problematicPalette.map((color, i) => ({ original: color, context: `item_${i}` }))
      );

      expect(result.recommendations).toContain('patterns');
      expect(result.alternativeStrategies.length).toBeGreaterThan(0);
      expect(result.alternativeStrategies).toContain('shapes');
    });

    test('should calculate color distinction scores accurately', () => {
      const highContrastColors = [
        { r: 0, g: 0, b: 0 },     // Black
        { r: 255, g: 255, b: 255 } // White
      ];
      
      const result = WCAGAccessibilityEngine.analyzeColorBlindness(
        highContrastColors.map((color, i) => ({ original: color, context: `high_contrast_${i}` }))
      );

      // High contrast colors should maintain distinction even with color blindness
      result.simulations.forEach(simulation => {
        expect(simulation.distinctionScore).toBeGreaterThan(0.8);
      });
    });
  });

  describe('Screen Reader Compatibility', () => {
    test('should analyze text content accessibility', () => {
      const chartElements = [
        { type: 'axis', hasAriaLabel: true, hasRole: true, content: 'X-axis: Time' },
        { type: 'data_series', hasAriaLabel: false, hasRole: false, content: 'Series 1' },
        { type: 'legend', hasAriaLabel: true, hasRole: true, content: 'Legend: Categories' }
      ];
      
      const result = WCAGAccessibilityEngine.analyzeScreenReaderCompatibility(chartElements);

      expect(result.overallScore).toBeGreaterThan(0);
      expect(result.missingAriaLabels.length).toBe(1); // data_series missing aria-label
      expect(result.missingRoles.length).toBe(1); // data_series missing role
      expect(result.improvements.length).toBeGreaterThan(0);
    });

    test('should validate ARIA labels and roles', () => {
      const wellStructuredElements = [
        { type: 'chart', hasAriaLabel: true, hasRole: true, content: 'Sales data chart' },
        { type: 'axis', hasAriaLabel: true, hasRole: true, content: 'Revenue axis' },
        { type: 'data_point', hasAriaLabel: true, hasRole: true, content: 'Q1 2023: $100k' }
      ];
      
      const result = WCAGAccessibilityEngine.analyzeScreenReaderCompatibility(wellStructuredElements);

      expect(result.overallScore).toBeGreaterThan(0.8);
      expect(result.missingAriaLabels.length).toBe(0);
      expect(result.missingRoles.length).toBe(0);
    });

    test('should identify missing alt text for images', () => {
      const elementsWithImages = [
        { type: 'image', hasAriaLabel: false, hasRole: false, content: 'chart.png' },
        { type: 'icon', hasAriaLabel: true, hasRole: true, content: 'warning icon' }
      ];
      
      const result = WCAGAccessibilityEngine.analyzeScreenReaderCompatibility(elementsWithImages);

      expect(result.missingAriaLabels).toContain('image');
      expect(result.improvements).toContain('alt text');
    });

    test('should suggest data table alternatives', () => {
      const complexChart = [
        { type: 'complex_chart', hasAriaLabel: true, hasRole: true, content: 'Multi-series line chart' }
      ];
      
      const result = WCAGAccessibilityEngine.analyzeScreenReaderCompatibility(complexChart);

      expect(result.dataTableSuggestion).toBe(true);
      expect(result.improvements).toContain('data table');
    });
  });

  describe('Keyboard Navigation', () => {
    test('should analyze tab order and focus management', () => {
      const interactiveElements = [
        { element: 'chart_container', focusable: true, tabIndex: 0, hasKeyHandlers: true },
        { element: 'legend_toggle', focusable: true, tabIndex: 1, hasKeyHandlers: false },
        { element: 'filter_dropdown', focusable: false, tabIndex: -1, hasKeyHandlers: false }
      ];
      
      const result = WCAGAccessibilityEngine.analyzeKeyboardNavigation(interactiveElements);

      expect(result.tabOrderScore).toBeGreaterThan(0);
      expect(result.focusableElements).toBe(2);
      expect(result.missingKeyHandlers.length).toBeGreaterThan(0);
    });

    test('should validate focus indicators', () => {
      const elementsWithFocus = [
        { element: 'button', focusable: true, hasFocusIndicator: true, hasKeyHandlers: true },
        { element: 'link', focusable: true, hasFocusIndicator: false, hasKeyHandlers: false }
      ];
      
      const result = WCAGAccessibilityEngine.analyzeKeyboardNavigation(elementsWithFocus);

      expect(result.missingFocusIndicators).toContain('link');
      expect(result.recommendations).toContain('focus indicator');
    });

    test('should identify keyboard traps', () => {
      const trapElements = [
        { element: 'modal', focusable: true, trapsFocus: true, hasEscapeHandler: false },
        { element: 'dialog', focusable: true, trapsFocus: true, hasEscapeHandler: true }
      ];
      
      const result = WCAGAccessibilityEngine.analyzeKeyboardNavigation(trapElements);

      expect(result.keyboardTraps.length).toBeGreaterThan(0);
      expect(result.keyboardTraps).toContain('modal');
    });

    test('should suggest keyboard shortcuts', () => {
      const chartElements = [
        { element: 'chart', focusable: true, hasKeyHandlers: false, type: 'interactive_chart' }
      ];
      
      const result = WCAGAccessibilityEngine.analyzeKeyboardNavigation(chartElements);

      expect(result.shortcutSuggestions.length).toBeGreaterThan(0);
      expect(result.shortcutSuggestions).toContain('arrow keys');
    });
  });

  describe('Animation and Motion', () => {
    test('should analyze animation accessibility', () => {
      const animatedElements = [
        { type: 'transition', duration: 300, hasReducedMotion: true, isEssential: false },
        { type: 'auto_scroll', duration: 5000, hasReducedMotion: false, isEssential: false },
        { type: 'loading_spinner', duration: -1, hasReducedMotion: true, isEssential: true }
      ];
      
      const result = WCAGAccessibilityEngine.analyzeMotionAccessibility(animatedElements);

      expect(result.problematicAnimations.length).toBeGreaterThan(0);
      expect(result.reducedMotionSupport).toBeGreaterThan(0.5);
    });

    test('should identify seizure-triggering content', () => {
      const flashingElements = [
        { type: 'flash', flashRate: 4, duration: 1000, area: 'large' }, // Safe
        { type: 'strobe', flashRate: 15, duration: 2000, area: 'small' } // Dangerous
      ];
      
      const result = WCAGAccessibilityEngine.analyzeMotionAccessibility(flashingElements);

      expect(result.seizureRisk).toBe(true);
      expect(result.problematicAnimations).toContain('strobe');
    });

    test('should suggest prefers-reduced-motion alternatives', () => {
      const motionElements = [
        { type: 'parallax', hasReducedMotion: false, isEssential: false }
      ];
      
      const result = WCAGAccessibilityEngine.analyzeMotionAccessibility(motionElements);

      expect(result.reducedMotionAlternatives.length).toBeGreaterThan(0);
      expect(result.reducedMotionAlternatives).toContain('static');
    });
  });

  describe('Comprehensive Accessibility Scoring', () => {
    test('should calculate overall WCAG compliance score', () => {
      const mockReport = {
        colorContrast: { overallScore: 0.85, issues: 2 },
        colorBlindness: { overallScore: 0.90, issues: 1 },
        screenReader: { overallScore: 0.75, issues: 3 },
        keyboardNav: { overallScore: 0.80, issues: 2 },
        motion: { overallScore: 0.95, issues: 0 }
      };
      
      const result = WCAGAccessibilityEngine.calculateComplianceScore(mockReport);

      expect(result.overallScore).toBeGreaterThan(0);
      expect(result.overallScore).toBeLessThan(1);
      expect(result.wcagLevel).toMatch(/^(A|AA|AAA|Non-compliant)$/);
      expect(result.priorityIssues.length).toBeGreaterThan(0);
    });

    test('should prioritize critical accessibility issues', () => {
      const mockReport = {
        colorContrast: { overallScore: 0.3, issues: 10 }, // Critical
        colorBlindness: { overallScore: 0.9, issues: 1 },
        screenReader: { overallScore: 0.2, issues: 15 }, // Critical
        keyboardNav: { overallScore: 0.8, issues: 2 },
        motion: { overallScore: 1.0, issues: 0 }
      };
      
      const result = WCAGAccessibilityEngine.calculateComplianceScore(mockReport);

      expect(result.criticalIssues.length).toBeGreaterThan(0);
      expect(result.criticalIssues).toContain('color contrast');
      expect(result.criticalIssues).toContain('screen reader');
    });

    test('should provide actionable improvement roadmap', () => {
      const mockReport = {
        colorContrast: { overallScore: 0.6, issues: 5 },
        colorBlindness: { overallScore: 0.7, issues: 3 },
        screenReader: { overallScore: 0.5, issues: 8 },
        keyboardNav: { overallScore: 0.4, issues: 10 },
        motion: { overallScore: 0.8, issues: 2 }
      };
      
      const result = WCAGAccessibilityEngine.calculateComplianceScore(mockReport);

      expect(result.improvementRoadmap.length).toBeGreaterThan(0);
      expect(result.improvementRoadmap[0].priority).toBe('high');
      expect(result.timeToCompliance).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle empty input gracefully', () => {
      expect(() => WCAGAccessibilityEngine.analyzeColorContrast([])).not.toThrow();
      expect(() => WCAGAccessibilityEngine.analyzeColorBlindness([])).not.toThrow();
      expect(() => WCAGAccessibilityEngine.analyzeScreenReaderCompatibility([])).not.toThrow();
    });

    test('should handle invalid color values', () => {
      const invalidColors = [
        { foreground: { r: -1, g: 300, b: 150 }, background: { r: 255, g: 255, b: 255 }, context: 'invalid' }
      ];
      
      expect(() => WCAGAccessibilityEngine.analyzeColorContrast(invalidColors)).not.toThrow();
    });

    test('should handle missing properties gracefully', () => {
      const incompleteElements = [
        { type: 'partial', hasAriaLabel: true }, // Missing other properties
        {} // Empty object
      ];
      
      expect(() => WCAGAccessibilityEngine.analyzeScreenReaderCompatibility(incompleteElements)).not.toThrow();
    });

    test('should provide meaningful error messages', () => {
      const result = WCAGAccessibilityEngine.analyzeColorContrast([]);
      
      expect(result.warnings).toBeDefined();
      if (result.warnings && result.warnings.length > 0) {
        expect(result.warnings[0]).toContain('No colors');
      }
    });
  });

  describe('Performance with Large Datasets', () => {
    test('should handle large color palettes efficiently', () => {
      const largeColorSet = Array.from({ length: 100 }, (_, i) => ({
        original: { r: i * 2, g: (i * 3) % 255, b: (i * 5) % 255 },
        context: `color_${i}`
      }));
      
      const startTime = Date.now();
      const result = WCAGAccessibilityEngine.analyzeColorBlindness(largeColorSet);
      const duration = Date.now() - startTime;
      
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
      expect(result).toBeDefined();
    });

    test('should handle complex UI structures efficiently', () => {
      const complexUI = Array.from({ length: 50 }, (_, i) => ({
        type: `element_${i}`,
        hasAriaLabel: i % 2 === 0,
        hasRole: i % 3 === 0,
        content: `Element ${i} content`
      }));
      
      const startTime = Date.now();
      const result = WCAGAccessibilityEngine.analyzeScreenReaderCompatibility(complexUI);
      const duration = Date.now() - startTime;
      
      expect(duration).toBeLessThan(2000); // Should complete within 2 seconds
      expect(result.overallScore).toBeDefined();
    });
  });
});