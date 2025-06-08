/**
 * WCAG Accessibility Scoring Engine
 * Comprehensive accessibility assessment for data visualizations
 *
 * Features:
 * - WCAG 2.1 compliance scoring (A, AA, AAA levels)
 * - Color accessibility analysis including contrast ratios
 * - Keyboard navigation assessment
 * - Screen reader compatibility scoring
 * - Motor impairment considerations
 * - Cognitive accessibility evaluation
 */

import { ChartType, AccessibilityLevel, ComplexityLevel } from '../types';
import type {
  AccessibilityGuidance,
  WCAGCompliance,
  WCAGCriterion,
  ComplianceGap,
  AccessibilityAssessment,
  AccessibilityImprovement,
  ColorAccessibility,
  ColorBlindnessSupport,
  MotorImpairmentSupport,
  CognitiveAccessibilitySupport,
  ContrastRatio,
} from '../types';

export interface WCAGAssessmentInput {
  chartType: ChartType;
  colorScheme: {
    colors: string[];
    backgroundColor?: string;
    type: 'categorical' | 'sequential' | 'diverging' | 'single';
  };
  interactivity: {
    hasKeyboardSupport: boolean;
    hasTooltips: boolean;
    hasZoom: boolean;
    hasFocus: boolean;
  };
  content: {
    hasAlternativeText: boolean;
    hasDataTable: boolean;
    hasAriaLabels: boolean;
    textSize: number;
    contrast: 'auto' | 'manual';
  };
  complexity: ComplexityLevel;
  dataSize: number;
}

export interface AccessibilityScore {
  overallScore: number; // 0-100
  level: AccessibilityLevel;
  wcagLevel: 'A' | 'AA' | 'AAA';
  breakdown: {
    perceivable: number;
    operable: number;
    understandable: number;
    robust: number;
  };
}

export class WCAGAccessibilityEngine {
  private static readonly WCAG_CRITERIA: WCAGCriterion[] = [
    // Perceivable
    {
      id: '1.1.1',
      level: 'A',
      status: 'not_applicable',
      description: 'Non-text Content: Provide text alternatives for non-text content',
    },
    {
      id: '1.4.3',
      level: 'AA',
      status: 'not_applicable',
      description: 'Contrast (Minimum): 4.5:1 contrast ratio for normal text, 3:1 for large text',
    },
    {
      id: '1.4.6',
      level: 'AAA',
      status: 'not_applicable',
      description: 'Contrast (Enhanced): 7:1 contrast ratio for normal text, 4.5:1 for large text',
    },
    {
      id: '1.4.11',
      level: 'AA',
      status: 'not_applicable',
      description: 'Non-text Contrast: 3:1 contrast ratio for UI components and graphics',
    },

    // Operable
    {
      id: '2.1.1',
      level: 'A',
      status: 'not_applicable',
      description: 'Keyboard: All functionality available via keyboard',
    },
    {
      id: '2.1.2',
      level: 'A',
      status: 'not_applicable',
      description: 'No Keyboard Trap: Focus can move away from any component',
    },
    {
      id: '2.4.3',
      level: 'A',
      status: 'not_applicable',
      description: 'Focus Order: Logical focus sequence',
    },
    {
      id: '2.4.7',
      level: 'AA',
      status: 'not_applicable',
      description: 'Focus Visible: Keyboard focus indicator is visible',
    },

    // Understandable
    {
      id: '3.1.1',
      level: 'A',
      status: 'not_applicable',
      description: 'Language of Page: Primary language is specified',
    },
    {
      id: '3.2.1',
      level: 'A',
      status: 'not_applicable',
      description: 'On Focus: No unexpected context changes on focus',
    },

    // Robust
    {
      id: '4.1.2',
      level: 'A',
      status: 'not_applicable',
      description: 'Name, Role, Value: UI components have accessible names and roles',
    },
  ];

