/**
 * Key Finding Selector
 * Prioritizes and selects the most important findings based on impact scoring
 */

export class KeyFindingSelector {
  constructor(options = {}) {
    this.maxFindings = options.maxFindings || 5;
    this.maxPatternsPerCategory = options.maxPatternsPerCategory || 2;
    this.scoringWeights = {
      businessImpact: options.businessImpactWeight || 0.3,
      dataQuality: options.dataQualityWeight || 0.25,
      actionability: options.actionabilityWeight || 0.2,
      crossAnalysis: options.crossAnalysisWeight || 0.15,
      confidence: options.confidenceWeight || 0.1
    };
  }

  selectKeyFindings(allFindings) {
    // Flatten all findings from different sources
    const flattenedFindings = this.flattenFindings(allFindings);
    
    // Score each finding
    const scoredFindings = flattenedFindings.map(finding => ({
      ...finding,
      impactScore: this.calculateImpactScore(finding)
    }));
    
    // Sort by impact score
    const sortedFindings = scoredFindings.sort((a, b) => b.impactScore - a.impactScore);
    
    // Apply diversity rules to ensure variety
    const diverseFindings = this.ensureDiversity(sortedFindings);
    
    // Return top findings
    return diverseFindings.slice(0, this.maxFindings);
  }

  flattenFindings(allFindings) {
    const flattened = [];
    
    // Extract from summaries
    ['eda', 'int', 'vis', 'eng'].forEach(source => {
      const summary = allFindings[source + 'Summary'];
      if (!summary) return;
      
      // Key findings
      if (summary.keyFindings) {
        summary.keyFindings.forEach(finding => {
          flattened.push({
            ...finding,
            source,
            category: 'key_finding'
          });
        });
      }
      
      // Critical insights
      if (summary.criticalInsights) {
        summary.criticalInsights.forEach(insight => {
          flattened.push({
            ...insight,
            source,
            category: 'critical_insight'
          });
        });
      }
      
      // Patterns
      if (summary.patterns) {
        summary.patterns.forEach(pattern => {
          flattened.push({
            ...pattern,
            source,
            category: 'pattern'
          });
        });
      }
      
      // Critical issues (INT specific)
      if (summary.criticalIssues) {
        summary.criticalIssues.forEach(issue => {
          flattened.push({
            ...issue,
            source,
            category: 'critical_issue'
          });
        });
      }
    });
    
    // Extract from synthesis
    const synthesis = allFindings.synthesis;
    if (synthesis) {
      // Connected insights get bonus for cross-analysis
      if (synthesis.connectedInsights) {
        synthesis.connectedInsights.forEach(insight => {
          flattened.push({
            ...insight,
            source: 'synthesis',
            category: 'connected_insight',
            crossAnalysis: true
          });
        });
      }
      
      // Cross-cutting patterns
      if (synthesis.crossAnalysisPatterns) {
        synthesis.crossAnalysisPatterns.forEach(pattern => {
          flattened.push({
            finding: pattern.description,
            impact: pattern.implication,
            action: pattern.recommendation,
            source: 'synthesis',
            category: 'cross_pattern',
            crossAnalysis: true,
            confidence: 0.9
          });
        });
      }
    }
    
    return flattened;
  }

  calculateImpactScore(finding) {
    let score = 0;
    
    // Business impact scoring
    score += this.scoreBusinessImpact(finding) * this.scoringWeights.businessImpact;
    
    // Data quality impact
    score += this.scoreDataQualityImpact(finding) * this.scoringWeights.dataQuality;
    
    // Actionability
    score += this.scoreActionability(finding) * this.scoringWeights.actionability;
    
    // Cross-analysis relevance
    score += this.scoreCrossAnalysisRelevance(finding) * this.scoringWeights.crossAnalysis;
    
    // Confidence
    score += (finding.confidence || 0.8) * this.scoringWeights.confidence;
    
    return score;
  }

  scoreBusinessImpact(finding) {
    let score = 0.5; // Base score
    
    // Check for revenue/cost implications
    const impactText = (finding.impact || finding.finding || '').toLowerCase();
    
    if (impactText.includes('revenue') || impactText.includes('sales')) {
      score += 0.3;
    }
    
    if (impactText.includes('cost') || impactText.includes('efficiency')) {
      score += 0.2;
    }
    
    if (impactText.includes('customer') || impactText.includes('retention')) {
      score += 0.25;
    }
    
    if (impactText.includes('risk') || impactText.includes('compliance')) {
      score += 0.25;
    }
    
    // Check for quantified impact
    const hasPercentage = /\d+(\.\d+)?%/.test(impactText);
    const hasCurrency = /\$[\d,]+/.test(impactText);
    const hasLargeNumber = /\d{4,}/.test(impactText);
    
    if (hasPercentage || hasCurrency || hasLargeNumber) {
      score += 0.2;
    }
    
    // Critical issues get high scores
    if (finding.category === 'critical_issue' || finding.category === 'critical_insight') {
      score = Math.max(score, 0.9);
    }
    
    return Math.min(score, 1.0);
  }

