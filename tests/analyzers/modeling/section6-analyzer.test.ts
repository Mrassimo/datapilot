import { Section6Analyzer, Section6Formatter } from '../../../src/analyzers/modeling';
import { writeFileSync, unlinkSync, mkdtempSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('Section6Analyzer - Predictive Modeling Guidance', () => {
  let tempDir: string;
  let tempFile: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'datapilot-section6-test-'));
    tempFile = join(tempDir, 'test.csv');
  });

  afterEach(() => {
    try {
      unlinkSync(tempFile);
    } catch (e) {
      // File might not exist
    }
  });

  describe('Modeling Task Identification', () => {
    it('should identify regression tasks', async () => {
      const csvData = `feature1,feature2,feature3,price
1.5,2.3,0.8,15000
2.1,1.9,1.2,22000
1.8,2.5,0.9,18000
2.3,1.7,1.1,25000
1.9,2.1,1.0,20000`;
      
      writeFileSync(tempFile, csvData, 'utf8');
      
      const analyzer = new Section6Analyzer({
        focusAreas: ['regression', 'binary_classification'],
        complexityPreference: 'moderate',
        interpretabilityRequirement: 'high'
      });
      const result = await analyzer.analyze(tempFile);
      
      expect(result.taskIdentification).toBeDefined();
      expect(result.taskIdentification.primaryTask.type).toBe('regression');
      expect(result.taskIdentification.primaryTask.targetVariable).toBe('price');
      expect(result.taskIdentification.primaryTask.confidence).toBeGreaterThan(0.8);
      
      // Verify reasoning
      expect(result.taskIdentification.primaryTask.reasoning).toContain('continuous');
      expect(result.taskIdentification.primaryTask.reasoning).toContain('numeric');
    });

    it('should identify classification tasks', async () => {
      const csvData = `age,income,education,approved
25,50000,bachelor,yes
35,75000,master,yes
22,30000,high_school,no
45,95000,phd,yes
28,45000,bachelor,no`;
      
      writeFileSync(tempFile, csvData, 'utf8');
      
      const analyzer = new Section6Analyzer({
        focusAreas: ['regression', 'binary_classification'],
        complexityPreference: 'moderate',
        interpretabilityRequirement: 'high'
      });
      const result = await analyzer.analyze(tempFile);
      
      expect(result.taskIdentification.primaryTask.type).toBe('classification');
      expect(result.taskIdentification.primaryTask.targetVariable).toBe('approved');
      expect(result.taskIdentification.primaryTask.subtype).toBe('binary');
      
      // Should identify features
      const features = result.taskIdentification.identifiedFeatures;
      expect(features.numerical).toContain('age');
      expect(features.numerical).toContain('income');
      expect(features.categorical).toContain('education');
    });

    it('should identify clustering scenarios', async () => {
      const csvData = `customer_id,purchase_frequency,avg_amount,tenure
1,10,150.50,24
2,5,75.25,12
3,15,200.75,36
4,8,120.00,18
5,12,180.50,30`;
      
      writeFileSync(tempFile, csvData, 'utf8');
      
      const analyzer = new Section6Analyzer({
        focusAreas: ['regression', 'binary_classification'],
        complexityPreference: 'moderate',
        interpretabilityRequirement: 'high'
      });
      const result = await analyzer.analyze(tempFile);
      
      // Should identify clustering potential
      const alternativeTasks = result.taskIdentification.alternativeTasks;
      const clusteringTask = alternativeTasks.find(task => task.type === 'clustering');
      expect(clusteringTask).toBeDefined();
      expect(clusteringTask?.confidence).toBeGreaterThan(0.5);
    });

    it('should identify time series patterns', async () => {
      const csvData = `date,value,trend
2024-01-01,100,up
2024-01-02,105,up
2024-01-03,110,up
2024-01-04,108,down
2024-01-05,112,up`;
      
      writeFileSync(tempFile, csvData, 'utf8');
      
      const analyzer = new Section6Analyzer({
        focusAreas: ['regression', 'binary_classification'],
        complexityPreference: 'moderate',
        interpretabilityRequirement: 'high'
      });
      const result = await analyzer.analyze(tempFile);
      
      // Should identify time series potential
      const alternativeTasks = result.taskIdentification.alternativeTasks;
      const timeSeriesTask = alternativeTasks.find(task => task.type === 'time_series');
      expect(timeSeriesTask).toBeDefined();
      
      // Should identify temporal column
      expect(result.taskIdentification.temporalColumns).toContain('date');
    });

    it('should identify anomaly detection scenarios', async () => {
      const csvData = `transaction_id,amount,frequency,risk_score
1,100.50,normal,0.1
2,150.75,normal,0.2
3,10000.00,rare,0.9
4,120.25,normal,0.15
5,25000.00,very_rare,0.95`;
      
      writeFileSync(tempFile, csvData, 'utf8');
      
      const analyzer = new Section6Analyzer({
        focusAreas: ['regression', 'binary_classification'],
        complexityPreference: 'moderate',
        interpretabilityRequirement: 'high'
      });
      const result = await analyzer.analyze(tempFile);
      
      // Should identify anomaly detection potential
      const alternativeTasks = result.taskIdentification.alternativeTasks;
      const anomalyTask = alternativeTasks.find(task => task.type === 'anomaly_detection');
      expect(anomalyTask).toBeDefined();
      expect(anomalyTask?.reasoning).toContain('outlier');
    });
  });

  describe('Algorithm Recommendations', () => {
    it('should recommend appropriate regression algorithms', async () => {
      const csvData = `x1,x2,x3,target
1.0,2.0,3.0,10.5
1.5,2.5,3.5,12.8
2.0,3.0,4.0,15.2
2.5,3.5,4.5,17.9
3.0,4.0,5.0,20.1`;
      
      writeFileSync(tempFile, csvData, 'utf8');
      
      const analyzer = new Section6Analyzer({
        focusAreas: ['regression', 'binary_classification'],
        complexityPreference: 'moderate',
        interpretabilityRequirement: 'high'
      });
      const result = await analyzer.analyze(tempFile);
      
      expect(result.algorithmRecommendations).toBeDefined();
      expect(result.algorithmRecommendations.primary).toBeDefined();
      expect(result.algorithmRecommendations.alternatives).toBeDefined();
      
      const primary = result.algorithmRecommendations.primary;
      expect(['linear_regression', 'random_forest', 'gradient_boosting']).toContain(primary.algorithm);
      expect(primary.suitabilityScore).toBeGreaterThan(0.5);
      expect(primary.reasoning).toBeDefined();
      
      // Should recommend multiple frameworks
      expect(primary.frameworks.length).toBeGreaterThan(0);
      expect(primary.frameworks.some(f => ['scikit-learn', 'xgboost', 'tensorflow'].includes(f.name))).toBe(true);
    });

    it('should recommend appropriate classification algorithms', async () => {
      const csvData = `feature1,feature2,category
1.0,2.0,A
1.5,2.5,B
2.0,3.0,A
2.5,3.5,C
3.0,4.0,B`;
      
      writeFileSync(tempFile, csvData, 'utf8');
      
      const analyzer = new Section6Analyzer({
        focusAreas: ['regression', 'binary_classification'],
        complexityPreference: 'moderate',
        interpretabilityRequirement: 'high'
      });
      const result = await analyzer.analyze(tempFile);
      
      const primary = result.algorithmRecommendations.primary;
      expect(['random_forest', 'svm', 'logistic_regression', 'gradient_boosting']).toContain(primary.algorithm);
      
      // Should provide multiclass-specific recommendations
      expect(primary.reasoning).toContain('multiclass');
      
      // Should recommend hyperparameters
      expect(primary.hyperparameters).toBeDefined();
      expect(Object.keys(primary.hyperparameters).length).toBeGreaterThan(0);
    });

    it('should recommend clustering algorithms', async () => {
      const csvData = `x,y,z
1.0,1.0,1.0
1.1,1.1,1.1
5.0,5.0,5.0
5.1,5.1,5.1
10.0,10.0,10.0`;
      
      writeFileSync(tempFile, csvData, 'utf8');
      
      const analyzer = new Section6Analyzer({
        enableClusteringRecommendations: true
      });
      const result = await analyzer.analyze(tempFile);
      
      // Should recommend clustering algorithms
      const clusteringRec = result.algorithmRecommendations.alternatives
        .find(alg => ['kmeans', 'hierarchical', 'dbscan'].includes(alg.algorithm));
      expect(clusteringRec).toBeDefined();
      
      if (clusteringRec) {
        expect(clusteringRec.suitabilityScore).toBeGreaterThan(0.3);
        expect(clusteringRec.hyperparameters).toBeDefined();
      }
    });

    it('should provide detailed algorithm comparisons', async () => {
      const csvData = `f1,f2,f3,target
1,2,3,0
2,3,4,1
3,4,5,0
4,5,6,1
5,6,7,0`;
      
      writeFileSync(tempFile, csvData, 'utf8');
      
      const analyzer = new Section6Analyzer({
        focusAreas: ['regression', 'binary_classification'],
        complexityPreference: 'moderate',
        interpretabilityRequirement: 'high'
      });
      const result = await analyzer.analyze(tempFile);
      
      const comparison = result.algorithmRecommendations.comparison;
      expect(comparison).toBeDefined();
      expect(comparison.length).toBeGreaterThan(1);
      
      // Each comparison should have detailed metrics
      for (const comp of comparison) {
        expect(comp.algorithm).toBeDefined();
        expect(comp.pros).toBeDefined();
        expect(comp.cons).toBeDefined();
        expect(comp.complexity).toBeDefined();
        expect(comp.interpretability).toBeDefined();
        expect(['low', 'medium', 'high']).toContain(comp.complexity);
        expect(['low', 'medium', 'high']).toContain(comp.interpretability);
      }
    });
  });

  describe('CART Methodology Analysis', () => {
    it('should provide detailed CART analysis for decision trees', async () => {
      const csvData = `age,income,education,approved
25,50000,bachelor,yes
35,75000,master,yes
22,30000,high_school,no
45,95000,phd,yes
28,45000,bachelor,no`;
      
      writeFileSync(tempFile, csvData, 'utf8');
      
      const analyzer = new Section6Analyzer({
        enableCARTAnalysis: true
      });
      const result = await analyzer.analyze(tempFile);
      
      expect(result.cartAnalysis).toBeDefined();
      expect(result.cartAnalysis.applicability).toBeDefined();
      expect(result.cartAnalysis.applicability.suitable).toBe(true);
      
      // Should provide mathematical foundations
      expect(result.cartAnalysis.mathematicalFoundations).toBeDefined();
      expect(result.cartAnalysis.mathematicalFoundations.giniImpurity).toBeDefined();
      expect(result.cartAnalysis.mathematicalFoundations.entropyMeasures).toBeDefined();
      
      // Should suggest splitting criteria
      expect(result.cartAnalysis.splittingCriteria).toBeDefined();
      expect(result.cartAnalysis.splittingCriteria.length).toBeGreaterThan(0);
      
      // Should provide business rule translation
      expect(result.cartAnalysis.businessRuleTranslation).toBeDefined();
      expect(result.cartAnalysis.businessRuleTranslation.length).toBeGreaterThan(0);
    });

    it('should calculate feature importance for CART', async () => {
      const csvData = `important_feature,noise_feature,constant_feature,target
10,1,1,high
20,2,1,medium
30,3,1,low
40,4,1,high
50,5,1,medium`;
      
      writeFileSync(tempFile, csvData, 'utf8');
      
      const analyzer = new Section6Analyzer({
        enableCARTAnalysis: true
      });
      const result = await analyzer.analyze(tempFile);
      
      const featureImportance = result.cartAnalysis.featureImportance;
      expect(featureImportance).toBeDefined();
      expect(featureImportance.length).toBeGreaterThan(0);
      
      // Important feature should have higher score than noise
      const importantFeature = featureImportance.find(f => f.featureName === 'important_feature');
      const noiseFeature = featureImportance.find(f => f.featureName === 'noise_feature');
      
      expect(importantFeature).toBeDefined();
      expect(noiseFeature).toBeDefined();
      expect(importantFeature!.importanceScore).toBeGreaterThan(noiseFeature!.importanceScore);
    });
  });

  describe('Residual Analysis', () => {
    it('should perform comprehensive residual analysis for regression', async () => {
      const csvData = `x,y
1,2.1
2,3.9
3,6.2
4,7.8
5,10.1
6,11.9
7,14.2
8,15.8`;
      
      writeFileSync(tempFile, csvData, 'utf8');
      
      const analyzer = new Section6Analyzer({
        enableResidualAnalysis: true
      });
      const result = await analyzer.analyze(tempFile);
      
      expect(result.residualAnalysis).toBeDefined();
      expect(result.residualAnalysis.applicable).toBe(true);
      
      // Should provide diagnostic plots descriptions
      expect(result.residualAnalysis.diagnosticPlots).toBeDefined();
      expect(result.residualAnalysis.diagnosticPlots.residualVsFitted).toBeDefined();
      expect(result.residualAnalysis.diagnosticPlots.normalQQ).toBeDefined();
      expect(result.residualAnalysis.diagnosticPlots.scaleLoc).toBeDefined();
      expect(result.residualAnalysis.diagnosticPlots.residualVsLeverage).toBeDefined();
      
      // Should perform statistical tests
      expect(result.residualAnalysis.statisticalTests).toBeDefined();
      expect(result.residualAnalysis.statisticalTests.shapiroWilk).toBeDefined();
      expect(result.residualAnalysis.statisticalTests.breuschPagan).toBeDefined();
      expect(result.residualAnalysis.statisticalTests.durbinWatson).toBeDefined();
      
      // Should identify outliers
      expect(result.residualAnalysis.outlierAnalysis).toBeDefined();
      expect(result.residualAnalysis.outlierAnalysis.method).toBe('cooks_distance');
    });

    it('should identify model assumptions violations', async () => {
      const csvData = `x,y
1,1
2,4
3,9
4,16
5,25
6,36
7,49
8,64`; // Non-linear relationship
      
      writeFileSync(tempFile, csvData, 'utf8');
      
      const analyzer = new Section6Analyzer({
        enableResidualAnalysis: true
      });
      const result = await analyzer.analyze(tempFile);
      
      const assumptions = result.residualAnalysis.assumptionChecks;
      expect(assumptions).toBeDefined();
      
      // Should check linearity
      expect(assumptions.linearity).toBeDefined();
      expect(assumptions.linearity.satisfied).toBe(false); // Should detect non-linearity
      
      // Should check other assumptions
      expect(assumptions.homoscedasticity).toBeDefined();
      expect(assumptions.normalResiduals).toBeDefined();
      expect(assumptions.independence).toBeDefined();
    });
  });

  describe('Ethics and Bias Analysis', () => {
    it('should identify potential bias in features', async () => {
      const csvData = `age,gender,race,income,approved
25,male,white,50000,yes
30,female,black,45000,no
35,male,hispanic,55000,yes
28,female,white,48000,no
40,male,asian,60000,yes`;
      
      writeFileSync(tempFile, csvData, 'utf8');
      
      const analyzer = new Section6Analyzer({
        enableEthicsAnalysis: true
      });
      const result = await analyzer.analyze(tempFile);
      
      expect(result.ethicsAnalysis).toBeDefined();
      expect(result.ethicsAnalysis.biasIdentification).toBeDefined();
      
      const biasFeatures = result.ethicsAnalysis.biasIdentification.potentialBiasFeatures;
      expect(biasFeatures).toBeDefined();
      expect(biasFeatures.some(f => f.featureName === 'gender')).toBe(true);
      expect(biasFeatures.some(f => f.featureName === 'race')).toBe(true);
    });

    it('should recommend fairness metrics', async () => {
      const csvData = `feature1,protected_attribute,target
1.0,group_a,positive
1.5,group_b,negative
2.0,group_a,positive
2.5,group_b,negative
3.0,group_a,positive`;
      
      writeFileSync(tempFile, csvData, 'utf8');
      
      const analyzer = new Section6Analyzer({
        enableEthicsAnalysis: true
      });
      const result = await analyzer.analyze(tempFile);
      
      const fairnessMetrics = result.ethicsAnalysis.fairnessMetrics;
      expect(fairnessMetrics).toBeDefined();
      expect(fairnessMetrics.recommendedMetrics).toBeDefined();
      expect(fairnessMetrics.recommendedMetrics.length).toBeGreaterThan(0);
      
      // Should recommend standard fairness metrics
      const metricNames = fairnessMetrics.recommendedMetrics.map(m => m.name);
      expect(metricNames.some(name => ['demographic_parity', 'equalized_odds', 'calibration'].includes(name))).toBe(true);
    });

    it('should provide governance recommendations', async () => {
      const csvData = `sensitive_data,public_data,target
1,10,yes
2,20,no
3,30,yes
4,40,no
5,50,yes`;
      
      writeFileSync(tempFile, csvData, 'utf8');
      
      const analyzer = new Section6Analyzer({
        enableEthicsAnalysis: true
      });
      const result = await analyzer.analyze(tempFile);
      
      const governance = result.ethicsAnalysis.governanceRecommendations;
      expect(governance).toBeDefined();
      expect(governance.dataGovernance).toBeDefined();
      expect(governance.modelGovernance).toBeDefined();
      expect(governance.complianceRequirements).toBeDefined();
      
      // Should provide actionable recommendations
      expect(governance.dataGovernance.length).toBeGreaterThan(0);
      expect(governance.modelGovernance.length).toBeGreaterThan(0);
    });
  });

  describe('Domain-Specific Analysis', () => {
    it('should provide educational domain insights', async () => {
      const csvData = `student_id,study_hours,attendance,grade
1,10,95,A
2,5,80,C
3,15,98,A
4,8,85,B
5,3,70,D`;
      
      writeFileSync(tempFile, csvData, 'utf8');
      
      const analyzer = new Section6Analyzer({
        domainContext: 'education'
      });
      const result = await analyzer.analyze(tempFile);
      
      expect(result.domainInsights).toBeDefined();
      expect(result.domainInsights.domain).toBe('education');
      expect(result.domainInsights.specificRecommendations).toBeDefined();
      
      // Should provide education-specific insights
      const recommendations = result.domainInsights.specificRecommendations;
      expect(recommendations.some(rec => rec.includes('student') || rec.includes('learning'))).toBe(true);
    });

    it('should adapt recommendations for different stakeholders', async () => {
      const csvData = `metric1,metric2,outcome
1,2,success
3,4,failure
5,6,success`;
      
      writeFileSync(tempFile, csvData, 'utf8');
      
      const analyzer = new Section6Analyzer({
        focusAreas: ['regression', 'binary_classification'],
        complexityPreference: 'moderate',
        interpretabilityRequirement: 'high'
      });
      const result = await analyzer.analyze(tempFile);
      
      expect(result.stakeholderRecommendations).toBeDefined();
      expect(result.stakeholderRecommendations.technical).toBeDefined();
      expect(result.stakeholderRecommendations.business).toBeDefined();
      expect(result.stakeholderRecommendations.executive).toBeDefined();
      
      // Each stakeholder should have appropriate level of detail
      expect(result.stakeholderRecommendations.technical.detail).toBe('high');
      expect(result.stakeholderRecommendations.business.detail).toBe('medium');
      expect(result.stakeholderRecommendations.executive.detail).toBe('low');
    });
  });

  describe('Performance and Configuration', () => {
    it('should handle large datasets efficiently', async () => {
      // Create a larger dataset
      let csvData = 'id,feature1,feature2,target\n';
      for (let i = 0; i < 500; i++) {
        csvData += `${i},${Math.random()},${Math.random()},${i % 2 === 0 ? 'A' : 'B'}\n`;
      }
      
      writeFileSync(tempFile, csvData, 'utf8');
      
      const startTime = Date.now();
      const analyzer = new Section6Analyzer({
        focusAreas: ['regression', 'binary_classification'],
        complexityPreference: 'moderate',
        interpretabilityRequirement: 'high'
      });
      const result = await analyzer.analyze(tempFile);
      const endTime = Date.now();
      
      expect(result).toBeDefined();
      expect(endTime - startTime).toBeLessThan(10000); // Should complete in under 10 seconds
      expect(result.performanceMetrics.recordsAnalyzed).toBe(500);
    }, 15000);

    it('should respect configuration options', async () => {
      const csvData = 'x,y\n1,2\n3,4\n5,6';
      writeFileSync(tempFile, csvData, 'utf8');
      
      const analyzer = new Section6Analyzer({
        maxRecordsForAnalysis: 2,
        enableCARTAnalysis: false,
        enableResidualAnalysis: false,
        enableEthicsAnalysis: false
      });
      
      const result = await analyzer.analyze(tempFile);
      
      expect(result.summary.recordsAnalyzed).toBeLessThanOrEqual(2);
      expect(result.cartAnalysis).toBeUndefined();
      expect(result.residualAnalysis).toBeUndefined();
      expect(result.ethicsAnalysis).toBeUndefined();
    });

    it('should validate configuration parameters', () => {
      const analyzer = new Section6Analyzer({
        maxRecordsForAnalysis: -1, // Invalid
        confidenceThreshold: 1.5 // Invalid (should be 0-1)
      });
      
      const validation = analyzer.validateConfig();
      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle datasets with insufficient data', async () => {
      const csvData = 'x,y\n1,2';
      writeFileSync(tempFile, csvData, 'utf8');
      
      const analyzer = new Section6Analyzer({
        focusAreas: ['regression', 'binary_classification'],
        complexityPreference: 'moderate',
        interpretabilityRequirement: 'high'
      });
      const result = await analyzer.analyze(tempFile);
      
      expect(result.warnings).toBeDefined();
      expect(result.warnings.some(w => w.includes('insufficient data'))).toBe(true);
      
      // Should still provide basic recommendations
      expect(result.taskIdentification).toBeDefined();
      expect(result.algorithmRecommendations).toBeDefined();
    });

    it('should handle datasets with all missing targets', async () => {
      const csvData = 'feature1,feature2,target\n1,2,\n3,4,\n5,6,';
      writeFileSync(tempFile, csvData, 'utf8');
      
      const analyzer = new Section6Analyzer({
        focusAreas: ['regression', 'binary_classification'],
        complexityPreference: 'moderate',
        interpretabilityRequirement: 'high'
      });
      const result = await analyzer.analyze(tempFile);
      
      expect(result.warnings).toBeDefined();
      expect(result.warnings.some(w => w.includes('missing target'))).toBe(true);
      
      // Should recommend unsupervised learning
      const clustering = result.taskIdentification.alternativeTasks
        .find(task => task.type === 'clustering');
      expect(clustering).toBeDefined();
    });

    it('should handle datasets with only categorical features', async () => {
      const csvData = 'cat1,cat2,cat3,target\nA,X,M,yes\nB,Y,N,no\nC,Z,O,yes';
      writeFileSync(tempFile, csvData, 'utf8');
      
      const analyzer = new Section6Analyzer({
        focusAreas: ['regression', 'binary_classification'],
        complexityPreference: 'moderate',
        interpretabilityRequirement: 'high'
      });
      const result = await analyzer.analyze(tempFile);
      
      // Should recommend algorithms suitable for categorical data
      const primary = result.algorithmRecommendations.primary;
      expect(['naive_bayes', 'decision_tree', 'random_forest'].includes(primary.algorithm)).toBe(true);
      
      // Should recommend appropriate preprocessing
      expect(result.preprocessingRecommendations).toBeDefined();
      expect(result.preprocessingRecommendations.categoricalEncoding).toBeDefined();
    });
  });
});

