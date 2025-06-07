/**
 * Tests for WCAG Accessibility Engine
 */

import { WCAGAccessibilityEngine, WCAGAssessmentInput } from '../../../src/analyzers/visualization/engines/wcag-accessibility-engine';
import { ChartType, ComplexityLevel } from '../../../src/analyzers/visualization/types';

describe('WCAG Accessibility Engine', () => {
  describe('Accessibility Assessment', () => {
    test('should assess accessibility for a basic chart', () => {
      const testInput: WCAGAssessmentInput = {
        chartType: ChartType.BAR_CHART,
        colorScheme: {
          colors: ['#000000'],
          backgroundColor: '#ffffff',
          type: 'categorical'
        },
        interactivity: {
          hasKeyboardSupport: true,
          hasTooltips: true,
          hasZoom: false,
          hasFocus: true
        },
        content: {
          hasAlternativeText: true,
          hasDataTable: true,
          hasAriaLabels: true,
          textSize: 14,
          contrast: 'auto'
        },
        complexity: ComplexityLevel.SIMPLE,
        dataSize: 100
      };
      
      const result = WCAGAccessibilityEngine.assessAccessibility(testInput);

      expect(result).toBeDefined();
      expect(result.overallLevel).toBeDefined();
      expect(result.compliance).toBeDefined();
      expect(result.compliance.level).toMatch(/^(A|AA|AAA)$/);
      expect(result.improvements).toBeDefined();
      expect(result.testing).toBeDefined();
    });

    test('should identify improvements for inaccessible chart', () => {
      const testInput: WCAGAssessmentInput = {
        chartType: ChartType.PIE_CHART,
        colorScheme: {
          colors: ['#cccccc', '#dddddd'], // Poor contrast colors
          backgroundColor: '#ffffff',
          type: 'categorical'
        },
        interactivity: {
          hasKeyboardSupport: false,
          hasTooltips: false,
          hasZoom: false,
          hasFocus: false
        },
        content: {
          hasAlternativeText: false,
          hasDataTable: false,
          hasAriaLabels: false,
          textSize: 10,
          contrast: 'auto'
        },
        complexity: ComplexityLevel.MODERATE,
        dataSize: 500
      };
      
      const result = WCAGAccessibilityEngine.assessAccessibility(testInput);

      expect(result).toBeDefined();
      expect(result.improvements).toBeDefined();
      expect(result.improvements.length).toBeGreaterThan(0);
    });

    test('should generate accessibility guidance', () => {
      const guidance = WCAGAccessibilityEngine.generateAccessibilityGuidance(ChartType.SCATTER_PLOT);

      expect(guidance).toBeDefined();
      expect(guidance.level).toBeDefined();
      expect(guidance.wcagCompliance).toMatch(/^(A|AA|AAA)$/);
      expect(guidance.colorBlindness).toBeDefined();
      expect(guidance.motorImpairment).toBeDefined();
      expect(guidance.cognitiveAccessibility).toBeDefined();
      expect(guidance.recommendations).toBeDefined();
      expect(Array.isArray(guidance.recommendations)).toBe(true);
    });

    test('should handle edge cases gracefully', () => {
      expect(() => {
        WCAGAccessibilityEngine.generateAccessibilityGuidance(ChartType.LINE_CHART, {});
      }).not.toThrow();
    });
  });
});