
# DataPilot Test Report
Generated: 2025-05-25T10:50:08.164Z

## Summary
- Total Tests: 38
- Passed: 33
- Failed: 5
- Success Rate: 86.8%

## Test Matrix
| File | eda | int | vis | eng | llm |
|------|-----|-----|-----|-----|-----|
| test_sales.csv | ✓ | ✓ | ✓ | ✓ | ✓ |
| insurance.csv | ✓ | ✓ | ✓ | ✓ | ✓ |
| analytical_data_australia_final.csv.csv | ✓ | ✓ | ✓ | ✓ | ✓ |
| australian_data.csv | ✓ | ✓ | ✓ | ✓ | ✓ |
| missing_values.csv | ✓ | ✓ | ✓ | ✓ | ✓ |
| large_numeric.csv | ✓ | ✓ | ✓ | ✓ | ✓ |
| empty.csv | ✓ | ✓ | ✓ | ✓ | ✓ |


## Errors
- eda - empty.csv: Missing section: DATASET OVERVIEW
- int - empty.csv: Missing section: DATA QUALITY METRICS
- vis - empty.csv: Missing section: RECOMMENDED VISUALISATIONS
- eng - empty.csv: Missing section: SCHEMA RECOMMENDATIONS
- llm - empty.csv: Missing section: DATASET SUMMARY FOR AI ANALYSIS

## Coverage
- Commands tested: eda, int, vis, eng, llm
- Files tested: test_sales.csv, insurance.csv, analytical_data_australia_final.csv.csv, australian_data.csv, missing_values.csv, large_numeric.csv, empty.csv
- Edge cases: Tested
- Performance: Tested with 10,000 row file