  /**
   * Assess comprehensive accessibility for a visualization
   */
  static assessAccessibility(input: WCAGAssessmentInput): AccessibilityAssessment {
    const compliance = this.evaluateWCAGCompliance(input);
    const score = this.calculateAccessibilityScore(input, compliance);
    const improvements = this.generateImprovements(input, compliance);

    return {
      overallLevel: score.level,
      compliance,
      improvements,
      testing: {
        automated: {
          tools: ['axe-core', 'lighthouse', 'pa11y'],
          frequency: 'On each build',
          coverage: this.calculateTestCoverage(input),
        },
        manual: {
          procedures: [
            'Keyboard navigation testing',
            'Screen reader testing with NVDA/JAWS',
            'Color blindness simulation',
            'Cognitive load assessment',
          ],
          frequency: 'Weekly during development',
          checklist: this.generateManualTestChecklist(input.chartType),
        },
        userTesting: {
          groups: [
            'Users with visual impairments',
            'Users with motor impairments',
            'Elderly users',
          ],
          scenarios: this.generateUserTestScenarios(input.chartType),
          frequency: 'Before major releases',
        },
      },
    };
  }

  /**
   * Generate detailed accessibility guidance for a specific chart type
   */
  static generateAccessibilityGuidance(
    chartType: ChartType,
    input: Partial<WCAGAssessmentInput> = {},
  ): AccessibilityGuidance {
    const defaultInput: WCAGAssessmentInput = {
      chartType,
      colorScheme: {
        colors: ['#1f77b4', '#ff7f0e'],
        backgroundColor: '#ffffff',
        type: 'categorical',
      },
      interactivity: {
        hasKeyboardSupport: false,
        hasTooltips: false,
        hasZoom: false,
        hasFocus: false,
      },
      content: {
        hasAlternativeText: false,
        hasDataTable: false,
        hasAriaLabels: false,
        textSize: 12,
        contrast: 'auto',
      },
      complexity: ComplexityLevel.MODERATE,
      dataSize: 1000,
    };

    const mergedInput = { ...defaultInput, ...input };
    const assessment = this.assessAccessibility(mergedInput);

    return {
      level: assessment.overallLevel,
      wcagCompliance: assessment.compliance.level,
      colorBlindness: this.assessColorBlindnessSupport(mergedInput.colorScheme),
      motorImpairment: this.assessMotorImpairmentSupport(mergedInput),
      cognitiveAccessibility: this.assessCognitiveAccessibility(mergedInput),
      recommendations: this.generateRecommendations(chartType, mergedInput),
    };
  }

  /**
   * Evaluate WCAG compliance across all criteria
   */
  private static evaluateWCAGCompliance(input: WCAGAssessmentInput): WCAGCompliance {
    const criteria = this.WCAG_CRITERIA.map((criterion) => ({
      ...criterion,
      status: this.evaluateCriterion(criterion, input),
    }));

    const gaps = this.identifyComplianceGaps(criteria, input);
    const level = this.determineComplianceLevel(criteria);

    return {
      level,
      criteria,
      gaps,
    };
  }

  /**
   * Evaluate individual WCAG criterion
   */
  private static evaluateCriterion(
    criterion: WCAGCriterion,
    input: WCAGAssessmentInput,
  ): 'pass' | 'fail' | 'not_applicable' {
    switch (criterion.id) {
      case '1.1.1': // Non-text Content
        return input.content.hasAlternativeText ? 'pass' : 'fail';

      case '1.4.3': // Contrast (Minimum)
        return this.evaluateMinimumContrast(input) ? 'pass' : 'fail';

      case '1.4.6': // Contrast (Enhanced)
        return this.evaluateEnhancedContrast(input) ? 'pass' : 'fail';

      case '1.4.11': // Non-text Contrast
        return this.evaluateNonTextContrast(input) ? 'pass' : 'fail';

      case '2.1.1': // Keyboard
        return input.interactivity.hasKeyboardSupport ? 'pass' : 'fail';

      case '2.1.2': // No Keyboard Trap
        return input.interactivity.hasKeyboardSupport ? 'pass' : 'not_applicable';

      case '2.4.3': // Focus Order
        return input.interactivity.hasFocus ? 'pass' : 'fail';

      case '2.4.7': // Focus Visible
        return input.interactivity.hasFocus ? 'pass' : 'fail';

      case '3.1.1': // Language of Page
        return 'pass'; // Assume page language is properly set

      case '3.2.1': // On Focus
        return 'pass'; // Data visualizations typically don't change context on focus

      case '4.1.2': // Name, Role, Value
        return input.content.hasAriaLabels ? 'pass' : 'fail';

      default:
        return 'not_applicable';
    }
  }

