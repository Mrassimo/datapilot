import fs from 'fs';
import path from 'path';
import os from 'os';
import yaml from 'js-yaml';
import { FileLockManager } from './fileLock.js';

export class KnowledgeBase {
  constructor(basePath = null) {
    this.basePath = basePath || path.join(os.homedir(), '.datapilot', 'archaeology');
    this.warehousePath = path.join(this.basePath, 'warehouse_knowledge.yaml');
    this.tablesPath = path.join(this.basePath, 'tables');
    this.patternsPath = path.join(this.basePath, 'patterns.yaml');
    this.relationshipsPath = path.join(this.basePath, 'relationships.yaml');
    
    // Initialize file locks for concurrent access protection
    this.warehouseLock = new FileLockManager(this.warehousePath);
    this.patternsLock = new FileLockManager(this.patternsPath);
    this.relationshipsLock = new FileLockManager(this.relationshipsPath);
    
    this.initializeDirectories();
  }

  initializeDirectories() {
    try {
      fs.mkdirSync(this.basePath, { recursive: true });
      fs.mkdirSync(this.tablesPath, { recursive: true });
    } catch (error) {
      console.error('Failed to initialize knowledge base directories:', error.message);
    }
  }

  async load() {
    try {
      const warehouse = this.loadYaml(this.warehousePath) || this.createEmptyWarehouse();
      const patterns = this.loadYaml(this.patternsPath) || { naming_conventions: [], common_issues: [] };
      const relationships = this.loadYaml(this.relationshipsPath) || { confirmed: [], suspected: [] };

      return {
        warehouse,
        patterns,
        relationships,
        tables: this.loadAllTables()
      };
    } catch (error) {
      console.error('Failed to load knowledge base:', error.message);
      return this.createEmptyKnowledge();
    }
  }

  createEmptyWarehouse() {
    return {
      warehouse_metadata: {
        name: "Discovered Data Warehouse",
        discovered_tables: 0,
        last_updated: new Date().toISOString(),
        total_technical_debt_hours: 0
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

  loadYaml(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        return yaml.load(content);
      }
      return null;
    } catch (error) {
      console.error(`Failed to load ${filePath}:`, error.message);
      return null;
    }
  }

  
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

async saveYaml(filePath, data) {
    // Determine which lock to use based on file path
    let lockManager = null;
    if (filePath === this.warehousePath) {
      lockManager = this.warehouseLock;
    } else if (filePath === this.patternsPath) {
      lockManager = this.patternsLock;
    } else if (filePath === this.relationshipsPath) {
      lockManager = this.relationshipsLock;
    }
    
    // Create backup before writing
    try {
      if (fs.existsSync(filePath)) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = `${filePath}.backup-${timestamp}`;
        fs.copyFileSync(filePath, backupPath);
        
        // Keep only last 3 backups to save space
        this.cleanupOldBackups(filePath);
      }
    } catch (backupError) {
      console.warn(`Failed to create backup for ${filePath}:`, backupError.message);
    }
    
    const saveOperation = () => {
      try {
        const yamlContent = yaml.dump(this.cleanForYaml(data), {
          indent: 2,
          lineWidth: 120,
          noRefs: true
        });
        
        // Validate content before saving
        if (yamlContent.includes('undefined') || 
            yamlContent.includes('[object Object]') ||
            yamlContent.includes('function') ||
            yamlContent.trim().length === 0) {
          throw new Error('Invalid YAML content generated');
        }
        
        fs.writeFileSync(filePath, yamlContent, 'utf8');
      } catch (error) {
        console.error(`Failed to save ${filePath}:`, error.message);
        throw error;
      }
    };
    
    // Use file locking if available, otherwise proceed without it
    if (lockManager) {
      try {
        await lockManager.withLock(saveOperation, 3000); // 3 second timeout
      } catch (lockError) {
        console.warn(`File locking failed for ${filePath}, proceeding without lock:`, lockError.message);
        saveOperation();
      }
    } else {
      saveOperation();
    }
  }

  cleanupOldBackups(filePath) {
    try {
      const dir = path.dirname(filePath);
      const basename = path.basename(filePath);
      const files = fs.readdirSync(dir);
      
      const backups = files
        .filter(f => f.startsWith(`${basename}.backup-`))
        .map(f => ({
          name: f,
          path: path.join(dir, f),
          stat: fs.statSync(path.join(dir, f))
        }))
        .sort((a, b) => b.stat.mtime - a.stat.mtime); // Sort by modification time, newest first
      
      // Keep only the 3 most recent backups
      const backupsToDelete = backups.slice(3);
      
      for (const backup of backupsToDelete) {
        try {
          fs.unlinkSync(backup.path);
        } catch (error) {
          console.warn(`Failed to delete old backup ${backup.name}:`, error.message);
        }
      }
    } catch (error) {
      console.warn(`Failed to cleanup backups for ${filePath}:`, error.message);
    }
  }

