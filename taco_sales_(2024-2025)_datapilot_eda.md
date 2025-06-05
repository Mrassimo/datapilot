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
**Column: `Column_1`**
* **Detected Data Type:** numerical_integer
* **Inferred Semantic Type:** unknown
* **Data Quality Flag:** Good
* **Quick Stats:**
    * Total Values (Count): 1,001
    * Missing Values: 1 (0.1%)
    * Unique Values: 97 (9.7% of total)

**3.2.A. Numerical Column Analysis:**

**Descriptive Statistics:**
* Minimum: 101139
* Maximum: 999138
* Range: 897999
* Sum: 552504865
* Mean (Arithmetic): 552504.865
* Median (50th Percentile): 578086.799431
* Mode(s): [770487 (Frequency: 0.1%), 671858 (Frequency: 0.1%), 688508 (Frequency: 0.1%), 944962 (Frequency: 0.1%), 476417 (Frequency: 0.1%)]
* Standard Deviation: 255820.77331
* Variance: 65444268056.8748
* Coefficient of Variation (CV): 0.463%

**Quantile & Percentile Statistics:**
* 1st Percentile: 110604.725823
* 5th Percentile: 149239.020286
* 10th Percentile: 183885.003314
* 25th Percentile (Q1 - First Quartile): 355184.287244
* 75th Percentile (Q3 - Third Quartile): 766665.433595
* 90th Percentile: 906144.957
* 95th Percentile: 944473.989825
* 99th Percentile: 984822.472095
* Interquartile Range (IQR = Q3 - Q1): 411481.146351
* Median Absolute Deviation (MAD): 222975.200569

**Distribution Shape & Normality Assessment:**
* Skewness: -0.0167 (Approximately symmetric)
* Kurtosis (Excess): -1.2027 (Platykurtic (light tails))
* Histogram Analysis: Distribution spans 10 bins
* Normality Tests:
    * Shapiro-Wilk Test: W-statistic = 18.497571, p-value = 0.5 (Data consistent with normal distribution (p > 0.05))
    * Jarque-Bera Test: JB-statistic = 6.074384, p-value = 0.05 (Data significantly deviates from normal distribution (p ≤ 0.05))
    * Kolmogorov-Smirnov Test: D-statistic = 0.096136, p-value = 0.2 (Data consistent with normal distribution (p > 0.05))

**Univariate Outlier Analysis:**
* Method 1: IQR Proximity Rule
    * Lower Fence (Q1 - 1.5 * IQR): -262037.432282
    * Upper Fence (Q3 + 1.5 * IQR): 1383887.153121
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
* Potential for Log Transformation: Good candidate for log transformation due to wide range

---
**Column: `Column_2`**
* **Detected Data Type:** categorical
* **Inferred Semantic Type:** category
* **Data Quality Flag:** Good
* **Quick Stats:**
    * Total Values (Count): 1,001
    * Missing Values: 0 (0%)
    * Unique Values: 11 (1.1% of total)

**3.2.B. Categorical Column Analysis:**

**Frequency & Proportionality:**
* Number of Unique Categories: 11
* Mode (Most Frequent Category): `Urban Tacos` (Frequency: 117, 11.69%)
* Second Most Frequent Category: `Grande Tacos` (Frequency: 106, 10.59%)
* Least Frequent Category: `Restaurant Name` (Frequency: 1, 0.1%)
* Frequency Distribution Table (Top 10):

| Category Label | Count | Percentage (%) | Cumulative % |
|----------------|-------|----------------|--------------|
| Urban Tacos | 117 | 11.69% | 11.69% |
| Grande Tacos | 106 | 10.59% | 22.28% |
| The Taco Stand | 105 | 10.49% | 32.77% |
| Casa del Taco | 104 | 10.39% | 43.16% |
| Spicy Taco House | 100 | 9.99% | 53.15% |
| Taco Fiesta | 99 | 9.89% | 63.04% |
| La Vida Taco | 98 | 9.79% | 72.83% |
| Taco Haven | 95 | 9.49% | 82.32% |
| Taco Time Express | 91 | 9.09% | 91.41% |
| El Taco Loco | 85 | 8.49% | 99.9% |

