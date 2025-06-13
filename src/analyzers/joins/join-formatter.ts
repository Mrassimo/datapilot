/**
 * Rich Output Formatting for Join Analysis
 * Phase 1: Foundation Architecture - Comprehensive result formatting
 */

import {
  JoinAnalysisResult,
  JoinCandidate,
  TableDependencyGraph,
  IntegrityReport,
  BusinessRule,
  JoinRecommendation,
  OutputFormat,
  CardinalityType,
  JoinStrategy
} from './types.js';

export class JoinFormatter {
  
  /**
   * Format join analysis results according to specified format
   */
  format(result: JoinAnalysisResult, format: OutputFormat): string {
    switch (format.type) {
      case 'MARKDOWN':
        return this.formatMarkdown(result);
      case 'JSON':
        return this.formatJSON(result);
      case 'SQL':
        return this.formatSQL(result);
      case 'DIAGRAM':
        return this.formatDiagram(result);
      default:
        return this.formatMarkdown(result);
    }
  }

  /**
   * Format as comprehensive markdown report
   */
  private formatMarkdown(result: JoinAnalysisResult): string {
    const sections = [
      this.formatMarkdownHeader(result),
      this.formatMarkdownSummary(result),
      this.formatMarkdownJoinCandidates(result),
      this.formatMarkdownDependencyGraph(result),
      this.formatMarkdownIntegrityReport(result),
      this.formatMarkdownBusinessRules(result),
      this.formatMarkdownRecommendations(result),
      this.formatMarkdownPerformance(result)
    ];

    return sections.join('\n\n');
  }

  private formatMarkdownHeader(result: JoinAnalysisResult): string {
    return `# DataPilot Join Analysis Report

**Generated:** ${new Date().toISOString()}  
**Analysis Duration:** ${result.summary.analysisTime}ms  
**Tables Analyzed:** ${result.summary.tablesAnalyzed}  
**Total Records:** ${result.summary.totalRows.toLocaleString()}  

---`;
  }

  private formatMarkdownSummary(result: JoinAnalysisResult): string {
    const summary = result.summary;
    
    return `## 📊 Executive Summary

| Metric | Value |
|--------|-------|
| **Join Candidates Found** | ${summary.joinCandidatesFound} |
| **High Confidence Joins** | ${summary.highConfidenceJoins} |
| **Potential Issues** | ${summary.potentialIssues} |
| **Overall Complexity** | ${result.performance.overallComplexity} |

### Key Findings
${summary.highConfidenceJoins > 0 ? 
  `✅ **${summary.highConfidenceJoins} high-confidence join relationships** identified` : 
  '⚠️ **No high-confidence joins found** - consider data quality improvements'}

${summary.potentialIssues > 0 ? 
  `⚠️ **${summary.potentialIssues} potential data quality issues** detected` : 
  '✅ **No major data quality issues** identified'}

${result.businessRules.length > 0 ? 
  `🎯 **${result.businessRules.length} business relationship patterns** discovered` : 
  '💡 **No clear business patterns** - manual review recommended'}`;
  }

  private formatMarkdownJoinCandidates(result: JoinAnalysisResult): string {
    if (result.candidates.length === 0) {
      return `## 🔗 Join Candidates

No join candidates found with the current confidence threshold.`;
    }

    const candidateRows = result.candidates.map((candidate, index) => {
      const confidence = `${(candidate.confidence * 100).toFixed(1)}%`;
      const strategy = this.formatStrategy(candidate.strategy);
      const cardinality = this.formatCardinality(candidate.cardinality);
      const dataLoss = `${candidate.qualityMetrics.dataLoss.toFixed(1)}%`;
      
      return `| ${index + 1} | \`${candidate.leftTable.tableName}\` | \`${candidate.leftColumn}\` | \`${candidate.rightTable.tableName}\` | \`${candidate.rightColumn}\` | ${confidence} | ${strategy} | ${cardinality} | ${dataLoss} |`;
    }).join('\n');

    return `## 🔗 Join Candidates

| # | Left Table | Left Column | Right Table | Right Column | Confidence | Strategy | Cardinality | Data Loss |
|---|------------|-------------|-------------|--------------|------------|----------|-------------|-----------|
${candidateRows}

### Top Join Recommendations

${this.formatTopJoins(result.candidates.slice(0, 3))}`;
  }

