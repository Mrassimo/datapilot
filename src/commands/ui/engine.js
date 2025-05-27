/**
 * TUI Engine - Testable UI Logic Separated from Rendering
 * Handles state management and business logic for the Terminal UI
 */

import fs from 'fs';
import path from 'path';
import { parseCSV, detectColumnTypes } from '../../utils/parser.js';
import { eda } from '../eda.js';
import { integrity } from '../int.js';
import { visualize } from '../vis.js';
import { llmContext } from '../llm.js';
import { KnowledgeBase } from '../../utils/knowledgeBase.js';
import yaml from 'js-yaml';

// Recent files storage
const RECENT_FILES_PATH = path.join(process.env.HOME || process.env.USERPROFILE, '.datapilot_recent.json');
const MAX_RECENT_FILES = 10;

export class TUIEngine {
  constructor(options = {}) {
    this.state = {
      navigationStack: [],
      recentFiles: this.loadRecentFiles(),
      currentSession: null,
      lastAnalysisResults: null,
      demoMode: false
    };
    
    // Dependency injection for testing
    this.dependencies = {
      fs: options.fs || fs,
      path: options.path || path,
      parseCSV: options.parseCSV || parseCSV,
      detectColumnTypes: options.detectColumnTypes || detectColumnTypes,
      eda: options.eda || eda,
      integrity: options.integrity || integrity,
      visualize: options.visualize || visualize,
      llmContext: options.llmContext || llmContext,
      KnowledgeBase: options.KnowledgeBase || KnowledgeBase
    };
    
    this.testMode = options.testMode || false;
  }

  // === State Management ===
  
  getState() {
    return { ...this.state };
  }
  
  setState(newState) {
    this.state = { ...this.state, ...newState };
  }
  
  pushNavigation(location) {
    this.state.navigationStack.push(location);
  }
  
  popNavigation() {
    return this.state.navigationStack.pop();
  }

  // === Main Menu Logic ===
  
  getMainMenuChoices() {
    return [
      {
        name: 'analyze',
        message: '📊 Analyze CSV Data',
        hint: 'Smart file discovery and guided analysis'
      },
      {
        name: 'demo',
        message: '🎭 Try Demo Mode',
        hint: 'See DataPilot in action with built-in sample datasets'
      },
      {
        name: 'memory',
        message: '🧠 Manage Memories',
        hint: 'View, delete, or manage DataPilot\'s warehouse knowledge'
      },
      {
        name: 'exit',
        message: '👋 Exit DataPilot',
        hint: 'Thanks for using DataPilot!'
      }
    ];
  }
  
  async handleMainMenuAction(action) {
    this.pushNavigation('main');
    
    switch (action) {
      case 'analyze':
        return await this.startGuidedAnalysis();
      case 'demo':
        return await this.startDemo();
      case 'memory':
        return await this.startMemoryManager();
      case 'exit':
        return { action: 'exit', message: 'Goodbye!' };
      default:
        return { action: 'error', message: `Unknown action: ${action}` };
    }
  }

  // === File Discovery and Selection ===
  
  async discoverCSVFiles() {
    const searchPaths = [
      process.cwd(),
      this.dependencies.path.join(process.cwd(), 'data'),
      this.dependencies.path.join(process.cwd(), 'datasets'),
      this.dependencies.path.join(process.cwd(), 'csv'),
      this.dependencies.path.join(process.cwd(), 'files')
    ];
    
    const csvFiles = [];
    
    for (const searchPath of searchPaths) {
      try {
        if (this.dependencies.fs.existsSync(searchPath)) {
          const files = this.dependencies.fs.readdirSync(searchPath);
          files.forEach(file => {
            if (file.toLowerCase().endsWith('.csv')) {
              const fullPath = this.dependencies.path.join(searchPath, file);
              const stats = this.dependencies.fs.statSync(fullPath);
              csvFiles.push({
                name: file,
                path: fullPath,
                size: this.formatFileSize(stats.size),
                modified: stats.mtime.toLocaleDateString(),
                directory: this.dependencies.path.relative(process.cwd(), searchPath) || '.'
              });
            }
          });
        }
      } catch (error) {
        // Directory not accessible, skip
      }
    }
    
    return csvFiles;
  }
  
  getFileSelectionChoices(csvFiles) {
    const choices = [];
    
    // Recent files section
    if (this.state.recentFiles.length > 0) {
      choices.push({ name: 'recent_header', message: '📁 Recent Files', role: 'separator' });
      this.state.recentFiles.slice(0, 5).forEach(file => {
        if (this.dependencies.fs.existsSync(file)) {
          choices.push({
            name: file,
            message: `📄 ${path.basename(file)}`,
            hint: `${path.dirname(file)} - Recently used`
          });
        }
      });
    }
    
    // Discovered files section
    if (csvFiles.length > 0) {
      choices.push({ name: 'discovered_header', message: '🔍 Discovered Files', role: 'separator' });
      csvFiles.slice(0, 10).forEach(file => {
        choices.push({
          name: file.path,
          message: `📄 ${file.name}`,
          hint: `${file.directory} - ${file.size} (${file.modified})`
        });
      });
    }
    
    // Manual entry option
    choices.push({ name: 'separator', message: '─────────────────────', role: 'separator' });
    choices.push({
      name: 'manual',
      message: '📂 Browse for File',
      hint: 'Enter file path manually'
    });
    
    return choices;
  }
  
