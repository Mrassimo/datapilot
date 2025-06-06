/**
 * Section 2: Data Quality & Integrity Audit - Main Analyzer
 * Orchestrates all quality dimensions and generates comprehensive report
 */

import {
  Section2QualityAudit,
  DataQualityCockpit,
  DataQualityScore,
  DataQualityStrength,
  DataQualityWeakness,
  TechnicalDebt,
  Section2Config,
  Section2Progress,
  Section2Warning,
  Section2Result,
} from './types';
import { DataType } from '../../core/types';
import { CompletenessAnalyzer } from './completeness-analyzer';
import { UniquenessAnalyzer } from './uniqueness-analyzer';
import { ValidityAnalyzer } from './validity-analyzer';
import { BusinessRuleEngine, type BusinessRuleConfig } from './business-rule-engine';
import { PatternValidationEngine, type PatternValidationConfig } from './pattern-validation-engine';

export interface Section2AnalyzerInput {
  data: (string | null | undefined)[][];
  headers: string[];
  columnTypes: DataType[];
  rowCount: number;
  columnCount: number;
  config?: Section2Config;
  onProgress?: (progress: Section2Progress) => void;
}

export class Section2Analyzer {
  private data: (string | null | undefined)[][];
  private headers: string[];
  private columnTypes: DataType[];
  private rowCount: number;
  private columnCount: number;
  private config: Section2Config;
  private onProgress?: (progress: Section2Progress) => void;
  private warnings: Section2Warning[] = [];
  private startTime: number = 0;

  constructor(input: Section2AnalyzerInput) {
    this.data = input.data;
    this.headers = input.headers;
    this.columnTypes = input.columnTypes;
    this.rowCount = input.rowCount;
    this.columnCount = input.columnCount;
    this.config = this.mergeConfig(input.config);
    this.onProgress = input.onProgress;
  }

