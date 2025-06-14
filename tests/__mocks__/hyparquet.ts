/**
 * Manual mock for hyparquet module
 * Jest struggles with dynamic ES module imports, so we provide a manual mock
 */

import { jest } from '@jest/globals';

export const asyncBufferFromFile = jest.fn();
export const asyncBufferFromUrl = jest.fn();
export const parquetReadObjects = jest.fn();
export const parquetMetadataAsync = jest.fn().mockResolvedValue({
  num_rows: BigInt(0),
  row_groups: []
});
export const parquetSchema = jest.fn().mockReturnValue({
  children: []
});

// Default export (if needed)
export default {
  asyncBufferFromFile,
  asyncBufferFromUrl,
  parquetReadObjects,
  parquetMetadataAsync,
  parquetSchema
};