/**
 * Section 4: Visualization Intelligence Types
 * Comprehensive type definitions for intelligent chart recommendations
 */

// ===== CORE ENUMS =====

export enum ChartType {
  // Univariate Numerical
  HISTOGRAM = 'histogram',
  BOX_PLOT = 'box_plot',
  VIOLIN_PLOT = 'violin_plot',
  VIOLIN_WITH_BOX = 'violin_with_box', // Enhanced violin plot with embedded box plot
  DENSITY_PLOT = 'density_plot',
  DOT_PLOT = 'dot_plot',
  Q_Q_PLOT = 'q_q_plot',

  // Univariate Categorical
  BAR_CHART = 'bar_chart',
  HORIZONTAL_BAR = 'horizontal_bar',
  PIE_CHART = 'pie_chart',
  DONUT_CHART = 'donut_chart',
  WAFFLE_CHART = 'waffle_chart',
  TREEMAP = 'treemap',
  SUNBURST = 'sunburst',
  LOLLIPOP_CHART = 'lollipop_chart',

  // Bivariate Numerical vs Numerical
  SCATTER_PLOT = 'scatter_plot',
  LINE_CHART = 'line_chart',
  BUBBLE_CHART = 'bubble_chart',
  REGRESSION_PLOT = 'regression_plot',
  RESIDUAL_PLOT = 'residual_plot',
  HEX_BIN = 'hex_bin',
  CONTOUR_PLOT = 'contour_plot',

  // Bivariate Numerical vs Categorical
  GROUPED_BAR = 'grouped_bar',
  STACKED_BAR = 'stacked_bar',
  BOX_PLOT_BY_GROUP = 'box_plot_by_group',
  VIOLIN_BY_GROUP = 'violin_by_group',
  STRIP_CHART = 'strip_chart',
  SWARM_PLOT = 'swarm_plot',

  // Bivariate Categorical vs Categorical
  STACKED_BAR_CATEGORICAL = 'stacked_bar_categorical',
  GROUPED_BAR_CATEGORICAL = 'grouped_bar_categorical',
  HEATMAP = 'heatmap',
  MOSAIC_PLOT = 'mosaic_plot',
  ALLUVIAL_DIAGRAM = 'alluvial_diagram',
  CHORD_DIAGRAM = 'chord_diagram',

  // Time Series
  TIME_SERIES_LINE = 'time_series_line',
  TIME_SERIES_AREA = 'time_series_area',
  CALENDAR_HEATMAP = 'calendar_heatmap',
  SEASONAL_PLOT = 'seasonal_plot',
  LAG_PLOT = 'lag_plot',
  GANTT_CHART = 'gantt_chart',

  // Multivariate
  PARALLEL_COORDINATES = 'parallel_coordinates',
  RADAR_CHART = 'radar_chart',
  CORRELATION_MATRIX = 'correlation_matrix',
  SCATTERPLOT_MATRIX = 'scatterplot_matrix',
  PCA_BIPLOT = 'pca_biplot',
  ANDREWS_PLOT = 'andrews_plot',

  // Advanced Statistical
  VIOLIN_MATRIX = 'violin_matrix',
  MARGINAL_PLOT = 'marginal_plot',
  PAIR_PLOT = 'pair_plot',
  FACET_GRID = 'facet_grid',

  // Specialized
  GEOGRAPHIC_MAP = 'geographic_map',
  CHOROPLETH_MAP = 'choropleth_map',
  NETWORK_DIAGRAM = 'network_diagram',
  SANKEY_DIAGRAM = 'sankey_diagram',
  FUNNEL_CHART = 'funnel_chart',
  GAUGE_CHART = 'gauge_chart',
  WORD_CLOUD = 'word_cloud',
  DASHBOARD_GRID = 'dashboard_grid',
}

export enum ChartPurpose {
  DISTRIBUTION = 'distribution',
  COMPARISON = 'comparison',
  RELATIONSHIP = 'relationship',
  COMPOSITION = 'composition',
  TREND = 'trend',
  RANKING = 'ranking',
  OUTLIER_DETECTION = 'outlier_detection',
  PATTERN_RECOGNITION = 'pattern_recognition',
}

