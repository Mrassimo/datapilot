import { parseCSV, detectColumnTypes } from '../utils/parser.js';
import { calculateStats } from '../utils/stats.js';
import { createSection, createSubSection, formatTimestamp, formatFileSize, bulletList, formatNumber, formatSmallDatasetWarning, formatDataTable } from '../utils/format.js';
import { OutputHandler } from '../utils/output.js';
import { statSync } from 'fs';
import { basename } from 'path';
import { KnowledgeBase } from '../utils/knowledgeBase.js';
import ora from 'ora';
import chalk from 'chalk';
import yaml from 'js-yaml';

class ArchaeologyEngine {
  constructor() {
    this.knowledgeBase = new KnowledgeBase();
  }

  async analyzeTable(csvPath, options = {}) {
    const knowledge = await this.knowledgeBase.load();
    
    const spinner = options.quiet ? null : ora('Reading CSV file...').start();
    
    let records, columnTypes;
    if (options.preloadedData) {
      records = options.preloadedData.records;
      columnTypes = options.preloadedData.columnTypes;
    } else {
      records = await parseCSV(csvPath, { quiet: options.quiet, header: options.header });
      if (spinner) spinner.text = 'Performing data archaeology...';
      columnTypes = detectColumnTypes(records);
    }
    
    // Handle empty dataset
    if (records.length === 0) {
      if (spinner) spinner.fail('Empty dataset - no data to analyze');
      const tableName = basename(csvPath, '.csv');
      let report = createSection('🏛️ DATA ENGINEERING ARCHAEOLOGY REPORT',
        `Dataset: ${tableName}.csv\nAnalysis Date: ${formatTimestamp()}\n\n⚠️  Empty dataset - no archaeology to perform`);
      
      // Still include the required section header
      report += createSubSection('🗄️ SCHEMA RECOMMENDATIONS', 'No data available for schema analysis');
      
      return report;
    }
    
    if (spinner) spinner.text = 'Detecting cross-table patterns...';
    const analysis = await this.performAnalysis(csvPath, records, knowledge, columnTypes);
    
    const patterns = this.knowledgeBase.detectCrossTablePatterns(analysis, knowledge);
    
    if (spinner) spinner.text = 'Generating contextual insights...';
    const enhanced = this.addWarehouseContext(analysis, knowledge, patterns);
    
    const prompt = this.generateContextualPrompt(enhanced, knowledge);
    
    const tableName = basename(csvPath, '.csv');
    await this.knowledgeBase.update(tableName, enhanced);
    
    // Auto-save the analysis if requested
    if (options.autoSave) {
      const outputPath = `${process.env.HOME}/.datapilot/warehouse/analyses/${tableName}_analysis.txt`;
      const report = this.formatArchaeologyReport(enhanced, knowledge, patterns, prompt);
      
      // Ensure directory exists
      const { mkdirSync } = await import('fs');
      mkdirSync(`${process.env.HOME}/.datapilot/warehouse/analyses`, { recursive: true });
      
      // Save the report
      const { writeFileSync } = await import('fs');
      writeFileSync(outputPath, report);
      
      if (!options.quiet) {
        console.log(chalk.green(`✓ Analysis saved to: ${outputPath}`));
      }
    }
    
    if (spinner) spinner.succeed('Data archaeology complete!');
    
    return this.formatArchaeologyReport(enhanced, knowledge, patterns, prompt);
  }

  async performAnalysis(csvPath, records, knowledge, columnTypes) {
    const fileName = basename(csvPath);
    const columns = Object.keys(columnTypes);
    
    // Set table_name for use in generateLegacySchemaSection
    this._currentTableName = fileName.replace(/\.csv$/i, '').replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
    
    const analysis = {
      table_name: fileName.replace('.csv', ''),
      file_path: csvPath,
      analyzed_date: new Date().toISOString(),
      row_count: records.length,
      column_count: columns.length,
      columns: columns.map(col => ({
        name: col,
        type: columnTypes[col].type,
        confidence: columnTypes[col].confidence || 0.8,
        table: fileName.replace('.csv', '')
      })),
      quality_score: this.calculateQualityScore(records, columnTypes),
      tech_debt_hours: this.estimateTechnicalDebt(records, columns, columnTypes),
      domain: this.guessDomain(fileName, columns),
      likely_purpose: this.guessTablePurpose(fileName, columns, columnTypes),
      relationships: this.detectPotentialRelationships(columns, columnTypes),
      patterns: this.detectTablePatterns(columns, records),
      schema_recommendations: this.generateSchemaRecommendations(columns, columnTypes, records),
      etl_recommendations: this.generateETLRecommendations(records, columns, columnTypes),
      warehouse_design: generateWarehouseDesign(columns, columnTypes, records),
      performance_recs: generatePerformanceRecommendations(records, columns, columnTypes)
    };
    
    return analysis;
  }