  /**
   * Calculate comprehensive accessibility score
   */
  private static calculateAccessibilityScore(
    input: WCAGAssessmentInput,
    compliance: WCAGCompliance,
  ): AccessibilityScore {
    const breakdown = {
      perceivable: this.calculatePerceivableScore(input, compliance),
      operable: this.calculateOperableScore(input, compliance),
      understandable: this.calculateUnderstandableScore(input, compliance),
      robust: this.calculateRobustScore(input, compliance),
    };

    const overallScore =
      breakdown.perceivable * 0.4 +
      breakdown.operable * 0.3 +
      breakdown.understandable * 0.2 +
      breakdown.robust * 0.1;

    return {
      overallScore: Math.round(overallScore),
      level: this.scoreToAccessibilityLevel(overallScore),
      wcagLevel: compliance.level,
      breakdown,
    };
  }

  /**
   * Calculate Perceivable principle score (40% of total)
   */
  private static calculatePerceivableScore(
    input: WCAGAssessmentInput,
    compliance: WCAGCompliance,
  ): number {
    let score = 0;
    let maxScore = 0;

    // Text alternatives (20 points)
    maxScore += 20;
    if (input.content.hasAlternativeText) score += 20;
    else if (input.content.hasDataTable) score += 15;

    // Color contrast (30 points)
    maxScore += 30;
    const contrastScore = this.calculateContrastScore(input);
    score += contrastScore * 30;

    // Color accessibility (25 points)
    maxScore += 25;
    const colorBlindScore = this.calculateColorBlindScore(input.colorScheme);
    score += colorBlindScore * 25;

    // Information not lost (25 points)
    maxScore += 25;
    if (!this.reliesOnlyOnColor(input)) score += 25;
    else if (this.hasAlternativeEncoding(input)) score += 15;

    return Math.min(100, (score / maxScore) * 100);
  }

  /**
   * Calculate Operable principle score (30% of total)
   */
  private static calculateOperableScore(
    input: WCAGAssessmentInput,
    compliance: WCAGCompliance,
  ): number {
    let score = 0;
    let maxScore = 0;

    // Keyboard accessibility (40 points)
    maxScore += 40;
    if (input.interactivity.hasKeyboardSupport) {
      score += 40;
    } else if (this.hasBasicKeyboardSupport(input.chartType)) {
      score += 20;
    }

    // Focus management (30 points)
    maxScore += 30;
    if (input.interactivity.hasFocus) score += 30;
    else if (input.interactivity.hasKeyboardSupport) score += 15;

    // Target size (20 points) - important for motor impairments
    maxScore += 20;
    score += this.calculateTargetSizeScore(input) * 20;

    // Timing considerations (10 points)
    maxScore += 10;
    if (!this.hasTimingRequirements(input.chartType)) score += 10;

    return Math.min(100, (score / maxScore) * 100);
  }

  /**
   * Calculate Understandable principle score (20% of total)
   */
  private static calculateUnderstandableScore(
    input: WCAGAssessmentInput,
    compliance: WCAGCompliance,
  ): number {
    let score = 0;
    let maxScore = 0;

    // Content clarity (40 points)
    maxScore += 40;
    score += this.calculateContentClarityScore(input) * 40;

    // Predictable behavior (30 points)
    maxScore += 30;
    if (this.hasPredictableBehavior(input.chartType)) score += 30;

    // Error prevention (30 points)
    maxScore += 30;
    score += this.calculateErrorPreventionScore(input) * 30;

    return Math.min(100, (score / maxScore) * 100);
  }

