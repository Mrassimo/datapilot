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
    const result = execSync(`node "${cliPath}" --help`, { encoding: 'utf8' });
    expect(result).toContain('Usage: datapilot');
    expect(result).toContain('Commands:');
  });

  it('should execute CLI version command', () => {
    const result = execSync(`node "${cliPath}" --version`, { encoding: 'utf8' });
    expect(result).toContain('1.4.0');
  });

  it('should analyze CSV file with overview command', () => {
    const result = execSync(`node "${cliPath}" overview "${testCsv}" --output json`, { encoding: 'utf8' });
    expect(result).toContain('Report written to:');
    expect(result).toContain('Summary:');
    expect(result).toContain('Processing time:');
  });

  it('should run complete analysis with all command', () => {
    const outputFile = join(__dirname, 'test-output.md');
    const result = execSync(`node "${cliPath}" all "${testCsv}" --output-file "${outputFile}"`, { encoding: 'utf8' });
    expect(result).toContain('Report written to:');
    expect(result).toContain('Summary:');
    
    // Cleanup
    if (existsSync(outputFile)) {
      unlinkSync(outputFile);
    }
  });
});