### **Section 3: Exploratory Data Analysis (EDA) Deep Dive** 📊🔬

This section provides a comprehensive statistical exploration of the dataset. The goal is to understand the data's underlying structure, identify patterns, detect anomalies, and extract key insights. Unless specified, all analyses are performed on the full dataset. Over 60 statistical tests and checks are considered in this module.

**3.1. EDA Methodology Overview:**
* **Approach:** Systematic univariate, bivariate, and multivariate analysis using streaming algorithms.
* **Column Type Classification:** Each column is analysed based on its inferred data type (Numerical, Categorical, Date/Time, Boolean, Text).
* **Statistical Significance:** Standard p-value thresholds (e.g., 0.05) are used where applicable, but effect sizes and practical significance are also considered.
* **Memory-Efficient Processing:** Streaming with online algorithms ensures scalability to large datasets.
* **Sampling Strategy:** Analysis performed on the complete dataset.

**3.2. Univariate Analysis (Per-Column In-Depth Profile):**

*This sub-section provides detailed statistical profiles for each column in the dataset, adapted based on detected data type.*

---
**Column: `Pregnancies`**
* **Detected Data Type:** numerical_integer
* **Inferred Semantic Type:** unknown
* **Data Quality Flag:** Good
* **Quick Stats:**
    * Total Values (Count): 769
    * Missing Values: 1 (0.13%)
    * Unique Values: 17 (2.21% of total)

**3.2.A. Numerical Column Analysis:**

**Descriptive Statistics:**
* Minimum: 0
* Maximum: 17
* Range: 17
* Sum: 2953
* Mean (Arithmetic): 3.845052
* Median (50th Percentile): 3.000098
* Mode(s): [1 (Frequency: 17.58%)]
* Standard Deviation: 3.367384
* Variance: 11.339272
* Coefficient of Variation (CV): 0.8758%

**Quantile & Percentile Statistics:**
* 1st Percentile: 0
* 5th Percentile: 0
* 10th Percentile: 0.007353
* 25th Percentile (Q1 - First Quartile): 1.000228
* 75th Percentile (Q3 - Third Quartile): 6.001038
* 90th Percentile: 8.998297
* 95th Percentile: 10.02935
* 99th Percentile: 12.918969
* Interquartile Range (IQR = Q3 - Q1): 5.00081
* Median Absolute Deviation (MAD): 2.000098

**Distribution Shape & Normality Assessment:**
* Skewness: 0.8999 (Right-skewed (positive skew))
* Kurtosis (Excess): 0.1504 (Mesokurtic (normal-like tails))
* Histogram Analysis: Distribution spans 10 bins
* Normality Tests:
    * Shapiro-Wilk Test: W-statistic = 15.269673, p-value = 0.5 (Data consistent with normal distribution (p > 0.05))
    * Jarque-Bera Test: JB-statistic = 17.149641, p-value = 0.001 (Data significantly deviates from normal distribution (p ≤ 0.05))
    * Kolmogorov-Smirnov Test: D-statistic = 0.186497, p-value = 0.01 (Data significantly deviates from normal distribution (p ≤ 0.05))

**Univariate Outlier Analysis:**
* Method 1: IQR Proximity Rule
    * Lower Fence (Q1 - 1.5 * IQR): -6.500988
    * Upper Fence (Q3 + 1.5 * IQR): 13.502253
    * Number of Outliers (Below Lower): 0 (0%)
    * Number of Outliers (Above Upper): 1 (1%)
    * Extreme Outliers (using 3.0 * IQR factor): 0 (0%)
* Method 2: Z-Score Method
    * Standard Deviations from Mean for Threshold: +/- 3
    * Number of Outliers (Z-score < -3): 0
    * Number of Outliers (Z-score > +3): 1
* Method 3: Modified Z-Score (using MAD)
    * Threshold: +/- 3.5
    * Number of Outliers: 1
* Summary of Outliers: Total 1 (1%). Min Outlier Value: 14, Max Outlier Value: 14.
* Potential Impact: Low outlier impact

