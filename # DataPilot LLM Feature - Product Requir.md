# DataPilot LLM Feature - Product Requirements Document

## Executive Summary

The LLM Context Generation feature provides a concise, intelligent synthesis of all DataPilot analyses, optimised for AI conversation. It runs all analyses internally but filters to only the most important findings, adding cross-analysis insights while maintaining a format that LLMs can easily understand and build upon.

## Design Philosophy

1. **Smart Filtering**: Runs everything, shows only what matters
2. **Concise Context**: LLMs are smart - provide essence, not everything
3. **Cross-Analysis Synthesis**: Connect insights across domains
4. **Maintains Current Strengths**: Builds on existing effective format
5. **Implementation Efficiency**: Reuses analysis modules with summary mode

## Feature Overview

### Current State (Preserved)
- Dataset summary with key metrics
- Column characteristics
- Important patterns
- Statistical highlights
- Suggested analyses
- Questions to explore

### Enhanced Capabilities
- Runs all expanded analyses in summary mode
- Intelligent finding prioritisation
- Cross-analysis insight synthesis
- Critical issue highlighting
- Connected narrative threads
- Action priority matrix

## Technical Architecture

### Implementation Strategy

```javascript
// Each analysis module exports both full and summary
export class EdaAnalyser {
  async analyse(data, options = {}) {
    const results = await this.fullAnalysis(data);
    
    if (options.summaryMode) {
      return {
        keyFindings: this.extractKeyFindings(results),
        criticalInsights: this.identifyCritical(results),
        metrics: this.topMetrics(results)
      };
    }
    
    return results; // Full verbose output
  }
}

// LLM command orchestrates all analyses in summary mode
export class LlmCommand {
  async execute(data) {
    const analyses = await Promise.all([
      edaAnalyser.analyse(data, { summaryMode: true }),
      intAnalyser.analyse(data, { summaryMode: true }),
      visAnalyser.analyse(data, { summaryMode: true }),
      engAnalyser.analyse(data, { summaryMode: true })
    ]);
    
    return this.synthesise(analyses);
  }
}
```

## Output Specification

### Structure (Maintaining Current Format)

```
=== LLM-READY CONTEXT ===
Dataset: sales_analysis.csv
Generated: 2025-05-26 11:30:00

DATASET SUMMARY FOR AI ANALYSIS:

[Current format maintained - concise paragraph about the data]

KEY COLUMNS AND THEIR CHARACTERISTICS:
[Current format - numbered list with key details]

IMPORTANT PATTERNS AND INSIGHTS:
[Enhanced with cross-analysis findings]

DATA QUALITY NOTES:
[Filtered from INT analysis - only critical issues]

STATISTICAL SUMMARY:
[Key metrics from EDA]

CORRELATIONS DISCOVERED:
[Significant relationships only]

VISUALISATION PRIORITIES:
[Top 3 from VIS analysis]

ENGINEERING CONSIDERATIONS:
[Critical from ENG analysis]

SUGGESTED ANALYSES FOR THIS DATA:
[Current list + new possibilities from findings]

QUESTIONS THIS DATA COULD ANSWER:
[Current format maintained]

TECHNICAL NOTES FOR ANALYSIS:
[Current format + key warnings]

END OF CONTEXT
```

### Enhanced Sections

#### 1. Pattern Synthesis

The IMPORTANT PATTERNS section now includes connected insights:

```
IMPORTANT PATTERNS AND INSIGHTS:

1. REVENUE GROWTH WITH QUALITY WARNING: December sales up 45% but 234 
   transactions have referential integrity issues, suggesting rapid growth 
   may be compromising data quality.

2. CUSTOMER SEGMENTATION OPPORTUNITY: Premium customers (15% of base) 
   generate 43% of revenue with 3.4x higher AOV. However, they have 32% 
   missing emails, limiting marketing potential.

3. OPERATIONAL ANOMALY: Tuesday transaction volume 3x higher but same revenue.
   Data integrity check reveals duplicate entries during batch processing.

4. PRICING PSYCHOLOGY: Products at $49.99, $99.99, $149.99 drive 45% of 
   transactions. 234 products have non-psychological prices (e.g., $99.98).

5. GEOGRAPHIC IMBALANCE: Queensland shows 23% growth but only 8% market share,
   indicating expansion opportunity.
```

#### 2. Quality-Aware Statistics

Statistical summaries include quality context:

```
STATISTICAL SUMMARY:
- Total revenue: $6,234,567 (warning: $45,678 unattributed due to orphaned records)
- Average order value: $137.82 (after removing 156 outliers >$1000)
- Customer retention: 34% (but 15% of customer data too stale for accuracy)
- Peak period: Saturday 2-4pm (based on cleaned data, 47 duplicates removed)
```

#### 3. Actionable Correlations

Only include correlations with clear implications:

```
CORRELATIONS DISCOVERED:
- Email validity vs retention: -0.73 (poor data quality drives churn)
- Customer age vs AOV: 0.45 (older customers spend more)
- Price ending in 9 vs purchase rate: 0.67 (psychological pricing works)
```

#### 4. Visualisation Priorities

Top 3 most impactful visualisations:

```
VISUALISATION PRIORITIES:
1. Time series with anomaly highlighting for revenue trend
2. Sankey diagram for customer journey (shows retention issues)  
3. Scatter matrix for price optimisation analysis
```

### Key Finding Selection Algorithm

