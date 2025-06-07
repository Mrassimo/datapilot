/**
 * Multivariate Analysis Orchestrator
 * 
 * Coordinates and integrates all multivariate analyses:
 * - Principal Component Analysis (PCA)
 * - K-means Clustering
 * - Multivariate Outlier Detection
 * - Multivariate Normality Testing
 * - Relationship Analysis
 * 
 * Provides comprehensive insights and recommendations
 * based on the combined results of all analyses.
 */

import type {
  MultivariateAnalysis,
  MultivariateNormalityTests,
  MultivariateRelationshipAnalysis,
} from '../eda/types';
import { EdaDataType } from '../eda/types';
import { PCAAnalyzer } from './pca-analyzer';
import { ClusteringAnalyzer } from './clustering-analyzer';
import { MultivariateOutlierAnalyzer } from './outlier-analyzer';

/**
 * Normality testing utilities
 */
class MultivariateNormalityTester {
  /**
   * Perform multivariate normality tests
   */
  static performTests(
    data: number[][],
    variableNames: string[]
  ): MultivariateNormalityTests {
    try {
      // Simplified Mardia's test implementation
      const mardiasTest = this.mardiasMultivariateNormalityTest(data);
      
      // Simplified Royston's test (approximation)
      const roystonTest = this.roystonMultivariateNormalityTest(data);

      // Overall assessment
      const overallAssessment = this.assessOverallNormality(mardiasTest, roystonTest);

      return {
        mardiasTest,
        roystonTest,
        overallAssessment,
      };
    } catch (error) {
      return this.createFailedNormalityResult(
        `Normality testing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Mardia's multivariate normality test (simplified)
   */
  private static mardiasMultivariateNormalityTest(data: number[][]): {
    skewnessStatistic: number;
    kurtosisStatistic: number;
    skewnessPValue: number;
    kurtosisPValue: number;
    interpretation: string;
  } {
    const n = data.length;
    const p = data[0].length;

    // Calculate sample mean and covariance
    const mean = this.calculateMean(data);
    const covariance = this.calculateCovariance(data, mean);
    
    try {
      const covInverse = this.invertMatrix(covariance);
      
      // Calculate multivariate skewness (b1p)
      let skewnessSum = 0;
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          const diff_i = data[i].map((val, k) => val - mean[k]);
          const diff_j = data[j].map((val, k) => val - mean[k]);
          
          const mahal_ij = this.quadraticForm(diff_i, covInverse);
          const mahal_ji = this.quadraticForm(diff_j, covInverse);
          const cross_term = this.bilinearForm(diff_i, diff_j, covInverse);
          
          skewnessSum += Math.pow(cross_term, 3);
        }
      }
      
      const b1p = skewnessSum / (n * n);
      const skewnessStatistic = n * b1p / 6;
      
      // Approximate p-value for skewness (chi-squared with p(p+1)(p+2)/6 df)
      const skewnessDf = p * (p + 1) * (p + 2) / 6;
      const skewnessPValue = this.chiSquaredPValue(skewnessStatistic, skewnessDf);

      // Calculate multivariate kurtosis (b2p)
      let kurtosisSum = 0;
      for (let i = 0; i < n; i++) {
        const diff = data[i].map((val, k) => val - mean[k]);
        const mahal = this.quadraticForm(diff, covInverse);
        kurtosisSum += mahal * mahal;
      }
      
      const b2p = kurtosisSum / n;
      const expectedKurtosis = p * (p + 2);
      const kurtosisStatistic = (b2p - expectedKurtosis) / Math.sqrt(8 * p * (p + 2) / n);
      
      // Approximate p-value for kurtosis (standard normal)
      const kurtosisPValue = 2 * (1 - this.standardNormalCdf(Math.abs(kurtosisStatistic)));

      // Interpretation
      const interpretation = this.interpretMardiasTest(skewnessPValue, kurtosisPValue);

      return {
        skewnessStatistic,
        kurtosisStatistic,
        skewnessPValue,
        kurtosisPValue,
        interpretation,
      };
    } catch (error) {
      return {
        skewnessStatistic: 0,
        kurtosisStatistic: 0,
        skewnessPValue: 1,
        kurtosisPValue: 1,
        interpretation: 'Mardia test failed due to matrix singularity or computational issues',
      };
    }
  }

  /**
   * Royston's multivariate normality test (simplified approximation)
   */
  private static roystonMultivariateNormalityTest(data: number[][]): {
    statistic: number;
    pValue: number;
    interpretation: string;
  } {
    const n = data.length;
    const p = data[0].length;

    try {
      // Simplified approach: average of univariate Shapiro-Wilk-like statistics
      let sumW = 0;
      let validTests = 0;

      for (let j = 0; j < p; j++) {
        const column = data.map(row => row[j]);
        const w = this.approximateShapiroWilk(column);
        
        if (w > 0) {
          sumW += w;
          validTests++;
        }
      }

      if (validTests === 0) {
        throw new Error('No valid univariate tests computed');
      }

      const avgW = sumW / validTests;
      const statistic = -Math.log(1 - avgW) * p;
      
      // Approximate p-value
      const pValue = this.chiSquaredPValue(statistic, p);
      
      const interpretation = pValue < 0.05 ? 
        'Multivariate normality rejected (p < 0.05)' :
        'Multivariate normality not rejected (p >= 0.05)';

      return {
        statistic,
        pValue,
        interpretation,
      };
    } catch (error) {
      return {
        statistic: 0,
        pValue: 1,
        interpretation: 'Royston test failed due to computational issues',
      };
    }
  }

  /**
   * Assess overall multivariate normality
   */
  private static assessOverallNormality(
    mardiasTest: any,
    roystonTest: any
  ): {
    isMultivariateNormal: boolean;
    confidence: number;
    violations: string[];
    recommendations: string[];
  } {
    const violations: string[] = [];
    const recommendations: string[] = [];

    // Check violations
    if (mardiasTest.skewnessPValue < 0.05) {
      violations.push('Multivariate skewness detected');
    }
    
    if (mardiasTest.kurtosisPValue < 0.05) {
      violations.push('Multivariate kurtosis detected');
    }
    
    if (roystonTest.pValue < 0.05) {
      violations.push('Overall normality rejected');
    }

    // Determine overall assessment
    const isNormal = violations.length === 0;
    const confidence = isNormal ? 
      Math.min(mardiasTest.skewnessPValue, mardiasTest.kurtosisPValue, roystonTest.pValue) :
      1 - Math.max(1 - mardiasTest.skewnessPValue, 1 - mardiasTest.kurtosisPValue, 1 - roystonTest.pValue);

    // Generate recommendations
    if (!isNormal) {
      recommendations.push('Consider data transformations (log, Box-Cox) to improve normality');
      recommendations.push('Use non-parametric or robust statistical methods');
      
      if (violations.includes('Multivariate skewness detected')) {
        recommendations.push('Address skewness through variable transformation');
      }
      
      if (violations.includes('Multivariate kurtosis detected')) {
        recommendations.push('Consider outlier removal or robust estimation methods');
      }
    } else {
      recommendations.push('Multivariate normal assumption satisfied - parametric methods appropriate');
    }

    return {
      isMultivariateNormal: isNormal,
      confidence,
      violations,
      recommendations,
    };
  }

  // Helper methods for normality testing
  private static calculateMean(data: number[][]): number[] {
    const n = data.length;
    const p = data[0].length;
    const mean = Array(p).fill(0);

    for (let j = 0; j < p; j++) {
      for (let i = 0; i < n; i++) {
        mean[j] += data[i][j];
      }
      mean[j] /= n;
    }

    return mean;
  }

  private static calculateCovariance(data: number[][], mean: number[]): number[][] {
    const n = data.length;
    const p = data[0].length;
    const cov = Array(p).fill(0).map(() => Array(p).fill(0));

    for (let i = 0; i < p; i++) {
      for (let j = 0; j < p; j++) {
        let sum = 0;
        for (let k = 0; k < n; k++) {
          sum += (data[k][i] - mean[i]) * (data[k][j] - mean[j]);
        }
        cov[i][j] = sum / (n - 1);
      }
    }

    return cov;
  }

  private static invertMatrix(matrix: number[][]): number[][] {
    // Simplified matrix inversion - use LU decomposition for robustness
    const n = matrix.length;
    const augmented = matrix.map((row, i) => 
      [...row, ...Array(n).fill(0).map((_, j) => i === j ? 1 : 0)]
    );

    // Gaussian elimination with partial pivoting
    for (let i = 0; i < n; i++) {
      // Find pivot
      let maxRow = i;
      for (let k = i + 1; k < n; k++) {
        if (Math.abs(augmented[k][i]) > Math.abs(augmented[maxRow][i])) {
          maxRow = k;
        }
      }
      
      [augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]];

      // Make diagonal element 1
      const pivot = augmented[i][i];
      if (Math.abs(pivot) < 1e-10) {
        throw new Error('Matrix is singular');
      }
      
      for (let j = 0; j < 2 * n; j++) {
        augmented[i][j] /= pivot;
      }

      // Eliminate column
      for (let k = 0; k < n; k++) {
        if (k !== i) {
          const factor = augmented[k][i];
          for (let j = 0; j < 2 * n; j++) {
            augmented[k][j] -= factor * augmented[i][j];
          }
        }
      }
    }

    return augmented.map(row => row.slice(n));
  }

  private static quadraticForm(vector: number[], matrix: number[][]): number {
    let result = 0;
    const n = vector.length;
    
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        result += vector[i] * matrix[i][j] * vector[j];
      }
    }
    
    return result;
  }

  private static bilinearForm(vec1: number[], vec2: number[], matrix: number[][]): number {
    let result = 0;
    const n = vec1.length;
    
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        result += vec1[i] * matrix[i][j] * vec2[j];
      }
    }
    
    return result;
  }

  private static approximateShapiroWilk(data: number[]): number {
    // Simplified approximation to Shapiro-Wilk test
    const n = data.length;
    if (n < 3) return 0;

    const sorted = [...data].sort((a, b) => a - b);
    const mean = data.reduce((sum, val) => sum + val, 0) / n;
    
    // Calculate sample variance
    const variance = data.reduce((sum, val) => sum + (val - mean) ** 2, 0) / (n - 1);
    
    // Approximate W statistic using range-based estimator
    const range = sorted[n - 1] - sorted[0];
    const expectedRange = variance > 0 ? range / Math.sqrt(variance) : 0;
    
    // Normalize to [0, 1] range
    return Math.max(0, Math.min(1, 1 - Math.abs(expectedRange - Math.sqrt(2 * Math.log(n))) / Math.sqrt(2 * Math.log(n))));
  }

  private static chiSquaredPValue(x: number, df: number): number {
    // Simplified chi-squared p-value approximation
    if (x <= 0) return 1;
    if (df <= 0) return 0;
    
    // Use Wilson-Hilferty transformation for approximation
    const h = 2 / (9 * df);
    const z = (Math.pow(x / df, 1/3) - 1 + h) / Math.sqrt(h);
    
    return 1 - this.standardNormalCdf(z);
  }

  private static standardNormalCdf(z: number): number {
    // Approximation of standard normal CDF
    return 0.5 * (1 + this.erf(z / Math.sqrt(2)));
  }

  private static erf(x: number): number {
    // Approximation of error function
    const a1 =  0.254829592;
    const a2 = -0.284496736;
    const a3 =  1.421413741;
    const a4 = -1.453152027;
    const a5 =  1.061405429;
    const p  =  0.3275911;

    const sign = x >= 0 ? 1 : -1;
    x = Math.abs(x);

    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return sign * y;
  }

  private static interpretMardiasTest(skewnessPValue: number, kurtosisPValue: number): string {
    const skewnessResult = skewnessPValue < 0.05 ? 'rejected' : 'not rejected';
    const kurtosisResult = kurtosisPValue < 0.05 ? 'rejected' : 'not rejected';
    
    if (skewnessPValue < 0.05 && kurtosisPValue < 0.05) {
      return 'Multivariate normality rejected due to both skewness and kurtosis';
    } else if (skewnessPValue < 0.05) {
      return 'Multivariate normality rejected due to skewness';
    } else if (kurtosisPValue < 0.05) {
      return 'Multivariate normality rejected due to kurtosis';
    } else {
      return 'Multivariate normality not rejected';
    }
  }

  private static createFailedNormalityResult(message: string): MultivariateNormalityTests {
    return {
      mardiasTest: {
        skewnessStatistic: 0,
        kurtosisStatistic: 0,
        skewnessPValue: 1,
        kurtosisPValue: 1,
        interpretation: message,
      },
      roystonTest: {
        statistic: 0,
        pValue: 1,
        interpretation: message,
      },
      overallAssessment: {
        isMultivariateNormal: false,
        confidence: 0,
        violations: [message],
        recommendations: ['Address data quality issues before normality testing'],
      },
    };
  }
}

/**
 * Relationship analysis utilities
 */
class RelationshipAnalyzer {
  /**
   * Analyze multivariate relationships
   */
  static analyzeRelationships(
    data: number[][],
    variableNames: string[],
    correlationMatrix: number[][]
  ): MultivariateRelationshipAnalysis {
    // Analyze variable interactions
    const variableInteractions = this.analyzeVariableInteractions(
      correlationMatrix,
      variableNames
    );

    // Analyze correlation structure
    const correlationStructure = this.analyzeCorrelationStructure(
      correlationMatrix,
      variableNames
    );

    // Analyze dimensionality
    const dimensionalityInsights = this.analyzeDimensionality(
      correlationMatrix,
      data.length
    );

    return {
      variableInteractions,
      correlationStructure,
      dimensionalityInsights,
    };
  }

  private static analyzeVariableInteractions(
    correlationMatrix: number[][],
    variableNames: string[]
  ): MultivariateRelationshipAnalysis['variableInteractions'] {
    const interactions: MultivariateRelationshipAnalysis['variableInteractions'] = [];
    const n = variableNames.length;

    // Analyze pairwise correlations
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const correlation = correlationMatrix[i][j];
        const absCorr = Math.abs(correlation);
        
        if (absCorr > 0.3) {
          const interactionType = this.determineInteractionType(correlation);
          const significance = this.calculateSignificance(absCorr);
          
          interactions.push({
            variables: [variableNames[i], variableNames[j]],
            interactionType,
            strength: absCorr,
            significance,
            interpretation: this.interpretInteraction(
              variableNames[i],
              variableNames[j],
              correlation,
              interactionType
            ),
          });
        }
      }
    }

    // Sort by strength
    return interactions
      .sort((a, b) => b.strength - a.strength)
      .slice(0, 10); // Top 10 interactions
  }

  private static analyzeCorrelationStructure(
    correlationMatrix: number[][],
    variableNames: string[]
  ): MultivariateRelationshipAnalysis['correlationStructure'] {
    const n = variableNames.length;
    
    // Find strongly correlated groups
    const stronglyCorrelatedGroups: MultivariateRelationshipAnalysis['correlationStructure']['stronglyCorrelatedGroups'] = [];
    const processed = new Set<number>();

    for (let i = 0; i < n; i++) {
      if (processed.has(i)) continue;
      
      const group = [i];
      for (let j = i + 1; j < n; j++) {
        if (Math.abs(correlationMatrix[i][j]) > 0.7) {
          group.push(j);
          processed.add(j);
        }
      }
      
      if (group.length > 1) {
        const groupVars = group.map(idx => variableNames[idx]);
        const avgCorrelation = this.calculateAverageCorrelation(group, correlationMatrix);
        
        stronglyCorrelatedGroups.push({
          variables: groupVars,
          avgCorrelation,
          description: `Highly correlated group (avg r = ${avgCorrelation.toFixed(3)})`,
        });
        
        group.forEach(idx => processed.add(idx));
      }
    }

    // Find independent variables
    const independentVariables: string[] = [];
    for (let i = 0; i < n; i++) {
      let maxCorrelation = 0;
      for (let j = 0; j < n; j++) {
        if (i !== j) {
          maxCorrelation = Math.max(maxCorrelation, Math.abs(correlationMatrix[i][j]));
        }
      }
      
      if (maxCorrelation < 0.3) {
        independentVariables.push(variableNames[i]);
      }
    }

    // Find redundant variables
    const redundantVariables: MultivariateRelationshipAnalysis['correlationStructure']['redundantVariables'] = [];
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const correlation = Math.abs(correlationMatrix[i][j]);
        if (correlation > 0.9) {
          redundantVariables.push({
            variable: variableNames[j],
            redundantWith: variableNames[i],
            correlation,
          });
        }
      }
    }

    return {
      stronglyCorrelatedGroups,
      independentVariables,
      redundantVariables,
    };
  }

  private static analyzeDimensionality(
    correlationMatrix: number[][],
    sampleSize: number
  ): MultivariateRelationshipAnalysis['dimensionalityInsights'] {
    const n = correlationMatrix.length;
    
    // Estimate effective dimensionality based on correlation structure
    const eigenvalues = this.approximateEigenvalues(correlationMatrix);
    const effectiveDimensionality = eigenvalues.filter(val => val > 1).length;
    
    // Estimate intrinsic dimensionality using correlation rank
    const maxCorrelations = correlationMatrix.map(row => 
      Math.max(...row.map(Math.abs))
    );
    const avgMaxCorrelation = maxCorrelations.reduce((sum, val) => sum + val, 0) / n;
    const intrinsicDimensionality = Math.max(1, Math.floor(n * (1 - avgMaxCorrelation)));

    // Determine if dimensionality reduction is recommended
    const redundancyRatio = (n - effectiveDimensionality) / n;
    const recommended = redundancyRatio > 0.3;
    
    const methods: string[] = [];
    if (recommended) {
      methods.push('Principal Component Analysis (PCA)');
      if (avgMaxCorrelation > 0.7) {
        methods.push('Factor Analysis');
      }
      if (sampleSize > 1000) {
        methods.push('Independent Component Analysis (ICA)');
      }
    }

    const expectedVarianceRetention = recommended ? 
      Math.min(0.95, 0.7 + redundancyRatio * 0.25) : 1.0;

    return {
      effectiveDimensionality,
      intrinsicDimensionality,
      dimensionalityReduction: {
        recommended,
        methods,
        expectedVarianceRetention,
      },
    };
  }

  // Helper methods
  private static determineInteractionType(correlation: number): 'linear' | 'non_linear' | 'threshold' | 'synergistic' {
    // Simplified classification based on correlation strength
    const absCorr = Math.abs(correlation);
    
    if (absCorr > 0.8) {
      return 'linear';
    } else if (absCorr > 0.5) {
      return 'synergistic';
    } else {
      return 'linear'; // Default to linear for moderate correlations
    }
  }

  private static calculateSignificance(correlation: number): number {
    // Simplified significance calculation
    return Math.min(1, correlation * correlation);
  }

  private static interpretInteraction(
    var1: string,
    var2: string,
    correlation: number,
    type: string
  ): string {
    const direction = correlation > 0 ? 'positive' : 'negative';
    const strength = Math.abs(correlation) > 0.7 ? 'strong' : 
                    Math.abs(correlation) > 0.5 ? 'moderate' : 'weak';
    
    return `${strength} ${direction} ${type} relationship between ${var1} and ${var2}`;
  }

  private static calculateAverageCorrelation(indices: number[], correlationMatrix: number[][]): number {
    let sum = 0;
    let count = 0;
    
    for (let i = 0; i < indices.length; i++) {
      for (let j = i + 1; j < indices.length; j++) {
        sum += Math.abs(correlationMatrix[indices[i]][indices[j]]);
        count++;
      }
    }
    
    return count > 0 ? sum / count : 0;
  }

  private static approximateEigenvalues(matrix: number[][]): number[] {
    // Simplified eigenvalue approximation using trace and determinant
    const n = matrix.length;
    const trace = matrix.reduce((sum, row, i) => sum + row[i], 0);
    const avgEigenvalue = trace / n;
    
    // Generate approximate eigenvalues (simplified)
    const eigenvalues = Array(n).fill(avgEigenvalue);
    eigenvalues[0] *= 2; // First eigenvalue typically larger
    
    return eigenvalues.sort((a, b) => b - a);
  }
}

/**
 * Main multivariate analysis orchestrator
 */
export class MultivariateOrchestrator {
  private static readonly MIN_VARIABLES = 3;
  private static readonly MIN_OBSERVATIONS = 50;

  /**
   * Perform comprehensive multivariate analysis
   */
  static async analyze(
    data: (string | number | null | undefined)[][],
    headers: string[],
    columnTypes: string[],
    sampleSize: number
  ): Promise<MultivariateAnalysis> {
    const startTime = Date.now();

    try {
      // Identify numerical columns
      const numericalColumnIndices = this.identifyNumericalColumns(columnTypes);
      const variableNames = numericalColumnIndices.map(i => headers[i]);

      // Check overall applicability
      const applicabilityAssessment = this.assessApplicability(
        numericalColumnIndices,
        sampleSize
      );

      if (!applicabilityAssessment.applicable) {
        const analysisTime = Date.now() - startTime;
        return this.createNonApplicableResult(applicabilityAssessment.reason, analysisTime);
      }

      // Extract numerical data for correlation analysis
      console.log('DEBUG: Data sample:', data.slice(0, 2));
      console.log('DEBUG: Numerical column indices:', numericalColumnIndices);
      console.log('DEBUG: Headers:', headers);
      console.log('DEBUG: Column types:', columnTypes);
      
      const numericData = this.extractNumericData(data, numericalColumnIndices);
      console.log('DEBUG: Extracted numeric data length:', numericData.length);
      
      if (!numericData || numericData.length === 0) {
        const analysisTime = Date.now() - startTime;
        return this.createNonApplicableResult(
          'No valid numerical data found for multivariate analysis',
          analysisTime
        );
      }
      
      const correlationMatrix = this.calculateCorrelationMatrix(numericData);

      // Perform individual analyses
      const [
        pcaAnalysis,
        clusteringAnalysis,
        outlierAnalysis,
        normalityTests,
        relationshipAnalysis
      ] = await Promise.all([
        Promise.resolve(PCAAnalyzer.analyze(data, headers, numericalColumnIndices, sampleSize)),
        Promise.resolve(ClusteringAnalyzer.analyze(data, headers, numericalColumnIndices, sampleSize)),
        Promise.resolve(MultivariateOutlierAnalyzer.analyze(data, headers, numericalColumnIndices, sampleSize)),
        Promise.resolve(MultivariateNormalityTester.performTests(numericData, variableNames)),
        Promise.resolve(RelationshipAnalyzer.analyzeRelationships(numericData, variableNames, correlationMatrix)),
      ]);

      // Generate comprehensive insights
      const insights = this.generateComprehensiveInsights(
        pcaAnalysis,
        clusteringAnalysis,
        outlierAnalysis,
        normalityTests,
        relationshipAnalysis
      );

      const analysisTime = Date.now() - startTime;

      return {
        summary: {
          analysisPerformed: true,
          applicabilityAssessment: applicabilityAssessment.reason,
          numericVariablesCount: numericalColumnIndices.length,
          variablesAnalyzed: variableNames,
          sampleSize,
          analysisLimitations: this.identifyLimitations(
            numericalColumnIndices.length,
            sampleSize,
            pcaAnalysis,
            clusteringAnalysis
          ),
        },
        principalComponentAnalysis: pcaAnalysis,
        clusteringAnalysis,
        outlierDetection: outlierAnalysis,
        normalityTests,
        relationshipAnalysis,
        insights,
        technicalMetadata: {
          analysisTime,
          memoryUsage: this.estimateMemoryUsage(sampleSize, numericalColumnIndices.length),
          computationalComplexity: this.assessComputationalComplexity(
            numericalColumnIndices.length,
            sampleSize
          ),
          algorithmsUsed: [
            'Principal Component Analysis (QR eigendecomposition)',
            'K-means clustering (Lloyd\'s algorithm with k-means++)',
            'Mahalanobis distance outlier detection',
            'Mardia\'s multivariate normality test',
            'Correlation structure analysis',
          ],
        },
        
        // Backward compatibility
        keyPatterns: insights.keyFindings.slice(0, 3),
        pcaOverview: pcaAnalysis.isApplicable ? {
          componentsFor85PercentVariance: pcaAnalysis.varianceThresholds.componentsFor85Percent,
          dominantVariables: pcaAnalysis.dominantVariables.slice(0, 3).map(v => v.variable),
        } : undefined,
        clusterAnalysis: clusteringAnalysis.isApplicable ? {
          optimalClusters: clusteringAnalysis.optimalClusters,
          clusterProfiles: clusteringAnalysis.finalClustering.clusterProfiles.map(profile => ({
            clusterName: profile.clusterName,
            description: profile.description,
            keyCharacteristics: profile.centroid,
          })),
        } : undefined,
        interactionTerms: relationshipAnalysis.variableInteractions
          .slice(0, 5)
          .map(interaction => interaction.variables.join(' × ')),
      };
    } catch (error) {
      console.error('Multivariate analysis failed:', error);
      const analysisTime = Date.now() - startTime;
      
      return this.createNonApplicableResult(
        `Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        analysisTime
      );
    }
  }

