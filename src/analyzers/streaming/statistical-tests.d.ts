/**
 * Statistical Tests Library
 * Implements proper statistical tests for EDA analysis
 */
/**
 * Shapiro-Wilk Test for Normality
 * Tests the null hypothesis that data comes from a normal distribution
 */
export declare class ShapiroWilkTest {
    private static readonly COEFFICIENTS;
    /**
     * Standard normal cumulative distribution function
     */
    private static standardNormalCDF;
    static test(data: number[]): {
        statistic: number;
        pValue: number;
        interpretation: string;
    };
}
/**
 * Jarque-Bera Test for Normality
 * Tests normality using skewness and kurtosis
 */
export declare class JarqueBeraTest {
    static test(data: number[]): {
        statistic: number;
        pValue: number;
        interpretation: string;
    };
}
/**
 * Kolmogorov-Smirnov Test for Normality
 * Tests if data follows a normal distribution
 */
export declare class KolmogorovSmirnovTest {
    static test(data: number[]): {
        statistic: number;
        pValue: number;
        interpretation: string;
    };
    /**
     * Approximate normal CDF using erf approximation
     */
    private static normalCDF;
    /**
     * Error function approximation
     */
    private static erf;
}
/**
 * ANOVA (Analysis of Variance) Test
 * Tests if means of multiple groups are significantly different
 */
export declare class ANOVATest {
    static test(groups: number[][]): {
        fStatistic: number;
        pValue: number;
        interpretation: string;
    };
}
/**
 * Chi-Squared Test of Independence
 * Tests association between two categorical variables
 */
export declare class ChiSquaredTest {
    static test(contingencyTable: number[][]): {
        statistic: number;
        pValue: number;
        degreesOfFreedom: number;
        interpretation: string;
        cramersV: number;
    };
}
/**
 * Correlation significance test
 * Tests if a correlation coefficient is significantly different from zero
 */
export declare class CorrelationSignificanceTest {
    static test(correlation: number, sampleSize: number): {
        pValue: number;
        interpretation: string;
    };
}
//# sourceMappingURL=statistical-tests.d.ts.map