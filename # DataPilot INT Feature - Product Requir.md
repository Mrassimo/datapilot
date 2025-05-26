# DataPilot INT Feature - Product Requirements Document

## Executive Summary

The Data Integrity (INT) feature evolves from a basic validation tool into a comprehensive Data Quality Intelligence system. Following DataPilot's zero-configuration philosophy, it automatically detects data quality issues, discovers business rules, and provides actionable fixes without requiring any flags or options.

## Design Philosophy

1. **Zero Configuration**: Run `datapilot int file.csv` - no flags, no setup
2. **Intelligent Detection**: Automatically discovers business rules and quality issues
3. **Actionable Output**: Provides specific fixes, not just problem identification
4. **Quality Framework**: Implements industry-standard data quality dimensions
5. **Progressive Analysis**: Basic issues first, then deeper intelligence

## Feature Overview

### Current State
- Duplicate detection
- Email format validation
- Basic inconsistency checks
- Simple quality metrics

### Expanded Capabilities
- Six-dimensional data quality framework
- Automatic business rule discovery
- Fuzzy duplicate detection
- Cross-column validation
- Temporal consistency analysis
- Statistical anomaly detection
- Referential integrity checking
- Pattern-based fraud detection
- Automated fix generation
- Quality trend monitoring

## Detailed Feature Specifications

### 1. Intelligent Quality Detection

The system automatically determines which analyses to run:

```javascript
Detection Logic:
- Referential Integrity: If column names suggest relationships (id, _id suffix)
- Business Rules: If patterns show >95% consistency
- Fuzzy Matching: If exact duplicates <1% but similar names exist
- Temporal Analysis: If date/time columns present
- Statistical Anomalies: If numerical columns have suspicious patterns
- Australian Validation: If AU-specific patterns detected
```

### 2. Data Quality Framework

Based on DAMA-DMBOK and ISO 8000 standards:

#### 2.1 Quality Dimensions

**Completeness (Weight: 20%)**
- Null value analysis
- Required field detection
- Partial record identification
- Missing pattern analysis (MCAR/MAR/MNAR)

**Validity (Weight: 20%)**
- Format validation
- Range checking
- Pattern matching
- Data type consistency

**Accuracy (Weight: 20%)**
- Statistical outlier detection
- Business rule violations
- Referential integrity
- Impossible value detection

**Consistency (Weight: 15%)**
- Cross-column validation
- Duplicate detection
- Format standardisation needs
- Naming convention analysis

**Timeliness (Weight: 15%)**
- Data freshness analysis
- Update frequency patterns
- Stale record identification
- Temporal consistency

**Uniqueness (Weight: 10%)**
- Exact duplicate detection
- Fuzzy duplicate analysis
- Key uniqueness validation
- Natural key discovery

### 3. Core Analysis Modules

#### 3.1 Business Rule Discovery

Automatically mines rules from data patterns:

```
BUSINESS RULE DISCOVERY:

Automatically Detected Rules (Confidence >95%):

1. AGE_CONSTRAINT: age BETWEEN 18 AND 99
   - Confidence: 99.8% (10,234/10,245 records)
   - Violations: 11 records
   - Examples: age=156, age=0, age=-1
   - Suggested Fix: Add CHECK constraint

2. EMAIL_UNIQUENESS: email unique when status='active'
   - Confidence: 98.9%
   - Pattern: Duplicates only occur with status='inactive'
   - Implication: Soft delete pattern detected
   - Suggested Implementation: Unique index on (email) WHERE status='active'

3. DERIVED_FIELD_RULE: total_amount = sum(line_items)
   - Confidence: 97.2%
   - Violations: 234 records
   - Discrepancy range: $0.01 to $45.67
   - Likely cause: Rounding errors or missing items
```

#### 3.2 Referential Integrity Analysis

Detects relationships and validates them:

```
REFERENTIAL INTEGRITY ANALYSIS:

Detected Relationships:
1. orders.customer_id -> customers.id
   - Type: Many-to-one
   - Orphaned records: 234 (2.2%)
   - Impact: $45,678 unattributed revenue
   - Fix: Add foreign key constraint

2. products.category_id -> categories.id  
   - Type: Many-to-one
   - Orphaned records: 0 ✓
   - Constraint exists: Likely

Cross-File References (if multiple files):
- Would check: order_items.product_id -> products.csv:id
- Note: Run with multiple files for full analysis
```