  /**
   * Calculate Robust principle score (10% of total)
   */
  private static calculateRobustScore(
    input: WCAGAssessmentInput,
    compliance: WCAGCompliance,
  ): number {
    let score = 0;
    let maxScore = 0;

    // Semantic markup (50 points)
    maxScore += 50;
    if (input.content.hasAriaLabels) score += 50;
    else if (input.content.hasDataTable) score += 25;

    // Assistive technology compatibility (50 points)
    maxScore += 50;
    score += this.calculateATCompatibilityScore(input) * 50;

    return Math.min(100, (score / maxScore) * 100);
  }

  /**
   * Assess color blindness support
   */
  private static assessColorBlindnessSupport(
    colorScheme: WCAGAssessmentInput['colorScheme'],
  ): ColorBlindnessSupport {
    const simulatedColors = {
      protanopia: this.simulateColorBlindness(colorScheme.colors, 'protanopia'),
      deuteranopia: this.simulateColorBlindness(colorScheme.colors, 'deuteranopia'),
      tritanopia: this.simulateColorBlindness(colorScheme.colors, 'tritanopia'),
    };

    return {
      protanopia: this.areColorsDistinguishable(simulatedColors.protanopia),
      deuteranopia: this.areColorsDistinguishable(simulatedColors.deuteranopia),
      tritanopia: this.areColorsDistinguishable(simulatedColors.tritanopia),
      monochromacy: this.areColorsDistinguishableInGrayscale(colorScheme.colors),
      alternativeEncodings: this.getAlternativeEncodings(colorScheme.type),
    };
  }

  /**
   * Assess motor impairment support
   */
  private static assessMotorImpairmentSupport(input: WCAGAssessmentInput): MotorImpairmentSupport {
    return {
      largeClickTargets: this.hasLargeClickTargets(input.chartType),
      keyboardOnly: input.interactivity.hasKeyboardSupport,
      customControls: this.hasCustomControls(input.chartType),
      timeoutExtensions: !this.hasTimingRequirements(input.chartType),
    };
  }

  /**
   * Assess cognitive accessibility support
   */
  private static assessCognitiveAccessibility(
    input: WCAGAssessmentInput,
  ): CognitiveAccessibilitySupport {
    const cognitiveLoad = this.calculateCognitiveLoad(input);

    return {
      simplicityLevel: input.complexity,
      progressiveDisclosure: this.supportsProgressiveDisclosure(input.chartType),
      errorPrevention: this.getErrorPreventionStrategies(input.chartType),
      cognitiveLoad,
    };
  }

  /**
   * Generate accessibility recommendations
   */
  private static generateRecommendations(
    chartType: ChartType,
    input: WCAGAssessmentInput,
  ): string[] {
    const recommendations: string[] = [];

    // Color and contrast recommendations
    if (!this.evaluateMinimumContrast(input)) {
      recommendations.push('Increase color contrast to meet WCAG AA standards (4.5:1 ratio)');
    }

    if (!this.assessColorBlindnessSupport(input.colorScheme).protanopia) {
      recommendations.push('Use color-blind safe palette or add pattern/texture encoding');
    }

    // Keyboard accessibility
    if (!input.interactivity.hasKeyboardSupport) {
      recommendations.push('Implement keyboard navigation for all interactive elements');
    }

    // Alternative content
    if (!input.content.hasAlternativeText) {
      recommendations.push('Provide descriptive alternative text for the visualization');
    }

    if (!input.content.hasDataTable) {
      recommendations.push('Include accessible data table as alternative to chart');
    }

    // ARIA labels and semantic structure
    if (!input.content.hasAriaLabels) {
      recommendations.push('Add ARIA labels and roles for better screen reader support');
    }

    // Chart-specific recommendations
    recommendations.push(...this.getChartSpecificRecommendations(chartType));

    return recommendations;
  }

  // ===== HELPER METHODS =====

  private static evaluateMinimumContrast(input: WCAGAssessmentInput): boolean {
    const bgColor = input.colorScheme.backgroundColor || '#ffffff';
    return input.colorScheme.colors.every(
      (color) => this.calculateContrastRatio(color, bgColor) >= 4.5,
    );
  }