describe('Section6Formatter', () => {
  it('should format complete modeling report', async () => {
    const csvData = 'feature1,feature2,target\n1,2,A\n3,4,B\n5,6,A';
    const tempFile = join(tmpdir(), 'formatter-test.csv');
    writeFileSync(tempFile, csvData, 'utf8');
    
    try {
      const analyzer = new Section6Analyzer({
        focusAreas: ['regression', 'binary_classification'],
        complexityPreference: 'moderate',
        interpretabilityRequirement: 'high'
      });
      const result = await analyzer.analyze(tempFile);
      const formatter = new Section6Formatter();
      
      const report = formatter.formatReport(result);
      
      // Verify report structure
      expect(report).toContain('Section 6: Predictive Modeling & Analytics Guidance');
      expect(report).toContain('6.1. Modeling Task Identification & Feature Analysis');
      expect(report).toContain('6.2. Algorithm Recommendations & Suitability Analysis');
      expect(report).toContain('6.3. CART Methodology Deep Dive');
      expect(report).toContain('6.4. Model Validation & Residual Analysis');
      expect(report).toContain('6.5. Ethics, Bias & Responsible AI Considerations');
      
      // Test summary format
      const summary = formatter.formatSummary(result);
      expect(summary).toContain('Modeling Summary');
      expect(summary).toContain('Primary Task');
      
    } finally {
      unlinkSync(tempFile);
    }
  });

  it('should format JSON output correctly', async () => {
    const csvData = 'x,y\n1,2\n3,4';
    const tempFile = join(tmpdir(), 'json-test.csv');
    writeFileSync(tempFile, csvData, 'utf8');
    
    try {
      const analyzer = new Section6Analyzer({
        focusAreas: ['regression', 'binary_classification'],
        complexityPreference: 'moderate',
        interpretabilityRequirement: 'high'
      });
      const result = await analyzer.analyze(tempFile);
      const formatter = new Section6Formatter();
      
      const jsonOutput = formatter.formatJSON(result);
      const parsed = JSON.parse(jsonOutput);
      
      expect(parsed).toHaveProperty('section');
      expect(parsed).toHaveProperty('summary');
      expect(parsed).toHaveProperty('taskIdentification');
      expect(parsed).toHaveProperty('algorithmRecommendations');
      
    } finally {
      unlinkSync(tempFile);
    }
  });

  it('should format stakeholder-specific reports', async () => {
    const csvData = 'feature,target\n1,A\n2,B';
    const tempFile = join(tmpdir(), 'stakeholder-test.csv');
    writeFileSync(tempFile, csvData, 'utf8');
    
    try {
      const analyzer = new Section6Analyzer({
        focusAreas: ['regression', 'binary_classification'],
        complexityPreference: 'moderate',
        interpretabilityRequirement: 'high'
      });
      const result = await analyzer.analyze(tempFile);
      const formatter = new Section6Formatter();
      
      const techReport = formatter.formatForStakeholder(result, 'technical');
      const bizReport = formatter.formatForStakeholder(result, 'business');
      const execReport = formatter.formatForStakeholder(result, 'executive');
      
      // Technical report should have more detail
      expect(techReport.length).toBeGreaterThan(bizReport.length);
      expect(bizReport.length).toBeGreaterThan(execReport.length);
      
      // Executive report should focus on business value
      expect(execReport).toContain('business');
      expect(execReport).toContain('ROI');
      
    } finally {
      unlinkSync(tempFile);
    }
  });
});
