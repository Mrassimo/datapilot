# 🚀 DataPilot Easy Installation Guide

## Quick Start (No Installation Required!)

DataPilot comes with a pre-built bundle, so you can use it immediately without installing dependencies:

```bash
# 1. Clone the repository
git clone https://github.com/Mrassimo/datapilot.git
cd datapilot

# 2. That's it! Start using DataPilot:
node dist/datapilot.js help
```

## Making DataPilot Available Everywhere

### Option 1: Add to PATH (Recommended for Windows)

1. **Add DataPilot to your PATH**:
   - Open System Properties → Advanced → Environment Variables
   - Add `C:\path\to\datapilot` to your PATH
   - Now you can use `datapilot` from any directory!

2. **Use from anywhere**:
   ```bash
   # From any directory:
   datapilot all mydata.csv
   datapilot ui
   ```

### Option 2: Create a Global Alias (Windows)

1. **Create a batch file** in a directory that's in your PATH (e.g., `C:\Windows\System32`):
   ```batch
   @echo off
   node "C:\path\to\datapilot\dist\datapilot.js" %*
   ```
   Save as `datapilot.bat`

2. **Now use from anywhere**:
   ```bash
   datapilot eda "C:\My Data\sales.csv"
   datapilot all data.csv -o report.txt
   ```

### Option 3: PowerShell Function

Add this to your PowerShell profile:
```powershell
function datapilot {
    node "C:\path\to\datapilot\dist\datapilot.js" $args
}
```

## Working with Files in Different Directories

### Analysing Files Anywhere

```bash
# Use absolute paths
datapilot all "C:\Users\YourName\Documents\data.csv"

# Use relative paths
datapilot all ..\data\sales.csv

# Paths with spaces (use quotes!)
datapilot all "C:\My Documents\Sales Report 2024.csv"

# Save output to specific location
datapilot all data.csv -o "C:\Reports\analysis.txt"
```

### Working in Your Data Directory

```bash
# Navigate to your data folder
cd "C:\My Data Files"

# Analyse files in current directory
datapilot all sales.csv
datapilot eda customers.csv

# Analyse multiple files
datapilot eng analyze *.csv
```

### Handling Different Encodings

```bash
# Force specific encoding for international data
datapilot all data.csv --encoding latin1
datapilot all japanese_data.csv --encoding utf8

# Force delimiter for European CSV files
datapilot all data.csv --delimiter ";"
```

## Common Windows Scenarios

### 1. Analysing Downloads

```bash
cd C:\Users\%USERNAME%\Downloads
datapilot all downloaded_data.csv
```

### 2. Network Drives

```bash
datapilot all "\\NetworkShare\Data\report.csv"
datapilot all "Z:\SharedData\sales.csv"
```

### 3. OneDrive/Dropbox

```bash
datapilot all "C:\Users\%USERNAME%\OneDrive\Documents\data.csv"
datapilot all "%USERPROFILE%\Dropbox\Analysis\report.csv"
```

### 4. Batch Processing

Create a batch file for repeated analysis:
```batch
@echo off
echo Analysing all CSV files...
for %%f in (*.csv) do (
    echo Processing %%f...
    datapilot all "%%f" -o "%%~nf_analysis.txt"
)
echo Done!
```

## Tips for Easy Usage

### 1. **File Explorer Integration**

Right-click any CSV file → "Send to" → DataPilot
(Create a shortcut in `%APPDATA%\Microsoft\Windows\SendTo`)

### 2. **Quick Access from Terminal**

```bash
# Create short aliases in your .bashrc or PowerShell profile
alias dp='datapilot'
alias dpui='datapilot ui'

# Then use:
dp all mydata.csv
dpui
```

### 3. **Default Output Directory**

Set up a default reports directory:
```bash
# Always save to Reports folder
datapilot all data.csv -o "%USERPROFILE%\Documents\DataPilot Reports\%date%.txt"
```

## Troubleshooting

### "File not found" Error
- Use quotes around paths with spaces: `"C:\My Folder\data.csv"`
- Check file extension is `.csv`
- Use Tab completion to verify path

### Strange Characters in Output
- Try: `datapilot all data.csv --encoding latin1`
- For Excel exports: `--encoding utf16le`

### Wrong Delimiter Detected
- Force delimiter: `--delimiter ";"` or `--delimiter tab`

### Out of Memory
- Use quick mode: `datapilot all large_file.csv --quick`
- Process smaller chunks of data

## Building from Source (Optional)

If you want to modify DataPilot:

```bash
# Install dependencies
npm install

# Build new bundle
npm run build

# Test your changes
npm test
```

## Quick Reference Card

```bash
# Interactive UI
datapilot ui

# Complete analysis
datapilot all data.csv
datapilot all "path with spaces.csv"
datapilot all data.csv -o report.txt

# Individual analyses
datapilot eda data.csv      # Statistics
datapilot int data.csv      # Data quality
datapilot vis data.csv      # Chart recommendations
datapilot llm data.csv      # AI-ready summary

# Multiple files
datapilot eng analyze *.csv

# Force options
datapilot all data.csv --encoding latin1
datapilot all data.csv --delimiter ";"
datapilot all data.csv --no-header
datapilot all data.csv --quick
```

## Next Steps

1. Clone the repository
2. Add to PATH or create an alias
3. Start analysing your CSV files!
4. Use `datapilot ui` for the interactive experience

Happy data analysis! 🎉
