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
  domain:
    | 'education'
    | 'healthcare'
    | 'finance'
    | 'marketing'
    | 'operations'
    | 'research'
    | 'social'
    | 'ecommerce'
    | 'hr'
    | 'iot'
    | 'generic';
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
  expertise:
    | 'domain_expert'
    | 'data_analyst'
    | 'executive'
    | 'operational'
    | 'student'
    | 'general_public';
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
  flow:
    | 'problem_solution'
    | 'descriptive_prescriptive'
    | 'temporal'
    | 'comparative'
    | 'exploratory';
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
export class DomainAwareIntelligence {
  /**
   * Analyze dataset and determine domain context
   */
  static analyzeDomainContext(
    columnNames: string[],
    dataCharacteristics: any,
    sampleValues?: Record<string, any[]>,
  ): DomainContext {
    // Detect primary domain
    const primaryDomain = this.detectPrimaryDomain(columnNames, dataCharacteristics, sampleValues);

    // Identify subdomains
    const subdomains = this.identifySubdomains(columnNames, primaryDomain, dataCharacteristics);

    // Extract context clues
    const contextClues = this.extractContextClues(columnNames, dataCharacteristics, sampleValues);

    // Define stakeholder profiles
    const stakeholders = this.defineStakeholderProfiles(primaryDomain, subdomains);

    // Build domain knowledge base
    const domainKnowledge = this.buildDomainKnowledge(primaryDomain, subdomains);

    // Create visualization strategy
    const visualizationStrategy = this.createVisualizationStrategy(
      primaryDomain,
      stakeholders,
      domainKnowledge,
    );

    // Generate domain-specific insights
    const insights = this.generateDomainInsights(primaryDomain, columnNames, dataCharacteristics);

    const confidence = this.calculateOverallConfidence(primaryDomain, contextClues, subdomains);

    return {
      primaryDomain,
      confidence,
      subdomains,
      contextClues,
      stakeholders,
      domainKnowledge,
      visualizationStrategy,
      insights,
    };
  }

  /**
   * Detect primary domain based on data characteristics
   */
  private static detectPrimaryDomain(
    columnNames: string[],
    dataCharacteristics: any,
    sampleValues?: Record<string, any[]>,
  ): DataDomain {
    const domainScores = new Map<string, number>();
    const domainReasons = new Map<string, string[]>();

    // Education domain detection
    const educationScore = this.scoreEducationDomain(
      columnNames,
      dataCharacteristics,
      sampleValues,
    );
    domainScores.set('education', educationScore.score);
    domainReasons.set('education', educationScore.reasons);

    // Healthcare domain detection
    const healthcareScore = this.scoreHealthcareDomain(
      columnNames,
      dataCharacteristics,
      sampleValues,
    );
    domainScores.set('healthcare', healthcareScore.score);
    domainReasons.set('healthcare', healthcareScore.reasons);

    // Finance domain detection
    const financeScore = this.scoreFinanceDomain(columnNames, dataCharacteristics, sampleValues);
    domainScores.set('finance', financeScore.score);
    domainReasons.set('finance', financeScore.reasons);

    // Marketing domain detection
    const marketingScore = this.scoreMarketingDomain(
      columnNames,
      dataCharacteristics,
      sampleValues,
    );
    domainScores.set('marketing', marketingScore.score);
    domainReasons.set('marketing', marketingScore.reasons);

    // Operations domain detection
    const operationsScore = this.scoreOperationsDomain(
      columnNames,
      dataCharacteristics,
      sampleValues,
    );
    domainScores.set('operations', operationsScore.score);
    domainReasons.set('operations', operationsScore.reasons);

    // HR domain detection
    const hrScore = this.scoreHRDomain(columnNames, dataCharacteristics, sampleValues);
    domainScores.set('hr', hrScore.score);
    domainReasons.set('hr', hrScore.reasons);

    // Find highest scoring domain
    let bestDomain = 'generic';
    let bestScore = 0;
    let bestReasons: string[] = [];

    for (const [domain, score] of domainScores) {
      if (score > bestScore) {
        bestScore = score;
        bestDomain = domain;
        bestReasons = domainReasons.get(domain) || [];
      }
    }

    // If no domain scores well, default to generic
    if (bestScore < 0.3) {
      bestDomain = 'generic';
      bestReasons = ['No strong domain indicators found'];
    }

    const domainMap = {
      education: this.createEducationDomain(bestScore, bestReasons),
      healthcare: this.createHealthcareDomain(bestScore, bestReasons),
      finance: this.createFinanceDomain(bestScore, bestReasons),
      marketing: this.createMarketingDomain(bestScore, bestReasons),
      operations: this.createOperationsDomain(bestScore, bestReasons),
      hr: this.createHRDomain(bestScore, bestReasons),
      generic: this.createGenericDomain(bestScore, bestReasons),
    };

    return domainMap[bestDomain as keyof typeof domainMap];
  }

  /**
   * Score likelihood of education domain
   */
  private static scoreEducationDomain(
    columnNames: string[],
    dataCharacteristics: any,
    sampleValues?: Record<string, any[]>,
  ): { score: number; reasons: string[] } {
    let score = 0;
    const reasons: string[] = [];

    const educationKeywords = [
      'student',
      'grade',
      'score',
      'exam',
      'test',
      'assignment',
      'course',
      'class',
      'attendance',
      'gpa',
      'academic',
      'school',
      'university',
      'college',
      'study',
      'education',
      'learning',
      'subject',
      'teacher',
      'professor',
      'semester',
      'transcript',
      'performance',
      'achievement',
      'curriculum',
      'enrollment',
    ];

    const educationMetrics = [
      'hours_studied',
      'study_time',
      'homework',
      'extracurricular',
      'sleep_hours',
      'social_media_hours',
      'screen_time',
      'mental_health',
      'stress_level',
      'parental_education',
      'family_income',
      'school_type',
    ];

    // Check column names for education keywords
    for (const column of columnNames) {
      const columnLower = column.toLowerCase();
      for (const keyword of educationKeywords) {
        if (columnLower.includes(keyword)) {
          score += 0.15;
          reasons.push(`Column '${column}' contains education keyword '${keyword}'`);
          break;
        }
      }

      for (const metric of educationMetrics) {
        if (columnLower.includes(metric)) {
          score += 0.1;
          reasons.push(`Column '${column}' matches education metric pattern '${metric}'`);
          break;
        }
      }
    }

    // Check for typical education patterns
    const hasStudentId = columnNames.some(
      (col) => col.toLowerCase().includes('student') && col.toLowerCase().includes('id'),
    );
    if (hasStudentId) {
      score += 0.2;
      reasons.push('Student identifier column detected');
    }

    const hasPerformanceMetric = columnNames.some(
      (col) =>
        col.toLowerCase().includes('score') ||
        col.toLowerCase().includes('grade') ||
        col.toLowerCase().includes('performance'),
    );
    if (hasPerformanceMetric) {
      score += 0.15;
      reasons.push('Academic performance metric detected');
    }

    const hasLifestyleFactors = columnNames.some(
      (col) =>
        col.toLowerCase().includes('sleep') ||
        col.toLowerCase().includes('social') ||
        col.toLowerCase().includes('exercise'),
    );
    if (hasLifestyleFactors) {
      score += 0.1;
      reasons.push('Lifestyle factors affecting academic performance detected');
    }

    return { score: Math.min(score, 1.0), reasons };
  }

