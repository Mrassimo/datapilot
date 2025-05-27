/**
 * TUI Engine Test Harness
 * Comprehensive testing for TUI logic without UI rendering
 */

import { TUIEngine } from '../src/commands/tuiEngine.js';
import fs from 'fs';
import path from 'path';

// Mock dependencies for fast testing
const createMockDependencies = () => ({
  fs: {
    existsSync: (path) => {
      // Mock file system - simulate common scenarios
      if (path.includes('test_sales.csv')) return true;
      if (path.includes('insurance.csv')) return true;
      if (path.includes('nonexistent.csv')) return false;
      if (path.includes('.datapilot_recent.json')) return false;
      if (path.includes('.datapilot/archaeology')) return true;
      if (path.includes('tests/fixtures')) return true;
      // Directories should exist for discovery
      if (path === process.cwd()) return true;
      if (path.includes('/data')) return true;
      if (path.includes('/datasets')) return false; // Some dirs don't exist
      return path.endsWith('.csv') && !path.includes('missing');
    },
    
    readdirSync: (dirPath) => {
      if (dirPath.includes('fixtures')) {
        return ['test_sales.csv', 'insurance.csv', 'australian_data.csv', 'empty.csv'];
      }
      if (dirPath.includes('data')) {
        return ['sample.csv', 'transactions.csv'];
      }
      if (dirPath === process.cwd()) {
        return ['data.csv', 'analysis.csv', 'package.json'];
      }
      return ['data.csv', 'analysis.csv'];
    },
    
    statSync: (filePath) => ({
      size: filePath.includes('large') ? 5000000 : 1024,
      mtime: new Date('2024-01-01')
    }),
    
    readFileSync: (filePath) => {
      if (filePath.includes('.datapilot_recent.json')) {
        return JSON.stringify(['/path/to/recent.csv']);
      }
      return 'mocked file content';
    },
    
    writeFileSync: () => {}, // Mock write operations
    
    mkdirSync: () => {},
    unlinkSync: () => {},
    rmdirSync: () => {}
  },
  
  path: {
    join: (...parts) => parts.join('/'),
    relative: (from, to) => to.replace(from + '/', ''),
    basename: (filePath) => filePath.split('/').pop()
  },
  
  parseCSV: async (filePath, options) => {
    // Mock CSV parsing with different scenarios
    const mockData = [
      { name: 'Alice', age: 25, city: 'New York' },
      { name: 'Bob', age: 30, city: 'Los Angeles' },
      { name: 'Charlie', age: 35, city: 'Chicago' }
    ];
    
    if (filePath.includes('large')) {
      return Array(1000).fill(mockData[0]);
    }
    if (filePath.includes('empty')) {
      return [];
    }
    
    return mockData;
  },
  
  detectColumnTypes: (records) => {
    if (records.length === 0) return {};
    
    return {
      name: { type: 'categorical', confidence: 0.95 },
      age: { type: 'integer', confidence: 0.99 },
      city: { type: 'categorical', confidence: 0.90 }
    };
  },
  
  // Mock analysis functions for fast testing
  eda: async (records, headers, filePath, options) => ({
    summary: 'EDA analysis complete',
    rows: records.length,
    columns: headers.length,
    correlations: [],
    statistics: {}
  }),
  
  integrity: async (records, headers, filePath, options) => ({
    summary: 'Integrity check complete',
    completeness: 0.95,
    validity: 0.87,
    issues: []
  }),
  
  visualize: async (filePath, options) => ({
    summary: 'Visualization recommendations complete',
    charts: ['bar', 'scatter', 'histogram'],
    recommendations: []
  }),
  
  llmContext: async (filePath, options) => ({
    summary: 'LLM context generated',
    tokens: 1500,
    context: 'Generated LLM context'
  }),
  
  KnowledgeBase: class MockKnowledgeBase {
    async load() {
      return {
        warehouse_metadata: {
          discovered_tables: 3,
          total_technical_debt_hours: 15
        },
        tables: {
          'test_sales': { 
            domain: 'Sales', 
            row_count: 100, 
            columns: [{ name: 'amount' }, { name: 'date' }],
            quality_score: 0.85 
          },
          'insurance': { 
            domain: 'Insurance', 
            row_count: 500,
            columns: [{ name: 'policy_id' }, { name: 'premium' }],
            quality_score: 0.92 
          }
        }
      };
    }
    
    async deleteTable(tableName) {
      if (tableName === 'nonexistent') {
        throw new Error('Table not found');
      }
      return true;
    }
    
    async clearAll() {
      return true;
    }
  }
});

