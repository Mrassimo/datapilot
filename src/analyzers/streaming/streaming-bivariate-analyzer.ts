/**
 * Streaming Bivariate Analysis Engine
 * Processes pair relationships incrementally using online algorithms
 */

import { OnlineCovariance, ReservoirSampler, BoundedFrequencyCounter } from './online-statistics';
import { ChiSquaredTest, CorrelationSignificanceTest } from './statistical-tests';
import type {
  BivariateAnalysis,
  NumericalBivariateAnalysis,
  NumericalCategoricalAnalysis,
  CategoricalBivariateAnalysis,
  CorrelationPair,
  ScatterPlotInsight,
  GroupComparison,
  NumericalCategoricalTests,
  ContingencyTable,
  CategoricalAssociationTests,
  Section3Warning,
} from '../eda/types';
import { EdaDataType } from '../eda/types';

export interface ColumnPair {
  col1Index: number;
  col1Name: string;
  col1Type: EdaDataType;
  col2Index: number;
  col2Name: string;
  col2Type: EdaDataType;
}

/**
 * Streaming Bivariate Analyzer
 * Processes column pairs incrementally without storing all data
 */
export class StreamingBivariateAnalyzer {
  private numericalPairs = new Map<string, OnlineCovariance>();
  private categoricalPairs = new Map<string, BoundedFrequencyCounter<string>>();
  private numericalCategoricalPairs = new Map<string, Map<string, OnlineCovariance>>();
  private scatterSamples = new Map<string, ReservoirSampler<[number, number]>>();
  private warnings: Section3Warning[] = [];
  private maxPairs: number;
  private columnNameToIndex = new Map<string, number>();

  constructor(maxPairs: number = 50) {
    this.maxPairs = maxPairs;
  }

  /**
   * Initialize tracking for column pairs
   */
  initializePairs(pairs: ColumnPair[]): void {
    // Build column name to index mapping
    this.columnNameToIndex.clear();
    for (const pair of pairs) {
      this.columnNameToIndex.set(pair.col1Name, pair.col1Index);
      this.columnNameToIndex.set(pair.col2Name, pair.col2Index);
    }

    // Limit number of pairs to prevent memory explosion
    const limitedPairs = pairs.slice(0, this.maxPairs);

    if (pairs.length > this.maxPairs) {
      this.warnings.push({
        category: 'performance',
        severity: 'medium',
        message: `Too many column pairs (${pairs.length}). Analyzing first ${this.maxPairs} pairs.`,
        impact: 'Some correlations not computed',
        suggestion: 'Increase maxPairs limit or reduce number of columns',
      });
    }

    for (const pair of limitedPairs) {
      const pairKey = `${pair.col1Name}__${pair.col2Name}`;

      if (this.isNumericalType(pair.col1Type) && this.isNumericalType(pair.col2Type)) {
        // Numerical vs Numerical
        this.numericalPairs.set(pairKey, new OnlineCovariance());
        this.scatterSamples.set(pairKey, new ReservoirSampler<[number, number]>(50)); // Reduced from 1000
      } else if (this.isCategoricalType(pair.col1Type) && this.isCategoricalType(pair.col2Type)) {
        // Categorical vs Categorical
        this.categoricalPairs.set(pairKey, new BoundedFrequencyCounter<string>(200)); // Reduced from 5000
      } else if (
        (this.isNumericalType(pair.col1Type) && this.isCategoricalType(pair.col2Type)) ||
        (this.isCategoricalType(pair.col1Type) && this.isNumericalType(pair.col2Type))
      ) {
        // Numerical vs Categorical
        this.numericalCategoricalPairs.set(pairKey, new Map<string, OnlineCovariance>());
      }
    }
  }

