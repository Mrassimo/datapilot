/**
 * Section 2: Validity Dimension Analyzer
 * Validates data types, ranges, patterns, and business rules
 */

import type {
  ValidityAnalysis,
  TypeConformance,
  RangeConformance,
  PatternConformance,
  BusinessRule,
  DataQualityScore,
} from './types';
import { DataType } from '../../core/types';
import { logger } from '../../utils/logger';
import { EMAIL_PATTERN, PHONE_PATTERN, URL_PATTERN } from '../../utils/validation-patterns';

export interface ValidityAnalyzerInput {
  data: (string | null | undefined)[][];
  headers: string[];
  columnTypes: DataType[];
  rowCount: number;
  columnCount: number;
  businessRules?: BusinessRule[];
  customPatterns?: Record<string, string>; // column -> regex pattern
  customRanges?: Record<string, { min?: number; max?: number }>; // column -> range
}

export class ValidityAnalyzer {
  private data: (string | null | undefined)[][];
  private headers: string[];
  private columnTypes: DataType[];
  private rowCount: number;
  private columnCount: number;
  private businessRules: BusinessRule[];
  private customPatterns: Record<string, string>;
  private customRanges: Record<string, { min?: number; max?: number }>;

  // Using shared validation patterns for consistency
  // EMAIL_PATTERN, PHONE_PATTERN, URL_PATTERN imported from validation-patterns
  private static readonly DATE_PATTERNS = [
    /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
    /^\d{2}\/\d{2}\/\d{4}$/, // MM/DD/YYYY
    /^\d{2}-\d{2}-\d{4}$/, // DD-MM-YYYY
  ];

  constructor(input: ValidityAnalyzerInput) {
    this.data = input.data;
    this.headers = input.headers;
    this.columnTypes = input.columnTypes;
    this.rowCount = input.rowCount;
    this.columnCount = input.columnCount;
    this.businessRules = input.businessRules || [];
    this.customPatterns = input.customPatterns || {};
    this.customRanges = input.customRanges || {};
  }

  public analyze(): ValidityAnalysis {
    const start = performance.now();

    // 1. Data type conformance
    const typeConformance = this.analyzeTypeConformance();

    // 2. Range conformance
    const rangeConformance = this.analyzeRangeConformance();

    // 3. Pattern conformance
    const patternConformance = this.analyzePatternConformance();

    // 4. Business rules validation
    const businessRules = this.validateBusinessRules();

    // 5. File structure validation
    const fileStructure = this.analyzeFileStructure();

    // 6. Calculate overall score
    const score = this.calculateValidityScore(
      typeConformance,
      rangeConformance,
      patternConformance,
      businessRules,
    );

    logger.debug(`Validity analysis completed in ${(performance.now() - start).toFixed(2)}ms`, { operation: 'validity-analysis' });

    return {
      typeConformance,
      rangeConformance,
      patternConformance,
      businessRules,
      fileStructure,
      score,
    };
  }

  private analyzeTypeConformance(): TypeConformance[] {
    return this.headers.map((columnName, colIdx) => {
      const expectedType = this.columnTypes[colIdx];
      const actualType = this.inferActualType(colIdx);
      const conformanceResults = this.checkTypeConformance(colIdx, expectedType);

      return {
        columnName,
        expectedType: this.formatDataType(expectedType),
        actualType: this.formatDataType(actualType.type),
        confidence: actualType.confidence,
        nonConformingCount: conformanceResults.nonConformingCount,
        conformancePercentage: conformanceResults.conformancePercentage,
        examples: conformanceResults.examples,
        conversionStrategy: this.suggestConversionStrategy(
          expectedType,
          actualType.type,
          conformanceResults,
        ),
      };
    });
  }

