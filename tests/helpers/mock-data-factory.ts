/**
 * Mock Data Factory for Integration Tests
 * Creates comprehensive mock objects for Section 1, 2, and 3 results
 */

import { DataType } from '../../src/core/types';

export interface MockColumn {
  name: string;
  dataType: string;
  index?: number;
}

export interface MockDataOptions {
  columns?: MockColumn[];
  rowCount?: number;
  fileSize?: number;
  filename?: string;
  hasIssues?: boolean;
}

export class MockDataFactory {
  static createSection1Mock(options: MockDataOptions = {}): any {
    const {
      columns = [
        { name: 'id', dataType: 'integer' },
        { name: 'name', dataType: 'string' },
        { name: 'age', dataType: 'integer' },
        { name: 'email', dataType: 'string' }
      ],
      rowCount = 100,
      fileSize = 10000,
      filename = 'test.csv'
    } = options;

    return {
      overview: {
        fileDetails: {
          originalFilename: filename,
          fullResolvedPath: `/path/to/${filename}`,
          fileSizeBytes: fileSize,
          fileSizeMB: fileSize / 1024 / 1024,
          mimeType: 'text/csv',
          lastModified: new Date('2024-01-01T10:00:00Z'),
          sha256Hash: 'mock-hash-123'
        },
        parsingMetadata: {
          dataSourceType: 'Local File System' as const,
          parsingEngine: 'streaming-csv-parser',
          parsingTimeSeconds: 0.5,
          encoding: {
            encoding: 'utf8' as BufferEncoding,
            detectionMethod: 'automatic',
            confidence: 0.95,
            bomDetected: false
          },
          delimiter: {
            delimiter: ',',
            detectionMethod: 'frequency_analysis',
            confidence: 0.98,
            alternativesConsidered: [
              { delimiter: ';', score: 0.02 },
              { delimiter: '\t', score: 0.01 }
            ]
          },
          lineEnding: 'LF' as const,
          quotingCharacter: '"',
          emptyLinesEncountered: 0,
          headerProcessing: {
            headerPresence: 'Detected' as const,
            headerRow: columns.map(c => c.name),
            headerValidation: 'valid'
          },
          initialScanLimit: {
            method: 'adaptive',
            linesScanned: Math.min(rowCount, 1000),
            bytesScanned: Math.min(fileSize, 64000)
          }
        },
        structuralDimensions: {
          totalRowsRead: rowCount + 1, // +1 for header
          totalDataRows: rowCount,
          totalColumns: columns.length,
          totalDataCells: rowCount * columns.length,
          columnInventory: columns.map((col, index) => ({
            index,
            name: col.name,
            originalIndex: index,
            dataType: col.dataType,
            inferredType: col.dataType
          })),
          estimatedInMemorySizeMB: (fileSize * 2) / 1024 / 1024,
          averageRowLengthBytes: fileSize / rowCount,
          sparsityAnalysis: {
            sparsityPercentage: 5.0,
            method: 'random_sampling',
            sampleSize: Math.min(rowCount, 1000),
            description: 'Low sparsity detected'
          }
        },
        executionContext: {
          fullCommandExecuted: 'datapilot analyze test.csv',
          analysisMode: 'comprehensive',
          workingDirectory: '/test',
          nodeVersion: '18.0.0',
          packageVersion: '1.2.1'
        },
        generatedAt: new Date('2024-01-01T10:00:00Z'),
        version: '1.0.0'
      },
      warnings: options.hasIssues ? [
        {
          category: 'parsing',
          severity: 'medium',
          message: 'Some parsing issues detected',
          impact: 'Minor data quality impact',
          suggestion: 'Review data format'
        }
      ] : [],
      performanceMetrics: {
        totalAnalysisTime: 500,
        peakMemoryUsage: 128,
        phases: {
          parsing: 200,
          analysis: 250,
          formatting: 50
        }
      }
    };
  }

