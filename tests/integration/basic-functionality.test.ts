/**
 * Basic Functionality Integration Test
 * 
 * Minimal test to ensure core DataPilot functionality works
 * without expecting new commands that haven't been implemented yet.
 */

import { promises as fs } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { DataPilotCLI } from '../../src/cli';
import type { CLIResult } from '../../src/cli/types';

describe('Basic Functionality Integration', () => {
  let tempDir: string;
  let testCsvPath: string;
  let cli: DataPilotCLI;

  beforeAll(async () => {
    // Create temporary directory for test files
    tempDir = await fs.mkdtemp(join(tmpdir(), 'datapilot-basic-test-'));
    testCsvPath = join(tempDir, 'simple.csv');
    
    // Create simple test CSV
    const testData = [
      'id,name,value',
      '1,"Test One",100',
      '2,"Test Two",200',
      '3,"Test Three",300'
    ].join('\n');
    
    await fs.writeFile(testCsvPath, testData, 'utf8');
  });

  beforeEach(() => {
    cli = new DataPilotCLI();
  });

  afterAll(async () => {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  it('should execute overview command without errors', async () => {
    const result = await cli.run(['node', 'datapilot', 'overview', testCsvPath]);
    
    expect(result.success).toBe(true);
    expect(result.exitCode).toBe(0);
    expect(result.data).toBeDefined();
  });

  it('should handle file not found error gracefully', async () => {
    const result = await cli.run(['node', 'datapilot', 'overview', 'nonexistent.csv']);
    
    expect(result.success).toBe(false);
    expect(result.exitCode).toBe(1);
  });

  it('should handle missing file argument gracefully', async () => {
    const result = await cli.run(['node', 'datapilot', 'overview']);
    
    expect(result.success).toBe(false);
    expect(result.exitCode).toBe(1);
  });

  it('should complete analysis in reasonable time', async () => {
    const startTime = Date.now();
    const result = await cli.run(['node', 'datapilot', 'overview', testCsvPath]);
    const endTime = Date.now();
    
    expect(result.success).toBe(true);
    const durationMs = endTime - startTime;
    expect(durationMs).toBeLessThan(5000); // 5 seconds max for simple file
  });

  it('should maintain result structure integrity', async () => {
    const result = await cli.run(['node', 'datapilot', 'overview', testCsvPath]);
    
    expect(result).toHaveProperty('success');
    expect(result).toHaveProperty('exitCode');
    expect(result).toHaveProperty('data');
    
    if (result.success) {
      expect(result.data).toBeDefined();
      expect(typeof result.data).toBe('object');
    }
  });
});