  public async analyze(): Promise<Section2Result> {
    this.startTime = performance.now();
    const performanceMetrics: Record<string, number> = {};

    try {
      this.reportProgress('completeness', 0, 'Starting data quality audit');

      // 1. Completeness Analysis
      const completenessStart = performance.now();
      this.reportProgress('completeness', 10, 'Analyzing data completeness');
      const completeness = await this.analyzeCompleteness();
      performanceMetrics.completeness = performance.now() - completenessStart;

      // 2. Uniqueness Analysis
      const uniquenessStart = performance.now();
      this.reportProgress('uniqueness', 25, 'Detecting duplicates and analyzing uniqueness');
      const uniqueness = await this.analyzeUniqueness();
      performanceMetrics.uniqueness = performance.now() - uniquenessStart;

      // 3. Validity Analysis
      const validityStart = performance.now();
      this.reportProgress('validity', 50, 'Validating data types and formats');
      const validity = await this.analyzeValidity();
      performanceMetrics.validity = performance.now() - validityStart;

      // 4. Enhanced Business Rule and Pattern Validation
      const businessRuleStart = performance.now();
      this.reportProgress('accuracy', 60, 'Validating business rules and cross-field consistency');
      const { accuracy, consistency } = await this.analyzeBusinessRulesAndPatterns();
      performanceMetrics.businessRules = performance.now() - businessRuleStart;

      // Additional dimensions (simplified for initial implementation)
      const timeliness = this.createPlaceholderTimeliness();
      const integrity = this.createPlaceholderIntegrity();
      const reasonableness = this.createPlaceholderReasonableness();
      const precision = this.createPlaceholderPrecision();
      const representational = this.createPlaceholderRepresentational();

      // 5. Generate profiling insights
      this.reportProgress('report-generation', 90, 'Generating profiling insights');
      const profilingInsights = this.generateProfilingInsights();

      // 6. Create cockpit with composite scoring
      this.reportProgress('report-generation', 95, 'Creating quality cockpit');
      const cockpit = this.createDataQualityCockpit({
        completeness: completeness.score,
        accuracy: accuracy.score,
        consistency: consistency.score,
        timeliness: timeliness.score,
        uniqueness: uniqueness.score,
        validity: validity.score,
        integrity: integrity.score,
        reasonableness: reasonableness.score,
        precision: precision.score,
        representational: representational.score,
      });

      // 7. Assemble final report
      this.reportProgress('report-generation', 100, 'Finalizing quality audit report');

      const qualityAudit: Section2QualityAudit = {
        cockpit,
        completeness,
        accuracy,
        consistency,
        timeliness,
        uniqueness,
        validity,
        integrity,
        reasonableness,
        precision,
        representational,
        profilingInsights,
        generatedAt: new Date(),
        version: '1.0.0',
      };

      const totalAnalysisTime = performance.now() - this.startTime;
      performanceMetrics.total = totalAnalysisTime;

      return {
        qualityAudit,
        warnings: this.warnings,
        performanceMetrics: {
          totalAnalysisTime,
          phases: performanceMetrics,
        },
      };
    } catch (error) {
      this.warnings.push({
        category: 'computation',
        severity: 'high',
        message: `Quality analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        impact: 'Quality audit incomplete',
      });
      throw error;
    }
  }

  private async analyzeCompleteness() {
    const analyzer = new CompletenessAnalyzer({
      data: this.data,
      headers: this.headers,
      columnTypes: this.columnTypes,
      rowCount: this.rowCount,
      columnCount: this.columnCount,
    });

    return analyzer.analyze();
  }

  private async analyzeUniqueness() {
    const analyzer = new UniquenessAnalyzer({
      data: this.data,
      headers: this.headers,
      columnTypes: this.columnTypes,
      rowCount: this.rowCount,
      columnCount: this.columnCount,
    });

    return analyzer.analyze();
  }

  private async analyzeValidity() {
    const analyzer = new ValidityAnalyzer({
      data: this.data,
      headers: this.headers,
      columnTypes: this.columnTypes,
      rowCount: this.rowCount,
      columnCount: this.columnCount,
      businessRules: this.config.customBusinessRules,
      customPatterns: this.config.externalReferences?.customPatterns,
      customRanges: this.config.externalReferences?.customRanges,
    });

    return analyzer.analyze();
  }

  /**
   * Enhanced business rule and pattern validation analysis
   */
  private async analyzeBusinessRulesAndPatterns(): Promise<{
    accuracy: any;
    consistency: any;
  }> {
    // Business Rule Validation
    const businessRuleConfig: BusinessRuleConfig = {
      enabledRuleTypes: ['cross_field', 'intra_record', 'business_logic'],
      enableBuiltInRules: true,
      maxViolationsToTrack: 1000,
      customRules: this.config.customBusinessRules,
    };

    const businessRuleEngine = new BusinessRuleEngine(
      this.data,
      this.headers,
      this.columnTypes,
      businessRuleConfig
    );

    const businessRuleResults = businessRuleEngine.validateData();
    const businessRuleSummary = businessRuleEngine.getViolationSummary();

    // Pattern Validation
    const patternConfig: PatternValidationConfig = {
      enableBuiltInPatterns: true,
      enableFormatStandardization: true,
      maxViolationsPerPattern: 100,
      customPatterns: this.config.customPatterns,
    };

    const patternEngine = new PatternValidationEngine(
      this.data,
      this.headers,
      patternConfig
    );

    const patternResults = patternEngine.validatePatterns();
    const patternSummary = patternEngine.getPatternSummary();

    // Enhanced Accuracy Analysis
    const accuracy = {
      valueConformity: [], // TODO: Add external reference validation
      crossFieldValidation: businessRuleResults.crossFieldValidations,
      outlierImpact: {
        percentageErrornousOutliers: 0, // TODO: Link with Section 3 outlier analysis
        description: 'Outlier impact analysis to be integrated with Section 3 results',
      },
      patternValidation: patternResults.patternValidations,
      businessRuleSummary: {
        totalRules: businessRuleSummary.totalRulesEvaluated,
        totalViolations: businessRuleSummary.totalViolations,
        criticalViolations: businessRuleResults.criticalViolations,
        violationsBySeverity: businessRuleSummary.violationsBySeverity,
      },
      score: this.calculateAccuracyScore(businessRuleResults, patternResults),
    };

    // Enhanced Consistency Analysis
    const consistency = {
      intraRecord: businessRuleResults.intraRecordConsistency,
      interRecord: [], // TODO: Implement entity resolution
      formatConsistency: patternResults.formatConsistency,
      patternSummary: {
        totalPatterns: patternSummary.totalPatternsEvaluated,
        totalViolations: patternSummary.totalViolations,
        violationsBySeverity: patternSummary.violationsBySeverity,
        problematicColumns: patternSummary.mostProblematicColumns,
      },
      score: this.calculateConsistencyScore(businessRuleResults, patternResults),
    };

    // Add warnings for high violation counts
    if (businessRuleResults.criticalViolations > 0) {
      this.warnings.push({
        category: 'business_rules',
        severity: 'high',
        message: `${businessRuleResults.criticalViolations} critical business rule violations detected`,
        impact: 'Data may not meet business requirements',
      });
    }

    if (patternSummary.violationsBySeverity.critical > 0) {
      this.warnings.push({
        category: 'pattern_validation',
        severity: 'high',
        message: `${patternSummary.violationsBySeverity.critical} critical pattern validation failures`,
        impact: 'Data format issues may affect downstream processing',
      });
    }

    return { accuracy, consistency };
  }

  private calculateAccuracyScore(businessRuleResults: any, patternResults: any): any {
    const totalRows = this.rowCount;
    const totalViolations = businessRuleResults.totalViolations + patternResults.totalViolations;
    const criticalViolations = businessRuleResults.criticalViolations + 
      (patternResults.patternValidations?.filter((p: any) => p.severity === 'critical').length || 0);

    // Calculate base score (0-100)
    let score = 100;
    
    // Deduct for violations (more severe = higher deduction)
    const violationRate = totalViolations / totalRows;
    score -= violationRate * 50; // Up to 50 points for violation rate
    
    // Extra deduction for critical violations
    const criticalRate = criticalViolations / totalRows;
    score -= criticalRate * 30; // Up to 30 additional points for critical violations

    score = Math.max(0, Math.round(score));

    let interpretation: 'Excellent' | 'Good' | 'Fair' | 'Needs Improvement' | 'Poor';
    if (score >= 95) interpretation = 'Excellent';
    else if (score >= 85) interpretation = 'Good';
    else if (score >= 70) interpretation = 'Fair';
    else if (score >= 50) interpretation = 'Needs Improvement';
    else interpretation = 'Poor';

    return {
      score,
      interpretation,
      details: `${totalViolations} total rule violations, ${criticalViolations} critical`,
    };
  }

  private calculateConsistencyScore(businessRuleResults: any, patternResults: any): any {
    const totalFormatIssues = patternResults.formatConsistency?.length || 0;
    const intraRecordIssues = businessRuleResults.intraRecordConsistency?.length || 0;

    // Base score calculation
    let score = 100;
    
    // Deduct for format inconsistencies
    score -= totalFormatIssues * 10; // 10 points per format inconsistency type
    
    // Deduct for intra-record consistency issues
    score -= intraRecordIssues * 15; // 15 points per intra-record rule violation type

    score = Math.max(0, Math.round(score));

    let interpretation: 'Excellent' | 'Good' | 'Fair' | 'Needs Improvement' | 'Poor';
    if (score >= 95) interpretation = 'Excellent';
    else if (score >= 85) interpretation = 'Good';
    else if (score >= 70) interpretation = 'Fair';
    else if (score >= 50) interpretation = 'Needs Improvement';
    else interpretation = 'Poor';

    return {
      score,
      interpretation,
      details: `${totalFormatIssues} format inconsistencies, ${intraRecordIssues} intra-record issues`,
    };
  }

  // Previous placeholder methods removed - now using enhanced implementations

  private createPlaceholderTimeliness() {
    return {
      dataFreshness: {},
      score: {
        score: 75,
        interpretation: 'Fair' as const,
        details: 'Timeliness analysis not yet implemented',
      },
    };
  }

  private createPlaceholderIntegrity() {
    return {
      orphanedRecords: [],
      cardinalityViolations: [],
      score: {
        score: 85,
        interpretation: 'Good' as const,
        details: 'Integrity analysis not yet implemented',
      },
    };
  }

  private createPlaceholderReasonableness() {
    return {
      statisticalPlausibility: [],
      semanticPlausibility: [],
      contextualAnomalies: [],
      score: {
        score: 80,
        interpretation: 'Good' as const,
        details: 'Reasonableness analysis not yet implemented',
      },
    };
  }

  private createPlaceholderPrecision() {
    return {
      numericPrecision: [],
      temporalGranularity: [],
      categoricalSpecificity: [],
      score: {
        score: 85,
        interpretation: 'Good' as const,
        details: 'Precision analysis not yet implemented',
      },
    };
  }

  private createPlaceholderRepresentational() {
    return {
      unitStandardization: [],
      codeStandardization: [],
      textFormatting: [],
      score: {
        score: 80,
        interpretation: 'Good' as const,
        details: 'Representational analysis not yet implemented',
      },
    };
  }

  private generateProfilingInsights() {
    return {
      valueLengthAnalysis: [],
      characterSetAnalysis: [],
      specialCharacterAnalysis: [],
    };
  }

  private createDataQualityCockpit(scores: {
    completeness: DataQualityScore;
    accuracy: DataQualityScore;
    consistency: DataQualityScore;
    timeliness: DataQualityScore;
    uniqueness: DataQualityScore;
    validity: DataQualityScore;
    integrity: DataQualityScore;
    reasonableness: DataQualityScore;
    precision: DataQualityScore;
    representational: DataQualityScore;
  }): DataQualityCockpit {
    // Calculate composite score with configurable weights
    const weights = {
      completeness: 0.2,
      uniqueness: 0.15,
      validity: 0.2,
      consistency: 0.15,
      accuracy: 0.15,
      timeliness: 0.05,
      integrity: 0.05,
      reasonableness: 0.03,
      precision: 0.01,
      representational: 0.01,
    };

    let compositeScore = 0;
    for (const [dimension, score] of Object.entries(scores)) {
      const weight = weights[dimension as keyof typeof weights] || 0;
      compositeScore += score.score * weight;
    }

    const compositeQualityScore: DataQualityScore = {
      score: Math.round(compositeScore * 100) / 100,
      interpretation: this.interpretScore(compositeScore),
      details: `Weighted average of ${Object.keys(scores).length} quality dimensions`,
    };

    // Identify strengths and weaknesses
    const strengths = this.identifyStrengths(scores);
    const weaknesses = this.identifyWeaknesses(scores);

    // Estimate technical debt
    const technicalDebt = this.estimateTechnicalDebt(scores, weaknesses);

    return {
      compositeScore: compositeQualityScore,
      dimensionScores: scores,
      topStrengths: strengths,
      topWeaknesses: weaknesses,
      technicalDebt,
    };
  }

  private interpretScore(
    score: number,
  ): 'Excellent' | 'Good' | 'Fair' | 'Needs Improvement' | 'Poor' {
    if (score >= 95) return 'Excellent';
    if (score >= 85) return 'Good';
    if (score >= 70) return 'Fair';
    if (score >= 50) return 'Needs Improvement';
    return 'Poor';
  }

  private identifyStrengths(
    dimensionScores: Record<string, DataQualityScore>,
  ): DataQualityStrength[] {
    const strengths: DataQualityStrength[] = [];

    for (const [dimension, score] of Object.entries(dimensionScores)) {
      if (score.score >= 90) {
        strengths.push({
          description: `Excellent ${dimension} with ${score.score}% score`,
          category: dimension,
          impact: score.score >= 95 ? 'high' : 'medium',
        });
      }
    }

    return strengths.slice(0, 3); // Top 3 strengths
  }

  private identifyWeaknesses(
    dimensionScores: Record<string, DataQualityScore>,
  ): DataQualityWeakness[] {
    const weaknesses: DataQualityWeakness[] = [];

    const sortedDimensions = Object.entries(dimensionScores).sort(
      ([, a], [, b]) => a.score - b.score,
    );

    for (const [dimension, score] of sortedDimensions.slice(0, 3)) {
      let severity: 'critical' | 'high' | 'medium' | 'low';
      let priority: number;

      if (score.score < 50) {
        severity = 'critical';
        priority = 10;
      } else if (score.score < 70) {
        severity = 'high';
        priority = 8;
      } else if (score.score < 85) {
        severity = 'medium';
        priority = 6;
      } else {
        severity = 'low';
        priority = 4;
      }

      weaknesses.push({
        description: `${dimension} quality needs attention (${score.score}% score)`,
        category: dimension,
        severity,
        priority,
        estimatedEffort: this.estimateEffortForDimension(dimension, score.score),
      });
    }

    return weaknesses;
  }

  private estimateEffortForDimension(_dimension: string, score: number): string {
    const effort = 100 - score; // Inverse relationship

    if (effort > 50) return '8-16 hours';
    if (effort > 30) return '4-8 hours';
    if (effort > 15) return '2-4 hours';
    return '1-2 hours';
  }

  private estimateTechnicalDebt(
    dimensionScores: Record<string, DataQualityScore>,
    weaknesses: DataQualityWeakness[],
  ): TechnicalDebt {
    const totalEffortHours = weaknesses.reduce((sum, weakness) => {
      const effort = weakness.estimatedEffort || '2-4 hours';
      const hours = this.parseEffortHours(effort);
      return sum + hours;
    }, 0);

    let complexityLevel: 'Low' | 'Medium' | 'High';
    if (totalEffortHours > 20) complexityLevel = 'High';
    else if (totalEffortHours > 8) complexityLevel = 'Medium';
    else complexityLevel = 'Low';

    const automatedFixableIssues = this.countAutomatedFixableIssues(dimensionScores);

    return {
      timeEstimate: `${Math.round(totalEffortHours)} hours estimated cleanup`,
      complexityLevel,
      primaryDebtContributors: weaknesses.map((w) => w.description),
      automatedCleaningPotential: {
        fixableIssues: automatedFixableIssues,
        examples: [
          'Trimming leading/trailing spaces',
          'Standardizing text casing',
          'Date format normalization',
        ],
      },
    };
  }

  private parseEffortHours(effort: string): number {
    const match = effort.match(/(\d+)-(\d+)/);
    if (match) {
      return (parseInt(match[1]) + parseInt(match[2])) / 2;
    }
    return 4; // Default
  }

  private countAutomatedFixableIssues(dimensionScores: Record<string, DataQualityScore>): number {
    // Simplified heuristic for counting automatically fixable issues
    let count = 0;

    // Validity issues are often automatically fixable
    if (dimensionScores.validity && dimensionScores.validity.score < 90) {
      count += Math.round((90 - dimensionScores.validity.score) / 10);
    }

    // Consistency issues are often automatically fixable
    if (dimensionScores.consistency && dimensionScores.consistency.score < 90) {
      count += Math.round((90 - dimensionScores.consistency.score) / 15);
    }

    return count;
  }

  private reportProgress(phase: Section2Progress['phase'], progress: number, operation: string) {
    if (this.onProgress) {
      const elapsed = performance.now() - this.startTime;
      this.onProgress({
        phase,
        progress,
        currentOperation: operation,
        timeElapsed: elapsed,
        estimatedTimeRemaining: progress > 0 ? (elapsed / progress) * (100 - progress) : undefined,
      });
    }
  }

  private mergeConfig(userConfig?: Partial<Section2Config>): Section2Config {
    const defaultConfig: Section2Config = {
      enabledDimensions: ['completeness', 'accuracy', 'consistency', 'uniqueness', 'validity'],
      strictMode: false,
      maxOutlierDetection: 1000,
      semanticDuplicateThreshold: 0.8,
      customBusinessRules: [],
      externalReferences: {},
    };

    return { ...defaultConfig, ...userConfig };
  }
}