  scoreDataQualityImpact(finding) {
    let score = 0.3; // Base score
    
    // Quality-specific findings
    if (finding.source === 'int' || finding.type === 'quality') {
      score += 0.3;
    }
    
    // Check for quality keywords
    const text = (finding.finding || finding.issue || '').toLowerCase();
    
    if (text.includes('missing') || text.includes('incomplete')) {
      score += 0.2;
    }
    
    if (text.includes('duplicate') || text.includes('inconsistent')) {
      score += 0.2;
    }
    
    if (text.includes('invalid') || text.includes('corrupt')) {
      score += 0.3;
    }
    
    if (text.includes('outlier') || text.includes('anomaly')) {
      score += 0.15;
    }
    
    // Records affected
    if (finding.recordsAffected) {
      if (finding.recordsAffected > 1000) score += 0.2;
      if (finding.recordsAffected > 10000) score += 0.1;
    }
    
    return Math.min(score, 1.0);
  }

  scoreActionability(finding) {
    let score = 0.2; // Base score
    
    // Has specific action
    if (finding.action) {
      score += 0.3;
    }
    
    // Has automated fix
    if (finding.fixAvailable || finding.automatedFix) {
      score += 0.4;
    }
    
    // Has implementation details
    if (finding.implementation || finding.sqlSnippet || finding.pythonSnippet) {
      score += 0.2;
    }
    
    // Check for specific recommendations
    const actionText = (finding.action || finding.recommendation || '').toLowerCase();
    
    if (actionText.includes('create') || actionText.includes('implement')) {
      score += 0.1;
    }
    
    if (actionText.includes('fix') || actionText.includes('correct')) {
      score += 0.15;
    }
    
    if (actionText.includes('optimize') || actionText.includes('improve')) {
      score += 0.1;
    }
    
    // Low effort increases actionability
    if (finding.effort === 'low' || finding.effort === 'Low (automated)') {
      score += 0.2;
    }
    
    return Math.min(score, 1.0);
  }

  scoreCrossAnalysisRelevance(finding) {
    let score = 0.0;
    
    // Explicit cross-analysis flag
    if (finding.crossAnalysis) {
      score += 0.5;
    }
    
    // From synthesis
    if (finding.source === 'synthesis') {
      score += 0.3;
    }
    
    // Connected insights
    if (finding.category === 'connected_insight' || finding.category === 'cross_pattern') {
      score += 0.4;
    }
    
    // Mentions multiple analysis areas
    const text = (finding.finding || finding.insight || '').toLowerCase();
    const analysisAreas = ['statistical', 'quality', 'visualization', 'engineering', 'etl', 'schema'];
    const mentionedAreas = analysisAreas.filter(area => text.includes(area));
    
    if (mentionedAreas.length >= 2) {
      score += 0.3;
    }
    
    return Math.min(score, 1.0);
  }

  ensureDiversity(sortedFindings) {
    const selected = [];
    const categoryCounts = {};
    const sourceCounts = {};
    
    for (const finding of sortedFindings) {
      // Check category limits
      const category = finding.category || 'other';
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
      
      if (categoryCounts[category] > this.maxPatternsPerCategory) {
        continue; // Skip if we have too many from this category
      }
      
      // Check source diversity
      const source = finding.source || 'unknown';
      sourceCounts[source] = (sourceCounts[source] || 0) + 1;
      
      // Allow more from synthesis as it's cross-cutting
      const maxPerSource = source === 'synthesis' ? 3 : 2;
      
      if (sourceCounts[source] > maxPerSource) {
        continue; // Skip if we have too many from this source
      }
      
      selected.push(finding);
      
      if (selected.length >= this.maxFindings * 2) {
        break; // We have enough candidates
      }
    }
    
    return selected;
  }

  formatForPresentation(findings) {
    return findings.map((finding, index) => {
      const formatted = {
        rank: index + 1,
        title: this.generateTitle(finding),
        description: finding.finding || finding.insight || finding.issue,
        impact: finding.impact,
        action: finding.action || finding.recommendation,
        confidence: finding.confidence || 0.85,
        source: finding.source,
        category: finding.category
      };
      
      // Add additional context if available
      if (finding.fixAvailable) {
        formatted.quickWin = true;
      }
      
      if (finding.recordsAffected) {
        formatted.scope = `${finding.recordsAffected} records affected`;
      }
      
      return formatted;
    });
  }

  generateTitle(finding) {
    // Generate a concise title based on the finding type
    if (finding.type === 'quality') {
      return 'DATA QUALITY ISSUE';
    } else if (finding.type === 'statistical') {
      return 'STATISTICAL INSIGHT';
    } else if (finding.type === 'pattern_anomaly') {
      return 'PATTERN ANOMALY';
    } else if (finding.category === 'connected_insight') {
      return 'CONNECTED INSIGHT';
    } else if (finding.category === 'cross_pattern') {
      return 'CROSS-ANALYSIS PATTERN';
    } else if (finding.source === 'vis') {
      return 'VISUALIZATION OPPORTUNITY';
    } else if (finding.source === 'eng') {
      return 'ENGINEERING CONSIDERATION';
    } else {
      return finding.type?.toUpperCase() || 'KEY FINDING';
    }
  }
}