**Specific Numerical Patterns & Characteristics:**
* Percentage of Zero Values: 14%
* Percentage of Negative Values: 0%
* Round Numbers Analysis: Moderate rounding detected
* Potential for Log Transformation: Log transformation may not be beneficial

---
**Column: `Glucose`**
* **Detected Data Type:** numerical_integer
* **Inferred Semantic Type:** unknown
* **Data Quality Flag:** Good
* **Quick Stats:**
    * Total Values (Count): 769
    * Missing Values: 1 (0.13%)
    * Unique Values: 86 (11.2% of total)

**3.2.A. Numerical Column Analysis:**

**Descriptive Statistics:**
* Minimum: 0
* Maximum: 199
* Range: 199
* Sum: 92847
* Mean (Arithmetic): 120.894531
* Median (50th Percentile): 117.871224
* Mode(s): [99 (Frequency: 2.21%), 100 (Frequency: 2.21%)]
* Standard Deviation: 31.951796
* Variance: 1020.917262
* Coefficient of Variation (CV): 0.2643%

**Quantile & Percentile Statistics:**
* 1st Percentile: 58.527111
* 5th Percentile: 78.66738
* 10th Percentile: 84.666818
* 25th Percentile (Q1 - First Quartile): 99.12341
* 75th Percentile (Q3 - Third Quartile): 141.922148
* 90th Percentile: 167.207438
* 95th Percentile: 181.190335
* 99th Percentile: 195.644609
* Interquartile Range (IQR = Q3 - Q1): 42.798737
* Median Absolute Deviation (MAD): 21.871224

**Distribution Shape & Normality Assessment:**
* Skewness: 0.1734 (Approximately symmetric)
* Kurtosis (Excess): 0.6288 (Leptokurtic (heavy tails))
* Histogram Analysis: Distribution spans 10 bins
* Normality Tests:
    * Shapiro-Wilk Test: W-statistic = 16.232186, p-value = 0.5 (Data consistent with normal distribution (p > 0.05))
    * Jarque-Bera Test: JB-statistic = 9.46674, p-value = 0.01 (Data significantly deviates from normal distribution (p ≤ 0.05))
    * Kolmogorov-Smirnov Test: D-statistic = 0.091226, p-value = 0.2 (Data consistent with normal distribution (p > 0.05))

**Univariate Outlier Analysis:**
* Method 1: IQR Proximity Rule
    * Lower Fence (Q1 - 1.5 * IQR): 34.925304
    * Upper Fence (Q3 + 1.5 * IQR): 206.120254
    * Number of Outliers (Below Lower): 0 (0%)
    * Number of Outliers (Above Upper): 0 (0%)
    * Extreme Outliers (using 3.0 * IQR factor): 0 (0%)
* Method 2: Z-Score Method
    * Standard Deviations from Mean for Threshold: +/- 3
    * Number of Outliers (Z-score < -3): 0
    * Number of Outliers (Z-score > +3): 0
* Method 3: Modified Z-Score (using MAD)
    * Threshold: +/- 3.5
    * Number of Outliers: 0
* Summary of Outliers: Total 0 (0%). Min Outlier Value: 0, Max Outlier Value: 0.
* Potential Impact: Low outlier impact

**Specific Numerical Patterns & Characteristics:**
* Percentage of Zero Values: 0%
* Percentage of Negative Values: 0%
* Round Numbers Analysis: Moderate rounding detected
* Potential for Log Transformation: Log transformation may not be beneficial

---
**Column: `BloodPressure`**
* **Detected Data Type:** numerical_integer
* **Inferred Semantic Type:** unknown
* **Data Quality Flag:** Good
* **Quick Stats:**
    * Total Values (Count): 769
    * Missing Values: 1 (0.13%)
    * Unique Values: 47 (6.12% of total)

**3.2.A. Numerical Column Analysis:**

