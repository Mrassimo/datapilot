/**
 * Domain-Aware Intelligence Tests
 * 
 * Comprehensive tests for the domain-aware visualization intelligence engine that
 * understands data context and provides domain-specific visualization recommendations.
 */

/// <reference path="../../jest-custom-matchers.d.ts" />

import { DomainAwareIntelligence } from '../../../src/analyzers/visualization/engines/domain-aware-intelligence';
import type {
  DomainContext,
  DataDomain,
  ContextClue,
  StakeholderProfile,
  DomainKnowledge,
  DomainVisualizationStrategy,
  DomainSpecificInsight
} from '../../../src/analyzers/visualization/engines/domain-aware-intelligence';

describe('DomainAwareIntelligence', () => {
  const mockColumnNames = ['user_id', 'revenue', 'conversion_rate', 'campaign_id', 'click_through_rate'];
  const mockDataSample = [
    { user_id: '12345', revenue: 150.50, conversion_rate: 0.05, campaign_id: 'CMP001', click_through_rate: 0.12 },
    { user_id: '12346', revenue: 89.30, conversion_rate: 0.03, campaign_id: 'CMP002', click_through_rate: 0.08 },
    { user_id: '12347', revenue: 245.75, conversion_rate: 0.07, campaign_id: 'CMP001', click_through_rate: 0.15 }
  ];

  describe('detectDomain', () => {
    it('should detect marketing domain from column names and data patterns', () => {
      const domain = DomainAwareIntelligence.detectDomain(mockColumnNames, mockDataSample);

      expect(domain.domain).toBe('marketing');
      expect(domain.confidence).toBeGreaterThan(0.7);
      expect(domain.reasoning).toContain('marketing');
      expect(domain.typicalVariables).toContain('conversion_rate');
    });

    it('should detect finance domain from financial indicators', () => {
      const financeColumns = ['account_id', 'balance', 'transaction_amount', 'interest_rate', 'credit_score'];
      const financeData = [
        { account_id: 'ACC001', balance: 5000, transaction_amount: -150, interest_rate: 0.045, credit_score: 750 }
      ];

      const domain = DomainAwareIntelligence.detectDomain(financeColumns, financeData);

      expect(domain.domain).toBe('finance');
      expect(domain.confidence).toBeGreaterThan(0.6);
    });

    it('should detect healthcare domain from medical indicators', () => {
      const healthColumns = ['patient_id', 'blood_pressure', 'heart_rate', 'diagnosis', 'treatment_date'];
      const healthData = [
        { patient_id: 'P001', blood_pressure: '120/80', heart_rate: 72, diagnosis: 'Hypertension' }
      ];

      const domain = DomainAwareIntelligence.detectDomain(healthColumns, healthData);

      expect(domain.domain).toBe('healthcare');
      expect(domain.reasoning).toContain('healthcare');
    });

    it('should detect education domain from academic indicators', () => {
      const eduColumns = ['student_id', 'grade', 'course_name', 'enrollment_date', 'gpa'];
      const eduData = [
        { student_id: 'S001', grade: 'A', course_name: 'Mathematics', gpa: 3.8 }
      ];

      const domain = DomainAwareIntelligence.detectDomain(eduColumns, eduData);

      expect(domain.domain).toBe('education');
      expect(domain.confidence).toBeGreaterThan(0.5);
    });

    it('should fall back to generic domain for unrecognizable patterns', () => {
      const genericColumns = ['column_a', 'column_b', 'column_c'];
      const genericData = [
        { column_a: 'value1', column_b: 123, column_c: 'other' }
      ];

      const domain = DomainAwareIntelligence.detectDomain(genericColumns, genericData);

      expect(domain.domain).toBe('generic');
      expect(domain.confidence).toBeLessThan(0.5);
    });

    it('should detect e-commerce domain from shopping indicators', () => {
      const ecommerceColumns = ['order_id', 'product_name', 'quantity', 'price', 'customer_id', 'cart_total'];
      const ecommerceData = [
        { order_id: 'ORD001', product_name: 'Widget', quantity: 2, price: 29.99, cart_total: 59.98 }
      ];

      const domain = DomainAwareIntelligence.detectDomain(ecommerceColumns, ecommerceData);

      expect(domain.domain).toBe('ecommerce');
      expect(domain.confidence).toBeGreaterThan(0.6);
    });
  });

  describe('identifyStakeholders', () => {
    it('should identify marketing stakeholders for marketing domain', () => {
      const marketingDomain: DataDomain = {
        domain: 'marketing',
        confidence: 0.85,
        reasoning: 'Marketing campaign data',
        characteristics: [],
        typicalVariables: ['conversion_rate', 'click_through_rate'],
        expectedRelationships: []
      };

      const stakeholders = DomainAwareIntelligence.identifyStakeholders(marketingDomain);

      expect(stakeholders.length).toBeGreaterThan(0);
      
      const marketingManager = stakeholders.find(s => s.role.includes('Marketing'));
      expect(marketingManager).toBeDefined();
      expect(marketingManager?.expertise).toMatch(/^(domain_expert|data_analyst|executive)$/);
      expect(marketingManager?.primaryInterests).toContain('conversion_optimization');
    });

    it('should identify financial stakeholders for finance domain', () => {
      const financeDomain: DataDomain = {
        domain: 'finance',
        confidence: 0.9,
        reasoning: 'Financial transaction data',
        characteristics: [],
        typicalVariables: ['balance', 'interest_rate'],
        expectedRelationships: []
      };

      const stakeholders = DomainAwareIntelligence.identifyStakeholders(financeDomain);

      const cfo = stakeholders.find(s => s.role.includes('CFO') || s.role.includes('Financial'));
      expect(cfo).toBeDefined();
      expect(cfo?.primaryInterests).toContain('risk_management');
    });

    it('should provide appropriate visualization preferences by stakeholder', () => {
      const marketingDomain: DataDomain = {
        domain: 'marketing',
        confidence: 0.8,
        reasoning: 'Marketing data',
        characteristics: [],
        typicalVariables: [],
        expectedRelationships: []
      };

      const stakeholders = DomainAwareIntelligence.identifyStakeholders(marketingDomain);

      stakeholders.forEach(stakeholder => {
        expect(stakeholder.visualizationPreferences).toBeInstanceOf(Array);
        expect(stakeholder.visualizationPreferences.length).toBeGreaterThan(0);
        
        const pref = stakeholder.visualizationPreferences[0];
        expect(pref.chartType).toBeDefined();
        expect(pref.complexity).toMatch(/^(simple|moderate|complex)$/);
        expect(pref.interactivity).toMatch(/^(minimal|moderate|high)$/);
      });
    });
  });

  describe('generateDomainSpecificInsights', () => {
    it('should generate marketing-specific insights', () => {
      const context: DomainContext = {
        primaryDomain: {
          domain: 'marketing',
          confidence: 0.85,
          reasoning: 'Marketing campaign data',
          characteristics: [],
          typicalVariables: ['conversion_rate', 'revenue'],
          expectedRelationships: []
        },
        confidence: 0.85,
        subdomains: [],
        contextClues: [],
        stakeholders: [],
        domainKnowledge: {} as DomainKnowledge,
        visualizationStrategy: {} as DomainVisualizationStrategy,
        insights: []
      };

      const insights = DomainAwareIntelligence.generateDomainSpecificInsights(
        context,
        mockColumnNames,
        mockDataSample
      );

      expect(insights).toBeInstanceOf(Array);
      expect(insights.length).toBeGreaterThan(0);
      
      const conversionInsight = insights.find(i => i.insight.includes('conversion'));
      expect(conversionInsight).toBeDefined();
      expect(conversionInsight?.category).toBe('performance_metric');
    });

    it('should generate finance-specific insights', () => {
      const financeContext: DomainContext = {
        primaryDomain: {
          domain: 'finance',
          confidence: 0.9,
          reasoning: 'Financial data',
          characteristics: [],
          typicalVariables: ['balance', 'transaction_amount'],
          expectedRelationships: []
        },
        confidence: 0.9,
        subdomains: [],
        contextClues: [],
        stakeholders: [],
        domainKnowledge: {} as DomainKnowledge,
        visualizationStrategy: {} as DomainVisualizationStrategy,
        insights: []
      };

      const financeColumns = ['account_id', 'balance', 'transaction_amount'];
      const financeData = [
        { account_id: 'ACC001', balance: 5000, transaction_amount: -150 }
      ];

      const insights = DomainAwareIntelligence.generateDomainSpecificInsights(
        financeContext,
        financeColumns,
        financeData
      );

      expect(insights.length).toBeGreaterThan(0);
      
      const riskInsight = insights.find(i => i.category === 'risk_assessment');
      expect(riskInsight).toBeDefined();
    });

    it('should provide actionable recommendations in insights', () => {
      const context: DomainContext = {
        primaryDomain: {
          domain: 'ecommerce',
          confidence: 0.8,
          reasoning: 'E-commerce data',
          characteristics: [],
          typicalVariables: ['order_value', 'quantity'],
          expectedRelationships: []
        },
        confidence: 0.8,
        subdomains: [],
        contextClues: [],
        stakeholders: [],
        domainKnowledge: {} as DomainKnowledge,
        visualizationStrategy: {} as DomainVisualizationStrategy,
        insights: []
      };

      const ecommerceColumns = ['order_id', 'product_category', 'order_value'];
      const ecommerceData = [
        { order_id: 'ORD001', product_category: 'Electronics', order_value: 299.99 }
      ];

      const insights = DomainAwareIntelligence.generateDomainSpecificInsights(
        context,
        ecommerceColumns,
        ecommerceData
      );

      insights.forEach(insight => {
        expect(insight.actionableRecommendations).toBeInstanceOf(Array);
        expect(insight.actionableRecommendations.length).toBeGreaterThan(0);
        expect(insight.priority).toMatch(/^(critical|high|medium|low)$/);
      });
    });
  });

  describe('createVisualizationStrategy', () => {
    it('should create domain-appropriate visualization strategy', () => {
      const marketingDomain: DataDomain = {
        domain: 'marketing',
        confidence: 0.85,
        reasoning: 'Marketing data',
        characteristics: [],
        typicalVariables: ['conversion_rate', 'ctr'],
        expectedRelationships: []
      };

      const stakeholders: StakeholderProfile[] = [
        {
          role: 'Marketing Manager',
          expertise: 'domain_expert',
          primaryInterests: ['conversion_optimization'],
          visualizationPreferences: [],
          informationNeeds: [],
          decisionContext: 'campaign_optimization'
        }
      ];

      const strategy = DomainAwareIntelligence.createVisualizationStrategy(
        marketingDomain,
        stakeholders
      );

      expect(strategy.primaryChartTypes).toBeInstanceOf(Array);
      expect(strategy.primaryChartTypes.length).toBeGreaterThan(0);
      expect(strategy.domainSpecificPractices).toBeInstanceOf(Array);
      expect(strategy.stakeholderCustomizations).toBeInstanceOf(Array);
    });

    it('should customize strategy for different stakeholder expertise levels', () => {
      const domain: DataDomain = {
        domain: 'finance',
        confidence: 0.9,
        reasoning: 'Financial data',
        characteristics: [],
        typicalVariables: [],
        expectedRelationships: []
      };

      const executiveStakeholder: StakeholderProfile = {
        role: 'CEO',
        expertise: 'executive',
        primaryInterests: ['high_level_metrics'],
        visualizationPreferences: [
          { chartType: 'dashboard', complexity: 'simple', interactivity: 'minimal', reasoning: 'Executive overview' }
        ],
        informationNeeds: [],
        decisionContext: 'strategic_planning'
      };

      const analystStakeholder: StakeholderProfile = {
        role: 'Data Analyst',
        expertise: 'data_analyst',
        primaryInterests: ['detailed_analysis'],
        visualizationPreferences: [
          { chartType: 'scatter_plot', complexity: 'complex', interactivity: 'high', reasoning: 'Detailed exploration' }
        ],
        informationNeeds: [],
        decisionContext: 'data_exploration'
      };

      const executiveStrategy = DomainAwareIntelligence.createVisualizationStrategy(
        domain,
        [executiveStakeholder]
      );

      const analystStrategy = DomainAwareIntelligence.createVisualizationStrategy(
        domain,
        [analystStakeholder]
      );

      expect(executiveStrategy.complexityLevel).toBe('simple');
      expect(analystStrategy.complexityLevel).toMatch(/^(moderate|complex)$/);
    });
  });

  describe('analyzeContext', () => {
    it('should provide comprehensive domain context analysis', () => {
      const context = DomainAwareIntelligence.analyzeDataContext(mockColumnNames, mockDataSample);

      expect(context.primaryDomain).toBeDefined();
      expect(context.confidence).toBeGreaterThan(0);
      expect(context.stakeholders).toBeInstanceOf(Array);
      expect(context.contextClues).toBeInstanceOf(Array);
      expect(context.visualizationStrategy).toBeDefined();
      expect(context.insights).toBeInstanceOf(Array);
    });

    it('should identify relevant context clues', () => {
      const context = DomainAwareIntelligence.analyzeDataContext(mockColumnNames, mockDataSample);

      expect(context.contextClues.length).toBeGreaterThan(0);
      
      const columnClue = context.contextClues.find(c => c.type === 'column_name');
      expect(columnClue).toBeDefined();
      
      const patternClue = context.contextClues.find(c => c.type === 'data_pattern');
      expect(patternClue).toBeDefined();
    });

    it('should provide domain knowledge integration', () => {
      const context = DomainAwareIntelligence.analyzeDataContext(mockColumnNames, mockDataSample);

      expect(context.domainKnowledge).toBeDefined();
      expect(context.domainKnowledge.bestPractices).toBeInstanceOf(Array);
      expect(context.domainKnowledge.commonMistakes).toBeInstanceOf(Array);
      expect(context.domainKnowledge.industryStandards).toBeInstanceOf(Array);
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle empty column names gracefully', () => {
      const context = DomainAwareIntelligence.analyzeDataContext([], []);

      expect(context.primaryDomain.domain).toBe('generic');
      expect(context.confidence).toBeLessThan(0.5);
    });

    it('should handle mixed domain signals', () => {
      const mixedColumns = ['revenue', 'patient_id', 'student_grade', 'order_total'];
      const mixedData = [
        { revenue: 1000, patient_id: 'P001', student_grade: 'A', order_total: 150 }
      ];

      const context = DomainAwareIntelligence.analyzeDataContext(mixedColumns, mixedData);

      expect(context.confidence).toBeLessThan(0.8); // Should be less confident with mixed signals
      expect(context.subdomains.length).toBeGreaterThan(0); // Should identify multiple domains
    });

    it('should handle null or undefined data gracefully', () => {
      const incompleteData = [
        { revenue: null, conversion_rate: undefined, campaign_id: 'CMP001' }
      ];

      const context = DomainAwareIntelligence.analyzeDataContext(mockColumnNames, incompleteData);

      expect(context.primaryDomain).toBeDefined();
      expect(context.insights).toBeInstanceOf(Array);
    });

    it('should provide meaningful fallbacks for unknown domains', () => {
      const obscureColumns = ['mysterious_metric_x', 'enigmatic_value_y', 'cryptic_id_z'];
      const obscureData = [
        { mysterious_metric_x: 42, enigmatic_value_y: 'unknown', cryptic_id_z: 'ABC123' }
      ];

      const context = DomainAwareIntelligence.analyzeDataContext(obscureColumns, obscureData);

      expect(context.primaryDomain.domain).toBe('generic');
      expect(context.stakeholders.length).toBeGreaterThan(0); // Should still provide general stakeholders
      expect(context.visualizationStrategy).toBeDefined();
    });
  });

  describe('domain-specific recommendations', () => {
    it('should recommend funnel charts for marketing conversion data', () => {
      const context = DomainAwareIntelligence.analyzeDataContext(
        ['visitors', 'leads', 'prospects', 'customers'],
        [{ visitors: 1000, leads: 300, prospects: 100, customers: 30 }]
      );

      expect(context.visualizationStrategy.primaryChartTypes).toContain('funnel_chart');
    });

    it('should recommend cohort analysis for user retention data', () => {
      const context = DomainAwareIntelligence.analyzeDataContext(
        ['user_id', 'signup_date', 'last_activity', 'retention_day'],
        [{ user_id: 'U001', signup_date: '2023-01-01', last_activity: '2023-01-15', retention_day: 14 }]
      );

      const cohortInsight = context.insights.find(i => i.insight.includes('cohort'));
      expect(cohortInsight).toBeDefined();
    });

    it('should recommend control charts for operations data', () => {
      const context = DomainAwareIntelligence.analyzeDataContext(
        ['process_id', 'measurement', 'control_limit', 'specification'],
        [{ process_id: 'PROC001', measurement: 98.5, control_limit: 100, specification: 95 }]
      );

      if (context.primaryDomain.domain === 'operations') {
        expect(context.visualizationStrategy.primaryChartTypes).toContain('control_chart');
      }
    });
  });
});