# DataPilot CLI

A zero-config command-line tool that analyses CSV files and generates verbose, LLM-ready text outputs that you can copy and paste directly into ChatGPT, Claude, or any other LLM.

## Installation

```bash
# Install globally
npm install -g datapilot

# Or run locally
npm install
npm link
```

## Usage

```bash
# Run any command
datapilot eda sales.csv        # Exploratory Data Analysis
datapilot int customers.csv     # Data Integrity Check
datapilot vis transactions.csv  # Visualization Recommendations
datapilot eng inventory.csv     # Data Engineering Analysis
datapilot llm dataset.csv       # LLM Context Generation
```

## Commands

### `datapilot eda <file.csv>` - Exploratory Data Analysis
Generates a comprehensive statistical analysis formatted for LLM consumption.
- Detects column types automatically
- Calculates all relevant statistics
- Identifies patterns and anomalies
- Outputs everything as structured text

### `datapilot int <file.csv>` - Data Integrity Check
Focuses on data quality issues in a format perfect for explaining problems to stakeholders via LLM.
- Duplicate detection
- Format validation
- Business rule violations
- Data quality scoring

### `datapilot vis <file.csv>` - Visualization Recommendations
Instead of generating images, it describes what visualizations would be most insightful.
- Chart type recommendations
- Axis configurations
- Key insights to highlight
- Dashboard layout suggestions

### `datapilot eng <file.csv>` - Data Engineering Analysis
Provides schema and data pipeline recommendations.
- SQL schema generation
- ETL pipeline design
- Data warehouse modeling
- Performance considerations

### `datapilot llm <file.csv>` - LLM Context Generation
Creates the perfect context dump for pasting into any LLM for further analysis.
- Natural language summary
- Key patterns and insights
- Statistical summaries
- Suggested analyses

## Features

- **Zero Configuration**: Just install and run - no API keys, no setup files
- **Smart Type Detection**: Automatically identifies numbers, dates, categories, emails, phone numbers, etc.
- **Comprehensive Analysis**: Each command produces verbose, detailed output perfect for LLM consumption
- **Copy-Paste Workflow**: All outputs are formatted text - just select, copy, and paste into your LLM
- **Australian Awareness**: Recognizes Australian postcodes, phone formats, and state codes
- **Fast Performance**: Streams large files, uses efficient algorithms

## Examples

```bash
# Analyze sales data
datapilot eda sales_2024.csv

# Check customer data integrity
datapilot int customer_database.csv

# Get visualization ideas
datapilot vis monthly_metrics.csv

# Design a data pipeline
datapilot eng raw_transactions.csv

# Generate LLM context
datapilot llm combined_dataset.csv
```

## Output

All commands produce verbose text output optimized for copying into ChatGPT, Claude, or any other LLM for further analysis. The output includes:

- Detailed statistics and analysis
- Natural language descriptions
- Specific recommendations
- Formatted for easy reading by both humans and LLMs

## License

MIT