🤖 DATAPILOT COMPLETE ANALYSIS ENGINE
======================================
Analysis Target: Medicaldataset.csv
Report Generated: 2025-06-06 03:12:37 (UTC)
DataPilot Version: v1.0.0 (TypeScript Edition)

---
### Section 1: Comprehensive Dataset & Analysis Overview
This section provides a detailed snapshot of the dataset properties, how it was processed, and the context of this analysis run.

**1.1. Input Data File Details:**
    * Original Filename: `Medicaldataset.csv`
    * Full Resolved Path: `/Users/[user]/plum/test-datasets/kaggle/Medicaldataset.csv`
    * File Size (on disk): 0.04993 MB
    * MIME Type (detected/inferred): `text/csv`
    * File Last Modified (OS Timestamp): 2025-06-05 11:34:05 (UTC)
    * File Hash (SHA256): `ba28e4585e736fff12f0232c9d139f944e374c2c29c32594b3c6bae44b6348e0`

**1.2. Data Ingestion & Parsing Parameters:**
    * Data Source Type: Local File System
    * Parsing Engine Utilized: DataPilot Advanced CSV Parser v1.0.0
    * Time Taken for Parsing & Initial Load: 0.009 seconds
    * Detected Character Encoding: `utf8`
        * Encoding Detection Method: Statistical Character Pattern Analysis
        * Encoding Confidence: High (90%)
    * Detected Delimiter Character: `,` (Comma)
        * Delimiter Detection Method: Character Frequency Analysis with Field Consistency Scoring
        * Delimiter Confidence: High (100%)
    * Detected Line Ending Format: `CRLF (Windows-style)`
    * Detected Quoting Character: `"`
        * Empty Lines Encountered: 1
    * Header Row Processing:
        * Header Presence: Detected
        * Header Row Number(s): 1
        * Column Names Derived From: First row interpreted as column headers
    * Byte Order Mark (BOM): Not Detected
    * Initial Row/Line Scan Limit for Detection: First 52355 bytes or 1000 lines

**1.3. Dataset Structural Dimensions & Initial Profile:**
    * Total Rows Read (including header, if any): 1,320
    * Total Rows of Data (excluding header): 1,319
    * Total Columns Detected: 9
    * Total Data Cells (Data Rows × Columns): 11,871
    * List of Column Names (9) and Original Index:
        1.  (Index 0) `Age`
        2.  (Index 1) `Gender`
        3.  (Index 2) `Heart rate`
        4.  (Index 3) `Systolic blood pressure`
        5.  (Index 4) `Diastolic blood pressure`
        6.  (Index 5) `Blood sugar`
        7.  (Index 6) `CK-MB`
        8.  (Index 7) `Troponin`
        9.  (Index 8) `Result`
    * Estimated In-Memory Size (Post-Parsing & Initial Type Guessing): 0.48 MB
    * Average Row Length (bytes, approximate): 39 bytes
    * Dataset Sparsity (Initial Estimate): Dense dataset with minimal missing values (0% sparse cells via Full dataset analysis)

**1.4. Analysis Configuration & Execution Context:**
    * Full Command Executed: `datapilot overview /Users/massimoraso/plum/test-datasets/kaggle/Medicaldataset.csv`
    * Analysis Mode Invoked: Comprehensive Deep Scan
    * Timestamp of Analysis Start: 2025-06-06 03:12:37 (UTC)
    * Global Dataset Sampling Strategy: Full dataset analysis (No record sampling applied for initial overview)
    * DataPilot Modules Activated for this Run: File I/O Manager, Advanced CSV Parser, Metadata Collector, Structural Analyzer, Report Generator
    * Processing Time for Section 1 Generation: 0.015 seconds
    * Host Environment Details:
        * Operating System: macOS (Unknown Version)
        * System Architecture: ARM64 (Apple Silicon/ARM 64-bit)
        * Execution Runtime: Node.js v23.6.1 (V8 12.9.202.28-node.12) on darwin
        * Available CPU Cores / Memory (at start of analysis): 8 cores / 8 GB

---
### Performance Metrics

**Processing Performance:**
    * Total Analysis Time: 0.015 seconds
    * File analysis: 0.003s
    * Parsing: 0.009s
    * Structural analysis: 0.002s

---

---

### **Section 2: Comprehensive Data Quality & Integrity Audit Report** 🧐🛡️

This section provides an exhaustive assessment of the dataset's reliability, structural soundness, and adherence to quality standards. Each dimension of data quality is examined in detail, offering insights from dataset-wide summaries down to granular column-specific checks.

**2.1. Overall Data Quality Cockpit:**
    * **Composite Data Quality Score (CDQS):** 89.9 / 100
        * *Methodology:* Weighted average of individual quality dimension scores.
        * *Interpretation:* Good - Weighted average of 10 quality dimensions
    * **Data Quality Dimensions Summary:**
        * Completeness: 100.0/100 (Excellent)
        * Uniqueness: 100.0/100 (Excellent)
        * Validity: 64.4/100 (Needs Improvement)
        * Consistency: 100.0/100 (Excellent)
        * Accuracy: 100.0/100 (Excellent)
        * Timeliness: 75.0/100 (Fair)
        * Integrity: 85.0/100 (Good)
        * Reasonableness: 80.0/100 (Good)
        * Precision: 85.0/100 (Good)
        * Representational: 80.0/100 (Good)
    * **Top 3 Data Quality Strengths:**
        1. Excellent completeness with 100% score (completeness).
        2. Excellent accuracy with 100% score (accuracy).
        3. Excellent consistency with 100% score (consistency).
    * **Top 3 Data Quality Weaknesses (Areas for Immediate Attention):**
        1. validity quality needs attention (64.44% score) (Priority: 8/10).
        2. timeliness quality needs attention (75% score) (Priority: 6/10).
        3. reasonableness quality needs attention (80% score) (Priority: 6/10).
    * **Estimated Technical Debt (Data Cleaning Effort):**
        * *Time Estimate:* 12 hours estimated cleanup.
        * *Complexity Level:* Medium.
        * *Primary Debt Contributors:* validity quality needs attention (64.44% score), timeliness quality needs attention (75% score), reasonableness quality needs attention (80% score).
    * **Automated Cleaning Potential:**
        * *Number of Issues with Suggested Automated Fixes:* 3.
        * *Examples:* Trimming leading/trailing spaces, Standardizing text casing, Date format normalization.

**2.2. Completeness Dimension (Absence of Missing Data):**
    * **Dataset-Level Completeness Overview:**
        * Overall Dataset Completeness Ratio: 100.00%.
        * Total Missing Values (Entire Dataset): 0.
        * Percentage of Rows Containing at Least One Missing Value: 0.00%.
        * Percentage of Columns Containing at Least One Missing Value: 0.00%.
        * Missing Value Distribution Overview: No missing values detected.
    * **Column-Level Completeness Deep Dive:** (Showing top 9 columns)
        * `Age`:
            * Number of Missing Values: 0.
            * Percentage of Missing Values: 0.00%.
            * Missingness Pattern: No missing values detected.
            * Suggested Imputation Strategy: None (Confidence: 100%).
            * Missing Data Distribution: ▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁.
        * `Gender`:
            * Number of Missing Values: 0.
            * Percentage of Missing Values: 0.00%.
            * Missingness Pattern: No missing values detected.
            * Suggested Imputation Strategy: None (Confidence: 100%).
            * Missing Data Distribution: ▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁.
        * `Heart rate`:
            * Number of Missing Values: 0.
            * Percentage of Missing Values: 0.00%.
            * Missingness Pattern: No missing values detected.
            * Suggested Imputation Strategy: None (Confidence: 100%).
            * Missing Data Distribution: ▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁.
        * `Systolic blood pressure`:
            * Number of Missing Values: 0.
            * Percentage of Missing Values: 0.00%.
            * Missingness Pattern: No missing values detected.
            * Suggested Imputation Strategy: None (Confidence: 100%).
            * Missing Data Distribution: ▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁.
        * `Diastolic blood pressure`:
            * Number of Missing Values: 0.
            * Percentage of Missing Values: 0.00%.
            * Missingness Pattern: No missing values detected.
            * Suggested Imputation Strategy: None (Confidence: 100%).
            * Missing Data Distribution: ▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁.
        * `Blood sugar`:
            * Number of Missing Values: 0.
            * Percentage of Missing Values: 0.00%.
            * Missingness Pattern: No missing values detected.
            * Suggested Imputation Strategy: None (Confidence: 100%).
            * Missing Data Distribution: ▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁.
        * `CK-MB`:
            * Number of Missing Values: 0.
            * Percentage of Missing Values: 0.00%.
            * Missingness Pattern: No missing values detected.
            * Suggested Imputation Strategy: None (Confidence: 100%).
            * Missing Data Distribution: ▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁.
        * `Troponin`:
            * Number of Missing Values: 0.
            * Percentage of Missing Values: 0.00%.
            * Missingness Pattern: No missing values detected.
            * Suggested Imputation Strategy: None (Confidence: 100%).
            * Missing Data Distribution: ▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁.
        * `Result`:
            * Number of Missing Values: 0.
            * Percentage of Missing Values: 0.00%.
            * Missingness Pattern: No missing values detected.
            * Suggested Imputation Strategy: None (Confidence: 100%).
            * Missing Data Distribution: ▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁.
    * **Missing Data Correlations:**
        * No significant missing data correlations detected.
    * **Missing Data Block Patterns:**
        * No block patterns detected.
    * **Completeness Score:** 100.0/100 (Excellent) - 100% of cells contain data.

**2.3. Accuracy Dimension (Conformity to "True" Values):**
    * *(Note: True accuracy often requires external validation or domain expertise. Analysis shows rule-based conformity checks.)*
    * **Value Conformity Assessment:** 0 total rule violations, 0 critical
    * **Cross-Field Validation Results:**
        * No cross-field rules configured.
    * **Pattern Validation Results:**
        * No pattern validation issues detected.
    * **Business Rules Analysis:**
        * *Business Rules Summary:* 0 rules evaluated, 0 violations (0 critical).
    * **Impact of Outliers on Accuracy:** Outlier impact analysis to be integrated with Section 3 results
    * **Accuracy Score:** 100.0/100 (Excellent).

**2.4. Consistency Dimension (Absence of Contradictions):**
    * **Intra-Record Consistency (Logical consistency across columns within the same row):**
        * No intra-record consistency issues detected.
    * **Inter-Record Consistency (Consistency of facts across different records for the same entity):**
        * No entity resolution performed.
    * **Format & Representational Consistency (Standardization of Data Values):**
        * No format consistency issues detected.
    * **Pattern Consistency Summary:**
        * *Pattern Analysis:* 9 patterns evaluated, 0 violations across 0 columns.
    * **Consistency Score (Rule-based and pattern detection):** 100.0/100 (Excellent).

**2.5. Timeliness & Currency Dimension:**
    * **Data Freshness Indicators:** Timeliness analysis not yet implemented
    * **Update Frequency Analysis:** Not applicable for single-snapshot data.
    * **Timeliness Score:** 75.0/100 (Fair).

**2.6. Uniqueness Dimension (Minimisation of Redundancy):**
    * **Exact Duplicate Record Detection:**
        * Number of Fully Duplicate Rows: 0.
        * Percentage of Dataset Comprised of Exact Duplicates: 0.00%.
    * **Key Uniqueness & Integrity:**
        * No key-like columns identified.
    * **Column-Level Value Uniqueness Profile:**
        * `Age`: 5.7% unique values. 1244 duplicates. Most frequent: "60" (106 times).
        * `Gender`: 0.2% unique values. 1317 duplicates. Most frequent: "1" (870 times).
        * `Heart rate`: 6.0% unique values. 1240 duplicates. Most frequent: "60" (95 times).
        * `Systolic blood pressure`: 8.8% unique values. 1203 duplicates. Most frequent: "150" (50 times).
        * `Diastolic blood pressure`: 5.5% unique values. 1246 duplicates. Most frequent: "75" (69 times).
        * `Blood sugar`: 18.5% unique values. 1075 duplicates. Most frequent: "100" (41 times).
        * `CK-MB`: 53.1% unique values. 619 duplicates. Most frequent: "300" (19 times).
        * `Troponin`: 26.7% unique values. 967 duplicates. Most frequent: "0.003" (190 times).
    * **Fuzzy/Semantic Duplicate Detection:**
        * Number of Record Pairs Suspected to be Semantic Duplicates: 946 pairs.
        * Methods Used: levenshtein, soundex.
    * **Uniqueness Score:** 100.0/100 (Excellent) - 0.00% duplicate rows, 0 key constraint violations.

