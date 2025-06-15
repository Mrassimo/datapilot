/**
 * Custom Jest Matchers Type Declarations
 */

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidCSV(): R;
      toHaveValidStatistics(): R;
      toBeCloseToStatistic(expected: number, precision?: number): R;
      toBeOneOf(expected: any[]): R;
    }
  }
}

export {};