class TUIEngineTestSuite {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
  }

  test(name, testFn) {
    this.tests.push({ name, testFn });
  }

  async run() {
    console.log('🧪 Running TUI Engine Test Suite\\n');
    
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
    
    console.log(`\\n📊 Test Results: ${this.passed} passed, ${this.failed} failed`);
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
}

// Test suite implementation
const suite = new TUIEngineTestSuite();

suite.test('Engine initialization', async () => {
  const engine = new TUIEngine({ testMode: true });
  const state = engine.getState();
  
  suite.assertTrue(Array.isArray(state.navigationStack), 'Navigation stack should be array');
  suite.assertTrue(Array.isArray(state.recentFiles), 'Recent files should be array');
  suite.assertEqual(state.currentSession, null, 'Current session should be null');
});

suite.test('Main menu choices structure', async () => {
  const engine = new TUIEngine({ testMode: true });
  const choices = engine.getMainMenuChoices();
  
  suite.assertTrue(choices.length >= 4, 'Should have at least 4 main menu choices');
  suite.assertTrue(choices.some(c => c.name === 'analyze'), 'Should have analyze option');
  suite.assertTrue(choices.some(c => c.name === 'demo'), 'Should have demo option');
  suite.assertTrue(choices.some(c => c.name === 'memory'), 'Should have memory option');
  suite.assertTrue(choices.some(c => c.name === 'exit'), 'Should have exit option');
});

suite.test('File discovery with mocked filesystem', async () => {
  const mockDeps = createMockDependencies();
  const engine = new TUIEngine({ ...mockDeps, testMode: true });
  
  const csvFiles = await engine.discoverCSVFiles();
  
  suite.assertTrue(csvFiles.length > 0, 'Should discover CSV files');
  suite.assertTrue(csvFiles.every(f => f.name && f.path && f.size), 'Files should have required properties');
});

suite.test('File selection choices generation', async () => {
  const mockDeps = createMockDependencies();
  const engine = new TUIEngine({ ...mockDeps, testMode: true });
  
  const csvFiles = await engine.discoverCSVFiles();
  const choices = engine.getFileSelectionChoices(csvFiles);
  
  suite.assertTrue(choices.length > 0, 'Should generate file choices');
  suite.assertTrue(choices.some(c => c.name === 'manual'), 'Should include manual option');
});

suite.test('File preview functionality', async () => {
  const mockDeps = createMockDependencies();
  const engine = new TUIEngine({ ...mockDeps, testMode: true });
  
  const preview = await engine.previewFile('/path/to/test.csv');
  
  suite.assertTrue('rows' in preview, 'Preview should include row count');
  suite.assertTrue('columns' in preview, 'Preview should include column count');
  suite.assertTrue('columnTypes' in preview, 'Preview should include column types');
});

suite.test('Analysis type choices', async () => {
  const engine = new TUIEngine({ testMode: true });
  const choices = engine.getAnalysisTypeChoices();
  
  suite.assertTrue(choices.length >= 6, 'Should have all analysis types');
  const types = choices.map(c => c.name);
  suite.assertTrue(types.includes('all'), 'Should include all option');
  suite.assertTrue(types.includes('eda'), 'Should include EDA option');
  suite.assertTrue(types.includes('int'), 'Should include INT option');
  suite.assertTrue(types.includes('vis'), 'Should include VIS option');
  suite.assertTrue(types.includes('eng'), 'Should include ENG option');
  suite.assertTrue(types.includes('llm'), 'Should include LLM option');
});

suite.test('Analysis execution with mocked functions', async () => {
  const mockDeps = createMockDependencies();
  const engine = new TUIEngine({ ...mockDeps, testMode: true });
  
  const result = await engine.runAnalysis('/path/to/test.csv', 'eda');
  
  suite.assertTrue('filePath' in result, 'Result should include file path');
  suite.assertTrue('analysisType' in result, 'Result should include analysis type');
  suite.assertTrue('timestamp' in result, 'Result should include timestamp');
  suite.assertTrue('results' in result, 'Result should include analysis results');
  suite.assertFalse('error' in result, 'Should not have error for valid analysis');
});