  addWarehouseContext(analysis, knowledge, patterns) {
    const enhanced = { ...analysis };
    
    enhanced.warehouse_context = {
      total_tables_analyzed: knowledge.warehouse_metadata?.discovered_tables || 0,
      related_tables: this.findRelatedTables(analysis, knowledge),
      cumulative_patterns: patterns.naming_patterns.length,
      domain_classification: this.classifyIntoDomain(analysis, knowledge)
    };
    
    enhanced.cross_references = this.generateCrossReferences(analysis, knowledge, patterns);
    enhanced.accumulated_debt = knowledge.warehouse_metadata?.total_technical_debt_hours || 0;
    
    return enhanced;
  }

  generateContextualPrompt(enhanced, knowledge) {
    const tableCount = (knowledge.warehouse_metadata?.discovered_tables || 0) + 1;
    const domains = Object.keys(knowledge.domains || {});
    const relatedTables = enhanced.warehouse_context.related_tables.map(t => t.name).join(', ');
    
    const context = relatedTables ? `\nContext from previous discoveries:\n${this.buildContextFromRelated(enhanced.warehouse_context.related_tables)}` : '';
    
    return `Based on this analysis of ${enhanced.table_name} and the context that this is table ${tableCount} of a data warehouse (${domains.length} domains discovered), please provide:

1. What is the likely business purpose of this table?
2. What upstream systems likely feed this table?
3. What downstream reports/processes likely consume it?
4. What are the critical columns vs ones that could be deprecated?
5. How does this fit into the larger data model we're discovering?
${context}

Please structure your response as:
PURPOSE: [concise explanation]
UPSTREAM: [likely sources]
DOWNSTREAM: [likely consumers]
CRITICAL_COLUMNS: [list]
DEPRECATE_COLUMNS: [list]
DATA_MODEL_POSITION: [how it fits]
NEXT_INVESTIGATE: [what tables to analyze next]`;
  }

  async saveInsights(tableName, llmResponse) {
    const insights = this.parseLLMResponse(llmResponse);
    await this.knowledgeBase.addInsights(tableName, insights);
    console.log(chalk.green(`✓ Insights saved for ${tableName}`));
  }

  async compileKnowledge() {
    const knowledge = await this.knowledgeBase.load();
    
    return {
      summary: this.knowledgeBase.generateExecutiveSummary(knowledge.warehouse),
      warehouse_map: this.knowledgeBase.generateWarehouseMap(knowledge.warehouse),
      relationships: this.generateRelationshipReport(knowledge.relationships),
      patterns: this.generatePatternReport(knowledge.patterns),
      technical_debt: this.generateTechnicalDebtReport(knowledge.warehouse),
      recommendations: this.generateWarehouseRecommendations(knowledge)
    };
  }

  async showMap() {
    const knowledge = await this.knowledgeBase.load();
    return this.knowledgeBase.generateWarehouseMap(knowledge.warehouse);
  }

