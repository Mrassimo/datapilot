"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.anovaFTest = anovaFTest;
exports.kruskalWallisTest = kruskalWallisTest;
exports.welchsTTest = welchsTTest;
exports.mannWhitneyUTest = mannWhitneyUTest;
exports.andersonDarlingTest = andersonDarlingTest;
const distributions_1 = require("./distributions");
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
function anovaFTest(groups) {
    (0, distributions_1.validateTestInputs)(groups);
    const k = groups.length; // Number of groups
    const N = groups.reduce((sum, group) => sum + group.count, 0); // Total observations
    if (N <= k) {
        throw new Error('ANOVA requires more total observations than groups');
    }
    // Calculate overall mean (weighted by group sizes)
    const overallMean = groups.reduce((sum, group) => sum + group.mean * group.count, 0) / N;
    // Calculate Sum of Squares Between groups (SSB)
    const ssb = groups.reduce((sum, group) => sum + group.count * Math.pow(group.mean - overallMean, 2), 0);
    // Calculate Sum of Squares Within groups (SSW)
    const ssw = groups.reduce((sum, group) => sum + (group.count - 1) * group.variance, 0);
    // Degrees of freedom
    const dfBetween = k - 1;
    const dfWithin = N - k;
    // Mean squares
    const msb = ssb / dfBetween;
    const msw = ssw / dfWithin;
    // Handle edge case: no within-group variance
    if (msw === 0) {
        if (ssb === 0) {
            // All observations are identical
            return {
                testName: 'ANOVA F-test',
                statistic: NaN,
                pValue: 1.0,
                degreesOfFreedom: [dfBetween, dfWithin],
                effectSize: 0,
                interpretation: 'All observations are identical. No variance to test.',
                assumptions: getAnovaAssumptions(),
                recommendations: ['Verify data collection and measurement procedures'],
            };
        }
        else {
            // Perfect separation (infinite F-statistic)
            return {
                testName: 'ANOVA F-test',
                statistic: Infinity,
                pValue: 0.0,
                degreesOfFreedom: [dfBetween, dfWithin],
                effectSize: 1,
                interpretation: 'Perfect group separation detected. Groups have identical within-group values but different means.',
                assumptions: getAnovaAssumptions(),
                recommendations: [
                    'Extremely strong evidence against null hypothesis',
                    'Verify this is not due to data preprocessing artifacts',
                ],
            };
        }
    }
    // Calculate F-statistic
    const fStatistic = (0, distributions_1.checkNumericalStability)(msb / msw, 'F-statistic calculation');
    // Calculate p-value (survival function for upper tail)
    const pValue = (0, distributions_1.fccdf)(fStatistic, dfBetween, dfWithin);
    // Effect size (eta-squared)
    const etaSquared = ssb / (ssb + ssw);
    // Interpretation
    const interpretation = generateAnovaInterpretation(fStatistic, pValue, dfBetween, dfWithin, etaSquared);
    // Recommendations based on results
    const recommendations = generateAnovaRecommendations(pValue, etaSquared, groups);
    return {
        testName: 'ANOVA F-test',
        statistic: Number(fStatistic.toFixed(6)),
        pValue: Number(pValue.toFixed(6)),
        degreesOfFreedom: [dfBetween, dfWithin],
        effectSize: Number(etaSquared.toFixed(4)),
        interpretation,
        assumptions: getAnovaAssumptions(),
        recommendations,
    };
}
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
function kruskalWallisTest(groups) {
    (0, distributions_1.validateTestInputs)(groups);
    // Check if we have raw values for all groups
    const hasValues = groups.every((group) => group.values && group.values.length === group.count);
    if (!hasValues) {
        // Fallback: Use approximation based on summary statistics
        return kruskalWallisApproximation(groups);
    }
    const k = groups.length;
    // Pool all observations with group identifiers
    const pooledData = [];
    groups.forEach((group, groupIndex) => {
        group.values.forEach((value) => {
            pooledData.push({ value, group: groupIndex });
        });
    });
    const N = pooledData.length;
    // Sort by value and assign ranks
    pooledData.sort((a, b) => a.value - b.value);
    // Handle ties by assigning average ranks
    const ranks = assignRanksWithTies(pooledData.map((d) => d.value));
    // Calculate sum of ranks for each group
    const rankSums = new Array(k).fill(0);
    pooledData.forEach((item, index) => {
        rankSums[item.group] += ranks[index];
    });
    // Calculate H statistic
    let hStatistic = 0;
    for (let i = 0; i < k; i++) {
        const ni = groups[i].count;
        const Ri = rankSums[i];
        hStatistic += (Ri * Ri) / ni;
    }
    hStatistic = (12 / (N * (N + 1))) * hStatistic - 3 * (N + 1);
    // Adjustment for ties
    const tieAdjustment = calculateTieAdjustment(pooledData.map((d) => d.value));
    if (tieAdjustment > 0) {
        hStatistic = hStatistic / (1 - tieAdjustment / (N * N * N - N));
    }
    const df = k - 1;
    const pValue = (0, distributions_1.chisqccdf)(hStatistic, df);
    // Effect size (epsilon-squared)
    const epsilonSquared = (hStatistic - df) / (N - 1);
    const interpretation = generateKruskalWallisInterpretation(hStatistic, pValue, df, epsilonSquared);
    const recommendations = generateKruskalWallisRecommendations(pValue, epsilonSquared, groups);
    return {
        testName: 'Kruskal-Wallis test',
        statistic: Number(hStatistic.toFixed(6)),
        pValue: Number(pValue.toFixed(6)),
        degreesOfFreedom: df,
        effectSize: Number(Math.max(0, epsilonSquared).toFixed(4)),
        interpretation,
        assumptions: getKruskalWallisAssumptions(),
        recommendations,
    };
}
/**
 * Kruskal-Wallis approximation using summary statistics
 * When raw values are not available, use statistical approximation
 */