  /**
   * Score likelihood of healthcare domain
   */
  private static scoreHealthcareDomain(
    columnNames: string[],
    dataCharacteristics: any,
    sampleValues?: Record<string, any[]>,
  ): { score: number; reasons: string[] } {
    let score = 0;
    const reasons: string[] = [];

    const healthcareKeywords = [
      'patient',
      'diagnosis',
      'treatment',
      'medication',
      'dose',
      'doctor',
      'nurse',
      'hospital',
      'clinic',
      'medical',
      'health',
      'disease',
      'symptom',
      'vital',
      'blood',
      'pressure',
      'heart',
      'weight',
      'bmi',
      'temperature',
      'lab',
      'test',
    ];

    for (const column of columnNames) {
      const columnLower = column.toLowerCase();
      for (const keyword of healthcareKeywords) {
        if (columnLower.includes(keyword)) {
          score += 0.2;
          reasons.push(`Healthcare keyword '${keyword}' found in column '${column}'`);
          break;
        }
      }
    }

    return { score: Math.min(score, 1.0), reasons };
  }

  /**
   * Score likelihood of finance domain
   */
  private static scoreFinanceDomain(
    columnNames: string[],
    dataCharacteristics: any,
    sampleValues?: Record<string, any[]>,
  ): { score: number; reasons: string[] } {
    let score = 0;
    const reasons: string[] = [];

    const financeKeywords = [
      'amount',
      'balance',
      'transaction',
      'payment',
      'revenue',
      'profit',
      'loss',
      'price',
      'cost',
      'expense',
      'income',
      'salary',
      'budget',
      'investment',
      'portfolio',
      'stock',
      'bond',
      'market',
      'currency',
      'exchange',
      'rate',
    ];

    for (const column of columnNames) {
      const columnLower = column.toLowerCase();
      for (const keyword of financeKeywords) {
        if (columnLower.includes(keyword)) {
          score += 0.15;
          reasons.push(`Financial keyword '${keyword}' found in column '${column}'`);
          break;
        }
      }
    }

    return { score: Math.min(score, 1.0), reasons };
  }

  /**
   * Score likelihood of marketing domain
   */
  private static scoreMarketingDomain(
    columnNames: string[],
    dataCharacteristics: any,
    sampleValues?: Record<string, any[]>,
  ): { score: number; reasons: string[] } {
    let score = 0;
    const reasons: string[] = [];

    const marketingKeywords = [
      'campaign',
      'click',
      'impression',
      'conversion',
      'customer',
      'lead',
      'funnel',
      'engagement',
      'reach',
      'audience',
      'segment',
      'target',
      'acquisition',
      'retention',
      'churn',
      'lifetime_value',
      'roas',
      'roi',
      'ctr',
      'cpm',
      'cpc',
    ];

    for (const column of columnNames) {
      const columnLower = column.toLowerCase();
      for (const keyword of marketingKeywords) {
        if (columnLower.includes(keyword)) {
          score += 0.15;
          reasons.push(`Marketing keyword '${keyword}' found in column '${column}'`);
          break;
        }
      }
    }

    return { score: Math.min(score, 1.0), reasons };
  }

  /**
   * Score likelihood of operations domain
   */
  private static scoreOperationsDomain(
    columnNames: string[],
    dataCharacteristics: any,
    sampleValues?: Record<string, any[]>,
  ): { score: number; reasons: string[] } {
    let score = 0;
    const reasons: string[] = [];

    const operationsKeywords = [
      'production',
      'manufacturing',
      'inventory',
      'supply',
      'demand',
      'capacity',
      'efficiency',
      'throughput',
      'cycle_time',
      'lead_time',
      'quality',
      'defect',
      'yield',
      'downtime',
      'maintenance',
      'schedule',
      'resource',
      'utilization',
    ];

    for (const column of columnNames) {
      const columnLower = column.toLowerCase();
      for (const keyword of operationsKeywords) {
        if (columnLower.includes(keyword)) {
          score += 0.15;
          reasons.push(`Operations keyword '${keyword}' found in column '${column}'`);
          break;
        }
      }
    }

    return { score: Math.min(score, 1.0), reasons };
  }

  /**
   * Score likelihood of HR domain
   */
  private static scoreHRDomain(
    columnNames: string[],
    dataCharacteristics: any,
    sampleValues?: Record<string, any[]>,
  ): { score: number; reasons: string[] } {
    let score = 0;
    const reasons: string[] = [];

    const hrKeywords = [
      'employee',
      'staff',
      'hire',
      'termination',
      'performance',
      'review',
      'rating',
      'satisfaction',
      'engagement',
      'training',
      'development',
      'promotion',
      'department',
      'manager',
      'team',
      'skill',
      'competency',
      'compensation',
      'benefits',
      'leave',
    ];

    for (const column of columnNames) {
      const columnLower = column.toLowerCase();
      for (const keyword of hrKeywords) {
        if (columnLower.includes(keyword)) {
          score += 0.15;
          reasons.push(`HR keyword '${keyword}' found in column '${column}'`);
          break;
        }
      }
    }

    return { score: Math.min(score, 1.0), reasons };
  }