**Diversity & Balance:**
* Shannon Entropy: 3.325 (Range: 0 to 3.4594)
* Gini Impurity: 0.8995
* Interpretation of Balance: Highly balanced distribution
* Major Category Dominance: Well distributed

**Category Label Analysis:**
* Minimum Label Length: 10 characters
* Maximum Label Length: 17 characters
* Average Label Length: 12.8 characters
* Empty String or Null-like Labels: 0 occurrences

**Potential Issues & Recommendations:**


* No significant issues detected.

---
**Column: `Column_3`**
* **Detected Data Type:** categorical
* **Inferred Semantic Type:** category
* **Data Quality Flag:** Good
* **Quick Stats:**
    * Total Values (Count): 1,001
    * Missing Values: 0 (0%)
    * Unique Values: 11 (1.1% of total)

**3.2.B. Categorical Column Analysis:**

**Frequency & Proportionality:**
* Number of Unique Categories: 11
* Mode (Most Frequent Category): `Chicago` (Frequency: 116, 11.59%)
* Second Most Frequent Category: `San Antonio` (Frequency: 113, 11.29%)
* Least Frequent Category: `Location` (Frequency: 1, 0.1%)
* Frequency Distribution Table (Top 10):

| Category Label | Count | Percentage (%) | Cumulative % |
|----------------|-------|----------------|--------------|
| Chicago | 116 | 11.59% | 11.59% |
| San Antonio | 113 | 11.29% | 22.88% |
| Los Angeles | 101 | 10.09% | 32.97% |
| Houston | 101 | 10.09% | 43.06% |
| San Diego | 101 | 10.09% | 53.15% |
| Phoenix | 99 | 9.89% | 63.04% |
| San Jose | 98 | 9.79% | 72.83% |
| New York | 96 | 9.59% | 82.42% |
| Austin | 95 | 9.49% | 91.91% |
| Dallas | 80 | 7.99% | 99.9% |

**Diversity & Balance:**
* Shannon Entropy: 3.3236 (Range: 0 to 3.4594)
* Gini Impurity: 0.8993
* Interpretation of Balance: Highly balanced distribution
* Major Category Dominance: Well distributed

**Category Label Analysis:**
* Minimum Label Length: 6 characters
* Maximum Label Length: 11 characters
* Average Label Length: 8.1 characters
* Empty String or Null-like Labels: 0 occurrences

**Potential Issues & Recommendations:**


* No significant issues detected.

---
**Column: `Column_4`**
* **Detected Data Type:** text_general
* **Inferred Semantic Type:** category
* **Data Quality Flag:** Good
* **Quick Stats:**
    * Total Values (Count): 1,001
    * Missing Values: 0 (0%)
    * Unique Values: 1,001 (100% of total)

**3.2.E. Text Column Analysis:**

**Length-Based Statistics (Characters):**
* Minimum Length: 10
* Maximum Length: 16
* Average Length: 15.94
* Median Length: 16
* Standard Deviation of Length: 0.6

**Word Count Statistics:**
* Minimum Word Count: 2
* Maximum Word Count: 2
* Average Word Count: 2

**Common Patterns:**
* Percentage of Empty Strings: 0%
* Percentage of Purely Numeric Text: 0%
* URLs Found: 0 (0%)
* Email Addresses Found: 0 (0%)

**Top 5 Most Frequent Words:** [2024, 2025, order, time]

---
**Column: `Column_5`**
* **Detected Data Type:** text_general
* **Inferred Semantic Type:** category
* **Data Quality Flag:** Good
* **Quick Stats:**
    * Total Values (Count): 1,001
    * Missing Values: 0 (0%)
    * Unique Values: 1,001 (100% of total)

**3.2.E. Text Column Analysis:**

**Length-Based Statistics (Characters):**
* Minimum Length: 13
* Maximum Length: 16
* Average Length: 15.97
* Median Length: 16
* Standard Deviation of Length: 0.3

**Word Count Statistics:**
* Minimum Word Count: 2
* Maximum Word Count: 2
* Average Word Count: 2

**Common Patterns:**
* Percentage of Empty Strings: 0%
* Percentage of Purely Numeric Text: 0%
* URLs Found: 0 (0%)
* Email Addresses Found: 0 (0%)

**Top 5 Most Frequent Words:** [2024, 2025, delivery, time]

