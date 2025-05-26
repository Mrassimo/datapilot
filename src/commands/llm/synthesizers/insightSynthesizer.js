/**
 * Insight Synthesizer
 * Connects findings across EDA, INT, VIS, and ENG analyses to create unified insights
 */

export function synthesizeInsights(edaSummary, intSummary, visSummary, engSummary) {
  const synthesized = {
    connectedInsights: [],
    crossAnalysisPatterns: [],
    unifiedRecommendations: [],
    criticalPath: []
  };

  // Connect statistical patterns with quality issues
  connectStatisticalAndQuality(edaSummary, intSummary, synthesized);

  // Connect visualization needs with data characteristics
  connectVisualizationAndData(visSummary, edaSummary, intSummary, synthesized);

  // Connect engineering requirements with quality and volume
  connectEngineeringAndOperational(engSummary, intSummary, edaSummary, synthesized);

  // Identify cross-cutting patterns
  identifyCrossCuttingPatterns(edaSummary, intSummary, visSummary, engSummary, synthesized);

  // Generate unified recommendations
  generateUnifiedRecommendations(synthesized, edaSummary, intSummary, visSummary, engSummary);

  // Determine critical path for improvements
  determineCriticalPath(synthesized, intSummary);

  return synthesized;
}

function connectStatisticalAndQuality(eda, int, synthesized) {
  // Connect outliers with data quality
  if (eda.patterns && int.criticalIssues) {
    eda.patterns.forEach(pattern => {
      if (pattern.type === 'distribution' && pattern.finding.includes('outliers')) {
        const relatedQuality = int.criticalIssues.find(issue => 
          issue.type === 'outlier' || issue.type === 'pattern_anomaly'
        );
        
        if (relatedQuality) {
          synthesized.connectedInsights.push({
            insight: `Statistical outliers in ${pattern.finding} are confirmed as data quality issues`,
            impact: 'high',
            action: relatedQuality.fixAvailable ? 
              'Automated fix available for outlier treatment' : 
              'Manual review required for outlier handling',
            confidence: Math.min(pattern.confidence, relatedQuality.confidence)
          });
        }
      }
    });
  }

  // Connect missing data patterns with completeness issues
  if (eda.metrics && int.validationFailures) {
    const completenessFailure = int.validationFailures.find(f => f.dimension === 'completeness');
    
    if (completenessFailure && completenessFailure.score < 0.8) {
      const affectedMetrics = Object.entries(eda.metrics)
        .filter(([col, stats]) => completenessFailure.affectedColumns.includes(col))
        .map(([col]) => col);
      
      if (affectedMetrics.length > 0) {
        synthesized.connectedInsights.push({
          insight: `Low completeness (${(completenessFailure.score * 100).toFixed(0)}%) affects key business metrics: ${affectedMetrics.join(', ')}`,
          impact: 'critical',
          action: 'Prioritize data collection for these business-critical fields',
          confidence: 0.95
        });
      }
    }
  }

  // Connect correlations with referential integrity
  if (eda.correlations && int.criticalIssues) {
    eda.correlations.forEach(corr => {
      const integrityIssue = int.criticalIssues.find(issue => 
        issue.type === 'referential_integrity' &&
        (issue.column === corr.columns[0] || issue.column === corr.columns[1])
      );
      
      if (integrityIssue) {
        synthesized.connectedInsights.push({
          insight: `Strong ${corr.direction} correlation between ${corr.columns.join(' and ')} compromised by ${integrityIssue.issue}`,
          impact: 'high',
          action: 'Fix referential integrity before correlation-based analysis',
          confidence: 0.9
        });
      }
    });
  }
}

function connectVisualizationAndData(vis, eda, int, synthesized) {
  // Connect visualization recommendations with data quality
  if (vis.topVisualizations && int.qualityScore) {
    vis.topVisualizations.forEach(viz => {
      if (int.qualityScore.score < 0.8) {
        const qualityWarning = {
          insight: `${viz.type} visualization recommended but data quality score is ${int.qualityScore.grade}`,
          impact: 'medium',
          action: 'Address data quality issues before creating production visualizations',
          confidence: 0.85
        };
        
        // Check if specific columns have issues
        const vizColumns = Array.isArray(viz.dataCoverage) ? viz.dataCoverage : [viz.dataCoverage];
        const columnIssues = int.criticalIssues.filter(issue => 
          vizColumns.includes(issue.column)
        );
        
        if (columnIssues.length > 0) {
          qualityWarning.impact = 'high';
          qualityWarning.action = `Fix ${columnIssues[0].issue} before implementing ${viz.type}`;
        }
        
        synthesized.connectedInsights.push(qualityWarning);
      }
    });
  }

  // Connect time series visualizations with seasonality patterns
  if (vis.topVisualizations && eda.patterns) {
    const timeSeriesViz = vis.topVisualizations.find(v => v.type.includes('time_series'));
    const seasonalityPattern = eda.patterns.find(p => p.type === 'seasonality');
    
    if (timeSeriesViz && seasonalityPattern) {
      synthesized.connectedInsights.push({
        insight: `Time series visualization aligns with detected ${seasonalityPattern.finding}`,
        impact: 'medium',
        action: `Include ${seasonalityPattern.finding.toLowerCase()} in visualization annotations`,
        confidence: 0.9
      });
    }
  }

  // Connect distribution visualizations with skewness
  const distributionViz = vis.topVisualizations.find(v => 
    v.purpose.toLowerCase().includes('distribution')
  );
  const skewedDistribution = eda.patterns.find(p => 
    p.type === 'distribution' && p.finding.includes('skew')
  );
  
  if (distributionViz && skewedDistribution) {
    synthesized.connectedInsights.push({
      insight: `Distribution visualization should account for ${skewedDistribution.finding}`,
      impact: 'medium',
      action: skewedDistribution.impact || 'Consider log scale or transformation in visualization',
      confidence: 0.85
    });
  }
}

