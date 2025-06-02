/**
 * VIS COMMAND - Business Intelligence Suite
 * Combines visualization recommendations + data engineering archaeology
 */

import { parseCSV, detectColumnTypes } from '../utils/parser.js';
import { OutputHandler } from '../utils/output.js';
import { formatTimestamp, createSection, createSubSection, formatNumber, bulletList } from '../utils/format.js';
import { basename } from 'path';
import ora from 'ora';
import chalk from 'chalk';
import { visualize as visualizeAnalysis } from './vis/index.js';
import { engineering as engineeringAnalysis } from './eng.js';
import { KnowledgeBase } from '../utils/knowledgeBase.js';

export async function visualize(filePath, options = {}) {
  const outputHandler = new OutputHandler(options);
  const spinner = options.quiet ? null : ora('Starting business intelligence analysis...').start();
  
  try {
    // Parse data
    if (spinner) spinner.text = 'Reading data...';
    const data = await parseCSV(filePath, { quiet: options.quiet });
    
    if (!data || data.length === 0) {
      throw new Error('No data found in CSV file');
    }
    
    // Detect column types
    if (spinner) spinner.text = 'Analyzing data structure...';
    const columnTypes = detectColumnTypes(data);
    const headers = Object.keys(columnTypes);
    const fileName = basename(filePath);
    
    // Prepare data for sub-commands
    const preloadedData = {
      records: data,
      columnTypes,
      headers
    };
    
    // Create enhanced options
    const enhancedOptions = {
      ...options,
      preloadedData,
      structuredOutput: true,
      quiet: true
    };
    
    // Run visualization analysis
    if (spinner) spinner.text = 'Analyzing visualization opportunities...';
    const visResults = await visualizeAnalysis(filePath, enhancedOptions);
    
    // Run engineering analysis (data archaeology)
    if (spinner) spinner.text = 'Performing data archaeology...';
    const engResults = await engineeringAnalysis(filePath, enhancedOptions);
    
    // Load knowledge base
    const knowledgeBase = new KnowledgeBase();
    const warehouseKnowledge = await knowledgeBase.load();
    
    if (spinner) spinner.succeed('Business intelligence analysis complete!');
    
    // Generate combined report
    const report = generateBusinessIntelligenceReport(
      fileName, 
      data.length, 
      visResults, 
      engResults, 
      warehouseKnowledge
    );
    
    console.log(report);
    outputHandler.finalize();
    
    return {
      visualization: visResults,
      engineering: engResults,
      report
    };
    
  } catch (error) {
    if (spinner) spinner.fail('Analysis failed');
    console.error(chalk.red(`❌ Error: ${error.message}`));
    outputHandler.restore();
    if (!options.quiet) process.exit(1);
    throw error;
  }
}

