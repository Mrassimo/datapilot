# DataPilot Installation Guide

This guide provides comprehensive installation instructions for all platforms and use cases.

## Quick Installation (Recommended)

For most users, the NPM global installation is the fastest way to get started:

```bash
# Install globally
npm install -g datapilot-cli

# Verify installation
datapilot --version
```

⚠️ **Important**: Install `datapilot-cli`, NOT `datapilot` (which is deprecated)

## Installation Methods

### Method 1: NPM Global Installation

**Advantages:**
- Pre-built packages (no compilation required)
- Automatic PATH configuration
- Easy updates with `npm update -g datapilot-cli`
- Works on all platforms

**Installation:**
```bash
npm install -g datapilot-cli
```

**Verification:**
```bash
datapilot --version
datapilot --help
```

### Method 2: NPX (No Installation)

**Advantages:**
- No installation required
- Always uses latest version
- No PATH configuration needed
- Perfect for CI/CD pipelines

**Usage:**
```bash
# Run commands directly
npx datapilot-cli all data.csv
npx datapilot-cli --version
npx datapilot-cli --help
```

### Method 3: From Source

**Advantages:**
- Latest development version
- Full control over build process
- Contribute to development

**Requirements:**
- Node.js 16+ 
- npm 7+
- TypeScript compiler

**Installation:**
```bash
git clone https://github.com/Mrassimo/datapilot.git
cd datapilot
npm install
npm run build
npm link
```

**Verification:**
```bash
npm test
npm run lint
datapilot --version
```

## Platform-Specific Instructions

### Windows Installation

Windows users may encounter PATH issues. Here are the solutions:

#### Option A: Use npx (Recommended)
No setup required - works immediately:
```bash
npx datapilot-cli all data.csv
```

#### Option B: Fix PATH Issues
If `datapilot` command is not recognized after global installation:

**Step 1: Find your npm global directory**
```bash
npm config get prefix
```

**Step 2: Add to Windows PATH**
1. Copy the path returned from Step 1 (e.g., `C:\Users\YourName\AppData\Roaming\npm`)
2. Press `Windows + R`, type `sysdm.cpl`, press Enter
3. Click "Advanced" tab → "Environment Variables"
4. Find "PATH" in System Variables, click "Edit"
5. Click "New" and add your npm global path
6. Click "OK" to close all dialogs
7. Restart PowerShell/Command Prompt

**Step 3: Verify installation**
```bash
datapilot --version
```

#### Option C: Use Full Path
```bash
# Replace [npm-prefix] with path from 'npm config get prefix'
[npm-prefix]\datapilot --version
```

#### Windows-Specific Notes
- **PowerShell vs Command Prompt**: Both work equally well
- **Admin privileges**: Not required for user-level installation
- **Antivirus software**: May flag npm packages; add exceptions if needed
- **Corporate networks**: May require proxy configuration (see Network Configuration)

### macOS Installation

Standard npm installation usually works without issues:

```bash
npm install -g datapilot-cli
```

**If you get permission errors:**
```bash
# Option 1: Use npm prefix to install in user directory
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
npm install -g datapilot-cli

# Option 2: Use sudo (not recommended)
sudo npm install -g datapilot-cli
```

### Linux Installation

**Standard installation:**
```bash
npm install -g datapilot-cli
```

**Ubuntu/Debian specific:**
```bash
# If Node.js not installed
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install DataPilot
npm install -g datapilot-cli
```

**RedHat/CentOS/Fedora specific:**
```bash
# If Node.js not installed
curl -fsSL https://rpm.nodesource.com/setup_lts.x | sudo bash -
sudo dnf install nodejs npm

# Install DataPilot  
npm install -g datapilot-cli
```

**Alpine Linux:**
```bash
apk add nodejs npm
npm install -g datapilot-cli
```

## Network Configuration

### Proxy Support

For corporate environments with proxy servers:

```bash
# Set npm proxy
npm config set proxy http://proxy.company.com:8080
npm config set https-proxy http://proxy.company.com:8080

# Install with proxy
npm install -g datapilot-cli
```

### Firewall Configuration

