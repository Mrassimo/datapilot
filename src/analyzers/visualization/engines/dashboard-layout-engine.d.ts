/**
 * Sophisticated Dashboard Layout Engine
 *
 * Advanced engine for intelligent dashboard composition using:
 * - Perceptual hierarchy optimization
 * - Spatial relationship analysis
 * - Narrative flow construction
 * - Cognitive load balancing
 * - Cross-chart interaction design
 * - Responsive layout adaptation
 */
export interface DashboardLayout {
    layoutStrategy: LayoutStrategy;
    spatialArrangement: SpatialArrangement;
    narrativeFlow: NarrativeFlow;
    perceptualHierarchy: PerceptualHierarchy;
    interactionDesign: InteractionDesign;
    responsiveAdaptation: ResponsiveAdaptation;
    cognitiveOptimization: CognitiveOptimization;
    layoutMetrics: LayoutMetrics;
}
export interface LayoutStrategy {
    type: 'grid' | 'freeform' | 'golden_spiral' | 'z_pattern' | 'f_pattern' | 'narrative' | 'analytical';
    reasoning: string;
    principles: LayoutPrinciple[];
    constraints: LayoutConstraint[];
    flexibility: number;
}
export interface LayoutPrinciple {
    principle: string;
    weight: number;
    application: string;
    tradeoffs: string[];
}
export interface LayoutConstraint {
    constraint: string;
    type: 'hard' | 'soft' | 'preference';
    value: any;
    reasoning: string;
}
export interface SpatialArrangement {
    zones: LayoutZone[];
    relationships: SpatialRelationship[];
    proximityRules: ProximityRule[];
    alignmentGrid: AlignmentGrid;
    spaceUtilization: SpaceUtilization;
}
export interface LayoutZone {
    id: string;
    purpose: 'primary' | 'secondary' | 'supporting' | 'contextual' | 'navigational';
    bounds: Rectangle;
    visualWeight: number;
    attentionPriority: number;
    contentTypes: string[];
    visualProperties: ZoneProperties;
}
export interface Rectangle {
    x: number;
    y: number;
    width: number;
    height: number;
}
export interface ZoneProperties {
    backgroundColor: string;
    borderStyle: string;
    padding: Spacing;
    margin: Spacing;
    elevation: number;
}
export interface Spacing {
    top: number;
    right: number;
    bottom: number;
    left: number;
}
export interface SpatialRelationship {
    sourceZone: string;
    targetZone: string;
    relationshipType: 'adjacent' | 'grouped' | 'hierarchical' | 'sequential' | 'comparative';
    strength: number;
    visualIndicators: string[];
    purpose: string;
}
export interface ProximityRule {
    rule: string;
    distance: number;
    applicableElements: string[];
    reasoning: string;
}
export interface AlignmentGrid {
    columns: number;
    rows: number;
    gutterWidth: number;
    gutterHeight: number;
    baselineGrid: number;
    snapToGrid: boolean;
    gridType: 'modular' | 'columnar' | 'manuscript' | 'hierarchical';
}
export interface SpaceUtilization {
    efficiency: number;
    balance: number;
    density: number;
    breathingRoom: number;
    hotSpots: HotSpot[];
}
export interface HotSpot {
    area: Rectangle;
    type: 'overcrowded' | 'underutilized' | 'optimal';
    severity: number;
    recommendations: string[];
}
export interface NarrativeFlow {
    storyStructure: StoryStructure;
    readingPath: ReadingPath;
    informationArchitecture: InformationArchitecture;
    transitionDesign: TransitionDesign;
    contextualConnections: ContextualConnection[];
}
export interface StoryStructure {
    structure: 'linear' | 'branching' | 'hub_spoke' | 'layered' | 'exploratory';
    acts: StoryAct[];
    climax: string;
    resolution: string;
    theme: string;
}
export interface StoryAct {
    act: number;
    purpose: string;
    visualizations: string[];
    keyMessage: string;
    estimatedTime: number;
}
export interface ReadingPath {
    primaryPath: PathNode[];
    alternativePaths: PathNode[][];
    entryPoints: EntryPoint[];
    exitPoints: ExitPoint[];
    decisionPoints: DecisionPoint[];
}
export interface PathNode {
    elementId: string;
    order: number;
    dwellTime: number;
    importance: number;
    connections: string[];
}
export interface EntryPoint {
    elementId: string;
    probability: number;
    designOptimization: string[];
}
export interface ExitPoint {
    elementId: string;
    purpose: 'conclusion' | 'action' | 'navigation' | 'abandonment';
    callToAction?: string;
}
export interface DecisionPoint {
    elementId: string;
    choices: Choice[];
    defaultPath: string;
    reasoning: string;
}
export interface Choice {
    description: string;
    targetElement: string;
    probability: number;
    userType: string;
}
export interface InformationArchitecture {
    hierarchy: InformationHierarchy;
    categories: InformationCategory[];
    relationships: InformationRelationship[];
    navigation: NavigationStructure;
}
export interface InformationHierarchy {
    levels: HierarchyLevel[];
    depth: number;
    breadth: number;
    balance: number;
}
export interface HierarchyLevel {
    level: number;
    elements: string[];
    purpose: string;
    visualTreatment: string;
}
export interface InformationCategory {
    category: string;
    elements: string[];
    cohesion: number;
    visualGrouping: string;
}
export interface InformationRelationship {
    type: 'causal' | 'temporal' | 'comparative' | 'compositional' | 'correlational';
    elements: string[];
    strength: number;
    visualization: string;
}
export interface NavigationStructure {
    type: 'breadcrumb' | 'tabs' | 'sidebar' | 'floating' | 'contextual';
    elements: NavigationElement[];
    behavior: NavigationBehavior;
}
export interface NavigationElement {
    id: string;
    type: 'filter' | 'zoom' | 'drill_down' | 'category' | 'time_range';
    placement: Rectangle;
    style: string;
}
export interface NavigationBehavior {
    persistence: boolean;
    animation: boolean;
    feedback: string[];
    defaultState: Record<string, any>;
}
export interface TransitionDesign {
    transitions: Transition[];
    continuity: ContinuityRule[];
    pacing: PacingStrategy;
    emphasis: EmphasisTechnique[];
}
export interface Transition {
    from: string;
    to: string;
    type: 'fade' | 'slide' | 'scale' | 'morph' | 'highlight' | 'instant';
    duration: number;
    easing: string;
    purpose: string;
}
export interface ContinuityRule {
    rule: string;
    elements: string[];
    application: string;
}
export interface PacingStrategy {
    rhythm: 'fast' | 'moderate' | 'slow' | 'variable';
    pausePoints: string[];
    acceleration: AccelerationPoint[];
}
export interface AccelerationPoint {
    elementId: string;
    speedChange: 'accelerate' | 'decelerate' | 'pause';
    reasoning: string;
}
export interface EmphasisTechnique {
    technique: 'color' | 'size' | 'motion' | 'isolation' | 'contrast';
    targetElement: string;
    intensity: number;
    duration: number;
}
export interface ContextualConnection {
    connectionType: 'data_relationship' | 'temporal_sequence' | 'causal_link' | 'comparative_analysis';
    elements: string[];
    visualConnection: VisualConnection;
    semanticConnection: SemanticConnection;
}
export interface VisualConnection {
    technique: 'line' | 'color_coding' | 'shared_axis' | 'proximity' | 'similarity';
    style: ConnectionStyle;
    interactivity: string[];
}
export interface ConnectionStyle {
    strokeWidth: number;
    strokeColor: string;
    strokeStyle: 'solid' | 'dashed' | 'dotted';
    opacity: number;
    animation?: string;
}
export interface SemanticConnection {
    meaning: string;
    strength: number;
    explanation: string;
    userBenefit: string;
}
export interface PerceptualHierarchy {
    visualLayers: VisualLayer[];
    attentionFlow: AttentionFlow;
    focusManagement: FocusManagement;
    contrastStrategy: ContrastStrategy;
}
export interface VisualLayer {
    layer: number;
    elements: string[];
    purpose: string;
    visualTreatment: LayerTreatment;
}
export interface LayerTreatment {
    opacity: number;
    blur: number;
    scale: number;
    color: string;
    priority: number;
}
export interface AttentionFlow {
    primaryFlow: AttentionNode[];
    secondaryFlows: AttentionNode[][];
    attractors: AttentionAttractor[];
    distractors: AttentionDistractor[];
}
export interface AttentionNode {
    elementId: string;
    attentionWeight: number;
    sustainTime: number;
    transitionTime: number;
}
export interface AttentionAttractor {
    elementId: string;
    technique: 'motion' | 'color' | 'size' | 'contrast' | 'novelty';
    strength: number;
    appropriateness: number;
}
export interface AttentionDistractor {
    elementId: string;
    distractionLevel: number;
    impact: 'critical' | 'moderate' | 'minor';
    mitigation: string[];
}
export interface FocusManagement {
    focusStates: FocusState[];
    transitions: FocusTransition[];
    persistence: FocusPersistence;
}
export interface FocusState {
    state: string;
    focusedElements: string[];
    dimmedElements: string[];
    hiddenElements: string[];
    purpose: string;
}
export interface FocusTransition {
    fromState: string;
    toState: string;
    trigger: string;
    animation: string;
    duration: number;
}
export interface FocusPersistence {
    maintainFocus: boolean;
    contextSwitching: string;
    memoryAids: string[];
}
export interface ContrastStrategy {
    contrastPairs: ContrastPair[];
    emphasis: EmphasisStrategy;
    hierarchy: ContrastHierarchy;
}
export interface ContrastPair {
    element1: string;
    element2: string;
    contrastType: 'color' | 'size' | 'position' | 'style' | 'motion';
    strength: number;
    purpose: string;
}
export interface EmphasisStrategy {
    primaryEmphasis: string;
    secondaryEmphasis: string[];
    techniques: string[];
    balance: number;
}
export interface ContrastHierarchy {
    levels: ContrastLevel[];
    consistency: number;
    predictability: number;
}
export interface ContrastLevel {
    level: number;
    elements: string[];
    contrastRatio: number;
    purpose: string;
}
export interface InteractionDesign {
    interactionPatterns: InteractionPattern[];
    crossChartInteractions: CrossChartInteraction[];
    feedbackSystems: FeedbackSystem[];
    gestureSupport: GestureSupport;
}
export interface InteractionPattern {
    pattern: 'drill_down' | 'brush_link' | 'overview_detail' | 'small_multiples' | 'coordinated_views';
    applicableCharts: string[];
    implementation: InteractionImplementation;
    usabilityScore: number;
}
export interface InteractionImplementation {
    triggers: string[];
    behaviors: string[];
    feedback: string[];
    constraints: string[];
}
export interface CrossChartInteraction {
    sourceChart: string;
    targetCharts: string[];
    interactionType: 'filter' | 'highlight' | 'zoom' | 'select' | 'annotate';
    synchronization: SynchronizationRule;
    visualFeedback: VisualFeedback;
}
export interface SynchronizationRule {
    timing: 'immediate' | 'debounced' | 'on_action';
    scope: 'full' | 'partial' | 'contextual';
    persistence: boolean;
}
export interface VisualFeedback {
    technique: string;
    intensity: number;
    duration: number;
    reversible: boolean;
}
export interface FeedbackSystem {
    type: 'hover' | 'click' | 'selection' | 'error' | 'loading' | 'success';
    visual: VisualFeedback;
    audio?: AudioFeedback;
    haptic?: HapticFeedback;
}
export interface AudioFeedback {
    sound: string;
    volume: number;
    optional: boolean;
}
export interface HapticFeedback {
    pattern: string;
    intensity: number;
    duration: number;
}
export interface GestureSupport {
    touchGestures: TouchGesture[];
    mouseGestures: MouseGesture[];
    keyboardShortcuts: KeyboardShortcut[];
    accessibility: AccessibilityGesture[];
}
export interface TouchGesture {
    gesture: 'tap' | 'double_tap' | 'long_press' | 'pinch' | 'pan' | 'swipe';
    action: string;
    targetElements: string[];
    sensitivity: number;
}
export interface MouseGesture {
    gesture: 'click' | 'double_click' | 'drag' | 'wheel' | 'hover';
    action: string;
    modifiers: string[];
    cursor: string;
}
export interface KeyboardShortcut {
    keys: string[];
    action: string;
    context: string;
    description: string;
}
export interface AccessibilityGesture {
    technique: string;
    purpose: string;
    implementation: string;
    compliance: string;
}
export interface ResponsiveAdaptation {
    breakpoints: ResponsiveBreakpoint[];
    adaptationStrategies: AdaptationStrategy[];
    prioritization: ContentPrioritization;
    fallbacks: ResponsiveFallback[];
}
export interface ResponsiveBreakpoint {
    name: string;
    minWidth: number;
    maxWidth?: number;
    orientation?: 'portrait' | 'landscape';
    deviceType: 'mobile' | 'tablet' | 'desktop' | 'large_screen';
}
export interface AdaptationStrategy {
    breakpoint: string;
    adaptations: Adaptation[];
    performance: PerformanceAdaptation;
    usability: UsabilityAdaptation;
}
export interface Adaptation {
    type: 'layout' | 'content' | 'interaction' | 'navigation' | 'visual';
    description: string;
    implementation: string;
    impact: string;
}
export interface PerformanceAdaptation {
    techniques: string[];
    expectedImprovement: string;
    tradeoffs: string[];
}
export interface UsabilityAdaptation {
    improvements: string[];
    considerations: string[];
    testing: string[];
}
export interface ContentPrioritization {
    priority1: string[];
    priority2: string[];
    priority3: string[];
    priority4: string[];
    collapsible: string[];
}
export interface ResponsiveFallback {
    condition: string;
    fallback: string;
    quality: 'full' | 'reduced' | 'minimal';
    accessibility: boolean;
}
export interface CognitiveOptimization {
    cognitiveLoadAnalysis: CognitiveLoadAnalysis;
    attentionManagement: AttentionManagement;
    memorySupport: MemorySupport;
    decisionSupport: DecisionSupport;
}
export interface CognitiveLoadAnalysis {
    totalLoad: number;
    intrinsicLoad: number;
    extraneousLoad: number;
    germaneLoad: number;
    recommendations: LoadReduction[];
}
export interface LoadReduction {
    technique: string;
    reduction: number;
    applicability: string;
    implementation: string;
}
export interface AttentionManagement {
    strategies: AttentionStrategy[];
    timing: AttentionTiming;
    sustainability: AttentionSustainability;
}
export interface AttentionStrategy {
    strategy: string;
    purpose: string;
    effectiveness: number;
    sideEffects: string[];
}
export interface AttentionTiming {
    peakAttention: number;
    attentionSpan: number;
    refreshTechniques: string[];
}
export interface AttentionSustainability {
    techniques: string[];
    varietyScore: number;
    engagementLevel: number;
}
export interface MemorySupport {
    shortTermSupport: string[];
    longTermSupport: string[];
    contextualCues: string[];
    repetitionStrategy: string;
}
export interface DecisionSupport {
    decisionPoints: DecisionSupportPoint[];
    guidanceLevel: 'minimal' | 'moderate' | 'extensive';
    errorPrevention: string[];
}
export interface DecisionSupportPoint {
    location: string;
    supportType: 'information' | 'recommendation' | 'warning' | 'confirmation';
    content: string;
    prominence: number;
}
export interface LayoutMetrics {
    efficiency: EfficiencyMetrics;
    usability: UsabilityMetrics;
    aesthetics: AestheticMetrics;
    accessibility: AccessibilityMetrics;
    performance: PerformanceMetrics;
    overallScore: number;
}
export interface EfficiencyMetrics {
    spaceUtilization: number;
    informationDensity: number;
    navigationEfficiency: number;
    taskCompletion: number;
}
export interface UsabilityMetrics {
    learnability: number;
    efficiency: number;
    memorability: number;
    errorRate: number;
    satisfaction: number;
}
export interface AestheticMetrics {
    visualHarmony: number;
    balance: number;
    proportion: number;
    rhythm: number;
    unity: number;
}
export interface AccessibilityMetrics {
    wcagCompliance: number;
    colorBlindSupport: number;
    motorSupport: number;
    cognitiveSupport: number;
    screenReaderSupport: number;
}
export interface PerformanceMetrics {
    renderTime: number;
    interactionLatency: number;
    memoryUsage: number;
    responsiveness: number;
}
/**
 * Sophisticated Dashboard Layout Engine
 */
