/**
 * ENG (Data Engineering) Summary Extractor
 * Extracts critical engineering insights and schema recommendations for LLM context
 */

export function extractEngSummary(engResults, options = {}) {
  const summary = {
    schemaRecommendation: null,
    performanceConsiderations: [],
    etlRequirements: [],
    technicalDebt: [],
    relationships: []
  };

  // Extract primary schema recommendation
  if (engResults.schemaRecommendations) {
    const topSchema = engResults.schemaRecommendations[0];
    summary.schemaRecommendation = {
      approach: topSchema.type,
      rationale: topSchema.rationale,
      keyTables: formatKeyTables(topSchema.tables),
      complexity: topSchema.complexity || 'moderate'
    };
  }

  // Extract critical performance considerations
  if (engResults.performanceAnalysis) {
    const perf = engResults.performanceAnalysis;
    const criticalConsiderations = [];
    
    if (perf.dataVolume > 1000000) {
      criticalConsiderations.push({
        aspect: 'Data Volume',
        issue: `${(perf.dataVolume / 1000000).toFixed(1)}M records require partitioning`,
        recommendation: perf.partitioningStrategy || 'Partition by date or key dimension'
      });
    }
    
    if (perf.queryPatterns) {
      const hotPaths = perf.queryPatterns.filter(p => p.frequency === 'high');
      if (hotPaths.length > 0) {
        criticalConsiderations.push({
          aspect: 'Query Optimization',
          issue: `${hotPaths.length} high-frequency query patterns identified`,
          recommendation: 'Create indexes on: ' + hotPaths.map(p => p.columns.join(', ')).join('; ')
        });
      }
    }
    
    if (perf.joinComplexity === 'high') {
      criticalConsiderations.push({
        aspect: 'Join Performance',
        issue: 'Multiple large table joins detected',
        recommendation: 'Consider materialized views or denormalization for critical paths'
      });
    }
    
    summary.performanceConsiderations = criticalConsiderations.slice(0, 3);
  }

  // Extract key ETL requirements
  if (engResults.etlAnalysis) {
    const etl = engResults.etlAnalysis;
    const keyRequirements = [];
    
    if (etl.dataQualityIssues && etl.dataQualityIssues.length > 0) {
      keyRequirements.push({
        stage: 'Cleansing',
        requirement: 'Data quality fixes needed',
        specifics: etl.dataQualityIssues.slice(0, 3).map(i => i.issue).join(', ')
      });
    }
    
    if (etl.transformations && etl.transformations.length > 0) {
      const complexTransforms = etl.transformations.filter(t => t.complexity === 'high');
      if (complexTransforms.length > 0) {
        keyRequirements.push({
          stage: 'Transformation',
          requirement: `${complexTransforms.length} complex transformations required`,
          specifics: complexTransforms[0].description
        });
      }
    }
    
    if (etl.incrementalStrategy) {
      keyRequirements.push({
        stage: 'Loading',
        requirement: 'Incremental load strategy',
        specifics: etl.incrementalStrategy.description
      });
    }
    
    summary.etlRequirements = keyRequirements;
  }

  // Extract technical debt insights
  if (engResults.technicalDebt) {
    const criticalDebt = engResults.technicalDebt
      .filter(debt => debt.severity === 'high' || debt.impact === 'blocking')
      .slice(0, 3)
      .map(debt => ({
        issue: debt.description,
        impact: debt.businessImpact || 'Processing efficiency reduced',
        effort: debt.estimatedEffort || 'medium',
        priority: debt.priority || 'high'
      }));
    
    summary.technicalDebt = criticalDebt;
  }

  // Extract discovered relationships
  if (engResults.relationships) {
    const strongRelationships = engResults.relationships
      .filter(rel => rel.confidence > 0.9)
      .slice(0, 5)
      .map(rel => ({
        type: rel.type,
        from: rel.sourceTable || rel.sourceColumn,
        to: rel.targetTable || rel.targetColumn,
        cardinality: rel.cardinality || 'many-to-one',
        strength: rel.confidence
      }));
    
    summary.relationships = strongRelationships;
  }

  // Extract warehouse-specific insights if available
  if (engResults.warehouseKnowledge) {
    const knowledge = engResults.warehouseKnowledge;
    
    if (knowledge.tableClassification) {
      summary.tableClassification = {
        factTables: knowledge.tableClassification.facts || [],
        dimensions: knowledge.tableClassification.dimensions || [],
        bridges: knowledge.tableClassification.bridges || []
      };
    }
    
    if (knowledge.commonPatterns && knowledge.commonPatterns.length > 0) {
      summary.patterns = knowledge.commonPatterns
        .slice(0, 3)
        .map(p => ({
          pattern: p.name,
          description: p.description,
          recommendation: p.recommendation
        }));
    }
  }

  return summary;
}