  loadAllTables() {
    try {
      const tables = {};
      const files = fs.readdirSync(this.tablesPath);
      
      for (const file of files) {
        if (file.endsWith('.yaml')) {
          const tableName = file.replace('.yaml', '');
          tables[tableName] = this.loadYaml(path.join(this.tablesPath, file));
        }
      }
      
      return tables;
    } catch (error) {
      console.error('Failed to load tables:', error.message);
      return {};
    }
  }

  async saveTable(tableName, analysis) {
    const tablePath = path.join(this.tablesPath, `${tableName}.yaml`);
    await this.saveYaml(tablePath, analysis);
  }

  async update(tableName, analysis) {
    const knowledge = await this.load();
    
    // Update warehouse metadata
    knowledge.warehouse.warehouse_metadata.discovered_tables += 1;
    knowledge.warehouse.warehouse_metadata.last_updated = new Date().toISOString();
    knowledge.warehouse.warehouse_metadata.total_technical_debt_hours += analysis.tech_debt_hours || 0;

    // Add to table registry
    knowledge.warehouse.table_registry[tableName] = {
      analyzed_date: new Date().toISOString(),
      likely_purpose: analysis.likely_purpose || "Unknown",
      quality_score: analysis.quality_score || 50,
      tech_debt_hours: analysis.tech_debt_hours || 0,
      relationships: analysis.relationships || [],
      columns: analysis.columns || [],
      domain: analysis.domain || "Unknown"
    };

    // Update domain classification
    const domain = analysis.domain || "Unknown";
    if (!knowledge.warehouse.domains[domain]) {
      knowledge.warehouse.domains[domain] = [];
    }
    if (!knowledge.warehouse.domains[domain].includes(tableName)) {
      knowledge.warehouse.domains[domain].push(tableName);
    }

    // Update patterns
    if (analysis.patterns) {
      knowledge.patterns.naming_conventions.push(...analysis.patterns.naming || []);
      knowledge.patterns.common_issues.push(...analysis.patterns.issues || []);
    }

    // Update relationships
    if (analysis.relationships) {
      knowledge.relationships.confirmed.push(...analysis.relationships.confirmed || []);
      knowledge.relationships.suspected.push(...analysis.relationships.suspected || []);
    }

    // Save everything
    await this.saveTable(tableName, analysis);
    await this.saveYaml(this.warehousePath, knowledge.warehouse);
    await this.saveYaml(this.patternsPath, knowledge.patterns);
    await this.saveYaml(this.relationshipsPath, knowledge.relationships);

    return knowledge;
  }

  async addInsights(tableName, insights) {
    const knowledge = await this.load();
    
    if (knowledge.warehouse.table_registry[tableName]) {
      knowledge.warehouse.table_registry[tableName].llm_insights = {
        purpose: insights.purpose,
        upstream: insights.upstream,
        downstream: insights.downstream,
        critical_columns: insights.critical_columns,
        deprecate_columns: insights.deprecate_columns,
        data_model_position: insights.data_model_position,
        next_investigate: insights.next_investigate,
        updated: new Date().toISOString()
      };

      await this.saveYaml(this.warehousePath, knowledge.warehouse);
    }
  }

  detectCrossTablePatterns(currentAnalysis, knowledge) {
    const patterns = {
      naming_patterns: [],
      column_patterns: [],
      relationship_patterns: [],
      quality_patterns: []
    };

    // Detect naming patterns
    const currentColumns = currentAnalysis.columns || [];
    const allTables = Object.values(knowledge.warehouse.table_registry || {});
    
    for (const column of currentColumns) {
      const pattern = this.findNamingPattern(column.name, allTables);
      if (pattern) {
        patterns.naming_patterns.push(pattern);
      }
    }

    // Detect relationship patterns
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
    
    // Exact match after normalization
    if (norm1 === norm2) return true;
    
    // Contains relationship (for foreign keys)
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
    
    // Type compatibility
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

  async deleteTable(tableName) {
    try {
      // Load current warehouse knowledge
      const knowledge = await this.load();
      
      // Remove table YAML file
      const tableFilePath = path.join(this.tablesPath, `${tableName}.yaml`);
      if (fs.existsSync(tableFilePath)) {
        fs.unlinkSync(tableFilePath);
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
      throw error;
    }
  }

  async clearAll() {
    try {
      // Remove the entire archaeology directory
      if (fs.existsSync(this.basePath)) {
        // Recursively remove all files and directories
        this.removeDirectory(this.basePath);
      }
      
      // Reinitialize empty directories
      this.initializeDirectories();
      
      // Create empty warehouse file
      const emptyWarehouse = this.createEmptyWarehouse();
      await this.saveYaml(this.warehousePath, emptyWarehouse);
      
      return true;
    } catch (error) {
      console.error('Failed to clear all memories:', error.message);
      throw error;
    }
  }

  removeDirectory(dirPath) {
    if (fs.existsSync(dirPath)) {
      fs.readdirSync(dirPath).forEach((file) => {
        const curPath = path.join(dirPath, file);
        if (fs.lstatSync(curPath).isDirectory()) {
          // Recursive call for directories
          this.removeDirectory(curPath);
        } else {
          // Delete file
          fs.unlinkSync(curPath);
        }
      });
      fs.rmdirSync(dirPath);
    }
  }
}