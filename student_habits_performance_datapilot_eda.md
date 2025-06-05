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
* **Detected Data Type:** text_general
* **Inferred Semantic Type:** category
* **Data Quality Flag:** Good
* **Quick Stats:**
    * Total Values (Count): 1,001
    * Missing Values: 0 (0%)
    * Unique Values: 1,001 (100% of total)

**3.2.E. Text Column Analysis:**

**Length-Based Statistics (Characters):**
* Minimum Length: 5
* Maximum Length: 10
* Average Length: 5.05
* Median Length: 5
* Standard Deviation of Length: 0.5

**Word Count Statistics:**
* Minimum Word Count: 1
* Maximum Word Count: 1
* Average Word Count: 1

**Common Patterns:**
* Percentage of Empty Strings: 0%
* Percentage of Purely Numeric Text: 0%
* URLs Found: 0 (0%)
* Email Addresses Found: 0 (0%)

**Top 5 Most Frequent Words:** [student_id, s1000, s1001, s1002, s1003]

---
**Column: `Column_2`**
* **Detected Data Type:** numerical_integer
* **Inferred Semantic Type:** unknown
* **Data Quality Flag:** Good
* **Quick Stats:**
    * Total Values (Count): 1,001
    * Missing Values: 1 (0.1%)
    * Unique Values: 8 (0.8% of total)

**3.2.A. Numerical Column Analysis:**

**Descriptive Statistics:**
* Minimum: 17
* Maximum: 24
* Range: 7
* Sum: 20498
* Mean (Arithmetic): 20.498
* Median (50th Percentile): 20.755818
* Mode(s): [20 (Frequency: 14.6%)]
* Standard Deviation: 2.306945
* Variance: 5.321996
* Coefficient of Variation (CV): 0.1125%

**Quantile & Percentile Statistics:**
* 1st Percentile: 17
* 5th Percentile: 17
* 10th Percentile: 17.000054
* 25th Percentile (Q1 - First Quartile): 18.943425
* 75th Percentile (Q3 - Third Quartile): 22.983708
* 90th Percentile: 23.993496
* 95th Percentile: 24
* 99th Percentile: 24
* Interquartile Range (IQR = Q3 - Q1): 4.040283
* Median Absolute Deviation (MAD): 1.755818

**Distribution Shape & Normality Assessment:**
* Skewness: 0.0084 (Approximately symmetric)
* Kurtosis (Excess): -1.2189 (Platykurtic (light tails))
* Histogram Analysis: Distribution spans 10 bins
* Normality Tests:
    * Shapiro-Wilk Test: W-statistic = 18.577715, p-value = 0.5 (Data consistent with normal distribution (p > 0.05))
    * Jarque-Bera Test: JB-statistic = 6.506754, p-value = 0.05 (Data significantly deviates from normal distribution (p ≤ 0.05))
    * Kolmogorov-Smirnov Test: D-statistic = 0.136826, p-value = 0.05 (Data significantly deviates from normal distribution (p ≤ 0.05))

**Univariate Outlier Analysis:**
* Method 1: IQR Proximity Rule
    * Lower Fence (Q1 - 1.5 * IQR): 12.883
    * Upper Fence (Q3 + 1.5 * IQR): 29.044133
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
**Column: `Column_3`**
* **Detected Data Type:** categorical
* **Inferred Semantic Type:** category
* **Data Quality Flag:** Good
* **Quick Stats:**
    * Total Values (Count): 1,001
    * Missing Values: 0 (0%)
    * Unique Values: 4 (0.4% of total)

**3.2.B. Categorical Column Analysis:**

**Frequency & Proportionality:**
* Number of Unique Categories: 4
* Mode (Most Frequent Category): `Female` (Frequency: 481, 48.05%)
* Second Most Frequent Category: `Male` (Frequency: 477, 47.65%)
* Least Frequent Category: `gender` (Frequency: 1, 0.1%)
* Frequency Distribution Table (Top 10):