function connectEngineeringAndOperational(eng, int, eda, synthesized) {
  // Connect schema recommendations with data volume
  if (eng.schemaRecommendation && eda.metrics) {
    const totalRecords = Object.values(eda.metrics)[0]?.recordCount || 0;
    
    if (totalRecords > 1000000 && eng.schemaRecommendation.approach !== 'star_schema') {
      synthesized.connectedInsights.push({
        insight: `${eng.schemaRecommendation.approach} schema with ${(totalRecords/1000000).toFixed(1)}M records may need optimization`,
        impact: 'high',
        action: 'Consider star schema or partitioning strategy for better performance',
        confidence: 0.8
      });
    }
  }

  // Connect ETL requirements with data quality fixes
  if (eng.etlRequirements && int.automatedFixes) {
    const cleansingETL = eng.etlRequirements.find(req => req.stage === 'Cleansing');
    
    if (cleansingETL && int.automatedFixes.length > 0) {
      synthesized.connectedInsights.push({
        insight: `ETL cleansing stage can implement ${int.automatedFixes.length} automated data quality fixes`,
        impact: 'high',
        action: `Integrate fixes into ETL pipeline: ${int.automatedFixes.slice(0, 2).map(f => f.fix).join(', ')}`,
        confidence: 0.95
      });
    }
  }

  // Connect performance considerations with correlations
  if (eng.performanceConsiderations && eda.correlations) {
    const indexingRec = eng.performanceConsiderations.find(p => 
      p.aspect === 'Query Optimization'
    );
    
    if (indexingRec && eda.correlations.length > 0) {
      const correlatedColumns = new Set();
      eda.correlations.forEach(corr => {
        correlatedColumns.add(corr.columns[0]);
        correlatedColumns.add(corr.columns[1]);
      });
      
      synthesized.connectedInsights.push({
        insight: 'Highly correlated columns should be considered for composite indexes',
        impact: 'medium',
        action: `Create composite indexes on correlated pairs: ${Array.from(correlatedColumns).slice(0, 4).join(', ')}`,
        confidence: 0.75
      });
    }
  }
}

function identifyCrossCuttingPatterns(eda, int, vis, eng, synthesized) {
  const patterns = [];

  // Pattern: Rapid growth with quality degradation
  if (eda.patterns && int.qualityScore) {
    const growthPattern = eda.patterns.find(p => 
      p.type === 'trend' && p.finding.includes('growth')
    );
    
    if (growthPattern && int.qualityScore.score < 0.85) {
      patterns.push({
        pattern: 'Growth-Quality Trade-off',
        description: `${growthPattern.finding} coincides with ${int.qualityScore.grade} data quality`,
        implication: 'Rapid growth may be compromising data collection standards',
        recommendation: 'Implement stricter validation during high-growth periods'
      });
    }
  }

  // Pattern: Segmentation opportunity with visualization
  if (eda.patterns && vis.topVisualizations) {
    const segmentPattern = eda.keyFindings?.find(f => 
      f.finding.toLowerCase().includes('segment') || 
      f.finding.toLowerCase().includes('group')
    );
    
    const segmentViz = vis.topVisualizations.find(v => 
      v.type.includes('cluster') || v.type.includes('scatter')
    );
    
    if (segmentPattern && segmentViz) {
      patterns.push({
        pattern: 'Segmentation Opportunity',
        description: 'Natural customer segments detected with visualization support',
        implication: segmentPattern.finding,
        recommendation: `Use ${segmentViz.type} to explore and validate segments`
      });
    }
  }

  // Pattern: Complex relationships requiring engineering
  if (eng.relationships && eng.relationships.length > 3) {
    const complexRelationships = eng.relationships.filter(r => 
      r.type === 'many-to-many' || r.cardinality === 'many-to-many'
    );
    
    if (complexRelationships.length > 0) {
      patterns.push({
        pattern: 'Complex Relationship Network',
        description: `${eng.relationships.length} relationships with ${complexRelationships.length} many-to-many connections`,
        implication: 'Data model complexity may impact query performance',
        recommendation: 'Consider bridge tables or denormalization for critical paths'
      });
    }
  }

  synthesized.crossAnalysisPatterns = patterns;
}