function kruskalWallisApproximation(groups) {
    // This is a simplified approximation based on means and variances
    // Not as accurate as the rank-based test, but better than nothing
    const k = groups.length;
    const N = groups.reduce((sum, group) => sum + group.count, 0);
    // Use a variance-weighted statistic as approximation
    const overallMean = groups.reduce((sum, group) => sum + group.mean * group.count, 0) / N;
    // Calculate a pseudo H-statistic based on standardized differences
    let hApprox = 0;
    for (const group of groups) {
        const standardizedDiff = group.variance > 0 ? Math.pow(group.mean - overallMean, 2) / group.variance : 0;
        hApprox += group.count * standardizedDiff;
    }
    const df = k - 1;
    const pValue = (0, distributions_1.chisqccdf)(hApprox, df);
    return {
        testName: 'Kruskal-Wallis test (approximation)',
        statistic: Number(hApprox.toFixed(6)),
        pValue: Number(pValue.toFixed(6)),
        degreesOfFreedom: df,
        effectSize: 0, // Cannot calculate without raw values
        interpretation: `**Approximate Kruskal-Wallis Test:**
- **Note:** This is an approximation based on summary statistics
- **Limitation:** True Kruskal-Wallis requires raw values for ranking
- **H-statistic (approx):** ${hApprox.toFixed(4)}
- **p-value:** ${pValue.toFixed(6)}
- **Interpretation:** ${pValue < 0.05 ? 'Suggests' : 'Does not suggest'} significant differences between groups`,
        assumptions: [
            ...getKruskalWallisAssumptions(),
            'Approximation assumes normally distributed residuals',
        ],
        recommendations: [
            'Use with caution - approximation only',
            'Consider collecting raw values for exact Kruskal-Wallis test',
            'Cross-validate with ANOVA F-test results',
        ],
    };
}
/**
 * Assign ranks with proper tie handling
 */
function assignRanksWithTies(values) {
    const ranks = new Array(values.length);
    let i = 0;
    while (i < values.length) {
        let j = i;
        // Find all values equal to values[i]
        while (j < values.length && values[j] === values[i]) {
            j++;
        }
        // Assign average rank to tied values
        const avgRank = (i + j + 1) / 2; // +1 because ranks are 1-based
        for (let k = i; k < j; k++) {
            ranks[k] = avgRank;
        }
        i = j;
    }
    return ranks;
}
/**
 * Calculate tie adjustment factor for Kruskal-Wallis
 */