export enum RecommendationPriority {
  PRIMARY = 'primary',
  SECONDARY = 'secondary',
  ALTERNATIVE = 'alternative',
  NOT_RECOMMENDED = 'not_recommended',
}

export enum AccessibilityLevel {
  EXCELLENT = 'excellent',
  GOOD = 'good',
  ADEQUATE = 'adequate',
  POOR = 'poor',
  INACCESSIBLE = 'inaccessible',
}

export enum ComplexityLevel {
  SIMPLE = 'simple',
  MODERATE = 'moderate',
  COMPLEX = 'complex',
  ADVANCED = 'advanced',
}

export enum DataSize {
  SMALL = 'small', // < 1K points
  MEDIUM = 'medium', // 1K - 100K points
  LARGE = 'large', // 100K - 1M points
  VERY_LARGE = 'very_large', // > 1M points
}

// ===== CORE INTERFACES =====

export interface ChartRecommendation {
  chartType: ChartType;
  purpose: ChartPurpose;
  priority: RecommendationPriority;
  confidence: number; // 0-1 scale
  reasoning: string;

  // Technical specifications
  encoding: VisualEncoding;
  interactivity: InteractivityOptions;
  accessibility: AccessibilityGuidance;
  performance: PerformanceConsiderations;

  // Implementation guidance
  libraryRecommendations: LibraryRecommendation[];
  codeExample?: string;
  dataPreparation: DataPreparationSteps;
  designGuidelines: DesignGuidelines;
}

export interface VisualEncoding {
  xAxis?: AxisConfiguration;
  yAxis?: AxisConfiguration;
  color?: ColorEncoding;
  size?: SizeEncoding;
  shape?: ShapeEncoding;
  opacity?: OpacityEncoding;

  // Layout
  layout: LayoutConfiguration;
  legend?: LegendConfiguration;
  annotations?: AnnotationConfiguration[];
}

export interface AxisConfiguration {
  variable: string;
  scale: 'linear' | 'log' | 'sqrt' | 'ordinal' | 'time' | 'band';
  domain?: [number, number] | string[];
  ticks?: TickConfiguration;
  label: string;
  labelRotation?: number;
  gridLines: boolean;
  zeroLine: boolean;
}

export interface ColorEncoding {
  variable?: string;
  scheme: ColorScheme;
  accessibility: ColorAccessibility;
  semanticMapping?: Record<string, string>;
}

export interface ColorScheme {
  type: 'categorical' | 'sequential' | 'diverging' | 'single';
  palette: string[];
  darkModeAlternative?: string[];
  printSafe: boolean;
  colorBlindSafe: boolean;
}

export interface ColorAccessibility {
  contrastRatio: number;
  alternativeEncoding: 'pattern' | 'texture' | 'shape' | 'size';
  wcagLevel: 'A' | 'AA' | 'AAA';
  colorBlindSupport: boolean;
  colorBlindSafe?: {
    protanopia: boolean;
    deuteranopia: boolean;
    tritanopia: boolean;
    severity: 'safe' | 'caution' | 'problematic';
  };
  contrastRatios?: ContrastRatio[];
  alternativeEncodings?: string[];
}

export interface SizeEncoding {
  variable?: string;
  range: [number, number];
  scaling: 'linear' | 'sqrt' | 'area';
}

export interface ShapeEncoding {
  variable?: string;
  shapes: string[];
  semanticMapping?: Record<string, string>;
}

export interface OpacityEncoding {
  variable?: string;
  range: [number, number];
  purpose: 'emphasis' | 'layering' | 'uncertainty';
}

export interface LayoutConfiguration {
  width: number | 'responsive';
  height: number | 'responsive';
  aspectRatio?: number;
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  spacing?: {
    between?: number;
    padding?: number;
  };
}

export interface LegendConfiguration {
  position: 'top' | 'bottom' | 'left' | 'right' | 'none';
  orientation: 'horizontal' | 'vertical';
  title: string;
  interactive: boolean;
}

export interface AnnotationConfiguration {
  type: 'text' | 'line' | 'rectangle' | 'circle' | 'arrow';
  content: string;
  position: { x: number; y: number };
  styling: Record<string, any>;
  purpose: string;
}

export interface TickConfiguration {
  count?: number;
  values?: (number | string)[];
  format?: string;
  rotation?: number;
}