| Category Label | Count | Percentage (%) | Cumulative % |
|----------------|-------|----------------|--------------|
| Female | 481 | 48.05% | 48.05% |
| Male | 477 | 47.65% | 95.7% |
| Other | 42 | 4.2% | 99.9% |
| gender | 1 | 0.1% | 100% |

**Diversity & Balance:**
* Shannon Entropy: 1.2196 (Range: 0 to 2)
* Gini Impurity: 0.5403
* Interpretation of Balance: Unbalanced distribution
* Major Category Dominance: Moderate concentration

**Category Label Analysis:**
* Minimum Label Length: 4 characters
* Maximum Label Length: 6 characters
* Average Label Length: 5 characters
* Empty String or Null-like Labels: 0 occurrences

**Potential Issues & Recommendations:**


* No significant issues detected.

---
**Column: `Column_4`**
* **Detected Data Type:** date_time
* **Inferred Semantic Type:** unknown
* **Data Quality Flag:** Moderate
* **Quick Stats:**
    * Total Values (Count): 1,001
    * Missing Values: 107 (10.69%)
    * Unique Values: 50 (5.59% of total)

**3.2.C. Date/Time Column Analysis:**

**Range & Span:**
* Minimum Date/Time: 2000-12-31T13:00:00.000Z
* Maximum Date/Time: 2001-07-01T14:00:00.000Z
* Overall Time Span: 6 months, 2 days

**Granularity & Precision:**
* Detected Granularity: Day
* Implicit Precision: Day level precision detected

**Component Analysis & Common Values:**
* Most Common Year(s): [2001, 2000]
* Most Common Month(s): [March, April, February]
* Most Common Day of Week: [Friday, Thursday, Monday]
* Most Common Hour of Day: [0:00]

**Temporal Patterns (Univariate):**
* Pattern Analysis: Daily to weekly patterns detected
* Gap Analysis: Largest gap between consecutive records: 26 days

**Validity Notes:**
* No obvious validity issues detected

---
**Column: `Column_5`**
* **Detected Data Type:** date_time
* **Inferred Semantic Type:** unknown
* **Data Quality Flag:** Moderate
* **Quick Stats:**
    * Total Values (Count): 1,001
    * Missing Values: 122 (12.19%)
    * Unique Values: 50 (5.69% of total)

**3.2.C. Date/Time Column Analysis:**

**Range & Span:**
* Minimum Date/Time: 2000-05-31T14:00:00.000Z
* Maximum Date/Time: 2001-04-08T14:00:00.000Z
* Overall Time Span: 10 months, 12 days

**Granularity & Precision:**
* Detected Granularity: Day
* Implicit Precision: Day level precision detected

**Component Analysis & Common Values:**
* Most Common Year(s): [2001, 2000]
* Most Common Month(s): [February, March, January]
* Most Common Day of Week: [Friday, Thursday, Tuesday]
* Most Common Hour of Day: [0:00]

**Temporal Patterns (Univariate):**
* Pattern Analysis: Daily to weekly patterns detected
* Gap Analysis: Largest gap between consecutive records: 123 days

**Validity Notes:**
* No obvious validity issues detected

---
**Column: `Column_6`**
* **Detected Data Type:** numerical_float
* **Inferred Semantic Type:** unknown
* **Data Quality Flag:** Good
* **Quick Stats:**
    * Total Values (Count): 1,001
    * Missing Values: 1 (0.1%)
    * Unique Values: 51 (5.1% of total)

**3.2.A. Numerical Column Analysis:**

**Descriptive Statistics:**
* Minimum: 0
* Maximum: 5.4
* Range: 5.4
* Sum: 1819.7
* Mean (Arithmetic): 1.8197
* Median (50th Percentile): 1.804101
* Mode(s): [0 (Frequency: 5.9%)]
* Standard Deviation: 1.07458
* Variance: 1.154722
* Coefficient of Variation (CV): 0.5905%

