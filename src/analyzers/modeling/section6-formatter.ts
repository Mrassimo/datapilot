/**
 * Section 6: Predictive Modeling & Advanced Analytics Guidance Formatter
 * Formats modeling analysis results into comprehensive markdown reports
 */

import type { 
  Section6Result,
  Section6Metadata,
  ModelingAnalysis,
  ModelingTask,
  AlgorithmRecommendation,
  CARTAnalysis,
  ResidualAnalysis,
  ModelingWorkflow,
  EvaluationFramework,
  InterpretationGuidance,
  EthicsAnalysis,
  ImplementationRoadmap,
  Section6Warning
} from './types';

export class Section6Formatter {
  /**
   * Format Section 6 results into comprehensive markdown report
   */
  static formatMarkdown(result: Section6Result): string {
    const { modelingAnalysis, warnings, performanceMetrics, metadata } = result;

    const sections = [
      this.formatHeader(),
      this.formatExecutiveSummary(modelingAnalysis, metadata),
      this.formatIdentifiedTasks(modelingAnalysis.identifiedTasks),
      this.formatAlgorithmRecommendations(modelingAnalysis.algorithmRecommendations),
      ...(modelingAnalysis.cartAnalysis
        ? [this.formatCARTAnalysis(modelingAnalysis.cartAnalysis)]
        : []),
      ...(modelingAnalysis.residualAnalysis
        ? [this.formatResidualAnalysis(modelingAnalysis.residualAnalysis)]
        : []),
      this.formatWorkflowGuidance(modelingAnalysis.workflowGuidance),
      this.formatEvaluationFramework(modelingAnalysis.evaluationFramework),
      this.formatInterpretationGuidance(modelingAnalysis.interpretationGuidance),
      this.formatEthicsAnalysis(modelingAnalysis.ethicsAnalysis),
      this.formatImplementationRoadmap(modelingAnalysis.implementationRoadmap),
      this.formatWarnings(warnings),
      this.formatPerformanceMetrics(performanceMetrics),
    ];

    return sections.filter(Boolean).join('\n\n');
  }

  private static formatHeader(): string {
    return `# Section 6: Predictive Modeling & Advanced Analytics Guidance 🧠⚙️📊

This section leverages insights from Data Quality (Section 2), EDA (Section 3), Visualization (Section 4), and Data Engineering (Section 5) to provide comprehensive guidance on machine learning model selection, implementation, and best practices.

---`;
  }

  private static formatExecutiveSummary(analysis: ModelingAnalysis, metadata: Section6Metadata): string {
    return `## 6.1 Executive Summary

**Analysis Overview:**
- **Approach:** ${metadata.analysisApproach}
- **Complexity Level:** ${this.capitalizeFirst(metadata.complexityLevel)}
- **Primary Focus Areas:** ${metadata.primaryFocus.map(this.capitalizeFirst).join(', ')}
- **Recommendation Confidence:** ${this.capitalizeFirst(metadata.recommendationConfidence)}

**Key Modeling Opportunities:**
- **Tasks Identified:** ${analysis.identifiedTasks.length} potential modeling tasks
- **Algorithm Recommendations:** ${analysis.algorithmRecommendations.length} algorithms evaluated
- **Specialized Analyses:** ${analysis.cartAnalysis ? 'CART methodology' : ''}${analysis.cartAnalysis && analysis.residualAnalysis ? ', ' : ''}${analysis.residualAnalysis ? 'Residual diagnostics' : ''}
- **Ethics Assessment:** Comprehensive bias and fairness analysis completed

**Implementation Readiness:**
- Well-defined modeling workflow with ${analysis.workflowGuidance.workflowSteps?.length || 0} detailed steps
- Evaluation framework established with multiple validation approaches
- Risk mitigation strategies identified for ethical AI deployment`;
  }

