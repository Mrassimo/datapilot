# DataPilot 🚁📊

[![npm version](https://img.shields.io/npm/v/datapilot-cli.svg)](https://www.npmjs.com/package/datapilot-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/node/v/datapilot-cli.svg)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue.svg)](https://www.typescriptlang.org/)
[![Build Status](https://github.com/Mrassimo/datapilot/workflows/CI%2FCD%20Pipeline/badge.svg)](https://github.com/Mrassimo/datapilot/actions)

> **Enterprise-grade streaming multi-format data analysis with comprehensive statistical insights and advanced ML capabilities**

DataPilot is a sophisticated command-line tool that transforms data files into comprehensive statistical reports with advanced machine learning guidance. With universal format support (CSV, JSON, Excel, TSV, Parquet) and memory-efficient streaming processing, it handles datasets of any size while providing deep insights across six analytical dimensions.

## ✨ Key Features

- 📁 **Universal Format Support**: CSV, JSON, Excel (.xlsx/.xls), TSV, Parquet, JSONL with auto-detection
- 🔍 **6-Section Analysis Pipeline**: Overview → Quality → EDA → Visualization → Engineering → Modeling
- 🔗 **Smart Relationship Detection**: Multi-file join analysis with confidence scoring and SQL generation
- 🚀 **Streaming Processing**: Handle files up to 100GB with constant <512MB memory usage
- 📊 **Comprehensive Reports**: Human-readable insights in Markdown, JSON, or YAML formats
- ⚡ **High Performance**: Process 500K-2M rows/minute with automatic optimization
- 🛡️ **Production Ready**: Enterprise security, monitoring, error handling, and proxy support
- 🌍 **Cross-Platform**: Native binaries for Windows, macOS, and Linux
- ♿ **Accessibility First**: WCAG-compliant visualization recommendations
- 🤖 **LLM-Optimized**: Output designed for AI/ML interpretation and prompt engineering
- 🧠 **Advanced ML Guidance**: Intelligent algorithm selection, bias detection, and ethical AI recommendations

## 🚀 Installation

### Option 1: NPM Package (Recommended)
```bash
# Install globally 
npm install -g datapilot-cli

# Verify installation (should show v1.3.1 or later)
datapilot --version
```

> ⚠️ **Important**: Install `datapilot-cli`, NOT `datapilot` (which is deprecated)

### Option 2: NPX (No Installation Required)
```bash
# Always gets latest version, no PATH configuration needed
npx datapilot-cli all data.csv
npx datapilot-cli --version
npx datapilot-cli --help
```

### Option 3: From Source
```bash
git clone https://github.com/Mrassimo/datapilot.git
cd datapilot
npm install
npm run build
npm link
```

## 📋 Quick Start Guide

### Basic Analysis Commands
```bash
# Complete analysis (all 6 sections) - works with any supported format
datapilot all data.csv           # CSV files
datapilot all data.json          # JSON/JSONL files  
datapilot all data.xlsx          # Excel files
datapilot all data.tsv           # Tab-separated files

# Individual sections (auto-detects format)
datapilot overview data.xlsx     # Section 1: File overview & metadata
datapilot quality data.json      # Section 2: Data quality assessment
datapilot eda data.tsv           # Section 3: Exploratory data analysis
datapilot visualization data.csv # Section 4: Chart recommendations
datapilot engineering data.xlsx  # Section 5: ML engineering insights
datapilot modeling data.json     # Section 6: Predictive modeling guidance

# Quick file information (universal)
datapilot info data.xlsx         # Basic file stats (any format)
datapilot validate data.json     # Format validation
```

### Multi-File Join Analysis
```bash
# Analyze relationships between multiple files
datapilot join customers.csv orders.csv products.csv
datapilot engineering customers.csv orders.csv      # Engineering + joins
datapilot discover /path/to/csv/directory           # Auto-discover all relationships

# Interactive wizards
datapilot join-wizard customers.csv orders.csv     # Step-by-step join wizard
datapilot optimize-joins *.csv                     # Performance optimization
```

### Advanced Options
```bash
# Format-specific options
datapilot all data.xlsx --sheet "Sales Data"              # Excel: specific sheet
datapilot all data.json --flatten-objects                 # JSON: flatten nested objects
datapilot all data.txt --format tsv --delimiter "\\t"      # Force format detection
datapilot all data.csv --delimiter ";" --quote "'"        # CSV: custom delimiters

# Output control
datapilot all data.json --format json --output report.json
datapilot all data.xlsx --format yaml --output analysis.yaml
datapilot all data.tsv --quiet --output results/

# Performance tuning
datapilot all huge-file.xlsx --verbose --progress
datapilot all data.json --chunk-size 50000 --memory-limit 1gb
```

## 📁 Supported File Formats

| Format | Extensions | Features | Auto-Detection |
|--------|------------|----------|----------------|
| **CSV** | `.csv` | Auto-delimiter detection, custom quotes | ✅ Content analysis |
| **TSV** | `.tsv`, `.tab` | Tab-separated values, inconsistency detection | ✅ Tab structure validation |
| **JSON** | `.json`, `.jsonl`, `.ndjson` | Nested objects, arrays, JSON Lines | ✅ Structure + syntax validation |
| **Excel** | `.xlsx`, `.xls`, `.xlsm` | Multiple sheets, cell formatting | ✅ Binary signature detection |
| **Parquet** | `.parquet` | Columnar storage, schema detection | ✅ Metadata inspection |

### Format Detection Intelligence
DataPilot automatically detects file formats using a multi-layered approach:
- **File extension** analysis with confidence scoring
- **Content structure** validation (JSON syntax, tab consistency, etc.)
- **Binary signature** detection for Excel/Parquet files
- **Confidence thresholds** to prevent false positives

```bash
# Automatic detection (recommended) - works 99%+ of the time
datapilot all my-data.xlsx                    # Auto-detects Excel
datapilot all logs.jsonl                      # Auto-detects JSON Lines
datapilot all analytics.parquet               # Auto-detects Parquet

# Manual override (when needed for edge cases)
datapilot all ambiguous-file.txt --format tsv # Force TSV parsing
datapilot all data.backup --format json       # Force JSON parsing
```

## 📊 Analysis Sections Explained

| Section | Purpose | Key Outputs | Multi-File Support |
|---------|---------|-------------|-------------------|
| **1. Overview** 🗂️ | File metadata, structure analysis | File size, encoding, headers, data types | Single file |
| **2. Quality** 🧐 | Data quality assessment, completeness | Missing patterns, outliers, quality scores | Single file |
| **3. EDA** 📈 | Statistical analysis, distributions | Univariate/bivariate stats, hypothesis tests | Single file |
| **4. Visualization** 📊 | Chart recommendations, accessibility | Chart types, encodings, WCAG compliance | Single file |
| **5. Engineering** 🏗️ | Schema optimization, **relationship detection** | Index recommendations, **join analysis**, SQL generation | **Multi-file** ✅ |
| **6. Modeling** 🧠 | Algorithm selection, ethics, deployment | ML algorithms, bias detection, ethical AI | Single file |

### Multi-File Relationship Analysis (Section 5)
The engineering command now supports advanced multi-file analysis:

```bash
# Single file: traditional feature engineering
datapilot engineering data.csv
# Output: Schema optimization, feature selection, ML readiness

# Multi-file: relationship detection + engineering  
datapilot engineering customers.csv orders.csv products.csv
# Output: Join relationships, SQL generation, foreign key detection, schema optimization across all files

# Large-scale discovery (up to 50 files)
datapilot discover /data/warehouse/
# Output: Complete relationship map, join recommendations, data lineage
```

**Key Features:**
- **Smart Join Detection**: Identifies relationships with confidence scoring
- **SQL Generation**: Produces optimized JOIN statements
- **Foreign Key Discovery**: Detects primary/foreign key relationships
- **Performance Analysis**: Join optimization recommendations
- **Batch Processing**: Handles large directories efficiently

## 🎯 Common Use Cases

### Business Intelligence
```bash
# Quarterly sales analysis
datapilot all Q4-sales.xlsx --sheet "Summary" 
# Output: Revenue trends, seasonal patterns, forecasting recommendations

# Multi-table business analysis
datapilot engineering customers.csv orders.csv products.csv
# Output: Customer segmentation opportunities, product performance joins
```

### Data Science Workflows  
```bash
# Dataset profiling for ML
datapilot all features.csv
# Output: Feature distributions, correlations, encoding recommendations

# Multi-dataset relationship mapping
datapilot discover /ml-datasets/
# Output: Join opportunities, feature engineering across datasets
```

### Data Quality Auditing
```bash
# Comprehensive quality assessment
datapilot quality customer-database.json
# Output: Completeness scores, outlier detection, data consistency issues

# Cross-table integrity checking
datapilot join customers.csv transactions.csv
# Output: Referential integrity, orphaned records, data quality across relationships
```

## 🔧 Configuration & Performance

### Configuration File (.datapilotrc)
```yaml
# Performance settings
performance:
  chunkSize: 10000
  memoryLimit: "512mb" 
  parallelProcessing: true

# Analysis preferences
analysis:
  sections: [1, 2, 3, 4, 5, 6]
  confidenceLevel: 0.95
  joinConfidenceThreshold: 0.5

# Output formatting
output:
  format: "markdown"
  includeRawData: false
  verboseLogging: false
```

### Performance Benchmarks

| File Size | Rows | Processing Time | Memory Usage | Join Analysis |
|-----------|------|----------------|--------------|---------------|
| 10 MB | 100K | 5 seconds | 45 MB | 2-3 files: +3s |
| 100 MB | 1M | 30 seconds | 120 MB | 3-5 files: +15s |
| 1 GB | 10M | 4 minutes | 280 MB | 5-10 files: +2m |
| 10 GB | 100M | 35 minutes | 450 MB | 10+ files: batched |

*Benchmarks on MacBook Pro M1, 16GB RAM*

## 🤖 LLM Integration Guide

DataPilot outputs are optimized for Large Language Model interpretation:

```bash
# Generate analysis for LLM consumption
datapilot all data.csv --format json --quiet | llm-tool process

# Multi-file analysis for AI-driven insights
datapilot engineering *.csv --format json > relationships.json
ai-tool analyze --input relationships.json --focus "join-optimization"
```

### Recommended LLM Prompts
```
Analyze this DataPilot report and:
1. Summarize the 3 most important insights
2. Recommend next steps for analysis  
3. Identify potential data quality issues
4. Suggest business actions based on findings
5. Evaluate join relationships for business intelligence opportunities

[Paste DataPilot output here]
```

## 🔍 Troubleshooting

### Common Issues

**Installation Problems**
```bash
# If "datapilot: command not found" after npm install
npm config get prefix
echo $PATH | grep $(npm config get prefix)

# Add npm global bin to PATH if needed
echo 'export PATH="$(npm config get prefix)/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc

# Alternative: Always use npx (no PATH required)
npx datapilot-cli --version
```

**Large File Processing**
```bash
# Increase memory for large datasets
datapilot all big-file.csv --memory-limit 2gb --chunk-size 5000

# Use progress monitoring  
datapilot all big-file.csv --verbose --progress
```

**Multi-File Analysis**
```bash
# For directories with many files, use discover
datapilot discover /data/directory/

# For specific file relationships
datapilot join file1.csv file2.csv file3.csv

# Debug relationship detection
datapilot join *.csv --verbose --confidence 0.3
```

## 🛡️ Security & Enterprise Features

- **Input Validation**: Comprehensive format and content validation
- **Memory Safety**: Automatic cleanup and resource management  
- **Audit Logging**: Detailed operation logs for compliance
- **Data Privacy**: No data transmission, purely local processing
- **Proxy Support**: Corporate firewall compatibility
- **Error Handling**: Graceful degradation and recovery

## 🤝 Contributing

We welcome contributions! See our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup
```bash
git clone https://github.com/Mrassimo/datapilot.git
cd datapilot
npm install
npm run build       # Build project
npm test           # Run test suite  
npm run lint       # Code quality checks
npm run typecheck  # TypeScript validation
```

### Testing Commands
```bash
npm test                              # Run all tests
npm run test:unit                     # Unit tests only
npm run test:integration              # Integration tests
npm test -- --testPathPattern="join" # Test specific features
```

## 📚 Additional Resources

- 📖 [Full Documentation](docs/)
- 🎯 [Command Examples](examples/)
- 🔧 [Configuration Guide](CLAUDE.md)
- 📊 [Sample Outputs](examples/sample-outputs/)

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 📞 Support & Community

- 🐛 [Report Issues](https://github.com/Mrassimo/datapilot/issues)
- 💬 [Discussions](https://github.com/Mrassimo/datapilot/discussions)
- 📧 Email Support: Open an issue for support

---

**DataPilot v1.3.1** - Transform your data into comprehensive insights with enterprise-grade statistical analysis and intelligent relationship detection. 🚁📊

*Built with ❤️ for data scientists, analysts, and AI practitioners worldwide.*