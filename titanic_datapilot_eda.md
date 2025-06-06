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
**Column: `PassengerId`**
* **Detected Data Type:** numerical_integer
* **Inferred Semantic Type:** identifier
* **Data Quality Flag:** Good
* **Quick Stats:**
    * Total Values (Count): 892
    * Missing Values: 1 (0.11%)
    * Unique Values: 93 (10.44% of total)

**3.2.A. Numerical Column Analysis:**

**Descriptive Statistics:**
* Minimum: 1
* Maximum: 891
* Range: 890
* Sum: 397386
* Mean (Arithmetic): 446
* Median (50th Percentile): 445
* Mode(s): [1 (Frequency: 0.11%), 2 (Frequency: 0.11%), 3 (Frequency: 0.11%), 4 (Frequency: 0.11%), 5 (Frequency: 0.11%)]
* Standard Deviation: 257.209383
* Variance: 66156.666667
* Coefficient of Variation (CV): 0.5767%

**Quantile & Percentile Statistics:**
* 1st Percentile: 9
* 5th Percentile: 45
* 10th Percentile: 89
* 25th Percentile (Q1 - First Quartile): 223
* 75th Percentile (Q3 - Third Quartile): 667
* 90th Percentile: 800
* 95th Percentile: 844
* 99th Percentile: 880
* Interquartile Range (IQR = Q3 - Q1): 444
* Median Absolute Deviation (MAD): 251

**Distribution Shape & Normality Assessment:**
* Skewness: 0 (Approximately symmetric)
* Kurtosis (Excess): -1.2 (Platykurtic (light tails))
* Histogram Analysis: Distribution spans 10 bins
* Normality Tests:
    * Shapiro-Wilk Test: W-statistic = 19.333763, p-value = 0.5 (Data consistent with normal distribution (p > 0.05))
    * Jarque-Bera Test: JB-statistic = 7.477617, p-value = 0.05 (Data significantly deviates from normal distribution (p ≤ 0.05))
    * Kolmogorov-Smirnov Test: D-statistic = 0.097181, p-value = 0.2 (Data consistent with normal distribution (p > 0.05))

**Univariate Outlier Analysis:**
* Method 1: IQR Proximity Rule
    * Lower Fence (Q1 - 1.5 * IQR): -443
    * Upper Fence (Q3 + 1.5 * IQR): 1333
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
**Column: `Survived`**
* **Detected Data Type:** boolean
* **Inferred Semantic Type:** status
* **Data Quality Flag:** Good
* **Quick Stats:**
    * Total Values (Count): 892
    * Missing Values: 1 (0.11%)
    * Unique Values: 2 (0.22% of total)

**3.2.D. Boolean Column Analysis:**

**Frequency Distribution:**
* Count of True: 342 (38.38%)
* Count of False: 549 (61.62%)
* Interpretation: Balanced distribution

---
**Column: `Pclass`**
* **Detected Data Type:** numerical_integer
* **Inferred Semantic Type:** unknown
* **Data Quality Flag:** Good
* **Quick Stats:**
    * Total Values (Count): 892
    * Missing Values: 1 (0.11%)
    * Unique Values: 3 (0.34% of total)

**3.2.A. Numerical Column Analysis:**

**Descriptive Statistics:**
* Minimum: 1
* Maximum: 3
* Range: 2
* Sum: 2057
* Mean (Arithmetic): 2.308642
* Median (50th Percentile): 2.99957
* Mode(s): [3 (Frequency: 55.11%)]
* Standard Deviation: 0.835602
* Variance: 0.698231
* Coefficient of Variation (CV): 0.3619%

**Quantile & Percentile Statistics:**
* 1st Percentile: 1
* 5th Percentile: 1
* 10th Percentile: 1.000002
* 25th Percentile (Q1 - First Quartile): 1.979992
* 75th Percentile (Q3 - Third Quartile): 3
* 90th Percentile: 3
* 95th Percentile: 3
* 99th Percentile: 3
* Interquartile Range (IQR = Q3 - Q1): 1.020008
* Median Absolute Deviation (MAD): 0.00043

