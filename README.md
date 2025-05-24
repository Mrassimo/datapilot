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

### `datapilot eng <file.csv>` - Data Engineering Archaeology 🏛️
**Revolutionary approach**: Each analysis contributes to growing warehouse intelligence that gets smarter over time.

**Basic Analysis:**
```bash
datapilot eng orders.csv              # Analyze table with warehouse context
datapilot eng orders.csv -o report.md # Save analysis to file
```

**Collective Intelligence Features:**
```bash
datapilot eng --show-map             # View discovered domains and tables
datapilot eng --compile-knowledge    # Generate complete warehouse report
datapilot eng --save-insights table "PURPOSE: Customer dimension..." # LLM feedback loop
```

**What makes this special:**
- **Persistent Learning**: Every table you analyze builds warehouse knowledge
- **LLM Integration**: Generates perfect prompts for AI analysis, then saves insights back
- **Relationship Discovery**: Automatically detects foreign key relationships across tables
- **Pattern Recognition**: Finds naming conventions and structural patterns
- **Technical Debt Tracking**: Accumulates cleanup estimates across your entire warehouse
- **Domain Classification**: Groups tables into business domains (Customer, Orders, Product, etc.)

**The Workflow:**
1. Analyze tables one by one: `datapilot eng table1.csv`
2. Copy the LLM prompt from output to ChatGPT/Claude
3. Save AI insights: `datapilot eng --save-insights table1 "PURPOSE: Core customer dimension..."`
4. Repeat for more tables - each analysis gets richer context
5. View progress: `datapilot eng --show-map`
6. Generate final report: `datapilot eng --compile-knowledge`

**Output includes:**
- SQL schema generation with confidence scores
- Cross-table relationship predictions
- Warehouse context from previous analyses
- Technical debt accumulation tracking
- Contextual LLM prompts that improve with each table
- Domain mapping and pattern detection

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
- **Data Archaeology**: Revolutionary ENG command builds collective warehouse intelligence over time
- **LLM Integration**: Perfect feedback loops between AI analysis and growing knowledge base
- **Australian Awareness**: Recognizes Australian postcodes, phone formats, and state codes
- **Fast Performance**: Streams large files, uses efficient algorithms

## Examples

### Basic Analysis
```bash
# Analyze sales data
datapilot eda sales_2024.csv

# Check customer data integrity
datapilot int customer_database.csv

# Get visualization ideas
datapilot vis monthly_metrics.csv

# Generate LLM context
datapilot llm combined_dataset.csv
```

### Data Archaeology Workflow
```bash
# Start discovering your warehouse
datapilot eng customers.csv
datapilot eng orders.csv  
datapilot eng products.csv

# Each analysis builds on previous knowledge
# After analyzing 5+ tables, see what you've learned:
datapilot eng --show-map

# Get a comprehensive warehouse report:
datapilot eng --compile-knowledge

# Example of the LLM feedback loop:
datapilot eng orders.csv
# (Copy LLM prompt from output to ChatGPT)
# (Get response from AI)
datapilot eng --save-insights orders "PURPOSE: Core transaction fact table UPSTREAM: E-commerce platform, POS systems..."

# Continue analyzing more tables - each gets smarter!
```

### Advanced Workflows
```bash
# Run complete analysis suite on a dataset
datapilot all sales_data.csv -o complete_analysis.md

# Quick analysis mode for large files
datapilot all huge_dataset.csv --quick

# Save specific analyses
datapilot eda complex_data.csv -o eda_report.txt
datapilot vis metrics.csv -o visualization_guide.md
```

## Output

All commands produce verbose text output optimized for copying into ChatGPT, Claude, or any other LLM for further analysis. The output includes:

- Detailed statistics and analysis
- Natural language descriptions
- Specific recommendations
- Formatted for easy reading by both humans and LLMs

## License

MIT