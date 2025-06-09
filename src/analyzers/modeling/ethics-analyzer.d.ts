/**
 * Ethics and Bias Analysis Engine for Section 6
 * Identifies potential ethical issues and bias in modeling tasks
 */
import type { ModelingTask, EthicsAnalysis, Section6Config } from './types';
import type { Section1Result } from '../overview/types';
import type { Section2Result } from '../quality/types';
export declare class EthicsAnalyzer {
    private config;
    private checksPerformed;
    constructor(config: Section6Config);
    /**
     * Perform comprehensive ethics analysis
     */
    analyzeEthics(tasks: ModelingTask[], section1Result: Section1Result, section2Result: Section2Result): Promise<EthicsAnalysis>;
    /**
     * Get number of ethics checks performed
     */
    getChecksPerformed(): number;
    /**
     * Identify potentially sensitive attributes in the dataset
     */
    private identifySensitiveAttributes;
    /**
     * Assess potential sources of bias
     */
    private assessBiasSources;
    /**
     * Generate fairness metrics for evaluation
     */
    private generateFairnessMetrics;
    /**
     * Identify ethical considerations
     */
    private identifyEthicalConsiderations;
    /**
     * Generate transparency requirements
     */
    private generateTransparencyRequirements;
    /**
     * Generate governance recommendations
     */
    private generateGovernanceRecommendations;
    /**
     * Develop risk mitigation strategies
     */
    private developRiskMitigation;
    private categorizeSensitiveAttribute;
    private assessAttributeRisk;
    private generateHandlingRecommendation;
    private identifyProxyVariables;
    private categorizeRiskLevel;
    private calculateOverallBiasRisk;
    private generateBiasTests;
    private generateBiasMitigationStrategies;
}
//# sourceMappingURL=ethics-analyzer.d.ts.map