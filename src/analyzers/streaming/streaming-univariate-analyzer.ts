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
import {
  ShapiroWilkTest,
  JarqueBeraTest,
  KolmogorovSmirnovTest
} from './statistical-tests';
import type {
  BaseColumnProfile,
  NumericalColumnAnalysis,
  CategoricalColumnAnalysis,
  DateTimeAnalysis,
  BooleanAnalysis,
  TextColumnAnalysis,
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
  TextStatistics,
  TextPatterns,
  ColumnAnalysis,
  Section3Warning,
} from '../eda/types';
import { EdaDataType, SemanticType } from '../eda/types';

export interface StreamingColumnAnalyzer {
  processValue(value: string | number | null | undefined): void;
  finalize(): ColumnAnalysis;
  getWarnings(): Section3Warning[];
  clearMemory?(): void; // Optional method for memory cleanup
}

/**
 * Streaming Numerical Column Analyzer
 */
export class StreamingNumericalAnalyzer implements StreamingColumnAnalyzer {
  private stats = new OnlineStatistics();
  private quantiles: Map<number, P2Quantile>;
  private reservoir = new ReservoirSampler<number>(100); // Reduced from 1000
  private frequencies = new BoundedFrequencyCounter<number>(100); // Reduced from 1000
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

    // Get sample data for testing (from reservoir sampler)
    const sampleData = this.reservoir.getSample();
    
    if (sampleData.length < 3) {
      const insufficientSample = {
        statistic: 0,
        pValue: 1,
        interpretation: 'Insufficient sample data for normality testing',
      };
      return {
        shapiroWilk: insufficientSample,
        jarqueBera: insufficientSample,
        kolmogorovSmirnov: insufficientSample,
      };
    }

    // Use proper statistical tests from statistical-tests library
    const shapiroResult = ShapiroWilkTest.test(sampleData);
    const jarqueBeraResult = JarqueBeraTest.test(sampleData);
    const ksResult = KolmogorovSmirnovTest.test(sampleData);