  /**
   * Create education domain definition
   */
  private static createEducationDomain(confidence: number, reasons: string[]): DataDomain {
    return {
      domain: 'education',
      confidence,
      reasoning: reasons.join('; '),
      characteristics: [
        {
          characteristic: 'Performance-Outcome Relationships',
          description:
            'Clear relationships between inputs (study habits, lifestyle) and outcomes (grades, performance)',
          visualizationImplications: [
            'Use scatter plots to show correlations',
            'Dashboard showing performance drivers',
          ],
          commonMistakes: ['Confusing correlation with causation', 'Ignoring external factors'],
        },
        {
          characteristic: 'Multi-Stakeholder Perspectives',
          description:
            'Different stakeholders need different views (students, teachers, administrators)',
          visualizationImplications: ['Role-based dashboards', 'Privacy-sensitive displays'],
          commonMistakes: ['One-size-fits-all visualizations', 'Exposing sensitive student data'],
        },
        {
          characteristic: 'Temporal Academic Cycles',
          description: 'Data follows academic calendar patterns (semesters, terms, school years)',
          visualizationImplications: [
            'Academic calendar-aware time series',
            'Semester comparison charts',
          ],
          commonMistakes: [
            'Using fiscal calendar instead of academic',
            'Ignoring seasonal variations',
          ],
        },
      ],
      typicalVariables: [
        'student_id',
        'grade',
        'score',
        'attendance',
        'study_hours',
        'extracurricular',
        'parental_education',
        'socioeconomic_factors',
        'learning_style',
        'subject_performance',
      ],
      expectedRelationships: [
        {
          variables: ['study_hours', 'exam_score'],
          relationship: 'causal',
          strength: 'strong',
          domain_specific_meaning:
            'Study time directly impacts academic performance through learning consolidation',
        },
        {
          variables: ['attendance', 'performance'],
          relationship: 'causal',
          strength: 'strong',
          domain_specific_meaning:
            'Class attendance provides direct learning opportunities affecting performance',
        },
        {
          variables: ['sleep_hours', 'mental_health', 'performance'],
          relationship: 'causal',
          strength: 'moderate',
          domain_specific_meaning:
            'Sleep affects cognitive function and mental health, which impact learning capacity',
        },
      ],
    };
  }

  // Helper methods to create other domain definitions
  private static createHealthcareDomain(confidence: number, reasons: string[]): DataDomain {
    return {
      domain: 'healthcare',
      confidence,
      reasoning: reasons.join('; '),
      characteristics: [
        {
          characteristic: 'Patient Privacy and Ethics',
          description: 'Strict privacy requirements and ethical considerations for patient data',
          visualizationImplications: [
            'Anonymized displays',
            'Aggregate-only visualizations',
            'HIPAA-compliant dashboards',
          ],
          commonMistakes: [
            'Exposing patient identifiers',
            'Insufficient data anonymization',
            'Unauthorized data sharing',
          ],
        },
        {
          characteristic: 'Clinical Decision Support',
          description: 'Visualizations must support evidence-based clinical decision making',
          visualizationImplications: [
            'Risk stratification charts',
            'Outcome prediction displays',
            'Treatment effectiveness comparisons',
          ],
          commonMistakes: [
            'Presenting correlation as causation',
            'Ignoring clinical context',
            'Overcomplicating critical displays',
          ],
        },
        {
          characteristic: 'Temporal Health Patterns',
          description: 'Health data often shows temporal patterns requiring longitudinal analysis',
          visualizationImplications: [
            'Patient timeline views',
            'Trend analysis for vital signs',
            'Disease progression tracking',
          ],
          commonMistakes: [
            'Missing critical time intervals',
            'Inappropriate aggregation periods',
            'Ignoring seasonal health patterns',
          ],
        },
        {
          characteristic: 'Multi-Modal Data Integration',
          description: 'Healthcare data comes from diverse sources requiring unified presentation',
          visualizationImplications: [
            'Integrated patient dashboards',
            'Cross-system data correlation',
            'Multi-source validation displays',
          ],
          commonMistakes: [
            'Data source inconsistencies',
            'Conflicting measurement units',
            'Missing data context',
          ],
        },
      ],
      typicalVariables: [
        'patient_id',
        'diagnosis',
        'treatment',
        'vital_signs',
        'lab_results',
        'medication',
        'dosage',
        'blood_pressure',
        'heart_rate',
        'temperature',
        'bmi',
        'age',
        'gender',
        'admission_date',
        'discharge_date',
        'length_of_stay',
        'readmission',
        'outcome',
        'comorbidities',
        'allergies',
        'medical_history',
        'provider_id',
        'facility',
      ],
      expectedRelationships: [
        {
          variables: ['medication', 'dosage', 'outcome'],
          relationship: 'causal',
          strength: 'strong',
          domain_specific_meaning:
            'Medication type and dosage directly affect patient outcomes through pharmacological mechanisms',
        },
        {
          variables: ['vital_signs', 'severity', 'length_of_stay'],
          relationship: 'correlated',
          strength: 'strong',
          domain_specific_meaning:
            'Vital sign abnormalities correlate with disease severity and required care duration',
        },
        {
          variables: ['age', 'comorbidities', 'readmission_risk'],
          relationship: 'causal',
          strength: 'moderate',
          domain_specific_meaning:
            'Age and existing conditions increase complexity of care and readmission probability',
        },
        {
          variables: ['lab_results', 'diagnosis', 'treatment_plan'],
          relationship: 'sequential',
          strength: 'strong',
          domain_specific_meaning:
            'Laboratory findings inform diagnostic decisions which determine treatment protocols',
        },
      ],
    };
  }