**Quantile & Percentile Statistics:**
* 1st Percentile: 0
* 5th Percentile: 0.006349
* 10th Percentile: 0.377365
* 25th Percentile (Q1 - First Quartile): 1.000251
* 75th Percentile (Q3 - Third Quartile): 2.581422
* 90th Percentile: 3.214254
* 95th Percentile: 3.859434
* 99th Percentile: 4.285689
* Interquartile Range (IQR = Q3 - Q1): 1.58117
* Median Absolute Deviation (MAD): 0.695899

**Distribution Shape & Normality Assessment:**
* Skewness: 0.2368 (Approximately symmetric)
* Kurtosis (Excess): -0.4367 (Mesokurtic (normal-like tails))
* Histogram Analysis: Distribution spans 10 bins
* Normality Tests:
    * Shapiro-Wilk Test: W-statistic = 17.93742, p-value = 0.5 (Data consistent with normal distribution (p > 0.05))
    * Jarque-Bera Test: JB-statistic = 3.662255, p-value = 0.2 (Data consistent with normal distribution (p > 0.05))
    * Kolmogorov-Smirnov Test: D-statistic = 0.071859, p-value = 0.2 (Data consistent with normal distribution (p > 0.05))

**Univariate Outlier Analysis:**
* Method 1: IQR Proximity Rule
    * Lower Fence (Q1 - 1.5 * IQR): -1.371504
    * Upper Fence (Q3 + 1.5 * IQR): 4.953177
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
* Percentage of Zero Values: 8%
* Percentage of Negative Values: 0%
* Round Numbers Analysis: No significant rounding detected
* Potential for Log Transformation: Log transformation may not be beneficial

---
**Column: `Column_7`**
* **Detected Data Type:** boolean
* **Inferred Semantic Type:** status
* **Data Quality Flag:** Good
* **Quick Stats:**
    * Total Values (Count): 1,001
    * Missing Values: 1 (0.1%)
    * Unique Values: 2 (0.2% of total)

**3.2.D. Boolean Column Analysis:**

**Frequency Distribution:**
* Count of True: 215 (21.5%)
* Count of False: 785 (78.5%)
* Interpretation: Predominantly False

---
**Column: `Column_8`**
* **Detected Data Type:** date_time
* **Inferred Semantic Type:** unknown
* **Data Quality Flag:** Moderate
* **Quick Stats:**
    * Total Values (Count): 1,001
    * Missing Values: 173 (17.28%)
    * Unique Values: 50 (6.04% of total)

**3.2.C. Date/Time Column Analysis:**

**Range & Span:**
* Minimum Date/Time: 1962-07-31T14:00:00.000Z
* Maximum Date/Time: 1999-04-30T14:00:00.000Z
* Overall Time Span: 36 years, 9 months, 12 days

**Granularity & Precision:**
* Detected Granularity: Day
* Implicit Precision: Day level precision detected

**Component Analysis & Common Values:**
* Most Common Year(s): [1985, 1983, 1982]
* Most Common Month(s): [March, September, June]
* Most Common Day of Week: [Wednesday, Sunday, Monday]
* Most Common Hour of Day: [0:00]

**Temporal Patterns (Univariate):**
* Pattern Analysis: Sparse temporal distribution (monthly+ intervals)
* Gap Analysis: Largest gap between consecutive records: 2251 days

**Validity Notes:**
* No obvious validity issues detected

---
**Column: `Column_9`**
* **Detected Data Type:** date_time
* **Inferred Semantic Type:** unknown
* **Data Quality Flag:** Moderate
* **Quick Stats:**
    * Total Values (Count): 1,001
    * Missing Values: 103 (10.29%)
    * Unique Values: 50 (5.57% of total)

**3.2.C. Date/Time Column Analysis:**

**Range & Span:**
* Minimum Date/Time: 2001-03-08T13:00:00.000Z
* Maximum Date/Time: 2001-09-01T14:00:00.000Z
* Overall Time Span: 5 months, 27 days

**Granularity & Precision:**
* Detected Granularity: Day
* Implicit Precision: Day level precision detected

**Component Analysis & Common Values:**
* Most Common Year(s): [2001]
* Most Common Month(s): [June, May, July]
* Most Common Day of Week: [Saturday, Sunday, Friday]
* Most Common Hour of Day: [0:00]

