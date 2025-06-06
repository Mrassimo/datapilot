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
**Column: `id`**
* **Detected Data Type:** numerical_integer
* **Inferred Semantic Type:** identifier
* **Data Quality Flag:** Good
* **Quick Stats:**
    * Total Values (Count): 570
    * Missing Values: 1 (0.18%)
    * Unique Values: 86 (15.11% of total)

**3.2.A. Numerical Column Analysis:**

**Descriptive Statistics:**
* Minimum: 8670
* Maximum: 911320502
* Range: 911311832
* Sum: 17281572085
* Mean (Arithmetic): 30371831.432337
* Median (50th Percentile): 928559.580317
* Mode(s): [842302 (Frequency: 0.18%), 842517 (Frequency: 0.18%), 84300903 (Frequency: 0.18%), 84348301 (Frequency: 0.18%), 84358402 (Frequency: 0.18%)]
* Standard Deviation: 124910677.383847
* Variance: 15602677324491496
* Coefficient of Variation (CV): 4.1127%

**Quantile & Percentile Statistics:**
* 1st Percentile: 68203.874316
* 5th Percentile: 93559.947483
* 10th Percentile: 914623.967075
* 25th Percentile (Q1 - First Quartile): 925615.746544
* 75th Percentile (Q3 - Third Quartile): 9069359.890295
* 90th Percentile: 91805569.006765
* 95th Percentile: 92272280.591228
* 99th Percentile: 882973064.354026
* Interquartile Range (IQR = Q3 - Q1): 8143744.143751
* Median Absolute Deviation (MAD): 66961.580317

**Distribution Shape & Normality Assessment:**
* Skewness: 6.4567 (Right-skewed (positive skew))
* Kurtosis (Excess): 41.8128 (Leptokurtic (heavy tails))
* Histogram Analysis: Distribution spans 10 bins
* Normality Tests:
    * Shapiro-Wilk Test: W-statistic = 4.499205, p-value = 0.5 (Data consistent with normal distribution (p > 0.05))
    * Jarque-Bera Test: JB-statistic = 134.542976, p-value = 0.001 (Data significantly deviates from normal distribution (p ≤ 0.05))
    * Kolmogorov-Smirnov Test: D-statistic = 0.429583, p-value = 0.01 (Data significantly deviates from normal distribution (p ≤ 0.05))

**Univariate Outlier Analysis:**
* Method 1: IQR Proximity Rule
    * Lower Fence (Q1 - 1.5 * IQR): -11290000.469083
    * Upper Fence (Q3 + 1.5 * IQR): 21284976.105922
    * Number of Outliers (Below Lower): 0 (0%)
    * Number of Outliers (Above Upper): 0 (0%)
    * Extreme Outliers (using 3.0 * IQR factor): 12 (12%)
* Method 2: Z-Score Method
    * Standard Deviations from Mean for Threshold: +/- 3
    * Number of Outliers (Z-score < -3): 0
    * Number of Outliers (Z-score > +3): 0
* Method 3: Modified Z-Score (using MAD)
    * Threshold: +/- 3.5
    * Number of Outliers: 37
* Summary of Outliers: Total 37 (37%). Min Outlier Value: 8913, Max Outlier Value: 91903901.
* Potential Impact: High outlier presence may affect analysis

**Specific Numerical Patterns & Characteristics:**
* Percentage of Zero Values: 0%
* Percentage of Negative Values: 0%
* Round Numbers Analysis: No significant rounding detected
* Potential for Log Transformation: Good candidate for log transformation due to wide range

---
**Column: `diagnosis`**
* **Detected Data Type:** categorical
* **Inferred Semantic Type:** category
* **Data Quality Flag:** Good
* **Quick Stats:**
    * Total Values (Count): 570
    * Missing Values: 0 (0%)
    * Unique Values: 3 (0.53% of total)

**3.2.B. Categorical Column Analysis:**

**Frequency & Proportionality:**
* Number of Unique Categories: 3
* Mode (Most Frequent Category): `B` (Frequency: 357, 62.63%)
* Second Most Frequent Category: `M` (Frequency: 212, 37.19%)
* Least Frequent Category: `diagnosis` (Frequency: 1, 0.18%)
* Frequency Distribution Table (Top 10):

| Category Label | Count | Percentage (%) | Cumulative % |
|----------------|-------|----------------|--------------|
| B | 357 | 62.63% | 62.63% |
| M | 212 | 37.19% | 99.82% |
| diagnosis | 1 | 0.18% | 100% |

**Diversity & Balance:**
* Shannon Entropy: 0.9696 (Range: 0 to 1.585)
* Gini Impurity: 0.4694
* Interpretation of Balance: Unbalanced distribution
* Major Category Dominance: Major category present

**Category Label Analysis:**
* Minimum Label Length: 1 characters
* Maximum Label Length: 9 characters
* Average Label Length: 1 characters
* Empty String or Null-like Labels: 0 occurrences

**Potential Issues & Recommendations:**


* No significant issues detected.

---
**Column: `radius_mean`**
* **Detected Data Type:** numerical_float
* **Inferred Semantic Type:** unknown
* **Data Quality Flag:** Good
* **Quick Stats:**
    * Total Values (Count): 570
    * Missing Values: 1 (0.18%)
    * Unique Values: 93 (16.34% of total)

**3.2.A. Numerical Column Analysis:**

**Descriptive Statistics:**
* Minimum: 6.981
* Maximum: 28.11
* Range: 21.128999999999998
* Sum: 8038.429
* Mean (Arithmetic): 14.127292
* Median (50th Percentile): 12.931564
* Mode(s): [12.18 (Frequency: 0.53%), 13.05 (Frequency: 0.53%), 13.17 (Frequency: 0.53%), 13 (Frequency: 0.53%), 12.46 (Frequency: 0.53%)]
* Standard Deviation: 3.520951
* Variance: 12.397094
* Coefficient of Variation (CV): 0.2492%

**Quantile & Percentile Statistics:**
* 1st Percentile: 8.462375
* 5th Percentile: 9.494277
* 10th Percentile: 10.373684
* 25th Percentile (Q1 - First Quartile): 11.644011
* 75th Percentile (Q3 - Third Quartile): 16.251007
* 90th Percentile: 19.521055
* 95th Percentile: 20.576308
* 99th Percentile: 23.786421
* Interquartile Range (IQR = Q3 - Q1): 4.606996
* Median Absolute Deviation (MAD): 1.928436

**Distribution Shape & Normality Assessment:**
* Skewness: 0.9399 (Right-skewed (positive skew))
* Kurtosis (Excess): 0.8276 (Leptokurtic (heavy tails))
* Histogram Analysis: Distribution spans 10 bins
* Normality Tests:
    * Shapiro-Wilk Test: W-statistic = 15.773176, p-value = 0.5 (Data consistent with normal distribution (p > 0.05))
    * Jarque-Bera Test: JB-statistic = 8.097771, p-value = 0.05 (Data significantly deviates from normal distribution (p ≤ 0.05))
    * Kolmogorov-Smirnov Test: D-statistic = 0.115029, p-value = 0.2 (Data consistent with normal distribution (p > 0.05))

**Univariate Outlier Analysis:**
* Method 1: IQR Proximity Rule
    * Lower Fence (Q1 - 1.5 * IQR): 4.733517
    * Upper Fence (Q3 + 1.5 * IQR): 23.161501
    * Number of Outliers (Below Lower): 0 (0%)
    * Number of Outliers (Above Upper): 3 (3%)
    * Extreme Outliers (using 3.0 * IQR factor): 0 (0%)
* Method 2: Z-Score Method
    * Standard Deviations from Mean for Threshold: +/- 3
    * Number of Outliers (Z-score < -3): 0
    * Number of Outliers (Z-score > +3): 0
* Method 3: Modified Z-Score (using MAD)
    * Threshold: +/- 3.5
    * Number of Outliers: 3
* Summary of Outliers: Total 3 (3%). Min Outlier Value: 23.27, Max Outlier Value: 23.51.
* Potential Impact: Low outlier impact

**Specific Numerical Patterns & Characteristics:**
* Percentage of Zero Values: 0%
* Percentage of Negative Values: 0%
* Round Numbers Analysis: No significant rounding detected
* Potential for Log Transformation: Log transformation may not be beneficial

---
**Column: `texture_mean`**
* **Detected Data Type:** numerical_float
* **Inferred Semantic Type:** unknown
* **Data Quality Flag:** Good
* **Quick Stats:**
    * Total Values (Count): 570
    * Missing Values: 1 (0.18%)
    * Unique Values: 84 (14.76% of total)

**3.2.A. Numerical Column Analysis:**

**Descriptive Statistics:**
* Minimum: 9.71
* Maximum: 39.28
* Range: 29.57
* Sum: 10975.81
* Mean (Arithmetic): 19.289649
* Median (50th Percentile): 18.283818
* Mode(s): [16.84 (Frequency: 0.53%), 15.7 (Frequency: 0.53%)]
* Standard Deviation: 4.297255
* Variance: 18.466397
* Coefficient of Variation (CV): 0.2228%

**Quantile & Percentile Statistics:**
* 1st Percentile: 11.125242
* 5th Percentile: 13.080104
* 10th Percentile: 14.390327
* 25th Percentile (Q1 - First Quartile): 15.555701
* 75th Percentile (Q3 - Third Quartile): 21.557854
* 90th Percentile: 25.26941
* 95th Percentile: 28.288283
* 99th Percentile: 30.124883
* Interquartile Range (IQR = Q3 - Q1): 6.002154
* Median Absolute Deviation (MAD): 2.943818

**Distribution Shape & Normality Assessment:**
* Skewness: 0.6487 (Right-skewed (positive skew))
* Kurtosis (Excess): 0.7411 (Leptokurtic (heavy tails))
* Histogram Analysis: Distribution spans 10 bins
* Normality Tests:
    * Shapiro-Wilk Test: W-statistic = 16.635204, p-value = 0.5 (Data consistent with normal distribution (p > 0.05))
    * Jarque-Bera Test: JB-statistic = 1.88558, p-value = 0.2 (Data consistent with normal distribution (p > 0.05))
    * Kolmogorov-Smirnov Test: D-statistic = 0.049548, p-value = 0.2 (Data consistent with normal distribution (p > 0.05))

**Univariate Outlier Analysis:**
* Method 1: IQR Proximity Rule
    * Lower Fence (Q1 - 1.5 * IQR): 6.55247
    * Upper Fence (Q3 + 1.5 * IQR): 30.561085
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
* Round Numbers Analysis: No significant rounding detected
* Potential for Log Transformation: Log transformation may not be beneficial

---
**Column: `perimeter_mean`**
* **Detected Data Type:** numerical_float
* **Inferred Semantic Type:** unknown
* **Data Quality Flag:** Good
* **Quick Stats:**
    * Total Values (Count): 570
    * Missing Values: 1 (0.18%)
    * Unique Values: 87 (15.29% of total)

**3.2.A. Numerical Column Analysis:**

**Descriptive Statistics:**
* Minimum: 43.79
* Maximum: 188.5
* Range: 144.71
* Sum: 52330.38
* Mean (Arithmetic): 91.969033
* Median (50th Percentile): 87.735632
* Mode(s): [82.61 (Frequency: 0.53%)]
* Standard Deviation: 24.277619
* Variance: 589.402799
* Coefficient of Variation (CV): 0.264%

**Quantile & Percentile Statistics:**
* 1st Percentile: 54.447977
* 5th Percentile: 61.030632
* 10th Percentile: 66.479007
* 25th Percentile (Q1 - First Quartile): 74.055123
* 75th Percentile (Q3 - Third Quartile): 109.13939
* 90th Percentile: 128.656845
* 95th Percentile: 135.16478
* 99th Percentile: 159.013836
* Interquartile Range (IQR = Q3 - Q1): 35.084267
* Median Absolute Deviation (MAD): 14.395632

**Distribution Shape & Normality Assessment:**
* Skewness: 0.988 (Right-skewed (positive skew))
* Kurtosis (Excess): 0.9532 (Leptokurtic (heavy tails))
* Histogram Analysis: Distribution spans 10 bins
* Normality Tests:
    * Shapiro-Wilk Test: W-statistic = 14.997666, p-value = 0.5 (Data consistent with normal distribution (p > 0.05))
    * Jarque-Bera Test: JB-statistic = 15.075576, p-value = 0.001 (Data significantly deviates from normal distribution (p ≤ 0.05))
    * Kolmogorov-Smirnov Test: D-statistic = 0.1363, p-value = 0.05 (Data significantly deviates from normal distribution (p ≤ 0.05))

**Univariate Outlier Analysis:**
* Method 1: IQR Proximity Rule
    * Lower Fence (Q1 - 1.5 * IQR): 21.428723
    * Upper Fence (Q3 + 1.5 * IQR): 161.76579
    * Number of Outliers (Below Lower): 0 (0%)
    * Number of Outliers (Above Upper): 2 (2%)
    * Extreme Outliers (using 3.0 * IQR factor): 0 (0%)
