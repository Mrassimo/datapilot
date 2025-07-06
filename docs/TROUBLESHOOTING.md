# DataPilot Troubleshooting Guide

This guide provides solutions to common issues and debugging strategies for DataPilot.

## Quick Fixes

### Command Not Found
**Problem:** `datapilot: command not found` or `'datapilot' is not recognised`

**Quick Solutions:**
```bash
# Option 1: Use npx (works immediately)
npx datapilot-cli all data.csv

# Option 2: Check if installed correctly
npm list -g datapilot-cli

# Option 3: Reinstall
npm uninstall -g datapilot-cli
npm install -g datapilot-cli
```

### Memory Issues
**Problem:** Out of memory errors or slow processing

**Quick Solutions:**
```bash
# Reduce memory usage
datapilot all data.csv --memory-limit 256mb --chunk-size 5000

# Enable progress monitoring
datapilot all data.csv --verbose --progress
```

### File Format Issues
**Problem:** File not recognised or parsing errors

**Quick Solutions:**
```bash
# Force format detection
datapilot all data.txt --format csv

# Validate file first
datapilot validate data.csv

# Check file info
datapilot info data.csv
```

## Installation Issues

### Windows-Specific Problems

#### Problem: `'datapilot' is not recognised as an internal or external command`

**Root Cause:** Windows PATH environment variable doesn't include npm global directory.

**Solution A: Use npx (Recommended)**
```bash
# No setup required - works immediately
npx datapilot-cli all data.csv
npx datapilot-cli --version
```

**Solution B: Fix PATH Variable**
```bash
# Step 1: Find npm global directory
npm config get prefix
# Example output: C:\Users\YourName\AppData\Roaming\npm

# Step 2: Add to PATH
# Windows 10/11:
# 1. Press Windows + X, select "System"
# 2. Click "Advanced system settings"
# 3. Click "Environment Variables"
# 4. Find "Path" in System Variables, click "Edit"
# 5. Click "New" and add the npm prefix path
# 6. Click "OK" to close all dialogs
# 7. Restart PowerShell/Command Prompt

# Step 3: Verify
datapilot --version
```

**Solution C: Use Full Path**
```bash
# Replace [npm-prefix] with actual path
C:\Users\YourName\AppData\Roaming\npm\datapilot --version
```

#### Problem: Permission denied during installation

**Solution:**
```bash
# Don't use administrator mode for npm
# Instead, configure npm to use user directory
mkdir %APPDATA%\npm-global
npm config set prefix %APPDATA%\npm-global
# Add %APPDATA%\npm-global to PATH
npm install -g datapilot-cli
```

### macOS/Linux Problems

#### Problem: `datapilot: command not found`

**Solution:**
```bash
# Check if npm global bin is in PATH
npm config get prefix
echo $PATH | grep $(npm config get prefix)

# If not found, add to PATH
echo 'export PATH="$(npm config get prefix)/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc

# For zsh users
echo 'export PATH="$(npm config get prefix)/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

#### Problem: Permission denied during installation

**Solution:**
```bash
# Option 1: Configure npm to use user directory (recommended)
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
npm install -g datapilot-cli

# Option 2: Fix npm permissions
sudo chown -R $(whoami) $(npm config get prefix)/{lib/node_modules,bin,share}

# Option 3: Use npx (no installation needed)
npx datapilot-cli all data.csv
```

### Network and Proxy Issues

#### Problem: Installation fails due to network issues

**Solutions:**
```bash
# Check npm registry connectivity
npm ping

# Try different registry
npm install -g datapilot-cli --registry https://registry.npmjs.org/

# For corporate proxies
npm config set proxy http://proxy.company.com:8080
npm config set https-proxy http://proxy.company.com:8080

# Clear npm cache
npm cache clean --force
```

## Runtime Issues

### Performance Problems

#### Problem: DataPilot is running very slowly

**Diagnosis:**
```bash
# Enable verbose logging to see what's happening
datapilot all data.csv --verbose

# Check system resources during processing
# Windows: Task Manager
# macOS: Activity Monitor  
# Linux: htop or top
```

**Solutions:**
```bash
# Reduce memory usage
datapilot all data.csv --memory-limit 256mb

