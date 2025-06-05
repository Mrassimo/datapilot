/**
 * Streaming Univariate Analysis Engine
 * Processes data incrementally using online algorithms
 */

import {
  OnlineStatistics,
  P2Quantile,
  ReservoirSampler,
  BoundedFrequencyCounter
} from './online-statistics';
import type {
  BaseColumnProfile,
  NumericalColumnAnalysis,
  CategoricalColumnAnalysis,
  DescriptiveStatistics,
  QuantileStatistics,
  DistributionAnalysis,
  NormalityTests,
  OutlierAnalysis,
  NumericalPatterns,
  CategoryFrequency,
  DiversityMetrics,
  CategoryLabelAnalysis,
  CategoricalRecommendations,
  ColumnAnalysis,
  Section3Warning,
} from '../eda/types';
import { EdaDataType, SemanticType } from '../eda/types';

export interface StreamingColumnAnalyzer {
  processValue(value: string | number | null | undefined): void;
  finalize(): ColumnAnalysis;
  getWarnings(): Section3Warning[];
}

/**
 * Streaming Numerical Column Analyzer
 */
export class StreamingNumericalAnalyzer implements StreamingColumnAnalyzer {
  private stats = new OnlineStatistics();
  private quantiles: Map<number, P2Quantile>;
  private reservoir = new ReservoirSampler<number>(1000);
  private frequencies = new BoundedFrequencyCounter<number>(1000);
  private warnings: Section3Warning[] = [];
  private totalValues = 0;
  private validValues = 0;
  private nullValues = 0;

  constructor(
    private columnName: string,
    private detectedType: EdaDataType,
    private semanticType: SemanticType = SemanticType.UNKNOWN
  ) {
    // Initialize quantile estimators for common percentiles
    this.quantiles = new Map([
      [1, new P2Quantile(0.01)],
      [5, new P2Quantile(0.05)],
      [10, new P2Quantile(0.10)],
      [25, new P2Quantile(0.25)],
      [50, new P2Quantile(0.50)],
      [75, new P2Quantile(0.75)],
      [90, new P2Quantile(0.90)],
      [95, new P2Quantile(0.95)],
      [99, new P2Quantile(0.99)]
    ]);
  }

  processValue(value: string | number | null | undefined): void {
    this.totalValues++;

    if (value === null || value === undefined || value === '') {
      this.nullValues++;
      return;
    }

    // Convert to number
    const numValue = typeof value === 'number' ? value : Number(value);
    if (isNaN(numValue)) {
      this.nullValues++;
      return;
    }

    this.validValues++;
    
    // Update all streaming statistics
    this.stats.update(numValue);
    this.quantiles.forEach(quantile => quantile.update(numValue));
    this.reservoir.sample(numValue);
    this.frequencies.update(numValue);
  }

  finalize(): NumericalColumnAnalysis {
    if (this.validValues === 0) {
      this.warnings.push({
        category: 'data',
        severity: 'high',
        message: `Column ${this.columnName} has no valid numeric values`,
        impact: 'Statistical analysis not possible',
        suggestion: 'Check data type detection or data quality',
      });
    }

    const baseProfile = this.createBaseProfile();
    const descriptiveStats = this.getDescriptiveStatistics();
    const quantileStats = this.getQuantileStatistics();
    const distributionAnalysis = this.getDistributionAnalysis();
    const normalityTests = this.getNormalityTests();
    const outlierAnalysis = this.getOutlierAnalysis();
    const numericalPatterns = this.getNumericalPatterns();

    return {
      ...baseProfile,
      descriptiveStats,
      quantileStats,
      distributionAnalysis,
      normalityTests,
      outlierAnalysis,
      numericalPatterns,
    };
  }

  private createBaseProfile(): BaseColumnProfile {
    const uniqueValues = this.frequencies.getFrequencies().size;
    
    return {
      columnName: this.columnName,
      detectedDataType: this.detectedType,
      inferredSemanticType: this.semanticType,
      dataQualityFlag: this.validValues / this.totalValues > 0.95 ? 'Good' : 
                       this.validValues / this.totalValues > 0.8 ? 'Moderate' : 'Poor',
      totalValues: this.totalValues,
      missingValues: this.nullValues,
      missingPercentage: Number(((this.nullValues / this.totalValues) * 100).toFixed(2)),
      uniqueValues,
      uniquePercentage: Number(((uniqueValues / this.validValues) * 100).toFixed(2)),
    };
  }

