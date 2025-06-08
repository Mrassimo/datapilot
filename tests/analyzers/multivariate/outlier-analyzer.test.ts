import { OutlierAnalyzer } from '../../../src/analyzers/multivariate/outlier-analyzer';
import { writeFileSync, unlinkSync, mkdtempSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('OutlierAnalyzer - Multivariate Outlier Detection', () => {
  let tempDir: string;
  let tempFile: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'datapilot-outlier-test-'));
    tempFile = join(tempDir, 'test.csv');
  });

  afterEach(() => {
    try {
      unlinkSync(tempFile);
    } catch (e) {
      // File might not exist
    }
  });

  describe('Statistical Outlier Detection', () => {
    it('should detect obvious statistical outliers', async () => {
      const csvData = `x,y
1,1
2,2
3,3
4,4
5,5
100,100`; // Clear outlier
      
      writeFileSync(tempFile, csvData, 'utf8');
      
      const analyzer = new OutlierAnalyzer();
      const result = await analyzer.analyze(tempFile);
      
      expect(result.statisticalOutliers).toBeDefined();
      expect(result.statisticalOutliers.detected.length).toBeGreaterThan(0);
      
      // Should detect the (100,100) point
      const outliers = result.statisticalOutliers.detected;
      expect(outliers.some(outlier => outlier.rowIndex === 5)).toBe(true); // 0-indexed
      
      // Should provide outlier scores
      const outlier = outliers.find(o => o.rowIndex === 5);
      expect(outlier?.score).toBeGreaterThan(0);
      expect(outlier?.method).toBeDefined();
    });

    it('should use multiple detection methods', async () => {
      // Create data with different types of outliers
      const csvData = `feature1,feature2,feature3
1,10,100
2,11,101
3,12,102
4,13,103
5,14,104
50,15,105
6,50,106
7,16,500`; // Different outlier patterns
      
      writeFileSync(tempFile, csvData, 'utf8');
      
      const analyzer = new OutlierAnalyzer({
        enableIsolationForest: true,
        enableLocalOutlierFactor: true,
        enableMahalanobis: true
      });
      const result = await analyzer.analyze(tempFile);
      
      expect(result.methodComparison).toBeDefined();
      expect(result.methodComparison.length).toBeGreaterThan(1);
      
      // Should have different methods
      const methods = result.methodComparison.map(m => m.method);
      expect(methods).toContain('isolation_forest');
      expect(methods.some(m => ['lof', 'mahalanobis', 'z_score'].includes(m))).toBe(true);
    });

    it('should calculate outlier severity scores', async () => {
      const csvData = `normal1,normal2,extreme
1,1,1
2,2,2
3,3,3
4,4,4
5,5,1000`; // Extreme outlier in one dimension
      
      writeFileSync(tempFile, csvData, 'utf8');
      
      const analyzer = new OutlierAnalyzer();
      const result = await analyzer.analyze(tempFile);
      
      const outliers = result.statisticalOutliers.detected;
      expect(outliers.length).toBeGreaterThan(0);
      
      // Extreme outlier should have high severity
      const extremeOutlier = outliers.find(o => o.rowIndex === 4);
      expect(extremeOutlier).toBeDefined();
      expect(extremeOutlier?.severity).toBe('high');
      expect(extremeOutlier?.score).toBeGreaterThan(5);
    });
  });

  describe('Contextual Outlier Detection', () => {
    it('should detect contextual anomalies', async () => {
      const csvData = `temperature,humidity,season
20,60,winter
22,65,winter
18,55,winter
35,70,winter
25,80,summer
28,85,summer
30,90,summer
20,60,summer`; // 35°C in winter and 20°C in summer are contextual outliers
      
      writeFileSync(tempFile, csvData, 'utf8');
      
      const analyzer = new OutlierAnalyzer({
        enableContextualAnalysis: true
      });
      const result = await analyzer.analyze(tempFile);
      
      expect(result.contextualOutliers).toBeDefined();
      expect(result.contextualOutliers.detected.length).toBeGreaterThan(0);
      
      // Should identify context-dependent outliers
      const contextOutliers = result.contextualOutliers.detected;
      expect(contextOutliers.some(o => o.context.includes('winter'))).toBe(true);
      expect(contextOutliers.some(o => o.context.includes('summer'))).toBe(true);
    });

    it('should group outliers by context', async () => {
      const csvData = `value,category,group
10,A,1
12,A,1
50,A,1
15,B,1
18,B,1
60,B,1
100,A,2
105,A,2
200,A,2`;
      
      writeFileSync(tempFile, csvData, 'utf8');
      
      const analyzer = new OutlierAnalyzer({
        enableContextualAnalysis: true
      });
      const result = await analyzer.analyze(tempFile);
      
      expect(result.contextualOutliers.groupedByContext).toBeDefined();
      expect(Object.keys(result.contextualOutliers.groupedByContext).length).toBeGreaterThan(0);
      
      // Should group by categorical variables
      const contexts = Object.keys(result.contextualOutliers.groupedByContext);
      expect(contexts.some(ctx => ctx.includes('category=A') || ctx.includes('group=1'))).toBe(true);
    });
  });

  describe('Time Series Outlier Detection', () => {
    it('should detect temporal anomalies', async () => {
      const csvData = `timestamp,value,trend
2024-01-01,100,stable
2024-01-02,102,stable
2024-01-03,101,stable
2024-01-04,500,anomaly
2024-01-05,103,stable
2024-01-06,104,stable
2024-01-07,102,stable`;
      
      writeFileSync(tempFile, csvData, 'utf8');
      
      const analyzer = new OutlierAnalyzer({
        enableTimeSeriesAnalysis: true
      });
      const result = await analyzer.analyze(tempFile);
      
      expect(result.temporalOutliers).toBeDefined();
      expect(result.temporalOutliers.detected.length).toBeGreaterThan(0);
      
      // Should detect the 500 value as temporal anomaly
      const temporalOutliers = result.temporalOutliers.detected;
      expect(temporalOutliers.some(o => o.rowIndex === 3)).toBe(true);
    });

    it('should detect trend anomalies', async () => {
      const csvData = `time,value
1,10
2,20
3,30
4,35
5,5
6,50
7,60`; // Value drops dramatically at time 5
      
      writeFileSync(tempFile, csvData, 'utf8');
      
      const analyzer = new OutlierAnalyzer({
        enableTimeSeriesAnalysis: true,
        enableTrendAnalysis: true
      });
      const result = await analyzer.analyze(tempFile);
      
      expect(result.temporalOutliers.trendAnomalies).toBeDefined();
      expect(result.temporalOutliers.trendAnomalies.length).toBeGreaterThan(0);
      
      // Should detect the dramatic drop
      const trendAnomalies = result.temporalOutliers.trendAnomalies;
      expect(trendAnomalies.some(a => a.rowIndex === 4)).toBe(true);
    });
  });

  describe('Multivariate Distance-Based Detection', () => {
    it('should use Mahalanobis distance for multivariate outliers', async () => {
      // Create elliptical distribution with one clear outlier
      const csvData = `x,y
1,2
2,4
3,6
4,8
5,10
6,12
10,2`; // Point far from the elliptical pattern
      
      writeFileSync(tempFile, csvData, 'utf8');
      
      const analyzer = new OutlierAnalyzer({
        enableMahalanobis: true
      });
      const result = await analyzer.analyze(tempFile);
      
      const mahalanobisResults = result.methodComparison
        .find(m => m.method === 'mahalanobis');
      
      expect(mahalanobisResults).toBeDefined();
      expect(mahalanobisResults?.outliers.length).toBeGreaterThan(0);
      
      // Should detect the (10,2) point
      expect(mahalanobisResults?.outliers.some(o => o.rowIndex === 6)).toBe(true);
    });

    it('should handle correlated features properly', async () => {
      // Create correlated data with outlier
      const csvData = `corr1,corr2,independent
1,2,10
2,4,11
3,6,12
4,8,13
5,10,14
6,2,15`; // (6,2) breaks correlation pattern
      
      writeFileSync(tempFile, csvData, 'utf8');
      
      const analyzer = new OutlierAnalyzer({
        enableMahalanobis: true
      });
      const result = await analyzer.analyze(tempFile);
      
      expect(result.featureCorrelationImpact).toBeDefined();
      expect(result.featureCorrelationImpact.correlationConsidered).toBe(true);
      
      // Should identify the correlation-breaking outlier
      const outliers = result.statisticalOutliers.detected;
      expect(outliers.some(o => o.rowIndex === 5)).toBe(true);
    });
  });

  describe('Density-Based Detection', () => {
    it('should use Local Outlier Factor (LOF)', async () => {
      // Create clusters with isolated points
      const csvData = `x,y
1,1
1.1,1.1
1.2,0.9
0.9,1.1
5,5
5.1,5.1
4.9,4.9
5.2,5.0
10,1`; // Isolated point
      
      writeFileSync(tempFile, csvData, 'utf8');
      
      const analyzer = new OutlierAnalyzer({
        enableLocalOutlierFactor: true
      });
      const result = await analyzer.analyze(tempFile);
      
      const lofResults = result.methodComparison
        .find(m => m.method === 'lof');
      
      expect(lofResults).toBeDefined();
      expect(lofResults?.outliers.length).toBeGreaterThan(0);
      
      // Should detect the isolated point (10,1)
      expect(lofResults?.outliers.some(o => o.rowIndex === 8)).toBe(true);
    });

    it('should handle varying density regions', async () => {
      // Create data with different density regions
      const csvData = `x,y
1,1
1.1,1.1
1.2,1.2
5,5
5.1,5.1
5.2,5.2
5.3,5.3
5.4,5.4
5.5,5.5
20,20`; // Dense cluster (around 5,5) and sparse points
      
      writeFileSync(tempFile, csvData, 'utf8');
      
      const analyzer = new OutlierAnalyzer({
        enableLocalOutlierFactor: true
      });
      const result = await analyzer.analyze(tempFile);
      
      expect(result.densityAnalysis).toBeDefined();
      expect(result.densityAnalysis.varyingDensity).toBe(true);
      
      // Should identify isolated points in low-density regions
      const outliers = result.statisticalOutliers.detected;
      expect(outliers.length).toBeGreaterThan(0);
    });
  });

  describe('Outlier Impact Analysis', () => {
    it('should assess impact on statistical measures', async () => {
      const csvData = `value1,value2
10,20
11,21
12,22
13,23
14,24
100,200`; // Large outlier
      
      writeFileSync(tempFile, csvData, 'utf8');
      
      const analyzer = new OutlierAnalyzer({
        enableImpactAnalysis: true
      });
      const result = await analyzer.analyze(tempFile);
      
      expect(result.impactAnalysis).toBeDefined();
      expect(result.impactAnalysis.statisticalImpact).toBeDefined();
      
      const impact = result.impactAnalysis.statisticalImpact;
      expect(impact.meanShift).toBeGreaterThan(0);
      expect(impact.varianceInflation).toBeGreaterThan(0);
      expect(impact.correlationDistortion).toBeDefined();
    });

    it('should analyze impact on model performance', async () => {
      const csvData = `feature1,feature2,target
1,2,1
2,3,2
3,4,3
4,5,4
100,200,100`; // Outlier in features and target
      
      writeFileSync(tempFile, csvData, 'utf8');
      
      const analyzer = new OutlierAnalyzer({
        enableImpactAnalysis: true
      });
      const result = await analyzer.analyze(tempFile);
      
      expect(result.impactAnalysis.modelImpact).toBeDefined();
      expect(result.impactAnalysis.modelImpact.regressionImpact).toBeDefined();
      expect(result.impactAnalysis.modelImpact.classificationImpact).toBeDefined();
      
      // Should indicate high impact
      expect(result.impactAnalysis.modelImpact.overallImpact).toBe('high');
    });
  });

  describe('Treatment Recommendations', () => {
    it('should recommend appropriate treatment strategies', async () => {
      const csvData = `normal_feature,outlier_feature
1,10
2,11
3,12
4,13
5,1000`; // Clear outlier in second feature
      
      writeFileSync(tempFile, csvData, 'utf8');
      
      const analyzer = new OutlierAnalyzer();
      const result = await analyzer.analyze(tempFile);
      
      expect(result.treatmentRecommendations).toBeDefined();
      expect(result.treatmentRecommendations.length).toBeGreaterThan(0);
      
      const recommendations = result.treatmentRecommendations;
      
      // Should recommend specific treatments
      const methods = recommendations.map(r => r.method);
      expect(methods.some(m => ['remove', 'transform', 'cap', 'impute'].includes(m))).toBe(true);
      
      // Each recommendation should have reasoning
      for (const rec of recommendations) {
        expect(rec.method).toBeDefined();
        expect(rec.reasoning).toBeDefined();
        expect(rec.applicableOutliers).toBeDefined();
        expect(rec.pros).toBeDefined();
        expect(rec.cons).toBeDefined();
      }
    });

    it('should consider outlier severity in recommendations', async () => {
      const csvData = `mild_outlier,extreme_outlier
10,100
11,101
12,102
13,103
15,10000`; // Mild vs extreme outliers
      
      writeFileSync(tempFile, csvData, 'utf8');
      
      const analyzer = new OutlierAnalyzer();
      const result = await analyzer.analyze(tempFile);
      
      const treatments = result.treatmentRecommendations;
      
      // Should have different recommendations for different severities
      const mildTreatment = treatments.find(t => t.severity === 'mild');
      const extremeTreatment = treatments.find(t => t.severity === 'high');
      
      expect(mildTreatment).toBeDefined();
      expect(extremeTreatment).toBeDefined();
      
      // Extreme outliers might get removal recommendation
      expect(extremeTreatment?.method).toBe('remove');
      
      // Mild outliers might get transformation recommendation
      expect(['transform', 'cap', 'keep'].includes(mildTreatment?.method || '')).toBe(true);
    });
  });

  describe('Validation and Robustness', () => {
    it('should validate outlier detection robustness', async () => {
      const csvData = `stable1,stable2
10,20
11,21
12,22
13,23
14,24
15,25
16,26
17,27`;
      
      writeFileSync(tempFile, csvData, 'utf8');
      
      const analyzer = new OutlierAnalyzer({
        enableRobustnessValidation: true
      });
      const result = await analyzer.analyze(tempFile);
      
      expect(result.robustnessValidation).toBeDefined();
      expect(result.robustnessValidation.methodAgreement).toBeDefined();
      expect(result.robustnessValidation.parameterSensitivity).toBeDefined();
      
      // Should assess agreement between methods
      expect(result.robustnessValidation.methodAgreement.score).toBeGreaterThan(0);
      expect(result.robustnessValidation.methodAgreement.score).toBeLessThanOrEqual(1);
    });

    it('should handle parameter sensitivity analysis', async () => {
      const csvData = `x,y
1,1
2,2
3,3
4,4
10,10`;
      
      writeFileSync(tempFile, csvData, 'utf8');
      
      const analyzer = new OutlierAnalyzer({
        enableParameterSensitivity: true
      });
      const result = await analyzer.analyze(tempFile);
      
      expect(result.parameterSensitivity).toBeDefined();
      expect(result.parameterSensitivity.sensitiveParameters).toBeDefined();
      expect(result.parameterSensitivity.recommendedSettings).toBeDefined();
      
      // Should identify which parameters affect results most
      expect(result.parameterSensitivity.sensitiveParameters.length).toBeGreaterThan(0);
    });
  });

  describe('Configuration and Performance', () => {
    it('should respect configuration options', async () => {
      const csvData = 'x,y\n1,1\n2,2\n3,3\n100,100';
      writeFileSync(tempFile, csvData, 'utf8');
      
      const analyzer = new OutlierAnalyzer({
        maxOutliers: 1,
        enableIsolationForest: false,
        enableContextualAnalysis: false
      });
      
      const result = await analyzer.analyze(tempFile);
      
      expect(result.statisticalOutliers.detected.length).toBeLessThanOrEqual(1);
      expect(result.contextualOutliers).toBeUndefined();
      
      // Should not include isolation forest in method comparison
      const methods = result.methodComparison.map(m => m.method);
      expect(methods).not.toContain('isolation_forest');
    });

    it('should validate configuration parameters', () => {
      const analyzer = new OutlierAnalyzer({
        maxOutliers: -1, // Invalid
        contamination: 1.5 // Invalid (should be 0-1)
      });
      
      const validation = analyzer.validateConfig();
      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });

    it('should handle large datasets efficiently', async () => {
      // Create larger dataset
      let csvData = 'x,y,z\n';
      for (let i = 0; i < 500; i++) {
        csvData += `${Math.random() * 10},${Math.random() * 10},${Math.random() * 10}\n`;
      }
      // Add a few clear outliers
      csvData += '100,100,100\n200,200,200\n';
      
      writeFileSync(tempFile, csvData, 'utf8');
      
      const startTime = Date.now();
      const analyzer = new OutlierAnalyzer();
      const result = await analyzer.analyze(tempFile);
      const endTime = Date.now();
      
      expect(result).toBeDefined();
      expect(endTime - startTime).toBeLessThan(10000); // Should complete in under 10 seconds
      expect(result.performanceMetrics.recordsProcessed).toBe(502);
      
      // Should detect the obvious outliers
      expect(result.statisticalOutliers.detected.length).toBeGreaterThan(0);
    }, 15000);
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle datasets with no outliers', async () => {
      const csvData = `x,y
1,1
2,2
3,3
4,4
5,5`;
      
      writeFileSync(tempFile, csvData, 'utf8');
      
      const analyzer = new OutlierAnalyzer();
      const result = await analyzer.analyze(tempFile);
      
      expect(result.statisticalOutliers.detected).toBeDefined();
      expect(result.statisticalOutliers.detected.length).toBe(0);
      
      expect(result.summary.totalOutliers).toBe(0);
      expect(result.summary.outlierPercentage).toBe(0);
    });

    it('should handle datasets where all points are outliers', async () => {
      const csvData = `x,y
1,100
50,2
75,80
25,150`; // Each point is far from others
      
      writeFileSync(tempFile, csvData, 'utf8');
      
      const analyzer = new OutlierAnalyzer();
      const result = await analyzer.analyze(tempFile);
      
      expect(result.warnings).toBeDefined();
      expect(result.warnings.some(w => w.includes('many outliers') || w.includes('data quality'))).toBe(true);
      
      // Should still provide analysis but with warnings
      expect(result.statisticalOutliers.detected).toBeDefined();
    });

    it('should handle single data point', async () => {
      const csvData = 'x,y\n1,2';
      writeFileSync(tempFile, csvData, 'utf8');
      
      const analyzer = new OutlierAnalyzer();
      const result = await analyzer.analyze(tempFile);
      
      expect(result.warnings).toBeDefined();
      expect(result.warnings.some(w => w.includes('insufficient data'))).toBe(true);
      
      expect(result.statisticalOutliers.detected.length).toBe(0);
    });
  });
});