**2.7. Validity & Conformity Dimension:**
    * **Data Type Conformance Deep Dive:**
        * `Age` (Expected: String, Detected: Integer, Confidence: 100%):
            * Non-Conforming Values: 1319 (0.0% conformance).
            * Examples: "64", "21", "55".
            * Conversion Strategy: Manual review recommended - low conformance rate.
        * `Gender` (Expected: String, Detected: Boolean, Confidence: 100%):
            * Non-Conforming Values: 1319 (0.0% conformance).
            * Examples: "1", "1", "1".
            * Conversion Strategy: Manual review recommended - low conformance rate.
        * `Heart rate` (Expected: String, Detected: Integer, Confidence: 100%):
            * Non-Conforming Values: 1319 (0.0% conformance).
            * Examples: "66", "94", "64".
            * Conversion Strategy: Manual review recommended - low conformance rate.
        * `Systolic blood pressure` (Expected: String, Detected: Integer, Confidence: 100%):
            * Non-Conforming Values: 1319 (0.0% conformance).
            * Examples: "160", "98", "160".
            * Conversion Strategy: Manual review recommended - low conformance rate.
        * `Diastolic blood pressure` (Expected: String, Detected: Integer, Confidence: 100%):
            * Non-Conforming Values: 1319 (0.0% conformance).
            * Examples: "83", "46", "77".
            * Conversion Strategy: Manual review recommended - low conformance rate.
        * `Blood sugar` (Expected: String, Detected: Integer, Confidence: 100%):
            * Non-Conforming Values: 1319 (0.0% conformance).
            * Examples: "160", "296", "270".
            * Conversion Strategy: Manual review recommended - low conformance rate.
        * `CK-MB` (Expected: String, Detected: Float, Confidence: 98%):
            * Non-Conforming Values: 1319 (0.0% conformance).
            * Examples: "1.8", "6.75", "1.99".
            * Conversion Strategy: Manual review recommended - low conformance rate.
        * `Troponin` (Expected: String, Detected: Float, Confidence: 99%):
            * Non-Conforming Values: 1319 (0.0% conformance).
            * Examples: "0.012", "1.06", "0.003".
            * Conversion Strategy: Manual review recommended - low conformance rate.
    * **Range & Value Set Conformance:**
        * No range constraints defined.
    * **Pattern Conformance (Regex Validation):**
        * `Result` (Fixed Format Code): 0 violations.
    * **Cross-Column Validation Rules:**
        * Business rules: 0 configured rules.
    * **File Structure & Schema Validity:**
        * Consistent Number of Columns Per Row: Yes.
        * Header Row Conformance: Yes.
    * **Validity Score:** 64.4/100 (Needs Improvement) - 11.1% average type conformance, 0 total violations.

**2.8. Integrity Dimension (Relationships & Structural Soundness):**
    * **Potential Orphaned Record Detection:** Integrity analysis not yet implemented
    * **Relationship Cardinality Conformance:** No relationships defined.
    * **Data Model Integrity:** Schema validation not performed.
    * **Integrity Score:** 85.0/100 (Good).

**2.9. Reasonableness & Plausibility Dimension:**
    * **Value Plausibility Analysis:** Reasonableness analysis not yet implemented
    * **Inter-Field Semantic Plausibility:** No semantic rules configured.
    * **Contextual Anomaly Detection:** Statistical analysis pending.
    * **Plausibility Score:** 80.0/100 (Good).

**2.10. Precision & Granularity Dimension:**
    * **Numeric Precision Analysis:** Precision analysis not yet implemented
    * **Temporal Granularity:** To be implemented.
    * **Categorical Specificity:** To be implemented.
    * **Precision Score:** 85.0/100 (Good).

**2.11. Representational Form & Interpretability:**
    * **Standardisation Analysis:** Representational analysis not yet implemented
    * **Abbreviation & Code Standardisation:** To be implemented.
    * **Boolean Value Representation:** To be implemented.
    * **Text Field Formatting:** To be implemented.
    * **Interpretability Score:** 80.0/100 (Good).

**2.13. Data Profiling Insights Directly Impacting Quality:**
    * **Value Length Analysis:** 0 columns analysed.
    * **Character Set & Encoding Validation:** 0 columns analysed.
    * **Special Character Analysis:** 0 columns analysed.
    * *Note: Detailed profiling insights to be implemented in future versions.*

---

**Data Quality Audit Summary:**
* **Generated:** 2025-06-06T03:12:37.460Z
* **Version:** 1.0.0
* **Overall Assessment:** Good data quality with 89.9/100 composite score.

This comprehensive quality audit provides actionable insights for data improvement initiatives. Focus on addressing the identified weaknesses to enhance overall data reliability and analytical value.

---

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
**Column: `Age`**
* **Detected Data Type:** numerical_integer
* **Inferred Semantic Type:** age
* **Data Quality Flag:** Good
* **Quick Stats:**
    * Total Values (Count): 1,320
    * Missing Values: 1 (0.08%)
    * Unique Values: 75 (5.69% of total)

**3.2.A. Numerical Column Analysis:**

**Descriptive Statistics:**
* Minimum: 14
* Maximum: 103
* Range: 89
* Sum: 74117
* Mean (Arithmetic): 56.191812
* Median (50th Percentile): 58.953237
* Mode(s): [60 (Frequency: 8.04%)]
* Standard Deviation: 13.642141
* Variance: 186.108015
* Coefficient of Variation (CV): 0.2428%

**Quantile & Percentile Statistics:**
* 1st Percentile: 23.011982
* 5th Percentile: 32.034872
* 10th Percentile: 39.107052
* 25th Percentile (Q1 - First Quartile): 48.469978
* 75th Percentile (Q3 - Third Quartile): 65.084299
* 90th Percentile: 72.927528
* 95th Percentile: 75.962455
* 99th Percentile: 87.818773
* Interquartile Range (IQR = Q3 - Q1): 16.614321
* Median Absolute Deviation (MAD): 7.953237

**Distribution Shape & Normality Assessment:**
* Skewness: -0.2389 (Approximately symmetric)
* Kurtosis (Excess): -0.0284 (Mesokurtic (normal-like tails))
* Histogram Analysis: Distribution spans 10 bins
* Normality Tests:
    * Shapiro-Wilk Test: W-statistic = 15.103307, p-value = 0.5 (Data consistent with normal distribution (p > 0.05))
    * Jarque-Bera Test: JB-statistic = 1.347638, p-value = 0.2 (Data consistent with normal distribution (p > 0.05))
    * Kolmogorov-Smirnov Test: D-statistic = 0.085733, p-value = 0.2 (Data consistent with normal distribution (p > 0.05))

**Univariate Outlier Analysis:**
* Method 1: IQR Proximity Rule
    * Lower Fence (Q1 - 1.5 * IQR): 23.548496
    * Upper Fence (Q3 + 1.5 * IQR): 90.005781
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
* Round Numbers Analysis: High proportion of round numbers suggests potential data rounding
* Potential for Log Transformation: Log transformation may not be beneficial

---
**Column: `Gender`**
* **Detected Data Type:** boolean
* **Inferred Semantic Type:** status
* **Data Quality Flag:** Good
* **Quick Stats:**
    * Total Values (Count): 1,320
    * Missing Values: 1 (0.08%)
    * Unique Values: 2 (0.15% of total)

**3.2.D. Boolean Column Analysis:**

**Frequency Distribution:**
* Count of True: 870 (65.96%)
* Count of False: 449 (34.04%)
* Interpretation: Balanced distribution

---
**Column: `Heart rate`**
* **Detected Data Type:** numerical_integer
* **Inferred Semantic Type:** unknown
* **Data Quality Flag:** Good
* **Quick Stats:**
    * Total Values (Count): 1,320
    * Missing Values: 1 (0.08%)
    * Unique Values: 79 (5.99% of total)

**3.2.A. Numerical Column Analysis:**

**Descriptive Statistics:**
* Minimum: 20
* Maximum: 1111
* Range: 1091
* Sum: 103326
* Mean (Arithmetic): 78.336619
* Median (50th Percentile): 75.097791
* Mode(s): [60 (Frequency: 7.2%)]
* Standard Deviation: 51.610695
* Variance: 2663.663792
* Coefficient of Variation (CV): 0.6588%

**Quantile & Percentile Statistics:**
* 1st Percentile: 49.970556
* 5th Percentile: 57.931299
* 10th Percentile: 59.997888
* 25th Percentile (Q1 - First Quartile): 62.977447
* 75th Percentile (Q3 - Third Quartile): 85.445341
* 90th Percentile: 95.995883
* 95th Percentile: 104.108611
* 99th Percentile: 125.252999
* Interquartile Range (IQR = Q3 - Q1): 22.467894
* Median Absolute Deviation (MAD): 12.902209

**Distribution Shape & Normality Assessment:**
* Skewness: 18.227 (Right-skewed (positive skew))
* Kurtosis (Excess): 361.5757 (Leptokurtic (heavy tails))
* Histogram Analysis: Distribution spans 10 bins
* Normality Tests:
    * Shapiro-Wilk Test: W-statistic = 18.280059, p-value = 0.5 (Data consistent with normal distribution (p > 0.05))
    * Jarque-Bera Test: JB-statistic = 4.750105, p-value = 0.2 (Data consistent with normal distribution (p > 0.05))
    * Kolmogorov-Smirnov Test: D-statistic = 0.142663, p-value = 0.05 (Data significantly deviates from normal distribution (p ≤ 0.05))

**Univariate Outlier Analysis:**
* Method 1: IQR Proximity Rule
    * Lower Fence (Q1 - 1.5 * IQR): 29.275605
    * Upper Fence (Q3 + 1.5 * IQR): 119.147182
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
* Summary of Outliers: Total 1 (1%). Min Outlier Value: 120, Max Outlier Value: 120.
* Potential Impact: Low outlier impact

**Specific Numerical Patterns & Characteristics:**
* Percentage of Zero Values: 0%
* Percentage of Negative Values: 0%
* Round Numbers Analysis: High proportion of round numbers suggests potential data rounding
* Potential for Log Transformation: Log transformation may not be beneficial

---
**Column: `Systolic blood pressure`**
* **Detected Data Type:** numerical_integer
* **Inferred Semantic Type:** unknown
* **Data Quality Flag:** Good
* **Quick Stats:**
    * Total Values (Count): 1,320
    * Missing Values: 1 (0.08%)
    * Unique Values: 82 (6.22% of total)

**3.2.A. Numerical Column Analysis:**

**Descriptive Statistics:**
* Minimum: 42
* Maximum: 223
* Range: 181
* Sum: 167738
* Mean (Arithmetic): 127.170584
* Median (50th Percentile): 123.970257
* Mode(s): [150 (Frequency: 3.79%)]
* Standard Deviation: 26.112816
* Variance: 681.879165
* Coefficient of Variation (CV): 0.2053%

**Quantile & Percentile Statistics:**
* 1st Percentile: 75.944151
* 5th Percentile: 90.956401
* 10th Percentile: 95.175811
* 25th Percentile (Q1 - First Quartile): 107.935898
* 75th Percentile (Q3 - Third Quartile): 144.024779
* 90th Percentile: 159.36749
* 95th Percentile: 170.636077
* 99th Percentile: 207.605529
* Interquartile Range (IQR = Q3 - Q1): 36.088881
* Median Absolute Deviation (MAD): 17.029743

**Distribution Shape & Normality Assessment:**
* Skewness: 0.6845 (Right-skewed (positive skew))
* Kurtosis (Excess): 0.9438 (Leptokurtic (heavy tails))
* Histogram Analysis: Distribution spans 10 bins
* Normality Tests:
    * Shapiro-Wilk Test: W-statistic = 15.679004, p-value = 0.5 (Data consistent with normal distribution (p > 0.05))
    * Jarque-Bera Test: JB-statistic = 6.855779, p-value = 0.05 (Data significantly deviates from normal distribution (p ≤ 0.05))
    * Kolmogorov-Smirnov Test: D-statistic = 0.061036, p-value = 0.2 (Data consistent with normal distribution (p > 0.05))

**Univariate Outlier Analysis:**
* Method 1: IQR Proximity Rule
    * Lower Fence (Q1 - 1.5 * IQR): 53.802576
    * Upper Fence (Q3 + 1.5 * IQR): 198.1581
    * Number of Outliers (Below Lower): 0 (0%)
    * Number of Outliers (Above Upper): 2 (2%)
    * Extreme Outliers (using 3.0 * IQR factor): 0 (0%)
* Method 2: Z-Score Method
    * Standard Deviations from Mean for Threshold: +/- 3
    * Number of Outliers (Z-score < -3): 0
    * Number of Outliers (Z-score > +3): 2
* Method 3: Modified Z-Score (using MAD)
    * Threshold: +/- 3.5
    * Number of Outliers: 1
* Summary of Outliers: Total 2 (2%). Min Outlier Value: 208, Max Outlier Value: 220.
* Potential Impact: Low outlier impact

**Specific Numerical Patterns & Characteristics:**
* Percentage of Zero Values: 0%
* Percentage of Negative Values: 0%
* Round Numbers Analysis: High proportion of round numbers suggests potential data rounding
* Potential for Log Transformation: Log transformation may not be beneficial

---
**Column: `Diastolic blood pressure`**
* **Detected Data Type:** numerical_integer
* **Inferred Semantic Type:** unknown
* **Data Quality Flag:** Good
* **Quick Stats:**
    * Total Values (Count): 1,320
    * Missing Values: 1 (0.08%)
    * Unique Values: 73 (5.53% of total)

**3.2.A. Numerical Column Analysis:**

**Descriptive Statistics:**
* Minimum: 38
* Maximum: 154
* Range: 116
* Sum: 95323
* Mean (Arithmetic): 72.269143
* Median (50th Percentile): 71.954841
* Mode(s): [75 (Frequency: 5.23%)]
* Standard Deviation: 14.028603
* Variance: 196.801709
* Coefficient of Variation (CV): 0.1941%

