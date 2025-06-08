/**
 * Multivariate Outlier Detection Implementation
 *
 * Features:
 * - Mahalanobis distance-based outlier detection
 * - Chi-squared distribution for threshold determination
 * - Robust covariance estimation options
 * - Detailed outlier profiling and interpretation
 * - Variable contribution analysis for outlier understanding
 */

import type { MultivariateOutlierAnalysis, MultivariateOutlier } from '../eda/types';

interface IsolationTreeNode {
  type: 'node';
  splitFeature: number;
  splitValue: number;
  left: IsolationTreeNode | IsolationTreeLeaf;
  right: IsolationTreeNode | IsolationTreeLeaf;
}

interface IsolationTreeLeaf {
  type: 'leaf';
  size: number;
}
import { chisqccdf } from '../statistical-tests/distributions';

/**
 * Matrix operations for outlier detection
 */
class MatrixOperations {
  /**
   * Calculate matrix determinant using LU decomposition
   */
  static determinant(matrix: number[][]): number {
    const n = matrix.length;
    const lu = this.luDecomposition(matrix);

    let det = 1;
    for (let i = 0; i < n; i++) {
      det *= lu.L[i][i] * lu.U[i][i];
    }

    return lu.permutationParity * det;
  }

  /**
   * LU decomposition with partial pivoting
   */
  static luDecomposition(matrix: number[][]): {
    L: number[][];
    U: number[][];
    permutationParity: number;
  } {
    const n = matrix.length;
    const L = Array(n)
      .fill(0)
      .map(() => Array(n).fill(0));
    const U = matrix.map((row) => [...row]);
    let permutationParity = 1;

    // Initialize L as identity matrix
    for (let i = 0; i < n; i++) {
      L[i][i] = 1;
    }

    for (let k = 0; k < n - 1; k++) {
      // Find pivot
      let maxRow = k;
      for (let i = k + 1; i < n; i++) {
        if (Math.abs(U[i][k]) > Math.abs(U[maxRow][k])) {
          maxRow = i;
        }
      }

      // Swap rows if needed
      if (maxRow !== k) {
        [U[k], U[maxRow]] = [U[maxRow], U[k]];
        permutationParity *= -1;
      }

      // Gaussian elimination
      for (let i = k + 1; i < n; i++) {
        if (Math.abs(U[k][k]) < 1e-10) {
          throw new Error('Matrix is singular');
        }

        const factor = U[i][k] / U[k][k];
        L[i][k] = factor;

        for (let j = k; j < n; j++) {
          U[i][j] -= factor * U[k][j];
        }
      }
    }

    return { L, U, permutationParity };
  }

  /**
   * Solve linear system Ax = b using LU decomposition
   */
  static solve(A: number[][], b: number[]): number[] {
    const n = A.length;
    const { L, U } = this.luDecomposition(A);

    // Forward substitution: Ly = b
    const y = Array(n).fill(0);
    for (let i = 0; i < n; i++) {
      let sum = 0;
      for (let j = 0; j < i; j++) {
        sum += L[i][j] * y[j];
      }
      y[i] = b[i] - sum;
    }

    // Back substitution: Ux = y
    const x = Array(n).fill(0);
    for (let i = n - 1; i >= 0; i--) {
      let sum = 0;
      for (let j = i + 1; j < n; j++) {
        sum += U[i][j] * x[j];
      }
      x[i] = (y[i] - sum) / U[i][i];
    }

    return x;
  }

  /**
   * Matrix inversion using LU decomposition
   */
  static invert(matrix: number[][]): number[][] {
    const n = matrix.length;
    const inverse = Array(n)
      .fill(0)
      .map(() => Array(n).fill(0));
    const identity = Array(n)
      .fill(0)
      .map((_, i) =>
        Array(n)
          .fill(0)
          .map((_, j) => (i === j ? 1 : 0)),
      );

    try {
      for (let i = 0; i < n; i++) {
        const column = this.solve(matrix, identity[i]);
        for (let j = 0; j < n; j++) {
          inverse[j][i] = column[j];
        }
      }
      return inverse;
    } catch (error) {
      throw new Error('Matrix is not invertible');
    }
  }