# Reduce chunk size
datapilot all data.csv --chunk-size 5000

# Use single thread (for single-core systems)
datapilot all data.csv --threads 1

# Skip expensive sections
datapilot overview data.csv  # Only run section 1
```

#### Problem: Out of memory errors

**Error Messages:**
- `FATAL ERROR: Ineffective mark-compacts near heap limit`
- `JavaScript heap out of memory`

**Solutions:**
```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"
datapilot all data.csv

# Or use DataPilot's memory limit
datapilot all data.csv --memory-limit 2gb

# Reduce chunk size for large files
datapilot all data.csv --chunk-size 2000

# Process sections individually
datapilot overview data.csv
datapilot quality data.csv
datapilot eda data.csv
```

### File Processing Issues

#### Problem: File format not detected correctly

**Symptoms:**
- CSV parsed as single column
- JSON files not recognised
- Excel files fail to load

**Solutions:**
```bash
# Force format detection
datapilot all data.txt --format csv
datapilot all data.backup --format json

# Check file info first
datapilot info suspicious-file.txt

# Validate file format
datapilot validate data.csv

# For CSV files with non-standard delimiters
datapilot all data.csv --delimiter ";" --quote "'"
```

#### Problem: Encoding issues (special characters garbled)

**Solutions:**
```bash
# Force UTF-8 encoding (for validate command)
datapilot validate data.csv --encoding utf8

# Auto-detect encoding (for validate command)
datapilot validate data.csv --encoding auto

# For Windows files with BOM (for validate command)
datapilot validate data.csv --encoding utf8-bom

# Check file encoding externally
file -i data.csv  # Linux/macOS
# Use Notepad++ "Encoding" menu on Windows
```

#### Problem: Large file processing fails

**Error Messages:**
- `File too large to process`
- `Maximum file size exceeded`

**Solutions:**
```bash
# Use streaming mode explicitly  
datapilot all huge-file.csv --streaming

# Process in smaller chunks
datapilot all huge-file.csv --chunk-size 1000

# Monitor progress for large files
datapilot all huge-file.csv --progress --verbose
```

### Multi-File Analysis Issues

#### Problem: Join analysis not finding relationships

**Solutions:**
```bash
# Lower confidence threshold
datapilot engineering file1.csv file2.csv --confidence 0.3

# Enable verbose join analysis
datapilot engineering *.csv --verbose

# Check individual files first
datapilot overview file1.csv
datapilot overview file2.csv

# Use join wizard for guided analysis
datapilot join-wizard file1.csv file2.csv
```

#### Problem: Too many files to analyse

**Solutions:**
```bash
# Use directory discovery
datapilot discover /path/to/data/ --max-files 20

# Batch processing
datapilot engineering *.csv --batch-size 5

# Filter by file pattern
datapilot engineering customer*.csv order*.csv
```

### Output and Formatting Issues

#### Problem: Output not generated or empty

**Diagnosis:**
```bash
# Check if analysis completed successfully
datapilot all data.csv --verbose

# Try different output format
datapilot all data.csv --format json

# Output to specific file
datapilot all data.csv --output analysis.md
```

**Solutions:**
```bash
# Ensure output directory exists
mkdir -p output/
datapilot all data.csv --output output/report.md

# Check file permissions
ls -la output/

# Try stdout output
datapilot all data.csv --format json > analysis.json
```

#### Problem: JSON/YAML output malformed

**Solutions:**
```bash
# Enable pretty printing
datapilot all data.csv --format json --pretty

# Validate output
datapilot all data.csv --format json | jq .  # For JSON
datapilot all data.csv --format yaml | yq .  # For YAML

# Use different output format
datapilot all data.csv --format markdown
```

## Debugging Strategies

### Enable Detailed Logging

```bash
# Maximum verbosity
datapilot all data.csv --verbose --debug

# Log to file
datapilot all data.csv --verbose --log-file debug.log

# Environment variable for debugging
export DEBUG=datapilot:*
datapilot all data.csv
```

### Check System Resources

```bash
# Monitor during processing
# Windows
wmic process where name="node.exe" get processid,pagefile

# macOS
top -pid $(pgrep -f datapilot)