export interface InteractivityOptions {
  level: 'none' | 'basic' | 'moderate' | 'advanced';
  interactions: InteractionType[];
  responsiveness: ResponsivenessLevel;
  keyboard: KeyboardSupport;
  screenReader: ScreenReaderSupport;
}

export enum InteractionType {
  HOVER = 'hover',
  CLICK = 'click',
  BRUSH = 'brush',
  ZOOM = 'zoom',
  PAN = 'pan',
  FILTER = 'filter',
  SORT = 'sort',
  HIGHLIGHT = 'highlight',
  DRILL_DOWN = 'drill_down',
  TOOLTIP = 'tooltip',
}

export enum ResponsivenessLevel {
  STATIC = 'static',
  RESPONSIVE = 'responsive',
  ADAPTIVE = 'adaptive',
}

export interface KeyboardSupport {
  navigation: boolean;
  shortcuts: Record<string, string>;
  focusManagement: boolean;
}

export interface ScreenReaderSupport {
  ariaLabels: Record<string, string>;
  alternativeText: string;
  dataTable: boolean;
  sonification?: boolean;
}

export interface AccessibilityGuidance {
  level: AccessibilityLevel;
  wcagCompliance: 'A' | 'AA' | 'AAA';
  colorBlindness: ColorBlindnessSupport;
  motorImpairment: MotorImpairmentSupport;
  cognitiveAccessibility: CognitiveAccessibilitySupport;
  recommendations: string[];
}

export interface ColorBlindnessSupport {
  protanopia: boolean;
  deuteranopia: boolean;
  tritanopia: boolean;
  monochromacy: boolean;
  alternativeEncodings: string[];
}

export interface MotorImpairmentSupport {
  largeClickTargets: boolean;
  keyboardOnly: boolean;
  customControls: boolean;
  timeoutExtensions: boolean;
}

export interface CognitiveAccessibilitySupport {
  simplicityLevel: ComplexityLevel;
  progressiveDisclosure: boolean;
  errorPrevention: string[];
  cognitiveLoad: 'low' | 'moderate' | 'high';
}

export interface PerformanceConsiderations {
  dataSize: DataSize;
  renderingStrategy: 'svg' | 'canvas' | 'webgl' | 'hybrid';
  optimizations: PerformanceOptimization[];
  loadingStrategy: LoadingStrategy;
  memoryUsage: MemoryUsage;
}

export interface PerformanceOptimization {
  type: 'sampling' | 'aggregation' | 'virtualization' | 'caching' | 'lazy_loading';
  description: string;
  implementation: string;
  impact: 'low' | 'medium' | 'high';
}

export interface LoadingStrategy {
  progressive: boolean;
  chunking: boolean;
  placeholders: boolean;
  feedback: boolean;
}

export interface MemoryUsage {
  estimated: string;
  peak: string;
  recommendations: string[];
}

export interface LibraryRecommendation {
  name: string;
  type: 'javascript' | 'python' | 'r' | 'tableau' | 'powerbi' | 'other';
  pros: string[];
  cons: string[];
  useCases: string[];
  complexity: ComplexityLevel;
  documentation: string;
  communitySupport: 'excellent' | 'good' | 'moderate' | 'limited';
}

export interface DataPreparationSteps {
  required: DataTransformation[];
  optional: DataTransformation[];
  qualityChecks: QualityCheck[];
  aggregations: AggregationStep[];
}

export interface DataTransformation {
  step: string;
  description: string;
  code?: string;
  importance: 'critical' | 'recommended' | 'optional';
}

export interface QualityCheck {
  check: string;
  description: string;
  remediation: string;
}

export interface AggregationStep {
  operation: 'sum' | 'mean' | 'median' | 'count' | 'min' | 'max' | 'percentile';
  groupBy?: string[];
  variable: string;
  purpose: string;
}

export interface DesignGuidelines {
  principles: DesignPrinciple[];
  typography: TypographyGuidelines;
  spacing: SpacingGuidelines;
  branding: BrandingConsiderations;
  context: ContextualGuidelines;
}

export interface DesignPrinciple {
  principle: string;
  description: string;
  application: string;
}

