/**
 * Parquet Parser Tests
 */

import { jest } from '@jest/globals';
import { ParquetParser, ParquetDetector, createParquetParser } from '../../src/parsers/parquet-parser';
import type { ParseOptions } from '../../src/parsers/base/data-parser';
import { promises as fs } from 'fs';
import * as path from 'path';

// Mock hyparquet module - Jest will automatically use manual mock from __mocks__
jest.mock('hyparquet');

import {
  asyncBufferFromUrl as mockAsyncBufferFromFile,
  parquetReadObjects as mockParquetReadObjects,
  parquetMetadataAsync as mockParquetMetadataAsync,
  parquetSchema as mockParquetSchema
} from 'hyparquet';

describe('ParquetDetector', () => {
  let detector: ParquetDetector;

  beforeEach(() => {
    detector = new ParquetDetector();
    jest.clearAllMocks();
  });

  describe('getSupportedExtensions', () => {
    it('should return correct Parquet extensions', () => {
      expect(detector.getSupportedExtensions()).toEqual(['.parquet']);
    });
  });

  describe('getFormatName', () => {
    it('should return "parquet"', () => {
      expect(detector.getFormatName()).toBe('parquet');
    });
  });

  describe('detect', () => {
    it('should detect valid Parquet file with high confidence', async () => {
      const mockMetadata = {
        num_rows: BigInt(1000),
        row_groups: [{ 
          columns: [{ 
            meta_data: { 
              codec: 'SNAPPY',
              path_in_schema: 'column1',
              type: 'INT64'
            } 
          }] 
        }]
      };
      
      const mockSchema = {
        children: [
          { element: { name: 'id' } },
          { element: { name: 'name' } },
          { element: { name: 'value' } }
        ]
      };

      jest.spyOn(fs, 'stat').mockResolvedValue({ size: 1024000 } as any);
      (mockAsyncBufferFromFile as jest.MockedFunction<any>).mockResolvedValue({});
      (mockParquetMetadataAsync as jest.MockedFunction<any>).mockResolvedValue(mockMetadata);
      (mockParquetSchema as jest.MockedFunction<any>).mockResolvedValue(mockSchema);

      const result = await detector.detect('/test/file.parquet');

      expect(result.format).toBe('parquet');
      expect(result.confidence).toBeGreaterThan(0.9);
      expect(result.estimatedRows).toBe(1000);
      expect(result.estimatedColumns).toBe(3);
      expect(result.metadata.columnNames).toEqual(['id', 'name', 'value']);
    });

    it('should return low confidence for non-parquet extension', async () => {
      const result = await detector.detect('/test/file.csv');

      expect(result.format).toBe('parquet');
      expect(result.confidence).toBe(0);
      expect(result.metadata.reason).toBe('Unsupported extension');
    });

    it('should handle detection errors gracefully', async () => {
      jest.spyOn(fs, 'stat').mockRejectedValue(new Error('File not found'));

      const result = await detector.detect('/test/nonexistent.parquet');

      expect(result.format).toBe('parquet');
      expect(result.confidence).toBe(0);
      expect(result.metadata.error).toBe('File not found');
    });
  });
});