**Descriptive Statistics:**
* Minimum: 0
* Maximum: 122
* Range: 122
* Sum: 53073
* Mean (Arithmetic): 69.105469
* Median (50th Percentile): 71.941034
* Mode(s): [70 (Frequency: 7.42%)]
* Standard Deviation: 19.343202
* Variance: 374.159449
* Coefficient of Variation (CV): 0.2799%

**Quantile & Percentile Statistics:**
* 1st Percentile: 0.000002
* 5th Percentile: 43.336553
* 10th Percentile: 53.843383
* 25th Percentile (Q1 - First Quartile): 62.548414
* 75th Percentile (Q3 - Third Quartile): 80.049955
* 90th Percentile: 88.264814
* 95th Percentile: 91.000711
* 99th Percentile: 106.81889
* Interquartile Range (IQR = Q3 - Q1): 17.501542
* Median Absolute Deviation (MAD): 8.058966

**Distribution Shape & Normality Assessment:**
* Skewness: -1.84 (Left-skewed (negative skew))
* Kurtosis (Excess): 5.1387 (Leptokurtic (heavy tails))
* Histogram Analysis: Distribution spans 10 bins
* Normality Tests:
    * Shapiro-Wilk Test: W-statistic = 12.001755, p-value = 0.5 (Data consistent with normal distribution (p > 0.05))
    * Jarque-Bera Test: JB-statistic = 169.005926, p-value = 0.001 (Data significantly deviates from normal distribution (p ≤ 0.05))
    * Kolmogorov-Smirnov Test: D-statistic = 0.095458, p-value = 0.2 (Data consistent with normal distribution (p > 0.05))

**Univariate Outlier Analysis:**
* Method 1: IQR Proximity Rule
    * Lower Fence (Q1 - 1.5 * IQR): 36.296101
    * Upper Fence (Q3 + 1.5 * IQR): 106.302268
    * Number of Outliers (Below Lower): 0 (0%)
    * Number of Outliers (Above Upper): 1 (1%)
    * Extreme Outliers (using 3.0 * IQR factor): 2 (2%)
* Method 2: Z-Score Method
    * Standard Deviations from Mean for Threshold: +/- 3
    * Number of Outliers (Z-score < -3): 2
    * Number of Outliers (Z-score > +3): 0
* Method 3: Modified Z-Score (using MAD)
    * Threshold: +/- 3.5
    * Number of Outliers: 2
* Summary of Outliers: Total 2 (2%). Min Outlier Value: 0, Max Outlier Value: 108.
* Potential Impact: Low outlier impact

**Specific Numerical Patterns & Characteristics:**
* Percentage of Zero Values: 2%
* Percentage of Negative Values: 0%
* Round Numbers Analysis: High proportion of round numbers suggests potential data rounding
* Potential for Log Transformation: Log transformation may not be beneficial

---
**Column: `SkinThickness`**
* **Detected Data Type:** numerical_integer
* **Inferred Semantic Type:** unknown
* **Data Quality Flag:** Good
* **Quick Stats:**
    * Total Values (Count): 769
    * Missing Values: 1 (0.13%)
    * Unique Values: 51 (6.64% of total)

**3.2.A. Numerical Column Analysis:**

**Descriptive Statistics:**
* Minimum: 0
* Maximum: 99
* Range: 99
* Sum: 15772
* Mean (Arithmetic): 20.536458
* Median (50th Percentile): 22.950829
* Mode(s): [0 (Frequency: 29.56%)]
* Standard Deviation: 15.941829
* Variance: 254.1419
* Coefficient of Variation (CV): 0.7763%

**Quantile & Percentile Statistics:**
* 1st Percentile: 0
* 5th Percentile: 0
* 10th Percentile: 0
* 25th Percentile (Q1 - First Quartile): 0.000018
* 75th Percentile (Q3 - Third Quartile): 32.108567
* 90th Percentile: 40.040638
* 95th Percentile: 43.999345
* 99th Percentile: 51.444986
* Interquartile Range (IQR = Q3 - Q1): 32.108549
* Median Absolute Deviation (MAD): 10.049171

