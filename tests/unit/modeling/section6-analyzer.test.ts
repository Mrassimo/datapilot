/**
 * Section 6 Modeling Analyzer Tests
 * 
 * Tests the comprehensive predictive modeling and advanced analytics guidance analyzer
 * that provides algorithm recommendations, workflow guidance, evaluation frameworks,
 * and implementation roadmaps.
 */

import { Section6Analyzer } from '../../../src/analyzers/modeling/section6-analyzer';
import type { 
  Section6Config, 
  ModelingTaskType,
  AlgorithmCategory,
  ModelComplexity,
  InterpretabilityLevel,
  ConfidenceLevel
} from '../../../src/analyzers/modeling/types';
import type { Section1Result } from '../../../src/analyzers/overview/types';
import type { Section2Result } from '../../../src/analyzers/quality/types';
import type { Section3Result } from '../../../src/analyzers/eda/types';
import type { Section5Result } from '../../../src/analyzers/engineering/types';

describe('Section6Analyzer', () => {
  describe('Comprehensive Modeling Analysis', () => {
    it('should perform complete modeling analysis with all components', async () => {
      const section1Result = createMockSection1Result();
      const section2Result = createMockSection2Result();
      const section3Result = createMockSection3Result();
      const section5Result = createMockSection5Result();

      const config: Section6Config = {
        focusAreas: ['regression', 'binary_classification', 'clustering'],
        complexityPreference: 'moderate',
        interpretabilityRequirement: 'medium',
        ethicsLevel: 'standard',
        includeAdvancedMethods: true,
        performanceThresholds: {
          minModelAccuracy: 0.8,
          maxComplexity: 0.7,
          minInterpretability: 0.6,
        },
      };

      const analyzer = new Section6Analyzer(config);
      const result = await analyzer.analyze(
        section1Result, 
        section2Result, 
        section3Result, 
        section5Result
      );

      // Should include all major modeling analysis components
      expect(result.modelingAnalysis.identifiedTasks).toBeDefined();
      expect(result.modelingAnalysis.algorithmRecommendations).toBeDefined();
      expect(result.modelingAnalysis.workflowGuidance).toBeDefined();
      expect(result.modelingAnalysis.evaluationFramework).toBeDefined();
      expect(result.modelingAnalysis.interpretationGuidance).toBeDefined();
      expect(result.modelingAnalysis.ethicsAnalysis).toBeDefined();
      expect(result.modelingAnalysis.implementationRoadmap).toBeDefined();

      // Should identify at least one modeling task
      expect(result.modelingAnalysis.identifiedTasks.length).toBeGreaterThan(0);
      expect(result.modelingAnalysis.algorithmRecommendations.length).toBeGreaterThan(0);

      // Should provide performance metrics
      expect(result.performanceMetrics.analysisTimeMs).toBeGreaterThanOrEqual(0);
      expect(result.performanceMetrics.tasksIdentified).toBeGreaterThan(0);
      expect(result.performanceMetrics.algorithmsEvaluated).toBeGreaterThan(0);

      // Should include metadata
      expect(result.metadata.analysisApproach).toBeDefined();
      expect(result.metadata.complexityLevel).toBeDefined();
      expect(result.metadata.recommendationConfidence).toBeDefined();
    });

    it('should adapt analysis based on complexity preference', async () => {
      const simpleConfig: Partial<Section6Config> = {
        focusAreas: ['regression'],
        complexityPreference: 'simple',
        interpretabilityRequirement: 'high',
      };

      const complexConfig: Partial<Section6Config> = {
        focusAreas: ['regression'],
        complexityPreference: 'complex',
        interpretabilityRequirement: 'low',
      };

      const analyzer1 = new Section6Analyzer(simpleConfig);
      const analyzer2 = new Section6Analyzer(complexConfig);

      const section1 = createMockSection1Result();
      const section2 = createMockSection2Result();
      const section3 = createMockSection3Result();
      const section5 = createMockSection5Result();

      const simpleResult = await analyzer1.analyze(section1, section2, section3, section5);
      const complexResult = await analyzer2.analyze(section1, section2, section3, section5);

      // Simple config should recommend simpler algorithms
      const simpleAlgorithms = simpleResult.modelingAnalysis.algorithmRecommendations;
      const complexAlgorithms = complexResult.modelingAnalysis.algorithmRecommendations;

      expect(simpleAlgorithms.length).toBeGreaterThan(0);
      expect(complexAlgorithms.length).toBeGreaterThan(0);

      // Should have different complexity characteristics
      const simpleComplexities = simpleAlgorithms.map(alg => alg.complexity);
      const complexComplexities = complexAlgorithms.map(alg => alg.complexity);

      expect(simpleComplexities.includes('simple')).toBe(true);
      expect(complexComplexities.includes('complex')).toBe(true);
    });

    it('should provide interpretability-focused recommendations', async () => {
      const interpretableConfig: Partial<Section6Config> = {
        focusAreas: ['binary_classification'],
        interpretabilityRequirement: 'high',
        ethicsLevel: 'comprehensive',
      };

      const analyzer = new Section6Analyzer(interpretableConfig);
      const result = await analyzer.analyze(
        createMockSection1Result(),
        createMockSection2Result(), 
        createMockSection3Result(),
        createMockSection5Result()
      );

      const algorithms = result.modelingAnalysis.algorithmRecommendations;

      // Should prioritise interpretable algorithms
      expect(algorithms.length).toBeGreaterThan(0);
      algorithms.forEach(algorithm => {
        expect(['high', 'medium']).toContain(algorithm.interpretability);
      });

      // Should provide interpretation guidance
      const interpretationGuidance = result.modelingAnalysis.interpretationGuidance;
      expect(interpretationGuidance.globalInterpretation).toBeDefined();
      expect(interpretationGuidance.localInterpretation).toBeDefined();
      expect(interpretationGuidance.featureImportance).toBeDefined();
    });
  });

  describe('Task Identification and Algorithm Recommendation', () => {
    it('should identify regression tasks for continuous targets', async () => {
      const section1Result = createMockSection1Result({
        targetColumn: 'price',
        targetType: 'continuous'
      });

      const analyzer = new Section6Analyzer({ focusAreas: ['regression'] });
      const result = await analyzer.analyze(
        section1Result,
        createMockSection2Result(),
        createMockSection3Result(),
        createMockSection5Result()
      );

      const regressionTasks = result.modelingAnalysis.identifiedTasks.filter(
        task => task.taskType === 'regression'
      );

      expect(regressionTasks.length).toBeGreaterThan(0);
      
      const regressionTask = regressionTasks[0];
      expect(regressionTask.targetVariable).toBe('price');
      expect(regressionTask.targetType).toBe('continuous');
      expect(regressionTask.businessObjective).toBeDefined();
      expect(regressionTask.feasibilityScore).toBeGreaterThan(0);
      expect(['very_high', 'high', 'medium', 'low']).toContain(regressionTask.confidenceLevel);
    });

    it('should identify classification tasks for categorical targets', async () => {
      const section1Result = createMockSection1Result({
        targetColumn: 'category',
        targetType: 'binary'
      });

      const analyzer = new Section6Analyzer({ focusAreas: ['binary_classification'] });
      const result = await analyzer.analyze(
        section1Result,
        createMockSection2Result(),
        createMockSection3Result(),
        createMockSection5Result()
      );

      const classificationTasks = result.modelingAnalysis.identifiedTasks.filter(
        task => task.taskType === 'binary_classification'
      );

      expect(classificationTasks.length).toBeGreaterThan(0);
      
      const classificationTask = classificationTasks[0];
      expect(classificationTask.targetVariable).toBe('category');
      expect(classificationTask.targetType).toBe('binary');
      expect(classificationTask.inputFeatures.length).toBeGreaterThan(0);
      expect(classificationTask.potentialChallenges).toBeDefined();
    });

    it('should identify clustering tasks for unsupervised scenarios', async () => {
      const section1Result = createMockSection1Result({
        targetColumn: null,
        targetType: 'none'
      });

      const analyzer = new Section6Analyzer({ focusAreas: ['clustering'] });
      const result = await analyzer.analyze(
        section1Result,
        createMockSection2Result(),
        createMockSection3Result(),
        createMockSection5Result()
      );

      const clusteringTasks = result.modelingAnalysis.identifiedTasks.filter(
        task => task.taskType === 'clustering'
      );

      expect(clusteringTasks.length).toBeGreaterThan(0);
      
      const clusteringTask = clusteringTasks[0];
      expect(clusteringTask.targetType).toBe('none');
      expect(clusteringTask.businessObjective).toContain('group');
      expect(clusteringTask.inputFeatures.length).toBeGreaterThan(0);
    });

    it('should recommend appropriate algorithms for each task type', async () => {
      const analyzer = new Section6Analyzer({
        focusAreas: ['regression', 'binary_classification', 'clustering'],
        includeAdvancedMethods: true
      });

      const result = await analyzer.analyze(
        createMockSection1Result(),
        createMockSection2Result(),
        createMockSection3Result(),
        createMockSection5Result()
      );

      const algorithms = result.modelingAnalysis.algorithmRecommendations;
      expect(algorithms.length).toBeGreaterThan(0);

      algorithms.forEach(algorithm => {
        // Should have required algorithm properties
        expect(algorithm.algorithmName).toBeDefined();
        expect(algorithm.category).toBeDefined();
        expect(['simple', 'moderate', 'complex', 'advanced']).toContain(algorithm.complexity);
        expect(['high', 'medium', 'low', 'black_box']).toContain(algorithm.interpretability);
        expect(algorithm.suitabilityScore).toBeGreaterThanOrEqual(0);
        expect(algorithm.suitabilityScore).toBeLessThanOrEqual(100);

        // Should provide implementation guidance
        expect(algorithm.strengths.length).toBeGreaterThan(0);
        expect(algorithm.weaknesses.length).toBeGreaterThan(0);
        expect(algorithm.dataRequirements).toBeDefined();
        expect(algorithm.hyperparameters.length).toBeGreaterThan(0);
      });
    });

    it('should provide algorithm-specific hyperparameter guidance', async () => {
      const analyzer = new Section6Analyzer({ 
        focusAreas: ['regression'],
        includeAdvancedMethods: true
      });

      const result = await analyzer.analyze(
        createMockSection1Result(),
        createMockSection2Result(),
        createMockSection3Result(),
        createMockSection5Result()
      );

      const algorithms = result.modelingAnalysis.algorithmRecommendations;
      expect(algorithms.length).toBeGreaterThan(0);

      algorithms.forEach(algorithm => {
        expect(algorithm.hyperparameters.length).toBeGreaterThan(0);
        
        algorithm.hyperparameters.forEach(param => {
          expect(param.parameterName).toBeDefined();
          expect(param.description).toBeDefined();
          expect(param.recommendedRange).toBeDefined();
          expect(param.defaultValue).toBeDefined();
          expect(param.tuningStrategy).toBeDefined();
        });
      });
    });
  });

  describe('Workflow Guidance and Evaluation Framework', () => {
    it('should generate comprehensive workflow guidance', async () => {
      const analyzer = new Section6Analyzer();
      const result = await analyzer.analyze(
        createMockSection1Result(),
        createMockSection2Result(),
        createMockSection3Result(),
        createMockSection5Result()
      );

      const workflow = result.modelingAnalysis.workflowGuidance;

      // Should provide structured workflow steps
      expect(workflow.workflowSteps.length).toBeGreaterThan(0);
      workflow.workflowSteps.forEach(step => {
        expect(step.stepName).toBeDefined();
        expect(step.description).toBeDefined();
        expect(step.estimatedTime).toBeDefined();
        expect(step.tools.length).toBeGreaterThanOrEqual(0);
      });

      // Should include best practices
      expect(workflow.bestPractices.length).toBeGreaterThan(0);
      workflow.bestPractices.forEach(practice => {
        expect(practice.category).toBeDefined();
        expect(practice.practice).toBeDefined();
        expect(practice.reasoning).toBeDefined();
      });

      // Should provide data splitting strategy
      expect(workflow.dataSplittingStrategy.strategy).toBeDefined();
      expect(workflow.dataSplittingStrategy.reasoning).toBeDefined();
      expect(workflow.crossValidationApproach.method).toBeDefined();
    });

    it('should create appropriate evaluation frameworks', async () => {
      const analyzer = new Section6Analyzer({
        focusAreas: ['binary_classification'],
        performanceThresholds: {
          minModelAccuracy: 0.85,
          maxComplexity: 0.6,
          minInterpretability: 0.7,
        }
      });

      const result = await analyzer.analyze(
        createMockSection1Result(),
        createMockSection2Result(),
        createMockSection3Result(),
        createMockSection5Result()
      );

      const evaluation = result.modelingAnalysis.evaluationFramework;

      // Should provide comprehensive metrics
      expect(evaluation.primaryMetrics.length).toBeGreaterThan(0);
      expect(evaluation.secondaryMetrics.length).toBeGreaterThan(0);
      
      evaluation.primaryMetrics.forEach(metric => {
        expect(metric.metricName).toBeDefined();
        expect(metric.description).toBeDefined();
        expect(metric.interpretation).toBeDefined();
        expect(metric.calculationMethod).toBeDefined();
      });

      // Should include interpretation guidelines
      expect(evaluation.interpretationGuidelines.length).toBeGreaterThan(0);
      evaluation.interpretationGuidelines.forEach(guideline => {
        expect(guideline.metricName).toBeDefined();
        expect(guideline.valueRanges.length).toBeGreaterThan(0);
        expect(guideline.contextualFactors).toBeDefined();
      });

      // Should provide benchmark comparisons
      expect(evaluation.benchmarkComparisons.length).toBeGreaterThan(0);
      expect(evaluation.robustnessTests.length).toBeGreaterThan(0);
    });

    it('should adapt evaluation metrics to task type', async () => {
      const regressionAnalyzer = new Section6Analyzer({ focusAreas: ['regression'] });
      const classificationAnalyzer = new Section6Analyzer({ focusAreas: ['binary_classification'] });

      const regressionResult = await regressionAnalyzer.analyze(
        createMockSection1Result({ targetType: 'continuous' }),
        createMockSection2Result(),
        createMockSection3Result(),
        createMockSection5Result()
      );

      const classificationResult = await classificationAnalyzer.analyze(
        createMockSection1Result({ targetType: 'binary' }),
        createMockSection2Result(),
        createMockSection3Result(),
        createMockSection5Result()
      );

      const regressionMetrics = regressionResult.modelingAnalysis.evaluationFramework.primaryMetrics;
      const classificationMetrics = classificationResult.modelingAnalysis.evaluationFramework.primaryMetrics;

      // Should have different metrics for different task types
      const regressionMetricNames = regressionMetrics.map(m => m.metricName);
      const classificationMetricNames = classificationMetrics.map(m => m.metricName);

      expect(regressionMetricNames.some(name => name.toLowerCase().includes('rmse'))).toBe(true);
      expect(classificationMetricNames.some(name => name.toLowerCase().includes('accuracy'))).toBe(true);
    });
  });

  describe('Ethics Analysis and Implementation Roadmap', () => {
    it('should perform comprehensive ethics analysis', async () => {
      const analyzer = new Section6Analyzer({
        ethicsLevel: 'comprehensive',
        focusAreas: ['binary_classification']
      });

      const result = await analyzer.analyze(
        createMockSection1Result(),
        createMockSection2Result(),
        createMockSection3Result(),
        createMockSection5Result()
      );

      const ethics = result.modelingAnalysis.ethicsAnalysis;

      // Should provide bias assessment
      expect(ethics.biasAssessment.potentialBiasSources.length).toBeGreaterThanOrEqual(0);
      expect(ethics.biasAssessment.overallRiskLevel).toBeDefined();
      expect(['low', 'medium', 'high', 'critical']).toContain(ethics.biasAssessment.overallRiskLevel);

      // Should provide fairness metrics
      expect(ethics.fairnessMetrics.length).toBeGreaterThanOrEqual(0);
      ethics.fairnessMetrics.forEach(metric => {
        expect(metric.metricName).toBeDefined();
        expect(metric.value).toBeDefined();
        expect(metric.interpretation).toBeDefined();
      });

      // Should assess ethical considerations
      expect(ethics.ethicalConsiderations.length).toBeGreaterThan(0);
      ethics.ethicalConsiderations.forEach(consideration => {
        expect(consideration.consideration).toBeDefined();
        expect(consideration.domain).toBeDefined();
        expect(['low', 'medium', 'high', 'critical']).toContain(consideration.riskLevel);
      });
    });

    it('should generate detailed implementation roadmap', async () => {
      const analyzer = new Section6Analyzer();
      const result = await analyzer.analyze(
        createMockSection1Result(),
        createMockSection2Result(),
        createMockSection3Result(),
        createMockSection5Result()
      );

      const roadmap = result.modelingAnalysis.implementationRoadmap;

      // Should provide structured phases
      expect(roadmap.phases.length).toBeGreaterThan(0);
      roadmap.phases.forEach(phase => {
        expect(phase.phaseName).toBeDefined();
        expect(phase.duration).toBeDefined();
        expect(phase.deliverables.length).toBeGreaterThan(0);
        expect(phase.dependencies).toBeDefined();
        expect(['low', 'medium', 'high', 'critical']).toContain(phase.riskLevel);
      });

      // Should estimate timeline and resources
      expect(roadmap.estimatedTimeline).toBeDefined();
      expect(roadmap.resourceRequirements.length).toBeGreaterThan(0);
      
      roadmap.resourceRequirements.forEach(resource => {
        expect(['computational', 'human', 'data', 'infrastructure']).toContain(resource.resourceType);
        expect(resource.requirement).toBeDefined();
        expect(['essential', 'important', 'optional']).toContain(resource.criticality);
        expect(resource.alternatives).toBeDefined();
      });

      // Should identify risks and success criteria
      expect(roadmap.riskFactors.length).toBeGreaterThan(0);
      expect(roadmap.successCriteria.length).toBeGreaterThan(0);
    });

    it('should adapt roadmap complexity to project requirements', async () => {
      const simpleAnalyzer = new Section6Analyzer({
        complexityPreference: 'simple',
        focusAreas: ['regression']
      });

      const complexAnalyzer = new Section6Analyzer({
        complexityPreference: 'complex',
        includeAdvancedMethods: true,
        focusAreas: ['multiclass_classification', 'clustering']
      });

      const simpleResult = await simpleAnalyzer.analyze(
        createMockSection1Result(),
        createMockSection2Result(),
        createMockSection3Result(),
        createMockSection5Result()
      );

      const complexResult = await complexAnalyzer.analyze(
        createMockSection1Result(),
        createMockSection2Result(),
        createMockSection3Result(),
        createMockSection5Result()
      );

      const simpleRoadmap = simpleResult.modelingAnalysis.implementationRoadmap;
      const complexRoadmap = complexResult.modelingAnalysis.implementationRoadmap;

      // Complex projects should have more phases and longer timelines
      expect(complexRoadmap.phases.length).toBeGreaterThanOrEqual(simpleRoadmap.phases.length);
      expect(complexRoadmap.resourceRequirements.length).toBeGreaterThanOrEqual(simpleRoadmap.resourceRequirements.length);
    });
  });

  describe('Specialized Analyses (CART and Residual)', () => {
    it('should provide CART analysis when applicable', async () => {
      const analyzer = new Section6Analyzer({
        focusAreas: ['binary_classification'],
        includeAdvancedMethods: true
      });

      const result = await analyzer.analyze(
        createMockSection1Result(),
        createMockSection2Result(),
        createMockSection3Result(),
        createMockSection5Result()
      );

      if (result.modelingAnalysis.cartAnalysis) {
        const cart = result.modelingAnalysis.cartAnalysis;

        expect(cart.methodology).toBeDefined();
        expect(['gini', 'entropy', 'variance_reduction']).toContain(cart.splittingCriterion);
        expect(cart.stoppingCriteria.length).toBeGreaterThan(0);
        expect(cart.featureImportance.length).toBeGreaterThan(0);
        
        cart.featureImportance.forEach(feature => {
          expect(feature.featureName).toBeDefined();
          expect(feature.importance).toBeGreaterThanOrEqual(0);
          expect(feature.rank).toBeGreaterThan(0);
        });

        expect(cart.treeInterpretation).toBeDefined();
        expect(cart.pruningStrategy).toBeDefined();
      }
    });

    it('should provide residual analysis for regression tasks', async () => {
      const analyzer = new Section6Analyzer({
        focusAreas: ['regression'],
        includeAdvancedMethods: true
      });

      const result = await analyzer.analyze(
        createMockSection1Result({ targetType: 'continuous' }),
        createMockSection2Result(),
        createMockSection3Result(),
        createMockSection5Result()
      );

      if (result.modelingAnalysis.residualAnalysis) {
        const residual = result.modelingAnalysis.residualAnalysis;

        expect(residual.residualDiagnostics.length).toBeGreaterThan(0);
        expect(residual.modelAssumptions.length).toBeGreaterThan(0);
        
        residual.modelAssumptions.forEach(assumption => {
          expect(assumption.assumption).toBeDefined();
          expect(['satisfied', 'violated', 'questionable']).toContain(assumption.status);
          expect(assumption.evidence).toBeDefined();
          expect(assumption.remediation).toBeDefined();
        });

        expect(residual.normalityTests.length).toBeGreaterThanOrEqual(0);
        expect(residual.improvementSuggestions.length).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('Integration and Error Handling', () => {
    it('should handle missing or incomplete section results gracefully', async () => {
      const minimalSection1 = createMockSection1Result({ columns: [] });
      const minimalSection2 = createMockSection2Result({ qualityIssues: [] });
      const minimalSection3 = createMockSection3Result({ correlations: [] });
      const minimalSection5 = createMockSection5Result({ features: [] });

      const analyzer = new Section6Analyzer();
      const result = await analyzer.analyze(
        minimalSection1, 
        minimalSection2, 
        minimalSection3, 
        minimalSection5
      );

      expect(result.modelingAnalysis).toBeDefined();
      expect(result.warnings.length).toBeGreaterThanOrEqual(0);

      // Should handle gracefully even with minimal data
      expect(result.performanceMetrics.analysisTimeMs).toBeGreaterThanOrEqual(0);
      expect(result.metadata.analysisApproach).toBeDefined();
    });

    it('should validate configuration parameters', async () => {
      const invalidConfig: Partial<Section6Config> = {
        focusAreas: [],
        performanceThresholds: {
          minModelAccuracy: 1.5, // Invalid > 1
          maxComplexity: -0.1,    // Invalid < 0
          minInterpretability: 2.0 // Invalid > 1
        }
      };

      const analyzer = new Section6Analyzer(invalidConfig);
      const result = await analyzer.analyze(
        createMockSection1Result(),
        createMockSection2Result(),
        createMockSection3Result(),
        createMockSection5Result()
      );

      expect(result.warnings.length).toBeGreaterThan(0);
      const configWarning = result.warnings.find(w => 
        w.category === 'modeling' || w.message.includes('threshold')
      );
      expect(configWarning).toBeDefined();
    });

    it('should track performance metrics accurately', async () => {
      const analyzer = new Section6Analyzer();
      const start = Date.now();

      const result = await analyzer.analyze(
        createMockSection1Result(),
        createMockSection2Result(),
        createMockSection3Result(),
        createMockSection5Result()
      );

      const duration = Date.now() - start;

      expect(result.performanceMetrics.analysisTimeMs).toBeGreaterThanOrEqual(0);
      expect(result.performanceMetrics.analysisTimeMs).toBeLessThan(duration + 100);
      expect(result.performanceMetrics.tasksIdentified).toBeGreaterThan(0);
      expect(result.performanceMetrics.algorithmsEvaluated).toBeGreaterThan(0);
    });
  });
});

// Helper functions to create mock data
function createMockSection1Result(overrides: any = {}): Section1Result {
  return {
    overview: {
      fileDetails: {
        originalFilename: 'test-dataset.csv',
        fullResolvedPath: '/path/to/test-dataset.csv',
        fileSizeBytes: 1024000,
        fileSizeMB: 1.024,
        mimeType: 'text/csv',
        lastModified: new Date('2024-01-15'),
        sha256Hash: 'abc123def456',
      },
      parsingMetadata: {
        dataSourceType: 'Local File System',
        parsingEngine: 'DataPilot CSV Parser',
        parsingTimeSeconds: 0.5,
        encoding: {
          encoding: 'utf8',
          detectionMethod: 'BOM Analysis',
          confidence: 95,
          bomDetected: false,
        },
        delimiter: {
          delimiter: ',',
          detectionMethod: 'Frequency Analysis',
          confidence: 98,
          alternativesConsidered: [
            { delimiter: ';', score: 0.1 },
            { delimiter: '\t', score: 0.05 },
          ],
        },
        lineEnding: 'LF',
        quotingCharacter: '"',
        emptyLinesEncountered: 0,
        headerProcessing: {
          headerPresence: 'Detected',
          headerRowNumbers: [0],
          columnNamesSource: 'First Row',
        },
        initialScanLimit: {
          method: 'Complete File Scan',
          linesScanned: 1000,
        },
      },
      structuralDimensions: {
        totalRowsRead: 1000,
        totalDataRows: 999,
        totalColumns: 8,
        totalDataCells: 7992,
        columnInventory: [
          { index: 0, name: 'id', originalIndex: 0 },
          { index: 1, name: 'name', originalIndex: 1 },
          { index: 2, name: 'age', originalIndex: 2 },
          { index: 3, name: 'email', originalIndex: 3 },
          { index: 4, name: 'salary', originalIndex: 4 },
          { index: 5, name: 'department', originalIndex: 5 },
          { index: 6, name: 'hire_date', originalIndex: 6 },
          { index: 7, name: 'active', originalIndex: 7 },
        ],
        estimatedInMemorySizeMB: 2.5,
        averageRowLengthBytes: 64,
        sparsityAnalysis: {
          sparsityPercentage: 2.5,
          method: 'Sample-based estimation',
          sampleSize: 1000,
          description: 'Low sparsity dataset',
        },
      },
      executionContext: {
        fullCommandExecuted: 'datapilot model test-dataset.csv',
        analysisMode: 'modeling',
        analysisStartTimestamp: new Date('2024-01-15T10:00:00Z'),
        globalSamplingStrategy: 'full_scan',
        activatedModules: ['section1', 'section2', 'section3', 'section5', 'section6'],
        processingTimeSeconds: 2.1,
      },
      generatedAt: new Date('2024-01-15T10:00:02Z'),
      version: '1.3.1',
      ...overrides,
    },
    warnings: [],
    performanceMetrics: {
      totalAnalysisTime: 2100,
      peakMemoryUsage: 128,
      phases: {
        'file-analysis': 200,
        'parsing': 500,
        'structural-analysis': 400,
        'report-generation': 100,
      },
    },
  };
}

function createMockSection2Result(overrides: any = {}): Section2Result {
  return {
    qualityAudit: {
      cockpit: {
        compositeScore: {
          score: 85,
          interpretation: 'Good',
          details: 'Overall data quality is good with minor issues',
        },
        technicalDebt: {
          timeEstimate: '4-6 hours',
          complexityLevel: 'Medium',
          primaryDebtContributors: ['Missing values', 'Outliers'],
        },
        strengths: [
          {
            description: 'High data completeness',
            category: 'completeness',
            impact: 'high',
          },
        ],
        weaknesses: [
          {
            description: 'Some outliers detected',
            category: 'accuracy',
            severity: 'medium',
            priority: 3,
            estimatedEffort: '2 hours',
          },
        ],
      },
      completeness: {
        missingValuesByColumn: [
          {
            columnName: 'age',
            missingCount: 5,
            missingPercentage: 0.5,
            missingPattern: 'Random',
          },
        ],
        overallCompleteness: {
          percentage: 99.5,
          missingCells: 5,
          totalCells: 7992,
        },
        score: {
          score: 95,
          interpretation: 'Excellent',
        },
      },
      uniqueness: {
        duplicateGroups: [],
        uniquenessMetrics: [
          {
            columnName: 'id',
            uniqueValues: 999,
            cardinality: 999,
            uniquenessPercentage: 100,
          },
        ],
        score: {
          score: 98,
          interpretation: 'Excellent',
        },
      },
      validity: {
        validationResults: [
          {
            columnName: 'email',
            validValues: 994,
            invalidValues: 5,
            validationRule: 'Email format',
            validityPercentage: 99.5,
          },
        ],
        score: {
          score: 92,
          interpretation: 'Excellent',
        },
      },
      accuracy: {
        outlierDetection: [
          {
            columnName: 'salary',
            outliers: [
              { value: 500000, rowIndex: 150, zScore: 3.5 },
              { value: 10000, rowIndex: 75, zScore: -2.8 },
            ],
            method: 'Z-Score',
            threshold: 3,
          },
        ],
        score: {
          score: 88,
          interpretation: 'Good',
        },
      },
      consistency: {
        formatConsistency: [
          {
            columnName: 'hire_date',
            formats: [{ format: 'YYYY-MM-DD', count: 999 }],
            consistencyPercentage: 100,
          },
        ],
        score: {
          score: 96,
          interpretation: 'Excellent',
        },
      },
      integrity: {
        orphanedRecords: [],
        cardinalityViolations: [],
        score: {
          score: 100,
          interpretation: 'Excellent',
        },
      },
      reasonableness: {
        statisticalPlausibility: [
          {
            columnName: 'age',
            mean: 35.5,
            standardDeviation: 12.3,
            implausibleValues: [],
          },
        ],
        score: {
          score: 94,
          interpretation: 'Excellent',
        },
      },
      security: {
        sensitiveDataDetection: [
          {
            columnName: 'email',
            dataType: 'PII',
            sensitivityLevel: 'Medium',
            detectionConfidence: 95,
            recommendedActions: ['Encryption', 'Access Control'],
          },
        ],
        score: {
          score: 80,
          interpretation: 'Good',
        },
      },
      ...overrides,
    },
    warnings: [],
    performanceMetrics: {
      totalAnalysisTime: 2000,
      phases: {
        'completeness': 300,
        'uniqueness': 400,
        'validity': 500,
        'accuracy': 400,
        'consistency': 200,
        'integrity': 100,
        'reasonableness': 100,
      },
    },
  };
}

function createMockSection3Result(overrides: any = {}): Section3Result {
  return {
    edaAnalysis: {
      univariateAnalysis: {
        summary: {
          columnsAnalyzed: 8,
          numericalColumns: 3,
          categoricalColumns: 3,
          dateTimeColumns: 1,
          booleanColumns: 1,
        },
        numericalAnalysis: [
          {
            columnName: 'age',
            descriptiveStatistics: {
              count: 999,
              mean: 35.5,
              median: 34,
              mode: [32],
              standardDeviation: 12.3,
              variance: 151.29,
              range: 45,
              min: 22,
              max: 67,
              quantiles: {
                q1: 28,
                q2: 34,
                q3: 43,
              },
              skewness: 0.15,
              kurtosis: -0.8,
            },
            distribution: {
              type: 'normal',
              parameters: { mean: 35.5, std: 12.3 },
              goodnessOfFit: 0.85,
            },
          },
        ],
        categoricalAnalysis: [
          {
            columnName: 'department',
            frequency: [
              { value: 'Engineering', count: 350, percentage: 35 },
              { value: 'Sales', count: 300, percentage: 30 },
              { value: 'Marketing', count: 200, percentage: 20 },
              { value: 'HR', count: 149, percentage: 15 },
            ],
            uniqueValues: 4,
            entropy: 1.85,
            concentration: 0.35,
          },
        ],
        dateTimeAnalysis: [
          {
            columnName: 'hire_date',
            range: {
              earliest: '2015-01-01',
              latest: '2024-01-01',
              span: '9 years',
            },
            patterns: {
              seasonality: false,
              trends: 'increasing',
              gaps: [],
            },
          },
        ],
        booleanAnalysis: [
          {
            columnName: 'active',
            distribution: {
              true: { count: 950, percentage: 95 },
              false: { count: 49, percentage: 5 },
            },
          },
        ],
      },
      bivariateAnalysis: {
        correlationMatrix: {
          variables: ['age', 'salary'],
          matrix: [[1.0, 0.65], [0.65, 1.0]],
          significantCorrelations: [
            {
              variable1: 'age',
              variable2: 'salary',
              correlation: 0.65,
              pValue: 0.001,
              significance: 'high',
            },
          ],
        },
        categoricalAssociations: [
          {
            variable1: 'department',
            variable2: 'active',
            testType: 'chi_square',
            statistic: 12.5,
            pValue: 0.006,
            associationStrength: 'moderate',
          },
        ],
        numericalCategoricalAnalysis: [
          {
            numericalVariable: 'salary',
            categoricalVariable: 'department',
            testType: 'anova',
            fStatistic: 24.8,
            pValue: 0.0001,
            groupDifferences: 'significant',
          },
        ],
      },
      multivariateAnalysis: {
        principalComponentAnalysis: {
          isApplicable: true,
          componentsAnalyzed: 3,
          varianceExplained: {
            individual: [0.45, 0.28, 0.15],
            cumulative: [0.45, 0.73, 0.88],
          },
          varianceThresholds: {
            componentsFor80Percent: 2,
            componentsFor85Percent: 3,
            componentsFor90Percent: 3,
          },
          dominantVariables: [
            { variable: 'salary', component: 1, maxLoading: 0.85 },
            { variable: 'age', component: 1, maxLoading: 0.72 },
            { variable: 'department', component: 2, maxLoading: 0.68 },
          ],
        },
        clusteringAnalysis: {
          isApplicable: true,
          optimalClusters: 3,
          finalClustering: {
            algorithm: 'kmeans',
            clusters: 3,
            validation: {
              silhouetteScore: 0.68,
              wcss: 45000,
              calinski_harabasz: 180.5,
            },
            clusterSizes: [350, 400, 249],
          },
        },
      },
      ...overrides,
    },
    warnings: [],
    performanceMetrics: {
      totalAnalysisTime: 3500,
      analysisTimeMs: 3500,
      rowsAnalyzed: 999,
      chunksProcessed: 5,
      peakMemoryMB: 64,
      avgChunkSize: 200,
      memoryEfficiency: 'good',
      phases: {
        'univariate': 1500,
        'bivariate': 1200,
        'multivariate': 800,
      },
    },
    metadata: {
      analysisApproach: 'Streaming statistical analysis',
      datasetSize: 999,
      columnsAnalyzed: 8,
      samplingApplied: false,
    },
  };
}

function createMockSection5Result(overrides: any = {}): Section5Result {
  return {
    engineeringAnalysis: {
      schemaAnalysis: {
        currentSchema: {
          columns: [
            {
              originalName: 'id',
              detectedType: 'integer',
              inferredSemanticType: 'identifier',
              nullabilityPercentage: 0,
              uniquenessPercentage: 100,
              sampleValues: ['1', '2', '3'],
            },
          ],
          estimatedRowCount: 999,
          estimatedSizeBytes: 1024000,
          detectedEncoding: 'utf8',
        },
        optimizedSchema: {
          targetSystem: 'postgresql',
          ddlStatement: 'CREATE TABLE dataset (...)',
          columns: [],
          indexes: [],
          constraints: [],
        },
        dataTypeConversions: [],
        characterEncodingRecommendations: {
          detectedEncoding: 'utf8',
          recommendedEncoding: 'UTF-8',
          collationRecommendation: 'en_US.UTF-8',
          characterSetIssues: [],
        },
        normalizationInsights: {
          redundancyDetected: [],
          normalizationOpportunities: [],
          denormalizationJustifications: [],
        },
      },
      structuralIntegrity: {
        primaryKeyCandidates: [],
        foreignKeyRelationships: [],
        orphanedRecords: [],
        dataIntegrityScore: {
          score: 85,
          interpretation: 'Good',
          factors: [],
        },
      },
      transformationPipeline: {
        columnStandardization: [],
        missingValueStrategy: [],
        outlierTreatment: [],
        categoricalEncoding: [],
        numericalTransformations: [],
        dateTimeFeatureEngineering: [],
        textProcessingPipeline: [],
        booleanFeatureCreation: [],
        featureHashingRecommendations: [],
      },
      scalabilityAssessment: {
        currentMetrics: {
          diskSizeMB: 1.024,
          inMemorySizeMB: 2.5,
          rowCount: 999,
          columnCount: 8,
          estimatedGrowthRate: 10,
        },
        scalabilityAnalysis: {
          currentCapability: 'Good',
          futureProjections: [],
          technologyRecommendations: [],
          bottleneckAnalysis: [],
        },
        indexingRecommendations: [],
        partitioningStrategies: [],
        performanceOptimizations: [],
      },
      dataGovernance: {
        sensitivityClassification: [],
        dataFreshnessAnalysis: {
          lastUpdateDetected: '2024-01-15',
          updateFrequencyEstimate: 'Unknown',
          freshnessScore: 80,
          implications: [],
          recommendations: [],
        },
        versioningRecommendations: [],
        lineageConsiderations: [],
        retentionPolicyRecommendations: [],
        complianceConsiderations: [],
      },
      mlReadiness: {
        overallScore: 85,
        enhancingFactors: [
          {
            factor: 'High data quality',
            impact: 'high',
            description: 'Clean, well-structured data',
          },
        ],
        remainingChallenges: [
          {
            challenge: 'Feature engineering needed',
            severity: 'medium',
            impact: 'May need additional preprocessing',
            mitigationStrategy: 'Apply recommended transformations',
            estimatedEffort: '2-4 hours',
          },
        ],
        featurePreparationMatrix: [
          {
            featureName: 'age_scaled',
            originalColumn: 'age',
            finalDataType: 'Float',
            keyIssues: [],
            engineeringSteps: ['Standardization'],
            finalMLFeatureType: 'Numerical',
            modelingNotes: ['Well-suited for ML'],
          },
        ],
        modelingConsiderations: [
          {
            aspect: 'Data Quality',
            consideration: 'High quality data enables good model performance',
            impact: 'Positive impact on model accuracy',
            recommendations: ['Proceed with modeling'],
          },
        ],
      },
      knowledgeBaseOutput: {
        datasetProfile: {
          fileName: 'test-dataset.csv',
          analysisDate: '2024-01-15',
          totalRows: 999,
          totalColumnsOriginal: 8,
          totalColumnsEngineeredForML: 11,
          estimatedTechnicalDebtHours: 4,
          mlReadinessScore: 85,
        },
        schemaRecommendations: [],
        inferredRelationships: [],
        keyTransformations: [],
      },
      ...overrides,
    },
    warnings: [],
    performanceMetrics: {
      analysisTimeMs: 4200,
      transformationsEvaluated: 15,
      schemaRecommendationsGenerated: 8,
      mlFeaturesDesigned: 11,
    },
    metadata: {
      analysisApproach: 'Comprehensive engineering analysis',
      sourceDatasetSize: 999,
      engineeredFeatureCount: 11,
      mlReadinessScore: 85,
    },
  };
}