  formatArchaeologyReport(analysis, knowledge, patterns, prompt) {
    let report = createSection('🏛️ DATA ENGINEERING ARCHAEOLOGY REPORT',
      `Dataset: ${analysis.table_name}.csv\nAnalysis Date: ${formatTimestamp()}\nTable ${(knowledge.warehouse_metadata?.discovered_tables || 0) + 1} in warehouse discovery`);
    
    // Check for small dataset
    const smallDatasetInfo = formatSmallDatasetWarning(analysis.row_count);
    if (smallDatasetInfo) {
      report += '\n' + smallDatasetInfo.warning + '\n';
      if (smallDatasetInfo.showFullData) {
        report += createSubSection('📊 DATASET CLASSIFICATION', 
          'This appears to be reference/lookup data rather than analytical data.\n' +
          'Consider treating this as a dimension or reference table in your warehouse design.');
      }
    }
    
    // Warehouse Context
    if ((knowledge.warehouse_metadata?.discovered_tables || 0) > 0) {
      report += createSubSection('📊 WAREHOUSE CONTEXT', 
        `- This is table ${(knowledge.warehouse_metadata?.discovered_tables || 0) + 1} of ${(knowledge.warehouse_metadata?.discovered_tables || 0) + 1} discovered in your warehouse\n` +
        `- Related tables already analyzed: ${analysis.warehouse_context.related_tables.map(t => t.name).join(', ') || 'None yet'}\n` +
        `- Cumulative patterns detected: ${analysis.warehouse_context.cumulative_patterns}\n` +
        `- Estimated domain: ${analysis.domain}`);
    }

    // Cross-Reference Discoveries
    if (analysis.cross_references && analysis.cross_references.length > 0) {
      report += createSubSection('🔗 CROSS-REFERENCE DISCOVERIES', 
        'Based on previous analyses, we\'ve discovered:\n' +
        analysis.cross_references.map(ref => `- ${ref}`).join('\n'));
    }

    // Standard Schema Analysis
    report += this.formatSchemaSection(analysis);
    
    // Pattern Detection
    if (patterns.naming_patterns.length > 0) {
      report += createSubSection('🔍 NEW PATTERNS DETECTED', 
        patterns.naming_patterns.map(p => 
          `- ${p.pattern}: Found in ${p.frequency} tables (${(p.confidence * 100).toFixed(0)}% confidence)`
        ).join('\n'));
    }

    // Relationship Archaeology
    if (patterns.relationship_patterns.length > 0) {
      report += createSubSection('⚛️ RELATIONSHIP ARCHAEOLOGY', 
        patterns.relationship_patterns.map(rel => 
          `- ${rel.from} -> ${rel.to} (${(rel.confidence * 100).toFixed(0)}% confidence: ${rel.evidence})`
        ).join('\n'));
    }

    // Technical Debt
    report += createSubSection('💸 ACCUMULATED TECHNICAL DEBT', 
      `- This table: ${analysis.tech_debt_hours} hours estimated cleanup\n` +
      `- Total warehouse debt: ${analysis.accumulated_debt + analysis.tech_debt_hours} hours (across ${(knowledge.warehouse_metadata?.discovered_tables || 0) + 1} tables analyzed)\n` +
      `- Debt velocity: ${((analysis.accumulated_debt + analysis.tech_debt_hours) / ((knowledge.warehouse_metadata?.discovered_tables || 0) + 1)).toFixed(1)} hours per table average`);

    // LLM Analysis Prompt
    report += '\n' + chalk.yellow('═'.repeat(80));
    report += '\n' + chalk.yellow('LLM ANALYSIS PROMPT:');
    report += '\n' + chalk.yellow('[Copy everything below to your LLM, then paste response back]');
    report += '\n' + chalk.yellow('═'.repeat(80));
    report += '\n\n' + prompt;
    report += '\n\n' + chalk.yellow('═'.repeat(80));
    report += '\n' + chalk.cyan('TO SAVE LLM INSIGHTS:');
    report += '\n' + chalk.cyan(`datapilot eng --save-insights ${analysis.table_name} "paste LLM response here"`);
    report += '\n' + chalk.yellow('═'.repeat(80));
    
    return report;
  }

  // Helper methods
  calculateQualityScore(records, columnTypes) {
    let score = 100;
    const issues = analyzeDataQuality(records, columnTypes);
    score -= (issues.total / records.length) * 30;
    return Math.max(score, 0);
  }

  estimateTechnicalDebt(records, columns, columnTypes) {
    let hours = 0;
    
    // Schema debt
    const normalizationIssues = analyzeNormalization(records, columns, columnTypes);
    hours += normalizationIssues.length * 4;
    
    // Quality debt  
    const qualityIssues = analyzeDataQuality(records, columnTypes);
    hours += (qualityIssues.total / records.length) * 20;
    
    // Size complexity
    if (records.length > 100000) hours += 5;
    if (columns.length > 20) hours += 3;
    
    return Math.round(hours);
  }