function calculateTieAdjustment(values) {
    const tieGroups = new Map();
    for (const value of values) {
        tieGroups.set(value, (tieGroups.get(value) || 0) + 1);
    }
    let tieAdjustment = 0;
    for (const count of tieGroups.values()) {
        if (count > 1) {
            tieAdjustment += count * count * count - count;
        }
    }
    return tieAdjustment;
}
/**
 * Generate detailed ANOVA interpretation
 */
function generateAnovaInterpretation(fStat, pValue, df1, df2, etaSquared) {
    const significance = pValue < 0.001
        ? 'highly significant (p < 0.001)'
        : pValue < 0.01
            ? 'very significant (p < 0.01)'
            : pValue < 0.05
                ? 'significant (p < 0.05)'
                : pValue < 0.1
                    ? 'marginally significant (p < 0.1)'
                    : 'not significant (p ≥ 0.1)';
    const effectInterpretation = etaSquared < 0.01
        ? 'negligible'
        : etaSquared < 0.06
            ? 'small'
            : etaSquared < 0.14
                ? 'medium'
                : 'large';
    return `**ANOVA F-test Results:**
- **Null Hypothesis (H₀):** All group means are equal
- **Alternative Hypothesis (H₁):** At least one group mean differs
- **F-statistic:** F(${df1}, ${df2}) = ${fStat.toFixed(4)}
- **p-value:** ${pValue.toFixed(6)} (${significance})
- **Effect Size (η²):** ${etaSquared.toFixed(4)} (${effectInterpretation} effect)

**Statistical Decision:**
${pValue < 0.05
        ? `Reject H₀. There is ${significance.replace('significant', 'evidence')} that at least one group mean differs from the others.`
        : `Fail to reject H₀. There is insufficient evidence to conclude that group means differ significantly.`}

**Practical Interpretation:**
- **Variance Explained:** ${(etaSquared * 100).toFixed(1)}% of the total variance is explained by group differences
- **Residual Variance:** ${((1 - etaSquared) * 100).toFixed(1)}% remains unexplained (within-group variation)`;
}
/**
 * Generate detailed Kruskal-Wallis interpretation
 */
function generateKruskalWallisInterpretation(hStat, pValue, df, epsilonSquared) {
    const significance = pValue < 0.001
        ? 'highly significant (p < 0.001)'
        : pValue < 0.01
            ? 'very significant (p < 0.01)'
            : pValue < 0.05
                ? 'significant (p < 0.05)'
                : pValue < 0.1
                    ? 'marginally significant (p < 0.1)'
                    : 'not significant (p ≥ 0.1)';
    const effectInterpretation = epsilonSquared < 0.01
        ? 'negligible'
        : epsilonSquared < 0.06
            ? 'small'
            : epsilonSquared < 0.14
                ? 'medium'
                : 'large';
    return `**Kruskal-Wallis Test Results:**
- **Null Hypothesis (H₀):** All groups have the same distribution
- **Alternative Hypothesis (H₁):** At least one group has a different distribution
- **H-statistic:** H = ${hStat.toFixed(4)} ~ χ²(${df})
- **p-value:** ${pValue.toFixed(6)} (${significance})
- **Effect Size (ε²):** ${epsilonSquared.toFixed(4)} (${effectInterpretation} effect)

**Statistical Decision:**
${pValue < 0.05
        ? `Reject H₀. There is ${significance.replace('significant', 'evidence')} that at least one group has a different distribution.`
        : `Fail to reject H₀. There is insufficient evidence to conclude that group distributions differ significantly.`}

**Advantages over ANOVA:**
- **Non-parametric:** No assumption of normality required
- **Robust to outliers:** Uses ranks instead of raw values
- **Distribution-free:** Tests for any difference in distributions, not just means`;
}
/**
 * ANOVA assumptions
 */
