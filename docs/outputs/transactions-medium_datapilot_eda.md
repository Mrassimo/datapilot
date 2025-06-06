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
**Column: `transaction_id`**
* **Detected Data Type:** text_general
* **Inferred Semantic Type:** category
* **Data Quality Flag:** Good
* **Quick Stats:**
    * Total Values (Count): 100,001
    * Missing Values: 0 (0%)
    * Unique Values: 100,001 (100% of total)

**3.2.E. Text Column Analysis:**

**Length-Based Statistics (Characters):**
* Minimum Length: 11
* Maximum Length: 14
* Average Length: 11.03
* Median Length: 11
* Standard Deviation of Length: 0.3

**Word Count Statistics:**
* Minimum Word Count: 1
* Maximum Word Count: 1
* Average Word Count: 1

**Common Patterns:**
* Percentage of Empty Strings: 0%
* Percentage of Purely Numeric Text: 0%
* URLs Found: 0 (0%)
* Email Addresses Found: 0 (0%)

**Top 5 Most Frequent Words:** [transaction_id, txn00000001, txn00000002, txn00000003, txn00000004]

---
**Column: `timestamp`**
* **Detected Data Type:** date_time
* **Inferred Semantic Type:** unknown
* **Data Quality Flag:** Good
* **Quick Stats:**
    * Total Values (Count): 100,001
    * Missing Values: 1 (0%)
    * Unique Values: 50 (0.05% of total)

**3.2.C. Date/Time Column Analysis:**

**Range & Span:**
* Minimum Date/Time: 2020-01-31T23:22:00.000Z
* Maximum Date/Time: 2022-11-16T18:41:00.000Z
* Overall Time Span: 2 years, 9 months, 29 days

**Granularity & Precision:**
* Detected Granularity: Minute
* Implicit Precision: Minute level precision detected

**Component Analysis & Common Values:**
* Most Common Year(s): [2020, 2021, 2022]
* Most Common Month(s): [May, January, March]
* Most Common Day of Week: [Sunday, Tuesday, Saturday]
* Most Common Hour of Day: [4:00, 23:00, 12:00]

**Temporal Patterns (Univariate):**
* Pattern Analysis: Weekly to monthly patterns detected
* Gap Analysis: Largest gap between consecutive records: 63 days

**Validity Notes:**
* No obvious validity issues detected

---
**Column: `customer_id`**
* **Detected Data Type:** text_general
* **Inferred Semantic Type:** category
* **Data Quality Flag:** Good
* **Quick Stats:**
    * Total Values (Count): 100,001
    * Missing Values: 0 (0%)
    * Unique Values: 100,001 (100% of total)

**3.2.E. Text Column Analysis:**

**Length-Based Statistics (Characters):**
* Minimum Length: 10
* Maximum Length: 11
* Average Length: 10.01
* Median Length: 10
* Standard Deviation of Length: 0.1

**Word Count Statistics:**
* Minimum Word Count: 1
* Maximum Word Count: 1
* Average Word Count: 1

**Common Patterns:**
* Percentage of Empty Strings: 0%
* Percentage of Purely Numeric Text: 0%
* URLs Found: 0 (0%)
* Email Addresses Found: 0 (0%)

**Top 5 Most Frequent Words:** [cust031304, cust000750, cust020478, cust037341, cust036452]

---
**Column: `product_id`**
* **Detected Data Type:** text_general
* **Inferred Semantic Type:** category
* **Data Quality Flag:** Good
* **Quick Stats:**
    * Total Values (Count): 100,001
    * Missing Values: 0 (0%)
    * Unique Values: 100,001 (100% of total)

**3.2.E. Text Column Analysis:**

**Length-Based Statistics (Characters):**
* Minimum Length: 9
* Maximum Length: 10
* Average Length: 9.01
* Median Length: 9
* Standard Deviation of Length: 0.1

**Word Count Statistics:**
* Minimum Word Count: 1
* Maximum Word Count: 1
* Average Word Count: 1

**Common Patterns:**
* Percentage of Empty Strings: 0%
* Percentage of Purely Numeric Text: 0%
* URLs Found: 0 (0%)
* Email Addresses Found: 0 (0%)

**Top 5 Most Frequent Words:** [prod04491, prod00641, prod03611, prod00703, prod04929]