  private static evaluateEnhancedContrast(input: WCAGAssessmentInput): boolean {
    const bgColor = input.colorScheme.backgroundColor || '#ffffff';
    return input.colorScheme.colors.every(
      (color) => this.calculateContrastRatio(color, bgColor) >= 7.0,
    );
  }

  private static evaluateNonTextContrast(input: WCAGAssessmentInput): boolean {
    const bgColor = input.colorScheme.backgroundColor || '#ffffff';
    return input.colorScheme.colors.every(
      (color) => this.calculateContrastRatio(color, bgColor) >= 3.0,
    );
  }

  private static calculateContrastRatio(color1: string, color2: string): number {
    const luminance1 = this.getRelativeLuminance(color1);
    const luminance2 = this.getRelativeLuminance(color2);
    const lighter = Math.max(luminance1, luminance2);
    const darker = Math.min(luminance1, luminance2);
    return (lighter + 0.05) / (darker + 0.05);
  }

  private static getRelativeLuminance(color: string): number {
    // Convert hex color to RGB then to relative luminance
    const rgb = this.hexToRgb(color);
    if (!rgb) return 0;

    const rsRGB = rgb.r / 255;
    const gsRGB = rgb.g / 255;
    const bsRGB = rgb.b / 255;

    const r = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
    const g = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
    const b = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  private static hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  }

  private static simulateColorBlindness(
    colors: string[],
    type: 'protanopia' | 'deuteranopia' | 'tritanopia',
  ): string[] {
    // Simplified color blindness simulation
    // In a real implementation, this would use proper color transformation matrices
    return colors.map((color) => {
      const rgb = this.hexToRgb(color);
      if (!rgb) return color;

      switch (type) {
        case 'protanopia':
          return `rgb(${Math.round(rgb.g * 0.9)}, ${rgb.g}, ${rgb.b})`;
        case 'deuteranopia':
          return `rgb(${rgb.r}, ${Math.round(rgb.r * 0.9)}, ${rgb.b})`;
        case 'tritanopia':
          return `rgb(${rgb.r}, ${rgb.g}, ${Math.round(rgb.g * 0.9)})`;
        default:
          return color;
      }
    });
  }

  private static areColorsDistinguishable(colors: string[]): boolean {
    // Check if colors are sufficiently different for accessibility
    for (let i = 0; i < colors.length; i++) {
      for (let j = i + 1; j < colors.length; j++) {
        if (this.calculateContrastRatio(colors[i], colors[j]) < 3.0) {
          return false;
        }
      }
    }
    return true;
  }

  private static areColorsDistinguishableInGrayscale(colors: string[]): boolean {
    const grayscaleColors = colors.map((color) => {
      const rgb = this.hexToRgb(color);
      if (!rgb) return color;
      const gray = Math.round(0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b);
      return `rgb(${gray}, ${gray}, ${gray})`;
    });
    return this.areColorsDistinguishable(grayscaleColors);
  }

  private static getAlternativeEncodings(type: string): string[] {
    switch (type) {
      case 'categorical':
        return ['pattern', 'shape', 'texture', 'position'];
      case 'sequential':
        return ['size', 'opacity', 'texture density'];
      case 'diverging':
        return ['pattern direction', 'shape orientation', 'size variation'];
      default:
        return ['pattern', 'texture'];
    }
  }

  private static calculateContrastScore(input: WCAGAssessmentInput): number {
    const bgColor = input.colorScheme.backgroundColor || '#ffffff';
    const contrastRatios = input.colorScheme.colors.map((color) =>
      this.calculateContrastRatio(color, bgColor),
    );

    const minContrast = Math.min(...contrastRatios);

    if (minContrast >= 7.0) return 1.0; // AAA
    if (minContrast >= 4.5) return 0.8; // AA
    if (minContrast >= 3.0) return 0.6; // A
    return Math.max(0, minContrast / 4.5); // Proportional below minimum
  }

  private static calculateColorBlindScore(colorScheme: WCAGAssessmentInput['colorScheme']): number {
    const support = this.assessColorBlindnessSupport(colorScheme);
    let score = 0;
    const maxScore = 4;

    if (support.protanopia) score += 1;
    if (support.deuteranopia) score += 1;
    if (support.tritanopia) score += 1;
    if (support.monochromacy) score += 1;

    return score / maxScore;
  }