**Quantile & Percentile Statistics:**
* 1st Percentile: 44.646482
* 5th Percentile: 51.708103
* 10th Percentile: 54.996595
* 25th Percentile (Q1 - First Quartile): 61.81454
* 75th Percentile (Q3 - Third Quartile): 80.598062
* 90th Percentile: 89.898013
* 95th Percentile: 97.254436
* 99th Percentile: 106.825499
* Interquartile Range (IQR = Q3 - Q1): 18.783522
* Median Absolute Deviation (MAD): 10.954841

**Distribution Shape & Normality Assessment:**
* Skewness: 0.4886 (Approximately symmetric)
* Kurtosis (Excess): 0.8575 (Leptokurtic (heavy tails))
* Histogram Analysis: Distribution spans 10 bins
* Normality Tests:
    * Shapiro-Wilk Test: W-statistic = 17.1312, p-value = 0.5 (Data consistent with normal distribution (p > 0.05))
    * Jarque-Bera Test: JB-statistic = 2.988185, p-value = 0.2 (Data consistent with normal distribution (p > 0.05))
    * Kolmogorov-Smirnov Test: D-statistic = 0.099024, p-value = 0.2 (Data consistent with normal distribution (p > 0.05))

**Univariate Outlier Analysis:**
* Method 1: IQR Proximity Rule
    * Lower Fence (Q1 - 1.5 * IQR): 33.639256
    * Upper Fence (Q3 + 1.5 * IQR): 108.773345
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
**Column: `Blood sugar`**
* **Detected Data Type:** numerical_integer
* **Inferred Semantic Type:** unknown
* **Data Quality Flag:** Good
* **Quick Stats:**
    * Total Values (Count): 1,320
    * Missing Values: 1 (0.08%)
    * Unique Values: 92 (6.97% of total)

**3.2.A. Numerical Column Analysis:**

**Descriptive Statistics:**
* Minimum: 35
* Maximum: 541
* Range: 506
* Sum: 193410.7
* Mean (Arithmetic): 146.634344
* Median (50th Percentile): 117.582283
* Mode(s): [100 (Frequency: 3.11%)]
* Standard Deviation: 74.894638
* Variance: 5609.206773
* Coefficient of Variation (CV): 0.5108%

**Quantile & Percentile Statistics:**
* 1st Percentile: 65.338027
* 5th Percentile: 82.300206
* 10th Percentile: 88.872739
* 25th Percentile (Q1 - First Quartile): 97.85843
* 75th Percentile (Q3 - Third Quartile): 166.383557
* 90th Percentile: 263.412274
* 95th Percentile: 307.074401
* 99th Percentile: 415.082643
* Interquartile Range (IQR = Q3 - Q1): 68.525127
* Median Absolute Deviation (MAD): 27.582283

**Distribution Shape & Normality Assessment:**
* Skewness: 1.9313 (Right-skewed (positive skew))
* Kurtosis (Excess): 4.1003 (Leptokurtic (heavy tails))
* Histogram Analysis: Distribution spans 10 bins
* Normality Tests:
    * Shapiro-Wilk Test: W-statistic = 12.655071, p-value = 0.5 (Data consistent with normal distribution (p > 0.05))
    * Jarque-Bera Test: JB-statistic = 64.225511, p-value = 0.001 (Data significantly deviates from normal distribution (p ≤ 0.05))
    * Kolmogorov-Smirnov Test: D-statistic = 0.165164, p-value = 0.01 (Data significantly deviates from normal distribution (p ≤ 0.05))

**Univariate Outlier Analysis:**
* Method 1: IQR Proximity Rule
    * Lower Fence (Q1 - 1.5 * IQR): -4.929261
    * Upper Fence (Q3 + 1.5 * IQR): 269.171248
    * Number of Outliers (Below Lower): 0 (0%)
    * Number of Outliers (Above Upper): 8 (8%)
    * Extreme Outliers (using 3.0 * IQR factor): 2 (2%)
* Method 2: Z-Score Method
    * Standard Deviations from Mean for Threshold: +/- 3
    * Number of Outliers (Z-score < -3): 0
    * Number of Outliers (Z-score > +3): 2
* Method 3: Modified Z-Score (using MAD)
    * Threshold: +/- 3.5
    * Number of Outliers: 11
* Summary of Outliers: Total 11 (11%). Min Outlier Value: 263, Max Outlier Value: 443.
* Potential Impact: High outlier presence may affect analysis

**Specific Numerical Patterns & Characteristics:**
* Percentage of Zero Values: 0%
* Percentage of Negative Values: 0%
* Round Numbers Analysis: Moderate rounding detected
* Potential for Log Transformation: Log transformation may not be beneficial

---
**Column: `CK-MB`**
* **Detected Data Type:** numerical_float
* **Inferred Semantic Type:** unknown
* **Data Quality Flag:** Good
* **Quick Stats:**
    * Total Values (Count): 1,320
    * Missing Values: 1 (0.08%)
    * Unique Values: 96 (7.28% of total)

**3.2.A. Numerical Column Analysis:**

**Descriptive Statistics:**
* Minimum: 0.321
* Maximum: 300
* Range: 299.679
* Sum: 20146.809
* Mean (Arithmetic): 15.274306
* Median (50th Percentile): 2.801123
* Mode(s): [300 (Frequency: 1.44%)]
* Standard Deviation: 46.309519
* Variance: 2144.57151
* Coefficient of Variation (CV): 3.0319%

**Quantile & Percentile Statistics:**
* 1st Percentile: 0.523431
* 5th Percentile: 0.859314
* 10th Percentile: 1.136726
* 25th Percentile (Q1 - First Quartile): 1.660224
* 75th Percentile (Q3 - Third Quartile): 6.478777
* 90th Percentile: 29.480823
* 95th Percentile: 74.651186
* 99th Percentile: 297.90587
* Interquartile Range (IQR = Q3 - Q1): 4.818553
* Median Absolute Deviation (MAD): 1.471123

**Distribution Shape & Normality Assessment:**
* Skewness: 4.9724 (Right-skewed (positive skew))
* Kurtosis (Excess): 25.3895 (Leptokurtic (heavy tails))
* Histogram Analysis: Distribution spans 10 bins
* Normality Tests:
    * Shapiro-Wilk Test: W-statistic = 2.179536, p-value = 0.5 (Data consistent with normal distribution (p > 0.05))
    * Jarque-Bera Test: JB-statistic = 1073.265311, p-value = 0.001 (Data significantly deviates from normal distribution (p ≤ 0.05))
    * Kolmogorov-Smirnov Test: D-statistic = 0.407232, p-value = 0.01 (Data significantly deviates from normal distribution (p ≤ 0.05))

**Univariate Outlier Analysis:**
* Method 1: IQR Proximity Rule
    * Lower Fence (Q1 - 1.5 * IQR): -5.567606
    * Upper Fence (Q3 + 1.5 * IQR): 13.706608
    * Number of Outliers (Below Lower): 0 (0%)
    * Number of Outliers (Above Upper): 7 (7%)
    * Extreme Outliers (using 3.0 * IQR factor): 10 (10%)
* Method 2: Z-Score Method
    * Standard Deviations from Mean for Threshold: +/- 3
    * Number of Outliers (Z-score < -3): 0
    * Number of Outliers (Z-score > +3): 5
* Method 3: Modified Z-Score (using MAD)
    * Threshold: +/- 3.5
    * Number of Outliers: 21
* Summary of Outliers: Total 18 (18%). Min Outlier Value: 10.75, Max Outlier Value: 300.
* Potential Impact: High outlier presence may affect analysis

**Specific Numerical Patterns & Characteristics:**
* Percentage of Zero Values: 0%
* Percentage of Negative Values: 0%
* Round Numbers Analysis: No significant rounding detected
* Potential for Log Transformation: Log transformation may not be beneficial

---
**Column: `Troponin`**
* **Detected Data Type:** numerical_float
* **Inferred Semantic Type:** unknown
* **Data Quality Flag:** Good
* **Quick Stats:**
    * Total Values (Count): 1,320
    * Missing Values: 1 (0.08%)
    * Unique Values: 95 (7.2% of total)

**3.2.A. Numerical Column Analysis:**

**Descriptive Statistics:**
* Minimum: 0.001
* Maximum: 10.3
* Range: 10.299000000000001
* Sum: 476.083
* Mean (Arithmetic): 0.360942
* Median (50th Percentile): 0.015212
* Mode(s): [0.003 (Frequency: 14.4%)]
* Standard Deviation: 1.15413
* Variance: 1.332016
* Coefficient of Variation (CV): 3.1975%

**Quantile & Percentile Statistics:**
* 1st Percentile: 0.003
* 5th Percentile: 0.003
* 10th Percentile: 0.003006
* 25th Percentile (Q1 - First Quartile): 0.005861
* 75th Percentile (Q3 - Third Quartile): 0.070371
* 90th Percentile: 1.084965
* 95th Percentile: 1.798872
* 99th Percentile: 5.997958
* Interquartile Range (IQR = Q3 - Q1): 0.06451
* Median Absolute Deviation (MAD): 0.012212

**Distribution Shape & Normality Assessment:**
* Skewness: 5.7925 (Right-skewed (positive skew))
* Kurtosis (Excess): 39.8605 (Leptokurtic (heavy tails))
* Histogram Analysis: Distribution spans 10 bins
* Normality Tests:
    * Shapiro-Wilk Test: W-statistic = 3.459524, p-value = 0.5 (Data consistent with normal distribution (p > 0.05))
    * Jarque-Bera Test: JB-statistic = 908.753619, p-value = 0.001 (Data significantly deviates from normal distribution (p ≤ 0.05))
    * Kolmogorov-Smirnov Test: D-statistic = 0.384849, p-value = 0.01 (Data significantly deviates from normal distribution (p ≤ 0.05))

**Univariate Outlier Analysis:**
* Method 1: IQR Proximity Rule
    * Lower Fence (Q1 - 1.5 * IQR): -0.090904
    * Upper Fence (Q3 + 1.5 * IQR): 0.167136
    * Number of Outliers (Below Lower): 0 (0%)
    * Number of Outliers (Above Upper): 2 (2%)
    * Extreme Outliers (using 3.0 * IQR factor): 19 (19%)
* Method 2: Z-Score Method
    * Standard Deviations from Mean for Threshold: +/- 3
    * Number of Outliers (Z-score < -3): 0
    * Number of Outliers (Z-score > +3): 2
* Method 3: Modified Z-Score (using MAD)
    * Threshold: +/- 3.5
    * Number of Outliers: 24
* Summary of Outliers: Total 24 (24%). Min Outlier Value: 0.103, Max Outlier Value: 5.37.
* Potential Impact: High outlier presence may affect analysis

**Specific Numerical Patterns & Characteristics:**
* Percentage of Zero Values: 0%
* Percentage of Negative Values: 0%
* Round Numbers Analysis: No significant rounding detected
* Potential for Log Transformation: Log transformation may not be beneficial

---
**Column: `Result`**
* **Detected Data Type:** categorical
* **Inferred Semantic Type:** category
* **Data Quality Flag:** Good
* **Quick Stats:**
    * Total Values (Count): 1,320
    * Missing Values: 0 (0%)
    * Unique Values: 3 (0.23% of total)

**3.2.B. Categorical Column Analysis:**

**Frequency & Proportionality:**
* Number of Unique Categories: 3
* Mode (Most Frequent Category): `positive` (Frequency: 810, 61.36%)
* Second Most Frequent Category: `negative` (Frequency: 509, 38.56%)
* Least Frequent Category: `Result` (Frequency: 1, 0.08%)
* Frequency Distribution Table (Top 10):

| Category Label | Count | Percentage (%) | Cumulative % |
|----------------|-------|----------------|--------------|
| positive | 810 | 61.36% | 61.36% |
| negative | 509 | 38.56% | 99.92% |
| Result | 1 | 0.08% | 100% |

**Diversity & Balance:**
* Shannon Entropy: 0.9703 (Range: 0 to 1.585)
* Gini Impurity: 0.4748
* Interpretation of Balance: Unbalanced distribution
* Major Category Dominance: Major category present

**Category Label Analysis:**
* Minimum Label Length: 6 characters
* Maximum Label Length: 8 characters
* Average Label Length: 8 characters
* Empty String or Null-like Labels: 0 occurrences

**Potential Issues & Recommendations:**


* No significant issues detected.

**3.3. Bivariate Analysis (Exploring Relationships Between Pairs of Variables):**

