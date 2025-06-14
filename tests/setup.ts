/**
 * Jest Test Setup - Clean and Fast
 */

// Disable all console output during tests
const originalConsole = global.console;
global.console = {
  ...originalConsole,
  log: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: originalConsole.error, // Keep errors for debugging
};

// Global test timeout (should be fast)
jest.setTimeout(5000);

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
  jest.restoreAllMocks();
});

// Custom matchers for DataPilot testing
expect.extend({
  toBeValidCSV(received: string) {
    const lines = received.split('\n').filter(line => line.trim());
    const pass = lines.length >= 2; // At least header + 1 data row
    
    return {
      message: () => `Expected valid CSV with header and data rows`,
      pass,
    };
  },
  
  toHaveValidStatistics(received: any) {
    const required = ['mean', 'median', 'standardDeviation'];
    const pass = required.every(key => 
      key in received && typeof received[key] === 'number' && !isNaN(received[key])
    );
    
    return {
      message: () => `Expected object to have valid statistics: ${required.join(', ')}`,
      pass,
    };
  },
  
  toBeCloseToStatistic(received: number, expected: number, precision = 2) {
    const pass = Math.abs(received - expected) < Math.pow(10, -precision);
    
    return {
      message: () => `Expected ${received} to be within ${precision} decimal places of ${expected}`,
      pass,
    };
  },
});

