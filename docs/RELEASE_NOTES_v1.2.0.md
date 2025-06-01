# DataPilot v1.2.0 Release Notes

## 🚀 Major Features & Bug Fixes Release

DataPilot v1.2.0 is now available on NPM! This release includes comprehensive bug fixes for 14 GitHub issues and introduces the highly requested **multiple file selection in TUI**.

### 📦 Installation
```bash
npm install -g datapilot@1.2.0
# or
npm install -g datapilot@latest
```

### ✨ New Features

#### 🔥 Multiple File Selection in TUI (Issue #15)
- **Checkbox interface** for selecting multiple CSV files in Terminal UI
- **Visual indicators** (☐/✅) with real-time selection feedback
- **Batch analysis processing** with combined results output
- **Directory navigation** with multi-file selection capabilities
- **Feature parity** with CLI multi-file support in user-friendly interface

**How to use:**
1. `datapilot ui` → Guided Analysis → "📁 Browse for Multiple Files"
2. Navigate directories and toggle file selection with checkboxes
3. Choose analysis type and process multiple files in batch
4. Get unified results with clear per-file breakdown

### 🐛 Major Bug Fixes

#### Windows Compatibility (Issues #2, #8, #9)
- ✅ **Fixed missing figlet dependency** causing startup crashes
- ✅ **Windows Unicode display** now shows clean ASCII output instead of corrupted characters
- ✅ **PATH installation helper** provides clear guidance for Windows users
- ✅ **Post-install script** automatically helps configure environment

#### Performance & Data Handling (Issues #10, #12, #13)
- ✅ **Large file performance** - reduced sampling threshold from 50MB to 2MB
- ✅ **Mixed data type support** - EDA now handles datetime, text, and numeric columns
- ✅ **ALL command crash fix** - resolved outputHandler undefined error
- ✅ **Smart sampling** triggers automatically for files >2MB

#### User Experience (Issues #5, #11, #14)
- ✅ **TUI navigation fixes** - file browser no longer gets stuck
- ✅ **Progress indicators** - real-time feedback during analysis
- ✅ **UI copy functionality** - proper result capture and display in TUI
- ✅ **Demo mode fixes** - resolved encoding and file corruption issues

### 🛠️ Technical Improvements

#### Enhanced Error Handling
- Robust error recovery across all commands
- Better encoding detection with meaningful error messages
- Graceful degradation when components fail
- Comprehensive input validation

#### Windows Support
- Automatic platform detection with ASCII fallback
- Windows-specific installation helpers
- Compatible output formatting across all terminals
- Improved PATH configuration guidance

#### Performance Optimizations
- Lower memory usage for large file processing
- Smarter sampling algorithms
- Better progress tracking and user feedback
- Optimized data type detection

### 🧪 Testing & Quality

#### Comprehensive Test Coverage
- 15+ new test scripts covering all fix scenarios
- Multi-file selection end-to-end testing
- Windows compatibility verification
- Performance regression testing
- UI navigation and flow testing

#### Backward Compatibility
- All existing functionality preserved
- Single file analysis unchanged
- CLI commands work exactly as before
- No breaking changes for current users

### 📊 Resolved GitHub Issues

**Critical Fixes:**
- #2: Missing figlet dependency causing crashes
- #8: Unicode/encoding corruption on Windows  
- #13: ALL command crashes with ReferenceError
- #12: EDA fails on datasets with mixed data types

**High Priority:**
- #9: Windows npm global install PATH issues
- #10: Performance issues with large files (>2MB)
- #14: TUI file browser navigation gets stuck
- #15: Multiple file selection in TUI (NEW FEATURE)

**Enhancements:**
- #5: UI copy functionality issues
- #11: Missing progress indicators
- #4: Demo mode encoding errors

### 🎯 What's Next

DataPilot now provides:
- **Robust Windows support** with clean, readable output
- **Powerful multi-file analysis** through both CLI and TUI
- **Professional-grade performance** for real-world datasets
- **Comprehensive error handling** for production use
- **Enhanced user experience** with progress feedback

### 📈 Adoption Notes

This release significantly improves DataPilot's:
- **Enterprise readiness** with robust error handling
- **Cross-platform compatibility** especially for Windows users  
- **User experience** with multi-file batch processing
- **Performance** for larger datasets and mixed data types
- **Accessibility** through improved TUI navigation

### 🙏 Acknowledgments

Special thanks to the community for reporting detailed issues and providing comprehensive test scenarios. This release addresses every reported issue and adds the most requested feature.

---

**Full Changelog**: https://github.com/Mrassimo/datapilot/compare/v1.1.6...v1.2.0  
**NPM Package**: https://www.npmjs.com/package/datapilot  
**Documentation**: https://github.com/Mrassimo/datapilot#readme