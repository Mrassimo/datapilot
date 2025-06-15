# E2E Tests for DataPilot CLI

This directory contains end-to-end tests that validate the complete CLI workflows from command execution to output generation.

## Test Structure

### `full-analysis.test.ts`
Tests complete analysis workflows:
- Full analysis command (`datapilot all`)
- CLI version and help commands
- File output generation and validation

### `output-formats.test.ts`
Tests output format support:
- JSON output validation
- YAML output validation  
- Markdown output validation
- Command options handling

### `error-scenarios.test.ts`
Tests error handling:
- Non-existent file handling
- Invalid CSV files
- Empty files
- Invalid command arguments
- Missing file arguments

## Key Features

- **Real CLI Execution**: Tests spawn actual CLI processes using Node.js
- **File System Validation**: Verifies output files are created correctly
- **Format Validation**: Ensures JSON/YAML outputs are properly formatted
- **Working Directory Management**: Tests handle temporary directories for isolation
- **Quiet Mode**: Uses `--quiet` flag to prevent progress output interference
- **Cleanup**: Automatically cleans up generated files after tests

## Running E2E Tests

```bash
# Run E2E tests only
npm run test:e2e

# Run all tests including E2E
npm run test:all

# If E2E directory is empty, tests pass gracefully
npm run test:e2e  # Will exit with code 0 even with no tests
```

## Configuration

E2E tests are configured with:
- 10-15 second timeouts for CLI operations
- Automatic file cleanup after each test
- Temporary directory isolation
- Support for both working directory and current directory output files

The Jest configuration includes the `--passWithNoTests` flag, so the CI pipeline won't fail if E2E tests are temporarily removed or missing.