export declare class DashboardLayoutEngine {
    /**
     * Generate optimal dashboard layout based on visualization characteristics
     */
    static generateLayout(visualizations: VisualizationSpec[], constraints: LayoutConstraints, context: LayoutContext): DashboardLayout;
    /**
     * Analyze visualization characteristics and relationships
     */
    private static analyzeVisualizations;
    /**
     * Select optimal layout strategy based on analysis
     */
    private static selectLayoutStrategy;
    /**
     * Generate spatial arrangement optimized for perception
     */
    private static generateSpatialArrangement;
    /**
     * Design narrative flow for optimal user experience
     */
    private static designNarrativeFlow;
    private static identifyRelationships;
    private static calculateImportance;
    private static assessComplexity;
    private static assessInteractionPotential;
    private static calculateDiversity;
    private static getLayoutPrinciples;
    private static generateLayoutConstraints;
    private static calculateFlexibility;
    private static createLayoutZones;
    private static establishSpatialRelationships;
    private static defineProximityRules;
    private static createAlignmentGrid;
    private static analyzeSpaceUtilization;
    private static createStoryStructure;
    private static designReadingPath;
    private static createInformationArchitecture;
    private static designTransitions;
    private static establishContextualConnections;
    private static establishPerceptualHierarchy;
    private static designInteractions;
    private static designResponsiveAdaptation;
    private static optimizeCognitivLoad;
    private static calculateLayoutMetrics;
    private static findSharedDimensions;
    private static createDimensionConnection;
    private static calculateConnectionStrength;
    private static checkComplementaryAnalysis;
    private static checkHierarchicalRelationship;
    private static identifyTemporalConnections;
    private static establishNarrativeConnections;
}
interface VisualizationSpec {
    id: string;
    type: string;
    data: any[];
    importance: number;
    complexity: number;
    size: {
        width: number;
        height: number;
    };
    relationships: string[];
}
interface LayoutConstraints {
    maxWidth: number;
    maxHeight: number;
    minChartSize: {
        width: number;
        height: number;
    };
    margins: Spacing;
    aspectRatio?: number;
}
interface LayoutContext {
    purpose: 'exploratory' | 'analytical' | 'presentation' | 'monitoring';
    audience: 'expert' | 'general' | 'executive' | 'mixed';
    platform: 'desktop' | 'tablet' | 'mobile' | 'large_screen';
    timeConstraint: 'quick_scan' | 'detailed_analysis' | 'presentation';
}
export {};
//# sourceMappingURL=dashboard-layout-engine.d.ts.map