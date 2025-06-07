/**
 * K-Means Clustering Analysis Implementation
 * 
 * Features:
 * - K-means clustering with multiple initialization strategies
 * - Optimal K selection using elbow method and silhouette analysis
 * - Comprehensive cluster validation metrics
 * - Detailed cluster profiling and interpretation
 * - Robust handling of edge cases and convergence issues
 */

import type {
  KMeansAnalysis,
  ClusterProfile,
  ClusterValidationMetrics,
} from '../eda/types';

/**
 * K-means clustering point
 */
interface ClusterPoint {
  values: number[];
  clusterId: number;
  originalIndex: number;
}

/**
 * Centroid representation
 */
interface Centroid {
  values: number[];
  clusterId: number;
}

/**
 * Distance calculation utilities
 */
class DistanceUtils {
  /**
   * Euclidean distance between two points
   */
  static euclidean(point1: number[], point2: number[]): number {
    let sum = 0;
    for (let i = 0; i < point1.length; i++) {
      const diff = point1[i] - point2[i];
      sum += diff * diff;
    }
    return Math.sqrt(sum);
  }

  /**
   * Manhattan distance between two points
   */
  static manhattan(point1: number[], point2: number[]): number {
    let sum = 0;
    for (let i = 0; i < point1.length; i++) {
      sum += Math.abs(point1[i] - point2[i]);
    }
    return sum;
  }
}

/**
 * Silhouette analysis for cluster validation
 */
class SilhouetteAnalysis {
  /**
   * Calculate silhouette score for clustering
   */
  static calculateSilhouetteScore(points: ClusterPoint[]): number {
    const n = points.length;
    if (n <= 1) return 0;

    let totalSilhouette = 0;

    for (let i = 0; i < n; i++) {
      const point = points[i];
      const a = this.calculateAverageIntraClusterDistance(point, points);
      const b = this.calculateAverageNearestClusterDistance(point, points);

      const silhouette = b > a ? (b - a) / Math.max(a, b) : 0;
      totalSilhouette += silhouette;
    }

    return totalSilhouette / n;
  }

  /**
   * Calculate average distance to points in same cluster (a_i)
   */
  private static calculateAverageIntraClusterDistance(
    point: ClusterPoint,
    allPoints: ClusterPoint[]
  ): number {
    const sameClusterPoints = allPoints.filter(
      p => p.clusterId === point.clusterId && p.originalIndex !== point.originalIndex
    );

    if (sameClusterPoints.length === 0) return 0;

    let totalDistance = 0;
    for (const other of sameClusterPoints) {
      totalDistance += DistanceUtils.euclidean(point.values, other.values);
    }

    return totalDistance / sameClusterPoints.length;
  }

  /**
   * Calculate average distance to nearest cluster (b_i)
   */
  private static calculateAverageNearestClusterDistance(
    point: ClusterPoint,
    allPoints: ClusterPoint[]
  ): number {
    const clusterIds = [...new Set(allPoints.map(p => p.clusterId))];
    const otherClusters = clusterIds.filter(id => id !== point.clusterId);

    if (otherClusters.length === 0) return 0;

    let minAvgDistance = Infinity;

    for (const clusterId of otherClusters) {
      const clusterPoints = allPoints.filter(p => p.clusterId === clusterId);
      
      let totalDistance = 0;
      for (const other of clusterPoints) {
        totalDistance += DistanceUtils.euclidean(point.values, other.values);
      }

      const avgDistance = totalDistance / clusterPoints.length;
      minAvgDistance = Math.min(minAvgDistance, avgDistance);
    }

    return minAvgDistance;
  }

  /**
   * Interpret silhouette score
   */
  static interpretSilhouetteScore(score: number): string {
    if (score >= 0.7) return 'Strong clustering structure';
    if (score >= 0.5) return 'Reasonable clustering structure';
    if (score >= 0.25) return 'Weak clustering structure';
    return 'No substantial clustering structure';
  }
}

/**
 * Main K-means clustering analyzer
 */
export class ClusteringAnalyzer {
  private static readonly MIN_VARIABLES = 2;
  private static readonly MIN_OBSERVATIONS = 50;
  private static readonly MAX_VARIABLES = 20;
  private static readonly MAX_K = 10;
  private static readonly MAX_ITERATIONS = 100;
  private static readonly CONVERGENCE_TOLERANCE = 1e-6;

