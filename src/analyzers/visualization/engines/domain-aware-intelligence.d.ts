/**
 * Domain-Aware Visualization Intelligence Engine
 *
 * Advanced engine that understands data context and domain to provide:
 * - Automatic domain detection and classification
 * - Context-sensitive visualization recommendations
 * - Domain-specific insight generation
 * - Stakeholder-appropriate view customization
 * - Semantic understanding of data relationships
 * - Industry best practices integration
 */
export interface DomainContext {
    primaryDomain: DataDomain;
    confidence: number;
    subdomains: Subdomain[];
    contextClues: ContextClue[];
    stakeholders: StakeholderProfile[];
    domainKnowledge: DomainKnowledge;
    visualizationStrategy: DomainVisualizationStrategy;
    insights: DomainSpecificInsight[];
}
export interface DataDomain {
    domain: 'education' | 'healthcare' | 'finance' | 'marketing' | 'operations' | 'research' | 'social' | 'ecommerce' | 'hr' | 'iot' | 'generic';
    subdomain?: string;
    confidence: number;
    reasoning: string;
    characteristics: DomainCharacteristic[];
    typicalVariables: string[];
    expectedRelationships: ExpectedRelationship[];
}
export interface Subdomain {
    name: string;
    confidence: number;
    indicators: string[];
    specializations: string[];
}
export interface ContextClue {
    type: 'column_name' | 'data_pattern' | 'value_range' | 'relationship' | 'distribution';
    clue: string;
    strength: number;
    domain: string;
    reasoning: string;
}
export interface StakeholderProfile {
    role: string;
    expertise: 'domain_expert' | 'data_analyst' | 'executive' | 'operational' | 'student' | 'general_public';
    primaryInterests: string[];
    visualizationPreferences: VisualizationPreference[];
    informationNeeds: InformationNeed[];
    decisionContext: string;
}
export interface VisualizationPreference {
    chartType: string;
    complexity: 'simple' | 'moderate' | 'complex';
    interactivity: 'minimal' | 'moderate' | 'high';
    reasoning: string;
}
export interface InformationNeed {
    need: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
    visualizationApproach: string;
    metrics: string[];
}
export interface DomainCharacteristic {
    characteristic: string;
    description: string;
    visualizationImplications: string[];
    commonMistakes: string[];
}
export interface ExpectedRelationship {
    variables: string[];
    relationship: 'causal' | 'correlated' | 'hierarchical' | 'sequential' | 'categorical';
    strength: 'strong' | 'moderate' | 'weak';
    domain_specific_meaning: string;
}
export interface DomainKnowledge {
    keyMetrics: DomainMetric[];
    benchmarks: DomainBenchmark[];
    seasonality: SeasonalityPattern[];
    regulations: RegulatoryConsideration[];
    industryStandards: IndustryStandard[];
    commonAnalyses: CommonAnalysis[];
}
export interface DomainMetric {
    metric: string;
    definition: string;
    calculation: string;
    interpretation: string;
    visualizationBestPractices: string[];
    warningThresholds: ThresholdDefinition[];
}
export interface DomainBenchmark {
    metric: string;
    benchmarkValue: number | string;
    source: string;
    context: string;
    comparisonGuidance: string;
}
export interface SeasonalityPattern {
    variable: string;
    pattern: 'weekly' | 'monthly' | 'quarterly' | 'annual' | 'academic' | 'fiscal';
    description: string;
    visualizationConsiderations: string[];
}
export interface RegulatoryConsideration {
    regulation: string;
    requirement: string;
    visualizationImpact: string;
    complianceGuidance: string;
}
export interface IndustryStandard {
    standard: string;
    description: string;
    visualizationGuidelines: string[];
    adoptionLevel: 'mandatory' | 'recommended' | 'emerging';
}
export interface CommonAnalysis {
    analysis: string;
    purpose: string;
    requiredVariables: string[];
    recommendedVisualization: string;
    interpretation: string;
}
export interface ThresholdDefinition {
    threshold: number;
    condition: 'above' | 'below' | 'between';
    severity: 'critical' | 'warning' | 'info';
    interpretation: string;
}
export interface DomainVisualizationStrategy {
    primaryApproach: VisualizationApproach;
    secondaryApproaches: VisualizationApproach[];
    dashboardRecommendations: DashboardRecommendation[];
    narrativeStructure: NarrativeStructure;
    interactionPatterns: DomainInteractionPattern[];
}
export interface VisualizationApproach {
    approach: string;
    description: string;
    suitableFor: string[];
    chartTypes: DomainChartRecommendation[];
    layoutPreferences: string[];
}
export interface DomainChartRecommendation {
    chartType: string;
    usage: string;
    domainSpecificBestPractices: string[];
    commonPitfalls: string[];
    enhancement_suggestions: string[];
}
export interface DashboardRecommendation {
    type: 'executive' | 'operational' | 'analytical' | 'monitoring';
    purpose: string;
    layout: string;
    keyMetrics: string[];
    refreshFrequency: string;
    alerting: AlertConfiguration[];
}
export interface AlertConfiguration {
    metric: string;
    condition: string;
    threshold: number;
    action: string;
}
export interface NarrativeStructure {
    flow: 'problem_solution' | 'descriptive_prescriptive' | 'temporal' | 'comparative' | 'exploratory';
    keyQuestions: string[];
    insightProgression: InsightProgression[];
    conclusionGuidance: string;
}
export interface InsightProgression {
    stage: string;
    purpose: string;
    visualizations: string[];
    expectedInsights: string[];
}
export interface DomainInteractionPattern {
    pattern: string;
    purpose: string;
    domainJustification: string;
    implementation: string;
    userBenefit: string;
}
export interface DomainSpecificInsight {
    insight: string;
    domain_relevance: string;
    stakeholder_impact: Record<string, string>;
    actionability: 'immediate' | 'planned' | 'strategic' | 'informational';
    visualization_recommendation: string;
    supporting_evidence: string[];
}
export interface SemanticMapping {
    variable: string;
    semanticMeaning: string;
    domainRole: 'input' | 'output' | 'mediator' | 'moderator' | 'control' | 'identifier';
    businessSignificance: string;
    visualizationImplications: string[];
}
export interface DataContextAnalysis {
    entityType: string;
    timeframe: string;
    granularity: string;
    scope: string;
    purpose: 'descriptive' | 'diagnostic' | 'predictive' | 'prescriptive';
    dataMaturity: 'raw' | 'processed' | 'aggregated' | 'derived';
}
/**
 * Domain-Aware Visualization Intelligence Engine
 */
