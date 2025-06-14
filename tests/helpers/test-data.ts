/**
 * Test Data Generation Utilities
 */

export interface TestDataset {
  csv: string;
  headers: string[];
  rows: string[][];
  expectedStats?: {
    [column: string]: {
      mean?: number;
      median?: number;
      standardDeviation?: number;
      min?: number;
      max?: number;
      count?: number;
    };
  };
}

/**
 * Create deterministic CSV data for testing
 */
export function createTestDataset(
  headers: string[],
  rows: (string | number)[][],
  expectedStats?: TestDataset['expectedStats']
): TestDataset {
  const stringRows = rows.map(row => row.map(cell => String(cell)));
  const csv = [headers.join(','), ...stringRows.map(row => row.join(','))].join('\n');
  
  return {
    csv,
    headers,
    rows: stringRows,
    expectedStats,
  };
}

/**
 * Simple dataset with known statistical properties
 */
export const SIMPLE_NUMERIC = createTestDataset(
  ['id', 'value'],
  [
    [1, 10],
    [2, 20], 
    [3, 30],
    [4, 40],
    [5, 50],
  ],
  {
    value: {
      mean: 30,
      median: 30,
      min: 10,
      max: 50,
      count: 5,
    },
  }
);

/**
 * Mixed data types for type detection testing
 */
export const MIXED_TYPES = createTestDataset(
  ['id', 'name', 'age', 'score', 'active', 'created_date'],
  [
    [1, 'Alice', 25, 85.5, 'true', '2024-01-15'],
    [2, 'Bob', 30, 92.0, 'false', '2024-01-16'],
    [3, 'Charlie', 35, 78.3, 'true', '2024-01-17'],
  ]
);

/**
 * Data with missing values and outliers
 */
export const QUALITY_ISSUES = createTestDataset(
  ['id', 'value', 'category'],
  [
    [1, 10, 'A'],
    [2, '', 'B'],      // Missing value
    [3, 15, ''],       // Missing category
    [4, 1000, 'A'],    // Outlier
    [5, 12, 'C'],
  ]
);

/**
 * Categorical data for frequency analysis
 */
export const CATEGORICAL_DATA = createTestDataset(
  ['id', 'department', 'grade'],
  [
    [1, 'Engineering', 'A'],
    [2, 'Engineering', 'B'], 
    [3, 'Sales', 'A'],
    [4, 'Sales', 'A'],
    [5, 'Marketing', 'C'],
  ]
);

/**
 * Generate large dataset simulation without actually creating large files
 */
export function createLargeDatasetSimulation(rows: number): TestDataset {
  const headers = ['id', 'value', 'category'];
  const generatedRows: (string | number)[][] = [];
  
  for (let i = 1; i <= rows; i++) {
    generatedRows.push([
      i,
      Math.round(Math.random() * 100),
      ['A', 'B', 'C'][i % 3],
    ]);
  }
  
  return createTestDataset(headers, generatedRows);
}

/**
 * Malformed CSV for error handling tests
 */
export const MALFORMED_CSV = `name,age,score
John,25,85.5
Jane,30
Bob,35,78.3,extra_column
Alice,,92.0`;

/**
 * Unicode CSV for encoding tests
 */
export const UNICODE_CSV = `name,city,price
José,São Paulo,€29.99
François,Montréal,$34.50
李明,北京,¥156.80`;

/**
 * Load fixture file as string (for integration tests)
 */
export function loadFixture(path: string): string {
  const fs = require('fs');
  const fullPath = require('path').join(__dirname, '..', 'fixtures', path);
  return fs.readFileSync(fullPath, 'utf8');
}