  private static reliesOnlyOnColor(input: WCAGAssessmentInput): boolean {
    // Simple heuristic - would need more sophisticated analysis in practice
    return input.colorScheme.type === 'categorical' && input.colorScheme.colors.length > 2;
  }

  private static hasAlternativeEncoding(input: WCAGAssessmentInput): boolean {
    // Check if chart type typically supports alternative encodings
    const supportedTypes = [ChartType.SCATTER_PLOT, ChartType.BAR_CHART, ChartType.LINE_CHART];
    return supportedTypes.includes(input.chartType);
  }

  private static hasBasicKeyboardSupport(chartType: ChartType): boolean {
    // Some chart types have inherent keyboard support
    const basicSupportTypes = [ChartType.BAR_CHART, ChartType.PIE_CHART, ChartType.LINE_CHART];
    return basicSupportTypes.includes(chartType);
  }

  private static calculateTargetSizeScore(input: WCAGAssessmentInput): number {
    // Heuristic based on chart type and interactivity
    if (!input.interactivity.hasKeyboardSupport && !input.interactivity.hasTooltips) {
      return 1.0; // No interactive targets
    }

    // Interactive charts need appropriate target sizes (44x44px minimum)
    const interactiveTypes = [ChartType.SCATTER_PLOT, ChartType.BAR_CHART];
    return interactiveTypes.includes(input.chartType) ? 0.8 : 0.6;
  }

  private static hasTimingRequirements(chartType: ChartType): boolean {
    // Charts that might have automatic updates or animations
    const timingTypes = [ChartType.TIME_SERIES_LINE, ChartType.CALENDAR_HEATMAP];
    return timingTypes.includes(chartType);
  }

  private static calculateContentClarityScore(input: WCAGAssessmentInput): number {
    let score = 0.5; // Base score

    if (input.content.hasAlternativeText) score += 0.3;
    if (input.content.hasAriaLabels) score += 0.2;

    // Text size factor
    if (input.content.textSize >= 14) score += 0.1;
    else if (input.content.textSize >= 12) score += 0.05;

    return Math.min(1.0, score);
  }

  private static hasPredictableBehavior(chartType: ChartType): boolean {
    // Most static charts have predictable behavior
    const unpredictableTypes = [ChartType.NETWORK_DIAGRAM, ChartType.SANKEY_DIAGRAM];
    return !unpredictableTypes.includes(chartType);
  }

  private static calculateErrorPreventionScore(input: WCAGAssessmentInput): number {
    let score = 0.6; // Base score for data visualizations

    if (input.interactivity.hasTooltips) score += 0.2; // Helps prevent misunderstanding
    if (input.content.hasDataTable) score += 0.2; // Alternative way to access data

    return Math.min(1.0, score);
  }

  private static calculateATCompatibilityScore(input: WCAGAssessmentInput): number {
    let score = 0.3; // Base compatibility

    if (input.content.hasAriaLabels) score += 0.4;
    if (input.content.hasDataTable) score += 0.3;

    return Math.min(1.0, score);
  }

  private static hasLargeClickTargets(chartType: ChartType): boolean {
    // Chart types that typically have adequate click targets
    const goodTargetTypes = [ChartType.BAR_CHART, ChartType.PIE_CHART];
    return goodTargetTypes.includes(chartType);
  }

  private static hasCustomControls(chartType: ChartType): boolean {
    // Chart types that might have custom interactive controls
    const customControlTypes = [ChartType.NETWORK_DIAGRAM, ChartType.PARALLEL_COORDINATES];
    return customControlTypes.includes(chartType);
  }

  private static supportsProgressiveDisclosure(chartType: ChartType): boolean {
    // Chart types that can reveal information progressively
    const progressiveTypes = [ChartType.TREEMAP, ChartType.SUNBURST, ChartType.NETWORK_DIAGRAM];
    return progressiveTypes.includes(chartType);
  }

