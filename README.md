# DataPilot 🚀

**Transform CSV chaos into crystal-clear insights.** A blazing-fast CLI that generates comprehensive, LLM-ready analysis from any CSV file—no configuration needed.

```bash
npm install -g datapilot
datapilot eda sales.csv  # Instant insights
```

## Why DataPilot?

- **Zero Config**: Works instantly. No API keys, no setup files, no dependencies to configure.
- **LLM-Optimized**: Every output is perfectly formatted for ChatGPT/Claude copy-paste workflows.
- **Lightning Fast**: Handles gigabyte files through intelligent streaming and sampling.
- **Deep Intelligence**: Our "archaeology" mode discovers hidden relationships across multiple CSVs.
- **Australian-Aware**: Automatically recognizes AU phone numbers, postcodes, ABNs, and date formats.

## Commands at a Glance

| Command | Purpose | Perfect For |
|---------|---------|-------------|
| `eda` | Statistical deep-dive | "What's in this data?" |
| `int` | Find quality issues | "Is this production-ready?" |
| `vis` | Chart recommendations | "How should I visualize this?" |
| `eng` | Relationship discovery | "How do these files connect?" |
| `llm` | AI-ready summaries | "Explain this to ChatGPT" |
| `all` | Everything above | "Tell me everything" |

## Quick Start

```bash
# Install once
npm install -g datapilot

# Analyze any CSV
datapilot eda sales.csv
datapilot int customers.csv -o issues.txt
datapilot all dataset.csv --quick
```

## 🏛️ Data Engineering Archaeology (NEW!)

Our revolutionary `eng` command builds collective intelligence about your data warehouse over time:

```bash
# Analyze multiple files at once
datapilot eng analyze *.csv

# Save insights from your AI
echo "PURPOSE: Customer dimension table" | datapilot eng save customers

# Generate complete documentation
datapilot eng report -o warehouse_docs.txt

# View relationship map
datapilot eng map
```

**What makes archaeology special:**
- **Persistent Learning**: Each analysis builds on previous discoveries
- **Auto-Relationships**: Detects foreign keys and connections automatically
- **LLM Integration**: Generate prompts → Get AI insights → Save back to knowledge base
- **Pattern Recognition**: Identifies naming conventions and design patterns
- **Technical Debt Tracking**: Estimates cleanup effort across your entire warehouse

## Real-World Examples

### E-commerce Analysis
```bash
# Quick quality check
datapilot int orders.csv

# Deep statistical analysis
datapilot eda orders.csv -o analysis.txt

# Discover relationships
datapilot eng analyze orders.csv customers.csv products.csv

# Get visualization recommendations
datapilot vis orders.csv
```

### Data Quality Pipeline
```bash
# 1. Check integrity first
datapilot int raw_data.csv

# 2. If clean, analyze
datapilot eda raw_data.csv

# 3. Prepare for visualization
datapilot vis raw_data.csv -o dashboard_plan.txt
```

### LLM Workflow
```bash
# Generate perfect context for AI
datapilot llm complex_dataset.csv -o context.txt

# Copy context.txt to ChatGPT/Claude
# Ask: "What patterns do you see?"
# Save insights back:
echo "PATTERN: Seasonal sales spike in December" | datapilot eng save sales
```

## Features

### Intelligent Type Detection
- Numbers (with formatting like $1,234.56)
- Dates (handles DD/MM/YYYY, MM/DD/YYYY, ISO, and more)
- Categories (with frequency analysis)
- Identifiers (customer IDs, transaction IDs)
- Emails, phone numbers, postcodes
- Australian-specific formats (ABN, Medicare, mobile patterns)

### Comprehensive Analysis
- **Statistical**: Mean, median, mode, standard deviation, percentiles
- **Distribution**: Skewness, kurtosis, outlier detection
- **Quality**: Missing values, duplicates, format violations
- **Patterns**: Seasonality, trends, anomalies
- **Relationships**: Correlation analysis, foreign key detection

### Smart File Handling
- Automatic encoding detection (handles UTF-8, Windows-1252, etc.)
- Intelligent delimiter detection (comma, semicolon, tab, pipe)
- Streaming for large files (GB+ supported)
- Automatic sampling for performance

## Pro Tips

1. **Always use `-o` flag to save output** (not shell redirection)
   ```bash
   datapilot eda data.csv -o report.txt  # ✅ Correct
   datapilot eda data.csv > report.txt   # ❌ Loses formatting
   ```

2. **For headerless CSVs**, add `--no-header`
   ```bash
   datapilot eda old_export.csv --no-header
   ```

3. **Quick mode** for large files
   ```bash
   datapilot all huge_file.csv --quick
   ```

4. **Archaeology workflow** for multiple files
   ```bash
   # Analyze everything
   datapilot eng analyze *.csv
   
   # Get insights from AI, then:
   datapilot eng save orders "PURPOSE: Transaction fact table..."
   
   # Generate final report
   datapilot eng report
   ```

## Installation Options

```bash
# Global install (recommended)
npm install -g datapilot

# Or use npx
npx datapilot eda myfile.csv

# Or clone and link
git clone https://github.com/Mrassimo/datapilot.git
cd datapilot
npm install
npm link
```

## Output Philosophy

DataPilot outputs are intentionally text-based and verbose. Why?

1. **Copy-paste friendly**: Select, copy, paste into any LLM
2. **No lock-in**: Your analysis isn't trapped in a proprietary format
3. **LLM-optimized**: Structured for AI comprehension
4. **Human-readable**: Clear sections, formatted statistics, plain English

## Requirements

- Node.js 16+
- CSV files (any size, any encoding)
- That's it!

## Contributing

We love contributions! Check out our issues or submit a PR. Areas we're exploring:
- More statistical tests
- Additional file formats
- Domain-specific analysis patterns
- Multi-language support

## License

MIT - Use freely in personal and commercial projects.

---

**Built with ❤️ for data analysts who value clarity over complexity.**

[![npm version](https://img.shields.io/npm/v/datapilot.svg)](https://www.npmjs.com/package/datapilot)
[![Downloads](https://img.shields.io/npm/dm/datapilot.svg)](https://www.npmjs.com/package/datapilot)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)