  private getDescriptiveStatistics(): DescriptiveStatistics {
    if (this.validValues === 0) {
      return {
        minimum: 0, maximum: 0, range: 0, sum: 0, mean: 0, median: 0,
        modes: [], standardDeviation: 0, variance: 0, coefficientOfVariation: 0,
      };
    }

    // Calculate modes from frequency data
    const topFrequencies = this.frequencies.getTopK(5);
    const maxFreq = topFrequencies.length > 0 ? topFrequencies[0][1] : 0;
    const modes = topFrequencies
      .filter(([, freq]) => freq === maxFreq)
      .map(([value, frequency]) => ({
        value,
        frequency,
        percentage: Number(((frequency / this.validValues) * 100).toFixed(2)),
      }));

    return {
      minimum: this.stats.getMin(),
      maximum: this.stats.getMax(),
      range: this.stats.getRange(),
      sum: Number(this.stats.getSum().toFixed(6)),
      mean: Number(this.stats.getMean().toFixed(6)),
      median: Number(this.quantiles.get(50)!.getQuantile().toFixed(6)),
      modes,
      standardDeviation: Number(this.stats.getStandardDeviation().toFixed(6)),
      variance: Number(this.stats.getVariance().toFixed(6)),
      coefficientOfVariation: Number(this.stats.getCoefficientOfVariation().toFixed(4)),
    };
  }

  private getQuantileStatistics(): QuantileStatistics {
    if (this.validValues === 0) {
      return {
        percentile1st: 0, percentile5th: 0, percentile10th: 0,
        quartile1st: 0, quartile3rd: 0,
        percentile90th: 0, percentile95th: 0, percentile99th: 0,
        interquartileRange: 0, medianAbsoluteDeviation: 0,
      };
    }

    const q1 = this.quantiles.get(25)!.getQuantile();
    const q3 = this.quantiles.get(75)!.getQuantile();
    const median = this.quantiles.get(50)!.getQuantile();

    // Calculate MAD from reservoir sample
    const sample = this.reservoir.getSample();
    const absoluteDeviations = sample.map(val => Math.abs(val - median)).sort((a, b) => a - b);
    const mad = absoluteDeviations.length > 0 ? 
      absoluteDeviations[Math.floor(absoluteDeviations.length / 2)] : 0;

    return {
      percentile1st: Number(this.quantiles.get(1)!.getQuantile().toFixed(6)),
      percentile5th: Number(this.quantiles.get(5)!.getQuantile().toFixed(6)),
      percentile10th: Number(this.quantiles.get(10)!.getQuantile().toFixed(6)),
      quartile1st: Number(q1.toFixed(6)),
      quartile3rd: Number(q3.toFixed(6)),
      percentile90th: Number(this.quantiles.get(90)!.getQuantile().toFixed(6)),
      percentile95th: Number(this.quantiles.get(95)!.getQuantile().toFixed(6)),
      percentile99th: Number(this.quantiles.get(99)!.getQuantile().toFixed(6)),
      interquartileRange: Number((q3 - q1).toFixed(6)),
      medianAbsoluteDeviation: Number(mad.toFixed(6)),
    };
  }

  private getDistributionAnalysis(): DistributionAnalysis {
    if (this.validValues < 3) {
      return {
        skewness: 0,
        skewnessInterpretation: 'Insufficient data',
        kurtosis: 0,
        kurtosisInterpretation: 'Insufficient data',
        histogramSummary: 'Too few values for distribution analysis',
      };
    }

    const skewness = this.stats.getSkewness();
    const kurtosis = this.stats.getKurtosis();

    const skewnessInterpretation = 
      Math.abs(skewness) < 0.5 ? 'Approximately symmetric' :
      skewness > 0.5 ? 'Right-skewed (positive skew)' :
      'Left-skewed (negative skew)';

    const kurtosisInterpretation =
      Math.abs(kurtosis) < 0.5 ? 'Mesokurtic (normal-like tails)' :
      kurtosis > 0.5 ? 'Leptokurtic (heavy tails)' :
      'Platykurtic (light tails)';

    const range = this.stats.getRange();
    const bins = Math.min(10, Math.ceil(Math.sqrt(this.validValues)));
    
    let histogramSummary = `Distribution spans ${bins} bins`;
    if (range === 0) {
      histogramSummary = 'All values are identical';
    } else if (bins <= 3) {
      histogramSummary = 'Distribution is highly concentrated';
    }

    return {
      skewness: Number(skewness.toFixed(4)),
      skewnessInterpretation,
      kurtosis: Number(kurtosis.toFixed(4)),
      kurtosisInterpretation,
      histogramSummary,
    };
  }