function generateUnifiedRecommendations(synthesized, eda, int, vis, eng) {
  const recommendations = [];
  const addedRecommendations = new Set();

  // Priority 1: Critical data quality fixes
  if (int.automatedFixes && int.automatedFixes.length > 0) {
    const topFix = int.automatedFixes[0];
    const rec = {
      priority: 1,
      category: 'Data Quality',
      action: topFix.fix,
      impact: `Improves data quality for ${topFix.recordsAffected} records`,
      effort: 'Low (automated)',
      implementation: topFix.sqlSnippet || topFix.pythonSnippet || 'See automated fix details'
    };
    
    recommendations.push(rec);
    addedRecommendations.add(rec.action);
  }

  // Priority 2: High-impact visualizations
  if (vis.topVisualizations && vis.topVisualizations.length > 0) {
    const topViz = vis.topVisualizations[0];
    const rec = {
      priority: 2,
      category: 'Visualization',
      action: `Implement ${topViz.type} for ${topViz.purpose}`,
      impact: topViz.insight,
      effort: 'Medium',
      implementation: topViz.implementation
    };
    
    if (!addedRecommendations.has(rec.action)) {
      recommendations.push(rec);
      addedRecommendations.add(rec.action);
    }
  }

  // Priority 3: Performance optimizations
  if (eng.performanceConsiderations && eng.performanceConsiderations.length > 0) {
    const topPerf = eng.performanceConsiderations[0];
    const rec = {
      priority: 3,
      category: 'Performance',
      action: topPerf.recommendation,
      impact: `Addresses: ${topPerf.issue}`,
      effort: 'Medium to High',
      implementation: 'See engineering recommendations'
    };
    
    if (!addedRecommendations.has(rec.action)) {
      recommendations.push(rec);
      addedRecommendations.add(rec.action);
    }
  }

  // Priority 4: Analytical opportunities
  const analyticalOps = [];
  
  // From correlations
  if (eda.correlations && eda.correlations.length > 0) {
    const topCorr = eda.correlations[0];
    analyticalOps.push({
      priority: 4,
      category: 'Analysis',
      action: `Investigate ${topCorr.direction} relationship between ${topCorr.columns.join(' and ')}`,
      impact: topCorr.businessMeaning,
      effort: 'Low',
      implementation: 'Statistical analysis or predictive modeling'
    });
  }

  // From patterns
  if (eda.patterns && eda.patterns.length > 0) {
    const significantPattern = eda.patterns.find(p => p.confidence > 0.9);
    if (significantPattern) {
      analyticalOps.push({
        priority: 4,
        category: 'Analysis',
        action: `Leverage ${significantPattern.type} pattern: ${significantPattern.finding}`,
        impact: significantPattern.impact,
        effort: 'Low to Medium',
        implementation: 'Time series analysis or segmentation'
      });
    }
  }

  // Add best analytical opportunity
  if (analyticalOps.length > 0 && !addedRecommendations.has(analyticalOps[0].action)) {
    recommendations.push(analyticalOps[0]);
  }

  synthesized.unifiedRecommendations = recommendations.slice(0, 5);
}

function determineCriticalPath(synthesized, intSummary) {
  const criticalPath = [];

  // Step 1: Fix critical data quality issues
  if (intSummary.qualityScore && intSummary.qualityScore.score < 0.8) {
    criticalPath.push({
      step: 1,
      action: 'Address critical data quality issues',
      reason: `Current quality score ${intSummary.qualityScore.grade} blocks accurate analysis`,
      timeframe: 'Immediate'
    });
  }

  // Step 2: Implement ETL fixes
  const etlFixes = synthesized.connectedInsights.find(i => 
    i.insight.includes('ETL') && i.impact === 'high'
  );
  
  if (etlFixes) {
    criticalPath.push({
      step: criticalPath.length + 1,
      action: 'Integrate quality fixes into ETL pipeline',
      reason: 'Prevent future quality degradation',
      timeframe: 'Week 1-2'
    });
  }

  // Step 3: Deploy key visualizations
  const vizRec = synthesized.unifiedRecommendations.find(r => 
    r.category === 'Visualization'
  );
  
  if (vizRec) {
    criticalPath.push({
      step: criticalPath.length + 1,
      action: vizRec.action,
      reason: 'Enable data-driven decision making',
      timeframe: 'Week 2-3'
    });
  }

  // Step 4: Performance optimization
  const perfRec = synthesized.unifiedRecommendations.find(r => 
    r.category === 'Performance'
  );
  
  if (perfRec) {
    criticalPath.push({
      step: criticalPath.length + 1,
      action: perfRec.action,
      reason: 'Ensure scalability for growing data',
      timeframe: 'Week 3-4'
    });
  }

  // Step 5: Advanced analytics
  const analyticsRec = synthesized.unifiedRecommendations.find(r => 
    r.category === 'Analysis'
  );
  
  if (analyticsRec) {
    criticalPath.push({
      step: criticalPath.length + 1,
      action: analyticsRec.action,
      reason: 'Extract business value from clean, optimized data',
      timeframe: 'Week 4+'
    });
  }

  synthesized.criticalPath = criticalPath;
}