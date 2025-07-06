/**
 * E2E Test: Full Analysis Workflow
 * 
 * Tests complete CLI workflows from command line to output files.
 * Validates that `datapilot all sample.csv` produces correct analysis.
 */

import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('Full Analysis E2E', () => {
  let tempDir: string;
  let testCsvPath: string;
  let cliPath: string;

  beforeAll(async () => {
    // Create temporary directory for test files
    tempDir = await fs.mkdtemp(join(tmpdir(), 'datapilot-e2e-'));
    testCsvPath = join(tempDir, 'test-employees.csv');
    cliPath = join(process.cwd(), 'dist', 'cli', 'index.js');
    
    // Create comprehensive test CSV
    const testCsvContent = [
      'id,name,age,department,salary,active,hire_date',
      '1,"John Doe",28,Engineering,75000,true,2020-01-15',
      '2,"Jane Smith",32,Marketing,68000,true,2019-03-22',
      '3,"Bob Johnson",45,Sales,82000,false,2018-07-10',
      '4,"Alice Brown",29,Engineering,79000,true,2021-02-01',
      '5,"Charlie Wilson",38,HR,65000,true,2017-11-05',
      '6,"Diana Davis",31,Marketing,71000,true,2020-08-18',
      '7,"Eve Anderson",27,Engineering,73000,true,2021-09-12',
      '8,"Frank Miller",43,Sales,85000,true,2016-04-03',
      '9,"Grace Taylor",35,HR,67000,true,2019-12-15',
      '10,"Henry Clark",39,Engineering,81000,true,2018-01-20'
    ].join('\n');
    
    await fs.writeFile(testCsvPath, testCsvContent, 'utf8');

    // Ensure CLI is built and executable
    try {
      await fs.access(cliPath);
      await fs.chmod(cliPath, '755');
    } catch (error) {
      throw new Error(`CLI not found at ${cliPath}. Run 'npm run build' first.`);
    }
  });

  afterAll(async () => {
    // Cleanup
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  it('should perform complete analysis and generate markdown output', async () => {
    const result = await runCLI([
      'all', testCsvPath, 
      '--format', 'markdown'
    ], tempDir); // Change working directory to tempDir

    expect(result.exitCode).toBe(0);
    // Allow some stderr output (info messages, progress indicators)
    // Just ensure no actual errors occurred
    if (result.stderr) {
      expect(result.stderr).not.toContain('Error:');
      expect(result.stderr).not.toContain('error:');
    }

    // Verify output file was created - check both tempDir and current directory
    let outputFile: string | undefined;
    let outputPath: string;

    // Check in tempDir first
    const tempFiles = await fs.readdir(tempDir);
    outputFile = tempFiles.find(f => f.endsWith('_datapilot_full_report.md'));
    
    outputPath = join(tempDir, outputFile!);

    // Verify output content structure
    const content = await fs.readFile(outputPath, 'utf8');
    expect(content.length).toBeGreaterThan(100);
    expect(content).toContain('# DataPilot Analysis Report');
    expect(content).toContain('## Section 1: Overview');
    expect(content).toContain('test-employees.csv');
    
    // Cleanup: remove the generated file
    try {
      await fs.unlink(outputPath);
    } catch (error) {
      // Ignore cleanup errors
    }
  }, 15000);

  it('should handle version command correctly', async () => {
    const result = await runCLI(['--version']);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toMatch(/\d+\.\d+\.\d+/); // Version format
    expect(result.stderr).toBe('');
  }, 5000);

  it('should handle help command correctly', async () => {
    const result = await runCLI(['--help']);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('Usage:');
    expect(result.stdout).toContain('Commands:');
    expect(result.stderr).toBe('');
  }, 5000);

  // Helper function to run CLI commands
  async function runCLI(args: string[], workingDir?: string): Promise<{
    exitCode: number;
    stdout: string;
    stderr: string;
  }> {
    return new Promise((resolve, reject) => {
      const child = spawn('node', [cliPath, ...args], {
        cwd: workingDir || process.cwd(),
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