* Method 2: Z-Score Method
    * Standard Deviations from Mean for Threshold: +/- 3
    * Number of Outliers (Z-score < -3): 0
    * Number of Outliers (Z-score > +3): 2
* Method 3: Modified Z-Score (using MAD)
    * Threshold: +/- 3.5
    * Number of Outliers: 2
* Summary of Outliers: Total 2 (2%). Min Outlier Value: 165.5, Max Outlier Value: 182.1.
* Potential Impact: Low outlier impact

**Specific Numerical Patterns & Characteristics:**
* Percentage of Zero Values: 0%
* Percentage of Negative Values: 0%
* Round Numbers Analysis: No significant rounding detected
* Potential for Log Transformation: Log transformation may not be beneficial

---
**Column: `area_mean`**
* **Detected Data Type:** numerical_float
* **Inferred Semantic Type:** unknown
* **Data Quality Flag:** Good
* **Quick Stats:**
    * Total Values (Count): 570
    * Missing Values: 1 (0.18%)
    * Unique Values: 99 (17.4% of total)

**3.2.A. Numerical Column Analysis:**

**Descriptive Statistics:**
* Minimum: 143.5
* Maximum: 2501
* Range: 2357.5
* Sum: 372631.9
* Mean (Arithmetic): 654.889104
* Median (50th Percentile): 556.495273
* Mode(s): [520 (Frequency: 0.35%), 559.2 (Frequency: 0.35%), 1076 (Frequency: 0.35%), 506.3 (Frequency: 0.35%), 684.5 (Frequency: 0.35%)]
* Standard Deviation: 351.604754
* Variance: 123625.90308
* Coefficient of Variation (CV): 0.5369%

**Quantile & Percentile Statistics:**
* 1st Percentile: 215.7753
* 5th Percentile: 285.843665
* 10th Percentile: 330.301268
* 25th Percentile (Q1 - First Quartile): 426.16405
* 75th Percentile (Q3 - Third Quartile): 732.973523
* 90th Percentile: 1182.460088
* 95th Percentile: 1310.087799
* 99th Percentile: 1755.304574
* Interquartile Range (IQR = Q3 - Q1): 306.809473
* Median Absolute Deviation (MAD): 153.195273

**Distribution Shape & Normality Assessment:**
* Skewness: 1.6414 (Right-skewed (positive skew))
* Kurtosis (Excess): 3.6098 (Leptokurtic (heavy tails))
* Histogram Analysis: Distribution spans 10 bins
* Normality Tests:
    * Shapiro-Wilk Test: W-statistic = 10.933462, p-value = 0.5 (Data consistent with normal distribution (p > 0.05))
    * Jarque-Bera Test: JB-statistic = 163.899533, p-value = 0.001 (Data significantly deviates from normal distribution (p ≤ 0.05))
    * Kolmogorov-Smirnov Test: D-statistic = 0.185035, p-value = 0.01 (Data significantly deviates from normal distribution (p ≤ 0.05))

**Univariate Outlier Analysis:**
* Method 1: IQR Proximity Rule
    * Lower Fence (Q1 - 1.5 * IQR): -34.050159
    * Upper Fence (Q3 + 1.5 * IQR): 1193.187731
    * Number of Outliers (Below Lower): 0 (0%)
    * Number of Outliers (Above Upper): 8 (8%)
    * Extreme Outliers (using 3.0 * IQR factor): 4 (4%)
* Method 2: Z-Score Method
    * Standard Deviations from Mean for Threshold: +/- 3
    * Number of Outliers (Z-score < -3): 0
    * Number of Outliers (Z-score > +3): 2
* Method 3: Modified Z-Score (using MAD)
    * Threshold: +/- 3.5
    * Number of Outliers: 5
* Summary of Outliers: Total 12 (12%). Min Outlier Value: 1207, Max Outlier Value: 2499.
* Potential Impact: High outlier presence may affect analysis

**Specific Numerical Patterns & Characteristics:**
* Percentage of Zero Values: 0%
* Percentage of Negative Values: 0%
* Round Numbers Analysis: No significant rounding detected
* Potential for Log Transformation: Good candidate for log transformation due to wide range

---
**Column: `smoothness_mean`**
* **Detected Data Type:** numerical_float
* **Inferred Semantic Type:** unknown
* **Data Quality Flag:** Good
* **Quick Stats:**
    * Total Values (Count): 570
    * Missing Values: 1 (0.18%)
    * Unique Values: 99 (17.4% of total)

**3.2.A. Numerical Column Analysis:**

**Descriptive Statistics:**
* Minimum: 0.05263
* Maximum: 0.1634
* Range: 0.11076999999999998
* Sum: 54.829
* Mean (Arithmetic): 0.09636
* Median (50th Percentile): 0.093793
* Mode(s): [0.1007 (Frequency: 0.88%)]
* Standard Deviation: 0.014052
* Variance: 0.000197
* Coefficient of Variation (CV): 0.1458%

**Quantile & Percentile Statistics:**
* 1st Percentile: 0.067801
* 5th Percentile: 0.074837
* 10th Percentile: 0.078134
* 25th Percentile (Q1 - First Quartile): 0.086464
* 75th Percentile (Q3 - Third Quartile): 0.104822
* 90th Percentile: 0.112727
* 95th Percentile: 0.118043
* 99th Percentile: 0.131669
* Interquartile Range (IQR = Q3 - Q1): 0.018359
* Median Absolute Deviation (MAD): 0.009807

**Distribution Shape & Normality Assessment:**
* Skewness: 0.4551 (Approximately symmetric)
* Kurtosis (Excess): 0.8379 (Leptokurtic (heavy tails))
* Histogram Analysis: Distribution spans 10 bins
* Normality Tests:
    * Shapiro-Wilk Test: W-statistic = 15.721566, p-value = 0.5 (Data consistent with normal distribution (p > 0.05))
    * Jarque-Bera Test: JB-statistic = 6.110004, p-value = 0.05 (Data significantly deviates from normal distribution (p ≤ 0.05))
    * Kolmogorov-Smirnov Test: D-statistic = 0.059471, p-value = 0.2 (Data consistent with normal distribution (p > 0.05))

**Univariate Outlier Analysis:**
* Method 1: IQR Proximity Rule
    * Lower Fence (Q1 - 1.5 * IQR): 0.058926
    * Upper Fence (Q3 + 1.5 * IQR): 0.13236
    * Number of Outliers (Below Lower): 0 (0%)
    * Number of Outliers (Above Upper): 2 (2%)
    * Extreme Outliers (using 3.0 * IQR factor): 0 (0%)
* Method 2: Z-Score Method
    * Standard Deviations from Mean for Threshold: +/- 3
    * Number of Outliers (Z-score < -3): 0
    * Number of Outliers (Z-score > +3): 1
* Method 3: Modified Z-Score (using MAD)
    * Threshold: +/- 3.5
    * Number of Outliers: 1
* Summary of Outliers: Total 2 (2%). Min Outlier Value: 0.1371, Max Outlier Value: 0.1447.
* Potential Impact: Low outlier impact

**Specific Numerical Patterns & Characteristics:**
* Percentage of Zero Values: 0%
* Percentage of Negative Values: 0%
* Round Numbers Analysis: No significant rounding detected
* Potential for Log Transformation: Log transformation may not be beneficial

---
**Column: `compactness_mean`**
* **Detected Data Type:** numerical_float
* **Inferred Semantic Type:** unknown
* **Data Quality Flag:** Good
* **Quick Stats:**
    * Total Values (Count): 570
    * Missing Values: 1 (0.18%)
    * Unique Values: 99 (17.4% of total)

**3.2.A. Numerical Column Analysis:**

**Descriptive Statistics:**
* Minimum: 0.01938
* Maximum: 0.3454
* Range: 0.32602
* Sum: 59.37002
* Mean (Arithmetic): 0.104341
* Median (50th Percentile): 0.095589
* Mode(s): [0.1047 (Frequency: 0.35%), 0.09509 (Frequency: 0.35%), 0.1599 (Frequency: 0.35%), 0.17 (Frequency: 0.35%), 0.1267 (Frequency: 0.35%)]
* Standard Deviation: 0.052766
* Variance: 0.002784
* Coefficient of Variation (CV): 0.5057%

**Quantile & Percentile Statistics:**
* 1st Percentile: 0.031197
* 5th Percentile: 0.040773
* 10th Percentile: 0.047862
* 25th Percentile (Q1 - First Quartile): 0.060442
* 75th Percentile (Q3 - Third Quartile): 0.129008
* 90th Percentile: 0.164563
* 95th Percentile: 0.205084
* 99th Percentile: 0.280379
* Interquartile Range (IQR = Q3 - Q1): 0.068565
* Median Absolute Deviation (MAD): 0.032711

**Distribution Shape & Normality Assessment:**
* Skewness: 1.187 (Right-skewed (positive skew))
* Kurtosis (Excess): 1.6251 (Leptokurtic (heavy tails))
* Histogram Analysis: Distribution spans 10 bins
* Normality Tests:
    * Shapiro-Wilk Test: W-statistic = 15.123868, p-value = 0.5 (Data consistent with normal distribution (p > 0.05))
    * Jarque-Bera Test: JB-statistic = 13.444415, p-value = 0.01 (Data significantly deviates from normal distribution (p ≤ 0.05))
    * Kolmogorov-Smirnov Test: D-statistic = 0.137975, p-value = 0.05 (Data significantly deviates from normal distribution (p ≤ 0.05))

**Univariate Outlier Analysis:**
* Method 1: IQR Proximity Rule
    * Lower Fence (Q1 - 1.5 * IQR): -0.042406
    * Upper Fence (Q3 + 1.5 * IQR): 0.231856
    * Number of Outliers (Below Lower): 0 (0%)
    * Number of Outliers (Above Upper): 1 (1%)
    * Extreme Outliers (using 3.0 * IQR factor): 0 (0%)
* Method 2: Z-Score Method
    * Standard Deviations from Mean for Threshold: +/- 3
    * Number of Outliers (Z-score < -3): 0
    * Number of Outliers (Z-score > +3): 0
* Method 3: Modified Z-Score (using MAD)
    * Threshold: +/- 3.5
    * Number of Outliers: 0
* Summary of Outliers: Total 1 (1%). Min Outlier Value: 0.2364, Max Outlier Value: 0.2364.
* Potential Impact: Low outlier impact

**Specific Numerical Patterns & Characteristics:**
* Percentage of Zero Values: 0%
* Percentage of Negative Values: 0%
* Round Numbers Analysis: No significant rounding detected
* Potential for Log Transformation: Log transformation may not be beneficial

---
**Column: `concavity_mean`**
* **Detected Data Type:** numerical_float
* **Inferred Semantic Type:** unknown
* **Data Quality Flag:** Good
* **Quick Stats:**
    * Total Values (Count): 570
    * Missing Values: 1 (0.18%)
    * Unique Values: 94 (16.52% of total)

**3.2.A. Numerical Column Analysis:**

**Descriptive Statistics:**
* Minimum: 0
* Maximum: 0.4268
* Range: 0.4268
* Sum: 50.526811
* Mean (Arithmetic): 0.088799
* Median (50th Percentile): 0.05174
* Mode(s): [0 (Frequency: 1.93%)]
* Standard Deviation: 0.07965
* Variance: 0.006344
* Coefficient of Variation (CV): 0.897%

**Quantile & Percentile Statistics:**
* 1st Percentile: 0.000049
* 5th Percentile: 0.008294
* 10th Percentile: 0.013177
* 25th Percentile (Q1 - First Quartile): 0.031421
* 75th Percentile (Q3 - Third Quartile): 0.152219
* 90th Percentile: 0.201325
* 95th Percentile: 0.244112
* 99th Percentile: 0.35208
* Interquartile Range (IQR = Q3 - Q1): 0.120798
* Median Absolute Deviation (MAD): 0.04673

**Distribution Shape & Normality Assessment:**
* Skewness: 1.3975 (Right-skewed (positive skew))
* Kurtosis (Excess): 1.9706 (Leptokurtic (heavy tails))
* Histogram Analysis: Distribution spans 10 bins
* Normality Tests:
    * Shapiro-Wilk Test: W-statistic = 14.646381, p-value = 0.5 (Data consistent with normal distribution (p > 0.05))
    * Jarque-Bera Test: JB-statistic = 23.802171, p-value = 0.001 (Data significantly deviates from normal distribution (p ≤ 0.05))
    * Kolmogorov-Smirnov Test: D-statistic = 0.131722, p-value = 0.2 (Data consistent with normal distribution (p > 0.05))

**Univariate Outlier Analysis:**
* Method 1: IQR Proximity Rule
    * Lower Fence (Q1 - 1.5 * IQR): -0.149776
    * Upper Fence (Q3 + 1.5 * IQR): 0.333416
    * Number of Outliers (Below Lower): 0 (0%)
    * Number of Outliers (Above Upper): 5 (5%)
    * Extreme Outliers (using 3.0 * IQR factor): 0 (0%)