  /**
   * Perform complete K-means clustering analysis
   */
  static analyze(
    data: (string | number | null | undefined)[][],
    headers: string[],
    numericalColumnIndices: number[],
    sampleSize: number,
    randomSeed: number = 42
  ): KMeansAnalysis {
    try {
      // Check applicability
      const applicabilityCheck = this.checkApplicability(
        numericalColumnIndices,
        sampleSize
      );

      if (!applicabilityCheck.isApplicable) {
        return this.createNonApplicableResult(applicabilityCheck.reason);
      }

      // Extract and standardize numerical data
      const numericData = this.extractNumericData(data, numericalColumnIndices);
      const variableNames = numericalColumnIndices.map(i => headers[i]);
      
      const standardizedData = this.standardizeData(numericData);

      // Convert to cluster points
      const points = standardizedData.map((values, index) => ({
        values,
        clusterId: 0,
        originalIndex: index,
      }));

      // Determine optimal K using elbow method and silhouette analysis
      const elbowAnalysis = this.performElbowAnalysis(points, randomSeed);
      const optimalK = this.determineOptimalK(elbowAnalysis);

      // Perform final clustering with optimal K
      const finalClustering = this.performKMeansClustering(
        points,
        optimalK,
        randomSeed
      );

      // Create cluster profiles
      const clusterProfiles = this.createClusterProfiles(
        finalClustering.points,
        variableNames,
        numericData
      );

      // Calculate validation metrics
      const validation = this.calculateValidationMetrics(finalClustering.points);

      // Generate insights and recommendations
      const insights = this.generateInsights(clusterProfiles, validation);
      const recommendations = this.generateRecommendations(
        optimalK,
        validation,
        clusterProfiles
      );

      return {
        isApplicable: true,
        applicabilityReason: 'Sufficient numerical variables and observations for clustering',
        optimalClusters: optimalK,
        optimalityMethod: 'elbow',
        elbowAnalysis,
        finalClustering: {
          k: optimalK,
          converged: finalClustering.converged,
          iterations: finalClustering.iterations,
          validation,
          clusterProfiles,
        },
        insights,
        recommendations,
        technicalDetails: {
          numericVariablesUsed: variableNames,
          standardizedData: true,
          sampleSize,
          randomSeed,
        },
      };
    } catch (error) {
      console.error('Clustering analysis failed:', error);
      return this.createNonApplicableResult(
        `Clustering analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Check if clustering is applicable to the dataset
   */
  private static checkApplicability(
    numericalColumnIndices: number[],
    sampleSize: number
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
        reason: `Too many variables for clustering (${numericalColumnIndices.length} > ${this.MAX_VARIABLES})`,
      };
    }

    return {
      isApplicable: true,
      reason: 'Dataset suitable for clustering analysis',
    };
  }

  /**
   * Extract numerical data and handle missing values
   */
  private static extractNumericData(
    data: (string | number | null | undefined)[][],
    numericalColumnIndices: number[]
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
    const standardized = Array(n).fill(0).map(() => Array(p).fill(0));
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < p; j++) {
        standardized[i][j] = stds[j] > 1e-10 ? 
          (data[i][j] - means[j]) / stds[j] : 0;
      }
    }

    return standardized;
  }

  /**
   * Perform elbow analysis to determine optimal K
   */
  private static performElbowAnalysis(
    points: ClusterPoint[],
    randomSeed: number
  ): Array<{
    k: number;
    wcss: number;
    silhouetteScore: number;
    improvement: number;
  }> {
    const maxK = Math.min(this.MAX_K, Math.floor(Math.sqrt(points.length / 2)));
    const results: Array<{
      k: number;
      wcss: number;
      silhouetteScore: number;
      improvement: number;
    }> = [];

    let previousWCSS = 0;

    for (let k = 1; k <= maxK; k++) {
      const clustering = this.performKMeansClustering(points, k, randomSeed + k);
      const wcss = this.calculateWCSS(clustering.points, clustering.centroids);
      
      const silhouetteScore = k > 1 ? 
        SilhouetteAnalysis.calculateSilhouetteScore(clustering.points) : 0;

      const improvement = previousWCSS > 0 ? 
        (previousWCSS - wcss) / previousWCSS : 0;

      results.push({
        k,
        wcss,
        silhouetteScore,
        improvement,
      });

      previousWCSS = wcss;
    }

    return results;
  }

  /**
   * Determine optimal K from elbow analysis
   */
  private static determineOptimalK(
    elbowAnalysis: Array<{
      k: number;
      wcss: number;
      silhouetteScore: number;
      improvement: number;
    }>
  ): number {
    if (elbowAnalysis.length <= 1) return 2;

    // Find elbow using second derivative of WCSS
    let maxElbow = 0;
    let elbowK = 2;

    for (let i = 1; i < elbowAnalysis.length - 1; i++) {
      const prev = elbowAnalysis[i - 1].wcss;
      const curr = elbowAnalysis[i].wcss;
      const next = elbowAnalysis[i + 1].wcss;
      
      const elbow = prev - 2 * curr + next;
      if (elbow > maxElbow) {
        maxElbow = elbow;
        elbowK = elbowAnalysis[i].k;
      }
    }

    // Validate with silhouette scores
    const silhouetteOptimal = elbowAnalysis
      .filter(result => result.k >= 2)
      .reduce((best, current) => 
        current.silhouetteScore > best.silhouetteScore ? current : best
      );

    // Use silhouette optimal if significantly better and reasonable
    if (silhouetteOptimal.silhouetteScore > 0.5 && 
        Math.abs(silhouetteOptimal.k - elbowK) <= 2) {
      return silhouetteOptimal.k;
    }

    return elbowK;
  }

  /**
   * Perform K-means clustering with Lloyd's algorithm
   */
  private static performKMeansClustering(
    points: ClusterPoint[],
    k: number,
    randomSeed: number
  ): {
    points: ClusterPoint[];
    centroids: Centroid[];
    converged: boolean;
    iterations: number;
  } {
    // Initialize centroids using k-means++
    const centroids = this.initializeCentroidsKMeansPlusPlus(points, k, randomSeed);
    
    let converged = false;
    let iterations = 0;
    const clusterPoints = points.map(p => ({ ...p }));

    while (iterations < this.MAX_ITERATIONS && !converged) {
      // Assign points to nearest centroids
      for (const point of clusterPoints) {
        let minDistance = Infinity;
        let nearestCentroid = 0;

        for (const centroid of centroids) {
          const distance = DistanceUtils.euclidean(point.values, centroid.values);
          if (distance < minDistance) {
            minDistance = distance;
            nearestCentroid = centroid.clusterId;
          }
        }

        point.clusterId = nearestCentroid;
      }

      // Update centroids
      const previousCentroids = centroids.map(c => ({ ...c, values: [...c.values] }));
      
      for (const centroid of centroids) {
        const clusterPoints_filtered = clusterPoints.filter(
          p => p.clusterId === centroid.clusterId
        );

        if (clusterPoints_filtered.length > 0) {
          const dimensions = centroid.values.length;
          const newCentroid = Array(dimensions).fill(0);

          for (const point of clusterPoints_filtered) {
            for (let d = 0; d < dimensions; d++) {
              newCentroid[d] += point.values[d];
            }
          }

          for (let d = 0; d < dimensions; d++) {
            centroid.values[d] = newCentroid[d] / clusterPoints_filtered.length;
          }
        }
      }

      // Check convergence
      let maxCentroidMovement = 0;
      for (let i = 0; i < centroids.length; i++) {
        const movement = DistanceUtils.euclidean(
          centroids[i].values,
          previousCentroids[i].values
        );
        maxCentroidMovement = Math.max(maxCentroidMovement, movement);
      }

      converged = maxCentroidMovement < this.CONVERGENCE_TOLERANCE;
      iterations++;
    }

    return {
      points: clusterPoints,
      centroids,
      converged,
      iterations,
    };
  }

  /**
   * Initialize centroids using k-means++ algorithm
   */
  private static initializeCentroidsKMeansPlusPlus(
    points: ClusterPoint[],
    k: number,
    randomSeed: number
  ): Centroid[] {
    const rng = this.createSeededRandom(randomSeed);
    const centroids: Centroid[] = [];
    const dimensions = points[0].values.length;

    // Choose first centroid randomly
    const firstIndex = Math.floor(rng() * points.length);
    centroids.push({
      values: [...points[firstIndex].values],
      clusterId: 0,
    });

    // Choose remaining centroids using weighted probability
    for (let c = 1; c < k; c++) {
      const distances: number[] = [];
      let totalDistance = 0;

      // Calculate min distance to existing centroids for each point
      for (const point of points) {
        let minDistance = Infinity;
        for (const centroid of centroids) {
          const distance = DistanceUtils.euclidean(point.values, centroid.values);
          minDistance = Math.min(minDistance, distance);
        }
        distances.push(minDistance * minDistance); // Square for weighting
        totalDistance += minDistance * minDistance;
      }

      // Choose next centroid with probability proportional to squared distance
      const target = rng() * totalDistance;
      let cumulative = 0;
      let selectedIndex = 0;

      for (let i = 0; i < distances.length; i++) {
        cumulative += distances[i];
        if (cumulative >= target) {
          selectedIndex = i;
          break;
        }
      }

      centroids.push({
        values: [...points[selectedIndex].values],
        clusterId: c,
      });
    }

    return centroids;
  }

  /**
   * Calculate Within-Cluster Sum of Squares (WCSS)
   */
  private static calculateWCSS(
    points: ClusterPoint[],
    centroids: Centroid[]
  ): number {
    let wcss = 0;

    for (const point of points) {
      const centroid = centroids.find(c => c.clusterId === point.clusterId);
      if (centroid) {
        const distance = DistanceUtils.euclidean(point.values, centroid.values);
        wcss += distance * distance;
      }
    }

    return wcss;
  }

  /**
   * Create detailed cluster profiles
   */
  private static createClusterProfiles(
    points: ClusterPoint[],
    variableNames: string[],
    originalData: number[][]
  ): ClusterProfile[] {
    const clusterIds = [...new Set(points.map(p => p.clusterId))];
    const profiles: ClusterProfile[] = [];

    // Calculate global means for comparison
    const globalMeans = this.calculateGlobalMeans(originalData);

    for (const clusterId of clusterIds) {
      const clusterPoints = points.filter(p => p.clusterId === clusterId);
      const originalIndices = clusterPoints.map(p => p.originalIndex);
      const clusterOriginalData = originalIndices.map(i => originalData[i]);

      // Calculate cluster statistics
      const centroid: Record<string, number> = {};
      const characteristics: ClusterProfile['characteristics'] = [];

      for (let v = 0; v < variableNames.length; v++) {
        const variable = variableNames[v];
        const values = clusterOriginalData.map(row => row[v]);
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        
        centroid[variable] = mean;

        // Compare to global mean
        const globalMean = globalMeans[v];
        const zScore = Math.abs(mean - globalMean) / Math.sqrt(
          values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (values.length - 1)
        );

        const relativeToGlobal = this.compareToGlobal(mean, globalMean, zScore);

        characteristics.push({
          variable,
          mean,
          relativeToGlobal,
          zScore,
          interpretation: this.interpretCharacteristic(variable, relativeToGlobal, zScore),
        });
      }

      // Find distinctive features
      const distinctiveFeatures = characteristics
        .filter(c => Math.abs(c.zScore) > 1)
        .sort((a, b) => Math.abs(b.zScore) - Math.abs(a.zScore))
        .slice(0, 3)
        .map(c => c.interpretation);

      profiles.push({
        clusterId,
        clusterName: `Cluster ${clusterId + 1}`,
        size: clusterPoints.length,
        percentage: (clusterPoints.length / points.length) * 100,
        centroid,
        characteristics,
        distinctiveFeatures,
        description: this.generateClusterDescription(distinctiveFeatures, clusterPoints.length),
      });
    }

    return profiles.sort((a, b) => b.size - a.size);
  }

  /**
   * Calculate global means for all variables
   */
  private static calculateGlobalMeans(data: number[][]): number[] {
    const means: number[] = [];
    const n = data.length;
    const p = data[0].length;

    for (let j = 0; j < p; j++) {
      let sum = 0;
      for (let i = 0; i < n; i++) {
        sum += data[i][j];
      }
      means.push(sum / n);
    }

    return means;
  }

  /**
   * Compare cluster mean to global mean
   */
  private static compareToGlobal(
    clusterMean: number,
    globalMean: number,
    zScore: number
  ): 'much_higher' | 'higher' | 'similar' | 'lower' | 'much_lower' {
    if (zScore < 0.5) return 'similar';
    
    if (clusterMean > globalMean) {
      return zScore > 2 ? 'much_higher' : 'higher';
    } else {
      return zScore > 2 ? 'much_lower' : 'lower';
    }
  }

  /**
   * Interpret characteristic relative to global
   */
  private static interpretCharacteristic(
    variable: string,
    relative: string,
    zScore: number
  ): string {
    const intensity = zScore > 2 ? 'significantly' : zScore > 1 ? 'moderately' : 'slightly';
    
    switch (relative) {
      case 'much_higher':
      case 'higher':
        return `${intensity} higher ${variable}`;
      case 'much_lower':
      case 'lower':
        return `${intensity} lower ${variable}`;
      default:
        return `average ${variable}`;
    }
  }

  /**
   * Generate cluster description
   */
  private static generateClusterDescription(
    distinctiveFeatures: string[],
    size: number
  ): string {
    if (distinctiveFeatures.length === 0) {
      return `Average profile cluster with ${size} members`;
    }

    const features = distinctiveFeatures.slice(0, 2).join(' and ');
    return `Cluster characterized by ${features} (${size} members)`;
  }

  /**
   * Calculate comprehensive validation metrics
   */
  private static calculateValidationMetrics(points: ClusterPoint[]): ClusterValidationMetrics {
    const silhouetteScore = SilhouetteAnalysis.calculateSilhouetteScore(points);
    
    // Calculate within-cluster and between-cluster variance
    const clusterIds = [...new Set(points.map(p => p.clusterId))];
    
    let totalWithinClusterSS = 0;
    let totalBetweenClusterSS = 0;
    
    // Global centroid
    const globalCentroid = this.calculateGlobalCentroid(points);
    
    for (const clusterId of clusterIds) {
      const clusterPoints = points.filter(p => p.clusterId === clusterId);
      const clusterCentroid = this.calculateClusterCentroid(clusterPoints);
      
      // Within-cluster sum of squares
      for (const point of clusterPoints) {
        const distance = DistanceUtils.euclidean(point.values, clusterCentroid);
        totalWithinClusterSS += distance * distance;
      }
      
      // Between-cluster sum of squares
      const distanceToGlobal = DistanceUtils.euclidean(clusterCentroid, globalCentroid);
      totalBetweenClusterSS += clusterPoints.length * distanceToGlobal * distanceToGlobal;
    }

    const totalVariance = totalWithinClusterSS + totalBetweenClusterSS;
    const varianceExplainedRatio = totalVariance > 0 ? totalBetweenClusterSS / totalVariance : 0;

    return {
      silhouetteScore,
      silhouetteInterpretation: SilhouetteAnalysis.interpretSilhouetteScore(silhouetteScore),
      wcss: totalWithinClusterSS,
      betweenClusterVariance: totalBetweenClusterSS,
      totalVariance,
      varianceExplainedRatio,
    };
  }

  /**
   * Calculate global centroid
   */
  private static calculateGlobalCentroid(points: ClusterPoint[]): number[] {
    const dimensions = points[0].values.length;
    const centroid = Array(dimensions).fill(0);

    for (const point of points) {
      for (let d = 0; d < dimensions; d++) {
        centroid[d] += point.values[d];
      }
    }

    for (let d = 0; d < dimensions; d++) {
      centroid[d] /= points.length;
    }

    return centroid;
  }

  /**
   * Calculate cluster centroid
   */
  private static calculateClusterCentroid(points: ClusterPoint[]): number[] {
    const dimensions = points[0].values.length;
    const centroid = Array(dimensions).fill(0);

    for (const point of points) {
      for (let d = 0; d < dimensions; d++) {
        centroid[d] += point.values[d];
      }
    }

    for (let d = 0; d < dimensions; d++) {
      centroid[d] /= points.length;
    }

    return centroid;
  }

  /**
   * Generate insights from clustering results
   */
  private static generateInsights(
    profiles: ClusterProfile[],
    validation: ClusterValidationMetrics
  ): string[] {
    const insights: string[] = [];

    // Clustering quality insight
    if (validation.silhouetteScore > 0.5) {
      insights.push(`Strong clustering structure detected (silhouette score: ${validation.silhouetteScore.toFixed(3)})`);
    } else if (validation.silhouetteScore > 0.25) {
      insights.push(`Moderate clustering structure detected (silhouette score: ${validation.silhouetteScore.toFixed(3)})`);
    } else {
      insights.push(`Weak clustering structure (silhouette score: ${validation.silhouetteScore.toFixed(3)})`);
    }

    // Variance explained insight
    insights.push(`Clustering explains ${(validation.varianceExplainedRatio * 100).toFixed(1)}% of total variance`);

    // Cluster size distribution insight
    const sizes = profiles.map(p => p.size);
    const maxSize = Math.max(...sizes);
    const minSize = Math.min(...sizes);
    
    if (maxSize / minSize > 3) {
      insights.push('Unbalanced cluster sizes detected - some clusters much larger than others');
    } else {
      insights.push('Relatively balanced cluster size distribution');
    }

    // Most distinctive clusters
    const mostDistinctive = profiles
      .filter(p => p.distinctiveFeatures.length > 0)
      .sort((a, b) => b.distinctiveFeatures.length - a.distinctiveFeatures.length)[0];

    if (mostDistinctive) {
      insights.push(`${mostDistinctive.clusterName} shows most distinctive characteristics`);
    }

    return insights;
  }

  /**
   * Generate recommendations based on clustering results
   */
  private static generateRecommendations(
    optimalK: number,
    validation: ClusterValidationMetrics,
    profiles: ClusterProfile[]
  ): string[] {
    const recommendations: string[] = [];

    // Quality-based recommendations
    if (validation.silhouetteScore < 0.25) {
      recommendations.push('Consider feature engineering or different clustering approach due to weak structure');
    }

    if (validation.varianceExplainedRatio < 0.3) {
      recommendations.push('Low variance explained - consider dimensionality reduction before clustering');
    }

    // K-specific recommendations
    if (optimalK <= 2) {
      recommendations.push('Dataset may have limited natural clustering - verify with domain knowledge');
    } else if (optimalK >= 7) {
      recommendations.push('Many clusters detected - consider hierarchical clustering for better interpretation');
    }

    // Cluster balance recommendations
    const sizes = profiles.map(p => p.size);
    const coefficient_of_variation = this.calculateCoefficientOfVariation(sizes);
    
    if (coefficient_of_variation > 0.5) {
      recommendations.push('Unbalanced clusters - consider different initialization or clustering algorithm');
    }

    // Feature-specific recommendations
    const allDistinctiveFeatures = profiles.flatMap(p => p.distinctiveFeatures);
    if (allDistinctiveFeatures.length === 0) {
      recommendations.push('No strong cluster characteristics found - consider feature selection or transformation');
    }

    if (recommendations.length === 0) {
      recommendations.push('Clustering results appear reasonable for the given dataset');
    }

    return recommendations;
  }

  /**
   * Calculate coefficient of variation
   */
  private static calculateCoefficientOfVariation(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    return mean > 0 ? stdDev / mean : 0;
  }

  /**
   * Create seeded random number generator
   */
  private static createSeededRandom(seed: number): () => number {
    let state = seed;
    return function() {
      state = (state * 1664525 + 1013904223) % Math.pow(2, 32);
      return state / Math.pow(2, 32);
    };
  }

  /**
   * Create non-applicable clustering result
   */
  private static createNonApplicableResult(reason: string): KMeansAnalysis {
    return {
      isApplicable: false,
      applicabilityReason: reason,
      optimalClusters: 0,
      optimalityMethod: 'elbow',
      elbowAnalysis: [],
      finalClustering: {
        k: 0,
        converged: false,
        iterations: 0,
        validation: {
          silhouetteScore: 0,
          silhouetteInterpretation: 'No clustering performed',
          wcss: 0,
          betweenClusterVariance: 0,
          totalVariance: 0,
          varianceExplainedRatio: 0,
        },
        clusterProfiles: [],
      },
      insights: [reason],
      recommendations: ['Address applicability issues before attempting clustering'],
      technicalDetails: {
        numericVariablesUsed: [],
        standardizedData: false,
        sampleSize: 0,
        randomSeed: 0,
      },
    };
  }
}