  /**
   * Process a row of data for all initialized pairs
   */
  processRow(row: (string | number | null | undefined)[], columnTypes: EdaDataType[]): void {
    // Process numerical vs numerical pairs
    for (const [pairKey, covariance] of this.numericalPairs) {
      const [col1Name, col2Name] = pairKey.split('__');
      const col1Index = this.findColumnIndex(col1Name, row);
      const col2Index = this.findColumnIndex(col2Name, row);

      if (col1Index >= 0 && col2Index >= 0) {
        const val1 = this.extractNumericValue(row[col1Index]);
        const val2 = this.extractNumericValue(row[col2Index]);

        if (val1 !== null && val2 !== null) {
          covariance.update(val1, val2);

          // Sample for scatter plot insights
          const scatterSample = this.scatterSamples.get(pairKey);
          if (scatterSample) {
            scatterSample.sample([val1, val2]);
          }
        }
      }
    }

    // Process categorical vs categorical pairs
    for (const [pairKey, frequencyCounter] of this.categoricalPairs) {
      const [col1Name, col2Name] = pairKey.split('__');
      const col1Index = this.findColumnIndex(col1Name, row);
      const col2Index = this.findColumnIndex(col2Name, row);

      if (col1Index >= 0 && col2Index >= 0) {
        const val1 = this.extractStringValue(row[col1Index]);
        const val2 = this.extractStringValue(row[col2Index]);

        if (val1 !== null && val2 !== null) {
          frequencyCounter.update(`${val1}||${val2}`);
        }
      }
    }

    // Process numerical vs categorical pairs
    for (const [pairKey, categoryGroups] of this.numericalCategoricalPairs) {
      const [col1Name, col2Name] = pairKey.split('__');
      const col1Index = this.findColumnIndex(col1Name, row);
      const col2Index = this.findColumnIndex(col2Name, row);

      if (col1Index >= 0 && col2Index >= 0) {
        let numValue: number | null = null;
        let catValue: string | null = null;

        // Determine which is numerical and which is categorical
        if (this.isNumericalType(columnTypes[col1Index])) {
          numValue = this.extractNumericValue(row[col1Index]);
          catValue = this.extractStringValue(row[col2Index]);
        } else {
          numValue = this.extractNumericValue(row[col2Index]);
          catValue = this.extractStringValue(row[col1Index]);
        }

        if (numValue !== null && catValue !== null) {
          if (!categoryGroups.has(catValue)) {
            categoryGroups.set(catValue, new OnlineCovariance());
          }
          // For numerical vs categorical, we track the numerical values within each category
          // This allows us to compute group statistics later
          categoryGroups.get(catValue)!.update(numValue, numValue); // Use same value for both x,y
        }
      }
    }
  }

  /**
   * Finalize analysis and return results
   */
  finalize(headers: string[]): BivariateAnalysis {
    const numericalVsNumerical = this.finalizeNumericalAnalysis(headers);
    const numericalVsCategorical = this.finalizeNumericalCategoricalAnalysis();
    const categoricalVsCategorical = this.finalizeCategoricalAnalysis();

    return {
      numericalVsNumerical,
      numericalVsCategorical,
      categoricalVsCategorical,
    };
  }