    return {
      shapiroWilk: {
        statistic: shapiroResult.statistic,
        pValue: shapiroResult.pValue,
        interpretation: shapiroResult.interpretation,
      },
      jarqueBera: {
        statistic: jarqueBeraResult.statistic,
        pValue: jarqueBeraResult.pValue,
        interpretation: jarqueBeraResult.interpretation,
      },
      kolmogorovSmirnov: {
        statistic: ksResult.statistic,
        pValue: ksResult.pValue,
        interpretation: ksResult.interpretation,
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

  clearMemory(): void {
    // Clear reservoir sample to free memory
    this.reservoir = new ReservoirSampler<number>(100);
  }
}

/**
 * Streaming Categorical Column Analyzer
 */
export class StreamingCategoricalAnalyzer implements StreamingColumnAnalyzer {
  private frequencies = new BoundedFrequencyCounter<string>(500); // Reduced from 10000
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

/**
 * Streaming DateTime Column Analyzer
 */
export class StreamingDateTimeAnalyzer implements StreamingColumnAnalyzer {
  private warnings: Section3Warning[] = [];
  private totalValues = 0;
  private validValues = 0;
  private nullValues = 0;
  private dateValues: Date[] = [];
  private maxDateSamples = 50; // Strict limit
  private yearCounts = new BoundedFrequencyCounter<number>(50);
  private monthCounts = new BoundedFrequencyCounter<number>(12);
  private dayOfWeekCounts = new BoundedFrequencyCounter<number>(7);
  private hourCounts = new BoundedFrequencyCounter<number>(24);

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

    // Try to parse as date
    const dateValue = new Date(String(value));
    if (isNaN(dateValue.getTime())) {
      this.nullValues++;
      return;
    }

    this.validValues++;
    
    // Store a sample of dates (strict limit to prevent memory growth)
    if (this.dateValues.length < this.maxDateSamples) {
      this.dateValues.push(dateValue);
    }
    
    // Update frequency counters
    this.yearCounts.update(dateValue.getFullYear());
    this.monthCounts.update(dateValue.getMonth() + 1); // 1-based months
    this.dayOfWeekCounts.update(dateValue.getDay()); // 0=Sunday
    this.hourCounts.update(dateValue.getHours());
  }

  finalize(): DateTimeAnalysis {
    if (this.validValues === 0) {
      this.warnings.push({
        category: 'data',
        severity: 'high',
        message: `Column ${this.columnName} has no valid datetime values`,
        impact: 'Temporal analysis not possible',
        suggestion: 'Check data type detection or data quality',
      });
    }

    const baseProfile = this.createBaseProfile();
    
    // Calculate datetime-specific metrics
    const sortedDates = this.dateValues.sort((a, b) => a.getTime() - b.getTime());
    const minDateTime = sortedDates[0] || new Date();
    const maxDateTime = sortedDates[sortedDates.length - 1] || new Date();
    
    const timeSpan = this.calculateTimeSpan(minDateTime, maxDateTime);
    const detectedGranularity = this.detectGranularity();
    const mostCommonComponents = this.getMostCommonComponents();
    
    return {
      ...baseProfile,
      minDateTime,
      maxDateTime,
      timeSpan,
      detectedGranularity,
      implicitPrecision: this.detectPrecision(),
      mostCommonYears: mostCommonComponents.years,
      mostCommonMonths: mostCommonComponents.months,
      mostCommonDaysOfWeek: mostCommonComponents.daysOfWeek,
      mostCommonHours: mostCommonComponents.hours,
      temporalPatterns: this.analyzeTemporalPatterns(),
      gapAnalysis: this.analyzeGaps(),
      validityNotes: this.generateValidityNotes(),
    };
  }

  private createBaseProfile(): BaseColumnProfile {
    return {
      columnName: this.columnName,
      detectedDataType: this.detectedType,
      inferredSemanticType: this.semanticType,
      dataQualityFlag: this.validValues / this.totalValues > 0.95 ? 'Good' : 
                       this.validValues / this.totalValues > 0.8 ? 'Moderate' : 'Poor',
      totalValues: this.totalValues,
      missingValues: this.nullValues,
      missingPercentage: Number(((this.nullValues / this.totalValues) * 100).toFixed(2)),
      uniqueValues: this.dateValues.length,
      uniquePercentage: Number(((this.dateValues.length / this.validValues) * 100).toFixed(2)),
    };
  }

  private calculateTimeSpan(minDate: Date, maxDate: Date): string {
    const diffMs = maxDate.getTime() - minDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffYears = Math.floor(diffDays / 365);
    const diffMonths = Math.floor((diffDays % 365) / 30);
    const remainingDays = diffDays % 30;

    if (diffYears > 0) {
      return `${diffYears} years, ${diffMonths} months, ${remainingDays} days`;
    } else if (diffMonths > 0) {
      return `${diffMonths} months, ${remainingDays} days`;
    } else {
      return `${diffDays} days`;
    }
  }

  private detectGranularity(): string {
    // Analyze the precision of timestamps
    const hasSeconds = this.dateValues.some(d => d.getSeconds() !== 0);
    const hasMinutes = this.dateValues.some(d => d.getMinutes() !== 0);
    const hasHours = this.dateValues.some(d => d.getHours() !== 0);

    if (hasSeconds) return 'Second';
    if (hasMinutes) return 'Minute';
    if (hasHours) return 'Hour';
    return 'Day';
  }

  private detectPrecision(): string {
    return this.detectGranularity() + ' level precision detected';
  }

  private getMostCommonComponents() {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    return {
      years: this.yearCounts.getTopK(3).map(([year]) => String(year)),
      months: this.monthCounts.getTopK(3).map(([month]) => monthNames[month - 1]),
      daysOfWeek: this.dayOfWeekCounts.getTopK(3).map(([day]) => dayNames[day]),
      hours: this.hourCounts.getTopK(3).map(([hour]) => `${hour}:00`),
    };
  }

  private analyzeTemporalPatterns(): string {
    if (this.dateValues.length < 10) {
      return 'Insufficient data for temporal pattern analysis';
    }

    // Simple trend analysis
    const sortedDates = this.dateValues.sort((a, b) => a.getTime() - b.getTime());
    const intervals = [];
    for (let i = 1; i < sortedDates.length; i++) {
      intervals.push(sortedDates[i].getTime() - sortedDates[i-1].getTime());
    }

    const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    const avgDays = avgInterval / (1000 * 60 * 60 * 24);

    if (avgDays < 1) {
      return 'High frequency data (sub-daily intervals)';
    } else if (avgDays < 7) {
      return 'Daily to weekly patterns detected';
    } else if (avgDays < 32) {
      return 'Weekly to monthly patterns detected';
    } else {
      return 'Sparse temporal distribution (monthly+ intervals)';
    }
  }

  private analyzeGaps(): string {
    if (this.dateValues.length < 2) {
      return 'Insufficient data for gap analysis';
    }

    const sortedDates = this.dateValues.sort((a, b) => a.getTime() - b.getTime());
    const gaps = [];
    for (let i = 1; i < sortedDates.length; i++) {
      gaps.push(sortedDates[i].getTime() - sortedDates[i-1].getTime());
    }

    const maxGap = Math.max(...gaps);
    const maxGapDays = maxGap / (1000 * 60 * 60 * 24);

    return `Largest gap between consecutive records: ${Math.round(maxGapDays)} days`;
  }

  private generateValidityNotes(): string {
    const validityIssues = [];
    
    // Check for future dates
    const now = new Date();
    const futureDates = this.dateValues.filter(d => d > now).length;
    if (futureDates > 0) {
      validityIssues.push(`${futureDates} future dates detected`);
    }

    // Check for very old dates (before 1900)
    const cutoffDate = new Date('1900-01-01');
    const oldDates = this.dateValues.filter(d => d < cutoffDate).length;
    if (oldDates > 0) {
      validityIssues.push(`${oldDates} dates before 1900 detected`);
    }

    return validityIssues.length > 0 ? validityIssues.join('; ') : 'No obvious validity issues detected';
  }

  getWarnings(): Section3Warning[] {
    return [...this.warnings];
  }
}

/**
 * Streaming Boolean Column Analyzer
 */
export class StreamingBooleanAnalyzer implements StreamingColumnAnalyzer {
  private warnings: Section3Warning[] = [];
  private totalValues = 0;
  private trueCount = 0;
  private falseCount = 0;
  private nullValues = 0;

  constructor(
    private columnName: string,
    private detectedType: EdaDataType,
    private semanticType: SemanticType = SemanticType.STATUS
  ) {}

  processValue(value: string | number | null | undefined): void {
    this.totalValues++;

    if (value === null || value === undefined || value === '') {
      this.nullValues++;
      return;
    }

    const strValue = String(value).toLowerCase().trim();
    
    // Parse boolean-like values
    if (['true', 'yes', 'y', '1', 'on', 'enabled', 'active'].includes(strValue)) {
      this.trueCount++;
    } else if (['false', 'no', 'n', '0', 'off', 'disabled', 'inactive'].includes(strValue)) {
      this.falseCount++;
    } else {
      this.nullValues++;
    }
  }

  finalize(): BooleanAnalysis {
    const validValues = this.trueCount + this.falseCount;

    if (validValues === 0) {
      this.warnings.push({
        category: 'data',
        severity: 'high',
        message: `Column ${this.columnName} has no valid boolean values`,
        impact: 'Boolean analysis not possible',
        suggestion: 'Check data type detection or data quality',
      });
    }

    const baseProfile: BaseColumnProfile = {
      columnName: this.columnName,
      detectedDataType: this.detectedType,
      inferredSemanticType: this.semanticType,
      dataQualityFlag: validValues / this.totalValues > 0.95 ? 'Good' : 
                       validValues / this.totalValues > 0.8 ? 'Moderate' : 'Poor',
      totalValues: this.totalValues,
      missingValues: this.nullValues,
      missingPercentage: Number(((this.nullValues / this.totalValues) * 100).toFixed(2)),
      uniqueValues: validValues > 0 ? (this.trueCount > 0 && this.falseCount > 0 ? 2 : 1) : 0,
      uniquePercentage: Number(((validValues > 0 ? (this.trueCount > 0 && this.falseCount > 0 ? 2 : 1) : 0) / this.totalValues * 100).toFixed(2)),
    };

    const truePercentage = validValues > 0 ? Number(((this.trueCount / validValues) * 100).toFixed(2)) : 0;
    const falsePercentage = validValues > 0 ? Number(((this.falseCount / validValues) * 100).toFixed(2)) : 0;

    let interpretation = 'No valid boolean values';
    if (validValues > 0) {
      if (truePercentage > 75) {
        interpretation = 'Predominantly True';
      } else if (falsePercentage > 75) {
        interpretation = 'Predominantly False';
      } else {
        interpretation = 'Balanced distribution';
      }
    }

    return {
      ...baseProfile,
      trueCount: this.trueCount,
      falseCount: this.falseCount,
      truePercentage,
      falsePercentage,
      interpretation,
    };
  }

  getWarnings(): Section3Warning[] {
    return [...this.warnings];
  }
}

/**
 * Streaming Text Column Analyzer
 */
export class StreamingTextAnalyzer implements StreamingColumnAnalyzer {
  private warnings: Section3Warning[] = [];
  private totalValues = 0;
  private validValues = 0;
  private nullValues = 0;
  private charLengths: number[] = [];
  private wordCounts: number[] = [];
  private maxTextSamples = 100; // Strict limit
  private emptyStrings = 0;
  private numericTexts = 0;
  private urlCount = 0;
  private emailCount = 0;
  private wordFrequencies = new BoundedFrequencyCounter<string>(50); // Reduced from 1000

  constructor(
    private columnName: string,
    private detectedType: EdaDataType,
    private semanticType: SemanticType = SemanticType.UNKNOWN
  ) {}

  processValue(value: string | number | null | undefined): void {
    this.totalValues++;

    if (value === null || value === undefined) {
      this.nullValues++;
      return;
    }

    const strValue = String(value);
    
    if (strValue === '') {
      this.emptyStrings++;
      this.nullValues++;
      return;
    }

    this.validValues++;
    
    // Analyze text characteristics
    const charLength = strValue.length;
    const wordCount = strValue.trim().split(/\s+/).length;
    
    // Store samples for statistics (strict limit to prevent memory growth)
    if (this.charLengths.length < this.maxTextSamples) {
      this.charLengths.push(charLength);
      this.wordCounts.push(wordCount);
    }

    // Pattern detection
    if (/^\d+$/.test(strValue.trim())) {
      this.numericTexts++;
    }
    
    if (/^https?:\/\//.test(strValue)) {
      this.urlCount++;
    }
    
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(strValue)) {
      this.emailCount++;
    }

    // Word frequency analysis (for shorter texts)
    if (charLength < 500) {
      const words = strValue.toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 2); // Skip very short words
      
      words.forEach(word => this.wordFrequencies.update(word));
    }
  }