  guessDomain(fileName, columns) {
    // Domain patterns with keywords and weights
    const domainPatterns = {
      'Housing': {
        keywords: ['house', 'housing', 'property', 'real_estate', 'home', 'dwelling', 
                  'residence', 'building', 'apartment', 'bedroom', 'bathroom', 'sqft', 
                  'square_feet', 'listing', 'realestate', 'mortgage'],
        weight: 1.5
      },
      'Customer': {
        keywords: ['customer', 'user', 'client', 'member', 'person', 'people', 
                  'contact', 'account', 'profile', 'subscriber'],
        weight: 1.0
      },
      'Orders': {
        keywords: ['order', 'transaction', 'sale', 'purchase', 'invoice', 
                  'receipt', 'payment', 'checkout', 'cart'],
        weight: 1.0
      },
      'Product': {
        keywords: ['product', 'item', 'inventory', 'sku', 'catalog', 
                  'merchandise', 'goods', 'stock'],
        weight: 1.0
      },
      'Financial': {
        keywords: ['financial', 'finance', 'payment', 'revenue', 'cost', 
                  'price', 'amount', 'balance', 'credit', 'debit', 'bank'],
        weight: 1.0
      },
      'Location': {
        keywords: ['location', 'address', 'city', 'state', 'country', 'zip', 
                  'postal', 'latitude', 'longitude', 'geo', 'region', 'area'],
        weight: 1.2
      },
      'Temporal': {
        keywords: ['date', 'time', 'year', 'month', 'day', 'quarter', 
                  'period', 'timestamp', 'datetime'],
        weight: 0.8
      },
      'Economic': {
        keywords: ['gdp', 'inflation', 'unemployment', 'interest', 'wage', 
                  'income', 'economy', 'economic', 'indicator'],
        weight: 1.3
      },
      'Logging': {
        keywords: ['log', 'event', 'audit', 'trace', 'debug', 'error', 
                  'warning', 'info', 'activity'],
        weight: 0.9
      }
    };
    
    // Create search text from filename and columns
    const searchText = `${fileName} ${columns.join(' ')}`.toLowerCase();
    
    // Score each domain
    const domainScores = {};
    
    for (const [domain, config] of Object.entries(domainPatterns)) {
      let score = 0;
      
      // Check keywords
      for (const keyword of config.keywords) {
        if (searchText.includes(keyword)) {
          score += config.weight;
          
          // Bonus for exact filename match
          if (fileName.toLowerCase().includes(keyword)) {
            score += 0.5;
          }
        }
      }
      
      domainScores[domain] = score;
    }
    
    // Find the highest scoring domain
    let bestDomain = 'Unknown';
    let bestScore = 0;
    
    for (const [domain, score] of Object.entries(domainScores)) {
      if (score > bestScore) {
        bestScore = score;
        bestDomain = domain;
      }
    }
    
    // If score is too low, check for generic patterns
    if (bestScore < 0.5) {
      if (columns.some(c => c.toLowerCase().includes('id'))) {
        if (columns.length < 10) {
          bestDomain = 'Reference';
        } else {
          bestDomain = 'Operational';
        }
      }
    }
    
    return bestDomain;
  }

  guessTablePurpose(fileName, columns, columnTypes) {
    const measures = columns.filter(col => 
      ['integer', 'float'].includes(columnTypes[col].type) &&
      (col.toLowerCase().includes('amount') || 
       col.toLowerCase().includes('count') ||
       col.toLowerCase().includes('total'))
    );
    
    const hasTimestamp = columns.some(c => columnTypes[c].type === 'date');
    const hasIds = columns.filter(c => c.toLowerCase().includes('_id')).length;
    
    if (measures.length > 2 && hasTimestamp) {
      return 'Fact table - transactional data with measures';
    } else if (hasIds > 1) {
      return 'Bridge table - links multiple entities';
    } else if (hasIds === 1) {
      return 'Dimension table - descriptive attributes';
    } else {
      return 'Reference table - lookup or configuration data';
    }
  }

