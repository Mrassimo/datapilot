
---

### **Section 2: Comprehensive Data Quality & Integrity Audit Report** 🧐🛡️

This section provides an exhaustive assessment of the dataset's reliability, structural soundness, and adherence to quality standards. Each dimension of data quality is examined in detail, offering insights from dataset-wide summaries down to granular column-specific checks.

**2.1. Overall Data Quality Cockpit:**
    * **Composite Data Quality Score (CDQS):** XX.X / 100
        * *Methodology:* Weighted average of individual quality dimension scores (configurable weights).
        * *Interpretation Guide:* (e.g., >95: Excellent; 85-95: Good; 70-84: Fair; 50-69: Needs Improvement; <50: Poor).
    * **Data Quality Dimensions Radar Chart Summary:** (Textual representation of scores for key dimensions like Completeness, Accuracy, Consistency, etc.)
    * **Top 3 Data Quality Strengths:**
        1.  (e.g., High completeness in critical columns like `TransactionID`).
        2.  (e.g., Excellent validity for financial data against defined formats).
        3.  (e.g., Consistent use of categorical codes in `Status_Code`).
    * **Top 3 Data Quality Weaknesses (Areas for Immediate Attention):**
        1.  (e.g., Inconsistent date formats across `OrderDate` and `ShipDate`).
        2.  (e.g., High number of outliers in `Age` column requiring investigation).
        3.  (e.g., Suspected duplicates in customer records based on name and address).
    * **Estimated Technical Debt (Data Cleaning Effort):**
        * *Time Estimate:* Approx. X-Y man-hours (e.g., "4 hours estimated cleanup").
        * *Complexity Level:* Low / Medium / High.
        * *Primary Debt Contributors:* (e.g., Missing value imputation strategy, Date format standardization, Outlier investigation & resolution).
    * **Automated Cleaning Potential:**
        * *Number of Issues with Suggested Automated Fixes:* N.
        * *(Examples: Trimming leading/trailing spaces, standardizing casing, rule-based value correction).*

**2.2. Completeness Dimension (Absence of Missing Data):**
    * **Dataset-Level Completeness Overview:**
        * Overall Dataset Completeness Ratio: X.XX% (Total non-missing cells / Total possible cells).
        * Total Missing Values (Entire Dataset): NNN.
        * Percentage of Rows Containing at Least One Missing Value: Y.YY%.
        * Percentage of Columns Containing at Least One Missing Value: Z.ZZ%.
        * Missing Value Distribution Overview: (e.g., "No missing values detected", "Missing values predominantly in non-critical columns").
    * **Column-Level Completeness Deep Dive:** (For each column)
        * `column_name`:
            * Number of Missing Values: M.
            * Percentage of Missing Values: M.MM%.
            * Missingness Pattern Analysis:
                * *(e.g., Missing Completely At Random (MCAR), Missing At Random (MAR) - correlated with other variables, Missing Not At Random (MNAR) - systematic).*
                * *(Visual Cues: Sparkline or mini-bar showing missing data distribution within the column).*
            * Suggested Imputation Strategy (if applicable): (e.g., Mean, Median, Mode, Regression-based, ML model imputation, None - requires domain input).
    * **Missing Data Heatmap/Matrix Summary (Textual Description):**
        * (e.g., "Strong correlation in missingness between `AddressLine2` and `PostalCode_Suffix`").
        * (e.g., "Block-wise missingness observed for records with `ImportSource` = 'LegacySystem'").

