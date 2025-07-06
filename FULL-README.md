# DataPilot 🚁📊

[![npm version](https://img.shields.io/npm/v/datapilot-cli.svg)](https://www.npmjs.com/package/datapilot-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/node/v/datapilot-cli.svg)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue.svg)](https://www.typescriptlang.org/)
[![Build Status](https://github.com/Mrassimo/datapilot/workflows/CI%2FCD%20Pipeline/badge.svg)](https://github.com/Mrassimo/datapilot/actions)

**Transform any data file into comprehensive statistical insights in seconds.**

Get instant analysis of CSV, JSON, Excel, TSV, and Parquet files with ML-ready recommendations, relationship detection, and production-grade streaming processing.

## 🚀 Quick Start

**Install and analyze your first file in 30 seconds:**

```bash
# Install globally
npm install -g datapilot-cli

# Analyze any data file
datapilot all data.csv
```

**Windows users:** If you get `'datapilot' is not recognized`, use `npx datapilot-cli all data.csv` instead.

## 📊 Common Commands

```bash
# Complete analysis (all 6 sections)
datapilot all data.csv              # CSV, JSON, Excel, TSV, Parquet
datapilot all data.xlsx             # Auto-detects format

# Individual analysis sections
datapilot quality data.csv          # Data quality assessment
datapilot eda data.csv              # Statistical analysis
datapilot engineering data.csv      # ML readiness & schema optimization

# Multi-file relationship analysis
datapilot engineering customers.csv orders.csv  # Detect joins & generate SQL
datapilot discover /data/directory/             # Analyze all files in directory
```

## ✨ Key Features

- **Universal format support**: CSV, JSON, Excel, TSV, Parquet with auto-detection
- **6-section analysis pipeline**: Overview → Quality → EDA → Visualization → Engineering → Modeling  
- **Multi-file relationship detection**: Smart join analysis with SQL generation
- **Memory efficient**: Process 100GB+ files with <512MB RAM usage
- **Production ready**: Enterprise security, audit logging, proxy support

## 📁 Supported Formats

| Format | Extensions | Auto-Detection |
|--------|------------|----------------|
| **CSV** | `.csv` | ✅ Delimiter detection |
| **JSON** | `.json`, `.jsonl` | ✅ Structure validation |
| **Excel** | `.xlsx`, `.xls` | ✅ Binary signature |
| **TSV** | `.tsv`, `.tab` | ✅ Tab consistency |
| **Parquet** | `.parquet` | ✅ Metadata inspection |

## 📊 Analysis Sections

| Section | Purpose | Output |
|---------|---------|--------|
| **Overview** | File metadata & structure | Size, encoding, headers, data types |
| **Quality** | Missing data & outliers | Quality scores, completeness patterns |
| **EDA** | Statistical analysis | Distributions, correlations, hypothesis tests |
| **Visualization** | Chart recommendations | Optimal chart types, accessibility compliance |
| **Engineering** | ML readiness & relationships | Schema optimization, join detection, SQL generation |
| **Modeling** | Algorithm selection | ML recommendations, bias detection, ethics |

## 🔧 Basic Configuration

Create `.datapilotrc` in your project root:

```yaml
performance:
  memoryLimit: "512mb"
  chunkSize: 10000

output:
  format: "markdown"
  quiet: false
```

## 🪟 Windows Installation

If `datapilot` command isn't recognized after installation:

```bash
# Option 1: Use npx (recommended - no setup needed)
npx datapilot-cli all data.csv

# Option 2: Add npm to PATH
npm config get prefix
# Add the returned path to Windows PATH environment variable
# Restart PowerShell/Command Prompt
```

## 🔍 Quick Troubleshooting

**Command not found?** Use `npx datapilot-cli` instead of `datapilot`

**Large files slow?** Add `--memory-limit 2gb --chunk-size 5000`

**Need help?** Run `datapilot --help` or `datapilot [command] --help`

## 📚 Resources

- 📖 [Full Documentation](docs/README.md)
- 🎯 [Complete Installation Guide](docs/INSTALLATION.md)
- 🔧 [Advanced Configuration](docs/CONFIGURATION.md)
- 🔍 [Troubleshooting Guide](docs/TROUBLESHOOTING.md)
- 📊 [Example Outputs](examples/outputs/)

## 🤝 Contributing

```bash
git clone https://github.com/Mrassimo/datapilot.git
cd datapilot
npm install && npm run build && npm test
```

See [Contributing Guide](CONTRIBUTING.md) for details.

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 📞 Support

- 🐛 [Report Issues](https://github.com/Mrassimo/datapilot/issues)
- 💬 [Discussions](https://github.com/Mrassimo/datapilot/discussions)

---

**DataPilot v1.4.9** - Transform your data into comprehensive insights in seconds. 🚁📊