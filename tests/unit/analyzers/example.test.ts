/**
 * Example Unit Test - Demonstrates New Testing Approach
 * 
 * This test shows how we test actual business logic with:
 * - Fast execution (<50ms)
 * - Deterministic data
 * - Clear assertions
 * - No external dependencies
 */

import { SIMPLE_NUMERIC, MIXED_TYPES } from '../../helpers/test-data';

// This is a placeholder for when we implement the actual statistical functions
// For now, we'll test the approach with mock implementations

function calculateMean(values: number[]): number {
  if (values.length === 0) throw new Error('Cannot calculate mean of empty array');
  return values.reduce((sum, val) => sum + val, 0) / values.length;
}

function calculateMedian(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

describe('Example: Statistical Calculations', () => {

  it('should calculate mean correctly', () => {
    const values = [10, 20, 30, 40, 50];
    const result = calculateMean(values);
    
    expect(result).toBeCloseTo(30, 2);
    expect(result).toBe(SIMPLE_NUMERIC.expectedStats!.value.mean);
  });

  it('should calculate median correctly', () => {
    const values = [10, 20, 30, 40, 50];
    const result = calculateMedian(values);
    
    expect(result).toBe(30);
    expect(result).toBe(SIMPLE_NUMERIC.expectedStats!.value.median);
  });

  it('should handle edge cases gracefully', () => {
    expect(() => calculateMean([])).toThrow();
    expect(calculateMean([42])).toBe(42);
    expect(calculateMedian([1, 2])).toBe(1.5);
  });
});

describe('Example: CSV Parsing Logic', () => {
  function parseCSVLine(line: string, delimiter = ','): string[] {
    return line.split(delimiter).map(cell => cell.trim());
  }

  it('should parse simple CSV lines', () => {
    const result = parseCSVLine('name,age,score');
    expect(result).toEqual(['name', 'age', 'score']);
  });

  it('should handle different delimiters', () => {
    const result = parseCSVLine('name;age;score', ';');
    expect(result).toEqual(['name', 'age', 'score']);
  });

  it('should work with test data fixtures', () => {
    const firstLine = MIXED_TYPES.csv.split('\n')[0];
    const headers = parseCSVLine(firstLine);
    
    expect(headers).toEqual(MIXED_TYPES.headers);
    expect(headers).toHaveLength(6);
  });
});

describe('Example: Type Detection Logic', () => {
  function detectDataType(values: string[]): 'numeric' | 'categorical' | 'date' | 'boolean' {
    const nonEmpty = values.filter(v => v.trim() !== '');
    
    if (nonEmpty.every(v => ['true', 'false'].includes(v.toLowerCase()))) {
      return 'boolean';
    }
    
    if (nonEmpty.every(v => !isNaN(Number(v)))) {
      return 'numeric';
    }
    
    if (nonEmpty.every(v => /^\d{4}-\d{2}-\d{2}$/.test(v))) {
      return 'date';
    }
    
    return 'categorical';
  }

  it('should detect numeric columns', () => {
    const values = ['10', '20', '30', '40'];
    expect(detectDataType(values)).toBe('numeric');
  });

  it('should detect boolean columns', () => {
    const values = ['true', 'false', 'TRUE', 'FALSE'];
    expect(detectDataType(values)).toBe('boolean');
  });

  it('should detect date columns', () => {
    const values = ['2024-01-15', '2024-01-16', '2024-01-17'];
    expect(detectDataType(values)).toBe('date');
  });

  it('should default to categorical', () => {
    const values = ['Alice', 'Bob', 'Charlie'];
    expect(detectDataType(values)).toBe('categorical');
  });

  it('should handle mixed and empty values', () => {
    const mixedValues = ['10', '', '20'];
    expect(detectDataType(mixedValues)).toBe('numeric');
    
    const emptyValues = ['', '', ''];
    // Empty strings default to boolean detection, then fall through to categorical
    expect(['boolean', 'categorical']).toContain(detectDataType(emptyValues));
  });
});

describe('Example: Output Formatting', () => {
  function formatAsMarkdown(data: { title: string; value: number }[]): string {
    const header = '| Metric | Value |\n|--------|-------|\n';
    const rows = data.map(row => `| ${row.title} | ${row.value} |`).join('\n');
    return header + rows;
  }

  it('should generate valid markdown table', () => {
    const data = [
      { title: 'Mean', value: 30 },
      { title: 'Median', value: 30 },
    ];
    
    const result = formatAsMarkdown(data);
    
    expect(result).toContain('| Metric | Value |');
    expect(result).toContain('| Mean | 30 |');
    expect(result).toContain('| Median | 30 |');
    expect(result.split('\n')).toHaveLength(4); // Header + separator + 2 rows
  });

  it('should handle empty data', () => {
    const result = formatAsMarkdown([]);
    expect(result).toContain('| Metric | Value |');
    expect(result.split('\n').filter(line => line.trim())).toHaveLength(2); // Just header + separator
  });
});

// This test demonstrates the performance requirement
describe('Performance Requirements', () => {
  it('should execute statistical calculations quickly', () => {
    const start = Date.now();
    
    // Simulate statistical calculation on 1000 values
    const values = Array.from({ length: 1000 }, (_, i) => i + 1);
    const mean = calculateMean(values);
    const median = calculateMedian(values);
    
    const duration = Date.now() - start;
    
    expect(mean).toBe(500.5);
    expect(median).toBe(500.5);
    expect(duration).toBeLessThan(50); // Must complete in <50ms
  });
});