  private static formatIdentifiedTasks(tasks: ModelingTask[]): string {
    if (!tasks || tasks.length === 0) {
      return '## 6.2 Modeling Task Analysis\n\nNo suitable modeling tasks identified based on current data characteristics.';
    }

    let output = '## 6.2 Potential Modeling Tasks & Objectives\n\n';

    output += '### 6.2.1 Task Summary\n\n';
    output +=
      '| Task Type | Target Variable | Business Objective | Feasibility Score | Confidence Level |\n';
    output +=
      '|-----------|-----------------|--------------------|--------------------|------------------|\n';

    tasks.forEach((task) => {
      output += `| ${this.formatTaskType(task.taskType)} | ${task.targetVariable || 'N/A'} | ${this.truncateText(task.businessObjective, 50)} | ${task.feasibilityScore}% | ${this.capitalizeFirst(task.confidenceLevel)} |\n`;
    });

    output += '\n### 6.2.2 Detailed Task Analysis\n\n';

    tasks.forEach((task, index) => {
      output += `**${index + 1}. ${this.formatTaskType(task.taskType)}**\n\n`;
      output += `- **Target Variable:** ${task.targetVariable || 'None (unsupervised)'}\n`;
      output += `- **Target Type:** ${this.capitalizeFirst(task.targetType)}\n`;
      output += `- **Input Features:** ${task.inputFeatures.slice(0, 5).join(', ')}${task.inputFeatures.length > 5 ? ` (+${task.inputFeatures.length - 5} more)` : ''}\n`;
      output += `- **Business Objective:** ${task.businessObjective}\n`;
      output += `- **Technical Objective:** ${task.technicalObjective}\n`;
      output += `- **Feasibility Score:** ${task.feasibilityScore}% (${this.interpretFeasibilityScore(task.feasibilityScore)})\n`;
      output += `- **Estimated Complexity:** ${this.capitalizeFirst(task.estimatedComplexity)}\n\n`;

      if (task.justification && task.justification.length > 0) {
        output += `**Justification:**\n`;
        task.justification.forEach((reason: string) => {
          output += `- ${reason}\n`;
        });
        output += '\n';
      }

      if (task.potentialChallenges && task.potentialChallenges.length > 0) {
        output += `**Potential Challenges:**\n`;
        task.potentialChallenges.forEach((challenge: string) => {
          output += `- ${challenge}\n`;
        });
        output += '\n';
      }

      if (task.successMetrics && task.successMetrics.length > 0) {
        output += `**Success Metrics:** ${task.successMetrics.join(', ')}\n\n`;
      }
    });

    return output;
  }

  private static formatAlgorithmRecommendations(algorithms: AlgorithmRecommendation[]): string {
    if (!algorithms || algorithms.length === 0) {
      return '## 6.3 Algorithm Recommendations\n\nNo algorithm recommendations generated.';
    }

    let output = '## 6.3 Algorithm Recommendations & Selection Guidance\n\n';

    output += '### 6.3.1 Recommendation Summary\n\n';
    output +=
      '| Algorithm | Category | Suitability Score | Complexity | Interpretability | Key Strengths |\n';
    output +=
      '|-----------|----------|-------------------|------------|------------------|---------------|\n';

    algorithms.slice(0, 10).forEach((alg) => {
      output += `| ${alg.algorithmName} | ${this.formatCategory(alg.category)} | ${alg.suitabilityScore}% | ${this.capitalizeFirst(alg.complexity)} | ${this.capitalizeFirst(alg.interpretability)} | ${alg.strengths.slice(0, 2).join(', ')} |\n`;
    });

    output += '\n### 6.3.2 Detailed Algorithm Analysis\n\n';

    algorithms.slice(0, 5).forEach((alg, index) => {
      output += `**${index + 1}. ${alg.algorithmName}**\n\n`;
      output += `- **Category:** ${this.formatCategory(alg.category)}\n`;
      output += `- **Suitability Score:** ${alg.suitabilityScore}% (${this.interpretSuitabilityScore(alg.suitabilityScore)})\n`;
      output += `- **Complexity:** ${this.capitalizeFirst(alg.complexity)}\n`;
      output += `- **Interpretability:** ${this.capitalizeFirst(alg.interpretability)}\n\n`;

      if (alg.strengths && alg.strengths.length > 0) {
        output += `**Strengths:**\n`;
        alg.strengths.forEach((strength: string) => {
          output += `- ${strength}\n`;
        });
        output += '\n';
      }

      if (alg.weaknesses && alg.weaknesses.length > 0) {
        output += `**Limitations:**\n`;
        alg.weaknesses.forEach((weakness: string) => {
          output += `- ${weakness}\n`;
        });
        output += '\n';
      }

      if (alg.hyperparameters && alg.hyperparameters.length > 0) {
        output += `**Key Hyperparameters:**\n`;
        alg.hyperparameters.slice(0, 3).forEach((hp) => {
          output += `- **${hp.parameterName}:** ${hp.description} (${hp.importance} importance)\n`;
        });
        output += '\n';
      }

      if (alg.implementationFrameworks && alg.implementationFrameworks.length > 0) {
        output += `**Implementation Frameworks:** ${alg.implementationFrameworks.slice(0, 3).join(', ')}\n\n`;
      }

      if (alg.reasoningNotes && alg.reasoningNotes.length > 0) {
        output += `**Recommendation Reasoning:**\n`;
        alg.reasoningNotes.forEach((note: string) => {
          output += `- ${note}\n`;
        });
        output += '\n';
      }
    });

    return output;
  }

