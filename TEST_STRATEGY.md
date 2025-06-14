# DataPilot Test Strategy

## Overview
Complete rebuild of test suite focusing on **user value**, **performance**, and **reliability**.

## Core Testing Philosophy

### ✅ What We WILL Test
- **User-facing behavior** - CLI commands produce correct analysis
- **Statistical accuracy** - Mathematical computations are correct  
- **Data pipeline integrity** - Section dependencies work properly
- **Error handling** - Graceful failure with helpful messages
- **Performance characteristics** - Streaming works efficiently
- **Output formats** - Markdown/JSON/YAML are valid and complete

### ❌ What We WON'T Test  
- Implementation details (private methods, internal state)
- External libraries (Jest, Commander, etc.)
- Node.js built-ins (fs, path, etc.)
- Infrastructure concerns (CI, deployment)

## Test Architecture

### 📊 Test Pyramid (Target: Sub-10s total execution)

```
        E2E Tests (10%)           - 2-3 tests, full CLI workflows
       ==================
      Integration Tests (20%)     - 15-20 tests, component interactions  
     ========================
    Unit Tests (70%)              - 80-100 tests, pure business logic
   ============================
```

## Test Categories

### 1. Unit Tests (70% of tests, <5s total)

**Core Statistical Functions**
```
src/analyzers/statistical/
├── descriptive-stats.test.ts     - mean, median, std dev accuracy
├── correlation-analysis.test.ts  - Pearson, Spearman calculations
├── distribution-tests.test.ts    - normality, outlier detection
└── type-detection.test.ts        - data type inference accuracy
```

**Data Processing Logic**  
```
src/parsers/
├── csv-detector.test.ts          - delimiter/encoding detection
├── csv-parser.test.ts            - parsing accuracy with edge cases
└── data-validator.test.ts        - validation rules and error messages
```

**Business Logic Analyzers**
```
src/analyzers/
├── section1-analyzer.test.ts     - metadata extraction accuracy
├── section2-analyzer.test.ts     - quality metrics calculation
├── section3-analyzer.test.ts     - EDA statistical computations
├── section4-analyzer.test.ts     - visualization recommendations
├── section5-analyzer.test.ts     - engineering insights logic
└── section6-analyzer.test.ts     - modeling suggestions
```

**Output Formatting**
```
src/formatters/
├── markdown-formatter.test.ts    - valid markdown generation
├── json-formatter.test.ts        - valid JSON structure
└── yaml-formatter.test.ts        - valid YAML structure
```

### 2. Integration Tests (20% of tests, <3s total)

**Pipeline Integration**
```
tests/integration/
├── section-dependencies.test.ts  - data flows between sections
├── configuration-loading.test.ts - config file precedence
├── memory-management.test.ts      - resource cleanup validation
└── error-propagation.test.ts     - error handling across components
```

**Multi-file Analysis**
```
tests/integration/
├── join-analysis.test.ts          - relationship detection accuracy
└── cross-file-validation.test.ts - consistency across datasets
```

### 3. E2E Tests (10% of tests, <2s total)

**CLI Workflows**
```
tests/e2e/
├── full-analysis.test.ts          - `datapilot all sample.csv`
├── output-formats.test.ts         - all format options work
└── error-scenarios.test.ts        - invalid files, bad args
```

## Test Data Strategy

### Golden Dataset Library
```
tests/fixtures/
├── canonical/
│   ├── iris.csv              - 150 rows, 4 numeric, 1 categorical
│   ├── sales.csv             - 1000 rows, mixed types, dates
│   └── employees.csv         - 500 rows, joins, missing values
├── edge-cases/
│   ├── empty.csv             - completely empty
│   ├── single-row.csv        - header + 1 data row
│   ├── unicode.csv           - international characters
│   ├── malformed.csv         - inconsistent columns
│   └── huge-simulation.csv   - programmatically generated large data
└── expected-outputs/
    ├── iris.analysis.json    - known correct analysis results
    ├── sales.analysis.json   - regression testing baselines
    └── employees.analysis.json
```

## Test Quality Standards

### Performance Requirements
- **Unit tests**: <50ms each, <5s total
- **Integration tests**: <200ms each, <3s total  
- **E2E tests**: <1s each, <2s total
- **Total test suite**: <10s end-to-end

### Coverage Requirements
- **Line coverage**: 85%+ (meaningful coverage, not just percentage)
- **Branch coverage**: 80%+ (test decision points)
- **Function coverage**: 90%+ (test public interfaces)
- **Critical path coverage**: 100% (core analysis pipeline)

### Quality Gates
- Zero flaky tests (deterministic, repeatable)
- Zero console output during test runs
- No external dependencies (filesystem, network)
- Tests pass in any order (no interdependencies)

## Mocking Strategy

### What to Mock
- **File System**: Use in-memory strings instead of real files
- **Large Datasets**: Generate small synthetic data with same statistical properties
- **External Libraries**: Mock only at boundaries (hyparquet, exceljs)
- **System Resources**: Mock memory/performance monitoring

### What NOT to Mock
- **Core Business Logic**: Test actual statistical calculations
- **Standard Library**: Don't mock Math, Array methods, etc.
- **Internal Dependencies**: Test real component interactions

## Implementation Plan

### Phase 1: Foundation (Week 1)
1. Create test fixtures with golden datasets
2. Set up Jest configuration with proper thresholds
3. Build core unit tests for statistical functions
4. Implement fast CSV parsing tests

### Phase 2: Business Logic (Week 2)  
1. Test each section analyzer in isolation
2. Validate statistical accuracy with known datasets
3. Test error handling and edge cases
4. Build formatter tests for all output types

### Phase 3: Integration (Week 3)
1. Test section dependencies and data flow
2. Validate configuration system
3. Test memory management and cleanup
4. Build multi-file analysis tests

### Phase 4: E2E & Polish (Week 4)
1. Build CLI workflow tests
2. Performance optimization and validation
3. Documentation and examples
4. CI/CD integration with proper gates

## Success Metrics

### Quantitative
- Test execution time: <10s total
- Coverage: 85%+ lines, 80%+ branches  
- Zero flaky tests over 100 runs
- CI passes 99%+ of the time

### Qualitative  
- Tests are readable and maintainable
- New features can be tested easily
- Debugging is straightforward when tests fail
- Confidence in refactoring and changes

## Technology Stack

### Testing Framework
- **Jest**: Test runner and assertion library
- **@types/jest**: TypeScript support
- **jest-circus**: Modern test runner
- **fast-check**: Property-based testing for statistical functions

### Test Utilities
- **Custom matchers**: toBeCloseToStatistic(), toHaveValidMarkdown()
- **Data generators**: createSyntheticDataset(), generateCSV()
- **Mock factories**: mockFileSystem(), mockMemoryManager()

## File Organization

```
tests/
├── unit/                      - Mirrors src/ structure
│   ├── analyzers/
│   ├── parsers/
│   ├── formatters/
│   └── utils/
├── integration/               - Cross-component tests
├── e2e/                       - Full CLI workflows  
├── fixtures/                  - Test data and golden masters
├── helpers/                   - Test utilities and matchers
└── __mocks__/                 - Module mocks
```

This strategy prioritizes **speed**, **reliability**, and **user value** while maintaining comprehensive coverage of critical functionality.