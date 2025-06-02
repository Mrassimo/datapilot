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
- 📊 **Smart 3-Command Structure**: Simple yet powerful - run, vis, or all
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
# Complete analysis - everything in one go
datapilot all data.csv

# Comprehensive analysis - statistics and quality checks
datapilot run data.csv

# Business intelligence - visualization and data engineering insights
datapilot vis data.csv

# Save output to file
datapilot all data.csv --output analysis.txt

# Quick mode for large files
datapilot all large_dataset.csv --quick
```

## 📊 The Smart 3-Command Structure

### 1. **`run` - Comprehensive Data Analysis**
Combines statistical analysis with quality assessment in one powerful command:

```bash
datapilot run dataset.csv
```

**What's Included:**
- **Exploratory Data Analysis (EDA)**
  - Descriptive statistics (mean, median, mode, std dev, variance)
  - Distribution analysis (skewness, kurtosis, normality tests)
  - Correlation analysis between numeric columns
  - Outlier detection (IQR and Z-score methods)
  - Pattern detection (Benford's Law for fraud detection)
  
- **Data Integrity Checks (INT)**
  - Six quality dimensions: Completeness, Validity, Accuracy, Consistency, Timeliness, Uniqueness
  - Business rule detection and validation
  - Format validation (emails, phones, dates, etc.)
  - Duplicate and anomaly detection
  
- **LLM-Optimized Formatting**
  - Key findings highlighted upfront
  - Structured output ready for AI consumption
  - Actionable insights and recommendations

**Example Output:**
```
🤖 DATAPILOT COMPREHENSIVE ANALYSIS
===================================
Dataset: sales.csv (10,234 records)

EXECUTIVE SUMMARY
═════════════════
📊 Data Quality: A+ (96/100)
🎯 Key Statistical Insights:
   1. Revenue shows strong seasonal patterns (Q4 +35%)
   2. Customer segmentation reveals 80/20 distribution
   3. 3 numeric columns show non-normal distributions

DATA QUALITY ASSESSMENT
══════════════════════
📊 Quality Dimensions:
   • Completeness: 98.5% ✅
   • Validity: 99.2% ✅
   • Accuracy: 97.8% ✅
   • Consistency: 96.3% ✅
   • Uniqueness: 94.1% ✅
   • Timeliness: Current ✅
```

### 2. **`vis` - Business Intelligence Suite**
Combines visualization recommendations with data engineering insights:

```bash
datapilot vis dataset.csv
```

**What's Included:**
- **Visualization Recommendations (VIS)**
  - Task-based chart selection (compare, trend, distribute, etc.)
  - Perceptual optimization for clarity
  - Color palette recommendations
  - Accessibility considerations
  
- **Data Engineering Archaeology (ENG)**
  - Schema inference and documentation
  - Relationship detection (foreign keys, joins)
  - Technical debt identification
  - Performance recommendations
  - Persistent knowledge base that learns over time

**Example Output:**
```
📊 DATAPILOT BUSINESS INTELLIGENCE SUITE
=======================================
Dataset: orders.csv (45,678 records)

VISUALIZATION RECOMMENDATIONS
════════════════════════════
Priority 1: Time Series Analysis
- Chart: Multi-line chart with annotations
- Variables: order_date (x) vs revenue, quantity (y)
- Insight: Strong weekly seasonality detected
- Enhancement: Add moving average overlay

DATA ENGINEERING INSIGHTS
════════════════════════
📋 Table Analysis:
   • Purpose: Transactional order data
   • Domain: E-commerce
   • Quality Score: 8/10
   • Technical Debt: 12 hours estimated

🔗 Detected Relationships:
   1. orders.customer_id → customers.id (many-to-one)
   2. orders.product_id → products.id (many-to-one)