**2.3. Accuracy Dimension (Conformity to "True" Values):**
    * *(Note: True accuracy often requires external validation, gold standard datasets, or deep domain expertise. DataPilot provides indicators and rule-based checks.)*
    * **Value Conformity to External References & Known Constraints:**
        * `column_CountryCode`: X values not found in ISO 3166-1 alpha-2 standard list (e.g., 'UK' vs 'GB', 'USA' vs 'US').
        * `column_CurrencyCode`: Y values not in ISO 4217.
        * `column_ProductName`: Z% match against an optional product master list (if provided).
    * **Cross-Field Validation for Semantic Accuracy & Plausibility:**
        * *Rule Example 1:* `Age` should be >= (`Years_Of_Experience` + 16). (Number of Violations: N).
        * *Rule Example 2:* If `Marital_Status` is 'Single', `Spouse_Name` should be NULL or N/A. (Number of Violations: M).
        * *Rule Example 3:* `CityName` should be a valid city for the given `StateCode`/`PostalCode`. (Number of Mismatches based on geo-database lookup: K).
    * **Impact of Outliers on Accuracy:**
        * Percentage of data points flagged as significant outliers that are highly likely to be erroneous entries (cross-reference with Section on Outlier Analysis).
    * **Data Source Lineage & Trustworthiness (Qualitative, if metadata available):**
        * (e.g., Data from 'VerifiedFeed_Q1' vs 'ManualEntry_Spreadsheet_V2').
    * **Accuracy Score (Heuristic, rule-based):** X/100.

**2.4. Consistency Dimension (Absence of Contradictions):**
    * **Intra-Record Consistency (Logical consistency across columns within the same row):**
        * `column_CityName` vs `column_PostalCode` vs `column_StateAbbreviation`: N records with inconsistent geographical information based on reference data.
        * `column_StartDate` vs `column_EndDate`: M records where `StartDate` is chronologically after `EndDate`.
        * `column_TotalAmount` vs (`Quantity` * `UnitPrice`): K records with calculation discrepancies beyond a tolerance.
    * **Inter-Record Consistency (Consistency of facts across different records for the same entity):**
        * (e.g., Customer `CustID_123` has `DateOfBirth` as '1990-05-10' in one record and '1990-05-12' in another). Requires entity resolution.
    * **Format & Representational Consistency (Standardization of Data Values):**
        * `column_TransactionDate`: Mixed date formats detected (e.g., 'YYYY-MM-DD', 'MM/DD/YY', 'Day DD Mon YYYY'). Suggest standardization to ISO 8601.
        * `column_CustomerStatus`: Multiple representations for the same logical concept (e.g., 'Active', 'A', 'active', '1', 'Current'). Suggest mapping to a standard set (e.g., 'Active').
        * `column_UnitOfMeasure`: Mixed units detected within the same column without a corresponding value column (e.g., 'kg', 'lbs', 'grams' in a `ProductWeight` column).
        * Casing Consistency: (e.g., 'new york', 'New York', 'NEW YORK' in `City` column). Suggest standard casing (e.g., Title Case).
    * **Consistency Score (Rule-based and pattern detection):** X/100.

