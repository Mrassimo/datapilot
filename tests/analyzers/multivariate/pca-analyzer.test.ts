import { PCAAnalyzer } from '../../../src/analyzers/multivariate/pca-analyzer';
import { writeFileSync, unlinkSync, mkdtempSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

// Helper function to parse CSV data for tests
function parseCSVForTest(csvData: string): {
  data: (string | number | null | undefined)[][];
  headers: string[];
  numericalColumnIndices: number[];
} {
  const rows = csvData.trim().split('\n');
  const headers = rows[0].split(',');
  const data: (string | number | null | undefined)[][] = [];
  
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i].split(',').map(cell => {
      const trimmed = cell.trim();
      const num = parseFloat(trimmed);
      return isNaN(num) ? trimmed : num;
    });
    data.push(row);
  }
  
  // Find numerical columns
  const numericalColumnIndices: number[] = [];
  for (let colIndex = 0; colIndex < headers.length; colIndex++) {
    let hasNumbers = true;
    for (let rowIndex = 0; rowIndex < Math.min(data.length, 5); rowIndex++) {
      if (typeof data[rowIndex][colIndex] !== 'number') {
        hasNumbers = false;
        break;
      }
    }
    if (hasNumbers) {
      numericalColumnIndices.push(colIndex);
    }
  }
  
  return { data, headers, numericalColumnIndices };
}

describe('PCAAnalyzer - Principal Component Analysis', () => {
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

  describe('Basic PCA Analysis', () => {
    it('should analyze correlated data and determine PCA applicability', async () => {
      // Create high-dimensional correlated data
      let csvData = 'f1,f2,f3,f4,f5\n';
      for (let i = 0; i < 20; i++) {
        const base = Math.random() * 10;
        const row = [
          base,
          base + Math.random() * 0.5, // Correlated with f1
          base * 2 + Math.random() * 0.5, // Correlated with f1
          Math.random() * 10, // Independent
          Math.random() * 10, // Independent
        ];
        csvData += row.join(',') + '\n';
      }
      
      writeFileSync(tempFile, csvData, 'utf8');
      
      const { data, headers, numericalColumnIndices } = parseCSVForTest(csvData);
      const result = PCAAnalyzer.analyze(data, headers, numericalColumnIndices, data.length);
      
      expect(result.isApplicable).toBeDefined();
      expect(result.applicabilityReason).toBeDefined();
      expect(result.totalVariance).toBeDefined();
      expect(result.components).toBeDefined();
      expect(result.componentsAnalyzed).toBeDefined();
    });

    it('should detect when PCA is not applicable', async () => {
      // Create data with insufficient samples or features
      const csvData = `x,y\n1,2\n3,4`;
      
      writeFileSync(tempFile, csvData, 'utf8');
      
      const { data, headers, numericalColumnIndices } = parseCSVForTest(csvData);
      const result = PCAAnalyzer.analyze(data, headers, numericalColumnIndices, data.length);
      
      expect(result.isApplicable).toBe(false);
      expect(result.applicabilityReason).toBeDefined();
    });

    it('should calculate explained variance and components', async () => {
      const csvData = `x,y,z
1,2,3
2,4,6
3,6,9
4,8,12
5,10,15
6,12,18`;
      
      writeFileSync(tempFile, csvData, 'utf8');
      
      const { data, headers, numericalColumnIndices } = parseCSVForTest(csvData);
      const result = PCAAnalyzer.analyze(data, headers, numericalColumnIndices, data.length);
      
      if (result.isApplicable) {
        expect(result.components).toBeDefined();
        expect(result.totalVariance).toBeGreaterThan(0);
        expect(result.screeData).toBeDefined();
        expect(result.varianceThresholds).toBeDefined();
        
        // Check variance thresholds structure
        expect(result.varianceThresholds.componentsFor80Percent).toBeDefined();
        expect(result.varianceThresholds.componentsFor90Percent).toBeDefined();
        expect(result.varianceThresholds.componentsFor95Percent).toBeDefined();
      }
    });

    it('should identify dominant variables', async () => {
      const csvData = `highly_informative,moderately_informative,low_informative
10,5,1
20,6,1.1
30,7,0.9
40,8,1.2
50,9,0.8
60,10,1.1`;
      
      writeFileSync(tempFile, csvData, 'utf8');
      
      const { data, headers, numericalColumnIndices } = parseCSVForTest(csvData);
      const result = PCAAnalyzer.analyze(data, headers, numericalColumnIndices, data.length);
      
      if (result.isApplicable) {
        expect(result.dominantVariables).toBeDefined();
        expect(result.dominantVariables).toBeInstanceOf(Array);
      }
    });

    it('should provide technical details', async () => {
      const csvData = `a,b,c
1,2,3
4,5,6
7,8,9
10,11,12`;
      
      writeFileSync(tempFile, csvData, 'utf8');
      
      const { data, headers, numericalColumnIndices } = parseCSVForTest(csvData);
      const result = PCAAnalyzer.analyze(data, headers, numericalColumnIndices, data.length);
      
      expect(result.technicalDetails).toBeDefined();
      expect(result.technicalDetails.sampleSize).toBeGreaterThanOrEqual(0);
      expect(result.technicalDetails.numericVariablesUsed).toBeInstanceOf(Array);
      expect(result.technicalDetails.correlationMatrix).toBeDefined();
    });

    it('should handle edge cases gracefully', async () => {
      // Test with minimal data
      const csvData = 'single_feature\n1\n2\n3';
      writeFileSync(tempFile, csvData, 'utf8');
      
      const { data, headers, numericalColumnIndices } = parseCSVForTest(csvData);
      const result = PCAAnalyzer.analyze(data, headers, numericalColumnIndices, data.length);
      
      // Should handle gracefully
      expect(result).toBeDefined();
      expect(result.isApplicable).toBeDefined();
      expect(result.applicabilityReason).toBeDefined();
    });

    it('should provide dimensionality recommendations', async () => {
      const csvData = `f1,f2,f3,f4
1,1.1,10,100
2,2.1,15,105
3,3.1,12,98
4,4.1,18,102
5,5.1,11,99`;
      
      writeFileSync(tempFile, csvData, 'utf8');
      
      const { data, headers, numericalColumnIndices } = parseCSVForTest(csvData);
      const result = PCAAnalyzer.analyze(data, headers, numericalColumnIndices, data.length);
      
      expect(result.dimensionalityRecommendations).toBeDefined();
      expect(result.dimensionalityRecommendations).toBeInstanceOf(Array);
    });
  });
});