  async previewFile(filePath) {
    try {
      const records = await this.dependencies.parseCSV(filePath, { quiet: true, header: true });
      const columnTypes = this.dependencies.detectColumnTypes(records);
      
      const preview = {
        path: filePath,
        size: this.dependencies.fs.statSync(filePath).size,
        rows: records.length,
        columns: Object.keys(columnTypes).length,
        sampleData: records.slice(0, 3),
        columnTypes: columnTypes,
        columnNames: Object.keys(columnTypes)
      };
      
      return preview;
    } catch (error) {
      return {
        error: error.message,
        path: filePath
      };
    }
  }

  // === Analysis Types ===
  
  getAnalysisTypeChoices() {
    return [
      {
        name: 'all',
        message: '🚀 Complete Analysis Suite',
        hint: 'Run all analysis types for comprehensive insights'
      },
      {
        name: 'eda',
        message: '📊 Exploratory Data Analysis',
        hint: 'Statistical analysis, distributions, correlations'
      },
      {
        name: 'int',
        message: '🔍 Data Integrity Check',
        hint: 'Quality assessment, validation, completeness'
      },
      {
        name: 'vis',
        message: '📈 Visualization Recommendations',
        hint: 'Chart suggestions, design principles'
      },
      {
        name: 'eng',
        message: '🏗️ Data Engineering Archaeology',
        hint: 'Schema analysis, warehouse design'
      },
      {
        name: 'llm',
        message: '🤖 LLM Context Generation',
        hint: 'AI-ready summaries and insights'
      }
    ];
  }
  
  async runAnalysis(filePath, analysisType, options = {}) {
    this.addToRecentFiles(filePath);
    
    const results = {
      filePath,
      analysisType,
      timestamp: new Date().toISOString(),
      results: {}
    };
    
    try {
      const records = await this.dependencies.parseCSV(filePath, { quiet: true, header: true });
      const columnTypes = this.dependencies.detectColumnTypes(records);
      
      const analysisOptions = {
        ...options,
        preloadedData: { records, columnTypes },
        structuredOutput: this.testMode
      };
      
      switch (analysisType) {
        case 'all':
          results.results.eda = await this.dependencies.eda(records, Object.keys(columnTypes), filePath, analysisOptions);
          results.results.int = await this.dependencies.integrity(records, Object.keys(columnTypes), filePath, analysisOptions);
          results.results.vis = await this.dependencies.visualize(filePath, analysisOptions);
          results.results.eng = await this.dependencies.eda(records, Object.keys(columnTypes), filePath, { ...analysisOptions, command: 'eng' });
          results.results.llm = await this.dependencies.llmContext(filePath, analysisOptions);
          break;
        case 'eda':
          results.results.eda = await this.dependencies.eda(records, Object.keys(columnTypes), filePath, analysisOptions);
          break;
        case 'int':
          results.results.int = await this.dependencies.integrity(records, Object.keys(columnTypes), filePath, analysisOptions);
          break;
        case 'vis':
          results.results.vis = await this.dependencies.visualize(filePath, analysisOptions);
          break;
        case 'eng':
          results.results.eng = await this.dependencies.eda(records, Object.keys(columnTypes), filePath, { ...analysisOptions, command: 'eng' });
          break;
        case 'llm':
          results.results.llm = await this.dependencies.llmContext(filePath, analysisOptions);
          break;
        default:
          throw new Error(`Unknown analysis type: ${analysisType}`);
      }
      
      this.state.lastAnalysisResults = results;
      return results;
      
    } catch (error) {
      results.error = error.message;
      return results;
    }
  }

  // === Demo Mode ===
  
  getDemoDatasets() {
    const demoPath = path.join(process.cwd(), 'tests', 'fixtures');
    const datasets = [];
    
    try {
      if (this.dependencies.fs.existsSync(demoPath)) {
        const files = this.dependencies.fs.readdirSync(demoPath);
        files.forEach(file => {
          if (file.endsWith('.csv') && !file.includes('empty')) {
            const fullPath = path.join(demoPath, file);
            datasets.push({
              name: file.replace('.csv', ''),
              path: fullPath,
              description: this.getDemoDescription(file)
            });
          }
        });
      }
    } catch (error) {
      // Demo files not available
    }
    
    return datasets;
  }
  