suite.test('Demo dataset discovery', async () => {
  const mockDeps = createMockDependencies();
  const engine = new TUIEngine({ ...mockDeps, testMode: true });
  
  const datasets = engine.getDemoDatasets();
  
  suite.assertTrue(datasets.length > 0, 'Should find demo datasets');
  suite.assertTrue(datasets.every(d => d.name && d.path && d.description), 'Datasets should have required properties');
});

suite.test('Memory management operations', async () => {
  const mockDeps = createMockDependencies();
  const engine = new TUIEngine({ ...mockDeps, testMode: true });
  
  // Test memory summary
  const summary = await engine.getMemorySummary();
  suite.assertTrue('tableCount' in summary, 'Summary should include table count');
  suite.assertTrue('domainCount' in summary, 'Summary should include domain count');
  
  // Test memory listing
  const memories = await engine.listMemories();
  suite.assertTrue(typeof memories === 'object', 'Memories should be object');
  
  // Test memory deletion
  const deleteResult = await engine.deleteMemory('test_sales');
  suite.assertTrue(deleteResult.success, 'Should successfully delete existing table');
  
  // Test clear all
  const clearResult = await engine.clearAllMemories();
  suite.assertTrue(clearResult.success, 'Should successfully clear all memories');
});

suite.test('Error handling for invalid operations', async () => {
  const mockDeps = createMockDependencies();
  const engine = new TUIEngine({ ...mockDeps, testMode: true });
  
  // Test delete non-existent table
  const deleteResult = await engine.deleteMemory('nonexistent');
  suite.assertFalse(deleteResult.success, 'Should fail to delete non-existent table');
  
  // Test invalid analysis type
  const analysisResult = await engine.runAnalysis('/path/to/test.csv', 'invalid');
  suite.assertTrue('error' in analysisResult, 'Should have error for invalid analysis type');
});

suite.test('State management and navigation', async () => {
  const engine = new TUIEngine({ testMode: true });
  
  // Test state manipulation
  engine.setState({ testProperty: 'testValue' });
  const state = engine.getState();
  suite.assertEqual(state.testProperty, 'testValue', 'Should update state');
  
  // Test navigation stack
  engine.pushNavigation('main');
  engine.pushNavigation('analyze');
  const location = engine.popNavigation();
  suite.assertEqual(location, 'analyze', 'Should pop correct location');
});

suite.test('User flow simulation', async () => {
  const mockDeps = createMockDependencies();
  const engine = new TUIEngine({ ...mockDeps, testMode: true });
  
  const actions = [
    { type: 'main_menu', choice: 'analyze' },
    { type: 'file_selection', filePath: '/path/to/test.csv' },
    { type: 'analysis_type', filePath: '/path/to/test.csv', analysisType: 'eda' }
  ];
  
  const results = await engine.simulateUserFlow(actions);
  
  suite.assertEqual(results.length, 3, 'Should process all actions');
  suite.assertTrue(results.every(r => r.action && r.result), 'All results should have action and result');
});

suite.test('Recent files management', async () => {
  const mockDeps = createMockDependencies();
  const engine = new TUIEngine({ ...mockDeps, testMode: true });
  
  const initialRecentCount = engine.getState().recentFiles.length;
  
  // Add a file to recent
  engine.addToRecentFiles('/path/to/new/file.csv');
  
  const newRecentCount = engine.getState().recentFiles.length;
  suite.assertTrue(newRecentCount >= initialRecentCount, 'Should maintain or increase recent files count');
});

suite.test('File size formatting', async () => {
  const engine = new TUIEngine({ testMode: true });
  
  suite.assertEqual(engine.formatFileSize(500), '500 B', 'Should format bytes correctly');
  suite.assertEqual(engine.formatFileSize(1500), '1 KB', 'Should format KB correctly');
  suite.assertEqual(engine.formatFileSize(1500000), '1 MB', 'Should format MB correctly');
});

// Export the test suite for integration
export { TUIEngineTestSuite, createMockDependencies };

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  suite.run().then(success => {
    process.exit(success ? 0 : 1);
  });
}