**Distribution Shape & Normality Assessment:**
* Skewness: -0.6295 (Left-skewed (negative skew))
* Kurtosis (Excess): -1.2796 (Platykurtic (light tails))
* Histogram Analysis: Distribution spans 10 bins
* Normality Tests:
    * Shapiro-Wilk Test: W-statistic = 17.016807, p-value = 0.5 (Data consistent with normal distribution (p > 0.05))
    * Jarque-Bera Test: JB-statistic = 14.173114, p-value = 0.001 (Data significantly deviates from normal distribution (p ≤ 0.05))
    * Kolmogorov-Smirnov Test: D-statistic = 0.344146, p-value = 0.01 (Data significantly deviates from normal distribution (p ≤ 0.05))

**Univariate Outlier Analysis:**
* Method 1: IQR Proximity Rule
    * Lower Fence (Q1 - 1.5 * IQR): 0.449979
    * Upper Fence (Q3 + 1.5 * IQR): 4.530013
    * Number of Outliers (Below Lower): 0 (0%)
    * Number of Outliers (Above Upper): 0 (0%)
    * Extreme Outliers (using 3.0 * IQR factor): 0 (0%)
* Method 2: Z-Score Method
    * Standard Deviations from Mean for Threshold: +/- 3
    * Number of Outliers (Z-score < -3): 0
    * Number of Outliers (Z-score > +3): 0
* Method 3: Modified Z-Score (using MAD)
    * Threshold: +/- 3.5
    * Number of Outliers: 44
* Summary of Outliers: Total 2 (2%). Min Outlier Value: 1, Max Outlier Value: 2.
* Potential Impact: Low outlier impact

**Specific Numerical Patterns & Characteristics:**
* Percentage of Zero Values: 0%
* Percentage of Negative Values: 0%
* Round Numbers Analysis: No significant rounding detected
* Potential for Log Transformation: Log transformation may not be beneficial

---
**Column: `Name`**
* **Detected Data Type:** text_general
* **Inferred Semantic Type:** category
* **Data Quality Flag:** Good
* **Quick Stats:**
    * Total Values (Count): 892
    * Missing Values: 0 (0%)
    * Unique Values: 892 (100% of total)

**3.2.E. Text Column Analysis:**

**Length-Based Statistics (Characters):**
* Minimum Length: 4
* Maximum Length: 57
* Average Length: 27.54
* Median Length: 26
* Standard Deviation of Length: 9.84

**Word Count Statistics:**
* Minimum Word Count: 1
* Maximum Word Count: 8
* Average Word Count: 4.08

**Common Patterns:**
* Percentage of Empty Strings: 0%
* Percentage of Purely Numeric Text: 0%
* URLs Found: 0 (0%)
* Email Addresses Found: 0 (0%)

**Top 5 Most Frequent Words:** [miss, mrs, william, john, master]

---
**Column: `Sex`**
* **Detected Data Type:** categorical
* **Inferred Semantic Type:** category
* **Data Quality Flag:** Good
* **Quick Stats:**
    * Total Values (Count): 892
    * Missing Values: 0 (0%)
    * Unique Values: 3 (0.34% of total)

**3.2.B. Categorical Column Analysis:**

**Frequency & Proportionality:**
* Number of Unique Categories: 3
* Mode (Most Frequent Category): `male` (Frequency: 577, 64.69%)
* Second Most Frequent Category: `female` (Frequency: 314, 35.2%)
* Least Frequent Category: `Sex` (Frequency: 1, 0.11%)
* Frequency Distribution Table (Top 10):

| Category Label | Count | Percentage (%) | Cumulative % |
|----------------|-------|----------------|--------------|
| male | 577 | 64.69% | 64.69% |
| female | 314 | 35.2% | 99.89% |
| Sex | 1 | 0.11% | 100% |

**Diversity & Balance:**
* Shannon Entropy: 0.9478 (Range: 0 to 1.585)
* Gini Impurity: 0.4577
* Interpretation of Balance: Unbalanced distribution
* Major Category Dominance: Major category present

**Category Label Analysis:**
* Minimum Label Length: 3 characters
* Maximum Label Length: 6 characters
* Average Label Length: 4.7 characters
* Empty String or Null-like Labels: 0 occurrences

**Potential Issues & Recommendations:**


* No significant issues detected.

---
**Column: `Age`**
* **Detected Data Type:** numerical_integer
* **Inferred Semantic Type:** age
* **Data Quality Flag:** Moderate
* **Quick Stats:**
    * Total Values (Count): 892
    * Missing Values: 178 (19.96%)
    * Unique Values: 88 (12.32% of total)

