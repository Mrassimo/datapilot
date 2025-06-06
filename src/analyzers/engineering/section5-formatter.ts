/**
 * Section 5: Data Engineering & Structural Insights Formatter
 * Formats engineering analysis results into comprehensive markdown reports
 */

import type { Section5Result } from './types';

export class Section5Formatter {
  /**
   * Format Section 5 results into comprehensive markdown report
   */
  static formatMarkdown(result: Section5Result): string {
    const { engineeringAnalysis, warnings, performanceMetrics, metadata } = result;

    const sections = [
      this.formatHeader(),
      this.formatExecutiveSummary(engineeringAnalysis, metadata),
      this.formatSchemaAnalysis(engineeringAnalysis.schemaAnalysis),
      this.formatStructuralIntegrity(engineeringAnalysis.structuralIntegrity),
      this.formatTransformationPipeline(engineeringAnalysis.transformationPipeline),
      this.formatScalabilityAssessment(engineeringAnalysis.scalabilityAssessment),
      this.formatDataGovernance(engineeringAnalysis.dataGovernance),
      this.formatMLReadiness(engineeringAnalysis.mlReadiness),
      this.formatKnowledgeBase(engineeringAnalysis.knowledgeBaseOutput),
      this.formatWarnings(warnings),
      this.formatPerformanceMetrics(performanceMetrics),
    ];

    return sections.filter(Boolean).join('\n\n');
  }

  private static formatHeader(): string {
    return `# Section 5: Data Engineering & Structural Insights 🏛️🛠️

This section evaluates the dataset from a data engineering perspective, focusing on schema optimization, transformation pipelines, scalability considerations, and machine learning readiness.

---`;
  }

  private static formatExecutiveSummary(_analysis: any, metadata: any): string {
    return `## 5.1 Executive Summary

**Analysis Overview:**
- **Approach:** ${metadata.analysisApproach}
- **Source Dataset Size:** ${metadata.sourceDatasetSize.toLocaleString()} rows
- **Engineered Features:** ${metadata.engineeredFeatureCount} features designed
- **ML Readiness Score:** ${metadata.mlReadinessScore}% 

**Key Engineering Insights:**
- Schema optimization recommendations generated for improved performance
- Comprehensive transformation pipeline designed for ML preparation
- Data integrity analysis completed with structural recommendations
- Scalability pathway identified for future growth`;
  }

  private static formatSchemaAnalysis(schemaAnalysis: any): string {
    const sections = [
      '## 5.2 Schema Analysis & Optimization',
      '',
      '### 5.2.1 Current Schema Profile',
      this.formatCurrentSchema(schemaAnalysis.currentSchema),
      '',
      '### 5.2.2 Optimized Schema Recommendations',
      this.formatOptimizedSchema(schemaAnalysis.optimizedSchema),
      '',
      '### 5.2.3 Data Type Conversions',
      this.formatDataTypeConversions(schemaAnalysis.dataTypeConversions),
      '',
      '### 5.2.4 Character Encoding & Collation',
      this.formatEncodingRecommendations(schemaAnalysis.characterEncodingRecommendations),
    ];

    if (schemaAnalysis.normalizationInsights.redundancyDetected.length > 0) {
      sections.push('', '### 5.2.5 Normalization Insights', this.formatNormalizationInsights(schemaAnalysis.normalizationInsights));
    }

    return sections.join('\n');
  }

  private static formatCurrentSchema(currentSchema: any): string {
    if (!currentSchema.columns || currentSchema.columns.length === 0) {
      return 'No current schema information available.';
    }

    const headers = ['Column Name', 'Detected Type', 'Semantic Type', 'Nullability (%)', 'Uniqueness (%)', 'Sample Values'];
    const rows = currentSchema.columns.map((col: any) => [
      col.originalName,
      col.detectedType,
      col.inferredSemanticType,
      `${col.nullabilityPercentage.toFixed(1)}%`,
      `${col.uniquenessPercentage.toFixed(1)}%`,
      col.sampleValues.slice(0, 2).join(', ') || 'N/A',
    ]);

    return this.formatTable(headers, rows) + 
      `\n\n**Dataset Metrics:**
- **Estimated Rows:** ${currentSchema.estimatedRowCount.toLocaleString()}
- **Estimated Size:** ${(currentSchema.estimatedSizeBytes / (1024 * 1024)).toFixed(1)} MB
- **Detected Encoding:** ${currentSchema.detectedEncoding}`;
  }

