# DataPilot Test Documentation

## Overview

DataPilot uses a comprehensive test suite to ensure reliability and quality across all features. The test infrastructure has been modernized to support the new 3-command structure while maintaining backward compatibility.

## Test Structure

```
tests/
├── README.md                    # This file
├── test_all.js                  # Main test runner (runs all suites)
├── run_modern_tests.js          # Modern CLI integration tests
├── run_tests.js                 # Legacy tests (backward compatibility)
├── benchmarks/                  # Performance benchmarks
│   ├── benchmark.js
│   ├── performance_benchmark.js
│   └── data/
├── fixtures/                    # Test data files
│   ├── australian_data.csv     # Australian-specific formats
│   ├── edge_case_*.csv        # Edge case scenarios
│   ├── large_test.csv         # Performance testing
│   └── ...
└── unit/                       # Unit tests
    ├── test_columnDetector.js  # Column detection tests
    ├── test_errorHandling.js   # Error boundary tests
    ├── test_parser.js          # CSV parser tests
    ├── test_stats.js           # Statistics tests
    └── test_format.js          # Formatting tests
```

## Running Tests

### Quick Start
```bash
# Run all tests
npm test

# Run specific test suites
npm run test:modern      # Modern CLI tests only
npm run test:unit        # Unit tests only
npm run test:legacy      # Legacy compatibility tests
```

### Test Scripts
- `npm test` - Runs comprehensive test suite (all tests)
- `npm run test:modern` - Tests new 3-command structure (`run`, `vis`, `all`)
- `npm run test:unit` - Runs all unit tests
- `npm run test:integration` - Integration tests for CLI commands
- `npm run test:legacy` - Tests backward compatibility with old commands

## Test Categories

### 1. Unit Tests

#### Column Detector Tests (`test_columnDetector.js`)
- **Regex Patterns**: Tests all patterns (Australian, international, business)
- **Type Detection**: Validates column type detection accuracy
- **Parse Functions**: Tests number and date parsing
- **Edge Cases**: Handles nulls, empty data, special characters

#### Error Handling Tests (`test_errorHandling.js`)
- **Error Boundaries**: Tests graceful error recovery
- **Partial Results**: Validates salvaging of partial analysis
- **Recovery Recommendations**: Tests context-aware error messages
- **Engine Integration**: Ensures consistent error handling

#### Parser Tests (`test_parser.js`)
- **CSV Parsing**: Basic and complex CSV formats
- **Encoding Detection**: Multiple encoding support
- **Delimiter Detection**: Auto-detection of delimiters
- **Large Files**: Memory-efficient parsing

### 2. Integration Tests

#### Modern CLI Tests (`run_modern_tests.js`)
- **Command Structure**: Tests `run`, `vis`, `all` commands
- **Data Types**: Australian formats, dates, numeric, categorical
- **Error Scenarios**: Empty files, invalid inputs, missing data
- **Performance**: Large file handling, timeouts
- **Configuration**: Config management system
- **User Experience**: Help system, progressive workflows

#### Legacy Tests (`run_tests.js`)
- **Backward Compatibility**: Old command structure
- **Output Validation**: Expected sections and formatting
- **Edge Cases**: File not found, invalid formats

### 3. Performance Tests

#### Benchmarks
- **Large Files**: Tests with 10,000+ row datasets
- **Memory Usage**: Monitors heap allocation
- **Execution Time**: Tracks command duration
- **Scalability**: Tests sampling and streaming

## Test Data (Fixtures)

### Core Test Files
- `test_sales.csv` - Basic sales data
- `insurance.csv` - Complex business data
- `australian_data.csv` - Australian-specific formats (postcodes, phones)
- `missing_values.csv` - Data quality testing
- `large_numeric.csv` - Numeric analysis testing

### Edge Cases
- `empty.csv` - Empty file handling
- `edge_case_date_formats.csv` - Multiple date formats
- `quoted_commas_test.csv` - Complex CSV parsing
- `semicolon_test.csv` - Alternative delimiters

## Writing New Tests

### Adding Unit Tests
1. Create test file in `tests/unit/`
2. Import test utilities and modules
3. Use assert functions for validation
4. Follow existing patterns

Example:
```javascript
function testNewFeature() {
  console.log(chalk.blue('\n=== Testing New Feature ==='));
  
  const result = myNewFunction(testData);
  assert(result.success, 'Function succeeds');
  assertEqual(result.value, expected, 'Returns expected value');
}
```

### Adding Integration Tests
1. Add test suite to `TEST_SUITES` in `run_modern_tests.js`
2. Define expected patterns for validation
3. Include performance constraints if needed

Example:
```javascript
newFeature: {
  name: 'New Feature Tests',
  tests: [
    { 
      command: 'run', 
      file: 'test_data.csv', 
      expectedPatterns: ['expected', 'output'],
      maxDuration: 5000 
    }
  ]
}
```

## Test Validation

### Output Validation
Tests validate command output by checking for:
- Expected sections and headers
- Specific patterns in output
- Proper formatting (separators, structure)
- Error messages for failure scenarios

### Performance Validation
- Maximum execution time limits
- Memory usage thresholds
- Output size constraints

## CI/CD Integration

The test suite is designed for continuous integration:

```bash
# CI script example
npm install
npm run build
npm test

# Exit codes
# 0 - All tests passed
# 1 - One or more tests failed
```

## Debugging Tests

### Verbose Output
Set environment variables for debugging:
```bash
NODE_ENV=development npm test     # Show stack traces
FORCE_COLOR=1 npm test            # Force colored output
```

### Running Individual Tests
```bash
# Run specific unit test
node tests/unit/test_columnDetector.js

# Run specific integration test
node tests/run_modern_tests.js
```

### Common Issues

1. **Import Errors**: Ensure all paths use proper ES module syntax
2. **Timeout Failures**: Increase timeout for slow systems
3. **Encoding Issues**: Check test data file encoding
4. **Memory Errors**: Use `--max-old-space-size` for large tests

## Test Coverage Goals

### Current Coverage
- ✅ Core commands (run, vis, all)
- ✅ Column type detection
- ✅ Error handling & recovery
- ✅ CSV parsing edge cases
- ✅ Australian data formats
- ✅ Performance & scalability
- ✅ Configuration system

### Future Improvements
- [ ] More edge case CSV formats
- [ ] Internationalization testing
- [ ] Stress testing with very large files
- [ ] Network error simulation
- [ ] Multi-platform testing

## Contributing

When adding new features:
1. Write unit tests first (TDD approach)
2. Add integration tests for CLI changes
3. Update test documentation
4. Ensure all tests pass before PR
5. Add test data files to fixtures/ if needed

## Performance Benchmarks

Current benchmarks (M1 Mac):
- Small file (< 100 rows): < 500ms
- Medium file (1K rows): < 1s
- Large file (10K rows): < 5s
- Very large file (100K rows): < 30s with sampling

Memory usage targets:
- Small files: < 50MB heap
- Large files: < 500MB heap with sampling
- Streaming mode: Constant memory regardless of file size