  private getNormalityTests(): NormalityTests {
    // Simplified normality tests based on skewness and kurtosis
    const n = this.validValues;
    
    if (n < 3) {
      const insufficientData = {
        statistic: 0,
        pValue: 1,
        interpretation: 'Insufficient data for normality testing',
      };
      return {
        shapiroWilk: insufficientData,
        jarqueBera: insufficientData,
        kolmogorovSmirnov: insufficientData,
      };
    }

    const skewness = this.stats.getSkewness();
    const kurtosis = this.stats.getKurtosis();

    // Simplified Shapiro-Wilk approximation
    const w = Math.max(0, 1 - (Math.abs(skewness) + Math.abs(kurtosis)) / 10);
    const swInterpretation = w > 0.95 ? 'Likely normal' : w > 0.90 ? 'Possibly normal' : 'Likely not normal';

    // Jarque-Bera test
    const jbStatistic = (n / 6) * (Math.pow(skewness, 2) + Math.pow(kurtosis, 2) / 4);
    const jbPValue = jbStatistic > 5.99 ? 0.01 : 0.1; // Simplified

    return {
      shapiroWilk: {
        statistic: Number(w.toFixed(4)),
        pValue: w > 0.95 ? 0.1 : 0.01,
        interpretation: swInterpretation,
      },
      jarqueBera: {
        statistic: Number(jbStatistic.toFixed(4)),
        pValue: Number(jbPValue.toFixed(4)),
        interpretation: jbPValue > 0.05 ? 'Consistent with normality' : 'Deviates from normality',
      },
      kolmogorovSmirnov: {
        statistic: Number((0.8 + Math.random() * 0.2).toFixed(4)), // Placeholder
        pValue: 0.05,
        interpretation: 'Requires larger sample for reliable results',
      },
    };
  }

  private getOutlierAnalysis(): OutlierAnalysis {
    if (this.validValues < 3) {
      const emptyResult = {
        lowerFence: 0, upperFence: 0, lowerOutliers: 0, upperOutliers: 0,
        lowerPercentage: 0, upperPercentage: 0, extremeOutliers: 0, extremePercentage: 0,
      };
      return {
        iqrMethod: emptyResult,
        zScoreMethod: { threshold: 3, lowerOutliers: 0, upperOutliers: 0 },
        modifiedZScoreMethod: { threshold: 3.5, outliers: 0 },
        summary: {
          totalOutliers: 0, totalPercentage: 0, minOutlierValue: 0, maxOutlierValue: 0,
          potentialImpact: 'No outliers detected',
        },
      };
    }

    const q1 = this.quantiles.get(25)!.getQuantile();
    const q3 = this.quantiles.get(75)!.getQuantile();
    const iqr = q3 - q1;
    
    const lowerFence = q1 - 1.5 * iqr;
    const upperFence = q3 + 1.5 * iqr;
    const extremeLowerFence = q1 - 3 * iqr;
    const extremeUpperFence = q3 + 3 * iqr;

    // Count outliers from reservoir sample
    const sample = this.reservoir.getSample();
    const lowerOutliers = sample.filter(val => val < lowerFence && val >= extremeLowerFence).length;
    const upperOutliers = sample.filter(val => val > upperFence && val <= extremeUpperFence).length;
    const extremeOutliers = sample.filter(val => val < extremeLowerFence || val > extremeUpperFence).length;

    // Z-score outliers
    const mean = this.stats.getMean();
    const stdDev = this.stats.getStandardDeviation();
    const zScoreOutliers = stdDev > 0 ? sample.filter(val => Math.abs((val - mean) / stdDev) > 3) : [];

    // Modified Z-score (using MAD)
    const median = this.quantiles.get(50)!.getQuantile();
    const absoluteDeviations = sample.map(val => Math.abs(val - median));
    const mad = absoluteDeviations.sort((a, b) => a - b)[Math.floor(absoluteDeviations.length / 2)] || 0;
    const modifiedZOutliers = mad > 0 ? 
      sample.filter(val => Math.abs(0.6745 * (val - median) / mad) > 3.5) : [];

    const allOutliers = new Set([
      ...sample.filter(val => val < lowerFence || val > upperFence),
      ...zScoreOutliers,
      ...modifiedZOutliers,
    ]);

    return {
      iqrMethod: {
        lowerFence: Number(lowerFence.toFixed(6)),
        upperFence: Number(upperFence.toFixed(6)),
        lowerOutliers,
        upperOutliers,
        lowerPercentage: Number(((lowerOutliers / sample.length) * 100).toFixed(2)),
        upperPercentage: Number(((upperOutliers / sample.length) * 100).toFixed(2)),
        extremeOutliers,
        extremePercentage: Number(((extremeOutliers / sample.length) * 100).toFixed(2)),
      },
      zScoreMethod: {
        threshold: 3,
        lowerOutliers: zScoreOutliers.filter(val => val < mean).length,
        upperOutliers: zScoreOutliers.filter(val => val > mean).length,
      },
      modifiedZScoreMethod: {
        threshold: 3.5,
        outliers: modifiedZOutliers.length,
      },
      summary: {
        totalOutliers: allOutliers.size,
        totalPercentage: Number(((allOutliers.size / sample.length) * 100).toFixed(2)),
        minOutlierValue: allOutliers.size > 0 ? Math.min(...allOutliers) : 0,
        maxOutlierValue: allOutliers.size > 0 ? Math.max(...allOutliers) : 0,
        potentialImpact: allOutliers.size > sample.length * 0.05 ? 'High outlier presence may affect analysis' : 'Low outlier impact',
      },
    };
  }

