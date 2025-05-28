# 🛩️ DataPilot

**Transform CSV files into insights in seconds. Zero setup, maximum intelligence.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Tests](https://img.shields.io/badge/Tests-Passing-brightgreen.svg)](#)

## Quick Start (30 seconds)

```bash
# Clone and run
git clone https://github.com/Mrassimo/datapilot.git
cd datapilot
npm install

# Interactive UI (recommended)
node bin/datapilot.js ui

# Or analyze directly
node bin/datapilot.js all yourdata.csv
```

## What is DataPilot?

DataPilot is a comprehensive CSV analysis toolkit that provides instant insights through five specialized analysis modes. It's designed for both beginners and data professionals who need quick, actionable insights from their data.

## Features

### 🎨 Interactive Terminal UI
- Beautiful, colorful interface
- Guided analysis workflow  
- Demo datasets included
- Memory management for persistent insights

### 📊 Five Analysis Modes

1. **EDA** - Exploratory Data Analysis
   - Statistical summaries
   - Distribution analysis
   - Correlation detection
   - Outlier identification

2. **INT** - Data Integrity Check  
   - Missing value analysis
   - Duplicate detection
   - Data quality scoring
   - Validation rules

3. **VIS** - Visualization Recommendations
   - Chart type suggestions
   - Color palette selection
   - Layout recommendations
   - Accessibility checks

4. **ENG** - Data Engineering Archaeology
   - Schema discovery
   - Relationship detection
   - Domain classification
   - Persistent knowledge base

5. **LLM** - AI Context Generation
   - Natural language summaries
   - Ready-to-paste LLM context
   - Key insights extraction
   - Analysis questions

## Usage Examples

```bash
# Interactive mode (recommended for beginners)
node bin/datapilot.js ui

# Run all analyses
node bin/datapilot.js all data.csv

# Specific analysis
node bin/datapilot.js eda sales_data.csv
node bin/datapilot.js int customer_records.csv --output report.txt

# Large files
node bin/datapilot.js llm big_dataset.csv --comprehensive false

# Save analysis
node bin/datapilot.js vis analytics.csv --output recommendations.txt
```

## Key Capabilities

- **Smart Sampling**: Handles large files efficiently
- **Multi-encoding Support**: Auto-detects file encodings
- **Australian Data Aware**: Built-in support for AU postcodes, phones, ABNs
- **Memory System**: Builds knowledge over time with the ENG command
- **Export Ready**: All outputs designed for LLM consumption

## Performance

- Small files (<1MB): Instant analysis
- Medium files (1-10MB): 2-5 seconds  
- Large files (>10MB): Automatic sampling for speed
- Memory efficient: Handles files larger than RAM

## Requirements

- Node.js 18+ 
- Works on Windows, Mac, Linux
- No Python, R, or external dependencies

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## License

MIT License - see [LICENSE](LICENSE) file for details.

---

**Built with ❤️ for the data community**