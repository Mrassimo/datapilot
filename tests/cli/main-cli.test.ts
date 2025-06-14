import { DataPilotCLI as CLI } from '../../src/cli';
import { writeFileSync, unlinkSync, mkdtempSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('Main CLI', () => {
  let tempDir: string;
  let testFile: string;
  let cli: CLI;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'datapilot-cli-test-'));
    testFile = join(tempDir, 'test.csv');
    cli = new CLI();
    
    // Create a basic test CSV
    const csvContent = `name,age,city,score
John,25,London,85.5
Jane,30,Paris,92.0
Bob,35,"New York",78.3
Alice,28,Tokyo,96.7`;
    writeFileSync(testFile, csvContent, 'utf8');
  });

  afterEach(async () => {
    try {
      const files = require('fs').readdirSync(tempDir);
      for (const file of files) {
        unlinkSync(join(tempDir, file));
      }
      require('fs').rmdirSync(tempDir);
    } catch (e) {
      // Directory cleanup may fail, that's ok
    }
    
    // CLI doesn't have shutdown method, just cleanup global resources
    
    // Stop any monitoring and cleanup global resources
    const { globalMemoryManager, globalResourceManager } = await import('../../src/utils/memory-manager');
    globalMemoryManager.stopMonitoring();
    globalMemoryManager.runCleanup();
    globalResourceManager.cleanupAll();
    
    // Allow cleanup to complete
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  describe('Command Execution', () => {
    it('should execute all command successfully', async () => {
      const args = ['node', 'datapilot', 'all', testFile, '-o', 'txt'];
      
      const result = await cli.run(args);
      
      expect(result.success).toBe(true);
      expect(result.output).toContain('DATAPILOT COMPLETE ANALYSIS ENGINE');
      expect(result.output).toContain('Section 1: Comprehensive Dataset');
      expect(result.output).toContain('Section 2: Data Quality');
      expect(result.output).toContain('Section 3: Exploratory Data Analysis');
      expect(result.output).toContain('Section 4: Visualization Intelligence');
      expect(result.output).toContain('Section 5: Data Engineering');
      expect(result.output).toContain('Section 6: Predictive Modeling');
    }, 30000);

    it('should execute individual section commands', async () => {
      const sections = [
        { cmd: 'overview', section: 'Section 1' },
        { cmd: 'quality', section: 'Section 2' },
        { cmd: 'eda', section: 'Section 3' },
        { cmd: 'visualization', section: 'Section 4' },
        { cmd: 'engineering', section: 'Section 5' },
        { cmd: 'modeling', section: 'Section 6' }
      ];

      for (const { cmd, section } of sections) {
        const args = ['node', 'datapilot', cmd, testFile];
        
        const result = await cli.run(args);
        
        expect(result.success).toBe(true);
        expect(result.output).toContain(section);
      }
    }, 45000);

    it('should handle section aliases correctly', async () => {
      const aliases = ['ove', 'qua', 'vis', 'eng', 'mod'];
      
      for (const alias of aliases) {
        const args = ['node', 'datapilot', alias, testFile];
        
        const result = await cli.run(args);
        
        expect(result.success).toBe(true);
        expect(result.output).toContain('Section');
      }
    }, 30000);
  });

  describe('Output Formats', () => {
    it('should generate markdown output', async () => {
      const outputFile = join(tempDir, 'output.md');
      const args = ['node', 'datapilot', 'overview', testFile, '-o', 'markdown', `--output-file=${outputFile}`];
      
      const result = await cli.run(args);
      
      expect(result.success).toBe(true);
      expect(existsSync(outputFile)).toBe(true);
      
      const content = require('fs').readFileSync(outputFile, 'utf8');
      expect(content).toContain('# DATAPILOT');
      expect(content).toContain('## Section 1');
    });

    it('should generate JSON output', async () => {
      const outputFile = join(tempDir, 'output.json');
      const args = ['node', 'datapilot', 'overview', testFile, '-o', 'json', `--output-file=${outputFile}`];
      
      const result = await cli.run(args);
      
      expect(result.success).toBe(true);
      expect(existsSync(outputFile)).toBe(true);
      
      const content = require('fs').readFileSync(outputFile, 'utf8');
      const parsed = JSON.parse(content);
      expect(parsed).toHaveProperty('section');
      expect(parsed).toHaveProperty('summary');
    });

    it('should generate YAML output', async () => {
      const outputFile = join(tempDir, 'output.yaml');
      const args = ['node', 'datapilot', 'overview', testFile, '-o', 'yaml', `--output-file=${outputFile}`];
      
      const result = await cli.run(args);
      
      expect(result.success).toBe(true);
      expect(existsSync(outputFile)).toBe(true);
      
      const content = require('fs').readFileSync(outputFile, 'utf8');
      expect(content).toContain('section:');
      expect(content).toContain('summary:');
    });
  });

  describe('Configuration Options', () => {
    it('should respect privacy mode settings', async () => {
      const args1 = ['node', 'datapilot', 'overview', testFile, '--privacy=minimal'];
      const result1 = await cli.run(args1);
      
      const args2 = ['node', 'datapilot', 'overview', testFile, '--privacy=full'];
      const result2 = await cli.run(args2);
      
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      
      // Minimal privacy should show less path information
      expect(result1.output).toContain('test.csv');
      expect(result2.output).toContain(testFile);
    });

    it('should handle sample size limitations', async () => {
      const args = ['node', 'datapilot', 'eda', testFile, '--max-rows', '2'];
      
      const result = await cli.run(args);
      
      expect(result.success).toBe(true);
      expect(result.output).toContain('2'); // Should process only 2 rows
    });

    it('should handle privacy mode configuration', async () => {
      const args = ['node', 'datapilot', 'overview', testFile, '--privacy', 'minimal'];
      
      const result = await cli.run(args);
      
      expect(result.success).toBe(true);
      // Privacy mode should be applied (minimal path information)
      expect(result.output).toContain('test.csv');
    });
  });

  describe('Progress Reporting', () => {
    it('should show progress in verbose mode', async () => {
      const args = ['node', 'datapilot', 'all', testFile, '--verbose'];
      
      const progressUpdates: string[] = [];
      cli.setProgressCallback((progress) => {
        progressUpdates.push(progress.message);
      });
      
      const result = await cli.run(args);
      
      expect(result.success).toBe(true);
      expect(progressUpdates.length).toBeGreaterThan(0);
      expect(progressUpdates.some(msg => msg.includes('Starting'))).toBe(true);
      expect(progressUpdates.some(msg => msg.includes('Complete'))).toBe(true);
    }, 30000);

    it('should suppress output in quiet mode', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      try {
        const args = ['node', 'datapilot', 'overview', testFile, '--quiet'];
        
        const result = await cli.run(args);
        
        expect(result.success).toBe(true);
        // Should have minimal console output in quiet mode
        expect(consoleSpy).toHaveBeenCalledTimes(0);
      } finally {
        consoleSpy.mockRestore();
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle non-existent files gracefully', async () => {
      const args = ['node', 'datapilot', 'all', '/nonexistent/file.csv'];
      
      const result = await cli.run(args);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('file not found');
    });

    it('should handle malformed CSV files', async () => {
      const malformedFile = join(tempDir, 'malformed.csv');
      writeFileSync(malformedFile, 'invalid,csv\ncontent,with\nmismatched,columns,here', 'utf8');
      
      const args = ['node', 'datapilot', 'overview', malformedFile];
      
      const result = await cli.run(args);
      
      // Should either succeed with warnings or fail gracefully
      if (!result.success) {
        expect(result.error).toContain('CSV');
      } else {
        expect(result.output).toContain('Warning');
      }
    });

    it('should handle empty CSV files', async () => {
      const emptyFile = join(tempDir, 'empty.csv');
      writeFileSync(emptyFile, '', 'utf8');
      
      const args = ['node', 'datapilot', 'overview', emptyFile];
      
      const result = await cli.run(args);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('empty');
    });

    it('should handle invalid command line arguments', async () => {
      const invalidArgs = [
        ['node', 'datapilot'], // Missing command
        ['node', 'datapilot', 'invalid'], // Invalid command
        ['node', 'datapilot', 'all'], // Missing file
        ['node', 'datapilot', 'all', testFile, '-o', 'invalid'], // Invalid format
      ];
      
      for (const args of invalidArgs) {
        const result = await cli.run(args);
        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
      }
    });

    it('should handle permission errors gracefully', async () => {
      const readOnlyFile = join(tempDir, 'readonly.csv');
      writeFileSync(readOnlyFile, 'col1,col2\nval1,val2', 'utf8');
      
      // Make directory read-only (Unix systems)
      if (process.platform !== 'win32') {
        require('fs').chmodSync(tempDir, 0o444);
        
        try {
          const outputFile = join(tempDir, 'output.txt');
          const args = ['node', 'datapilot', 'overview', readOnlyFile, `--output=${outputFile}`];
          
          const result = await cli.run(args);
          
          if (!result.success) {
            expect(result.error).toContain('permission');
          }
        } finally {
          // Restore permissions for cleanup
          require('fs').chmodSync(tempDir, 0o755);
        }
      }
    });
  });

  describe('Help and Version', () => {
    it('should display help information', async () => {
      const args = ['node', 'datapilot', '--help'];
      
      const result = await cli.run(args);
      
      expect(result.success).toBe(true);
      expect(result.output).toContain('Usage:');
      expect(result.output).toContain('Commands:');
      expect(result.output).toContain('Options:');
      expect(result.output).toContain('datapilot all');
    });

    it('should display version information', async () => {
      const args = ['node', 'datapilot', '--version'];
      
      const result = await cli.run(args);
      
      expect(result.success).toBe(true);
      expect(result.output).toMatch(/\d+\.\d+\.\d+/); // Version format
    });
  });

  describe('Performance and Memory', () => {
    it('should handle reasonably large datasets', async () => {
      // Create a larger test dataset
      const largeFile = join(tempDir, 'large.csv');
      let csvContent = 'id,name,value,category,timestamp\n';
      
      for (let i = 0; i < 1000; i++) {
        csvContent += `${i},name_${i},${Math.random() * 100},cat_${i % 5},2024-01-${(i % 30) + 1}\n`;
      }
      
      writeFileSync(largeFile, csvContent, 'utf8');
      
      const startTime = Date.now();
      const args = ['node', 'datapilot', 'overview', largeFile];
      
      const result = await cli.run(args);
      const endTime = Date.now();
      
      expect(result.success).toBe(true);
      expect(endTime - startTime).toBeLessThan(10000); // Should complete in under 10 seconds
      expect(result.output).toContain('1000'); // Should show correct row count
    }, 15000);

    it('should monitor memory usage during analysis', async () => {
      const initialMemory = process.memoryUsage();
      
      const args = ['node', 'datapilot', 'all', testFile];
      
      const result = await cli.run(args);
      
      const finalMemory = process.memoryUsage();
      
      expect(result.success).toBe(true);
      
      // Memory usage should be reasonable (less than 100MB increase)
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024); // 100MB
    }, 30000);
  });

  describe('Integration with Analysis Engines', () => {
    it('should integrate all analysis sections correctly', async () => {
      const args = ['node', 'datapilot', 'all', testFile, '-o', 'json'];
      
      const result = await cli.run(args);
      
      expect(result.success).toBe(true);
      
      const output = JSON.parse(result.output);
      
      // Verify all sections are present
      expect(output).toHaveProperty('section1'); // Overview
      expect(output).toHaveProperty('section2'); // Quality
      expect(output).toHaveProperty('section3'); // EDA
      expect(output).toHaveProperty('section4'); // Visualization
      expect(output).toHaveProperty('section5'); // Engineering
      expect(output).toHaveProperty('section6'); // Modeling
      
      // Verify cross-section data consistency
      const rowCount = output.section1.overview.structuralDimensions.totalDataRows;
      expect(output.section2.summary.totalRecordsAnalyzed).toBe(rowCount);
    }, 30000);

    it('should maintain data consistency across sections', async () => {
      const args = ['node', 'datapilot', 'all', testFile, '-o', 'json'];
      
      const result = await cli.run(args);
      
      expect(result.success).toBe(true);
      
      const output = JSON.parse(result.output);
      
      // Column count should be consistent
      const section1Columns = output.section1.overview.structuralDimensions.totalColumns;
      const section2Columns = output.section2.summary.totalFieldsAnalyzed;
      
      expect(section1Columns).toBe(section2Columns);
      
      // Column names should be consistent
      const section1Names = output.section1.overview.structuralDimensions.columnInventory.map((c: any) => c.name);
      const section3Names = Object.keys(output.section3.univariateAnalysis || {});
      
      // Should have overlap in column names
      const commonNames = section1Names.filter((name: string) => section3Names.includes(name));
      expect(commonNames.length).toBeGreaterThan(0);
    }, 30000);
  });
});