  finalize(): TextColumnAnalysis {
    if (this.validValues === 0) {
      this.warnings.push({
        category: 'data',
        severity: 'high',
        message: `Column ${this.columnName} has no valid text values`,
        impact: 'Text analysis not possible',
        suggestion: 'Check data type detection or data quality',
      });
    }

    const baseProfile = this.createBaseProfile();
    const textStatistics = this.getTextStatistics();
    const textPatterns = this.getTextPatterns();
    const topFrequentWords = this.getTopFrequentWords();

    return {
      ...baseProfile,
      textStatistics,
      textPatterns,
      topFrequentWords,
    };
  }

  private createBaseProfile(): BaseColumnProfile {
    return {
      columnName: this.columnName,
      detectedDataType: this.detectedType,
      inferredSemanticType: this.semanticType,
      dataQualityFlag: this.validValues / this.totalValues > 0.95 ? 'Good' : 
                       this.validValues / this.totalValues > 0.8 ? 'Moderate' : 'Poor',
      totalValues: this.totalValues,
      missingValues: this.nullValues,
      missingPercentage: Number(((this.nullValues / this.totalValues) * 100).toFixed(2)),
      uniqueValues: this.validValues, // Approximation
      uniquePercentage: Number(((this.validValues / this.totalValues) * 100).toFixed(2)),
    };
  }