---
**Column: `Column_6`**
* **Detected Data Type:** numerical_integer
* **Inferred Semantic Type:** unknown
* **Data Quality Flag:** Good
* **Quick Stats:**
    * Total Values (Count): 1,001
    * Missing Values: 1 (0.1%)
    * Unique Values: 81 (8.1% of total)

**3.2.A. Numerical Column Analysis:**

**Descriptive Statistics:**
* Minimum: 10
* Maximum: 90
* Range: 80
* Sum: 50930
* Mean (Arithmetic): 50.93
* Median (50th Percentile): 52.744652
* Mode(s): [87 (Frequency: 2.2%)]
* Standard Deviation: 23.215923
* Variance: 538.9791
* Coefficient of Variation (CV): 0.4558%

**Quantile & Percentile Statistics:**
* 1st Percentile: 10.957693
* 5th Percentile: 13.266449
* 10th Percentile: 17.931841
* 25th Percentile (Q1 - First Quartile): 30.103337
* 75th Percentile (Q3 - Third Quartile): 70.726773
* 90th Percentile: 82.934192
* 95th Percentile: 85.425568
* 99th Percentile: 89.00236
* Interquartile Range (IQR = Q3 - Q1): 40.623436
* Median Absolute Deviation (MAD): 21.744652

**Distribution Shape & Normality Assessment:**
* Skewness: -0.1062 (Approximately symmetric)
* Kurtosis (Excess): -1.2123 (Platykurtic (light tails))
* Histogram Analysis: Distribution spans 10 bins
* Normality Tests:
    * Shapiro-Wilk Test: W-statistic = 18.32532, p-value = 0.5 (Data consistent with normal distribution (p > 0.05))
    * Jarque-Bera Test: JB-statistic = 6.207658, p-value = 0.05 (Data significantly deviates from normal distribution (p ≤ 0.05))
    * Kolmogorov-Smirnov Test: D-statistic = 0.082943, p-value = 0.2 (Data consistent with normal distribution (p > 0.05))

**Univariate Outlier Analysis:**
* Method 1: IQR Proximity Rule
    * Lower Fence (Q1 - 1.5 * IQR): -30.831817
    * Upper Fence (Q3 + 1.5 * IQR): 131.661926
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
**Column: `Column_7`**
* **Detected Data Type:** categorical
* **Inferred Semantic Type:** category
* **Data Quality Flag:** Good
* **Quick Stats:**
    * Total Values (Count): 1,001
    * Missing Values: 0 (0%)
    * Unique Values: 3 (0.3% of total)

**3.2.B. Categorical Column Analysis:**

**Frequency & Proportionality:**
* Number of Unique Categories: 3
* Mode (Most Frequent Category): `Regular` (Frequency: 502, 50.15%)
* Second Most Frequent Category: `Large` (Frequency: 498, 49.75%)
* Least Frequent Category: `Taco Size` (Frequency: 1, 0.1%)
* Frequency Distribution Table (Top 10):

| Category Label | Count | Percentage (%) | Cumulative % |
|----------------|-------|----------------|--------------|
| Regular | 502 | 50.15% | 50.15% |
| Large | 498 | 49.75% | 99.9% |
| Taco Size | 1 | 0.1% | 100% |

**Diversity & Balance:**
* Shannon Entropy: 1.0104 (Range: 0 to 1.585)
* Gini Impurity: 0.501
* Interpretation of Balance: Unbalanced distribution
* Major Category Dominance: Moderate concentration

**Category Label Analysis:**
* Minimum Label Length: 5 characters
* Maximum Label Length: 9 characters
* Average Label Length: 6 characters
* Empty String or Null-like Labels: 0 occurrences

**Potential Issues & Recommendations:**


* No significant issues detected.

---
**Column: `Column_8`**
* **Detected Data Type:** categorical
* **Inferred Semantic Type:** category
* **Data Quality Flag:** Good
* **Quick Stats:**
    * Total Values (Count): 1,001
    * Missing Values: 0 (0%)
    * Unique Values: 6 (0.6% of total)

**3.2.B. Categorical Column Analysis:**