export declare class DomainAwareIntelligence {
    /**
     * Analyze dataset and determine domain context
     */
    static analyzeDomainContext(columnNames: string[], dataCharacteristics: any, sampleValues?: Record<string, any[]>): DomainContext;
    /**
     * Detect primary domain based on data characteristics
     */
    private static detectPrimaryDomain;
    /**
     * Score likelihood of education domain
     */
    private static scoreEducationDomain;
    /**
     * Score likelihood of healthcare domain
     */
    private static scoreHealthcareDomain;
    /**
     * Score likelihood of finance domain
     */
    private static scoreFinanceDomain;
    /**
     * Score likelihood of marketing domain
     */
    private static scoreMarketingDomain;
    /**
     * Score likelihood of operations domain
     */
    private static scoreOperationsDomain;
    /**
     * Score likelihood of HR domain
     */
    private static scoreHRDomain;
    /**
     * Create education domain definition
     */
    private static createEducationDomain;
    private static createHealthcareDomain;
    private static createFinanceDomain;
    private static createMarketingDomain;
    private static createOperationsDomain;
    private static createHRDomain;
    private static createGenericDomain;
    /**
     * Identify relevant subdomains
     */
    private static identifySubdomains;
    /**
     * Extract context clues from data
     */
    private static extractContextClues;
    /**
     * Define stakeholder profiles based on domain
     */
    private static defineStakeholderProfiles;
    /**
     * Build domain-specific knowledge base
     */
    private static buildDomainKnowledge;
    /**
     * Build education-specific domain knowledge
     */
    private static buildEducationKnowledge;
    /**
     * Create domain-specific visualization strategy
     */
    private static createVisualizationStrategy;
    /**
     * Create education-specific visualization strategy
     */
    private static createEducationVisualizationStrategy;
    /**
     * Generate domain-specific insights
     */
    private static generateDomainInsights;
    /**
     * Calculate overall confidence in domain detection
     */
    private static calculateOverallConfidence;
    /**
     * Generate semantic mappings for variables
     */
    static generateSemanticMappings(columnNames: string[], domainContext: DomainContext): SemanticMapping[];
    /**
     * Map individual column to semantic meaning
     */
    private static mapColumnToSemantic;
    /**
     * Analyze data context characteristics
     */
    static analyzeDataContext(columnNames: string[], dataCharacteristics: any): DataContextAnalysis;
}
//# sourceMappingURL=domain-aware-intelligence.d.ts.map