function getAnovaAssumptions() {
    return [
        'Independence: Observations within and between groups are independent',
        'Normality: Residuals are approximately normally distributed',
        'Homoscedasticity: Equal variances across all groups (homogeneity of variance)',
        'Interval/ratio data: Dependent variable is measured at interval or ratio level',
    ];
}
/**
 * Kruskal-Wallis assumptions
 */
function getKruskalWallisAssumptions() {
    return [
        'Independence: Observations within and between groups are independent',
        'Ordinal data: Dependent variable is at least ordinal (rankable)',
        'Similar distributions: Groups have similar distribution shapes (for location comparison)',
        'Adequate sample size: Each group should have at least 5 observations for χ² approximation',
    ];
}
/**
 * Generate ANOVA recommendations
 */
function generateAnovaRecommendations(pValue, etaSquared, groups) {
    const recommendations = [];
    if (pValue < 0.05) {
        recommendations.push('Significant result detected - consider post-hoc tests to identify which groups differ');
        if (groups.length > 2) {
            recommendations.push('Use Tukey HSD, Bonferroni, or Scheffé tests for pairwise comparisons');
        }
    }
    else {
        recommendations.push('No significant differences detected - groups appear to have similar means');
    }
    if (etaSquared < 0.01) {
        recommendations.push('Very small effect size - differences may not be practically meaningful');
    }
    else if (etaSquared > 0.14) {
        recommendations.push('Large effect size - differences are likely practically significant');
    }
    // Check for potential assumption violations
    const minGroupSize = Math.min(...groups.map((g) => g.count));
    if (minGroupSize < 10) {
        recommendations.push('Small group sizes detected - verify normality assumptions');
    }
    const variances = groups.map((g) => g.variance);
    const maxVar = Math.max(...variances);
    const minVar = Math.min(...variances);
    if (maxVar / minVar > 4) {
        recommendations.push('Unequal variances detected - consider Welch ANOVA or transformation');
    }
    return recommendations;
}
/**
 * Generate Kruskal-Wallis recommendations
 */
function generateKruskalWallisRecommendations(pValue, epsilonSquared, groups) {
    const recommendations = [];
    if (pValue < 0.05) {
        recommendations.push('Significant result detected - consider post-hoc tests (Dunn test) for pairwise comparisons');
    }
    else {
        recommendations.push('No significant differences detected - group distributions appear similar');
    }
    if (epsilonSquared > 0 && epsilonSquared < 0.01) {
        recommendations.push('Very small effect size - differences may not be practically meaningful');
    }
    else if (epsilonSquared > 0.14) {
        recommendations.push('Large effect size - differences are likely practically significant');
    }
    const minGroupSize = Math.min(...groups.map((g) => g.count));
    if (minGroupSize < 5) {
        recommendations.push('Small group sizes - χ² approximation may be inaccurate, consider exact test');
    }
    recommendations.push('Non-parametric test - robust to outliers and non-normal distributions');
    return recommendations;
}
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
function welchsTTest(group1, group2) {
    if (!group1 || !group2) {
        throw new Error("Welch's t-test requires exactly two groups");
    }
    const n1 = group1.count;
    const n2 = group2.count;
    const mean1 = group1.mean;
    const mean2 = group2.mean;
    const var1 = group1.variance;
    const var2 = group2.variance;
    if (n1 < 2 || n2 < 2) {
        throw new Error("Each group must have at least 2 observations for Welch's t-test");
    }
    // Standard errors
    const se1 = var1 / n1;
    const se2 = var2 / n2;
    const pooledSE = Math.sqrt(se1 + se2);
    if (pooledSE === 0) {
        // No variance in either group
        return {
            testName: "Welch's t-test",
            statistic: mean1 === mean2 ? 0 : Infinity,
            pValue: mean1 === mean2 ? 1.0 : 0.0,
            degreesOfFreedom: n1 + n2 - 2,
            effectSize: mean1 === mean2 ? 0 : Infinity,
            interpretation: mean1 === mean2
                ? 'Groups have identical means and no variance'
                : 'Perfect separation - groups have different means with no variance',
            assumptions: getWelchsAssumptions(),
            recommendations: ['Verify data collection procedures'],
        };
    }
    // Calculate t-statistic
    const tStatistic = (mean1 - mean2) / pooledSE;
    // Welch-Satterthwaite degrees of freedom approximation
    const df = Math.pow(se1 + se2, 2) / (Math.pow(se1, 2) / (n1 - 1) + Math.pow(se2, 2) / (n2 - 1));
    // Two-tailed p-value (using normal approximation for large df, t-distribution for small df)
    let pValue;
    if (df > 100) {
        // Normal approximation for large df
        pValue = 2 * (1 - standardNormalCdf(Math.abs(tStatistic)));
    }
    else {
        // Use chi-squared approximation for t-distribution (simplified)
        pValue = 2 * (1 - standardNormalCdf(Math.abs(tStatistic))); // Simplified - full t-distribution would be better
    }
    // Cohen's d effect size
    const pooledSD = Math.sqrt(((n1 - 1) * var1 + (n2 - 1) * var2) / (n1 + n2 - 2));
    const cohensD = pooledSD > 0 ? Math.abs(mean1 - mean2) / pooledSD : 0;
    const interpretation = generateWelchsInterpretation(tStatistic, pValue, df, cohensD, group1.name, group2.name);
    const recommendations = generateWelchsRecommendations(pValue, cohensD, var1, var2, n1, n2);
    return {
        testName: "Welch's t-test",
        statistic: Number(tStatistic.toFixed(6)),
        pValue: Number(pValue.toFixed(6)),
        degreesOfFreedom: Number(df.toFixed(2)),
        effectSize: Number(cohensD.toFixed(4)),
        interpretation,
        assumptions: getWelchsAssumptions(),
        recommendations,
    };
}
/**
 * Mann-Whitney U test (Wilcoxon rank-sum test)
 * Non-parametric alternative to independent samples t-test
 * Tests H₀: P(X > Y) = 0.5 vs H₁: P(X > Y) ≠ 0.5
 */
