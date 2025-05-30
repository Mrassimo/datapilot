/**
 * Safe Knowledge Base with File Locking and Backup
 * Addresses critical issues identified in Google review:
 * - Concurrency protection
 * - Data corruption prevention  
 * - Backup and recovery
 */

import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import os from 'os';
import yaml from 'js-yaml';
import { knowledgeBaseLocks } from './fileLock.js';
import { knowledgeBaseBackup } from './backupManager.js';

export class SafeKnowledgeBase {
  constructor(basePath = null) {
    this.basePath = basePath || path.join(os.homedir(), '.datapilot', 'archaeology');
    this.warehousePath = path.join(this.basePath, 'warehouse_knowledge.yaml');
    this.tablesPath = path.join(this.basePath, 'tables');
    this.patternsPath = path.join(this.basePath, 'patterns.yaml');
    this.relationshipsPath = path.join(this.basePath, 'relationships.yaml');
    
    // Initialize directories synchronously for constructor
    this.initializeDirectoriesSync();
  }

  initializeDirectoriesSync() {
    try {
      fsSync.mkdirSync(this.basePath, { recursive: true });
      fsSync.mkdirSync(this.tablesPath, { recursive: true });
    } catch (error) {
      console.error('Failed to initialize knowledge base directories:', error.message);
    }
  }

  /**
   * Load knowledge base with file locking
   */
  async load() {
    try {
      return await knowledgeBaseLocks.withLock(this.warehousePath, async () => {
        const warehouse = await this.loadYaml(this.warehousePath) || this.createEmptyWarehouse();
        const patterns = await this.loadYaml(this.patternsPath) || { naming_conventions: [], common_issues: [] };
        const relationships = await this.loadYaml(this.relationshipsPath) || { confirmed: [], suspected: [] };

        return {
          warehouse,
          patterns,
          relationships,
          tables: await this.loadAllTables()
        };
      });
    } catch (error) {
      console.error('Failed to load knowledge base:', error.message);
      
      // Attempt recovery from backup
      const recovered = await this.attemptRecovery();
      if (recovered) {
        console.log('Successfully recovered knowledge base from backup');
        return recovered;
      }
      
      return this.createEmptyKnowledge();
    }
  }

  /**
   * Attempt to recover from backup
   */
  async attemptRecovery() {
    try {
      // Try to restore main warehouse file
      const warehouseRestored = await knowledgeBaseBackup.restoreFromBackup(this.warehousePath);
      
      if (warehouseRestored) {
        // Load recovered data
        const warehouse = await this.loadYaml(this.warehousePath) || this.createEmptyWarehouse();
        const patterns = await this.loadYaml(this.patternsPath) || { naming_conventions: [], common_issues: [] };
        const relationships = await this.loadYaml(this.relationshipsPath) || { confirmed: [], suspected: [] };

        return {
          warehouse,
          patterns,
          relationships,
          tables: await this.loadAllTables()
        };
      }
    } catch (error) {
      console.error('Recovery attempt failed:', error.message);
    }
    
    return null;
  }

  createEmptyWarehouse() {
    return {
      warehouse_metadata: {
        name: "Discovered Data Warehouse",
        discovered_tables: 0,
        last_updated: new Date().toISOString(),
        total_technical_debt_hours: 0,
        version: "1.0" // Add version for future schema evolution
      },
      table_registry: {},
      domains: {}
    };
  }

  createEmptyKnowledge() {
    return {
      warehouse: this.createEmptyWarehouse(),
      patterns: { naming_conventions: [], common_issues: [] },
      relationships: { confirmed: [], suspected: [] },
      tables: {}
    };
  }

