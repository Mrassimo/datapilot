/**
 * CART (Classification and Regression Trees) Specialized Analyzer
 * Provides detailed analysis of decision tree methodology and interpretation
 */
import type { ModelingTask, AlgorithmRecommendation, CARTAnalysis } from './types';
export declare class CARTAnalyzer {
    /**
     * Generate comprehensive CART analysis
     */
    generateCARTAnalysis(tasks: ModelingTask[], treeAlgorithms: AlgorithmRecommendation[]): Promise<CARTAnalysis>;
    /**
     * Generate methodology description for CART
     */
    private generateMethodologyDescription;
    private getRegressionMathematicalFoundation;
    private getClassificationMathematicalFoundation;
    /**
     * Determine optimal splitting criterion
     */
    private determineSplittingCriterion;
    /**
     * Generate stopping criteria recommendations
     */
    private generateStoppingCriteria;
    /**
     * Generate pruning strategy
     */
    private generatePruningStrategy;
    /**
     * Generate tree interpretation guidance
     */
    private generateTreeInterpretation;
    /**
     * Generate example decision paths
     */
    private generateExampleDecisionPaths;
    /**
     * Generate business rules from tree structure
     */
    private generateBusinessRules;
    /**
     * Generate visualization guidance
     */
    private generateVisualizationGuidance;
    /**
     * Generate feature importance guidance
     */
    private generateFeatureImportanceGuidance;
    /**
     * Generate visualization recommendations
     */
    private generateVisualizationRecommendations;
    private estimateSampleSize;
    private recommendMaxDepth;
    private estimateTreeDepth;
}
//# sourceMappingURL=cart-analyzer.d.ts.map