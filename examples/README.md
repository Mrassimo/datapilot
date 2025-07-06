# DataPilot Examples

This directory contains examples of DataPilot usage and sample outputs.

## Directory Structure

```
examples/
├── README.md           # This file
├── sample.csv          # Small sample dataset for testing
├── sample-outputs/     # Example analysis outputs
└── usage-examples.md   # Command-line usage examples
```

## Quick Start

```bash
# Analyse the sample CSV
datapilot analyse examples/sample.csv

# Run specific sections
datapilot analyse examples/sample.csv --sections 1,2,3

# Output to file
datapilot analyse examples/sample.csv --output my-report.md
```

## Sample Outputs

The `sample-outputs/` directory contains real analysis outputs from various datasets:

- `student_comprehensive_analysis_improved.txt` - Student performance dataset analysis
- `medical_comprehensive_analysis.txt` - Medical dataset analysis
- `london_air_quality_analysis.txt` - Environmental data analysis
- `taco_sales_analysis.txt` - Sales data analysis

These examples demonstrate the depth and breadth of DataPilot's analysis capabilities.

## More Examples

See `usage-examples.md` for comprehensive command-line examples and use cases.