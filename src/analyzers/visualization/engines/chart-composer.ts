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
  encodingEfficiency: number; // 0-100 score
  cognitiveLoad: number; // 0-100 score
  informationDensity: number; // 0-100 score
  redundantEncodings: RedundantEncoding[];
  hierarchicalStructure: VisualHierarchy;
}

export interface EncodingDimension {
  channel: VisualChannel;
  dataField: string;
  dataType: DataType;
  encodingStrength: number; // How strongly this channel conveys the data
  perceptualAccuracy: number; // How accurately users can decode this encoding
  discriminability: number; // How well users can distinguish between values
  orderingPreservation: number; // How well the encoding preserves data ordering
  optimization: ChannelOptimization;
}

export type VisualChannel =
  | 'position_x'
  | 'position_y'
  | 'position_angle'
  | 'position_radius'
  | 'color_hue'
  | 'color_saturation'
  | 'color_lightness'
  | 'color_opacity'
  | 'size_area'
  | 'size_length'
  | 'size_width'
  | 'size_volume'
  | 'shape'
  | 'texture'
  | 'orientation'
  | 'motion'
  | 'typography_weight'
  | 'typography_style'
  | 'typography_size';

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
  redundancyLevel: number; // 0-100
  purpose: 'accessibility' | 'emphasis' | 'clarity' | 'error_prevention';
  effectiveness: number; // 0-100
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
  subtlety: number; // 0-100, higher is more subtle
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
  harmonyScore: number; // 0-100
}

export interface ColorScheme {
  type:
    | 'monochromatic'
    | 'analogous'
    | 'complementary'
    | 'triadic'
    | 'tetradic'
    | 'split_complementary';
  baseColor: HSLColor;
  harmony: HSLColor[];
  reasoning: string;
}

export interface HSLColor {
  hue: number; // 0-360
  saturation: number; // 0-100
  lightness: number; // 0-100
  alpha?: number; // 0-1
}

export interface ColorPalette {
  categorical: HSLColor[];
  sequential: HSLColor[];
  diverging: HSLColor[];
  specialPurpose: Map<string, HSLColor>;
  accessibilityScore: number; // 0-100
}

export interface PsychologicalImpact {
  emotion: string;
  energy: number; // 0-100
  trust: number; // 0-100
  professionalism: number; // 0-100
  clarity: number; // 0-100
}

export interface SemanticColorMapping {
  concept: string;
  color: HSLColor;
  culturalRelevance: number; // 0-100
  universalRecognition: number; // 0-100
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
  scanability: number; // How easy it is to scan/skim
}

export interface TypographyPersonality {
  formality: number; // 0-100
  friendliness: number; // 0-100
  authority: number; // 0-100
  creativity: number; // 0-100
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
  stability: number; // 0-100
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
  aestheticScore: number; // 0-100
}

export interface ProportionApplication {
  element: string;
  ratio: number;
  reasoning: string;
}

export interface StyleConsistency {
  consistencyScore: number; // 0-100
  deviations: StyleDeviation[];
  unifyingElements: string[];
  brandAlignment: number; // 0-100
}

export interface StyleDeviation {
  element: string;
  inconsistency: string;
  impact: number; // 0-100
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
  principle:
    | 'proximity'
    | 'similarity'
    | 'closure'
    | 'continuity'
    | 'figure_ground'
    | 'common_fate';
  application: string;
  effectiveness: number; // 0-100
  cognitiveSupport: string;
}

export interface CognitiveLoadAnalysis {
  intrinsicLoad: number; // Content complexity
  extraneousLoad: number; // Design complexity
  germaneLoad: number; // Processing complexity
  totalLoad: number;
  recommendations: LoadReduction[];
}

export interface LoadReduction {
  technique: string;
  reduction: number; // Percentage reduction
  tradeoffs: string[];
}

export interface AttentionFlowAnalysis {
  entryPoints: AttentionPoint[];
  flowPath: AttentionPath[];
  exitPoints: AttentionPoint[];
  distractions: Distraction[];
  flowEfficiency: number; // 0-100
}

export interface AttentionPoint {
  element: string;
  strength: number;
  duration: number; // Estimated viewing time
  purpose: string;
}

export interface AttentionPath {
  from: string;
  to: string;
  probability: number; // 0-100
  facilitators: string[];
  barriers: string[];
}

export interface Distraction {
  element: string;
  distractionLevel: number; // 0-100
  impact: string;
  mitigation: string;
}

export interface MemorabilityFactors {
  distinctiveness: number; // 0-100
  meaningfulness: number; // 0-100
  simplicity: number; // 0-100
  emotionalImpact: number; // 0-100
  overallMemorability: number; // 0-100
}

export interface UsabilityMetrics {
  learnability: number; // 0-100
  efficiency: number; // 0-100
  memorability: number; // 0-100
  errorPrevention: number; // 0-100
  satisfaction: number; // 0-100
  overall: number; // 0-100
}

export interface AccessibilityCompliance {
  wcagLevel: 'A' | 'AA' | 'AAA';
  colorBlindnessSupport: ColorBlindnessSupport;
  contrastCompliance: ContrastCompliance;
  motorImpairmentSupport: MotorImpairmentSupport;
  cognitiveSupport: CognitiveSupport;
  screenReaderCompatibility: ScreenReaderCompatibility;
  complianceScore: number; // 0-100
}

export interface ColorBlindnessSupport {
  protanopia: number; // 0-100 support level
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
  appropriateness: number; // 0-100
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
  strength: number; // 0-100
  visualImpact: string;
  reasoning: string;
}

export interface VisualQualityMetrics {
  aestheticScore: number; // 0-100
  functionalScore: number; // 0-100
  accessibilityScore: number; // 0-100
  usabilityScore: number; // 0-100
  originalityScore: number; // 0-100
  overallQuality: number; // 0-100
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
export class ChartComposer {
  /**
   * Generate comprehensive composition profile for a visualization
   */
  static composeVisualization(
    chartType: string,
    dimensions: EncodingDimension[],
    dataCharacteristics: any,
    contextualRequirements: any = {},
  ): CompositionProfile {
    const visualEncoding = this.optimizeMultiDimensionalEncoding(dimensions, chartType);
    const aestheticProfile = this.generateAestheticProfile(
      chartType,
      dataCharacteristics,
      contextualRequirements,
    );
    const perceptualOptimization = this.optimizePerception(visualEncoding, aestheticProfile);
    const accessibilityCompliance = this.ensureAccessibility(visualEncoding, aestheticProfile);
    const culturalAdaptation = this.adaptForCulture(contextualRequirements.culture || 'en-US');
    const compositionPrinciples = this.applyCompositionPrinciples(chartType, visualEncoding);
    const qualityMetrics = this.assessVisualQuality(
      visualEncoding,
      aestheticProfile,
      perceptualOptimization,
      accessibilityCompliance,
    );

    return {
      visualEncoding,
      aestheticProfile,
      perceptualOptimization,
      accessibilityCompliance,
      culturalAdaptation,
      compositionPrinciples,
      qualityMetrics,
    };
  }