  private analyzeRangeConformance(): RangeConformance[] {
    const numericColumns = this.headers
      .map((header, idx) => ({ header, idx, type: this.columnTypes[idx] }))
      .filter(
        ({ type }) =>
          type === DataType.NUMBER || type === DataType.INTEGER || type === DataType.FLOAT,
      );

    return numericColumns.map(({ header, idx }) => {
      const range = this.customRanges[header] || this.inferReasonableRange(header);
      const violations = this.findRangeViolations(idx, range);

      return {
        columnName: header,
        expectedRange: this.formatRange(range),
        violationsCount: violations.length,
        outliers: violations.slice(0, 10), // Limit examples
      };
    });
  }

  private analyzePatternConformance(): PatternConformance[] {
    const patternColumns: PatternConformance[] = [];

    this.headers.forEach((columnName, colIdx) => {
      let pattern: string | undefined;
      let patternName: string | undefined;

      // Check custom patterns first
      if (this.customPatterns[columnName]) {
        pattern = this.customPatterns[columnName];
        patternName = 'Custom Pattern';
      } else {
        // Infer pattern based on column name and content
        const inference = this.inferPattern(columnName, colIdx);
        if (inference) {
          pattern = inference.pattern;
          patternName = inference.name;
        }
      }

      if (pattern && patternName) {
        const violations = this.findPatternViolations(colIdx, pattern);

        patternColumns.push({
          columnName,
          expectedPattern: patternName,
          violationsCount: violations.length,
          examples: violations.slice(0, 5),
        });
      }
    });

    return patternColumns;
  }

  private validateBusinessRules(): BusinessRule[] {
    return this.businessRules.map((rule) => {
      const violations = this.evaluateBusinessRule(rule);

      return {
        ...rule,
        violations: violations.count,
        averageDiscrepancy: violations.averageDiscrepancy,
        examples: violations.examples.slice(0, 5),
      };
    });
  }

  private analyzeFileStructure() {
    // Check column count consistency
    const columnCounts = this.data.map((row) => row?.length || 0);
    const modalColumnCount = this.getMostFrequent(columnCounts);
    const deviatingRows = columnCounts.filter((count) => count !== modalColumnCount).length;

    // Header conformance (simplified check)
    const headerConformance = this.headers.length === this.columnCount;

    return {
      consistentColumnCount: deviatingRows === 0,
      headerConformance,
      deviatingRows: deviatingRows > 0 ? deviatingRows : undefined,
    };
  }

  private inferActualType(colIdx: number): { type: DataType; confidence: number } {
    const typeCounts: Record<string, number> = {};
    let validValues = 0;

    for (let rowIdx = 0; rowIdx < this.rowCount; rowIdx++) {
      const value = this.data[rowIdx]?.[colIdx];
      if (this.isValidValue(value)) {
        validValues++;
        const inferredType = this.inferValueType(value);
        typeCounts[inferredType] = (typeCounts[inferredType] || 0) + 1;
      }
    }

    if (validValues === 0) {
      return { type: DataType.UNKNOWN, confidence: 0 };
    }

    // Find most common type
    const dominantType = Object.entries(typeCounts).sort(([, a], [, b]) => b - a)[0];

    const confidence = (dominantType[1] / validValues) * 100;

    return {
      type: dominantType[0] as DataType,
      confidence: Math.round(confidence),
    };
  }

  private checkTypeConformance(colIdx: number, expectedType: DataType) {
    const nonConformingExamples: string[] = [];
    let nonConformingCount = 0;
    let validValueCount = 0;

    for (let rowIdx = 0; rowIdx < this.rowCount; rowIdx++) {
      const value = this.data[rowIdx]?.[colIdx];

      if (this.isValidValue(value)) {
        validValueCount++;
        const actualType = this.inferValueType(value);

        if (actualType !== expectedType && !this.isCompatibleType(actualType, expectedType)) {
          nonConformingCount++;
          if (nonConformingExamples.length < 5) {
            nonConformingExamples.push(String(value));
          }
        }
      }
    }

    const conformancePercentage =
      validValueCount > 0 ? ((validValueCount - nonConformingCount) / validValueCount) * 100 : 0;

    return {
      nonConformingCount,
      conformancePercentage,
      examples: nonConformingExamples,
    };
  }

