/**
 * E2E Test: Output Formats
 * 
 * Tests all supported output formats work correctly from CLI.
 * Validates JSON, YAML, and Markdown outputs are valid and complete.
 */

import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('Output Formats E2E', () => {
  let tempDir: string;
  let testCsvPath: string;
  let cliPath: string;

  beforeAll(async () => {
    // Create temporary directory for test files
    tempDir = await fs.mkdtemp(join(tmpdir(), 'datapilot-formats-e2e-'));
    testCsvPath = join(tempDir, 'sample-data.csv');
    cliPath = join(process.cwd(), 'dist', 'cli', 'index.js');
    
    // Create simple but valid test CSV
    const testCsvContent = [
      'product,price,category,in_stock',
      'Laptop,999.99,Electronics,true',
      'Book,12.50,Education,true', 
      'Chair,89.99,Furniture,false',
      'Phone,599.00,Electronics,true',
      'Desk,199.99,Furniture,true'
    ].join('\n');
    
    await fs.writeFile(testCsvPath, testCsvContent, 'utf8');

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

  it('should generate valid JSON output', async () => {
    const result = await runCLI([
      'overview', testCsvPath,
      '--format', 'json',
      '--quiet'
    ], tempDir);

    expect(result.exitCode).toBe(0);

    // Check for generated JSON file in working directory
    let jsonFile: string | undefined;
    let jsonPath: string;

    // Check in tempDir first
    const tempFiles = await fs.readdir(tempDir);
    jsonFile = tempFiles.find(f => f.includes('sample-data') && f.endsWith('.json'));
    
    if (jsonFile) {
      jsonPath = join(tempDir, jsonFile);
    } else {
      // Check in current working directory
      const cwdFiles = await fs.readdir(process.cwd());
      jsonFile = cwdFiles.find(f => f.includes('sample-data') && f.endsWith('.json'));
      expect(jsonFile).toBeDefined();
      jsonPath = join(process.cwd(), jsonFile!);
    }
    
    const content = await fs.readFile(jsonPath, 'utf8');
    expect(() => JSON.parse(content)).not.toThrow();
    const parsed = JSON.parse(content);
    expect(parsed).toHaveProperty('overview');
    
    // Cleanup
    try {
      await fs.unlink(jsonPath);
    } catch (error) {
      // Ignore cleanup errors
    }
  }, 10000);

  it('should generate valid YAML output', async () => {
    const result = await runCLI([
      'overview', testCsvPath,
      '--format', 'yaml',
      '--quiet'
    ], tempDir);

    expect(result.exitCode).toBe(0);

    // Check for generated YAML file in working directory
    let yamlFile: string | undefined;
    let yamlPath: string;

    // Check in tempDir first
    const tempFiles = await fs.readdir(tempDir);
    yamlFile = tempFiles.find(f => f.includes('sample-data') && (f.endsWith('.yaml') || f.endsWith('.yml')));
    
    if (yamlFile) {
      yamlPath = join(tempDir, yamlFile);
    } else {
      // Check in current working directory
      const cwdFiles = await fs.readdir(process.cwd());
      yamlFile = cwdFiles.find(f => f.includes('sample-data') && (f.endsWith('.yaml') || f.endsWith('.yml')));
      expect(yamlFile).toBeDefined();
      yamlPath = join(process.cwd(), yamlFile!);
    }
    
    const content = await fs.readFile(yamlPath, 'utf8');
    expect(content).toMatch(/^[a-zA-Z]/);
    expect(content).toContain(':');
    expect(content).toContain('overview');
    
    // Cleanup
    try {
      await fs.unlink(yamlPath);
    } catch (error) {
      // Ignore cleanup errors
    }
  }, 10000);

  it('should generate valid Markdown output', async () => {
    const result = await runCLI([
      'overview', testCsvPath,
      '--format', 'markdown',
      '--quiet'
    ], tempDir);

    expect(result.exitCode).toBe(0);

    // Check for generated Markdown file in working directory
    let mdFile: string | undefined;
    let mdPath: string;

    // Check in tempDir first
    const tempFiles = await fs.readdir(tempDir);
    mdFile = tempFiles.find(f => f.includes('sample-data') && f.endsWith('.md'));
    
    if (mdFile) {
      mdPath = join(tempDir, mdFile);
    } else {
      // Check in current working directory
      const cwdFiles = await fs.readdir(process.cwd());
      mdFile = cwdFiles.find(f => f.includes('sample-data') && f.endsWith('.md'));
      expect(mdFile).toBeDefined();
      mdPath = join(process.cwd(), mdFile!);
    }
    
    const content = await fs.readFile(mdPath, 'utf8');
    expect(content.length).toBeGreaterThan(50);
    
    // Should contain Markdown structure
    expect(content).toContain('# DataPilot Analysis Report');
    expect(content).toMatch(/^#/m); // Should have headers
    expect(content).toContain('sample-data.csv');
    
    // Cleanup
    try {
      await fs.unlink(mdPath);
    } catch (error) {
      // Ignore cleanup errors
    }
  }, 10000);

  it('should handle different command options', async () => {
    const result = await runCLI([
      'overview', testCsvPath,
      '--verbose'
    ]);

    expect(result.exitCode).toBe(0);
    // In verbose mode, should have some output
    expect(result.stdout.length + result.stderr.length).toBeGreaterThan(0);
  }, 10000);

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