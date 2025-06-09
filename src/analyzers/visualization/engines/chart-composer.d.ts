/**
 * Advanced Chart Composition Engine
 *
 * Sophisticated engine for multi-dimensional data encoding and aesthetic optimization:
 * - Multi-dimensional visual encoding strategies
 * - Perceptual optimization based on human visual cognition
 * - Data-driven color theory and aesthetic decisions
 * - Advanced visual hierarchy and composition principles
 * - Cross-cultural and accessibility considerations
 */
export interface CompositionProfile {
    visualEncoding: MultiDimensionalEncoding;
    aestheticProfile: AestheticProfile;
    perceptualOptimization: PerceptualOptimization;
    accessibilityCompliance: AccessibilityCompliance;
    culturalAdaptation: CulturalAdaptation;
    compositionPrinciples: CompositionPrinciple[];
    qualityMetrics: VisualQualityMetrics;
}
export interface MultiDimensionalEncoding {
    primaryDimensions: EncodingDimension[];
    secondaryDimensions: EncodingDimension[];
    encodingEfficiency: number;
    cognitiveLoad: number;
    informationDensity: number;
    redundantEncodings: RedundantEncoding[];
    hierarchicalStructure: VisualHierarchy;
}
export interface EncodingDimension {
    channel: VisualChannel;
    dataField: string;
    dataType: DataType;
    encodingStrength: number;
    perceptualAccuracy: number;
    discriminability: number;
    orderingPreservation: number;
    optimization: ChannelOptimization;
}
export type VisualChannel = 'position_x' | 'position_y' | 'position_angle' | 'position_radius' | 'color_hue' | 'color_saturation' | 'color_lightness' | 'color_opacity' | 'size_area' | 'size_length' | 'size_width' | 'size_volume' | 'shape' | 'texture' | 'orientation' | 'motion' | 'typography_weight' | 'typography_style' | 'typography_size';
export type DataType = 'quantitative' | 'ordinal' | 'nominal' | 'temporal' | 'spatial';
export interface ChannelOptimization {
    scalingFunction: 'linear' | 'log' | 'sqrt' | 'pow' | 'ordinal' | 'threshold';
    domainOptimization: DomainOptimization;
    rangeOptimization: RangeOptimization;
    perceptualCorrection: PerceptualCorrection;
}
export interface DomainOptimization {
    zeroBehavior: 'include' | 'exclude' | 'anchor';
    outlierHandling: 'clip' | 'compress' | 'highlight' | 'separate';
    domainPadding: number;
    symmetryPreservation: boolean;
}
export interface RangeOptimization {
    minValue: number;
    maxValue: number;
    resolution: number;
    perceptualUniformity: boolean;
    physicalConstraints: PhysicalConstraint[];
}
export interface PhysicalConstraint {
    constraint: string;
    value: number;
    reasoning: string;
}
export interface PerceptualCorrection {
    gammaCorrection: number;
    luminanceAdjustment: number;
    contrastEnhancement: number;
    colorBlindnessCompensation: ColorBlindnessCorrection;
}
export interface ColorBlindnessCorrection {
    protanopia: number;
    deuteranopia: number;
    tritanopia: number;
    achromatopsia: number;
}
export interface RedundantEncoding {
    primaryChannel: VisualChannel;
    redundantChannel: VisualChannel;
    redundancyLevel: number;
    purpose: 'accessibility' | 'emphasis' | 'clarity' | 'error_prevention';
    effectiveness: number;
}
export interface VisualHierarchy {
    levels: HierarchyLevel[];
    focusPoints: FocusPoint[];
    visualFlow: FlowDirection[];
    attentionGuides: AttentionGuide[];
}
export interface HierarchyLevel {
    level: number;
    elements: string[];
    visualWeight: number;
    precedence: number;
}
export interface FocusPoint {
    element: string;
    attentionWeight: number;
    visualTechniques: string[];
    cognitiveReasoning: string;
}
export interface FlowDirection {
    from: string;
    to: string;
    strength: number;
    technique: 'color_gradient' | 'size_progression' | 'position_flow' | 'line_connection';
}
export interface AttentionGuide {
    technique: string;
    target: string;
    effectiveness: number;
    subtlety: number;
}
export interface AestheticProfile {
    colorHarmony: ColorHarmony;
    typographySystem: TypographySystem;
    spatialRhythm: SpatialRhythm;
    visualBalance: VisualBalance;
    proportionSystem: ProportionSystem;
    styleConsistency: StyleConsistency;
}
export interface ColorHarmony {
    scheme: ColorScheme;
    palette: ColorPalette;
    psychologicalImpact: PsychologicalImpact;
    semanticMapping: SemanticColorMapping[];
    harmonyScore: number;
}
export interface ColorScheme {
    type: 'monochromatic' | 'analogous' | 'complementary' | 'triadic' | 'tetradic' | 'split_complementary';
    baseColor: HSLColor;
    harmony: HSLColor[];
    reasoning: string;
}
export interface HSLColor {
    hue: number;
    saturation: number;
    lightness: number;
    alpha?: number;
}
export interface ColorPalette {
    categorical: HSLColor[];
    sequential: HSLColor[];
    diverging: HSLColor[];
    specialPurpose: Map<string, HSLColor>;
    accessibilityScore: number;
}
export interface PsychologicalImpact {
    emotion: string;
    energy: number;
    trust: number;
    professionalism: number;
    clarity: number;
}
export interface SemanticColorMapping {
    concept: string;
    color: HSLColor;
    culturalRelevance: number;
    universalRecognition: number;
}
export interface TypographySystem {
    hierarchy: TypographyHierarchy;
    readability: ReadabilityMetrics;
    personality: TypographyPersonality;
    technicalOptimization: TypographyOptimization;
}
export interface TypographyHierarchy {
    levels: TypographyLevel[];
    scaleRatio: number;
    baselineGrid: number;
    verticalRhythm: number;
}
export interface TypographyLevel {
    level: string;
    fontSize: number;
    fontWeight: number;
    lineHeight: number;
    letterSpacing: number;
    usage: string;
}
export interface ReadabilityMetrics {
    contrastRatio: number;
    optimalReadingDistance: number;
    cognitiveLoad: number;
    scanability: number;
}
export interface TypographyPersonality {
    formality: number;
    friendliness: number;
    authority: number;
    creativity: number;
}
export interface TypographyOptimization {
    hinting: boolean;
    subpixelRendering: boolean;
    optimalSizes: number[];
    performanceImpact: number;
}
export interface SpatialRhythm {
    gridSystem: GridSystem;
    spacingScale: SpacingScale;
    alignmentPrinciples: AlignmentPrinciple[];
    proximityRules: ProximityRule[];
}
export interface GridSystem {
    type: 'modular' | 'columnar' | 'baseline' | 'golden_ratio' | 'rule_of_thirds';
    columns: number;
    gutters: number;
    margins: Margins;
    breakpoints: Breakpoint[];
}
export interface Margins {
    top: number;
    right: number;
    bottom: number;
    left: number;
}
export interface Breakpoint {
    name: string;
    width: number;
    adaptations: string[];
}
export interface SpacingScale {
    baseUnit: number;
    scale: number[];
    semanticSpacing: Map<string, number>;
    opticalAdjustments: OpticalAdjustment[];
}
export interface OpticalAdjustment {
    context: string;
    adjustment: number;
    reasoning: string;
}
export interface AlignmentPrinciple {
    principle: string;
    strength: number;
    applications: string[];
}
export interface ProximityRule {
    rule: string;
    distance: number;
    relationship: string;
}
export interface VisualBalance {
    type: 'symmetrical' | 'asymmetrical' | 'radial' | 'crystallographic';
    weight: VisualWeight;
    tension: VisualTension[];
    stability: number;
}
export interface VisualWeight {
    distribution: WeightDistribution[];
    center: Point;
    moments: number[];
}
export interface WeightDistribution {
    element: string;
    weight: number;
    position: Point;
    influence: number;
}
export interface Point {
    x: number;
    y: number;
}
export interface VisualTension {
    source: string;
    target: string;
    strength: number;
    type: 'attractive' | 'repulsive' | 'directional';
}
export interface ProportionSystem {
    system: 'golden_ratio' | 'rule_of_thirds' | 'fibonacci' | 'modular_scale' | 'harmonic';
    ratios: number[];
    applications: ProportionApplication[];
    aestheticScore: number;
}
export interface ProportionApplication {
    element: string;
    ratio: number;
    reasoning: string;
}
export interface StyleConsistency {
    consistencyScore: number;
    deviations: StyleDeviation[];
    unifyingElements: string[];
    brandAlignment: number;
}
export interface StyleDeviation {
    element: string;
    inconsistency: string;
    impact: number;
    recommendation: string;
}
export interface PerceptualOptimization {
    gestaltPrinciples: GestaltApplication[];
    cognitiveLoad: CognitiveLoadAnalysis;
    attentionFlow: AttentionFlowAnalysis;
    memorability: MemorabilityFactors;
    usabilityMetrics: UsabilityMetrics;
}
export interface GestaltApplication {
    principle: 'proximity' | 'similarity' | 'closure' | 'continuity' | 'figure_ground' | 'common_fate';
    application: string;
    effectiveness: number;
    cognitiveSupport: string;
}
export interface CognitiveLoadAnalysis {
    intrinsicLoad: number;
    extraneousLoad: number;
    germaneLoad: number;
    totalLoad: number;
    recommendations: LoadReduction[];
}
export interface LoadReduction {
    technique: string;
    reduction: number;
    tradeoffs: string[];
}
export interface AttentionFlowAnalysis {
    entryPoints: AttentionPoint[];
    flowPath: AttentionPath[];
    exitPoints: AttentionPoint[];
    distractions: Distraction[];
    flowEfficiency: number;
}
export interface AttentionPoint {
    element: string;
    strength: number;
    duration: number;
    purpose: string;
}
export interface AttentionPath {
    from: string;
    to: string;
    probability: number;
    facilitators: string[];
    barriers: string[];
}
export interface Distraction {
    element: string;
    distractionLevel: number;
    impact: string;
    mitigation: string;
}
export interface MemorabilityFactors {
    distinctiveness: number;
    meaningfulness: number;
    simplicity: number;
    emotionalImpact: number;
    overallMemorability: number;
}
export interface UsabilityMetrics {
    learnability: number;
    efficiency: number;
    memorability: number;
    errorPrevention: number;
    satisfaction: number;
    overall: number;
}
export interface AccessibilityCompliance {
    wcagLevel: 'A' | 'AA' | 'AAA';
    colorBlindnessSupport: ColorBlindnessSupport;
    contrastCompliance: ContrastCompliance;
    motorImpairmentSupport: MotorImpairmentSupport;
    cognitiveSupport: CognitiveSupport;
    screenReaderCompatibility: ScreenReaderCompatibility;
    complianceScore: number;
}
export interface ColorBlindnessSupport {
    protanopia: number;
    deuteranopia: number;
    tritanopia: number;
    achromatopsia: number;
    alternativeEncodings: string[];
}
export interface ContrastCompliance {
    minimumContrast: number;
    enhancedContrast: number;
    graphicalObjectContrast: number;
    complianceLevel: 'fail' | 'AA' | 'AAA';
}
export interface MotorImpairmentSupport {
    minimumTargetSize: number;
    spacing: number;
    dragAlternatives: string[];
    keyboardNavigation: boolean;
}
export interface CognitiveSupport {
    complexityReduction: string[];
    memoryAids: string[];
    consistentPatterns: string[];
    errorPrevention: string[];
}
export interface ScreenReaderCompatibility {
    ariaCompliance: boolean;
    textAlternatives: boolean;
    structuralMarkup: boolean;
    focusManagement: boolean;
}
export interface CulturalAdaptation {
    readingDirection: 'ltr' | 'rtl' | 'ttb';
    colorCulturalMeaning: CulturalColorMeaning[];
    symbolismAdaptation: SymbolismAdaptation[];
    numeralSystem: string;
    dateFormat: string;
    localizations: Localization[];
}
export interface CulturalColorMeaning {
    color: HSLColor;
    culture: string;
    meaning: string;
    appropriateness: number;
    alternatives: HSLColor[];
}
export interface SymbolismAdaptation {
    symbol: string;
    culture: string;
    meaning: string;
    appropriateness: number;
    alternative: string;
}
export interface Localization {
    locale: string;
    adaptations: string[];
    priority: number;
}
export interface CompositionPrinciple {
    principle: string;
    application: string;
    strength: number;
    visualImpact: string;
    reasoning: string;
}
export interface VisualQualityMetrics {
    aestheticScore: number;
    functionalScore: number;
    accessibilityScore: number;
    usabilityScore: number;
    originalityScore: number;
    overallQuality: number;
    improvementAreas: ImprovementArea[];
}
export interface ImprovementArea {
    area: string;
    currentScore: number;
    potentialScore: number;
    recommendations: string[];
    priority: 'low' | 'medium' | 'high' | 'critical';
}
/**
 * Advanced Chart Composition Engine
 */
