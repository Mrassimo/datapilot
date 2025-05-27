# DataPilot TUI Testing Framework

## Overview

This testing framework provides automated testing for the DataPilot Text User Interface (TUI), with special attention to Windows compatibility issues.

## Test Components

### 1. Automated TUI Tests (`automated_tui_test.js`)
- Core automated test suite that spawns TUI processes
- Tests startup, navigation, file selection, and analysis workflows
- Platform-agnostic with Windows-specific test cases
- Generates JSON test reports

### 2. Windows Batch Runner (`tui_test_windows.bat`)
- Simple batch script for Windows users
- Ensures proper environment setup
- Runs automated tests with Windows-specific configurations

### 3. PowerShell Advanced Tests (`Test-DataPilotTUI.ps1`)
- Advanced Windows testing with PowerShell
- Tests clipboard integration, encoding, and process isolation
- Provides detailed diagnostics for Windows-specific issues

### 4. Test Orchestrator (`run_tui_tests.js`)
- Cross-platform test runner
- Automatically selects appropriate tests based on OS
- Generates consolidated reports in JSON and Markdown

### 5. CI/CD Integration (`.github/workflows/tui-tests.yml`)
- GitHub Actions workflow for continuous testing
- Tests on Linux, Windows, and macOS
- Automatic PR comments with test results

## Running Tests

### Quick Start
```bash
# Run all TUI tests
npm run test:tui

# Run only automated tests
npm run test:tui:auto

# Run all tests (unit + TUI)
npm run test:all
```

### Platform-Specific
```bash
# Windows Batch
npm run test:tui:windows

# Windows PowerShell (admin may be required)
npm run test:tui:powershell

# Unix/Linux/macOS
npm run test:tui:auto
```

## Test Coverage

### Functional Tests
- ✅ TUI startup and initialization
- ✅ Menu navigation
- ✅ File selection methods (browse, recent, manual)
- ✅ Analysis type selection
- ✅ Demo mode execution
- ✅ Error handling for invalid inputs
- ✅ Graceful exit handling

### Platform-Specific Tests
- ✅ Windows path normalization
- ✅ Terminal encoding compatibility
- ✅ Process isolation and cleanup
- ✅ Interrupt handling (Ctrl+C)
- ⚠️  Clipboard functionality (manual testing required)

### Known Limitations
1. **Clipboard Testing**: The copy functionality (BUG_008) requires manual selection. Automated clipboard testing is limited by security restrictions.

2. **Interactive Elements**: Some TUI elements like scrolling and complex navigation patterns are difficult to test automatically.

3. **Terminal Variations**: Different terminal emulators may render output differently.

## Test Reports

After running tests, check these locations:
- `tests/tui_test_report.json` - Automated test results
- `tests/TUI_TEST_RESULTS.md` - Human-readable test report
- `tests/tui_test_consolidated_report.json` - All test suites combined
- `tests/tui_test_report_windows.json` - Windows-specific PowerShell results

## Troubleshooting

### Windows Issues

1. **"Node.js not found"**
   - Ensure Node.js is installed and in PATH
   - Restart terminal after installation

2. **"PowerShell execution policy"**
   - Run: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`
   - Or use: `npm run test:tui:powershell` which bypasses restrictions

3. **"Access denied" errors**
   - Run terminal as Administrator
   - Check antivirus software isn't blocking Node.js

4. **Encoding issues**
   - Use Windows Terminal or PowerShell 7+
   - Avoid legacy Command Prompt for best results

### General Issues

1. **Tests timeout**
   - Check if another DataPilot instance is running
   - Increase timeout in test configuration
   - Ensure CSV fixture files exist

2. **"Cannot find module"**
   - Run `npm install` to ensure dependencies are installed
   - Check `node_modules` directory exists

3. **Inconsistent results**
   - Clear any cached data
   - Ensure clean test environment
   - Check for background processes

## Contributing

When adding new TUI features:
1. Add corresponding tests to `automated_tui_test.js`
2. Update platform-specific tests if needed
3. Run full test suite on your platform
4. Document any new test requirements here

## Manual Testing Checklist

Some features still require manual verification:
- [ ] Clipboard copy functionality works correctly
- [ ] Terminal colors display properly
- [ ] Unicode characters render correctly
- [ ] Large file handling doesn't freeze TUI
- [ ] Multi-file selection works smoothly
- [ ] Workspace mode discovers files correctly
- [ ] Relationship detection displays properly
- [ ] Progress indicators animate smoothly