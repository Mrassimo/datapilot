# Quality Analyzer Unit Tests

This directory contains comprehensive unit tests for the Section 2 (Quality) analyser module.

## Test Files Overview

### Core Tests
- **`section2-analyser.test.ts`** - Main orchestrator tests (existing, comprehensive)
- **`completeness-analyser.test.ts`** - Missing value detection and analysis (existing)
- **`uniqueness-analyser.test.ts`** - Duplicate detection and analysis (existing)
- **`business-rule-engine.test.ts`** - Business rule validation (existing)
- **`outlier-analyser.test.ts`** - Outlier detection tests (existing)

### New Comprehensive Tests
- **`validity-analyser.test.ts`** - Type conformance, range validation, pattern matching
- **`pattern-validation-engine.test.ts`** - Built-in patterns, custom patterns, format standardization
- **`section2-analyser-enhanced.test.ts`** - Edge cases, error handling, performance scenarios
- **`section2-integration.test.ts`** - Integration between component analysers

## Test Coverage Areas

### 1. ValidityAnalyzer Tests (`validity-analyser.test.ts`)
- **Type Conformance Analysis**: Validates data types match expected types
- **Range Conformance Analysis**: Detects numeric values outside reasonable ranges
- **Pattern Conformance Analysis**: Email, phone, URL, custom pattern validation
- **Business Rules Validation**: Cross-field and custom business rule checking
- **File Structure Validation**: Consistent column counts and header conformance
- **Overall Validity Scoring**: Composite scoring based on conformance metrics
- **Edge Cases**: Empty datasets, malformed data, special characters

### 2. PatternValidationEngine Tests (`pattern-validation-engine.test.ts`)
- **Built-in Pattern Validation**: Email, phone, SSN, credit card, URL patterns
- **Custom Pattern Validation**: User-defined regex patterns
- **Format Consistency Analysis**: Date formats, text casing, boolean representations
- **Configuration and Performance**: Pattern enabling/disabling, performance limits
- **Pattern Summary and Reporting**: Comprehensive validation reports
- **Edge Cases**: Null values, no matching patterns, special characters

### 3. Enhanced Section2Analyzer Tests (`section2-analyser-enhanced.test.ts`)
- **Edge Cases and Boundary Conditions**: Single row/column, all missing values, extreme values
- **Error Handling and Resilience**: Inconsistent rows, corrupted data, circular references
- **Performance and Scalability**: Large datasets, memory constraints, concurrent analysis
- **Configuration Edge Cases**: Invalid config values, missing sections, dimension filtering
- **Progress Tracking**: Accurate progress updates, time estimation
- **Warning Generation**: Appropriate warnings for quality issues

### 4. Integration Tests (`section2-integration.test.ts`)
- **Component Integration**: How analysers work together
- **Cross-Dimensional Impact**: How quality issues in one dimension affect others
- **Component Isolation**: Ensuring analysers work independently
- **Error Propagation**: Graceful handling of component failures
- **Performance Integration**: Coordinated performance across components

## Test Patterns and Best Practices

### Data Setup Patterns
```typescript
const data = [
  ['1', 'John', 'john@email.com', '25'],
  ['2', 'Jane', 'invalid-email', '30'],
  // ... more test data
];

const analyser = new Section2Analyzer({
  data,
  headers: ['id', 'name', 'email', 'age'],
  columnTypes: [DataType.INTEGER, DataType.STRING, DataType.STRING, DataType.INTEGER],
  rowCount: data.length,
  columnCount: 4
});
```

### Assertion Patterns
```typescript
// Quality score validation
expect(result.qualityAudit.cockpit.compositeScore.score).toBeGreaterThanOrEqual(0);
expect(result.qualityAudit.cockpit.compositeScore.score).toBeLessThanOrEqual(100);

// Specific dimension checks
expect(result.qualityAudit.completeness.datasetLevel.totalMissingValues).toBe(expectedCount);
expect(result.qualityAudit.uniqueness.exactDuplicates.count).toBeGreaterThanOrEqual(1);

// Configuration and error handling
expect(() => analyser.analyse()).not.toThrow();
```

### Performance Testing
```typescript
const start = Date.now();
const result = await analyser.analyse();
const duration = Date.now() - start;

expect(duration).toBeLessThan(5000); // 5 seconds max
expect(result.performanceMetrics.totalAnalysisTime).toBeGreaterThan(0);
```

## Running Tests

### Individual Test Files
```bash
npm test -- tests/unit/quality/validity-analyser.test.ts
npm test -- tests/unit/quality/pattern-validation-engine.test.ts
npm test -- tests/unit/quality/section2-analyser-enhanced.test.ts
npm test -- tests/unit/quality/section2-integration.test.ts
```

### Existing Quality Tests
```bash
npm test -- tests/unit/quality/section2-analyser.test.ts
npm test -- tests/unit/quality/completeness-analyser.test.ts
npm test -- tests/unit/quality/uniqueness-analyser.test.ts
```

### All Quality Tests (Memory Intensive)
```bash
npm test -- tests/unit/quality/ --maxWorkers=1
```

## Test Implementation Notes

### Expected Test Failures
Some new tests may fail initially because they were written based on expected API behavior rather than current implementation. This is intentional and helps identify:
1. API inconsistencies that need addressing
2. Missing functionality that should be implemented
3. Behavioral differences between expected and actual implementation

### Memory Considerations
- Enhanced tests include large datasets for performance testing
- Use `--maxWorkers=1` to reduce memory usage
- Consider running test files individually for memory-constrained environments

### Integration with Existing Tests
- New tests complement existing quality tests
- Follow the same patterns and conventions as existing tests
- Use the same test data helpers and utilities where available

## Coverage Goals

The comprehensive test suite aims to achieve:
- **Functional Coverage**: All quality dimensions and analysis types
- **Edge Case Coverage**: Boundary conditions, error scenarios, malformed data
- **Performance Coverage**: Large datasets, memory constraints, timing requirements
- **Integration Coverage**: Component interactions, data flow, error propagation
- **Configuration Coverage**: Valid/invalid configs, dimension filtering, customisation

## Future Enhancements

Consider adding tests for:
- Real-world dataset scenarios
- Industry-specific validation patterns
- Multi-language and international data
- Streaming data analysis
- External reference integration
- Advanced statistical quality metrics