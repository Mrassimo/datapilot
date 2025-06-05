/**
 * Statistical Tests Library
 * Implements proper statistical tests for EDA analysis
 */

/**
 * Shapiro-Wilk Test for Normality
 * Tests the null hypothesis that data comes from a normal distribution
 */
export class ShapiroWilkTest {
  private static readonly COEFFICIENTS = [
    // Coefficients for Shapiro-Wilk test (approximation for small samples)
    // Full implementation would require extensive coefficient tables
    [0.7071, 0.0000, 0.0000, 0.0000, 0.0000],
    [0.7071, 0.7071, 0.0000, 0.0000, 0.0000],
    [0.6872, 0.1677, 0.6872, 0.0000, 0.0000],
    [0.6646, 0.2413, 0.2413, 0.6646, 0.0000],
    [0.6431, 0.2806, 0.0875, 0.2806, 0.6431],
  ];

  static test(data: number[]): { statistic: number; pValue: number; interpretation: string } {
    if (data.length < 3) {
      return {
        statistic: 0,
        pValue: 1,
        interpretation: 'Insufficient data for Shapiro-Wilk test (n < 3)',
      };
    }

    if (data.length > 5000) {
      return {
        statistic: 0,
        pValue: 1,
        interpretation: 'Sample too large for Shapiro-Wilk test (use Kolmogorov-Smirnov instead)',
      };
    }

    // Sort the data
    const sortedData = [...data].sort((a, b) => a - b);
    const n = sortedData.length;

    // Calculate sample mean and variance
    const mean = sortedData.reduce((sum, val) => sum + val, 0) / n;
    const variance = sortedData.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (n - 1);

    if (variance === 0) {
      return {
        statistic: 1,
        pValue: 1,
        interpretation: 'All values identical - cannot test normality',
      };
    }

    // Simplified Shapiro-Wilk calculation
    // Full implementation requires extensive coefficient tables and complex calculations
    let b = 0;
    const m = Math.floor(n / 2);
    
    for (let i = 0; i < m; i++) {
      const coeff = i < 5 && n <= 10 ? this.COEFFICIENTS[Math.min(n - 3, 4)][i] : 0.5;
      b += coeff * (sortedData[n - 1 - i] - sortedData[i]);
    }

    const w = (b * b) / ((n - 1) * variance);
    
    // Approximate p-value calculation
    let pValue: number;
    if (w > 0.95) {
      pValue = 0.5;
    } else if (w > 0.90) {
      pValue = 0.1;
    } else if (w > 0.85) {
      pValue = 0.05;
    } else {
      pValue = 0.01;
    }

    const interpretation = pValue > 0.05 
      ? 'Data consistent with normal distribution (p > 0.05)'
      : 'Data significantly deviates from normal distribution (p ≤ 0.05)';

    return {
      statistic: Number(w.toFixed(6)),
      pValue: Number(pValue.toFixed(4)),
      interpretation,
    };
  }
}

/**
 * Jarque-Bera Test for Normality
 * Tests normality using skewness and kurtosis
 */