  static createSection2Mock(options: MockDataOptions = {}): any {
    const {
      columns = [
        { name: 'id', dataType: 'integer' },
        { name: 'name', dataType: 'string' },
        { name: 'age', dataType: 'integer' },
        { name: 'email', dataType: 'string' }
      ],
      rowCount = 100,
      hasIssues = false
    } = options;

    const qualityScore = hasIssues ? 75 : 95;
    const completenessScore = hasIssues ? 80 : 98;

    return {
      qualityAudit: {
        cockpit: {
          compositeScore: {
            score: qualityScore,
            interpretation: qualityScore > 90 ? 'Excellent' : qualityScore > 75 ? 'Good' : 'Needs Improvement'
          },
          dimensionScores: {
            completeness: { score: completenessScore, interpretation: 'High completeness' },
            accuracy: { score: qualityScore - 5, interpretation: 'Good accuracy' },
            consistency: { score: qualityScore + 2, interpretation: 'High consistency' },
            timeliness: { score: qualityScore - 3, interpretation: 'Good timeliness' },
            validity: { score: qualityScore + 1, interpretation: 'High validity' },
            uniqueness: { score: qualityScore - 2, interpretation: 'Good uniqueness' },
            integrity: { score: qualityScore, interpretation: 'High integrity' },
            accessibility: { score: qualityScore + 3, interpretation: 'High accessibility' },
            coverage: { score: qualityScore - 1, interpretation: 'Good coverage' },
            granularity: { score: qualityScore, interpretation: 'Appropriate granularity' }
          },
          topStrengths: [
            { description: 'High data completeness', category: 'completeness', impact: 'positive' },
            { description: 'Consistent data formats', category: 'consistency', impact: 'positive' }
          ],
          topWeaknesses: hasIssues ? [
            { description: 'Some missing values', category: 'completeness', severity: 'medium', priority: 2 },
            { description: 'Minor format inconsistencies', category: 'consistency', severity: 'low', priority: 3 }
          ] : [],
          technicalDebt: {
            timeEstimate: hasIssues ? '2-4 hours' : '< 1 hour',
            complexityLevel: hasIssues ? 'medium' : 'low',
            priorityActions: hasIssues ? ['Address missing values', 'Standardize formats'] : ['Minor cleanup tasks']
          }
        },
        completeness: {
          datasetLevel: {
            overallCompletenessRate: completenessScore / 100,
            totalRecords: rowCount,
            completeRecords: Math.floor(rowCount * (completenessScore / 100)),
            incompleteRecords: rowCount - Math.floor(rowCount * (completenessScore / 100))
          },
          columnLevel: columns.map(col => ({
            columnName: col.name,
            totalValues: rowCount,
            presentValues: Math.floor(rowCount * (completenessScore / 100)),
            missingValues: rowCount - Math.floor(rowCount * (completenessScore / 100)),
            completenessRate: completenessScore / 100,
            missingValuePatterns: hasIssues ? ['random', 'end_of_file'] : []
          })),
          score: {
            score: completenessScore,
            interpretation: 'High completeness across most columns',
            factors: ['Missing value patterns analyzed', 'Column-level completeness calculated']
          }
        },
        accuracy: {
          valueConformity: columns.map(col => ({
            columnName: col.name,
            dataType: col.dataType,
            conformingValues: Math.floor(rowCount * 0.98),
            nonConformingValues: Math.ceil(rowCount * 0.02),
            conformityRate: 0.98,
            issues: hasIssues && col.dataType === 'integer' ? ['Invalid numeric formats'] : []
          })),
          crossFieldValidation: [],
          score: {
            score: qualityScore - 5,
            interpretation: 'Good accuracy with minor issues',
            factors: ['Data type conformity', 'Format validation']
          }
        },
        consistency: {
          intraRecord: [],
          interRecord: [],
          formatConsistency: columns.map(col => ({
            columnName: col.name,
            formatPatterns: col.dataType === 'string' ? ['alphanumeric', 'email_format'] : ['numeric'],
            consistencyScore: 0.95,
            inconsistencies: hasIssues ? ['Case variations'] : []
          })),
          score: {
            score: qualityScore + 2,
            interpretation: 'High consistency',
            factors: ['Format standardization', 'Pattern compliance']
          }
        },
        // Simplified other dimensions
        timeliness: { score: { score: qualityScore - 3, interpretation: 'Good timeliness' } },
        validity: { score: { score: qualityScore + 1, interpretation: 'High validity' } },
        uniqueness: { score: { score: qualityScore - 2, interpretation: 'Good uniqueness' } },
        integrity: { score: { score: qualityScore, interpretation: 'High integrity' } },
        accessibility: { score: { score: qualityScore + 3, interpretation: 'High accessibility' } },
        coverage: { score: { score: qualityScore - 1, interpretation: 'Good coverage' } },
        granularity: { score: { score: qualityScore, interpretation: 'Appropriate granularity' } },
        profilingInsights: {
          valueLengthAnalysis: [],
          characterSetAnalysis: [],
          patternRecognition: []
        },
        generatedAt: new Date('2024-01-01T10:01:00Z'),
        version: '1.0.0'
      },
      warnings: options.hasIssues ? [
        {
          category: 'quality',
          severity: 'medium',
          message: 'Data quality issues detected',
          impact: 'May affect analysis accuracy',
          suggestion: 'Review and clean data'
        }
      ] : [],
      performanceMetrics: {
        totalAnalysisTime: 1200,
        peakMemoryUsage: 256,
        phases: {
          completeness: 300,
          accuracy: 400,
          consistency: 300,
          other_dimensions: 200
        }
      }
    };
  }

