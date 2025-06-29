/**
 * Shared Data Quality Utilities
 * Provides consistent calculations across all sections to prevent inter-section discrepancies
 */

export interface UniquenessResult {
  uniqueCount: number;
  uniquePercentage: number;
  duplicateCount: number;
  totalNonNullValues: number;
}

/**
 * Standardized uniqueness calculation used across all sections
 * Fixes inter-section consistency bug where Section 2 and Section 4 report different statistics
 */
export function calculateUniqueness(
  data: (string | null | undefined)[][],
  columnIndex: number,
  normalizeValue?: (value: string | null | undefined) => string | null
): UniquenessResult {
  const valueMap = new Map<string, number>();
  let nonNullCount = 0;

  // Default normalization function if none provided
  const normalize = normalizeValue || defaultNormalizeValue;

  for (let rowIdx = 0; rowIdx < data.length; rowIdx++) {
    const value = normalize(data[rowIdx]?.[columnIndex]);
    if (value !== null) {
      nonNullCount++;
      const key = String(value);
      valueMap.set(key, (valueMap.get(key) || 0) + 1);
    }
  }

  const uniqueCount = valueMap.size;
  const uniquePercentage = nonNullCount > 0 ? (uniqueCount / nonNullCount) * 100 : 0;
  const duplicateCount = nonNullCount - uniqueCount;

  return {
    uniqueCount,
    uniquePercentage: Number(uniquePercentage.toFixed(2)), // Consistent rounding to 2 decimal places
    duplicateCount,
    totalNonNullValues: nonNullCount,
  };
}

/**
 * Default value normalization - consistent across sections
 */
export function defaultNormalizeValue(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const trimmed = String(value).trim();
  if (trimmed === '' || trimmed.toLowerCase() === 'null' || trimmed.toLowerCase() === 'na') {
    return null;
  }
  return trimmed;
}

/**
 * Calculate uniqueness for multiple columns efficiently
 */
export function calculateColumnUniqueness(
  data: (string | null | undefined)[][],
  headers: string[],
  normalizeValue?: (value: string | null | undefined) => string | null
): Array<{
  columnName: string;
  uniqueCount: number;
  uniquePercentage: number;
  duplicateCount: number;
  totalNonNullValues: number;
}> {
  return headers.map((columnName, colIdx) => {
    const result = calculateUniqueness(data, colIdx, normalizeValue);
    return {
      columnName,
      ...result,
    };
  });
}