  /**
   * Optimize multi-dimensional encoding for maximum effectiveness
   */
  private static optimizeMultiDimensionalEncoding(
    dimensions: EncodingDimension[],
    chartType: string,
  ): MultiDimensionalEncoding {
    // Rank channels by perceptual effectiveness (Cleveland & McGill hierarchy)
    const channelRanking = this.getChannelEffectivenessRanking();

    // Optimize channel assignment based on data importance and perceptual accuracy
    const optimizedDimensions = this.optimizeChannelAssignment(dimensions, channelRanking);

    // Calculate encoding efficiency and cognitive load
    const efficiency = this.calculateEncodingEfficiency(optimizedDimensions);
    const cognitiveLoad = this.calculateCognitiveLoad(optimizedDimensions, chartType);
    const informationDensity = this.calculateInformationDensity(optimizedDimensions);

    // Add redundant encodings for accessibility and emphasis
    const redundantEncodings = this.generateRedundantEncodings(optimizedDimensions);

    // Create visual hierarchy
    const hierarchicalStructure = this.createVisualHierarchy(optimizedDimensions, chartType);

    const primaryDimensions = optimizedDimensions.filter((d) => d.encodingStrength > 0.7);
    const secondaryDimensions = optimizedDimensions.filter((d) => d.encodingStrength <= 0.7);

    return {
      primaryDimensions,
      secondaryDimensions,
      encodingEfficiency: efficiency,
      cognitiveLoad,
      informationDensity,
      redundantEncodings,
      hierarchicalStructure,
    };
  }

  /**
   * Generate comprehensive aesthetic profile
   */
  private static generateAestheticProfile(
    chartType: string,
    dataCharacteristics: any,
    contextualRequirements: any,
  ): AestheticProfile {
    const colorHarmony = this.generateColorHarmony(dataCharacteristics, contextualRequirements);
    const typographySystem = this.designTypographySystem(chartType, contextualRequirements);
    const spatialRhythm = this.establishSpatialRhythm(chartType);
    const visualBalance = this.calculateVisualBalance(chartType);
    const proportionSystem = this.selectProportionSystem(chartType, contextualRequirements);
    const styleConsistency = this.ensureStyleConsistency(
      colorHarmony,
      typographySystem,
      spatialRhythm,
    );

    return {
      colorHarmony,
      typographySystem,
      spatialRhythm,
      visualBalance,
      proportionSystem,
      styleConsistency,
    };
  }

  /**
   * Optimize for human visual perception
   */
  private static optimizePerception(
    visualEncoding: MultiDimensionalEncoding,
    aestheticProfile: AestheticProfile,
  ): PerceptualOptimization {
    const gestaltPrinciples = this.applyGestaltPrinciples(visualEncoding);
    const cognitiveLoad = this.analyzeCognitiveLoad(visualEncoding, aestheticProfile);
    const attentionFlow = this.analyzeAttentionFlow(visualEncoding, aestheticProfile);
    const memorability = this.assessMemorability(visualEncoding, aestheticProfile);
    const usabilityMetrics = this.calculateUsabilityMetrics(visualEncoding, aestheticProfile);

    return {
      gestaltPrinciples,
      cognitiveLoad,
      attentionFlow,
      memorability,
      usabilityMetrics,
    };
  }

  // Helper methods for channel effectiveness ranking (Cleveland & McGill)
  private static getChannelEffectivenessRanking(): Map<VisualChannel, number> {
    const ranking = new Map<VisualChannel, number>();

    // Position channels (most effective)
    ranking.set('position_x', 1.0);
    ranking.set('position_y', 1.0);

    // Length/size channels
    ranking.set('size_length', 0.9);
    ranking.set('size_area', 0.8);

    // Angle and slope
    ranking.set('position_angle', 0.7);

    // Color channels
    ranking.set('color_lightness', 0.6);
    ranking.set('color_saturation', 0.5);
    ranking.set('color_hue', 0.4);

    // Other channels (least effective for quantitative data)
    ranking.set('shape', 0.3);
    ranking.set('texture', 0.2);
    ranking.set('motion', 0.1);

    return ranking;
  }

  private static optimizeChannelAssignment(
    dimensions: EncodingDimension[],
    channelRanking: Map<VisualChannel, number>,
  ): EncodingDimension[] {
    // Sort dimensions by importance/variance and assign most effective channels
    const sortedDimensions = [...dimensions].sort(
      (a, b) => b.encodingStrength - a.encodingStrength,
    );

    return sortedDimensions.map((dim, index) => {
      const effectiveness = channelRanking.get(dim.channel) || 0.1;
      return {
        ...dim,
        perceptualAccuracy: effectiveness,
        discriminability: this.calculateDiscriminability(dim, effectiveness),
        orderingPreservation: this.calculateOrderingPreservation(dim, effectiveness),
        optimization: this.optimizeChannel(dim, effectiveness),
      };
    });
  }

  private static calculateEncodingEfficiency(dimensions: EncodingDimension[]): number {
    const totalEncodingPower = dimensions.reduce((sum, dim) => sum + dim.encodingStrength, 0);
    const redundancy = this.calculateRedundancy(dimensions);
    return Math.max(
      0,
      Math.min(100, (totalEncodingPower / dimensions.length) * 100 * (1 - redundancy)),
    );
  }

  private static calculateCognitiveLoad(
    dimensions: EncodingDimension[],
    chartType: string,
  ): number {
    const baseLoad = dimensions.length * 10; // Each dimension adds cognitive load
    const interactionLoad = this.getInteractionComplexity(chartType) * 5;
    const perceptualLoad = dimensions.reduce(
      (sum, dim) => sum + (1 - dim.perceptualAccuracy) * 10,
      0,
    );

    return Math.min(100, baseLoad + interactionLoad + perceptualLoad);
  }