**3.2.A. Numerical Column Analysis:**

**Descriptive Statistics:**
* Minimum: 0.42
* Maximum: 80
* Range: 79.58
* Sum: 21205.17
* Mean (Arithmetic): 29.699118
* Median (50th Percentile): 29.728458
* Mode(s): [24 (Frequency: 4.2%)]
* Standard Deviation: 14.516321
* Variance: 210.72358
* Coefficient of Variation (CV): 0.4888%

**Quantile & Percentile Statistics:**
* 1st Percentile: 1.039918
* 5th Percentile: 3.929489
* 10th Percentile: 13.704472
* 25th Percentile (Q1 - First Quartile): 19.497736
* 75th Percentile (Q3 - Third Quartile): 38.670529
* 90th Percentile: 49.756591
* 95th Percentile: 56.000607
* 99th Percentile: 65.467279
* Interquartile Range (IQR = Q3 - Q1): 19.172793
* Median Absolute Deviation (MAD): 9.728458

**Distribution Shape & Normality Assessment:**
* Skewness: 0.3883 (Approximately symmetric)
* Kurtosis (Excess): 0.1686 (Mesokurtic (normal-like tails))
* Histogram Analysis: Distribution spans 10 bins
* Normality Tests:
    * Shapiro-Wilk Test: W-statistic = 16.682282, p-value = 0.5 (Data consistent with normal distribution (p > 0.05))
    * Jarque-Bera Test: JB-statistic = 1.302547, p-value = 0.2 (Data consistent with normal distribution (p > 0.05))
    * Kolmogorov-Smirnov Test: D-statistic = 0.070112, p-value = 0.2 (Data consistent with normal distribution (p > 0.05))

**Univariate Outlier Analysis:**
* Method 1: IQR Proximity Rule
    * Lower Fence (Q1 - 1.5 * IQR): -9.261454
    * Upper Fence (Q3 + 1.5 * IQR): 67.429719
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
**Column: `SibSp`**
* **Detected Data Type:** numerical_integer
* **Inferred Semantic Type:** unknown
* **Data Quality Flag:** Good
* **Quick Stats:**
    * Total Values (Count): 892
    * Missing Values: 1 (0.11%)
    * Unique Values: 7 (0.79% of total)

**3.2.A. Numerical Column Analysis:**

**Descriptive Statistics:**
* Minimum: 0
* Maximum: 8
* Range: 8
* Sum: 466
* Mean (Arithmetic): 0.523008
* Median (50th Percentile): 0.003576
* Mode(s): [0 (Frequency: 68.24%)]
* Standard Deviation: 1.102124
* Variance: 1.214678
* Coefficient of Variation (CV): 2.1073%

**Quantile & Percentile Statistics:**
* 1st Percentile: 0
* 5th Percentile: 0
* 10th Percentile: 0
* 25th Percentile (Q1 - First Quartile): 0
* 75th Percentile (Q3 - Third Quartile): 0.999989
* 90th Percentile: 1.004897
* 95th Percentile: 2.029029
* 99th Percentile: 4.662078
* Interquartile Range (IQR = Q3 - Q1): 0.999989
* Median Absolute Deviation (MAD): 0.003576

**Distribution Shape & Normality Assessment:**
* Skewness: 3.6891 (Right-skewed (positive skew))
* Kurtosis (Excess): 17.7735 (Leptokurtic (heavy tails))
* Histogram Analysis: Distribution spans 10 bins
* Normality Tests:
    * Shapiro-Wilk Test: W-statistic = 7.279521, p-value = 0.5 (Data consistent with normal distribution (p > 0.05))
    * Jarque-Bera Test: JB-statistic = 1621.225618, p-value = 0.001 (Data significantly deviates from normal distribution (p ≤ 0.05))
    * Kolmogorov-Smirnov Test: D-statistic = 0.314334, p-value = 0.01 (Data significantly deviates from normal distribution (p ≤ 0.05))

**Univariate Outlier Analysis:**
* Method 1: IQR Proximity Rule
    * Lower Fence (Q1 - 1.5 * IQR): -1.499983
    * Upper Fence (Q3 + 1.5 * IQR): 2.499971
    * Number of Outliers (Below Lower): 0 (0%)
    * Number of Outliers (Above Upper): 3 (3%)
    * Extreme Outliers (using 3.0 * IQR factor): 2 (2%)