---
**Column: `category`**
* **Detected Data Type:** categorical
* **Inferred Semantic Type:** category
* **Data Quality Flag:** Good
* **Quick Stats:**
    * Total Values (Count): 100,001
    * Missing Values: 0 (0%)
    * Unique Values: 9 (0.01% of total)

**3.2.B. Categorical Column Analysis:**

**Frequency & Proportionality:**
* Number of Unique Categories: 9
* Mode (Most Frequent Category): `Electronics` (Frequency: 12636, 12.64%)
* Second Most Frequent Category: `Food` (Frequency: 12618, 12.62%)
* Least Frequent Category: `category` (Frequency: 1, 0%)
* Frequency Distribution Table (Top 10):

| Category Label | Count | Percentage (%) | Cumulative % |
|----------------|-------|----------------|--------------|
| Electronics | 12636 | 12.64% | 12.64% |
| Food | 12618 | 12.62% | 25.26% |
| Home | 12594 | 12.59% | 37.85% |
| Toys | 12563 | 12.56% | 50.41% |
| Books | 12496 | 12.5% | 62.91% |
| Clothing | 12384 | 12.38% | 75.29% |
| Beauty | 12364 | 12.36% | 87.65% |
| Sports | 12345 | 12.34% | 99.99% |
| category | 1 | 0% | 99.99% |

**Diversity & Balance:**
* Shannon Entropy: 3.0001 (Range: 0 to 3.1699)
* Gini Impurity: 0.875
* Interpretation of Balance: Highly balanced distribution
* Major Category Dominance: Well distributed

**Category Label Analysis:**
* Minimum Label Length: 4 characters
* Maximum Label Length: 11 characters
* Average Label Length: 6 characters
* Empty String or Null-like Labels: 0 occurrences

**Potential Issues & Recommendations:**


* No significant issues detected.

---
**Column: `quantity`**
* **Detected Data Type:** numerical_integer
* **Inferred Semantic Type:** count
* **Data Quality Flag:** Good
* **Quick Stats:**
    * Total Values (Count): 100,001
    * Missing Values: 1 (0%)
    * Unique Values: 10 (0.01% of total)

**3.2.A. Numerical Column Analysis:**

**Descriptive Statistics:**
* Minimum: 1
* Maximum: 10
* Range: 9
* Sum: 548999
* Mean (Arithmetic): 5.48999
* Median (50th Percentile): 5.997115
* Mode(s): [1 (Frequency: 10.17%)]
* Standard Deviation: 2.873078
* Variance: 8.25458
* Coefficient of Variation (CV): 0.5233%

**Quantile & Percentile Statistics:**
* 1st Percentile: 1
* 5th Percentile: 1
* 10th Percentile: 1.900291
* 25th Percentile (Q1 - First Quartile): 3
* 75th Percentile (Q3 - Third Quartile): 8
* 90th Percentile: 9.77576
* 95th Percentile: 10
* 99th Percentile: 10
* Interquartile Range (IQR = Q3 - Q1): 5
* Median Absolute Deviation (MAD): 1.997115

**Distribution Shape & Normality Assessment:**
* Skewness: 0.0012 (Approximately symmetric)
* Kurtosis (Excess): -1.2223 (Platykurtic (light tails))
* Histogram Analysis: Distribution spans 10 bins
* Normality Tests:
    * Shapiro-Wilk Test: W-statistic = 17.118458, p-value = 0.5 (Data consistent with normal distribution (p > 0.05))
    * Jarque-Bera Test: JB-statistic = 3.777074, p-value = 0.2 (Data consistent with normal distribution (p > 0.05))
    * Kolmogorov-Smirnov Test: D-statistic = 0.108739, p-value = 0.2 (Data consistent with normal distribution (p > 0.05))

**Univariate Outlier Analysis:**
* Method 1: IQR Proximity Rule
    * Lower Fence (Q1 - 1.5 * IQR): -4.5
    * Upper Fence (Q3 + 1.5 * IQR): 15.5
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
**Column: `unit_price`**
* **Detected Data Type:** numerical_float
* **Inferred Semantic Type:** unknown
* **Data Quality Flag:** Good
* **Quick Stats:**
    * Total Values (Count): 100,001
    * Missing Values: 1 (0%)
    * Unique Values: 80 (0.08% of total)

**3.2.A. Numerical Column Analysis:**

**Descriptive Statistics:**
* Minimum: 6.03
* Maximum: 999.98
* Range: 993.95
* Sum: 50136724.42
* Mean (Arithmetic): 501.367244
* Median (50th Percentile): 497.257322
* Mode(s): [545 (Frequency: 0.01%)]
* Standard Deviation: 287.253582
* Variance: 82514.620366
* Coefficient of Variation (CV): 0.5729%

