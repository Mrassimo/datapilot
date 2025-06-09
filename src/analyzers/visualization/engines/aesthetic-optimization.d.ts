/**
 * Aesthetic Optimization Engine
 *
 * Advanced engine for data-driven aesthetic design decisions that creates beautiful,
 * emotionally engaging, and highly effective visualizations:
 * - Color theory and psychology application
 * - Typography optimization and hierarchy
 * - Visual composition and balance principles
 * - Cultural sensitivity and accessibility compliance
 * - Emotional impact design and brand integration
 * - Progressive enhancement and responsive aesthetics
 */
export interface AestheticProfile {
    colorSystem: OptimizedColorSystem;
    typographySystem: OptimizedTypographySystem;
    visualComposition: VisualComposition;
    emotionalDesign: EmotionalDesign;
    accessibility: AestheticAccessibility;
    brandIntegration: BrandIntegration;
    responsiveAesthetics: ResponsiveAesthetics;
    qualityMetrics: AestheticQualityMetrics;
}
export interface OptimizedColorSystem {
    primaryPalette: ColorPalette;
    semanticColors: SemanticColorMapping;
    dataVisualizationPalette: DataVisualizationPalette;
    psychologyProfile: ColorPsychologyProfile;
    accessibilityProfile: ColorAccessibilityProfile;
    culturalConsiderations: CulturalColorConsiderations;
    dynamicColorAdaptation: DynamicColorAdaptation;
}
export interface ColorPalette {
    primary: ColorDefinition[];
    secondary: ColorDefinition[];
    accent: ColorDefinition[];
    neutral: ColorDefinition[];
    harmonyType: 'monochromatic' | 'analogous' | 'complementary' | 'triadic' | 'tetradic' | 'split_complementary';
    harmonyScore: number;
    generationMethod: string;
}
export interface ColorDefinition {
    hex: string;
    hsl: HSLColor;
    rgb: RGBColor;
    colorName: string;
    usage: ColorUsage;
    psychologicalProperties: ColorPsychology;
    accessibility: ColorAccessibilityInfo;
}
export interface HSLColor {
    hue: number;
    saturation: number;
    lightness: number;
    alpha?: number;
}
export interface RGBColor {
    red: number;
    green: number;
    blue: number;
    alpha?: number;
}
export interface ColorUsage {
    primary: string[];
    avoid: string[];
    pairsWith: string[];
    dominanceLevel: number;
    contexts: string[];
}
export interface ColorPsychology {
    emotions: string[];
    associations: string[];
    energyLevel: number;
    trustLevel: number;
    attentionGrabbing: number;
    professionalLevel: number;
}
export interface ColorAccessibilityInfo {
    contrastRatios: ContrastRatio[];
    colorBlindSafe: boolean;
    wcagCompliance: 'A' | 'AA' | 'AAA' | 'fail';
    alternativeEncodings: string[];
}
export interface ContrastRatio {
    backgroundColor: string;
    ratio: number;
    compliance: 'pass' | 'fail';
    usage: string;
}
export interface SemanticColorMapping {
    success: ColorDefinition;
    warning: ColorDefinition;
    error: ColorDefinition;
    info: ColorDefinition;
    neutral: ColorDefinition;
    brandPrimary: ColorDefinition;
    backgroundPrimary: ColorDefinition;
    backgroundSecondary: ColorDefinition;
    textPrimary: ColorDefinition;
    textSecondary: ColorDefinition;
}
export interface DataVisualizationPalette {
    categorical: ColorDefinition[];
    sequential: ColorSequence;
    diverging: DivergingColorScheme;
    qualitative: ColorDefinition[];
    specialPurpose: Map<string, ColorDefinition>;
    encodingOptimization: EncodingColorOptimization;
}
export interface ColorSequence {
    startColor: ColorDefinition;
    endColor: ColorDefinition;
    steps: number;
    interpolationMethod: 'linear' | 'lab' | 'hcl' | 'perceptual';
    perceptualUniformity: number;
}
export interface DivergingColorScheme {
    negativeColor: ColorDefinition;
    neutralColor: ColorDefinition;
    positiveColor: ColorDefinition;
    balancePoint: number;
    intensity: number;
}
export interface EncodingColorOptimization {
    discriminabilityScore: number;
    orderPreservation: number;
    bandwidthEfficiency: number;
    cognitiveLoad: number;
}
export interface ColorPsychologyProfile {
    dominantEmotion: string;
    energyLevel: number;
    sophisticationLevel: number;
    trustworthiness: number;
    approachability: number;
    innovativePerception: number;
    culturalResonance: number;
    brandAlignment: number;
}
export interface ColorAccessibilityProfile {
    overallScore: number;
    colorBlindnessSupport: ColorBlindnessSupport;
    contrastCompliance: ContrastCompliance;
    motionSensitivity: MotionSensitivityConsiderations;
    cognitiveAccessibility: CognitiveAccessibilityFeatures;
}
export interface ColorBlindnessSupport {
    protanopia: SupportLevel;
    deuteranopia: SupportLevel;
    tritanopia: SupportLevel;
    achromatopsia: SupportLevel;
    alternativeEncodings: AlternativeEncoding[];
}
export interface SupportLevel {
    score: number;
    adaptations: string[];
    limitations: string[];
}
export interface AlternativeEncoding {
    encoding: 'pattern' | 'texture' | 'shape' | 'size' | 'position';
    effectiveness: number;
    implementation: string;
}
export interface ContrastCompliance {
    wcagAA: ComplianceDetail;
    wcagAAA: ComplianceDetail;
    graphicalObjects: ComplianceDetail;
    userInterface: ComplianceDetail;
}
export interface ComplianceDetail {
    passes: boolean;
    score: number;
    violations: ContrastViolation[];
    recommendations: string[];
}
export interface ContrastViolation {
    foreground: string;
    background: string;
    ratio: number;
    required: number;
    severity: 'critical' | 'high' | 'medium' | 'low';
}
export interface MotionSensitivityConsiderations {
    animationDuration: number;
    easingFunctions: string[];
    parallaxLimitations: string[];
    flashingPrevention: FlashingPrevention;
}
export interface FlashingPrevention {
    maxFlashRate: number;
    contrastThresholds: number[];
    alternatives: string[];
}
export interface CognitiveAccessibilityFeatures {
    simplicityScore: number;
    consistencyScore: number;
    predictabilityScore: number;
    feedbackClarity: number;
    errorPrevention: string[];
}
export interface CulturalColorConsiderations {
    primaryCulture: string;
    additionalCultures: string[];
    colorMeanings: CulturalColorMeaning[];
    tabooColors: TabooColor[];
    adaptationStrategies: CulturalAdaptationStrategy[];
}
export interface CulturalColorMeaning {
    color: string;
    culture: string;
    meaning: string;
    sentiment: 'positive' | 'negative' | 'neutral' | 'complex';
    appropriateness: number;
    context: string;
}
export interface TabooColor {
    color: string;
    culture: string;
    reason: string;
    severity: 'absolute' | 'strong' | 'moderate' | 'mild';
    alternatives: string[];
}
export interface CulturalAdaptationStrategy {
    strategy: string;
    cultures: string[];
    implementation: string;
    effectiveness: number;
}
export interface DynamicColorAdaptation {
    lightMode: ColorAdaptation;
    darkMode: ColorAdaptation;
    contextualAdaptations: ContextualColorAdaptation[];
    personalizations: PersonalizationOption[];
}
export interface ColorAdaptation {
    paletteAdjustments: PaletteAdjustment[];
    contrastBoosts: ContrastBoost[];
    saturationModifications: SaturationModification[];
    luminanceOptimizations: LuminanceOptimization[];
}
export interface PaletteAdjustment {
    originalColor: string;
    adaptedColor: string;
    reason: string;
    effectiveness: number;
}
export interface ContrastBoost {
    targetElements: string[];
    boostAmount: number;
    method: string;
}
export interface SaturationModification {
    elements: string[];
    modifier: number;
    reasoning: string;
}
export interface LuminanceOptimization {
    elements: string[];
    targetLuminance: number;
    optimization: string;
}
export interface ContextualColorAdaptation {
    context: string;
    trigger: string;
    adaptations: ColorAdaptation;
    duration: number;
}
export interface PersonalizationOption {
    option: string;
    description: string;
    colorAdjustments: string[];
    userTypes: string[];
}
export interface OptimizedTypographySystem {
    fontHierarchy: FontHierarchy;
    readabilityOptimization: ReadabilityOptimization;
    brandTypography: BrandTypography;
    responsiveTypography: ResponsiveTypography;
    accessibilityTypography: AccessibilityTypography;
    emotionalTypography: EmotionalTypography;
}
export interface FontHierarchy {
    levels: TypographyLevel[];
    scaleRatio: number;
    verticalRhythm: VerticalRhythm;
    typeScale: TypeScale;
    semanticMapping: TypographySemanticMapping;
}
export interface TypographyLevel {
    level: string;
    fontSize: FontSize;
    fontWeight: FontWeight;
    lineHeight: number;
    letterSpacing: number;
    usage: TypographyUsage;
    hierarchy: HierarchyProperties;
}
export interface FontSize {
    desktop: number;
    tablet: number;
    mobile: number;
    unit: 'px' | 'rem' | 'em' | 'vw' | 'clamp';
    fluidScaling: boolean;
}
export interface FontWeight {
    value: number;
    name: string;
    usage: string[];
    effectiveness: number;
}
export interface TypographyUsage {
    contexts: string[];
    maxCharacters: number;
    recommendedLineLength: number;
    visualWeight: number;
}
export interface HierarchyProperties {
    importance: number;
    attentionGrabbing: number;
    scanability: number;
    readability: number;
}
export interface VerticalRhythm {
    baselineGrid: number;
    rhythm: number;
    alignment: string;
    consistency: number;
}
export interface TypeScale {
    modularScale: boolean;
    ratio: number;
    customSizes: number[];
    harmonicProgression: boolean;
}
export interface TypographySemanticMapping {
    headings: TypographyMapping[];
    body: TypographyMapping[];
    captions: TypographyMapping[];
    labels: TypographyMapping[];
    ui: TypographyMapping[];
}
export interface TypographyMapping {
    element: string;
    level: string;
    purpose: string;
    characteristics: string[];
}
export interface ReadabilityOptimization {
    optimalLineLength: OptimalLineLength;
    contrastOptimization: TypographyContrast;
    whitespaceOptimization: WhitespaceOptimization;
    scanabilityFeatures: ScanabilityFeature[];
    cognitiveLoadReduction: CognitiveLoadReduction;
}
export interface OptimalLineLength {
    charactersPerLine: number;
    wordsPerLine: number;
    justification: string;
    adjustment: string;
}
export interface TypographyContrast {
    minimumContrast: number;
    optimalContrast: number;
    contrastTestingResults: ContrastTestResult[];
    enhancementSuggestions: string[];
}
export interface ContrastTestResult {
    foreground: string;
    background: string;
    ratio: number;
    readabilityScore: number;
    usage: string;
}
export interface WhitespaceOptimization {
    lineSpacing: number;
    paragraphSpacing: number;
    characterSpacing: number;
    wordSpacing: number;
    breathingRoom: number;
}
export interface ScanabilityFeature {
    feature: string;
    implementation: string;
    effectiveness: number;
    usageContext: string[];
}
export interface CognitiveLoadReduction {
    techniques: LoadReductionTechnique[];
    complexity: number;
    processingEffort: number;
    recommendations: string[];
}
export interface LoadReductionTechnique {
    technique: string;
    description: string;
    impact: number;
    applicability: string[];
}
export interface BrandTypography {
    brandAlignment: number;
    brandFonts: BrandFont[];
    brandPersonality: BrandPersonality;
    brandGuidelines: BrandGuideline[];
}
export interface BrandFont {
    font: string;
    usage: string[];
    personality: string[];
    licensing: LicensingInfo;
}
export interface LicensingInfo {
    type: string;
    restrictions: string[];
    webUsage: boolean;
    cost: string;
}
export interface BrandPersonality {
    traits: string[];
    typographyExpression: TypographyExpression[];
    alignment: number;
}
export interface TypographyExpression {
    trait: string;
    expression: string;
    implementation: string;
}
export interface BrandGuideline {
    guideline: string;
    compliance: boolean;
    adaptation: string;
}
export interface ResponsiveTypography {
    breakpoints: TypographyBreakpoint[];
    fluidScaling: FluidScaling;
    contextualAdaptations: ContextualTypographyAdaptation[];
    performanceOptimizations: TypographyPerformanceOptimization[];
}
export interface TypographyBreakpoint {
    breakpoint: string;
    fontAdjustments: FontAdjustment[];
    layoutImpact: string;
    readabilityMaintenance: string;
}
export interface FontAdjustment {
    element: string;
    adjustment: string;
    value: number;
    reasoning: string;
}
export interface FluidScaling {
    enabled: boolean;
    minSize: number;
    maxSize: number;
    scalingFunction: string;
    viewportUnits: boolean;
}
export interface ContextualTypographyAdaptation {
    context: string;
    adaptations: FontAdjustment[];
    triggers: string[];
    duration: number;
}
export interface TypographyPerformanceOptimization {
    optimization: string;
    impact: string;
    implementation: string;
    tradeoffs: string[];
}
export interface AccessibilityTypography {
    dyslexiaSupport: DyslexiaSupport;
    visualImpairmentSupport: VisualImpairmentSupport;
    cognitiveSupport: CognitiveTypographySupport;
    motorImpairmentSupport: MotorImpairmentSupport;
}
export interface DyslexiaSupport {
    dyslexiaFriendlyFonts: string[];
    letterSpacingAdjustments: number;
    lineSpacingAdjustments: number;
    coloringStrategies: string[];
    alternativeFormats: string[];
}
export interface VisualImpairmentSupport {
    largeTextOptions: LargeTextOption[];
    highContrastModes: HighContrastMode[];
    magnificationSupport: MagnificationSupport;
    screenReaderOptimization: ScreenReaderOptimization;
}
export interface LargeTextOption {
    scaleFactor: number;
    context: string;
    implementation: string;
    usability: number;
}
export interface HighContrastMode {
    mode: string;
    contrastRatio: number;
    implementation: string;
    coverage: string[];
}
export interface MagnificationSupport {
    maxZoom: number;
    preserveLayout: boolean;
    reflow: boolean;
    navigationAid: string[];
}
export interface ScreenReaderOptimization {
    structuralMarkup: boolean;
    skipNavigation: boolean;
    headingHierarchy: boolean;
    descriptiveLinks: boolean;
}
export interface CognitiveTypographySupport {
    simplicityFeatures: string[];
    consistencyFeatures: string[];
    clarityEnhancements: string[];
    memoryAids: string[];
}
export interface MotorImpairmentSupport {
    targetSizeOptimization: TargetSizeOptimization;
    clickableAreaEnhancement: ClickableAreaEnhancement;
    gestureAlternatives: GestureAlternative[];
    keyboardOptimization: KeyboardOptimization;
}
export interface TargetSizeOptimization {
    minimumSize: number;
    optimalSize: number;
    spacing: number;
    context: string;
}
export interface ClickableAreaEnhancement {
    paddingIncrease: number;
    visualFeedback: string[];
    accessibility: string[];
}
export interface GestureAlternative {
    gesture: string;
    alternative: string;
    implementation: string;
}
export interface KeyboardOptimization {
    focusManagement: boolean;
    skipLinks: boolean;
    shortcuts: KeyboardShortcut[];
    visualFocus: VisualFocus;
}
export interface KeyboardShortcut {
    keys: string[];
    action: string;
    context: string;
}
export interface VisualFocus {
    style: string;
    contrast: number;
    animation: string;
}
export interface EmotionalTypography {
    moodMapping: MoodMapping[];
    personalityExpression: PersonalityExpression[];
    culturalSensitivity: CulturalTypographySensitivity;
    contextualEmotions: ContextualEmotion[];
}
export interface MoodMapping {
    mood: string;
    typographyCharacteristics: TypographyCharacteristic[];
    effectiveness: number;
    contexts: string[];
}
export interface TypographyCharacteristic {
    characteristic: string;
    value: string | number;
    emotionalImpact: string;
}
export interface PersonalityExpression {
    personality: string;
    expression: TypographyExpression[];
    consistency: number;
    brandAlignment: number;
}
export interface CulturalTypographySensitivity {
    readingDirection: 'ltr' | 'rtl' | 'ttb';
    characterSupport: CharacterSupport[];
    culturalAdaptations: TypographyCulturalAdaptation[];
}
export interface CharacterSupport {
    language: string;
    characterSet: string;
    fontSupport: boolean;
    fallbacks: string[];
}
export interface TypographyCulturalAdaptation {
    culture: string;
    adaptations: TypographyAdaptation[];
    effectiveness: number;
}
export interface TypographyAdaptation {
    adaptation: string;
    implementation: string;
    reason: string;
}
export interface ContextualEmotion {
    context: string;
    targetEmotion: string;
    typographyAdjustments: TypographyAdjustment[];
    effectiveness: number;
}
export interface TypographyAdjustment {
    property: string;
    adjustment: string;
    emotionalRationale: string;
}
export interface VisualComposition {
    layoutPrinciples: LayoutPrinciple[];
    visualBalance: VisualBalance;
    visualHierarchy: CompositionHierarchy;
    spatialRelationships: SpatialRelationship[];
    proportionSystem: ProportionSystem;
    rhythmAndFlow: RhythmAndFlow;
}
export interface LayoutPrinciple {
    principle: string;
    application: string;
    strength: number;
    visualImpact: string;
    implementation: PrincipleImplementation;
}
export interface PrincipleImplementation {
    techniques: string[];
    measurements: Measurement[];
    adjustments: Adjustment[];
}
export interface Measurement {
    property: string;
    value: number;
    unit: string;
    reasoning: string;
}
export interface Adjustment {
    element: string;
    property: string;
    value: number | string;
    reasoning: string;
}
export interface VisualBalance {
    type: 'symmetrical' | 'asymmetrical' | 'radial' | 'crystallographic';
    weight: VisualWeight;
    tension: VisualTension[];
    stability: number;
    dynamism: number;
}
export interface VisualWeight {
    distribution: WeightDistribution[];
    center: Point;
    balance: number;
    compensation: WeightCompensation[];
}
export interface WeightDistribution {
    element: string;
    weight: number;
    position: Point;
    influence: number;
    adjustments: WeightAdjustment[];
}
export interface Point {
    x: number;
    y: number;
}
export interface WeightCompensation {
    imbalance: string;
    compensation: string;
    effectiveness: number;
}
export interface WeightAdjustment {
    adjustment: string;
    impact: number;
    implementation: string;
}
export interface VisualTension {
    source: string;
    target: string;
    strength: number;
    type: 'attractive' | 'repulsive' | 'directional';
    resolution: TensionResolution;
}
export interface TensionResolution {
    method: string;
    effectiveness: number;
    sideEffects: string[];
}
export interface CompositionHierarchy {
    levels: CompositionLevel[];
    flowPattern: FlowPattern;
    attentionManagement: AttentionManagement;
    emphasisTechniques: EmphasisTechnique[];
}
export interface CompositionLevel {
    level: number;
    elements: string[];
    visualTreatment: VisualTreatment;
    importance: number;
}
export interface VisualTreatment {
    size: SizeTreatment;
    color: ColorTreatment;
    position: PositionTreatment;
    style: StyleTreatment;
}
export interface SizeTreatment {
    scale: number;
    emphasis: string;
    proportion: string;
}
export interface ColorTreatment {
    prominence: number;
    contrast: number;
    saturation: number;
}
export interface PositionTreatment {
    placement: string;
    isolation: number;
    proximity: ProximityRule[];
}
export interface ProximityRule {
    element: string;
    distance: number;
    relationship: string;
}
export interface StyleTreatment {
    weight: number;
    decoration: string[];
    texture: string;
}
export interface FlowPattern {
    type: 'z_pattern' | 'f_pattern' | 'gutenberg' | 'golden_spiral' | 'custom';
    path: FlowNode[];
    efficiency: number;
    naturalness: number;
}
export interface FlowNode {
    position: Point;
    element: string;
    dwellTime: number;
    importance: number;
}
export interface AttentionManagement {
    primaryFocus: string;
    secondaryFoci: string[];
    distractionMinimization: DistractionMinimization;
    guidanceElements: GuidanceElement[];
}
export interface DistractionMinimization {
    techniques: string[];
    effectiveness: number;
    implementation: string[];
}
export interface GuidanceElement {
    element: string;
    purpose: string;
    subtlety: number;
    effectiveness: number;
}
export interface EmphasisTechnique {
    technique: string;
    targetElement: string;
    intensity: number;
    duration: number;
    context: string[];
}
export interface SpatialRelationship {
    elements: string[];
    relationship: 'grouped' | 'separated' | 'aligned' | 'contrasted' | 'layered';
    strength: number;
    purpose: string;
    implementation: SpatialImplementation;
}
export interface SpatialImplementation {
    spacing: number;
    alignment: string;
    grouping: string;
    separation: string;
}
export interface ProportionSystem {
    system: 'golden_ratio' | 'rule_of_thirds' | 'fibonacci' | 'modular_scale' | 'harmonic' | 'custom';
    ratios: number[];
    applications: ProportionApplication[];
    aestheticScore: number;
    harmony: number;
}
export interface ProportionApplication {
    element: string;
    ratio: number;
    reasoning: string;
    effectiveness: number;
}
export interface RhythmAndFlow {
    visualRhythm: VisualRhythm;
    spacingRhythm: SpacingRhythm;
    colorRhythm: ColorRhythm;
    motionRhythm: MotionRhythm;
}
export interface VisualRhythm {
    pattern: 'regular' | 'progressive' | 'flowing' | 'random' | 'alternating';
    repetition: RepetitionElement[];
    variation: VariationElement[];
    unity: number;
}
export interface RepetitionElement {
    element: string;
    frequency: number;
    consistency: number;
    purpose: string;
}
export interface VariationElement {
    element: string;
    variationType: string;
    degree: number;
    purpose: string;
}
export interface SpacingRhythm {
    baseUnit: number;
    scale: number[];
    progression: string;
    consistency: number;
}
export interface ColorRhythm {
    dominantColors: string[];
    accentFrequency: number;
    gradation: string;
    harmony: number;
}
export interface MotionRhythm {
    timing: TimingFunction[];
    easing: EasingFunction[];
    choreography: MotionChoreography;
}
export interface TimingFunction {
    name: string;
    duration: number;
    delay: number;
    purpose: string;
}
export interface EasingFunction {
    name: string;
    curve: string;
    naturalness: number;
    purpose: string;
}
export interface MotionChoreography {
    sequence: MotionStep[];
    coordination: number;
    narrative: string;
}
export interface MotionStep {
    element: string;
    action: string;
    timing: number;
    purpose: string;
}
export interface EmotionalDesign {
    targetEmotions: TargetEmotion[];
    emotionalJourney: EmotionalJourney;
    psychologicalPrinciples: PsychologicalPrinciple[];
    emotionalTesting: EmotionalTesting;
    culturalEmotionalConsiderations: CulturalEmotionalConsideration[];
}
export interface TargetEmotion {
    emotion: string;
    intensity: number;
    context: string;
    designElements: EmotionalDesignElement[];
    measurement: EmotionMeasurement;
}
export interface EmotionalDesignElement {
    element: string;
    contribution: string;
    intensity: number;
    implementation: string;
}
export interface EmotionMeasurement {
    metrics: string[];
    methods: string[];
    expectedOutcome: string;
}
export interface EmotionalJourney {
    stages: EmotionalStage[];
    transitions: EmotionalTransition[];
    climax: string;
    resolution: string;
}
export interface EmotionalStage {
    stage: string;
    emotion: string;
    duration: number;
    designFocus: string[];
    userExperience: string;
}
export interface EmotionalTransition {
    from: string;
    to: string;
    method: string;
    duration: number;
    smoothness: number;
}
export interface PsychologicalPrinciple {
    principle: string;
    application: string;
    effectiveness: number;
    evidenceLevel: 'strong' | 'moderate' | 'emerging' | 'theoretical';
    implementation: PrincipleImplementation;
}
export interface EmotionalTesting {
    methods: TestingMethod[];
    metrics: EmotionalMetric[];
    benchmarks: EmotionalBenchmark[];
    validation: EmotionalValidation;
}
export interface TestingMethod {
    method: string;
    description: string;
    reliability: number;
    applicability: string[];
}
export interface EmotionalMetric {
    metric: string;
    measurement: string;
    interpretation: string;
    benchmarkValue: number;
}
export interface EmotionalBenchmark {
    context: string;
    benchmarkValues: Record<string, number>;
    source: string;
    reliability: number;
}
export interface EmotionalValidation {
    testingComplete: boolean;
    results: ValidationResult[];
    confidence: number;
    recommendations: string[];
}
export interface ValidationResult {
    metric: string;
    score: number;
    comparison: string;
    significance: string;
}
export interface CulturalEmotionalConsideration {
    culture: string;
    emotionalMappings: EmotionalMapping[];
    tabooEmotions: string[];
    adaptationStrategies: EmotionalAdaptationStrategy[];
}
export interface EmotionalMapping {
    trigger: string;
    emotion: string;
    intensity: number;
    context: string;
}
export interface EmotionalAdaptationStrategy {
    strategy: string;
    implementation: string;
    effectiveness: number;
    contexts: string[];
}
export interface AestheticAccessibility {
    wcagCompliance: WCAGCompliance;
    universalDesign: UniversalDesign;
    assistiveTechnology: AssistiveTechnologySupport;
    cognitiveAccessibility: CognitiveAccessibilitySupport;
    inclusiveDesign: InclusiveDesign;
}
export interface WCAGCompliance {
    level: 'A' | 'AA' | 'AAA';
    score: number;
    violations: AccessibilityViolation[];
    recommendations: AccessibilityRecommendation[];
    testing: AccessibilityTesting;
}
export interface AccessibilityViolation {
    guideline: string;
    severity: 'critical' | 'serious' | 'moderate' | 'minor';
    description: string;
    impact: string;
    fix: string;
}
export interface AccessibilityRecommendation {
    recommendation: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
    impact: string;
    implementation: string;
}
export interface AccessibilityTesting {
    automated: AutomatedAccessibilityTesting;
    manual: ManualAccessibilityTesting;
    userTesting: UserAccessibilityTesting;
}
export interface AutomatedAccessibilityTesting {
    tools: string[];
    coverage: number;
    confidence: number;
    limitations: string[];
}
export interface ManualAccessibilityTesting {
    checklist: string[];
    completed: boolean;
    findings: string[];
    recommendations: string[];
}
export interface UserAccessibilityTesting {
    participants: UserTestingParticipant[];
    tasks: AccessibilityTask[];
    findings: UserTestingFinding[];
    insights: string[];
}
export interface UserTestingParticipant {
    profile: string;
    assistiveTechnology: string[];
    disabilities: string[];
    experience: string;
}
export interface AccessibilityTask {
    task: string;
    successCriteria: string[];
    difficulty: string;
    assistiveTools: string[];
}
export interface UserTestingFinding {
    participant: string;
    task: string;
    outcome: 'success' | 'partial' | 'failure';
    issues: string[];
    suggestions: string[];
}
export interface UniversalDesign {
    principles: UniversalDesignPrinciple[];
    implementation: UniversalDesignImplementation;
    assessment: UniversalDesignAssessment;
}
export interface UniversalDesignPrinciple {
    principle: string;
    description: string;
    application: string;
    compliance: number;
}
export interface UniversalDesignImplementation {
    features: UniversalDesignFeature[];
    adaptations: UniversalDesignAdaptation[];
    effectiveness: number;
}
export interface UniversalDesignFeature {
    feature: string;
    benefit: string;
    implementation: string;
    userGroups: string[];
}
export interface UniversalDesignAdaptation {
    adaptation: string;
    trigger: string;
    implementation: string;
    reversible: boolean;
}
export interface UniversalDesignAssessment {
    overall: number;
    byPrinciple: Record<string, number>;
    strengths: string[];
    improvements: string[];
}
export interface AssistiveTechnologySupport {
    screenReaders: ScreenReaderSupport;
    voiceControl: VoiceControlSupport;
    switchNavigation: SwitchNavigationSupport;
    magnification: MagnificationSupport;
}
export interface ScreenReaderSupport {
    compatibility: ScreenReaderCompatibility[];
    optimization: ScreenReaderOptimization;
    testing: ScreenReaderTesting;
}
export interface ScreenReaderCompatibility {
    screenReader: string;
    version: string;
    compatibility: number;
    issues: string[];
    workarounds: string[];
}
export interface ScreenReaderTesting {
    tested: boolean;
    screenReaders: string[];
    findings: string[];
    fixes: string[];
}
export interface VoiceControlSupport {
    commands: VoiceCommand[];
    recognition: VoiceRecognition;
    fallbacks: VoiceFallback[];
}
export interface VoiceCommand {
    command: string;
    action: string;
    alternatives: string[];
    reliability: number;
}
export interface VoiceRecognition {
    accuracy: number;
    languages: string[];
    adaptability: string;
}
export interface VoiceFallback {
    scenario: string;
    fallback: string;
    effectiveness: number;
}
export interface SwitchNavigationSupport {
    switches: SwitchType[];
    navigation: SwitchNavigation;
    customization: SwitchCustomization;
}
export interface SwitchType {
    type: string;
    compatibility: boolean;
    setup: string;
}
export interface SwitchNavigation {
    patterns: string[];
    efficiency: number;
    learnability: number;
}
export interface SwitchCustomization {
    options: string[];
    personalization: boolean;
    complexity: string;
}
export interface CognitiveAccessibilitySupport {
    simplicityPrinciples: SimplicityPrinciple[];
    memorySupport: MemorySupport;
    attentionManagement: CognitiveAttentionManagement;
    errorPrevention: CognitiveErrorPrevention;
}
export interface SimplicityPrinciple {
    principle: string;
    implementation: string;
    impact: string;
    measurement: string;
}
export interface MemorySupport {
    techniques: MemoryTechnique[];
    persistence: MemoryPersistence;
    aids: MemoryAid[];
}
export interface MemoryTechnique {
    technique: string;
    application: string;
    effectiveness: number;
}
export interface MemoryPersistence {
    shortTerm: string[];
    longTerm: string[];
    crossSession: string[];
}
export interface MemoryAid {
    aid: string;
    context: string;
    implementation: string;
}
export interface CognitiveAttentionManagement {
    focusTechniques: FocusTechnique[];
    distractionReduction: DistractionReduction;
    progressIndicators: ProgressIndicator[];
}
export interface FocusTechnique {
    technique: string;
    implementation: string;
    effectiveness: number;
}
export interface DistractionReduction {
    strategies: string[];
    implementation: string[];
    effectiveness: number;
}
export interface ProgressIndicator {
    type: string;
    implementation: string;
    clarity: number;
}
export interface CognitiveErrorPrevention {
    validation: ValidationStrategy[];
    feedback: FeedbackStrategy[];
    recovery: ErrorRecoveryStrategy[];
}
export interface ValidationStrategy {
    strategy: string;
    implementation: string;
    effectiveness: number;
}
export interface FeedbackStrategy {
    strategy: string;
    timing: string;
    clarity: number;
    implementation: string;
}
export interface ErrorRecoveryStrategy {
    strategy: string;
    complexity: string;
    success: number;
}
export interface InclusiveDesign {
    diversityConsiderations: DiversityConsideration[];
    representationAnalysis: RepresentationAnalysis;
    biasAssessment: BiasAssessment;
    inclusivityMetrics: InclusivityMetric[];
}
export interface DiversityConsideration {
    dimension: string;
    considerations: string[];
    implementations: string[];
    effectiveness: number;
}
export interface RepresentationAnalysis {
    analysis: string;
    findings: string[];
    recommendations: string[];
    score: number;
}
export interface BiasAssessment {
    biasTypes: BiasType[];
    assessment: BiasAssessmentResult;
    mitigation: BiasMitigation[];
}
export interface BiasType {
    type: string;
    description: string;
    impact: string;
    detection: string;
}
export interface BiasAssessmentResult {
    overall: number;
    byType: Record<string, number>;
    severity: string;
    confidence: number;
}
export interface BiasMitigation {
    bias: string;
    mitigation: string;
    effectiveness: number;
    implementation: string;
}
export interface InclusivityMetric {
    metric: string;
    value: number;
    benchmark: number;
    interpretation: string;
}
export interface BrandIntegration {
    brandAlignment: BrandAlignment;
    brandPersonality: BrandPersonalityIntegration;
    brandGuidelines: BrandGuidelineCompliance;
    brandConsistency: BrandConsistency;
    brandDifferentiation: BrandDifferentiation;
}
export interface BrandAlignment {
    overall: number;
    visual: number;
    emotional: number;
    functional: number;
    gaps: BrandGap[];
}
export interface BrandGap {
    gap: string;
    severity: string;
    impact: string;
    solution: string;
}
export interface BrandPersonalityIntegration {
    traits: BrandTrait[];
    expression: BrandExpression[];
    consistency: number;
    authenticity: number;
}
export interface BrandTrait {
    trait: string;
    strength: number;
    visualExpression: string[];
    consistency: number;
}
export interface BrandExpression {
    element: string;
    expression: string;
    effectiveness: number;
    authenticity: number;
}
export interface BrandGuidelineCompliance {
    guidelines: BrandGuideline[];
    compliance: number;
    violations: BrandViolation[];
    recommendations: BrandRecommendation[];
}
export interface BrandViolation {
    guideline: string;
    violation: string;
    severity: string;
    impact: string;
}
export interface BrandRecommendation {
    recommendation: string;
    priority: string;
    impact: string;
    implementation: string;
}
export interface BrandConsistency {
    overall: number;
    visual: number;
    messaging: number;
    interaction: number;
    inconsistencies: BrandInconsistency[];
}
export interface BrandInconsistency {
    element: string;
    inconsistency: string;
    impact: string;
    fix: string;
}
export interface BrandDifferentiation {
    uniqueness: number;
    memorability: number;
    distinctiveness: DistinctiveElement[];
    competitiveAdvantage: string[];
}
export interface DistinctiveElement {
    element: string;
    uniqueness: number;
    impact: string;
    strengthening: string;
}
export interface ResponsiveAesthetics {
    breakpoints: AestheticBreakpoint[];
    adaptiveDesign: AdaptiveAestheticDesign;
    fluidAesthetics: FluidAesthetics;
    contextualAdaptations: ContextualAestheticAdaptation[];
}
export interface AestheticBreakpoint {
    breakpoint: string;
    aestheticAdjustments: AestheticAdjustment[];
    priorityChanges: PriorityChange[];
    qualityMaintenance: QualityMaintenance;
}
export interface AestheticAdjustment {
    property: string;
    adjustment: string;
    reasoning: string;
    impact: string;
}
export interface PriorityChange {
    element: string;
    originalPriority: number;
    newPriority: number;
    reasoning: string;
}
export interface QualityMaintenance {
    maintained: string[];
    compromised: string[];
    enhanced: string[];
    strategy: string;
}
export interface AdaptiveAestheticDesign {
    triggers: AdaptiveTrigger[];
    adaptations: AdaptiveAdaptation[];
    learning: AdaptiveLearning;
}
export interface AdaptiveTrigger {
    trigger: string;
    condition: string;
    sensitivity: number;
    confidence: number;
}
export interface AdaptiveAdaptation {
    adaptation: string;
    implementation: string;
    effectiveness: number;
    reversibility: boolean;
}
export interface AdaptiveLearning {
    enabled: boolean;
    methods: string[];
    improvement: number;
    personalization: PersonalizationLevel;
}
export interface PersonalizationLevel {
    level: 'none' | 'basic' | 'moderate' | 'advanced' | 'ai_driven';
    features: string[];
    userControl: number;
}
export interface FluidAesthetics {
    fluidElements: FluidElement[];
    scalingStrategies: ScalingStrategy[];
    preservation: AestheticPreservation;
}
export interface FluidElement {
    element: string;
    fluidProperties: string[];
    constraints: FluidConstraint[];
    effectiveness: number;
}
export interface FluidConstraint {
    constraint: string;
    value: number;
    reasoning: string;
}
export interface ScalingStrategy {
    strategy: string;
    application: string[];
    quality: number;
    performance: number;
}
export interface AestheticPreservation {
    preserved: string[];
    adapted: string[];
    sacrificed: string[];
    justification: string;
}
export interface ContextualAestheticAdaptation {
    context: string;
    adaptations: ContextualAdaptation[];
    triggers: ContextualTrigger[];
    effectiveness: number;
}
export interface ContextualAdaptation {
    adaptation: string;
    implementation: string;
    impact: string;
    duration: number;
}
export interface ContextualTrigger {
    trigger: string;
    detection: string;
    reliability: number;
    response: string;
}
export interface AestheticQualityMetrics {
    overall: number;
    beauty: BeautyMetrics;
    functionality: FunctionalityMetrics;
    usability: UsabilityMetrics;
    emotional: EmotionalMetrics;
    accessibility: AccessibilityMetrics;
    performance: PerformanceMetrics;
}
export interface BeautyMetrics {
    harmony: number;
    proportion: number;
    balance: number;
    rhythm: number;
    unity: number;
    overall: number;
}
export interface FunctionalityMetrics {
    clarity: number;
    efficiency: number;
    effectiveness: number;
    reliability: number;
    overall: number;
}
export interface UsabilityMetrics {
    learnability: number;
    efficiency: number;
    memorability: number;
    errors: number;
    satisfaction: number;
    overall: number;
}
export interface EmotionalMetrics {
    engagement: number;
    appeal: number;
    trust: number;
    delight: number;
    memorability: number;
    overall: number;
}
export interface AccessibilityMetrics {
    compliance: number;
    usability: number;
    inclusion: number;
    universality: number;
    overall: number;
}
export interface PerformanceMetrics {
    loadTime: number;
    renderTime: number;
    interactivity: number;
    efficiency: number;
    overall: number;
}
/**
 * Aesthetic Optimization Engine
 */
