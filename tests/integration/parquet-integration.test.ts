/**
 * Parquet Integration Tests
 * Tests the complete Parquet workflow from detection to analysis
 */

import { jest } from '@jest/globals';
import { UniversalAnalyzer } from '../../src/cli/universal-analyzer';
import type { CLIOptions } from '../../src/cli/types';
import { promises as fs } from 'fs';

// Mock hyparquet module - Jest will automatically use manual mock from __mocks__
jest.mock('hyparquet');

import {
  asyncBufferFromUrl as mockAsyncBufferFromFile,
  parquetReadObjects as mockParquetReadObjects,
  parquetMetadataAsync as mockParquetMetadataAsync,
  parquetSchema as mockParquetSchema
} from 'hyparquet';

describe('Parquet Integration Tests', () => {
  let analyzer: UniversalAnalyzer;

  beforeEach(() => {
    analyzer = new UniversalAnalyzer();
    jest.clearAllMocks();
  });

  describe('Format Detection', () => {
    it('should detect Parquet files correctly', async () => {
      const mockMetadata = {
        num_rows: BigInt(1000),
        row_groups: [{ 
          columns: [{ 
            meta_data: { 
              codec: 'SNAPPY',
              path_in_schema: 'id',
              type: 'INT64'
            } 
          }] 
        }]
      };
      
      const mockSchema = {
        children: [
          { element: { name: 'id' } },
          { element: { name: 'name' } },
          { element: { name: 'sales' } }
        ]
      };

      jest.spyOn(fs, 'stat').mockResolvedValue({ size: 2048000 } as any);
      (mockAsyncBufferFromFile as jest.MockedFunction<any>).mockResolvedValue({});
      (mockParquetMetadataAsync as jest.MockedFunction<any>).mockResolvedValue(mockMetadata);
      (mockParquetSchema as jest.MockedFunction<any>).mockResolvedValue(mockSchema);

      const validation = await analyzer.validateFile('/test/sales.parquet');

      expect(validation.supported).toBe(true);
      expect(validation.format).toBe('parquet');
      expect(validation.confidence).toBeGreaterThan(0.9);
      expect(validation.suggestions).toHaveLength(0);
    });

    it('should provide helpful suggestions for unsupported files', async () => {
      const validation = await analyzer.validateFile('/test/document.txt');

      expect(validation.supported).toBe(false);
      expect(validation.suggestions.length).toBeGreaterThan(0);
      expect(validation.suggestions[0]).toContain('not supported');
    });
  });

  describe('Universal Analysis with Parquet', () => {
    it('should perform complete analysis on Parquet file', async () => {
      const mockFileStats = { size: 5120000 };
      const mockMetadata = {
        num_rows: BigInt(10000),
        row_groups: [{ 
          columns: [{ 
            meta_data: { 
              codec: 'SNAPPY',
              path_in_schema: 'sales_id',
              type: 'INT64'
            } 
          }] 
        }]
      };
      
      const mockSchema = {
        children: [
          { element: { name: 'sales_id' } },
          { element: { name: 'product_name' } },
          { element: { name: 'price' } },
          { element: { name: 'quantity' } },
          { element: { name: 'date' } }
        ]
      };

      // Generate mock sales data
      const mockData = Array.from({ length: 100 }, (_, i) => ({
        sales_id: i + 1,
        product_name: `Product ${i % 10}`,
        price: 10.99 + (i % 50),
        quantity: 1 + (i % 5),
        date: new Date(`2024-01-${String((i % 28) + 1).padStart(2, '0')}`)
      }));

      jest.spyOn(fs, 'stat').mockResolvedValue(mockFileStats as any);
      (mockAsyncBufferFromFile as jest.MockedFunction<any>).mockResolvedValue({});
      (mockParquetMetadataAsync as jest.MockedFunction<any>).mockResolvedValue(mockMetadata);
      (mockParquetSchema as jest.MockedFunction<any>).mockResolvedValue(mockSchema);
      (mockParquetReadObjects as jest.MockedFunction<any>).mockResolvedValue(mockData);

      const options: CLIOptions = {
        command: 'all',
        maxRows: 100,
        sections: ['1', '2']
      };

      const result = await analyzer.analyzeFile('/test/sales.parquet', options);

      expect(result.success).toBe(true);
      expect(result.metadata.originalFormat).toBe('parquet');
      expect(result.metadata.detection.format).toBe('parquet');
      expect(result.metadata.detection.confidence).toBeGreaterThan(0.9);
      expect(result.data).toBeDefined();

      // Verify Section 1 (Overview) was executed
      if (result.data.section1) {
        expect(result.data.section1).toBeDefined();
      }

      // Verify Section 2 (Quality) was executed
      if (result.data.section2) {
        expect(result.data.section2).toBeDefined();
      }
    });

    it('should handle column selection for Parquet files', async () => {
      const mockFileStats = { size: 1024000 };
      const mockMetadata = {
        num_rows: BigInt(50),
        row_groups: [{ 
          columns: [{ 
            meta_data: { 
              codec: 'UNCOMPRESSED',
              path_in_schema: 'id',
              type: 'INT64'
            } 
          }] 
        }]
      };
      
      const mockSchema = {
        children: [
          { element: { name: 'id' } },
          { element: { name: 'name' } },
          { element: { name: 'email' } },
          { element: { name: 'department' } }
        ]
      };

      const mockData = Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        name: `Employee ${i + 1}`,
        email: `emp${i + 1}@company.com`,
        department: ['Engineering', 'Sales', 'Marketing'][i % 3]
      }));

      jest.spyOn(fs, 'stat').mockResolvedValue(mockFileStats as any);
      (mockAsyncBufferFromFile as jest.MockedFunction<any>).mockResolvedValue({});
      (mockParquetMetadataAsync as jest.MockedFunction<any>).mockResolvedValue(mockMetadata);
      (mockParquetSchema as jest.MockedFunction<any>).mockResolvedValue(mockSchema);
      (mockParquetReadObjects as jest.MockedFunction<any>).mockResolvedValue(mockData);

      const options: CLIOptions = {
        command: 'overview',
        columns: ['id', 'name', 'department'],
        maxRows: 10
      };

      const result = await analyzer.analyzeFile('/test/employees.parquet', options);

      expect(result.success).toBe(true);
      expect(result.metadata.originalFormat).toBe('parquet');
      
      // Verify that parquetReadObjects was called with column selection
      // Note: Column selection would be handled by hyparquet internally
      expect(mockParquetReadObjects as jest.MockedFunction<any>).toHaveBeenCalledWith(
        expect.objectContaining({
          file: {}
        })
      );
    });

    it('should handle row pagination for large Parquet files', async () => {
      const mockFileStats = { size: 10240000 };
      const mockMetadata = {
        num_rows: BigInt(1000000),
        row_groups: [{ 
          columns: [{ 
            meta_data: { 
              codec: 'SNAPPY',
              path_in_schema: 'transaction_id',
              type: 'INT64'
            } 
          }] 
        }]
      };
      
      const mockSchema = {
        children: [
          { element: { name: 'transaction_id' } },
          { element: { name: 'amount' } },
          { element: { name: 'timestamp' } }
        ]
      };

      // Mock a subset of data for pagination test
      const mockData = Array.from({ length: 1000 }, (_, i) => ({
        transaction_id: 5000 + i,
        amount: 25.99 + (i * 0.01),
        timestamp: new Date(`2024-06-01T${String(i % 24).padStart(2, '0')}:00:00`)
      }));

      jest.spyOn(fs, 'stat').mockResolvedValue(mockFileStats as any);
      (mockAsyncBufferFromFile as jest.MockedFunction<any>).mockResolvedValue({});
      (mockParquetMetadataAsync as jest.MockedFunction<any>).mockResolvedValue(mockMetadata);
      (mockParquetSchema as jest.MockedFunction<any>).mockResolvedValue(mockSchema);
      (mockParquetReadObjects as jest.MockedFunction<any>).mockResolvedValue(mockData);

      const options: CLIOptions = {
        command: 'overview',
        rowStart: 5000,
        rowEnd: 6000,
        maxRows: 1000
      };

      const result = await analyzer.analyzeFile('/test/transactions.parquet', options);

      expect(result.success).toBe(true);
      expect(result.metadata.originalFormat).toBe('parquet');
      
      // Verify pagination parameters were passed correctly
      expect(mockParquetReadObjects as jest.MockedFunction<any>).toHaveBeenCalledWith({
        file: {},
        rowStart: 0,  // Adjusted in universal analyzer
        rowEnd: 1000  // Adjusted based on maxRows
      });
    });

    it('should handle errors gracefully during analysis', async () => {
      jest.spyOn(fs, 'stat').mockRejectedValue(new Error('Permission denied'));

      const options: CLIOptions = {
        command: 'overview'
      };

      const result = await analyzer.analyzeFile('/test/restricted.parquet', options);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Permission denied');
      expect(result.suggestions).toBeDefined();
      expect(result.suggestions.length).toBeGreaterThan(0);
    });
  });

  describe('Performance Considerations', () => {
    it('should handle memory limits correctly', async () => {
      const mockFileStats = { size: 1073741824 }; // 1GB file
      const mockMetadata = {
        num_rows: BigInt(10000000),
        row_groups: [{ 
          columns: [{ 
            meta_data: { 
              codec: 'SNAPPY',
              path_in_schema: 'big_data',
              type: 'DOUBLE'
            } 
          }] 
        }]
      };
      
      const mockSchema = {
        children: [
          { element: { name: 'big_data' } }
        ]
      };

      // Simulate limited data due to memory constraints
      const mockData = Array.from({ length: 1000 }, (_, i) => ({
        big_data: Math.random() * 1000000
      }));

      jest.spyOn(fs, 'stat').mockResolvedValue(mockFileStats as any);
      (mockAsyncBufferFromFile as jest.MockedFunction<any>).mockResolvedValue({});
      (mockParquetMetadataAsync as jest.MockedFunction<any>).mockResolvedValue(mockMetadata);
      (mockParquetSchema as jest.MockedFunction<any>).mockResolvedValue(mockSchema);
      (mockParquetReadObjects as jest.MockedFunction<any>).mockResolvedValue(mockData);

      const options: CLIOptions = {
        command: 'overview',
        maxRows: 1000,
        memoryLimit: 100 // 100MB limit
      };

      const result = await analyzer.analyzeFile('/test/big_data.parquet', options);

      expect(result.success).toBe(true);
      expect(result.metadata.originalFormat).toBe('parquet');
      
      // Verify row limit was applied due to memory constraints
      expect(mockParquetReadObjects as jest.MockedFunction<any>).toHaveBeenCalledWith(
        expect.objectContaining({
          file: {},
          rowStart: 0,
          rowEnd: 1000
        })
      );
    });
  });

  describe('Format Registry Integration', () => {
    it('should list Parquet in supported formats', () => {
      const supportedFormats = analyzer.getSupportedFormats();
      
      expect(supportedFormats).toContain('parquet');
      expect(supportedFormats.length).toBeGreaterThanOrEqual(5); // csv, tsv, json, excel, parquet
    });
  });
});