/**
 * Section 2: Data Quality & Integrity Audit - Main Analyzer
 * Orchestrates all quality dimensions and generates comprehensive report
 */

import type {
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
import type { DataType } from '../../core/types';
import type { Section3Result, CorrelationPair } from '../eda/types';
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
  section3Result?: Section3Result; // Optional for enhanced quality scoring
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
  private section3Result?: Section3Result;

  constructor(input: Section2AnalyzerInput) {
    this.data = input.data;
    this.headers = input.headers;
    this.columnTypes = input.columnTypes;
    this.rowCount = input.rowCount;
    this.columnCount = input.columnCount;
    this.config = this.mergeConfig(input.config);
    this.onProgress = input.onProgress;
    this.section3Result = input.section3Result;
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

      // Additional dimensions (enhanced with statistical insights)
      const timeliness = this.createPlaceholderTimeliness();
      const integrity = this.createEnhancedIntegrity();
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
      businessRuleConfig,
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

    const patternEngine = new PatternValidationEngine(this.data, this.headers, patternConfig);

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

    // Enhanced Consistency Analysis with statistical insights
    const statisticalInsights = this.extractStatisticalInsights();
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
      statisticalConsistency: {
        correlationStability: statisticalInsights.multicollinearity?.severity === 'none' ? 'stable' : 'unstable',
        normalityConsistency: statisticalInsights.normality?.violatedVariables === 0 ? 'consistent' : 'inconsistent',
        outliersImpact: statisticalInsights.outliers?.percentage || 0 < 5 ? 'minimal' : 'significant',
      },
      score: this.calculateEnhancedConsistencyScore(businessRuleResults, patternResults, statisticalInsights),
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
    const criticalViolations =
      businessRuleResults.criticalViolations +
      (patternResults.patternValidations?.filter((p: any) => p.severity === 'critical').length ||
        0);

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
    return this.calculateEnhancedConsistencyScore(businessRuleResults, patternResults, { hasStatisticalTests: false });
  }

  /**
   * Enhanced consistency scoring with statistical insights
   */
  private calculateEnhancedConsistencyScore(businessRuleResults: any, patternResults: any, statisticalInsights: any): any {
    const totalFormatIssues = patternResults.formatConsistency?.length || 0;
    const intraRecordIssues = businessRuleResults.intraRecordConsistency?.length || 0;

    // Base score calculation
    let score = 100;
    const details: string[] = [];

    // Deduct for format inconsistencies
    if (totalFormatIssues > 0) {
      const formatPenalty = totalFormatIssues * 10;
      score -= formatPenalty;
      details.push(`${totalFormatIssues} format inconsistencies (-${formatPenalty})`);
    }

    // Deduct for intra-record consistency issues
    if (intraRecordIssues > 0) {
      const recordPenalty = intraRecordIssues * 15;
      score -= recordPenalty;
      details.push(`${intraRecordIssues} intra-record issues (-${recordPenalty})`);
    }

    // Factor in statistical consistency
    if (statisticalInsights.hasStatisticalTests) {
      // Multicollinearity affects consistency
      if (statisticalInsights.multicollinearity) {
        const severity = statisticalInsights.multicollinearity.severity;
        if (severity === 'severe') {
          score -= 15;
          details.push('Severe multicollinearity affecting variable consistency (-15)');
        } else if (severity === 'moderate') {
          score -= 8;
          details.push('Moderate multicollinearity detected (-8)');
        } else {
          score += 3; // Bonus for good correlation structure
          details.push('Stable correlation structure (+3)');
        }
      }

      // Normality consistency
      if (statisticalInsights.normality) {
        const violatedVars = statisticalInsights.normality.violatedVariables;
        if (violatedVars > 0) {
          const normalityPenalty = Math.min(8, violatedVars * 3);
          score -= normalityPenalty;
          details.push(`${violatedVars} variables violate normality (-${normalityPenalty})`);
        } else {
          score += 2;
          details.push('Variables satisfy normality assumptions (+2)');
        }
      }

      // Outlier impact on consistency
      if (statisticalInsights.outliers) {
        const outlierPercentage = statisticalInsights.outliers.percentage;
        if (outlierPercentage > 10) {
          score -= 12;
          details.push(`High outlier rate (${outlierPercentage.toFixed(1)}%) affects consistency (-12)`);
        } else if (outlierPercentage > 5) {
          score -= 6;
          details.push(`Moderate outlier rate (${outlierPercentage.toFixed(1)}%) (-6)`);
        } else {
          score += 2;
          details.push(`Low outlier rate (${outlierPercentage.toFixed(1)}%) supports consistency (+2)`);
        }
      }
    }

    score = Math.max(0, Math.min(100, Math.round(score)));

    let interpretation: 'Excellent' | 'Good' | 'Fair' | 'Needs Improvement' | 'Poor';
    if (score >= 95) interpretation = 'Excellent';
    else if (score >= 85) interpretation = 'Good';
    else if (score >= 70) interpretation = 'Fair';
    else if (score >= 50) interpretation = 'Needs Improvement';
    else interpretation = 'Poor';

    const detailsText = details.length > 0 ? details.join('; ') : 'No consistency issues detected';

    return {
      score,
      interpretation,
      details: detailsText,
    };
  }

  // Previous placeholder methods removed - now using enhanced implementations

  private createPlaceholderTimeliness() {
    // Enhanced timeliness analysis
    const dateColumns = this.findDateColumns();
    const dataFreshness = this.analyzeDataFreshness(dateColumns);
    const updateFrequency = this.analyzeUpdateFrequency(dateColumns);

    let score = 75; // Default neutral score
    let interpretation: 'Excellent' | 'Good' | 'Fair' | 'Needs Improvement' | 'Poor' = 'Fair';
    let details = 'Timeliness analysis based on available date/timestamp columns';

    if (dateColumns.length === 0) {
      score = 50;
      interpretation = 'Needs Improvement';
      details = 'No date/timestamp columns found for timeliness assessment';
    } else if (dataFreshness.latestTimestamp) {
      const daysSinceUpdate = dataFreshness.daysSinceLatest || 0;

      if (daysSinceUpdate <= 1) {
        score = 95;
        interpretation = 'Excellent';
        details = 'Data is very recent (updated within 24 hours)';
      } else if (daysSinceUpdate <= 7) {
        score = 85;
        interpretation = 'Good';
        details = 'Data is relatively fresh (updated within a week)';
      } else if (daysSinceUpdate <= 30) {
        score = 70;
        interpretation = 'Fair';
        details = 'Data is moderately fresh (updated within a month)';
      } else if (daysSinceUpdate <= 365) {
        score = 60;
        interpretation = 'Needs Improvement';
        details = 'Data may be stale (updated within a year)';
      } else {
        score = 40;
        interpretation = 'Poor';
        details = 'Data appears to be very stale (over a year old)';
      }
    }

    return {
      dataFreshness,
      updateFrequency,
      score: {
        score,
        interpretation,
        details,
      },
    };
  }

  /**
   * Enhanced integrity analysis with statistical test insights
   */
  private createEnhancedIntegrity() {
    const statisticalInsights = this.extractStatisticalInsights();
    
    let baseScore = 85;
    const issues: string[] = [];
    const strengths: string[] = [];
    
    // Factor in statistical test results
    if (statisticalInsights.hasStatisticalTests) {
      // Multicollinearity affects data integrity
      if (statisticalInsights.multicollinearity) {
        const severity = statisticalInsights.multicollinearity.severity;
        if (severity === 'severe') {
          baseScore -= 20;
          issues.push('Severe multicollinearity detected - data relationships may be unstable');
        } else if (severity === 'moderate') {
          baseScore -= 10;
          issues.push('Moderate multicollinearity detected - some variables highly correlated');
        } else {
          strengths.push('No significant multicollinearity detected');
        }
      }
      
      // Outlier analysis affects integrity
      if (statisticalInsights.outliers) {
        const outlierPercentage = statisticalInsights.outliers.percentage;
        if (outlierPercentage > 10) {
          baseScore -= 15;
          issues.push(`High outlier rate (${outlierPercentage.toFixed(1)}%) may indicate data quality issues`);
        } else if (outlierPercentage > 5) {
          baseScore -= 8;
          issues.push(`Moderate outlier rate (${outlierPercentage.toFixed(1)}%) detected`);
        } else {
          strengths.push(`Low outlier rate (${outlierPercentage.toFixed(1)}%) indicates good data integrity`);
        }
      }
      
      // Normality assumption violations
      if (statisticalInsights.normality) {
        const violatedVars = statisticalInsights.normality.violatedVariables;
        if (violatedVars > 0) {
          const penalty = Math.min(10, violatedVars * 2);
          baseScore -= penalty;
          issues.push(`${violatedVars} variables violate normality assumptions`);
        } else {
          strengths.push('Variables satisfy normality assumptions');
        }
      }
      
      // Clustering structure indicates natural data groupings (positive for integrity)
      if (statisticalInsights.clustering?.hasNaturalClusters) {
        baseScore += 5;
        strengths.push(`Natural data clustering structure detected (${statisticalInsights.clustering.optimalClusters} clusters)`);
      }
    }
    
    baseScore = Math.max(0, Math.min(100, Math.round(baseScore)));
    
    let interpretation: 'Excellent' | 'Good' | 'Fair' | 'Needs Improvement' | 'Poor';
    if (baseScore >= 95) interpretation = 'Excellent';
    else if (baseScore >= 85) interpretation = 'Good';
    else if (baseScore >= 70) interpretation = 'Fair';
    else if (baseScore >= 50) interpretation = 'Needs Improvement';
    else interpretation = 'Poor';
    
    const details = issues.length > 0 ? 
      `Statistical analysis reveals: ${issues.join('; ')}` :
      strengths.length > 0 ? 
        `Statistical analysis confirms: ${strengths.join('; ')}` :
        'Enhanced integrity analysis with statistical validation';
    
    return {
      orphanedRecords: [],
      cardinalityViolations: [],
      statisticalValidation: {
        multicollinearityCheck: statisticalInsights.multicollinearity,
        outlierAnalysis: statisticalInsights.outliers,
        normalityAssessment: statisticalInsights.normality,
        clusteringStructure: statisticalInsights.clustering,
      },
      score: {
        score: baseScore,
        interpretation,
        details,
      },
    };
  }

  /**
   * Extract statistical insights from Section 3 results for quality scoring
   */
  private extractStatisticalInsights(): {
    hasStatisticalTests: boolean;
    multicollinearity?: {
      severity: 'none' | 'moderate' | 'severe';
      affectedVariables: string[];
      maxVIF?: number;
    };
    outliers?: {
      count: number;
      percentage: number;
      method: string;
    };
    normality?: {
      violatedVariables: number;
      totalTested: number;
    };
    clustering?: {
      hasNaturalClusters: boolean;
      optimalClusters?: number;
      qualityScore?: number;
    };
  } {
    if (!this.section3Result?.edaAnalysis?.multivariateAnalysis) {
      return { hasStatisticalTests: false };
    }
    
    const multivariateAnalysis = this.section3Result.edaAnalysis.multivariateAnalysis;
    const insights: any = { hasStatisticalTests: true };
    
    try {
      // Extract multicollinearity insights from correlation analysis
      const correlationPairs = this.section3Result.edaAnalysis.bivariateAnalysis?.numericalVsNumerical?.correlationPairs || [];
      if (correlationPairs.length > 0) {
        const highCorrelations = correlationPairs.filter(pair => Math.abs(pair.correlation) > 0.8);
        const veryHighCorrelations = correlationPairs.filter(pair => Math.abs(pair.correlation) > 0.95);
        
        let severity: 'none' | 'moderate' | 'severe' = 'none';
        const affectedVariables: string[] = [];
        
        if (veryHighCorrelations.length > 0) {
          severity = 'severe';
          veryHighCorrelations.forEach(pair => {
            if (!affectedVariables.includes(pair.variable1)) affectedVariables.push(pair.variable1);
            if (!affectedVariables.includes(pair.variable2)) affectedVariables.push(pair.variable2);
          });
        } else if (highCorrelations.length > 0) {
          severity = 'moderate';
          highCorrelations.forEach(pair => {
            if (!affectedVariables.includes(pair.variable1)) affectedVariables.push(pair.variable1);
            if (!affectedVariables.includes(pair.variable2)) affectedVariables.push(pair.variable2);
          });
        }
        
        insights.multicollinearity = {
          severity,
          affectedVariables,
          maxVIF: Math.max(...correlationPairs.map(p => 1 / (1 - p.correlation * p.correlation))),
        };
      }
      
      // Extract outlier insights
      const outlierAnalysis = multivariateAnalysis.outlierDetection;
      if (outlierAnalysis?.isApplicable) {
        insights.outliers = {
          count: outlierAnalysis.totalOutliers,
          percentage: outlierAnalysis.outlierPercentage,
          method: outlierAnalysis.method,
        };
      }
      
      // Extract normality insights
      const normalityTests = multivariateAnalysis.normalityTests;
      if (normalityTests) {
        const violatedCount = normalityTests.overallAssessment.violations.length;
        insights.normality = {
          violatedVariables: violatedCount,
          totalTested: 1, // Simplified - multivariate normality
        };
      }
      
      // Extract clustering insights
      const clusteringAnalysis = multivariateAnalysis.clusteringAnalysis;
      if (clusteringAnalysis?.isApplicable) {
        insights.clustering = {
          hasNaturalClusters: clusteringAnalysis.finalClustering.validation.silhouetteScore > 0.3,
          optimalClusters: clusteringAnalysis.optimalClusters,
          qualityScore: clusteringAnalysis.finalClustering.validation.silhouetteScore,
        };
      }
      
    } catch (error) {
      console.warn('Error extracting statistical insights for quality scoring:', error);
    }
    
    return insights;
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
    // Enhanced precision analysis
    const numericPrecision = this.analyzeNumericPrecision();
    const temporalGranularity = this.analyzeTemporalGranularity();
    const categoricalSpecificity = this.analyzeCategoricalSpecificity();

    // Calculate score based on precision consistency
    let score = 85; // Default good score
    let interpretation: 'Excellent' | 'Good' | 'Fair' | 'Needs Improvement' | 'Poor' = 'Good';
    let details =
      'Precision analysis based on numeric scale, temporal granularity, and categorical specificity';

    // Deduct points for precision inconsistencies
    const precisionIssues =
      numericPrecision.filter((p: any) => p.inconsistentPrecision).length +
      temporalGranularity.filter((t: any) => t.mixedGranularity).length +
      categoricalSpecificity.filter((c: any) => c.lowSpecificity).length;

    if (precisionIssues > 0) {
      score -= precisionIssues * 10; // 10 points per issue

      if (score >= 90) {
        interpretation = 'Excellent';
        details = 'High precision and consistency across data types';
      } else if (score >= 75) {
        interpretation = 'Good';
        details = 'Generally good precision with minor consistency issues';
      } else if (score >= 60) {
        interpretation = 'Fair';
        details = 'Some precision inconsistencies detected that may affect analysis quality';
      } else if (score >= 40) {
        interpretation = 'Needs Improvement';
        details = 'Significant precision issues that should be addressed';
      } else {
        interpretation = 'Poor';
        details = 'Major precision problems affecting data reliability';
      }
    }

    return {
      numericPrecision,
      temporalGranularity,
      categoricalSpecificity,
      score: {
        score: Math.max(0, score),
        interpretation,
        details,
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

  /**
   * Helper methods for enhanced quality dimensions
   */
  private findDateColumns(): Array<{ name: string; index: number }> {
    return this.headers
      .map((header, index) => ({ name: header, index }))
      .filter((col) => /(date|time|created|updated|timestamp|modified)/i.test(col.name));
  }

  private analyzeDataFreshness(dateColumns: Array<{ name: string; index: number }>): any {
    if (dateColumns.length === 0) {
      return {
        latestTimestamp: null,
        oldestTimestamp: null,
        daysSinceLatest: null,
        ageDistribution: 'No date columns available',
      };
    }

    let latestDate: Date | null = null;
    let oldestDate: Date | null = null;
    let validDates = 0;

    // Sample up to 1000 rows to determine data freshness
    const sampleSize = Math.min(1000, this.data.length);

    for (let rowIndex = 0; rowIndex < sampleSize; rowIndex++) {
      const row = this.data[rowIndex];

      for (const dateCol of dateColumns) {
        const dateValue = row[dateCol.index];
        if (!dateValue) continue;

        const parsedDate = this.parseDate(dateValue.toString());
        if (parsedDate && parsedDate.getTime() > 0) {
          validDates++;

          if (!latestDate || parsedDate > latestDate) {
            latestDate = parsedDate;
          }
          if (!oldestDate || parsedDate < oldestDate) {
            oldestDate = parsedDate;
          }
        }
      }
    }

    const now = new Date();
    const daysSinceLatest = latestDate
      ? Math.floor((now.getTime() - latestDate.getTime()) / (24 * 60 * 60 * 1000))
      : null;

    return {
      latestTimestamp: latestDate?.toISOString(),
      oldestTimestamp: oldestDate?.toISOString(),
      daysSinceLatest,
      validDatesFound: validDates,
      ageDistribution:
        latestDate && oldestDate
          ? `Data spans ${Math.floor((latestDate.getTime() - oldestDate.getTime()) / (24 * 60 * 60 * 1000))} days`
          : 'Unable to determine age distribution',
    };
  }

  private analyzeUpdateFrequency(dateColumns: Array<{ name: string; index: number }>): any {
    if (dateColumns.length === 0) {
      return {
        averageUpdateInterval: null,
        updatePattern: 'No date columns available for frequency analysis',
      };
    }

    // Simple implementation - could be enhanced with more sophisticated time series analysis
    return {
      averageUpdateInterval: 'Analysis requires time series data',
      updatePattern: 'Pattern detection not yet implemented',
      notes: 'Update frequency analysis is preliminary - requires event log or versioned data',
    };
  }

  private parseDate(value: string): Date | null {
    if (!value || typeof value !== 'string') return null;

    // Try multiple date formats
    const date = new Date(value);
    if (!isNaN(date.getTime())) return date;

    // Try ISO format
    const isoMatch = value.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
      const [, year, month, day] = isoMatch;
      const parsed = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      if (!isNaN(parsed.getTime())) return parsed;
    }

    return null;
  }

  private analyzeNumericPrecision(): any[] {
    const results: any[] = [];

    for (let colIndex = 0; colIndex < this.headers.length; colIndex++) {
      const columnName = this.headers[colIndex];
      const columnType = this.columnTypes[colIndex];

      // Only analyze numeric columns
      if (columnType !== 'number' && columnType !== 'float' && columnType !== 'integer') continue;

      const decimalPlaces: number[] = [];
      let hasIntegers = false;
      let sampleCount = 0;
      const maxSamples = 500; // Limit sampling for performance

      for (let rowIndex = 0; rowIndex < Math.min(this.data.length, maxSamples); rowIndex++) {
        const value = this.data[rowIndex][colIndex];
        if (!value) continue;

        const numValue = parseFloat(value.toString());
        if (isNaN(numValue)) continue;

        sampleCount++;

        // Count decimal places
        const valueStr = value.toString();
        const decimalIndex = valueStr.indexOf('.');

        if (decimalIndex === -1) {
          hasIntegers = true;
          decimalPlaces.push(0);
        } else {
          const decimals = valueStr.length - decimalIndex - 1;
          decimalPlaces.push(decimals);
        }
      }

      if (sampleCount > 0) {
        const uniqueDecimalPlaces = [...new Set(decimalPlaces)];
        const maxDecimalPlaces = Math.max(...decimalPlaces);
        const inconsistentPrecision = uniqueDecimalPlaces.length > 3; // More than 3 different precisions

        results.push({
          columnName,
          maxDecimalPlaces,
          uniquePrecisions: uniqueDecimalPlaces.length,
          hasIntegers,
          inconsistentPrecision,
          sampleCount,
          details: inconsistentPrecision
            ? `Mixed precision detected: ${uniqueDecimalPlaces.join(', ')} decimal places`
            : `Consistent precision: ${maxDecimalPlaces} decimal places`,
        });
      }
    }

    return results;
  }

  private analyzeTemporalGranularity(): any[] {
    const results: any[] = [];
    const dateColumns = this.findDateColumns();

    for (const dateCol of dateColumns) {
      const granularityLevels = new Set<string>();
      let sampleCount = 0;
      const maxSamples = 300;

      for (let rowIndex = 0; rowIndex < Math.min(this.data.length, maxSamples); rowIndex++) {
        const value = this.data[rowIndex][dateCol.index];
        if (!value) continue;

        const dateStr = value.toString();
        sampleCount++;

        // Detect granularity based on format patterns
        if (/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}/.test(dateStr)) {
          granularityLevels.add('millisecond');
        } else if (/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(dateStr)) {
          granularityLevels.add('second');
        } else if (/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(dateStr)) {
          granularityLevels.add('minute');
        } else if (/\d{4}-\d{2}-\d{2}T\d{2}/.test(dateStr)) {
          granularityLevels.add('hour');
        } else if (/\d{4}-\d{2}-\d{2}/.test(dateStr)) {
          granularityLevels.add('day');
        } else if (/\d{4}-\d{2}/.test(dateStr)) {
          granularityLevels.add('month');
        } else if (/\d{4}/.test(dateStr)) {
          granularityLevels.add('year');
        }
      }

      if (sampleCount > 0) {
        const mixedGranularity = granularityLevels.size > 1;

        results.push({
          columnName: dateCol.name,
          detectedGranularities: Array.from(granularityLevels),
          mixedGranularity,
          sampleCount,
          details: mixedGranularity
            ? `Mixed temporal granularities: ${Array.from(granularityLevels).join(', ')}`
            : `Consistent granularity: ${Array.from(granularityLevels)[0] || 'unknown'}`,
        });
      }
    }

    return results;
  }

  private analyzeCategoricalSpecificity(): any[] {
    const results: any[] = [];

    for (let colIndex = 0; colIndex < this.headers.length; colIndex++) {
      const columnName = this.headers[colIndex];
      const columnType = this.columnTypes[colIndex];

      // Only analyze text/categorical columns
      if (columnType !== 'string') continue;

      const values = new Set<string>();
      const valueLengths: number[] = [];
      let sampleCount = 0;
      const maxSamples = 500;

      for (let rowIndex = 0; rowIndex < Math.min(this.data.length, maxSamples); rowIndex++) {
        const value = this.data[rowIndex][colIndex];
        if (!value) continue;

        const strValue = value.toString().trim();
        if (strValue.length === 0) continue;

        values.add(strValue);
        valueLengths.push(strValue.length);
        sampleCount++;
      }

      if (sampleCount > 0) {
        const uniqueValues = values.size;
        const avgLength = valueLengths.reduce((sum, len) => sum + len, 0) / valueLengths.length;
        const cardinality = uniqueValues / sampleCount;

        // Low specificity indicators
        const lowSpecificity =
          avgLength < 3 || // Very short values
          (cardinality < 0.1 && uniqueValues < 10) || // Low cardinality
          Array.from(values).some((v) => /^(n\/a|na|null|unknown|other|misc)$/i.test(v));

        results.push({
          columnName,
          uniqueValues,
          averageLength: Math.round(avgLength * 10) / 10,
          cardinality: Math.round(cardinality * 1000) / 1000,
          lowSpecificity,
          sampleCount,
          details: lowSpecificity
            ? 'Low specificity detected - consider more detailed categorization'
            : 'Appropriate categorical specificity',
        });
      }
    }

    return results;
  }
}