export interface TypographyGuidelines {
  fontFamily: string[];
  fontSize: {
    title: number;
    subtitle: number;
    axis: number;
    legend: number;
    annotation: number;
  };
  fontWeight: Record<string, number>;
  lineHeight: number;
}

export interface SpacingGuidelines {
  unit: number;
  hierarchy: Record<string, number>;
  consistency: string[];
}

export interface BrandingConsiderations {
  colorAlignment: boolean;
  styleConsistency: string[];
  logoPlacement?: string;
}

export interface ContextualGuidelines {
  audience: string;
  purpose: string;
  medium: 'web' | 'print' | 'presentation' | 'mobile' | 'dashboard';
  constraints: string[];
}

// ===== ANALYSIS INTERFACES =====

export interface ColumnVisualizationProfile {
  columnName: string;
  dataType: string;
  semanticType: string;
  cardinality: number;
  uniqueness: number;
  completeness: number;

  // Statistical characteristics
  distribution?: DistributionCharacteristics;
  patterns?: PatternCharacteristics;
  relationships?: RelationshipCharacteristics;

  // Visualization recommendations
  recommendations: ChartRecommendation[];
  warnings: VisualizationWarning[];
}

export interface DistributionCharacteristics {
  shape:
    | 'normal'
    | 'skewed_left'
    | 'skewed_right'
    | 'bimodal'
    | 'uniform'
    | 'exponential'
    | 'unknown';
  skewness: number;
  kurtosis: number;
  outliers: OutlierInfo;
  modality: 'unimodal' | 'bimodal' | 'multimodal';
}

export interface OutlierInfo {
  count: number;
  percentage: number;
  extreme: boolean;
  impact: 'low' | 'medium' | 'high';
}

export interface PatternCharacteristics {
  trend?: 'increasing' | 'decreasing' | 'stable' | 'cyclical';
  seasonality?: boolean;
  periodicity?: number;
  autocorrelation?: number;
}

export interface RelationshipCharacteristics {
  correlations: CorrelationInfo[];
  associations: AssociationInfo[];
  interactions: InteractionInfo[];
}

export interface CorrelationInfo {
  variable: string;
  correlation: number;
  strength: 'weak' | 'moderate' | 'strong' | 'very_strong';
  significance: number;
}

export interface AssociationInfo {
  variable: string;
  associationType: 'chi_squared' | 'cramers_v' | 'mutual_information';
  strength: number;
  significance: number;
}

export interface InteractionInfo {
  variables: string[];
  interactionType: 'multiplicative' | 'additive' | 'non_linear';
  strength: number;
}

export interface VisualizationWarning {
  type: 'performance' | 'accessibility' | 'interpretation' | 'data_quality';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  recommendation: string;
  impact: string;
}

export interface BivariateVisualizationProfile {
  variable1: string;
  variable2: string;
  relationshipType:
    | 'numerical_numerical'
    | 'numerical_categorical'
    | 'categorical_categorical'
    | 'temporal_numerical'
    | 'temporal_categorical';
  strength: number;
  significance: number;
  recommendations: ChartRecommendation[];
  dataPreparation: DataPreparationSteps;
}

export interface DashboardRecommendation {
  layout: DashboardLayout;
  chartCombinations: ChartCombination[];
  navigation: NavigationStrategy;
  filtering: FilteringStrategy;
  responsiveness: ResponsivenessStrategy;
  accessibility: DashboardAccessibility;
}

export interface DashboardLayout {
  structure: 'grid' | 'flow' | 'hierarchical' | 'tabs';
  dimensions: { rows: number; columns: number };
  priorities: ChartPriority[];
  spacing: SpacingConfiguration;
}

export interface ChartCombination {
  charts: ChartType[];
  purpose: string;
  interaction: InteractionType[];
  placement: PlacementStrategy;
}

export interface ChartPriority {
  chartId: string;
  priority: number;
  visibility: 'always' | 'on_demand' | 'contextual';
}

export interface SpacingConfiguration {
  gutters: number;
  margins: number;
  padding: number;
}

export interface PlacementStrategy {
  position: 'primary' | 'secondary' | 'supporting' | 'detail';
  size: 'small' | 'medium' | 'large' | 'full_width';
  responsive: boolean;
}

