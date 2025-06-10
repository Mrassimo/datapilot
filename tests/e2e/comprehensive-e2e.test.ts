/**
 * Comprehensive End-to-End Test Suite for DataPilot
 * Tests the complete application lifecycle: installation, CLI usage, analysis pipeline, and output generation
 */

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { execSync, spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const CLI_PATH = path.resolve('./dist/cli/index.js');
const TEST_DATA_DIR = path.resolve('./test-datasets/kaggle');
const OUTPUT_DIR = path.resolve('./e2e-test-outputs');

describe('DataPilot E2E Testing Suite', () => {
  beforeAll(() => {
    // Ensure CLI is built
    try {
      execSync('npm run build', { stdio: 'inherit' });
    } catch (error) {
      console.error('Build failed:', error);
      throw error;
    }

    // Create output directory
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    // Verify CLI exists
    if (!fs.existsSync(CLI_PATH)) {
      throw new Error(`CLI not found at ${CLI_PATH}`);
    }
  });

  afterAll(() => {
    // Cleanup test outputs (optional)
    try {
      fs.rmSync(OUTPUT_DIR, { recursive: true, force: true });
    } catch (error) {
      console.warn('Failed to cleanup test outputs:', error);
    }
  });

  describe('Installation & Setup', () => {
    test('should install globally and be available in PATH', async () => {
      // Test global installation
      const result = execSync('npm run test:installation', { encoding: 'utf8' });
      expect(result).toContain('✅');
    });

    test('should display version information', () => {
      const result = execSync(`node ${CLI_PATH} --version`, { encoding: 'utf8' });
      expect(result.split('\n')[0].trim()).toMatch(/^\d+\.\d+\.\d+$/);
    });

    test('should display help information', () => {
      const result = execSync(`node ${CLI_PATH} --help`, { encoding: 'utf8' });
      expect(result).toContain('Usage:');
      expect(result).toContain('datapilot');
      expect(result).toContain('Options:');
    });
  });

  describe('File Format Support', () => {
    test('should analyze CSV files', async () => {
      const csvFile = path.join(TEST_DATA_DIR, 'student_habits_performance.csv');
      const outputFile = path.join(OUTPUT_DIR, 'csv-analysis.md');
      
      if (!fs.existsSync(csvFile)) {
        console.warn(`Test file not found: ${csvFile}`);
        return;
      }

      const result = execSync(
        `node ${CLI_PATH} all "${csvFile}" --output markdown --output-file "${outputFile}"`,
        { encoding: 'utf8', timeout: 60000 }
      );

      expect(fs.existsSync(outputFile)).toBe(true);
      const output = fs.readFileSync(outputFile, 'utf8');
      expect(output).toContain('# DataPilot Analysis Report');
      expect(output).toContain('## Section 1: Overview');
      expect(output).toContain('## Section 2: Data Quality');
    }, 90000);

    test('should handle large CSV files efficiently', async () => {
      const largeFile = path.join(TEST_DATA_DIR, 'airlines.csv');
      if (!fs.existsSync(largeFile)) {
        console.warn(`Large test file not found: ${largeFile}`);
        return;
      }

      const startTime = Date.now();
      const outputFile = path.join(OUTPUT_DIR, 'large-csv-analysis.json');
      
      const result = execSync(
        `node ${CLI_PATH} all "${largeFile}" --output json --output-file "${outputFile}"`,
        { encoding: 'utf8', timeout: 120000 }
      );

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      expect(fs.existsSync(outputFile)).toBe(true);
      expect(processingTime).toBeLessThan(120000); // Should complete within 2 minutes
      
      const output = JSON.parse(fs.readFileSync(outputFile, 'utf8'));
      expect(output.section1).toBeDefined();
      expect(output.section2).toBeDefined();
    }, 150000);
  });

  describe('CLI Arguments & Options', () => {
    test('should respect output format options', async () => {
      const testFile = path.join(TEST_DATA_DIR, 'diamonds.csv');
      if (!fs.existsSync(testFile)) {
        console.warn(`Test file not found: ${testFile}`);
        return;
      }

      // Test JSON output
      const jsonOutput = path.join(OUTPUT_DIR, 'format-test.json');
      execSync(
        `node ${CLI_PATH} quality "${testFile}" --output json --output-file "${jsonOutput}"`,
        { timeout: 60000 }
      );
      
      expect(fs.existsSync(jsonOutput)).toBe(true);
      const jsonContent = fs.readFileSync(jsonOutput, 'utf8');
      expect(() => JSON.parse(jsonContent)).not.toThrow();

      // Test Markdown output
      const mdOutput = path.join(OUTPUT_DIR, 'format-test.md');
      execSync(
        `node ${CLI_PATH} quality "${testFile}" --output markdown --output-file "${mdOutput}"`,
        { timeout: 60000 }
      );
      
      expect(fs.existsSync(mdOutput)).toBe(true);
      const mdContent = fs.readFileSync(mdOutput, 'utf8');
      expect(mdContent).toContain('# DataPilot Analysis Report');
    }, 90000);

    test('should respect section selection', async () => {
      const testFile = path.join(TEST_DATA_DIR, 'insurance.csv');
      if (!fs.existsSync(testFile)) {
        console.warn(`Test file not found: ${testFile}`);
        return;
      }

      const outputFile = path.join(OUTPUT_DIR, 'section-test.json');
      execSync(
        `node ${CLI_PATH} eda "${testFile}" --output json --output-file "${outputFile}"`,
        { timeout: 60000 }
      );
      
      const output = JSON.parse(fs.readFileSync(outputFile, 'utf8'));
      expect(output.section1).toBeDefined();
      expect(output.section2).toBeUndefined();
      expect(output.section3).toBeDefined();
    }, 90000);
  });

  describe('Cross-Platform Compatibility', () => {
    test('should handle file paths with spaces', async () => {
      const testFile = path.join(TEST_DATA_DIR, 'student_habits_performance.csv');
      if (!fs.existsSync(testFile)) {
        console.warn(`Test file not found: ${testFile}`);
        return;
      }

      // Create a file with spaces in the name
      const spacedFile = path.join(OUTPUT_DIR, 'test file with spaces.csv');
      fs.copyFileSync(testFile, spacedFile);
      
      const outputFile = path.join(OUTPUT_DIR, 'spaced-file-analysis.md');
      const result = execSync(
        `node ${CLI_PATH} quality "${spacedFile}" --output-file "${outputFile}"`,
        { encoding: 'utf8', timeout: 60000 }
      );

      expect(fs.existsSync(outputFile)).toBe(true);
    }, 90000);

    test('should work across different operating systems', () => {
      const platform = os.platform();
      const result = execSync(`node ${CLI_PATH} --version`, { encoding: 'utf8' });
      
      expect(result.split('\n')[0].trim()).toMatch(/^\d+\.\d+\.\d+$/);
      console.log(`✅ Platform test passed on ${platform}`);
    });
  });

  describe('Error Handling & Edge Cases', () => {
    test('should handle non-existent files gracefully', () => {
      const nonExistentFile = path.join(OUTPUT_DIR, 'does-not-exist.csv');
      
      expect(() => {
        execSync(`node ${CLI_PATH} all "${nonExistentFile}"`, { timeout: 10000 });
      }).toThrow();
    });

    test('should handle invalid file formats', () => {
      // Create a non-CSV file
      const invalidFile = path.join(OUTPUT_DIR, 'invalid.txt');
      fs.writeFileSync(invalidFile, 'This is not a CSV file\nJust some text');
      
      expect(() => {
        execSync(`node ${CLI_PATH} all "${invalidFile}"`, { timeout: 10000 });
      }).toThrow();
    });

    test('should handle corrupted CSV files', () => {
      // Create a malformed CSV
      const corruptedFile = path.join(OUTPUT_DIR, 'corrupted.csv');
      fs.writeFileSync(corruptedFile, 'header1,header2,header3\nvalue1,value2\nvalue1,value2,value3,extra');
      
      // Should not crash, but may produce warnings
      const outputFile = path.join(OUTPUT_DIR, 'corrupted-analysis.md');
      const result = execSync(
        `node ${CLI_PATH} quality "${corruptedFile}" --output-file "${outputFile}"`,
        { encoding: 'utf8', timeout: 30000 }
      );
      
      expect(fs.existsSync(outputFile)).toBe(true);
    });
  });

  describe('Performance & Memory', () => {
    test('should handle memory-constrained environments', async () => {
      const testFile = path.join(TEST_DATA_DIR, 'student_habits_performance.csv');
      if (!fs.existsSync(testFile)) {
        console.warn(`Test file not found: ${testFile}`);
        return;
      }

      // Run with limited memory
      const outputFile = path.join(OUTPUT_DIR, 'memory-test.json');
      const result = execSync(
        `node --max-old-space-size=512 ${CLI_PATH} all "${testFile}" --output json --output-file "${outputFile}"`,
        { encoding: 'utf8', timeout: 60000 }
      );

      expect(fs.existsSync(outputFile)).toBe(true);
    }, 90000);

    test('should process multiple files sequentially', async () => {
      const files = [
        'student_habits_performance.csv',
        'insurance.csv',
        'diamonds.csv'
      ].filter(file => fs.existsSync(path.join(TEST_DATA_DIR, file)));

      if (files.length === 0) {
        console.warn('No test files available for sequential processing test');
        return;
      }

      for (let index = 0; index < files.length; index++) {
        const file = files[index];
        const inputFile = path.join(TEST_DATA_DIR, file);
        const outputFile = path.join(OUTPUT_DIR, `sequential-${index}.md`);
        
        const result = execSync(
          `node ${CLI_PATH} quality "${inputFile}" --output-file "${outputFile}"`,
          { encoding: 'utf8', timeout: 60000 }
        );
        
        expect(fs.existsSync(outputFile)).toBe(true);
      }
    }, 180000);
  });

  describe('Phase 3 Module Integration', () => {
    test('should execute complete 6-section analysis with new modeling capabilities', async () => {
      const testFile = path.join(TEST_DATA_DIR, 'student_habits_performance.csv');
      if (!fs.existsSync(testFile)) {
        console.warn(`Test file not found: ${testFile}`);
        return;
      }

      const outputFile = path.join(OUTPUT_DIR, 'phase3-complete-analysis.json');
      const result = execSync(
        `node ${CLI_PATH} all "${testFile}" --output json --output-file "${outputFile}"`,
        { encoding: 'utf8', timeout: 120000 }
      );

      expect(fs.existsSync(outputFile)).toBe(true);
      const output = JSON.parse(fs.readFileSync(outputFile, 'utf8'));
      
      // Verify all sections are present
      expect(output.section1).toBeDefined();
      expect(output.section2).toBeDefined();
      expect(output.section3).toBeDefined();
      expect(output.section4).toBeDefined();
      expect(output.section5).toBeDefined();
      expect(output.section6).toBeDefined();
      
      // Verify new Phase 3 capabilities
      if (output.section6?.advancedCharacterization) {
        expect(output.section6.advancedCharacterization.overallComplexityScore).toBeDefined();
        expect(output.section6.advancedCharacterization.intrinsicDimensionality).toBeDefined();
      }
      
      if (output.section6?.algorithmSelection) {
        expect(output.section6.algorithmSelection.selectedAlgorithms).toBeDefined();
        expect(output.section6.algorithmSelection.selectionReasoning).toBeDefined();
      }
    }, 150000);
  });

  describe('Output Quality Validation', () => {
    test('should generate complete and valid analysis reports', async () => {
      const testFile = path.join(TEST_DATA_DIR, 'diamonds.csv');
      if (!fs.existsSync(testFile)) {
        console.warn(`Test file not found: ${testFile}`);
        return;
      }

      const outputFile = path.join(OUTPUT_DIR, 'quality-validation.md');
      const result = execSync(
        `node ${CLI_PATH} all "${testFile}" --output markdown --output-file "${outputFile}"`,
        { encoding: 'utf8', timeout: 90000 }
      );

      const content = fs.readFileSync(outputFile, 'utf8');
      
      // Verify report structure
      expect(content).toContain('# DataPilot Analysis Report');
      expect(content).toContain('## Section 1: Overview');
      expect(content).toContain('## Section 2: Data Quality');
      expect(content).toContain('## Section 3: Exploratory Data Analysis');
      
      // Verify key metrics are present
      expect(content).toMatch(/Total Rows:.*\d+/);
      expect(content).toMatch(/Total Columns:.*\d+/);
      expect(content).toContain('Quality Score');
      
      // Verify no error messages in output
      expect(content).not.toContain('Error:');
      expect(content).not.toContain('undefined');
      expect(content).not.toContain('null');
    }, 120000);
  });
});