  private formatTopJoins(topCandidates: JoinCandidate[]): string {
    return topCandidates.map((candidate, index) => {
      const performance = candidate.qualityMetrics.performance;
      
      return `#### ${index + 1}. ${candidate.leftTable.tableName} ↔ ${candidate.rightTable.tableName}

**Join Condition:** \`${candidate.leftTable.tableName}.${candidate.leftColumn} = ${candidate.rightTable.tableName}.${candidate.rightColumn}\`

**Quality Metrics:**
- **Confidence:** ${(candidate.confidence * 100).toFixed(1)}%
- **Data Loss:** ${candidate.qualityMetrics.dataLoss.toFixed(1)}%
- **Consistency:** ${candidate.qualityMetrics.consistency.toFixed(1)}%
- **Estimated Rows:** ${candidate.estimatedRows.toLocaleString()}

**Performance:**
- **Estimated Time:** ${performance.estimatedTime}ms
- **Memory Usage:** ${(performance.estimatedMemory / 1024 / 1024).toFixed(1)}MB
- **Complexity:** ${performance.complexity}
${performance.indexRecommended ? '- **⚡ Index Recommended**' : ''}`;
    }).join('\n\n');
  }

  private formatMarkdownDependencyGraph(result: JoinAnalysisResult): string {
    const graph = result.dependencyGraph;
    
    const nodeList = graph.nodes.map(node => {
      const type = node.isRoot ? '🌿 Root' : node.isLeaf ? '🍃 Leaf' : '🔗 Node';
      return `- **${node.table.tableName}** (${type}, Level ${node.level})`;
    }).join('\n');

    const edgeList = graph.edges.map(edge => {
      const strength = `${(edge.strength * 100).toFixed(1)}%`;
      const columns = edge.columns.map(c => `${c.fromColumn}→${c.toColumn}`).join(', ');
      return `- **${edge.from}** → **${edge.to}** (${strength} confidence, ${columns})`;
    }).join('\n');

    return `## 🕸️ Table Dependency Graph

**Graph Depth:** ${graph.depth}  
**Detected Cycles:** ${graph.cycles.length}

### Tables
${nodeList}

### Relationships
${edgeList}

${graph.cycles.length > 0 ? `### ⚠️ Circular Dependencies
${graph.cycles.map(cycle => cycle.map(n => n.table.tableName).join(' → ')).join('\n')}` : ''}`;
  }

  private formatMarkdownIntegrityReport(result: JoinAnalysisResult): string {
    const report = result.integrityReport;
    
    return `## 🛡️ Data Integrity Report

**Valid Relationships:** ${report.validJoins.length}  
**Broken Relationships:** ${report.brokenRelationships.length}  
**Orphaned Records:** ${report.orphanedRecords.length}

${report.brokenRelationships.length > 0 ? `### ⚠️ Referential Integrity Issues

${report.brokenRelationships.map(broken => 
  `- **${broken.fromTable}.${broken.fromColumn}** → **${broken.toTable}.${broken.toColumn}**: ${broken.violationCount} violations`
).join('\n')}` : '### ✅ No Integrity Issues Found'}

${report.recommendations.length > 0 ? `### 💡 Integrity Recommendations

${report.recommendations.map(rec => `- ${rec}`).join('\n')}` : ''}`;
  }

  private formatMarkdownBusinessRules(result: JoinAnalysisResult): string {
    if (result.businessRules.length === 0) {
      return `## 🎯 Business Rules

No business relationship patterns detected.`;
    }

    const rulesList = result.businessRules.map(rule => {
      const confidence = `${(rule.confidence * 100).toFixed(1)}%`;
      const tables = rule.tables.map(t => `\`${t}\``).join(', ');
      
      return `### ${rule.name}

**Description:** ${rule.description}  
**Confidence:** ${confidence}  
**Tables:** ${tables}  
**Source:** ${rule.source}

**Conditions:**
${rule.conditions.map(c => `- ${c}`).join('\n')}`;
    }).join('\n\n');

    return `## 🎯 Business Rules

${rulesList}`;
  }

  private formatMarkdownRecommendations(result: JoinAnalysisResult): string {
    if (result.recommendations.length === 0) {
      return `## 💡 Recommendations

No specific recommendations at this time.`;
    }

    const recommendationsList = result.recommendations.map(rec => {
      const priority = rec.priority === 'HIGH' ? '🔴' : rec.priority === 'MEDIUM' ? '🟡' : '🟢';
      
      return `### ${priority} ${rec.title}

**Type:** ${rec.type}  
**Priority:** ${rec.priority}  
**Estimated Effort:** ${rec.estimatedEffort}

**Description:** ${rec.description}

**Expected Impact:** ${rec.impact}

**Implementation:** ${rec.implementation}`;
    }).join('\n\n');

    return `## 💡 Recommendations

${recommendationsList}`;
  }