  private static calculateInformationDensity(dimensions: EncodingDimension[]): number {
    const informationBits = dimensions.reduce((sum, dim) => {
      // Calculate information content based on data type and encoding effectiveness
      let bits = 1;
      if (dim.dataType === 'quantitative') bits = 8;
      else if (dim.dataType === 'ordinal') bits = 4;
      else if (dim.dataType === 'nominal') bits = 2;

      return sum + bits * dim.encodingStrength;
    }, 0);

    // Normalize to 0-100 scale
    return Math.min(100, informationBits * 5);
  }

  private static generateColorHarmony(
    dataCharacteristics: any,
    contextualRequirements: any,
  ): ColorHarmony {
    // Select base color based on context and data
    const baseColor: HSLColor = this.selectBaseColor(dataCharacteristics, contextualRequirements);

    // Generate harmonious color scheme
    const scheme = this.selectColorScheme(dataCharacteristics);
    const harmony = this.generateHarmoniousColors(baseColor, scheme.type);

    // Create comprehensive palette
    const palette = this.generateComprehensivePalette(harmony, dataCharacteristics);

    // Assess psychological impact
    const psychologicalImpact = this.assessPsychologicalImpact(harmony);

    // Create semantic mappings
    const semanticMapping = this.createSemanticColorMappings(dataCharacteristics);

    // Calculate harmony score
    const harmonyScore = this.calculateHarmonyScore(harmony, palette);

    return {
      scheme,
      palette,
      psychologicalImpact,
      semanticMapping,
      harmonyScore,
    };
  }

  // Placeholder implementations for complex methods
  private static calculateDiscriminability(dim: EncodingDimension, effectiveness: number): number {
    return effectiveness * 0.9; // Simplified calculation
  }

  private static calculateOrderingPreservation(
    dim: EncodingDimension,
    effectiveness: number,
  ): number {
    if (dim.dataType === 'quantitative' || dim.dataType === 'ordinal') {
      return effectiveness;
    }
    return 0.5; // Nominal data doesn't preserve ordering
  }

  private static optimizeChannel(
    dim: EncodingDimension,
    effectiveness: number,
  ): ChannelOptimization {
    return {
      scalingFunction: dim.dataType === 'quantitative' ? 'linear' : 'ordinal',
      domainOptimization: {
        zeroBehavior: 'include',
        outlierHandling: 'clip',
        domainPadding: 0.1,
        symmetryPreservation: false,
      },
      rangeOptimization: {
        minValue: 0,
        maxValue: 100,
        resolution: 1,
        perceptualUniformity: true,
        physicalConstraints: [],
      },
      perceptualCorrection: {
        gammaCorrection: 2.2,
        luminanceAdjustment: 1.0,
        contrastEnhancement: 1.0,
        colorBlindnessCompensation: {
          protanopia: 1.0,
          deuteranopia: 1.0,
          tritanopia: 1.0,
          achromatopsia: 1.0,
        },
      },
    };
  }

  private static calculateRedundancy(dimensions: EncodingDimension[]): number {
    // Simplified redundancy calculation
    return Math.max(0, (dimensions.length - 3) * 0.1);
  }

  private static getInteractionComplexity(chartType: string): number {
    const complexityMap: Record<string, number> = {
      scatter_plot: 2,
      line_chart: 1,
      bar_chart: 1,
      heatmap: 3,
      parallel_coordinates: 4,
      sankey: 4,
    };

    return complexityMap[chartType] || 2;
  }

  // Additional placeholder implementations...
  private static generateRedundantEncodings(dimensions: EncodingDimension[]): RedundantEncoding[] {
    const redundancies: RedundantEncoding[] = [];

    // Add pattern redundancy for color-blind accessibility
    dimensions.forEach((dim) => {
      if (dim.channel === 'color_hue' || dim.channel === 'color_saturation') {
        redundancies.push({
          primaryChannel: dim.channel,
          redundantChannel: 'shape',
          redundancyLevel: 85,
          purpose: 'accessibility',
          effectiveness: 90,
        });

        // Add texture redundancy for important categorical data
        if (dim.dataType === 'nominal' && dim.encodingStrength > 0.7) {
          redundancies.push({
            primaryChannel: dim.channel,
            redundantChannel: 'texture',
            redundancyLevel: 70,
            purpose: 'emphasis',
            effectiveness: 75,
          });
        }
      }

      // Add size redundancy for important quantitative data
      if (
        dim.channel === 'position_y' &&
        dim.dataType === 'quantitative' &&
        dim.encodingStrength > 0.8
      ) {
        redundancies.push({
          primaryChannel: dim.channel,
          redundantChannel: 'size_area',
          redundancyLevel: 60,
          purpose: 'emphasis',
          effectiveness: 80,
        });
      }
    });

    return redundancies;
  }

  private static createVisualHierarchy(
    dimensions: EncodingDimension[],
    chartType: string,
  ): VisualHierarchy {
    // Sort dimensions by importance (encoding strength)
    const sortedDimensions = [...dimensions].sort(
      (a, b) => b.encodingStrength - a.encodingStrength,
    );

    // Create hierarchy levels based on encoding strength
    const levels: HierarchyLevel[] = [
      {
        level: 1,
        elements: sortedDimensions.slice(0, 1).map((d) => d.dataField),
        visualWeight: 100,
        precedence: 1,
      },
      {
        level: 2,
        elements: sortedDimensions.slice(1, 3).map((d) => d.dataField),
        visualWeight: 75,
        precedence: 2,
      },
      {
        level: 3,
        elements: sortedDimensions.slice(3).map((d) => d.dataField),
        visualWeight: 50,
        precedence: 3,
      },
    ].filter((level) => level.elements.length > 0);

    // Create focus points for most important dimensions
    const focusPoints: FocusPoint[] = sortedDimensions.slice(0, 2).map((dim, index) => ({
      element: dim.dataField,
      attentionWeight: 100 - index * 25,
      visualTechniques:
        index === 0
          ? ['primary_color', 'large_size', 'central_position']
          : ['secondary_color', 'moderate_size'],
      cognitiveReasoning:
        index === 0
          ? 'Primary data dimension requiring immediate attention'
          : 'Secondary dimension providing context',
    }));

    // Create visual flow based on chart type
    const visualFlow: FlowDirection[] = this.generateVisualFlow(sortedDimensions, chartType);

    // Create attention guides
    const attentionGuides: AttentionGuide[] = [
      {
        technique: 'color_contrast',
        target: sortedDimensions[0]?.dataField || 'primary',
        effectiveness: 90,
        subtlety: 30,
      },
      {
        technique: 'size_progression',
        target: 'hierarchy',
        effectiveness: 85,
        subtlety: 60,
      },
    ];

    return {
      levels,
      focusPoints,
      visualFlow,
      attentionGuides,
    };
  }