  /**
   * Matrix multiplication
   */
  static multiply(A: number[][], B: number[][]): number[][] {
    const aRows = A.length;
    const aCols = A[0].length;
    const bCols = B[0].length;

    if (aCols !== B.length) {
      throw new Error('Matrix dimensions incompatible for multiplication');
    }

    const result = Array(aRows)
      .fill(0)
      .map(() => Array(bCols).fill(0));

    for (let i = 0; i < aRows; i++) {
      for (let j = 0; j < bCols; j++) {
        let sum = 0;
        for (let k = 0; k < aCols; k++) {
          sum += A[i][k] * B[k][j];
        }
        result[i][j] = sum;
      }
    }
    return result;
  }

  /**
   * Vector-matrix multiplication (row vector)
   */
  static vectorMatrixMultiply(vector: number[], matrix: number[][]): number[] {
    const result = Array(matrix[0].length).fill(0);

    for (let j = 0; j < matrix[0].length; j++) {
      for (let i = 0; i < vector.length; i++) {
        result[j] += vector[i] * matrix[i][j];
      }
    }

    return result;
  }

  /**
   * Dot product of two vectors
   */
  static dotProduct(a: number[], b: number[]): number {
    let sum = 0;
    for (let i = 0; i < a.length; i++) {
      sum += a[i] * b[i];
    }
    return sum;
  }
}

/**
 * Robust statistics for outlier detection
 */
class RobustStatistics {
  /**
   * Calculate Minimum Covariance Determinant (MCD) estimator
   * Simplified implementation for moderate sample sizes
   */
  static minimumCovarianceDeterminant(
    data: number[][],
    subsampleRatio: number = 0.75,
  ): {
    location: number[];
    scatter: number[][];
    outlierFlags: boolean[];
  } {
    const n = data.length;
    const p = data[0].length;
    const h = Math.floor(n * subsampleRatio);

    if (h < p + 1) {
      throw new Error('Insufficient sample size for MCD estimation');
    }

    let bestDeterminant = Infinity;
    let bestLocation: number[] = [];
    let bestScatter: number[][] = [];
    let bestSubset: number[] = [];

    // Try multiple random subsets
    const numTrials = Math.min(500, Math.max(10, n));

    for (let trial = 0; trial < numTrials; trial++) {
      // Random subset selection
      const subset = this.randomSubset(n, h, trial);
      const subsetData = subset.map((i) => data[i]);

      try {
        // Calculate sample statistics for subset
        const location = this.calculateMean(subsetData);
        const scatter = this.calculateCovarianceMatrix(subsetData, location);

        // Calculate determinant
        const det = MatrixOperations.determinant(scatter);

        if (det > 0 && det < bestDeterminant) {
          bestDeterminant = det;
          bestLocation = location;
          bestScatter = scatter;
          bestSubset = subset;
        }
      } catch (error) {
        // Skip this subset if singular
        continue;
      }
    }

    if (bestDeterminant === Infinity) {
      // Fallback to standard estimators
      bestLocation = this.calculateMean(data);
      bestScatter = this.calculateCovarianceMatrix(data, bestLocation);
    }

    // Calculate outlier flags based on Mahalanobis distances
    const outlierFlags = this.calculateOutlierFlags(data, bestLocation, bestScatter);

    return {
      location: bestLocation,
      scatter: bestScatter,
      outlierFlags,
    };
  }

