/**
 * Modeling Workflow Engine for Section 6
 * Generates comprehensive step-by-step modeling guidance and best practices
 */
import type { ModelingTask, AlgorithmRecommendation, ModelingWorkflow, Section6Config } from './types';
import type { Section1Result } from '../overview/types';
import type { Section5Result } from '../engineering/types';
export declare class WorkflowEngine {
    private config;
    constructor(config: Section6Config);
    /**
     * Generate comprehensive modeling workflow
     */
    generateWorkflow(tasks: ModelingTask[], algorithms: AlgorithmRecommendation[], section1Result: Section1Result, section5Result: Section5Result): Promise<ModelingWorkflow>;
    /**
     * Generate detailed workflow steps
     */
    private generateWorkflowSteps;
    /**
     * Generate modeling best practices
     */
    private generateBestPractices;
    /**
     * Generate data splitting strategy
     */
    private generateDataSplittingStrategy;
    /**
     * Generate cross-validation approach
     */
    private generateCrossValidationApproach;
    /**
     * Generate hyperparameter tuning strategy
     */
    private generateHyperparameterTuningStrategy;
    private detectTemporalData;
    private identifyPrimaryTaskType;
    private generateSearchSpaces;
    private selectOptimizationMetric;
    private generateEvaluationFramework;
    private generateInterpretationGuidance;
}
//# sourceMappingURL=workflow-engine.d.ts.map