  private inferValueType(value: string): DataType {
    const trimmed = value.trim();

    // Boolean check
    if (['true', 'false', '1', '0', 'yes', 'no', 'y', 'n'].includes(trimmed.toLowerCase())) {
      return DataType.BOOLEAN;
    }

    // Number checks
    if (/^-?\d+$/.test(trimmed)) {
      return DataType.INTEGER;
    }

    if (/^-?\d*\.?\d+([eE][+-]?\d+)?$/.test(trimmed)) {
      return DataType.FLOAT;
    }

    // Date checks
    if (this.looksLikeDate(trimmed)) {
      return this.looksLikeDateTime(trimmed) ? DataType.DATETIME : DataType.DATE;
    }

    return DataType.STRING;
  }

  private looksLikeDate(value: string): boolean {
    return (
      ValidityAnalyzer.DATE_PATTERNS.some((pattern) => pattern.test(value)) ||
      !isNaN(Date.parse(value))
    );
  }

  private looksLikeDateTime(value: string): boolean {
    return value.includes(':') || value.toLowerCase().includes('t');
  }

  private isCompatibleType(actual: DataType, expected: DataType): boolean {
    // Define compatibility rules - include CSV type conversion scenarios
    const compatibilityMap: Record<string, DataType[]> = {
      [DataType.NUMBER]: [DataType.INTEGER, DataType.FLOAT, DataType.STRING],
      [DataType.INTEGER]: [DataType.NUMBER, DataType.FLOAT, DataType.STRING],
      [DataType.FLOAT]: [DataType.NUMBER, DataType.INTEGER, DataType.STRING],
      // CSV files initially parse as STRING, so detecting proper types is good conformance
      [DataType.STRING]: [
        DataType.NUMBER,
        DataType.INTEGER,
        DataType.FLOAT,
        DataType.DATE,
        DataType.BOOLEAN,
      ],
    };

    return compatibilityMap[expected]?.includes(actual) || false;
  }

  private suggestConversionStrategy(
    expected: DataType,
    _actual: DataType,
    conformanceResults: any,
  ): string {
    if (conformanceResults.conformancePercentage > 95) {
      return 'No conversion needed - high conformance';
    }

    if (conformanceResults.conformancePercentage < 50) {
      return 'Manual review recommended - low conformance rate';
    }

    switch (expected) {
      case DataType.NUMBER:
      case DataType.INTEGER:
      case DataType.FLOAT:
        return 'Attempt numeric conversion, flag non-convertible values';

      case DataType.DATE:
      case DataType.DATETIME:
        return 'Parse with multiple date formats, standardise to ISO 8601';

      case DataType.BOOLEAN:
        return 'Map common boolean representations (Yes/No, 1/0, True/False)';

      default:
        return 'Convert to string with validation';
    }
  }

  private inferReasonableRange(columnName: string): { min?: number; max?: number } {
    const lower = columnName.toLowerCase();

    // Age-related columns
    if (lower.includes('age')) {
      return { min: 0, max: 120 };
    }

    // Percentage columns
    if (lower.includes('percent') || lower.includes('rate') || lower.includes('%')) {
      return { min: 0, max: 100 };
    }

    // Price/amount columns
    if (lower.includes('price') || lower.includes('amount') || lower.includes('cost')) {
      return { min: 0 }; // No upper limit for prices
    }

    // Year columns
    if (lower.includes('year')) {
      return { min: 1900, max: new Date().getFullYear() + 10 };
    }

    // Rating columns
    if (lower.includes('rating') || lower.includes('score')) {
      return { min: 0, max: 10 }; // Assuming 0-10 scale
    }

    return {}; // No range constraints
  }