* Method 2: Z-Score Method
    * Standard Deviations from Mean for Threshold: +/- 3
    * Number of Outliers (Z-score < -3): 0
    * Number of Outliers (Z-score > +3): 5
* Method 3: Modified Z-Score (using MAD)
    * Threshold: +/- 3.5
    * Number of Outliers: 6
* Summary of Outliers: Total 6 (6%). Min Outlier Value: 0.3201, Max Outlier Value: 0.3754.
* Potential Impact: High outlier presence may affect analysis

**Specific Numerical Patterns & Characteristics:**
* Percentage of Zero Values: 1%
* Percentage of Negative Values: 0%
* Round Numbers Analysis: No significant rounding detected
* Potential for Log Transformation: Log transformation may not be beneficial

---
**Column: `concave points_mean`**
* **Detected Data Type:** numerical_float
* **Inferred Semantic Type:** unknown
* **Data Quality Flag:** Good
* **Quick Stats:**
    * Total Values (Count): 570
    * Missing Values: 1 (0.18%)
    * Unique Values: 89 (15.64% of total)

**3.2.A. Numerical Column Analysis:**

**Descriptive Statistics:**
* Minimum: 0
* Maximum: 0.2012
* Range: 0.2012
* Sum: 27.834994
* Mean (Arithmetic): 0.048919
* Median (50th Percentile): 0.029761
* Mode(s): [0 (Frequency: 1.93%)]
* Standard Deviation: 0.038769
* Variance: 0.001503
* Coefficient of Variation (CV): 0.7925%

**Quantile & Percentile Statistics:**
* 1st Percentile: 0.00005
* 5th Percentile: 0.008102
* 10th Percentile: 0.010891
* 25th Percentile (Q1 - First Quartile): 0.020994
* 75th Percentile (Q3 - Third Quartile): 0.079847
* 90th Percentile: 0.099108
* 95th Percentile: 0.125381
* 99th Percentile: 0.16718
* Interquartile Range (IQR = Q3 - Q1): 0.058854
* Median Absolute Deviation (MAD): 0.016471

**Distribution Shape & Normality Assessment:**
* Skewness: 1.1681 (Right-skewed (positive skew))
* Kurtosis (Excess): 1.0467 (Leptokurtic (heavy tails))
* Histogram Analysis: Distribution spans 10 bins
* Normality Tests:
    * Shapiro-Wilk Test: W-statistic = 14.252207, p-value = 0.5 (Data consistent with normal distribution (p > 0.05))
    * Jarque-Bera Test: JB-statistic = 29.975835, p-value = 0.001 (Data significantly deviates from normal distribution (p ≤ 0.05))
    * Kolmogorov-Smirnov Test: D-statistic = 0.189942, p-value = 0.01 (Data significantly deviates from normal distribution (p ≤ 0.05))

**Univariate Outlier Analysis:**
* Method 1: IQR Proximity Rule
    * Lower Fence (Q1 - 1.5 * IQR): -0.067286
    * Upper Fence (Q3 + 1.5 * IQR): 0.168128
    * Number of Outliers (Below Lower): 0 (0%)
    * Number of Outliers (Above Upper): 1 (1%)
    * Extreme Outliers (using 3.0 * IQR factor): 0 (0%)
* Method 2: Z-Score Method
    * Standard Deviations from Mean for Threshold: +/- 3
    * Number of Outliers (Z-score < -3): 0
    * Number of Outliers (Z-score > +3): 1
* Method 3: Modified Z-Score (using MAD)
    * Threshold: +/- 3.5
    * Number of Outliers: 7
* Summary of Outliers: Total 6 (6%). Min Outlier Value: 0.1203, Max Outlier Value: 0.1913.
* Potential Impact: High outlier presence may affect analysis

**Specific Numerical Patterns & Characteristics:**
* Percentage of Zero Values: 2%
* Percentage of Negative Values: 0%
* Round Numbers Analysis: No significant rounding detected
* Potential for Log Transformation: Log transformation may not be beneficial

---
**Column: `symmetry_mean`**
* **Detected Data Type:** numerical_float
* **Inferred Semantic Type:** unknown
* **Data Quality Flag:** Good
* **Quick Stats:**
    * Total Values (Count): 570
    * Missing Values: 1 (0.18%)
    * Unique Values: 97 (17.05% of total)

**3.2.A. Numerical Column Analysis:**

**Descriptive Statistics:**
* Minimum: 0.106
* Maximum: 0.304
* Range: 0.198
* Sum: 103.0811
* Mean (Arithmetic): 0.181162
* Median (50th Percentile): 0.18008
* Mode(s): [0.1769 (Frequency: 0.7%), 0.1717 (Frequency: 0.7%)]
* Standard Deviation: 0.02739
* Variance: 0.00075
* Coefficient of Variation (CV): 0.1512%

**Quantile & Percentile Statistics:**
* 1st Percentile: 0.128756
* 5th Percentile: 0.14097
* 10th Percentile: 0.149896
* 25th Percentile (Q1 - First Quartile): 0.160794
* 75th Percentile (Q3 - Third Quartile): 0.19416
* 90th Percentile: 0.211697
* 95th Percentile: 0.222431
* 99th Percentile: 0.256944
* Interquartile Range (IQR = Q3 - Q1): 0.033366
* Median Absolute Deviation (MAD): 0.01998

**Distribution Shape & Normality Assessment:**
* Skewness: 0.7237 (Right-skewed (positive skew))
* Kurtosis (Excess): 1.2661 (Leptokurtic (heavy tails))
* Histogram Analysis: Distribution spans 10 bins
* Normality Tests:
    * Shapiro-Wilk Test: W-statistic = 15.109482, p-value = 0.5 (Data consistent with normal distribution (p > 0.05))
    * Jarque-Bera Test: JB-statistic = 16.315444, p-value = 0.001 (Data significantly deviates from normal distribution (p ≤ 0.05))
    * Kolmogorov-Smirnov Test: D-statistic = 0.090573, p-value = 0.2 (Data consistent with normal distribution (p > 0.05))

**Univariate Outlier Analysis:**
* Method 1: IQR Proximity Rule
    * Lower Fence (Q1 - 1.5 * IQR): 0.110746
    * Upper Fence (Q3 + 1.5 * IQR): 0.244208
    * Number of Outliers (Below Lower): 0 (0%)
    * Number of Outliers (Above Upper): 6 (6%)
    * Extreme Outliers (using 3.0 * IQR factor): 0 (0%)
* Method 2: Z-Score Method
    * Standard Deviations from Mean for Threshold: +/- 3
    * Number of Outliers (Z-score < -3): 0
    * Number of Outliers (Z-score > +3): 1
* Method 3: Modified Z-Score (using MAD)
    * Threshold: +/- 3.5
    * Number of Outliers: 1
* Summary of Outliers: Total 6 (6%). Min Outlier Value: 0.2495, Max Outlier Value: 0.2906.
* Potential Impact: High outlier presence may affect analysis

**Specific Numerical Patterns & Characteristics:**
* Percentage of Zero Values: 0%
* Percentage of Negative Values: 0%
* Round Numbers Analysis: No significant rounding detected
* Potential for Log Transformation: Log transformation may not be beneficial

---
**Column: `fractal_dimension_mean`**
* **Detected Data Type:** numerical_float
* **Inferred Semantic Type:** unknown
* **Data Quality Flag:** Good
* **Quick Stats:**
    * Total Values (Count): 570
    * Missing Values: 1 (0.18%)
    * Unique Values: 90 (15.82% of total)

**3.2.A. Numerical Column Analysis:**

**Descriptive Statistics:**
* Minimum: 0.04996
* Maximum: 0.09744
* Range: 0.04748
* Sum: 35.73184
* Mean (Arithmetic): 0.062798
* Median (50th Percentile): 0.061341
* Mode(s): [0.05667 (Frequency: 0.53%), 0.05907 (Frequency: 0.53%), 0.05913 (Frequency: 0.53%), 0.06782 (Frequency: 0.53%)]
* Standard Deviation: 0.007054
* Variance: 0.00005
* Coefficient of Variation (CV): 0.1123%

**Quantile & Percentile Statistics:**
* 1st Percentile: 0.05151
* 5th Percentile: 0.054028
* 10th Percentile: 0.055463
* 25th Percentile (Q1 - First Quartile): 0.057216
* 75th Percentile (Q3 - Third Quartile): 0.065062
* 90th Percentile: 0.072921
* 95th Percentile: 0.075901
* 99th Percentile: 0.083388
* Interquartile Range (IQR = Q3 - Q1): 0.007845
* Median Absolute Deviation (MAD): 0.004501

**Distribution Shape & Normality Assessment:**
* Skewness: 1.301 (Right-skewed (positive skew))
* Kurtosis (Excess): 2.969 (Leptokurtic (heavy tails))
* Histogram Analysis: Distribution spans 10 bins
* Normality Tests:
    * Shapiro-Wilk Test: W-statistic = 13.665196, p-value = 0.5 (Data consistent with normal distribution (p > 0.05))
    * Jarque-Bera Test: JB-statistic = 44.102556, p-value = 0.001 (Data significantly deviates from normal distribution (p ≤ 0.05))
    * Kolmogorov-Smirnov Test: D-statistic = 0.09237, p-value = 0.2 (Data consistent with normal distribution (p > 0.05))

**Univariate Outlier Analysis:**
* Method 1: IQR Proximity Rule
    * Lower Fence (Q1 - 1.5 * IQR): 0.045448
    * Upper Fence (Q3 + 1.5 * IQR): 0.07683
    * Number of Outliers (Below Lower): 0 (0%)
    * Number of Outliers (Above Upper): 3 (3%)
    * Extreme Outliers (using 3.0 * IQR factor): 1 (1%)
* Method 2: Z-Score Method
    * Standard Deviations from Mean for Threshold: +/- 3
    * Number of Outliers (Z-score < -3): 0
    * Number of Outliers (Z-score > +3): 1
* Method 3: Modified Z-Score (using MAD)
    * Threshold: +/- 3.5
    * Number of Outliers: 1
* Summary of Outliers: Total 4 (4%). Min Outlier Value: 0.0795, Max Outlier Value: 0.0898.
* Potential Impact: Low outlier impact

**Specific Numerical Patterns & Characteristics:**
* Percentage of Zero Values: 0%
* Percentage of Negative Values: 0%
* Round Numbers Analysis: No significant rounding detected
* Potential for Log Transformation: Log transformation may not be beneficial

---
**Column: `radius_se`**
* **Detected Data Type:** numerical_float
* **Inferred Semantic Type:** unknown
* **Data Quality Flag:** Good
* **Quick Stats:**
    * Total Values (Count): 570
    * Missing Values: 1 (0.18%)
    * Unique Values: 81 (14.24% of total)

**3.2.A. Numerical Column Analysis:**

**Descriptive Statistics:**
* Minimum: 0.1115
* Maximum: 2.873
* Range: 2.7615000000000003
* Sum: 230.5429
* Mean (Arithmetic): 0.405172
* Median (50th Percentile): 0.321668
* Mode(s): [0.286 (Frequency: 0.53%)]
* Standard Deviation: 0.277069
* Variance: 0.076767
* Coefficient of Variation (CV): 0.6838%

**Quantile & Percentile Statistics:**
* 1st Percentile: 0.115245
* 5th Percentile: 0.158058
* 10th Percentile: 0.177168
* 25th Percentile (Q1 - First Quartile): 0.232042
* 75th Percentile (Q3 - Third Quartile): 0.453536
* 90th Percentile: 0.711216
* 95th Percentile: 0.921247
* 99th Percentile: 1.303889
* Interquartile Range (IQR = Q3 - Q1): 0.221494
* Median Absolute Deviation (MAD): 0.107468

**Distribution Shape & Normality Assessment:**
* Skewness: 3.0805 (Right-skewed (positive skew))
* Kurtosis (Excess): 17.5212 (Leptokurtic (heavy tails))
* Histogram Analysis: Distribution spans 10 bins
* Normality Tests:
    * Shapiro-Wilk Test: W-statistic = 7.815894, p-value = 0.5 (Data consistent with normal distribution (p > 0.05))
    * Jarque-Bera Test: JB-statistic = 1868.69247, p-value = 0.001 (Data significantly deviates from normal distribution (p ≤ 0.05))
    * Kolmogorov-Smirnov Test: D-statistic = 0.218645, p-value = 0.01 (Data significantly deviates from normal distribution (p ≤ 0.05))

**Univariate Outlier Analysis:**
* Method 1: IQR Proximity Rule
    * Lower Fence (Q1 - 1.5 * IQR): -0.1002
    * Upper Fence (Q3 + 1.5 * IQR): 0.785778
    * Number of Outliers (Below Lower): 0 (0%)
    * Number of Outliers (Above Upper): 6 (6%)
    * Extreme Outliers (using 3.0 * IQR factor): 3 (3%)
* Method 2: Z-Score Method
    * Standard Deviations from Mean for Threshold: +/- 3
    * Number of Outliers (Z-score < -3): 0
    * Number of Outliers (Z-score > +3): 1
* Method 3: Modified Z-Score (using MAD)
    * Threshold: +/- 3.5
    * Number of Outliers: 7
