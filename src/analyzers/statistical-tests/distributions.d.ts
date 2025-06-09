/**
 * Statistical Distributions Module
 * Provides accurate statistical distribution functions for hypothesis testing
 *
 * Implements numerically stable algorithms for:
 * - F-distribution (for ANOVA)
 * - Chi-squared distribution (for Kruskal-Wallis)
 * - Gamma and Beta functions (supporting functions)
 */
/**
 * Log-Gamma function using Lanczos approximation
 * Highly accurate for x > 0
 */
export declare function logGamma(x: number): number;
/**
 * Gamma function using Lanczos approximation
 */
export declare function gamma(x: number): number;
/**
 * Incomplete Beta function using continued fraction expansion
 * Used for F-distribution CDF calculation
 */
export declare function incompleteBeta(a: number, b: number, x: number): number;
/**
 * Incomplete Gamma function using series expansion
 * Used for Chi-squared distribution CDF
 */
export declare function incompleteGamma(a: number, x: number): number;
/**
 * F-distribution CDF
 * P(F <= f) where F ~ F(df1, df2)
 */
export declare function fcdf(f: number, df1: number, df2: number): number;
/**
 * F-distribution survival function (1 - CDF)
 * P(F > f) - more numerically stable for small p-values
 */
export declare function fccdf(f: number, df1: number, df2: number): number;
/**
 * Chi-squared distribution CDF
 * P(X² <= x) where X² ~ χ²(df)
 */
export declare function chisqcdf(x: number, df: number): number;
/**
 * Chi-squared distribution survival function (1 - CDF)
 * P(X² > x) - more numerically stable for small p-values
 */
export declare function chisqccdf(x: number, df: number): number;
/**
 * Validate statistical test inputs
 */
export declare function validateTestInputs(groups: Array<{
    count: number;
    mean: number;
    variance: number;
}>): void;
/**
 * Numerical stability checks
 */
export declare function checkNumericalStability(value: number, context: string): number;
//# sourceMappingURL=distributions.d.ts.map