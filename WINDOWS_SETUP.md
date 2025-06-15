# Windows Setup Guide for DataPilot

This guide helps Windows users resolve the common `'datapilot' is not recognized` error after installing DataPilot globally with npm.

## Problem Description

When you install DataPilot globally on Windows using:
```bash
npm install -g datapilot-cli
```

You might encounter this error when trying to run `datapilot --version`:
```
'datapilot' is not recognized as the name of a cmdlet, function, script file, or operable program.
```

This happens because Windows doesn't automatically have the npm global bin directory in the PATH environment variable.

## Solutions (Ranked by Ease)

### 🟢 Solution 1: Use npx (Recommended - No Setup Required)

This is the easiest solution that works immediately without any configuration:

```bash
# Check version
npx datapilot-cli --version

# Run analysis
npx datapilot-cli all data.csv
npx datapilot-cli overview data.xlsx
```

**Pros:** Works immediately, no PATH configuration needed, always uses latest version
**Cons:** Slightly slower first run (downloads if needed)

### 🟡 Solution 2: Add npm to PATH (One-time Setup)

This solution requires one-time setup but then `datapilot` command works normally:

#### Step 1: Find your npm global directory
```bash
npm config get prefix
```
This will return something like: `C:\Users\YourName\AppData\Roaming\npm`

#### Step 2: Add to Windows PATH
1. Press `Windows Key + R` to open Run dialog
2. Type `sysdm.cpl` and press Enter
3. Click the "Advanced" tab
4. Click "Environment Variables" button
5. In the "User variables" section, find and select "Path"
6. Click "Edit"
7. Click "New" and add the path from Step 1
8. Click "OK" on all dialog boxes

#### Step 3: Restart your terminal
Close PowerShell/Command Prompt and open a new window.

#### Step 4: Test
```bash
datapilot --version
```

### 🟠 Solution 3: Use Full Path

If you prefer not to modify PATH, you can use the full path:

```bash
# First, find your npm prefix
npm config get prefix

# Then use the full path (replace [npm-prefix] with actual path)
[npm-prefix]\datapilot --version

# Example:
C:\Users\YourName\AppData\Roaming\npm\datapilot --version
```

## Verification Steps

After setting up using any solution above, verify it works:

```bash
# Check version
datapilot --version  # or npx datapilot-cli --version

# Test with sample data
datapilot overview examples/sales.csv  # or npx datapilot-cli overview examples/sales.csv
```

## Testing Your Installation

DataPilot includes a built-in installation test:

```bash
npm run test:installation
```

This script will:
- Check your system configuration
- Test all available CLI methods (direct, global, npx)
- Create a test CSV file and run analysis
- Provide specific guidance for your setup
- Show Windows-specific PATH information if needed

## Troubleshooting

### "npm is not recognized"
If you get this error, Node.js/npm is not properly installed:
1. Download and install Node.js from https://nodejs.org
2. Restart your terminal
3. Verify with: `npm --version`

### PATH doesn't seem to update
- Make sure you restarted your terminal after adding to PATH
- Try logging out and back in to Windows
- Check if the path was added correctly: `echo $env:PATH` in PowerShell

### Permission errors during npm install
Try running PowerShell as Administrator, or use:
```bash
npm install -g datapilot-cli --force
```

### Corporate firewall/proxy issues
DataPilot automatically respects HTTP_PROXY and HTTPS_PROXY environment variables. If you're behind a corporate firewall:

```bash
# Set proxy (replace with your proxy details)
set HTTP_PROXY=http://proxy.company.com:8080
set HTTPS_PROXY=http://proxy.company.com:8080

# Then install
npm install -g datapilot-cli
```

## Why This Happens

This is a common issue with npm global packages on Windows because:

1. **npm global directory** is often in a user-specific location (like `AppData`)
2. **Windows PATH** doesn't include this directory by default
3. **npm's automatic wrapper creation** doesn't always work perfectly on Windows
4. **Corporate environments** often have restricted PATH modification

The solutions above address these issues in order of complexity, with npx being the most reliable as it bypasses PATH entirely.

## Need Help?

If you're still having issues:

1. Run the installation test: `npm run test:installation`
2. Check our [GitHub Issues](https://github.com/Mrassimo/datapilot/issues)
3. Create a new issue with your:
   - Windows version
   - Node.js/npm versions
   - Output of `npm config get prefix`
   - Exact error messages