# ⚡ Quick Start Guide

Get started with DataPilot in under 30 seconds!

## 🚀 **Fastest Way** (Absolute Beginner)

```bash
git clone https://github.com/Mrassimo/datapilot.git
cd datapilot
```

**Windows:** Double-click `DataPilot-UI.bat`  
**Mac/Linux:** Double-click `DataPilot-UI.command`

That's it! A beautiful interface will guide you through everything! 🎉

## ⚡ **Quick Commands**

```bash
# Interactive mode
./datapilot ui

# Analyze any CSV file
./datapilot all mydata.csv

# Statistical analysis
./datapilot eda sales.csv

# Data quality check  
./datapilot int customers.csv

# Visualization recommendations
./datapilot vis survey.csv

# AI-ready summary
./datapilot llm dataset.csv
```

## 🎯 **Common Workflows**

### First Time Analysis
```bash
./datapilot ui
# → Choose "Analyze a CSV file"
# → Browse and select your file
# → Follow the guided steps
```

### Business Analysis
```bash
./datapilot all quarterly-data.csv -o report.txt
# Copy report.txt to ChatGPT for insights
```

### Data Quality Check
```bash
./datapilot int production-data.csv
# Fix any issues found
./datapilot eda production-data.csv
```

## 💡 **Pro Tips**

- Use `--help` with any command for options
- Save output with `-o filename.txt`
- Try demo mode in the UI for examples
- Use learning mode to understand analysis types

**Need help?** Launch `./datapilot ui` and choose "Learning Mode" 📚