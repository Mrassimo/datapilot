/**
 * Algorithm Recommendation Engine for Section 6
 * Provides intelligent algorithm selection based on data characteristics and task requirements
 */
import type { ModelingTask, AlgorithmRecommendation, Section6Config } from './types';
import type { Section1Result } from '../overview/types';
import type { Section3Result } from '../eda/types';
import type { Section5Result } from '../engineering/types';
export declare class AlgorithmRecommender {
    private config;
    constructor(config: Section6Config);
    /**
     * Generate algorithm recommendations for a specific modeling task
     */
    recommendAlgorithms(task: ModelingTask, section1Result: Section1Result, section3Result: Section3Result, section5Result: Section5Result): Promise<AlgorithmRecommendation[]>;
    /**
     * Generate regression algorithm recommendations
     */
    private generateRegressionRecommendations;
    /**
     * Generate classification algorithm recommendations
     */
    private generateClassificationRecommendations;
    /**
     * Generate clustering algorithm recommendations
     */
    private generateClusteringRecommendations;
    /**
     * Generate time series forecasting recommendations
     */
    private generateTimeSeriesRecommendations;
    /**
     * Generate anomaly detection recommendations
     */
    private generateAnomalyDetectionRecommendations;
    private calculateLinearRegressionSuitability;
    private calculateTreeSuitability;
    private calculateEnsembleSuitability;
    private calculateLogisticRegressionSuitability;
    private calculateRegularizedRegressionSuitability;
    private calculateKMeansSuitability;
    private calculateHierarchicalSuitability;
    private getTreeHyperparameters;
    private getRandomForestHyperparameters;
}
//# sourceMappingURL=algorithm-recommender.d.ts.map