export class JarqueBeraTest {
  static test(data: number[]): { statistic: number; pValue: number; interpretation: string } {
    if (data.length < 3) {
      return {
        statistic: 0,
        pValue: 1,
        interpretation: 'Insufficient data for Jarque-Bera test (n < 3)',
      };
    }

    const n = data.length;
    const mean = data.reduce((sum, val) => sum + val, 0) / n;
    
    // Calculate moments
    let m2 = 0, m3 = 0, m4 = 0;
    for (const value of data) {
      const deviation = value - mean;
      const deviation2 = deviation * deviation;
      const deviation3 = deviation2 * deviation;
      const deviation4 = deviation2 * deviation2;
      
      m2 += deviation2;
      m3 += deviation3;
      m4 += deviation4;
    }
    
    m2 /= n;
    m3 /= n;
    m4 /= n;
    
    if (m2 === 0) {
      return {
        statistic: 0,
        pValue: 1,
        interpretation: 'All values identical - cannot test normality',
      };
    }
    
    // Calculate skewness and kurtosis
    const skewness = m3 / Math.pow(m2, 1.5);
    const kurtosis = (m4 / (m2 * m2)) - 3; // Excess kurtosis
    
    // Jarque-Bera statistic
    const jb = (n / 6) * (skewness * skewness + (kurtosis * kurtosis) / 4);
    
    // Approximate p-value using chi-squared distribution with 2 df
    // Critical values: 5.99 (p=0.05), 9.21 (p=0.01), 13.82 (p=0.001)
    let pValue: number;
    if (jb < 5.99) {
      pValue = 0.2;
    } else if (jb < 9.21) {
      pValue = 0.05;
    } else if (jb < 13.82) {
      pValue = 0.01;
    } else {
      pValue = 0.001;
    }
    
    const interpretation = pValue > 0.05
      ? 'Data consistent with normal distribution (p > 0.05)'
      : 'Data significantly deviates from normal distribution (p ≤ 0.05)';
    
    return {
      statistic: Number(jb.toFixed(6)),
      pValue: Number(pValue.toFixed(4)),
      interpretation,
    };
  }
}

/**
 * Kolmogorov-Smirnov Test for Normality
 * Tests if data follows a normal distribution
 */
export class KolmogorovSmirnovTest {
  static test(data: number[]): { statistic: number; pValue: number; interpretation: string } {
    if (data.length < 5) {
      return {
        statistic: 0,
        pValue: 1,
        interpretation: 'Insufficient data for Kolmogorov-Smirnov test (n < 5)',
      };
    }

    const n = data.length;
    const sortedData = [...data].sort((a, b) => a - b);
    
    // Calculate sample mean and standard deviation
    const mean = sortedData.reduce((sum, val) => sum + val, 0) / n;
    const variance = sortedData.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (n - 1);
    const stdDev = Math.sqrt(variance);
    
    if (stdDev === 0) {
      return {
        statistic: 0,
        pValue: 1,
        interpretation: 'All values identical - cannot test normality',
      };
    }
    
    // Calculate D statistic (maximum difference between empirical and theoretical CDF)
    let maxDifference = 0;
    
    for (let i = 0; i < n; i++) {
      const empiricalCDF = (i + 1) / n;
      const standardized = (sortedData[i] - mean) / stdDev;
      const theoreticalCDF = this.normalCDF(standardized);
      
      const difference = Math.abs(empiricalCDF - theoreticalCDF);
      maxDifference = Math.max(maxDifference, difference);
    }
    
    // Approximate critical values for K-S test
    const criticalValue005 = 1.36 / Math.sqrt(n);
    const criticalValue001 = 1.63 / Math.sqrt(n);
    
    let pValue: number;
    if (maxDifference < criticalValue005) {
      pValue = 0.2;
    } else if (maxDifference < criticalValue001) {
      pValue = 0.05;
    } else {
      pValue = 0.01;
    }
    
    const interpretation = pValue > 0.05
      ? 'Data consistent with normal distribution (p > 0.05)'
      : 'Data significantly deviates from normal distribution (p ≤ 0.05)';
    
    return {
      statistic: Number(maxDifference.toFixed(6)),
      pValue: Number(pValue.toFixed(4)),
      interpretation,
    };
  }

  /**
   * Approximate normal CDF using erf approximation
   */
  private static normalCDF(x: number): number {
    return 0.5 * (1 + this.erf(x / Math.sqrt(2)));
  }

  /**
   * Error function approximation
   */
  private static erf(x: number): number {
    // Abramowitz and Stegun approximation
    const a1 =  0.254829592;
    const a2 = -0.284496736;
    const a3 =  1.421413741;
    const a4 = -1.453152027;
    const a5 =  1.061405429;
    const p  =  0.3275911;

    const sign = x >= 0 ? 1 : -1;
    x = Math.abs(x);

    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return sign * y;
  }
}

/**
 * ANOVA (Analysis of Variance) Test
 * Tests if means of multiple groups are significantly different
 */