  private findRangeViolations(
    colIdx: number,
    range: { min?: number; max?: number },
  ): Array<{ value: any; rowIndex: number }> {
    const violations: Array<{ value: any; rowIndex: number }> = [];

    for (let rowIdx = 0; rowIdx < this.rowCount; rowIdx++) {
      const value = this.data[rowIdx]?.[colIdx];

      if (this.isValidValue(value)) {
        const numValue = Number(value);

        if (!isNaN(numValue)) {
          const violatesMin = range.min !== undefined && numValue < range.min;
          const violatesMax = range.max !== undefined && numValue > range.max;

          if (violatesMin || violatesMax) {
            violations.push({ value: numValue, rowIndex: rowIdx });
          }
        }
      }
    }

    return violations;
  }

  private inferPattern(
    columnName: string,
    colIdx: number,
  ): { pattern: string; name: string } | null {
    const lower = columnName.toLowerCase();

    // Email patterns
    if (lower.includes('email') || lower.includes('mail')) {
      return { pattern: EMAIL_PATTERN.source, name: 'Email Format' };
    }

    // Phone patterns
    if (lower.includes('phone') || lower.includes('tel') || lower.includes('mobile')) {
      return { pattern: PHONE_PATTERN.source, name: 'Phone Number Format' };
    }

    // URL patterns
    if (lower.includes('url') || lower.includes('website') || lower.includes('link')) {
      return { pattern: URL_PATTERN.source, name: 'URL Format' };
    }

    // Sample values to infer pattern
    const sampleValues = this.getSampleValues(colIdx, 50);

    // Check if all values follow a consistent pattern
    if (sampleValues.length > 10) {
      const patterns = this.detectCommonPatterns(sampleValues);
      if (patterns.length > 0) {
        return { pattern: patterns[0].pattern, name: patterns[0].name };
      }
    }

    return null;
  }

  private getSampleValues(colIdx: number, maxSamples: number): string[] {
    const values: string[] = [];
    const step = Math.max(1, Math.floor(this.rowCount / maxSamples));

    for (let rowIdx = 0; rowIdx < this.rowCount && values.length < maxSamples; rowIdx += step) {
      const value = this.data[rowIdx]?.[colIdx];
      if (this.isValidValue(value)) {
        values.push(value.trim());
      }
    }

    return values;
  }

  private detectCommonPatterns(values: string[]): Array<{ pattern: string; name: string }> {
    const patterns: Array<{ pattern: string; name: string }> = [];

    // Check for consistent length and character patterns
    const lengths = values.map((v) => v.length);
    const uniqueLengths = [...new Set(lengths)];

    if (uniqueLengths.length === 1 && uniqueLengths[0] > 5) {
      // All values have same length - might be a code pattern
      const firstValue = values[0];
      let pattern = '';

      for (let i = 0; i < firstValue.length; i++) {
        const char = firstValue[i];
        if (/\d/.test(char)) {
          pattern += '\\d';
        } else if (/[a-zA-Z]/.test(char)) {
          pattern += '[a-zA-Z]';
        } else {
          pattern += '\\' + char; // Escape special characters
        }
      }

      if (pattern.length > 0) {
        patterns.push({ pattern: `^${pattern}$`, name: 'Fixed Format Code' });
      }
    }

    return patterns;
  }

  private findPatternViolations(colIdx: number, pattern: string): string[] {
    const violations: string[] = [];
    const regex = new RegExp(pattern);

    for (let rowIdx = 0; rowIdx < this.rowCount; rowIdx++) {
      const value = this.data[rowIdx]?.[colIdx];

      if (this.isValidValue(value) && !regex.test(value.trim())) {
        if (violations.length < 10) {
          violations.push(value.trim());
        }
      }
    }

    return violations;
  }