  private static calculateCognitiveLoad(input: WCAGAssessmentInput): 'low' | 'moderate' | 'high' {
    let loadScore = 0;

    // Complexity factor
    switch (input.complexity) {
      case ComplexityLevel.SIMPLE:
        loadScore += 1;
        break;
      case ComplexityLevel.MODERATE:
        loadScore += 2;
        break;
      case ComplexityLevel.COMPLEX:
        loadScore += 3;
        break;
      case ComplexityLevel.ADVANCED:
        loadScore += 4;
        break;
    }

    // Data size factor
    if (input.dataSize > 10000) loadScore += 2;
    else if (input.dataSize > 1000) loadScore += 1;

    // Interactivity factor
    if (input.interactivity.hasZoom || input.interactivity.hasKeyboardSupport) loadScore += 1;

    if (loadScore <= 2) return 'low';
    if (loadScore <= 4) return 'moderate';
    return 'high';
  }

  private static getErrorPreventionStrategies(chartType: ChartType): string[] {
    const baseStrategies = [
      'Clear and descriptive labels',
      'Consistent visual hierarchy',
      'Meaningful color choices',
    ];

    // Add chart-specific strategies
    switch (chartType) {
      case ChartType.PIE_CHART:
        return [...baseStrategies, 'Limit number of slices', 'Show percentages'];
      case ChartType.HEATMAP:
        return [...baseStrategies, 'Provide color legend', 'Use intuitive color mapping'];
      default:
        return baseStrategies;
    }
  }

  private static getChartSpecificRecommendations(chartType: ChartType): string[] {
    switch (chartType) {
      case ChartType.PIE_CHART:
        return [
          'Limit to 6 or fewer categories',
          'Consider bar chart alternative for better accessibility',
          'Include data labels with percentages',
        ];
      case ChartType.HEATMAP:
        return [
          'Use sequential color scheme with clear legend',
          'Provide text alternatives for color encoding',
          'Consider adding contour lines for additional encoding',
        ];
      case ChartType.SCATTER_PLOT:
        return [
          'Use different shapes for categories if color is used',
          'Ensure adequate point size for visibility',
          'Add regression line if showing correlation',
        ];
      default:
        return [];
    }
  }

  private static scoreToAccessibilityLevel(score: number): AccessibilityLevel {
    if (score >= 90) return AccessibilityLevel.EXCELLENT;
    if (score >= 75) return AccessibilityLevel.GOOD;
    if (score >= 60) return AccessibilityLevel.ADEQUATE;
    if (score >= 40) return AccessibilityLevel.POOR;
    return AccessibilityLevel.INACCESSIBLE;
  }

  private static determineComplianceLevel(criteria: WCAGCriterion[]): 'A' | 'AA' | 'AAA' {
    const levelA = criteria.filter((c) => c.level === 'A');
    const levelAA = criteria.filter((c) => c.level === 'AA');
    const levelAAA = criteria.filter((c) => c.level === 'AAA');

    const passA = levelA.every((c) => c.status === 'pass' || c.status === 'not_applicable');
    const passAA = levelAA.every((c) => c.status === 'pass' || c.status === 'not_applicable');
    const passAAA = levelAAA.every((c) => c.status === 'pass' || c.status === 'not_applicable');

    if (passA && passAA && passAAA) return 'AAA';
    if (passA && passAA) return 'AA';
    if (passA) return 'A';
    return 'A'; // Default to A level
  }

  private static identifyComplianceGaps(
    criteria: WCAGCriterion[],
    input: WCAGAssessmentInput,
  ): ComplianceGap[] {
    return criteria
      .filter((c) => c.status === 'fail')
      .map((c) => ({
        criterion: c.id,
        issue: this.describeIssue(c.id, input),
        solution: this.describeSolution(c.id),
        priority: this.determinePriority(c.level),
      }));
  }