export class ANOVATest {
  static test(groups: number[][]): { fStatistic: number; pValue: number; interpretation: string } {
    if (groups.length < 2) {
      return {
        fStatistic: 0,
        pValue: 1,
        interpretation: 'Need at least 2 groups for ANOVA',
      };
    }

    // Filter out empty groups
    const validGroups = groups.filter(group => group.length > 0);
    if (validGroups.length < 2) {
      return {
        fStatistic: 0,
        pValue: 1,
        interpretation: 'Need at least 2 non-empty groups for ANOVA',
      };
    }

    const k = validGroups.length; // number of groups
    const n = validGroups.reduce((sum, group) => sum + group.length, 0); // total sample size

    if (n <= k) {
      return {
        fStatistic: 0,
        pValue: 1,
        interpretation: 'Insufficient data for ANOVA (total n ≤ number of groups)',
      };
    }

    // Calculate group means and overall mean
    const groupMeans = validGroups.map(group => 
      group.reduce((sum, val) => sum + val, 0) / group.length
    );
    const overallMean = validGroups.flat().reduce((sum, val) => sum + val, 0) / n;

    // Calculate sum of squares between groups (SSB)
    let ssb = 0;
    for (let i = 0; i < validGroups.length; i++) {
      const groupSize = validGroups[i].length;
      const groupMean = groupMeans[i];
      ssb += groupSize * Math.pow(groupMean - overallMean, 2);
    }

    // Calculate sum of squares within groups (SSW)
    let ssw = 0;
    for (let i = 0; i < validGroups.length; i++) {
      const groupMean = groupMeans[i];
      for (const value of validGroups[i]) {
        ssw += Math.pow(value - groupMean, 2);
      }
    }

    // Calculate degrees of freedom
    const dfBetween = k - 1;
    const dfWithin = n - k;

    // Calculate mean squares
    const msBetween = ssb / dfBetween;
    const msWithin = ssw / dfWithin;

    // Calculate F-statistic
    const fStatistic = msWithin > 0 ? msBetween / msWithin : 0;

    // Approximate p-value using F-distribution
    // This is a simplified approximation
    let pValue: number;
    if (fStatistic < 1) {
      pValue = 0.5;
    } else if (fStatistic < 2.5) {
      pValue = 0.1;
    } else if (fStatistic < 4) {
      pValue = 0.05;
    } else if (fStatistic < 7) {
      pValue = 0.01;
    } else {
      pValue = 0.001;
    }

    const interpretation = pValue > 0.05
      ? 'No significant difference between group means (p > 0.05)'
      : 'Significant difference between group means (p ≤ 0.05)';

    return {
      fStatistic: Number(fStatistic.toFixed(6)),
      pValue: Number(pValue.toFixed(4)),
      interpretation,
    };
  }
}

/**
 * Chi-Squared Test of Independence
 * Tests association between two categorical variables
 */
