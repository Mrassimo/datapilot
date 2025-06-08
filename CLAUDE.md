# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

**Building and Development:**
```bash
npm run build          # Compile TypeScript to dist/
npm run dev            # Watch mode compilation
npm run clean          # Remove dist directory
npm run typecheck      # Type checking without emitting files
```

**Testing:**
```bash
npm test               # Run all tests
npm run test:watch     # Watch mode testing
npm run test:coverage  # Generate coverage report (90% threshold)
jest --testPathPattern="section1"  # Run specific section tests
```

**Linting:**
```bash
npm run lint           # ESLint checking
npm run lint:fix       # Auto-fix linting issues
```

**Integration Testing:**
```bash
node test-quality-enhancements.js  # Test quality analysis features
node test-sections-456.js         # Test sections 4-6 individually
```

## Architecture Overview

DataPilot is a streaming statistical computation engine built around a **6-section analysis pipeline**:

1. **Section 1 (Overview)**: File metadata, parsing detection, structural analysis
2. **Section 2 (Quality)**: Data quality assessment, missing values, outliers, duplicates  
3. **Section 3 (EDA)**: Streaming univariate/bivariate statistical analysis
4. **Section 4 (Visualization)**: Chart selection, aesthetic optimization, accessibility
5. **Section 5 (Engineering)**: Schema optimization, feature engineering, ML readiness
6. **Section 6 (Modeling)**: Algorithm selection, model validation, deployment strategy

### Core Architecture Patterns

**Streaming Processing**: All analyzers use streaming/chunked processing to handle arbitrarily large datasets within constant memory bounds. The `StreamingAnalyzer` is the foundation for sections 2-3.

**Analyzer-Formatter Pattern**: Each section follows the pattern:
- `SectionXAnalyzer`: Core analysis logic with `.analyze()` method
- `SectionXFormatter`: Output formatting with `.format()` method  
- `types.ts`: TypeScript interfaces for results and configurations

**Dependency Chain**: Sections depend on previous results:
- Section 2-6 require Section 1 (metadata)
- Section 3-6 require Section 2 (quality assessment)
- Section 4-6 require Section 3 (statistical analysis)
- Section 5-6 may cross-reference each other

**Memory Management**: The `globalMemoryManager` and `globalResourceManager` provide automatic cleanup and resource monitoring across all analyzers.

### Key Subsystems

**CSV Processing** (`src/parsers/`):
- `CSVDetector`: Auto-detection of encoding, delimiters, headers
- `CSVParser`: Streaming parser with configurable options
- `CSVStateMachine`: Handles complex CSV edge cases

**Error Handling** (`src/utils/error-handler.ts`):
- `DataPilotError` types with severity and category classification
- `globalErrorHandler` for centralized error management
- Contextual error reporting with file/line information

**Configuration System** (`src/core/config.ts`):
- Centralized thresholds and performance settings
- Environment-specific configurations via `.datapilotrc`
- Runtime adaptive configuration based on data characteristics

### CLI Integration

The CLI (`src/cli/`) orchestrates the full pipeline:
- `ArgumentParser`: Command-line argument processing
- `ProgressReporter`: Real-time progress updates with memory monitoring
- `OutputManager`: Handles multiple output formats (markdown, JSON, etc.)

**Configuration Loading**: Uses `.datapilotrc` files with environment overrides, aliases, and presets. See `.datapilotrc.example` for full structure.

## Testing Patterns

**Unit Tests**: Located in `tests/` with same directory structure as `src/`
- Use Jest with ts-jest preset
- 90% coverage threshold enforced
- Module aliases `@/` map to `src/`

**Integration Tests**: 
- `test-quality-enhancements.js`: Validates Section 2 quality analysis with real data scenarios
- `test-sections-456.js`: Tests advanced sections individually with mock dependencies

**Test Data**: Sample CSV files in `examples/` directory for consistent testing

## Code Conventions

**Import Patterns**: Use relative imports within modules, absolute `@/` imports across major boundaries

**Error Handling**: Always use `DataPilotError` with appropriate severity and category. Wrap external errors with context.

**Logging**: Use the centralized `logger` with `LogContext` for structured logging. Include section, analyzer, and operation context.

**Type Safety**: Leverage strict TypeScript settings. Core types are in `src/core/types.ts`.

**Memory Efficiency**: Use streaming patterns, implement cleanup in `finally` blocks, and register with resource managers for automatic cleanup.

## Configuration Notes

The system supports multiple configuration layers:
1. Default values in `src/core/config.ts`
2. User config files (`.datapilotrc`)
3. Environment variables
4. Command-line arguments (highest priority)

Configuration can use presets (`low-memory`, `high-performance`, etc.) and environment-specific overrides (`production`, `development`, `ci`).

## Output Examples

Generated outputs are stored in `examples/outputs/` with comprehensive analysis reports showing the full capabilities of each section. These serve as both documentation and integration test validation.