**Temporal Patterns (Univariate):**
* Pattern Analysis: Daily to weekly patterns detected
* Gap Analysis: Largest gap between consecutive records: 27 days

**Validity Notes:**
* No obvious validity issues detected

---
**Column: `Column_10`**
* **Detected Data Type:** categorical
* **Inferred Semantic Type:** category
* **Data Quality Flag:** Good
* **Quick Stats:**
    * Total Values (Count): 1,001
    * Missing Values: 0 (0%)
    * Unique Values: 4 (0.4% of total)

**3.2.B. Categorical Column Analysis:**

**Frequency & Proportionality:**
* Number of Unique Categories: 4
* Mode (Most Frequent Category): `Fair` (Frequency: 437, 43.66%)
* Second Most Frequent Category: `Good` (Frequency: 378, 37.76%)
* Least Frequent Category: `diet_quality` (Frequency: 1, 0.1%)
* Frequency Distribution Table (Top 10):

| Category Label | Count | Percentage (%) | Cumulative % |
|----------------|-------|----------------|--------------|
| Fair | 437 | 43.66% | 43.66% |
| Good | 378 | 37.76% | 81.42% |
| Poor | 185 | 18.48% | 99.9% |
| diet_quality | 1 | 0.1% | 100% |

**Diversity & Balance:**
* Shannon Entropy: 1.5127 (Range: 0 to 2)
* Gini Impurity: 0.6327
* Interpretation of Balance: Moderately balanced distribution
* Major Category Dominance: Moderate concentration

**Category Label Analysis:**
* Minimum Label Length: 4 characters
* Maximum Label Length: 12 characters
* Average Label Length: 4 characters
* Empty String or Null-like Labels: 0 occurrences

**Potential Issues & Recommendations:**


* No significant issues detected.

---
**Column: `Column_11`**
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
* Maximum Date/Time: 2001-05-31T14:00:00.000Z
* Overall Time Span: 1 years, 5 months, 7 days

**Granularity & Precision:**
* Detected Granularity: Day
* Implicit Precision: Day level precision detected

**Component Analysis & Common Values:**
* Most Common Year(s): [2001, 2000]
* Most Common Month(s): [January, March, June]
* Most Common Day of Week: [Thursday, Friday, Tuesday]
* Most Common Hour of Day: [0:00]

**Temporal Patterns (Univariate):**
* Pattern Analysis: Weekly to monthly patterns detected
* Gap Analysis: Largest gap between consecutive records: 366 days

**Validity Notes:**
* No obvious validity issues detected

---
**Column: `Column_12`**
* **Detected Data Type:** categorical
* **Inferred Semantic Type:** category
* **Data Quality Flag:** Good
* **Quick Stats:**
    * Total Values (Count): 1,001
    * Missing Values: 0 (0%)
    * Unique Values: 5 (0.5% of total)

**3.2.B. Categorical Column Analysis:**

**Frequency & Proportionality:**
* Number of Unique Categories: 5
* Mode (Most Frequent Category): `High School` (Frequency: 392, 39.16%)
* Second Most Frequent Category: `Bachelor` (Frequency: 350, 34.97%)
* Least Frequent Category: `parental_education_level` (Frequency: 1, 0.1%)
* Frequency Distribution Table (Top 10):

| Category Label | Count | Percentage (%) | Cumulative % |
|----------------|-------|----------------|--------------|
| High School | 392 | 39.16% | 39.16% |
| Bachelor | 350 | 34.97% | 74.13% |
| Master | 167 | 16.68% | 90.81% |
| None | 91 | 9.09% | 99.9% |
| parental_education_level | 1 | 0.1% | 100% |

**Diversity & Balance:**
* Shannon Entropy: 1.8152 (Range: 0 to 2.3219)
* Gini Impurity: 0.6883
* Interpretation of Balance: Moderately balanced distribution
* Major Category Dominance: Well distributed

**Category Label Analysis:**
* Minimum Label Length: 4 characters
* Maximum Label Length: 24 characters
* Average Label Length: 8.5 characters
* Empty String or Null-like Labels: 0 occurrences