  private static formatCARTAnalysis(cartAnalysis: CARTAnalysis): string {
    let output = '## 6.4 CART (Decision Tree) Methodology Deep Dive\n\n';

    output += '### 6.4.1 CART Methodology Overview\n\n';
    output += `${cartAnalysis.methodology}\n\n`;

    output += '### 6.4.2 Splitting Criterion\n\n';
    output += `**Selected Criterion:** ${this.capitalizeFirst(cartAnalysis.splittingCriterion)}\n\n`;

    output += '### 6.4.3 Stopping Criteria Recommendations\n\n';
    if (cartAnalysis.stoppingCriteria && cartAnalysis.stoppingCriteria.length > 0) {
      cartAnalysis.stoppingCriteria.forEach((criterion) => {
        output += `**${criterion.criterion}**\n`;
        output += `- **Recommended Value:** ${criterion.recommendedValue}\n`;
        output += `- **Reasoning:** ${criterion.reasoning}\n\n`;
      });
    }

    output += '### 6.4.4 Pruning Strategy\n\n';
    if (cartAnalysis.pruningStrategy) {
      output += `**Method:** ${this.capitalizeFirst(cartAnalysis.pruningStrategy.method)}\n`;
      output += `**Cross-Validation Folds:** ${cartAnalysis.pruningStrategy.crossValidationFolds}\n`;
      output += `**Complexity Parameter:** ${cartAnalysis.pruningStrategy.complexityParameter}\n\n`;
      output += `**Reasoning:**\n${cartAnalysis.pruningStrategy.reasoning}\n\n`;
    }

    output += '### 6.4.5 Tree Interpretation Guidance\n\n';
    if (cartAnalysis.treeInterpretation) {
      const interp = cartAnalysis.treeInterpretation;
      output += `**Expected Tree Characteristics:**\n`;
      output += `- **Estimated Depth:** ${interp.treeDepth} levels\n`;
      output += `- **Estimated Leaves:** ${interp.numberOfLeaves} terminal nodes\n\n`;

      if (interp.keyDecisionPaths && interp.keyDecisionPaths.length > 0) {
        output += `**Example Decision Paths:**\n\n`;
        interp.keyDecisionPaths.forEach((path, index: number) => {
          output += `${index + 1}. **${path.pathDescription}**\n`;
          output += `   - **Conditions:** ${path.conditions.join(' AND ')}\n`;
          output += `   - **Prediction:** ${path.prediction}\n`;
          output += `   - **Business Meaning:** ${path.businessMeaning}\n\n`;
        });
      }

      if (interp.businessRules && interp.businessRules.length > 0) {
        output += `**Business Rule Translation:**\n`;
        interp.businessRules.forEach((rule: string) => {
          output += `- ${rule}\n`;
        });
        output += '\n';
      }
    }

    output += '### 6.4.6 Visualization Recommendations\n\n';
    if (
      cartAnalysis.visualizationRecommendations &&
      cartAnalysis.visualizationRecommendations.length > 0
    ) {
      cartAnalysis.visualizationRecommendations.forEach((rec: string, index: number) => {
        output += `${index + 1}. ${rec}\n`;
      });
    }

    return output;
  }

