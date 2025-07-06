# DataPilot 🚁📊
**Turn any data file into insights in 30 seconds**

DataPilot analyses your CSV, Excel, JSON, and other data files to give you instant statistical insights - perfect for students, researchers, and anyone working with data.

## 🚀 Three Ways to Use DataPilot

### Option 1: 📦 **No Installation** (Easiest)
```bash
# Just run this with your file - no setup needed!
npx datapilot-cli all your-data.csv
```

### Option 2: 🔧 **Install Once, Use Everywhere**
```bash
# Install once
npm install -g datapilot-cli

# Then use anytime
datapilot all your-data.csv
```

### Option 3: 📥 **Download & Run**
```bash
# Download the project
git clone https://github.com/Mrassimo/datapilot.git
cd datapilot
npm install && npm run build

# Use it
node dist/datapilot.js all your-data.csv
```

## 📊 The Three Commands You Need

### 1. `all` - Complete Analysis (Most Popular)
Get everything: statistics, data quality, charts, and ML recommendations
```bash
npx datapilot-cli all sales-data.csv
npx datapilot-cli all survey-results.xlsx
npx datapilot-cli all experiment-data.json
```

### 2. `quality` - Check Your Data Health
Find missing values, outliers, and data problems
```bash
npx datapilot-cli quality messy-data.csv
```

### 3. `eda` - Statistical Analysis
Get averages, distributions, correlations, and more
```bash
npx datapilot-cli eda research-data.csv
```

## 💡 Real Examples

**For Students:**
```bash
# Analyse your survey data
npx datapilot-cli all class-survey.csv

# Check your experiment results
npx datapilot-cli quality lab-results.xlsx
```

**For Researchers:**
```bash
# Analyse multiple data files together
npx datapilot-cli all participants.csv measurements.csv

# Get publication-ready statistics
npx datapilot-cli eda research-data.csv > analysis-report.txt
```

**For Business Analysis:**
```bash
# Analyse sales data
npx datapilot-cli all quarterly-sales.xlsx

# Check data before presenting
npx datapilot-cli quality customer-data.csv
```

## 🎯 Pro Tips

- **Save results**: Add `> report.txt` to save analysis to a file
- **Multiple files**: List multiple files to find relationships between them
- **AI-ready**: Perfect output format for ChatGPT, Claude, and other AI tools
- **Works everywhere**: Mac, Windows, Linux - no special setup needed

## 🔧 What File Types Work?

✅ CSV files (`.csv`)  
✅ Excel files (`.xlsx`, `.xls`)  
✅ JSON files (`.json`)  
✅ TSV files (`.tsv`)  
✅ Parquet files (`.parquet`)  

## ❓ Common Questions

**Q: The command isn't working on Windows**  
A: Use `npx datapilot-cli` instead of just `datapilot`

**Q: My file is really big and it's slow**  
A: Add `--memory-limit 2gb` to your command

**Q: Can I use this with ChatGPT/Claude?**  
A: Yes! The output is designed to work perfectly with AI assistants

**Q: Need more help?**  
A: Run `npx datapilot-cli --help` or check our [detailed documentation](FULL-README.md)

## 📚 More Resources

- 📖 [Complete Documentation](FULL-README.md) - All features and technical details
- 🔧 [Installation Help](docs/INSTALLATION.md) - Detailed setup instructions  
- 🔍 [Troubleshooting](docs/TROUBLESHOOTING.md) - Fix common problems

---
Transform your data into insights in seconds! 🚁📊