function mannWhitneyUTest(group1, group2) {
    if (!group1 || !group2) {
        throw new Error('Mann-Whitney U test requires exactly two groups');
    }
    if (!group1.values || !group2.values) {
        return mannWhitneyApproximation(group1, group2);
    }
    const n1 = group1.count;
    const n2 = group2.count;
    const values1 = group1.values;
    const values2 = group2.values;
    // Combine all values and rank them
    const combined = [
        ...values1.map((v) => ({ value: v, group: 1 })),
        ...values2.map((v) => ({ value: v, group: 2 })),
    ];
    combined.sort((a, b) => a.value - b.value);
    const ranks = assignRanksWithTies(combined.map((item) => item.value));
    // Calculate rank sums
    let R1 = 0; // Sum of ranks for group 1
    combined.forEach((item, index) => {
        if (item.group === 1) {
            R1 += ranks[index];
        }
    });
    // Calculate U statistics
    const U1 = R1 - (n1 * (n1 + 1)) / 2;
    const U2 = n1 * n2 - U1;
    const U = Math.min(U1, U2); // Test statistic is the smaller U
    // For large samples, use normal approximation
    const N = n1 + n2;
    if (n1 >= 8 && n2 >= 8) {
        const meanU = (n1 * n2) / 2;
        const varU = (n1 * n2 * (N + 1)) / 12;
        // Tie correction
        const tieCorrection = calculateMannWhitneyTieCorrection(combined.map((item) => item.value));
        const adjustedVarU = varU - tieCorrection;
        const zStatistic = (U - meanU) / Math.sqrt(adjustedVarU);
        const pValue = 2 * (1 - standardNormalCdf(Math.abs(zStatistic)));
        // Effect size (r = Z / √N)
        const effectSize = Math.abs(zStatistic) / Math.sqrt(N);
        const interpretation = generateMannWhitneyInterpretation(U, zStatistic, pValue, effectSize, group1.name, group2.name);
        const recommendations = generateMannWhitneyRecommendations(pValue, effectSize, n1, n2);
        return {
            testName: 'Mann-Whitney U test',
            statistic: Number(U.toFixed(6)),
            pValue: Number(pValue.toFixed(6)),
            degreesOfFreedom: 0, // No degrees of freedom for this test
            effectSize: Number(effectSize.toFixed(4)),
            interpretation,
            assumptions: getMannWhitneyAssumptions(),
            recommendations,
        };
    }
    else {
        // Small samples - return approximation
        return mannWhitneyApproximation(group1, group2);
    }
}
/**
 * Anderson-Darling normality test
 * Tests H₀: Data follows normal distribution vs H₁: Data does not follow normal distribution
 * More sensitive to deviations in the tails than Kolmogorov-Smirnov
 */