**2.5. Timeliness & Currency Dimension (Data is sufficiently up-to-date):**
    * *(Note: This often requires context about data's expected lifecycle and "current time" reference.)*
    * **Data Freshness Indicators (from dedicated date/timestamp columns or file metadata):**
        * Latest Record Timestamp Found (`column_LastUpdatedDate` or `column_EventTimestamp`): YYYY-MM-DD HH:MM:SS.
        * Dataset Age (Calculated from latest timestamp against current time): X days/months/years.
        * Percentage of Records Older than Defined Threshold (e.g., >90 days for active customer data): Y%. (Thresholds can be user-defined).
    * **Update Frequency Analysis (if multiple snapshots or event logs):**
        * Average/Median Time Between Updates for records.
        * Detection of Stale or Dormant Data Segments.
    * **Timeliness Score (Heuristic, based on age and update patterns):** X/100 (e.g., "Timeliness: unknown" or value).

**2.6. Uniqueness Dimension (Minimization of Redundancy):**
    * **Exact Duplicate Record Detection (Row-level):**
        * Number of Fully Duplicate Rows (all columns identical): N.
        * Percentage of Dataset Comprised of Exact Duplicates: X.XX%.
        * List of Duplicate Row Sets (or sample).
    * **Key Uniqueness & Integrity (For specified or inferred primary/candidate keys):**
        * `column_CustomerID (Potential PK)`: M duplicate values found. Cardinality: YYY / Total Rows.
        * List of duplicate key values and their frequencies.
    * **Column-Level Value Uniqueness Profile:** (For each relevant column)
        * `column_EmailAddress`:
            * Percentage of Unique Values: Z.ZZ%.
            * Number of Distinct Duplicate Email Addresses: K.
            * Most Frequent Duplicate Email: `[email_address]` (occurs J times).
    * **Fuzzy/Semantic Duplicate Detection (Advanced Heuristics):**
        * Number of Record Pairs Suspected to be Semantic Duplicates: P pairs.
            * *(e.g., "Johnathan Doe, 123 Main St, NY" vs "Jon Doe, 123 Main Street, New York")*.
        * *Methods Used:* (e.g., Levenshtein distance on combined key fields, phonetic matching (Soundex/Metaphone), N-gram similarity).
        * *Confidence Score for Semantic Duplicates.*
    * **Uniqueness Score (Composite of exact and potential duplicates):** X/100.

**2.7. Validity & Conformity Dimension (Data adheres to defined rules, formats, and standards):**
    * **Data Type Conformance Deep Dive:** (For each column)
        * `column_name` (Declared/Inferred Type: ExpectedType, e.g., Integer, String, Date, Boolean)
            * Primary Detected Data Type by DataPilot: ActualType (Confidence: XX%).
            * Number of Non-Conforming Values (values that could not be cast to ExpectedType or ActualType): N.
            * Percentage of Values Conforming to Expected/Actual Type: X.XX%.
            * Examples of Non-Conforming Values: [`val1`, `val2`, ...].
            * Suggested Data Type Correction/Conversion Strategy: (e.g., Attempt to cast, flag as error, infer mixed type column).
    * **Range & Value Set Conformance:** (For relevant columns)
        * `column_Age (Expected Range: 0-120)`: M values found outside this range (e.g., -5, 200). List outliers.
        * `column_ProductRating (Expected Discrete Values: {1, 2, 3, 4, 5})`: K values found not in this set (e.g., 0, 6, 'Good'). List invalid values.
        * `column_CountryCode (Expected from ISO 3166-1 list)`: J values not in the official list.
    * **Pattern Conformance (Regex Validation):** (For columns with expected formats)
        * `column_PhoneNumber (Expected Pattern: North American NANP)`: L values do not match `^[2-9]\d{2}-\d{3}-\d{4}$`.
        * `column_EmailAddress (Expected Pattern: Standard Email Regex)`: P values fail regex validation.
    * **Cross-Column Validation Rules (Business Rule Adherence):**
        * *Rule ID DQ-001:* `IF column_AccountType = 'Premium' THEN column_MonthlyFee MUST BE > 50.00`. (Number of Violations: N).
        * *Rule ID DQ-002:* `column_OrderTotal MUST EQUAL SUM(column_LineItemPrice * column_LineItemQuantity) GROUP BY OrderID`. (Number of Orders with Discrepancies: M, Average Discrepancy Value: $X.XX).
    * **File Structure & Schema Validity:**
        * Consistent Number of Columns Per Row: Yes (or No, with N rows deviating from modal column count).
        * Header Row Conformance (if schema provided): All expected columns present, no unexpected columns.
    * **Validity Score (Composite of type, range, pattern, rule adherence):** X/100.

**2.8. (Advanced) Integrity Dimension (Focus on Relationships & Structural Soundness):**
    * *(Note: True referential integrity checks require a defined schema with foreign key relationships. DataPilot can infer or use user-provided hints.)*
    * **Potential Orphaned Record Detection (Based on inferred relationships):**
        * If `column_ManagerID` in `EmployeesTable` is inferred to reference `EmployeeID`: N `ManagerID` values found that do not exist as an `EmployeeID`.
    * **Relationship Cardinality Conformance Checks (If relationships defined):**
        * *Rule:* One `Customer` can have Many `Orders`. (Check: `CustomerID` should be unique in `CustomersTable`; all `CustomerID` in `OrdersTable` should exist in `CustomersTable`).
    * **Data Model Integrity (Comparison against an ideal/target schema, if provided):**
        * Column data types match target schema definitions.
        * Presence of all required columns as per target schema.
    * **Integrity Score (Heuristic, based on violations):** X/100.

**2.9. (Advanced) Reasonableness & Plausibility Dimension:**
    * **Value Plausibility Against Statistical Distributions & Norms:**
        * `column_TransactionAmount`: Mean=$X, StdDev=$Y. Values > Mean + K*StdDev (e.g., K=5) flagged as 'Statistically Implausible' (N values). (Links to detailed Outlier Analysis section).
        * Benford's Law Analysis (for numerical data like financial transactions): Conformance score X%. Deviations might indicate anomalies.
    * **Inter-Field Semantic Plausibility (More complex than simple rules, often requiring domain heuristics):**
        * (e.g., A person aged 5 with `Job_Title` = 'Chief Executive Officer').
        * (e.g., A product `ShippedDate` occurring before its `OrderDate`).
    * **Contextual Anomaly Detection (e.g., a sudden spike in orders for a specific product variant that is usually unpopular).**
    * **Plausibility Score (Heuristic, based on statistical and contextual checks):** X/100.

**2.10. (Advanced) Precision & Granularity Dimension:**
    * **Numeric Precision & Scale Analysis:**
        * `column_ExchangeRate`: Maximum decimal places observed: X. Is this consistent with expected precision for currency rates?
        * Inconsistent precision observed: (e.g., Some values as $10.50, others as $10.501234).
    * **Temporal Granularity:**
        * `column_EventTimestamp`: Granularity observed (e.g., down to seconds, milliseconds, or just date level). Is this sufficient for the intended analysis?
    * **Categorical Specificity & Hierarchy:**
        * `column_ProductCategory`: Level of detail (e.g., 'Electronics' vs 'Electronics > Audio Equipment > Wireless Headphones'). Is the granularity consistent and appropriate?
    * **Geospatial Precision (for coordinates):** Number of decimal places implying meter, cm, or sub-mm precision.
    * **Precision Score (Heuristic, based on consistency and appropriateness of detail):** X/100.

**2.11. (Advanced) Representational Form & Interpretability:**
    * **Standardization of Units of Measure:**
        * `column_ProductWeight`: All values appear to be in 'kg' (or "Mixed units 'kg', 'lb', 'ounces' detected, conversion factors may be needed").
    * **Abbreviation, Acronym & Code Standardization:**
        * `column_State`: Uses 2-letter ISO codes consistently (or "Mixed representations found: 'NY', 'N.Y.', 'New York', 'NewYorkState'").
        * Clarity of coded values (e.g., `StatusCode` = 17. What does 17 mean? Is a data dictionary available/inferred?).
    * **Boolean Value Representation:**
        * Consistent use of True/False, 1/0, 'Yes'/'No', 'Y'/'N'. (e.g., "Mixed boolean representations: `isActive` uses 0/1, `isPreferred` uses True/False").
    * **Text Field Formatting:**
        * Presence of excessive whitespace, special/unprintable characters, HTML/XML markup in plain text fields.
        * `column_ProductDescription`: Average length Y chars. X records have descriptions < 5 chars (potentially too short). Z records > 2000 chars (potentially truncated or overly verbose).
    * **Interpretability Score (Heuristic):** X/100.

**2.13. Data Profiling Insights Directly Impacting Quality:**
    * **Value Length Analysis (for string/text columns):**
        * Min/Max/Average/Median length, standard deviation of lengths.
        * Distribution of value lengths (e.g., 90% of `UserComments` are between 10 and 250 chars). Unusual lengths can indicate truncation, padding, or erroneous data.
    * **Character Set & Encoding Validation:**
        * `column_CustomerName`: Predominantly ASCII, but X records contain non-ASCII (e.g., UTF-8 accented) characters. Is this expected?
        * Detection of mixed encodings or mojibake.
    * **Frequency Distribution of Special Characters / Control Characters / Whitespace:**
        * `column_AddressLine1`: N instances of leading/trailing spaces detected and trimmable.
        * Value 'NULL' (string literal) or '##MISSING##' appears K times, likely a placeholder for true missing values.
        * Frequency of tabs, newlines, or other control characters within data fields.
    * **Lexical Analysis & Token Statistics:**
        * Most frequent/least frequent tokens in text fields.
        * Number of unique words, average words per entry. Can indicate data entry issues or boilerplate text.

---

This structure for Section 2 aims to be incredibly thorough. In a real-world implementation, DataPilot might allow users to toggle the depth or select specific checks to run, as performing all of these on very large datasets could be computationally intensive. The scores for each dimension would contribute to the overall CDQS, providing a quantifiable measure of data health.

This should give you a very solid blueprint for what an "expansive" data quality and integrity report can look like!