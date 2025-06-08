/**
 * Section 2: Completeness Dimension Analyzer
 * Analyzes missing data patterns, suggests imputation strategies
 */

import type {
  CompletenessAnalysis,
  ColumnCompleteness,
  MissingnessPattern,
  ImputationStrategy,
  DataQualityScore,
} from './types';
import { DataType } from '../../core/types';

export interface CompletenessAnalyzerInput {
  data: (string | null | undefined)[][];
  headers: string[];
  columnTypes: DataType[];
  rowCount: number;
  columnCount: number;
}

export class CompletenessAnalyzer {
  private data: (string | null | undefined)[][];
  private headers: string[];
  private columnTypes: DataType[];
  private rowCount: number;
  private columnCount: number;

  constructor(input: CompletenessAnalyzerInput) {
    this.data = input.data;
    this.headers = input.headers;
    this.columnTypes = input.columnTypes;
    this.rowCount = input.rowCount;
    this.columnCount = input.columnCount;
  }

  public analyze(): CompletenessAnalysis {
    const start = performance.now();

    // 1. Dataset-level completeness
    const datasetLevel = this.analyzeDatasetLevel();

    // 2. Column-level completeness
    const columnLevel = this.analyzeColumnLevel();

    // 3. Missing data matrix analysis
    const missingDataMatrix = this.analyzeMissingDataMatrix();

    // 4. Calculate overall score
    const score = this.calculateCompletenessScore(datasetLevel, columnLevel);

    console.log(`Completeness analysis completed in ${(performance.now() - start).toFixed(2)}ms`);

    return {
      datasetLevel,
      columnLevel,
      missingDataMatrix,
      score,
    };
  }

  private analyzeDatasetLevel() {
    const totalCells = this.rowCount * this.columnCount;
    let missingCount = 0;
    let rowsWithMissing = 0;

    // Debug: Log data structure for troubleshooting
    console.debug(`Completeness Analysis Debug:`, {
      rowCount: this.rowCount,
      columnCount: this.columnCount,
      dataLength: this.data.length,
      firstRowSample: this.data[0]?.slice(0, 3),
      dataStructureType: typeof this.data[0],
    });

    // Count missing values and rows with missing data
    for (let rowIdx = 0; rowIdx < this.rowCount; rowIdx++) {
      let rowHasMissing = false;
      const currentRow = this.data[rowIdx];

      // Ensure we have a valid row
      if (!currentRow || !Array.isArray(currentRow)) {
        console.warn(`Invalid row structure at index ${rowIdx}:`, currentRow);
        continue;
      }

      for (let colIdx = 0; colIdx < this.columnCount; colIdx++) {
        const cellValue = currentRow[colIdx];
        if (this.isMissing(cellValue)) {
          missingCount++;
          rowHasMissing = true;

          // Debug: Log first few missing values found
          if (missingCount <= 5) {
            console.debug(`Missing value found at [${rowIdx}, ${colIdx}]:`, {
              value: cellValue,
              type: typeof cellValue,
              stringValue: String(cellValue),
            });
          }
        }
      }

      if (rowHasMissing) {
        rowsWithMissing++;
      }
    }

    // Count columns with missing data
    const columnsWithMissing = this.headers.filter((_, colIdx) => {
      return this.data.some((row) => this.isMissing(row?.[colIdx]));
    }).length;

    const overallCompletenessRatio = ((totalCells - missingCount) / totalCells) * 100;
    const rowsWithMissingPercentage = (rowsWithMissing / this.rowCount) * 100;
    const columnsWithMissingPercentage = (columnsWithMissing / this.columnCount) * 100;

    let distributionOverview = '';
    if (missingCount === 0) {
      distributionOverview = 'No missing values detected';
    } else if (columnsWithMissingPercentage < 25) {
      distributionOverview = 'Missing values predominantly in few columns';
    } else if (rowsWithMissingPercentage < 25) {
      distributionOverview = 'Missing values concentrated in few rows';
    } else {
      distributionOverview = 'Missing values distributed across dataset';
    }

    return {
      overallCompletenessRatio,
      totalMissingValues: missingCount,
      rowsWithMissingPercentage,
      columnsWithMissingPercentage,
      distributionOverview,
    };
  }

