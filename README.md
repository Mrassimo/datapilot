# 🛩️ DataPilot

**Professional CSV analysis CLI. Transform data into insights in seconds.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-14+-green.svg)](https://nodejs.org/)
[![npm](https://img.shields.io/npm/v/datapilot.svg)](https://www.npmjs.com/package/datapilot)

## Installation

```bash
npm install -g datapilot
```

## Quick Start

```bash
# Analyze any CSV file
datapilot all data.csv

# Interactive terminal UI
datapilot ui

# Specific analysis
datapilot eda sales.csv
```

## Features

### 📊 Five Specialized Analysis Modes

| Command | Purpose | Output |
|---------|---------|--------|
| `eda` | Exploratory Data Analysis | Statistical summaries, distributions, correlations |
| `int` | Data Integrity Check | Quality scores, missing values, validation rules |
| `vis` | Visualization Recommendations | Chart suggestions, color palettes, best practices |
| `eng` | Data Engineering Archaeology | Schema discovery, relationships, technical debt |
| `llm` | LLM Context Generation | AI-ready summaries for ChatGPT/Claude |

### 🎯 Key Capabilities

- **Smart Sampling**: Handles files of any size efficiently
- **Auto-Detection**: Encoding, delimiters, and data types
- **Australian Data**: Built-in support for AU formats
- **Memory System**: Learns patterns across analyses
- **Export Ready**: All outputs optimized for AI consumption

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

## Performance

- **< 1MB**: Instant analysis
- **1-10MB**: 2-5 seconds
- **> 10MB**: Uses intelligent sampling

## Documentation

- [Quick Start Guide](docs/QUICK-START.md)
- [Installation Guide](docs/INSTALLATION.md) 
- [Command Deep Dive](docs/COMMAND_DEEP_DIVE.md)

## License

MIT © DataPilot Contributors