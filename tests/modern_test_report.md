# DataPilot Modern Test Report
Generated: 2025-06-03T01:55:17.529Z

## Summary
- **Total Tests**: 21
- **Passed**: 19
- **Failed**: 2
- **Skipped**: 0
- **Success Rate**: 90.5%

## Suite Results
### basic
- Passed: 3/3
- Failed: 0
- Skipped: 0

### dataTypes
- Passed: 2/3
- Failed: 1
- Skipped: 0

### errorHandling
- Passed: 1/2
- Failed: 1
- Skipped: 0

### performance
- Passed: 3/3
- Failed: 0
- Skipped: 0

### formats
- Passed: 2/2
- Failed: 0
- Skipped: 0

### configuration
- Passed: 2/2
- Failed: 0
- Skipped: 0

### edgeCases
- Passed: 2/2
- Failed: 0
- Skipped: 0

### ux
- Passed: 4/4
- Failed: 0
- Skipped: 0

## Performance Metrics
- **Average Test Duration**: 4255ms
- **Slowest Tests**:
  - all large_test.csv --timeout 180000: 26780ms
  - large file memory: 26547ms
  - run large_test.csv: 25922ms
  - run semicolon_test.csv: 278ms
  - run test_sales.csv: 200ms

## Failures
### dataTypes > run large_numeric.csv
```
Missing expected pattern: "float"
```

### errorHandling > run missing_values.csv
```
Missing expected pattern: "null"
```


## Test Coverage
- **Commands**: run, vis, all
- **Data Types**: Australian formats, dates, numeric, categorical
- **Edge Cases**: Empty files, missing values, invalid inputs
- **Performance**: Large file handling, memory usage
- **User Experience**: Help system, progressive workflows
- **Configuration**: Config management, settings validation
