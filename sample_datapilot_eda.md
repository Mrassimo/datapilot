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
    * Total Values (Count): 11
    * Missing Values: 0 (0%)
    * Unique Values: 11 (100% of total)

**3.2.E. Text Column Analysis:**

**Length-Based Statistics (Characters):**
* Minimum Length: 4
* Maximum Length: 16
* Average Length: 10.73
* Median Length: 11
* Standard Deviation of Length: 2.99

**Word Count Statistics:**
* Minimum Word Count: 1
* Maximum Word Count: 2
* Average Word Count: 1.91

**Common Patterns:**
* Percentage of Empty Strings: 0%
* Percentage of Purely Numeric Text: 0%
* URLs Found: 0 (0%)
* Email Addresses Found: 0 (0%)

**Top 5 Most Frequent Words:** [name, john, doe, jane, smith]

---
**Column: `Column_2`**
* **Detected Data Type:** numerical_integer
* **Inferred Semantic Type:** unknown
* **Data Quality Flag:** Moderate
* **Quick Stats:**
    * Total Values (Count): 11
    * Missing Values: 1 (9.09%)
    * Unique Values: 10 (100% of total)

**3.2.A. Numerical Column Analysis:**

**Descriptive Statistics:**
* Minimum: 27
* Maximum: 45
* Range: 18
* Sum: 340
* Mean (Arithmetic): 34
* Median (50th Percentile): 34
* Mode(s): [28 (Frequency: 10%), 32 (Frequency: 10%), 45 (Frequency: 10%), 29 (Frequency: 10%), 35 (Frequency: 10%)]
* Standard Deviation: 5.656854
* Variance: 32
* Coefficient of Variation (CV): 0.1664%

**Quantile & Percentile Statistics:**
* 1st Percentile: 29.444444
* 5th Percentile: 29.444444
* 10th Percentile: 29.444444
* 25th Percentile (Q1 - First Quartile): 29.444444
* 75th Percentile (Q3 - Third Quartile): 37.153935
* 90th Percentile: 38.938979
* 95th Percentile: 38.938979
* 99th Percentile: 38.938979
* Interquartile Range (IQR = Q3 - Q1): 7.709491
* Median Absolute Deviation (MAD): 5

**Distribution Shape & Normality Assessment:**
* Skewness: 0.5966 (Right-skewed (positive skew))
* Kurtosis (Excess): -0.843 (Platykurtic (light tails))
* Histogram Analysis: Distribution spans 4 bins
* Normality Tests:
    * Shapiro-Wilk Test: W-statistic = 0.997269, p-value = 0.5 (Data consistent with normal distribution (p > 0.05))
    * Jarque-Bera Test: JB-statistic = 0.889344, p-value = 0.2 (Data consistent with normal distribution (p > 0.05))
    * Kolmogorov-Smirnov Test: D-statistic = 0.166592, p-value = 0.2 (Data consistent with normal distribution (p > 0.05))

**Univariate Outlier Analysis:**
* Method 1: IQR Proximity Rule
    * Lower Fence (Q1 - 1.5 * IQR): 17.880208
    * Upper Fence (Q3 + 1.5 * IQR): 48.718171
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
* **Detected Data Type:** text_general
* **Inferred Semantic Type:** category
* **Data Quality Flag:** Good
* **Quick Stats:**
    * Total Values (Count): 11
    * Missing Values: 0 (0%)
    * Unique Values: 11 (100% of total)

**3.2.E. Text Column Analysis:**

**Length-Based Statistics (Characters):**
* Minimum Length: 4
* Maximum Length: 17
* Average Length: 7.91
* Median Length: 6
* Standard Deviation of Length: 4.06

**Word Count Statistics:**
* Minimum Word Count: 1
* Maximum Word Count: 3
* Average Word Count: 1.45

**Common Patterns:**
* Percentage of Empty Strings: 0%
* Percentage of Purely Numeric Text: 0%
* URLs Found: 0 (0%)
* Email Addresses Found: 0 (0%)

**Top 5 Most Frequent Words:** [city, london, paris, new, york]

---
**Column: `Column_4`**
* **Detected Data Type:** date_time
* **Inferred Semantic Type:** unknown
* **Data Quality Flag:** Moderate
* **Quick Stats:**
    * Total Values (Count): 11
    * Missing Values: 1 (9.09%)
    * Unique Values: 10 (100% of total)

