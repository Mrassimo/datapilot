# Windows Installation Guide

This guide provides comprehensive instructions for installing DataPilot CLI on Windows systems, including troubleshooting common issues.

## 🚀 Quick Installation

### Prerequisites
- **Node.js 18+** - Download from [nodejs.org](https://nodejs.org/)
- **Windows 10/11** or **Windows Server 2019+**
- **Administrator privileges** (for global installation)

### Method 1: NPM Global Install (Recommended)
```cmd
npm install -g datapilot-cli
```

### Method 2: Offline Package Install
```cmd
# Download the offline package from releases
npm install -g datapilot-cli-1.4.0.tgz
```

## 🛠️ Troubleshooting Common Windows Issues

### Issue: npm install hangs or gets stuck

**Symptoms:**
- npm install command freezes at "⠸" loading indicator
- Process appears to hang indefinitely
- Deprecated package warnings appear but installation doesn't proceed

**Solutions:**

#### Solution 1: Clear NPM Cache
```cmd
# Clear npm cache completely
npm cache clean --force

# Verify cache is cleared
npm cache verify
```

#### Solution 2: Use Windows-Optimized Settings
```cmd
# Install with optimised flags
npm install -g datapilot-cli --no-audit --prefer-offline
```

#### Solution 3: Alternative Package Managers
```cmd
# Using Yarn (install yarn first: npm install -g yarn)
yarn global add datapilot-cli

# Using pnpm (install pnpm first: npm install -g pnpm)
pnpm add -g datapilot-cli
```

### Issue: Permission Errors

**Symptoms:**
- "EACCES: permission denied" errors
- "EPERM: operation not permitted" errors

**Solutions:**

#### Solution 1: Run as Administrator
1. Right-click Command Prompt → "Run as administrator"
2. Run the installation command

#### Solution 2: Use --unsafe-perm Flag
```cmd
npm install -g datapilot-cli --unsafe-perm
```

#### Solution 3: Change NPM Global Directory
```cmd
# Create a new global directory
mkdir "%USERPROFILE%\\npm-global"

# Configure npm to use it
npm config set prefix "%USERPROFILE%\\npm-global"

# Add to PATH in Environment Variables
# Add: %USERPROFILE%\\npm-global to your PATH
```

### Issue: Deprecated Dependency Warnings

**Symptoms:**
- Warnings about `inflight@1.0.6` or `glob@7.2.3`
- Installation proceeds but shows deprecation warnings

**Solutions:**
- These warnings are from transitive dependencies and don't affect functionality
- The latest version includes updated dependencies to minimise these warnings
- Use `--no-audit` flag to suppress warnings during installation:
```cmd
npm install -g datapilot-cli --no-audit
```

### Issue: Network/Proxy Problems

**Symptoms:**
- Timeouts during package download
- "ETIMEDOUT" or "ENOTFOUND" errors
- Corporate firewall blocking downloads

**Solutions:**

#### Solution 1: Configure Proxy
```cmd
# Set proxy settings (replace with your proxy details)
npm config set proxy http://proxy.company.com:8080
npm config set https-proxy http://proxy.company.com:8080

# For authentication
npm config set proxy http://username:password@proxy.company.com:8080
```

#### Solution 2: Use Offline Installation
1. Download the offline package from [GitHub Releases]
2. Transfer to your Windows machine
3. Install locally:
```cmd
npm install -g path\\to\\datapilot-cli-1.4.0.tgz
```

#### Solution 3: Corporate Network Settings
```cmd
# Disable strict SSL (only if necessary)
npm config set strict-ssl false

# Set registry to HTTP (only if HTTPS is blocked)
npm config set registry http://registry.npmjs.org/
```

## 📁 Installation Verification

After installation, verify DataPilot is working correctly:

```cmd
# Check version
datapilot --version

# Test with sample file
datapilot --help

# Run on a CSV file
datapilot path\\to\\your\\file.csv
```

## 🔧 Advanced Configuration

### Custom NPM Configuration
Create or edit `%USERPROFILE%\\.npmrc` with Windows-optimised settings:

```ini
# Windows-optimised npm configuration
registry=https://registry.npmjs.org/
fetch-timeout=300000
fetch-retry-mintimeout=20000
fetch-retry-maxtimeout=120000
fetch-retries=3
prefer-offline=true
audit=false
progress=true
loglevel=warn
maxsockets=15
```

### Windows Defender Exclusions
If Windows Defender is scanning npm operations:

1. Open Windows Security
2. Go to Virus & threat protection
3. Manage settings under "Virus & threat protection settings"
4. Add exclusions for:
   - `%USERPROFILE%\\AppData\\Roaming\\npm`
   - `%USERPROFILE%\\AppData\\Roaming\\npm-cache`
   - Your Node.js installation directory

## 🌐 Alternative Installation Methods

### Method 1: Chocolatey (Community Package)
```cmd
# Install Chocolatey first, then:
choco install nodejs
npm install -g datapilot-cli
```

### Method 2: Scoop (Community Package)
```cmd
# Install Scoop first, then:
scoop install nodejs
npm install -g datapilot-cli
```

### Method 3: Binary Distribution
1. Download Windows binary from [GitHub Releases]
2. Extract to desired location
3. Add to PATH environment variable
4. Run `datapilot.exe` from any directory

## 🐛 Getting Help

If you continue to experience issues:

1. **Check System Requirements:**
   - Node.js 18+ installed and in PATH
   - Administrator privileges available
   - Sufficient disk space (500MB+ free)

2. **Collect Debug Information:**
   ```cmd
   node --version
   npm --version
   npm config list
   npm doctor
   ```

3. **Report the Issue:**
   - Visit [GitHub Issues](https://github.com/Mrassimo/datapilot/issues)
   - Include your Windows version, Node.js version, and error output
   - Tag the issue with "windows" label

## 📈 Performance Tips

### For Large Datasets:
- Ensure adequate RAM (8GB+ recommended for files >1GB)
- Use SSD storage for better I/O performance
- Close other applications during analysis

### For Corporate Environments:
- Use offline installation to avoid network issues
- Configure npm proxy settings if behind firewall
- Consider using binary distribution for deployment

## 🔒 Security Considerations

- Only install from official npm registry or GitHub releases
- Verify package integrity: `npm audit`
- Keep Node.js updated to latest LTS version
- Use Windows Defender or corporate antivirus exemptions as needed

---

**Need more help?** Visit our [documentation](../README.md) or open an [issue on GitHub](https://github.com/Mrassimo/datapilot/issues).