**Frequency & Proportionality:**
* Number of Unique Categories: 6
* Mode (Most Frequent Category): `Chicken Taco` (Frequency: 218, 21.78%)
* Second Most Frequent Category: `Fish Taco` (Frequency: 211, 21.08%)
* Least Frequent Category: `Taco Type` (Frequency: 1, 0.1%)
* Frequency Distribution Table (Top 10):

| Category Label | Count | Percentage (%) | Cumulative % |
|----------------|-------|----------------|--------------|
| Chicken Taco | 218 | 21.78% | 21.78% |
| Fish Taco | 211 | 21.08% | 42.86% |
| Veggie Taco | 197 | 19.68% | 62.54% |
| Pork Taco | 192 | 19.18% | 81.72% |
| Beef Taco | 182 | 18.18% | 99.9% |
| Taco Type | 1 | 0.1% | 100% |

**Diversity & Balance:**
* Shannon Entropy: 2.328 (Range: 0 to 2.585)
* Gini Impurity: 0.7996
* Interpretation of Balance: Highly balanced distribution
* Major Category Dominance: Well distributed

**Category Label Analysis:**
* Minimum Label Length: 9 characters
* Maximum Label Length: 12 characters
* Average Label Length: 10 characters
* Empty String or Null-like Labels: 0 occurrences

**Potential Issues & Recommendations:**


* No significant issues detected.

---
**Column: `Column_9`**
* **Detected Data Type:** date_time
* **Inferred Semantic Type:** unknown
* **Data Quality Flag:** Good
* **Quick Stats:**
    * Total Values (Count): 1,001
    * Missing Values: 1 (0.1%)
    * Unique Values: 50 (5% of total)

**3.2.C. Date/Time Column Analysis:**

**Range & Span:**
* Minimum Date/Time: 1999-12-31T13:00:00.000Z
* Maximum Date/Time: 2001-04-30T14:00:00.000Z
* Overall Time Span: 1 years, 4 months, 6 days

**Granularity & Precision:**
* Detected Granularity: Day
* Implicit Precision: Day level precision detected

**Component Analysis & Common Values:**
* Most Common Year(s): [2001, 2000]
* Most Common Month(s): [January, March, May]
* Most Common Day of Week: [Thursday, Tuesday, Saturday]
* Most Common Hour of Day: [0:00]

**Temporal Patterns (Univariate):**
* Pattern Analysis: Weekly to monthly patterns detected
* Gap Analysis: Largest gap between consecutive records: 366 days

**Validity Notes:**
* No obvious validity issues detected

---
**Column: `Column_10`**
* **Detected Data Type:** numerical_float
* **Inferred Semantic Type:** unknown
* **Data Quality Flag:** Good
* **Quick Stats:**
    * Total Values (Count): 1,001
    * Missing Values: 1 (0.1%)
    * Unique Values: 93 (9.3% of total)

**3.2.A. Numerical Column Analysis:**

**Descriptive Statistics:**
* Minimum: 0.51
* Maximum: 24.98
* Range: 24.47
* Sum: 13073.42
* Mean (Arithmetic): 13.07342
* Median (50th Percentile): 12.579622
* Mode(s): [8.25 (Frequency: 0.3%), 24.82 (Frequency: 0.3%)]
* Standard Deviation: 7.138696
* Variance: 50.960975
* Coefficient of Variation (CV): 0.546%

**Quantile & Percentile Statistics:**
* 1st Percentile: 0.733825
* 5th Percentile: 1.716987
* 10th Percentile: 2.914244
* 25th Percentile (Q1 - First Quartile): 6.775774
* 75th Percentile (Q3 - Third Quartile): 19.181984
* 90th Percentile: 23.102808
* 95th Percentile: 24.024164
* 99th Percentile: 24.759862
* Interquartile Range (IQR = Q3 - Q1): 12.406209
* Median Absolute Deviation (MAD): 6.460378

**Distribution Shape & Normality Assessment:**
* Skewness: -0.0572 (Approximately symmetric)
* Kurtosis (Excess): -1.1692 (Platykurtic (light tails))
* Histogram Analysis: Distribution spans 10 bins
* Normality Tests:
    * Shapiro-Wilk Test: W-statistic = 18.766675, p-value = 0.5 (Data consistent with normal distribution (p > 0.05))
    * Jarque-Bera Test: JB-statistic = 6.003563, p-value = 0.05 (Data significantly deviates from normal distribution (p ≤ 0.05))
    * Kolmogorov-Smirnov Test: D-statistic = 0.109205, p-value = 0.2 (Data consistent with normal distribution (p > 0.05))