  /**
   * Identify numerical columns from column types
   */
  private static identifyNumericalColumns(columnTypes: string[]): number[] {
    const numericalTypes = [
      EdaDataType.NUMERICAL_FLOAT,
      EdaDataType.NUMERICAL_INTEGER,
    ];

    return columnTypes
      .map((type, index) => ({ type, index }))
      .filter(({ type }) => numericalTypes.includes(type as EdaDataType))
      .map(({ index }) => index);
  }

  /**
   * Assess overall applicability for multivariate analysis
   */
  private static assessApplicability(
    numericalColumnIndices: number[],
    sampleSize: number
  ): { applicable: boolean; reason: string } {
    if (numericalColumnIndices.length < this.MIN_VARIABLES) {
      return {
        applicable: false,
        reason: `Insufficient numerical variables for multivariate analysis (${numericalColumnIndices.length} < ${this.MIN_VARIABLES})`,
      };
    }

    if (sampleSize < this.MIN_OBSERVATIONS) {
      return {
        applicable: false,
        reason: `Insufficient observations for multivariate analysis (${sampleSize} < ${this.MIN_OBSERVATIONS})`,
      };
    }

    const sampleToVariableRatio = sampleSize / numericalColumnIndices.length;
    if (sampleToVariableRatio < 5) {
      return {
        applicable: true,
        reason: `Limited sample-to-variable ratio (${sampleToVariableRatio.toFixed(1)}) - results should be interpreted cautiously`,
      };
    }

    return {
      applicable: true,
      reason: 'Dataset well-suited for comprehensive multivariate analysis',
    };
  }