export interface NavigationStrategy {
  type: 'tabs' | 'sidebar' | 'breadcrumb' | 'drill_down' | 'modal';
  depth: number;
  persistence: boolean;
}

export interface FilteringStrategy {
  global: boolean;
  local: boolean;
  types: FilterType[];
  interface: FilterInterface;
}

export enum FilterType {
  RANGE = 'range',
  CATEGORICAL = 'categorical',
  DATE_RANGE = 'date_range',
  TEXT_SEARCH = 'text_search',
  MULTI_SELECT = 'multi_select',
}

export interface FilterInterface {
  placement: 'top' | 'sidebar' | 'inline' | 'modal';
  style: 'dropdown' | 'slider' | 'checkbox' | 'radio' | 'input';
  advanced: boolean;
}

export interface ResponsivenessStrategy {
  breakpoints: Record<string, number>;
  adaptations: ResponsiveAdaptation[];
  priority: ChartPriority[];
}

export interface ResponsiveAdaptation {
  breakpoint: string;
  changes: AdaptationChange[];
}

export interface AdaptationChange {
  target: string;
  property: string;
  value: any;
  reason: string;
}

export interface DashboardAccessibility {
  navigation: AccessibleNavigation;
  content: AccessibleContent;
  interaction: AccessibleInteraction;
  assistive: AssistiveTechnology;
}

export interface AccessibleNavigation {
  skipLinks: boolean;
  landmarks: boolean;
  breadcrumbs: boolean;
  keyboardOnly: boolean;
}

export interface AccessibleContent {
  headingStructure: boolean;
  alternativeText: boolean;
  dataTable: boolean;
  captions: boolean;
}

export interface AccessibleInteraction {
  focusManagement: boolean;
  feedback: boolean;
  timeouts: boolean;
  errorHandling: boolean;
}

export interface AssistiveTechnology {
  screenReader: boolean;
  voiceControl: boolean;
  eyeTracking: boolean;
  switchControl: boolean;
}

// ===== MAIN SECTION 4 RESULT =====

export interface Section4Result {
  visualizationAnalysis: VisualizationAnalysis;
  warnings: VisualizationWarning[];
  performanceMetrics?: {
    analysisTimeMs: number;
    recommendationsGenerated: number;
    chartTypesConsidered: number;
    accessibilityChecks: number;
  };
  metadata?: {
    analysisApproach: string;
    totalColumns: number;
    bivariateRelationships: number;
    recommendationConfidence: number;
  };
}

export interface VisualizationAnalysis {
  strategy: VisualizationStrategy;
  univariateRecommendations: ColumnVisualizationProfile[];
  bivariateRecommendations: BivariateVisualizationProfile[];
  multivariateRecommendations: MultivariateRecommendation[];
  dashboardRecommendations: DashboardRecommendation;
  technicalGuidance: TechnicalGuidance;
  accessibilityAssessment: AccessibilityAssessment;
}

export interface VisualizationStrategy {
  approach: string;
  primaryObjectives: string[];
  targetAudience: string;
  complexity: ComplexityLevel;
  interactivity: InteractivityLevel;
  accessibility: AccessibilityLevel;
  performance: PerformanceLevel;
}

export enum InteractivityLevel {
  STATIC = 'static',
  BASIC = 'basic',
  INTERACTIVE = 'interactive',
  HIGHLY_INTERACTIVE = 'highly_interactive',
}

export enum PerformanceLevel {
  FAST = 'fast',
  MODERATE = 'moderate',
  INTENSIVE = 'intensive',
}

export interface MultivariateRecommendation {
  variables: string[];
  purpose: string;
  chartType: ChartType;
  complexity: ComplexityLevel;
  prerequisites: string[];
  implementation: string;
  alternatives: ChartType[];
}

export interface TechnicalGuidance {
  libraryComparison: LibraryComparison[];
  implementationPatterns: ImplementationPattern[];
  performanceOptimizations: PerformanceOptimization[];
  deploymentConsiderations: DeploymentConsideration[];
}

export interface LibraryComparison {
  category: string;
  libraries: LibraryRecommendation[];
  winner: string;
  reasoning: string;
}

export interface ImplementationPattern {
  pattern: string;
  useCase: string;
  code: string;
  explanation: string;
}

