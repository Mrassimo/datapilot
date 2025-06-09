/**
 * Residual Analysis Engine for Regression Models
 * Provides comprehensive residual diagnostics and assumption validation
 */
import type { ModelingTask, AlgorithmRecommendation, ResidualAnalysis } from './types';
import type { CorrelationPair } from '../eda/types';
export declare class ResidualAnalyzer {
    /**
     * Generate comprehensive residual analysis for regression models
     */
    generateResidualAnalysis(regressionTasks: ModelingTask[], algorithms: AlgorithmRecommendation[], correlationPairs?: CorrelationPair[]): Promise<ResidualAnalysis>;
    /**
     * Generate residual diagnostic plots and interpretations
     */
    private generateResidualDiagnostics;
    /**
     * Generate normality tests for residuals
     */
    private generateNormalityTests;
    /**
     * Generate heteroscedasticity tests
     */
    private generateHeteroscedasticityTests;
    /**
     * Generate autocorrelation tests
     */
    private generateAutocorrelationTests;
    /**
     * Generate outlier analysis
     */
    private generateOutlierAnalysis;
    /**
     * Generate model assumptions assessment
     */
    private generateModelAssumptions;
    /**
     * Calculate Variance Inflation Factors (VIF) from correlation data
     */
    private calculateVIF;
    /**
     * Generate improvement suggestions
     */
    private generateImprovementSuggestions;
    private generateCurrentAssessment;
}
//# sourceMappingURL=residual-analyzer.d.ts.map