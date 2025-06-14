/**
 * Comprehensive Test Utilities for DataPilot Test Suite
 * Provides standardised helpers for consistent testing patterns
 */

import { writeFileSync, unlinkSync, mkdtempSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

/**
 * CSV Test Data Parser
 * Standardised CSV parsing for all analyzer tests
 */
export function parseCSVForTest(csvData: string): {
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

/**
 * Temporary File Manager
 * Standardised temporary file handling for tests
 */
export class TestFileManager {
  private tempDir: string;
  private files: string[] = [];

  constructor(prefix: string = 'datapilot-test-') {
    this.tempDir = mkdtempSync(join(tmpdir(), prefix));
  }

  createCSVFile(filename: string, csvData: string): string {
    const filePath = join(this.tempDir, filename);
    writeFileSync(filePath, csvData, 'utf8');
    this.files.push(filePath);
    return filePath;
  }

  createJSONFile(filename: string, jsonData: any): string {
    const filePath = join(this.tempDir, filename);
    writeFileSync(filePath, JSON.stringify(jsonData, null, 2), 'utf8');
    this.files.push(filePath);
    return filePath;
  }

  cleanup(): void {
    for (const file of this.files) {
      try {
        unlinkSync(file);
      } catch (e) {
        // File might not exist
      }
    }
    this.files = [];
  }

  getTempDir(): string {
    return this.tempDir;
  }
}

/**
 * Analyzer Result Validator
 * Standardised validation patterns for analyzer results
 */
export class AnalyzerTestValidator {
  /**
   * Validate common analyzer result structure
   */
  static validateAnalyzerResult(result: any, expectedShape: {
    hasApplicabilityCheck?: boolean;
    hasRecommendations?: boolean;
    hasTechnicalDetails?: boolean;
    requiredProperties?: string[];
  }): void {
    expect(result).toBeDefined();
    
    if (expectedShape.hasApplicabilityCheck) {
      expect(result.isApplicable).toBeDefined();
      expect(typeof result.isApplicable).toBe('boolean');
      if (!result.isApplicable) {
        expect(result.applicabilityReason).toBeDefined();
        expect(typeof result.applicabilityReason).toBe('string');
      }
    }
    
    if (expectedShape.hasRecommendations && result.isApplicable !== false) {
      expect(result.recommendations).toBeDefined();
      expect(Array.isArray(result.recommendations)).toBe(true);
    }
    
    if (expectedShape.hasTechnicalDetails && result.isApplicable !== false) {
      expect(result.technicalDetails).toBeDefined();
      expect(typeof result.technicalDetails).toBe('object');
    }
    
    if (expectedShape.requiredProperties) {
      for (const prop of expectedShape.requiredProperties) {
        expect(result[prop]).toBeDefined();
      }
    }
  }

  /**
   * Validate PCA analyzer specific structure
   */
  static validatePCAResult(result: any): void {
    this.validateAnalyzerResult(result, {
      hasApplicabilityCheck: true,
      hasRecommendations: true,
      hasTechnicalDetails: true,
      requiredProperties: ['totalVariance', 'componentsAnalyzed', 'components']
    });

    if (result.isApplicable) {
      expect(result.components).toBeDefined();
      expect(Array.isArray(result.components)).toBe(true);
      expect(result.screeData).toBeDefined();
      expect(result.varianceThresholds).toBeDefined();
      expect(result.dominantVariables).toBeDefined();
    }
  }

  /**
   * Validate Outlier analyzer specific structure
   */
  static validateOutlierResult(result: any): void {
    this.validateAnalyzerResult(result, {
      hasApplicabilityCheck: true,
      hasRecommendations: true,
      hasTechnicalDetails: true,
      requiredProperties: ['method', 'outliers']
    });

    expect(result.method).toBe('mahalanobis_distance');
    
    if (result.isApplicable) {
      expect(result.outliers).toBeDefined();
      expect(Array.isArray(result.outliers)).toBe(true);
      expect(result.severityDistribution).toBeDefined();
      expect(result.affectedVariables).toBeDefined();
      expect(result.totalOutliers).toBe(result.outliers.length);
    }
  }
}

/**
 * Mock Data Generator
 * Creates consistent test data across different test suites
 */
export class TestDataGenerator {
  /**
   * Generate CSV data with outliers
   */
  static createOutlierCSV(config: {
    normalRows: number;
    outlierRows: number;
    columns: string[];
    outlierMultiplier?: number;
  }): string {
    const { normalRows, outlierRows, columns, outlierMultiplier = 10 } = config;
    let csv = columns.join(',') + '\n';
    
    // Generate normal data
    for (let i = 0; i < normalRows; i++) {
      const row = columns.map((_, idx) => (i + 1) * (idx + 1));
      csv += row.join(',') + '\n';
    }
    
    // Generate outlier data
    for (let i = 0; i < outlierRows; i++) {
      const row = columns.map((_, idx) => (i + 1) * (idx + 1) * outlierMultiplier);
      csv += row.join(',') + '\n';
    }
    
    return csv;
  }

  /**
   * Generate correlated CSV data for PCA testing
   */
  static createCorrelatedCSV(config: {
    rows: number;
    baseColumns: string[];
    correlatedColumns: string[];
    noise?: number;
  }): string {
    const { rows, baseColumns, correlatedColumns, noise = 0.1 } = config;
    const allColumns = [...baseColumns, ...correlatedColumns];
    let csv = allColumns.join(',') + '\n';
    
    for (let i = 0; i < rows; i++) {
      const baseValues = baseColumns.map((_, idx) => (i + 1) * (idx + 1));
      const correlatedValues = correlatedColumns.map((_, idx) => 
        baseValues[idx % baseValues.length] * 2 + (Math.random() - 0.5) * noise
      );
      
      const row = [...baseValues, ...correlatedValues];
      csv += row.join(',') + '\n';
    }
    
    return csv;
  }

  /**
   * Generate quality test data with various issues
   */
  static createQualityTestCSV(config: {
    rows: number;
    columns: string[];
    missingPercentage?: number;
    duplicateRows?: number;
  }): string {
    const { rows, columns, missingPercentage = 0.1, duplicateRows = 0 } = config;
    let csv = columns.join(',') + '\n';
    
    // Generate normal rows
    for (let i = 0; i < rows; i++) {
      const row = columns.map((col, idx) => {
        // Introduce missing values
        if (Math.random() < missingPercentage) {
          return '';
        }
        return `${col}_${i}_${idx}`;
      });
      csv += row.join(',') + '\n';
    }
    
    // Add duplicate rows
    for (let i = 0; i < duplicateRows; i++) {
      const row = columns.map((col, idx) => `${col}_duplicate_${idx}`);
      csv += row.join(',') + '\n';
    }
    
    return csv;
  }
}

/**
 * Performance Test Utilities
 */
export class PerformanceTestHelper {
  /**
   * Measure execution time of a function
   */
  static async measureExecutionTime<T>(
    fn: () => Promise<T>,
    description: string = 'Operation'
  ): Promise<{ result: T; timeMs: number }> {
    const startTime = Date.now();
    const result = await fn();
    const timeMs = Date.now() - startTime;
    
    console.log(`${description} completed in ${timeMs}ms`);
    
    return { result, timeMs };
  }

  /**
   * Measure memory usage before and after operation
   */
  static async measureMemoryUsage<T>(
    fn: () => Promise<T>,
    description: string = 'Operation'
  ): Promise<{ result: T; memoryDeltaMB: number }> {
    const initialMemory = process.memoryUsage();
    const result = await fn();
    const finalMemory = process.memoryUsage();
    
    const memoryDeltaMB = (finalMemory.heapUsed - initialMemory.heapUsed) / 1024 / 1024;
    
    console.log(`${description} memory delta: ${memoryDeltaMB.toFixed(2)}MB`);
    
    return { result, memoryDeltaMB };
  }
}

/**
 * API Contract Testing Utilities
 */
export class APIContractTester {
  /**
   * Validate that an analyzer has the expected static method interface
   */
  static validateStaticAnalyzerInterface(
    analyzerClass: any,
    expectedMethodName: string = 'analyze',
    expectedParameterCount?: number
  ): void {
    expect(typeof analyzerClass[expectedMethodName]).toBe('function');
    
    if (expectedParameterCount !== undefined) {
      expect(analyzerClass[expectedMethodName].length).toBe(expectedParameterCount);
    }
  }

  /**
   * Validate analyzer result matches expected interface
   */
  static validateResultInterface<T>(
    result: T,
    interfaceShape: Record<string, 'string' | 'number' | 'boolean' | 'object' | 'array'>
  ): void {
    for (const [key, expectedType] of Object.entries(interfaceShape)) {
      expect(result).toHaveProperty(key);
      
      const actualValue = (result as any)[key];
      
      if (expectedType === 'array') {
        expect(Array.isArray(actualValue)).toBe(true);
      } else {
        expect(typeof actualValue).toBe(expectedType);
      }
    }
  }
}