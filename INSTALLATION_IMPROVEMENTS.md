# DataPilot Installation Improvements

## Solution: Portable Node.js Bundle

A ZIP file containing everything needed to run DataPilot without installation:

```
datapilot-portable-windows/
├── node-runtime/           # Official Node.js binaries
│   ├── node.exe           # Signed by Node.js Foundation
│   └── ...
├── app/                   # DataPilot with vendored dependencies
│   ├── src/
│   ├── bin/
│   ├── node_modules/      # Pre-installed, no npm needed!
│   └── package.json
├── datapilot.bat          # Simple launcher
├── datapilot.ps1          # PowerShell alternative
└── README.txt
```

## How It Works

1. **Download** the ZIP file
2. **Extract** to any folder (no admin rights needed)
3. **Run** datapilot.bat or datapilot.ps1

```batch
datapilot.bat ui
datapilot.bat eda mydata.csv
```

## Why This Works in Corporate Environments

- **No .exe files** - Uses Node.js's signed binaries
- **No installation** - Just extract and run
- **No npm install** - Dependencies are vendored (pre-installed)
- **No network access** - Everything runs locally
- **No admin rights** - Runs in user space

## Building the Bundle

```bash
# Create portable bundles for all platforms
npm run build:portable

# This creates:
# - datapilot-portable-windows/
# - datapilot-portable-macos/
# - datapilot-portable-linux/
```

## Repository Cleanup

### Test Data
- Move large CSV files to `tests/test-data-large/` (gitignored)
- Keep only small sample files in git
- Run `node scripts/reorganize-test-data.js` to clean up

### Result
- Repository size reduced from 121MB to ~20MB
- Faster cloning and downloads
- Test data can be generated on demand
- Properly gitignore generated files
- Archive historical test data

## Next Steps

### Week 1: Build System
1. Add `pkg` to create executables
2. Set up GitHub Actions for automated builds
3. Create release packages for each platform

### Week 2: Installation
1. Create PowerShell installer for Windows
2. Create bash installer for Unix systems  
3. Test in restricted corporate environments

### Week 3: Cleanup
1. Audit and reduce test fixtures
2. Update .gitignore
3. Remove unnecessary files from repository

## Quick Start for Testing

```bash
# Install pkg
npm install --save-dev pkg

# Build executable
npm run build  # Creates rollup bundle
pkg dist/datapilot.js --target node18-win-x64 --output datapilot.exe

# Test it
./datapilot.exe ui
```

This creates a completely self-contained executable that works without any dependencies!