  private formatMarkdownPerformance(result: JoinAnalysisResult): string {
    const perf = result.performance;
    
    return `## ⚡ Performance Analysis

**Overall Complexity:** ${perf.overallComplexity}

### Current Capacity
- **Rows:** ${perf.scalabilityAssessment.currentCapacity.rows.toLocaleString()}
- **Size:** ${perf.scalabilityAssessment.currentCapacity.sizeGB.toFixed(2)} GB
- **Tables:** ${perf.scalabilityAssessment.currentCapacity.tables}

### Projected Capacity (10x Growth)
- **Rows:** ${perf.scalabilityAssessment.projectedCapacity.rows.toLocaleString()}
- **Size:** ${perf.scalabilityAssessment.projectedCapacity.sizeGB.toFixed(2)} GB
- **Scaling Strategy:** ${perf.scalabilityAssessment.scalingStrategy}

${perf.optimizations.length > 0 ? `### 🚀 Optimization Opportunities

${perf.optimizations.map(opt => 
  `- **${opt.category}:** ${opt.description} (${opt.expectedImprovement})`
).join('\n')}` : ''}

---

*Generated by DataPilot Join Intelligence Engine v1.0*`;
  }

  /**
   * Format as JSON for programmatic consumption
   */
  private formatJSON(result: JoinAnalysisResult): string {
    return JSON.stringify(result, null, 2);
  }

  /**
   * Generate SQL join statements and optimization hints
   */
  private formatSQL(result: JoinAnalysisResult): string {
    const sqlStatements = result.candidates.map((candidate, index) => {
      const leftAlias = candidate.leftTable.tableName.substring(0, 1).toLowerCase();
      const rightAlias = candidate.rightTable.tableName.substring(0, 1).toLowerCase();
      
      let sql = `-- Join ${index + 1}: ${candidate.leftTable.tableName} ↔ ${candidate.rightTable.tableName}\n`;
      sql += `-- Confidence: ${(candidate.confidence * 100).toFixed(1)}%, Strategy: ${candidate.strategy}\n`;
      sql += `SELECT *\n`;
      sql += `FROM ${candidate.leftTable.tableName} ${leftAlias}\n`;
      sql += `  ${this.getJoinType(candidate)} ${candidate.rightTable.tableName} ${rightAlias}\n`;
      sql += `    ON ${leftAlias}.${candidate.leftColumn} = ${rightAlias}.${candidate.rightColumn};\n`;
      
      if (candidate.qualityMetrics.performance.indexRecommended) {
        sql += `\n-- Recommended indexes:\n`;
        sql += `-- CREATE INDEX idx_${candidate.leftTable.tableName}_${candidate.leftColumn} ON ${candidate.leftTable.tableName}(${candidate.leftColumn});\n`;
        sql += `-- CREATE INDEX idx_${candidate.rightTable.tableName}_${candidate.rightColumn} ON ${candidate.rightTable.tableName}(${candidate.rightColumn});\n`;
      }
      
      return sql;
    }).join('\n\n');

    return `-- DataPilot Join Analysis SQL Export
-- Generated: ${new Date().toISOString()}

${sqlStatements}`;
  }

  /**
   * Generate visual diagram representation
   */
  private formatDiagram(result: JoinAnalysisResult): string {
    // This would generate DOT notation for Graphviz or similar
    const nodes = result.dependencyGraph.nodes.map(node => 
      `  "${node.table.tableName}" [label="${node.table.tableName}\\n${node.table.rowCount} rows"];`
    ).join('\n');

    const edges = result.dependencyGraph.edges.map(edge => 
      `  "${edge.from}" -> "${edge.to}" [label="${edge.columns[0]?.fromColumn || ''}"];`
    ).join('\n');

    return `digraph JoinAnalysis {
  rankdir=TB;
  node [shape=box, style=rounded];
  
${nodes}

${edges}
}`;
  }

  // Helper methods for formatting

  private formatStrategy(strategy: JoinStrategy): string {
    const strategyMap = {
      [JoinStrategy.EXACT_MATCH]: '🎯 Exact',
      [JoinStrategy.FUZZY_MATCH]: '🔍 Fuzzy',
      [JoinStrategy.SEMANTIC_MATCH]: '🧠 Semantic',
      [JoinStrategy.PATTERN_MATCH]: '🔤 Pattern',
      [JoinStrategy.RANGE_OVERLAP]: '📊 Range',
      [JoinStrategy.STATISTICAL_MATCH]: '📈 Statistical'
    };
    return strategyMap[strategy] || strategy;
  }

  private formatCardinality(cardinality: CardinalityType): string {
    const cardinalityMap = {
      [CardinalityType.ONE_TO_ONE]: '1:1',
      [CardinalityType.ONE_TO_MANY]: '1:N',
      [CardinalityType.MANY_TO_ONE]: 'N:1',
      [CardinalityType.MANY_TO_MANY]: 'N:M'
    };
    return cardinalityMap[cardinality] || cardinality;
  }

  private getJoinType(candidate: JoinCandidate): string {
    // Default to INNER JOIN, could be enhanced with logic to determine optimal join type
    return 'INNER JOIN';
  }
}