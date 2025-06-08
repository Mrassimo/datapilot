/**
 * Principal Component Analysis (PCA) Implementation
 *
 * Features:
 * - Numerically stable eigenvalue decomposition using QR algorithm
 * - Automatic data standardization and centering
 * - Comprehensive variance explained analysis
 * - Component interpretation and loading analysis
 * - Dimensionality reduction recommendations
 * - Scree plot data generation
 */

import type { PCAAnalysis, PrincipalComponent } from '../eda/types';

/**
 * Mathematical utilities for PCA computation
 */
class MatrixMath {
  /**
   * Create an identity matrix of size n x n
   */
  static identity(n: number): number[][] {
    const matrix = Array(n)
      .fill(0)
      .map(() => Array(n).fill(0));
    for (let i = 0; i < n; i++) {
      matrix[i][i] = 1;
    }
    return matrix;
  }

  /**
   * Transpose a matrix
   */
  static transpose(matrix: number[][]): number[][] {
    const rows = matrix.length;
    const cols = matrix[0].length;
    const result = Array(cols)
      .fill(0)
      .map(() => Array(rows).fill(0));

    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        result[j][i] = matrix[i][j];
      }
    }
    return result;
  }

  /**
   * Multiply two matrices
   */
  static multiply(a: number[][], b: number[][]): number[][] {
    const aRows = a.length;
    const aCols = a[0].length;
    const bCols = b[0].length;

    if (aCols !== b.length) {
      throw new Error('Matrix dimensions incompatible for multiplication');
    }

    const result = Array(aRows)
      .fill(0)
      .map(() => Array(bCols).fill(0));

    for (let i = 0; i < aRows; i++) {
      for (let j = 0; j < bCols; j++) {
        let sum = 0;
        for (let k = 0; k < aCols; k++) {
          sum += a[i][k] * b[k][j];
        }
        result[i][j] = sum;
      }
    }
    return result;
  }

  /**
   * Calculate the Frobenius norm of a matrix
   */
  static frobeniusNorm(matrix: number[][]): number {
    let sum = 0;
    for (const row of matrix) {
      for (const val of row) {
        sum += val * val;
      }
    }
    return Math.sqrt(sum);
  }

  /**
   * Calculate covariance matrix from standardized data
   */
  static covarianceMatrix(data: number[][]): number[][] {
    const n = data.length; // observations
    const p = data[0].length; // variables

    const cov = Array(p)
      .fill(0)
      .map(() => Array(p).fill(0));

    for (let i = 0; i < p; i++) {
      for (let j = 0; j < p; j++) {
        let sum = 0;
        for (let k = 0; k < n; k++) {
          sum += data[k][i] * data[k][j];
        }
        cov[i][j] = sum / (n - 1);
      }
    }

    return cov;
  }

  /**
   * QR decomposition using Gram-Schmidt process with column pivoting
   */
  static qrDecomposition(matrix: number[][]): { Q: number[][]; R: number[][] } {
    const m = matrix.length;
    const n = matrix[0].length;

    const Q = Array(m)
      .fill(0)
      .map(() => Array(n).fill(0));
    const R = Array(n)
      .fill(0)
      .map(() => Array(n).fill(0));

    // Copy matrix to avoid modifying original
    const A = matrix.map((row) => [...row]);

    for (let j = 0; j < n; j++) {
      // Compute the j-th column of Q
      for (let i = 0; i < m; i++) {
        Q[i][j] = A[i][j];
      }

      // Orthogonalize against previous columns
      for (let k = 0; k < j; k++) {
        let dot = 0;
        for (let i = 0; i < m; i++) {
          dot += Q[i][k] * A[i][j];
        }
        R[k][j] = dot;

        for (let i = 0; i < m; i++) {
          Q[i][j] -= dot * Q[i][k];
        }
      }

      // Normalize the column
      let norm = 0;
      for (let i = 0; i < m; i++) {
        norm += Q[i][j] * Q[i][j];
      }
      norm = Math.sqrt(norm);

      if (norm > 1e-10) {
        R[j][j] = norm;
        for (let i = 0; i < m; i++) {
          Q[i][j] /= norm;
        }
      } else {
        R[j][j] = 0;
        for (let i = 0; i < m; i++) {
          Q[i][j] = 0;
        }
      }
    }

    return { Q, R };
  }
}

