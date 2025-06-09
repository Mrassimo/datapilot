/**
 * Section 6: Predictive Modeling & Advanced Analytics Guidance Analyzer
 * Core engine for identifying modeling tasks and generating comprehensive guidance
 */
import type { Section1Result } from '../overview/types';
import type { Section2Result } from '../quality/types';
import type { Section3Result } from '../eda/types';
import type { Section5Result } from '../engineering/types';
import type { Section6Result, Section6Config, Section6Progress } from './types';
export declare class Section6Analyzer {
    private config;
    private warnings;
    private startTime;
    private algorithmRecommender;
    private workflowEngine;
    private ethicsAnalyzer;
    private cartAnalyzer;
    private residualAnalyzer;
    constructor(config?: Partial<Section6Config>);
    /**
     * Main analysis method for Section 6
     */
    analyze(section1Result: Section1Result, section2Result: Section2Result, section3Result: Section3Result, section5Result: Section5Result, progressCallback?: (progress: Section6Progress) => void): Promise<Section6Result>;
    /**
     * Identify potential modeling tasks based on data characteristics
     */
    private identifyModelingTasks;
    /**
     * Create regression modeling task
     */
    private createRegressionTask;
    /**
     * Create binary classification task
     */
    private createBinaryClassificationTask;
    /**
     * Create clustering task for unsupervised learning
     */
    private createClusteringTask;
    /**
     * Generate algorithm recommendations for identified tasks
     */
    private generateAlgorithmRecommendations;
    /**
     * Generate specialized analyses (CART and Residual Analysis)
     */
    private generateSpecializedAnalyses;
    private identifyNumericalColumns;
    private identifyCategoricalColumns;
    private identifyTemporalColumns;
    private isPotentialTarget;
    private isPotentialCategoricalTarget;
    private getUniqueValueCount;
    private hasAnomalyPotential;
    private generateDataRequirements;
    private calculateFeasibilityScore;
    private assessConfidenceLevel;
    private estimateComplexity;
    private identifyRegressionChallenges;
    private identifyClassificationChallenges;
    private identifyClusteringChallenges;
    private createTimeSeriesForecastingTask;
    private createMulticlassClassificationTask;
    private createAnomalyDetectionTask;
    private generateWorkflowGuidance;
    private generateEvaluationFramework;
    private generateInterpretationGuidance;
    private performEthicsAnalysis;
    private generateImplementationRoadmap;
    private calculateTotalRecommendations;
    private calculateOverallConfidence;
    private collectLimitations;
    private reportProgress;
    private estimateTimeRemaining;
}
//# sourceMappingURL=section6-analyzer.d.ts.map