  static createSection3Mock(options: MockDataOptions = {}): any {
    const {
      columns = [
        { name: 'id', dataType: 'integer' },
        { name: 'name', dataType: 'string' },
        { name: 'age', dataType: 'integer' },
        { name: 'email', dataType: 'string' }
      ],
      rowCount = 100
    } = options;

    // Create univariate analysis for each column
    const univariateAnalysis = columns.map(col => {
      const baseProfile = {
        columnName: col.name,
        detectedDataType: col.dataType === 'integer' ? 'NUMERICAL_INTEGER' : 
                         col.dataType === 'string' ? 'TEXT_GENERAL' : 'CATEGORICAL',
        inferredSemanticType: col.name === 'id' ? 'IDENTIFIER' : 
                            col.name === 'age' ? 'AGE' : 
                            col.name === 'email' ? 'CATEGORY' : 'UNKNOWN',
        dataQualityFlag: 'clean',
        totalValues: rowCount,
        missingValues: Math.floor(rowCount * 0.02),
        missingPercentage: 2.0,
        uniqueValues: col.name === 'id' ? rowCount : Math.floor(rowCount * 0.8),
        uniquePercentage: col.name === 'id' ? 100 : 80
      };

      if (col.dataType === 'integer') {
        return {
          ...baseProfile,
          descriptiveStats: {
            minimum: col.name === 'age' ? 18 : 1,
            maximum: col.name === 'age' ? 85 : rowCount,
            range: col.name === 'age' ? 67 : rowCount - 1,
            sum: col.name === 'age' ? rowCount * 45 : (rowCount * (rowCount + 1)) / 2,
            mean: col.name === 'age' ? 45 : rowCount / 2,
            median: col.name === 'age' ? 44 : rowCount / 2,
            modes: [{ value: col.name === 'age' ? 30 : 1, frequency: 3, percentage: 3 }],
            standardDeviation: col.name === 'age' ? 15.5 : rowCount / 4,
            variance: col.name === 'age' ? 240.25 : (rowCount / 4) ** 2,
            coefficientOfVariation: 0.34
          },
          quantileStats: {
            percentile1st: col.name === 'age' ? 20 : 1,
            percentile5th: col.name === 'age' ? 22 : 5,
            percentile10th: col.name === 'age' ? 25 : 10,
            quartile1st: col.name === 'age' ? 32 : rowCount / 4,
            quartile3rd: col.name === 'age' ? 58 : (3 * rowCount) / 4,
            percentile90th: col.name === 'age' ? 75 : (9 * rowCount) / 10,
            percentile95th: col.name === 'age' ? 80 : (95 * rowCount) / 100,
            percentile99th: col.name === 'age' ? 84 : (99 * rowCount) / 100,
            interquartileRange: col.name === 'age' ? 26 : rowCount / 2,
            medianAbsoluteDeviation: col.name === 'age' ? 12 : rowCount / 8
          },
          distributionAnalysis: {
            skewness: 0.15,
            skewnessInterpretation: 'Approximately symmetric',
            kurtosis: -0.5,
            kurtosisInterpretation: 'Platykurtic (lighter tails)',
            histogramSummary: 'Normal-like distribution'
          },
          normalityTests: {
            shapiroWilk: { statistic: 0.98, pValue: 0.15, interpretation: 'Normal' },
            jarqueBera: { statistic: 2.5, pValue: 0.28, interpretation: 'Normal' },
            kolmogorovSmirnov: { statistic: 0.08, pValue: 0.35, interpretation: 'Normal' }
          },
          outlierAnalysis: {
            iqrMethod: {
              lowerFence: col.name === 'age' ? 5 : -rowCount / 2,
              upperFence: col.name === 'age' ? 95 : rowCount * 1.5,
              lowerOutliers: 0,
              upperOutliers: 2,
              lowerPercentage: 0,
              upperPercentage: 2,
              extremeOutliers: 1,
              extremePercentage: 1
            },
            zScoreMethod: { threshold: 3.0, lowerOutliers: 0, upperOutliers: 1 },
            modifiedZScoreMethod: { threshold: 3.5, outliers: 1 },
            summary: {
              totalOutliers: 2,
              totalPercentage: 2,
              minOutlierValue: col.name === 'age' ? 95 : rowCount + 1,
              maxOutlierValue: col.name === 'age' ? 98 : rowCount + 2,
              potentialImpact: 'Minimal impact on analysis'
            }
          },
          numericalPatterns: {
            zeroValuePercentage: 0,
            negativeValuePercentage: 0,
            roundNumbersNote: 'Some clustering around multiples of 5',
            logTransformationPotential: 'Not recommended'
          }
        };
      } else {
        // Categorical/Text analysis
        return {
          ...baseProfile,
          uniqueCategories: Math.floor(rowCount * 0.8),
          mostFrequentCategory: {
            label: col.name === 'name' ? 'John' : 'gmail.com',
            count: 5,
            percentage: 5,
            cumulativePercentage: 5
          },
          secondMostFrequentCategory: {
            label: col.name === 'name' ? 'Jane' : 'yahoo.com',
            count: 4,
            percentage: 4,
            cumulativePercentage: 9
          },
          leastFrequentCategory: {
            label: col.name === 'name' ? 'Zoe' : 'hotmail.com',
            count: 1,
            percentage: 1,
            cumulativePercentage: 100
          },
          frequencyDistribution: [
            { label: col.name === 'name' ? 'John' : 'gmail.com', count: 5, percentage: 5, cumulativePercentage: 5 },
            { label: col.name === 'name' ? 'Jane' : 'yahoo.com', count: 4, percentage: 4, cumulativePercentage: 9 }
          ],
          diversityMetrics: {
            shannonEntropy: 4.2,
            maxEntropy: 6.6,
            giniImpurity: 0.95,
            balanceInterpretation: 'Well-balanced distribution',
            majorCategoryDominance: 'No single category dominates'
          },
          labelAnalysis: {
            minLabelLength: col.name === 'email' ? 10 : 3,
            maxLabelLength: col.name === 'email' ? 25 : 15,
            avgLabelLength: col.name === 'email' ? 18 : 8,
            emptyLabelsCount: 2
          },
          recommendations: {
            highCardinalityWarning: rowCount > 50 ? 'High cardinality detected' : undefined,
            rareCategoriesNote: 'Some categories appear infrequently',
            suspectedTyposNote: 'Minor spelling variations detected'
          }
        };
      }
    });

    // Create bivariate analysis
    const numericalColumns = columns.filter(c => c.dataType === 'integer');
    const categoricalColumns = columns.filter(c => c.dataType === 'string');

    const bivariateAnalysis = {
      numericalVsNumerical: {
        totalPairsAnalyzed: Math.max(0, (numericalColumns.length * (numericalColumns.length - 1)) / 2),
        correlationPairs: numericalColumns.length > 1 ? [
          {
            variable1: numericalColumns[0].name,
            variable2: numericalColumns[1]?.name || numericalColumns[0].name,
            correlation: 0.25,
            pearsonCorrelation: 0.25,
            spearmanCorrelation: 0.28,
            pValue: 0.12,
            strength: 'weak',
            direction: 'positive',
            significance: 'not_significant',
            sampleSize: rowCount,
            interpretation: 'Weak positive correlation'
          }
        ] : [],
        strongestPositiveCorrelation: numericalColumns.length > 1 ? {
          variable1: numericalColumns[0].name,
          variable2: numericalColumns[1]?.name || numericalColumns[0].name,
          correlation: 0.25,
          strength: 'weak',
          direction: 'positive',
          significance: 'not_significant',
          sampleSize: rowCount
        } : null,
        strongestNegativeCorrelation: null,
        strongCorrelations: [],
        scatterPlotInsights: numericalColumns.length > 1 ? [
          {
            variable1: numericalColumns[0].name,
            variable2: numericalColumns[1]?.name || numericalColumns[0].name,
            pattern: 'random_scatter',
            outlierCount: 2,
            recommendedVisualization: 'scatter_plot',
            insights: 'No clear linear relationship'
          }
        ] : []
      },
      numericalVsCategorical: numericalColumns.length > 0 && categoricalColumns.length > 0 ? [
        {
          numericalVariable: numericalColumns[0].name,
          categoricalVariable: categoricalColumns[0].name,
          groupComparisons: [
            { category: 'Group A', count: 30, mean: 45, median: 44, standardDeviation: 15, quartile1st: 32, quartile3rd: 58 },
            { category: 'Group B', count: 70, mean: 42, median: 41, standardDeviation: 18, quartile1st: 28, quartile3rd: 55 }
          ],
          statisticalTests: {
            anova: { fStatistic: 1.25, pValue: 0.27, interpretation: 'No significant difference' },
            kruskalWallis: { hStatistic: 1.1, pValue: 0.29, interpretation: 'No significant difference' }
          },
          summary: 'No significant differences between groups'
        }
      ] : [],
      categoricalVsCategorical: categoricalColumns.length > 1 ? [
        {
          variable1: categoricalColumns[0].name,
          variable2: categoricalColumns[1].name,
          contingencyTable: {
            table: {
              'A': { 'X': 15, 'Y': 10 },
              'B': { 'X': 25, 'Y': 50 }
            },
            rowTotals: { 'A': 25, 'B': 75 },
            columnTotals: { 'X': 40, 'Y': 60 },
            grandTotal: 100
          },
          associationTests: {
            chiSquare: { statistic: 3.2, pValue: 0.07, degreesOfFreedom: 1, interpretation: 'Weak association' },
            cramersV: { statistic: 0.18, interpretation: 'Weak association' },
            contingencyCoefficient: { statistic: 0.176, interpretation: 'Weak association' }
          },
          insights: 'Weak association between variables'
        }
      ] : []
    };

    return {
      edaAnalysis: {
        univariateAnalysis,
        bivariateAnalysis,
        multivariateAnalysis: {
          summary: {
            analysisPerformed: numericalColumns.length >= 2,
            applicabilityAssessment: numericalColumns.length >= 2 ? 'Sufficient numerical variables' : 'Insufficient numerical variables',
            numericVariablesCount: numericalColumns.length,
            variablesAnalyzed: numericalColumns.map(c => c.name),
            sampleSize: rowCount,
            analysisLimitations: numericalColumns.length < 2 ? ['Too few numerical variables'] : []
          },
          principalComponentAnalysis: {
            isApplicable: numericalColumns.length >= 2,
            applicabilityReason: numericalColumns.length >= 2 ? 'Sufficient variables' : 'Insufficient variables',
            totalVariance: 100,
            componentsAnalyzed: Math.min(numericalColumns.length, 3),
            components: numericalColumns.length >= 2 ? [
              {
                componentNumber: 1,
                eigenvalue: 1.8,
                varianceExplained: 60,
                cumulativeVarianceExplained: 60,
                loadings: Object.fromEntries(numericalColumns.map(c => [c.name, Math.random() * 0.8 + 0.1])),
                interpretation: 'Primary component captures most variance'
              }
            ] : [],
            varianceThresholds: {
              componentsFor80Percent: 2,
              componentsFor85Percent: 2,
              componentsFor90Percent: 3,
              componentsFor95Percent: 3
            },
            dominantVariables: numericalColumns.map(c => ({
              variable: c.name,
              dominantComponent: 1,
              maxLoading: Math.random() * 0.8 + 0.1,
              interpretation: 'Primary contributor'
            })),
            dimensionalityRecommendations: ['Consider dimensionality reduction'],
            technicalDetails: {
              covarianceMatrix: [],
              correlationMatrix: [],
              standardizedData: true,
              numericVariablesUsed: numericalColumns.map(c => c.name),
              sampleSize: rowCount
            }
          },
          clusteringAnalysis: {
            isApplicable: numericalColumns.length >= 2 && rowCount >= 10,
            applicabilityReason: 'Sufficient data for clustering',
            optimalClusters: 3,
            optimalityMethod: 'elbow' as const,
            elbowAnalysis: [
              { k: 2, wcss: 150, silhouetteScore: 0.65, improvement: 25 },
              { k: 3, wcss: 120, silhouetteScore: 0.72, improvement: 20 },
              { k: 4, wcss: 105, silhouetteScore: 0.68, improvement: 12 }
            ],
            finalClustering: {
              k: 3,
              converged: true,
              iterations: 15,
              validation: {
                silhouetteScore: 0.72,
                silhouetteInterpretation: 'Good clustering',
                wcss: 120,
                betweenClusterVariance: 80,
                totalVariance: 200,
                varianceExplainedRatio: 0.4
              },
              clusterProfiles: [
                {
                  clusterId: 0,
                  clusterName: 'Cluster 1',
                  size: 35,
                  percentage: 35,
                  centroid: Object.fromEntries(numericalColumns.map(c => [c.name, Math.random() * 50 + 25])),
                  characteristics: numericalColumns.map(c => ({
                    variable: c.name,
                    mean: Math.random() * 50 + 25,
                    relativeToGlobal: 'similar' as const,
                    zScore: Math.random() * 0.5,
                    interpretation: 'Close to global average'
                  })),
                  distinctiveFeatures: ['Moderate values'],
                  description: 'Central cluster with typical values'
                }
              ]
            },
            insights: ['Clear cluster structure detected'],
            recommendations: ['Consider cluster-based analysis'],
            technicalDetails: {
              numericVariablesUsed: numericalColumns.map(c => c.name),
              standardizedData: true,
              sampleSize: rowCount,
              randomSeed: 42
            }
          },
          outlierDetection: {
            isApplicable: numericalColumns.length >= 2,
            applicabilityReason: 'Sufficient dimensions for multivariate outlier detection',
            method: 'mahalanobis_distance' as const,
            threshold: 0.05,
            criticalValue: 5.99,
            totalOutliers: 3,
            outlierPercentage: 3,
            outliers: [
              {
                rowIndex: 95,
                mahalanobisDistance: 6.5,
                pValue: 0.04,
                isOutlier: true,
                severity: 'moderate' as const,
                affectedVariables: numericalColumns.map(c => ({
                  variable: c.name,
                  value: Math.random() * 100,
                  zScore: Math.random() * 3 + 2,
                  contribution: Math.random() * 0.5 + 0.3
                })),
                interpretation: 'Moderate multivariate outlier'
              }
            ],
            severityDistribution: { mild: 1, moderate: 2, extreme: 0 },
            affectedVariables: numericalColumns.map(c => ({
              variable: c.name,
              outliersCount: 1,
              meanContribution: 0.4
            })),
            recommendations: ['Review outliers for data quality'],
            technicalDetails: {
              numericVariablesUsed: numericalColumns.map(c => c.name),
              covarianceMatrix: [],
              sampleSize: rowCount,
              degreesOfFreedom: numericalColumns.length
            }
          },
          normalityTests: {
            mardiasTest: {
              skewnessStatistic: 2.5,
              kurtosisStatistic: 1.8,
              skewnessPValue: 0.15,
              kurtosisPValue: 0.22,
              interpretation: 'Approximately multivariate normal'
            },
            roystonTest: {
              statistic: 0.95,
              pValue: 0.18,
              interpretation: 'Approximately multivariate normal'
            },
            overallAssessment: {
              isMultivariateNormal: true,
              confidence: 0.82,
              violations: [],
              recommendations: ['Data suitable for parametric methods']
            }
          },
          relationshipAnalysis: {
            variableInteractions: [],
            correlationStructure: {
              stronglyCorrelatedGroups: [],
              independentVariables: numericalColumns.map(c => c.name),
              redundantVariables: []
            },
            dimensionalityInsights: {
              effectiveDimensionality: numericalColumns.length,
              intrinsicDimensionality: Math.max(1, numericalColumns.length - 1),
              dimensionalityReduction: {
                recommended: numericalColumns.length > 3,
                methods: ['PCA', 'Factor Analysis'],
                expectedVarianceRetention: 0.85
              }
            }
          },
          insights: {
            keyFindings: [
              'Data shows normal distribution patterns',
              'Low correlation between variables',
              'Minimal outlier presence'
            ],
            dataQualityIssues: ['Minor missing values'],
            hypothesesGenerated: [
              'Variables appear independent',
              'No strong multivariate relationships'
            ],
            preprocessingRecommendations: [
              'Handle missing values',
              'Consider standardization for ML'
            ],
            analysisRecommendations: [
              'Suitable for most ML algorithms',
              'Consider feature engineering'
            ]
          },
          technicalMetadata: {
            analysisTime: 2500,
            memoryUsage: '512MB',
            computationalComplexity: 'O(n²)',
            algorithmsUsed: ['PCA', 'K-Means', 'Mahalanobis Distance']
          }
        },
        crossVariableInsights: {
          topFindings: [
            'Strong data quality across all variables',
            'Normal distribution patterns detected',
            'Low correlation structure'
          ],
          dataQualityIssues: [
            'Minor missing values in some columns'
          ],
          hypothesesGenerated: [
            'Variables are largely independent',
            'Data suitable for machine learning'
          ],
          preprocessingRecommendations: [
            'Handle missing values through imputation',
            'Consider feature scaling for distance-based algorithms'
          ]
        }
      },
      warnings: options.hasIssues ? [
        {
          category: 'statistical',
          severity: 'medium',
          message: 'Some statistical assumptions may be violated',
          impact: 'May affect advanced analyses',
          suggestion: 'Review distribution assumptions'
        }
      ] : [],
      performanceMetrics: {
        totalAnalysisTime: 2500,
        peakMemoryUsage: 512,
        phases: {
          univariate: 800,
          bivariate: 900,
          multivariate: 600,
          insights: 200
        }
      }
    };
  }

  /**
   * Create a complete mock set for all sections
   */
  static createCompleteMock(options: MockDataOptions = {}): {
    section1: any;
    section2: any;
    section3: any;
  } {
    return {
      section1: this.createSection1Mock(options),
      section2: this.createSection2Mock(options),
      section3: this.createSection3Mock(options)
    };
  }
}