DataPilot requires internet access for:
- Initial npm installation
- Package updates
- No runtime internet access required (purely local processing)

**Required domains:**
- `registry.npmjs.org` (npm package registry)
- `nodejs.org` (Node.js downloads if needed)

## Offline Installation

For environments without internet access, see [Enterprise Installation Guide](ENTERPRISE_INSTALLATION.md) for:
- Offline package bundles
- Standalone executables
- Corporate deployment strategies

## Docker Installation

```dockerfile
FROM node:18-alpine
RUN npm install -g datapilot-cli
WORKDIR /data
ENTRYPOINT ["datapilot"]
```

**Usage:**
```bash
# Build image
docker build -t datapilot .

# Run analysis
docker run -v $(pwd):/data datapilot all data.csv
```

## Verification and Testing

### Basic Verification
```bash
# Check version
datapilot --version

# Test with sample data
echo "name,age,city" > test.csv
echo "John,25,NYC" >> test.csv
echo "Jane,30,LA" >> test.csv
datapilot all test.csv
```

### Full Installation Test
```bash
# Test all major formats
datapilot all test.csv          # CSV
datapilot all test.json         # JSON (create test file)
datapilot all test.xlsx         # Excel (create test file)

# Test multi-file analysis
datapilot engineering test1.csv test2.csv
```

## Troubleshooting Installation

### Common Issues

**"datapilot: command not found"**
- Solution: Use `npx datapilot-cli` or fix PATH configuration
- Check: `npm config get prefix` and verify PATH includes this directory

**"Permission denied" errors**
- Solution: Don't use sudo with npm. Configure user-level npm directory
- Alternative: Use npx which doesn't require global installation

**"Package not found" errors**
- Solution: Ensure you're installing `datapilot-cli` not `datapilot`
- Check: `npm search datapilot-cli` to verify package availability

**Slow installation**
- Cause: Network issues or npm registry problems
- Solution: Try `npm install -g datapilot-cli --registry https://registry.npmjs.org/`

**TypeScript compilation errors (from source)**
- Solution: Ensure Node.js 16+ and latest npm version
- Check: `node --version` and `npm --version`

### Advanced Troubleshooting

**Enable verbose installation logging:**
```bash
npm install -g datapilot-cli --loglevel verbose
```

**Clear npm cache:**
```bash
npm cache clean --force
npm install -g datapilot-cli
```

**Check npm configuration:**
```bash
npm config list
npm config get registry
npm config get prefix
```

## Updates and Maintenance

### Checking for Updates
```bash
# Check current version
datapilot --version

# Check for updates
npm outdated -g datapilot-cli
```

### Updating
```bash
# Update to latest version
npm update -g datapilot-cli

# Or reinstall
npm uninstall -g datapilot-cli
npm install -g datapilot-cli
```

### Uninstalling
```bash
# Remove global installation
npm uninstall -g datapilot-cli

# Verify removal
datapilot --version  # Should show "command not found"
```

## Version Compatibility

### Node.js Requirements
- **Minimum**: Node.js 16.0.0
- **Recommended**: Node.js 18.0.0 or later (LTS)
- **Maximum tested**: Node.js 20.x

### npm Requirements
- **Minimum**: npm 7.0.0
- **Recommended**: npm 8.0.0 or later

### Operating System Support
- **Windows**: Windows 10/11, Windows Server 2019/2022
- **macOS**: macOS 10.15 (Catalina) or later
- **Linux**: Ubuntu 18.04+, CentOS 7+, Alpine 3.12+, Amazon Linux 2

## Next Steps

After successful installation:
1. Read the [Configuration Guide](CONFIGURATION.md) for performance tuning
2. Check [Troubleshooting Guide](TROUBLESHOOTING.md) for common usage issues
3. Explore the [examples](../examples/) directory for sample usage
4. Run your first analysis: `datapilot all your-data.csv`

## Support

If you encounter installation issues:
1. Check this guide first
2. Search [existing GitHub issues](https://github.com/Mrassimo/datapilot/issues)
3. Create a new issue with:
   - Operating system and version
   - Node.js and npm versions
   - Complete error output
   - Installation method attempted