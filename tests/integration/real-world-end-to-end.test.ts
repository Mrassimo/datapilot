/**
 * Simplified Real-World End-to-End Test
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { Section1Analyzer } from '../../src/analyzers/overview/section1-analyzer';
import { writeFileSync, unlinkSync, mkdtempSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('Real-World End-to-End Test (Simplified)', () => {
  let tempDir: string;
  let tempFile: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'datapilot-integration-test-'));
    tempFile = join(tempDir, 'test.csv');
  });

  afterEach(async () => {
    try {
      unlinkSync(tempFile);
    } catch (e) {
      // File might not exist
    }
    
    // Stop any monitoring and cleanup global resources
    const { globalMemoryManager, globalResourceManager } = await import('../../src/utils/memory-manager');
    globalMemoryManager.stopMonitoring();
    globalMemoryManager.runCleanup();
    globalResourceManager.cleanupAll();
    
    // Allow cleanup to complete
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  test('should complete basic analysis', async () => {
    // Create minimal test data
    const csvData = `id,name,value
1,Test1,100
2,Test2,200
3,Test3,300`;
    
    writeFileSync(tempFile, csvData, 'utf8');

    const analyzer = new Section1Analyzer({
      detailedProfiling: true,
      privacyMode: 'minimal',
    });

    const result = await analyzer.analyze(tempFile);

    expect(result).toBeDefined();
    expect(result.overview).toBeDefined();
    expect(result.overview.structuralDimensions.totalDataRows).toBe(3);
    expect(result.overview.structuralDimensions.totalColumns).toBe(3);
  });

  test('should demonstrate basic integration', () => {
    // Just verify the system can be imported and basic analysis works
    expect(Section1Analyzer).toBeDefined();
    
    // Simple integration test - just verify components exist
    expect(() => {
      new Section1Analyzer({});
    }).not.toThrow();
  });
});