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
npm run test:coverage  # Generate coverage report (current: ~80%+ working tests)
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

**Enhanced Engineering Analysis:**
```bash
datapilot eng file.csv                    # Single file: normal Section 5 analysis
datapilot eng customers.csv orders.csv    # Multi-file: Section 5 + relationship analysis
datapilot eng *.csv --confidence 0.8      # Analyse all CSV files with custom confidence
```

## Architecture Overview

DataPilot is a streaming statistical computation engine built around a **6-section analysis pipeline**:

1. **Section 1 (Overview)**: File metadata, parsing detection, structural analysis
2. **Section 2 (Quality)**: Data quality assessment, missing values, outliers, duplicates  
3. **Section 3 (EDA)**: Streaming univariate/bivariate statistical analysis
4. **Section 4 (Visualisation)**: Chart selection, aesthetic optimisation, accessibility
5. **Section 5 (Engineering)**: Schema optimisation, feature engineering, ML readiness, **multi-file relationship analysis**
6. **Section 6 (Modeling)**: Algorithm selection, model validation, deployment strategy

### Core Architecture Patterns

**Streaming Processing**: All analysers use streaming/chunked processing to handle arbitrarily large datasets within constant memory bounds. The `StreamingAnalyser` is the foundation for sections 2-3.

**Analyser-Formatter Pattern**: Each section follows the pattern:
- `SectionXAnalyser`: Core analysis logic with `.analyse()` method
- `SectionXFormatter`: Output formatting with `.format()` method  
- `types.ts`: TypeScript interfaces for results and configurations

**Dependency Chain**: Sections depend on previous results:
- Section 2-6 require Section 1 (metadata)
- Section 3-6 require Section 2 (quality assessment)
- Section 4-6 require Section 3 (statistical analysis)
- Section 5-6 may cross-reference each other

**Memory Management**: The `globalMemoryManager` and `globalResourceManager` provide automatic cleanup and resource monitoring across all analysers.

### Key Subsystems

**CSV Processing** (`src/parsers/`):
- `CSVDetector`: Auto-detection of encoding, delimiters, headers
- `CSVParser`: Streaming parser with configurable options
- `CSVStateMachine`: Handles complex CSV edge cases

**Error Handling** (`src/utils/error-handler.ts`):
- `DataPilotError` types with severity and category classification
- `globalErrorHandler` for centralised error management
- Contextual error reporting with file/line information

**Configuration System** (`src/core/config.ts`):
- Centralised thresholds and performance settings
- Environment-specific configurations via `.datapilotrc`
- Runtime adaptive configuration based on data characteristics

### CLI Integration

The CLI (`src/cli/`) orchestrates the full pipeline:
- `ArgumentParser`: Command-line argument processing
- `ProgressReporter`: Real-time progress updates with memory monitoring
- `OutputManager`: Handles multiple output formats (markdown, JSON, etc.)

**Configuration Loading**: Uses `.datapilotrc` files with environment overrides, aliases, and presets. See `.datapilotrc.example` for full structure.

## Testing Patterns

**Current Test Status**: 
- ✅ **1041+ tests passing** with comprehensive coverage
- ✅ **TypeScript compilation**: Clean, no errors
- ✅ **ESLint**: Clean code quality
- ✅ **Core modules tested**: Overview, Quality, Parsers, CLI, Utils
- ⚠️ **Interface evolution**: Some legacy tests removed during modernisation

**Unit Tests**: Located in `tests/` with same directory structure as `src/`
- Use Jest with ts-jest preset
- ~80%+ working coverage across core modules
- Module aliases `@/` map to `src/`

**Integration Tests**: 
- `test-quality-enhancements.js`: Validates Section 2 quality analysis with real data scenarios
- `test-sections-456.js`: Tests advanced sections individually with mock dependencies

**Test Data**: Sample CSV files in `examples/` directory for consistent testing

## Code Conventions

**Import Patterns**: Use relative imports within modules, absolute `@/` imports across major boundaries

**Error Handling**: Always use `DataPilotError` with appropriate severity and category. Wrap external errors with context.

**Logging**: Use the centralised `logger` with `LogContext` for structured logging. Include section, analyser, and operation context.

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


# Using Gemini CLI for Large Codebase Analysis

When analysing large codebases or multiple files that might exceed context limits, use the Gemini CLI with its massive
context window. Use `gemini -p` to leverage Google Gemini's large context capacity.

## File and Directory Inclusion Syntax

Use the `@` syntax to include files and directories in your Gemini prompts. The paths should be relative to WHERE you run the
  gemini command:

### Examples:

**Single file analysis:**
gemini -p "@src/main.py Explain this file's purpose and structure"

Multiple files:
gemini -p "@package.json @src/index.js Analyse the dependencies used in the code"

Entire directory:
gemini -p "@src/ Summarise the architecture of this codebase"

Multiple directories:
gemini -p "@src/ @tests/ Analyse test coverage for the source code"

Current directory and subdirectories:
gemini -p "@./ Give me an overview of this entire project"

# Or use --all_files flag:
gemini --all_files -p "Analyse the project structure and dependencies"

Implementation Verification Examples

Check if a feature is implemented:
gemini -p "@src/ @lib/ Has dark mode been implemented in this codebase? Show me the relevant files and functions"

Verify authentication implementation:
gemini -p "@src/ @middleware/ Is JWT authentication implemented? List all auth-related endpoints and middleware"

Check for specific patterns:
gemini -p "@src/ Are there any React hooks that handle WebSocket connections? List them with file paths"

Verify error handling:
gemini -p "@src/ @api/ Is proper error handling implemented for all API endpoints? Show examples of try-catch blocks"

Check for rate limiting:
gemini -p "@backend/ @middleware/ Is rate limiting implemented for the API? Show the implementation details"

Verify caching strategy:
gemini -p "@src/ @lib/ @services/ Is Redis caching implemented? List all cache-related functions and their usage"

Check for specific security measures:
gemini -p "@src/ @api/ Are SQL injection protections implemented? Show how user inputs are sanitised"

Verify test coverage for features:
gemini -p "@src/payment/ @tests/ Is the payment processing module fully tested? List all test cases"

When to Use Gemini CLI

Use gemini -p when:
- Analysing entire codebases or large directories
- Comparing multiple large files
- Need to understand project-wide patterns or architecture
- Current context window is insufficient for the task
- Working with files totaling more than 100KB
- Verifying if specific features, patterns, or security measures are implemented
- Checking for the presence of certain coding patterns across the entire codebase

Important Notes

- Paths in @ syntax are relative to your current working directory when invoking gemini
- The CLI will include file contents directly in the context
- No need for --yolo flag for read-only analysis
- Gemini's context window can handle entire codebases that would overflow Claude's context
- When checking implementations, be specific about what you're looking for to get accurate results