/**
 * E2E Test: Error Scenarios
 * 
 * Tests CLI error handling with invalid files, bad arguments, and edge cases.
 * Validates graceful failure with helpful error messages.
 */

import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('Error Scenarios E2E', () => {
  let tempDir: string;
  let cliPath: string;

  beforeAll(async () => {
    // Create temporary directory for test files
    tempDir = await fs.mkdtemp(join(tmpdir(), 'datapilot-errors-e2e-'));
    cliPath = join(process.cwd(), 'dist', 'cli', 'index.js');
    
    // Ensure CLI is built and executable
    await fs.access(cliPath);
    await fs.chmod(cliPath, '755');
  });

  afterAll(async () => {
    // Cleanup
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  it('should handle non-existent file gracefully', async () => {
    const nonExistentFile = join(tempDir, 'does-not-exist.csv');
    
    const result = await runCLI([
      'overview', nonExistentFile
    ]);

    expect(result.exitCode).not.toBe(0);
    expect(result.stderr.length).toBeGreaterThan(0);
    expect(result.stderr.toLowerCase()).toContain('file');
  }, 10000);

  it('should handle invalid CSV file gracefully', async () => {
    const invalidCsvPath = join(tempDir, 'invalid.csv');
    
    // Create a malformed CSV file
    const invalidContent = 'This is not a valid CSV file\nIt has random content\n';
    await fs.writeFile(invalidCsvPath, invalidContent, 'utf8');
    
    const result = await runCLI([
      'overview', invalidCsvPath
    ]);

    // Should either process gracefully or exit with helpful error
    if (result.exitCode !== 0) {
      expect(result.stderr.length).toBeGreaterThan(0);
    } else {
      // If it processes, should produce some output
      expect(result.stdout.length).toBeGreaterThan(0);
    }
  }, 10000);

  it('should handle empty CSV file gracefully', async () => {
    const emptyCsvPath = join(tempDir, 'empty.csv');
    await fs.writeFile(emptyCsvPath, '', 'utf8');
    
    const result = await runCLI([
      'overview', emptyCsvPath
    ]);

    // Should handle empty files appropriately
    if (result.exitCode !== 0) {
      expect(result.stderr.length).toBeGreaterThan(0);
    } else {
      expect(result.stdout.length).toBeGreaterThan(0);
    }
  }, 10000);

  it('should handle invalid command arguments', async () => {
    const result = await runCLI([
      'invalid-command', 'some-file.csv'
    ]);

    expect(result.exitCode).not.toBe(0);
    expect(result.stderr.length).toBeGreaterThan(0);
  }, 5000);

  it('should handle missing file argument', async () => {
    const result = await runCLI([
      'overview'
    ]);

    expect(result.exitCode).not.toBe(0);
    expect(result.stderr.length).toBeGreaterThan(0);
  }, 5000);

  it('should handle invalid command options', async () => {
    const validCsvPath = join(tempDir, 'valid.csv');
    await fs.writeFile(validCsvPath, 'col1,col2\nval1,val2\n', 'utf8');
    
    const result = await runCLI([
      'overview', validCsvPath,
      '--invalid-option'
    ]);

    expect(result.exitCode).not.toBe(0);
    expect(result.stderr.length).toBeGreaterThan(0);
  }, 10000);

  it('should handle very large timeout gracefully', async () => {
    const validCsvPath = join(tempDir, 'valid.csv');
    await fs.writeFile(validCsvPath, 'col1,col2\nval1,val2\n', 'utf8');
    
    const result = await runCLI([
      'overview', validCsvPath,
      '--verbose'
    ]);

    // Should complete successfully even with verbose output
    expect(result.exitCode).toBe(0);
  }, 10000);

  // Helper function to run CLI commands
  async function runCLI(args: string[]): Promise<{
    exitCode: number;
    stdout: string;
    stderr: string;
  }> {
    return new Promise((resolve, reject) => {
      const child = spawn('node', [cliPath, ...args], {
        cwd: process.cwd(),
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      child.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        resolve({
          exitCode: code || 0,
          stdout: stdout.trim(),
          stderr: stderr.trim()
        });
      });

      child.on('error', (error) => {
        reject(error);
      });

      // Timeout after 15 seconds
      setTimeout(() => {
        child.kill();
        reject(new Error('CLI command timed out'));
      }, 15000);
    });
  }
});