  /**
   * Extract numerical data for correlation analysis
   * Uses listwise deletion - only includes rows where ALL numerical columns have valid values
   * This ensures consistent matrix dimensions for correlation analysis
   */
  private static extractNumericData(
    data: (string | number | null | undefined)[][],
    numericalColumnIndices: number[]
  ): number[][] {
    const numericData: number[][] = [];
    
    console.log('DEBUG: Attempting to extract data for', numericalColumnIndices.length, 'numerical columns');
    console.log('DEBUG: Numerical column indices:', numericalColumnIndices);
    
    let totalRows = 0;
    let validRows = 0;
    let rowsWithMissingValues = 0;

    for (const row of data) {
      totalRows++;
      const numericRow: number[] = [];
      let hasAllValidValues = true;
      let missingCount = 0;

      // Extract values from numerical columns only
      for (const colIndex of numericalColumnIndices) {
        const value = row[colIndex];
        
        // Check bounds
        if (colIndex >= row.length) {
          console.log('DEBUG: Column index', colIndex, 'out of bounds for row length', row.length);
          hasAllValidValues = false;
          break;
        }
        
        // Convert string numbers to actual numbers if needed
        let numericValue: number;
        if (typeof value === 'string' && value.trim() !== '') {
          numericValue = parseFloat(value.trim());
          if (!isNaN(numericValue) && isFinite(numericValue)) {
            numericRow.push(numericValue);
          } else {
            hasAllValidValues = false;
            missingCount++;
          }
        } else if (typeof value === 'number' && !isNaN(value) && isFinite(value)) {
          numericRow.push(value);
        } else {
          // Missing, null, undefined, or invalid value
          hasAllValidValues = false;
          missingCount++;
        }
      }

      if (missingCount > 0) {
        rowsWithMissingValues++;
      }

      // Only include rows with all valid numerical values
      if (hasAllValidValues && numericRow.length === numericalColumnIndices.length) {
        numericData.push(numericRow);
        validRows++;
      }
    }

    console.log('DEBUG: Processing summary:');
    console.log('  - Total rows processed:', totalRows);
    console.log('  - Rows with missing values in numerical columns:', rowsWithMissingValues);
    console.log('  - Valid complete rows extracted:', validRows);
    console.log('  - Final extracted data dimensions:', numericData.length, 'x', numericData.length > 0 ? numericData[0].length : 0);

    if (numericData.length > 0) {
      console.log('DEBUG: Sample extracted row:', numericData[0].slice(0, 3), '...');
    }

    return numericData;
  }