* Method 2: Z-Score Method
    * Standard Deviations from Mean for Threshold: +/- 3
    * Number of Outliers (Z-score < -3): 0
    * Number of Outliers (Z-score > +3): 2
* Method 3: Modified Z-Score (using MAD)
    * Threshold: +/- 3.5
    * Number of Outliers: 39
* Summary of Outliers: Total 5 (5%). Min Outlier Value: 1, Max Outlier Value: 8.
* Potential Impact: Low outlier impact

**Specific Numerical Patterns & Characteristics:**
* Percentage of Zero Values: 61%
* Percentage of Negative Values: 0%
* Round Numbers Analysis: High proportion of round numbers suggests potential data rounding
* Potential for Log Transformation: Log transformation may not be beneficial

---
**Column: `Parch`**
* **Detected Data Type:** numerical_integer
* **Inferred Semantic Type:** unknown
* **Data Quality Flag:** Good
* **Quick Stats:**
    * Total Values (Count): 892
    * Missing Values: 1 (0.11%)
    * Unique Values: 7 (0.79% of total)

**3.2.A. Numerical Column Analysis:**

**Descriptive Statistics:**
* Minimum: 0
* Maximum: 6
* Range: 6
* Sum: 340
* Mean (Arithmetic): 0.381594
* Median (50th Percentile): 0.000051
* Mode(s): [0 (Frequency: 76.09%)]
* Standard Deviation: 0.805605
* Variance: 0.648999
* Coefficient of Variation (CV): 2.1112%

**Quantile & Percentile Statistics:**
* 1st Percentile: 0
* 5th Percentile: 0
* 10th Percentile: 0
* 25th Percentile (Q1 - First Quartile): 0
* 75th Percentile (Q3 - Third Quartile): 0.020614
* 90th Percentile: 1.946671
* 95th Percentile: 2.000049
* 99th Percentile: 3.846925
* Interquartile Range (IQR = Q3 - Q1): 0.020614
* Median Absolute Deviation (MAD): 0.000051

**Distribution Shape & Normality Assessment:**
* Skewness: 2.7445 (Right-skewed (positive skew))
* Kurtosis (Excess): 9.7166 (Leptokurtic (heavy tails))
* Histogram Analysis: Distribution spans 10 bins
* Normality Tests:
    * Shapiro-Wilk Test: W-statistic = 3.703444, p-value = 0.5 (Data consistent with normal distribution (p > 0.05))
    * Jarque-Bera Test: JB-statistic = 1211.161992, p-value = 0.001 (Data significantly deviates from normal distribution (p ≤ 0.05))
    * Kolmogorov-Smirnov Test: D-statistic = 0.479124, p-value = 0.01 (Data significantly deviates from normal distribution (p ≤ 0.05))

**Univariate Outlier Analysis:**
* Method 1: IQR Proximity Rule
    * Lower Fence (Q1 - 1.5 * IQR): -0.030921
    * Upper Fence (Q3 + 1.5 * IQR): 0.051536
    * Number of Outliers (Below Lower): 0 (0%)
    * Number of Outliers (Above Upper): 0 (0%)
    * Extreme Outliers (using 3.0 * IQR factor): 17 (17%)
* Method 2: Z-Score Method
    * Standard Deviations from Mean for Threshold: +/- 3
    * Number of Outliers (Z-score < -3): 0
    * Number of Outliers (Z-score > +3): 1
* Method 3: Modified Z-Score (using MAD)
    * Threshold: +/- 3.5
    * Number of Outliers: 17
* Summary of Outliers: Total 3 (3%). Min Outlier Value: 1, Max Outlier Value: 4.
* Potential Impact: Low outlier impact

**Specific Numerical Patterns & Characteristics:**
* Percentage of Zero Values: 83%
* Percentage of Negative Values: 0%
* Round Numbers Analysis: High proportion of round numbers suggests potential data rounding
* Potential for Log Transformation: Log transformation may not be beneficial

---
**Column: `Ticket`**
* **Detected Data Type:** text_general
* **Inferred Semantic Type:** category
* **Data Quality Flag:** Good
* **Quick Stats:**
    * Total Values (Count): 892
    * Missing Values: 0 (0%)
    * Unique Values: 892 (100% of total)

**3.2.E. Text Column Analysis:**

