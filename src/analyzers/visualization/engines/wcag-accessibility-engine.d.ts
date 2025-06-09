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
import type { AccessibilityGuidance, AccessibilityAssessment } from '../types';
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
    overallScore: number;
    level: AccessibilityLevel;
    wcagLevel: 'A' | 'AA' | 'AAA';
    breakdown: {
        perceivable: number;
        operable: number;
        understandable: number;
        robust: number;
    };
}
export declare class WCAGAccessibilityEngine {
    private static readonly WCAG_CRITERIA;
    /**
     * Assess comprehensive accessibility for a visualization
     */
    static assessAccessibility(input: WCAGAssessmentInput): AccessibilityAssessment;
    /**
     * Generate detailed accessibility guidance for a specific chart type
     */
    static generateAccessibilityGuidance(chartType: ChartType, input?: Partial<WCAGAssessmentInput>): AccessibilityGuidance;
    /**
     * Evaluate WCAG compliance across all criteria
     */
    private static evaluateWCAGCompliance;
    /**
     * Evaluate individual WCAG criterion
     */
    private static evaluateCriterion;
    /**
     * Calculate comprehensive accessibility score
     */
    private static calculateAccessibilityScore;
    /**
     * Calculate Perceivable principle score (40% of total)
     */
    private static calculatePerceivableScore;
    /**
     * Calculate Operable principle score (30% of total)
     */
    private static calculateOperableScore;
    /**
     * Calculate Understandable principle score (20% of total)
     */
    private static calculateUnderstandableScore;
    /**
     * Calculate Robust principle score (10% of total)
     */
    private static calculateRobustScore;
    /**
     * Assess color blindness support
     */
    private static assessColorBlindnessSupport;
    /**
     * Assess motor impairment support
     */
    private static assessMotorImpairmentSupport;
    /**
     * Assess cognitive accessibility support
     */
    private static assessCognitiveAccessibility;
    /**
     * Generate accessibility recommendations
     */
    private static generateRecommendations;
    private static evaluateMinimumContrast;
    private static evaluateEnhancedContrast;
    private static evaluateNonTextContrast;
    private static calculateContrastRatio;
    private static getRelativeLuminance;
    private static hexToRgb;
    private static simulateColorBlindness;
    private static areColorsDistinguishable;
    private static areColorsDistinguishableInGrayscale;
    private static getAlternativeEncodings;
    private static calculateContrastScore;
    private static calculateColorBlindScore;
    private static reliesOnlyOnColor;
    private static hasAlternativeEncoding;
    private static hasBasicKeyboardSupport;
    private static calculateTargetSizeScore;
    private static hasTimingRequirements;
    private static calculateContentClarityScore;
    private static hasPredictableBehavior;
    private static calculateErrorPreventionScore;
    private static calculateATCompatibilityScore;
    private static hasLargeClickTargets;
    private static hasCustomControls;
    private static supportsProgressiveDisclosure;
    private static calculateCognitiveLoad;
    private static getErrorPreventionStrategies;
    private static getChartSpecificRecommendations;
    private static scoreToAccessibilityLevel;
    private static determineComplianceLevel;
    private static identifyComplianceGaps;
    private static describeIssue;
    private static describeSolution;
    private static determinePriority;
    private static generateImprovements;
    private static calculateTestCoverage;
    private static generateManualTestChecklist;
    private static generateUserTestScenarios;
}
//# sourceMappingURL=wcag-accessibility-engine.d.ts.map