  private analyzeColumnLevel(): ColumnCompleteness[] {
    return this.headers.map((columnName, colIdx) => {
      const missingCount = this.countMissingInColumn(colIdx);
      const missingPercentage = (missingCount / this.rowCount) * 100;

      const missingnessPattern = this.detectMissingnessPattern(colIdx, missingCount);
      const suggestedImputation = this.suggestImputationStrategy(
        colIdx,
        missingCount,
        this.columnTypes[colIdx],
      );

      return {
        columnName,
        missingCount,
        missingPercentage,
        missingnessPattern,
        suggestedImputation,
        sparklineRepresentation: this.generateSparkline(colIdx),
      };
    });
  }

  private analyzeMissingDataMatrix() {
    const correlations = this.calculateMissingCorrelations();
    const blockPatterns = this.detectBlockPatterns();

    return {
      correlations,
      blockPatterns,
    };
  }

  private calculateMissingCorrelations() {
    const correlations: Array<{
      column1: string;
      column2: string;
      correlation: number;
      description: string;
    }> = [];

    for (let i = 0; i < this.columnCount; i++) {
      for (let j = i + 1; j < this.columnCount; j++) {
        const correlation = this.calculateMissingCorrelation(i, j);

        if (Math.abs(correlation) > 0.3) {
          // Threshold for significant correlation
          correlations.push({
            column1: this.headers[i],
            column2: this.headers[j],
            correlation,
            description: this.describeMissingCorrelation(
              correlation,
              this.headers[i],
              this.headers[j],
            ),
          });
        }
      }
    }

    return correlations.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));
  }

  private calculateMissingCorrelation(col1Idx: number, col2Idx: number): number {
    let both00 = 0,
      both01 = 0,
      both10 = 0,
      both11 = 0;

    for (let rowIdx = 0; rowIdx < this.rowCount; rowIdx++) {
      const missing1 = this.isMissing(this.data[rowIdx]?.[col1Idx]);
      const missing2 = this.isMissing(this.data[rowIdx]?.[col2Idx]);

      if (!missing1 && !missing2) both00++;
      else if (!missing1 && missing2) both01++;
      else if (missing1 && !missing2) both10++;
      else both11++;
    }

    // Calculate Phi coefficient (correlation for binary variables)
    const numerator = both00 * both11 - both01 * both10;
    const denominator = Math.sqrt(
      (both00 + both01) * (both10 + both11) * (both00 + both10) * (both01 + both11),
    );

    return denominator === 0 ? 0 : numerator / denominator;
  }

  private describeMissingCorrelation(correlation: number, col1: string, col2: string): string {
    if (correlation > 0.7) {
      return `Strong positive correlation in missingness between '${col1}' and '${col2}'`;
    } else if (correlation > 0.3) {
      return `Moderate positive correlation in missingness between '${col1}' and '${col2}'`;
    } else if (correlation < -0.7) {
      return `Strong negative correlation in missingness between '${col1}' and '${col2}'`;
    } else if (correlation < -0.3) {
      return `Moderate negative correlation in missingness between '${col1}' and '${col2}'`;
    }
    return `Weak correlation in missingness between '${col1}' and '${col2}'`;
  }

  private detectBlockPatterns(): string[] {
    const patterns: string[] = [];

    // Look for consecutive missing rows
    let consecutiveMissingRows = 0;
    let maxConsecutiveMissingRows = 0;

    for (let rowIdx = 0; rowIdx < this.rowCount; rowIdx++) {
      const missingInRow = this.data[rowIdx]?.filter((value) => this.isMissing(value)).length || 0;

      if (missingInRow > this.columnCount * 0.5) {
        // More than 50% missing
        consecutiveMissingRows++;
        maxConsecutiveMissingRows = Math.max(maxConsecutiveMissingRows, consecutiveMissingRows);
      } else {
        consecutiveMissingRows = 0;
      }
    }

    if (maxConsecutiveMissingRows > 5) {
      patterns.push(
        `Block-wise missingness: ${maxConsecutiveMissingRows} consecutive rows with >50% missing values`,
      );
    }

    // Look for source-based patterns (simplified heuristic)
    const missingByPosition = this.analyzePositionalPatterns();
    if (missingByPosition.length > 0) {
      patterns.push(...missingByPosition);
    }

    return patterns;
  }

  private analyzePositionalPatterns(): string[] {
    const patterns: string[] = [];

    // Check for beginning/end patterns
    const firstQuarter = Math.floor(this.rowCount / 4);
    const lastQuarter = this.rowCount - firstQuarter;

    let missingInFirstQuarter = 0;
    let missingInLastQuarter = 0;

    for (let rowIdx = 0; rowIdx < this.rowCount; rowIdx++) {
      const missingInRow = this.data[rowIdx]?.filter((value) => this.isMissing(value)).length || 0;

      if (rowIdx < firstQuarter && missingInRow > 0) {
        missingInFirstQuarter++;
      } else if (rowIdx >= lastQuarter && missingInRow > 0) {
        missingInLastQuarter++;
      }
    }

    if (missingInFirstQuarter > firstQuarter * 0.3) {
      patterns.push(
        `Higher missingness concentration in first quarter of dataset (possible header/import issues)`,
      );
    }

    if (missingInLastQuarter > firstQuarter * 0.3) {
      patterns.push(
        `Higher missingness concentration in last quarter of dataset (possible truncation)`,
      );
    }

    return patterns;
  }

  private countMissingInColumn(colIdx: number): number {
    return this.data.reduce((count, row) => {
      return count + (this.isMissing(row?.[colIdx]) ? 1 : 0);
    }, 0);
  }

  private detectMissingnessPattern(colIdx: number, missingCount: number): MissingnessPattern {
    if (missingCount === 0) {
      return {
        type: 'MCAR',
        description: 'No missing values detected',
      };
    }

    // Simplified pattern detection
    const randomnessScore = this.calculateRandomnessScore(colIdx);
    const correlatedColumns = this.findCorrelatedMissingColumns(colIdx);

    if (correlatedColumns.length > 0) {
      return {
        type: 'MAR',
        description: `Missing values appear to be related to other variables`,
        correlatedColumns,
      };
    } else if (randomnessScore > 0.8) {
      return {
        type: 'MCAR',
        description: 'Missing values appear to be randomly distributed',
      };
    } else {
      return {
        type: 'MNAR',
        description: 'Missing values may follow a systematic pattern',
      };
    }
  }

  private calculateRandomnessScore(colIdx: number): number {
    // Simplified randomness test using runs test concept
    let runs = 0;
    let lastWasMissing = false;
    let first = true;

    for (let rowIdx = 0; rowIdx < this.rowCount; rowIdx++) {
      const isMissing = this.isMissing(this.data[rowIdx]?.[colIdx]);

      if (first) {
        lastWasMissing = isMissing;
        first = false;
        continue;
      }

      if (isMissing !== lastWasMissing) {
        runs++;
        lastWasMissing = isMissing;
      }
    }

    // More runs = more random
    const expectedRuns = this.rowCount / 4; // Very simplified
    return Math.min(1, runs / expectedRuns);
  }

  private findCorrelatedMissingColumns(targetColIdx: number): string[] {
    const correlated: string[] = [];

    for (let colIdx = 0; colIdx < this.columnCount; colIdx++) {
      if (colIdx === targetColIdx) continue;

      const correlation = Math.abs(this.calculateMissingCorrelation(targetColIdx, colIdx));
      if (correlation > 0.3) {
        correlated.push(this.headers[colIdx]);
      }
    }

    return correlated;
  }

  private suggestImputationStrategy(
    _colIdx: number,
    missingCount: number,
    dataType: DataType,
  ): ImputationStrategy {
    if (missingCount === 0) {
      return {
        method: 'None',
        rationale: 'No missing values to impute',
        confidence: 100,
      };
    }

    const missingPercentage = (missingCount / this.rowCount) * 100;

    if (missingPercentage > 70) {
      return {
        method: 'Domain Input Required',
        rationale: 'High percentage of missing values requires domain expertise',
        confidence: 30,
      };
    }

    switch (dataType) {
      case DataType.NUMBER:
      case DataType.INTEGER:
      case DataType.FLOAT:
        if (missingPercentage < 10) {
          return {
            method: 'Mean',
            rationale: 'Low percentage of missing numeric values, mean imputation appropriate',
            confidence: 80,
          };
        } else if (missingPercentage < 30) {
          return {
            method: 'Regression',
            rationale: 'Moderate missing percentage, regression-based imputation recommended',
            confidence: 70,
          };
        } else {
          return {
            method: 'ML Model',
            rationale: 'High missing percentage, advanced imputation model needed',
            confidence: 60,
          };
        }

      case DataType.STRING:
        if (missingPercentage < 15) {
          return {
            method: 'Mode',
            rationale: 'Low percentage of missing categorical values, mode imputation appropriate',
            confidence: 75,
          };
        } else {
          return {
            method: 'Domain Input Required',
            rationale: 'High percentage of missing categorical values requires domain knowledge',
            confidence: 40,
          };
        }

      case DataType.DATE:
      case DataType.DATETIME:
        return {
          method: 'Domain Input Required',
          rationale: 'Date/time imputation requires understanding of temporal context',
          confidence: 30,
        };

      case DataType.BOOLEAN:
        if (missingPercentage < 20) {
          return {
            method: 'Mode',
            rationale: 'Boolean values can be imputed with most frequent value',
            confidence: 70,
          };
        } else {
          return {
            method: 'Domain Input Required',
            rationale: 'High percentage of missing boolean values needs business context',
            confidence: 40,
          };
        }

      default:
        return {
          method: 'Domain Input Required',
          rationale: 'Unknown data type requires manual assessment',
          confidence: 20,
        };
    }
  }

  private generateSparkline(colIdx: number): string {
    // Generate a simple text-based sparkline showing missing pattern
    const segments = 20;
    const segmentSize = Math.ceil(this.rowCount / segments);
    let sparkline = '';

    for (let i = 0; i < segments; i++) {
      const startRow = i * segmentSize;
      const endRow = Math.min(startRow + segmentSize, this.rowCount);

      let missingInSegment = 0;
      for (let rowIdx = startRow; rowIdx < endRow; rowIdx++) {
        if (this.isMissing(this.data[rowIdx]?.[colIdx])) {
          missingInSegment++;
        }
      }

      const segmentRows = endRow - startRow;
      const missingPercentage = missingInSegment / segmentRows;

      if (missingPercentage === 0) sparkline += '▁';
      else if (missingPercentage < 0.25) sparkline += '▂';
      else if (missingPercentage < 0.5) sparkline += '▄';
      else if (missingPercentage < 0.75) sparkline += '▆';
      else sparkline += '█';
    }

    return sparkline;
  }

  private calculateCompletenessScore(
    datasetLevel: any,
    columnLevel: ColumnCompleteness[],
  ): DataQualityScore {
    const overallCompleteness = datasetLevel.overallCompletenessRatio;

    // Penalize for high variability in completeness across columns
    const columnCompletenesses = columnLevel.map((col) => 100 - col.missingPercentage);
    const variance = this.calculateVariance(columnCompletenesses);
    const variabilityPenalty = Math.min(10, variance / 100); // Max 10 point penalty

    const rawScore = Math.max(0, overallCompleteness - variabilityPenalty);

    let interpretation: 'Excellent' | 'Good' | 'Fair' | 'Needs Improvement' | 'Poor';
    if (rawScore >= 95) interpretation = 'Excellent';
    else if (rawScore >= 85) interpretation = 'Good';
    else if (rawScore >= 70) interpretation = 'Fair';
    else if (rawScore >= 50) interpretation = 'Needs Improvement';
    else interpretation = 'Poor';

    return {
      score: Math.round(rawScore * 100) / 100,
      interpretation,
      details: `${Math.round(overallCompleteness * 100) / 100}% of cells contain data`,
    };
  }

  private calculateVariance(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map((val) => Math.pow(val - mean, 2));
    return squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
  }

  private isMissing(value: string | null | undefined): boolean {
    // Handle null and undefined
    if (value === null || value === undefined) return true;

    // Handle string values
    if (typeof value === 'string') {
      const trimmed = value.trim().toLowerCase();
      const isMissingValue =
        trimmed === '' ||
        trimmed === 'null' ||
        trimmed === 'na' ||
        trimmed === 'n/a' ||
        trimmed === 'nan' ||
        trimmed === '#n/a' ||
        trimmed === 'nil' ||
        trimmed === 'none' ||
        trimmed === '--' ||
        trimmed === '?' ||
        trimmed === '##missing##';

      return isMissingValue;
    }

    // Handle numeric values (should not be missing unless NaN)
    if (typeof value === 'number') {
      return isNaN(value);
    }

    // All other types are considered present
    return false;
  }
}
