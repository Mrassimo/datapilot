/**
 * Manual mock for hyparquet module
 * Jest struggles with dynamic ES module imports, so we provide a manual mock
 */

import { jest } from '@jest/globals';

export const asyncBufferFromFile = jest.fn().mockResolvedValue({});
export const asyncBufferFromUrl = jest.fn().mockResolvedValue({});
export const parquetReadObjects = jest.fn().mockResolvedValue([]);
export const parquetMetadataAsync = jest.fn().mockResolvedValue({
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
});
export const parquetSchema = jest.fn().mockReturnValue({
  children: [
    { element: { name: 'id' } },
    { element: { name: 'name' } },
    { element: { name: 'value' } }
  ]
});

// Default export (if needed)
export default {
  asyncBufferFromFile,
  asyncBufferFromUrl,
  parquetReadObjects,
  parquetMetadataAsync,
  parquetSchema
};