function generateBusinessIntelligenceReport(fileName, recordCount, visResults, engResults, warehouseKnowledge) {
  let report = '';
  
  // Header
  report += chalk.cyan('📊 DATAPILOT BUSINESS INTELLIGENCE SUITE\n');
  report += chalk.cyan('=======================================\n');
  report += `${chalk.gray('Dataset:')} ${fileName} (${recordCount.toLocaleString()} records)\n`;
  report += `${chalk.gray('Generated:')} ${formatTimestamp()}\n\n`;
  
  // Visualization Section
  report += createSection('VISUALIZATION RECOMMENDATIONS', '');
  
  if (visResults && visResults !== '') {
    // Extract key visualization recommendations
    const visLines = visResults.split('\n');
    const startIdx = visLines.findIndex(line => line.includes('RECOMMENDED VISUALISATIONS'));
    if (startIdx !== -1) {
      // Extract the visualization recommendations
      let extracting = false;
      let vizCount = 0;
      for (let i = startIdx + 1; i < visLines.length && vizCount < 3; i++) {
        const line = visLines[i];
        if (line.includes('Priority')) {
          extracting = true;
          report += chalk.yellow(`\n${line}\n`);
          vizCount++;
        } else if (extracting && line.trim() !== '' && !line.includes('═══')) {
          report += `${line}\n`;
        } else if (line.includes('═══')) {
          extracting = false;
        }
      }
    }
  } else {
    report += chalk.gray('No visualization recommendations available\n');
  }
  report += '\n';
  
  // Data Engineering Section
  report += createSection('DATA ENGINEERING INSIGHTS', '');
  
  if (typeof engResults === 'object' && engResults.analysis) {
    const analysis = engResults.analysis;
    
    // Table Purpose
    report += chalk.cyan('📋 Table Analysis:\n');
    report += `   • Purpose: ${analysis.likely_purpose || 'Unknown'}\n`;
    report += `   • Domain: ${analysis.domain || 'General'}\n`;
    report += `   • Quality Score: ${analysis.quality_score || 0}/10\n`;
    if (analysis.tech_debt_hours > 0) {
      report += `   • Technical Debt: ${analysis.tech_debt_hours} hours estimated\n`;
    }
    report += '\n';
    
    // Relationships
    if (analysis.relationships && analysis.relationships.length > 0) {
      report += chalk.cyan('🔗 Detected Relationships:\n');
      analysis.relationships.slice(0, 3).forEach((rel, idx) => {
        report += `   ${idx + 1}. ${rel.type}: ${rel.description || rel}\n`;
      });
      report += '\n';
    }
    
    // Patterns
    if (analysis.patterns && Object.keys(analysis.patterns).length > 0) {
      report += chalk.cyan('🔍 Data Patterns:\n');
      Object.entries(analysis.patterns).slice(0, 3).forEach(([key, value]) => {
        report += `   • ${key}: ${value}\n`;
      });
      report += '\n';
    }
  } else if (typeof engResults === 'string') {
    // Extract key insights from text report
    const engLines = engResults.split('\n');
    const purposeIdx = engLines.findIndex(line => line.includes('Likely Purpose:'));
    if (purposeIdx !== -1) {
      report += chalk.cyan('📋 Table Analysis:\n');
      report += `   ${engLines[purposeIdx]}\n`;
      // Look for quality score
      const qualityIdx = engLines.findIndex(line => line.includes('Quality Score:'));
      if (qualityIdx !== -1) {
        report += `   ${engLines[qualityIdx]}\n`;
      }
      report += '\n';
    }
  }
  
  // Warehouse Context
  if (warehouseKnowledge && warehouseKnowledge.tables) {
    const tableCount = Object.keys(warehouseKnowledge.tables).length;
    if (tableCount > 1) {
      report += chalk.cyan('🏗️  Warehouse Context:\n');
      report += `   • Tables analyzed: ${tableCount}\n`;
      
      // Find related tables
      const currentTable = fileName.replace('.csv', '');
      const relatedTables = [];
      
      Object.entries(warehouseKnowledge.tables).forEach(([tableName, tableInfo]) => {
        if (tableName !== currentTable && tableInfo.relationships) {
          const hasRelation = tableInfo.relationships.some(rel => 
            rel.related_table === currentTable || 
            (typeof rel === 'string' && rel.includes(currentTable))
          );
          if (hasRelation) {
            relatedTables.push(tableName);
          }
        }
      });
      
      if (relatedTables.length > 0) {
        report += `   • Related tables: ${relatedTables.join(', ')}\n`;
      }
      report += '\n';
    }
  }
  
  // Recommendations Section
  report += createSection('RECOMMENDATIONS', '');
  
  // Schema recommendations from engineering
  if (typeof engResults === 'object' && engResults.analysis && engResults.analysis.schema_recommendations) {
    report += chalk.yellow('🔧 Schema Improvements:\n');
    engResults.analysis.schema_recommendations.slice(0, 3).forEach((rec, idx) => {
      report += `   ${idx + 1}. ${rec}\n`;
    });
    report += '\n';
  }
  
  // ETL recommendations
  if (typeof engResults === 'object' && engResults.analysis && engResults.analysis.etl_recommendations) {
    report += chalk.yellow('🔄 ETL Pipeline Suggestions:\n');
    const etl = engResults.analysis.etl_recommendations;
    if (etl.cleaning_steps && etl.cleaning_steps.length > 0) {
      report += `   • Cleaning: ${etl.cleaning_steps[0]}\n`;
    }
    if (etl.transformation_steps && etl.transformation_steps.length > 0) {
      report += `   • Transform: ${etl.transformation_steps[0]}\n`;
    }
    report += '\n';
  }
  
  // LLM prompt for deeper analysis
  report += chalk.cyan('🤖 AI Analysis Prompt:\n');
  report += chalk.gray('Copy this prompt to your AI assistant for deeper insights:\n\n');
  report += chalk.white(`"Analyze this ${fileName} dataset with ${recordCount} records. `);
  const domain = (engResults && engResults.analysis && engResults.analysis.domain) || 'business';
  const columnCount = (engResults && engResults.analysis && engResults.analysis.column_count) || 'multiple';
  report += `The data appears to be ${domain} data `;
  report += `with ${columnCount} columns. `;
  report += `Key visualization opportunities include charts for the main metrics. `;
  report += `What additional insights can you provide about patterns, anomalies, and business value?"\n\n`;
  
  // Footer
  report += chalk.gray('─'.repeat(50)) + '\n';
  report += chalk.gray('Use `datapilot run` for comprehensive statistical and quality analysis\n');
  report += chalk.gray('Use `datapilot all` for complete analysis including all dimensions\n');
  
  return report;
}