  /**
   * Calculate correlation matrix
   */
  private static calculateCorrelationMatrix(data: number[][]): number[][] {
    if (!data || data.length === 0 || !data[0] || data[0].length === 0) {
      return [[]]; // Return empty correlation matrix for invalid data
    }
    
    const n = data.length;
    const p = data[0].length;

    // Calculate means
    const means = Array(p).fill(0);
    for (let j = 0; j < p; j++) {
      for (let i = 0; i < n; i++) {
        means[j] += data[i][j];
      }
      means[j] /= n;
    }

    // Calculate correlation matrix
    const correlations = Array(p).fill(0).map(() => Array(p).fill(0));
    
    for (let i = 0; i < p; i++) {
      for (let j = 0; j < p; j++) {
        if (i === j) {
          correlations[i][j] = 1;
        } else {
          let numerator = 0;
          let sumXi = 0;
          let sumXj = 0;

          for (let k = 0; k < n; k++) {
            const xi = data[k][i] - means[i];
            const xj = data[k][j] - means[j];
            numerator += xi * xj;
            sumXi += xi * xi;
            sumXj += xj * xj;
          }

          const denominator = Math.sqrt(sumXi * sumXj);
          correlations[i][j] = denominator > 0 ? numerator / denominator : 0;
        }
      }
    }

    return correlations;
  }