  private static selectBaseColor(dataCharacteristics: any, contextualRequirements: any): HSLColor {
    // Analyze data sentiment and domain context
    const domain = contextualRequirements?.domain || 'general';
    const sentiment = this.analyzeDataSentiment(dataCharacteristics);
    const brandColors = contextualRequirements?.brandColors;

    // If brand colors are provided, use primary brand color
    if (brandColors && brandColors.length > 0) {
      return this.hexToHSL(brandColors[0]);
    }

    // Domain-specific color selection
    const domainColorMap: Record<string, HSLColor> = {
      education: { hue: 220, saturation: 65, lightness: 55 }, // Trustworthy blue
      healthcare: { hue: 160, saturation: 55, lightness: 50 }, // Calming green-blue
      finance: { hue: 200, saturation: 75, lightness: 45 }, // Professional blue
      marketing: { hue: 280, saturation: 70, lightness: 60 }, // Creative purple
      technology: { hue: 210, saturation: 80, lightness: 50 }, // Tech blue
      environment: { hue: 120, saturation: 60, lightness: 45 }, // Natural green
      social: { hue: 340, saturation: 65, lightness: 55 }, // Warm red-pink
      general: { hue: 220, saturation: 60, lightness: 50 }, // Neutral blue
    };

    const baseColor = domainColorMap[domain] || domainColorMap['general'];

    // Adjust based on data sentiment
    if (sentiment === 'positive') {
      baseColor.saturation = Math.min(90, baseColor.saturation + 15);
      baseColor.lightness = Math.min(70, baseColor.lightness + 10);
    } else if (sentiment === 'negative') {
      baseColor.saturation = Math.max(30, baseColor.saturation - 10);
      baseColor.lightness = Math.max(30, baseColor.lightness - 10);
    }

    // Adjust for data complexity
    const complexity = this.calculateDataComplexity(dataCharacteristics);
    if (complexity > 0.7) {
      // Use more muted colors for complex data to reduce cognitive load
      baseColor.saturation = Math.max(40, baseColor.saturation - 20);
    }

    return baseColor;
  }

  private static selectColorScheme(dataCharacteristics: any): ColorScheme {
    return {
      type: 'analogous',
      baseColor: { hue: 220, saturation: 70, lightness: 50 },
      harmony: [],
      reasoning: 'Analogous scheme provides harmony while maintaining distinction',
    };
  }

  private static generateHarmoniousColors(baseColor: HSLColor, schemeType: string): HSLColor[] {
    // Implementation would generate colors based on color theory
    return [baseColor];
  }

  private static generateComprehensivePalette(
    harmony: HSLColor[],
    dataCharacteristics: any,
  ): ColorPalette {
    return {
      categorical: harmony,
      sequential: harmony,
      diverging: harmony,
      specialPurpose: new Map(),
      accessibilityScore: 85,
    };
  }

  private static assessPsychologicalImpact(harmony: HSLColor[]): PsychologicalImpact {
    return {
      emotion: 'professional',
      energy: 60,
      trust: 80,
      professionalism: 85,
      clarity: 90,
    };
  }

  private static createSemanticColorMappings(dataCharacteristics: any): SemanticColorMapping[] {
    const mappings: SemanticColorMapping[] = [];

    // Analyze data for semantic meaning
    const fields = dataCharacteristics.fields || [];

    fields.forEach((field: any) => {
      const fieldName = field.name?.toLowerCase() || '';
      const fieldType = field.type || 'unknown';

      // Performance/success indicators
      if (
        fieldName.includes('success') ||
        fieldName.includes('positive') ||
        fieldName.includes('good')
      ) {
        mappings.push({
          concept: 'success',
          color: { hue: 120, saturation: 70, lightness: 50 }, // Green
          culturalRelevance: 90,
          universalRecognition: 95,
        });
      }

      // Warning/caution indicators
      if (
        fieldName.includes('warning') ||
        fieldName.includes('caution') ||
        fieldName.includes('moderate')
      ) {
        mappings.push({
          concept: 'warning',
          color: { hue: 45, saturation: 85, lightness: 55 }, // Orange
          culturalRelevance: 85,
          universalRecognition: 90,
        });
      }

      // Error/danger indicators
      if (
        fieldName.includes('error') ||
        fieldName.includes('danger') ||
        fieldName.includes('bad') ||
        fieldName.includes('negative')
      ) {
        mappings.push({
          concept: 'danger',
          color: { hue: 0, saturation: 75, lightness: 50 }, // Red
          culturalRelevance: 85,
          universalRecognition: 95,
        });
      }

      // Information/neutral indicators
      if (
        fieldName.includes('info') ||
        fieldName.includes('neutral') ||
        fieldName.includes('standard')
      ) {
        mappings.push({
          concept: 'information',
          color: { hue: 210, saturation: 60, lightness: 55 }, // Blue
          culturalRelevance: 90,
          universalRecognition: 85,
        });
      }

      // Temporal mappings
      if (fieldType === 'temporal' || fieldName.includes('time') || fieldName.includes('date')) {
        mappings.push({
          concept: 'temporal',
          color: { hue: 260, saturation: 50, lightness: 60 }, // Purple
          culturalRelevance: 70,
          universalRecognition: 70,
        });
      }

      // Financial mappings
      if (
        fieldName.includes('profit') ||
        fieldName.includes('revenue') ||
        fieldName.includes('income')
      ) {
        mappings.push({
          concept: 'financial_positive',
          color: { hue: 140, saturation: 65, lightness: 45 }, // Forest green
          culturalRelevance: 80,
          universalRecognition: 75,
        });
      }

      if (
        fieldName.includes('loss') ||
        fieldName.includes('cost') ||
        fieldName.includes('expense')
      ) {
        mappings.push({
          concept: 'financial_negative',
          color: { hue: 15, saturation: 70, lightness: 45 }, // Red-orange
          culturalRelevance: 80,
          universalRecognition: 75,
        });
      }
    });

    // Add default semantic mappings if none found
    if (mappings.length === 0) {
      mappings.push(
        {
          concept: 'primary',
          color: { hue: 220, saturation: 70, lightness: 50 },
          culturalRelevance: 90,
          universalRecognition: 85,
        },
        {
          concept: 'secondary',
          color: { hue: 45, saturation: 60, lightness: 55 },
          culturalRelevance: 80,
          universalRecognition: 80,
        },
      );
    }

    return mappings;
  }