  private static createFinanceDomain(confidence: number, reasons: string[]): DataDomain {
    return {
      domain: 'finance',
      confidence,
      reasoning: reasons.join('; '),
      characteristics: [
        {
          characteristic: 'Regulatory Compliance',
          description: 'Financial data visualization must comply with regulatory requirements',
          visualizationImplications: [
            'Audit trail capabilities',
            'Standardized reporting formats',
            'SOX-compliant controls',
          ],
          commonMistakes: [
            'Non-compliant reporting',
            'Missing audit capabilities',
            'Inadequate access controls',
          ],
        },
        {
          characteristic: 'Risk Management Focus',
          description: 'Financial visualizations must highlight risk factors and exposure levels',
          visualizationImplications: [
            'Risk heat maps',
            'Variance analysis charts',
            'Stress testing scenarios',
          ],
          commonMistakes: [
            'Understating risk exposure',
            'Missing risk correlations',
            'Inadequate scenario analysis',
          ],
        },
        {
          characteristic: 'Temporal Financial Cycles',
          description:
            'Financial data follows reporting cycles, fiscal periods, and market rhythms',
          visualizationImplications: [
            'Fiscal calendar alignment',
            'Period-over-period comparisons',
            'Seasonal adjustment displays',
          ],
          commonMistakes: [
            'Misaligned reporting periods',
            'Ignoring seasonality',
            'Inappropriate comparison timeframes',
          ],
        },
        {
          characteristic: 'Multi-Currency and Scale Complexity',
          description:
            'Financial data often involves multiple currencies and vastly different scales',
          visualizationImplications: [
            'Currency conversion displays',
            'Logarithmic scales for wide ranges',
            'Normalized comparison views',
          ],
          commonMistakes: [
            'Currency confusion',
            'Scale distortion',
            'Missing exchange rate context',
          ],
        },
      ],
      typicalVariables: [
        'amount',
        'transaction_id',
        'account',
        'balance',
        'revenue',
        'expense',
        'profit',
        'loss',
        'cash_flow',
        'assets',
        'liabilities',
        'equity',
        'roi',
        'margin',
        'ebitda',
        'transaction_date',
        'settlement_date',
        'currency',
        'exchange_rate',
        'cost_center',
        'budget',
        'forecast',
        'variance',
        'risk_rating',
        'counterparty',
        'instrument_type',
      ],
      expectedRelationships: [
        {
          variables: ['revenue', 'expenses', 'profit'],
          relationship: 'causal',
          strength: 'strong',
          domain_specific_meaning:
            'Revenue minus expenses equals profit through fundamental accounting identity',
        },
        {
          variables: ['interest_rates', 'bond_prices', 'portfolio_value'],
          relationship: 'causal',
          strength: 'strong',
          domain_specific_meaning:
            'Interest rate changes inversely affect bond prices and portfolio valuations',
        },
        {
          variables: ['market_volatility', 'risk_premium', 'investment_returns'],
          relationship: 'correlated',
          strength: 'moderate',
          domain_specific_meaning:
            'Higher market volatility typically correlates with increased risk premiums and variable returns',
        },
        {
          variables: ['cash_flow', 'liquidity', 'operational_efficiency'],
          relationship: 'sequential',
          strength: 'strong',
          domain_specific_meaning:
            'Cash flow patterns indicate liquidity health which affects operational capacity',
        },
      ],
    };
  }

  private static createMarketingDomain(confidence: number, reasons: string[]): DataDomain {
    return {
      domain: 'marketing',
      confidence,
      reasoning: reasons.join('; '),
      characteristics: [
        {
          characteristic: 'Attribution and Customer Journey',
          description:
            'Marketing data requires complex attribution modeling across multiple touchpoints',
          visualizationImplications: [
            'Multi-touch attribution charts',
            'Customer journey flow diagrams',
            'Funnel conversion analysis',
          ],
          commonMistakes: [
            'Single-touch attribution bias',
            'Missing journey context',
            'Oversimplified funnel models',
          ],
        },
        {
          characteristic: 'Real-Time Campaign Optimization',
          description: 'Marketing campaigns require real-time monitoring and rapid optimization',
          visualizationImplications: [
            'Live performance dashboards',
            'Alert-based monitoring',
            'A/B test result displays',
          ],
          commonMistakes: [
            'Delayed reaction to poor performance',
            'Statistical significance confusion',
            'Optimization without context',
          ],
        },
        {
          characteristic: 'Audience Segmentation Complexity',
          description:
            'Marketing effectiveness varies dramatically across different audience segments',
          visualizationImplications: [
            'Segment-specific performance views',
            'Cohort analysis displays',
            'Persona-based dashboards',
          ],
          commonMistakes: [
            'Over-aggregation hiding segment insights',
            'Insufficient segment granularity',
            'Static segmentation models',
          ],
        },
        {
          characteristic: 'ROI and Performance Measurement',
          description:
            'Marketing success requires measuring return on investment across channels and campaigns',
          visualizationImplications: [
            'ROI comparison charts',
            'Performance attribution matrices',
            'Cost-effectiveness analysis',
          ],
          commonMistakes: [
            'Incomplete cost attribution',
            'Short-term ROI focus',
            'Missing lifetime value context',
          ],
        },
      ],
      typicalVariables: [
        'campaign_id',
        'channel',
        'impression',
        'click',
        'conversion',
        'cost',
        'revenue',
        'ctr',
        'cpm',
        'cpc',
        'cpa',
        'roas',
        'roi',
        'audience_segment',
        'demographic',
        'geographic',
        'device_type',
        'time_on_site',
        'bounce_rate',
        'page_views',
        'email_open_rate',
        'email_click_rate',
        'social_engagement',
        'brand_awareness',
        'customer_acquisition_cost',
        'lifetime_value',
        'churn_rate',
        'retention_rate',
      ],
      expectedRelationships: [
        {
          variables: ['spend', 'impressions', 'reach'],
          relationship: 'causal',
          strength: 'strong',
          domain_specific_meaning:
            'Marketing spend directly determines impression volume and audience reach through media buying',
        },
        {
          variables: ['relevance_score', 'ctr', 'conversion_rate'],
          relationship: 'causal',
          strength: 'strong',
          domain_specific_meaning:
            'Higher ad relevance increases click-through rates which improve conversion performance',
        },
        {
          variables: ['audience_targeting', 'engagement', 'cost_efficiency'],
          relationship: 'correlated',
          strength: 'moderate',
          domain_specific_meaning:
            'Better audience targeting typically correlates with higher engagement and lower acquisition costs',
        },
        {
          variables: ['touchpoint_sequence', 'attribution_weight', 'conversion_probability'],
          relationship: 'sequential',
          strength: 'moderate',
          domain_specific_meaning:
            'Customer touchpoint sequence affects attribution modeling and conversion likelihood',
        },
      ],
    };
  }