#### 3.3 Fuzzy Duplicate Detection

Advanced matching algorithms:

```
FUZZY DUPLICATE ANALYSIS:

Algorithm Stack:
- Levenshtein distance (edit distance)
- Jaro-Winkler (typos and transpositions)
- Soundex/Metaphone (phonetic matching)
- Token sorting (word order variations)

Near-Duplicate Groups Found: 127

[Group 1] Customer Records (94% similarity)
├─ ID: 1234 | John Smith | 123 Main St | Sydney NSW 2000
├─ ID: 5678 | Jon Smith | 123 Main Street | Sydney NSW 2000
└─ ID: 9012 | John Smyth | 123 Main St | Sydney NSW 2000

Similarity Breakdown:
- Name: 92% (phonetic match)
- Address: 96% (abbreviation difference)
- Other fields: 100% match

Recommendation: Merge after human verification
Automated merge script provided below
```

#### 3.4 Temporal Consistency Analysis

Validates time-based logic:

```
TEMPORAL CONSISTENCY ANALYSIS:

Event Sequence Violations:
1. created_date > first_purchase_date
   - Count: 45 records
   - Pattern: All from bulk import on 2024-03-15
   - Fix: Set created_date = MIN(created_date, first_purchase_date)

2. last_login < last_purchase (for online orders)
   - Count: 123 records  
   - Implication: Guest checkout or tracking issue
   - Investigation needed

Date Logic Validation:
- Future dates: 12 records have dates > today
- Impossible dates: 3 records with dates < business founding
- Consistency: 99.2% follow expected patterns ✓

Data Freshness Analysis:
- 15.3% not updated in >12 months
- Critical staleness in:
  * email: 234 records (2.2%)
  * phone: 345 records (3.3%)
  * address: 456 records (4.3%)
```

#### 3.5 Pattern-Based Anomaly Detection

Statistical and logical anomalies:

```
PATTERN-BASED ANOMALIES:

Statistical Anomalies:
1. Benford's Law Test (revenue_amount)
   - Expected vs Actual first digit distribution
   - Chi-square: 45.6, p-value: <0.001
   - Interpretation: Possible data manipulation
   - Action: Investigate manual adjustments

2. Round Number Bias
   - 234 transactions at exactly $100.00 (expected: 12)
   - 123 customers with exactly 10 purchases (expected: 8)
   - Statistical probability: <0.0001
   - Likely: Test data or manual overrides

Hidden Patterns:
1. Employee Indicator Pattern
   - customer_id ending in '999': 3x higher discounts
   - email domain '@company.com': Free shipping always
   - Recommendation: Add explicit employee flag

2. System Account Pattern  
   - Usernames 'test001' through 'test099' detected
   - All have $0 revenue but active status
   - Recommendation: Exclude from analytics
```

#### 3.6 Cross-Column Validation

Logical consistency between fields:

```
CROSS-COLUMN VALIDATION:

Logical Inconsistencies Found:

1. total_spent vs sum(order_amounts)
   - Affected: 234 customers (2.2%)
   - Total discrepancy: $123,456
   - Pattern: All discrepancies negative
   - Cause: Returns not reflected in total_spent
   - Fix: Recalculate with returns included

2. age vs account_age impossibility
   - 23 customers would have been <13 at signup
   - Violates terms of service
   - Either age or created_date incorrect
   - Manual review required

3. Geographic impossibilities
   - 12 orders with shipping_time < distance/max_speed
   - Example: Perth to Sydney in 2 hours
   - Likely: Timezone or data entry issue

Calculated Field Validation:
- profit_margin = (revenue - cost) / revenue
  * Valid: 98.7%
  * Errors: Negative revenue cases
- customer_lifetime = months(last_order - first_order)
  * Valid: 99.2%
  * Errors: Last < first
```

#### 3.7 Data Quality Scoring

Comprehensive scoring system:

```
DATA QUALITY SCORECARD:

Overall Score: 84.3/100 (B+)

Dimensional Breakdown:
┌─────────────────┬────────┬────────────────────────┐
│ Dimension       │ Score  │ Key Issues             │
├─────────────────┼────────┼────────────────────────┤
│ Completeness    │ 92/100 │ 7.6% missing values    │
│ Validity        │ 86/100 │ Format inconsistencies │
│ Accuracy        │ 81/100 │ Statistical anomalies  │
│ Consistency     │ 78/100 │ Duplicate variations   │
│ Timeliness      │ 85/100 │ 15% stale records      │
│ Uniqueness      │ 89/100 │ Fuzzy duplicates found │
└─────────────────┴────────┴────────────────────────┘

Quality Trend (if historical data available):
- 30-day average: 83.2 (improving ↑)
- Quality velocity: +0.3 points/month

Benchmark Comparison:
- Industry average: 76/100
- Your score: 84.3/100 (above average ✓)
```

