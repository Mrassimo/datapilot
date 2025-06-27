# Enterprise Installation Guide

This guide provides comprehensive instructions for installing DataPilot in enterprise environments, including offline installations, Windows-specific fixes, and zero-dependency deployments.

## Table of Contents

- [Overview](#overview)
- [Installation Methods](#installation-methods)
- [Windows Enterprise Installation](#windows-enterprise-installation)
- [Offline Installation](#offline-installation)
- [Pre-built Packages](#pre-built-packages)
- [Standalone Executables](#standalone-executables)
- [Troubleshooting](#troubleshooting)
- [Proxy Configuration](#proxy-configuration)

## Overview

DataPilot offers multiple installation methods to accommodate various enterprise requirements:

1. **Standard NPM Installation** - Requires internet access and build tools
2. **Pre-built NPM Packages** - No build tools required, includes compiled code
3. **Standalone Executables** - Zero dependencies, no Node.js required
4. **Offline Installation** - Complete packages with bundled dependencies

## Installation Methods

### Method 1: Pre-built NPM Package (Recommended)

Starting with version 1.4.0, DataPilot publishes pre-built packages that include the compiled `dist` directory. This eliminates the need for TypeScript compilation during installation.

```bash
# Install directly from npm (no build required)
npm install -g datapilot-cli

# Verify installation
datapilot --version
```

### Method 2: Standalone Executables

Download platform-specific executables from the [Releases page](https://github.com/Mrassimo/datapilot/releases):

- **Windows**: `datapilot-windows-v1.4.0.exe`
- **Linux**: `datapilot-linux-v1.4.0`
- **macOS**: `datapilot-macos-v1.4.0`

No Node.js or npm required!

### Method 3: GitHub Release Assets

Download pre-built packages from GitHub releases:

```bash
# Download the pre-built package
wget https://github.com/Mrassimo/datapilot/releases/download/v1.4.0/datapilot-cli-v1.4.0-prebuilt.tgz

# Install globally
npm install -g datapilot-cli-v1.4.0-prebuilt.tgz
```

## Windows Enterprise Installation

### Common Windows Issues and Solutions

#### Issue 1: Build Tools Not Available

**Solution**: Use pre-built packages or standalone executables

```bash
# Option 1: Install pre-built package
npm install -g datapilot-cli

# Option 2: Download Windows executable
# No installation needed - just run datapilot-windows-v1.4.0.exe
```

#### Issue 2: PATH Configuration

**Solution**: Use npx or full path

```bash
# Using npx (recommended)
npx datapilot-cli --version

# Using full path
%APPDATA%\npm\datapilot --version
```

#### Issue 3: Permission Errors

**Solution**: Run as Administrator or use --unsafe-perm

```bash
# Run Command Prompt as Administrator, then:
npm install -g datapilot-cli --unsafe-perm
```

### Windows-Specific Installation Script

Create `install-datapilot.bat`:

```batch
@echo off
echo Installing DataPilot for Windows...

REM Check if npm is available
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: npm not found. Please install Node.js first.
    exit /b 1
)

REM Clear npm cache
echo Clearing npm cache...
npm cache clean --force

REM Install with Windows-friendly options
echo Installing DataPilot...
npm install -g datapilot-cli --unsafe-perm --no-audit --no-fund

REM Verify installation
echo.
echo Verifying installation...
npx datapilot-cli --version

echo.
echo Installation complete!
echo Use 'npx datapilot-cli' to run DataPilot
pause
```

## Offline Installation

### Creating Offline Packages

1. On a machine with internet access:

```bash
# Clone the repository
git clone https://github.com/Mrassimo/datapilot.git
cd datapilot

# Create offline package
npm run pack:offline
```

This creates:
- `datapilot-cli-1.4.0.tgz` - Package with bundled dependencies
- `OFFLINE_INSTALL.md` - Installation instructions

2. Transfer the `.tgz` file to the offline environment

3. Install on the target machine:

```bash
npm install -g datapilot-cli-1.4.0.tgz
```

### Enterprise Bundle

For complete offline deployments, download the enterprise bundle from releases:

- `datapilot-enterprise-bundle-v1.4.0.tar.gz`

Contains:
- Pre-built npm packages
- Standalone executables for all platforms
- Comprehensive documentation
- Installation scripts

## Pre-built Packages

### Package Contents

Pre-built packages include:

```
datapilot-cli-1.4.0/
├── dist/              # Pre-compiled JavaScript
├── node_modules/      # Bundled dependencies (if using pack:offline)
├── scripts/           # Utility scripts
├── docs/              # Documentation
├── examples/          # Example files
├── package.json       # Package manifest
└── README.md          # Getting started guide
```

### Verification

After installation, verify the package integrity:

```bash
# Check version
datapilot --version

# Run simple test
datapilot overview examples/sample.csv

# Check installation location
npm list -g datapilot-cli
```

## Standalone Executables

### Windows Executable

1. Download `datapilot-windows-v1.4.0.exe`
2. Place in desired directory (e.g., `C:\Program Files\DataPilot\`)
3. Add directory to PATH or create shortcut
4. May need to allow in Windows Defender

### Linux/macOS Executable

```bash
# Download appropriate binary
wget https://github.com/Mrassimo/datapilot/releases/download/v1.4.0/datapilot-linux-v1.4.0

# Make executable
chmod +x datapilot-linux-v1.4.0

# Move to PATH
sudo mv datapilot-linux-v1.4.0 /usr/local/bin/datapilot

# Verify
datapilot --version
```

## Troubleshooting

### Installation Failures

#### Error: "Cannot find module 'typescript'"

**Cause**: Trying to build from source without dev dependencies
**Solution**: Use pre-built packages instead

#### Error: "EACCES: permission denied"

**Cause**: Insufficient permissions for global install
**Solution**: 
- Windows: Run as Administrator
- Linux/macOS: Use `sudo` or fix npm permissions

#### Error: "npm ERR! cb.apply is not a function"

**Cause**: Corrupted npm cache
**Solution**: 
```bash
npm cache clean --force
rm -rf node_modules
npm install -g datapilot-cli
```

### Runtime Issues

#### "datapilot: command not found"

**Solution 1**: Use npx
```bash
npx datapilot-cli --version
```

**Solution 2**: Fix PATH
```bash
# Find npm global bin directory
npm config get prefix

# Add to PATH (example for Linux/macOS)
export PATH=$PATH:$(npm config get prefix)/bin
```

**Solution 3**: Use full path
```bash
# Windows
%APPDATA%\npm\datapilot --version

# Linux/macOS
$(npm config get prefix)/bin/datapilot --version
```

## Proxy Configuration

### NPM Proxy Settings

```bash
# Set proxy
npm config set proxy http://proxy.company.com:8080
npm config set https-proxy http://proxy.company.com:8080

# For authenticated proxies
npm config set proxy http://username:password@proxy.company.com:8080
npm config set https-proxy http://username:password@proxy.company.com:8080

# Verify settings
npm config list
```

### Environment Variables

```bash
# Windows
set HTTP_PROXY=http://proxy.company.com:8080
set HTTPS_PROXY=http://proxy.company.com:8080

# Linux/macOS
export HTTP_PROXY=http://proxy.company.com:8080
export HTTPS_PROXY=http://proxy.company.com:8080
```

### .npmrc Configuration

Create `.npmrc` in your project or home directory:

```ini
proxy=http://proxy.company.com:8080
https-proxy=http://proxy.company.com:8080
strict-ssl=false
registry=https://registry.npmjs.org/
```

## Security Considerations

### Checksum Verification

Verify package integrity:

```bash
# Get SHA-256 checksum
shasum -a 256 datapilot-cli-1.4.0.tgz

# Compare with published checksum
```

### Signed Executables

Windows executables may trigger security warnings. To avoid:
1. Download only from official GitHub releases
2. Check digital signatures (if available)
3. Add to antivirus exceptions if necessary

## Support

### Resources

- **Documentation**: https://github.com/Mrassimo/datapilot#readme
- **Issues**: https://github.com/Mrassimo/datapilot/issues
- **Releases**: https://github.com/Mrassimo/datapilot/releases

### Common Commands

```bash
# Help
datapilot --help

# Version check
datapilot --version

# Basic analysis
datapilot all data.csv

# Output to file
datapilot all data.csv --output report.md
```

## Security Improvements (v1.4.3+)

### Critical Security Fixes

- ✅ **Removed insecure xlsx dependency** - Eliminated high severity vulnerabilities (prototype pollution, ReDoS)
- ✅ **Replaced pkg with caxa** - Fixed moderate privilege escalation vulnerability  
- ✅ **Enhanced ExcelJS-only processing** - Secure Excel file handling without security risks
- ✅ **Updated bundled dependencies** - All security vulnerabilities resolved

### Security Verification

After installation, verify security improvements:

```bash
# Check for vulnerabilities (should show 0 high/critical)
npm audit

# Verify no insecure packages
npm ls | grep -E "(xlsx|pkg)"  # Should show no results

# Verify version includes security fixes
datapilot --version  # Should show v1.4.3 or higher
```

## Version History

- **v1.4.3** - Security fixes: removed xlsx, replaced pkg with caxa, enhanced Windows support
- **v1.4.0** - Fixed Windows installation issues, added pre-built packages
- **v1.3.0** - Added offline installation support
- **v1.2.0** - Initial enterprise features

---

*Last updated: December 2024*