  private static createOperationsDomain(confidence: number, reasons: string[]): DataDomain {
    return {
      domain: 'operations',
      confidence,
      reasoning: reasons.join('; '),
      characteristics: [
        {
          characteristic: 'Process Optimization Focus',
          description:
            'Operations data emphasizes efficiency, throughput, and continuous improvement',
          visualizationImplications: [
            'Process flow diagrams',
            'Efficiency trend analysis',
            'Bottleneck identification charts',
          ],
          commonMistakes: [
            'Optimizing local maxima',
            'Ignoring process interdependencies',
            'Missing constraint analysis',
          ],
        },
        {
          characteristic: 'Real-Time Monitoring Requirements',
          description:
            'Operational processes require real-time monitoring for immediate corrective action',
          visualizationImplications: [
            'Live production dashboards',
            'Alert threshold displays',
            'Performance deviation warnings',
          ],
          commonMistakes: [
            'Delayed problem detection',
            'Information overload',
            'Missing actionable alerts',
          ],
        },
        {
          characteristic: 'Quality and Variation Control',
          description:
            'Operations data requires statistical process control and quality management',
          visualizationImplications: [
            'Control charts',
            'Capability analysis displays',
            'Defect rate tracking',
          ],
          commonMistakes: [
            'Ignoring process variation',
            'Inadequate quality metrics',
            'Missing statistical significance',
          ],
        },
        {
          characteristic: 'Resource Utilization Optimization',
          description:
            'Operations focus on maximizing resource efficiency and capacity utilization',
          visualizationImplications: [
            'Utilization heat maps',
            'Capacity planning charts',
            'Resource allocation displays',
          ],
          commonMistakes: [
            'Over-utilization risks',
            'Ignoring maintenance windows',
            'Missing demand forecasting',
          ],
        },
      ],
      typicalVariables: [
        'production_volume',
        'cycle_time',
        'lead_time',
        'throughput',
        'efficiency',
        'utilization',
        'quality_score',
        'defect_rate',
        'yield',
        'downtime',
        'uptime',
        'maintenance_cost',
        'inventory_level',
        'stockout_rate',
        'supplier_performance',
        'delivery_time',
        'cost_per_unit',
        'labor_hours',
        'machine_hours',
        'energy_consumption',
        'waste_generation',
        'safety_incidents',
        'compliance_score',
        'customer_satisfaction',
      ],
      expectedRelationships: [
        {
          variables: ['cycle_time', 'throughput', 'capacity'],
          relationship: 'causal',
          strength: 'strong',
          domain_specific_meaning:
            'Shorter cycle times increase throughput within fixed capacity constraints through process efficiency',
        },
        {
          variables: ['quality_investment', 'defect_rate', 'total_cost'],
          relationship: 'causal',
          strength: 'strong',
          domain_specific_meaning:
            'Quality investments reduce defect rates, lowering total cost through prevention over correction',
        },
        {
          variables: ['utilization_rate', 'flexibility', 'responsiveness'],
          relationship: 'correlated',
          strength: 'moderate',
          domain_specific_meaning:
            'High utilization can reduce operational flexibility and responsiveness to demand changes',
        },
        {
          variables: ['maintenance_schedule', 'equipment_reliability', 'production_stability'],
          relationship: 'sequential',
          strength: 'strong',
          domain_specific_meaning:
            'Preventive maintenance schedules affect equipment reliability which determines production stability',
        },
      ],
    };
  }

  private static createHRDomain(confidence: number, reasons: string[]): DataDomain {
    return {
      domain: 'hr',
      confidence,
      reasoning: reasons.join('; '),
      characteristics: [
        {
          characteristic: 'Employee Privacy and Confidentiality',
          description: 'HR data requires strict privacy protection and confidential handling',
          visualizationImplications: [
            'Anonymized individual displays',
            'Aggregate-only views',
            'Role-based access controls',
          ],
          commonMistakes: [
            'Exposing individual performance data',
            'Insufficient anonymization',
            'Unauthorized data access',
          ],
        },
        {
          characteristic: 'Performance and Development Focus',
          description:
            'HR analytics emphasize employee development, performance improvement, and career progression',
          visualizationImplications: [
            'Performance trend analysis',
            'Skill gap identification',
            'Career pathway visualization',
          ],
          commonMistakes: [
            'Punitive performance displays',
            'Missing development context',
            'One-dimensional performance metrics',
          ],
        },
        {
          characteristic: 'Diversity and Inclusion Monitoring',
          description: 'HR data requires comprehensive diversity, equity, and inclusion analysis',
          visualizationImplications: [
            'Demographic representation charts',
            'Pay equity analysis',
            'Promotion pattern displays',
          ],
          commonMistakes: [
            'Oversimplified diversity metrics',
            'Missing intersectional analysis',
            'Inadequate equity measurement',
          ],
        },
        {
          characteristic: 'Predictive Talent Management',
          description:
            'HR analytics increasingly focus on predicting employee behavior and retention',
          visualizationImplications: [
            'Retention risk scoring',
            'Succession planning displays',
            'Engagement prediction models',
          ],
          commonMistakes: [
            'Over-reliance on predictive models',
            'Missing human context',
            'Algorithmic bias in predictions',
          ],
        },
      ],
      typicalVariables: [
        'employee_id',
        'department',
        'role',
        'level',
        'hire_date',
        'tenure',
        'salary',
        'performance_rating',
        'goal_achievement',
        'skill_assessment',
        'training_hours',
        'engagement_score',
        'satisfaction_score',
        'retention_risk',
        'promotion_history',
        'manager_rating',
        'peer_feedback',
        'customer_feedback',
        'attendance_rate',
        'overtime_hours',
        'leave_taken',
        'benefits_utilization',
        'diversity_category',
        'age',
        'gender',
        'ethnicity',
        'education_level',
        'certification_count',
      ],
      expectedRelationships: [
        {
          variables: ['engagement_score', 'performance_rating', 'retention_likelihood'],
          relationship: 'causal',
          strength: 'strong',
          domain_specific_meaning:
            'Employee engagement directly affects performance levels and retention probability through motivation',
        },
        {
          variables: ['training_investment', 'skill_development', 'career_advancement'],
          relationship: 'causal',
          strength: 'strong',
          domain_specific_meaning:
            'Training investments develop employee skills which enable career advancement opportunities',
        },
        {
          variables: ['manager_quality', 'team_performance', 'employee_satisfaction'],
          relationship: 'correlated',
          strength: 'strong',
          domain_specific_meaning:
            'Manager effectiveness strongly correlates with team performance and employee satisfaction levels',
        },
        {
          variables: ['diversity_initiatives', 'inclusion_metrics', 'organizational_culture'],
          relationship: 'sequential',
          strength: 'moderate',
          domain_specific_meaning:
            'Diversity initiatives affect inclusion metrics which contribute to overall organizational culture',
        },
      ],
    };
  }

  private static createGenericDomain(confidence: number, reasons: string[]): DataDomain {
    return {
      domain: 'generic',
      confidence,
      reasoning: reasons.join('; '),
      characteristics: [],
      typicalVariables: [],
      expectedRelationships: [],
    };
  }

