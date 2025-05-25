# DataPilot CLI Complete Guide

## 🚀 Installation & Setup

```bash
# Install DataPilot globally (do this once)
npm install -g datapilot

# Verify installation
datapilot --help

# Basic usage pattern
datapilot <command> <file.csv> [options]
```

## 📚 Understanding DataPilot Commands

DataPilot has 6 main commands, each designed for a specific purpose:

### 1️⃣ **eda** - Exploratory Data Analysis
**What it does:** Gives you a complete statistical overview of your data  
**When to use:** When you first get a CSV and need to understand what's in it  
**Real-world example:** Your boss gives you a sales.csv file and asks "what's in this?"

```bash
# Basic usage - results show in terminal
datapilot eda sales.csv

# Save results to a file for later
datapilot eda sales.csv -o sales_analysis.txt

# What you'll learn:
# - How many rows and columns
# - What type each column is (numbers, text, dates)
# - Statistical summaries (average, min, max, etc.)
# - How much data is missing
# - Distribution patterns (is data skewed?)
```

**Example output explanation:**
```
Column: price
- Data type: float (decimal numbers)
- Non-null count: 950 (95.0%) <- 5% missing data
- Statistics:
  * Mean: $45.23 <- average price
  * Median: $39.99 <- middle value
  * Min: $9.99 <- cheapest item
  * Max: $199.99 <- most expensive item
```

---

### 2️⃣ **int** - Data Integrity Check
**What it does:** Finds problems and quality issues in your data  
**When to use:** Before importing data into a database or using it for analysis  
**Real-world example:** You need to load customer data into your CRM but want to check for duplicates first

```bash
# Check for data quality issues
datapilot int customers.csv

# Save the integrity report
datapilot int customers.csv -o integrity_report.txt

# What it finds:
# - Duplicate rows (same data appearing multiple times)
# - Format violations (phone numbers in wrong format)
# - Business rule violations (negative ages, future birthdates)
# - Missing required fields
# - Inconsistent data (NY, New York, new york)
```

**Understanding the output:**
```
HIGH PRIORITY ISSUES:
- 47 duplicate customer records found
  Impact: May cause double-charging
  Fix: Remove duplicates keeping first occurrence

MEDIUM PRIORITY:
- Email format violations in 23 rows
  Examples: "john@", "mary.gmail.com", "test@@example.com"
  Fix: Validate email format before import
```

---

### 3️⃣ **vis** - Visualization Recommendations
**What it does:** Tells you the best ways to visualize your data  
**When to use:** When building dashboards, reports, or presentations  
**Real-world example:** You need to create a dashboard for monthly sales data

```bash
# Get visualization recommendations
datapilot vis monthly_sales.csv

# Save recommendations for your design team
datapilot vis monthly_sales.csv -o dashboard_plan.txt

# What it recommends:
# - Best chart types for each data combination
# - Which columns to use for X and Y axes
# - Color coding suggestions
# - Dashboard layout recommendations
# - Key insights to highlight
```

**Example recommendation:**
```
RECOMMENDED: Time Series Line Chart
- X-axis: transaction_date
- Y-axis: revenue
- Color by: product_category
- Why: Shows trends over time with clear category comparison
- Insight: December shows 3x higher revenue (holiday season)
```

---

### 4️⃣ **eng** - Data Engineering Archaeology 🏛️
**What it does:** Discovers how multiple CSV files relate to each other  
**When to use:** When you have multiple CSVs and need to understand how they connect  
**Real-world example:** You inherit a folder of CSV exports and need to build a database

```bash
# Method 1: Analyze files one by one (old way, still works)
datapilot eng orders.csv
datapilot eng customers.csv
datapilot eng products.csv

# Method 2: Analyze everything at once (NEW! Recommended)
datapilot eng analyze *.csv

# This will:
# 1. Analyze each CSV file
# 2. Detect relationships (like customer_id appearing in multiple files)
# 3. Suggest SQL schemas
# 4. Estimate how much work is needed to clean the data
# 5. Generate prompts you can copy to ChatGPT/Claude for deeper insights

# After analysis, save insights from your AI assistant
echo "PURPOSE: This is our main transaction fact table" | datapilot eng save orders
datapilot eng save customers "PURPOSE: Customer dimension with demographics"

# Generate a complete warehouse report
datapilot eng report -o my_warehouse_documentation.txt

# View a visual map of how tables connect
datapilot eng map
```