* Summary of Outliers: Total 9 (9%). Min Outlier Value: 0.8113, Max Outlier Value: 2.547.
* Potential Impact: High outlier presence may affect analysis

**Specific Numerical Patterns & Characteristics:**
* Percentage of Zero Values: 0%
* Percentage of Negative Values: 0%
* Round Numbers Analysis: No significant rounding detected
* Potential for Log Transformation: Log transformation may not be beneficial

---
**Column: `texture_se`**
* **Detected Data Type:** numerical_float
* **Inferred Semantic Type:** unknown
* **Data Quality Flag:** Good
* **Quick Stats:**
    * Total Values (Count): 570
    * Missing Values: 1 (0.18%)
    * Unique Values: 89 (15.64% of total)

**3.2.A. Numerical Column Analysis:**

**Descriptive Statistics:**
* Minimum: 0.3602
* Maximum: 4.885
* Range: 4.5248
* Sum: 692.3896
* Mean (Arithmetic): 1.216853
* Median (50th Percentile): 1.076523
* Mode(s): [1.268 (Frequency: 0.53%), 1.15 (Frequency: 0.53%)]
* Standard Deviation: 0.551163
* Variance: 0.303781
* Coefficient of Variation (CV): 0.4529%

**Quantile & Percentile Statistics:**
* 1st Percentile: 0.406769
* 5th Percentile: 0.557716
* 10th Percentile: 0.624288
* 25th Percentile (Q1 - First Quartile): 0.831756
* 75th Percentile (Q3 - Third Quartile): 1.472147
* 90th Percentile: 1.911847
* 95th Percentile: 2.188231
* 99th Percentile: 2.998207
* Interquartile Range (IQR = Q3 - Q1): 0.640392
* Median Absolute Deviation (MAD): 0.311023

**Distribution Shape & Normality Assessment:**
* Skewness: 1.6421 (Right-skewed (positive skew))
* Kurtosis (Excess): 5.2918 (Leptokurtic (heavy tails))
* Histogram Analysis: Distribution spans 10 bins
* Normality Tests:
    * Shapiro-Wilk Test: W-statistic = 14.289925, p-value = 0.5 (Data consistent with normal distribution (p > 0.05))
    * Jarque-Bera Test: JB-statistic = 22.020133, p-value = 0.001 (Data significantly deviates from normal distribution (p ≤ 0.05))
    * Kolmogorov-Smirnov Test: D-statistic = 0.131531, p-value = 0.2 (Data consistent with normal distribution (p > 0.05))

**Univariate Outlier Analysis:**
* Method 1: IQR Proximity Rule
    * Lower Fence (Q1 - 1.5 * IQR): -0.128832
    * Upper Fence (Q3 + 1.5 * IQR): 2.432735
    * Number of Outliers (Below Lower): 0 (0%)
    * Number of Outliers (Above Upper): 5 (5%)
    * Extreme Outliers (using 3.0 * IQR factor): 0 (0%)
* Method 2: Z-Score Method
    * Standard Deviations from Mean for Threshold: +/- 3
    * Number of Outliers (Z-score < -3): 0
    * Number of Outliers (Z-score > +3): 2
* Method 3: Modified Z-Score (using MAD)
    * Threshold: +/- 3.5
    * Number of Outliers: 3
* Summary of Outliers: Total 5 (5%). Min Outlier Value: 2.542, Max Outlier Value: 2.927.
* Potential Impact: Low outlier impact

**Specific Numerical Patterns & Characteristics:**
* Percentage of Zero Values: 0%
* Percentage of Negative Values: 0%
* Round Numbers Analysis: No significant rounding detected
* Potential for Log Transformation: Log transformation may not be beneficial

---
**Column: `perimeter_se`**
* **Detected Data Type:** numerical_float
* **Inferred Semantic Type:** unknown
* **Data Quality Flag:** Good
* **Quick Stats:**
    * Total Values (Count): 570
    * Missing Values: 1 (0.18%)
    * Unique Values: 96 (16.87% of total)

**3.2.A. Numerical Column Analysis:**

**Descriptive Statistics:**
* Minimum: 0.757
* Maximum: 21.98
* Range: 21.223
* Sum: 1630.7877
* Mean (Arithmetic): 2.866059
* Median (50th Percentile): 2.299468
* Mode(s): [1.778 (Frequency: 0.7%)]
* Standard Deviation: 2.020077
* Variance: 4.080711
* Coefficient of Variation (CV): 0.7048%

**Quantile & Percentile Statistics:**
* 1st Percentile: 0.965291
* 5th Percentile: 1.136591
* 10th Percentile: 1.231042
* 25th Percentile (Q1 - First Quartile): 1.640234
* 75th Percentile (Q3 - Third Quartile): 3.089244
* 90th Percentile: 5.43076
* 95th Percentile: 6.957614
* 99th Percentile: 9.706455
* Interquartile Range (IQR = Q3 - Q1): 1.449009
* Median Absolute Deviation (MAD): 0.815468

**Distribution Shape & Normality Assessment:**
* Skewness: 3.4345 (Right-skewed (positive skew))
* Kurtosis (Excess): 21.2038 (Leptokurtic (heavy tails))
* Histogram Analysis: Distribution spans 10 bins
* Normality Tests:
    * Shapiro-Wilk Test: W-statistic = 12.261743, p-value = 0.5 (Data consistent with normal distribution (p > 0.05))
    * Jarque-Bera Test: JB-statistic = 59.021402, p-value = 0.001 (Data significantly deviates from normal distribution (p ≤ 0.05))
    * Kolmogorov-Smirnov Test: D-statistic = 0.175167, p-value = 0.01 (Data significantly deviates from normal distribution (p ≤ 0.05))

**Univariate Outlier Analysis:**
* Method 1: IQR Proximity Rule
    * Lower Fence (Q1 - 1.5 * IQR): -0.53328
    * Upper Fence (Q3 + 1.5 * IQR): 5.262758
    * Number of Outliers (Below Lower): 0 (0%)
    * Number of Outliers (Above Upper): 12 (12%)
    * Extreme Outliers (using 3.0 * IQR factor): 3 (3%)
* Method 2: Z-Score Method
    * Standard Deviations from Mean for Threshold: +/- 3
    * Number of Outliers (Z-score < -3): 0
    * Number of Outliers (Z-score > +3): 1
* Method 3: Modified Z-Score (using MAD)
    * Threshold: +/- 3.5
    * Number of Outliers: 7
* Summary of Outliers: Total 15 (15%). Min Outlier Value: 5.373, Max Outlier Value: 10.05.
* Potential Impact: High outlier presence may affect analysis

**Specific Numerical Patterns & Characteristics:**
* Percentage of Zero Values: 0%
* Percentage of Negative Values: 0%
* Round Numbers Analysis: No significant rounding detected
* Potential for Log Transformation: Log transformation may not be beneficial

---
**Column: `area_se`**
* **Detected Data Type:** numerical_float
* **Inferred Semantic Type:** unknown
* **Data Quality Flag:** Good
* **Quick Stats:**
    * Total Values (Count): 570
    * Missing Values: 1 (0.18%)
    * Unique Values: 94 (16.52% of total)

**3.2.A. Numerical Column Analysis:**

**Descriptive Statistics:**
* Minimum: 6.802
* Maximum: 542.2
* Range: 535.398
* Sum: 22951.798
* Mean (Arithmetic): 40.337079
* Median (50th Percentile): 22.894773
* Mode(s): [17.67 (Frequency: 0.53%), 16.97 (Frequency: 0.53%)]
* Standard Deviation: 45.451013
* Variance: 2065.794621
* Coefficient of Variation (CV): 1.1268%

**Quantile & Percentile Statistics:**
* 1st Percentile: 8.905124
* 5th Percentile: 11.446431
* 10th Percentile: 13.249598
* 25th Percentile (Q1 - First Quartile): 18.15994
* 75th Percentile (Q3 - Third Quartile): 39.858358
* 90th Percentile: 83.982846
* 95th Percentile: 114.017904
* 99th Percentile: 219.512567
* Interquartile Range (IQR = Q3 - Q1): 21.698418
* Median Absolute Deviation (MAD): 8.734773

**Distribution Shape & Normality Assessment:**
* Skewness: 5.4328 (Right-skewed (positive skew))
* Kurtosis (Excess): 48.7672 (Leptokurtic (heavy tails))
* Histogram Analysis: Distribution spans 10 bins
* Normality Tests:
    * Shapiro-Wilk Test: W-statistic = 4.18105, p-value = 0.5 (Data consistent with normal distribution (p > 0.05))
    * Jarque-Bera Test: JB-statistic = 12276.77482, p-value = 0.001 (Data significantly deviates from normal distribution (p ≤ 0.05))
    * Kolmogorov-Smirnov Test: D-statistic = 0.277571, p-value = 0.01 (Data significantly deviates from normal distribution (p ≤ 0.05))

**Univariate Outlier Analysis:**
* Method 1: IQR Proximity Rule
    * Lower Fence (Q1 - 1.5 * IQR): -14.387688
    * Upper Fence (Q3 + 1.5 * IQR): 72.405986
    * Number of Outliers (Below Lower): 0 (0%)
    * Number of Outliers (Above Upper): 10 (10%)
    * Extreme Outliers (using 3.0 * IQR factor): 6 (6%)
* Method 2: Z-Score Method
    * Standard Deviations from Mean for Threshold: +/- 3
    * Number of Outliers (Z-score < -3): 0
    * Number of Outliers (Z-score > +3): 1
* Method 3: Modified Z-Score (using MAD)
    * Threshold: +/- 3.5
    * Number of Outliers: 17
* Summary of Outliers: Total 17 (17%). Min Outlier Value: 70.01, Max Outlier Value: 542.2.
* Potential Impact: High outlier presence may affect analysis

**Specific Numerical Patterns & Characteristics:**
* Percentage of Zero Values: 0%
* Percentage of Negative Values: 0%
* Round Numbers Analysis: No significant rounding detected
* Potential for Log Transformation: Log transformation may not be beneficial

---
**Column: `smoothness_se`**
* **Detected Data Type:** numerical_float
* **Inferred Semantic Type:** unknown
* **Data Quality Flag:** Good
* **Quick Stats:**
    * Total Values (Count): 570
    * Missing Values: 1 (0.18%)
    * Unique Values: 80 (14.06% of total)

**3.2.A. Numerical Column Analysis:**

**Descriptive Statistics:**
* Minimum: 0.001713
* Maximum: 0.03113
* Range: 0.029417000000000002
* Sum: 4.006317
* Mean (Arithmetic): 0.007041
* Median (50th Percentile): 0.006188
* Mode(s): [0.007514 (Frequency: 0.35%), 0.006494 (Frequency: 0.35%), 0.006064 (Frequency: 0.35%), 0.01052 (Frequency: 0.35%), 0.01038 (Frequency: 0.35%)]
* Standard Deviation: 0.003
* Variance: 0.000009
* Coefficient of Variation (CV): 0.4261%

**Quantile & Percentile Statistics:**
* 1st Percentile: 0.002997
* 5th Percentile: 0.003684
* 10th Percentile: 0.004203
* 25th Percentile (Q1 - First Quartile): 0.005278
* 75th Percentile (Q3 - Third Quartile): 0.008471
* 90th Percentile: 0.010594
* 95th Percentile: 0.012752
* 99th Percentile: 0.016792
* Interquartile Range (IQR = Q3 - Q1): 0.003193
* Median Absolute Deviation (MAD): 0.001614

**Distribution Shape & Normality Assessment:**
* Skewness: 2.3083 (Right-skewed (positive skew))
* Kurtosis (Excess): 10.3675 (Leptokurtic (heavy tails))
* Histogram Analysis: Distribution spans 10 bins
* Normality Tests:
    * Shapiro-Wilk Test: W-statistic = 14.931439, p-value = 0.5 (Data consistent with normal distribution (p > 0.05))
    * Jarque-Bera Test: JB-statistic = 9.960839, p-value = 0.01 (Data significantly deviates from normal distribution (p ≤ 0.05))
    * Kolmogorov-Smirnov Test: D-statistic = 0.133557, p-value = 0.2 (Data consistent with normal distribution (p > 0.05))

**Univariate Outlier Analysis:**
* Method 1: IQR Proximity Rule
    * Lower Fence (Q1 - 1.5 * IQR): 0.000489
    * Upper Fence (Q3 + 1.5 * IQR): 0.01326
    * Number of Outliers (Below Lower): 0 (0%)
    * Number of Outliers (Above Upper): 3 (3%)
    * Extreme Outliers (using 3.0 * IQR factor): 0 (0%)
* Method 2: Z-Score Method
    * Standard Deviations from Mean for Threshold: +/- 3
    * Number of Outliers (Z-score < -3): 0
    * Number of Outliers (Z-score > +3): 0
* Method 3: Modified Z-Score (using MAD)
    * Threshold: +/- 3.5
    * Number of Outliers: 1