  parseLLMResponse(response) {
    const lines = response.split('\n');
    const insights = {};
    
    for (const line of lines) {
      if (line.startsWith('PURPOSE:')) {
        insights.purpose = line.replace('PURPOSE:', '').trim();
      } else if (line.startsWith('UPSTREAM:')) {
        insights.upstream = line.replace('UPSTREAM:', '').trim().split(',').map(s => s.trim());
      } else if (line.startsWith('DOWNSTREAM:')) {
        insights.downstream = line.replace('DOWNSTREAM:', '').trim().split(',').map(s => s.trim());
      } else if (line.startsWith('CRITICAL_COLUMNS:')) {
        insights.critical_columns = line.replace('CRITICAL_COLUMNS:', '').trim().split(',').map(s => s.trim());
      } else if (line.startsWith('DEPRECATE_COLUMNS:')) {
        insights.deprecate_columns = line.replace('DEPRECATE_COLUMNS:', '').trim().split(',').map(s => s.trim());
      } else if (line.startsWith('DATA_MODEL_POSITION:')) {
        insights.data_model_position = line.replace('DATA_MODEL_POSITION:', '').trim();
      } else if (line.startsWith('NEXT_INVESTIGATE:')) {
        insights.next_investigate = line.replace('NEXT_INVESTIGATE:', '').trim().split(',').map(s => s.trim());
      }
    }
    
    return insights;
  }

  // Stub methods - basic implementation
  detectPotentialRelationships(columns, columnTypes) { return []; }
  detectTablePatterns(columns, records) { return { naming: [], issues: [] }; }
  generateSchemaRecommendations(columns, columnTypes, records) { 
    return this.generateLegacySchemaSection(columns, columnTypes, records); 
  }
  generateETLRecommendations(records, columns, columnTypes) { return ''; }
  findRelatedTables(analysis, knowledge) { return []; }
  classifyIntoDomain(analysis, knowledge) { return analysis.domain; }
  generateCrossReferences(analysis, knowledge, patterns) { 
    const refs = [];
    patterns.naming_patterns.forEach(pattern => {
      if (pattern.frequency > 1) {
        refs.push(`"${pattern.pattern}" matches pattern found in ${pattern.frequency} other tables`);
      }
    });
    return refs;
  }
  buildContextFromRelated(relatedTables) { return '- Related tables: ' + relatedTables.map(t => t.name).join(', '); }
  formatSchemaSection(analysis) {
    // Ensure we have schema recommendations
    if (!analysis.schema_recommendations || analysis.schema_recommendations.trim() === '') {
      // Generate it if missing
      const recommendations = this.generateLegacySchemaSection(
        analysis.columns.map(c => c.name),
        analysis.columns.reduce((acc, col) => {
          acc[col.name] = { type: col.type, confidence: col.confidence };
          return acc;
        }, {}),
        [] // We don't have records in this context
      );
      return createSubSection('🗄️ SCHEMA RECOMMENDATIONS', recommendations);
    }
    return createSubSection('🗄️ SCHEMA RECOMMENDATIONS', analysis.schema_recommendations);
  }
  generateRelationshipReport(relationships) { return yaml.dump(relationships || {}); }
  generatePatternReport(patterns) { return yaml.dump(patterns || {}); }
  generateTechnicalDebtReport(warehouse) { return `Total: ${warehouse?.warehouse_metadata?.total_technical_debt_hours || 0} hours`; }
  generateWarehouseRecommendations(knowledge) { return 'Analyze more tables to build recommendations'; }

  generateLegacySchemaSection(columns, columnTypes, records) {
    // Generate a proper table name from the analysis context
    const tableName = this.generateTableName(columns, columnTypes);
    
    let schema = '\nSuggested Table Structure:\n```sql\n';
    schema += '-- Recommended data types based on analysis\n';
    schema += `CREATE TABLE ${tableName} (\n`;
    
    const columnDefinitions = [];
    columns.forEach(column => {
      const type = columnTypes[column];
      const sqlType = getSQLType(type, records.map(r => r[column]));
      const constraints = getConstraints(column, type, records);
      columnDefinitions.push(`    ${column.toLowerCase().replace(/[^a-z0-9]/g, '_')}${sqlType}${constraints}`);
    });
    
    schema += columnDefinitions.join(',\n');
    schema += '\n);\n```\n';
    
    return schema;
  }