  /**
   * Identify relevant subdomains
   */
  private static identifySubdomains(
    columnNames: string[],
    primaryDomain: DataDomain,
    dataCharacteristics: any,
  ): Subdomain[] {
    const subdomains: Subdomain[] = [];

    if (primaryDomain.domain === 'education') {
      // Check for specific education subdomains
      const hasOnlineLearning = columnNames.some(
        (col) =>
          col.toLowerCase().includes('online') ||
          col.toLowerCase().includes('digital') ||
          col.toLowerCase().includes('screen'),
      );
      if (hasOnlineLearning) {
        subdomains.push({
          name: 'online_learning',
          confidence: 0.8,
          indicators: ['online learning indicators detected'],
          specializations: [
            'digital engagement analysis',
            'screen time impact',
            'virtual classroom dynamics',
          ],
        });
      }

      const hasLifestyleFactors = columnNames.some(
        (col) =>
          col.toLowerCase().includes('sleep') ||
          col.toLowerCase().includes('exercise') ||
          col.toLowerCase().includes('diet'),
      );
      if (hasLifestyleFactors) {
        subdomains.push({
          name: 'holistic_student_wellness',
          confidence: 0.9,
          indicators: ['lifestyle and wellness factors detected'],
          specializations: [
            'wellness-performance correlation',
            'lifestyle intervention analysis',
            'holistic student support',
          ],
        });
      }
    }

    return subdomains;
  }

  /**
   * Extract context clues from data
   */
  private static extractContextClues(
    columnNames: string[],
    dataCharacteristics: any,
    sampleValues?: Record<string, any[]>,
  ): ContextClue[] {
    const clues: ContextClue[] = [];

    // Analyze column name patterns
    for (const column of columnNames) {
      const columnLower = column.toLowerCase();

      // Time-based clues
      if (columnLower.includes('hour') || columnLower.includes('time')) {
        clues.push({
          type: 'column_name',
          clue: `Time-based measurement: ${column}`,
          strength: 0.7,
          domain: 'temporal_analysis',
          reasoning: 'Time-based columns suggest temporal or behavioral analysis needs',
        });
      }

      // Rating/score clues
      if (columnLower.includes('rating') || columnLower.includes('score')) {
        clues.push({
          type: 'column_name',
          clue: `Performance/quality metric: ${column}`,
          strength: 0.8,
          domain: 'performance_analysis',
          reasoning: 'Rating/score columns indicate performance evaluation context',
        });
      }

      // Percentage clues
      if (columnLower.includes('percentage') || columnLower.includes('percent')) {
        clues.push({
          type: 'column_name',
          clue: `Percentage metric: ${column}`,
          strength: 0.6,
          domain: 'proportion_analysis',
          reasoning: 'Percentage columns suggest comparative or achievement analysis',
        });
      }
    }

    return clues;
  }

  /**
   * Define stakeholder profiles based on domain
   */
  private static defineStakeholderProfiles(
    primaryDomain: DataDomain,
    subdomains: Subdomain[],
  ): StakeholderProfile[] {
    const profiles: StakeholderProfile[] = [];

    if (primaryDomain.domain === 'education') {
      profiles.push({
        role: 'educator',
        expertise: 'domain_expert',
        primaryInterests: [
          'student performance trends',
          'intervention effectiveness',
          'learning outcomes',
        ],
        visualizationPreferences: [
          {
            chartType: 'performance_dashboard',
            complexity: 'moderate',
            interactivity: 'moderate',
            reasoning: 'Teachers need actionable insights without overwhelming complexity',
          },
        ],
        informationNeeds: [
          {
            need: 'identify_at_risk_students',
            priority: 'critical',
            visualizationApproach: 'alert-based dashboard with performance trends',
            metrics: ['attendance', 'assignment_completion', 'performance_trend'],
          },
        ],
        decisionContext: 'Immediate intervention and support decisions',
      });

      profiles.push({
        role: 'student',
        expertise: 'general_public',
        primaryInterests: ['personal performance', 'improvement opportunities', 'peer comparison'],
        visualizationPreferences: [
          {
            chartType: 'personal_progress',
            complexity: 'simple',
            interactivity: 'moderate',
            reasoning: 'Students need clear, motivating visualizations of their progress',
          },
        ],
        informationNeeds: [
          {
            need: 'track_personal_progress',
            priority: 'high',
            visualizationApproach: 'personal dashboard with clear progress indicators',
            metrics: ['grade_trends', 'study_effectiveness', 'goal_progress'],
          },
        ],
        decisionContext: 'Study habits and academic planning',
      });

      profiles.push({
        role: 'administrator',
        expertise: 'executive',
        primaryInterests: [
          'program effectiveness',
          'resource allocation',
          'institutional performance',
        ],
        visualizationPreferences: [
          {
            chartType: 'executive_summary',
            complexity: 'simple',
            interactivity: 'minimal',
            reasoning: 'Administrators need high-level insights for strategic decisions',
          },
        ],
        informationNeeds: [
          {
            need: 'assess_program_effectiveness',
            priority: 'critical',
            visualizationApproach: 'summary dashboard with key performance indicators',
            metrics: ['overall_performance', 'trend_analysis', 'resource_impact'],
          },
        ],
        decisionContext: 'Strategic planning and resource allocation',
      });
    }

    return profiles;
  }

  /**
   * Build domain-specific knowledge base
   */
  private static buildDomainKnowledge(
    primaryDomain: DataDomain,
    subdomains: Subdomain[],
  ): DomainKnowledge {
    if (primaryDomain.domain === 'education') {
      return this.buildEducationKnowledge();
    }

    return {
      keyMetrics: [],
      benchmarks: [],
      seasonality: [],
      regulations: [],
      industryStandards: [],
      commonAnalyses: [],
    };
  }