* Summary of Outliers: Total 2 (2%). Min Outlier Value: 0.0138, Max Outlier Value: 0.01604.
* Potential Impact: Low outlier impact

**Specific Numerical Patterns & Characteristics:**
* Percentage of Zero Values: 0%
* Percentage of Negative Values: 0%
* Round Numbers Analysis: No significant rounding detected
* Potential for Log Transformation: Log transformation may not be beneficial

---
**Column: `compactness_se`**
* **Detected Data Type:** numerical_float
* **Inferred Semantic Type:** unknown
* **Data Quality Flag:** Good
* **Quick Stats:**
    * Total Values (Count): 570
    * Missing Values: 1 (0.18%)
    * Unique Values: 99 (17.4% of total)

**3.2.A. Numerical Column Analysis:**

**Descriptive Statistics:**
* Minimum: 0.002252
* Maximum: 0.1354
* Range: 0.133148
* Sum: 14.497061
* Mean (Arithmetic): 0.025478
* Median (50th Percentile): 0.019084
* Mode(s): [0.0231 (Frequency: 0.53%)]
* Standard Deviation: 0.017892
* Variance: 0.00032
* Coefficient of Variation (CV): 0.7023%

**Quantile & Percentile Statistics:**
* 1st Percentile: 0.004381
* 5th Percentile: 0.006734
* 10th Percentile: 0.009267
* 25th Percentile (Q1 - First Quartile): 0.013153
* 75th Percentile (Q3 - Third Quartile): 0.035962
* 90th Percentile: 0.045965
* 95th Percentile: 0.061864
* 99th Percentile: 0.094239
* Interquartile Range (IQR = Q3 - Q1): 0.022809
* Median Absolute Deviation (MAD): 0.008124

**Distribution Shape & Normality Assessment:**
* Skewness: 1.8972 (Right-skewed (positive skew))
* Kurtosis (Excess): 5.051 (Leptokurtic (heavy tails))
* Histogram Analysis: Distribution spans 10 bins
* Normality Tests:
    * Shapiro-Wilk Test: W-statistic = 10.314248, p-value = 0.5 (Data consistent with normal distribution (p > 0.05))
    * Jarque-Bera Test: JB-statistic = 377.467059, p-value = 0.001 (Data significantly deviates from normal distribution (p ≤ 0.05))
    * Kolmogorov-Smirnov Test: D-statistic = 0.154075, p-value = 0.05 (Data significantly deviates from normal distribution (p ≤ 0.05))

**Univariate Outlier Analysis:**
* Method 1: IQR Proximity Rule
    * Lower Fence (Q1 - 1.5 * IQR): -0.02106
    * Upper Fence (Q3 + 1.5 * IQR): 0.070175
    * Number of Outliers (Below Lower): 0 (0%)
    * Number of Outliers (Above Upper): 2 (2%)
    * Extreme Outliers (using 3.0 * IQR factor): 2 (2%)
* Method 2: Z-Score Method
    * Standard Deviations from Mean for Threshold: +/- 3
    * Number of Outliers (Z-score < -3): 0
    * Number of Outliers (Z-score > +3): 4
* Method 3: Modified Z-Score (using MAD)
    * Threshold: +/- 3.5
    * Number of Outliers: 4
* Summary of Outliers: Total 4 (4%). Min Outlier Value: 0.08262, Max Outlier Value: 0.1354.
* Potential Impact: Low outlier impact

**Specific Numerical Patterns & Characteristics:**
* Percentage of Zero Values: 0%
* Percentage of Negative Values: 0%
* Round Numbers Analysis: No significant rounding detected
* Potential for Log Transformation: Log transformation may not be beneficial

---
**Column: `concavity_se`**
* **Detected Data Type:** numerical_float
* **Inferred Semantic Type:** unknown
* **Data Quality Flag:** Good
* **Quick Stats:**
    * Total Values (Count): 570
    * Missing Values: 1 (0.18%)
    * Unique Values: 89 (15.64% of total)

**3.2.A. Numerical Column Analysis:**

**Descriptive Statistics:**
* Minimum: 0
* Maximum: 0.396
* Range: 0.396
* Sum: 18.147525
* Mean (Arithmetic): 0.031894
* Median (50th Percentile): 0.024426
* Mode(s): [0 (Frequency: 1.93%)]
* Standard Deviation: 0.03016
* Variance: 0.00091
* Coefficient of Variation (CV): 0.9456%

**Quantile & Percentile Statistics:**
* 1st Percentile: 0.000058
* 5th Percentile: 0.003421
* 10th Percentile: 0.00802
* 25th Percentile (Q1 - First Quartile): 0.014691
* 75th Percentile (Q3 - Third Quartile): 0.04294
* 90th Percentile: 0.058318
* 95th Percentile: 0.0764
* 99th Percentile: 0.139267
* Interquartile Range (IQR = Q3 - Q1): 0.02825
* Median Absolute Deviation (MAD): 0.013216

**Distribution Shape & Normality Assessment:**
* Skewness: 5.097 (Right-skewed (positive skew))
* Kurtosis (Excess): 48.4226 (Leptokurtic (heavy tails))
* Histogram Analysis: Distribution spans 10 bins
* Normality Tests:
    * Shapiro-Wilk Test: W-statistic = 12.345582, p-value = 0.5 (Data consistent with normal distribution (p > 0.05))
    * Jarque-Bera Test: JB-statistic = 126.567274, p-value = 0.001 (Data significantly deviates from normal distribution (p ≤ 0.05))
    * Kolmogorov-Smirnov Test: D-statistic = 0.129353, p-value = 0.2 (Data consistent with normal distribution (p > 0.05))

**Univariate Outlier Analysis:**
* Method 1: IQR Proximity Rule
    * Lower Fence (Q1 - 1.5 * IQR): -0.027684
    * Upper Fence (Q3 + 1.5 * IQR): 0.085315
    * Number of Outliers (Below Lower): 0 (0%)
    * Number of Outliers (Above Upper): 1 (1%)
    * Extreme Outliers (using 3.0 * IQR factor): 1 (1%)
* Method 2: Z-Score Method
    * Standard Deviations from Mean for Threshold: +/- 3
    * Number of Outliers (Z-score < -3): 0
    * Number of Outliers (Z-score > +3): 1
* Method 3: Modified Z-Score (using MAD)
    * Threshold: +/- 3.5
    * Number of Outliers: 2
* Summary of Outliers: Total 2 (2%). Min Outlier Value: 0.09953, Max Outlier Value: 0.1438.
* Potential Impact: Low outlier impact

**Specific Numerical Patterns & Characteristics:**
* Percentage of Zero Values: 4%
* Percentage of Negative Values: 0%
* Round Numbers Analysis: No significant rounding detected
* Potential for Log Transformation: Log transformation may not be beneficial

---
**Column: `concave points_se`**
* **Detected Data Type:** numerical_float
* **Inferred Semantic Type:** unknown
* **Data Quality Flag:** Good
* **Quick Stats:**
    * Total Values (Count): 570
    * Missing Values: 1 (0.18%)
    * Unique Values: 81 (14.24% of total)

**3.2.A. Numerical Column Analysis:**

**Descriptive Statistics:**
* Minimum: 0
* Maximum: 0.05279
* Range: 0.05279
* Sum: 6.712002
* Mean (Arithmetic): 0.011796
* Median (50th Percentile): 0.010669
* Mode(s): [0 (Frequency: 1.93%)]
* Standard Deviation: 0.006165
* Variance: 0.000038
* Coefficient of Variation (CV): 0.5226%

**Quantile & Percentile Statistics:**
* 1st Percentile: 0.000237
* 5th Percentile: 0.003663
* 10th Percentile: 0.005104
* 25th Percentile (Q1 - First Quartile): 0.007549
* 75th Percentile (Q3 - Third Quartile): 0.014677
* 90th Percentile: 0.01841
* 95th Percentile: 0.022066
* 99th Percentile: 0.033157
* Interquartile Range (IQR = Q3 - Q1): 0.007129
* Median Absolute Deviation (MAD): 0.003582

**Distribution Shape & Normality Assessment:**
* Skewness: 1.4409 (Right-skewed (positive skew))
* Kurtosis (Excess): 5.0708 (Leptokurtic (heavy tails))
* Histogram Analysis: Distribution spans 10 bins
* Normality Tests:
    * Shapiro-Wilk Test: W-statistic = 14.410891, p-value = 0.5 (Data consistent with normal distribution (p > 0.05))
    * Jarque-Bera Test: JB-statistic = 36.592089, p-value = 0.001 (Data significantly deviates from normal distribution (p ≤ 0.05))
    * Kolmogorov-Smirnov Test: D-statistic = 0.088013, p-value = 0.2 (Data consistent with normal distribution (p > 0.05))

**Univariate Outlier Analysis:**
* Method 1: IQR Proximity Rule
    * Lower Fence (Q1 - 1.5 * IQR): -0.003144
    * Upper Fence (Q3 + 1.5 * IQR): 0.02537
    * Number of Outliers (Below Lower): 0 (0%)
    * Number of Outliers (Above Upper): 3 (3%)
    * Extreme Outliers (using 3.0 * IQR factor): 0 (0%)
* Method 2: Z-Score Method
    * Standard Deviations from Mean for Threshold: +/- 3
    * Number of Outliers (Z-score < -3): 0
    * Number of Outliers (Z-score > +3): 2
* Method 3: Modified Z-Score (using MAD)
    * Threshold: +/- 3.5
    * Number of Outliers: 2
* Summary of Outliers: Total 3 (3%). Min Outlier Value: 0.02853, Max Outlier Value: 0.03487.
* Potential Impact: Low outlier impact

**Specific Numerical Patterns & Characteristics:**
* Percentage of Zero Values: 0%
* Percentage of Negative Values: 0%
* Round Numbers Analysis: No significant rounding detected
* Potential for Log Transformation: Log transformation may not be beneficial

---
**Column: `symmetry_se`**
* **Detected Data Type:** numerical_float
* **Inferred Semantic Type:** unknown
* **Data Quality Flag:** Good
* **Quick Stats:**
    * Total Values (Count): 570
    * Missing Values: 1 (0.18%)
    * Unique Values: 94 (16.52% of total)

**3.2.A. Numerical Column Analysis:**

**Descriptive Statistics:**
* Minimum: 0.007882
* Maximum: 0.07895
* Range: 0.071068
* Sum: 11.688568
* Mean (Arithmetic): 0.020542
* Median (50th Percentile): 0.018712
* Mode(s): [0.01454 (Frequency: 0.53%)]
* Standard Deviation: 0.008259
* Variance: 0.000068
* Coefficient of Variation (CV): 0.4021%

**Quantile & Percentile Statistics:**
* 1st Percentile: 0.010282
* 5th Percentile: 0.011826
* 10th Percentile: 0.013036
* 25th Percentile (Q1 - First Quartile): 0.015026
* 75th Percentile (Q3 - Third Quartile): 0.024459
* 90th Percentile: 0.03024
* 95th Percentile: 0.032038
* 99th Percentile: 0.054854
* Interquartile Range (IQR = Q3 - Q1): 0.009433
* Median Absolute Deviation (MAD): 0.003868

**Distribution Shape & Normality Assessment:**
* Skewness: 2.1893 (Right-skewed (positive skew))
* Kurtosis (Excess): 7.8164 (Leptokurtic (heavy tails))
* Histogram Analysis: Distribution spans 10 bins
* Normality Tests:
    * Shapiro-Wilk Test: W-statistic = 11.623634, p-value = 0.5 (Data consistent with normal distribution (p > 0.05))
    * Jarque-Bera Test: JB-statistic = 116.156166, p-value = 0.001 (Data significantly deviates from normal distribution (p ≤ 0.05))
    * Kolmogorov-Smirnov Test: D-statistic = 0.172366, p-value = 0.01 (Data significantly deviates from normal distribution (p ≤ 0.05))

**Univariate Outlier Analysis:**
* Method 1: IQR Proximity Rule
    * Lower Fence (Q1 - 1.5 * IQR): 0.000876
    * Upper Fence (Q3 + 1.5 * IQR): 0.038609
    * Number of Outliers (Below Lower): 0 (0%)
    * Number of Outliers (Above Upper): 2 (2%)
    * Extreme Outliers (using 3.0 * IQR factor): 3 (3%)
* Method 2: Z-Score Method
    * Standard Deviations from Mean for Threshold: +/- 3
    * Number of Outliers (Z-score < -3): 0
    * Number of Outliers (Z-score > +3): 4
* Method 3: Modified Z-Score (using MAD)
    * Threshold: +/- 3.5
    * Number of Outliers: 5
* Summary of Outliers: Total 5 (5%). Min Outlier Value: 0.04197, Max Outlier Value: 0.05963.
* Potential Impact: Low outlier impact

**Specific Numerical Patterns & Characteristics:**
* Percentage of Zero Values: 0%
* Percentage of Negative Values: 0%
* Round Numbers Analysis: No significant rounding detected
* Potential for Log Transformation: Log transformation may not be beneficial