export interface DeploymentConsideration {
  factor: string;
  importance: 'critical' | 'important' | 'nice_to_have';
  recommendation: string;
  implementation: string;
}

export interface AccessibilityAssessment {
  overallLevel: AccessibilityLevel;
  compliance: WCAGCompliance;
  improvements: AccessibilityImprovement[];
  testing: AccessibilityTesting;
}

export interface WCAGCompliance {
  level: 'A' | 'AA' | 'AAA';
  criteria: WCAGCriterion[];
  gaps: ComplianceGap[];
}

export interface WCAGCriterion {
  id: string;
  level: 'A' | 'AA' | 'AAA';
  status: 'pass' | 'fail' | 'not_applicable';
  description: string;
}

export interface ComplianceGap {
  criterion: string;
  issue: string;
  solution: string;
  priority: 'high' | 'medium' | 'low';
}

export interface AccessibilityImprovement {
  area: string;
  current: string;
  target: string;
  steps: string[];
  impact: 'high' | 'medium' | 'low';
}

export interface AccessibilityTesting {
  automated: AutomatedTesting;
  manual: ManualTesting;
  userTesting: UserTesting;
}

export interface AutomatedTesting {
  tools: string[];
  frequency: string;
  coverage: number;
}

export interface ManualTesting {
  procedures: string[];
  frequency: string;
  checklist: string[];
}

export interface UserTesting {
  groups: string[];
  scenarios: string[];
  frequency: string;
}

// Additional WCAG interfaces for comprehensive testing
export interface WCAGGuideline {
  id: string;
  level: 'A' | 'AA' | 'AAA';
  compliance: 'pass' | 'fail' | 'not_applicable';
  description: string;
  principle: 'perceivable' | 'operable' | 'understandable' | 'robust';
}

export interface AlternativeRepresentation {
  altText: {
    isValid: boolean;
    length: number;
    content: string;
    suggestions: Array<{
      type: 'clarity' | 'completeness' | 'accuracy' | 'length';
      suggestion: string;
      priority: 'high' | 'medium' | 'low';
    }>;
  };
  longDescription: {
    isRequired: boolean;
    isProvided: boolean;
    quality: 'excellent' | 'good' | 'needs_improvement';
    content?: string;
  };
  dataTable: {
    isRequired: boolean;
    isProvided: boolean;
    accessibility: 'full' | 'partial' | 'none';
  };
}

export interface WCAGAssessmentResult {
  overallCompliance: {
    level: 'A' | 'AA' | 'AAA' | 'Non-compliant';
    score: number;
  };
  principles: {
    perceivable: { score: number; issues: string[] };
    operable: { score: number; issues: string[] };
    understandable: { score: number; issues: string[] };
    robust: { score: number; issues: string[] };
  };
  guidelines: WCAGGuideline[];
  violations: Array<{
    guideline: string;
    description: string;
    severity: 'minor' | 'major' | 'critical';
    remediation: {
      steps: string[];
      codeExample: string;
      testingGuidance: string;
    };
  }>;
}