  /**
   * Build education-specific domain knowledge
   */
  private static buildEducationKnowledge(): DomainKnowledge {
    return {
      keyMetrics: [
        {
          metric: 'Academic Performance Index',
          definition: 'Composite measure of student academic achievement',
          calculation: 'Weighted average of exam scores, assignment grades, and participation',
          interpretation: 'Higher values indicate better academic performance',
          visualizationBestPractices: [
            'Use consistent color coding',
            'Show confidence intervals',
            'Include benchmark lines',
          ],
          warningThresholds: [
            {
              threshold: 60,
              condition: 'below',
              severity: 'critical',
              interpretation: 'At-risk performance requiring intervention',
            },
            {
              threshold: 75,
              condition: 'below',
              severity: 'warning',
              interpretation: 'Below-average performance',
            },
          ],
        },
        {
          metric: 'Study Effectiveness Ratio',
          definition: 'Performance gains per hour of study time',
          calculation: 'Performance improvement / Study hours invested',
          interpretation: 'Measures efficiency of study habits and learning approaches',
          visualizationBestPractices: [
            'Show individual vs. average ratios',
            'Use scatter plots for study time vs. performance',
          ],
          warningThresholds: [
            {
              threshold: 0.5,
              condition: 'below',
              severity: 'warning',
              interpretation: 'Ineffective study patterns',
            },
          ],
        },
      ],
      benchmarks: [
        {
          metric: 'average_study_hours',
          benchmarkValue: 3.5,
          source: 'Educational research standards',
          context: 'Daily study hours for typical student performance',
          comparisonGuidance:
            'Compare individual vs. benchmark with context of performance outcomes',
        },
      ],
      seasonality: [
        {
          variable: 'performance_metrics',
          pattern: 'academic',
          description: 'Performance typically varies by academic calendar (exams, breaks)',
          visualizationConsiderations: [
            'Mark exam periods',
            'Account for semester breaks',
            'Show academic year cycles',
          ],
        },
      ],
      regulations: [
        {
          regulation: 'FERPA',
          requirement: 'Student privacy protection in educational records',
          visualizationImpact: 'Cannot display individual student data without consent',
          complianceGuidance: 'Use aggregate visualizations and anonymized displays',
        },
      ],
      industryStandards: [
        {
          standard: 'Academic Dashboard Standards',
          description: 'Best practices for educational data visualization',
          visualizationGuidelines: [
            'Clear performance indicators',
            'Actionable insights',
            'Privacy-compliant displays',
          ],
          adoptionLevel: 'recommended',
        },
      ],
      commonAnalyses: [
        {
          analysis: 'Performance Factor Analysis',
          purpose: 'Identify factors most strongly associated with academic performance',
          requiredVariables: [
            'study_hours',
            'attendance',
            'lifestyle_factors',
            'performance_metrics',
          ],
          recommendedVisualization: 'correlation_heatmap_with_regression_analysis',
          interpretation: 'Larger correlations indicate stronger influence on academic outcomes',
        },
      ],
    };
  }

  /**
   * Create domain-specific visualization strategy
   */
  private static createVisualizationStrategy(
    primaryDomain: DataDomain,
    stakeholders: StakeholderProfile[],
    domainKnowledge: DomainKnowledge,
  ): DomainVisualizationStrategy {
    if (primaryDomain.domain === 'education') {
      return this.createEducationVisualizationStrategy(stakeholders, domainKnowledge);
    }

    return {
      primaryApproach: {
        approach: 'generic_descriptive',
        description: 'Standard descriptive analytics approach',
        suitableFor: ['general analysis'],
        chartTypes: [],
        layoutPreferences: [],
      },
      secondaryApproaches: [],
      dashboardRecommendations: [],
      narrativeStructure: {
        flow: 'descriptive_prescriptive',
        keyQuestions: [],
        insightProgression: [],
        conclusionGuidance: '',
      },
      interactionPatterns: [],
    };
  }

  /**
   * Create education-specific visualization strategy
   */
  private static createEducationVisualizationStrategy(
    stakeholders: StakeholderProfile[],
    domainKnowledge: DomainKnowledge,
  ): DomainVisualizationStrategy {
    return {
      primaryApproach: {
        approach: 'performance_driven_analytics',
        description: 'Focus on academic performance drivers and outcomes',
        suitableFor: ['performance analysis', 'intervention planning', 'progress tracking'],
        chartTypes: [
          {
            chartType: 'performance_correlation_matrix',
            usage: 'Show relationships between lifestyle factors and academic performance',
            domainSpecificBestPractices: [
              'Use diverging color scheme for positive/negative correlations',
              'Highlight statistically significant relationships',
              'Include effect size annotations',
            ],
            commonPitfalls: [
              'Implying causation from correlation',
              'Ignoring confounding variables',
              'Using inappropriate statistical tests',
            ],
            enhancement_suggestions: [
              'Add confidence intervals',
              'Include partial correlation analysis',
              'Provide interpretation guidance',
            ],
          },
          {
            chartType: 'student_performance_dashboard',
            usage: 'Comprehensive view of individual or cohort performance',
            domainSpecificBestPractices: [
              'Show trends over academic calendar',
              'Include early warning indicators',
              'Provide comparison to benchmarks',
            ],
            commonPitfalls: [
              'Information overload',
              'Lack of actionable insights',
              'Privacy violations',
            ],
            enhancement_suggestions: [
              'Role-based customization',
              'Automated alerts for at-risk students',
              'Intervention recommendation engine',
            ],
          },
        ],
        layoutPreferences: [
          'Performance metrics prominently displayed',
          'Clear visual hierarchy',
          'Contextual information readily available',
        ],
      },
      secondaryApproaches: [
        {
          approach: 'lifestyle_impact_analysis',
          description: 'Analyze impact of lifestyle factors on academic outcomes',
          suitableFor: ['wellness programs', 'holistic student support'],
          chartTypes: [],
          layoutPreferences: [],
        },
      ],
      dashboardRecommendations: [
        {
          type: 'operational',
          purpose: 'Daily monitoring of student progress and early intervention',
          layout: 'alert_based_with_drill_down',
          keyMetrics: ['attendance_trends', 'assignment_completion', 'performance_alerts'],
          refreshFrequency: 'daily',
          alerting: [
            {
              metric: 'attendance_percentage',
              condition: 'below_threshold',
              threshold: 80,
              action: 'notify_advisor',
            },
          ],
        },
      ],
      narrativeStructure: {
        flow: 'problem_solution',
        keyQuestions: [
          'What factors most influence student performance?',
          'Which students are at risk and need intervention?',
          'How effective are current support programs?',
        ],
        insightProgression: [
          {
            stage: 'current_state',
            purpose: 'Establish baseline performance and identify patterns',
            visualizations: ['performance_distribution', 'trend_analysis'],
            expectedInsights: ['Performance levels', 'Temporal patterns', 'Variability factors'],
          },
          {
            stage: 'factor_analysis',
            purpose: 'Identify key performance drivers',
            visualizations: ['correlation_analysis', 'factor_importance'],
            expectedInsights: [
              'Key performance factors',
              'Lifestyle impacts',
              'Controllable variables',
            ],
          },
          {
            stage: 'intervention_opportunities',
            purpose: 'Identify actionable improvement opportunities',
            visualizations: ['intervention_impact', 'scenario_analysis'],
            expectedInsights: [
              'Intervention targets',
              'Expected outcomes',
              'Resource requirements',
            ],
          },
        ],
        conclusionGuidance:
          'Provide specific, actionable recommendations for improving student outcomes',
      },
      interactionPatterns: [
        {
          pattern: 'drill_down_student_details',
          purpose:
            'Allow educators to explore individual student factors while maintaining privacy',
          domainJustification: 'Educators need detailed student insights for personalized support',
          implementation: 'Privacy-compliant drill-down with role-based access',
          userBenefit: 'Enables targeted intervention and personalized support strategies',
        },
      ],
    };
  }