**Univariate Outlier Analysis:**
* Method 1: IQR Proximity Rule
    * Lower Fence (Q1 - 1.5 * IQR): -11.83354
    * Upper Fence (Q3 + 1.5 * IQR): 37.791298
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
**Column: `Column_11`**
* **Detected Data Type:** numerical_float
* **Inferred Semantic Type:** unknown
* **Data Quality Flag:** Good
* **Quick Stats:**
    * Total Values (Count): 1,001
    * Missing Values: 1 (0.1%)
    * Unique Values: 12 (1.2% of total)

**3.2.A. Numerical Column Analysis:**

**Descriptive Statistics:**
* Minimum: 3
* Maximum: 10.75
* Range: 7.75
* Sum: 6908.25
* Mean (Arithmetic): 6.90825
* Median (50th Percentile): 6.758392
* Mode(s): [10.75 (Frequency: 9.6%)]
* Standard Deviation: 2.308981
* Variance: 5.331394
* Coefficient of Variation (CV): 0.3342%

**Quantile & Percentile Statistics:**
* 1st Percentile: 3
* 5th Percentile: 3.221489
* 10th Percentile: 4.249492
* 25th Percentile (Q1 - First Quartile): 4.54431
* 75th Percentile (Q3 - Third Quartile): 9.249352
* 90th Percentile: 9.698986
* 95th Percentile: 10.749901
* 99th Percentile: 10.75
* Interquartile Range (IQR = Q3 - Q1): 4.705043
* Median Absolute Deviation (MAD): 2.258392

**Distribution Shape & Normality Assessment:**
* Skewness: 0.0128 (Approximately symmetric)
* Kurtosis (Excess): -1.0716 (Platykurtic (light tails))
* Histogram Analysis: Distribution spans 10 bins
* Normality Tests:
    * Shapiro-Wilk Test: W-statistic = 18.298213, p-value = 0.5 (Data consistent with normal distribution (p > 0.05))
    * Jarque-Bera Test: JB-statistic = 6.213606, p-value = 0.05 (Data significantly deviates from normal distribution (p ≤ 0.05))
    * Kolmogorov-Smirnov Test: D-statistic = 0.138752, p-value = 0.05 (Data significantly deviates from normal distribution (p ≤ 0.05))

**Univariate Outlier Analysis:**
* Method 1: IQR Proximity Rule
    * Lower Fence (Q1 - 1.5 * IQR): -2.513255
    * Upper Fence (Q3 + 1.5 * IQR): 16.306917
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
**Column: `Column_12`**
* **Detected Data Type:** numerical_float
* **Inferred Semantic Type:** unknown
* **Data Quality Flag:** Good
* **Quick Stats:**
    * Total Values (Count): 1,001
    * Missing Values: 1 (0.1%)
    * Unique Values: 90 (9% of total)

**3.2.A. Numerical Column Analysis:**

**Descriptive Statistics:**
* Minimum: 0.01
* Maximum: 4.98
* Range: 4.970000000000001
* Sum: 1806.11
* Mean (Arithmetic): 1.80611
* Median (50th Percentile): 1.713411
* Mode(s): [1.71 (Frequency: 0.8%), 2.27 (Frequency: 0.8%)]
* Standard Deviation: 1.131469
* Variance: 1.280221
* Coefficient of Variation (CV): 0.6265%

**Quantile & Percentile Statistics:**
* 1st Percentile: 0.0581
* 5th Percentile: 0.219528
* 10th Percentile: 0.403138
* 25th Percentile (Q1 - First Quartile): 1.02931
* 75th Percentile (Q3 - Third Quartile): 2.521283
* 90th Percentile: 3.236467
* 95th Percentile: 4.017983
* 99th Percentile: 4.812971
* Interquartile Range (IQR = Q3 - Q1): 1.491973
* Median Absolute Deviation (MAD): 0.826589