/**
 * Eigenvalue decomposition using QR algorithm with shifts
 */
class EigenDecomposition {
  private static readonly MAX_ITERATIONS = 1000;
  private static readonly TOLERANCE = 1e-12;

  /**
   * Compute eigenvalues and eigenvectors using QR algorithm
   */
  static compute(matrix: number[][]): {
    eigenvalues: number[];
    eigenvectors: number[][];
    converged: boolean;
  } {
    const n = matrix.length;

    // Make a copy to avoid modifying original
    let A = matrix.map((row) => [...row]);
    let V = MatrixMath.identity(n); // Accumulate eigenvectors

    let converged = false;
    let iteration = 0;

    while (iteration < this.MAX_ITERATIONS && !converged) {
      // Apply Wilkinson shift for better convergence
      const shift = this.wilkinsonShift(A);

      // Subtract shift from diagonal
      for (let i = 0; i < n; i++) {
        A[i][i] -= shift;
      }

      // QR decomposition
      const { Q, R } = MatrixMath.qrDecomposition(A);

      // A = RQ + shift*I
      A = MatrixMath.multiply(R, Q);
      for (let i = 0; i < n; i++) {
        A[i][i] += shift;
      }

      // Update eigenvectors
      V = MatrixMath.multiply(V, Q);

      // Check convergence (off-diagonal elements should be small)
      converged = this.isConverged(A);
      iteration++;
    }

    // Extract eigenvalues (diagonal elements)
    const eigenvalues = A.map((row, i) => row[i]);

    // Sort eigenvalues and eigenvectors in descending order
    const indices = eigenvalues
      .map((val, idx) => ({ val, idx }))
      .sort((a, b) => b.val - a.val)
      .map((item) => item.idx);

    const sortedEigenvalues = indices.map((i) => eigenvalues[i]);
    const sortedEigenvectors = MatrixMath.transpose(V).map((_, i) => indices.map((j) => V[i][j]));

    return {
      eigenvalues: sortedEigenvalues,
      eigenvectors: sortedEigenvectors,
      converged: converged && iteration < this.MAX_ITERATIONS,
    };
  }

  /**
   * Wilkinson shift for improved convergence
   */
  private static wilkinsonShift(matrix: number[][]): number {
    const n = matrix.length;
    if (n < 2) return 0;

    const a = matrix[n - 2][n - 2];
    const b = matrix[n - 2][n - 1];
    const c = matrix[n - 1][n - 2];
    const d = matrix[n - 1][n - 1];

    const trace = a + d;
    const det = a * d - b * c;
    const discriminant = trace * trace - 4 * det;

    if (discriminant < 0) return d; // Complex eigenvalues

    const sqrt_disc = Math.sqrt(discriminant);
    const lambda1 = (trace + sqrt_disc) / 2;
    const lambda2 = (trace - sqrt_disc) / 2;

    // Choose eigenvalue closer to d
    return Math.abs(d - lambda1) < Math.abs(d - lambda2) ? lambda1 : lambda2;
  }

  /**
   * Check if QR iteration has converged
   */
  private static isConverged(matrix: number[][]): boolean {
    const n = matrix.length;
    let maxOffDiag = 0;

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i !== j) {
          maxOffDiag = Math.max(maxOffDiag, Math.abs(matrix[i][j]));
        }
      }
    }

    return maxOffDiag < this.TOLERANCE;
  }
}

/**
 * Advanced feature importance and variable selection
 */