  private static formatResidualAnalysis(residualAnalysis: ResidualAnalysis): string {
    let output = '## 6.5 Regression Residual Analysis Deep Dive\n\n';

    output += '### 6.5.1 Residual Diagnostic Plots\n\n';
    if (residualAnalysis.residualDiagnostics && residualAnalysis.residualDiagnostics.length > 0) {
      residualAnalysis.residualDiagnostics.forEach((diagnostic) => {
        output += `**${this.formatPlotType(diagnostic.plotType)}**\n\n`;
        output += `${diagnostic.interpretation}\n\n`;
        if (diagnostic.actionRequired) {
          output += `⚠️ **Action Required:** ${diagnostic.recommendations.join('; ')}\n\n`;
        }
      });
    }

    output += '### 6.5.2 Statistical Tests for Assumptions\n\n';

    // Normality tests
    if (residualAnalysis.normalityTests && residualAnalysis.normalityTests.length > 0) {
      output += '**Normality Tests:**\n\n';
      residualAnalysis.normalityTests.forEach((test) => {
        output += `**${this.formatTestName(test.testName)}**\n`;
        output += `- **Test Statistic:** ${test.statistic}\n`;
        output += `- **P-value:** ${test.pValue}\n`;
        output += `- **Conclusion:** ${test.conclusion}\n\n`;
      });
    }

    // Heteroscedasticity tests
    if (
      residualAnalysis.heteroscedasticityTests &&
      residualAnalysis.heteroscedasticityTests.length > 0
    ) {
      output += '**Heteroscedasticity Tests:**\n\n';
      residualAnalysis.heteroscedasticityTests.forEach((test: any) => {
        output += `**${this.formatTestName(test.testName)}**\n`;
        output += `- **Test Statistic:** ${test.statistic}\n`;
        output += `- **P-value:** ${test.pValue}\n`;
        output += `- **Conclusion:** ${test.conclusion}\n\n`;
      });
    }

    // Autocorrelation tests
    if (residualAnalysis.autocorrelationTests && residualAnalysis.autocorrelationTests.length > 0) {
      output += '**Autocorrelation Tests:**\n\n';
      residualAnalysis.autocorrelationTests.forEach((test: any) => {
        output += `**${this.formatTestName(test.testName)}**\n`;
        output += `- **Test Statistic:** ${test.statistic}\n`;
        if (test.pValue) output += `- **P-value:** ${test.pValue}\n`;
        output += `- **Conclusion:** ${test.conclusion}\n\n`;
      });
    }

    output += '### 6.5.3 Model Assumptions Assessment\n\n';
    if (residualAnalysis.modelAssumptions && residualAnalysis.modelAssumptions.length > 0) {
      residualAnalysis.modelAssumptions.forEach((assumption: any) => {
        const statusIcon =
          assumption.status === 'satisfied' ? '✅' : assumption.status === 'violated' ? '❌' : '⚠️';
        output += `${statusIcon} **${assumption.assumption}**\n`;
        output += `- **Status:** ${this.capitalizeFirst(assumption.status)}\n`;
        output += `- **Evidence:** ${assumption.evidence}\n`;
        output += `- **Impact:** ${assumption.impact}\n`;
        if (assumption.remediation && assumption.remediation.length > 0) {
          output += `- **Remediation:** ${assumption.remediation.join('; ')}\n`;
        }
        output += '\n';
      });
    }

    output += '### 6.5.4 Improvement Recommendations\n\n';
    if (
      residualAnalysis.improvementSuggestions &&
      residualAnalysis.improvementSuggestions.length > 0
    ) {
      residualAnalysis.improvementSuggestions.forEach((suggestion: string) => {
        output += `- ${suggestion}\n`;
      });
    }

    return output;
  }

  private static formatWorkflowGuidance(workflow: any): string {
    let output = '## 6.6 Modeling Workflow & Best Practices\n\n';

    output += '### 6.6.1 Step-by-Step Implementation Guide\n\n';
    if (workflow.workflowSteps && workflow.workflowSteps.length > 0) {
      workflow.workflowSteps.forEach((step: any) => {
        output += `**Step ${step.stepNumber}: ${step.stepName}**\n\n`;
        output += `${step.description}\n\n`;
        output += `- **Estimated Time:** ${step.estimatedTime}\n`;
        output += `- **Difficulty:** ${this.capitalizeFirst(step.difficulty)}\n`;
        output += `- **Tools:** ${step.tools.join(', ')}\n\n`;

        if (step.considerations && step.considerations.length > 0) {
          output += `**Key Considerations:**\n`;
          step.considerations.forEach((consideration: string) => {
            output += `- ${consideration}\n`;
          });
          output += '\n';
        }

        if (step.commonPitfalls && step.commonPitfalls.length > 0) {
          output += `**Common Pitfalls to Avoid:**\n`;
          step.commonPitfalls.forEach((pitfall: string) => {
            output += `- ${pitfall}\n`;
          });
          output += '\n';
        }
      });
    }

    output += '### 6.6.2 Best Practices Summary\n\n';
    if (workflow.bestPractices && workflow.bestPractices.length > 0) {
      const practicesByCategory = workflow.bestPractices.reduce((groups: any, practice: any) => {
        const category = practice.category;
        if (!groups[category]) groups[category] = [];
        groups[category].push(practice);
        return groups;
      }, {});

      Object.entries(practicesByCategory).forEach(([category, practices]: [string, any]) => {
        output += `**${category}:**\n`;
        practices.forEach((practice: any) => {
          output += `- ${practice.practice}\n`;
          output += `  *Reasoning:* ${practice.reasoning}\n`;
        });
        output += '\n';
      });
    }

    return output;
  }