**Distribution Shape & Normality Assessment:**
* Skewness: 0.1092 (Approximately symmetric)
* Kurtosis (Excess): -0.5245 (Platykurtic (light tails))
* Histogram Analysis: Distribution spans 10 bins
* Normality Tests:
    * Shapiro-Wilk Test: W-statistic = 14.881931, p-value = 0.5 (Data consistent with normal distribution (p > 0.05))
    * Jarque-Bera Test: JB-statistic = 52.517548, p-value = 0.001 (Data significantly deviates from normal distribution (p ≤ 0.05))
    * Kolmogorov-Smirnov Test: D-statistic = 0.185899, p-value = 0.01 (Data significantly deviates from normal distribution (p ≤ 0.05))

**Univariate Outlier Analysis:**
* Method 1: IQR Proximity Rule
    * Lower Fence (Q1 - 1.5 * IQR): -48.162806
    * Upper Fence (Q3 + 1.5 * IQR): 80.271391
    * Number of Outliers (Below Lower): 0 (0%)
    * Number of Outliers (Above Upper): 1 (1%)
    * Extreme Outliers (using 3.0 * IQR factor): 0 (0%)
* Method 2: Z-Score Method
    * Standard Deviations from Mean for Threshold: +/- 3
    * Number of Outliers (Z-score < -3): 0
    * Number of Outliers (Z-score > +3): 1
* Method 3: Modified Z-Score (using MAD)
    * Threshold: +/- 3.5
    * Number of Outliers: 1
* Summary of Outliers: Total 1 (1%). Min Outlier Value: 99, Max Outlier Value: 99.
* Potential Impact: Low outlier impact

**Specific Numerical Patterns & Characteristics:**
* Percentage of Zero Values: 32%
* Percentage of Negative Values: 0%
* Round Numbers Analysis: High proportion of round numbers suggests potential data rounding
* Potential for Log Transformation: Log transformation may not be beneficial

---
**Column: `Insulin`**
* **Detected Data Type:** numerical_integer
* **Inferred Semantic Type:** unknown
* **Data Quality Flag:** Good
* **Quick Stats:**
    * Total Values (Count): 769
    * Missing Values: 1 (0.13%)
    * Unique Values: 95 (12.37% of total)

**3.2.A. Numerical Column Analysis:**

**Descriptive Statistics:**
* Minimum: 0
* Maximum: 846
* Range: 846
* Sum: 61286
* Mean (Arithmetic): 79.799479
* Median (50th Percentile): 18.531642
* Mode(s): [0 (Frequency: 48.7%)]
* Standard Deviation: 115.168949
* Variance: 13263.886875
* Coefficient of Variation (CV): 1.4432%

**Quantile & Percentile Statistics:**
* 1st Percentile: 0
* 5th Percentile: 0
* 10th Percentile: 0
* 25th Percentile (Q1 - First Quartile): 0
* 75th Percentile (Q3 - Third Quartile): 132.357342
* 90th Percentile: 209.530889
* 95th Percentile: 292.942957
* 99th Percentile: 536.600948
* Interquartile Range (IQR = Q3 - Q1): 132.357342
* Median Absolute Deviation (MAD): 46.468358

**Distribution Shape & Normality Assessment:**
* Skewness: 2.2678 (Right-skewed (positive skew))
* Kurtosis (Excess): 7.1596 (Leptokurtic (heavy tails))
* Histogram Analysis: Distribution spans 10 bins
* Normality Tests:
    * Shapiro-Wilk Test: W-statistic = 13.206303, p-value = 0.5 (Data consistent with normal distribution (p > 0.05))
    * Jarque-Bera Test: JB-statistic = 122.631624, p-value = 0.001 (Data significantly deviates from normal distribution (p ≤ 0.05))
    * Kolmogorov-Smirnov Test: D-statistic = 0.208923, p-value = 0.01 (Data significantly deviates from normal distribution (p ≤ 0.05))

