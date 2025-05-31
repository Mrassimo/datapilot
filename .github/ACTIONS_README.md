# GitHub Actions Workflows

## CI Workflow (.github/workflows/ci.yml)
- Tests on Windows, macOS, and Ubuntu
- Tests Node.js 18.x and 20.x
- Runs comprehensive test suite
- Tests safe knowledge base features
- Validates CLI help functionality
- Tests core EDA and Engineering analysis

## TUI Tests (.github/workflows/tui-tests.yml)  
- Tests Terminal UI on all platforms
- Includes PowerShell tests for Windows
- Uploads test artifacts and reports
- Generates consolidated cross-platform report

## Test Files Required:
- tests/run_all_tests.js - Main test runner
- tests/test_safe_knowledge_base.js - Safety feature tests
- tests/fixtures/*.csv - Test data files
- tests/tui/*.test.js - TUI specific tests

## Validation:
Run `node validate_workflow.js` to check all requirements are met.