**Potential Issues & Recommendations:**


* No significant issues detected.

---
**Column: `Column_13`**
* **Detected Data Type:** categorical
* **Inferred Semantic Type:** category
* **Data Quality Flag:** Good
* **Quick Stats:**
    * Total Values (Count): 1,001
    * Missing Values: 0 (0%)
    * Unique Values: 4 (0.4% of total)

**3.2.B. Categorical Column Analysis:**

**Frequency & Proportionality:**
* Number of Unique Categories: 4
* Mode (Most Frequent Category): `Good` (Frequency: 447, 44.66%)
* Second Most Frequent Category: `Average` (Frequency: 391, 39.06%)
* Least Frequent Category: `internet_quality` (Frequency: 1, 0.1%)
* Frequency Distribution Table (Top 10):

| Category Label | Count | Percentage (%) | Cumulative % |
|----------------|-------|----------------|--------------|
| Good | 447 | 44.66% | 44.66% |
| Average | 391 | 39.06% | 83.72% |
| Poor | 162 | 16.18% | 99.9% |
| internet_quality | 1 | 0.1% | 100% |

**Diversity & Balance:**
* Shannon Entropy: 1.4843 (Range: 0 to 2)
* Gini Impurity: 0.6218
* Interpretation of Balance: Moderately balanced distribution
* Major Category Dominance: Moderate concentration

**Category Label Analysis:**
* Minimum Label Length: 4 characters
* Maximum Label Length: 16 characters
* Average Label Length: 5.2 characters
* Empty String or Null-like Labels: 0 occurrences

**Potential Issues & Recommendations:**


* No significant issues detected.

---
**Column: `Column_14`**
* **Detected Data Type:** date_time
* **Inferred Semantic Type:** unknown
* **Data Quality Flag:** Good
* **Quick Stats:**
    * Total Values (Count): 1,001
    * Missing Values: 1 (0.1%)
    * Unique Values: 50 (5% of total)

**3.2.C. Date/Time Column Analysis:**

**Range & Span:**
* Minimum Date/Time: 2000-12-31T13:00:00.000Z
* Maximum Date/Time: 2001-09-30T14:00:00.000Z
* Overall Time Span: 9 months, 3 days

**Granularity & Precision:**
* Detected Granularity: Day
* Implicit Precision: Day level precision detected

**Component Analysis & Common Values:**
* Most Common Year(s): [2001]
* Most Common Month(s): [April, June, August]
* Most Common Day of Week: [Monday, Sunday, Thursday]
* Most Common Hour of Day: [0:00]

**Temporal Patterns (Univariate):**
* Pattern Analysis: Daily to weekly patterns detected
* Gap Analysis: Largest gap between consecutive records: 31 days

**Validity Notes:**
* No obvious validity issues detected

---
**Column: `Column_15`**
* **Detected Data Type:** boolean
* **Inferred Semantic Type:** status
* **Data Quality Flag:** Good
* **Quick Stats:**
    * Total Values (Count): 1,001
    * Missing Values: 1 (0.1%)
    * Unique Values: 2 (0.2% of total)

**3.2.D. Boolean Column Analysis:**

**Frequency Distribution:**
* Count of True: 318 (31.8%)
* Count of False: 682 (68.2%)
* Interpretation: Balanced distribution

---
**Column: `Column_16`**
* **Detected Data Type:** date_time
* **Inferred Semantic Type:** unknown
* **Data Quality Flag:** Moderate
* **Quick Stats:**
    * Total Values (Count): 1,001
    * Missing Values: 158 (15.78%)
    * Unique Values: 50 (5.93% of total)

**3.2.C. Date/Time Column Analysis:**

**Range & Span:**
* Minimum Date/Time: 1951-01-31T14:00:00.000Z
* Maximum Date/Time: 2048-03-31T13:00:00.000Z
* Overall Time Span: 97 years, 2 months, 28 days

**Granularity & Precision:**
* Detected Granularity: Day
* Implicit Precision: Day level precision detected