**Univariate Outlier Analysis:**
* Method 1: IQR Proximity Rule
    * Lower Fence (Q1 - 1.5 * IQR): -198.536013
    * Upper Fence (Q3 + 1.5 * IQR): 330.893355
    * Number of Outliers (Below Lower): 0 (0%)
    * Number of Outliers (Above Upper): 2 (2%)
    * Extreme Outliers (using 3.0 * IQR factor): 2 (2%)
* Method 2: Z-Score Method
    * Standard Deviations from Mean for Threshold: +/- 3
    * Number of Outliers (Z-score < -3): 0
    * Number of Outliers (Z-score > +3): 3
* Method 3: Modified Z-Score (using MAD)
    * Threshold: +/- 3.5
    * Number of Outliers: 9
* Summary of Outliers: Total 8 (8%). Min Outlier Value: 285, Max Outlier Value: 600.
* Potential Impact: High outlier presence may affect analysis

**Specific Numerical Patterns & Characteristics:**
* Percentage of Zero Values: 42%
* Percentage of Negative Values: 0%
* Round Numbers Analysis: High proportion of round numbers suggests potential data rounding
* Potential for Log Transformation: Log transformation may not be beneficial

---
**Column: `BMI`**
* **Detected Data Type:** numerical_float
* **Inferred Semantic Type:** unknown
* **Data Quality Flag:** Good
* **Quick Stats:**
    * Total Values (Count): 769
    * Missing Values: 1 (0.13%)
    * Unique Values: 85 (11.07% of total)

**3.2.A. Numerical Column Analysis:**

**Descriptive Statistics:**
* Minimum: 0
* Maximum: 67.1
* Range: 67.1
* Sum: 24570.3
* Mean (Arithmetic): 31.992578
* Median (50th Percentile): 32.053601
* Mode(s): [32 (Frequency: 1.69%)]
* Standard Deviation: 7.879026
* Variance: 62.079046
* Coefficient of Variation (CV): 0.2463%

**Quantile & Percentile Statistics:**
* 1st Percentile: 6.684985
* 5th Percentile: 21.346544
* 10th Percentile: 23.629447
* 25th Percentile (Q1 - First Quartile): 27.349215
* 75th Percentile (Q3 - Third Quartile): 36.808081
* 90th Percentile: 41.370489
* 95th Percentile: 44.637748
* 99th Percentile: 52.25088
* Interquartile Range (IQR = Q3 - Q1): 9.458866
* Median Absolute Deviation (MAD): 4.353601

**Distribution Shape & Normality Assessment:**
* Skewness: -0.4281 (Approximately symmetric)
* Kurtosis (Excess): 3.2613 (Leptokurtic (heavy tails))
* Histogram Analysis: Distribution spans 10 bins
* Normality Tests:
    * Shapiro-Wilk Test: W-statistic = 13.474569, p-value = 0.5 (Data consistent with normal distribution (p > 0.05))
    * Jarque-Bera Test: JB-statistic = 43.280978, p-value = 0.001 (Data significantly deviates from normal distribution (p ≤ 0.05))
    * Kolmogorov-Smirnov Test: D-statistic = 0.07117, p-value = 0.2 (Data consistent with normal distribution (p > 0.05))

**Univariate Outlier Analysis:**
* Method 1: IQR Proximity Rule
    * Lower Fence (Q1 - 1.5 * IQR): 13.160916
    * Upper Fence (Q3 + 1.5 * IQR): 50.99638
    * Number of Outliers (Below Lower): 1 (1%)
    * Number of Outliers (Above Upper): 1 (1%)
    * Extreme Outliers (using 3.0 * IQR factor): 0 (0%)
* Method 2: Z-Score Method
    * Standard Deviations from Mean for Threshold: +/- 3
    * Number of Outliers (Z-score < -3): 1
    * Number of Outliers (Z-score > +3): 0
