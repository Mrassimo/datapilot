/**
 * Section 3 EDA Adapter Tests
 *
 * Tests the V1 → V2 conversion for EDA analysis data
 * Verifies field mappings, type detection, and statistical calculations
 */

import { Section3Adapter } from '../../../../src/analyzers/eda/section3-adapter';
import type {
  Section3EdaAnalysis,
  NumericalColumnAnalysis,
  CategoricalColumnAnalysis,
  TextColumnAnalysis,
} from '../../../../src/analyzers/eda/types';
import type { Section3EdaAnalysisV2 } from '../../../../src/analyzers/eda/types-v2';

describe('Section3Adapter', () => {
  describe('convertToV2', () => {
    describe('Happy Path Tests', () => {
      it('should convert numerical column analysis correctly', () => {
        const v1Input: Section3EdaAnalysis = {
          univariateAnalysis: [
            {
              columnName: 'age',
              detectedDataType: 'Numerical (Float)',
              inferredSemanticType: 'Numerical',
              totalValues: 1000,
              missingValues: 10,
              missingPercentage: 1.0,
              uniqueValues: 50,
              uniquePercentage: 5.0,
              descriptiveStats: {
                minimum: 18,
                maximum: 65,
                mean: 35.5,
                median: 34.0,
                standardDeviation: 12.5,
                variance: 156.25,
                modes: [32],
              },
              quantileStats: {
                quartile1st: 28.0,
                quartile3rd: 45.0,
                interquartileRange: 17.0,
              },
              distributionAnalysis: {
                skewness: 0.3,
                kurtosis: 2.8,
              },
              outlierAnalysis: {
                iqrMethod: {
                  lowerOutliers: 5,
                  upperOutliers: 8,
                  lowerFence: 10.0,
                  upperFence: 70.0,
                },
                zScoreMethod: {
                  lowerOutliers: 3,
                  upperOutliers: 7,
                },
              },
              normalityTests: {
                shapiroWilk: {
                  testStatistic: 0.98,
                  pValue: 0.15,
                  isNormal: true,
                },
                jarqueBera: {
                  testStatistic: 5.2,
                  pValue: 0.07,
                  isNormal: true,
                },
              },
              numericalPatterns: {
                zeroValuePercentage: 2.0,
                negativeValuePercentage: 0.5,
              },
            } as any,
          ],
          bivariateAnalysis: {
            numericalVsNumerical: {
              correlationMatrix: {
                variables: ['age', 'income'],
              },
              correlationPairs: [
                {
                  variable1: 'age',
                  variable2: 'income',
                  correlation: 0.75,
                  pValue: 0.001,
                  sampleSize: 990,
                },
              ],
            },
          },
        } as any;

        const v2Output = Section3Adapter.convertToV2(v1Input);

        expect(v2Output.version).toBe('2.0');

        // Check column profile
        expect(v2Output.columns).toHaveLength(1);
        expect(v2Output.columns[0].column).toBe('age');
        expect(v2Output.columns[0].data_type).toBe('numeric');
        expect(v2Output.columns[0].total).toBe(1000);
        expect(v2Output.columns[0].missing).toBe(10);
        expect(v2Output.columns[0].missing_ratio).toBe(0.01);
        expect(v2Output.columns[0].unique).toBe(50);
        expect(v2Output.columns[0].unique_ratio).toBe(0.05);

        // Check numeric stats
        expect(v2Output.numeric_stats).toHaveLength(1);
        const numStats = v2Output.numeric_stats[0];
        expect(numStats.column).toBe('age');
        expect(numStats.min).toBe(18);
        expect(numStats.max).toBe(65);
        expect(numStats.mean).toBe(35.5);
        expect(numStats.median).toBe(34.0);
        expect(numStats.std_dev).toBe(12.5);
        expect(numStats.variance).toBe(156.25);
        expect(numStats.q1).toBe(28.0);
        expect(numStats.q3).toBe(45.0);
        expect(numStats.iqr).toBe(17.0);
        expect(numStats.skewness).toBe(0.3);
        expect(numStats.kurtosis).toBe(2.8);
        expect(numStats.zeros).toBe(20); // 2% of 1000
        expect(numStats.negatives).toBe(5); // 0.5% of 1000

        // Check outliers
        expect(v2Output.outliers).toHaveLength(1);
        const outliers = v2Output.outliers[0];
        expect(outliers.column).toBe('age');
        expect(outliers.iqr_lower_outliers).toBe(5);
        expect(outliers.iqr_upper_outliers).toBe(8);
        expect(outliers.iqr_lower_fence).toBe(10.0);
        expect(outliers.iqr_upper_fence).toBe(70.0);
        expect(outliers.zscore_outliers).toBe(10); // 3 + 7

        // Check distributions
        expect(v2Output.distributions).toHaveLength(1);
        const dist = v2Output.distributions[0];
        expect(dist.column).toBe('age');
        expect(dist.shapiro_wilk_p).toBe(0.15);
        expect(dist.jarque_bera_p).toBe(0.07);
        expect(dist.is_symmetric).toBe(true); // skewness < 0.5
        expect(dist.is_unimodal).toBe(true); // 1 mode

        // Check correlations
        expect(v2Output.correlations.numeric_columns).toContain('age');
        expect(v2Output.correlations.numeric_columns).toContain('income');
        expect(v2Output.correlations.correlations).toHaveLength(1);
        expect(v2Output.correlations.correlations[0].col_a).toBe('age');
        expect(v2Output.correlations.correlations[0].col_b).toBe('income');
        expect(v2Output.correlations.correlations[0].correlation).toBe(0.75);
        expect(v2Output.correlations.strong_correlations).toHaveLength(1);
      });

      it('should convert categorical column analysis correctly', () => {
        const v1Input: Section3EdaAnalysis = {
          univariateAnalysis: [
            {
              columnName: 'category',
              detectedDataType: 'Categorical',
              inferredSemanticType: 'Categorical',
              totalValues: 1000,
              missingValues: 5,
              missingPercentage: 0.5,
              uniqueValues: 10,
              uniquePercentage: 1.0,
              uniqueCategories: 10,
              frequencyDistribution: [
                { label: 'A', count: 300, percentage: 30 },
                { label: 'B', count: 250, percentage: 25 },
                { label: 'C', count: 200, percentage: 20 },
                { label: 'D', count: 150, percentage: 15 },
                { label: 'E', count: 100, percentage: 10 },
              ],
            } as any,
          ],
          bivariateAnalysis: {},
        } as any;

        const v2Output = Section3Adapter.convertToV2(v1Input);

        expect(v2Output.categorical_stats).toHaveLength(1);
        const catStats = v2Output.categorical_stats[0];
        expect(catStats.column).toBe('category');
        expect(catStats.unique_categories).toBe(10);
        expect(catStats.top_5).toHaveLength(5);
        expect(catStats.top_5[0].value).toBe('A');
        expect(catStats.top_5[0].count).toBe(300);
        expect(catStats.top_5[0].ratio).toBe(0.30);

        // Entropy should be calculated
        expect(catStats.entropy).toBeGreaterThan(0);
        expect(catStats.entropy).toBeLessThan(4); // Max entropy for 10 categories is log2(10) ≈ 3.32

        // Concentration in top 5 should be 100% (all values are in top 5)
        expect(catStats.concentration).toBeCloseTo(1.0, 1);
      });

      it('should convert text column analysis correctly', () => {
        const v1Input: Section3EdaAnalysis = {
          univariateAnalysis: [
            {
              columnName: 'description',
              detectedDataType: 'Text',
              inferredSemanticType: 'Text',
              totalValues: 500,
              missingValues: 10,
              missingPercentage: 2.0,
              uniqueValues: 450,
              uniquePercentage: 90.0,
              textStatistics: {
                minCharLength: 5,
                maxCharLength: 200,
                avgCharLength: 75.5,
              },
              textPatterns: {
                urlCount: 25,
                emailCount: 50,
                numericTextPercentage: 10.0,
              },
            } as any,
          ],
          bivariateAnalysis: {},
        } as any;

        const v2Output = Section3Adapter.convertToV2(v1Input);

        expect(v2Output.text_stats).toHaveLength(1);
        const textStats = v2Output.text_stats[0];
        expect(textStats.column).toBe('description');
        expect(textStats.min_length).toBe(5);
        expect(textStats.max_length).toBe(200);
        expect(textStats.avg_length).toBe(75.5);
        expect(textStats.contains_urls).toBe(true);
        expect(textStats.contains_emails).toBe(true);
        expect(textStats.contains_numbers).toBe(true);
      });

      it('should handle mixed column types correctly', () => {
        const v1Input: Section3EdaAnalysis = {
          univariateAnalysis: [
            {
              columnName: 'age',
              detectedDataType: 'Numerical (Integer)',
              inferredSemanticType: 'Age',
              totalValues: 100,
              missingValues: 0,
              missingPercentage: 0,
              uniqueValues: 50,
              uniquePercentage: 50,
              descriptiveStats: {
                minimum: 18,
                maximum: 65,
                mean: 35,
                median: 34,
                standardDeviation: 10,
                variance: 100,
                modes: [32],
              },
              quantileStats: {
                quartile1st: 28,
                quartile3rd: 45,
                interquartileRange: 17,
              },
              distributionAnalysis: {
                skewness: 0.1,
                kurtosis: 3.0,
              },
              outlierAnalysis: {
                iqrMethod: {
                  lowerOutliers: 0,
                  upperOutliers: 2,
                  lowerFence: 10,
                  upperFence: 70,
                },
                zScoreMethod: {
                  lowerOutliers: 0,
                  upperOutliers: 1,
                },
              },
              normalityTests: {
                shapiroWilk: { testStatistic: 0.99, pValue: 0.5, isNormal: true },
                jarqueBera: { testStatistic: 2, pValue: 0.4, isNormal: true },
              },
            } as any,
            {
              columnName: 'gender',
              detectedDataType: 'Categorical',
              inferredSemanticType: 'Gender',
              totalValues: 100,
              missingValues: 0,
              missingPercentage: 0,
              uniqueValues: 2,
              uniquePercentage: 2,
              uniqueCategories: 2,
              frequencyDistribution: [
                { label: 'M', count: 60, percentage: 60 },
                { label: 'F', count: 40, percentage: 40 },
              ],
            } as any,
          ],
          bivariateAnalysis: {},
        } as any;

        const v2Output = Section3Adapter.convertToV2(v1Input);

        expect(v2Output.columns).toHaveLength(2);
        expect(v2Output.numeric_stats).toHaveLength(1);
        expect(v2Output.categorical_stats).toHaveLength(1);
        expect(v2Output.dataset_summary.numeric_columns).toBe(1);
        expect(v2Output.dataset_summary.categorical_columns).toBe(1);
      });
    });

    describe('Edge Case Tests', () => {
      it('should handle empty univariate analysis', () => {
        const v1Input: Section3EdaAnalysis = {
          univariateAnalysis: [],
          bivariateAnalysis: {},
        } as any;

        const v2Output = Section3Adapter.convertToV2(v1Input);

        expect(v2Output.version).toBe('2.0');
        expect(v2Output.columns).toHaveLength(0);
        expect(v2Output.numeric_stats).toHaveLength(0);
        expect(v2Output.categorical_stats).toHaveLength(0);
        expect(v2Output.text_stats).toHaveLength(0);
      });

      it('should handle missing optional fields', () => {
        const v1Input: Section3EdaAnalysis = {
          univariateAnalysis: [
            {
              columnName: 'col1',
              detectedDataType: 'Numerical',
              totalValues: 100,
              missingValues: 0,
              missingPercentage: 0,
              uniqueValues: 50,
              uniquePercentage: 50,
              descriptiveStats: {
                minimum: 0,
                maximum: 100,
                mean: 50,
                median: 50,
                standardDeviation: 20,
                variance: 400,
                modes: [50],
              },
              quantileStats: {
                quartile1st: 30,
                quartile3rd: 70,
                interquartileRange: 40,
              },
              distributionAnalysis: {
                skewness: 0,
                kurtosis: 3,
              },
              outlierAnalysis: {
                iqrMethod: {
                  lowerOutliers: 0,
                  upperOutliers: 0,
                  lowerFence: 0,
                  upperFence: 100,
                },
                zScoreMethod: {
                  lowerOutliers: 0,
                  upperOutliers: 0,
                },
              },
              normalityTests: {
                shapiroWilk: { testStatistic: 0.99, pValue: 0.5, isNormal: true },
                jarqueBera: { testStatistic: 2, pValue: 0.4, isNormal: true },
              },
              // Missing numericalPatterns
            } as any,
          ],
          bivariateAnalysis: {},
        } as any;

        const v2Output = Section3Adapter.convertToV2(v1Input);

        expect(v2Output.numeric_stats[0].zeros).toBe(0);
        expect(v2Output.numeric_stats[0].negatives).toBe(0);
      });

      it('should handle missing bivariate analysis', () => {
        const v1Input: Section3EdaAnalysis = {
          univariateAnalysis: [
            {
              columnName: 'col1',
              detectedDataType: 'Numerical',
              totalValues: 100,
              missingValues: 0,
              missingPercentage: 0,
              uniqueValues: 50,
              uniquePercentage: 50,
              descriptiveStats: {
                minimum: 0,
                maximum: 100,
                mean: 50,
                median: 50,
                standardDeviation: 20,
                variance: 400,
                modes: [50],
              },
              quantileStats: {
                quartile1st: 30,
                quartile3rd: 70,
                interquartileRange: 40,
              },
              distributionAnalysis: {
                skewness: 0,
                kurtosis: 3,
              },
              outlierAnalysis: {
                iqrMethod: {
                  lowerOutliers: 0,
                  upperOutliers: 0,
                  lowerFence: 0,
                  upperFence: 100,
                },
                zScoreMethod: {
                  lowerOutliers: 0,
                  upperOutliers: 0,
                },
              },
              normalityTests: {
                shapiroWilk: { testStatistic: 0.99, pValue: 0.5, isNormal: true },
                jarqueBera: { testStatistic: 2, pValue: 0.4, isNormal: true },
              },
            } as any,
          ],
          bivariateAnalysis: undefined,
        } as any;

        const v2Output = Section3Adapter.convertToV2(v1Input);

        expect(v2Output.correlations.numeric_columns).toHaveLength(0);
        expect(v2Output.correlations.correlations).toHaveLength(0);
      });

      it('should handle extreme skewness and kurtosis', () => {
        const v1Input: Section3EdaAnalysis = {
          univariateAnalysis: [
            {
              columnName: 'extreme_skew',
              detectedDataType: 'Numerical',
              totalValues: 100,
              missingValues: 0,
              missingPercentage: 0,
              uniqueValues: 50,
              uniquePercentage: 50,
              descriptiveStats: {
                minimum: 0,
                maximum: 1000000,
                mean: 10000,
                median: 100,
                standardDeviation: 50000,
                variance: 2500000000,
                modes: [50],
              },
              quantileStats: {
                quartile1st: 50,
                quartile3rd: 200,
                interquartileRange: 150,
              },
              distributionAnalysis: {
                skewness: 15.5, // Extreme positive skew
                kurtosis: 250.0, // Extreme kurtosis
              },
              outlierAnalysis: {
                iqrMethod: {
                  lowerOutliers: 0,
                  upperOutliers: 25,
                  lowerFence: 0,
                  upperFence: 500,
                },
                zScoreMethod: {
                  lowerOutliers: 0,
                  upperOutliers: 30,
                },
              },
              normalityTests: {
                shapiroWilk: { testStatistic: 0.5, pValue: 0.001, isNormal: false },
                jarqueBera: { testStatistic: 1000, pValue: 0.0001, isNormal: false },
              },
            } as any,
          ],
          bivariateAnalysis: {},
        } as any;

        const v2Output = Section3Adapter.convertToV2(v1Input);

        const dist = v2Output.distributions[0];
        expect(dist.is_symmetric).toBe(false); // |skewness| > 0.5
        expect(dist.has_heavy_tails).toBe(true); // |kurtosis| > 3
      });

      it('should handle zero total values', () => {
        const v1Input: Section3EdaAnalysis = {
          univariateAnalysis: [
            {
              columnName: 'empty_col',
              detectedDataType: 'Numerical',
              totalValues: 0,
              missingValues: 0,
              missingPercentage: 0,
              uniqueValues: 0,
              uniquePercentage: 0,
              descriptiveStats: {
                minimum: 0,
                maximum: 0,
                mean: 0,
                median: 0,
                standardDeviation: 0,
                variance: 0,
                modes: [],
              },
              quantileStats: {
                quartile1st: 0,
                quartile3rd: 0,
                interquartileRange: 0,
              },
              distributionAnalysis: {
                skewness: 0,
                kurtosis: 0,
              },
              outlierAnalysis: {
                iqrMethod: {
                  lowerOutliers: 0,
                  upperOutliers: 0,
                  lowerFence: 0,
                  upperFence: 0,
                },
                zScoreMethod: {
                  lowerOutliers: 0,
                  upperOutliers: 0,
                },
              },
              normalityTests: {
                shapiroWilk: { testStatistic: 0, pValue: 0, isNormal: false },
                jarqueBera: { testStatistic: 0, pValue: 0, isNormal: false },
              },
              numericalPatterns: {
                zeroValuePercentage: 100,
                negativeValuePercentage: 0,
              },
            } as any,
          ],
          bivariateAnalysis: {},
        } as any;

        const v2Output = Section3Adapter.convertToV2(v1Input);

        expect(v2Output.columns[0].total).toBe(0);
        expect(v2Output.numeric_stats[0].zeros).toBe(0); // 100% of 0 = 0
      });

      it('should handle perfect correlations', () => {
        const v1Input: Section3EdaAnalysis = {
          univariateAnalysis: [],
          bivariateAnalysis: {
            numericalVsNumerical: {
              correlationMatrix: {
                variables: ['x', 'y', 'z'],
              },
              correlationPairs: [
                {
                  variable1: 'x',
                  variable2: 'y',
                  correlation: 1.0,
                  pValue: 0,
                  sampleSize: 100,
                },
                {
                  variable1: 'y',
                  variable2: 'z',
                  correlation: -1.0,
                  pValue: 0,
                  sampleSize: 100,
                },
                {
                  variable1: 'x',
                  variable2: 'z',
                  correlation: 0.0,
                  pValue: 1,
                  sampleSize: 100,
                },
              ],
            },
          },
        } as any;

        const v2Output = Section3Adapter.convertToV2(v1Input);

        expect(v2Output.correlations.strong_correlations).toHaveLength(2);
        expect(v2Output.correlations.moderate_correlations).toHaveLength(0);
        expect(v2Output.correlations.correlations).toHaveLength(3);
      });

      it('should handle moderate correlations', () => {
        const v1Input: Section3EdaAnalysis = {
          univariateAnalysis: [],
          bivariateAnalysis: {
            numericalVsNumerical: {
              correlationMatrix: {
                variables: ['a', 'b', 'c'],
              },
              correlationPairs: [
                {
                  variable1: 'a',
                  variable2: 'b',
                  correlation: 0.5,
                  pValue: 0.01,
                  sampleSize: 100,
                },
                {
                  variable1: 'b',
                  variable2: 'c',
                  correlation: 0.35,
                  pValue: 0.05,
                  sampleSize: 100,
                },
                {
                  variable1: 'a',
                  variable2: 'c',
                  correlation: 0.15,
                  pValue: 0.2,
                  sampleSize: 100,
                },
              ],
            },
          },
        } as any;

        const v2Output = Section3Adapter.convertToV2(v1Input);

        expect(v2Output.correlations.strong_correlations).toHaveLength(0);
        expect(v2Output.correlations.moderate_correlations).toHaveLength(2); // 0.5 and 0.35
      });
    });

    describe('Output Validation', () => {
      it('should always have version 2.0', () => {
        const v1Input: any = {
          univariateAnalysis: [],
          bivariateAnalysis: {},
        };

        const v2Output = Section3Adapter.convertToV2(v1Input);

        expect(v2Output.version).toBe('2.0');
      });

      it('should always have required fields defined', () => {
        const v1Input: any = {
          univariateAnalysis: [],
          bivariateAnalysis: {},
        };

        const v2Output = Section3Adapter.convertToV2(v1Input);

        expect(v2Output.columns).toBeDefined();
        expect(v2Output.numeric_stats).toBeDefined();
        expect(v2Output.categorical_stats).toBeDefined();
        expect(v2Output.text_stats).toBeDefined();
        expect(v2Output.outliers).toBeDefined();
        expect(v2Output.correlations).toBeDefined();
        expect(v2Output.distributions).toBeDefined();
        expect(v2Output.dataset_summary).toBeDefined();
      });

      it('should ensure arrays are always arrays not null', () => {
        const v1Input: any = {
          univariateAnalysis: [],
          bivariateAnalysis: {},
        };

        const v2Output = Section3Adapter.convertToV2(v1Input);

        expect(Array.isArray(v2Output.columns)).toBe(true);
        expect(Array.isArray(v2Output.numeric_stats)).toBe(true);
        expect(Array.isArray(v2Output.categorical_stats)).toBe(true);
        expect(Array.isArray(v2Output.text_stats)).toBe(true);
        expect(Array.isArray(v2Output.outliers)).toBe(true);
        expect(Array.isArray(v2Output.distributions)).toBe(true);
        expect(Array.isArray(v2Output.correlations.numeric_columns)).toBe(true);
        expect(Array.isArray(v2Output.correlations.correlations)).toBe(true);
      });

      it('should normalize data types correctly', () => {
        const v1Input: Section3EdaAnalysis = {
          univariateAnalysis: [
            {
              columnName: 'col1',
              detectedDataType: 'Numerical (Float)',
              totalValues: 100,
              missingValues: 0,
              missingPercentage: 0,
              uniqueValues: 50,
              uniquePercentage: 50,
              descriptiveStats: {
                minimum: 0,
                maximum: 100,
                mean: 50,
                median: 50,
                standardDeviation: 20,
                variance: 400,
                modes: [50],
              },
              quantileStats: {
                quartile1st: 30,
                quartile3rd: 70,
                interquartileRange: 40,
              },
              distributionAnalysis: {
                skewness: 0,
                kurtosis: 3,
              },
              outlierAnalysis: {
                iqrMethod: {
                  lowerOutliers: 0,
                  upperOutliers: 0,
                  lowerFence: 0,
                  upperFence: 100,
                },
                zScoreMethod: {
                  lowerOutliers: 0,
                  upperOutliers: 0,
                },
              },
              normalityTests: {
                shapiroWilk: { testStatistic: 0.99, pValue: 0.5, isNormal: true },
                jarqueBera: { testStatistic: 2, pValue: 0.4, isNormal: true },
              },
            } as any,
            {
              columnName: 'col2',
              detectedDataType: 'Categorical',
              totalValues: 100,
              missingValues: 0,
              missingPercentage: 0,
              uniqueValues: 5,
              uniquePercentage: 5,
              uniqueCategories: 5,
              frequencyDistribution: [
                { label: 'A', count: 20, percentage: 20 },
              ],
            } as any,
            {
              columnName: 'col3',
              detectedDataType: 'DateTime',
              totalValues: 100,
              missingValues: 0,
              missingPercentage: 0,
              uniqueValues: 100,
              uniquePercentage: 100,
            } as any,
          ],
          bivariateAnalysis: {},
        } as any;

        const v2Output = Section3Adapter.convertToV2(v1Input);

        expect(v2Output.columns[0].data_type).toBe('numeric');
        expect(v2Output.columns[1].data_type).toBe('categorical');
        expect(v2Output.columns[2].data_type).toBe('datetime');
      });

      it('should handle semantic type normalization', () => {
        const v1Input: Section3EdaAnalysis = {
          univariateAnalysis: [
            {
              columnName: 'col1',
              detectedDataType: 'Numerical',
              inferredSemanticType: 'AGE',
              totalValues: 100,
              missingValues: 0,
              missingPercentage: 0,
              uniqueValues: 50,
              uniquePercentage: 50,
              descriptiveStats: {
                minimum: 0,
                maximum: 100,
                mean: 50,
                median: 50,
                standardDeviation: 20,
                variance: 400,
                modes: [50],
              },
              quantileStats: {
                quartile1st: 30,
                quartile3rd: 70,
                interquartileRange: 40,
              },
              distributionAnalysis: {
                skewness: 0,
                kurtosis: 3,
              },
              outlierAnalysis: {
                iqrMethod: {
                  lowerOutliers: 0,
                  upperOutliers: 0,
                  lowerFence: 0,
                  upperFence: 100,
                },
                zScoreMethod: {
                  lowerOutliers: 0,
                  upperOutliers: 0,
                },
              },
              normalityTests: {
                shapiroWilk: { testStatistic: 0.99, pValue: 0.5, isNormal: true },
                jarqueBera: { testStatistic: 2, pValue: 0.4, isNormal: true },
              },
            } as any,
          ],
          bivariateAnalysis: {},
        } as any;

        const v2Output = Section3Adapter.convertToV2(v1Input);

        expect(v2Output.columns[0].semantic_type).toBe('age');
      });
    });
  });
});