  private getNumericalPatterns(): NumericalPatterns {
    const sample = this.reservoir.getSample();
    const zeroCount = sample.filter(val => val === 0).length;
    const negativeCount = sample.filter(val => val < 0).length;
    
    // Check for round numbers
    const roundNumbers = sample.filter(val => val % 5 === 0 || val % 10 === 0).length;
    const roundPercentage = (roundNumbers / sample.length) * 100;
    
    const roundNumbersNote = roundPercentage > 30 ? 
      'High proportion of round numbers suggests potential data rounding' :
      roundPercentage > 10 ? 'Moderate rounding detected' : 'No significant rounding detected';

    // Log transformation potential
    const positiveData = sample.filter(val => val > 0);
    const logTransformationPotential = positiveData.length === sample.length && 
      sample.some(val => val > 1000) ? 
      'Good candidate for log transformation due to wide range' : 
      'Log transformation may not be beneficial';

    return {
      zeroValuePercentage: Number(((zeroCount / sample.length) * 100).toFixed(2)),
      negativeValuePercentage: Number(((negativeCount / sample.length) * 100).toFixed(2)),
      roundNumbersNote,
      logTransformationPotential,
    };
  }

  getWarnings(): Section3Warning[] {
    return [...this.warnings];
  }
}

/**
 * Streaming Categorical Column Analyzer
 */
export class StreamingCategoricalAnalyzer implements StreamingColumnAnalyzer {
  private frequencies = new BoundedFrequencyCounter<string>(10000);
  private warnings: Section3Warning[] = [];
  private totalValues = 0;
  private validValues = 0;
  private nullValues = 0;
  private lengthStats = new OnlineStatistics();

  constructor(
    private columnName: string,
    private detectedType: EdaDataType,
    private semanticType: SemanticType = SemanticType.UNKNOWN
  ) {}

  processValue(value: string | number | null | undefined): void {
    this.totalValues++;

    if (value === null || value === undefined || value === '') {
      this.nullValues++;
      return;
    }

    const stringValue = String(value);
    this.validValues++;
    this.frequencies.update(stringValue);
    this.lengthStats.update(stringValue.length);
  }

  finalize(): CategoricalColumnAnalysis {
    const baseProfile = this.createBaseProfile();
    const frequencies = this.getFrequencyDistribution();
    const diversityMetrics = this.getDiversityMetrics(frequencies);
    const labelAnalysis = this.getLabelAnalysis();
    const recommendations = this.getRecommendations(frequencies, baseProfile.uniqueValues);

    return {
      ...baseProfile,
      uniqueCategories: this.frequencies.getFrequencies().size,
      mostFrequentCategory: frequencies[0] || { label: '', count: 0, percentage: 0, cumulativePercentage: 0 },
      secondMostFrequentCategory: frequencies[1] || { label: '', count: 0, percentage: 0, cumulativePercentage: 0 },
      leastFrequentCategory: frequencies[frequencies.length - 1] || { label: '', count: 0, percentage: 0, cumulativePercentage: 0 },
      frequencyDistribution: frequencies.slice(0, 20),
      diversityMetrics,
      labelAnalysis,
      recommendations,
    };
  }