* Method 3: Modified Z-Score (using MAD)
    * Threshold: +/- 3.5
    * Number of Outliers: 1
* Summary of Outliers: Total 2 (2%). Min Outlier Value: 0, Max Outlier Value: 52.9.
* Potential Impact: Low outlier impact

**Specific Numerical Patterns & Characteristics:**
* Percentage of Zero Values: 1%
* Percentage of Negative Values: 0%
* Round Numbers Analysis: No significant rounding detected
* Potential for Log Transformation: Log transformation may not be beneficial

---
**Column: `DiabetesPedigreeFunction`**
* **Detected Data Type:** numerical_float
* **Inferred Semantic Type:** unknown
* **Data Quality Flag:** Good
* **Quick Stats:**
    * Total Values (Count): 769
    * Missing Values: 1 (0.13%)
    * Unique Values: 89 (11.59% of total)

**3.2.A. Numerical Column Analysis:**

**Descriptive Statistics:**
* Minimum: 0.078
* Maximum: 2.42
* Range: 2.342
* Sum: 362.401
* Mean (Arithmetic): 0.471876
* Median (50th Percentile): 0.376209
* Mode(s): [0.254 (Frequency: 0.78%), 0.258 (Frequency: 0.78%)]
* Standard Deviation: 0.331113
* Variance: 0.109636
* Coefficient of Variation (CV): 0.7017%

**Quantile & Percentile Statistics:**
* 1st Percentile: 0.095826
* 5th Percentile: 0.139492
* 10th Percentile: 0.155343
* 25th Percentile (Q1 - First Quartile): 0.247556
* 75th Percentile (Q3 - Third Quartile): 0.627208
* 90th Percentile: 0.880749
* 95th Percentile: 1.118569
* 99th Percentile: 1.668418
* Interquartile Range (IQR = Q3 - Q1): 0.379652
* Median Absolute Deviation (MAD): 0.178209

**Distribution Shape & Normality Assessment:**
* Skewness: 1.9162 (Right-skewed (positive skew))
* Kurtosis (Excess): 5.5508 (Leptokurtic (heavy tails))
* Histogram Analysis: Distribution spans 10 bins
* Normality Tests:
    * Shapiro-Wilk Test: W-statistic = 13.958352, p-value = 0.5 (Data consistent with normal distribution (p > 0.05))
    * Jarque-Bera Test: JB-statistic = 43.921043, p-value = 0.001 (Data significantly deviates from normal distribution (p ≤ 0.05))
    * Kolmogorov-Smirnov Test: D-statistic = 0.145177, p-value = 0.05 (Data significantly deviates from normal distribution (p ≤ 0.05))

**Univariate Outlier Analysis:**
* Method 1: IQR Proximity Rule
    * Lower Fence (Q1 - 1.5 * IQR): -0.321923
    * Upper Fence (Q3 + 1.5 * IQR): 1.196687
    * Number of Outliers (Below Lower): 0 (0%)
    * Number of Outliers (Above Upper): 3 (3%)
    * Extreme Outliers (using 3.0 * IQR factor): 0 (0%)
* Method 2: Z-Score Method
    * Standard Deviations from Mean for Threshold: +/- 3
    * Number of Outliers (Z-score < -3): 0
    * Number of Outliers (Z-score > +3): 1
* Method 3: Modified Z-Score (using MAD)
    * Threshold: +/- 3.5
    * Number of Outliers: 1
* Summary of Outliers: Total 3 (3%). Min Outlier Value: 1.213, Max Outlier Value: 1.698.
* Potential Impact: Low outlier impact

**Specific Numerical Patterns & Characteristics:**
* Percentage of Zero Values: 0%
* Percentage of Negative Values: 0%
* Round Numbers Analysis: No significant rounding detected
* Potential for Log Transformation: Log transformation may not be beneficial

---
**Column: `Age`**
* **Detected Data Type:** numerical_integer
* **Inferred Semantic Type:** age
* **Data Quality Flag:** Good
* **Quick Stats:**
    * Total Values (Count): 769
    * Missing Values: 1 (0.13%)
    * Unique Values: 52 (6.77% of total)