**Distribution Shape & Normality Assessment:**
* Skewness: 0.6034 (Right-skewed (positive skew))
* Kurtosis (Excess): -0.0237 (Mesokurtic (normal-like tails))
* Histogram Analysis: Distribution spans 10 bins
* Normality Tests:
    * Shapiro-Wilk Test: W-statistic = 16.922366, p-value = 0.5 (Data consistent with normal distribution (p > 0.05))
    * Jarque-Bera Test: JB-statistic = 5.162829, p-value = 0.2 (Data consistent with normal distribution (p > 0.05))
    * Kolmogorov-Smirnov Test: D-statistic = 0.08598, p-value = 0.2 (Data consistent with normal distribution (p > 0.05))

**Univariate Outlier Analysis:**
* Method 1: IQR Proximity Rule
    * Lower Fence (Q1 - 1.5 * IQR): -1.208649
    * Upper Fence (Q3 + 1.5 * IQR): 4.759242
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
* Summary of Outliers: Total 1 (1%). Min Outlier Value: 4.85, Max Outlier Value: 4.85.
* Potential Impact: Low outlier impact

**Specific Numerical Patterns & Characteristics:**
* Percentage of Zero Values: 0%
* Percentage of Negative Values: 0%
* Round Numbers Analysis: No significant rounding detected
* Potential for Log Transformation: Log transformation may not be beneficial

---
**Column: `Column_13`**
* **Detected Data Type:** boolean
* **Inferred Semantic Type:** status
* **Data Quality Flag:** Good
* **Quick Stats:**
    * Total Values (Count): 1,001
    * Missing Values: 1 (0.1%)
    * Unique Values: 2 (0.2% of total)

**3.2.D. Boolean Column Analysis:**

**Frequency Distribution:**
* Count of True: 275 (27.5%)
* Count of False: 725 (72.5%)
* Interpretation: Balanced distribution

**3.3. Bivariate Analysis (Exploring Relationships Between Pairs of Variables):**

