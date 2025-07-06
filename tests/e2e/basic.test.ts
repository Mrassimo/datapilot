/**
 * Basic E2E Test Suite
 * Tests the CLI in real execution scenarios
 */

import { execSync } from 'child_process';
import { writeFileSync, unlinkSync, existsSync } from 'fs';
import { join } from 'path';

describe('DataPilot CLI E2E Tests', () => {
  const testCsv = join(__dirname, 'test-data.csv');
  const cliPath = join(__dirname, '../../dist/cli/index.js');

  beforeAll(() => {
    // Create test CSV file
    const csvContent = `name,age,score
Alice,25,95
Bob,30,87
Charlie,35,92`;
    writeFileSync(testCsv, csvContent);
  });

  afterAll(() => {
    // Cleanup test file
    if (existsSync(testCsv)) {
      unlinkSync(testCsv);
    }
  });

  it('should execute CLI help command', () => {
    const result = execSync(`node "${cliPath}" --help`, { 
      encoding: 'utf8',
      timeout: 15000, // 15 seconds timeout for CI compatibility
      maxBuffer: 1024 * 1024 // 1MB buffer
    });
    expect(result).toContain('Usage: datapilot');
    expect(result).toContain('Commands:');
  });

  it('should execute CLI version command', () => {
    const result = execSync(`node "${cliPath}" --version`, { 
      encoding: 'utf8',
      timeout: 15000, // 15 seconds timeout for CI compatibility
      maxBuffer: 1024 * 1024 // 1MB buffer
    });
    expect(result).toContain('1.7.0');
  });

  it('should analyze CSV file with overview command', () => {
    const result = execSync(`node "${cliPath}" overview "${testCsv}" -f json`, { 
      encoding: 'utf8',
      timeout: 30000, // 30 seconds timeout for data processing
      maxBuffer: 1024 * 1024 // 1MB buffer
    });
    expect(result).toContain('Report written to:');
    expect(result).toContain('Selected parser: csv');
    expect(result).toContain('Detected format: csv');
  });

  it('should run complete analysis with all command', () => {
    const result = execSync(`node "${cliPath}" all "${testCsv}"`, { 
      encoding: 'utf8',
      timeout: 45000, // 45 seconds timeout for complete analysis
      maxBuffer: 2 * 1024 * 1024 // 2MB buffer for full analysis output
    });
    expect(result).toContain('Report written to:');
    expect(result).toContain('Sequential execution completed successfully');
  });
});