  private static formatOptimizedSchema(optimizedSchema: any): string {
    let output = `**Target System:** ${optimizedSchema.targetSystem}\n\n`;

    if (optimizedSchema.columns && optimizedSchema.columns.length > 0) {
      output += '**Optimized Column Definitions:**\n\n';
      const headers = ['Original Name', 'Optimized Name', 'Recommended Type', 'Constraints', 'Reasoning'];
      const rows = optimizedSchema.columns.map((col: any) => [
        col.originalName,
        col.optimizedName,
        col.recommendedType,
        col.constraints.join(', ') || 'None',
        col.reasoning,
      ]);
      output += this.formatTable(headers, rows);
    }

    if (optimizedSchema.ddlStatement) {
      output += '\n\n**Generated DDL Statement:**\n\n```sql\n' + optimizedSchema.ddlStatement + '\n```';
    }

    if (optimizedSchema.indexes && optimizedSchema.indexes.length > 0) {
      output += '\n\n**Recommended Indexes:**\n\n';
      optimizedSchema.indexes.forEach((index: any, i: number) => {
        output += `${i + 1}. **${index.indexType.toUpperCase()} INDEX** on \`${index.columns.join(', ')}\`\n`;
        output += `   - **Purpose:** ${index.purpose}\n`;
        output += `   - **Expected Impact:** ${index.expectedImpact}\n\n`;
      });
    }

    return output;
  }

  private static formatDataTypeConversions(conversions: any[]): string {
    if (!conversions || conversions.length === 0) {
      return 'No data type conversions required.';
    }

    let output = 'The following data type conversions are recommended:\n\n';
    
    conversions.forEach((conversion, i) => {
      output += `**${i + 1}. ${conversion.columnName}** (${conversion.currentType} → ${conversion.recommendedType})\n`;
      output += `- **Conversion Logic:** \`${conversion.conversionLogic}\`\n`;
      output += `- **Reasoning:** ${conversion.reasoning}\n`;
      output += `- **Risk Level:** ${conversion.riskLevel.toUpperCase()}\n`;
      output += `- **Example:** ${conversion.exampleTransformation}\n\n`;
    });

    return output;
  }

  private static formatEncodingRecommendations(encoding: any): string {
    return `**Current Encoding:** ${encoding.detectedEncoding}
**Recommended Encoding:** ${encoding.recommendedEncoding}
**Collation Recommendation:** ${encoding.collationRecommendation}

${encoding.characterSetIssues.length > 0 ? 
  `**Character Set Issues Detected:**\n${encoding.characterSetIssues.map((issue: string) => `- ${issue}`).join('\n')}` : 
  '**No character set issues detected.**'}`;
  }

  private static formatNormalizationInsights(insights: any): string {
    let output = '';

    if (insights.redundancyDetected.length > 0) {
      output += '**Redundancy Detected:**\n\n';
      insights.redundancyDetected.forEach((redundancy: any, i: number) => {
        output += `${i + 1}. **${redundancy.redundancyType}**\n`;
        output += `   - **Affected Columns:** ${redundancy.affectedColumns.join(', ')}\n`;
        output += `   - **Description:** ${redundancy.description}\n`;
        output += `   - **Recommended Action:** ${redundancy.recommendedAction}\n\n`;
      });
    }

    if (insights.normalizationOpportunities.length > 0) {
      output += '**Normalization Opportunities:**\n\n';
      insights.normalizationOpportunities.forEach((opportunity: any, i: number) => {
        output += `${i + 1}. **${opportunity.opportunity}** (${opportunity.normalizedForm})\n`;
        output += `   - **Affected Columns:** ${opportunity.affectedColumns.join(', ')}\n`;
        output += `   - **Benefits:** ${opportunity.benefits.join(', ')}\n\n`;
      });
    }

    return output || 'No normalization insights available.';
  }