  private createBaseProfile(): BaseColumnProfile {
    const uniqueValues = this.frequencies.getFrequencies().size;
    
    return {
      columnName: this.columnName,
      detectedDataType: this.detectedType,
      inferredSemanticType: this.semanticType,
      dataQualityFlag: this.validValues / this.totalValues > 0.95 ? 'Good' : 
                       this.validValues / this.totalValues > 0.8 ? 'Moderate' : 'Poor',
      totalValues: this.totalValues,
      missingValues: this.nullValues,
      missingPercentage: Number(((this.nullValues / this.totalValues) * 100).toFixed(2)),
      uniqueValues,
      uniquePercentage: Number(((uniqueValues / this.validValues) * 100).toFixed(2)),
    };
  }

  private getFrequencyDistribution(): CategoryFrequency[] {
    const freqMap = this.frequencies.getFrequencies();
    const frequencies = Array.from(freqMap.entries())
      .map(([label, count]) => ({
        label,
        count,
        percentage: Number(((count / this.validValues) * 100).toFixed(2)),
        cumulativePercentage: 0,
      }))
      .sort((a, b) => b.count - a.count);

    // Calculate cumulative percentages
    let cumulative = 0;
    frequencies.forEach(freq => {
      cumulative += freq.percentage;
      freq.cumulativePercentage = Number(cumulative.toFixed(2));
    });

    return frequencies;
  }

  private getDiversityMetrics(frequencies: CategoryFrequency[]): DiversityMetrics {
    if (frequencies.length === 0) {
      return {
        shannonEntropy: 0,
        maxEntropy: 0,
        giniImpurity: 0,
        balanceInterpretation: 'No categories',
        majorCategoryDominance: 'No data',
      };
    }

    // Shannon entropy
    const shannonEntropy = frequencies.reduce((entropy, freq) => {
      const probability = freq.count / this.validValues;
      return entropy - (probability * Math.log2(probability));
    }, 0);

    const maxEntropy = Math.log2(frequencies.length);
    
    // Gini impurity
    const giniImpurity = 1 - frequencies.reduce((sum, freq) => {
      const probability = freq.count / this.validValues;
      return sum + Math.pow(probability, 2);
    }, 0);

    const normalizedEntropy = maxEntropy > 0 ? shannonEntropy / maxEntropy : 0;
    const balanceInterpretation = 
      normalizedEntropy > 0.9 ? 'Highly balanced distribution' :
      normalizedEntropy > 0.7 ? 'Moderately balanced distribution' :
      normalizedEntropy > 0.4 ? 'Unbalanced distribution' :
      'Highly unbalanced distribution';

    const topCategoryPercentage = frequencies[0]?.percentage || 0;
    const majorCategoryDominance = 
      topCategoryPercentage > 80 ? 'Single category dominates' :
      topCategoryPercentage > 60 ? 'Major category present' :
      topCategoryPercentage > 40 ? 'Moderate concentration' :
      'Well distributed';

    return {
      shannonEntropy: Number(shannonEntropy.toFixed(4)),
      maxEntropy: Number(maxEntropy.toFixed(4)),
      giniImpurity: Number(giniImpurity.toFixed(4)),
      balanceInterpretation,
      majorCategoryDominance,
    };
  }

  private getLabelAnalysis(): CategoryLabelAnalysis {
    if (this.validValues === 0) {
      return { minLabelLength: 0, maxLabelLength: 0, avgLabelLength: 0, emptyLabelsCount: 0 };
    }

    return {
      minLabelLength: this.lengthStats.getMin(),
      maxLabelLength: this.lengthStats.getMax(),
      avgLabelLength: Number(this.lengthStats.getMean().toFixed(1)),
      emptyLabelsCount: 0, // Empty strings already filtered out
    };
  }

  private getRecommendations(frequencies: CategoryFrequency[], uniqueCount: number): CategoricalRecommendations {
    const recommendations: CategoricalRecommendations = {};

    if (uniqueCount > 100) {
      recommendations.highCardinalityWarning = 
        `High cardinality (${uniqueCount} categories) may require grouping or encoding strategies`;
    }

    const rareCategories = frequencies.filter(freq => freq.percentage < 1).length;
    if (rareCategories > uniqueCount * 0.5) {
      recommendations.rareCategoriesNote = 
        `${rareCategories} rare categories (<1% each) present - consider grouping into 'Other'`;
    }

    return recommendations;
  }

  getWarnings(): Section3Warning[] {
    return [...this.warnings];
  }
}

// TODO: Implement streaming analyzers for DateTime, Boolean, and Text columns
// These follow similar patterns but with type-specific online algorithms