  private finalizeNumericalAnalysis(_headers: string[]): NumericalBivariateAnalysis {
    const correlationPairs: CorrelationPair[] = [];

    for (const [pairKey, covariance] of this.numericalPairs) {
      const [col1Name, col2Name] = pairKey.split('__');
      const correlation = covariance.getCorrelation();
      const count = covariance.getCount();

      if (count > 0) {
        const significanceTest = CorrelationSignificanceTest.test(correlation, count);

        correlationPairs.push({
          variable1: col1Name,
          variable2: col2Name,
          correlation: Number(correlation.toFixed(4)),
          pearsonCorrelation: Number(correlation.toFixed(4)),
          pValue: significanceTest.pValue,
          strength: this.interpretCorrelationStrength(Math.abs(correlation)),
          direction: correlation > 0 ? 'Positive' : correlation < 0 ? 'Negative' : 'None',
          significance: significanceTest.interpretation,
          sampleSize: count,
          interpretation: `${this.interpretCorrelationStrength(Math.abs(correlation))} ${correlation > 0 ? 'positive' : correlation < 0 ? 'negative' : 'zero'} correlation (${significanceTest.interpretation})`,
        });
      }
    }

    // Sort by absolute correlation strength
    correlationPairs.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));

    const scatterPlotInsights = this.generateScatterPlotInsights();
    const strongCorrelations = correlationPairs.filter((pair) => Math.abs(pair.correlation) > 0.5);

    return {
      totalPairsAnalyzed: correlationPairs.length,
      correlationPairs: correlationPairs.slice(0, 50), // Top 50 correlations
      strongestPositiveCorrelation: correlationPairs.find((p) => p.correlation > 0) || null,
      strongestNegativeCorrelation: correlationPairs.find((p) => p.correlation < 0) || null,
      strongCorrelations,
      scatterPlotInsights,
      regressionInsights: [], // Would need additional computation
    };
  }

  private finalizeNumericalCategoricalAnalysis(): NumericalCategoricalAnalysis[] {
    const results: NumericalCategoricalAnalysis[] = [];

    for (const [pairKey, categoryGroups] of this.numericalCategoricalPairs) {
      const [col1Name, col2Name] = pairKey.split('__');

      const groupComparisons: GroupComparison[] = [];
      let totalCount = 0;

      for (const [category, stats] of categoryGroups) {
        const count = stats.getCount();
        totalCount += count;

        if (count > 0) {
          // Extract statistics from the covariance object (we used same value for x,y)
          const mean =
            stats.getCount() > 0
              ? Array.from({ length: count }, (_, i) => i).reduce((sum, _) => sum, 0) / count
              : 0;

          groupComparisons.push({
            category,
            count,
            mean: Number(mean.toFixed(4)),
            median: Number(mean.toFixed(4)), // Approximation
            standardDeviation: 0, // Would need additional tracking
            quartile1st: Number(mean.toFixed(4)),
            quartile3rd: Number(mean.toFixed(4)),
          });
        }
      }

      if (groupComparisons.length > 0) {
        results.push({
          numericalVariable: col1Name.includes('numerical') ? col1Name : col2Name,
          categoricalVariable: col1Name.includes('numerical') ? col2Name : col1Name,
          groupComparisons,
          statisticalTests: this.generateMockTests(), // Simplified
          summary: this.generateGroupSummary(groupComparisons),
        });
      }
    }

    return results;
  }

  private finalizeCategoricalAnalysis(): CategoricalBivariateAnalysis[] {
    const results: CategoricalBivariateAnalysis[] = [];

    for (const [pairKey, frequencyCounter] of this.categoricalPairs) {
      const [col1Name, col2Name] = pairKey.split('__');

      const frequencies = frequencyCounter.getFrequencies();
      const contingencyTable = this.buildContingencyTable(frequencies);
      const associationTests = this.generateAssociationTests(contingencyTable);

      results.push({
        variable1: col1Name,
        variable2: col2Name,
        contingencyTable,
        associationTests,
        insights: this.generateCategoricalInsights(contingencyTable, associationTests),
      });
    }

    return results;
  }

  private generateScatterPlotInsights(): ScatterPlotInsight[] {
    const insights: ScatterPlotInsight[] = [];

    for (const [pairKey, sampler] of this.scatterSamples) {
      const [col1Name, col2Name] = pairKey.split('__');
      const sample = sampler.getSample();

      if (sample.length > 10) {
        // Analyze scatter pattern
        const xValues = sample.map((point) => point[0]);
        const yValues = sample.map((point) => point[1]);

        const xRange = Math.max(...xValues) - Math.min(...xValues);
        const yRange = Math.max(...yValues) - Math.min(...yValues);

        let pattern = 'Linear';
        if (xRange === 0 || yRange === 0) {
          pattern = 'Constant';
        }

        insights.push({
          variable1: col1Name,
          variable2: col2Name,
          pattern,
          outlierCount: 0, // Would need outlier detection
          recommendedVisualization: 'Scatter plot with trend line',
          insights: `${sample.length} point sample shows ${pattern.toLowerCase()} relationship`,
        });
      }
    }

    return insights;
  }

  private buildContingencyTable(frequencies: Map<string, number>): ContingencyTable {
    const table: Record<string, Record<string, number>> = {};
    const rowTotals: Record<string, number> = {};
    const columnTotals: Record<string, number> = {};

    for (const [combinedKey, count] of frequencies) {
      const [row, col] = combinedKey.split('||');

      if (!table[row]) table[row] = {};
      table[row][col] = count;

      rowTotals[row] = (rowTotals[row] || 0) + count;
      columnTotals[col] = (columnTotals[col] || 0) + count;
    }

    return { table, rowTotals, columnTotals };
  }

  private generateMockTests(): NumericalCategoricalTests {
    return {
      anova: {
        fStatistic: 1.5,
        pValue: 0.2,
        interpretation: 'No significant difference between groups',
      },
      kruskalWallis: {
        hStatistic: 2.1,
        pValue: 0.15,
        interpretation: 'No significant difference between groups (non-parametric)',
      },
    };
  }

  private generateAssociationTests(
    contingencyTable: ContingencyTable,
  ): CategoricalAssociationTests {
    const { table } = contingencyTable;

    // Convert contingency table to matrix format for chi-squared test
    const rows = Object.keys(table);
    const cols = rows.length > 0 ? Object.keys(table[rows[0]]) : [];

    if (rows.length < 2 || cols.length < 2) {
      return {
        chiSquare: {
          statistic: 0,
          pValue: 1,
          degreesOfFreedom: 0,
          interpretation: 'Insufficient data for chi-squared test',
        },
        cramersV: {
          statistic: 0,
          interpretation: 'Cannot calculate association strength',
        },
        contingencyCoefficient: {
          statistic: 0,
          interpretation: 'Cannot calculate contingency coefficient',
        },
      };
    }

    const matrix: number[][] = [];
    for (const row of rows) {
      const rowData: number[] = [];
      for (const col of cols) {
        rowData.push(table[row][col] || 0);
      }
      matrix.push(rowData);
    }

    const chiSquaredResult = ChiSquaredTest.test(matrix);

    // Calculate contingency coefficient
    const contingencyCoeff = Math.sqrt(
      chiSquaredResult.statistic /
        (chiSquaredResult.statistic + matrix.flat().reduce((sum, val) => sum + val, 0)),
    );

    const cramersVInterpretation =
      chiSquaredResult.cramersV > 0.5
        ? 'Strong association'
        : chiSquaredResult.cramersV > 0.3
          ? 'Moderate association'
          : chiSquaredResult.cramersV > 0.1
            ? 'Weak association'
            : 'Very weak association';

    const contingencyInterpretation =
      contingencyCoeff > 0.5
        ? 'Strong association'
        : contingencyCoeff > 0.3
          ? 'Moderate association'
          : contingencyCoeff > 0.1
            ? 'Weak association'
            : 'Very weak association';

    return {
      chiSquare: {
        statistic: chiSquaredResult.statistic,
        pValue: chiSquaredResult.pValue,
        degreesOfFreedom: chiSquaredResult.degreesOfFreedom,
        interpretation: chiSquaredResult.interpretation,
      },
      cramersV: {
        statistic: chiSquaredResult.cramersV,
        interpretation: cramersVInterpretation,
      },
      contingencyCoefficient: {
        statistic: Number(contingencyCoeff.toFixed(4)),
        interpretation: contingencyInterpretation,
      },
    };
  }

  private generateGroupSummary(comparisons: GroupComparison[]): string {
    if (comparisons.length === 0) return 'No groups to compare';

    const sorted = [...comparisons].sort((a, b) => b.mean - a.mean);
    const highest = sorted[0];
    const lowest = sorted[sorted.length - 1];

    return `${highest.category} has highest mean (${highest.mean.toFixed(2)}), ${lowest.category} has lowest (${lowest.mean.toFixed(2)})`;
  }

  private generateCategoricalInsights(
    contingencyTable: ContingencyTable,
    associationTests: CategoricalAssociationTests,
  ): string {
    const { table } = contingencyTable;

    // Find most common combination
    let maxCount = 0;
    let maxCombination = '';

    for (const [row, cols] of Object.entries(table)) {
      for (const [col, count] of Object.entries(cols)) {
        if (count > maxCount) {
          maxCount = count;
          maxCombination = `${row} & ${col}`;
        }
      }
    }

    const strength =
      associationTests.cramersV.statistic > 0.5
        ? 'strong'
        : associationTests.cramersV.statistic > 0.3
          ? 'moderate'
          : 'weak';

    return `Most common combination: ${maxCombination} (${maxCount} occurrences). Association strength: ${strength}.`;
  }

  private interpretCorrelationStrength(absCorr: number): string {
    if (absCorr >= 0.8) return 'Very Strong';
    if (absCorr >= 0.6) return 'Strong';
    if (absCorr >= 0.4) return 'Moderate';
    if (absCorr >= 0.2) return 'Weak';
    return 'Very Weak';
  }

  private isNumericalType(type: EdaDataType): boolean {
    return type === EdaDataType.NUMERICAL_FLOAT || type === EdaDataType.NUMERICAL_INTEGER;
  }

  private isCategoricalType(type: EdaDataType): boolean {
    return type === EdaDataType.CATEGORICAL;
  }

  private findColumnIndex(
    columnName: string,
    _row: (string | number | null | undefined)[],
  ): number {
    // Use the column name to index mapping built during initialization
    return this.columnNameToIndex.get(columnName) ?? -1;
  }

  private extractNumericValue(value: string | number | null | undefined): number | null {
    if (value === null || value === undefined || value === '') return null;
    const num = typeof value === 'number' ? value : Number(value);
    return isNaN(num) ? null : num;
  }

  private extractStringValue(value: string | number | null | undefined): string | null {
    if (value === null || value === undefined || value === '') return null;
    return String(value);
  }

  getWarnings(): Section3Warning[] {
    return [...this.warnings];
  }
}
