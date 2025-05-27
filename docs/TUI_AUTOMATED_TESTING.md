# DataPilot TUI Automated Testing Solution

## Overview

This document describes the automated testing framework created for the DataPilot Text User Interface (TUI), with specific focus on Windows compatibility and cross-platform testing.

## Problem Statement

Recent Git issues indicated problems with the TUI on Windows:
- Encoding crashes
- UI stability issues
- Copy functionality problems (BUG_008)
- Need for automated testing to catch regressions

## Solution Architecture

### 1. Core Test Suite (`tests/automated_tui_test.js`)
A comprehensive automated test suite that:
- Spawns TUI processes programmatically
- Simulates user input via stdin
- Monitors stdout/stderr for expected patterns
- Tests critical user workflows
- Provides detailed test reports

**Key Features:**
- Platform-aware testing (Windows-specific tests)
- Timeout handling for hung processes
- Colored console output for readability
- JSON report generation

### 2. Windows-Specific Testing

#### Batch Script (`tests/tui_test_windows.bat`)
- Simple entry point for Windows users
- Ensures proper environment setup
- Handles dependency checking

#### PowerShell Suite (`tests/Test-DataPilotTUI.ps1`)
Advanced Windows testing including:
- Clipboard integration tests
- Terminal encoding verification
- Process isolation tests
- Path normalization checks

### 3. Cross-Platform Orchestrator (`tests/run_tui_tests.js`)
- Automatically detects OS and runs appropriate tests
- Consolidates results from multiple test runners
- Generates unified reports in JSON and Markdown

### 4. CI/CD Integration (`.github/workflows/tui-tests.yml`)
GitHub Actions workflow that:
- Tests on Linux, Windows, and macOS
- Runs on every push and PR
- Generates artifacts for each platform
- Comments test results on PRs

## Test Coverage

### Functional Areas Tested

1. **TUI Startup & Exit**
   - Welcome message display
   - Graceful exit handling
   - Ctrl+C interruption

2. **File Selection**
   - Interactive file browsing
   - Manual path entry
   - Invalid file handling
   - Recent files navigation

3. **Analysis Workflow**
   - Demo mode execution
   - Progress tracking
   - Results display

4. **Platform-Specific**
   - Windows path handling (C:\, UNC paths)
   - Terminal encoding (UTF-8, ASCII)
   - Process cleanup

5. **Performance & Stability**
   - Rapid input handling
   - Operation interruption recovery
   - Memory leak prevention

### Current Test Results

As of the latest run:
- ✅ 3 tests passing
- ❌ 5 tests failing (mostly timeout issues)
- ⚠️ 1 test suite skipped (Windows-specific)

## Running the Tests

### Quick Start
```bash
# Run all TUI tests
npm run test:tui

# Run only automated tests
npm run test:tui:auto

# Run Windows-specific tests (on Windows)
npm run test:tui:windows
npm run test:tui:powershell
```

### Manual Invocation
```bash
# Direct test execution
node tests/automated_tui_test.js

# With custom timeout
node tests/run_tui_tests.js --timeout 60000
```

## Known Limitations

1. **Interactive Elements**: Some TUI features like scrolling and complex navigation are difficult to test automatically.

2. **Clipboard Testing**: The copy functionality (BUG_008) requires OS-level clipboard access which is restricted in automated environments.

3. **Terminal Variations**: Different terminal emulators may render output differently, causing pattern matching issues.

4. **Timing Sensitivity**: Tests rely on timeouts which may need adjustment based on system performance.

## Troubleshooting

### Common Issues

1. **"Timeout waiting for pattern"**
   - Increase timeout values in test configuration
   - Check if TUI output format has changed
   - Ensure no other DataPilot instances are running

2. **"Process did not exit"**
   - Check for zombie processes
   - Ensure proper cleanup in test teardown
   - May indicate a hung TUI state

3. **Windows-specific failures**
   - Run PowerShell as Administrator
   - Check execution policy settings
   - Ensure Windows Terminal is used (not cmd.exe)

### Debugging Tips

1. **Enable verbose output**:
   ```javascript
   // In automated_tui_test.js
   const DEBUG = true; // Add at top
   
   // In waitForOutput function
   if (DEBUG) console.log('Output:', data.toString());
   ```

2. **Capture full TUI output**:
   ```bash
   node bin/datapilot.js ui 2>&1 | tee tui_output.log
   ```

3. **Test individual suites**:
   Modify `testSuites` array to run only specific test suites.

## Future Improvements

1. **Visual Regression Testing**: Capture and compare terminal screenshots
2. **Accessibility Testing**: Verify screen reader compatibility
3. **Performance Benchmarking**: Track TUI response times
4. **Integration Tests**: Test TUI with real CSV analysis workflows
5. **Mocking Framework**: Mock file system for consistent test data

## Contributing

When modifying the TUI:
1. Run the full test suite locally
2. Add tests for new features
3. Update patterns if prompts change
4. Document any new test requirements
5. Ensure CI passes on all platforms

## Summary

This automated testing framework provides:
- ✅ Continuous validation of TUI functionality
- ✅ Early detection of platform-specific issues
- ✅ Regression prevention for Windows compatibility
- ✅ Foundation for comprehensive UI testing

While some tests are still being refined, the framework successfully catches critical issues and provides a solid foundation for maintaining TUI quality across all platforms.