**3.2.A. Numerical Column Analysis:**

**Descriptive Statistics:**
* Minimum: 21
* Maximum: 81
* Range: 60
* Sum: 25529
* Mean (Arithmetic): 33.240885
* Median (50th Percentile): 28.994398
* Mode(s): [22 (Frequency: 9.38%)]
* Standard Deviation: 11.752573
* Variance: 138.122964
* Coefficient of Variation (CV): 0.3536%

**Quantile & Percentile Statistics:**
* 1st Percentile: 21
* 5th Percentile: 21.107338
* 10th Percentile: 21.999817
* 25th Percentile (Q1 - First Quartile): 23.999952
* 75th Percentile (Q3 - Third Quartile): 39.61273
* 90th Percentile: 50.807217
* 95th Percentile: 57.839718
* 99th Percentile: 67.622475
* Interquartile Range (IQR = Q3 - Q1): 15.612778
* Median Absolute Deviation (MAD): 6.994398

**Distribution Shape & Normality Assessment:**
* Skewness: 1.1274 (Right-skewed (positive skew))
* Kurtosis (Excess): 0.6312 (Leptokurtic (heavy tails))
* Histogram Analysis: Distribution spans 10 bins
* Normality Tests:
    * Shapiro-Wilk Test: W-statistic = 14.730592, p-value = 0.5 (Data consistent with normal distribution (p > 0.05))
    * Jarque-Bera Test: JB-statistic = 34.669392, p-value = 0.001 (Data significantly deviates from normal distribution (p ≤ 0.05))
    * Kolmogorov-Smirnov Test: D-statistic = 0.123817, p-value = 0.2 (Data consistent with normal distribution (p > 0.05))

**Univariate Outlier Analysis:**
* Method 1: IQR Proximity Rule
    * Lower Fence (Q1 - 1.5 * IQR): 0.580785
    * Upper Fence (Q3 + 1.5 * IQR): 63.031896
    * Number of Outliers (Below Lower): 0 (0%)
    * Number of Outliers (Above Upper): 3 (3%)
    * Extreme Outliers (using 3.0 * IQR factor): 0 (0%)
* Method 2: Z-Score Method
    * Standard Deviations from Mean for Threshold: +/- 3
    * Number of Outliers (Z-score < -3): 0
    * Number of Outliers (Z-score > +3): 1
* Method 3: Modified Z-Score (using MAD)
    * Threshold: +/- 3.5
    * Number of Outliers: 3
* Summary of Outliers: Total 3 (3%). Min Outlier Value: 66, Max Outlier Value: 81.
* Potential Impact: Low outlier impact

**Specific Numerical Patterns & Characteristics:**
* Percentage of Zero Values: 0%
* Percentage of Negative Values: 0%
* Round Numbers Analysis: No significant rounding detected
* Potential for Log Transformation: Log transformation may not be beneficial

---
**Column: `Outcome`**
* **Detected Data Type:** boolean
* **Inferred Semantic Type:** status
* **Data Quality Flag:** Good
* **Quick Stats:**
    * Total Values (Count): 769
    * Missing Values: 1 (0.13%)
    * Unique Values: 2 (0.26% of total)

**3.2.D. Boolean Column Analysis:**

**Frequency Distribution:**
* Count of True: 268 (34.9%)
* Count of False: 500 (65.1%)
* Interpretation: Balanced distribution

**3.3. Bivariate Analysis (Exploring Relationships Between Pairs of Variables):**