  private static calculateHarmonyScore(harmony: HSLColor[], palette: ColorPalette): number {
    if (harmony.length === 0) return 0;

    let score = 0;
    let factors = 0;

    // Factor 1: Hue distribution (0-25 points)
    const hues = harmony.map((c) => c.hue);
    const hueSpread = this.calculateHueSpread(hues);
    const hueScore = Math.min(25, (hueSpread / 360) * 100);
    score += hueScore;
    factors++;

    // Factor 2: Saturation consistency (0-25 points)
    const saturations = harmony.map((c) => c.saturation);
    const saturationVariance = this.calculateVariance(saturations);
    const saturationScore = Math.max(0, 25 - saturationVariance / 100);
    score += saturationScore;
    factors++;

    // Factor 3: Lightness distribution (0-25 points)
    const lightnesses = harmony.map((c) => c.lightness);
    const lightnessRange = Math.max(...lightnesses) - Math.min(...lightnesses);
    const lightnessScore = Math.min(25, (lightnessRange / 80) * 25); // Good range is 0-80
    score += lightnessScore;
    factors++;

    // Factor 4: Color theory compliance (0-25 points)
    const theoryScore = this.evaluateColorTheoryCompliance(hues, palette.harmonyType);
    score += theoryScore;
    factors++;

    // Bonus factors
    // Accessibility bonus (0-10 points)
    const accessibilityBonus = this.calculateAccessibilityBonus(harmony);
    score += accessibilityBonus;

    // Cultural appropriateness bonus (0-5 points)
    const culturalBonus = this.calculateCulturalBonus(harmony);
    score += culturalBonus;

    // Normalize to 0-100 scale
    const baseScore = (score / factors) * (100 / 25);
    const bonusPoints = accessibilityBonus + culturalBonus;

    return Math.min(100, Math.max(0, baseScore + bonusPoints));
  }

  private static designTypographySystem(
    chartType: string,
    contextualRequirements: any,
  ): TypographySystem {
    return {
      hierarchy: {
        levels: [],
        scaleRatio: 1.25,
        baselineGrid: 16,
        verticalRhythm: 1.5,
      },
      readability: {
        contrastRatio: 4.5,
        optimalReadingDistance: 60,
        cognitiveLoad: 20,
        scanability: 80,
      },
      personality: {
        formality: 70,
        friendliness: 60,
        authority: 75,
        creativity: 40,
      },
      technicalOptimization: {
        hinting: true,
        subpixelRendering: true,
        optimalSizes: [12, 14, 16, 18, 24],
        performanceImpact: 5,
      },
    };
  }

  private static establishSpatialRhythm(chartType: string): SpatialRhythm {
    return {
      gridSystem: {
        type: 'modular',
        columns: 12,
        gutters: 16,
        margins: { top: 24, right: 24, bottom: 24, left: 24 },
        breakpoints: [],
      },
      spacingScale: {
        baseUnit: 8,
        scale: [4, 8, 16, 24, 32, 48, 64],
        semanticSpacing: new Map(),
        opticalAdjustments: [],
      },
      alignmentPrinciples: [],
      proximityRules: [],
    };
  }

  private static calculateVisualBalance(chartType: string): VisualBalance {
    return {
      type: 'asymmetrical',
      weight: {
        distribution: [],
        center: { x: 0.5, y: 0.5 },
        moments: [],
      },
      tension: [],
      stability: 80,
    };
  }

  private static selectProportionSystem(
    chartType: string,
    contextualRequirements: any,
  ): ProportionSystem {
    return {
      system: 'golden_ratio',
      ratios: [1.618, 1.414, 1.333],
      applications: [],
      aestheticScore: 80,
    };
  }

  private static ensureStyleConsistency(
    colorHarmony: ColorHarmony,
    typographySystem: TypographySystem,
    spatialRhythm: SpatialRhythm,
  ): StyleConsistency {
    return {
      consistencyScore: 85,
      deviations: [],
      unifyingElements: ['color palette', 'typography scale', 'spacing system'],
      brandAlignment: 80,
    };
  }

  private static applyGestaltPrinciples(
    visualEncoding: MultiDimensionalEncoding,
  ): GestaltApplication[] {
    const applications: GestaltApplication[] = [];

    // Proximity: Group related data elements
    if (visualEncoding.primaryDimensions.length > 1) {
      applications.push({
        principle: 'proximity',
        application: 'Group related data points using spatial proximity to show relationships',
        effectiveness: 85,
        cognitiveSupport: 'Reduces cognitive load by naturally grouping related information',
      });
    }

    // Similarity: Use consistent visual properties for similar data
    const categoricalDimensions = visualEncoding.primaryDimensions.filter(
      (d) => d.dataType === 'nominal',
    );
    if (categoricalDimensions.length > 0) {
      applications.push({
        principle: 'similarity',
        application:
          'Use consistent colors, shapes, or patterns for data elements in the same category',
        effectiveness: 90,
        cognitiveSupport: 'Enables rapid categorization and pattern recognition',
      });
    }

    // Closure: Complete implied shapes and patterns
    applications.push({
      principle: 'closure',
      application: 'Use implied connections and boundaries to group data without explicit lines',
      effectiveness: 75,
      cognitiveSupport: 'Reduces visual clutter while maintaining data relationships',
    });

    // Continuity: Create visual flow through data
    const temporalDimensions = visualEncoding.primaryDimensions.filter(
      (d) => d.dataType === 'temporal',
    );
    if (temporalDimensions.length > 0) {
      applications.push({
        principle: 'continuity',
        application: 'Create smooth visual transitions and flow in temporal data visualization',
        effectiveness: 80,
        cognitiveSupport: 'Supports natural reading patterns and temporal understanding',
      });
    }

    // Figure-ground: Establish clear hierarchy
    applications.push({
      principle: 'figure_ground',
      application:
        'Use contrast and visual weight to distinguish primary data from background context',
      effectiveness: 95,
      cognitiveSupport: 'Enables immediate focus on most important information',
    });

    // Common fate: Show data relationships through movement or transformation
    if (visualEncoding.informationDensity > 60) {
      applications.push({
        principle: 'common_fate',
        application: 'Use coordinated animations or transformations to show data relationships',
        effectiveness: 70,
        cognitiveSupport: 'Reveals hidden patterns and connections in complex datasets',
      });
    }

    return applications;
  }