  /**
   * Generate random subset for MCD
   */
  private static randomSubset(n: number, h: number, seed: number): number[] {
    const indices = Array.from({ length: n }, (_, i) => i);

    // Simple seeded shuffle
    let state = seed;
    for (let i = n - 1; i > 0; i--) {
      state = (state * 1664525 + 1013904223) % Math.pow(2, 32);
      const j = Math.floor((state / Math.pow(2, 32)) * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }

    return indices.slice(0, h);
  }

  /**
   * Calculate sample mean
   */
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

  /**
   * Calculate covariance matrix
   */
  private static calculateCovarianceMatrix(data: number[][], mean: number[]): number[][] {
    const n = data.length;
    const p = data[0].length;
    const cov = Array(p)
      .fill(0)
      .map(() => Array(p).fill(0));

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

  /**
   * Calculate outlier flags using Mahalanobis distance
   */
  private static calculateOutlierFlags(
    data: number[][],
    location: number[],
    scatter: number[][],
  ): boolean[] {
    const criticalValue = 3.0; // Conservative threshold

    return data.map((point) => {
      try {
        const distance = this.mahalanobisDistance(point, location, scatter);
        return distance > criticalValue;
      } catch (error) {
        return false;
      }
    });
  }

  /**
   * Calculate Mahalanobis distance
   */
  static mahalanobisDistance(
    point: number[],
    center: number[],
    covarianceInverse: number[][],
  ): number {
    const diff = point.map((val, i) => val - center[i]);
    const temp = MatrixOperations.vectorMatrixMultiply(diff, covarianceInverse);
    return Math.sqrt(MatrixOperations.dotProduct(diff, temp));
  }
}

/**
 * Advanced outlier detection methods
 */
class AdvancedOutlierDetection {
  /**
   * Isolation Forest outlier detection
   * Effective for high-dimensional data and various types of anomalies
   */
  static isolationForest(
    data: number[][],
    numTrees: number = 100,
    subsampleSize: number = 256,
    contamination: number = 0.1,
  ): {
    outlierScores: number[];
    threshold: number;
    outlierIndices: number[];
  } {
    const n = data.length;

    // Build isolation trees
    const trees = this.buildIsolationTrees(data, numTrees, subsampleSize);

    // Calculate anomaly scores
    const pathLengths = data.map((point) => this.calculateAveragePathLength(point, trees));

    // Normalize scores using expected path length
    const c = this.expectedPathLength(subsampleSize);
    const anomalyScores = pathLengths.map((length) => Math.pow(2, -length / c));

    // Determine threshold
    const sortedScores = [...anomalyScores].sort((a, b) => b - a);
    const thresholdIndex = Math.floor(contamination * n);
    const threshold = sortedScores[thresholdIndex];

    // Identify outliers
    const outlierIndices = anomalyScores
      .map((score, index) => ({ score, index }))
      .filter((item) => item.score >= threshold)
      .map((item) => item.index);

    return {
      outlierScores: anomalyScores,
      threshold,
      outlierIndices,
    };
  }

  /**
   * Local Outlier Factor (LOF) detection
   * Identifies outliers based on local density deviations
   */
  static localOutlierFactor(
    data: number[][],
    k: number = 20,
    contamination: number = 0.1,
  ): {
    lofScores: number[];
    threshold: number;
    outlierIndices: number[];
  } {
    const n = data.length;

    // Calculate k-distance and k-neighbors for each point
    const neighborInfo = data.map((point, i) => {
      const distances = data
        .map((otherPoint, j) => ({
          distance: this.euclideanDistance(point, otherPoint),
          index: j,
        }))
        .filter((item) => item.index !== i)
        .sort((a, b) => a.distance - b.distance);

      const kNeighbors = distances.slice(0, k);
      const kDistance = kNeighbors[k - 1].distance;

      return {
        index: i,
        kNeighbors: kNeighbors.map((n) => n.index),
        kDistance,
      };
    });

    // Calculate local reachability density
    const lrd = neighborInfo.map((info) => {
      const reachDistSum = info.kNeighbors.reduce((sum, neighborIndex) => {
        const neighborKDist = neighborInfo[neighborIndex].kDistance;
        const actualDist = this.euclideanDistance(data[info.index], data[neighborIndex]);
        return sum + Math.max(actualDist, neighborKDist);
      }, 0);

      return info.kNeighbors.length / reachDistSum;
    });

    // Calculate LOF scores
    const lofScores = neighborInfo.map((info, i) => {
      const neighborLRDs = info.kNeighbors.map((neighborIndex) => lrd[neighborIndex]);
      const avgNeighborLRD = neighborLRDs.reduce((sum, val) => sum + val, 0) / neighborLRDs.length;

      return avgNeighborLRD / lrd[i];
    });

    // Determine threshold
    const sortedScores = [...lofScores].sort((a, b) => b - a);
    const thresholdIndex = Math.floor(contamination * n);
    const threshold = sortedScores[thresholdIndex];

    // Identify outliers
    const outlierIndices = lofScores
      .map((score, index) => ({ score, index }))
      .filter((item) => item.score >= threshold)
      .map((item) => item.index);

    return {
      lofScores,
      threshold,
      outlierIndices,
    };
  }

  /**
   * Ensemble outlier detection combining multiple methods
   */
  static ensembleOutlierDetection(
    data: number[][],
    contamination: number = 0.1,
  ): {
    ensembleScores: number[];
    methodScores: {
      mahalanobis: number[];
      isolationForest: number[];
      lof: number[];
    };
    threshold: number;
    outlierIndices: number[];
    consensus: Array<{
      index: number;
      methodsAgreeing: number;
      confidenceScore: number;
    }>;
  } {
    const n = data.length;

    // Calculate Mahalanobis distances
    const { mahalanobisDistances } = this.calculateMahalanobisDistances(data);

    // Calculate Isolation Forest scores
    const { outlierScores: isolationScores } = this.isolationForest(
      data,
      50,
      Math.min(256, Math.floor(n * 0.8)),
      contamination,
    );

    // Calculate LOF scores
    const { lofScores } = this.localOutlierFactor(
      data,
      Math.min(20, Math.floor(n * 0.1)),
      contamination,
    );

    // Normalize all scores to [0, 1] range
    const normalizedMahalanobis = this.normalizeScores(mahalanobisDistances);
    const normalizedIsolation = this.normalizeScores(isolationScores);
    const normalizedLOF = this.normalizeScores(lofScores);

    // Calculate ensemble scores (weighted average)
    const weights = { mahalanobis: 0.4, isolation: 0.3, lof: 0.3 };
    const ensembleScores = normalizedMahalanobis.map(
      (score, i) =>
        weights.mahalanobis * score +
        weights.isolation * normalizedIsolation[i] +
        weights.lof * normalizedLOF[i],
    );

    // Determine threshold
    const sortedScores = [...ensembleScores].sort((a, b) => b - a);
    const thresholdIndex = Math.floor(contamination * n);
    const threshold = sortedScores[thresholdIndex];

    // Calculate consensus
    const methodThresholds = {
      mahalanobis: this.calculateThreshold(normalizedMahalanobis, contamination),
      isolation: this.calculateThreshold(normalizedIsolation, contamination),
      lof: this.calculateThreshold(normalizedLOF, contamination),
    };

    const consensus = ensembleScores.map((score, index) => {
      let methodsAgreeing = 0;
      if (normalizedMahalanobis[index] >= methodThresholds.mahalanobis) methodsAgreeing++;
      if (normalizedIsolation[index] >= methodThresholds.isolation) methodsAgreeing++;
      if (normalizedLOF[index] >= methodThresholds.lof) methodsAgreeing++;

      const confidenceScore = score * (methodsAgreeing / 3);

      return {
        index,
        methodsAgreeing,
        confidenceScore,
      };
    });

    // Identify outliers
    const outlierIndices = ensembleScores
      .map((score, index) => ({ score, index }))
      .filter((item) => item.score >= threshold)
      .map((item) => item.index);

    return {
      ensembleScores,
      methodScores: {
        mahalanobis: normalizedMahalanobis,
        isolationForest: normalizedIsolation,
        lof: normalizedLOF,
      },
      threshold,
      outlierIndices,
      consensus,
    };
  }

  // Helper methods
  private static buildIsolationTrees(
    data: number[][],
    numTrees: number,
    subsampleSize: number,
  ): Array<any> {
    const trees = [];

    for (let t = 0; t < numTrees; t++) {
      // Random subsample
      const subsample = this.randomSample(data, subsampleSize);

      // Build tree (simplified)
      const tree = this.buildIsolationTree(subsample, 0, Math.ceil(Math.log2(subsampleSize)));
      trees.push(tree);
    }

    return trees;
  }

  private static buildIsolationTree(
    data: number[][],
    currentDepth: number,
    maxDepth: number,
  ): IsolationTreeNode | IsolationTreeLeaf {
    if (data.length <= 1 || currentDepth >= maxDepth) {
      return { type: 'leaf', size: data.length };
    }

    // Random split
    const p = data[0].length;
    const splitFeature = Math.floor(Math.random() * p);
    const featureValues = data.map((point) => point[splitFeature]);
    const minVal = Math.min(...featureValues);
    const maxVal = Math.max(...featureValues);
    const splitValue = Math.random() * (maxVal - minVal) + minVal;

    const leftData = data.filter((point) => point[splitFeature] < splitValue);
    const rightData = data.filter((point) => point[splitFeature] >= splitValue);

    return {
      type: 'node',
      splitFeature,
      splitValue,
      left: this.buildIsolationTree(leftData, currentDepth + 1, maxDepth),
      right: this.buildIsolationTree(rightData, currentDepth + 1, maxDepth),
    };
  }

  private static calculateAveragePathLength(point: number[], trees: Array<any>): number {
    const pathLengths = trees.map((tree) => this.calculatePathLength(point, tree, 0));
    return pathLengths.reduce((sum, length) => sum + length, 0) / pathLengths.length;
  }

  private static calculatePathLength(
    point: number[],
    node: IsolationTreeNode | IsolationTreeLeaf,
    currentDepth: number,
  ): number {
    if (node.type === 'leaf') {
      return currentDepth + this.expectedPathLength(node.size);
    }

    if (point[node.splitFeature] < node.splitValue) {
      return this.calculatePathLength(point, node.left, currentDepth + 1);
    } else {
      return this.calculatePathLength(point, node.right, currentDepth + 1);
    }
  }

  private static expectedPathLength(n: number): number {
    if (n <= 1) return 0;
    return 2 * (Math.log(n - 1) + 0.5772156649) - (2 * (n - 1)) / n;
  }

  private static randomSample<T>(array: T[], size: number): T[] {
    const shuffled = [...array].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(size, array.length));
  }

  private static euclideanDistance(a: number[], b: number[]): number {
    let sum = 0;
    for (let i = 0; i < a.length; i++) {
      const diff = a[i] - b[i];
      sum += diff * diff;
    }
    return Math.sqrt(sum);
  }

  private static calculateMahalanobisDistances(data: number[][]): {
    mahalanobisDistances: number[];
    mean: number[];
    covarianceMatrix: number[][];
  } {
    const n = data.length;
    const p = data[0].length;

    // Calculate mean
    const mean = Array(p).fill(0);
    for (let j = 0; j < p; j++) {
      for (let i = 0; i < n; i++) {
        mean[j] += data[i][j];
      }
      mean[j] /= n;
    }

    // Calculate covariance matrix
    const cov = Array(p)
      .fill(0)
      .map(() => Array(p).fill(0));
    for (let i = 0; i < p; i++) {
      for (let j = 0; j < p; j++) {
        for (let k = 0; k < n; k++) {
          cov[i][j] += (data[k][i] - mean[i]) * (data[k][j] - mean[j]);
        }
        cov[i][j] /= n - 1;
      }
    }

    // Invert covariance matrix
    const covInv = MatrixOperations.invert(cov);

    // Calculate Mahalanobis distances
    const distances = data.map((point) => {
      const diff = point.map((val, i) => val - mean[i]);
      const temp = MatrixOperations.vectorMatrixMultiply(diff, covInv);
      return Math.sqrt(MatrixOperations.dotProduct(diff, temp));
    });

    return {
      mahalanobisDistances: distances,
      mean,
      covarianceMatrix: cov,
    };
  }

  private static normalizeScores(scores: number[]): number[] {
    const minScore = Math.min(...scores);
    const maxScore = Math.max(...scores);
    const range = maxScore - minScore;

    if (range === 0) {
      return scores.map(() => 0);
    }

    return scores.map((score) => (score - minScore) / range);
  }

  private static calculateThreshold(scores: number[], contamination: number): number {
    const sortedScores = [...scores].sort((a, b) => b - a);
    const thresholdIndex = Math.floor(contamination * scores.length);
    return sortedScores[thresholdIndex];
  }
}

/**
 * Main multivariate outlier analyzer
 */
export class MultivariateOutlierAnalyzer {
  private static readonly MIN_VARIABLES = 2;
  private static readonly MIN_OBSERVATIONS = 30;
  private static readonly MAX_VARIABLES = 20;
  private static readonly OUTLIER_THRESHOLD = 0.05; // 5% significance level

