import { parseCSV, detectColumnTypes } from '../utils/parser.js';
import { calculateStats } from '../utils/stats.js';
import { createSection, createSubSection, formatTimestamp, formatFileSize, bulletList, formatNumber, formatSmallDatasetWarning, formatDataTable } from '../utils/format.js';
import { createSamplingStrategy, performSampling, createProgressTracker } from './eda/utils/sampling.js';
import { OutputHandler } from '../utils/output.js';
import { statSync } from 'fs';
import { basename } from 'path';
import { KnowledgeBase } from '../utils/knowledgeBase.js';
import { createRelationshipValidator } from './eng/validators/relationshipValidator.js';
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
    
    // Structured data mode for LLM consumption
    const structuredMode = options.structuredOutput || options.llmMode;
    
    let records, columnTypes;
    if (options.preloadedData) {
      records = options.preloadedData.records;
      columnTypes = options.preloadedData.columnTypes;
    } else {
      const allRecords = await parseCSV(csvPath, { quiet: options.quiet, header: options.header });
      const originalSize = allRecords.length;
      
      // Apply smart sampling for large datasets
      const samplingStrategy = createSamplingStrategy(allRecords, 'basic');
      
      if (samplingStrategy.method !== 'none') {
        if (spinner) {
          spinner.text = `Large dataset detected (${originalSize.toLocaleString()} rows). Applying smart sampling...`;
        } else {
          console.log(`- Large dataset detected (${originalSize.toLocaleString()} rows). Applying smart sampling...`);
        }
        
        records = performSampling(allRecords, samplingStrategy);
        console.log(`⚠️  Large dataset sampled: ${records.length.toLocaleString()} of ${originalSize.toLocaleString()} rows (${samplingStrategy.method} sampling)`);
      } else {
        records = allRecords;
      }
      
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
    
    // Return structured data if requested for LLM consumption
    if (structuredMode) {
      if (spinner) spinner.succeed('Data archaeology complete!');
      return {
        analysis: enhanced,
        structuredResults: {
          schemaRecommendations: enhanced.schema_recommendations || [],
          performanceAnalysis: {
            dataVolume: enhanced.row_count,
            queryPatterns: patterns.issues || [],
            joinComplexity: enhanced.relationships?.length > 3 ? 'high' : 'moderate'
          },
          etlAnalysis: enhanced.etl_recommendations || {},
          technicalDebt: [{ hours: enhanced.tech_debt_hours, type: 'cleanup' }],
          relationships: enhanced.relationships || [],
          warehouseKnowledge: knowledge
        }
      };
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
      relationships: this.detectPotentialRelationships(columns, columnTypes, records),
      patterns: this.detectTablePatterns(columns, records, columnTypes),
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

  // Enhanced analysis methods with advanced pattern recognition
  detectPotentialRelationships(columns, columnTypes, records = []) {
    const relationships = [];
    
    // Create validator for data-driven validation
    const validator = records.length > 0 ? createRelationshipValidator(records, columns, columnTypes) : null;
    
    // Advanced foreign key pattern analysis
    columns.forEach(column => {
      const type = columnTypes[column];
      const colLower = column.toLowerCase();
      
      // Sophisticated ID pattern detection
      if (colLower.includes('_id') || colLower.endsWith('id')) {
        const tableHint = this.extractTableFromId(colLower);
        const nameBasedConfidence = this.calculateFKConfidence(column, type, tableHint);
        
        if (tableHint && nameBasedConfidence > 0.5) {
          const targetTable = this.pluralizeTableName(tableHint);
          let finalConfidence = nameBasedConfidence;
          let dataValidation = null;
          
          // Perform data validation if validator is available
          if (validator) {
            dataValidation = validator.validateForeignKey(column, targetTable);
            // Combine name-based and data-based confidence
            finalConfidence = (nameBasedConfidence * 0.4 + dataValidation.confidence * 0.6);
          }
          
          relationships.push({
            type: 'foreign_key',
            column: column,
            confidence: finalConfidence,
            target_table: targetTable,
            target_column: 'id',
            evidence: this.buildFKEvidence(column, type, tableHint, finalConfidence),
            dataValidation: dataValidation,
            validationIssues: dataValidation?.issues || []
          });
        }
      }
      
      // Enhanced code/reference pattern analysis
      if ((colLower.includes('code') || colLower.includes('cd')) && type.type === 'categorical') {
        const domain = this.extractDomainFromCode(colLower);
        const nameBasedConfidence = this.calculateCodeConfidence(column, type);
        const targetTable = `ref_${domain}_codes`;
        let finalConfidence = nameBasedConfidence;
        let dataValidation = null;
        
        // Perform data validation if validator is available
        if (validator) {
          dataValidation = validator.validateForeignKey(column, targetTable, 'code');
          // Combine name-based and data-based confidence
          finalConfidence = (nameBasedConfidence * 0.4 + dataValidation.confidence * 0.6);
        }
        
        relationships.push({
          type: 'lookup_reference',
          column: column,
          confidence: finalConfidence,
          target_table: targetTable,
          target_column: 'code',
          evidence: `Code pattern (${type.categories?.length || 'unknown'} distinct values) suggests lookup table relationship`,
          dataValidation: dataValidation,
          validationIssues: dataValidation?.issues || []
        });
      }
      
      // Advanced categorical pattern analysis
      if ((colLower.includes('type') || colLower.includes('category') || colLower.includes('status')) && type.type === 'categorical') {
        const nameBasedConfidence = this.calculateCategoricalConfidence(column, type);
        const targetTable = `ref_${colLower.replace(/[^a-z]/g, '_')}s`;
        let finalConfidence = nameBasedConfidence;
        let dataValidation = null;
        
        // Perform data validation if validator is available
        if (validator) {
          dataValidation = validator.validateForeignKey(column, targetTable, 'name');
          // Combine name-based and data-based confidence
          finalConfidence = (nameBasedConfidence * 0.4 + dataValidation.confidence * 0.6);
        }
        
        relationships.push({
          type: 'enum_reference',
          column: column,
          confidence: finalConfidence,
          target_table: targetTable,
          target_column: 'name',
          evidence: `Categorical field (${type.categories?.length || 'unknown'} values) suggests enumeration reference`,
          dataValidation: dataValidation,
          validationIssues: dataValidation?.issues || []
        });
      }
      
      // Geographic relationship detection
      if (this.isGeographicColumn(colLower, type)) {
        const geoType = this.detectGeographicType(colLower, type);
        relationships.push({
          type: 'geographic_reference',
          column: column,
          confidence: 0.8,
          target_table: `ref_${geoType}`,
          target_column: geoType === 'countries' ? 'country_code' : 'name',
          evidence: `Geographic pattern suggests ${geoType} reference table`
        });
      }
      
      // Temporal relationship detection
      if (type.type === 'date' || colLower.includes('date') || colLower.includes('time')) {
        const timeGrain = this.detectTimeGrain(colLower);
        relationships.push({
          type: 'temporal_dimension',
          column: column,
          confidence: 0.9,
          target_table: `dim_${timeGrain}`,
          target_column: `${timeGrain}_key`,
          evidence: `Temporal column suggests ${timeGrain} dimension relationship`
        });
      }
    });
    
    // Cross-column relationship analysis
    const crossColumnRels = this.detectCrossColumnRelationships(columns, columnTypes);
    relationships.push(...crossColumnRels);
    
    return relationships.sort((a, b) => b.confidence - a.confidence);
  }

  detectTablePatterns(columns, records, columnTypes) {
    const patterns = {
      naming: [],
      issues: [],
      table_type: 'unknown',
      granularity: 'unknown',
      quality_flags: [],
      statistical_profile: {},
      complexity_score: 0
    };
    
    // Enhanced table type analysis with statistical backing
    const measures = this.identifyMeasureColumns(columns, columnTypes, records);
    const dimensions = this.identifyDimensionColumns(columns, columnTypes, records);
    const hasTimestamp = columns.some(c => columnTypes[c]?.type === 'date');
    const hasPrimaryKey = this.detectPrimaryKey(columns, columnTypes, records);
    
    // Advanced table type classification with confidence scoring
    const tableClassification = this.classifyTableType(measures, dimensions, hasTimestamp, hasPrimaryKey, columns.length, records.length);
    patterns.table_type = tableClassification.type;
    patterns.granularity = tableClassification.granularity;
    patterns.naming.push({
      pattern: tableClassification.pattern,
      confidence: tableClassification.confidence,
      evidence: tableClassification.evidence
    });
    
    // Statistical profiling for pattern detection
    patterns.statistical_profile = this.generateStatisticalProfile(columns, columnTypes, records);
    
    // Advanced naming convention analysis
    const namingAnalysis = this.analyzeNamingConventions(columns);
    patterns.naming.push(...namingAnalysis);
    
    // Complex data quality analysis
    if (records.length > 0) {
      patterns.issues.push(...this.detectAdvancedDataIssues(columns, columnTypes, records));
      patterns.quality_flags.push(...this.generateQualityFlags(columns, columnTypes, records));
      patterns.complexity_score = this.calculateComplexityScore(columns, columnTypes, records, patterns);
    }
    
    return patterns;
  }
  
  identifyMeasureColumns(columns, columnTypes, records) {
    return columns.filter(col => {
      const type = columnTypes[col];
      const colLower = col.toLowerCase();
      
      // Type-based identification
      if (!['integer', 'float'].includes(type?.type)) return false;
      
      // Semantic identification
      const measureKeywords = ['amount', 'count', 'total', 'quantity', 'value', 'sum', 'avg', 'price', 'cost', 'revenue', 'profit'];
      const isMeasureByName = measureKeywords.some(keyword => colLower.includes(keyword));
      
      // Statistical identification (high cardinality numeric) with sampling
      if (records.length > 0) {
        const samplingStrategy = createSamplingStrategy(records, 'basic');
        const sampledRecords = performSampling(records, samplingStrategy);
        
        const values = sampledRecords.map(r => r[col]).filter(v => v !== null && v !== undefined);
        const uniqueRatio = new Set(values).size / values.length;
        const isHighCardinality = uniqueRatio > 0.8;
        
        return isMeasureByName || (isHighCardinality && values.length > 10);
      }
      
      return isMeasureByName;
    });
  }
  
  identifyDimensionColumns(columns, columnTypes, records) {
    return columns.filter(col => {
      const colLower = col.toLowerCase();
      const type = columnTypes[col];
      
      // Clear dimensional indicators
      if (colLower.includes('_id') || colLower.includes('type') || 
          colLower.includes('category') || colLower.includes('status') ||
          colLower.includes('code')) return true;
      
      // Categorical columns with reasonable cardinality (with sampling)
      if (type?.type === 'categorical' && records.length > 0) {
        const samplingStrategy = createSamplingStrategy(records, 'basic');
        const sampledRecords = performSampling(records, samplingStrategy);
        
        const values = sampledRecords.map(r => r[col]).filter(v => v);
        const uniqueCount = new Set(values).size;
        return uniqueCount >= 2 && uniqueCount <= Math.min(values.length * 0.5, 100);
      }
      
      return false;
    });
  }
  
  detectPrimaryKey(columns, columnTypes, records) {
    // Look for explicit primary key patterns
    const pkCandidates = columns.filter(col => {
      const colLower = col.toLowerCase();
      return colLower === 'id' || colLower === 'pk' || colLower.endsWith('_pk');
    });
    
    if (pkCandidates.length > 0) return pkCandidates[0];
    
    // Analyze uniqueness if we have data
    if (records.length > 0) {
      for (const col of columns) {
        const values = records.map(r => r[col]).filter(v => v !== null && v !== undefined);
        const isUnique = new Set(values).size === values.length;
        const isNotNull = values.length === records.length;
        
        if (isUnique && isNotNull && columnTypes[col]?.type === 'identifier') {
          return col;
        }
      }
    }
    
    return null;
  }
  
  classifyTableType(measures, dimensions, hasTimestamp, hasPrimaryKey, columnCount, recordCount) {
    const scores = {
      fact_table: 0,
      dimension_table: 0,
      reference_table: 0,
      bridge_table: 0,
      event_log: 0
    };
    
    // Fact table scoring
    scores.fact_table += measures.length * 0.3;
    if (hasTimestamp) scores.fact_table += 0.4;
    if (dimensions.length >= 2) scores.fact_table += 0.2;
    if (recordCount > 1000) scores.fact_table += 0.1;
    
    // Dimension table scoring
    if (hasPrimaryKey) scores.dimension_table += 0.4;
    scores.dimension_table += Math.min(dimensions.length * 0.1, 0.3);
    if (measures.length <= 1) scores.dimension_table += 0.2;
    if (columnCount > 5) scores.dimension_table += 0.1;
    
    // Reference table scoring
    if (columnCount <= 5) scores.reference_table += 0.3;
    if (hasPrimaryKey) scores.reference_table += 0.3;
    if (recordCount < 1000) scores.reference_table += 0.2;
    if (measures.length === 0) scores.reference_table += 0.2;
    
    // Bridge table scoring
    if (dimensions.length >= 3) scores.bridge_table += 0.4;
    if (!hasPrimaryKey && dimensions.length >= 2) scores.bridge_table += 0.3;
    if (measures.length === 0) scores.bridge_table += 0.2;
    if (columnCount <= 8) scores.bridge_table += 0.1;
    
    // Event log scoring
    if (hasTimestamp) scores.event_log += 0.3;
    if (recordCount > 10000) scores.event_log += 0.2;
    if (measures.length <= 2) scores.event_log += 0.2;
    
    // Find the highest scoring type
    const bestType = Object.entries(scores).reduce((a, b) => scores[a[0]] > scores[b[0]] ? a : b);
    const confidence = Math.min(bestType[1], 0.95);
    
    const classifications = {
      fact_table: {
        granularity: hasTimestamp ? 'transactional' : 'aggregate',
        pattern: 'Fact table pattern',
        evidence: `${measures.length} measures, ${hasTimestamp ? 'timestamped, ' : ''}${dimensions.length} dimensions`
      },
      dimension_table: {
        granularity: 'entity',
        pattern: 'Dimension table pattern',
        evidence: `${dimensions.length} dimensional attributes${hasPrimaryKey ? ' with primary key' : ''}`
      },
      reference_table: {
        granularity: 'lookup',
        pattern: 'Reference/lookup table pattern',
        evidence: `Small table (${columnCount} columns)${hasPrimaryKey ? ' with primary key' : ''}`
      },
      bridge_table: {
        granularity: 'relationship',
        pattern: 'Bridge/junction table pattern',
        evidence: `Multiple foreign keys (${dimensions.length}) managing relationships`
      },
      event_log: {
        granularity: 'temporal',
        pattern: 'Event log pattern',
        evidence: `Time-series data with ${recordCount} events`
      }
    };
    
    return {
      type: bestType[0],
      confidence,
      ...classifications[bestType[0]]
    };
  }
  
  generateStatisticalProfile(columns, columnTypes, records) {
    if (records.length === 0) return {};
    
    const profile = {
      row_count: records.length,
      column_count: columns.length,
      density: 0,
      cardinality_distribution: {},
      type_distribution: {},
      null_distribution: {}
    };
    
    let totalCells = 0;
    let nonNullCells = 0;
    
    columns.forEach(col => {
      const values = records.map(r => r[col]);
      const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== '');
      const uniqueCount = new Set(nonNullValues).size;
      
      totalCells += values.length;
      nonNullCells += nonNullValues.length;
      
      profile.cardinality_distribution[col] = {
        unique_count: uniqueCount,
        unique_ratio: nonNullValues.length > 0 ? uniqueCount / nonNullValues.length : 0
      };
      
      profile.null_distribution[col] = {
        null_count: values.length - nonNullValues.length,
        null_ratio: (values.length - nonNullValues.length) / values.length
      };
      
      const type = columnTypes[col]?.type || 'unknown';
      profile.type_distribution[type] = (profile.type_distribution[type] || 0) + 1;
    });
    
    profile.density = totalCells > 0 ? nonNullCells / totalCells : 0;
    
    return profile;
  }
  
  analyzeNamingConventions(columns) {
    const conventions = [];
    
    // Pattern analysis
    const snakeCase = columns.filter(c => /^[a-z]+(_[a-z0-9]+)*$/.test(c)).length;
    const camelCase = columns.filter(c => /^[a-z]+([A-Z][a-z0-9]*)*$/.test(c)).length;
    const pascalCase = columns.filter(c => /^[A-Z][a-z0-9]*([A-Z][a-z0-9]*)*$/.test(c)).length;
    const allUpper = columns.filter(c => c === c.toUpperCase()).length;
    const total = columns.length;
    
    if (snakeCase > total * 0.7) {
      conventions.push({
        pattern: 'snake_case naming convention',
        confidence: Math.min(0.9, snakeCase / total),
        evidence: `${snakeCase}/${total} columns follow snake_case pattern`
      });
    }
    
    if (camelCase > total * 0.7) {
      conventions.push({
        pattern: 'camelCase naming convention',
        confidence: Math.min(0.9, camelCase / total),
        evidence: `${camelCase}/${total} columns follow camelCase pattern`
      });
    }
    
    if (pascalCase > total * 0.7) {
      conventions.push({
        pattern: 'PascalCase naming convention',
        confidence: Math.min(0.9, pascalCase / total),
        evidence: `${pascalCase}/${total} columns follow PascalCase pattern`
      });
    }
    
    if (allUpper > total * 0.7) {
      conventions.push({
        pattern: 'UPPER_CASE naming convention',
        confidence: Math.min(0.9, allUpper / total),
        evidence: `${allUpper}/${total} columns follow UPPER_CASE pattern`
      });
    }
    
    // Semantic patterns
    const prefixGroups = this.analyzePrefixPatterns(columns);
    const suffixGroups = this.analyzeSuffixPatterns(columns);
    
    Object.entries(prefixGroups).forEach(([prefix, count]) => {
      if (count >= 2) {
        conventions.push({
          pattern: `Prefix pattern: ${prefix}_*`,
          confidence: 0.7,
          evidence: `${count} columns share prefix '${prefix}'`
        });
      }
    });
    
    Object.entries(suffixGroups).forEach(([suffix, count]) => {
      if (count >= 2) {
        conventions.push({
          pattern: `Suffix pattern: *_${suffix}`,
          confidence: 0.7,
          evidence: `${count} columns share suffix '${suffix}'`
        });
      }
    });
    
    return conventions;
  }
  
  analyzePrefixPatterns(columns) {
    const prefixes = {};
    columns.forEach(col => {
      if (col.includes('_')) {
        const prefix = col.split('_')[0];
        prefixes[prefix] = (prefixes[prefix] || 0) + 1;
      }
    });
    return prefixes;
  }
  
  analyzeSuffixPatterns(columns) {
    const suffixes = {};
    columns.forEach(col => {
      if (col.includes('_')) {
        const parts = col.split('_');
        const suffix = parts[parts.length - 1];
        suffixes[suffix] = (suffixes[suffix] || 0) + 1;
      }
    });
    return suffixes;
  }
  
  detectAdvancedDataIssues(columns, columnTypes, records) {
    const issues = [];
    
    // Enhanced normalization analysis
    const textColumns = columns.filter(col => 
      ['string', 'categorical'].includes(columnTypes[col]?.type)
    );
    
    textColumns.forEach(col => {
      const values = records.map(r => r[col]).filter(v => v);
      if (values.length === 0) return;
      
      const uniqueRatio = new Set(values).size / values.length;
      const avgLength = values.reduce((sum, v) => sum + String(v).length, 0) / values.length;
      
      // Low cardinality issues
      if (uniqueRatio < 0.05 && values.length > 100) {
        issues.push({
          type: 'severe_normalization',
          column: col,
          severity: 'high',
          description: `Column '${col}' has extremely low cardinality (${(uniqueRatio * 100).toFixed(2)}% unique) - strong candidate for dimension table normalization`
        });
      } else if (uniqueRatio < 0.15 && values.length > 50) {
        issues.push({
          type: 'normalization',
          column: col,
          severity: 'medium',
          description: `Column '${col}' has low cardinality (${(uniqueRatio * 100).toFixed(1)}% unique) - consider separate dimension`
        });
      }
      
      // Potential denormalization patterns
      if (col.includes('_') && uniqueRatio > 0.8 && values.length > 100) {
        const prefix = col.split('_')[0];
        const relatedCols = columns.filter(c => c.startsWith(prefix + '_'));
        if (relatedCols.length > 2) {
          issues.push({
            type: 'denormalization',
            columns: relatedCols,
            severity: 'low',
            description: `Multiple '${prefix}_*' columns suggest potential entity that could be normalized`
          });
        }
      }
      
      // Text quality issues
      if (avgLength > 100) {
        issues.push({
          type: 'text_quality',
          column: col,
          severity: 'low',
          description: `Column '${col}' has long text values (avg ${avgLength.toFixed(0)} chars) - consider breaking into separate fields`
        });
      }
    });
    
    // Identify potential composite key issues
    const idColumns = columns.filter(col => col.toLowerCase().includes('_id'));
    if (idColumns.length > 3) {
      issues.push({
        type: 'complex_relationships',
        columns: idColumns,
        severity: 'medium',
        description: `Many foreign keys (${idColumns.length}) suggest complex relationships - consider simplification`
      });
    }
    
    return issues;
  }
  
  generateQualityFlags(columns, columnTypes, records) {
    const flags = [];
    
    // Enhanced null analysis
    const nullCounts = {};
    const emptyCounts = {};
    
    records.forEach(record => {
      columns.forEach(col => {
        if (!nullCounts[col]) nullCounts[col] = 0;
        if (!emptyCounts[col]) emptyCounts[col] = 0;
        
        if (!record[col] || record[col] === null || record[col] === undefined) {
          nullCounts[col]++;
        }
        if (record[col] === '') {
          emptyCounts[col]++;
        }
      });
    });
    
    Object.entries(nullCounts).forEach(([col, nullCount]) => {
      const nullRatio = nullCount / records.length;
      const emptyRatio = emptyCounts[col] / records.length;
      
      if (nullRatio > 0.8) {
        flags.push({
          type: 'critical_nulls',
          column: col,
          value: nullRatio,
          severity: 'high',
          description: `Column '${col}' has ${(nullRatio * 100).toFixed(1)}% null values - consider removal`
        });
      } else if (nullRatio > 0.5) {
        flags.push({
          type: 'high_nulls',
          column: col,
          value: nullRatio,
          severity: 'medium',
          description: `Column '${col}' has ${(nullRatio * 100).toFixed(1)}% null values`
        });
      }
      
      if (emptyRatio > 0.3) {
        flags.push({
          type: 'empty_strings',
          column: col,
          value: emptyRatio,
          severity: 'low',
          description: `Column '${col}' has ${(emptyRatio * 100).toFixed(1)}% empty strings`
        });
      }
    });
    
    return flags;
  }
  
  calculateComplexityScore(columns, columnTypes, records, patterns) {
    let score = 0;
    
    // Base complexity from size
    score += Math.min(columns.length * 0.5, 10);
    score += Math.min(Math.log10(records.length + 1) * 2, 8);
    
    // Type diversity
    const typeCount = Object.keys(patterns.statistical_profile.type_distribution || {}).length;
    score += typeCount;
    
    // Relationship complexity
    const idColumns = columns.filter(col => col.toLowerCase().includes('_id')).length;
    score += idColumns * 0.5;
    
    // Quality issues
    score += patterns.issues.length;
    score += patterns.quality_flags.length * 0.5;
    
    // Naming consistency (lower complexity for consistent naming)
    const namingPatterns = patterns.naming.filter(p => p.confidence > 0.7).length;
    score = Math.max(score - namingPatterns, 0);
    
    return Math.round(score * 10) / 10;
  }

  generateSchemaRecommendations(columns, columnTypes, records) {
    const relationships = this.detectPotentialRelationships(columns, columnTypes, records);
    let recommendations = this.generateLegacySchemaSection(columns, columnTypes, records);
    
    // Add relationships section if any were found
    if (relationships && relationships.length > 0) {
      recommendations += '\nDetected Relationships:\n';
      relationships.forEach(rel => {
        // Handle cross-column relationships which use 'columns' instead of 'column'
        const sourceColumn = rel.column || (rel.columns ? rel.columns.join(', ') : 'unknown');
        recommendations += `\n- ${sourceColumn} → ${rel.target_table}.${rel.target_column}`;
        recommendations += `\n  Type: ${rel.type}, Confidence: ${(rel.confidence * 100).toFixed(0)}%`;
        recommendations += `\n  Evidence: ${rel.evidence}`;
        
        // Add validation results if available
        if (rel.dataValidation) {
          recommendations += `\n  Data Validation: ${rel.dataValidation.validationType} - Confidence: ${(rel.dataValidation.confidence * 100).toFixed(0)}%`;
          if (rel.dataValidation.issues && rel.dataValidation.issues.length > 0) {
            recommendations += '\n  Issues Found:';
            rel.dataValidation.issues.forEach(issue => {
              recommendations += `\n    - ${issue}`;
            });
          }
          if (rel.dataValidation.details) {
            Object.entries(rel.dataValidation.details).forEach(([key, value]) => {
              recommendations += `\n    ${key}: ${value}`;
            });
          }
        }
      });
    }
    
    return recommendations;
  }

  generateETLRecommendations(records, columns, columnTypes) {
    if (!records || records.length === 0) {
      return 'No data available for ETL analysis';
    }
    
    const recommendations = [];
    
    // Advanced Data Quality Analysis
    const qualityAnalysis = this.performAdvancedQualityAnalysis(records, columns, columnTypes);
    recommendations.push(...qualityAnalysis);
    
    // Performance and Scalability Analysis
    const performanceAnalysis = this.analyzePerformanceRequirements(records, columns, columnTypes);
    recommendations.push(...performanceAnalysis);
    
    // Data Architecture Recommendations
    const architectureAnalysis = this.generateArchitectureRecommendations(records, columns, columnTypes);
    recommendations.push(...architectureAnalysis);
    
    // Security and Compliance Analysis
    const securityAnalysis = this.analyzeSecurityRequirements(records, columns, columnTypes);
    recommendations.push(...securityAnalysis);
    
    // Data Lineage and Governance
    const governanceAnalysis = this.generateGovernanceRecommendations(records, columns, columnTypes);
    recommendations.push(...governanceAnalysis);
    
    // ML/Analytics Readiness Assessment
    const analyticsAnalysis = this.assessAnalyticsReadiness(records, columns, columnTypes);
    recommendations.push(...analyticsAnalysis);
    
    // Format recommendations as structured output
    return this.formatETLRecommendations(recommendations);
  }
  
  performAdvancedQualityAnalysis(records, columns, columnTypes) {
    const recommendations = [];
    const qualityIssues = analyzeDataQuality(records, columnTypes);
    
    // Null value analysis with smart handling strategies
    if (qualityIssues.nullIssues > records.length * 0.1) {
      const nullStrategies = this.generateNullHandlingStrategies(records, columns, columnTypes);
      recommendations.push({
        category: 'Data Quality',
        priority: 'High',
        action: 'Implement intelligent null value handling',
        details: `${qualityIssues.nullIssues} null values detected. Recommended strategies: ${nullStrategies.join(', ')}`
      });
    }
    
    // Data consistency and validation rules
    const consistencyIssues = this.detectConsistencyIssues(records, columns, columnTypes);
    if (consistencyIssues.length > 0) {
      recommendations.push({
        category: 'Data Quality',
        priority: 'Medium',
        action: 'Add data validation rules',
        details: `Consistency issues detected: ${consistencyIssues.join(', ')}. Implement validation pipeline.`
      });
    }
    
    // Outlier detection and handling
    const outlierAnalysis = this.analyzeOutliers(records, columns, columnTypes);
    if (outlierAnalysis.outlierColumns.length > 0) {
      recommendations.push({
        category: 'Data Quality',
        priority: 'Medium',
        action: 'Implement outlier detection',
        details: `Potential outliers in: ${outlierAnalysis.outlierColumns.join(', ')}. Consider ${outlierAnalysis.strategy} strategy.`
      });
    }
    
    return recommendations;
  }
  
  analyzePerformanceRequirements(records, columns, columnTypes) {
    const recommendations = [];
    const rowCount = records.length;
    const columnCount = columns.length;
    
    // Partitioning strategy based on data patterns
    const partitioningAnalysis = this.analyzePartitioningStrategy(records, columns, columnTypes);
    if (partitioningAnalysis.recommended) {
      recommendations.push({
        category: 'Performance',
        priority: partitioningAnalysis.priority,
        action: 'Implement partitioning strategy',
        details: `${partitioningAnalysis.strategy}. Expected performance improvement: ${partitioningAnalysis.improvement}`
      });
    }
    
    // Indexing recommendations
    const indexingStrategy = this.generateIndexingStrategy(records, columns, columnTypes);
    if (indexingStrategy.indexes.length > 0) {
      recommendations.push({
        category: 'Performance',
        priority: 'Medium',
        action: 'Create strategic indexes',
        details: `Recommended indexes: ${indexingStrategy.indexes.join(', ')}. Query performance boost: ${indexingStrategy.benefit}`
      });
    }
    
    // Memory and storage optimization
    const storageAnalysis = this.analyzeStorageOptimization(records, columns, columnTypes);
    recommendations.push({
      category: 'Performance',
      priority: 'Low',
      action: 'Optimize storage format',
      details: `Current size estimate: ${storageAnalysis.currentSize}. Optimized: ${storageAnalysis.optimizedSize} (${storageAnalysis.savings} savings)`
    });
    
    return recommendations;
  }
  
  generateArchitectureRecommendations(records, columns, columnTypes) {
    const recommendations = [];
    
    // Table design patterns
    const tableType = this.detectTableType(columns, columnTypes, records);
    const designPattern = this.getDesignPattern(tableType, records.length, columns.length);
    
    recommendations.push({
      category: 'Architecture',
      priority: 'High',
      action: `Implement ${designPattern.pattern} pattern`,
      details: `Table classified as ${tableType}. ${designPattern.reasoning}. Performance characteristics: ${designPattern.performance}`
    });
    
    // Normalization recommendations
    const normalizationAnalysis = this.analyzeNormalizationOpportunities(records, columns, columnTypes);
    if (normalizationAnalysis.opportunities.length > 0) {
      recommendations.push({
        category: 'Architecture',
        priority: 'Medium',
        action: 'Consider normalization',
        details: `Normalization opportunities: ${normalizationAnalysis.opportunities.join(', ')}. Benefits: ${normalizationAnalysis.benefits}`
      });
    }
    
    // Data modeling recommendations
    const modelingStrategy = this.generateDataModelingStrategy(records, columns, columnTypes);
    recommendations.push({
      category: 'Architecture',
      priority: 'Medium',
      action: 'Adopt data modeling strategy',
      details: `Recommended approach: ${modelingStrategy.approach}. Rationale: ${modelingStrategy.rationale}`
    });
    
    return recommendations;
  }
  
  analyzeSecurityRequirements(records, columns, columnTypes) {
    const recommendations = [];
    
    // PII detection with classification levels
    const piiAnalysis = this.classifyPIIColumns(columns, columnTypes, records);
    if (piiAnalysis.length > 0) {
      piiAnalysis.forEach(pii => {
        recommendations.push({
          category: 'Security',
          priority: pii.riskLevel,
          action: `Protect ${pii.classification} data`,
          details: `Column '${pii.column}' contains ${pii.classification}. Recommended protection: ${pii.protection}`
        });
      });
    }
    
    // Data masking strategies
    const maskingStrategy = this.generateMaskingStrategy(columns, columnTypes, records);
    if (maskingStrategy.required) {
      recommendations.push({
        category: 'Security',
        priority: 'High',
        action: 'Implement data masking',
        details: `Masking required for: ${maskingStrategy.columns.join(', ')}. Strategy: ${maskingStrategy.method}`
      });
    }
    
    // Access control recommendations
    const accessControl = this.generateAccessControlStrategy(columns, columnTypes);
    recommendations.push({
      category: 'Security',
      priority: 'Medium',
      action: 'Define access controls',
      details: `Recommended access levels: ${accessControl.levels.join(', ')}. Implementation: ${accessControl.method}`
    });
    
    return recommendations;
  }
  
  generateGovernanceRecommendations(records, columns, columnTypes) {
    const recommendations = [];
    
    // Data lineage tracking
    const lineageStrategy = this.generateLineageStrategy(columns, columnTypes);
    recommendations.push({
      category: 'Governance',
      priority: 'Medium',
      action: 'Implement data lineage tracking',
      details: `Track lineage for: ${lineageStrategy.criticalColumns.join(', ')}. Method: ${lineageStrategy.method}`
    });
    
    // Data quality monitoring
    const monitoringStrategy = this.generateMonitoringStrategy(records, columns, columnTypes);
    recommendations.push({
      category: 'Governance',
      priority: 'High',
      action: 'Set up quality monitoring',
      details: `Monitor: ${monitoringStrategy.metrics.join(', ')}. Frequency: ${monitoringStrategy.frequency}`
    });
    
    // Retention and archival policies
    const retentionStrategy = this.generateRetentionStrategy(records, columns, columnTypes);
    recommendations.push({
      category: 'Governance',
      priority: 'Low',
      action: 'Define retention policy',
      details: `Recommended retention: ${retentionStrategy.period}. Archival strategy: ${retentionStrategy.archival}`
    });
    
    return recommendations;
  }
  
  assessAnalyticsReadiness(records, columns, columnTypes) {
    const recommendations = [];
    
    // Feature engineering opportunities
    const featureAnalysis = this.analyzeFeatureEngineering(records, columns, columnTypes);
    if (featureAnalysis.opportunities.length > 0) {
      recommendations.push({
        category: 'Analytics',
        priority: 'Medium',
        action: 'Implement feature engineering',
        details: `Opportunities: ${featureAnalysis.opportunities.join(', ')}. ML readiness score: ${featureAnalysis.readinessScore}/10`
      });
    }
    
    // Data preparation for analytics
    const prepAnalysis = this.analyzeDataPreparation(records, columns, columnTypes);
    recommendations.push({
      category: 'Analytics',
      priority: 'Medium',
      action: 'Prepare data for analytics',
      details: `Required steps: ${prepAnalysis.steps.join(', ')}. Complexity: ${prepAnalysis.complexity}`
    });
    
    // Real-time vs batch processing
    const processingStrategy = this.recommendProcessingStrategy(records, columns, columnTypes);
    recommendations.push({
      category: 'Analytics',
      priority: 'Low',
      action: `Implement ${processingStrategy.type} processing`,
      details: `Recommended: ${processingStrategy.type}. Rationale: ${processingStrategy.rationale}`
    });
    
    return recommendations;
  }
  
  formatETLRecommendations(recommendations) {
    if (recommendations.length === 0) {
      return 'No specific ETL recommendations - data appears well-structured';
    }
    
    let output = 'ADVANCED ETL IMPLEMENTATION RECOMMENDATIONS:\n\n';
    
    // Group by category and priority
    const groupedRecs = recommendations.reduce((acc, rec) => {
      if (!acc[rec.category]) acc[rec.category] = { High: [], Medium: [], Low: [] };
      acc[rec.category][rec.priority].push(rec);
      return acc;
    }, {});
    
    Object.entries(groupedRecs).forEach(([category, priorities]) => {
      output += `${category.toUpperCase()}:\n`;
      
      ['High', 'Medium', 'Low'].forEach(priority => {
        if (priorities[priority].length > 0) {
          priorities[priority].forEach(rec => {
            output += `  🔸 [${priority}] ${rec.action}\n`;
            output += `     ${rec.details}\n\n`;
          });
        }
      });
    });
    
    // Add implementation priority summary
    const highPriority = recommendations.filter(r => r.priority === 'High').length;
    const mediumPriority = recommendations.filter(r => r.priority === 'Medium').length;
    const lowPriority = recommendations.filter(r => r.priority === 'Low').length;
    
    output += `IMPLEMENTATION SUMMARY:\n`;
    output += `  High Priority: ${highPriority} items (implement first)\n`;
    output += `  Medium Priority: ${mediumPriority} items (implement next)\n`;
    output += `  Low Priority: ${lowPriority} items (implement when resources allow)\n`;
    
    return output;
  }
  // Helper methods for advanced relationship detection
  extractTableFromId(columnName) {
    // Remove common ID suffixes and clean the name
    let tableName = columnName
      .replace(/_id$|_key$|id$/, '')
      .replace(/^fk_/, '')
      .replace(/[^a-z]/g, '_');
    
    // Handle common patterns
    if (tableName === 'cust' || tableName === 'customer') return 'customer';
    if (tableName === 'prod' || tableName === 'product') return 'product';
    if (tableName === 'order' || tableName === 'ord') return 'order';
    if (tableName === 'user' || tableName === 'usr') return 'user';
    
    return tableName;
  }
  
  calculateFKConfidence(column, type, tableHint) {
    let confidence = 0.5;
    
    // Boost confidence for standard patterns
    if (column.toLowerCase().endsWith('_id')) confidence += 0.3;
    if (type.type === 'integer' || type.type === 'identifier') confidence += 0.2;
    if (tableHint && tableHint.length > 2) confidence += 0.1;
    
    // Penalize for very generic names
    if (['id', 'key', 'ref'].includes(tableHint)) confidence -= 0.2;
    
    return Math.min(confidence, 0.95);
  }
  
  extractDomainFromCode(columnName) {
    return columnName
      .replace(/_?code$|_?cd$/, '')
      .replace(/[^a-z]/g, '_');
  }
  
  calculateCodeConfidence(column, type) {
    let confidence = 0.6;
    
    // Higher confidence for fewer categories (more likely to be lookup)
    if (type.categories && type.categories.length <= 20) confidence += 0.2;
    if (type.categories && type.categories.length <= 10) confidence += 0.1;
    
    // Pattern-based confidence boosts
    if (column.toLowerCase().includes('status')) confidence += 0.1;
    if (column.toLowerCase().includes('type')) confidence += 0.1;
    
    return Math.min(confidence, 0.9);
  }
  
  calculateCategoricalConfidence(column, type) {
    let confidence = 0.5;
    
    // More categories = higher chance of being a separate reference
    if (type.categories && type.categories.length > 5) confidence += 0.2;
    if (type.categories && type.categories.length > 15) confidence += 0.2;
    
    return Math.min(confidence, 0.85);
  }
  
  isGeographicColumn(columnName, type) {
    const geoKeywords = ['country', 'state', 'province', 'region', 'city', 'location', 'zip', 'postal'];
    return geoKeywords.some(keyword => columnName.includes(keyword)) ||
           (type.type === 'postcode');
  }
  
  detectGeographicType(columnName, type) {
    if (columnName.includes('country')) return 'countries';
    if (columnName.includes('state') || columnName.includes('province')) return 'states';
    if (columnName.includes('city')) return 'cities';
    if (columnName.includes('zip') || columnName.includes('postal') || type.type === 'postcode') return 'postal_codes';
    return 'locations';
  }
  
  detectTimeGrain(columnName) {
    if (columnName.includes('year')) return 'year';
    if (columnName.includes('quarter')) return 'quarter';
    if (columnName.includes('month')) return 'month';
    if (columnName.includes('week')) return 'week';
    if (columnName.includes('day') || columnName.includes('date')) return 'date';
    return 'time';
  }
  
  pluralizeTableName(tableName) {
    // Simple pluralization rules
    if (tableName.endsWith('y')) return tableName.slice(0, -1) + 'ies';
    if (tableName.endsWith('s') || tableName.endsWith('x') || tableName.endsWith('z')) return tableName + 'es';
    return tableName + 's';
  }
  
  buildFKEvidence(column, type, tableHint, confidence) {
    const factors = [];
    
    if (column.toLowerCase().endsWith('_id')) factors.push('standard naming convention');
    if (type.type === 'integer') factors.push('integer type');
    if (type.type === 'identifier') factors.push('identifier pattern');
    if (confidence > 0.8) factors.push('high pattern match');
    
    return `Foreign key indicators: ${factors.join(', ')}`;
  }
  
  detectCrossColumnRelationships(columns, columnTypes) {
    const relationships = [];
    
    // Look for composite key patterns
    const idColumns = columns.filter(col => 
      col.toLowerCase().includes('_id') || col.toLowerCase().endsWith('id')
    );
    
    if (idColumns.length >= 2) {
      relationships.push({
        type: 'composite_key',
        columns: idColumns,
        confidence: 0.7,
        target_table: 'bridge_table',
        target_column: 'composite_key',
        evidence: `Multiple ID columns (${idColumns.join(', ')}) suggest many-to-many relationship bridge`
      });
    }
    
    // Look for hierarchical patterns (parent_id, level, etc.)
    const hierarchyIndicators = columns.filter(col => {
      const colLower = col.toLowerCase();
      return colLower.includes('parent') || colLower.includes('level') || colLower.includes('hierarchy');
    });
    
    if (hierarchyIndicators.length > 0) {
      relationships.push({
        type: 'hierarchical_relationship',
        columns: hierarchyIndicators,
        confidence: 0.8,
        target_table: 'self_reference',
        target_column: 'parent_key',
        evidence: `Hierarchical indicators (${hierarchyIndicators.join(', ')}) suggest self-referencing hierarchy`
      });
    }
    
    return relationships;
  }
  
  // ETL Analysis Helper Methods
  generateNullHandlingStrategies(records, columns, columnTypes) {
    const strategies = [];
    
    columns.forEach(col => {
      const values = records.map(r => r[col]);
      const nullCount = values.filter(v => v === null || v === undefined || v === '').length;
      const nullRatio = nullCount / records.length;
      
      if (nullRatio > 0.1) {
        const type = columnTypes[col]?.type;
        if (type === 'categorical') strategies.push('mode imputation');
        else if (['integer', 'float'].includes(type)) strategies.push('median imputation');
        else strategies.push('forward fill');
      }
    });
    
    return [...new Set(strategies)];
  }
  
  detectConsistencyIssues(records, columns, columnTypes) {
    const issues = [];
    
    columns.forEach(col => {
      const type = columnTypes[col];
      if (type?.type === 'categorical' && type.categories) {
        // Check for case inconsistencies
        const values = records.map(r => r[col]).filter(v => v);
        const caseIssues = values.filter(v => {
          const lower = String(v).toLowerCase();
          return type.categories.some(cat => String(cat).toLowerCase() === lower && cat !== v);
        });
        
        if (caseIssues.length > 0) {
          issues.push(`${col}: case inconsistencies`);
        }
      }
    });
    
    return issues;
  }
  
  analyzeOutliers(records, columns, columnTypes) {
    const outlierColumns = [];
    let strategy = 'IQR-based detection';
    
    columns.forEach(col => {
      const type = columnTypes[col];
      if (['integer', 'float'].includes(type?.type)) {
        const values = records.map(r => r[col]).filter(v => typeof v === 'number' && !isNaN(v));
        if (values.length > 10) {
          values.sort((a, b) => a - b);
          const q1 = values[Math.floor(values.length * 0.25)];
          const q3 = values[Math.floor(values.length * 0.75)];
          const iqr = q3 - q1;
          const outliers = values.filter(v => v < q1 - 1.5 * iqr || v > q3 + 1.5 * iqr);
          
          if (outliers.length > values.length * 0.05) {
            outlierColumns.push(col);
          }
        }
      }
    });
    
    if (outlierColumns.length > 3) strategy = 'statistical modeling';
    
    return { outlierColumns, strategy };
  }
  
  analyzePartitioningStrategy(records, columns, columnTypes) {
    const dateColumns = columns.filter(col => columnTypes[col]?.type === 'date');
    const rowCount = records.length;
    
    if (rowCount > 100000 && dateColumns.length > 0) {
      return {
        recommended: true,
        strategy: `Monthly partitioning by ${dateColumns[0]}`,
        priority: 'High',
        improvement: '60-80% query performance boost'
      };
    } else if (rowCount > 50000) {
      const idColumns = columns.filter(col => col.toLowerCase().includes('_id'));
      if (idColumns.length > 0) {
        return {
          recommended: true,
          strategy: `Hash partitioning by ${idColumns[0]}`,
          priority: 'Medium',
          improvement: '30-50% query performance boost'
        };
      }
    }
    
    return { recommended: false };
  }
  
  generateIndexingStrategy(records, columns, columnTypes) {
    const indexes = [];
    const idColumns = columns.filter(col => col.toLowerCase().includes('_id') || col.toLowerCase() === 'id');
    const dateColumns = columns.filter(col => columnTypes[col]?.type === 'date');
    const categoricalColumns = columns.filter(col => columnTypes[col]?.type === 'categorical');
    
    // Primary indexes
    indexes.push(...idColumns.map(col => `${col} (primary)`));
    
    // Temporal indexes
    if (dateColumns.length > 0) {
      indexes.push(`${dateColumns[0]} (temporal queries)`);
    }
    
    // Categorical indexes for filtering
    const highCardinalityCategorical = categoricalColumns.filter(col => {
      const type = columnTypes[col];
      return type.categories && type.categories.length <= 20;
    });
    indexes.push(...highCardinalityCategorical.map(col => `${col} (filtering)`));
    
    return {
      indexes,
      benefit: indexes.length > 3 ? '50-70%' : '20-40%'
    };
  }
  
  analyzeStorageOptimization(records, columns, columnTypes) {
    let currentSize = records.length * columns.length * 50; // Rough estimate in bytes
    let optimizedSize = currentSize;
    
    // Compression estimates
    const categoricalRatio = columns.filter(col => columnTypes[col]?.type === 'categorical').length / columns.length;
    const compressionRatio = categoricalRatio > 0.5 ? 4 : 3;
    
    optimizedSize = Math.floor(currentSize / compressionRatio);
    
    const savings = Math.round((1 - optimizedSize / currentSize) * 100);
    
    return {
      currentSize: this.formatBytes(currentSize),
      optimizedSize: this.formatBytes(optimizedSize),
      savings: `${savings}%`
    };
  }
  
  formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return Math.round(bytes / (1024 * 1024)) + ' MB';
    return Math.round(bytes / (1024 * 1024 * 1024)) + ' GB';
  }
  
  detectTableType(columns, columnTypes, records) {
    const measures = this.identifyMeasureColumns(columns, columnTypes, records);
    const dimensions = this.identifyDimensionColumns(columns, columnTypes, records);
    const hasTimestamp = columns.some(c => columnTypes[c]?.type === 'date');
    
    if (measures.length >= 2 && hasTimestamp) return 'fact';
    if (dimensions.length >= 2 && measures.length <= 1) return 'dimension';
    if (columns.length <= 5) return 'reference';
    return 'operational';
  }
  
  getDesignPattern(tableType, rowCount, columnCount) {
    const patterns = {
      fact: {
        pattern: 'Star Schema Fact Table',
        reasoning: 'Optimized for analytical queries with measures and foreign keys',
        performance: 'Excellent for aggregations, partition-friendly'
      },
      dimension: {
        pattern: 'Slowly Changing Dimension',
        reasoning: 'Descriptive data that changes slowly over time',
        performance: 'Good for lookups, consider Type 2 SCD for history'
      },
      reference: {
        pattern: 'Reference/Lookup Table',
        reasoning: 'Static data for normalization and validation',
        performance: 'Cache-friendly, minimal storage overhead'
      },
      operational: {
        pattern: 'Operational Data Store',
        reasoning: 'Business process data requiring normalization',
        performance: 'Optimize for transactions, consider read replicas'
      }
    };
    
    return patterns[tableType] || patterns.operational;
  }
  
  analyzeNormalizationOpportunities(records, columns, columnTypes) {
    const opportunities = [];
    const benefits = [];
    
    // Look for repeated value patterns
    columns.forEach(col => {
      const type = columnTypes[col];
      if (type?.type === 'categorical' && type.categories && type.categories.length > 10) {
        opportunities.push(`${col} lookup table`);
        benefits.push('reduced storage');
      }
    });
    
    // Look for composite data
    const addressColumns = columns.filter(col => 
      col.toLowerCase().includes('address') || 
      col.toLowerCase().includes('city') || 
      col.toLowerCase().includes('state')
    );
    
    if (addressColumns.length >= 2) {
      opportunities.push('address normalization');
      benefits.push('data consistency');
    }
    
    return {
      opportunities,
      benefits: [...new Set(benefits)].join(', ')
    };
  }
  
  generateDataModelingStrategy(records, columns, columnTypes) {
    const rowCount = records.length;
    const columnCount = columns.length;
    const hasTimestamp = columns.some(c => columnTypes[c]?.type === 'date');
    
    if (rowCount > 100000 && hasTimestamp) {
      return {
        approach: 'Time-series optimized data model',
        rationale: 'Large temporal dataset benefits from time-partitioned architecture'
      };
    } else if (columnCount > 20) {
      return {
        approach: 'Normalized relational model',
        rationale: 'Wide table suggests normalization opportunities for better maintainability'
      };
    } else {
      return {
        approach: 'Denormalized analytical model',
        rationale: 'Compact dataset suitable for analytical workloads'
      };
    }
  }
  
  classifyPIIColumns(columns, columnTypes, records) {
    const piiColumns = [];
    
    columns.forEach(col => {
      const colLower = col.toLowerCase();
      const type = columnTypes[col];
      
      if (colLower.includes('email') || type?.type === 'email') {
        piiColumns.push({
          column: col,
          classification: 'email',
          riskLevel: 'High',
          protection: 'encryption + tokenization'
        });
      } else if (colLower.includes('phone')) {
        piiColumns.push({
          column: col,
          classification: 'phone number',
          riskLevel: 'Medium',
          protection: 'masking + encryption'
        });
      } else if (colLower.includes('ssn') || colLower.includes('social')) {
        piiColumns.push({
          column: col,
          classification: 'SSN',
          riskLevel: 'High',
          protection: 'tokenization + restricted access'
        });
      } else if (colLower.includes('name') && type?.type === 'string') {
        piiColumns.push({
          column: col,
          classification: 'personal name',
          riskLevel: 'Medium',
          protection: 'pseudonymization'
        });
      }
    });
    
    return piiColumns;
  }
  
  generateMaskingStrategy(columns, columnTypes, records) {
    const sensitiveColumns = columns.filter(col => {
      const colLower = col.toLowerCase();
      return colLower.includes('email') || colLower.includes('phone') || 
             colLower.includes('ssn') || colLower.includes('credit');
    });
    
    if (sensitiveColumns.length > 0) {
      return {
        required: true,
        columns: sensitiveColumns,
        method: 'format-preserving encryption with role-based unmasking'
      };
    }
    
    return { required: false };
  }
  
  generateAccessControlStrategy(columns, columnTypes) {
    const idColumns = columns.filter(col => col.toLowerCase().includes('_id'));
    const sensitiveColumns = columns.filter(col => {
      const colLower = col.toLowerCase();
      return colLower.includes('email') || colLower.includes('salary') || 
             colLower.includes('phone') || colLower.includes('address');
    });
    
    const levels = ['public'];
    if (idColumns.length > 0) levels.push('internal');
    if (sensitiveColumns.length > 0) levels.push('restricted');
    
    return {
      levels,
      method: 'row-level security with column-level permissions'
    };
  }
  
  generateLineageStrategy(columns, columnTypes) {
    const criticalColumns = columns.filter(col => {
      const colLower = col.toLowerCase();
      return colLower.includes('_id') || colLower.includes('amount') || 
             colLower.includes('date') || colLower.includes('status');
    });
    
    return {
      criticalColumns,
      method: 'automated lineage tracking with data flow documentation'
    };
  }
  
  generateMonitoringStrategy(records, columns, columnTypes) {
    const metrics = ['completeness', 'uniqueness'];
    
    if (columns.some(col => ['integer', 'float'].includes(columnTypes[col]?.type))) {
      metrics.push('statistical drift');
    }
    
    if (columns.some(col => columnTypes[col]?.type === 'categorical')) {
      metrics.push('domain consistency');
    }
    
    const frequency = records.length > 100000 ? 'daily' : 'weekly';
    
    return { metrics, frequency };
  }
  
  generateRetentionStrategy(records, columns, columnTypes) {
    const hasTimestamp = columns.some(c => columnTypes[c]?.type === 'date');
    const hasPII = columns.some(col => {
      const colLower = col.toLowerCase();
      return colLower.includes('email') || colLower.includes('phone') || colLower.includes('name');
    });
    
    let period = '7 years';
    let archival = 'cold storage after 2 years';
    
    if (hasPII) {
      period = '3 years (compliance-driven)';
      archival = 'encrypted archival with anonymization option';
    } else if (!hasTimestamp) {
      period = 'indefinite (reference data)';
      archival = 'periodic backup only';
    }
    
    return { period, archival };
  }
  
  analyzeFeatureEngineering(records, columns, columnTypes) {
    const opportunities = [];
    let readinessScore = 5;
    
    // Date feature engineering
    const dateColumns = columns.filter(col => columnTypes[col]?.type === 'date');
    if (dateColumns.length > 0) {
      opportunities.push('temporal features (day/month/year)');
      readinessScore += 1;
    }
    
    // Categorical encoding
    const categoricalColumns = columns.filter(col => columnTypes[col]?.type === 'categorical');
    if (categoricalColumns.length > 0) {
      opportunities.push('categorical encoding');
      readinessScore += 1;
    }
    
    // Numerical scaling
    const numericColumns = columns.filter(col => ['integer', 'float'].includes(columnTypes[col]?.type));
    if (numericColumns.length > 1) {
      opportunities.push('feature scaling/normalization');
      readinessScore += 1;
    }
    
    // Interaction features
    if (numericColumns.length >= 2) {
      opportunities.push('interaction features');
      readinessScore += 1;
    }
    
    return {
      opportunities,
      readinessScore: Math.min(readinessScore, 10)
    };
  }
  
  analyzeDataPreparation(records, columns, columnTypes) {
    const steps = [];
    let complexity = 'Low';
    
    // Check for missing values
    const nullCounts = {};
    records.forEach(record => {
      columns.forEach(col => {
        if (!nullCounts[col]) nullCounts[col] = 0;
        if (!record[col]) nullCounts[col]++;
      });
    });
    
    const hasNulls = Object.values(nullCounts).some(count => count > 0);
    if (hasNulls) {
      steps.push('missing value imputation');
      complexity = 'Medium';
    }
    
    // Check for categorical variables
    const categoricalColumns = columns.filter(col => columnTypes[col]?.type === 'categorical');
    if (categoricalColumns.length > 0) {
      steps.push('categorical encoding');
    }
    
    // Check for skewed distributions
    const numericColumns = columns.filter(col => ['integer', 'float'].includes(columnTypes[col]?.type));
    if (numericColumns.length > 0) {
      steps.push('distribution analysis');
      if (numericColumns.length > 5) complexity = 'High';
    }
    
    if (steps.length === 0) steps.push('data validation only');
    
    return { steps, complexity };
  }
  
  recommendProcessingStrategy(records, columns, columnTypes) {
    const rowCount = records.length;
    const hasTimestamp = columns.some(c => columnTypes[c]?.type === 'date');
    
    if (rowCount > 500000 && hasTimestamp) {
      return {
        type: 'streaming',
        rationale: 'Large temporal dataset benefits from real-time processing'
      };
    } else if (rowCount > 100000) {
      return {
        type: 'micro-batch',
        rationale: 'Balanced approach for medium-scale data with good latency'
      };
    } else {
      return {
        type: 'batch',
        rationale: 'Simple batch processing sufficient for dataset size'
      };
    }
  }
  
  findRelatedTables(analysis, knowledge) { 
    const relatedTables = [];
    
    if (!knowledge.warehouse || !knowledge.warehouse.tables) {
      return relatedTables;
    }
    
    const currentColumns = analysis.columns.map(c => c.name.toLowerCase());
    
    // Find tables with shared column patterns
    Object.entries(knowledge.warehouse.tables).forEach(([tableName, tableInfo]) => {
      if (tableName === analysis.table_name) return; // Skip self
      
      const tableColumns = (tableInfo.columns || []).map(c => c.name?.toLowerCase() || c.toLowerCase());
      const sharedColumns = currentColumns.filter(col => tableColumns.includes(col));
      
      if (sharedColumns.length > 0) {
        const relationshipStrength = sharedColumns.length / Math.min(currentColumns.length, tableColumns.length);
        
        relatedTables.push({
          name: tableName,
          sharedColumns,
          relationshipStrength,
          confidence: Math.min(relationshipStrength * 0.8, 0.9)
        });
      }
    });
    
    // Sort by relationship strength
    return relatedTables
      .sort((a, b) => b.relationshipStrength - a.relationshipStrength)
      .slice(0, 5); // Top 5 related tables
  }
  classifyIntoDomain(analysis, knowledge) { 
    // Use existing domain knowledge to classify new tables
    if (!knowledge.warehouse?.domains) {
      return analysis.domain;
    }
    
    const currentColumns = analysis.columns.map(c => c.name.toLowerCase());
    const domainScores = {};
    
    // Score against existing domains
    Object.entries(knowledge.warehouse.domains).forEach(([domain, domainInfo]) => {
      const domainColumns = (domainInfo.common_columns || []).map(c => c.toLowerCase());
      const overlap = currentColumns.filter(col => domainColumns.includes(col)).length;
      
      if (overlap > 0) {
        domainScores[domain] = overlap / domainColumns.length;
      }
    });
    
    // Find best matching domain
    const bestDomain = Object.entries(domainScores).reduce((best, [domain, score]) => {
      return score > (best.score || 0) ? { domain, score } : best;
    }, {});
    
    // Return best match if confidence is high enough, otherwise use analysis result
    return bestDomain.score > 0.3 ? bestDomain.domain : analysis.domain;
  }
  generateCrossReferences(analysis, knowledge, patterns) { 
    const refs = [];
    
    // Pattern-based cross-references
    patterns.naming_patterns.forEach(pattern => {
      if (pattern.frequency > 1) {
        refs.push(`"${pattern.pattern}" matches pattern found in ${pattern.frequency} other tables`);
      }
    });
    
    // Relationship-based cross-references
    if (analysis.relationships && analysis.relationships.length > 0) {
      analysis.relationships.forEach(rel => {
        if (rel.confidence > 0.7) {
          refs.push(`${rel.column} likely references ${rel.target_table}.${rel.target_column}`);
        }
      });
    }
    
    // Domain-based cross-references
    if (knowledge.warehouse?.domains && knowledge.warehouse.domains[analysis.domain]) {
      const domainTables = knowledge.warehouse.domains[analysis.domain].tables || [];
      if (domainTables.length > 1) {
        refs.push(`Part of ${analysis.domain} domain with ${domainTables.length - 1} other tables`);
      }
    }
    
    // Quality pattern cross-references
    if (analysis.patterns?.issues && analysis.patterns.issues.length > 0) {
      const commonIssues = analysis.patterns.issues.filter(issue => {
        return knowledge.patterns?.common_issues?.some(common => 
          common.type === issue.type
        );
      });
      
      if (commonIssues.length > 0) {
        refs.push(`Shares ${commonIssues.length} common data quality issues with other tables`);
      }
    }
    
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