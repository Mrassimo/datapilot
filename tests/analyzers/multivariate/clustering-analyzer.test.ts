import { ClusteringAnalyzer } from '../../../src/analyzers/multivariate/clustering-analyzer';
import { writeFileSync, unlinkSync, mkdtempSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('ClusteringAnalyzer', () => {
  let tempDir: string;
  let tempFile: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'datapilot-clustering-test-'));
    tempFile = join(tempDir, 'test.csv');
  });

  afterEach(() => {
    try {
      unlinkSync(tempFile);
    } catch (e) {
      // File might not exist
    }
  });

  describe('Cluster Detection', () => {
    it('should detect obvious clusters in 2D data', async () => {
      const csvData = `x,y
1,1
1.1,1.1
1.2,0.9
5,5
5.1,5.1
4.9,5.2
10,1
10.1,1.2
9.8,0.9`;
      
      writeFileSync(tempFile, csvData, 'utf8');
      
      const analyzer = new ClusteringAnalyzer();
      const result = await analyzer.analyze(tempFile);
      
      expect(result.clusterAnalysis).toBeDefined();
      expect(result.clusterAnalysis.detectedClusters).toBeGreaterThan(1);
      expect(result.clusterAnalysis.detectedClusters).toBeLessThanOrEqual(5);
      
      // Should recommend appropriate number of clusters
      expect(result.recommendations.optimalClusters).toBeDefined();
      expect(result.recommendations.optimalClusters.elbow).toBeGreaterThan(1);
      expect(result.recommendations.optimalClusters.silhouette).toBeGreaterThan(1);
    });

    it('should analyze cluster quality metrics', async () => {
      const csvData = `feature1,feature2,feature3
1,2,3
1.5,2.5,3.5
2,3,4
10,20,30
10.5,20.5,30.5
11,21,31
100,200,300
105,205,305
110,210,310`;
      
      writeFileSync(tempFile, csvData, 'utf8');
      
      const analyzer = new ClusteringAnalyzer();
      const result = await analyzer.analyze(tempFile);
      
      expect(result.qualityMetrics).toBeDefined();
      expect(result.qualityMetrics.silhouetteScore).toBeDefined();
      expect(result.qualityMetrics.silhouetteScore).toBeGreaterThan(-1);
      expect(result.qualityMetrics.silhouetteScore).toBeLessThanOrEqual(1);
      
      expect(result.qualityMetrics.inertia).toBeDefined();
      expect(result.qualityMetrics.inertia).toBeGreaterThan(0);
      
      expect(result.qualityMetrics.calinskiHarabasz).toBeDefined();
      expect(result.qualityMetrics.daviesBouldin).toBeDefined();
    });

    it('should recommend appropriate clustering algorithms', async () => {
      const csvData = `x,y,z
1,1,1
2,2,2
3,3,3
10,10,10
11,11,11
12,12,12
0.1,0.1,0.1
0.2,0.2,0.2
0.3,0.3,0.3`;
      
      writeFileSync(tempFile, csvData, 'utf8');
      
      const analyzer = new ClusteringAnalyzer();
      const result = await analyzer.analyze(tempFile);
      
      expect(result.algorithmRecommendations).toBeDefined();
      expect(result.algorithmRecommendations.length).toBeGreaterThan(0);
      
      // Should recommend standard algorithms
      const algorithms = result.algorithmRecommendations.map(rec => rec.algorithm);
      expect(algorithms).toContain('kmeans');
      expect(algorithms.some(alg => ['hierarchical', 'dbscan', 'gaussian_mixture'].includes(alg))).toBe(true);
      
      // Each recommendation should have reasoning
      for (const rec of result.algorithmRecommendations) {
        expect(rec.suitability).toBeDefined();
        expect(rec.pros).toBeDefined();
        expect(rec.cons).toBeDefined();
        expect(rec.hyperparameters).toBeDefined();
      }
    });
  });

  describe('Dimensionality Considerations', () => {
    it('should handle high-dimensional data', async () => {
      let csvData = 'f1,f2,f3,f4,f5,f6,f7,f8,f9,f10\n';
      for (let i = 0; i < 20; i++) {
        const row = Array.from({ length: 10 }, () => Math.random() * 100).join(',');
        csvData += row + '\n';
      }
      
      writeFileSync(tempFile, csvData, 'utf8');
      
      const analyzer = new ClusteringAnalyzer();
      const result = await analyzer.analyze(tempFile);
      
      expect(result.dimensionalityRecommendations).toBeDefined();
      expect(result.dimensionalityRecommendations.recommendDimensionalityReduction).toBe(true);
      expect(result.dimensionalityRecommendations.suggestedMethods).toContain('pca');
      
      // Should warn about curse of dimensionality
      expect(result.warnings.some(w => w.includes('dimensionality'))).toBe(true);
    });

    it('should analyze feature correlations for clustering', async () => {
      const csvData = `correlated1,correlated2,independent
1,2,10
2,4,15
3,6,8
4,8,12
5,10,20
6,12,5
7,14,18
8,16,3`;
      
      writeFileSync(tempFile, csvData, 'utf8');
      
      const analyzer = new ClusteringAnalyzer();
      const result = await analyzer.analyze(tempFile);
      
      expect(result.featureAnalysis).toBeDefined();
      expect(result.featureAnalysis.correlationImpact).toBeDefined();
      
      // Should identify highly correlated features
      const highCorrelations = result.featureAnalysis.correlationImpact
        .filter(corr => Math.abs(corr.correlation) > 0.8);
      expect(highCorrelations.length).toBeGreaterThan(0);
    });
  });

  describe('Cluster Interpretation', () => {
    it('should provide cluster characteristics', async () => {
      const csvData = `age,income,spending
25,30000,500
26,32000,600
27,35000,550
45,80000,2000
46,85000,2200
47,90000,1800
65,40000,300
66,42000,350
67,38000,400`;
      
      writeFileSync(tempFile, csvData, 'utf8');
      
      const analyzer = new ClusteringAnalyzer({
        enableClusterProfiling: true
      });
      const result = await analyzer.analyze(tempFile);
      
      expect(result.clusterProfiles).toBeDefined();
      expect(result.clusterProfiles.length).toBeGreaterThan(0);
      
      // Each cluster profile should have characteristics
      for (const profile of result.clusterProfiles) {
        expect(profile.clusterId).toBeDefined();
        expect(profile.size).toBeGreaterThan(0);
        expect(profile.centroid).toBeDefined();
        expect(profile.characteristics).toBeDefined();
        expect(profile.interpretation).toBeDefined();
      }
    });

    it('should identify cluster stability', async () => {
      const csvData = `x,y
1,1
1.1,1.1
1.2,0.9
2,2
2.1,2.1
1.9,1.8
10,10
10.1,10.2
9.9,9.8`;
      
      writeFileSync(tempFile, csvData, 'utf8');
      
      const analyzer = new ClusteringAnalyzer({
        enableStabilityAnalysis: true
      });
      const result = await analyzer.analyze(tempFile);
      
      expect(result.stabilityAnalysis).toBeDefined();
      expect(result.stabilityAnalysis.overallStability).toBeDefined();
      expect(result.stabilityAnalysis.overallStability).toBeGreaterThan(0);
      expect(result.stabilityAnalysis.overallStability).toBeLessThanOrEqual(1);
      
      expect(result.stabilityAnalysis.clusterStability).toBeDefined();
      expect(result.stabilityAnalysis.clusterStability.length).toBeGreaterThan(0);
    });
  });

  describe('Algorithm-Specific Analysis', () => {
    it('should provide K-means specific recommendations', async () => {
      const csvData = `x,y
1,1
2,2
3,3
10,10
11,11
12,12`;
      
      writeFileSync(tempFile, csvData, 'utf8');
      
      const analyzer = new ClusteringAnalyzer();
      const result = await analyzer.analyze(tempFile);
      
      const kmeansRec = result.algorithmRecommendations
        .find(rec => rec.algorithm === 'kmeans');
      
      expect(kmeansRec).toBeDefined();
      expect(kmeansRec?.hyperparameters.k).toBeDefined();
      expect(kmeansRec?.hyperparameters.init).toBeDefined();
      expect(kmeansRec?.hyperparameters.n_init).toBeDefined();
      
      // Should provide elbow method results
      expect(result.recommendations.optimalClusters.elbow).toBeDefined();
    });

    it('should handle DBSCAN recommendations for density-based clustering', async () => {
      const csvData = `x,y
1,1
1.1,1.1
1.2,0.9
5,5
5.1,5.1
4.9,5.2
50,50`; // Outlier point
      
      writeFileSync(tempFile, csvData, 'utf8');
      
      const analyzer = new ClusteringAnalyzer();
      const result = await analyzer.analyze(tempFile);
      
      const dbscanRec = result.algorithmRecommendations
        .find(rec => rec.algorithm === 'dbscan');
      
      if (dbscanRec) {
        expect(dbscanRec.hyperparameters.eps).toBeDefined();
        expect(dbscanRec.hyperparameters.min_samples).toBeDefined();
        expect(dbscanRec.pros).toContain('outlier');
      }
    });

    it('should provide hierarchical clustering recommendations', async () => {
      const csvData = `x,y
1,1
2,1
1,2
10,10
11,10
10,11
20,20
21,20
20,21`;
      
      writeFileSync(tempFile, csvData, 'utf8');
      
      const analyzer = new ClusteringAnalyzer();
      const result = await analyzer.analyze(tempFile);
      
      const hierarchicalRec = result.algorithmRecommendations
        .find(rec => rec.algorithm === 'hierarchical');
      
      if (hierarchicalRec) {
        expect(hierarchicalRec.hyperparameters.linkage).toBeDefined();
        expect(hierarchicalRec.hyperparameters.distance_threshold).toBeDefined();
        expect(hierarchicalRec.pros).toContain('dendrogram');
      }
    });
  });

  describe('Practical Recommendations', () => {
    it('should provide preprocessing recommendations', async () => {
      const csvData = `small_feature,large_feature,categorical
1,1000,A
2,2000,B
3,3000,A
4,4000,C
5,5000,B`;
      
      writeFileSync(tempFile, csvData, 'utf8');
      
      const analyzer = new ClusteringAnalyzer();
      const result = await analyzer.analyze(tempFile);
      
      expect(result.preprocessingRecommendations).toBeDefined();
      
      // Should recommend scaling
      expect(result.preprocessingRecommendations.scaling).toBeDefined();
      expect(result.preprocessingRecommendations.scaling.recommended).toBe(true);
      expect(result.preprocessingRecommendations.scaling.method).toBeDefined();
      
      // Should handle categorical features
      expect(result.preprocessingRecommendations.categoricalHandling).toBeDefined();
      expect(result.preprocessingRecommendations.categoricalHandling.length).toBeGreaterThan(0);
    });

    it('should provide validation strategies', async () => {
      const csvData = `x,y,z
1,2,3
4,5,6
7,8,9
10,11,12
13,14,15`;
      
      writeFileSync(tempFile, csvData, 'utf8');
      
      const analyzer = new ClusteringAnalyzer();
      const result = await analyzer.analyze(tempFile);
      
      expect(result.validationStrategies).toBeDefined();
      expect(result.validationStrategies.internalValidation).toBeDefined();
      expect(result.validationStrategies.externalValidation).toBeDefined();
      expect(result.validationStrategies.relativeValidation).toBeDefined();
      
      // Should recommend specific validation metrics
      const metrics = result.validationStrategies.internalValidation.recommendedMetrics;
      expect(metrics).toContain('silhouette');
      expect(metrics.some(m => ['calinski_harabasz', 'davies_bouldin'].includes(m))).toBe(true);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle insufficient data points', async () => {
      const csvData = 'x,y\n1,1\n2,2';
      writeFileSync(tempFile, csvData, 'utf8');
      
      const analyzer = new ClusteringAnalyzer();
      const result = await analyzer.analyze(tempFile);
      
      expect(result.warnings).toBeDefined();
      expect(result.warnings.some(w => w.includes('insufficient'))).toBe(true);
      
      // Should still provide basic recommendations
      expect(result.algorithmRecommendations).toBeDefined();
    });

    it('should handle single-dimensional data', async () => {
      const csvData = 'value\n1\n2\n3\n10\n11\n12';
      writeFileSync(tempFile, csvData, 'utf8');
      
      const analyzer = new ClusteringAnalyzer();
      const result = await analyzer.analyze(tempFile);
      
      expect(result.warnings).toBeDefined();
      expect(result.warnings.some(w => w.includes('single dimension'))).toBe(true);
      
      // Should recommend histogram-based methods
      expect(result.algorithmRecommendations.some(rec => 
        rec.algorithm === 'histogram_based'
      )).toBe(true);
    });

    it('should handle all identical data points', async () => {
      const csvData = 'x,y\n5,5\n5,5\n5,5\n5,5';
      writeFileSync(tempFile, csvData, 'utf8');
      
      const analyzer = new ClusteringAnalyzer();
      const result = await analyzer.analyze(tempFile);
      
      expect(result.warnings).toBeDefined();
      expect(result.warnings.some(w => w.includes('identical') || w.includes('variance'))).toBe(true);
      
      // Should recommend single cluster
      expect(result.recommendations.optimalClusters.recommended).toBe(1);
    });
  });

  describe('Configuration and Performance', () => {
    it('should respect configuration options', async () => {
      const csvData = 'x,y\n1,1\n2,2\n3,3\n4,4\n5,5';
      writeFileSync(tempFile, csvData, 'utf8');
      
      const analyzer = new ClusteringAnalyzer({
        maxClusters: 3,
        enableClusterProfiling: false,
        enableStabilityAnalysis: false
      });
      
      const result = await analyzer.analyze(tempFile);
      
      expect(result.recommendations.optimalClusters.elbow).toBeLessThanOrEqual(3);
      expect(result.clusterProfiles).toBeUndefined();
      expect(result.stabilityAnalysis).toBeUndefined();
    });

    it('should validate configuration parameters', () => {
      const analyzer = new ClusteringAnalyzer({
        maxClusters: 0, // Invalid
        minSamples: -1 // Invalid
      });
      
      const validation = analyzer.validateConfig();
      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });

    it('should handle performance efficiently', async () => {
      // Create larger dataset
      let csvData = 'x,y,z\n';
      for (let i = 0; i < 100; i++) {
        csvData += `${Math.random() * 100},${Math.random() * 100},${Math.random() * 100}\n`;
      }
      
      writeFileSync(tempFile, csvData, 'utf8');
      
      const startTime = Date.now();
      const analyzer = new ClusteringAnalyzer();
      const result = await analyzer.analyze(tempFile);
      const endTime = Date.now();
      
      expect(result).toBeDefined();
      expect(endTime - startTime).toBeLessThan(5000); // Should complete in under 5 seconds
      expect(result.performanceMetrics.recordsProcessed).toBe(100);
    });
  });
});