**Length-Based Statistics (Characters):**
* Minimum Length: 4
* Maximum Length: 16
* Average Length: 6.85
* Median Length: 6
* Standard Deviation of Length: 2.39

**Word Count Statistics:**
* Minimum Word Count: 1
* Maximum Word Count: 2
* Average Word Count: 1.3

**Common Patterns:**
* Percentage of Empty Strings: 0%
* Percentage of Purely Numeric Text: 74.1%
* URLs Found: 0 (0%)
* Email Addresses Found: 0 (0%)

**Top 5 Most Frequent Words:** [ston, soton, 347082, 382652, 347077]

---
**Column: `Fare`**
* **Detected Data Type:** numerical_float
* **Inferred Semantic Type:** unknown
* **Data Quality Flag:** Good
* **Quick Stats:**
    * Total Values (Count): 892
    * Missing Values: 1 (0.11%)
    * Unique Values: 91 (10.21% of total)

**3.2.A. Numerical Column Analysis:**

**Descriptive Statistics:**
* Minimum: 0
* Maximum: 512.3292
* Range: 512.3292
* Sum: 28693.9493
* Mean (Arithmetic): 32.204208
* Median (50th Percentile): 13.237763
* Mode(s): [8.05 (Frequency: 4.83%)]
* Standard Deviation: 49.665534
* Variance: 2466.665312
* Coefficient of Variation (CV): 1.5422%

**Quantile & Percentile Statistics:**
* 1st Percentile: 1.457902
* 5th Percentile: 7.149424
* 10th Percentile: 7.489468
* 25th Percentile (Q1 - First Quartile): 7.919215
* 75th Percentile (Q3 - Third Quartile): 31.272539
* 90th Percentile: 90.8764
* 95th Percentile: 135.337211
* 99th Percentile: 265.372321
* Interquartile Range (IQR = Q3 - Q1): 23.353323
* Median Absolute Deviation (MAD): 5.987763

**Distribution Shape & Normality Assessment:**
* Skewness: 4.7793 (Right-skewed (positive skew))
* Kurtosis (Excess): 33.2043 (Leptokurtic (heavy tails))
* Histogram Analysis: Distribution spans 10 bins
* Normality Tests:
    * Shapiro-Wilk Test: W-statistic = 7.455583, p-value = 0.5 (Data consistent with normal distribution (p > 0.05))
    * Jarque-Bera Test: JB-statistic = 515.935385, p-value = 0.001 (Data significantly deviates from normal distribution (p ≤ 0.05))
    * Kolmogorov-Smirnov Test: D-statistic = 0.254679, p-value = 0.01 (Data significantly deviates from normal distribution (p ≤ 0.05))

**Univariate Outlier Analysis:**
* Method 1: IQR Proximity Rule
    * Lower Fence (Q1 - 1.5 * IQR): -27.11077
    * Upper Fence (Q3 + 1.5 * IQR): 66.302524
    * Number of Outliers (Below Lower): 0 (0%)
    * Number of Outliers (Above Upper): 6 (6%)
    * Extreme Outliers (using 3.0 * IQR factor): 5 (5%)
* Method 2: Z-Score Method
    * Standard Deviations from Mean for Threshold: +/- 3
    * Number of Outliers (Z-score < -3): 0
    * Number of Outliers (Z-score > +3): 1
* Method 3: Modified Z-Score (using MAD)
    * Threshold: +/- 3.5
    * Number of Outliers: 16
* Summary of Outliers: Total 15 (15%). Min Outlier Value: 46.9, Max Outlier Value: 211.3375.
* Potential Impact: High outlier presence may affect analysis

**Specific Numerical Patterns & Characteristics:**
* Percentage of Zero Values: 1%
* Percentage of Negative Values: 0%
* Round Numbers Analysis: No significant rounding detected
* Potential for Log Transformation: Log transformation may not be beneficial

---
**Column: `Cabin`**
* **Detected Data Type:** text_general
* **Inferred Semantic Type:** category
* **Data Quality Flag:** Poor
* **Quick Stats:**
    * Total Values (Count): 892
    * Missing Values: 687 (77.02%)
    * Unique Values: 205 (22.98% of total)

**3.2.E. Text Column Analysis:**

**Length-Based Statistics (Characters):**
* Minimum Length: 1
* Maximum Length: 15
* Average Length: 3.68
* Median Length: 3
* Standard Deviation of Length: 2.28