  private static formatEvaluationFramework(_evaluation: any): string {
    return `## 6.7 Model Evaluation Framework\n\n### 6.7.1 Evaluation Strategy\n\nComprehensive evaluation framework established with multiple validation approaches and business-relevant metrics.\n\n*Detailed evaluation metrics and procedures are integrated into the workflow steps above.*`;
  }

  private static formatInterpretationGuidance(_interpretation: any): string {
    return `## 6.8 Model Interpretation & Explainability\n\n### 6.8.1 Interpretation Strategy\n\nModel interpretation guidance provided with focus on business stakeholder communication and decision transparency.\n\n*Specific interpretation techniques are detailed within algorithm recommendations and specialized analyses.*`;
  }

  private static formatEthicsAnalysis(ethics: any): string {
    let output = '## 6.9 Ethical AI & Bias Analysis\n\n';

    if (ethics.biasAssessment) {
      output += '### 6.9.1 Bias Risk Assessment\n\n';
      output += `**Overall Risk Level:** ${this.capitalizeFirst(ethics.biasAssessment.overallRiskLevel)}\n\n`;

      if (
        ethics.biasAssessment.potentialBiasSources &&
        ethics.biasAssessment.potentialBiasSources.length > 0
      ) {
        output += '**Identified Bias Sources:**\n\n';
        ethics.biasAssessment.potentialBiasSources.forEach((source: any, index: number) => {
          const riskIcon =
            source.riskLevel === 'critical'
              ? '🔴'
              : source.riskLevel === 'high'
                ? '🟠'
                : source.riskLevel === 'medium'
                  ? '🟡'
                  : '🟢';
          output += `${index + 1}. ${riskIcon} **${this.capitalizeFirst(source.sourceType)} Bias** (${this.capitalizeFirst(source.riskLevel)} Risk)\n`;
          output += `   - **Description:** ${source.description}\n`;
          if (source.evidence && source.evidence.length > 0) {
            output += `   - **Evidence:** ${source.evidence.join('; ')}\n`;
          }
          output += '\n';
        });
      }

      if (
        ethics.biasAssessment.sensitiveAttributes &&
        ethics.biasAssessment.sensitiveAttributes.length > 0
      ) {
        output += '**Sensitive Attributes Identified:**\n\n';
        ethics.biasAssessment.sensitiveAttributes.forEach((attr: any) => {
          output += `- **${attr.attributeName}:** ${attr.riskAssessment}\n`;
        });
        output += '\n';
      }
    }

    if (ethics.fairnessMetrics && ethics.fairnessMetrics.length > 0) {
      output += '### 6.9.2 Fairness Metrics\n\n';
      ethics.fairnessMetrics.forEach((metric: any) => {
        output += `**${metric.metricName}**\n`;
        output += `- **Current Value:** ${metric.value}\n`;
        output += `- **Acceptable Range:** ${metric.acceptableRange}\n`;
        output += `- **Interpretation:** ${metric.interpretation}\n\n`;
      });
    }

    if (ethics.ethicalConsiderations && ethics.ethicalConsiderations.length > 0) {
      output += '### 6.9.3 Ethical Considerations\n\n';
      const considerationsByDomain = ethics.ethicalConsiderations.reduce(
        (groups: any, consideration: any) => {
          const domain = consideration.domain;
          if (!groups[domain]) groups[domain] = [];
          groups[domain].push(consideration);
          return groups;
        },
        {},
      );

      Object.entries(considerationsByDomain).forEach(([domain, considerations]: [string, any]) => {
        output += `**${this.capitalizeFirst(domain)}:**\n`;
        considerations.forEach((consideration: any) => {
          const riskIcon =
            consideration.riskLevel === 'high'
              ? '🟠'
              : consideration.riskLevel === 'medium'
                ? '🟡'
                : '🟢';
          output += `${riskIcon} ${consideration.consideration}\n`;
        });
        output += '\n';
      });
    }

    if (ethics.riskMitigation && ethics.riskMitigation.length > 0) {
      output += '### 6.9.4 Risk Mitigation Strategies\n\n';
      ethics.riskMitigation.forEach((mitigation: any, index: number) => {
        output += `**${index + 1}. ${mitigation.riskType}**\n`;
        output += `- **Strategy:** ${mitigation.mitigationStrategy}\n`;
        output += `- **Implementation:** ${mitigation.implementation}\n`;
        output += `- **Effectiveness:** ${mitigation.effectiveness}\n\n`;
      });
    }

    return output;
  }