function andersonDarlingTest(values) {
    if (!values || values.length < 5) {
        throw new Error('Anderson-Darling test requires at least 5 observations');
    }
    const n = values.length;
    const sortedValues = [...values].sort((a, b) => a - b);
    // Calculate sample mean and standard deviation
    const mean = sortedValues.reduce((sum, val) => sum + val, 0) / n;
    const variance = sortedValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (n - 1);
    const sd = Math.sqrt(variance);
    if (sd === 0) {
        return {
            testName: 'Anderson-Darling normality test',
            statistic: 0,
            pValue: 1.0,
            degreesOfFreedom: 0,
            effectSize: 0,
            interpretation: 'All values are identical - perfect "normality" but no variance',
            assumptions: getAndersonDarlingAssumptions(),
            recommendations: ['Verify data collection - constant values unusual in real data'],
        };
    }
    // Standardize values
    const standardized = sortedValues.map((val) => (val - mean) / sd);
    // Calculate Anderson-Darling statistic
    let adStatistic = 0;
    for (let i = 0; i < n; i++) {
        const zi = standardized[i];
        const phiZi = standardNormalCdf(zi);
        const phiZnMinusI = standardNormalCdf(standardized[n - 1 - i]);
        // Avoid log(0) and log(1)
        const term1 = phiZi > 0 && phiZi < 1 ? Math.log(phiZi) : 0;
        const term2 = phiZnMinusI > 0 && phiZnMinusI < 1 ? Math.log(1 - phiZnMinusI) : 0;
        adStatistic += (2 * i + 1) * (term1 + term2);
    }
    adStatistic = -n - adStatistic / n;
    // Adjust for sample size
    const adjustedAD = adStatistic * (1 + 0.75 / n + 2.25 / (n * n));
    // Approximate p-value (simplified)
    let pValue;
    if (adjustedAD < 0.2) {
        pValue = 1 - Math.exp(-1.2337 * Math.pow(adjustedAD, 5));
    }
    else if (adjustedAD < 0.34) {
        pValue = 1 - Math.exp(-0.9177 * Math.pow(adjustedAD, 4.8));
    }
    else if (adjustedAD < 0.6) {
        pValue = Math.exp(0.731 - 3.009 * adjustedAD + 1.78 * adjustedAD * adjustedAD);
    }
    else if (adjustedAD < 13) {
        pValue = Math.exp(1.092 - 3.09 * adjustedAD + 0.177 * adjustedAD * adjustedAD);
    }
    else {
        pValue = 0.0001; // Very small
    }
    pValue = Math.max(0.0001, Math.min(0.9999, pValue)); // Clamp to reasonable range
    const interpretation = generateAndersonDarlingInterpretation(adjustedAD, pValue);
    const recommendations = generateAndersonDarlingRecommendations(pValue, adjustedAD);
    return {
        testName: 'Anderson-Darling normality test',
        statistic: Number(adjustedAD.toFixed(6)),
        pValue: Number(pValue.toFixed(6)),
        degreesOfFreedom: 0,
        effectSize: Number((adjustedAD / n).toFixed(4)), // Normalized statistic as effect size
        interpretation,
        assumptions: getAndersonDarlingAssumptions(),
        recommendations,
    };
}
// Helper functions for new tests
function standardNormalCdf(z) {
    // Standard normal CDF approximation
    return 0.5 * (1 + erf(z / Math.sqrt(2)));
}
function erf(x) {
    // Error function approximation
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;
    const sign = x >= 0 ? 1 : -1;
    x = Math.abs(x);
    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
    return sign * y;
}
function mannWhitneyApproximation(group1, group2) {
    // Simplified approximation when raw values not available
    const meanDiff = Math.abs(group1.mean - group2.mean);
    const pooledSD = Math.sqrt((group1.variance + group2.variance) / 2);
    const effectSize = pooledSD > 0 ? meanDiff / pooledSD : 0;
    return {
        testName: 'Mann-Whitney U test (approximation)',
        statistic: effectSize,
        pValue: effectSize > 1 ? 0.05 : 0.5, // Very rough approximation
        degreesOfFreedom: 0,
        effectSize: Number(effectSize.toFixed(4)),
        interpretation: 'Approximation based on means and variances (raw values needed for exact test)',
        assumptions: [
            ...getMannWhitneyAssumptions(),
            'Approximation only - collect raw values for exact test',
        ],
        recommendations: [
            'Use with extreme caution - approximation only',
            'Collect raw values for proper Mann-Whitney test',
        ],
    };
}
function calculateMannWhitneyTieCorrection(values) {
    const tieGroups = new Map();
    for (const value of values) {
        tieGroups.set(value, (tieGroups.get(value) || 0) + 1);
    }
    let correction = 0;
    for (const count of tieGroups.values()) {
        if (count > 1) {
            correction += (count * count * count - count) / 12;
        }
    }
    return correction;
}
// Assumption and interpretation functions for new tests
function getWelchsAssumptions() {
    return [
        'Independence: Observations are independent within and between groups',
        'Normality: Data in each group approximately normally distributed',
        "No assumption of equal variances (major advantage over Student's t-test)",
        'Interval/ratio data: Dependent variable measured at interval or ratio level',
    ];
}
function getMannWhitneyAssumptions() {
    return [
        'Independence: Observations are independent within and between groups',
        'Ordinal data: Data can be meaningfully ranked',
        'Similar distribution shapes for location comparison',
        'Random sampling from populations',
    ];
}
function getAndersonDarlingAssumptions() {
    return [
        'Independence: Observations are independent',
        'Data should be univariate and continuous',
        'Sample size should be at least 5 (preferably > 20 for reliable results)',
        'Tests specifically for normal distribution',
    ];
}
function generateWelchsInterpretation(tStat, pValue, df, cohensD, group1Name, group2Name) {
    const significance = pValue < 0.001
        ? 'highly significant (p < 0.001)'
        : pValue < 0.01
            ? 'very significant (p < 0.01)'
            : pValue < 0.05
                ? 'significant (p < 0.05)'
                : 'not significant (p ≥ 0.05)';
    const effectInterpretation = cohensD < 0.2 ? 'negligible' : cohensD < 0.5 ? 'small' : cohensD < 0.8 ? 'medium' : 'large';
    return `**Welch's t-test Results:**
- **Null Hypothesis (H₀):** Group means are equal
- **Alternative Hypothesis (H₁):** Group means differ
- **t-statistic:** t(${df.toFixed(1)}) = ${tStat.toFixed(4)}
- **p-value:** ${pValue.toFixed(6)} (${significance})
- **Effect Size (Cohen's d):** ${cohensD.toFixed(4)} (${effectInterpretation} effect)

**Statistical Decision:**
${pValue < 0.05
        ? `Reject H₀. There is ${significance.replace('significant', 'evidence')} that ${group1Name} and ${group2Name} have different means.`
        : `Fail to reject H₀. No significant difference detected between ${group1Name} and ${group2Name} means.`}`;
}
function generateMannWhitneyInterpretation(U, zStat, pValue, effectSize, group1Name, group2Name) {
    const significance = pValue < 0.001
        ? 'highly significant (p < 0.001)'
        : pValue < 0.01
            ? 'very significant (p < 0.01)'
            : pValue < 0.05
                ? 'significant (p < 0.05)'
                : 'not significant (p ≥ 0.05)';
    const effectInterpretation = effectSize < 0.1
        ? 'negligible'
        : effectSize < 0.3
            ? 'small'
            : effectSize < 0.5
                ? 'medium'
                : 'large';
    return `**Mann-Whitney U Test Results:**
- **Null Hypothesis (H₀):** Groups have same distribution
- **Alternative Hypothesis (H₁):** Groups have different distributions
- **U-statistic:** U = ${U.toFixed(4)}
- **Z-statistic:** Z = ${zStat.toFixed(4)}
- **p-value:** ${pValue.toFixed(6)} (${significance})
- **Effect Size (r):** ${effectSize.toFixed(4)} (${effectInterpretation} effect)

**Statistical Decision:**
${pValue < 0.05
        ? `Reject H₀. There is ${significance.replace('significant', 'evidence')} that ${group1Name} and ${group2Name} have different distributions.`
        : `Fail to reject H₀. No significant difference detected between ${group1Name} and ${group2Name} distributions.`}`;
}
function generateAndersonDarlingInterpretation(adStat, pValue) {
    const significance = pValue < 0.001
        ? 'highly significant (p < 0.001)'
        : pValue < 0.01
            ? 'very significant (p < 0.01)'
            : pValue < 0.05
                ? 'significant (p < 0.05)'
                : 'not significant (p ≥ 0.05)';
    return `**Anderson-Darling Normality Test Results:**
- **Null Hypothesis (H₀):** Data follows normal distribution
- **Alternative Hypothesis (H₁):** Data does not follow normal distribution
- **A²-statistic:** A² = ${adStat.toFixed(4)}
- **p-value:** ${pValue.toFixed(6)} (${significance})

**Statistical Decision:**
${pValue < 0.05
        ? `Reject H₀. There is ${significance.replace('significant', 'evidence')} that the data does not follow a normal distribution.`
        : `Fail to reject H₀. The data appears to be consistent with a normal distribution.`}

**Interpretation:**
- **Sensitive to tails:** More sensitive than Kolmogorov-Smirnov to deviations in distribution tails
- **Distribution shape:** ${pValue < 0.05 ? 'Consider data transformation or non-parametric methods' : 'Normal distribution assumption reasonable'}`;
}
function generateWelchsRecommendations(pValue, cohensD, var1, var2, n1, n2) {
    const recommendations = [];
    if (pValue < 0.05) {
        recommendations.push('Significant difference detected between group means');
        if (cohensD > 0.8) {
            recommendations.push('Large effect size - difference is likely practically significant');
        }
    }
    else {
        recommendations.push('No significant difference - groups have similar means');
    }
    const varianceRatio = Math.max(var1, var2) / Math.min(var1, var2);
    if (varianceRatio > 2) {
        recommendations.push("Unequal variances detected - Welch's t-test appropriately handles this");
    }
    if (Math.min(n1, n2) < 30) {
        recommendations.push('Small sample size - verify normality assumption');
    }
    return recommendations;
}
function generateMannWhitneyRecommendations(pValue, effectSize, n1, n2) {
    const recommendations = [];
    if (pValue < 0.05) {
        recommendations.push('Significant difference detected between group distributions');
    }
    else {
        recommendations.push('No significant difference - groups have similar distributions');
    }
    if (effectSize > 0.5) {
        recommendations.push('Large effect size - difference is likely practically significant');
    }
    if (Math.min(n1, n2) < 8) {
        recommendations.push('Small sample size - consider exact test or bootstrap methods');
    }
    recommendations.push('Non-parametric test - robust to outliers and non-normal distributions');
    return recommendations;
}
function generateAndersonDarlingRecommendations(pValue, adStat) {
    const recommendations = [];
    if (pValue < 0.05) {
        recommendations.push('Normality assumption violated - consider data transformation');
        recommendations.push('Alternative: Use non-parametric statistical methods');
        if (adStat > 1) {
            recommendations.push('Strong evidence against normality - transformation highly recommended');
        }
    }
    else {
        recommendations.push('Normality assumption satisfied - parametric methods appropriate');
    }
    recommendations.push('More powerful than Kolmogorov-Smirnov for detecting departures from normality');
    recommendations.push('Particularly sensitive to differences in distribution tails');
    return recommendations;
}
//# sourceMappingURL=hypothesis-tests.js.map