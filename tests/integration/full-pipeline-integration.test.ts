/**
 * Full Pipeline Integration Test
 * 
 * Tests that all 6 sections of the analysis pipeline work correctly together
 * with the new commands and enhanced functionality.
 */

import { promises as fs } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { DataPilotCLI } from '../../src/cli';
import { UniversalAnalyzer } from '../../src/cli/universal-analyzer';
import type { CLIResult } from '../../src/cli/types';

describe('Full Pipeline Integration', () => {
  let tempDir: string;
  let testCsvPath: string;
  let testCsvPath2: string;
  let cli: DataPilotCLI;
  let analyzer: UniversalAnalyzer;
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeAll(async () => {
    // Create temporary directory for test files
    tempDir = await fs.mkdtemp(join(tmpdir(), 'datapilot-pipeline-test-'));
    testCsvPath = join(tempDir, 'customers.csv');
    testCsvPath2 = join(tempDir, 'orders.csv');
    
    // Create realistic test data with relationships
    const customersData = [
      'customer_id,name,email,age,city,registration_date',
      '1,"John Doe","john@example.com",30,"Sydney",2023-01-15',
      '2,"Jane Smith","jane@example.com",25,"Melbourne",2023-02-20',
      '3,"Bob Johnson","bob@example.com",35,"Brisbane",2023-03-10',
      '4,"Alice Brown","alice@example.com",28,"Perth",2023-04-05',
      '5,"Charlie Wilson","charlie@example.com",42,"Adelaide",2023-05-12'
    ].join('\n');
    
    const ordersData = [
      'order_id,customer_id,product,price,quantity,order_date',
      '101,1,"Laptop",1500.00,1,2023-06-01',
      '102,2,"Mouse",25.50,2,2023-06-02',
      '103,1,"Keyboard",120.00,1,2023-06-03',
      '104,3,"Monitor",400.00,1,2023-06-04',
      '105,2,"Headphones",80.00,1,2023-06-05',
      '106,4,"Tablet",600.00,1,2023-06-06',
      '107,5,"Phone",800.00,1,2023-06-07',
      '108,1,"Charger",35.00,3,2023-06-08'
    ].join('\n');
    
    await fs.writeFile(testCsvPath, customersData, 'utf8');
    await fs.writeFile(testCsvPath2, ordersData, 'utf8');
  });

  beforeEach(() => {
    cli = new DataPilotCLI();
    analyzer = new UniversalAnalyzer();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  afterAll(async () => {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('Section 1: Overview Integration', () => {
    it('should perform complete overview analysis', async () => {
      const result = await cli.run(['node', 'datapilot', 'overview', testCsvPath]);
      
      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
      expect(result.data.overview).toBeDefined();
      expect(result.data.overview.fileDetails).toBeDefined();
      expect(result.data.overview.parsingMetadata).toBeDefined();
      expect(result.data.overview.structuralDimensions).toBeDefined();
      expect(result.data.overview.executionContext).toBeDefined();
    });

    it('should handle Australian English in overview output', async () => {
      const result = await cli.run(['node', 'datapilot', 'overview', testCsvPath]);
      
      expect(result.success).toBe(true);
      
      // Check for Australian English spellings
      const output = JSON.stringify(result.data);
      expect(output.toLowerCase()).not.toMatch(/\banalyze\b/);
      expect(output.toLowerCase()).not.toMatch(/\boptimize\b/);
    });
  });

  describe('Section 2: Quality Integration', () => {
    it('should perform quality analysis with comprehensive metrics', async () => {
      const result = await cli.run(['node', 'datapilot', 'quality', testCsvPath]);
      
      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
      expect(result.data.quality).toBeDefined();
      expect(result.data.quality.completeness).toBeDefined();
      expect(result.data.quality.uniqueness).toBeDefined();
      expect(result.data.quality.validity).toBeDefined();
    });

    it('should detect data quality issues', async () => {
      // Create a CSV with quality issues
      const problematicCsvPath = join(tempDir, 'problematic.csv');
      const problematicData = [
        'id,name,email,age',
        '1,"John Doe","john@example.com",30',
        '2,"Jane Smith","invalid-email",25',
        '3,"Bob Johnson",,35',  // Missing email
        '4,"Alice Brown","alice@example.com",',  // Missing age
        '5,"Charlie Wilson","charlie@example.com",999'  // Invalid age
      ].join('\n');
      
      await fs.writeFile(problematicCsvPath, problematicData, 'utf8');
      
      const result = await cli.run(['node', 'datapilot', 'quality', problematicCsvPath]);
      
      expect(result.success).toBe(true);
      expect(result.data.quality.issues).toBeDefined();
      expect(result.data.quality.issues.length).toBeGreaterThan(0);
      
      // Cleanup
      await fs.unlink(problematicCsvPath);
    });
  });

  describe('Section 3: EDA Integration', () => {
    it('should perform comprehensive exploratory data analysis', async () => {
      const result = await cli.run(['node', 'datapilot', 'eda', testCsvPath]);
      
      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
      expect(result.data.eda).toBeDefined();
      expect(result.data.eda.univariate).toBeDefined();
      expect(result.data.eda.bivariate).toBeDefined();
      expect(result.data.eda.correlations).toBeDefined();
    });

    it('should handle streaming analysis for large datasets', async () => {
      // Test with the actual files (they're small, but test the streaming logic)
      const result = await cli.run(['node', 'datapilot', 'eda', testCsvPath, '--streaming']);
      
      expect(result.success).toBe(true);
      expect(result.data.eda.processingMode).toBe('streaming');
    });
  });

  describe('Section 4: Visualisation Integration', () => {
    it('should generate visualisation recommendations', async () => {
      const result = await cli.run(['node', 'datapilot', 'visualisation', testCsvPath]);
      
      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
      expect(result.data.visualisation).toBeDefined();
      expect(result.data.visualisation.recommendations).toBeDefined();
      expect(result.data.visualisation.accessibility).toBeDefined();
    });

    it('should ensure accessibility compliance', async () => {
      const result = await cli.run(['node', 'datapilot', 'visualisation', testCsvPath]);
      
      expect(result.success).toBe(true);
      expect(result.data.visualisation.accessibility.wcagCompliance).toBeDefined();
      expect(result.data.visualisation.accessibility.colourBlindnessSupport).toBeDefined();
    });
  });

  describe('Section 5: Engineering Integration', () => {
    it('should perform engineering analysis for single file', async () => {
      const result = await cli.run(['node', 'datapilot', 'engineering', testCsvPath]);
      
      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
      expect(result.data.engineering).toBeDefined();
      expect(result.data.engineering.schemaOptimisation).toBeDefined();
      expect(result.data.engineering.featureEngineering).toBeDefined();
      expect(result.data.engineering.mlReadiness).toBeDefined();
    });

    it('should perform enhanced multi-file relationship analysis', async () => {
      const result = await cli.run(['node', 'datapilot', 'engineering', testCsvPath, testCsvPath2]);
      
      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
      expect(result.data.engineering).toBeDefined();
      expect(result.data.engineering.relationshipAnalysis).toBeDefined();
      expect(result.data.engineering.relationshipAnalysis.detectedRelationships).toBeDefined();
      expect(result.data.engineering.relationshipAnalysis.joinRecommendations).toBeDefined();
    });

    it('should detect foreign key relationships', async () => {
      const result = await cli.run(['node', 'datapilot', 'engineering', testCsvPath, testCsvPath2]);
      
      expect(result.success).toBe(true);
      // Should detect customer_id relationship between customers and orders
      expect(result.data.engineering.relationshipAnalysis.detectedRelationships.length).toBeGreaterThan(0);
    });
  });

  describe('Section 6: Modelling Integration', () => {
    it('should perform modelling recommendations', async () => {
      const result = await cli.run(['node', 'datapilot', 'modelling', testCsvPath]);
      
      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
      expect(result.data.modelling).toBeDefined();
      expect(result.data.modelling.algorithmRecommendations).toBeDefined();
      expect(result.data.modelling.validationStrategy).toBeDefined();
    });

    it('should provide deployment recommendations', async () => {
      const result = await cli.run(['node', 'datapilot', 'modelling', testCsvPath]);
      
      expect(result.success).toBe(true);
      expect(result.data.modelling.deploymentStrategy).toBeDefined();
    });
  });

  describe('All Sections Integration', () => {
    it('should perform complete analysis pipeline', async () => {
      const result = await cli.run(['node', 'datapilot', 'all', testCsvPath]);
      
      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
      
      // Should have all sections
      expect(result.data.overview).toBeDefined();
      expect(result.data.quality).toBeDefined();
      expect(result.data.eda).toBeDefined();
      expect(result.data.visualisation).toBeDefined();
      expect(result.data.engineering).toBeDefined();
      expect(result.data.modelling).toBeDefined();
    });

    it('should handle all sections with multi-file analysis', async () => {
      const result = await cli.run(['node', 'datapilot', 'all', testCsvPath, testCsvPath2]);
      
      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
      
      // Should have enhanced relationship analysis in engineering section
      expect(result.data.engineering.relationshipAnalysis).toBeDefined();
      expect(result.data.engineering.relationshipAnalysis.multiFileAnalysis).toBe(true);
    });

    it('should handle confidence thresholds appropriately', async () => {
      const result = await cli.run(['node', 'datapilot', 'all', testCsvPath, '--confidence', '0.8']);
      
      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
      
      // Should respect confidence threshold in analysis
      expect(result.data.metadata.confidenceThreshold).toBe(0.8);
    });
  });

  describe('Performance and Memory Integration', () => {
    it('should handle memory management across all sections', async () => {
      const result = await cli.run(['node', 'datapilot', 'all', testCsvPath, '--dry-run']);
      
      expect(result.success).toBe(true);
      expect(result.data.analysisEstimate.estimatedMemory).toBeGreaterThan(0);
      expect(result.data.analysisEstimate.memoryBreakdown).toBeDefined();
    });

    it('should provide accurate timing estimates', async () => {
      const result = await cli.run(['node', 'datapilot', 'all', testCsvPath, '--dry-run']);
      
      expect(result.success).toBe(true);
      expect(result.data.analysisEstimate.estimatedTime).toBeGreaterThan(0);
      expect(result.data.analysisEstimate.timingBreakdown).toBeDefined();
    });

    it('should handle streaming mode appropriately', async () => {
      const result = await cli.run(['node', 'datapilot', 'all', testCsvPath, '--streaming']);
      
      expect(result.success).toBe(true);
      expect(result.data.metadata.processingMode).toBe('streaming');
    });
  });

  describe('Output Generation Integration', () => {
    it('should generate markdown output correctly', async () => {
      const outputPath = join(tempDir, 'test-output.md');
      const result = await cli.run([
        'node', 'datapilot', 'all', testCsvPath, 
        '--output', 'markdown', 
        '--output-file', outputPath
      ]);
      
      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
      
      // Verify output file was created
      expect(await fs.access(outputPath).then(() => true).catch(() => false)).toBe(true);
      
      // Verify content
      const content = await fs.readFile(outputPath, 'utf8');
      expect(content).toContain('# DataPilot Analysis Report');
      expect(content).toContain('## Section 1: Overview');
      expect(content).toContain('## Section 2: Quality');
      expect(content).toContain('## Section 3: EDA');
      expect(content).toContain('## Section 4: Visualisation');
      expect(content).toContain('## Section 5: Engineering');
      expect(content).toContain('## Section 6: Modelling');
      
      // Check for Australian English
      expect(content).toContain('Visualisation');
      expect(content).toContain('Optimisation');
      expect(content).not.toContain('Visualization');
      expect(content).not.toContain('Optimization');
      
      // Cleanup
      await fs.unlink(outputPath);
    });

    it('should generate JSON output correctly', async () => {
      const outputPath = join(tempDir, 'test-output.json');
      const result = await cli.run([
        'node', 'datapilot', 'all', testCsvPath, 
        '--output', 'json', 
        '--output-file', outputPath
      ]);
      
      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
      
      // Verify output file was created
      expect(await fs.access(outputPath).then(() => true).catch(() => false)).toBe(true);
      
      // Verify content
      const content = await fs.readFile(outputPath, 'utf8');
      expect(() => JSON.parse(content)).not.toThrow();
      
      const parsed = JSON.parse(content);
      expect(parsed.overview).toBeDefined();
      expect(parsed.quality).toBeDefined();
      expect(parsed.eda).toBeDefined();
      expect(parsed.visualisation).toBeDefined();
      expect(parsed.engineering).toBeDefined();
      expect(parsed.modelling).toBeDefined();
      
      // Cleanup
      await fs.unlink(outputPath);
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle partial analysis failures gracefully', async () => {
      // Create a CSV that might cause issues in specific sections
      const problematicPath = join(tempDir, 'problematic-pipeline.csv');
      const problematicData = [
        'id,value',
        '1,"valid"',
        '2,"also valid"'
      ].join('\n');
      
      await fs.writeFile(problematicPath, problematicData, 'utf8');
      
      const result = await cli.run(['node', 'datapilot', 'all', problematicPath]);
      
      // Should complete successfully even if some sections have warnings
      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
      
      // Cleanup
      await fs.unlink(problematicPath);
    });

    it('should provide comprehensive error reporting', async () => {
      const result = await cli.run(['node', 'datapilot', 'all', 'nonexistent-file.csv']);
      
      expect(result.success).toBe(false);
      expect(result.exitCode).toBe(1);
      expect(result.error).toContain('not found');
      expect(result.suggestions).toBeDefined();
      expect(result.suggestions.length).toBeGreaterThan(0);
    });
  });

  describe('Regression Prevention', () => {
    it('should maintain consistent API across all sections', async () => {
      const commands = ['overview', 'quality', 'eda', 'visualisation', 'engineering', 'modelling'];
      
      for (const command of commands) {
        const result = await cli.run(['node', 'datapilot', command, testCsvPath, '--dry-run']);
        
        expect(result.success).toBe(true);
        expect(result.exitCode).toBe(0);
        expect(result.data.analysisEstimate.command).toBe(command);
        expect(result.metadata.command).toBe(command);
      }
    });

    it('should maintain backwards compatibility with old flags', async () => {
      const result = await cli.run(['node', 'datapilot', 'overview', testCsvPath, '--verbose']);
      
      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
      expect(result.metadata.verbose).toBe(true);
    });
  });

  describe('Multi-File Relationship Detection', () => {
    it('should detect and analyse relationships between multiple files', async () => {
      const result = await cli.run(['node', 'datapilot', 'engineering', testCsvPath, testCsvPath2]);
      
      expect(result.success).toBe(true);
      expect(result.data.engineering.relationshipAnalysis).toBeDefined();
      expect(result.data.engineering.relationshipAnalysis.detectedRelationships).toBeDefined();
      
      // Should detect customer_id relationship
      const relationships = result.data.engineering.relationshipAnalysis.detectedRelationships;
      expect(relationships.length).toBeGreaterThan(0);
      
      const customerRelationship = relationships.find(rel => 
        rel.foreignKey === 'customer_id' || rel.primaryKey === 'customer_id'
      );
      expect(customerRelationship).toBeDefined();
    });

    it('should provide join recommendations', async () => {
      const result = await cli.run(['node', 'datapilot', 'engineering', testCsvPath, testCsvPath2]);
      
      expect(result.success).toBe(true);
      expect(result.data.engineering.relationshipAnalysis.joinRecommendations).toBeDefined();
      expect(result.data.engineering.relationshipAnalysis.joinRecommendations.length).toBeGreaterThan(0);
      
      const joinRec = result.data.engineering.relationshipAnalysis.joinRecommendations[0];
      expect(joinRec.joinType).toBeDefined();
      expect(joinRec.joinCondition).toBeDefined();
    });
  });
});