**Quantile & Percentile Statistics:**
* 1st Percentile: 15.54021
* 5th Percentile: 53.010618
* 10th Percentile: 100.447201
* 25th Percentile (Q1 - First Quartile): 253.01211
* 75th Percentile (Q3 - Third Quartile): 746.405986
* 90th Percentile: 903.084967
* 95th Percentile: 948.044777
* 99th Percentile: 989.508262
* Interquartile Range (IQR = Q3 - Q1): 493.393875
* Median Absolute Deviation (MAD): 294.397322

**Distribution Shape & Normality Assessment:**
* Skewness: 0.0074 (Approximately symmetric)
* Kurtosis (Excess): -1.2007 (Platykurtic (light tails))
* Histogram Analysis: Distribution spans 10 bins
* Normality Tests:
    * Shapiro-Wilk Test: W-statistic = 19.322982, p-value = 0.5 (Data consistent with normal distribution (p > 0.05))
    * Jarque-Bera Test: JB-statistic = 8.968038, p-value = 0.05 (Data significantly deviates from normal distribution (p ≤ 0.05))
    * Kolmogorov-Smirnov Test: D-statistic = 0.109082, p-value = 0.2 (Data consistent with normal distribution (p > 0.05))

**Univariate Outlier Analysis:**
* Method 1: IQR Proximity Rule
    * Lower Fence (Q1 - 1.5 * IQR): -487.078703
    * Upper Fence (Q3 + 1.5 * IQR): 1486.496799
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
**Column: `total_amount`**
* **Detected Data Type:** numerical_float
* **Inferred Semantic Type:** unknown
* **Data Quality Flag:** Good
* **Quick Stats:**
    * Total Values (Count): 100,001
    * Missing Values: 1 (0%)
    * Unique Values: 84 (0.08% of total)

**3.2.A. Numerical Column Analysis:**

**Descriptive Statistics:**
* Minimum: 4.52
* Maximum: 9999.8
* Range: 9995.279999999999
* Sum: 247097751.599999
* Mean (Arithmetic): 2470.977516
* Median (50th Percentile): 1891.957319
* Mode(s): [545 (Frequency: 0.01%)]
* Standard Deviation: 2086.710165
* Variance: 4354359.311485
* Coefficient of Variation (CV): 0.8445%

**Quantile & Percentile Statistics:**
* 1st Percentile: 48.427572
* 5th Percentile: 171.659178
* 10th Percentile: 316.416087
* 25th Percentile (Q1 - First Quartile): 766.446109
* 75th Percentile (Q3 - Third Quartile): 3723.403099
* 90th Percentile: 5600.764628
* 95th Percentile: 6811.848106
* 99th Percentile: 8488.308354
* Interquartile Range (IQR = Q3 - Q1): 2956.95699
* Median Absolute Deviation (MAD): 1172.757319

**Distribution Shape & Normality Assessment:**
* Skewness: 1.0246 (Right-skewed (positive skew))
* Kurtosis (Excess): 0.3942 (Mesokurtic (normal-like tails))
* Histogram Analysis: Distribution spans 10 bins
* Normality Tests:
    * Shapiro-Wilk Test: W-statistic = 14.778586, p-value = 0.5 (Data consistent with normal distribution (p > 0.05))
    * Jarque-Bera Test: JB-statistic = 18.554946, p-value = 0.001 (Data significantly deviates from normal distribution (p ≤ 0.05))
    * Kolmogorov-Smirnov Test: D-statistic = 0.144612, p-value = 0.05 (Data significantly deviates from normal distribution (p ≤ 0.05))

**Univariate Outlier Analysis:**
* Method 1: IQR Proximity Rule
    * Lower Fence (Q1 - 1.5 * IQR): -3668.989375
    * Upper Fence (Q3 + 1.5 * IQR): 8158.838583
    * Number of Outliers (Below Lower): 0 (0%)
    * Number of Outliers (Above Upper): 1 (1%)
    * Extreme Outliers (using 3.0 * IQR factor): 0 (0%)
* Method 2: Z-Score Method
    * Standard Deviations from Mean for Threshold: +/- 3
    * Number of Outliers (Z-score < -3): 0
    * Number of Outliers (Z-score > +3): 0