---
**Column: `fractal_dimension_se`**
* **Detected Data Type:** numerical_float
* **Inferred Semantic Type:** unknown
* **Data Quality Flag:** Good
* **Quick Stats:**
    * Total Values (Count): 570
    * Missing Values: 1 (0.18%)
    * Unique Values: 97 (17.05% of total)

**3.2.A. Numerical Column Analysis:**

**Descriptive Statistics:**
* Minimum: 0.0008948
* Maximum: 0.02984
* Range: 0.028945199999999997
* Sum: 2.1593
* Mean (Arithmetic): 0.003795
* Median (50th Percentile): 0.00312
* Mode(s): [0.005667 (Frequency: 0.35%), 0.002551 (Frequency: 0.35%), 0.003224 (Frequency: 0.35%), 0.002665 (Frequency: 0.35%), 0.00456 (Frequency: 0.35%)]
* Standard Deviation: 0.002644
* Variance: 0.000007
* Coefficient of Variation (CV): 0.6967%

**Quantile & Percentile Statistics:**
* 1st Percentile: 0.001076
* 5th Percentile: 0.001542
* 10th Percentile: 0.001639
* 25th Percentile (Q1 - First Quartile): 0.002282
* 75th Percentile (Q3 - Third Quartile): 0.004428
* 90th Percentile: 0.006183
* 95th Percentile: 0.007971
* 99th Percentile: 0.012463
* Interquartile Range (IQR = Q3 - Q1): 0.002146
* Median Absolute Deviation (MAD): 0.001097

**Distribution Shape & Normality Assessment:**
* Skewness: 3.9136 (Right-skewed (positive skew))
* Kurtosis (Excess): 26.0399 (Leptokurtic (heavy tails))
* Histogram Analysis: Distribution spans 10 bins
* Normality Tests:
    * Shapiro-Wilk Test: W-statistic = 12.641648, p-value = 0.5 (Data consistent with normal distribution (p > 0.05))
    * Jarque-Bera Test: JB-statistic = 107.761907, p-value = 0.001 (Data significantly deviates from normal distribution (p ≤ 0.05))
    * Kolmogorov-Smirnov Test: D-statistic = 0.1364, p-value = 0.05 (Data significantly deviates from normal distribution (p ≤ 0.05))

**Univariate Outlier Analysis:**
* Method 1: IQR Proximity Rule
    * Lower Fence (Q1 - 1.5 * IQR): -0.000937
    * Upper Fence (Q3 + 1.5 * IQR): 0.007647
    * Number of Outliers (Below Lower): 0 (0%)
    * Number of Outliers (Above Upper): 2 (2%)
    * Extreme Outliers (using 3.0 * IQR factor): 2 (2%)
* Method 2: Z-Score Method
    * Standard Deviations from Mean for Threshold: +/- 3
    * Number of Outliers (Z-score < -3): 0
    * Number of Outliers (Z-score > +3): 0
* Method 3: Modified Z-Score (using MAD)
    * Threshold: +/- 3.5
    * Number of Outliers: 3
* Summary of Outliers: Total 4 (4%). Min Outlier Value: 0.008133, Max Outlier Value: 0.01172.
* Potential Impact: Low outlier impact

**Specific Numerical Patterns & Characteristics:**
* Percentage of Zero Values: 0%
* Percentage of Negative Values: 0%
* Round Numbers Analysis: No significant rounding detected
* Potential for Log Transformation: Log transformation may not be beneficial

---
**Column: `radius_worst`**
* **Detected Data Type:** numerical_float
* **Inferred Semantic Type:** unknown
* **Data Quality Flag:** Good
* **Quick Stats:**
    * Total Values (Count): 570
    * Missing Values: 1 (0.18%)
    * Unique Values: 96 (16.87% of total)

**3.2.A. Numerical Column Analysis:**

**Descriptive Statistics:**
* Minimum: 7.93
* Maximum: 36.04
* Range: 28.11
* Sum: 9257.169
* Mean (Arithmetic): 16.26919
* Median (50th Percentile): 14.561033
* Mode(s): [19.85 (Frequency: 0.53%), 15.53 (Frequency: 0.53%), 12.84 (Frequency: 0.53%), 14.91 (Frequency: 0.53%), 15.11 (Frequency: 0.53%)]
* Standard Deviation: 4.828993
* Variance: 23.319169
* Coefficient of Variation (CV): 0.2968%

**Quantile & Percentile Statistics:**
* 1st Percentile: 9.256675
* 5th Percentile: 10.632133
* 10th Percentile: 11.198517
* 25th Percentile (Q1 - First Quartile): 13.058136
* 75th Percentile (Q3 - Third Quartile): 18.986416
* 90th Percentile: 23.327086
* 95th Percentile: 25.537685
* 99th Percentile: 30.960691
* Interquartile Range (IQR = Q3 - Q1): 5.92828
* Median Absolute Deviation (MAD): 2.081033

**Distribution Shape & Normality Assessment:**
* Skewness: 1.1002 (Right-skewed (positive skew))
* Kurtosis (Excess): 0.9253 (Leptokurtic (heavy tails))
* Histogram Analysis: Distribution spans 10 bins
* Normality Tests:
    * Shapiro-Wilk Test: W-statistic = 14.129187, p-value = 0.5 (Data consistent with normal distribution (p > 0.05))
    * Jarque-Bera Test: JB-statistic = 25.124793, p-value = 0.001 (Data significantly deviates from normal distribution (p ≤ 0.05))
    * Kolmogorov-Smirnov Test: D-statistic = 0.187608, p-value = 0.01 (Data significantly deviates from normal distribution (p ≤ 0.05))

**Univariate Outlier Analysis:**
* Method 1: IQR Proximity Rule
    * Lower Fence (Q1 - 1.5 * IQR): 4.165717
    * Upper Fence (Q3 + 1.5 * IQR): 27.878836
    * Number of Outliers (Below Lower): 0 (0%)
    * Number of Outliers (Above Upper): 2 (2%)
    * Extreme Outliers (using 3.0 * IQR factor): 0 (0%)
* Method 2: Z-Score Method
    * Standard Deviations from Mean for Threshold: +/- 3
    * Number of Outliers (Z-score < -3): 0
    * Number of Outliers (Z-score > +3): 1
* Method 3: Modified Z-Score (using MAD)
    * Threshold: +/- 3.5
    * Number of Outliers: 8
* Summary of Outliers: Total 8 (8%). Min Outlier Value: 25.38, Max Outlier Value: 36.04.
* Potential Impact: High outlier presence may affect analysis

**Specific Numerical Patterns & Characteristics:**
* Percentage of Zero Values: 0%
* Percentage of Negative Values: 0%
* Round Numbers Analysis: No significant rounding detected
* Potential for Log Transformation: Log transformation may not be beneficial

---
**Column: `texture_worst`**
* **Detected Data Type:** numerical_float
* **Inferred Semantic Type:** unknown
* **Data Quality Flag:** Good
* **Quick Stats:**
    * Total Values (Count): 570
    * Missing Values: 1 (0.18%)
    * Unique Values: 88 (15.47% of total)

**3.2.A. Numerical Column Analysis:**

**Descriptive Statistics:**
* Minimum: 12.02
* Maximum: 49.54
* Range: 37.519999999999996
* Sum: 14610.34
* Mean (Arithmetic): 25.677223
* Median (50th Percentile): 25.33964
* Mode(s): [27.26 (Frequency: 0.53%)]
* Standard Deviation: 6.140854
* Variance: 37.710092
* Coefficient of Variation (CV): 0.2392%

**Quantile & Percentile Statistics:**
* 1st Percentile: 14.526801
* 5th Percentile: 16.353079
* 10th Percentile: 17.679007
* 25th Percentile (Q1 - First Quartile): 20.000038
* 75th Percentile (Q3 - Third Quartile): 29.070419
* 90th Percentile: 33.404501
* 95th Percentile: 36.124223
* 99th Percentile: 42.131901
* Interquartile Range (IQR = Q3 - Q1): 9.070382
* Median Absolute Deviation (MAD): 3.72964

**Distribution Shape & Normality Assessment:**
* Skewness: 0.497 (Approximately symmetric)
* Kurtosis (Excess): 0.2118 (Mesokurtic (normal-like tails))
* Histogram Analysis: Distribution spans 10 bins
* Normality Tests:
    * Shapiro-Wilk Test: W-statistic = 16.01375, p-value = 0.5 (Data consistent with normal distribution (p > 0.05))
    * Jarque-Bera Test: JB-statistic = 1.152272, p-value = 0.2 (Data consistent with normal distribution (p > 0.05))
    * Kolmogorov-Smirnov Test: D-statistic = 0.052558, p-value = 0.2 (Data consistent with normal distribution (p > 0.05))

**Univariate Outlier Analysis:**
* Method 1: IQR Proximity Rule
    * Lower Fence (Q1 - 1.5 * IQR): 6.394465
    * Upper Fence (Q3 + 1.5 * IQR): 42.675992
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
* Round Numbers Analysis: No significant rounding detected
* Potential for Log Transformation: Log transformation may not be beneficial

---
**Column: `perimeter_worst`**
* **Detected Data Type:** numerical_float
* **Inferred Semantic Type:** unknown
* **Data Quality Flag:** Good
* **Quick Stats:**
    * Total Values (Count): 570
    * Missing Values: 1 (0.18%)
    * Unique Values: 89 (15.64% of total)

**3.2.A. Numerical Column Analysis:**

**Descriptive Statistics:**
* Minimum: 50.41
* Maximum: 251.2
* Range: 200.79
* Sum: 61031.63
* Mean (Arithmetic): 107.261213
* Median (50th Percentile): 97.421351
* Mode(s): [117.7 (Frequency: 0.53%)]
* Standard Deviation: 33.573002
* Variance: 1127.146434
* Coefficient of Variation (CV): 0.313%

**Quantile & Percentile Statistics:**
* 1st Percentile: 59.191825
* 5th Percentile: 67.650625
* 10th Percentile: 72.299642
* 25th Percentile (Q1 - First Quartile): 83.442609
* 75th Percentile (Q3 - Third Quartile): 112.675746
* 90th Percentile: 155.448405
* 95th Percentile: 168.678734
* 99th Percentile: 203.922721
* Interquartile Range (IQR = Q3 - Q1): 29.233137
* Median Absolute Deviation (MAD): 14.578649

**Distribution Shape & Normality Assessment:**
* Skewness: 1.1252 (Right-skewed (positive skew))
* Kurtosis (Excess): 1.0502 (Leptokurtic (heavy tails))
* Histogram Analysis: Distribution spans 10 bins
* Normality Tests:
    * Shapiro-Wilk Test: W-statistic = 13.460964, p-value = 0.5 (Data consistent with normal distribution (p > 0.05))
    * Jarque-Bera Test: JB-statistic = 32.651518, p-value = 0.001 (Data significantly deviates from normal distribution (p ≤ 0.05))
    * Kolmogorov-Smirnov Test: D-statistic = 0.151853, p-value = 0.05 (Data significantly deviates from normal distribution (p ≤ 0.05))

**Univariate Outlier Analysis:**
* Method 1: IQR Proximity Rule
    * Lower Fence (Q1 - 1.5 * IQR): 39.592904
    * Upper Fence (Q3 + 1.5 * IQR): 156.525451
    * Number of Outliers (Below Lower): 0 (0%)
    * Number of Outliers (Above Upper): 9 (9%)
    * Extreme Outliers (using 3.0 * IQR factor): 1 (1%)
* Method 2: Z-Score Method
    * Standard Deviations from Mean for Threshold: +/- 3
    * Number of Outliers (Z-score < -3): 0
    * Number of Outliers (Z-score > +3): 1
* Method 3: Modified Z-Score (using MAD)
    * Threshold: +/- 3.5
    * Number of Outliers: 8
* Summary of Outliers: Total 9 (9%). Min Outlier Value: 161.7, Max Outlier Value: 229.3.
* Potential Impact: High outlier presence may affect analysis

**Specific Numerical Patterns & Characteristics:**
* Percentage of Zero Values: 0%
* Percentage of Negative Values: 0%
* Round Numbers Analysis: No significant rounding detected
* Potential for Log Transformation: Log transformation may not be beneficial

---
**Column: `area_worst`**
* **Detected Data Type:** numerical_float
* **Inferred Semantic Type:** unknown
* **Data Quality Flag:** Good
* **Quick Stats:**
    * Total Values (Count): 570
    * Missing Values: 1 (0.18%)
    * Unique Values: 80 (14.06% of total)

**3.2.A. Numerical Column Analysis:**

**Descriptive Statistics:**
* Minimum: 185.2
* Maximum: 4254
* Range: 4068.8
* Sum: 501051.8
* Mean (Arithmetic): 880.583128
* Median (50th Percentile): 645.220265
* Mode(s): [698.8 (Frequency: 0.35%), 1623 (Frequency: 0.35%), 1261 (Frequency: 0.35%), 284.4 (Frequency: 0.35%), 1269 (Frequency: 0.35%)]
* Standard Deviation: 568.856459
* Variance: 323597.670893
* Coefficient of Variation (CV): 0.646%