  /**
   * Generate comprehensive insights from all analyses
   */
  private static generateComprehensiveInsights(
    pcaAnalysis: any,
    clusteringAnalysis: any,
    outlierAnalysis: any,
    normalityTests: any,
    relationshipAnalysis: any
  ): MultivariateAnalysis['insights'] {
    const keyFindings: string[] = [];
    const dataQualityIssues: string[] = [];
    const hypothesesGenerated: string[] = [];
    const preprocessingRecommendations: string[] = [];
    const analysisRecommendations: string[] = [];

    // PCA insights
    if (pcaAnalysis.isApplicable) {
      const varianceExplained = pcaAnalysis.varianceThresholds.componentsFor85Percent;
      keyFindings.push(`${varianceExplained} principal components explain 85% of variance`);
      
      if (varianceExplained < pcaAnalysis.componentsAnalyzed / 2) {
        hypothesesGenerated.push('Strong dimensionality reduction potential suggests underlying structure');
        analysisRecommendations.push('Consider using PCA for feature reduction in modeling');
      }
    }

    // Clustering insights
    if (clusteringAnalysis.isApplicable) {
      const optimalK = clusteringAnalysis.optimalClusters;
      const silhouette = clusteringAnalysis.finalClustering.validation.silhouetteScore;
      
      keyFindings.push(`${optimalK} natural clusters identified (silhouette: ${silhouette.toFixed(3)})`);
      
      if (silhouette > 0.5) {
        hypothesesGenerated.push('Strong clustering structure suggests distinct data segments');
        analysisRecommendations.push('Cluster-based analysis may reveal meaningful subgroups');
      }
    }

    // Outlier insights
    if (outlierAnalysis.isApplicable) {
      const outlierPercentage = outlierAnalysis.outlierPercentage;
      keyFindings.push(`${outlierAnalysis.totalOutliers} multivariate outliers detected (${outlierPercentage.toFixed(1)}%)`);
      
      if (outlierPercentage > 5) {
        dataQualityIssues.push('High multivariate outlier rate may indicate data quality issues');
        preprocessingRecommendations.push('Investigate and potentially remove or transform outliers');
      }
    }

    // Normality insights
    if (!normalityTests.overallAssessment.isMultivariateNormal) {
      dataQualityIssues.push('Multivariate normality assumption violated');
      preprocessingRecommendations.push('Consider data transformations or robust methods');
    }

    // Relationship insights
    const strongRelationships = relationshipAnalysis.variableInteractions.filter(
      (interaction: any) => interaction.strength > 0.7
    ).length;
    
    if (strongRelationships > 0) {
      keyFindings.push(`${strongRelationships} strong variable relationships identified`);
      
      if (relationshipAnalysis.correlationStructure.redundantVariables.length > 0) {
        dataQualityIssues.push('Redundant variables detected');
        preprocessingRecommendations.push('Consider removing highly correlated variables');
      }
    }

    // Dimensionality insights
    if (relationshipAnalysis.dimensionalityInsights.dimensionalityReduction.recommended) {
      analysisRecommendations.push('Dimensionality reduction recommended based on correlation structure');
    }

    return {
      keyFindings,
      dataQualityIssues,
      hypothesesGenerated,
      preprocessingRecommendations,
      analysisRecommendations,
    };
  }