  private static formatStructuralIntegrity(integrity: any): string {
    const sections = [
      '## 5.3 Structural Integrity Analysis',
      '',
      '### 5.3.1 Primary Key Candidates',
      this.formatPrimaryKeyCandidates(integrity.primaryKeyCandidates),
      '',
      '### 5.3.2 Foreign Key Relationships',
      this.formatForeignKeyRelationships(integrity.foreignKeyRelationships),
      '',
      '### 5.3.3 Data Integrity Score',
      this.formatDataIntegrityScore(integrity.dataIntegrityScore),
    ];

    if (integrity.orphanedRecords && integrity.orphanedRecords.length > 0) {
      sections.push('', '### 5.3.4 Orphaned Records Analysis', this.formatOrphanedRecords(integrity.orphanedRecords));
    }

    return sections.join('\n');
  }

  private static formatPrimaryKeyCandidates(candidates: any[]): string {
    if (!candidates || candidates.length === 0) {
      return 'No strong primary key candidates identified.';
    }

    let output = '**Primary Key Candidate Analysis:**\n\n';
    const headers = ['Column Name', 'Uniqueness', 'Completeness', 'Stability', 'Confidence', 'Reasoning'];
    const rows = candidates.map((candidate: any) => [
      candidate.columnName,
      `${candidate.uniqueness.toFixed(1)}%`,
      `${candidate.completeness.toFixed(1)}%`,
      `${candidate.stability.toFixed(1)}%`,
      candidate.confidence.toUpperCase(),
      candidate.reasoning,
    ]);

    output += this.formatTable(headers, rows);

    // Highlight top candidate
    if (candidates.length > 0) {
      const topCandidate = candidates[0];
      output += `\n\n**Recommended Primary Key:** \`${topCandidate.columnName}\` (${topCandidate.confidence} confidence)`;
    }

    return output;
  }

  private static formatForeignKeyRelationships(relationships: any[]): string {
    if (!relationships || relationships.length === 0) {
      return 'No foreign key relationships inferred.';
    }

    let output = '**Inferred Foreign Key Relationships:**\n\n';
    
    relationships.forEach((rel, i) => {
      output += `**${i + 1}. ${rel.columnName}**\n`;
      output += `- **References:** ${rel.referencedTable}.${rel.referencedColumn}\n`;
      output += `- **Cardinality:** ${rel.cardinality}\n`;
      output += `- **Confidence:** ${rel.confidence.toUpperCase()}\n`;
      output += `- **Integrity Violations:** ${rel.integrityViolations}\n`;
      output += `- **Action:** ${rel.actionRecommendation}\n\n`;
    });

    return output;
  }

  private static formatDataIntegrityScore(score: any): string {
    return `**Overall Data Integrity Score:** ${score.score}/100 (${score.interpretation})

**Contributing Factors:**
${score.factors.map((factor: any) => 
  `- **${factor.factor}** (${factor.impact}, weight: ${factor.weight}): ${factor.description}`
).join('\n')}`;
  }

  private static formatOrphanedRecords(orphanedRecords: any[]): string {
    let output = '**Orphaned Records Detected:**\n\n';
    
    orphanedRecords.forEach((record, i) => {
      output += `**${i + 1}. ${record.relationshipDescription}**\n`;
      output += `- **Orphaned Count:** ${record.orphanedCount} (${record.orphanedPercentage.toFixed(1)}%)\n`;
      output += `- **Impact:** ${record.impactAssessment}\n`;
      output += `- **Resolution:** ${record.resolutionStrategy}\n\n`;
    });

    return output;
  }

  private static formatTransformationPipeline(pipeline: any): string {
    const sections = [
      '## 5.4 Data Transformation Pipeline',
      '',
      '### 5.4.1 Column Standardization',
      this.formatColumnStandardization(pipeline.columnStandardization),
      '',
      '### 5.4.2 Missing Value Strategy',
      this.formatMissingValueStrategy(pipeline.missingValueStrategy),
      '',
      '### 5.4.3 Outlier Treatment',
      this.formatOutlierTreatment(pipeline.outlierTreatment),
      '',
      '### 5.4.4 Categorical Encoding',
      this.formatCategoricalEncoding(pipeline.categoricalEncoding),
    ];

    if (pipeline.numericalTransformations.length > 0) {
      sections.push('', '### 5.4.5 Numerical Transformations', this.formatNumericalTransformations(pipeline.numericalTransformations));
    }

    if (pipeline.dateTimeFeatureEngineering.length > 0) {
      sections.push('', '### 5.4.6 DateTime Feature Engineering', this.formatDateTimeEngineering(pipeline.dateTimeFeatureEngineering));
    }

    if (pipeline.textProcessingPipeline.length > 0) {
      sections.push('', '### 5.4.7 Text Processing Pipeline', this.formatTextProcessing(pipeline.textProcessingPipeline));
    }

    return sections.join('\n');
  }