export interface KeyboardAccessibilityAssessment {
  compliance: {
    overall: 'compliant' | 'partial' | 'non_compliant';
    focusManagement: boolean;
    keyboardTraps: boolean;
    logicalOrder: boolean;
  };
  issues: Array<{
    element: string;
    issue: string;
    solution: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  recommendations: string[];
}

export interface ContrastAssessmentResult {
  overall: {
    compliance: 'AA' | 'AAA' | 'fail';
    averageRatio: number;
  };
  combinations: Array<{
    foreground: string;
    background: string;
    ratio: number;
    compliance: 'AA' | 'AAA' | 'fail';
    recommendation?: string;
  }>;
  improvements: Array<{
    current: { foreground: string; background: string };
    suggested: { foreground: string; background: string };
    ratioImprovement: number;
  }>;
}

// ===== CONFIGURATION =====

export interface Section4Config {
  enabledRecommendations: RecommendationType[];
  accessibilityLevel: AccessibilityLevel;
  complexityThreshold: ComplexityLevel;
  performanceThreshold: PerformanceLevel;
  maxRecommendationsPerChart: number;
  includeCodeExamples: boolean;
  targetLibraries: string[];
  customColorSchemes?: ColorScheme[];
}

export enum RecommendationType {
  UNIVARIATE = 'univariate',
  BIVARIATE = 'bivariate',
  MULTIVARIATE = 'multivariate',
  DASHBOARD = 'dashboard',
  ACCESSIBILITY = 'accessibility',
  PERFORMANCE = 'performance',
}

// ===== ANTI-PATTERN DETECTION =====

export enum AntiPatternType {
  PIE_CHART_TOO_MANY_CATEGORIES = 'pie_chart_too_many_categories',
  Y_AXIS_NOT_ZERO = 'y_axis_not_zero',
  CHART_JUNK = 'chart_junk',
  INAPPROPRIATE_CHART_TYPE = 'inappropriate_chart_type',
  MISLEADING_SCALE = 'misleading_scale',
  POOR_COLOR_CHOICE = 'poor_color_choice',
  OVERCOMPLICATED_VISUALIZATION = 'overcomplicated_visualization',
  MISSING_CONTEXT = 'missing_context',
}

export enum AntiPatternSeverity {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  INFO = 'info',
}

export interface AntiPatternDetection {
  type: AntiPatternType;
  severity: AntiPatternSeverity;
  description: string;
  recommendation: string;
  affectedChart: ChartType;
  evidence: string[];
  remediation: RemediationStep[];
}

export interface RemediationStep {
  action: string;
  description: string;
  example?: string;
  priority: 'immediate' | 'soon' | 'eventually';
}

// ===== COLOR SCIENCE & PALETTES =====

export enum ColorPaletteType {
  QUALITATIVE = 'qualitative',
  SEQUENTIAL = 'sequential',
  DIVERGING = 'diverging',
  SINGLE_HUE = 'single_hue',
  CYCLIC = 'cyclic',
}

export interface DetailedColorScheme {
  name: string;
  type: ColorPaletteType;
  colors: string[]; // Hex codes
  usage: ColorUsageGuideline;
  accessibility: ColorAccessibility;
  printSafety: PrintSafety;
  context: ColorContext;
}

export interface ColorUsageGuideline {
  maxCategories: number;
  minCategories: number;
  bestFor: string[];
  avoidFor: string[];
  semanticMeaning?: SemanticColorMapping;
}

export interface SemanticColorMapping {
  positive?: string;
  negative?: string;
  neutral?: string;
  warning?: string;
  success?: string;
  error?: string;
}

export interface ContrastRatio {
  foreground: string;
  background: string;
  ratio: number;
  passes: {
    normalText: boolean;
    largeText: boolean;
    nonText: boolean;
  };
}

export interface PrintSafety {
  grayscaleCompatible: boolean;
  printFriendly: boolean;
  monochromeDistinguishable: boolean;
  recommendedPrintColors: string[];
}

export interface ColorContext {
  cultural: CulturalColorContext[];
  domain: DomainColorContext[];
  emotional: EmotionalColorResponse[];
}

export interface CulturalColorContext {
  region: string;
  meaning: string;
  appropriateness: 'appropriate' | 'neutral' | 'avoid';
}

export interface DomainColorContext {
  domain: string;
  conventions: string[];
  expectations: string[];
}

export interface EmotionalColorResponse {
  emotion: string;
  intensity: 'low' | 'medium' | 'high';
  context: string;
}

// ===== BIVARIATE & CORRELATION ANALYSIS =====

export interface CorrelationAnalysis {
  variable1: string;
  variable2: string;
  correlationType: 'pearson' | 'spearman' | 'kendall' | 'contingency';
  strength: number;
  significance: number;
  confidenceInterval: [number, number];
  relationshipType: RelationshipType;
  visualizationSuitability: number;
}

export enum RelationshipType {
  LINEAR_POSITIVE = 'linear_positive',
  LINEAR_NEGATIVE = 'linear_negative',
  NON_LINEAR = 'non_linear',
  CATEGORICAL_ASSOCIATION = 'categorical_association',
  TEMPORAL_CORRELATION = 'temporal_correlation',
  NO_RELATIONSHIP = 'no_relationship',
}

export interface BivariateRecommendationCriteria {
  dataTypes: [string, string];
  cardinalities: [number, number];
  correlationStrength?: number;
  visualTask: BivariatePurpose;
  complexity: ComplexityLevel;
}

export enum BivariatePurpose {
  EXPLORE_RELATIONSHIP = 'explore_relationship',
  COMPARE_DISTRIBUTIONS = 'compare_distributions',
  SHOW_CORRELATION = 'show_correlation',
  IDENTIFY_CLUSTERS = 'identify_clusters',
  DETECT_OUTLIERS = 'detect_outliers',
  SHOW_COMPOSITION = 'show_composition',
}

// ===== PREDEFINED COLOR PALETTES =====

export const PREDEFINED_PALETTES: Record<string, DetailedColorScheme> = {
  TABLEAU_10: {
    name: 'Tableau 10',
    type: ColorPaletteType.QUALITATIVE,
    colors: [
      '#4E79A7',
      '#F28E2B',
      '#E15759',
      '#76B7B2',
      '#59A14F',
      '#EDC948',
      '#AF7AA1',
      '#FF9D9A',
      '#9C755F',
      '#BAB0AC',
    ],
    usage: {
      maxCategories: 10,
      minCategories: 2,
      bestFor: ['categorical data', 'qualitative comparisons', 'distinct groups'],
      avoidFor: ['sequential data', 'continuous variables'],
    },
    accessibility: {
      contrastRatio: 4.5,
      alternativeEncoding: 'pattern',
      wcagLevel: 'AA',
      colorBlindSupport: true,
      colorBlindSafe: {
        protanopia: true,
        deuteranopia: true,
        tritanopia: true,
        severity: 'safe',
      },
      contrastRatios: [],
      alternativeEncodings: ['pattern', 'shape', 'texture'],
    },
    printSafety: {
      grayscaleCompatible: true,
      printFriendly: true,
      monochromeDistinguishable: true,
      recommendedPrintColors: ['#4E79A7', '#E15759', '#76B7B2', '#59A14F'],
    },
    context: {
      cultural: [],
      domain: [],
      emotional: [],
    },
  },
  VIRIDIS: {
    name: 'Viridis',
    type: ColorPaletteType.SEQUENTIAL,
    colors: ['#440154', '#31688E', '#35B779', '#FDE725'],
    usage: {
      maxCategories: 256,
      minCategories: 2,
      bestFor: ['continuous data', 'heatmaps', 'sequential values'],
      avoidFor: ['categorical data', 'qualitative comparisons'],
    },
    accessibility: {
      contrastRatio: 4.5,
      alternativeEncoding: 'size',
      wcagLevel: 'AA',
      colorBlindSupport: true,
      colorBlindSafe: {
        protanopia: true,
        deuteranopia: true,
        tritanopia: true,
        severity: 'safe',
      },
      contrastRatios: [],
      alternativeEncodings: ['opacity', 'size'],
    },
    printSafety: {
      grayscaleCompatible: true,
      printFriendly: true,
      monochromeDistinguishable: true,
      recommendedPrintColors: ['#440154', '#31688E', '#FDE725'],
    },
    context: {
      cultural: [],
      domain: [],
      emotional: [],
    },
  },
  RD_BU: {
    name: 'Red-Blue Diverging',
    type: ColorPaletteType.DIVERGING,
    colors: ['#B2182B', '#EF8A62', '#FDDBC7', '#F7F7F7', '#D1E5F0', '#67A9CF', '#2166AC'],
    usage: {
      maxCategories: 11,
      minCategories: 3,
      bestFor: ['diverging data', 'data with central reference', 'correlation matrices'],
      avoidFor: ['categorical data', 'sequential data'],
    },
    accessibility: {
      contrastRatio: 3.0,
      alternativeEncoding: 'pattern',
      wcagLevel: 'A',
      colorBlindSupport: false,
      colorBlindSafe: {
        protanopia: false,
        deuteranopia: false,
        tritanopia: true,
        severity: 'caution',
      },
      contrastRatios: [],
      alternativeEncodings: ['pattern', 'shape', 'value'],
    },
    printSafety: {
      grayscaleCompatible: false,
      printFriendly: false,
      monochromeDistinguishable: false,
      recommendedPrintColors: ['#B2182B', '#F7F7F7', '#2166AC'],
    },
    context: {
      cultural: [],
      domain: [],
      emotional: [],
    },
  },
};
