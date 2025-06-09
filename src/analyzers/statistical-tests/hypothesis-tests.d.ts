/**
 * Hypothesis Testing Module
 * Implements proper statistical tests for DataPilot analysis
 *
 * Features:
 * - ANOVA F-test for comparing group means
 * - Kruskal-Wallis test for non-parametric group comparison
 * - Comprehensive result interpretation
 * - Numerical stability and edge case handling
 */
/**
 * Statistical test result interface
 */
export interface StatisticalTestResult {
    testName: string;
    statistic: number;
    pValue: number;
    degreesOfFreedom: number | number[];
    effectSize?: number;
    interpretation: string;
    assumptions: string[];
    recommendations: string[];
}
/**
 * Group data for statistical tests
 */
export interface GroupData {
    name: string;
    count: number;
    mean: number;
    variance: number;
    values?: number[];
}
/**
 * ANOVA (Analysis of Variance) F-test
 * Tests H₀: μ₁ = μ₂ = ... = μₖ (all group means are equal)
 * vs H₁: At least one mean differs
 *
 * Algorithm:
 * 1. Calculate between-group variance (MSB)
 * 2. Calculate within-group variance (MSW)
 * 3. F = MSB/MSW ~ F(k-1, N-k)
 * 4. p-value from F-distribution
 */
export declare function anovaFTest(groups: GroupData[]): StatisticalTestResult;
/**
 * Kruskal-Wallis test (non-parametric alternative to ANOVA)
 * Tests H₀: All groups have the same distribution
 * vs H₁: At least one group has a different distribution
 *
 * Algorithm:
 * 1. Pool all observations and rank them
 * 2. Calculate sum of ranks for each group
 * 3. H = (12/[N(N+1)]) * Σ(Rᵢ²/nᵢ) - 3(N+1)
 * 4. H ~ χ²(k-1) approximately
 */
export declare function kruskalWallisTest(groups: GroupData[]): StatisticalTestResult;
/**
 * Welch's t-test (unequal variances t-test)
 * Tests H₀: μ₁ = μ₂ (means are equal) vs H₁: μ₁ ≠ μ₂ (means differ)
 * Does not assume equal variances (unlike Student's t-test)
 *
 * Algorithm:
 * 1. Calculate t-statistic: t = (x̄₁ - x̄₂) / √(s₁²/n₁ + s₂²/n₂)
 * 2. Calculate Welch-Satterthwaite degrees of freedom
 * 3. p-value from t-distribution
 */
export declare function welchsTTest(group1: GroupData, group2: GroupData): StatisticalTestResult;
/**
 * Mann-Whitney U test (Wilcoxon rank-sum test)
 * Non-parametric alternative to independent samples t-test
 * Tests H₀: P(X > Y) = 0.5 vs H₁: P(X > Y) ≠ 0.5
 */
export declare function mannWhitneyUTest(group1: GroupData, group2: GroupData): StatisticalTestResult;
/**
 * Anderson-Darling normality test
 * Tests H₀: Data follows normal distribution vs H₁: Data does not follow normal distribution
 * More sensitive to deviations in the tails than Kolmogorov-Smirnov
 */
export declare function andersonDarlingTest(values: number[]): StatisticalTestResult;
//# sourceMappingURL=hypothesis-tests.d.ts.map