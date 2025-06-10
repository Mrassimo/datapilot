# DataPilot 🚁📊

[![npm version](https://img.shields.io/npm/v/datapilot-cli.svg)](https://www.npmjs.com/package/datapilot-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/node/v/datapilot-cli.svg)](https://nodejs.org)

> **Enterprise-grade streaming CSV analysis with comprehensive statistical insights**

DataPilot is a sophisticated command-line tool that transforms CSV files into comprehensive statistical reports. With zero dependencies and memory-efficient streaming processing, it handles datasets of any size while providing deep insights across six analytical dimensions.

## ✨ Key Features

- 🔍 **6-Section Analysis Pipeline**: Overview → Quality → EDA → Visualization → Engineering → Modeling
- 🚀 **Streaming Processing**: Handle files up to 100GB with constant <512MB memory usage
- 📊 **Comprehensive Reports**: Human-readable insights in Markdown, JSON, or YAML formats
- ⚡ **High Performance**: Process 500K-2M rows/minute with automatic optimization
- 🛡️ **Production Ready**: Enterprise security, monitoring, error handling, and proxy support
- 🌍 **Cross-Platform**: Native binaries for Windows, macOS, and Linux
- ♿ **Accessibility First**: WCAG-compliant visualization recommendations
- 🤖 **LLM-Optimized**: Output designed for AI/ML interpretation and prompt engineering

## 🚀 Installation

### Option 1: NPM Package (Recommended)
```bash
# Install globally (IMPORTANT: Use datapilot-cli, not datapilot)
npm install -g datapilot-cli

# Verify installation (should show v1.0.6)
datapilot --version
```

> ⚠️ **Important**: Install `datapilot-cli`, NOT `datapilot` (which is deprecated)

### Option 2: Pre-built Binaries
Download platform-specific binaries from [GitHub Releases](https://github.com/Mrassimo/datapilot/releases):
- **Windows**: `datapilot-win.exe` (40MB)
- **macOS**: `datapilot-macos` (53MB) 
- **Linux**: `datapilot-linux` (48MB)

### Option 3: NPX (No Installation, Recommended for PATH Issues)
```bash
# Always gets latest version, no PATH configuration needed
npx datapilot-cli all data.csv
npx datapilot-cli --version
npx datapilot-cli --help
```

> 💡 **Tip**: If you have trouble with `datapilot: command not found` after global install, use `npx datapilot-cli` instead

### Option 4: From Source
```bash
git clone https://github.com/Mrassimo/datapilot.git
cd datapilot
npm install
npm run build
npm link
```

## 📋 Quick Start Guide

### Basic Usage
```bash
# Complete analysis (all 6 sections)
datapilot all data.csv

# Individual sections
datapilot overview data.csv       # Section 1: File overview & metadata
datapilot quality data.csv        # Section 2: Data quality assessment
datapilot eda data.csv           # Section 3: Exploratory data analysis
datapilot visualization data.csv  # Section 4: Chart recommendations
datapilot engineering data.csv   # Section 5: ML engineering insights
datapilot modeling data.csv      # Section 6: Predictive modeling guidance

# Quick file information
datapilot info data.csv          # Basic file stats
datapilot validate data.csv      # CSV format validation
```

### Advanced Options
```bash
# Output control
datapilot all data.csv --format json --output report.json
datapilot all data.csv --format yaml --output analysis.yaml
datapilot all data.csv --quiet --output results/

# Performance tuning
datapilot all huge-file.csv --verbose --progress
datapilot all data.csv --chunk-size 50000 --memory-limit 1gb

# Configuration
datapilot all data.csv --config production.datapilotrc
datapilot all data.csv --preset high-performance
```

## 📊 Analysis Sections Explained

| Section | Purpose | Key Outputs |
|---------|---------|-------------|
| **1. Overview** 🗂️ | File metadata, structure analysis, column detection | File size, encoding, headers, data types, parsing strategy |
| **2. Data Quality** 🧐 | Quality assessment, completeness, validity | Missing patterns, outliers, duplicates, quality scores |
| **3. EDA** 📈 | Statistical analysis, distributions, correlations | Univariate/bivariate stats, hypothesis tests, associations |
| **4. Visualization** 📊 | Chart recommendations, accessibility optimization | Chart types, encodings, library suggestions, WCAG compliance |
| **5. Engineering** 🏗️ | Schema optimization, feature engineering, ML readiness | Index recommendations, normalization, feature selection |
| **6. Modeling** 🧠 | Algorithm selection, validation strategy, deployment | ML algorithms, cross-validation, model evaluation frameworks |

## 🎯 Use Cases & Examples

### Business Analytics
```bash
# Analyze sales data for insights
datapilot all sales-2024.csv
# Output: Revenue trends, seasonal patterns, top products, forecasting recommendations
```

### Data Quality Auditing
```bash
# Check data quality before analysis
datapilot quality customer-database.csv
# Output: Completeness scores, outlier detection, consistency issues
```

### ML Pipeline Preparation
```bash
# Prepare dataset for machine learning
datapilot engineering features.csv
# Output: Feature selection, encoding strategies, scaling recommendations
```

### Research Data Analysis
```bash
# Comprehensive statistical analysis
datapilot eda experiment-results.csv
# Output: Distributions, correlations, hypothesis tests, statistical significance
```

## 📖 Understanding Output Reports

### Section 1: Overview Report
- **File Metadata**: Size, encoding, structure
- **Column Analysis**: Data types, semantic types, cardinality
- **Parsing Strategy**: Delimiter detection, header analysis
- **Performance Metrics**: Processing speed, memory usage

### Section 2: Quality Assessment
- **Completeness**: Missing value patterns and impact
- **Validity**: Data format compliance and business rules
- **Consistency**: Duplicate detection and resolution
- **Quality Score**: Composite 0-100 quality rating

### Section 3: Statistical Analysis
- **Univariate**: Distributions, central tendency, dispersion
- **Bivariate**: Correlations, associations, statistical tests
- **Hypothesis Testing**: Normality, independence, significance
- **Advanced Stats**: Confidence intervals, effect sizes

### Section 4: Visualization Intelligence
- **Chart Recommendations**: Optimal chart types per variable
- **Accessibility**: WCAG-compliant color schemes and alternatives
- **Library Guidance**: D3.js, Plotly, Tableau implementation code
- **Interactive Features**: Recommended user interactions

### Section 5: Engineering Insights
- **Schema Optimization**: Index recommendations, normalization
- **Feature Engineering**: Transformation suggestions, new features
- **ML Readiness**: Encoding strategies, scaling requirements
- **Performance**: Query optimization, storage efficiency

### Section 6: Modeling Strategy
- **Algorithm Selection**: Recommended ML algorithms with rationale
- **Validation Strategy**: Cross-validation, train/test splits
- **Evaluation Metrics**: Appropriate success measures
- **Deployment Considerations**: Production monitoring, model lifecycle

## 🔧 Configuration & Customization

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
  statisticalTests: true

# Output formatting
output:
  format: "markdown"
  includeRawData: false
  verboseLogging: false

# Visualization preferences
visualization:
  accessibilityLevel: "AA"
  colorBlindSupport: true
  interactivityLevel: "medium"
```

### Environment-Specific Presets
```bash
# Use predefined configurations
datapilot all data.csv --preset low-memory     # <256MB usage
datapilot all data.csv --preset high-performance # Maximum speed
datapilot all data.csv --preset research       # Comprehensive stats
datapilot all data.csv --preset production     # Enterprise settings
```

## 🤖 LLM Integration Guide

DataPilot outputs are optimized for Large Language Model interpretation and prompt engineering:

### Basic LLM Integration
```bash
# Generate analysis for LLM consumption
datapilot all data.csv --format json | llm-tool process

# Create summary for ChatGPT/Claude
datapilot all data.csv --quiet --output analysis.md
# Then paste analysis.md into your LLM conversation
```

### Recommended LLM Prompts
```
Analyze this DataPilot report and:
1. Summarize the 3 most important insights
2. Recommend next steps for analysis
3. Identify potential data quality issues
4. Suggest business actions based on findings

[Paste DataPilot output here]
```

### Advanced AI Workflows
```bash
# Pipeline for AI-driven analysis
datapilot all data.csv --format json > analysis.json
ai-insights generate --input analysis.json --model gpt-4
ai-insights visualize --input analysis.json --charts recommended
```

## 🔍 Troubleshooting

### Common Issues

**Installation Problems**

***"datapilot: command not found" after npm install***
```bash
# Check if npm global bin is in your PATH
npm config get prefix
echo $PATH | grep $(npm config get prefix)

# If not in PATH, add npm global bin to your shell profile:
# For bash/zsh (~/.bashrc or ~/.zshrc):
echo 'export PATH="$(npm config get prefix)/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc

# For fish shell (~/.config/fish/config.fish):
echo 'set -gx PATH (npm config get prefix)/bin $PATH' >> ~/.config/fish/config.fish

# Windows (run as administrator):
npm config get prefix
# Add the returned path + \node_modules\.bin to your PATH environment variable
```

***Getting old version (like 1.0.2) instead of latest***
```bash
# Remove any existing versions and clear cache
npm uninstall -g datapilot datapilot-cli  
npm cache clean --force                   
npm install -g datapilot-cli             

# Make sure you're installing the right package
npm install -g datapilot-cli    # ✅ Correct (latest v1.0.7)
npm install -g datapilot        # ❌ Wrong (deprecated v2.0.0)
```

***Alternative: Use npx (always works, no PATH issues)***
```bash
# NPX always gets the latest version and doesn't require PATH setup
npx datapilot-cli --version
npx datapilot-cli all data.csv
```

**Large File Processing**
```bash
# Increase memory limit
datapilot all big-file.csv --memory-limit 2gb --chunk-size 5000

# Use streaming mode
datapilot all big-file.csv --streaming --progress
```

**Performance Issues**
```bash
# Check system resources
datapilot all data.csv --verbose --profile

# Use performance preset
datapilot all data.csv --preset high-performance
```

### Debug Mode
```bash
# Enable detailed logging
datapilot all data.csv --debug --log-file debug.log

# Test specific sections
datapilot overview data.csv --dry-run
```

## 📈 Performance Benchmarks

| File Size | Rows | Processing Time | Memory Usage |
|-----------|------|----------------|--------------|
| 10 MB | 100K | 5 seconds | 45 MB |
| 100 MB | 1M | 30 seconds | 120 MB |
| 1 GB | 10M | 4 minutes | 280 MB |
| 10 GB | 100M | 35 minutes | 450 MB |

*Benchmarks on MacBook Pro M1, 16GB RAM*

## 🛡️ Security & Enterprise Features

- **Input Validation**: Comprehensive CSV format and content validation
- **Memory Safety**: Automatic cleanup and resource management
- **Proxy Support**: Corporate firewall and proxy compatibility
- **Audit Logging**: Detailed operation logs for compliance
- **Error Handling**: Graceful degradation and recovery
- **Data Privacy**: No data transmission, purely local processing

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](docs/CONTRIBUTING.md) for details.

### Development Setup
```bash
git clone https://github.com/Mrassimo/datapilot.git
cd datapilot
npm install
npm run dev          # Watch mode development
npm test            # Run test suite
npm run lint        # Code quality checks
npm run build       # Production build
```

### Project Structure
```
src/
├── analyzers/       # Analysis modules (sections 1-6)
├── cli/            # Command-line interface
├── core/           # Core configuration and types
├── parsers/        # CSV parsing and detection
└── utils/          # Utilities and helpers
```

## 📚 Additional Resources

- 📖 [Full Documentation](docs/README.md)
- 🎥 [Video Tutorials](docs/tutorials/)  
- 💼 [Industry Use Cases](examples/use-cases/)
- 🔧 [API Reference](docs/api/programmatic-usage.md)
- 📊 [Sample Outputs](examples/sample-outputs/)

## 🏆 What Users Are Saying

> *"DataPilot v1.0.8 represents a remarkable transformation and complete success story in the data analysis tool space. Technical Score: 9.5/10 - Production-ready, enterprise-grade solution."*
> 
> *"Perfect installation experience, zero errors/warnings, beautiful formatted output. Ready for widespread enterprise adoption."*
> 
> — Comprehensive Analysis Report, June 2025

## 🎯 Use Cases & Success Stories

### **Business Intelligence Teams**
- **Rapid CSV Analysis**: Generate comprehensive insights in under 2 minutes
- **Data Quality Auditing**: Automated quality scoring across 10 dimensions  
- **Stakeholder Reporting**: Professional markdown reports ready for presentations

### **Data Scientists & Analysts**  
- **Quick Dataset Profiling**: 60+ statistical tests performed automatically
- **LLM Integration**: Output optimised for ChatGPT/Claude data analysis workflows
- **Australian Context**: Recognises Australian postcodes, phone formats, state codes

### **Data Engineers**
- **Schema Optimisation**: DDL generation and primary key detection
- **ML Readiness Assessment**: Feature engineering and algorithm recommendations
- **Performance Benchmarks**: Process 500K-2M rows/minute with <512MB memory

### **Consultants & Freelancers**
- **Client Data Assessment**: Professional analysis reports for client meetings
- **Zero Learning Curve**: Works immediately without configuration
- **Cost Effective**: Free alternative to $150-840/year commercial tools

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 📞 Support & Community

- 🐛 [Report Issues](https://github.com/Mrassimo/datapilot/issues)
- 💬 [Discussions](https://github.com/Mrassimo/datapilot/discussions)  
- 📧 [Email Support](mailto:support@datapilot.dev)
- 🐦 [Twitter Updates](https://twitter.com/datapilot_dev)

---

**DataPilot** - Transform CSV data into comprehensive insights with enterprise-grade statistical analysis. 🚁📊

*Built with ❤️ for data scientists, analysts, and AI practitioners worldwide.*