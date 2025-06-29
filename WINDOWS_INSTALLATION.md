# Windows Installation Guide

This guide provides comprehensive instructions for installing and configuring DataPilot CLI on Windows systems.

## Quick Installation

### Option 1: Direct Usage (No Configuration Needed)
```bash
# Install and use immediately with npx
npx datapilot-cli --version
npx datapilot-cli all your-data.csv
```

### Option 2: Global Installation
```bash
# Install globally
npm install -g datapilot-cli

# If PATH is configured correctly, you can use:
datapilot --version
datapilot all your-data.csv
```

## Windows PATH Configuration

### Automatic Detection and Guidance

DataPilot CLI includes automatic Windows setup detection that will:
- Check if the CLI is properly configured in your PATH
- Provide specific instructions for your system
- Offer multiple resolution methods

### Manual PATH Configuration

#### Method 1: PowerShell (Recommended for Windows 10/11)

1. Open PowerShell as Administrator
2. Get your npm global path:
   ```powershell
   npm config get prefix
   ```
3. Add to PATH permanently (user level):
   ```powershell
   [Environment]::SetEnvironmentVariable("Path", $env:Path + ";C:\Users\YourUsername\AppData\Roaming\npm", [EnvironmentVariableTarget]::User)
   ```
4. Restart your terminal and test:
   ```powershell
   datapilot --version
   ```

#### Method 2: Command Prompt

1. Open Command Prompt as Administrator
2. Add to PATH:
   ```cmd
   setx PATH "%PATH%;C:\Users\YourUsername\AppData\Roaming\npm"
   ```
   **Note:** This method may truncate your PATH if it's longer than 1024 characters.

#### Method 3: GUI Configuration (Safest)

1. Right-click "This PC" or "My Computer" and select "Properties"
2. Click "Advanced system settings"
3. Click "Environment Variables"
4. Under "User variables", select "Path" and click "Edit"
5. Click "New" and add your npm global path (usually `C:\Users\YourUsername\AppData\Roaming\npm`)
6. Click "OK" on all dialogs
7. Restart your terminal

## Troubleshooting

### Common Issues

#### "datapilot is not recognized as an internal or external command"
- **Cause:** npm global directory is not in PATH
- **Solution:** Use `npx datapilot-cli` or configure PATH as shown above

#### "Access is denied" or Permission Errors
- **Cause:** Insufficient permissions
- **Solution:** Run PowerShell/Command Prompt as Administrator

#### PATH is too long (>1024 characters)
- **Cause:** Windows limitation with older setx command
- **Solution:** Use GUI method or PowerShell method instead

#### Corporate/Restricted Environments
- **Cause:** Group policies may prevent PATH modification
- **Solution:** Contact IT support or use `npx` method

### Getting Help

#### Windows-Specific Help Command
```bash
datapilot --help-windows
```
This command provides:
- System-specific PATH detection
- Customized instructions for your setup
- Alternative usage methods

#### Installation Health Check
DataPilot automatically checks your installation when you run:
```bash
datapilot --version
datapilot --help
```

### Advanced Configuration

#### Using npm Scripts (Project-Level)
Add to your `package.json`:
```json
{
  "scripts": {
    "analyze": "datapilot all data.csv"
  }
}
```
Then run: `npm run analyze`

#### Direct Execution
Find your npm global directory and run directly:
```bash
# Example path - yours may be different
"C:\Users\YourUsername\AppData\Roaming\npm\datapilot" --version
```

## Environment-Specific Notes

### Windows 11/10
- Modern PowerShell is recommended
- User-level PATH modification is usually sufficient
- Windows Defender may require initial permission

### Windows 8.1/7
- Use Command Prompt or GUI method
- May require Administrator privileges for PATH modification
- Consider using `npx` method for simpler setup

### Corporate Networks
- Proxy configuration is handled automatically
- May require IT assistance for PATH modification
- `npx` method often works without special permissions

## Verification

After installation, verify everything works:

```bash
# Check version
datapilot --version

# Test basic functionality
datapilot --help

# Quick analysis test (if you have a CSV file)
datapilot overview sample.csv
```

## Support

If you continue having issues:

1. Check the [GitHub Issues](https://github.com/Mrassimo/datapilot/issues)
2. Run `datapilot --help-windows` for system-specific guidance
3. Create a new issue with:
   - Windows version
   - Installation method used
   - Error messages
   - Output of `npm config get prefix`

## Migration from Previous Versions

If you're upgrading from an earlier version:

1. Uninstall the old version:
   ```bash
   npm uninstall -g datapilot-cli
   ```
2. Clear npm cache:
   ```bash
   npm cache clean --force
   ```
3. Install the new version:
   ```bash
   npm install -g datapilot-cli
   ```
4. Verify PATH is still configured correctly

The new version includes enhanced Windows support and automatic configuration detection.