**Component Analysis & Common Values:**
* Most Common Year(s): [1970, 1977, 1966]
* Most Common Month(s): [September, April, June]
* Most Common Day of Week: [Tuesday, Wednesday, Monday]
* Most Common Hour of Day: [0:00]

**Temporal Patterns (Univariate):**
* Pattern Analysis: Sparse temporal distribution (monthly+ intervals)
* Gap Analysis: Largest gap between consecutive records: 13027 days

**Validity Notes:**
* 5 future dates detected

**3.3. Bivariate Analysis (Exploring Relationships Between Pairs of Variables):**

**Numerical vs. Numerical:**
* No numerical variable pairs available for correlation analysis.

**Categorical vs. Categorical:**
    * **Contingency Table Analysis:**
    * **`Column_3` vs `Column_10`:**
        * **Contingency Table (Top 3x3):**
        |             | student_id |
        |-------------|-------------|
        | student_id | 1 |
        | S1000 | 0 |
        | S1001 | 0 |
        * **Association Tests:**
            * Chi-Squared: χ² = 0, df = 0, p-value = 1 (Insufficient data for chi-squared test)
            * Cramer's V: 0 (Cannot calculate association strength)
        * **Insights:** Most common combination: student_id & student_id (1 occurrences). Association strength: weak.

    * **`Column_3` vs `Column_12`:**
        * **Contingency Table (Top 3x3):**
        |             | student_id |
        |-------------|-------------|
        | student_id | 1 |
        | S1000 | 0 |
        | S1001 | 0 |
        * **Association Tests:**
            * Chi-Squared: χ² = 0, df = 0, p-value = 1 (Insufficient data for chi-squared test)
            * Cramer's V: 0 (Cannot calculate association strength)
        * **Insights:** Most common combination: student_id & student_id (1 occurrences). Association strength: weak.

**3.4. Multivariate Analysis (Preliminary Insights into Complex Interactions):**
    * **Principal Component Analysis:** Not applicable - insufficient numerical variables.

    * **Cluster Analysis:** Not performed - data characteristics not suitable for clustering.

    * **Feature Interactions:** No significant interactions detected.

**3.5. Specific Analysis Modules (Activated Based on Data Characteristics):**

    * **3.5.A. Time Series Analysis Deep Dive:**
        * **Detected DateTime Columns:** 7 columns identified
        * **Primary Temporal Column:** `Column_4`
        * **Analysis Note:** Advanced time series decomposition, trend analysis, and seasonality detection would be performed here for time-ordered data with sufficient temporal granularity.
        * **Recommendation:** Consider sorting data by primary temporal column for time series analysis if records represent sequential events.

    * **3.5.B. Text Analytics Deep Dive:**
        * **Detected Text Columns:** 1 columns identified
        * **Primary Text Column:** `Column_1`
        * **Advanced Analysis Available:** N-gram analysis, topic modelling, named entity recognition, sentiment analysis
        * **Sample Keywords:** [student_id, s1000, s1001, s1002, s1003]
        * **Recommendation:** Apply NLP preprocessing pipeline for deeper text insights if required for analysis goals.

**3.6. EDA Summary & Key Hypotheses/Insights:**
    * **Top Statistical Findings:**
    1. Streaming analysis processed 1,001 rows using only 11MB peak memory
    * **Data Quality Issues Uncovered:**
    * No major data quality issues identified during EDA.
    * **Hypotheses Generated for Further Testing:**
    * No specific hypotheses generated - consider domain knowledge for hypothesis formation.
    * **Recommendations for Data Preprocessing & Feature Engineering:**
    * Consider encoding or grouping high-cardinality columns: Column_1
    * **Critical Warnings & Considerations:**




---

**Analysis Performance Summary:**
* **Processing Time:** 31ms (0.03 seconds)
* **Rows Analysed:** 1,001
* **Memory Efficiency:** Constant ~11MB usage
* **Analysis Method:** Streaming with online algorithms
* **Dataset Size:** 1,001 records across 16 columns