/**
 * Structural Analyzer Tests
 * 
 * Tests dataset structural analysis including:
 * - Dimension calculations (rows, columns, cells)
 * - Column inventory creation
 * - Memory usage estimation
 * - Sparsity analysis
 * - Warning generation for structural issues
 * - Row length calculations
 */

import { StructuralAnalyzer } from '../../../../src/analyzers/overview/structural-analyzer';
import type { Section1Config, StructuralDimensions } from '../../../../src/analyzers/overview/types';
import type { ParsedRow } from '../../../../src/parsers/types';

describe('StructuralAnalyzer', () => {
  let analyzer: StructuralAnalyzer;
  let config: Section1Config;

  beforeEach(() => {
    config = {
      includeHostEnvironment: true,
      enableFileHashing: false,
      maxSampleSizeForSparsity: 1000,
      privacyMode: 'full',
      detailedProfiling: true,
    };
    analyzer = new StructuralAnalyzer(config);
  });

  // Helper function to create mock parsed rows
  function createMockRows(data: string[][]): ParsedRow[] {
    return data.map((row, index) => ({
      index: index,
      lineNumber: index + 1,
      data: row,
    }));
  }

  describe('Basic Structural Analysis', () => {
    it('should analyze simple dataset structure', () => {
      const data = [
        ['id', 'name', 'value'],
        ['1', 'Alice', '100'],
        ['2', 'Bob', '200'],
        ['3', 'Charlie', '300'],
      ];
      const rows = createMockRows(data);

      const result = analyzer.analyzeStructure(rows, true);

      expect(result.totalRowsRead).toBe(4);
      expect(result.totalDataRows).toBe(3); // Excluding header
      expect(result.totalColumns).toBe(3);
      expect(result.totalDataCells).toBe(9); // 3 rows × 3 columns
      expect(result.columnInventory).toHaveLength(3);
      expect(result.estimatedInMemorySizeMB).toBeGreaterThanOrEqual(0);
      expect(result.averageRowLengthBytes).toBeGreaterThan(0);
    });

    it('should analyze dataset without headers', () => {
      const data = [
        ['1', 'Alice', '100'],
        ['2', 'Bob', '200'],
        ['3', 'Charlie', '300'],
      ];
      const rows = createMockRows(data);

      const result = analyzer.analyzeStructure(rows, false);

      expect(result.totalRowsRead).toBe(3);
      expect(result.totalDataRows).toBe(3); // No header to exclude
      expect(result.totalColumns).toBe(3);
      expect(result.totalDataCells).toBe(9);
      expect(result.columnInventory).toHaveLength(3);

      // Should generate generic column names
      expect(result.columnInventory[0].name).toBe('Col_0');
      expect(result.columnInventory[1].name).toBe('Col_1');
      expect(result.columnInventory[2].name).toBe('Col_2');
    });

    it('should handle empty datasets', () => {
      const rows: ParsedRow[] = [];

      const result = analyzer.analyzeStructure(rows, false);

      expect(result.totalRowsRead).toBe(0);
      expect(result.totalDataRows).toBe(0);
      expect(result.totalColumns).toBe(0);
      expect(result.totalDataCells).toBe(0);
      expect(result.columnInventory).toHaveLength(0);
      expect(result.estimatedInMemorySizeMB).toBe(0);
      expect(result.averageRowLengthBytes).toBe(0);
      expect(result.sparsityAnalysis.sparsityPercentage).toBe(0);
      expect(result.sparsityAnalysis.description).toBe('Empty dataset');
    });

    it('should handle single row datasets', () => {
      const data = [['value1', 'value2', 'value3']];
      const rows = createMockRows(data);

      const result = analyzer.analyzeStructure(rows, false);

      expect(result.totalRowsRead).toBe(1);
      expect(result.totalDataRows).toBe(1);
      expect(result.totalColumns).toBe(3);
      expect(result.totalDataCells).toBe(3);
    });

    it('should handle header-only datasets', () => {
      const data = [['id', 'name', 'value']];
      const rows = createMockRows(data);

      const result = analyzer.analyzeStructure(rows, true);

      expect(result.totalRowsRead).toBe(1);
      expect(result.totalDataRows).toBe(0); // Only header, no data
      expect(result.totalColumns).toBe(3);
      expect(result.totalDataCells).toBe(0);
      expect(result.columnInventory).toHaveLength(3);
      expect(result.columnInventory[0].name).toBe('id');
      expect(result.columnInventory[1].name).toBe('name');
      expect(result.columnInventory[2].name).toBe('value');
    });
  });

  describe('Column Inventory Creation', () => {
    it('should create column inventory with headers', () => {
      const data = [
        ['employee_id', 'first_name', 'last_name', 'salary'],
        ['1', 'John', 'Smith', '50000'],
        ['2', 'Jane', 'Doe', '55000'],
      ];
      const rows = createMockRows(data);

      const result = analyzer.analyzeStructure(rows, true);

      expect(result.columnInventory).toHaveLength(4);
      
      // Check column details
      expect(result.columnInventory[0]).toEqual({
        index: 1,
        name: 'employee_id',
        originalIndex: 0,
      });
      expect(result.columnInventory[1]).toEqual({
        index: 2,
        name: 'first_name',
        originalIndex: 1,
      });
      expect(result.columnInventory[2]).toEqual({
        index: 3,
        name: 'last_name',
        originalIndex: 2,
      });
      expect(result.columnInventory[3]).toEqual({
        index: 4,
        name: 'salary',
        originalIndex: 3,
      });
    });

    it('should handle empty column names in headers', () => {
      const data = [
        ['id', '', 'value', ''],
        ['1', 'data1', '100', 'extra'],
        ['2', 'data2', '200', 'more'],
      ];
      const rows = createMockRows(data);

      const result = analyzer.analyzeStructure(rows, true);

      expect(result.columnInventory).toHaveLength(4);
      expect(result.columnInventory[0].name).toBe('id');
      expect(result.columnInventory[1].name).toBe('Column_1'); // Default for empty
      expect(result.columnInventory[2].name).toBe('value');
      expect(result.columnInventory[3].name).toBe('Column_3'); // Default for empty
    });

    it('should generate generic names without headers', () => {
      const data = [
        ['1', 'Alice', '100', 'Engineer'],
        ['2', 'Bob', '200', 'Designer'],
      ];
      const rows = createMockRows(data);

      const result = analyzer.analyzeStructure(rows, false);

      expect(result.columnInventory).toHaveLength(4);
      expect(result.columnInventory[0].name).toBe('Col_0');
      expect(result.columnInventory[1].name).toBe('Col_1');
      expect(result.columnInventory[2].name).toBe('Col_2');
      expect(result.columnInventory[3].name).toBe('Col_3');
    });
  });

  describe('Memory Usage Estimation', () => {
    it('should estimate memory usage for small datasets', () => {
      const data = [
        ['id', 'name'],
        ['1', 'Alice'],
        ['2', 'Bob'],
      ];
      const rows = createMockRows(data);

      const result = analyzer.analyzeStructure(rows, true);

      expect(result.estimatedInMemorySizeMB).toBeGreaterThanOrEqual(0);
      expect(result.estimatedInMemorySizeMB).toBeLessThan(1); // Should be very small
    });

    it('should estimate memory usage for larger datasets', () => {
      // Create a larger dataset
      const data = [['id', 'name', 'description']];
      for (let i = 1; i <= 1000; i++) {
        data.push([
          i.toString(),
          `User${i}`,
          `This is a longer description for user ${i} with more text content to increase memory usage`,
        ]);
      }
      const rows = createMockRows(data);

      const result = analyzer.analyzeStructure(rows, true);

      expect(result.estimatedInMemorySizeMB).toBeGreaterThanOrEqual(0);
      // Should be proportional to data size
      expect(result.estimatedInMemorySizeMB).toBeGreaterThan(0.001);
    });

    it('should handle datasets with varying field lengths', () => {
      const data = [
        ['short', 'medium_length', 'very_long_field_name_that_takes_more_space'],
        ['a', 'medium text', 'This is a very long text field that contains a lot of information and should contribute significantly to memory usage calculations'],
        ['b', 'more text', 'Another long field with substantial content'],
      ];
      const rows = createMockRows(data);

      const result = analyzer.analyzeStructure(rows, true);

      expect(result.estimatedInMemorySizeMB).toBeGreaterThanOrEqual(0);
      expect(result.averageRowLengthBytes).toBeGreaterThan(50); // Should be substantial due to long fields
    });

    it('should estimate memory for empty fields', () => {
      const data = [
        ['id', 'name', 'optional'],
        ['1', 'Alice', ''],
        ['2', '', ''],
        ['3', 'Charlie', 'value'],
      ];
      const rows = createMockRows(data);

      const result = analyzer.analyzeStructure(rows, true);

      expect(result.estimatedInMemorySizeMB).toBeGreaterThanOrEqual(0);
      // Empty fields still take some memory for the string objects
    });
  });

  describe('Sparsity Analysis', () => {
    it('should analyze dense datasets', () => {
      const data = [
        ['id', 'name', 'value'],
        ['1', 'Alice', '100'],
        ['2', 'Bob', '200'],
        ['3', 'Charlie', '300'],
      ];
      const rows = createMockRows(data);

      const result = analyzer.analyzeStructure(rows, true);

      expect(result.sparsityAnalysis.sparsityPercentage).toBe(0);
      expect(result.sparsityAnalysis.method).toBe('Full dataset analysis');
      expect(result.sparsityAnalysis.sampleSize).toBe(3);
      expect(result.sparsityAnalysis.description).toContain('Dense dataset');
    });

    it('should analyze sparse datasets', () => {
      const data = [
        ['id', 'name', 'value', 'optional'],
        ['1', 'Alice', '', ''],      // 2 empty
        ['2', '', '200', ''],        // 2 empty
        ['3', 'Charlie', '300', ''], // 1 empty
        ['4', '', '', ''],           // 3 empty
      ];
      const rows = createMockRows(data);

      const result = analyzer.analyzeStructure(rows, true);

      expect(result.sparsityAnalysis.sparsityPercentage).toBeGreaterThan(0);
      expect(result.sparsityAnalysis.sparsityPercentage).toBe(50); // 8 empty out of 16 total
      expect(result.sparsityAnalysis.description).toContain('sparse');
    });

    it('should recognize different empty value representations', () => {
      const data = [
        ['id', 'value1', 'value2', 'value3', 'value4', 'value5', 'value6'],
        ['1', '', 'null', 'undefined', 'na', 'N/A', '-'],
        ['2', 'data', '#N/A', 'NULL', 'NA', 'n/a', 'value'],
      ];
      const rows = createMockRows(data);

      const result = analyzer.analyzeStructure(rows, true);

      // Should recognize various empty representations
      expect(result.sparsityAnalysis.sparsityPercentage).toBeGreaterThan(50);
    });

    it('should handle large datasets with sampling', () => {
      // Create dataset larger than sample size
      const data = [['id', 'value']];
      for (let i = 1; i <= 2000; i++) {
        data.push([i.toString(), i % 3 === 0 ? '' : `value${i}`]); // Every 3rd value is empty
      }
      const rows = createMockRows(data);

      // Set small sample size for testing
      const smallSampleConfig = { ...config, maxSampleSizeForSparsity: 500 };
      const smallSampleAnalyzer = new StructuralAnalyzer(smallSampleConfig);

      const result = smallSampleAnalyzer.analyzeStructure(rows, true);

      expect(result.sparsityAnalysis.method).toContain('Statistical sampling');
      expect(result.sparsityAnalysis.sampleSize).toBe(500);
      expect(result.sparsityAnalysis.sparsityPercentage).toBeGreaterThan(10); // Should detect significant sparsity
    });

    it('should categorize sparsity levels correctly', () => {
      const testCases = [
        { emptyPercentage: 0, expectedDescription: 'Dense dataset' },
        { emptyPercentage: 10, expectedDescription: 'Moderately dense' },
        { emptyPercentage: 30, expectedDescription: 'missing values' },
        { emptyPercentage: 60, expectedDescription: 'sparse' },
      ];

      for (const testCase of testCases) {
        const data = [['id', 'value']];
        for (let i = 1; i <= 100; i++) {
          data.push([
            i.toString(),
            i <= testCase.emptyPercentage ? '' : `value${i}`,
          ]);
        }
        const rows = createMockRows(data);

        const result = analyzer.analyzeStructure(rows, true);
        expect(result.sparsityAnalysis.description).toContain(testCase.expectedDescription);
      }
    });
  });

  describe('Row Length Calculations', () => {
    it('should calculate average row length accurately', () => {
      const data = [
        ['id', 'name'],
        ['1', 'Alice'],    // Approximately 7 bytes + delimiters
        ['22', 'Bob'],     // Approximately 6 bytes + delimiters
        ['333', 'Charlie'], // Approximately 11 bytes + delimiters
      ];
      const rows = createMockRows(data);

      const result = analyzer.analyzeStructure(rows, true);

      expect(result.averageRowLengthBytes).toBeGreaterThan(0);
      expect(result.averageRowLengthBytes).toBeLessThan(50); // Reasonable for small fields
    });

    it('should handle Unicode characters in row length calculation', () => {
      const data = [
        ['name', 'city'],
        ['José', 'São Paulo'],
        ['François', 'Montréal'],
        ['李明', '北京'],
      ];
      const rows = createMockRows(data);

      const result = analyzer.analyzeStructure(rows, true);

      expect(result.averageRowLengthBytes).toBeGreaterThan(0);
      // Unicode characters should be accounted for properly
    });

    it('should sample large datasets for row length calculation', () => {
      // Create dataset with > 100 rows
      const data = [['id', 'value']];
      for (let i = 1; i <= 200; i++) {
        data.push([i.toString(), `value_${i}`]);
      }
      const rows = createMockRows(data);

      const result = analyzer.analyzeStructure(rows, true);

      expect(result.averageRowLengthBytes).toBeGreaterThan(0);
      // Should still calculate reasonable average even with sampling
      expect(result.averageRowLengthBytes).toBeLessThan(100);
    });
  });

  describe('Warning Generation', () => {
    it('should generate warnings for large datasets', () => {
      // Create large dataset
      const data = [['id', 'value']];
      for (let i = 1; i <= 1500000; i++) {
        data.push([i.toString(), `value${i}`]);
      }
      const rows = createMockRows(data);

      const result = analyzer.analyzeStructure(rows, false);

      const warnings = analyzer.getWarnings();
      expect(warnings.length).toBeGreaterThan(0);
      
      const largeDatasetWarning = warnings.find(w => w.message.includes('Large dataset'));
      expect(largeDatasetWarning).toBeDefined();
      expect(largeDatasetWarning?.category).toBe('structural');
      expect(largeDatasetWarning?.severity).toBe('medium');
    });

    it('should generate warnings for wide datasets', () => {
      // Create wide dataset
      const headers = Array.from({ length: 150 }, (_, i) => `col_${i}`);
      const dataRow = Array.from({ length: 150 }, (_, i) => `value_${i}`);
      const data = [headers, dataRow];
      const rows = createMockRows(data);

      const result = analyzer.analyzeStructure(rows, true);

      const warnings = analyzer.getWarnings();
      expect(warnings.length).toBeGreaterThan(0);
      
      const wideDatasetWarning = warnings.find(w => w.message.includes('Wide dataset'));
      expect(wideDatasetWarning).toBeDefined();
      expect(wideDatasetWarning?.category).toBe('structural');
      expect(wideDatasetWarning?.severity).toBe('medium');
    });

    it('should generate warnings for high memory usage', () => {
      // Create dataset that will have high estimated memory usage
      const data = [['id', 'description']];
      for (let i = 1; i <= 1000; i++) {
        data.push([
          i.toString(),
          'This is a very long description field that contains a lot of text and will contribute to high memory usage estimation'.repeat(10),
        ]);
      }
      const rows = createMockRows(data);

      const result = analyzer.analyzeStructure(rows, true);

      const warnings = analyzer.getWarnings();
      const memoryWarning = warnings.find(w => w.message.includes('memory usage'));
      
      if (result.estimatedInMemorySizeMB > 1000) {
        expect(memoryWarning).toBeDefined();
        expect(memoryWarning?.category).toBe('structural');
        expect(memoryWarning?.severity).toBe('high');
      }
    });

    it('should generate warnings for very small datasets', () => {
      const data = [
        ['id', 'value'],
        ['1', 'test'],
      ];
      const rows = createMockRows(data);

      const result = analyzer.analyzeStructure(rows, true);

      const warnings = analyzer.getWarnings();
      const smallDatasetWarning = warnings.find(w => w.message.includes('small dataset'));
      expect(smallDatasetWarning).toBeDefined();
      expect(smallDatasetWarning?.category).toBe('structural');
      expect(smallDatasetWarning?.severity).toBe('low');
    });

    it('should manage warnings correctly', () => {
      const data = [['id', 'value'], ['1', 'test']];
      const rows = createMockRows(data);

      // Initially no warnings
      expect(analyzer.getWarnings()).toHaveLength(0);

      // After analysis, should have warnings
      analyzer.analyzeStructure(rows, true);
      expect(analyzer.getWarnings().length).toBeGreaterThan(0);

      // Should be able to clear warnings
      analyzer.clearWarnings();
      expect(analyzer.getWarnings()).toHaveLength(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle rows with different column counts', () => {
      const data = [
        ['id', 'name', 'value'],
        ['1', 'Alice'], // Missing column
        ['2', 'Bob', '200', 'extra'], // Extra column
        ['3', 'Charlie', '300'],
      ];
      const rows = createMockRows(data);

      const result = analyzer.analyzeStructure(rows, true);

      // Should use first row to determine column count
      expect(result.totalColumns).toBe(3);
      expect(result.columnInventory).toHaveLength(3);
    });

    it('should handle completely empty rows', () => {
      const data = [
        ['id', 'name', 'value'],
        ['1', 'Alice', '100'],
        ['', '', ''], // Completely empty row
        ['3', 'Charlie', '300'],
      ];
      const rows = createMockRows(data);

      const result = analyzer.analyzeStructure(rows, true);

      expect(result.totalDataRows).toBe(3);
      expect(result.sparsityAnalysis.sparsityPercentage).toBeGreaterThan(0);
    });

    it('should handle single column datasets', () => {
      const data = [
        ['value'],
        ['100'],
        ['200'],
        ['300'],
      ];
      const rows = createMockRows(data);

      const result = analyzer.analyzeStructure(rows, true);

      expect(result.totalColumns).toBe(1);
      expect(result.columnInventory).toHaveLength(1);
      expect(result.columnInventory[0].name).toBe('value');
      expect(result.totalDataCells).toBe(3);
    });

    it('should handle datasets with only empty values', () => {
      const data = [
        ['id', 'name', 'value'],
        ['', '', ''],
        ['', '', ''],
        ['', '', ''],
      ];
      const rows = createMockRows(data);

      const result = analyzer.analyzeStructure(rows, true);

      expect(result.sparsityAnalysis.sparsityPercentage).toBe(100);
      expect(result.sparsityAnalysis.description).toContain('Highly sparse');
    });

    it('should handle very long field values', () => {
      const longValue = 'a'.repeat(10000);
      const data = [
        ['id', 'content'],
        ['1', longValue],
        ['2', 'short'],
      ];
      const rows = createMockRows(data);

      const result = analyzer.analyzeStructure(rows, true);

      expect(result.estimatedInMemorySizeMB).toBeGreaterThanOrEqual(0);
      expect(result.averageRowLengthBytes).toBeGreaterThan(1000);
    });
  });
});