#### 3.8 Australian-Specific Validation

When Australian patterns detected:

```
AUSTRALIAN DATA VALIDATION:

ABN/ACN Validation:
- Valid format: 234/245 (95.5%)
- Active status: 223/234 (95.3%)
- Defunct: 11 companies
- Invalid check digit: 11 records

Postcode Analysis:
- Valid ranges: 99.2%
- State mismatches: 23 records
  * Example: 2000 (NSW) with state='VIC'
- Distribution:
  * NSW: 45.2%
  * VIC: 32.1%
  * QLD: 15.3%

Phone Number Validation:
- Mobile (04xx): 67.8% valid
- Landline: 22.1% valid
- Format issues:
  * Missing leading 0: 89 records
  * International format mixed: 34 records
- Carrier detection:
  * Telstra: 45.2%
  * Optus: 31.3%
  * Vodafone: 23.5%

Address Standardisation:
- GNAF matchable: 87.3%
- Common issues:
  * St vs Street: 234 instances
  * Missing state: 45 instances
  * Incorrect suburb spelling: 78 instances
```

### 4. Automated Fix Generation

Provides ready-to-run fixes:

```
AUTOMATED FIX SCRIPTS:

-- Priority 1: Referential Integrity
ALTER TABLE orders 
ADD CONSTRAINT fk_customer 
FOREIGN KEY (customer_id) 
REFERENCES customers(id);

-- Priority 2: Standardise Phone Format
UPDATE customers 
SET phone = CONCAT('0', phone)
WHERE LENGTH(phone) = 9 
  AND phone REGEXP '^[2-9][0-9]{8}$';

-- Priority 3: Fix Temporal Inconsistencies
UPDATE customers 
SET created_date = LEAST(created_date, first_purchase_date)
WHERE created_date > first_purchase_date;

-- Priority 4: Remove Exact Duplicates
WITH duplicates AS (
  SELECT id, ROW_NUMBER() OVER (
    PARTITION BY email, name, address 
    ORDER BY created_date
  ) AS rn
  FROM customers
)
DELETE FROM customers 
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

Python Script for Fuzzy Matching:
```python
# Generated merge script for fuzzy duplicates
import pandas as pd

# Group 1 merge
merge_ids = [5678, 9012]  # Merge into 1234
primary_id = 1234

# Transfer relationships
update_orders = f"UPDATE orders SET customer_id = {primary_id} WHERE customer_id IN ({','.join(map(str, merge_ids))})"
# ... (complete script in output)
```
```

### 5. Output Structure

The complete output follows this flow:

```
=== DATA INTEGRITY REPORT ===
Dataset: [filename]
Generated: [timestamp]
Quality Framework: ISO 8000 / DAMA-DMBOK Aligned

OVERALL DATA QUALITY SCORE
↓
CRITICAL ISSUES (immediate action required)
↓
WARNINGS (should be addressed)
↓
OBSERVATIONS (for awareness)
↓
BUSINESS RULE DISCOVERY
↓
REFERENTIAL INTEGRITY ANALYSIS
↓
FUZZY DUPLICATE ANALYSIS
↓
CROSS-COLUMN VALIDATION
↓
TEMPORAL CONSISTENCY ANALYSIS
↓
PATTERN-BASED ANOMALIES
↓
[AUSTRALIAN DATA VALIDATION] (if detected)
↓
DATA QUALITY SCORECARD
↓
STATISTICAL PROCESS CONTROL
↓
RECOMMENDATION PRIORITY MATRIX
↓
AUTOMATED FIX SCRIPTS
↓
DATA QUALITY CERTIFICATION CHECKLIST
```

### 6. Performance Specifications

- **Scalability**:
  ```javascript
  if (rows > 100,000) {
    - Sample for fuzzy matching (n=10,000)
    - Stream process for validation
    - Parallel process independent checks
  }
  ```