  generateTableName(columns, columnTypes) {
    // Use the table name from the file if available
    if (this._currentTableName) {
      // Ensure it doesn't match any column names
      if (columns.some(col => col.toLowerCase() === this._currentTableName)) {
        return `tbl_${this._currentTableName}`;
      }
      return this._currentTableName;
    }
    
    // Fallback to generating based on data characteristics
    // Check for common table patterns
    const hasCustomerId = columns.some(c => c.toLowerCase().includes('customer'));
    const hasOrderId = columns.some(c => c.toLowerCase().includes('order'));
    const hasProductId = columns.some(c => c.toLowerCase().includes('product'));
    const hasDate = Object.values(columnTypes).some(t => t.type === 'date');
    const hasMeasures = columns.some(c => 
      c.toLowerCase().includes('amount') || 
      c.toLowerCase().includes('count') ||
      c.toLowerCase().includes('total')
    );
    
    // Determine table type and name
    if (hasMeasures && hasDate) {
      if (hasOrderId) return 'fact_orders';
      if (hasCustomerId && hasProductId) return 'fact_sales';
      if (hasCustomerId) return 'fact_customer_transactions';
      return 'fact_transactions';
    } else if (hasCustomerId && !hasMeasures) {
      return 'dim_customers';
    } else if (hasProductId && !hasMeasures) {
      return 'dim_products';
    } else if (columns.length < 5 && columns.some(c => c.toLowerCase().includes('name'))) {
      return 'ref_lookup';
    } else {
      // Default to a generic name based on column count and types
      const numCategorical = Object.values(columnTypes).filter(t => t.type === 'categorical').length;
      if (numCategorical > columns.length * 0.5) {
        return 'dim_reference';
      }
      return 'tbl_data';
    }
  }
}

export async function engineering(filePath, options = {}) {
  const outputHandler = new OutputHandler(options);
  
  if (options.saveInsights) {
    const [tableName, insights] = options.saveInsights;
    const engine = new ArchaeologyEngine();
    await engine.saveInsights(tableName, insights);
    outputHandler.finalize();
    return;
  }
  
  if (options.compileKnowledge) {
    const engine = new ArchaeologyEngine();
    const compilation = await engine.compileKnowledge();
    
    console.log(createSection('📚 WAREHOUSE KNOWLEDGE COMPILATION', formatTimestamp()));
    console.log(compilation.summary);
    console.log(compilation.warehouse_map);
    
    if (options.output) {
      const fullReport = Object.values(compilation).join('\n\n');
      outputHandler.finalize(fullReport);
    } else {
      outputHandler.finalize();
    }
    return;
  }
  
  if (options.showMap) {
    const engine = new ArchaeologyEngine();
    const map = await engine.showMap();
    console.log(map);
    outputHandler.finalize();
    return;
  }
  
  // Use archaeology engine if no specific options
  const engine = new ArchaeologyEngine();
  const report = await engine.analyzeTable(filePath, options);
  console.log(report);
  outputHandler.finalize();
}

// Legacy functions preserved for compatibility
function getSQLType(type, values) {
  const padded = ' '.repeat(Math.max(25 - type.type.length, 1));
  
  switch (type.type) {
    case 'identifier':
      const maxLength = Math.max(...values.filter(v => v).map(v => String(v).length));
      return `${padded}VARCHAR(${Math.max(maxLength * 1.5, 20)})`;
      
    case 'integer':
      const intValues = values.filter(v => typeof v === 'number');
      const maxInt = Math.max(...intValues);
      if (maxInt < 32767) return `${padded}SMALLINT`;
      if (maxInt < 2147483647) return `${padded}INTEGER`;
      return `${padded}BIGINT`;
      
    case 'float':
      return `${padded}DECIMAL(10,2)`;
      
    case 'date':
      const hasTime = values.some(v => v instanceof Date && (v.getHours() !== 0 || v.getMinutes() !== 0));
      return hasTime ? `${padded}TIMESTAMP` : `${padded}DATE`;
      
    case 'email':
      return `${padded}VARCHAR(255)`;
      
    case 'phone':
      return `${padded}VARCHAR(20)`;
      
    case 'postcode':
      return `${padded}CHAR(4)`;
      
    case 'categorical':
      const maxCatLength = Math.max(...type.categories.map(c => String(c).length));
      return `${padded}VARCHAR(${Math.max(maxCatLength * 1.5, 20)})`;
      
    default:
      const maxStrLength = Math.max(...values.filter(v => v).map(v => String(v).length));
      return `${padded}VARCHAR(${Math.max(maxStrLength * 1.5, 50)})`;
  }
}