  private getTextStatistics(): TextStatistics {
    if (this.charLengths.length === 0) {
      return {
        minCharLength: 0, maxCharLength: 0, avgCharLength: 0, medianCharLength: 0, stdCharLength: 0,
        minWordCount: 0, maxWordCount: 0, avgWordCount: 0,
      };
    }

    const sortedLengths = [...this.charLengths].sort((a, b) => a - b);
    const avgCharLength = this.charLengths.reduce((sum, len) => sum + len, 0) / this.charLengths.length;
    const avgWordCount = this.wordCounts.reduce((sum, count) => sum + count, 0) / this.wordCounts.length;
    
    // Calculate standard deviation
    const variance = this.charLengths.reduce((sum, len) => sum + Math.pow(len - avgCharLength, 2), 0) / this.charLengths.length;
    const stdCharLength = Math.sqrt(variance);

    return {
      minCharLength: Math.min(...this.charLengths),
      maxCharLength: Math.max(...this.charLengths),
      avgCharLength: Number(avgCharLength.toFixed(2)),
      medianCharLength: sortedLengths[Math.floor(sortedLengths.length / 2)],
      stdCharLength: Number(stdCharLength.toFixed(2)),
      minWordCount: Math.min(...this.wordCounts),
      maxWordCount: Math.max(...this.wordCounts),
      avgWordCount: Number(avgWordCount.toFixed(2)),
    };
  }

  private getTextPatterns(): TextPatterns {
    const emptyStringPercentage = Number(((this.emptyStrings / this.totalValues) * 100).toFixed(2));
    const numericTextPercentage = Number(((this.numericTexts / this.validValues) * 100).toFixed(2));
    const urlPercentage = Number(((this.urlCount / this.validValues) * 100).toFixed(2));
    const emailPercentage = Number(((this.emailCount / this.validValues) * 100).toFixed(2));

    return {
      emptyStringPercentage,
      numericTextPercentage,
      urlCount: this.urlCount,
      emailCount: this.emailCount,
      urlPercentage,
      emailPercentage,
    };
  }

  private getTopFrequentWords(): string[] {
    return this.wordFrequencies.getTopK(5).map(([word]) => word);
  }

  getWarnings(): Section3Warning[] {
    return [...this.warnings];
  }
}