  private static analyzeCognitiveLoad(
    visualEncoding: MultiDimensionalEncoding,
    aestheticProfile: AestheticProfile,
  ): CognitiveLoadAnalysis {
    return {
      intrinsicLoad: visualEncoding.cognitiveLoad * 0.4,
      extraneousLoad: visualEncoding.cognitiveLoad * 0.3,
      germaneLoad: visualEncoding.cognitiveLoad * 0.3,
      totalLoad: visualEncoding.cognitiveLoad,
      recommendations: [],
    };
  }

  private static analyzeAttentionFlow(
    visualEncoding: MultiDimensionalEncoding,
    aestheticProfile: AestheticProfile,
  ): AttentionFlowAnalysis {
    return {
      entryPoints: [],
      flowPath: [],
      exitPoints: [],
      distractions: [],
      flowEfficiency: 75,
    };
  }

  private static assessMemorability(
    visualEncoding: MultiDimensionalEncoding,
    aestheticProfile: AestheticProfile,
  ): MemorabilityFactors {
    return {
      distinctiveness: 70,
      meaningfulness: 80,
      simplicity: 75,
      emotionalImpact: 60,
      overallMemorability: 71,
    };
  }

  private static calculateUsabilityMetrics(
    visualEncoding: MultiDimensionalEncoding,
    aestheticProfile: AestheticProfile,
  ): UsabilityMetrics {
    return {
      learnability: 80,
      efficiency: 85,
      memorability: 75,
      errorPrevention: 90,
      satisfaction: 80,
      overall: 82,
    };
  }

  private static ensureAccessibility(
    visualEncoding: MultiDimensionalEncoding,
    aestheticProfile: AestheticProfile,
  ): AccessibilityCompliance {
    return {
      wcagLevel: 'AA',
      colorBlindnessSupport: {
        protanopia: 85,
        deuteranopia: 85,
        tritanopia: 90,
        achromatopsia: 80,
        alternativeEncodings: ['pattern', 'texture', 'shape'],
      },
      contrastCompliance: {
        minimumContrast: 4.5,
        enhancedContrast: 7.0,
        graphicalObjectContrast: 3.0,
        complianceLevel: 'AA',
      },
      motorImpairmentSupport: {
        minimumTargetSize: 44,
        spacing: 8,
        dragAlternatives: ['click', 'keyboard'],
        keyboardNavigation: true,
      },
      cognitiveSupport: {
        complexityReduction: ['clear labeling', 'consistent patterns'],
        memoryAids: ['persistent legends', 'contextual help'],
        consistentPatterns: ['uniform interactions', 'predictable behavior'],
        errorPrevention: ['input validation', 'clear feedback'],
      },
      screenReaderCompatibility: {
        ariaCompliance: true,
        textAlternatives: true,
        structuralMarkup: true,
        focusManagement: true,
      },
      complianceScore: 85,
    };
  }

  private static adaptForCulture(culture: string): CulturalAdaptation {
    return {
      readingDirection: 'ltr',
      colorCulturalMeaning: [],
      symbolismAdaptation: [],
      numeralSystem: 'western',
      dateFormat: 'ISO',
      localizations: [],
    };
  }

  private static applyCompositionPrinciples(
    chartType: string,
    visualEncoding: MultiDimensionalEncoding,
  ): CompositionPrinciple[] {
    return [
      {
        principle: 'Visual Hierarchy',
        application: 'Primary data elements use stronger visual weight',
        strength: 85,
        visualImpact: 'Guides user attention to most important information',
        reasoning: 'Establishes clear information priority',
      },
    ];
  }

  private static assessVisualQuality(
    visualEncoding: MultiDimensionalEncoding,
    aestheticProfile: AestheticProfile,
    perceptualOptimization: PerceptualOptimization,
    accessibilityCompliance: AccessibilityCompliance,
  ): VisualQualityMetrics {
    const aestheticScore = aestheticProfile.styleConsistency.consistencyScore;
    const functionalScore = visualEncoding.encodingEfficiency;
    const accessibilityScore = accessibilityCompliance.complianceScore;
    const usabilityScore = perceptualOptimization.usabilityMetrics.overall;

    // Calculate originality score based on encoding innovation and visual uniqueness
    const originalityScore = this.calculateOriginalityScore(visualEncoding, aestheticProfile);

    const overallQuality =
      (aestheticScore + functionalScore + accessibilityScore + usabilityScore + originalityScore) /
      5;

    // Identify improvement areas based on scores
    const improvementAreas = this.identifyImprovementAreas({
      aestheticScore,
      functionalScore,
      accessibilityScore,
      usabilityScore,
      originalityScore,
    });

    return {
      aestheticScore,
      functionalScore,
      accessibilityScore,
      usabilityScore,
      originalityScore,
      overallQuality,
      improvementAreas,
    };
  }

  // Helper methods for enhanced implementations

  private static generateVisualFlow(
    dimensions: EncodingDimension[],
    chartType: string,
  ): FlowDirection[] {
    const flow: FlowDirection[] = [];

    if (dimensions.length < 2) return flow;

    // Create flow based on encoding strength
    for (let i = 0; i < dimensions.length - 1; i++) {
      const strengthDiff = dimensions[i].encodingStrength - dimensions[i + 1].encodingStrength;
      if (strengthDiff > 0.2) {
        flow.push({
          from: dimensions[i].dataField,
          to: dimensions[i + 1].dataField,
          strength: Math.min(100, strengthDiff * 100),
          technique: this.selectFlowTechnique(dimensions[i], dimensions[i + 1]),
        });
      }
    }

    return flow;
  }

