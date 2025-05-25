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

### Available CLI Commands
- `all` - Complete analysis suite (runs all commands)
- `eda` - Exploratory Data Analysis with statistics
- `int` - Data Integrity Check
- `vis` - Visualization Recommendations
- `eng` - Data Engineering Archaeology (persistent learning)
- `llm` - LLM Context Generation

## Architecture

### Project Structure
- **ES Modules**: Uses `"type": "module"` - all imports must use ES6 syntax
- **Entry Point**: `bin/datapilot.js` - Commander.js CLI setup
- **Commands**: `/src/commands/` - Each command is a separate module exporting an async function
- **Utilities**: `/src/utils/` - Shared functionality (parser, stats, format, output, knowledgeBase)
- **Tests**: Custom test framework in `/tests/run_tests.js` - no external testing library

### Key Architectural Patterns

1. **Command Pattern**: Each command exports an async function that receives parsed data and options:
```javascript
export async function commandName(data, headers, filePath, options) {
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