function getConstraints(column, type, records) {
  const values = records.map(r => r[column]);
  const hasNulls = values.some(v => v === null || v === undefined);
  const isUnique = new Set(values.filter(v => v !== null)).size === values.filter(v => v !== null).length;
  
  let constraints = '';
  
  if (!hasNulls) {
    constraints += ' NOT NULL';
  }
  
  if (isUnique && type.type === 'identifier') {
    constraints += ' PRIMARY KEY';
  }
  
  if (column.toLowerCase() === 'status' && type.type === 'categorical') {
    constraints += ` CHECK (${column} IN (${type.categories.map(c => `'${c}'`).join(', ')}))`;
  }
  
  return constraints;
}

function analyzeDataQuality(records, columnTypes) {
  const issues = {
    total: 0,
    dateIssues: 0,
    nullIssues: 0,
    typeConversions: 0
  };
  
  records.forEach(record => {
    let hasIssue = false;
    
    Object.entries(record).forEach(([column, value]) => {
      const type = columnTypes[column];
      
      if (value === null || value === undefined || value === '') {
        issues.nullIssues++;
        hasIssue = true;
      }
      
      if (type.type === 'date' && value && !(value instanceof Date)) {
        issues.dateIssues++;
        hasIssue = true;
      }
      
      if (type.type === 'integer' && value && typeof value === 'string') {
        issues.typeConversions++;
        hasIssue = true;
      }
    });
    
    if (hasIssue) issues.total++;
  });
  
  return issues;
}

function analyzeNormalization(records, columns, columnTypes) {
  const issues = [];
  
  const textColumns = columns.filter(col => 
    ['string', 'categorical'].includes(columnTypes[col].type)
  );
  
  textColumns.forEach(col => {
    const values = records.map(r => r[col]).filter(v => v);
    const uniqueRatio = new Set(values).size / values.length;
    
    if (uniqueRatio < 0.1 && values.length > 100) {
      issues.push(`${col} appears in ${formatNumber((1 - uniqueRatio) * 100, 1)}% of rows (consider separate dimension table)`);
    }
  });
  
  return issues;
}

function generateWarehouseDesign(columns, columnTypes, records) {
  let design = '';
  
  const measureColumns = columns.filter(col => 
    ['integer', 'float'].includes(columnTypes[col].type) &&
    (col.toLowerCase().includes('amount') || 
     col.toLowerCase().includes('count') ||
     col.toLowerCase().includes('quantity') ||
     col.toLowerCase().includes('total'))
  );
  
  const dimensionColumns = columns.filter(col => 
    columnTypes[col].type === 'categorical' ||
    col.toLowerCase().includes('_id') ||
    col.toLowerCase().includes('type') ||
    col.toLowerCase().includes('category')
  );
  
  design += 'Fact Table: fact_' + (measureColumns[0]?.toLowerCase().replace(/[^a-z]/g, '_') || 'transactions') + '\n';
  design += '- Grain: One row per record\n';
  design += '- Measures: ' + (measureColumns.length > 0 ? measureColumns.join(', ') : 'count(*)') + '\n';
  design += '- Keys: ' + dimensionColumns.filter(c => c.includes('_id')).join(', ') + '\n\n';
  
  return design;
}

function generatePerformanceRecommendations(records, columns, columnTypes) {
  const recommendations = [];
  
  const dateColumns = columns.filter(col => columnTypes[col].type === 'date');
  if (dateColumns.length > 0 && records.length > 100000) {
    recommendations.push(`Partition by ${dateColumns[0]} (monthly partitions)`);
  }
  
  if (columns.length > 20) {
    recommendations.push('Consider columnar storage for analytical queries');
  }
  
  const categoricalColumns = columns.filter(col => columnTypes[col].type === 'categorical');
  if (categoricalColumns.length > columns.length * 0.3) {
    recommendations.push('Compression ratio estimate: 4:1 (high categorical data)');
  } else {
    recommendations.push('Compression ratio estimate: 3:1');
  }
  
  return recommendations;
}