**Numerical vs. Numerical:**
    * **Correlation Matrix Summary (Pearson's r):**
        * Total Pairs Analysed: 21
        * Top 5 Strongest Positive Correlations:
        1. `Age` vs `Heart rate`: r = 1 (Correlation significantly different from zero (p ≤ 0.05)) - Very Strong positive correlation (Correlation significantly different from zero (p ≤ 0.05)).
        2. `Age` vs `Systolic blood pressure`: r = 1 (Correlation significantly different from zero (p ≤ 0.05)) - Very Strong positive correlation (Correlation significantly different from zero (p ≤ 0.05)).
        3. `Age` vs `Diastolic blood pressure`: r = 1 (Correlation significantly different from zero (p ≤ 0.05)) - Very Strong positive correlation (Correlation significantly different from zero (p ≤ 0.05)).
        4. `Age` vs `Blood sugar`: r = 1 (Correlation significantly different from zero (p ≤ 0.05)) - Very Strong positive correlation (Correlation significantly different from zero (p ≤ 0.05)).
        5. `Age` vs `CK-MB`: r = 1 (Correlation significantly different from zero (p ≤ 0.05)) - Very Strong positive correlation (Correlation significantly different from zero (p ≤ 0.05)).
        * Top 5 Strongest Negative Correlations:
        No strong negative correlations found.
        * Strong Correlations (|r| > 0.5): 21 pairs identified
    * **Scatter Plot Insights (Key Relationships):**
        * `Age` vs `Heart rate`: "50 point sample shows linear relationship" (Recommended: Scatter plot with trend line)
        * `Age` vs `Systolic blood pressure`: "50 point sample shows linear relationship" (Recommended: Scatter plot with trend line)
        * `Age` vs `Diastolic blood pressure`: "50 point sample shows linear relationship" (Recommended: Scatter plot with trend line)

**Numerical vs. Categorical:**
    * **Comparative Statistics (Mean/Median by Category):**
    * **`Result` by `Age`:**
        | Category | Mean | Median | StdDev | Count |
        |----------|------|--------|--------|-------|
        | 64 | 0 | 0 | 0 | 21 |
        | 21 | 0 | 0 | 0 | 5 |
        | 55 | 0 | 0 | 0 | 60 |
        | 58 | 0 | 0 | 0 | 34 |
        | 32 | 0 | 0 | 0 | 8 |
        * **Statistical Tests:** ANOVA F-statistic = 1.5, p-value = 0.2 (No significant difference between groups)
        * **Summary:** 64 has highest mean (0.00), 84 has lowest (0.00)

    * **`Result` by `Heart rate`:**
        | Category | Mean | Median | StdDev | Count |
        |----------|------|--------|--------|-------|
        | 64 | 0 | 0 | 0 | 21 |
        | 21 | 0 | 0 | 0 | 5 |
        | 55 | 0 | 0 | 0 | 60 |
        | 58 | 0 | 0 | 0 | 34 |
        | 32 | 0 | 0 | 0 | 8 |
        * **Statistical Tests:** ANOVA F-statistic = 1.5, p-value = 0.2 (No significant difference between groups)
        * **Summary:** 64 has highest mean (0.00), 84 has lowest (0.00)

    * **`Result` by `Systolic blood pressure`:**
        | Category | Mean | Median | StdDev | Count |
        |----------|------|--------|--------|-------|
        | 64 | 0 | 0 | 0 | 21 |
        | 21 | 0 | 0 | 0 | 5 |
        | 55 | 0 | 0 | 0 | 60 |
        | 58 | 0 | 0 | 0 | 34 |
        | 32 | 0 | 0 | 0 | 8 |
        * **Statistical Tests:** ANOVA F-statistic = 1.5, p-value = 0.2 (No significant difference between groups)
        * **Summary:** 64 has highest mean (0.00), 84 has lowest (0.00)

**3.4. Multivariate Analysis (Preliminary Insights into Complex Interactions):**
    * **Principal Component Analysis:** Not applicable - insufficient numerical variables.

    * **Cluster Analysis:** Not performed - data characteristics not suitable for clustering.

    * **Feature Interactions:** No significant interactions detected.

**3.5. Specific Analysis Modules (Activated Based on Data Characteristics):**

    * **No Specific Modules Activated:** Dataset does not contain sufficient datetime or rich text columns for specialized analysis modules.

**3.6. EDA Summary & Key Hypotheses/Insights:**
    * **Top Statistical Findings:**
    1. Streaming analysis processed 1,320 rows using only 17MB peak memory
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
* **Processing Time:** 40ms (0.04 seconds)
* **Rows Analysed:** 1,320
* **Memory Efficiency:** Constant ~17MB usage
* **Analysis Method:** Streaming with online algorithms
* **Dataset Size:** 1,320 records across 9 columns

---

🤖 DATAPILOT COMPLETE ANALYSIS ENGINE
======================================
Analysis Target: Medicaldataset.csv
Report Generated: 2025-06-06 03:12:37 (UTC)
DataPilot Version: v1.0.0 (TypeScript Edition)

---
### Section 1: Comprehensive Dataset & Analysis Overview
This section provides a detailed snapshot of the dataset properties, how it was processed, and the context of this analysis run.

**1.1. Input Data File Details:**
    * Original Filename: `Medicaldataset.csv`
    * Full Resolved Path: `/Users/[user]/plum/test-datasets/kaggle/Medicaldataset.csv`
    * File Size (on disk): 0.04993 MB
    * MIME Type (detected/inferred): `text/csv`
    * File Last Modified (OS Timestamp): 2025-06-05 11:34:05 (UTC)
    * File Hash (SHA256): `ba28e4585e736fff12f0232c9d139f944e374c2c29c32594b3c6bae44b6348e0`

**1.2. Data Ingestion & Parsing Parameters:**
    * Data Source Type: Local File System
    * Parsing Engine Utilized: DataPilot Advanced CSV Parser v1.0.0
    * Time Taken for Parsing & Initial Load: 0.005 seconds
    * Detected Character Encoding: `utf8`
        * Encoding Detection Method: Statistical Character Pattern Analysis
        * Encoding Confidence: High (90%)
    * Detected Delimiter Character: `,` (Comma)
        * Delimiter Detection Method: Character Frequency Analysis with Field Consistency Scoring
        * Delimiter Confidence: High (100%)
    * Detected Line Ending Format: `CRLF (Windows-style)`
    * Detected Quoting Character: `"`
        * Empty Lines Encountered: 1
    * Header Row Processing:
        * Header Presence: Detected
        * Header Row Number(s): 1
        * Column Names Derived From: First row interpreted as column headers
    * Byte Order Mark (BOM): Not Detected
    * Initial Row/Line Scan Limit for Detection: First 52355 bytes or 1000 lines

**1.3. Dataset Structural Dimensions & Initial Profile:**
    * Total Rows Read (including header, if any): 1,320
    * Total Rows of Data (excluding header): 1,319
    * Total Columns Detected: 9
    * Total Data Cells (Data Rows × Columns): 11,871
    * List of Column Names (9) and Original Index:
        1.  (Index 0) `Age`
        2.  (Index 1) `Gender`
        3.  (Index 2) `Heart rate`
        4.  (Index 3) `Systolic blood pressure`
        5.  (Index 4) `Diastolic blood pressure`
        6.  (Index 5) `Blood sugar`
        7.  (Index 6) `CK-MB`
        8.  (Index 7) `Troponin`
        9.  (Index 8) `Result`
    * Estimated In-Memory Size (Post-Parsing & Initial Type Guessing): 0.48 MB
    * Average Row Length (bytes, approximate): 39 bytes
    * Dataset Sparsity (Initial Estimate): Dense dataset with minimal missing values (0% sparse cells via Full dataset analysis)

**1.4. Analysis Configuration & Execution Context:**
    * Full Command Executed: `datapilot overview /Users/massimoraso/plum/test-datasets/kaggle/Medicaldataset.csv`
    * Analysis Mode Invoked: Comprehensive Deep Scan
    * Timestamp of Analysis Start: 2025-06-06 03:12:37 (UTC)
    * Global Dataset Sampling Strategy: Full dataset analysis (No record sampling applied for initial overview)
    * DataPilot Modules Activated for this Run: File I/O Manager, Advanced CSV Parser, Metadata Collector, Structural Analyzer, Report Generator
    * Processing Time for Section 1 Generation: 0.007 seconds
    * Host Environment Details:
        * Operating System: macOS (Unknown Version)
        * System Architecture: ARM64 (Apple Silicon/ARM 64-bit)
        * Execution Runtime: Node.js v23.6.1 (V8 12.9.202.28-node.12) on darwin
        * Available CPU Cores / Memory (at start of analysis): 8 cores / 8 GB

---
### Performance Metrics

**Processing Performance:**
    * Total Analysis Time: 0.007 seconds
    * File analysis: 0.002s
    * Parsing: 0.005s
    * Structural analysis: 0s

---

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
**Column: `Age`**
* **Detected Data Type:** numerical_integer
* **Inferred Semantic Type:** age
* **Data Quality Flag:** Good
* **Quick Stats:**
    * Total Values (Count): 1,320
    * Missing Values: 1 (0.08%)
    * Unique Values: 75 (5.69% of total)

**3.2.A. Numerical Column Analysis:**

**Descriptive Statistics:**
* Minimum: 14
* Maximum: 103
* Range: 89
* Sum: 74117
* Mean (Arithmetic): 56.191812
* Median (50th Percentile): 58.953237
* Mode(s): [60 (Frequency: 8.04%)]
* Standard Deviation: 13.642141
* Variance: 186.108015
* Coefficient of Variation (CV): 0.2428%

**Quantile & Percentile Statistics:**
* 1st Percentile: 23.011982
* 5th Percentile: 32.034872
* 10th Percentile: 39.107052
* 25th Percentile (Q1 - First Quartile): 48.469978
* 75th Percentile (Q3 - Third Quartile): 65.084299
* 90th Percentile: 72.927528
* 95th Percentile: 75.962455
* 99th Percentile: 87.818773
* Interquartile Range (IQR = Q3 - Q1): 16.614321
* Median Absolute Deviation (MAD): 8.953237

**Distribution Shape & Normality Assessment:**
* Skewness: -0.2389 (Approximately symmetric)
* Kurtosis (Excess): -0.0284 (Mesokurtic (normal-like tails))
* Histogram Analysis: Distribution spans 10 bins
* Normality Tests:
    * Shapiro-Wilk Test: W-statistic = 15.462689, p-value = 0.5 (Data consistent with normal distribution (p > 0.05))
    * Jarque-Bera Test: JB-statistic = 2.557652, p-value = 0.2 (Data consistent with normal distribution (p > 0.05))
    * Kolmogorov-Smirnov Test: D-statistic = 0.068683, p-value = 0.2 (Data consistent with normal distribution (p > 0.05))

**Univariate Outlier Analysis:**
* Method 1: IQR Proximity Rule
    * Lower Fence (Q1 - 1.5 * IQR): 23.548496
    * Upper Fence (Q3 + 1.5 * IQR): 90.005781
    * Number of Outliers (Below Lower): 1 (1%)
    * Number of Outliers (Above Upper): 0 (0%)
    * Extreme Outliers (using 3.0 * IQR factor): 0 (0%)
* Method 2: Z-Score Method
    * Standard Deviations from Mean for Threshold: +/- 3
    * Number of Outliers (Z-score < -3): 0
    * Number of Outliers (Z-score > +3): 0
* Method 3: Modified Z-Score (using MAD)
    * Threshold: +/- 3.5
    * Number of Outliers: 0
* Summary of Outliers: Total 1 (1%). Min Outlier Value: 21, Max Outlier Value: 21.
* Potential Impact: Low outlier impact

**Specific Numerical Patterns & Characteristics:**
* Percentage of Zero Values: 0%
* Percentage of Negative Values: 0%
* Round Numbers Analysis: High proportion of round numbers suggests potential data rounding
* Potential for Log Transformation: Log transformation may not be beneficial

---
**Column: `Gender`**
* **Detected Data Type:** boolean
* **Inferred Semantic Type:** status
* **Data Quality Flag:** Good
* **Quick Stats:**
    * Total Values (Count): 1,320
    * Missing Values: 1 (0.08%)
    * Unique Values: 2 (0.15% of total)

**3.2.D. Boolean Column Analysis:**

**Frequency Distribution:**
* Count of True: 870 (65.96%)
* Count of False: 449 (34.04%)
* Interpretation: Balanced distribution

---
**Column: `Heart rate`**
* **Detected Data Type:** numerical_integer
* **Inferred Semantic Type:** unknown
* **Data Quality Flag:** Good
* **Quick Stats:**
    * Total Values (Count): 1,320
    * Missing Values: 1 (0.08%)
    * Unique Values: 79 (5.99% of total)

**3.2.A. Numerical Column Analysis:**

**Descriptive Statistics:**
* Minimum: 20
* Maximum: 1111
* Range: 1091
* Sum: 103326
* Mean (Arithmetic): 78.336619
* Median (50th Percentile): 75.097791
* Mode(s): [60 (Frequency: 7.2%)]
* Standard Deviation: 51.610695
* Variance: 2663.663792
* Coefficient of Variation (CV): 0.6588%

**Quantile & Percentile Statistics:**
* 1st Percentile: 49.970556
* 5th Percentile: 57.931299
* 10th Percentile: 59.997888
* 25th Percentile (Q1 - First Quartile): 62.977447
* 75th Percentile (Q3 - Third Quartile): 85.445341
* 90th Percentile: 95.995883
* 95th Percentile: 104.108611
* 99th Percentile: 125.252999
* Interquartile Range (IQR = Q3 - Q1): 22.467894
* Median Absolute Deviation (MAD): 11.097791

**Distribution Shape & Normality Assessment:**
* Skewness: 18.227 (Right-skewed (positive skew))
* Kurtosis (Excess): 361.5757 (Leptokurtic (heavy tails))
* Histogram Analysis: Distribution spans 10 bins
* Normality Tests:
    * Shapiro-Wilk Test: W-statistic = 16.87467, p-value = 0.5 (Data consistent with normal distribution (p > 0.05))
    * Jarque-Bera Test: JB-statistic = 2.327381, p-value = 0.2 (Data consistent with normal distribution (p > 0.05))
    * Kolmogorov-Smirnov Test: D-statistic = 0.083287, p-value = 0.2 (Data consistent with normal distribution (p > 0.05))

**Univariate Outlier Analysis:**
* Method 1: IQR Proximity Rule
    * Lower Fence (Q1 - 1.5 * IQR): 29.275605
    * Upper Fence (Q3 + 1.5 * IQR): 119.147182
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
**Column: `Systolic blood pressure`**
* **Detected Data Type:** numerical_integer
* **Inferred Semantic Type:** unknown
* **Data Quality Flag:** Good
* **Quick Stats:**
    * Total Values (Count): 1,320
    * Missing Values: 1 (0.08%)
    * Unique Values: 82 (6.22% of total)

**3.2.A. Numerical Column Analysis:**

**Descriptive Statistics:**
* Minimum: 42
* Maximum: 223
* Range: 181
* Sum: 167738
* Mean (Arithmetic): 127.170584
* Median (50th Percentile): 123.970257
* Mode(s): [150 (Frequency: 3.79%)]
* Standard Deviation: 26.112816
* Variance: 681.879165
* Coefficient of Variation (CV): 0.2053%

**Quantile & Percentile Statistics:**
* 1st Percentile: 75.944151
* 5th Percentile: 90.956401
* 10th Percentile: 95.175811
* 25th Percentile (Q1 - First Quartile): 107.935898
* 75th Percentile (Q3 - Third Quartile): 144.024779
* 90th Percentile: 159.36749
* 95th Percentile: 170.636077
* 99th Percentile: 207.605529
* Interquartile Range (IQR = Q3 - Q1): 36.088881
* Median Absolute Deviation (MAD): 17.970257

**Distribution Shape & Normality Assessment:**
* Skewness: 0.6845 (Right-skewed (positive skew))
* Kurtosis (Excess): 0.9438 (Leptokurtic (heavy tails))
* Histogram Analysis: Distribution spans 10 bins
* Normality Tests:
    * Shapiro-Wilk Test: W-statistic = 15.163261, p-value = 0.5 (Data consistent with normal distribution (p > 0.05))
    * Jarque-Bera Test: JB-statistic = 11.907366, p-value = 0.01 (Data significantly deviates from normal distribution (p ≤ 0.05))
    * Kolmogorov-Smirnov Test: D-statistic = 0.073001, p-value = 0.2 (Data consistent with normal distribution (p > 0.05))

**Univariate Outlier Analysis:**
* Method 1: IQR Proximity Rule
    * Lower Fence (Q1 - 1.5 * IQR): 53.802576
    * Upper Fence (Q3 + 1.5 * IQR): 198.1581
    * Number of Outliers (Below Lower): 0 (0%)
    * Number of Outliers (Above Upper): 3 (3%)
    * Extreme Outliers (using 3.0 * IQR factor): 0 (0%)
* Method 2: Z-Score Method
    * Standard Deviations from Mean for Threshold: +/- 3
    * Number of Outliers (Z-score < -3): 0
    * Number of Outliers (Z-score > +3): 2
* Method 3: Modified Z-Score (using MAD)
    * Threshold: +/- 3.5
    * Number of Outliers: 1
* Summary of Outliers: Total 3 (3%). Min Outlier Value: 199, Max Outlier Value: 223.
* Potential Impact: Low outlier impact

**Specific Numerical Patterns & Characteristics:**
* Percentage of Zero Values: 0%
* Percentage of Negative Values: 0%
* Round Numbers Analysis: Moderate rounding detected
* Potential for Log Transformation: Log transformation may not be beneficial

---
**Column: `Diastolic blood pressure`**
* **Detected Data Type:** numerical_integer
* **Inferred Semantic Type:** unknown
* **Data Quality Flag:** Good
* **Quick Stats:**
    * Total Values (Count): 1,320
    * Missing Values: 1 (0.08%)
    * Unique Values: 73 (5.53% of total)

**3.2.A. Numerical Column Analysis:**

**Descriptive Statistics:**
* Minimum: 38
* Maximum: 154
* Range: 116
* Sum: 95323
* Mean (Arithmetic): 72.269143
* Median (50th Percentile): 71.954841
* Mode(s): [75 (Frequency: 5.23%)]
* Standard Deviation: 14.028603
* Variance: 196.801709
* Coefficient of Variation (CV): 0.1941%

**Quantile & Percentile Statistics:**
* 1st Percentile: 44.646482
* 5th Percentile: 51.708103
* 10th Percentile: 54.996595
* 25th Percentile (Q1 - First Quartile): 61.81454
* 75th Percentile (Q3 - Third Quartile): 80.598062
* 90th Percentile: 89.898013
* 95th Percentile: 97.254436
* 99th Percentile: 106.825499
* Interquartile Range (IQR = Q3 - Q1): 18.783522
* Median Absolute Deviation (MAD): 9.045159

**Distribution Shape & Normality Assessment:**
* Skewness: 0.4886 (Approximately symmetric)
* Kurtosis (Excess): 0.8575 (Leptokurtic (heavy tails))
* Histogram Analysis: Distribution spans 10 bins
* Normality Tests:
    * Shapiro-Wilk Test: W-statistic = 15.258252, p-value = 0.5 (Data consistent with normal distribution (p > 0.05))
    * Jarque-Bera Test: JB-statistic = 13.611459, p-value = 0.01 (Data significantly deviates from normal distribution (p ≤ 0.05))
    * Kolmogorov-Smirnov Test: D-statistic = 0.06735, p-value = 0.2 (Data consistent with normal distribution (p > 0.05))

**Univariate Outlier Analysis:**
* Method 1: IQR Proximity Rule
    * Lower Fence (Q1 - 1.5 * IQR): 33.639256
    * Upper Fence (Q3 + 1.5 * IQR): 108.773345
    * Number of Outliers (Below Lower): 0 (0%)
    * Number of Outliers (Above Upper): 2 (2%)
    * Extreme Outliers (using 3.0 * IQR factor): 0 (0%)
* Method 2: Z-Score Method
    * Standard Deviations from Mean for Threshold: +/- 3
    * Number of Outliers (Z-score < -3): 0
    * Number of Outliers (Z-score > +3): 2
* Method 3: Modified Z-Score (using MAD)
    * Threshold: +/- 3.5
    * Number of Outliers: 1
* Summary of Outliers: Total 2 (2%). Min Outlier Value: 118, Max Outlier Value: 128.
* Potential Impact: Low outlier impact

**Specific Numerical Patterns & Characteristics:**
* Percentage of Zero Values: 0%
* Percentage of Negative Values: 0%
* Round Numbers Analysis: Moderate rounding detected
* Potential for Log Transformation: Log transformation may not be beneficial

---
**Column: `Blood sugar`**
* **Detected Data Type:** numerical_integer
* **Inferred Semantic Type:** unknown
* **Data Quality Flag:** Good
* **Quick Stats:**
    * Total Values (Count): 1,320
    * Missing Values: 1 (0.08%)
    * Unique Values: 92 (6.97% of total)

**3.2.A. Numerical Column Analysis:**

**Descriptive Statistics:**
* Minimum: 35
* Maximum: 541
* Range: 506
* Sum: 193410.7
* Mean (Arithmetic): 146.634344
* Median (50th Percentile): 117.582283
* Mode(s): [100 (Frequency: 3.11%)]
* Standard Deviation: 74.894638
* Variance: 5609.206773
* Coefficient of Variation (CV): 0.5108%

**Quantile & Percentile Statistics:**
* 1st Percentile: 65.338027
* 5th Percentile: 82.300206
* 10th Percentile: 88.872739
* 25th Percentile (Q1 - First Quartile): 97.85843
* 75th Percentile (Q3 - Third Quartile): 166.383557
* 90th Percentile: 263.412274
* 95th Percentile: 307.074401
* 99th Percentile: 415.082643
* Interquartile Range (IQR = Q3 - Q1): 68.525127
* Median Absolute Deviation (MAD): 24.582283

**Distribution Shape & Normality Assessment:**
* Skewness: 1.9313 (Right-skewed (positive skew))
* Kurtosis (Excess): 4.1003 (Leptokurtic (heavy tails))
* Histogram Analysis: Distribution spans 10 bins
* Normality Tests:
    * Shapiro-Wilk Test: W-statistic = 11.083688, p-value = 0.5 (Data consistent with normal distribution (p > 0.05))
    * Jarque-Bera Test: JB-statistic = 80.47488, p-value = 0.001 (Data significantly deviates from normal distribution (p ≤ 0.05))
    * Kolmogorov-Smirnov Test: D-statistic = 0.238067, p-value = 0.01 (Data significantly deviates from normal distribution (p ≤ 0.05))

**Univariate Outlier Analysis:**
* Method 1: IQR Proximity Rule
    * Lower Fence (Q1 - 1.5 * IQR): -4.929261
    * Upper Fence (Q3 + 1.5 * IQR): 269.171248
    * Number of Outliers (Below Lower): 0 (0%)
    * Number of Outliers (Above Upper): 10 (10%)
    * Extreme Outliers (using 3.0 * IQR factor): 2 (2%)
* Method 2: Z-Score Method
    * Standard Deviations from Mean for Threshold: +/- 3
    * Number of Outliers (Z-score < -3): 0
    * Number of Outliers (Z-score > +3): 2
* Method 3: Modified Z-Score (using MAD)
    * Threshold: +/- 3.5
    * Number of Outliers: 13
* Summary of Outliers: Total 13 (13%). Min Outlier Value: 269, Max Outlier Value: 462.
* Potential Impact: High outlier presence may affect analysis

**Specific Numerical Patterns & Characteristics:**
* Percentage of Zero Values: 0%
* Percentage of Negative Values: 0%
* Round Numbers Analysis: Moderate rounding detected
* Potential for Log Transformation: Log transformation may not be beneficial

---
**Column: `CK-MB`**
* **Detected Data Type:** numerical_float
* **Inferred Semantic Type:** unknown
* **Data Quality Flag:** Good
* **Quick Stats:**
    * Total Values (Count): 1,320
    * Missing Values: 1 (0.08%)
    * Unique Values: 96 (7.28% of total)

**3.2.A. Numerical Column Analysis:**

**Descriptive Statistics:**
* Minimum: 0.321
* Maximum: 300
* Range: 299.679
* Sum: 20146.809
* Mean (Arithmetic): 15.274306
* Median (50th Percentile): 2.801123
* Mode(s): [300 (Frequency: 1.44%)]
* Standard Deviation: 46.309519
* Variance: 2144.57151
* Coefficient of Variation (CV): 3.0319%

**Quantile & Percentile Statistics:**
* 1st Percentile: 0.523431
* 5th Percentile: 0.859314
* 10th Percentile: 1.136726
* 25th Percentile (Q1 - First Quartile): 1.660224
* 75th Percentile (Q3 - Third Quartile): 6.478777
* 90th Percentile: 29.480823
* 95th Percentile: 74.651186
* 99th Percentile: 297.90587
* Interquartile Range (IQR = Q3 - Q1): 4.818553
* Median Absolute Deviation (MAD): 1.471123

**Distribution Shape & Normality Assessment:**
* Skewness: 4.9724 (Right-skewed (positive skew))
* Kurtosis (Excess): 25.3895 (Leptokurtic (heavy tails))
* Histogram Analysis: Distribution spans 10 bins
* Normality Tests:
    * Shapiro-Wilk Test: W-statistic = 2.823069, p-value = 0.5 (Data consistent with normal distribution (p > 0.05))
    * Jarque-Bera Test: JB-statistic = 919.871497, p-value = 0.001 (Data significantly deviates from normal distribution (p ≤ 0.05))
    * Kolmogorov-Smirnov Test: D-statistic = 0.383773, p-value = 0.01 (Data significantly deviates from normal distribution (p ≤ 0.05))

**Univariate Outlier Analysis:**
* Method 1: IQR Proximity Rule
    * Lower Fence (Q1 - 1.5 * IQR): -5.567606
    * Upper Fence (Q3 + 1.5 * IQR): 13.706608
    * Number of Outliers (Below Lower): 0 (0%)
    * Number of Outliers (Above Upper): 3 (3%)
    * Extreme Outliers (using 3.0 * IQR factor): 16 (16%)
* Method 2: Z-Score Method
    * Standard Deviations from Mean for Threshold: +/- 3
    * Number of Outliers (Z-score < -3): 0
    * Number of Outliers (Z-score > +3): 6
* Method 3: Modified Z-Score (using MAD)
    * Threshold: +/- 3.5
    * Number of Outliers: 21
* Summary of Outliers: Total 19 (19%). Min Outlier Value: 11.64, Max Outlier Value: 300.
* Potential Impact: High outlier presence may affect analysis

**Specific Numerical Patterns & Characteristics:**
* Percentage of Zero Values: 0%
* Percentage of Negative Values: 0%
* Round Numbers Analysis: No significant rounding detected
* Potential for Log Transformation: Log transformation may not be beneficial

---
**Column: `Troponin`**
* **Detected Data Type:** numerical_float
* **Inferred Semantic Type:** unknown
* **Data Quality Flag:** Good
* **Quick Stats:**
    * Total Values (Count): 1,320
    * Missing Values: 1 (0.08%)
    * Unique Values: 95 (7.2% of total)

**3.2.A. Numerical Column Analysis:**

**Descriptive Statistics:**
* Minimum: 0.001
* Maximum: 10.3
* Range: 10.299000000000001
* Sum: 476.083
* Mean (Arithmetic): 0.360942
* Median (50th Percentile): 0.015212
* Mode(s): [0.003 (Frequency: 14.4%)]
* Standard Deviation: 1.15413
* Variance: 1.332016
* Coefficient of Variation (CV): 3.1975%

**Quantile & Percentile Statistics:**
* 1st Percentile: 0.003
* 5th Percentile: 0.003
* 10th Percentile: 0.003006
* 25th Percentile (Q1 - First Quartile): 0.005861
* 75th Percentile (Q3 - Third Quartile): 0.070371
* 90th Percentile: 1.084965
* 95th Percentile: 1.798872
* 99th Percentile: 5.997958
* Interquartile Range (IQR = Q3 - Q1): 0.06451
* Median Absolute Deviation (MAD): 0.011212

**Distribution Shape & Normality Assessment:**
* Skewness: 5.7925 (Right-skewed (positive skew))
* Kurtosis (Excess): 39.8605 (Leptokurtic (heavy tails))
* Histogram Analysis: Distribution spans 10 bins
* Normality Tests:
    * Shapiro-Wilk Test: W-statistic = 2.040291, p-value = 0.5 (Data consistent with normal distribution (p > 0.05))
    * Jarque-Bera Test: JB-statistic = 13127.638529, p-value = 0.001 (Data significantly deviates from normal distribution (p ≤ 0.05))
    * Kolmogorov-Smirnov Test: D-statistic = 0.389606, p-value = 0.01 (Data significantly deviates from normal distribution (p ≤ 0.05))

**Univariate Outlier Analysis:**
* Method 1: IQR Proximity Rule
    * Lower Fence (Q1 - 1.5 * IQR): -0.090904
    * Upper Fence (Q3 + 1.5 * IQR): 0.167136
    * Number of Outliers (Below Lower): 0 (0%)
    * Number of Outliers (Above Upper): 2 (2%)
    * Extreme Outliers (using 3.0 * IQR factor): 17 (17%)
* Method 2: Z-Score Method
    * Standard Deviations from Mean for Threshold: +/- 3
    * Number of Outliers (Z-score < -3): 0
    * Number of Outliers (Z-score > +3): 1
* Method 3: Modified Z-Score (using MAD)
    * Threshold: +/- 3.5
    * Number of Outliers: 26
* Summary of Outliers: Total 24 (24%). Min Outlier Value: 0.076, Max Outlier Value: 10.
* Potential Impact: High outlier presence may affect analysis

**Specific Numerical Patterns & Characteristics:**
* Percentage of Zero Values: 0%
* Percentage of Negative Values: 0%
* Round Numbers Analysis: No significant rounding detected
* Potential for Log Transformation: Log transformation may not be beneficial

---
**Column: `Result`**
* **Detected Data Type:** categorical
* **Inferred Semantic Type:** category
* **Data Quality Flag:** Good
* **Quick Stats:**
    * Total Values (Count): 1,320
    * Missing Values: 0 (0%)
    * Unique Values: 3 (0.23% of total)

**3.2.B. Categorical Column Analysis:**

**Frequency & Proportionality:**
* Number of Unique Categories: 3
* Mode (Most Frequent Category): `positive` (Frequency: 810, 61.36%)
* Second Most Frequent Category: `negative` (Frequency: 509, 38.56%)
* Least Frequent Category: `Result` (Frequency: 1, 0.08%)
* Frequency Distribution Table (Top 10):

| Category Label | Count | Percentage (%) | Cumulative % |
|----------------|-------|----------------|--------------|
| positive | 810 | 61.36% | 61.36% |
| negative | 509 | 38.56% | 99.92% |
| Result | 1 | 0.08% | 100% |

**Diversity & Balance:**
* Shannon Entropy: 0.9703 (Range: 0 to 1.585)
* Gini Impurity: 0.4748
* Interpretation of Balance: Unbalanced distribution
* Major Category Dominance: Major category present

**Category Label Analysis:**
* Minimum Label Length: 6 characters
* Maximum Label Length: 8 characters
* Average Label Length: 8 characters
* Empty String or Null-like Labels: 0 occurrences

**Potential Issues & Recommendations:**


* No significant issues detected.

**3.3. Bivariate Analysis (Exploring Relationships Between Pairs of Variables):**

**Numerical vs. Numerical:**
    * **Correlation Matrix Summary (Pearson's r):**
        * Total Pairs Analysed: 21
        * Top 5 Strongest Positive Correlations:
        1. `Age` vs `Heart rate`: r = 1 (Correlation significantly different from zero (p ≤ 0.05)) - Very Strong positive correlation (Correlation significantly different from zero (p ≤ 0.05)).
        2. `Age` vs `Systolic blood pressure`: r = 1 (Correlation significantly different from zero (p ≤ 0.05)) - Very Strong positive correlation (Correlation significantly different from zero (p ≤ 0.05)).
        3. `Age` vs `Diastolic blood pressure`: r = 1 (Correlation significantly different from zero (p ≤ 0.05)) - Very Strong positive correlation (Correlation significantly different from zero (p ≤ 0.05)).
        4. `Age` vs `Blood sugar`: r = 1 (Correlation significantly different from zero (p ≤ 0.05)) - Very Strong positive correlation (Correlation significantly different from zero (p ≤ 0.05)).
        5. `Age` vs `CK-MB`: r = 1 (Correlation significantly different from zero (p ≤ 0.05)) - Very Strong positive correlation (Correlation significantly different from zero (p ≤ 0.05)).
        * Top 5 Strongest Negative Correlations:
        No strong negative correlations found.
        * Strong Correlations (|r| > 0.5): 21 pairs identified
    * **Scatter Plot Insights (Key Relationships):**
        * `Age` vs `Heart rate`: "50 point sample shows linear relationship" (Recommended: Scatter plot with trend line)
        * `Age` vs `Systolic blood pressure`: "50 point sample shows linear relationship" (Recommended: Scatter plot with trend line)
        * `Age` vs `Diastolic blood pressure`: "50 point sample shows linear relationship" (Recommended: Scatter plot with trend line)

**Numerical vs. Categorical:**
    * **Comparative Statistics (Mean/Median by Category):**
    * **`Result` by `Age`:**
        | Category | Mean | Median | StdDev | Count |
        |----------|------|--------|--------|-------|
        | 64 | 0 | 0 | 0 | 21 |
        | 21 | 0 | 0 | 0 | 5 |
        | 55 | 0 | 0 | 0 | 60 |
        | 58 | 0 | 0 | 0 | 34 |
        | 32 | 0 | 0 | 0 | 8 |
        * **Statistical Tests:** ANOVA F-statistic = 1.5, p-value = 0.2 (No significant difference between groups)
        * **Summary:** 64 has highest mean (0.00), 84 has lowest (0.00)

    * **`Result` by `Heart rate`:**
        | Category | Mean | Median | StdDev | Count |
        |----------|------|--------|--------|-------|
        | 64 | 0 | 0 | 0 | 21 |
        | 21 | 0 | 0 | 0 | 5 |
        | 55 | 0 | 0 | 0 | 60 |
        | 58 | 0 | 0 | 0 | 34 |
        | 32 | 0 | 0 | 0 | 8 |
        * **Statistical Tests:** ANOVA F-statistic = 1.5, p-value = 0.2 (No significant difference between groups)
        * **Summary:** 64 has highest mean (0.00), 84 has lowest (0.00)

    * **`Result` by `Systolic blood pressure`:**
        | Category | Mean | Median | StdDev | Count |
        |----------|------|--------|--------|-------|
        | 64 | 0 | 0 | 0 | 21 |
        | 21 | 0 | 0 | 0 | 5 |
        | 55 | 0 | 0 | 0 | 60 |
        | 58 | 0 | 0 | 0 | 34 |
        | 32 | 0 | 0 | 0 | 8 |
        * **Statistical Tests:** ANOVA F-statistic = 1.5, p-value = 0.2 (No significant difference between groups)
        * **Summary:** 64 has highest mean (0.00), 84 has lowest (0.00)

**3.4. Multivariate Analysis (Preliminary Insights into Complex Interactions):**
    * **Principal Component Analysis:** Not applicable - insufficient numerical variables.

    * **Cluster Analysis:** Not performed - data characteristics not suitable for clustering.

    * **Feature Interactions:** No significant interactions detected.

**3.5. Specific Analysis Modules (Activated Based on Data Characteristics):**

    * **No Specific Modules Activated:** Dataset does not contain sufficient datetime or rich text columns for specialized analysis modules.

**3.6. EDA Summary & Key Hypotheses/Insights:**
    * **Top Statistical Findings:**
    1. Streaming analysis processed 1,320 rows using only 16MB peak memory
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
* **Processing Time:** 25ms (0.03 seconds)
* **Rows Analysed:** 1,320
* **Memory Efficiency:** Constant ~16MB usage
* **Analysis Method:** Streaming with online algorithms
* **Dataset Size:** 1,320 records across 9 columns

---

### **Section 4: Visualization Intelligence** 📊✨

This section provides intelligent chart recommendations and visualization strategies based on comprehensive data analysis. Our recommendations combine statistical rigor with accessibility-first design principles, performance optimization, and modern visualization best practices.

**4.1. Visualization Strategy Overview:**

**Recommended Approach:** Data-driven chart selection with accessibility and performance optimization

**Primary Objectives:**
    * Explore data distributions
    * Identify patterns and relationships
    * Highlight key statistical findings

**Target Audience:** Data analysts, business stakeholders, and decision makers

**Strategy Characteristics:**
* **Complexity Level:** 🟢 simple
* **Interactivity:** 🖱️ basic
* **Accessibility:** ♿ good
* **Performance:** ⚡ fast

**Design Philosophy:** Our recommendations prioritize clarity, accessibility, and statistical accuracy while maintaining visual appeal and user engagement.

**4.2. Univariate Visualization Recommendations:**

*Intelligent chart recommendations for individual variables, optimized for data characteristics and accessibility.*

---
**Column: `Age`** ✅ Excellent

**Data Profile:**
* **Type:** numerical_integer → age
* **Completeness:** 99.9% (75 unique values)
* **Uniqueness:** 5.7% 
**Distribution Characteristics:**
* **Shape:** normal
* **Skewness:** -0.239 (approximately symmetric)
* **Outliers:** 🟢 4 outliers (4%) - low impact

**📊 Chart Recommendations:**

**1. Histogram** 🥇 ✅ High 📈

**Reasoning:** Histograms effectively show the distribution of numerical data, revealing shape, central tendency, and spread

**Technical Specifications:**
* **X-Axis:** Age (linear scale)
* **Y-Axis:** frequency (linear scale)
* **Layout:** responsive (400px height)

**Accessibility & Performance:**
* **Features:** 🎨 Color-blind friendly | ♿ WCAG AA compliant | ⌨️ Keyboard accessible
* **Interactivity:** basic (hover, tooltip)
* **Performance:** svg rendering, medium dataset optimization

**Recommended Libraries:** **D3.js** (complex): Highly customizable, Excellent performance

**2. Density Plot** 🥉 🟡 Medium 📈

**Reasoning:** Density plots provide smooth estimates of distribution shape, useful for larger datasets

**Technical Specifications:**
* **X-Axis:** Age (linear scale)
* **Y-Axis:** frequency (linear scale)
* **Layout:** responsive (400px height)

**Accessibility & Performance:**
* **Features:** 🎨 Color-blind friendly | ♿ WCAG AA compliant | ⌨️ Keyboard accessible
* **Interactivity:** basic (hover, tooltip)
* **Performance:** svg rendering, medium dataset optimization

**Recommended Libraries:** **D3.js** (complex): Highly customizable, Excellent performance

**3. Box Plot** 🥈 🟡 Medium 🎯

**Reasoning:** Box plots provide a compact view of distribution and quartiles

**Technical Specifications:**
* **Y-Axis:** Age (linear scale)
* **Layout:** 300×400

**Accessibility & Performance:**
* **Features:** 🎨 Color-blind friendly | ♿ WCAG AA compliant | ⌨️ Keyboard accessible
* **Interactivity:** basic (hover, tooltip)
* **Performance:** svg rendering, medium dataset optimization

**Recommended Libraries:** **D3.js** (complex): Highly customizable, Excellent performance
**⚠️ Visualization Warnings:**
* **MEDIUM:** High cardinality (75 unique values) may impact performance - Consider grouping rare categories or using aggregation

---
**Column: `Gender`** ✅ Excellent

**Data Profile:**
* **Type:** boolean → status
* **Completeness:** 99.9% (2 unique values)
* **Uniqueness:** 0.1% 

**📊 Chart Recommendations:**

**1. Bar Chart** 🥇 🟡 Medium ⚖️

**Reasoning:** Bar charts clearly show the distribution between true/false values

**Technical Specifications:**
* **X-Axis:** value (band scale)
* **Y-Axis:** count (linear scale)
* **Layout:** 300×400

**Accessibility & Performance:**
* **Features:** 🎨 Color-blind friendly | ♿ WCAG AA compliant | ⌨️ Keyboard accessible
* **Interactivity:** basic (hover, tooltip)
* **Performance:** svg rendering, medium dataset optimization

**Recommended Libraries:** **D3.js** (complex): Highly customizable, Excellent performance

---
**Column: `Heart rate`** ✅ Excellent

**Data Profile:**
* **Type:** numerical_integer → unknown
* **Completeness:** 99.9% (79 unique values)
* **Uniqueness:** 6.0% 
**Distribution Characteristics:**
* **Shape:** skewed_right
* **Skewness:** 18.227 (right-skewed)
* **Outliers:** 🟢 1 outliers (1%) - low impact

**📊 Chart Recommendations:**

**1. Histogram** 🥇 ✅ High 📈

**Reasoning:** Histograms effectively show the distribution of numerical data, revealing shape, central tendency, and spread

**Technical Specifications:**
* **X-Axis:** Heart rate (linear scale)
* **Y-Axis:** frequency (linear scale)
* **Layout:** responsive (400px height)

**Accessibility & Performance:**
* **Features:** 🎨 Color-blind friendly | ♿ WCAG AA compliant | ⌨️ Keyboard accessible
* **Interactivity:** basic (hover, tooltip)
* **Performance:** svg rendering, medium dataset optimization

**Recommended Libraries:** **D3.js** (complex): Highly customizable, Excellent performance

**2. Density Plot** 🥉 🟡 Medium 📈

**Reasoning:** Density plots provide smooth estimates of distribution shape, useful for larger datasets

**Technical Specifications:**
* **X-Axis:** Heart rate (linear scale)
* **Y-Axis:** frequency (linear scale)
* **Layout:** responsive (400px height)

**Accessibility & Performance:**
* **Features:** 🎨 Color-blind friendly | ♿ WCAG AA compliant | ⌨️ Keyboard accessible
* **Interactivity:** basic (hover, tooltip)
* **Performance:** svg rendering, medium dataset optimization

**Recommended Libraries:** **D3.js** (complex): Highly customizable, Excellent performance

**3. Box Plot** 🥈 🟡 Medium 🎯

**Reasoning:** Box plots provide a compact view of distribution and quartiles

**Technical Specifications:**
* **Y-Axis:** Heart rate (linear scale)
* **Layout:** 300×400

**Accessibility & Performance:**
* **Features:** 🎨 Color-blind friendly | ♿ WCAG AA compliant | ⌨️ Keyboard accessible
* **Interactivity:** basic (hover, tooltip)
* **Performance:** svg rendering, medium dataset optimization

**Recommended Libraries:** **D3.js** (complex): Highly customizable, Excellent performance
**⚠️ Visualization Warnings:**
* **MEDIUM:** High cardinality (79 unique values) may impact performance - Consider grouping rare categories or using aggregation

---
**Column: `Systolic blood pressure`** ✅ Excellent

**Data Profile:**
* **Type:** numerical_integer → unknown
* **Completeness:** 99.9% (82 unique values)
* **Uniqueness:** 6.2% 
**Distribution Characteristics:**
* **Shape:** skewed_right
* **Skewness:** 0.684 (right-skewed)
* **Outliers:** 🟢 3 outliers (3%) - low impact

**📊 Chart Recommendations:**

**1. Histogram** 🥇 ✅ High 📈

**Reasoning:** Histograms effectively show the distribution of numerical data, revealing shape, central tendency, and spread

**Technical Specifications:**
* **X-Axis:** Systolic blood pressure (linear scale)
* **Y-Axis:** frequency (linear scale)
* **Layout:** responsive (400px height)

**Accessibility & Performance:**
* **Features:** 🎨 Color-blind friendly | ♿ WCAG AA compliant | ⌨️ Keyboard accessible
* **Interactivity:** basic (hover, tooltip)
* **Performance:** svg rendering, medium dataset optimization

**Recommended Libraries:** **D3.js** (complex): Highly customizable, Excellent performance

**2. Density Plot** 🥉 🟡 Medium 📈

**Reasoning:** Density plots provide smooth estimates of distribution shape, useful for larger datasets

**Technical Specifications:**
* **X-Axis:** Systolic blood pressure (linear scale)
* **Y-Axis:** frequency (linear scale)
* **Layout:** responsive (400px height)

**Accessibility & Performance:**
* **Features:** 🎨 Color-blind friendly | ♿ WCAG AA compliant | ⌨️ Keyboard accessible
* **Interactivity:** basic (hover, tooltip)
* **Performance:** svg rendering, medium dataset optimization

**Recommended Libraries:** **D3.js** (complex): Highly customizable, Excellent performance

**3. Box Plot** 🥈 🟡 Medium 🎯

**Reasoning:** Box plots provide a compact view of distribution and quartiles

**Technical Specifications:**
* **Y-Axis:** Systolic blood pressure (linear scale)
* **Layout:** 300×400

**Accessibility & Performance:**
* **Features:** 🎨 Color-blind friendly | ♿ WCAG AA compliant | ⌨️ Keyboard accessible
* **Interactivity:** basic (hover, tooltip)
* **Performance:** svg rendering, medium dataset optimization

**Recommended Libraries:** **D3.js** (complex): Highly customizable, Excellent performance
**⚠️ Visualization Warnings:**
* **MEDIUM:** High cardinality (82 unique values) may impact performance - Consider grouping rare categories or using aggregation

---
**Column: `Diastolic blood pressure`** ✅ Excellent

**Data Profile:**
* **Type:** numerical_integer → unknown
* **Completeness:** 99.9% (73 unique values)
* **Uniqueness:** 5.5% 
**Distribution Characteristics:**
* **Shape:** normal
* **Skewness:** 0.489 (approximately symmetric)
* **Outliers:** 🟢 2 outliers (2%) - low impact

**📊 Chart Recommendations:**

**1. Histogram** 🥇 ✅ High 📈

**Reasoning:** Histograms effectively show the distribution of numerical data, revealing shape, central tendency, and spread

**Technical Specifications:**
* **X-Axis:** Diastolic blood pressure (linear scale)
* **Y-Axis:** frequency (linear scale)
* **Layout:** responsive (400px height)

**Accessibility & Performance:**
* **Features:** 🎨 Color-blind friendly | ♿ WCAG AA compliant | ⌨️ Keyboard accessible
* **Interactivity:** basic (hover, tooltip)
* **Performance:** svg rendering, medium dataset optimization

**Recommended Libraries:** **D3.js** (complex): Highly customizable, Excellent performance

**2. Density Plot** 🥉 🟡 Medium 📈

**Reasoning:** Density plots provide smooth estimates of distribution shape, useful for larger datasets

**Technical Specifications:**
* **X-Axis:** Diastolic blood pressure (linear scale)
* **Y-Axis:** frequency (linear scale)
* **Layout:** responsive (400px height)

**Accessibility & Performance:**
* **Features:** 🎨 Color-blind friendly | ♿ WCAG AA compliant | ⌨️ Keyboard accessible
* **Interactivity:** basic (hover, tooltip)
* **Performance:** svg rendering, medium dataset optimization

**Recommended Libraries:** **D3.js** (complex): Highly customizable, Excellent performance

**3. Box Plot** 🥈 🟡 Medium 🎯

**Reasoning:** Box plots provide a compact view of distribution and quartiles

**Technical Specifications:**
* **Y-Axis:** Diastolic blood pressure (linear scale)
* **Layout:** 300×400

**Accessibility & Performance:**
* **Features:** 🎨 Color-blind friendly | ♿ WCAG AA compliant | ⌨️ Keyboard accessible
* **Interactivity:** basic (hover, tooltip)
* **Performance:** svg rendering, medium dataset optimization

**Recommended Libraries:** **D3.js** (complex): Highly customizable, Excellent performance
**⚠️ Visualization Warnings:**
* **MEDIUM:** High cardinality (73 unique values) may impact performance - Consider grouping rare categories or using aggregation

---
**Column: `Blood sugar`** ✅ Excellent

**Data Profile:**
* **Type:** numerical_integer → unknown
* **Completeness:** 99.9% (92 unique values)
* **Uniqueness:** 7.0% 
**Distribution Characteristics:**
* **Shape:** skewed_right
* **Skewness:** 1.931 (right-skewed)
* **Outliers:** 🟡 8 outliers (8%) - medium impact

**📊 Chart Recommendations:**

**1. Histogram** 🥇 ✅ High 📈

**Reasoning:** Histograms effectively show the distribution of numerical data, revealing shape, central tendency, and spread

**Technical Specifications:**
* **X-Axis:** Blood sugar (linear scale)
* **Y-Axis:** frequency (linear scale)
* **Layout:** responsive (400px height)

**Accessibility & Performance:**
* **Features:** 🎨 Color-blind friendly | ♿ WCAG AA compliant | ⌨️ Keyboard accessible
* **Interactivity:** basic (hover, tooltip)
* **Performance:** svg rendering, medium dataset optimization

**Recommended Libraries:** **D3.js** (complex): Highly customizable, Excellent performance

**2. Box Plot** 🥇 🟡 Medium 🎯

**Reasoning:** Box plots excel at highlighting outliers and quartile distribution

**Technical Specifications:**
* **Y-Axis:** Blood sugar (linear scale)
* **Layout:** 300×400

**Accessibility & Performance:**
* **Features:** 🎨 Color-blind friendly | ♿ WCAG AA compliant | ⌨️ Keyboard accessible
* **Interactivity:** basic (hover, tooltip)
* **Performance:** svg rendering, medium dataset optimization

**Recommended Libraries:** **D3.js** (complex): Highly customizable, Excellent performance

**3. Density Plot** 🥉 🟡 Medium 📈

**Reasoning:** Density plots provide smooth estimates of distribution shape, useful for larger datasets

**Technical Specifications:**
* **X-Axis:** Blood sugar (linear scale)
* **Y-Axis:** frequency (linear scale)
* **Layout:** responsive (400px height)

**Accessibility & Performance:**
* **Features:** 🎨 Color-blind friendly | ♿ WCAG AA compliant | ⌨️ Keyboard accessible
* **Interactivity:** basic (hover, tooltip)
* **Performance:** svg rendering, medium dataset optimization

**Recommended Libraries:** **D3.js** (complex): Highly customizable, Excellent performance
**⚠️ Visualization Warnings:**
* **MEDIUM:** High cardinality (92 unique values) may impact performance - Consider grouping rare categories or using aggregation

---
**Column: `CK-MB`** ✅ Excellent

**Data Profile:**
* **Type:** numerical_float → unknown
* **Completeness:** 99.9% (96 unique values)
* **Uniqueness:** 7.3% 
**Distribution Characteristics:**
* **Shape:** skewed_right
* **Skewness:** 4.972 (right-skewed)
* **Outliers:** 🔴 19 outliers (19%) - high impact

**📊 Chart Recommendations:**

**1. Histogram** 🥇 ✅ High 📈

**Reasoning:** Histograms effectively show the distribution of numerical data, revealing shape, central tendency, and spread

**Technical Specifications:**
* **X-Axis:** CK-MB (linear scale)
* **Y-Axis:** frequency (linear scale)
* **Layout:** responsive (400px height)

**Accessibility & Performance:**
* **Features:** 🎨 Color-blind friendly | ♿ WCAG AA compliant | ⌨️ Keyboard accessible
* **Interactivity:** basic (hover, tooltip)
* **Performance:** svg rendering, medium dataset optimization

**Recommended Libraries:** **D3.js** (complex): Highly customizable, Excellent performance

**2. Box Plot** 🥇 🟡 Medium 🎯

**Reasoning:** Box plots excel at highlighting outliers and quartile distribution

**Technical Specifications:**
* **Y-Axis:** CK-MB (linear scale)
* **Layout:** 300×400

**Accessibility & Performance:**
* **Features:** 🎨 Color-blind friendly | ♿ WCAG AA compliant | ⌨️ Keyboard accessible
* **Interactivity:** basic (hover, tooltip)
* **Performance:** svg rendering, medium dataset optimization

**Recommended Libraries:** **D3.js** (complex): Highly customizable, Excellent performance

**3. Density Plot** 🥉 🟡 Medium 📈

**Reasoning:** Density plots provide smooth estimates of distribution shape, useful for larger datasets

**Technical Specifications:**
* **X-Axis:** CK-MB (linear scale)
* **Y-Axis:** frequency (linear scale)
* **Layout:** responsive (400px height)

**Accessibility & Performance:**
* **Features:** 🎨 Color-blind friendly | ♿ WCAG AA compliant | ⌨️ Keyboard accessible
* **Interactivity:** basic (hover, tooltip)
* **Performance:** svg rendering, medium dataset optimization

**Recommended Libraries:** **D3.js** (complex): Highly customizable, Excellent performance
**⚠️ Visualization Warnings:**
* **MEDIUM:** High cardinality (96 unique values) may impact performance - Consider grouping rare categories or using aggregation

---
**Column: `Troponin`** ✅ Excellent

**Data Profile:**
* **Type:** numerical_float → unknown
* **Completeness:** 99.9% (95 unique values)
* **Uniqueness:** 7.2% 
**Distribution Characteristics:**
* **Shape:** skewed_right
* **Skewness:** 5.793 (right-skewed)
* **Outliers:** 🔴 28 outliers (28%) - high impact

**📊 Chart Recommendations:**

**1. Histogram** 🥇 ✅ High 📈

**Reasoning:** Histograms effectively show the distribution of numerical data, revealing shape, central tendency, and spread

**Technical Specifications:**
* **X-Axis:** Troponin (linear scale)
* **Y-Axis:** frequency (linear scale)
* **Layout:** responsive (400px height)

**Accessibility & Performance:**
* **Features:** 🎨 Color-blind friendly | ♿ WCAG AA compliant | ⌨️ Keyboard accessible
* **Interactivity:** basic (hover, tooltip)
* **Performance:** svg rendering, medium dataset optimization

**Recommended Libraries:** **D3.js** (complex): Highly customizable, Excellent performance

**2. Box Plot** 🥇 🟡 Medium 🎯

**Reasoning:** Box plots excel at highlighting outliers and quartile distribution

**Technical Specifications:**
* **Y-Axis:** Troponin (linear scale)
* **Layout:** 300×400

**Accessibility & Performance:**
* **Features:** 🎨 Color-blind friendly | ♿ WCAG AA compliant | ⌨️ Keyboard accessible
* **Interactivity:** basic (hover, tooltip)
* **Performance:** svg rendering, medium dataset optimization

**Recommended Libraries:** **D3.js** (complex): Highly customizable, Excellent performance

**3. Density Plot** 🥉 🟡 Medium 📈

**Reasoning:** Density plots provide smooth estimates of distribution shape, useful for larger datasets

**Technical Specifications:**
* **X-Axis:** Troponin (linear scale)
* **Y-Axis:** frequency (linear scale)
* **Layout:** responsive (400px height)

**Accessibility & Performance:**
* **Features:** 🎨 Color-blind friendly | ♿ WCAG AA compliant | ⌨️ Keyboard accessible
* **Interactivity:** basic (hover, tooltip)
* **Performance:** svg rendering, medium dataset optimization

**Recommended Libraries:** **D3.js** (complex): Highly customizable, Excellent performance
**⚠️ Visualization Warnings:**
* **MEDIUM:** High cardinality (95 unique values) may impact performance - Consider grouping rare categories or using aggregation

---
**Column: `Result`** ✅ Excellent

**Data Profile:**
* **Type:** categorical → category
* **Completeness:** 100.0% (3 unique values)
* **Uniqueness:** 0.2% ✅ Optimal for pie charts

**📊 Chart Recommendations:**

**1. Bar Chart** 🥇 ✅ High ⚖️

**Reasoning:** Bar charts excel at comparing categorical data frequencies

**Technical Specifications:**
* **X-Axis:** Result (band scale)
* **Y-Axis:** count (linear scale)
* **Layout:** responsive (400px height)

**Accessibility & Performance:**
* **Features:** 🎨 Color-blind friendly | ♿ WCAG AA compliant | ⌨️ Keyboard accessible
* **Interactivity:** basic (hover, tooltip)
* **Performance:** svg rendering, medium dataset optimization

**Recommended Libraries:** **D3.js** (complex): Highly customizable, Excellent performance

**2. Pie Chart** 🥈 🟠 Low 🥧

**Reasoning:** Pie charts work well for showing parts of a whole when there are few categories

**Technical Specifications:**
* **Color:** categorical palette (AA compliant)
* **Layout:** 400×400

**Accessibility & Performance:**
* **Features:** 🎨 Color-blind friendly | ♿ WCAG AA compliant | ⌨️ Keyboard accessible
* **Interactivity:** basic (hover, tooltip)
* **Performance:** svg rendering, medium dataset optimization

**Recommended Libraries:** **D3.js** (complex): Highly customizable, Excellent performance

**4.3. Bivariate Visualization Recommendations:**

*Chart recommendations for exploring relationships between variable pairs.*

---
**Relationship: `Age` ↔ `Heart rate`** 🔴 Very Strong

**Relationship Type:** numerical numerical
**Strength:** 1.000 (significance: 0.001)

**📊 Recommended Charts:**


---
**Relationship: `Age` ↔ `Systolic blood pressure`** 🔴 Very Strong

**Relationship Type:** numerical numerical
**Strength:** 1.000 (significance: 0.001)

**📊 Recommended Charts:**


---
**Relationship: `Age` ↔ `Diastolic blood pressure`** 🔴 Very Strong

**Relationship Type:** numerical numerical
**Strength:** 1.000 (significance: 0.001)

**📊 Recommended Charts:**


---
**Relationship: `Age` ↔ `Blood sugar`** 🔴 Very Strong

**Relationship Type:** numerical numerical
**Strength:** 1.000 (significance: 0.001)

**📊 Recommended Charts:**


---
**Relationship: `Age` ↔ `CK-MB`** 🔴 Very Strong

**Relationship Type:** numerical numerical
**Strength:** 1.000 (significance: 0.001)

**📊 Recommended Charts:**


---
**Relationship: `Age` ↔ `Troponin`** 🔴 Very Strong

**Relationship Type:** numerical numerical
**Strength:** 1.000 (significance: 0.001)

**📊 Recommended Charts:**


---
**Relationship: `Heart rate` ↔ `Systolic blood pressure`** 🔴 Very Strong

**Relationship Type:** numerical numerical
**Strength:** 1.000 (significance: 0.001)

**📊 Recommended Charts:**


---
**Relationship: `Heart rate` ↔ `Diastolic blood pressure`** 🔴 Very Strong

**Relationship Type:** numerical numerical
**Strength:** 1.000 (significance: 0.001)

**📊 Recommended Charts:**


---
**Relationship: `Heart rate` ↔ `Blood sugar`** 🔴 Very Strong

**Relationship Type:** numerical numerical
**Strength:** 1.000 (significance: 0.001)

**📊 Recommended Charts:**


---
**Relationship: `Heart rate` ↔ `CK-MB`** 🔴 Very Strong

**Relationship Type:** numerical numerical
**Strength:** 1.000 (significance: 0.001)

**📊 Recommended Charts:**


**4.4. Multivariate Visualization Recommendations:**

*Advanced visualizations for exploring complex multi-variable relationships.*

---
**🌐 Parallel Coordinates** 🟡

**Purpose:** Compare multiple numerical variables simultaneously and identify multivariate patterns
**Variables:** `Age`, `Heart rate`, `Systolic blood pressure`, `Diastolic blood pressure`, `Blood sugar`, `CK-MB`
**Implementation:** Use D3.js or Observable Plot for interactive parallel coordinates with brushing
**Alternatives:** 📡 Radar Chart, 🔬 Scatterplot Matrix (SPLOM)

---
**🔗 Correlation Matrix** 🟢

**Purpose:** Visualize pairwise correlations across all numerical variables
**Variables:** `Age`, `Heart rate`, `Systolic blood pressure`, `Diastolic blood pressure`, `Blood sugar`, `CK-MB`, `Troponin`
**Implementation:** Create heatmap with correlation values and significance indicators
**Alternatives:** 🔬 Scatterplot Matrix (SPLOM)

---
**🔬 Scatterplot Matrix (SPLOM)** 🟠

**Purpose:** Show detailed pairwise relationships and distributions in matrix layout
**Variables:** `Age`, `Heart rate`, `Systolic blood pressure`, `Diastolic blood pressure`, `Blood sugar`, `CK-MB`, `Troponin`
**Implementation:** Interactive matrix with brushing and linking across panels
**Alternatives:** 🌐 Parallel Coordinates, 🔗 Correlation Matrix

---
**📡 Radar Chart** 🟡

**Purpose:** Compare Result categories across multiple numerical dimensions
**Variables:** `Result`, `Age`, `Heart rate`, `Systolic blood pressure`, `Diastolic blood pressure`, `Blood sugar`, `CK-MB`
**Implementation:** Multi-series radar chart with clear category distinction
**Alternatives:** 🌐 Parallel Coordinates, Grouped Bar Chart

**4.5. Dashboard Design Recommendations:**

**Recommended Approach:** Single-page dashboard with grid layout

**Key Principles:**
* **Progressive Disclosure:** Start with overview charts, allow drill-down to details
* **Logical Grouping:** Group related visualizations by data type or business domain
* **Responsive Design:** Ensure charts adapt to different screen sizes
* **Consistent Styling:** Maintain color schemes and typography across all charts

**Layout Strategy:**
* **Primary Charts:** Place most important visualizations in top-left quadrant
* **Supporting Charts:** Use secondary positions for detailed or specialized views
* **Navigation:** Implement clear labeling and intuitive chart relationships

**4.6. Technical Implementation Guidance:**

**Recommended Technology Stack:**

**JavaScript Libraries:**
* **D3.js** - For custom, highly interactive visualizations
  * ✅ **Pros:** Ultimate flexibility, performance, community support
  * ⚠️ **Cons:** Steep learning curve, development time
  * **Best for:** Custom dashboards, complex interactions

* **Observable Plot** - For rapid, grammar-of-graphics approach
  * ✅ **Pros:** Concise syntax, built on D3, excellent defaults
  * ⚠️ **Cons:** Less customization than pure D3
  * **Best for:** Quick analysis, standard chart types

* **Plotly.js** - For interactive scientific visualization
  * ✅ **Pros:** Rich interactivity, 3D support, statistical charts
  * ⚠️ **Cons:** Larger bundle size, specific aesthetic
  * **Best for:** Scientific data, statistical analysis

**Implementation Patterns:**
1. **Data Preparation:** Clean and structure data before visualization
2. **Responsive Design:** Use CSS Grid/Flexbox for layout, SVG viewBox for charts
3. **Progressive Enhancement:** Start with static charts, add interactivity progressively
4. **Performance Optimization:** Implement data sampling for large datasets (>10K points)

**Development Workflow:**
1. **Prototype** with Observable notebooks or CodePen
2. **Iterate** on design based on user feedback
3. **Optimize** for production performance and accessibility
4. **Test** across devices and assistive technologies

**4.7. Accessibility Assessment & Guidelines:**

**Overall Accessibility Level:** ♿ **GOOD** - Meets WCAG 2.1 AA standards

**Key Accessibility Features:**

**Visual Accessibility:**
* **Color Blindness Support:** All recommended color schemes tested for protanopia, deuteranopia, and tritanopia
* **High Contrast:** Minimum 4.5:1 contrast ratio for all text and important graphical elements
* **Alternative Encodings:** Pattern, texture, and shape options provided alongside color

**Motor Accessibility:**
* **Large Click Targets:** Minimum 44×44px touch targets for interactive elements
* **Keyboard Navigation:** Full functionality available via keyboard shortcuts
* **Focus Management:** Clear visual focus indicators and logical tab order

**Cognitive Accessibility:**
* **Clear Labeling:** Descriptive titles, axis labels, and legend entries
* **Progressive Disclosure:** Information hierarchy prevents cognitive overload
* **Error Prevention:** Clear feedback and validation for interactive elements

**Screen Reader Support:**
* **ARIA Labels:** Comprehensive labeling for dynamic content
* **Alternative Text:** Meaningful descriptions for all visual elements
* **Data Tables:** Structured data available in table format when needed

**Testing Recommendations:**
1. **Automated Testing:** Use axe-core or similar tools for baseline compliance
2. **Manual Testing:** Navigate with keyboard only, test with screen readers
3. **User Testing:** Include users with disabilities in design validation
4. **Color Testing:** Verify designs with color blindness simulators

**Compliance Status:** ✅ WCAG 2.1 AA Ready

**4.8. Visualization Strategy Summary:**

**📊 Recommendation Overview:**
* **Total Recommendations:** 24 charts across 5 types
* **Overall Confidence:** 80% (High)
* **Accessibility Compliance:** WCAG 2.1 AA Ready
* **Performance Optimization:** Implemented for all chart types

**🎯 Key Strategic Findings:**
* 7 numerical variables suitable for distribution analysis
* 1 categorical variables optimal for comparison charts
* Simple visualization approach recommended for clear communication
* good accessibility level achieved with universal design principles

**🚀 Implementation Priorities:**
1. **Primary Charts:** Implement 12 primary chart recommendations first
2. **Accessibility Foundation:** Establish color schemes, ARIA labels, and keyboard navigation
3. **Interactive Features:** Add tooltips, hover effects, and progressive enhancement
4. **Performance Testing:** Validate chart performance with representative data volumes

**📋 Next Steps:**
1. **Start with univariate analysis** - Implement primary chart recommendations first
2. **Establish design system** - Create consistent color schemes and typography
3. **Build accessibility framework** - Implement WCAG compliance from the beginning
4. **Performance optimization** - Test with representative data volumes
5. **User feedback integration** - Validate charts with target audience



---

**Analysis Performance Summary:**
* **Processing Time:** 2ms (Excellent efficiency)
* **Recommendations Generated:** 24 total
* **Chart Types Evaluated:** 5 different types
* **Accessibility Checks:** 10 validations performed
* **Analysis Approach:** Multi-dimensional scoring with accessibility-first design
* **Recommendation Confidence:** 80%