export declare class ChartComposer {
    /**
     * Generate comprehensive composition profile for a visualization
     */
    static composeVisualization(chartType: string, dimensions: EncodingDimension[], dataCharacteristics: any, contextualRequirements?: any): CompositionProfile;
    /**
     * Optimize multi-dimensional encoding for maximum effectiveness
     */
    private static optimizeMultiDimensionalEncoding;
    /**
     * Generate comprehensive aesthetic profile
     */
    private static generateAestheticProfile;
    /**
     * Optimize for human visual perception
     */
    private static optimizePerception;
    private static getChannelEffectivenessRanking;
    private static optimizeChannelAssignment;
    private static calculateEncodingEfficiency;
    private static calculateCognitiveLoad;
    private static calculateInformationDensity;
    private static generateColorHarmony;
    private static calculateDiscriminability;
    private static calculateOrderingPreservation;
    private static optimizeChannel;
    private static calculateRedundancy;
    private static getInteractionComplexity;
    private static generateRedundantEncodings;
    private static createVisualHierarchy;
    private static selectBaseColor;
    private static selectColorScheme;
    private static generateHarmoniousColors;
    private static generateComprehensivePalette;
    private static assessPsychologicalImpact;
    private static createSemanticColorMappings;
    private static calculateHarmonyScore;
    private static designTypographySystem;
    private static establishSpatialRhythm;
    private static calculateVisualBalance;
    private static selectProportionSystem;
    private static ensureStyleConsistency;
    private static applyGestaltPrinciples;
    private static analyzeCognitiveLoad;
    private static analyzeAttentionFlow;
    private static assessMemorability;
    private static calculateUsabilityMetrics;
    private static ensureAccessibility;
    private static adaptForCulture;
    private static applyCompositionPrinciples;
    private static assessVisualQuality;
    private static generateVisualFlow;
    private static selectFlowTechnique;
    private static analyzeDataSentiment;
    private static calculateDataComplexity;
    private static hexToHSL;
    private static calculateHueSpread;
    private static evaluateColorTheoryCompliance;
    private static checkAnalogousCompliance;
    private static checkComplementaryCompliance;
    private static checkTriadicCompliance;
    private static checkTetradicCompliance;
    private static checkMonochromaticCompliance;
    private static calculateAccessibilityBonus;
    private static checkRedGreenProblems;
    private static calculateCulturalBonus;
    private static calculateOriginalityScore;
    private static identifyImprovementAreas;
}
//# sourceMappingURL=chart-composer.d.ts.map