class FeatureImportanceAnalyzer {
  /**
   * Calculate feature importance based on PCA loadings
   */
  static calculateFeatureImportance(
    components: Array<{ eigenvalue: number; loadings: Record<string, number> }>,
    variableNames: string[],
    numComponents: number = 3,
  ): Array<{
    variable: string;
    importance: number;
    contributingComponents: Array<{ component: number; loading: number; weight: number }>;
    interpretation: string;
  }> {
    const featureImportance: Record<
      string,
      {
        totalImportance: number;
        components: Array<{ component: number; loading: number; weight: number }>;
      }
    > = {};

    // Initialize feature importance tracking
    for (const variable of variableNames) {
      featureImportance[variable] = {
        totalImportance: 0,
        components: [],
      };
    }

    // Calculate weighted importance across specified components
    const componentsToAnalyze = Math.min(numComponents, components.length);

    for (let i = 0; i < componentsToAnalyze; i++) {
      const component = components[i];
      const eigenvalueWeight = component.eigenvalue; // Weight by explained variance

      for (const variable of variableNames) {
        const loading = component.loadings[variable] || 0;
        const weightedImportance = Math.abs(loading) * eigenvalueWeight;

        featureImportance[variable].totalImportance += weightedImportance;
        featureImportance[variable].components.push({
          component: i + 1,
          loading,
          weight: weightedImportance,
        });
      }
    }

    // Normalize importance scores
    const maxImportance = Math.max(
      ...Object.values(featureImportance).map((f) => f.totalImportance),
    );

    const results = variableNames.map((variable) => {
      const feature = featureImportance[variable];
      const normalizedImportance = maxImportance > 0 ? feature.totalImportance / maxImportance : 0;

      // Sort contributing components by weight
      const sortedComponents = feature.components
        .sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight))
        .slice(0, 3); // Top 3 contributing components

      const interpretation = this.interpretFeatureImportance(
        normalizedImportance,
        sortedComponents,
        variable,
      );

      return {
        variable,
        importance: normalizedImportance,
        contributingComponents: sortedComponents,
        interpretation,
      };
    });

    return results.sort((a, b) => b.importance - a.importance);
  }

  /**
   * Perform variable selection based on importance scores
   */
  static performVariableSelection(
    featureImportance: Array<{
      variable: string;
      importance: number;
    }>,
    selectionMethod: 'top_k' | 'threshold' | 'elbow' = 'threshold',
    parameter: number = 0.1,
  ): {
    selectedVariables: string[];
    rejectedVariables: string[];
    selectionRatio: number;
    method: string;
    rationale: string;
  } {
    let selectedVariables: string[] = [];
    let rationale = '';

    switch (selectionMethod) {
      case 'top_k':
        const k = Math.min(Math.floor(parameter), featureImportance.length);
        selectedVariables = featureImportance.slice(0, k).map((f) => f.variable);
        rationale = `Selected top ${k} most important variables`;
        break;

      case 'threshold':
        selectedVariables = featureImportance
          .filter((f) => f.importance >= parameter)
          .map((f) => f.variable);
        rationale = `Selected variables with importance >= ${parameter.toFixed(3)}`;
        break;

      case 'elbow':
        const elbowPoint = this.findElbowPoint(featureImportance.map((f) => f.importance));
        selectedVariables = featureImportance.slice(0, elbowPoint + 1).map((f) => f.variable);
        rationale = `Selected variables up to elbow point (${elbowPoint + 1} variables)`;
        break;
    }

    // Ensure at least one variable is selected
    if (selectedVariables.length === 0 && featureImportance.length > 0) {
      selectedVariables = [featureImportance[0].variable];
      rationale += ' (minimum: 1 variable)';
    }

    const rejectedVariables = featureImportance
      .map((f) => f.variable)
      .filter((v) => !selectedVariables.includes(v));

    const selectionRatio =
      featureImportance.length > 0 ? selectedVariables.length / featureImportance.length : 0;

    return {
      selectedVariables,
      rejectedVariables,
      selectionRatio,
      method: selectionMethod,
      rationale,
    };
  }

  // Helper methods
  private static interpretFeatureImportance(
    importance: number,
    components: Array<{ component: number; loading: number; weight: number }>,
    variable: string,
  ): string {
    let level: string;
    if (importance > 0.8) level = 'critical';
    else if (importance > 0.6) level = 'high';
    else if (importance > 0.4) level = 'moderate';
    else if (importance > 0.2) level = 'low';
    else level = 'minimal';

    const topComponent = components[0];
    const direction = topComponent?.loading > 0 ? 'positively' : 'negatively';

    return `${level} importance variable (${(importance * 100).toFixed(1)}%), contributes ${direction} to PC${topComponent?.component}`;
  }

  private static findElbowPoint(values: number[]): number {
    if (values.length <= 2) return 0;

    // Calculate second differences to find elbow
    const differences: number[] = [];
    for (let i = 1; i < values.length - 1; i++) {
      const secondDiff = values[i - 1] - 2 * values[i] + values[i + 1];
      differences.push(secondDiff);
    }

    // Find maximum second difference (elbow point)
    let maxDiffIndex = 0;
    let maxDiff = differences[0];

    for (let i = 1; i < differences.length; i++) {
      if (differences[i] > maxDiff) {
        maxDiff = differences[i];
        maxDiffIndex = i;
      }
    }

    return maxDiffIndex + 1; // Adjust for offset
  }
}