**Word Count Statistics:**
* Minimum Word Count: 1
* Maximum Word Count: 4
* Average Word Count: 1.2

**Common Patterns:**
* Percentage of Empty Strings: 77.02%
* Percentage of Purely Numeric Text: 0%
* URLs Found: 0 (0%)
* Email Addresses Found: 0 (0%)

**Top 5 Most Frequent Words:** [c23, c25, c27, f33, e101]

---
**Column: `Embarked`**
* **Detected Data Type:** categorical
* **Inferred Semantic Type:** category
* **Data Quality Flag:** Good
* **Quick Stats:**
    * Total Values (Count): 892
    * Missing Values: 2 (0.22%)
    * Unique Values: 4 (0.45% of total)

**3.2.B. Categorical Column Analysis:**

**Frequency & Proportionality:**
* Number of Unique Categories: 4
* Mode (Most Frequent Category): `S` (Frequency: 644, 72.36%)
* Second Most Frequent Category: `C` (Frequency: 168, 18.88%)
* Least Frequent Category: `Embarked` (Frequency: 1, 0.11%)
* Frequency Distribution Table (Top 10):

| Category Label | Count | Percentage (%) | Cumulative % |
|----------------|-------|----------------|--------------|
| S | 644 | 72.36% | 72.36% |
| C | 168 | 18.88% | 91.24% |
| Q | 77 | 8.65% | 99.89% |
| Embarked | 1 | 0.11% | 100% |

**Diversity & Balance:**
* Shannon Entropy: 1.1083 (Range: 0 to 2)
* Gini Impurity: 0.4333
* Interpretation of Balance: Unbalanced distribution
* Major Category Dominance: Major category present

**Category Label Analysis:**
* Minimum Label Length: 1 characters
* Maximum Label Length: 8 characters
* Average Label Length: 1 characters
* Empty String or Null-like Labels: 0 occurrences

**Potential Issues & Recommendations:**


* No significant issues detected.

**3.3. Bivariate Analysis (Exploring Relationships Between Pairs of Variables):**