**3.2.C. Date/Time Column Analysis:**

**Range & Span:**
* Minimum Date/Time: +067999-12-31T13:00:00.000Z
* Maximum Date/Time: +109999-12-31T13:00:00.000Z
* Overall Time Span: 42027 years, 11 months, 15 days

**Granularity & Precision:**
* Detected Granularity: Day
* Implicit Precision: Day level precision detected

**Component Analysis & Common Values:**
* Most Common Year(s): [75000, 82000, 95000]
* Most Common Month(s): [January]
* Most Common Day of Week: [Saturday, Wednesday]
* Most Common Hour of Day: [0:00]

**Temporal Patterns (Univariate):**
* Pattern Analysis: Sparse temporal distribution (monthly+ intervals)
* Gap Analysis: Largest gap between consecutive records: 5478637 days

**Validity Notes:**
* 10 future dates detected

---
**Column: `Column_5`**
* **Detected Data Type:** categorical
* **Inferred Semantic Type:** category
* **Data Quality Flag:** Good
* **Quick Stats:**
    * Total Values (Count): 11
    * Missing Values: 0 (0%)
    * Unique Values: 5 (45.45% of total)

**3.2.B. Categorical Column Analysis:**

**Frequency & Proportionality:**
* Number of Unique Categories: 5
* Mode (Most Frequent Category): `Engineering` (Frequency: 4, 36.36%)
* Second Most Frequent Category: `Marketing` (Frequency: 3, 27.27%)
* Least Frequent Category: `Sales` (Frequency: 1, 9.09%)
* Frequency Distribution Table (Top 10):

| Category Label | Count | Percentage (%) | Cumulative % |
|----------------|-------|----------------|--------------|
| Engineering | 4 | 36.36% | 36.36% |
| Marketing | 3 | 27.27% | 63.63% |
| Design | 2 | 18.18% | 81.81% |
| department | 1 | 9.09% | 90.9% |
| Sales | 1 | 9.09% | 99.99% |

**Diversity & Balance:**
* Shannon Entropy: 2.1181 (Range: 0 to 2.3219)
* Gini Impurity: 0.7438
* Interpretation of Balance: Highly balanced distribution
* Major Category Dominance: Well distributed

**Category Label Analysis:**
* Minimum Label Length: 5 characters
* Maximum Label Length: 11 characters
* Average Label Length: 8.9 characters
* Empty String or Null-like Labels: 0 occurrences

**Potential Issues & Recommendations:**


* No significant issues detected.

**3.3. Bivariate Analysis (Exploring Relationships Between Pairs of Variables):**

**Numerical vs. Numerical:**
* No numerical variable pairs available for correlation analysis.

**3.4. Multivariate Analysis (Preliminary Insights into Complex Interactions):**
    * **Principal Component Analysis:** Not applicable - insufficient numerical variables.

    * **Cluster Analysis:** Not performed - data characteristics not suitable for clustering.

    * **Feature Interactions:** No significant interactions detected.

**3.5. Specific Analysis Modules (Activated Based on Data Characteristics):**

    * **3.5.A. Time Series Analysis Deep Dive:**
        * **Detected DateTime Columns:** 1 columns identified
        * **Primary Temporal Column:** `Column_4`
        * **Analysis Note:** Advanced time series decomposition, trend analysis, and seasonality detection would be performed here for time-ordered data with sufficient temporal granularity.
        * **Recommendation:** Consider sorting data by primary temporal column for time series analysis if records represent sequential events.

    * **3.5.B. Text Analytics Deep Dive:**
        * **Detected Text Columns:** 2 columns identified
        * **Primary Text Column:** `Column_1`
        * **Advanced Analysis Available:** N-gram analysis, topic modelling, named entity recognition, sentiment analysis
        * **Sample Keywords:** [name, john, doe, jane, smith]
        * **Recommendation:** Apply NLP preprocessing pipeline for deeper text insights if required for analysis goals.

**3.6. EDA Summary & Key Hypotheses/Insights:**
    * **Top Statistical Findings:**
    1. Streaming analysis processed 11 rows using only 0MB peak memory
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
* **Processing Time:** 7ms (0.01 seconds)
* **Rows Analysed:** 11
* **Memory Efficiency:** Constant ~0MB usage
* **Analysis Method:** Streaming with online algorithms
* **Dataset Size:** 11 records across 5 columns