  private static describeIssue(criterionId: string, input: WCAGAssessmentInput): string {
    switch (criterionId) {
      case '1.1.1':
        return 'Missing alternative text for visualization';
      case '1.4.3':
        return 'Insufficient color contrast (below 4.5:1 ratio)';
      case '2.1.1':
        return 'Visualization not accessible via keyboard';
      case '4.1.2':
        return 'Missing ARIA labels and semantic markup';
      default:
        return 'WCAG criterion not met';
    }
  }

  private static describeSolution(criterionId: string): string {
    switch (criterionId) {
      case '1.1.1':
        return 'Add descriptive alt text and provide data table alternative';
      case '1.4.3':
        return 'Use colors with higher contrast ratio or add alternative encoding';
      case '2.1.1':
        return 'Implement keyboard navigation and focus management';
      case '4.1.2':
        return 'Add proper ARIA labels, roles, and semantic structure';
      default:
        return 'Review WCAG guidelines for specific remediation steps';
    }
  }

  private static determinePriority(level: 'A' | 'AA' | 'AAA'): 'high' | 'medium' | 'low' {
    switch (level) {
      case 'A':
        return 'high';
      case 'AA':
        return 'medium';
      case 'AAA':
        return 'low';
      default:
        return 'medium';
    }
  }

  private static generateImprovements(
    input: WCAGAssessmentInput,
    compliance: WCAGCompliance,
  ): AccessibilityImprovement[] {
    const improvements: AccessibilityImprovement[] = [];

    // Color accessibility improvements
    if (!this.evaluateMinimumContrast(input)) {
      improvements.push({
        area: 'Color Contrast',
        current: 'Below WCAG AA standards',
        target: 'Meet 4.5:1 contrast ratio',
        steps: [
          'Analyze current color palette contrast ratios',
          'Select colors that meet WCAG AA standards',
          'Test with contrast checking tools',
          'Implement new color scheme',
        ],
        impact: 'high',
      });
    }

    // Keyboard accessibility improvements
    if (!input.interactivity.hasKeyboardSupport) {
      improvements.push({
        area: 'Keyboard Navigation',
        current: 'No keyboard support',
        target: 'Full keyboard accessibility',
        steps: [
          'Implement tab navigation for interactive elements',
          'Add keyboard shortcuts for common actions',
          'Ensure focus indicators are visible',
          'Test with keyboard-only navigation',
        ],
        impact: 'high',
      });
    }

    return improvements;
  }

  private static calculateTestCoverage(input: WCAGAssessmentInput): number {
    // Calculate how much of the accessibility can be tested automatically
    let automatedCoverage = 0.6; // Base coverage for color contrast, etc.

    if (input.content.hasAriaLabels) automatedCoverage += 0.2;
    if (input.content.hasAlternativeText) automatedCoverage += 0.1;
    if (input.interactivity.hasKeyboardSupport) automatedCoverage += 0.1;

    return Math.min(100, Math.round(automatedCoverage * 100));
  }

  private static generateManualTestChecklist(chartType: ChartType): string[] {
    const baseChecklist = [
      'Navigate entire visualization using only keyboard',
      'Test with screen reader (NVDA, JAWS, VoiceOver)',
      'Verify all interactive elements are focusable',
      'Check focus order is logical and predictable',
      'Validate color information is not the only way to convey meaning',
      'Test with browser zoom up to 200%',
    ];

    // Add chart-specific items
    switch (chartType) {
      case ChartType.SCATTER_PLOT:
        return [...baseChecklist, 'Verify individual data points are accessible'];
      case ChartType.HEATMAP:
        return [...baseChecklist, 'Test that heat map values are announced correctly'];
      default:
        return baseChecklist;
    }
  }

  private static generateUserTestScenarios(chartType: ChartType): string[] {
    const baseScenarios = [
      'Extract key insights from the visualization',
      'Compare different data points or categories',
      'Navigate the visualization using assistive technology',
    ];

    switch (chartType) {
      case ChartType.BAR_CHART:
        return [...baseScenarios, 'Identify the highest and lowest values'];
      case ChartType.LINE_CHART:
        return [...baseScenarios, 'Describe the trend over time'];
      case ChartType.PIE_CHART:
        return [...baseScenarios, 'Identify the largest category'];
      default:
        return baseScenarios;
    }
  }
}
