# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development Commands
```bash
# Install dependencies
npm install

# Run the CLI tool
node bin/datapilot.js <command> <csv_file>

# Run tests (comprehensive test suite)
node tests/run_tests.js

# Global installation
npm install -g datapilot
```

### Available CLI Commands (3-Command Structure)
- `run` - Comprehensive analysis (combines EDA + INT + LLM formatting)
- `vis` - Business Intelligence Suite (combines visualization + data engineering)
- `all` - Complete analysis suite (runs both run + vis)

### Component Commands (Internal)
The following commands are integrated into the main commands above:
- `eda` - Exploratory Data Analysis → integrated into `run`
- `int` - Data Integrity Check → integrated into `run`
- `llm` - LLM Context Generation → integrated into `run`
- `eng` - Data Engineering Archaeology → integrated into `vis`
- Original `vis` - Visualization Recommendations → integrated into new `vis`

## Architecture

### Project Structure
- **ES Modules**: Uses `"type": "module"` - all imports must use ES6 syntax
- **Entry Point**: `bin/datapilot.js` - Commander.js CLI setup
- **Commands**: `/src/commands/` - Each command is a separate module exporting an async function
- **Utilities**: `/src/utils/` - Shared functionality (parser, stats, format, output, knowledgeBase)
- **Analysis Engines**: `/src/analysis/` - Shared analysis engines (edaEngine, qualityEngine, visualEngine)
- **Tests**: Custom test framework in `/tests/run_tests.js` - no external testing library

### Command Integration Architecture

The 3-command structure integrates multiple analysis components:

1. **`run` Command** integrates:
   - EDA analysis (via edaComprehensive from eda/index.js)
   - INT analysis (via comprehensiveIntegrityAnalysis from int/index.js)
   - LLM-optimized formatting (inline formatting)
   - Shared data parsing and column type detection

2. **`vis` Command** integrates:
   - Visualization analysis (via visualize from vis/index.js)
   - Engineering analysis (via engineering from eng.js)
   - Knowledge base persistence (via KnowledgeBase utility)

3. **`all` Command**:
   - Sequentially runs `run` then `vis`
   - Shares parsed data between commands for efficiency
   - Provides comprehensive output with both analyses

### Key Architectural Patterns

1. **Command Pattern**: Each command exports an async function:
```javascript
// Main commands (run.js, vis.js)
export async function commandName(filePath, options) {
  // Implementation
}

// Component commands (still available internally)
export async function componentCommand(filePath, options) {
  // Implementation
}
```

2. **Streaming CSV Parser**: Uses csv-parse for memory-efficient processing of large files

3. **Data Engineering Archaeology System** (`eng` command):
   - Persistent YAML knowledge base at `~/.datapilot/warehouse_knowledge.yml`
   - Tracks table metadata, relationships, patterns, and technical debt
   - Builds collective intelligence across analyses
   - LLM feedback loop for continuous improvement

4. **Australian Data Awareness**: Built-in recognition for AU formats (postcodes, phones, states)

5. **Output Strategy**: All commands produce verbose, LLM-optimized text output that can be:
   - Displayed in terminal with formatting
   - Saved to file with `--output` flag
   - Copied directly to AI assistants

### Testing Approach
- Comprehensive integration tests against fixture files
- Tests all commands with various CSV formats
- Performance testing with large files (10,000 rows)
- Edge case testing (empty files, missing values, delimiter detection)
- No mocking - tests run against actual command implementations

## Development Workflow
- push to git after a major task is complete and tested
- when pushing to git, update npm