  private static formatColumnStandardization(standardization: any[]): string {
    if (!standardization || standardization.length === 0) {
      return 'No column standardization needed.';
    }

    const headers = ['Original Name', 'Standardized Name', 'Convention', 'Reasoning'];
    const rows = standardization.map((std: any) => [
      std.originalName,
      std.standardizedName,
      std.namingConvention,
      std.reasoning,
    ]);

    return this.formatTable(headers, rows);
  }

  private static formatMissingValueStrategy(strategies: any[]): string {
    if (!strategies || strategies.length === 0) {
      return 'No missing value handling required.';
    }

    let output = '**Missing Value Handling Strategies:**\n\n';
    
    strategies.forEach((strategy, i) => {
      output += `**${i + 1}. ${strategy.columnName}** (${strategy.strategy.toUpperCase()})\n`;
      output += `- **Parameters:** ${JSON.stringify(strategy.parameters)}\n`;
      output += `- **Flag Column:** \`${strategy.flagColumn}\`\n`;
      output += `- **Reasoning:** ${strategy.reasoning}\n`;
      output += `- **Impact:** ${strategy.impact}\n\n`;
    });

    return output;
  }

  private static formatOutlierTreatment(treatments: any[]): string {
    if (!treatments || treatments.length === 0) {
      return 'No outlier treatment required.';
    }

    let output = '**Outlier Treatment Strategies:**\n\n';
    
    treatments.forEach((treatment, i) => {
      output += `**${i + 1}. ${treatment.columnName}** (${treatment.treatmentMethod.toUpperCase()})\n`;
      output += `- **Detection Method:** ${treatment.detectionMethod}\n`;
      output += `- **Parameters:** ${JSON.stringify(treatment.parameters)}\n`;
      output += `- **Flag Column:** \`${treatment.flagColumn}\`\n`;
      output += `- **Reasoning:** ${treatment.reasoning}\n`;
      output += `- **Expected Impact:** ${treatment.expectedImpact}\n\n`;
    });

    return output;
  }

  private static formatCategoricalEncoding(encodings: any[]): string {
    if (!encodings || encodings.length === 0) {
      return 'No categorical encoding required.';
    }

    let output = '**Categorical Encoding Strategies:**\n\n';
    
    encodings.forEach((encoding, i) => {
      output += `**${i + 1}. ${encoding.columnName}** (${encoding.encodingMethod.toUpperCase()})\n`;
      output += `- **Parameters:** ${JSON.stringify(encoding.parameters)}\n`;
      output += `- **Resulting Columns:** ${encoding.resultingColumns.join(', ')}\n`;
      output += `- **Reasoning:** ${encoding.reasoning}\n`;
      if (encoding.considerations.length > 0) {
        output += `- **Considerations:** ${encoding.considerations.join(', ')}\n`;
      }
      output += '\n';
    });

    return output;
  }

  private static formatNumericalTransformations(transformations: any[]): string {
    let output = '**Numerical Transformation Strategies:**\n\n';
    
    transformations.forEach((transform, i) => {
      output += `**${i + 1}. ${transform.columnName}**\n`;
      output += `- **Transformations:**\n`;
      transform.transformations.forEach((t: any) => {
        output += `  - ${t.transformation}: ${t.purpose} → \`${t.resultingColumnName}\`\n`;
      });
      output += `- **Reasoning:** ${transform.reasoning}\n`;
      output += `- **ML Considerations:** ${transform.mlConsiderations.join(', ')}\n\n`;
    });

    return output;
  }

  private static formatDateTimeEngineering(engineering: any[]): string {
    let output = '**DateTime Feature Engineering Strategies:**\n\n';
    
    engineering.forEach((eng, i) => {
      output += `**${i + 1}. ${eng.columnName}**\n`;
      output += `- **Extracted Features:**\n`;
      eng.extractedFeatures.forEach((feature: any) => {
        output += `  - ${feature.featureName}: ${feature.purpose}\n`;
      });
      if (eng.calculatedFeatures.length > 0) {
        output += `- **Calculated Features:**\n`;
        eng.calculatedFeatures.forEach((feature: any) => {
          output += `  - ${feature.featureName}: ${feature.purpose}\n`;
        });
      }
      output += `- **Reasoning:** ${eng.reasoning}\n\n`;
    });

    return output;
  }