**Understanding the archaeology output:**
```
DISCOVERED RELATIONSHIP:
orders.customer_id → customers.customer_id (95% confidence)
Evidence: 
- Same column name
- All order customer_ids exist in customers table
- Data types match (VARCHAR(10))

SUGGESTED SQL:
ALTER TABLE orders 
ADD FOREIGN KEY (customer_id) 
REFERENCES customers(customer_id);
```

---

### 5️⃣ **llm** - LLM Context Generation
**What it does:** Creates a perfect summary of your data for AI assistants  
**When to use:** When you want ChatGPT or Claude to analyze your data  
**Real-world example:** You want ChatGPT to find patterns in your sales data

```bash
# Generate AI-ready context
datapilot llm sales_data.csv

# Save to copy into ChatGPT
datapilot llm sales_data.csv -o context_for_chatgpt.txt

# What it creates:
# - Natural language description of your data
# - Key statistics and patterns
# - Data quality notes
# - Suggested analysis questions
# - Everything formatted for easy AI consumption
```

**How to use with ChatGPT/Claude:**
1. Run `datapilot llm yourfile.csv`
2. Copy the ENTIRE output
3. Paste into ChatGPT/Claude
4. Ask: "What patterns do you see?" or "What's interesting about this data?"

---

### 6️⃣ **all** - Complete Analysis Suite
**What it does:** Runs ALL analyses in one go  
**When to use:** When you need a complete understanding of a new dataset  
**Real-world example:** First day at a new job, boss says "analyze this data"

```bash
# Run everything
datapilot all company_data.csv

# Run everything and save to file
datapilot all company_data.csv -o complete_analysis.txt

# Run in quick mode (faster, less detailed)
datapilot all company_data.csv --quick
```

---

## 📋 Complete Options Reference

### Global Options (work with every command)
- `-o, --output <filename>` - Save results to a file instead of showing on screen
- `-h, --help` - Show help for any command
- `--no-header` - Tell DataPilot your CSV has no header row

### Command-Specific Options
- `--quick` - (only for 'all' command) Skip detailed analyses for speed

---

## 🎯 Real-World Workflows

### Workflow 1: "I just got a new CSV file"
```bash
# Step 1: What's in this file?
datapilot eda mydata.csv

# Step 2: Any quality issues?
datapilot int mydata.csv

# Step 3: How should I visualize it?
datapilot vis mydata.csv
```

### Workflow 2: "I have a folder full of CSVs"
```bash
# Step 1: Analyze all files and find relationships
datapilot eng analyze *.csv

# Step 2: Read the LLM prompts in the output, copy to ChatGPT
# Step 3: Save the insights ChatGPT gives you
echo "ChatGPT's response here" | datapilot eng save table_name

# Step 4: Generate documentation
datapilot eng report -o database_documentation.txt
```

### Workflow 3: "I need ChatGPT to analyze this"
```bash
# Step 1: Generate LLM context
datapilot llm mydata.csv -o context.txt

# Step 2: Copy context.txt contents to ChatGPT
# Step 3: Ask ChatGPT your questions!
```

### Workflow 4: "Quick data quality check"
```bash
# For small files
datapilot int data.csv

# For large files (sample-based checking)
datapilot all data.csv --quick
```

---

## 💡 Pro Tips for Beginners

### Understanding File Paths
```bash
# If your CSV is in the current folder
datapilot eda myfile.csv

# If it's in a subfolder
datapilot eda data/myfile.csv

# If it's somewhere else (use full path)
datapilot eda /Users/yourname/Desktop/myfile.csv

# Analyze all CSVs in current folder
datapilot eng analyze *.csv
```

