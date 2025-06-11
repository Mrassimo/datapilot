import { PCAAnalyzer } from '../../../src/analyzers/multivariate/pca-analyzer';
import { writeFileSync, unlinkSync, mkdtempSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe.skip('PCAAnalyzer - Principal Component Analysis', () => {
  let tempDir: string;
  let tempFile: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'datapilot-pca-test-'));
    tempFile = join(tempDir, 'test.csv');
  });

  afterEach(() => {
    try {
      unlinkSync(tempFile);
    } catch (e) {
      // File might not exist
    }
  });

  describe('Dimensionality Assessment', () => {
    it('should assess need for dimensionality reduction', async () => {
      // Create high-dimensional correlated data
      let csvData = 'f1,f2,f3,f4,f5,f6,f7,f8,f9,f10\n';
      for (let i = 0; i < 50; i++) {
        const base = Math.random() * 10;
        const row = [
          base,
          base + Math.random() * 0.5, // Correlated with f1
          base * 2 + Math.random() * 0.5, // Correlated with f1
          Math.random() * 10, // Independent
          Math.random() * 10, // Independent
          base + Math.random() * 0.3, // Correlated with f1
          Math.random() * 10, // Independent
          base * 1.5 + Math.random() * 0.4, // Correlated with f1
          Math.random() * 10, // Independent
          Math.random() * 10  // Independent
        ];
        csvData += row.join(',') + '\n';
      }
      
      writeFileSync(tempFile, csvData, 'utf8');
      
      const analyzer = new PCAAnalyzer();
      const result = await analyzer.analyze(tempFile);
      
      expect(result.dimensionalityAssessment).toBeDefined();
      expect(result.dimensionalityAssessment.recommendPCA).toBe(true);
      expect(result.dimensionalityAssessment.reasoning).toContain('correlation');
      
      // Should identify intrinsic dimensionality
      expect(result.dimensionalityAssessment.intrinsicDimensions).toBeDefined();
      expect(result.dimensionalityAssessment.intrinsicDimensions).toBeLessThan(10);
    });

    it('should detect when PCA is not beneficial', async () => {
      // Create independent features with low correlation
      let csvData = 'independent1,independent2,independent3\n';
      for (let i = 0; i < 30; i++) {
        const row = [
          Math.random() * 100,
          Math.random() * 200 + 50,
          Math.random() * 50 + 25
        ];
        csvData += row.join(',') + '\n';
      }
      
      writeFileSync(tempFile, csvData, 'utf8');
      
      const analyzer = new PCAAnalyzer();
      const result = await analyzer.analyze(tempFile);
      
      expect(result.dimensionalityAssessment.recommendPCA).toBe(false);
      expect(result.dimensionalityAssessment.reasoning).toContain('independent');
    });
  });

  describe('Principal Component Analysis', () => {
    it('should calculate explained variance ratios', async () => {
      const csvData = `x,y,z
1,2,3
2,4,6
3,6,9
4,8,12
5,10,15
6,12,18
7,14,21
8,16,24`;
      
      writeFileSync(tempFile, csvData, 'utf8');
      
      const analyzer = new PCAAnalyzer();
      const result = await analyzer.analyze(tempFile);
      
      expect(result.pcaResults).toBeDefined();
      expect(result.pcaResults.explainedVarianceRatio).toBeDefined();
      expect(result.pcaResults.explainedVarianceRatio.length).toBeGreaterThan(0);
      
      // Variance ratios should sum to approximately 1
      const totalVariance = result.pcaResults.explainedVarianceRatio
        .reduce((sum, ratio) => sum + ratio, 0);
      expect(totalVariance).toBeCloseTo(1, 1);
      
      // First component should explain most variance
      expect(result.pcaResults.explainedVarianceRatio[0]).toBeGreaterThan(0.5);
    });

    it('should identify optimal number of components', async () => {
      // Create data with clear dimensionality structure
      let csvData = 'comp1_base,comp1_noise,comp2_base,comp2_noise,noise1,noise2\n';
      for (let i = 0; i < 100; i++) {
        const comp1 = Math.random() * 10;
        const comp2 = Math.random() * 10;
        const row = [
          comp1,
          comp1 + Math.random() * 0.1, // Same as comp1 with noise
          comp2,
          comp2 + Math.random() * 0.1, // Same as comp2 with noise
          Math.random() * 0.5, // Pure noise
          Math.random() * 0.5  // Pure noise
        ];
        csvData += row.join(',') + '\n';
      }
      
      writeFileSync(tempFile, csvData, 'utf8');
      
      const analyzer = new PCAAnalyzer();
      const result = await analyzer.analyze(tempFile);
      
      expect(result.componentSelection).toBeDefined();
      expect(result.componentSelection.recommendedComponents).toBeDefined();
      expect(result.componentSelection.recommendedComponents).toBeLessThan(6);
      
      // Should provide multiple selection criteria
      expect(result.componentSelection.criteria).toBeDefined();
      expect(result.componentSelection.criteria.kaiser).toBeDefined();
      expect(result.componentSelection.criteria.scree).toBeDefined();
      expect(result.componentSelection.criteria.variance90).toBeDefined();
      expect(result.componentSelection.criteria.variance95).toBeDefined();
    });

    it('should analyze component loadings', async () => {
      const csvData = `related1,related2,independent1,independent2
1,1.1,10,100
2,2.1,15,105
3,3.1,12,98
4,4.1,18,102
5,5.1,11,99
6,6.1,16,101
7,7.1,13,103
8,8.1,17,97`;
      
      writeFileSync(tempFile, csvData, 'utf8');
      
      const analyzer = new PCAAnalyzer();
      const result = await analyzer.analyze(tempFile);
      
      expect(result.componentLoadings).toBeDefined();
      expect(result.componentLoadings.length).toBeGreaterThan(0);
      
      // Each component should have loadings for all original features
      const firstComponent = result.componentLoadings[0];
      expect(firstComponent.componentNumber).toBe(1);
      expect(firstComponent.loadings).toBeDefined();
      expect(Object.keys(firstComponent.loadings)).toHaveLength(4);
      
      // Should identify most influential features
      expect(firstComponent.dominantFeatures).toBeDefined();
      expect(firstComponent.dominantFeatures.length).toBeGreaterThan(0);
    });
  });

  describe('Feature Contribution Analysis', () => {
    it('should identify feature contributions to components', async () => {
      const csvData = `highly_informative,moderately_informative,low_informative
10,5,1
20,6,1.1
30,7,0.9
40,8,1.2
50,9,0.8
60,10,1.1
70,11,0.9
80,12,1.0`;
      
      writeFileSync(tempFile, csvData, 'utf8');
      
      const analyzer = new PCAAnalyzer();
      const result = await analyzer.analyze(tempFile);
      
      expect(result.featureContributions).toBeDefined();
      
      const contributions = result.featureContributions;
      expect(contributions.length).toBe(3); // One for each feature
      
      // Should rank features by total contribution
      const sortedContribs = contributions.sort((a, b) => b.totalContribution - a.totalContribution);
      expect(sortedContribs[0].featureName).toBe('highly_informative');
      
      // Each feature should have contribution per component
      for (const contrib of contributions) {
        expect(contrib.featureName).toBeDefined();
        expect(contrib.totalContribution).toBeGreaterThan(0);
        expect(contrib.componentContributions).toBeDefined();
      }
    });

    it('should identify redundant features', async () => {
      const csvData = `original,duplicate,near_duplicate,independent
1,1,1.01,10
2,2,2.02,15
3,3,3.01,12
4,4,4.02,18
5,5,5.01,11
6,6,6.02,16
7,7,7.01,13
8,8,8.02,17`;
      
      writeFileSync(tempFile, csvData, 'utf8');
      
      const analyzer = new PCAAnalyzer();
      const result = await analyzer.analyze(tempFile);
      
      expect(result.redundancyAnalysis).toBeDefined();
      expect(result.redundancyAnalysis.redundantFeatures).toBeDefined();
      expect(result.redundancyAnalysis.redundantFeatures.length).toBeGreaterThan(0);
      
      // Should identify the duplicate/near-duplicate features
      const redundantNames = result.redundancyAnalysis.redundantFeatures
        .map(f => f.featureName);
      expect(redundantNames.some(name => ['duplicate', 'near_duplicate'].includes(name))).toBe(true);
    });
  });

  describe('Visualization Recommendations', () => {
    it('should recommend appropriate visualization techniques', async () => {
      const csvData = `dim1,dim2,dim3,dim4,dim5
1,2,3,4,5
2,3,4,5,6
3,4,5,6,7
4,5,6,7,8
5,6,7,8,9
6,7,8,9,10
7,8,9,10,11
8,9,10,11,12`;
      
      writeFileSync(tempFile, csvData, 'utf8');
      
      const analyzer = new PCAAnalyzer();
      const result = await analyzer.analyze(tempFile);
      
      expect(result.visualizationRecommendations).toBeDefined();
      expect(result.visualizationRecommendations.scatterPlots).toBeDefined();
      expect(result.visualizationRecommendations.biplots).toBeDefined();
      expect(result.visualizationRecommendations.screenPlots).toBeDefined();
      
      // Should recommend 2D and 3D plots
      expect(result.visualizationRecommendations.scatterPlots.pc1_vs_pc2).toBe(true);
      expect(result.visualizationRecommendations.scatterPlots.pc1_vs_pc2_vs_pc3).toBe(true);
      
      // Should recommend biplot for feature interpretation
      expect(result.visualizationRecommendations.biplots.recommended).toBe(true);
    });

    it('should provide interpretation guidelines', async () => {
      const csvData = `feature1,feature2,feature3
1,10,100
2,20,200
3,30,300
4,40,400
5,50,500`;
      
      writeFileSync(tempFile, csvData, 'utf8');
      
      const analyzer = new PCAAnalyzer();
      const result = await analyzer.analyze(tempFile);
      
      expect(result.interpretationGuidelines).toBeDefined();
      expect(result.interpretationGuidelines.componentInterpretation).toBeDefined();
      expect(result.interpretationGuidelines.componentInterpretation.length).toBeGreaterThan(0);
      
      // Should provide meaningful component names/descriptions
      const firstInterpretation = result.interpretationGuidelines.componentInterpretation[0];
      expect(firstInterpretation.componentNumber).toBe(1);
      expect(firstInterpretation.interpretation).toBeDefined();
      expect(firstInterpretation.suggestedName).toBeDefined();
    });
  });

  describe('Practical Recommendations', () => {
    it('should recommend preprocessing steps', async () => {
      const csvData = `small_scale,large_scale,different_units
1,1000,0.1
2,2000,0.2
3,3000,0.3
4,4000,0.4
5,5000,0.5`;
      
      writeFileSync(tempFile, csvData, 'utf8');
      
      const analyzer = new PCAAnalyzer();
      const result = await analyzer.analyze(tempFile);
      
      expect(result.preprocessingRecommendations).toBeDefined();
      
      // Should recommend standardization due to different scales
      expect(result.preprocessingRecommendations.standardization).toBeDefined();
      expect(result.preprocessingRecommendations.standardization.recommended).toBe(true);
      expect(result.preprocessingRecommendations.standardization.reason).toContain('scale');
      
      // Should check for missing values handling
      expect(result.preprocessingRecommendations.missingValueHandling).toBeDefined();
    });

    it('should provide implementation guidance', async () => {
      const csvData = `x,y,z
1,2,3
4,5,6
7,8,9
10,11,12`;
      
      writeFileSync(tempFile, csvData, 'utf8');
      
      const analyzer = new PCAAnalyzer();
      const result = await analyzer.analyze(tempFile);
      
      expect(result.implementationGuidance).toBeDefined();
      expect(result.implementationGuidance.frameworks).toBeDefined();
      expect(result.implementationGuidance.frameworks.length).toBeGreaterThan(0);
      
      // Should recommend standard frameworks
      const frameworks = result.implementationGuidance.frameworks
        .map(f => f.name.toLowerCase());
      expect(frameworks.some(name => ['sklearn', 'scikit-learn', 'python'].includes(name))).toBe(true);
      
      // Should provide code snippets or pseudocode
      expect(result.implementationGuidance.pseudocode).toBeDefined();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle insufficient data', async () => {
      const csvData = 'x,y\n1,2\n3,4';
      writeFileSync(tempFile, csvData, 'utf8');
      
      const analyzer = new PCAAnalyzer();
      const result = await analyzer.analyze(tempFile);
      
      expect(result.warnings).toBeDefined();
      expect(result.warnings.some(w => w.includes('insufficient'))).toBe(true);
      
      // Should still provide basic analysis
      expect(result.dimensionalityAssessment).toBeDefined();
    });

    it('should handle single feature data', async () => {
      const csvData = 'single_feature\n1\n2\n3\n4\n5';
      writeFileSync(tempFile, csvData, 'utf8');
      
      const analyzer = new PCAAnalyzer();
      const result = await analyzer.analyze(tempFile);
      
      expect(result.warnings).toBeDefined();
      expect(result.warnings.some(w => w.includes('single feature'))).toBe(true);
      
      expect(result.dimensionalityAssessment.recommendPCA).toBe(false);
      expect(result.dimensionalityAssessment.reasoning).toContain('single');
    });

    it('should handle constant features', async () => {
      const csvData = `constant,variable
5,1
5,2
5,3
5,4
5,5`;
      
      writeFileSync(tempFile, csvData, 'utf8');
      
      const analyzer = new PCAAnalyzer();
      const result = await analyzer.analyze(tempFile);
      
      expect(result.warnings).toBeDefined();
      expect(result.warnings.some(w => w.includes('constant') || w.includes('variance'))).toBe(true);
      
      // Should recommend removing constant features
      expect(result.preprocessingRecommendations.constantFeatureRemoval).toBeDefined();
      expect(result.preprocessingRecommendations.constantFeatureRemoval.recommended).toBe(true);
      expect(result.preprocessingRecommendations.constantFeatureRemoval.constantFeatures).toContain('constant');
    });

    it('should handle perfect multicollinearity', async () => {
      const csvData = `x,y,z
1,2,3
2,4,6
3,6,9
4,8,12`; // z = x + y
      
      writeFileSync(tempFile, csvData, 'utf8');
      
      const analyzer = new PCAAnalyzer();
      const result = await analyzer.analyze(tempFile);
      
      expect(result.warnings).toBeDefined();
      expect(result.warnings.some(w => w.includes('multicollinearity') || w.includes('singular'))).toBe(true);
      
      // Should identify the linear dependency
      expect(result.redundancyAnalysis.perfectCorrelations).toBeDefined();
      expect(result.redundancyAnalysis.perfectCorrelations.length).toBeGreaterThan(0);
    });
  });

  describe('Configuration and Performance', () => {
    it('should respect configuration parameters', async () => {
      const csvData = 'a,b,c,d,e\n1,2,3,4,5\n2,3,4,5,6\n3,4,5,6,7\n4,5,6,7,8';
      writeFileSync(tempFile, csvData, 'utf8');
      
      const analyzer = new PCAAnalyzer({
        maxComponents: 3,
        varianceThreshold: 0.95,
        enableVisualizationRecs: false
      });
      
      const result = await analyzer.analyze(tempFile);
      
      expect(result.pcaResults.explainedVarianceRatio.length).toBeLessThanOrEqual(3);
      expect(result.visualizationRecommendations).toBeUndefined();
    });

    it('should validate configuration', () => {
      const analyzer = new PCAAnalyzer({
        maxComponents: 0, // Invalid
        varianceThreshold: 1.5 // Invalid (should be 0-1)
      });
      
      const validation = analyzer.validateConfig();
      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });

    it('should handle performance efficiently', async () => {
      // Create larger dataset
      let csvData = 'f1,f2,f3,f4,f5\n';
      for (let i = 0; i < 200; i++) {
        const row = Array.from({ length: 5 }, () => Math.random() * 100);
        csvData += row.join(',') + '\n';
      }
      
      writeFileSync(tempFile, csvData, 'utf8');
      
      const startTime = Date.now();
      const analyzer = new PCAAnalyzer();
      const result = await analyzer.analyze(tempFile);
      const endTime = Date.now();
      
      expect(result).toBeDefined();
      expect(endTime - startTime).toBeLessThan(8000); // Should complete in under 8 seconds
      expect(result.performanceMetrics.recordsProcessed).toBe(200);
    });
  });
});