# Linux  
ps aux | grep datapilot
iostat -x 1  # Check disk I/O
```

### Configuration Debugging

```bash
# Check DataPilot version and verbose info
datapilot --version --verbose

# Test with minimal options
datapilot all data.csv --quiet
```

## Error Code Reference

### Exit Codes

| Code | Meaning | Solution |
|------|---------|----------|
| 0 | Success | No action needed |
| 1 | General error | Check error message |
| 2 | File not found | Verify file path |
| 3 | Permission denied | Check file permissions |
| 4 | Out of memory | Reduce memory usage |
| 5 | Invalid format | Check file format |
| 6 | Configuration error | Validate configuration |
| 7 | Network error | Check network connectivity |

### Common Error Messages

#### `Error: File not found: data.csv`
**Solution:**
```bash
# Check file exists
ls -la data.csv

# Use absolute path
datapilot all /full/path/to/data.csv

# Check current directory
pwd
ls *.csv
```

#### `Error: Invalid JSON on line 42`
**Solution:**
```bash
# Validate JSON separately
cat data.json | jq .

# Force JSON Lines format
datapilot all data.json --format jsonl

# Skip invalid lines
datapilot all data.json --skip-errors
```

#### `Error: Exceeded memory limit`
**Solution:**
```bash
# Increase memory limit
datapilot all data.csv --memory-limit 2gb

# Reduce chunk size
datapilot all data.csv --chunk-size 5000

# Use streaming mode
datapilot all data.csv --streaming --no-cache
```

## Getting Help

### Built-in Help

```bash
# General help
datapilot --help

# Command-specific help
datapilot all --help
datapilot engineering --help

# Show version and environment info
datapilot --version --verbose
```

### Diagnostic Information

When reporting issues, include:

```bash
# System information
datapilot --version
node --version
npm --version
uname -a  # Linux/macOS
systeminfo | findstr /B /C:"OS Name" /C:"OS Version"  # Windows

# Configuration
datapilot --version --verbose

# Error with full output
datapilot all problematic-file.csv --verbose 2>&1 | tee error.log
```

### Community Support

1. **Search existing issues**: [GitHub Issues](https://github.com/Mrassimo/datapilot/issues)
2. **Ask questions**: [GitHub Discussions](https://github.com/Mrassimo/datapilot/discussions)
3. **Create new issue** with:
   - Operating system and version
   - Node.js and npm versions
   - Complete command that failed
   - Full error output
   - Sample data file (if possible)

## Performance Optimization

### For Different File Sizes

**Small files (<1MB):**
```bash
datapilot all data.csv --chunk-size 1000 --memory-limit 128mb
```

**Medium files (1MB-100MB):**
```bash
datapilot all data.csv --chunk-size 10000 --memory-limit 512mb
```

**Large files (100MB-1GB):**
```bash
datapilot all data.csv --chunk-size 50000 --memory-limit 1gb --progress
```

**Very large files (>1GB):**
```bash
datapilot all data.csv --chunk-size 100000 --memory-limit 2gb --progress --streaming
```

### Hardware-Specific Optimizations

**Single-core systems:**
```bash
datapilot all data.csv --threads 1 --chunk-size 5000
```

**Multi-core systems:**
```bash
datapilot all data.csv --threads 4
```

**Limited RAM systems:**
```bash
datapilot all data.csv --memory-limit 256mb --chunk-size 2000 --no-cache
```

**High-end workstations:**
```bash
datapilot all data.csv --memory-limit 4gb --chunk-size 100000 --threads 8
```

## Preventive Measures

### Regular Maintenance

```bash
# Keep DataPilot updated
npm update -g datapilot-cli

# Clear npm cache periodically
npm cache clean --force

# Keep your CLI updated
datapilot --version
```

### Best Practices

1. **Always validate files first** with `datapilot validate`
2. **Use appropriate chunk sizes** for your system
3. **Monitor system resources** during processing
4. **Test with small samples** before processing large files
5. **Keep configuration files** in version control
6. **Use `--verbose` flag** for troubleshooting

Still having issues? Check the [Installation Guide](INSTALLATION.md) and [Configuration Guide](CONFIGURATION.md) for additional solutions.