**Quantile & Percentile Statistics:**
* 1st Percentile: 250.843018
* 5th Percentile: 346.867954
* 10th Percentile: 366.241361
* 25th Percentile (Q1 - First Quartile): 519.717366
* 75th Percentile (Q3 - Third Quartile): 866.739589
* 90th Percentile: 1717.802199
* 95th Percentile: 1981.629566
* 99th Percentile: 2837.058042
* Interquartile Range (IQR = Q3 - Q1): 347.022223
* Median Absolute Deviation (MAD): 187.479735

**Distribution Shape & Normality Assessment:**
* Skewness: 1.8545 (Right-skewed (positive skew))
* Kurtosis (Excess): 4.3473 (Leptokurtic (heavy tails))
* Histogram Analysis: Distribution spans 10 bins
* Normality Tests:
    * Shapiro-Wilk Test: W-statistic = 11.424697, p-value = 0.5 (Data consistent with normal distribution (p > 0.05))
    * Jarque-Bera Test: JB-statistic = 106.553707, p-value = 0.001 (Data significantly deviates from normal distribution (p ≤ 0.05))
    * Kolmogorov-Smirnov Test: D-statistic = 0.200238, p-value = 0.01 (Data significantly deviates from normal distribution (p ≤ 0.05))

**Univariate Outlier Analysis:**
* Method 1: IQR Proximity Rule
    * Lower Fence (Q1 - 1.5 * IQR): -0.815968
    * Upper Fence (Q3 + 1.5 * IQR): 1387.272923
    * Number of Outliers (Below Lower): 0 (0%)
    * Number of Outliers (Above Upper): 13 (13%)
    * Extreme Outliers (using 3.0 * IQR factor): 5 (5%)
* Method 2: Z-Score Method
    * Standard Deviations from Mean for Threshold: +/- 3
    * Number of Outliers (Z-score < -3): 0
    * Number of Outliers (Z-score > +3): 2
* Method 3: Modified Z-Score (using MAD)
    * Threshold: +/- 3.5
    * Number of Outliers: 12
* Summary of Outliers: Total 18 (18%). Min Outlier Value: 1403, Max Outlier Value: 3216.
* Potential Impact: High outlier presence may affect analysis

**Specific Numerical Patterns & Characteristics:**
* Percentage of Zero Values: 0%
* Percentage of Negative Values: 0%
* Round Numbers Analysis: No significant rounding detected
* Potential for Log Transformation: Good candidate for log transformation due to wide range

---
**Column: `smoothness_worst`**
* **Detected Data Type:** numerical_float
* **Inferred Semantic Type:** unknown
* **Data Quality Flag:** Good
* **Quick Stats:**
    * Total Values (Count): 570
    * Missing Values: 1 (0.18%)
    * Unique Values: 94 (16.52% of total)

**3.2.A. Numerical Column Analysis:**

**Descriptive Statistics:**
* Minimum: 0.07117
* Maximum: 0.2226
* Range: 0.15143
* Sum: 75.31773
* Mean (Arithmetic): 0.132369
* Median (50th Percentile): 0.130868
* Mode(s): [0.1275 (Frequency: 0.7%), 0.1312 (Frequency: 0.7%), 0.1401 (Frequency: 0.7%), 0.1216 (Frequency: 0.7%)]
* Standard Deviation: 0.022812
* Variance: 0.00052
* Coefficient of Variation (CV): 0.1723%

**Quantile & Percentile Statistics:**
* 1st Percentile: 0.086408
* 5th Percentile: 0.094663
* 10th Percentile: 0.102877
* 25th Percentile (Q1 - First Quartile): 0.114622
* 75th Percentile (Q3 - Third Quartile): 0.147874
* 90th Percentile: 0.153535
* 95th Percentile: 0.16876
* 99th Percentile: 0.188876
* Interquartile Range (IQR = Q3 - Q1): 0.033252
* Median Absolute Deviation (MAD): 0.016332

**Distribution Shape & Normality Assessment:**
* Skewness: 0.4143 (Approximately symmetric)
* Kurtosis (Excess): 0.5028 (Leptokurtic (heavy tails))
* Histogram Analysis: Distribution spans 10 bins
* Normality Tests:
    * Shapiro-Wilk Test: W-statistic = 15.326798, p-value = 0.5 (Data consistent with normal distribution (p > 0.05))
    * Jarque-Bera Test: JB-statistic = 11.862574, p-value = 0.01 (Data significantly deviates from normal distribution (p ≤ 0.05))
    * Kolmogorov-Smirnov Test: D-statistic = 0.055298, p-value = 0.2 (Data consistent with normal distribution (p > 0.05))

**Univariate Outlier Analysis:**
* Method 1: IQR Proximity Rule
    * Lower Fence (Q1 - 1.5 * IQR): 0.064745
    * Upper Fence (Q3 + 1.5 * IQR): 0.197751
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
* Summary of Outliers: Total 1 (1%). Min Outlier Value: 0.2184, Max Outlier Value: 0.2184.
* Potential Impact: Low outlier impact

**Specific Numerical Patterns & Characteristics:**
* Percentage of Zero Values: 0%
* Percentage of Negative Values: 0%
* Round Numbers Analysis: No significant rounding detected
* Potential for Log Transformation: Log transformation may not be beneficial

---
**Column: `compactness_worst`**
* **Detected Data Type:** numerical_float
* **Inferred Semantic Type:** unknown
* **Data Quality Flag:** Good
* **Quick Stats:**
    * Total Values (Count): 570
    * Missing Values: 1 (0.18%)
    * Unique Values: 98 (17.22% of total)

**3.2.A. Numerical Column Analysis:**

**Descriptive Statistics:**
* Minimum: 0.02729
* Maximum: 1.058
* Range: 1.03071
* Sum: 144.67681
* Mean (Arithmetic): 0.254265
* Median (50th Percentile): 0.206015
* Mode(s): [0.3416 (Frequency: 0.53%)]
* Standard Deviation: 0.157198
* Variance: 0.024711
* Coefficient of Variation (CV): 0.6182%

**Quantile & Percentile Statistics:**
* 1st Percentile: 0.048271
* 5th Percentile: 0.06485
* 10th Percentile: 0.092703
* 25th Percentile (Q1 - First Quartile): 0.143589
* 75th Percentile (Q3 - Third Quartile): 0.30703
* 90th Percentile: 0.394218
* 95th Percentile: 0.696587
* 99th Percentile: 0.755251
* Interquartile Range (IQR = Q3 - Q1): 0.16344
* Median Absolute Deviation (MAD): 0.090085

**Distribution Shape & Normality Assessment:**
* Skewness: 1.4697 (Right-skewed (positive skew))
* Kurtosis (Excess): 3.0021 (Leptokurtic (heavy tails))
* Histogram Analysis: Distribution spans 10 bins
* Normality Tests:
    * Shapiro-Wilk Test: W-statistic = 14.566034, p-value = 0.5 (Data consistent with normal distribution (p > 0.05))
    * Jarque-Bera Test: JB-statistic = 26.681285, p-value = 0.001 (Data significantly deviates from normal distribution (p ≤ 0.05))
    * Kolmogorov-Smirnov Test: D-statistic = 0.09793, p-value = 0.2 (Data consistent with normal distribution (p > 0.05))

**Univariate Outlier Analysis:**
* Method 1: IQR Proximity Rule
    * Lower Fence (Q1 - 1.5 * IQR): -0.101571
    * Upper Fence (Q3 + 1.5 * IQR): 0.55219
    * Number of Outliers (Below Lower): 0 (0%)
    * Number of Outliers (Above Upper): 6 (6%)
    * Extreme Outliers (using 3.0 * IQR factor): 0 (0%)
* Method 2: Z-Score Method
    * Standard Deviations from Mean for Threshold: +/- 3
    * Number of Outliers (Z-score < -3): 0
    * Number of Outliers (Z-score > +3): 2
* Method 3: Modified Z-Score (using MAD)
    * Threshold: +/- 3.5
    * Number of Outliers: 2
* Summary of Outliers: Total 6 (6%). Min Outlier Value: 0.5849, Max Outlier Value: 0.7917.
* Potential Impact: High outlier presence may affect analysis

**Specific Numerical Patterns & Characteristics:**
* Percentage of Zero Values: 0%
* Percentage of Negative Values: 0%
* Round Numbers Analysis: No significant rounding detected
* Potential for Log Transformation: Log transformation may not be beneficial

---
**Column: `concavity_worst`**
* **Detected Data Type:** numerical_float
* **Inferred Semantic Type:** unknown
* **Data Quality Flag:** Good
* **Quick Stats:**
    * Total Values (Count): 570
    * Missing Values: 1 (0.18%)
    * Unique Values: 92 (16.17% of total)

**3.2.A. Numerical Column Analysis:**

**Descriptive Statistics:**
* Minimum: 0
* Maximum: 1.252
* Range: 1.252
* Sum: 154.875247
* Mean (Arithmetic): 0.272188
* Median (50th Percentile): 0.217953
* Mode(s): [0 (Frequency: 1.93%)]
* Standard Deviation: 0.208441
* Variance: 0.043448
* Coefficient of Variation (CV): 0.7658%

**Quantile & Percentile Statistics:**
* 1st Percentile: 0.00002
* 5th Percentile: 0.027271
* 10th Percentile: 0.051451
* 25th Percentile (Q1 - First Quartile): 0.126903
* 75th Percentile (Q3 - Third Quartile): 0.365732
* 90th Percentile: 0.501088
* 95th Percentile: 0.660703
* 99th Percentile: 0.882889
* Interquartile Range (IQR = Q3 - Q1): 0.238829
* Median Absolute Deviation (MAD): 0.134713

**Distribution Shape & Normality Assessment:**
* Skewness: 1.1472 (Right-skewed (positive skew))
* Kurtosis (Excess): 1.5906 (Leptokurtic (heavy tails))
* Histogram Analysis: Distribution spans 10 bins
* Normality Tests:
    * Shapiro-Wilk Test: W-statistic = 14.88165, p-value = 0.5 (Data consistent with normal distribution (p > 0.05))
    * Jarque-Bera Test: JB-statistic = 37.785386, p-value = 0.001 (Data significantly deviates from normal distribution (p ≤ 0.05))
    * Kolmogorov-Smirnov Test: D-statistic = 0.141537, p-value = 0.05 (Data significantly deviates from normal distribution (p ≤ 0.05))

**Univariate Outlier Analysis:**
* Method 1: IQR Proximity Rule
    * Lower Fence (Q1 - 1.5 * IQR): -0.231341
    * Upper Fence (Q3 + 1.5 * IQR): 0.723975
    * Number of Outliers (Below Lower): 0 (0%)
    * Number of Outliers (Above Upper): 4 (4%)
    * Extreme Outliers (using 3.0 * IQR factor): 1 (1%)
* Method 2: Z-Score Method
    * Standard Deviations from Mean for Threshold: +/- 3
    * Number of Outliers (Z-score < -3): 0
    * Number of Outliers (Z-score > +3): 1
* Method 3: Modified Z-Score (using MAD)
    * Threshold: +/- 3.5
    * Number of Outliers: 1
* Summary of Outliers: Total 5 (5%). Min Outlier Value: 0.7345, Max Outlier Value: 1.17.
* Potential Impact: Low outlier impact

**Specific Numerical Patterns & Characteristics:**
* Percentage of Zero Values: 1%
* Percentage of Negative Values: 0%
* Round Numbers Analysis: No significant rounding detected
* Potential for Log Transformation: Log transformation may not be beneficial

---
**Column: `concave points_worst`**
* **Detected Data Type:** numerical_float
* **Inferred Semantic Type:** unknown
* **Data Quality Flag:** Good
* **Quick Stats:**
    * Total Values (Count): 570
    * Missing Values: 1 (0.18%)
    * Unique Values: 83 (14.59% of total)

**3.2.A. Numerical Column Analysis:**

**Descriptive Statistics:**
* Minimum: 0
* Maximum: 0.291
* Range: 0.291
* Sum: 65.210941
* Mean (Arithmetic): 0.114606
* Median (50th Percentile): 0.100892
* Mode(s): [0 (Frequency: 1.93%)]
* Standard Deviation: 0.065675
* Variance: 0.004313
* Coefficient of Variation (CV): 0.573%

**Quantile & Percentile Statistics:**
* 1st Percentile: 0.000228
* 5th Percentile: 0.023505
* 10th Percentile: 0.035588
* 25th Percentile (Q1 - First Quartile): 0.065759
* 75th Percentile (Q3 - Third Quartile): 0.172719
* 90th Percentile: 0.205263
* 95th Percentile: 0.232965
* 99th Percentile: 0.271737
* Interquartile Range (IQR = Q3 - Q1): 0.10696
* Median Absolute Deviation (MAD): 0.045832