/**
 * Main PCA Analyzer class
 */
export class PCAAnalyzer {
  private static readonly MIN_VARIABLES = 3;
  private static readonly MIN_OBSERVATIONS = 50;
  private static readonly MAX_VARIABLES = 50; // Performance limit

  /**
   * Perform complete PCA analysis
   */
  static analyze(
    data: (string | number | null | undefined)[][],
    headers: string[],
    numericalColumnIndices: number[],
    sampleSize: number,
  ): PCAAnalysis {
    const startTime = Date.now();

    try {
      // Check applicability
      const applicabilityCheck = this.checkApplicability(numericalColumnIndices, sampleSize);

      if (!applicabilityCheck.isApplicable) {
        return this.createNonApplicableResult(applicabilityCheck.reason);
      }

      // Extract and standardize numerical data
      const numericData = this.extractNumericData(data, numericalColumnIndices);
      const variableNames = numericalColumnIndices.map((i) => headers[i]);

      const standardizedData = this.standardizeData(numericData);

      // Compute covariance matrix
      const covarianceMatrix = MatrixMath.covarianceMatrix(standardizedData);

      // Compute correlation matrix for interpretation
      const correlationMatrix = this.computeCorrelationMatrix(numericData);

      // Eigenvalue decomposition
      const { eigenvalues, eigenvectors, converged } = EigenDecomposition.compute(covarianceMatrix);

      if (!converged) {
        return this.createNonApplicableResult('Eigenvalue decomposition failed to converge');
      }

      // Calculate variance explained
      const totalVariance = eigenvalues.reduce((sum, val) => sum + Math.max(0, val), 0);

      // Create principal components
      const components = this.createPrincipalComponents(
        eigenvalues,
        eigenvectors,
        variableNames,
        totalVariance,
      );

      // Calculate variance thresholds
      const varianceThresholds = this.calculateVarianceThresholds(components);

      // Analyze dominant variables
      const dominantVariables = this.analyzeDominantVariables(components, variableNames);

      // Calculate feature importance
      const featureImportance = FeatureImportanceAnalyzer.calculateFeatureImportance(
        components,
        variableNames,
        Math.min(5, components.length),
      );

      // Perform variable selection
      const variableSelection = FeatureImportanceAnalyzer.performVariableSelection(
        featureImportance,
        'threshold',
        0.2,
      );

      // Generate recommendations
      const recommendations = this.generateDimensionalityRecommendations(
        components,
        varianceThresholds,
        numericalColumnIndices.length,
        featureImportance,
        variableSelection,
      );

      // Create scree plot data
      const screeData = eigenvalues.map((val, idx) => ({
        component: idx + 1,
        eigenvalue: Math.max(0, val),
      }));

      const analysisTime = Date.now() - startTime;

      return {
        isApplicable: true,
        applicabilityReason: 'Sufficient numerical variables and observations for PCA',
        totalVariance,
        componentsAnalyzed: components.length,
        components,
        screeData,
        varianceThresholds,
        dominantVariables,
        dimensionalityRecommendations: recommendations,
        featureImportance,
        variableSelection,
        technicalDetails: {
          covarianceMatrix,
          correlationMatrix,
          standardizedData: true,
          numericVariablesUsed: variableNames,
          sampleSize,
          eigenvalueDecompositionConverged: converged,
        },
      };
    } catch (error) {
      console.error('PCA analysis failed:', error);
      return this.createNonApplicableResult(
        `PCA analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Check if PCA is applicable to the dataset
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
        reason: `Too many variables for current implementation (${numericalColumnIndices.length} > ${this.MAX_VARIABLES})`,
      };
    }

    const minSampleToVariableRatio = 3;
    if (sampleSize / numericalColumnIndices.length < minSampleToVariableRatio) {
      return {
        isApplicable: false,
        reason: `Insufficient sample-to-variable ratio (${(sampleSize / numericalColumnIndices.length).toFixed(1)} < ${minSampleToVariableRatio})`,
      };
    }

    return {
      isApplicable: true,
      reason: 'Dataset suitable for PCA analysis',
    };
  }

  /**
   * Extract numerical data and handle missing values
   * Converts string numbers to actual numbers and uses listwise deletion
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
   * Standardize data (center and scale)
   */
  private static standardizeData(data: number[][]): number[][] {
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

    // Calculate standard deviations
    const stds = Array(p).fill(0);
    for (let j = 0; j < p; j++) {
      for (let i = 0; i < n; i++) {
        stds[j] += Math.pow(data[i][j] - means[j], 2);
      }
      stds[j] = Math.sqrt(stds[j] / (n - 1));
    }

    // Standardize
    const standardized = Array(n)
      .fill(0)
      .map(() => Array(p).fill(0));
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < p; j++) {
        standardized[i][j] = stds[j] > 1e-10 ? (data[i][j] - means[j]) / stds[j] : 0;
      }
    }

    return standardized;
  }

  /**
   * Compute correlation matrix from raw data
   */
  private static computeCorrelationMatrix(data: number[][]): number[][] {
    const standardized = this.standardizeData(data);
    return MatrixMath.covarianceMatrix(standardized);
  }

  /**
   * Create principal component objects with interpretations
   */
  private static createPrincipalComponents(
    eigenvalues: number[],
    eigenvectors: number[][],
    variableNames: string[],
    totalVariance: number,
  ): PrincipalComponent[] {
    const components: PrincipalComponent[] = [];
    let cumulativeVariance = 0;

    for (let i = 0; i < eigenvalues.length; i++) {
      const eigenvalue = Math.max(0, eigenvalues[i]);
      const varianceExplained = totalVariance > 0 ? eigenvalue / totalVariance : 0;
      cumulativeVariance += varianceExplained;

      // Create loadings
      const loadings: Record<string, number> = {};
      for (let j = 0; j < variableNames.length; j++) {
        loadings[variableNames[j]] = eigenvectors[i][j];
      }

      // Generate interpretation
      const interpretation = this.interpretComponent(loadings, i + 1);

      components.push({
        componentNumber: i + 1,
        eigenvalue,
        varianceExplained: varianceExplained * 100,
        cumulativeVarianceExplained: cumulativeVariance * 100,
        loadings,
        interpretation,
      });
    }

    return components;
  }

  /**
   * Interpret a principal component based on loadings
   */
  private static interpretComponent(
    loadings: Record<string, number>,
    componentNumber: number,
  ): string {
    const threshold = 0.4; // Significant loading threshold

    const positiveLoadings = Object.entries(loadings)
      .filter(([_, value]) => value > threshold)
      .sort((a, b) => b[1] - a[1]);

    const negativeLoadings = Object.entries(loadings)
      .filter(([_, value]) => value < -threshold)
      .sort((a, b) => a[1] - b[1]);

    if (positiveLoadings.length === 0 && negativeLoadings.length === 0) {
      return `Component ${componentNumber}: Mixed loadings with no clear interpretation`;
    }

    let interpretation = `Component ${componentNumber}: `;

    if (positiveLoadings.length > 0) {
      const variables = positiveLoadings.map(([name]) => name).slice(0, 3);
      interpretation += `Positively associated with ${variables.join(', ')}`;

      if (negativeLoadings.length > 0) {
        interpretation += '; ';
      }
    }

    if (negativeLoadings.length > 0) {
      const variables = negativeLoadings.map(([name]) => name).slice(0, 3);
      interpretation += `Negatively associated with ${variables.join(', ')}`;
    }

    return interpretation;
  }

  /**
   * Calculate variance explained thresholds
   */
  private static calculateVarianceThresholds(components: PrincipalComponent[]): {
    componentsFor80Percent: number;
    componentsFor85Percent: number;
    componentsFor90Percent: number;
    componentsFor95Percent: number;
  } {
    const thresholds = [80, 85, 90, 95];
    const results: Record<string, number> = {};

    for (const threshold of thresholds) {
      let count = 0;
      for (const component of components) {
        count++;
        if (component.cumulativeVarianceExplained >= threshold) {
          break;
        }
      }
      results[`componentsFor${threshold}Percent`] = count;
    }

    return results as {
      componentsFor80Percent: number;
      componentsFor85Percent: number;
      componentsFor90Percent: number;
      componentsFor95Percent: number;
    };
  }

  /**
   * Analyze dominant variables and their component associations
   */
  private static analyzeDominantVariables(
    components: PrincipalComponent[],
    variableNames: string[],
  ): Array<{
    variable: string;
    dominantComponent: number;
    maxLoading: number;
    interpretation: string;
  }> {
    const dominantVars: Array<{
      variable: string;
      dominantComponent: number;
      maxLoading: number;
      interpretation: string;
    }> = [];

    for (const variable of variableNames) {
      let maxAbsLoading = 0;
      let dominantComponent = 1;

      for (const component of components) {
        const loading = component.loadings[variable];
        if (Math.abs(loading) > maxAbsLoading) {
          maxAbsLoading = Math.abs(loading);
          dominantComponent = component.componentNumber;
        }
      }

      const interpretation =
        maxAbsLoading > 0.7
          ? 'Strong association'
          : maxAbsLoading > 0.4
            ? 'Moderate association'
            : 'Weak association';

      dominantVars.push({
        variable,
        dominantComponent,
        maxLoading: maxAbsLoading,
        interpretation,
      });
    }

    return dominantVars.sort((a, b) => b.maxLoading - a.maxLoading);
  }

  /**
   * Generate dimensionality reduction recommendations
   */
  private static generateDimensionalityRecommendations(
    components: PrincipalComponent[],
    thresholds: {
      componentsFor80Percent: number;
      componentsFor85Percent: number;
      componentsFor90Percent: number;
      componentsFor95Percent: number;
    },
    originalDimensions: number,
    featureImportance?: Array<{ variable: string; importance: number }>,
    variableSelection?: { selectedVariables: string[]; selectionRatio: number; rationale: string },
  ): string[] {
    const recommendations: string[] = [];

    const reducedDims85 = thresholds.componentsFor85Percent;
    const reducedDims90 = thresholds.componentsFor90Percent;

    const reductionRatio85 = (originalDimensions - reducedDims85) / originalDimensions;
    const reductionRatio90 = (originalDimensions - reducedDims90) / originalDimensions;

    if (reductionRatio85 > 0.5) {
      recommendations.push(
        `Significant dimensionality reduction possible: ${reducedDims85} components retain 85% of variance (${(reductionRatio85 * 100).toFixed(1)}% reduction)`,
      );
    }

    if (reductionRatio90 > 0.3) {
      recommendations.push(
        `Moderate dimensionality reduction: ${reducedDims90} components retain 90% of variance`,
      );
    }

    // Check for Kaiser criterion (eigenvalue > 1)
    const kaiserComponents = components.filter((c) => c.eigenvalue > 1).length;
    if (kaiserComponents < originalDimensions) {
      recommendations.push(
        `Kaiser criterion suggests ${kaiserComponents} meaningful components (eigenvalue > 1)`,
      );
    }

    // Check for scree plot elbow
    const elbowComponent = this.findScreeElbow(components);
    if (elbowComponent > 0 && elbowComponent < originalDimensions) {
      recommendations.push(
        `Scree plot suggests ${elbowComponent} components based on elbow criterion`,
      );
    }

    // Feature importance recommendations
    if (featureImportance && featureImportance.length > 0) {
      const highImportanceVars = featureImportance.filter((f) => f.importance > 0.8).length;
      const lowImportanceVars = featureImportance.filter((f) => f.importance < 0.2).length;

      if (highImportanceVars > 0 && lowImportanceVars > 0) {
        recommendations.push(
          `${highImportanceVars} variables show high importance, ${lowImportanceVars} show low importance - consider feature selection`,
        );
      }
    }

    // Variable selection recommendations
    if (variableSelection) {
      if (variableSelection.selectionRatio < 0.7) {
        recommendations.push(
          `Variable selection suggests using ${variableSelection.selectedVariables.length}/${originalDimensions} variables (${(variableSelection.selectionRatio * 100).toFixed(1)}% retention)`,
        );
      }

      recommendations.push(variableSelection.rationale);
    }

    if (recommendations.length === 0) {
      recommendations.push(
        'No clear dimensionality reduction recommended based on standard criteria',
      );
    }

    return recommendations;
  }

  /**
   * Find elbow in scree plot using second derivative
   */
  private static findScreeElbow(components: PrincipalComponent[]): number {
    if (components.length < 3) return 0;

    const eigenvalues = components.map((c) => c.eigenvalue);
    let maxSecondDerivative = 0;
    let elbowIndex = 0;

    for (let i = 1; i < eigenvalues.length - 1; i++) {
      const secondDerivative = eigenvalues[i - 1] - 2 * eigenvalues[i] + eigenvalues[i + 1];
      if (secondDerivative > maxSecondDerivative) {
        maxSecondDerivative = secondDerivative;
        elbowIndex = i;
      }
    }

    return elbowIndex + 1; // Convert to 1-based component number
  }

  /**
   * Create non-applicable PCA result
   */
  private static createNonApplicableResult(reason: string): PCAAnalysis {
    return {
      isApplicable: false,
      applicabilityReason: reason,
      totalVariance: 0,
      componentsAnalyzed: 0,
      components: [],
      screeData: [],
      varianceThresholds: {
        componentsFor80Percent: 0,
        componentsFor85Percent: 0,
        componentsFor90Percent: 0,
        componentsFor95Percent: 0,
      },
      dominantVariables: [],
      dimensionalityRecommendations: [reason],
      featureImportance: [],
      variableSelection: {
        selectedVariables: [],
        rejectedVariables: [],
        selectionRatio: 0,
        method: 'none',
        rationale: reason,
      },
      technicalDetails: {
        covarianceMatrix: [],
        correlationMatrix: [],
        standardizedData: false,
        numericVariablesUsed: [],
        sampleSize: 0,
        eigenvalueDecompositionConverged: false,
      },
    };
  }
}