export declare class AestheticOptimizer {
    /**
     * Generate comprehensive aesthetic profile for visualization system
     */
    static generateAestheticProfile(dataCharacteristics: any, domainContext: any, brandGuidelines?: any, userPreferences?: any, contextualRequirements?: any): AestheticProfile;
    /**
     * Generate optimized color system based on data and context
     */
    private static generateOptimizedColorSystem;
    /**
     * Analyze data visualization color requirements
     */
    private static analyzeDataVisualizationColorRequirements;
    /**
     * Generate primary color palette optimized for data visualization
     */
    private static generatePrimaryColorPalette;
    /**
     * Generate contextually appropriate base colors for domain
     */
    private static generateContextualBaseColors;
    /**
     * Create color definition from HSL values
     */
    private static createColorDefinitionFromHSL;
    /**
     * Convert HSL to Hex
     */
    private static hslToHex;
    /**
     * Convert HSL to RGB
     */
    private static hslToRgb;
    /**
     * Generate human-readable color name
     */
    private static generateColorName;
    /**
     * Analyze color psychology properties
     */
    private static analyzeColorPsychology;
    /**
     * Analyze color accessibility properties
     */
    private static analyzeColorAccessibility;
    /**
     * Calculate contrast ratio between two colors
     */
    private static calculateContrastRatio;
    /**
     * Create placeholder color definition
     */
    private static createColorDefinition;
    /**
     * Select optimal harmony type for data visualization
     */
    private static selectOptimalHarmonyType;
    /**
     * Expand palette using color harmony principles
     */
    private static expandPaletteUsingHarmony;
    /**
     * Create color variation
     */
    private static createColorVariation;
    /**
     * Generate neutral colors
     */
    private static generateNeutralColors;
    /**
     * Calculate color harmony score
     */
    private static calculateColorHarmonyScore;
    private static buildDataVisualizationPalette;
    private static createSemanticColorMappings;
    private static generateColorPsychologyProfile;
    private static generateColorAccessibilityProfile;
    private static analyzeCulturalColorConsiderations;
    private static createDynamicColorAdaptation;
    /**
     * Check if hues follow triadic relationship
     */
    private static checkTriadicRelationship;
    /**
     * Calculate variance for statistical analysis
     */
    private static calculateVariance;
    private static generateOptimizedTypographySystem;
    private static designVisualComposition;
    private static createEmotionalDesign;
    private static ensureAestheticAccessibility;
    private static integrateBrandRequirements;
    private static createResponsiveAesthetics;
    private static calculateAestheticQuality;
    private static generateCategoricalPalette;
    private static generateAdditionalCategoricalColors;
    private static findOptimalHue;
    private static buildSequentialPalette;
    private static buildDivergingPalette;
    private static optimizeQualitativePalette;
    private static calculateDiscriminabilityScore;
    private static calculateColorDistance;
    private static createSpecialPurposeColors;
    private static calculateEncodingOptimization;
    private static calculateAverageDiscriminability;
    private static calculateOrderPreservation;
    private static isSequentiallyOrdered;
    private static isMonotonic;
    private static calculateBandwidthEfficiency;
    private static calculateCognitiveLoad;
    private static calculatePerceptualUniformity;
    private static deriveLayoutPrinciples;
    private static calculateVisualBalance;
    private static establishCompositionHierarchy;
    private static defineSpatialRelationships;
}
//# sourceMappingURL=aesthetic-optimization.d.ts.map