**Numerical vs. Numerical:**
    * **Correlation Matrix Summary (Pearson's r):**
        * Total Pairs Analysed: 4
        * Top 5 Strongest Positive Correlations:
        1. `Column_1` vs `Column_6`: r = 1 (Perfect correlation) - Very Strong positive correlation (Perfect correlation).
        2. `Column_1` vs `Column_10`: r = 1 (Perfect correlation) - Very Strong positive correlation (Perfect correlation).
        3. `Column_1` vs `Column_11`: r = 1 (Perfect correlation) - Very Strong positive correlation (Perfect correlation).
        4. `Column_1` vs `Column_12`: r = 1 (Perfect correlation) - Very Strong positive correlation (Perfect correlation).
        * Top 5 Strongest Negative Correlations:
        No strong negative correlations found.
        * Strong Correlations (|r| > 0.5): 4 pairs identified
    * **Scatter Plot Insights (Key Relationships):**
        * `Column_1` vs `Column_6`: "50 point sample shows linear relationship" (Recommended: Scatter plot with trend line)
        * `Column_1` vs `Column_10`: "50 point sample shows linear relationship" (Recommended: Scatter plot with trend line)
        * `Column_1` vs `Column_11`: "50 point sample shows linear relationship" (Recommended: Scatter plot with trend line)

**Numerical vs. Categorical:**
    * **Comparative Statistics (Mean/Median by Category):**
    * **`Column_2` by `Column_1`:**
        | Category | Mean | Median | StdDev | Count |
        |----------|------|--------|--------|-------|
        | 770487 | 0 | 0 | 0 | 1 |
        | 671858 | 0 | 0 | 0 | 1 |
        | 688508 | 0 | 0 | 0 | 1 |
        | 944962 | 0 | 0 | 0 | 1 |
        | 476417 | 0 | 0 | 0 | 1 |
        * **Statistical Tests:** ANOVA F-statistic = 1.5, p-value = 0.2 (No significant difference between groups)
        * **Summary:** 770487 has highest mean (0.00), 326183 has lowest (0.00)

    * **`Column_3` by `Column_1`:**
        | Category | Mean | Median | StdDev | Count |
        |----------|------|--------|--------|-------|
        | 770487 | 0 | 0 | 0 | 1 |
        | 671858 | 0 | 0 | 0 | 1 |
        | 688508 | 0 | 0 | 0 | 1 |
        | 944962 | 0 | 0 | 0 | 1 |
        | 476417 | 0 | 0 | 0 | 1 |
        * **Statistical Tests:** ANOVA F-statistic = 1.5, p-value = 0.2 (No significant difference between groups)
        * **Summary:** 770487 has highest mean (0.00), 326183 has lowest (0.00)

    * **`Column_7` by `Column_1`:**
        | Category | Mean | Median | StdDev | Count |
        |----------|------|--------|--------|-------|
        | 770487 | 0 | 0 | 0 | 1 |
        | 671858 | 0 | 0 | 0 | 1 |
        | 688508 | 0 | 0 | 0 | 1 |
        | 944962 | 0 | 0 | 0 | 1 |
        | 476417 | 0 | 0 | 0 | 1 |
        * **Statistical Tests:** ANOVA F-statistic = 1.5, p-value = 0.2 (No significant difference between groups)
        * **Summary:** 770487 has highest mean (0.00), 326183 has lowest (0.00)

**Categorical vs. Categorical:**
    * **Contingency Table Analysis:**
    * **`Column_2` vs `Column_3`:**
        * **Contingency Table (Top 3x3):**
        |             | 121369 |
        |-------------|-------------|
        | 121369 | 1 |
        | 130271 | 0 |
        | 139019 | 0 |
        * **Association Tests:**
            * Chi-Squared: χ² = 0, df = 0, p-value = 1 (Insufficient data for chi-squared test)
            * Cramer's V: 0 (Cannot calculate association strength)
        * **Insights:** Most common combination: 121369 & 121369 (1 occurrences). Association strength: weak.

    * **`Column_2` vs `Column_7`:**
        * **Contingency Table (Top 3x3):**
        |             | 121369 |
        |-------------|-------------|
        | 121369 | 1 |
        | 130271 | 0 |
        | 139019 | 0 |
        * **Association Tests:**
            * Chi-Squared: χ² = 0, df = 0, p-value = 1 (Insufficient data for chi-squared test)
            * Cramer's V: 0 (Cannot calculate association strength)
        * **Insights:** Most common combination: 121369 & 121369 (1 occurrences). Association strength: weak.

**3.4. Multivariate Analysis (Preliminary Insights into Complex Interactions):**
    * **Principal Component Analysis:** Not applicable - insufficient numerical variables.

    * **Cluster Analysis:** Not performed - data characteristics not suitable for clustering.

    * **Feature Interactions:** No significant interactions detected.

**3.5. Specific Analysis Modules (Activated Based on Data Characteristics):**

    * **3.5.A. Time Series Analysis Deep Dive:**
        * **Detected DateTime Columns:** 1 columns identified
        * **Primary Temporal Column:** `Column_9`
        * **Analysis Note:** Advanced time series decomposition, trend analysis, and seasonality detection would be performed here for time-ordered data with sufficient temporal granularity.
        * **Recommendation:** Consider sorting data by primary temporal column for time series analysis if records represent sequential events.

    * **3.5.B. Text Analytics Deep Dive:**
        * **Detected Text Columns:** 2 columns identified
        * **Primary Text Column:** `Column_4`
        * **Advanced Analysis Available:** N-gram analysis, topic modelling, named entity recognition, sentiment analysis
        * **Sample Keywords:** [2024, 2025, order, time]
        * **Recommendation:** Apply NLP preprocessing pipeline for deeper text insights if required for analysis goals.

**3.6. EDA Summary & Key Hypotheses/Insights:**
    * **Top Statistical Findings:**
    1. Streaming analysis processed 1,001 rows using only 11MB peak memory
    * **Data Quality Issues Uncovered:**
    * No major data quality issues identified during EDA.
    * **Hypotheses Generated for Further Testing:**
    * No specific hypotheses generated - consider domain knowledge for hypothesis formation.
    * **Recommendations for Data Preprocessing & Feature Engineering:**
    * Consider encoding or grouping high-cardinality columns: Column_4, Column_5
    * **Critical Warnings & Considerations:**




---

**Analysis Performance Summary:**
* **Processing Time:** 58ms (0.06 seconds)
* **Rows Analysed:** 1,001
* **Memory Efficiency:** Constant ~11MB usage
* **Analysis Method:** Streaming with online algorithms
* **Dataset Size:** 1,001 records across 13 columns