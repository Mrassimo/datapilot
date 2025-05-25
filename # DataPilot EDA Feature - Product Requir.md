# DataPilot EDA Feature - Product Requirements Document

## Executive Summary

The Exploratory Data Analysis (EDA) feature is the flagship command of DataPilot, providing comprehensive statistical analysis of CSV files in a verbose, LLM-ready text format. This PRD outlines the complete expansion of the EDA feature from basic statistics to a comprehensive analytical tool that automatically detects data characteristics and runs appropriate analyses without configuration.

## Design Philosophy

1. **Zero Configuration**: Users run `datapilot eda file.csv` - no flags, no options
2. **Intelligent Detection**: Automatically determines which analyses are relevant
3. **Comprehensive by Default**: Includes all applicable analyses in one report
4. **LLM-Optimised**: Verbose, structured output perfect for AI consumption
5. **Australian-Aware**: Recognises and validates Australian data formats

## Feature Overview

### Current State
- Basic statistics (mean, median, mode, std dev)
- Simple correlation detection
- Basic data quality metrics
- Column type detection

### Expanded Capabilities
- Advanced statistical testing
- Univariate and multivariate outlier detection
- CART decision tree analysis
- Regression analysis with residual diagnostics
- Time series analysis
- Machine learning readiness assessment
- Australian data validation
- Pattern and anomaly detection

## Detailed Feature Specifications

### 1. Intelligent Analysis Detection

The system automatically determines which analyses to run based on data characteristics:

```javascript
Analysis Detection Logic:
- Regression Analysis: If continuous variable with 70%+ unique values detected
- Time Series: If date/datetime column with regular intervals found
- CART Analysis: If mix of categorical and numerical columns present
- Australian Validation: If postcodes, phone numbers, or currency detected
- ML Readiness: If dataset has >5 columns and >1000 rows
```

### 2. Core Analysis Modules

#### 2.1 Basic Statistical Analysis (Always Included)
- **Numerical Columns**:
  - Central tendency: mean, median, mode
  - Spread: variance, standard deviation, IQR
  - Shape: skewness, kurtosis
  - Percentiles: 5th, 25th, 75th, 95th
  - Range: min, max
  
- **Categorical Columns**:
  - Unique values count
  - Mode and frequency
  - Top 10 most frequent values
  - Rare categories (<1% frequency)
  - Entropy/diversity metrics

#### 2.2 Distribution Analysis
- **Distribution Testing**:
  - Shapiro-Wilk test for normality
  - Anderson-Darling test
  - Kolmogorov-Smirnov test
  - Best-fit distribution identification
  
- **Transformation Recommendations**:
  - Log transformation for right-skewed data
  - Square root for count data
  - Box-Cox optimal lambda
  - Post-transformation statistics

#### 2.3 Univariate Outlier Analysis
For each numerical column:

- **Statistical Methods**:
  - IQR method (Tukey's fences)
  - Modified Z-score (Iglewicz-Hoaglin)
  - GESD test (Generalised Extreme Studentised Deviate)
  - Isolation Forest anomaly scores
  
- **Contextual Analysis**:
  - Business logic validation
  - Temporal clustering (outliers on specific dates)
  - Segment-based outliers
  
- **Output Format**:
  ```
  [Column: transaction_amount]
  Statistical Outliers: 156 records
  - IQR Method: 89 outliers beyond $823.45
  - Modified Z-Score: 103 outliers (threshold: 3.5)
  - Top 5 extreme values: [$4,567, $3,234, $2,899, $2,456, $2,123]
  - Outlier Pattern: 67% occur on promotional days (legitimate)
  - Recommendation: Retain for analysis, flag for review
  ```

#### 2.4 CART Decision Tree Analysis
Automatically runs when mixed data types detected:

- **Business Rule Discovery**:
  - Customer segmentation rules
  - Churn indicators
  - Pricing optimisation rules
  - Risk factors
  
- **Tree Parameters**:
  - Max depth: 5 (for interpretability)
  - Min samples split: 5% of data
  - Automatic pruning for overfitting
  
- **Output Format**:
  ```
  KEY BUSINESS RULES DISCOVERED:
  1. HIGH-VALUE CUSTOMERS (revenue >$1000/month):
     ├─ If age > 45 AND subscription = 'Premium'
     │  └─ 78% are high-value (243/312 customers)
     └─ If purchase_frequency > 3/month AND avg_order > $150
        └─ 82% are high-value (189/231 customers)
  ```

#### 2.5 Regression Analysis Suite
Triggered when continuous target variable detected:

- **Model Fitting**:
  - Ordinary Least Squares (OLS)
  - Robust regression for outliers
  - Polynomial regression if non-linear
  
- **Diagnostics**:
  - R-squared and adjusted R-squared
  - F-statistic and p-value
  - Coefficient analysis with confidence intervals
  - Variable importance ranking
  
- **Residual Analysis**:
  - Normality tests (Shapiro-Wilk, Q-Q description)
  - Homoscedasticity (Breusch-Pagan test)
  - Independence (Durbin-Watson statistic)
  - Influential points (Cook's distance, DFBETAS)
  - Residual patterns and recommendations

#### 2.6 Correlation & Multivariate Analysis
- **Correlation Methods**:
  - Pearson (linear relationships)
  - Spearman (monotonic relationships)
  - Kendall's Tau (ordinal associations)
  - Distance correlation (non-linear dependencies)
  - Partial correlations (controlling for confounders)
  
- **Multicollinearity Detection**:
  - Variance Inflation Factors (VIF)
  - Condition Index
  - Correlation matrix heatmap description

#### 2.7 Time Series Analysis
When temporal data detected:

- **Trend Analysis**:
  - Linear and polynomial trends
  - Moving averages
  - Trend strength metrics
  
- **Seasonality Detection**:
  - Daily, weekly, monthly, yearly patterns
  - Seasonal indices
  - Holiday effects
  
- **Stationarity Testing**:
  - Augmented Dickey-Fuller (ADF) test
  - KPSS test
  - Recommendations for differencing

#### 2.8 Pattern Detection & Anomalies
- **Benford's Law Analysis**: For financial data fraud detection
- **Business Rule Inference**: Automatically detected constraints
- **Temporal Patterns**: Peak hours, days, seasons
- **Clustering Tendency**: Hopkins statistic
- **Duplicate Detection**: Exact and fuzzy matching

#### 2.9 Australian Data Validation
Automatically activated when Australian patterns detected:

- **Postcode Validation**:
  - Valid range checking
  - State/territory mapping
  - Geographic distribution analysis
  
- **Phone Number Validation**:
  - Mobile vs landline detection
  - Carrier identification
  - Format standardisation
  
- **Business Identifiers**:
  - ABN/ACN format validation
  - GST calculation checks
  - Superannuation rate validation

#### 2.10 Machine Learning Readiness
- **Feature Quality Assessment**:
  - Predictive power (mutual information)
  - Redundancy detection
  - Constant/low-variance features
  
- **Data Preparation Recommendations**:
  - Missing value strategies
  - Encoding recommendations
  - Scaling requirements
  - Feature engineering opportunities
  
- **Model Suggestions**:
  - Based on data characteristics
  - Complexity vs interpretability trade-offs
  - Validation strategy recommendations

### 3. Output Structure

The complete output follows this hierarchical structure:

```
=== EXPLORATORY DATA ANALYSIS REPORT ===
Dataset: [filename]
Generated: [timestamp]
Analysis Depth: Comprehensive (auto-detected)

DATASET OVERVIEW
↓
COLUMN ANALYSIS (Basic Statistics)
↓
DISTRIBUTION DEEP DIVE
↓
UNIVARIATE OUTLIER ANALYSIS
↓
DECISION TREE INSIGHTS (if applicable)
↓
REGRESSION ANALYSIS (if applicable)
  └─ RESIDUAL ANALYSIS
↓
MULTIVARIATE RELATIONSHIPS
↓
ADVANCED STATISTICAL TESTS
↓
[AUSTRALIAN DATA VALIDATION] (if detected)
↓
[TIME SERIES ANALYSIS] (if detected)
↓
PATTERN DETECTION & ANOMALIES
↓
ML READINESS ASSESSMENT
↓
DATA QUALITY SUMMARY
↓
KEY INSIGHTS & RECOMMENDATIONS
↓
SUGGESTED DEEP-DIVE ANALYSES
```

### 4. Performance Specifications

- **Large File Handling**:
  - Stream processing for files >100MB
  - Intelligent sampling for expensive operations
  - Progress indicators for long-running analyses
  
- **Sampling Strategy**:
  ```javascript
  if (rows > 100,000) {
    - Use stratified sampling for statistical tests
    - Full data for basic statistics
    - Sample size: min(10,000, rows * 0.1)
  }
  ```

- **Performance Targets**:
  - <1 second for files <1MB
  - <10 seconds for files <100MB
  - <60 seconds for files <1GB

### 5. Technical Implementation

#### 5.1 Dependencies
```json
{
  "dependencies": {
    "simple-statistics": "^7.8.0",  // Core statistics
    "ml-cart": "^2.1.0",           // Decision trees
    "regression": "^2.0.1",        // Regression analysis
    "outliers": "^0.0.3",          // Outlier detection
    "australian-phone": "^1.0.0",  // AU validation
    "csv-parse": "^5.5.0",         // CSV parsing
    "chalk": "^5.3.0"              // Colored output
  }
}
```

#### 5.2 Module Structure
```
src/commands/eda/
├── index.js                 // Main orchestrator
├── detectors/
│   ├── dataTypeDetector.js  // Identifies analysis needs
│   ├── targetDetector.js    // Finds potential targets
│   └── patternDetector.js   // Detects data patterns
├── analysers/
│   ├── basicStats.js        // Core statistics
│   ├── distributions.js     // Distribution testing
│   ├── outliers.js          // Outlier detection
│   ├── cart.js              // Decision trees
│   ├── regression.js        // Regression suite
│   ├── correlations.js      // Correlation analysis
│   ├── timeseries.js        // Temporal analysis
│   ├── australian.js        // AU validation
│   └── mlReadiness.js       // ML assessment
├── formatters/
│   ├── textFormatter.js     // LLM-ready output
│   └── treeFormatter.js     // CART tree display
└── utils/
    ├── sampling.js          // Stratified sampling
    └── performance.js       // Progress tracking
```

### 6. Error Handling & Edge Cases

- **Empty Columns**: Skip with notation
- **Constant Values**: Flag as low-information
- **Memory Limits**: Automatic sampling activation
- **Malformed Data**: Graceful degradation with warnings
- **Mixed Types**: Intelligent type coercion

### 7. Future Extensibility

The architecture supports easy addition of:
- New statistical tests
- Domain-specific validations
- Additional output formats
- Language-specific analysis (beyond Australian)
- Integration with other DataPilot commands

## Success Metrics

1. **Completeness**: 100% of applicable analyses auto-detected
2. **Performance**: 95% of files processed in <30 seconds
3. **Accuracy**: All statistical tests validated against R/Python
4. **Usability**: Zero configuration required
5. **LLM Integration**: Output directly usable in ChatGPT/Claude

## Example Use Cases

1. **Business Analyst**: "What patterns exist in our sales data?"
2. **Data Scientist**: "Is this dataset ready for machine learning?"
3. **Finance Team**: "Are there any anomalies in our transactions?"
4. **Product Manager**: "What customer segments should we target?"
5. **Operations**: "How does our performance vary by time and location?"

## Testing Requirements

1. **Statistical Validation**:
   - Compare results with R/Python implementations
   - Test on known distributions
   - Validate edge cases

2. **Performance Testing**:
   - Files from 1KB to 10GB
   - Various column counts (1-1000)
   - Different data types mix

3. **Australian Validation**:
   - All postcode ranges
   - Phone number formats
   - Business identifier formats

4. **Integration Testing**:
   - Output compatibility with LLMs
   - Cross-platform functionality
   - Memory usage under limits

## Documentation Requirements

1. **User Documentation**:
   - Clear explanation of each analysis
   - Interpretation guidelines
   - Example outputs

2. **Technical Documentation**:
   - Algorithm descriptions
   - Performance characteristics
   - Extension guidelines

## Launch Criteria

- [ ] All core analyses implemented
- [ ] Performance targets met
- [ ] Test coverage >90%
- [ ] Documentation complete
- [ ] Example outputs validated
- [ ] Memory usage optimised
- [ ] Australian validations working

## Conclusion

This expanded EDA feature transforms DataPilot from a simple CSV analyser into a comprehensive data analysis tool while maintaining its core philosophy of zero configuration and LLM-ready output. By intelligently detecting data characteristics and automatically running relevant analyses, it provides users with deep insights without requiring statistical expertise or complex configuration.