  private static formatImplementationRoadmap(roadmap: any): string {
    let output = '## 6.10 Implementation Roadmap\n\n';

    output += `**Estimated Timeline:** ${roadmap.estimatedTimeline}\n\n`;

    if (roadmap.phases && roadmap.phases.length > 0) {
      output += '### 6.10.1 Implementation Phases\n\n';
      roadmap.phases.forEach((phase: any) => {
        output += `**Phase ${phase.phaseNumber}: ${phase.phaseName}**\n`;
        output += `- **Duration:** ${phase.duration}\n`;
        if (phase.deliverables && phase.deliverables.length > 0) {
          output += `- **Deliverables:** ${phase.deliverables.join(', ')}\n`;
        }
        output += '\n';
      });
    }

    return output;
  }

  private static formatWarnings(warnings: any[]): string {
    if (!warnings || warnings.length === 0) {
      return '';
    }

    let output = '## ⚠️ Modeling Warnings & Considerations\n\n';

    const groupedWarnings = warnings.reduce((groups: any, warning: any) => {
      const category = warning.category;
      if (!groups[category]) groups[category] = [];
      groups[category].push(warning);
      return groups;
    }, {});

    Object.entries(groupedWarnings).forEach(([category, categoryWarnings]: [string, any]) => {
      output += `### ${this.capitalizeFirst(category)} Warnings\n\n`;

      categoryWarnings.forEach((warning: any) => {
        const icon =
          warning.severity === 'critical'
            ? '🔴'
            : warning.severity === 'high'
              ? '🟠'
              : warning.severity === 'medium'
                ? '🟡'
                : '🔵';
        output += `${icon} **${warning.severity.toUpperCase()}:** ${warning.message}\n`;
        output += `   - **Impact:** ${warning.impact}\n`;
        output += `   - **Suggestion:** ${warning.suggestion}\n\n`;
      });
    });

    return output;
  }

  private static formatPerformanceMetrics(metrics: any): string {
    return `## 📊 Modeling Analysis Performance\n
**Analysis Completed in:** ${metrics.analysisTimeMs.toLocaleString()}ms\n**Tasks Identified:** ${metrics.tasksIdentified}\n**Algorithms Evaluated:** ${metrics.algorithmsEvaluated}\n**Ethics Checks Performed:** ${metrics.ethicsChecksPerformed}\n**Total Recommendations Generated:** ${metrics.recommendationsGenerated}\n\n---`;
  }

  // Helper methods for formatting
  private static capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, ' ');
  }

  private static formatTaskType(taskType: string): string {
    const formatted = taskType.replace(/_/g, ' ');
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  }

  private static formatCategory(category: string): string {
    return this.capitalizeFirst(category);
  }

  private static formatPlotType(plotType: string): string {
    const formatted = plotType.replace(/_/g, ' ');
    return formatted.replace(/\b\w/g, (l) => l.toUpperCase());
  }

  private static formatTestName(testName: string): string {
    const formatted = testName.replace(/_/g, '-');
    return formatted.replace(/\b\w/g, (l) => l.toUpperCase());
  }

  private static truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }

  private static interpretFeasibilityScore(score: number): string {
    if (score >= 85) return 'Highly Feasible';
    if (score >= 70) return 'Feasible';
    if (score >= 55) return 'Moderately Feasible';
    return 'Challenging';
  }

  private static interpretSuitabilityScore(score: number): string {
    if (score >= 90) return 'Excellent Match';
    if (score >= 80) return 'Good Match';
    if (score >= 70) return 'Suitable';
    if (score >= 60) return 'Acceptable';
    return 'Limited Suitability';
  }
}
