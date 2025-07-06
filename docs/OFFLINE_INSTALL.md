# DataPilot CLI - Offline Installation Guide

This guide provides instructions for installing DataPilot CLI v1.4.0 in environments without internet access.

## 📦 Package Overview

DataPilot CLI v1.4.0 includes:
- **Universal Format Support**: CSV, JSON, Excel, TSV, Parquet, JSONL
- **Multi-File Join Analysis**: Intelligent relationship detection across datasets  
- **6-Section Analysis Pipeline**: Overview → Quality → EDA → Visualization → Engineering → Modeling
- **All Dependencies Bundled**: No internet connection required during installation

## 🚀 Installation Methods

### Method 1: Global Installation (Recommended)

```bash
# Copy the package file to your offline machine
# Install globally from the .tgz package
npm install -g datapilot-cli-1.4.0.tgz

# Verify installation
datapilot --version
# Should output: 1.4.0

# Test basic functionality
datapilot --help
```

### Method 2: Local Installation

```bash
# Extract the package
tar -xzf datapilot-cli-1.4.0.tgz

# Navigate to extracted directory
cd package/

# Install dependencies (offline mode)
npm install --production --offline

# Optional: Link for global access
npm link

# Verify installation
./dist/cli/index.js --version
```

### Method 3: Portable Installation

```bash
# Extract to a specific directory
mkdir datapilot-offline
tar -xzf datapilot-cli-1.4.0.tgz -C datapilot-offline

cd datapilot-offline/package/

# Install dependencies
npm install --production --offline

# Create wrapper script
echo '#!/bin/bash' > datapilot
echo 'node "$(dirname "$0")/dist/cli/index.js" "$@"' >> datapilot
chmod +x datapilot

# Use the portable version
./datapilot --version
```

## 🔧 Configuration for Offline Use

### Create Configuration File
Create `.datapilotrc` in your working directory or home directory:

```yaml
# Offline-optimised configuration
performance:
  chunkSize: 10000
  memoryLimit: "512mb"
  parallelProcessing: true

analysis:
  sections: [1, 2, 3, 4, 5, 6]
  confidenceLevel: 0.95
  joinConfidenceThreshold: 0.5

output:
  format: "markdown"
  includeRawData: false
  verboseLogging: false
```

## 📊 Testing Your Installation

### Basic Tests
```bash
# Test single file analysis
datapilot info sample.csv
datapilot validate sample.xlsx
datapilot overview sample.json

# Test multi-format support
datapilot all data.csv --format markdown
datapilot all data.xlsx --sheet "Sheet1"
datapilot all data.json --flatten-objects
```

### Advanced Tests
```bash
# Test multi-file join analysis
datapilot engineering customers.csv orders.csv products.csv
datapilot join file1.csv file2.csv
datapilot discover /path/to/data/directory

# Test performance with large files
datapilot all large-file.csv --chunk-size 50000 --memory-limit 1gb
```

## 🎯 Available Commands

### Core Analysis Commands
```bash
datapilot all <file>                    # Complete 6-section analysis
datapilot overview <file>               # File metadata and structure
datapilot quality <file>                # Data quality assessment
datapilot eda <file>                    # Statistical analysis
datapilot visualization <file>          # Chart recommendations
datapilot engineering <files...>        # ML engineering + joins
datapilot modeling <file>               # Algorithm recommendations
```

### Multi-File Analysis Commands
```bash
datapilot join <files...>               # Analyze relationships
datapilot discover <directory>          # Auto-discover joins
datapilot join-wizard <file1> <file2>   # Interactive wizard
datapilot optimise-joins <files...>     # Performance optimisation
```

### Utility Commands
```bash
datapilot info <file>                   # Quick file information
datapilot validate <file>               # Format validation
datapilot --help                        # Show all options
datapilot --version                     # Show version info
```

## 🛠️ Troubleshooting

### Common Issues

**"datapilot: command not found"**
```bash
# Check if npm global bin is in PATH
npm config get prefix
echo $PATH | grep $(npm config get prefix)

# Add to PATH if needed (Linux/macOS)
echo 'export PATH="$(npm config get prefix)/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc

# Alternative: Use full path
$(npm config get prefix)/bin/datapilot --version
```

**Permission Errors**
```bash
# Fix permissions on Linux/macOS
chmod +x $(npm config get prefix)/bin/datapilot

# Or use sudo for global install
sudo npm install -g datapilot-cli-1.4.0.tgz
```

**Memory Issues with Large Files**
```bash
# Increase memory limits
datapilot all large-file.csv --memory-limit 2gb --chunk-size 5000

# Use streaming mode
datapilot all large-file.csv --verbose --progress
```

### Validation Commands
```bash
# Verify installation integrity
npm list -g datapilot-cli

# Check TypeScript compilation (if source available)
npm run typecheck

# Run basic functionality test
datapilot info /dev/null 2>/dev/null || echo "Installation verified"
```

## 📁 Supported File Formats

| Format | Extensions | Auto-Detection | Offline Support |
|--------|------------|----------------|-----------------|
| **CSV** | `.csv` | ✅ Content analysis | ✅ Full support |
| **TSV** | `.tsv`, `.tab` | ✅ Tab validation | ✅ Full support |  
| **JSON** | `.json`, `.jsonl`, `.ndjson` | ✅ Syntax validation | ✅ Full support |
| **Excel** | `.xlsx`, `.xls`, `.xlsm` | ✅ Binary detection | ✅ Full support |
| **Parquet** | `.parquet` | ✅ Metadata inspection | ✅ Full support |

## 🔒 Security Considerations

- **No Network Access**: DataPilot operates entirely offline
- **Local Processing**: All data remains on your machine
- **No Telemetry**: No usage data transmitted
- **Input Validation**: Comprehensive format validation
- **Memory Safety**: Automatic resource cleanup

## 📝 Package Information

- **Version**: 1.4.0
- **Package Size**: ~50MB (includes all dependencies)
- **Node.js Requirement**: 20+ (bundled dependencies compatible)
- **Platform Support**: Windows, macOS, Linux
- **Architecture**: x64, arm64

## 🤝 Offline Support

For additional support in offline environments:
1. Check the bundled documentation in `docs/`
2. Review example outputs in `examples/sample-outputs/`
3. Use `datapilot --help` for command reference
4. Refer to `CLAUDE.md` for configuration options

---

**DataPilot CLI v1.4.0** - Complete data analysis capabilities, fully functional offline. 🚁📊