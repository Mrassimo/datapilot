# 🤖 DataPilot - AI-Companion Statistical Engine

**Statistical computation engine that does the math so AI can do the meaning.**

[![npm](https://img.shields.io/npm/v/datapilot.svg)](https://www.npmjs.com/package/datapilot)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js 14+](https://img.shields.io/badge/Node.js-14+-green.svg)](https://nodejs.org/)

## What is DataPilot?

DataPilot runs 60+ statistical tests and analyzes 29 chart types on your CSV data, outputting pure mathematical facts optimized for AI interpretation. No domain assumptions - just comprehensive statistical analysis.

## Quick Start

```bash
# Install globally
npm install -g datapilot

# Analyze any CSV
datapilot all data.csv
```

## The 3 Commands

### `run` - Statistical Analysis (60+ tests)
```bash
datapilot run sales.csv
```
Outputs: distributions, correlations, outliers, quality scores, ML readiness

### `vis` - Visualization Intelligence (29 chart types)
```bash
datapilot vis sales.csv  
```
Outputs: chart recommendations with perceptual effectiveness scores

### `all` - Complete Analysis
```bash
datapilot all sales.csv
```
Runs both engines in parallel with shared data optimization

## Key Features

- ⚡ **Performance**: Handles 500K+ rows with smart sampling
- 🧮 **60+ Statistical Tests**: Shapiro-Wilk, Jarque-Bera, correlation matrices, outlier detection
- 🎨 **29 Chart Types**: From basic to advanced (violin plots, parallel coordinates, horizon charts)
- 🤖 **AI-Optimized**: Output formatted for direct paste into ChatGPT/Claude
- 🔧 **Zero Config**: Auto-detects encodings, delimiters, data types
- 💻 **Cross-Platform**: Works offline on Windows, macOS, Linux

## Example Output

```
🤖 DATAPILOT STATISTICAL COMPUTATION ENGINE
==========================================

━━━ COMPUTATIONAL SUMMARY ━━━
Dataset: sales.csv | Rows: 10,234 | Columns: 15
Processing Time: 2.3s | Statistical Tests: 87 | Patterns Detected: 12

━━━ STATISTICAL FACTS ━━━
📊 Data Completeness: 98.5% complete
📈 Distributions: revenue (skew=2.341, non-normal), age (skew=0.123, normal)
🔗 Correlations: age ↔ revenue (r=0.847, strong positive)

━━━ AI INVESTIGATION PROMPTS ━━━
🤖 "Strong correlation detected between age and revenue. What business relationship could explain this?"
```

## Advanced Usage

```bash
# Large files
datapilot run big.csv --timeout 600000

# Custom formats  
datapilot run data.tsv --delimiter "\t"

# Save output
datapilot all data.csv --output report.txt
```

## Documentation

- [Installation Guide](docs/INSTALLATION.md) - Detailed setup including offline/Windows
- [Command Reference](docs/COMMAND_DEEP_DIVE.md) - All options and features
- [Examples](docs/examples/) - Real-world usage patterns
- [Troubleshooting](docs/TROUBLESHOOTING.md) - Common issues and solutions

## License

MIT © DataPilot Contributors

---

**Ready to revolutionize your data analysis?**
```bash
npm install -g datapilot && datapilot all your-data.csv
```

*"DataPilot does the math, AI does the meaning"*