  getDemoDescription(filename) {
    const descriptions = {
      'test_sales.csv': 'E-commerce sales data with transactions, products, and customer segments',
      'insurance.csv': 'Insurance policy data with coverage details and customer information',
      'australian_data.csv': 'Australian-specific dataset with postcodes and regional data',
      'missing_values.csv': 'Dataset with various missing value patterns for quality testing',
      'large_numeric.csv': 'Large numerical dataset for performance and statistical analysis'
    };
    
    return descriptions[filename] || 'Sample dataset for demonstration purposes';
  }
  
  async startDemo() {
    this.state.demoMode = true;
    const datasets = this.getDemoDatasets();
    
    return {
      action: 'demo',
      datasets,
      message: datasets.length > 0 ? 'Demo datasets available' : 'No demo datasets found'
    };
  }

  // === Memory Management ===
  
  async getMemorySummary() {
    const kb = new this.dependencies.KnowledgeBase();
    const knowledge = await kb.load();
    
    const tableCount = Object.keys(knowledge.tables || {}).length;
    const domains = [...new Set(Object.values(knowledge.tables || {}).map(t => t.domain))];
    const totalDebtHours = knowledge.warehouse_metadata?.total_technical_debt_hours || 0;
    
    return {
      tableCount,
      domainCount: domains.length,
      domains,
      totalDebtHours,
      storagePath: '~/.datapilot/archaeology'
    };
  }
  
  async listMemories() {
    const kb = new this.dependencies.KnowledgeBase();
    const knowledge = await kb.load();
    
    const tables = Object.entries(knowledge.tables || {});
    const memories = {};
    
    // Group by domain
    tables.forEach(([name, info]) => {
      const domain = info.domain || 'Unknown';
      if (!memories[domain]) memories[domain] = [];
      memories[domain].push({
        name,
        rows: info.row_count || 0,
        columns: (info.columns || []).length,
        quality: info.quality_score ? `${info.quality_score.toFixed(1)}%` : 'N/A'
      });
    });
    
    return memories;
  }
  
  async deleteMemory(tableName) {
    const kb = new this.dependencies.KnowledgeBase();
    try {
      await kb.deleteTable(tableName);
      return { success: true, message: `Memory for "${tableName}" deleted successfully` };
    } catch (error) {
      return { success: false, message: `Failed to delete memory: ${error.message}` };
    }
  }
  
  async clearAllMemories() {
    const kb = new this.dependencies.KnowledgeBase();
    try {
      await kb.clearAll();
      return { success: true, message: 'All memories cleared successfully' };
    } catch (error) {
      return { success: false, message: `Failed to clear memories: ${error.message}` };
    }
  }
  
  async startMemoryManager() {
    const summary = await this.getMemorySummary();
    return {
      action: 'memory',
      summary,
      message: 'Memory manager initialized'
    };
  }

  // === Guided Analysis Flow ===
  
  async startGuidedAnalysis() {
    const csvFiles = await this.discoverCSVFiles();
    return {
      action: 'analyze',
      csvFiles,
      message: csvFiles.length > 0 ? `Found ${csvFiles.length} CSV files` : 'No CSV files found in common locations'
    };
  }

  // === Utility Methods ===
  
  formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB';
    return Math.round(bytes / (1024 * 1024)) + ' MB';
  }
  
  loadRecentFiles() {
    try {
      if (this.dependencies.fs.existsSync(RECENT_FILES_PATH)) {
        const data = this.dependencies.fs.readFileSync(RECENT_FILES_PATH, 'utf8');
        return JSON.parse(data).filter(file => this.dependencies.fs.existsSync(file));
      }
    } catch (error) {
      // Invalid recent files, start fresh
    }
    return [];
  }
  
  addToRecentFiles(filePath) {
    const recent = this.loadRecentFiles();
    const filtered = recent.filter(f => f !== filePath);
    filtered.unshift(filePath);
    
    const toSave = filtered.slice(0, MAX_RECENT_FILES);
    this.state.recentFiles = toSave;
    
    try {
      this.dependencies.fs.writeFileSync(RECENT_FILES_PATH, JSON.stringify(toSave, null, 2));
    } catch (error) {
      // Failed to save recent files, continue silently
    }
  }
  
  // === Test Utilities ===
  
  async simulateUserFlow(actions) {
    const results = [];
    
    for (const action of actions) {
      let result;
      
      switch (action.type) {
        case 'main_menu':
          result = await this.handleMainMenuAction(action.choice);
          break;
        case 'file_selection':
          result = { action: 'file_selected', filePath: action.filePath };
          break;
        case 'analysis_type':
          result = await this.runAnalysis(action.filePath, action.analysisType, { testMode: true });
          break;
        case 'memory_action':
          switch (action.memoryAction) {
            case 'list':
              result = await this.listMemories();
              break;
            case 'delete':
              result = await this.deleteMemory(action.tableName);
              break;
            case 'clear':
              result = await this.clearAllMemories();
              break;
            default:
              result = { error: 'Unknown memory action' };
          }
          break;
        default:
          result = { error: `Unknown action type: ${action.type}` };
      }
      
      results.push({ action, result });
    }
    
    return results;
  }
}