  /**
   * Load YAML file with error handling
   */
  async loadYaml(filePath) {
    try {
      // Check if file exists
      await fs.access(filePath);
      
      const content = await fs.readFile(filePath, 'utf8');
      
      // Validate content before parsing
      if (!this.validateYamlContent(content)) {
        console.warn(`Invalid YAML content in ${filePath}, attempting backup recovery`);
        
        // Try to restore from backup
        const restored = await knowledgeBaseBackup.restoreFromBackup(filePath);
        if (restored) {
          const restoredContent = await fs.readFile(filePath, 'utf8');
          return yaml.load(restoredContent);
        }
        
        return null;
      }
      
      return yaml.load(content);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error(`Failed to load ${filePath}:`, error.message);
      }
      return null;
    }
  }

  /**
   * Validate YAML content for corruption
   */
  validateYamlContent(content) {
    if (!content || content.trim().length === 0) {
      return false;
    }
    
    // Check for corruption indicators
    if (content.includes('undefined') || content.includes('[object Object]')) {
      return false;
    }
    
    try {
      yaml.load(content);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Clean data for YAML serialization
   */
  cleanForYaml(obj) {
    if (obj === null || obj === undefined) return obj;
    if (obj instanceof Promise) return '[Promise - not serializable]';
    if (typeof obj === 'function') return undefined;
    if (obj instanceof Date) return obj.toISOString();
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.cleanForYaml(item)).filter(item => item !== undefined);
    }
    
    if (typeof obj === 'object') {
      const cleaned = {};
      for (const [key, value] of Object.entries(obj)) {
        const cleanValue = this.cleanForYaml(value);
        if (cleanValue !== undefined) {
          cleaned[key] = cleanValue;
        }
      }
      return cleaned;
    }
    
    return obj;
  }

  /**
   * Save YAML with backup and locking
   */
  async saveYaml(filePath, data) {
    return await knowledgeBaseLocks.withLock(filePath, async () => {
      try {
        // Clean and prepare data
        const cleanData = this.cleanForYaml(data);
        
        // Validate data before saving
        if (!cleanData || Object.keys(cleanData).length === 0) {
          throw new Error('Cannot save empty or invalid data');
        }
        
        const yamlContent = yaml.dump(cleanData, {
          indent: 2,
          lineWidth: 120,
          noRefs: true
        });
        
        // Validate generated YAML
        if (!this.validateYamlContent(yamlContent)) {
          throw new Error('Generated YAML content is invalid');
        }
        
        // Use backup manager for safe write
        await knowledgeBaseBackup.safeWrite(filePath, yamlContent);
        
      } catch (error) {
        console.error(`Failed to save ${filePath}:`, error.message);
        throw error;
      }
    });
  }

  /**
   * Load all table files
   */
  async loadAllTables() {
    try {
      const tables = {};
      const files = await fs.readdir(this.tablesPath);
      
      for (const file of files) {
        if (file.endsWith('.yaml')) {
          const tableName = file.replace('.yaml', '');
          const tablePath = path.join(this.tablesPath, file);
          tables[tableName] = await this.loadYaml(tablePath);
        }
      }
      
      return tables;
    } catch (error) {
      console.error('Failed to load tables:', error.message);
      return {};
    }
  }

  /**
   * Save table with locking
   */
  async saveTable(tableName, analysis) {
    const tablePath = path.join(this.tablesPath, `${tableName}.yaml`);
    await this.saveYaml(tablePath, analysis);
  }

  /**
   * Update knowledge base with full consistency checks
   */
  async update(tableName, analysis) {
    return await knowledgeBaseLocks.withLock(this.warehousePath, async () => {
      try {
        const knowledge = await this.load();
        
        // Validate analysis data
        if (!analysis || typeof analysis !== 'object') {
          throw new Error('Invalid analysis data provided');
        }
        
        // Create backup of current state
        await knowledgeBaseBackup.createBackup(this.warehousePath);
        
        // Update warehouse metadata with validation
        const currentCount = Object.keys(knowledge.warehouse.table_registry || {}).length;
        const isNewTable = !knowledge.warehouse.table_registry[tableName];
        
        knowledge.warehouse.warehouse_metadata.discovered_tables = currentCount + (isNewTable ? 1 : 0);
        knowledge.warehouse.warehouse_metadata.last_updated = new Date().toISOString();
        knowledge.warehouse.warehouse_metadata.total_technical_debt_hours += analysis.tech_debt_hours || 0;

        // Add to table registry with validation
        knowledge.warehouse.table_registry[tableName] = {
          analyzed_date: new Date().toISOString(),
          likely_purpose: analysis.likely_purpose || "Unknown",
          quality_score: Math.max(0, Math.min(100, analysis.quality_score || 50)), // Constrain to 0-100
          tech_debt_hours: Math.max(0, analysis.tech_debt_hours || 0), // Non-negative
          relationships: Array.isArray(analysis.relationships) ? analysis.relationships : [],
          columns: Array.isArray(analysis.columns) ? analysis.columns : [],
          domain: analysis.domain || "Unknown"
        };

        // Update domain classification safely
        const domain = analysis.domain || "Unknown";
        if (!knowledge.warehouse.domains[domain]) {
          knowledge.warehouse.domains[domain] = [];
        }
        if (!knowledge.warehouse.domains[domain].includes(tableName)) {
          knowledge.warehouse.domains[domain].push(tableName);
        }

        // Update patterns with validation
        if (analysis.patterns && typeof analysis.patterns === 'object') {
          if (Array.isArray(analysis.patterns.naming)) {
            knowledge.patterns.naming_conventions.push(...analysis.patterns.naming);
          }
          if (Array.isArray(analysis.patterns.issues)) {
            knowledge.patterns.common_issues.push(...analysis.patterns.issues);
          }
        }

        // Update relationships with validation
        if (analysis.relationships && typeof analysis.relationships === 'object') {
          if (Array.isArray(analysis.relationships.confirmed)) {
            knowledge.relationships.confirmed.push(...analysis.relationships.confirmed);
          }
          if (Array.isArray(analysis.relationships.suspected)) {
            knowledge.relationships.suspected.push(...analysis.relationships.suspected);
          }
        }

        // Save everything atomically
        await this.saveTable(tableName, analysis);
        await this.saveYaml(this.warehousePath, knowledge.warehouse);
        await this.saveYaml(this.patternsPath, knowledge.patterns);
        await this.saveYaml(this.relationshipsPath, knowledge.relationships);

        return knowledge;
        
      } catch (error) {
        console.error('Knowledge base update failed:', error.message);
        
        // Attempt to restore from backup on failure
        await knowledgeBaseBackup.restoreFromBackup(this.warehousePath);
        throw error;
      }
    });
  }

  /**
   * Add insights with safety checks
   */
  async addInsights(tableName, insights) {
    return await knowledgeBaseLocks.withLock(this.warehousePath, async () => {
      const knowledge = await this.load();
      
      if (knowledge.warehouse.table_registry[tableName]) {
        // Validate insights object
        if (!insights || typeof insights !== 'object') {
          throw new Error('Invalid insights data provided');
        }
        
        knowledge.warehouse.table_registry[tableName].llm_insights = {
          purpose: insights.purpose || '',
          upstream: insights.upstream || '',
          downstream: insights.downstream || '',
          critical_columns: Array.isArray(insights.critical_columns) ? insights.critical_columns : [],
          deprecate_columns: Array.isArray(insights.deprecate_columns) ? insights.deprecate_columns : [],
          data_model_position: insights.data_model_position || '',
          next_investigate: insights.next_investigate || '',
          updated: new Date().toISOString()
        };

        await this.saveYaml(this.warehousePath, knowledge.warehouse);
      }
    });
  }

  /**
   * Delete table with consistency checks
   */
  async deleteTable(tableName) {
    return await knowledgeBaseLocks.withLock(this.warehousePath, async () => {
      try {
        // Create backup before deletion
        await knowledgeBaseBackup.createBackup(this.warehousePath);
        
        const knowledge = await this.load();
        
        // Remove table YAML file
        const tableFilePath = path.join(this.tablesPath, `${tableName}.yaml`);
        try {
          await fs.access(tableFilePath);
          await fs.unlink(tableFilePath);
        } catch (error) {
          // File doesn't exist - not an error
        }
        
        // Update warehouse metadata
        if (knowledge.warehouse && knowledge.warehouse.table_registry) {
          const tableInfo = knowledge.warehouse.table_registry[tableName];
          if (tableInfo) {
            // Update technical debt
            if (knowledge.warehouse.warehouse_metadata && tableInfo.tech_debt_hours) {
              knowledge.warehouse.warehouse_metadata.total_technical_debt_hours -= tableInfo.tech_debt_hours;
            }
            
            // Remove from registry
            delete knowledge.warehouse.table_registry[tableName];
            
            // Update discovered tables count
            if (knowledge.warehouse.warehouse_metadata) {
              knowledge.warehouse.warehouse_metadata.discovered_tables = 
                Object.keys(knowledge.warehouse.table_registry).length;
            }
            
            // Remove from domains
            if (knowledge.warehouse.domains && tableInfo.domain) {
              const domainTables = knowledge.warehouse.domains[tableInfo.domain] || [];
              knowledge.warehouse.domains[tableInfo.domain] = domainTables.filter(t => t !== tableName);
              
              // Remove empty domains
              if (knowledge.warehouse.domains[tableInfo.domain].length === 0) {
                delete knowledge.warehouse.domains[tableInfo.domain];
              }
            }
            
            // Update timestamp
            knowledge.warehouse.warehouse_metadata.last_updated = new Date().toISOString();
            
            // Save updated warehouse
            await this.saveYaml(this.warehousePath, knowledge.warehouse);
          }
        }
        
        // Remove any relationships referencing this table
        if (knowledge.relationships) {
          knowledge.relationships.confirmed = (knowledge.relationships.confirmed || [])
            .filter(rel => rel.source_table !== tableName && rel.target_table !== tableName);
          knowledge.relationships.suspected = (knowledge.relationships.suspected || [])
            .filter(rel => rel.source_table !== tableName && rel.target_table !== tableName);
          await this.saveYaml(this.relationshipsPath, knowledge.relationships);
        }
        
        return true;
      } catch (error) {
        console.error(`Failed to delete table ${tableName}:`, error.message);
        
        // Restore from backup on failure
        await knowledgeBaseBackup.restoreFromBackup(this.warehousePath);
        throw error;
      }
    });
  }

  /**
   * Clear all with confirmation and backup
   */
  async clearAll() {
    return await knowledgeBaseLocks.withLock(this.warehousePath, async () => {
      try {
        // Create final backup before clearing
        await knowledgeBaseBackup.createBackup(this.warehousePath);
        
        // Remove the entire archaeology directory
        if (fsSync.existsSync(this.basePath)) {
          await fs.rm(this.basePath, { recursive: true, force: true });
        }
        
        // Reinitialize empty directories
        this.initializeDirectoriesSync();
        
        // Create empty warehouse file
        const emptyWarehouse = this.createEmptyWarehouse();
        await this.saveYaml(this.warehousePath, emptyWarehouse);
        
        return true;
      } catch (error) {
        console.error('Failed to clear all memories:', error.message);
        throw error;
      }
    });
  }

  /**
   * Get knowledge base health status
   */
  async getHealthStatus() {
    try {
      const knowledge = await this.load();
      const backupStats = await knowledgeBaseBackup.getBackupStats(this.warehousePath);
      
      return {
        status: 'healthy',
        tables_count: Object.keys(knowledge.warehouse.table_registry || {}).length,
        last_updated: knowledge.warehouse.warehouse_metadata?.last_updated,
        backup_count: backupStats.count,
        total_backup_size: backupStats.totalSize,
        last_backup: backupStats.newestBackup?.timestamp
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        recovery_available: await this.isRecoveryAvailable()
      };
    }
  }

  /**
   * Check if backup recovery is available
   */
  async isRecoveryAvailable() {
    try {
      const backups = await knowledgeBaseBackup.listBackups(this.warehousePath);
      return backups.length > 0;
    } catch (error) {
      return false;
    }
  }

  // Keep all the existing analysis methods unchanged
  detectCrossTablePatterns(currentAnalysis, knowledge) {
    const patterns = {
      naming_patterns: [],
      column_patterns: [],
      relationship_patterns: [],
      quality_patterns: []
    };

    const currentColumns = currentAnalysis.columns || [];
    const allTables = Object.values(knowledge.warehouse.table_registry || {});
    
    for (const column of currentColumns) {
      const pattern = this.findNamingPattern(column.name, allTables);
      if (pattern) {
        patterns.naming_patterns.push(pattern);
      }
    }

    const suspectedRelationships = this.detectRelationships(currentAnalysis, knowledge);
    patterns.relationship_patterns = suspectedRelationships;

    return patterns;
  }

  findNamingPattern(columnName, allTables) {
    let matchCount = 0;
    const similarColumns = [];

    for (const table of allTables) {
      for (const column of table.columns || []) {
        if (this.columnsSimilar(columnName, column.name)) {
          matchCount++;
          similarColumns.push(`${table.name || 'unknown'}.${column.name}`);
        }
      }
    }

    if (matchCount >= 2) {
      return {
        pattern: columnName,
        frequency: matchCount,
        examples: similarColumns.slice(0, 5),
        confidence: Math.min(matchCount / 10, 1)
      };
    }

    return null;
  }

  columnsSimilar(col1, col2) {
    const normalize = (str) => str.toLowerCase().replace(/[_-]/g, '');
    const norm1 = normalize(col1);
    const norm2 = normalize(col2);
    
    if (norm1 === norm2) return true;
    
    if (norm1.includes('id') && norm2.includes('id')) {
      const base1 = norm1.replace('id', '');
      const base2 = norm2.replace('id', '');
      return base1 === base2 || base1.includes(base2) || base2.includes(base1);
    }
    
    return false;
  }

  detectRelationships(currentAnalysis, knowledge) {
    const relationships = [];
    const currentColumns = currentAnalysis.columns || [];
    const allTables = Object.values(knowledge.warehouse.table_registry || {});

    for (const column of currentColumns) {
      if (column.name.toLowerCase().includes('id') || 
          column.name.toLowerCase().includes('key') ||
          column.name.toLowerCase().includes('ref')) {
        
        const candidates = this.findRelationshipCandidates(column, allTables);
        relationships.push(...candidates);
      }
    }

    return relationships;
  }

  findRelationshipCandidates(column, allTables) {
    const candidates = [];
    
    for (const table of allTables) {
      for (const targetColumn of table.columns || []) {
        if (this.columnsSimilar(column.name, targetColumn.name)) {
          candidates.push({
            from: `${column.table}.${column.name}`,
            to: `${table.name || 'unknown'}.${targetColumn.name}`,
            confidence: this.calculateRelationshipConfidence(column, targetColumn),
            evidence: "Column name similarity"
          });
        }
      }
    }

    return candidates;
  }

  calculateRelationshipConfidence(col1, col2) {
    const name1 = col1.name.toLowerCase();
    const name2 = col2.name.toLowerCase();
    
    if (name1 === name2) return 0.95;
    if (name1.includes(name2) || name2.includes(name1)) return 0.8;
    
    if (col1.type === col2.type) return 0.7;
    
    return 0.5;
  }

  generateWarehouseMap(knowledge) {
    const domains = knowledge.domains || {};
    let map = '\nWAREHOUSE MAP:\n';
    
    for (const [domain, tables] of Object.entries(domains)) {
      map += `\n${domain} Domain (${tables.length} tables):\n`;
      for (const table of tables) {
        const tableInfo = knowledge.table_registry[table];
        const purpose = tableInfo?.llm_insights?.purpose || tableInfo?.likely_purpose || 'Unknown purpose';
        map += `  - ${table} (${purpose.substring(0, 50)}...)\n`;
      }
    }

    return map;
  }

  generateExecutiveSummary(knowledge) {
    const metadata = knowledge.warehouse_metadata;
    const domains = Object.keys(knowledge.domains || {}).length;
    const avgDebt = metadata.total_technical_debt_hours / metadata.discovered_tables || 0;

    return `
WAREHOUSE ARCHAEOLOGY SUMMARY:
- Tables Analyzed: ${metadata.discovered_tables}
- Domains Discovered: ${domains}
- Total Technical Debt: ${metadata.total_technical_debt_hours} hours
- Average Debt per Table: ${avgDebt.toFixed(1)} hours
- Last Updated: ${metadata.last_updated}
    `.trim();
  }
}

// Export both for compatibility
export const KnowledgeBase = SafeKnowledgeBase;
export default SafeKnowledgeBase;