  /**
   * Generate domain-specific insights
   */
  private static generateDomainInsights(
    primaryDomain: DataDomain,
    columnNames: string[],
    dataCharacteristics: any,
  ): DomainSpecificInsight[] {
    const insights: DomainSpecificInsight[] = [];

    if (primaryDomain.domain === 'education') {
      insights.push({
        insight: 'Multi-factor academic performance model detected',
        domain_relevance:
          'Academic performance is influenced by multiple lifestyle and behavioral factors',
        stakeholder_impact: {
          educator: 'Can identify key intervention points for student support',
          student: 'Can understand which habits most impact their academic success',
          administrator: 'Can allocate resources to most impactful support programs',
        },
        actionability: 'immediate',
        visualization_recommendation:
          'Interactive correlation matrix with factor importance ranking',
        supporting_evidence: [
          'Multiple lifestyle variables present',
          'Performance outcome variables identified',
        ],
      });

      if (columnNames.some((col) => col.toLowerCase().includes('mental_health'))) {
        insights.push({
          insight: 'Mental health integration opportunity identified',
          domain_relevance:
            'Mental health is increasingly recognized as critical to academic success',
          stakeholder_impact: {
            educator: 'Can incorporate wellness checks into academic support',
            student: 'Can understand connection between mental health and academic performance',
            administrator: 'Can justify investment in mental health support services',
          },
          actionability: 'planned',
          visualization_recommendation:
            'Wellness-performance correlation dashboard with trend analysis',
          supporting_evidence: ['Mental health variables detected in dataset'],
        });
      }
    }

    return insights;
  }

  /**
   * Calculate overall confidence in domain detection
   */
  private static calculateOverallConfidence(
    primaryDomain: DataDomain,
    contextClues: ContextClue[],
    subdomains: Subdomain[],
  ): number {
    const domainConfidence = primaryDomain.confidence;
    const clueStrength =
      contextClues.reduce((sum, clue) => sum + clue.strength, 0) / Math.max(contextClues.length, 1);
    const subdomainConfidence =
      subdomains.reduce((sum, sub) => sum + sub.confidence, 0) / Math.max(subdomains.length, 1);

    return domainConfidence * 0.6 + clueStrength * 0.25 + subdomainConfidence * 0.15;
  }

  /**
   * Generate semantic mappings for variables
   */
  static generateSemanticMappings(
    columnNames: string[],
    domainContext: DomainContext,
  ): SemanticMapping[] {
    const mappings: SemanticMapping[] = [];

    for (const column of columnNames) {
      const mapping = this.mapColumnToSemantic(column, domainContext);
      if (mapping) {
        mappings.push(mapping);
      }
    }

    return mappings;
  }

  /**
   * Map individual column to semantic meaning
   */
  private static mapColumnToSemantic(
    columnName: string,
    domainContext: DomainContext,
  ): SemanticMapping | null {
    const columnLower = columnName.toLowerCase();

    if (domainContext.primaryDomain.domain === 'education') {
      // Performance outcomes
      if (
        columnLower.includes('score') ||
        columnLower.includes('grade') ||
        columnLower.includes('performance')
      ) {
        return {
          variable: columnName,
          semanticMeaning: 'Academic performance outcome measure',
          domainRole: 'output',
          businessSignificance: 'Primary measure of educational success and learning achievement',
          visualizationImplications: [
            'Should be primary dependent variable in analysis',
            'Use as target for predictive modeling',
            'Display prominently in performance dashboards',
          ],
        };
      }

      // Study behaviors
      if (columnLower.includes('study') && columnLower.includes('hour')) {
        return {
          variable: columnName,
          semanticMeaning: 'Study time investment measure',
          domainRole: 'input',
          businessSignificance: 'Key controllable factor influencing academic outcomes',
          visualizationImplications: [
            'Show correlation with performance outcomes',
            'Use in efficiency analysis (performance per study hour)',
            'Display as actionable improvement opportunity',
          ],
        };
      }

      // Lifestyle factors
      if (
        columnLower.includes('sleep') ||
        columnLower.includes('exercise') ||
        columnLower.includes('social_media')
      ) {
        return {
          variable: columnName,
          semanticMeaning: 'Lifestyle factor affecting learning capacity',
          domainRole: 'mediator',
          businessSignificance: 'Indirect factor influencing academic performance through wellness',
          visualizationImplications: [
            'Group with other lifestyle factors in analysis',
            'Show indirect effects on performance',
            'Use in holistic wellness interventions',
          ],
        };
      }
    }

    return null;
  }

  /**
   * Analyze data context characteristics
   */
  static analyzeDataContext(columnNames: string[], dataCharacteristics: any): DataContextAnalysis {
    // Determine entity type
    let entityType = 'individual';
    if (columnNames.some((col) => col.toLowerCase().includes('student'))) {
      entityType = 'student';
    } else if (columnNames.some((col) => col.toLowerCase().includes('patient'))) {
      entityType = 'patient';
    } else if (columnNames.some((col) => col.toLowerCase().includes('customer'))) {
      entityType = 'customer';
    }

    // Determine timeframe
    let timeframe = 'cross_sectional';
    if (
      columnNames.some(
        (col) => col.toLowerCase().includes('date') || col.toLowerCase().includes('time'),
      )
    ) {
      timeframe = 'longitudinal';
    }

    // Determine granularity
    let granularity = 'individual';
    if (
      columnNames.some(
        (col) => col.toLowerCase().includes('average') || col.toLowerCase().includes('total'),
      )
    ) {
      granularity = 'aggregated';
    }

    return {
      entityType,
      timeframe,
      granularity,
      scope: 'institutional',
      purpose: 'descriptive',
      dataMaturity: 'processed',
    };
  }
}
