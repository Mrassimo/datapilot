# DataPilot 🚁📊

[![npm version](https://img.shields.io/npm/v/datapilot-cli.svg)](https://www.npmjs.com/package/datapilot-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/node/v/datapilot-cli.svg)](https://nodejs.org)

> **Enterprise-grade CSV analysis with comprehensive statistical insights**

Get deep insights from your CSV data with a single command. DataPilot handles the statistical analysis so you can focus on the meaning.

## ✨ Features

- 🔍 **6-Section Analysis Pipeline**: Overview, Quality, EDA, Visualization, Engineering, and Modeling
- 🚀 **Streaming Processing**: Handle files up to 100GB with <512MB memory usage
- 📊 **Comprehensive Reports**: Detailed insights in Markdown, JSON, or YAML
- ⚡ **High Performance**: 500K-2M rows/minute processing speed
- 🛡️ **Production Ready**: Enterprise security, monitoring, and error handling
- 🌍 **Cross-Platform**: Works on Windows, macOS, and Linux

## 🚀 Installation

```bash
# Using npm (recommended)
npm install -g datapilot-cli

# Using npx (no installation)
npx datapilot-cli analyze data.csv
```

## 📋 Quick Start

```bash
# Complete analysis (all 6 sections)
datapilot all data.csv

# Individual sections
datapilot overview data.csv       # Section 1: File overview
datapilot quality data.csv        # Section 2: Data quality
datapilot eda data.csv           # Section 3: Statistical analysis
datapilot engineering data.csv   # Section 5: ML preparation

# Output formats and options
datapilot all data.csv --format json --output report.json
datapilot all data.csv --verbose --progress
```

## 📊 Analysis Sections

| Section | Description |
|---------|-------------|
| **1. Overview** 🗂️ | File metadata, structure, and column types |
| **2. Data Quality** 🧐 | Quality assessment and missing data patterns |
| **3. EDA** 📈 | Statistical analysis and correlations |
| **4. Visualization** 📊 | Chart recommendations and accessibility |
| **5. Engineering** 🏗️ | Schema optimization and ML preparation |
| **6. Modeling** 🧠 | Algorithm selection and strategy |

## 📖 Example Output

DataPilot generates comprehensive reports with:
- **Data overview** and structural insights
- **Quality metrics** with composite scores
- **Statistical summaries** and distributions
- **Visualization recommendations** with code
- **Engineering suggestions** for optimization
- **Modeling strategies** with algorithm recommendations

View [sample outputs](examples/sample-outputs/) to see what DataPilot can do.

## 🤝 Contributing

Contributions welcome! Please see [CONTRIBUTING.md](docs/CONTRIBUTING.md) for details.

```bash
git clone https://github.com/Mrassimo/datapilot.git
cd datapilot
npm install
npm test
```

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 📞 Support

- 🐛 [Issues](https://github.com/Mrassimo/datapilot/issues)
- 💬 [Discussions](https://github.com/Mrassimo/datapilot/discussions)

---

**DataPilot** - Comprehensive CSV analysis made simple. 🚁📊