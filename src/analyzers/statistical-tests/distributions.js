"use strict";
/**
 * Statistical Distributions Module
 * Provides accurate statistical distribution functions for hypothesis testing
 *
 * Implements numerically stable algorithms for:
 * - F-distribution (for ANOVA)
 * - Chi-squared distribution (for Kruskal-Wallis)
 * - Gamma and Beta functions (supporting functions)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.logGamma = logGamma;
exports.gamma = gamma;
exports.incompleteBeta = incompleteBeta;
exports.incompleteGamma = incompleteGamma;
exports.fcdf = fcdf;
exports.fccdf = fccdf;
exports.chisqcdf = chisqcdf;
exports.chisqccdf = chisqccdf;
exports.validateTestInputs = validateTestInputs;
exports.checkNumericalStability = checkNumericalStability;
/**
 * Numerical constants for high precision calculations
 */
const MACHEP = 1.11022302462515654042e-16; // Machine epsilon
const MAXLOG = 7.09782712893383996732e2; // log(MAXNUM)
const MINLOG = -7.451332191019412076235e2; // log(MINNUM)
const MAXNUM = 1.79769313486231570815e308; // Maximum representable number
/**
 * Lanczos coefficients for gamma function approximation
 * Provides ~15 decimal places of accuracy
 */
const LANCZOS_G = 7;
const LANCZOS_COEFFICIENTS = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313,
    -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6,
    1.5056327351493116e-7,
];
/**
 * Log-Gamma function using Lanczos approximation
 * Highly accurate for x > 0
 */
function logGamma(x) {
    if (x <= 0) {
        throw new Error('logGamma: x must be positive');
    }
    if (x < 0.5) {
        // Use reflection formula: Γ(x) = π / (sin(πx) * Γ(1-x))
        return Math.log(Math.PI / Math.sin(Math.PI * x)) - logGamma(1 - x);
    }
    x -= 1;
    let result = LANCZOS_COEFFICIENTS[0];
    for (let i = 1; i < LANCZOS_COEFFICIENTS.length; i++) {
        result += LANCZOS_COEFFICIENTS[i] / (x + i);
    }
    const t = x + LANCZOS_G + 0.5;
    return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(result);
}
/**
 * Gamma function using Lanczos approximation
 */
function gamma(x) {
    if (x <= 0) {
        throw new Error('gamma: x must be positive');
    }
    return Math.exp(logGamma(x));
}
/**
 * Incomplete Beta function using continued fraction expansion
 * Used for F-distribution CDF calculation
 */
function incompleteBeta(a, b, x) {
    if (x < 0 || x > 1) {
        throw new Error('incompleteBeta: x must be in [0,1]');
    }
    if (x === 0)
        return 0;
    if (x === 1)
        return 1;
    // Use symmetry relation if needed for better convergence
    let bt;
    if (x > (a + 1) / (a + b + 2)) {
        return 1 - incompleteBeta(b, a, 1 - x);
    }
    // Calculate the coefficient
    bt = Math.exp(logGamma(a + b) - logGamma(a) - logGamma(b) + a * Math.log(x) + b * Math.log(1 - x));
    if (x < (a + 1) / (a + b + 2)) {
        return (bt * betacf(a, b, x)) / a;
    }
    else {
        return 1 - (bt * betacf(b, a, 1 - x)) / b;
    }
}
/**
 * Continued fraction for incomplete beta function
 * Uses modified Lentz method for numerical stability
 */
function betacf(a, b, x) {
    const FPMIN = Number.MIN_VALUE / MACHEP;
    const MAXIT = 100;
    const EPS = 3e-15;
    const qab = a + b;
    const qap = a + 1;
    const qam = a - 1;
    let c = 1;
    let d = 1 - (qab * x) / qap;
    if (Math.abs(d) < FPMIN)
        d = FPMIN;
    d = 1 / d;
    let h = d;
    for (let m = 1; m <= MAXIT; m++) {
        const m2 = 2 * m;
        let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
        // Even step
        d = 1 + aa * d;
        if (Math.abs(d) < FPMIN)
            d = FPMIN;
        c = 1 + aa / c;
        if (Math.abs(c) < FPMIN)
            c = FPMIN;
        d = 1 / d;
        h *= d * c;
        // Odd step
        aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
        d = 1 + aa * d;
        if (Math.abs(d) < FPMIN)
            d = FPMIN;
        c = 1 + aa / c;
        if (Math.abs(c) < FPMIN)
            c = FPMIN;
        d = 1 / d;
        const del = d * c;
        h *= del;
        if (Math.abs(del - 1) < EPS)
            break;
    }
    return h;
}
/**
 * Incomplete Gamma function using series expansion
 * Used for Chi-squared distribution CDF
 */
