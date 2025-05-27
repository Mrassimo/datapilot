/**
 * TUI Flow Tests - Comprehensive Testing of User Interaction Flows
 * Tests complete user journeys through the TUI interface
 */

import { TUIEngine } from '../../src/commands/ui/engine.js';
import { createMockDependencies } from './engine.test.js';

class TUIFlowTestSuite {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
  }

  test(name, testFn) {
    this.tests.push({ name, testFn });
  }

  async run() {
    console.log('🔄 Running TUI Flow Test Suite\\n');
    
    for (const { name, testFn } of this.tests) {
      try {
        await testFn();
        console.log(`✅ ${name}`);
        this.passed++;
      } catch (error) {
        console.log(`❌ ${name}: ${error.message}`);
        this.failed++;
      }
    }
    
    console.log(`\\n📊 Flow Test Results: ${this.passed} passed, ${this.failed} failed`);
    return this.failed === 0;
  }

  assertEqual(actual, expected, message = '') {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      throw new Error(`${message}: Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    }
  }

  assertTrue(condition, message = '') {
    if (!condition) {
      throw new Error(`${message}: Expected condition to be true`);
    }
  }

  assertFalse(condition, message = '') {
    if (condition) {
      throw new Error(`${message}: Expected condition to be false`);
    }
  }

  assertContains(container, item, message = '') {
    if (!container.includes(item)) {
      throw new Error(`${message}: Expected container to include ${item}`);
    }
  }
}

const suite = new TUIFlowTestSuite();

// === Complete Analysis Flow Tests ===

suite.test('Complete EDA Analysis Flow', async () => {
  const mockDeps = createMockDependencies();
  const engine = new TUIEngine({ ...mockDeps, testMode: true });
  
  // Start analysis
  const startResult = await engine.handleMainMenuAction('analyze');
  suite.assertEqual(startResult.action, 'analyze', 'Should start analysis mode');
  suite.assertTrue(startResult.csvFiles.length > 0, 'Should discover CSV files');
  
  // Preview file
  const preview = await engine.previewFile('/path/to/test_sales.csv');
  suite.assertTrue(preview.rows > 0, 'Should preview file with data');
  suite.assertTrue(preview.columns > 0, 'Should have columns');
  
  // Run EDA analysis
  const analysis = await engine.runAnalysis('/path/to/test_sales.csv', 'eda');
  suite.assertFalse('error' in analysis, 'EDA analysis should succeed');
  suite.assertTrue('results' in analysis, 'Should have analysis results');
  suite.assertEqual(analysis.analysisType, 'eda', 'Should record correct analysis type');
});

suite.test('Complete Integrity Check Flow', async () => {
  const mockDeps = createMockDependencies();
  const engine = new TUIEngine({ ...mockDeps, testMode: true });
  
  const flow = [
    { type: 'main_menu', choice: 'analyze' },
    { type: 'file_selection', filePath: '/path/to/insurance.csv' },
    { type: 'analysis_type', filePath: '/path/to/insurance.csv', analysisType: 'int' }
  ];
  
  const results = await engine.simulateUserFlow(flow);
  
  suite.assertEqual(results.length, 3, 'Should complete all flow steps');
  suite.assertEqual(results[0].result.action, 'analyze', 'Should start analysis');
  suite.assertTrue('results' in results[2].result, 'Should complete integrity analysis');
});

suite.test('Complete Suite Analysis Flow', async () => {
  const mockDeps = createMockDependencies();
  const engine = new TUIEngine({ ...mockDeps, testMode: true });
  
  const analysis = await engine.runAnalysis('/path/to/test.csv', 'all');
  
  suite.assertFalse('error' in analysis, 'Complete analysis should succeed');
  suite.assertTrue('eda' in analysis.results, 'Should include EDA results');
  suite.assertTrue('int' in analysis.results, 'Should include integrity results');
  suite.assertTrue('vis' in analysis.results, 'Should include visualization results');
  suite.assertTrue('llm' in analysis.results, 'Should include LLM results');
});

// === Demo Mode Flow Tests ===

suite.test('Demo Mode Selection Flow', async () => {
  const mockDeps = createMockDependencies();
  const engine = new TUIEngine({ ...mockDeps, testMode: true });
  
  const demoResult = await engine.handleMainMenuAction('demo');
  suite.assertEqual(demoResult.action, 'demo', 'Should start demo mode');
  suite.assertTrue(demoResult.datasets.length > 0, 'Should find demo datasets');
  
  // Verify demo datasets have required properties
  const dataset = demoResult.datasets[0];
  suite.assertTrue('name' in dataset, 'Dataset should have name');
  suite.assertTrue('path' in dataset, 'Dataset should have path');
  suite.assertTrue('description' in dataset, 'Dataset should have description');
});

suite.test('Demo Analysis Execution', async () => {
  const mockDeps = createMockDependencies();
  const engine = new TUIEngine({ ...mockDeps, testMode: true });
  
  const datasets = engine.getDemoDatasets();
  suite.assertTrue(datasets.length > 0, 'Should have demo datasets');
  
  const demoPath = datasets[0].path;
  const analysis = await engine.runAnalysis(demoPath, 'vis');
  
  suite.assertFalse('error' in analysis, 'Demo analysis should succeed');
  suite.assertEqual(analysis.filePath, demoPath, 'Should analyze correct demo file');
});

// === Memory Management Flow Tests ===

suite.test('Memory Manager Navigation Flow', async () => {
  const mockDeps = createMockDependencies();
  const engine = new TUIEngine({ ...mockDeps, testMode: true });
  
  const memoryResult = await engine.handleMainMenuAction('memory');
  suite.assertEqual(memoryResult.action, 'memory', 'Should start memory manager');
  
  const summary = memoryResult.summary;
  suite.assertTrue('tableCount' in summary, 'Should have table count');
  suite.assertTrue('domainCount' in summary, 'Should have domain count');
  suite.assertTrue('totalDebtHours' in summary, 'Should have debt hours');
});

suite.test('Memory List and View Flow', async () => {
  const mockDeps = createMockDependencies();
  const engine = new TUIEngine({ ...mockDeps, testMode: true });
  
  const memories = await engine.listMemories();
  suite.assertTrue(typeof memories === 'object', 'Should return memories object');
  
  // Should have mocked data
  const domains = Object.keys(memories);
  suite.assertTrue(domains.length > 0, 'Should have memory domains');
});

suite.test('Memory Deletion Flow', async () => {
  const mockDeps = createMockDependencies();
  const engine = new TUIEngine({ ...mockDeps, testMode: true });
  
  // Test successful deletion
  const deleteResult = await engine.deleteMemory('test_sales');
  suite.assertTrue(deleteResult.success, 'Should delete existing memory');
  suite.assertContains(deleteResult.message, 'successfully', 'Should have success message');
  
  // Test failed deletion
  const failResult = await engine.deleteMemory('nonexistent');
  suite.assertFalse(failResult.success, 'Should fail to delete nonexistent memory');
});

suite.test('Memory Clear All Flow', async () => {
  const mockDeps = createMockDependencies();
  const engine = new TUIEngine({ ...mockDeps, testMode: true });
  
  const clearResult = await engine.clearAllMemories();
  suite.assertTrue(clearResult.success, 'Should clear all memories');
  suite.assertContains(clearResult.message, 'successfully', 'Should have success message');
});

// === Error Handling Flow Tests ===

suite.test('Invalid File Handling Flow', async () => {
  const mockDeps = createMockDependencies();
  // Override parseCSV to throw error for nonexistent files
  mockDeps.parseCSV = async (filePath) => {
    if (filePath.includes('nonexistent')) {
      throw new Error('File not found');
    }
    return [{ name: 'test', age: 25 }];
  };
  
  const engine = new TUIEngine({ ...mockDeps, testMode: true });
  
  const preview = await engine.previewFile('/path/to/nonexistent.csv');
  suite.assertTrue('error' in preview, 'Should handle nonexistent file error');
});

suite.test('Invalid Analysis Type Flow', async () => {
  const mockDeps = createMockDependencies();
  const engine = new TUIEngine({ ...mockDeps, testMode: true });
  
  const analysis = await engine.runAnalysis('/path/to/test.csv', 'invalid');
  suite.assertTrue('error' in analysis, 'Should handle invalid analysis type');
  suite.assertContains(analysis.error, 'Unknown analysis type', 'Should have descriptive error');
});

suite.test('Empty Dataset Handling Flow', async () => {
  const mockDeps = createMockDependencies();
  const engine = new TUIEngine({ ...mockDeps, testMode: true });
  
  const preview = await engine.previewFile('/path/to/empty.csv');
  suite.assertEqual(preview.rows, 0, 'Should handle empty dataset');
  suite.assertTrue(Object.keys(preview.columnTypes).length === 0, 'Should have no column types for empty data');
});

// === Navigation and State Flow Tests ===

suite.test('Navigation Stack Management Flow', async () => {
  const engine = new TUIEngine({ testMode: true });
  
  // Test navigation stack operations
  engine.pushNavigation('main');
  engine.pushNavigation('analyze');
  engine.pushNavigation('file_select');
  
  const state = engine.getState();
  suite.assertEqual(state.navigationStack.length, 3, 'Should track navigation history');
  
  const location = engine.popNavigation();
  suite.assertEqual(location, 'file_select', 'Should pop latest location');
  suite.assertEqual(engine.getState().navigationStack.length, 2, 'Should reduce stack size');
});

suite.test('State Persistence Flow', async () => {
  const mockDeps = createMockDependencies();
  const engine = new TUIEngine({ ...mockDeps, testMode: true });
  
  // Run analysis to set state
  const analysis = await engine.runAnalysis('/path/to/test.csv', 'eda');
  const state = engine.getState();
  
  suite.assertTrue(state.lastAnalysisResults !== null, 'Should store last analysis results');
  suite.assertEqual(state.lastAnalysisResults.analysisType, 'eda', 'Should store correct analysis type');
});

suite.test('Recent Files Management Flow', async () => {
  const mockDeps = createMockDependencies();
  const engine = new TUIEngine({ ...mockDeps, testMode: true });
  
  const initialCount = engine.getState().recentFiles.length;
  
  // Add files to recent
  engine.addToRecentFiles('/path/to/file1.csv');
  engine.addToRecentFiles('/path/to/file2.csv');
  engine.addToRecentFiles('/path/to/file1.csv'); // Duplicate
  
  const finalCount = engine.getState().recentFiles.length;
  suite.assertTrue(finalCount >= initialCount, 'Should maintain recent files');
  
  // Should not have duplicates
  const recentFiles = engine.getState().recentFiles;
  const uniqueFiles = [...new Set(recentFiles)];
  suite.assertEqual(recentFiles.length, uniqueFiles.length, 'Should not have duplicate recent files');
});

// === Complex User Journey Tests ===

suite.test('Full Analysis Session Journey', async () => {
  const mockDeps = createMockDependencies();
  const engine = new TUIEngine({ ...mockDeps, testMode: true });
  
  // 1. Start analysis
  const analyzeResult = await engine.handleMainMenuAction('analyze');
  suite.assertEqual(analyzeResult.action, 'analyze', 'Should start analysis');
  
  // 2. Select file
  const preview = await engine.previewFile('/path/to/test.csv');
  suite.assertTrue(preview.rows > 0, 'Should preview file');
  
  // 3. Run multiple analyses
  const edaResult = await engine.runAnalysis('/path/to/test.csv', 'eda');
  const intResult = await engine.runAnalysis('/path/to/test.csv', 'int');
  
  suite.assertFalse('error' in edaResult, 'EDA should succeed');
  suite.assertFalse('error' in intResult, 'INT should succeed');
  
  // 4. Check memory was updated
  const memories = await engine.listMemories();
  suite.assertTrue(Object.keys(memories).length > 0, 'Should have memories after analysis');
});

suite.test('Memory Management Session Journey', async () => {
  const mockDeps = createMockDependencies();
  const engine = new TUIEngine({ ...mockDeps, testMode: true });
  
  // 1. Start memory manager
  const memoryResult = await engine.handleMainMenuAction('memory');
  suite.assertEqual(memoryResult.action, 'memory', 'Should start memory manager');
  
  // 2. List existing memories
  const memories = await engine.listMemories();
  const initialTableCount = Object.values(memories).flat().length;
  
  // 3. Delete a memory
  const deleteResult = await engine.deleteMemory('test_sales');
  suite.assertTrue(deleteResult.success, 'Should delete memory');
  
  // 4. Verify deletion (in a real scenario, would check updated memories)
  suite.assertContains(deleteResult.message, 'successfully', 'Should confirm deletion');
});

suite.test('Error Recovery Journey', async () => {
  const mockDeps = createMockDependencies();
  const engine = new TUIEngine({ ...mockDeps, testMode: true });
  
  // 1. Attempt invalid operation
  const invalidAnalysis = await engine.runAnalysis('/path/to/test.csv', 'invalid');
  suite.assertTrue('error' in invalidAnalysis, 'Should handle invalid analysis');
  
  // 2. Recover with valid operation
  const validAnalysis = await engine.runAnalysis('/path/to/test.csv', 'eda');
  suite.assertFalse('error' in validAnalysis, 'Should recover with valid analysis');
  
  // 3. State should be consistent
  const state = engine.getState();
  suite.assertTrue(state.lastAnalysisResults !== null, 'Should have last results after recovery');
});

// Export the test suite
export { TUIFlowTestSuite };

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  suite.run().then(success => {
    process.exit(success ? 0 : 1);
  });
}