- **Performance Targets**:
  - <2 seconds for basic validation (<10MB)
  - <30 seconds for complete analysis (<100MB)
  - <5 minutes for large files (<1GB)

### 7. Technical Implementation

#### 7.1 Dependencies
```json
{
  "dependencies": {
    "fuzzyset.js": "^1.0.0",      // Fuzzy matching
    "validator": "^13.0.0",        // Format validation
    "simple-statistics": "^7.8.0", // Statistical tests
    "australian-abn": "^1.0.0",    // ABN validation
    "benford": "^1.0.0",          // Fraud detection
    "csv-parse": "^5.5.0",        // CSV parsing
    "chalk": "^5.3.0"             // Colored output
  }
}
```

#### 7.2 Module Structure
```
src/commands/int/
├── index.js                    // Main orchestrator
├── detectors/
│   ├── ruleDetector.js        // Business rule mining
│   ├── relationshipDetector.js // Referential integrity
│   ├── anomalyDetector.js     // Statistical anomalies
│   └── patternDetector.js     // Pattern recognition
├── validators/
│   ├── completeness.js        // Null analysis
│   ├── validity.js            // Format checking
│   ├── accuracy.js            // Outlier detection
│   ├── consistency.js         // Cross-column checks
│   ├── timeliness.js          // Freshness analysis
│   └── uniqueness.js          // Duplicate detection
├── analysers/
│   ├── fuzzyMatcher.js        // Near-duplicate detection
│   ├── temporalAnalyser.js    // Time consistency
│   ├── australianValidator.js  // AU-specific checks
│   └── qualityScorer.js       // Scoring system
├── fixers/
│   ├── sqlGenerator.js        // SQL fix scripts
│   ├── pythonGenerator.js     // Python fix scripts
│   └── recommendationEngine.js // Priority matrix
└── utils/
    ├── sampling.js            // Smart sampling
    └── streaming.js           // Large file handling
```

### 8. Error Handling & Edge Cases

- **Single Column Files**: Run applicable validations only
- **No Patterns Found**: Report high quality, no issues
- **All Nulls Column**: Flag for removal consideration
- **Encrypted/Hashed Data**: Skip validation, note presence
- **Binary Data**: Detect and skip with warning

### 9. Integration Points

- **With EDA**: Quality issues affect statistical validity
- **With ENG**: Quality rules become constraints
- **With VIS**: Highlight quality issues in visualisations
- **With LLM**: Quality context affects recommendations

### 10. Success Metrics

1. **Issue Detection Rate**: >95% of known issues caught
2. **False Positive Rate**: <5% incorrect warnings
3. **Fix Success Rate**: >90% of automated fixes work
4. **Performance**: Meet targets for 95% of files
5. **User Satisfaction**: Quality scores align with reality

## Example Use Cases

1. **Data Engineer**: "What quality issues exist before I build the pipeline?"
2. **Analyst**: "Can I trust this data for my analysis?"
3. **Data Steward**: "What business rules should we enforce?"
4. **Migration Team**: "What issues need fixing before migration?"
5. **Compliance**: "Does our data meet quality standards?"

## Testing Requirements

1. **Validation Accuracy**:
   - Test against known dirty datasets
   - Validate all fix scripts work correctly
   - Compare scores with manual assessment

2. **Rule Discovery**:
   - Test with various business domains
   - Validate confidence thresholds
   - Ensure no false patterns

3. **Performance Testing**:
   - Various file sizes and shapes
   - Different data quality levels
   - Memory usage validation

4. **Edge Cases**:
   - Empty files
   - Single row/column
   - All duplicates
   - Perfect quality data

## Future Extensibility

- Machine learning for rule discovery
- Cross-file validation (foreign keys)
- Historical quality tracking
- Industry-specific validations
- Custom rule definitions

## Launch Criteria

- [ ] All quality dimensions implemented
- [ ] Business rule discovery working
- [ ] Fuzzy matching accurate
- [ ] Fix scripts tested
- [ ] Australian validation complete
- [ ] Performance targets met
- [ ] Documentation complete
- [ ] Example outputs validated

## Conclusion

The expanded INT feature transforms DataPilot from a simple integrity checker into a comprehensive Data Quality Intelligence system. By automatically discovering business rules, detecting complex quality issues, and providing actionable fixes, it helps users ensure data quality before it causes problems downstream. The zero-configuration approach means users get all this intelligence by simply running `datapilot int file.csv`.