**Distribution Shape & Normality Assessment:**
* Skewness: 0.4913 (Approximately symmetric)
* Kurtosis (Excess): -0.5414 (Platykurtic (light tails))
* Histogram Analysis: Distribution spans 10 bins
* Normality Tests:
    * Shapiro-Wilk Test: W-statistic = 17.224775, p-value = 0.5 (Data consistent with normal distribution (p > 0.05))
    * Jarque-Bera Test: JB-statistic = 3.84978, p-value = 0.2 (Data consistent with normal distribution (p > 0.05))
    * Kolmogorov-Smirnov Test: D-statistic = 0.106401, p-value = 0.2 (Data consistent with normal distribution (p > 0.05))

**Univariate Outlier Analysis:**
* Method 1: IQR Proximity Rule
    * Lower Fence (Q1 - 1.5 * IQR): -0.09468
    * Upper Fence (Q3 + 1.5 * IQR): 0.333158
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
* Percentage of Zero Values: 5%
* Percentage of Negative Values: 0%
* Round Numbers Analysis: No significant rounding detected
* Potential for Log Transformation: Log transformation may not be beneficial

---
**Column: `symmetry_worst`**
* **Detected Data Type:** numerical_float
* **Inferred Semantic Type:** unknown
* **Data Quality Flag:** Good
* **Quick Stats:**
    * Total Values (Count): 570
    * Missing Values: 1 (0.18%)
    * Unique Values: 89 (15.64% of total)

**3.2.A. Numerical Column Analysis:**

**Descriptive Statistics:**
* Minimum: 0.1565
* Maximum: 0.6638
* Range: 0.5073
* Sum: 165.053
* Mean (Arithmetic): 0.290076
* Median (50th Percentile): 0.27919
* Mode(s): [0.2383 (Frequency: 0.53%), 0.3196 (Frequency: 0.53%), 0.2972 (Frequency: 0.53%)]
* Standard Deviation: 0.061813
* Variance: 0.003821
* Coefficient of Variation (CV): 0.2131%

**Quantile & Percentile Statistics:**
* 1st Percentile: 0.176358
* 5th Percentile: 0.213082
* 10th Percentile: 0.225234
* 25th Percentile (Q1 - First Quartile): 0.251381
* 75th Percentile (Q3 - Third Quartile): 0.318703
* 90th Percentile: 0.324538
* 95th Percentile: 0.357479
* 99th Percentile: 0.529969
* Interquartile Range (IQR = Q3 - Q1): 0.067322
* Median Absolute Deviation (MAD): 0.03461

**Distribution Shape & Normality Assessment:**
* Skewness: 1.4301 (Right-skewed (positive skew))
* Kurtosis (Excess): 4.3951 (Leptokurtic (heavy tails))
* Histogram Analysis: Distribution spans 10 bins
* Normality Tests:
    * Shapiro-Wilk Test: W-statistic = 13.401791, p-value = 0.5 (Data consistent with normal distribution (p > 0.05))
    * Jarque-Bera Test: JB-statistic = 24.778908, p-value = 0.001 (Data significantly deviates from normal distribution (p ≤ 0.05))
    * Kolmogorov-Smirnov Test: D-statistic = 0.128534, p-value = 0.2 (Data consistent with normal distribution (p > 0.05))

**Univariate Outlier Analysis:**
* Method 1: IQR Proximity Rule
    * Lower Fence (Q1 - 1.5 * IQR): 0.150398
    * Upper Fence (Q3 + 1.5 * IQR): 0.419685
    * Number of Outliers (Below Lower): 0 (0%)
    * Number of Outliers (Above Upper): 5 (5%)
    * Extreme Outliers (using 3.0 * IQR factor): 0 (0%)
* Method 2: Z-Score Method
    * Standard Deviations from Mean for Threshold: +/- 3
    * Number of Outliers (Z-score < -3): 0
    * Number of Outliers (Z-score > +3): 2
* Method 3: Modified Z-Score (using MAD)
    * Threshold: +/- 3.5
    * Number of Outliers: 4
* Summary of Outliers: Total 5 (5%). Min Outlier Value: 0.4228, Max Outlier Value: 0.4882.
* Potential Impact: Low outlier impact

**Specific Numerical Patterns & Characteristics:**
* Percentage of Zero Values: 0%
* Percentage of Negative Values: 0%
* Round Numbers Analysis: No significant rounding detected
* Potential for Log Transformation: Log transformation may not be beneficial

---
**Column: `fractal_dimension_worst`**
* **Detected Data Type:** numerical_float
* **Inferred Semantic Type:** unknown
* **Data Quality Flag:** Good
* **Quick Stats:**
    * Total Values (Count): 570
    * Missing Values: 1 (0.18%)
    * Unique Values: 96 (16.87% of total)

**3.2.A. Numerical Column Analysis:**

**Descriptive Statistics:**
* Minimum: 0.05504
* Maximum: 0.2075
* Range: 0.15245999999999998
* Sum: 47.76517
* Mean (Arithmetic): 0.083946
* Median (50th Percentile): 0.079802
* Mode(s): [0.08368 (Frequency: 0.35%), 0.09026 (Frequency: 0.35%), 0.0849 (Frequency: 0.35%), 0.08633 (Frequency: 0.35%), 0.07987 (Frequency: 0.35%)]
* Standard Deviation: 0.018045
* Variance: 0.000326
* Coefficient of Variation (CV): 0.215%

**Quantile & Percentile Statistics:**
* 1st Percentile: 0.05778
* 5th Percentile: 0.063038
* 10th Percentile: 0.065131
* 25th Percentile (Q1 - First Quartile): 0.072362
* 75th Percentile (Q3 - Third Quartile): 0.089676
* 90th Percentile: 0.103527
* 95th Percentile: 0.132035
* 99th Percentile: 0.145278
* Interquartile Range (IQR = Q3 - Q1): 0.017315
* Median Absolute Deviation (MAD): 0.010842

**Distribution Shape & Normality Assessment:**
* Skewness: 1.6582 (Right-skewed (positive skew))
* Kurtosis (Excess): 5.1881 (Leptokurtic (heavy tails))
* Histogram Analysis: Distribution spans 10 bins
* Normality Tests:
    * Shapiro-Wilk Test: W-statistic = 13.512147, p-value = 0.5 (Data consistent with normal distribution (p > 0.05))
    * Jarque-Bera Test: JB-statistic = 64.877018, p-value = 0.001 (Data significantly deviates from normal distribution (p ≤ 0.05))
    * Kolmogorov-Smirnov Test: D-statistic = 0.140387, p-value = 0.05 (Data significantly deviates from normal distribution (p ≤ 0.05))

**Univariate Outlier Analysis:**
* Method 1: IQR Proximity Rule
    * Lower Fence (Q1 - 1.5 * IQR): 0.04639
    * Upper Fence (Q3 + 1.5 * IQR): 0.115648
    * Number of Outliers (Below Lower): 0 (0%)
    * Number of Outliers (Above Upper): 7 (7%)
    * Extreme Outliers (using 3.0 * IQR factor): 1 (1%)
* Method 2: Z-Score Method
    * Standard Deviations from Mean for Threshold: +/- 3
    * Number of Outliers (Z-score < -3): 0
    * Number of Outliers (Z-score > +3): 4
* Method 3: Modified Z-Score (using MAD)
    * Threshold: +/- 3.5
    * Number of Outliers: 4
* Summary of Outliers: Total 7 (7%). Min Outlier Value: 0.1162, Max Outlier Value: 0.173.
* Potential Impact: High outlier presence may affect analysis

**Specific Numerical Patterns & Characteristics:**
* Percentage of Zero Values: 0%
* Percentage of Negative Values: 0%
* Round Numbers Analysis: No significant rounding detected
* Potential for Log Transformation: Log transformation may not be beneficial

**3.3. Bivariate Analysis (Exploring Relationships Between Pairs of Variables):**

**Numerical vs. Numerical:**
    * **Correlation Matrix Summary (Pearson's r):**
        * Total Pairs Analysed: 30
        * Top 5 Strongest Positive Correlations:
        1. `id` vs `area_se`: r = 0.1777 (Correlation significantly different from zero (p ≤ 0.05)) - Very Weak positive correlation (Correlation significantly different from zero (p ≤ 0.05)).
        2. `id` vs `radius_se`: r = 0.143 (Correlation significantly different from zero (p ≤ 0.05)) - Very Weak positive correlation (Correlation significantly different from zero (p ≤ 0.05)).
        3. `id` vs `perimeter_se`: r = 0.1373 (Correlation significantly different from zero (p ≤ 0.05)) - Very Weak positive correlation (Correlation significantly different from zero (p ≤ 0.05)).
        4. `id` vs `area_worst`: r = 0.1072 (Correlation significantly different from zero (p ≤ 0.05)) - Very Weak positive correlation (Correlation significantly different from zero (p ≤ 0.05)).
        5. `id` vs `texture_mean`: r = 0.0998 (Correlation significantly different from zero (p ≤ 0.05)) - Very Weak positive correlation (Correlation significantly different from zero (p ≤ 0.05)).
        * Top 5 Strongest Negative Correlations:
        1. `id` vs `fractal_dimension_mean`: r = -0.0525 (Correlation not significantly different from zero (p > 0.05)) - Very Weak negative correlation (Correlation not significantly different from zero (p > 0.05)).
        2. `id` vs `symmetry_worst`: r = -0.0442 (Correlation not significantly different from zero (p > 0.05)) - Very Weak negative correlation (Correlation not significantly different from zero (p > 0.05)).
        3. `id` vs `fractal_dimension_worst`: r = -0.0299 (Correlation not significantly different from zero (p > 0.05)) - Very Weak negative correlation (Correlation not significantly different from zero (p > 0.05)).
        4. `id` vs `symmetry_mean`: r = -0.0221 (Correlation not significantly different from zero (p > 0.05)) - Very Weak negative correlation (Correlation not significantly different from zero (p > 0.05)).
        5. `id` vs `symmetry_se`: r = -0.0173 (Correlation not significantly different from zero (p > 0.05)) - Very Weak negative correlation (Correlation not significantly different from zero (p > 0.05)).
        * Strong Correlations (|r| > 0.5): 0 pairs identified
    * **Scatter Plot Insights (Key Relationships):**
        * `id` vs `radius_mean`: "50 point sample shows linear relationship" (Recommended: Scatter plot with trend line)
        * `id` vs `texture_mean`: "50 point sample shows linear relationship" (Recommended: Scatter plot with trend line)
        * `id` vs `perimeter_mean`: "50 point sample shows linear relationship" (Recommended: Scatter plot with trend line)

**Numerical vs. Categorical:**
    * **Comparative Statistics (Mean/Median by Category):**
    * **`diagnosis` by `id`:**
        | Category | Mean | Median | StdDev | Count |
        |----------|------|--------|--------|-------|
        | M | 0 | 0 | 0 | 212 |
        | B | 0 | 0 | 0 | 357 |
        * **Statistical Tests:** ANOVA F-statistic = 1.5, p-value = 0.2 (No significant difference between groups)
        * **Summary:** M has highest mean (0.00), B has lowest (0.00)

    * **`radius_mean` by `diagnosis`:**
        | Category | Mean | Median | StdDev | Count |
        |----------|------|--------|--------|-------|
        | M | 0 | 0 | 0 | 212 |
        | B | 0 | 0 | 0 | 357 |
        * **Statistical Tests:** ANOVA F-statistic = 1.5, p-value = 0.2 (No significant difference between groups)
        * **Summary:** M has highest mean (0.00), B has lowest (0.00)

    * **`texture_mean` by `diagnosis`:**
        | Category | Mean | Median | StdDev | Count |
        |----------|------|--------|--------|-------|
        | M | 0 | 0 | 0 | 212 |
        | B | 0 | 0 | 0 | 357 |
        * **Statistical Tests:** ANOVA F-statistic = 1.5, p-value = 0.2 (No significant difference between groups)
        * **Summary:** M has highest mean (0.00), B has lowest (0.00)

**3.4. Multivariate Analysis (Preliminary Insights into Complex Interactions):**
    * **Principal Component Analysis:** Not applicable - insufficient numerical variables.

    * **Cluster Analysis:** Not performed - data characteristics not suitable for clustering.

    * **Feature Interactions:** No significant interactions detected.

**3.5. Specific Analysis Modules (Activated Based on Data Characteristics):**

    * **No Specific Modules Activated:** Dataset does not contain sufficient datetime or rich text columns for specialized analysis modules.

**3.6. EDA Summary & Key Hypotheses/Insights:**
    * **Top Statistical Findings:**
    1. Streaming analysis processed 570 rows using only 21MB peak memory
    * **Data Quality Issues Uncovered:**
    * No major data quality issues identified during EDA.
    * **Hypotheses Generated for Further Testing:**
    * No specific hypotheses generated - consider domain knowledge for hypothesis formation.
    * **Recommendations for Data Preprocessing & Feature Engineering:**
    * Standard preprocessing steps recommended based on detected data types.
    * **Critical Warnings & Considerations:**




---

**Analysis Performance Summary:**
* **Processing Time:** 55ms (0.06 seconds)
* **Rows Analysed:** 570
* **Memory Efficiency:** Constant ~21MB usage
* **Analysis Method:** Streaming with online algorithms
* **Dataset Size:** 570 records across 32 columns