* Method 3: Modified Z-Score (using MAD)
    * Threshold: +/- 3.5
    * Number of Outliers: 1
* Summary of Outliers: Total 1 (1%). Min Outlier Value: 8449.4, Max Outlier Value: 8449.4.
* Potential Impact: Low outlier impact

**Specific Numerical Patterns & Characteristics:**
* Percentage of Zero Values: 0%
* Percentage of Negative Values: 0%
* Round Numbers Analysis: No significant rounding detected
* Potential for Log Transformation: Good candidate for log transformation due to wide range

---
**Column: `payment_method`**
* **Detected Data Type:** categorical
* **Inferred Semantic Type:** category
* **Data Quality Flag:** Good
* **Quick Stats:**
    * Total Values (Count): 100,001
    * Missing Values: 0 (0%)
    * Unique Values: 6 (0.01% of total)

**3.2.B. Categorical Column Analysis:**

**Frequency & Proportionality:**
* Number of Unique Categories: 6
* Mode (Most Frequent Category): `Gift Card` (Frequency: 20109, 20.11%)
* Second Most Frequent Category: `Mobile Payment` (Frequency: 20030, 20.03%)
* Least Frequent Category: `payment_method` (Frequency: 1, 0%)
* Frequency Distribution Table (Top 10):

| Category Label | Count | Percentage (%) | Cumulative % |
|----------------|-------|----------------|--------------|
| Gift Card | 20109 | 20.11% | 20.11% |
| Mobile Payment | 20030 | 20.03% | 40.14% |
| Debit Card | 20022 | 20.02% | 60.16% |
| Credit Card | 19955 | 19.95% | 80.11% |
| Cash | 19884 | 19.88% | 99.99% |
| payment_method | 1 | 0% | 99.99% |

**Diversity & Balance:**
* Shannon Entropy: 2.3221 (Range: 0 to 2.585)
* Gini Impurity: 0.8
* Interpretation of Balance: Moderately balanced distribution
* Major Category Dominance: Well distributed

**Category Label Analysis:**
* Minimum Label Length: 4 characters
* Maximum Label Length: 14 characters
* Average Label Length: 9.6 characters
* Empty String or Null-like Labels: 0 occurrences

**Potential Issues & Recommendations:**


* No significant issues detected.

---
**Column: `store_location`**
* **Detected Data Type:** categorical
* **Inferred Semantic Type:** category
* **Data Quality Flag:** Good
* **Quick Stats:**
    * Total Values (Count): 100,001
    * Missing Values: 0 (0%)
    * Unique Values: 7 (0.01% of total)

**3.2.B. Categorical Column Analysis:**

**Frequency & Proportionality:**
* Number of Unique Categories: 7
* Mode (Most Frequent Category): `Chicago` (Frequency: 16832, 16.83%)
* Second Most Frequent Category: `Houston` (Frequency: 16706, 16.71%)
* Least Frequent Category: `store_location` (Frequency: 1, 0%)
* Frequency Distribution Table (Top 10):

| Category Label | Count | Percentage (%) | Cumulative % |
|----------------|-------|----------------|--------------|
| Chicago | 16832 | 16.83% | 16.83% |
| Houston | 16706 | 16.71% | 33.54% |
| Philadelphia | 16703 | 16.7% | 50.24% |
| New York | 16622 | 16.62% | 66.86% |
| Phoenix | 16589 | 16.59% | 83.45% |
| Los Angeles | 16548 | 16.55% | 100% |
| store_location | 1 | 0% | 100% |

**Diversity & Balance:**
* Shannon Entropy: 2.5851 (Range: 0 to 2.8074)
* Gini Impurity: 0.8333
* Interpretation of Balance: Highly balanced distribution
* Major Category Dominance: Well distributed

**Category Label Analysis:**
* Minimum Label Length: 7 characters
* Maximum Label Length: 14 characters
* Average Label Length: 8.7 characters
* Empty String or Null-like Labels: 0 occurrences

**Potential Issues & Recommendations:**


* No significant issues detected.

---
**Column: `discount_applied`**
* **Detected Data Type:** numerical_float
* **Inferred Semantic Type:** count
* **Data Quality Flag:** Good
* **Quick Stats:**
    * Total Values (Count): 100,001
    * Missing Values: 1 (0%)
    * Unique Values: 5 (0.01% of total)

**3.2.A. Numerical Column Analysis:**

