# 🤖 DataPilot 2.0 - AI-Companion Statistical Engine

**Pure statistical computation optimized for AI interpretation. "DataPilot does the math, AI does the meaning"**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-14+-green.svg)](https://nodejs.org/)
[![npm](https://img.shields.io/npm/v/datapilot.svg)](https://www.npmjs.com/package/datapilot)
[![Version](https://img.shields.io/badge/Version-2.0.0-blue.svg)](#)

## What is DataPilot 2.0?

DataPilot 2.0 is a revolutionary **AI-companion statistical computation engine** that processes CSV data and outputs pure mathematical facts optimized for AI interpretation. Instead of making domain assumptions, DataPilot focuses on comprehensive statistical analysis while letting AI assistants provide the contextual meaning.

**🔄 The New Paradigm:**
- **DataPilot**: Executes 60+ statistical tests, analyzes 29 chart types, processes distributions, correlations, and quality metrics
- **AI Assistant**: Interprets statistical facts within domain context, provides business insights, recommends actions

**✨ Key Features:**
- 🧮 **Statistical Powerhouse**: 60+ automated tests, distribution analysis, correlation matrices
- 🎨 **Advanced Visualization**: 29 specialized chart types with Cleveland-McGill perceptual rankings  
- 🤖 **AI-Optimized Output**: Pure statistical facts without domain assumptions
- ⚡ **High Performance**: Handles 50K+ rows with intelligent sampling
- 🔧 **Zero Configuration**: Auto-detects formats, encodings, delimiters
- 💻 **Cross-Platform**: Works offline on Windows, macOS, Linux

## Installation

### 🌍 Global Install (Recommended)
```bash
npm install -g datapilot
```

### 🚀 Quick Test (No Install)
```bash
npx datapilot run https://raw.githubusercontent.com/mwaskom/seaborn-data/master/iris.csv
```

### 🔒 Offline/Enterprise Install
```bash
# Download and install offline
git clone https://github.com/Mrassimo/datapilot.git
cd datapilot
npm install
npm run build

# Link globally for system-wide access
npm link

# Windows: Run additional setup
scripts\install\install_windows.bat
```

## 🎯 The 3-Command AI-Companion Structure

### 1. **`run` - Statistical Computation Engine**
Comprehensive statistical analysis with 60+ automated tests:

```bash
datapilot run dataset.csv
```

**Output Example:**
```
🤖 DATAPILOT STATISTICAL COMPUTATION ENGINE
==========================================

━━━ COMPUTATIONAL SUMMARY ━━━
Dataset: sales.csv | Rows: 10,234 | Columns: 15
Processing Time: 2.3s | Statistical Tests: 87 | Patterns Detected: 12
Quality Score: 92/100 | ML Readiness: 85%

━━━ STATISTICAL FACTS ━━━
📊 Data Completeness Matrix:
• Overall: 98.5% complete
• Missing Value Distribution: customer_id(12), region(0), revenue(3)

📈 Numerical Distribution Facts:
• revenue: mean=2.34K, std=1.12K, range=[0.00, 15.67K], skew=2.341, kurtosis=8.123
• age: mean=42.3, std=12.8, range=[18.0, 85.0], skew=0.123, kurtosis=-0.456

📊 Distribution Test Results:
• revenue: Shapiro-Wilk p=0.001 (non-normal)
• age: Shapiro-Wilk p=0.234 (normal)

━━━ AI INVESTIGATION PROMPTS ━━━
🤖 "Strong correlation (r=0.847) detected between age and revenue. What business relationship could explain this statistical dependency?"

🤖 "Data quality score is 92/100. What domain factors could explain the missing customer_id values?"
```

### 2. **`vis` - Advanced Visualization Intelligence**
29 specialized chart types with perceptual optimization:

```bash
datapilot vis dataset.csv
```

**Output Example:**
```
🤖 DATAPILOT VISUALIZATION COMPUTATION ENGINE
============================================

━━━ COMPUTATIONAL SUMMARY ━━━
Processing Time: 1.8s | Visualizations Analyzed: 25 | Advanced Charts: 15
Perceptual Tests: 29 | Framework: Cleveland-McGill + Bertin + Tufte

━━━ VISUALIZATION STATISTICAL FACTS ━━━
📊 Data Profile Matrix:
• Dimensions: 10,234 rows × 15 columns
• Data Types: 8 continuous, 5 categorical, 2 temporal
• Completeness: 98.5% | Size Category: large

📈 Chart Effectiveness Matrix:
• scatter: 93% effectiveness | Encoding: Position on common scale (most accurate)
• parallel_coordinates: 90% effectiveness | 8 dimensions require parallel coordinates
• violin_plot: 85% effectiveness | Complex distribution visualization

🔬 Advanced Statistical Graphics Results:
• Statistical Graphics: 12 recommendations
• Multivariate Patterns: 8 recommendations  
• Time Series Analysis: 3 recommendations

━━━ AI INVESTIGATION PROMPTS ━━━
🤖 "Top chart recommendation is scatter (93% effective). What domain context would make this visualization most valuable?"

🤖 "8 continuous variables detected. What analytical questions would benefit from multivariate visualization techniques?"
```

### 3. **`all` - Complete Parallel Processing**
Runs both statistical and visualization engines with shared data optimization:

```bash
datapilot all dataset.csv
```

Provides the complete output from both `run` and `vis` commands with integrated insights.

## 🛠️ Underlying Technology Stack

DataPilot 2.0 is built with best-in-class open-source libraries:

### Core Dependencies
- **[csv-parse](https://csv.js.org/parse/)** - High-performance CSV parsing
- **[simple-statistics](https://simplestatistics.org/)** - Statistical computation library
- **[jStat](https://jstat.github.io/)** - Advanced statistical functions
- **[ml-cart](https://github.com/mljs/cart)** - Decision tree analysis
- **[regression](https://github.com/Tom-Alexander/regression-js)** - Regression analysis

### Visualization & Analysis Libraries  
- **[ml-kmeans](https://github.com/mljs/kmeans)** - Clustering analysis
- **[validator](https://github.com/validatorjs/validator.js)** - Data validation
- **[libphonenumber-js](https://github.com/catamphetamine/libphonenumber-js)** - Phone number parsing
- **[fuzzyset.js](https://github.com/Glench/fuzzyset.js)** - Fuzzy string matching

### CLI & Output Libraries
- **[commander](https://github.com/tj/commander.js)** - CLI framework
- **[chalk](https://github.com/chalk/chalk)** - Terminal styling
- **[ora](https://github.com/sindresorhus/ora)** - Terminal spinners
- **[boxen](https://github.com/sindresorhus/boxen)** - Terminal boxes
- **[cli-table3](https://github.com/cli-table/cli-table3)** - Terminal tables

### Utility Libraries
- **[js-yaml](https://github.com/nodeca/js-yaml)** - YAML parsing
- **[chardet](https://github.com/runk/node-chardet)** - Character encoding detection
- **[glob](https://github.com/isaacs/node-glob)** - File pattern matching

## 🎨 Advanced Visualization Features

DataPilot 2.0 includes sophisticated visualization analysis based on established theories:

### Theoretical Frameworks
- **[Cleveland-McGill Perceptual Rankings](https://www.cs.ubc.ca/~tmm/vadbook/cleveland.pdf)** - Quantifies visual encoding effectiveness
- **[Bertin's Visual Variables](https://www.esri.com/news/arcuser/0700/bertin.html)** - Systematic approach to visual encoding
- **[Tufte's Data-Ink Principles](https://www.edwardtufte.com/tufte/books_vdqi)** - Maximizes information density

### Specialized Chart Types
**Statistical Graphics (12 types):**
- Violin plots, QQ plots, Box-and-whisker plots
- Correlation heatmaps with significance testing  
- Regression diagnostic panels
- Distribution fitting visualizations

**Multivariate Analysis (8 types):**
- Parallel coordinates plots
- Scatterplot matrices (SPLOM)
- Principal component analysis (PCA) plots
- Radar/spider charts

**Time Series Analysis (9 types):**
- Horizon charts, Calendar heatmaps
- Decomposition plots (trend/seasonal/residual)
- Autocorrelation function (ACF/PACF) plots

## 🚀 Performance & Scalability

| Dataset Size | Processing Time | Memory Usage | Strategy |
|-------------|----------------|--------------|----------|
| < 1K rows | < 1 second | < 50MB | Full analysis |
| 1K-10K rows | 1-3 seconds | 50-100MB | Optimized analysis |
| 10K-50K rows | 3-10 seconds | 100-200MB | Smart sampling |
| 50K-100K rows | 10-30 seconds | 200-300MB | Reservoir sampling |
| > 100K rows | 30-60 seconds | < 500MB | Progressive analysis |

**Tested with datasets up to 500K rows successfully.**

## 💻 Windows Offline Installation

DataPilot 2.0 includes comprehensive Windows support:

### Automated Windows Setup
```cmd
REM Download and extract DataPilot
REM Run the automated installer
scripts\install\install_windows.bat

REM Verify offline functionality
scripts\install\verify_offline.bat
```

### PowerShell Integration
```powershell
# DataPilot PowerShell module provides convenient aliases
Import-Module DataPilot

# Use short commands
dp run data.csv        # datapilot run
dpvis data.csv         # datapilot vis  
dpall data.csv         # datapilot all
```

### Manual Windows Setup
1. Install [Node.js 14+](https://nodejs.org/en/download/)
2. Download DataPilot and extract
3. Run `npm install` and `npm run build`
4. Add DataPilot folder to Windows PATH
5. Verify with `datapilot --help`

## 🤖 AI Assistant Integration Examples

### ChatGPT Integration
```
Prompt: "Analyze these DataPilot statistical facts and provide business insights for an e-commerce dataset:"

[Paste DataPilot output]

Response: Based on the statistical analysis:
1. The high skewness (8.65) in revenue suggests a small percentage of high-value customers...
2. The strong correlation (r=0.92) between time_on_site and conversion_rate indicates...
3. The non-normal distribution in customer_age suggests segmentation opportunities...
```

### Claude Integration  
```
Prompt: "What business questions should I investigate based on these statistical patterns?"

[Paste DataPilot output]

Response: The statistical evidence suggests several investigation areas:
1. Customer Lifetime Value: The extreme revenue distribution indicates...
2. Seasonal Patterns: The autocorrelation analysis shows...
3. Quality Issues: The missing data patterns in customer_id suggest...
```

## 📁 Repository Structure

```
datapilot/
├── bin/                    # CLI entry points
├── dist/                   # Built distribution files
├── src/                    # Source code
│   ├── commands/          # Command implementations
│   │   ├── run.js         # Statistical computation engine
│   │   ├── vis.js         # Visualization intelligence
│   │   ├── all.js         # Complete analysis suite
│   │   ├── eda/           # Exploratory data analysis
│   │   ├── int/           # Data integrity checks
│   │   └── vis/           # Visualization analysis
│   ├── analysis/          # Analysis engines
│   └── utils/             # Shared utilities
├── scripts/               # Installation and build scripts
│   └── install/           # Platform-specific installers
├── tests/                 # Comprehensive test suite
│   ├── fixtures/          # Test datasets
│   └── unit/             # Unit tests
├── data/                  # Sample datasets
│   └── samples/          # Real-world examples
└── docs/                  # Documentation
```

## 🔧 Advanced Usage

### Handling Large Files
```bash
# Use timeout for complex analyses
datapilot run large_dataset.csv --timeout 300000

# Force analysis despite warnings  
datapilot all problematic.csv --force

# Quiet mode for scripts
datapilot run data.csv --quiet --output results.txt
```

### Custom Formatting
```bash
# Control delimiter detection
datapilot run data.tsv --delimiter "\t"

# Handle encoding issues
datapilot run data.csv --encoding latin1

# Process files without headers
datapilot run data.csv --no-header
```

### Output Management
```bash
# Save comprehensive analysis
datapilot all sales.csv --output full_report.txt

# Create separate statistical and visual reports
datapilot run sales.csv --output stats.txt
datapilot vis sales.csv --output charts.txt
```

## 🐛 Troubleshooting

### Common Issues

**Node.js not found?**
- Install [Node.js 14+](https://nodejs.org/en/download/) 
- Verify: `node --version`

**Command not found after install?**
```bash
# Reinstall globally
npm uninstall -g datapilot
npm install -g datapilot

# Or use npx
npx datapilot run data.csv
```

**Large file timeout?**
```bash
datapilot run large.csv --timeout 600000  # 10 minutes
```

**Encoding problems?**
```bash
datapilot run data.csv --encoding utf8
datapilot run data.csv --encoding latin1
```

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions welcome! Please see our [Contributing Guide](CONTRIBUTING.md).

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 🙏 Acknowledgments

DataPilot 2.0 stands on the shoulders of giants. Special thanks to:

- **csv-parse team** for blazing-fast CSV processing
- **simple-statistics contributors** for robust statistical functions
- **Cleveland & McGill** for foundational perception research
- **Edward Tufte** for data visualization principles
- **Jacques Bertin** for visual variable theory

## 📊 Version History

- **2.0.0** (2025-06-03): AI-Companion transformation, 29 chart types, 60+ statistical tests
- **1.2.0** (2024): 3-command structure, performance optimizations
- **1.0.0** (2024): Initial release

---

**Ready to revolutionize your data analysis workflow?**

```bash
npm install -g datapilot
datapilot all your-data.csv
```

*"DataPilot does the math, AI does the meaning" - Experience the future of human-AI collaborative data analysis.*