  private static selectFlowTechnique(
    from: EncodingDimension,
    to: EncodingDimension,
  ): 'color_gradient' | 'size_progression' | 'position_flow' | 'line_connection' {
    if (from.channel.includes('color') || to.channel.includes('color')) {
      return 'color_gradient';
    } else if (from.channel.includes('size') || to.channel.includes('size')) {
      return 'size_progression';
    } else if (from.channel.includes('position') || to.channel.includes('position')) {
      return 'position_flow';
    } else {
      return 'line_connection';
    }
  }

  private static analyzeDataSentiment(
    dataCharacteristics: any,
  ): 'positive' | 'negative' | 'neutral' {
    const fields = dataCharacteristics.fields || [];
    let positiveCount = 0;
    let negativeCount = 0;

    fields.forEach((field: any) => {
      const name = field.name?.toLowerCase() || '';
      if (
        name.includes('positive') ||
        name.includes('success') ||
        name.includes('good') ||
        name.includes('profit') ||
        name.includes('growth') ||
        name.includes('improvement')
      ) {
        positiveCount++;
      } else if (
        name.includes('negative') ||
        name.includes('error') ||
        name.includes('bad') ||
        name.includes('loss') ||
        name.includes('decline') ||
        name.includes('problem')
      ) {
        negativeCount++;
      }
    });

    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  private static calculateDataComplexity(dataCharacteristics: any): number {
    const fieldCount = dataCharacteristics.fields?.length || 0;
    const recordCount = dataCharacteristics.recordCount || 0;
    const categoricalFields = dataCharacteristics.categoricalColumns || 0;
    const numericalFields = dataCharacteristics.numericalColumns || 0;

    // Normalize complexity factors
    const fieldComplexity = Math.min(1, fieldCount / 20);
    const recordComplexity = Math.min(1, recordCount / 10000);
    const typeComplexity = Math.min(1, (categoricalFields + numericalFields) / 15);

    return (fieldComplexity + recordComplexity + typeComplexity) / 3;
  }

  private static hexToHSL(hex: string): HSLColor {
    // Remove # if present
    hex = hex.replace('#', '');

    // Parse RGB values
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const diff = max - min;

    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (diff !== 0) {
      s = l > 0.5 ? diff / (2 - max - min) : diff / (max + min);

      switch (max) {
        case r:
          h = (g - b) / diff + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / diff + 2;
          break;
        case b:
          h = (r - g) / diff + 4;
          break;
      }
      h /= 6;
    }

    return {
      hue: Math.round(h * 360),
      saturation: Math.round(s * 100),
      lightness: Math.round(l * 100),
    };
  }

  private static calculateHueSpread(hues: number[]): number {
    if (hues.length < 2) return 0;

    // Sort hues and calculate maximum spread
    const sortedHues = [...hues].sort((a, b) => a - b);
    let maxSpread = 0;

    for (let i = 0; i < sortedHues.length - 1; i++) {
      const spread = sortedHues[i + 1] - sortedHues[i];
      maxSpread = Math.max(maxSpread, spread);
    }

    // Check wrap-around spread
    const wrapSpread = 360 - sortedHues[sortedHues.length - 1] + sortedHues[0];
    maxSpread = Math.max(maxSpread, wrapSpread);

    return maxSpread;
  }

  private static evaluateColorTheoryCompliance(hues: number[], harmonyType: string): number {
    if (hues.length < 2) return 0;

    switch (harmonyType) {
      case 'analogous':
        return this.checkAnalogousCompliance(hues);
      case 'complementary':
        return this.checkComplementaryCompliance(hues);
      case 'triadic':
        return this.checkTriadicCompliance(hues);
      case 'tetradic':
        return this.checkTetradicCompliance(hues);
      case 'monochromatic':
        return this.checkMonochromaticCompliance(hues);
      default:
        return 15; // Base score for unknown types
    }
  }

  private static checkAnalogousCompliance(hues: number[]): number {
    // Analogous colors should be within 30-60 degrees of each other
    let totalCompliance = 0;
    let comparisons = 0;

    for (let i = 0; i < hues.length - 1; i++) {
      for (let j = i + 1; j < hues.length; j++) {
        const diff = Math.abs(hues[i] - hues[j]);
        const circularDiff = Math.min(diff, 360 - diff);

        if (circularDiff >= 15 && circularDiff <= 60) {
          totalCompliance += 25;
        } else if (circularDiff <= 90) {
          totalCompliance += 15;
        } else {
          totalCompliance += 5;
        }
        comparisons++;
      }
    }

    return comparisons > 0 ? totalCompliance / comparisons : 0;
  }

  private static checkComplementaryCompliance(hues: number[]): number {
    // Look for hues approximately 180 degrees apart
    for (let i = 0; i < hues.length - 1; i++) {
      for (let j = i + 1; j < hues.length; j++) {
        const diff = Math.abs(hues[i] - hues[j]);
        const circularDiff = Math.min(diff, 360 - diff);

        if (Math.abs(circularDiff - 180) <= 30) {
          return 25; // Perfect complementary
        }
      }
    }
    return 10; // No complementary found
  }

  private static checkTriadicCompliance(hues: number[]): number {
    if (hues.length < 3) return 0;

    // Check if any three hues form a triadic relationship (120 degrees apart)
    for (let i = 0; i < hues.length - 2; i++) {
      for (let j = i + 1; j < hues.length - 1; j++) {
        for (let k = j + 1; k < hues.length; k++) {
          const sorted = [hues[i], hues[j], hues[k]].sort((a, b) => a - b);
          const diff1 = sorted[1] - sorted[0];
          const diff2 = sorted[2] - sorted[1];
          const diff3 = 360 - sorted[2] + sorted[0];

          if (
            Math.abs(diff1 - 120) <= 30 &&
            Math.abs(diff2 - 120) <= 30 &&
            Math.abs(diff3 - 120) <= 30
          ) {
            return 25;
          }
        }
      }
    }
    return 8;
  }

  private static checkTetradicCompliance(hues: number[]): number {
    if (hues.length < 4) return 0;
    // Simplified: check if hues are reasonably distributed
    const averageSpacing = 360 / hues.length;
    const idealSpacing = 90; // For tetradic

    if (Math.abs(averageSpacing - idealSpacing) <= 30) {
      return 25;
    }
    return 12;
  }

  private static checkMonochromaticCompliance(hues: number[]): number {
    // All hues should be very similar
    const hueRange = Math.max(...hues) - Math.min(...hues);
    if (hueRange <= 15) return 25;
    if (hueRange <= 30) return 18;
    if (hueRange <= 45) return 10;
    return 5;
  }

  private static calculateAccessibilityBonus(harmony: HSLColor[]): number {
    let bonus = 0;

    // Check contrast potential
    const lightnesses = harmony.map((c) => c.lightness);
    const lightnessRange = Math.max(...lightnesses) - Math.min(...lightnesses);

    if (lightnessRange >= 50) bonus += 5; // Good contrast potential
    if (lightnessRange >= 70) bonus += 3; // Excellent contrast potential

    // Check color-blind friendliness (avoid red-green combinations with similar lightness)
    const hasProblematicRedGreen = this.checkRedGreenProblems(harmony);
    if (!hasProblematicRedGreen) bonus += 2;

    return Math.min(10, bonus);
  }

  private static checkRedGreenProblems(harmony: HSLColor[]): boolean {
    for (let i = 0; i < harmony.length - 1; i++) {
      for (let j = i + 1; j < harmony.length; j++) {
        const color1 = harmony[i];
        const color2 = harmony[j];

        // Check if one is red-ish and one is green-ish with similar lightness
        const isRed1 = color1.hue >= 330 || color1.hue <= 30;
        const isGreen1 = color1.hue >= 90 && color1.hue <= 150;
        const isRed2 = color2.hue >= 330 || color2.hue <= 30;
        const isGreen2 = color2.hue >= 90 && color2.hue <= 150;

        if ((isRed1 && isGreen2) || (isGreen1 && isRed2)) {
          const lightnessDiff = Math.abs(color1.lightness - color2.lightness);
          if (lightnessDiff < 20) {
            return true; // Problematic combination
          }
        }
      }
    }
    return false;
  }

  private static calculateCulturalBonus(harmony: HSLColor[]): number {
    // Simplified cultural appropriateness check
    // Avoid culturally sensitive color combinations
    let bonus = 5; // Base cultural bonus

    // Check for balance - avoid overly aggressive colors
    const highSaturationCount = harmony.filter((c) => c.saturation > 85).length;
    if (highSaturationCount / harmony.length < 0.5) {
      bonus += 2; // Moderate saturation is generally more culturally appropriate
    }

    return Math.min(5, bonus);
  }

  private static calculateOriginalityScore(
    visualEncoding: MultiDimensionalEncoding,
    aestheticProfile: AestheticProfile,
  ): number {
    let originalityScore = 50; // Base score

    // Reward innovative encoding combinations
    const uniqueChannels = new Set(
      visualEncoding.primaryDimensions
        .concat(visualEncoding.secondaryDimensions)
        .map((d) => d.channel),
    ).size;

    if (uniqueChannels >= 4) originalityScore += 20; // Diverse channel usage
    if (uniqueChannels >= 6) originalityScore += 10; // Very diverse

    // Reward effective use of redundant encodings
    if (visualEncoding.redundantEncodings.length > 0) {
      const avgEffectiveness =
        visualEncoding.redundantEncodings.reduce((sum, enc) => sum + enc.effectiveness, 0) /
        visualEncoding.redundantEncodings.length;
      originalityScore += Math.min(15, (avgEffectiveness / 100) * 15);
    }

    // Reward sophisticated hierarchy
    const hierarchyComplexity = visualEncoding.hierarchicalStructure.levels.length;
    if (hierarchyComplexity >= 3) originalityScore += 10;

    // Penalize overly complex solutions
    if (visualEncoding.cognitiveLoad > 80) originalityScore -= 20;
    if (visualEncoding.cognitiveLoad > 90) originalityScore -= 10;

    // Reward high information density without complexity
    if (visualEncoding.informationDensity > 70 && visualEncoding.cognitiveLoad < 60) {
      originalityScore += 15;
    }

    return Math.max(0, Math.min(100, originalityScore));
  }

  private static identifyImprovementAreas(scores: {
    aestheticScore: number;
    functionalScore: number;
    accessibilityScore: number;
    usabilityScore: number;
    originalityScore: number;
  }): ImprovementArea[] {
    const areas: ImprovementArea[] = [];
    const threshold = 75; // Scores below this need improvement

    if (scores.aestheticScore < threshold) {
      areas.push({
        area: 'Aesthetic Design',
        currentScore: scores.aestheticScore,
        potentialScore: Math.min(95, scores.aestheticScore + 20),
        recommendations: [
          'Improve color harmony and consistency',
          'Enhance visual balance and proportion',
          'Refine typography system',
        ],
        priority:
          scores.aestheticScore < 50 ? 'critical' : scores.aestheticScore < 65 ? 'high' : 'medium',
      });
    }

    if (scores.functionalScore < threshold) {
      areas.push({
        area: 'Functional Efficiency',
        currentScore: scores.functionalScore,
        potentialScore: Math.min(95, scores.functionalScore + 15),
        recommendations: [
          'Optimize encoding channel assignment',
          'Reduce cognitive load while maintaining information density',
          'Improve data-to-visualization mapping',
        ],
        priority: scores.functionalScore < 50 ? 'critical' : 'high',
      });
    }

    if (scores.accessibilityScore < threshold) {
      areas.push({
        area: 'Accessibility Compliance',
        currentScore: scores.accessibilityScore,
        potentialScore: Math.min(98, scores.accessibilityScore + 23),
        recommendations: [
          'Enhance color contrast and alternative encodings',
          'Improve screen reader compatibility',
          'Add motor impairment support features',
        ],
        priority: scores.accessibilityScore < 60 ? 'critical' : 'high',
      });
    }

    if (scores.usabilityScore < threshold) {
      areas.push({
        area: 'User Experience',
        currentScore: scores.usabilityScore,
        potentialScore: Math.min(92, scores.usabilityScore + 17),
        recommendations: [
          'Simplify interaction patterns',
          'Improve learnability and memorability',
          'Enhance user satisfaction through better feedback',
        ],
        priority: scores.usabilityScore < 55 ? 'critical' : 'high',
      });
    }

    if (scores.originalityScore < threshold) {
      areas.push({
        area: 'Visual Innovation',
        currentScore: scores.originalityScore,
        potentialScore: Math.min(90, scores.originalityScore + 15),
        recommendations: [
          'Explore innovative encoding combinations',
          'Balance complexity with clarity',
          'Implement sophisticated visual hierarchies',
        ],
        priority: 'medium',
      });
    }

    return areas;
  }
}
