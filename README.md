# 🛩️ DataPilot CLI

**Professional CSV analysis CLI. Transform data into insights in seconds.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-14+-green.svg)](https://nodejs.org/)
[![npm](https://img.shields.io/npm/v/datapilot.svg)](https://www.npmjs.com/package/datapilot)
[![Tests](https://img.shields.io/badge/Tests-Passing-brightgreen.svg)](#)

## What is DataPilot?

DataPilot is a powerful command-line tool that performs comprehensive analysis on CSV files in seconds. It's designed for data professionals who need quick, thorough insights without writing code or loading data into complex tools.

**✨ Key Benefits:**
- 🚀 **Instant Analysis**: Get statistical summaries, quality checks, and visualization recommendations in one command
- 🧠 **AI-Ready Output**: All results formatted for easy copy-paste into ChatGPT, Claude, or any LLM
- 📊 **Five Analysis Modes**: From basic statistics to advanced data engineering insights
- 🎯 **Smart & Fast**: Handles massive files with intelligent sampling and streaming
- 🔧 **Zero Configuration**: Works out-of-the-box with auto-detection of formats, encodings, and delimiters
- 💪 **Production Ready**: Battle-tested on real-world datasets with robust error handling

## Installation

### Global Install (Recommended)
```bash
npm install -g datapilot
```

### Via npx (No Install Required)
```bash
npx datapilot all data.csv
```

### Local/Offline Install
```bash
# Clone the repository
git clone https://github.com/yourusername/datapilot.git
cd datapilot

# Install dependencies and build
npm install
npm run build

# Link globally
npm link
```

## Quick Start

```bash
# Complete analysis suite - runs all 5 analysis modes
datapilot all data.csv

# Save output to file
datapilot all data.csv --output analysis.txt

# Quick mode for large files
datapilot all large_dataset.csv --quick

# Specific analysis mode
datapilot eda sales.csv      # Exploratory Data Analysis
datapilot int quality.csv    # Data Integrity Check
datapilot vis metrics.csv    # Visualization Recommendations
```

## 📊 Five Specialized Analysis Modes

### 1. **EDA (Exploratory Data Analysis)**
Comprehensive statistical analysis that provides deep insights into your data:

```bash
datapilot eda dataset.csv
```

**Features:**
- **Descriptive Statistics**: Mean, median, mode, standard deviation, variance
- **Distribution Analysis**: Skewness, kurtosis, normality tests (Shapiro-Wilk, Jarque-Bera)
- **Percentile Breakdown**: 5th, 25th, 50th, 75th, 95th percentiles
- **Correlation Analysis**: Pearson correlations between all numeric columns
- **Outlier Detection**: Both IQR and Z-score methods with detailed reporting
- **Pattern Detection**: Benford's Law analysis for fraud detection
- **Missing Value Analysis**: Patterns and impact assessment
- **Column Type Detection**: Automatic inference of data types (numeric, categorical, date, email, phone, etc.)

**Example Output:**
```
════════════════════════════════════════════════════════════
              EXPLORATORY DATA ANALYSIS REPORT
════════════════════════════════════════════════════════════

DATASET OVERVIEW
────────────────────────────────────────
- Total rows: 10,234
- Total columns: 15
- Memory usage: ~2.4 MB
- Numeric columns: 8
- Categorical columns: 5
- Date columns: 2
- Data completeness: 96.3%

COLUMN ANALYSIS
────────────────────────────────────────
[Column: revenue]
Type: float | Non-null: 98.5%

CENTRAL TENDENCY:
  Mean: $2,345.67 | Median: $1,987.50 | Mode: $1,500.00

SPREAD:
  Std Dev: $1,234.56 | Variance: 1.52M
  IQR: $1,876.25 | Range: [$10.00, $9,999.00]
  CV: 52.6%

OUTLIERS:
  IQR method: 23 outliers (2.2%)
  Z-score method: 18 outliers (1.8%)
```

### 2. **INT (Data Integrity Check)**
Deep quality assessment that examines data reliability across multiple dimensions:

```bash
datapilot int dataset.csv
```

**Features:**
- **Six Quality Dimensions**: 
  - Completeness: Missing value analysis
  - Validity: Format and constraint validation
  - Accuracy: Statistical anomaly detection
  - Consistency: Cross-column validation
  - Timeliness: Temporal pattern analysis
  - Uniqueness: Duplicate detection
- **Pattern Validation**: Emails, phones, postcodes, URLs, dates
- **Referential Integrity**: Foreign key and relationship validation
- **Business Rule Detection**: Automatically inferred constraints
- **Fix Generation**: Python and SQL code to clean your data
- **Australian Format Support**: ABN, ACN, postcodes, phone numbers

**Example Output:**
```
════════════════════════════════════════════════════════════
                 DATA INTEGRITY REPORT
════════════════════════════════════════════════════════════

DATA QUALITY SCORES
────────────────────────────────────────
Overall Quality Score: 87.3% (Good)

Dimension Scores:
- Completeness: 94.2% ✓
- Validity: 89.7% ✓
- Accuracy: 91.3% ✓
- Consistency: 78.5% ⚠
- Timeliness: 85.9% ✓
- Uniqueness: 93.1% ✓

CRITICAL ISSUES FOUND
────────────────────────────────────────
1. Invalid email formats: 234 records (2.3%)
   Pattern: Missing '@' symbol
   Fix: Apply email validation regex

2. Inconsistent date formats: 89 records
   Found: MM/DD/YYYY mixed with DD/MM/YYYY
   Fix: Standardize to ISO format
```

### 3. **VIS (Visualization Recommendations)**
Intelligent chart selection based on data characteristics:

```bash
datapilot vis dataset.csv
```

**Features:**
- **Automated Chart Selection**: Based on data types and relationships
- **Task-Based Recommendations**: Comparison, distribution, correlation, time-series
- **Color Palette Suggestions**: Optimized for accessibility and clarity
- **Anti-Pattern Detection**: Warns against misleading visualizations
- **Implementation Guidance**: Specific code examples for popular libraries
- **Dashboard Composition**: Multi-chart layout recommendations

**Example Output:**
```
════════════════════════════════════════════════════════════
              VISUALIZATION ANALYSIS
════════════════════════════════════════════════════════════

RECOMMENDED VISUALIZATIONS
────────────────────────────────────────

1. Revenue Distribution
   Chart Type: Histogram with KDE overlay
   Rationale: Shows distribution shape and identifies modes
   Implementation: Use 20-30 bins with sqrt(n) rule
   Color: Sequential palette (Blues)

2. Revenue vs Quantity Relationship  
   Chart Type: Scatter plot with trend line
   Rationale: Strong correlation (r=0.85) worth exploring
   Enhancement: Add size encoding for profit margin
   Color: Diverging palette for profit/loss
```

### 4. **ENG (Data Engineering Archaeology)**
Discovers hidden data architecture and builds knowledge over time:

```bash
datapilot eng analyze *.csv    # Analyze multiple files
datapilot eng report           # Generate architecture report
```

**Features:**
- **Schema Inference**: Automatic documentation generation
- **Relationship Detection**: Foreign keys and join opportunities
- **Data Lineage**: Track data flow and dependencies
- **Technical Debt Identification**: Anti-patterns and improvement opportunities
- **Persistent Knowledge Base**: Learns from each analysis
- **Multi-Table Analysis**: Understand entire data warehouses

**Example Output:**
```
════════════════════════════════════════════════════════════
          DATA ENGINEERING ARCHAEOLOGY REPORT
════════════════════════════════════════════════════════════

DISCOVERED RELATIONSHIPS
────────────────────────────────────────
orders.customer_id → customers.id (1:n)
- Join compatibility: 100%
- Orphaned records: 0
- Suggested index: CREATE INDEX idx_orders_customer_id

products.category_id → categories.id (n:1)
- Join compatibility: 98.5%
- Orphaned records: 12
- Data quality issue detected

SCHEMA RECOMMENDATIONS
────────────────────────────────────────
Table: orders
- Add NOT NULL constraint to: order_date, customer_id
- Add CHECK constraint: total_amount > 0
- Add DEFAULT: status = 'pending'
- Consider partitioning by: order_date (3 years of data)
```

### 5. **LLM (AI Context Generation)**
Creates perfectly structured context for AI assistants:

```bash
datapilot llm dataset.csv
```

**Features:**
- **Structured Summaries**: Key findings in hierarchical format
- **Statistical Highlights**: Most important metrics upfront
- **Insight Synthesis**: Combines findings from all analyses
- **Prompt-Ready Format**: Optimized for LLM consumption
- **Actionable Recommendations**: Prioritized next steps
- **Context Preservation**: Maintains nuance while being concise

**Example Output:**
```
════════════════════════════════════════════════════════════
              LLM-READY CONTEXT
════════════════════════════════════════════════════════════

DATASET SUMMARY FOR AI ANALYSIS
────────────────────────────────────────

Dataset: sales_data.csv (10,234 rows × 15 columns)

KEY CHARACTERISTICS:
• Time Period: 2020-01-01 to 2023-12-31 (4 years)
• Primary Metrics: revenue ($10-$9,999), quantity (1-100 units)
• Data Quality: 87.3% (Good, but consistency issues noted)
• Strong Patterns: Seasonal trends, customer segments

CRITICAL INSIGHTS:
1. Revenue Distribution: Right-skewed with outliers >$8,000 (2.2%)
2. Customer Behavior: 80% of revenue from 22% of customers
3. Temporal Pattern: 35% increase in Q4 vs other quarters
4. Data Quality: Date format inconsistencies affecting 89 records

RECOMMENDED ANALYSIS FOCUS:
→ Investigate high-value outlier transactions
→ Segment analysis on top 22% customers
→ Seasonal forecasting for Q4 optimization
→ Data cleaning required before modeling
```

## 🎯 Advanced Features

### Smart File Handling
```bash
# Auto-detect encoding and delimiter
datapilot all data.csv

# Force specific encoding
datapilot all data.csv --encoding latin1

# Force specific delimiter  
datapilot all data.csv --delimiter ";"

# Handle files without headers
datapilot all data.csv --no-header
```

### Performance Options
```bash
# Quick mode for large files (>50MB)
datapilot all large.csv --quick

# Custom timeout for complex analyses
datapilot eda complex.csv --timeout 120000

# Force analysis despite warnings
datapilot all problematic.csv --force
```

### Output Management
```bash
# Save to file
datapilot all data.csv --output report.txt

# Append to existing file
datapilot all data.csv --output report.txt --append

# Quiet mode (no progress indicators)
datapilot all data.csv --quiet
```

### Multi-File Analysis
```bash
# Analyze multiple files for relationships
datapilot eng analyze sales.csv customers.csv products.csv

# Use wildcards
datapilot eng analyze *.csv

# Generate warehouse documentation
datapilot eng report
```

## 📈 Performance & Scalability

DataPilot is optimized for real-world datasets:

| File Size | Performance | Strategy |
|-----------|------------|----------|
| < 1MB | < 1 second | Full analysis |
| 1-10MB | 2-5 seconds | Full analysis with optimizations |
| 10-100MB | 5-15 seconds | Smart sampling (configurable) |
| 100MB-1GB | 15-60 seconds | Streaming with reservoir sampling |
| > 1GB | 1-5 minutes | Progressive sampling with early stopping |

**Memory Usage**: Designed to use <500MB RAM even for massive files

## 🌏 Australian Data Support

Native support for Australian formats:
- **Postcodes**: 4-digit validation with state mapping
- **Phone Numbers**: Mobile and landline formats
- **ABN/ACN**: Validation with check digit verification
- **Dates**: DD/MM/YYYY format priority
- **States**: NSW, VIC, QLD, WA, SA, TAS, ACT, NT recognition

## 🚀 Real-World Use Cases

### Data Scientists & Analysts
```bash
# Quick profiling before modeling
datapilot eda train.csv
datapilot int train.csv  # Check quality issues

# Generate insights for stakeholders
datapilot llm results.csv --output insights.txt
```

### Data Engineers
```bash
# Understand unfamiliar schemas
datapilot eng analyze legacy_db/*.csv

# Document data warehouse
datapilot eng report --output documentation.md
```

### Business Analysts
```bash
# Validate data before reporting
datapilot int monthly_sales.csv

# Get visualization recommendations
datapilot vis kpi_metrics.csv
```

### AI/LLM Users
```bash
# Create context for ChatGPT/Claude
datapilot llm dataset.csv | pbcopy  # Mac
datapilot llm dataset.csv | clip    # Windows
```

## 🛠️ Troubleshooting

### Common Issues

**"No data found in CSV file"**
- Check file encoding: `file -I yourfile.csv`
- Try forcing encoding: `--encoding latin1` or `--encoding utf16le`

**"Parser error: Invalid column definition"**
- Usually caused by special characters in headers
- Try `--no-header` flag or clean column names

**"Analysis timeout"**
- Increase timeout: `--timeout 300000` (5 minutes)
- Use quick mode: `--quick`

**Windows Path Issues**
- Use quotes for paths with spaces: `"C:\My Data\file.csv"`
- Forward slashes also work: `C:/My Data/file.csv`

### Debug Mode
```bash
# Enable verbose output
datapilot all data.csv --verbose

# Check version
datapilot --version

# Get help
datapilot --help
datapilot eda --help  # Command-specific help
```

## 📚 Documentation

- [Installation Guide](docs/INSTALLATION.md) - Detailed setup instructions
- [Command Deep Dive](docs/COMMAND_DEEP_DIVE.md) - Advanced usage for each command
- [API Integration](docs/API.md) - Using DataPilot programmatically
- [Contributing](CONTRIBUTING.md) - How to contribute to DataPilot

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

```bash
# Setup development environment
git clone https://github.com/yourusername/datapilot.git
cd datapilot
npm install
npm run build

# Run tests
npm test
```

## 📄 License

MIT © DataPilot Contributors

---

**Made with ❤️ by the data community, for the data community**