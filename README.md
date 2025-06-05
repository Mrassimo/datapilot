# DataPilot

A lightweight, powerful CLI statistical computation engine for comprehensive CSV data analysis.

## Overview

DataPilot does the maths, so AI (or you) can derive the meaning. It serves as a "calculator on steroids" for data professionals working with CSV datasets.

## Installation

```bash
npm install
npm run build
```

## Usage

```bash
# Run complete analysis
datapilot all <your-data.csv>

# Run specific sections
datapilot overview <file>     # Dataset overview
datapilot quality <file>      # Data quality audit
datapilot eda <file>          # Exploratory data analysis
datapilot viz <file>          # Visualization recommendations
datapilot engineering <file>  # Data engineering insights
datapilot modeling <file>     # Predictive modeling guidance
```

## Development

```bash
npm run dev        # Watch mode
npm test          # Run tests
npm run lint      # Lint code
npm run typecheck # Type checking
```

## Project Status

✅ **Core Infrastructure Complete**
- TypeScript project setup with strict configuration
- Comprehensive CSV parser with auto-detection
- CLI structure ready for analysis modules

🚧 **In Progress**
- Analysis modules for Sections 1-6
- Report generation system

See [implementation-plan.md](implementation-plan.md) for detailed development roadmap.

## CSV Parser Features

The core CSV parser is now complete with these advanced features:

- **Streaming Architecture**: Handles large files (GB+) with minimal memory usage
- **Auto-detection**: Automatically detects encoding, delimiter, quote characters, headers
- **High Performance**: Optimized state machine with <30s processing for 1GB files
- **Format Support**: UTF-8/UTF-16 encoding, various delimiters (,;|\t), quoted fields
- **Error Handling**: Graceful error recovery with detailed parsing statistics
- **Cross-platform**: Works on Windows, macOS, and Linux

### Quick Test

Try the parser with the included sample:
```bash
npm run build
node dist/cli/index.js all examples/sample.csv
```