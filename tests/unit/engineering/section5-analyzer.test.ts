/**
 * Section 5 Engineering Analyzer Tests
 * 
 * Tests the comprehensive data engineering and structural insights analyzer that provides
 * schema optimization, transformation pipelines, scalability assessment, data governance,
 * and ML readiness evaluation.
 */

import { Section5Analyzer } from '../../../src/analyzers/engineering/section5-analyzer-fixed';
import type { Section5Config } from '../../../src/analyzers/engineering/types';
import type { Section1Result } from '../../../src/analyzers/overview/types';
import type { Section2Result } from '../../../src/analyzers/quality/types';
import type { Section3Result } from '../../../src/analyzers/eda/types';
import { DataType } from '../../../src/core/types';

describe('Section5Analyzer', () => {
  describe('Comprehensive Engineering Analysis', () => {
    it('should perform complete data engineering analysis with all components', () => {
      const section1Result = createMockSection1Result();
      const section2Result = createMockSection2Result();
      const section3Result = createMockSection3Result();

      const config: Section5Config = {
        enabledAnalyses: [
          'schema', 'integrity', 'transformations', 'scalability',
          'governance', 'ml_readiness'
        ],
        targetDatabaseSystem: 'postgresql',
        mlFrameworkTarget: 'scikit_learn',
        includeKnowledgeBase: true,
        governanceLevel: 'enterprise',
        performanceOptimizationLevel: 'aggressive',
      };

      const analyzer = new Section5Analyzer(config);
      const result = analyzer.analyze(section1Result, section2Result, section3Result);

      // Should include all major engineering analysis components
      expect(result.engineeringAnalysis.schemaAnalysis).toBeDefined();
      expect(result.engineeringAnalysis.structuralIntegrity).toBeDefined();
      expect(result.engineeringAnalysis.transformationPipeline).toBeDefined();
      expect(result.engineeringAnalysis.scalabilityAssessment).toBeDefined();
      expect(result.engineeringAnalysis.dataGovernance).toBeDefined();
      expect(result.engineeringAnalysis.mlReadiness).toBeDefined();
      expect(result.engineeringAnalysis.knowledgeBaseOutput).toBeDefined();

      // Should provide performance metrics
      expect(result.performanceMetrics.analysisTimeMs).toBeGreaterThan(0);
      expect(result.performanceMetrics.transformationsEvaluated).toBeGreaterThan(0);
      expect(result.performanceMetrics.schemaRecommendationsGenerated).toBeGreaterThan(0);
      expect(result.performanceMetrics.mlFeaturesDesigned).toBeGreaterThan(0);

      // Should include metadata
      expect(result.metadata.mlReadinessScore).toBeGreaterThanOrEqual(0);
      expect(result.metadata.mlReadinessScore).toBeLessThanOrEqual(100);
      expect(result.metadata.engineeredFeatureCount).toBeGreaterThan(0);
    });

    it('should adapt analysis based on target database system', () => {
      const postgresqlConfig: Partial<Section5Config> = {
        enabledAnalyses: ['schema'],
        targetDatabaseSystem: 'postgresql',
      };

      const mysqlConfig: Partial<Section5Config> = {
        enabledAnalyses: ['schema'],
        targetDatabaseSystem: 'mysql',
      };

      const analyzer1 = new Section5Analyzer(postgresqlConfig);
      const analyzer2 = new Section5Analyzer(mysqlConfig);

      const section1 = createMockSection1Result();
      const section2 = createMockSection2Result();
      const section3 = createMockSection3Result();

      const postgresResult = analyzer1.analyze(section1, section2, section3);
      const mysqlResult = analyzer2.analyze(section1, section2, section3);

      // Should generate different DDL for different systems
      expect(postgresResult.engineeringAnalysis.schemaAnalysis.optimizedSchema.targetSystem).toBe('postgresql');
      expect(mysqlResult.engineeringAnalysis.schemaAnalysis.optimizedSchema.targetSystem).toBe('mysql');

      // Should use appropriate column types for the database systems
      const postgresTypes = postgresResult.engineeringAnalysis.schemaAnalysis.optimizedSchema.columns;
      const mysqlTypes = mysqlResult.engineeringAnalysis.schemaAnalysis.optimizedSchema.columns;

      expect(postgresTypes.length).toBeGreaterThan(0);
      expect(mysqlTypes.length).toBeGreaterThan(0);
      expect(postgresTypes.some(col => col.recommendedType.includes('BIGINT'))).toBe(true);
      expect(mysqlTypes.some(col => col.recommendedType.includes('BIGINT'))).toBe(true);
    });

    it('should provide ML framework-specific recommendations', () => {
      const scikitConfig: Partial<Section5Config> = {
        enabledAnalyses: ['ml_readiness'],
        mlFrameworkTarget: 'scikit_learn',
      };

      const tensorflowConfig: Partial<Section5Config> = {
        enabledAnalyses: ['ml_readiness'],
        mlFrameworkTarget: 'tensorflow',
      };

      const analyzer1 = new Section5Analyzer(scikitConfig);
      const analyzer2 = new Section5Analyzer(tensorflowConfig);

      const section1 = createMockSection1Result();
      const section2 = createMockSection2Result();
      const section3 = createMockSection3Result();

      const scikitResult = analyzer1.analyze(section1, section2, section3);
      const tensorflowResult = analyzer2.analyze(section1, section2, section3);

      // Should provide framework-specific feature engineering recommendations
      expect(scikitResult.engineeringAnalysis.mlReadiness.overallScore).toBeGreaterThan(0);
      expect(tensorflowResult.engineeringAnalysis.mlReadiness.overallScore).toBeGreaterThan(0);

      // Should have different modeling considerations for different frameworks
      expect(scikitResult.engineeringAnalysis.mlReadiness.modelingConsiderations.length).toBeGreaterThan(0);
      expect(tensorflowResult.engineeringAnalysis.mlReadiness.modelingConsiderations.length).toBeGreaterThan(0);
    });
  });

  describe('Schema Analysis and Optimization', () => {
    it('should analyze current schema and propose optimizations', () => {
      const section1Result = createMockSection1Result();
      const section2Result = createMockSection2Result();
      const section3Result = createMockSection3Result();

      const analyzer = new Section5Analyzer({ enabledAnalyses: ['schema'] });
      const result = analyzer.analyze(section1Result, section2Result, section3Result);

      const schemaAnalysis = result.engineeringAnalysis.schemaAnalysis;

      // Should provide current schema profile
      expect(schemaAnalysis.currentSchema.columns.length).toBeGreaterThan(0);
      expect(schemaAnalysis.currentSchema.estimatedRowCount).toBeGreaterThan(0);

      // Should recommend optimized schema
      expect(schemaAnalysis.optimizedSchema.columns.length).toBeGreaterThan(0);
      expect(schemaAnalysis.optimizedSchema.ddlStatement).toContain('CREATE TABLE');

      // Should recommend proper indexes
      expect(schemaAnalysis.optimizedSchema.indexes.length).toBeGreaterThan(0);
      const primaryKeyIndex = schemaAnalysis.optimizedSchema.indexes.find(idx => 
        idx.indexType === 'primary'
      );
      expect(primaryKeyIndex).toBeDefined();
    });

    it('should detect and optimize character encoding issues', () => {
      const section1Result = createMockSection1Result();
      const section2Result = createMockSection2Result();
      const section3Result = createMockSection3Result();

      const analyzer = new Section5Analyzer({ enabledAnalyses: ['schema'] });
      const result = analyzer.analyze(section1Result, section2Result, section3Result);

      const encoding = result.engineeringAnalysis.schemaAnalysis.characterEncodingRecommendations;

      // Should detect encoding and recommend UTF-8
      expect(encoding.detectedEncoding).toBeDefined();
      expect(encoding.recommendedEncoding).toBe('UTF-8');
      expect(encoding.collationRecommendation).toBeDefined();
    });
  });

  describe('Structural Integrity Analysis', () => {
    it('should identify primary key candidates', () => {
      const section1Result = createMockSection1Result();
      const section2Result = createMockSection2Result();
      const section3Result = createMockSection3Result();

      const analyzer = new Section5Analyzer({ enabledAnalyses: ['integrity'] });
      const result = analyzer.analyze(section1Result, section2Result, section3Result);

      const integrity = result.engineeringAnalysis.structuralIntegrity;

      // Should find primary key candidates
      expect(integrity.primaryKeyCandidates.length).toBeGreaterThan(0);
      
      const primaryCandidate = integrity.primaryKeyCandidates[0];
      expect(primaryCandidate.uniqueness).toBeGreaterThan(80);
      expect(primaryCandidate.completeness).toBeGreaterThan(80);
      expect(['low', 'medium', 'high']).toContain(primaryCandidate.confidence);
    });

    it('should calculate data integrity score', () => {
      const section1Result = createMockSection1Result();
      const section2Result = createMockSection2Result();
      const section3Result = createMockSection3Result();

      const analyzer = new Section5Analyzer({ enabledAnalyses: ['integrity'] });
      const result = analyzer.analyze(section1Result, section2Result, section3Result);

      const integrityScore = result.engineeringAnalysis.structuralIntegrity.dataIntegrityScore;

      // Should provide meaningful integrity score
      expect(integrityScore.score).toBeGreaterThanOrEqual(0);
      expect(integrityScore.score).toBeLessThanOrEqual(100);
      expect(integrityScore.interpretation).toBeDefined();
      expect(integrityScore.factors.length).toBeGreaterThan(0);
    });
  });

  describe('ML Readiness Assessment', () => {
    it('should assess ML readiness with PCA insights', () => {
      const section1Result = createMockSection1Result();
      const section2Result = createMockSection2Result();
      const section3Result = createMockSection3Result();

      const analyzer = new Section5Analyzer({ enabledAnalyses: ['ml_readiness'] });
      const result = analyzer.analyze(section1Result, section2Result, section3Result);

      const mlReadiness = result.engineeringAnalysis.mlReadiness;

      // Should provide overall score
      expect(mlReadiness.overallScore).toBeGreaterThanOrEqual(0);
      expect(mlReadiness.overallScore).toBeLessThanOrEqual(100);

      // Should identify enhancing factors
      expect(mlReadiness.enhancingFactors.length).toBeGreaterThan(0);
      mlReadiness.enhancingFactors.forEach(factor => {
        expect(factor.factor).toBeDefined();
        expect(['high', 'medium', 'low']).toContain(factor.impact);
        expect(factor.description).toBeDefined();
      });

      // Should identify remaining challenges
      mlReadiness.remainingChallenges.forEach(challenge => {
        expect(challenge.challenge).toBeDefined();
        expect(['high', 'medium', 'low']).toContain(challenge.severity);
        expect(challenge.mitigationStrategy).toBeDefined();
      });

      // Should provide feature preparation matrix
      expect(mlReadiness.featurePreparationMatrix.length).toBeGreaterThan(0);
      mlReadiness.featurePreparationMatrix.forEach(feature => {
        expect(feature.featureName).toBeDefined();
        expect(feature.originalColumn).toBeDefined();
        expect(feature.finalDataType).toBeDefined();
      });
    });
  });

  describe('Integration and Error Handling', () => {
    it('should handle missing or incomplete section results gracefully', () => {
      const minimalSection1 = createMockSection1Result({ columns: [] });
      const minimalSection2 = createMockSection2Result({ qualityIssues: [] });
      const minimalSection3 = createMockSection3Result({ correlations: [] });

      const analyzer = new Section5Analyzer();
      const result = analyzer.analyze(minimalSection1, minimalSection2, minimalSection3);

      expect(result.engineeringAnalysis).toBeDefined();
      expect(result.warnings.length).toBeGreaterThanOrEqual(0);

      // Should handle gracefully even with minimal data
      expect(result.performanceMetrics.analysisTimeMs).toBeGreaterThanOrEqual(0);
      expect(result.metadata.mlReadinessScore).toBeGreaterThanOrEqual(0);
    });

    it('should validate configuration parameters', () => {
      const invalidConfig: Partial<Section5Config> = {
        enabledAnalyses: [],
      };

      const analyzer = new Section5Analyzer(invalidConfig);
      const result = analyzer.analyze(
        createMockSection1Result(), 
        createMockSection2Result(), 
        createMockSection3Result()
      );

      expect(result.warnings.length).toBeGreaterThanOrEqual(0);
      expect(result.engineeringAnalysis).toBeDefined();
    });

    it('should track performance metrics accurately', () => {
      const analyzer = new Section5Analyzer();
      const start = Date.now();

      const result = analyzer.analyze(
        createMockSection1Result(), 
        createMockSection2Result(), 
        createMockSection3Result()
      );

      const duration = Date.now() - start;

      expect(result.performanceMetrics.analysisTimeMs).toBeGreaterThanOrEqual(0);
      expect(result.performanceMetrics.analysisTimeMs).toBeLessThan(duration + 100); // Allow some tolerance
      expect(result.performanceMetrics.transformationsEvaluated).toBeGreaterThan(0);
      expect(result.performanceMetrics.schemaRecommendationsGenerated).toBeGreaterThan(0);
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
        fullCommandExecuted: 'datapilot eng test-dataset.csv',
        analysisMode: 'engineering',
        analysisStartTimestamp: new Date('2024-01-15T10:00:00Z'),
        globalSamplingStrategy: 'full_scan',
        activatedModules: ['section1', 'section2', 'section3', 'section5'],
        processingTimeSeconds: 1.2,
      },
      generatedAt: new Date('2024-01-15T10:00:01Z'),
      version: '1.3.1',
      ...overrides,
    },
    warnings: [],
    performanceMetrics: {
      totalAnalysisTime: 1200,
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
          {
            description: 'Consistent data formats',
            category: 'validity',
            impact: 'medium',
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