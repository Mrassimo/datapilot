import { MultivariateOutlierAnalyzer as OutlierAnalyzer } from '../../../src/analyzers/multivariate/outlier-analyzer';
import { 
  parseCSVForTest, 
  TestFileManager, 
  AnalyzerTestValidator,
  TestDataGenerator,
  APIContractTester 
} from '../../helpers/test-utilities';

describe('OutlierAnalyzer - Multivariate Outlier Detection', () => {
  let fileManager: TestFileManager;

  beforeEach(() => {
    fileManager = new TestFileManager('outlier-test-');
  });

  afterEach(() => {
    fileManager.cleanup();
  });

  describe('API Contract Validation', () => {
    it('should have correct static method interface', () => {
      APIContractTester.validateStaticAnalyzerInterface(OutlierAnalyzer, 'analyze', 4);
    });
  });

  describe('Basic Outlier Detection', () => {
    it('should detect obvious statistical outliers', () => {
      const csvData = `x,y
1,1
2,2
3,3
4,4
5,5
100,100`; // Clear outlier
      
      const { data, headers, numericalColumnIndices } = parseCSVForTest(csvData);
      const result = OutlierAnalyzer.analyze(data, headers, numericalColumnIndices, data.length);
      
      // Use standardised validation
      AnalyzerTestValidator.validateOutlierResult(result);
      
      if (result.isApplicable) {
        // Should detect the (100,100) point
        const outliers = result.outliers;
        expect(outliers.some(outlier => outlier.rowIndex === 5)).toBe(true); // 0-indexed
        
        // Should provide outlier scores
        const outlier = outliers.find(o => o.rowIndex === 5);
        expect(outlier?.mahalanobisDistance).toBeGreaterThan(0);
        expect(outlier?.severity).toBeDefined();
      }
    });

    it('should handle multiple variables', () => {
      const csvData = `feature1,feature2,feature3
1,10,100
2,11,101
3,12,102
4,13,103
5,14,104
50,15,105
6,50,106
7,16,500`; // Different outlier patterns
      
      const { data, headers, numericalColumnIndices } = parseCSVForTest(csvData);
      const result = OutlierAnalyzer.analyze(data, headers, numericalColumnIndices, data.length);
      
      expect(result.isApplicable).toBeDefined();
      expect(result.method).toBe('mahalanobis_distance');
      
      if (result.isApplicable) {
        expect(result.outliers).toBeDefined();
        expect(result.technicalDetails.numericVariablesUsed).toEqual(headers);
        expect(result.severityDistribution).toBeDefined();
        expect(result.affectedVariables).toBeDefined();
      }
    });

    it('should calculate outlier severity and provide technical details', () => {
      const csvData = `normal1,normal2,extreme
1,1,1
2,2,2
3,3,3
4,4,4
5,5,1000`; // Extreme outlier in one dimension
      
      const { data, headers, numericalColumnIndices } = parseCSVForTest(csvData);
      const sampleSize = data.length;
      const result = OutlierAnalyzer.analyze(data, headers, numericalColumnIndices, sampleSize);
      
      expect(result.technicalDetails).toBeDefined();
      expect(result.technicalDetails.sampleSize).toBe(sampleSize);
      expect(result.technicalDetails.degreesOfFreedom).toBeDefined();
      expect(result.technicalDetails.covarianceMatrix).toBeDefined();
      
      if (result.isApplicable) {
        const outliers = result.outliers;
        expect(outliers.length).toBeGreaterThan(0);
        
        // Should have severity distribution
        expect(result.severityDistribution.mild).toBeDefined();
        expect(result.severityDistribution.moderate).toBeDefined();
        expect(result.severityDistribution.extreme).toBeDefined();
        
        // Should analyze affected variables
        expect(result.affectedVariables.length).toBeGreaterThan(0);
        for (const variable of result.affectedVariables) {
          expect(variable.variable).toBeDefined();
          expect(variable.outliersCount).toBeGreaterThanOrEqual(0);
          expect(variable.meanContribution).toBeGreaterThanOrEqual(0);
        }
      }
    });

    it('should handle edge cases gracefully', () => {
      // Test with minimal data (should not be applicable)
      const csvData = `x,y
1,1
2,2`;
      
      const { data, headers, numericalColumnIndices } = parseCSVForTest(csvData);
      const result = OutlierAnalyzer.analyze(data, headers, numericalColumnIndices, data.length);
      
      // Should handle gracefully
      expect(result).toBeDefined();
      expect(result.isApplicable).toBe(false);
      expect(result.applicabilityReason).toBeDefined();
      expect(result.method).toBe('mahalanobis_distance');
    });

    it('should provide meaningful recommendations', () => {
      const csvData = `var1,var2,var3
10,20,30
11,21,31
12,22,32
13,23,33
14,24,34
50,25,35`; // One clear outlier
      
      const { data, headers, numericalColumnIndices } = parseCSVForTest(csvData);
      const result = OutlierAnalyzer.analyze(data, headers, numericalColumnIndices, data.length);
      
      if (result.isApplicable) {
        expect(result.recommendations).toBeDefined();
        expect(result.recommendations.length).toBeGreaterThan(0);
        expect(result.recommendations.every(rec => typeof rec === 'string')).toBe(true);
      }
    });

    it('should handle uniform data (no outliers)', () => {
      const csvData = `consistent1,consistent2
1,10
2,20
3,30
4,40
5,50`;
      
      const { data, headers, numericalColumnIndices } = parseCSVForTest(csvData);
      const result = OutlierAnalyzer.analyze(data, headers, numericalColumnIndices, data.length);
      
      if (result.isApplicable) {
        // May or may not find outliers, but should handle gracefully
        expect(result.outliers).toBeDefined();
        expect(result.totalOutliers).toBe(result.outliers.length);
        expect(result.outlierPercentage).toBeGreaterThanOrEqual(0);
        expect(result.outlierPercentage).toBeLessThanOrEqual(100);
      }
    });
  });
});