function incompleteGamma(a, x) {
    if (x < 0 || a <= 0) {
        throw new Error('incompleteGamma: invalid parameters');
    }
    if (x === 0)
        return 0;
    if (x < a + 1) {
        // Use series expansion
        return gammap(a, x);
    }
    else {
        // Use continued fraction
        return 1 - gammq(a, x);
    }
}
/**
 * Incomplete gamma P(a,x) via series representation
 */
function gammap(a, x) {
    const ITMAX = 100;
    const EPS = 3e-15;
    const gln = logGamma(a);
    let ap = a;
    let sum = 1 / a;
    let del = sum;
    for (let n = 1; n <= ITMAX; n++) {
        ap++;
        del *= x / ap;
        sum += del;
        if (Math.abs(del) < Math.abs(sum) * EPS) {
            return sum * Math.exp(-x + a * Math.log(x) - gln);
        }
    }
    throw new Error('gammap: a too large, ITMAX too small');
}
/**
 * Incomplete gamma Q(a,x) via continued fraction
 */
function gammq(a, x) {
    const FPMIN = Number.MIN_VALUE / MACHEP;
    const ITMAX = 100;
    const EPS = 3e-15;
    const gln = logGamma(a);
    let b = x + 1 - a;
    let c = Number.MAX_VALUE;
    let d = 1 / b;
    let h = d;
    for (let i = 1; i <= ITMAX; i++) {
        const an = -i * (i - a);
        b += 2;
        d = an * d + b;
        if (Math.abs(d) < FPMIN)
            d = FPMIN;
        c = b + an / c;
        if (Math.abs(c) < FPMIN)
            c = FPMIN;
        d = 1 / d;
        const del = d * c;
        h *= del;
        if (Math.abs(del - 1) < EPS) {
            return Math.exp(-x + a * Math.log(x) - gln) * h;
        }
    }
    throw new Error('gammq: a too large, ITMAX too small');
}
/**
 * F-distribution CDF
 * P(F <= f) where F ~ F(df1, df2)
 */
function fcdf(f, df1, df2) {
    if (f <= 0)
        return 0;
    if (!isFinite(f))
        return 1;
    const x = df2 / (df2 + df1 * f);
    return incompleteBeta(df2 / 2, df1 / 2, x);
}
/**
 * F-distribution survival function (1 - CDF)
 * P(F > f) - more numerically stable for small p-values
 */
function fccdf(f, df1, df2) {
    if (f <= 0)
        return 1;
    if (!isFinite(f))
        return 0;
    const x = (df1 * f) / (df2 + df1 * f);
    return incompleteBeta(df1 / 2, df2 / 2, x);
}
/**
 * Chi-squared distribution CDF
 * P(X² <= x) where X² ~ χ²(df)
 */
function chisqcdf(x, df) {
    if (x <= 0)
        return 0;
    if (!isFinite(x))
        return 1;
    return incompleteGamma(df / 2, x / 2);
}
/**
 * Chi-squared distribution survival function (1 - CDF)
 * P(X² > x) - more numerically stable for small p-values
 */
function chisqccdf(x, df) {
    if (x <= 0)
        return 1;
    if (!isFinite(x))
        return 0;
    return 1 - incompleteGamma(df / 2, x / 2);
}
/**
 * Validate statistical test inputs
 */
function validateTestInputs(groups) {
    if (groups.length < 2) {
        throw new Error('Statistical tests require at least 2 groups');
    }
    for (const group of groups) {
        if (group.count < 1) {
            throw new Error('Each group must have at least 1 observation');
        }
        if (group.variance < 0) {
            throw new Error('Variance cannot be negative');
        }
        if (!isFinite(group.mean) || !isFinite(group.variance)) {
            throw new Error('Group statistics must be finite numbers');
        }
    }
}
/**
 * Numerical stability checks
 */
function checkNumericalStability(value, context) {
    if (!isFinite(value)) {
        throw new Error(`Numerical instability detected in ${context}: ${value}`);
    }
    return value;
}
//# sourceMappingURL=distributions.js.map