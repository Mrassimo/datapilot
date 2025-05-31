# 🚀 DataPilot Installation Guide

Multiple ways to get DataPilot running - choose what works best for you!

## ⚡ **Option 1: Zero-Install** (Fastest!)

**Perfect for: Anyone who wants to try DataPilot immediately**

```bash
# 1. Clone and you're done!
git clone https://github.com/Mrassimo/datapilot.git
cd datapilot

# 2. Start using immediately
./datapilot ui                    # Interactive mode
./datapilot eda mydata.csv        # Analyze data
```

**Why this works:** DataPilot is self-contained with a 2.7MB bundle that includes everything!

## 🎨 **Option 2: Double-Click Launchers** (Easiest!)

**Perfect for: Complete beginners, non-technical users**

After cloning (Option 1 above):

- **Windows**: Double-click `DataPilot-UI.bat`
- **Mac/Linux**: Double-click `DataPilot-UI.command`

This opens a beautiful, guided interface that walks you through everything!

## 🌍 **Option 3: Global Installation** (Traditional)

**Perfect for: Users who want to use DataPilot from anywhere**

```bash
# Install globally with npm
npm install -g datapilot

# Now use anywhere
datapilot ui
datapilot eda ~/Documents/sales.csv
```

## 👨‍💻 **Option 4: Developer Setup** (Advanced)

**Perfect for: Contributors, developers who want to modify DataPilot**

```bash
git clone https://github.com/Mrassimo/datapilot.git
cd datapilot
npm install              # Install development dependencies
npm run build           # Build the self-contained bundle
npm test               # Run comprehensive tests
npm link               # Make available globally
```

## 🎯 **Verification**

Test that everything works:

```bash
# Check version
./datapilot --version

# Quick help
./datapilot --help

# Test with sample data (if you have a CSV file)
./datapilot eda tests/fixtures/test_sales.csv

# Launch interactive mode
./datapilot ui
```

## 🔧 **Troubleshooting**

### "Command not found"
```bash
# Make sure you're in the datapilot directory
cd datapilot

# Make sure launcher is executable (Mac/Linux)
chmod +x datapilot

# Try the full path
node dist/datapilot.js --help
```

### "Node.js not found"
You need Node.js 18+ installed:
- Download from [nodejs.org](https://nodejs.org/)
- Or use a package manager: `brew install node` (Mac) or `choco install nodejs` (Windows)

### "Permission denied" (Mac/Linux)
```bash
chmod +x datapilot
chmod +x DataPilot-UI.command
```

### Bundle issues
```bash
# Rebuild the bundle
npm install
npm run build
```

## 🎯 **What You Get**

All installation methods give you:

- ✅ **Interactive UI** with guided workflows
- ✅ **Command line tools** for all analysis types  
- ✅ **Self-contained package** - no additional downloads
- ✅ **Cross-platform** - Windows, Mac, Linux
- ✅ **Zero configuration** - works immediately
- ✅ **Comprehensive analysis** - 5 different analysis modes
- ✅ **AI-ready output** - perfect for ChatGPT, Claude, etc.

## 💡 **Recommendations**

- **New to data analysis?** → Use Option 2 (Double-click launchers)
- **Want to try quickly?** → Use Option 1 (Zero-install)  
- **Regular user?** → Use Option 3 (Global installation)
- **Developer/contributor?** → Use Option 4 (Developer setup)

## 🪟 **Advanced Windows Setup**

### Making DataPilot Available Everywhere (Windows)

**Option A: Add to PATH**
1. Open System Properties → Advanced → Environment Variables
2. Add `C:\path\to\datapilot` to your PATH
3. Now use `datapilot` from any directory!

**Option B: Create Global Alias**
1. Create `datapilot.bat` in a PATH directory:
   ```batch
   @echo off
   node "C:\path\to\datapilot\dist\datapilot.js" %*
   ```

**Option C: PowerShell Function**
Add to your PowerShell profile:
```powershell
function datapilot {
    node "C:\path\to\datapilot\dist\datapilot.js" $args
}
```

### Windows File Handling

```bash
# Paths with spaces (use quotes!)
datapilot all "C:\My Documents\Sales Report 2024.csv"

# Network drives
datapilot all "\\NetworkShare\Data\report.csv"

# OneDrive/Dropbox
datapilot all "%USERPROFILE%\OneDrive\Documents\data.csv"

# Force encoding for international data
datapilot all data.csv --encoding latin1
datapilot all european_data.csv --delimiter ";"
```

### Batch Processing (Windows)

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

**Need more help?** Check out our [Easy Usage Guide](docs/EASY-USAGE.md) or launch `./datapilot ui` and select "Learning Mode"! 📚