**Numerical vs. Numerical:**
    * **Correlation Matrix Summary (Pearson's r):**
        * Total Pairs Analysed: 12
        * Top 5 Strongest Positive Correlations:
        1. `Age` vs `Fare`: r = 0.0961 (Correlation significantly different from zero (p ≤ 0.05)) - Very Weak positive correlation (Correlation significantly different from zero (p ≤ 0.05)).
        2. `Pclass` vs `SibSp`: r = 0.0831 (Correlation significantly different from zero (p ≤ 0.05)) - Very Weak positive correlation (Correlation significantly different from zero (p ≤ 0.05)).
        3. `PassengerId` vs `Age`: r = 0.0368 (Correlation not significantly different from zero (p > 0.05)) - Very Weak positive correlation (Correlation not significantly different from zero (p > 0.05)).
        4. `Pclass` vs `Parch`: r = 0.0184 (Correlation not significantly different from zero (p > 0.05)) - Very Weak positive correlation (Correlation not significantly different from zero (p > 0.05)).
        5. `PassengerId` vs `Fare`: r = 0.0127 (Correlation not significantly different from zero (p > 0.05)) - Very Weak positive correlation (Correlation not significantly different from zero (p > 0.05)).
        * Top 5 Strongest Negative Correlations:
        1. `Pclass` vs `Fare`: r = -0.5495 (Correlation significantly different from zero (p ≤ 0.05)) - Moderate negative correlation (Correlation significantly different from zero (p ≤ 0.05)).
        2. `Pclass` vs `Age`: r = -0.3692 (Correlation significantly different from zero (p ≤ 0.05)) - Weak negative correlation (Correlation significantly different from zero (p ≤ 0.05)).
        3. `Age` vs `SibSp`: r = -0.3082 (Correlation significantly different from zero (p ≤ 0.05)) - Weak negative correlation (Correlation significantly different from zero (p ≤ 0.05)).
        4. `Age` vs `Parch`: r = -0.1891 (Correlation significantly different from zero (p ≤ 0.05)) - Very Weak negative correlation (Correlation significantly different from zero (p ≤ 0.05)).
        5. `PassengerId` vs `SibSp`: r = -0.0575 (Correlation not significantly different from zero (p > 0.05)) - Very Weak negative correlation (Correlation not significantly different from zero (p > 0.05)).
        * Strong Correlations (|r| > 0.5): 1 pairs identified
    * **Scatter Plot Insights (Key Relationships):**
        * `PassengerId` vs `Pclass`: "50 point sample shows linear relationship" (Recommended: Scatter plot with trend line)
        * `PassengerId` vs `Age`: "50 point sample shows linear relationship" (Recommended: Scatter plot with trend line)
        * `PassengerId` vs `SibSp`: "50 point sample shows linear relationship" (Recommended: Scatter plot with trend line)

**Numerical vs. Categorical:**
    * **Comparative Statistics (Mean/Median by Category):**
    * **`Sex` by `PassengerId`:**
        | Category | Mean | Median | StdDev | Count |
        |----------|------|--------|--------|-------|
        | male | 0 | 0 | 0 | 577 |
        | female | 0 | 0 | 0 | 314 |
        * **Statistical Tests:** ANOVA F-statistic = 1.5, p-value = 0.2 (No significant difference between groups)
        * **Summary:** male has highest mean (0.00), female has lowest (0.00)

    * **`Embarked` by `PassengerId`:**
        | Category | Mean | Median | StdDev | Count |
        |----------|------|--------|--------|-------|
        | S | 0 | 0 | 0 | 644 |
        | C | 0 | 0 | 0 | 168 |
        | Q | 0 | 0 | 0 | 77 |
        * **Statistical Tests:** ANOVA F-statistic = 1.5, p-value = 0.2 (No significant difference between groups)
        * **Summary:** S has highest mean (0.00), Q has lowest (0.00)

    * **`Sex` by `Pclass`:**
        | Category | Mean | Median | StdDev | Count |
        |----------|------|--------|--------|-------|
        | male | 0 | 0 | 0 | 577 |
        | female | 0 | 0 | 0 | 314 |
        * **Statistical Tests:** ANOVA F-statistic = 1.5, p-value = 0.2 (No significant difference between groups)
        * **Summary:** male has highest mean (0.00), female has lowest (0.00)

**Categorical vs. Categorical:**
    * **Contingency Table Analysis:**
    * **`Sex` vs `Embarked`:**
        * **Contingency Table (Top 3x3):**
        |             | Embarked |
        |-------------|-------------|
        | Sex | 1 |
        | male | 0 |
        | female | 0 |
        * **Association Tests:**
            * Chi-Squared: χ² = 0, df = 0, p-value = 1 (Insufficient data for chi-squared test)
            * Cramer's V: 0 (Cannot calculate association strength)
        * **Insights:** Most common combination: male & S (441 occurrences). Association strength: weak.

**3.4. Multivariate Analysis (Preliminary Insights into Complex Interactions):**
    * **Principal Component Analysis:** Not applicable - insufficient numerical variables.

    * **Cluster Analysis:** Not performed - data characteristics not suitable for clustering.

    * **Feature Interactions:** No significant interactions detected.

**3.5. Specific Analysis Modules (Activated Based on Data Characteristics):**

    * **3.5.B. Text Analytics Deep Dive:**
        * **Detected Text Columns:** 3 columns identified
        * **Primary Text Column:** `Name`
        * **Advanced Analysis Available:** N-gram analysis, topic modelling, named entity recognition, sentiment analysis
        * **Sample Keywords:** [miss, mrs, william, john, master]
        * **Recommendation:** Apply NLP preprocessing pipeline for deeper text insights if required for analysis goals.

**3.6. EDA Summary & Key Hypotheses/Insights:**
    * **Top Statistical Findings:**
    1. Streaming analysis processed 892 rows using only 15MB peak memory
    * **Data Quality Issues Uncovered:**
    * 1 columns have >20% missing values: Cabin
    * **Hypotheses Generated for Further Testing:**
    * No specific hypotheses generated - consider domain knowledge for hypothesis formation.
    * **Recommendations for Data Preprocessing & Feature Engineering:**
    * Consider encoding or grouping high-cardinality columns: Name, Ticket
    * **Critical Warnings & Considerations:**




---

**Analysis Performance Summary:**
* **Processing Time:** 22ms (0.02 seconds)
* **Rows Analysed:** 892
* **Memory Efficiency:** Constant ~15MB usage
* **Analysis Method:** Streaming with online algorithms
* **Dataset Size:** 892 records across 12 columns