### Saving Output
```bash
# ALWAYS use -o flag to save (don't use > redirection)
datapilot eda data.csv -o results.txt  # ✅ Correct
datapilot eda data.csv > results.txt   # ❌ Won't format properly
```

### Handling Common Issues
```bash
# File has no headers?
datapilot eda data.csv --no-header

# Weird characters showing up?
# Don't worry! DataPilot auto-detects encodings

# File too large?
# DataPilot automatically handles large files by sampling
```

### Reading the Output
- **Green checkmarks (✓)** = Good things
- **Red X marks (✗)** = Issues found
- **Yellow warnings (⚠️)** = Things to be aware of
- **Percentages** = How confident DataPilot is
- **"Missing section"** = Expected data not found

---

## 🎨 Examples for Different Industries

### E-commerce
```bash
# Analyze sales patterns
datapilot eda orders.csv
datapilot vis orders.csv  # Find out how to visualize sales trends

# Check customer data quality
datapilot int customers.csv  # Find duplicate customers

# Understand your warehouse
datapilot eng analyze orders.csv customers.csv products.csv
```

### Healthcare
```bash
# Patient data analysis (check quality first!)
datapilot int patient_records.csv
datapilot eda patient_records.csv --no-header  # If exported from old system

# Treatment outcome visualization
datapilot vis treatment_outcomes.csv
```

### Finance
```bash
# Transaction analysis
datapilot all transactions.csv -o daily_report.txt

# Find data relationships
datapilot eng analyze accounts.csv transactions.csv customers.csv
```

---

## 🚨 Troubleshooting

### "Command not found"
```bash
# Make sure DataPilot is installed globally
npm install -g datapilot
```

### "File not found"
```bash
# Check you're in the right directory
pwd  # Shows current directory
ls   # Lists files in current directory

# Use full path if needed
datapilot eda /full/path/to/your/file.csv
```

### "No data found in CSV file"
```bash
# File might be empty or have only headers
# Check with: head -10 yourfile.csv
```

### Getting Help
```bash
# General help
datapilot --help

# Help for specific command
datapilot eda --help
datapilot eng --help

# See all available commands
datapilot
```

---

## 📖 Complete Example: Analyzing Sales Data

Let's say you have three files: `sales.csv`, `customers.csv`, and `products.csv`

```bash
# 1. First, understand each file
datapilot eda sales.csv -o sales_overview.txt
datapilot eda customers.csv -o customers_overview.txt
datapilot eda products.csv -o products_overview.txt

# 2. Check data quality
datapilot int sales.csv
# Output shows: "14 duplicate transactions found"

# 3. Discover relationships
datapilot eng analyze *.csv
# Output shows: "sales.customer_id links to customers.id"

# 4. Get visualization recommendations
datapilot vis sales.csv
# Output recommends: "Time series chart for revenue by date"

# 5. Prepare for AI analysis
datapilot llm sales.csv -o sales_context.txt
# Copy sales_context.txt to ChatGPT
# Ask: "What are the top 3 insights from this sales data?"

# 6. Save insights from ChatGPT
echo "INSIGHT: Holiday season drives 40% of annual revenue" | datapilot eng save sales

# 7. Generate final report
datapilot eng report -o sales_analysis_complete.txt
```

---

## 🎯 Quick Reference Card

| Task | Command |
|------|---------|
| "What's in this file?" | `datapilot eda file.csv` |
| "Check for problems" | `datapilot int file.csv` |
| "How to visualize?" | `datapilot vis file.csv` |
| "Analyze multiple files" | `datapilot eng analyze *.csv` |
| "Prepare for ChatGPT" | `datapilot llm file.csv` |
| "Do everything" | `datapilot all file.csv` |
| "Save output" | Add `-o filename.txt` |
| "No headers" | Add `--no-header` |
| "Get help" | Add `--help` |

---

**Remember:** DataPilot is designed to be copy-paste friendly. All output can be selected, copied, and pasted directly into ChatGPT, Claude, reports, or documentation!