```

### 3. **`all` - Complete Analysis Suite**
Runs both `run` and `vis` for the most comprehensive analysis:

```bash
datapilot all dataset.csv
```

This command provides:
- Everything from `run` (statistics + quality)
- Everything from `vis` (visualization + engineering)
- Integrated insights across all dimensions
- Complete documentation ready for any use case

## 🎯 Advanced Features

### Smart File Handling
```bash
# Auto-detect encoding and delimiter
datapilot run data.csv

# Force specific encoding
datapilot run data.csv --encoding latin1

# Force specific delimiter  
datapilot run data.csv --delimiter ";"

# Handle files without headers
datapilot run data.csv --no-header
```

### Performance Options
```bash
# Quick mode for large files (>50MB)
datapilot all large.csv --quick

# Custom timeout for complex analyses
datapilot run complex.csv --timeout 120000

# Force analysis despite warnings
datapilot all problematic.csv --force
```

### Output Management
```bash
# Save to file
datapilot all data.csv --output report.txt

# Quiet mode (no progress indicators)
datapilot all data.csv --quiet
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
datapilot run train.csv

# Generate insights for stakeholders
datapilot all results.csv --output insights.txt
```

### Data Engineers
```bash
# Understand schemas and relationships
datapilot vis legacy_db.csv

# Complete documentation
datapilot all database_export.csv --output docs.txt
```

### Business Analysts
```bash
# Validate data quality
datapilot run monthly_sales.csv

# Get visualization recommendations
datapilot vis kpi_metrics.csv
```

## 📚 What's Under the Hood?

While DataPilot presents a simple 3-command interface, it's powered by sophisticated analysis engines:

- **Statistical Engine**: Advanced statistics including distribution tests, correlation analysis, and pattern detection
- **Quality Engine**: Six-dimensional data quality assessment based on industry standards
- **Visualization Engine**: Task-based chart selection with perceptual optimization
- **Engineering Engine**: Schema inference, relationship detection, and architectural insights
- **AI Formatting Engine**: Structured output optimized for LLM consumption

All these engines work together seamlessly when you run any of the three main commands.

## 🔧 Troubleshooting

### Common Issues

**Large files taking too long?**
```bash
datapilot all large.csv --quick  # Use sampling
datapilot run large.csv --timeout 300000  # 5-minute timeout
```

**Encoding problems?**
```bash
datapilot run data.csv --encoding latin1
datapilot run data.csv --encoding utf16le
```

**Unusual delimiters?**
```bash
datapilot run data.csv --delimiter ";"
datapilot run data.csv --delimiter "|"
datapilot run data.csv --delimiter "\\t"  # Tab
```

## 📁 Repository Structure

```
datapilot/
├── bin/                    # CLI entry point
├── src/                    # Source code
│   ├── commands/          # Command implementations (eda, int, vis, eng, llm)
│   └── utils/             # Shared utilities
├── docs/                   # Documentation
│   ├── examples/          # Sample outputs from DataPilot
│   ├── planning/          # Business strategy documents
│   ├── QUICK-START.md     # Getting started guide
│   ├── INSTALLATION.md    # Installation instructions
│   └── ...               # Additional documentation
├── tests/                 # Test suite
│   ├── fixtures/          # Test datasets
│   ├── unit/             # Unit tests
│   └── benchmarks/       # Performance tests
├── data/                  # Sample datasets
│   └── samples/          # Real-world example datasets
└── scripts/              # Build and installation scripts
```

### Key Directories

- **`docs/examples/`** - Contains sample outputs from DataPilot commands showing what to expect
- **`docs/planning/`** - Business strategy and evaluation documents  
- **`data/samples/`** - Sample datasets for testing and demonstration
- **`tests/fixtures/`** - Curated test datasets for comprehensive testing
- **`src/commands/`** - Implementation of each DataPilot command (eda, int, vis, eng, llm)

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 🙏 Acknowledgments

DataPilot is built with powerful open-source libraries including csv-parse, simple-statistics, chalk, and ora.

---

**Ready to transform your data into insights?** Install DataPilot today and see what your data has been trying to tell you!

```bash
npm install -g datapilot
datapilot all your-data.csv
```