  private static formatTextProcessing(processing: any[]): string {
    let output = '**Text Processing Pipeline:**\n\n';
    
    processing.forEach((proc, i) => {
      output += `**${i + 1}. ${proc.columnName}**\n`;
      output += `- **Cleaning Steps:**\n`;
      proc.cleaningSteps.forEach((step: any) => {
        output += `  - ${step.step}: ${step.description}\n`;
      });
      output += `- **Vectorization:** ${proc.vectorizationMethod.toUpperCase()}\n`;
      output += `- **Resulting Features:** ${proc.resultingFeatureCount}\n`;
      if (proc.considerations.length > 0) {
        output += `- **Considerations:** ${proc.considerations.join(', ')}\n`;
      }
      output += '\n';
    });

    return output;
  }

  private static formatScalabilityAssessment(scalability: any): string {
    return `## 5.5 Scalability Assessment

### 5.5.1 Current Metrics
- **Disk Size:** ${scalability.currentMetrics.diskSizeMB} MB
- **In-Memory Size:** ${scalability.currentMetrics.inMemorySizeMB} MB  
- **Row Count:** ${scalability.currentMetrics.rowCount.toLocaleString()}
- **Column Count:** ${scalability.currentMetrics.columnCount}
- **Estimated Growth Rate:** ${scalability.currentMetrics.estimatedGrowthRate}%/year

### 5.5.2 Scalability Analysis
**Current Capability:** ${scalability.scalabilityAnalysis.currentCapability}

${this.formatTechnologyRecommendations(scalability.scalabilityAnalysis.technologyRecommendations)}

${this.formatPerformanceOptimizations(scalability.performanceOptimizations)}`;
  }

  private static formatTechnologyRecommendations(recommendations: any[]): string {
    if (!recommendations || recommendations.length === 0) {
      return '';
    }

    let output = '**Technology Recommendations:**\n\n';
    
    recommendations.forEach((rec, i) => {
      output += `**${i + 1}. ${rec.technology}** (${rec.implementationComplexity} complexity)\n`;
      output += `- **Use Case:** ${rec.useCase}\n`;
      output += `- **Benefits:** ${rec.benefits.join(', ')}\n`;
      output += `- **Considerations:** ${rec.considerations.join(', ')}\n\n`;
    });

    return output;
  }

  private static formatPerformanceOptimizations(optimizations: any[]): string {
    if (!optimizations || optimizations.length === 0) {
      return '';
    }

    let output = '**Performance Optimization Recommendations:**\n\n';
    
    optimizations.forEach((opt, i) => {
      output += `**${i + 1}. ${opt.area}** (${opt.implementationEffort} effort)\n`;
      output += `- **Current Issue:** ${opt.currentIssue}\n`;
      output += `- **Recommendation:** ${opt.recommendation}\n`;
      output += `- **Expected Improvement:** ${opt.expectedImprovement}\n\n`;
    });

    return output;
  }

  private static formatDataGovernance(governance: any): string {
    return `## 5.6 Data Governance Considerations

### 5.6.1 Data Sensitivity Classification
${this.formatSensitivityClassification(governance.sensitivityClassification)}

### 5.6.2 Data Freshness Analysis
${this.formatDataFreshnessAnalysis(governance.dataFreshnessAnalysis)}

### 5.6.3 Compliance Considerations
${this.formatComplianceConsiderations(governance.complianceConsiderations)}`;
  }

  private static formatSensitivityClassification(classifications: any[]): string {
    if (!classifications || classifications.length === 0) {
      return 'No sensitive data classifications identified.';
    }

    const headers = ['Column', 'Sensitivity Level', 'Category', 'Protection Recommendations'];
    const rows = classifications.map((cls: any) => [
      cls.columnName,
      cls.sensitivityLevel.toUpperCase(),
      cls.dataCategory,
      cls.protectionRecommendations.join(', '),
    ]);

    return this.formatTable(headers, rows);
  }

  private static formatDataFreshnessAnalysis(freshness: any): string {
    return `**Freshness Score:** ${freshness.freshnessScore}/100
**Last Update Detected:** ${freshness.lastUpdateDetected || 'Unknown'}
**Update Frequency Estimate:** ${freshness.updateFrequencyEstimate}

**Implications:**
${freshness.implications.map((imp: string) => `- ${imp}`).join('\n')}

**Recommendations:**
${freshness.recommendations.map((rec: string) => `- ${rec}`).join('\n')}`;
  }