  /**
   * Perform complete multivariate outlier analysis
   */
  static analyze(
    data: (string | number | null | undefined)[][],
    headers: string[],
    numericalColumnIndices: number[],
    sampleSize: number,
  ): MultivariateOutlierAnalysis {
    try {
      // Check applicability
      const applicabilityCheck = this.checkApplicability(numericalColumnIndices, sampleSize);

      if (!applicabilityCheck.isApplicable) {
        return this.createNonApplicableResult(applicabilityCheck.reason);
      }

      // Extract numerical data
      const numericData = this.extractNumericData(data, numericalColumnIndices);
      const variableNames = numericalColumnIndices.map((i) => headers[i]);

      if (numericData.length === 0) {
        return this.createNonApplicableResult('No valid numerical data found');
      }

      // Calculate robust statistics using MCD
      const robustStats = RobustStatistics.minimumCovarianceDeterminant(numericData);

      // Calculate Mahalanobis distances and p-values
      const outliers = this.detectOutliers(
        numericData,
        robustStats.location,
        robustStats.scatter,
        variableNames,
      );

      // Calculate critical value for chi-squared distribution
      const degreesOfFreedom = variableNames.length;
      const criticalValue = this.calculateCriticalValue(degreesOfFreedom, this.OUTLIER_THRESHOLD);

      // Filter outliers based on threshold
      const significantOutliers = outliers.filter((o) => o.pValue < this.OUTLIER_THRESHOLD);

      // Analyze severity distribution
      const severityDistribution = this.analyzeSeverityDistribution(significantOutliers);

      // Analyze affected variables
      const affectedVariables = this.analyzeAffectedVariables(significantOutliers, variableNames);

      // Generate recommendations
      const recommendations = this.generateRecommendations(
        significantOutliers,
        outliers.length,
        affectedVariables,
      );

      return {
        isApplicable: true,
        applicabilityReason:
          'Sufficient numerical variables and observations for outlier detection',
        method: 'mahalanobis_distance',
        threshold: this.OUTLIER_THRESHOLD,
        criticalValue,
        totalOutliers: significantOutliers.length,
        outlierPercentage: (significantOutliers.length / numericData.length) * 100,
        outliers: significantOutliers.slice(0, 20), // Limit to top 20 for performance
        severityDistribution,
        affectedVariables,
        recommendations,
        technicalDetails: {
          numericVariablesUsed: variableNames,
          covarianceMatrix: robustStats.scatter,
          sampleSize: numericData.length,
          degreesOfFreedom,
        },
      };
    } catch (error) {
      console.error('Multivariate outlier analysis failed:', error);
      return this.createNonApplicableResult(
        `Outlier analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Check if outlier detection is applicable
   */
  private static checkApplicability(
    numericalColumnIndices: number[],
    sampleSize: number,
  ): { isApplicable: boolean; reason: string } {
    if (numericalColumnIndices.length < this.MIN_VARIABLES) {
      return {
        isApplicable: false,
        reason: `Insufficient numerical variables (${numericalColumnIndices.length} < ${this.MIN_VARIABLES})`,
      };
    }

    if (sampleSize < this.MIN_OBSERVATIONS) {
      return {
        isApplicable: false,
        reason: `Insufficient observations (${sampleSize} < ${this.MIN_OBSERVATIONS})`,
      };
    }

    if (numericalColumnIndices.length > this.MAX_VARIABLES) {
      return {
        isApplicable: false,
        reason: `Too many variables for outlier detection (${numericalColumnIndices.length} > ${this.MAX_VARIABLES})`,
      };
    }

    const minSampleToVariableRatio = 5;
    if (sampleSize / numericalColumnIndices.length < minSampleToVariableRatio) {
      return {
        isApplicable: false,
        reason: `Insufficient sample-to-variable ratio (${(sampleSize / numericalColumnIndices.length).toFixed(1)} < ${minSampleToVariableRatio})`,
      };
    }

    return {
      isApplicable: true,
      reason: 'Dataset suitable for multivariate outlier detection',
    };
  }

  /**
   * Extract numerical data and handle missing values
   */
  private static extractNumericData(
    data: (string | number | null | undefined)[][],
    numericalColumnIndices: number[],
  ): number[][] {
    const numericData: number[][] = [];

    for (const row of data) {
      const numericRow: number[] = [];
      let hasAllValidValues = true;

      // Extract values from numerical columns only
      for (const colIndex of numericalColumnIndices) {
        const value = row[colIndex];

        // Check bounds
        if (colIndex >= row.length) {
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
            break;
          }
        } else if (typeof value === 'number' && !isNaN(value) && isFinite(value)) {
          numericRow.push(value);
        } else {
          // Missing, null, undefined, or invalid value
          hasAllValidValues = false;
          break;
        }
      }

      // Only include rows with all valid numerical values
      if (hasAllValidValues && numericRow.length === numericalColumnIndices.length) {
        numericData.push(numericRow);
      }
    }

    return numericData;
  }

  /**
   * Detect outliers using Mahalanobis distance
   */
  private static detectOutliers(
    data: number[][],
    center: number[],
    covariance: number[][],
    variableNames: string[],
  ): MultivariateOutlier[] {
    const outliers: MultivariateOutlier[] = [];

    // Invert covariance matrix
    let covarianceInverse: number[][];
    try {
      covarianceInverse = MatrixOperations.invert(covariance);
    } catch (error) {
      throw new Error('Covariance matrix is singular - cannot compute Mahalanobis distances');
    }

    const degreesOfFreedom = variableNames.length;

    for (let i = 0; i < data.length; i++) {
      const point = data[i];

      // Calculate Mahalanobis distance
      const distance = RobustStatistics.mahalanobisDistance(point, center, covarianceInverse);

      // Convert to p-value using chi-squared distribution
      const chiSquaredStatistic = distance * distance;
      const pValue = chisqccdf(chiSquaredStatistic, degreesOfFreedom);

      // Determine severity
      const severity = this.determineSeverity(pValue);

      // Calculate variable contributions
      const affectedVariables = this.calculateVariableContributions(
        point,
        center,
        covarianceInverse,
        variableNames,
      );

      outliers.push({
        rowIndex: i,
        mahalanobisDistance: distance,
        pValue,
        isOutlier: pValue < this.OUTLIER_THRESHOLD,
        severity,
        affectedVariables,
        interpretation: this.interpretOutlier(distance, pValue, severity, affectedVariables),
      });
    }

    // Sort by p-value (most significant first)
    return outliers.sort((a, b) => a.pValue - b.pValue);
  }

  /**
   * Calculate critical value for chi-squared distribution
   */
  private static calculateCriticalValue(degreesOfFreedom: number, alpha: number): number {
    // Approximate critical values for common cases
    // For more precision, would use inverse chi-squared function
    const criticalValues: Record<number, Record<string, number>> = {
      2: { '0.05': 5.99, '0.01': 9.21, '0.001': 13.82 },
      3: { '0.05': 7.81, '0.01': 11.34, '0.001': 16.27 },
      4: { '0.05': 9.49, '0.01': 13.28, '0.001': 18.47 },
      5: { '0.05': 11.07, '0.01': 15.09, '0.001': 20.52 },
    };

    const alphaStr = alpha.toString();
    if (criticalValues[degreesOfFreedom] && criticalValues[degreesOfFreedom][alphaStr]) {
      return criticalValues[degreesOfFreedom][alphaStr];
    }

    // Fallback approximation: χ²(df, α) ≈ df + √(2*df) * Φ⁻¹(1-α)
    const zAlpha = alpha === 0.05 ? 1.96 : alpha === 0.01 ? 2.58 : 3.29;
    return degreesOfFreedom + Math.sqrt(2 * degreesOfFreedom) * zAlpha;
  }

  /**
   * Determine outlier severity based on p-value
   */
  private static determineSeverity(pValue: number): 'mild' | 'moderate' | 'extreme' {
    if (pValue < 0.001) return 'extreme';
    if (pValue < 0.01) return 'moderate';
    return 'mild';
  }

  /**
   * Calculate variable contributions to outlier score
   */
  private static calculateVariableContributions(
    point: number[],
    center: number[],
    covarianceInverse: number[][],
    variableNames: string[],
  ): MultivariateOutlier['affectedVariables'] {
    const diff = point.map((val, i) => val - center[i]);
    const contributions: MultivariateOutlier['affectedVariables'] = [];

    for (let i = 0; i < variableNames.length; i++) {
      // Calculate partial Mahalanobis distance for this variable
      const partialContribution = Math.abs(diff[i] * covarianceInverse[i][i] * diff[i]);
      const zScore = diff[i] / Math.sqrt(1 / covarianceInverse[i][i]);

      contributions.push({
        variable: variableNames[i],
        value: point[i],
        zScore,
        contribution: partialContribution,
      });
    }

    // Sort by contribution magnitude
    return contributions.sort((a, b) => b.contribution - a.contribution);
  }

  /**
   * Interpret outlier characteristics
   */
  private static interpretOutlier(
    distance: number,
    pValue: number,
    severity: string,
    affectedVariables: MultivariateOutlier['affectedVariables'],
  ): string {
    const topVariables = affectedVariables
      .slice(0, 2)
      .map((v) => v.variable)
      .join(' and ');

    const severityText =
      severity === 'extreme'
        ? 'extremely unusual'
        : severity === 'moderate'
          ? 'moderately unusual'
          : 'mildly unusual';

    return `${severityText} observation (p=${pValue.toFixed(4)}) primarily driven by ${topVariables}`;
  }

  /**
   * Analyze severity distribution of outliers
   */
  private static analyzeSeverityDistribution(outliers: MultivariateOutlier[]): {
    mild: number;
    moderate: number;
    extreme: number;
  } {
    const distribution = { mild: 0, moderate: 0, extreme: 0 };

    for (const outlier of outliers) {
      distribution[outlier.severity]++;
    }

    return distribution;
  }

  /**
   * Analyze which variables are most affected by outliers
   */
  private static analyzeAffectedVariables(
    outliers: MultivariateOutlier[],
    variableNames: string[],
  ): Array<{
    variable: string;
    outliersCount: number;
    meanContribution: number;
  }> {
    const variableStats: Record<string, { count: number; totalContribution: number }> = {};

    // Initialize stats for all variables
    for (const varName of variableNames) {
      variableStats[varName] = { count: 0, totalContribution: 0 };
    }

    // Accumulate statistics
    for (const outlier of outliers) {
      for (const affected of outlier.affectedVariables) {
        variableStats[affected.variable].count++;
        variableStats[affected.variable].totalContribution += affected.contribution;
      }
    }

    // Convert to final format
    return Object.entries(variableStats)
      .map(([variable, stats]) => ({
        variable,
        outliersCount: stats.count,
        meanContribution: stats.count > 0 ? stats.totalContribution / stats.count : 0,
      }))
      .sort((a, b) => b.meanContribution - a.meanContribution);
  }

  /**
   * Generate recommendations based on outlier analysis
   */
  private static generateRecommendations(
    outliers: MultivariateOutlier[],
    totalObservations: number,
    affectedVariables: Array<{ variable: string; outliersCount: number; meanContribution: number }>,
  ): string[] {
    const recommendations: string[] = [];
    const outlierPercentage = (outliers.length / totalObservations) * 100;

    // Outlier percentage recommendations
    if (outlierPercentage > 10) {
      recommendations.push(
        'High outlier rate (>10%) suggests systematic data quality issues or model misspecification',
      );
    } else if (outlierPercentage > 5) {
      recommendations.push(
        'Moderate outlier rate (5-10%) - investigate potential data collection issues',
      );
    } else if (outlierPercentage < 1) {
      recommendations.push('Low outlier rate (<1%) indicates good data quality');
    }

    // Severity-based recommendations
    const extremeOutliers = outliers.filter((o) => o.severity === 'extreme');
    if (extremeOutliers.length > 0) {
      recommendations.push(
        `${extremeOutliers.length} extreme outliers detected - manual investigation recommended`,
      );
    }

    // Variable-specific recommendations
    const topAffectedVariable = affectedVariables[0];
    if (topAffectedVariable && topAffectedVariable.outliersCount > outliers.length * 0.6) {
      recommendations.push(
        `Variable '${topAffectedVariable.variable}' contributes to most outliers - check data quality`,
      );
    }

    // Action recommendations
    if (outliers.length > 0) {
      recommendations.push('Consider investigating outliers before statistical modeling');
      recommendations.push(
        'Evaluate whether outliers represent legitimate extreme values or data errors',
      );
    }

    if (recommendations.length === 0) {
      recommendations.push('No significant multivariate outliers detected');
    }

    return recommendations;
  }

  /**
   * Create non-applicable outlier result
   */
  private static createNonApplicableResult(reason: string): MultivariateOutlierAnalysis {
    return {
      isApplicable: false,
      applicabilityReason: reason,
      method: 'mahalanobis_distance',
      threshold: 0.05,
      criticalValue: 0,
      totalOutliers: 0,
      outlierPercentage: 0,
      outliers: [],
      severityDistribution: { mild: 0, moderate: 0, extreme: 0 },
      affectedVariables: [],
      recommendations: [reason],
      technicalDetails: {
        numericVariablesUsed: [],
        covarianceMatrix: [],
        sampleSize: 0,
        degreesOfFreedom: 0,
      },
    };
  }
}