**Numerical vs. Numerical:**
    * **Correlation Matrix Summary (Pearson's r):**
        * Total Pairs Analysed: 28
        * Top 5 Strongest Positive Correlations:
        1. `Pregnancies` vs `Age`: r = 0.5443 (Correlation significantly different from zero (p ≤ 0.05)) - Moderate positive correlation (Correlation significantly different from zero (p ≤ 0.05)).
        2. `SkinThickness` vs `Insulin`: r = 0.4368 (Correlation significantly different from zero (p ≤ 0.05)) - Moderate positive correlation (Correlation significantly different from zero (p ≤ 0.05)).
        3. `SkinThickness` vs `BMI`: r = 0.3926 (Correlation significantly different from zero (p ≤ 0.05)) - Weak positive correlation (Correlation significantly different from zero (p ≤ 0.05)).
        4. `Glucose` vs `Insulin`: r = 0.3314 (Correlation significantly different from zero (p ≤ 0.05)) - Weak positive correlation (Correlation significantly different from zero (p ≤ 0.05)).
        5. `BloodPressure` vs `BMI`: r = 0.2818 (Correlation significantly different from zero (p ≤ 0.05)) - Weak positive correlation (Correlation significantly different from zero (p ≤ 0.05)).
        * Top 5 Strongest Negative Correlations:
        1. `SkinThickness` vs `Age`: r = -0.114 (Correlation significantly different from zero (p ≤ 0.05)) - Very Weak negative correlation (Correlation significantly different from zero (p ≤ 0.05)).
        2. `Pregnancies` vs `SkinThickness`: r = -0.0817 (Correlation significantly different from zero (p ≤ 0.05)) - Very Weak negative correlation (Correlation significantly different from zero (p ≤ 0.05)).
        3. `Pregnancies` vs `Insulin`: r = -0.0735 (Correlation significantly different from zero (p ≤ 0.05)) - Very Weak negative correlation (Correlation significantly different from zero (p ≤ 0.05)).
        4. `Insulin` vs `Age`: r = -0.0422 (Correlation not significantly different from zero (p > 0.05)) - Very Weak negative correlation (Correlation not significantly different from zero (p > 0.05)).
        5. `Pregnancies` vs `DiabetesPedigreeFunction`: r = -0.0335 (Correlation not significantly different from zero (p > 0.05)) - Very Weak negative correlation (Correlation not significantly different from zero (p > 0.05)).
        * Strong Correlations (|r| > 0.5): 1 pairs identified
    * **Scatter Plot Insights (Key Relationships):**
        * `Pregnancies` vs `Glucose`: "50 point sample shows linear relationship" (Recommended: Scatter plot with trend line)
        * `Pregnancies` vs `BloodPressure`: "50 point sample shows linear relationship" (Recommended: Scatter plot with trend line)
        * `Pregnancies` vs `SkinThickness`: "50 point sample shows linear relationship" (Recommended: Scatter plot with trend line)

**3.4. Multivariate Analysis (Preliminary Insights into Complex Interactions):**
    * **Principal Component Analysis:** Not applicable - insufficient numerical variables.

    * **Cluster Analysis:** Not performed - data characteristics not suitable for clustering.

    * **Feature Interactions:** No significant interactions detected.

**3.5. Specific Analysis Modules (Activated Based on Data Characteristics):**

    * **No Specific Modules Activated:** Dataset does not contain sufficient datetime or rich text columns for specialized analysis modules.

**3.6. EDA Summary & Key Hypotheses/Insights:**
    * **Top Statistical Findings:**
    1. Streaming analysis processed 769 rows using only 12MB peak memory
    * **Data Quality Issues Uncovered:**
    * No major data quality issues identified during EDA.
    * **Hypotheses Generated for Further Testing:**
    * No specific hypotheses generated - consider domain knowledge for hypothesis formation.
    * **Recommendations for Data Preprocessing & Feature Engineering:**
    * Standard preprocessing steps recommended based on detected data types.
    * **Critical Warnings & Considerations:**
    * No critical warnings identified.



---

**Analysis Performance Summary:**
* **Processing Time:** 24ms (0.02 seconds)
* **Rows Analysed:** 769
* **Memory Efficiency:** Constant ~12MB usage
* **Analysis Method:** Streaming with online algorithms
* **Dataset Size:** 769 records across 9 columns