function formatKeyTables(tables) {
  if (!tables || tables.length === 0) return [];
  
  return tables.slice(0, 5).map(table => ({
    name: table.name,
    type: table.type || inferTableType(table),
    keyColumns: table.keyColumns || [],
    recordCount: table.estimatedRows || 'unknown'
  }));
}

function inferTableType(table) {
  const name = table.name.toLowerCase();
  
  // Fact table patterns
  if (name.includes('fact') || name.includes('transaction') || 
      name.includes('event') || name.includes('sales')) {
    return 'fact';
  }
  
  // Dimension patterns
  if (name.includes('dim') || name.includes('customer') || 
      name.includes('product') || name.includes('location') ||
      name.includes('date') || name.includes('time')) {
    return 'dimension';
  }
  
  // Bridge/junction patterns
  if (name.includes('bridge') || name.includes('link') || 
      name.includes('xref') || name.includes('mapping')) {
    return 'bridge';
  }
  
  // Staging patterns
  if (name.includes('stg') || name.includes('staging') || 
      name.includes('temp') || name.includes('load')) {
    return 'staging';
  }
  
  return 'operational';
}

export function assessEngineeringComplexity(engResults) {
  let complexity = 0;
  
  // Schema complexity
  if (engResults.schemaRecommendations) {
    const schema = engResults.schemaRecommendations[0];
    if (schema.tables && schema.tables.length > 10) complexity += 2;
    if (schema.type === 'snowflake' || schema.type === 'data_vault') complexity += 1;
  }
  
  // Data volume
  if (engResults.performanceAnalysis) {
    const volume = engResults.performanceAnalysis.dataVolume;
    if (volume > 10000000) complexity += 2;
    else if (volume > 1000000) complexity += 1;
  }
  
  // ETL complexity
  if (engResults.etlAnalysis) {
    const transforms = engResults.etlAnalysis.transformations || [];
    const complexTransforms = transforms.filter(t => t.complexity === 'high').length;
    if (complexTransforms > 5) complexity += 2;
    else if (complexTransforms > 2) complexity += 1;
  }
  
  // Technical debt
  if (engResults.technicalDebt) {
    const highSeverity = engResults.technicalDebt.filter(d => d.severity === 'high').length;
    if (highSeverity > 3) complexity += 1;
  }
  
  return {
    score: complexity,
    level: complexity <= 2 ? 'low' : complexity <= 4 ? 'moderate' : 'high',
    factors: getComplexityFactors(complexity)
  };
}

function getComplexityFactors(score) {
  const factors = [];
  
  if (score >= 6) {
    factors.push('Large-scale data warehouse implementation required');
    factors.push('Significant ETL development needed');
    factors.push('Performance optimization critical');
  } else if (score >= 4) {
    factors.push('Moderate data modeling effort required');
    factors.push('Standard ETL patterns applicable');
    factors.push('Some optimization needed');
  } else {
    factors.push('Simple schema design sufficient');
    factors.push('Basic transformations only');
    factors.push('Standard tooling adequate');
  }
  
  return factors;
}