  private static formatComplianceConsiderations(considerations: any[]): string {
    if (!considerations || considerations.length === 0) {
      return 'No specific compliance regulations identified.';
    }

    let output = '';
    considerations.forEach((cons, i) => {
      output += `**${i + 1}. ${cons.regulation}**\n`;
      output += `- **Applicable Columns:** ${cons.applicableColumns.join(', ')}\n`;
      output += `- **Requirements:** ${cons.requirements.join(', ')}\n`;
      output += `- **Recommendations:** ${cons.recommendations.join(', ')}\n\n`;
    });

    return output;
  }

  private static formatMLReadiness(mlReadiness: any): string {
    return `## 5.7 Machine Learning Readiness Assessment

### 5.7.1 Overall ML Readiness Score: ${mlReadiness.overallScore}/100

### 5.7.2 Enhancing Factors
${this.formatMLEnhancingFactors(mlReadiness.enhancingFactors)}

### 5.7.3 Remaining Challenges
${this.formatMLChallenges(mlReadiness.remainingChallenges)}

### 5.7.4 Feature Preparation Matrix
${this.formatFeaturePreparationMatrix(mlReadiness.featurePreparationMatrix)}

### 5.7.5 Modeling Considerations
${this.formatModelingConsiderations(mlReadiness.modelingConsiderations)}`;
  }

  private static formatMLEnhancingFactors(factors: any[]): string {
    if (!factors || factors.length === 0) {
      return 'No specific enhancing factors identified.';
    }

    let output = '';
    factors.forEach((factor, i) => {
      output += `**${i + 1}. ${factor.factor}** (${factor.impact.toUpperCase()} impact)\n`;
      output += `   ${factor.description}\n\n`;
    });

    return output;
  }

  private static formatMLChallenges(challenges: any[]): string {
    if (!challenges || challenges.length === 0) {
      return 'No major ML challenges identified.';
    }

    let output = '';
    challenges.forEach((challenge, i) => {
      output += `**${i + 1}. ${challenge.challenge}** (${challenge.severity.toUpperCase()} severity)\n`;
      output += `- **Impact:** ${challenge.impact}\n`;
      output += `- **Mitigation:** ${challenge.mitigationStrategy}\n`;
      output += `- **Estimated Effort:** ${challenge.estimatedEffort}\n\n`;
    });

    return output;
  }

  private static formatFeaturePreparationMatrix(matrix: any[]): string {
    if (!matrix || matrix.length === 0) {
      return 'No feature preparation matrix available.';
    }

    const headers = ['ML Feature Name', 'Original Column', 'Final Type', 'Key Issues', 'Engineering Steps', 'ML Feature Type'];
    const rows = matrix.slice(0, 20).map((entry: any) => [  // Limit to first 20 for readability
      entry.featureName,
      entry.originalColumn,
      entry.finalDataType,
      entry.keyIssues.join(', ') || 'None',
      entry.engineeringSteps.join(', ') || 'None',
      entry.finalMLFeatureType,
    ]);

    let output = this.formatTable(headers, rows);
    
    if (matrix.length > 20) {
      output += `\n\n*Note: Showing first 20 features. Total features: ${matrix.length}*`;
    }

    return output;
  }

  private static formatModelingConsiderations(considerations: any[]): string {
    if (!considerations || considerations.length === 0) {
      return 'No specific modeling considerations identified.';
    }

    let output = '';
    considerations.forEach((cons, i) => {
      output += `**${i + 1}. ${cons.aspect}**\n`;
      output += `- **Consideration:** ${cons.consideration}\n`;
      output += `- **Impact:** ${cons.impact}\n`;
      output += `- **Recommendations:** ${cons.recommendations.join(', ')}\n\n`;
    });

    return output;
  }

  private static formatKnowledgeBase(knowledgeBase: any): string {
    return `## 5.8 Knowledge Base Output

### 5.8.1 Dataset Profile Summary
${this.formatDatasetProfile(knowledgeBase.datasetProfile)}

### 5.8.2 Schema Recommendations Summary
${this.formatSchemaRecommendationsSummary(knowledgeBase.schemaRecommendations)}

### 5.8.3 Key Transformations Summary
${this.formatKeyTransformationsSummary(knowledgeBase.keyTransformations)}`;
  }

