# 🛩️ DataPilot

**Professional CSV analysis CLI. Transform data into insights in seconds.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-14+-green.svg)](https://nodejs.org/)
[![npm](https://img.shields.io/npm/v/datapilot.svg)](https://www.npmjs.com/package/datapilot)
[![Tests](https://img.shields.io/badge/Tests-Passing-brightgreen.svg)](#)

## What is DataPilot?

DataPilot is a command-line tool that performs comprehensive analysis on CSV files in seconds. It's designed for data professionals who need quick, thorough insights without writing code or loading data into complex tools.

**Why DataPilot?**
- 🚀 **Instant Analysis**: Get statistical summaries, quality checks, and visualisation recommendations in one command
- 🧠 **AI-Ready Output**: All results formatted for easy copy-paste into ChatGPT or Claude
- 📊 **Five Analysis Modes**: From basic statistics to data engineering insights
- 🎯 **Smart & Fast**: Handles massive files with intelligent sampling
- 🔧 **Zero Configuration**: Works out-of-the-box with auto-detection of formats

## Installation

### Global Install (Recommended)
```bash
npm install -g datapilot
```

### Local/Offline Install
```bash
# Download the package
npm pack datapilot
# Creates datapilot-1.1.1.tgz

# Install from local file
npm install -g ./datapilot-1.1.1.tgz

# Or on another machine without internet
# Copy the .tgz file, then:
npm install -g ./datapilot-1.1.1.tgz
```

## Quick Start

```bash
# Analyze any CSV file - runs all 5 analysis modes
datapilot all data.csv

# Interactive terminal UI for guided analysis
datapilot ui

# Specific analysis mode
datapilot eda sales.csv
```

## Features

### 📊 Five Specialized Analysis Modes

#### 1. **EDA (Exploratory Data Analysis)**
Comprehensive statistical analysis including:
- Descriptive statistics (mean, median, mode, standard deviation)
- Distribution analysis with histograms and percentiles
- Correlation matrices between numeric columns
- Outlier detection using IQR and Z-score methods
- Missing value patterns and data completeness

#### 2. **INT (Data Integrity Check)**
Deep quality assessment that examines:
- Data quality scores across 6 dimensions (completeness, validity, accuracy, consistency, timeliness, uniqueness)
- Pattern validation (emails, phones, postcodes, dates)
- Referential integrity between columns
- Anomaly detection and data drift
- Generates fix recommendations with Python/SQL code

#### 3. **VIS (Visualisation Recommendations)**
Smart chart selection based on:
- Data types and relationships analysis
- Automated chart type recommendations (scatter, bar, line, heatmap, etc.)
- Colour palette suggestions for accessibility
- Anti-pattern detection (avoiding chart junk)
- Specific implementation advice for your data

#### 4. **ENG (Data Engineering Archaeology)**
Discovers hidden data architecture:
- Schema inference and documentation
- Relationship detection between tables
- Technical debt identification
- Data lineage tracking
- Builds persistent knowledge base for future analyses

#### 5. **LLM (AI Context Generation)**
Creates structured summaries perfect for AI assistants:
- Key findings in bullet points
- Insight synthesis across all analyses
- Ready-to-paste format for ChatGPT/Claude
- Includes context and recommendations
- Highlights actionable insights

### 🎯 Key Capabilities

- **Smart Sampling**: Handles massive files (tested up to 1GB+) with intelligent sampling
- **Auto-Detection**: Automatically detects encoding, delimiters, data types, and formats
- **Australian Awareness**: Native support for AU postcodes, phone numbers, ABNs, and date formats
- **Memory System**: Learns patterns across analyses, building institutional knowledge
- **Export Ready**: All outputs optimised for copy-paste into AI tools or reports

## Usage

```bash
# Complete analysis suite
datapilot all data.csv
datapilot all data.csv --output report.txt

# Individual analyses
datapilot eda sales.csv              # Exploratory analysis
datapilot int inventory.csv          # Data quality check
datapilot vis metrics.csv            # Visualization recommendations
datapilot eng warehouse.csv          # Data engineering insights
datapilot llm insights.csv           # AI-ready summaries

# Options
--output <file>        Save results to file
--quick               Fast mode for large files
--encoding <type>     Force encoding (utf8, latin1)
--delimiter <char>    Force delimiter (comma, semicolon, tab)
```

## Example Output

Here's what you get from a single command:

```bash
datapilot eda sales.csv
```

```
🔍 Exploratory Data Analysis
━━━━━━━━━━━━━━━━━━━━━━━━━

📊 Dataset Overview:
• 10,000 rows × 15 columns
• Memory usage: 1.2 MB

📈 Numeric Columns (6):
┌─────────────┬────────┬────────┬────────┬────────┐
│ Column      │ Mean   │ Std    │ Min    │ Max    │
├─────────────┼────────┼────────┼────────┼────────┤
│ revenue     │ $2,345 │ $1,234 │ $10    │ $9,999 │
│ quantity    │ 25.4   │ 15.2   │ 1      │ 100    │
└─────────────┴────────┴────────┴────────┴────────┘

🔗 Correlations:
• revenue ↔ quantity: 0.85 (strong positive)
• price ↔ discount: -0.42 (moderate negative)

⚠️ Outliers Detected:
• revenue: 23 outliers (>$8,000)
• quantity: 5 outliers (>95 units)
```

## Real-World Use Cases

- **Data Scientists**: Quick data profiling before model building
- **Analysts**: Validate data quality before reporting
- **Engineers**: Understand schema and relationships in unfamiliar datasets
- **Consultants**: Generate instant insights for client presentations
- **AI Users**: Create rich context for ChatGPT/Claude analysis

## Performance

- **< 1MB**: Instant analysis (< 1 second)
- **1-10MB**: Fast processing (2-5 seconds)
- **10-100MB**: Smart sampling (5-10 seconds)
- **> 100MB**: Efficient streaming (10-30 seconds)

## Documentation

- [Quick Start Guide](docs/QUICK-START.md)
- [Installation Guide](docs/INSTALLATION.md) 
- [Command Deep Dive](docs/COMMAND_DEEP_DIVE.md)

## License

MIT © DataPilot Contributors