describe('ParquetParser', () => {
  let parser: ParquetParser;

  beforeEach(() => {
    parser = new ParquetParser();
    jest.clearAllMocks();
  });

  describe('getSupportedExtensions', () => {
    it('should return correct Parquet extensions', () => {
      expect(parser.getSupportedExtensions()).toEqual(['.parquet']);
    });
  });

  describe('getFormatName', () => {
    it('should return "parquet"', () => {
      expect(parser.getFormatName()).toBe('parquet');
    });
  });

  describe('parse', () => {
    it('should parse Parquet data correctly', async () => {
      const mockFileStats = { size: 1024000 };
      const mockMetadata = {
        num_rows: BigInt(3),
        row_groups: [{ 
          columns: [{ 
            meta_data: { 
              codec: 'SNAPPY',
              path_in_schema: 'column1',
              type: 'INT64'
            } 
          }] 
        }]
      };
      
      const mockSchema = {
        children: [
          { element: { name: 'id' } },
          { element: { name: 'name' } },
          { element: { name: 'value' } }
        ]
      };

      const mockData = [
        { id: 1, name: 'Alice', value: 100.5 },
        { id: 2, name: 'Bob', value: 200.7 },
        { id: 3, name: 'Charlie', value: 300.9 }
      ];

      jest.spyOn(fs, 'stat').mockResolvedValue(mockFileStats as any);
      (mockAsyncBufferFromFile as jest.MockedFunction<any>).mockResolvedValue({});
      (mockParquetMetadataAsync as jest.MockedFunction<any>).mockResolvedValue(mockMetadata);
      (mockParquetSchema as jest.MockedFunction<any>).mockResolvedValue(mockSchema);
      (mockParquetReadObjects as jest.MockedFunction<any>).mockResolvedValue(mockData);

      const rows = [];
      for await (const row of parser.parse('/test/data.parquet')) {
        rows.push(row);
      }

      expect(rows).toHaveLength(3);
      expect(rows[0]).toEqual({
        index: 0,
        data: ['1', 'Alice', '100.5'],
        raw: JSON.stringify(mockData[0]),
        metadata: {
          originalType: 'parquet',
          rowGroups: 1,
          compressionType: 'SNAPPY',
          columnCount: 3
        }
      });
    });

    it('should handle maxRows option', async () => {
      const mockFileStats = { size: 1024000 };
      const mockMetadata = {
        num_rows: BigInt(1000),
        row_groups: [{ 
          columns: [{ 
            meta_data: { 
              codec: 'SNAPPY',
              path_in_schema: 'column1',
              type: 'INT64'
            } 
          }] 
        }]
      };
      
      const mockSchema = {
        children: [
          { element: { name: 'id' } },
          { element: { name: 'value' } }
        ]
      };

      const mockData = [
        { id: 1, value: 100 },
        { id: 2, value: 200 }
      ];

      jest.spyOn(fs, 'stat').mockResolvedValue(mockFileStats as any);
      (mockAsyncBufferFromFile as jest.MockedFunction<any>).mockResolvedValue({});
      (mockParquetMetadataAsync as jest.MockedFunction<any>).mockResolvedValue(mockMetadata);
      (mockParquetSchema as jest.MockedFunction<any>).mockResolvedValue(mockSchema);
      (mockParquetReadObjects as jest.MockedFunction<any>).mockResolvedValue(mockData);

      const options: ParseOptions = { maxRows: 2 };
      const rows = [];
      for await (const row of parser.parse('/test/data.parquet', options)) {
        rows.push(row);
      }

      expect(rows).toHaveLength(2);
      expect(mockParquetReadObjects as jest.MockedFunction<any>).toHaveBeenCalledWith({
        file: {},
        rowStart: 0,
        rowEnd: 2
      });
    });

    it('should handle different data types correctly', async () => {
      const mockFileStats = { size: 1024000 };
      const mockMetadata = {
        num_rows: BigInt(1),
        row_groups: [{ 
          columns: [{ 
            meta_data: { 
              codec: 'UNCOMPRESSED',
              path_in_schema: 'column1',
              type: 'INT64'
            } 
          }] 
        }]
      };
      
      const mockSchema = {
        children: [
          { element: { name: 'bigint_val' } },
          { element: { name: 'date_val' } },
          { element: { name: 'bool_val' } },
          { element: { name: 'array_val' } },
          { element: { name: 'null_val' } }
        ]
      };

      const mockData = [{
        bigint_val: BigInt(9007199254740991),
        date_val: new Date('2024-01-01'),
        bool_val: true,
        array_val: [1, 2, 3],
        null_val: null
      }];

      jest.spyOn(fs, 'stat').mockResolvedValue(mockFileStats as any);
      (mockAsyncBufferFromFile as jest.MockedFunction<any>).mockResolvedValue({});
      (mockParquetMetadataAsync as jest.MockedFunction<any>).mockResolvedValue(mockMetadata);
      (mockParquetSchema as jest.MockedFunction<any>).mockResolvedValue(mockSchema);
      (mockParquetReadObjects as jest.MockedFunction<any>).mockResolvedValue(mockData);

      const rows = [];
      for await (const row of parser.parse('/test/data.parquet')) {
        rows.push(row);
      }

      expect(rows[0].data).toEqual([
        '9007199254740991', // BigInt converted to string
        '2024-01-01',       // Date converted to YYYY-MM-DD
        'true',             // Boolean converted to string
        '1;2;3',           // Array joined with semicolons
        ''                  // null converted to empty string
      ]);
    });

    it('should handle parsing errors gracefully', async () => {
      jest.spyOn(fs, 'stat').mockRejectedValue(new Error('File not found'));

      await expect(async () => {
        for await (const row of parser.parse('/test/nonexistent.parquet')) {
          // Should not reach here
        }
      }).rejects.toThrow('Parquet parsing failed: File not found');
    });
  });

  describe('getHeaders', () => {
    it('should return headers after parsing', async () => {
      const mockFileStats = { size: 1024000 };
      const mockMetadata = {
        num_rows: BigInt(1),
        row_groups: [{ 
          columns: [{ 
            meta_data: { 
              codec: 'SNAPPY',
              path_in_schema: 'column1',
              type: 'INT64'
            } 
          }] 
        }]
      };
      
      const mockSchema = {
        children: [
          { element: { name: 'col1' } },
          { element: { name: 'col2' } }
        ]
      };

      const mockData = [{ col1: 'value1', col2: 'value2' }];

      jest.spyOn(fs, 'stat').mockResolvedValue(mockFileStats as any);
      (mockAsyncBufferFromFile as jest.MockedFunction<any>).mockResolvedValue({});
      (mockParquetMetadataAsync as jest.MockedFunction<any>).mockResolvedValue(mockMetadata);
      (mockParquetSchema as jest.MockedFunction<any>).mockResolvedValue(mockSchema);
      (mockParquetReadObjects as jest.MockedFunction<any>).mockResolvedValue(mockData);

      // Parse to populate headers
      for await (const row of parser.parse('/test/data.parquet')) {
        break; // Just parse one row
      }

      expect(parser.getHeaders()).toEqual(['col1', 'col2']);
    });
  });

  describe('getSchema', () => {
    it('should return Parquet schema', async () => {
      const mockSchema = {
        children: [
          { element: { name: 'id', type: 'INT64' } },
          { element: { name: 'name', type: 'UTF8' } }
        ]
      };

      mockAsyncBufferFromFile.mockResolvedValue({} as any);
      mockParquetMetadataAsync.mockResolvedValue({} as any);
      mockParquetSchema.mockResolvedValue(mockSchema as any);

      const schema = await parser.getSchema('/test/data.parquet');

      expect(schema).toEqual(mockSchema);
      expect(mockAsyncBufferFromFile as jest.MockedFunction<any>).toHaveBeenCalledWith('/test/data.parquet');
    });
  });

  describe('getRowGroups', () => {
    it('should return row group information', async () => {
      const mockMetadata = {
        row_groups: [
          {
            num_rows: BigInt(1000),
            total_byte_size: BigInt(65536),
            columns: [
              {
                meta_data: {
                  path_in_schema: 'id',
                  type: 'INT64',
                  codec: 'SNAPPY'
                }
              }
            ]
          },
          {
            num_rows: BigInt(500),
            total_byte_size: BigInt(32768),
            columns: [
              {
                meta_data: {
                  path_in_schema: 'name',
                  type: 'UTF8',
                  codec: 'GZIP'
                }
              }
            ]
          }
        ]
      };

      mockAsyncBufferFromFile.mockResolvedValue({} as any);
      mockParquetMetadataAsync.mockResolvedValue(mockMetadata as any);

      const rowGroups = await parser.getRowGroups('/test/data.parquet');

      expect(rowGroups).toEqual([
        {
          index: 0,
          numRows: 1000,
          totalByteSize: 65536,
          columns: [
            {
              name: 'id',
              type: 'INT64',
              compression: 'SNAPPY'
            }
          ]
        },
        {
          index: 1,
          numRows: 500,
          totalByteSize: 32768,
          columns: [
            {
              name: 'name',
              type: 'UTF8',
              compression: 'GZIP'
            }
          ]
        }
      ]);
    });
  });
});

describe('createParquetParser', () => {
  it('should create ParquetParser instance', () => {
    const parser = createParquetParser();
    expect(parser).toBeInstanceOf(ParquetParser);
  });

  it('should create ParquetParser with options', () => {
    const options: ParseOptions = { maxRows: 100 };
    const parser = createParquetParser(options);
    expect(parser).toBeInstanceOf(ParquetParser);
  });
});