  private evaluateBusinessRule(rule: BusinessRule): {
    count: number;
    averageDiscrepancy?: number;
    examples: any[];
  } {
    // This is a simplified implementation
    // In practice, business rules would need a more sophisticated parser

    const violations: any[] = [];
    const totalDiscrepancy = 0;

    // Example: Check if a calculation rule like "Total = Quantity * Price"
    if (rule.description.includes('EQUAL') && rule.description.includes('*')) {
      // Extract column names (simplified parsing)
      // Implementation would need proper rule parsing
    }

    // For now, return empty result
    return {
      count: violations.length,
      averageDiscrepancy: violations.length > 0 ? totalDiscrepancy / violations.length : undefined,
      examples: violations,
    };
  }

  private calculateValidityScore(
    typeConformance: TypeConformance[],
    rangeConformance: RangeConformance[],
    patternConformance: PatternConformance[],
    businessRules: BusinessRule[],
  ): DataQualityScore {
    let score = 100;

    // Type conformance penalty
    const avgTypeConformance =
      typeConformance.reduce((sum, tc) => sum + tc.conformancePercentage, 0) /
      typeConformance.length;
    score -= (100 - avgTypeConformance) * 0.4; // 40% weight

    // Range violations penalty
    const totalRangeViolations = rangeConformance.reduce((sum, rc) => sum + rc.violationsCount, 0);
    const rangeViolationRate = (totalRangeViolations / this.rowCount) * 100;
    score -= Math.min(20, rangeViolationRate); // Max 20 points off

    // Pattern violations penalty
    const totalPatternViolations = patternConformance.reduce(
      (sum, pc) => sum + pc.violationsCount,
      0,
    );
    const patternViolationRate = (totalPatternViolations / this.rowCount) * 100;
    score -= Math.min(15, patternViolationRate); // Max 15 points off

    // Business rule violations penalty
    const totalBusinessRuleViolations = businessRules.reduce((sum, br) => sum + br.violations, 0);
    const businessRuleViolationRate = (totalBusinessRuleViolations / this.rowCount) * 100;
    score -= Math.min(25, businessRuleViolationRate * 2); // Max 25 points off

    score = Math.max(0, score);

    let interpretation: 'Excellent' | 'Good' | 'Fair' | 'Needs Improvement' | 'Poor';
    if (score >= 95) interpretation = 'Excellent';
    else if (score >= 85) interpretation = 'Good';
    else if (score >= 70) interpretation = 'Fair';
    else if (score >= 50) interpretation = 'Needs Improvement';
    else interpretation = 'Poor';

    return {
      score: Math.round(score * 100) / 100,
      interpretation,
      details: `${avgTypeConformance.toFixed(1)}% average type conformance, ${totalRangeViolations + totalPatternViolations + totalBusinessRuleViolations} total violations`,
    };
  }

  private formatDataType(type: DataType): string {
    switch (type) {
      case DataType.STRING:
        return 'String';
      case DataType.NUMBER:
        return 'Number';
      case DataType.INTEGER:
        return 'Integer';
      case DataType.FLOAT:
        return 'Float';
      case DataType.DATE:
        return 'Date';
      case DataType.DATETIME:
        return 'DateTime';
      case DataType.BOOLEAN:
        return 'Boolean';
      default:
        return 'Unknown';
    }
  }

  private formatRange(range: { min?: number; max?: number }): string {
    if (range.min !== undefined && range.max !== undefined) {
      return `${range.min} to ${range.max}`;
    } else if (range.min !== undefined) {
      return `>= ${range.min}`;
    } else if (range.max !== undefined) {
      return `<= ${range.max}`;
    }
    return 'No range constraint';
  }

  private isValidValue(value: string | null | undefined): value is string {
    return value !== null && value !== undefined && String(value).trim() !== '';
  }

  private getMostFrequent<T>(array: T[]): T {
    const counts = new Map<T, number>();
    for (const item of array) {
      counts.set(item, (counts.get(item) || 0) + 1);
    }

    let maxCount = 0;
    let mostFrequent = array[0];

    for (const [item, count] of counts.entries()) {
      if (count > maxCount) {
        maxCount = count;
        mostFrequent = item;
      }
    }

    return mostFrequent;
  }
}