  private static formatDatasetProfile(profile: any): string {
    return `**Dataset:** ${profile.fileName}
**Analysis Date:** ${new Date(profile.analysisDate).toLocaleDateString()}
**Total Rows:** ${profile.totalRows.toLocaleString()}
**Original Columns:** ${profile.totalColumnsOriginal}
**Engineered ML Features:** ${profile.totalColumnsEngineeredForML}
**Technical Debt:** ${profile.estimatedTechnicalDebtHours} hours
**ML Readiness Score:** ${profile.mlReadinessScore}/100`;
  }

  private static formatSchemaRecommendationsSummary(recommendations: any[]): string {
    if (!recommendations || recommendations.length === 0) {
      return 'No schema recommendations available.';
    }

    const headers = ['Original Column', 'Target Column', 'Recommended Type', 'Constraints', 'Key Transformations'];
    const rows = recommendations.slice(0, 15).map((rec: any) => [
      rec.columnNameOriginal,
      rec.columnNameTarget,
      rec.recommendedType,
      rec.constraints.join(', ') || 'None',
      rec.transformations.join(', ') || 'None',
    ]);

    let output = this.formatTable(headers, rows);
    
    if (recommendations.length > 15) {
      output += `\n\n*Note: Showing first 15 recommendations. Total: ${recommendations.length}*`;
    }

    return output;
  }

  private static formatKeyTransformationsSummary(transformations: any[]): string {
    if (!transformations || transformations.length === 0) {
      return 'No key transformations identified.';
    }

    let output = '';
    transformations.forEach((transform, i) => {
      output += `**${i + 1}. ${transform.featureGroup}**\n`;
      output += `- **Steps:** ${transform.steps.join(', ')}\n`;
      output += `- **Impact:** ${transform.impact}\n\n`;
    });

    return output;
  }

  private static formatWarnings(warnings: any[]): string {
    if (!warnings || warnings.length === 0) {
      return '';
    }

    let output = '## ⚠️ Engineering Warnings\n\n';
    
    const groupedWarnings = warnings.reduce((groups: any, warning: any) => {
      const category = warning.category;
      if (!groups[category]) groups[category] = [];
      groups[category].push(warning);
      return groups;
    }, {});

    Object.entries(groupedWarnings).forEach(([category, categoryWarnings]: [string, any]) => {
      output += `### ${category.charAt(0).toUpperCase() + category.slice(1)} Warnings\n\n`;
      
      categoryWarnings.forEach((warning: any) => {
        const icon = warning.severity === 'critical' ? '🔴' : warning.severity === 'high' ? '🟠' : warning.severity === 'medium' ? '🟡' : '🔵';
        output += `${icon} **${warning.severity.toUpperCase()}:** ${warning.message}\n`;
        output += `   - **Impact:** ${warning.impact}\n`;
        output += `   - **Suggestion:** ${warning.suggestion}\n\n`;
      });
    });

    return output;
  }

  private static formatPerformanceMetrics(metrics: any): string {
    return `## 📊 Engineering Analysis Performance

**Analysis Completed in:** ${metrics.analysisTimeMs.toLocaleString()}ms
**Transformations Evaluated:** ${metrics.transformationsEvaluated}
**Schema Recommendations Generated:** ${metrics.schemaRecommendationsGenerated}
**ML Features Designed:** ${metrics.mlFeaturesDesigned}

---`;
  }

  private static formatTable(headers: string[], rows: string[][]): string {
    if (!headers.length || !rows.length) return '';

    const maxWidths = headers.map((header, i) => 
      Math.max(header.length, ...rows.map(row => (row[i] || '').toString().length))
    );

    const headerRow = '| ' + headers.map((header, i) => 
      header.padEnd(maxWidths[i])
    ).join(' | ') + ' |';

    const separatorRow = '| ' + maxWidths.map(width => 
      '-'.repeat(width)
    ).join(' | ') + ' |';

    const dataRows = rows.map(row => 
      '| ' + row.map((cell, i) => 
        (cell || '').toString().padEnd(maxWidths[i])
      ).join(' | ') + ' |'
    );

    return [headerRow, separatorRow, ...dataRows].join('\n');
  }
}