export class ChiSquaredTest {
  static test(contingencyTable: number[][]): { 
    statistic: number; 
    pValue: number; 
    degreesOfFreedom: number;
    interpretation: string;
    cramersV: number;
  } {
    if (contingencyTable.length < 2 || contingencyTable[0].length < 2) {
      return {
        statistic: 0,
        pValue: 1,
        degreesOfFreedom: 0,
        interpretation: 'Need at least 2x2 table for chi-squared test',
        cramersV: 0,
      };
    }

    const rows = contingencyTable.length;
    const cols = contingencyTable[0].length;

    // Calculate row and column totals
    const rowTotals = contingencyTable.map(row => row.reduce((sum, val) => sum + val, 0));
    const colTotals = Array(cols).fill(0);
    let grandTotal = 0;

    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        colTotals[j] += contingencyTable[i][j];
        grandTotal += contingencyTable[i][j];
      }
    }

    if (grandTotal === 0) {
      return {
        statistic: 0,
        pValue: 1,
        degreesOfFreedom: 0,
        interpretation: 'Empty contingency table',
        cramersV: 0,
      };
    }

    // Calculate expected frequencies and chi-squared statistic
    let chiSquared = 0;
    let lowExpectedCount = 0;

    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        const expected = (rowTotals[i] * colTotals[j]) / grandTotal;
        
        if (expected < 5) {
          lowExpectedCount++;
        }
        
        if (expected > 0) {
          const observed = contingencyTable[i][j];
          chiSquared += Math.pow(observed - expected, 2) / expected;
        }
      }
    }

    const degreesOfFreedom = (rows - 1) * (cols - 1);

    // Check assumption: expected frequencies ≥ 5
    const totalCells = rows * cols;
    if (lowExpectedCount / totalCells > 0.2) {
      return {
        statistic: Number(chiSquared.toFixed(6)),
        pValue: 1,
        degreesOfFreedom,
        interpretation: 'Chi-squared test assumptions violated: >20% of cells have expected frequency <5',
        cramersV: 0,
      };
    }

    // Approximate p-value using chi-squared distribution
    // Critical values depend on degrees of freedom
    let pValue: number;
    if (degreesOfFreedom === 1) {
      if (chiSquared < 3.84) pValue = 0.1;
      else if (chiSquared < 6.64) pValue = 0.05;
      else if (chiSquared < 10.83) pValue = 0.01;
      else pValue = 0.001;
    } else if (degreesOfFreedom === 2) {
      if (chiSquared < 5.99) pValue = 0.1;
      else if (chiSquared < 9.21) pValue = 0.05;
      else if (chiSquared < 13.82) pValue = 0.01;
      else pValue = 0.001;
    } else {
      // General approximation
      const criticalValue = degreesOfFreedom + 2 * Math.sqrt(2 * degreesOfFreedom);
      if (chiSquared < criticalValue * 0.8) pValue = 0.1;
      else if (chiSquared < criticalValue) pValue = 0.05;
      else if (chiSquared < criticalValue * 1.3) pValue = 0.01;
      else pValue = 0.001;
    }

    // Calculate Cramer's V (effect size)
    const cramersV = Math.sqrt(chiSquared / (grandTotal * Math.min(rows - 1, cols - 1)));

    const interpretation = pValue > 0.05
      ? 'No significant association between variables (p > 0.05)'
      : 'Significant association between variables (p ≤ 0.05)';

    return {
      statistic: Number(chiSquared.toFixed(6)),
      pValue: Number(pValue.toFixed(4)),
      degreesOfFreedom,
      interpretation,
      cramersV: Number(cramersV.toFixed(4)),
    };
  }
}

/**
 * Correlation significance test
 * Tests if a correlation coefficient is significantly different from zero
 */
export class CorrelationSignificanceTest {
  static test(correlation: number, sampleSize: number): { pValue: number; interpretation: string } {
    if (sampleSize < 3) {
      return {
        pValue: 1,
        interpretation: 'Insufficient sample size for correlation significance test',
      };
    }

    if (Math.abs(correlation) >= 1) {
      return {
        pValue: correlation === 0 ? 1 : 0,
        interpretation: correlation === 0 ? 'Perfect zero correlation' : 'Perfect correlation',
      };
    }

    // Calculate t-statistic for correlation
    const tStatistic = correlation * Math.sqrt((sampleSize - 2) / (1 - correlation * correlation));
    const degreesOfFreedom = sampleSize - 2;

    // Approximate p-value using t-distribution
    const absT = Math.abs(tStatistic);
    let pValue: number;

    if (degreesOfFreedom >= 30) {
      // Large sample approximation (normal distribution)
      if (absT < 1.96) pValue = 0.1;
      else if (absT < 2.58) pValue = 0.05;
      else if (absT < 3.29) pValue = 0.01;
      else pValue = 0.001;
    } else {
      // Small sample (t-distribution approximation)
      if (absT < 2.0) pValue = 0.1;
      else if (absT < 2.5) pValue = 0.05;
      else if (absT < 3.5) pValue = 0.01;
      else pValue = 0.001;
    }

    const interpretation = pValue > 0.05
      ? 'Correlation not significantly different from zero (p > 0.05)'
      : 'Correlation significantly different from zero (p ≤ 0.05)';

    return {
      pValue: Number(pValue.toFixed(4)),
      interpretation,
    };
  }
}