**Descriptive Statistics:**
* Minimum: 0
* Maximum: 0.25
* Range: 0.25
* Sum: 10064.15
* Mean (Arithmetic): 0.100642
* Median (50th Percentile): 0.1
* Mode(s): [0 (Frequency: 42.62%)]
* Standard Deviation: 0.096533
* Variance: 0.009319
* Coefficient of Variation (CV): 0.9592%

**Quantile & Percentile Statistics:**
* 1st Percentile: 0
* 5th Percentile: 0
* 10th Percentile: 0
* 25th Percentile (Q1 - First Quartile): 0
* 75th Percentile (Q3 - Third Quartile): 0.2
* 90th Percentile: 0.25
* 95th Percentile: 0.25
* 99th Percentile: 0.25
* Interquartile Range (IQR = Q3 - Q1): 0.2
* Median Absolute Deviation (MAD): 0.1

**Distribution Shape & Normality Assessment:**
* Skewness: 0.2303 (Approximately symmetric)
* Kurtosis (Excess): -1.4932 (Platykurtic (light tails))
* Histogram Analysis: Distribution spans 10 bins
* Normality Tests:
    * Shapiro-Wilk Test: W-statistic = 20.767601, p-value = 0.5 (Data consistent with normal distribution (p > 0.05))
    * Jarque-Bera Test: JB-statistic = 10.784891, p-value = 0.01 (Data significantly deviates from normal distribution (p ≤ 0.05))
    * Kolmogorov-Smirnov Test: D-statistic = 0.31776, p-value = 0.01 (Data significantly deviates from normal distribution (p ≤ 0.05))

**Univariate Outlier Analysis:**
* Method 1: IQR Proximity Rule
    * Lower Fence (Q1 - 1.5 * IQR): -0.3
    * Upper Fence (Q3 + 1.5 * IQR): 0.5
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
* Percentage of Zero Values: 50%
* Percentage of Negative Values: 0%
* Round Numbers Analysis: High proportion of round numbers suggests potential data rounding
* Potential for Log Transformation: Log transformation may not be beneficial

---
**Column: `customer_age`**
* **Detected Data Type:** date_time
* **Inferred Semantic Type:** unknown
* **Data Quality Flag:** Poor
* **Quick Stats:**
    * Total Values (Count): 100,001
    * Missing Values: 22,351 (22.35%)
    * Unique Values: 50 (0.06% of total)

**3.2.C. Date/Time Column Analysis:**

**Range & Span:**
* Minimum Date/Time: 1950-12-31T14:00:00.000Z
* Maximum Date/Time: 2047-12-31T13:00:00.000Z
* Overall Time Span: 97 years, 0 months, 28 days

**Granularity & Precision:**
* Detected Granularity: Day
* Implicit Precision: Day level precision detected

**Component Analysis & Common Values:**
* Most Common Year(s): [2032, 2040, 2039]
* Most Common Month(s): [January]
* Most Common Day of Week: [Sunday, Tuesday, Friday]
* Most Common Hour of Day: [0:00]

**Temporal Patterns (Univariate):**
* Pattern Analysis: Sparse temporal distribution (monthly+ intervals)
* Gap Analysis: Largest gap between consecutive records: 19724 days

**Validity Notes:**
* 16 future dates detected

---
**Column: `customer_segment`**
* **Detected Data Type:** categorical
* **Inferred Semantic Type:** category
* **Data Quality Flag:** Good
* **Quick Stats:**
    * Total Values (Count): 100,001
    * Missing Values: 0 (0%)
    * Unique Values: 5 (0% of total)

**3.2.B. Categorical Column Analysis:**

**Frequency & Proportionality:**
* Number of Unique Categories: 5
* Mode (Most Frequent Category): `Silver` (Frequency: 25104, 25.1%)
* Second Most Frequent Category: `Regular` (Frequency: 25051, 25.05%)
* Least Frequent Category: `customer_segment` (Frequency: 1, 0%)
* Frequency Distribution Table (Top 10):

| Category Label | Count | Percentage (%) | Cumulative % |
|----------------|-------|----------------|--------------|
| Silver | 25104 | 25.1% | 25.1% |
| Regular | 25051 | 25.05% | 50.15% |
| Platinum | 25009 | 25.01% | 75.16% |
| Gold | 24836 | 24.84% | 100% |
| customer_segment | 1 | 0% | 100% |

**Diversity & Balance:**
* Shannon Entropy: 2.0001 (Range: 0 to 2.3219)
* Gini Impurity: 0.75
* Interpretation of Balance: Moderately balanced distribution
* Major Category Dominance: Well distributed

