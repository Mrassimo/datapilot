# DataPilot Repository Cleanup Plan

## Current Issues Identified

### 📁 Root Directory Clutter
**Problems:**
- Multiple test output files scattered in root: `llm_output.txt`, `int_output.txt`, etc.
- Redundant installation scripts: `DataPilot-UI.bat`, `datapilot.bat`, `datapilot_global.bat`
- Temporary test report files: `bug_test_report_*.json`, `tui_test_report_*.json`
- Legacy test files: `bug_analysis_and_tests.js`, `run_all_comprehensive_tests.js`
- Duplicate executable scripts: `datapilot` (Unix) vs `datapilot.bat` (Windows)

### 📄 Documentation Sprawl
**Problems:**
- Multiple README files in different locations
- Redundant installation guides: `INSTALLATION.md`, `EASY_INSTALL.md`
- Scattered feature docs in `/docs/` with inconsistent naming
- Test-specific docs mixed with user docs

### 🧪 Test Organization Issues
**Problems:**
- Test outputs mixed with test source files
- Multiple test runners: `run_tests.js`, `run_tui_tests.js`, `tui_interactive_tests.js`
- Benchmark data in separate directory from benchmarks
- Legacy test files not cleaned up

### 💻 Source Code Structure Issues  
**Problems:**
- Backup files in production: `ui_original.js`, `ui_performance_fix.js`
- Duplicate utilities: `format.js`, `unifiedFormat.js`, `standardParser.js`
- Empty directories: `src/commands/int/utils/`
- Inconsistent module organization

### 🗂️ Data File Confusion
**Problems:**
- Test data in multiple locations: `/tests/fixtures/`, `/test_data/`, `/tests/benchmark_data/`
- Temporary output files not gitignored

## Proposed Clean Structure

```
datapilot/
├── 📁 .github/
│   └── workflows/
├── 📁 bin/                        # Executable scripts only
│   └── datapilot.js
├── 📁 docs/                       # Consolidated documentation
│   ├── README.md                  # Main documentation
│   ├── installation/
│   │   ├── README.md             # Installation guide
│   │   ├── windows.md            # Windows-specific
│   │   ├── macos.md              # macOS-specific
│   │   └── linux.md              # Linux-specific
│   ├── features/
│   │   ├── eda.md                # EDA feature docs
│   │   ├── integrity.md          # INT feature docs
│   │   ├── visualization.md      # VIS feature docs
│   │   ├── engineering.md        # ENG feature docs
│   │   └── llm.md                # LLM feature docs
│   ├── development/
│   │   ├── contributing.md
│   │   ├── architecture.md
│   │   └── testing.md
│   └── releases/
│       └── v1.1.0.md             # Release notes
├── 📁 scripts/                   # Installation & utility scripts
│   ├── install/
│   │   ├── windows.bat
│   │   ├── macos.command
│   │   └── powershell.ps1
│   └── build/
│       └── rollup.config.js
├── 📁 src/                       # Clean source code
│   ├── commands/                 # Command implementations
│   │   ├── eda/
│   │   ├── int/
│   │   ├── vis/
│   │   ├── eng/
│   │   ├── llm/
│   │   ├── ui/                   # TUI components
│   │   │   ├── engine.js         # TUI engine
│   │   │   └── interface.js      # UI rendering
│   │   └── index.js              # Command exports
│   └── utils/                    # Core utilities
│       ├── parser.js
│       ├── format.js
│       ├── stats.js
│       ├── output.js
│       └── knowledgeBase.js
├── 📁 tests/                     # All test files
│   ├── unit/                     # Unit tests
│   ├── integration/              # Integration tests
│   ├── tui/                      # TUI-specific tests
│   │   ├── engine.test.js
│   │   ├── flow.test.js
│   │   └── automation.test.js
│   ├── fixtures/                 # Test data
│   ├── benchmarks/              # Performance tests
│   │   ├── data/
│   │   └── scripts/
│   ├── outputs/                 # Test outputs (gitignored)
│   └── reports/                 # Test reports (gitignored)
├── 📁 temp/                     # Temporary files (gitignored)
├── 📄 package.json
├── 📄 README.md                 # Project overview
├── 📄 CHANGELOG.md              # Version history
└── 📄 CLAUDE.md                 # Development guidance
```

## Cleanup Actions Required

### 1. File Movements
- Move installation scripts to `/scripts/install/`
- Consolidate documentation to `/docs/`
- Clean up backup/duplicate files
- Organize test files properly

### 2. File Deletions
- Remove temporary output files
- Delete obsolete backup files
- Clean up redundant utilities
- Remove empty directories

### 3. Import Updates
- Update all import paths after moves
- Test all functionality after cleanup
- Update documentation references

### 4. .gitignore Updates
- Add `/temp/` directory
- Add `/tests/outputs/`
- Add `/tests/reports/`
- Add all temporary file patterns

## Benefits After Cleanup
- ✅ Clear separation of concerns
- ✅ Easier navigation for new developers
- ✅ Reduced repository size
- ✅ Better CI/CD performance
- ✅ Professional project structure
- ✅ Easier maintenance

## Implementation Priority
1. **High**: Remove clutter from root directory
2. **High**: Organize source code structure  
3. **Medium**: Consolidate documentation
4. **Medium**: Reorganize test files
5. **Low**: Update build scripts