```javascript
class KeyFindingSelector {
  prioritise(allFindings) {
    return allFindings
      .map(finding => ({
        ...finding,
        score: this.calculateImpact(finding)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, this.maxFindings);
  }
  
  calculateImpact(finding) {
    let score = 0;
    
    // Business impact
    if (finding.revenueImpact > 10000) score += 30;
    if (finding.customerImpact > 100) score += 20;
    
    // Data quality impact  
    if (finding.qualityIssue === 'critical') score += 25;
    
    // Actionability
    if (finding.hasAutomatedFix) score += 15;
    if (finding.effortLevel === 'low') score += 10;
    
    // Cross-analysis relevance
    if (finding.appearsInMultipleAnalyses) score += 20;
    
    return score;
  }
}
```

### Synthesis Logic

Connect findings across analyses:

```javascript
class InsightSynthesiser {
  synthesise(edaFindings, intFindings, visFindings, engFindings) {
    const connections = [];
    
    // Example: Connect statistical pattern with quality issue
    edaFindings.forEach(stat => {
      const relatedQuality = intFindings.find(q => 
        q.column === stat.column && q.severity === 'high'
      );
      
      if (relatedQuality) {
        connections.push({
          insight: `${stat.pattern} may be affected by ${relatedQuality.issue}`,
          impact: 'high',
          action: relatedQuality.fix
        });
      }
    });
    
    // Example: Connect visualisation need with data characteristic
    visFindings.forEach(vis => {
      const dataSupport = edaFindings.find(e => 
        e.supportsVisualisation === vis.type
      );
      
      if (!dataSupport) {
        connections.push({
          warning: `${vis.type} recommended but data may need transformation`,
          suggestion: vis.alternativeApproach
        });
      }
    });
    
    return connections;
  }
}
```

## Performance Optimisation

Since LLM runs all analyses:

```javascript
class AnalysisCache {
  constructor() {
    this.cache = new Map();
  }
  
  async getOrCompute(file, analyser) {
    const key = `${file}_${analyser.name}`;
    
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }
    
    const result = await analyser.analyse(file);
    this.cache.set(key, result);
    
    // Cache for 5 minutes
    setTimeout(() => this.cache.delete(key), 300000);
    
    return result;
  }
}
```

## Configuration

Allow users to tune verbosity if needed:

```javascript
// Default: balanced
const llmConfig = {
  maxPatterns: 5,
  maxColumns: 10,
  includeQualityWarnings: true,
  includeTechnicalNotes: true,
  synthesisDepth: 'medium'
};

// But NO FLAGS - auto-detect based on data size/complexity
if (data.columns.length > 50) {
  llmConfig.maxColumns = 15; // Show more for complex data
}
```

## Output Length Management

Target output size: 2-3 pages (vs 100+ for 'all' command)

```javascript
class OutputCompressor {
  compress(fullOutput) {
    return {
      // Instead of all columns, show most interesting
      columns: this.selectInterestingColumns(fullOutput.columns, 10),
      
      // Instead of all patterns, show high-impact ones
      patterns: this.filterHighImpact(fullOutput.patterns, 5),
      
      // Combine similar findings
      insights: this.deduplicateInsights(fullOutput.insights),
      
      // Summary statistics only
      stats: this.summariseStats(fullOutput.statistics)
    };
  }
}
```

## Integration with Expanded Features

Each expanded analysis provides a summary method:

### EDA Summary
- Top 3 statistical insights
- Most significant correlations
- Critical distributions only
- Key outliers

### INT Summary  
- Critical data quality issues only
- Business rules with >95% confidence
- Automated fixes available
- Overall quality score

### VIS Summary
- Top 3 visualisation recommendations
- Primary dashboard layout
- Critical anti-patterns to avoid

### ENG Summary
- Primary schema recommendation
- Critical performance considerations
- Key ETL requirements

## Success Metrics

1. **Conciseness**: Output 2-3 pages (vs 100+ for full)
2. **Relevance**: 90% of included findings are actionable
3. **Synthesis**: Every section connects to others
4. **LLM Performance**: Resulting prompts get better AI responses
5. **Speed**: <5 seconds generation time

## Example Use Flow

```bash
# User runs LLM command
datapilot llm sales.csv

# Internally:
# 1. Runs EDA in summary mode (2s)
# 2. Runs INT in summary mode (1s)  
# 3. Runs VIS in summary mode (1s)
# 4. Runs ENG in summary mode (1s)
# 5. Synthesises findings (0.5s)
# 6. Formats output (0.5s)
# Total: ~6 seconds

# Output: 2-3 pages of connected insights
# User copies to ChatGPT/Claude for discussion
```

## Testing Requirements

1. **Filtering Accuracy**: Most important findings selected
2. **Synthesis Quality**: Connections make sense
3. **Output Size**: Consistently 2-3 pages
4. **LLM Compatibility**: Works with major AI assistants
5. **Performance**: Meets speed targets

## Future Enhancements

- Learn from user feedback on finding importance
- Custom prompts for specific LLMs
- Integration with LLM APIs for direct sending
- Collaborative filtering based on similar datasets

## Conclusion

The LLM command becomes a smart filtering and synthesis layer over all DataPilot analyses. It maintains the current effective format while adding intelligent cross-analysis insights. By running all analyses in summary mode and connecting findings, it provides the perfect context for AI-powered data discussions without overwhelming verbosity.