**Category Label Analysis:**
* Minimum Label Length: 4 characters
* Maximum Label Length: 16 characters
* Average Label Length: 6.3 characters
* Empty String or Null-like Labels: 0 occurrences

**Potential Issues & Recommendations:**


* No significant issues detected.

---
**Column: `rating`**
* **Detected Data Type:** date_time
* **Inferred Semantic Type:** unknown
* **Data Quality Flag:** Moderate
* **Quick Stats:**
    * Total Values (Count): 100,001
    * Missing Values: 19,138 (19.14%)
    * Unique Values: 50 (0.06% of total)

**3.2.C. Date/Time Column Analysis:**

**Range & Span:**
* Minimum Date/Time: 2000-12-31T13:00:00.000Z
* Maximum Date/Time: 2001-04-07T14:00:00.000Z
* Overall Time Span: 3 months, 7 days

**Granularity & Precision:**
* Detected Granularity: Day
* Implicit Precision: Day level precision detected

**Component Analysis & Common Values:**
* Most Common Year(s): [2001]
* Most Common Month(s): [January, April, March]
* Most Common Day of Week: [Friday, Monday, Thursday]
* Most Common Hour of Day: [0:00]

**Temporal Patterns (Univariate):**
* Pattern Analysis: Daily to weekly patterns detected
* Gap Analysis: Largest gap between consecutive records: 24 days

**Validity Notes:**
* No obvious validity issues detected

---
**Column: `returned`**
* **Detected Data Type:** boolean
* **Inferred Semantic Type:** status
* **Data Quality Flag:** Good
* **Quick Stats:**
    * Total Values (Count): 100,001
    * Missing Values: 1 (0%)
    * Unique Values: 2 (0% of total)

**3.2.D. Boolean Column Analysis:**

**Frequency Distribution:**
* Count of True: 20135 (20.14%)
* Count of False: 79865 (79.86%)
* Interpretation: Predominantly False

**3.3. Bivariate Analysis (Exploring Relationships Between Pairs of Variables):**

**Numerical vs. Numerical:**
* No numerical variable pairs available for correlation analysis.

**3.4. Multivariate Analysis (Preliminary Insights into Complex Interactions):**
    * **Principal Component Analysis:** Not applicable - insufficient numerical variables.

    * **Cluster Analysis:** Not performed - data characteristics not suitable for clustering.

    * **Feature Interactions:** No significant interactions detected.

**3.5. Specific Analysis Modules (Activated Based on Data Characteristics):**

    * **3.5.A. Time Series Analysis Deep Dive:**
        * **Detected DateTime Columns:** 3 columns identified
        * **Primary Temporal Column:** `timestamp`
        * **Analysis Note:** Advanced time series decomposition, trend analysis, and seasonality detection would be performed here for time-ordered data with sufficient temporal granularity.
        * **Recommendation:** Consider sorting data by primary temporal column for time series analysis if records represent sequential events.

    * **3.5.B. Text Analytics Deep Dive:**
        * **Detected Text Columns:** 3 columns identified
        * **Primary Text Column:** `transaction_id`
        * **Advanced Analysis Available:** N-gram analysis, topic modelling, named entity recognition, sentiment analysis
        * **Sample Keywords:** [transaction_id, txn00000001, txn00000002, txn00000003, txn00000004]
        * **Recommendation:** Apply NLP preprocessing pipeline for deeper text insights if required for analysis goals.

**3.6. EDA Summary & Key Hypotheses/Insights:**
    * **Top Statistical Findings:**
    1. Streaming analysis processed 100,001 rows using only 54MB peak memory
    * **Data Quality Issues Uncovered:**
    * 1 columns have >20% missing values: customer_age
    * **Hypotheses Generated for Further Testing:**
    * No specific hypotheses generated - consider domain knowledge for hypothesis formation.
    * **Recommendations for Data Preprocessing & Feature Engineering:**
    * Consider encoding or grouping high-cardinality columns: transaction_id, customer_id, product_id
    * **Critical Warnings & Considerations:**




---

**Analysis Performance Summary:**
* **Processing Time:** 1381ms (1.38 seconds)
* **Rows Analysed:** 100,001
* **Memory Efficiency:** Constant ~54MB usage
* **Analysis Method:** Streaming with online algorithms
* **Dataset Size:** 100,001 records across 15 columns