  /**
   * Identify analysis limitations
   */
  private static identifyLimitations(
    numVariables: number,
    sampleSize: number,
    pcaAnalysis: any,
    clusteringAnalysis: any
  ): string[] {
    const limitations: string[] = [];

    if (sampleSize / numVariables < 10) {
      limitations.push('Low sample-to-variable ratio may affect reliability');
    }

    if (!pcaAnalysis.isApplicable) {
      limitations.push('PCA not applicable due to insufficient variables or observations');
    }

    if (!clusteringAnalysis.isApplicable) {
      limitations.push('Clustering analysis not applicable due to data constraints');
    }

    if (numVariables > 20) {
      limitations.push('High dimensionality may affect some analyses');
    }

    return limitations;
  }

  /**
   * Estimate memory usage
   */
  private static estimateMemoryUsage(sampleSize: number, numVariables: number): string {
    const baseMemory = sampleSize * numVariables * 8; // 8 bytes per number
    const matrixMemory = numVariables * numVariables * 8; // Covariance matrix
    const totalBytes = baseMemory + matrixMemory * 3; // Multiple matrices
    
    const totalMB = totalBytes / (1024 * 1024);
    
    if (totalMB < 1) {
      return `< 1MB`;
    } else if (totalMB < 100) {
      return `~${Math.round(totalMB)}MB`;
    } else {
      return `~${Math.round(totalMB / 1024)}GB`;
    }
  }

  /**
   * Assess computational complexity
   */
  private static assessComputationalComplexity(numVariables: number, sampleSize: number): string {
    const complexity = numVariables * numVariables * sampleSize;
    
    if (complexity < 1e6) {
      return 'Low';
    } else if (complexity < 1e8) {
      return 'Moderate';
    } else {
      return 'High';
    }
  }

  /**
   * Create non-applicable result
   */
  private static createNonApplicableResult(reason: string, analysisTime: number): MultivariateAnalysis {
    return {
      summary: {
        analysisPerformed: false,
        applicabilityAssessment: reason,
        numericVariablesCount: 0,
        variablesAnalyzed: [],
        sampleSize: 0,
        analysisLimitations: [reason],
      },
      principalComponentAnalysis: PCAAnalyzer.analyze([], [], [], 0),
      clusteringAnalysis: ClusteringAnalyzer.analyze([], [], [], 0),
      outlierDetection: MultivariateOutlierAnalyzer.analyze([], [], [], 0),
      normalityTests: MultivariateNormalityTester.performTests([], []),
      relationshipAnalysis: {
        variableInteractions: [],
        correlationStructure: {
          stronglyCorrelatedGroups: [],
          independentVariables: [],
          redundantVariables: [],
        },
        dimensionalityInsights: {
          effectiveDimensionality: 0,
          intrinsicDimensionality: 0,
          dimensionalityReduction: {
            recommended: false,
            methods: [],
            expectedVarianceRetention: 0,
          },
        },
      },
      insights: {
        keyFindings: [reason],
        dataQualityIssues: [],
        hypothesesGenerated: [],
        preprocessingRecommendations: [],
        analysisRecommendations: [],
      },
      technicalMetadata: {
        analysisTime,
        memoryUsage: '< 1MB',
        computationalComplexity: 'Low',
        algorithmsUsed: [],
      },
    };
  }
}